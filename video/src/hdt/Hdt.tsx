import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { HDT_RATES, hdtFecEncode, hdtMap, hdtPuncture, rng } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { Packet3D } from "../common/deep3d";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: GFSK(LE 2M) = 파랑, HDT = 인디고, 오류 = 빨강, 제어 헤더 = 흰색 */
const G2 = C.accent, HD = DEEP, OK = C.ok, BAD = C.bad;
/** 속도 단계별 색: HDT2 주황 → HDT7.5 인디고 */
const RCOL: Record<string, string> = { HDT2: C.warn, HDT3: "#facc15", HDT4: C.accent2, HDT6: "#818cf8", "HDT7.5": DEEP };
const PP: Vec = [-14, 7, 0], EP: Vec = [10, 5, 0];
const PhoneAt: React.FC<{ x: number; z?: number }> = ({ x, z = 0 }) => <group position={[x + 12, 0, z]}><Phone3D /></group>;
const Bud: React.FC<{ x: number; z?: number; s?: number }> = ({ x, z = 0, s = 1.5 }) => <Earbud3D p={[x, 3.4, z]} ry={-1.2} s={s} />;
const CAM: Cam = { pos: [-2, 16, 38], look: [-2, 4, 0], fov: 40 };
const lab = (cam: Cam, p: Vec, t: string, col: string, a: number, dy = -30, size = 26) => { const [x, y] = project(cam, p); return <text x={x} y={y + dy} textAnchor="middle" fill={col} fontSize={size} fontWeight={900} opacity={a}>{t}</text>; };
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>{children}</svg>;
const mat = (col: string, glow = 0.3, op = 1) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} transparent={op < 1} opacity={op} />;

/** 성좌도(2D): 변조의 기준점, 잡음 낀 수신점(틀리면 빨강) */
const REF = (mod: "qpsk" | "8psk" | "16qam") => {
  const n = mod === "qpsk" ? 2 : mod === "8psk" ? 3 : 4, bits = (v: number) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);
  const vals = Array.from({ length: 1 << n }, (_, v) => v);
  return mod === "qpsk" ? [...vals.map((v) => hdtMap(bits(v), mod)[0]), ...vals.map((v) => hdtMap([0, 0, ...bits(v)], mod)[1])] : vals.map((v) => hdtMap(bits(v), mod)[0]);
};
const Constellation: React.FC<{ x: number; y: number; r: number; mod: "qpsk" | "8psk" | "16qam"; a: number; noise?: number; label?: string; col?: string }> = ({ x, y, r, mod, a, noise = 0, label, col = HD }) => {
  const ref = REF(mod), sc = mod === "16qam" ? r / (3 / Math.sqrt(10)) * 0.85 : r * 0.85, rnd = rng(5);
  const g = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pts = noise > 0 ? Array.from({ length: 260 }, (_, i) => {
    const p = ref[i % ref.length], q: [number, number] = [p[0] + noise * g(), p[1] + noise * g()];
    let best = 0, bd = 1e9; ref.forEach((c, k) => { const d = (c[0] - q[0]) ** 2 + (c[1] - q[1]) ** 2; if (d < bd) { bd = d; best = k; } });
    return { q, bad: best !== i % ref.length && !(mod === "qpsk" && Math.abs(ref[best][0] - p[0]) + Math.abs(ref[best][1] - p[1]) < 1e-9) };
  }) : [];
  return (
    <g opacity={a} transform={`translate(${x},${y})`}>
      <rect x={-r - 30} y={-r - 30} width={2 * r + 60} height={2 * r + 60} rx={22} fill={C.panel} opacity={0.94} stroke={C.faint} strokeWidth={2} />
      <line x1={-r - 10} x2={r + 10} y1={0} y2={0} stroke={C.faint} /><line y1={-r - 10} y2={r + 10} x1={0} x2={0} stroke={C.faint} />
      {mod !== "16qam" && <circle r={sc} fill="none" stroke={C.faint} strokeDasharray="4 6" />}
      {pts.map((p, i) => <circle key={i} cx={p.q[0] * sc} cy={-p.q[1] * sc} r={p.bad ? 3.6 : 2.4} fill={p.bad ? BAD : C.accent} opacity={p.bad ? 1 : 0.45} />)}
      {ref.map((p, i) => <circle key={"r" + i} cx={p[0] * sc} cy={-p[1] * sc} r={mod === "qpsk" && i >= 4 ? 7 : 9} fill={mod === "qpsk" && i >= 4 ? C.dim : col} />)}
      {label && <text x={0} y={r + 66} textAnchor="middle" fill={C.text} fontSize={28} fontWeight={900}>{label}</text>}
    </g>
  );
};

