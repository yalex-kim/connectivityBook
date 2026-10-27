import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { Key3D, Listener3D, Packet3D } from "../common/deep3d";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰 = 파랑, 상대 기기 = 청록, 짧은 공유 비밀(PIN·TK) = 주황, 각자의 비밀 = 인디고, 공개 값 = 회색, 열쇠 = 초록, 끼어든 쪽·실패 = 빨강 */
const PH = C.accent, HS = C.accent2, PIN = C.warn, OWN = DEEP, PUB = "#94a3b8", KEY = C.ok, BAD = C.bad;
const PP: Vec = [-14, 7, 2], HP: Vec = [14, 4, 0], LIS: Vec = [0, 0, -9];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const mat = (col: string, glow = 0, op = 1) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} transparent={op < 1} opacity={op} />;
/** 옛 헤드셋(귀걸이형 본체 + 마이크 막대) */
const Headset: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p} scale={1.5}>
    <mesh><capsuleGeometry args={[1.1, 2.4, 8, 16]} />{mat("#cbd5e1", 0.1)}</mesh>
    <mesh position={[0, -2.6, 0.6]} rotation={[0.5, 0, 0]}><cylinderGeometry args={[0.18, 0.18, 2.4, 10]} />{mat("#94a3b8")}</mesh>
    <mesh position={[0, 1.6, 0.9]}><sphereGeometry args={[0.25, 10, 8]} />{mat(HS, 1.2)}</mesh>
  </group>
);
/** LE 기기(동전형 태그) */
const Tag: React.FC<{ p: Vec }> = ({ p }) => <mesh position={p}><cylinderGeometry args={[1.6, 1.6, 0.7, 28]} />{mat(HS, 0.4)}</mesh>;
/** 이어폰 한 쌍(새 모형) */
const Buds: React.FC<{ p: Vec }> = ({ p }) => <><Earbud3D p={[p[0] - 1.3, p[1], p[2]]} ry={-1.2} s={1.3} /><Earbud3D p={[p[0] + 1.3, p[1], p[2]]} ry={1.9} s={1.3} /></>;
/** 기기 안의 비밀(작은 빛 상자) */
const Secret: React.FC<{ p: Vec; col: string; s?: number }> = ({ p, col, s = 1 }) => <mesh position={p} rotation={[0.4, 0.6, 0]} scale={s}><boxGeometry args={[1.2, 1.2, 1.2]} />{mat(col, 1)}</mesh>;
/** 끼어든 기기(가운데) */
const Mitm: React.FC<{ p: Vec; a?: number }> = ({ p, a = 1 }) => (
  <group position={p}>
    <mesh position={[0, 2.5, 0]}><boxGeometry args={[3, 5, 0.6]} />{mat("#3f1d24", 0.2, a)}</mesh>
    <mesh position={[0, 2.5, 0.32]}><boxGeometry args={[2.6, 4.4, 0.02]} />{mat(BAD, 0.5, a)}</mesh>
  </group>
);
const CAM: Cam = { pos: [0, 15, 48], look: [0, 5, -2], fov: 40 };
const lab = (cam: Cam, p: Vec, t: string, col: string, a = 1, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
const Stage: React.FC<{ cam: Cam; children?: React.ReactNode; listener?: boolean; peer?: "headset" | "tag" | "buds" | "none" }> = ({ cam, children, listener, peer = "headset" }) => (
  <Scene3D cam={cam}>
    <Ground />
    <PhoneAt x={PP[0] - 2} z={PP[2]} />
    {peer === "headset" && <Headset p={HP} />}
    {peer === "tag" && <Tag p={[HP[0], 0.4, HP[2]]} />}
    {peer === "buds" && <Buds p={[HP[0], 3.4, HP[2]]} />}
    {listener && <Listener3D p={LIS} />}
    {children}
  </Scene3D>
);
const Card: React.FC<{ x: number; y: number; w: number; title: string; sub?: string; col: string; a?: number }> = ({ x, y, w, title, sub, col, a = 1 }) => (
  <g opacity={a} transform={`translate(${x},${y})`}>
    <rect x={0} y={0} width={w} height={sub ? 96 : 60} rx={14} fill={C.panel} stroke={col} strokeWidth={3} />
    <text x={20} y={38} fill={col} fontSize={24} fontWeight={900}>{title}</text>
    {sub && <text x={20} y={76} fill={C.dim} fontSize={20}>{sub}</text>}
  </g>
);
/** 화면의 6자리(값 대신 자리만) */
const SixBox: React.FC<{ x: number; y: number; col?: string; a?: number; bad?: boolean }> = ({ x, y, col = KEY, a = 1, bad = false }) => (
  <g opacity={a}><rect x={x - 130} y={y - 46} width={260} height={92} rx={16} fill={C.panel} stroke={bad ? BAD : col} strokeWidth={3} />
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={x - 108 + i * 37} y={y - 22} width={28} height={44} rx={6} fill={bad && i % 2 ? BAD : col} opacity={0.85} />)}</g>
);

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [4, 18, 40], look: [0, 5, -1], fov: 40 }, f / len), pin = at(f, cues[1]), q = at(f, cues[2]);
  const typed = Math.min(4, Math.max(0, Math.floor((f - cues[1]) / 12)));
  const [sx, sy] = project(cam, [PP[0] - 2, 7, PP[2] + 0.5]);
  return (
    <>
      <Stage cam={cam} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <SixBox x={sx} y={sy} a={1 - pin} />
        <g opacity={pin}>
          <rect x={sx - 130} y={sy - 90} width={260} height={180} rx={16} fill={C.panel} stroke={PIN} strokeWidth={3} />
          <text x={sx} y={sy - 44} textAnchor="middle" fill={PIN} fontSize={26} fontWeight={900}>PIN 입력</text>
          <text x={sx} y={sy + 20} textAnchor="middle" fill={C.text} fontSize={48} fontWeight={900} letterSpacing={10}>{"●".repeat(typed) + "○".repeat(4 - typed)}</text>
        </g>
        {lab(cam, [HP[0], 0, HP[2]], "옛 헤드셋", HS, 1, 50)}
        <text x={960} y={150} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 막아야 할 셋 */
const Three: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [0, 20, 44], look: [0, 4, -3], fov: 40 }, f / len), items = at(f, cues[1]), focus = at(f, cues[2]);
  const T1: Vec = [-6, 0, -9], T2: Vec = [0, 0, 2], T3: Vec = [7, 0, -16];
  return (
    <>
      <Stage cam={cam}>
        {items > 0 && <Listener3D p={T1} />}
        {items > 0 && <group position={T2} scale={items}><Mitm p={[0, 0, 0]} a={1} /></group>}
        {items > 0 && <Listener3D p={T3} col="#a78bfa" />}
      </Stage>
      <Title kicker="막아야 할 셋">엿듣기 · 끼어들기 · 따라다니기</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [T1[0], 6.6, T1[2]], "① 엿듣기", BAD, items, -40, 30)}
        {lab(cam, [T2[0], 5, T2[2]], "② 끼어들기", BAD, items, -30, 30)}
        {lab(cam, [T3[0], 6.6, T3[2]], "③ 따라다니기", "#a78bfa", items * (1 - 0.6 * focus), -40, 30)}
        {lab(cam, [T3[0], 0, T3[2]], "→ 심화 6편", C.dim, focus, 60, 24)}
        {lab(cam, [0, 0, 6], "이번 영상: ①·②를 막는 페어링", KEY, focus, 60, 30)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3·4. 레거시 (Classic ≤ 2.0, LE 4.0) */
const Legacy: React.FC<{ cues: number[]; len: number; le?: boolean }> = ({ cues, len, le = false }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-3, 18, 40], look: [0, 5, -2], fov: 40 }, f / len), mix = le ? 20 : cues[1], guess = le ? at(f, cues[1]) : at(f, cues[2]);
  const peerS: Vec = le ? [19, 3, 0] : [19, 6, 0], peerK: Vec = le ? [17, 7, 0] : [17, 10, 0], PEER: Vec = le ? [HP[0], 0.8, HP[2]] : HP;
  return (
    <>
      <Stage cam={cam} listener peer={le ? "tag" : "headset"}>
        <Secret p={[-9, 7, 3]} col={PIN} /><Secret p={peerS} col={PIN} />
        <Packet3D f={f} t0={mix - 10} t1={mix + 30} a={PP} b={PEER} col={PUB} />
        <Packet3D f={f} t0={mix + 5} t1={mix + 45} a={PEER} b={PP} col={PUB} />
        <Packet3D f={f} t0={mix} t1={mix + 40} a={[0, 7, 1]} b={[LIS[0], 6.6, LIS[2]]} col={PUB} size={0.6} arc={0.5} />
        {f > mix + 50 && <><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={peerK} col={KEY} s={0.8} /></>}
        {guess > 0 && <Key3D p={[-2, 9.5, -9]} col={KEY} s={0.7} opacity={0.35 + 0.3 * Math.sin(f * 0.3) ** 2} />}
      </Stage>
      <Title kicker={le ? "LE 레거시 페어링 (4.0)" : "Classic 레거시 페어링 (≤ 2.0)"}>{le ? "LE도 처음엔 같은 구조" : "두 기기가 나눈 비밀은 PIN 하나"}</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-9, 7, 3], le ? "TK" : "PIN", PIN, 1, -30)}
        {lab(cam, peerS, le ? "TK (0 또는 6자리)" : "PIN", PIN, 1, -30, 22)}
        {lab(cam, [0, 8, 1], "무작위 값 · 주소 (공중)", PUB, at(f, mix) * (1 - at(f, mix + 70)), -20)}
        {lab(cam, [-9, 11, 3], le ? "열쇠 = TK + 무작위 값" : "열쇠 = PIN + 주소 + 무작위 값", KEY, at(f, mix + 50), -40, 22)}
        {lab(cam, [LIS[0], 6.6, LIS[2]], "엿들은 사람", BAD, 1, -40)}
        {lab(cam, [-2, 9.5, -9], le ? "공개 키가 없어 같은 약점" : "PIN이 짧으면 짐작해 볼 수 있다", BAD, guess, -40, 24)}
        {le ? null : <Note x={360} y={830} w={1200} a={at(f, cues[1])} col={PIN} lines={[["레거시 Classic", "= PIN + SAFER+ 기반 E22·E21로 키, E1로 장치 인증, E0 스트림 암호"]]} />}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. SSP: 각자의 비밀, 공개 값만 */
