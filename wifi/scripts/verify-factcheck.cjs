// WiFiBook 사실 검증: 챕터 안의 계산 함수를 꺼내 공개 구현(Linux cfg80211/mac80211, hostapd)의 코드·시험 벡터와 맞춰 본다.
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

// ---------------------------------------------------------------- 참조 구현: Linux net/wireless/util.c를 그대로 옮긴 것
const kernel = {
  channelToFreq(chan, band) { // ieee80211_channel_to_freq_khz (MHz로)
    if (chan <= 0) return 0;
    if (band === 2) { if (chan === 14) return 2484; if (chan < 14) return 2407 + chan * 5; return 0; }
    if (band === 5) { if (chan >= 182 && chan <= 196) return 4000 + chan * 5; return 5000 + chan * 5; }
    if (band === 6) { if (chan === 2) return 5935; if (chan <= 253) return 5950 + chan * 5; return 0; }
    return 0;
  },
  freqToChannel(freq) { // ieee80211_freq_khz_to_channel
    if (freq === 2484) return 14; else if (freq < 2484) return Math.trunc((freq - 2407) / 5);
    else if (freq >= 4910 && freq <= 4980) return Math.trunc((freq - 4000) / 5);
    else if (freq < 5925) return Math.trunc((freq - 5000) / 5); else if (freq === 5935) return 2;
    else if (freq <= 45000) return Math.trunc((freq - 5950) / 5); return 0;
  },
  validCenter(center, bw) { // chan.c cfg80211_valid_center_freq
    if (center < 5955 || center > 7215) return true;
    if (center - bw / 2 < 5945 || center + bw / 2 > 7225) return false;
    const step = bw === 320 ? 160 : bw; return (center - bw / 2 - 5945) % step === 0;
  },
};

// ---------------------------------------------------------------- 01 intro
{
  const f = load('intro', ['linkRateMbps']);
  close(f.linkRateMbps(108, 6, 5 / 6, 4, 3.6), 600, 1e-9, '802.11n max 600 Mb/s');
  close(f.linkRateMbps(468, 8, 5 / 6, 8, 3.6), 6933.33, 0.01, '802.11ac max 6.93 Gb/s');
  close(f.linkRateMbps(1960, 10, 5 / 6, 8, 13.6), 9607.84, 0.01, '802.11ax max 9.6 Gb/s');
  close(f.linkRateMbps(3920, 12, 5 / 6, 8, 13.6), 23058.82, 0.01, '802.11be 8SS ~23 Gb/s');
}

// ---------------------------------------------------------------- 02 bands
{
  const f = load('bands', ['channelToFreq', 'freqToChannel', 'valid6gCenter', 'sixGhzChannels', 'isPsc']);
  for (const band of [2, 5, 6]) for (let c = 0; c <= 260; c++) eq(f.channelToFreq(c, band), kernel.channelToFreq(c, band), `ch→f band ${band} ch ${c}`);
  for (let fr = 2412; fr <= 7125; fr += 5) eq(f.freqToChannel(fr), kernel.freqToChannel(fr), `f→ch ${fr}`);
  eq(f.channelToFreq(6, 2), 2437, '2.4 GHz ch6'); eq(f.channelToFreq(36, 5), 5180, '5 GHz ch36'); eq(f.channelToFreq(149, 5), 5745, '5 GHz ch149'); eq(f.channelToFreq(37, 6), 6135, '6 GHz ch37');
  eq([20, 40, 80, 160, 320].map((bw) => f.sixGhzChannels(bw).length), [59, 29, 14, 7, 6], '6 GHz channel counts per width');
  for (const bw of [20, 40, 80, 160, 320]) ok(f.sixGhzChannels(bw).every((c) => kernel.validCenter(c, bw)), '6 GHz centers valid per kernel, bw ' + bw);
  eq(Array.from({ length: 59 }, (_, i) => 1 + 4 * i).filter(f.isPsc).length, 15, '15 PSCs');
  eq(f.sixGhzChannels(320).map(f.freqToChannel), [31, 63, 95, 127, 159, 191], '320 MHz centers 31..191 (320-1/320-2)');
}

