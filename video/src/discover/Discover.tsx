import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { bookRng, csa2Channel, CH_ID, foundWithin, meanDiscovery } from "../book";
import { CASES } from "./script";
import { Stage3D, camLerp, chX, fx, ADV_MHZ, type Vec } from "../afh/world3d";
import { Caption, Title, clamp, fade, useFont } from "../afh/parts";
import { LEAD, scenesFor, type Timed } from "./timing";

const ALL37 = Array(37).fill(true);
const MEANS = CASES.map(([, ta, ts, w]) => meanDiscovery(ta, ts, w)); // ms, 책 5장 시뮬레이터와 같은 계산(1분 안에 찾은 경우의 평균)
const FOUND = CASES.map(([, ta, ts, w]) => foundWithin(ta, ts, w)); // 1분 안에 찾은 비율
const ADV_COL = C.accent2, PHONE_COL = C.accent, BUD_COL = C.ok;

/* ---------------------------------------------------------------- 작은 그림들 */
const S = { fill: C.panel, stroke: C.text, strokeWidth: 4, strokeLinejoin: "round" as const };

/** 이어폰 케이스: open 0~1이면 뚜껑이 열린다 */
const BudCase: React.FC<{ x: number; y: number; open: number; scale?: number }> = ({ x, y, open, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <g transform={`translate(-110,-10) rotate(${-70 * open})`}>
      <path d="M0 0 C 0 -70, 220 -70, 220 0 Z" {...S} />
    </g>
    <path d="M-110 -10 H110 V40 C 110 110, -110 110, -110 40 Z" {...S} />
    {open > 0.3 &&
      [-46, 46].map((bx) => (
        <g key={bx} opacity={interpolate(open, [0.3, 1], [0, 1], clamp)} transform={`translate(${bx},-30) rotate(${bx < 0 ? 12 : -12})`}>
          <rect x={-9} y={8} width={18} height={62} rx={9} fill="#1d3557" stroke={C.text} strokeWidth={4} />
          <ellipse cx={0} cy={0} rx={24} ry={20} fill="#1d3557" stroke={C.text} strokeWidth={4} />
          <ellipse cx={bx < 0 ? 8 : -8} cy={-2} rx={8} ry={6} fill={BUD_COL} />
        </g>
      ))}
    <rect x={-14} y={88} width={28} height={8} rx={4} fill={open > 0.5 ? BUD_COL : C.faint} />
  </g>
);

/** 휴대폰: 화면에 기기 목록, found 0~1이면 '내 이어폰' 줄이 나타난다 */
const Phone: React.FC<{ x: number; y: number; found: number; scale?: number; label?: string }> = ({ x, y, found, scale = 1, label = "내 이어폰" }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`} fontFamily={FONT}>
    <rect x={-130} y={-250} width={260} height={500} rx={40} {...S} />
    <rect x={-110} y={-220} width={220} height={430} rx={16} fill="#0f1a2e" />
    <text x={-90} y={-176} fill={C.text} fontSize={26} fontWeight={800}>블루투스</text>
    <text x={-90} y={-130} fill={C.dim} fontSize={18} fontWeight={600}>사용 가능한 기기</text>
    <g opacity={found} transform={`translate(0,${(1 - found) * 20})`}>
      <rect x={-96} y={-110} width={192} height={60} rx={12} fill="#16314f" stroke={PHONE_COL} strokeWidth={found > 0.9 ? 3 : 0} />
      <circle cx={-66} cy={-80} r={14} fill={BUD_COL} />
      <text x={-42} y={-72} fill={C.text} fontSize={22} fontWeight={700}>{label}</text>
    </g>
    {[0, 1].map((i) => <rect key={i} x={-96} y={-30 + i * 70} width={192} height={52} rx={12} fill="#13233a" opacity={0.6} />)}
  </g>
);

/** 퍼져 나가는 전파 고리 */
const Rings: React.FC<{ x: number; y: number; col: string; on: number; f: number; r0?: number }> = ({ x, y, col, on, f, r0 = 120 }) => (
  <g opacity={on}>
    {[0, 1, 2].map((j) => {
      const p = ((f + j * 20) % 60) / 60;
      return <circle key={j} cx={x} cy={y} r={r0 + p * 160} fill="none" stroke={col} strokeWidth={4} opacity={(1 - p) * 0.6} />;
    })}
  </g>
);

const Legend: React.FC<{ items: [string, string][]; top?: number }> = ({ items, top = 850 }) => (
  <div style={{ position: "absolute", left: 110, top, display: "flex", gap: 34, fontFamily: FONT, fontSize: 24, color: C.dim }}>
    {items.map(([col, t]) => <span key={t}><span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, background: col, marginRight: 10 }} />{t}</span>)}
  </div>
);

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), open = interpolate(f, [20, 45], [0, 1], clamp), found = interpolate(f, [70, 90], [0, 1], clamp);
  const q = interpolate(f, [cues[2], cues[2] + 20], [0, 1], clamp);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <Rings x={620} y={540} col={BUD_COL} on={open} f={f} />
      <BudCase x={620} y={540} open={open} scale={1.3} />
      <Phone x={1300} y={520} found={found} scale={1.15} />
      <g opacity={interpolate(f, [cues[1], cues[1] + 20], [0, 1], clamp)} fontFamily={FONT}>
        <line x1={820} y1={540} x2={1120} y2={540} stroke={C.faint} strokeWidth={4} strokeDasharray="14 14" />
        <text x={970} y={510} textAnchor="middle" fill={C.dim} fontSize={30} fontWeight={700}>연결 전</text>
      </g>
      <text x={970} y={620} textAnchor="middle" fill={C.accent} opacity={q} fontFamily={FONT} fontSize={110} fontWeight={900}>?</text>
    </svg>
  );
};

/* ---------------------------------------------------------------- 2. 광고 채널 세 곳 (3D) */
const Meet: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame();
  const cam = camLerp({ pos: [0, 70, 96], look: [0, 0, 0], fov: 42 }, { pos: [0, 30, 66], look: [0, 4, 0], fov: 40 }, f / len);
  const adv = interpolate(f, [cues[1], cues[1] + 30], [0, 1], clamp), dim = interpolate(f, [cues[1], cues[1] + 30], [0, 1], clamp);
  const glow = 0.5 + 0.5 * Math.sin(f / 6);
  return (
    <>
      <Stage3D cam={cam} wifi={[0, 0, 0]} pillars={interpolate(f, [10, 70], [0, 1], clamp)} color={() => "#7f93b3"} adv={adv} advGlow={f > cues[2] ? glow : 0} dim={dim} />
      <Title kicker="만남의 장소">40개 중 3개, 광고 채널</Title>
      <Legend items={[[ADV_COL, "광고 채널 3개 (37·38·39 = 2402·2426·2480 MHz)"], ["#7f93b3", "범용 채널 37개 (연결 뒤 대화용)"], [C.faint, "40개 채널은 2,402~2,480 MHz에 2 MHz 간격"]]} />
    </>
  );
};

/* ---------------------------------------------------------------- 광고 시간축 (2D) */
const ROWS = [37, 38, 39], ROW_Y = (k: number, y0: number) => y0 + k * 120;
const TL = { x: 260, w: 1500 }; // 시간축 화면 범위
/** 광고 이벤트 시작 시각들(ms): 간격 + 0~10 ms 지연 */
const advEvents = (ta: number, span: number, seed: number, delay = true) => {
  const r = bookRng(seed), out: number[] = [];
  for (let t = 20 + r() * 10; t < span; t += ta + (delay ? r() * 10 : 0)) out.push(t);
  return out;
};

const Timeline: React.FC<{ y0: number; span: number; now: number; events: number[]; col: string; windows?: [number, number, number][]; hit?: [number, number] | null; label?: boolean; spread?: number }> = ({ y0, span, now, events, col, windows = [], hit = null, label = true, spread = 14 }) => {
  const X = (t: number) => TL.x + (t / span) * TL.w, EW = 3 * 14; // 이벤트 하나의 폭(확대)
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      {ROWS.map((ch, k) => (
        <g key={ch}>
          {label && <text x={TL.x - 30} y={ROW_Y(k, y0) + 10} textAnchor="end" fill={C.dim} fontSize={28} fontWeight={700}>ch {ch}</text>}
          {label && <text x={TL.x - 30} y={ROW_Y(k, y0) + 40} textAnchor="end" fill={C.faint} fontSize={20}>{ADV_MHZ[k]} MHz</text>}
          <line x1={TL.x} x2={TL.x + TL.w} y1={ROW_Y(k, y0)} y2={ROW_Y(k, y0)} stroke={C.faint} strokeWidth={2} />
        </g>
      ))}
      {windows.filter(([s]) => s < now).map(([s, e, k], i) => (
        <rect key={i} x={X(s)} y={ROW_Y(k, y0) - 44} width={Math.max(4, X(Math.min(e, now)) - X(s))} height={88} rx={10} fill={PHONE_COL} opacity={0.2} stroke={PHONE_COL} strokeWidth={2} />
      ))}
      {events.filter((t) => t < now).map((t, i) =>
        ROWS.map((_, k) => <rect key={`${i}${k}`} x={X(t) + k * spread} y={ROW_Y(k, y0) - 22} width={spread ? 12 : 6} height={44} rx={3} fill={col} />)
      )}
      {hit && hit[0] < now && (
        <g>
          <circle cx={X(hit[0]) + hit[1] * spread + (spread ? 6 : 3)} cy={ROW_Y(hit[1], y0)} r={34} fill="none" stroke={C.text} strokeWidth={5} />
          <text x={X(hit[0]) + hit[1] * spread + (spread ? 6 : 3)} y={ROW_Y(hit[1], y0) - 56} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>찾았다!</text>
        </g>
      )}
      <line x1={X(now)} x2={X(now)} y1={y0 - 70} y2={ROW_Y(2, y0) + 50} stroke={C.text} strokeWidth={2} opacity={0.4} />
      <text x={TL.x} y={ROW_Y(2, y0) + 90} fill={C.faint} fontSize={22}>{spread ? "시간 → (한 이벤트 안의 세 패킷 간격은 크게 그렸다)" : "시간 → (한 이벤트의 세 패킷은 약 1 ms 안에 나간다)"}</text>
      <text x={TL.x + EW} y={0} />
    </svg>
  );
};

/* ---------------------------------------------------------------- 3. 외치기 */
const SHOUT_SPAN = 520, SHOUT_TA = 100;
const SHOUT_EV = advEvents(SHOUT_TA, SHOUT_SPAN, 11);
const Shout: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), now = interpolate(f, [10, cues[2] - 5], [0, SHOUT_SPAN], clamp);
  const d = interpolate(f, [cues[2], cues[2] + 20], [0, 1], clamp), two = interpolate(f, [cues[3], cues[3] + 20], [0, 1], clamp);
  const X = (t: number) => TL.x + (t / SHOUT_SPAN) * TL.w;
  // 같은 박자의 두 기기가 같은 순간에 시작했을 때: 지연이 없으면 매번 겹치고, 있으면 금세 어긋난다
  const CMP = 3000, EV_MS = 3 * 0.376 + 2 * 0.6; // 이벤트 하나(세 패킷)의 길이
  const XC = (t: number) => TL.x + (t / CMP) * TL.w;
  const walk = (seed: number | null, t0: number) => { const r = seed === null ? null : bookRng(seed), out: number[] = []; for (let t = t0; t < CMP; t += 100 + (r ? r() * 10 : 0)) out.push(t); return out; };
  const A0 = walk(null, 20), B0 = walk(null, 20.5), A1 = walk(21, 20), B1 = walk(77, 20.5);
  const strip = (y: number, A: number[], B: number[], title: string) => (
    <g>
      <text x={TL.x - 30} y={y + 8} textAnchor="end" fill={C.dim} fontSize={24} fontWeight={700}>{title}</text>
      <line x1={TL.x} x2={TL.x + TL.w} y1={y} y2={y} stroke={C.faint} strokeWidth={2} />
      {A.map((t, i) => <rect key={`a${i}`} x={XC(t)} y={y - 34} width={6} height={30} rx={2} fill={BUD_COL} />)}
      {B.map((t, i) => <rect key={`b${i}`} x={XC(t)} y={y + 4} width={6} height={30} rx={2} fill={C.warn} />)}
      {A.filter((t) => B.some((u) => Math.abs(u - t) < EV_MS)).map((t, i) => <circle key={`c${i}`} cx={XC(t) + 4} cy={y} r={16} fill="none" stroke={C.bad} strokeWidth={3} />)}
      <text x={TL.x + TL.w} y={y + 70} textAnchor="end" fill={C.bad} fontSize={24} fontWeight={700}>부딪힘 {A.filter((t) => B.some((u) => Math.abs(u - t) < EV_MS)).length} / {A.length}</text>
    </g>
  );
  return (
    <>
      <Title kicker="외치는 쪽: 광고">간격마다 세 채널에 한 번씩</Title>
      <div style={{ opacity: 1 - two }}>
        <Timeline y0={330} span={SHOUT_SPAN} now={now} events={SHOUT_EV} col={BUD_COL} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: d }} fontFamily={FONT}>
          {SHOUT_EV.slice(0, 3).map((t, i) => {
            const n = SHOUT_EV[i + 1];
            return (
              <g key={i}>
                <path d={`M${X(t)} 230 V214 H${X(n)} V230`} fill="none" stroke={C.accent2} strokeWidth={3} />
                <text x={(X(t) + X(n)) / 2} y={200} textAnchor="middle" fill={C.accent2} fontSize={24} fontWeight={700}>{SHOUT_TA} ms + {(n - t - SHOUT_TA).toFixed(1)} ms</text>
              </g>
            );
          })}
        </svg>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: two }} fontFamily={FONT}>
        {strip(380, A0, B0, "지연 없음")}
        {strip(620, A1, B1, "0~10 ms 지연")}
        <text x={TL.x} y={780} fill={C.faint} fontSize={22}>초록·주황 = 같은 순간에 시작해 100 ms 간격으로 광고하는 두 기기 (3초, 이벤트 하나 ≈ 2.3 ms), 빨간 고리 = 겹침</text>
      </svg>
      <Legend items={[[BUD_COL, "이어폰의 광고 패킷 (같은 내용을 37 → 38 → 39)"]]} />
    </>
  );
};

/* ---------------------------------------------------------------- 4. 듣기 */
const LISTEN_SPAN = 1300, LISTEN_TA = 100, SCAN_I = 300, SCAN_W = 30;
const LISTEN_EV = advEvents(LISTEN_TA, LISTEN_SPAN, 5);
/** 스캔 창: [시작, 끝, 채널 줄]. 창마다 다음 광고 채널로 */
const windowsAt = (phase: number, off: number): [number, number, number][] => Array.from({ length: 5 }, (_, i) => [phase + i * SCAN_I, phase + i * SCAN_I + SCAN_W, (i + off) % 3]);
/** 처음으로 패킷 하나가 같은 채널의 창 안에 들어간 때: [광고 시각, 채널 줄, 창 번호] */
const firstHit = (W: [number, number, number][]): [number, number, number] | null => {
  const PK = 0.376, GAPV = 0.6;
  for (const t of LISTEN_EV) for (let k = 0; k < 3; k++) {
    const s = t + k * GAPV, i = W.findIndex(([a, b, c]) => c === k && s >= a && s + PK <= b);
    if (i >= 0) return [t, k, i];
  }
  return null;
};
/** 앞의 창들은 엇갈리고 넷째 창(i = 3)에서 처음 겹치는 배치를 고른다(그림을 위해, 계산은 그대로) */
const [WINDOWS, FIRST_HIT] = (() => {
  for (let ph = 0; ph < SCAN_I; ph += 5) for (let off = 0; off < 3; off++) {
    const W = windowsAt(ph, off), h = firstHit(W);
    // 앞의 창들은 눈으로 봐도 분명히 엇갈리게(패킷이 창 경계에서 8 ms 넘게 떨어짐)
    const clear = W.slice(0, 3).every(([a, b, c]) => LISTEN_EV.every((t) => { const x = t + c * 0.6; return x + 0.376 < a - 8 || x > b + 8; }));
    if (h && h[2] === 3 && clear) return [W, h] as const;
  }
  const W = windowsAt(40, 0); return [W, firstHit(W)] as const;
})();
const Listen: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), hitT = FIRST_HIT ? FIRST_HIT[0] : LISTEN_SPAN;
  // 겹치는 순간이 셋째 문장에 오도록 시간을 흘린다
  const now = f < cues[2] ? interpolate(f, [10, cues[2]], [0, hitT - 5], clamp) : interpolate(f, [cues[2], cues[2] + 40, len - 10], [hitT - 5, hitT + 20, LISTEN_SPAN], clamp);
  const found = FIRST_HIT && now > FIRST_HIT[0] ? interpolate(now, [FIRST_HIT[0], FIRST_HIT[0] + 30], [0, 1], clamp) : 0;
  return (
    <>
      <Title kicker="듣는 쪽: 스캔">잠깐씩, 채널을 바꿔 가며 듣는다</Title>
      <Timeline y0={330} span={LISTEN_SPAN} now={now} events={LISTEN_EV} col={BUD_COL} windows={WINDOWS} hit={FIRST_HIT && [FIRST_HIT[0], FIRST_HIT[1]]} spread={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Phone x={1770} y={180} found={found} scale={0.42} />
      </svg>
      <Legend items={[[BUD_COL, "이어폰의 광고 (100 ms 간격 예)"], [PHONE_COL, "휴대폰의 스캔 창 (300 ms마다 30 ms 예)"]]} />
    </>
  );
};

/* ---------------------------------------------------------------- 5. 왜 오래 걸릴까 */
const fmtS = (ms: number) => (ms < 1000 ? (ms / 1000).toFixed(2) : ms < 10000 ? (ms / 1000).toFixed(1) : Math.round(ms / 1000).toString()) + " s";
const Slow: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), L = (ms: number) => (Math.log10(ms) - 1) / (Math.log10(60000) - 1); // 10 ms ~ 60 s 로그 눈금
  const at = [cues[0] + 10, cues[0] + 30, cues[0] + 50, cues[0] + 70];
  const focus = (i: number) => (i === 0 ? interpolate(f, [cues[1], cues[1] + 15], [0, 1], clamp) : i === 3 ? interpolate(f, [cues[2], cues[2] + 15], [0, 1], clamp) : 0);
  return (
    <>
      <Title kicker="왜 어떤 때는 오래 걸릴까">조건에 따라 0.1초에서 1분 넘게까지</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {[0.1, 1, 10, 60].map((s) => (
          <g key={s}>
            <line x1={700 + L(s * 1000) * 1000} x2={700 + L(s * 1000) * 1000} y1={260} y2={760} stroke={C.faint} strokeWidth={2} strokeDasharray="6 8" />
            <text x={700 + L(s * 1000) * 1000} y={800} textAnchor="middle" fill={C.faint} fontSize={22}>{s} s</text>
          </g>
        ))}
        {CASES.map(([name, ta, ts, w], i) => {
          const a = interpolate(f, [at[i], at[i] + 30], [0, 1], clamp), y = 290 + i * 120;
          return (
            <g key={name} opacity={interpolate(a, [0, 0.2], [0, 1], clamp)}>
              <text x={110} y={y + 24} fill={C.text} fontSize={30} fontWeight={700}>{name}</text>
              <text x={110} y={y + 60} fill={C.faint} fontSize={20}>광고 {ta >= 1000 ? (ta / 1000).toFixed(1) + " s" : ta + " ms"} · 스캔 {ts >= 1000 ? (ts / 1000).toFixed(2) + " s" : ts + " ms"}마다 {w}%</text>
              {(() => {
                // 1분 안에 다 찾으면 평균까지, 못 찾는 경우가 있으면 1분 끝까지 막대를 긋고 찾은 비율을 적는다
                const all = FOUND[i] > 0.999, end = all ? L(MEANS[i]) : 1, wBar = Math.max(6, end * 1000 * a);
                const label = all ? "평균 " + fmtS(MEANS[i]) : `1분 안에 ${Math.round(FOUND[i] * 100)}%만 찾음`;
                return (
                  <>
                    <rect x={690} y={y - 12} width={Math.min(wBar + 300, 1130)} height={80} rx={16} fill="none" stroke={C.text} strokeWidth={4} opacity={focus(i)} />
                    <rect x={700} y={y} width={wBar} height={56} rx={10} fill={i % 2 ? C.warn : C.accent} opacity={0.85} />
                    {!all && <rect x={700 + L(MEANS[i]) * 1000 * a} y={y} width={Math.max(0, wBar - L(MEANS[i]) * 1000 * a)} height={56} rx={10} fill={C.bad} opacity={0.55} />}
                    <text x={all ? 710 + wBar + 10 : 700 + wBar - 14} y={y + 40} textAnchor={all ? "start" : "end"} fill={C.text} fontSize={30} fontWeight={800}>{a > 0.95 ? label : ""}</text>
                  </>
                );
              })()}
            </g>
          );
        })}
        <text x={110} y={850} fill={C.faint} fontSize={22}>입문 5장 시뮬레이터와 같은 계산: 광고 데이터 31바이트, 조건마다 600번 시도 (로그 눈금, 평균은 1분 안에 찾은 경우). 실제 기기의 설정은 제품마다 다르다.</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 연결 요청 */
const FIELDS: [string, string][] = [
  ["접근 주소", "둘만의 무작위 32비트"],
  ["CRC 초깃값", ""],
  ["전송 창", "첫 만남의 시각"],
  ["연결 간격", "그다음 만나는 주기"],
  ["페리페럴 지연", ""],
  ["감독 타임아웃", ""],
  ["채널 맵", "쓸 범용 채널"],
  ["도약 규칙", "어떤 순서로 옮길지"],
  ["시계 정확도", ""],
];
const HL = new Set([0, 2, 3, 6, 7]);
const Request: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), adv = interpolate(f, [15, 30], [0, 1], clamp), req = interpolate(f, [cues[1] + 10, cues[1] + 25], [0, 1], clamp);
  const env = interpolate(f, [cues[2], cues[2] + 25], [0, 1], clamp), hl = interpolate(f, [cues[3], cues[3] + 20], [0, 1], clamp);
  return (
    <>
      <Title kicker="연결 요청">요청 한 번에 모든 약속을</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={110} y={330} fill={C.dim} fontSize={28} fontWeight={700}>ch 37</text>
        <line x1={230} x2={1000} y1={320} y2={320} stroke={C.faint} strokeWidth={2} />
        <g opacity={adv}><rect x={260} y={276} width={250} height={88} rx={12} fill={BUD_COL} /><text x={385} y={332} textAnchor="middle" fill="#06241a" fontSize={26} fontWeight={800}>이어폰: 광고</text></g>
        <g opacity={req}>
          <path d="M514 252 V240 H660 V252" fill="none" stroke={C.text} strokeWidth={3} />
          <text x={587} y={228} textAnchor="middle" fill={C.text} fontSize={26} fontWeight={800}>150 µs</text>
          <rect x={660} y={276} width={330} height={88} rx={12} fill={PHONE_COL} /><text x={825} y={332} textAnchor="middle" fill="#04223f" fontSize={26} fontWeight={800}>휴대폰: 연결 요청</text>
        </g>
        <g opacity={env} transform={`translate(1060,${180 + (1 - env) * 30})`}>
          <rect x={0} y={0} width={760} height={640} rx={24} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={36} y={60} fill={PHONE_COL} fontSize={32} fontWeight={800}>CONNECT_IND 안의 약속</text>
          {FIELDS.map(([k, v], i) => {
            const on = HL.has(i) ? hl : 0;
            return (
              <g key={k} transform={`translate(36,${110 + i * 56})`} opacity={1 - 0.55 * hl * (HL.has(i) ? 0 : 1)}>
                <rect x={-12} y={-34} width={700} height={48} rx={10} fill={PHONE_COL} opacity={0.18 * on} />
                <text x={0} y={0} fill={C.text} fontSize={28} fontWeight={700}>{k}</text>
                <text x={260} y={0} fill={on ? C.accent : C.dim} fontSize={24}>{v}</text>
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 110, top: 430, width: 860, fontFamily: FONT, fontSize: 26, color: C.dim, lineHeight: 1.6, opacity: req }}>
        광고를 받은 바로 그 채널에서, 패킷이 끝나고 150 µs(T_IFS) 뒤. 이어폰은 이 요청을 받는 순간 광고를 멈춘다.
      </div>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 범용 채널로 (3D) */
const Leave: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), start = cues[1] - 30, P = 10;
  const k = Math.max(0, Math.floor((f - start) / P)), p = f < start ? 0 : ((f - start) % P) / P;
  const chAt = (e: number) => csa2Channel(e, CH_ID, ALL37), top = 8.2;
  const posOf = (e: number): Vec => (e < 0 ? [fx(ADV_MHZ[0]), 11, 0] : [chX(chAt(e)), top, 0]);
  const a = posOf(f < start ? -1 : k - 1), b = posOf(f < start ? -1 : k);
  const ball: Vec = f < cues[0] + 20 ? posOf(-1) : [a[0] + (b[0] - a[0]) * p, Math.max(a[1], b[1]) + Math.sin(Math.PI * p) * 6, 0];
  const first = f >= cues[0] + 20 && f < start ? interpolate(f, [cues[0] + 20, start], [0, 1], clamp) : 0;
  const ballFirst: Vec = [fx(ADV_MHZ[0]) + (chX(chAt(0)) - fx(ADV_MHZ[0])) * first, 11 + Math.sin(Math.PI * first) * 10, 0];
  const cam = camLerp({ pos: [-50, 34, 72], look: [-6, 4, 0], fov: 40 }, { pos: [44, 28, 70], look: [4, 5, 0], fov: 40 }, f / len);
  return (
    <>
      <Stage3D cam={cam} wifi={[0, 0, 0]} pillars={1} color={(c) => (f >= start && c === chAt(k) ? C.text : C.accent)} adv={1} advGlow={f < cues[0] + 20 ? 1 : 0} dim={0} ball={f < start ? (first > 0 ? ballFirst : posOf(-1)) : ball} />
      <Title kicker="연결">광고 채널을 떠나 범용 채널로</Title>
      <Legend items={[[ADV_COL, "광고 채널"], [C.accent, "범용 채널 37개"], [C.text, "지금 이야기하는 채널 (연결 간격마다 바뀜)"]]} />
    </>
  );
};

/* ---------------------------------------------------------------- 8. 정리 */
const STEPS: [string, string, string][] = [
  ["외치기", "간격마다\n광고 채널 3곳에", BUD_COL],
  ["듣기", "스캔 창마다\n다른 채널", PHONE_COL],
  ["연결 요청", "150 µs 뒤 CONNECT_IND\n약속을 한 번에", C.accent2],
  ["연결", "범용 채널에서\n연결 간격마다", C.text],
];
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      {STEPS.map(([h, d, col], i) => {
        const a = interpolate(f, [10 + i * 20, 30 + i * 20], [0, 1], clamp), x = 150 + i * 430;
        return (
          <g key={h} opacity={a} transform={`translate(${x},${380 + (1 - a) * 20})`}>
            <rect x={0} y={0} width={330} height={260} rx={28} fill={C.panel} stroke={col} strokeWidth={4} />
            <circle cx={50} cy={50} r={26} fill={col} /><text x={50} y={60} textAnchor="middle" fill={C.bg} fontSize={28} fontWeight={900}>{i + 1}</text>
            <text x={30} y={140} fill={C.text} fontSize={44} fontWeight={900}>{h}</text>
            {d.split("\n").map((t, j) => <text key={j} x={30} y={190 + j * 36} fill={C.dim} fontSize={26}>{t}</text>)}
            {i < 3 && <path d="M342 130 H402" stroke={C.faint} strokeWidth={6} markerEnd="" />}
            {i < 3 && <path d="M392 118 L408 130 L392 142" fill="none" stroke={C.faint} strokeWidth={6} />}
          </g>
        );
      })}
      <text x={960} y={220} textAnchor="middle" fill={C.text} fontSize={56} fontWeight={900} opacity={interpolate(f, [cues[0] + 10, cues[0] + 30], [0, 1], clamp)}>광고 채널에서 <tspan fill={C.accent2}>만나고</tspan>, 연결 요청으로 <tspan fill={C.accent}>약속하고</tspan>, 범용 채널로 떠난다</text>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} />;
    case "meet": return <Meet len={s.frames} cues={s.cues} />;
    case "shout": return <Shout len={s.frames} cues={s.cues} />;
    case "listen": return <Listen len={s.frames} cues={s.cues} />;
    case "slow": return <Slow cues={s.cues} />;
    case "request": return <Request cues={s.cues} />;
    case "leave": return <Leave len={s.frames} cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} />;
  }
};

const SceneFrame: React.FC<{ s: Timed; voice: boolean }> = ({ s, voice }) => {
  const f = useCurrentFrame(), k = s.cues.filter((c) => c <= f).length - 1;
  return (
    <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
      {body(s)}
      {voice && (
        <Sequence from={LEAD} layout="none">
          <Audio src={staticFile(`audio/discover/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const Discover: React.FC<{ voice: boolean }> = ({ voice }) => {
  useFont();
  let at = 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1600px 900px at 50% 35%, #12213a, ${C.bg})` }}>
      {scenesFor(voice).map((s) => {
        const from = at;
        at += s.frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.frames}>
            <SceneFrame s={s} voice={voice} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
