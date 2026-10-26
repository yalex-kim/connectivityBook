/**
 * BluetoothBook 입문 4장(bluetooth/chapters/hopping.html)의 계산 함수를 그대로 옮긴 것.
 * scripts/check-book.mjs가 책의 원본과 같은 값을 내는지 확인한다.
 */

/** LE 범용 채널 번호(0~36) → 주파수(MHz). [Vol 6] Part B Table 1.3 */
export function dataChFreq(ch: number): number {
  return ch <= 10 ? 2404 + 2 * ch : 2428 + 2 * (ch - 11);
}

/** Wi-Fi 채널(20 MHz)과 겹치는 LE 범용 채널 목록 */
export function wifiBlocked(wifiChannels: number[]): Set<number> {
  const out = new Set<number>();
  wifiChannels.forEach((w) => {
    const fc = 2407 + 5 * w;
    for (let c = 0; c < 37; c++) if (Math.abs(dataChFreq(c) - fc) < 11) out.add(c);
  });
  return out;
}

/** 8비트씩 비트 순서 뒤집기 */
export function perm16(v: number): number {
  const rev8 = (b: number) => {
    let r = 0;
    for (let i = 0; i < 8; i++) if (b & (1 << i)) r |= 1 << (7 - i);
    return r;
  };
  return (rev8((v >> 8) & 0xff) << 8) | rev8(v & 0xff);
}

/** 채널 선택 알고리즘 #2의 이벤트 채널. [Vol 6] Part B §4.5.8.3 */
export function csa2Channel(counter: number, chId: number, map: boolean[]): number {
  let u = (counter ^ chId) & 0xffff;
  for (let i = 0; i < 3; i++) {
    u = perm16(u);
    u = (17 * u + chId) & 0xffff;
  }
  const prnE = (u ^ chId) & 0xffff,
    un = prnE % 37;
  if (map[un]) return un;
  const used: number[] = [];
  for (let c = 0; c < 37; c++) if (map[c]) used.push(c);
  return used[Math.floor((used.length * prnE) / 65536)];
}

/** 재현 가능한 의사 난수(mulberry32) */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const WIFI = [1, 6, 11];
export const DUTY = 0.5;
export const CH_ID = 0x305f + 13; // 책 시뮬레이터와 같은 채널 식별자

export type Event = { ch: number; busy: number[]; hit: boolean };

/** 손실률 ≈ 덮인 채널 비율 × Wi-Fi가 말하는 시간 비율 */
export function expectedLoss(wifi: number[], duty: number): number {
  return (wifiBlocked(wifi).size / 37) * duty;
}

/** 연결 이벤트 n개: 채널, 그 순간 Wi-Fi가 막은 채널, 충돌 여부 */
export function simulate(n: number, afh: boolean, seed = 42): Event[] {
  const blocked = wifiBlocked(WIFI), r = rng(seed);
  const map = Array.from({ length: 37 }, (_, c) => (afh ? !blocked.has(c) : true));
  const out: Event[] = [];
  for (let e = 0; e < n; e++) {
    const busy: number[] = [];
    blocked.forEach((c) => {
      if (r() < DUTY) busy.push(c);
    });
    const ch = csa2Channel(e, CH_ID, map);
    out.push({ ch, busy, hit: busy.includes(ch) });
  }
  return out;
}

/* ---------------------------------------------------------------- 광고와 발견 (입문 5장 advertising.html) */

/** 레거시 광고 패킷의 공중 시간(µs, LE 1M): 프리앰블 1 + 접근 주소 4 + 헤더 2 + AdvA 6 + AdvData + CRC 3 */
export function advAirtimeUs(advDataLen: number): number { return (1 + 4 + 2 + 6 + advDataLen + 3) * 8; }

/** 책 시뮬레이터의 의사 난수(xorshift32, common.js의 BT.rng) */
export function bookRng(seed = 1): () => number {
  let x = seed >>> 0 || 1;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}

export type DiscParams = { ta: number; ts: number; tw: number; pkt: number; gap: number; limit: number };
/** 광고자가 스캐너에게 처음 발견되는 시각(ms). 책의 discoveryLatency와 같은 식 */
export function discoveryLatency(p: DiscParams, rnd: () => number): number {
  const pkt = p.pkt, gap = p.gap, limit = p.limit;
  const scanPhase = rnd() * p.ts, chOffset = Math.floor(rnd() * 3);
  let t = rnd() * (p.ta + 10);
  while (t < limit) {
    for (let k = 0; k < 3; k++) {
      const s = t + k * gap, e = s + pkt;
      const i = Math.floor((s - scanPhase) / p.ts);
      const ws = scanPhase + i * p.ts, we = ws + p.tw;
      const scanCh = (((i + chOffset) % 3) + 3) % 3;
      if (s >= ws && e <= we && scanCh === k) return e;
    }
    t += p.ta + rnd() * 10;
  }
  return Infinity;
}

