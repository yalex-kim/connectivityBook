# ConnectivityBook — 직접 만지며 배우는 인터랙티브 교과서 서재

시뮬레이터를 직접 만지며 배우는 한국어 웹 교과서를 모아 두는 저장소입니다. 책 한 권이 폴더 하나이고, 루트의 `index.html`이 전체 책장입니다.
GitHub Pages 주소: https://yalex-kim.github.io/connectivityBook/

| 폴더 | 책 | 기준 | 상태 |
|---|---|---|---|
| [`bluetooth/`](bluetooth/) | **BluetoothBook** — 누구나 읽는 블루투스 교과서 (15장, 시뮬레이터 41개) | Bluetooth Core Specification 6.3 | 출간 |
| [`wifi/`](wifi/) | **WiFiBook** — 누구나 읽는 와이파이 교과서 (15장, 시뮬레이터 36개) | IEEE 802.11 (Linux·hostapd 공개 구현으로 확인) | 출간 |
| [`uwb/`](uwb/) | **UWBBook** — 누구나 읽는 UWB 교과서 (15장, 시뮬레이터 33개) | IEEE 802.15.4z·FiRa (Android·Decawave·Zephyr 공개 구현과 공개 법령으로 확인) | 출간 |
| [`gnss/`](gnss/) | **GNSSBook** — 누구나 읽는 GNSS 교과서 (15장, 시뮬레이터 32개) | IS-GPS-200N·Galileo OS SIS ICD (공개 규격, RTKLIB으로 계산 확인) | 출간 |
| [`bluetooth-deep/`](bluetooth-deep/) | **BluetoothBook 심화** — 프로토콜 스택을 끝까지 따라가는 블루투스 교과서 (19장, 시뮬레이터 41개) | Bluetooth Core 6.3 (사양 시험 데이터로 검증) | 출간 |

책의 구성과 설명 방식(일상의 장면 → 비유 → 그림 → 예측해 보기 → 시뮬레이터 → 수치·근거 → 핵심 정리 → 퀴즈)은 [Books · 인터랙티브 교과서 시리즈](https://books.euiyun.com/)를 따릅니다.

## 구조
```
index.html              전체 책장 (assets/books.js의 목록을 그린다)
assets/books.js         책 목록 데이터 — 새 책을 여기에 등록
assets/search-index.js  서재 통합 검색 색인 (tools/build_search.py가 만든다)
shared/                 네 책이 함께 쓰는 common.js·style.css 원본 (tools/sync_shared.py로 각 책에 복사)
tools/                  sync_shared.py, build_search.py
CLAUDE.md               서재 공통 규칙과 새 책 체크리스트
favicon.svg, robots.txt, sitemap.xml(각 책의 sitemap을 묶는 인덱스)
.github/workflows/pages.yml   PR·push마다 모든 책의 검증 스크립트 실행 → main이면 Pages 배포
bluetooth/              BluetoothBook (자체 css·js·chapters·scripts·tools를 가진 독립 정적 사이트)
wifi/                   WiFiBook (같은 구조, 전역 이름 WF)
uwb/                    UWBBook (같은 구조, 전역 이름 UW)
gnss/                   GNSSBook (같은 구조, 전역 이름 GN)
bluetooth-deep/         BluetoothBook 심화 (같은 구조, 전역 이름 BD)
```
실행할 때 각 책 폴더는 다른 책의 파일을 불러오지 않습니다(장 끝의 “함께 읽기” 링크만 다른 책으로 이어집니다). 책의 상단바 “서재” 버튼과 푸터가 `../index.html`(이 책장)으로 돌아옵니다.

## 로컬에서 보기
빌드 과정이 없는 정적 사이트입니다.
```bash
python3 -m http.server 8000   # → http://localhost:8000/ (책장), http://localhost:8000/bluetooth/, /wifi/, /uwb/, /gnss/
```

## 검증
```bash
for f in */scripts/verify-factcheck.cjs; do node "$f"; done
python3 tools/sync_shared.py --check && python3 tools/build_search.py --check
```
GitHub Actions가 PR과 `main` push마다 같은 검사를 돌리고, 통과해야 배포합니다.

## 새 책 추가하기
[`CLAUDE.md`](CLAUDE.md)의 “새 책 체크리스트”를 따릅니다. 요약하면 기존 책 폴더를 복사해 내용과 `book.json`(`ui`)을 바꾸고, `python3 tools/sync_shared.py`로 공통 코드를, 책 폴더에서 `python3 tools/seo.py`로 SEO 태그를 만든 뒤, `assets/books.js`·루트 `sitemap.xml`에 등록하고 `python3 tools/build_search.py`로 통합 검색 색인을 갱신합니다.

## 배포 (GitHub Pages)
저장소 Settings → Pages → Source를 **GitHub Actions**로 지정하면 `main`에 push할 때마다 배포됩니다. 비공개 저장소에서 Pages를 쓰려면 GitHub 유료 플랜이 필요합니다(무료 계정이면 저장소를 공개로 전환).

## 라이선스
코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0). 책별 세부 안내는 각 폴더의 `LICENSE.md`를 참고하세요.
