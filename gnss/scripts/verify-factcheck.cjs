// GNSSBook 사실 검증: 챕터 안의 계산 함수를 꺼내 공개 규격(IS-GPS-200N, Galileo OS SIS ICD v2.2)의 표·식과 공개 구현(RTKLIB)의 코드와 맞춰 본다.
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
  const f = load('intro', ['solve2d', 'solve3']);
  const sats = [{ x: 15, y: 90 }, { x: 85, y: 85 }, { x: 55, y: 15 }], rx = { x: 48, y: 52 };
  for (const b of [-30, 0, 12, 30]) { const pr = sats.map((s) => Math.hypot(rx.x - s.x, rx.y - s.y) + b), sol = f.solve2d(sats, pr, { x: 50, y: 50, b: 0 }); ok(Math.hypot(sol.x - rx.x, sol.y - rx.y) < 1e-6 && Math.abs(sol.b - b) < 1e-6, 'solve x,y,b with bias ' + b); }
  close(299792458 * 1e-6, 299.79, 0.01, '1 µs = 300 m'); close(20200e3 / 299792458 * 1000, 67.4, 0.1, '20,200 km ≈ 67 ms');
}

// ---------------------------------------------------------------- 02 orbits: IS-GPS-200N μ·Ω̇e, Aref, Galileo Table 1
{
  const src = read('orbits'), pre = src.match(/  const MU = [^\n]*\n/)[0];
  const f = load('orbits', ['period', 'speed', 'radiusFor', 'coverage', 'satEcef', 'azEl', 'constellation'], pre);
  close(f.period(26559710) / 3600, 11.966, 0.001, 'GPS Aref → 11 h 58 min'); close(f.radiusFor(86164.0905 / 2) / 1000, 26561.8, 0.1, 'half sidereal day radius');
  close(f.period(29600000) / 3600, 14.08, 0.01, 'Galileo 14 h 05 min'); close(f.period(6378137 + 35786e3) / 3600, 23.93, 0.01, 'GEO 23 h 56 min');
  close(f.speed(26559710) / 1000, 3.874, 0.001, 'GPS speed 3.87 km/s');
  close(f.coverage(26559710, (10 * Math.PI) / 180), 0.299, 0.001, 'GPS sees 30%'); ok(f.coverage(6378137 + 400e3, (10 * Math.PI) / 180) < 0.012, 'LEO sees ~1%');
  // 바로 위 위성: 위도 0, 경도 0, 위성 (a,0,0) → 앙각 90°
  close(f.azEl(0, 0, [26559710, 0, 0]).el * 180 / Math.PI, 90, 1e-9, 'overhead el 90');
  const s0 = f.satEcef(26559710, 0.96, 0.3, 0.2, 1234); close(Math.hypot(...s0), 26559710, 1e-3, 'circular orbit radius preserved');
  eq([f.constellation('gps').length, f.constellation('gal').length], [24, 24], 'constellation sizes');
}

