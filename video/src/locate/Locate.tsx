import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { aoaAngle, rssiToDistance } from "../book";
import { Scene3D, camLerp, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { CL, LE, at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { PairPhone } from "../pairing/Pairing";
import { Ground, Note, makeVideo } from "../common/kit";
import { LEAD, scenesFor, type Timed } from "./timing";

const OK = C.ok, BAD = C.bad, WARN = C.warn;
const P1M = -59, LAMBDA = 299792458 / 2.44e9;

/* ---------------------------------------------------------------- 1. 훅 (3D): 소파 틈의 이어폰 */
const Sofa: React.FC = () => (
  <group position={[6, 0, -2]}>
    <mesh position={[0, 2.5, 0]}><boxGeometry args={[22, 5, 9]} /><meshStandardMaterial color="#3a4a6a" roughness={0.9} /></mesh>
    <mesh position={[0, 7, -3.5]}><boxGeometry args={[22, 8, 2.5]} /><meshStandardMaterial color="#3a4a6a" roughness={0.9} /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[s * 5.4, 5.6, 0.5]}><boxGeometry args={[10.6, 1.4, 7]} /><meshStandardMaterial color="#465a80" roughness={0.9} /></mesh>)}
  </group>
);
const Bud: React.FC<{ p: Vec }> = ({ p }) => (
  <group position={p} rotation={[0.4, 0.3, 0.8]}>
    <mesh><sphereGeometry args={[0.7, 20, 16]} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
    <mesh position={[0, -0.9, 0]}><cylinderGeometry args={[0.26, 0.26, 1.4, 12]} /><meshStandardMaterial color="#e8edf6" roughness={0.4} /></mesh>
  </group>
);
const PH: Vec = [-14, 6, 6], BUD: Vec = [6, 6.4, 1.2];
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), scr = at(f, cues[1]), q = at(f, cues[2]);
  const cam = camLerp({ pos: [-8, 18, 40], look: [0, 4, 0], fov: 40 }, { pos: [4, 19, 38], look: [0, 4, 0], fov: 40 }, f / len);
  const [px, py] = project(cam, [PH[0], PH[1], PH[2] + 0.4]), [bx, by] = project(cam, BUD);
  const ring = (f % 45) / 45;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <Sofa />
        <Bud p={BUD} />
        <PairPhone p={PH} ry={0.35} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <circle cx={bx} cy={by} r={20 + ring * 90} fill="none" stroke={CL} strokeWidth={4} opacity={(1 - ring) * 0.8} />
        <g opacity={scr}>
          <text x={px} y={py - 40} textAnchor="middle" fill={C.dim} fontSize={18}>찾기</text>
          <text x={px} y={py + 4} textAnchor="middle" fill={OK} fontSize={22} fontWeight={800}>가까워지는 중…</text>
          <text x={px} y={py + 54} textAnchor="middle" fill={C.text} fontSize={44} fontWeight={900}>30 cm</text>
        </g>
        <text x={960} y={250} textAnchor="middle" fill={C.accent} fontSize={130} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 세기로 거리 */
