// UWBBook 사실 검증: 챕터 안의 계산 함수를 꺼내 공개 구현(Decawave uwb-core·uwb-dw1000, Zephyr DW1000, Android UWB)의 코드·시험 값과 맞춰 본다.
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

// ---------------------------------------------------------------- 01 intro
{
  const f = load('intro', ['rssiRange', 'tofRange'], 'const C = 299792458;');
  const r = f.rssiRange(5, 4, 2.5, 1.645); close(r[0], 2.73, 0.01, 'RSSI 90% low'); close(r[1], 9.17, 0.01, 'RSSI 90% high');
  const u = f.tofRange(5, 0.33, 1.645); close(u[1] - 5, 0.163, 0.001, 'ToF ±16 cm');
}

// ---------------------------------------------------------------- 02 pulse
{
  const f = load('pulse', ['pulseWidth10', 'bandwidth10', 'spectrumDb', 'rangeRes', 'sigmaForBw', 'twoPath', 'peaks', 'isUwb'], 'const C = 299792458;');
  // 해석식 −10 dB 폭을 수치 푸리에 변환으로 확인: 포락선 exp(−t²/2σ²)의 |F(f)|²
  for (const sg of [0.3, 0.7, 2]) {
    const F = (fMHz) => { let re = 0; const dt = sg / 40; for (let t = -8 * sg; t <= 8 * sg; t += dt) re += Math.exp((-t * t) / (2 * sg * sg)) * Math.cos(2 * Math.PI * fMHz * 1e-3 * t) * dt; return re * re; };
    const p0 = F(0), half = f.bandwidth10(sg) / 2; close(10 * Math.log10(F(half) / p0), -10, 0.01, 'numeric FT −10 dB at σ=' + sg);
    close(f.spectrumDb(half, sg), -10, 1e-9, 'analytic −10 dB');
  }
  close(f.pulseWidth10(1) * f.bandwidth10(1) / 1000, (4 * Math.log(10)) / (2 * Math.PI), 1e-9, 'time×bandwidth constant');
  close(f.sigmaForBw(500), 0.966, 0.001, 'σ for 500 MHz');
  close(f.rangeRes(500), 0.5996, 0.0001, 'c/B 500 MHz'); close(f.rangeRes(2), 149.9, 0.1, 'c/B 2 MHz');
  eq(f.peaks(f.sigmaForBw(500), 3.336, 0.8).n, 2, 'UWB separates 1 m echo'); eq(f.peaks(f.sigmaForBw(20), 3.336, 0.8).n, 1, '20 MHz merges');
  ok(f.isUwb(1000, 1500).ok && !f.isUwb(6105, 6425).ok && f.isUwb(6150, 6830).ok, '§15.503 classification');
  close(f.isUwb(1000, 1500).fb, 0.4, 1e-12, 'fractional bw 0.4');
}

