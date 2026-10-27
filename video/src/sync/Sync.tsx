import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { cisLatency } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { Packet3D } from "../common/deep3d";
import { EX } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 왼쪽 = 분홍, 오른쪽 = 주황, 묶음 시각 = 인디고, 함께 = 초록 */
const PH = C.accent, LC = "#f472b6", RC = C.warn, SYNC = DEEP, OK = C.ok, BAD = C.bad;
const PP: Vec = [-16, 7, 2], LP: Vec = [6, 5, 1], RP: Vec = [17, 5, 1];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const Buds: React.FC<{ glowL?: number; glowR?: number }> = ({ glowL = 0, glowR = 0 }) => (
  <>
    <Earbud3D p={[LP[0], 3.2, LP[2]]} ry={-1.2} s={1.4} />
    <Earbud3D p={[RP[0], 3.2, RP[2]]} ry={1.9} s={1.4} />
    {glowL > 0 && <mesh position={[LP[0], 5, LP[2]]}><sphereGeometry args={[0.7, 16, 12]} /><meshStandardMaterial color={LC} emissive={LC} emissiveIntensity={1.4} transparent opacity={glowL} /></mesh>}
    {glowR > 0 && <mesh position={[RP[0], 5, RP[2]]}><sphereGeometry args={[0.7, 16, 12]} /><meshStandardMaterial color={RC} emissive={RC} emissiveIntensity={1.4} transparent opacity={glowR} /></mesh>}
  </>
);
/** 소리를 내는 순간: 이어폰에서 퍼지는 고리 */
const Sound: React.FC<{ p: Vec; k: number; col: string }> = ({ p, k, col }) => k <= 0 || k >= 1 ? null : <mesh position={[p[0], 4.6, p[2]]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[1 + k * 4, 0.16, 8, 40]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.4} transparent opacity={1 - k} /></mesh>;
const CAM: Cam = { pos: [-6, 18, 40], look: [0, 4, 1], fov: 40 };
const lab = (cam: Cam, p: Vec, t: string, col: string, a: number, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [4, 20, 38], look: [0, 4, 1], fov: 40 }, f / len), q = at(f, cues[2]);
  const t0 = cues[1];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        <Packet3D f={f} t0={t0} t1={t0 + 30} a={PP} b={LP} col={LC} />
        <Packet3D f={f} t0={t0 + 18} t1={t0 + 48} a={PP} b={RP} col={RC} />
        <Sound p={LP} k={(f - t0 - 30) / 20} col={LC} />
        <Sound p={RP} k={(f - t0 - 48) / 20} col={RC} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [LP[0], 0, LP[2]], "왼쪽", LC, 1, 50)}
        {lab(cam, [RP[0], 0, RP[2]], "오른쪽", RC, 1, 60)}
        {lab(cam, [PP[0], 0, PP[2]], "휴대폰", PH, 1, 60)}
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 받는 시각이 다르다 */
const Apart: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-2, 22, 36], look: [0, 4, 1], fov: 40 }, f / len);
  const t0 = cues[1], tL = t0 + 30, tR = t0 + 70, diff = at(f, cues[2]);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds glowL={f > tL ? 1 : 0} glowR={f > tR ? 1 : 0} />
        <Packet3D f={f} t0={t0} t1={tL} a={PP} b={LP} col={LC} />
        <Packet3D f={f} t0={tL + 10} t1={tR} a={PP} b={RP} col={RC} />
      </Scene3D>
      <Title kicker="무선은 하나">같은 조각도, 받는 시각은 다르다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [LP[0], 7.5, LP[2]], "① 먼저 받음", LC, f > tL ? 1 : 0)}
        {lab(cam, [RP[0], 7.5, RP[2]], "② 나중에 받음", RC, f > tR ? 1 : 0)}
        <g opacity={diff} transform="translate(460,820)">
          <rect x={0} y={0} width={1000} height={70} rx={14} fill={C.panel} stroke={C.faint} strokeWidth={2} />
          <rect x={60} y={22} width={200} height={26} rx={6} fill={LC} />
          <rect x={300} y={22} width={200} height={26} rx={6} fill={RC} />
          <text x={540} y={44} fill={C.text} fontSize={24} fontWeight={800}>← 같은 간격 안에서, 차례로</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 묶음의 같은 시각까지 기다린다 (3D 장면 + 시간 띠) */
