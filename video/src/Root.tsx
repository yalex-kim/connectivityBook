import { Composition } from "remotion";
import { AfhExplainer } from "./afh/AfhExplainer";
import { framesFor } from "./afh/timing";
import { AfhThumbnail } from "./afh/Thumbnail";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AfhExplainer" component={AfhExplainer} defaultProps={{ voice: false }} durationInFrames={framesFor(false)} fps={30} width={1920} height={1080} />
    <Composition id="AfhExplainerVoice" component={AfhExplainer} defaultProps={{ voice: true }} durationInFrames={framesFor(true)} fps={30} width={1920} height={1080} />
    <Composition id="AfhThumbnail" component={AfhThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
