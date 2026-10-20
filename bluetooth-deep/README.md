# BluetoothBook 심화 — 프로토콜 스택을 끝까지 따라가는 블루투스 교과서

[BluetoothBook](../bluetooth/)의 다음 책입니다. 1권이 “무엇이 왜 그런가”를 넓게 보여 줬다면, 이 책은 그 아래로 내려가 HCI 바이트, 링크 계층 절차, 패킷 암호화와 페어링 함수, 프라이버시, L2CAP·EATT, 클래식 베이스밴드, 등시성 채널과 LE 오디오, 채널 사운딩과 방향 찾기를 **Bluetooth Core Specification 6.3의 시험 데이터로 계산을 맞춰 보며** 따라갑니다. 대상은 1권을 읽은 펌웨어·스택·칩 검증 엔지니어입니다.

모두 19장, 시뮬레이터 41개입니다.

| 장 | 파일 | 주제 | 검증 근거 |
|---|---|---|---|
| 01 | chapters/intro.html | 들어가며: 사양을 직접 읽는 책 | 광고 접근 주소의 공중 비트(§2.1.2), 3비트 예(§1.2), 리틀 엔디언, 읽는 순서의 장 존재 |
| 02 | chapters/hci.html | HCI: 호스트와 컨트롤러 사이의 바이트 | [Vol 6] Part C §1의 HCI 바이트를 해독해 사양 주석과 비교, opcode·이벤트 코드 |
| 03 | chapters/scheduling.html | 링크 계층 상태 기계와 스케줄링 | 서브레이팅·지연 규칙(사양의 21번째 이벤트 예, 그림 4.43·4.44), 스케줄러 모델의 겹침 없음 |
| 04 | chapters/procedures.html | 링크 계층 제어 절차: instant와 충돌 | [Vol 6] Part C §4.3.1·§4.3.2 완전한 패킷(공중 비트), instant·충돌 규칙 사례 |
| 05 | chapters/extadv.html | 광고 끝까지: 확장 광고, PAwR | §4.2.1 레거시 광고, §4.2.2 AUX_ADV_IND(샘플 CRC 불일치 기록), PAwR 규칙 |
| 06 | chapters/encryption.html | 링크 계층 암호화: 세션 키와 AES-CCM | [Vol 6] Part C §1의 샘플 패킷 4개(B·X·A·S 블록까지) + OpenSSL AES-CCM |
| 07 | chapters/smp.html | SMP 완전판: P-256에서 LTK까지 | [Vol 3] Part H 부록 D.1~D.12, c1·s1 예, 디버그 키, OpenSSL ECDH |
| 08 | chapters/privacy.html | 프라이버시와 필터링 | 부록 D.7(ah), 해석·필터 규칙 사례, OpenSSL AES |
| 09 | chapters/bigsec.html | BIG 보안과 BIS | [Vol 6] Part C §5(BIS 접근 주소 31개)·§6(h8, “Børne House” → GSK) |
| 10 | chapters/l2cap.html | L2CAP: 채널, 신호, 크레딧 흐름 제어 | K-frame 분할·크레딧·재설정 규칙 사례(무작위 400개) |
| 11 | chapters/gatt.html | ATT/GATT 심화: EATT, 큐 쓰기, Database Hash | Database Hash 붙이는 규칙(§7.3.1의 예), Robust Caching 전이, AES-CMAC 시험 벡터 |
| 12 | chapters/baseband.html | Classic 기저대역: 도약 커널, 접근 코드, HEC·CRC·FEC | 도약 6,144개(기본 + AFH 세 가지 × 세 주소), 동기어 130개, HEC 20개, CRC, DH1·DM1 공중 비트, 화이트닝, FEC (Part G §2~§9) |
| 13 | chapters/classicsec.html | Classic 보안: 레거시 PIN에서 Secure Connections까지 | SAFER+ E1·E21·E22·E3 31개, P-192·P-256 ECDH 12개, f1·g·f2·f3·h3·h4·h5 51개, AES-CCM 14개 (Part G §1.2, §7, §10). g P-256 예의 불일치 기록 |
| 14 | chapters/isoal.html | ISOAL과 등시성 타이밍 | 프레임 없는·있는 PDU 분할, Max_PDU 조건([Vol 6] Part G §2.2의 예 45), CIG·BIG 전송 지연 |
| 15 | chapters/leaudio.html | LE 오디오 프로파일: PACS·ASCS·BAP·CAP (Core 밖) | ASE 상태 전이(ASCS Table 3.2·§5.4), BAP Table 5.2 32개 설정의 비트레이트 재계산 |
| 16 | chapters/cs.html | Channel Sounding: 위상과 왕복 시간으로 거리 재기 | CS DRBG(h9·f7·f8·f9) 블록 9개, cr1 채널 섞기, hr1 두 바이트 경우, 접근 주소 점수(Part C §8.1.1) |
| 17 | chapters/direction.html | 방향 찾기: CTE, IQ 표본, 안테나 전환 | IQ 표본 9~82개 규칙, 패턴 반복, 이상적 신호에서 각도 복원 |
| 18 | chapters/debugging.html | 사례로 배우는 디버깅: HCI 로그에서 원인까지 | 오류 코드 69개(Part F Table 1.1), H4 해석기, 여섯 사례 로그의 길이·오류, 감독 타임아웃·instant·ATT_MTU 규칙 |
| 19 | chapters/glossary.html | 용어집 & 종합 퀴즈 | 용어마다 장 연결, 종합 퀴즈는 각 장 확인 퀴즈에서 두 문제씩 |


## 실행과 검증
```bash
python3 -m http.server 8000                       # 저장소 루트에서 → http://localhost:8000/bluetooth-deep/
node bluetooth-deep/scripts/verify-factcheck.cjs   # 계산·구조 검증
```
Classic 장(12·13)의 시험은 사양 [Vol 2] Part G의 예제 데이터를 `scripts/data/partg.json`에 옮겨 두고 대조합니다.

인용한 절·표가 사양에 있는지는 `python3 tools/check_spec_refs.py 6.3 --titles`로 확인합니다(사양 HTML을 받아 `.spec-cache/`에 둡니다).
공통 코드(`js/common.js`, `css/style.css`)는 저장소 루트 `shared/`에서 만듭니다. 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)와 저장소 루트의 `CLAUDE.md`를 따릅니다.

## 라이선스
코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0). 자세한 내용은 [LICENSE.md](LICENSE.md).