// ---------------------------------------------------------------- 03 signals: IS-GPS-200N 3.3.1.1, 표 3-Va / Galileo ICD 주파수
{
  const f = load('signals', ['carrier', 'relGeneral', 'relSpecial', 'cn0', 'psdBpsk', 'psdBoc11'], 'const F0 = 10.23, MU = 3.986005e14, C = 299792458, RE = 6378137, LG = 6.969290134e-10;');
  eq([f.carrier(154), f.carrier(120), f.carrier(115)], [1575.42, 1227.6, 1176.45], 'GPS L1/L2/L5');
  eq([f.carrier(118), f.carrier(125)], [1207.14, 1278.75], 'Galileo E5b/E6 (ICD 1207.140, 1278.750)');
  // IS-GPS-200N 3.3.1.1: Δf/f = −4.4647E-10 → 10.23 MHz × (1 − 4.4647E-10) = 10.2299999954326 MHz
  close(10.23e6 * (1 - 4.4647e-10), 10229999.9954326, 1e-6, 'offset frequency');
  const a = 26559710, tot = f.relGeneral(a) + f.relSpecial(a);
  close(tot, 4.4647e-10, 0.0005e-10, 'relativity = ICD Δf/f −4.4647E-10 (magnitude)'); close(tot * 86400e6, 38.57, 0.05, '38.6 µs/day');
  const a0 = (1.5 * 3.986005e14) / (299792458 ** 2 * 6.969290134e-10); close(f.relGeneral(a0) + f.relSpecial(a0), 0, 1e-22, 'cancel radius'); close(a0 / 1000, 9545, 5, 'cancel ≈ 9,550 km');
  close(f.cn0(-158.5, 2), 43.5, 1e-9, 'C/N0 43.5 dB-Hz');
  // 스펙트럼: 총전력 ≈ 1 (적분)
  let a1 = 0, a2 = 0; for (let x = -200; x <= 200; x += 0.002) { a1 += f.psdBpsk(x, 1) * 0.002; a2 += f.psdBoc11(x) * 0.002; }
  close(a1, 1, 0.01, 'BPSK power 1'); close(a2, 1, 0.01, 'BOC power 1'); eq(f.psdBoc11(0), 0, 'BOC null at center');
}

// ---------------------------------------------------------------- 04 prn: IS-GPS-200N 3.3.2.3, 표 3-Ia
{
  const src = read('prn'), pre = src.match(/  const TAPS = [^\n]*\n/)[0] + src.match(/  const DELAY = [^\n]*\n/)[0];
  const f = load('prn', ['caCode', 'caCodeDelay', 'octal10', 'circCorr'], pre);
  // 표 3-Ia 처음 10칩(8진수) — 규격 PDF에서 옮긴 값
  const ICD = ['1440', '1620', '1710', '1744', '1133', '1455', '1131', '1454', '1626', '1504', '1642', '1750', '1764', '1772', '1775', '1776', '1156', '1467', '1633', '1715', '1746', '1763', '1063', '1706', '1743', '1761', '1770', '1774', '1127', '1453', '1625', '1712', '1745', '1713', '1134', '1456', '1713'];
  for (let p = 1; p <= 37; p++) eq(f.octal10(f.caCode(p, 10)), ICD[p - 1], 'first 10 chips PRN ' + p);
  for (let p = 1; p <= 37; p++) eq(f.caCodeDelay(p).join(''), f.caCode(p).join(''), 'two-tap == G2 delay PRN ' + p);
  eq(f.caCode(34).join(''), f.caCode(37).join(''), 'PRN 34 == 37 (ICD note)');
  eq(f.octal10([1, 1, 0, 0, 1, 0, 0, 0, 0, 0]), '1440', 'ICD example 1100100000');
  const c1 = f.caCode(1), c2 = f.caCode(2), ac = f.circCorr(c1, c1), cc = f.circCorr(c1, c2);
  eq(ac[0], 1023, 'autocorrelation peak'); ok(ac.slice(1).every((v) => [-65, -1, 63].includes(v)), 'auto sidelobes 3-valued');
  ok(cc.every((v) => [-65, -1, 63].includes(v)), 'cross-correlation 3-valued');
  eq(c1.reduce((a, b) => a + b, 0), 512, 'balanced: 512 ones');
}

// ---------------------------------------------------------------- 05 acquisition
{
  const f = load('acquisition', ['maxRangeRate', 'doppler', 'binWidth', 'cells', 'corrMag', 'needSums'], 'const C = 299792458, L1 = 1575.42e6, MU = 3.986005e14, RE = 6378137;');
  close(f.maxRangeRate(26559710), 930, 2, 'max range rate ≈ 930 m/s'); close(f.doppler(930, 1575.42e6), 4887, 10, '≈ ±4.9 kHz');
  close(f.doppler(800, 1575.42e6), 4204, 5, 'quiz 800 m/s → 4.2 kHz'); close(1e-6 * 1575.42e6, 1575.42, 1e-9, '1 ppm = 1.575 kHz');
  eq(f.cells(5000, 0.001), 40920, '1 ms grid ≈ 40,920 cells'); eq(f.cells(5000, 0.01) / f.cells(5000, 0.001), 10, '10 ms → 10x cells');
  close(1575.42 / 1.023, 1540, 1e-9, 'carrier/code ratio 1540');
  close(f.corrMag(38, 0.001, 0, 0), Math.sqrt(2 * 10 ** 3.8 * 0.001), 1e-12, 'corr magnitude');
  eq(f.needSums(45, 0.001), 1, 'strong signal 1 dwell'); ok(f.needSums(25, 0.001) > 10, 'weak signal many sums');
}

