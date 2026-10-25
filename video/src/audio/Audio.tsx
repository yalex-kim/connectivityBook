import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { cisDelivery } from "../book";
import { Scene3D, camLerp, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { CL, LE, at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { PairPhone, Buds } from "../pairing/Pairing";
import { Ground, Note, makeVideo } from "../common/kit";
import { LEAD, scenesFor, type Timed } from "./timing";

const OK = C.ok, BAD = C.bad, WARN = C.warn;
/* 책 10장 지연 예산 계산기의 대표값(기본 설정) */
const CLASSIC: [string, number, string][] = [["프레임", 20, "#8a9bb5"], ["인코딩", 5, "#56647c"], ["전송", 10, LE], ["버퍼", 150, WARN], ["디코딩", 5, "#56647c"], ["재생(DAC)", 5, "#8a9bb5"]];
const LEA: [string, number, string][] = [["LC3 프레임", 10, "#8a9bb5"], ["인코딩", 2.5, "#56647c"], ["ISO×FT", 20, CL], ["표시 지연", 10, WARN], ["디코딩", 2.5, "#56647c"]];
const sum = (a: [string, number, string][]) => a.reduce((n, x) => n + x[1], 0);

/* ---------------------------------------------------------------- 1. 훅 (3D) */
const PH: Vec = [-8, 5.6, 0], BD: Vec = [12, 0, 2];
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), lag = at(f, 20), game = at(f, cues[1]), q = at(f, cues[2]);
  const cam = camLerp({ pos: [-2, 14, 38], look: [2, 4.5, 0], fov: 40 }, { pos: [6, 15, 38], look: [2, 4.5, 0], fov: 40 }, f / len);
  const [px, py] = project(cam, [PH[0], PH[1] + 1.5, 0.4]), [bx, by] = project(cam, [BD[0], 6, BD[2]]);
  const open = (Math.sin(f / 4) + 1) / 2, sound = (Math.sin((f - 9) / 4) + 1) / 2; // 소리는 0.3초 늦게
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PairPhone p={PH} ry={0.2} />
        <Buds p={BD} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={lag}>
          <circle cx={px} cy={py} r={46} fill="#f2c9a0" />
          <ellipse cx={px} cy={py + 20} rx={18} ry={4 + 12 * open} fill="#7a2e2e" />
          <text x={px} y={py + 110} textAnchor="middle" fill={C.dim} fontSize={22}>입 모양</text>
          {[0, 1, 2].map((i) => <path key={i} d={`M${bx + 60 + i * 26} ${by - 30 * sound} q 14 ${30 * sound} 0 ${60 * sound}`} stroke={CL} strokeWidth={5} fill="none" opacity={sound} />)}
          <text x={bx} y={by + 150} textAnchor="middle" fill={C.dim} fontSize={22}>소리 (조금 늦게)</text>
        </g>
        <g opacity={game}>
          <text x={960} y={850} textAnchor="middle" fill={WARN} fontSize={30} fontWeight={800}>💥 → … → 🔊  총소리가 늦게</text>
        </g>
        <text x={960} y={260} textAnchor="middle" fill={C.accent} fontSize={130} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 제시간에 와야 하는 데이터 */
const ARR = [0.3, 1.2, 2.1, 3.9, 4.2, 5.1, 6.0, 7.6, 8.1, 9.0]; // 조각 i가 도착하는 시각(단위: 조각 하나), 늦게 오는 것도 있다
const Why: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), gap = at(f, cues[1]), buf = at(f, cues[2]);
  const X0 = 260, U = 130, now = interpolate(f, [10, len - 20], [0, 10.5], clamp), delay = 2 * buf;
  return (
    <>
      <Title kicker="소리는 제시간에">늦은 조각은 그 자리가 빈다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={X0 - 24} y={370} textAnchor="end" fill={LE} fontSize={26} fontWeight={800}>도착</text>
        <text x={X0 - 24} y={560} textAnchor="end" fill={OK} fontSize={26} fontWeight={800}>재생</text>
        <line x1={X0} x2={X0 + 11 * U} y1={380} y2={380} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={X0 + 11 * U} y1={570} y2={570} stroke={C.faint} strokeWidth={2} />
        {ARR.map((t, i) => t <= now ? <rect key={i} x={X0 + t * U} y={330} width={U - 12} height={44} rx={6} fill={LE} opacity={0.85} /> : null)}
        {ARR.map((t, i) => {
          const slot = i + 1 + delay, late = t > slot - 0.05;
          return slot <= now ? (
            <g key={i}>
              <rect x={X0 + slot * U} y={520} width={U - 12} height={44} rx={6} fill={late ? "none" : OK} stroke={late ? BAD : "none"} strokeWidth={3} strokeDasharray={late ? "6 6" : ""} opacity={0.85} />
              {late && <text x={X0 + slot * U + (U - 12) / 2} y={552} textAnchor="middle" fill={BAD} fontSize={26} fontWeight={900} opacity={gap}>끊김</text>}
            </g>
          ) : null;
        })}
        <g opacity={buf}>
          <path d={`M${X0 + 1 * U} 620 H${X0 + (1 + delay) * U}`} stroke={WARN} strokeWidth={4} />
          <text x={X0 + (1 + delay / 2) * U} y={660} textAnchor="middle" fill={WARN} fontSize={26} fontWeight={800}>버퍼만큼 늦게 재생 → 늦은 조각도 제때</text>
        </g>
        <text x={X0} y={740} fill={C.faint} fontSize={22}>시간 → 조각마다 정해진 재생 시각이 있다(그림의 간격은 예시)</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 지연 막대 */
const Stack: React.FC<{ x: number; y: number; items: [string, number, string][]; scale: number; shown: number; label: string; col: string }> = ({ x, y, items, scale, shown, label, col }) => {
  let at0 = x;
  return (
    <g fontFamily={FONT}>
      <text x={x - 24} y={y + 42} textAnchor="end" fill={col} fontSize={28} fontWeight={900}>{label}</text>
      {items.map(([name, ms, c], i) => {
        const w = ms * scale, a = Math.max(0, Math.min(1, shown * items.length - i)), el = (
          <g key={name} opacity={a}>
            <rect x={at0} y={y} width={w - 3} height={64} rx={6} fill={c} opacity={0.85} />
            {w > 110 && <text x={at0 + w / 2} y={y + 30} textAnchor="middle" fill={C.bg} fontSize={20} fontWeight={900}>{name}</text>}
            {w > 110 && <text x={at0 + w / 2} y={y + 54} textAnchor="middle" fill={C.bg} fontSize={18} fontWeight={700}>{ms} ms</text>}
            {w <= 110 && <text x={at0 + w / 2} y={i % 2 ? y + 90 : y - 12} textAnchor="middle" fill={C.dim} fontSize={17}>{name} {ms}</text>}
          </g>
        );
        at0 += w; return el;
      })}
      <text x={at0 + 20} y={y + 44} fill={col} fontSize={34} fontWeight={900} opacity={shown >= 0.99 ? 1 : 0}>{sum(items)} ms</text>
    </g>
  );
};

/* ---------------------------------------------------------------- 3. 클래식 지연 예산 */
const Budget: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), shown = interpolate(f, [cues[1], cues[2]], [0, 1], clamp), big = at(f, cues[2]);
  return (
    <>
      <Title kicker="지연 쌓아 보기">클래식 A2DP: 대부분은 버퍼</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <Stack x={360} y={420} items={CLASSIC} scale={6.4} shown={shown} label="클래식 A2DP" col={WARN} />
        <g opacity={big}>
          <rect x={360 + 35 * 6.4} y={400} width={150 * 6.4} height={104} rx={10} fill="none" stroke={WARN} strokeWidth={4} />
          <text x={360 + 110 * 6.4} y={560} textAnchor="middle" fill={WARN} fontSize={28} fontWeight={900}>늦거나 다시 오는 조각을 기다리는 버퍼</text>
        </g>
        <g opacity={at(f, cues[0] + 15)}>
          <rect x={360} y={640} width={60 * 6.4} height={30} rx={6} fill="none" stroke={C.dim} strokeWidth={2} strokeDasharray="6 6" />
          <text x={360 + 70 * 6.4} y={663} fill={C.dim} fontSize={22}>입 모양이 어긋나 보이기 시작하는 감각: 약 40 ~ 100 ms</text>
        </g>
        <Note x={360} y={720} w={1360} a={shown} lines={[["A2DP", "= 클래식 블루투스의 음악 프로파일. 재전송이 있어 정확하지만 늦을 수 있다"], ["", "막대 값은 책 10장 지연 계산기의 대표값(버퍼 150 ms). 제품마다 다르다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 끊김 ↔ 지연 */
const Trade: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), x = at(f, cues[1]), app = at(f, cues[2]);
  return (
    <>
      <Title kicker="맞바꾸기">버퍼가 작으면 끊기고, 크면 늦다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={300} x2={1620} y1={460} y2={460} stroke={C.faint} strokeWidth={4} />
        <text x={300} y={420} fill={BAD} fontSize={30} fontWeight={900}>작은 버퍼</text>
        <text x={1620} y={420} textAnchor="end" fill={WARN} fontSize={30} fontWeight={900}>큰 버퍼</text>
        <text x={300} y={510} fill={C.dim} fontSize={24}>지연 ↓ · 간섭에 끊김 ↑</text>
        <text x={1620} y={510} textAnchor="end" fill={C.dim} fontSize={24}>지연 ↑ · 끊김 ↓</text>
        <circle cx={300 + 1320 * (0.5 + 0.4 * Math.sin(f / 22))} cy={460} r={20} fill={C.text} opacity={x} />
        <g opacity={app} transform="translate(560,600)">
          <rect x={0} y={0} width={800} height={180} rx={24} fill={C.panel} stroke={CL} strokeWidth={3} />
          <rect x={40} y={40} width={160} height={100} rx={10} fill="#10203a" stroke={C.dim} strokeWidth={2} />
          <text x={120} y={100} textAnchor="middle" fill={C.dim} fontSize={22}>화면</text>
          <text x={240} y={85} fill={CL} fontSize={28} fontWeight={900}>영상 앱의 해법</text>
          <text x={240} y={125} fill={C.text} fontSize={24}>운영체제가 알려 준 지연만큼 화면을 늦춘다</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. LE 오디오: 기한 */
const Le: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), slots = at(f, cues[1]), drop = at(f, cues[2]), cmp = at(f, cues[3]);
  const X0 = 300, U = 150;
  return (
    <>
      <Title kicker="Bluetooth 5.2 LE 오디오">조각마다 시각과 기한, 지난 조각은 버린다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={1 - cmp}>
          <line x1={X0} x2={X0 + 8 * U} y1={460} y2={460} stroke={C.faint} strokeWidth={2} />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} opacity={slots}>
              <line x1={X0 + i * U} x2={X0 + i * U} y1={360} y2={470} stroke="#2a3b58" strokeWidth={2} />
              <rect x={X0 + i * U + 10} y={400} width={U - 20} height={50} rx={6} fill={i === 3 ? "none" : CL} stroke={i === 3 ? BAD : "none"} strokeWidth={3} opacity={0.85} />
              {i === 3 && <text x={X0 + i * U + U / 2} y={433} textAnchor="middle" fill={BAD} fontSize={22} fontWeight={900} opacity={drop}>기한 지남 → 버림</text>}
            </g>
          ))}
          <text x={X0} y={350} fill={CL} fontSize={24} fontWeight={800} opacity={slots}>ISO 간격마다 한 조각, 기한(FT) 안에서만 다시 보내기</text>
          <text x={X0} y={520} fill={C.faint} fontSize={22}>시간 → (칸 하나 = ISO 간격)</text>
        </g>
        <g opacity={cmp}>
          <Stack x={360} y={320} items={CLASSIC} scale={6} shown={1} label="클래식" col={WARN} />
          <Stack x={360} y={490} items={LEA} scale={6} shown={1} label="LE 오디오" col={CL} />
        </g>
        <Note x={300} y={640} w={1360} a={slots} lines={[["등시성 채널(CIS)", "= 정해진 시각마다 열리는 오디오용 채널. ISO 간격 5 ms ~ 4 s"], ["FT", "= 기한. 이 간격 수가 지나면 그 조각은 버린다 · 막대는 책 10장의 대표값"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 기한 안의 재전송 */
const Retry: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), bars = at(f, cues[1]), ft = at(f, cues[2]);
  const rows: [string, number][] = [[1, 1], [2, 1], [3, 1]].map(([nse]) => [`같은 간격 안 ${nse}번`, (1 - cisDelivery(0.2, nse, 1, 1)) * 100]);
  return (
    <>
      <Title kicker="끊김 줄이기">기한 안에서 여러 번 보내기 (NSE)</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={300} y={290} fill={C.text} fontSize={28} fontWeight={800}>한 번 보낼 때 깨질 확률 20%일 때, 전달 실패 확률</text>
        {rows.map(([name, fail], i) => (
          <g key={name} opacity={Math.max(0, Math.min(1, bars * 3 - i))} transform={`translate(300,${330 + i * 100})`}>
            <text x={0} y={42} fill={C.dim} fontSize={28} fontWeight={700}>{name}</text>
            <rect x={320} y={8} width={Math.max(8, fail * 50)} height={50} rx={8} fill={i === 2 ? OK : BAD} opacity={0.85} />
            <text x={340 + Math.max(8, fail * 50)} y={44} fill={C.text} fontSize={30} fontWeight={900}>{fail.toFixed(1)}%</text>
          </g>
        ))}
        <g opacity={ft}>
          <text x={300} y={700} fill={WARN} fontSize={28} fontWeight={800}>기한을 다음 간격까지 넘기면(FT 2, 3…) 더 튼튼하지만, 지연이 ISO 간격만큼씩 쌓인다</text>
        </g>
        <Note x={300} y={740} w={1400} a={bars} lines={[["NSE", "= 한 ISO 간격 안의 보낼 기회 수. 실패 = 0.2 × 0.2 × 0.2 = 0.8% (조각마다 독립이라고 단순화)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <text x={960} y={210} textAnchor="middle" fill={C.text} fontSize={52} fontWeight={900} opacity={at(f, 10)}>늦는 건 전파가 아니라 <tspan fill={WARN}>버퍼</tspan></text>
      <g opacity={at(f, 20)}><Stack x={420} y={360} items={CLASSIC} scale={5.6} shown={1} label="클래식" col={WARN} /></g>
      <g opacity={at(f, cues[1])}>
        <Stack x={420} y={540} items={LEA} scale={5.6} shown={1} label="LE 오디오" col={CL} />
        <text x={420} y={680} fill={C.dim} fontSize={26}>기한을 정해 다시 보내고, 지난 조각은 버린다 (대표값)</text>
      </g>
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "why": return <Why cues={s.cues} len={s.frames} />;
    case "budget": return <Budget cues={s.cues} />;
    case "trade": return <Trade cues={s.cues} />;
    case "le": return <Le cues={s.cues} />;
    case "retry": return <Retry cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} />;
  }
};
export const AudioVideo = makeVideo("audio", scenesFor, LEAD, body);
