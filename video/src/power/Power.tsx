import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { averageCurrentUa, windowWideningUs } from "../book";
import { Scene3D, camLerp, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { CL, LE, at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Ground, Note, makeVideo } from "../common/kit";
import { LEAD, scenesFor, type Timed } from "./timing";

const OK = C.ok, BAD = C.bad, WARN = C.warn;
/* 책 9장의 예: 전지 220 mAh, 수면 2 µA, 이벤트 한 번 15 µC */
const CAP_MAH = 220, SLEEP = 2, Q = 15;
const lifeYears = (ua: number) => CAP_MAH / (ua / 1000) / 24 / 365;
const lifeMonths = (ua: number) => CAP_MAH / (ua / 1000) / 24 / 30.4;

/* ---------------------------------------------------------------- 3D: 코인 전지와 기기 */
const Coin: React.FC<{ p: Vec; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s} rotation={[0.35, 0, 0]}>
    <mesh><cylinderGeometry args={[3, 3, 0.8, 48]} /><meshStandardMaterial color="#b9c3d3" metalness={0.2} roughness={0.35} emissive="#3a4660" emissiveIntensity={0.3} /></mesh>
    <mesh position={[0, 0.41, 0]}><cylinderGeometry args={[2.4, 2.4, 0.02, 48]} /><meshStandardMaterial color="#e8edf6" metalness={0.2} roughness={0.3} emissive="#56647c" emissiveIntensity={0.3} /></mesh>
  </group>
);
const BoxDev: React.FC<{ p: Vec; size: Vec; col: string }> = ({ p, size, col }) => (
  <group position={p}>
    <mesh position={[0, size[1] / 2, 0]}><boxGeometry args={size} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
    <mesh position={[0, size[1] * 0.75, size[2] / 2 + 0.01]}><circleGeometry args={[0.35, 20]} /><meshStandardMaterial color={col} emissive={col} emissiveIntensity={1} /></mesh>
  </group>
);
const TAG: Vec = [-14, 0, 0], DOOR: Vec = [14, 0, 0], COIN: Vec = [0, 3, 4];
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), coin = at(f, cues[1]), drain = at(f, cues[2]), q = at(f, cues[3]);
  const cam = camLerp({ pos: [-6, 16, 40], look: [0, 3, 0], fov: 40 }, { pos: [6, 17, 40], look: [0, 3, 0], fov: 40 }, f / len);
  const L = (p: Vec) => project(cam, p);
  const [tp, dp, cp, tb, db] = [L([TAG[0], 5.5, 0]), L([DOOR[0], 8.5, 0]), L([COIN[0], 6.5, COIN[2]]), L([TAG[0], 0, 3]), L([DOOR[0], 0, 2])];
  const hours = interpolate(drain, [0, 1], [0, CAP_MAH / 5], clamp);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <BoxDev p={TAG} size={[4, 4, 4]} col={LE} />
        <BoxDev p={DOOR} size={[3, 7, 2]} col={CL} />
        <group scale={coin}><Coin p={COIN} /></group>
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, 10)}>
          <rect x={tp[0] - 110} y={tp[1] - 70} width={220} height={54} rx={12} fill={C.panel} stroke={LE} strokeWidth={3} />
          <text x={tp[0]} y={tp[1] - 34} textAnchor="middle" fill={C.text} fontSize={26} fontWeight={900}>배터리 1년</text>
          <text x={tb[0]} y={tb[1] + 36} textAnchor="middle" fill={C.dim} fontSize={24}>분실물 태그</text>
          <rect x={dp[0] - 110} y={dp[1] - 70} width={220} height={54} rx={12} fill={C.panel} stroke={CL} strokeWidth={3} />
          <text x={dp[0]} y={dp[1] - 34} textAnchor="middle" fill={C.text} fontSize={26} fontWeight={900}>배터리 3년</text>
          <text x={db[0]} y={db[1] + 36} textAnchor="middle" fill={C.dim} fontSize={24}>도어 센서</text>
        </g>
        <text x={cp[0]} y={cp[1] - 30} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900} opacity={coin}>CR2032 · 약 220 mAh</text>
        <g opacity={drain}>
          <text x={560} y={820} fill={BAD} fontSize={26} fontWeight={800}>무선부를 계속 켜 두면 (약 5 mA)</text>
          <rect x={560} y={840} width={800} height={36} rx={10} fill="#1b2840" />
          <rect x={560} y={840} width={800 * (1 - drain)} height={36} rx={10} fill={BAD} />
          <text x={1380} y={870} fill={BAD} fontSize={28} fontWeight={900}>{Math.round(hours)}시간</text>
        </g>
        <text x={960} y={250} textAnchor="middle" fill={C.accent} fontSize={130} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 전류 파형 */
