// BluetoothBook 심화 사실 검증: 챕터 안의 계산 함수를 꺼내 Bluetooth Core 6.3의 시험 데이터(샘플)와, 가능하면 독립 구현(OpenSSL 등)과 맞춰 본다.
// 실행: node scripts/verify-factcheck.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, 'chapters', name + '.html'), 'utf8');
let checks = 0;
const ok = (cond, msg) => { assert(cond, msg); checks++; };
const eq = (a, b, msg) => { assert.equal(JSON.stringify(a), JSON.stringify(b), msg); checks++; };
const close = (a, b, tol, msg) => { assert(Math.abs(a - b) <= tol, `${msg}: ${a} != ${b}`); checks++; };

/** 챕터 소스에서 `  function name(`으로 시작하는 함수를 중괄호 짝으로 잘라낸다 */
function fn(src, name) {
  const start = src.indexOf('  function ' + name + '(');
  assert(start >= 0, 'function not found: ' + name);
  let i = src.indexOf('{', start), depth = 0;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}' && --depth === 0) break; }
  return src.slice(start, i + 1);
}
/** 함수 여러 개를 한 컨텍스트에 올린다 */
function load(chapter, names, prelude = '') {
  const src = read(chapter), ctx = vm.createContext({ Math, Array, Number, String });
  vm.runInContext(prelude + '\n' + names.map((n) => fn(src, n)).join('\n') + '\nthis.__f = {' + names.join(',') + '};', ctx);
  return ctx.__f;
}
const H = (s) => s.replace(/\s/g, '').match(/../g).map((x) => parseInt(x, 16));
const X = (a) => a.map((b) => b.toString(16).padStart(2, '0')).join('');
const bitsStr = (s) => s.replace(/\s/g, '').split('').map(Number);

// ==== TESTS ====

