import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { DEEP, ThumbCard } from "../common/kit";
import { SchedStage } from "./Scheduling";

/* 심화 1편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색 */
export const SchedulingThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 1" chip="스케줄링 · 감독 타임아웃" lines={<>휴대폰 하나에<br />이어폰·워치·키보드<br /><span style={{ color: DEEP }}>다 연결</span>해도 될까?</>}>
      <SchedStage cam={{ pos: [-30, 22, 44], look: [-14, 4, 2], fov: 40 }} f={f + 20} watch={1} others={1} />
    </ThumbCard>
  );
};
