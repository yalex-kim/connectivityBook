import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { transitionPayloads } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { Packet3D } from "../common/deep3d";
import { EX } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 왼쪽 = 분홍, 오른쪽 = 주황, 이전 약속 = 청록, 새 약속 = 인디고, 끊김 = 빨강 */
const PH = C.accent, LC = "#f472b6", RC = C.warn, OLD = C.accent2, NEW = DEEP, BAD = C.bad, OK = C.ok;
const PP: Vec = [-16, 7, 2], LP: Vec = [6, 5, 1], RP: Vec = [17, 5, 1];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const Buds: React.FC = () => (<><Earbud3D p={[LP[0], 3.2, LP[2]]} ry={-1.2} s={1.4} /><Earbud3D p={[RP[0], 3.2, RP[2]]} ry={1.9} s={1.4} /></>);
const CAM: Cam = { pos: [-6, 18, 40], look: [0, 4, 1], fov: 40 };
const lab = (cam: Cam, p: Vec, t: string, col: string, a: number, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>{children}</svg>;
const mat = (col: string, glow = 0.3, op = 1) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} transparent={op < 1} opacity={op} />;
/** 두 이어폰에 번갈아 가는 패킷(약속된 간격마다) */
const Stream: React.FC<{ f: number; every: number; until?: number; from?: number; col?: [string, string]; drop?: (i: number) => boolean }> = ({ f, every, until = 1e9, from = 0, col = [LC, RC], drop }) => (
  <>
    {Array.from({ length: 40 }, (_, i) => { const t0 = from + i * every; if (t0 > until) return null; return (
      <group key={i}>
        <Packet3D f={f} t0={t0} t1={t0 + 24} a={PP} b={LP} col={col[0]} size={0.8} drop={drop?.(2 * i)} />
        <Packet3D f={f} t0={t0 + 8} t1={t0 + 32} a={PP} b={RP} col={col[1]} size={0.8} drop={drop?.(2 * i + 1)} />
      </group>
    ); })}
  </>
);

/* 시간 레인(3D): 왼쪽·오른쪽 이어폰의 CIS 이벤트가 x축을 따라 놓인다. 재생 머리(head)가 지나간 칸만 보인다 */
type Seg = { x0: number; x1: number; gap: number; col: string };
const LANE_Z = [-2.2, 2.2];
const Lanes: React.FC<{ segs: Seg[]; head: number; y?: number; holes?: [number, number][] }> = ({ segs, head, y = 0, holes = [] }) => (
  <group position={[0, y, 0]}>
    {LANE_Z.map((z, li) => (
      <group key={li}>
        <mesh position={[0, 0.1, z]}><boxGeometry args={[60, 0.2, 2.6]} />{mat("#16213a", 0.05)}</mesh>
        {segs.flatMap((s, si) => Array.from({ length: Math.floor((s.x1 - s.x0) / s.gap) + 1 }, (_, k) => s.x0 + k * s.gap).filter((x) => x <= head && x < s.x1 + 0.01).map((x) => (
          <mesh key={`${si}-${x}`} position={[x, 0.9, z]}><boxGeometry args={[Math.min(1.4, s.gap * 0.6), 1.4, 2]} />{mat(s.col, 0.55)}</mesh>
        )))}
        {holes.map(([a, b], hi) => head > a && <mesh key={hi} position={[(a + Math.min(b, head)) / 2, 0.25, z]}><boxGeometry args={[Math.max(0.01, Math.min(b, head) - a), 0.3, 2.6]} />{mat(BAD, 0.8, 0.55)}</mesh>)}
      </group>
    ))}
  </group>
);
const LCAM: Cam = { pos: [0, 16, 26], look: [0, 0, 0], fov: 46 };
const Flag: React.FC<{ x: number; col?: string; a?: number }> = ({ x, col = "#ffffff", a = 1 }) => a <= 0 ? null : (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 2.6, 0]}><boxGeometry args={[0.2, 5.2, 7.4]} />{mat(col, 1.2, a)}</mesh>
    <mesh position={[0.9, 4.9, -3.4]}><boxGeometry args={[1.8, 0.9, 0.1]} />{mat(col, 1.2, a)}</mesh>
  </group>
);

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [2, 20, 38], look: [0, 4, 1], fov: 40 }, f / len);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        <Stream f={f} every={30} />
      </Scene3D>
      <Svg>
        {lab(cam, [LP[0], 0, LP[2]], "왼쪽", LC, 1, 50)}
        {lab(cam, [RP[0], 0, RP[2]], "오른쪽", RC, 1, 60)}
        {lab(cam, [PP[0], 0, PP[2]], "휴대폰", PH, 1, 60)}
        <Note x={460} y={150} w={1000} a={at(f, 20)} col={OLD} lines={[["약속 (CIS 설정)", "정해진 간격 · 다시 보낼 기회 · 기한"]]} />
        <text x={960} y={460} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={at(f, cues[1])}>?</text>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 바꾸고 싶은 순간: 붐비는 전파 */
