import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { parseHeartRate } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Caption, Title, clamp, fade, useFont } from "../afh/parts";
import { CL, LE, at, Chip } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 서비스 = 파랑, 특성 = 청록, 디스크립터 = 주황, 값 = 흐린 흰색 */
const SVC = LE, CHR = CL, DSC = C.warn, OK = C.ok;
type Kind = "svc" | "chr" | "val" | "dsc";
type Row = [number, string, string, Kind]; // [핸들, 종류, 설명, 역할]
const KCOL: Record<Kind, string> = { svc: SVC, chr: CHR, val: C.text, dsc: DSC };
const hx = (h: number) => "0x" + h.toString(16).toUpperCase().padStart(4, "0");

/** A사 = 책 7장 시뮬레이터의 심박계 GATT 서버 (gatt.html의 DB) */
const DB_A: Row[] = [
  [0x0001, "0x2800", "GAP 서비스 0x1800", "svc"],
  [0x0002, "0x2803", "특성 선언 → 기기 이름", "chr"],
  [0x0003, "0x2A00", "기기 이름 “HR Sensor”", "val"],
  [0x0004, "0x2800", "GATT 서비스 0x1801", "svc"],
  [0x0005, "0x2803", "특성 선언 → Service Changed", "chr"],
  [0x0006, "0x2A05", "Service Changed", "val"],
  [0x0007, "0x2902", "CCCD", "dsc"],
  [0x0008, "0x2800", "심박 서비스 0x180D", "svc"],
  [0x0009, "0x2803", "특성 선언 → 심박 측정값", "chr"],
  [0x000a, "0x2A37", "심박 측정값", "val"],
  [0x000b, "0x2902", "CCCD", "dsc"],
  [0x000c, "0x2803", "특성 선언 → 센서 위치", "chr"],
  [0x000d, "0x2A38", "센서 위치 (1 = 가슴)", "val"],
];
/** B사 = 예시: 앞에 배터리 서비스가 있어 심박 서비스의 칸 번호가 밀린 서버 */
const DB_B: Row[] = [
  [0x0001, "0x2800", "GAP 서비스 0x1800", "svc"],
  [0x0004, "0x2800", "GATT 서비스 0x1801", "svc"],
  [0x0008, "0x2800", "배터리 서비스 0x180F", "svc"],
  [0x000a, "0x2A19", "배터리 잔량", "val"],
  [0x000b, "0x2800", "심박 서비스 0x180D", "svc"],
  [0x000c, "0x2803", "특성 선언 → 심박 측정값", "chr"],
  [0x000d, "0x2A37", "심박 측정값", "val"],
  [0x000e, "0x2902", "CCCD", "dsc"],
];

/** 짧은 설명 상자(용어 풀이) */
const Note: React.FC<{ x: number; y: number; w: number; a: number; lines: [string, string][] }> = ({ x, y, w, a, lines }) => (
  <g opacity={a} fontFamily={FONT}>
    <rect x={x} y={y} width={w} height={28 + lines.length * 44} rx={18} fill={C.panel} stroke={C.warn} strokeWidth={3} />
    {lines.map(([k, v], i) => (
      <text key={i} x={x + 26} y={y + 52 + i * 44} fill={C.text} fontSize={26} fontWeight={700}><tspan fill={C.warn} fontWeight={900}>{k}</tspan>{k ? "  " : ""}{v}</text>
    ))}
  </g>
);