const Ssp: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [3, 18, 40], look: [0, 5, -2], fov: 40 }, f / len), ex = cues[1], no = at(f, cues[2]);
  return (
    <>
      <Stage cam={cam} listener>
        <Secret p={[-9, 7, 3]} col={OWN} /><Secret p={[19, 6, 0]} col={OWN} s={0.8} />
        <Packet3D f={f} t0={ex - 10} t1={ex + 30} a={PP} b={HP} col={PUB} />
        <Packet3D f={f} t0={ex + 5} t1={ex + 45} a={HP} b={PP} col={PUB} />
        <Packet3D f={f} t0={ex} t1={ex + 40} a={[0, 7, 1]} b={[LIS[0], 6.6, LIS[2]]} col={PUB} size={0.6} arc={0.5} />
        {f > ex + 50 && <><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 10, 0]} col={KEY} s={0.8} /></>}
      </Stage>
      <Title kicker="Secure Simple Pairing (Classic 2.1)">각자의 비밀 값, 공개 값만 주고받는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-9, 7, 3], "휴대폰만 아는 비밀", OWN, 1, -30, 24)}
        {lab(cam, [19, 6, 0], "헤드셋만 아는 비밀", OWN, 1, -30, 24)}
        {lab(cam, [0, 8, 1], "공개 값 (공중)", PUB, at(f, ex) * (1 - at(f, ex + 70)), -20)}
        {lab(cam, [-9, 11, 3], "같은 열쇠", KEY, at(f, ex + 50), -40)}
        {lab(cam, [19, 10, 0], "같은 열쇠", KEY, at(f, ex + 50), -40)}
        {lab(cam, [LIS[0], 6.6, LIS[2]], "엿들어도 열쇠를 못 만든다", BAD, no, -40, 26)}
        <Note x={360} y={830} w={1200} a={no} col={OWN} lines={[["ECDH", "= 각자 비밀 하나 + 상대의 공개 값 → 같은 열쇠. 공개 값만으로는 계산할 수 없다 (2.1은 P-192 곡선)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 끼어들기 막기: 숫자 비교, Just Works, IOcap */
const MitmScene: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [0, 14, 36], look: [0, 6, 0], fov: 40 }, f / len);
  const mid = at(f, 10) * (1 - at(f, cues[1])), cmp = at(f, cues[1]) * (1 - at(f, cues[2])), jw = at(f, cues[2]) * (1 - at(f, cues[3])), fake = at(f, cues[3]);
  const [px, py] = project(cam, [PP[0] - 2, 7, PP[2] + 0.5]), [hx, hy] = project(cam, [HP[0], 8.5, HP[2]]);
  return (
    <>
      <Stage cam={cam} peer={jw > 0.5 ? "buds" : "headset"}>{(mid > 0 || fake > 0) && <Mitm p={[0, 0, 1]} />}</Stage>
      <Title kicker="끼어들기 막기">사람이 확인하고, 능력값까지 확인 값에 넣는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [0, 5, 1], "둘인 척 끼어든다면?", BAD, mid, -60)}
        <SixBox x={px} y={py} a={cmp} /><SixBox x={hx} y={hy - 60} a={cmp} />
        <text x={(px + hx) / 2} y={Math.min(py, hy) - 20} textAnchor="middle" fill={KEY} fontSize={34} fontWeight={900} opacity={cmp}>두 화면이 같은가? ✓</text>
        {lab(cam, [HP[0], 3.4, HP[2]], "화면·키보드 없음 → 확인 없이 연결 (Just Works)", HS, jw, -60, 26)}
        {lab(cam, [0, 6, 1], "“나는 화면이 없어요” → 확인 건너뛰자", BAD, fake, -40, 26)}
        {lab(cam, [0, 1, 1], "확인 값 ✗ 맞지 않음", BAD, at(f, cues[3] + 50), 60, 30)}
        <Note x={360} y={830} w={1200} a={fake} col={OWN} lines={[["확인 값", "= f3(… , IOcap, 주소). 두 기기가 실제로 알린 입출력 능력이 들어가서, 속인 값으로는 맞출 수 없다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. Classic Secure Connections ①: P-256, 상호 인증 */
const Sc1: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [2, 16, 44], look: [0, 5, -2], fov: 40 }, f / len), curve = at(f, cues[1]), auth = cues[2];
  const big = interpolate(f, [cues[1], cues[1] + 40], [0.6, 1.1], clamp);
  return (
    <>
      <Stage cam={cam}>
        {curve > 0 && <mesh position={[0, 9, -2]} rotation={[0.3, f * 0.02, 0]} scale={big}><torusKnotGeometry args={[2.2, 0.5, 120, 16, 2, 3]} />{mat(curve > 0 && f > cues[1] + 20 ? KEY : PUB, 0.5)}</mesh>}
        <Packet3D f={f} t0={auth + 10} t1={auth + 50} a={PP} b={HP} col={KEY} />
        <Packet3D f={f} t0={auth + 10} t1={auth + 50} a={HP} b={PP} col={KEY} />
      </Stage>
      <Title kicker="Classic Secure Connections (4.1) ①">더 강한 곡선, 서로를 확인하는 인증</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [0, 13, -2], f > cues[1] + 20 ? "P-256" : "P-192", f > cues[1] + 20 ? KEY : PUB, curve, -20, 40)}
        {lab(cam, [-11, 10, 3], "SRES_C ✓", KEY, at(f, auth + 50), -20, 28)}
        {lab(cam, [17, 9, 0], "SRES_P ✓", KEY, at(f, auth + 50), -20, 28)}
        <Card x={360} y={800} w={570} title="예전: E1으로 한쪽씩 확인" sub="SAFER+ 기반 응답 SRES" col={PUB} a={at(f, auth)} />
        <Card x={990} y={800} w={570} title="이제: h4 → h5 한 번에 둘 다" sub="SRES_C · SRES_P · ACO (HMAC-SHA-256)" col={KEY} a={at(f, auth + 30)} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 8. Classic Secure Connections ②: AES-CCM, MIC, 키 길이 */
