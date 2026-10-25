import { C } from "../theme";
import { useFont } from "../afh/parts";
import { Scene3D, type Cam } from "../afh/world3d";
import { Ground, ThumbCard } from "./kit";
import { PairPhone, Laptop, PAIR_SIX } from "../pairing/Pairing";
import { Coin, BoxDev } from "../power/Power";
import { Buds } from "../pairing/Pairing";
import { Sofa, LocBud } from "../locate/Locate";
import { project } from "../range/hook3d";

/* 입문 7~10편 썸네일 */
const hi = (t: string, col: string = C.accent2) => <span style={{ color: col }}>{t}</span>;

export const PairingThumbnail: React.FC = () => {
  useFont();
  const cam: Cam = { pos: [-22, 14, 36], look: [-10, 5, 0], fov: 40 };
  const [x, y] = project(cam, [1, 5.6, 0.4]), [x2, y2] = project(cam, [9, 5.6, 0.4]);
  return (
    <ThumbCard kicker="BLUETOOTH 입문 7" chip="블루투스 페어링" lines={<>차는 {hi("숫자 확인")},<br />이어폰은 왜<br />그냥 연결될까?</>}
      overlay={<svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>{[[x, y], [x2, y2]].map(([a, b], i) => <text key={i} x={a} y={b} textAnchor="middle" fill={C.text} fontFamily="Pretendard" fontSize={40} fontWeight={900}>{PAIR_SIX}</text>)}</svg>}>
      <Scene3D cam={cam}><Ground /><PairPhone p={[1, 5.6, 0]} ry={0.2} /><PairPhone p={[9, 5.6, 0]} ry={-0.2} /><Laptop p={[24, 0, -6]} /></Scene3D>
    </ThumbCard>
  );
};
export const PowerThumbnail: React.FC = () => {
  useFont();
  return (
    <ThumbCard kicker="BLUETOOTH 입문 8" chip="평균 전류 · 수면 전류" lines={<>코인 전지 하나로<br />어떻게 {hi("몇 년")}을<br />버틸까?</>}>
      <Scene3D cam={{ pos: [-16, 13, 30], look: [-4, 3, 0], fov: 40 }}><Ground /><Coin p={[2, 3, 2]} s={1.4} /><BoxDev p={[14, 0, -2]} size={[4, 4, 4]} col={C.accent} /></Scene3D>
    </ThumbCard>
  );
};
export const AudioThumbnail: React.FC = () => {
  useFont();
  return (
    <ThumbCard kicker="BLUETOOTH 입문 9" chip="버퍼 · LE 오디오" lines={<>무선 이어폰은<br />왜 소리가<br />{hi("늦게", C.warn)} 들릴까?</>}>
      <Scene3D cam={{ pos: [-18, 12, 30], look: [-6, 4, 0], fov: 40 }}><Ground /><PairPhone p={[0, 5.6, 0]} ry={0.25} /><Buds p={[12, 0, 2]} /></Scene3D>
    </ThumbCard>
  );
};
export const LocateThumbnail: React.FC = () => {
  useFont();
  return (
    <ThumbCard kicker="BLUETOOTH 입문 10" chip="RSSI · 방향 · 채널 사운딩" lines={<>소파 틈 이어폰,<br />휴대폰은 어떻게<br />{hi("거리")}를 알까?</>}>
      <Scene3D cam={{ pos: [-16, 18, 36], look: [-2, 4, 0], fov: 40 }}><Ground /><Sofa /><LocBud p={[6, 6.4, 1.2]} /><PairPhone p={[-6, 6, 8]} ry={0.35} /></Scene3D>
    </ThumbCard>
  );
};