// ---------------------------------------------------------------- 06 tracking
{
  const f = load('tracking', ['tri', 'corrMp', 'discr', 'dllLock', 'sigmaDll', 'sigmaPll']);
  const CHIP = 299792458 / 1.023e6;
  ok(Math.abs(f.dllLock(0.5, 0, 0)) < 1e-9, 'no multipath → 0');
  close(f.dllLock(0.5, 0.5, 0.25) * CHIP, 24.4, 0.1, 'a 0.5, 0.25 chip, d 0.5 → 24 m'); close(f.dllLock(0.1, 0.5, 0.25) * CHIP, 7.33, 0.05, 'narrow → 7 m');
  for (const d of [0.1, 0.5, 1]) { let mx = 0; for (let x = 0; x <= 1.6; x += 0.005) mx = Math.max(mx, Math.abs(f.dllLock(d, 0.5, x))); close(mx, (0.5 * d) / 2, 0.003, 'envelope a·d/2 for d=' + d); }
  ok(Math.abs(f.dllLock(0.5, 0.5, 1.26)) < 1e-9, 'delay > 1 + d/2 → no error');
  close(f.sigmaDll(40, 1, 0.5, 0.02) * CHIP, 1.47, 0.01, 'DLL 1.5 m'); close(f.sigmaDll(40, 1, 0.1, 0.02) * CHIP, 0.657, 0.005, 'narrow 0.66 m');
  close((f.sigmaPll(40, 10, 0.02) * 299792458) / 1575.42e6 / (2 * Math.PI) * 1000, 0.96, 0.01, 'PLL ≈ 1 mm');
}

// ---------------------------------------------------------------- 07 navmsg: 표 20-XIV 패리티 = RTKLIB decode_word()
{
  const src = read('navmsg'), pre = src.match(/  const PAR = [^\n]*\n/)[0] + src.match(/  const GPST0 = [^\n]*\n/)[0];
  const f = load('navmsg', ['parityBits', 'encodeWord', 'checkWord', 'utcToGps'], pre);
  // RTKLIB rtkcmn.c decode_word(): word = (D29*,D30*) 2비트 + 30비트
  const HAM = [0xBB1F3480, 0x5D8F9A40, 0xAEC7CD00, 0x5763E680, 0x6BB1F340, 0x8B7A89C0];
  const decodeWord = (word) => { word >>>= 0; if (word & 0x40000000) word = (word ^ 0x3FFFFFC0) >>> 0; let parity = 0; for (let i = 0; i < 6; i++) { parity <<= 1; for (let w = ((word & HAM[i]) >>> 0) >>> 6; w; w >>>= 1) parity ^= w & 1; } return parity === (word & 0x3F); };
  let s = 12345; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 3000; k++) {
    const d = Array.from({ length: 24 }, () => (rnd() < 0.5 ? 1 : 0)), p29 = rnd() < 0.5 ? 1 : 0, p30 = rnd() < 0.5 ? 1 : 0, w = f.encodeWord(d, p29, p30);
    if (k % 3 === 1) w[Math.floor(rnd() * 30)] ^= 1; // 일부는 오류 주입
    const packed = [p29, p30, ...w].reduce((a, b) => a * 2 + b, 0);
    eq(f.checkWord(w, p29, p30).ok, decodeWord(packed), 'parity agrees with RTKLIB #' + k);
  }
  const g1 = f.utcToGps(Date.UTC(1999, 7, 21, 23, 59, 47)), g2 = f.utcToGps(Date.UTC(2019, 3, 6, 23, 59, 42));
  eq([g1.week, g1.tow], [1024, 0], '1st rollover 1999-08-21 23:59:47 UTC'); eq([g2.week, g2.tow], [2048, 0], '2nd rollover 2019-04-06 23:59:42 UTC');
  eq(f.utcToGps(Date.UTC(2026, 9, 18, 9)).leap, 18, 'GPS − UTC = 18 s');
}

