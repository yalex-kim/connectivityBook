import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { instantRisk } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { project } from "../range/hook3d";
import { Phone3D, Watch3D } from "../connection/Connection";
import { Packet3D, packetPos } from "../common/deep3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { DEEP, Ground, Note, makeVideo } from "../common/kit";
import { SchedStage, SchedCam } from "../scheduling/Scheduling";
import { EVERY, FAR, NEAR, NOW, PER } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰(센트럴) = 파랑, 워치(페리페럴) = 청록, 새 약속 = 인디고, 실패 = 빨강 */
const PH = C.accent, WT = C.accent2, NEW = DEEP, BAD = C.bad, OK = C.ok, EARC = "#f472b6";
const pct = (x: number) => (x * 100 < 1 ? (x * 100).toFixed(2) : (x * 100).toFixed(0)) + "%";

/** 만남 하나(번호 붙은 칸). state: 만남 / 못 들음 / 혼자 기다림 / 건너뜀 */
const Ev: React.FC<{ x: number; y: number; w: number; n?: number; col: string; state?: "ok" | "miss" | "alone" | "skip"; a?: number }> = ({ x, y, w, n, col, state = "ok", a = 1 }) => (
  <g opacity={a}>
    <rect x={x} y={y} width={w} height={54} rx={8} fill={state === "ok" ? col : "none"} stroke={state === "ok" ? "none" : state === "alone" ? col : BAD} strokeWidth={3} strokeDasharray={state === "ok" ? undefined : "7 5"} />
    {n !== undefined && <text x={x + w / 2} y={y + 36} textAnchor="middle" fill={state === "ok" ? C.bg : state === "alone" ? col : BAD} fontSize={22} fontWeight={900}>{state === "miss" || state === "skip" ? "✕" : n}</text>}
  </g>
);
const RowLabel: React.FC<{ y: number; col: string; children: string }> = ({ y, col, children }) => <text x={330} y={y + 36} textAnchor="end" fill={col} fontSize={28} fontWeight={800}>{children}</text>;

/* ---------------------------------------------------------------- 1. 훅 (3D) */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[0], SchedCam[1], f / len), q = at(f, cues[2]);
  const n = NOW - 4 + Math.floor(f / 24);
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, cues[1])} transform="translate(960,150)">
          <rect x={-200} y={-50} width={400} height={80} rx={40} fill={C.panel} stroke={WT} strokeWidth={3} />
          <text x={0} y={2} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>{n}번째 만남</text>
        </g>
        <g opacity={q} transform="translate(1480,330)">
          <text x={0} y={0} textAnchor="middle" fill={NEW} fontSize={36} fontWeight={900}>간격 30 ms → 60 ms ?</text>
          <text x={0} y={52} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={700}>언제 말하고, 언제부터?</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. "지금 바로"는 안 된다 (3D: 어긋난 박자) */
const IP: Vec = [-13, 7, 2], IW: Vec = [13, 5, 0];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const WatchAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x - 12, 0, z]}><Watch3D /></group>;
/** 약속 시각에 기기 위로 퍼지는 빛 고리 */
const Ring: React.FC<{ p: Vec; k: number; col: string }> = ({ p, k, col }) => k <= 0 || k >= 1 ? null : <mesh position={p} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1 + k * 3, 0.15, 8, 40]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.4} transparent opacity={1 - k} /></mesh>;
const Now: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 16, 42], look: [0, 5, 0], fov: 40 }, { pos: [3, 17, 40], look: [0, 5, 0], fov: 40 }, f / len);
  const c1 = cues[1], c2 = cues[2], c3 = cues[3];
  const ringK = (period: number, phase: number) => ((f - phase) % period + period) % period / 18;
  const before = f < c2, phK = before ? ringK(30, 0) : ringK(60, 15), wtK = ringK(30, 0);
  const meet = before && phK < 1 && wtK < 1;
  const timer = interpolate(f, [c2, c3 + 60], [0, 1], clamp), dead = timer >= 1;
  const lab = (p: Vec, t: string, col: string, a: number, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  const pp = packetPos(f, 25, c1 + 10, IP, IW);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <PhoneAt x={-15} z={2} /><WatchAt x={15} />
        <Ring p={[-15, 13.5, 2]} k={phK} col={before ? PH : NEW} />
        <Ring p={[15, 8.5, 0]} k={wtK} col={WT} />
        {meet && <mesh position={[0, 6, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.07, 26, 8]} /><meshStandardMaterial color={OK} emissive={OK} emissiveIntensity={1.2} /></mesh>}
        <Packet3D f={f} t0={25} t1={c1 + 10} a={IP} b={IW} col={NEW} drop />
      </Scene3D>
      <Title kicker="“지금 바로 바꾸자”라면">한쪽만 먼저 바꾸면 만나지 못한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(pp, "“지금부터 60 ms!”", NEW, f >= 25 && f < c1 + 10 ? 1 : 0, -40)}
        {lab([6, 6, 1], "✕ 못 들음", BAD, at(f, c1 - 5) * (1 - at(f, c2)), -30, 30)}
        {lab([-15, 0, 4], before ? "30 ms" : "60 ms로 바꿈", before ? PH : NEW, 1, 70)}
        {lab([15, 0, 2], "30 ms 그대로", WT, 1, 70)}
        {lab([0, 10, 0], "서로 다른 시각에 깨어 혼자 기다린다", BAD, at(f, c2 + 20), -10, 28)}
        <g opacity={at(f, c3)} transform="translate(560,830)">
          <text x={0} y={-12} fill={C.dim} fontSize={22}>감독 타이머: 한 번도 못 만남</text>
          <rect x={0} y={0} width={800} height={26} rx={8} fill="none" stroke={C.faint} strokeWidth={2} />
          <rect x={0} y={0} width={800 * timer} height={26} rx={8} fill={dead ? BAD : DEEP} />
          <text x={820} y={22} fill={BAD} fontSize={28} fontWeight={900} opacity={dead ? 1 : 0}>끊김 (0x08)</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. instant: 미래의 만남 번호 (3D 블록 줄) */