// ---------------------------------------------------------------- 04 mcs: Linux cfg80211_calculate_bitrate_*()를 옮긴 참조와 비교
{
  const f = load('mcs', ['symbolUs', 'linkRate', 'constellation', 'noiseFloorDbm'],
    'const MCS = [[1, 1 / 2], [2, 1 / 2], [2, 3 / 4], [4, 1 / 2], [4, 3 / 4], [6, 2 / 3], [6, 3 / 4], [6, 5 / 6], [8, 3 / 4], [8, 5 / 6], [10, 3 / 4], [10, 5 / 6], [12, 3 / 4], [12, 5 / 6]];' +
    'const NSD = { ht: { 20: 52, 40: 108 }, vht: { 20: 52, 40: 108, 80: 234, 160: 468 }, he: { 20: 234, 40: 468, 80: 980, 160: 1960 }, eht: { 20: 234, 40: 468, 80: 980, 160: 1960, 320: 3920 } };' +
    'const MAXMCS = { ht: 7, vht: 9, he: 11, eht: 13 };');
  const div = (a, b) => Math.floor(a / b);
  const kHT = (mcs, bw40, sgi) => { const m = mcs & 7, ss = (mcs >> 3) + 1; let br = bw40 ? 13500000 : 6500000; br *= m < 4 ? m + 1 : m === 4 ? m + 2 : m + 3; br *= ss; if (sgi) br = div(br, 9) * 10; return div(br + 50000, 100000); };
  const VHT = [[6500000, 13000000, 19500000, 26000000, 39000000, 52000000, 58500000, 65000000, 78000000, 86700000],
    [13500000, 27000000, 40500000, 54000000, 81000000, 108000000, 121500000, 135000000, 162000000, 180000000],
    [29300000, 58500000, 87800000, 117000000, 175500000, 234000000, 263300000, 292500000, 351000000, 390000000],
    [58500000, 117000000, 175500000, 234000000, 351000000, 468000000, 526500000, 585000000, 702000000, 780000000]];
  const kVHT = (bwIdx, mcs, nss, sgi) => { let br = VHT[bwIdx][mcs] * nss; if (sgi) br = div(br, 9) * 10; return div(br + 50000, 100000); };
  const DIVS = [102399, 51201, 34134, 25599, 17067, 12801, 11377, 10239, 8532, 7680, 6828, 6144, 5690, 5120];
  const R996 = [480388888, 453700000, 408333333], R484 = [229411111, 216666666, 195000000], R242 = [114711111, 108333333, 97500000];
  // 커널은 근사한 정수 나눗수(예: 1.111… × 6144 ≈ 6828)를 써서 정확한 공식보다 최대 약 0.03% 낮다
  const kHE = (base, mcs, nss) => { let tmp = BigInt(base) * 6144n / BigInt(DIVS[mcs]); tmp = tmp * BigInt(nss) / 8n; return Number(tmp / 10000n); };
  let n = 0;
  for (const bw of [20, 40]) for (let m = 0; m < 32; m++) for (const sgi of [0, 1]) { close(f.linkRate('ht', bw, m & 7, (m >> 3) + 1, sgi) * 10, kHT(m, bw === 40, sgi), 1, `HT bw${bw} mcs${m} sgi${sgi}`); n++; }
  [20, 40, 80, 160].forEach((bw, bi) => { for (let m = 0; m <= 9; m++) for (let s = 1; s <= 8; s++) for (const sgi of [0, 1]) { close(f.linkRate('vht', bw, m, s, sgi) * 10, kVHT(bi, m, s, sgi), 1.5 * s, `VHT bw${bw} mcs${m} nss${s} sgi${sgi}`); n++; } });
  const heBase = { 20: R242, 40: R484, 80: R996, 160: [960777777, 907400000, 816666666] };
  for (const bw of [20, 40, 80, 160]) for (let m = 0; m <= 11; m++) for (let s = 1; s <= 8; s++) for (const gi of [0, 1, 2]) { close(f.linkRate('he', bw, m, s, gi) * 10, kHE(heBase[bw][gi], m, s), Math.max(1.5, 0.001 * kHE(heBase[bw][gi], m, s)), `HE bw${bw} mcs${m} nss${s} gi${gi}`); n++; }
  for (let m = 0; m <= 13; m++) for (let s = 1; s <= 8; s++) for (const gi of [0, 1, 2]) { close(f.linkRate('eht', 320, m, s, gi) * 10, kHE(4 * R996[gi], m, s), Math.max(1.5, 0.001 * kHE(4 * R996[gi], m, s)), `EHT 320 mcs${m} nss${s} gi${gi}`); n++; }
  ok(n > 1000, 'rate combos compared: ' + n);
  close(f.linkRate('he', 80, 11, 2, 0), 1200.98, 0.01, 'Wi-Fi 6 80 MHz 2SS MCS11 = 1201 Mb/s');
  ok(isNaN(f.linkRate('ht', 80, 7, 1, 0)) && isNaN(f.linkRate('he', 320, 11, 1, 0)), 'unsupported widths');
  close(f.noiseFloorDbm(20e6, 0), -100.99, 0.01, 'thermal noise 20 MHz');
  const c = f.constellation(64); close(c.reduce((a, [x, y]) => a + x * x + y * y, 0) / c.length, 1, 1e-12, 'QAM unit power');
}

