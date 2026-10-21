import { Composition } from "remotion";
import { AfhExplainer, framesFor } from "./afh/AfhExplainer";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AfhExplainer" component={AfhExplainer} defaultProps={{ voice: false }} durationInFrames={framesFor(false)} fps={30} width={1920} height={1080} />
    <Composition id="AfhExplainerVoice" component={AfhExplainer} defaultProps={{ voice: true }} durationInFrames={framesFor(true)} fps={30} width={1920} height={1080} />
  </>
);
