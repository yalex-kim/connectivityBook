import { interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { adaptedHop, basicHop } from "../book";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { Title, clamp } from "../afh/parts";
import { at } from "../twokinds/TwoKinds";
import { project, Dots } from "../range/hook3d";
import { Phone3D } from "../connection/Connection";
import { DEEP, Earbud3D, Ground, Note, makeVideo } from "../common/kit";
import { ADDR, CLK0, UNUSED_TO } from "./script";
import { LEAD, scenesFor, type Timed } from "./timing";

/* 색: 휴대폰(Central) = 파랑, 이어폰(Peripheral) = 분홍, 지금 채널 = 노랑, 구간 = 세 색, 뺀 채널 = 빨강 */
const PH = C.accent, BD = "#f472b6", HOT = "#facc15", BAD = C.bad, OK = C.ok;
const SEGC = [C.accent2, DEEP, C.warn];
const hex = (v: number) => "0x" + v.toString(16).toUpperCase().padStart(2, "0");
/** Central 슬롯 i번째(클록 4틱마다)의 채널 */
const chAt = (clk: number) => basicHop(ADDR, clk).ch;
const USED = Array.from({ length: 79 }, (_, c) => c > UNUSED_TO);

/* ---------------------------------------------------------------- 3D: 79채널 위를 함께 뛰는 둘 */
const BX = (k: number) => (k - 39) * 0.55;
const PHP: Vec = [-30, 0, 6], BDP: Vec = [24, 0, 6];
const Band3D: React.FC<{ cam: Cam; f: number; ch: number; on: number; dir?: number }> = ({ cam, f, ch, on, dir = 0 }) => (
  <Scene3D cam={cam}>
    <Ground light={[0, 22, 14]} />
    {Array.from({ length: 79 }, (_, k) => (
      <mesh key={k} position={[BX(k), k === ch ? 2.2 : 0.6, 0]}>
        <boxGeometry args={[0.38, k === ch ? 4.4 : 1.2, 3]} />
        <meshStandardMaterial color={k === ch ? HOT : "#2c3f60"} emissive={k === ch ? HOT : "#000"} emissiveIntensity={k === ch ? 0.9 : 0} />
      </mesh>
    ))}
    <group position={[PHP[0] + 12, 0, PHP[2]]}><Phone3D /></group>
    <Earbud3D p={[BDP[0] - 1.3, 3.4, BDP[2]]} ry={-1.2} s={1.2} /><Earbud3D p={[BDP[0] + 1.3, 3.4, BDP[2]]} ry={1.9} s={1.2} />
    {dir >= 0 && <><Dots a={[PHP[0], 7, PHP[2]]} b={[BX(ch), 4.6, 0]} f={f} col={PH} on={on} n={5} speed={0.05} /><Dots a={[BX(ch), 4.6, 0]} b={[BDP[0], 4, BDP[2]]} f={f + 5} col={dir > 0 ? PH : BD} on={on} n={5} speed={0.05} /></>}
    {dir < 0 && <><Dots a={[BDP[0], 4, BDP[2]]} b={[BX(ch), 4.6, 0]} f={f} col={BD} on={on} n={5} speed={0.05} /><Dots a={[BX(ch), 4.6, 0]} b={[PHP[0], 7, PHP[2]]} f={f + 5} col={BD} on={on} n={5} speed={0.05} /></>}
  </Scene3D>
);
const CAM0: Cam = { pos: [-8, 26, 62], look: [0, 3, 2], fov: 40 }, CAM1: Cam = { pos: [8, 30, 58], look: [0, 3, 2], fov: 40 };

/* ---------------------------------------------------------------- 1. 훅 */
const Hook: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM0, CAM1, f / len), step = Math.floor(f / 10), ch = chAt(CLK0 + 4 * step);
  const q = at(f, cues[2]), [cx, cy] = project(cam, [BX(ch), 6, 0]);
  return (
    <>
      <Band3D cam={cam} f={f} ch={ch} on={at(f, cues[1])} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <text x={cx} y={cy - 16} textAnchor="middle" fill={HOT} fontSize={30} fontWeight={900}>{ch}번</text>
        {(() => { const [a, b] = project(cam, [BX(0), 0, 2.4]), [c, d] = project(cam, [BX(78), 0, 2.4]); return <><text x={a} y={b + 34} textAnchor="middle" fill={C.faint} fontSize={22}>0번 (2402 MHz)</text><text x={c} y={d + 34} textAnchor="middle" fill={C.faint} fontSize={22}>78번 (2480 MHz)</text></>; })()}
        {(() => { const [a, b] = project(cam, [PHP[0], 0, PHP[2] + 3]), [c, d] = project(cam, [BDP[0], 0, BDP[2] + 3]); return <><text x={a} y={b + 30} textAnchor="middle" fill={PH} fontSize={28} fontWeight={800}>휴대폰</text><text x={c} y={d + 30} textAnchor="middle" fill={BD} fontSize={28} fontWeight={800}>이어폰</text></>; })()}
        <g opacity={at(f, cues[1])} transform="translate(960,150)">
          <rect x={-250} y={-50} width={500} height={80} rx={40} fill={C.panel} stroke={HOT} strokeWidth={3} />
          <text x={0} y={2} textAnchor="middle" fill={C.text} fontSize={32} fontWeight={900}>79개 채널 · 1초에 최대 1600번</text>
        </g>
        <text x={960} y={300} textAnchor="middle" fill={C.accent} fontSize={110} fontWeight={900} opacity={q}>?</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 2. 같은 계산 */
const Same: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), step = Math.floor(interpolate(f, [cues[1], cues[3] + 60], [0, 6], clamp)), clk = CLK0 + 4 * step, ch = chAt(clk);
  const calc = at(f, cues[1]), bud = at(f, cues[2]), eq = at(f, cues[3]);
  const OFF = 0x3a5; // 예시 오프셋(이어폰 자기 시계와 휴대폰 시계의 차이)
  const col = (x: number, who: string, c: string, a: number, clkLine: string) => (
    <g opacity={a} transform={`translate(${x},250)`}>
      <text x={210} y={0} textAnchor="middle" fill={c} fontSize={34} fontWeight={900}>{who}</text>
      <rect x={0} y={30} width={420} height={140} rx={18} fill={C.panel} stroke={c} strokeWidth={3} />
      <text x={30} y={86} fill={C.dim} fontSize={24} fontWeight={700}>휴대폰 주소</text>
      <text x={390} y={86} textAnchor="end" fill={C.text} fontSize={26} fontWeight={900}>0x{ADDR.toString(16).toUpperCase()}</text>
      <text x={30} y={138} fill={C.dim} fontSize={24} fontWeight={700}>{clkLine}</text>
      <text x={390} y={138} textAnchor="end" fill={C.text} fontSize={26} fontWeight={900}>{hex(clk)}</text>
      <path d="M210 186 V236" stroke={C.faint} strokeWidth={4} />
      <rect x={60} y={240} width={300} height={90} rx={18} fill="#1b2840" stroke={DEEP} strokeWidth={3} />
      <text x={210} y={296} textAnchor="middle" fill={DEEP} fontSize={28} fontWeight={900}>도약 계산</text>
      <path d="M210 346 V396" stroke={C.faint} strokeWidth={4} />
      <text x={210} y={452} textAnchor="middle" fill={HOT} fontSize={54} fontWeight={900}>{ch}번 채널</text>
    </g>
  );
  return (
    <>
      <Title kicker="같은 계산">같은 입력이면, 같은 채널</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {col(330, "휴대폰 (Central)", PH, calc, "내 시계")}
        {col(1170, "이어폰", BD, bud, "내 시계 + 오프셋")}
        <g opacity={bud}>
          <text x={1380} y={808} textAnchor="middle" fill={C.dim} fontSize={22}>내 시계 {hex((clk - OFF) & 0xfff)} + 오프셋 {hex(OFF)} = {hex(clk)}</text>
        </g>
        <text x={960} y={705} textAnchor="middle" fill={OK} fontSize={60} fontWeight={900} opacity={eq}>=</text>
        <Note x={330} y={830} w={1260} a={calc} col={DEEP} lines={[["Central", "= 도약을 정하는 쪽. 이 영상은 휴대폰이 Central인 경우. 시계 = 312.5 µs마다 1씩 오르는 28비트 클록"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 3. 슬롯마다 */
const Slots: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), X0 = 260, SW = 120, N = 12, ch = at(f, cues[1]), talk = at(f, cues[2]);
  const per = Math.max(16, Math.floor((len - 40) / N)), slot = Math.min(N - 1, Math.max(0, Math.floor((f - 15) / per))), clk = CLK0 + 2 * slot, central = ((clk >>> 1) & 1) === 0;
  const cam = camLerp({ pos: [-4, 22, 52], look: [-2, 2, 2], fov: 40 }, { pos: [4, 24, 50], look: [-2, 2, 2], fov: 40 }, f / len);
  return (
    <>
      <Band3D cam={cam} f={f} ch={chAt(clk)} on={1} dir={talk > 0.5 ? (central ? 1 : -1) : 0} />
      <Title kicker="625 µs마다">슬롯마다 시계가 바뀌고, 채널도 바뀐다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {Array.from({ length: N }, (_, i) => {
          const c2 = CLK0 + 2 * i, cen = ((c2 >>> 1) & 1) === 0, cur = i === slot;
          return (
            <g key={i} opacity={i <= slot ? 1 : 0.25}>
              <rect x={X0 + i * SW + 4} y={190} width={SW - 8} height={86} rx={12} fill={talk > 0.5 ? (cen ? PH : BD) : "#24324a"} opacity={cur ? 1 : 0.6} stroke={cur ? HOT : "none"} strokeWidth={4} />
              <text x={X0 + i * SW + SW / 2} y={220} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={700}>{hex(c2)}</text>
              <text x={X0 + i * SW + SW / 2} y={262} textAnchor="middle" fill={HOT} fontSize={32} fontWeight={900} opacity={ch}>{chAt(c2)}</text>
            </g>
          );
        })}
        {(() => { const [x, y] = project(cam, [BX(chAt(clk)), 6.5, 0]); return <text x={x} y={y} textAnchor="middle" fill={HOT} fontSize={30} fontWeight={900}>{chAt(clk)}번</text>; })()}
        {(() => { const [a, b] = project(cam, [PHP[0], 0, PHP[2] + 3]), [c, d] = project(cam, [BDP[0], 0, BDP[2] + 3]); return <><text x={a} y={b + 30} textAnchor="middle" fill={PH} fontSize={28} fontWeight={800} opacity={talk > 0.5 && central ? 1 : 0.5}>휴대폰{talk > 0.5 && central ? " 말함" : ""}</text><text x={c} y={d + 30} textAnchor="middle" fill={BD} fontSize={28} fontWeight={800} opacity={talk > 0.5 && !central ? 1 : 0.5}>이어폰{talk > 0.5 && !central ? " 말함" : ""}</text></>; })()}
        <Note x={X0} y={790} w={N * SW} a={talk} col={DEEP} lines={[["슬롯", "= 625 µs(시계 두 칸). 시계 값의 둘째 비트가 0이면 휴대폰, 1이면 이어폰이 보낸다(사양 예제 주소로 계산)"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 4. 32개 구간 (3D 시간-채널 지도) */
const HOPS = 96, SX = 0.56, SZ = 0.34;
const Segment: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), shown = interpolate(f, [10, cues[2] + 40], [0, HOPS], clamp);
  const cam = camLerp({ pos: [-14, 52, 52], look: [0, 0, 2], fov: 40 }, { pos: [0, 70, 30], look: [0, 0, 2], fov: 40 }, interpolate(f, [cues[1], cues[3]], [0, 1], clamp));
  const P = (i: number, ch: number): Vec => [(i - HOPS / 2) * SX, 0.5, (39 - ch) * SZ];
  const seg = (i: number) => Math.floor(i / 32);
  return (
    <>
      <Scene3D cam={cam}>
        <Ground light={[0, 30, 10]} />
        {Array.from({ length: Math.floor(shown) }, (_, i) => {
          const ch = chAt(4 * i), c = SEGC[seg(i)];
          return <mesh key={i} position={P(i, ch)}><boxGeometry args={[SX * 0.8, 1, SZ * 0.9]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.5} /></mesh>;
        })}
        {[32, 64].map((i) => <mesh key={i} position={[(i - HOPS / 2) * SX - SX / 2, 0.05, 0]}><boxGeometry args={[0.1, 0.1, 79 * SZ]} /><meshStandardMaterial color={C.faint} /></mesh>)}
      </Scene3D>
      <Title kicker="도약 구간">32번 뛰는 동안 32개 채널을 한 번씩</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        {[0, 1, 2].map((s) => { const [x, y] = project(cam, [((s * 32 + 16) - HOPS / 2) * SX, 0, 39 * SZ + 3]); const n = new Set(Array.from({ length: 32 }, (_, k) => chAt(4 * (s * 32 + k)))).size; return <g key={s} opacity={at(f, s === 0 ? cues[1] : cues[2])}><text x={x} y={y + 10} textAnchor="middle" fill={SEGC[s]} fontSize={28} fontWeight={900}>구간 {s + 1}</text><text x={x} y={y + 42} textAnchor="middle" fill={C.text} fontSize={22}>서로 다른 채널 {n}개</text></g>; })}
        {(() => { const [x0, y0] = project(cam, [-HOPS / 2 * SX - 2, 0, 39 * SZ]), [x1, y1] = project(cam, [-HOPS / 2 * SX - 2, 0, -39 * SZ]); return <><text x={x0} y={y0} textAnchor="end" fill={C.faint} fontSize={22}>0번</text><text x={x1} y={y1} textAnchor="end" fill={C.faint} fontSize={22}>78번</text></>; })()}
        <text x={110} y={196} fill={C.dim} fontSize={22} opacity={at(f, 10)}>가로 = 휴대폰이 말하는 슬롯(차례대로) · 세로 = 채널 · 사양 예제 주소로 책의 계산</text>
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 5. AFH: 뺀 채널은 다시 고른다 */
const Afh: React.FC<{ cues: number[] }> = ({ cues }) => {
  const f = useCurrentFrame(), X0 = 300, W = 1320, Y0 = 700, H = 420, N = 64;
  const band = at(f, cues[0] + 10), re = at(f, cues[1]), keep = at(f, cues[2]);
  const X = (i: number) => X0 + (i / (N - 1)) * W, Y = (ch: number) => Y0 - (ch / 78) * H;
  return (
    <>
      <Title kicker="적응 도약 (AFH)">뺀 채널이 나오면, 쓰는 채널 목록에서 다시 고른다</Title>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={X0 - 20} y={Y(UNUSED_TO + 0.5)} width={W + 40} height={Y(0) - Y(UNUSED_TO + 0.5) + 12} fill={BAD} opacity={0.15 * band} />
        <text x={X0 + W + 30} y={(Y(0) + Y(UNUSED_TO)) / 2 + 8} fill={BAD} fontSize={24} fontWeight={800} opacity={band}>0~21번 뺌</text>
        <text x={X0 - 30} y={Y(78) + 8} textAnchor="end" fill={C.faint} fontSize={22}>78번</text>
        <text x={X0 - 30} y={Y(0) + 8} textAnchor="end" fill={C.faint} fontSize={22}>0번</text>
        {Array.from({ length: N }, (_, i) => {
          const clk = 4 * i, b = chAt(clk), a = adaptedHop(ADDR, clk, USED), moved = a !== b;
          return (
            <g key={i}>
              <circle cx={X(i)} cy={Y(b)} r={9} fill={moved ? BAD : OK} opacity={moved ? 1 - re * 0.6 : 0.4 + 0.6 * keep} />
              {moved && <g opacity={re}><line x1={X(i)} x2={X(i)} y1={Y(b)} y2={Y(a)} stroke={DEEP} strokeWidth={2} strokeDasharray="5 5" /><circle cx={X(i)} cy={Y(a)} r={10} fill={DEEP} /></g>}
            </g>
          );
        })}
        <g opacity={re} transform="translate(300,770)">
          <circle cx={10} cy={-8} r={10} fill={DEEP} /><text x={30} y={0} fill={C.text} fontSize={24} fontWeight={800}>다시 고른 채널</text>
          <circle cx={290} cy={-8} r={10} fill={OK} /><text x={310} y={0} fill={C.text} fontSize={24} fontWeight={800}>원래대로 쓰는 채널</text>
        </g>
        <Note x={X0} y={800} w={W} a={keep} col={DEEP} lines={[["AFH에서는", "이어폰이 바로 앞 휴대폰 슬롯과 같은 채널로 답한다. 그래서 1600번은 기본 도약일 때의 최대"]]} />
      </svg>
    </>
  );
};

/* ---------------------------------------------------------------- 6. 정리 (3D 위에) */
const Outro: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame(), cam = camLerp(CAM1, { pos: [20, 22, 44], look: [-4, 3, 4], fov: 40 }, f / len), ch = chAt(CLK0 + 4 * Math.floor(f / 10));
  const L: [string, string][] = [["휴대폰의 주소 + 시계 → 다음 채널", "도약 선택 커널"], ["이어폰도 같은 주소, 맞춘 시계로 같은 계산", "말하지 않아도 같은 채널"], ["1초에 최대 1600번", "32개씩 구간을 돌며, 뺀 채널은 다시 고른다"]];
  return (
    <>
      <Band3D cam={cam} f={f} ch={ch} on={1} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <rect x={0} y={0} width={1920} height={1080} fill={C.bg} opacity={0.5} />
        {L.map(([k, v], i) => (
          <g key={k} opacity={at(f, cues[i] ?? 0)} transform={`translate(110,${220 + i * 160})`}>
            <rect x={0} y={0} width={980} height={124} rx={22} fill={C.panel} stroke={i === 2 ? OK : DEEP} strokeWidth={3} opacity={0.95} />
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
    case "same": return <Same cues={s.cues} />;
    case "slots": return <Slots cues={s.cues} len={s.frames} />;
    case "segment": return <Segment cues={s.cues} len={s.frames} />;
    case "afh": return <Afh cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} len={s.frames} />;
  }
};
export const Hopping = makeVideo("hopping", scenesFor, LEAD, body);
export { Band3D as HopBand, CAM0 as HopCam };
