import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { ah, bookRng } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project, Dots } from "../range/hook3d";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { Packet3D } from "../common/deep3d";
import { SchedStage, SchedCam } from "../scheduling/Scheduling";
import { D7 } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 이어폰 = 분홍, 휴대폰 = 파랑, 비밀 키 = 인디고, 무작위 절반 = 회색, 계산 절반 = 주황, 추적 = 빨강 */
const BD = "#f472b6", PH = C.accent, KEY = DEEP, RND = "#94a3b8", HSH = C.warn, BAD = C.bad, OK = C.ok;
const IRK = (D7.irk.match(/../g) || []).map((x) => parseInt(x, 16));
const OTHER_IRK = IRK.map((b, i) => (i % 3 ? b ^ 0x3c : b)); // 다른 기기의 키(예)
const h6 = (v: number) => v.toString(16).padStart(6, "0").toUpperCase();
const addr = (prand: number, hash: number) => (h6(prand) + h6(hash)).match(/../g)!.join(":");
const rnd = bookRng(8);
const PRANDS = [D7.prand, ...Array.from({ length: 3 }, () => 0x400000 | (Math.floor(rnd() * 0x3ffffe) + 1))];
const RPA = PRANDS.map((p) => ({ p, h: ah(IRK, p) }));
const FIXED = "C4:7E:21:9A:03:5B"; // 바뀌지 않는 주소의 예

/** 이어폰 한 쌍(걸어가는 사람의 귀에 있는 것으로) */
const Pair: React.FC<{ p: Vec }> = ({ p }) => <><Earbud3D p={[p[0] - 0.9, p[1] + 3.6, p[2]]} ry={-1.2} s={0.9} /><Earbud3D p={[p[0] + 0.9, p[1] + 3.6, p[2]]} ry={1.9} s={0.9} /></>;