// ---------------------------------------------------------------- 06 encryption
{
  const src = read('encryption'), sbox = src.slice(src.indexOf('  const SBOX ='), src.indexOf('\n', src.indexOf('  const SBOX =')));
  const f = load('encryption', ['aes128', 'sessionKey', 'ccmNonce', 'aadByte', 'ccm', 'ccmOpen'], sbox);
  // [Vol 6] Part C §1: LTK·SKD·IV와 SK
  const ltk = H('4C68384139F574D836BCF34E9DFB01BF'), skdC = H('ACBDCEDFE0F10213'), skdP = H('0213243546576879'), iv = H('DEAFBABE' + 'BADCAB24');
  const sk = f.sessionKey(ltk, skdC, skdP);
  eq(X(sk), '99ad1b5226a37e3e058e3b8e27c2c666', 'SK = e(LTK, SKD) (Part C §1, HCI_LE_Encrypt 결과)');
  // §1.2 블록별 값 (B, X, MIC, A, S, 결과). 사양 표기 그대로 옮김
  const CASES = [
    { name: 'START_ENC_RSP1', hdr: 0x0f, dir: 1, ctr: 0, pl: '06',
      B: ['49000000008024ABDCBABEBAAFDE0001', '00010300000000000000000000000000', '06000000000000000000000000000000'],
      X: ['712eaaaae60603521d245e50786eefe4', 'debc43782a022675fca0aa6f0854f1ab', '6399913fede5fa111bdb993bbfb9be06'], mic: '6399913f',
      A: ['01000000008024ABDCBABEBAAFDE0000', '01000000008024ABDCBABEBAAFDE0001'], S: ['ae3e6577f64a8f25408c9c10d53acf8e', '99190d88f4aa1b60b97ecfe6f5fee777'], out: '9f', emic: 'CDA7F448' },
    { name: 'LL_DATA1', hdr: 0x0e, dir: 1, ctr: 1, pl: '1700636465666768696a6b6c6d6e6f7071313233343536373839 30',
      A: ['01010000008024ABDCBABEBAAFDE0000', '01010000008024ABDCBABEBAAFDE0001', '01010000008024ABDCBABEBAAFDE0002'],
      S: ['caeb7e017296dd2fa9a2ce789179501a', '6d70b50070440a9a027de8f66b6a6a29', '1ae7647c4d5e6dabdec602404c302341'],
      out: '7A70D66415226DF26B17839A060405596BD6564F796B5B9CE6FF32', emic: 'F75A6D33' },
    { name: 'LL_DATA2', hdr: 0x06, dir: 0, ctr: 1, pl: '17003736353433323130414243444546 4748494A4B4C4D4E4F5051',
      B: ['49010000000024ABDCBABEBAAFDE001B', '00010200000000000000000000000000', '17003736353433323130414243444546', '4748494A4B4C4D4E4F50510000000000'],
      X: ['714234d50d6f1da5663be3e78460ad87', '96df1d97959e6176ac215c7baf90c674', '6cc52c3dcecdc2fa81eb347887960673', 'a776a26be617366496c391e36f6374a1'], mic: 'a776a26b',
      A: ['01010000000024ABDCBABEBAAFDE0000', '01010000000024ABDCBABEBAAFDE0001', '01010000000024ABDCBABEBAAFDE0002'],
      S: ['2ecfc2e31e01875653c0f306fc7bfb96', 'e488b6d188a0faf15889e72a059902c0', 'edc470841f4140e0758c8e8f708399bd'],
      out: 'F38881E7BD94C9C369B9A66846DD4786AA8C39CE540D0DAE3ADCDF', emic: '89B96088' },
  ];
  for (const c of CASES) {
    const r = f.ccm(sk, f.ccmNonce(c.ctr, c.dir, iv), c.hdr, H(c.pl));
    if (c.B) eq(r.B.map(X), c.B.map((s) => s.toLowerCase()), c.name + ' B blocks');
    if (c.X) eq(r.X.map(X), c.X, c.name + ' X blocks');
    if (c.mic) eq(X(r.mic), c.mic, c.name + ' MIC');
    eq(r.A.map(X), c.A.map((s) => s.toLowerCase()), c.name + ' A blocks');
    eq(r.S.map(X), c.S, c.name + ' S blocks');
    eq(X(r.cipher), c.out.toLowerCase(), c.name + ' ciphertext');
    eq(X(r.encMic), c.emic.toLowerCase(), c.name + ' encrypted MIC');
    const o = f.ccmOpen(sk, f.ccmNonce(c.ctr, c.dir, iv), c.hdr, r.cipher, r.encMic);
    ok(o.ok && X(o.plain) === X(H(c.pl)), c.name + ' decrypt + MIC check');
  }
  // LL_START_ENC_RSP2 (페리페럴, 카운터 0): 07 05 a3 4c 13 a4 15
  const r2 = f.ccm(sk, f.ccmNonce(0, 0, iv), 0x07, [0x06]);
  eq(X([0x07, 5].concat(r2.cipher, r2.encMic)), '0705a34c13a415', 'START_ENC_RSP2 packet');
  // 헤더 마스크: NESN·SN·MD는 MIC에 들어가지 않고, LLID·CP는 들어간다
  for (let h = 0; h < 256; h++) eq(f.aadByte(h), h & 0b11100011, 'AAD mask ' + h);
  const base = f.ccm(sk, f.ccmNonce(5, 1, iv), 0x02, [1, 2, 3]);
  for (const h of [0x06, 0x0a, 0x12, 0x1e]) eq(X(f.ccm(sk, f.ccmNonce(5, 1, iv), h, [1, 2, 3]).encMic), X(base.encMic), 'NESN/SN/MD do not change MIC ' + h);
  for (const h of [0x01, 0x03, 0x22]) ok(X(f.ccm(sk, f.ccmNonce(5, 1, iv), h, [1, 2, 3]).encMic) !== X(base.encMic), 'LLID/CP change MIC ' + h);
  // nonce: 39비트 카운터와 방향 비트 (Table 2.1)
  eq(X(f.ccmNonce(2 ** 39 - 1, 0, iv)), 'ffffffff7f' + '24abdcbabebaafde', 'nonce max counter');
  eq(X(f.ccmNonce(0x1234567890, 1, iv)).slice(0, 10), '9078563492', 'nonce counter bits 32-38 + direction');
  // 무작위 패킷: OpenSSL AES-128-CCM(태그 4, nonce 13, AAD 1바이트)과 같은 결과인가
  const crypto = require('node:crypto');
  let seed = 7; const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647), ri = (n) => Math.floor(rnd() * n), bytes = (n) => Array.from({ length: n }, () => ri(256));
  for (let t = 0; t < 400; t++) {
    const k = bytes(16), ivr = bytes(8), hdr = ri(256), pl = bytes(1 + ri(251)), ctr = ri(2 ** 31) * 256 + ri(256), dir = ri(2), n = f.ccmNonce(ctr, dir, ivr);
    const r = f.ccm(k, n, hdr, pl);
    const ci = crypto.createCipheriv('aes-128-ccm', Buffer.from(k), Buffer.from(n), { authTagLength: 4 });
    ci.setAAD(Buffer.from([hdr & 0xe3]), { plaintextLength: pl.length });
    const ct = Buffer.concat([ci.update(Buffer.from(pl)), ci.final()]), tag = ci.getAuthTag();
    eq(X(r.cipher) + X(r.encMic), ct.toString('hex') + tag.toString('hex'), 'CCM matches OpenSSL #' + t);
    const tampered = r.cipher.slice(); tampered[ri(tampered.length)] ^= 1 << ri(8);
    ok(!f.ccmOpen(k, n, hdr, tampered, r.encMic).ok, 'tampered ciphertext fails MIC #' + t);
  }
}