/* ---------------------------------------------------------------- 1. 훅: 2 → 7.5 Mb/s */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [2, 18, 34], look: [-2, 4, 0], fov: 40 }, f / len);
  const grow = interpolate(f, [cues[0] + 40, cues[0] + 110], [0, 1], clamp), speed = 2 + 5.5 * grow, every = Math.round(24 - 16 * grow);
  const W = 800, X0 = 880;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} />
        <Bud x={EP[0]} />
        {Array.from({ length: 30 }, (_, i) => { const t0 = i * every; return <Packet3D key={i} f={f} t0={t0} t1={t0 + 26} a={PP} b={EP} col={grow > 0.5 ? HD : G2} size={0.7} />; })}
      </Scene3D>
      <Svg>
        {lab(cam, [PP[0], 0, 0], "휴대폰", G2, 1, 60)}
        {lab(cam, [EP[0], 0, 0], "이어폰", C.text, 1, 60)}
        <g transform={`translate(${X0},740)`}>
          <rect x={-30} y={-70} width={W + 60} height={150} rx={20} fill={C.panel} opacity={0.92} />
          <text x={0} y={-24} fill={C.dim} fontSize={26} fontWeight={800}>LE 최대 공중 속도</text>
          <rect x={0} y={0} width={W} height={40} rx={10} fill="#1e293b" />
          <rect x={0} y={0} width={(W * 2) / 7.5} height={40} rx={10} fill={G2} />
          <rect x={(W * 2) / 7.5} y={0} width={(W * (speed - 2)) / 7.5} height={40} rx={0} fill={HD} />
          <text x={(W * speed) / 7.5 + 16} y={32} fill={grow > 0.5 ? HD : G2} fontSize={38} fontWeight={900}>{speed.toFixed(1)} Mb/s</text>
          <text x={W} y={-24} textAnchor="end" fill={G2} fontSize={24} fontWeight={800}>파랑 = 6.3까지(2 Mb/s) · 인디고 = 7.0 HDT</text>
        </g>
        <text x={960} y={260} textAnchor="middle" fill={C.accent} fontSize={120} fontWeight={900} opacity={at(f, cues[1])}>?</text>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 천장: 앱 처리량 약 1.4 Mb/s, CD 1,411 kb/s (2D) */
