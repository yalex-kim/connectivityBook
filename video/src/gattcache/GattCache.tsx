import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { databaseHash, gattDb } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D, Watch3D } from "../connection/Connection";
import { DEEP, Ground, Note, makeVideo } from "../common/kit";
import { FingerGrid, Packet3D, Shelf3D, packetPos, type Drawer } from "../common/deep3d";
import { SchedStage, SchedCam } from "../scheduling/Scheduling";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 기기 = 청록, 바뀐 것 = 주황, 오류 = 빨강. 서랍 색 = 서비스 */
const PH = C.accent, DV = C.accent2, CHG = C.warn, BAD = C.bad, OK = C.ok;
const h4 = (v: number) => "0x" + v.toString(16).padStart(4, "0").toUpperCase();
const BEFORE = gattDb(), AFTER = gattDb({ insert: true });
const HR = BEFORE.find((a) => a.label === "심박 측정값")!.handle; // 0x0010
const H0 = databaseHash(BEFORE).hash;
const SVC_COL: Record<string, string> = { "GAP 서비스": "#475569", "GATT 서비스": "#3b4f72", "심박 서비스": "#0e7490", "배터리 서비스": "#b45309" };
const drawers = (db: typeof BEFORE): Drawer[] => { let col = "#475569"; return db.map((a) => { if (a.type === 0x2800) col = SVC_COL[a.label]; return { key: a.label + (a.type === 0x2800 ? "#s" : ""), col, glow: a.type === 0x2800 ? 0.35 : 0.12 }; }); };
const D0 = drawers(BEFORE), D1 = drawers(AFTER);
const IDX_HR = BEFORE.findIndex((a) => a.handle === HR); // 같은 높이 = 같은 칸 번호
const RowH = 0.62;

/** 휴대폰·기기를 x 위치에 놓는다(Phone3D는 x=−12, Watch3D는 x=12에 그려지는 모형) */
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const WatchAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x - 12, 0, z]}><Watch3D /></group>;
const Spin: React.FC<{ p: Vec; f: number }> = ({ p, f }) => <mesh position={p} rotation={[0, 0, f * 0.08]}><torusGeometry args={[1.4, 0.25, 10, 30, Math.PI * 1.6]} /><meshStandardMaterial color={CHG} emissive={CHG} emissiveIntensity={1} /></mesh>;