// ---------------------------------------------------------------- 08 satpos: IS-GPS-200N 표 20-IV = RTKLIB eph2pos()
{
  const src = read('satpos'), pre = src.match(/  const MU = [^\n]*\n/)[0] + src.match(/  const EPH = [^\n]*\n/)[0];
  const f = load('satpos', ['satPos', 'satClock', 'sagnac', 'llh2ecef'], pre);
  const c = vm.createContext({}); vm.runInContext(pre + ';this.EPH = EPH;', c); const EPH = c.EPH;
  // RTKLIB ephemeris.c eph2pos() 그대로(atan2로 u, 반복 RTOL_KEPLER 1E-13)
  const eph2pos = (eph, t) => {
    const mu = 3.9860050e14, omge = 7.2921151467e-5, A = eph.sqrtA ** 2, tk = t - eph.toe;
    const M = eph.M0 + (Math.sqrt(mu / (A * A * A)) + eph.dn) * tk; let E = M, Ek = 0, n = 0;
    for (; Math.abs(E - Ek) > 1e-13 && n < 30; n++) { Ek = E; E -= (E - eph.e * Math.sin(E) - M) / (1.0 - eph.e * Math.cos(E)); }
    let u = Math.atan2(Math.sqrt(1 - eph.e * eph.e) * Math.sin(E), Math.cos(E) - eph.e) + eph.omg, r = A * (1 - eph.e * Math.cos(E)), i = eph.i0 + eph.idot * tk;
    const s2 = Math.sin(2 * u), c2 = Math.cos(2 * u); u += eph.cus * s2 + eph.cuc * c2; r += eph.crs * s2 + eph.crc * c2; i += eph.cis * s2 + eph.cic * c2;
    const x = r * Math.cos(u), y = r * Math.sin(u), O = eph.OMG0 + (eph.OMGd - omge) * tk - omge * eph.toe;
    const dts = eph.af0 + eph.af1 * (t - eph.toc) + eph.af2 * (t - eph.toc) ** 2 - (2 * Math.sqrt(mu * A) * eph.e * Math.sin(E)) / (299792458.0 ** 2);
    return [x * Math.cos(O) - y * Math.cos(i) * Math.sin(O), x * Math.sin(O) + y * Math.cos(i) * Math.cos(O), y * Math.sin(i), dts];
  };
  for (const e of [0, 0.0105, 0.03]) for (let tk = -14400; tk <= 14400; tk += 600) {
    const E = { ...EPH, e }, p = f.satPos(E, E.toe + tk), q = eph2pos(E, E.toe + tk);
    ok(Math.hypot(p.x - q[0], p.y - q[1], p.z - q[2]) < 1e-3, `ICD == RTKLIB pos e=${e} tk=${tk}`);
    close(f.satClock(E, E.toe + tk, p.E), q[3], 1e-15, `clock e=${e} tk=${tk}`);
  }
  // F = −2√μ/c²
  close(-2 * Math.sqrt(3.986005e14) / 299792458 ** 2, -4.442807633e-10, 1e-18, 'F constant');
  close(4.442807633e-10 * 0.01 * 5153.65 * 1e9, 22.9, 0.1, 'Δtr max 23 ns for e=0.01');
  // 주 경계 처리
  const pw = f.satPos(EPH, EPH.toe + 604800 - 100); eq(pw.tk, -100, 'week crossover tk');
  const rr = f.llh2ecef(0, 0, 0); close(rr[0], 6378137, 1e-6, 'llh2ecef equator');
  // 사냐크: 서울에서 동쪽 앙각 20° 위성 → 약 −27 m (RTKLIB geodist와 같은 식)
  { const pv = load('position', ['satFromAzEl']), D = Math.PI / 180, r2 = f.llh2ecef(37.5 * D, 127 * D, 0), sp = pv.satFromAzEl(r2, 37.5 * D, 127 * D, 90 * D, 20 * D, 26559710); close(f.sagnac(sp, r2), -27.4, 0.1, 'Sagnac east 20°'); close(f.sagnac(pv.satFromAzEl(r2, 37.5 * D, 127 * D, 0, 90 * D, 26559710), r2), 0, 1e-6, 'Sagnac zenith ≈ 0'); }
}