/* ---------------------------------------------------------------- 3D: 심박계(가슴 밴드)와 휴대폰 */
const PH_POS: Vec = [-13, 6.5, 0], HR_POS: Vec = [12, 6, 0];
export const PhoneApp3D: React.FC = () => (
  <group position={PH_POS} rotation={[-0.08, 0.32, 0]}>
    <mesh>
      <boxGeometry args={[6.4, 12.6, 0.7]} />
      <meshStandardMaterial color="#d9e2f0" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.36]}>
      <boxGeometry args={[5.8, 11.8, 0.02]} />
      <meshStandardMaterial color="#10203a" emissive="#10203a" emissiveIntensity={0.6} />
    </mesh>
  </group>
);
export const Strap3D: React.FC<{ led: number }> = ({ led }) => (
  <group position={HR_POS} rotation={[0.25, -0.5, 0]}>
    <mesh scale={[1.6, 0.55, 1]}>
      <torusGeometry args={[5, 0.45, 12, 64]} />
      <meshStandardMaterial color="#2a3550" roughness={0.8} />
    </mesh>
    <mesh position={[0, -2.7, 0.3]}>
      <boxGeometry args={[4.6, 2.6, 1.2]} />
      <meshStandardMaterial color="#e8edf6" metalness={0.3} roughness={0.35} />
    </mesh>
    <mesh position={[0, -2.7, 0.92]}>
      <circleGeometry args={[0.45, 24]} />
      <meshStandardMaterial color={C.bad} emissive={C.bad} emissiveIntensity={0.3 + 1.4 * led} />
    </mesh>
  </group>
);
const Stage: React.FC<{ cam: Cam; f: number; flow: number }> = ({ cam, f, flow }) => {
  const a: Vec = [HR_POS[0] - 4, 4, 0.5], b: Vec = [PH_POS[0] + 3.5, 6, 0.5], period = 30, t = (f % period) / period;
  return (
    <Scene3D cam={cam}>
      <fog attach="fog" args={[C.bg, 60, 160]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0d1729" />
      </mesh>
      <gridHelper args={[200, 100, "#24395a", "#172640"]} />
      <pointLight position={[0, 20, 16]} intensity={220} color="#9cc8ff" distance={70} />
      <PhoneApp3D />
      <Strap3D led={flow > 0 && t < 0.25 ? 1 : 0} />
      {flow > 0 && t < 0.7 && (
        <mesh position={[a[0] + (b[0] - a[0]) * (t / 0.7), a[1] + (b[1] - a[1]) * (t / 0.7) + Math.sin((t / 0.7) * Math.PI) * 2.5, 0.5]}>
          <sphereGeometry args={[0.55, 16, 12]} />
          <meshStandardMaterial color={C.bad} emissive={C.bad} emissiveIntensity={1.3} transparent opacity={flow} />
        </mesh>
      )}
    </Scene3D>
  );
};
export const AppScreen: React.FC<{ cam: Cam; bpm: number; a: number }> = ({ cam, bpm, a }) => {
  const [x, y] = project(cam, [PH_POS[0], PH_POS[1] + 1, 0.6]);
  return (
    <g opacity={a} fontFamily={FONT}>
      <text x={x} y={y - 30} textAnchor="middle" fill={C.dim} fontSize={22} fontWeight={700}>운동 앱</text>
      <text x={x} y={y + 40} textAnchor="middle" fill={C.bad} fontSize={64} fontWeight={900}>♥ {bpm}</text>
      <text x={x} y={y + 80} textAnchor="middle" fill={C.dim} fontSize={20}>bpm</text>
    </g>
  );
};

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), on = at(f, 30), q = at(f, cues[2]);
  const cam = camLerp({ pos: [-4, 15, 46], look: [0, 5, 0], fov: 40 }, { pos: [6, 17, 42], look: [0, 5, 0], fov: 40 }, f / len);
  const [sx, sy] = project(cam, [HR_POS[0], HR_POS[1] - 6, 0]);
  return (
    <>
      <Stage cam={cam} f={f} flow={on} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <AppScreen cam={cam} bpm={72 + (Math.floor(f / 30) % 3) - 1} a={on} />
        <text x={sx} y={sy + 40} textAnchor="middle" fill={C.dim} fontSize={26} fontWeight={700} opacity={at(f, cues[1])}>처음 보는 회사의 심박계</text>
        <text x={960} y={300} textAnchor="middle" fill={C.accent} fontSize={130} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 칸: 3D 서랍장 */
const SHOW: Row[] = DB_A.slice(7); // 심박 서비스 부분(0x0008 ~ 0x000D)
const DRAWER_H = 2.2;
const Cabinet: React.FC<{ cam: Cam; open: number }> = ({ cam, open }) => (
  <Scene3D cam={cam}>
    <fog attach="fog" args={[C.bg, 60, 160]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#0d1729" />
    </mesh>
    <gridHelper args={[200, 100, "#24395a", "#172640"]} />
    <pointLight position={[-6, 22, 18]} intensity={260} color="#9cc8ff" distance={70} />
    <mesh position={[-6, SHOW.length * DRAWER_H / 2 + 0.3, -1.6]}>
      <boxGeometry args={[11, SHOW.length * DRAWER_H + 0.8, 3]} />
      <meshStandardMaterial color="#1b2944" roughness={0.6} />
    </mesh>
    {SHOW.map((r, i) => {
      const y = (SHOW.length - i - 0.5) * DRAWER_H + 0.3, z = r[3] === "val" && r[1] === "0x2A37" ? 2.2 * open : 0;
      return (
        <mesh key={r[0]} position={[-6, y, z]}>
          <boxGeometry args={[10.2, DRAWER_H - 0.25, 0.5]} />
          <meshStandardMaterial color={KCOL[r[3]]} emissive={KCOL[r[3]]} emissiveIntensity={0.18} roughness={0.5} />
        </mesh>
      );
    })}
  </Scene3D>
);
const Cells: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), names = at(f, cues[1]), roles = at(f, cues[2]);
  const cam = camLerp({ pos: [8, 9, 42], look: [-1, 7.2, 0], fov: 40 }, { pos: [3, 9, 44], look: [-1, 7.2, 0], fov: 40 }, f / len);
  const open = interpolate(f, [cues[1] + 10, cues[1] + 40], [0, 1], clamp);
  return (
    <>
      <Cabinet cam={cam} open={open} />
      <Title kicker="데이터는 칸에">번호 붙은 칸, 이름표, 값</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {SHOW.map((r, i) => {
          const y = (SHOW.length - i - 0.5) * DRAWER_H + 0.3, [lx, ly] = project(cam, [-10.6, y, 0.3]), [rx, ry] = project(cam, [-1.2, y, 0.3]);
          return (
            <g key={r[0]}>
              <text x={lx} y={ly + 9} fill={C.bg} fontSize={24} fontWeight={900} opacity={at(f, 10 + i * 4)}>{hx(r[0])}</text>
              <text x={rx + 24} y={ry + 9} fill={C.text} fontSize={24} fontWeight={700} opacity={names}>{r[1]} · {r[2]}</text>
            </g>
          );
        })}
        <g opacity={roles}>
          <rect x={1420} y={420} width={420} height={130} rx={20} fill={C.panel} stroke={SVC} strokeWidth={3} />
          <text x={1450} y={470} fill={SVC} fontSize={30} fontWeight={900}>서버 = 심박계</text>
          <text x={1450} y={515} fill={C.dim} fontSize={24}>데이터를 가진 쪽</text>
          <rect x={1420} y={580} width={420} height={130} rx={20} fill={C.panel} stroke={CHR} strokeWidth={3} />
          <text x={1450} y={630} fill={CHR} fontSize={30} fontWeight={900}>클라이언트 = 휴대폰</text>
          <text x={1450} y={675} fill={C.dim} fontSize={24}>칸을 찾아 읽고 쓰는 쪽</text>
        </g>
        <Note x={110} y={800} w={1700} a={names} lines={[["핸들", "= 칸 번호(16비트)    UUID = 무엇이 들었는지 알려 주는 종류 이름표    값 = 최대 512바이트"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 메뉴판 표 */
const Menu: React.FC<{ x: number; y: number; rows: Row[]; a?: number; hl?: number; scan?: number; rowH?: number; w?: number; title?: string; showType?: boolean }> = ({ x, y, rows, a = 1, hl = -1, scan = -1, rowH = 44, w = 760, title, showType = true }) => (
  <g opacity={a} fontFamily={FONT}>
    {title && <text x={x} y={y - 18} fill={C.text} fontSize={30} fontWeight={900}>{title}</text>}
    <rect x={x} y={y} width={w} height={rows.length * rowH + 16} rx={16} fill={C.panel} stroke="#24324a" strokeWidth={2} />
    {rows.map((r, i) => {
      const ry = y + 8 + i * rowH, indent = r[3] === "svc" ? 0 : r[3] === "chr" ? 30 : 60;
      return (
        <g key={i}>
          {(i === hl || i === scan) && <rect x={x + 6} y={ry} width={w - 12} height={rowH - 4} rx={8} fill={i === hl ? OK : C.text} opacity={i === hl ? 0.22 : 0.1} />}
          <text x={x + 20} y={ry + rowH * 0.66} fill={C.faint} fontSize={22} fontWeight={700}>{hx(r[0])}</text>
          {showType && <text x={x + 140} y={ry + rowH * 0.66} fill={KCOL[r[3]]} fontSize={22} fontWeight={800}>{r[1]}</text>}
          <text x={x + (showType ? 250 : 140) + indent} y={ry + rowH * 0.66} fill={r[3] === "svc" ? SVC : C.text} fontSize={23} fontWeight={r[3] === "svc" ? 900 : 600}>{r[2]}</text>
        </g>
      );
    })}
  </g>
);

/* ---------------------------------------------------------------- 3. GATT 메뉴판 */
const MenuScene: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), grp = at(f, cues[1]), dsc = at(f, cues[2]);
  const rows = DB_A.slice(7), X = 160, Y = 280, H = 56;
  const brk = (i0: number, i1: number, col: string, label: string, a: number, dx: number) => (
    <g opacity={a}>
      <path d={`M${X + 900 + dx} ${Y + 8 + i0 * H + 6} h18 V${Y + 8 + (i1 + 1) * H - 10} h-18`} fill="none" stroke={col} strokeWidth={4} />
      <text x={X + 940 + dx} y={Y + 8 + ((i0 + i1 + 1) / 2) * H + 8} fill={col} fontSize={26} fontWeight={900}>{label}</text>
    </g>
  );
  return (
    <>
      <Title kicker="칸을 묶는 틀">GATT: 서비스 → 특성 → 디스크립터</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Menu x={X} y={Y} rows={rows} rowH={H} w={880} title="심박계의 메뉴판 (A사)" />
        {brk(0, 5, SVC, "서비스 = 분류", at(f, cues[0] + 15), 230)}
        {brk(1, 3, CHR, "특성 = 항목", grp, 0)}
        {brk(4, 5, CHR, "특성", grp, 0)}
        <g opacity={dsc}>
          <rect x={X + 6} y={Y + 8 + 3 * H} width={868} height={H - 4} rx={8} fill={DSC} opacity={0.18} />
          <text x={X + 560} y={Y + 8 + 3 * H + 36} fill={DSC} fontSize={24} fontWeight={900}>← 디스크립터 = 메모</text>
        </g>
        <Note x={160} y={680} w={1600} a={grp} lines={[["0x2800", "= 서비스 선언: 여기서부터 한 분류"], ["0x2803", "= 특성 선언: 다음 칸이 값, 할 수 있는 일(읽기·알림…)과 이름표"], ["0x2902", "= CCCD: “바뀌면 알려 줘”를 적는 메모 칸 (디스크립터)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 두 층: GATT 위에 서비스 사양 */
const Layers: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), top = at(f, cues[1]), tags = at(f, cues[2]);
  const slab = (y: number, h: number, col: string, a: number, title: string, sub: string, x = 260, w = 1400) => (
    <g opacity={a} transform={`translate(0,${(1 - a) * -30})`}>
      <path d={`M${x} ${y} l60 -40 h${w} l-60 40 Z`} fill={col} opacity={0.35} />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={col} opacity={0.22} stroke={col} strokeWidth={3} />
      <text x={x + 40} y={y + h / 2 - 4} fill={C.text} fontSize={34} fontWeight={900}>{title}</text>
      <text x={x + 40} y={y + h / 2 + 36} fill={C.dim} fontSize={24}>{sub}</text>
    </g>
  );
  return (
    <>
      <Title kicker="같은 메뉴판의 두 층">틀은 GATT, 항목은 서비스 사양</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {slab(620, 150, SVC, at(f, cues[0] + 10), "GATT · 메뉴판의 모양", "칸·서비스·특성·디스크립터, 찾기·읽기·쓰기·알림 (Core 사양 [Vol 3] Part G)")}
        {slab(420, 150, CHR, top, "심박 서비스 사양 · 항목 이름과 값 형식", "심박수는 어느 항목에, 어떤 바이트 모양으로 (Core 밖의 별도 사양)", 320, 900)}
        <g opacity={top}>
          <rect x={1290} y={440} width={330} height={56} rx={12} fill={C.panel} stroke="#3a4a66" strokeWidth={2} />
          <text x={1310} y={477} fill={C.dim} fontSize={22}>배터리 서비스 사양 …</text>
          <rect x={1290} y={510} width={330} height={56} rx={12} fill={C.panel} stroke="#3a4a66" strokeWidth={2} />
          <text x={1310} y={547} fill={C.dim} fontSize={22}>체중계 서비스 사양 …</text>
        </g>
        <g opacity={tags}>
          <Chip x={560} y={330} col={SVC} size={30}>심박 서비스 = 0x180D</Chip>
          <Chip x={1060} y={330} col={CHR} size={30}>심박 측정값 = 0x2A37</Chip>
          <text x={260} y={850} fill={C.dim} fontSize={24}>이름표(UUID)는 Bluetooth SIG가 번호로 정해 두었다. 회사가 따로 만드는 기능은 겹치지 않는 128비트 UUID를 쓴다.</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. A사와 B사 */
const HR_A = DB_A.findIndex((r) => r[1] === "0x2A37"), HR_B = DB_B.findIndex((r) => r[1] === "0x2A37");
const Two: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), diff = at(f, cues[1]), scanP = interpolate(f, [cues[2] + 10, len - 40], [0, 1], clamp);
  const rowsA = DB_A.slice(7), rowsB = DB_B.slice(4), XA = 120, XB = 1000, Y = 300, H = 56;
  const sA = Math.min(Math.floor(scanP * (HR_A - 7 + 1)), HR_A - 7), sB = Math.min(Math.floor(scanP * (HR_B - 4 + 1)), HR_B - 4), done = scanP > 0.98;
  return (
    <>
      <Title kicker="이름표는 같고, 칸 번호는 다르다">A사와 B사의 심박계</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Menu x={XA} y={Y} rows={rowsA} rowH={H} w={800} title="A사 심박계" scan={scanP > 0 && !done ? sA : -1} hl={done ? HR_A - 7 : -1} />
        <Menu x={XB} y={Y} rows={rowsB} rowH={H} w={800} title="B사 심박계 (예시)" scan={scanP > 0 && !done ? sB : -1} hl={done ? HR_B - 4 : -1} />
        {[[0, 0], [1, 1], [2, 2], [3, 3]].map(([ia, ib]) => (
          <line key={ia} x1={XA + 800} y1={Y + 8 + ia * H + H / 2} x2={XB} y2={Y + 8 + ib * H + H / 2} stroke={OK} strokeWidth={3} strokeDasharray="8 8" opacity={at(f, cues[0] + 10) * (1 - diff * 0.6)} />
        ))}
        <g opacity={diff}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={XA + 10} y={Y + 8 + i * H + 2} width={116} height={H - 8} rx={8} fill="none" stroke={C.warn} strokeWidth={3} />
              <rect x={XB + 10} y={Y + 8 + i * H + 2} width={116} height={H - 8} rx={8} fill="none" stroke={C.warn} strokeWidth={3} />
            </g>
          ))}
          <text x={960} y={Y + 8 + 4 * H + 60} textAnchor="middle" fill={C.warn} fontSize={28} fontWeight={900}>칸 번호(핸들)만 다르다</text>
        </g>
        <g opacity={done ? 1 : 0}>
          <text x={XA} y={720} fill={OK} fontSize={28} fontWeight={900}>✓ 심박 측정값 = {hx(DB_A[HR_A][0])} 칸</text>
          <text x={XB} y={720} fill={OK} fontSize={28} fontWeight={900}>✓ 심박 측정값 = {hx(DB_B[HR_B][0])} 칸</text>
        </g>
        <Note x={120} y={760} w={1680} a={at(f, cues[2])} lines={[["찾기", "= 서비스 찾기(0x2800 선언 모으기) → 그 안의 특성 찾기(0x2803 선언 모으기). 연결할 때 한 번 한다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 알림 켜기 */
const Notify: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), write = at(f, cues[0] + 15), bell = at(f, cues[1]), flow = at(f, cues[2]);
  const rows: Row[] = DB_A.slice(8, 11).map((r) => (r[1] === "0x2902" ? [r[0], r[1], write > 0.5 ? "CCCD = 01 00 (알림 켜짐)" : "CCCD = 00 00 (꺼짐)", r[3]] : r) as Row);
  const X = 120, Y = 300, H = 60;
  const T0 = cues[2] + 10, P = 30, n = Math.max(0, Math.floor((f - T0) / P) + 1);
  const bpms = [72, 73, 73, 74, 72, 71, 72, 73];
  return (
    <>
      <Title kicker="바뀌면 알려 줘">메모 칸(CCCD)에 0x0001을 쓰면 알림이 온다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Menu x={X} y={Y} rows={rows} rowH={H} w={820} hl={write > 0.5 ? 2 : -1} />
        <g opacity={write}>
          <rect x={1060} y={Y + 120} width={260} height={60} rx={12} fill={CHR} />
          <text x={1190} y={Y + 160} textAnchor="middle" fill={C.bg} fontSize={24} fontWeight={900}>쓰기: 01 00</text>
          <path d={`M1060 ${Y + 150} H${X + 830} M${X + 850} ${Y + 136} L${X + 830} ${Y + 150} L${X + 850} ${Y + 164}`} stroke={CHR} strokeWidth={4} fill="none" />
          <text x={1340} y={Y + 160} fill={C.dim} fontSize={22}>← 휴대폰(클라이언트)</text>
        </g>
        <g opacity={bell} transform="translate(1560,300)">
          <rect x={-70} y={-50} width={140} height={110} rx={28} fill={C.panel} stroke={C.warn} strokeWidth={4} />
          <circle cx={0} cy={5} r={26} fill={C.warn} opacity={0.4 + 0.6 * Math.abs(Math.sin(f / 4))} />
          <text x={0} y={100} textAnchor="middle" fill={C.warn} fontSize={24} fontWeight={800}>진동벨</text>
        </g>
        <g opacity={flow}>
          <text x={X} y={560} fill={C.text} fontSize={26} fontWeight={800}>심박계 → 휴대폰: 알림 (측정할 때마다)</text>
          <line x1={X} x2={1800} y1={630} y2={630} stroke={C.faint} strokeWidth={2} />
          {Array.from({ length: Math.min(n, 8) }, (_, i) => (
            <g key={i} transform={`translate(${X + 20 + i * 205},600)`}>
              <rect x={0} y={0} width={180} height={60} rx={10} fill={C.bad} opacity={0.85} />
              <text x={90} y={28} textAnchor="middle" fill="#fff" fontSize={20} fontWeight={800}>00 {bpms[i].toString(16).toUpperCase()}</text>
              <text x={90} y={52} textAnchor="middle" fill="#fff" fontSize={18}>♥ {bpms[i]}</text>
            </g>
          ))}
        </g>
        <Note x={X} y={710} w={1680} a={bell} lines={[["CCCD 0x2902", "에 0x0001 = 알림 켜기 (받았다는 확인 없이 계속 보냄)"], ["0x0002", "= 표시: 받았다는 확인을 기다리는 알림. 확인이 와야 다음을 보내서 연결 간격당 대략 하나"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 두 바이트 읽기 */
const Bytes: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), flag = at(f, cues[1]), val = at(f, cues[2]);
  const hr = parseHeartRate([0x00, 0x48]);
  const box = (x: number, txt: string, col: string, label: string) => (
    <g>
      <rect x={x} y={290} width={200} height={140} rx={18} fill={col} opacity={0.2} stroke={col} strokeWidth={4} />
      <text x={x + 100} y={385} textAnchor="middle" fill={C.text} fontSize={72} fontWeight={900}>{txt}</text>
      <text x={x + 100} y={470} textAnchor="middle" fill={col} fontSize={26} fontWeight={800}>{label}</text>
    </g>
  );
  return (
    <>
      <Title kicker="도착한 값">00 48 → 심박수 72</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, 10)}>{box(560, "00", C.warn, "플래그")}{box(800, "48", C.bad, "심박수")}</g>
        <g opacity={flag}>
          <text x={260} y={570} fill={C.text} fontSize={26} fontWeight={800}>플래그 0x00의 비트</text>
          {Array.from({ length: 8 }, (_, i) => {
            const bit = 7 - i, x = 260 + i * 90;
            return (
              <g key={i}>
                <rect x={x} y={600} width={76} height={76} rx={10} fill={bit === 0 ? C.warn : "#1b2840"} opacity={bit === 0 ? 0.35 : 1} stroke={bit === 0 ? C.warn : "#2a3b58"} strokeWidth={3} />
                <text x={x + 38} y={652} textAnchor="middle" fill={C.text} fontSize={34} fontWeight={900}>0</text>
                <text x={x + 38} y={700} textAnchor="middle" fill={C.faint} fontSize={18}>비트 {bit}</text>
              </g>
            );
          })}
          <text x={1000} y={652} fill={C.warn} fontSize={26} fontWeight={800}>비트 0 = 0 → 심박수는 1바이트</text>
        </g>
        <g opacity={val}>
          <text x={1150} y={360} fill={C.text} fontSize={44} fontWeight={900}>0x48 = 4 × 16 + 8 = {hr.bpm}</text>
          <text x={1150} y={440} fill={C.bad} fontSize={80} fontWeight={900}>♥ {hr.bpm} bpm</text>
        </g>
        <Note x={260} y={740} w={1400} a={flag} lines={[["플래그", "비트 0: 0이면 심박수 1바이트, 1이면 2바이트 · 비트 1~2: 피부 접촉 · 비트 4: RR 간격 포함"], ["", "이 형식은 Core가 아니라 심박 서비스(Heart Rate Service) 사양이 정한다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 8. 정리 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame();
  const cam = camLerp({ pos: [6, 19, 44], look: [0, 8.5, 0], fov: 40 }, { pos: [-4, 20, 46], look: [0, 8.5, 0], fov: 40 }, f / len);
  const items: [string, string, string][] = [["같은 틀", "GATT", SVC], ["같은 이름표", "UUID (SIG가 정한 번호)", CHR], ["같은 형식", "서비스 사양", C.warn]];
  return (
    <>
      <Stage cam={cam} f={f} flow={1} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <AppScreen cam={cam} bpm={72} a={1} />
        <rect x={160} y={90} width={1600} height={120} rx={26} fill={C.bg} opacity={0.88} />
        <text x={960} y={170} textAnchor="middle" fill={C.text} fontSize={50} fontWeight={900} opacity={at(f, 10)}>처음 보는 기기끼리도 통하는 이유</text>
        {items.map(([k, v, col], i) => (
          <g key={k} opacity={at(f, 10 + i * 15)} transform={`translate(${300 + i * 460},235)`}>
            <rect x={0} y={0} width={400} height={110} rx={22} fill={C.bg} opacity={0.9} stroke={col} strokeWidth={4} />
            <text x={30} y={52} fill={col} fontSize={32} fontWeight={900}>{k}</text>
            <text x={30} y={94} fill={C.text} fontSize={24} fontWeight={700}>{v}</text>
          </g>
        ))}
        <g opacity={at(f, cues[1])}>
          <rect x={960} y={790} width={800} height={80} rx={20} fill={C.bg} opacity={0.9} stroke={OK} strokeWidth={3} />
          <text x={1360} y={842} textAnchor="middle" fill={OK} fontSize={30} fontWeight={900}>칸 번호만 다르다 → 연결할 때 한 번 찾기</text>
        </g>
      </svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "cells": return <Cells cues={s.cues} len={s.frames} />;
    case "menu": return <MenuScene cues={s.cues} />;
    case "layers": return <Layers cues={s.cues} />;
    case "two": return <Two cues={s.cues} len={s.frames} />;
    case "notify": return <Notify cues={s.cues} len={s.frames} />;
    case "bytes": return <Bytes cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};

const SceneFrame: React.FC<{ s: Timed; voice: boolean }> = ({ s, voice }) => {
  const f = useCurrentFrame(), k = s.cues.filter((c) => c <= f).length - 1;
  return (
    <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
      {body(s)}
      {voice && (
        <Sequence from={LEAD} layout="none">
          <Audio src={staticFile(`audio/gatt/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const Gatt: React.FC<{ voice: boolean }> = ({ voice }) => {
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
