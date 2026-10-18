# BluetoothBook 챕터 작성 가이드

## 기여물의 라이선스

기여하는 코드는 MIT, 교재 콘텐츠는 CC BY 4.0으로 제공하는 데 동의해야 합니다. HTML 안에 코드와 콘텐츠가 함께 있어도 각 부분에 해당하는 라이선스를 적용합니다. 적용 범위는 [라이선스 안내](LICENSE.md)를 참고하세요.

빌드 과정 없는 정적 사이트다. 이 책은 yalexBook 저장소의 `bluetooth/` 폴더에 있고, 아래 경로는 모두 이 폴더 기준이다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`, `js/terms.js`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 (file://로 열어도 동작하게 classic script만 사용한다. ES module 금지.)

## 원칙
- **한국어**, 대상은 **블루투스를 배운 적 없는 일반인**(뒤쪽 장은 펌웨어·RF 입문 엔지니어도 읽을 깊이). 전문 용어는 처음 나올 때 쉬운 말로 풀고 `<span class="term">연결 간격</span><span class="en">(connInterval)</span>`처럼 원어를 병기한다.
- **기준 사양은 Bluetooth Core Specification 6.2**다. 사양이 정한 수치·규칙에는 근거 위치를 `<p class="spec-ref">설명: <b>[Vol 6] Part B §4.5.1</b></p>`로 단다. 사양서에서 직접 확인하지 않은 값은 쓰지 않는다.
- 사양이 정한 값(shall/should)과 **칩·제품의 대표값**을 구분한다. 대표값은 “대표값”, “흔히”라고 밝히고 `sim-note`에 가정을 적는다.
- Core 밖의 사양(Assigned Numbers, Core Specification Supplement, A2DP·HFP·LC3·BAP, Mesh Protocol, 각종 서비스 사양)을 다룰 때는 “Core 밖”이라고 밝힌다.
- 수식 대신 비유와 숫자 감각을 쓴다(필요하면 `.formula` 블록에 간단한 식만, KaTeX 없음). 책 전체의 공통 비유는 **시끄러운 카페에서의 대화**다: 2.4 GHz = 시끄러운 카페(Wi-Fi·전자레인지도 떠든다), 채널 = 테이블, 광고 채널 = 입구 쪽 세 테이블, 광고 = 자기소개 외치기, 스캔 = 귀 기울이기, 연결 = 정해진 시각마다 정해진 순서로 테이블을 옮겨 가며 만나는 약속, 연결 간격 = 만남 주기, 주파수 도약 = 테이블 옮기기, GATT = 메뉴판(서비스 = 분류, 특성 = 항목, 핸들 = 번호), 알림 = 진동벨, 페어링 = 둘만의 암호 정하기, 본딩 = 연락처 저장, RPA = 친구만 알아보는 가명, 메시 = 소문 전하기, 호스트·컨트롤러 = 손님과 비서.
- 흐름: 일상의 장면·질문 → 비유(`.callout.analogy`) → 그림(SVG) → 예측해 보기(`.whatif`) → 시뮬레이터 → 실제 수치·사양 근거 → 핵심 정리 → 퀴즈.
- 앞 장의 개념을 쓸 때는 “(6장)”처럼 장 번호를 적어 연결한다.
- 외부 라이브러리는 쓰지 않는다(글꼴 CSS만 CDN). 암호 계산도 페이지 안에서 직접 구현하고, 브라우저 기능은 WebCrypto(ECDH)만 쓴다. 이미지 파일 대신 인라인 SVG/canvas로 그린다.
- 색은 하드코딩하지 말고 CSS 변수(`var(--accent)` 등)나 `BT.palette()`를 쓴다. 라이트/다크 둘 다 읽혀야 한다.
- 모바일(폭 360px)에서 페이지 가로 스크롤이 생기면 안 된다. 넓은 그림은 `overflow-x:auto` 래퍼 안에 넣는다. SVG는 `viewBox`만 주고 width/height 속성 생략.

## 계산 함수와 검증
- 시뮬레이터의 계산은 페이지 스크립트 최상위 IIFE 바로 안에 `  function 이름(…) { … }`(들여쓰기 2칸)으로 두고, 그리기 코드와 분리한다. `scripts/verify-factcheck.cjs`가 이 함수를 꺼내 사양 값·샘플 데이터와 맞춰 본다.
- 사양에 샘플 데이터가 있는 계산(CRC, 화이트닝, 채널 선택, LE Coded 부호기, AES-CMAC·g2·ah 등)은 반드시 샘플로 검증하는 테스트를 추가한다.
- 저장소 루트의 `.github/workflows/pages.yml`이 배포 전에 `node bluetooth/scripts/verify-factcheck.cjs`를 실행한다. 통과해야 배포된다.

## head 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<title>연결: 약속된 시각의 짧은 만남 · BluetoothBook</title>
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
<script> /* 페이지 스크립트: 여기서 BT 사용 */ </script>
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
- 용어: `.term` 안의 글자가 `js/terms.js`의 표제어나 `BT_TERM_ALIAS`와 맞으면 자동으로 툴팁이 붙는다. 새 용어는 `BT_TERMS`에 `[한국어, 영어, 설명(가능하면 사양 위치 포함), 장 slug]`로 추가한다.

## JS 헬퍼 (`js/common.js`, 전역 `BT`)
- `BT.canvas(el, (ctx,w,h)=>{}, {aspect, height, minHeight, maxHeight})` → `{redraw()}` HiDPI, 리사이즈·테마 변경 시 자동 redraw.
- `BT.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, series, vlines, hlines, points, bands, xFmt, yFmt, xTicks, yTicks})`
- `BT.loop(el, (dt,t)=>{})` 화면에 보일 때만 도는 애니메이션 루프.
- `BT.keys(canvas, { move(dx, dy, big), activate(), next(), say(), hint })` 캔버스를 눌러 조작하는 시뮬레이터의 키보드 대안(화살표·Enter·N)과 화면 낭독 문구. 마우스로만 되는 조작은 만들지 않는다.
- `BT.range(id, fmt, onInput)`, `BT.seg(id, onChange)`, `BT.stat(id, html)`
- 그리기: `BT.rrect`, `BT.box`, `BT.arrow`, `BT.text`
- 숫자: `BT.bin`, `BT.hex`, `BT.bytes`, `BT.time`, `BT.kn`, `BT.fmt`, `BT.si`, `BT.rng(seed)`
- 진도: `BT.progress.get(slug)`, `.last()`, `.doneCount()`, `.reset()` (localStorage `bt-progress-v1`)
