// BluetoothBook 사실 검증: 챕터 안의 계산 함수를 꺼내 Bluetooth Core 6.2의 값·샘플 데이터와 맞춰 본다.
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

// ---------------------------------------------------------------- 02 radio
{
  const f = load('radio', ['leFreq', 'fspl'], 'const C = 299792458;');
  // [Vol 6] Part B Table 1.3
  eq([37, 0, 10, 38, 11, 36, 39].map(f.leFreq), [2402, 2404, 2424, 2426, 2428, 2478, 2480], 'LE channel mapping');
  const all = Array.from({ length: 40 }, (_, c) => f.leFreq(c)).sort((a, b) => a - b);
  eq(all, Array.from({ length: 40 }, (_, k) => 2402 + 2 * k), '40 channels, 2 MHz spacing, 2402..2480');
  close(f.fspl(1, 2.44e9), 40.19, 0.01, 'FSPL 1 m at 2.44 GHz');
}

// ---------------------------------------------------------------- 03 phy
{
  const f = load('phy', ['fecEncode', 'patternMap', 'airtimeUs', 'berNoncoherentFsk', 'packetErrorRate']);
  // [Vol 6] Part C §2.2: FEC 부호기 PDU 입력/출력 (부호기 상태는 Access Address·CI·TERM1 뒤의 값을 이어받는다)
  const aaIn = bitsStr('0110101101111101 1001000101110001'), ciIn = [1, 0], term1 = [0, 0, 0];
  const pduIn = bitsStr('0000000011000000 0100001000110010 10100010');
  const crcIn = bitsStr('1001010001010000 01110011'), term2 = [0, 0, 0];
  const out = f.fecEncode([...aaIn, ...ciIn, ...term1, ...pduIn, ...crcIn, ...term2]);
  const expAA = bitsStr('00110101110100100111101001011011 10010000101111111000101010001111');
  eq(out.slice(0, 64), expAA, 'FEC: Access Address output (Part C §2.2)');
  eq(out.slice(64, 68), bitsStr('0101'), 'FEC: CI output (S=8)');
  eq(out.slice(68, 74), bitsStr('001100'), 'FEC: TERM1 output');
  const pduOutExp = bitsStr('00000000000000001101010011000000 00111011110011101111110101000010 0001000111111110');
  eq(out.slice(74, 74 + 80), pduOutExp, 'FEC: PDU output');
  const crcOutExp = bitsStr('00011100100001111111100001111100 0011011010000001');
  eq(out.slice(154, 154 + 48), crcOutExp, 'FEC: CRC output');
  eq(out.slice(202, 208), bitsStr('010011'), 'FEC: TERM2 output');
  eq(f.patternMap([0, 1], 8), [0, 0, 1, 1, 1, 1, 0, 0], 'pattern mapper S=8');
  // 패킷 시간: [Vol 6] Part C §2.3·§2.4 총 510 µs(S=2), 912 µs(S=8) / [Vol 6] Part B §2.1: 44~2128 µs
  eq(f.airtimeUs('s2', 5), 510, 'Coded S=2 reference packet 510 us');
  eq(f.airtimeUs('s8', 5), 912, 'Coded S=8 reference packet 912 us');
  eq(f.airtimeUs('2m', 2), 44, 'shortest uncoded packet 44 us');
  eq(f.airtimeUs('1m', 258), 2128, 'longest uncoded packet 2128 us');
  eq(f.airtimeUs('s8', 2 + 255), 17040, 'longest coded S=8 packet');
  ok(f.berNoncoherentFsk(9) / f.berNoncoherentFsk(11) > 8, 'BER grows ~10x for 2 dB');
  close(f.packetErrorRate(0.001, 376), 1 - Math.pow(0.999, 376), 1e-12, 'PER formula');
  const h = load('phy', ['idealAirtimeMs']);
  close(h.idealAirtimeMs(1e6, 7.5), 1066.67, 0.01, 'HDT preview: 1 MB at 7.5 Mb/s');
  close(h.idealAirtimeMs(1e6, 1.4), 5714.29, 0.01, 'LE 2M practical ceiling: 1 MB');
}