const SyncScene: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [-4, 20, 40], look: [0, 4, 1], fov: 40 }, { pos: [2, 22, 38], look: [0, 4, 1], fov: 40 }, f / len);
  const t0 = cues[1] - 30, tL = t0 + 30, tR = t0 + 60, tS = cues[2] + 30, group = at(f, cues[1]);
  const X0 = 360, W = 1200, T = (k: number) => X0 + k * W;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds glowL={f > tL && f < tS ? 1 : 0} glowR={f > tR && f < tS ? 1 : 0} />
        {group > 0 && <mesh position={[11.5, 8.6, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 13, 10]} /><meshStandardMaterial color={SYNC} emissive={SYNC} emissiveIntensity={1} transparent opacity={group} /></mesh>}
        <Packet3D f={f} t0={t0} t1={tL} a={PP} b={LP} col={LC} />
        <Packet3D f={f} t0={tL + 5} t1={tR} a={PP} b={RP} col={RC} />
        <Sound p={LP} k={(f - tS) / 22} col={OK} />
        <Sound p={RP} k={(f - tS) / 22} col={OK} />
      </Scene3D>
      <Title kicker="CIG: 한 묶음, 하나의 시각">받는 시각은 달라도, 소리 내는 시각은 같다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [11.5, 8.6, 1], "한 묶음 (CIG)", SYNC, group, -20)}
        <g opacity={at(f, cues[1])}>
          <rect x={X0 - 40} y={730} width={W + 80} height={190} rx={18} fill={C.panel} opacity={0.92} />
          <line x1={X0} x2={X0 + W} y1={860} y2={860} stroke={C.faint} strokeWidth={3} />
          <rect x={T(0.02)} y={800} width={W * 0.28} height={40} rx={8} fill={LC} />
          <text x={T(0.16)} y={828} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>왼쪽 전송</text>
          <rect x={T(0.33)} y={800} width={W * 0.28} height={40} rx={8} fill={RC} />
          <text x={T(0.47)} y={828} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>오른쪽 전송</text>
          <line x1={T(0)} x2={T(0)} y1={780} y2={880} stroke={C.text} strokeWidth={3} />
          <text x={T(0)} y={905} textAnchor="middle" fill={C.dim} fontSize={20}>묶음 기준점</text>
          <line x1={T(0.66)} x2={T(0.66)} y1={770} y2={880} stroke={SYNC} strokeWidth={5} />
          <text x={T(0.66)} y={760} textAnchor="middle" fill={SYNC} fontSize={24} fontWeight={900}>묶음 시각 (기준점 + CIG_Sync_Delay)</text>
          <text x={T(0.84)} y={828} textAnchor="middle" fill={OK} fontSize={24} fontWeight={900} opacity={f > tS ? 1 : 0}>두 귀가 함께</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 지연은 미리 정해져 있다 (3D 시간 블록) */