const SEG: [string, number, number, string][] = [["깨어나기", 400, 1.5, "#56647c"], ["무선 준비", 80, 3, "#8a9bb5"], ["듣기", 300, 5, CL], ["보내기", 200, 5.5, LE], ["뒷정리", 200, 2, "#56647c"]]; // [이름, µs, mA, 색] 대표값
const Wave: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), X0 = 200, W = 1520, Y0 = 640, H = 300, spikes = at(f, cues[1]), zoom = at(f, cues[2]);
  const shown = interpolate(f, [cues[1], len - 20], [0, 1], clamp);
  const sx = (i: number) => X0 + 60 + i * 300;
  return (
    <>
      <Title kicker="전류 파형">µA로 자다가, mA로 잠깐 깨어난다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={X0} x2={X0 + W} y1={Y0} y2={Y0} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - H - 20} stroke={C.faint} strokeWidth={2} />
        <text x={X0 - 14} y={Y0 - H + 8} textAnchor="end" fill={C.faint} fontSize={20}>mA</text>
        <path d={`M${X0} ${Y0 - 6} H${X0 + W * Math.max(shown, 0.02)}`} stroke={OK} strokeWidth={6} opacity={at(f, 10)} />
        <text x={X0 + 20} y={Y0 + 40} fill={OK} fontSize={24} fontWeight={800} opacity={at(f, 10)}>수면 1~3 µA (바닥)</text>
        {[0, 1, 2, 3, 4].map((i) => (sx(i) - X0) / W <= shown ? (
          <path key={i} d={`M${sx(i)} ${Y0 - 6} v${-H * 0.9} h12 v${H * 0.9}`} fill={LE} stroke={LE} strokeWidth={3} opacity={spikes * (1 - 0.6 * zoom)} />
        ) : null)}
        <text x={X0 + W} y={Y0 + 40} textAnchor="end" fill={C.faint} fontSize={20}>시간 → (산의 폭은 보이도록 키웠다)</text>
        <g opacity={zoom}>
          <rect x={900} y={250} width={820} height={330} rx={20} fill={C.panel} stroke="#24324a" strokeWidth={2} />
          <text x={930} y={295} fill={C.text} fontSize={26} fontWeight={800}>산 하나 (확대, 대표값)</text>
          {(() => {
            let x = 940; const total = SEG.reduce((n, s) => n + s[1], 0), sc = 740 / total;
            return SEG.map(([name, us, ma, col], i) => {
              const w = us * sc, h = ma * 40, el = (
                <g key={name} opacity={at(f, (cues[2] ?? 0) + i * 12)}>
                  <rect x={x} y={540 - h} width={w} height={h} fill={col} opacity={0.85} />
                  <text x={x + w / 2} y={565} textAnchor="middle" fill={C.dim} fontSize={18}>{name}</text>
                </g>
              );
              x += w; return el;
            });
          })()}
        </g>
        <Note x={200} y={720} w={1520} a={zoom} lines={[["수신·송신", "약 5 mA (0 dBm 송신 기준), 수면 1~3 µA. 막대 길이와 높이는 대표값"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 산의 넓이와 평균 */
const Charge: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), area = at(f, cues[0] + 15), fm = at(f, cues[1]), ex1 = at(f, cues[2]), ex2 = at(f, cues[3]);
  const a1 = averageCurrentUa(SLEEP, Q, 1), a2 = averageCurrentUa(SLEEP, Q, 0.1);
  return (
    <>
      <Title kicker="배터리를 정하는 것">산의 넓이 ÷ 간격 + 수면 전류</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={area}>
          <line x1={200} x2={900} y1={560} y2={560} stroke={C.faint} strokeWidth={2} />
          <path d="M260 554 H420 V300 H560 V554 H880" fill="none" stroke={LE} strokeWidth={4} />
          <rect x={420} y={300} width={140} height={254} fill={LE} opacity={0.35} />
          <text x={490} y={440} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900}>µC</text>
          <text x={490} y={280} textAnchor="middle" fill={LE} fontSize={24} fontWeight={800}>전류 × 시간 = 전하량</text>
        </g>
        <g opacity={fm}>
          <rect x={980} y={300} width={760} height={150} rx={22} fill={C.panel} stroke={WARN} strokeWidth={3} />
          <text x={1360} y={365} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>평균 전류 = 수면 전류 + 산의 넓이 ÷ 간격</text>
          <text x={1360} y={420} textAnchor="middle" fill={C.dim} fontSize={26}>수명 ≈ 전지 용량 ÷ 평균 전류</text>
        </g>
        <g opacity={ex1} transform="translate(200,640)">
          <text x={0} y={30} fill={C.text} fontSize={30} fontWeight={800}>1초마다: 2 + 15 ÷ 1 = {a1} µA</text>
          <rect x={720} y={0} width={800} height={44} rx={10} fill={OK} opacity={0.85} />
          <text x={1540} y={34} fill={OK} fontSize={30} fontWeight={900}>약 {lifeYears(a1).toFixed(1)}년</text>
        </g>
        <g opacity={ex2} transform="translate(200,740)">
          <text x={0} y={30} fill={C.text} fontSize={30} fontWeight={800}>100 ms마다: 2 + 15 ÷ 0.1 = {Math.round(a2)} µA</text>
          <rect x={720} y={0} width={800 * (a1 / a2)} height={44} rx={10} fill={BAD} opacity={0.85} />
          <text x={740 + 800 * (a1 / a2)} y={34} fill={BAD} fontSize={30} fontWeight={900}>약 {lifeMonths(a2).toFixed(0)}달</text>
        </g>
        <text x={200} y={850} fill={C.faint} fontSize={22} opacity={ex1}>CR2032 220 mAh, 수면 2 µA, 이벤트 한 번 15 µC (책 9장의 예)</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 수면 전류가 바닥 */
const Floor: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), X0 = 260, W = 1400, Y0 = 760, H = 440, I0 = 0.1, I1 = 100, YMAX = 14;
  const X = (s: number) => X0 + ((Math.log10(s) - Math.log10(I0)) / (Math.log10(I1) - Math.log10(I0))) * W, Y = (y: number) => Y0 - (y / YMAX) * H;
  const upto = interpolate(f, [10, cues[1] + 20], [I0, I1], { ...clamp, easing: (t) => t }), cap = lifeYears(SLEEP);
  const pts: string[] = []; for (let i = 0; i <= 160; i++) { const s = I0 * Math.pow(I1 / I0, i / 160); if (s > upto) break; pts.push(`${X(s).toFixed(1)},${Y(lifeYears(averageCurrentUa(SLEEP, Q, s))).toFixed(1)}`); }
  return (
    <>
      <Title kicker="수확 체감">간격을 늘려도 수면 전류가 한계를 정한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={X0} x2={X0 + W} y1={Y0} y2={Y0} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - H} stroke={C.faint} strokeWidth={2} />
        {[0.1, 1, 10, 100].map((s) => <text key={s} x={X(s)} y={Y0 + 34} textAnchor="middle" fill={C.faint} fontSize={22}>{s < 1 ? s * 1000 + " ms" : s + " s"}</text>)}
        {[0, 4, 8, 12].map((y) => <text key={y} x={X0 - 14} y={Y(y) + 8} textAnchor="end" fill={C.faint} fontSize={22}>{y}년</text>)}
        <text x={X0 + W} y={Y0 + 70} textAnchor="end" fill={C.dim} fontSize={22}>깨어나는 간격 (로그 눈금)</text>
        <polyline points={pts.join(" ")} fill="none" stroke={OK} strokeWidth={6} />
        <g opacity={at(f, cues[2])}>
          <line x1={X0} x2={X0 + W} y1={Y(cap)} y2={Y(cap)} stroke={BAD} strokeWidth={3} strokeDasharray="14 10" />
          <text x={X0 + 20} y={Y(cap) - 14} fill={BAD} fontSize={26} fontWeight={900}>한계: 220 mAh ÷ 2 µA ≈ {cap.toFixed(1)}년</text>
        </g>
        <text x={X0} y={850} fill={C.faint} fontSize={22}>수면 2 µA, 이벤트 15 µC, 220 mAh. 실제 전지는 자연 방전과 온도 영향도 받는다.</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 창 넓히기 */
const Widen: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), drift = at(f, cues[1]), num = at(f, cues[2]);
  const ww = windowWideningUs(500, 2e6) / 1000; // ms
  const X0 = 260, X1 = 1660, Y = 520, ax = 1300, px = 220;
  return (
    <>
      <Title kicker="오래 잘수록 숨은 비용">일찍 깨어 기다리는 시간 (창 넓히기)</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={X0} x2={X1} y1={Y} y2={Y} stroke={C.faint} strokeWidth={2} />
        <rect x={X0} y={Y - 50} width={20} height={50} fill={LE} />
        <text x={X0} y={Y + 40} fill={C.dim} fontSize={22}>마지막으로 맞춘 시각</text>
        <text x={(X0 + ax) / 2} y={Y - 20} textAnchor="middle" fill={C.faint} fontSize={30} fontWeight={800}>z z  2초 잠</text>
        <rect x={ax - 6} y={Y - 50} width={12} height={50} fill={LE} />
        <text x={ax} y={Y + 40} textAnchor="middle" fill={C.dim} fontSize={22}>상대가 보낼 시각</text>
        <g opacity={drift}>
          <rect x={ax - px} y={Y - 110} width={2 * px} height={60} rx={8} fill={CL} opacity={0.3} stroke={CL} strokeWidth={3} />
          <text x={ax} y={Y - 128} textAnchor="middle" fill={CL} fontSize={24} fontWeight={800}>내 시계가 틀렸을 수 있는 범위만큼 미리 듣기</text>
          <path d={`M${ax - px} ${Y - 80} H${ax - 10}`} stroke={WARN} strokeWidth={4} />
          <path d={`M${ax + 10} ${Y - 80} H${ax + px}`} stroke={WARN} strokeWidth={4} />
        </g>
        <g opacity={num}>
          <text x={ax - px / 2} y={Y - 60} textAnchor="middle" fill={WARN} fontSize={26} fontWeight={900}>약 {ww.toFixed(1)} ms</text>
          <text x={ax + px / 2} y={Y - 60} textAnchor="middle" fill={WARN} fontSize={26} fontWeight={900}>약 {ww.toFixed(1)} ms</text>
          <text x={X0} y={680} fill={C.text} fontSize={30} fontWeight={800}>2 s × 500 ppm + 16 µs = {Math.round(windowWideningUs(500, 2e6))} µs</text>
        </g>
        <Note x={X0} y={740} w={1400} a={drift} lines={[["ppm", "= 100만분의 1. 사양의 시계 오차 한도: 깨어 있을 때 ±50 ppm, 잘 때 ±500 ppm"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 묶어서 보내기 */
const Batch: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), X0 = 280, W = 1400, b = at(f, cues[1]), fixed = at(f, cues[2]);
  const t = interpolate(f, [10, len - 30], [0, 10], clamp), X = (s: number) => X0 + (s / 10) * W;
  return (
    <>
      <Title kicker="데이터는 묶어서">깨어나는 횟수가 고정 비용을 정한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {[[360, "1초마다 2바이트", 1, BAD], [600, "10초마다 20바이트", 10, OK]].map(([y, name, iv, col], k) => (
          <g key={k} opacity={k === 1 ? b : 1}>
            <text x={X0 - 24} y={(y as number) + 8} textAnchor="end" fill={col as string} fontSize={26} fontWeight={800}>{name as string}</text>
            <line x1={X0} x2={X0 + W} y1={y as number} y2={y as number} stroke={C.faint} strokeWidth={2} />
            {Array.from({ length: 10 / (iv as number) }, (_, i) => (i + 0.5) * (iv as number)).filter((s) => s <= t + 0.5).map((s) => (
              <g key={s}>
                <rect x={X(s)} y={(y as number) - 70} width={k === 1 ? 26 : 20} height={70} rx={3} fill={col as string} opacity={0.85} />
                <rect x={X(s)} y={(y as number) - 70} width={20} height={54} rx={3} fill="#56647c" opacity={fixed} />
              </g>
            ))}
            <text x={X0 + W + 20} y={(y as number) + 8} fill={col as string} fontSize={26} fontWeight={900} opacity={fixed}>깨어남 {10 / (iv as number)}번</text>
          </g>
        ))}
        <text x={X0} y={680} fill={C.faint} fontSize={22}>시간 → (10초). 회색 = 깨어날 때마다 붙는 고정 비용(기동·창 넓히기·처리)</text>
        <Note x={X0} y={720} w={1400} a={fixed} lines={[["", "보내는 양은 같다. 20바이트를 더 보내는 시간(1M에서 160 µs)은 고정 비용보다 작다. 대신 실시간성은 준다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <text x={960} y={200} textAnchor="middle" fill={C.text} fontSize={54} fontWeight={900} opacity={at(f, 10)}>깨어 있는 시간을 <tspan fill={OK}>짧게</tspan>, <tspan fill={OK}>드물게</tspan></text>
      <g opacity={at(f, 20)}>
        <line x1={260} x2={1660} y1={500} y2={500} stroke={C.faint} strokeWidth={2} />
        <path d="M260 494 H1660" stroke={OK} strokeWidth={6} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M${420 + i * 360} 494 v-200 h14 v200`} fill={LE} stroke={LE} strokeWidth={3} />)}
      </g>
      <g opacity={at(f, cues[1])}>
        <rect x={360} y={600} width={1200} height={130} rx={24} fill={C.panel} stroke={WARN} strokeWidth={4} />
        <text x={960} y={682} textAnchor="middle" fill={C.text} fontSize={40} fontWeight={900}>평균 전류 = 수면 전류 + 산의 넓이 ÷ 간격</text>
      </g>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "wave": return <Wave cues={s.cues} len={s.frames} />;
    case "charge": return <Charge cues={s.cues} />;
    case "floor": return <Floor cues={s.cues} len={s.frames} />;
    case "widen": return <Widen cues={s.cues} />;
    case "batch": return <Batch cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} />;
  }
};
export const Power = makeVideo("power", scenesFor, LEAD, body);
export { Coin, BoxDev };
