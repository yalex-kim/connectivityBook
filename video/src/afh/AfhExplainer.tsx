import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { csa2Channel, CH_ID, expectedLoss, simulate, wifiBlocked, WIFI } from "../book";
import { CASES } from "./script";
import { DeviceRoom } from "./devices";
import { Stage3D, Waterfall3D, camLerp, chX, type Cam, type Vec } from "./world3d";
import { Band, Caption, Card, Grid, RunningLoss, Title, clamp, fade, useFont, useIn } from "./parts";

import { LEAD, scenesFor, type Timed } from "./timing";

const BLOCKED = wifiBlocked(WIFI);
const ONE = wifiBlocked([6]);
const ALL37 = Array(37).fill(true);
const GRID_N = 60; // 격자에 그리는 이벤트
const RUN_N = 600; // 누적 그래프에 쓰는 이벤트(같은 씨앗, 고르지 않음)
const HOP = simulate(RUN_N, false), AFH = simulate(GRID_N, true);
const EXP = expectedLoss(WIFI, 0.5);
const wifiAll = (a: number) => WIFI.map((ch, i) => ({ ch, a: interpolate(a * 3 - i, [0, 1], [0, 1], clamp) }));

/* 1. 훅: 같은 방에서 Wi-Fi 기기와 블루투스 기기를 함께 쓴다 */
const Hook: React.FC = () => (
  <>
    <DeviceRoom />
    <Title kicker="BLUETOOTH × Wi-Fi">같은 대역, 왜 서로를 망가뜨리지 않을까?</Title>
  </>
);

/* 2. 같은 대역 (3D): 위에서 크게 보다가 다가간다 */
const Legend: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <div style={{ position: "absolute", left: 110, top: 850, display: "flex", gap: 34, fontFamily: FONT, fontSize: 24, color: C.dim }}>
    {items.map(([col, t]) => <span key={t}><span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 4, background: col, marginRight: 10 }} />{t}</span>)}
  </div>
);
const BAND_LEGEND: [string, string][] = [[C.accent2, "2.4 GHz ISM 대역 경계 (2,400~2,483.5 MHz)"], [C.warn, "Wi-Fi 1·6·11"], ["#62738f", "블루투스 LE 채널 37개"], [C.bad, "전자레인지"]];

const BandScene: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), w = interpolate(f, [30, 110], [0, 1], clamp);
  const cam = camLerp({ pos: [0, 78, 92], look: [0, 0, 0], fov: 42 }, { pos: [0, 30, 60], look: [0, 4, 0], fov: 40 }, f / len);
  return (
    <>
      <Stage3D cam={cam} ism={interpolate(f, [0, 25], [0, 1], clamp)} wifi={[0, 1, 2].map((i) => interpolate(w * 3 - i, [0, 1], [0, 1], clamp)) as [number, number, number]} pillars={interpolate(f, [80, 150], [0, 1], clamp)} color={() => "#7f93b3"} microwave={interpolate(f, [cues[1], cues[1] + 30], [0, 1], clamp)} />
      <Title kicker="같은 대역">2.4 GHz를 함께 쓰는 이웃들</Title>
      <Legend items={BAND_LEGEND} />
    </>
  );
};

/* 3. 도약 (3D): 옆으로 미끄러지는 카메라 앞에서 패킷이 기둥 사이를 뛴다 */
const HopScene: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), P = 9, e = Math.floor(f / P), p = (f % P) / P;
  const ch = (k: number) => csa2Channel(k, CH_ID, ALL37), top = 8.2;
  const at = (k: number): Vec => [chX(ch(k)), top, 0];
  const a = at(e), b = at(e + 1), ball: Vec = [a[0] + (b[0] - a[0]) * p, top + Math.sin(Math.PI * p) * 7, 0];
  const trail = [3, 2, 1].map((d) => at(e - d + 1)).filter((_, i) => e - 3 + i >= 0);
  const cam = camLerp({ pos: [-62, 30, 74], look: [-4, 5, 0], fov: 40 }, { pos: [58, 26, 70], look: [4, 5, 0], fov: 40 }, f / len);
  return (
    <>
      <Stage3D cam={cam} wifi={[1, 1, 1]} pillars={1} color={(c) => (c === ch(e) ? C.text : C.accent)} ball={ball} trail={trail} />
      <Title kicker="주파수 도약">한 채널에 머물지 않고 계속 옮겨 다닌다</Title>
    </>
  );
};