// ---------------------------------------------------------------- 07 smp
{
  const src = read('smp'), line = (k) => src.slice(src.indexOf(k), src.indexOf('\n', src.indexOf(k)));
  const prelude = line('  const SBOX =') + '\nconst ascii = (s) => Array.from(s).map((c) => c.charCodeAt(0));\n' + line('  const P256 =') + '\nconst big = (a) => BigInt("0x" + (a.map((b) => b.toString(16).padStart(2, "0")).join("") || "0"));\nconst bytes32 = (v) => { const h = v.toString(16).padStart(64, "0"); return h.match(/../g).map((x) => parseInt(x, 16)); };';
  const ctx = vm.createContext({ Math, Array, Number, String, BigInt });
  const names = ['aes128', 'aesCmac', 'f4', 'f5', 'f6', 'g2', 'h6', 'h7', 'ltkToLinkKey', 'linkKeyToLtk', 'c1', 's1', 'onCurve', 'ecMul', 'publicKey', 'dhKey'];
  vm.runInContext(prelude + '\n' + names.map((n) => fn(src, n)).join('\n') + '\nthis.__f = {' + names.join(',') + '};', ctx);
  const f = ctx.__f;
  // RFC 4493 (부록 D.1)
  eq(X(f.aesCmac(H('2b7e151628aed2a6abf7158809cf4f3c'), [])), 'bb1d6929e95937287fa37d129b756746', 'CMAC D.1.1');
  eq(X(f.aesCmac(H('2b7e151628aed2a6abf7158809cf4f3c'), H('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be66c3710'))), '51f0bebf7e3b9d92fc49741779363cfe', 'CMAC D.1.4');
  const U = H('20b003d2 f297be2c 5e2c83a7 e9f9a5b9 eff49111 acf4fddb cc030148 0e359de6'), V = H('55188b3d 32f6bb9a 900afcfb eed4e72a 59cb9ac2 f19d7cfb 6b4fdd49 f47fc5fd');
  const Xk = H('d5cb8454 d177733e ffffb2ec 712baeab'), Y = H('a6e8e7cc 25a75f6e 216583f7 ff3dc4cf');
  eq(X(f.f4(U, V, Xk, 0)), 'f2c916f107a9bd1cf1eda1bea974872d', 'f4 D.2');
  const W = H('ec0234a3 57c8ad05 341010a6 0a397d9b 99796b13 b4f866f1 868d34f3 73bfa698'), A1 = H('00561237 37bfce'), A2 = H('00a71370 2dcfc1');
  const k5 = f.f5(W, Xk, Y, A1, A2);
  eq(X(k5.T), '3c128f20de88328897624bdb8dac6989', 'f5 T D.3');
  eq(X(k5.ltk), '6986791169d7cd23980522b594750a38', 'f5 LTK D.3');
  eq(X(k5.macKey), '2965f176a1084a02fd3f6a20ce636e20', 'f5 MacKey D.3');
  eq(X(f.f6(k5.macKey, Xk, Y, H('12a3343b b453bb54 08da42d2 0c2d0fc8'), H('010102'), A1, A2)), 'e3c473989cd0e8c5d26c0b09da958f61', 'f6 D.4');
  eq(f.g2(U, V, Xk, Y), 0x2f9ed5ba, 'g2 D.5'); eq(0x2f9ed5ba % 1000000, 938554, 'g2 display digits');
  eq(X(f.h6(H('ec0234a3 57c8ad05 341010a6 0a397d9b'), 'lebr')), '2d9ae102e76dc91ce8d3a9e280b16399', 'h6 D.6');
  eq(X(f.h7('tmp1', H('ec0234a3 57c8ad05 341010a6 0a397d9b'))), 'fb173597c6a3c0ecd2998c2a75a57011', 'h7 D.8');
  const ltk = H('368df9bc e3264b58 bd066c33 334fbf64'), lk = H('05040302 01000908 07060504 03020100');
  eq(X(f.ltkToLinkKey(ltk, 1)), '287ad379dca402530a39f1f43047b835', 'LTK→LK CT2=1 D.9');
  eq(X(f.ltkToLinkKey(ltk, 0)), 'bc1ca4ef633fc1bd0d8230afee388fb0', 'LTK→LK CT2=0 D.10');
  eq(X(f.linkKeyToLtk(lk, 1)), 'e85e09eb5eccb3e269418a133211bc79', 'LK→LTK CT2=1 D.11');
  eq(X(f.linkKeyToLtk(lk, 0)), 'a813fb72f1a3dfa18a2c9a43f10d0a30', 'LK→LTK CT2=0 D.12');
  // 레거시 c1·s1 (§2.2.3·§2.2.4의 예)
  eq(X(f.c1(new Array(16).fill(0), H('5783D52156AD6F0E6388274EC6702EE0'), H('07071000000101'), H('05000800000302'), 1, 0, H('A1A2A3A4A5A6'), H('B1B2B3B4B5B6'))), '1e1e3fef878988ead2a74dc5bef13b86', 'c1 example');
  eq(X(f.s1(new Array(16).fill(0), H('000F0E0D0C0B0A091122334455667788'), H('010203040506070899AABBCCDDEEFF00'))), '9a1fe1f0e8b0f49b5b4216ae796da062', 's1 example');
  // P-256: 디버그 키의 공개 키 = 부록 D의 U와 사양의 Y, OpenSSL ECDH와 같은가, 곡선 밖 키 거부
  const dbg = H('3f49f6d4 a3c55f38 74c9b3e3 d2103f50 4aff607b eb40b799 5899b8a6 cd3c1abd'), pk = f.publicKey(dbg);
  eq(X(pk.x), X(U), 'debug public key X = D.2 U'); eq(X(pk.y), 'dc809c49652aeb6d63329abf5a52155c766345c28fed3024741c8ed01589d28b', 'debug public key Y (§2.3.5.6.1)');
  const crypto = require('node:crypto');
  for (let t = 0; t < 40; t++) {
    const a = crypto.createECDH('prime256v1'), b = crypto.createECDH('prime256v1'); a.generateKeys(); b.generateKeys();
    const pa = [...a.getPublicKey()], pb = [...b.getPublicKey()], da = [...a.getPrivateKey()]; while (da.length < 32) da.unshift(0);
    eq(X(f.publicKey(da).x), X(pa.slice(1, 33)), 'publicKey matches OpenSSL #' + t);
    eq(X(f.dhKey(da, pb.slice(1, 33), pb.slice(33))), b.computeSecret(Buffer.from(pa)).toString('hex'), 'DHKey matches OpenSSL #' + t);
    ok(f.onCurve(BigInt('0x' + X(pb.slice(1, 33))), BigInt('0x' + X(pb.slice(33)))), 'peer key on curve #' + t);
    const yb = pb.slice(33); yb[31] ^= 1;
    ok(f.dhKey(da, pb.slice(1, 33), yb) === null, 'off-curve key rejected #' + t);
  }
  ok(src.includes('IO = H("0d 00 01")'), 'NC sim IOcap = AuthReq ‖ OOB ‖ IO capability (§2.2.8)');
}

