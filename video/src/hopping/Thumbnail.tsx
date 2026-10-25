import { useCurrentFrame } from "remotion";
import { useFont } from "../afh/parts";
import { basicHop } from "../book";
import { DEEP, ThumbCard } from "../common/kit";
import { HopBand } from "./Hopping";
import { ADDR, CLK0 } from "./script";

/* 심화 3편 썸네일: 입문편과 같은 틀(ThumbCard), 심화 색 */
export const HoppingThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <ThumbCard deep size={104} kicker="BLUETOOTH 3" chip="Classic 도약 선택 커널" lines={<>1초에 <span style={{ color: DEEP }}>1600번</span><br />채널을 바꾸는데,<br />이어폰은 어떻게?</>}>
      <HopBand cam={{ pos: [-24, 22, 44], look: [-10, 3, 4], fov: 40 }} f={f + 20} ch={basicHop(ADDR, CLK0 + 12).ch} on={1} />
    </ThumbCard>
  );
};