const Sc2: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [-2, 16, 44], look: [0, 5, -2], fov: 40 }, f / len), c1 = cues[1], c2 = cues[2];
  const flip = f >= c1 + 60;
  const bytes = Math.round(interpolate(f, [c2, c2 + 60], [7, 16], clamp));
  return (
    <>
      <Stage cam={cam}>
        {Array.from({ length: 4 }, (_, i) => <Packet3D key={i} f={f} t0={c1 + i * 18} t1={c1 + i * 18 + 40} a={PP} b={HP} col={i === 3 && flip ? BAD : PH} />)}
        {f > c1 + 72 && f < c1 + 92 && <mesh position={[4, 10, 1]}><coneGeometry args={[0.5, 3, 6]} />{mat("#facc15", 1.5)}</mesh>}
      </Stage>
      <Title kicker="Classic Secure Connections (4.1) ②">E0 대신 AES-CCM, 패킷마다 확인값</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={at(f, c1)} transform="translate(560,190)">
          <rect x={0} y={0} width={500} height={56} rx={10} fill={PH} opacity={0.85} /><text x={250} y={37} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>AES로 암호화한 내용</text>
          <rect x={510} y={0} width={200} height={56} rx={10} fill={C.warn} /><text x={610} y={37} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>MIC 4바이트</text>
        </g>
        {lab(cam, [HP[0], 8, HP[2]], "내용이 바뀜 → MIC 틀림", BAD, at(f, c1 + 95), -40, 26)}
        <g opacity={at(f, c2)} transform="translate(360,800)">
          <text x={0} y={-12} fill={C.text} fontSize={24} fontWeight={800}>암호화 키 길이</text>
          {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 74} y={0} width={66} height={48} rx={8} fill={i < bytes ? KEY : "#334155"} opacity={i < 7 ? 1 : 0.95} />)}
          <text x={7 * 74 - 8} y={78} textAnchor="end" fill={C.dim} fontSize={20}>최소 7바이트</text>
          <text x={16 * 74 - 8} y={78} textAnchor="end" fill={KEY} fontSize={22} fontWeight={900}>16바이트 요구 = 안전한 설정</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 9. LE Secure Connections (4.2): 약속 → 키 → 확인 */
