import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { useFont } from "../afh/parts";
import { Scene3D, type Cam, type Vec } from "../afh/world3d";
import { project } from "../range/hook3d";
import { basicHop } from "../book";
import { DEEP, EarbudsCase3D, Ground } from "./kit";
import { SchedStage } from "../scheduling/Scheduling";
import { HopBand } from "../hopping/Hopping";

/*
 * 심화 시리즈 썸네일. 휴대폰 목록에서 작게 보여도 읽히도록:
 * 큰 "심화 N" 표지, 두 줄짜리 짧은 질문(약 150px), 편마다 다른 큰 3D 물체(오른쪽 절반).
 * 인디고 띠·배경은 시리즈 공통(입문편 ThumbCard와 같은 배치 계열).
 */
const INK = "#14123a";
const DeepCard: React.FC<{ no: number; lines: React.ReactNode; children: React.ReactNode; overlay?: React.ReactNode; shift?: number }> = ({ no, lines, children, overlay, shift = 360 }) => { shift += 50; return (
  <AbsoluteFill style={{ background: C.bg }}>
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${shift}px)` }}>{children}{overlay}</div>
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(16,14,44,.97) 0%, rgba(16,14,44,.9) 46%, rgba(16,14,44,0) 64%)" }} />
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 30, background: DEEP }} />
    <div style={{ position: "absolute", left: 100, top: 150, fontFamily: FONT }}>
      <div style={{ display: "inline-block", background: DEEP, color: INK, fontSize: 84, fontWeight: 900, padding: "6px 34px", borderRadius: 22, letterSpacing: -1 }}>심화 {no}</div>
      <div style={{ color: C.text, fontSize: 112, fontWeight: 900, lineHeight: 1.16, marginTop: 36, letterSpacing: -3 }}>{lines}</div>
    </div>
  </AbsoluteFill>
); };
const hi = (t: string, col = DEEP) => <span style={{ color: col }}>{t}</span>;
const mat = (col: string, glow = 0) => <meshStandardMaterial color={col} emissive={col} emissiveIntensity={glow} roughness={0.35} metalness={0.3} />;

/* 1. 스케줄링: 휴대폰 하나에 기기 셋 */
export const SchedulingThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <DeepCard no={1} lines={<>휴대폰 하나에<br />이어폰·워치·키보드<br />{hi("다 연결")}해도 될까?</>} shift={300}>
      <SchedStage cam={{ pos: [-4, 22, 40], look: [0, 4, 3], fov: 40 }} f={f + 20} watch={1} others={1} />
    </DeepCard>
  );
};

/* 2. instant: 번호 붙은 만남, 106번에서 함께 바꾼다 */
const ICAM: Cam = { pos: [-2, 11, 30], look: [4, 5.5, 0], fov: 40 };
const BX = (i: number) => (i < 6 ? -14 + i * 3.2 : -14 + 6 * 3.2 + (i - 6) * 6.4);
export const InstantThumbnail: React.FC = () => {
  useFont();
  return (
    <DeepCard no={2} shift={430} lines={<>연결을 끊지 않고<br />약속을 바꾸려면<br />{hi("언제")} 말해야 할까?</>}
      overlay={<svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>{Array.from({ length: 9 }, (_, i) => { const [x, y] = project(ICAM, [BX(i), i === 6 ? 6.6 : 3.4, 0]); return <text key={i} x={x} y={y} textAnchor="middle" fill={i === 6 ? "#fff" : C.dim} fontSize={i === 6 ? 64 : 34} fontWeight={900}>{100 + i}</text>; })}</svg>}>
      <Scene3D cam={ICAM}>
        <Ground light={[0, 18, 12]} />
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[BX(i), i === 6 ? 2.6 : 1.2, 0]}>
            <boxGeometry args={[2.4, i === 6 ? 5.2 : 2.4, 2.4]} />
            {mat(i === 6 ? DEEP : i > 6 ? "#818cf8" : C.accent2, i === 6 ? 1.1 : 0.25)}
          </mesh>
        ))}
        <mesh position={[BX(6) - 1.9, 2.5, 0]}><boxGeometry args={[0.25, 7, 4]} />{mat("#ffffff", 1.4)}</mesh>
      </Scene3D>
    </DeepCard>
  );
};

/* 3. 도약: 79채널 위를 뛰는 하나 */
export const HoppingThumbnail: React.FC = () => {
  useFont();
  const f = useCurrentFrame();
  return (
    <DeepCard no={3} lines={<>1초에 {hi("1600번")}<br />채널을 바꾸는데,<br />이어폰은 어떻게?</>} shift={320}>
      <HopBand cam={{ pos: [2, 9, 21], look: [5, 3, 0], fov: 40 }} f={f + 20} ch={basicHop(0x2a96ef25, 0x10 + 12).ch} on={1} />
    </DeepCard>
  );
};

/* 4. Database Hash: 쌓인 메뉴판 칸 중 하나가 빠져나와 바뀐다 */
const GCAM: Cam = { pos: [-10, 12, 26], look: [1, 4, 0], fov: 40 };
export const GattCacheThumbnail: React.FC = () => {
  useFont();
  const [lx, ly] = project(GCAM, [3.6, 7.4, 3]);
  return (
    <DeepCard no={4} shift={300} lines={<>펌웨어가 {hi("바뀌면", C.warn)},<br />앱은 어떻게<br />알아챌까?</>}
      overlay={<svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}><text x={lx} y={ly} textAnchor="middle" fill={C.warn} fontSize={64} fontWeight={900}>0x0010</text></svg>}>
      <Scene3D cam={GCAM}>
        <Ground light={[0, 16, 12]} />
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[i === 4 ? 4.2 : 0, 0.8 + i * 1.2, 0]}>
            <boxGeometry args={[9, 0.9, 6]} />
            {mat(i === 4 ? C.warn : i % 2 ? "#334a70" : "#2a3b5c", i === 4 ? 0.9 : 0.1)}
          </mesh>
        ))}
      </Scene3D>
    </DeepCard>
  );
};

/* 5. 암호화: 자물쇠와 열쇠 */
const LCAM: Cam = { pos: [-6, 9, 24], look: [1, 4, 0], fov: 40 };
export const EncryptThumbnail: React.FC = () => {
  useFont();
  return (
    <DeepCard no={5} shift={280} lines={<>저장한 열쇠 하나로<br />{hi("몇 년")} 잠가도<br />괜찮을까?</>}>
      <Scene3D cam={LCAM}>
        <Ground light={[0, 16, 14]} />
        <group position={[0, 0, 0]}>
          <mesh position={[0, 3.2, 0]}><boxGeometry args={[6.4, 5.2, 2.6]} />{mat(DEEP, 0.45)}</mesh>
          <mesh position={[0, 5.8, 0]}><torusGeometry args={[2.2, 0.55, 20, 40, Math.PI]} />{mat("#cbd5e1", 0.15)}</mesh>
          <mesh position={[0, 3.6, 1.32]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 0.1, 24]} />{mat(INK)}</mesh>
          <mesh position={[0, 2.7, 1.32]}><boxGeometry args={[0.45, 1.4, 0.1]} />{mat(INK)}</mesh>
        </group>
        <group position={[7, 2.2, 2]} rotation={[0, 0, -0.5]}>
          <mesh><torusGeometry args={[1.1, 0.35, 16, 32]} />{mat(C.warn, 0.7)}</mesh>
          <mesh position={[2.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.28, 0.28, 3.6, 16]} />{mat(C.warn, 0.7)}</mesh>
          <mesh position={[4.2, -0.55, 0]}><boxGeometry args={[0.4, 0.8, 0.3]} />{mat(C.warn, 0.7)}</mesh>
          <mesh position={[3.4, -0.45, 0]}><boxGeometry args={[0.4, 0.6, 0.3]} />{mat(C.warn, 0.7)}</mesh>
        </group>
      </Scene3D>
    </DeepCard>
  );
};

/* 6. 프라이버시: 길목의 수신기들 사이의 이어폰 */
const PCAM: Cam = { pos: [-4, 10, 24], look: [2, 4, 0], fov: 40 };
export const PrivacyThumbnail: React.FC = () => {
  useFont();
  const posts: Vec[] = [[-6, 0, -3], [4, 0, -5], [12, 0, -2]];
  return (
    <DeepCard no={6} shift={230} lines={<>외치는 이어폰,<br />누가 나를<br />{hi("따라다닐까?")}</>}>
      <Scene3D cam={PCAM}>
        <Ground light={[0, 16, 12]} />
        {posts.map((p, i) => (
          <group key={i} position={p}>
            <mesh position={[0, 3, 0]}><cylinderGeometry args={[0.35, 0.5, 6, 12]} />{mat("#5b6b88")}</mesh>
            <mesh position={[0, 6.6, 0]}><sphereGeometry args={[0.95, 18, 14]} />{mat(C.bad, 0.8)}</mesh>
          </group>
        ))}
        <EarbudsCase3D p={[4, 0, 2]} s={1.15} />
        {posts.map((p, i) => (
          <mesh key={i} position={[(4 + p[0]) / 2, 5, (2 + p[2]) / 2]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.35, 12, 10]} />{mat("#f472b6", 1.2)}
          </mesh>
        ))}
      </Scene3D>
    </DeepCard>
  );
};
export type { Vec };
