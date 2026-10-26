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
import { Pairing } from "./pairing/Pairing";
import { framesFor as pairingFrames } from "./pairing/timing";
import { Power } from "./power/Power";
import { framesFor as powerFrames } from "./power/timing";
import { AudioVideo } from "./audio/Audio";
import { framesFor as audioFrames } from "./audio/timing";
import { Locate } from "./locate/Locate";
import { framesFor as locateFrames } from "./locate/timing";
import { PairingThumbnail, PowerThumbnail, AudioThumbnail, LocateThumbnail } from "./common/Thumbs";
import { framesFor as gattFrames } from "./gatt/timing";
import { GattThumbnail } from "./gatt/Thumbnail";
import { framesFor as connFrames } from "./connection/timing";
import { ConnectionThumbnail } from "./connection/Thumbnail";
import { Scheduling } from "./scheduling/Scheduling";
import { framesFor as schedFrames } from "./scheduling/timing";
import { SchedulingThumbnail } from "./scheduling/Thumbnail";
import { Instant } from "./instant/Instant";
import { framesFor as instantFrames } from "./instant/timing";
import { InstantThumbnail } from "./instant/Thumbnail";
import { Hopping } from "./hopping/Hopping";
import { framesFor as hoppingFrames } from "./hopping/timing";
import { HoppingThumbnail } from "./hopping/Thumbnail";
import { GattCache } from "./gattcache/GattCache";
import { framesFor as gattCacheFrames } from "./gattcache/timing";
import { GattCacheThumbnail } from "./gattcache/Thumbnail";
import { Encrypt } from "./encrypt/Encrypt";
import { framesFor as encryptFrames } from "./encrypt/timing";
import { EncryptThumbnail } from "./encrypt/Thumbnail";
import { Privacy } from "./privacy/Privacy";
import { framesFor as privacyFrames } from "./privacy/timing";
import { PrivacyThumbnail } from "./privacy/Thumbnail";
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
    <Composition id="Pairing" component={Pairing} defaultProps={{ voice: false }} durationInFrames={pairingFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="PairingVoice" component={Pairing} defaultProps={{ voice: true }} durationInFrames={pairingFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Power" component={Power} defaultProps={{ voice: false }} durationInFrames={powerFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="PowerVoice" component={Power} defaultProps={{ voice: true }} durationInFrames={powerFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Audio" component={AudioVideo} defaultProps={{ voice: false }} durationInFrames={audioFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="AudioVoice" component={AudioVideo} defaultProps={{ voice: true }} durationInFrames={audioFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Locate" component={Locate} defaultProps={{ voice: false }} durationInFrames={locateFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="LocateVoice" component={Locate} defaultProps={{ voice: true }} durationInFrames={locateFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="Scheduling" component={Scheduling} defaultProps={{ voice: false }} durationInFrames={schedFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="SchedulingVoice" component={Scheduling} defaultProps={{ voice: true }} durationInFrames={schedFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="SchedulingThumbnail" component={SchedulingThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Instant" component={Instant} defaultProps={{ voice: false }} durationInFrames={instantFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="InstantVoice" component={Instant} defaultProps={{ voice: true }} durationInFrames={instantFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="InstantThumbnail" component={InstantThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Hopping" component={Hopping} defaultProps={{ voice: false }} durationInFrames={hoppingFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="HoppingVoice" component={Hopping} defaultProps={{ voice: true }} durationInFrames={hoppingFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="HoppingThumbnail" component={HoppingThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="GattCache" component={GattCache} defaultProps={{ voice: false }} durationInFrames={gattCacheFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="GattCacheVoice" component={GattCache} defaultProps={{ voice: true }} durationInFrames={gattCacheFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="GattCacheThumbnail" component={GattCacheThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Encrypt" component={Encrypt} defaultProps={{ voice: false }} durationInFrames={encryptFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="EncryptVoice" component={Encrypt} defaultProps={{ voice: true }} durationInFrames={encryptFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="EncryptThumbnail" component={EncryptThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="Privacy" component={Privacy} defaultProps={{ voice: false }} durationInFrames={privacyFrames(false)} fps={30} width={1920} height={1080} />
    <Composition id="PrivacyVoice" component={Privacy} defaultProps={{ voice: true }} durationInFrames={privacyFrames(true)} fps={30} width={1920} height={1080} />
    <Composition id="PrivacyThumbnail" component={PrivacyThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="PairingThumbnail" component={PairingThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="PowerThumbnail" component={PowerThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="AudioThumbnail" component={AudioThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="LocateThumbnail" component={LocateThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="GattThumbnail" component={GattThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="ConnectionThumbnail" component={ConnectionThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="TwoKindsThumbnail" component={TwoKindsThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="RangeThumbnail" component={RangeThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="DiscoverThumbnail" component={DiscoverThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="AfhThumbnail" component={AfhThumbnail} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
