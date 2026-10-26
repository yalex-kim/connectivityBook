import { useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { ccm, ccmNonce, sessionKey } from "../book";
import { camLerp } from "../afh/world3d";
import { Title } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { DEEP, Note, makeVideo } from "../common/kit";
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

/* ---------------------------------------------------------------- 2. 세션 키 */
const Session: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), not = at(f, 10), skd = at(f, cues[1]), make = at(f, cues[2]), again = at(f, cues[3]);
  return (
    <>
      <Title kicker="세션 키">저장한 키로 직접 잠그지 않는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={330} y={250} textAnchor="middle" fill={PH} fontSize={30} fontWeight={900}>휴대폰</text>
        <text x={1590} y={250} textAnchor="middle" fill={WT} fontSize={30} fontWeight={900}>워치</text>
        <Box x={120} y={280} w={420} col={KEY} title="저장한 키 LTK" value={hx(LTK).slice(0, 16) + "…"} sub="공중에 나가지 않음" a={not} />
        <Box x={1380} y={280} w={420} col={KEY} title="저장한 키 LTK" value={hx(LTK).slice(0, 16) + "…"} sub="공중에 나가지 않음" a={not} />
        <Box x={120} y={440} w={420} col={PUB} title="무작위 값 SKD_C" value={hx(SKDC)} sub="공중으로 보냄" a={skd} dash />
        <Box x={1380} y={440} w={420} col={PUB} title="무작위 값 SKD_P" value={hx(SKDP)} sub="공중으로 보냄" a={skd} dash />
        <g opacity={skd}>
          <path d="M540 485 C700 485 760 470 800 470" stroke={PUB} strokeWidth={3} fill="none" strokeDasharray="8 6" />
          <path d="M1380 485 C1220 485 1160 470 1120 470" stroke={PUB} strokeWidth={3} fill="none" strokeDasharray="8 6" />
        </g>
        <g opacity={make}>
          <rect x={800} y={420} width={320} height={100} rx={18} fill="#1b2840" stroke={KEY} strokeWidth={3} />
          <text x={960} y={466} textAnchor="middle" fill={KEY} fontSize={26} fontWeight={900}>e(LTK, SKD)</text>
          <text x={960} y={500} textAnchor="middle" fill={C.dim} fontSize={18}>AES-128 한 블록</text>
          <path d="M960 520 V580" stroke={C.faint} strokeWidth={4} />
          <Box x={600} y={590} w={720} col={OK} title="이 연결의 세션 키 SK" value={hx(SK)} sub="양쪽이 각자 같은 값을 계산" />
        </g>
        <g opacity={again}>
          <Box x={600} y={750} w={720} col={C.warn} title="다음 연결 (무작위 값이 다르면)" value={hx(SK2)} sub="같은 LTK라도 전혀 다른 세션 키" />
        </g>
        <text x={110} y={880} fill={C.dim} fontSize={20} opacity={make}>값: 사양 샘플 [Vol 6] Part C §1 · 다음 연결은 무작위 값 한 바이트만 바꾼 예</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 엿듣는 사람 */
const Listen: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), heard = at(f, 10), no = at(f, cues[1]), pair = at(f, cues[2]);
  return (
    <>
      <Title kicker="엿듣는 사람이 아는 것">공중에 나온 값만으로는 세션 키를 못 만든다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g transform="translate(160,260)">
          <circle cx={90} cy={90} r={80} fill={C.panel} stroke={BAD} strokeWidth={4} />
          <path d="M60 70 q30 -40 60 0 M60 110 q30 40 60 0" stroke={BAD} strokeWidth={5} fill="none" />
          <text x={90} y={210} textAnchor="middle" fill={BAD} fontSize={26} fontWeight={900}>엿듣는 사람</text>
        </g>
        {[["SKD_C", hx(SKDC), true], ["SKD_P", hx(SKDP), true], ["IV", hx(IV), true], ["LTK", "?", false]].map(([k, v, ok], i) => (
          <g key={i} opacity={i < 3 ? heard : no} transform={`translate(520,${260 + i * 100})`}>
            <rect x={0} y={0} width={760} height={78} rx={14} fill={C.panel} stroke={ok ? PUB : KEY} strokeWidth={3} />
            <text x={24} y={50} fill={ok ? C.text : KEY} fontSize={26} fontWeight={900}>{k as string}</text>
            <text x={170} y={50} fill={ok ? C.text : KEY} fontSize={24} fontFamily="monospace">{v as string}</text>
            <text x={736} y={50} textAnchor="end" fill={ok ? OK : BAD} fontSize={26} fontWeight={900}>{ok ? "들림" : "공중에 없음"}</text>
          </g>
        ))}
        <g opacity={no} transform="translate(1340,420)">
          <rect x={0} y={0} width={420} height={110} rx={18} fill={C.panel} stroke={BAD} strokeWidth={3} />
          <text x={210} y={48} textAnchor="middle" fill={C.text} fontSize={26} fontWeight={900}>SK = e(LTK, SKD)</text>
          <text x={210} y={88} textAnchor="middle" fill={BAD} fontSize={26} fontWeight={900}>LTK 없이 계산 불가</text>
        </g>
        <Note x={520} y={700} w={1240} a={pair} col={KEY} lines={[["그래서", "안전은 페어링이 LTK를 얼마나 안전하게 만들었느냐에 달려 있다(입문 7편: 시큐어 커넥션)"]]} />
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

/* ---------------------------------------------------------------- 5. MIC와 재생 */
const Mic: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), add = at(f, 10), flip = at(f, cues[1]), replay = at(f, cues[2]);
  const cells = (x: number, y: number, bad: number) => (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={0} width={160} height={70} rx={10} fill={C.dim} opacity={0.5} /><text x={80} y={44} textAnchor="middle" fill={C.text} fontSize={22} fontWeight={800}>헤더</text>
      {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={170 + i * 90} y={0} width={80} height={70} rx={10} fill={i === bad ? BAD : C.accent} opacity={0.85} /><text x={210 + i * 90} y={44} textAnchor="middle" fill={C.bg} fontSize={18} fontWeight={900}>{i === bad ? "1비트↯" : "암호문"}</text></g>)}
      <rect x={720} y={0} width={240} height={70} rx={10} fill={C.warn} opacity={0.9} /><text x={840} y={44} textAnchor="middle" fill={C.bg} fontSize={22} fontWeight={900}>MIC 4바이트</text>
    </g>
  );
  return (
    <>
      <Title kicker="MIC: 확인값">바꾸면 끊기고, 다시 틀어도 안 통한다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={add}>{cells(240, 260, -1)}<text x={1230} y={306} fill={OK} fontSize={26} fontWeight={900}>받는 쪽: MIC 맞음 ✓</text></g>
        <g opacity={flip}>{cells(240, 420, 2)}<text x={1230} y={466} fill={BAD} fontSize={26} fontWeight={900}>MIC 틀림 → 연결 끊김 (0x3D)</text></g>
        <g opacity={replay} transform="translate(240,600)">
          <rect x={0} y={0} width={1440} height={150} rx={18} fill={C.panel} stroke={BAD} strokeWidth={3} />
          <text x={28} y={50} fill={C.text} fontSize={26} fontWeight={900}>녹음해 둔 옛 패킷을 다시 틀면</text>
          <text x={28} y={98} fill={C.dim} fontSize={24}>옛 패킷: 번호 1로 잠금 · 받는 쪽이 기대하는 번호: 5</text>
          <text x={28} y={134} fill={BAD} fontSize={24} fontWeight={800}>→ nonce가 달라 엉뚱한 평문, MIC도 틀림 → 통하지 않음</text>
        </g>
        <Note x={240} y={780} w={1440} a={flip} col={KEY} lines={[["MIC", "= 헤더 일부와 내용을 세션 키로 요약한 4바이트. 맞힐 확률은 한 번에 2⁻³², 틀리면 연결이 사라진다"]]} />
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
    case "session": return <Session cues={s.cues} />;
    case "listen": return <Listen cues={s.cues} />;
    case "nonce": return <Nonce cues={s.cues} />;
    case "mic": return <Mic cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Encrypt = makeVideo("encrypt", scenesFor, LEAD, body);