const Ceiling: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), a1 = at(f, cues[0] + 30), a2 = at(f, cues[1]);
  const X0 = 520, S = 520; // 1 Mb/s = 520 px
  const strip: [number, string, string][] = [[3.3, G2, "패킷"], [0.5, "#334155", "틈"], [0.6, "#64748b", "응답"], [0.5, "#334155", "틈"], [3.3, G2, "패킷"], [0.5, "#334155", "틈"], [0.6, "#64748b", "응답"], [0.5, "#334155", "틈"]];
  let sx = 0;
  return (
    <>
      <Title kicker="문제: 지금 LE의 천장">공중 속도 2 Mb/s, 앱이 쓰는 속도는 약 1.4 Mb/s</Title>
      <Svg>
        <g transform="translate(160,280)" opacity={at(f, 6)}>
          {strip.map(([w, col, t], i) => { const x = sx; sx += w * 80; return <g key={i}><rect x={x} y={0} width={w * 80 - 4} height={70} rx={8} fill={col} /><text x={x + (w * 80) / 2} y={44} textAnchor="middle" fill={C.text} fontSize={w > 1 ? 28 : 22} fontWeight={800}>{t}</text></g>; })}
          <text x={sx + 24} y={46} fill={C.dim} fontSize={26} fontWeight={700}>… 패킷마다</text>
        </g>
        <g transform={`translate(${X0},460)`}>
          <text x={-30} y={50} textAnchor="end" fill={C.text} fontSize={30} fontWeight={800}>LE 2M 공중 속도</text>
          <rect x={0} y={20} width={S * 2} height={50} rx={10} fill={G2} opacity={0.35} />
          <text x={S * 2 + 20} y={56} fill={G2} fontSize={32} fontWeight={900}>2 Mb/s</text>
          <g opacity={a1}>
            <text x={-30} y={150} textAnchor="end" fill={C.text} fontSize={30} fontWeight={800}>틈·응답을 빼면</text>
            <rect x={0} y={120} width={S * 1.4 * a1} height={50} rx={10} fill={G2} />
            <text x={S * 1.4 + 20} y={156} fill={G2} fontSize={32} fontWeight={900}>약 1.4 Mb/s</text>
          </g>
          <g opacity={a2}>
            <line x1={S * 1.411} x2={S * 1.411} y1={-10} y2={260} stroke={C.warn} strokeWidth={5} />
            <text x={S * 1.411} y={300} textAnchor="middle" fill={C.warn} fontSize={30} fontWeight={900}>CD 음질 1,411 kb/s</text>
            <rect x={S * 1.4} y={112} width={S * 0.011 + 6} height={66} fill={BAD} />
            <text x={S * 1.411 + 30} y={230} fill={BAD} fontSize={28} fontWeight={900}>다시 보낼 여유가 거의 없다</text>
          </g>
        </g>
        <text x={260} y={860} fill={C.faint} fontSize={22}>1.4 Mb/s는 책 6장 처리량 계산기의 대략적인 값 (기기·설정마다 다르다)</text>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3·4. 칸(심볼) 레인: 박자는 그대로, 칸마다 비트 n개 (3D) */
const SLOT = 2.2;
const Lane: React.FC<{ f: number; bits: (i: number) => number; colOf: (n: number) => string }> = ({ f, bits, colOf }) => (
  <>
    {Array.from({ length: 16 }, (_, i) => {
      const x = -18 + i * SLOT - ((f * 0.05) % SLOT), n = bits(i);
      return (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.25, 0]}><boxGeometry args={[SLOT - 0.25, 0.5, 3]} />{mat("#1e293b", 0.1)}</mesh>
          {Array.from({ length: n }, (_, k) => <mesh key={k} position={[0, 1.0 + k * 1.0, 0]}><boxGeometry args={[1.3, 0.85, 1.3]} />{mat(colOf(n), 0.6)}</mesh>)}
        </group>
      );
    })}
  </>
);
const SCAM: Cam = { pos: [0, 9, 22], look: [0, 4.5, 0], fov: 42 };
const Slot: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SCAM, { pos: [3, 10, 21], look: [0, 2.5, 0], fov: 42 }, f / len), wide = at(f, cues[1], 30), fix = at(f, cues[2]);
  const hump = (w: number, col: string, op: number, dash?: string) => { const pts = Array.from({ length: 61 }, (_, i) => { const u = (i - 30) / 30; return `${960 + u * w},${330 - 110 * Math.exp(-((u * 2.2) ** 2))}`; }).join(" "); return <polyline points={pts} fill="none" stroke={col} strokeWidth={5} opacity={op} strokeDasharray={dash} />; };
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 14, 10]} />
        <Lane f={f} bits={() => 1} colOf={() => G2} />
      </Scene3D>
      <Title kicker="문제: 박자는 올릴 수 없다">0.5 µs마다 한 칸, 칸마다 1비트</Title>
      <Svg>
        {lab(cam, [-18 + 7 * SLOT, 0, 2], "← 0.5 µs →", C.dim, at(f, 10), 50, 26)}
        <g opacity={wide}>
          <rect x={560} y={190} width={800} height={190} rx={18} fill={C.panel} opacity={0.92} />
          {hump(140, G2, 1)}
          {hump(280, BAD, 0.9, "10 8")}
          <text x={960} y={370} textAnchor="middle" fill={C.dim} fontSize={22} fontWeight={700}>주파수 →</text>
          <text x={1140} y={250} fill={BAD} fontSize={24} fontWeight={900}>칸을 빨리 → 폭이 넓어진다</text>
          <text x={600} y={250} fill={G2} fontSize={24} fontWeight={900}>지금 폭</text>
        </g>
        <Note x={460} y={760} w={1000} a={fix} col={HD} lines={[["박자 고정", "초당 200만 칸(2 Msym/s)은 그대로 → 한 칸에 더 싣는다"]]} />
      </Svg>
    </>
  );
};
const More: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(SCAM, { pos: [-3, 11, 21], look: [0, 3, 0], fov: 42 }, f / len);
  const t1 = cues[1], step = f < t1 ? 2 : f < t1 + 45 ? 2 : f < t1 + 90 ? 3 : 4;
  const mod = step === 2 ? "qpsk" : step === 3 ? "8psk" : "16qam", name = step === 2 ? "π/4 QPSK · 2비트" : step === 3 ? "8PSK · 3비트" : "16QAM · 4비트";
  const colOf = (n: number) => (n === 2 ? C.warn : n === 3 ? C.accent2 : HD);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 14, 10]} />
        <Lane f={f} bits={() => step} colOf={colOf} />
      </Scene3D>
      <Title kicker="해결 ①: 한 칸에 더 싣기">같은 칸, 위상(그리고 세기)을 바꿔 비트를 늘린다</Title>
      <Svg>
        <Constellation x={1600} y={300} r={115} mod={mod} a={at(f, 12)} label={name} col={colOf(step)} />
        <Note x={150} y={760} w={1180} a={at(f, cues[0] + 40)} col={HD} lines={[["성좌점", "= 한 칸이 가질 수 있는 위상·세기의 자리. 점이 4개면 2비트, 16개면 4비트"]]} />
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. 오류 정정 + 펑처링 (2D) */
const IN = [0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
const Fec: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), a0 = at(f, 8), a1 = at(f, cues[1]), a2 = at(f, cues[1] + 60), a3 = at(f, cues[1] + 120);
  const enc = hdtFecEncode(IN).slice(0, 24), pat = [1, 1, 0, 1, 0, 1], kept = hdtPuncture(enc, "3/4");
  const cell = (x: number, y: number, b: number, col: string, cross = false, key?: string) => (
    <g key={key} transform={`translate(${x},${y})`}>
      <rect width={52} height={56} rx={8} fill={cross ? "#1e293b" : col} opacity={cross ? 0.6 : 1} />
      <text x={26} y={39} textAnchor="middle" fill={cross ? C.faint : C.bg} fontSize={28} fontWeight={900}>{b}</text>
      {cross && <path d="M8 8 L44 48 M44 8 L8 48" stroke={BAD} strokeWidth={5} />}
    </g>
  );
  return (
    <>
      <Title kicker="해결 ②: 오류 정정 + 펑처링">비트를 두 배로 만들었다가, 무늬대로 덜어 낸다</Title>
      <Svg>
        <Constellation x={960} y={430} r={200} mod="16qam" a={a0 * (1 - a1)} noise={0.17} label="16QAM에 잡음이 끼면" />
        <g opacity={a1} transform="translate(140,250)">
          <text x={0} y={-20} fill={C.text} fontSize={28} fontWeight={900}>보낼 비트</text>
          {IN.map((b, i) => cell(i * 60, 0, b, C.text, false, "i" + i))}
        </g>
        <g opacity={a2} transform="translate(140,420)">
          <text x={0} y={-20} fill={C.text} fontSize={28} fontWeight={900}>오류 정정 부호 (부호율 ½): 두 배</text>
          {enc.map((b, i) => cell(i * 56, 0, b, i % 2 ? C.accent2 : G2, false, "e" + i))}
        </g>
        <g opacity={a3} transform="translate(140,590)">
          <text x={0} y={-20} fill={C.text} fontSize={28} fontWeight={900}>펑처링 (무늬 1 1 0 1 0 1 → 부호율 ¾)</text>
          {enc.map((b, i) => cell(i * 56, 0, b, i % 2 ? C.accent2 : G2, !pat[i % 6], "p" + i))}
          <text x={0} y={110} fill={OK} fontSize={26} fontWeight={800}>{enc.length}비트 중 {kept.length}비트만 보낸다 → 오류를 고칠 힘은 남기고 속도는 되찾는다</text>
        </g>
        <Note x={140} y={760} w={1240} a={a0 * (1 - a1)} col={BAD} lines={[["점이 촘촘하면", "같은 잡음에도 옆 점으로 잘못 읽힌다(빨강)"]]} />
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 패킷마다 속도 (3D) */
const rateAt = (x: number) => (x < 14 ? HDT_RATES[4] : x < 22 ? HDT_RATES[2] : HDT_RATES[0]);
const Rate: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [6, 18, 40], look: [6, 4, 0], fov: 42 }, { pos: [10, 18, 40], look: [10, 4, 0], fov: 42 }, f / len);
  const bx = interpolate(f, [cues[1], len - 30], [8, 28], clamp), r = rateAt(bx);
  const packets = Array.from({ length: Math.floor(len / 22) }, (_, i) => i * 22);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} />
        <Bud x={bx} />
        {packets.map((t0) => { const pr = rateAt(interpolate(t0, [cues[1], len - 30], [8, 28], clamp)); const b: Vec = [bx, 5, 0]; return (
          <group key={t0}>
            <Packet3D f={f} t0={t0} t1={t0 + 26} a={PP} b={b} col={RCOL[pr.name]} size={0.9} />
            <Packet3D f={f} t0={t0 - 2} t1={t0 + 24} a={PP} b={b} col="#ffffff" size={0.45} />
          </group>
        ); })}
      </Scene3D>
      <Title kicker="해결 ③: 패킷마다 속도 고르기">앞머리에 속도를 적고, 멀어지면 바로 낮춘다</Title>
      <Svg>
        {lab(cam, [bx, 9, 0], `${r.name} · ${r.mbps} Mb/s`, RCOL[r.name], 1, -20, 34)}
        {lab(cam, [PP[0], 0, 0], "휴대폰", G2, 1, 60)}
        <Note x={240} y={760} w={1440} a={at(f, cues[0] + 20)} col="#ffffff" lines={[["흰 조각 = 제어 헤더", "늘 2 Mb/s·부호율 ½로 보내고, 3비트 RI 칸에 이 패킷의 속도를 적는다"]]} />
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 7. 긴 패킷, 깨진 블록만 다시 (3D + 2D 비교) */
const Block: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [-2, 14, 32], look: [-2, -1, 0], fov: 42 }, { pos: [2, 15, 30], look: [-2, -1, 0], fov: 42 }, f / len);
  const N = 8, broke = 5, tB = 60, tR = tB + 50, fixed = f > tR + 30;
  const bx = (i: number) => -14 + i * 3.2;
  const cmp = at(f, cues[1]);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 16, 10]} />
        {Array.from({ length: N }, (_, i) => { const bad = i === broke && f > tB && !fixed; return (
          <group key={i} position={[bx(i), 1.5, 0]}>
            <mesh><boxGeometry args={[2.6, 2.6, 2.6]} />{mat(bad ? BAD : HD, bad ? 0.9 : 0.35)}</mesh>
            <mesh position={[1.45, 0, 0]}><boxGeometry args={[0.3, 2.6, 2.6]} />{mat(bad ? BAD : OK, 0.8)}</mesh>
          </group>
        ); })}
        <Packet3D f={f} t0={tR} t1={tR + 30} a={[bx(broke), 12, -6]} b={[bx(broke), 1.5, 0]} col={HD} size={2.6} arc={0} />
      </Scene3D>
      <Title kicker="해결 ④: 긴 패킷, 블록 단위 확인">한 덩어리 최대 8,175바이트, 깨진 블록만 다시</Title>
      <Svg>
        {lab(cam, [bx(broke), 4, 0], f > tB && !fixed ? "CRC 틀림 → 이 블록만 다시" : fixed ? "✓" : "", f > tB && !fixed ? BAD : OK, f > tB ? 1 : 0, -20, 28)}
        {lab(cam, [bx(0) + 1.45, -0.2, 1.5], "초록 = 블록마다 32비트 CRC", OK, at(f, 20), 50, 24)}
        <g opacity={cmp} transform="translate(200,690)">
          <rect x={-30} y={-40} width={1580} height={200} rx={18} fill={C.panel} opacity={0.94} />
          <text x={0} y={0} fill={G2} fontSize={24} fontWeight={900}>GFSK</text>
          {Array.from({ length: 6 }, (_, i) => <g key={i}><rect x={110 + i * 230} y={-26} width={130} height={36} rx={6} fill={G2} /><rect x={110 + i * 230 + 140} y={-26} width={70} height={36} rx={6} fill="#475569" /></g>)}
          <text x={0} y={90} fill={HD} fontSize={24} fontWeight={900}>HDT</text>
          <rect x={110} y={64} width={1150} height={36} rx={6} fill={HD} />
          <rect x={1270} y={64} width={70} height={36} rx={6} fill="#475569" />
          <text x={1360} y={-2} fill={C.dim} fontSize={22} fontWeight={700}>회색 = 틈·응답</text>
        </g>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 8. 대가: 센 신호, 새 칩 (3D 동심원) */
