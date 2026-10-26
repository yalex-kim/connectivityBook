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
const vctx = vm.createContext({ Math, TextEncoder, exports: {}, module: { exports: {} } });
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
for (const video of ["afh", "discover", "twokinds", "range", "connection", "gatt", "pairing", "power", "audio", "locate", "scheduling", "instant", "hopping", "gattcache"]) {
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
    // PENDING_VOICE=영상,영상: 대본을 고쳤지만 아직 나레이션을 다시 만들지 못한 영상(타입캐스트 한도 등). 음성 검사를 경고로만 알린다
    if ((process.env.PENDING_VOICE || "").split(",").includes(video) && (!dur[id] || dur[id].text !== S.join(" "))) { console.warn(`⚠ ${video}/${id}: 나레이션 다시 만들어야 함`); continue; }
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
// 처음 보는 심박계: 심박 측정값 해석이 책 7장(gatt.html)과 같은가, 그리고 영상의 바이트
{
  const g = fs.readFileSync(new URL("../../bluetooth/chapters/gatt.html", import.meta.url), "utf8");
  const fn7 = (name) => { const i = g.indexOf(`  function ${name}(`); let d = 0, j = g.indexOf("{", i); for (; j < g.length; j++) { if (g[j] === "{") d++; else if (g[j] === "}" && --d === 0) break; } return g.slice(i, j + 1); };
  const c7 = vm.createContext({});
  vm.runInContext(fn7("parseHeartRate") + "\nthis.B7 = { parseHeartRate };", c7);
  const samples = [[0x00, 0x48], [0x01, 0x2c, 0x01], [0x16, 0x50, 0x00, 0x04, 0x10, 0x04], [0x19, 0x48, 0x00, 0x0a, 0x00, 0x00, 0x04], [0x06, 0xb4]];
  for (const s of samples) { assert.equal(JSON.stringify(V.parseHeartRate(s)), JSON.stringify(c7.B7.parseHeartRate(s))); n++; }
  assert.equal(V.parseHeartRate([0x00, 0x48]).bpm, 72); assert.equal(0x48, 72); // 영상: 00 48 → 72
  // 영상의 A사 메뉴판 = 책 시뮬레이터의 DB: 심박 서비스 0x0008, 심박 측정값 값 0x000A, CCCD 0x000B
  assert.ok(g.includes("[0x0008, 0x2800") && g.includes("[0x000a, 0x2a37") && g.includes("[0x000b, 0x2902"));
  console.log(`gatt: 00 48 → ${V.parseHeartRate([0x00, 0x48]).bpm} bpm`);
}
// 입문 7~10편: 책 8~11장의 함수와 영상이 말하는 수치
{
  const read = (ch) => fs.readFileSync(new URL(`../../bluetooth/chapters/${ch}.html`, import.meta.url), "utf8");
  const pick = (src, name) => { const i = src.indexOf(`  function ${name}(`); let d = 0, j = src.indexOf("{", i); for (; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}" && --d === 0) break; } return src.slice(i, j + 1); };
  const load = (ch, names, extra = {}) => { const s = read(ch), c = vm.createContext({ Math, ...extra }); vm.runInContext(names.map((x) => pick(s, x)).join("\n") + `\nthis.F = { ${names.join(", ")} };`, c); return c.F; };
  // 7편 페어링: 방식 표(MITM 요구, OOB 없음, Secure Connections)
  const S = load("security", ["pairingMethod"]);
  assert.equal(S.pairingMethod("DisplayYesNo", "DisplayYesNo", true, false, false, true, true).method, "숫자 비교");
  assert.equal(S.pairingMethod("KeyboardDisplay", "KeyboardOnly", true, false, false, true, true).method, "패스키 입력");
  assert.equal(S.pairingMethod("DisplayYesNo", "NoInputNoOutput", true, false, false, true, true).method, "Just Works");
  assert.equal(S.pairingMethod("DisplayYesNo", "NoInputNoOutput", true, false, false, true, true).auth, "미인증");
  assert.ok(fs.readFileSync(new URL("../../bluetooth/scripts/verify-factcheck.cjs", import.meta.url), "utf8").includes("0x2f9ed5ba, 'g2 sample D.5'"));
  assert.equal(0x2f9ed5ba % 1e6, 938554); // 사양 샘플 D.5의 g2 → 화면 숫자
  // 8편 전력
  const P = load("power", ["averageCurrentUa", "windowWideningUs"]);
  for (const a of [[2, 15, 1], [2, 15, 0.1], [2, 30, 0.5]]) { assert.equal(V.averageCurrentUa(...a), P.averageCurrentUa(...a)); n++; }
  assert.equal(V.windowWideningUs(500, 2e6), P.windowWideningUs(500, 2e6));
  const yrs = (ua) => 220 / (ua / 1000) / 24 / 365;
  assert.equal(V.averageCurrentUa(2, 15, 1), 17); assert.ok(Math.abs(yrs(17) - 1.48) < 0.03, "약 1년 반");
  assert.ok(Math.abs(220 / 0.152 / 24 / 30.4 - 2) < 0.1, "100 ms → 약 2달"); assert.equal(Math.round(V.averageCurrentUa(2, 15, 0.1)), 152);
  assert.ok(yrs(2) > 12 && yrs(2) < 13, "수면 2 µA → 12년 남짓"); assert.ok(220 / 5 < 48, "5 mA 계속 → 이틀도 못 감");
  assert.ok(Math.abs(V.windowWideningUs(500, 2e6) - 1016) < 1, "2 s · 500 ppm → 약 1 ms");
  // 9편 오디오: 지연 예산 대표값(audio.html의 모델 수치)
  const A = load("audio", ["cisDelivery"]);
  const au = read("audio");
  assert.ok(au.includes("클래식 = 프레임 20 ms + 인코딩 5 + 전송 10 + 버퍼 + 디코딩 5 + DAC 5 ms") && au.includes('id="lt-buf" min="20" max="300" step="10" value="150"'));
  assert.ok(au.includes("LE = LC3 10 ms 프레임 + 인코딩 2.5 + (ISO_Interval × FT) + 표시 지연 + 디코딩 2.5 ms") && au.includes('id="lt-iso" min="4" max="24" value="8"') && au.includes('id="lt-ft" min="1" max="6" value="2"') && au.includes('id="lt-pd" min="0" max="40" value="10"'));
  assert.equal(20 + 5 + 10 + 150 + 5 + 5, 195); assert.equal(10 + 2.5 + 8 * 1.25 * 2 + 10 + 2.5, 45);
  assert.equal(V.cisDelivery(0.2, 3, 1, 1), A.cisDelivery(0.2, 3, 1, 1)); assert.ok(Math.abs((1 - V.cisDelivery(0.2, 3, 1, 1)) * 100 - 0.8) < 1e-9, "실패 0.8%");
  // 10편 위치
  const L = load("location", ["rssiToDistance", "aoaAngle"]);
  assert.equal(V.rssiToDistance(-71, -59, 2), L.rssiToDistance(-71, -59, 2)); assert.ok(Math.abs(V.rssiToDistance(-71, -59, 2) - 3.98) < 0.01, "−71 dBm → 약 4 m");
  assert.ok(Math.abs(V.rssiToDistance(-71 - 6, -59, 2) / V.rssiToDistance(-71, -59, 2) - 2) < 0.01, "6 dB → 2배");
  const lam = 299792458 / 2.44e9; assert.ok(Math.abs(lam / 2 - 0.0614) < 0.001, "반 파장 약 6 cm");
  assert.ok(Math.abs((V.aoaAngle(Math.PI / 2, lam / 2, lam) * 180) / Math.PI - 30) < 1e-9); assert.equal(V.aoaAngle(Math.PI / 2, lam / 2, lam), L.aoaAngle(Math.PI / 2, lam / 2, lam));
  let cs = 0; for (let k = 2; k <= 76; k++) if (k <= 22 || k >= 26) cs++; assert.equal(cs, 72, "채널 사운딩 72채널");
  assert.ok(Math.abs(299792458 / (2 * 1e6) - 150) < 0.2, "1 MHz 간격 → 150 m마다 되풀이");
  console.log(`intro 7~10: g2 샘플 → ${0x2f9ed5ba % 1e6}, 15 µC/1 s → ${V.averageCurrentUa(2, 15, 1)} µA(${yrs(17).toFixed(2)}년), 창 넓히기 ${V.windowWideningUs(500, 2e6)} µs, 지연 195/45 ms, −71 dBm → ${V.rssiToDistance(-71, -59, 2).toFixed(2)} m`);
}
// 심화 1편 스케줄링: 스케줄러 예시 모델이 심화 3장(scheduling.html)과 같은가, 그리고 영상이 말하는 수치
{
  const sch = fs.readFileSync(new URL("../../bluetooth-deep/chapters/scheduling.html", import.meta.url), "utf8");
  const i = sch.indexOf("  function schedule("); let d = 0, j = sch.indexOf("{", i); for (; j < sch.length; j++) { if (sch[j] === "{") d++; else if (sch[j] === "}" && --d === 0) break; }
  const cs = vm.createContext({ Math }); vm.runInContext(sch.slice(i, j + 1) + "\nthis.sched = schedule;", cs);
  const same = (T, rule) => { assert.equal(JSON.stringify(V.schedule(T, 1000, rule)), JSON.stringify(cs.sched(T, 1000, rule)), `schedule ${rule}`); n++; };
  // 책 시뮬레이터의 과제 모양으로 무작위 비교
  const r = V.bookRng(7);
  for (let k = 0; k < 40; k++) {
    const T = [{ name: "A", period: 8 + Math.round(r() * 40), dur: 4, prio: 4 }, { name: "B", period: 8 + Math.round(r() * 40), dur: 4, prio: 3, offset: Math.round(r() * 10) }, { name: "광고", period: 100, dur: 3, prio: 2, offset: 2 }, { name: "스캔", period: 100, dur: 30, prio: 1, offset: 5, background: true }];
    same(T, "fixed"); same(T, "starve");
  }
  const scr = fs.readFileSync(new URL("../src/scheduling/script.ts", import.meta.url), "utf8");
  const num = (re) => Number(scr.match(re)[1]);
  const EAR = { period: num(/EAR = \{ period: ([\d.]+)/), dur: num(/EAR = \{ period: [\d.]+, dur: ([\d.]+)/) }, CONN = { period: num(/CONN = \{ period: ([\d.]+)/), dur: num(/CONN = \{ period: [\d.]+, dur: ([\d.]+)/) };
  const ST = { ear: num(/STAGGER = \{ ear: ([\d.]+)/), watch: num(/STAGGER = \{[^}]*watch: ([\d.]+)/), kb: num(/STAGGER = \{[^}]*kb: ([\d.]+)/) }, CL = { watch: num(/CLASH = \{ watch: ([\d.]+)/), kb: num(/CLASH = \{[^}]*kb: ([\d.]+)/) };
  const tasks = (o) => [...(o.ear === undefined ? [] : [{ name: "ear", period: EAR.period, dur: EAR.dur, prio: 5, offset: o.ear }]), { name: "watch", period: CONN.period, dur: CONN.dur, prio: 4, offset: o.watch }, { name: "kb", period: CONN.period, dur: CONN.dur, prio: 3, offset: o.kb }];
  assert.equal(CONN.period % EAR.period, 0, "30은 10의 배수");
  const stag = cs.sched(tasks(ST), 1000, "fixed").stats;
  assert.ok(["ear", "watch", "kb"].every((k) => stag[k].skipped === 0), "엇갈리면 1초 동안 셋 다 건너뜀 0");
  const fixed = cs.sched(tasks(CL), 1000, "fixed").stats, fair = cs.sched(tasks(CL), 1000, "starve").stats;
  assert.equal(fixed.kb.skipped, Math.ceil(1000 / CONN.period), "고정 우선순위: 키보드는 1초 동안 모두 건너뜀"); assert.equal(fixed.kb.maxGap, 1000);
  assert.ok(fair.watch.maxGap <= 60 && fair.kb.maxGap <= 60 && Math.max(fair.watch.maxGap, fair.kb.maxGap) === 60, "굶은 만큼 올림: 가장 긴 공백 60 ms");
  const cl3 = cs.sched(tasks({ ear: 0, watch: CL.watch + 0.5, kb: CL.kb + 0.5 }), 1000, "fixed").runs;
  assert.ok(cl3.filter((x) => x.t < 6 && !x.ok).length === 2, "2장면: 같은 순간 셋 중 둘이 건너뜀");
  // 시간이 모자라면(책의 예측해 보기): 7.5 ms 간격에 2.5 ms × 6 = 15 ms, 많아야 절반
  assert.ok(sch.includes("센트럴이 연결 여섯 개를 7.5 ms 간격으로 유지하고, 각 연결이 매 이벤트에 2.5 ms씩 쓴다"));
  assert.ok(scr.includes("SHORT = { period: 7.5, dur: 2.5, n: 6 }")); assert.equal(2.5 * 6, 15); assert.equal(Math.floor(7.5 / 2.5), 3);
  assert.ok(sch.includes("감독 타임아웃 안에 적어도 한 번은 보내야") && sch.includes("감독 타임아웃 안에 적어도 한 번은 들어야 한다") && sch.includes("0x08"));
  // 몇 개까지: 이어폰(20%) + 30 ms마다 4 ms 연결 6개 = 100%, FIT 자리면 건너뜀 0, 7번째는 자리가 없다
  const FIT = JSON.parse(scr.match(/FIT = (\[[^\]]*\])/)[1]);
  const fitT = (k) => [{ name: "ear", period: EAR.period, dur: EAR.dur, prio: 9, offset: 0 }, ...[...FIT, 8].slice(0, k).map((o, i) => ({ name: "c" + i, period: CONN.period, dur: CONN.dur, prio: 8 - i, offset: o }))];
  assert.equal(FIT.length, 6); assert.ok(Math.abs(EAR.dur / EAR.period + 6 * CONN.dur / CONN.period - 1) < 1e-12, "20% + 6 × 13.3% = 100%");
  assert.ok(Object.values(cs.sched(fitT(6), 1000, "fixed").stats).every((x) => x.skipped === 0), "6개는 건너뜀 0");
  for (let o = 0; o < 30; o += 0.5) { const T = fitT(6); T.push({ name: "c6", period: CONN.period, dur: CONN.dur, prio: 1, offset: o }); assert.ok(cs.sched(T, 1000, "fixed").stats.c6.skipped > 0, `7번째(${o} ms)는 자리가 없다`); }
  assert.equal(Math.round(EAR.dur / EAR.period * 100), 20); assert.equal(Math.round(CONN.dur / CONN.period * 100), 13);
  n += 8;
  console.log(`scheduling: 엇갈림 건너뜀 ${["ear", "watch", "kb"].map((k) => stag[k].skipped).join("/")}, 고정 키보드 ${fixed.kb.skipped}번 건너뜀, 굶은 만큼 공백 ${fair.watch.maxGap}/${fair.kb.maxGap} ms`);
}
// 심화 2편 instant: instantRisk가 심화 4장(procedures.html)과 같은가, 그리고 영상이 말하는 수치
{
  const pr = fs.readFileSync(new URL("../../bluetooth-deep/chapters/procedures.html", import.meta.url), "utf8");
  const i = pr.indexOf("  function instantRisk("), j = pr.indexOf("\n", i);
  const cp = vm.createContext({ Math }); vm.runInContext(pr.slice(i, j) + "\nthis.risk = instantRisk;", cp);
  for (let d = 1; d <= 60; d++) for (const k of [1, 2, 3, 5, 6, 12]) for (const p of [0.1, 0.3, 0.5]) { assert.equal(JSON.stringify(V.instantRisk(d, k, p)), JSON.stringify(cp.risk(d, k, p))); n++; }
  const scr = fs.readFileSync(new URL("../src/instant/script.ts", import.meta.url), "utf8");
  assert.ok(scr.includes("export const PER = 0.3, NEAR = 6, EVERY = 6, FAR = 36;"));
  const a = cp.risk(6, 1, 0.3), b = cp.risk(6, 6, 0.3), c = cp.risk(36, 6, 0.3);
  assert.equal(a.chances, 6); assert.equal((a.miss * 100).toFixed(2), "0.07"); // 약 영 점 영칠 퍼센트
  assert.equal(b.chances, 1); assert.equal(Math.round(b.miss * 100), 30);
  assert.equal(c.chances, 6); assert.equal(6 * (5 + 1), 36); // 기회 6번 × (지연 5 + 1)
  assert.ok(pr.includes("6번의 기회") && pr.includes("Instant Passed(0x28)") && pr.includes("앵커 포인트 이동"));
  n += 4;
  console.log(`instant: 기회 6 → ${(a.miss * 100).toFixed(3)}%, 6번에 한 번 듣는 워치 6번째 → ${(b.miss * 100).toFixed(0)}%, 36번째 → ${(c.miss * 100).toFixed(3)}%`);
}
// 심화 3편 Classic 도약: basicHop·adaptedHop이 심화 12장(baseband.html)과 같은가, 그리고 영상이 말하는 것
{
  const bb = fs.readFileSync(new URL("../../bluetooth-deep/chapters/baseband.html", import.meta.url), "utf8");
  const pick = (name) => { const i = bb.indexOf(`  function ${name}(`); let d = 0, j = bb.indexOf("{", i); for (; j < bb.length; j++) { if (bb[j] === "{") d++; else if (bb[j] === "}" && --d === 0) break; } return bb.slice(i, j + 1); };
  const ch = vm.createContext({ Math }); vm.runInContext(["perm5", "hopInputs", "basicHop", "adaptedHop"].map(pick).join("\n") + "\nthis.H = { basicHop, adaptedHop };", ch);
  const scr = fs.readFileSync(new URL("../src/hopping/script.ts", import.meta.url), "utf8");
  assert.ok(scr.includes("export const ADDR = 0x2a96ef25, CLK0 = 0x10;") && scr.includes("export const UNUSED_TO = 21;"));
  assert.ok(bb.includes("0x2a96ef25"), "사양 예제의 주소");
  const maps = [Array(79).fill(true), Array.from({ length: 79 }, (_, c) => c > 21), Array.from({ length: 79 }, (_, c) => c % 2 === 0)];
  for (const addr of [0x00000000, 0x2a96ef25, 0x6587cba9]) for (let clk = 0; clk < 4096; clk += 2) {
    assert.equal(V.basicHop(addr, clk).ch, ch.H.basicHop(addr, clk).ch); n++;
    for (const m of maps) { assert.equal(V.adaptedHop(addr, clk, m), ch.H.adaptedHop(addr, clk, m)); n++; }
  }
  // 32번 뛰는 동안 서로 다른 32개 채널: 여러 주소·구간에서 확인(PERM5가 일대일이라 늘 성립)
  for (const addr of [0x00000000, 0x2a96ef25, 0x6587cba9, 0x12345678]) for (let s = 0; s < 64; s++) { const set = new Set(Array.from({ length: 32 }, (_, k) => V.basicHop(addr, s * 128 + 4 * k).ch)); assert.equal(set.size, 32, `구간 ${s}`); n++; }
  assert.equal(1 / 625e-6, 1600); assert.equal(625 / 2, 312.5); // 1초에 최대 1600번, 시계 한 칸 312.5 µs
  // AFH: 다시 고른 채널은 모두 쓰는 채널
  const used = maps[1]; for (let clk = 0; clk < 4096; clk += 4) { assert.ok(used[V.adaptedHop(0x2a96ef25, clk, used)]); n++; }
  assert.ok(bb.includes("Peripheral은 바로 앞 Central 슬롯과 <b>같은 채널</b>로 답한다"));
  console.log(`hopping: 사양 예제 주소 첫 슬롯 ${Array.from({ length: 6 }, (_, i) => V.basicHop(0x2a96ef25, 0x10 + 2 * i).ch).join(",")}`);
}
// 심화 5편 GATT 캐시: aesCmac·hashBytes·databaseHash·robust가 심화 11장(gatt.html)과 같은가, 그리고 영상이 말하는 것
{
  const g = fs.readFileSync(new URL("../../bluetooth-deep/chapters/gatt.html", import.meta.url), "utf8");
  const pick = (name) => { const i = g.indexOf(`  function ${name}(`); let d = 0, j = g.indexOf("{", i); for (; j < g.length; j++) { if (g[j] === "{") d++; else if (g[j] === "}" && --d === 0) break; } return g.slice(i, j + 1); };
  const sbox = g.match(/  const SBOX = [^\n]*\n/)[0], full = g.match(/  const FULL = [^\n]*\n/)[0];
  const cg = vm.createContext({ Math }); vm.runInContext(sbox + full + ["aes128", "aesCmac", "hashBytes", "databaseHash", "robust"].map(pick).join("\n") + "\nthis.G = { aes128, aesCmac, databaseHash, robust };", cg);
  // RFC 4493 시험 벡터(키 2b7e1516…, 빈 메시지 → bb1d6929…)
  const K = [0x2b,0x7e,0x15,0x16,0x28,0xae,0xd2,0xa6,0xab,0xf7,0x15,0x88,0x09,0xcf,0x4f,0x3c];
  assert.equal(V.aesCmac(K, []).map((b) => b.toString(16).padStart(2, "0")).join(""), "bb1d6929e95937287fa37d129b756746");
  const variants = [{}, { name: true }, { prop: true }, { bat: true }, { insert: true }];
  for (const o of variants) { const db = V.gattDb(o); assert.equal(JSON.stringify(V.databaseHash(db)), JSON.stringify(cg.G.databaseHash(db))); n++; }
  const hx = (o) => V.databaseHash(V.gattDb(o)).hash.join(",");
  assert.equal(hx({ name: true }), hx({}), "이름 값만 바꾸면 지문 그대로");
  assert.notEqual(hx({ prop: true }), hx({}), "성질 바꾸면 지문 바뀜"); assert.notEqual(hx({ bat: true }), hx({}), "서비스 더하면 지문 바뀜"); assert.notEqual(hx({ insert: true }), hx({}));
  const before = V.gattDb(), after = V.gattDb({ insert: true }), hr = before.find((a) => a.label === "심박 측정값").handle;
  assert.equal(hr, 0x0010); assert.equal(after.find((a) => a.handle === hr).label, "배터리 잔량", "0x0010이 배터리 잔량을 가리킨다");
  assert.ok(g.includes("클라이언트 → ATT_READ_REQ 0x0010"), "책 시뮬레이터도 0x0010 읽기");
  // 책 build()와 같은 구조인지: 선언 순서와 UUID
  assert.ok(g.includes('svc(0x1800); chr(0x02, 0x2a00') && g.includes('svc(0x180d); chr($("hs-prop").checked ? 0x12 : 0x10, 0x2a37'));
  for (const seq of [["change", "req", "hash", "req"], ["change", "cmd", "req", "req"], ["change", "hash", "req"], ["change", "scCfm", "cmd"]]) {
    let a = { aware: true, errSent: false, hashRead: false }, b = { ...a };
    for (const ev of seq) { const r1 = V.robust(a, ev), r2 = cg.G.robust(b, ev); assert.equal(JSON.stringify(r1), JSON.stringify(r2)); a = r1.st; b = r2.st; n++; }
  }
  let s = { aware: true, errSent: false, hashRead: false }; s = V.robust(s, "change").st;
  assert.ok(V.robust(s, "req").rsp.includes("0x12")); assert.ok(V.robust(s, "cmd").rsp.includes("무시"));
  console.log(`gattcache: 지문 ${V.databaseHash(V.gattDb()).hash.slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("")}…, 0x0010 → ${after.find((a) => a.handle === hr).label}`);
}
// 조건별 예시(영상의 막대 셋): 책의 함수로 다시 계산
const ex = (w, d) => (B.wifiBlocked(w).size / 37) * d * 100;
for (const [w, d, v] of [[[6], 0.5, "13.5"], [[1, 6, 11], 0.5, "41.9"], [[1, 6, 11], 0.1, "8.4"]]) { assert.equal(ex(w, d).toFixed(1), v); assert.equal((V.expectedLoss(w, d) * 100).toFixed(1), v); n++; }
// 영상의 누적 그래프(씨앗 42, 600번)는 고르지 않은 표본이다: 끝값이 계산값과 크게 어긋나지 않는지만 본다
const run = V.simulate(600, false).filter((e) => e.hit).length / 600;
assert.ok(Math.abs(run - 31 / 74) < 0.05, `누적 그래프 끝값 ${(run * 100).toFixed(1)}%`);
console.log(`book check ok: ${n + 4} checks, 31/37 덮임, 긴 시뮬레이션 손실 ${(lossHop * 100).toFixed(1)}%, 영상 그래프 끝값 ${(run * 100).toFixed(1)}%`);