// ---------------------------------------------------------------- 08 privacy
{
  const src = read('privacy'), sbox = src.slice(src.indexOf('  const SBOX ='), src.indexOf('\n', src.indexOf('  const SBOX =')));
  const f = load('privacy', ['aes128', 'ah', 'validPrand', 'makeRpa', 'resolves', 'randomKind', 'scanDecision'], sbox);
  const irk = H('ec0234a357c8ad05341010a60a397d9b');
  eq(f.ah(irk, 0x708194), 0x0dfbaa, 'ah D.7');
  eq(X(f.makeRpa(irk, 0x708194)), '7081940dfbaa', 'RPA = prand ‖ hash (D.7)');
  ok(f.validPrand(0x708194) && f.resolves(H('7081940dfbaa'), irk), 'D.7 RPA resolves');
  ok(!f.validPrand(0x400000) && !f.validPrand(0x7fffff) && !f.validPrand(0xc08194) && !f.validPrand(0x308194), 'prand rules (§1.3.2.2)');
  eq([0x00, 0x40, 0x80, 0xc0].map((b) => f.randomKind([b, 0, 0, 0, 0, 0])), ['NRPA', 'RPA', '예약됨', '정적'], 'Table 1.2 sub-types');
  // 무작위 IRK·prand 300개: 내 IRK로는 풀리고, 다른 IRK로는(거의) 풀리지 않는다. hash는 OpenSSL AES로 다시 계산
  const crypto = require('node:crypto');
  let seed = 11; const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647), bytes = (n) => Array.from({ length: n }, () => Math.floor(rnd() * 256));
  for (let t = 0; t < 300; t++) {
    const k = bytes(16), p = (1 << 22) | (Math.floor(rnd() * 0x3ffffe) + 1), a = f.makeRpa(k, p);
    const ci = crypto.createCipheriv('aes-128-ecb', Buffer.from(k), null); ci.setAutoPadding(false);
    const e = Buffer.concat([ci.update(Buffer.from(new Array(13).fill(0).concat([(p >> 16) & 255, (p >> 8) & 255, p & 255]))), ci.final()]);
    eq(X(a.slice(3)), e.slice(13).toString('hex'), 'ah = AES low 24 bits (OpenSSL) #' + t);
    ok(f.resolves(a, k) && !f.resolves(a, bytes(16)), 'resolve own / not other #' + t);
  }
  // 스캔 결정 규칙 [Vol 6] Part B §4.3.3·§4.7
  const ear = H('c41122334455'), earIrk = bytes(16), kb = H('d27766554433'), myIrk = bytes(16), my = H('001122334455');
  const cfg = (o) => Object.assign({ policy: 0, resolution: true, myIrk, myAddr: my, fal: [ear, kb], rl: [{ id: ear, peerIrk: earIrk, mode: 'net' }, { id: kb, peerIrk: new Array(16).fill(0), mode: 'net' }] }, o);
  const rpa = f.makeRpa(earIrk, 0x512345), other = f.makeRpa(bytes(16), 0x512345);
  ok(f.scanDecision({ advA: rpa, advRandom: true }, cfg({ policy: 1 })).up, 'filtered: resolved RPA → identity in FAL → up');
  ok(!f.scanDecision({ advA: rpa, advRandom: true }, cfg({ policy: 1, resolution: false })).up, 'filtered + no resolution: RPA dropped');
  ok(!f.scanDecision({ advA: ear, advRandom: true }, cfg({})).up, 'network privacy: identity address dropped');
  ok(!f.scanDecision({ advA: ear, advRandom: true }, cfg({ resolution: false })).up, 'network privacy applies with resolution disabled (§4.7)');
  ok(f.scanDecision({ advA: ear, advRandom: true }, cfg({ rl: [{ id: ear, peerIrk: earIrk, mode: 'dev' }] })).up, 'device privacy: identity address accepted');
  ok(f.scanDecision({ advA: kb, advRandom: true }, cfg({ policy: 1 })).up, 'all-zero IRK: identity accepted');
  ok(!f.scanDecision({ advA: other, advRandom: true }, cfg({ policy: 1 })).up && f.scanDecision({ advA: other, advRandom: true }, cfg({})).up, 'unknown RPA: dropped only when filtered');
  ok(f.scanDecision({ advA: rpa, advRandom: true, targetA: f.makeRpa(myIrk, 0x6abcde) }, cfg({})).up, 'directed: TargetA resolves to me → up');
  ok(f.scanDecision({ advA: rpa, advRandom: true, targetA: my }, cfg({})).up, 'directed: TargetA = my address → up');
  ok(!f.scanDecision({ advA: rpa, advRandom: true, targetA: f.makeRpa(bytes(16), 0x6abcde) }, cfg({})).up, 'directed elsewhere → dropped even unfiltered');
  ok(!f.scanDecision({ advA: rpa, advRandom: true, targetA: f.makeRpa(myIrk, 0x6abcde) }, cfg({ resolution: false })).up, 'directed to my RPA but resolution off → dropped');
}

