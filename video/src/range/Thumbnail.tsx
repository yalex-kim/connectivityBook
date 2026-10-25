import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";
import { useFont } from "../afh/parts";
import { Scene3D, type Vec } from "../afh/world3d";
import { Person3D, Phone3D, Dots, EAR, POCKET, PX } from "./hook3d";

/* 유튜브 썸네일(1920×1080로 그리고 1280×720으로 줄여 올린다): 몸을 지나다 끊기는 신호 위에 큰 질문 */
export const RangeThumbnail: React.FC = () => {
  useFont();
  const mid: Vec = [(EAR[0] + POCKET[0]) / 2 + 2.6, (EAR[1] + POCKET[1]) / 2, (EAR[2] + POCKET[2]) / 2 + 1.6];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Scene3D cam={{ pos: [PX - 30, 15, 34], look: [PX - 10, 12, 0], fov: 40 }}>
        <fog attach="fog" args={[C.bg, 70, 200]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, -0.03, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#0d1729" />
        </mesh>
        <gridHelper args={[300, 150, "#24395a", "#172640"]} position={[20, 0, 0]} />
        <pointLight position={[PX + 10, 22, 14]} intensity={250} color="#9cc8ff" distance={60} />
        <Person3D />
        <Phone3D glow={0.8} />
        <Dots a={POCKET} b={EAR} f={7} col={C.bad} on={1} />
        {[0.75, -0.75].map((rz) => (
          <mesh key={rz} position={mid} rotation={[0, 0, rz]}>
            <boxGeometry args={[0.35, 3.2, 0.35]} />
            <meshStandardMaterial color={C.bad} emissive={C.bad} emissiveIntensity={1.2} />
          </mesh>
        ))}
      </Scene3D>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,18,32,.97) 0%, rgba(11,18,32,.85) 42%, rgba(11,18,32,0) 62%)" }} />
      <div style={{ position: "absolute", left: 110, top: 200, fontFamily: FONT }}>
        <div style={{ color: C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3 }}>BLUETOOTH 입문 2</div>
        <div style={{ color: C.text, fontSize: 128, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>
          블루투스는<br />
          <span style={{ color: C.accent2 }}>몇 미터</span>까지<br />
          될까?
        </div>
        <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: C.accent, color: C.bg, fontSize: 50, fontWeight: 900 }}>10 m의 진실 · 링크 버짓</div>
      </div>
    </AbsoluteFill>
  );
};
