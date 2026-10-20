import { useEffect, useState } from "react";
import { continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { dataChFreq, type Event } from "../book";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Pretendard를 불러온 뒤 렌더한다 */
export const useFont = () => {
  const [handle] = useState(() => delayRender("font"));
  useEffect(() => {
    const f = new FontFace("Pretendard", `url(${staticFile("fonts/PretendardVariable.woff2")}) format("woff2")`, { weight: "100 900" });
    f.load().then((ff) => { document.fonts.add(ff); continueRender(handle); });
  }, [handle]);
};

/** 장면 안에서 delay 프레임 뒤 등장(0→1) */
export const useIn = (delay = 0, damping = 18) => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

export const fade = (frame: number, len: number) => interpolate(frame, [0, 8, len - 8, len], [0, 1, 1, 0], clamp);

/** 왼쪽 위 제목 */
export const Title: React.FC<{ kicker?: string; children: React.ReactNode }> = ({ kicker, children }) => {
  const p = useIn(0);
  return (
    <div style={{ position: "absolute", top: 64, left: 110, right: 110, opacity: p, transform: `translateY(${(1 - p) * 20}px)`, fontFamily: FONT }}>
      {kicker && <div style={{ color: C.accent, fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>{kicker}</div>}
      <div style={{ color: C.text, fontSize: 56, fontWeight: 800, lineHeight: 1.2 }}>{children}</div>
    </div>
  );
};

/** 아래 자막 */
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const p = useIn(4, 22);
  return (
    <div style={{ position: "absolute", left: 160, right: 160, top: 906, height: 130, display: "flex", alignItems: "center", justifyContent: "center", opacity: p }}>
      <div style={{ fontFamily: FONT, color: C.text, fontSize: 36, fontWeight: 600, lineHeight: 1.45, textAlign: "center", background: "rgba(10,16,28,.72)", padding: "12px 26px", borderRadius: 18, wordBreak: "keep-all" }}>{text}</div>
    </div>
  );
};

/* ---------------------------------------------------------------- 2.4 GHz 대역 지도 */
const X0 = 2398, X1 = 2486;

type BandProps = {
  x: number; y: number; w: number;
  wifi: { ch: number; a: number }[]; // 보이는 Wi-Fi와 등장 정도
  bars: number; // LE 채널 막대 등장 0~1
  covered?: Set<number>; // 주황으로 칠할 채널
  removed?: number; // 덮인 채널을 지우는 정도 0~1 (AFH)
  dot?: number | null; // 지금 도약 중인 채널
  microwave?: number; // 전자레인지 표시 0~1
  ism?: number; // ISM 대역 경계 표시 0~1
};

export const Band: React.FC<BandProps> = ({ x, y, w, wifi, bars, covered = new Set(), removed = 0, dot = null, microwave = 0, ism = 0 }) => {
  const fx = (m: number) => ((m - X0) / (X1 - X0)) * w, H = 420, base = 330;
  return (
    <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      {ism > 0 && (
        <g opacity={ism}>
          <rect x={fx(2400)} y={0} width={fx(2483.5) - fx(2400)} height={base} fill={C.accent2} opacity={0.06} />
          {[2400, 2483.5].map((m) => <line key={m} x1={fx(m)} x2={fx(m)} y1={0} y2={base} stroke={C.accent2} strokeWidth={2} strokeDasharray="8 8" />)}
          <text x={fx(2441.75)} y={-14} textAnchor="middle" fill={C.accent2} fontFamily={FONT} fontSize={26} fontWeight={700}>2.4 GHz ISM 대역 (2,400~2,483.5 MHz)</text>
        </g>
      )}
      {microwave > 0 && (
        <g opacity={microwave}>
          <rect x={fx(2440)} y={40} width={fx(2470) - fx(2440)} height={base - 40} rx={24} fill={C.bad} opacity={0.12} />
          <text x={fx(2455)} y={70} textAnchor="middle" fill={C.bad} fontFamily={FONT} fontSize={24} fontWeight={700}>전자레인지</text>
        </g>
      )}
      {wifi.map(({ ch, a }) => {
        const fc = 2407 + 5 * ch;
        return (
          <g key={ch} opacity={a}>
            <rect x={fx(fc - 10)} y={90 + (1 - a) * 30} width={fx(fc + 10) - fx(fc - 10)} height={base - 90} rx={30} fill={C.warn} opacity={0.22} />
            <text x={fx(fc)} y={120} textAnchor="middle" fill={C.warn} fontFamily={FONT} fontSize={28} fontWeight={800}>Wi-Fi {ch}</text>
          </g>
        );
      })}
      {Array.from({ length: 37 }, (_, c) => {
        const a = interpolate(bars * 37 - c, [0, 1], [0, 1], clamp);
        const isCov = covered.has(c), gone = isCov ? removed : 0;
        const h = 170 * a * (1 - gone);
        const col = c === dot ? C.text : isCov ? C.warn : covered.size ? C.accent : "#62738f";
        return <rect key={c} x={fx(dataChFreq(c)) - 7} y={base - h} width={14} height={h} rx={4} fill={col} opacity={isCov ? 1 - 0.75 * gone : 1} />;
      })}
      {dot !== null && <circle cx={fx(dataChFreq(dot))} cy={base - 200} r={16} fill={C.accent} stroke="#fff" strokeWidth={3} />}
      <line x1={0} x2={w} y1={base + 2} y2={base + 2} stroke={C.faint} strokeWidth={3} />
      {[2400, 2420, 2440, 2460, 2480].map((m) => <text key={m} x={fx(m)} y={base + 40} textAnchor="middle" fill={C.dim} fontFamily={FONT} fontSize={24}>{m}</text>)}
      <text x={w} y={base + 80} textAnchor="end" fill={C.faint} fontFamily={FONT} fontSize={22}>MHz · 막대 = 저전력 블루투스(LE) 범용 채널 37개(2 MHz 간격)</text>
    </svg>
  );
};

/* ---------------------------------------------------------------- 시간-채널 격자 */
export const Grid: React.FC<{ x: number; y: number; w: number; h: number; events: Event[]; shown: number; blocked: Set<number>; dimBlocked?: number }> = ({ x, y, w, h, events, shown, blocked, dimBlocked = 0 }) => {
  const n = events.length, cw = w / n, chh = h / 37;
  return (
    <svg width={w} height={h + 40} viewBox={`0 0 ${w} ${h + 40}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} rx={12} fill={C.panel} />
      {[...blocked].map((c) => <rect key={c} x={0} y={(36 - c) * chh} width={w} height={chh} fill="#000" opacity={0.5 * dimBlocked} />)}
      {events.slice(0, Math.floor(shown)).map((e, i) => (
        <g key={i}>
          {e.busy.map((c) => <rect key={c} x={i * cw} y={(36 - c) * chh} width={cw} height={chh} fill={C.warn} opacity={0.12} />)}
          <circle cx={i * cw + cw / 2} cy={(36 - e.ch) * chh + chh / 2} r={Math.min(cw, chh) * 0.6} fill={e.hit ? C.bad : C.accent} stroke="#fff" strokeWidth={1.5} />
        </g>
      ))}
      <text x={0} y={h + 30} fill={C.dim} fontFamily={FONT} fontSize={22}>연결 이벤트 →</text>
      <text x={w} y={h + 30} textAnchor="end" fill={C.dim} fontFamily={FONT} fontSize={22}>주황 = Wi-Fi가 말하는 칸 · 빨강 = 깨진 패킷</text>
    </svg>
  );
};

/* ---------------------------------------------------------------- 누적 손실률 그래프 */
export const RunningLoss: React.FC<{ x: number; y: number; w: number; h: number; events: Event[]; shown: number; expected: number; color?: string }> = ({ x, y, w, h, events, shown, expected, color = C.bad }) => {
  const n = events.length, k = Math.max(1, Math.floor(shown)), pts: string[] = [];
  let hits = 0;
  for (let i = 0; i < k; i++) {
    hits += events[i].hit ? 1 : 0;
    pts.push(`${(i / (n - 1)) * w},${h - ((hits / (i + 1)) / 0.8) * h}`);
  }
  const ey = h - (expected / 0.8) * h, cur = hits / k;
  return (
    <svg width={w} height={h + 60} viewBox={`0 0 ${w} ${h + 60}`} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} rx={12} fill={C.panel} />
      {[0, 0.2, 0.4, 0.6, 0.8].map((v) => <text key={v} x={-12} y={h - (v / 0.8) * h + 8} textAnchor="end" fill={C.faint} fontFamily={FONT} fontSize={22}>{Math.round(v * 100)}%</text>)}
      <line x1={0} x2={w} y1={ey} y2={ey} stroke={C.text} strokeWidth={2} strokeDasharray="10 8" opacity={0.7} />
      <text x={w - 8} y={ey - 12} textAnchor="end" fill={C.text} fontFamily={FONT} fontSize={24}>계산값 {(expected * 100).toFixed(1)}%</text>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <text x={0} y={h + 44} fill={C.dim} fontFamily={FONT} fontSize={24}>지금까지 {k}번 중 {hits}번 깨짐</text>
      <text x={w} y={h + 44} textAnchor="end" fill={color} fontFamily={FONT} fontSize={34} fontWeight={800}>{(cur * 100).toFixed(1)}%</text>
    </svg>
  );
};

/** 둥근 카드 */
export const Card: React.FC<{ x: number; y: number; w: number; h?: number; a?: number; children: React.ReactNode }> = ({ x, y, w, h, a = 1, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: a, transform: `translateY(${(1 - a) * 20}px)`, background: C.panel, borderRadius: 24, border: `2px solid #24324a`, padding: "28px 36px", boxSizing: "border-box", fontFamily: FONT, color: C.text }}>{children}</div>
);