const Rssi: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 300, W = 1300, Y0 = 720, H = 400, DMAX = 16;
  const X = (d: number) => X0 + (d / DMAX) * W, Y = (dbm: number) => Y0 - ((dbm + 95) / 45) * H; // −95 ~ −50 dBm
  const curve = (off: number) => { const p: string[] = []; for (let i = 0; i <= 160; i++) { const d = 0.8 + (i / 160) * (DMAX - 0.8); p.push(`${X(d).toFixed(1)},${Y(P1M - 20 * Math.log10(d) + off).toFixed(1)}`); } return p.join(" "); };
  const ex = at(f, cues[1]), wob = at(f, cues[2]), err = at(f, cues[3]);
  const d0 = rssiToDistance(-71, P1M, 2), dLo = rssiToDistance(-71 + 6, P1M, 2), dHi = rssiToDistance(-71 - 6, P1M, 2);
  return (
    <>
      <Title kicker="첫 번째 단서: 세기 (RSSI)">받은 세기로 거리를 거꾸로 계산</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={X0} x2={X0 + W} y1={Y0} y2={Y0} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - H} stroke={C.faint} strokeWidth={2} />
        {[1, 2, 4, 8, 16].map((d) => <text key={d} x={X(d)} y={Y0 + 34} textAnchor="middle" fill={C.faint} fontSize={22}>{d} m</text>)}
        {[-60, -70, -80, -90].map((v) => <text key={v} x={X0 - 14} y={Y(v) + 8} textAnchor="end" fill={C.faint} fontSize={22}>{v} dBm</text>)}
        <polygon points={`${curve(6)} ${curve(-6).split(" ").reverse().join(" ")}`} fill={WARN} opacity={0.15 * wob} />
        <polyline points={curve(0)} fill="none" stroke={CL} strokeWidth={5} />
        <g opacity={ex}>
          <circle cx={X(1)} cy={Y(P1M)} r={10} fill={C.text} />
          <text x={X(1) + 18} y={Y(P1M) - 14} fill={C.text} fontSize={24} fontWeight={800}>1 m에서 −59 dBm (기준)</text>
          <line x1={X0} x2={X(d0)} y1={Y(-71)} y2={Y(-71)} stroke={LE} strokeWidth={3} strokeDasharray="8 6" />
          <line x1={X(d0)} x2={X(d0)} y1={Y(-71)} y2={Y0} stroke={LE} strokeWidth={3} strokeDasharray="8 6" />
          <text x={X(d0) + 14} y={Y(-71) - 12} fill={LE} fontSize={26} fontWeight={900}>−71 dBm → 약 {d0.toFixed(0)} m</text>
        </g>
        <g opacity={err}>
          <rect x={X(dLo)} y={Y0 - 30} width={X(dHi) - X(dLo)} height={24} rx={6} fill={BAD} opacity={0.6} />
          <text x={(X(dLo) + X(dHi)) / 2} y={Y0 - 44} textAnchor="middle" fill={BAD} fontSize={26} fontWeight={900}>±6 dB → {dLo.toFixed(0)} ~ {dHi.toFixed(0)} m</text>
        </g>
        <Note x={X0} y={790} w={1300} a={ex} lines={[["RSSI", "= 받은 세기의 측정값. 거리 = 10^((기준 − RSSI) ÷ (10 × n)), 트인 곳 n = 2"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 구역 판단 */
const Zone: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), avg = at(f, cues[1]);
  const Z: [number, string, string][] = [[340, "멀다", "#2a3b58"], [230, "근처", "#2f4a73"], [120, "바로 앞", CL]];
  return (
    <>
      <Title kicker="세기는 구역 판단에">바로 앞 · 근처 · 멀다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {Z.map(([r, name, col], i) => (
          <g key={name} opacity={at(f, 10 + i * 15)}>
            <circle cx={760} cy={560} r={r} fill={col} opacity={0.45} stroke={C.text} strokeWidth={2} />
            <text x={760} y={560 - r + 40} textAnchor="middle" fill={C.text} fontSize={28} fontWeight={900}>{name}</text>
          </g>
        ))}
        <rect x={740} y={530} width={40} height={70} rx={8} fill={C.text} />
        <g opacity={avg} transform="translate(1220,420)">
          <text x={0} y={0} fill={C.text} fontSize={28} fontWeight={800}>여러 번 재서 평균</text>
          {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 44} y={30} width={30} height={30 + 50 * Math.abs(Math.sin(i * 1.7))} rx={4} fill={LE} opacity={0.7} />)}
          <text x={0} y={170} fill={OK} fontSize={24} fontWeight={800}>흔들림 ↓ (10개면 약 1/3)</text>
          <text x={0} y={210} fill={WARN} fontSize={24} fontWeight={800}>판단은 늦어진다</text>
        </g>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 방향: 두 안테나의 위상 차 */
const Aoa: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), wave = at(f, cues[1]), calc = at(f, cues[2]), half = at(f, cues[3]);
  const th = aoaAngle(Math.PI / 2, LAMBDA / 2, LAMBDA), A1: [number, number] = [760, 720], A2: [number, number] = [1060, 720];
  const dirx = Math.sin(th), diry = -Math.cos(th);
  return (
    <>
      <Title kicker="두 번째 단서: 방향 (AoA)">비스듬히 온 전파는 한쪽에 조금 늦게 닿는다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {[A1, A2].map(([x, y], i) => (
          <g key={i}>
            <line x1={x} x2={x} y1={y} y2={y - 90} stroke={C.text} strokeWidth={6} />
            <circle cx={x} cy={y - 96} r={10} fill={C.text} />
            <text x={x} y={y + 40} textAnchor="middle" fill={C.dim} fontSize={22}>안테나 {i + 1}</text>
          </g>
        ))}
        <g opacity={wave}>
          {Array.from({ length: 7 }, (_, k) => {
            const off = ((f * 3 + k * 70) % 490) - 120, cx = 910 - dirx * (300 - off), cy = 624 - diry * (300 - off) * -1;
            return <line key={k} x1={cx - Math.cos(th) * 360} y1={cy - Math.sin(th) * 360} x2={cx + Math.cos(th) * 360} y2={cy + Math.sin(th) * 360} stroke={CL} strokeWidth={3} opacity={0.55} />;
          })}
          <text x={1300} y={330} fill={CL} fontSize={26} fontWeight={800}>전파 (나란한 물결)</text>
        </g>
        <g opacity={calc}>
          <path d={`M${A1[0]} ${A1[1] - 96} L${A1[0] + Math.sin(th) * Math.sin(th) * 300} ${A1[1] - 96 - Math.sin(th) * Math.cos(th) * 300}`} stroke={WARN} strokeWidth={4} />
          <text x={560} y={460} fill={WARN} fontSize={26} fontWeight={800}>더 가야 하는 길 = 간격 × sinθ</text>
          <text x={1150} y={560} fill={C.text} fontSize={30} fontWeight={900}>위상 차 90° → θ = {Math.round((th * 180) / Math.PI)}°</text>
          <text x={1150} y={600} fill={C.dim} fontSize={22}>(간격 = 반 파장일 때)</text>
        </g>
        <g opacity={half}>
          <path d={`M${A1[0]} 790 H${A2[0]}`} stroke={OK} strokeWidth={4} />
          <text x={910} y={830} textAnchor="middle" fill={OK} fontSize={26} fontWeight={900}>간격 ≤ 반 파장 ≈ {((LAMBDA / 2) * 100).toFixed(1)} cm</text>
        </g>
        <Note x={260} y={860} w={1400} a={calc} lines={[["위상", "= 물결이 한 바퀴 중 어디쯤인지. 간격이 반 파장을 넘으면 서로 다른 방향이 같은 위상 차를 만든다"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 채널 사운딩 */
const Cs: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), ch = interpolate(f, [cues[1], cues[2]], [0, 72], clamp), slope = at(f, cues[2]), wrap = at(f, cues[3]);
  const D = 3, X0 = 300, W = 1100, Y0 = 680, H = 360; // 예: 3 m, 왕복 위상 = −4π·f·d/c (mod 2π)
  const freqs: number[] = []; for (let k = 2; k <= 76; k++) if (k <= 22 || k >= 26) freqs.push(2402 + k);
  const ph = (mhz: number) => { const v = (-4 * Math.PI * mhz * 1e6 * D) / 299792458; return ((v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); };
  const X = (mhz: number) => X0 + ((mhz - 2402) / 78) * W, Y = (p: number) => Y0 - (p / (2 * Math.PI)) * H;
  return (
    <>
      <Title kicker="세 번째 단서: Bluetooth 6.0 채널 사운딩">주파수에 따른 위상의 기울기 = 거리</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <line x1={X0} x2={X0 + W} y1={Y0} y2={Y0} stroke={C.faint} strokeWidth={2} />
        <line x1={X0} x2={X0} y1={Y0} y2={Y0 - H} stroke={C.faint} strokeWidth={2} />
        <text x={X0 - 14} y={Y0 - H + 8} textAnchor="end" fill={C.faint} fontSize={20}>2π</text>
        <text x={X0 - 14} y={Y0 + 8} textAnchor="end" fill={C.faint} fontSize={20}>0</text>
        <text x={X0} y={Y0 + 34} fill={C.faint} fontSize={20}>2404 MHz</text>
        <text x={X0 + W} y={Y0 + 34} textAnchor="end" fill={C.faint} fontSize={20}>2478 MHz</text>
        <text x={X0 + W / 2} y={Y0 + 70} textAnchor="middle" fill={C.dim} fontSize={22}>채널 (1 MHz 간격 72개)</text>
        {freqs.slice(0, Math.floor(ch)).map((m) => <circle key={m} cx={X(m)} cy={Y(ph(m))} r={6} fill={CL} />)}
        <g opacity={slope}>
          <text x={X0 + W + 30} y={330} fill={WARN} fontSize={28} fontWeight={900}>기울기 → 거리</text>
          <text x={X0 + W + 30} y={372} fill={C.text} fontSize={24}>거리 = −기울기 × c ÷ 4π</text>
          <text x={X0 + W + 30} y={414} fill={C.dim} fontSize={22}>(예: 3 m일 때의 왕복 위상)</text>
        </g>
        <g opacity={wrap}>
          <rect x={X0 + W + 30} y={470} width={400} height={170} rx={18} fill={C.panel} stroke={BAD} strokeWidth={3} />
          <text x={X0 + W + 50} y={515} fill={BAD} fontSize={24} fontWeight={900}>3 m · 153 m · 303 m …</text>
          <text x={X0 + W + 50} y={555} fill={C.text} fontSize={22}>같은 기울기로 보인다</text>
          <text x={X0 + W + 50} y={600} fill={OK} fontSize={22} fontWeight={800}>왕복 시간(RTT)으로 고른다</text>
        </g>
        <Note x={X0} y={770} w={1400} a={slope} lines={[["채널 사운딩", "= 연결된 두 기기가 72개 채널에서 위상(PBR)과 왕복 시간(RTT)을 재는 6.0 기능. 1 MHz 간격이면 150 m마다 되풀이"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 시간은 속일 수 없다 */
const Trust: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), amp = at(f, cues[1]), use = at(f, cues[2]);
  return (
    <>
      <Title kicker="속일 수 있는 것과 없는 것">세기는 키울 수 있지만, 시간은 줄일 수 없다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={amp}>
          <rect x={200} y={300} width={700} height={360} rx={24} fill={C.panel} stroke={BAD} strokeWidth={3} />
          <text x={240} y={360} fill={BAD} fontSize={32} fontWeight={900}>세기 (RSSI)</text>
          <path d="M260 560 h120 l40 -60 l40 120 l40 -160 l40 200 l40 -100 h120" stroke={C.dim} strokeWidth={4} fill="none" />
          <rect x={360} y={420} width={160} height={70} rx={10} fill="#1b2840" stroke={BAD} strokeWidth={3} />
          <text x={440} y={465} textAnchor="middle" fill={BAD} fontSize={22} fontWeight={800}>증폭기</text>
          <text x={240} y={630} fill={C.text} fontSize={26}>키우면 가까운 척할 수 있다</text>
        </g>
        <g opacity={amp}>
          <rect x={1020} y={300} width={700} height={360} rx={24} fill={C.panel} stroke={OK} strokeWidth={3} />
          <text x={1060} y={360} fill={OK} fontSize={32} fontWeight={900}>시간 (왕복)</text>
          <path d="M1080 500 H1640 M1620 486 L1642 500 L1620 514" stroke={CL} strokeWidth={5} fill="none" />
          <text x={1360} y={470} textAnchor="middle" fill={CL} fontSize={24}>빛의 속도보다 빨리 올 수 없다</text>
          <text x={1060} y={630} fill={C.text} fontSize={26}>더 가까운 척은 할 수 없다</text>
        </g>
        <text x={960} y={760} textAnchor="middle" fill={C.text} fontSize={30} fontWeight={800} opacity={use}>거리가 중요한 곳일수록, 세기보다 시간과 위상</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame();
  const L: [string, string, string][] = [["세기 (RSSI)", "대략의 구역", "#2f4a73"], ["두 안테나의 위상 (AoA·AoD)", "방향", LE], ["여러 채널의 위상 + 왕복 시간 (채널 사운딩)", "cm 단위 거리", CL]];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
      <text x={960} y={200} textAnchor="middle" fill={C.text} fontSize={52} fontWeight={900} opacity={at(f, 10)}>거리를 아는 세 단계</text>
      {L.map(([k, v, col], i) => (
        <g key={k} opacity={at(f, i < 2 ? 20 + i * 20 : cues[1])} transform={`translate(${260 + i * 140},${300 + i * 150})`}>
          <rect x={0} y={0} width={1120} height={120} rx={22} fill={col} opacity={0.3} stroke={col} strokeWidth={3} />
          <text x={36} y={74} fill={C.text} fontSize={32} fontWeight={900}>{k}</text>
          <text x={1090} y={74} textAnchor="end" fill={C.text} fontSize={30} fontWeight={800}>→ {v}</text>
        </g>
      ))}
    </svg>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "rssi": return <Rssi cues={s.cues} />;
    case "zone": return <Zone cues={s.cues} />;
    case "aoa": return <Aoa cues={s.cues} />;
    case "cs": return <Cs cues={s.cues} />;
    case "trust": return <Trust cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} />;
  }
};
export const Locate = makeVideo("locate", scenesFor, LEAD, body);
export { Sofa, Bud as LocBud };
