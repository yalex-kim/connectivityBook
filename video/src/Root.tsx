import { Composition } from "remotion";
import { AfhExplainer } from "./afh/AfhExplainer";
import { framesFor } from "./afh/timing";
import { AfhThumbnail } from "./afh/Thumbnail";
import { Discover } from "./discover/Discover";
import { DiscoverThumbnail } from "./discover/Thumbnail";
import { framesFor as discoverFrames } from "./discover/timing";
import { TwoKinds } from "./twokinds/TwoKinds";
import { framesFor as twoKindsFrames } from "./twokinds/timing";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AfhExplainer" component={AfhExplainer} defaultProps={{ voice: false }} durationInFrames={framesFor(false)} fps={30} width={1920} height={1080} />
    <Composition id="AfhExplainerVoice" component={AfhExplainer} defaultProps={{ voice: true }} durationInFrames={framesFor(true)} fps={30} width={1920} height={1080} />
    <Composition id="Discover" component={Discover} defaultProps={{ voice: false }} durationInFrames={discoverFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="DiscoverVoice" component={Discover} defaultProps={{ voice: true }} durationInFrames={discoverFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="TwoKinds" component={TwoKinds} defaultProps={{ voice: false }} durationInFrames={twoKindsFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="TwoKindsVoice" component={TwoKinds} defaultProps={{ voice: true }} durationInFrames={twoKindsFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="DiscoverThumbnail" component={DiscoverThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="AfhThumbnail" component={AfhThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
