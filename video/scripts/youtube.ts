/**
 * 유튜브 업로드 자료를 만든다: youtube.txt(제목·설명·태그), subtitles.ko.srt(문장별 자막).
 * 장면 시각은 나레이션판(durations.json)과 같은 계산(src/<영상>/timing.ts)을 쓴다.
 *   npm run youtube                 → AFH 영상, out/youtube/
 *   VIDEO=discover npm run youtube  → 광고에서 연결까지, out/youtube-discover/
 */
import fs from "node:fs";
import path from "node:path";
import * as afhS from "../src/afh/script";
import * as afhT from "../src/afh/timing";
import * as afhY from "../src/afh/youtube";
import * as disS from "../src/discover/script";
import * as disT from "../src/discover/timing";
import * as disY from "../src/discover/youtube";

const VIDEO = process.env.VIDEO || "afh";
const V = { afh: [afhS, afhT, afhY], discover: [disS, disT, disY] }[VIDEO] as unknown as [typeof afhS, typeof afhT, typeof afhY];
if (!V) throw new Error(`모르는 영상: ${VIDEO}`);
const [{ SCENES }, { scenesFor, startsFor, sentenceEnd, framesFor }, { YOUTUBE }] = V;
const FPS = 30, OUT = path.join(__dirname, "..", "out", VIDEO === "afh" ? "youtube" : `youtube-${VIDEO}`);
const scenes = scenesFor(true), starts = startsFor(true), total = framesFor(true) / FPS;

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const srtTime = (sec: number) => {
  const ms = Math.round(sec * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};

// 챕터: 장면 묶음의 시작 시각. 유튜브 규칙(0:00 시작, 3개 이상, 각 10초 이상)을 검사한다
const at = (id: string) => starts[scenes.findIndex((s) => s.id === id)] / FPS;
const chapters = YOUTUBE.chapters.map(([title, id], i) => {
  const from = at(id), to = i + 1 < YOUTUBE.chapters.length ? at(YOUTUBE.chapters[i + 1][1]) : total;
  if (to - from < 10) throw new Error(`챕터 "${title}"이 10초보다 짧다 (${(to - from).toFixed(1)}초)`);
  return `${mmss(from)} ${title}`;
});
if (!chapters[0].startsWith("0:00") || chapters.length < 3) throw new Error("챕터는 0:00에서 시작하고 3개 이상이어야 한다");

// 자막: 문장마다 그 문장을 읽는 동안
const srt: string[] = [];
scenes.forEach((s, k) => s.caption.forEach((text, n) => {
  const a = (starts[k] + s.cues[n]) / FPS, b = (starts[k] + sentenceEnd(s, n, true)) / FPS;
  srt.push(`${srt.length + 1}\n${srtTime(a)} --> ${srtTime(b)}\n${text}\n`);
}));

const desc = [
  ...YOUTUBE.summary, "",
  "⏱ 챕터", ...chapters, "",
  "📘 책에서", ...YOUTUBE.links.map(([t, u]) => `${t}\n${u}`), "",
  "※ " + YOUTUBE.notes.join("\n※ "), "",
  "근거: " + YOUTUBE.sources.join(" · "),
  YOUTUBE.credits.join(" · "),
].join("\n");

if (YOUTUBE.title.length > 100) throw new Error("제목은 100자 이하");
if (desc.length > 5000) throw new Error("설명은 5,000자 이하");
const tags = YOUTUBE.tags.join(", ");
if (tags.length > 500) throw new Error("태그는 합쳐서 500자 이하");

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "subtitles.ko.srt"), srt.join("\n"));
fs.writeFileSync(path.join(OUT, "youtube.txt"), `[제목]\n${YOUTUBE.title}\n\n[설명]\n${desc}\n\n[태그]\n${tags}\n`);
console.log(`영상 ${mmss(total)} · 챕터 ${chapters.length}개 · 자막 ${srt.length}개 · 장면 ${SCENES.length}개 → ${path.relative(path.join(__dirname, ".."), OUT)}/`);
