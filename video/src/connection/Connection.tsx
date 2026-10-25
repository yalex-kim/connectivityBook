import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { CH_ID, csa2Channel, dataChFreq } from "../book";
import { Scene3D, camLerp, type Vec } from "../afh/world3d";
import { Caption, Title, clamp, fade, useFont } from "../afh/parts";
import { CL, LE, at, Chip } from "../twokinds/TwoKinds";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰(센트럴) = 파랑, 워치(페리페럴) = 청록, 잠 = 흐림 */
const PH = LE, WT = CL, OK = C.ok, BAD = C.bad;
const ALL37 = Array(37).fill(true);
const chAt = (e: number) => csa2Channel(e, CH_ID, ALL37);

/* ---------------------------------------------------------------- 1. 훅 (3D): 하루 종일 연결된 휴대폰과 워치 */
const P_POS: Vec = [-12, 0, 0], W_POS: Vec = [12, 0, 0];
export const Phone3D: React.FC = () => (
  <group position={[P_POS[0], 6.2, 0]} rotation={[-0.1, 0.35, 0]}>
    <mesh>
      <boxGeometry args={[6, 12, 0.7]} />
      <meshStandardMaterial color="#d9e2f0" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.36]}>
      <boxGeometry args={[5.4, 11.2, 0.02]} />
      <meshStandardMaterial color={PH} emissive={PH} emissiveIntensity={0.55} />
    </mesh>
  </group>
);
export const Watch3D: React.FC = () => (
  <group position={[W_POS[0], 3.2, 0]} rotation={[-0.25, -0.35, 0]}>
    <mesh position={[0, 0, -0.5]}>
      <boxGeometry args={[2.6, 9, 0.5]} />
      <meshStandardMaterial color="#24324a" roughness={0.7} />
    </mesh>
    <mesh>
      <boxGeometry args={[4.2, 4.8, 1.2]} />
      <meshStandardMaterial color="#c9d3e3" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.62]}>
      <boxGeometry args={[3.6, 4.2, 0.02]} />
      <meshStandardMaterial color={WT} emissive={WT} emissiveIntensity={0.6} />
    </mesh>
  </group>
);
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), myth = at(f, cues[2]);
  const cam = camLerp({ pos: [-10, 14, 44], look: [0, 5, 0], fov: 40 }, { pos: [10, 18, 40], look: [0, 5, 0], fov: 40 }, f / len);
  const a: Vec = [P_POS[0] + 3, 7, 0], b: Vec = [W_POS[0] - 2.5, 4, 0];
  const dots = 12;
  const hours = interpolate(f, [cues[1], len], [8, 32], clamp); // 시계: 하루가 빠르게 흐른다
  return (
    <>
      <Scene3D cam={cam}>
        <fog attach="fog" args={[C.bg, 60, 160]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#0d1729" />
        </mesh>
        <gridHelper args={[200, 100, "#24395a", "#172640"]} />
        <pointLight position={[0, 20, 16]} intensity={220} color="#9cc8ff" distance={70} />
        <Phone3D />
        <Watch3D />
        {myth > 0 &&
          Array.from({ length: dots }, (_, i) => {
            const t = (f * 0.03 + i / dots) % 1;
            return (
              <mesh key={i} position={[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * 2, 0]}>
                <sphereGeometry args={[0.38, 12, 10]} />
                <meshStandardMaterial color={C.warn} emissive={C.warn} emissiveIntensity={1.3} transparent opacity={myth} />
              </mesh>
            );
          })}
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, cues[1])} transform="translate(960,250)">
          <circle r={84} fill={C.panel} stroke={C.text} strokeWidth={5} />
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1={0} y1={-70} x2={0} y2={-60} stroke={C.dim} strokeWidth={4} transform={`rotate(${i * 30})`} />)}
          <line x1={0} y1={0} x2={0} y2={-42} stroke={C.text} strokeWidth={7} strokeLinecap="round" transform={`rotate(${(hours % 12) * 30})`} />
          <line x1={0} y1={0} x2={0} y2={-64} stroke={C.accent} strokeWidth={4} strokeLinecap="round" transform={`rotate(${(hours % 1) * 360})`} />
          <text x={0} y={128} textAnchor="middle" fill={C.dim} fontSize={28} fontWeight={700}>하루 종일 “연결됨”</text>
        </g>
        <text x={960} y={560} textAnchor="middle" fill={C.warn} fontSize={130} fontWeight={900} opacity={myth}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 시간축 도우미 */
