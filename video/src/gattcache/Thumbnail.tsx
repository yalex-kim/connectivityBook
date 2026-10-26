import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { DEEP, ThumbCard } from "../common/kit";
import { SchedStage } from "../scheduling/Scheduling";

/* 심화 5편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색 */
export const GattCacheThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 5" chip="Database Hash · Robust Caching" lines={<>펌웨어가 바뀌면,<br />앱은 어떻게<br /><span style={{ color: DEEP }}>알아챌까?</span></>}>
      <SchedStage cam={{ pos: [-30, 22, 44], look: [-14, 4, 2], fov: 40 }} f={f + 20} watch={1} others={0} />
    </ThumbCard>
  );
};