const Cost: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp({ pos: [-6, 34, 30], look: [-6, 0, 0], fov: 42 }, { pos: [-6, 30, 34], look: [-6, 1, 0], fov: 42 }, f / len);
  const rings = at(f, cues[1], 40), chip = at(f, cues[2]);
  // 같은 환경(자유 공간, 경로 손실 지수 2)에서 감도 차이만큼의 상대 반경: HDT2(−75 dBm)를 18로 두고 r ∝ 10^((−75 − sens)/20)
  const R = (s: number) => 18 * Math.pow(10, (-75 - s) / 20);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 22, 8]} />
        <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0.3]}><boxGeometry args={[2.4, 4.6, 0.4]} />{mat("#d9e2f0", 0.1)}</mesh>
        <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0.3]}><boxGeometry args={[2.1, 4.2, 0.05]} />{mat(G2, 0.6)}</mesh>
        {HDT_RATES.map((h, i) => rings > i * 0.15 && <mesh key={h.name} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 + i * 0.02, 0]}><ringGeometry args={[R(h.sens) - 0.25, R(h.sens), 72]} />{mat(RCOL[h.name], 0.9)}</mesh>)}
        {chip > 0 && <><mesh position={[0, 1, 0]}><boxGeometry args={[1.4, 0.5, 1.4]} />{mat(HD, 1.2, chip)}</mesh><Earbud3D p={[14, 3.4, 6]} ry={-1.2} s={1.4} /><mesh position={[14, 1, 8]}><boxGeometry args={[1.6, 0.4, 1.6]} />{mat(HD, 1.2, chip)}</mesh></>}
      </Scene3D>
      <Title kicker="단점">빠를수록 센 신호, 양쪽 모두 새 칩</Title>
      <Svg>
        {HDT_RATES.map((h, i) => <g key={h.name} opacity={rings > i * 0.15 ? 1 : 0} transform={`translate(130,${300 + i * 62})`}><rect x={0} y={-22} width={44} height={10} rx={5} fill={RCOL[h.name]} /><text x={60} y={-8} fill={RCOL[h.name]} fontSize={30} fontWeight={900}>{h.name}</text><text x={230} y={-8} fill={C.text} fontSize={28} fontWeight={800}>≤ {h.sens.toString().replace("-", "−")} dBm</text></g>)}
        <text x={130} y={640} fill={C.dim} fontSize={24} fontWeight={700} opacity={rings}>바깥 원일수록 약한 신호도 받는다</text>
        {lab(cam, [0, 1, 0], "7.0 HDT 칩", HD, chip, 60, 26)}
        {lab(cam, [14, 1, 8], "7.0 HDT 칩", HD, chip, 40, 26)}
        <text x={110} y={200} fill={C.faint} fontSize={22} opacity={rings}>원 = 사양 최소 감도의 차이를 같은 환경(자유 공간 가정)에서 비교한 상대 크기. 실제 거리는 환경마다 다르다</text>
      </Svg>
    </>
  );
};

