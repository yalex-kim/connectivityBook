import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Ground, Note, makeVideo } from "../common/kit";
import { Key3D, Listener3D, Packet3D } from "../common/deep3d";
import { G_OUT, SIX } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 헤드셋 = 청록, PIN(공유 비밀) = 주황, 각자의 비밀 = 인디고, 공개 값 = 회색, 열쇠 = 초록, 끼어든 쪽 = 빨강 */
const PH = C.accent, HS = C.accent2, PIN = C.warn, OWN = DEEP, PUB = "#94a3b8", KEY = C.ok, BAD = C.bad;
const PP: Vec = [-14, 7, 2], HP: Vec = [14, 4, 0], LIS: Vec = [0, 0, -9];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const mat = (col: string, glow = 0, op = 1) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} transparent={op < 1} opacity={op} />;
/** 옛 헤드셋(귀걸이형 본체 + 마이크 막대) */
const Headset: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p} scale={1.5}>
    <mesh><capsuleGeometry args={[1.1, 2.4, 8, 16]} />{mat("#cbd5e1", 0.1)}</mesh>
    <mesh position={[0, -2.6, 0.6]} rotation={[0.5, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 2.4, 10]} />{mat("#94a3b8")}</mesh>
    <mesh position={[0, 1.6, 0.9]}><sphereGeometry args={[0.25, 10, 8]} />{mat(HS, 1.2)}</mesh>
  </group>
);
/** 기기 안의 비밀(작은 빛 상자) */
const Secret: React.FC<{ p: Vec; col: string; s?: number }> = ({ p, col, s = 1 }) => <mesh position={p} rotation={[0.4, 0.6, 0]} scale={s}><boxGeometry args={[1.2, 1.2, 1.2]} />{mat(col, 1)}</mesh>;
/** 끼어든 기기(가운데) */
const Mitm: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 2.5, 0]}><boxGeometry args={[3, 5, 0.6]} />{mat("#3f1d24", 0.2)}</mesh>
    <mesh position={[0, 2.5, 0.32]}><boxGeometry args={[2.6, 4.4, 0.02]} />{mat(BAD, 0.5)}</mesh>
  </group>
);
const CAM: Cam = { pos: [0, 15, 48], look: [0, 5, -2], fov: 40 };
const lab = (cam: Cam, p: Vec, t: string, col: string, a = 1, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
const Stage: React.FC<{ cam: Cam; children?: React.ReactNode; listener?: boolean }> = ({ cam, children, listener }) => (
  <Scene3D cam={cam}>
    <Ground />
    <PhoneAt x={PP[0] - 2} z={PP[2]} />
    <Headset p={HP} />
    {listener && <Listener3D p={LIS} />}
    {children}
  </Scene3D>
);

/* ---------------------------------------------------------------- 1. 훅: PIN 입력 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [4, 18, 40], look: [0, 5, -1], fov: 40 }, f / len), pin = at(f, cues[1]), q = at(f, cues[2]);
  const typed = Math.min(4, Math.max(0, Math.floor((f - cues[1]) / 12)));
  const [sx, sy] = project(cam, [PP[0] - 2, 7, PP[2] + 0.5]);
  return (
    <>
      <Stage cam={cam} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={1 - pin}>
          <rect x={sx - 110} y={sy - 50} width={220} height={100} rx={16} fill={C.panel} stroke={KEY} strokeWidth={3} />
          <text x={sx} y={sy + 14} textAnchor="middle" fill={C.text} fontSize={40} fontWeight={900} letterSpacing={4}>{SIX}</text>
        </g>
        <g opacity={pin}>
          <rect x={sx - 130} y={sy - 90} width={260} height={180} rx={16} fill={C.panel} stroke={PIN} strokeWidth={3} />
          <text x={sx} y={sy - 44} textAnchor="middle" fill={PIN} fontSize={26} fontWeight={900}>PIN 입력</text>
          <text x={sx} y={sy + 20} textAnchor="middle" fill={C.text} fontSize={48} fontWeight={900} letterSpacing={10}>{"●".repeat(typed) + "○".repeat(4 - typed)}</text>
        </g>
        {lab(cam, [HP[0], 0, HP[2]], "옛 헤드셋", HS, 1, 50)}
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 레거시: 비밀은 PIN 하나 */
const Legacy: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-3, 18, 40], look: [0, 5, -2], fov: 40 }, f / len), mix = cues[1], guess = at(f, cues[2]);
  return (
    <>
      <Stage cam={cam} listener>
        <Secret p={[-9, 7, 3]} col={PIN} /><Secret p={[19, 6, 0]} col={PIN} />
        <Packet3D f={f} t0={mix - 10} t1={mix + 30} a={PP} b={HP} col={PUB} />
        <Packet3D f={f} t0={mix + 5} t1={mix + 45} a={HP} b={PP} col={PUB} />
        <Packet3D f={f} t0={mix} t1={mix + 40} a={[0, 7, 1]} b={[LIS[0], 6.6, LIS[2]]} col={PUB} size={0.6} arc={0.5} />
        {f > mix + 50 && <><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 10, 0]} col={KEY} s={0.8} /></>}
        {guess > 0 && <Key3D p={[-2, 9.5, -9]} col={KEY} s={0.7} opacity={0.35 + 0.3 * Math.sin(f * 0.3) ** 2} />}
      </Stage>
      <Title kicker="레거시 페어링 (≤ 2.0)">두 기기가 나눈 비밀은 PIN 하나</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-9, 7, 3], "PIN", PIN, 1, -30)}
        {lab(cam, [19, 6, 0], "PIN", PIN, 1, -30)}
        {lab(cam, [0, 8, 1], "무작위 값 · 주소 (공중)", PUB, at(f, mix) * (1 - at(f, mix + 70)), -20)}
        {lab(cam, [-9, 11, 3], "열쇠 = PIN + 주소 + 무작위 값", KEY, at(f, mix + 50), -40, 22)}
        {lab(cam, [LIS[0], 6.6, LIS[2]], "엿들은 사람", BAD, 1, -40)}
        {lab(cam, [-2, 9.5, -9], "PIN이 짧으면 짐작해 볼 수 있다", BAD, guess, -40, 24)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. SSP: 각자의 비밀, 공개 값만 */
const Ssp: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [3, 18, 40], look: [0, 5, -2], fov: 40 }, f / len), ex = cues[1], no = at(f, cues[2]);
  return (
    <>
      <Stage cam={cam} listener>
        <Secret p={[-9, 7, 3]} col={OWN} /><Secret p={[19, 6, 0]} col={OWN} s={0.8} />
        <Packet3D f={f} t0={ex - 10} t1={ex + 30} a={PP} b={HP} col={PUB} />
        <Packet3D f={f} t0={ex + 5} t1={ex + 45} a={HP} b={PP} col={PUB} />
        <Packet3D f={f} t0={ex} t1={ex + 40} a={[0, 7, 1]} b={[LIS[0], 6.6, LIS[2]]} col={PUB} size={0.6} arc={0.5} />
        {f > ex + 50 && <><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 10, 0]} col={KEY} s={0.8} /></>}
      </Stage>
      <Title kicker="Secure Simple Pairing (2.1)">각자의 비밀 값, 공개 값만 주고받는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-9, 7, 3], "휴대폰만 아는 비밀", OWN, 1, -30, 24)}
        {lab(cam, [19, 6, 0], "헤드셋만 아는 비밀", OWN, 1, -30, 24)}
        {lab(cam, [0, 8, 1], "공개 값 (공중)", PUB, at(f, ex) * (1 - at(f, ex + 70)), -20)}
        {lab(cam, [-9, 11, 3], "같은 열쇠", KEY, at(f, ex + 50), -40)}
        {lab(cam, [19, 10, 0], "같은 열쇠", KEY, at(f, ex + 50), -40)}
        {lab(cam, [LIS[0], 6.6, LIS[2]], "엿들어도 열쇠를 못 만든다", BAD, no, -40, 26)}
        <Note x={360} y={830} w={1200} a={no} col={OWN} lines={[["ECDH", "= 각자 비밀 하나 + 상대의 공개 값 → 같은 열쇠. 공개 값만으로는 계산할 수 없다 (2.1은 P-192 곡선)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 숫자 비교 */
const Compare: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [0, 14, 34], look: [0, 6, 0], fov: 40 }, f / len), mid = at(f, 10) * (1 - at(f, cues[1])), show = at(f, cues[1]), ex = at(f, cues[2]);
  const [px, py] = project(cam, [PP[0] - 2, 7, PP[2] + 0.5]), [hx, hy] = project(cam, [HP[0], 8.5, HP[2]]);
  return (
    <>
      <Stage cam={cam}>{mid > 0 && <Mitm p={[0, 0, 1]} />}</Stage>
      <Title kicker="숫자 비교">사람이 두 화면의 숫자를 비교한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [0, 5, 1], "둘인 척 끼어든다면?", BAD, mid, -60)}
        <g opacity={show}>
          {[[px, py], [hx, hy - 60]].map(([x, y], i) => (
            <g key={i}><rect x={x - 130} y={y - 50} width={260} height={100} rx={16} fill={C.panel} stroke={KEY} strokeWidth={3} /><text x={x} y={y + 16} textAnchor="middle" fill={C.text} fontSize={46} fontWeight={900} letterSpacing={6}>{SIX}</text></g>
          ))}
          <text x={(px + hx) / 2} y={Math.min(py, hy) - 20} textAnchor="middle" fill={KEY} fontSize={34} fontWeight={900}>같다 ✓</text>
        </g>
        <Note x={360} y={830} w={1200} a={ex} col={KEY} lines={[["사양의 예", `g 출력 0x${G_OUT.toString(16)} = ${G_OUT.toLocaleString("en-US")} → 아래 6자리 ${SIX}`]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 화면 없는 척 */
const Iocap: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-3, 16, 38], look: [0, 5, 0], fov: 40 }, f / len), fake = at(f, 10), chk = at(f, cues[1]);
  const t = cues[1];
  return (
    <>
      <Stage cam={cam}>
        <Mitm p={[0, 0, 1]} />
        <Packet3D f={f} t0={t} t1={t + 35} a={PP} b={[0, 4, 1]} col={KEY} />
        <Packet3D f={f} t0={t + 10} t1={t + 45} a={HP} b={[0, 4, 1]} col={KEY} />
      </Stage>
      <Title kicker="IOcap">화면 없는 척해도, 확인 값이 맞지 않는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [0, 6, 1], "“나는 화면이 없어요” → 확인 건너뛰자", BAD, fake, -40, 26)}
        {lab(cam, [0, 1, 1], "확인 값 ✗ 맞지 않음", BAD, at(f, t + 45), 60, 30)}
        <Note x={360} y={830} w={1200} a={chk} col={OWN} lines={[["확인 값", "= f3(… , IOcap, 주소). 두 기기가 실제로 알린 입출력 능력이 들어가서, 속인 값으로는 맞출 수 없다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 세 세대 (3D 기둥) */
const Sc: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [0, 10, 32], look: [0, 3, 0], fov: 40 }, { pos: [3, 11, 30], look: [0, 3, 0], fov: 40 }, f / len);
  const G: [string, string, string, number, string][] = [["레거시 (≤ 2.0)", "PIN + SAFER+ · E0", PIN, 2, "PIN 하나가 비밀"], ["SSP (2.1)", "P-192 ECDH · E0", OWN, 3.5, "엿듣기·끼어들기 막음"], ["Secure Connections (4.1)", "P-256 ECDH · AES-CCM", KEY, 5, "더 강한 곡선과 암호"]];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 12]} />
        {G.map(([, , col, h], i) => { const a = i < 2 ? 1 : at(f, cues[1] - 20); return a > 0 ? <mesh key={i} position={[(i - 1) * 9, (h * a) / 2, 0]}><boxGeometry args={[5, h * a, 5]} />{mat(col, 0.35)}</mesh> : null; })}
      </Scene3D>
      <Title kicker="세 세대">곡선과 암호를 더 강한 표준으로</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {G.map(([k, v, col, h, s2], i) => { const a = i < 2 ? 1 : at(f, cues[1] - 20); return <g key={i} opacity={a}>{lab(cam, [(i - 1) * 9, h, 0], k, col, 1, -50, 28)}{lab(cam, [(i - 1) * 9, h, 0], v, C.text, 1, -16, 22)}{lab(cam, [(i - 1) * 9, 0, 3], s2, C.dim, 1, 50, 22)}</g>; })}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [8, 18, 38], look: [2, 5, -1], fov: 40 }, f / len);
  const L: [string, string][] = [["예전: PIN 하나가 비밀의 전부", "짧으면 엿들은 교환으로 짐작해 볼 수 있었다"], ["지금: 각자의 비밀 값 + 6자리 숫자", "엿듣기는 수학이, 끼어들기는 사람의 눈이 막는다"], ["그래서 PIN 대신 숫자 확인", "Secure Connections: P-256 · AES"]];
  return (
    <>
      <Stage cam={cam}><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 10, 0]} col={KEY} s={0.8} /></Stage>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${240 + i * 160})`}>
            <rect x={0} y={0} width={1000} height={124} rx={22} fill={C.panel} stroke={i === 2 ? KEY : OWN} strokeWidth={3} opacity={0.95} />
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
    case "legacy": return <Legacy cues={s.cues} len={s.frames} />;
    case "ssp": return <Ssp cues={s.cues} len={s.frames} />;
    case "compare": return <Compare cues={s.cues} len={s.frames} />;
    case "iocap": return <Iocap cues={s.cues} len={s.frames} />;
    case "sc": return <Sc cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Pin = makeVideo("pin", scenesFor, LEAD, body);
export { Headset };