// ---------------------------------------------------------------- 03 channels: uwb-core UWB_CH_FREQ_CHAN_*, Zephyr PLL 설정, uwb_rng_path_loss()
{
  const src = read('channels'), pre = src.match(/const C = 299792458, BASE = 499\.2;[\s\S]*?const MULT = [^\n]*\n/)[0];
  const f = load('channels', ['channelFreq', 'channelPower', 'rxPower', 'maxRange'], pre);
  // uwb-core uwb_mac.h (4번은 PLL 설정 근거로 별도 확인)
  const CORE = { 1: 3494.4, 2: 3993.6, 3: 4492.8, 5: 6489.6, 7: 6489.6, 9: 7987.2 };
  for (const [ch, mhz] of Object.entries(CORE)) close(f.channelFreq(+ch), mhz, 1e-9, 'uwb-core channel ' + ch);
  // Zephyr: DWT_FS_PLLCFG_CH4 = CH2, CH7 = CH5 → 같은 중심
  ok(f.channelFreq(4) === f.channelFreq(2) && f.channelFreq(7) === f.channelFreq(5), 'Zephyr PLL: ch4=ch2, ch7=ch5');
  for (let ch = 0; ch <= 15; ch++) close(f.channelFreq(ch) / 499.2, Math.round(f.channelFreq(ch) / 499.2), 1e-12, 'multiple of 499.2: ' + ch);
  // Android FiraParams UWB_CHANNEL_* = 5,6,8,9,10,12,13,14 모두 3.1~10.6 GHz 안
  for (const ch of [5, 6, 8, 9, 10, 12, 13, 14]) ok(f.channelFreq(ch) - 249.6 >= 3100 && f.channelFreq(ch) + 249.6 <= 10600, 'FCC band ch' + ch);
  close(f.channelPower(499.2, 1000), -14.317, 0.001, 'total power −14.3 dBm'); close(f.channelPower(499.2, 200) - f.channelPower(499.2, 1000), 6.99, 0.01, '200 µs → +7 dB');
  // uwb_rng_path_loss(Pt, G, fc, R) = Pt + 2G + 20log10(c/1.000293) − 20log10(4π fc R)
  const kPL = (Pt, G, fc, R) => Pt + 2 * G + 20 * Math.log10(299792458.0 / 1.000293) - 20 * Math.log10(4 * Math.PI * fc * R);
  for (const R of [1, 5, 30]) close(f.rxPower(0, 0, 6489.6e6, R), kPL(0, 0, 6489.6e6, R), 1e-9, 'path loss = uwb-core ' + R);
  close(f.maxRange(-14.317, 7987.2e6, -98, 6), 22.9, 0.1, 'range ≈ 23 m');
  // uwb-core가 4번 채널에 4492.8 MHz를 쓰면 파장은 11% 짧게
  close(1 - 3993.6 / 4492.8, 0.111, 0.001, 'ch4 wavelength error 11%');
}

// ---------------------------------------------------------------- 04 frame: Zephyr TPSYM 상수, DW1000 프레임 시간 식
{
  const src = read('frame'), pre = 'const CHIP_MHZ = 499.2;\n' + src.match(/  const MODES = [\s\S]*?const NONZERO[^\n]*\n/)[0];
  const f = load('frame', ['symbolNs', 'meanPrf', 'mseq31', 'periodicAcf', 'shrUs', 'dataUs', 'frameParts'], pre + src.match(/  const TPSYM = [^\n]*\n/)[0]);
  // Zephyr ieee802154_radio.h: PRF4 3974.36, PRF16 993.59, PRF64 1017.63, ERDEV 729.17 ns
  close(f.symbolNs(31, 64), 3974.36, 0.005, 'TPSYM PRF4'); close(f.symbolNs(31, 16), 993.59, 0.005, 'TPSYM PRF16');
  close(f.symbolNs(127, 4), 1017.63, 0.005, 'TPSYM PRF64'); close(f.symbolNs(91, 4), 729.17, 0.005, 'TPSYM ERDEV');
  close(f.symbolNs(127, 4) / 1000, 1.0176282, 1e-6, 'uwb-dw1000 Tpsym 1.0176282');
  close(f.meanPrf(127, 4), 62.89, 0.005, 'DW1000 comment: MPRF 62.89 MHz');
  close(512 / 499.2, 1.025641, 1e-6, 'Tbsym = 512 chips'); close(64 / 499.2, 0.1282051, 1e-7, 'Tdsym = 64 chips');
  const acf = f.periodicAcf(f.mseq31()); ok(acf[0] === 31 && acf.slice(1).every((v) => v === -1), 'm-sequence ideal periodic ACF');
  // dw1000_phy_frame_duration() 그대로 (Tpsym·Tbsym·Tdsym float32 값, nsync 128, nsfd 8, nphr 21)
  const kShr = (nsync) => Math.ceil(Math.fround(1.0176282) * (nsync + 8));
  const kData = (n) => { let par = 48; par += Math.floor((8 * (n + 2)) / 330) * 48; return Math.ceil(Math.fround(1.025641) * 21 + Math.fround(0.1282051) * (8 * (n + 2) + par)); };
  for (const ns of [32, 64, 128, 1024]) eq(f.shrUs(1.0176282, ns, 8), kShr(ns), 'SHR ' + ns);
  for (let n = 0; n <= 127; n++) eq(f.dataUs(1.025641, 0.1282051, 21, n), kData(n), 'data ' + n);
  const tot = (p) => p.reduce((a, x) => a + x[1], 0);
  close(tot(f.frameParts(3, 64, 64, 0)), 139.6, 0.1, 'Android default SP3 ≈ 140 µs'); ok(tot(f.frameParts(0, 1024, 64, 20)) > 1000, 'SP0 1024 > 1 ms');
}