// ---------------------------------------------------------------- 05 mimo
{
  const f = load('mimo', ['outageMrc', 'capacity2x2', 'capacity1', 'arrayGain', 'steer', 'steerWithNull']);
  close(f.outageMrc(20, 10, 1), 1 - Math.exp(-0.1), 1e-12, 'Rayleigh outage 1 antenna');
  // 몬테카를로로 MRC 해석식 확인: 안테나별 |h|² ~ Exp(1), 합이 x보다 작을 확률
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) + 0.5) / 2147483648;
  for (const L of [2, 4]) { let bad = 0; const N = 200000, x = 0.5; for (let i = 0; i < N; i++) { let s = 0; for (let k = 0; k < L; k++) s -= Math.log(rnd()); if (s < x) bad++; } close(bad / N, f.outageMrc(0, 10 * Math.log10(x), L), 0.004, 'MRC outage MC L=' + L); }
  ok(f.outageMrc(20, 10, 2) < 0.006 && f.outageMrc(20, 10, 4) < 1e-5, 'diversity note numbers');
  close(f.capacity2x2(30, 0), 2 * Math.log2(501), 1e-9, '2x2 capacity rho=0');
  close(f.capacity2x2(20, 1), f.capacity1(20, 0) , 1e-9, 'rho=1 leaves one stream');
  for (const N of [1, 2, 4, 8]) close(10 * Math.log10(f.arrayGain(f.steer(N, 0.4), 0.4)), 10 * Math.log10(N), 1e-9, 'array gain N=' + N);
  const w = f.steerWithNull(4, 0.4, -0.7); ok(f.arrayGain(w, -0.7) < 1e-20, 'null toward second user');
  close(w.reduce((s, [a, b]) => s + a * a + b * b, 0), 1, 1e-12, 'null weights unit power');
}

// ---------------------------------------------------------------- 06 access: Linux ieee80211_frame_duration(), Bianchi 모델
{
  const f = load('access', ['ofdmTxUs', 'ctrlRate', 'aifsUs', 'exchangeUs', 'contention', 'edcaRace'],
    'const SIFS = 16, SLOT = 9, PRE = 20;');
  // 커널: dur = 16(SIFS+신호확장) + 16 + 4 + 4 × DIV_ROUND_UP((16 + 8 × (len + 4) + 6) × 10, 4 × rate), rate는 100 kb/s 단위, len은 FCS 제외
  const kDur = (len, rate100k) => 16 + 16 + 4 + 4 * Math.ceil(((16 + 8 * (len + 4) + 6) * 10) / (4 * rate100k));
  for (const r of [6, 9, 12, 18, 24, 36, 48, 54]) for (let len = 10; len <= 2304; len += 7) eq(f.ofdmTxUs(len + 4, r) + 16, kDur(len, r * 10), `frame duration ${len}B @${r}`);
  eq(f.ofdmTxUs(14, 24), 28, 'ACK @24 = 28 us');
  eq([f.aifsUs(2), f.aifsUs(3), f.aifsUs(7)], [34, 43, 79], 'AIFS VO/BE/BK');
  const tot = (p) => p.reduce((s, x) => s + x[1], 0);
  close((1500 * 8) / tot(f.exchangeUs(1500, 54, false)), 29.5, 0.1, '1500B @54 ≈ 30 Mb/s');
  ok((100 * 8) / tot(f.exchangeUs(100, 54, false)) / 54 < 0.1, '100B efficiency < 10%');
  eq(tot(f.exchangeUs(1500, 54, true)) - tot(f.exchangeUs(1500, 54, false)), 88, 'RTS/CTS overhead 88 us');
  // Bianchi(2000) 포화 모델의 충돌 확률과 비교 (W = 16, m = 6)
  const bianchi = (n, W, m) => { let lo = 0, hi = 0.999; for (let k = 0; k < 100; k++) { const p = (lo + hi) / 2, tau = (2 * (1 - 2 * p)) / ((1 - 2 * p) * (W + 1) + p * W * (1 - Math.pow(2 * p, m))); if (1 - Math.pow(1 - tau, n - 1) > p) lo = p; else hi = p; } return (lo + hi) / 2; };
  let s = 9; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) + 0.5) / 2147483648;
  for (const n of [2, 5, 10, 20, 50]) close(f.contention(n, 15, 1023, 100000, rnd).pColl, bianchi(n, 16, 6), 0.03, 'contention vs Bianchi n=' + n);
  eq(f.contention(1, 15, 1023, 1000, rnd).coll, 0, 'one station never collides');
  close(f.contention(10, 15, 1023, 100000, rnd).pColl, 0.37, 0.015, '10 stations ≈ 37%');
  const AC = { vo: { aifsn: 2, cw: 3 }, vi: { aifsn: 2, cw: 7 }, be: { aifsn: 3, cw: 15 }, bk: { aifsn: 7, cw: 15 } };
  const r = f.edcaRace(AC.vo, AC.be); close(r.a, 58 / 64, 1e-12, 'VO beats BE 58/64'); close(r.tie, 3 / 64, 1e-12, 'VO-BE tie');
  close(f.edcaRace(AC.vo, AC.vo).tie, 0.25, 1e-12, 'VO-VO tie 25%');
  ok(f.edcaRace(AC.bk, AC.be).b > 0.5, 'BE beats BK');
}

