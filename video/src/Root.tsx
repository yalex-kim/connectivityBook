import { Composition } from "remotion";
import { AfhExplainer } from "./afh/AfhExplainer";
import { framesFor } from "./afh/timing";
import { AfhThumbnail } from "./afh/Thumbnail";
import { Discover } from "./discover/Discover";
import { DiscoverThumbnail } from "./discover/Thumbnail";
import { framesFor as discoverFrames } from "./discover/timing";
import { TwoKinds } from "./twokinds/TwoKinds";
import { framesFor as twoKindsFrames } from "./twokinds/timing";
import { Range } from "./range/Range";
import { Connection } from "./connection/Connection";
import { Gatt } from "./gatt/Gatt";
import { framesFor as gattFrames } from "./gatt/timing";
import { GattThumbnail } from "./gatt/Thumbnail";
import { framesFor as connFrames } from "./connection/timing";
import { ConnectionThumbnail } from "./connection/Thumbnail";
import { RangeThumbnail } from "./range/Thumbnail";
import { TwoKindsThumbnail } from "./twokinds/Thumbnail";
import { framesFor as rangeFrames } from "./range/timing";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="AfhExplainer" component={AfhExplainer} defaultProps={{ voice: false }} durationInFrames={framesFor(false)} fps={30} width={1920} height={1080} />
    <Composition id="AfhExplainerVoice" component={AfhExplainer} defaultProps={{ voice: true }} durationInFrames={framesFor(true)} fps={30} width={1920} height={1080} />
    <Composition id="Discover" component={Discover} defaultProps={{ voice: false }} durationInFrames={discoverFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="DiscoverVoice" component={Discover} defaultProps={{ voice: true }} durationInFrames={discoverFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="TwoKinds" component={TwoKinds} defaultProps={{ voice: false }} durationInFrames={twoKindsFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="TwoKindsVoice" component={TwoKinds} defaultProps={{ voice: true }} durationInFrames={twoKindsFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Range" component={Range} defaultProps={{ voice: false }} durationInFrames={rangeFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="RangeVoice" component={Range} defaultProps={{ voice: true }} durationInFrames={rangeFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Connection" component={Connection} defaultProps={{ voice: false }} durationInFrames={connFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="ConnectionVoice" component={Connection} defaultProps={{ voice: true }} durationInFrames={connFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Gatt" component={Gatt} defaultProps={{ voice: false }} durationInFrames={gattFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="GattVoice" component={Gatt} defaultProps={{ voice: true }} durationInFrames={gattFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="GattThumbnail" component={GattThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="ConnectionThumbnail" component={ConnectionThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="TwoKindsThumbnail" component={TwoKindsThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="RangeThumbnail" component={RangeThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="DiscoverThumbnail" component={DiscoverThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="AfhThumbnail" component={AfhThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