const TX = 260, TW = 1460;
const Row: React.FC<{ y: number; label: string; col: string; sub?: string }> = ({ y, label, col, sub }) => (
  <g fontFamily={FONT}>
    <text x={TX - 24} y={y + 9} textAnchor="end" fill={col} fontSize={28} fontWeight={800}>{label}</text>
    {sub && <text x={TX - 24} y={y + 40} textAnchor="end" fill={C.faint} fontSize={20}>{sub}</text>}
    <line x1={TX} x2={TX + TW} y1={y} y2={y} stroke={C.faint} strokeWidth={2} />
  </g>
);
const Zz: React.FC<{ x: number; y: number; a?: number }> = ({ x, y, a = 1 }) => <text x={x} y={y} textAnchor="middle" fill={C.faint} fontFamily={FONT} fontSize={24} fontWeight={800} opacity={a}>z z</text>;

/* ---------------------------------------------------------------- 2. 연결 = 시간 약속 */
const Appoint: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), SPAN = 220, X = (ms: number) => TX + (ms / SPAN) * TW;
  const shown = interpolate(f, [cues[0] + 10, cues[1]], [0, SPAN], clamp), zoom = at(f, cues[1]), sleep = at(f, cues[2]), ival = at(f, cues[3]);
  const ev = [10, 60, 110, 160, 210];
  return (
    <>
      <Title kicker="연결의 정체">끊기지 않는 선이 아니라, 시간 약속</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Row y={330} label="휴대폰" col={PH} />
        <Row y={420} label="워치" col={WT} />
        {ev.filter((t) => t <= shown).map((t, i) => (
          <g key={t}>
            <rect x={X(t)} y={300} width={8} height={30} rx={2} fill={PH} />
            <rect x={X(t) + 4} y={390} width={8} height={30} rx={2} fill={WT} />
            {i < ev.length - 1 && ev[i + 1] <= shown && <Zz x={(X(t) + X(ev[i + 1])) / 2} y={385} a={0.4 + 0.6 * sleep} />}
          </g>
        ))}
        <g opacity={ival}>
          <path d={`M${X(60)} 270 V256 H${X(110)} V270`} fill="none" stroke={C.text} strokeWidth={4} />
          <text x={(X(60) + X(110)) / 2} y={242} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900}>연결 간격 50 ms</text>
        </g>
        <text x={TX} y={480} fill={C.faint} fontSize={22}>시간 → (0 ~ 220 ms, 막대 폭은 보이도록 키웠다)</text>
        <g opacity={zoom}>
          <path d={`M${X(60)} 432 L560 560 M${X(60) + 12} 432 L1360 560`} stroke={C.faint} strokeWidth={2} strokeDasharray="6 6" />
          <rect x={560} y={560} width={800} height={190} rx={20} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={590} y={604} fill={C.text} fontSize={26} fontWeight={800}>약속 한 번 (확대): 1 ms도 안 걸린다</text>
          {/* 빈 PDU 80 µs → 150 µs → 80 µs, 1 µs = 2 px */}
          <rect x={620} y={630} width={160} height={36} rx={6} fill={PH} />
          <text x={700} y={656} textAnchor="middle" fill={C.bg} fontSize={20} fontWeight={800}>휴대폰 80 µs</text>
          <rect x={1080} y={680} width={160} height={36} rx={6} fill={WT} />
          <text x={1160} y={706} textAnchor="middle" fill={C.bg} fontSize={20} fontWeight={800}>워치 80 µs</text>
          <path d={`M780 700 H1080`} stroke={C.dim} strokeWidth={3} strokeDasharray="8 6" />
          <text x={930} y={690} textAnchor="middle" fill={C.dim} fontSize={22}>150 µs</text>
          <text x={590} y={740} fill={C.faint} fontSize={20}>빈 패킷만 주고받으면 약 0.3 ms</text>
        </g>
        <g opacity={sleep}>
          <text x={110} y={830} fill={C.text} fontSize={28} fontWeight={800}>50 ms 가운데</text>
          <rect x={330} y={800} width={1380} height={44} rx={10} fill="#1b2840" />
          <rect x={330} y={800} width={1380 * 0.02} height={44} rx={6} fill={C.warn} />
          <text x={380} y={832} fill={C.warn} fontSize={24} fontWeight={800}>깨어 있음 &lt; 1 ms (2% 미만)</text>
          <text x={1690} y={832} textAnchor="end" fill={C.dim} fontSize={24} fontWeight={800}>무선부 끄고 잠: 98% 넘게</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 약속 한 번의 안 */