// ---------------------------------------------------------------- 07 frames: Linux ieee80211.h 상수, ieee80211_hdrlen(), get_SA/get_DA
{
  const f = load('frames', ['crc32', 'parseFC', 'hdrLen', 'addrRoles', 'beaconUs', 'beaconShare']);
  eq(f.crc32([...Buffer.from('123456789')]), 0xcbf43926, 'CRC-32 check value');
  // 커널 ieee80211_hdrlen() 그대로 (HT_CTL_LEN 4, QOS_CTL_LEN 2)
  const kHdr = (fc) => { const t = fc & 0x0c, a4 = (fc & 0x300) === 0x300, order = !!(fc & 0x8000); if (t === 0x0c) return 4; if (t === 0x08) { let h = a4 ? 30 : 24; if (fc & 0x80) { h += 2; if (order) h += 4; } return h; } if (t === 0x00) return order ? 28 : 24; if ((fc & 0xe0) === 0xc0) return 10; return 16; };
  for (let fc = 0; fc < 0x10000; fc += 4) if ((fc & 3) === 0) eq(f.hdrLen(fc), kHdr(fc), 'hdrlen fc=0x' + fc.toString(16));
  const p = f.parseFC(0x0080); eq([p.type, p.subtype], [0, 8], 'beacon = IEEE80211_STYPE_BEACON 0x0080');
  eq([f.parseFC(0x0088).type, f.parseFC(0x0088).subtype], [2, 8], 'QoS data 0x0088');
  eq([f.parseFC(0x00d4).subtype, f.parseFC(0x00b4).subtype, f.parseFC(0x00c4).subtype], [13, 11, 12], 'ACK/RTS/CTS');
  const flags = f.parseFC(0x0100 | 0x0200 | 0x0800 | 0x1000 | 0x2000 | 0x4000 | 0x8000);
  ok(flags.toDS && flags.fromDS && flags.retry && flags.pm && flags.moreData && flags.prot && flags.order && !flags.moreFrag, 'FCTL bits');
  // SA/DA: has_a4 → addr4, fromds → addr3, else addr2 / tods → addr3, else addr1
  for (const t of [0, 1]) for (const r of [0, 1]) {
    const roles = f.addrRoles(!!t, !!r), sa = t && r ? 3 : r ? 2 : 1, da = t ? 2 : 0;
    ok(roles[sa].startsWith('SA') && roles[da].startsWith('DA'), `address roles ToDS=${t} FromDS=${r}`);
  }
  // 커널 802.11b 분기: 10 + 192 + DIV_ROUND_UP(8 × (len + 4) × 10, rate100k); OFDM 분기: 16 + 20 + 4 × ...
  for (let len = 20; len <= 1000; len += 13) {
    eq(f.beaconUs(len + 4, 1) + 10, 10 + 192 + Math.ceil((8 * (len + 4) * 10) / 10), 'DSSS duration ' + len);
    for (const r of [6, 24]) eq(f.beaconUs(len + 4, r) + 16, 36 + 4 * Math.ceil(((16 + 8 * (len + 4) + 6) * 10) / (4 * r * 10)), `OFDM beacon ${len}@${r}`);
  }
  close(f.beaconShare(400, 1, 3, 4), 0.4, 0.01, 'beacons ≈ 40% at 1 Mb/s');
  close(f.beaconShare(400, 6, 3, 4), 0.066, 0.005, 'beacons ≈ 7% at 6 Mb/s');
}

