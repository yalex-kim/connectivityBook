import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { DEEP, ThumbCard } from "../common/kit";
import { SchedStage } from "../scheduling/Scheduling";

/* 심화 2편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색 */
export const InstantThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 2" chip="instant · 연결 갱신" lines={<>연결을 끊지 않고<br />약속을 바꾸려면<br /><span style={{ color: DEEP }}>언제</span> 말해야 할까?</>}>
      <SchedStage cam={{ pos: [-30, 22, 44], look: [-14, 4, 2], fov: 40 }} f={f + 20} watch={1} others={0} />
    </ThumbCard>
  );
};