/** 조건 하나의 1분 안에 찾은 비율(0~1): 책 시뮬레이터처럼 같은 씨앗으로 600번 */
export function foundWithin(ta: number, ts: number, windowPct: number): number {
  const p: DiscParams = { ta, ts, tw: Math.max(PKT + 0.05, (ts * windowPct) / 100), pkt: PKT, gap: GAP, limit: 60000 };
  const r = bookRng(2024);
  let n = 0;
  for (let i = 0; i < 600; i++) if (Number.isFinite(discoveryLatency(p, r))) n++;
  return n / 600;
}
/** 조건 하나의 평균 발견 시간(ms, 1분 안에 찾은 경우만): 책 시뮬레이터처럼 같은 씨앗으로 600번 */
export const PKT = advAirtimeUs(31) / 1000, GAP = 0.6;
export function meanDiscovery(ta: number, ts: number, windowPct: number): number {
  const p: DiscParams = { ta, ts, tw: Math.max(PKT + 0.05, (ts * windowPct) / 100), pkt: PKT, gap: GAP, limit: 60000 };
  const r = bookRng(2024), res: number[] = [];
  for (let i = 0; i < 600; i++) res.push(discoveryLatency(p, r));
  const fin = res.filter((x) => Number.isFinite(x));
  return fin.reduce((a, b) => a + b, 0) / fin.length;
}

/* ---------------------------------------------------------------- 입문 2장(radio.html)의 링크 버짓 */
const LIGHT = 299792458;
/** 자유 공간 경로 손실(dB) */
export function fspl(dMeters: number, fHz: number): number {
  return 20 * Math.log10((4 * Math.PI * dMeters * fHz) / LIGHT);
}
/** 실내 로그 거리 모델: 1 m까지 자유 공간, 그 뒤 10·n·log10(d) */
export function pathLoss(dMeters: number, n: number, fHz: number): number {
  return fspl(1, fHz) + 10 * n * Math.log10(Math.max(dMeters, 0.01));
}
/** 마진이 0이 되는 거리(m) */
export function maxRange(txDbm: number, extraLossDb: number, sensDbm: number, n: number, fHz: number): number {
  return Math.pow(10, (txDbm - extraLossDb - sensDbm - fspl(1, fHz)) / (10 * n));
}
export const F_BT = 2.44e9; // 책 시뮬레이터와 같은 중심 주파수
/** 같은 조건에서 dB만큼 예산이 늘거나 줄 때 도달 거리 배율 (maxRange의 비) */
export const rangeFactor = (db: number, n: number) => Math.pow(10, db / (10 * n));

/* ---------------------------------------------------------------- 입문 6장(connection.html)의 연결 파라미터 규칙 */
/** 사양 규칙 검사. 시간 단위 µs. [Vol 6] Part B §4.5.1·§4.5.2 */
export function checkConnParams(intervalUs: number, latency: number, subrate: number, timeoutMs: number, sci: boolean): string[] {
  const errs: string[] = [];
  if (intervalUs < 375 || intervalUs > 4e6 || intervalUs % 125) errs.push("간격은 125 µs 단위 375 µs ~ 4 s");
  else if (!sci && (intervalUs < 7500 || intervalUs % 1250)) errs.push("SCI 미지원: 1.25 ms 단위 7.5 ms 이상(BCV)만");
  if (subrate * (latency + 1) > 500) errs.push("subrate × (지연 + 1) ≤ 500");
  if (timeoutMs < 100 || timeoutMs > 32000 || timeoutMs % 10) errs.push("타임아웃은 10 ms 단위 100 ms ~ 32 s");
  if (!(timeoutMs * 1000 > (1 + latency) * subrate * intervalUs * 2)) errs.push("타임아웃 > (1 + 지연) × subrate × 간격 × 2");
  return errs;
}
/** 빈 PDU 하나의 공중 시간(µs, LE 1M): 프리앰블 1 + 접근 주소 4 + 헤더 2 + CRC 3바이트. [Vol 6] Part B §2.1·§2.4 */
export const EMPTY_PDU_US = (1 + 4 + 2 + 3) * 8;
/** 빈 PDU를 한 번 주고받는 연결 이벤트의 길이(µs): 센트럴 → T_IFS 150 µs → 페리페럴 */
export const EMPTY_EVENT_US = EMPTY_PDU_US + 150 + EMPTY_PDU_US;