// ---------------------------------------------------------------- 08 throughput
{
  const src = read('throughput'), links = src.match(/const LINKS = \{[\s\S]*?\n  \};/)[0];
  const f = load('throughput', ['mpduSlot', 'burstUs', 'goodput', 'maxAgg', 'baBitmap', 'packetFair', 'airtimeFair'], 'const SIFS = 16, AIFS = 43, BACKOFF = 67.5;\n' + links + '\nthis.LINKS = LINKS;');
  const vm2 = require('node:vm'), c = vm2.createContext({}); vm2.runInContext(links + ';this.L = LINKS;', c); const L = c.L;
  // 링크 속도가 4장(커널 검증)과 같은가
  close(L.n.ndbps / L.n.tsym, 300, 1e-9, 'HT40 2SS MCS15 SGI 300'); close(L.ac.ndbps / L.ac.tsym, 866.67, 0.01, 'VHT80 2SS MCS9 SGI');
  close(L.ax.ndbps / L.ax.tsym, 1200.98, 0.01, 'HE80 2SS MCS11'); close(L.be.ndbps / L.be.tsym, 5764.71, 0.01, 'EHT320 2SS MCS13');
  eq([L.n.maxN, L.ac.maxN, L.ax.maxN, L.be.maxN], [0x40, 0x40, 0x100, 0x400], 'BA window = IEEE80211_MAX_AMPDU_BUF_*');
  eq(L.n.maxBytes, 2 ** (13 + 3) - 1, 'HT max A-MPDU 65535'); eq(L.ac.maxBytes, 2 ** 20 - 1, 'VHT max A-MPDU 1M');
  eq(f.mpduSlot(1500), 1560, 'MPDU slot 1500B');
  close(f.goodput(L.ax, 1, 1500), 60, 5, 'Wi-Fi 6 single packet ≈ 60 Mb/s');
  close(f.goodput(L.ax, 64, 1500), 880, 15, 'Wi-Fi 6 64 packets ≈ 880 Mb/s');
  ok(f.goodput(L.be, 1, 1500) / f.goodput(L.ax, 1, 1500) < 1.1, 'Wi-Fi 7 single ≈ Wi-Fi 6 single');
  eq(f.maxAgg(L.a, 1500), 1, '11a no aggregation'); eq(f.maxAgg(L.n, 1500), 42, 'HT 64KB limit → 42 packets');
  eq(f.baBitmap([1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], 2), [0xf7, 0xfd], 'BA bitmap bit order');
  const pf = f.packetFair([880, 40]), af = f.airtimeFair([880, 40]);
  close(pf[0], 38.26, 0.01, 'packet-fair'); eq(af, [440, 20], 'airtime-fair');
}

// ---------------------------------------------------------------- 09 connect: mac80211 scan.c 시간, wpa_supplicant 로밍 규칙
{
  const f = load('connect', ['scanMs', 'minDiff', 'shouldRoam', 'rssiAt', 'walk', 'joinStats'], 'const NOISE = -95, GREAT_SNR = 25;');
  close(f.scanMs(1, 0), 2 * 1000 / 33, 1e-9, 'active = PROBE_DELAY + CHANNEL_TIME = 2 × HZ/33');
  close(f.scanMs(0, 1), 1000 / 9, 1e-9, 'passive = HZ/9');
  close(f.scanMs(13 + 9 + 15, 16), 4020, 10, 'full scan ≈ 4 s');
  // events.c min_diff 표: <-85 → 1, <-80 → 2, <-75 → 3, <-70 → 4, <0 → 5
  eq([-90, -86, -85, -81, -80, -76, -75, -71, -70, -40].map(f.minDiff), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], 'min_diff table');
  ok(!f.shouldRoam(-68, -60), 'SNR 27 dB > GREAT_SNR → stay'); ok(f.shouldRoam(-72, -67), '-72 → -67 (diff 5 ≥ 4) roam');
  ok(!f.shouldRoam(-72, -69), 'diff 3 < 4 stay'); ok(f.shouldRoam(-88, -87), 'very weak: 1 dB enough');
  const w = f.walk(40, -65, 10, false), wb = f.walk(40, -65, 10, true);
  close(w.roamT, 29.3, 0.05, 'default walk roams ≈ 29 m'); close(wb.roamT, 22, 0.05, '11v BTM ≈ 22 m');
  eq(f.walk(15, -65, 10, false).roamT, null, '15 m spacing: never roams');
  const src = read('connect'), c = vm.createContext({}); vm.runInContext(src.match(/const S = "단말"[\s\S]*?\n  STEPS\.ft = [^\n]*\n/)[0] + ';this.STEPS = STEPS;', c);
  eq(['psk', 'sae', 'eap', 'ft'].map((k) => f.joinStats(c.STEPS[k]).frames), [14, 16, 23, 4], 'join frame counts');
  eq(c.STEPS.psk.filter((s) => s[2].startsWith('EAPOL-Key')).length, 4, '4-way handshake');
}

