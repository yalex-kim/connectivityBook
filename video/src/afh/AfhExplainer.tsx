import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { csa2Channel, CH_ID, expectedLoss, simulate, wifiBlocked, WIFI } from "../book";
import { CASES, SCENES, type Scene } from "./script";
import { DeviceRoom } from "./devices";
import { Band, Caption, Card, Grid, RunningLoss, Title, clamp, fade, useFont, useIn } from "./parts";

import DURATIONS from "./durations.json";

/** 장면마다 애니메이션이 다 보이려면 필요한 최소 길이(프레임) */
const MIN: Record<Scene["id"], number> = { hook: 150, band: 200, hop: 120, cover: 280, formula: 300, grid: 200, retx: 210, afh: 300, map: 330, outro: 150 };
const LEAD = 9; // 음성은 장면 시작 0.3초 뒤에
const TAIL = 18; // 음성이 끝나고 0.6초 쉼

/** 길이와 문장 시작 시각(장면 안 프레임, 첫 문장은 0)이 정해진 장면 */
export type Timed = Scene & { cues: number[] };
type Dur = { dur: number; cues: number[]; text: string };
const DUR = DURATIONS as Record<string, Dur>;

/** 무음판: 문장 시작을 글자 수 비율로 나눈다 */
const silent = (s: Scene): Timed => {
  const total = s.say.reduce((n, x) => n + x.length, 0), span = s.frames - 30;
  let acc = 0;
  return { ...s, cues: s.say.map((x) => { const c = 10 + Math.round((span * acc) / total); acc += x.length; return c; }) };
};
/** 나레이션판: 장면 길이 = 음성 길이 + 여백(최소 길이 이상), 문장 시작 = 음성에서 찾은 시각 */
const voiced = (s: Scene): Timed => {
  const d = DUR[s.id];
  return { ...s, frames: Math.max(MIN[s.id], Math.ceil(d.dur * 30) + LEAD + TAIL), cues: [0, ...d.cues.map((c) => LEAD + Math.round(c * 30))] };
};
export const scenesFor = (voice: boolean): Timed[] => SCENES.map(voice ? voiced : silent);
export const framesFor = (voice: boolean) => scenesFor(voice).reduce((n, s) => n + s.frames, 0);

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

/* 2. 같은 대역 */
const BandScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Title kicker="같은 대역">2.4 GHz를 함께 쓰는 이웃들</Title>
      <Band x={160} y={300} w={1600} wifi={wifiAll(interpolate(f, [40, 130], [0, 1], clamp))} bars={interpolate(f, [100, 170], [0, 1], clamp)} ism={interpolate(f, [0, 30], [0, 1], clamp)} microwave={interpolate(f, [160, 190], [0, 1], clamp)} />
    </>
  );
};

/* 3. 도약 */
const HopScene: React.FC = () => {
  const f = useCurrentFrame(), e = Math.floor(f / 10);
  return (
    <>
      <Title kicker="주파수 도약">한 채널에 머물지 않고 계속 옮겨 다닌다</Title>
      <Band x={160} y={300} w={1600} wifi={wifiAll(1)} bars={1} dot={csa2Channel(e, CH_ID, ALL37)} />
    </>
  );
};

/* 5. 덮인 채널: 하나 → 셋 */
const Cover: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), one = cues[1], half = cues[2], three = f > half;
  const order = [...(three ? BLOCKED : ONE)].sort((a, b) => a - b);
  const prog = three ? interpolate(f, [half + 10, Math.min(len - 30, half + 90)], [0, 1], clamp) : interpolate(f, [one, Math.min(half - 10, one + 90)], [0, 1], clamp);
  const covered = new Set(order.slice(0, Math.round(prog * order.length)));
  const wifi = three ? wifiAll(interpolate(f, [half, half + 30], [1 / 3, 1], clamp)).map((w) => (w.ch === 6 ? { ...w, a: 1 } : w)) : [{ ch: 6, a: 1 }];
  return (
    <>
      <Title kicker="얼마나 부딪힐까">Wi-Fi가 덮는 블루투스 채널은 몇 개?</Title>
      <Band x={160} y={290} w={1600} wifi={wifi} bars={1} covered={covered} />
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

/* 7. 격자 + 누적 그래프 */
const GridScene: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), t = interpolate(f, [8, len - 24], [0, 1], clamp);
  return (
    <>
      <Title kicker="실제로 뛰어 보면 · Wi-Fi 1·6·11, 각 50%">처음엔 들쭉날쭉, 길게 보면 계산값 근처</Title>
      <Grid x={110} y={250} w={820} h={540} events={HOP.slice(0, GRID_N)} shown={t * GRID_N} blocked={BLOCKED} />
      <RunningLoss x={1060} y={250} w={750} h={540} events={HOP} shown={Math.pow(t, 1.4) * RUN_N} expected={EXP} />
    </>
  );
};