/* ---------------------------------------------------------------- 1. 훅 (3D): 길목마다 기록하는 수신기 */
const POSTS: Vec[] = [[-20, 0, -4], [0, 0, -6], [20, 0, -4]];
const Post: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.35, 0.5, 6, 12]} /><meshStandardMaterial color="#5b6b88" /></mesh>
    <mesh position={[0, 6.6, 0]}><sphereGeometry args={[0.9, 16, 12]} /><meshStandardMaterial color={BAD} emissive={BAD} emissiveIntensity={0.6} /></mesh>
  </group>
);
const Hook: React.FC<{ cues: number[]; len: number; budX?: number }> = ({ cues, len, budX }) => {
  const f = useCurrentFrame(), cam: Cam = camLerp({ pos: [-10, 24, 50], look: [0, 3, 0], fov: 40 }, { pos: [8, 26, 48], look: [0, 3, 0], fov: 40 }, f / len);
  const bx = budX ?? interpolate(f, [0, len], [-28, 18], clamp), bud: Vec = [bx, 0, 8], show = at(f, cues[1]), log = at(f, cues[2]);
  const near = POSTS.map((p) => Math.abs(p[0] - bx) < 9);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        {POSTS.map((p, i) => <Post key={i} p={p} />)}
        <Pair p={bud} />
        {POSTS.map((p, i) => <Dots key={i} a={[bx, 3.5, 8]} b={[p[0], 6.6, p[2]]} f={f + i * 7} col={BD} on={near[i] ? show : 0} n={5} speed={0.05} />)}
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {(() => { const [x, y] = project(cam, [bx, 0, 11]); return <text x={x} y={y + 30} textAnchor="middle" fill={BD} fontSize={26} fontWeight={800} opacity={show}>{FIXED}</text>; })()}
        <g opacity={log} transform="translate(1340,140)">
          <rect x={0} y={0} width={460} height={200} rx={18} fill={C.panel} stroke={BAD} strokeWidth={3} />
          <text x={24} y={44} fill={BAD} fontSize={24} fontWeight={900}>길목 기록</text>
          {["08:01  역 앞", "08:15  회사 앞", "12:30  식당"].map((t, i) => <text key={i} x={24} y={88 + i * 36} fill={C.text} fontSize={22} fontFamily="monospace">{t}  {FIXED.slice(0, 8)}…</text>)}
        </g>
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={log}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 공통: 48비트 주소 막대 */
const AddrBar: React.FC<{ x: number; y: number; prand: number; hash: number; a?: number; ok?: boolean | null }> = ({ x, y, prand, hash, a = 1, ok = null }) => (
  <g opacity={a} transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={420} height={70} rx={10} fill={RND} opacity={0.9} />
    <text x={210} y={44} textAnchor="middle" fill={C.bg} fontSize={26} fontWeight={900} fontFamily="monospace">{h6(prand)}</text>
    <rect x={430} y={0} width={420} height={70} rx={10} fill={HSH} opacity={0.9} />
    <text x={640} y={44} textAnchor="middle" fill={C.bg} fontSize={26} fontWeight={900} fontFamily="monospace">{h6(hash)}</text>
    {ok !== null && <text x={880} y={46} fill={ok ? OK : BAD} fontSize={28} fontWeight={900}>{ok ? "✓ 맞음" : "✗ 다름"}</text>}
  </g>
);

/* ---------------------------------------------------------------- 2. 바꿔 쓰는 주소 (RPA, 3D 거리) */
const STREET: Vec[] = [[-20, 0, -4], [0, 0, -6], [20, 0, -4]];
const Rpa: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = { pos: [0, 20, 46], look: [0, 4, 0], fov: 40 };
  const bx = interpolate(f, [cues[1] - 20, len - 20], [-28, 26], clamp), seg = bx < -10 ? 0 : bx < 10 ? 1 : 2, r = RPA[seg + 1];
  const parts = at(f, 10), seen = (i: number) => (bx > STREET[i][0] - 2 ? 1 : 0), many = at(f, cues[2]);
  const [tx, ty] = project(cam, [bx, 7.5, 6]);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        {STREET.map((p, i) => <Post key={i} p={p} />)}
        <Pair p={[bx, 0, 6]} />
        {STREET.map((p, i) => <Packet3D key={i} f={f} t0={(STREET[i][0] + 28) / 54 * (len - 20 - (cues[1] - 20)) + cues[1] - 30} t1={(STREET[i][0] + 28) / 54 * (len - 20 - (cues[1] - 20)) + cues[1]} a={[STREET[i][0] - 2, 4, 6]} b={[p[0], 6.6, p[2]]} col={BD} size={0.6} arc={1} />)}
      </Scene3D>
      <Title kicker="RPA: 해석 가능한 임의 주소">주소를 가면처럼 바꿔 쓴다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={parts} transform="translate(560,190)">
          <AddrBar x={0} y={0} prand={RPA[0].p} hash={RPA[0].h} />
          <text x={210} y={100} textAnchor="middle" fill={RND} fontSize={22} fontWeight={800}>무작위 절반 (prand)</text>
          <text x={640} y={100} textAnchor="middle" fill={HSH} fontSize={22} fontWeight={800}>비밀 키로 계산한 절반 (hash)</text>
        </g>
        <g opacity={at(f, cues[1])} transform={`translate(${tx - 160},${ty - 30}) scale(0.38)`}><AddrBar x={0} y={0} prand={r.p} hash={r.h} /></g>
        {STREET.map((p, i) => { const [x, y] = project(cam, [p[0], 0, p[2]]); const rr = RPA[i + 1]; return <g key={i} opacity={seen(i) * at(f, cues[1])}><rect x={x - 120} y={y + 20} width={240} height={46} rx={10} fill={C.panel} stroke={many > 0.5 ? OK : RND} strokeWidth={3} /><text x={x} y={y + 51} textAnchor="middle" fill={C.text} fontSize={20} fontFamily="monospace" fontWeight={800}>{addr(rr.p, rr.h).slice(0, 11)}…</text></g>; })}
        <text x={960} y={870} textAnchor="middle" fill={OK} fontSize={30} fontWeight={900} opacity={many}>길목마다 다른 주소 → 서로 다른 기기로 보인다</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 휴대폰은 알아본다 */
const Resolve: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), give = at(f, cues[1]), calc = at(f, cues[2]), chip = at(f, cues[3]);
  const mine = RPA[2], other = { p: 0x5a3c21, h: ah(OTHER_IRK, 0x5a3c21) };
  return (
    <>
      <Title kicker="해석">비밀 키를 가진 휴대폰만 알아본다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={give} transform="translate(200,240)">
          <rect x={0} y={0} width={640} height={110} rx={18} fill={C.panel} stroke={KEY} strokeWidth={3} />
          <text x={24} y={44} fill={KEY} fontSize={26} fontWeight={900}>페어링 때 이어폰 → 휴대폰</text>
          <text x={24} y={86} fill={C.text} fontSize={22} fontFamily="monospace">IRK {D7.irk.slice(0, 16).toUpperCase()}… + 신원 주소</text>
        </g>
        <g opacity={calc}>
          <text x={200} y={420} fill={C.text} fontSize={26} fontWeight={900}>받은 주소</text>
          <AddrBar x={200} y={440} prand={mine.p} hash={mine.h} />
          <text x={200} y={560} fill={C.dim} fontSize={22}>ah(내가 받은 IRK, {h6(mine.p)}) = {h6(ah(IRK, mine.p))} → 아래 절반과 비교</text>
          <AddrBar x={200} y={580} prand={mine.p} hash={ah(IRK, mine.p)} ok={ah(IRK, mine.p) === mine.h} />
          <text x={1180} y={480} fill={OK} fontSize={30} fontWeight={900}>“내 이어폰이구나”</text>
          <text x={200} y={710} fill={C.text} fontSize={24} fontWeight={800}>다른 기기의 주소</text>
          <AddrBar x={200} y={730} prand={other.p} hash={other.h} ok={ah(IRK, other.p) === other.h} />
        </g>
        <Note x={200} y={830} w={1520} a={chip} col={KEY} lines={[["해석 목록", "= 블루투스 칩(컨트롤러)이 가진 {상대 신원 주소, 상대 IRK} 목록. 칩이 주소를 풀고 걸러 낸다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 바꾸는 시각 */
const When: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 300, W = 1320, T = 60, X = (m: number) => X0 + (m / T) * W;
  const fixed = [0, 15, 30, 45, 60], r = bookRng(21), rand: number[] = [0]; while (rand[rand.length - 1] < T) rand.push(rand[rand.length - 1] + 8 + r() * 7);
  const row = (y: number, ts: number[], a: number, label: string, col: string) => (
    <g opacity={a}>
      <text x={X0 - 20} y={y + 30} textAnchor="end" fill={col} fontSize={24} fontWeight={800}>{label}</text>
      {ts.filter((t) => t < T).map((t, i) => { const e = Math.min(T, ts[i + 1] ?? T); return <rect key={i} x={X(t) + 2} y={y} width={X(e) - X(t) - 4} height={46} rx={8} fill={["#64748b", "#475569"][i % 2]} />; })}
      {ts.filter((t) => t > 0 && t < T).map((t, i) => <line key={i} x1={X(t)} x2={X(t)} y1={y - 10} y2={y + 56} stroke={col} strokeWidth={3} />)}
    </g>
  );
  return (
    <>
      <Title kicker="언제 바꾸나">바꾸는 시각이 일정하면 짝지을 수 있다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {row(300, fixed, at(f, cues[0] + 10), "정확히 15분마다", BAD)}
        <text x={X0} y={400} fill={BAD} fontSize={24} fontWeight={800} opacity={at(f, cues[1])}>사라진 시각 = 나타난 시각, 15분 간격 → 같은 기기로 짝지어진다</text>
        {row(500, rand, at(f, cues[2]), "8~15분 무작위", OK)}
        {[0, 15, 30, 45, 60].map((m) => <text key={m} x={X(m)} y={610} textAnchor="middle" fill={C.faint} fontSize={20}>{m}분</text>)}
        <Note x={X0} y={680} w={W} a={at(f, cues[2])} col={KEY} lines={[["6.1부터", "RPA 갱신 시각을 최소·최대 범위에서 무작위로(HCI [v2], 기본 8~15분). GAP 권장 최대 간격은 15분"]]} />
        <text x={X0} y={830} fill={C.dim} fontSize={20} opacity={at(f, cues[2])}>무작위 줄은 예시(난수 씨앗 고정)</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 광고 내용도 함께 (3D 거리) */
const Data: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam: Cam = { pos: [0, 20, 46], look: [0, 4, 0], fov: 40 };
  const fixed = f < cues[2], t0 = fixed ? 10 : cues[2], t1 = fixed ? cues[2] - 10 : len - 20;
  const bx = interpolate(f, [t0, t1], [-28, 26], clamp), tag = at(f, cues[1]);
  const SN = fixed ? ["7F3A-91C2", "7F3A-91C2", "7F3A-91C2"] : ["2C81-E04B", "9D17-5A6F", "41BE-0C93"];
  const pts = STREET.map((p) => project(cam, [p[0], 0, p[2]]));
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        {STREET.map((p, i) => <Post key={i} p={p} />)}
        <Pair p={[bx, 0, 6]} />
      </Scene3D>
      <Title kicker="주소만으로는 부족하다">바뀌지 않는 광고 내용이 이름표가 된다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {STREET.map((p, i) => { const [x, y] = pts[i]; const rr = RPA[i + 1]; const vis = bx > p[0] - 2 ? 1 : 0; const bad = fixed && tag > 0.5; return (
          <g key={i} opacity={vis}>
            <rect x={x - 130} y={y + 20} width={260} height={96} rx={12} fill={C.panel} stroke={bad ? BAD : RND} strokeWidth={3} />
            <text x={x} y={y + 52} textAnchor="middle" fill={C.dim} fontSize={18} fontFamily="monospace">주소 {addr(rr.p, rr.h).slice(0, 8)}…</text>
            <text x={x} y={y + 90} textAnchor="middle" fill={bad ? BAD : OK} fontSize={22} fontFamily="monospace" fontWeight={900}>번호 {SN[i]}</text>
          </g>); })}
        {fixed && tag > 0.5 && bx > STREET[2][0] - 2 && <path d={`M${pts[0][0]} ${pts[0][1] + 125} Q${(pts[0][0] + pts[2][0]) / 2} ${pts[0][1] + 200} ${pts[2][0]} ${pts[2][1] + 125} M${pts[1][0]} ${pts[1][1] + 125} V${pts[1][1] + 168}`} stroke={BAD} strokeWidth={4} strokeDasharray="10 8" fill="none" />}
        <text x={960} y={250} textAnchor="middle" fill={fixed ? BAD : OK} fontSize={30} fontWeight={900} opacity={fixed ? tag : 1}>{fixed ? "늘 같은 번호 → 세 기록이 한 사람으로 이어진다" : "주소를 바꿀 때 번호도 함께 → 이어 붙일 단서가 없다"}</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SchedCam[1], { pos: [16, 20, 44], look: [-4, 4, 2], fov: 40 }, f / len);
  const L: [string, string][] = [["주소를 가면처럼 바꿔 쓴다", "RPA = 무작위 절반 + 비밀 키로 계산한 절반"], ["페어링한 휴대폰만 알아본다", "IRK로 계산해 맞으면 내 기기"], ["바꾸는 시각과 광고 내용도 함께", "무작위 시각, 고정 식별자 없애기"]];
  return (
    <>
      <SchedStage cam={cam} f={f} watch={0} others={1} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.5} />
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
    case "rpa": return <Rpa cues={s.cues} len={s.frames} />;
    case "resolve": return <Resolve cues={s.cues} />;
    case "when": return <When cues={s.cues} />;
    case "data": return <Data cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Privacy = makeVideo("privacy", scenesFor, LEAD, body);
export { Hook as PrivacyHook };
