# UWBBook — 누구나 읽는 인터랙티브 UWB 교과서

빛의 시간으로 재는 거리. 펄스와 대역폭, 499.2 MHz 채널과 −41.3 dBm/MHz 규제, HRP 프레임(프리앰블·SFD·STS), 15.65 ps 타임스탬프와 안테나 지연,
단방향·양방향 거리 측정(SS·DS-TWR), 다중 경로와 첫 경로(NLOS), 위상으로 재는 각도(PDoA·AoA), 삼변 측량과 TDoA, STS와 중계 방어,
FiRa 세션(RSTU·슬롯·라운드·UCI), BLE와 함께 쓰는 전력과 공존, 디지털 키와 정밀 찾기까지 —
UWB를 배운 적 없는 사람도 **직접 계산을 돌려 보며** 이해하도록 만든 한국어 웹 교과서입니다.
15개 챕터, 33개 시뮬레이터, “예측해 보기” 실험, 용어 41개와 종합 퀴즈로 구성됩니다.

IEEE 802.15.4z·FiRa·CCC 원문은 유료이거나 회원 전용이라 직접 확인하지 못했습니다. 대신 표준을 구현한 **공개 소스 코드와 공개 법령**을 1차 근거로 삼았습니다:
Android UWB 스택(`packages/modules/Uwb`, `external/uwb`), Decawave(Qorvo)의 `uwb-core`·`uwb-dw1000`, Zephyr RTOS의 IEEE 802.15.4 헤더와 DW1000 드라이버,
미국 연방 규정 47 CFR Part 15 Subpart F. 조항 번호는 소스 코드 주석이 인용한 경우에만 적었고, 공개 구현끼리 값이 다르면(예: `uwb-core`의 4번 채널 주파수) 근거를 비교해 밝혔습니다.

[yalexBook](../README.md) 서재의 한 권입니다. 구조·디자인 시스템·설명 방식(비유 → 그림 → 예측 → 시뮬레이터 → 수치 → 정리·퀴즈)은 [Books](https://books.euiyun.com/) 시리즈의 [NetworkBook](https://github.com/geniuskey/networkbook)을 따랐습니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # 저장소 루트에서 → http://localhost:8000/uwb/
```

## 구성
| 장 | 파일 | 주제 | 주요 시뮬레이터 |
|---|---|---|---|
| 01 | chapters/intro.html | UWB란 무엇인가 | 신호 세기 대 비행시간 오차, UWB 연표 |
| 02 | chapters/pulse.html | 펄스와 대역폭: 짧을수록 넓다 | 펄스 길이와 스펙트럼(수치 푸리에 검증), 두 경로 갈라내기, UWB 판정(47 CFR §15.503) |
| 03 | chapters/channels.html | 채널과 전파 규칙 | 3~10 GHz 이웃 지도, 규제가 정하는 출력과 거리(uwb_rng_path_loss) |
| 04 | chapters/frame.html | HRP 프레임: 프리앰블·SFD·STS | 프리앰블 심볼 시간(Zephyr 상수 검증), 상관 누적, 프레임 공중 시간(DW1000 식 검증) |
| 05 | chapters/timestamp.html | 시계와 타임스탬프: 15.65 피코초 | 시간 눈금 확대경, 안테나 지연, ppm × 응답 시간 |
| 06 | chapters/twr.html | 양방향 거리 측정: SS-TWR와 DS-TWR | 타임라인과 오차, uwb-core 시험 타임스탬프 계산기 |
| 07 | chapters/multipath.html | 다중 경로와 첫 경로 | 방 안의 경로와 CIR, LOS 가능성(dw1000_estimate_los) |
| 08 | chapters/aoa.html | 방향 찾기: PDoA와 AoA | 평면파와 두 안테나(uwb_calc_aoa), 모호성, 각도별 정확도 |
| 09 | chapters/position.html | 위치 찾기: 삼변 측량과 TDoA | 삼변 측량과 DOP 지도, 쌍곡선 TDoA |
| 10 | chapters/security.html | 안전한 거리: STS와 중계 방어 | 세기 판단 대 시간 판단, STS 맞히기 확률, STS 설정 |
| 11 | chapters/fira.html | FiRa 세션: 라운드·슬롯·역할 | 라운드 시간표(Android 기본값), UCI 세션 일생, 라운드 도약 |
| 12 | chapters/power.html | 전력과 공존: BLE가 깨우는 UWB | 태그 배터리 계산기, 와이파이와 겹쳐 잃는 측정 |
| 13 | chapters/apps.html | 디지털 키와 정밀 찾기 | 차 주변 구역 판정, 정밀 찾기 화면 |
| 14 | chapters/design.html | 실내 측위 설계 플레이그라운드 | 앵커 배치·방식별 오차·태그 한계·배터리 |
| 15 | chapters/glossary.html | 용어집 & 종합 퀴즈 | 용어 41개, 종합 퀴즈 28문제 |

공통 코드: `css/style.css`, `js/common.js`(전역 `UW`), `js/terms.js`. 읽은 위치·퀴즈 답은 브라우저 localStorage에만 저장됩니다.
챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요. 챕터를 추가하거나 제목·설명을 바꾼 뒤에는 `uwb/` 폴더에서 `python3 tools/seo.py`를 실행합니다.

## 검증
```bash
node uwb/scripts/verify-factcheck.cjs   # 저장소 루트에서
```
챕터의 계산 함수를 꺼내 Decawave `uwb-core`의 자체 시험(`calc_tof_test.c`의 SS·DS 타임스탬프와 32비트 넘침 경우, `tof_to_meters_test.c`),
`uwb-dw1000`의 프레임 시간·NLOS 식, Zephyr의 심볼 시간·타임스탬프 상수, Android의 채널·슬롯·RSTU 기본값, `uwb_calc_aoa()`·`uwb_rng_path_loss()` 식과 맞춰 보고,
모든 인라인 스크립트가 컴파일되는지, 본문의 모든 용어가 용어집에 있는지 확인합니다.

시뮬레이터는 이해를 돕기 위해 단순화한 모델이며, 전류·벽 손실·위상 잡음·수신 감도 같은 칩·환경 의존 수치는 예시 값입니다. 코드로 확인한 값과 어림값은 본문에서 구분해 적었습니다.

## 라이선스

코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 자세한 범위와 상표 안내는 [라이선스 안내](LICENSE.md)를 참고하세요.