// ---------------------------------------------------------------- 09 position: RTKLIB dops(), estpos()
{
  const src = read('position'), pre = src.match(/  const D = Math.PI \/ 180;\n/)[0];
  const f = load('position', ['inv', 'dops', 'solvePos', 'satFromAzEl'], pre);
  // RTKLIB dops를 다른 방법(여인수 전개 역행렬)으로 다시 계산해 비교
  const det = (m) => m.length === 1 ? m[0][0] : m[0].reduce((s, v, j) => s + (j % 2 ? -1 : 1) * v * det(m.slice(1).map((r) => r.filter((_, k) => k !== j))), 0);
  const cofInv = (m) => { const d = det(m); return m.map((_, i) => m.map((_, j) => ((i + j) % 2 ? -1 : 1) * det(m.filter((_, r) => r !== j).map((r) => r.filter((_, k) => k !== i))) / d)); };
  let s = 7; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 50; k++) {
    const az = Array.from({ length: 4 + Math.floor(rnd() * 8) }, () => [rnd() * 2 * Math.PI, (5 + rnd() * 85) * Math.PI / 180]);
    const H = az.map(([a, e]) => [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e), 1]), N = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => H.reduce((t, h) => t + h[i] * h[j], 0))), Q = cofInv(N);
    const ref = [Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2] + Q[3][3]), Math.sqrt(Q[0][0] + Q[1][1] + Q[2][2]), Math.sqrt(Q[0][0] + Q[1][1]), Math.sqrt(Q[2][2])], d = f.dops(az, 0);
    ok(d.every((v, i) => Math.abs(v - ref[i]) < 1e-9 * Math.max(1, ref[i])), 'dops == reference #' + k);
  }
  const sq = [[0, 90], [0, 0.0001], [90, 0.0001], [180, 0.0001], [270, 0.0001]].map(([a, e]) => [a * Math.PI / 180, e * Math.PI / 180]); ok(f.dops(sq.slice(0, 3), 0) === null, '< 4 sats → null');
  // 잡음 없는 측위: 지구 중심 출발, 정확한 위치·시계
  const lat = 37.5 * Math.PI / 180, lon = 127 * Math.PI / 180, a = 6378137, fl = 1 / 298.257223563, e2 = fl * (2 - fl), Nn = a / Math.sqrt(1 - e2 * Math.sin(lat) ** 2), rr = [Nn * Math.cos(lat) * Math.cos(lon), Nn * Math.cos(lat) * Math.sin(lon), Nn * (1 - e2) * Math.sin(lat)];
  const sats = [[0, 75], [45, 30], [135, 25], [225, 35], [315, 20], [90, 55]].map(([az, el]) => f.satFromAzEl(rr, lat, lon, az * Math.PI / 180, el * Math.PI / 180, 26559710));
  ok(sats.every((p) => Math.abs(Math.hypot(...p) - 26559710) < 1e-3), 'satFromAzEl radius');
  const R = f.solvePos(sats, sats.map((p) => Math.hypot(p[0] - rr[0], p[1] - rr[1], p[2] - rr[2]) + 250));
  ok(Math.hypot(R.x[0] - rr[0], R.x[1] - rr[1], R.x[2] - rr[2]) < 1e-3 && Math.abs(R.x[3] - 250) < 1e-3, 'exact solve from earth center'); ok(R.hist.length <= 10, 'converges ≤ MAXITR 10');
}

