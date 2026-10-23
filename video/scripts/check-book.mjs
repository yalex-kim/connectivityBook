// 영상의 계산(src/book.ts)이 책(bluetooth/chapters/hopping.html)과 같은 값을 내는지 확인한다.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync(new URL("../../bluetooth/chapters/hopping.html", import.meta.url), "utf8");
const fn = (name) => { const i = html.indexOf(`  function ${name}(`); let d = 0, j = html.indexOf("{", i); for (; j < html.length; j++) { if (html[j] === "{") d++; else if (html[j] === "}" && --d === 0) break; } return html.slice(i, j + 1); };
const ctx = vm.createContext({});
vm.runInContext(["dataChFreq", "wifiBlocked", "perm16", "csa2Channel"].map(fn).join("\n") + "\nthis.B = { dataChFreq, wifiBlocked, csa2Channel };", ctx);
const B = ctx.B;

// 영상의 book.ts를 그대로 컴파일해 쓴다(타입만 지움)
const { transformSync } = await import("esbuild");
const ts = transformSync(fs.readFileSync(new URL("../src/book.ts", import.meta.url), "utf8"), { loader: "ts", format: "cjs" }).code;
const vctx = vm.createContext({ Math, exports: {}, module: { exports: {} } });
vm.runInContext(ts + "\nthis.V = module.exports;", vctx);
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
// 대본: say와 caption의 문장 수가 같고, say에 숫자가 없고, 나레이션 음성(durations.json)이 지금 문장으로 만든 것인지
for (const video of ["afh", "discover"]) {
  const src = fs.readFileSync(new URL(`../src/${video}/script.ts`, import.meta.url), "utf8");
  const dur = JSON.parse(fs.readFileSync(new URL(`../src/${video}/durations.json`, import.meta.url), "utf8"));
  const voiced = Object.keys(dur).length > 0; // 무음판 단계면 음성 검사는 건너뛴다
  const arr = (body) => [...body.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  for (const m of src.matchAll(/id: "(\w+)",[\s\S]*?say: \[([\s\S]*?)\],\s*caption: \[([\s\S]*?)\],/g)) {
    const [, id, say, cap] = m, S = arr(say), Cp = arr(cap);
    assert.equal(S.length, Cp.length, `${video}/${id}: say와 caption 문장 수`);
    assert.ok(!/[0-9]/.test(S.join("")), `${video}/${id}: 나레이션에 숫자 없음(RULES §4)`);
    n += 2;
    if (!voiced) continue;
    assert.ok(dur[id], `${video}/${id}: 나레이션 길이 있음`);
    assert.equal(dur[id].text, S.join(" "), `${video}/${id}: 음성이 지금 문장으로 만든 것`);
    assert.equal(dur[id].cues.length, S.length - 1, `${video}/${id}: 문장 시작 시각 수`);
    n += 3;
  }
}
// 광고에서 연결까지: 발견 시간 계산이 책 5장(advertising.html)과 같은가
{
  const adv = fs.readFileSync(new URL("../../bluetooth/chapters/advertising.html", import.meta.url), "utf8");
  const fn5 = (name) => { const i = adv.indexOf(`  function ${name}(`); let d = 0, j = adv.indexOf("{", i); for (; j < adv.length; j++) { if (adv[j] === "{") d++; else if (adv[j] === "}" && --d === 0) break; } return adv.slice(i, j + 1); };
  const c5 = vm.createContext({ Math });
  vm.runInContext(["advAirtimeUs", "discoveryLatency"].map(fn5).join("\n") + "\nthis.B5 = { advAirtimeUs, discoveryLatency };", c5);
  const B5 = c5.B5;
  for (let L = 0; L <= 31; L++) { assert.equal(V.advAirtimeUs(L), B5.advAirtimeUs(L)); n++; }
  const common = fs.readFileSync(new URL("../../bluetooth/js/common.js", import.meta.url), "utf8");
  const rngSrc = common.match(/\.rng = (function \(seed = 1\) \{[^\n]*\});/)[1];
  const bookRng = vm.runInContext(`(${rngSrc})`, vm.createContext({}));
  const scr = fs.readFileSync(new URL("../src/discover/script.ts", import.meta.url), "utf8");
  const cases = [...scr.matchAll(/\["[^"]+", (\d+), (\d+), ([\d.]+)\]/g)].map((m) => m.slice(1).map(Number));
  assert.equal(cases.length, 4);
  for (const [ta, ts, w] of cases) {
    const PKT = B5.advAirtimeUs(31) / 1000, p = { ta, ts, tw: Math.max(PKT + 0.05, (ts * w) / 100), pkt: PKT, gap: 0.6, limit: 60000 };
    const r1 = bookRng(2024), r2 = V.bookRng(2024);
    const a = Array.from({ length: 600 }, () => B5.discoveryLatency(p, r1)), b = Array.from({ length: 600 }, () => V.discoveryLatency(p, r2));
    assert.deepEqual(b, a, `발견 시간 ${ta}/${ts}/${w}`);
    const fin = a.filter(Number.isFinite), mean = fin.reduce((x, y) => x + y, 0) / fin.length;
    assert.equal(V.meanDiscovery(ta, ts, w), mean); n += 2;
  }
  const M = cases.map(([ta, ts, w]) => V.meanDiscovery(ta, ts, w) / 1000);
  // 나레이션이 말하는 수치: 가장 빠른 조건 0.1초 미만, 가장 느린 조건 '30초 가까이'
  assert.ok(M[0] < 0.1, `가장 빠른 조건 ${M[0]}`); assert.ok(M[3] > 25 && M[3] < 30, `가장 느린 조건 ${M[3]}`); n += 2;
  console.log(`discover: 발견 평균 ${M.map((x) => x.toFixed(2) + " s").join(", ")}`);
}
// 조건별 예시(영상의 막대 셋): 책의 함수로 다시 계산
const ex = (w, d) => (B.wifiBlocked(w).size / 37) * d * 100;
for (const [w, d, v] of [[[6], 0.5, "13.5"], [[1, 6, 11], 0.5, "41.9"], [[1, 6, 11], 0.1, "8.4"]]) { assert.equal(ex(w, d).toFixed(1), v); assert.equal((V.expectedLoss(w, d) * 100).toFixed(1), v); n++; }
// 영상의 누적 그래프(씨앗 42, 600번)는 고르지 않은 표본이다: 끝값이 계산값과 크게 어긋나지 않는지만 본다
const run = V.simulate(600, false).filter((e) => e.hit).length / 600;
assert.ok(Math.abs(run - 31 / 74) < 0.05, `누적 그래프 끝값 ${(run * 100).toFixed(1)}%`);
console.log(`book check ok: ${n + 4} checks, 31/37 덮임, 긴 시뮬레이션 손실 ${(lossHop * 100).toFixed(1)}%, 영상 그래프 끝값 ${(run * 100).toFixed(1)}%`);
