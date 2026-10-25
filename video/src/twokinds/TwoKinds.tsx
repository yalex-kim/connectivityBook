import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Scene3D, Floor, camLerp } from "../afh/world3d";
import { Caption, Title, clamp, fade, useFont } from "../afh/parts";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 책 1장 그림과 같이 클래식(BR/EDR) = 청록, LE = 파랑 */
export const CL = C.accent2, LE = C.accent;
export const S = { fill: C.panel, stroke: C.text, strokeWidth: 4, strokeLinejoin: "round" as const };
export const at = (f: number, c: number, d = 20) => interpolate(f, [c, c + d], [0, 1], clamp);

/* ---------------------------------------------------------------- 작은 그림들 */
export const Phone: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-62} y={-115} width={124} height={230} rx={20} {...S} />
    <rect x={-50} y={-96} width={100} height={180} rx={8} fill="#1d3557" />
    <circle cx={0} cy={100} r={6} fill={C.faint} />
  </g>
);

export const Bud: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    {[-34, 34].map((bx) => (
      <g key={bx} transform={`translate(${bx},0) rotate(${bx < 0 ? 12 : -12})`}>
        <rect x={-11} y={8} width={22} height={76} rx={11} fill="#1d3557" stroke={C.text} strokeWidth={4} />
        <ellipse cx={0} cy={0} rx={30} ry={25} fill="#1d3557" stroke={C.text} strokeWidth={4} />
        <ellipse cx={bx < 0 ? 10 : -10} cy={-2} rx={9} ry={7} fill={CL} />
      </g>
    ))}
  </g>
);

/** 분실물 태그: on 0~1이면 불이 켜진다 */
export const Tag: React.FC<{ x: number; y: number; on: number; scale?: number }> = ({ x, y, on, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-48} y={-48} width={96} height={96} rx={26} {...S} />
    <circle cx={-24} cy={-24} r={9} fill={C.bg} stroke={C.text} strokeWidth={3} />
    <circle cx={10} cy={10} r={14} fill={LE} opacity={0.25 + 0.75 * on} />
  </g>
);

const Bag: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-60 -60 C -60 -130, 60 -130, 60 -60" fill="none" stroke={C.text} strokeWidth={8} />
    <path d="M-130 -60 H130 L110 120 H-110 Z" fill="#24324a" stroke={C.text} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

/** 졸음 표시 */
const Zzz: React.FC<{ x: number; y: number; f: number; a: number }> = ({ x, y, f, a }) => (
  <g opacity={a} fontFamily={FONT} fontWeight={800} fill={C.dim}>
    {[0, 1, 2].map((i) => {
      const p = ((f / 50 + i / 3) % 1);
      return <text key={i} x={x + p * 40} y={y - p * 60} fontSize={22 + i * 6} opacity={1 - p}>z</text>;
    })}
  </g>
);

/** A→B 줄 위로 끊임없이 흐르는 점들 */
export const Stream: React.FC<{ a: [number, number]; b: [number, number]; f: number; col: string; on: number; n?: number; speed?: number; r?: number }> = ({ a, b, f, col, on, n = 8, speed = 0.025, r = 9 }) => (
  <g opacity={on}>
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={3} opacity={0.35} />
    {Array.from({ length: n }, (_, i) => {
      const p = (f * speed + i / n) % 1;
      return <circle key={i} cx={a[0] + (b[0] - a[0]) * p} cy={a[1] + (b[1] - a[1]) * p} r={r} fill={col} />;
    })}
  </g>
);

/** 가끔 한 번: period 프레임마다 점 하나가 A→B로 간다. 돌려주는 값 = 지금 깨어 있는 정도 */
export const pulseAt = (f: number, period: number, phase = 0) => {
  const t = (f + phase) % period;
  return t < 24 ? t / 24 : -1;
};
export const Pulse: React.FC<{ a: [number, number]; b: [number, number]; f: number; col: string; on: number; period?: number; phase?: number }> = ({ a, b, f, col, on, period = 80, phase = 0 }) => {
  const p = pulseAt(f, period, phase);
  return (
    <g opacity={on}>
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={3} strokeDasharray="6 12" opacity={0.35} />
      {p >= 0 && <circle cx={a[0] + (b[0] - a[0]) * p} cy={a[1] + (b[1] - a[1]) * p} r={11} fill={col} />}
    </g>
  );
};

