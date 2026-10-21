/* ==========================================================================
   UWBBook 공통 스크립트 — 전역 객체 UW
   이 파일은 shared/common.js에서 tools/sync_shared.py로 만든다. 장 목록 밖을 고치려면 shared/common.js를 고친 뒤 동기화한다.
   - 레이아웃(상단바, 목차, 이전/다음, 테마) 자동 생성
   - 시뮬레이터 헬퍼: canvas, chart, range, seg, 그리기·포맷 유틸
   이 파일은 <head>에서 defer 없이 로드된다. 페이지 스크립트는 </body> 직전에 둔다.
   ========================================================================== */
(function () {
  "use strict";

  // @book-chapters-begin — 이 사이(장 목록)는 책마다 다르다. tools/sync_shared.py가 책의 것을 그대로 둔다.
  const CHAPTERS = [
    { slug: "intro",     num: "01", part: "시작하기",   title: "UWB란 무엇인가",                       desc: "세기가 아니라 시간으로 거리를 잰다. 레이더에서 출발한 임펄스 무선, 802.15.4a·4z와 FiRa, 휴대폰·자동차 키·태그 속 UWB.", tags: ["기초", "sim"] },
    { slug: "pulse",     num: "02", part: "물리 계층",  title: "펄스와 대역폭: 짧을수록 넓다",          desc: "2 ns 펄스가 500 MHz를 차지하는 이유. 시간 분해능 c/B, 겹친 반사를 갈라내는 힘, UWB의 정의(500 MHz 또는 비대역폭 20%).", tags: ["물리", "sim"] },
    { slug: "channels",  num: "03", part: "물리 계층",  title: "채널과 전파 규칙",                     desc: "499.2 MHz의 배수로 놓인 채널, 휴대폰이 쓰는 5번·9번, −41.3 dBm/MHz 규제가 정하는 출력과 거리, Wi-Fi 6E와의 이웃 관계.", tags: ["무선", "sim"] },
    { slug: "frame",     num: "04", part: "물리 계층",  title: "HRP 프레임: 프리앰블·SFD·STS",          desc: "자기 상관이 완벽한 프리앰블 코드, 시작을 알리는 SFD, PHR과 데이터, 위조를 막는 STS. 프레임 길이와 전송 시간 계산.", tags: ["물리", "sim"] },
    { slug: "timestamp", num: "05", part: "거리 재기",  title: "시계와 타임스탬프: 15.65 피코초",        desc: "63.8976 GHz로 세는 40비트 시계, 1 눈금 = 4.7 mm, 안테나 지연 보정, 수정 진동자의 ppm 오차가 거리를 흔드는 방식.", tags: ["거리", "sim"] },
    { slug: "twr",       num: "06", part: "거리 재기",  title: "양방향 거리 측정: SS-TWR와 DS-TWR",     desc: "보내고 받고 되돌려 받기. 단방향·양방향 TWR 공식, 응답 시간과 시계 오차가 만드는 오류, 공개 코드의 시험 값으로 검증.", tags: ["거리", "sim"] },
    { slug: "multipath", num: "07", part: "거리 재기",  title: "다중 경로와 첫 경로",                   desc: "채널 임펄스 응답(CIR), 가장 센 경로가 아닌 첫 경로 찾기, 벽 너머(NLOS)의 거리 오차와 신호 세기 차이로 알아보기.", tags: ["거리", "sim"] },
    { slug: "aoa",       num: "08", part: "방향과 위치", title: "방향 찾기: PDoA와 AoA",                desc: "안테나 두 개의 위상 차이로 각도 구하기. 반 파장 간격, 넓은 각도에서 나빠지는 정확도, 모호성, 방위각과 앙각.", tags: ["방향", "sim"] },
    { slug: "position",  num: "09", part: "방향과 위치", title: "위치 찾기: 삼변 측량과 TDoA",           desc: "앵커 셋으로 위치 구하기, 앵커 배치가 정하는 정확도(DOP), 태그가 듣기만 하는 DL-TDoA와 보내기만 하는 UL-TDoA.", tags: ["위치", "sim"] },
    { slug: "security",  num: "10", part: "시스템",     title: "안전한 거리: STS와 중계 방어",          desc: "자동차 키를 노리는 중계와 거리 줄이기, 암호로 만든 펄스 열 STS, 정적·동적·제공 키, 왜 UWB가 BLE보다 안전한 거리를 주는가.", tags: ["보안", "sim"] },
    { slug: "fira",      num: "11", part: "시스템",     title: "FiRa 세션: 라운드·슬롯·역할",           desc: "컨트롤러와 컨트롤리, 시작자와 응답자, RSTU와 슬롯, 라운드와 간격, 일대다 측정과 채널 도약. Android UWB 스택의 기본값.", tags: ["MAC", "sim"] },
    { slug: "power",     num: "12", part: "시스템",     title: "전력과 공존: BLE가 깨우는 UWB",         desc: "BLE로 찾고 UWB로 잰다. 측정 주기와 배터리, 수신 대기의 비용, Wi-Fi 6E·5G와 같은 하늘 아래서.", tags: ["전력", "sim"] },
    { slug: "apps",      num: "13", part: "응용과 종합", title: "디지털 키와 정밀 찾기",                desc: "차 문을 여는 디지털 키(BLE + UWB), 화살표로 안내하는 분실물 찾기, 문·결제·실내 길 찾기. 응용마다 다른 요구 사항.", tags: ["응용", "sim"] },
    { slug: "design",    num: "14", part: "응용과 종합", title: "실내 측위 설계 플레이그라운드",         desc: "공간에 앵커를 놓고 TWR·TDoA, 측정 주기, 태그 수를 고르면 정확도와 용량, 배터리가 따라온다.", tags: ["종합", "sim"] },
    { slug: "glossary",  num: "15", part: "응용과 종합", title: "용어집 & 종합 퀴즈",                   desc: "UWB 핵심 용어를 검색하고 종합 퀴즈로 배운 내용을 점검하자.", tags: ["정리"] },
  ];
  // @book-chapters-end
  const UW = (window.UW = {});
  UW.CHAPTERS = CHAPTERS;

  /* ------------------------------------------------------------ math utils */
  UW.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  UW.lerp = (a, b, t) => a + (b - a) * t;
  UW.map = (x, a, b, c, d) => c + ((x - a) * (d - c)) / (b - a);
  UW.randn = function () {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  UW.poisson = function (lambda) {
    if (lambda <= 0) return 0;
    if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * UW.randn()));
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };
  /** 숫자 포맷: 유효 자리 */
  UW.fmt = function (x, digits = 3) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0";
    const a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) return x.toExponential(digits - 1).replace("e+", "e");
    return Number(x.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 6 });
  };
  /** SI 접두사 포맷: UW.si(2.3e-9,'m') → "2.3 nm" */
  UW.si = function (x, unit = "", digits = 3) {
    if (!isFinite(x)) return "—";
    if (x === 0) return "0 " + unit;
    const pre = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
    const a = Math.abs(x);
    for (const [v, p] of pre) if (a >= v * 0.9995) return Number((x / v).toPrecision(digits)) + " " + p + unit;
    return x.toExponential(digits - 1) + " " + unit;
  };

  /* ------------------------------------------------------------ number utils */
  /** 정수 → 2진 문자열(자리수 고정): UW.bin(5,8) → "00000101" */
  UW.bin = (n, bits = 8) => ((n >>> 0) & (bits >= 32 ? 0xffffffff : (1 << bits) - 1)).toString(2).padStart(bits, "0");
  /** 정수 → 16진 문자열: UW.hex(255,2) → "FF" */
  UW.hex = (n, digits = 2) => (n >>> 0).toString(16).toUpperCase().padStart(digits, "0");
  /** 바이트 수 → 사람이 읽는 단위 */
  UW.bytes = function (b, digits = 3) {
    const u = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0;
    while (Math.abs(b) >= 1000 && i < u.length - 1) { b /= 1000; i++; }
    return Number(b.toPrecision(digits)) + " " + u[i];
  };
  /** 시간(초) → 사람이 읽는 단위 */
  UW.time = function (s) {
    const steps = [[3.156e7 * 100, "세기"], [3.156e7, "년"], [2.63e6, "개월"], [86400, "일"], [3600, "시간"], [60, "분"], [1, "초"], [1e-3, "ms"], [1e-6, "µs"], [1e-9, "ns"], [1e-12, "ps"]];
    for (const [v, n] of steps) if (Math.abs(s) >= v * 0.9995) return Number((s / v).toPrecision(3)) + " " + n;
    return s.toExponential(2) + " 초";
  };
  /** 큰 수를 한국어 단위로: UW.kn(1040000) → "104만" */
  UW.kn = function (n) {
    const a = Math.abs(n);
    if (a >= 1e12) return Number((n / 1e12).toPrecision(3)) + "조";
    if (a >= 1e8) return Number((n / 1e8).toPrecision(3)) + "억";
    if (a >= 1e4) return Number((n / 1e4).toPrecision(3)) + "만";
    return String(Math.round(n));
  };
  UW.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /** 결정적 난수(시드) */
  UW.rng = function (seed = 1) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

  /* ------------------------------------------------------------ canvas drawing utils */
  /** 둥근 사각형 경로 */
  UW.rrect = function (ctx, x, y, w, h, r = 6) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  /** 상자 + 가운데 글자 */
  UW.box = function (ctx, x, y, w, h, o = {}) {
    const P = UW.palette();
    UW.rrect(ctx, x, y, w, h, o.r == null ? 8 : o.r);
    ctx.fillStyle = o.fill || P.surface; ctx.fill();
    if (o.stroke !== false) { ctx.strokeStyle = o.stroke || P.border; ctx.lineWidth = o.lw || 1; ctx.stroke(); }
    if (o.text != null) {
      ctx.fillStyle = o.color || P.text;
      ctx.font = (o.bold ? "700 " : "") + (o.size || 13) + "px " + (o.mono ? UW.color("mono") || "monospace" : UW.font());
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const lines = String(o.text).split("\n");
      const lh = (o.size || 13) * 1.3;
      lines.forEach((ln, i) => ctx.fillText(ln, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * lh));
    }
  };
  /** 화살표 */
  UW.arrow = function (ctx, x1, y1, x2, y2, o = {}) {
    const P = UW.palette();
    ctx.strokeStyle = ctx.fillStyle = o.color || P.dim; ctx.lineWidth = o.lw || 1.6;
    ctx.setLineDash(o.dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    const a = Math.atan2(y2 - y1, x2 - x1), s = o.head || 8;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * Math.cos(a - 0.45), y2 - s * Math.sin(a - 0.45)); ctx.lineTo(x2 - s * Math.cos(a + 0.45), y2 - s * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
  };
  /** 텍스트 */
  UW.text = function (ctx, str, x, y, o = {}) {
    ctx.fillStyle = o.color || UW.color("text");
    ctx.font = (o.bold ? "700 " : o.weight ? o.weight + " " : "") + (o.size || 13) + "px " + (o.mono ? UW.color("mono") || "monospace" : UW.font());
    ctx.textAlign = o.align || "left"; ctx.textBaseline = o.base || "middle";
    ctx.fillText(str, x, y);
  };
  UW.font = () => getComputedStyle(document.documentElement).getPropertyValue("--font") || "sans-serif";

  /* ------------------------------------------------------------ theme */
  const themeCbs = [];
  UW.onTheme = (cb) => themeCbs.push(cb);
  UW.isDark = function () {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  };
  /** CSS 변수 값 읽기: UW.color('accent') */
  UW.color = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue("--" + name).trim();
  };
  /** 자주 쓰는 색 묶음 (테마 변경 시 다시 호출할 것) */
  UW.palette = function () {
    const c = UW.color;
    return {
      bg: c("canvas-bg"), text: c("text"), dim: c("text-dim"), faint: c("text-faint"),
      grid: c("grid"), axis: c("axis"), border: c("border"), surface: c("surface"),
      accent: c("accent"), accent2: c("accent-2"), ok: c("ok"), warn: c("warn"), bad: c("bad"),
      red: c("red"), green: c("green"), blue: c("blue"),
      // 데이터 시리즈용 기본 순서
      series: [c("accent"), c("accent-2"), c("warn"), c("ok"), c("bad"), c("text-dim")],
    };
  };
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
    themeCbs.forEach((cb) => { try { cb(); } catch (e) { console.error(e); } });
  }
  // 인쇄: 어두운 테마면 밝게 다시 그리고(캔버스 포함), 끝나면 원래대로
  let printTheme;
  addEventListener("beforeprint", () => { if (printTheme !== undefined) return; printTheme = document.documentElement.getAttribute("data-theme"); if (UW.isDark()) applyTheme("light"); });
  addEventListener("afterprint", () => { if (printTheme !== undefined) { applyTheme(printTheme); printTheme = undefined; } });
  try { const saved = localStorage.getItem("uw-theme"); if (saved) document.documentElement.setAttribute("data-theme", saved); } catch (e) {}
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
      if (!document.documentElement.getAttribute("data-theme")) applyTheme(null);
    });
  }

  /* ------------------------------------------------------------ canvas helper */
  /**
   * HiDPI 캔버스. 폭은 부모 폭을 따르고 높이는 aspect(높이/폭) 또는 height(px)로 결정.
   * draw(ctx, w, h)는 리사이즈·테마 변경 시 자동 호출된다. 애니메이션이면 직접 redraw() 호출.
   *   const cv = UW.canvas(el, (ctx,w,h)=>{...}, {aspect:0.5, maxHeight: 420});
   *   cv.redraw(); cv.ctx; cv.w; cv.h
   */
  UW.canvas = function (canvas, draw, opts = {}) {
    if (typeof canvas === "string") canvas = document.querySelector(canvas);
    const ctx = canvas.getContext("2d");
    const st = { ctx, w: 0, h: 0, canvas, dpr: 1 };
    function resize() {
      const parent = canvas.parentElement;
      const w = Math.max(200, Math.floor(opts.width || parent.clientWidth || 600));
      let h = opts.height || Math.round(w * (opts.aspect || 0.5));
      if (opts.minHeight) h = Math.max(h, opts.minHeight);
      if (opts.maxHeight) h = Math.min(h, opts.maxHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      st.w = w; st.h = h; st.dpr = dpr;
      st.redraw();
    }
    st.redraw = function () {
      if (!st.w) return;
      ctx.save();
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      if (!opts.noClear) {
        ctx.clearRect(0, 0, st.w, st.h);
        ctx.fillStyle = UW.color("canvas-bg");
        ctx.fillRect(0, 0, st.w, st.h);
      }
      try { draw && draw(ctx, st.w, st.h); } finally { ctx.restore(); }
    };
    st.resize = resize;
    if (window.ResizeObserver) {
      let lastW = -1;
      new ResizeObserver(() => { const w = canvas.parentElement.clientWidth; if (w !== lastW) { lastW = w; resize(); } }).observe(canvas.parentElement);
    } else window.addEventListener("resize", resize);
    UW.onTheme(() => st.redraw());
    resize();
    return st;
  };

  /**
   * 화면에 보일 때만 도는 애니메이션 루프. fn(dt초, t초)
   *   const loop = UW.loop(el, (dt,t)=>{...}); loop.stop(); loop.start();
   */
  /** 운영체제의 “동작 줄이기”가 켜져 있으면 저절로 움직이는 그림을 멈춰 두고, 누르면 움직이게 한다 */
  UW.reducedMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  UW.loop = function (el, fn) {
    let raf = 0, last = 0, t = 0, visible = true, running = !UW.reducedMotion();
    function frame(ts) {
      raf = 0;
      if (!running || !visible) return;
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
      last = ts; t += dt;
      fn(dt, t);
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); } }
    if (window.IntersectionObserver && el) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }).observe(el);
    }
    kick();
    if (!running) {
      requestAnimationFrame(() => fn(0, 0)); // 멈춘 첫 장면
      if (el && el.parentNode && !el.parentNode.querySelector(".rm-play")) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "rm-play"; b.textContent = "▶ 움직임 보기";
        b.addEventListener("click", (e) => { e.stopPropagation(); running = !running; b.textContent = running ? "❚❚ 멈추기" : "▶ 움직임 보기"; kick(); });
        el.after(b);
      }
    }
    return {
      start() { running = true; kick(); },
      stop() { running = false; },
      get running() { return running; },
      toggle() { running ? (running = false) : ((running = true), kick()); return running; },
    };
  };

  /* ------------------------------------------------------------ 작은 3D 장면 (상자만, 라이브러리 없음) */
  /**
   * const sc = UW.scene3d("#cv", () => boxes, { yaw, pitch, radius, height, autoRotate, onPick(id), onHover(id) })
   *   box = { id, x, y, z, w, h, d, color, alpha, label, sub }  (x 오른쪽, y 위, z 앞쪽 · x,y,z는 최소 모서리)
   *   드래그로 회전, 클릭으로 선택. sc.redraw(), sc.setView(yaw, pitch), sc.selected
   */
  UW.scene3d = function (canvas, getBoxes, opts = {}) {
    if (typeof canvas === "string") canvas = document.querySelector(canvas);
    const st = { yaw: opts.yaw == null ? -0.65 : opts.yaw, pitch: opts.pitch == null ? 0.5 : opts.pitch, hover: null, selected: opts.selected || null, faces: [], touched: false };
    const rgbCache = {};
    const rgb = (ctx, c) => {
      if (rgbCache[c]) return rgbCache[c];
      ctx.fillStyle = "#000"; ctx.fillStyle = c; const s = ctx.fillStyle;
      let r = 0, g = 0, b = 0;
      if (s[0] === "#") { r = parseInt(s.slice(1, 3), 16); g = parseInt(s.slice(3, 5), 16); b = parseInt(s.slice(5, 7), 16); }
      else { const m = s.match(/[\d.]+/g) || [0, 0, 0]; r = +m[0]; g = +m[1]; b = +m[2]; }
      return (rgbCache[c] = [r, g, b]);
    };
    UW.onTheme(() => { for (const k in rgbCache) delete rgbCache[k]; });
    const view = UW.canvas(canvas, (ctx, w, h) => {
      const P = UW.palette(), boxes = getBoxes() || [];
      const R = opts.radius || 10, D = R * 3.4, f = Math.min(w, h * 1.25) * 1.35 * (opts.zoom || 1);
      const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const c0 = opts.center || [0, 0, 0];
      const tr = (x, y, z) => { x -= c0[0]; y -= c0[1]; z -= c0[2]; const x1 = x * cy + z * sy, z1 = -x * sy + z * cy; const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [x1, y2, z2]; };
      const pr = (p) => { const s = f / (D - p[2]); return [w / 2 + p[0] * s, h * (opts.cyFrac || 0.55) - p[1] * s]; };
      const L = [-0.45, 0.75, 0.5]; const ln = Math.hypot(...L); L[0] /= ln; L[1] /= ln; L[2] /= ln;
      const faces = [];
      boxes.forEach((b) => {
        const X = [b.x, b.x + b.w], Y = [b.y, b.y + b.h], Z = [b.z, b.z + b.d];
        const v = []; for (let i = 0; i < 8; i++) v.push(tr(X[i & 1], Y[(i >> 1) & 1], Z[(i >> 2) & 1]));
        const F = [[0, 2, 6, 4, [-1, 0, 0]], [1, 5, 7, 3, [1, 0, 0]], [0, 4, 5, 1, [0, -1, 0]], [2, 3, 7, 6, [0, 1, 0]], [0, 1, 3, 2, [0, 0, -1]], [4, 6, 7, 5, [0, 0, 1]]];
        F.forEach(([a, bq, c, d, n]) => {
          const nn = tr(n[0] + c0[0], n[1] + c0[1], n[2] + c0[2]); // 방향만 필요
          const ctr = [(v[a][0] + v[c][0]) / 2, (v[a][1] + v[c][1]) / 2, (v[a][2] + v[c][2]) / 2];
          const toCam = [-ctr[0], -ctr[1], D - ctr[2]];
          if (nn[0] * toCam[0] + nn[1] * toCam[1] + nn[2] * toCam[2] <= 0) return;
          const lit = 0.62 + 0.38 * Math.max(0, nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2]);
          faces.push({ b, pts: [v[a], v[bq], v[c], v[d]].map(pr), depth: Math.hypot(toCam[0], toCam[1], toCam[2]), lit, top: n[1] === 1 });
        });
      });
      faces.sort((p, q) => q.depth - p.depth);
      st.faces = faces;
      const hl = st.hover || st.selected;
      faces.forEach((fc) => {
        const [r, g, bb] = rgb(ctx, fc.b.color || P.surface);
        const k = fc.lit * (fc.b.id && fc.b.id === hl ? 1.12 : 1);
        ctx.beginPath(); fc.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        ctx.globalAlpha = fc.b.alpha == null ? 1 : fc.b.alpha;
        ctx.fillStyle = `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, bb * k) | 0})`; ctx.fill();
        ctx.strokeStyle = fc.b.id && fc.b.id === hl ? P.text : "rgba(0,0,0,.18)"; ctx.lineWidth = fc.b.id && fc.b.id === hl ? 1.6 : 0.7; ctx.stroke();
        ctx.globalAlpha = 1;
      });
      // labels (앞쪽이 위에 오도록)
      const compact = opts.compactBelow && w < opts.compactBelow;
      const labs = boxes.filter((b) => b.label && (!compact || b.labelAlways || (b.id && b.id === hl))).map((b) => { const p = tr(b.x + b.w / 2, b.y + b.h, b.z + b.d / 2); return { b, p: pr(p), z: p[2] }; }).sort((a, c) => a.z - c.z);
      ctx.font = "600 12px " + UW.font();
      labs.forEach(({ b, p }) => {
        const tw = ctx.measureText(b.label).width + 12, y = p[1] - (b.labelLift || 14);
        UW.rrect(ctx, p[0] - tw / 2, y - 10, tw, 20, 6); ctx.fillStyle = b.id === hl ? P.accent : "rgba(15,20,35,.72)"; ctx.fill();
        UW.text(ctx, b.label, p[0], y, { align: "center", size: 12, bold: true, color: "#fff" }); ctx.font = "600 12px " + UW.font();
      });
      if (opts.hint && !st.touched) UW.text(ctx, opts.hint, w - 10, h - 12, { align: "right", size: 11.5, color: P.faint });
      if (opts.overlay) opts.overlay(ctx, w, h);
    }, { height: opts.height, aspect: opts.aspect || 0.62, minHeight: opts.minHeight || 260, maxHeight: opts.maxHeight || 460 });
    const pick = (mx, my) => {
      for (let i = st.faces.length - 1; i >= 0; i--) {
        const p = st.faces[i].pts; let inside = false;
        for (let a = 0, b = 3; a < 4; b = a++) { if ((p[a][1] > my) !== (p[b][1] > my) && mx < ((p[b][0] - p[a][0]) * (my - p[a][1])) / (p[b][1] - p[a][1]) + p[a][0]) inside = !inside; }
        if (inside && st.faces[i].b.id) return st.faces[i].b.id;
      }
      return null;
    };
    canvas.style.touchAction = "pan-y"; canvas.style.cursor = "grab";
    let drag = null;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch, moved: false, id: e.pointerId }; });
    canvas.addEventListener("pointermove", (e) => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 4) { if (!drag.moved) { try { canvas.setPointerCapture(drag.id); } catch (er) {} } drag.moved = true; st.touched = true; canvas.style.cursor = "grabbing"; }
        if (drag.moved) { st.yaw = drag.yaw + dx * 0.009; if (e.pointerType === "mouse") st.pitch = UW.clamp(drag.pitch + dy * 0.006, 0.08, 1.35); view.redraw(); }
        return;
      }
      if (e.pointerType !== "mouse") return;
      const [mx, my] = pos(e), id = pick(mx, my);
      if (id !== st.hover) { st.hover = id; canvas.style.cursor = id ? "pointer" : "grab"; view.redraw(); if (opts.onHover) opts.onHover(id); }
    });
    const end = (e) => {
      if (drag && !drag.moved) { const [mx, my] = pos(e); const id = pick(mx, my); st.selected = id; st.touched = true; if (opts.onPick) opts.onPick(id); view.redraw(); }
      drag = null; canvas.style.cursor = st.hover ? "pointer" : "grab";
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", () => { drag = null; });
    canvas.addEventListener("pointerleave", () => { if (!drag && st.hover) { st.hover = null; view.redraw(); } });
    if (opts.autoRotate !== false && !UW.reducedMotion()) UW.loop(canvas, (dt) => { if (st.touched || drag) return; st.yaw += dt * 0.18; view.redraw(); });
    return {
      redraw: () => view.redraw(),
      setView(yaw, pitch) { if (yaw != null) st.yaw = yaw; if (pitch != null) st.pitch = pitch; view.redraw(); },
      stop() { st.touched = true; },
      get selected() { return st.selected; },
      set selected(v) { st.selected = v; view.redraw(); },
    };
  };

  /* ------------------------------------------------------------ chart helper */
  /**
   * 간단한 선 그래프. box = {x,y,w,h}(생략 시 캔버스 전체에 여백 자동)
   * opts: { x:[min,max], y:[min,max], logX, logY, xLabel, yLabel, xTicks, yTicks,
   *         xFmt, yFmt, series:[{data:[[x,y],...], color, width, dash, fill, label}],
   *         vlines:[{x,color,label,dash}], hlines:[{y,color,label,dash}], points:[{x,y,color,r,label}],
   *         bands:[{x0,x1,color}] }
   * 반환: { X(v)->px, Y(v)->px, box }
   */
  UW.chart = function (ctx, box, opts) {
    const P = UW.palette();
    const dpr = (ctx.getTransform && ctx.getTransform().a) || 1;
    const W = ctx.canvas.width / dpr, H = ctx.canvas.height / dpr;
    if (!box) box = { x: 58, y: 16, w: W - 58 - 18, h: H - 16 - 46 };
    const [x0, x1] = opts.x, [y0, y1] = opts.y;
    const lx = (v) => (opts.logX ? Math.log10(v) : v);
    const ly = (v) => (opts.logY ? Math.log10(v) : v);
    const X = (v) => box.x + ((lx(v) - lx(x0)) / (lx(x1) - lx(x0))) * box.w;
    const Y = (v) => box.y + box.h - ((ly(v) - ly(y0)) / (ly(y1) - ly(y0))) * box.h;
    const ticks = (a, b, log, n) => {
      if (log) { const out = []; for (let e = Math.ceil(Math.log10(a) - 1e-9); e <= Math.log10(b) + 1e-9; e++) out.push(Math.pow(10, e)); return out; }
      const span = b - a, raw = span / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= (n || 5) + 0.5) || raw;
      const out = []; for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
      return out;
    };
    const defFmt = (v) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(0).replace("e+", "e") : String(Number(v.toPrecision(4))));
    const xFmt = opts.xFmt || defFmt, yFmt = opts.yFmt || defFmt;
    ctx.save();
    ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--mono");
    ctx.lineWidth = 1;
    // bands
    (opts.bands || []).forEach((b) => { ctx.fillStyle = b.color; ctx.fillRect(X(b.x0), box.y, X(b.x1) - X(b.x0), box.h); });
    // grid + ticks
    const xt = opts.xTicks || ticks(x0, x1, opts.logX, 6);
    const yt = opts.yTicks || ticks(y0, y1, opts.logY, 5);
    ctx.strokeStyle = P.grid; ctx.fillStyle = P.dim;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    xt.forEach((v) => { const px = X(v); if (px < box.x - 1 || px > box.x + box.w + 1) return; ctx.beginPath(); ctx.moveTo(px, box.y); ctx.lineTo(px, box.y + box.h); ctx.stroke(); ctx.fillText(xFmt(v), px, box.y + box.h + 6); });
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    yt.forEach((v) => { const py = Y(v); if (py < box.y - 1 || py > box.y + box.h + 1) return; ctx.beginPath(); ctx.moveTo(box.x, py); ctx.lineTo(box.x + box.w, py); ctx.stroke(); ctx.fillText(yFmt(v), box.x - 6, py); });
    ctx.strokeStyle = P.axis;
    ctx.beginPath(); ctx.moveTo(box.x, box.y); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.stroke();
    // labels
    ctx.fillStyle = P.dim; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font");
    if (opts.xLabel) { ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText(opts.xLabel, box.x + box.w / 2, box.y + box.h + 40); }
    if (opts.yLabel) { ctx.save(); ctx.translate(14, box.y + box.h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    // clip plot area
    ctx.save(); ctx.beginPath(); ctx.rect(box.x, box.y - 2, box.w + 2, box.h + 4); ctx.clip();
    (opts.series || []).forEach((s, i) => {
      if (!s.data || !s.data.length) return;
      ctx.strokeStyle = s.color || P.series[i % P.series.length];
      ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
      ctx.beginPath();
      let started = false;
      s.data.forEach(([x, y]) => { if (!isFinite(y) || (opts.logY && y <= 0) || (opts.logX && x <= 0)) { started = false; return; } const px = X(x), py = Y(y); started ? ctx.lineTo(px, py) : ctx.moveTo(px, py); started = true; });
      ctx.stroke();
      if (s.fill) {
        ctx.lineTo(X(s.data[s.data.length - 1][0]), Y(opts.logY ? y0 : Math.max(y0, 0)));
        ctx.lineTo(X(s.data[0][0]), Y(opts.logY ? y0 : Math.max(y0, 0)));
        ctx.closePath(); ctx.fillStyle = s.fill; ctx.fill();
      }
      ctx.setLineDash([]);
    });
    (opts.vlines || []).forEach((l) => { ctx.strokeStyle = l.color || P.faint; ctx.setLineDash(l.dash || [4, 4]); ctx.lineWidth = l.width || 1.2; ctx.beginPath(); ctx.moveTo(X(l.x), box.y); ctx.lineTo(X(l.x), box.y + box.h); ctx.stroke(); ctx.setLineDash([]); if (l.label) { ctx.fillStyle = l.color || P.dim; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(l.label, X(l.x) + 4, box.y + 4); } });
    (opts.hlines || []).forEach((l) => { ctx.strokeStyle = l.color || P.faint; ctx.setLineDash(l.dash || [4, 4]); ctx.lineWidth = l.width || 1.2; ctx.beginPath(); ctx.moveTo(box.x, Y(l.y)); ctx.lineTo(box.x + box.w, Y(l.y)); ctx.stroke(); ctx.setLineDash([]); if (l.label) { ctx.fillStyle = l.color || P.dim; ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(l.label, box.x + box.w - 4, Y(l.y) - 3); } });
    (opts.points || []).forEach((p) => { ctx.fillStyle = p.color || P.accent; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.r || 4, 0, Math.PI * 2); ctx.fill(); if (p.label) { ctx.fillStyle = P.text; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText(p.label, X(p.x) + 6, Y(p.y) - 4); } });
    ctx.restore();
    ctx.restore();
    return { X, Y, box };
  };

  /* ------------------------------------------------------------ controls */
  /**
   * range 입력 바인딩. output은 id+"-out" 요소 또는 <output for=id>.
   *   const get = UW.range('wl', v => v+' nm', v => redraw());  get() → 현재 값(Number)
   */
  UW.range = function (id, fmt, onInput) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    const out = document.getElementById(el.id + "-out") || document.querySelector(`output[for="${el.id}"]`);
    const update = (fire) => {
      const v = Number(el.value);
      const pct = ((v - Number(el.min || 0)) / (Number(el.max || 100) - Number(el.min || 0))) * 100;
      el.style.setProperty("--fill", pct + "%");
      if (out) out.textContent = fmt ? fmt(v) : String(v);
      if (fire && onInput) onInput(v);
    };
    el.addEventListener("input", () => update(true));
    update(false);
    const get = () => Number(el.value);
    get.set = (v) => { el.value = v; update(true); };
    get.el = el;
    return get;
  };
  /**
   * 세그먼트 버튼: <div class="seg" id="mode"><button data-value="a" class="on">A</button>...</div>
   *   const mode = UW.seg('mode', v => redraw());  mode() → 현재 값
   */
  UW.seg = function (id, onChange) {
    const el = typeof id === "string" ? document.getElementById(id) : id;
    const btns = [...el.querySelectorAll("button")];
    let cur = (btns.find((b) => b.classList.contains("on")) || btns[0]).dataset.value;
    const set = (v, fire = true) => {
      cur = v;
      btns.forEach((b) => { const on = b.dataset.value === v; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
      if (fire && onChange) onChange(v);
    };
    btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.value)));
    set(cur, false);
    const get = () => cur;
    get.set = set;
    return get;
  };
  /** 키보드로 캔버스 조작(마우스로 누르는 일과 같은 일). 캔버스에 초점을 주고
   *  화살표 = move(dx, dy, 크게?) · Enter·Space = activate() · N = next() 를 부른다. say()가 돌려준 문구를 화면 낭독기가 읽는다.
   *  UW.keys(cv.canvas, { move, activate, next, say, hint: "키보드: 화살표로 태그 옮기기" }) */
  UW.keys = function (canvas, opts) {
    canvas.tabIndex = 0;
    const hint = opts.hint || "키보드: 화살표로 옮기기";
    canvas.dataset.kbHint = hint;
    if (canvas.getAttribute("aria-label")) canvas.setAttribute("aria-label", canvas.getAttribute("aria-label") + " · " + hint);
    let live = null;
    const say = () => {
      if (!opts.say) return;
      if (!live) { live = document.createElement("p"); live.className = "sr-only"; live.setAttribute("aria-live", "polite"); canvas.after(live); }
      live.textContent = opts.say();
    };
    canvas.addEventListener("keydown", (e) => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (d && opts.move) opts.move(d[0], d[1], e.shiftKey);
      else if ((e.key === "Enter" || e.key === " ") && opts.activate) opts.activate();
      else if ((e.key === "n" || e.key === "N") && opts.next) opts.next();
      else return;
      e.preventDefault(); say();
    });
    ["focus", "blur"].forEach((ev) => canvas.addEventListener(ev, () => opts.onFocus && opts.onFocus(ev === "focus")));
  };
  /** 통계 표시: UW.stat('snr', '32.1 dB') → id 요소의 textContent 설정(HTML 허용) */
  UW.stat = function (id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; };


  /* ------------------------------------------------------------ 학습 진도 (브라우저에만 저장) */
  const PKEY = "uw-progress-v1";
  UW.progress = {
    load() { try { return JSON.parse(localStorage.getItem(PKEY)) || { ch: {} }; } catch (e) { return { ch: {} }; } },
    save(d) { try { localStorage.setItem(PKEY, JSON.stringify(d)); } catch (e) {} },
    get(slug) { return this.load().ch[slug] || null; },
    update(slug, fn) { const d = this.load(); d.ch = d.ch || {}; const c = (d.ch[slug] = d.ch[slug] || { pct: 0 }); fn(c, d); this.save(d); return c; },
    last() { return this.load().last || null; },
    reset() { try { localStorage.removeItem(PKEY); } catch (e) {} },
    doneCount() { const ch = this.load().ch || {}; return CHAPTERS.filter((c) => ch[c.slug] && ch[c.slug].done).length; },
  };
  /* ------------------------------------------------------------ layout build */
  const LOGO = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="uwg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="8" fill="url(#uwg)"/><g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17h4l2-8 3 14 3-11 2 5h6"/></g></svg>`;
  /** 같은 시리즈의 책들(book.json ui.series). 없으면 null */
  const SERIES = null;
  const ICON_MENU = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
  const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`;
  const ICON_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;

  function build() {
    const body = document.body;
    const root = body.dataset.root != null ? body.dataset.root : body.dataset.chapter ? "../" : "";
    const curSlug = body.dataset.chapter || "";
    const href = (slug) => (slug ? `${root}chapters/${slug}.html` : `${root}index.html`);

    // top bar
    const bar = document.createElement("header");
    bar.className = "sb-topbar";
    bar.innerHTML = `
      <button class="sb-btn icon" id="sb-menu" aria-label="챕터 목록">${ICON_MENU}</button>
      <a class="sb-logo" href="${href("")}">${LOGO}<span>UWBBook <small>UWB 교과서</small></span></a>
      <span class="spacer"></span>
      <a class="sb-btn series-link" href="${root}../index.html" aria-label="ConnectivityBook 서재로" title="ConnectivityBook 서재로"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h6v14H4zM10 5.5h6v14h-6zM17 7l3-1 2 13-3 1z"/></svg><span>서재</span></a>
      <button class="sb-btn icon" id="sb-theme" aria-label="테마 전환"></button>
      <div class="sb-progress" id="sb-progress"></div>`;
    body.prepend(bar);
    // series switch (입문편 | 심화편): 위쪽 막대와 장 목록 서랍 맨 위에 둔다
    const seriesNav = () => {
      if (!SERIES) return null;
      const nav = document.createElement("nav");
      nav.className = "sb-series";
      nav.setAttribute("aria-label", SERIES.name);
      nav.innerHTML = SERIES.items.map((it) => it.dir === "uwb" ? `<a href="${href("")}" class="on" aria-current="true">${it.label}</a>` : `<a href="${root}../${it.dir}/index.html">${it.label}</a>`).join("");
      return nav;
    };

    // Search chapter metadata immediately; load section and visual titles on demand.
    const progressBar = bar.querySelector("[id$='-progress']");
    const spacer = bar.querySelector(".spacer");
    const leftNav = document.createElement("div");
    leftNav.className = "book-nav-left";
    leftNav.append(bar.querySelector("[id$='-menu']"), bar.querySelector("a[class$='-logo']"));
    const topSeries = seriesNav();
    if (topSeries) { topSeries.classList.add("in-bar"); leftNav.append(topSeries); }
    const rightNav = document.createElement("div");
    rightNav.className = "book-nav-right";
    [...bar.children].filter((el) => el !== spacer && el !== progressBar).forEach((el) => rightNav.appendChild(el));
    spacer.remove();
    const search = document.createElement("div");
    search.className = "book-search";
    search.innerHTML = '<svg class="book-search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg><input type="search" aria-label="이 책의 챕터, 섹션, 시뮬레이터, 그림 검색" placeholder="이 책 검색" autocomplete="off"><div class="book-search-results" aria-live="polite"></div>';
    bar.prepend(leftNav);
    bar.insertBefore(search, progressBar);
    bar.insertBefore(rightNav, progressBar);
    const searchInput = search.querySelector("input");
    const searchResults = search.querySelector(".book-search-results");
    const closeSearch = () => { search.classList.remove("open"); searchResults.replaceChildren(); };
    let detailEntries = [];
    let detailsLoaded = false;
    let detailPromise;
    function loadDetails() {
      if (detailPromise) return detailPromise;
      detailPromise = Promise.all(CHAPTERS.map(async (chapter) => {
        try {
          const response = await fetch(href(chapter.slug));
          if (!response.ok) return [];
          const doc = new DOMParser().parseFromString(await response.text(), "text/html");
          const main = doc.querySelector("main.chapter");
          if (!main) return [];
          const entries = [];
          [...main.querySelectorAll("section > h2")].forEach((heading, i) => {
            entries.push({ type: "섹션", title: heading.textContent.trim(), chapter, hash: heading.parentElement.id || `s${i + 1}` });
          });
          [...main.querySelectorAll(".sim")].filter((sim) => sim.querySelector(".sim-head h3")).forEach((sim, i) => {
            entries.push({ type: "시뮬레이터", title: sim.querySelector(".sim-head h3").textContent.trim(), chapter, hash: sim.id || `search-sim-${i + 1}` });
          });
          [...main.querySelectorAll("figure")].filter((figure) => figure.querySelector("figcaption")).forEach((figure, i) => {
            const caption = figure.querySelector("figcaption").textContent.replace(/\s+/g, " ").trim();
            entries.push({ type: "그림", title: caption.slice(0, 140), chapter, hash: figure.id || `search-fig-${i + 1}` });
          });
          return entries;
        } catch (error) { return []; }
      })).then((parts) => { detailEntries = parts.flat(); detailsLoaded = true; renderSearch(); });
      return detailPromise;
    }
    function renderSearch() {
      const words = searchInput.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
      searchResults.replaceChildren();
      if (!words.length) { closeSearch(); return; }
      const includesWords = (value) => words.every((word) => value.toLocaleLowerCase().includes(word));
      const chapterMatches = CHAPTERS.filter((c) => includesWords([c.num, c.title, c.desc, ...(c.tags || [])].join(" ")))
        .map((c) => ({ type: "챕터", title: c.title, chapter: c, hash: "" }));
      const detailMatches = detailEntries.filter((entry) => includesWords(entry.title));
      const matches = [
        ...chapterMatches.slice(0, 4),
        ...detailMatches.filter((entry) => entry.type === "섹션").slice(0, 5),
        ...detailMatches.filter((entry) => entry.type === "시뮬레이터").slice(0, 4),
        ...detailMatches.filter((entry) => entry.type === "그림").slice(0, 4),
      ];
      matches.forEach((entry) => {
        const link = document.createElement("a");
        link.href = href(entry.chapter.slug) + (entry.hash ? `#${entry.hash}` : "");
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const context = document.createElement("small");
        context.textContent = `${entry.chapter.num} · ${entry.chapter.title} · ${entry.type}`;
        link.append(title, context);
        searchResults.appendChild(link);
      });
      if (chapterMatches.length + detailMatches.length > matches.length) {
        const more = document.createElement("p");
        more.textContent = `상위 ${matches.length}개 표시 · 검색어를 더 구체적으로 입력해 보세요`;
        searchResults.appendChild(more);
      }
      if (detailPromise && !detailsLoaded) {
        const status = document.createElement("p");
        status.textContent = "섹션·시뮬레이터·그림 목록을 불러오는 중…";
        searchResults.appendChild(status);
      } else if (!matches.length) {
        const empty = document.createElement("p");
        empty.textContent = "검색 결과가 없습니다";
        searchResults.appendChild(empty);
      }
      search.classList.add("open");
    }
    searchInput.addEventListener("input", () => { if (searchInput.value.trim()) loadDetails(); renderSearch(); });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeSearch(); searchInput.blur(); }
      else if (e.key === "ArrowDown") { const first = searchResults.querySelector("a"); if (first) { e.preventDefault(); first.focus(); } }
      else if (e.key === "Enter") { const first = searchResults.querySelector("a"); if (first) { e.preventDefault(); first.click(); } }
    });
    searchResults.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeSearch(); searchInput.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const links = [...searchResults.querySelectorAll("a")];
        const next = links.indexOf(document.activeElement) + (e.key === "ArrowDown" ? 1 : -1);
        e.preventDefault();
        (links[next] || searchInput).focus();
      }
    });
    document.addEventListener("pointerdown", (e) => { if (!search.contains(e.target)) closeSearch(); });


    // drawer
    const drawer = document.createElement("nav");
    drawer.className = "sb-drawer";
    let lastPart = "";
    drawer.innerHTML = `<h4>Chapters</h4><ul class="sb-chlist">
      <li><a href="${href("")}" class="${curSlug ? "" : "active"}"><span class="num">00</span><span>홈 · 로드맵</span></a></li>
      ${CHAPTERS.map((c) => { const head = c.part !== lastPart ? `<li class="part">${c.part}</li>` : ""; lastPart = c.part; return head + `<li><a href="${href(c.slug)}" data-slug="${c.slug}" class="${c.slug === curSlug ? "active" : ""}"><span class="num">${c.num}</span><span class="t">${c.title}</span><i class="sb-st"></i></a></li>`; }).join("")}
    </ul>`;
    const drawerSeries = seriesNav();
    if (drawerSeries) drawer.prepend(drawerSeries);
    const backdrop = document.createElement("div");
    backdrop.className = "sb-drawer-backdrop";
    body.append(backdrop, drawer);
    const toggleDrawer = (o) => body.classList.toggle("drawer-open", o);
    bar.querySelector("#sb-menu").addEventListener("click", () => toggleDrawer(true));
    backdrop.addEventListener("click", () => toggleDrawer(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleDrawer(false); });

    // theme toggle
    const tbtn = bar.querySelector("#sb-theme");
    const setIcon = () => (tbtn.innerHTML = UW.isDark() ? ICON_SUN : ICON_MOON);
    setIcon();
    tbtn.addEventListener("click", () => {
      const next = UW.isDark() ? "light" : "dark";
      try { localStorage.setItem("uw-theme", next); } catch (e) {}
      applyTheme(next); setIcon();
    });

    // progress
    const prog = bar.querySelector("#sb-progress");
    const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%"; };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // chapter page extras
    const main = document.querySelector("main.chapter");
    if (main) {
      // 이 장과 이어진 영상(서재의 assets/videos.js)이 있으면 핵심 정리 앞에 "영상으로 보기" 상자를 붙인다
      const vs = document.createElement("script");
      vs.src = `${root}../assets/videos.js`;
      vs.onload = () => {
        const here = `uwb/chapters/${curSlug}.html`, q = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        const list = (window.YB_VIDEOS || []).filter((v) => (v.chapters || []).some((c) => c.path === here));
        if (!list.length || main.querySelector(".video-callout")) return;
        const box = document.createElement("div");
        box.className = "callout related video-callout";
        box.innerHTML = `<strong>영상으로 보기</strong><ul>${list.map((v) => `<li><a href="https://www.youtube.com/watch?v=${q(v.youtube)}" target="_blank" rel="noopener">${q(v.title)}</a> — ${q(v.subtitle)} (${q(v.duration)}, 유튜브)</li>`).join("")}</ul>`;
        const kp = main.querySelector(".keypoints");
        kp ? kp.parentNode.insertBefore(box, kp) : main.appendChild(box);
      };
      document.head.appendChild(vs);
      // Give search results stable anchors even when the source has no id.
      [...main.querySelectorAll(".sim")].filter((sim) => sim.querySelector(".sim-head h3")).forEach((sim, i) => { if (!sim.id) sim.id = `search-sim-${i + 1}`; });
      [...main.querySelectorAll("figure")].filter((figure) => figure.querySelector("figcaption")).forEach((figure, i) => { if (!figure.id) figure.id = `search-fig-${i + 1}`; });
      if (/^#(?:s\d+|search-(?:sim|fig)-)/.test(location.hash)) {
        requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
      }
      // numbered h2 + TOC
      const layout = document.createElement("div");
      layout.className = "sb-layout";
      main.parentNode.insertBefore(layout, main);
      layout.appendChild(main);
      const toc = document.createElement("aside");
      toc.className = "sb-toc";
      const h2s = [...main.querySelectorAll("section > h2")];
      let n = 0;
      toc.innerHTML = "<h4>ON THIS PAGE</h4>" + h2s.map((h, i) => {
        const sec = h.parentElement;
        if (!sec.id) sec.id = "s" + (i + 1);
        const numbered = !sec.classList.contains("keypoints") && !sec.classList.contains("quiz-sec") && !sec.hasAttribute("data-nonum");
        if (numbered && !h.querySelector(".h-num")) { n++; h.insertAdjacentHTML("afterbegin", `<span class="h-num">${String(n).padStart(2, "0")}</span>`); }
        return `<a href="#${sec.id}">${h.textContent.replace(/^\d\d/, "").trim()}</a>`;
      }).join("");
      layout.appendChild(toc);
      const links = [...toc.querySelectorAll("a")];
      if (window.IntersectionObserver && h2s.length) {
        const io = new IntersectionObserver((es) => {
          es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); } });
        }, { rootMargin: "-20% 0px -70% 0px" });
        h2s.forEach((h) => io.observe(h.parentElement));
      }

      // pager
      const idx = CHAPTERS.findIndex((c) => c.slug === curSlug);
      const prev = idx > 0 ? CHAPTERS[idx - 1] : null;
      const next = idx >= 0 && idx < CHAPTERS.length - 1 ? CHAPTERS[idx + 1] : null;
      const pager = document.createElement("nav");
      pager.className = "sb-pager";
      pager.innerHTML =
        (prev ? `<a class="prev" href="${href(prev.slug)}"><small>← 이전 · ${prev.num}</small>${prev.title}</a>` : `<a class="prev" href="${href("")}"><small>← 처음으로</small>홈 · 로드맵</a>`) +
        (next ? `<a class="next" href="${href(next.slug)}"><small>다음 · ${next.num} →</small>${next.title}</a>` : "");
      layout.after(pager);
      // 오류 제보: 장 주소와 제목을 채운 GitHub 이슈를 연다(사실 정확성이 이 책의 1순위다)
      const ch = CHAPTERS[idx];
      if (ch && main) {
        const title = `[UWBBook ${ch.num}장] `, bodyTxt = `페이지: ${location.href.split("#")[0]}\n위치(절 제목이나 문장):\n\n무엇이 틀렸나요:\n\n근거(사양서 절, 링크 등, 있으면):\n`;
        const rep = document.createElement("aside");
        rep.className = "sb-report";
        rep.innerHTML = `틀린 곳이나 헷갈리는 설명을 찾았나요? <a href="https://github.com/yalex-kim/connectivityBook/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(bodyTxt)}&labels=${encodeURIComponent("오류 제보")}" target="_blank" rel="noopener">이 장의 오류 제보하기</a> (GitHub 이슈)`;
        main.appendChild(rep);
      }
    }
    const foot = document.createElement("footer");
    foot.className = "sb-foot";
    foot.innerHTML = `UWBBook — 누구나 읽는 인터랙티브 UWB 교과서 · IEEE 802.15.4z·FiRa 원문 대신 공개 구현(Android·Zephyr·Decawave)과 공개 법령으로 확인한 값을 씁니다 · 시뮬레이터는 이해를 돕기 위해 단순화한 모델입니다.
      <br>© 2026 <a href="https://github.com/yalex-kim">Yalex Kim</a> · <a href="${root}../index.html">ConnectivityBook 서재</a> ·
      콘텐츠 <a href="https://creativecommons.org/licenses/by/4.0/deed.ko" rel="license">CC BY 4.0</a> ·
      코드 <a href="https://github.com/yalex-kim/connectivityBook/blob/main/uwb/LICENSE-MIT">MIT</a> ·
      <a href="https://github.com/yalex-kim/connectivityBook/blob/main/uwb/LICENSE.md">라이선스 안내</a>`;
    body.appendChild(foot);

    // quiz
    document.querySelectorAll(".quiz-q").forEach((q) => {
      const opts = [...q.querySelectorAll("button.opt")];
      opts.forEach((b) => b.addEventListener("click", () => {
        opts.forEach((o) => { o.disabled = true; if (o.hasAttribute("data-correct")) o.classList.add("right"); });
        if (!b.hasAttribute("data-correct")) b.classList.add("wrong");
        q.classList.add("done");
        const exp = q.querySelector(".quiz-exp");
        if (exp) { exp.setAttribute("aria-live", "polite"); exp.querySelector(".sr-only")?.remove(); exp.insertAdjacentHTML("afterbegin", `<span class="sr-only">${b.hasAttribute("data-correct") ? "정답입니다." : "아쉽지만 틀렸습니다. 정답은 " + (opts.find((o) => o.hasAttribute("data-correct"))?.textContent.trim() || "") + "."} </span>`); }
        q.dispatchEvent(new CustomEvent("answered", { bubbles: true, detail: { correct: b.hasAttribute("data-correct") } }));
      }));
    });

    // 접근성: 그림을 그리는 캔버스에 이름을 붙이고, 버튼 묶음은 그룹으로, 결과 수치는 조작한 뒤부터 화면 낭독기가 읽게 한다
    document.querySelectorAll("canvas").forEach((cv) => {
      if (cv.hasAttribute("aria-label") || cv.getAttribute("aria-hidden") === "true") return;
      const box = cv.closest(".sim, figure, .hero-3d"), title = box && box.querySelector("h3, figcaption, .hint");
      const ro = box && box.classList.contains("sim") && box.querySelector(".sim-readout");
      cv.setAttribute("role", "img");
      cv.setAttribute("aria-label", (title ? title.textContent.trim() : "그림") + (ro ? " — 주요 결과는 아래 수치로 읽을 수 있다" : "") + (cv.dataset.kbHint ? " · " + cv.dataset.kbHint : ""));
    });
    document.querySelectorAll(".seg").forEach((g) => {
      if (g.hasAttribute("role")) return;
      g.setAttribute("role", "group");
      const lab = g.previousElementSibling;
      if (lab && lab.tagName === "SPAN") g.setAttribute("aria-label", lab.textContent.trim());
    });
    // 누르면 동작하는 표의 줄·그림 조각(tr[data-i], svg .ly, [data-kb])은 Tab으로 가서 Enter·Space로 누를 수 있게 한다(다시 그려져도)
    const KB = "tr[data-i], svg .ly, [data-kb]";
    const kbMark = (root) => root.querySelectorAll && root.querySelectorAll(KB).forEach((el) => { if (!el.hasAttribute("tabindex")) { el.setAttribute("tabindex", "0"); el.setAttribute("role", "button"); } });
    kbMark(document);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches(KB)) kbMark(n.parentNode); kbMark(n); } }))).observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest && e.target.closest(KB); if (!el || el !== e.target) return;
      e.preventDefault();
      const host = el.parentNode && el.parentNode.closest("[id]"), i = el.dataset.i, k = el.dataset.k;
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      // 누른 뒤 표가 다시 그려지면 같은 줄로 초점을 돌려놓는다
      if (!el.isConnected && host) { kbMark(host); const again = host.querySelector(i != null ? `tr[data-i="${i}"]` : k != null ? `[data-k="${k}"]` : KB); if (again) again.focus(); }
    });
    document.querySelectorAll(".sim").forEach((sim) => {
      const ro = sim.querySelector(".sim-readout"); if (!ro) return;
      ro.setAttribute("role", "group"); ro.setAttribute("aria-label", "결과");
      const live = () => ro.setAttribute("aria-live", "polite");
      sim.addEventListener("input", live, { once: true }); sim.addEventListener("click", live, { once: true });
    });


    // 학습 진도: 읽은 비율, 마지막 섹션, 퀴즈 답
    const paintDrawer = () => {
      const ch = UW.progress.load().ch || {};
      drawer.querySelectorAll("a[data-slug]").forEach((a) => {
        const c = ch[a.dataset.slug], st = a.querySelector(".sb-st");
        st.className = "sb-st" + (c && c.done ? " done" : c && c.pct > 2 ? " part" : "");
        st.style.setProperty("--p", (c ? Math.round(c.pct) : 0) + "%");
        st.title = c && c.done ? "다 읽음" : c && c.pct > 2 ? `${Math.round(c.pct)}% 읽음` : "";
      });
    };
    paintDrawer();
    if (main && curSlug) {
      const secs = [...main.querySelectorAll("section[id]")];
      const quizQs = [...main.querySelectorAll(".quiz-q")];
      const saved = UW.progress.get(curSlug);
      // 지난 퀴즈 답 복원
      if (saved && saved.ans) {
        quizQs.forEach((q, qi) => {
          const pick = saved.ans[qi]; if (pick == null) return;
          const opts = [...q.querySelectorAll("button.opt")]; const b = opts[pick]; if (!b) return;
          opts.forEach((o) => { o.disabled = true; if (o.hasAttribute("data-correct")) o.classList.add("right"); });
          if (!b.hasAttribute("data-correct")) b.classList.add("wrong");
          q.classList.add("done");
        });
        const qs = main.querySelector(".quiz-sec .quiz");
        if (qs && Object.keys(saved.ans).length) {
          const bar = document.createElement("div"); bar.className = "quiz-restore";
          bar.innerHTML = `<span>지난번에 푼 답을 불러왔습니다.</span><button class="btn" type="button">다시 풀기</button>`;
          bar.querySelector("button").onclick = () => {
            UW.progress.update(curSlug, (c) => { c.ans = {}; });
            quizQs.forEach((q) => { q.classList.remove("done"); q.querySelectorAll("button.opt").forEach((o) => { o.disabled = false; o.classList.remove("right", "wrong"); }); });
            bar.remove();
          };
          qs.before(bar);
        }
      }
      quizQs.forEach((q, qi) => {
        const opts = [...q.querySelectorAll("button.opt")];
        opts.forEach((b, bi) => b.addEventListener("click", () => UW.progress.update(curSlug, (c) => { c.ans = c.ans || {}; c.ans[qi] = bi; })));
      });
      // 읽은 위치 기록
      let tmr = 0;
      const record = () => {
        tmr = 0;
        const h = document.documentElement.scrollHeight - innerHeight;
        const pct = h > 0 ? Math.min(100, (scrollY / h) * 100) : 100;
        let sec = null; for (const s of secs) { if (s.getBoundingClientRect().top < innerHeight * 0.35) sec = s.id; }
        UW.progress.update(curSlug, (c, d) => {
          c.pct = Math.max(c.pct || 0, pct); c.t = Date.now();
          if (sec) c.sec = sec;
          if (c.pct >= 92) c.done = true;
          d.last = { slug: curSlug, sec: c.sec || null, t: c.t };
        });
        paintDrawer();
      };
      addEventListener("scroll", () => { if (!tmr) tmr = setTimeout(record, 600); }, { passive: true });
      setTimeout(record, 1500);
      // 이어 읽기 안내
      if (saved && saved.sec && !location.hash && !saved.done && secs.length && saved.sec !== secs[0].id) {
        const target = document.getElementById(saved.sec);
        if (target) {
          const h = target.querySelector("h2");
          const toast = document.createElement("div"); toast.className = "sb-resume";
          toast.innerHTML = `<span>지난번에 <b>${(h ? h.textContent.replace(/^\d\d/, "") : "").trim()}</b>까지 읽었어요.</span><button class="btn primary" type="button">이어 읽기</button><button class="x" type="button" aria-label="닫기">×</button>`;
          const close = () => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); };
          toast.querySelector(".primary").onclick = () => { target.scrollIntoView({ behavior: UW.reducedMotion() ? "auto" : "smooth" }); close(); };
          toast.querySelector(".x").onclick = close;
          body.appendChild(toast); requestAnimationFrame(() => toast.classList.add("show"));
          setTimeout(close, 12000);
        }
      }
    }

    // 사양 인용 → Bluetooth Core 사양서 웹판의 그 절 (주소표 assets/bt-spec.js, 규칙은 tools/spec_links.py와 같다)
    // 본문·툴팁은 "[Vol 6] Part B §2.4"(뒤에 ·§2.5, ~§2.6 이어 쓰기 포함)만, 출처 줄(.spec-ref)은 앞의 권·Part를 이어 쓰는 "§4.5.13.5", "Part E §2.4"도 잇는다
    let specLink = null;
    if (main && /\[Vol \d\] Part [A-Z]/.test(main.textContent)) {
      const TOK = /(?:\[Vol (\d)\] )?Part ([A-Z]+)\b|(?<![0-9A-Za-z])§([0-9A-Z]+(?:\.[0-9A-Z]+)*)/g;
      const SKIP = "a, code, pre, script, style, svg, button, input, textarea, .sim, .spec-ref";
      const walk = (root, ref) => {
        const D = window.BT_SPEC, st = { vol: null, key: null };
        const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => { const c = n.parentElement.closest(SKIP); return c && c !== root ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
        const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
        for (const n of nodes) {
          const t = n.data, toks = []; let chain = null;
          for (const m of t.matchAll(TOK)) {
            const s0 = m.index, e0 = s0 + m[0].length;
            if (m[2]) {
              if (m[1]) st.vol = m[1]; else if (!ref) { chain = null; continue; }
              st.key = st.vol ? st.vol + m[2] : null; chain = st.key && { end: e0 };
              if (st.key) toks.push({ s: s0, e: e0, key: st.key, sec: null });
            } else if (ref ? st.key : chain && /^\s*[·~]?\s*$/.test(t.slice(chain.end, s0))) {
              const prev = toks[toks.length - 1];
              // "Part B §2.4"는 링크 하나로
              if (prev && !prev.sec && /^\s*$/.test(t.slice(prev.e, s0))) { prev.e = e0; prev.sec = m[3]; } else toks.push({ s: s0, e: e0, key: st.key, sec: m[3] });
              if (chain) chain.end = e0;
            }
          }
          const ok = toks.filter((k) => D.parts[k.key]);
          if (!ok.length) continue;
          const f = document.createDocumentFragment(); let at = 0;
          for (const k of ok) {
            const P = D.parts[k.key], a = document.createElement("a");
            f.append(t.slice(at, k.s));
            a.className = "spec-link"; a.target = "_blank"; a.rel = "noopener"; a.textContent = t.slice(k.s, k.e);
            a.href = D.base + P.p + (k.sec && P.s[k.sec] ? "#UUID-" + P.s[k.sec] : "");
            a.title = `Bluetooth Core ${D.v} 사양서에서 보기`;
            f.append(a); at = k.e;
          }
          f.append(t.slice(at)); n.replaceWith(f);
        }
      };
      const all = (root) => { root.querySelectorAll(".spec-ref").forEach((el) => walk(el, true)); walk(root, false); };
      const go = () => {
        specLink = (el) => walk(el, false);
        all(main);
        // 용어집처럼 나중에 그려지는 내용도 잇는다
        const mo = new MutationObserver((ms) => {
          mo.disconnect();
          ms.forEach((m) => m.addedNodes.forEach((x) => { if (x.nodeType === 1 && x.isConnected && !x.closest("a, .sim, svg")) x.matches(".spec-ref") ? walk(x, true) : all(x); }));
          mo.observe(main, { childList: true, subtree: true });
        });
        mo.observe(main, { childList: true, subtree: true });
      };
      if (window.BT_SPEC) go();
      else { const sc = document.createElement("script"); sc.src = `${root}../assets/bt-spec.js`; sc.onload = go; document.head.appendChild(sc); }
    }

    // 용어 툴팁: 본문의 .term에 용어집 설명을 붙인다
    if (main && curSlug !== "glossary" && main.querySelector(".term")) {
      const bind = () => {
        const T = window.UW_TERMS, AL = window.UW_TERM_ALIAS || {};
        if (!T) return;
        const norm = (x) => x.replace(/\s+/g, "").toLowerCase();
        const idx = new Map();
        const put = (k, t) => { k = norm(k); if (!k) return; const l = idx.get(k) || []; if (!l.includes(t)) l.push(t); idx.set(k, l); };
        T.forEach((t) => { [t[0], t[0].replace(/\(.*?\)/g, ""), t[1], t[1].replace(/\(.*?\)/g, "")].forEach((k) => put(k, t)); t[0].split(/[\/·]/).forEach((k) => put(k, t));
          // 영문 이름의 약어: "Channel Sounding (CS)", "ISI, Inter-Symbol ..." (tools/mark_terms.py와 같은 규칙)
          for (const m of t[1].matchAll(/\(([A-Z][A-Za-z0-9]*[A-Z0-9])\)|^([A-Z][A-Za-z0-9]*[A-Z0-9]),/g)) put(m[1] || m[2], t); });
        const find = (txt) => { const a = AL[txt.trim()]; const l = idx.get(norm(a || txt)); if (!l) return null; return l.find((t) => t[3] === curSlug) || l[0]; };
        const tip = document.createElement("div"); tip.className = "sb-tip"; tip.id = "sb-tip"; tip.setAttribute("role", "tooltip"); body.appendChild(tip);
        let cur = null, hideT = 0;
        const esc = (x) => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        let shownAt = 0;
        const show = (el, t) => {
          if (cur !== el || !tip.classList.contains("show")) shownAt = Date.now();
          clearTimeout(hideT); cur = el;
          const c = CHAPTERS.find((x) => x.slug === t[3]);
          tip.innerHTML = `<div class="tt-h"><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div><p>${esc(t[2])}</p><div class="tt-l">` +
            (c && c.slug !== curSlug ? `<a href="${href(c.slug)}">${c.num}장 ${esc(c.title)}에서 자세히 →</a>` : "") +
            `<a href="${href("glossary")}?q=${encodeURIComponent(t[0].replace(/\(.*?\)/g, ""))}">용어집</a></div>`;
          if (specLink) specLink(tip.querySelector("p"));
          tip.classList.add("show"); el.setAttribute("aria-describedby", "sb-tip");
          const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
          let x = Math.max(12, Math.min(innerWidth - tw - 12, r.left + r.width / 2 - tw / 2));
          let y = r.top - th - 10; if (y < 70) y = r.bottom + 10;
          tip.style.left = x + "px"; tip.style.top = y + "px";
        };
        const hide = (now) => { clearTimeout(hideT); hideT = setTimeout(() => { tip.classList.remove("show"); if (cur) cur.removeAttribute("aria-describedby"); cur = null; }, now ? 0 : 220); };
        tip.addEventListener("mouseenter", () => clearTimeout(hideT));
        tip.addEventListener("mouseleave", () => hide());
        main.querySelectorAll(".term").forEach((el) => {
          const t = find(el.textContent); if (!t) return;
          el.classList.add("has-tip"); el.tabIndex = 0;
          // 올리기·떠나기는 마우스일 때만. 터치는 탭 뒤에 가짜 mouseleave가 와서 바로 닫혔다
          el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(el, t); });
          el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
          el.addEventListener("focus", () => show(el, t));
          el.addEventListener("blur", () => hide());
          // 탭 한 번에 mouseenter·focus·click이 이어 오므로, 방금 연 툴팁은 click으로 닫지 않는다
          el.addEventListener("click", (e) => { e.stopPropagation();
            cur === el && tip.classList.contains("show") && Date.now() - shownAt > 500 ? hide(true) : show(el, t); });
        });
        document.addEventListener("click", (e) => { if (!tip.contains(e.target)) hide(true); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(true); });
        addEventListener("scroll", () => { if (cur) hide(true); }, { passive: true });
      };
      if (window.UW_TERMS) bind();
      else { const sc = document.createElement("script"); sc.src = root + "js/terms.js"; sc.onload = bind; document.head.appendChild(sc); }
    }

    // KaTeX
    const renderMath = () => {
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }, { left: "\\[", right: "\\]", display: true }],
          throwOnError: false,
          ignoredClasses: ["no-math"],
        });
      }
    };
    if (window.renderMathInElement) renderMath();
    else window.addEventListener("load", renderMath);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();

// Simulator deep links: add a shareable # link to each simulator heading.
(function () {
  function addSimulatorLinks() {
    document.querySelectorAll(".sim[id] > .sim-head").forEach((head) => {
      if (head.querySelector(".sim-link")) return;
      const link = document.createElement("a");
      link.className = "sim-link";
      link.href = "#" + head.parentElement.id;
      link.textContent = "#";
      link.title = "이 시뮬레이터로 가는 링크";
      link.setAttribute("aria-label", "이 시뮬레이터로 가는 링크");
      head.appendChild(link);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addSimulatorLinks, { once: true });
  } else {
    addSimulatorLinks();
  }
})();