// ---------------------------------------------------------------- 10 security: hostapd crypto_module_tests.c 시험 벡터
{
  const f = load('security', ['sha1', 'hmacSha1', 'pbkdf2Sha1', 'sha1Prf', 'cmpBytes', 'pmkToPtk', 'recommend']);
  const B = (s) => [...Buffer.from(s)];
  eq(X(f.sha1(B('abc'))), 'a9993e364706816aba3e25717850c26c9cd0d89d', 'SHA-1 abc');
  eq(X(f.sha1(B('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))), '84983e441c3bd26ebaae4aa1f95129e5e54670f1', 'SHA-1 2-block');
  // passphrase_tests
  eq(X(f.pbkdf2Sha1(B('password'), B('IEEE'), 4096, 32)), 'f42c6fc52df0ebef9ebb4b90b38a5f902e83fe1b135a70e23aed762e9710a12e', 'PSK vector 1');
  eq(X(f.pbkdf2Sha1(B('ThisIsAPassword'), B('ThisIsASSID'), 4096, 32)), '0dc0d6eb90555ed6419756b9a15ec3e3209b63df707dd508d14581f8982721af', 'PSK vector 2');
  eq(X(f.pbkdf2Sha1(B('a'.repeat(32)), B('Z'.repeat(32)), 4096, 32)), 'becb93866bb8c3832cb777c2f559807c8c59afcb6eae734885001300a981cc62', 'PSK vector 3');
  // prf0~prf2 (label "prefix")
  eq(X(f.sha1Prf(Array(20).fill(0x0b), 'prefix', B('Hi There'), 64)), 'bcd4c650b30b9684951829e0d75f9d54b862175ed9f00606e17d8da35402ffee75df78c3d31e0f889f012120c0862beb67753e7439ae242edb8373698356cf5a', 'PRF vector 0');
  eq(X(f.sha1Prf(B('Jefe'), 'prefix', B('what do ya want for nothing?'), 64)), '51f4de5b33f249adf81aeb713a3c20f4fe631446fabdfa58244759ae58ef9009a99abf4eac2ca5fa87e692c440eb40023e7babb206d61de7b92f41529092b8fc', 'PRF vector 1');
  eq(X(f.sha1Prf(Array(20).fill(0xaa), 'prefix', Array(50).fill(0xdd), 64)), 'e1ac546ec4cb636f9976487be5c86be17a0252ca5d8d8df12cfb0473525249ce9dd8d177ead710bc9b5905472391 07aef7b4abd43d87f0a68f1cbd9e2b6f7607'.replace(' ', ''), 'PRF vector 2');
  // PTK: 주소·난수 순서를 바꿔도 같은 결과, 난수가 바뀌면 다른 결과
  const pmk = Array(32).fill(1), a = [2, 0, 0, 0, 0, 1], s = [2, 0, 0, 0, 0, 2], n1 = Array(32).fill(3), n2 = Array(32).fill(4);
  const p1 = f.pmkToPtk(pmk, a, s, n1, n2), p2 = f.pmkToPtk(pmk, s, a, n2, n1);
  eq(X(p1.tk), X(p2.tk), 'PTK symmetric in Min/Max'); ok(X(f.pmkToPtk(pmk, a, s, n1, Array(32).fill(5)).tk) !== X(p1.tk), 'new nonce → new TK');
  eq(X(p1.kck).length + X(p1.kek).length + X(p1.tk).length, 96, 'PTK 48 bytes');
  ok(f.recommend('home', 'wpa3', true).mode.includes('SAE') && f.recommend('public', 'wpa3', false).mode.includes('OWE') && f.recommend('office', 'wpa3', false).mode.includes('802.1X'), 'advisor');
}

// ---------------------------------------------------------------- 11 power: mac80211 TIM 인코딩
{
  const f = load('power', ['timElement', 'timAids', 'avgCurrent'], 'const MAX_TIM_LEN = 251;');
  // 커널 그대로: n1 = 첫 비영 바이트 & 0xfe, n2 = 마지막 비영 바이트, 제어 = n1 | mcast
  const kTim = (aids, cnt, per, mc) => { const t = Array(251).fill(0); aids.forEach((a) => (t[a >> 3] |= 1 << (a & 7))); const m = cnt === 0 && mc ? 1 : 0; if (!aids.length) return [5, 4, cnt, per, m, 0]; let n1 = 0; for (let i = 0; i < 251; i++) if (t[i]) { n1 = i & 0xfe; break; } let n2 = n1; for (let i = 250; i >= n1; i--) if (t[i]) { n2 = i; break; } const b = [cnt, per, n1 | m, ...t.slice(n1, n2 + 1)]; return [5, b.length, ...b]; };
  let s = 5; const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let k = 0; k < 300; k++) { const n = Math.floor(rnd() * 6), aids = [...new Set(Array.from({ length: n }, () => 1 + Math.floor(rnd() * 2007)))].sort((a, b) => a - b), cnt = Math.floor(rnd() * 3), mc = rnd() < 0.5; const el = f.timElement(aids, cnt, 3, mc); eq(el, kTim(aids, cnt, 3, mc), 'TIM ' + aids); eq(f.timAids(el), aids, 'TIM roundtrip'); }
  eq(f.timElement([33], 0, 3, false), [5, 4, 0, 3, 4, 2], 'AID 33 → offset 4, 1 byte');
  eq(f.timElement([2, 60], 0, 3, false).length - 5, 8, 'AID 2+60 → 8 bytes');
  eq(f.timElement([], 0, 3, true), [5, 4, 0, 3, 1, 0], 'empty TIM with multicast');
  ok(f.timElement([], 1, 3, true)[4] === 0, 'mcast bit only on DTIM');
  const one = f.avgCurrent(102.4, 4, 60, 0.05), three = f.avgCurrent(307.2, 4, 60, 0.05);
  close(one / three, 2.88, 0.02, 'DTIM 1 → 3 ≈ 3x life'); ok(1000 / 60 < 24, 'always awake < 1 day');
}

// ---------------------------------------------------------------- 12 wifi6
{
  const src = read('wifi6'), pre = src.match(/const RU = [\s\S]*?const TSYM[^\n]*\n/)[0];
  const f = load('wifi6', ['ruRate', 'ruCount', 'dataUs', 'suAirtime', 'ruFor', 'ofdmaAirtime', 'srDecision'], pre);
  // 242/484/996은 4장(커널 검증)과 같아야 한다: 1SS MCS11 = 143.4 / 286.8 / 600.5
  close(f.ruRate(242, 11, 1), 143.38, 0.01, 'RU242 = 20 MHz'); close(f.ruRate(484, 11, 1), 286.76, 0.01, 'RU484 = 40 MHz'); close(f.ruRate(996, 11, 2), 1200.98, 0.01, 'RU996 2SS = 1201');
  // 각 폭에서 RU 개수 × 부반송파 ≤ 전체 부반송파(20 MHz 256, 40 512, 80 1024)
  for (const bw of [20, 40, 80]) for (const ru of [26, 52, 106, 242, 484, 996]) { const n = f.ruCount(bw, ru); ok(n * ru <= (bw / 20) * 256, `RU ${ru} x${n} fits ${bw}`); }
  eq([26, 52, 106, 242].map((r) => f.ruCount(20, r)), [9, 4, 2, 1], '20 MHz RU counts');
  close(f.ruRate(26, 7, 1), 8.82, 0.01, 'RU26 MCS7 ≈ 8.8');
  ok(9 * f.ruRate(26, 7, 1) < f.ruRate(242, 7, 1), '9×RU26 < RU242');
  ok(f.suAirtime(8, 100) / f.ofdmaAirtime(8, 100) > 4, 'OFDMA 8×100B > 4x'); ok(f.suAirtime(8, 1500) / f.ofdmaAirtime(8, 1500) < f.suAirtime(8, 100) / f.ofdmaAirtime(8, 100), 'gain shrinks with big packets');
  ok(f.srDecision(-76, -72, false).reuse && !f.srDecision(-76, -72, true).reuse, 'color decides');
  eq(f.srDecision(-70, -62, false).txMax, 1, 'PD -62 → tx 20 dB lower');
}

// ---------------------------------------------------------------- 13 wifi7: chan.c 펑처링 표
{
  const src = read('wifi7'), pre = src.match(/const PUNCT = \{[\s\S]*?\n  \};\n  const pop[^\n]*\n/)[0];
  const f = load('wifi7', ['validPuncture', 'bestPuncture', 'widestClean', 'tailProb', 'quantile'], pre);
  // Linux net/wireless/chan.c의 puncturing_values_80/160/320mhz[]를 그대로 옮겨 둔 것
  const CHAN_C = { 80: [0x8, 0x4, 0x2, 0x1], 160: [0x80, 0x40, 0x20, 0x10, 0x8, 0x4, 0x2, 0x1, 0xc0, 0x30, 0xc, 0x3],
    320: [0xc000, 0x3000, 0xc00, 0x300, 0xc0, 0x30, 0xc, 0x3, 0xf000, 0xf00, 0xf0, 0xf, 0xfc00, 0xf300, 0xf0c0, 0xf030, 0xf00c, 0xf003, 0xc00f, 0x300f, 0xc0f, 0x30f, 0xcf, 0x3f] };
  const tab = (bw) => CHAN_C[bw];
  const c = vm.createContext({}); vm.runInContext(pre + ';this.P = PUNCT;', c);
  for (const bw of [80, 160, 320]) eq(c.P[bw], tab(bw), 'puncturing table ' + bw);
  // 커널 valid_puncturing_bitmap()과 모든 비트맵·주 채널 조합 비교(80/160 전수, 320은 표 + 무작위)
  const kValid = (bw, p, pri) => (!p ? true : p & (1 << pri) ? false : tab(bw).includes(p));
  for (const bw of [80, 160]) for (let p = 0; p < 1 << (bw / 20); p++) for (let pri = 0; pri < bw / 20; pri++) eq(f.validPuncture(bw, p, pri), kValid(bw, p, pri), `valid ${bw} ${p} ${pri}`);
  for (let p = 0; p < 65536; p += 7) for (const pri of [0, 5, 15]) eq(f.validPuncture(320, p, pri), kValid(320, p, pri), `valid 320 ${p}`);
  eq(f.bestPuncture(320, 1 << 13, 2), 0x3000, '320: one busy → 40 MHz hole'); eq(f.widestClean(320, 1 << 13, 2), 160, 'no puncturing → 160');
  eq(f.bestPuncture(320, 1 << 2, 2), null, 'primary busy'); eq(f.widestClean(320, 1 << 2, 2), 0, 'primary busy clean');
  close(f.quantile([0.6], 4, 0.01), 16.4, 0.05, 'p99 5G'); close(f.quantile([0.3], 4, 0.01), 13.6, 0.05, 'p99 6G'); close(f.quantile([0.6, 0.3], 4, 0.01), 5.78, 0.05, 'p99 MLO');
  close(f.tailProb([0.6, 0.3], 4, 2), 0.18 * Math.exp(-1), 1e-12, 'tail product');
}

// ---------------------------------------------------------------- 14 design
{
  const src = read('design'), pre = src.match(/const W = 14[\s\S]*?const EFF = [^\n]*\n/)[0];
  const f = load('design', ['crosses', 'wallLoss', 'fspl', 'rssi', 'noiseDbm', 'goodputAt', 'meshRate', 'backhaulRate'], pre);
  close(f.fspl(1, 2437), 40.2, 0.05, 'FSPL 1 m 2.4 GHz'); close(f.fspl(10, 5500), 67.3, 0.05, 'FSPL 10 m 5.5 GHz');
  close(f.noiseDbm(5), -174 + 79.03 + 7, 0.01, 'noise 80 MHz');
  ok(f.crosses(0, 0, 2, 2, 0, 2, 2, 0) && !f.crosses(0, 0, 1, 0, 0, 1, 1, 1), 'segment crossing');
  // 4장 MCS 11 2SS 80 MHz = 1201 Mb/s × 0.65
  close(f.goodputAt(0, 5), 1200.98 * 0.65, 0.1, 'max goodput 5 GHz');
  const ap = { x: 0.8, y: 0.8 }, mid = { x: 9, y: 4.8 }, node = { x: 12.5, y: 4.8 }, room2 = { x: 12.5, y: 7.8 };
  eq(f.goodputAt(f.rssi(ap, room2, 5, 'con'), 5), 0, 'corner AP → room 2 cut off');
  ok(Math.min(...[[3.5, 2.8], [12, 2], [2.5, 7.8], [7, 7.8], [12.5, 7.8]].map(([x, y]) => f.goodputAt(f.rssi(mid, { x, y }, 5, 'con'), 5))) > 180, 'center AP worst > 180');
  const d = f.goodputAt(f.rssi(ap, room2, 5, 'con'), 5), v = f.goodputAt(f.rssi(node, room2, 5, 'con'), 5);
  const r = (m) => f.meshRate(d, v, f.backhaulRate(ap, node, 'con', m), m);
  ok(r('wifi') < r('ded') && r('ded') < r('wired'), 'backhaul ordering'); close(r('wifi'), 1 / (1 / v + 1 / f.backhaulRate(ap, node, 'con', 'wifi')), 1e-9, 'same-band harmonic');
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
ok(tctx.window.WF_TERMS.every((t) => t.length === 4 && slugs.has(t[3])), 'every term points to a chapter');
// 본문의 모든 .term이 용어집 항목에 이어지는가(common.js 툴팁과 같은 규칙)
{
  const norm = (x) => x.replace(/\s+/g, '').toLowerCase(), keys = new Set();
  tctx.window.WF_TERMS.forEach((t) => { [t[0], t[0].replace(/\(.*?\)/g, ''), t[1], t[1].replace(/\(.*?\)/g, '')].forEach((k) => keys.add(norm(k))); t[0].split(/[\/·]/).forEach((k) => keys.add(norm(k))); for (const m of t[1].matchAll(/\(([A-Z][A-Za-z0-9]*[A-Z0-9])\)|^([A-Z][A-Za-z0-9]*[A-Z0-9]),/g)) keys.add(norm(m[1] || m[2])); });
  const al = tctx.window.WF_TERM_ALIAS || {};
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
console.log({ checks, compiledScriptBlocks: scripts, terms: tctx.window.WF_TERMS.length });
