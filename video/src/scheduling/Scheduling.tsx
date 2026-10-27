import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { schedule, type SchedRun, type SchedTask } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project, Dots } from "../range/hook3d";
import { Phone3D, Watch3D } from "../connection/Connection";
import { Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { CLASH, CONN, EAR, FIT, SHORT, STAGGER } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 이어폰(LE 오디오) = 분홍, 워치 = 청록, 키보드 = 노랑, 건너뜀 = 빨강 */
const EARC = "#f472b6", WATC = C.accent2, KBC = "#facc15", BAD = C.bad, OK = C.ok, DEEP = "#a5b4fc";
const NAME: Record<string, string> = { ear: "이어폰", watch: "워치", kb: "키보드" };
const COL: Record<string, string> = { ear: EARC, watch: WATC, kb: KBC };

/** 세 연결(책 예시 모델의 과제). 우선순위: 이어폰 > 워치 > 키보드 */
const tasks = (off: { ear?: number; watch: number; kb: number }): SchedTask[] => [
  ...(off.ear === undefined ? [] : [{ name: "ear", period: EAR.period, dur: EAR.dur, prio: 5, offset: off.ear }]),
  { name: "watch", period: CONN.period, dur: CONN.dur, prio: 4, offset: off.watch },
  { name: "kb", period: CONN.period, dur: CONN.dur, prio: 3, offset: off.kb },
];
const CLASH3 = schedule(tasks({ ear: 0, watch: CLASH.watch + 0.5, kb: CLASH.kb + 0.5 }), 1000, "fixed"); // 셋이 거의 같은 시각
const STAG = schedule(tasks(STAGGER), 1000, "fixed");
const FIXED = schedule(tasks(CLASH), 1000, "fixed");
const FAIR = schedule(tasks(CLASH), 1000, "starve");

/* ---------------------------------------------------------------- 공통: 2D 시간축 한 줄 */
const Lane: React.FC<{ x: number; y: number; w: number; h: number; t0: number; t1: number; runs: SchedRun[]; task: string; label: string; upto?: number; a?: number }> = ({ x, y, w, h, t0, t1, runs, task, label, upto = Infinity, a = 1 }) => {
  const X = (t: number) => x + ((t - t0) / (t1 - t0)) * w, col = COL[task];
  return (
    <g opacity={a}>
      <text x={x - 20} y={y + h / 2 + 10} textAnchor="end" fill={col} fontSize={28} fontWeight={800}>{label}</text>
      <line x1={x} x2={x + w} y1={y + h} y2={y + h} stroke={C.faint} strokeWidth={2} />
      {runs.filter((r) => r.task === task && r.t >= t0 && r.t < Math.min(t1, upto)).map((r, i) =>
        r.ok ? <rect key={i} x={X(r.t)} y={y} width={Math.max(4, X(r.t + r.dur) - X(r.t))} height={h} rx={5} fill={col} />
          : (
            <g key={i}>
              <rect x={X(r.t)} y={y} width={Math.max(4, X(r.t + r.dur) - X(r.t))} height={h} rx={5} fill="none" stroke={BAD} strokeWidth={3} strokeDasharray="6 5" />
              <text x={(X(r.t) + X(r.t + r.dur)) / 2} y={y - 10} textAnchor="middle" fill={BAD} fontSize={22} fontWeight={900}>✕</text>
            </g>
          ))}
    </g>
  );
};
const Axis: React.FC<{ x: number; y: number; w: number; t0: number; t1: number; step: number; a?: number }> = ({ x, y, w, t0, t1, step, a = 1 }) => (
  <g opacity={a}>
    {Array.from({ length: Math.floor((t1 - t0) / step) + 1 }, (_, i) => t0 + i * step).map((t) => (
      <text key={t} x={x + ((t - t0) / (t1 - t0)) * w} y={y} textAnchor="middle" fill={C.faint} fontSize={20}>{t} ms</text>
    ))}
  </g>
);

/* ---------------------------------------------------------------- 3D 무대: 휴대폰 하나와 세 기기 */
const Keyboard3D: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p} rotation={[0, -0.15, 0]}>
    <mesh position={[0, 0.4, 0]}><boxGeometry args={[12, 0.8, 4.4]} /><meshStandardMaterial color="#2a3550" roughness={0.7} /></mesh>
    {Array.from({ length: 3 }, (_, r) => Array.from({ length: 10 }, (_, c) => (
      <mesh key={`${r}-${c}`} position={[-5 + c * 1.1, 0.95, -1.3 + r * 1.3]}><boxGeometry args={[0.9, 0.3, 1]} /><meshStandardMaterial color="#c9d3e3" roughness={0.5} /></mesh>
    )))}
  </group>
);
const PH: Vec = [0, 7, 0.6], WT: Vec = [15, 4, -2], BD: Vec = [-15, 3.6, 2], KB: Vec = [1, 1.2, 13];
const Stage: React.FC<{ cam: Cam; f: number; watch: number; others: number; clash?: number }> = ({ cam, f, watch, others, clash = 0 }) => (
  <Scene3D cam={cam}>
    <Ground />
    <group position={[12, 0, 0]}><Phone3D /></group>
    <group position={[3, 0, -2]}><Watch3D /></group>
    {others > 0 && <><Earbud3D p={[BD[0] - 1.2, 3.4, BD[2]]} ry={-1.2} s={1.1} /><Earbud3D p={[BD[0] + 1.2, 3.4, BD[2]]} ry={1.9} s={1.1} /></>}
    {others > 0 && <Keyboard3D p={[KB[0], 0, KB[2]]} />}
    <Dots a={PH} b={WT} f={f} col={clash > 0 && Math.floor(f / 8) % 2 ? BAD : WATC} on={watch} n={6} />
    <Dots a={PH} b={BD} f={f + 7} col={clash > 0 && Math.floor(f / 8) % 2 ? BAD : EARC} on={others} n={6} />
    <Dots a={PH} b={KB} f={f + 13} col={clash > 0 && Math.floor(f / 8) % 2 ? BAD : KBC} on={others} n={6} />
  </Scene3D>
);
const HookCam: [Cam, Cam] = [{ pos: [-10, 20, 48], look: [0, 4, 2], fov: 40 }, { pos: [8, 24, 46], look: [0, 4, 2], fov: 40 }];

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), w = at(f, 10), o = at(f, cues[2]), q = at(f, cues[3]);
  const cam = camLerp(HookCam[0], HookCam[1], f / len);
  const lab = (p: Vec, t: string, col: string, a: number, dy = 60) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={28} fontWeight={800} opacity={a}>{t}</text>; };
  const [px, py] = project(cam, [0, 13.5, 0]);
  return (
    <>
      <Stage cam={cam} f={f} watch={w} others={o} clash={q} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([WT[0], -1, WT[2] + 3], "워치", WATC, w, 30)}
        {lab([BD[0], 0, BD[2] + 3], "LE 오디오 이어폰", EARC, o, 30)}
        {lab(KB, "키보드", KBC, o, 90)}
        <g opacity={q}>
          <rect x={px - 110} y={py - 70} width={220} height={56} rx={28} fill={C.panel} stroke={DEEP} strokeWidth={3} />
          <text x={px} y={py - 32} textAnchor="middle" fill={DEEP} fontSize={26} fontWeight={900}>무선은 하나</text>
        </g>
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 한 번에 하나 (3D 시간 블록 + 지나가는 시간 커서) */
const One: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), skip = at(f, cues[1]), rule = at(f, cues[2]);
  const cam = camLerp({ pos: [-14, 22, 30], look: [-14, 0, 1], fov: 40 }, { pos: [-12, 24, 28], look: [-13, 0, 1], fov: 40 }, f / len);
  const tc = interpolate(f, [10, cues[1]], [-2, 8], clamp); // 시간 커서(ms)
  const sx = (t: number, row: string): [number, number] => project(cam, [t * S3 - (T3 * S3) / 2, 0, ROW[row]]);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 26, 10]} />
        <Blocks3D mix={0} redOn={skip} />
        <mesh position={[tc * S3 - (T3 * S3) / 2, 2.2, 0]}><boxGeometry args={[0.15, 4.4, 22]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} transparent opacity={0.55} /></mesh>
      </Scene3D>
      <Title kicker="심화 · 무선 하나, 일 여럿">한 순간에는 한 가지 일만</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {(["ear", "watch", "kb"] as const).map((k) => { const [x, y] = sx(-3, k); return <text key={k} x={x} y={y + 10} textAnchor="end" fill={COL[k]} fontSize={28} fontWeight={800}>{NAME[k]}</text>; })}
        {(() => { const [x, y] = sx(3, "ear"); return <text x={x} y={y - 70} textAnchor="middle" fill={DEEP} fontSize={26} fontWeight={900} opacity={skip}>같은 순간 → 하나만, 나머지 ✕</text>; })()}
        <Note x={400} y={820} w={1200} a={rule} col={DEEP} lines={[["스케줄러", "= 겹칠 때 무엇을 먼저 할지 고르는 컨트롤러의 부분. 사양은 고르는 법을 정하지 않는다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 건너뛰어도 되는 한계 */
const Limit: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 360, W = 1300;
  // 위: 워치. 이벤트 12개(도식), ✓ = 만남, ✕ = 건너뜀. 감독 타이머는 만날 때마다 0으로
  const ev = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0];
  const n = ev.length, TO = 6.5, ex = (i: number) => X0 + (i / n) * W;
  const reveal = interpolate(f, [cues[1], cues[2] - 10], [0, 7.9], clamp) + interpolate(f, [cues[2], cues[3] - 10], [0, n - 7.9], clamp);
  const timer = (pos: number) => { let last = 0; for (let i = 0; i <= Math.floor(pos) && i < n; i++) if (ev[i]) last = i; return pos - last; };
  const tv = Math.min(TO, timer(reveal)), dead = timer(reveal) >= TO;
  // 아래: 이어폰 소리 조각 10개, 4번째는 기한 안에 못 보냄
  const ear = at(f, cues[3]), drop = at(f, cues[4]), lost = 3, ePos = (i: number) => X0 + i * 130;
  return (
    <>
      <Title kicker="건너뛰어도 되는 한계">연결은 기다려 주지만, 소리는 기다려 주지 않는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, 0)}>
          <text x={X0 - 20} y={300} textAnchor="end" fill={WATC} fontSize={28} fontWeight={800}>워치</text>
          {ev.map((v, i) => i < reveal && (
            v ? <rect key={i} x={ex(i)} y={268} width={W / n - 18} height={48} rx={6} fill={WATC} />
              : <g key={i}><rect x={ex(i)} y={268} width={W / n - 18} height={48} rx={6} fill="none" stroke={BAD} strokeWidth={3} strokeDasharray="6 5" /><text x={ex(i) + (W / n - 18) / 2} y={302} textAnchor="middle" fill={BAD} fontSize={24} fontWeight={900}>✕</text></g>
          ))}
          <text x={X0 - 20} y={372} textAnchor="end" fill={C.dim} fontSize={22}>감독 타이머</text>
          <rect x={X0} y={350} width={(TO / n) * W} height={30} rx={8} fill="none" stroke={C.faint} strokeWidth={2} />
          <rect x={X0} y={350} width={(tv / n) * W} height={30} rx={8} fill={dead ? BAD : DEEP} opacity={0.8} />
          <text x={X0 + (TO / n) * W + 16} y={374} fill={C.dim} fontSize={22}>감독 타임아웃</text>
          {dead && <text x={X0 + (TO / n) * W + 16} y={420} fill={BAD} fontSize={30} fontWeight={900}>연결 끊김 (0x08)</text>}
        </g>
        <g opacity={ear}>
          <text x={X0 - 20} y={560} textAnchor="end" fill={EARC} fontSize={28} fontWeight={800}>이어폰 소리</text>
          {Array.from({ length: 10 }, (_, i) => {
            const miss = i === lost && drop > 0.3;
            return (
              <g key={i}>
                <rect x={ePos(i)} y={528} width={70} height={48} rx={6} fill={miss ? "none" : EARC} stroke={miss ? BAD : "none"} strokeWidth={3} strokeDasharray="6 5" />
                <line x1={ePos(i) + 112} x2={ePos(i) + 112} y1={514} y2={590} stroke={C.faint} strokeWidth={2} strokeDasharray="4 4" />
              </g>
            );
          })}
          <text x={ePos(lost) + 112} y={506} textAnchor="middle" fill={drop > 0.3 ? BAD : C.dim} fontSize={22} fontWeight={800}>기한</text>
          <path d={Array.from({ length: 260 }, (_, k) => { const x = X0 + k * 5, gap = drop > 0.3 && x > ePos(lost) && x < ePos(lost + 1); return `${k ? "L" : "M"}${x} ${660 + (gap ? 0 : Math.sin(k * 0.7) * 26 * Math.sin(k * 0.13))}`; }).join(" ")} stroke={EARC} strokeWidth={3} fill="none" />
          <text x={ePos(lost) + 35} y={720} textAnchor="middle" fill={BAD} fontSize={26} fontWeight={900} opacity={drop}>뚝 (조각을 버림)</text>
        </g>
        <Note x={X0} y={746} w={1300} a={at(f, cues[1])} col={DEEP} lines={ear > 0.5 ? [["감독 타임아웃", "= 이 시간 동안 패킷을 하나도 못 받으면 연결이 끊긴 것으로 본다"], ["기한", "= 소리 조각을 보낼 수 있는 마지막 시각(flush timeout). 지나면 버린다"]] : [["감독 타임아웃", "= 이 시간 동안 패킷을 하나도 못 받으면 연결이 끊긴 것으로 본다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 엇갈려 놓기 (3D 시간 지도) */
const S3 = 0.55, T3 = 90; // 1 ms = 0.55 단위, 0~90 ms
const ROW: Record<string, number> = { ear: -7, watch: 0, kb: 7 };
const CLASH_OFF: Record<string, number> = { ear: 0, watch: CLASH.watch + 0.5, kb: CLASH.kb + 0.5 }, STAG_OFF: Record<string, number> = STAGGER;
/** 거리낌 없이 겹친 배치(CLASH3)에서 엇갈린 배치(STAG)로 mix만큼 옮긴 블록들. 겹친 배치에서 건너뛴 회차는 빨강 */
const Blocks3D: React.FC<{ mix: number; redOn?: number }> = ({ mix, redOn = 1 }) => (
  <group position={[-(T3 * S3) / 2, 0, 0]}>
    {(["ear", "watch", "kb"] as const).flatMap((k) => {
      const P = k === "ear" ? EAR.period : CONN.period, d = k === "ear" ? EAR.dur : CONN.dur, mine = CLASH3.runs.filter((r) => r.task === k);
      return Array.from({ length: Math.ceil(T3 / P) }, (_, i) => {
        const t = i * P + CLASH_OFF[k] + (STAG_OFF[k] - CLASH_OFF[k]) * mix, bad = mix < 0.5 && redOn > 0.5 && mine[i] && !mine[i].ok;
        return (
          <mesh key={`${k}${i}`} position={[(t + d / 2) * S3, 0.9, ROW[k]]}>
            <boxGeometry args={[d * S3, 1.8, 4]} />
            <meshStandardMaterial color={bad ? BAD : COL[k]} emissive={bad ? BAD : COL[k]} emissiveIntensity={0.5} transparent opacity={bad ? 0.55 : 0.95} />
          </mesh>
        );
      });
    })}
    {[0, 30, 60, 90].map((t) => <mesh key={t} position={[t * S3, 0.05, 0]}><boxGeometry args={[0.12, 0.1, 22]} /><meshStandardMaterial color={C.faint} /></mesh>)}
  </group>
);
const Stagger: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), mix = interpolate(f, [30, cues[1] - 10], [0, 1], clamp), lab = at(f, cues[1]), rep = at(f, cues[2]), res = at(f, cues[3]);
  const cam = camLerp({ pos: [-14, 26, 40], look: [0, 0, 0], fov: 40 }, { pos: [0, 52, 14], look: [0, 0, 0], fov: 40 }, interpolate(f, [cues[2] - 20, cues[3]], [0, 1], clamp));
  const sx = (t: number, row: string): [number, number] => project(cam, [t * S3 - (T3 * S3) / 2, 0, ROW[row]]);
  const st = STAG.stats;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 26, 10]} />
        <Blocks3D mix={mix} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Title kicker="첫 번째 방법">약속 시각을 엇갈려 놓는다</Title>
        {(["ear", "watch", "kb"] as const).map((k) => { const [x, y] = sx(-3, k); return <text key={k} x={x} y={y + 10} textAnchor="end" fill={COL[k]} fontSize={28} fontWeight={800}>{NAME[k]}</text>; })}
        {[0, 30, 60, 90].map((t) => { const [x, y] = sx(t, "kb"); return <text key={t} x={x} y={y + 60} textAnchor="middle" fill={C.faint} fontSize={22}>{t} ms</text>; })}
        {(["ear", "watch", "kb"] as const).map((k) => { const [x, y] = sx(-3, k); return <text key={k} x={x} y={y + 44} textAnchor="end" fill={C.dim} fontSize={22} fontWeight={700} opacity={lab}>{k === "ear" ? "10 ms마다 2 ms" : "30 ms마다 4 ms"}</text>; })}
        <g opacity={rep}>
          {(() => { const [a, y] = sx(0, "ear"), [b] = sx(30, "ear"); return <><path d={`M${a} ${y - 90} H${b}`} stroke={DEEP} strokeWidth={4} /><text x={(a + b) / 2} y={y - 104} textAnchor="middle" fill={DEEP} fontSize={26} fontWeight={900}>30 ms마다 같은 배치</text></>; })()}
        </g>
        <g opacity={res} transform="translate(1340,760)">
          <rect x={0} y={0} width={480} height={120} rx={20} fill={C.panel} stroke={OK} strokeWidth={3} />
          <text x={30} y={50} fill={C.text} fontSize={26} fontWeight={800}>1초 동안 건너뜀</text>
          <text x={30} y={94} fill={OK} fontSize={30} fontWeight={900}>이어폰 {st.ear.skipped} · 워치 {st.watch.skipped} · 키보드 {st.kb.skipped}</text>
        </g>
        <text x={110} y={880} fill={C.dim} fontSize={22} opacity={lab}>예시 값 · 심화 3장의 스케줄러 예시 모델</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 오래 건너뛴 쪽 먼저 */
const Starve: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 420, W = 1060, T1 = 240;
  const top = at(f, cues[1]), bot = at(f, cues[3]);
  const sweep = (c: number) => interpolate(f, [c, c + 90], [0, T1], clamp);
  const panel = (y: number, a: number, title: string, R: typeof FIXED, c: number, verdict: React.ReactNode) => (
    <g opacity={a}>
      <text x={X0} y={y} fill={C.text} fontSize={28} fontWeight={900}>{title}</text>
      <Lane x={X0} y={y + 30} w={W} h={44} t0={0} t1={T1} runs={R.runs} task="watch" label="워치" upto={sweep(c)} />
      <Lane x={X0} y={y + 104} w={W} h={44} t0={0} t1={T1} runs={R.runs} task="kb" label="키보드" upto={sweep(c)} />
      <g transform={`translate(${X0 + W + 40},${y + 40})`}>{verdict}</g>
    </g>
  );
  return (
    <>
      <Title kicker="두 번째 방법">오래 건너뛴 쪽일수록 먼저</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {panel(290, top, "늘 워치 먼저 (고정 우선순위)", FIXED, cues[1], (
          <g opacity={at(f, cues[2])}>
            <text x={0} y={30} fill={BAD} fontSize={26} fontWeight={900}>키보드: 1초 동안</text>
            <text x={0} y={70} fill={BAD} fontSize={26} fontWeight={900}>{FIXED.stats.kb.skipped}번 모두 건너뜀</text>
          </g>
        ))}
        {panel(520, bot, "굶은 만큼 우선권을 올림", FAIR, cues[3], (
          <g opacity={at(f, cues[4])}>
            <text x={0} y={30} fill={OK} fontSize={26} fontWeight={900}>가장 긴 공백</text>
            <text x={0} y={70} fill={OK} fontSize={26} fontWeight={900}>워치 {FAIR.stats.watch.maxGap} · 키보드 {FAIR.stats.kb.maxGap} ms</text>
          </g>
        ))}
        <Axis x={X0} y={750} w={W} t0={0} t1={T1} step={60} a={top} />
        <Note x={X0} y={780} w={1300} a={top} col={DEEP} lines={[["예시 모델", "= 사양이 아니라, 사양의 제약을 지키는 한 가지 방식(심화 3장). 두 연결 모두 30 ms 간격, 1 ms 차이"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 시간이 모자라면 (3D: 7.5 ms 상자에 2.5 ms 블록 여섯) */
const Short: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), U = 1.6; // 1 ms = 1.6 단위
  const fill = interpolate(f, [cues[1], cues[1] + 80], [0, SHORT.n], clamp), half = at(f, cues[3]), fix = at(f, cues[4]);
  const cam = camLerp({ pos: [4, 13, 32], look: [12, 1, 0], fov: 40 }, { pos: [8, 15, 30], look: [13, 1, 0], fov: 40 }, f / len);
  const cols = [EARC, WATC, KBC, "#a78bfa", "#60a5fa", "#fb923c"], box = SHORT.period * U, grow = fix > 0.5 ? (20 - SHORT.period) * U * at(f, cues[4] + 10) : 0;
  const lab = (p: Vec, t: string, col: string, a: number, dy = 0, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 12]} />
        <mesh position={[(box + grow) / 2, 1.6, 0]}><boxGeometry args={[box + grow, 3.2, 4.2]} /><meshStandardMaterial color={DEEP} transparent opacity={0.1} depthWrite={false} /></mesh>
        {[[0, 1.6, 2.1], [0, 1.6, -2.1]].map(([_, y, z], i) => <mesh key={i} position={[(box + grow) / 2, y + 1.6, z]}><boxGeometry args={[box + grow, 0.1, 0.1]} /><meshStandardMaterial color={DEEP} emissive={DEEP} emissiveIntensity={1} /></mesh>)}
        {[0, box + grow].map((x, i) => <mesh key={"v" + i} position={[x, 1.6, 0]}><boxGeometry args={[0.12, 3.4, 4.3]} /><meshStandardMaterial color={DEEP} emissive={DEEP} emissiveIntensity={1} transparent opacity={0.7} /></mesh>)}
        {Array.from({ length: SHORT.n }, (_, i) => {
          const a = Math.max(0, Math.min(1, fill - i)), over = (i + 1) * SHORT.dur > SHORT.period && fix < 0.5;
          return a > 0 ? <mesh key={i} position={[(i + 0.5) * SHORT.dur * U, 1.4 * a, 0]} scale={[0.92, a, 1]}><boxGeometry args={[SHORT.dur * U, 2.8, 3.4]} /><meshStandardMaterial color={over ? BAD : cols[i]} emissive={over ? BAD : cols[i]} emissiveIntensity={0.35} transparent opacity={over ? 0.45 : 0.95} /></mesh> : null;
        })}
      </Scene3D>
      <Title kicker="그래도 시간이 모자라면">필요한 시간이 간격보다 길면</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([box / 2, 4.6, 0], fix > 0.5 ? "간격을 늘린 상자" : "연결 간격 7.5 ms", DEEP, at(f, 10), -10)}
        {lab([SHORT.n * SHORT.dur * U - 2, 3.4, 2], "2.5 ms × 6 = 15 ms", BAD, at(f, cues[2]), -40)}
        {lab([box / 2, 0, 3], "들어가는 건 많아야 3개", OK, half * (1 - fix), 60)}
        {lab([box * 1.5, 0, 3], "나머지 절반은 건너뜀", BAD, half * (1 - fix), 60)}
        {lab([box, 0, 3], "또는 한 번에 쓰는 시간을 줄인다", C.dim, fix, 100, 24)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 그래서 몇 개까지? */
const FIT_RUN = schedule([{ name: "ear", period: EAR.period, dur: EAR.dur, prio: 9, offset: 0 }, ...FIT.map((o, i) => ({ name: `c${i}`, period: CONN.period, dur: CONN.dur, prio: 8 - i, offset: o }))], 1000, "fixed");
const Count: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), spec = at(f, cues[1]), sum = at(f, cues[2]), ex = interpolate(f, [cues[3], cues[3] + 70], [0, FIT.length + 2], clamp), real = at(f, cues[4]);
  const X0 = 360, W = 1200, U = (p: number) => (p / 100) * W, earU = (EAR.dur / EAR.period) * 100, cU = (CONN.dur / CONN.period) * 100;
  const segCol = (i: number) => (i % 2 ? KBC : WATC);
  const box = (x: number, title: string, body: string, col: string) => (
    <g transform={`translate(${x},230)`}>
      <rect x={0} y={0} width={580} height={120} rx={20} fill={C.panel} stroke={col} strokeWidth={3} />
      <text x={30} y={50} fill={col} fontSize={30} fontWeight={900}>{title}</text>
      <text x={30} y={92} fill={C.text} fontSize={24} fontWeight={700}>{body}</text>
    </g>
  );
  const TX = (t: number) => X0 + (t / CONN.period) * W;
  return (
    <>
      <Title kicker="그래서 몇 개까지?">개수가 아니라 시간이 상한</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={spec}>
          {box(X0, "Classic", "한 피코넷에 활성 기기 7대까지", C.dim)}
          {box(X0 + 620, "LE", "사양에 정해진 개수 없음", DEEP)}
        </g>
        <g opacity={sum}>
          <text x={X0} y={418} fill={C.text} fontSize={26} fontWeight={800}>간격 중 쓰는 시간의 합</text>
          <rect x={X0} y={436} width={W} height={70} rx={10} fill="none" stroke={C.text} strokeWidth={3} />
          <text x={X0 + W} y={418} textAnchor="end" fill={C.text} fontSize={24} fontWeight={800}>100%</text>
          {ex > 0 && <rect x={X0} y={436} width={U(earU)} height={70} rx={8} fill={EARC} />}
          {ex > 0 && <text x={X0 + U(earU) / 2} y={480} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>이어폰 20%</text>}
          {Array.from({ length: FIT.length + 1 }, (_, i) => {
            const a = Math.max(0, Math.min(1, ex - 1 - i)), x = X0 + U(earU + i * cU), over = i >= FIT.length;
            return (
              <g key={i} opacity={a}>
                <rect x={x + 2} y={over ? 440 : 438} width={U(cU) - 4} height={over ? 62 : 66} rx={8} fill={over ? "none" : segCol(i)} stroke={over ? BAD : "none"} strokeWidth={3} strokeDasharray="8 6" />
                <text x={x + U(cU) / 2} y={480} textAnchor="middle" fill={over ? BAD : C.bg} fontSize={22} fontWeight={900}>{over ? "✕ 7번째" : `${i + 1}`}</text>
              </g>
            );
          })}
          <text x={X0} y={548} fill={C.dim} fontSize={22} opacity={at(f, cues[3])}>이어폰 2 ÷ 10 = 20% · 연결 하나 4 ÷ 30 ≈ 13% · 20% + 6 × 13.3% = 100%</text>
        </g>
        <g opacity={at(f, cues[3] + 40)}>
          <text x={X0 - 20} y={640} textAnchor="end" fill={C.text} fontSize={26} fontWeight={800}>30 ms</text>
          {FIT_RUN.runs.filter((r) => r.t < CONN.period).map((r, i) => (
            <rect key={i} x={TX(r.t) + 1} y={604} width={TX(r.t + r.dur) - TX(r.t) - 2} height={56} rx={6} fill={r.task === "ear" ? EARC : segCol(Number(r.task.slice(1)))} />
          ))}
          {[0, 10, 20, 30].map((t) => <text key={t} x={TX(t)} y={694} textAnchor="middle" fill={C.faint} fontSize={20}>{t} ms</text>)}
          <text x={X0 + W + 20} y={640} fill={OK} fontSize={24} fontWeight={900}>빈틈 없음</text>
        </g>
        <Note x={X0} y={730} w={1200} a={real} col={DEEP} lines={[["실제로는", "광고·스캔에 쓸 시간을 남긴다. 몇 개까지 받을지는 칩(컨트롤러 구현)마다 다르다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 8. 정리 (3D 위에 정리 문장) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(HookCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["무선은 하나", "한 번에 한 약속만"], ["엇갈려 놓고, 굶은 쪽 먼저", "감독 타임아웃 안에 한 번은"], ["소리는 기한이 있다", "놓치면 바로 끊긴다"], ["다 연결해도 된다", "만나는 시간이 간격 안에 들어오면"]];
  return (
    <>
      <Stage cam={cam} f={f} watch={1} others={1} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${200 + i * 150})`}>
            <rect x={0} y={0} width={900} height={120} rx={22} fill={C.panel} stroke={i === 3 ? OK : DEEP} strokeWidth={3} opacity={0.95} />
            <text x={36} y={56} fill={C.text} fontSize={34} fontWeight={900}>{k}</text>
            <text x={36} y={98} fill={C.dim} fontSize={26} fontWeight={700}>{v}</text>
          </g>
        ))}
      </svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "one": return <One cues={s.cues} len={s.frames} />;
    case "limit": return <Limit cues={s.cues} />;
    case "stagger": return <Stagger cues={s.cues} len={s.frames} />;
    case "starve": return <Starve cues={s.cues} />;
    case "short": return <Short cues={s.cues} len={s.frames} />;
    case "count": return <Count cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Scheduling = makeVideo("scheduling", scenesFor, LEAD, body);
export { Stage as SchedStage, HookCam as SchedCam };
