# CLAUDE.md

yalexBook: 직접 만지며 배우는 한국어 인터랙티브 교과서 서재. 책 한 권 = 폴더 하나(`bluetooth/`, `wifi/`, `uwb/`, `gnss/`), 루트 `index.html`이 책장이다. 빌드 과정 없는 정적 사이트이고 GitHub Pages(https://yalex-kim.github.io/yalexBook/)로 배포한다.

## Commands

```bash
python3 -m http.server 8000                          # → http://localhost:8000/ (책장), /bluetooth/ …
for f in */scripts/verify-factcheck.cjs; do node "$f"; done   # 책마다 계산·구조 검증
python3 tools/sync_shared.py [--check]               # shared/ → 각 책의 js/common.js, css/style.css
python3 tools/build_search.py [--check]              # 서재 통합 검색 색인 assets/search-index.js
(cd <책> && python3 tools/seo.py)                    # canonical/OG/JSON-LD, 책 sitemap
```

CI(`.github/workflows/pages.yml`)가 PR과 `main` push마다 `sync_shared.py --check`, `build_search.py --check`, 모든 `verify-factcheck.cjs`를 돌리고, 통과해야 배포한다.

## 구조

- `<책>/chapters/*.html` + `index.html`, `js/terms.js`(용어집 데이터), `scripts/verify-factcheck.cjs`, `tools/seo.py`, `book.json`, `CONTRIBUTING.md`(그 책의 작성 규칙: 기준 문서, 공통 비유, 출처 표기 방식)
- `<책>/js/common.js`, `<책>/css/style.css`는 **생성물**이다. 원본은 루트 `shared/`이고, 책마다 다른 값(전역 이름, 짧은 이름, 푸터, 출처 상자 이름, 색, 로고)은 `book.json`의 `ui`에 있다. 장 목록(`CHAPTERS`)만 각 책의 `common.js`에서 직접 고친다. 공통 동작·스타일을 고칠 때는 `shared/`를 고치고 `sync_shared.py`를 돌린다.
- 장을 추가하거나 제목·절을 바꾸면 `seo.py`와 `build_search.py`를 다시 돌린다.
- `assets/books.js`: 책장에 보이는 책 목록(장·시뮬레이터 수, 기준 문서, 색).

## 책을 쓰는 규칙 (모든 책 공통)

- **사실 정확성이 먼저다.** 수치는 원전(사양서·표준·공개 규격)이나 그것을 구현한 공개 코드에서 확인한 값만 쓰고 근거 위치를 `spec-ref`로 단다. 확인 못 한 값은 “대표값”, “예시 값”이라고 밝히고 `sim-note`에 가정으로 적는다.
- **설명 흐름**: 일상의 장면·질문 → 비유(`.callout.analogy`) → 그림(SVG) → 예측해 보기(`.whatif.quiz-q`) → 시뮬레이터(`.sim`) → 수치·근거 → 핵심 정리(`.keypoints`) → 퀴즈(`.quiz-sec`). 용어집을 뺀 **모든 장**에 비유·예측해 보기·시뮬레이터·핵심 정리·퀴즈가 있어야 하고, 문제마다 정답(`data-correct`)이 하나여야 한다. 검증 스크립트가 확인한다.
- 예측해 보기와 퀴즈의 숫자는 그 장의 계산 함수로 직접 계산해서 맞춘다. 해설이 시뮬레이터의 컨트롤 이름을 부르면 실제 라벨과 같은 이름을 쓴다.
- 비유는 책마다 하나의 공통 비유를 따른다(블루투스: 시끄러운 카페, 와이파이: 회의실, UWB: 박수, GNSS: 시보). 각 책의 `CONTRIBUTING.md` 참고.
- 계산은 페이지 스크립트 IIFE 바로 안의 `  function 이름(`(들여쓰기 2칸)으로 두고, 검증 스크립트가 꺼내 원전의 샘플·시험 벡터·공개 구현과 맞춘다. 공개 구현에 같은 계산이 있으면 옮겨 와 무작위 입력으로 비교한다.
- 본문의 `.term`은 모두 `js/terms.js`의 표제어로 이어져야 한다. 상대 링크는 모두 실제 파일로 이어져야 한다(검증 스크립트가 확인).
- 다른 책과 이어지는 주제가 있으면 핵심 정리 앞에 `.callout.related`(함께 읽기)로 링크한다.
- 보안 장은 **원리·방어·설정**만 쓴다. 공격 절차, 공격 도구, 비밀번호 추측 비용 계산 같은 내용은 넣지 않는다.
- 마우스로만 되는 조작을 만들지 않는다. 캔버스를 눌러 조작하는 시뮬레이터는 `<NS>.keys(canvas, { move, activate, next, say })`로 키보드 대안(화살표·Enter·N)과 낭독 문구를 함께 단다. 누르면 동작하는 표의 줄은 `tr[data-i]`, 그 밖의 요소는 `data-kb`를 붙이면 `common.js`가 Tab·Enter로 누를 수 있게 한다.
- 외부 라이브러리 없음(글꼴 CSS만 CDN), classic script만(ES module 금지), 색은 CSS 변수로, 라이트·다크 모두, 폭 360px에서 가로 스크롤 없음.
- 한국어로 쓴다. 대상은 그 분야를 배운 적 없는 일반인, 뒤쪽 장은 입문 엔지니어.

## 새 책 체크리스트

1. 기존 책 폴더를 복사한다. `chapters/`, `js/terms.js`, `common.js`의 `CHAPTERS`, `book.json`(`ui` 포함), `CONTRIBUTING.md`(기준 문서·공통 비유), `tools/seo.py`의 `BASE`를 바꾼다.
2. `python3 tools/sync_shared.py`로 공통 코드를 만든다.
3. 장마다 위 설명 흐름을 채우고, `scripts/verify-factcheck.cjs`에 계산 검증을 넣는다.
4. `index.html`(책 홈), README, LICENSE.md, og.png, favicon을 만들고 `seo.py`를 돌린다.
5. `assets/books.js`, 루트 `sitemap.xml`, 루트 README 표에 등록하고 `build_search.py`를 돌린다.
6. 관련 있는 다른 책의 장에 함께 읽기 링크를 단다.

## 작업 방식

- `main`에 직접 커밋하지 않는다. 기능 브랜치 → PR.
- 브라우저 확인: 각 페이지를 360·1280px에서 열어 페이지 오류와 가로 넘침이 없는지 본다.
