import { interpolate } from "remotion";
import { C } from "../theme";
import { clamp } from "../afh/parts";
import type { Vec } from "../afh/world3d";

/* 심화 시리즈의 3D 공용 부품: 두 기기 사이를 나는 패킷, 서랍 선반, 지문 격자 */

/** a → b로 [t0, t1] 프레임 동안 나는 패킷. drop이면 b 앞에서 사라진다(버려짐), back이면 되돌아온다 */
export const Packet3D: React.FC<{ f: number; t0: number; t1: number; a: Vec; b: Vec; col: string; size?: number; drop?: boolean; arc?: number }> = ({ f, t0, t1, a, b, col, size = 0.9, drop = false, arc = 2 }) => {
  if (f < t0) return null;
  const k = interpolate(f, [t0, t1], [0, 1], clamp), op = drop ? interpolate(k, [0.75, 1], [1, 0], clamp) : f > t1 + 20 ? interpolate(f, [t1 + 20, t1 + 35], [1, 0], clamp) : 1;
  if (op <= 0) return null;
  const p: Vec = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * arc, a[2] + (b[2] - a[2]) * k];
  const s = drop ? size * (1 - 0.6 * interpolate(k, [0.75, 1], [0, 1], clamp)) : size;
  return (
    <mesh position={p}>
      <boxGeometry args={[s, s, s]} />
      <meshStandardMaterial color={col} emissive={col} emissiveIntensity={1.1} transparent opacity={op} />
    </mesh>
  );
};

/** 패킷의 현재 위치(라벨을 투영할 때) */
export const packetPos = (f: number, t0: number, t1: number, a: Vec, b: Vec, arc = 2): Vec => {
  const k = interpolate(f, [t0, t1], [0, 1], clamp);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * arc, a[2] + (b[2] - a[2]) * k];
};

/** 서랍 선반. rows = 위에서부터, 각 서랍은 key로 구별해 위치가 바뀌면 미끄러진다(from → to를 k로 섞음) */
export type Drawer = { key: string; col: string; glow?: number };
export const Shelf3D: React.FC<{ p: Vec; from: Drawer[]; to?: Drawer[]; k?: number; h?: number; w?: number; hit?: string; hitCol?: string }> = ({ p, from, to, k = 0, h = 0.62, w = 7, hit, hitCol = C.bad }) => {
  const end = to ?? from;
  const idx = (list: Drawer[], key: string) => list.findIndex((d) => d.key === key);
  const keys = Array.from(new Set([...from.map((d) => d.key), ...end.map((d) => d.key)]));
  return (
    <group position={p}>
      <mesh position={[0, -(Math.max(from.length, end.length) * h) / 2 + h / 2, -0.8]}><boxGeometry args={[w + 0.8, Math.max(from.length, end.length) * h + 0.6, 0.4]} /><meshStandardMaterial color="#1a2438" /></mesh>
      {keys.map((key) => {
        const i0 = idx(from, key), i1 = idx(end, key), d = (i1 >= 0 ? end[i1] : from[i0])!;
        const y0 = -(i0 >= 0 ? i0 : i1) * h, y1 = -(i1 >= 0 ? i1 : i0) * h;
        const appear = i0 < 0 ? k : i1 < 0 ? 1 - k : 1, x = i0 < 0 ? (1 - k) * (w + 3) : 0;
        if (appear <= 0) return null;
        const isHit = key === hit;
        return (
          <mesh key={key} position={[x, y0 + (y1 - y0) * k, 0]} scale={[1, 1, appear]}>
            <boxGeometry args={[w, h * 0.82, 1.4]} />
            <meshStandardMaterial color={isHit ? hitCol : d.col} emissive={isHit ? hitCol : d.col} emissiveIntensity={isHit ? 0.9 : d.glow ?? 0.15} />
          </mesh>
        );
      })}
    </group>
  );
};

/** 16바이트 → 4×4 색 격자(2D). 같은 바이트면 같은 무늬라 눈으로 비교한다 */
export const FingerGrid: React.FC<{ x: number; y: number; size: number; bytes: number[]; a?: number; border?: string }> = ({ x, y, size, bytes, a = 1, border = C.faint }) => {
  const c = size / 4;
  return (
    <g opacity={a} transform={`translate(${x},${y})`}>
      <rect x={-6} y={-6} width={size + 12} height={size + 12} rx={12} fill={C.panel} stroke={border} strokeWidth={4} />
      {bytes.slice(0, 16).map((b, i) => <rect key={i} x={(i % 4) * c + 2} y={Math.floor(i / 4) * c + 2} width={c - 4} height={c - 4} rx={5} fill={`hsl(${Math.round((b / 256) * 360)}, 70%, ${45 + (b % 4) * 6}%)`} />)}
    </g>
  );
};