// ---------------------------------------------------------------- 05 timestamp: Zephyr DWT_TS_TIME_UNITS_FS, 안테나 지연 기본값
{
  const f = load('timestamp', ['tickSeconds', 'tsDiff40', 'antennaBias', 'ppmError', 'ppmToHz'], 'const C_AIR = 299792458 / 1.000293;');
  close(f.tickSeconds() * 1e15, 15650, 1, 'Zephyr DWT_TS_TIME_UNITS_FS 15650'); close(f.tickSeconds() * 65536 * 1e6, 1.025641, 1e-6, 'uwb usec = 65536 ticks = 1.0256 µs');
  close(2 ** 40 * f.tickSeconds(), 17.21, 0.01, '40-bit wrap 17.2 s');
  eq(f.tsDiff40(0x0000000100, 0xffffffff00), 0x200, '40-bit wrap subtraction');
  // uwb-core tof_to_meters: ToF × (c/1.000293) × (1/499.2e6/128)
  close(f.antennaBias(1), (299792458 / 1.000293) / 499.2e6 / 128, 1e-15, 'one tick = uwb_rng_tof_to_meters(1)');
  close(f.antennaBias(20), 0.0938, 0.0005, '20 ticks ≈ 9 cm'); ok(f.antennaBias(32920) > 150, 'unset delay > 150 m');
  close(16450 * f.tickSeconds() * 1e9, 257.4, 0.1, 'Zephyr DW1000_TX_ANT_DLY 16450 ≈ 257 ns');
  close(f.ppmError(20, 500), 1.5, 0.01, '20 ppm × 500 µs ≈ 1.5 m');
  // uwb-core DWT_HZ_TO_PPM_MULTIPLIER_CHAN_9 = 1e6 / 7987.2e6
  close(1 / f.ppmToHz(1, 7987.2e6), 1.0e6 / 7987.2e6, 1e-15, 'Hz↔ppm multiplier');
}