/* 5. 덮인 채널 (3D): 위로 올라가 내려다보며, 벽 아래 기둥이 주황으로 바뀐다 */
const Cover: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), one = cues[1], half = cues[2], three = f > half;
  const order = [...(three ? BLOCKED : ONE)].sort((a, b) => a - b);
  const prog = three ? interpolate(f, [half + 10, Math.min(len - 30, half + 90)], [0, 1], clamp) : interpolate(f, [one, Math.min(half - 10, one + 90)], [0, 1], clamp);
  const covered = new Set(order.slice(0, Math.round(prog * order.length)));
  const side = interpolate(f, [half, half + 30], [0, 1], clamp);
  const cam = camLerp({ pos: [0, 34, 60], look: [0, 3, 0], fov: 40 }, { pos: [0, 66, 26], look: [0, 0, 3], fov: 40 }, f / len);
  return (
    <>
      <Stage3D cam={cam} wifi={[side, 1, side]} pillars={1} color={(c) => (covered.has(c) ? C.warn : C.accent)} />
      <Title kicker="얼마나 부딪힐까">Wi-Fi가 덮는 블루투스 채널은 몇 개?</Title>
      <div style={{ position: "absolute", top: 160, right: 110, fontFamily: FONT, textAlign: "right" }}>
        <span style={{ color: C.dim, fontSize: 32, marginRight: 16 }}>{three ? "Wi-Fi 1·6·11" : "Wi-Fi 6 하나"}</span>
        <span style={{ color: C.warn, fontSize: 64, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{covered.size} / 37</span>
      </div>
    </>
  );
};

/* 6. 공식과 조건별 예시 */
const Formula: React.FC<{ cues: number[] }> = ({ cues }) => {
  const a = useIn(10);
  return (
    <>
      <Title kicker="계산">깨질 확률은 두 비율의 곱</Title>
      <Card x={260} y={210} w={1400} a={a}>
        <div style={{ fontSize: 46, fontWeight: 800, textAlign: "center" }}>
          깨질 확률 ≈ <span style={{ color: C.warn }}>덮인 채널 비율</span> × <span style={{ color: C.warn }}>Wi-Fi가 말하는 시간 비율</span>
        </div>
      </Card>
      {CASES.map(([name, w, d], i) => <CaseBar key={name} i={i} name={name} wifi={w} duty={d} at={cues[i + 1]} />)}
      <div style={{ position: "absolute", top: 838, left: 0, right: 0, textAlign: "center", fontFamily: FONT, color: C.dim, fontSize: 28 }}>겹치면 깨진다고 단순화한 계산 · 같은 공식, 다른 조건이면 숫자도 바뀐다</div>
    </>
  );
};
const CaseBar: React.FC<{ i: number; name: string; wifi: number[]; duty: number; at: number }> = ({ i, name, wifi, duty, at }) => {
  const a = useIn(at), nb = wifiBlocked(wifi).size, v = expectedLoss(wifi, duty);
  return (
    <div style={{ position: "absolute", left: 260, top: 400 + i * 140, width: 1400, height: 110, opacity: a, fontFamily: FONT, display: "flex", alignItems: "center", gap: 30 }}>
      <div style={{ width: 380, color: C.text, fontSize: 36, fontWeight: 700 }}>{name}</div>
      <div style={{ width: 300, color: C.dim, fontSize: 32, fontVariantNumeric: "tabular-nums" }}>{nb}/37 × {Math.round(duty * 100)}%</div>
      <div style={{ flex: 1, height: 54, background: "#1b2740", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ width: `${(v / 0.5) * 100 * a}%`, height: "100%", background: C.bad, borderRadius: 12 }} />
      </div>
      <div style={{ width: 170, textAlign: "right", color: C.bad, fontSize: 48, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{(v * 100).toFixed(1)}%</div>
    </div>
  );
};

/* 7. 폭포형 시간 지도 (3D) + 누적 손실률 그래프 */
const GridScene: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), t = interpolate(f, [8, len - 24], [0, 1], clamp), n = Math.pow(t, 1.4) * RUN_N;
  const cam = camLerp({ pos: [18, 52, 150], look: [22, 0, 40], fov: 40 }, { pos: [34, 44, 136], look: [24, 0, 44], fov: 40 }, f / len);
  return (
    <>
      <Waterfall3D cam={cam} events={HOP} shown={Math.max(1, n)} blocked={BLOCKED} />
      <Title kicker="실제로 뛰어 보면 · Wi-Fi 1·6·11, 각 50%">처음엔 들쭉날쭉, 길게 보면 계산값 근처</Title>
      <div style={{ position: "absolute", left: 1150, top: 230, width: 690, height: 610, background: "rgba(11,18,32,.82)", borderRadius: 20 }} />
      <RunningLoss x={1220} y={260} w={580} h={480} events={HOP} shown={n} expected={EXP} />
      <Legend items={[[C.warn, "Wi-Fi가 말하는 칸"], [C.accent, "성공한 패킷"], [C.bad, "깨진 패킷"]]} />
    </>
  );
};

/* 8. 재전송 (도식): 데이터는 다시 보내 복구되지만 늦어지고, 오디오는 재생 시각을 놓치면 끊긴다 */
const Retx: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), c1 = cues[1], c2 = Math.round(c1 + 0.45 * (len - c1));
  const X0 = 300, DX = 230, ev = (i: number) => X0 + i * DX;
  const pk = (x: number, y: number, col: string, a: number, label: string, broken = false) => (
    <g opacity={a} transform={`translate(${x},${y - 30 * (1 - a)})`}>
      <rect x={-48} y={-30} width={96} height={60} rx={12} fill={col} opacity={broken ? 0.35 : 1} />
      <text x={0} y={10} textAnchor="middle" fill={broken ? C.bad : C.bg} fontFamily={FONT} fontSize={28} fontWeight={900}>{label}</text>
      {broken && <text x={0} y={14} textAnchor="middle" fill={C.bad} fontFamily={FONT} fontSize={64} fontWeight={900}>✕</text>}
    </g>
  );
  const appear = (s: number) => interpolate(f, [s, s + 12], [0, 1], clamp);
  // 위: 데이터 줄
  const dY = 360, aY = 690;
  return (
    <>
      <Title kicker="재전송">다시 보내면 되지 않나?</Title>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[["데이터", dY], ["오디오", aY]].map(([t, y]) => (
          <g key={t as string}>
            <text x={110} y={(y as number) + 10} fill={C.text} fontFamily={FONT} fontSize={34} fontWeight={800}>{t}</text>
            <line x1={X0 - 70} x2={ev(6) + 40} y1={(y as number) + 60} y2={(y as number) + 60} stroke={C.faint} strokeWidth={3} />
            {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={ev(i)} x2={ev(i)} y1={(y as number) + 50} y2={(y as number) + 70} stroke={C.faint} strokeWidth={3} />)}
            <text x={ev(6) + 40} y={(y as number) + 100} textAnchor="end" fill={C.faint} fontFamily={FONT} fontSize={22}>연결 이벤트 →</text>
          </g>
        ))}
        {/* 데이터: 1 성공, 2 깨짐, 다음 기회에 2를 다시 보내 성공, 3은 한 칸 밀림 */}
        {pk(ev(0), dY, C.accent, appear(10), "1")}
        {pk(ev(1), dY, C.accent, appear(35), "2", f > 55)}
        <g opacity={appear(70)}>
          <path d={`M ${ev(1)} ${dY - 40} Q ${(ev(1) + ev(2)) / 2} ${dY - 120} ${ev(2)} ${dY - 40}`} fill="none" stroke={C.ok} strokeWidth={4} strokeDasharray="10 8" />
          <text x={(ev(1) + ev(2)) / 2} y={dY - 108} textAnchor="middle" fill={C.ok} fontFamily={FONT} fontSize={26} fontWeight={700}>다시 보냄</text>
        </g>
        {pk(ev(2), dY, C.ok, appear(85), "2")}
        {pk(ev(3), dY, C.accent, appear(105), "3")}
        <g opacity={appear(c1)}>
          <rect x={ev(2) - 50} y={dY + 82} width={DX * 1 + 100} height={52} rx={12} fill={C.warn} opacity={0.18} />
          <text x={ev(2) + DX / 2} y={dY + 118} textAnchor="middle" fill={C.warn} fontFamily={FONT} fontSize={28} fontWeight={800}>그만큼 늦어진다 (뒤 패킷도 밀림)</text>
        </g>
        {/* 오디오: 재생 시각(점선)까지 와야 한다. 다시 보낸 조각은 시각을 놓쳐 버려지고, 소리에 빈틈 */}
        <g opacity={appear(c1 - 10)}>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <line x1={ev(i) + 160} x2={ev(i) + 160} y1={aY - 150} y2={aY + 60} stroke={C.text} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
              <text x={ev(i) + 160} y={aY - 160} textAnchor="middle" fill={C.dim} fontFamily={FONT} fontSize={22}>♪{i + 1} 재생 시각</text>
            </g>
          ))}
          {pk(ev(0), aY, C.accent, appear(c1), "♪1")}
          {pk(ev(1), aY, C.accent, appear(c1 + 15), "♪2", f > c1 + 30)}
          {pk(ev(2), aY, C.accent, appear(c1 + 30), "♪3")}
          {pk(ev(2), aY - 90, C.warn, appear(c2), "♪2")}
        </g>
        <g opacity={appear(c2 + 15)}>
          <text x={ev(2) + 80} y={aY - 82} textAnchor="start" fill={C.bad} fontFamily={FONT} fontSize={26} fontWeight={800}>♪2 재생 시각이 지나 버림</text>
          {/* 소리 파형: ♪2 자리가 비어 끊김 */}
          {Array.from({ length: 90 }, (_, i) => {
            const x = X0 - 40 + i * 12, gap = x > ev(1) + 40 && x < ev(1) + 160 + 40;
            const h = gap ? 0 : 10 + 26 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23));
            return <rect key={i} x={x} y={aY + 120 - h} width={6} height={h * 2} rx={3} fill={C.accent2} opacity={0.8} />;
          })}
          <text x={ev(1) + 100} y={aY + 200} textAnchor="middle" fill={C.bad} fontFamily={FONT} fontSize={28} fontWeight={800}>끊김</text>
        </g>
      </svg>
    </>
  );
};