/* ---------------------------------------------------------------- 9. 정리 */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM, { pos: [8, 18, 36], look: [0, 4, 0], fov: 40 }, f / len);
  const L: [string, string, string][] = [["문제", "LE 2M의 실제 천장 약 1.4 Mb/s, 박자는 못 올린다", G2], ["해결", "박자 그대로, 한 칸에 최대 4비트 + 오류 정정·펑처링", HD], ["해결", "패킷마다 속도를 고르고, 깨진 블록만 다시", HD], ["대가", "빠를수록 센 신호, 양쪽 모두 새 칩", C.warn]];
  const step = (len - 40) / L.length;
  return (
    <>
      <Scene3D cam={cam}>
        <Ground />
        <PhoneAt x={PP[0]} />
        <Bud x={EP[0]} />
        {Array.from({ length: 20 }, (_, i) => <Packet3D key={i} f={f} t0={i * 12} t1={i * 12 + 22} a={PP} b={EP} col={HD} size={0.7} />)}
      </Scene3D>
      <Svg>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.5} />
        {L.map(([k, v, col], i) => (
          <g key={i} opacity={at(f, (cues[0] ?? 0) + i * step * 0.8)} transform={`translate(110,${190 + i * 150})`}>
            <rect x={0} y={0} width={1100} height={118} rx={22} fill={C.panel} stroke={col} strokeWidth={3} opacity={0.95} />
            <text x={36} y={74} fill={col} fontSize={34} fontWeight={900}>{k}</text>
            <text x={150} y={74} fill={C.text} fontSize={32} fontWeight={800}>{v}</text>
          </g>
        ))}
      </Svg>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook cues={s.cues} len={s.frames} />;
    case "ceiling": return <Ceiling cues={s.cues} />;
    case "slot": return <Slot cues={s.cues} len={s.frames} />;
    case "more": return <More cues={s.cues} len={s.frames} />;
    case "fec": return <Fec cues={s.cues} />;
    case "rate": return <Rate cues={s.cues} len={s.frames} />;
    case "block": return <Block cues={s.cues} len={s.frames} />;
    case "cost": return <Cost cues={s.cues} len={s.frames} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Hdt = makeVideo("hdt", scenesFor, LEAD, body);
