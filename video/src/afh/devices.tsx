import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { clamp } from "./parts";

/* 훅 장면: 한 방에서 Wi-Fi 기기와 블루투스 기기가 함께 신호를 주고받는다. 아이콘은 SVG로 직접 그린다. */

type Kind = "router" | "laptop" | "phone" | "buds" | "watch" | "mouse";
type Dev = { id: Kind; x: number; y: number; label: string };

const DEVS: Dev[] = [
  { id: "router", x: 960, y: 300, label: "Wi-Fi 공유기" },
  { id: "laptop", x: 470, y: 560, label: "노트북" },
  { id: "phone", x: 960, y: 640, label: "스마트폰" },
  { id: "buds", x: 1420, y: 700, label: "무선 이어폰" },
  { id: "watch", x: 1480, y: 420, label: "스마트워치" },
  { id: "mouse", x: 230, y: 760, label: "무선 마우스" },
];
const pos = (k: Kind) => DEVS.find((d) => d.id === k)!;

/** [보내는 기기, 받는 기기, Wi-Fi인가] */
const LINKS: [Kind, Kind, boolean][] = [
  ["router", "laptop", true],
  ["router", "phone", true],
  ["phone", "buds", false],
  ["phone", "watch", false],
  ["laptop", "mouse", false],
];

const S = { fill: C.panel, stroke: C.text, strokeWidth: 4, strokeLinejoin: "round" as const };

const Icon: React.FC<{ id: Kind }> = ({ id }) => {
  switch (id) {
    case "router":
      return (
        <g>
          <line x1={-50} y1={-30} x2={-70} y2={-95} stroke={C.text} strokeWidth={6} strokeLinecap="round" />
          <line x1={50} y1={-30} x2={70} y2={-95} stroke={C.text} strokeWidth={6} strokeLinecap="round" />
          <rect x={-95} y={-35} width={190} height={70} rx={18} {...S} />
          {[-45, -15, 15, 45].map((x) => <circle key={x} cx={x} cy={0} r={6} fill={C.warn} />)}
        </g>
      );
    case "laptop":
      return (
        <g>
          <rect x={-110} y={-90} width={220} height={140} rx={10} {...S} />
          <rect x={-95} y={-76} width={190} height={112} rx={4} fill="#1d3557" />
          <path d="M-140 58 H140 L120 80 H-120 Z" {...S} />
        </g>
      );
    case "phone":
      return (
        <g>
          <rect x={-42} y={-80} width={84} height={160} rx={16} {...S} />
          <rect x={-32} y={-64} width={64} height={120} rx={6} fill="#1d3557" />
        </g>
      );
    case "buds":
      return (
        <g>
          {[-34, 34].map((x) => (
            <g key={x} transform={`translate(${x},0) scale(${x < 0 ? -1 : 1},1)`}>
              <circle cx={0} cy={-18} r={24} {...S} />
              <rect x={6} y={-12} width={16} height={58} rx={8} {...S} />
            </g>
          ))}
        </g>
      );
    case "watch":
      return (
        <g>
          <rect x={-26} y={-82} width={52} height={50} rx={10} {...S} />
          <rect x={-26} y={32} width={52} height={50} rx={10} {...S} />
          <rect x={-44} y={-44} width={88} height={88} rx={22} {...S} />
          <circle cx={0} cy={0} r={22} fill="none" stroke={C.accent} strokeWidth={4} />
        </g>
      );
    case "mouse":
      return (
        <g>
          <rect x={-34} y={-52} width={68} height={104} rx={34} {...S} />
          <line x1={0} y1={-52} x2={0} y2={-14} stroke={C.text} strokeWidth={4} />
        </g>
      );
  }
};

export const DeviceRoom: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      {LINKS.map(([a, b, wifi], i) => {
        const A = pos(a), B = pos(b), col = wifi ? C.warn : C.accent;
        const show = interpolate(f, [20 + i * 10, 40 + i * 10], [0, 1], clamp);
        // 링크 위를 오가는 패킷 점
        const period = wifi ? 46 : 30, t = ((f + i * 13) % period) / period, back = Math.floor((f + i * 13) / period) % 2 === 1;
        const u = back ? 1 - t : t;
        return (
          <g key={i} opacity={show}>
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={col} strokeWidth={4} strokeDasharray="12 12" opacity={0.6} />
            <circle cx={A.x + (B.x - A.x) * u} cy={A.y + (B.y - A.y) * u} r={11} fill={col} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
      {DEVS.map((d, i) => {
        const wifi = d.id === "router", col = wifi ? C.warn : C.accent;
        const a = interpolate(f, [i * 5, i * 5 + 15], [0, 1], clamp);
        // 퍼져 나가는 전파 고리(공유기 = Wi-Fi, 나머지 = 블루투스. 노트북·스마트폰은 둘 다 쓴다)
        const rings = d.id === "laptop" || d.id === "phone" ? [C.warn, C.accent] : [col];
        return (
          <g key={d.id} opacity={a}>
            {rings.map((rc, k) =>
              [0, 1].map((j) => {
                const p = ((f + j * 30 + k * 15 + i * 7) % 60) / 60;
                return <circle key={`${k}${j}`} cx={d.x} cy={d.y} r={70 + p * 110} fill="none" stroke={rc} strokeWidth={3} opacity={(1 - p) * 0.5} />;
              })
            )}
            <g transform={`translate(${d.x},${d.y})`}><Icon id={d.id} /></g>
            <text x={d.x} y={d.y + 125} textAnchor="middle" fill={C.dim} fontFamily={FONT} fontSize={28} fontWeight={600}>{d.label}</text>
          </g>
        );
      })}
      <g transform="translate(1440,110)" fontFamily={FONT} fontSize={26} fontWeight={700}>
        <circle cx={0} cy={-9} r={10} fill={C.warn} />
        <text x={20} y={0} fill={C.text}>Wi-Fi (2.4 GHz)</text>
        <circle cx={250} cy={-9} r={10} fill={C.accent} />
        <text x={270} y={0} fill={C.text}>블루투스</text>
      </g>
    </svg>
  );
};