// ---------------------------------------------------------------- 06 twr: uwb-core rng_math.c와 그 자체 시험(calc_tof_test.c, tof_to_meters_test.c)
{
  const src = read('twr');
  const f = load('twr', ['tofToMeters', 'calcTofSs', 'calcTofDs', 'simulateTwr', 'ssFromIntervals', 'dsFromIntervals'], src.match(/  const TICK = [^\n]*\n/)[0] + src.match(/  const M32 = [^\n]*\n/)[0]);
  const U = (x) => Math.trunc(x); // DPL_FLOAT64_F64_TO_U64
  // tof_to_meters_test.c: epsilon_same_float(a, b) = fabsf(a − b) < FLT_EPSILON (float로 바꿔 비교)
  [[1.0, 0.0046903], [0, 0], [123456789, 579060.450834], [0.00009, 0.000000422], [213.202, 1.000000464]].forEach(([t, m]) => ok(Math.abs(Math.fround(Math.fround(f.tofToMeters(t)) - Math.fround(m))) < 1.1920929e-7, 'tof_to_meters ' + t));
  // calc_tof_test.c — 단방향
  eq(U(f.tofToMeters(f.calcTofSs(254076713, 175480898, 1470169168, 1391575515, 0))), 5, 'SS 5 m');
  for (let i = 0; i < 2 ** 32; i += 0x1000003) eq(U(f.tofToMeters(f.calcTofSs((1912245852 + i) >>> 0, (1833647682 + i) >>> 0, (786803792 + i) >>> 0, (708209934 + i) >>> 0, 0))), 10, 'SS 10 m sweep ' + i);
  eq(U(f.tofToMeters(f.calcTofSs(1075470169, 996872258, 1024692304, 946098392, 0))), 9, 'SS 9 m');
  eq(U(f.tofToMeters(f.calcTofSs(0xcafe80d8, 0xc74f4042, 0x745650, 0xfcc517a4, 0))), 1, 'SS 1 m wrap');
  eq(U(f.tofToMeters(f.calcTofSs(0xffffffff, 0xffffffff, 2n ** 64n - 1n, 2n ** 64n - 1n, 0))), 0, 'SS max');
  // 양방향
  eq(U(f.tofToMeters(f.calcTofDs(2675898111, 2597300290, 1024692304, 946098392, 1075470169, 996872258, 1024692304, 946098392))), 9, 'DS 9 m');
  for (let i = 0; i < 2 ** 32; i += 0x1000003) { const a = (x) => (x + i) >>> 0; eq(U(f.tofToMeters(f.calcTofDs(a(3867846252), a(3789248066), a(2254086224), a(2175492353), a(2333274316), a(2254086210), a(3947030096), a(3867846252)))), 10, 'DS 10 m sweep ' + i); }
  eq(U(f.tofToMeters(f.calcTofDs(2118173324, 2056354370, 3334250064, 3272433282, 3396658744, 3334250050, 2180579920, 2118173324))), 5, 'DS 5 m');
  eq(U(f.tofToMeters(f.calcTofDs(0xfff0b714, 0xfc417642, 0xb7e93850, 0xb439f952, 0xbba17ae4, 0xb7e93842, 0x3a8f650, 0xfff0b714))), 1, 'DS 1 m wrap');
  const MX = 2n ** 64n - 1n; ok(Number.isNaN(f.tofToMeters(f.calcTofDs(0xffffffff, 0xffffffff, MX, MX, 0xffffffff, 0xffffffff, MX, MX))), 'DS max → NaN');
  // 오차 모델
  const C_AIR = 299792458 / 1.000293, s = f.simulateTwr(5 / C_AIR, 10, -10, 500, 500), m = (t) => f.tofToMeters(t) - 5;
  close(Math.abs(m(f.ssFromIntervals(s.round1, s.reply1, 0))), 1.5, 0.01, 'SS error 1.5 m'); ok(Math.abs(m(f.ssFromIntervals(s.round1, s.reply1, s.skew))) < 1e-4, 'skew-corrected SS'); ok(Math.abs(m(f.dsFromIntervals(s.round1, s.reply1, s.round2, s.reply2))) < 1e-3, 'DS < 1 mm');
}

// ---------------------------------------------------------------- 07 multipath: uwb-dw1000 dw1000_estimate_los()
{
  const src = read('multipath');
  const f = load('multipath', ['estimateLos', 'segCross', 'paths', 'cirDb', 'firstPath', 'rssiFppl'], 'const C = 299792458;');
  // 커널판 그대로: d < 6 → 1, d > 10 → 0, 1 − (d − 6)/4
  const k = (r, p) => { const d = Math.abs(r - p); if (d < 6) return 1; if (10 < d) return 0; return 1 - (d - 6) / 4; };
  for (let d = 0; d <= 16; d += 0.25) close(f.estimateLos(-80, -80 - d), k(-80, -80 - d), 1e-12, 'estimate_los d=' + d);
  eq([f.estimateLos(-82, -94), f.estimateLos(-80, -88)], [0, 0.5], 'quiz cases');
  // 거울상 경로 길이: 벽 x=0 반사 = |이미지 − 수신|
  const tx = { x: 0.8, y: 2 }, rx = { x: 4.6, y: 2.6 }, ps = f.paths(tx, rx, 6, 4, null, 0, 0);
  close(ps[0].len, Math.hypot(3.8, 0.6), 1e-12, 'direct'); ok(ps.slice(1).some((p) => Math.abs(p.len - Math.hypot(4.6 + 0.8, 0.6)) < 1e-9), 'image method x=0');
  eq(ps.length, 5, 'direct + 4 reflections');
  const OB = [{ x: 3.2, y: 1.2 }, { x: 3.2, y: 3.4 }], S = 0.966, N = -45, d0 = Math.hypot(3.8, 0.6), t0 = (d0 / 299792458) * 1e9 - 6;
  const err = (ob, ex, th) => (f.firstPath(f.paths(tx, rx, 6, 4, ob ? OB : null, ob, ex), S, N, th, t0, t0 + 40) * 1e-9 * 299792458) - d0;
  ok(Math.abs(err(0, 0, 10)) < 0.01, 'LOS first path'); close(err(25, 0.2, 10), 1.27, 0.02, 'concrete misses direct → +1.3 m'); close(err(25, 0.2, 3), 0.21, 0.02, 'low threshold finds direct +21 cm');
}