/* 8. 재전송 */
const Retx: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const a = useIn(10), b = useIn(cues[1]), c = useIn(Math.round(cues[1] + 0.45 * (len - cues[1])));
  const box = (txt: string, sub: string, col: string, p: number, x: number) => (
    <Card x={x} y={300} w={500} h={430} a={p}>
      <div style={{ fontSize: 44, fontWeight: 900, color: col }}>{txt}</div>
      <div style={{ fontSize: 32, color: C.dim, marginTop: 20, lineHeight: 1.5, wordBreak: "keep-all" }}>{sub}</div>
    </Card>
  );
  return (
    <>
      <Title kicker="재전송">다시 보내면 되지 않나?</Title>
      {box("복구는 된다", "깨진 패킷은 다음 기회에 다시 보낸다. 데이터는 대부분 살아난다.", C.ok, a, 160)}
      {box("대신 늦어진다", "다시 보낼수록 지연이 쌓이고, 실제로 보낼 수 있는 양이 줄어든다.", C.warn, b, 710)}
      {box("오디오는 못 기다린다", "제때 오지 않은 소리는 버릴 수밖에 없어 끊김이 된다.", C.bad, c, 1260)}
    </>
  );
};

/* 9. AFH */
const Afh: React.FC<{ len: number; cues: number[] }> = ({ len, cues }) => {
  const f = useCurrentFrame(), go = cues[1] + 75, rm = interpolate(f, [cues[1], cues[1] + 60], [0, 1], clamp), shown = interpolate(f, [go + 10, len - 20], [0, GRID_N], clamp), info = useIn(cues[2]);
  const lost = AFH.slice(0, Math.floor(shown)).filter((e) => e.hit).length;
  return (
    <>
      <Title kicker="AFH · 적응형 주파수 도약">붐비는 채널을 채널 맵에서 빼고 뛴다</Title>
      {f < go ? (
        <Band x={160} y={290} w={1600} wifi={wifiAll(1)} bars={1} covered={BLOCKED} removed={rm} />
      ) : (
        <>
          <Grid x={110} y={250} w={1100} h={540} events={AFH} shown={shown} blocked={BLOCKED} dimBlocked={1} />
          <Card x={1290} y={250} w={520} h={540}>
            <div style={{ fontSize: 30, color: C.dim }}>이 가정에서 깨진 패킷</div>
            <div style={{ fontSize: 80, fontWeight: 900, color: C.ok, marginTop: 6 }}>{lost} / {Math.max(1, Math.floor(shown))}</div>
            <div style={{ fontSize: 28, color: C.dim, marginTop: 30, lineHeight: 1.6, opacity: info }}>
              <b style={{ color: C.text }}>Classic</b> 79채널 · 최소 20개 사용<br />
              <b style={{ color: C.text }}>저전력(LE)</b> 37채널 · 최소 2개 사용<br />
              둘 다 채널 맵으로 도약할 채널을 고른다
            </div>
          </Card>
        </>
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

/* 11. 정리 */
const Outro: React.FC<{ cues: number[] }> = ({ cues }) => {
  const a = useIn(0), b = useIn(cues[1]);
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, textAlign: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, color: C.text, fontSize: 66, fontWeight: 900, lineHeight: 1.3 }}>블루투스는 붐비는 채널을 알아내<br /><span style={{ color: C.accent }}>채널 맵에서 빼고 뛴다</span></div>
      <div style={{ opacity: b, color: C.dim, fontSize: 40, fontWeight: 600, marginTop: 50 }}>그래서 같은 대역의 Wi-Fi와 함께 지낼 수 있다</div>
      <div style={{ opacity: b, color: C.faint, fontSize: 26, marginTop: 90 }}>BluetoothBook 입문 4장 “주파수 도약” · ConnectivityBook</div>
    </div>
  );
};

const body = (s: Timed) => {
  switch (s.id) {
    case "hook": return <Hook />;
    case "band": return <BandScene />;
    case "hop": return <HopScene />;
    case "cover": return <Cover len={s.frames} cues={s.cues} />;
    case "formula": return <Formula cues={s.cues} />;
    case "grid": return <GridScene len={s.frames} />;
    case "retx": return <Retx len={s.frames} cues={s.cues} />;
    case "afh": return <Afh len={s.frames} cues={s.cues} />;
    case "map": return <MapScene len={s.frames} cues={s.cues} />;
    case "outro": return <Outro cues={s.cues} />;
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
