import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFont } from "../afh/parts";
import { Scene3D } from "../afh/world3d";
import { AppScreen, PhoneApp3D, Strap3D } from "./Gatt";

const CAM = { pos: [-30, 15, 44] as [number, number, number], look: [-16, 6, 0] as [number, number, number], fov: 40 };

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): 심박계와 휴대폰 위에 큰 질문 */
export const GattThumbnail: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Scene3D cam={CAM}>
        <fog attach="fog" args={[C.bg, 60, 160]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#0d1729" />
        </mesh>
        <gridHelper args={[200, 100, "#24395a", "#172640"]} />
        <pointLight position={[0, 20, 16]} intensity={220} color="#9cc8ff" distance={70} />
        <PhoneApp3D />
        <Strap3D led={1} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><AppScreen cam={CAM} bpm={72} a={1} /></svg>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.97) 0%, rgba(11,18,32,.85) 44%, rgba(11,18,32,0) 64%)" }} />
      <div style={{ position: "absolute", left: 110, top: 190, fontFamily: FONT }}>
        <div style={{ color: C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH 입문 6</div>
        <div style={{ color: C.text, fontSize: 116, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          처음 보는 심박계,<br />
          앱은 어떻게<br />
          <span style={{ color: C.bad }}>심박수</span>를 읽을까?
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 50, fontWeight: 900 }}>GATT · 같은 메뉴판</div>
      </div>
    </AbsoluteFill>
  );
};
