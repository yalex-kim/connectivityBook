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

// ---------------------------------------------------------------- 02 hci
{
  const src = read('hci'), line = (k) => src.slice(src.indexOf(k), src.indexOf('\n', src.indexOf(k)));
  const prelude = ['  const CMD =', '  const EVT =', '  const LESUB =', '  const le =', '  const hexLE =', '  const CMD_FIELDS ='].map(line).join('\n');
  const f = load('hci', ['splitOpcode', 'parseH4', 'fields', 'simulateFlow'], prelude);
  const SB = (s) => H([...s.matchAll(/"([^"]*)"/g)].map((m) => m[1].replace(/#.*/, '')).join(' '));
  // [Vol 6] Part C §1의 HCI 바이트(매개변수)에 머리말을 붙인 것 → 사양 주석의 값이 나오는가
  const bytes = SB(src.slice(src.indexOf('const SAMPLE = [') + 16, src.indexOf('].join("\\n");', src.indexOf('const SAMPLE = ['))));
  const r = f.parseH4(bytes);
  ok(!r.error && r.packets.length === 6, 'sample stream splits into 6 packets');
  const [enc, ltkReq, ltkRep, encr, cc, acl] = r.packets;
  eq([enc.opcode, enc.ogf, enc.ocf, enc.params.length], [0x2019, 0x08, 0x019, 0x1c], 'LE_Enable_Encryption header (length 0x1C)');
  eq(f.fields(enc).map((x) => x[1]), ['0x0800', '0xabcdef1234567890', '0x2474', '0x4c68384139f574d836bcf34e9dfb01bf'], 'LE_Enable_Encryption fields = spec annotations');
  eq([ltkReq.code, ltkReq.sub, ltkReq.params.length], [0x3e, 0x05, 0x0d], 'LTK_Request event (length 0x0D, subevent 0x05)');
  eq(f.fields(ltkReq).slice(1).map((x) => x[1]), ['0x0801', '0xabcdef1234567890', '0x2474'], 'LTK_Request fields');
  eq([ltkRep.opcode, ltkRep.params.length, f.fields(ltkRep)[1][1]], [0x201a, 0x12, '0x4c68384139f574d836bcf34e9dfb01bf'], 'LTK_Request_Reply (length 0x12)');
  eq([encr.opcode, encr.params.length], [0x2017, 0x20], 'LE_Encrypt (length 0x20)');
  eq([cc.code, cc.params.length], [0x0e, 0x14], 'Command_Complete (length 0x14)');
  eq(f.fields(cc).map((x) => x[1]), [2, '0x2017 (HCI_LE_Encrypt)', '0x00', '0x99ad1b5226a37e3e058e3b8e27c2c666'], 'Command_Complete fields = spec (Num 0x02, opcode 0x2017, SK)');
  eq([acl.handle, acl.pb, acl.bcOrTs, acl.length], [0x800, 0, 0, 0x1b], 'ACL header: handle 0x0800, length 0x001B');
  // opcode 분해와 이름 (사양에서 확인한 OCF와 OGF)
  eq(f.splitOpcode(0x0c03), { ogf: 3, ocf: 3 }, 'Reset = OGF 0x03, OCF 0x003');
  for (let op = 0; op < 65536; op += 97) { const s = f.splitOpcode(op); eq((s.ogf << 10) | s.ocf, op, 'opcode round trip ' + op); }
  ok(src.includes('0x20a4: "HCI_LE_Set_Event_Mask [v2]"') && src.includes('0x1010: "HCI_Read_Local_Supported_Commands [v2]"') && src.includes('0x2060: "HCI_LE_Read_Buffer_Size [v2]"'), '[v2] opcodes ([Vol 4] Part E §7.8.1, §7.4.2, §7.8.2)');
  // 잘린 스트림은 그 패킷에서 멈춘다
  const cut = f.parseH4(bytes.slice(0, -1)); ok(cut.error && cut.packets.length === 5, 'truncated stream stops at last packet');
  ok(f.parseH4([0x07, 1, 2]).error, 'unknown indicator rejected');
  // 흔한 초기화 예시의 길이가 맞는가
  const init = SB(src.slice(src.indexOf('const INIT = [') + 14, src.indexOf('].join("\\n");', src.indexOf('const INIT = [')))); 
  const ri = f.parseH4(init); ok(!ri.error && ri.packets.length === 12, 'init example parses (12 packets)');
  // 크레딧 모델: 보낸 수 ≤ 한도, 맡긴 수 ≤ 버퍼, 보고가 매 이벤트면 min(버퍼, 한도)
  for (let b = 1; b <= 16; b++) for (let p = 1; p <= 8; p++) for (let n = 1; n <= 6; n++) {
    const s = f.simulateFlow(b, p, n, 60);
    ok(s.sent.every((x) => x <= p) && s.credit.every((c) => c <= b), `flow bounds b${b} p${p} n${n}`);
    if (n === 1) close(s.avg, Math.min(b, p), 1e-9, `flow steady state b${b} p${p}`);
    ok(s.avg <= Math.min(p, b / 1) + 1e-9 && s.avg >= Math.min(p, b / n) - 1e-9 - p / 60 * n, `flow between b/n and min(b,p) b${b} p${p} n${n}`);
  }
}

// ---------------------------------------------------------------- 03 scheduling
{
  const f = load('scheduling', ['eventMap', 'rebaseOnWrap', 'latencyOk', 'schedule']);
  // 사양 §4.5.1의 예: factor 3, continuation 0, latency 6 → 21번째 이벤트마다
  const m = f.eventMap(64, 3, 0, 0, 6, () => false);
  eq(m.filter((x) => x.peripheralRx).map((x) => x.e), [0, 21, 42, 63], 'spec example: listen every 21st event');
  eq(m.filter((x) => x.kind === 'S').length, 22, 'S events every 3rd');
  // 그림 4.43·4.44: factor 5, base 0 / base 2
  eq(f.eventMap(15, 5, 0, 0, 0, () => false).filter((x) => x.kind === 'S').map((x) => x.e), [0, 5, 10], 'Fig 4.43 (base 0)');
  eq(f.eventMap(15, 5, 2, 0, 0, () => false).filter((x) => x.kind === 'S').map((x) => x.e), [2, 7, 12], 'Fig 4.44 (base 2)');
  // 사양의 base 동치 예: factor 100이면 base 42, 6942, 65442가 같은 S(이벤트 24242)
  for (const b of [42, 6942, 65442]) ok((((24242 - b) % 100) + 100) % 100 === 0, 'base equivalence ' + b);
  // 연속 이벤트: factor 5, cont 2, 데이터가 S(10)에서 오가면 11, 12가 C
  const c = f.eventMap(20, 5, 0, 2, 0, (e) => e === 10);
  eq(c.filter((x) => x.kind === 'C').map((x) => x.e), [11, 12], 'continuation after data at S');
  ok(c.filter((x) => x.kind === 'C').every((x) => x.peripheralRx && x.centralTx), 'C events: both active');
  // 지연으로 페리페럴이 듣지 않은 S에서는 데이터가 오가지 않고 C도 없다
  const L = f.eventMap(20, 5, 0, 2, 1, (e) => e === 5);
  ok(!L[5].peripheralRx && L.filter((x) => x.kind === 'C').length === 0, 'no exchange at latency-skipped S');
  // 무작위로 규칙 성질: C는 cont 범위 안, 연속 L은 latency 이하
  for (let t = 0; t < 300; t++) {
    const F = 1 + (t % 12), B = t % F, C = (t * 7) % F, Lt = t % 9, mm = f.eventMap(200, F, B, C, Lt, (e) => (e * 31 + t) % 7 === 0);
    let run = 0, worst = 0; mm.forEach((x) => { if (x.kind === 'S') { if (x.latencySkip) { run++; worst = Math.max(worst, run); } else run = 0; } });
    ok(worst <= Lt, `consecutive skipped S ≤ latency (F${F} L${Lt})`);
    ok(mm.every((x, i) => x.kind !== 'C' || mm.slice(Math.max(0, i - C), i).some((y) => y.exchanged)), `C only after exchange within cont (F${F} C${C})`);
  }
  // 카운터가 넘칠 때 base: base + K·factor − 65536 ∈ [0, 65535]이고 S 간격이 유지된다
  for (const [b, F] of [[65530, 7], [42, 100], [65535, 500], [0, 1]]) { const nb = f.rebaseOnWrap(b, F); ok(nb >= 0 && nb < 65536 && (((nb - (b - 65536)) % F) + F) % F === 0, `rebase ${b}/${F} → ${nb}`); }
  // 제약
  ok(f.latencyOk(7.5, 3, 6, 1000) && !f.latencyOk(7.5, 100, 5, 32000) && !f.latencyOk(50, 3, 6, 2000), 'latency constraints (≤ 500 and < timeout/2)');
  // 스케줄러 모델: 실행한 회차끼리 겹치지 않는다. 같은 간격이면 고정 우선순위에서 B가 굶고, 굶은 만큼 올리면 번갈아 이긴다
  const tasks = (pa, pb) => [{ name: 'A', period: pa, dur: 4, prio: 4 }, { name: 'B', period: pb, dur: 4, prio: 3, offset: 1 }, { name: '광고', period: 100, dur: 3, prio: 2, offset: 2 }];
  for (let pa = 6; pa <= 80; pa += 7) for (let pb = 6; pb <= 80; pb += 9) for (const rule of ['fixed', 'starve']) {
    const r = f.schedule(tasks(pa, pb), 1000, rule), okRuns = r.runs.filter((x) => x.ok && !x.background).sort((x, y) => x.t - y.t);
    ok(okRuns.every((x, i) => i === 0 || okRuns[i - 1].t + okRuns[i - 1].dur <= x.t), `no overlap ${pa}/${pb}/${rule}`);
  }
  const fx = f.schedule(tasks(30, 30), 1000, 'fixed'), sv = f.schedule(tasks(30, 30), 1000, 'starve');
  ok(fx.stats.B.skipped > 30 && fx.stats.B.maxGap >= 900, 'fixed priority starves B at equal intervals');
  ok(sv.stats.B.maxGap <= 60 && sv.stats.A.maxGap <= 60, 'starvation boost alternates (gap ≤ 2 intervals)');
}

// ---------------------------------------------------------------- 04 procedures
{
  const src = read('procedures'), line = (k) => src.slice(src.indexOf(k), src.indexOf('  };\n', src.indexOf(k)) + 5);
  const f = load('procedures', ['instantState', 'instantRisk', 'windowOk', 'incompatible', 'collision', 'crc24', 'whiteningBits', 'buildCtrl', 'airBits'], line('  const PROC = {'));
  // instant 비교 (mod 65536, 32767 경계) [Vol 6] Part B §5.5.1
  eq([f.instantState(5, 0xfff0), f.instantState(0x1000, 0x1000), f.instantState(0x0ff0, 0x1000), f.instantState(0x1000 + 32766, 0x1000), f.instantState(0x1000 + 32767, 0x1000)], ['future', 'now', 'past', 'future', 'past'], 'instant mod 65536');
  eq(f.instantRisk(12, 1, 0.3).chances, 12, 'chances k=1'); eq(f.instantRisk(12, 6, 0.3).chances, 2, 'chances k=6'); close(f.instantRisk(6, 1, 0.3).miss, 0.3 ** 6, 1e-12, 'miss = per^n');
  // 전송 창 [Vol 6] Part B §5.1.1
  ok(f.windowOk(0, 1.25, 30) && f.windowOk(30, 10, 30) && !f.windowOk(31.25, 1.25, 30) && !f.windowOk(0, 11.25, 30) && !f.windowOk(0, 7.5, 7.5) && f.windowOk(0, 6.25, 7.5) && !f.windowOk(1, 1.25, 30), 'transmit window ranges');
  // 충돌 [Vol 6] Part B §5.3
  eq(f.collision('C', 'phy', 'connParam', false), { action: 'rejectB', code: 0x2a }, 'central rejects (0x2A)');
  eq(f.collision('P', 'phy', 'chMap', false), { action: 'yieldToB', code: 0x2a }, 'peripheral yields');
  eq(f.collision('C', 'phy', 'phy', false).code, 0x23, 'same procedure → 0x23');
  eq(f.collision('C', 'connUpdate', 'connParam', false).code, 0x23, 'conn update vs conn param request → 0x23');
  eq(f.collision('P', 'phy', 'connUpdate', true).action, 'disconnect', 'peer already responded → disconnect');
  eq(f.collision('C', 'dataLen', 'phy', false), { action: 'both', code: null }, 'data length is compatible');
  ok(f.incompatible('frameSpace', 'cisCreate') && f.incompatible('subReq', 'rateUpdate') && !f.incompatible('subUpdate', 'feature'), 'other incompatible pairs');
  // [Vol 6] Part C §4.3.2: LL_CHANNEL_MAP_IND 완전한 패킷
  const pdu = f.buildCtrl({ op: 1, unused: [2, 5, 33, 34, 35, 36], instant: 0x4321, nesn: 0, sn: 1, md: 1, cteUs: 40 });
  const bits = (a) => a.join('').replace(/(.{8})/g, '$1 ').trim();
  const lsb = (by) => Array.from({ length: 8 }, (_, i) => (by >> i) & 1);
  eq(bits([].concat(...pdu.map(lsb))), '11011100 00010000 10100001 10000000 11011011 11111111 11111111 11111111 10000000 10000100 11000010', 'CHANNEL_MAP_IND PDU bits (Part C §4.3.2)');
  const a = f.airBits(0xAA173C42, pdu, 0xCD3F6C, 29, 40);
  eq(bits(a.body.slice(-24)), '10011100 01000111 00101001', 'CRC (Part C §4.3.2)');
  eq(bits(a.white), '01110010 10011100 00101001 10010010 10110010 00010001 11100000 00111000 11100010 00010011 00010111 10010111 00111110 11100011', 'whitened PDU+CRC');
  eq(bits(a.pre.concat(a.aa, a.white, a.cte)), '01010101 01000010 00111100 11101000 01010101 01110010 10011100 00101001 10010010 10110010 00010001 11100000 00111000 11100010 00010011 00010111 10010111 00111110 11100011 11111111 11111111 11111111 11111111 11111111', 'complete packet (Part C §4.3.2)');
  // [Vol 6] Part C §4.3.1: LL 데이터 PDU (LLID 2, NESN 1, SN 0, MD 1, 01..05)
  const d = [0b10 | (1 << 2) | (1 << 4), 5, 1, 2, 3, 4, 5], b2 = f.airBits(0xAA08192B, d, 0xC4C181, 16, 0);
  eq(bits(b2.pre.concat(b2.aa, b2.white)), '10101010 11010100 10011000 00010000 01010101 01100011 11011001 01001010 10001100 11011011 01111101 10111001 10110010 00101111 10011000', 'LL data PDU complete packet (Part C §4.3.1)');
}

// ---------------------------------------------------------------- 05 extadv
{
  const f = load('extadv', ['auxPtr', 'extPayload', 'advPdu', 'crc24', 'whiteningBits', 'advAir', 'airUs', 'chainPlan', 'pawrCheck']);
  const bits = (a) => a.join('').replace(/(.{8})/g, '$1 ').trim(), lsb = (by) => Array.from({ length: 8 }, (_, i) => (by >> i) & 1);
  // [Vol 6] Part C §4.2.2: AUX_ADV_IND (AdvA A9AAABACADAE, DID ABC, SID E, TxPower -42, 데이터 05 07 09 0B 0D, 채널 7)
  const pl = f.extPayload({ advMode: 1, advA: H('AEADACABAAA9'), adi: { did: 0xabc, sid: 0xe }, txPower: -42, data: H('050709 0B0D') });
  const pdu = f.advPdu(7, 0, 0, pl);
  eq(bits([].concat(...pdu.map(lsb))), '11100000 00001000 01010010 10010010 01110101 10110101 00110101 11010101 01010101 10010101 00111101 01010111 01101011 10100000 11100000 10010000 11010000 10110000', 'AUX_ADV_IND PDU bits (Part C §4.2.2)');
  // 4.2.2 샘플의 완전한 패킷: 프리앰블·AA·화이트닝된 PDU까지는 일치. 샘플의 CRC는 본문 규칙(0x555555, Part B §3.1.1)이 아니라 0x515555로 계산한 값과 같다(샘플 불일치를 기록)
  const W422 = '01010101 01101011 01111101 10010001 01110001 00011100 01111110 01111011 11101111 00100101 00000010 10101001 01111001 10010100 00100000 11101100 11000110 01101001 11101101 11011101 01010011 00101000 01011100 01001001 00111110 11010100';
  const mine = bits(f.advAir(pdu, 7)), n = 40 + pdu.length * 8, cut = (x) => x.replace(/ /g, '').slice(0, n);
  eq(cut(mine), cut(W422), 'AUX_ADV_IND preamble, AA and whitened PDU (Part C §4.2.2)');
  ok(mine !== W422 && bits(f.advAir(pdu, 7, 0x515555)) === W422, 'Part C §4.2.2 sample CRC matches CRCInit 0x515555, not 0x555555 (sample inconsistency)');
  eq(f.crc24(pdu, 0x515555), 0b000110111100010001110101, 'sample CRC value');
  // [Vol 6] Part C §4.2.1: 레거시 ADV_NONCONN_IND (TxAdd 1, AdvA C1A2A3A4A5A6, 01 02 03, 채널 38)
  const leg = f.advPdu(2, 1, 0, H('A6A5A4A3A2C1').concat([1, 2, 3]));
  eq(bits(f.advAir(leg, 38)), '01010101 01101011 01111101 10010001 01110001 00101001 00110011 01000111 10100001 10111111 10111110 11000010 01110010 01011000 11100101 00110101 11110111 11110011 10100101', 'ADV_NONCONN_IND complete packet (Part C §4.2.1)');
  // AuxPtr: 245,700 µs 미만은 30 µs 단위
  const ap = (b) => b[0] | (b[1] << 8) | (b[2] << 16);
  const a1 = ap(f.auxPtr(12, 1500, 0, 0)); eq([a1 & 0x3f, (a1 >> 7) & 1, (a1 >> 8) & 0x1fff], [12, 0, 50], 'AuxPtr 1500 µs → 30 µs × 50');
  const a2 = ap(f.auxPtr(3, 300000, 1, 2)); eq([a2 & 0x3f, (a2 >> 6) & 1, (a2 >> 7) & 1, (a2 >> 8) & 0x1fff, (a2 >> 21) & 7], [3, 1, 1, 1000, 2], 'AuxPtr 300 ms → 300 µs × 1000');
  // 체인 계획: 1650바이트, 페이로드 ≤ 255, 데이터 합 = n
  for (const n of [0, 1, 245, 246, 400, 1000, 1650]) {
    const c = f.chainPlan(n, '1m'), data = c.aux.reduce((s, p, i) => s + p - (i ? 4 : 10) - (i < c.aux.length - 1 ? 3 : 0), 0);
    ok(c.aux.every((p) => p <= 255) && data === n, 'chain carries all data within 255 ' + n);
  }
  eq(f.chainPlan(1650, '1m').aux.length, 7, '1650 bytes on 1M → 7 aux PDUs');
  ok(f.chainPlan(1650, 's8').auxUs / f.chainPlan(1650, '1m').auxUs > 7 && f.chainPlan(1650, 's8').totalUs > 100000, 'Coded S=8 ~8x, >100 ms');
  // PAwR 규칙 [Vol 6] Part B §4.4.2.2.4
  const good = { interval: 1000, subevents: 50, subInterval: 20, slotDelay: 5, slotSpacing: 0.5, slots: 25 };
  ok(f.pawrCheck(good).every((x) => x[1]), 'PAwR good design');
  ok(!f.pawrCheck({ ...good, subevents: 129 })[1][1], '> 128 subevents');
  ok(!f.pawrCheck({ ...good, slots: 40 })[6][1], 'slot spacing > (subInterval - delay)/slots');
  ok(!f.pawrCheck({ ...good, subevents: 51 })[3][1], 'subevents overflow interval');
  ok(!f.pawrCheck({ ...good, subInterval: 320 })[2][1] && !f.pawrCheck({ ...good, slotSpacing: 0.2 })[5][1], 'ranges');
}

// ---------------------------------------------------------------- 10 l2cap
{
  const f = load('l2cap', ['kframes', 'kframeBytes', 'segment', 'reconfigureOk', 'rxCheck']);
  eq(f.kframes(600, 200), [200, 200, 200, 2], 'SDU 600 / MPS 200 → 4 K-frames (first carries SDU length)');
  for (let t = 0; t < 400; t++) {
    const sdu = 1 + ((t * 977) % 4000), mps = 23 + ((t * 131) % 490), k = f.kframes(sdu, mps);
    ok(k.every((p) => p <= mps) && k.reduce((a, b) => a + b, 0) === sdu + 2 && k.length === Math.ceil((sdu + 2) / mps), `K-frames ≤ MPS and carry SDU+2 (${sdu}/${mps})`);
  }
  eq(f.kframeBytes(0x0040, [0xaa, 0xbb], 300), [4, 0, 0x40, 0, 0x2c, 0x01, 0xaa, 0xbb], 'K-frame bytes: length, CID, SDU length (LE)');
  const s = f.segment(1000, 247, 251, 251); eq([s.kframes, s.hci, s.ll], [5, 5, 5], 'MPS 247 + 4 = 251 fits one LL PDU');
  eq(f.segment(1000, 247, 251, 27).ll, 41, 'LL 27: four 251-byte PDUs → 10 each, last 18 → 1');
  // ECFC 재설정 규칙 [Vol 3] Part A §7.11
  ok(f.reconfigureOk(2, 256, 128, 512, 128).ok && !f.reconfigureOk(2, 256, 128, 128, 128).ok && !f.reconfigureOk(2, 256, 128, 512, 96).ok && f.reconfigureOk(1, 256, 128, 512, 96).ok && !f.reconfigureOk(1, 64, 64, 64, 48).ok && !f.reconfigureOk(6, 64, 64, 64, 64).ok, 'reconfigure rules');
  // 수신 규칙 [Vol 3] Part A §3.4·§10.1
  const st = { credits: 65530, rxCredits: 1, mps: 100, mtu: 500 };
  eq(f.rxCheck(st, { type: 'credit', n: 0 }).act, '무시', 'zero credit IND ignored');
  eq(f.rxCheck(st, { type: 'credit', n: 6 }).act, '끊기', 'credit > 65535 → disconnect');
  eq(f.rxCheck({ ...st, rxCredits: 0 }, { type: 'k', payload: 10 }).act, '끊기', 'K-frame with zero credits → disconnect');
  eq(f.rxCheck(st, { type: 'k', payload: 101 }).act, '끊기', 'payload > MPS → disconnect');
  eq(f.rxCheck(st, { type: 'k', payload: 50, first: true, sduLen: 501 }).act, '끊기', 'SDU > MTU → disconnect');
  eq(f.rxCheck(st, { type: 'k', payload: 50, first: true, sduLen: 400 }).st.rxCredits, 0, 'valid K-frame consumes a credit');
}

// ---------------------------------------------------------------- 11 gatt
{
  const src = read('gatt'), line = (k) => src.slice(src.indexOf(k), src.indexOf('\n', src.indexOf(k)));
  const f = load('gatt', ['aes128', 'aesCmac', 'splitAttOpcode', 'attRoom', 'hashBytes', 'databaseHash', 'charDecl', 'robust'], line('  const SBOX =') + '\n' + line('  const FULL ='));
  eq(f.splitAttOpcode(0x52), { method: 0x12, command: 1, bit7: 0 }, 'WRITE_CMD 0x52 = command flag | write');
  eq(f.splitAttOpcode(0xd2).bit7, 1, '0xD2 (previously signed write) has bit 7');
  eq([f.attRoom('prepare', 23), f.attRoom('readRsp', 23), f.attRoom('prepare', 247)], [18, 22, 242], 'ATT room per PDU');
  eq(X(f.aesCmac(H('2b7e151628aed2a6abf7158809cf4f3c'), H('6bc1bee22e409f96e93d7e117393172a'))), '070a16b46b4d4144f79bdd9dd04a287c', 'AES-CMAC RFC 4493 ex2');
  // 사양 §7.3.1의 예: 특성 선언 값 {0x02, 0x0005, 0x2A00} → 02 05 00 00 2A
  eq(X(f.charDecl(0x02, 0x0005, 0x2a00)), '020500002a', 'characteristic declaration bytes (§7.3.1 example)');
  eq(X(f.hashBytes({ handle: 0x0004, type: 0x2803, value: f.charDecl(0x02, 0x0005, 0x2a00) })), '04000328020500002a', 'declaration: handle, type, value');
  eq(X(f.hashBytes({ handle: 0x0009, type: 0x2902, value: [1, 0] })), '09000229', 'CCCD: handle and type only');
  eq(f.hashBytes({ handle: 0x0005, type: 0x2a00, value: [1, 2, 3] }).length, 0, 'characteristic value not included');
  const db = (name, props) => [{ handle: 1, type: 0x2800, value: [0x00, 0x18] }, { handle: 2, type: 0x2803, value: f.charDecl(props, 3, 0x2a00) }, { handle: 3, type: 0x2a00, value: Array.from(new TextEncoder().encode(name)) }, { handle: 4, type: 0x2902, value: [0, 0] }];
  const h0 = X(f.databaseHash(db('A', 2)).hash);
  ok(X(f.databaseHash(db('Another name', 2)).hash) === h0, 'value change keeps hash');
  ok(X(f.databaseHash(db('A', 0x12)).hash) !== h0, 'property change changes hash');
  ok(X(f.databaseHash(db('A', 2).reverse()).hash) === h0, 'ascending handle order regardless of input order');
  eq(X(f.databaseHash(db('A', 2)).hash), X(f.aesCmac(new Array(16).fill(0), H('010000280018 02000328020300002a 04000229'))), 'hash = CMAC(0, concatenation)');
  // Robust Caching [Vol 3] Part G §2.5.2.1
  let st = { aware: true, errSent: false, hashRead: false }, r;
  r = f.robust(st, 'change'); st = r.st; ok(!st.aware, 'database change → unaware');
  r = f.robust(st, 'cmd'); ok(r.rsp.startsWith('무시'), 'command ignored while unaware');
  r = f.robust(st, 'req'); st = r.st; ok(r.rsp.includes('0x12') && !st.aware, 'first request → 0x12');
  r = f.robust(st, 'req'); st = r.st; ok(st.aware && !r.rsp.includes('0x12'), 'next request after 0x12 → aware');
  st = f.robust(st, 'change').st; st = f.robust(st, 'hash').st; ok(!st.aware, 'hash read alone does not make aware');
  r = f.robust(st, 'req'); ok(r.st.aware && !r.rsp.includes('0x12'), 'request after hash read → aware, no error');
  st = f.robust({ aware: true }, 'change').st; ok(f.robust(st, 'scCfm').st.aware, 'SC confirmation → aware (single bearer)');
}

// ---------------------------------------------------------------- 14 isoal
{
  const f = load('isoal', ['unframedParams', 'unframedPdus', 'segHeader', 'segmentableOk', 'unsegmentedMaxPdu', 'cisLatency', 'bigLatencyUnframed', 'segmentStream'], 'const MAX_DRIFT = 100e-6;');
  eq(f.unframedParams(10, 20, 100, 60), { uspi: 2, upps: 2, bn: 4 }, 'USPI 2, UPPS 2, BN 4');
  ok(f.unframedParams(7.5, 10, 40, 40) === null, '7.5 ms SDU into 10 ms ISO: unframed impossible');
  eq(f.unframedPdus(100, 40, 4).map((p) => [p.llid, p.len]), [[1, 40], [1, 40], [0, 20], [1, 0]], 'fragments + LLID + padding (§2.1)');
  eq(f.unframedPdus(0, 40, 1).map((p) => [p.llid, p.len]), [[0, 0]], 'zero-length SDU → LLID 0b00, length 0');
  eq(f.segHeader(0, 1, 43), [0b10, 43], 'segmentation header SC=0 CMPLT=1');
  // 사양 §2.2의 예: 10 ms마다 40바이트, ISO 7.5 ms, BN 1 → 비분할 Max_PDU 45
  eq(f.unsegmentedMaxPdu(10, 7.5, 1, 40), 45, 'unsegmented Max_PDU example (45)');
  ok(f.segmentableOk(1, 63, 40, 7.5, 10) && !f.segmentableOk(1, 60, 40, 7.5, 10), 'segmentable bandwidth condition (7.5 ms SDU into 10 ms needs Max_PDU ≥ 63)');
  // 지연 예 (§3.2.1·§3.2.2): 프레임 있는 경우 추가 지연 = SDU + ISO(분할) / ISO(비분할), 프레임 없는 경우 10/20 → +10 ms
  close(f.cisLatency('segmentable', 0, 1, 10, 10.6) - f.cisLatency('unframed', 0, 1, 10, 10) - 0, 20.6, 1e-9, 'segmentable adds 20.6 ms vs unframed equal-interval (10.6/10)');
  close(f.cisLatency('unsegmented', 0, 1, 10, 10.6), 10, 1e-9, 'unsegmented adds ISO interval');
  close(f.cisLatency('unframed', 0, 1, 20, 10), 10, 1e-9, 'unframed 10/20 adds 10 ms');
  close(f.bigLatencyUnframed(5, 0, 2, 1, 2, 10, 10), 5 + 10 - 10, 1e-9, 'BIG unframed simplified formula');
  // 묶기 모델: 모든 PDU ≤ Max_PDU, 대역 조건을 만족하면 밀림이 커지지 않는다, Time_Offset > 0
  for (const [si, oi, len, mp, bn] of [[7500, 10000, 40, 64, 1], [10000, 7500, 40, 45, 1], [10000, 20000, 100, 120, 2], [7500, 10000, 80, 120, 1]]) {
    const r = f.segmentStream(si, oi, len, mp, bn, 40);
    ok(r.events.every((e) => e.length === bn && e.every((p) => p.length <= mp)), `PDU ≤ Max_PDU (${si}/${oi})`);
    if (f.segmentableOk(bn, mp, len, si / 1000, oi / 1000)) ok(r.backlog <= len * 2, `no growing backlog when condition holds (${si}/${oi}): ${r.backlog}`);
    let tosOk = true; r.events.forEach((e) => e.forEach((p) => { let x = 0; while (x < p.length) { const sc = p[x] & 1, l = p[x + 1]; if (!sc) { const to = p[x + 2] | (p[x + 3] << 8) | (p[x + 4] << 16); if (!(to > 0)) tosOk = false; } x += 2 + l; } }));
    ok(tosOk, `Time_Offset positive (${si}/${oi})`);
  }
}

// ---------------------------------------------------------------- 15 leaudio
{
  const src = read('leaudio'), cut = (a) => { const i = src.indexOf(a); return src.slice(i, src.indexOf('\n  ];', i) + 5); };
  const f = load('leaudio', ['aseNext', 'aseLinkLoss', 'bitrateKbps'], cut('  const ASE_T =') + '\n' + cut('  const BAP_QOS ='));
  const T = vm.runInContext(cut('  const BAP_QOS =') + ';BAP_QOS', vm.createContext({}));
  // ASCS v1.0 Table 3.2: 정상 유니캐스트 시작 (Sink ASE)
  eq(f.aseNext('sink', 'Idle', 'Config Codec', 'client'), 'Codec Configured', 'Idle + Config Codec → Codec Configured');
  eq(f.aseNext('sink', 'Codec Configured', 'Config QoS', 'server'), null, 'Config QoS는 클라이언트만');
  eq(f.aseNext('sink', 'Codec Configured', 'Config QoS', 'client'), 'QoS Configured', 'Config QoS → QoS Configured');
  eq(f.aseNext('sink', 'QoS Configured', 'Enable', 'client'), 'Enabling', 'Enable → Enabling');
  eq(f.aseNext('sink', 'Codec Configured', 'Enable', 'client'), null, 'Enable은 QoS Configured에서만 (Table 4.6)');
  eq(f.aseNext('sink', 'Enabling', 'Receiver Start Ready', 'client'), null, 'Sink ASE의 Receiver Start Ready는 서버만 (§5.4)');
  eq(f.aseNext('sink', 'Enabling', 'Receiver Start Ready', 'server'), 'Streaming', 'Sink ASE: 서버 Receiver Start Ready → Streaming');
  eq(f.aseNext('source', 'Enabling', 'Receiver Start Ready', 'client'), 'Streaming', 'Source ASE: 클라이언트 Receiver Start Ready');
  eq(f.aseNext('sink', 'Streaming', 'Disable', 'client'), 'QoS Configured', 'Sink Streaming + Disable → QoS Configured');
  eq(f.aseNext('source', 'Streaming', 'Disable', 'server'), 'Disabling', 'Source Streaming + Disable → Disabling');
  eq(f.aseNext('source', 'Disabling', 'Receiver Stop Ready', 'client'), 'QoS Configured', 'Receiver Stop Ready → QoS Configured');
  eq(f.aseNext('source', 'Disabling', 'Receiver Stop Ready', 'server'), null, 'Receiver Stop Ready는 클라이언트만');
  eq(f.aseNext('sink', 'Disabling', 'Release', 'client'), null, 'Sink ASE에는 Disabling이 없다');
  eq(f.aseNext('sink', 'Releasing', 'Released (caching)', 'server'), 'Codec Configured', 'Released(캐시) → Codec Configured');
  eq(f.aseNext('sink', 'Releasing', 'Released (no caching)', 'client'), null, 'Released는 서버만');
  eq(f.aseNext('sink', 'Idle', 'Release', 'client'), null, 'Idle에서는 Release 불가');
  eq(f.aseLinkLoss('Streaming', 'cis'), 'QoS Configured', 'CIS 끊김 → QoS Configured (§3.2)');
  eq(f.aseLinkLoss('Disabling', 'cis'), 'QoS Configured', 'Disabling에서 CIS 끊김');
  eq(f.aseLinkLoss('QoS Configured', 'acl'), 'Releasing', 'LE-ACL 끊김 → Releasing');
  // BAP v1.0.1 Table 5.2: 32줄, 비트레이트를 SDU 크기·간격으로 다시 계산
  eq(T.length, 32, 'BAP Table 5.2는 32개 설정');
  for (const r of T) {
    ok(Math.abs(f.bitrateKbps(r[3], r[1]) - r[4]) < 0.01, `${r[0]} 비트레이트 ${r[4]} kbps`);
    eq(r[2], r[0].startsWith('441') ? 'framed' : 'unframed', `${r[0]} 프레임 방식`);
    eq(r[5], r[0].endsWith('_1') ? (r[0].startsWith('441') || r[0].startsWith('48') ? 5 : 2) : 13, `${r[0]} 재전송 수`);
  }
  eq(T.filter((r) => r[8] === 'M' && r[9] === 'M').map((r) => r[0]).join(), '16_2_1', '양쪽 필수는 16_2_1뿐');
  const q = Object.fromEntries(T.map((r) => [r[0], r]));
  eq([q['48_4_2'][1], q['48_4_2'][3], q['48_4_2'][6]].join(), '10000,120,100', '48_4_2 = 10 ms, 120옥텟, 100 ms');
  eq([q['441_1_2'][6], q['441_2_2'][6]].join(), '80,85', '44.1 kHz 높은 신뢰도 지연');
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