// ---------------------------------------------------------------- 04 hopping
{
  const f = load('hopping', ['dataChFreq', 'wifiBlocked', 'csa1Sequence', 'perm16', 'csa2Channel']);
  const chId = (0x8e89 ^ 0xbed6) & 0xffff;
  eq(chId, 0x305f, 'channelIdentifier for 0x8E89BED6');
  const all = Array(37).fill(true);
  // [Vol 6] Part C Table 3.1: 카운터 0~3 → prn_e 56857, 1685, 38301, 27475 / 채널 25, 20, 6, 21
  eq([0, 1, 2, 3].map((c) => f.csa2Channel(c, chId, all).prnE), [56857, 1685, 38301, 27475], 'CSA#2 prn_e (Table 3.1)');
  eq([0, 1, 2, 3].map((c) => f.csa2Channel(c, chId, all).ch), [25, 20, 6, 21], 'CSA#2 channels (Table 3.1)');
  // Table 3.2: 사용 채널 9, 10, 21, 22, 23, 33, 34, 35, 36 / 카운터 6~8 → 23, 9, 34
  const m2 = Array(37).fill(false); [9, 10, 21, 22, 23, 33, 34, 35, 36].forEach((c) => (m2[c] = true));
  eq([6, 7, 8].map((c) => f.csa2Channel(c, chId, m2).prnE), [10975, 5490, 46970], 'CSA#2 prn_e (Table 3.2)');
  eq([6, 7, 8].map((c) => f.csa2Channel(c, chId, m2).ch), [23, 9, 34], 'CSA#2 channels (Table 3.2)');
  eq(f.csa1Sequence(7, all, 6).map((x) => x.ch), [7, 14, 21, 28, 35, 5], 'CSA#1 (last + hop) mod 37');
  const s = f.csa1Sequence(10, m2, 37);
  ok(s.every((x) => m2[x.ch]), 'CSA#1 remaps to used channels only');
  ok(f.wifiBlocked([6]).size >= 9 && f.wifiBlocked([6]).size <= 10, 'Wi-Fi 20 MHz covers 9-10 LE channels');
}

// ---------------------------------------------------------------- 05 advertising
{
  const src = read('advertising'), ctx = vm.createContext({ Math, TextEncoder });
  vm.runInContext(['buildAdvData', 'utf8', 'advAirtimeUs', 'discoveryLatency'].map((n) => fn(src, n)).join('\n') + '\nthis.f = {buildAdvData, utf8, advAirtimeUs, discoveryLatency};', ctx);
  const f = ctx.f;
  eq(Array.from(f.buildAdvData([{ type: 1, data: [6] }, { type: 3, data: [0x0d, 0x18] }]).bytes), [2, 1, 6, 3, 3, 0x0d, 0x18], 'AD structures');
  eq(f.utf8('심박').length, 6, 'Korean UTF-8 3 bytes/char');
  eq(f.advAirtimeUs(31), 376, 'ADV_IND with 31-byte AdvData = 376 us');
  let s = 7; const rnd = () => ((s = (s * 48271) % 2147483647) / 2147483647);
  const p = { ta: 100, ts: 100, tw: 100, pkt: 0.376, gap: 0.6, limit: 60000 };
  const lat = Array.from({ length: 200 }, () => f.discoveryLatency(p, rnd));
  ok(lat.every(isFinite) && Math.max(...lat) < 1500, 'continuous scan discovers quickly');
}