/* 9. AFH (3D): 덮인 기둥이 가라앉고, 남은 줄로만 흐르는 폭포 */
const Afh: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), go = cues[1] + 75, rm = interpolate(f, [cues[1], cues[1] + 60], [0, 1], clamp), shown = interpolate(f, [go, len - 10], [1, GRID_N], clamp), info = useIn(cues[2]);
  const lost = AFH.slice(0, Math.floor(shown)).filter((e) => e.hit).length;
  const stageCam = camLerp({ pos: [0, 40, 60], look: [0, 2, 0], fov: 40 }, { pos: [0, 30, 48], look: [0, 2, 0], fov: 40 }, f / go);
  const fallCam = camLerp({ pos: [10, 50, 140], look: [12, 0, 40], fov: 40 }, { pos: [26, 40, 128], look: [16, 0, 46], fov: 40 }, (f - go) / (len - go));
  return (
    <>
      {f < go ? (
        <Stage3D cam={stageCam} wifi={[1, 1, 1]} pillars={1} color={(c) => (BLOCKED.has(c) ? C.warn : C.accent)} removed={(c) => (BLOCKED.has(c) ? rm : 0)} />
      ) : (
        <Waterfall3D cam={fallCam} events={AFH} shown={shown} blocked={BLOCKED} laneOff={1} />
      )}
      <Title kicker="AFH · 적응형 주파수 도약">붐비는 채널을 채널 맵에서 빼고 뛴다</Title>
      {f >= go && (
        <Card x={1290} y={250} w={520} h={540}>
          <div style={{ fontSize: 30, color: C.dim }}>이 가정에서 깨진 패킷</div>
          <div style={{ fontSize: 80, fontWeight: 900, color: C.ok, marginTop: 6 }}>{lost} / {Math.max(1, Math.floor(shown))}</div>
          <div style={{ fontSize: 28, color: C.dim, marginTop: 30, lineHeight: 1.6, opacity: info }}>
            <b style={{ color: C.text }}>Classic</b> 79채널 · 최소 20개 사용<br />
            <b style={{ color: C.text }}>저전력(LE)</b> 37채널 · 최소 2개 사용<br />
            둘 다 채널 맵으로 도약할 채널을 고른다
          </div>
        </Card>
      )}
    </>
  );
};

