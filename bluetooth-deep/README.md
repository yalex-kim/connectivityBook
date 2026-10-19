# BluetoothBook 심화 — 프로토콜 스택을 끝까지 따라가는 블루투스 교과서

[BluetoothBook](../bluetooth/)의 다음 책입니다. 1권이 “무엇이 왜 그런가”를 넓게 보여 줬다면, 이 책은 그 아래로 내려가 HCI 바이트, 링크 계층 절차, 패킷 암호화와 페어링 함수, 프라이버시, L2CAP·EATT, 클래식 베이스밴드, 등시성 채널과 LE 오디오, 채널 사운딩과 방향 찾기를 **Bluetooth Core Specification 6.3의 시험 데이터로 계산을 맞춰 보며** 따라갑니다. 대상은 1권을 읽은 펌웨어·스택·칩 검증 엔지니어입니다.

**집필 중**입니다. 부(部) 단위로 나눠 씁니다.

| 장 | 파일 | 주제 | 검증 근거 |
|---|---|---|---|
| 02 | chapters/hci.html | HCI: 호스트와 컨트롤러 사이의 바이트 | [Vol 6] Part C §1의 HCI 바이트를 해독해 사양 주석과 비교, opcode·이벤트 코드 |
| 03 | chapters/scheduling.html | 링크 계층 상태 기계와 스케줄링 | 서브레이팅·지연 규칙(사양의 21번째 이벤트 예, 그림 4.43·4.44), 스케줄러 모델의 겹침 없음 |
| 04 | chapters/procedures.html | 링크 계층 제어 절차: instant와 충돌 | [Vol 6] Part C §4.3.1·§4.3.2 완전한 패킷(공중 비트), instant·충돌 규칙 사례 |
| 05 | chapters/extadv.html | 광고 끝까지: 확장 광고, PAwR | §4.2.1 레거시 광고, §4.2.2 AUX_ADV_IND(샘플 CRC 불일치 기록), PAwR 규칙 |
| 06 | chapters/encryption.html | 링크 계층 암호화: 세션 키와 AES-CCM | [Vol 6] Part C §1의 샘플 패킷 4개(B·X·A·S 블록까지) + OpenSSL AES-CCM |
| 07 | chapters/smp.html | SMP 완전판: P-256에서 LTK까지 | [Vol 3] Part H 부록 D.1~D.12, c1·s1 예, 디버그 키, OpenSSL ECDH |
| 08 | chapters/privacy.html | 프라이버시와 필터링 | 부록 D.7(ah), 해석·필터 규칙 사례, OpenSSL AES |
| 09 | chapters/bigsec.html | BIG 보안과 BIS | [Vol 6] Part C §5(BIS 접근 주소 31개)·§6(h8, “Børne House” → GSK) |

계획 전체(19장)는 책 홈(`index.html`)에 있습니다.

## 실행과 검증
```bash
python3 -m http.server 8000                       # 저장소 루트에서 → http://localhost:8000/bluetooth-deep/
node bluetooth-deep/scripts/verify-factcheck.cjs   # 계산·구조 검증
```
공통 코드(`js/common.js`, `css/style.css`)는 저장소 루트 `shared/`에서 만듭니다. 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)와 저장소 루트의 `CLAUDE.md`를 따릅니다.

## 라이선스
코드는 [MIT](LICENSE-MIT), 교재 콘텐츠는 [CC BY 4.0](LICENSE-CC-BY-4.0). 자세한 내용은 [LICENSE.md](LICENSE.md).