// ---------------------------------------------------------------- 06 connection
{
  const f = load('connection', ['checkConnParams', 'bitsLsbFirst', 'crc24', 'whiteningBits', 'leThroughput']);
  const crcBits = (r) => Array.from({ length: 24 }, (_, i) => (r >> (23 - i)) & 1);
  // [Vol 6] Part C §4.3.1 LL 데이터 PDU
  const pdu = [2 | 4 | 16, 5, 1, 2, 3, 4, 5], c = f.crc24(pdu, 0xc4c181);
  eq(crcBits(c).join(''), '101000100000101101001011', 'CRC (Part C §4.3.1)');
  const body = [...f.bitsLsbFirst(pdu), ...crcBits(c)], w = f.whiteningBits(16, body.length);
  eq(body.map((b, i) => b ^ w[i]).join(''), '01100011110110010100101010001100110110110111110110111001101100100010111110011000', 'whitening (Part C §4.3.1)');
  // §4.2.1 ADV_NONCONN_IND, 채널 38, CRCInit 0x555555
  const adv = [0x42, 9, 0xa6, 0xa5, 0xa4, 0xa3, 0xa2, 0xc1, 1, 2, 3];
  eq(crcBits(f.crc24(adv, 0x555555)).join(''), '101101010010110111010111', 'CRC (Part C §4.2.1)');
  const ab = [...f.bitsLsbFirst(adv), ...crcBits(f.crc24(adv, 0x555555))], aw = f.whiteningBits(38, ab.length);
  eq(ab.map((b, i) => b ^ aw[i]).join(''), '0010100100110011010001111010000110111111101111101100001001110010010110001110010100110101111101111111001110100101', 'whitening (Part C §4.2.1)');
  // §2.1 LE Coded 기준 패킷: PDU 00 03 42 4C 45 → CRC 29 0A CE (전송 순서 바이트, 각 바이트 LSB 먼저)
  const cr = f.crc24([0, 3, 0x42, 0x4c, 0x45], 0x555555), cb = crcBits(cr);
  const crcBytes = [0, 1, 2].map((k) => cb.slice(8 * k, 8 * k + 8).reduce((a, b, i) => a | (b << i), 0));
  eq(crcBytes, [0x29, 0x0a, 0xce], 'CRC (Part C §2.1)');
  // 화이트닝 시퀀스 채널 0 첫 64비트 (Part C §4.1)
  eq(f.whiteningBits(0, 64).join(''), '0000001001001101001111011100001111111000111011000101001011111010', 'whitening seq ch0');
  // 연결 규칙 [Vol 6] Part B §4.5.1·§4.5.2
  eq(f.checkConnParams(7500, 0, 1, 100, false).length, 0, '7.5 ms / 0 / 100 ms valid');
  ok(f.checkConnParams(5000, 0, 1, 100, false).length > 0, '5 ms needs SCI');
  eq(f.checkConnParams(5000, 0, 1, 100, true).length, 0, '5 ms valid with SCI');
  eq(f.checkConnParams(8125, 0, 1, 100, true).length, 0, 'ECV value 8.125 ms allowed with SCI');
  ok(f.checkConnParams(8125, 0, 1, 100, false).length > 0, '8.125 ms not BCV');
  ok(f.checkConnParams(7500, 100, 5, 32000, false).length > 0, 'subrate x (latency+1) <= 500');
  eq(f.checkConnParams(375, 0, 1, 100, true).length, 0, '375 us valid with SCI');
  ok(f.checkConnParams(250, 0, 1, 100, true).length > 0, '250 us invalid');
  ok(f.checkConnParams(50000, 9, 1, 1000, false).length > 0, 'timeout must exceed (1+lat)*int*2');
  eq(f.checkConnParams(50000, 9, 1, 1010, false).length, 0, 'timeout 1010 ms ok');
  ok(f.checkConnParams(7500, 500, 1, 32000, false).length > 0, 'latency + 1 <= 500');
  // 처리량: 2M, DLE 251, MTU 247 → 244 B / 1392 us ≈ 1402 kb/s 상한
  const t = f.leThroughput({ phy: '2m', ll: 251, mtu: 247, intervalUs: 1e6, maxPerEvent: 1e9, tifs: 150, enc: false });
  eq(t.pairUs, 1392, '2M pair time');
  close(t.kbps, (244 * 8) / 1392 * 1000, 2, '2M throughput upper bound');
  const t1 = f.leThroughput({ phy: '1m', ll: 251, mtu: 247, intervalUs: 1e6, maxPerEvent: 1e9, tifs: 150, enc: false });
  close(t1.kbps, (244 * 8) / 2468 * 1000, 2, '1M throughput upper bound');
}

// ---------------------------------------------------------------- 07 gatt
{
  const f = load('gatt', ['parseHeartRate', 'longReadRoundTrips']);
  const p = f.parseHeartRate([0x16, 72, 0x00, 0x04]);
  eq([p.u16, p.contact, p.rr, p.bpm, p.rrs[0]], [false, 3, true, 72, 1], 'HR measurement parse');
  eq(f.parseHeartRate([0x01, 0x2c, 0x01]).bpm, 300, 'HR uint16');
  eq(f.longReadRoundTrips(300, 23), 14, 'read long 300 B at MTU 23');
  eq(f.longReadRoundTrips(300, 247), 2, 'read long 300 B at MTU 247');
}

