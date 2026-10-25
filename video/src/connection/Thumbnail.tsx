import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFont } from "../afh/parts";
import { Scene3D } from "../afh/world3d";
import { Phone3D, Watch3D } from "./Connection";

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): 휴대폰과 워치 사이의 띄엄띄엄한 신호 위에 큰 질문 */
export const ConnectionThumbnail: React.FC = () => {
  useFont();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Scene3D cam={{ pos: [-26, 14, 40], look: [-14, 5, 0], fov: 40 }}>
        <fog attach="fog" args={[C.bg, 60, 160]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#0d1729" />
        </mesh>
        <gridHelper args={[200, 100, "#24395a", "#172640"]} />
        <pointLight position={[0, 20, 16]} intensity={220} color="#9cc8ff" distance={70} />
        <Phone3D />
        <Watch3D />
        {[0.2, 0.5, 0.8].map((t) => (
          <mesh key={t} position={[-9 + 18.5 * t, 7 - 3 * t + Math.sin(t * Math.PI) * 2, 0]}>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial color={C.accent2} emissive={C.accent2} emissiveIntensity={1.4} />
          </mesh>
        ))}
      </Scene3D>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.97) 0%, rgba(11,18,32,.85) 42%, rgba(11,18,32,0) 62%)" }} />
      <div style={{ position: "absolute", left: 110, top: 200, fontFamily: FONT }}>
        <div style={{ color: C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH 입문 5</div>
        <div style={{ color: C.text, fontSize: 124, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          블루투스 켜 두면<br />
          <span style={{ color: C.accent2 }}>배터리</span><br />
          닳을까?
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 50, fontWeight: 900 }}>연결 = 시간 약속</div>
      </div>
    </AbsoluteFill>
  );
};
