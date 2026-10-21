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
