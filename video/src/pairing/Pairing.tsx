import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { CL, LE, at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Ground, Note, makeVideo } from "../common/kit";
import { LEAD, scenesFor, type Timed } from "./timing";

const OK = C.ok, BAD = C.bad, A_COL = LE, B_COL = CL, M_COL = C.bad;
/** 사양 [Vol 3] Part H 부록 D.5의 g2 = 0x2F9ED5BA → 화면 숫자는 10진 하위 6자리 */
const SIX = String(0x2f9ed5ba % 1e6).padStart(6, "0"); // 938554
const SIX_MITM = "271604"; // 중간자가 끼었을 때 다른 쪽 화면의 예시 숫자

/* ---------------------------------------------------------------- 3D 기기 */
const Phone: React.FC<{ p: Vec; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[-0.08, ry, 0]}>
    <mesh><boxGeometry args={[5, 10, 0.6]} /><meshStandardMaterial color="#d9e2f0" metalness={0.6} roughness={0.3} /></mesh>
    <mesh position={[0, 0, 0.31]}><boxGeometry args={[4.5, 9.3, 0.02]} /><meshStandardMaterial color="#10203a" emissive="#10203a" emissiveIntensity={0.6} /></mesh>
  </group>
);
const Laptop: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p} rotation={[0, 0, 0]}>
    <mesh position={[0, 0.3, 0]}><boxGeometry args={[11, 0.6, 7]} /><meshStandardMaterial color="#c9d3e3" metalness={0.5} roughness={0.35} /></mesh>
    <mesh position={[0, 3.9, -3.4]} rotation={[-0.25, 0, 0]}><boxGeometry args={[11, 7, 0.4]} /><meshStandardMaterial color="#c9d3e3" metalness={0.5} roughness={0.35} /></mesh>
    <mesh position={[0, 3.9, -3.15]} rotation={[-0.25, 0, 0]}><boxGeometry args={[10, 6.2, 0.02]} /><meshStandardMaterial color="#10203a" emissive="#10203a" emissiveIntensity={0.6} /></mesh>
    <mesh position={[0, 0.5, 6]}><boxGeometry args={[10, 0.5, 3.2]} /><meshStandardMaterial color="#2a3550" roughness={0.7} /></mesh>
  </group>
);
const Buds: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 1.4, 0]}><boxGeometry args={[4.4, 2.8, 3]} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 1.1, 3.6, 0]}>
        <mesh><sphereGeometry args={[0.8, 20, 16]} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
        <mesh position={[0, -1, 0]}><cylinderGeometry args={[0.3, 0.3, 1.6, 12]} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
      </group>
    ))}
  </group>
);
const KB_P: Vec = [-26, 0, 0], PA: Vec = [-3, 5.6, 0], PB: Vec = [5, 5.6, 0], BUDS_P: Vec = [26, 0, 0];

/* ---------------------------------------------------------------- 1. 훅 (3D) */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), kb = at(f, 5), ph = at(f, cues[1]), bd = at(f, cues[2]), q = at(f, cues[3]);
  const cam = camLerp({ pos: [-16, 22, 54], look: [-6, 4, 0], fov: 42 }, { pos: [10, 22, 56], look: [4, 4, 0], fov: 42 }, f / len);
  const L = (p: Vec) => project(cam, p);
  const [lp, pa, pb, bp] = [L([KB_P[0], 4.5, -3]), L([PA[0], PA[1], 0.4]), L([PB[0], PB[1], 0.4]), L([BUDS_P[0], 6.5, 0])];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <Laptop p={KB_P} />
        <Phone p={PA} ry={0.25} />
        <Phone p={PB} ry={-0.25} />
        <Buds p={BUDS_P} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={kb}>
          <text x={lp[0]} y={lp[1] - 10} textAnchor="middle" fill={C.dim} fontSize={18}>키보드로 입력하세요</text>
          <text x={lp[0]} y={lp[1] + 28} textAnchor="middle" fill={C.text} fontSize={36} fontWeight={900} letterSpacing={4}>{SIX}</text>
        </g>
        {[pa, pb].map(([x, y], i) => (
          <g key={i} opacity={ph}>
            <text x={x} y={y - 20} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900} letterSpacing={2}>{SIX}</text>
            <text x={x} y={y + 14} textAnchor="middle" fill={C.dim} fontSize={16}>숫자가 같습니까?</text>
            <rect x={x - 46} y={y + 30} width={92} height={30} rx={8} fill={OK} opacity={0.8} />
            <text x={x} y={y + 51} textAnchor="middle" fill={C.bg} fontSize={16} fontWeight={800}>예</text>
          </g>
        ))}
        <text x={bp[0]} y={bp[1] - 40} textAnchor="middle" fill={OK} fontSize={28} fontWeight={800} opacity={bd}>연결됨 (묻지 않음)</text>
        <text x={960} y={250} textAnchor="middle" fill={C.accent} fontSize={130} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2D 기기 아이콘 */