/* 10. 채널 맵 만들기: 재기 → 가리기 → 보내기 → 같은 맵으로 뛰기 */
const MapScene: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), m = cues[1], send = cues[2];
  const X0 = 420, CW = 29, Y = 330;
  const scan = interpolate(f, [m, m + 110], [0, 37], clamp); // 재면서 가리기
  const bits = interpolate(f, [send, send + 25], [0, 1], clamp); // 채널 맵 만들기
  const fly = interpolate(f, [send + 30, send + 95], [0, 1], clamp); // 상대에게 보내기
  const both = interpolate(f, [send + 100, send + 120], [0, 1], clamp); // 같은 맵으로 뛰기
  const good = [...Array(37).keys()].filter((c) => !BLOCKED.has(c));
  const hopCh = good[Math.floor(f / 8) % good.length * 7 % good.length];
  const dev = (x: number, label: string, icon: React.ReactNode, on: number) => (
    <g>
      <circle cx={x} cy={Y + 150} r={92} fill={C.panel} stroke={on ? C.ok : "#2a3a58"} strokeWidth={4} />
      <g transform={`translate(${x},${Y + 150})`}>{icon}</g>
      <text x={x} y={Y + 285} textAnchor="middle" fill={C.text} fontFamily={FONT} fontSize={30} fontWeight={700}>{label}</text>
      <g opacity={on}>
        <rect x={x - 70} y={Y + 305} width={140} height={40} rx={20} fill={C.ok} />
        <text x={x} y={Y + 333} textAnchor="middle" fill={C.bg} fontFamily={FONT} fontSize={24} fontWeight={800}>같은 맵</text>
      </g>
    </g>
  );
  const phone = <g><rect x={-30} y={-56} width={60} height={112} rx={12} fill={C.panel} stroke={C.text} strokeWidth={4} /><rect x={-22} y={-44} width={44} height={84} rx={4} fill="#1d3557" /></g>;
  const buds = <g>{[-24, 24].map((x) => <g key={x} transform={`translate(${x},0) scale(${x < 0 ? -1 : 1},1)`}><circle cx={0} cy={-12} r={17} fill={C.panel} stroke={C.text} strokeWidth={4} /><rect x={4} y={-8} width={12} height={42} rx={6} fill={C.panel} stroke={C.text} strokeWidth={4} /></g>)}</g>;
  return (
    <>
      <Title kicker="채널 맵">피할 채널은 어떻게 알까?</Title>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {dev(230, "센트럴", phone, both)}
        {dev(1690, "상대 기기", buds, both)}
        <text x={X0} y={Y - 18} fill={C.dim} fontFamily={FONT} fontSize={26}>채널 0 ~ 36</text>
        {Array.from({ length: 37 }, (_, c) => {
          const done = c < scan, bad = BLOCKED.has(c);
          return (
            <g key={c}>
              <rect x={X0 + c * CW} y={Y} width={CW - 4} height={64} rx={5} fill={!done ? "#2b3b57" : bad ? C.bad : C.ok} opacity={done ? 0.9 : 1} />
              {done && bad && <text x={X0 + c * CW + (CW - 4) / 2} y={Y + 42} textAnchor="middle" fill="#fff" fontFamily={FONT} fontSize={22} fontWeight={900}>✕</text>}
              <g opacity={bits}>
                <rect x={X0 + c * CW} y={Y + 110} width={CW - 4} height={50} rx={5} fill={bad ? "#1b2740" : "#16443a"} />
                <text x={X0 + c * CW + (CW - 4) / 2} y={Y + 145} textAnchor="middle" fill={bad ? C.faint : C.ok} fontFamily={FONT} fontSize={24} fontWeight={800}>{bad ? 0 : 1}</text>
              </g>
            </g>
          );
        })}
        {scan > 0 && scan < 37 && <rect x={X0 + scan * CW - 3} y={Y - 10} width={6} height={84} fill={C.text} />}
        <g opacity={interpolate(f, [m, m + 20], [0, 1], clamp)}>
          <text x={X0 + 37 * CW} y={Y - 18} textAnchor="end" fontFamily={FONT} fontSize={26}>
            <tspan fill={C.dim}>재서 가리기: </tspan><tspan fill={C.ok} fontWeight={700}>좋음</tspan><tspan fill={C.dim}> · </tspan><tspan fill={C.bad} fontWeight={700}>나쁨</tspan>
          </text>
        </g>
        <text x={X0} y={Y + 100} fill={C.dim} fontFamily={FONT} fontSize={26} opacity={bits}>채널 맵 (1 = 쓴다, 0 = 뺀다)</text>
        {fly > 0 && (
          <g transform={`translate(${interpolate(fly, [0, 1], [330, 1590])},${Y + 250})`} opacity={1 - both}>
            <rect x={-150} y={-34} width={300} height={68} rx={16} fill={C.accent} />
            <text x={0} y={-2} textAnchor="middle" fill={C.bg} fontFamily={FONT} fontSize={24} fontWeight={800}>새 채널 맵</text>
            <text x={0} y={24} textAnchor="middle" fill={C.bg} fontFamily={FONT} fontSize={20} fontWeight={700}>+ 적용 시점(instant)</text>
          </g>
        )}
        {both > 0 && (
          <g opacity={both}>
            <circle cx={X0 + hopCh * CW + (CW - 4) / 2} cy={Y + 135} r={20} fill="none" stroke={C.text} strokeWidth={4} />
            <text x={960} y={Y + 270} textAnchor="middle" fill={C.text} fontFamily={FONT} fontSize={30} fontWeight={700}>정해진 순간부터 둘이 같은 맵으로, 1인 채널만 골라 뛴다</text>
          </g>
        )}
      </svg>
    </>
  );
};

