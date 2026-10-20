# BluetoothBook — 누구나 읽는 인터랙티브 블루투스 교과서

보이지 않는 선 한 가닥의 원리. 2.4 GHz 전파와 데시벨, GFSK와 LE 1M·2M·Coded PHY, 주파수 도약과 채널 선택, 광고와 스캔, 연결과 패킷,
GATT, 페어링과 보안, 코인 전지로 몇 년 가는 전력 설계, LE 오디오와 Auracast, RSSI·AoA·채널 사운딩, 메시와 PAwR까지 —
블루투스를 배운 적 없는 사람도 **직접 패킷을 만들고 계산을 돌려 보며** 이해하도록 만든 한국어 웹 교과서입니다.
15개 챕터, 41개 시뮬레이터, “예측해 보기” 실험, 용어 151개와 종합 퀴즈로 구성됩니다.

모든 수치와 규칙의 기준은 **Bluetooth Core Specification 6.3**(2026-05-05 채택)이며, 본문에 `[Vol 6] Part B §4.5.1`처럼 근거 위치를 밝혔습니다.
CRC·화이트닝, 채널 선택 알고리즘 #2, LE Coded 부호기, AES-CMAC·g2·ah 같은 계산은 사양서의 샘플 데이터와 비트 단위로 맞춰 검증합니다.

[ConnectivityBook](../README.md) 서재의 한 권입니다. 구조·디자인 시스템·설명 방식(비유 → 그림 → 예측 → 시뮬레이터 → 수치 → 정리·퀴즈)은 [Books](https://books.euiyun.com/) 시리즈의 [NetworkBook](https://github.com/geniuskey/networkbook)을 따랐습니다.

## 실행
빌드 과정이 없는 정적 사이트입니다.

```bash
python3 -m http.server 8000   # 저장소 루트에서 → http://localhost:8000/bluetooth/
```
`index.html`을 브라우저로 바로 열어도 동작합니다(8장의 실제 P-256 키 교환은 WebCrypto가 필요해 http(s)로 열어야 합니다). 글꼴만 CDN에서 불러옵니다.

## 구성
| 장 | 파일 | 주제 | 주요 시뮬레이터 |
|---|---|---|---|
| 01 | chapters/intro.html | 블루투스란 무엇인가 | 주변 기기의 클래식/LE, Core 변경 이력 1.2~6.3, 스택 탐색 |
| 02 | chapters/radio.html | 2.4 GHz 전파와 데시벨 | 대역 지도와 LE 채널 번호, dBm 사다리, 링크 버짓, 다중 경로 페이딩 |
| 03 | chapters/phy.html | 비트를 전파에 싣기: GFSK와 PHY | GFSK 파형, 잡음 속 BER·PER, EDR 성좌도, LE Coded 부호기, PHY 비교, HDT(공개 초안) 미리 보기 |
| 04 | chapters/hopping.html | 주파수 도약과 공존 | Wi-Fi 옆 고정/도약/AFH, 채널 선택 알고리즘 #1·#2(사양 샘플 검증) |
| 05 | chapters/advertising.html | 광고와 스캔 | 31바이트 AD 구조 만들기, 발견 시간 분포 |
| 06 | chapters/connection.html | 연결: 약속된 시각의 짧은 만남 | 연결 파라미터 규칙(6.2 SCI), 패킷·CRC·화이트닝(사양 샘플 검증), SN/NESN, 처리량 |
| 07 | chapters/gatt.html | GATT: 데이터를 담는 메뉴판 | 심박계 GATT 서버 탐색, 알림 vs 표시, ATT_MTU 쪼개기 |
| 08 | chapters/security.html | 페어링과 보안 | 페어링 방식 판정(Table 2.8), 실제 P-256 + g2 숫자 비교, AES-128 RPA |
| 09 | chapters/power.html | 전력: 코인 전지로 몇 년 | 연결 이벤트 전류 파형·창 넓히기, 배터리 수명 계산기 |
| 10 | chapters/audio.html | 블루투스 오디오 | 코덱 비트레이트와 링크 여유, 지연 예산, CIS 재전송과 플러시 |
| 11 | chapters/location.html | 위치 찾기: RSSI에서 채널 사운딩까지 | RSSI 거리 오차, AoA 위상차와 모호성, 채널 사운딩 PBR + RTT |
| 12 | chapters/mesh.html | 메시와 사물 인터넷 | 관리된 플러딩(릴레이·TTL), PAwR 전자 가격표 시간표 |
| 13 | chapters/coexistence.html | 공존: 2.4 GHz를 나눠 쓰는 법 | 대역 옆 LTE와 필터·격리·차단 한도, LTE TDD 프레임 위 슬롯 정렬(순수 TDM·하이브리드), WCI-2 메시지 만들기, PTA 우선순위 |
| 14 | chapters/design.html | 제품 설계 플레이그라운드 | 심박계·태그·컨트롤러·LE 오디오 이어폰 설계와 사양 규칙 점검 |
| 15 | chapters/glossary.html | 용어집 & 종합 퀴즈 | 용어 151개(사양 위치 포함), 종합 퀴즈 |

공통 코드: `css/style.css`(디자인 토큰, 라이트/다크), `js/common.js`(내비게이션, 캔버스·차트 헬퍼, 전역 `BT`, 학습 진도 저장, 용어 툴팁), `js/terms.js`(용어 데이터).
읽은 위치·퀴즈 답은 서버 없이 브라우저의 localStorage에만 저장됩니다.
챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요. 챕터를 추가하거나 제목·설명을 바꾼 뒤에는 `bluetooth/` 폴더에서 `python3 tools/seo.py`로 canonical/OG/JSON-LD 태그와 `sitemap.xml`을 다시 만듭니다.

## 검증
```bash
node bluetooth/scripts/verify-factcheck.cjs   # 저장소 루트에서
```
챕터의 계산 함수를 꺼내 Core 6.3의 값과 샘플 데이터([Vol 6] Part C, [Vol 3] Part H Appendix D), FIPS-197·RFC 4493 예제와 맞춰 보고, 모든 인라인 스크립트가 컴파일되는지 확인합니다.

시뮬레이터는 이해를 돕기 위해 단순화한 모델이며, 전류·감도 같은 칩 의존 수치는 대표적인 크기 수준입니다. 사양이 정한 값과 칩의 대표값은 본문에서 구분해 적었습니다.

## 라이선스

코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0)으로 제공됩니다. 자세한 범위와 상표 안내는 [라이선스 안내](LICENSE.md)를 참고하세요.
