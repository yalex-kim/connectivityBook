# GNSSBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요.

빌드 과정 없는 정적 사이트다. 이 책은 yalexBook 저장소의 `gnss/` 폴더에 있고, 아래 경로는 모두 이 폴더 기준이다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`, `js/terms.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 **GNSS를 배운 적 없는 일반인**(뒤쪽 장은 수신기·앱·제품 입문 엔지니어도 읽을 깊이). 전문 용어는 처음 나올 때 쉬운 말로 풀고 `<span class="term">의사거리</span><span class="en">(Pseudorange)</span>`처럼 원어를 병기한다.
- **근거는 공개 규격과 공개 구현이다.** IS-GPS-200N, Galileo OS SIS ICD를 1차 근거로, RTKLIB과 Android 위치 API를 2차 근거로 쓴다. 출처는 `<p class="spec-ref">항목: IS-GPS-200N 표 20-IV(p.106) · RTKLIB <code>eph2pos()</code></p>`처럼 표·절 번호와 쪽수를 단다.
- 규격으로 확인한 값과 **칩·환경의 예시 값**(잡음 지수, 전류, 건물 모양, 센서 치우침)을 구분한다. 예시 값은 `sim-note`에 가정으로 적는다.
- 재밍·스푸핑 같은 주제는 **원리와 방어** 중심으로 쓴다. 공격 절차나 도구를 설명하지 않는다.
- 책 전체의 공통 비유는 **시보**다: 방송국마다 다른 음악 = PRN 코드, 늦게 들린 만큼 멀다 = 의사거리, 내 시계가 틀리면 모두 똑같이 늦다 = 시계 오차.
- 흐름: 일상의 장면·질문 → 비유(`.callout.analogy`) → 그림(SVG) → 예측해 보기(`.whatif`) → 시뮬레이터 → 실제 수치·출처 → 핵심 정리 → 퀴즈.
- 앞 장의 개념을 쓸 때는 “(6장)”처럼 장 번호를 적어 연결한다.
- 외부 라이브러리는 쓰지 않는다(글꼴 CSS만 CDN). 이미지 파일 대신 인라인 SVG/canvas로 그린다.
- 색은 CSS 변수나 `GN.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다.
- 모바일(폭 360px)에서 페이지 가로 스크롤이 생기면 안 된다.

## 계산 함수와 검증
- 시뮬레이터의 계산은 페이지 스크립트 최상위 IIFE 바로 안에 `  function 이름(…) { … }`(들여쓰기 2칸)으로 두고, 그리기 코드와 분리한다. `scripts/verify-factcheck.cjs`가 이 함수를 꺼내 공개 구현과 맞춰 본다.
- 규격에 표·식이 있거나 RTKLIB에 같은 계산이 있으면(코드 표, 위성 위치, 전리층·대류층, DOP, 패리티) 그 식·값을 검증 스크립트에 옮겨 두고 비교한다. 검증 스크립트는 외부 파일을 읽지 않는다.
- 본문의 `.term`은 모두 `js/terms.js`의 표제어로 이어져야 한다(검증 스크립트가 확인).
- 저장소 루트의 `.github/workflows/pages.yml`이 배포 전에 `node gnss/scripts/verify-factcheck.cjs`를 실행한다.

## head 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>위치 계산 · GNSSBook</title>
<meta name="description" content="한 문장 설명">
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
</head>
<body data-chapter="position">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 09</div>
    <h1>위치 계산</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
  </header>

  <section id="ls"><h2>제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 여기서 GN 사용 */ </script>
</body>
</html>
```
상단바, 챕터 서랍, 목차, 이전/다음, 푸터, 테마 토글, 퀴즈 동작, 학습 진도, 용어 툴팁은 `common.js`가 자동 처리한다.
`js/common.js`와 `css/style.css`는 서재의 네 책이 함께 쓰는 원본(저장소 루트 `shared/`)에서 `python3 tools/sync_shared.py`로 만든다. 장 목록(`CHAPTERS`)만 이 책의 `common.js`에서 직접 고치고, 그 밖의 공통 동작·스타일은 `shared/`를 고친 뒤 동기화한다. 책 이름·색·푸터 문구는 `book.json`의 `ui`에 있다. CI가 `--check`로 어긋남을 잡는다.
새 챕터는 `common.js`의 `CHAPTERS`에 `{ slug, num, part, title, desc, tags }`로 등록한 뒤 `python3 tools/seo.py`를 실행한다.

## 컴포넌트
- 그림: `<figure class="diagram"><svg viewBox="...">...</svg><figcaption><b>그림 9-1.</b> 설명</figcaption></figure>`
  - SVG 유틸 클래스: `.t .t-dim .t-mono .t-acc`, `.s-line .s-axis .s-acc`, `.f-surface .f-elev .f-acc .f-acc-soft .f-acc2-soft`
- 시뮬레이터: `.sim > .sim-head(.sim-tag + h3) + .sim-view(canvas) + .sim-controls(.ctrl, .seg, .check, .btn) + .sim-readout(.stat) + .sim-note`
  - `.sim-body.side`로 넓은 화면에서 컨트롤을 오른쪽에 둔다. `sim-note`는 “해볼 것: ① …”과 모델 가정을 적는다.
- 콜아웃: `.callout`(기본), `.tip`, `.warn`, `.analogy`(비유), `.deep`(더 알아보기), `.spec`(규격 들여다보기)
- 출처: `<p class="spec-ref">항목: IS-GPS-200N 표 20-IV · RTKLIB <code>eph2pos()</code> · …</p>`
- 퀴즈: `.quiz-q > p + .opts > button.opt[data-correct]` + `.quiz-exp`
- 예측 실험: `.whatif.quiz-q > .wi-head + p.wi-q + p.wi-hint + .opts + .quiz-exp`
- 용어: `.term` 안의 글자가 `js/terms.js`의 표제어나 `GN_TERM_ALIAS`와 맞으면 자동으로 툴팁이 붙는다. 새 용어는 `GN_TERMS`에 `[한국어, 영어, 설명, 장 slug]`로 추가한다.

## JS 헬퍼 (`js/common.js`, 전역 `GN`)
- `GN.canvas(el, (ctx,w,h)=>{}, {aspect, height, minHeight, maxHeight})` → `{redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw.
- `GN.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, series, vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})`
- `GN.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 애니메이션 루프.
- `GN.keys(canvas, { move(dx, dy, big), activate(), next(), say(), hint })` 캔버스를 눌러 조작하는 시뮬레이터의 키보드 대안(화살표·Enter·N)과 화면 낭독 문구. 마우스로만 되는 조작은 만들지 않는다.
- `GN.range(id, fmt, onInput)`, `GN.seg(id, onChange)`, `GN.stat(id, html)`
- 그리기: `GN.rrect`, `GN.box`, `GN.arrow`, `GN.text`
- 숫자: `GN.bin`, `GN.hex`, `GN.bytes`, `GN.time`, `GN.kn`, `GN.fmt`, `GN.si`, `GN.rng(seed)`
- 진도: `GN.progress.get(slug)`, `.last()`, `.doneCount()`, `.reset()` (localStorage `gn-progress-v1`)