/* 11. 정리 (3D): AFH로 흐르는 폭포를 카메라가 크게 돌며 보여 준다 */
const Outro: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), a = useIn(0), b = useIn(cues[1]), ang = interpolate(f, [0, len], [-0.7, 0.5]);
  const cam: Cam = { pos: [Math.sin(ang) * 120, 60, 40 + Math.cos(ang) * 120], look: [0, 0, 40], fov: 40 };
  return (
    <>
      <Waterfall3D cam={cam} events={AFH} shown={interpolate(f, [0, len], [20, GRID_N], clamp)} blocked={BLOCKED} laneOff={1} />
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", fontFamily: FONT, textShadow: "0 4px 24px rgba(0,0,0,.8)" }}>
        <div style={{ opacity: a, color: C.text, fontSize: 60, fontWeight: 900, lineHeight: 1.3 }}>블루투스는 붐비는 채널을 알아내 <span style={{ color: C.accent }}>채널 맵에서 빼고 뛴다</span></div>
        <div style={{ opacity: b, color: C.text, fontSize: 38, fontWeight: 700, marginTop: 18 }}>그래서 같은 대역의 Wi-Fi와 함께 지낼 수 있다</div>
      </div>
    </>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook />;
    case "band": return <BandScene len={s.frames} cues={s.cues} />;
    case "hop": return <HopScene len={s.frames} />;
    case "cover": return <Cover len={s.frames} cues={s.cues} />;
    case "formula": return <Formula cues={s.cues} />;
    case "grid": return <GridScene len={s.frames} />;
    case "retx": return <Retx len={s.frames} cues={s.cues} />;
    case "afh": return <Afh len={s.frames} cues={s.cues} />;
    case "map": return <MapScene len={s.frames} cues={s.cues} />;
    case "outro": return <Outro len={s.frames} cues={s.cues} />;
  }
};

const SceneFrame: React.FC<{ s: Timed; voice: boolean }> = ({ s, voice }) => {
  const f = useCurrentFrame(), k = s.cues.filter((c) => c <= f).length - 1;
  return (
    <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
      {body(s)}
      {voice && (
        <Sequence from={LEAD} layout="none">
          <Audio src={staticFile(`audio/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption key={k} text={s.caption[Math.max(0, k)]} />
    </AbsoluteFill>
  );
};

export const AfhExplainer: React.FC<{ voice: boolean }> = ({ voice }) => {
  useFont();
  let at = 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1600px 900px at 50% 35%, #12213a, ${C.bg})` }}>
      {scenesFor(voice).map((s) => {
        const from = at;
        at += s.frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.frames}>
            <SceneFrame s={s} voice={voice} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
