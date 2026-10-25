import { interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { C, FONT } from "../theme";
import { Scene3D, camLerp, type Cam, type Vec } from "../afh/world3d";
import { clamp } from "../afh/parts";

/* 훅 장면(3D): 뒷주머니에 휴대폰을 넣은 사람, 몸을 지나 귀의 이어폰으로 가는 신호, 바닥의 10 m 자, 그 너머의 분실물 태그.
   글자는 3D에 넣지 않고, 3D 좌표를 화면에 투영해 2D로 겹친다. 1 m = 4 단위. */
const M = 4, PX = -26; // 사람의 위치(x)
const EAR: Vec = [PX + 0.2, 17.2, 1.75], POCKET: Vec = [PX - 2.3, 8.4, 0.9];
const TAG: Vec = [PX + 19 * M, 1.2, 0];
const CL = C.accent2, LE = C.accent, BAD = C.bad;
const at = (f: number, c: number, d = 20) => interpolate(f, [c, c + d], [0, 1], clamp);

/** 화면 좌표(1920×1080)로 투영: Scene3D와 같은 카메라 */
const project = (cam: Cam, p: Vec): [number, number] => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 40, 1920 / 1080, 0.5, 600);
  c.position.set(...cam.pos);
  c.lookAt(...cam.look);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return [((v.x + 1) / 2) * 1920, ((1 - v.y) / 2) * 1080];
};

/** 반투명 홀로그램 재질: 몸을 지나는 신호가 보이게 */
const mat = (color: string, emissive = 0.35) => <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissive} roughness={0.4} metalness={0.1} transparent opacity={0.5} depthWrite={false} />;

/** 사람: 캡슐 몸통·팔·다리, 공 머리. 오른쪽(+x)을 본다 */
const Person3D: React.FC = () => {
  const skin = "#7fa6dc", cloth = "#5f86c4", pants = "#4a6aa0";
  return (
    <group position={[PX, 0, 0]}>
      {[-0.9, 0.9].map((z) => (
        <mesh key={z} position={[0, 3.6, z]}>
          <capsuleGeometry args={[0.85, 5.4, 8, 16]} />
          {mat(pants)}
        </mesh>
      ))}
      <mesh position={[0, 11, 0]} scale={[1, 1, 1.15]}>
        <capsuleGeometry args={[2.1, 4.6, 8, 24]} />
        {mat(cloth)}
      </mesh>
      {[-2.6, 2.6].map((z) => (
        <mesh key={z} position={[0.3, 10.6, z]} rotation={[z > 0 ? -0.12 : 0.12, 0, 0.12]}>
          <capsuleGeometry args={[0.6, 5, 8, 16]} />
          {mat(cloth)}
        </mesh>
      ))}
      <mesh position={[0, 15.7, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 1, 16]} />
        {mat(skin)}
      </mesh>
      <mesh position={[0.15, 17.6, 0]}>
        <sphereGeometry args={[1.75, 32, 24]} />
        {mat(skin)}
      </mesh>
      {/* 이어폰 */}
      <mesh position={[EAR[0] - PX, EAR[1], EAR[2]]}>
        <sphereGeometry args={[0.42, 16, 12]} />
        <meshStandardMaterial color={CL} emissive={CL} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
};

const Phone3D: React.FC<{ glow: number }> = ({ glow }) => (
  <group position={POCKET} rotation={[0, 0, 0.08]}>
    <mesh>
      <boxGeometry args={[0.35, 2.4, 1.25]} />
      <meshStandardMaterial color="#d9e2f0" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[-0.19, 0, 0]}>
      <boxGeometry args={[0.02, 2.2, 1.08]} />
      <meshStandardMaterial color={LE} emissive={LE} emissiveIntensity={0.3 + glow} />
    </mesh>
  </group>
);

/** 10 m 자: 1 m마다 눈금 */
const Ruler: React.FC<{ a: number }> = ({ a }) => (
  <group position={[0, 0.05, 6]}>
    <mesh position={[PX + 5 * M, 0, 0]} scale={[a, 1, 1]}>
      <boxGeometry args={[10 * M, 0.12, 0.25]} />
      <meshStandardMaterial color={C.dim} emissive={C.dim} emissiveIntensity={0.2} />
    </mesh>
    {Array.from({ length: 11 }, (_, i) =>
      i / 10 <= a ? (
        <mesh key={i} position={[PX + i * M, 0, 0.6]}>
          <boxGeometry args={[0.18, 0.12, i % 5 ? 1 : 1.8]} />
          <meshStandardMaterial color={C.dim} emissive={C.dim} emissiveIntensity={0.3} />
        </mesh>
      ) : null
    )}
  </group>
);

