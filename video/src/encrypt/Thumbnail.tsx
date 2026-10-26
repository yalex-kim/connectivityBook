import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { DEEP, ThumbCard } from "../common/kit";
import { SchedStage } from "../scheduling/Scheduling";

/* 심화 5편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색 */
export const EncryptThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 5" chip="세션 키 · AES-CCM" lines={<>저장한 열쇠 하나로<br /><span style={{ color: DEEP }}>몇 년</span> 잠가도<br />괜찮을까?</>}>
      <SchedStage cam={{ pos: [-30, 22, 44], look: [-14, 4, 2], fov: 40 }} f={f + 20} watch={1} others={0} />
    </ThumbCard>
  );
};
