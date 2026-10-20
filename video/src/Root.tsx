import { Composition } from "remotion";
import { WifiLossShort, totalFrames } from "./wifi-loss/WifiLossShort";

export const RemotionRoot: React.FC = () => (
  <Composition id="WifiLossShort" component={WifiLossShort} durationInFrames={totalFrames} fps={30} width={1080} height={1920} />
);