const Lesc: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [2, 18, 42], look: [0, 5, -2], fov: 40 }, f / len), c1 = cues[1], c2 = cues[2];
  const TG: Vec = [HP[0], 1, HP[2]];
  return (
    <>
      <Stage cam={cam} peer="tag">
        <Packet3D f={f} t0={15} t1={50} a={PP} b={TG} col={PUB} />
        <Packet3D f={f} t0={25} t1={60} a={TG} b={PP} col={PUB} />
        {f > c1 && f < c1 + 60 && <mesh position={[interpolate(f, [c1, c1 + 40], [TG[0], PP[0]], clamp), 8, 1]}><boxGeometry args={[2, 1.4, 0.3]} />{mat(OWN, 0.7)}</mesh>}
        {f > c2 && <><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 6, 0]} col={KEY} s={0.8} /></>}
        <Packet3D f={f} t0={c2 + 40} t1={c2 + 80} a={PP} b={TG} col={KEY} />
        <Packet3D f={f} t0={c2 + 40} t1={c2 + 80} a={TG} b={PP} col={KEY} />
      </Stage>
      <Title kicker="LE Secure Connections (4.2)">약속하고, 키를 뽑고, 서로 증명한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [0, 8, 1], "P-256 공개 키 교환", PUB, at(f, 15) * (1 - at(f, c1)), -30)}
        {lab(cam, [0, 9, 1], "봉투에 넣은 약속값 (f4)", OWN, at(f, c1) * (1 - at(f, c2)), -30)}
        {lab(cam, [-9, 11, 3], "LTK (f5)", KEY, at(f, c2), -40)}
        {lab(cam, [0, 8, 1], "확인값 (f6) ✓", KEY, at(f, c2 + 80), -30)}
        <Note x={360} y={830} w={1200} a={at(f, c1)} col={OWN} lines={[["약속", "= 상대 값을 보기 전에 내 값을 봉투에 넣어 먼저 보낸다. 나중에 유리한 값으로 바꿔치기할 수 없다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 10. 구현에서 지킬 것 */
const Impl: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const X0 = 300, Y0 = 520, W = 520, H = 300, cx = (x: number) => X0 + ((x + 2) / 4) * W, cy = (y: number) => Y0 - (y / 3) * H * 0.5;
  const pts: string[] = []; for (let i = 0; i <= 120; i++) { const x = -1.6 + (i / 120) * 3.6, y2 = x * x * x - 3 * x + 2.2; if (y2 >= 0) pts.push(`${cx(x)},${cy(Math.sqrt(y2))}`); }
  const ptsN: string[] = []; for (let i = 0; i <= 120; i++) { const x = -1.6 + (i / 120) * 3.6, y2 = x * x * x - 3 * x + 2.2; if (y2 >= 0) ptsN.push(`${cx(x)},${cy(-Math.sqrt(y2))}`); }
  const chk = at(f, cues[1]), dbg = at(f, cues[2]), only = at(f, cues[3]);
  return (
    <>
      <Title kicker="구현에서 지킬 것">좋은 방식도, 구현이 지켜야 한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={chk}>
          <rect x={X0 - 40} y={Y0 - 260} width={W + 80} height={500} rx={20} fill={C.panel} />
          <polyline points={pts.join(" ")} fill="none" stroke={KEY} strokeWidth={4} /><polyline points={ptsN.join(" ")} fill="none" stroke={KEY} strokeWidth={4} />
          <circle cx={cx(1.2)} cy={cy(Math.sqrt(1.2 ** 3 - 3.6 + 2.2))} r={12} fill={KEY} />
          <text x={cx(1.2) + 18} y={cy(Math.sqrt(1.2 ** 3 - 3.6 + 2.2)) - 10} fill={KEY} fontSize={22} fontWeight={900}>곡선 위 ✓</text>
          <circle cx={cx(0.4)} cy={cy(2.4)} r={12} fill={BAD} />
          <text x={cx(0.4) + 18} y={cy(2.4) - 10} fill={BAD} fontSize={22} fontWeight={900}>곡선 밖 → 거부</text>
          <text x={X0 + W / 2} y={Y0 + 200} textAnchor="middle" fill={C.text} fontSize={24} fontWeight={800}>받은 공개 키는 꼭 곡선 검사 (2018년 뒤 의무)</text>
        </g>
        <Card x={980} y={300} w={640} title="디버그 키: 양산 기기에서 끈다" sub="시험용으로 공개된 개인 키라, 켜 두면 누구나 키를 계산" col={C.warn} a={dbg} />
        <Card x={980} y={450} w={640} title="Secure Connections Only 모드" sub="옛 방식 페어링을 아예 거부 (BR/EDR 모드 4 레벨 4 · LE 모드 1 레벨 4)" col={KEY} a={only} />
        <g opacity={only} transform="translate(980,600)">
          <rect x={0} y={0} width={300} height={70} rx={12} fill={PIN} opacity={0.3} stroke={PIN} strokeWidth={3} /><text x={150} y={44} textAnchor="middle" fill={PIN} fontSize={24} fontWeight={900}>레거시 요청</text>
          <text x={320} y={46} fill={BAD} fontSize={30} fontWeight={900}>✗ 거부</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 11. CTKD */
const Ctkd: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [0, 18, 42], look: [0, 5, -2], fov: 40 }, f / len), pair = cues[1], both = at(f, cues[2]);
  const B: Vec = [HP[0], 3.4, HP[2]];
  return (
    <>
      <Stage cam={cam} peer="buds">
        <mesh position={[0, 8, -1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 26, 8]} />{mat(PH, 0.8)}</mesh>
        <mesh position={[0, 5.5, 2]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 26, 8]} />{mat(HS, 0.8)}</mesh>
        <Packet3D f={f} t0={pair} t1={pair + 40} a={PP} b={B} col={KEY} />
        {f > pair + 40 && <Key3D p={[3, 9.6, -1]} col={KEY} s={0.8} />}
        {both > 0 && <Key3D p={[3, 7, 2]} col={KEY} s={0.8} opacity={both} />}
      </Stage>
      <Title kicker="CTKD: 교차 전송 키 유도">한 번의 페어링으로 두 연결을</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {lab(cam, [-8, 8, -1], "Classic (음악)", PH, 1, -20, 24)}
        {lab(cam, [-8, 5.5, 2], "LE (배터리·설정)", HS, 1, 40, 24)}
        {lab(cam, [5, 9.6, -1], "LE에서 페어링한 키", KEY, at(f, pair + 40), -40, 22)}
        {lab(cam, [5, 5.5, 2], "→ Classic 키도 같은 강도로 (h6·h7)", KEY, both, 60, 22)}
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 12. 정리: 전체 지도 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [8, 18, 44], look: [2, 5, -2], fov: 40 }, f / len);
  const L: [string, string, string][] = [["예전: 짧은 비밀 하나 (PIN·TK)", "엿들은 교환으로 짐작해 볼 수 있었다", PIN], ["지금: 각자의 비밀 + P-256", "엿듣기는 수학이, 끼어들기는 6자리 숫자가", KEY], ["그 키로 연결마다 세션 키 · MIC", "주소는 바꿔 쓴다 (심화 5·6편)", OWN], ["블루투스 보안의 전체 그림", "페어링 → 암호화 → 프라이버시", KEY]];
  return (
    <>
      <Stage cam={cam} peer="buds"><Key3D p={[-11, 11, 3]} col={KEY} s={0.8} /><Key3D p={[17, 8, 0]} col={KEY} s={0.8} /></Stage>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.5} />
        {L.map(([k, v, col], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${190 + i * 150})`}>
            <rect x={0} y={0} width={1000} height={120} rx={22} fill={C.panel} stroke={col} strokeWidth={3} opacity={0.95} />
            <text x={36} y={56} fill={C.text} fontSize={32} fontWeight={900}>{k}</text>
            <text x={36} y={96} fill={C.dim} fontSize={24} fontWeight={700}>{v}</text>
          </g>
        ))}
      </svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "three": return <Three cues={s.cues} len={s.frames} />;
    case "legacy": return <Legacy cues={s.cues} len={s.frames} />;
    case "lelegacy": return <Legacy cues={s.cues} len={s.frames} le />;
    case "ssp": return <Ssp cues={s.cues} len={s.frames} />;
    case "mitm": return <MitmScene cues={s.cues} len={s.frames} />;
    case "sc1": return <Sc1 cues={s.cues} len={s.frames} />;
    case "sc2": return <Sc2 cues={s.cues} len={s.frames} />;
    case "lesc": return <Lesc cues={s.cues} len={s.frames} />;
    case "impl": return <Impl cues={s.cues} />;
    case "ctkd": return <Ctkd cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Pin = makeVideo("pin", scenesFor, LEAD, body);
export { Headset };
