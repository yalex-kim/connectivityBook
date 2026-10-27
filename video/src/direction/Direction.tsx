import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { aoaAngle, triangulate } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { DEEP, Ground, Note, makeVideo } from "../common/kit";
import { TRI } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 수신기(로케이터) = 청록, 태그 = 분홍, 한 음(CTE) = 노랑, 방향선 = 인디고, 위치 = 초록, 오차 = 주황 */
const LOC = C.accent2, TAG = "#f472b6", TONE = "#facc15", DIR = DEEP, OK = C.ok, ERR = C.warn;
const M = 1.6; // 1 m = 1.6 단위
const deg = (r: number) => (r * 180) / Math.PI, rad = (d: number) => (d * Math.PI) / 180;
const lab = (cam: Cam, p: Vec, t: string, col: string, a = 1, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
const mat = (col: string, glow = 0, op = 1) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} transparent={op < 1} opacity={op} />;

/** 로케이터: 받침대 위 안테나 판(일렬 4개). lit = 지금 받는 안테나 번호(−1이면 없음) */
const Locator: React.FC<{ p: Vec; ry?: number; lit?: number; s?: number }> = ({ p, ry = 0, lit = -1, s = 1 }) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.18, 0.25, 3.6, 10]} />{mat("#5b6b88")}</mesh>
    <mesh position={[0, 3.9, 0]}><boxGeometry args={[4.4, 0.7, 1.2]} />{mat("#1e293b")}</mesh>
    {[0, 1, 2, 3].map((i) => <mesh key={i} position={[-1.65 + i * 1.1, 4.5, 0]}><cylinderGeometry args={[0.16, 0.16, 0.9, 8]} />{mat(i === lit ? TONE : LOC, i === lit ? 1.5 : 0.4)}</mesh>)}
  </group>
);
/** 태그(동전형 비콘) */
const Tag: React.FC<{ p: Vec; glow?: number }> = ({ p, glow = 0.3 }) => <mesh position={p}><cylinderGeometry args={[0.9, 0.9, 0.5, 24]} />{mat(TAG, glow)}</mesh>;
/** a → b 방향선(바닥 위 얇은 막대) */
const Ray: React.FC<{ a: Vec; b: Vec; col: string; op?: number; w?: number }> = ({ a, b, col, op = 1, w = 0.12 }) => {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz);
  return <mesh position={[(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}><boxGeometry args={[L, w, w]} />{mat(col, 1.1, op)}</mesh>;
};

/* ---------------------------------------------------------------- 1. 훅 (3D 방) */
const HOOK_CAM: [Cam, Cam] = [{ pos: [-14, 18, 30], look: [2, 3, -2], fov: 40 }, { pos: [-6, 20, 28], look: [2, 3, -2], fov: 40 }];
const L0: Vec = [-8, 0, -8], T0: Vec = [8, 0.3, 4];
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(HOOK_CAM[0], HOOK_CAM[1], f / len), arrow = at(f, 20), one = at(f, cues[1]), q = at(f, cues[2]);
  const far: Vec = [L0[0] + (T0[0] - L0[0]) * 1.35, 0.35, L0[2] + (T0[2] - L0[2]) * 1.35];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <Locator p={L0} ry={-0.6} />
        <Tag p={T0} glow={0.5} />
        {arrow > 0 && <Ray a={[L0[0], 0.35, L0[2]]} b={far} col={DIR} op={arrow} w={0.22} />}
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [L0[0], 0, L0[2]], "수신기", LOC, 1, 50)}
        {lab(cam, T0, "태그", TAG, 1, 50)}
        {lab(cam, [(L0[0] + T0[0]) / 2, 0.35, (L0[2] + T0[2]) / 2], "방향 = 선 하나", DIR, one, -20)}
        {lab(cam, T0, "여기가 어디?", OK, q, -60, 30)}
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 패킷 끝의 한 음, 안테나를 바꿔 가며 */
const Tone: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 12, 30], look: [0, 4, 0], fov: 40 }, { pos: [3, 13, 28], look: [0, 4, 0], fov: 40 }, f / len);
  const k = interpolate(f, [15, cues[1] + 10], [0, 1], clamp), x = -18 + k * 30, sw = f > cues[1] ? Math.floor((f - cues[1]) / 8) % 4 : -1;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 12]} />
        <Tag p={[-18, 0.3, 0]} glow={0.6} />
        <Locator p={[14, 0, 0]} ry={Math.PI / 2} lit={sw} s={1.3} />
        {k < 1 && <group position={[x, 4.5, 0]}>
          <mesh><boxGeometry args={[3, 1.2, 1.2]} />{mat(C.accent, 0.5)}</mesh>
          <mesh position={[-4.2, 0, 0]}><boxGeometry args={[5.4, 0.6, 0.6]} />{mat(TONE, 1.3)}</mesh>
        </group>}
        {k >= 1 && f < cues[1] + 140 && <mesh position={[11.5, 4.5, 0]}><sphereGeometry args={[0.9 + 0.2 * Math.sin(f * 0.5), 16, 12]} />{mat(TONE, 1.2, 0.7)}</mesh>}
      </Scene3D>
      <Title kicker="CTE: 상수 톤 확장">패킷 끝에, 아무 정보도 없는 한 음</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {k < 1 && lab(cam, [x, 6, 0], "패킷", C.accent, 1, -20, 24)}
        {k < 1 && lab(cam, [x - 4.2, 5, 0], "한 음 (CTE)", TONE, 1, -40, 24)}
        {lab(cam, [14, 7.5, 0], sw >= 0 ? `안테나 ${sw + 1}로 받는 중` : "수신기 (안테나 4개)", sw >= 0 ? TONE : LOC, 1, -10, 26)}
        <Note x={360} y={830} w={1200} a={at(f, 20)} col={DIR} lines={[["CTE", "= CRC 뒤에 붙는 1의 연속(16~160 µs). 처음 4 µs 보호, 다음 8 µs 기준, 그 뒤 안테나 전환과 표본"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 도는 위상을 재서 뺀다 (IQ 도식) */
const Spin: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), rot = at(f, 10), ref = at(f, cues[1]), sub = at(f, cues[2]);
  const CX = 640, CY = 560, R = 220, dpsi = 90; // 이웃 안테나 위상차(°), 회전 90°/µs(250 kHz)
  const P = (a: number, r = R): [number, number] => [CX + r * Math.cos(rad(a)), CY - r * Math.sin(rad(a))];
  const spinA = (f * 9) % 360;
  const refDots = Array.from({ length: 8 }, (_, i) => i * 90);
  const ant = [0, 1, 2, 3].map((i) => -i * dpsi); // 안테나 위치 때문에 남는 위상: 30°·반 파장이면 이웃마다 90°
  return (
    <>
      <Title kicker="회전 지우기">도는 만큼 재서, 빼고 나면</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.faint} strokeWidth={3} />
        <line x1={CX - R - 30} x2={CX + R + 30} y1={CY} y2={CY} stroke={C.faint} strokeWidth={2} />
        <line x1={CX} x2={CX} y1={CY - R - 30} y2={CY + R + 30} stroke={C.faint} strokeWidth={2} />
        <text x={CX + R + 40} y={CY + 8} fill={C.dim} fontSize={22}>I</text>
        <text x={CX - 8} y={CY - R - 40} fill={C.dim} fontSize={22}>Q</text>
        <g opacity={rot * (1 - sub)}>
          {(() => { const [x, y] = P(spinA); return <><line x1={CX} y1={CY} x2={x} y2={y} stroke={TONE} strokeWidth={6} /><circle cx={x} cy={y} r={12} fill={TONE} /></>; })()}
          <text x={CX} y={CY + R + 70} textAnchor="middle" fill={TONE} fontSize={26} fontWeight={800}>같은 안테나인데도 계속 돈다</text>
        </g>
        <g opacity={ref * (1 - sub)}>
          {refDots.map((a, i) => { const [x, y] = P(a, R - 30 + i * 4); return <circle key={i} cx={x} cy={y} r={10} fill="none" stroke={C.text} strokeWidth={3} />; })}
        </g>
        <g opacity={sub}>
          {ant.map((a, i) => { const [x, y] = P(a); return <g key={i}><line x1={CX} y1={CY} x2={x} y2={y} stroke={[LOC, "#60a5fa", "#a78bfa", TAG][i]} strokeWidth={5} /><circle cx={x} cy={y} r={14} fill={[LOC, "#60a5fa", "#a78bfa", TAG][i]} /><text x={x + (x > CX ? 24 : -24)} y={y + 8} textAnchor={x > CX ? "start" : "end"} fill={C.text} fontSize={22} fontWeight={800}>안테나 {i + 1}</text></g>; })}
          <text x={CX} y={CY + R + 70} textAnchor="middle" fill={OK} fontSize={26} fontWeight={800}>안테나 위치 때문에 생긴 차이만 남는다</text>
        </g>
        <g transform="translate(1100,380)">
          <rect x={0} y={0} width={640} height={330} rx={20} fill={C.panel} stroke={C.faint} strokeWidth={2} />
          <rect x={30} y={40} width={60} height={46} rx={6} fill="#475569" /><text x={60} y={110} textAnchor="middle" fill={C.dim} fontSize={18}>보호 4 µs</text>
          <rect x={100} y={40} width={150} height={46} rx={6} fill={C.text} opacity={0.3 + 0.7 * ref} /><text x={175} y={110} textAnchor="middle" fill={C.text} fontSize={18}>기준 8 µs (안테나 1)</text>
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={260 + i * 44} y={40} width={36} height={46} rx={6} fill={[LOC, "#60a5fa", "#a78bfa", TAG][i % 4]} opacity={0.4 + 0.6 * sub} />)}
          <text x={430} y={110} textAnchor="middle" fill={C.dim} fontSize={18}>안테나 1→2→3→4 반복</text>
          <text x={30} y={180} fill={C.text} fontSize={24} fontWeight={800} opacity={ref}>① 기준 구간: 같은 안테나 → 회전만 보인다</text>
          <text x={30} y={226} fill={C.text} fontSize={24} fontWeight={800} opacity={ref}>   1 µs마다 도는 각도를 잰다</text>
          <text x={30} y={286} fill={OK} fontSize={24} fontWeight={800} opacity={sub}>② 표본마다 잰 회전을 빼면 → 위치 차이만</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 각도 (3D: 비스듬히 오는 물결과 안테나 줄) */