// ---------------------------------------------------------------- 08 security
{
  const src = read('security');
  const sbox = src.slice(src.indexOf('  const SBOX ='), src.indexOf('\n', src.indexOf('  const SBOX =')));
  const f = load('security', ['pairingMethod', 'aes128', 'aesCmac', 'g2', 'ah'], sbox);
  // FIPS-197 C.1, RFC 4493
  eq(X(f.aes128(H('000102030405060708090a0b0c0d0e0f'), H('00112233445566778899aabbccddeeff'))), '69c4e0d86a7b0430d8cdb78070b4c55a', 'AES-128 FIPS-197');
  const k = H('2b7e151628aed2a6abf7158809cf4f3c');
  eq(X(f.aesCmac(k, [])), 'bb1d6929e95937287fa37d129b756746', 'CMAC RFC4493 ex1');
  eq(X(f.aesCmac(k, H('6bc1bee22e409f96e93d7e117393172a'))), '070a16b46b4d4144f79bdd9dd04a287c', 'CMAC RFC4493 ex2');
  eq(X(f.aesCmac(k, H('6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411'))), 'dfa66747de9ae63030ca32611497c827', 'CMAC RFC4493 ex3');
  // [Vol 3] Part H D.7 ah, D.5 g2
  eq(f.ah(H('ec0234a357c8ad05341010a60a397d9b'), 0x708194), 0x0dfbaa, 'ah sample D.7');
  const U = H('20b003d2 f297be2c 5e2c83a7 e9f9a5b9 eff49111 acf4fddb cc030148 0e359de6'), V = H('55188b3d 32f6bb9a 900afcfb eed4e72a 59cb9ac2 f19d7cfb 6b4fdd49 f47fc5fd');
  const Xk = H('d5cb8454 d177733e ffffb2ec 712baeab'), Y = H('a6e8e7cc 25a75f6e 216583f7 ff3dc4cf');
  eq(X(f.aesCmac(Xk, U.concat(V, Y))), '1536d18de3d20df99b7044c12f9ed5ba', 'AES-CMAC sample D.5');
  eq(f.g2(U, V, Xk, Y), 0x2f9ed5ba, 'g2 sample D.5');
  // Table 2.8 (행 = 응답자, 열 = 개시자), MITM 요구, OOB 없음
  const M = (i, r, sc) => f.pairingMethod(i, r, sc, false, false, true, false);
  eq(M('DisplayYesNo', 'NoInputNoOutput', true).method, 'Just Works', 'NoIO → JW');
  eq(M('DisplayYesNo', 'DisplayYesNo', true).method, '숫자 비교', 'DYN/DYN SC → NC');
  eq(M('DisplayYesNo', 'DisplayYesNo', false).method, 'Just Works', 'DYN/DYN legacy → JW');
  eq(M('KeyboardOnly', 'DisplayOnly', true).who, '응답자가 보여 주고 개시자가 입력', 'KO init / DO resp');
  eq(M('DisplayOnly', 'KeyboardOnly', true).who, '개시자가 보여 주고 응답자가 입력', 'DO init / KO resp');
  eq(M('KeyboardOnly', 'KeyboardDisplay', true).who, '응답자가 보여 주고 개시자가 입력', 'KO init / KD resp');
  eq(M('KeyboardDisplay', 'KeyboardDisplay', true).method, '숫자 비교', 'KD/KD SC → NC');
  eq(M('KeyboardDisplay', 'KeyboardDisplay', false).who, '개시자가 보여 주고 응답자가 입력', 'KD/KD legacy → PK init displays');
  eq(M('KeyboardOnly', 'DisplayOnly', false).auth, '미인증 (레거시)', 'legacy passkey unauthenticated (6.2 Table 2.8)');
  eq(f.pairingMethod('DisplayYesNo', 'DisplayYesNo', true, true, false, true, true).method, 'OOB', 'SC: one-sided OOB');
  eq(f.pairingMethod('DisplayYesNo', 'DisplayYesNo', false, true, false, true, true).method, 'Just Works', 'legacy: one-sided OOB falls back to IO table (DYN/DYN → JW)');
  eq(f.pairingMethod('KeyboardDisplay', 'DisplayOnly', true, false, false, false, false).method, 'Just Works', 'no MITM → JW');
}

// ---------------------------------------------------------------- 09 power
{
  const f = load('power', ['windowWideningUs']);
  close(f.windowWideningUs(500, 2e6), 1016, 1e-9, '2 s at 500 ppm → 1 ms + 16 us (Part B §4.2.2 note)');
}

// ---------------------------------------------------------------- 10 audio
{
  const f = load('audio', ['requiredAirFraction', 'cisDelivery']);
  close(f.cisDelivery(0.2, 3, 1, 1), 1 - 0.008, 1e-12, 'CIS delivery NSE=3');
  close(f.requiredAirFraction(256, 1000, 0.5), 0.512, 1e-12, 'air fraction');
}

