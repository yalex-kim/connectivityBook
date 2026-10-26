import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Caption, fade, useFont } from "../afh/parts";

/* 입문 7~10편이 함께 쓰는 부품: 3D 바닥, 용어 설명 상자, 장면 틀 */

/** 3D 무대의 바닥(안개·바닥판·격자·조명). Scene3D 안에 넣는다 */
export const Ground: React.FC<{ light?: [number, number, number] }> = ({ light = [0, 20, 16] }) => (
  <>
    <fog attach="fog" args={[C.bg, 60, 170]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#0d1729" />
    </mesh>
    <gridHelper args={[200, 100, "#24395a", "#172640"]} />
    <pointLight position={light} intensity={230} color="#9cc8ff" distance={75} />
  </>
);

/** 짧은 설명 상자(용어 풀이). [굵게, 나머지] 줄들 */
export const Note: React.FC<{ x: number; y: number; w: number; a: number; lines: [string, string][]; col?: string }> = ({ x, y, w, a, lines, col = C.warn }) => (
  <g opacity={a} fontFamily={FONT}>
    <rect x={x} y={y} width={w} height={28 + lines.length * 44} rx={18} fill={C.panel} stroke={col} strokeWidth={3} />
    {lines.map(([k, v], i) => (
      <text key={i} x={x + 26} y={y + 52 + i * 44} fill={C.text} fontSize={26} fontWeight={700}>
        <tspan fill={col} fontWeight={900}>{k}</tspan>{k ? "  " : ""}{v}
      </text>
    ))}
  </g>
);

export type TimedScene = { id: string; frames: number; caption: string[]; cues: number[] };

/** 장면을 이어 붙이고 장면마다 음성(public/audio/<dir>/<id>.wav)과 자막을 얹는다 */
export function makeVideo<S extends TimedScene>(dir: string, scenesFor: (voice: boolean) => S[], lead: number, body: (s: S) => React.ReactNode) {
  const Frame: React.FC<{ s: S; voice: boolean }> = ({ s, voice }) => {
    const f = useCurrentFrame(), k = s.cues.filter((c) => c <= f).length - 1;
    return (
      <AbsoluteFill style={{ opacity: fade(f, s.frames) }}>
        {body(s)}
        {voice && (
          <Sequence from={lead} layout="none">
            <Audio src={staticFile(`audio/${dir}/${s.id}.wav`)} />
          </Sequence>
        )}
        <Caption key={k} text={s.caption[Math.max(0, k)]} />
      </AbsoluteFill>
    );
  };
  const Video: React.FC<{ voice: boolean }> = ({ voice }) => {
    useFont();
    let from = 0;
    return (
      <AbsoluteFill style={{ background: `radial-gradient(1600px 900px at 50% 35%, #12213a, ${C.bg})` }}>
        {scenesFor(voice).map((s) => {
          const start = from;
          from += s.frames;
          return (
            <Sequence key={s.id} from={start} durationInFrames={s.frames}>
              <Frame s={s} voice={voice} />
            </Sequence>
          );
        })}
      </AbsoluteFill>
    );
  };
  return Video;
}

/** 심화 시리즈 색(BluetoothBook 심화 책의 다크 강조색) */
export const DEEP = "#a5b4fc";

/** 유튜브 썸네일 틀(1920×1080로 그리고 1280×720으로 줄여 올린다): 오른쪽 3D 장면 + 왼쪽 큰 질문.
 *  deep이면 심화 시리즈: 같은 배치에 인디고 색, 왼쪽 세로 띠, "심화" 표지 */
export const ThumbCard: React.FC<{ kicker: string; lines: React.ReactNode; chip: string; children: React.ReactNode; overlay?: React.ReactNode; deep?: boolean; size?: number }> = ({ kicker, lines, chip, children, overlay, deep = false, size = 116 }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {children}
    {overlay}
    <AbsoluteFill style={{ background: deep ? "linear-gradient(90deg, rgba(16,14,44,.97) 0%, rgba(16,14,44,.86) 44%, rgba(16,14,44,0) 64%)" : "linear-gradient(90deg, rgba(11,18,32,.97) 0%, rgba(11,18,32,.85) 44%, rgba(11,18,32,0) 64%)" }} />
    {deep && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 26, background: DEEP }} />}
    <div style={{ position: "absolute", left: 110, top: 190, fontFamily: FONT }}>
      <div style={{ color: deep ? DEEP : C.accent2, fontSize: 46, fontWeight: 800, letterSpacing: 3, display: "flex", alignItems: "center", gap: 22 }}>
        {deep && <span style={{ background: DEEP, color: "#14123a", padding: "4px 20px", borderRadius: 12, letterSpacing: 0, fontWeight: 900 }}>심화</span>}
        {kicker}
      </div>
      <div style={{ color: C.text, fontSize: size, fontWeight: 900, lineHeight: 1.15, marginTop: 20 }}>{lines}</div>
      <div style={{ display: "inline-block", marginTop: 40, padding: "14px 34px", borderRadius: 999, background: deep ? DEEP : C.accent, color: deep ? "#14123a" : C.bg, fontSize: 50, fontWeight: 900 }}>{chip}</div>
    </div>
  </AbsoluteFill>
);
