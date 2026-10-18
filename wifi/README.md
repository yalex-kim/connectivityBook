# WiFiBook — 누구나 읽는 인터랙티브 와이파이 교과서

공기를 나눠 쓰는 기술. 2.4·5·6 GHz 대역과 채널, OFDM과 보호 구간, 변조와 MCS, MIMO와 빔포밍, 듣고 기다리고 말하는 CSMA/CA와 EDCA,
프레임 해부, 묶음 전송과 블록 ACK, 연결과 로밍, WPA2·WPA3 보안, 절전, Wi-Fi 6의 OFDMA와 BSS 컬러링, Wi-Fi 7의 MLO와 펑처링까지 —
와이파이를 배운 적 없는 사람도 **직접 계산을 돌려 보며** 이해하도록 만든 한국어 웹 교과서입니다.
15개 챕터, 36개 시뮬레이터, “예측해 보기” 실험, 용어 85개와 종합 퀴즈로 구성됩니다.

IEEE 802.11 원문은 로그인이 필요해 직접 확인하지 못했습니다. 대신 표준을 그대로 구현한 **공개 소스 코드**를 1차 근거로 삼았습니다:
Linux 커널 무선 스택(`net/wireless`, `net/mac80211`, `include/linux/ieee80211*.h`, ath9k·mt76 드라이버)과 hostapd·wpa_supplicant.
본문에 `net/wireless/util.c`의 `ieee80211_channel_to_freq_khz()`처럼 출처를 밝혔고, 조항 번호는 소스 코드 주석이 인용한 경우에만 적었습니다.
채널↔주파수, HT·VHT·HE·EHT 링크 속도, 전송 시간, 머리말 길이, TIM 인코딩, 펑처링 패턴, PBKDF2·PRF 같은 계산은 이 코드와 시험 벡터에 맞춰 자동으로 검증합니다.

[yalexBook](../README.md) 서재의 한 권입니다. 구조·디자인 시스템·설명 방식(비유 → 그림 → 예측 → 시뮬레이터 → 수치 → 정리·퀴즈)은 [Books](https://books.euiyun.com/) 시리즈의 [NetworkBook](https://github.com/geniuskey/networkbook)을 따랐습니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # 저장소 루트에서 → http://localhost:8000/wifi/
```
`index.html`을 브라우저로 바로 열어도 동작합니다. 글꼴만 CDN에서 불러옵니다.

## 구성
| 장 | 파일 | 주제 | 주요 시뮬레이터 |
|---|---|---|---|
| 01 | chapters/intro.html | 와이파이란 무엇인가 | 세대 연표와 링크 속도, Wi-Fi 목록 해부(SSID·BSSID·ESS) |
| 02 | chapters/bands.html | 대역과 채널: 2.4·5·6 GHz | 채널↔주파수 변환(커널 검증), 2.4 GHz 이웃 채널 고르기, 6 GHz 채널·PSC 계획 |
| 03 | chapters/ofdm.html | OFDM: 수천 개의 부반송파 | 직교성과 주파수 오차, 보호 구간과 반사파, 세대별 수치 비교 |
| 04 | chapters/mcs.html | 변조와 MCS: 속도는 어디서 오나 | 성좌도와 잡음, 링크 속도 계산기(커널 1,000여 조합 검증), 거리별 계단 |
| 05 | chapters/mimo.html | MIMO와 빔포밍 | 다이버시티와 끊길 확률, 공간 다중화 용량, 배열 빔과 MU-MIMO 널 |
| 06 | chapters/access.html | 채널 차지하기: CSMA/CA와 EDCA | 프레임 교환 시간(커널 전송 시간 검증), 백오프 경쟁(Bianchi 모델 비교), EDCA 범주 경쟁 |
| 07 | chapters/frames.html | 프레임 해부 | 바이트 단위 프레임 해부 도구(FC 비트·주소·FCS), 비컨 공중 시간 |
| 08 | chapters/throughput.html | 실제 속도: 묶음 전송과 블록 ACK | 묶음 크기와 처리량, 블록 ACK 비트맵, 패킷 공평 대 공중 시간 공평 |
| 09 | chapters/connect.html | 연결과 로밍 | 전체 스캔 시간, 연결 과정 따라가기, 복도 로밍(wpa_supplicant 규칙) |
| 10 | chapters/security.html | 보안: WEP에서 WPA3까지 | 비밀번호 → PMK → PTK 계산기(hostapd 시험 벡터), 4-way 핸드셰이크, 설정 고르기 |
| 11 | chapters/power.html | 전력 절약: 잠자는 단말 | TIM 요소 인코더(mac80211 검증), 깨는 간격과 배터리 |
| 12 | chapters/wifi6.html | Wi-Fi 6: OFDMA와 다중 사용자 | RU로 채널 나누기, 단일 사용자 대 OFDMA, BSS 컬러와 공간 재사용 |
| 13 | chapters/wifi7.html | Wi-Fi 7과 그다음 | MLO 꼬리 지연, 프리앰블 펑처링(커널 허용 패턴), Wi-Fi 8(초안) |
| 14 | chapters/design.html | 우리 집 와이파이 설계 플레이그라운드 | 평면도 위 공유기·메시 배치와 방별 예상 속도 |
| 15 | chapters/glossary.html | 용어집 & 종합 퀴즈 | 용어 85개, 종합 퀴즈 39문제 |

공통 코드: `css/style.css`(디자인 토큰, 라이트/다크), `js/common.js`(내비게이션, 캔버스·차트 헬퍼, 전역 `WF`, 학습 진도 저장, 용어 툴팁), `js/terms.js`(용어 데이터).
읽은 위치·퀴즈 답은 서버 없이 브라우저의 localStorage에만 저장됩니다. 10장의 키 계산도 브라우저 안에서만 합니다.
챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요. 챕터를 추가하거나 제목·설명을 바꾼 뒤에는 `wifi/` 폴더에서 `python3 tools/seo.py`로 canonical/OG/JSON-LD 태그와 `sitemap.xml`을 다시 만듭니다.

## 검증
```bash
node wifi/scripts/verify-factcheck.cjs   # 저장소 루트에서
```
챕터의 계산 함수를 꺼내 Linux 커널 코드를 옮긴 참조 구현(채널 변환, `cfg80211_calculate_bitrate_*`, `ieee80211_frame_duration`, `ieee80211_hdrlen`, TIM 인코딩, 펑처링 표)과
hostapd 시험 벡터(PBKDF2 passphrase_tests, sha1_prf prf0~prf2)에 맞춰 보고, 모든 인라인 스크립트가 컴파일되는지, 본문의 모든 용어가 용어집에 있는지 확인합니다.

시뮬레이터는 이해를 돕기 위해 단순화한 모델이며, 전류·벽 손실·필요 SNR 같은 환경·칩 의존 수치는 대표적인 크기 수준입니다. 코드로 확인한 값과 어림값은 본문에서 구분해 적었습니다.
Wi-Fi 8(802.11bn)은 초안 단계라 방향만 소개합니다.

## 라이선스

코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 자세한 범위와 상표 안내는 [라이선스 안내](LICENSE.md)를 참고하세요.
