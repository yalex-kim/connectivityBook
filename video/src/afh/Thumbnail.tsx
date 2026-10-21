import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { simulate, wifiBlocked, WIFI } from "../book";
import { Waterfall3D } from "./world3d";
import { useFont } from "./parts";

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): AFH로 흐르는 3D 지도 위에 큰 질문 */
const AFH = simulate(60, true);
const BLOCKED = wifiBlocked(WIFI);

export const AfhThumbnail: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Waterfall3D cam={{ pos: [70, 55, 120], look: [-8, 0, 40], fov: 40 }} events={AFH} shown={60} blocked={BLOCKED} laneOff={1} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.96) 0%, rgba(11,18,32,.85) 45%, rgba(11,18,32,0) 75%)" }} />
      <div style={{ position: "absolute", left: 110, top: 230, fontFamily: FONT }}>
        <div style={{ color: C.accent, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH × Wi-Fi</div>
        <div style={{ color: C.text, fontSize: 132, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          블루투스는 왜<br />
          <span style={{ color: C.warn }}>Wi-Fi</span>와<br />
          안 부딪힐까?
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 52, fontWeight: 900 }}>AFH · 적응형 주파수 도약</div>
      </div>
    </AbsoluteFill>
  );
};