/** 말하는 시간축: 클래식은 촘촘히 계속, LE는 긴 잠 사이에 짧게 */
const Talk: React.FC<{ x: number; y: number; w: number; kind: "classic" | "le"; shown: number; label?: string }> = ({ x, y, w, kind, shown, label }) => {
  const step = kind === "classic" ? 18 : 230, xs: number[] = [];
  for (let t = kind === "classic" ? 0 : 40; t < w * shown; t += step) xs.push(t);
  const col = kind === "classic" ? CL : LE;
  return (
    <g fontFamily={FONT}>
      {label && <text x={x - 24} y={y + 9} textAnchor="end" fill={col} fontSize={28} fontWeight={800}>{label}</text>}
      <line x1={x} x2={x + w * shown} y1={y} y2={y} stroke={C.faint} strokeWidth={3} />
      {xs.map((t, i) => <rect key={i} x={x + t} y={kind === "classic" ? (i % 2 ? y - 34 : y + 2) : y - 46} width={kind === "classic" ? 12 : 12} height={kind === "classic" ? 32 : 46} rx={3} fill={col} />)}
      {kind === "le" && xs.map((t, i) => (t + 130 < w * shown ? <text key={`z${i}`} x={x + t + 115} y={y - 14} textAnchor="middle" fill={C.faint} fontSize={24} fontWeight={700}>zz</text> : null))}
    </g>
  );
};

export const Chip: React.FC<{ x: number; y: number; col: string; children: string; a?: number; size?: number }> = ({ x, y, col, children, a = 1, size = 30 }) => {
  const w = children.length * size * 0.62 + 44;
  return (
    <g opacity={a} transform={`translate(${x},${y})`} fontFamily={FONT}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.6} rx={size * 0.8} fill={col} opacity={0.18} stroke={col} strokeWidth={3} />
      <text x={0} y={size * 0.12} textAnchor="middle" dominantBaseline="middle" fill={C.text} fontSize={size} fontWeight={800}>{children}</text>
    </g>
  );
};

export const Label: React.FC<{ x: number; y: number; children: string; a?: number }> = ({ x, y, children, a = 1 }) => (
  <text x={x} y={y} textAnchor="middle" fill={C.dim} fontFamily={FONT} fontSize={28} fontWeight={700} opacity={a}>{children}</text>
);

/** 지하철 창과 손잡이(배경) */
const Subway: React.FC = () => (
  <g opacity={0.5}>
    <line x1={0} x2={1920} y1={150} y2={150} stroke={C.faint} strokeWidth={6} />
    {[260, 760, 1260, 1760].map((x) => (
      <g key={x}>
        <rect x={x - 180} y={210} width={360} height={170} rx={24} fill="#0f1a2e" stroke="#22324d" strokeWidth={4} />
        <path d={`M${x - 40} 150 v26 a20 20 0 1 0 0.1 0`} fill="none" stroke={C.faint} strokeWidth={5} />
      </g>
    ))}
  </g>
);

const BUD: [number, number] = [430, 560], PH: [number, number] = [960, 560], TAGP: [number, number] = [1500, 620];

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), talk = at(f, cues[1]), q = at(f, cues[4]);
  const wake = pulseAt(f, 90, 60), tagOn = f > cues[1] && wake >= 0 ? 1 - wake : 0;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <Subway />
      <Stream a={[BUD[0] + 70, BUD[1]]} b={[PH[0] - 80, PH[1]]} f={f} col={CL} on={talk * (0.4 + 0.6 * at(f, cues[2]))} />
      <Pulse a={[TAGP[0] - 70, TAGP[1] - 40]} b={[PH[0] + 80, PH[1]]} f={f} col={LE} on={talk} period={90} phase={60} />
      <Bud x={BUD[0]} y={BUD[1] - 10} scale={1.3} />
      <Phone x={PH[0]} y={PH[1]} scale={1.15} />
      <Bag x={TAGP[0]} y={TAGP[1] + 60} />
      <Tag x={TAGP[0]} y={TAGP[1]} on={tagOn} scale={1.2} />
      <Zzz x={TAGP[0] + 60} y={TAGP[1] - 70} f={f} a={at(f, cues[3]) * (tagOn > 0 ? 0.2 : 1)} />
      <Label x={BUD[0]} y={720} a={at(f, 10)}>무선 이어폰</Label>
      <Label x={PH[0]} y={740} a={at(f, cues[1])}>휴대폰</Label>
      <Label x={TAGP[0]} y={830} a={at(f, 30)}>분실물 태그</Label>
      <text x={960} y={330} textAnchor="middle" fill={C.accent} opacity={q} fontFamily={FONT} fontSize={120} fontWeight={900}>?</text>
    </svg>
  );
};

