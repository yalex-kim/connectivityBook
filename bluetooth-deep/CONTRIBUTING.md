# BluetoothBook 심화 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요.

빌드 과정 없는 정적 사이트다. 이 책은 yalexBook 저장소의 `bluetooth-deep/` 폴더에 있고, 아래 경로는 모두 이 폴더 기준이다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`, `js/terms.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 **BluetoothBook(1권)을 읽은 펌웨어·스택·칩 검증 엔지니어**다. 1권에서 설명한 기초는 다시 풀지 않고 1권 장으로 링크한다(장 끝 “다른 책에서”).
- **기준 사양은 Bluetooth Core Specification 6.3**이다. 모든 수치·규칙에 `[Vol x] Part y §z` 근거를 단다. Core 밖의 사양(LE 오디오 프로파일 등)은 “Core 밖”이라고 밝힌다.
- **계산은 사양의 시험 데이터로 검증한다.** [Vol 6] Part C, [Vol 3] Part H 부록 D, [Vol 2] Part G 등의 샘플을 바이트 단위까지 재현하고, 가능하면 OpenSSL 같은 독립 구현과 무작위 입력으로도 맞춘다.
- 설명 흐름은 서재 공통(비유 → 그림 → 예측해 보기 → 시뮬레이터 → 근거 → 정리 → 퀴즈)을 따르되, 비유는 짧게 하고 **원문 따라 읽기**와 **작업대**(hex·로그를 넣으면 단계별로 풀어 주는 시뮬레이터)에 무게를 둔다. 작업대는 사양 샘플을 불러오는 버튼과 “사양과 비교” 표시를 둔다.
- 보안 장은 **메커니즘·방어·설정**까지만 쓴다. 공격 절차나 도구는 쓰지 않는다.
- 외부 라이브러리 없음, 색은 CSS 변수, 폭 360px에서 가로 스크롤 없음, 마우스 전용 조작 없음(서재 CLAUDE.md).

## 계산 함수와 검증
- 시뮬레이터의 계산은 페이지 스크립트 최상위 IIFE 바로 안에 `  function 이름(…) { … }`(들여쓰기 2칸)으로 두고, 그리기 코드와 분리한다. `scripts/verify-factcheck.cjs`가 이 함수를 꺼내 사양 값·샘플 데이터와 맞춰 본다.
- 사양에 샘플 데이터가 있는 계산(CRC, 화이트닝, 채널 선택, LE Coded 부호기, AES-CMAC·g2·ah 등)은 반드시 샘플로 검증하는 테스트를 추가한다.
- 기준 Core 판을 올릴 때는 `python3 tools/check_spec_refs.py <판> --titles`로 본문이 인용한 절·표가 새 판에 그대로 있는지와 제목을 확인하고, 새 판의 [Vol 1] Part C “Changes from …”(새 기능·삭제 기능·정오표)을 읽어 바뀐 내용을 반영한다. “6.2에서 추가된” 같은 역사 서술은 그대로 둔다.
- 저장소 루트의 `.github/workflows/pages.yml`이 배포 전에 `node bluetooth-deep/scripts/verify-factcheck.cjs`를 실행한다. 통과해야 배포된다.

## head 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>연결: 약속된 시각의 짧은 만남 · BluetoothBook 심화</title>
<meta name="description" content="한 문장 설명">
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
</head>
<body data-chapter="connection">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 06</div>
    <h1>연결: 약속된 시각의 짧은 만남</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
  </header>

  <section id="event"><h2>제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 여기서 BD 사용 */ </script>
</body>
</html>
```
상단바, 챕터 서랍, 목차, 이전/다음, 푸터, 테마 토글, 퀴즈 동작, 학습 진도, 용어 툴팁은 `common.js`가 자동 처리한다.
`js/common.js`와 `css/style.css`는 서재의 네 책이 함께 쓰는 원본(저장소 루트 `shared/`)에서 `python3 tools/sync_shared.py`로 만든다. 장 목록(`CHAPTERS`)만 이 책의 `common.js`에서 직접 고치고, 그 밖의 공통 동작·스타일은 `shared/`를 고친 뒤 동기화한다. 책 이름·색·푸터 문구는 `book.json`의 `ui`에 있다. CI가 `--check`로 어긋남을 잡는다.
새 챕터는 `common.js`의 `CHAPTERS`에 `{ slug, num, part, title, desc, tags }`로 등록한 뒤 `python3 tools/seo.py`를 실행한다.

## 컴포넌트
- 그림: `<figure class="diagram"><svg viewBox="...">...</svg><figcaption><b>그림 6-1.</b> 설명</figcaption></figure>`
  - SVG 유틸 클래스: `.t .t-dim .t-mono .t-acc`, `.s-line .s-axis .s-acc`, `.f-surface .f-elev .f-acc .f-acc-soft .f-acc2-soft`
- 시뮬레이터: `.sim > .sim-head(.sim-tag + h3) + .sim-view(canvas) + .sim-controls(.ctrl, .seg, .check, .btn) + .sim-readout(.stat) + .sim-note`
  - `.sim-body.side`로 넓은 화면에서 컨트롤을 오른쪽에 둔다. `sim-note`는 “해볼 것: ① …”과 모델 가정을 적는다.
- 콜아웃: `.callout`(기본), `.tip`, `.warn`, `.analogy`(비유), `.deep`(더 알아보기), `.spec`(사양 들여다보기)
- 사양 근거: `<p class="spec-ref">항목: <b>[Vol 6] Part B §4.5.1</b> · …</p>`
- 퀴즈: `.quiz-q > p + .opts > button.opt[data-correct]` + `.quiz-exp`
- 예측 실험: `.whatif.quiz-q > .wi-head + p.wi-q + p.wi-hint + .opts + .quiz-exp`
- 용어: `.term` 안의 글자가 `js/terms.js`의 표제어나 `BD_TERM_ALIAS`와 맞으면 자동으로 툴팁이 붙는다. 새 용어는 `BD_TERMS`에 `[한국어, 영어, 설명(가능하면 사양 위치 포함), 장 slug]`로 추가한다.

## JS 헬퍼 (`js/common.js`, 전역 `BD`)
- `BD.canvas(el, (ctx,w,h)=>{}, {aspect, height, minHeight, maxHeight})` → `{redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw.
- `BD.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, series, vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})`
- `BD.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 애니메이션 루프.
- `BD.keys(canvas, { move(dx, dy, big), activate(), next(), say(), hint })` 캔버스를 눌러 조작하는 시뮬레이터의 키보드 대안(화살표·Enter·N)과 화면 낭독 문구. 마우스로만 되는 조작은 만들지 않는다.
- `BD.range(id, fmt, onInput)`, `BD.seg(id, onChange)`, `BD.stat(id, html)`
- 그리기: `BD.rrect`, `BD.box`, `BD.arrow`, `BD.text`
- 숫자: `BD.bin`, `BD.hex`, `BD.bytes`, `BD.time`, `BD.kn`, `BD.fmt`, `BD.si`, `BD.rng(seed)`
- 진도: `BD.progress.get(slug)`, `.last()`, `.doneCount()`, `.reset()` (localStorage `bd-progress-v1`)