// ---------------------------------------------------------------- 11 location
{
  const src = read('location');
  const f = load('location', ['rssiToDistance', 'aoaAngle', 'pbrDistance'], 'const C = 299792458;');
  const csLine = src.slice(src.indexOf('  const CS_FREQS'), src.indexOf('\n', src.indexOf('  const CS_FREQS')));
  const ctx = vm.createContext({}); vm.runInContext(csLine + '\nthis.F = CS_FREQS;', ctx);
  eq(ctx.F.length, 72, '72 CS channels ([Vol 6] Part A §2)');
  ok(!ctx.F.some((x) => [2402e6, 2426e6, 2480e6].includes(x)), 'CS channels avoid advertising channels');
  close(f.rssiToDistance(-79, -59, 2), 10, 1e-9, 'RSSI distance');
  close(f.aoaAngle(Math.PI * Math.sin(Math.PI / 6), 0.5, 1), Math.PI / 6, 1e-12, 'AoA at d = λ/2');
  const freqs = ctx.F.slice(0, 21), x = 3.7, ph = freqs.map((fr) => (-4 * Math.PI * x * fr) / 299792458);
  close(f.pbrDistance(freqs, ph), x, 1e-6, 'PBR slope distance');
  close(299792458 / (2 * 1e6), 149.9, 0.1, 'd_wrap = 150 m');
}

// ---------------------------------------------------------------- 12 mesh
{
  const f = load('mesh', ['floodSimulate']);
  const nodes = [0, 8, 16, 24].map((x) => ({ x, y: 0, relay: true }));
  eq(Array.from(f.floodSimulate(nodes, 10, 5).hop), [0, 1, 2, 3], 'flood chain hops');
  eq(Array.from(f.floodSimulate(nodes, 10, 2).hop), [0, 1, 2, -1], 'TTL limits relaying');
}

// ---------------------------------------------------------------- 13 coexistence
{
  const f = load('coexistence', ['filterRejection', 'channelGap', 'tddPeriods', 'within', 'usablePairs', 'wciChar', 'inactivityMs'],
    'const TDD = { 0: "DSUUUDSUUU", 1: "DSUUDDSUUD", 2: "DSUDDDSUDD", 3: "DSUUUDDDDD", 4: "DSUUDDDDDD", 5: "DSUDDDDDDD", 6: "DSUUUDSUUD" };');
  // [Vol 1] Part A §7.4: 순수 TDM에서 5 ms 프레임은 슬롯 쌍 4개 중 1개, 10 ms는 8개 중 1개만 남는다(경계 하나)
  const best = (periods, frame) => { let b = 0; for (let o = 0; o < 1250; o += 5) b = Math.max(b, f.usablePairs(periods, frame, o, 'pure').filter((p) => p.ok).length); return b; };
  eq(best([[0, 2500, 'D'], [2500, 5000, 'U']], 5000), 1, 'pure TDM 5 ms frame: 1 of 4 pairs survive');
  eq(best([[0, 5000, 'D'], [5000, 10000, 'U']], 10000), 1, 'pure TDM 10 ms frame: 1 of 8 pairs survive');
  ok(f.usablePairs([[0, 2500, 'D'], [2500, 5000, 'U']], 5000, 0, 'none').every((p) => p.ok), 'uncoordinated: all pairs used');
  eq(f.tddPeriods(1).reduce((a, p) => a + (p[1] - p[0]), 0), 10000, 'TDD frame sums to 10 ms');
  // [Vol 7] Part C Table 3.1·3.4·3.10
  eq(f.wciChar(0, [0, 1, 0, 0, 0]), 0x10, 'WCI-2 real-time MWS_RX → b4');
  eq(f.wciChar(3, [1, 1, 1, 1, 1]), 0xfb, 'WCI-2 type 3 DURATION 31');
  eq(f.inactivityMs(31), Infinity, 'DURATION 31 = infinite');
  eq(f.inactivityMs(0), 0, 'DURATION 0 = cancel');
  eq(f.inactivityMs(6), 30, 'DURATION × 5 ms');
  eq(f.channelGap(2402, 2380, 2400), 1, 'gap BT ch37 to band 40 top channel');
  eq(f.filterRejection(100, 2.5, 50), 50, 'rejection cap');
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
ok(tctx.window.BT_TERMS.every((t) => t.length === 4 && slugs.has(t[3])), 'every term points to a chapter');
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
console.log({ checks, compiledScriptBlocks: scripts, terms: tctx.window.BT_TERMS.length });
