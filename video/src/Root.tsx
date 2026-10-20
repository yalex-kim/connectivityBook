import { Composition } from "remotion";
import { AfhExplainer, totalFrames } from "./afh/AfhExplainer";

export const RemotionRoot: React.FC = () => (
  <Composition id="AfhExplainer" component={AfhExplainer} durationInFrames={totalFrames} fps={30} width={1920} height={1080} />
);