/* ---------------------------------------------------------------- 입문 7장(gatt.html)의 심박 측정값 해석 (Heart Rate Service 사양, Core 밖) */
export type HeartRate = { u16: boolean; contact: number; energy: boolean; rr: boolean; bpm: number; kj?: number; rrs: number[] };
export function parseHeartRate(bytes: number[]): HeartRate {
  const f = bytes[0], out = { u16: !!(f & 1), contact: (f >> 1) & 3, energy: !!(f & 8), rr: !!(f & 16) } as HeartRate;
  let i = 1;
  out.bpm = out.u16 ? bytes[i] | (bytes[i + 1] << 8) : bytes[i]; i += out.u16 ? 2 : 1;
  if (out.energy) { out.kj = bytes[i] | (bytes[i + 1] << 8); i += 2; }
  out.rrs = []; if (out.rr) while (i + 1 < bytes.length) { out.rrs.push((bytes[i] | (bytes[i + 1] << 8)) / 1024); i += 2; }
  return out;
}

/* ---------------------------------------------------------------- 입문 9·10·11장의 계산 (power.html, audio.html, location.html) */
/** 평균 전류(µA) = 수면 전류 + 이벤트 전하(µC) ÷ 간격(s) */
export function averageCurrentUa(sleepUa: number, eventQuC: number, intervalS: number): number { return sleepUa + eventQuC / intervalS; }
/** 창 넓히기(µs): 마지막 동기 이후 시간 × 시계 오차 + 16 µs. [Vol 6] Part B §4.5.7 */
export function windowWideningUs(ppm: number, sinceSyncUs: number): number { return (ppm / 1e6) * sinceSyncUs + 16; }
/** CIS 전달 확률: 서브이벤트 NSE, 버스트 BN, 기한 FT, 한 번 보낼 때 손실 p */
export function cisDelivery(p: number, nse: number, bn: number, ft: number): number { return 1 - Math.pow(p, (nse / bn) * ft); }
/** RSSI → 거리(m) */
export function rssiToDistance(rssi: number, p1m: number, n: number): number { return Math.pow(10, (p1m - rssi) / (10 * n)); }
/** 두 안테나의 위상 차 → 도래각(rad) */
export function aoaAngle(dphi: number, d: number, lambda: number): number { const s = (dphi * lambda) / (2 * Math.PI * d); return Math.abs(s) <= 1 ? Math.asin(s) : NaN; }

/* 심화 3장(scheduling.html) 스케줄러 예시 모델: 사양이 아니라 사양의 제약(겹치지 않음, 감독 타임아웃 안에 한 번)을 지키는 한 가지 방식 */
export type SchedTask = { name: string; period: number; dur: number; prio: number; offset?: number; background?: boolean };
export type SchedRun = { task: string; t: number; dur: number; ok: boolean; background?: boolean };
/** 회차들을 시각순으로 놓고, 겹치면 점수(우선순위, rule이 "starve"면 + 10 × 연속으로 진 횟수)가 높은 쪽을 남긴다. 시각은 ms */
export function schedule(tasks: SchedTask[], horizon: number, rule: string): { runs: SchedRun[]; stats: Record<string, { skipped: number; maxGap: number }> } {
  type Occ = SchedRun & { prio: number; prev?: number };
  const occ: Occ[] = [];
  tasks.forEach((k) => { if (k.background || !(k.period > 0)) return; for (let t = (k.offset || 0) % k.period; t < horizon; t += k.period) occ.push({ task: k.name, t, dur: k.dur, prio: k.prio, ok: false }); });
  occ.sort((x, y) => x.t - y.t || y.prio - x.prio);
  const starve: Record<string, number> = {}; tasks.forEach((k) => (starve[k.name] = 0));
  const score = (o: Occ) => o.prio + (rule === "starve" ? 10 * starve[o.task] : 0);
  let last: Occ | null = null;
  for (const o of occ) {
    if (!last || o.t >= last.t + last.dur) { o.ok = true; o.prev = starve[o.task]; starve[o.task] = 0; last = o; continue; }
    if (score(o) > last.prio + (rule === "starve" ? 10 * (last.prev ?? 0) : 0)) { last.ok = false; starve[last.task] = (last.prev ?? 0) + 1; o.ok = true; o.prev = starve[o.task]; starve[o.task] = 0; last = o; }
    else starve[o.task]++;
  }
  const runs: SchedRun[] = occ.slice(), stats: Record<string, { skipped: number; maxGap: number }> = {};
  tasks.forEach((k) => {
    if (k.background) { for (let t = (k.offset || 0) % k.period; t < horizon; t += k.period) runs.push({ task: k.name, t, dur: k.dur, ok: true, background: true }); return; }
    const mine = occ.filter((o) => o.task === k.name), okT = mine.filter((o) => o.ok).map((o) => o.t);
    let gap = 0, prev = 0; okT.forEach((t) => { gap = Math.max(gap, t - prev); prev = t; }); gap = Math.max(gap, horizon - prev);
    stats[k.name] = { skipped: mine.filter((o) => !o.ok).length, maxGap: gap };
  });
  return { runs, stats };
}