// ---------------------------------------------------------------- 08 aoa: uwb-core uwb_calc_aoa()
{
  const src = read('aoa'), pre = src.match(/  const SPEED_OF_LIGHT = [^\n]*\n  const CH_FREQ = [^\n]*\n/)[0];
  const f = load('aoa', ['calcAoa', 'pdoaOf', 'candidates', 'aoaStd'], pre);
  // uwb.c: wavelength = SPEED_OF_LIGHT / frequency; pd_dist = pdoa/(2π) × wavelength; asin(pd_dist / sep)
  const k = (pdoa, fHz, sep) => Math.asin(((pdoa / (2 * Math.PI)) * (299792458.0 / fHz)) / sep);
  for (let p = -3; p <= 3; p += 0.25) close(f.calcAoa(p, 9, 0.0187), k(p, 7987.2e6, 0.0187), 1e-12, 'uwb_calc_aoa ch9 ' + p);
  close(299792458 / 7987.2e6 * 100, 3.753, 0.001, 'λ ch9 3.75 cm'); close(299792458 / 6489.6e6 * 100, 4.62, 0.005, 'λ ch5 4.62 cm');
  const half = 299792458 / 7987.2e6 / 2;
  for (let t = -85; t <= 85; t += 5) close(f.calcAoa(f.pdoaOf((t * Math.PI) / 180, 9, half), 9, half) * 180 / Math.PI, t, 1e-9, 'λ/2 round trip ' + t);
  close(f.calcAoa(Math.PI / 2, 9, half) * 180 / Math.PI, 30, 1e-9, 'quiz: 90° at λ/2 → 30°');
  eq(f.candidates(Math.PI / 3, 0.5).length, 1, 'λ/2 unique'); eq(f.candidates(Math.PI / 3, 1).length, 2, 'λ two candidates');
  close(f.aoaStd((8 * Math.PI) / 180, 0.5, 0) * 180 / Math.PI, 2.546, 0.001, 'σθ front'); close(f.aoaStd((8 * Math.PI) / 180, 0.5, Math.PI / 3) * 180 / Math.PI, 5.09, 0.01, 'σθ 60°');
}

// ---------------------------------------------------------------- 09 position
{
  const src = read('position'), pre = src.match(/  const inv2 = [^\n]*\n/)[0];
  const f = load('position', ['solveTrilat', 'dopRange', 'solveTdoa'], pre);
  const A4 = [[0.3, 0.3], [7.7, 0.3], [7.7, 5.7], [0.3, 5.7]].map(([x, y]) => ({ x, y }));
  for (const t of [{ x: 5.2, y: 3.6 }, { x: 1, y: 1 }, { x: 7, y: 5 }, { x: 4, y: 3 }]) {
    const r = A4.map((A) => Math.hypot(t.x - A.x, t.y - A.y)), p = f.solveTrilat(A4, r, { x: 4, y: 3 });
    ok(Math.hypot(p.x - t.x, p.y - t.y) < 1e-6, 'trilat exact ' + t.x + ',' + t.y);
    const d = r.slice(1).map((v) => v - r[0]), q = f.solveTdoa(A4, d, { x: 4, y: 3 });
    ok(Math.hypot(q.x - t.x, q.y - t.y) < 1e-6, 'tdoa exact ' + t.x + ',' + t.y);
  }
  close(f.dopRange([{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }], { x: 0, y: 0 }), 1, 1e-12, 'square center DOP = 1');
  const LINE = [[0.3, 0.3], [2.8, 0.3], [5.2, 0.3], [7.7, 0.3]].map(([x, y]) => ({ x, y }));
  ok(f.dopRange(LINE, { x: 4, y: 0.35 }) > 5 && f.dopRange(LINE, { x: 4, y: 3 }) < 1.1, 'collinear: bad near the line, fine inside');
  eq(f.dopRange(LINE, { x: 4, y: 0.3 }), Infinity, 'on the line → ∞');
}