/* ---------------------------------------------------------------- 1. 훅: 카페 메뉴판 (3D) */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[0], SchedCam[1], f / len), show = at(f, cues[1]), swap = at(f, cues[1] + 50), fw = at(f, cues[2]), q = at(f, cues[3]);
  const board: Vec = [-22, 9, -6], rows = ["아메리카노", "카페라테", swap > 0.5 ? "자몽 에이드" : "바닐라라테", "녹차"];
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={0} /><WatchAt x={15} />
        {show > 0 && (
          <group position={board}>
            <mesh><boxGeometry args={[12, 9, 0.5]} /><meshStandardMaterial color="#2a2016" /></mesh>
            <mesh position={[0, -7, -0.3]}><cylinderGeometry args={[0.3, 0.3, 6, 10]} /><meshStandardMaterial color="#5b4630" /></mesh>
            {rows.map((_, i) => <mesh key={i} position={[0, 2.6 - i * 1.8, 0.3]}><boxGeometry args={[10, 1.3, 0.1]} /><meshStandardMaterial color={i === 2 && swap > 0.5 ? CHG : "#3b2c1c"} emissive={i === 2 && swap > 0.5 ? CHG : "#000000"} emissiveIntensity={0.5} /></mesh>)}
          </group>
        )}
        {fw > 0 && <Spin p={[15, 9.5, 0]} f={f} />}
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={show}>{rows.map((r, i) => { const [x, y] = project(cam, [board[0] - 4.6, board[1] + 2.6 - i * 1.8, board[2] + 0.4]); return <text key={i} x={x} y={y + 9} fill={i === 2 && swap > 0.5 ? "#fff" : "#f3dfb8"} fontSize={28} fontWeight={800}>{i + 1}. {r}</text>; })}</g>
        {(() => { const [x, y] = project(cam, [15, 12.2, 0]); return <text x={x} y={y} textAnchor="middle" fill={CHG} fontSize={28} fontWeight={900} opacity={fw}>펌웨어 업데이트</text>; })()}
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 서랍 선반이 밀린다 (3D) */
const SHELF: Vec = [7, 13.5, 0];
const Cache: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), k = interpolate(f, [cues[1] + 10, cues[1] + 70], [0, 1], clamp), wrong = at(f, cues[2]);
  const cam: Cam = camLerp({ pos: [-12, 12, 42], look: [-2, 7.5, 0], fov: 42 }, { pos: [-6, 11, 40], look: [-1, 7.5, 0], fov: 42 }, f / len);
  const beamY = SHELF[1] - IDX_HR * RowH, beam = at(f, 15);
  const hitKey = wrong > 0.5 ? D1[IDX_HR].key : undefined;
  const lab = (p: Vec, t: string, col: string, a = 1, anchor: "start" | "end" = "start", size = 24) => { const [x, y] = project(cam, p); return <text x={x} y={y + 8} textAnchor={anchor} fill={col} fontSize={size} fontWeight={800} opacity={a}>{t}</text>; };
  const batY = SHELF[1] - D1.findIndex((d) => d.key === "배터리 서비스#s") * RowH;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 22, 14]} />
        <PhoneAt x={-19} z={-3} />
        <Shelf3D p={SHELF} from={D0} to={D1} k={k} h={RowH} hit={hitKey} />
        {beam > 0 && <mesh position={[-6, beamY, -1]} rotation={[0, 0.12, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 19, 8]} /><meshStandardMaterial color={wrong > 0.5 ? BAD : PH} emissive={wrong > 0.5 ? BAD : PH} emissiveIntensity={1.4} transparent opacity={beam} /></mesh>}
      </Scene3D>
      <Title kicker="칸 번호(핸들) 캐싱">기억해 둔 번호, 밀려난 서랍</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab([-16, beamY + 2.6, -3], `기억: 심박 = ${h4(HR)}`, PH, beam, "start", 26)}
        {lab([SHELF[0] + 4, beamY, 1], k < 0.5 ? "심박 측정값" : wrong > 0.5 ? "배터리 잔량 ✕" : "", k < 0.5 ? DV : BAD, 1, "start", 26)}
        {lab([SHELF[0] - 4, beamY, 1], h4(HR), C.text, beam, "end", 22)}
        {lab([SHELF[0] + 4, batY, 1], "← 끼어든 배터리 서비스", CHG, k)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 지문 (선반 → AES-CMAC → 4×4 격자) */
const Hash: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), make = at(f, 30), read = at(f, cues[1]), cmp = at(f, cues[2]);
  const H1 = databaseHash(AFTER).hash;
  const cam: Cam = { pos: [-4, 10, 34], look: [-2, 6, 0], fov: 40 };
  const flowK = interpolate(f, [20, 90], [0, 1], clamp);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <Shelf3D p={[-16, 12, 0]} from={D0} h={0.5} w={5} />
        <mesh position={[-3, 6, 0]} rotation={[0.3, 0.6, 0]}><boxGeometry args={[4, 4, 4]} /><meshStandardMaterial color={DEEP} emissive={DEEP} emissiveIntensity={0.4 + 0.4 * Math.sin(f * 0.2)} /></mesh>
        {flowK > 0 && flowK < 1 && Array.from({ length: 6 }, (_, i) => { const t = (flowK * 3 + i / 6) % 1; return <mesh key={i} position={[-12.5 + t * 9.5, 6 + Math.sin(t * Math.PI) * 1.5, 0]}><boxGeometry args={[0.6, 0.3, 0.6]} /><meshStandardMaterial color={DV} emissive={DV} emissiveIntensity={1} /></mesh>; })}
      </Scene3D>
      <Title kicker="Database Hash">메뉴판의 지문</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {(() => { const [x, y] = project(cam, [-3, 3, 2.5]); return <text x={x} y={y + 40} textAnchor="middle" fill={DEEP} fontSize={26} fontWeight={900} opacity={make}>AES-CMAC</text>; })()}
        <FingerGrid x={1120} y={300} size={200} bytes={H0} a={make} border={DV} />
        <text x={1220} y={540} textAnchor="middle" fill={C.dim} fontSize={22} opacity={make}>128비트 지문</text>
        <g opacity={read}>
          <FingerGrid x={1240} y={720} size={110} bytes={H0} border={PH} />
          <text x={1295} y={880} textAnchor="middle" fill={PH} fontSize={22} fontWeight={800}>기억한 지문</text>
          <FingerGrid x={1430} y={720} size={110} bytes={cmp > 0.5 ? H1 : H0} border={cmp > 0.5 ? CHG : OK} />
          <text x={1485} y={880} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={800}>읽은 지문</text>
          <text x={1600} y={790} fill={cmp > 0.5 ? CHG : OK} fontSize={34} fontWeight={900}>{cmp > 0.5 ? "≠ 다시 훑기" : "= 그대로"}</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 무엇이 지문을 바꾸나 (그림 비교) */
