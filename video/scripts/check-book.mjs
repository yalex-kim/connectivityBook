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
for (const video of ["afh", "discover", "twokinds", "range", "connection"]) {
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
  // 나레이션이 말하는 수치: 가장 빠른 조건 0.1초 미만, 가장 느린 조건은 '1분이 지나도 못 찾는 경우가 더 많다'(찾은 비율 < 50%)
  const F = cases.map(([ta, ts, w]) => V.foundWithin(ta, ts, w));
  assert.ok(M[0] < 0.1, `가장 빠른 조건 ${M[0]}`); assert.ok(F[3] < 0.5, `가장 느린 조건 1분 안 ${F[3]}`); n += 2;
  assert.ok(F.slice(0, 3).every((x) => x === 1), "앞의 세 조건은 모두 1분 안에 찾음(평균만 보여 줘도 됨)"); n++;
  console.log(`discover: 발견 평균 ${M.map((x) => x.toFixed(2) + " s").join(", ")} · 1분 안에 찾은 비율 ${F.map((x) => Math.round(x * 100) + "%").join(", ")}`);
}
// 몇 미터까지 될까: 링크 버짓 계산이 책 2장(radio.html)과 같은가, 그리고 나레이션이 말하는 수치
{
  const radio = fs.readFileSync(new URL("../../bluetooth/chapters/radio.html", import.meta.url), "utf8");
  const fn2 = (name) => { const i = radio.indexOf(`  function ${name}(`); let d = 0, j = radio.indexOf("{", i); for (; j < radio.length; j++) { if (radio[j] === "{") d++; else if (radio[j] === "}" && --d === 0) break; } return radio.slice(i, j + 1); };
  const c2 = vm.createContext({ Math, C: 299792458 });
  vm.runInContext(["fspl", "pathLoss", "maxRange"].map(fn2).join("\n") + "\nthis.B2 = { fspl, pathLoss, maxRange };", c2);
  const B2 = c2.B2, F = 2.44e9;
  assert.ok(radio.includes("const C = 299792458;"));
  for (const d of [0.3, 1, 2, 7.5, 40, 300]) for (const nn of [2, 2.7, 3.3]) { assert.equal(V.pathLoss(d, nn, F), B2.pathLoss(d, nn, F)); assert.equal(V.maxRange(0, 12, -97, nn, F), B2.maxRange(0, 12, -97, nn, F)); n += 2; }
  const fs1 = V.fspl(1, F);
  assert.ok(Math.abs(fs1 - 40) < 0.5, `1 m 손실 ${fs1} ≈ 40 dB(만분의 일)`);
  assert.ok(Math.abs(V.fspl(2, F) - fs1 - 6.02) < 0.01, "거리 두 배 = 6 dB(사분의 일)");
  assert.ok(Math.abs(10 ** ((-70 - -95) / 10) - 316) < 1, "사양 −70 vs 칩 −95 dBm = 수백 배");
  assert.ok(Math.abs(10 ** ((-70 - -82) / 10) - 15.85) < 0.01, "Coded S=8 감도 요구 12 dB = 약 16배");
  const r = (db, nn) => V.maxRange(0, -db, -97, nn, F) / V.maxRange(0, 0, -97, nn, F);
  assert.ok(Math.abs(r(12, 2) - 3.98) < 0.01, "트인 곳 4배"); assert.ok(r(12, 2.7) > 2 && r(12, 3.3) < 3, "실내 2~3배");
  for (const [db, nn] of [[12, 2], [12, 2.7], [-12, 2.7]]) { assert.ok(Math.abs(V.rangeFactor(db, nn) - r(db, nn)) < 1e-9); n++; }
  console.log(`range: 1 m ${fs1.toFixed(1)} dB · S=8 거리 배율 트인 곳 ${r(12, 2).toFixed(2)} · 집 ${r(12, 2.7).toFixed(2)} · 사무실 ${r(12, 3.3).toFixed(2)} · 몸(−12 dB, 집) ${r(-12, 2.7).toFixed(2)}`);
}
// 켜 두면 배터리 닳을까: 연결 파라미터 규칙이 책 6장(connection.html)과 같은가, 그리고 나레이션이 말하는 수치
{
  const conn = fs.readFileSync(new URL("../../bluetooth/chapters/connection.html", import.meta.url), "utf8");
  const fn6 = (name) => { const i = conn.indexOf(`  function ${name}(`); let d = 0, j = conn.indexOf("{", i); for (; j < conn.length; j++) { if (conn[j] === "{") d++; else if (conn[j] === "}" && --d === 0) break; } return conn.slice(i, j + 1); };
  const c6 = vm.createContext({});
  vm.runInContext(fn6("checkConnParams") + "\nthis.B6 = { checkConnParams };", c6);
  for (const iv of [375, 1250, 7500, 50000, 100000, 4e6]) for (const lat of [0, 4, 9, 499]) for (const to of [100, 500, 510, 2000, 32000]) for (const sci of [true, false]) { assert.equal(JSON.stringify(V.checkConnParams(iv, lat, 1, to, sci)), JSON.stringify(c6.B6.checkConnParams(iv, lat, 1, to, sci))); n++; }
  assert.equal(V.EMPTY_PDU_US, 80); assert.equal(V.EMPTY_EVENT_US, 310);
  assert.ok(V.EMPTY_EVENT_US < 1000 && 1000 / 50000 <= 0.02, "50 ms마다 1 ms도 안 되는 순간 → 98% 넘게 잔다");
  assert.equal(Math.floor(1000 / 7.5), 133); assert.equal(1000 / 100, 10); // 1초에 백서른세 번 · 열 번
  assert.equal((4 + 1) * 50, 250); // 지연 4, 간격 50 ms: 휴대폰 → 워치 최대 250 ms
  assert.equal(V.checkConnParams(50000, 4, 1, 2000, false).length, 0, "예시 파라미터(50 ms, 지연 4, 타임아웃 2 s)는 유효");
  assert.ok(V.checkConnParams(50000, 4, 1, 500, false).length > 0, "타임아웃 500 ms는 규칙 위반(쉬는 시간 250 ms × 2와 같음)");
  console.log(`connection: 빈 이벤트 ${V.EMPTY_EVENT_US} µs, 50 ms 간격에서 깨어 있는 비율 ${(V.EMPTY_EVENT_US / 50000 * 100).toFixed(2)}%`);
}
// 조건별 예시(영상의 막대 셋): 책의 함수로 다시 계산
const ex = (w, d) => (B.wifiBlocked(w).size / 37) * d * 100;
for (const [w, d, v] of [[[6], 0.5, "13.5"], [[1, 6, 11], 0.5, "41.9"], [[1, 6, 11], 0.1, "8.4"]]) { assert.equal(ex(w, d).toFixed(1), v); assert.equal((V.expectedLoss(w, d) * 100).toFixed(1), v); n++; }
// 영상의 누적 그래프(씨앗 42, 600번)는 고르지 않은 표본이다: 끝값이 계산값과 크게 어긋나지 않는지만 본다
const run = V.simulate(600, false).filter((e) => e.hit).length / 600;
assert.ok(Math.abs(run - 31 / 74) < 0.05, `누적 그래프 끝값 ${(run * 100).toFixed(1)}%`);
console.log(`book check ok: ${n + 4} checks, 31/37 덮임, 긴 시뮬레이션 손실 ${(lossHop * 100).toFixed(1)}%, 영상 그래프 끝값 ${(run * 100).toFixed(1)}%`);
