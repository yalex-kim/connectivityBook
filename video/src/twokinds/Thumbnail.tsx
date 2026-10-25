import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFont } from "../afh/parts";
import { Lanes3D } from "./TwoKinds";

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): 같은 대역 위의 두 채널 줄(클래식 79·LE 40) 위에 큰 질문 */
export const TwoKindsThumbnail: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", inset: 0, transform: "translateX(420px)" }}>
        <Lanes3D f={1000} len={1000} cues={[0, 0, 0, 0]} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.97) 0%, rgba(11,18,32,.85) 42%, rgba(11,18,32,0) 62%)" }} />
      <div style={{ position: "absolute", left: 110, top: 200, fontFamily: FONT }}>
        <div style={{ color: C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH 입문 1</div>
        <div style={{ color: C.text, fontSize: 124, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          같은 블루투스인데<br />
          왜 <span style={{ color: C.accent2 }}>다르게</span><br />
          말할까?
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 50, fontWeight: 900 }}>클래식 · LE</div>
      </div>
    </AbsoluteFill>
  );
};
