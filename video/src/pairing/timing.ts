/**
 * 장면 길이와 문장 시각. 영상(pairing)과 업로드 자료(scripts/youtube.ts)가 함께 쓴다.
 */
import { SCENES, type Scene } from "./script";
import DURATIONS from "./durations.json";

/** 장면마다 애니메이션이 다 보이려면 필요한 최소 길이(프레임) */
const MIN: Record<Scene["id"], number> = { hook: 240, threats: 240, dh: 330, mitm: 270, compare: 360, methods: 390, outro: 240 };
export const LEAD = 9; // 음성은 장면 시작 0.3초 뒤에
export const TAIL = 18; // 음성이 끝나고 0.6초 쉼

/** 길이와 문장 시작 시각(장면 안 프레임, 첫 문장은 0)이 정해진 장면 */
export type Timed = Scene & { cues: number[] };
type Dur = { dur: number; cues: number[]; text: string };
const DUR = DURATIONS as Record<string, Dur>;

/** 무음판: 문장 시작을 글자 수 비율로 나눈다 */
const silent = (s: Scene): Timed => {
  const total = s.say.reduce((n, x) => n + x.length, 0), span = s.frames - 30;
  let acc = 0;
  return { ...s, cues: s.say.map((x) => { const c = 10 + Math.round((span * acc) / total); acc += x.length; return c; }) };
};
/** 나레이션판: 장면 길이 = 음성 길이 + 여백(최소 길이 이상), 문장 시작 = 음성에서 찾은 시각 */
const voiced = (s: Scene): Timed => {
  const d = DUR[s.id];
  if (!d) return silent(s); // 아직 나레이션이 없으면 무음판 길이
  return { ...s, frames: Math.max(MIN[s.id], Math.ceil(d.dur * 30) + LEAD + TAIL), cues: [0, ...d.cues.map((c) => LEAD + Math.round(c * 30))] };
};
export const scenesFor = (voice: boolean): Timed[] => SCENES.map(voice ? voiced : silent);
export const framesFor = (voice: boolean) => scenesFor(voice).reduce((n, s) => n + s.frames, 0);


/** 장면 시작 프레임 */
export const startsFor = (voice: boolean) => {
  let at = 0;
  return scenesFor(voice).map((s) => { const from = at; at += s.frames; return from; });
};
/** 문장 n의 나레이션 끝(장면 안 프레임): 다음 문장 시작, 마지막 문장은 음성 끝 */
export const sentenceEnd = (s: Timed, n: number, voice: boolean) =>
  n + 1 < s.cues.length ? s.cues[n + 1] : voice ? s.frames - TAIL : s.frames - 10;
