import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { F_BT, pathLoss, rangeFactor } from "../book";
import { Caption, Title, clamp, fade, useFont } from "../afh/parts";
import { CL, LE, S, at, Phone, Bud, Tag, Pulse, Chip, Label } from "../twokinds/TwoKinds";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 링크 버짓 예시 조건(책 2장 시뮬레이터와 같은 모델): 송신 0 dBm, 집(n = 2.7), 10 m, 벽·몸 각 −12 dB, 칩 감도 −95 dBm(대표값) */
const N_HOME = 2.7, D_EX = 10, WALL = 12, BODY = 12, SENS_CHIP = -95, SENS_SPEC = -70, SENS_S8 = -82, FADE = 10;
const LOSS_EX = pathLoss(D_EX, N_HOME, F_BT); // ≈ 67.2 dB
const OK = C.ok, BAD = C.bad;

/* ---------------------------------------------------------------- 사람(옆모습, 오른쪽을 본다) */
const Person: React.FC<{ x: number; y: number; scale?: number; water?: number }> = ({ x, y, scale = 1, water = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-34} y={300} width={30} height={250} rx={14} fill="#24324a" stroke={C.text} strokeWidth={4} />
    <rect x={4} y={300} width={30} height={250} rx={14} fill="#24324a" stroke={C.text} strokeWidth={4} />
    <rect x={-62} y={60} width={124} height={270} rx={50} fill="#24324a" stroke={C.text} strokeWidth={4} />
    <rect x={-62} y={60} width={124} height={270} rx={50} fill={LE} opacity={0.35 * water} />
    <circle cx={0} cy={0} r={52} fill="#24324a" stroke={C.text} strokeWidth={4} />
    <circle cx={0} cy={0} r={52} fill={LE} opacity={0.35 * water} />
    <circle cx={-4} cy={4} r={11} fill={CL} stroke={C.text} strokeWidth={3} />
  </g>
);
/** 사람 그림 기준 위치: 귀(이어폰)와 뒷주머니(휴대폰) */
const ear = (x: number, y: number, s = 1): [number, number] => [x - 4 * s, y + 4 * s];
const pocket = (x: number, y: number, s = 1): [number, number] => [x - 72 * s, y + 290 * s];
const MiniPhone: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${scale})`}>
    <rect x={-22} y={-40} width={44} height={80} rx={9} {...S} />
    <rect x={-16} y={-32} width={32} height={60} rx={4} fill="#1d3557" />
  </g>
);
const Cross: React.FC<{ x: number; y: number; a: number; r?: number }> = ({ x, y, a, r = 22 }) => (
  <path d={`M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}`} stroke={BAD} strokeWidth={9} strokeLinecap="round" opacity={a} />
);

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), px = 430, py = 330, e = ear(px, py), p = pocket(px, py);
  const broke = at(f, cues[1] + 30), far = at(f, cues[2]), q = at(f, cues[3]);
  const flicker = broke > 0 ? (Math.floor(f / 6) % 3 === 0 ? 0.2 : 1) : 1;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <g opacity={at(f, 0)}>
        <line x1={760} x2={1760} y1={200} y2={200} stroke={C.dim} strokeWidth={4} />
        {Array.from({ length: 11 }, (_, i) => <line key={i} x1={760 + i * 100} x2={760 + i * 100} y1={200} y2={i % 5 ? 220 : 236} stroke={C.dim} strokeWidth={4} />)}
        <text x={760} y={180} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={700}>0</text>
        <text x={1760} y={180} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>10 m ?</text>
      </g>
      <g opacity={at(f, cues[1])}>
        <line x1={p[0]} y1={p[1]} x2={e[0]} y2={e[1]} stroke={CL} strokeWidth={5} strokeDasharray="12 10" opacity={flicker} />
        <Cross x={(p[0] + e[0]) / 2 - 10} y={(p[1] + e[1]) / 2} a={broke} />
        <text x={px - 190} y={py + 230} textAnchor="middle" fill={BAD} fontSize={28} fontWeight={800} opacity={broke}>뚝뚝</text>
      </g>
      <Person x={px} y={py} />
      <MiniPhone x={p[0]} y={p[1]} scale={0.9} />
      <Label x={px} y={py + 620} a={at(f, cues[1])}>뒷주머니 → 귀: 약 1 m</Label>
      <g opacity={far}>
        <Phone x={900} y={560} scale={0.8} />
        <Pulse a={[1690, 560]} b={[970, 560]} f={f} col={LE} on={1} period={70} />
        <Tag x={1750} y={560} on={1} scale={0.9} />
        <Label x={1325} y={640}>훨씬 먼 곳</Label>
      </g>
      <text x={1325} y={800} textAnchor="middle" fill={C.accent} opacity={q} fontSize={120} fontWeight={900}>?</text>
    </svg>
  );
};

/* ---------------------------------------------------------------- 세기 눈금(dBm) */
const Y0 = 250, PX_DB = 5.2; // 0 dBm의 화면 y, 1 dB의 높이
const Y = (dbm: number) => Y0 - dbm * PX_DB;
const Axis: React.FC<{ x: number; marks?: number[]; label?: boolean }> = ({ x, marks = [0, -20, -40, -60, -80, -100], label = true }) => (
  <g fontFamily={FONT}>
    <line x1={x} x2={x} y1={Y(0)} y2={Y(-110)} stroke={C.faint} strokeWidth={3} />
    {marks.map((m) => (
      <g key={m}>
        <line x1={x - 10} x2={x} y1={Y(m)} y2={Y(m)} stroke={C.faint} strokeWidth={3} />
        <text x={x - 18} y={Y(m) + 8} textAnchor="end" fill={C.faint} fontSize={22}>{m} dBm</text>
      </g>
    ))}
    {label && <text x={x - 18} y={Y0 - 40} textAnchor="end" fill={C.dim} fontSize={24} fontWeight={700}>세기 ↑</text>}
  </g>
);

/* ---------------------------------------------------------------- 2. 예산 */
const STEPS: [string, number][] = [["거리 10 m (집)", LOSS_EX], ["벽 하나", WALL], ["몸이 가림", BODY]];
const Budget: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), x0 = 420, colW = 220;
  const levels = STEPS.reduce<number[]>((a, [, l]) => [...a, a[a.length - 1] - l], [0]); // 0, −67.2, −79.2, −91.2
  const rx = levels[3], fadeA = at(f, cues[4]), final = rx - FADE * fadeA;
  const sensA = at(f, cues[2]), mA = at(f, cues[3]);
  const col = final >= SENS_CHIP ? OK : BAD;
  return (
    <>
      <Title kicker="답은 세기">보낸 세기 − 깎인 만큼 ≥ 수신 감도?</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Axis x={x0 - 30} />
        <rect x={x0} y={Y(0)} width={200} height={14} rx={6} fill={LE} opacity={at(f, 10)} />
        <text x={x0} y={Y(0) - 18} fill={C.text} fontSize={26} fontWeight={800} opacity={at(f, 10)}>보낸 세기 0 dBm (1 mW)</text>
        {STEPS.map(([name, l], i) => {
          const a = at(f, cues[1] + i * 25), x = x0 + (i + 1) * colW, from = levels[i], to = from - l * a;
          return (
            <g key={name} opacity={interpolate(a, [0, 0.15], [0, 1], clamp)}>
              <line x1={x - colW + 200} x2={x + 20} y1={Y(from)} y2={Y(from)} stroke={C.faint} strokeWidth={3} strokeDasharray="6 8" />
              <rect x={x + 20} y={Y(from)} width={60} height={Math.max(2, Y(to) - Y(from))} rx={8} fill={C.warn} opacity={0.75} />
              <text x={x + 92} y={(Y(from) + Y(from - l)) / 2 + 9} fill={C.warn} fontSize={24} fontWeight={800}>−{l.toFixed(0)} dB</text>
              <text x={x + 50} y={Y(-108) + 4} textAnchor="middle" fill={C.dim} fontSize={24} fontWeight={700}>{name}</text>
            </g>
          );
        })}
        <g opacity={fadeA}>
          <rect x={x0 + 4 * colW + 20} y={Y(rx)} width={60} height={Y(rx - FADE) - Y(rx)} rx={8} fill={BAD} opacity={0.8} />
          <text x={x0 + 4 * colW + 8} y={Y(rx) - 2} textAnchor="end" fill={BAD} fontSize={24} fontWeight={800}>−{FADE} dB</text>
          <text x={x0 + 4 * colW + 50} y={Y(-108) + 4} textAnchor="middle" fill={C.dim} fontSize={24} fontWeight={700}>반사파 (순간)</text>
        </g>
        <g opacity={sensA}>
          <line x1={x0} x2={1820} y1={Y(SENS_CHIP)} y2={Y(SENS_CHIP)} stroke={C.text} strokeWidth={3} strokeDasharray="14 10" />
          <text x={x0 + 10} y={Y(SENS_CHIP) - 14} fill={C.text} fontSize={24} fontWeight={700}>수신 감도 {SENS_CHIP} dBm (요즘 칩 대표값)</text>
          <rect x={x0 + 4 * colW + 200} y={Y(final) - 7} width={180} height={14} rx={6} fill={col} />
          <text x={x0 + 4 * colW + 290} y={fadeA > 0.5 ? Y(final) + 44 : Y(final) - 18} textAnchor="middle" fill={col} fontSize={26} fontWeight={800}>받은 세기 {final.toFixed(0)} dBm</text>
        </g>
        <g opacity={mA * (1 - fadeA)}>
          <path d={`M${x0 + 4 * colW + 400} ${Y(rx)} h14 V${Y(SENS_CHIP)} h-14`} fill="none" stroke={OK} strokeWidth={4} />
          <text x={x0 + 4 * colW + 426} y={Y(rx) - 10} fill={OK} fontSize={28} fontWeight={900}>마진 {(rx - SENS_CHIP).toFixed(0)} dB</text>
        </g>
        <text x={x0 + 4 * colW + 400} y={Y(final) + 12} fill={BAD} fontSize={34} fontWeight={900} opacity={fadeA}>끊김</text>
        <text x={110} y={880} fill={C.faint} fontSize={22}>예: 송신 0 dBm, 집(경로 손실 지수 2.7)에서 10 m, 벽·몸 각 −12 dB (책 2장 링크 버짓 시뮬레이터와 같은 계산). 실제 값은 기기와 환경마다 다르다.</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 거리 */
const GX0 = 380, GW = 1360, DMIN = 0.5, DMAX = 100;
const GX = (d: number) => GX0 + ((Math.log10(d) - Math.log10(DMIN)) / (Math.log10(DMAX) - Math.log10(DMIN))) * GW;
const curve = (n: number, upto: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const d = DMIN * Math.pow(DMAX / DMIN, i / 120);
    if (d > upto) break;
    pts.push(`${GX(d).toFixed(1)},${Y(-pathLoss(d, n, F_BT)).toFixed(1)}`);
  }
  return pts.join(" ");
};
const Distance: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), one = at(f, cues[1]);
  const open = interpolate(f, [cues[2], cues[3]], [1, DMAX], { ...clamp, easing: (t) => t * t }), home = interpolate(f, [cues[3], len - 30], [1, DMAX], clamp);
  return (
    <>
      <Title kicker="깎이는 몫 ① 거리">멀어질수록 빠르게 약해진다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Axis x={GX0 - 20} />
        <line x1={GX0} x2={GX0 + GW} y1={Y(-110)} y2={Y(-110)} stroke={C.faint} strokeWidth={3} />
        {[0.5, 1, 2, 4, 8, 16, 32, 64, 100].map((d) => <text key={d} x={GX(d)} y={Y(-110) + 34} textAnchor="middle" fill={C.faint} fontSize={22}>{d} m</text>)}
        <rect x={GX0 - 12} y={Y(0) - 7} width={24} height={14} rx={5} fill={LE} />
        <text x={GX0 + 20} y={Y(0) + 8} fill={C.dim} fontSize={22}>보낸 세기 0 dBm</text>
        <polyline points={curve(2, Math.max(open, 1))} fill="none" stroke={CL} strokeWidth={6} opacity={one} />
        <g opacity={one}>
          <circle cx={GX(1)} cy={Y(-pathLoss(1, 2, F_BT))} r={12} fill={C.text} />
          <path d={`M${GX(1) - 40} ${Y(0)} V${Y(-pathLoss(1, 2, F_BT))}`} stroke={C.text} strokeWidth={3} strokeDasharray="6 6" />
          <text x={GX(1) - 52} y={Y(-20)} textAnchor="end" fill={C.text} fontSize={30} fontWeight={900}>1 m: −40 dB</text>
          <text x={GX(1) - 52} y={Y(-20) + 38} textAnchor="end" fill={C.dim} fontSize={24}>(1/10,000)</text>
        </g>
        {[2, 4, 8, 16].map((d) => {
          const a = open >= d ? at(f, cues[2] + 10 * Math.log2(d), 10) : 0;
          return (
            <g key={d} opacity={a}>
              <circle cx={GX(d)} cy={Y(-pathLoss(d, 2, F_BT))} r={9} fill={CL} />
              <text x={GX(d) + 12} y={Y(-pathLoss(d, 2, F_BT)) - 16} fill={CL} fontSize={24} fontWeight={800}>−6 dB</text>
            </g>
          );
        })}
        <polyline points={curve(N_HOME, Math.max(home, 1))} fill="none" stroke={C.warn} strokeWidth={6} opacity={at(f, cues[3])} />
        <g fontSize={24} fontWeight={700}>
          <text x={GX0 + GW} y={Y(-4)} textAnchor="end" fill={CL} opacity={at(f, cues[2])}>━ 트인 곳: 거리 2배 → 1/4 (−6 dB)</text>
          <text x={GX0 + GW} y={Y(-11)} textAnchor="end" fill={C.warn} opacity={at(f, cues[3])}>━ 집 안: 더 가파르게 (경로 손실 지수 2.7)</text>
        </g>
        <text x={110} y={880} fill={C.faint} fontSize={22}>2.44 GHz, 1 m까지 자유 공간 손실(40.2 dB), 그 뒤 10·n·log₁₀(d) dB (트인 곳 n = 2, 집 n = 2.7). 가로는 로그 눈금.</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 사람 몸 */
const Microwave: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <rect x={-110} y={-70} width={220} height={140} rx={16} {...S} />
    <rect x={-92} y={-52} width={140} height={104} rx={8} fill="#1d3557" />
    <path d="M-50 10 q 8 -14 0 -28 M-25 10 q 8 -14 0 -28 M0 10 q 8 -14 0 -28" stroke={C.warn} strokeWidth={4} fill="none" />
    {[-30, 0, 30].map((dy) => <circle key={dy} cx={80} cy={dy} r={7} fill={C.faint} />)}
  </g>
);
/** 순간 세기: 페이딩으로 출렁이는 선(예시 곡선)과 감도 선 */
const fadingAt = (t: number) => -5 * Math.sin(t * 1.3) - 3 * Math.sin(t * 3.1 + 1) - 26 * Math.exp(-((t - 6) ** 2) / 0.4) - 24 * Math.exp(-((t - 15) ** 2) / 0.3);
const Body: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), px = 420, py = 330, e = ear(px, py), p = pocket(px, py);
  const water = at(f, cues[1]), cut = at(f, cues[3]), refl = at(f, cues[4]);
  const strength = 1 - 0.99 * cut; // 몸이 가리면 1/100
  const span = interpolate(f, [cues[4], len - 10], [0, 1], clamp);
  return (
    <>
      <Title kicker="깎이는 몫 ② 사람 몸">몸은 대부분 물이다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={p[0]} y1={p[1]} x2={e[0]} y2={e[1]} stroke={CL} strokeWidth={6} strokeDasharray="12 10" opacity={0.25 + 0.75 * strength} />
        <Person x={px} y={py} water={water} />
        <MiniPhone x={p[0]} y={p[1]} scale={0.9} />
        <g opacity={water}>
          <path d="M1000 300 C 1000 300, 960 360, 960 390 a40 40 0 0 0 80 0 C 1040 360, 1000 300, 1000 300 Z" fill={LE} opacity={0.8} />
          <text x={1000} y={480} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={700}>물 → 2.4 GHz를 흡수</text>
        </g>
        <g opacity={at(f, cues[2])}>
          <Microwave x={1320} y={380} />
          <text x={1320} y={500} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={700}>전자레인지: 약 2.45 GHz</text>
        </g>
        <g opacity={cut * (1 - refl)}>
          <text x={760} y={620} fill={C.text} fontSize={30} fontWeight={800}>몸이 가린 신호</text>
          <rect x={760} y={650} width={640} height={40} rx={12} fill="#1b2840" />
          <rect x={760} y={650} width={640 * Math.max(0.01, strength)} height={40} rx={12} fill={CL} />
          <text x={1420} y={680} fill={C.text} fontSize={30} fontWeight={900}>{strength < 0.02 ? "1/100 아래 (−20 dB 넘게)" : ""}</text>
          <text x={760} y={740} fill={C.faint} fontSize={22}>자세에 따라 수 dB에서 20 dB 넘게 (책 2장)</text>
        </g>
        <g opacity={refl}>
          <rect x={760} y={560} width={1000} height={260} rx={20} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={790} y={606} fill={C.text} fontSize={26} fontWeight={800}>반사파가 겹치면 순간 세기가 출렁인다 (예시)</text>
          <line x1={790} x2={1730} y1={740} y2={740} stroke={C.text} strokeWidth={3} strokeDasharray="12 8" />
          <text x={1730} y={790} textAnchor="end" fill={C.dim} fontSize={22}>수신 감도</text>
          <polyline
            points={Array.from({ length: Math.max(2, Math.round(160 * span)) }, (_, i) => `${790 + i * (940 / 160)},${690 - 4 * fadingAt(i / 8)}`).join(" ")}
            fill="none" stroke={CL} strokeWidth={5} />
          {Array.from({ length: Math.round(160 * span) }, (_, i) => i).filter((i) => 690 - 4 * fadingAt(i / 8) > 740).map((i) => <circle key={i} cx={790 + i * (940 / 160)} cy={750} r={5} fill={BAD} />)}
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 받는 쪽: 감도 */
const Sens: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), x = 560, spec = at(f, cues[1]), chip = at(f, cues[2]), bars = at(f, cues[3]), cls = at(f, cues[4]);
  const k = rangeFactor(SENS_SPEC - SENS_CHIP, N_HOME); // ≈ 8.4
  return (
    <>
      <Title kicker="예산의 다른 끝">받는 쪽이 얼마나 예민한가</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Axis x={x} />
        <g opacity={at(f, 10)}>
          <rect x={x + 10} y={Y(0) - 6} width={260} height={12} rx={5} fill={LE} />
          <text x={x + 290} y={Y(0) + 9} fill={C.dim} fontSize={24}>0 dBm = 1 mW</text>
        </g>
        <g opacity={spec}>
          <rect x={x + 10} y={Y(SENS_SPEC) - 6} width={260} height={12} rx={5} fill={C.warn} />
          <text x={x + 290} y={Y(SENS_SPEC) + 9} fill={C.warn} fontSize={26} fontWeight={800}>사양의 최소 감도 −70 dBm (LE 1M)</text>
        </g>
        <g opacity={chip}>
          <rect x={x + 10} y={Y(SENS_CHIP) - 6} width={260} height={12} rx={5} fill={OK} />
          <text x={x + 290} y={Y(SENS_CHIP) + 9} fill={OK} fontSize={26} fontWeight={800}>요즘 칩 약 −95 dBm (대표값)</text>
          <path d={`M${x + 140} ${Y(SENS_SPEC) + 14} V${Y(SENS_CHIP) - 14}`} stroke={C.text} strokeWidth={4} />
          <path d={`M${x + 128} ${Y(SENS_CHIP) - 30} L${x + 140} ${Y(SENS_CHIP) - 12} L${x + 152} ${Y(SENS_CHIP) - 30}`} fill="none" stroke={C.text} strokeWidth={4} />
          <text x={x + 160} y={(Y(SENS_SPEC) + Y(SENS_CHIP)) / 2 + 10} fill={C.text} fontSize={28} fontWeight={900}>25 dB ≈ 316배 약한 신호까지</text>
        </g>
        <g opacity={bars}>
          <rect x={1180} y={300} width={640} height={300} rx={22} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={1210} y={350} fill={C.text} fontSize={26} fontWeight={800}>같은 송신, 같은 집에서 닿는 거리</text>
          <rect x={1210} y={390} width={560 / k} height={52} rx={10} fill={C.warn} />
          <text x={1220 + 560 / k} y={426} fill={C.text} fontSize={24} fontWeight={800}>× 1 (감도 −70)</text>
          <rect x={1210} y={470} width={560 * bars} height={52} rx={10} fill={OK} />
          <text x={1760} y={506} textAnchor="end" fill={C.bg} fontSize={26} fontWeight={900}>× {k.toFixed(1)} (감도 −95)</text>
          <text x={1210} y={570} fill={C.faint} fontSize={20}>거리 배율 = 10^(25 / (10 × 2.7)), 집(경로 손실 지수 2.7)</text>
        </g>
        <g opacity={cls}>
          <Chip x={1500} y={720} col={C.dim} size={30}>“10 m” = 클래스 2 (최대 2.5 mW)</Chip>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 느리고 꼼꼼하게: LE Coded */
const Sym: React.FC<{ x: number; y: number; v: string; col: string; bad?: number }> = ({ x, y, v, col, bad = 0 }) => (
  <g>
    <rect x={x} y={y} width={64} height={64} rx={10} fill={col} opacity={0.25} stroke={col} strokeWidth={3} />
    <text x={x + 32} y={y + 44} textAnchor="middle" fill={C.text} fontFamily={FONT} fontSize={32} fontWeight={800}>{v}</text>
    <Cross x={x + 32} y={y + 32} a={bad} r={20} />
  </g>
);
// 비트 1 → 부호율 ½ 부호기(처음 상태 0) → 11 → 패턴 매퍼 S=8(1 → 1100) → 1100 1100. [Vol 6] Part B §3.3
const S8 = "11001100".split("");
const Coded: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), show = at(f, cues[1]), bad = at(f, cues[2]), cmp = at(f, cues[3]), far = at(f, cues[4]), batt = at(f, cues[5]);
  const ROWS: [string, number, number][] = [["트인 곳", 2, rangeFactor(SENS_SPEC - SENS_S8, 2)], ["집", N_HOME, rangeFactor(SENS_SPEC - SENS_S8, N_HOME)], ["사무실", 3.3, rangeFactor(SENS_SPEC - SENS_S8, 3.3)]];
  return (
    <>
      <Title kicker="예산 늘리기">느리고 꼼꼼하게: LE Coded</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={show * (1 - cmp)}>
          <text x={150} y={330} fill={C.dim} fontSize={26} fontWeight={700}>LE 1M</text>
          <Sym x={330} y={280} v="1" col={LE} />
          <text x={430} y={324} fill={C.faint} fontSize={24}>비트 1개 = 신호 1개 (1 µs)</text>
          <text x={150} y={480} fill={C.dim} fontSize={26} fontWeight={700}>Coded S=8</text>
          <Sym x={330} y={430} v="1" col={CL} />
          <path d="M410 462 H470 M455 448 L472 462 L455 476" stroke={C.faint} strokeWidth={4} fill="none" />
          {S8.map((v, i) => <Sym key={i} x={490 + i * 76 + (i >= 4 ? 20 : 0)} y={430} v={v} col={CL} bad={(i === 2 || i === 5) ? bad : 0} />)}
          <text x={490} y={540} fill={C.faint} fontSize={22}>부호율 ½ 부호(비트 → 2개) × 패턴 매퍼(1 → 1100) = 신호 8개 (8 µs)</text>
          <g opacity={bad}>
            <path d="M1140 462 H1200 M1185 448 L1202 462 L1185 476" stroke={C.faint} strokeWidth={4} fill="none" />
            <Sym x={1220} y={430} v="1" col={OK} />
            <text x={1300} y={474} fill={OK} fontSize={30} fontWeight={900}>✓ 되살림</text>
            <text x={490} y={600} fill={C.dim} fontSize={24}>신호 몇 개가 깨져도 부호의 규칙으로 원래 비트를 찾는다</text>
          </g>
        </g>
        <g opacity={cmp}>
          <text x={150} y={320} fill={C.text} fontSize={28} fontWeight={800}>같은 데이터를 보내는 시간</text>
          <rect x={150} y={345} width={80} height={44} rx={8} fill={LE} />
          <text x={242} y={378} fill={C.dim} fontSize={24}>LE 1M · 1 Mb/s</text>
          <rect x={150} y={405} width={640} height={44} rx={8} fill={CL} />
          <text x={802} y={438} fill={C.dim} fontSize={24}>S=8 · 125 kb/s (8배)</text>
          <text x={1180} y={320} fill={C.text} fontSize={28} fontWeight={800}>사양이 요구하는 수신 감도</text>
          <text x={1180} y={378} fill={LE} fontSize={26} fontWeight={800}>LE 1M: −70 dBm 이하</text>
          <text x={1180} y={436} fill={CL} fontSize={26} fontWeight={800}>S=8: −82 dBm 이하 (12 dB ≈ 16배 약한 신호)</text>
        </g>
        <g opacity={far}>
          <text x={150} y={540} fill={C.text} fontSize={28} fontWeight={800}>감도가 12 dB 좋아지면 닿는 거리</text>
          {ROWS.map(([name, n, k], i) => (
            <g key={name} transform={`translate(0,${575 + i * 76})`}>
              <text x={150} y={38} fill={C.dim} fontSize={26} fontWeight={700}>{name} (n = {n})</text>
              <rect x={420} y={6} width={200} height={44} rx={8} fill={LE} opacity={0.6} />
              <rect x={420} y={6} width={200 * (1 + (k - 1) * far)} height={44} rx={8} fill={CL} opacity={0.85} />
              <text x={430 + 200 * k} y={40} fill={C.text} fontSize={28} fontWeight={900}>× {k.toFixed(1)}</text>
            </g>
          ))}
        </g>
        <g opacity={batt} transform="translate(1560,640)">
          <rect x={0} y={0} width={180} height={90} rx={14} fill="none" stroke={C.text} strokeWidth={5} />
          <rect x={180} y={28} width={14} height={34} rx={4} fill={C.text} />
          <rect x={10} y={10} width={160 * (1 - 0.6 * batt)} height={70} rx={8} fill={C.warn} />
          <text x={90} y={140} textAnchor="middle" fill={C.dim} fontSize={24} fontWeight={700}>오래 말할수록 더 씀</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), eq = at(f, cues[1]), ex = at(f, cues[2]);
  const TERMS: [string, string][] = [["보낸 세기", LE], ["거리", C.warn], ["벽", C.warn], ["몸", C.warn]];
  const CASES: [string, number, string][] = [["기준 (집 안)", 1, LE], ["몸이 가리면 (−12 dB)", rangeFactor(-BODY, N_HOME), BAD], ["Coded S=8 (+12 dB)", rangeFactor(SENS_SPEC - SENS_S8, N_HOME), CL]];
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={960} y={190} textAnchor="middle" fill={C.text} fontSize={58} fontWeight={900} opacity={at(f, 10)}>몇 미터인지는 <tspan fill={OK}>세기의 예산</tspan>이 정한다</text>
        <g opacity={eq}>
          {TERMS.map(([t, col], i) => (
            <g key={t} transform={`translate(${250 + i * 300},300)`}>
              <rect x={0} y={0} width={220} height={100} rx={20} fill={col} opacity={0.2} stroke={col} strokeWidth={3} />
              <text x={110} y={62} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={800}>{t}</text>
              <text x={260} y={66} textAnchor="middle" fill={C.dim} fontSize={44} fontWeight={900}>{i < 3 ? "−" : "≥"}</text>
            </g>
          ))}
          <g transform="translate(1450,300)">
            <rect x={0} y={0} width={240} height={100} rx={20} fill={OK} opacity={0.2} stroke={OK} strokeWidth={3} />
            <text x={120} y={62} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={800}>수신 감도</text>
          </g>
        </g>
        <g opacity={ex}>
          {CASES.map(([name, k, col], i) => (
            <g key={name} transform={`translate(0,${490 + i * 100})`}>
              <text x={250} y={44} fill={C.dim} fontSize={30} fontWeight={700}>{name}</text>
              <rect x={640} y={8} width={300 * k * ex} height={56} rx={10} fill={col} opacity={0.85} />
              <text x={655 + 300 * k * ex} y={48} fill={C.text} fontSize={30} fontWeight={900}>닿는 거리 × {k.toFixed(2).replace(/\.?0+$/, "")}</text>
            </g>
          ))}
          <text x={250} y={820} fill={C.faint} fontSize={22}>같은 기기·같은 집(경로 손실 지수 2.7)에서의 거리 배율. 책 2장 링크 버짓 모델로 계산.</text>
        </g>
      </svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} />;
    case "budget": return <Budget cues={s.cues} />;
    case "distance": return <Distance cues={s.cues} len={s.frames} />;
    case "body": return <Body cues={s.cues} len={s.frames} />;
    case "sens": return <Sens cues={s.cues} />;
    case "coded": return <Coded cues={s.cues} />;
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
          <Audio src={staticFile(`audio/range/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const Range: React.FC<{ voice: boolean }> = ({ voice }) => {
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