/* 심화 4장(procedures.html): instant까지 d 이벤트, 페리페럴이 k(= factor × (latency + 1)) 이벤트마다 한 번 들을 때 기회 수와 모두 놓칠 확률 */
export function instantRisk(d: number, k: number, per: number): { chances: number; miss: number } { const n = Math.floor((d - 1) / k) + 1; return { chances: n, miss: Math.pow(per, n) }; }

/* 심화 12장(baseband.html) Classic 도약 선택 커널. addr = LAP | UAP₃₋₀ << 24, clk = Central의 28비트 클록. [Vol 2] Part B §2.6 */
export function perm5(z: number, p: number): number {
  const I1 = [0, 2, 1, 3, 0, 1, 0, 3, 1, 0, 2, 1, 0, 1], I2 = [1, 3, 2, 4, 4, 3, 2, 4, 4, 3, 4, 3, 3, 2];
  for (let i = 13; i >= 0; i--) if ((p >> i) & 1 && ((z >> I1[i]) & 1) !== ((z >> I2[i]) & 1)) z ^= (1 << I1[i]) | (1 << I2[i]);
  return z;
}
export function hopInputs(addr: number, clk: number) {
  const b = (x: number, i: number) => (x >>> i) & 1;
  const C = (b(addr, 8) << 4) | (b(addr, 6) << 3) | (b(addr, 4) << 2) | (b(addr, 2) << 1) | b(addr, 0);
  const E = (b(addr, 13) << 6) | (b(addr, 11) << 5) | (b(addr, 9) << 4) | (b(addr, 7) << 3) | (b(addr, 5) << 2) | (b(addr, 3) << 1) | b(addr, 1);
  const seg = (clk >>> 7) & 0x1fffff;
  return { X: (clk >>> 2) & 31, Y1: (clk >>> 1) & 1, A: ((addr >>> 23) & 31) ^ ((clk >>> 21) & 31), B: (addr >>> 19) & 15, C: C ^ ((clk >>> 16) & 31), D: ((addr >>> 10) & 0x1ff) ^ ((clk >>> 7) & 0x1ff), E, F: (16 * seg) % 79, seg };
}
export function basicHop(addr: number, clk: number) {
  const q = hopInputs(addr, clk), z = ((q.X + q.A) % 32) ^ q.B, po = perm5(z, ((q.C ^ (q.Y1 ? 31 : 0)) << 9) | q.D);
  const idx = (po + q.E + q.F + 32 * q.Y1) % 79;
  return { ch: idx < 40 ? 2 * idx : 2 * (idx - 40) + 1, po, idx, q };
}
export function adaptedHop(addr: number, clk: number, used: boolean[]): number {
  if ((clk >>> 1) & 1) clk -= 2;
  const r = basicHop(addr, clk);
  if (used[r.ch]) return r.ch;
  const map: number[] = [];
  for (let i = 0; i < 79; i += 2) if (used[i]) map.push(i);
  for (let i = 1; i < 79; i += 2) if (used[i]) map.push(i);
  return map[(r.po + r.q.E + ((16 * r.q.seg) % map.length) + 32 * r.q.Y1) % map.length];
}

