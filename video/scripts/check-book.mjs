// 영상의 계산(src/book.ts)이 책(bluetooth/chapters/hopping.html)과 같은 값을 내는지 확인한다.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../../bluetooth/chapters/hopping.html", import.meta.url), "utf8");
const fn = (name) => { const i = html.indexOf(`  function ${name}(`); let d = 0, j = html.indexOf("{", i); for (; j < html.length; j++) { if (html[j] === "{") d++; else if (html[j] === "}" && --d === 0) break; } return html.slice(i, j + 1); };
const ctx = vm.createContext({});
vm.runInContext(["dataChFreq", "wifiBlocked", "perm16", "csa2Channel"].map(fn).join("\n") + "\nthis.B = { dataChFreq, wifiBlocked, csa2Channel };", ctx);
const B = ctx.B;

const ts = fs.readFileSync(new URL("../src/book.ts", import.meta.url), "utf8")
  .replace(/^export /gm, "").replace(/: (number|boolean)\[\]|: Set<number>|: number|: \(\) => number|: Event\[\]|: boolean/g, "")
  .replace(/^type Event.*$/m, "").replace(/new Set<number>\(\)/, "new Set()").replace(/const used = \[\]/, "const used = []");
const vctx = vm.createContext({ Math });
vm.runInContext(ts + "\nthis.V = { dataChFreq, wifiBlocked, csa2Channel, simulate, expectedLoss, WIFI, DUTY };", vctx);
const V = vctx.V;

let n = 0;
for (let c = 0; c < 37; c++) { assert.equal(V.dataChFreq(c), B.dataChFreq(c)); n++; }
for (const w of [[1], [6], [11], [1, 6, 11]]) { assert.deepEqual([...V.wifiBlocked(w)], [...B.wifiBlocked(w)]); n++; }
const maps = [Array(37).fill(true), Array.from({ length: 37 }, (_, c) => !B.wifiBlocked([1, 6, 11]).has(c))];
for (const map of maps) for (let e = 0; e < 500; e++) { assert.equal(V.csa2Channel(e, 0x305f + 13, map), B.csa2Channel(e, 0x305f + 13, map).ch); n++; }
// 영상이 말하는 수치
const blocked = V.wifiBlocked(V.WIFI).size;
assert.equal(blocked, 31); assert.equal((blocked / 37 * V.DUTY * 100).toFixed(1), "41.9");
const big = V.simulate(20000, false), lossHop = big.filter((e) => e.hit).length / big.length;
assert.ok(Math.abs(lossHop - 31 / 74) < 0.02, `무작위 도약 손실 ${lossHop}`);
assert.equal(V.simulate(2000, true).filter((e) => e.hit).length, 0, "적응형 도약은 손실 0");
// 대본: say와 caption의 문장 수가 같고, 나레이션 음성(durations.json)이 지금 문장으로 만든 것인지
{
  const src = fs.readFileSync(new URL("../src/afh/script.ts", import.meta.url), "utf8");
  const dur = JSON.parse(fs.readFileSync(new URL("../src/afh/durations.json", import.meta.url), "utf8"));
  const arr = (body) => [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  for (const m of src.matchAll(/id: "(\w+)",[\s\S]*?say: \[([\s\S]*?)\],\s*caption: \[([\s\S]*?)\],/g)) {
    const [, id, say, cap] = m, S = arr(say), Cp = arr(cap);
    assert.equal(S.length, Cp.length, `${id}: say와 caption 문장 수`);
    assert.ok(dur[id], `${id}: 나레이션 길이 있음`);
    assert.equal(dur[id].text, S.join(" "), `${id}: 음성이 지금 문장으로 만든 것`);
    assert.equal(dur[id].cues.length, S.length - 1, `${id}: 문장 시작 시각 수`);
    n += 4;
  }
}
// 조건별 예시(영상의 막대 셋): 책의 함수로 다시 계산
const ex = (w, d) => (B.wifiBlocked(w).size / 37) * d * 100;
for (const [w, d, v] of [[[6], 0.5, "13.5"], [[1, 6, 11], 0.5, "41.9"], [[1, 6, 11], 0.1, "8.4"]]) { assert.equal(ex(w, d).toFixed(1), v); assert.equal((V.expectedLoss(w, d) * 100).toFixed(1), v); n++; }
// 영상의 누적 그래프(씨앗 42, 600번)는 고르지 않은 표본이다: 끝값이 계산값과 크게 어긋나지 않는지만 본다
const run = V.simulate(600, false).filter((e) => e.hit).length / 600;
assert.ok(Math.abs(run - 31 / 74) < 0.05, `누적 그래프 끝값 ${(run * 100).toFixed(1)}%`);
console.log(`book check ok: ${n + 4} checks, 31/37 덮임, 긴 시뮬레이션 손실 ${(lossHop * 100).toFixed(1)}%, 영상 그래프 끝값 ${(run * 100).toFixed(1)}%`);