const Want: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-2, 22, 36], look: [0, 4, 1], fov: 40 }, f / len);
  const crowd = interpolate(f, [10, 50, cues[1], cues[1] + 40], [0, 1, 1, 0.15], clamp);
  const people: Vec[] = Array.from({ length: 14 }, (_, i) => [-20 + (i * 37) % 44, 0, -12 + ((i * 13) % 9) - (i % 3) * 3]);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        {crowd > 0.05 && people.map((p, i) => <group key={i} position={p}><mesh position={[0, 2.6, 0]}><capsuleGeometry args={[0.9, 3, 8, 14]} />{mat("#7c8aa5", 0.15, 0.55 * crowd)}</mesh><mesh position={[0, 5.4, 0]}><sphereGeometry args={[0.8, 14, 10]} />{mat("#7c8aa5", 0.15, 0.55 * crowd)}</mesh></group>)}
        {crowd > 0.05 && Array.from({ length: 10 }, (_, i) => { const k = ((f + i * 9) % 40) / 40; return <mesh key={"s" + i} position={[-8 + i * 3, 4 + Math.sin(i) * 2, 6 - k * 10]}><sphereGeometry args={[0.35 + k * 0.6, 10, 8]} />{mat(BAD, 1, (1 - k) * crowd)}</mesh>; })}
        <Stream f={f} every={30} drop={(i) => f < cues[1] && i % 3 === 1} />
      </Scene3D>
      <Title kicker="바꾸고 싶은 순간">붐비면 더 튼튼하게, 한산하면 아껴 쓰게</Title>
      <Svg>
        {[["PHY", "더 튼튼한 변조"], ["다시 보낼 기회", "횟수·기한"], ["지연", "얼마나 기다릴까"]].map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[0] + 30 + i * 12)} transform={`translate(${520 + i * 330},780)`}>
            <circle cx={0} cy={0} r={46} fill={C.panel} stroke={DEEP} strokeWidth={4} />
            <line x1={0} y1={0} x2={Math.cos(-1.2 + (f < cues[1] ? 1.8 : 0.3)) * 36} y2={Math.sin(-1.2 + (f < cues[1] ? 1.8 : 0.3)) * 36} stroke={DEEP} strokeWidth={6} strokeLinecap="round" />
            <text x={70} y={-6} fill={C.text} fontSize={28} fontWeight={900}>{k}</text>
            <text x={70} y={28} fill={C.dim} fontSize={22} fontWeight={700}>{v}</text>
          </g>
        ))}
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 6.3까지: 끊고 다시 만들기 (3D 레인) */
const Before: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(LCAM, { pos: [4, 15, 25], look: [2, 0, 0], fov: 46 }, f / len);
  const head = interpolate(f, [0, len - 20], [-26, 26], clamp), cut = -4, made = 8;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 8]} />
        <Lanes head={head} segs={[{ x0: -26, x1: cut - 0.5, gap: 2.4, col: OLD }, { x0: made, x1: 30, gap: 3.4, col: NEW }]} holes={[[cut, made]]} />
        <Flag x={cut} col={BAD} a={head > cut ? 1 : 0} />
        <Flag x={made} col={NEW} a={head > made ? 1 : 0} />
      </Scene3D>
      <Title kicker="문제: 6.3까지">약속을 바꾸려면, 끊고 새로 만들어야 했다</Title>
      <Svg>
        {lab(cam, [-14, 0, LANE_Z[0] - 1.6], "왼쪽", LC, 1, 0, 26)}
        {lab(cam, [-14, 0, LANE_Z[1] + 1.6], "오른쪽", RC, 1, 40, 26)}
        {lab(cam, [cut - 4, 3.2, -3.6], "① CIS 끊기", BAD, head > cut ? 1 : 0, -20, 30)}
        {lab(cam, [made + 5, 3.2, -3.6], "② 새 CIS 만들기", NEW, head > made ? 1 : 0, -20, 30)}
        {lab(cam, [(cut + made) / 2, 0, 4.5], "소리 흐름이 멈춤", BAD, head > cut + 3 ? 1 : 0, 40, 30)}
        {lab(cam, [-15, 2.5, 0], "이전 약속", OLD, at(f, 10), -40, 24)}
        {lab(cam, [18, 2.5, 0], "새 약속", NEW, head > made + 4 ? 1 : 0, -40, 24)}
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 7.0 ①: 약속 몇 벌을 미리 등록 */
const Register: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [0, 20, 38], look: [2, 5, 1], fov: 40 }, f / len);
  const cards = [{ t: 30, col: NEW, name: "설정 1: 튼튼하게" }, { t: 80, col: "#818cf8", name: "설정 2: 아껴 쓰게" }];
  const shelf: Vec = [11.5, 11, 1];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} z={PP[2]} />
        <Buds />
        <Stream f={f} every={30} />
        <mesh position={[shelf[0], shelf[1] - 1.4, shelf[2]]}><boxGeometry args={[9, 0.3, 3]} />{mat("#334155", 0.1)}</mesh>
        {cards.map((c, i) => { const k = interpolate(f, [c.t, c.t + 34], [0, 1], clamp); if (f < c.t) return null; const p: Vec = [PP[0] + (shelf[0] - 2.4 + i * 4.8 - PP[0]) * k, PP[1] + 4 + (shelf[1] - PP[1] - 4) * k + Math.sin(k * Math.PI) * 3, PP[2]]; return <mesh key={i} position={p} rotation={[0, 0, 0]}><boxGeometry args={[3.8, 2.4, 0.3]} />{mat(c.col, 0.8)}</mesh>; })}
      </Scene3D>
      <Title kicker="해결 ①: 7.0의 IPU">소리를 보내는 중에, 약속 몇 벌을 미리 등록</Title>
      <Svg>
        {cards.map((c, i) => lab(cam, [shelf[0] - 2.4 + i * 4.8, shelf[1] + 1.6, shelf[2]], c.name, c.col, at(f, c.t + 34), -10, 24))}
        <Note x={300} y={780} w={1320} a={at(f, cues[1])} col={NEW} lines={[["바뀌는 것", "PHY · 간격 · 다시 보낼 기회 · 지연"], ["그대로", "코덱이 소리를 만드는 박자(SDU 간격) · 프레임 방식"]]} />
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 7.0 ②: 정해 둔 이벤트에서 두 이어폰이 함께 */
const Switch: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(LCAM, { pos: [3, 15, 25], look: [1, 0, 0], fov: 46 }, f / len);
  const head = interpolate(f, [0, cues[1] + 20], [-26, 26], clamp), inst = 0.4, req = at(f, cues[1] + 10);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 8]} />
        <Lanes head={head} segs={[{ x0: -26, x1: inst - 2.4, gap: 2.4, col: OLD }, { x0: inst, x1: 30, gap: 3.4, col: NEW }]} />
        <Flag x={inst - 0.9} a={1} />
      </Scene3D>
      <Title kicker="해결 ②: 같은 순간에 갈아타기">“이벤트 N부터”를 정해, 두 이어폰이 함께</Title>
      <Svg>
        {lab(cam, [-14, 0, LANE_Z[0] - 1.6], "왼쪽", LC, 1, 0, 26)}
        {lab(cam, [-14, 0, LANE_Z[1] + 1.6], "오른쪽", RC, 1, 40, 26)}
        {lab(cam, [inst - 6, 3.2, -3.6], "instant (이벤트 N) →", "#ffffff", 1, -20, 30)}
        {lab(cam, [inst + 8, 0, 4.5], "빈칸 없이 이어진다", OK, head > inst + 6 ? 1 : 0, 40, 30)}
        <Note x={340} y={790} w={1240} a={req} col={RC} lines={[["이어폰도 요청 가능", "LL_CIS_PERIPHERAL_UPDATE_REQ → 휴대폰이 LL_CIS_UPDATE_REQ로 instant를 정한다"]]} />
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 이미 출발한 조각 (2D 타임라인) */
const Inflight: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), a1 = at(f, cues[1]);
  const { bn, ft } = EX, n = transitionPayloads(bn, ft), E = 9, I = 5, X0 = 260, W = 150, Y0 = 300;
  // 조각 p: 기준 이벤트 e = floor(p / bn), 기한 = e + ft − 1. instant 전에 시작해 instant 이후까지 가는 것이 전환 조각
  const pays = Array.from({ length: E * bn }, (_, p) => { const e = Math.floor(p / bn); return { p, e, end: Math.min(E - 1, e + ft - 1), cross: e < I && e + ft - 1 >= I, after: e >= I }; });
  return (
    <>
      <Title kicker="해결 ③: 이미 출발한 조각">바뀌는 순간에 떠 있던 조각은 원래 기한대로</Title>
      <Svg>
        {Array.from({ length: E }, (_, e) => <g key={e}><rect x={X0 + e * W + 6} y={Y0 - 60} width={W - 12} height={40} rx={8} fill={e >= I ? NEW : OLD} opacity={0.75} /><text x={X0 + e * W + W / 2} y={Y0 - 32} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>{e === I ? "N" : e < I ? `N−${I - e}` : `N+${e - I}`}</text></g>)}
        <text x={X0 - 20} y={Y0 - 32} textAnchor="end" fill={C.dim} fontSize={22} fontWeight={800}>이벤트</text>
        {pays.filter((q) => !q.after || a1 > 0).map((q) => (
          <g key={q.p} opacity={q.after ? 0.5 : 1}>
            <rect x={X0 + q.e * W + 10} y={Y0 + q.p * 22} width={(q.end - q.e + 1) * W - 20} height={16} rx={6} fill={q.cross ? C.warn : q.after ? NEW : "#475569"} opacity={q.cross ? at(f, cues[0] + 30) * 0.7 + 0.3 : 1} />
          </g>
        ))}
        <line x1={X0 + I * W} x2={X0 + I * W} y1={Y0 - 80} y2={Y0 + E * bn * 22 + 10} stroke="#ffffff" strokeWidth={5} />
        <text x={X0 + I * W} y={Y0 - 92} textAnchor="middle" fill="#ffffff" fontSize={26} fontWeight={900}>instant</text>
        <g opacity={a1} transform={`translate(${X0},${Y0 + E * bn * 22 + 50})`}>
          <rect x={0} y={0} width={1360} height={70} rx={16} fill={C.panel} stroke={C.warn} strokeWidth={3} />
          <text x={28} y={46} fill={C.text} fontSize={28} fontWeight={800}>이벤트마다 {bn}조각(BN), 기한 {ft}이벤트(FT) → 건너가는 조각 = {bn} × ({ft} − 1) = <tspan fill={C.warn} fontWeight={900}>{n}개</tspan></text>
        </g>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 한계 (2D 아이콘 셋) */
const Limits: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const panel = (i: number, a: number, title: string, sub: string, art: React.ReactNode) => (
    <g opacity={a} transform={`translate(${170 + i * 540},300)`}>
      <rect x={0} y={0} width={480} height={420} rx={26} fill={C.panel} stroke={DEEP} strokeWidth={3} />
      <g transform="translate(240,170)">{art}</g>
      <text x={240} y={340} textAnchor="middle" fill={C.text} fontSize={32} fontWeight={900}>{title}</text>
      <text x={240} y={382} textAnchor="middle" fill={C.dim} fontSize={24} fontWeight={700}>{sub}</text>
    </g>
  );
  return (
    <>
      <Title kicker="한계">미리 등록한 약속으로만, 정해 둔 순간에, 양쪽이 지원할 때</Title>
      <Svg>
        {panel(0, at(f, cues[1]), "등록한 약속 사이에서만", "새 약속은 먼저 등록해야", <>
          <rect x={-150} y={40} width={300} height={14} rx={6} fill="#475569" />
          {[0, 1, 2].map((k) => <rect key={k} x={-140 + k * 100} y={-50} width={80} height={86} rx={10} fill={k === 2 ? "none" : k ? "#818cf8" : NEW} stroke={k === 2 ? C.faint : "none"} strokeDasharray="8 8" strokeWidth={3} />)}
        </>)}
        {panel(1, at(f, cues[1] + 50), "정해 둔 순간이 와야", "바로 바뀌지 않는다", <>
          <line x1={-170} x2={170} y1={40} y2={40} stroke={C.faint} strokeWidth={6} />
          {[-150, -100, -50, 0].map((x) => <rect key={x} x={x - 14} y={8} width={28} height={30} rx={4} fill={OLD} />)}
          <rect x={58} y={-90} width={8} height={130} fill="#fff" /><rect x={66} y={-90} width={60} height={34} fill="#fff" />
          <text x={-80} y={-40} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={800}>기다림 →</text>
        </>)}
        {panel(2, at(f, cues[2]), "양쪽 모두 7.0 지원", "한쪽만이면 쓸 수 없다", <>
          <rect x={-150} y={-90} width={90} height={160} rx={16} fill="#d9e2f0" /><rect x={-142} y={-80} width={74} height={140} rx={8} fill={PH} />
          <circle cx={90} cy={-10} r={44} fill="#f1f4f9" /><rect x={70} y={20} width={24} height={70} rx={10} fill="#f1f4f9" />
          <rect x={-150} y={84} width={300} height={44} rx={22} fill={DEEP} /><text x={0} y={116} textAnchor="middle" fill="#14123a" fontSize={26} fontWeight={900}>둘 다 7.0</text>
        </>)}
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 8. 정리: 6.3 vs 7.0 (3D 레인 둘) */
const Outro: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [0, 26, 30], look: [0, 0, 1], fov: 48 }, { pos: [4, 24, 30], look: [1, 0, 1], fov: 48 }, f / len);
  const head = interpolate(f, [0, len * 0.7], [-26, 26], clamp);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 18, 10]} />
        <group position={[0, 0, -7]}><Lanes head={head} segs={[{ x0: -26, x1: -4.5, gap: 2.4, col: OLD }, { x0: 8, x1: 30, gap: 3.4, col: NEW }]} holes={[[-4, 8]]} /></group>
        <group position={[0, 0, 7]}><Lanes head={head} segs={[{ x0: -26, x1: -2, gap: 2.4, col: OLD }, { x0: 0.4, x1: 30, gap: 3.4, col: NEW }]} /><Flag x={-0.5} /></group>
      </Scene3D>
      <Svg>
        <g transform="translate(110,90)"><rect x={0} y={0} width={760} height={150} rx={20} fill={C.panel} opacity={0.94} /><text x={30} y={60} fill={BAD} fontSize={32} fontWeight={900}>위: 6.3까지 · 끊고 다시 만든다</text><text x={30} y={115} fill={OK} fontSize={32} fontWeight={900}>아래: 7.0 IPU · 같은 순간에 갈아탄다</text></g>
        {lab(cam, [2, 0, -2.5], "멈춤", BAD, head > 2 ? 1 : 0, 0, 28)}
        {lab(cam, [10, 0, 11.5], "빈칸 없음", OK, head > 6 ? 1 : 0, 40, 28)}
      </Svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "want": return <Want cues={s.cues} len={s.frames} />;
    case "before": return <Before cues={s.cues} len={s.frames} />;
    case "register": return <Register cues={s.cues} len={s.frames} />;
    case "switch": return <Switch cues={s.cues} len={s.frames} />;
    case "inflight": return <Inflight cues={s.cues} />;
    case "limits": return <Limits cues={s.cues} />;
    case "outro": return <Outro len={s.frames} />;
  }
};
export const Ipu = makeVideo("ipu", scenesFor, LEAD, body);