/* 심화 11장(gatt.html) Database Hash와 Robust Caching. AES는 책의 구현 그대로(검증 스크립트가 RFC 4493과 맞춘다) */
const SBOX: number[] = (() => { const s = new Array(256); let p = 1, q = 1; do { p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0); q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09; const x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4)); s[p] = (x ^ 0x63) & 0xff; } while (p !== 1); s[0] = 0x63; return s; })();
export function aes128(key: number[], block: number[]): number[] {
  const xt = (a: number) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;
  const w = key.slice(); let rc = 1;
  for (let i = 16; i < 176; i += 4) { let t = w.slice(i - 4, i); if (i % 16 === 0) { t = [SBOX[t[1]] ^ rc, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rc = xt(rc); } for (let j = 0; j < 4; j++) w[i + j] = w[i - 16 + j] ^ t[j]; }
  let s = block.map((b, i) => b ^ w[i]);
  for (let r = 1; r <= 10; r++) {
    s = s.map((b) => SBOX[b]);
    s = [0, 5, 10, 15, 4, 9, 14, 3, 8, 13, 2, 7, 12, 1, 6, 11].map((i) => s[i]);
    if (r < 10) { const o: number[] = []; for (let c = 0; c < 4; c++) { const a = s.slice(4 * c, 4 * c + 4), x = a[0] ^ a[1] ^ a[2] ^ a[3]; for (let i = 0; i < 4; i++) o.push(a[i] ^ x ^ xt(a[i] ^ a[(i + 1) % 4])); } s = o; }
    s = s.map((b, i) => b ^ w[16 * r + i]);
  }
  return s;
}
export function aesCmac(key: number[], msg: number[]): number[] {
  const L = aes128(key, new Array(16).fill(0));
  const dbl = (a: number[]) => { const o = a.map((b, i) => ((b << 1) | (i < 15 ? a[i + 1] >> 7 : 0)) & 0xff); if (a[0] & 0x80) o[15] ^= 0x87; return o; };
  const K1 = dbl(L), K2 = dbl(K1), n = Math.max(1, Math.ceil(msg.length / 16)), full = msg.length > 0 && msg.length % 16 === 0;
  let last = msg.slice((n - 1) * 16);
  if (full) last = last.map((b, i) => b ^ K1[i]); else { last = last.concat([0x80]); while (last.length < 16) last.push(0); last = last.map((b, i) => b ^ K2[i]); }
  let x = new Array(16).fill(0);
  for (let i = 0; i < n - 1; i++) x = aes128(key, x.map((b, j) => b ^ msg[16 * i + j]));
  return aes128(key, x.map((b, j) => b ^ last[j]));
}
export type Attr = { handle: number; type: number; value: number[] };
const FULL = [0x2800, 0x2801, 0x2802, 0x2803, 0x2900], TYPE_ONLY = [0x2901, 0x2902, 0x2903, 0x2904, 0x2905];
export function hashBytes(attr: Attr): number[] {
  const le = (v: number) => [v & 255, v >> 8];
  if (FULL.includes(attr.type)) return le(attr.handle).concat(le(attr.type), attr.value);
  if (TYPE_ONLY.includes(attr.type)) return le(attr.handle).concat(le(attr.type));
  return [];
}
export function databaseHash(db: Attr[]): { m: number[]; hash: number[] } { const m = ([] as number[]).concat(...db.slice().sort((a, b) => a.handle - b.handle).map(hashBytes)); return { m, hash: aesCmac(new Array(16).fill(0), m) }; }
export function charDecl(props: number, valueHandle: number, uuid: number): number[] { return [props, valueHandle & 255, valueHandle >> 8, uuid & 255, uuid >> 8]; }
export type RobustState = { aware: boolean; errSent: boolean; hashRead: boolean };
export function robust(st: RobustState, ev: string): { st: RobustState; rsp: string } {
  if (ev === "change") return { st: { aware: false, errSent: false, hashRead: false }, rsp: "Service Changed 표시를 보냄" };
  if (ev === "scCfm") return { st: st.aware ? st : { aware: true, errSent: false, hashRead: false }, rsp: st.aware ? "—" : "change-aware가 됨" };
  if (ev === "hash") return { st: st.aware ? st : { ...st, hashRead: true }, rsp: "Database Hash 응답" };
  if (ev === "cmd") return { st, rsp: st.aware ? "쓰기 실행" : "무시(응답 없음)" };
  if (st.aware) return { st, rsp: "정상 응답" };
  if (st.hashRead || st.errSent) return { st: { aware: true, errSent: false, hashRead: false }, rsp: "change-aware가 되어 정상 응답" };
  return { st: { ...st, errSent: true }, rsp: "ATT_ERROR_RSP 0x12 Database Out Of Sync" };
}
/** 책 시뮬레이터의 데이터베이스(장치 이름·외형 / GATT 서비스 / 심박 / 배터리). insert = 배터리 서비스를 심박 서비스 앞에 끼운 예(영상의 칸 밀림) */
export function gattDb(o: { name?: boolean; prop?: boolean; bat?: boolean; insert?: boolean } = {}): (Attr & { label: string })[] {
  const db: (Attr & { label: string })[] = [], u = (v: number) => [v & 255, v >> 8]; let h = 1;
  const svc = (uuid: number, label: string) => db.push({ handle: h++, type: 0x2800, value: u(uuid), label });
  const chr = (props: number, uuid: number, val: number[], label: string, cccd = false) => { const d = h++; db.push({ handle: d, type: 0x2803, value: charDecl(props, d + 1, uuid), label: label + " 선언" }); db.push({ handle: h++, type: uuid, value: val, label }); if (cccd) db.push({ handle: h++, type: 0x2902, value: [0, 0], label: label + " CCCD" }); };
  const bat = () => { svc(0x180f, "배터리 서비스"); chr(0x12, 0x2a19, [87], "배터리 잔량", true); };
  svc(0x1800, "GAP 서비스"); chr(0x02, 0x2a00, Array.from(new TextEncoder().encode(o.name ? "My Band 2" : "My Band")), "장치 이름"); chr(0x02, 0x2a01, [0xc1, 0x03], "외형");
  svc(0x1801, "GATT 서비스"); chr(0x20, 0x2a05, [0, 0, 0, 0], "Service Changed", true); chr(0x02, 0x2b2a, new Array(16).fill(0), "Database Hash"); chr(0x0a, 0x2b29, [1], "클라이언트 지원 기능");
  if (o.insert) bat();
  svc(0x180d, "심박 서비스"); chr(o.prop ? 0x12 : 0x10, 0x2a37, [0, 72], "심박 측정값", true); chr(0x02, 0x2a38, [1], "센서 위치");
  if (o.bat && !o.insert) bat();
  return db;
}

/* 심화 6장(encryption.html) 링크 계층 암호화: 세션 키와 AES-CCM. aes128은 위(11장)와 같은 구현 */
export function sessionKey(ltk: number[], skdC: number[], skdP: number[]): number[] { return aes128(ltk, skdP.concat(skdC)); }
export function ccmNonce(counter: number, dirBit: number, iv: number[]): number[] {
  const n: number[] = [];
  for (let i = 0; i < 4; i++) n.push(Math.floor(counter / 2 ** (8 * i)) & 0xff);
  n.push((Math.floor(counter / 2 ** 32) & 0x7f) | (dirBit ? 0x80 : 0));
  return n.concat(iv.slice().reverse());
}
export function aadByte(hdr: number): number { return hdr & 0xe3; }
export function ccm(sk: number[], nonce: number[], hdr: number, payload: number[]) {
  const x16 = (a: number[], b: number[]) => a.map((v, i) => v ^ b[i]);
  const B: number[][] = [[0x49].concat(nonce, [0, payload.length]), [0, 1, aadByte(hdr)].concat(new Array(13).fill(0))];
  for (let i = 0; i < payload.length; i += 16) { const c = payload.slice(i, i + 16); while (c.length < 16) c.push(0); B.push(c); }
  const X: number[][] = []; let x = new Array(16).fill(0);
  B.forEach((b) => { x = aes128(sk, x16(x, b)); X.push(x); });
  const mic = x.slice(0, 4), nA = Math.ceil(payload.length / 16) + 1, A: number[][] = [], S: number[][] = [];
  for (let i = 0; i < nA; i++) { const a = [0x01].concat(nonce, [0, i]); A.push(a); S.push(aes128(sk, a)); }
  const ks = ([] as number[]).concat(...S.slice(1));
  return { B, X, A, S, mic, cipher: payload.map((p, i) => p ^ ks[i]), encMic: mic.map((m, i) => m ^ S[0][i]) };
}

/* 심화 8장(privacy.html): RPA의 hash = ah(IRK, prand) = e(IRK, 0¹⁰⁴ ‖ prand)의 아래 24비트. [Vol 3] Part H §2.2.2 */
export function ah(k: number[], r: number): number { const e = aes128(k, new Array(13).fill(0).concat([(r >> 16) & 255, (r >> 8) & 255, r & 255])); return (e[13] << 16) | (e[14] << 8) | e[15]; }
