import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { Stage3D } from "../afh/world3d";
import { useFont } from "../afh/parts";

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): 빛나는 광고 채널 셋 위에 큰 질문 */
export const DiscoverThumbnail: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage3D cam={{ pos: [-30, 38, 108], look: [-30, 2, 0], fov: 40 }} wifi={[0, 0, 0]} pillars={1} color={() => "#7f93b3"} adv={1} advGlow={1} dim={0.6} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.96) 0%, rgba(11,18,32,.8) 40%, rgba(11,18,32,0) 56%)" }} />
      <div style={{ position: "absolute", left: 110, top: 230, fontFamily: FONT }}>
        <div style={{ color: C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH 입문 3</div>
        <div style={{ color: C.text, fontSize: 128, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          처음 보는<br />
          두 기기는<br />
          <span style={{ color: C.accent2 }}>어떻게 만날까?</span>
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 50, fontWeight: 900 }}>광고 · 스캔 · 연결 요청</div>
      </div>
    </AbsoluteFill>
  );
};
