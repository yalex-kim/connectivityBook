# UWBBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요.

빌드 과정 없는 정적 사이트다. 이 책은 yalexBook 저장소의 `uwb/` 폴더에 있고, 아래 경로는 모두 이 폴더 기준이다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`, `js/terms.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 **UWB를 배운 적 없는 일반인**(뒤쪽 장은 제품·펌웨어·RF 입문 엔지니어도 읽을 깊이). 전문 용어는 처음 나올 때 쉬운 말로 풀고 `<span class="term">비행시간</span><span class="en">(Time of Flight)</span>`처럼 원어를 병기한다.
- **근거는 공개 구현 코드와 공개 법령이다.** IEEE 802.15.4z·FiRa·CCC 원문 대신 Android UWB 스택(`packages/modules/Uwb`, `external/uwb`), Decawave `uwb-core`·`uwb-dw1000`, Zephyr의 802.15.4 헤더·DW1000 드라이버, 47 CFR Part 15 Subpart F를 쓴다. 출처는 `<p class="spec-ref">항목: <code>파일</code>의 <code>함수·상수</code></p>`로 단다. 조항 번호는 코드 주석이 인용한 경우에만 적는다. 공개 구현끼리 다르면 근거를 비교해 밝힌다.
- 코드로 확인한 값과 **칩·환경의 예시 값**(전류, 벽 손실, 위상 잡음, 감도)을 구분한다. 예시 값은 `sim-note`에 가정으로 적는다.
- 보안 장은 **방어 원리** 중심으로 쓴다. 공격 절차나 공격 도구를 설명하지 않는다.
- 책 전체의 공통 비유는 **박수**다: 짧은 손뼉 = 펄스, 왕복 손뼉 = TWR, 메아리보다 먼저 온 소리 = 첫 경로, 두 귀의 시차 = AoA, 매번 바뀌는 비밀 박자 = STS.
- 흐름: 일상의 장면·질문 → 비유(`.callout.analogy`) → 그림(SVG) → 예측해 보기(`.whatif`) → 시뮬레이터 → 실제 수치·출처 → 핵심 정리 → 퀴즈.
- 앞 장의 개념을 쓸 때는 “(6장)”처럼 장 번호를 적어 연결한다.
- 외부 라이브러리는 쓰지 않는다(글꼴 CSS만 CDN). 이미지 파일 대신 인라인 SVG/canvas로 그린다.
- 색은 CSS 변수나 `UW.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다.
- 모바일(폭 360px)에서 페이지 가로 스크롤이 생기면 안 된다.

## 계산 함수와 검증
- 시뮬레이터의 계산은 페이지 스크립트 최상위 IIFE 바로 안에 `  function 이름(…) { … }`(들여쓰기 2칸)으로 두고, 그리기 코드와 분리한다. `scripts/verify-factcheck.cjs`가 이 함수를 꺼내 공개 구현과 맞춰 본다.
- 공개 코드에 같은 계산이나 시험 값이 있으면(거리 계산, 프레임 시간, 각도, NLOS 추정, 상수) 그 식·값을 검증 스크립트에 옮겨 두고 비교한다. 검증 스크립트는 외부 파일을 읽지 않는다.
- 본문의 `.term`은 모두 `js/terms.js`의 표제어로 이어져야 한다(검증 스크립트가 확인).
- 저장소 루트의 `.github/workflows/pages.yml`이 배포 전에 `node uwb/scripts/verify-factcheck.cjs`를 실행한다.

## head 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>양방향 거리 측정 · UWBBook</title>
<meta name="description" content="한 문장 설명">
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
</head>
<body data-chapter="twr">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 06</div>
    <h1>양방향 거리 측정</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
  </header>

  <section id="ss"><h2>제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 여기서 UW 사용 */ </script>
</body>
</html>
```
상단바, 챕터 서랍, 목차, 이전/다음, 푸터, 테마 토글, 퀴즈 동작, 학습 진도, 용어 툴팁은 `common.js`가 자동 처리한다.
새 챕터는 `common.js`의 `CHAPTERS`에 `{ slug, num, part, title, desc, tags }`로 등록한 뒤 `python3 tools/seo.py`를 실행한다.

## 컴포넌트
- 그림: `<figure class="diagram"><svg viewBox="...">...</svg><figcaption><b>그림 6-1.</b> 설명</figcaption></figure>`
  - SVG 유틸 클래스: `.t .t-dim .t-mono .t-acc`, `.s-line .s-axis .s-acc`, `.f-surface .f-elev .f-acc .f-acc-soft .f-acc2-soft`
- 시뮬레이터: `.sim > .sim-head(.sim-tag + h3) + .sim-view(canvas) + .sim-controls(.ctrl, .seg, .check, .btn) + .sim-readout(.stat) + .sim-note`
  - `.sim-body.side`로 넓은 화면에서 컨트롤을 오른쪽에 둔다. `sim-note`는 “해볼 것: ① …”과 모델 가정을 적는다.
- 콜아웃: `.callout`(기본), `.tip`, `.warn`, `.analogy`(비유), `.deep`(더 알아보기), `.spec`(출처 들여다보기)
- 출처: `<p class="spec-ref">항목: Decawave <code>uwb-core</code>의 <code>calc_tof_ss()</code> · …</p>`
- 퀴즈: `.quiz-q > p + .opts > button.opt[data-correct]` + `.quiz-exp`
- 예측 실험: `.whatif.quiz-q > .wi-head + p.wi-q + p.wi-hint + .opts + .quiz-exp`
- 용어: `.term` 안의 글자가 `js/terms.js`의 표제어나 `UW_TERM_ALIAS`와 맞으면 자동으로 툴팁이 붙는다. 새 용어는 `UW_TERMS`에 `[한국어, 영어, 설명, 장 slug]`로 추가한다.

## JS 헬퍼 (`js/common.js`, 전역 `UW`)
- `UW.canvas(el, (ctx,w,h)=>{}, {aspect, height, minHeight, maxHeight})` → `{redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw.
- `UW.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, series, vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})`
- `UW.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 애니메이션 루프.
- `UW.range(id, fmt, onInput)`, `UW.seg(id, onChange)`, `UW.stat(id, html)`
- 그리기: `UW.rrect`, `UW.box`, `UW.arrow`, `UW.text`
- 숫자: `UW.bin`, `UW.hex`, `UW.bytes`, `UW.time`, `UW.kn`, `UW.fmt`, `UW.si`, `UW.rng(seed)`
- 진도: `UW.progress.get(slug)`, `.last()`, `.doneCount()`, `.reset()` (localStorage `uw-progress-v1`)
