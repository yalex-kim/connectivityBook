import { useLayoutEffect, useMemo, useRef } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../theme";
import { dataChFreq, type Event } from "../book";

/* 3D 무대. 가로(x) = 주파수(1 MHz = 1), 깊이(z) = 시간(폭포형), 높이(y) = 기둥·벽.
   글자는 3D에 넣지 않고 2D 겹침(제목·자막·계기판)으로 쓴다. */

export const fx = (mhz: number) => mhz - 2442;
export const chX = (c: number) => fx(dataChFreq(c));
export type Vec = [number, number, number];
export type Cam = { pos: Vec; look: Vec; fov?: number };

/** 두 카메라 사이를 부드럽게(0~1) */
export const camLerp = (a: Cam, b: Cam, t: number): Cam => {
  const e = t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const l = (u: Vec, v: Vec) => u.map((x, i) => x + (v[i] - x) * e) as Vec;
  return { pos: l(a.pos, b.pos), look: l(a.look, b.look), fov: (a.fov ?? 40) + ((b.fov ?? 40) - (a.fov ?? 40)) * e };
};

const Rig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.look);
    if (camera instanceof THREE.PerspectiveCamera && cam.fov) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
  });
  return null;
};

const Scene3D: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => (
  <ThreeCanvas width={1920} height={1080} style={{ position: "absolute", inset: 0 }} camera={{ fov: 40, near: 0.5, far: 600, position: cam.pos }} gl={{ antialias: true }}>
    <Rig cam={cam} />
    <ambientLight intensity={0.55} />
    <directionalLight position={[30, 60, 40]} intensity={1.1} />
    <directionalLight position={[-40, 30, -20]} intensity={0.35} color={C.accent} />
    {children}
  </ThreeCanvas>
);