// ---------------------------------------------------------------- 10 errors: 그림 20-4 = RTKLIB ionmodel(), tropmodel()
{
  const src = read('errors'), pre = 'const PI = Math.PI, C = 299792458, D = PI / 180;\n' + src.match(/  const ION = [^\n]*\n/)[0];
  const f = load('errors', ['klobuchar', 'saastamoinen', 'ionoDelay', 'ifCoef', 'budget'], pre); const D = Math.PI / 180;
  const c = vm.createContext({}); vm.runInContext(pre + ';this.ION = ION;', c); const ION = c.ION;
  // RTKLIB rtkcmn.c ionmodel() 그대로 (time2gpst의 주내 초 = tow)
  const ionmodel = (ion, pos, azel, tow) => {
    if (pos[2] < -1e3 || azel[1] <= 0) return 0; const PI = 3.1415926535897932;
    const psi = 0.0137 / (azel[1] / PI + 0.11) - 0.022; let phi = pos[0] / PI + psi * Math.cos(azel[0]);
    if (phi > 0.416) phi = 0.416; else if (phi < -0.416) phi = -0.416;
    const lam = pos[1] / PI + (psi * Math.sin(azel[0])) / Math.cos(phi * PI); phi += 0.064 * Math.cos((lam - 1.617) * PI);
    let tt = 43200.0 * lam + tow; tt -= Math.floor(tt / 86400.0) * 86400.0;
    const fs = 1.0 + 16.0 * Math.pow(0.53 - azel[1] / PI, 3.0); let amp = ion[0] + phi * (ion[1] + phi * (ion[2] + phi * ion[3])), per = ion[4] + phi * (ion[5] + phi * (ion[6] + phi * ion[7]));
    amp = amp < 0 ? 0 : amp; per = per < 72000 ? 72000 : per; const x = (2.0 * PI * (tt - 50400.0)) / per;
    return 299792458.0 * fs * (Math.abs(x) < 1.57 ? 5e-9 + amp * (1.0 + x * x * (-0.5 + (x * x) / 24.0)) : 5e-9);
  };
  let s = 3; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 500; k++) { const pos = [(rnd() - 0.5) * 3, (rnd() - 0.5) * 6.2, 0], azel = [rnd() * 6.28, (1 + rnd() * 89) * D], tow = rnd() * 604800; close(f.klobuchar(ION, pos, azel, tow), ionmodel(ION, pos, azel, tow), 1e-9, 'Klobuchar == RTKLIB #' + k); }
  // RTKLIB tropmodel() 그대로
  const tropmodel = (pos, el, humi) => { const hgt = pos[2] < 0 ? 0 : pos[2], pres = 1013.25 * Math.pow(1.0 - 2.2557e-5 * hgt, 5.2568), temp = 15.0 - 6.5e-3 * hgt + 273.16, e = 6.108 * humi * Math.exp((17.15 * temp - 4684.0) / (temp - 38.45)), z = Math.PI / 2.0 - el; return (0.0022768 * pres) / (1.0 - 0.00266 * Math.cos(2.0 * pos[0]) - (0.00028 * hgt) / 1e3) / Math.cos(z) + (0.002277 * (1255.0 / temp + 0.05) * e) / Math.cos(z); };
  for (let k = 0; k < 200; k++) { const pos = [(rnd() - 0.5) * 3, 0, rnd() * 5000], el = (2 + rnd() * 88) * D, hu = rnd(); close(f.saastamoinen(pos, el, hu), tropmodel(pos, el, hu), 1e-9, 'Saastamoinen == RTKLIB #' + k); }
  const z = f.saastamoinen([37.5 * D, 0, 0], 90 * D, 0.7); close(z, 2.45, 0.1, 'zenith ≈ 2.4 m'); ok(f.saastamoinen([37.5 * D, 0, 0], 5 * D, 0.7) > 20, '5° > 20 m');
  close(1 - f.saastamoinen([37.5 * D, 0, 3000], 90 * D, 0.7) / z, 0.31, 0.03, '3000 m −30%');
  close(f.ionoDelay(40, 1575.42e6), 6.49, 0.01, 'TEC 40 → 6.5 m'); close((1575.42 / 1176.45) ** 2, 1.793, 0.001, 'L5/L1 1.793');
  const L5 = f.ifCoef(1575.42e6, 1176.45e6), L2 = f.ifCoef(1575.42e6, 1227.6e6);
  close(L5.a, 2.261, 0.001, 'IF L1/L5 a'); close(L5.b, -1.261, 0.001, 'IF L1/L5 b'); close(L5.amp, 2.59, 0.01, 'noise ×2.59'); close(L2.amp, 2.98, 0.01, 'L1/L2 ×2.98');
  close(L5.a * f.ionoDelay(40, 1575.42e6) + L5.b * f.ionoDelay(40, 1176.45e6), 0, 1e-9, 'IF removes iono');
}