const Dev: React.FC<{ x: number; y: number; col: string; label: string; a?: number }> = ({ x, y, col, label, a = 1 }) => (
  <g opacity={a} fontFamily={FONT}>
    <rect x={x - 60} y={y - 100} width={120} height={200} rx={22} fill={C.panel} stroke={col} strokeWidth={5} />
    <rect x={x - 46} y={y - 82} width={92} height={150} rx={8} fill={col} opacity={0.25} />
    <text x={x} y={y + 150} textAnchor="middle" fill={col} fontSize={30} fontWeight={900}>{label}</text>
  </g>
);
const Person: React.FC<{ x: number; y: number; col: string; label: string; a?: number; ear?: boolean }> = ({ x, y, col, label, a = 1, ear }) => (
  <g opacity={a} fontFamily={FONT}>
    <circle cx={x} cy={y - 50} r={34} fill={C.panel} stroke={col} strokeWidth={5} />
    <path d={`M${x - 60} ${y + 70} C ${x - 60} ${y - 10}, ${x + 60} ${y - 10}, ${x + 60} ${y + 70} Z`} fill={C.panel} stroke={col} strokeWidth={5} />
    {ear && <path d={`M${x + 40} ${y - 70} q 24 20 0 40`} stroke={col} strokeWidth={5} fill="none" />}
    <text x={x} y={y + 115} textAnchor="middle" fill={col} fontSize={28} fontWeight={900}>{label}</text>
  </g>
);

/* ---------------------------------------------------------------- 2. 두 위협 */
const Threats: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), two = at(f, cues[2]), mitm = at(f, cues[2] + 40);
  const wave = (x1: number, x2: number, y: number, col: string, a: number) => (
    <g opacity={a}>{Array.from({ length: 6 }, (_, i) => { const p = ((f / 40 + i / 6) % 1); return <circle key={i} cx={x1 + (x2 - x1) * p} cy={y} r={8} fill={col} />; })}</g>
  );
  return (
    <>
      <Title kicker="무엇을 막아야 하나">엿듣기와 끼어들기</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g>
          <text x={480} y={270} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900} opacity={two}>도청</text>
          <Dev x={250} y={480} col={A_COL} label="기기 A" />
          <Dev x={710} y={480} col={B_COL} label="기기 B" />
          {wave(320, 640, 480, C.text, 1)}
          <Person x={480} y={720} col={C.warn} label="엿듣는 사람" a={two} ear />
          <path d="M480 640 L480 520" stroke={C.warn} strokeWidth={3} strokeDasharray="8 8" opacity={two} />
        </g>
        <g opacity={mitm}>
          <line x1={960} x2={960} y1={260} y2={860} stroke="#24324a" strokeWidth={3} />
          <text x={1440} y={270} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>중간자</text>
          <Dev x={1150} y={480} col={A_COL} label="기기 A" />
          <Dev x={1730} y={480} col={B_COL} label="기기 B" />
          <Person x={1440} y={500} col={M_COL} label="끼어든 사람" />
          {wave(1220, 1380, 450, A_COL, 1)}
          {wave(1500, 1660, 450, B_COL, 1)}
          <text x={1300} y={420} textAnchor="middle" fill={C.dim} fontSize={20}>“내가 B야”</text>
          <text x={1580} y={420} textAnchor="middle" fill={C.dim} fontSize={20}>“내가 A야”</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 도청은 수학으로 (색 섞기 비유) */
