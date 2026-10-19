/* BluetoothBook 심화 용어 데이터 — [한국어, 영어, 설명, 장 slug]
   용어집(glossary.html)과 본문 용어 툴팁(common.js)이 함께 쓴다. 설명 끝의 [Vol x] Part y §z는 Bluetooth Core Specification 6.3의 근거 위치다. */
window.BD_TERMS = [
  // 06 encryption
  ["LTK", "Long Term Key", "페어링으로 만들어 본딩 때 저장하는 128비트 키. 링크 계층은 이것으로 패킷을 직접 잠그지 않고 연결마다 세션 키를 만든다. [Vol 3] Part H §2.4", "encryption"],
  ["세션 키", "Session Key (SK)", "연결마다 새로 만드는 암호화 키. SK = e(LTK, SKD_P ‖ SKD_C). SKD는 양쪽이 반씩 낸 무작위 값이다. [Vol 6] Part B §5.1.3.1", "encryption"],
  ["SKD", "Session Key Diversifier", "세션 키를 만들 때 LTK로 암호화하는 16바이트. 센트럴의 SKD_C 8바이트와 페리페럴의 SKD_P 8바이트를 이어 붙인다. [Vol 6] Part B §5.1.3.1", "encryption"],
  ["IV", "Initialization Vector", "nonce에 들어가는 8바이트. IV_P ‖ IV_C. 키를 새로 시작할 때마다 새 값을 쓴다. CIS·BIS는 아래 32비트를 접근 주소와 XOR한다. [Vol 6] Part E §2.1", "encryption"],
  ["AES-CCM", "Counter with CBC-MAC", "AES로 인증(CBC-MAC)과 암호화(카운터 모드)를 함께 하는 방식. LE는 MIC 4바이트(M = 4), 길이 칸 2바이트(L = 2). [Vol 6] Part E §1", "encryption"],
  ["nonce", "CCM nonce", "패킷마다 한 번만 쓰는 13바이트. packetCounter 39비트 + directionBit + IV 8바이트. [Vol 6] Part E Table 2.1", "encryption"],
  ["packetCounter", "packetCounter", "방향마다 따로 세는 39비트 카운터. 암호화 시작 때 0, 새 PDU마다 1씩 늘고 재전송에는 그대로. [Vol 6] Part E §2.1", "encryption"],
  ["MIC", "Message Integrity Check", "CCM이 붙이는 4바이트 인증값. 헤더 첫 바이트(NESN·SN·MD 제외)와 페이로드를 덮는다. 틀리면 연결이 끊긴다(0x3D). [Vol 6] Part E §1·§2.2", "encryption"],
  // 07 smp
  ["DHKey", "Diffie-Hellman Key", "P-256 ECDH로 만든 공유 비밀(점의 x 좌표 32바이트). f5의 입력. [Vol 3] Part H §2.3.5.6.1", "smp"],
  ["공개 키 검증", "Public key validation", "받은 P-256 공개 키가 곡선 위의 점인지 확인하는 의무 검사. 실패하면 DHKey Check Failed. [Vol 3] Part H §2.3.5.6.1", "smp"],
  ["디버그 키", "Debug key", "시험 장비용으로 개인 키가 공개된 고정 P-256 키 쌍. 한쪽만 써도 LTK가 드러난다. [Vol 3] Part H §2.3.5.6.1", "smp"],
  ["약속값", "Confirm value (f4)", "nonce를 공개하기 전에 보내는 f4 결과. 상대의 값을 본 뒤 자기 값을 바꾸지 못하게 묶는다. [Vol 3] Part H §2.2.6", "smp"],
  ["MacKey", "MacKey", "f5의 위쪽 128비트(카운터 0). 인증 2단계 확인값 f6의 키. [Vol 3] Part H §2.2.7", "smp"],
  ["DHKey 확인값", "DHKey Check (f6)", "인증 2단계에서 교환하는 Ea·Eb. 같은 DHKey와 바뀌지 않은 IOcap·주소를 증명한다. [Vol 3] Part H §2.2.8", "smp"],
  ["CTKD", "Cross-Transport Key Derivation", "한쪽 전송(LE/클래식)의 SC 키에서 다른 쪽 키를 h6·h7로 유도하는 것. CT2 = 1이면 h7을 쓴다. [Vol 3] Part H §2.4.2.4·§2.4.2.5", "smp"],
  ["CT2", "CT2 bit", "Pairing Request/Response 인증 요구의 비트. 양쪽 모두 1이면 CTKD에 h7을 쓴다. [Vol 3] Part H §2.4.2.4", "smp"],
  // 08 privacy
  ["RPA", "Resolvable Private Address", "IRK를 가진 기기만 알아볼 수 있는 임의 주소. 위 두 비트 01, prand ‖ ah(IRK, prand). [Vol 6] Part B §1.3.2.2", "privacy"],
  ["IRK", "Identity Resolving Key", "RPA를 만들고 푸는 128비트 키. 페어링 3단계에서 신원 주소와 함께 나눈다. [Vol 3] Part H §3.6.4", "privacy"],
  ["신원 주소", "Identity Address", "기기의 공개 주소나 정적 임의 주소. 본딩 데이터와 해석 목록의 열쇠. [Vol 6] Part B §4.7", "privacy"],
  ["해석 목록", "Resolving List", "컨트롤러가 가진 {상대 신원 주소, 상대 IRK, 내 IRK} 레코드 목록. 호스트를 깨우지 않고 RPA를 푼다. [Vol 6] Part B §4.7", "privacy"],
  ["필터 수용 목록", "Filter Accept List", "필터 정책이 쓰는 아는 기기 주소 목록(옛 이름 White List). [Vol 6] Part B §4.3.1", "privacy"],
  ["네트워크 프라이버시 모드", "Network Privacy Mode", "해석 목록 레코드의 기본 모드. 상대가 RPA로 올 때만 받고 신원 주소로 오면 버린다. [Vol 6] Part B §4.7", "privacy"],
  ["기기 프라이버시 모드", "Device Privacy Mode", "상대의 신원 주소와 RPA를 모두 받는 모드. RPA를 쓰지 않을 때가 있는 기기용. [Vol 6] Part B §4.7", "privacy"],
  // 09 bigsec
  ["방송 코드", "Broadcast_Code", "암호화된 BIG의 공유 비밀. 화면에서는 UTF-8 4~16옥텟 문자열(“Bluetooth Privacy Code”), 그 아래에서는 작은 바이트부터 채운 128비트 값. [Vol 3] Part C §3.2.6", "bigsec"],
  ["GSK", "Group Session Key", "BIS를 암호화하는 키. GSK = h8(GLTK, GSKD, “BIG3”). [Vol 6] Part E §1.1.2", "bigsec"],
  ["GSKD", "Group Session Key Diversifier", "암호화된 BIG마다 컨트롤러가 새로 뽑아 BIGInfo에 싣는 128비트. 같은 방송 코드에서도 GSK가 달라진다. [Vol 6] Part B §4.4.6.10", "bigsec"],
  ["GIV", "Group Initialization Vector", "BIGInfo에 싣는 64비트. BIS의 IV는 GIV의 아래 32비트를 그 BIS의 접근 주소와 XOR한 값. [Vol 6] Part E §2.1", "bigsec"],
  ["시드 접근 주소", "Seed Access Address (SAA)", "BIGInfo에 싣는 32비트. BIS마다 SAA ⊕ DW(n)으로 접근 주소를 만든다. [Vol 6] Part B §2.1.2", "bigsec"],
];

/* 본문 표기 → 용어집 표제어 */
window.BD_TERM_ALIAS = {};
