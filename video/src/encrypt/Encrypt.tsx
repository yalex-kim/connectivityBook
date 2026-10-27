import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { ccm, ccmNonce, sessionKey } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { project } from "../range/hook3d";
import { Phone3D, Watch3D } from "../connection/Connection";
import { Key3D, Listener3D, Packet3D, packetPos } from "../common/deep3d";
import { Title } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { DEEP, Ground, Note, makeVideo } from "../common/kit";
import { SchedStage, SchedCam } from "../scheduling/Scheduling";
import { SAMPLE } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰(센트럴) = 파랑, 워치(페리페럴) = 청록, 비밀(공중에 안 나감) = 인디고, 공개 = 회색, 실패 = 빨강 */
const PH = C.accent, WT = C.accent2, KEY = DEEP, BAD = C.bad, OK = C.ok, PUB = C.dim;
const H = (s: string) => (s.match(/../g) || []).map((x) => parseInt(x, 16));
const hx = (a: number[]) => a.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const LTK = H(SAMPLE.ltk), SKDC = H(SAMPLE.skdC), SKDP = H(SAMPLE.skdP), IV = H(SAMPLE.ivP + SAMPLE.ivC);
const SK = sessionKey(LTK, SKDC, SKDP);
const SKDC2 = SKDC.map((b, i) => (i === 7 ? b ^ 0x5a : b)); // 다른 연결의 예: 무작위 값 한 바이트만 달라도
const SK2 = sessionKey(LTK, SKDC2, SKDP);
const RSP_C = ccm(SK, ccmNonce(0, 1, IV), 0x0f, [0x06]), RSP_P = ccm(SK, ccmNonce(0, 0, IV), 0x07, [0x06]);

const Box: React.FC<{ x: number; y: number; w: number; h?: number; col: string; title: string; value?: string; sub?: string; a?: number; dash?: boolean }> = ({ x, y, w, h = 126, col, title, value, sub, a = 1, dash }) => (
  <g opacity={a} transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={w} height={h} rx={16} fill={C.panel} stroke={col} strokeWidth={3} strokeDasharray={dash ? "10 7" : undefined} />
    <text x={22} y={38} fill={col} fontSize={24} fontWeight={900}>{title}</text>
    {value && <text x={22} y={74} fill={C.text} fontSize={22} fontFamily="monospace">{value}</text>}
    {sub && <text x={22} y={h - 16} fill={C.dim} fontSize={18}>{sub}</text>}
  </g>
);

/* ---------------------------------------------------------------- 1. 훅 (3D) */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[0], SchedCam[1], f / len), q = at(f, cues[1]);
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, 20)} transform="translate(1320,160)">
          <rect x={0} y={0} width={480} height={96} rx={48} fill={C.panel} stroke={KEY} strokeWidth={3} />
          <text x={240} y={60} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900}>저장한 키 (LTK)</text>
        </g>
        <g opacity={q} transform="translate(1320,290)">
          <text x={240} y={0} textAnchor="middle" fill={C.dim} fontSize={28} fontWeight={800}>이 키 하나로 몇 년 동안?</text>
        </g>
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2·3. 세션 키와 엿듣기 (3D) */
const EP: Vec = [-13, 7, 2], EW: Vec = [13, 5, 0], LIS: Vec = [0, 0, -9];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const WatchAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x - 12, 0, z]}><Watch3D /></group>;
const Session: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 14, 42], look: [0, 6, 0], fov: 40 }, { pos: [3, 15, 40], look: [0, 6, 0], fov: 40 }, f / len);
  const ltk = at(f, 10), c1 = cues[1], c2 = cues[2], c3 = cues[3], sk = at(f, c2 + 20), again = at(f, c3 + 30);
  const skCol = again > 0.5 ? C.warn : OK;
  const lab = (p: Vec, t: string, col: string, a: number, dy = -30, size = 24) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <PhoneAt x={-15} z={2} /><WatchAt x={15} />
        {ltk > 0 && <><Key3D p={[-19, 1.6, 4]} col={KEY} s={0.8} opacity={ltk} /><Key3D p={[12, 1.2, 3]} col={KEY} s={0.8} opacity={ltk} /></>}
        <Packet3D f={f} t0={c1} t1={c1 + 45} a={EP} b={EW} col={PUB} />
        <Packet3D f={f} t0={c1 + 10} t1={c1 + 55} a={EW} b={EP} col={PUB} />
        {sk > 0 && <><Key3D p={[-19, 13, 2]} col={skCol} s={0.9} opacity={sk} /><Key3D p={[12, 11, 0]} col={skCol} s={0.9} opacity={sk} /></>}
        <Packet3D f={f} t0={c3} t1={c3 + 40} a={EP} b={EW} col="#64748b" />
        <Packet3D f={f} t0={c3 + 8} t1={c3 + 48} a={EW} b={EP} col="#64748b" />
      </Scene3D>
      <Title kicker="세션 키">저장한 키로 직접 잠그지 않는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([-17, 1.6, 4], "LTK (안에만)", KEY, ltk, 60)}
        {lab([14, 1.2, 3], "LTK (안에만)", KEY, ltk, 60)}
        {lab([0, 9, 1], "무작위 값 SKD_C · SKD_P", C.dim, at(f, c1) * (1 - at(f, c2 + 40)), -10)}
        {lab([-17, 13, 2], "세션 키", skCol, sk, -40)}
        {lab([14, 11, 0], "세션 키", skCol, sk, -40)}
        <g opacity={sk}><text x={960} y={860} textAnchor="middle" fill={skCol} fontSize={26} fontFamily="monospace" fontWeight={800}>SK = e(LTK, SKD) = {hx(again > 0.5 ? SK2 : SK)}</text></g>
        {lab([0, 9, 1], "다음 연결: 새 무작위 값 → 다른 세션 키", C.warn, again, -10)}
      </svg>
    </>
  );
};