/* ---------------------------------------------------------------- 2. 이름 아래 둘 */
const Split: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), s = interpolate(f, [25, 60], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) }), sub = at(f, 60);
  const L = 960 - 420 * s, R = 960 + 420 * s;
  return (
    <>
      <Title kicker="답부터 말하면">이름은 하나, 시스템은 둘</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Chip x={960} y={330} col={C.text} size={44} a={1 - 0.6 * s}>블루투스</Chip>
        <g opacity={s}>
          <path d={`M960 370 C 960 430, ${L} 400, ${L} 470`} fill="none" stroke={CL} strokeWidth={4} />
          <path d={`M960 370 C 960 430, ${R} 400, ${R} 470`} fill="none" stroke={LE} strokeWidth={4} />
        </g>
        <Chip x={L} y={520} col={CL} size={40} a={s}>클래식 (BR/EDR)</Chip>
        <Chip x={R} y={520} col={LE} size={40} a={s}>LE (저전력)</Chip>
        <g opacity={sub}>
          <Talk x={L - 260} y={700} w={520} kind="classic" shown={interpolate(f, [60, len - 10], [0.2, 1], clamp)} />
          <Talk x={R - 260} y={700} w={520} kind="le" shown={interpolate(f, [60, len - 10], [0.2, 1], clamp)} />
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 클래식: 선을 없애려고 */
const OldPhone: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-10} y={-170} width={18} height={60} rx={8} {...S} />
    <rect x={-60} y={-120} width={120} height={250} rx={22} {...S} />
    <rect x={-44} y={-100} width={88} height={70} rx={6} fill="#1d3557" />
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={-40 + (i % 3) * 30} y={-6 + Math.floor(i / 3) * 34} width={20} height={20} rx={5} fill={C.faint} />)}
  </g>
);
const Headset: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <path d="M-70 10 C -70 -110, 70 -110, 70 10" fill="none" stroke={C.text} strokeWidth={10} strokeLinecap="round" />
    <rect x={-96} y={-10} width={50} height={80} rx={20} {...S} />
    <rect x={46} y={-10} width={50} height={80} rx={20} {...S} />
    <path d="M-72 60 C -72 120, -10 130, 20 120" fill="none" stroke={C.text} strokeWidth={6} strokeLinecap="round" />
    <circle cx={24} cy={119} r={10} fill={C.text} />
  </g>
);
const Classic: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cut = at(f, cues[0] + 60, 30), wire = at(f, cues[0] + 80, 20), tl = interpolate(f, [cues[1], len - 20], [0, 1], clamp);
  const A: [number, number] = [470, 500], B: [number, number] = [910, 470];
  return (
    <>
      <Title kicker="첫 번째 블루투스">선을 없애려고: 클래식</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <path d={`M${A[0]} 630 C ${A[0]} 760, ${B[0] - 80} 760, ${B[0] - 72} 590`} fill="none" stroke={C.text} strokeWidth={6} strokeDasharray="1400" strokeDashoffset={1400 * cut} opacity={1 - cut} />
        <Stream a={[A[0] + 80, A[1]]} b={[B[0] - 110, B[1]]} f={f} col={CL} on={wire} n={6} />
        <OldPhone x={A[0]} y={A[1]} />
        <Headset x={B[0]} y={B[1]} />
        <text x={690} y={830} textAnchor="middle" fill={C.faint} fontSize={24}>1994년 에릭슨: 휴대폰·헤드셋 사이의 케이블을 짧은 무선으로</text>
        <g opacity={at(f, cues[1])}>
          <rect x={1140} y={330} width={680} height={420} rx={24} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={1180} y={392} fill={CL} fontSize={30} fontWeight={800}>한번 이어지면 쉬지 않고 주고받는다</text>
          <Talk x={1190} y={560} w={580} kind="classic" shown={tl} />
          <text x={1190} y={700} fill={C.faint} fontSize={22}>시간 → (위·아래 = 서로 번갈아 보내는 패킷)</text>
        </g>
        <Chip x={1480} y={830} col={CL} a={at(f, cues[2])}>클래식 블루투스 (BR/EDR)</Chip>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. LE: 오래 버티려고 */
const Watch: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-30} y={-90} width={60} height={180} rx={14} fill="#24324a" stroke={C.text} strokeWidth={3} />
    <rect x={-50} y={-55} width={100} height={110} rx={26} {...S} />
    <path d="M-22 0 l12 -14 l10 22 l10 -26 l12 18" fill="none" stroke={C.ok} strokeWidth={5} strokeLinejoin="round" />
  </g>
);
const Scale: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-80} y={-60} width={160} height={120} rx={22} {...S} />
    <rect x={-36} y={-42} width={72} height={30} rx={6} fill="#1d3557" />
    <text x={0} y={-20} textAnchor="middle" fill={LE} fontFamily={FONT} fontSize={20} fontWeight={800}>65.2</text>
  </g>
);
const Lock: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-46} y={-80} width={92} height={160} rx={18} {...S} />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-22 + (i % 3) * 22} cy={-40 + Math.floor(i / 3) * 26} r={7} fill={C.faint} />)}
    <rect x={-30} y={46} width={60} height={14} rx={7} fill={C.faint} />
  </g>
);
const Coin: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`} fontFamily={FONT}>
    <ellipse cx={0} cy={14} rx={70} ry={22} fill="#56647c" />
    <rect x={-70} y={-6} width={140} height={20} fill="#56647c" />
    <ellipse cx={0} cy={-6} rx={70} ry={22} fill="#b9c3d3" stroke={C.text} strokeWidth={3} />
    <text x={0} y={2} textAnchor="middle" fill={C.bg} fontSize={26} fontWeight={900}>+</text>
  </g>
);
const LeScene: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), tl = interpolate(f, [cues[3], len - 20], [0, 1], clamp);
  const icons = [<Watch x={0} y={0} />, <Scale x={0} y={0} />, <Tag x={0} y={0} on={0.6} />, <Lock x={0} y={0} />];
  return (
    <>
      <Title kicker="두 번째 블루투스">오래 버티려고: LE (저전력)</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {icons.map((ic, i) => {
          const a = at(f, 10 + i * 12), x = 260 + i * 260;
          return (
            <g key={i} opacity={a} transform={`translate(${x},${400 + (1 - a) * 20})`}>
              {ic}
              <Pulse a={[0, -110]} b={[0, -200]} f={f} col={LE} on={at(f, 40)} period={110} phase={i * 27} />
            </g>
          );
        })}
        {["시계", "체중계", "분실물 태그", "도어락"].map((t, i) => <Label key={t} x={260 + i * 260} y={545} a={at(f, 10 + i * 12)}>{t}</Label>)}
        <g opacity={at(f, cues[1])}>
          <Coin x={1450} y={400} />
          <text x={1450} y={490} textAnchor="middle" fill={C.dim} fontSize={28} fontWeight={700}>작은 전지 하나로 오래</text>
        </g>
        <Chip x={1450} y={250} col={LE} a={at(f, cues[2])} size={30}>2010 · Bluetooth 4.0</Chip>
        <g opacity={at(f, cues[3])}>
          <Talk x={360} y={660} w={1380} kind="classic" shown={tl} label="클래식" />
          <Talk x={360} y={800} w={1380} kind="le" shown={tl} label="LE" />
          <text x={360} y={862} fill={C.faint} fontSize={22}>시간 → (LE: 대부분 잠자고, 깨어날 때만 짧게 주고받는다)</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 채널 (3D) */
// 가로 = 주파수(1 MHz = 1, 2441 MHz가 가운데). 앞줄 = 클래식 79채널(2402 + k, 낮게), 뒷줄 = LE 40채널(2402 + 2k, 높게)
const X = (mhz: number) => mhz - 2441;
const Lanes3D: React.FC<{ f: number; len: number; cues: number[] }> = ({ f, len, cues }) => {
  const cl = interpolate(f, [cues[1], cues[1] + 50], [0, 1], clamp), le = interpolate(f, [cues[2], cues[2] + 40], [0, 1], clamp);
  const cam = camLerp({ pos: [0, 52, 96], look: [0, 0, 0], fov: 40 }, { pos: [-34, 40, 74], look: [-2, 2, 0], fov: 40 }, f / len);
  return (
    <Scene3D cam={cam}>
      <Floor />
      {[2400, 2483.5].map((m) => (
        <mesh key={m} position={[X(m), 0.6, 0]}>
          <boxGeometry args={[0.3, 1.2, 22]} />
          <meshStandardMaterial color={C.faint} />
        </mesh>
      ))}
      {Array.from({ length: 79 }, (_, k) => {
        const a = Math.max(0, Math.min(1, cl * 79 - k)), h = 3.5 * a;
        return a > 0 ? (
          <mesh key={k} position={[X(2402 + k), h / 2, 5]}>
            <boxGeometry args={[0.7, Math.max(h, 0.05), 1.6]} />
            <meshStandardMaterial color={CL} emissive={CL} emissiveIntensity={0.3} />
          </mesh>
        ) : null;
      })}
      {Array.from({ length: 40 }, (_, k) => {
        const a = Math.max(0, Math.min(1, le * 40 - k)), h = 7 * a;
        return a > 0 ? (
          <mesh key={k} position={[X(2402 + 2 * k), h / 2, -5]}>
            <boxGeometry args={[1.6, Math.max(h, 0.05), 1.6]} />
            <meshStandardMaterial color={LE} emissive={LE} emissiveIntensity={0.3} />
          </mesh>
        ) : null;
      })}
    </Scene3D>
  );
};
const Lanes: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), no = at(f, cues[3]);
  return (
    <>
      <Lanes3D f={f} len={len} cues={cues} />
      <Title kicker="같은 대역, 다른 채널">클래식 79개 · LE 40개</Title>
      <div style={{ position: "absolute", left: 110, top: 740, display: "flex", flexDirection: "column", gap: 12, fontFamily: FONT, fontSize: 26, color: C.dim, background: "rgba(11,18,32,.85)", padding: "16px 24px", borderRadius: 16 }}>
        <span style={{ opacity: at(f, cues[1]) }}><b style={{ color: CL }}>■</b> 앞줄 · 클래식: 1 MHz 폭 × 79개 (2402~2480 MHz)</span>
        <span style={{ opacity: at(f, cues[2]) }}><b style={{ color: LE }}>■</b> 뒷줄 · LE: 2 MHz 폭 × 40개 (2402~2480 MHz)</span>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: no }} fontFamily={FONT}>
        <rect x={1300} y={640} width={520} height={220} rx={24} fill={C.panel} opacity={0.94} stroke="#24324a" strokeWidth={2} />
        <Bud x={1400} y={730} scale={0.75} />
        <Tag x={1720} y={745} on={1} scale={0.85} />
        <line x1={1470} x2={1650} y1={745} y2={745} stroke={C.faint} strokeWidth={4} strokeDasharray="10 10" />
        <path d="M1538 723 l44 44 M1582 723 l-44 44" stroke={C.bad} strokeWidth={8} strokeLinecap="round" />
        <text x={1400} y={835} textAnchor="middle" fill={CL} fontSize={22} fontWeight={700}>클래식만</text>
        <text x={1720} y={835} textAnchor="middle" fill={LE} fontSize={22} fontWeight={700}>LE만</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 둘 다 쓰는 기기 */
const Both: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), two = at(f, cues[1]), tag = at(f, cues[2]);
  const B2: [number, number] = [430, 520], P2: [number, number] = [960, 520], T2: [number, number] = [1500, 520];
  const p = pulseAt(f, 100, 30);
  return (
    <>
      <Title kicker="그래서">휴대폰은 둘 다, 태그는 LE만</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={two}>
          <Stream a={[B2[0] + 80, B2[1] - 40]} b={[P2[0] - 80, P2[1] - 40]} f={f} col={CL} on={1} />
          <Pulse a={[P2[0] - 80, P2[1] + 50]} b={[B2[0] + 80, B2[1] + 50]} f={f} col={LE} on={1} period={100} phase={30} />
          <text x={695} y={B2[1] - 70} textAnchor="middle" fill={CL} fontSize={26} fontWeight={800}>음악 (클래식)</text>
          <text x={695} y={B2[1] + 104} textAnchor="middle" fill={LE} fontSize={26} fontWeight={800}>배터리 잔량 (LE)</text>
          {p >= 0 && <text x={695} y={B2[1] + 140} textAnchor="middle" fill={C.dim} fontSize={22}>왼쪽 80% · 오른쪽 75% (예)</text>}
        </g>
        <Pulse a={[T2[0] - 70, T2[1]]} b={[P2[0] + 80, P2[1]]} f={f} col={LE} on={tag} period={90} phase={10} />
        <text x={1225} y={T2[1] - 30} textAnchor="middle" fill={LE} fontSize={26} fontWeight={800} opacity={tag}>LE만</text>
        <Bud x={B2[0]} y={B2[1] - 10} scale={1.2} />
        <Phone x={P2[0]} y={P2[1]} scale={1.1} />
        <Tag x={T2[0]} y={T2[1]} on={tag * (pulseAt(f, 90, 10) >= 0 ? 1 : 0.2)} scale={1.3} />
        <Chip x={P2[0]} y={740} col={C.text} a={at(f, 10)} size={28}>클래식 + LE</Chip>
        <Label x={B2[0]} y={690} a={two}>무선 이어폰</Label>
        <Label x={T2[0]} y={650} a={tag}>분실물 태그</Label>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), wake = pulseAt(f, 90, 60);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <Subway />
      <Stream a={[BUD[0] + 70, BUD[1]]} b={[PH[0] - 80, PH[1]]} f={f} col={CL} on={1} />
      <Pulse a={[TAGP[0] - 70, TAGP[1] - 40]} b={[PH[0] + 80, PH[1]]} f={f} col={LE} on={1} period={90} phase={60} />
      <Bud x={BUD[0]} y={BUD[1] - 10} scale={1.3} />
      <Phone x={PH[0]} y={PH[1]} scale={1.15} />
      <Bag x={TAGP[0]} y={TAGP[1] + 60} />
      <Tag x={TAGP[0]} y={TAGP[1]} on={wake >= 0 ? 1 - wake : 0} scale={1.2} />
      <rect x={160} y={110} width={1600} height={150} rx={28} fill={C.bg} opacity={0.88} />
      <text x={960} y={208} textAnchor="middle" fill={C.text} fontSize={52} fontWeight={900} opacity={at(f, 10)}>
        쉬지 않고 이야기하는 <tspan fill={CL}>클래식</tspan> · 자다가 잠깐 말하는 <tspan fill={LE}>LE</tspan>
      </text>
      <Chip x={BUD[0]} y={740} col={CL} a={at(f, cues[1])}>클래식 + LE</Chip>
      <Chip x={TAGP[0] + 200} y={500} col={LE} a={at(f, cues[1])}>LE</Chip>
      <Chip x={PH[0]} y={760} col={C.text} a={at(f, cues[1])} size={26}>휴대폰: 둘 다</Chip>
      <g opacity={at(f, cues[2])}>
        <Talk x={BUD[0] - 200} y={830} w={400} kind="classic" shown={1} />
        <Talk x={TAGP[0] - 230} y={860} w={460} kind="le" shown={1} />
      </g>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} />;
    case "split": return <Split len={s.frames} />;
    case "classic": return <Classic cues={s.cues} len={s.frames} />;
    case "le": return <LeScene cues={s.cues} len={s.frames} />;
    case "lanes": return <Lanes cues={s.cues} len={s.frames} />;
    case "both": return <Both cues={s.cues} />;
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
          <Audio src={staticFile(`audio/twokinds/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const TwoKinds: React.FC<{ voice: boolean }> = ({ voice }) => {
  useFont();
  let from = 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1600px 900px at 50% 35%, #12213a, ${C.bg})` }}>
      {scenesFor(voice).map((s) => {
        const start = from;
        from += s.frames;
        return (
          <Sequence key={s.id} from={start} durationInFrames={s.frames}>
            <SceneFrame s={s} voice={voice} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