// ---------------------------------------------------------------- 09 bigsec
{
  const src = read('bigsec'), line = (k) => src.slice(src.indexOf(k), src.indexOf('\n', src.indexOf(k)));
  const ctx = vm.createContext({ Math, Array, Number, String, TextEncoder });
  const names = ['aes128', 'aesCmac', 'h6', 'h7', 'h8', 'broadcastCode', 'bigKeys', 'bisD', 'bisDW', 'bisAA', 'saaValid', 'bisIv'];
  vm.runInContext(line('  const SBOX =') + '\nconst ascii = (s) => Array.from(s).map((c) => c.charCodeAt(0));\n' + names.map((n) => fn(src, n)).join('\n') + '\nthis.__f = {' + names.join(',') + '};', ctx);
  const f = ctx.__f;
  // [Vol 6] Part C §6: h8 샘플
  const r = f.h8(H('ec0234a3 57c8ad05 341010a6 0a397d9b'), H('1536d18d e3d20df9 9b7044c1 2f9ed5ba'), H('cc030148'));
  eq(X(r.ik), 'fe77ab4efa982991c1486a3b281fd4bc', 'h8 IK (Part C §6)'); eq(X(r.out), 'e5e5bebaae7228e722a38904ed350f6d', 'h8 (Part C §6)');
  // 방송 코드 "Børne House" → GSK ([Vol 3] Part C §3.2.6.3, [Vol 6] Part C §6)
  const code = f.broadcastCode('Børne House');
  eq(X(code), '000000006573756f4820656e72b8c342', 'Broadcast_Code representation (Part C §3.2.6.3)');
  const k = f.bigKeys(code, H('55188b3d 32f6bb9a 900afcfb eed4e72a'));
  eq(X(k.igltk), '4c0dd74c2b19aa95d89823855f1001b8', 'IGLTK'); eq(X(k.gltk), 'c4cd4b8349b5a18a02de66209017aed3', 'GLTK'); eq(X(k.gsk), 'be2a16fc7ac464e752301bccc818812c', 'GSK');
  ok(f.broadcastCode('12345678901234567') === null && f.broadcastCode('ø'.repeat(8)) !== null, 'code length ≤ 16 octets (UTF-8)');
  // [Vol 6] Part C §5 표 5.1: SAA 0x78E52493
  const T51 = [0x85E32493, 0x79D52493, 0x86752493, 0x7A572493, 0x85F12493, 0x79D32493, 0x86732493, 0x7B652493, 0x85C72493, 0x78E12493, 0x86412493, 0x7B632493, 0x85D52493, 0x78F72493, 0x86572493, 0x7B712493, 0x85D32493, 0x78C52493, 0x87652493, 0x7B472493, 0x84E12493, 0x78C32493, 0x87632493, 0x7B552493, 0x84F72493, 0x78D12493, 0x87712493, 0x7B532493, 0x84C52493, 0x79E72493, 0x87472493];
  T51.forEach((aa, i) => eq(f.bisAA(0x78E52493, i + 1), aa, 'BIS AA n=' + (i + 1)));
  eq(f.bisAA(0x78E52493, 0), 0x7A412493, 'BIG Control AA');
  eq([f.bisD(1), f.bisDW(77)], [77, 0xFD060000], 'n=1 → D=77, DW=0xFD060000 (Part B §2.1.2)');
  ok(f.saaValid(0x78E52493) && !f.saaValid(0x78652493) && !f.saaValid(0x7AE52493), 'SAA conditions (bit 23, bit 25)');
  eq(X(f.bisIv(H('0001020304050607'), 0x78E52493)), '000102037ce02294', 'BIS IV = GIV low 32 bits XOR AA');
}