const Tag3D: React.FC<{ f: number; a: number }> = ({ f, a }) => {
  const p = (f % 45) / 45;
  return (
    <group position={TAG} scale={a}>
      <mesh>
        <boxGeometry args={[2.2, 0.7, 2.2]} />
        <meshStandardMaterial color="#e9eef7" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.05, 20]} />
        <meshStandardMaterial color={LE} emissive={LE} emissiveIntensity={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} scale={1 + p * 5}>
        <torusGeometry args={[1.4, 0.07, 8, 48]} />
        <meshStandardMaterial color={LE} emissive={LE} emissiveIntensity={1} transparent opacity={1 - p} />
      </mesh>
    </group>
  );
};

/** A→B를 흐르는 빛나는 점들 */
const Dots: React.FC<{ a: Vec; b: Vec; f: number; col: string; on: number; n?: number; speed?: number; r?: number; flicker?: boolean }> = ({ a, b, f, col, on, n = 10, speed = 0.02, r = 0.32, flicker = false }) =>
  on <= 0 ? null : (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = (f * speed + i / n) % 1, gone = flicker && (Math.floor(f / 5) + i) % 3 === 0;
        return gone ? null : (
          <mesh key={i} position={[a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]}>
            <sphereGeometry args={[r, 12, 10]} />
            <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.4} transparent opacity={on} />
          </mesh>
        );
      })}
    </group>
  );

export const Hook3D: React.FC<{ cues: number[]; len: number }> = ({ cues, len }) => {
  const f = useCurrentFrame();
  const sig = at(f, 15), broke = at(f, cues[1] + 45), far = at(f, cues[2] - 10), q = at(f, cues[3]);
  const close: Cam = { pos: [PX - 16, 16, 34], look: [PX, 11, 0], fov: 40 };
  const wide: Cam = { pos: [PX + 34, 34, 86], look: [PX + 38, 4, 0], fov: 40 };
  const cam = camLerp(close, wide, interpolate(f, [cues[2] - 20, cues[2] + 50], [0, 1], clamp));
  const mid: Vec = [(EAR[0] + POCKET[0]) / 2, (EAR[1] + POCKET[1]) / 2, (EAR[2] + POCKET[2]) / 2];
  const sigCol = broke > 0.5 ? BAD : CL;
  const ruler = at(f, 5, 40);
  const L = (p: Vec) => project(cam, p);
  const [r0, r10, tg, ear, md] = [L([PX, 0, 8]), L([PX + 10 * M, 0, 8]), L([TAG[0], 4, 0]), L(EAR), L(mid)];
  return (
    <>
      <Scene3D cam={cam}>
        <fog attach="fog" args={[C.bg, 70, 200]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[20, -0.03, 0]}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#0d1729" />
        </mesh>
        <gridHelper args={[300, 150, "#24395a", "#172640"]} position={[20, 0, 0]} />
        <pointLight position={[PX + 10, 22, 14]} intensity={250} color="#9cc8ff" distance={60} />
        <Person3D />
        <Phone3D glow={broke > 0.5 ? 0.2 : 0.8} />
        <Dots a={POCKET} b={EAR} f={f} col={sigCol} on={sig} flicker={broke > 0.5} />
        {broke > 0 &&
          [0.75, -0.75].map((rz) => (
            <mesh key={rz} position={[mid[0] + 2.6, mid[1], mid[2] + 1.6]} rotation={[0, 0, rz]} scale={broke}>
              <boxGeometry args={[0.35, 3.2, 0.35]} />
              <meshStandardMaterial color={BAD} emissive={BAD} emissiveIntensity={1.2} />
            </mesh>
          ))}
        <Ruler a={ruler} />
        <Tag3D f={f} a={far} />
        <Dots a={[TAG[0], 1.5, 0]} b={POCKET} f={f} col={LE} on={far} n={14} speed={0.012} r={0.45} />
      </Scene3D>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }} fontFamily={FONT}>
        <g opacity={ruler * (1 - 0.3 * far)}>
          <text x={r0[0]} y={r0[1] + 44} textAnchor="middle" fill={C.dim} fontSize={30} fontWeight={800}>0</text>
          <text x={r10[0]} y={r10[1] + 48} textAnchor="middle" fill={C.text} fontSize={40} fontWeight={900}>10 m ?</text>
        </g>
        <g opacity={at(f, cues[1]) * (1 - far)}>
          <text x={md[0] - 140} y={md[1] + 10} textAnchor="end" fill={C.dim} fontSize={30} fontWeight={800}>뒷주머니 → 귀</text>
          <text x={md[0] - 140} y={md[1] + 50} textAnchor="end" fill={C.dim} fontSize={26}>약 1 m</text>
        </g>
        <text x={ear[0] + 70} y={ear[1] - 30} fill={BAD} fontSize={34} fontWeight={900} opacity={broke * (1 - far)}>뚝뚝</text>
        <g opacity={far}>
          <text x={tg[0]} y={tg[1] - 40} textAnchor="middle" fill={LE} fontSize={32} fontWeight={800}>훨씬 먼 곳에서도</text>
        </g>
        <text x={960} y={300} textAnchor="middle" fill={C.accent} opacity={q} fontSize={140} fontWeight={900}>?</text>
      </svg>
    </>
  );
};