const Floor: React.FC<{ depth?: number; z?: number }> = ({ depth = 40, z = 0 }) => (
  <group position={[0, 0, z]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
      <planeGeometry args={[110, depth]} />
      <meshStandardMaterial color="#0f1a2e" />
    </mesh>
    <gridHelper args={[110, 55, "#22324d", "#18253b"]} position={[0, 0, 0]} scale={[1, 1, depth / 110]} />
  </group>
);

/* ---------------------------------------------------------------- 대역 무대 */
type StageProps = {
  cam: Cam;
  wifi: [number, number, number]; // Wi-Fi 1·6·11 벽 높이 비율(0~1)
  pillars: number; // 채널 기둥 등장 0~1 (왼쪽부터)
  color: (c: number) => string; // 기둥 색
  ism?: number; // ISM 경계 기둥 0~1
  microwave?: number; // 전자레인지 0~1
  ball?: Vec | null; // 도약 중인 패킷
  trail?: Vec[];
  removed?: (c: number) => number; // 채널 맵에서 뺀 정도 0~1 (기둥이 가라앉음)
  adv?: number; // 광고 채널 37·38·39 기둥 등장 0~1 (2402·2426·2480 MHz)
  advGlow?: number; // 광고 채널을 빛나게 0~1
  dim?: number; // 범용 채널 기둥을 어둡게 0~1
};
export const ADV_MHZ = [2402, 2426, 2480];

export const Stage3D: React.FC<StageProps> = ({ cam, wifi, pillars, color, ism = 0, microwave = 0, ball = null, trail = [], removed = () => 0, adv = 0, advGlow = 0, dim = 0 }) => (
  <Scene3D cam={cam}>
    <Floor />
    {ism > 0 &&
      [2400, 2483.5].map((m) => (
        <mesh key={m} position={[fx(m), 6 * ism, 0]}>
          <boxGeometry args={[0.35, 12 * ism, 14]} />
          <meshStandardMaterial color={C.accent2} transparent opacity={0.45} emissive={C.accent2} emissiveIntensity={0.4} />
        </mesh>
      ))}
    {[1, 6, 11].map((w, i) => {
      const h = 13 * wifi[i];
      return h > 0.01 ? (
        <mesh key={w} position={[fx(2407 + 5 * w), h / 2, 0]}>
          <boxGeometry args={[20, h, 9]} />
          <meshStandardMaterial color={C.warn} transparent opacity={0.22} emissive={C.warn} emissiveIntensity={0.25} depthWrite={false} />
        </mesh>
      ) : null;
    })}
    {microwave > 0 && (
      <mesh position={[fx(2455), 0, 0]} scale={[1, microwave, 1]}>
        <sphereGeometry args={[14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={C.bad} transparent opacity={0.13} emissive={C.bad} emissiveIntensity={0.3} depthWrite={false} />
      </mesh>
    )}
    {Array.from({ length: 37 }, (_, c) => {
      const a = Math.max(0, Math.min(1, pillars * 37 - c)), r = removed(c), h = 7 * a * (1 - 0.92 * r);
      return a > 0 ? (
        <mesh key={c} position={[chX(c), h / 2, 0]}>
          <boxGeometry args={[1.25, Math.max(h, 0.05), 1.25]} />
          <meshStandardMaterial color={color(c)} emissive={color(c)} emissiveIntensity={0.25} transparent opacity={(1 - 0.6 * r) * (1 - 0.75 * dim)} />
        </mesh>
      ) : null;
    })}
    {adv > 0 &&
      ADV_MHZ.map((m) => {
        const h = 10 * adv;
        return (
          <mesh key={m} position={[fx(m), h / 2, 0]}>
            <boxGeometry args={[1.6, Math.max(h, 0.05), 1.6]} />
            <meshStandardMaterial color={C.accent2} emissive={C.accent2} emissiveIntensity={0.3 + 0.9 * advGlow} />
          </mesh>
        );
      })}
    {trail.map((p, i) => (
      <mesh key={i} position={p}>
        <sphereGeometry args={[0.9, 16, 12]} />
        <meshStandardMaterial color={C.accent} transparent opacity={0.12 + i * 0.1} />
      </mesh>
    ))}
    {ball && (
      <mesh position={ball}>
        <sphereGeometry args={[1.5, 24, 16]} />
        <meshStandardMaterial color="#ffffff" emissive={C.accent} emissiveIntensity={1.2} />
      </mesh>
    )}
  </Scene3D>
);

/* ---------------------------------------------------------------- 폭포형 시간 지도 */
const Z = 1.6; // 연결 이벤트 하나의 깊이

type FallProps = {
  cam: Cam;
  events: Event[];
  shown: number; // 지금까지 나타난 이벤트 수(소수 가능)
  blocked: Set<number>;
  laneOff?: number; // 덮인 채널 줄을 뺀 정도 0~1 (AFH)
  span?: number; // 화면에 남기는 이벤트 수
};

/** 같은 모양을 여러 위치에 그린다(캔버스 안에서 자기 ref로 위치를 쓴다) */
const Inst: React.FC<{ at: Vec[]; max: number; children: React.ReactNode }> = ({ at, max, children }) => {
  const ref = useRef<THREE.InstancedMesh>(null), dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    at.forEach((p, i) => { dummy.position.set(...p); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.count = at.length;
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, max]}>{children}</instancedMesh>;
};

/** 새 이벤트가 z = 0에서 생기고, 시간이 지날수록 앞(+z)으로 밀려 나온다 */
export const Waterfall3D: React.FC<FallProps> = ({ cam, events, shown, blocked, laneOff = 0, span = 60 }) => {
  const k = Math.floor(shown), shift = (shown - k) * Z, from = Math.max(0, k - span);
  const busy: Vec[] = [], ok: Vec[] = [], bad: Vec[] = [];
  for (let e = from; e < k; e++) {
    const z = (k - 1 - e) * Z + shift, ev = events[e];
    ev.busy.forEach((c) => busy.push([chX(c), 0.35, z]));
    (ev.hit ? bad : ok).push([chX(ev.ch), 1.4, z]);
  }
  const depth = span * Z;
  return (
    <Scene3D cam={cam}>
      <Floor depth={depth + 20} z={depth / 2 - 6} />
      {Array.from({ length: 37 }, (_, c) => {
        const isB = blocked.has(c), off = isB ? laneOff : 0;
        return (
          <mesh key={c} position={[chX(c), 0.03, depth / 2 - 1]}>
            <boxGeometry args={[1.5, 0.06, depth + 2]} />
            <meshStandardMaterial color={isB ? (off > 0.5 ? "#3a1620" : "#3b2a18") : "#16314f"} transparent opacity={0.9 - 0.5 * off} />
          </mesh>
        );
      })}
      <Inst at={busy} max={span * 37}>
        <boxGeometry args={[1.5, 0.7, Z * 0.9]} />
        <meshStandardMaterial color={C.warn} transparent opacity={0.28} emissive={C.warn} emissiveIntensity={0.2} depthWrite={false} />
      </Inst>
      <Inst at={ok} max={span + 2}>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.6} />
      </Inst>
      <Inst at={bad} max={span + 2}>
        <sphereGeometry args={[0.75, 16, 12]} />
        <meshStandardMaterial color={C.bad} emissive={C.bad} emissiveIntensity={0.7} />
      </Inst>
    </Scene3D>
  );
};
