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
vm.runInContext(ts + "\nthis.V = { dataChFreq, wifiBlocked, csa2Channel, simulate, WIFI, DUTY };", vctx);
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
assert.equal(V.simulate(60, false, 5).filter((e) => e.hit).length, 25, "영상의 표본(씨앗 5): 25/60 = 41.7%");
console.log(`book check ok: ${n + 4} checks, 31/37 덮임, 긴 시뮬레이션 손실 ${(lossHop * 100).toFixed(1)}%`);