// ---------------------------------------------------------------- 11 urban
{
  const f = load('urban', ['maskEl', 'nlosExcess', 'hvdop']);
  const D = Math.PI / 180;
  close(f.maskEl(90 * D, 0, 20, 40) / D, 75.96, 0.01, 'quiz: 20 m street, 40 m → 76°'); eq(f.maskEl(0, 0, 20, 40), 0, 'along street open');
  close(f.maskEl(90 * D, 0, 20, 60) / D, 80.5, 0.1, '20 m, 60 m → 80°');
  // 반사 기하: 거울상 수신기에서 본 직선이 반사벽에서 h 아래, 맞은편 지붕 위를 지나야
  const ex = f.nlosExcess(90 * D, 40 * D, 0, 25, 25); ok(Number.isNaN(f.nlosExcess(90 * D, 40 * D, 0, 25, 60)), 'tall opposite building blocks the reflected path'); close(ex, 25 * Math.cos(40 * D), 1e-9, 'NLOS excess = w cos el |s|'); ok(Number.isNaN(f.nlosExcess(90 * D, 80 * D, 0, 25, 60)), 'too high → reflection above roof impossible');
  ok(Number.isNaN(f.nlosExcess(0, 30 * D, 0, 25, 60)), 'along street → no wall reflection');
}

// ---------------------------------------------------------------- 12 precise
{
  const f = load('precise', ['widelane', 'erf', 'roundOk', 'dgnssUere'], 'const C = 299792458;');
  close(f.widelane(1575.42e6, 1176.45e6), 0.7514, 0.0001, 'WL L1/L5 75.1 cm'); close(f.widelane(1575.42e6, 1227.6e6), 0.8619, 0.0001, 'WL L1/L2 86.2 cm');
  for (const x of [0.1, 0.5, 1, 2, 3]) close(f.erf(x), [0.1124629, 0.5204999, 0.8427008, 0.9953223, 0.9999779][[0.1, 0.5, 1, 2, 3].indexOf(x)], 3e-7, 'erf ' + x);
  const p = f.roundOk(0.05, 299792458 / 1575.42e6); close(p, 0.943, 0.002, 'L1 5 cm → 94%'); close(p ** 8, 0.625, 0.01, '8 ambiguities → 62%');
  ok(f.roundOk(0.05, f.widelane(1575.42e6, 1176.45e6)) > 0.999999, 'widelane ~100%');
  close(f.dgnssUere(50, 2), 1.01, 0.01, 'DGNSS 50 km ≈ 1 m');
}