const ICAM3: Cam = { pos: [4, 24, 24], look: [5, 0, 1], fov: 44 };
const BXI = (i: number) => (i < 6 ? -13 + i * 3.4 : -13 + 6 * 3.4 + (i - 6) * 6.8);
const InstantScene: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), count = at(f, cues[1]), msg = at(f, cues[2]), sw = at(f, cues[3]);
  const shown = interpolate(f, [10, cues[3]], [3, 6.2], clamp) + interpolate(f, [cues[3], cues[3] + 60], [0, 3], clamp);
  const lab = (p: Vec, t: string, col: string, a: number, dy = 0, size = 26) => { const [x, y] = project(ICAM3, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  const state = (row: number, i: number) => (i === 3 ? "skip" : row === 1 && i === 0 ? "miss" : "ok");
  return (
    <>
      <Scene3D cam={ICAM3}>
        <Ground light={[0, 18, 12]} />
        {[0, 1].map((row) => Array.from({ length: 9 }, (_, i) => {
          if (i >= shown) return null;
          const st = state(row, i), on = i >= 6 && sw > 0.5, col = st !== "ok" ? BAD : on ? NEW : row === 0 ? PH : WT;
          return <mesh key={row + "-" + i} position={[BXI(i), 1.1, row === 0 ? -2.6 : 2.6]}><boxGeometry args={[2.6, 2.2, 2.6]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={on ? 0.8 : 0.25} transparent opacity={st === "ok" ? 0.95 : 0.35} /></mesh>;
        }))}
        {sw > 0 && <mesh position={[BXI(6) - 1.9, 2.4, 0]}><boxGeometry args={[0.2, 4.8, 9]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.4} transparent opacity={0.6 * sw} /></mesh>}
        <Packet3D f={f} t0={cues[2]} t1={cues[2] + 30} a={[BXI(1), 4, -2.6]} b={[BXI(1), 4, 2.6]} col={NEW} arc={2.5} />
      </Scene3D>
      <Title kicker="instant">“몇 번째 만남부터”로 약속한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {Array.from({ length: 9 }, (_, i) => i < shown && lab([BXI(i), 2.6, -2.6], String(NOW + i), C.text, 1, -26, 24))}
        {lab([BXI(0) - 3.4, 1, -2.6], "휴대폰", PH, 1, 8)}
        {lab([BXI(0) - 3.4, 1, 2.6], "워치", WT, 1, 8)}
        {lab([BXI(3), 0, 4.5], "건너뛰어도 번호는 센다", BAD, count, 40, 22)}
        {lab([BXI(1), 6.5, 0], `“${NOW + 6}번째 만남부터 60 ms”`, NEW, msg, -10, 26)}
        {lab([BXI(6) - 1.9, 5.5, 0], `${NOW + 6}번: 함께 바꿈`, NEW, sw, -60, 30)}
        <Note x={360} y={800} w={1200} a={count} col={NEW} lines={[["instant", "= 새 값을 쓰기 시작할 만남 번호(connEventCounter). 휴대폰(센트럴)이 고른다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 너무 가까우면 */
const Far: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 360, CW = 128, W = 110, I = NOW + 2;
  const late = at(f, cues[1]), passed = at(f, cues[2]), six = at(f, cues[3]);
  const st = (k: number) => (k < 3 ? "miss" : "ok") as "ok" | "miss";
  return (
    <>
      <Title kicker="너무 가까운 번호">말을 듣기 전에 번호가 지나 버리면</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <RowLabel y={330} col={PH}>휴대폰</RowLabel>
        <RowLabel y={450} col={WT}>워치</RowLabel>
        {Array.from({ length: 5 }, (_, k) => (
          <g key={k} opacity={k < 3 ? 1 : late}>
            <Ev x={X0 + k * CW} y={330} w={W} n={NOW + k} col={PH} />
            <Ev x={X0 + k * CW} y={450} w={W} n={NOW + k} col={WT} state={st(k)} />
          </g>
        ))}
        <rect x={X0} y={240} width={330} height={56} rx={14} fill={C.panel} stroke={NEW} strokeWidth={3} />
        <text x={X0 + 165} y={277} textAnchor="middle" fill={C.text} fontSize={24} fontWeight={800}>“{I}번째 만남부터”</text>
        <line x1={X0 + 2 * CW - 9} x2={X0 + 2 * CW - 9} y1={310} y2={530} stroke={NEW} strokeWidth={4} strokeDasharray="10 8" />
        <g opacity={passed}>
          <text x={X0 + 3 * CW + W / 2} y={560} textAnchor="middle" fill={OK} fontSize={22} fontWeight={800}>이제야 받음</text>
          <text x={X0 + 5 * CW + 20} y={490} fill={BAD} fontSize={30} fontWeight={900}>{I}번은 이미 지남 → 끊김 (0x28)</text>
        </g>
        <g opacity={six} transform="translate(360,640)">
          <text x={0} y={0} fill={C.text} fontSize={28} fontWeight={900}>사양의 권장: 워치가 들을 기회 ≥ 6번</text>
          {Array.from({ length: 6 }, (_, k) => <rect key={k} x={k * 90} y={24} width={74} height={50} rx={8} fill={WT} opacity={0.85} />)}
          <rect x={6 * 90} y={20} width={6} height={60} fill={NEW} />
          <text x={6 * 90 + 20} y={60} fill={NEW} fontSize={24} fontWeight={800}>instant</text>
        </g>
        <Note x={X0} y={770} w={1300} a={passed} col={NEW} lines={[["0x28", "= Instant Passed. 지난 번호의 연결 갱신을 받은 워치는 연결을 잃은 것으로 처리한다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 기회는 듣는 횟수로 */
const Odds: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 560, CELL = 26;
  const rows: [string, number, number, number][] = [["매번 듣는 워치 · 6번째 만남", NEAR, 1, 1], ["6번에 한 번 듣는 워치 · 6번째 만남", NEAR, EVERY, 3], ["6번에 한 번 듣는 워치 · 36번째 만남", FAR, EVERY, 4]];
  const lg = (p: number) => Math.max(0, 1 + Math.log10(p) / 4); // 100% → 1, 0.01% → 0
  return (
    <>
      <Title kicker="몇 번이면 충분할까">기회는 만남이 아니라 “듣는 횟수”로 센다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={X0} y={270} fill={C.dim} fontSize={24} fontWeight={700} opacity={at(f, 10)}>한 번에 못 들을 확률 30% · 칸 = 만남 · 채운 칸 = 워치가 듣는 만남</text>
        {rows.map(([name, d, k, c], i) => {
          const r = instantRisk(d, k, PER), a = at(f, cues[c]), y = 330 + i * 170;
          return (
            <g key={name} opacity={a}>
              <text x={X0 - 24} y={y + 34} textAnchor="end" fill={C.text} fontSize={26} fontWeight={800}>{name}</text>
              {Array.from({ length: d }, (_, e) => <rect key={e} x={X0 + e * CELL} y={y} width={CELL - 6} height={48} rx={5} fill={e % k === 0 ? WT : "none"} stroke={e % k === 0 ? "none" : C.faint} strokeWidth={2} />)}
              <rect x={X0 + d * CELL + 4} y={y - 6} width={6} height={60} fill={NEW} />
              <text x={X0} y={y + 92} fill={r.miss > 0.1 ? BAD : OK} fontSize={30} fontWeight={900}>기회 {r.chances}번 → 모두 놓칠 확률 {pct(r.miss)}</text>
              <rect x={X0 + 560} y={y + 70} width={360} height={26} rx={6} fill={C.panel} stroke={C.faint} strokeWidth={2} />
              <rect x={X0 + 560} y={y + 70} width={360 * lg(r.miss)} height={26} rx={6} fill={r.miss > 0.1 ? BAD : OK} />
            </g>
          );
        })}
        <Note x={360} y={850} w={1300} a={at(f, cues[2])} col={NEW} lines={[["6번에 한 번", "= 페리페럴 지연 5: 할 말이 없으면 다섯 번 건너뛰어도 된다. 기회 = 듣는 만남만 센다(심화 4장 모델)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 새 앵커 포인트를 옮긴다 */
const Anchor: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 360, PX = 5, W = 22; // 1 ms = 5 px
  const X = (t: number) => X0 + t * PX, win = at(f, cues[1]), move = interpolate(f, [cues[2], cues[2] + 40], [0, 1], clamp);
  const OLD = 30, TI = 90, OFF = 18, NEWI = 60; // 원래 instant 시각 90 ms, WinOffset 18 ms, 새 간격 60 ms
  const first = TI + OFF + 2, others = [TI, TI + 30, TI + 60, TI + 90, TI + 120, TI + 150];
  return (
    <>
      <Title kicker="연결 갱신의 덤">새 약속의 시작 시각도 옮길 수 있다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <RowLabel y={330} col={PH}>워치와의 약속</RowLabel>
        <RowLabel y={450} col={EARC}>다른 기기</RowLabel>
        {[0, OLD, 2 * OLD].map((t) => <Ev key={t} x={X(t)} y={330} w={W} col={PH} />)}
        <g opacity={1 - win * 0.6}><Ev x={X(TI)} y={330} w={W} col={PH} state="alone" /><text x={X(TI) + W} y={545} textAnchor="end" fill={BAD} fontSize={22} fontWeight={800}>그대로면 겹침</text></g>
        {others.map((t) => <Ev key={t} x={X(t)} y={450} w={W} col={EARC} />)}
        <g opacity={win}>
          <text x={X(TI) - 8} y={300} textAnchor="end" fill={C.dim} fontSize={20}>원래 instant 시각</text>
          <path d={`M${X(TI)} 400 H${X(TI + OFF)}`} stroke={NEW} strokeWidth={3} />
          <text x={X(TI + OFF / 2)} y={426} textAnchor="middle" fill={NEW} fontSize={20} fontWeight={800}>WinOffset</text>
          <rect x={X(TI + OFF)} y={318} width={10 * PX} height={78} rx={8} fill={NEW} opacity={0.18} stroke={NEW} strokeWidth={3} strokeDasharray="8 6" />
          <text x={X(TI + OFF)} y={300} fill={NEW} fontSize={22} fontWeight={800}>전송 창</text>
        </g>
        <g opacity={move}>
          {[first, first + NEWI, first + 2 * NEWI].map((t, i) => <Ev key={i} x={X(t)} y={330} w={W} col={NEW} />)}
          <text x={X(first)} y={592} fill={NEW} fontSize={24} fontWeight={900}>↑ 새 앵커 포인트</text>
          <text x={X(first + 2 * NEWI) + 60} y={366} fill={OK} fontSize={24} fontWeight={800}>다른 기기와 안 겹침</text>
        </g>
        <Note x={X0} y={640} w={1300} a={win} col={NEW} lines={[["전송 창", "= 원래 instant 시각 + WinOffset에서 여는 창(최대 10 ms). 그 안에서 휴대폰이 처음 보낸 패킷이 새 앵커 포인트"], ["앵커 포인트", "= 약속(연결 이벤트)이 시작되는 시각. 호스트에 알리지 않고 옮길 수 있다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp(SchedCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["“지금”이 아니라 “몇 번째 만남부터”", "instant: 휴대폰이 고른다"], ["번호는 둘이 함께 센다", "들을 기회가 6번 이상이게 멀리"], ["같은 순간에 함께 넘어간다", "시작 시각도 겹치지 않게 옮길 수 있다"]];
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${240 + i * 160})`}>
            <rect x={0} y={0} width={940} height={124} rx={22} fill={C.panel} stroke={i === 2 ? OK : NEW} strokeWidth={3} opacity={0.95} />
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
    case "now": return <Now cues={s.cues} len={s.frames} />;
    case "instant": return <InstantScene cues={s.cues} />;
    case "far": return <Far cues={s.cues} />;
    case "odds": return <Odds cues={s.cues} />;
    case "anchor": return <Anchor cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Instant = makeVideo("instant", scenesFor, LEAD, body);
export { Hook as InstantHook };
