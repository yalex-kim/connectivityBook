import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { databaseHash, gattDb, robust, type RobustState } from "../book";
import { camLerp } from "../afh/world3d";
import { Title } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { DEEP, Note, makeVideo } from "../common/kit";
import { SchedStage, SchedCam } from "../scheduling/Scheduling";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 기기 = 청록, 바뀐 것 = 주황, 오류 = 빨강 */
const PH = C.accent, DV = C.accent2, CHG = C.warn, BAD = C.bad, OK = C.ok;
const hx = (a: number[], n = 16) => a.slice(0, n).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
const h4 = (v: number) => "0x" + v.toString(16).padStart(4, "0").toUpperCase();
const BEFORE = gattDb(), AFTER = gattDb({ insert: true });
const HR = BEFORE.find((a) => a.label === "심박 측정값")!.handle; // 0x0010
const H0 = databaseHash(BEFORE).hash;

/* ---------------------------------------------------------------- 1. 훅: 카페 메뉴판 (3D 위에) */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[0], SchedCam[1], f / len), swap = at(f, cues[1] + 40), fw = at(f, cues[2]), q = at(f, cues[3]);
  const menu = ["아메리카노", "카페라테", swap > 0.5 ? "자몽 에이드" : "바닐라라테", "녹차"];
  return (
    <>
      <SchedStage cam={cam} f={f} watch={1} others={0} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, cues[1])} transform="translate(120,150)">
          <rect x={0} y={0} width={460} height={330} rx={20} fill="#2a2016" stroke="#c8a46e" strokeWidth={4} />
          <text x={230} y={56} textAnchor="middle" fill="#f3dfb8" fontSize={34} fontWeight={900}>MENU</text>
          {menu.map((m, i) => (
            <g key={i}>
              <text x={40} y={116 + i * 52} fill={i === 2 && swap > 0.5 ? CHG : "#f3dfb8"} fontSize={30} fontWeight={800}>{i + 1}. {m}</text>
              {i === 2 && <rect x={24} y={84 + i * 52} width={412} height={46} rx={10} fill="none" stroke={swap > 0.5 ? CHG : "#c8a46e"} strokeWidth={3} />}
            </g>
          ))}
          <text x={230} y={316} textAnchor="middle" fill={C.dim} fontSize={22} opacity={swap}>“늘 먹던 3번이요” → 다른 음료</text>
        </g>
        <g opacity={fw} transform="translate(1340,170)">
          <rect x={0} y={0} width={440} height={86} rx={43} fill={C.panel} stroke={CHG} strokeWidth={3} />
          <text x={220} y={56} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={900}>펌웨어 업데이트 ↻</text>
        </g>
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 공통: 데이터베이스 표 */
const Table: React.FC<{ x: number; y: number; db: typeof BEFORE; title: string; col: string; mark?: number; markCol?: string; a?: number; rows?: number }> = ({ x, y, db, title, col, mark, markCol = PH, a = 1, rows = 22 }) => (
  <g opacity={a} transform={`translate(${x},${y})`}>
    <text x={0} y={0} fill={col} fontSize={28} fontWeight={900}>{title}</text>
    {db.slice(0, rows).map((r, i) => {
      const svc = r.type === 0x2800, hit = r.handle === mark;
      return (
        <g key={i} transform={`translate(0,${22 + i * 27})`}>
          {hit && <rect x={-8} y={-2} width={560} height={27} rx={6} fill={markCol} opacity={0.3} stroke={markCol} strokeWidth={2} />}
          <text x={0} y={19} fill={C.dim} fontSize={18} fontFamily="monospace">{h4(r.handle)}</text>
          <text x={110} y={19} fill={svc ? C.text : C.dim} fontSize={svc ? 20 : 18} fontWeight={svc ? 900 : 600}>{svc ? r.label : "  " + r.label}</text>
        </g>
      );
    })}
  </g>
);