const U = 1.2; // 1 ms = 1.2 단위
const Delay: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [4, 14, 30], look: [10, 1, 0], fov: 42 }, { pos: [8, 16, 28], look: [11, 1, 0], fov: 42 }, f / len);
  const show = at(f, cues[1]), sum = at(f, cues[2]);
  const total = cisLatency("unframed", EX.sync, EX.ft, EX.iso, EX.sdu);
  // 시각 0 = 소리 조각이 무선으로 넘어간 때(= SDU 간격 시작). 다시 보낼 기회 FT개 간격, 그다음 묶음 시각
  const blocks: [number, number, string, string][] = [[0, EX.sdu, "#334155", "조각이 만들어짐"], [EX.sdu, EX.iso, "#475569", "첫 기회"], [EX.sdu + EX.iso, EX.sync, SYNC, "묶음 시각"]];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 18, 12]} />
        {blocks.map(([t, d, col], i) => show > 0 && <mesh key={i} position={[(t + d / 2) * U, 0.8, 0]} scale={[1, Math.min(1, show * 1.5 - i * 0.3) > 0 ? 1 : 0.01, 1]}><boxGeometry args={[d * U - 0.15, 1.6, 4]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.3} /></mesh>)}
        {sum > 0 && <mesh position={[(EX.sdu + total / 2) * U, 3, 0]}><boxGeometry args={[total * U, 0.18, 0.18]} /><meshStandardMaterial color={OK} emissive={OK} emissiveIntensity={1.2} /></mesh>}
        {sum > 0 && [EX.sdu, EX.sdu + total].map((t, i) => <mesh key={i} position={[t * U, 2.2, 0]}><boxGeometry args={[0.15, 1.8, 0.15]} /><meshStandardMaterial color={OK} emissive={OK} emissiveIntensity={1.2} /></mesh>)}
      </Scene3D>
      <Title kicker="전송 지연">기다리는 시간은 미리 정해져 있다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {blocks.map(([t, d, , name], i) => <g key={i}>{lab(cam, [(t + d / 2) * U, 1.6, 2], name, C.text, show, -30, 22)}{lab(cam, [(t + d / 2) * U, 0, 2], `${d} ms`, C.dim, show, 40, 22)}</g>)}
        {lab(cam, [EX.sdu * U, 0, 2], "↑ 무선으로 넘어감", PH, show, 80, 22)}
        {lab(cam, [(EX.sdu + total / 2) * U, 3.2, 0], `${total} ms`, OK, sum, -24, 40)}
        <Note x={260} y={820} w={1400} a={sum} col={SYNC} lines={[["지연", `= CIG_Sync_Delay + FT × ISO 간격 − SDU 간격 = ${EX.sync} + ${EX.ft} × ${EX.iso} − ${EX.sdu} = ${total} ms (프레임 없는 PDU)`]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 한 세트로 함께 (CAP) */
const SetScene: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [2, 20, 38], look: [0, 4, 1], fov: 40 }, f / len);
  const bad = f < cues[1] + 20, linked = at(f, cues[1]), start = cues[1] + 50;
  const playL = bad ? (f % 60) / 25 : (f - start) % 50 / 22, playR = bad ? -1 : playL;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        {linked > 0 && <mesh position={[11.5, 8.6, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.18, 0.18, 13, 10]} /><meshStandardMaterial color={SYNC} emissive={SYNC} emissiveIntensity={1} transparent opacity={linked} /></mesh>}
        {(bad || f > start) && <><Sound p={LP} k={playL} col={bad ? BAD : OK} /><Sound p={RP} k={playR} col={OK} /></>}
      </Scene3D>
      <Title kicker="CAP: 두 이어폰을 한 세트로">함께 시작하고, 함께 멈춘다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [11.5, 10.5, 1], bad ? "따로 설정하면: 왼쪽만 먼저" : "한 세트 → 같은 묶음, 함께 시작", bad ? BAD : SYNC, 1, -20, 28)}
        {lab(cam, [LP[0], 0, LP[2]], "왼쪽", LC, 1, 50)}
        {lab(cam, [RP[0], 0, RP[2]], "오른쪽", RC, 1, 60)}
        <Note x={360} y={820} w={1200} a={linked} col={SYNC} lines={[["CAP", "= 좌우 이어폰을 한 조정 세트(CSIP)로 알아보고, 두 연결(CIS)을 같은 묶음(CIG)에 넣어 함께 시작·멈춤"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [8, 20, 38], look: [2, 4, 1], fov: 40 }, f / len);
  const L: [string, string][] = [["받는 순간은 서로 다르다", "무선은 하나, 한쪽씩 차례로"], ["묶음 전체에 하나의 시각", "CIG_Sync_Delay까지 기다린다"], ["그 시각에 함께 소리를 낸다", "두 귀의 소리가 어긋나지 않는다"]];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        <Sound p={LP} k={(f % 50) / 22} col={OK} /><Sound p={RP} k={(f % 50) / 22} col={OK} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${240 + i * 160})`}>
            <rect x={0} y={0} width={960} height={124} rx={22} fill={C.panel} stroke={i === 2 ? OK : SYNC} strokeWidth={3} opacity={0.95} />
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
    case "apart": return <Apart cues={s.cues} len={s.frames} />;
    case "sync": return <SyncScene cues={s.cues} len={s.frames} />;
    case "delay": return <Delay cues={s.cues} len={s.frames} />;
    case "set": return <SetScene cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Sync = makeVideo("sync", scenesFor, LEAD, body);