const Blob: React.FC<{ x: number; y: number; col: string; label?: string; a?: number; r?: number }> = ({ x, y, col, label, a = 1, r = 46 }) => (
  <g opacity={a} fontFamily={FONT}>
    <circle cx={x} cy={y} r={r} fill={col} stroke={C.text} strokeWidth={3} />
    {label && <text x={x} y={y + r + 34} textAnchor="middle" fill={C.dim} fontSize={22} fontWeight={700}>{label}</text>}
  </g>
);
const PUB = "#e9c46a", SA = "#e76f51", SB = "#4f86f7", MIXA = "#e89a5e", MIXB = "#9aa5b0", KEY = "#8a6a4f";
const Dh: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), ex = at(f, cues[1]), key = at(f, cues[1] + 60), ear = at(f, cues[2]), sc = at(f, cues[3]);
  const sendA = interpolate(f, [cues[1] + 10, cues[1] + 40], [0, 1], clamp), sendB = sendA;
  return (
    <>
      <Title kicker="도청 막기">공개 재료만 주고받고, 각자 같은 키를 계산</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={330} y={280} textAnchor="middle" fill={A_COL} fontSize={32} fontWeight={900}>기기 A</text>
        <text x={1590} y={280} textAnchor="middle" fill={B_COL} fontSize={32} fontWeight={900}>기기 B</text>
        <Blob x={250} y={380} col={SA} label="A만 아는 비밀" />
        <Blob x={1670} y={380} col={SB} label="B만 아는 비밀" />
        <Blob x={960} y={320} col={PUB} label="모두 아는 공개 재료" />
        <g opacity={ex}>
          <Blob x={410 + 1100 * sendA} y={530} col={MIXA} label={sendA > 0.9 ? "A가 보낸 것" : ""} r={40} />
          <Blob x={1510 - 1100 * sendB} y={620} col={MIXB} label={sendB > 0.9 ? "B가 보낸 것" : ""} r={40} />
        </g>
        <g opacity={key}>
          <text x={330} y={760} textAnchor="middle" fill={C.dim} fontSize={22}>B가 보낸 것 + A의 비밀</text>
          <Blob x={330} y={830} col={KEY} r={42} />
          <text x={1590} y={760} textAnchor="middle" fill={C.dim} fontSize={22}>A가 보낸 것 + B의 비밀</text>
          <Blob x={1590} y={830} col={KEY} r={42} />
          <text x={330} y={830 + 8} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={900}>키</text>
          <text x={1590} y={830 + 8} textAnchor="middle" fill="#fff" fontSize={22} fontWeight={900}>키</text>
        </g>
        <g opacity={ear}>
          <circle cx={960} cy={780} r={44} fill={C.panel} stroke={C.warn} strokeWidth={4} />
          <text x={960} y={792} textAnchor="middle" fill={C.warn} fontSize={34} fontWeight={900}>?</text>
          <text x={960} y={856} textAnchor="middle" fill={C.warn} fontSize={22} fontWeight={800}>엿들어도 섞인 것만 안다</text>
        </g>
        <Note x={560} y={420} w={800} a={sc} lines={[["P-256 ECDH", "= 타원곡선 디피-헬먼 (4.2 LE Secure Connections)"], ["", "색 섞기는 비유. 실제로는 공개 키와 비밀 키의 계산"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 바꿔치기 */
const Mitm: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), sw = at(f, cues[0] + 15), keys = at(f, cues[1]), q = at(f, cues[2]);
  return (
    <>
      <Title kicker="끼어들기">재료를 바꿔치기하면?</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Dev x={260} y={500} col={A_COL} label="기기 A" />
        <Dev x={1660} y={500} col={B_COL} label="기기 B" />
        <Person x={960} y={520} col={M_COL} label="끼어든 사람" />
        <g opacity={sw}>
          <Blob x={560} y={440} col={MIXA} r={34} />
          <path d="M610 440 H820" stroke={A_COL} strokeWidth={4} markerEnd="" />
          <Blob x={1360} y={440} col={MIXB} r={34} />
          <path d="M1310 440 H1100" stroke={B_COL} strokeWidth={4} />
          <Blob x={560} y={600} col="#c77dff" r={34} />
          <path d="M820 600 H610" stroke={M_COL} strokeWidth={4} />
          <Blob x={1360} y={600} col="#c77dff" r={34} />
          <path d="M1100 600 H1310" stroke={M_COL} strokeWidth={4} />
          <text x={960} y={330} textAnchor="middle" fill={M_COL} fontSize={24} fontWeight={800}>각자에게 자기 재료를 대신 보냄</text>
        </g>
        <g opacity={keys}>
          <Blob x={260} y={760} col="#b5651d" r={40} />
          <text x={260} y={840} textAnchor="middle" fill={C.dim} fontSize={22}>A ↔ 끼어든 사람의 키</text>
          <Blob x={1660} y={760} col="#5a7d9a" r={40} />
          <text x={1660} y={840} textAnchor="middle" fill={C.dim} fontSize={22}>끼어든 사람 ↔ B의 키</text>
          <text x={960} y={770} textAnchor="middle" fill={BAD} fontSize={30} fontWeight={900}>키가 서로 다르다 · 둘 다 모른다</text>
        </g>
        <text x={960} y={850} textAnchor="middle" fill={C.text} fontSize={28} fontWeight={800} opacity={q}>상대가 진짜인지는 수학만으로 확인할 수 없다</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 사람이 숫자를 본다 */
const Screen: React.FC<{ x: number; y: number; num: string; col: string; a: number; mark?: "ok" | "bad" | "" }> = ({ x, y, num, col, a, mark = "" }) => (
  <g opacity={a} fontFamily={FONT}>
    <rect x={x - 130} y={y - 150} width={260} height={300} rx={26} fill={C.panel} stroke={col} strokeWidth={5} />
    <text x={x} y={y - 40} textAnchor="middle" fill={C.dim} fontSize={20}>숫자가 같습니까?</text>
    <text x={x} y={y + 20} textAnchor="middle" fill={C.text} fontSize={50} fontWeight={900} letterSpacing={3}>{num}</text>
    {mark && <text x={x} y={y + 110} textAnchor="middle" fill={mark === "ok" ? OK : BAD} fontSize={36} fontWeight={900}>{mark === "ok" ? "✓ 같다" : "✕ 다르다"}</text>}
  </g>
);
const Compare: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), show = at(f, cues[1]), bad = at(f, cues[2]), prob = at(f, cues[3]);
  return (
    <>
      <Title kicker="마지막 확인은 사람이">두 화면의 6자리 숫자 비교</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={1 - bad * 0.25}>
          <text x={520} y={270} textAnchor="middle" fill={OK} fontSize={28} fontWeight={900} opacity={show}>그대로 주고받았다면</text>
          <Screen x={380} y={470} num={SIX} col={A_COL} a={show} mark={show > 0.9 ? "ok" : ""} />
          <Screen x={660} y={470} num={SIX} col={B_COL} a={show} mark={show > 0.9 ? "ok" : ""} />
        </g>
        <g opacity={bad}>
          <text x={1400} y={270} textAnchor="middle" fill={BAD} fontSize={28} fontWeight={900}>중간에서 바꿔치기했다면</text>
          <Screen x={1260} y={470} num={SIX} col={A_COL} a={1} mark="bad" />
          <Screen x={1540} y={470} num={SIX_MITM} col={B_COL} a={1} mark="bad" />
        </g>
        <g opacity={prob}>
          <text x={260} y={720} fill={C.text} fontSize={28} fontWeight={800}>공격자가 같은 숫자를 우연히 맞힐 확률</text>
          <rect x={260} y={745} width={1400} height={40} rx={10} fill="#1b2840" />
          <rect x={260} y={745} width={6} height={40} rx={3} fill={BAD} />
          <text x={1680} y={775} fill={BAD} fontSize={30} fontWeight={900}>1 / 1,000,000</text>
        </g>
        <Note x={260} y={810} w={1400} a={show} lines={[["숫자", "= g2(두 공개 키, 두 난수)의 10진 하위 6자리 (사양 샘플 D.5 → " + SIX + ")"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 기기가 정하는 방식 */
const ROWS: [string, string, string, string, string][] = [
  ["휴대폰 ↔ 휴대폰", "화면 + 예/아니요 버튼 양쪽", "숫자 비교", "인증", A_COL],
  ["노트북 ↔ 키보드", "한쪽 화면, 한쪽 키보드", "숫자 입력 (패스키)", "인증", B_COL],
  ["휴대폰 ↔ 이어폰", "숫자를 보여 주거나 입력할 수단 없음", "Just Works", "미인증", C.warn],
];
const Methods: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), r = [at(f, cues[1]), at(f, cues[1] + 50), at(f, cues[2])], jw = at(f, cues[3]);
  return (
    <>
      <Title kicker="어떤 확인을 할까">두 기기의 입출력 능력이 정한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {ROWS.map(([pair, io, m, auth, col], i) => (
          <g key={pair} opacity={r[i]} transform={`translate(150,${280 + i * 150})`}>
            <rect x={0} y={0} width={1620} height={120} rx={20} fill={C.panel} stroke={col} strokeWidth={3} />
            <text x={36} y={72} fill={C.text} fontSize={34} fontWeight={900}>{pair}</text>
            <text x={430} y={72} fill={C.dim} fontSize={26}>{io}</text>
            <text x={1060} y={72} fill={col} fontSize={34} fontWeight={900}>→ {m}</text>
            <text x={1580} y={72} textAnchor="end" fill={auth === "인증" ? OK : BAD} fontSize={26} fontWeight={800}>{auth}</text>
          </g>
        ))}
        <g opacity={jw}>
          <text x={1060} y={760} fill={OK} fontSize={28} fontWeight={800}>✓ 엿듣기 막음 (ECDH)</text>
          <text x={1400} y={760} fill={BAD} fontSize={28} fontWeight={800}>✕ 끼어들기 못 막음</text>
        </g>
        <Note x={150} y={800} w={1620} a={r[0]} lines={[["입출력 능력", "= 화면·버튼·키보드가 있는지. 사양의 표가 두 기기의 조합으로 방식을 정한다 (Secure Connections 기준)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), bond = at(f, cues[1]);
  const CARDS: [string, string, string][] = [["엿듣기", "수학이 막는다 (ECDH)", OK], ["끼어들기", "6자리를 보는 사람의 눈이 막는다", C.warn]];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <text x={960} y={190} textAnchor="middle" fill={C.text} fontSize={56} fontWeight={900} opacity={at(f, 10)}>6자리 숫자는 <tspan fill={C.warn}>끼어들기</tspan>를 막는다</text>
      {CARDS.map(([k, v, col], i) => (
        <g key={k} opacity={at(f, 15 + i * 20)} transform={`translate(${260 + i * 720},300)`}>
          <rect x={0} y={0} width={660} height={220} rx={26} fill={C.panel} stroke={col} strokeWidth={4} />
          <text x={40} y={90} fill={col} fontSize={44} fontWeight={900}>{k}</text>
          <text x={40} y={160} fill={C.text} fontSize={30} fontWeight={700}>{v}</text>
        </g>
      ))}
      <g opacity={bond} transform="translate(560,600)">
        <rect x={0} y={0} width={800} height={160} rx={26} fill={C.panel} stroke={LE} strokeWidth={4} />
        <rect x={40} y={36} width={70} height={90} rx={10} fill="none" stroke={LE} strokeWidth={4} />
        <path d="M58 62 h34 M58 82 h34 M58 102 h22" stroke={LE} strokeWidth={4} />
        <text x={140} y={78} fill={LE} fontSize={34} fontWeight={900}>본딩: 키를 저장해 두면</text>
        <text x={140} y={122} fill={C.text} fontSize={28}>다음 연결부터는 페어링을 건너뛴다</text>
      </g>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "threats": return <Threats cues={s.cues} />;
    case "dh": return <Dh cues={s.cues} />;
    case "mitm": return <Mitm cues={s.cues} />;
    case "compare": return <Compare cues={s.cues} />;
    case "methods": return <Methods cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} />;
  }
};
export const Pairing = makeVideo("pairing", scenesFor, LEAD, body);
export { Phone as PairPhone, Laptop, Buds };
export const PAIR_SIX = SIX;
export type { Cam };
