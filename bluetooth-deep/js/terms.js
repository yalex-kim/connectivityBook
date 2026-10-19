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
  // 02 hci
  ["HCI", "Host Controller Interface", "호스트와 컨트롤러가 명령·이벤트·데이터를 주고받는 표준 형식. [Vol 4] Part E", "hci"],
  ["H4", "HCI UART packet indicator", "UART 하나로 HCI 패킷을 섞어 보낼 때 앞에 붙이는 1바이트(명령 01, ACL 02, 동기 03, 이벤트 04, ISO 05). [Vol 4] Part A §2", "hci"],
  ["OGF", "Opcode Group Field", "HCI 명령 opcode의 위 6비트. LE 명령은 0x08. [Vol 4] Part E §5.4.1", "hci"],
  ["OCF", "Opcode Command Field", "HCI 명령 opcode의 아래 10비트. [Vol 4] Part E §5.4.1", "hci"],
  ["Command Complete", "HCI_Command_Complete", "명령을 마쳤고 반환값을 싣는 이벤트(0x0E). 명령 크레딧 Num_HCI_Command_Packets를 함께 준다. [Vol 4] Part E §7.7.14", "hci"],
  ["Command Status", "HCI_Command_Status", "명령을 받아 시작했음을 알리는 이벤트(0x0F). 결과는 나중에 다른 이벤트로 온다. [Vol 4] Part E §7.7.15", "hci"],
  ["Number Of Completed Packets", "HCI_Number_Of_Completed_Packets", "컨트롤러가 비운 데이터 버퍼 수를 핸들별로 돌려주는 이벤트(0x13). 호스트의 데이터 크레딧. [Vol 4] Part E §7.7.19", "hci"],
  ["LE Meta 이벤트", "HCI_LE_Meta event", "모든 LE 이벤트를 싣는 이벤트 코드 0x3E. 첫 바이트가 서브이벤트 코드. [Vol 4] Part E §7.7.65", "hci"],
  // 03 scheduling
  ["앵커 포인트", "Anchor point", "연결 이벤트의 시작 시각. 센트럴은 보낼 것이 있으면 여기서 첫 PDU를 보낸다. [Vol 6] Part B §4.5.1", "scheduling"],
  ["connEventCounter", "connEventCounter", "두 기기가 함께 세는 16비트 연결 이벤트 번호. 건너뛴 이벤트도 센다. 절차의 instant 기준. [Vol 6] Part B §4.5.1", "scheduling"],
  ["서브레이팅", "Connection subrating", "(이벤트 번호 − base)가 factor의 배수인 이벤트만 쓰는 것. 연결 간격을 바꾸지 않고 이벤트를 줄인다. [Vol 6] Part B §4.5.1", "scheduling"],
  ["연속 이벤트", "Continuation event", "직전 continuation개 이벤트에 데이터가 오갔을 때 다음 서브레이트 이벤트를 기다리지 않고 쓰는 이벤트. [Vol 6] Part B §4.5.1", "scheduling"],
  ["T_MCES", "Minimum Connection Event Spacing", "이벤트의 마지막 패킷과 다음 앵커 포인트 사이 최소 간격. 기본 150 µs. [Vol 6] Part B §4.1.5", "scheduling"],
  // 04 procedures
  ["LL 제어 PDU", "LL Control PDU", "LLID가 0b11인 데이터 PDU. 첫 바이트 opcode로 연결 갱신·채널 맵·암호화 등 절차를 나른다. [Vol 6] Part B §2.4.2", "procedures"],
  ["instant", "Instant", "새 파라미터를 쓰기 시작할 connEventCount. 센트럴이 고르고 mod 65536으로 비교한다. 지난 instant의 연결 갱신은 0x28로 끊긴다. [Vol 6] Part B §5.5", "procedures"],
  ["전송 창", "Transmit window", "연결 갱신 뒤 센트럴의 첫 패킷이 들어갈 구간. instant 직전 앵커 + 옛 간격 + WinOffset에서 WinSize만큼. [Vol 6] Part B §5.1.1", "procedures"],
  ["절차 충돌", "Procedure collision", "양립할 수 없는 두 절차를 양쪽이 동시에 시작한 상황. 센트럴이 거절하고 페리페럴이 양보한다(0x23·0x2A). [Vol 6] Part B §5.3", "procedures"],
  // 05 extadv
  ["확장 광고", "Extended advertising", "주 채널의 ADV_EXT_IND가 보조 채널의 AUX_ADV_IND를 가리키고, 길면 AUX_CHAIN_IND로 잇는 광고. 호스트 데이터 최대 1650바이트. [Vol 6] Part B §2.3.4", "extadv"],
  ["AuxPtr", "Auxiliary pointer", "다음 보조 패킷의 채널·시각·PHY를 담는 3바이트. 오프셋 단위 30 µs 또는 300 µs. [Vol 6] Part B §2.3.4.5", "extadv"],
  ["ADI", "AdvDataInfo", "광고 묶음 번호 SID 4비트와 데이터 판 번호 DID 12비트. DID가 같으면 같은 데이터로 본다. [Vol 6] Part B §2.3.4.4", "extadv"],
  ["T_MAFS", "Minimum AUX Frame Space", "AuxPtr를 실은 패킷의 끝과 그것이 가리키는 보조 패킷 시작 사이 최소 300 µs. [Vol 6] Part B §4.1.2", "extadv"],
  ["SyncInfo", "SyncInfo", "주기적 광고 열차에 동기화하는 데 필요한 18바이트(오프셋, 주기, 채널 맵, 접근 주소 등). [Vol 6] Part B §2.3.4.6", "extadv"],
  ["PAST", "Periodic Advertising Sync Transfer", "이미 동기화한 기기가 연결로 SyncInfo를 넘겨 상대가 스캔 없이 동기화하게 하는 절차. [Vol 6] Part B §5.1.13", "extadv"],
  // 10 l2cap
  ["CID", "Channel Identifier", "L2CAP 채널 번호. LE 고정 채널은 ATT 0x0004, 신호 0x0005, SMP 0x0006, 동적 채널은 0x0040~0x007F. [Vol 3] Part A §2.1", "l2cap"],
  ["K-frame", "Credit-based frame", "크레딧 기반 채널의 L2CAP PDU. 첫 조각에만 SDU 길이 2바이트를 싣는다. 하나 보낼 때 크레딧 하나. [Vol 3] Part A §3.4", "l2cap"],
  ["MPS", "Maximum PDU Payload Size", "받을 수 있는 가장 큰 K-frame 페이로드. LE 크레딧 기반 최소 23, ECFC 최소 64. [Vol 3] Part A §4.22·§4.25", "l2cap"],
  ["크레딧", "Credits", "상대가 보내도 되는 K-frame 수. 0에서 받거나 65535를 넘으면 채널을 끊는다. [Vol 3] Part A §10.1", "l2cap"],
  ["ECFC", "Enhanced Credit Based Flow Control", "LE와 클래식에서 쓰는 크레딧 기반 방식. 요청 하나로 채널 최대 5개, MTU·MPS ≥ 64, 재설정 가능. EATT가 쓴다. [Vol 3] Part A §10.2", "l2cap"],
  ["SPSM", "Simplified Protocol/Service Multiplexer", "크레딧 기반 채널을 열 때 고르는 서비스 번호. 0x0001~0x007F SIG 할당, 0x0080~0x00FF 동적. [Vol 3] Part A §4.22", "l2cap"],
  // 11 gatt
  ["ATT 베어러", "ATT bearer", "ATT PDU가 오가는 L2CAP 채널. 고정 채널 0x0004 하나(일반) 또는 ECFC 채널 여럿(EATT). 순차 규칙은 베어러마다. [Vol 3] Part F §3.2.11", "gatt"],
  ["EATT", "Enhanced ATT", "ECFC 채널 여러 개를 ATT 베어러로 쓰는 것. 병렬 트랜잭션, ATT_MTU ≥ 64, 알림을 버리지 않음. [Vol 3] Part G §5.3", "gatt"],
  ["큐 쓰기", "Queued writes", "Prepare Write로 조각을 서버 대기열에 넣고 Execute Write로 한꺼번에 반영(또는 취소)하는 쓰기. [Vol 3] Part F §3.4.6", "gatt"],
  ["Database Hash", "Database Hash", "서비스 구조를 요약한 128비트 값(키 0의 AES-CMAC). 특성 값은 넣지 않는다. UUID 0x2B2A. [Vol 3] Part G §7.3", "gatt"],
  ["Robust Caching", "Robust Caching", "변경을 모르는(change-unaware) 클라이언트의 요청에 0x12 Database Out Of Sync로 답해 옛 캐시 사용을 막는 기능. [Vol 3] Part G §2.5.2.1", "gatt"],
  // 14 isoal
  ["ISOAL", "Isochronous Adaptation Layer", "SDU(코덱 프레임)를 등시성 PDU로 나누고 합치는 계층. 프레임 없는 방식과 프레임 있는 방식이 있다. [Vol 6] Part G", "isoal"],
  ["USPI", "USPI", "ISO 간격 하나에 들어오는 SDU 수 = ISO_Interval ÷ SDU_Interval(정수여야 프레임 없음 가능). [Vol 6] Part G §2.1", "isoal"],
  ["UPPS", "UPPS", "SDU 하나에 배정하는 프레임 없는 PDU 수. ⌈Max_SDU ÷ Max_PDU⌉ 이상, BN = UPPS × USPI. [Vol 6] Part G §2.1", "isoal"],
  ["분할 헤더", "Segmentation Header", "프레임 있는 PDU의 세그먼트 앞 2바이트. SC(시작/이어짐), CMPLT(끝), 길이. [Vol 6] Part G §2.2", "isoal"],
  ["Time_Offset", "Time_Offset", "새 SDU의 첫 세그먼트에 붙는 24비트(µs). SDU 기준 시각에서 CIG 기준점·BIG 앵커까지의 시간. [Vol 6] Part G §3.1", "isoal"],
  ["ASE", "Audio Stream Endpoint", "서버의 오디오 스트림 끝점. Sink ASE·Source ASE가 있고 Idle~Releasing 상태를 가진다. ASCS v1.0 §3", "leaudio"],
  ["ASCS", "Audio Stream Control Service", "ASE와 ASE Control Point를 노출하는 GATT 서비스. Core 밖 SIG 사양", "leaudio"],
  ["PACS", "Published Audio Capabilities Service", "기기가 받고 보낼 수 있는 코덱 능력(PAC 레코드)·오디오 위치·맥락을 알리는 GATT 서비스", "leaudio"],
  ["BAP", "Basic Audio Profile", "LE 오디오의 유니캐스트·방송 절차와 필수 코덱·QoS 설정 표를 정한 프로파일", "leaudio"],
  ["CAP", "Common Audio Profile", "여러 기기(좌우 이어폰 등)를 조정 세트로 묶어 함께 다루는 프로파일", "leaudio"],
  ["BASS", "Broadcast Audio Scan Service", "방송 도우미가 수신기에게 들을 방송과 방송 코드를 알려 주는 GATT 서비스", "leaudio"],
];

/* 본문 표기 → 용어집 표제어 */
window.BD_TERM_ALIAS = {};
