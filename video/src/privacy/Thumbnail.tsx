import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { DEEP, ThumbCard } from "../common/kit";
import { PrivacyHook } from "./Privacy";

/* 심화 6편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색. 훅의 3D 장면(길목의 수신기와 이어폰)을 쓴다 */
export const PrivacyThumbnail: React.FC = () => {
  useFont();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 6" chip="RPA · 해석 목록" lines={<>외치는 이어폰,<br />누가 나를<br /><span style={{ color: DEEP }}>따라다닐까?</span></>}>
      <div style={{ position: "absolute", inset: 0, transform: "translateX(240px)" }}><PrivacyHook cues={[0, 0, 9999]} len={300} budX={6} /></div>
    </ThumbCard>
  );
};