const Event: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), US = 1.45, X0 = 300, X = (us: number) => X0 + us * US;
  const c1 = at(f, cues[0] + 10), p1 = at(f, cues[1]), more = at(f, cues[2]), next = at(f, cues[3]);
  const PK = 80;
  const pk = (t: number, row: "c" | "p", a: number, label: string) => (
    <g opacity={a}>
      <rect x={X(t)} y={row === "c" ? 300 : 430} width={PK * US} height={56} rx={8} fill={row === "c" ? PH : WT} />
      <text x={X(t) + (PK * US) / 2} y={row === "c" ? 336 : 466} textAnchor="middle" fill={C.bg} fontSize={20} fontWeight={800}>{label}</text>
    </g>
  );
  const e0 = 57, ch0 = chAt(e0), ch1 = chAt(e0 + 1);
  const bandX = (c: number) => 360 + ((dataChFreq(c) - 2402) / 78) * 1200;
  return (
    <>
      <Title kicker="약속 한 번의 안">휴대폰이 먼저, 워치는 150 µs 뒤</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={X0 - 30} y={337} textAnchor="end" fill={PH} fontSize={28} fontWeight={800}>휴대폰</text>
        <text x={X0 - 30} y={467} textAnchor="end" fill={WT} fontSize={28} fontWeight={800}>워치</text>
        <line x1={X0} x2={1800} y1={328} y2={328} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={1800} y1={458} y2={458} stroke={C.faint} strokeWidth={2} />
        <g opacity={c1}><text x={X0} y={270} fill={C.text} fontSize={26} fontWeight={800}>⚓ 약속 시각</text></g>
        {pk(0, "c", c1, "데이터")}
        <g opacity={p1}>
          <path d={`M${X(PK)} 400 H${X(PK + 150)}`} stroke={C.text} strokeWidth={3} />
          <text x={X(PK + 75)} y={392} textAnchor="middle" fill={C.text} fontSize={24} fontWeight={800}>150 µs</text>
        </g>
        {pk(PK + 150, "p", p1, "대답")}
        {pk(2 * PK + 300, "c", more, "더 있음")}
        {pk(3 * PK + 450, "p", more, "대답")}
        <g opacity={more}>
          <rect x={X(4 * PK + 480)} y={290} width={1800 - X(4 * PK + 480)} height={200} rx={14} fill="#0e1626" opacity={0.7} />
          <text x={(X(4 * PK + 480) + 1800) / 2} y={400} textAnchor="middle" fill={C.faint} fontSize={34} fontWeight={800}>z z  다음 약속까지 잠</text>
        </g>
        <text x={X0} y={540} fill={C.faint} fontSize={22}>시간 → (µs, 빈 패킷 80 µs 기준으로 그림)</text>
        <g opacity={next}>
          <text x={360} y={640} fill={C.text} fontSize={26} fontWeight={800}>2.4 GHz 대역의 범용 채널 37개</text>
          {Array.from({ length: 37 }, (_, c) => (
            <rect key={c} x={bandX(c) - 10} y={670} width={20} height={70} rx={4} fill={c === ch0 ? PH : c === ch1 ? WT : "#2a3b58"} />
          ))}
          <path d={`M${bandX(ch0)} 760 C ${bandX(ch0)} 820, ${bandX(ch1)} 820, ${bandX(ch1)} 760`} fill="none" stroke={C.text} strokeWidth={3} />
          <text x={bandX(ch0)} y={660 - 10} textAnchor="middle" fill={PH} fontSize={22} fontWeight={800}>이번 ch {ch0}</text>
          <text x={bandX(ch1)} y={660 - 10} textAnchor="middle" fill={WT} fontSize={22} fontWeight={800}>다음 ch {ch1}</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 얼마나 자주 */
const Often: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), SPAN = 300, X = (ms: number) => TX + (ms / SPAN) * TW;
  const shown = interpolate(f, [10, cues[1]], [0, SPAN], clamp), press = at(f, cues[2]), cnt = at(f, cues[3]);
  const rows: [string, number, number, string][] = [["7.5 ms 간격", 7.5, 330, C.warn], ["100 ms 간격", 100, 560, PH]];
  const PRESS = 112;
  return (
    <>
      <Title kicker="반응 속도 ↔ 배터리">자주 만날까, 드물게 만날까</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {rows.map(([name, iv, y, col]) => {
          const ticks: number[] = []; for (let t = 4; t <= shown; t += iv) ticks.push(t);
          const arrive = Math.ceil((PRESS - 4) / iv) * iv + 4;
          return (
            <g key={name}>
              <Row y={y} label={name} col={col} />
              {ticks.map((t) => <rect key={t} x={X(t)} y={y - 34} width={6} height={34} rx={2} fill={col} />)}
              <g opacity={press}>
                <circle cx={X(PRESS)} cy={y + 40} r={14} fill={C.text} />
                <text x={X(PRESS)} y={y + 86} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={700}>버튼</text>
                <path d={`M${X(PRESS)} ${y + 20} H${X(arrive)} V${y - 40}`} fill="none" stroke={OK} strokeWidth={4} />
                <text x={iv > 50 ? (X(PRESS) + X(arrive)) / 2 : X(arrive) + 24} y={y + 52} textAnchor={iv > 50 ? "middle" : "start"} fill={OK} fontSize={24} fontWeight={800}>{(arrive - PRESS).toFixed(1).replace(/\.0$/, "")} ms 뒤 전달</text>
              </g>
              <g opacity={cnt}>
                <text x={TX + TW} y={y - 52} textAnchor="end" fill={col} fontSize={30} fontWeight={900}>1초에 {Math.floor(1000 / iv)}번 깨어남</text>
              </g>
            </g>
          );
        })}
        <text x={TX} y={720} fill={C.faint} fontSize={22}>시간 → (0 ~ 300 ms). 버튼을 누른 뒤 다음 약속에서 전달된다.</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 건너뛰기: 페리페럴 지연 */
const Latency: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), SPAN = 620, X = (ms: number) => TX + (ms / SPAN) * TW, IV = 50;
  const skip = at(f, cues[0] + 10), every5 = at(f, cues[1]), btn = at(f, cues[2]), cmd = at(f, cues[3]);
  const events = Array.from({ length: 12 }, (_, i) => 10 + i * IV);
  // 워치가 깨는 약속: 0번, 버튼 뒤 3번(160 ms), 그 뒤 지연 4를 다 쓰고 8번(410 ms)
  const BTN = 128, CMD = 280;
  const wakes = new Set([0, ...(btn > 0 ? [3] : [5]), btn > 0 ? 8 : 10]);
  const cmdArrive = 10 + 8 * IV;
  return (
    <>
      <Title kicker="쉬어도 되는 횟수">할 말이 없으면 약속을 건너뛴다 (페리페럴 지연)</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Row y={330} label="휴대폰" col={PH} sub="약속마다 기다림" />
        <Row y={500} label="워치" col={WT} sub="지연 4" />
        {events.map((t, i) => {
          const w = wakes.has(i);
          return (
            <g key={t}>
              <rect x={X(t)} y={296} width={14} height={34} rx={3} fill={PH} />
              <rect x={X(t)} y={466} width={14} height={34} rx={3} fill={WT} opacity={w ? 1 : 1 - 0.8 * skip} />
              {!w && skip > 0.5 && <text x={X(t) + 7} y={456} textAnchor="middle" fill={C.faint} fontSize={18}>건너뜀</text>}
            </g>
          );
        })}
        <g opacity={every5 * (1 - btn)}>
          <path d={`M${X(10)} 540 V556 H${X(10 + 5 * IV)} V540`} fill="none" stroke={WT} strokeWidth={4} />
          <text x={X(10 + 2.5 * IV)} y={590} textAnchor="middle" fill={WT} fontSize={28} fontWeight={900}>5번에 1번만 깨어남</text>
        </g>
        <g opacity={btn}>
          <circle cx={X(BTN)} cy={560} r={14} fill={OK} />
          <text x={X(BTN)} y={606} textAnchor="middle" fill={OK} fontSize={22} fontWeight={800}>워치 버튼</text>
          <path d={`M${X(BTN)} 545 V520 H${X(10 + 3 * IV) + 7} V340`} fill="none" stroke={OK} strokeWidth={4} />
          <text x={X(10 + 3 * IV) + 20} y={420} fill={OK} fontSize={24} fontWeight={800}>바로 다음 약속에 전달</text>
        </g>
        <g opacity={cmd}>
          <circle cx={X(CMD)} cy={250} r={14} fill={C.warn} />
          <text x={X(CMD)} y={226} textAnchor="middle" fill={C.warn} fontSize={22} fontWeight={800}>휴대폰 명령</text>
          <path d={`M${X(CMD)} 264 V280 H${X(cmdArrive) + 7} V470`} fill="none" stroke={C.warn} strokeWidth={4} strokeDasharray="10 8" />
          <text x={(X(CMD) + X(cmdArrive)) / 2} y={272} textAnchor="middle" fill={C.warn} fontSize={22} fontWeight={800}>워치가 깨어날 때까지 대기</text>
        </g>
        <text x={TX} y={680} fill={C.faint} fontSize={22}>시간 → (간격 50 ms, 0 ~ 620 ms). 진한 칸 = 깨어나 주고받음, 흐린 칸 = 건너뜀.</text>
        <g opacity={cmd}>
          <rect x={TX} y={720} width={1100} height={110} rx={18} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={TX + 30} y={764} fill={WT} fontSize={26} fontWeight={800}>워치 → 휴대폰: 최대 50 ms (간격 1번)</text>
          <text x={TX + 30} y={806} fill={C.warn} fontSize={26} fontWeight={800}>휴대폰 → 워치: 최대 (4 + 1) × 50 ms = 250 ms</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 깨지면? */
const Lost: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), s0 = at(f, cues[0] + 10), bit = at(f, cues[1]), re = at(f, cues[2]), sto = at(f, cues[3]), rule = at(f, cues[4]);
  const e0 = 120, chA = chAt(e0), chB = chAt(e0 + 1);
  const pkt = (x: number, y: number, col: string, top: string, sub: string, a: number, bad = 0) => (
    <g opacity={a}>
      <rect x={x} y={y} width={200} height={64} rx={10} fill={col} />
      <text x={x + 100} y={y + 28} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>{top}</text>
      <text x={x + 100} y={y + 54} textAnchor="middle" fill={C.bg} fontSize={18} fontWeight={700}>{sub}</text>
      {bad > 0 && (
        <g opacity={bad}>
          <circle cx={x + 196} cy={y + 2} r={24} fill={BAD} />
          <path d={`M${x + 186} ${y - 8} l20 20 M${x + 206} ${y - 8} l-20 20`} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <text x={x + 230} y={y + 10} fill={BAD} fontSize={24} fontWeight={800}>깨짐</text>
        </g>
      )}
    </g>
  );
  const fill = interpolate(f, [cues[3] + 10, cues[4] - 10], [0, 1], clamp);
  return (
    <>
      <Title kicker="자다가 놓치면?">한 비트로 확인하고, 다음 약속에 다시</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={1 - sto}>
          <text x={220} y={300} fill={C.dim} fontSize={24} fontWeight={700}>약속 ① · ch {chA}</text>
          <text x={1000} y={300} fill={C.dim} fontSize={24} fontWeight={700} opacity={re}>약속 ② · ch {chB}</text>
          <text x={200} y={365} textAnchor="end" fill={PH} fontSize={26} fontWeight={800}>휴대폰</text>
          <text x={200} y={505} textAnchor="end" fill={WT} fontSize={26} fontWeight={800}>워치</text>
          {pkt(220, 330, PH, "메시지 A", "SN 0", s0, s0)}
          {pkt(470, 470, WT, "대답", "NESN 0 (그대로)", bit)}
          <g opacity={bit}>
            <rect x={462} y={462} width={216} height={80} rx={14} fill="none" stroke={C.warn} strokeWidth={4} />
            <text x={570} y={590} textAnchor="middle" fill={C.warn} fontSize={22} fontWeight={800}>“A를 아직 못 받았어”</text>
          </g>
          {pkt(1000, 330, PH, "메시지 A (다시)", "SN 0", re)}
          {pkt(1250, 470, WT, "대답", "NESN 1 (뒤집힘)", re)}
          <text x={1350} y={590} textAnchor="middle" fill={OK} fontSize={24} fontWeight={800} opacity={re}>✓ 받음 → 다음 메시지로</text>
          <path d="M760 400 H960 M940 386 L962 400 L940 414" stroke={C.faint} strokeWidth={4} fill="none" opacity={re} />
          {/* SN·NESN 설명 상자: 패킷 머리(헤더)의 1비트 두 개. [Vol 6] Part B §4.5.9 */}
          <g opacity={bit}>
            <rect x={220} y={640} width={1480} height={190} rx={20} fill={C.panel} stroke={C.warn} strokeWidth={3} />
            <text x={250} y={690} fill={C.text} fontSize={28} fontWeight={800}><tspan fill={PH}>SN</tspan> = 이 패킷의 번호. 새 패킷을 보낼 때마다 0 ↔ 1로 바꾼다</text>
            <text x={250} y={740} fill={C.text} fontSize={28} fontWeight={800}><tspan fill={C.warn}>NESN</tspan> = 다음에 받고 싶은 번호. 잘 받으면 뒤집어서 대답에 싣는다</text>
            <text x={250} y={790} fill={C.dim} fontSize={26} fontWeight={700}>대답의 NESN이 뒤집혀 오면 <tspan fill={OK}>“받았다”</tspan> → 다음 패킷 · 그대로면 <tspan fill={BAD}>“못 받았다”</tspan> → 같은 패킷을 다시</text>
          </g>
        </g>
        <g opacity={sto}>
          <text x={220} y={320} fill={C.text} fontSize={28} fontWeight={800}>아무것도 받지 못한 시간</text>
          <rect x={220} y={350} width={1400} height={56} rx={12} fill="#1b2840" />
          <rect x={220} y={350} width={1400 * fill} height={56} rx={12} fill={fill > 0.999 ? BAD : C.warn} />
          <text x={1630} y={390} fill={C.text} fontSize={26} fontWeight={800}>감독 타임아웃 (예: 2 s)</text>
          {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${260 + i * 140} 440 l24 24 M${284 + i * 140} 440 l-24 24`} stroke={BAD} strokeWidth={5} opacity={fill * 10 > i ? 0.8 : 0} />)}
          <text x={220} y={510} fill={C.dim} fontSize={22}>약속마다 패킷을 하나도 못 받으면 ✕</text>
          <text x={920} y={590} textAnchor="middle" fill={BAD} fontSize={40} fontWeight={900} opacity={fill > 0.999 ? 1 : 0}>연결 끊김</text>
        </g>
        <g opacity={rule}>
          <rect x={220} y={660} width={1400} height={130} rx={20} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={250} y={710} fill={C.text} fontSize={28} fontWeight={800}>타임아웃 &gt; 쉬어도 되는 가장 긴 시간 × 2 = (1 + 지연) × 간격 × 2</text>
          <text x={250} y={760} fill={C.dim} fontSize={26}>예: 간격 50 ms, 지연 4 → 250 ms × 2 = 500 ms보다 길어야 (2 s ✓, 500 ms ✕)</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), knobs = at(f, cues[1]);
  const X = (ms: number) => 260 + ms * 7;
  const CARDS: [string, string, string][] = [["얼마나 자주", "연결 간격", PH], ["얼마나 건너뛰나", "페리페럴 지연", WT], ["얼마나 오래 깨어 있나", "주고받는 양", C.warn]];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <text x={960} y={180} textAnchor="middle" fill={C.text} fontSize={56} fontWeight={900} opacity={at(f, 10)}>연결은 <tspan fill={WT}>짧은 약속의 반복</tspan></text>
      <g opacity={at(f, 20)}>
        <line x1={260} x2={1660} y1={330} y2={330} stroke={C.faint} strokeWidth={3} />
        {Array.from({ length: 29 }, (_, i) => i * 50 / 1).filter((t) => t <= 200).map((t, i) => (
          <g key={t}>
            <rect x={X(t)} y={290} width={10} height={40} rx={3} fill={i % 5 === 0 ? WT : PH} />
            {X(t + 25) < 1660 && <Zz x={X(t + 25)} y={322} />}
          </g>
        ))}
      </g>
      {CARDS.map(([q, k, col], i) => (
        <g key={q} opacity={knobs} transform={`translate(${260 + i * 480},440)`}>
          <rect x={0} y={0} width={420} height={210} rx={24} fill={C.panel} stroke={col} strokeWidth={4} />
          <text x={30} y={70} fill={C.text} fontSize={36} fontWeight={900}>{q}</text>
          <text x={30} y={120} fill={col} fontSize={28} fontWeight={800}>{k}</text>
          {i === 0 && [0, 1, 2, 3, 4, 5].map((j) => <rect key={j} x={30 + j * 60} y={150} width={10} height={34} rx={3} fill={col} />)}
          {i === 1 && [0, 1, 2, 3, 4, 5].map((j) => <rect key={j} x={30 + j * 60} y={150} width={10} height={34} rx={3} fill={col} opacity={j % 5 === 0 ? 1 : 0.2} />)}
          {i === 2 && <rect x={30} y={150} width={200} height={34} rx={6} fill={col} />}
        </g>
      ))}
      <text x={960} y={760} textAnchor="middle" fill={C.text} fontSize={40} fontWeight={900} opacity={at(f, cues[2])}>배터리 = 얼마나 자주, 얼마나 오래 깨어나나</text>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "appoint": return <Appoint cues={s.cues} />;
    case "event": return <Event cues={s.cues} />;
    case "often": return <Often cues={s.cues} len={s.frames} />;
    case "latency": return <Latency cues={s.cues} />;
    case "lost": return <Lost cues={s.cues} len={s.frames} />;
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
          <Audio src={staticFile(`audio/connection/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const Connection: React.FC<{ voice: boolean }> = ({ voice }) => {
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
