import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { instantRisk } from "../book";
import { camLerp, type Cam } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { DEEP, Note, makeVideo } from "../common/kit";
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

/* ---------------------------------------------------------------- 2. "지금 바로"는 안 된다 */
const Now: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 360, PX = 5.2, W = 26; // 1 ms = 5.2 px, 0~260 ms
  const lost = at(f, cues[1]), split = at(f, cues[2]), dead = at(f, cues[3]);
  const X = (t: number) => X0 + t * PX;
  const old = [0, 30, 60, 90, 120, 150, 180, 210, 240], ph = [0, 30, 80, 130, 180, 230], wt = old;
  const tSplit = 30 + interpolate(f, [cues[2], cues[3]], [0, 230], clamp);
  return (
    <>
      <Title kicker="“지금 바로 바꾸자”라면">한쪽만 먼저 바꾸면 만나지 못한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <RowLabel y={330} col={PH}>휴대폰</RowLabel>
        <RowLabel y={470} col={WT}>워치</RowLabel>
        {ph.map((t, i) => (i < 2 || t <= tSplit) && <Ev key={i} x={X(t)} y={330} w={W} col={i < 2 ? PH : NEW} state={i < 2 ? "ok" : "alone"} a={i < 2 ? 1 : split} />)}
        {wt.map((t, i) => (i < 2 || t <= tSplit) && <Ev key={i} x={X(t)} y={470} w={W} col={WT} state={i < 2 ? "ok" : "alone"} a={i < 2 ? 1 : split} />)}
        <g opacity={at(f, 10)}>
          <path d={`M${X(30) + W / 2} 384 L${X(30) + W / 2 + 30} 452`} stroke={PH} strokeWidth={4} strokeDasharray="8 6" />
          <rect x={X(30) - 30} y={250} width={260} height={56} rx={14} fill={C.panel} stroke={PH} strokeWidth={3} />
          <text x={X(30) + 100} y={287} textAnchor="middle" fill={C.text} fontSize={24} fontWeight={800}>“지금부터 60 ms!”</text>
        </g>
        <text x={X(30) + W / 2 + 40} y={444} fill={BAD} fontSize={36} fontWeight={900} opacity={lost}>✕ 못 들음</text>
        <g opacity={split}>
          <text x={X(255)} y={366} fill={NEW} fontSize={22} fontWeight={800}>60 ms로 바꿈</text>
          <text x={X(255)} y={506} fill={WT} fontSize={22} fontWeight={800}>30 ms 그대로</text>
        </g>
        <g opacity={dead}>
          <rect x={X0} y={580} width={W * 0 + 230 * PX} height={30} rx={8} fill={BAD} opacity={0.8} />
          <text x={X0} y={570} fill={C.dim} fontSize={22}>감독 타이머: 한 번도 못 만남</text>
          <text x={X0 + 230 * PX + 20} y={604} fill={BAD} fontSize={30} fontWeight={900}>끊김 (0x08)</text>
        </g>
        <Note x={X0} y={680} w={1300} a={split} col={NEW} lines={[["혼자 기다림", "= 점선 칸. 상대가 오지 않는 시각에 깨어 듣고 있다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. instant: 미래의 만남 번호 */
const InstantScene: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 360, CW = 128, W = 110, I = NOW + 6;
  const count = at(f, cues[1]), msg = at(f, cues[2]), sw = at(f, cues[3]);
  const shown = interpolate(f, [cues[1], cues[3]], [3, 6], clamp) + interpolate(f, [cues[3], cues[3] + 60], [0, 3], clamp);
  const cell = (k: number) => X0 + (k < 6 ? k * CW : 6 * CW + (k - 6) * CW * 2); // instant부터 간격 두 배
  const watchState = (k: number) => (k === 0 ? "miss" : k === 3 ? "skip" : "ok") as "ok" | "miss" | "skip";
  return (
    <>
      <Title kicker="instant">“몇 번째 만남부터”로 약속한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <RowLabel y={330} col={PH}>휴대폰</RowLabel>
        <RowLabel y={450} col={WT}>워치</RowLabel>
        {Array.from({ length: 9 }, (_, k) => k < shown && (
          <g key={k}>
            <Ev x={cell(k)} y={330} w={W} n={NOW + k} col={k >= 6 ? NEW : PH} state={k === 3 ? "skip" : "ok"} />
            <Ev x={cell(k)} y={450} w={W} n={NOW + k} col={k >= 6 ? NEW : WT} state={watchState(k)} />
          </g>
        ))}
        <g opacity={count}>
          <text x={cell(3) + W / 2} y={548} textAnchor="middle" fill={BAD} fontSize={22} fontWeight={800}>건너뛰어도</text>
          <text x={cell(3) + W / 2} y={576} textAnchor="middle" fill={BAD} fontSize={22} fontWeight={800}>번호는 센다</text>
        </g>
        <g opacity={msg}>
          <rect x={cell(0)} y={240} width={360} height={56} rx={14} fill={C.panel} stroke={NEW} strokeWidth={3} />
          <text x={cell(0) + 180} y={277} textAnchor="middle" fill={C.text} fontSize={24} fontWeight={800}>“{I}번째 만남부터 60 ms”</text>
          <text x={cell(1) + W / 2} y={548} textAnchor="middle" fill={OK} fontSize={22} fontWeight={800}>다시 보내 받음</text>
        </g>
        <g opacity={sw}>
          <line x1={cell(6) - 9} x2={cell(6) - 9} y1={230} y2={530} stroke={NEW} strokeWidth={5} />
          <text x={cell(6) - 9} y={218} textAnchor="middle" fill={NEW} fontSize={28} fontWeight={900}>{I}번: 함께 바꿈</text>
        </g>
        <Note x={X0} y={640} w={1300} a={count} col={NEW} lines={[["instant", "= 새 값을 쓰기 시작할 만남 번호(connEventCounter). 휴대폰(센트럴)이 고른다"], ["만남 번호", "= 두 기기가 함께 세는 16비트 번호. 건너뛴 만남도 센다(심화 1편)"]]} />
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
    case "now": return <Now cues={s.cues} />;
    case "instant": return <InstantScene cues={s.cues} />;
    case "far": return <Far cues={s.cues} />;
    case "odds": return <Odds cues={s.cues} />;
    case "anchor": return <Anchor cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Instant = makeVideo("instant", scenesFor, LEAD, body);
export { Hook as InstantHook };