const Listen: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 18, 44], look: [0, 5, -2], fov: 40 }, { pos: [-3, 19, 42], look: [0, 5, -2], fov: 40 }, f / len);
  const copy = (t0: number, a: Vec) => <Packet3D f={f} t0={t0} t1={t0 + 40} a={a} b={[LIS[0], 6.6, LIS[2]]} col={PUB} size={0.7} arc={1} />;
  const no = at(f, cues[1]), pair = at(f, cues[2]);
  const lab = (p: Vec, t: string, col: string, a: number, dy = -30, size = 24) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <PhoneAt x={-15} z={2} /><WatchAt x={15} />
        <Listener3D p={LIS} />
        <Key3D p={[-19, 1.6, 4]} col={KEY} s={0.8} /><Key3D p={[12, 1.2, 3]} col={KEY} s={0.8} />
        <Packet3D f={f} t0={10} t1={50} a={EP} b={EW} col={PUB} />
        <Packet3D f={f} t0={20} t1={60} a={EW} b={EP} col={PUB} />
        {copy(25, [0, 9, 1])}{copy(35, [0, 9, 1])}
        {no > 0 && <mesh position={[0, 9.4, -9]}><sphereGeometry args={[0.01, 4, 4]} /><meshBasicMaterial /></mesh>}
      </Scene3D>
      <Title kicker="엿듣는 사람이 아는 것">공중의 값만으로는 세션 키를 못 만든다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([LIS[0], 6.6, LIS[2]], "엿듣는 수신기", BAD, 1, -40)}
        {(() => { const [x, y] = project(cam, [LIS[0], 6.6, LIS[2]]); return (
          <g transform={`translate(${x + 60},${y - 70})`}>
            <rect x={0} y={0} width={330} height={150} rx={16} fill={C.panel} stroke={BAD} strokeWidth={3} />
            <text x={20} y={40} fill={OK} fontSize={22} fontWeight={800} opacity={at(f, 70)}>✓ SKD_C · SKD_P · IV</text>
            <text x={20} y={84} fill={BAD} fontSize={22} fontWeight={800} opacity={no}>✗ LTK (공중에 없음)</text>
            <text x={20} y={128} fill={BAD} fontSize={22} fontWeight={900} opacity={no}>→ 세션 키 계산 불가</text>
          </g>); })()}
        {lab([-17, 1.6, 4], "LTK", KEY, 1, 60)}
        {lab([14, 1.2, 3], "LTK", KEY, 1, 60)}
        <Note x={360} y={830} w={1200} a={pair} col={KEY} lines={[["그래서", "안전은 페어링이 LTK를 얼마나 안전하게 만들었느냐에 달려 있다(입문 7편)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. nonce: 같은 내용, 다른 암호문 */
const Nonce: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), why = at(f, 10), parts = at(f, cues[1]), ex = at(f, cues[2]);
  const nC = ccmNonce(0, 1, IV), nP = ccmNonce(0, 0, IV);
  const seg = (x: number, w: number, col: string, label: string, sub: string) => (
    <g transform={`translate(${x},0)`}><rect x={0} y={0} width={w} height={70} rx={10} fill={col} opacity={0.85} /><text x={w / 2} y={44} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>{label}</text><text x={w / 2} y={100} textAnchor="middle" fill={C.dim} fontSize={18}>{sub}</text></g>
  );
  return (
    <>
      <Title kicker="nonce: 한 번만 쓰는 값">같은 내용도 매번 다르게 잠근다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={240} y={250} fill={C.dim} fontSize={24} opacity={why}>세션 키 하나로 수만 개의 패킷 → 같은 평문이 같은 암호문이면 패턴이 드러난다</text>
        <g opacity={parts} transform="translate(240,300)">
          <text x={0} y={-14} fill={C.text} fontSize={26} fontWeight={900}>nonce 13바이트</text>
          {seg(0, 440, C.accent, "패킷 번호 (39비트)", "패킷마다 1씩")}
          {seg(450, 120, C.warn, "방향", "센트럴 1 · 페리페럴 0")}
          {seg(580, 860, KEY, "IV (8바이트)", "연결할 때 둘이 반씩 낸 값")}
        </g>
        <g opacity={ex}>
          {[["휴대폰 → 워치", PH, nC, RSP_C], ["워치 → 휴대폰", WT, nP, RSP_P]].map(([k, col, n, r], i) => {
            const rr = r as typeof RSP_C;
            return (
              <g key={i} transform={`translate(240,${500 + i * 150})`}>
                <rect x={0} y={0} width={1440} height={120} rx={18} fill={C.panel} stroke={col as string} strokeWidth={3} />
                <text x={28} y={50} fill={col as string} fontSize={28} fontWeight={900}>{k as string}</text>
                <text x={28} y={92} fill={C.dim} fontSize={20} fontFamily="monospace">nonce {hx(n as number[])}</text>
                <text x={760} y={50} fill={C.text} fontSize={26} fontWeight={800}>평문 06</text>
                <text x={980} y={50} fill={C.text} fontSize={26} fontWeight={800}>→ 암호문</text>
                <text x={1160} y={52} fill={C.warn} fontSize={40} fontWeight={900} fontFamily="monospace">{hx(rr.cipher)}</text>
                <text x={1260} y={92} fill={C.dim} fontSize={20} fontFamily="monospace">MIC {hx(rr.encMic)}</text>
              </g>
            );
          })}
        </g>
        <text x={240} y={830} fill={C.dim} fontSize={20} opacity={ex}>사양 샘플 [Vol 6] Part C §1: LL_START_ENC_RSP 두 개, 같은 세션 키, 패킷 번호 0, 방향만 다름</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. MIC와 재생 (3D) */
const Mic: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 16, 42], look: [0, 5, -2], fov: 40 }, { pos: [3, 17, 40], look: [0, 5, -2], fov: 40 }, f / len);
  const c1 = cues[1], c2 = cues[2];
  const flip = f >= c1 + 25, cut = at(f, c1 + 50), replay = at(f, c2);
  const lab = (p: Vec, t: string, col: string, a: number, dy = -30, size = 24) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  const mid = packetPos(f, c1, c1 + 50, EP, EW);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <PhoneAt x={-15} z={2} /><WatchAt x={15} />
        <Listener3D p={LIS} />
        <mesh position={[0, 6, 1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 26, 8]} /><meshStandardMaterial color={cut > 0.5 ? BAD : OK} emissive={cut > 0.5 ? BAD : OK} emissiveIntensity={1} transparent opacity={cut > 0.5 ? 1 - (cut - 0.5) * 2 : 0.8} /></mesh>
        <Packet3D f={f} t0={10} t1={50} a={EP} b={EW} col={C.accent} />
        <Packet3D f={f} t0={c1} t1={c1 + 50} a={EP} b={EW} col={flip ? BAD : C.accent} />
        {f > c1 + 18 && f < c1 + 32 && <mesh position={[mid[0], mid[1] + 3, mid[2]]}><coneGeometry args={[0.5, 3, 6]} /><meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.5} /></mesh>}
        <Packet3D f={f} t0={c2 + 10} t1={c2 + 55} a={[LIS[0], 6.6, LIS[2]]} b={EW} col="#94a3b8" drop />
      </Scene3D>
      <Title kicker="MIC: 확인값">바꾸면 끊기고, 다시 틀어도 안 통한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([0, 9, 1], "암호문 + MIC 4바이트", C.accent, at(f, 10) * (1 - at(f, c1)), -10)}
        {lab(mid, "1비트를 바꾸면", "#facc15", f > c1 + 15 && f < c1 + 50 ? 1 : 0, -50)}
        {lab([15, 9, 0], "MIC 틀림 → 연결 끊김 (0x3D)", BAD, cut, -40, 26)}
        {lab([LIS[0], 6.6, LIS[2]], "녹음해 둔 옛 패킷", "#94a3b8", replay, -40)}
        {lab([8, 3, 0], "번호가 이미 지남 → 버림", BAD, at(f, c2 + 50), 70, 24)}
        <Note x={360} y={830} w={1200} a={at(f, 10)} col={KEY} lines={[["MIC", "= 헤더 일부와 내용을 세션 키로 요약한 4바이트. 맞힐 확률은 한 번에 2⁻³²"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["저장한 키는 공중에 나가지 않는다", "연결마다 새 세션 키 = e(LTK, 무작위 값)"], ["패킷마다 번호를 섞고, MIC를 붙인다", "같은 내용도 다르게, 바꾸면 끊긴다"], ["키 하나를 오래 써도", "데이터는 연결마다 새 열쇠로 잠긴다"]];
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${240 + i * 160})`}>
            <rect x={0} y={0} width={960} height={124} rx={22} fill={C.panel} stroke={i === 2 ? OK : KEY} strokeWidth={3} opacity={0.95} />
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
    case "session": return <Session cues={s.cues} len={s.frames} />;
    case "listen": return <Listen cues={s.cues} len={s.frames} />;
    case "nonce": return <Nonce cues={s.cues} />;
    case "mic": return <Mic cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Encrypt = makeVideo("encrypt", scenesFor, LEAD, body);
