# WiFiBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요.

빌드 과정 없는 정적 사이트다. 이 책은 yalexBook 저장소의 `wifi/` 폴더에 있고, 아래 경로는 모두 이 폴더 기준이다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`, `js/terms.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 **와이파이를 배운 적 없는 일반인**(뒤쪽 장은 네트워크·펌웨어·RF 입문 엔지니어도 읽을 깊이). 전문 용어는 처음 나올 때 쉬운 말로 풀고 `<span class="term">공간 스트림</span><span class="en">(spatial stream)</span>`처럼 원어를 병기한다.
- **근거는 공개 구현 코드다.** IEEE 802.11 원문 대신 Linux 커널(`net/wireless`, `net/mac80211`, `include/linux/ieee80211*.h`, 드라이버)과 hostapd·wpa_supplicant의 코드·기본 설정·시험 벡터를 쓴다. 수치·규칙에는 `<p class="spec-ref">항목: <code>파일</code>의 <code>함수·상수</code></p>`로 출처를 단다. 조항 번호는 코드 주석이 인용한 경우에만 적는다. 코드나 공개 자료로 확인하지 않은 값은 쓰지 않는다.
- 코드로 확인한 값과 **환경·칩의 어림값**(벽 손실, 전류, 필요 SNR 등)을 구분한다. 어림값은 “어림”, “예시 값”이라고 밝히고 `sim-note`에 가정을 적는다.
- 아직 표준이 아닌 내용(Wi-Fi 8 등)은 “초안”이라고 밝히고 계산 시뮬레이터를 두지 않는다.
- 수식 대신 비유와 숫자 감각을 쓴다(필요하면 `.formula` 블록에 간단한 식만, KaTeX 없음). 책 전체의 공통 비유는 **회의실**이다: 채널 = 회의실, AP = 사회자, CSMA/CA = 손을 들 수 없는 회의의 눈치 규칙, 백오프 = 마음속으로 세는 숫자, 비컨 = 정시 안내 방송, 묶음 전송 = 택배 트럭, 블록 ACK = 체크 목록 한 장, 절전 = 경비실 택배 보관함, MIMO = 여러 마이크와 스피커.
- 흐름: 일상의 장면·질문 → 비유(`.callout.analogy`) → 그림(SVG) → 예측해 보기(`.whatif`) → 시뮬레이터 → 실제 수치·출처 → 핵심 정리 → 퀴즈.
- 앞 장의 개념을 쓸 때는 “(6장)”처럼 장 번호를 적어 연결한다.
- 외부 라이브러리는 쓰지 않는다(글꼴 CSS만 CDN). 암호 계산도 페이지 안에서 직접 구현한다. 이미지 파일 대신 인라인 SVG/canvas로 그린다.
- 색은 하드코딩하지 말고 CSS 변수(`var(--accent)` 등)나 `WF.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다.
- 모바일(폭 360px)에서 페이지 가로 스크롤이 생기면 안 된다. 넓은 그림은 `overflow-x:auto` 래퍼 안에 넣는다. SVG는 `viewBox`만 주고 width/height 속성 생략.

## 계산 함수와 검증
- 시뮬레이터의 계산은 페이지 스크립트 최상위 IIFE 바로 안에 `  function 이름(…) { … }`(들여쓰기 2칸)으로 두고, 그리기 코드와 분리한다. `scripts/verify-factcheck.cjs`가 이 함수를 꺼내 공개 구현과 맞춰 본다.
- 커널·hostapd에 같은 계산이 있으면(채널 변환, 속도, 전송 시간, 머리말 길이, TIM, 펑처링, PBKDF2·PRF 등) 그 코드를 검증 스크립트에 옮겨 두고 많은 입력에서 비교하는 테스트를 추가한다. 검증 스크립트는 외부 파일을 읽지 않게, 옮긴 표·식을 스크립트 안에 둔다.
- 본문의 `.term`은 모두 `js/terms.js`의 표제어로 이어져야 한다(검증 스크립트가 확인).
- 저장소 루트의 `.github/workflows/pages.yml`이 배포 전에 `node wifi/scripts/verify-factcheck.cjs`를 실행한다. 통과해야 배포된다.

## head 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>연결과 로밍 · WiFiBook</title>
<meta name="description" content="한 문장 설명">
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
</head>
<body data-chapter="connect">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter 09</div>
    <h1>연결과 로밍</h1>
    <p class="lead">...</p>
    <ul class="objectives"><li>...</li></ul>
  </header>

  <section id="scan"><h2>제목</h2> ... </section>   <!-- h2 번호와 우측 목차는 자동 생성 -->
  ...
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>...</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> ... </div></section>
</main>
<script> /* 페이지 스크립트: 여기서 WF 사용 */ </script>
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
- 출처: `<p class="spec-ref">항목: Linux <code>net/wireless/util.c</code>의 <code>ieee80211_channel_to_freq_khz()</code> · …</p>`
- 퀴즈: `.quiz-q > p + .opts > button.opt[data-correct]` + `.quiz-exp`
- 예측 실험: `.whatif.quiz-q > .wi-head + p.wi-q + p.wi-hint + .opts + .quiz-exp`
- 용어: `.term` 안의 글자가 `js/terms.js`의 표제어나 `WF_TERM_ALIAS`와 맞으면 자동으로 툴팁이 붙는다. 새 용어는 `WF_TERMS`에 `[한국어, 영어, 설명, 장 slug]`로 추가한다.

## JS 헬퍼 (`js/common.js`, 전역 `WF`)
- `WF.canvas(el, (ctx,w,h)=>{}, {aspect, height, minHeight, maxHeight})` → `{redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw.
- `WF.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, series, vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})`
- `WF.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 애니메이션 루프.
- `WF.range(id, fmt, onInput)`, `WF.seg(id, onChange)`, `WF.stat(id, html)`
- 그리기: `WF.rrect`, `WF.box`, `WF.arrow`, `WF.text`
- 숫자: `WF.bin`, `WF.hex`, `WF.bytes`, `WF.time`, `WF.kn`, `WF.fmt`, `WF.si`, `WF.rng(seed)`
- 진도: `WF.progress.get(slug)`, `.last()`, `.doneCount()`, `.reset()` (localStorage `wf-progress-v1`)