// ---------------------------------------------------------------- 10 security
{
  const f = load('security', ['relayedDistance', 'binomTail', 'passProb'], 'const C = 299792458;');
  for (const d of [1, 2, 30]) for (const t of [0, 1, 100, 1000]) ok(f.relayedDistance(d, t) >= d, 'relay never shortens');
  close(f.relayedDistance(0, 100), 14.99, 0.01, '100 ns → +15 m');
  close(f.binomTail(10, 0, 0.5), 1, 1e-12, 'tail k=0'); close(f.binomTail(10, 10, 0.5), 1 / 1024, 1e-15, 'all correct');
  close(f.binomTail(4, 2, 0.5), 11 / 16, 1e-12, 'small exact');
  const p64 = f.passProb(64, 0.75, 0.5); ok(p64 < 1e-4 && p64 > 1e-6, '64 pulses, 75%: 1e-5 order'); ok(f.passProb(4096, 0.75, 0.5) < 1e-100, '4096 pulses ≈ 0'); ok(f.passProb(64, 0.75, 0.9) > 0.99, 'legit device passes');
}

// ---------------------------------------------------------------- 11 fira: Android 기본값
{
  const f = load('fira', ['rstuUs', 'slotsNeeded', 'maxResponders', 'collisionRate']);
  close(f.rstuUs(), 1 / 1.2, 1e-12, 'RSTU = 1/1.2 µs'); close(2400 * f.rstuUs(), 2000, 1e-9, 'DEFAULT_SLOT_DURATION_RSTU 2400 = 2 ms');
  close(400 * f.rstuUs(), 1000 / 3, 1e-9, 'CHAP_IN_RSTU 400 = 1/3 ms'); close(25 * 2400 * f.rstuUs() / 1000, 50, 1e-9, 'SLOTS_PER_RR 25 → 50 ms round');
  ok(25 * 2 <= 200, 'default round fits 200 ms interval');
  eq([f.slotsNeeded('ss', 4), f.slotsNeeded('ds', 4)], [7, 12], 'slots for 4 responders'); eq(f.maxResponders('ds', 25), 10, 'DS max 10 in 25 slots'); eq(f.maxResponders('ss', 25), 22, 'SS max 22');
  eq([f.collisionRate(true, 4), f.collisionRate(false, 4, 1, 1), f.collisionRate(false, 4, 1, 2)], [0.25, 1, 0], 'hopping');
}

// ---------------------------------------------------------------- 12 power (예시 전류 모델)
{
  const src = read('power'), pre = src.match(/  const I = [^\n]*\n/)[0];
  const f = load('power', ['chargePerRanging', 'dailyAvgUa', 'lifeDays', 'overlapProb'], pre);
  close(f.chargePerRanging('twr', 100), 19.0, 0.05, 'TWR charge'); ok(f.chargePerRanging('ul', 100) < f.chargePerRanging('twr', 100) && f.chargePerRanging('twr', 100) < f.chargePerRanging('dl', 100), 'UL < TWR < DL');
  close(f.lifeDays(220, f.dailyAvgUa('twr', 100, 200, 0.5)) / 365, 1.8, 0.05, 'coin cell 1.8 years'); ok(f.lifeDays(220, f.dailyAvgUa('twr', 100, 200, 24)) < 90, 'always on < 3 months');
  close(f.dailyAvgUa('twr', 100, 50, 1) - 12, 4 * (f.dailyAvgUa('twr', 100, 200, 1) - 12), 1e-9, '4x rate → 4x UWB current');
  eq(f.overlapProb(0, 2, 0.6), 0, 'no wifi'); ok(f.overlapProb(0.4, 2, 0.6) > 0.4, 'overlap ≥ occupancy');
}