// ---------------------------------------------------------------- 13 phone: Android GnssClock 식
{
  const f = load('phone', ['pseudorange', 'dutyCurrent', 'inertialDrift', 'odoDrift'], 'const C = 299792458, WEEK_NS = 604800e9;');
  // TimeNanos − FullBiasNanos − BiasNanos를 주내 ns로, 비행시간 72.3456 ms → 21,688.5 km
  const m = { timeNanos: '123456789012345', fullBiasNanos: '-1316950000123456789', biasNanos: 0.375, timeOffsetNanos: 0 };
  const wk = 604800n * 1000000000n, rx = Number(((BigInt(m.timeNanos) - BigInt(m.fullBiasNanos)) % wk + wk) % wk) - 0.375;
  const r = f.pseudorange({ ...m, receivedSvTimeNanos: rx - 72.3456e6 }); close(r.pr / 1000, 72.3456e-3 * 299792.458, 0.001, 'pseudorange 72.3456 ms');
  const r2 = f.pseudorange({ ...m, fullBiasNanos: String(BigInt(m.fullBiasNanos) - 1000n), receivedSvTimeNanos: rx - 72.3456e6 }); close(r2.pr - r.pr, 299.79, 0.01, '1 µs bias → 300 m');
  close(f.dutyCurrent(0.25, 25, 1), 7, 1e-12, 'duty 25% → 7 mA'); close(f.inertialDrift(0.05, 30), 22.5, 1e-12, '0.05 m/s², 30 s → 22 m'); close(f.inertialDrift(0.1, 20), 20, 1e-12, 'quiz 20 m');
}

// ---------------------------------------------------------------- 14 design
{
  const src = read('design'), pre = src.match(/  const D = Math.PI \/ 180, [^\n]*\n/)[0] + src.match(/  const SYS = [^\n]*\n/)[0];
  const f = load('design', ['sats', 'azEl', 'mask', 'hvdop', 'uere', 'accuracy'], pre);
  const D = Math.PI / 180, cnt = (ks, env, tt) => f.sats(ks, tt * 3600).map((x) => f.azEl(37.5 * D, 127 * D, x.p)).filter((a) => a[1] > 0 && a[1] > f.mask(env, a[0])).length;
  let out1 = 0, out2 = 0; for (let tt = 0; tt < 24; tt += 0.5) { if (cnt(['gps'], 'urban', tt) < 4) out1 += 0.5; if (cnt(['gps', 'gal'], 'urban', tt) < 4) out2 += 0.5; }
  ok(out1 > 6 && out2 === 0, 'urban: GPS only often < 4, + Galileo never');
  ok(f.uere('open', true, 'none') < f.uere('open', false, 'none') && f.uere('open', false, 'sbas') < f.uere('open', false, 'none'), 'L5 and SBAS reduce UERE');
  eq(f.accuracy('open', true, 'rtk', [1, 1.5], 8), [0.02, 0.03], 'RTK cm'); eq(f.accuracy('open', false, 'rtk', [1, 1.5], 8)[0] > 1, true, 'RTK needs dual frequency in model');
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
ok(tctx.window.GN_TERMS.every((t) => t.length === 4 && slugs.has(t[3])), 'every term points to a chapter');
// 본문의 모든 .term이 용어집 항목에 이어지는가(common.js 툴팁과 같은 규칙)
{
  const norm = (x) => x.replace(/\s+/g, '').toLowerCase(), keys = new Set();
  tctx.window.GN_TERMS.forEach((t) => { [t[0], t[0].replace(/\(.*?\)/g, ''), t[1], t[1].replace(/\(.*?\)/g, '')].forEach((k) => keys.add(norm(k))); t[0].split(/[\/·]/).forEach((k) => keys.add(norm(k))); for (const m of t[1].matchAll(/\(([A-Z][A-Za-z0-9]*[A-Z0-9])\)|^([A-Z][A-Za-z0-9]*[A-Z0-9]),/g)) keys.add(norm(m[1] || m[2])); });
  const al = tctx.window.GN_TERM_ALIAS || {};
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
console.log({ checks, compiledScriptBlocks: scripts, terms: tctx.window.GN_TERMS.length });
