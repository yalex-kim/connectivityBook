# GNSSBook — 누구나 읽는 인터랙티브 GNSS 교과서

하늘의 시계로 아는 위치. 2만 km 위의 궤도와 스카이 플롯, 10.23 MHz에서 나온 L1·L2·L5와 상대론 보정, C/A 코드(골드 코드),
코드 위상 × 도플러 탐색과 첫 위치 시간, DLL·PLL 추적과 다중 경로, 50 bps 항법 메시지와 GPS 시간(주 번호 넘침·윤초),
궤도력으로 위성 좌표 계산, 의사거리 최소 제곱과 DOP, 클로부차·사스타모이넨 모델과 전리층 제거 조합, 빌딩 숲과 NLOS,
DGNSS·SBAS·RTK·PPP, 휴대폰의 원시 측정값까지 —
GNSS를 배운 적 없는 사람도 **직접 계산을 돌려 보며** 이해하도록 만든 한국어 웹 교과서입니다.
15개 챕터, 32개 시뮬레이터, “예측해 보기” 실험, 용어 46개와 종합 퀴즈로 구성됩니다.

GPS와 Galileo의 신호 규격은 무료로 공개되어 있어 **원문 규격**을 1차 근거로 삼았습니다:
IS-GPS-200N(2022, 공개 배포), Galileo OS SIS ICD Issue 2.2(2025). 계산은 공개 구현 **RTKLIB**(BSD-2)의 함수와 맞춰 보고,
휴대폰 부분은 Android의 `GnssStatus`·`GnssClock`·`GnssMeasurement` 정의를 따랐습니다. 규격의 표·그림·절 번호와 쪽수를 본문에 밝혔습니다.

[ConnectivityBook](../README.md) 서재의 한 권입니다. 구조·디자인 시스템·설명 방식(비유 → 그림 → 예측 → 시뮬레이터 → 수치 → 정리·퀴즈)은 [Books](https://books.euiyun.com/) 시리즈의 [NetworkBook](https://github.com/geniuskey/networkbook)을 따랐습니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # 저장소 루트에서 → http://localhost:8000/gnss/
```

## 구성
| 장 | 파일 | 주제 | 주요 시뮬레이터 |
|---|---|---|---|
| 01 | chapters/intro.html | GNSS란 무엇인가 | 시계 오차를 맞혀 원 모으기, GNSS 연표 |
| 02 | chapters/orbits.html | 궤도: 2만 km 위의 별자리 | 고도·주기·속도, 스카이 플롯(GPS·Galileo 이상 궤도) |
| 03 | chapters/signals.html | 신호와 주파수 | 상대론 보정(ICD 3.3.1.1 재현), C/N0와 적분 이득, BPSK·BOC 스펙트럼 |
| 04 | chapters/prn.html | PRN 코드 | C/A 코드 발생기(ICD 표 3-Ia 37개 검증), 상관 |
| 05 | chapters/acquisition.html | 신호 찾기 | 코드 위상 × 도플러 격자, 시동 방식별 TTFF |
| 06 | chapters/tracking.html | 추적 | 얼리·프롬프트·레이트와 다중 경로, C/N0별 측정 잡음 |
| 07 | chapters/navmsg.html | 항법 메시지와 GPS 시간 | 프레임 탐색기, 해밍 패리티(RTKLIB decode_word 검증), GPS 주·주내 초 |
| 08 | chapters/satpos.html | 위성 위치 계산 | 궤도력 → 좌표(RTKLIB eph2pos 검증), 지구 자전 보정 |
| 09 | chapters/position.html | 위치 계산과 DOP | 최소 제곱 반복, 위성을 켜고 끄며 보는 DOP(RTKLIB dops 검증) |
| 10 | chapters/errors.html | 오차의 지도 | 클로부차·사스타모이넨(RTKLIB 검증), 전리층 제거 조합, 오차 예산 |
| 11 | chapters/urban.html | 도시와 실내 | 빌딩 사이의 하늘과 NLOS, 실내 감도 |
| 12 | chapters/precise.html | 정밀 측위 | 기준국 거리와 남는 오차, 정수 모호성 확정 확률 |
| 13 | chapters/phone.html | 휴대폰 속 GNSS | GnssClock + GnssMeasurement → 의사거리, 듀티 사이클, 관성 항법 |
| 14 | chapters/design.html | GNSS 설계 플레이그라운드 | 위성군·주파수·보강·환경별 위성 수·DOP·정확도 |
| 15 | chapters/glossary.html | 용어집 & 종합 퀴즈 | 용어 46개, 종합 퀴즈 27문제 |

공통 코드: `css/style.css`, `js/common.js`(전역 `GN`), `js/terms.js`. 읽은 위치·퀴즈 답은 브라우저 localStorage에만 저장됩니다.
챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요. 챕터를 추가하거나 제목·설명을 바꾼 뒤에는 `gnss/` 폴더에서 `python3 tools/seo.py`를 실행합니다.

## 검증
```bash
node gnss/scripts/verify-factcheck.cjs   # 저장소 루트에서
```
챕터의 계산 함수를 꺼내 IS-GPS-200N의 C/A 코드 표(37개 위성의 처음 10칩), 상대론 주파수 오프셋, 패리티 식, 위성 위치 알고리즘(표 20-IV)과,
RTKLIB의 `eph2pos()`·`ionmodel()`·`tropmodel()`·`dops()`·`decode_word()`를 옮긴 코드에 무작위 입력 수백~수천 개를 넣어 맞춰 보고,
모든 인라인 스크립트가 컴파일되는지, 본문의 모든 용어가 용어집에 있는지 확인합니다.

시뮬레이터는 이해를 돕기 위해 단순화한 모델이며(이상적인 원 궤도 별자리, 단순한 빌딩 모양 등), 잡음 지수·전류·센서 치우침 같은 칩·환경 의존 수치는 예시 값입니다. 규격으로 확인한 값과 어림값은 본문에서 구분해 적었습니다.

## 라이선스

코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 자세한 범위와 상표 안내는 [라이선스 안내](LICENSE.md)를 참고하세요.
