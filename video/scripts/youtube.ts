/**
 * 유튜브 업로드 자료를 만든다: youtube.txt(제목·설명·태그), subtitles.ko.srt(문장별 자막).
 * 장면 시각은 나레이션판(durations.json)과 같은 계산(src/<영상>/timing.ts)을 쓴다.
 *   npm run youtube                 → AFH 영상, out/youtube/
 *   VIDEO=discover npm run youtube  → 광고에서 연결까지, out/youtube-discover/
 *   VIDEO=twokinds npm run youtube  → 같은 블루투스인데 왜 다르게 말할까, out/youtube-twokinds/
 *   VIDEO=range npm run youtube     → 블루투스는 몇 미터까지 될까, out/youtube-range/
 *   VIDEO=connection npm run youtube → 블루투스 켜 두면 배터리 닳을까, out/youtube-connection/
 *   VIDEO=gatt npm run youtube       → 처음 보는 심박계인데 앱은 어떻게 심박수를 읽을까, out/youtube-gatt/
 *   VIDEO=scheduling npm run youtube → (심화 1) 휴대폰 하나에 이어폰·워치·키보드를 다 연결해도 될까, out/youtube-scheduling/
 */
import fs from "node:fs";
import path from "node:path";
import * as afhS from "../src/afh/script";
import * as afhT from "../src/afh/timing";
import * as afhY from "../src/afh/youtube";
import * as disS from "../src/discover/script";
import * as disT from "../src/discover/timing";
import * as disY from "../src/discover/youtube";
import * as tkS from "../src/twokinds/script";
import * as tkT from "../src/twokinds/timing";
import * as tkY from "../src/twokinds/youtube";
import * as rgS from "../src/range/script";
import * as rgT from "../src/range/timing";
import * as rgY from "../src/range/youtube";
import * as cnS from "../src/connection/script";
import * as cnT from "../src/connection/timing";
import * as cnY from "../src/connection/youtube";
import * as gtS from "../src/gatt/script";
import * as gtT from "../src/gatt/timing";
import * as gtY from "../src/gatt/youtube";
import * as paS from "../src/pairing/script";
import * as paT from "../src/pairing/timing";
import * as paY from "../src/pairing/youtube";
import * as poS from "../src/power/script";
import * as poT from "../src/power/timing";
import * as poY from "../src/power/youtube";
import * as auS from "../src/audio/script";
import * as auT from "../src/audio/timing";
import * as auY from "../src/audio/youtube";
import * as loS from "../src/locate/script";
import * as scS from "../src/scheduling/script";
import * as scT from "../src/scheduling/timing";
import * as scY from "../src/scheduling/youtube";
import * as inS from "../src/instant/script";
import * as inT from "../src/instant/timing";
import * as inY from "../src/instant/youtube";
import * as hoS from "../src/hopping/script";
import * as hoT from "../src/hopping/timing";
import * as hoY from "../src/hopping/youtube";
import * as loT from "../src/locate/timing";
import * as loY from "../src/locate/youtube";

const VIDEO = process.env.VIDEO || "afh";
const V = { afh: [afhS, afhT, afhY], discover: [disS, disT, disY], twokinds: [tkS, tkT, tkY], range: [rgS, rgT, rgY], connection: [cnS, cnT, cnY], gatt: [gtS, gtT, gtY], pairing: [paS, paT, paY], power: [poS, poT, poY], audio: [auS, auT, auY], locate: [loS, loT, loY], scheduling: [scS, scT, scY], instant: [inS, inT, inY], hopping: [hoS, hoT, hoY] }[VIDEO] as unknown as [typeof afhS, typeof afhT, typeof afhY];
if (!V) throw new Error(`모르는 영상: ${VIDEO}`);
const [{ SCENES }, { scenesFor, startsFor, sentenceEnd, framesFor }, { YOUTUBE }] = V;
const FPS = 30, OUT = path.join(__dirname, "..", "out", VIDEO === "afh" ? "youtube" : `youtube-${VIDEO}`);
const scenes = scenesFor(true), starts = startsFor(true), total = framesFor(true) / FPS;

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const srtTime = (sec: number) => {
  const ms = Math.round(sec * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};

// 챕터: 장면 묶음의 시작 시각. 적는 시각은 초 단위로 올림한다(장면이 시작한 뒤를 가리키게).
// 유튜브 규칙(0:00 시작, 3개 이상, 각 10초 이상)을 적힌 시각으로 검사하되, 딱 10초는 인식되지 않은 적이 있어 10초보다 길어야 통과시킨다.
const at = (id: string) => starts[scenes.findIndex((s) => s.id === id)] / FPS;
const stamps = YOUTUBE.chapters.map(([, id], i) => (i === 0 ? 0 : Math.ceil(at(id) - 1e-6)));
const chapters = YOUTUBE.chapters.map(([title], i) => {
  const from = stamps[i], to = i + 1 < stamps.length ? stamps[i + 1] : Math.floor(total);
  if (to - from <= 10) throw new Error(`챕터 "${title}"이 10초보다 길지 않다 (${to - from}초)`);
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
// 카드(오른쪽 위 티저, YouTube Studio에서 단다): 장면의 n번째 문장이 시작할 때
type Card = { scene: string; sentence: number; video: string; teaser: string; message: string };
const cards = (((YOUTUBE as unknown as { cards?: Card[] }).cards) ?? []).map((c) => {
  const k = scenes.findIndex((s) => s.id === c.scene);
  if (k < 0) throw new Error(`카드의 장면 없음: ${c.scene}`);
  return `${mmss(Math.floor((starts[k] + scenes[k].cues[c.sentence]) / FPS))} 영상 카드 → ${c.video}\n  티저 문구: ${c.teaser}\n  맞춤 메시지: ${c.message}`;
});
fs.writeFileSync(path.join(OUT, "youtube.txt"), `[제목]\n${YOUTUBE.title}\n\n[설명]\n${desc}\n\n[태그]\n${tags}\n` + (cards.length ? `\n[카드] YouTube Studio → 편집기 → 카드\n${cards.join("\n")}\n` : ""));
console.log(`영상 ${mmss(total)} · 챕터 ${chapters.length}개 · 자막 ${srt.length}개 · 장면 ${SCENES.length}개 → ${path.relative(path.join(__dirname, ".."), OUT)}/`);
