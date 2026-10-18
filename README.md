# yalexBook — 직접 만지며 배우는 인터랙티브 교과서 서재

시뮬레이터를 직접 만지며 배우는 한국어 웹 교과서를 모아 두는 저장소입니다. 책 한 권이 폴더 하나이고, 루트의 `index.html`이 전체 책장입니다.
GitHub Pages 주소: https://yalex-kim.github.io/yalexBook/

| 폴더 | 책 | 기준 | 상태 |
|---|---|---|---|
| [`bluetooth/`](bluetooth/) | **BluetoothBook** — 누구나 읽는 블루투스 교과서 (15장, 시뮬레이터 41개) | Bluetooth Core Specification 6.2 | 출간 |
| [`wifi/`](wifi/) | **WiFiBook** — 누구나 읽는 와이파이 교과서 (15장, 시뮬레이터 36개) | IEEE 802.11 (Linux·hostapd 공개 구현으로 확인) | 출간 |
| [`uwb/`](uwb/) | **UWBBook** — 누구나 읽는 UWB 교과서 (15장, 시뮬레이터 33개) | IEEE 802.15.4z·FiRa (Android·Decawave·Zephyr 공개 구현과 공개 법령으로 확인) | 출간 |

책의 구성과 설명 방식(일상의 장면 → 비유 → 그림 → 예측해 보기 → 시뮬레이터 → 수치·근거 → 핵심 정리 → 퀴즈)은 [Books · 인터랙티브 교과서 시리즈](https://books.euiyun.com/)를 따릅니다.

## 구조
```
index.html              전체 책장 (assets/books.js의 목록을 그린다)
assets/books.js         책 목록 데이터 — 새 책을 여기에 등록
favicon.svg, robots.txt, sitemap.xml(각 책의 sitemap을 묶는 인덱스)
.github/workflows/pages.yml   PR·push마다 모든 책의 검증 스크립트 실행 → main이면 Pages 배포
bluetooth/              BluetoothBook (자체 css·js·chapters·scripts·tools를 가진 독립 정적 사이트)
wifi/                   WiFiBook (같은 구조, 전역 이름 WF)
uwb/                    UWBBook (같은 구조, 전역 이름 UW)
```
각 책 폴더는 다른 책에 의존하지 않습니다. 책의 상단바 “서재” 버튼과 푸터가 `../index.html`(이 책장)으로 돌아옵니다.

## 로컬에서 보기
빌드 과정이 없는 정적 사이트입니다.
```bash
python3 -m http.server 8000   # → http://localhost:8000/ (책장), http://localhost:8000/bluetooth/, /wifi/, /uwb/
```

## 검증
```bash
for f in */scripts/verify-factcheck.cjs; do node "$f"; done
```
GitHub Actions가 PR과 `main` push마다 같은 검사를 돌리고, 통과해야 배포합니다.

## 새 책 추가하기
1. 기존 책 폴더(예: `bluetooth/`)를 새 폴더로 복사하고 `chapters/`, `js/terms.js`, `js/common.js`의 `CHAPTERS`, 전역 이름(`BT`), 색(`css/style.css`의 `--accent`)을 새 책에 맞게 바꾼다. 작성 규칙은 각 책의 `CONTRIBUTING.md`를 따른다.
2. `tools/seo.py`의 `BASE`를 `https://yalex-kim.github.io/yalexBook/<폴더>/`로 바꾸고 실행해 canonical/OG 태그와 sitemap을 만든다.
3. `assets/books.js`에 책을 한 줄 등록하고, 루트 `sitemap.xml`에 새 책의 sitemap을 추가한다.
4. 계산이 있는 책은 `scripts/verify-factcheck.cjs`를 두면 CI가 자동으로 실행한다.

## 배포 (GitHub Pages)
저장소 Settings → Pages → Source를 **GitHub Actions**로 지정하면 `main`에 push할 때마다 배포됩니다. 비공개 저장소에서 Pages를 쓰려면 GitHub 유료 플랜이 필요합니다(무료 계정이면 저장소를 공개로 전환).

## 라이선스
코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0). 책별 세부 안내는 각 폴더의 `LICENSE.md`를 참고하세요.