// ---------------------------------------------------------------- 13 apps
{
  const src = read('apps'), pre = src.match(/  const inv2 = [^\n]*\n/)[0] + src.match(/  const CAR = [^\n]*\n/)[0];
  const f = load('apps', ['solveTrilat', 'distToCar', 'zone', 'arrowStd', 'foldFrontBack'], pre);
  const A = [{ x: 2.3, y: 0 }, { x: -2.3, y: 0 }, { x: 0.2, y: 0.95 }, { x: 0.2, y: -0.95 }, { x: 0.9, y: 0 }, { x: -0.9, y: 0 }];
  for (const p of [{ x: 0.6, y: 1.5 }, { x: 0.3, y: 0.3 }, { x: -4, y: -2 }, { x: 6, y: 3 }]) { const q = f.solveTrilat(A, A.map((a) => Math.hypot(p.x - a.x, p.y - a.y)), { x: 0, y: 0.5 }); ok(Math.hypot(q.x - p.x, q.y - p.y) < 1e-6, 'car trilat ' + p.x + ',' + p.y); }
  eq([f.zone({ x: 0.3, y: 0.3 }), f.zone({ x: 0.6, y: 1.5 }), f.zone({ x: 0, y: 4 }), f.zone({ x: 0, y: 7 })], ['실내', '문 앞', '다가옴', '멀리'], 'zones');
  eq([f.foldFrontBack(30), f.foldFrontBack(150), f.foldFrontBack(-120)], [30, 30, -60], 'front/back fold');
  close(f.arrowStd(8, 0), 8 / Math.PI, 1e-12, 'arrow σ front = ch08');
}

// ---------------------------------------------------------------- 14 design
{
  const src = read('design'), pre = src.match(/  const invTrace = [^\n]*\n/)[0];
  const f = load('design', ['gridAnchors', 'dopRange', 'dopTdoa', 'nearAnchors', 'posError', 'tagCapacity', 'tagCurrentUa'], pre);
  eq(f.gridAnchors(60, 15).length, 16, '16 anchors'); eq(f.gridAnchors(60, 30).length, 4, '4 anchors');
  const sq = [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]; close(f.dopRange(sq, { x: 0, y: 0 }), 1, 1e-12, 'range DOP square');
  ok(f.dopTdoa(sq, { x: 3, y: 0 }) > 5 * f.dopRange(sq, { x: 3, y: 0 }), 'outside anchors: TDoA DOP grows much faster');
  eq([f.tagCapacity('twr', 100), f.tagCapacity('ul', 1000), f.tagCapacity('dl', 100)], [8, 4000, Infinity], 'capacity');
  ok(f.tagCurrentUa('ul', 1000) < f.tagCurrentUa('dl', 1000) && f.tagCurrentUa('dl', 1000) < f.tagCurrentUa('twr', 1000), 'UL < DL < TWR current');
  ok(Number.isNaN(f.posError('ul', f.gridAnchors(60, 30), { x: 30, y: 2 }, 25, 0.1)), 'uncovered → NaN');
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
ok(tctx.window.UW_TERMS.every((t) => t.length === 4 && slugs.has(t[3])), 'every term points to a chapter');
// 본문의 모든 .term이 용어집 항목에 이어지는가(common.js 툴팁과 같은 규칙)
{
  const norm = (x) => x.replace(/\s+/g, '').toLowerCase(), keys = new Set();
  tctx.window.UW_TERMS.forEach((t) => { [t[0], t[0].replace(/\(.*?\)/g, ''), t[1], t[1].replace(/\(.*?\)/g, '')].forEach((k) => keys.add(norm(k))); t[0].split(/[\/·]/).forEach((k) => keys.add(norm(k))); for (const m of t[1].matchAll(/\(([A-Z][A-Za-z0-9]*[A-Z0-9])\)|^([A-Z][A-Za-z0-9]*[A-Z0-9]),/g)) keys.add(norm(m[1] || m[2])); });
  const al = tctx.window.UW_TERM_ALIAS || {};
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
console.log({ checks, compiledScriptBlocks: scripts, terms: tctx.window.UW_TERMS.length });