/* ---------------------------------------------------------------- 2. 기억해 둔 칸 번호 */
const Cache: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), shift = at(f, cues[1]), wrong = at(f, cues[2]);
  const wrongLabel = AFTER.find((r) => r.handle === HR)!.label;
  return (
    <>
      <Title kicker="칸 번호(핸들) 캐싱">기억해 둔 번호가 엉뚱한 칸을 가리키면</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Table x={180} y={230} db={BEFORE} title="업데이트 전" col={DV} mark={HR} />
        <Table x={1040} y={230} db={AFTER} title="업데이트 후 (예: 배터리 서비스를 앞에 끼움)" col={CHG} mark={HR} markCol={wrong > 0.5 ? BAD : PH} a={shift} />
        <g opacity={at(f, 20)} transform="translate(740,420)">
          <rect x={0} y={0} width={240} height={110} rx={18} fill={C.panel} stroke={PH} strokeWidth={3} />
          <text x={120} y={44} textAnchor="middle" fill={C.dim} fontSize={20}>휴대폰의 기억</text>
          <text x={120} y={86} textAnchor="middle" fill={PH} fontSize={24} fontWeight={900}>심박 = {h4(HR)}</text>
        </g>
        <g opacity={wrong}>
          <text x={1040} y={880} fill={BAD} fontSize={28} fontWeight={900}>{h4(HR)}을 읽으면 → {wrongLabel}</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 메뉴판의 지문 */
const Hash: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), make = at(f, 15), read = at(f, cues[1]), cmp = at(f, cues[2]);
  const H1 = databaseHash(AFTER).hash, m = databaseHash(BEFORE).m;
  return (
    <>
      <Title kicker="Database Hash (0x2B2A)">메뉴판의 지문</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={make} transform="translate(200,250)">
          <rect x={0} y={0} width={560} height={180} rx={18} fill={C.panel} stroke={DV} strokeWidth={3} />
          <text x={24} y={44} fill={DV} fontSize={26} fontWeight={900}>선언들을 핸들 순서로 이어 붙임</text>
          <text x={24} y={90} fill={C.dim} fontSize={18} fontFamily="monospace">{m.slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join(" ")}</text>
          <text x={24} y={120} fill={C.dim} fontSize={18} fontFamily="monospace">{m.slice(16, 32).map((b) => b.toString(16).padStart(2, "0")).join(" ")} …</text>
          <text x={24} y={160} fill={C.dim} fontSize={20}>({m.length}바이트)</text>
          <path d="M580 90 H700" stroke={C.faint} strokeWidth={4} />
          <rect x={700} y={40} width={250} height={100} rx={18} fill="#1b2840" stroke={DEEP} strokeWidth={3} />
          <text x={825} y={84} textAnchor="middle" fill={DEEP} fontSize={26} fontWeight={900}>AES-CMAC</text>
          <text x={825} y={118} textAnchor="middle" fill={C.dim} fontSize={20}>키 = 0</text>
          <path d="M970 90 H1090" stroke={C.faint} strokeWidth={4} />
          <text x={1110} y={82} fill={C.text} fontSize={26} fontWeight={900} fontFamily="monospace">{hx(H0, 8)}</text>
          <text x={1110} y={118} fill={C.text} fontSize={26} fontWeight={900} fontFamily="monospace">{hx(H0.slice(8), 8)}</text>
          <text x={1110} y={156} fill={C.dim} fontSize={20}>128비트 지문</text>
        </g>
        <g opacity={read} transform="translate(200,520)">
          <text x={0} y={0} fill={PH} fontSize={28} fontWeight={900}>휴대폰: 연결하면 지문만 읽는다</text>
          {[["업데이트 전", H0, true], ["업데이트 후", H1, false]].map(([k, h, same], i) => (
            <g key={i} transform={`translate(0,${40 + i * 120})`} opacity={i === 0 ? 1 : cmp}>
              <rect x={0} y={0} width={1500} height={96} rx={16} fill={C.panel} stroke={same ? OK : CHG} strokeWidth={3} />
              <text x={30} y={58} fill={C.text} fontSize={26} fontWeight={800}>{k as string}</text>
              <text x={260} y={58} fill={C.text} fontSize={24} fontFamily="monospace">읽은 지문 {hx(h as number[], 8)}…</text>
              <text x={760} y={58} fill={C.dim} fontSize={24} fontFamily="monospace">기억한 지문 {hx(H0, 8)}…</text>
              <text x={1470} y={58} textAnchor="end" fill={same ? OK : CHG} fontSize={28} fontWeight={900}>{same ? "같음 → 그대로 씀" : "다름 → 다시 훑음"}</text>
            </g>
          ))}
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 무엇이 지문을 바꾸나 */
const What: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const rows: [string, string, number[], number][] = [
    ["처음", "", H0, 0],
    ["기기 이름 값 바꾸기", "My Band → My Band 2", databaseHash(gattDb({ name: true })).hash, cues[1]],
    ["서비스 더하기", "배터리 서비스 추가", databaseHash(gattDb({ bat: true })).hash, cues[2]],
    ["항목의 성질 바꾸기", "심박 측정값에 Read 추가", databaseHash(gattDb({ prop: true })).hash, cues[2] + 30],
  ];
  return (
    <>
      <Title kicker="지문에 들어가는 것">구성이 바뀌면 지문이 바뀐다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {rows.map(([k, sub, h, c], i) => {
          const same = hx(h) === hx(H0);
          return (
            <g key={i} opacity={at(f, c || 10)} transform={`translate(200,${250 + i * 140})`}>
              <rect x={0} y={0} width={1520} height={112} rx={18} fill={C.panel} stroke={i === 0 ? C.faint : same ? OK : CHG} strokeWidth={3} />
              <text x={30} y={50} fill={C.text} fontSize={30} fontWeight={900}>{k}</text>
              <text x={30} y={88} fill={C.dim} fontSize={22}>{sub}</text>
              <text x={640} y={68} fill={C.text} fontSize={28} fontFamily="monospace">{hx(h)}</text>
              {i > 0 && <text x={1490} y={68} textAnchor="end" fill={same ? OK : CHG} fontSize={30} fontWeight={900}>{same ? "그대로" : "바뀜"}</text>}
            </g>
          );
        })}
        <Note x={200} y={820} w={1520} a={at(f, cues[1])} col={DEEP} lines={[["들어가는 것", "= 서비스·특성 선언과 그 값(속성·핸들·UUID), 일부 디스크립터의 핸들·타입. 특성의 값(이름, 심박수)은 안 들어간다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. Robust Caching: 0x12 */
const Robust: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X1 = 420, X2 = 1500;
  let st: RobustState = { aware: true, errSent: false, hashRead: false };
  const steps: [string, string, number][] = [];
  const run = (ev: string, who: string, c: number) => { const r = robust(st, ev); st = r.st; steps.push([who, r.rsp, c]); };
  run("change", "기기: 펌웨어 업데이트 (메뉴판 바뀜)", 10);
  run("req", `휴대폰 → ${h4(HR)} 읽기 요청 (기억해 둔 번호)`, cues[1]);
  run("hash", "휴대폰 → 지문 읽기 (기억 버리고 다시 훑기 시작)", cues[2]);
  run("req", "휴대폰 → 새로 찾은 번호로 읽기 요청", cues[2] + 40);
  const st2: RobustState = { aware: false, errSent: false, hashRead: false };
  const cmd = robust(st2, "cmd");
  return (
    <>
      <Title kicker="Robust Caching">바뀐 뒤 옛 번호로 묻으면, 오류로 알려 준다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={X1} y={230} textAnchor="middle" fill={PH} fontSize={30} fontWeight={900}>휴대폰</text>
        <text x={X2} y={230} textAnchor="middle" fill={DV} fontSize={30} fontWeight={900}>기기</text>
        <line x1={X1} x2={X1} y1={250} y2={780} stroke={PH} strokeWidth={3} strokeDasharray="6 8" />
        <line x1={X2} x2={X2} y1={250} y2={780} stroke={DV} strokeWidth={3} strokeDasharray="6 8" />
        {steps.map(([who, rsp, c], i) => {
          const y = 270 + i * 140, a = at(f, c), err = rsp.includes("0x12");
          return (
            <g key={i} opacity={a}>
              {i === 0 && <text x={X2 - 20} y={y + 10} textAnchor="end" fill={CHG} fontSize={24} fontWeight={800}>{who}</text>}
              {i > 0 && <>
                <text x={(X1 + X2) / 2} y={y - 12} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={700}>{who.replace("휴대폰 → ", "")}</text>
                <path d={`M${X1} ${y} H${X2 - 16} M${X2 - 30} ${y - 10} L${X2 - 14} ${y} L${X2 - 30} ${y + 10}`} stroke={PH} strokeWidth={3} fill="none" />
                <path d={`M${X2} ${y + 44} H${X1 + 16} M${X1 + 30} ${y + 34} L${X1 + 14} ${y + 44} L${X1 + 30} ${y + 54}`} stroke={err ? BAD : OK} strokeWidth={3} fill="none" />
                <text x={(X1 + X2) / 2} y={y + 78} textAnchor="middle" fill={err ? BAD : OK} fontSize={22} fontWeight={900}>{rsp}</text>
              </>}
            </g>
          );
        })}
        <g opacity={at(f, cues[3])} transform="translate(420,800)">
          <rect x={0} y={0} width={1080} height={76} rx={16} fill={C.panel} stroke={CHG} strokeWidth={3} />
          <text x={30} y={48} fill={C.text} fontSize={24} fontWeight={800}>바뀐 걸 모르는 동안 쓰기 명령(응답 없음) → 기기: {cmd.rsp}</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["기억한 칸 번호를 쓰되, 지문부터 확인", "Database Hash: 같으면 그대로, 다르면 다시"], ["지문이 다르거나 오류(0x12)면", "기억을 버리고 다시 훑는다"], ["펌웨어가 바뀌어도", "엉뚱한 칸을 읽지 않는다"]];
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
    case "cache": return <Cache cues={s.cues} />;
    case "hash": return <Hash cues={s.cues} />;
    case "what": return <What cues={s.cues} />;
    case "robust": return <Robust cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const GattCache = makeVideo("gattcache", scenesFor, LEAD, body);
