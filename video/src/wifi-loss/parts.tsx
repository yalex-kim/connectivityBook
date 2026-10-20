import { useEffect, useState } from "react";
import { continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { dataChFreq, wifiBlocked, WIFI, type Event } from "../book";

/** Pretendard를 불러온 뒤 렌더한다 */
export const useFont = () => {
  const [handle] = useState(() => delayRender("font"));
  useEffect(() => {
    const f = new FontFace("Pretendard", `url(${staticFile("fonts/PretendardVariable.woff2")}) format("woff2")`, { weight: "100 900" });
    f.load().then((ff) => { document.fonts.add(ff); continueRender(handle); });
  }, [handle]);
};

/** 장면 시작부터의 등장(0→1) */
export const useIn = (delay = 0, damping = 18) => {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

/** 위쪽 제목(쇼츠 위 15% 아래부터) */
export const Title: React.FC<{ kicker?: string; children: React.ReactNode }> = ({ kicker, children }) => {
  const p = useIn(0);
  return (
    <div style={{ position: "absolute", top: 230, left: 70, right: 70, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, fontFamily: FONT }}>
      {kicker && <div style={{ color: C.accent, fontSize: 34, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>{kicker}</div>}
      <div style={{ color: C.text, fontSize: 64, fontWeight: 800, lineHeight: 1.25 }}>{children}</div>
    </div>
  );
};

/** 아래쪽 자막(유튜브 쇼츠 UI가 덮는 아래 20%는 비운다) */
export const Caption: React.FC<{ text: string }> = ({ text }) => {
  const p = useIn(4, 22);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1270, height: 250, display: "flex", alignItems: "center", justifyContent: "center", opacity: p }}>
      <div style={{ fontFamily: FONT, color: C.text, fontSize: 44, fontWeight: 600, lineHeight: 1.45, textAlign: "center", background: "rgba(10,16,28,.72)", padding: "18px 26px", borderRadius: 22, wordBreak: "keep-all" }}>{text}</div>
    </div>
  );
};

/* ---------------------------------------------------------------- 대역 지도 */
const W = 960, X0 = 2400, X1 = 2484;
const fx = (mhz: number) => ((mhz - X0) / (X1 - X0)) * W;

type BandProps = {
  wifi: number; // Wi-Fi 언덕 등장 0~1
  bars: number; // LE 채널 막대 등장 0~1
  cover: number; // 덮인 채널 칠하기 진행 0~1
  afh?: number; // 덮인 채널 빼기 0~1
};

/** 2.4 GHz 대역: Wi-Fi 1·6·11과 LE 범용 채널 37개 */
export const BandMap: React.FC<BandProps> = ({ wifi, bars, cover, afh = 0 }) => {
  const blocked = wifiBlocked(WIFI), order = [...blocked].sort((a, b) => a - b);
  const shown = Math.round(cover * order.length), covered = new Set(order.slice(0, shown));
  return (
    <svg width={W} height={520} viewBox={`0 0 ${W} 520`} style={{ position: "absolute", left: 60, top: 640, overflow: "visible" }}>
      {WIFI.map((w, i) => {
        const fc = 2407 + 5 * w, a = Math.min(1, Math.max(0, wifi * 3 - i));
        return (
          <g key={w} opacity={a}>
            <rect x={fx(fc - 10)} y={110 + (1 - a) * 40} width={fx(fc + 10) - fx(fc - 10)} height={250} rx={36} fill={C.warn} opacity={0.22} />
            <text x={fx(fc)} y={90} textAnchor="middle" fill={C.warn} fontFamily={FONT} fontSize={34} fontWeight={800}>Wi-Fi {w}</text>
          </g>
        );
      })}
      {Array.from({ length: 37 }, (_, c) => {
        const a = Math.min(1, Math.max(0, bars * 37 - c));
        const isCov = covered.has(c), gone = isCov && afh > 0;
        const col = isCov ? C.warn : bars >= 1 && cover >= 1 ? C.accent : "#5b6b85";
        const h = 210 * a * (gone ? 1 - afh : 1);
        return <rect key={c} x={fx(dataChFreq(c)) - 9} y={360 - h} width={18} height={h} rx={5} fill={col} opacity={gone ? 0.25 + 0.75 * (1 - afh) : 1} />;
      })}
      <line x1={0} x2={W} y1={362} y2={362} stroke={C.faint} strokeWidth={3} />
      {[2400, 2420, 2440, 2460, 2480].map((m) => (
        <text key={m} x={fx(m)} y={410} textAnchor="middle" fill={C.dim} fontFamily={FONT} fontSize={28}>{m}</text>
      ))}
      <text x={W} y={460} textAnchor="end" fill={C.faint} fontFamily={FONT} fontSize={26}>MHz · 막대 = 블루투스 LE 범용 채널(2 MHz 간격)</text>
    </svg>
  );
};

/** 큰 숫자 카운터 */
export const Counter: React.FC<{ label: string; value: string; color?: string; top?: number }> = ({ label, value, color = C.text, top = 1140 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: FONT }}>
    <span style={{ color: C.dim, fontSize: 38, fontWeight: 600, marginRight: 18 }}>{label}</span>
    <span style={{ color, fontSize: 76, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</span>
  </div>
);

/* ---------------------------------------------------------------- 시간-채널 격자 */
/** 가로 = 연결 이벤트, 세로 = 채널. shown개 이벤트까지 그린다 */
export const HopGrid: React.FC<{ events: Event[]; shown: number; dimBlocked?: number }> = ({ events, shown, dimBlocked = 0 }) => {
  const GW = 960, GH = 600, n = events.length, cw = GW / n, chh = GH / 37;
  const blocked = wifiBlocked(WIFI);
  return (
    <svg width={GW} height={GH + 40} viewBox={`0 0 ${GW} ${GH + 40}`} style={{ position: "absolute", left: 60, top: 520, overflow: "visible" }}>
      <rect x={0} y={0} width={GW} height={GH} rx={14} fill={C.panel} />
      {Array.from({ length: 37 }, (_, c) => (blocked.has(c) && dimBlocked > 0 ? <rect key={c} x={0} y={(36 - c) * chh} width={GW} height={chh} fill="#000" opacity={0.45 * dimBlocked} /> : null))}
      {events.slice(0, Math.floor(shown)).map((e, i) => (
        <g key={i}>
          {e.busy.map((c) => <rect key={c} x={i * cw} y={(36 - c) * chh} width={cw} height={chh} fill={C.warn} opacity={0.12} />)}
          <circle cx={i * cw + cw / 2} cy={(36 - e.ch) * chh + chh / 2} r={Math.min(cw, chh) * 0.62} fill={e.hit ? C.bad : C.accent} stroke="#fff" strokeWidth={2} />
        </g>
      ))}
      <text x={0} y={GH + 32} fill={C.dim} fontFamily={FONT} fontSize={26}>연결 이벤트 →</text>
      <text x={GW} y={GH + 32} textAnchor="end" fill={C.dim} fontFamily={FONT} fontSize={26}>주황 = Wi-Fi가 말하는 칸 · 빨강 = 깨진 패킷</text>
    </svg>
  );
};

export const fade = (frame: number, len: number) => interpolate(frame, [0, 8, len - 8, len], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
