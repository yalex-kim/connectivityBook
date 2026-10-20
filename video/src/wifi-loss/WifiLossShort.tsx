import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { simulate, wifiBlocked, WIFI } from "../book";
import { SCENES, type Scene } from "./script";
import { BandMap, Caption, Counter, HopGrid, Title, fade, useFont, useIn } from "./parts";

export const totalFrames = SCENES.reduce((n, s) => n + s.frames, 0);
const EVENTS = 60;
// 표본 60개의 손실이 기댓값(41.9%)에 가깝고(25/60), 진행 중에도 35~48%를 벗어나지 않는 씨앗.
// 화면의 숫자가 다음 장면의 계산과 어긋나지 않게 고른 대표 표본이다(긴 시뮬레이션은 scripts/check-book.mjs).
const SEED = 5;
const HOP = simulate(EVENTS, false, SEED), AFH = simulate(EVENTS, true, SEED);
const BLOCKED = wifiBlocked(WIFI).size;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Hook: React.FC = () => {
  const a = useIn(10), b = useIn(28);
  return (
    <>
      <Title kicker="BLUETOOTH × Wi-Fi">Wi-Fi 옆 블루투스,<br />패킷을 몇 % 잃을까?</Title>
      <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, fontFamily: FONT }}>
        {[["15%?", a], ["40%?", b]].map(([t, p]) => (
          <div key={t as string} style={{ opacity: p as number, transform: `scale(${0.7 + 0.3 * (p as number)})`, width: 340, height: 300, borderRadius: 36, background: C.panel, border: `4px solid ${C.faint}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontSize: 110, fontWeight: 800 }}>{t as string}</div>
        ))}
      </div>
    </>
  );
};

const Setup: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Title kicker="조건">이웃 Wi-Fi 1·6·11번이<br />시간의 50%씩 말한다</Title>
      <BandMap wifi={interpolate(f, [10, 90], [0, 1], clamp)} bars={0} cover={0} />
    </>
  );
};

const Cover: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), bars = interpolate(f, [0, 60], [0, 1], clamp), cover = interpolate(f, [70, len - 70], [0, 1], clamp);
  return (
    <>
      <Title kicker="덮인 채널">Wi-Fi 셋이 덮는<br />블루투스 채널은?</Title>
      <BandMap wifi={1} bars={bars} cover={cover} />
      <Counter label="덮인 채널" value={`${Math.round(cover * BLOCKED)} / 37`} color={C.warn} />
    </>
  );
};

const Hop: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), shown = interpolate(f, [15, len - 40], [0, EVENTS], clamp), k = Math.max(1, Math.floor(shown));
  const lost = HOP.slice(0, k).filter((e) => e.hit).length;
  return (
    <>
      <Title kicker="무작위 도약">매번 채널을 바꿔 뛴다</Title>
      <HopGrid events={HOP} shown={shown} />
      <Counter label="잃은 패킷" value={`${lost} / ${k} (${pct(lost / k)})`} color={C.bad} top={1185} />
    </>
  );
};

const Math_: React.FC = () => {
  const a = useIn(6), b = useIn(70), c = useIn(130);
  return (
    <>
      <Title kicker="계산">기대 손실률</Title>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, textAlign: "center", fontFamily: FONT, color: C.text }}>
        <div style={{ opacity: a, fontSize: 92, fontWeight: 800 }}><span style={{ color: C.warn }}>31</span>/37 × <span style={{ color: C.warn }}>50%</span></div>
        <div style={{ opacity: b, fontSize: 150, fontWeight: 900, color: C.bad, marginTop: 30 }}>≈ 41.9%</div>
        <div style={{ opacity: c, fontSize: 52, fontWeight: 700, color: C.dim, marginTop: 70 }}>
          <span style={{ textDecoration: "line-through", textDecorationThickness: 6, textDecorationColor: C.bad }}>Wi-Fi는 셋뿐 → 1/3 × 50% ≈ 15%</span>
        </div>
      </div>
    </>
  );
};

const Afh: React.FC<{ len: number }> = ({ len }) => {
  const f = useCurrentFrame(), dim = interpolate(f, [0, 40], [0, 1], clamp), shown = interpolate(f, [40, len - 30], [0, EVENTS], clamp), k = Math.max(1, Math.floor(shown));
  const lost = AFH.slice(0, k).filter((e) => e.hit).length;
  return (
    <>
      <Title kicker="적응형 도약 (AFH)">덮인 채널을 빼고<br />남은 {37 - BLOCKED}개로만</Title>
      <HopGrid events={AFH} shown={shown} dimBlocked={dim} />
      <Counter label="잃은 패킷" value={`${lost} / ${k} (${pct(lost / k)})`} color={C.ok} top={1185} />
    </>
  );
};

const Outro: React.FC = () => {
  const a = useIn(0), b = useIn(20);
  return (
    <div style={{ position: "absolute", top: 520, left: 70, right: 70, textAlign: "center", fontFamily: FONT }}>
      <div style={{ opacity: a, color: C.accent, fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>직접 만져 보기</div>
      <div style={{ opacity: a, color: C.text, fontSize: 84, fontWeight: 900, marginTop: 24 }}>ConnectivityBook</div>
      <div style={{ opacity: b, color: C.text, fontSize: 52, fontWeight: 700, marginTop: 40 }}>BluetoothBook 입문 4장<br />주파수 도약</div>
      <div style={{ opacity: b, color: C.dim, fontSize: 34, marginTop: 50 }}>yalex-kim.github.io/connectivityBook</div>
    </div>
  );
};

const body = (s: Scene) => {
  switch (s.id) {
    case "hook": return <Hook />;
    case "setup": return <Setup />;
    case "cover": return <Cover len={s.frames} />;
    case "hop": return <Hop len={s.frames} />;
    case "math": return <Math_ />;
    case "afh": return <Afh len={s.frames} />;
    case "outro": return <Outro />;
  }
};

const SceneFrame: React.FC<{ s: Scene }> = ({ s }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
      {body(s)}
      <Caption text={s.caption} />
    </AbsoluteFill>
  );
};

export const WifiLossShort: React.FC = () => {
  useFont();
  let at = 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at 50% 30%, #12213a, ${C.bg})` }}>
      {SCENES.map((s) => {
        const from = at;
        at += s.frames;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.frames}>
            <SceneFrame s={s} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
