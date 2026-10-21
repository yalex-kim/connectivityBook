import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { csa2Channel, CH_ID, expectedLoss, simulate, wifiBlocked, WIFI } from "../book";
import { CASES, SCENES, type Scene } from "./script";
import { DeviceRoom } from "./devices";
import { Band, Caption, Card, Grid, RunningLoss, Title, clamp, fade, useFont, useIn } from "./parts";

import DURATIONS from "./durations.json";

/** 장면마다 애니메이션이 다 보이려면 필요한 최소 길이(프레임) */
const MIN: Record<Scene["id"], number> = { hook: 150, band: 200, hop: 150, cover: 280, formula: 300, grid: 300, retx: 210, afh: 300, map: 200, outro: 120 };
const LEAD = 9; // 음성은 장면 시작 0.3초 뒤에
const TAIL = 18; // 음성이 끝나고 0.6초 쉼
/** 나레이션판: 장면 길이 = 음성 길이 + 여백(최소 길이 이상) */
const voiced = (s: Scene): Scene => ({ ...s, frames: Math.max(MIN[s.id], Math.ceil(((DURATIONS as Record<string, number>)[s.id] ?? 0) * 30) + LEAD + TAIL) });
export const scenesFor = (voice: boolean) => (voice ? SCENES.map(voiced) : SCENES);
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
const Cover: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), half = len / 2, three = f > half;
  const order = [...(three ? BLOCKED : ONE)].sort((a, b) => a - b);
  const prog = three ? interpolate(f, [half + 20, len - 50], [0, 1], clamp) : interpolate(f, [20, half - 30], [0, 1], clamp);
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
const Formula: React.FC<{ len: number }> = ({ len }) => {
  const a = useIn(10);
  return (
    <>
      <Title kicker="계산">깨질 확률은 두 비율의 곱</Title>
      <Card x={260} y={210} w={1400} a={a}>
        <div style={{ fontSize: 46, fontWeight: 800, textAlign: "center" }}>
          깨질 확률 ≈ <span style={{ color: C.warn }}>덮인 채널 비율</span> × <span style={{ color: C.warn }}>Wi-Fi가 말하는 시간 비율</span>
        </div>
      </Card>
      {CASES.map(([name, w, d], i) => <CaseBar key={name} i={i} name={name} wifi={w} duty={d} at={Math.round(len * [0.36, 0.56, 0.76][i])} />)}
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
  const f = useCurrentFrame(), t = interpolate(f, [15, len - 40], [0, 1], clamp);
  return (
    <>
      <Title kicker="실제로 뛰어 보면 · Wi-Fi 1·6·11, 각 50%">처음엔 들쭉날쭉, 길게 보면 계산값 근처</Title>
      <Grid x={110} y={250} w={820} h={540} events={HOP.slice(0, GRID_N)} shown={t * GRID_N} blocked={BLOCKED} />
      <RunningLoss x={1060} y={250} w={750} h={540} events={HOP} shown={Math.pow(t, 1.6) * RUN_N} expected={EXP} />
    </>
  );
};

/* 8. 재전송 */
const Retx: React.FC<{ len: number }> = ({ len }) => {
  const a = useIn(10), b = useIn(Math.round(len * 0.4)), c = useIn(Math.round(len * 0.62));
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
const Afh: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), rm = interpolate(f, [20, 110], [0, 1], clamp), shown = interpolate(f, [140, len - 30], [0, GRID_N], clamp);
  const lost = AFH.slice(0, Math.floor(shown)).filter((e) => e.hit).length;
  return (
    <>
      <Title kicker="AFH · 적응형 주파수 도약">붐비는 채널을 채널 맵에서 빼고 뛴다</Title>
      {f < 130 ? (
        <Band x={160} y={290} w={1600} wifi={wifiAll(1)} bars={1} covered={BLOCKED} removed={rm} />
      ) : (
        <>
          <Grid x={110} y={250} w={1100} h={540} events={AFH} shown={shown} blocked={BLOCKED} dimBlocked={1} />
          <Card x={1290} y={250} w={520} h={540}>
            <div style={{ fontSize: 30, color: C.dim }}>이 가정에서 깨진 패킷</div>
            <div style={{ fontSize: 80, fontWeight: 900, color: C.ok, marginTop: 6 }}>{lost} / {Math.max(1, Math.floor(shown))}</div>
            <div style={{ fontSize: 28, color: C.dim, marginTop: 30, lineHeight: 1.6 }}>
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

/* 10. 채널 맵 만들기 */
const MapScene: React.FC = () => {
  const steps: [string, string][] = [
    ["① 재기", "센트럴이 채널마다 패킷 오류와 잡음을 잰다"],
    ["② 분류", "채널을 좋음 · 나쁨 · 알 수 없음으로 나눈다"],
    ["③ 알리기", "새 채널 맵을 상대에게 보내고, 정해진 순간부터 함께 쓴다"],
  ];
  return (
    <>
      <Title kicker="채널 맵">피할 채널은 어떻게 알까?</Title>
      {steps.map(([h, t], i) => <MapStep key={h} i={i} h={h} t={t} />)}
      <div style={{ position: "absolute", top: 820, left: 0, right: 0, textAlign: "center", fontFamily: FONT, color: C.dim, fontSize: 26 }}>호스트가 “이 채널은 나쁘다”고 알려 줄 수도 있다 (HCI_LE_Set_Host_Channel_Classification)</div>
    </>
  );
};
const MapStep: React.FC<{ i: number; h: string; t: string }> = ({ i, h, t }) => {
  const a = useIn(10 + i * 60);
  return (
    <Card x={160 + i * 550} y={290} w={500} h={440} a={a}>
      <div style={{ fontSize: 48, fontWeight: 900, color: C.accent }}>{h}</div>
      <div style={{ fontSize: 34, color: C.text, marginTop: 24, lineHeight: 1.5, wordBreak: "keep-all" }}>{t}</div>
    </Card>
  );
};

/* 11. 정리 */
const Outro: React.FC = () => {
  const a = useIn(0), b = useIn(30);
  return (
    <div style={{ position: "absolute", top: 230, left: 0, right: 0, textAlign: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, color: C.text, fontSize: 68, fontWeight: 900 }}>같은 대역을 나눠 쓰는 비결은<br /><span style={{ color: C.accent }}>피할 채널을 아는 것</span></div>
      <div style={{ opacity: b, color: C.dim, fontSize: 36, marginTop: 60 }}>직접 계산해 보기 · ConnectivityBook · BluetoothBook 입문 4장 “주파수 도약”</div>
      <div style={{ opacity: b, color: C.faint, fontSize: 30, marginTop: 16 }}>yalex-kim.github.io/connectivityBook</div>
    </div>
  );
};

const body = (s: Scene) => {
  switch (s.id) {
    case "hook": return <Hook />;
    case "band": return <BandScene />;
    case "hop": return <HopScene />;
    case "cover": return <Cover len={s.frames} />;
    case "formula": return <Formula len={s.frames} />;
    case "grid": return <GridScene len={s.frames} />;
    case "retx": return <Retx len={s.frames} />;
    case "afh": return <Afh len={s.frames} />;
    case "map": return <MapScene />;
    case "outro": return <Outro />;
  }
};

const SceneFrame: React.FC<{ s: Scene; voice: boolean }> = ({ s, voice }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
      {body(s)}
      {voice && (
        <Sequence from={LEAD} layout="none">
          <Audio src={staticFile(`audio/${s.id}.wav`)} />
        </Sequence>
      )}
      <Caption text={s.caption} />
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