const MiniShelf: React.FC<{ extra?: boolean; prop?: boolean; name?: boolean }> = ({ extra, prop, name }) => {
  const rows: string[] = ["#475569", "#475569", "#3b4f72", "#3b4f72", "#0e7490", "#0e7490", ...(extra ? ["#b45309", "#b45309"] : [])];
  return (
    <g>
      {rows.map((c, i) => <rect key={i} x={0} y={i * 26} width={150} height={22} rx={5} fill={c} stroke={(i === 0 && name) || (i === 5 && prop) || (extra && i >= 6) ? (i === 0 ? OK : CHG) : "none"} strokeWidth={4} />)}
      {name && <circle cx={135} cy={11} r={6} fill="#fff" />}
      {prop && <rect x={-12} y={5 * 26 - 3} width={8} height={28} fill={CHG} />}
    </g>
  );
};
const What: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const cols: [string, React.ReactNode, number[], number, string][] = [
    ["처음", <MiniShelf key="a" />, H0, 10, C.faint],
    ["이름 값만 바꿈", <MiniShelf key="b" name />, databaseHash(gattDb({ name: true })).hash, cues[1], OK],
    ["서비스 추가", <MiniShelf key="c" extra />, databaseHash(gattDb({ bat: true })).hash, cues[2], CHG],
    ["성질 하나 바꿈", <MiniShelf key="d" prop />, databaseHash(gattDb({ prop: true })).hash, cues[2] + 30, CHG],
  ];
  return (
    <>
      <Title kicker="지문에 들어가는 것">구성이 바뀌면 지문이 바뀐다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {cols.map(([k, shelf, h, c, col], i) => (
          <g key={i} opacity={at(f, c)} transform={`translate(${200 + i * 400},280)`}>
            <text x={110} y={0} textAnchor="middle" fill={col === C.faint ? C.text : col} fontSize={28} fontWeight={900}>{k}</text>
            <g transform="translate(35,40)">{shelf}</g>
            <path d="M110 270 V310" stroke={C.faint} strokeWidth={4} />
            <FingerGrid x={20} y={330} size={180} bytes={h} border={col} />
            {i > 0 && <text x={110} y={565} textAnchor="middle" fill={col} fontSize={30} fontWeight={900}>{col === OK ? "그대로" : "바뀜"}</text>}
          </g>
        ))}
        <Note x={200} y={820} w={1520} a={at(f, cues[1])} col={DEEP} lines={[["지문에 들어가는 것", "= 서비스·특성 선언(구성). 특성의 값(이름, 심박수)은 안 들어간다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. Robust Caching: 패킷이 오간다 (3D) */
const RP: Vec = [-12, 7, 2], RD: Vec = [12, 5, 0];
const Robust: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [0, 16, 40], look: [0, 5, 0], fov: 40 }, { pos: [4, 18, 38], look: [0, 5, 0], fov: 40 }, f / len);
  const c1 = cues[1], c2 = cues[2], c3 = cues[3];
  const upd = at(f, 10), memo = f < c2 ? 1 : interpolate(f, [c2, c2 + 30], [1, 0], clamp), memoY = f < c2 ? 0 : interpolate(f, [c2, c2 + 30], [0, -6], clamp);
  const lab = (p: Vec, t: string, col: string, a: number, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y - 26} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
  const p1 = packetPos(f, c1 - 50, c1, RP, RD), p2 = packetPos(f, c1 + 5, c1 + 45, RD, RP), p4 = packetPos(f, c2 + 50, c2 + 90, RP, RD), p5 = packetPos(f, c2 + 95, c2 + 135, RD, RP), p6 = packetPos(f, c3 + 5, c3 + 50, RP, RD);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 20, 14]} />
        <PhoneAt x={-14} z={2} /><WatchAt x={14} />
        {upd > 0 && <Spin p={[14, 9.5, 0]} f={f} />}
        {memo > 0 && <mesh position={[-8, 12 + memoY, 2]} rotation={[0, 0.3, memoY * 0.2]}><boxGeometry args={[3, 2, 0.15]} /><meshStandardMaterial color={PH} emissive={PH} emissiveIntensity={0.4} transparent opacity={memo} /></mesh>}
        <Packet3D f={f} t0={c1 - 50} t1={c1} a={RP} b={RD} col={PH} />
        <Packet3D f={f} t0={c1 + 5} t1={c1 + 45} a={RD} b={RP} col={BAD} />
        {f > c2 + 10 && f < c2 + 50 && Array.from({ length: 5 }, (_, i) => <Packet3D key={i} f={f} t0={c2 + 10 + i * 6} t1={c2 + 30 + i * 6} a={RP} b={RD} col={DV} size={0.5} arc={3} />)}
        <Packet3D f={f} t0={c2 + 50} t1={c2 + 90} a={RP} b={RD} col={PH} />
        <Packet3D f={f} t0={c2 + 95} t1={c2 + 135} a={RD} b={RP} col={OK} />
        <Packet3D f={f} t0={c3 + 5} t1={c3 + 50} a={RP} b={RD} col={C.warn} drop />
      </Scene3D>
      <Title kicker="Robust Caching">바뀐 뒤 옛 번호로 물으면, 오류로 알려 준다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {(() => { const [x, y] = project(cam, [-8, 13.5, 2]); return <text x={x} y={y} textAnchor="middle" fill={PH} fontSize={24} fontWeight={800} opacity={memo}>기억: {h4(HR)}</text>; })()}
        {lab(p1, `${h4(HR)} 읽기`, PH, f >= c1 - 50 && f < c1 + 5 ? 1 : 0)}
        {lab(p2, "오류 0x12", BAD, f >= c1 + 5 && f < c1 + 70 ? 1 : 0, 30)}
        {lab([-2, 9, 1], "다시 훑기", DV, f > c2 + 10 && f < c2 + 50 ? 1 : 0)}
        {lab(p4, "새 번호로 읽기", PH, f >= c2 + 50 && f < c2 + 95 ? 1 : 0)}
        {lab(p5, "정상 응답", OK, f >= c2 + 95 && f < c2 + 160 ? 1 : 0)}
        {lab(p6, "쓰기 명령 (응답 없음)", C.warn, f >= c3 + 5 && f < c3 + 50 ? 1 : 0)}
        {(() => { const [x, y] = project(cam, [12, 1, 0]); return <text x={x} y={y + 40} textAnchor="middle" fill={C.warn} fontSize={28} fontWeight={900} opacity={at(f, c3 + 45)}>→ 조용히 버려짐</text>; })()}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["기억한 칸 번호를 쓰되, 지문부터 확인", "같으면 그대로, 다르면 다시 훑기"], ["지문이 다르거나 오류(0x12)면", "기억을 버리고 다시 훑는다"], ["펌웨어가 바뀌어도", "엉뚱한 칸을 읽지 않는다"]];
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.45} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${240 + i * 160})`}>
            <rect x={0} y={0} width={960} height={124} rx={22} fill={C.panel} stroke={i === 2 ? OK : DEEP} strokeWidth={3} opacity={0.95} />
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
    case "cache": return <Cache cues={s.cues} len={s.frames} />;
    case "hash": return <Hash cues={s.cues} />;
    case "what": return <What cues={s.cues} />;
    case "robust": return <Robust cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const GattCache = makeVideo("gattcache", scenesFor, LEAD, body);