// ---------------------------------------------------------------- 모든 인라인 스크립트가 문법 오류 없이 컴파일되는가, JSON-LD가 올바른가
let scripts = 0;
for (const f of ['../index.html', ...fs.readdirSync(path.join(root, 'chapters')).filter((x) => x.endsWith('.html'))]) {
  const s = fs.readFileSync(path.join(root, 'chapters', f), 'utf8');
  for (const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (m[1].includes('src=')) continue;
    if (m[1].includes('ld+json')) JSON.parse(m[2]); else new vm.Script(m[2], { filename: f });
    scripts++;
  }
}
new vm.Script(fs.readFileSync(path.join(root, 'js/common.js'), 'utf8'));
const tctx = vm.createContext({ window: {} }); vm.runInContext(fs.readFileSync(path.join(root, 'js/terms.js'), 'utf8'), tctx);
const slugs = new Set([...fs.readFileSync(path.join(root, 'js/common.js'), 'utf8').matchAll(/slug: "([\w-]+)"/g)].map((m) => m[1]));
ok(tctx.window.BD_TERMS.every((t) => t.length === 4 && slugs.has(t[3])), 'every term points to a chapter');
// 본문의 모든 .term이 용어집 항목에 이어지는가(common.js 툴팁과 같은 규칙)
{
  const norm = (x) => x.replace(/\s+/g, '').toLowerCase(), keys = new Set();
  tctx.window.BD_TERMS.forEach((t) => { [t[0], t[0].replace(/\(.*?\)/g, ''), t[1], t[1].replace(/\(.*?\)/g, '')].forEach((k) => keys.add(norm(k))); t[0].split(/[\/·]/).forEach((k) => keys.add(norm(k))); });
  const al = tctx.window.BD_TERM_ALIAS || {};
  for (const f of fs.readdirSync(path.join(root, 'chapters')).filter((x) => x.endsWith('.html'))) {
    for (const m of fs.readFileSync(path.join(root, 'chapters', f), 'utf8').matchAll(/<span class="term">([^<]+)<\/span>/g)) ok(keys.has(norm(al[m[1].trim()] || m[1])), `term "${m[1]}" in ${f} has a glossary entry`);
  }
}
// 책의 설명 흐름(CONTRIBUTING.md): 용어집을 뺀 모든 장에 비유·예측해 보기·시뮬레이터·핵심 정리·퀴즈가 있고, 문제마다 정답이 하나인가
for (const f of fs.readdirSync(path.join(root, 'chapters')).filter((x) => x.endsWith('.html') && x !== 'glossary.html')) {
  const s = fs.readFileSync(path.join(root, 'chapters', f), 'utf8');
  ok(s.includes('class="callout analogy"'), `${f} has an analogy callout`);
  ok(s.includes('class="whatif quiz-q"'), `${f} has a 예측해 보기 block`);
  ok(/class="sim[ "]/.test(s), `${f} has a simulator`);
  ok(s.includes('class="keypoints"'), `${f} has 핵심 정리`);
  ok(s.includes('class="quiz-sec"'), `${f} has a quiz`);
  for (const m of s.matchAll(/class="(?:whatif )?quiz-q"[\s\S]*?class="quiz-exp"/g)) ok((m[0].match(/data-correct/g) || []).length === 1, `${f}: every question has exactly one correct option`);
}
// 상대 링크(다른 책으로 가는 “함께 읽기” 포함)가 실제 파일로 이어지는가
for (const f of ['../index.html', ...fs.readdirSync(path.join(root, 'chapters')).filter((x) => x.endsWith('.html'))]) {
  const s = fs.readFileSync(path.join(root, 'chapters', f), 'utf8');
  for (const m of s.matchAll(/href="([^"#:${}]+)(?:#[^"]*)?"/g)) {
    let target = path.resolve(path.dirname(path.join(root, 'chapters', f)), m[1]);
    if (m[1].endsWith('/')) target = path.join(target, 'index.html');
    ok(fs.existsSync(target), `${f}: link ${m[1]} exists`);
  }
}
console.log({ checks, compiledScriptBlocks: scripts, terms: tctx.window.BD_TERMS.length });