const AngleScene: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 26, 16], look: [-2, 0, -4], fov: 42 }, { pos: [2, 27, 15], look: [-2, 0, -4], fov: 42 }, f / len);
  const th = aoaAngle(Math.PI / 2, 0.5, 1), show = at(f, cues[1]);
  const dirx = Math.sin(th), dirz = Math.cos(th), S = 2.4; // 전파가 오는 쪽: (−sinθ, −cosθ) 방향의 먼 곳 // 안테나 간격(반 파장)을 2.4 단위로
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 12]} />
        {[0, 1, 2, 3].map((i) => <mesh key={i} position={[(i - 1.5) * S, 1, 0]}><cylinderGeometry args={[0.18, 0.18, 2, 10]} />{mat(LOC, 0.6)}</mesh>)}
        {Array.from({ length: 6 }, (_, k) => { const d = ((f * 0.12 + k * 2.4) % 12) + 2; return <mesh key={k} position={[-dirx * d, 1.2, -dirz * d]} rotation={[0, th, 0]}><boxGeometry args={[7, 0.08, 0.08]} />{mat(TONE, 1, 0.75)}</mesh>; })}
        <Ray a={[0, 0.3, 0]} b={[-dirx * 12, 0.3, -dirz * 12]} col={DIR} op={show} w={0.14} />
        <Ray a={[0, 0.3, 0]} b={[0, 0.3, -12]} col={C.faint} op={show} w={0.08} />
      </Scene3D>
      <Title kicker="AoA: 도착 각도">위상 차이 → 각도</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-1.5 * S, 0, 1.2], "안테나 1", LOC, 1, 40, 22)}
                {lab(cam, [0, 0, 1.2], "간격 = 반 파장 (약 6 cm)", C.dim, 1, 80, 22)}
        {lab(cam, [-dirx * 6, 0.3, -dirz * 6], `θ = ${deg(th).toFixed(0)}°`, DIR, show, -20, 34)}
        <Note x={360} y={800} w={1200} a={show} col={DIR} lines={[["계산", `이웃 위상차 90° → θ = asin(90° ÷ 180°) = ${deg(th).toFixed(0)}° (간격 반 파장, 입문 10편과 같은 식)`]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5·6. 두 방향선이 만나는 곳, 그리고 오차 (3D 방, 위에서) */
const A: Vec = [0, 0, 0], B: Vec = [TRI.D * M, 0, 0];
const POS = triangulate(TRI.D, rad(TRI.a1), rad(180 - TRI.a2));
const TP: Vec = [POS.x * M, 0.3, -POS.y * M];
const ROOM_CAM: [Cam, Cam] = [{ pos: [8, 30, 16], look: [8, 0, -8], fov: 46 }, { pos: [8, 38, 6], look: [8, 0, -9], fov: 46 }];
const ray = (from: Vec, aDeg: number, len: number): Vec => [from[0] + Math.cos(rad(aDeg)) * len, 0.35, from[2] - Math.sin(rad(aDeg)) * len];
const Where: React.FC<{ cues: number[]; len: number; err?: boolean }> = ({ cues, len, err = false }) => {
  const f = useCurrentFrame(), cam = camLerp(ROOM_CAM[0], ROOM_CAM[1], err ? 1 : interpolate(f, [cues[1], len], [0, 1], clamp));
  const one = err ? 1 : at(f, 10), two = err ? 1 : at(f, cues[1]), hit = err ? 1 : at(f, cues[2]), wedge = err ? at(f, 10) : 0, many = err ? at(f, cues[1]) : 0;
  const L = 22;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[8, 22, 0]} />
        <Locator p={A} ry={0} />
        {two > 0 && <Locator p={B} ry={0} />}
        <Tag p={TP} glow={0.4 + hit} />
        {one > 0 && <Ray a={[A[0], 0.35, A[2]]} b={ray(A, TRI.a1, L)} col={DIR} op={one} />}
        {two > 0 && <Ray a={[B[0], 0.35, B[2]]} b={ray(B, TRI.a2, L)} col={DIR} op={two} />}
        {hit > 0 && <mesh position={[TP[0], 0.6, TP[2]]}><sphereGeometry args={[0.7, 16, 12]} />{mat(OK, 1.4, hit)}</mesh>}
        {wedge > 0 && [-2, 2].map((d) => <Ray key={d} a={[A[0], 0.35, A[2]]} b={ray(A, TRI.a1 + d, L)} col={ERR} op={wedge * 0.9} w={0.08} />)}
        {many > 0 && [[-6, 0, -12], [22, 0, -14], [8, 0, -26]].map((p, i) => <Locator key={i} p={p as Vec} s={0.9} />)}
      </Scene3D>
      <Title kicker={err ? "오차" : "삼각측량"}>{err ? "각도가 조금 틀리면, 멀수록 크게 어긋난다" : "두 방향이 만나는 곳 = 위치"}</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, A, "수신기 1", LOC, 1, 50)}
        {lab(cam, B, "수신기 2", LOC, two, 50)}
        {lab(cam, [B[0] / 2, 0, 1.5], `${TRI.D} m`, C.dim, two, 50)}
        {lab(cam, [A[0] + 2.4, 0, -1.2], `${TRI.a1}°`, DIR, one, 0, 28)}
        {lab(cam, [B[0] - 2.6, 0, -1.2], `${TRI.a2}°`, DIR, two, 0, 28)}
        {lab(cam, [TP[0] + 4.5, 0.35, TP[2]], `태그 (${POS.x.toFixed(0)} m, ${POS.y.toFixed(2)} m)`, OK, hit * (1 - wedge), 10, 30)}
        {lab(cam, [TP[0] + 4, 0.35, TP[2]], "±2° → 약 ±35 cm", ERR, wedge, 10, 30)}
        {lab(cam, [22, 0, -14], "수신기를 여러 대, 가까운 것끼리", LOC, many, 70, 26)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(ROOM_CAM[1], { pos: [12, 30, 12], look: [8, 0, -6], fov: 44 }, f / len);
  const L: [string, string][] = [["패킷 끝의 한 음을 여러 안테나로", "도는 만큼 빼고, 위상 차이 → 방향"], ["수신기 두 대의 방향이 만나는 곳", "그곳이 실내에서의 위치"]];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[8, 22, 0]} />
        <Locator p={A} /><Locator p={B} />
        <Tag p={TP} glow={1} />
        <Ray a={[A[0], 0.35, A[2]]} b={ray(A, TRI.a1, 22)} col={DIR} /><Ray a={[B[0], 0.35, B[2]]} b={ray(B, TRI.a2, 22)} col={DIR} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${300 + i * 170})`}>
            <rect x={0} y={0} width={980} height={124} rx={22} fill={C.panel} stroke={i === 1 ? OK : DIR} strokeWidth={3} opacity={0.95} />
            <text x={36} y={58} fill={C.text} fontSize={34} fontWeight={900}>{k}</text>
            <text x={36} y={100} fill={C.dim} fontSize={26} fontWeight={700}>{v}</text>
          </g>
        ))}
      </svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "tone": return <Tone cues={s.cues} len={s.frames} />;
    case "spin": return <Spin cues={s.cues} />;
    case "angle": return <AngleScene cues={s.cues} len={s.frames} />;
    case "where": return <Where cues={s.cues} len={s.frames} />;
    case "error": return <Where cues={s.cues} len={s.frames} err />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Direction = makeVideo("direction", scenesFor, LEAD, body);
export { Locator, Tag };
