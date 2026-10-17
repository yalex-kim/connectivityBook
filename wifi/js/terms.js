/* WiFiBook 용어 데이터 — [한국어, 영어, 설명, 장 slug]
   용어집(glossary.html)과 본문 용어 툴팁(common.js)이 함께 쓴다.
   근거는 각 장의 “출처 들여다보기”·spec-ref(공개 구현 코드와 자료)에 있다. */
window.WF_TERMS = [
    // 01 intro
    ["IEEE 802.11", "IEEE 802.11", "무선 랜의 물리 계층과 MAC 규칙을 정하는 IEEE 표준. 802.11n·ac·ax·be 같은 개정안이 쌓이고, 몇 년마다 하나로 합친 판(802.11-2024 등)이 나온다.", "intro"],
    ["Wi-Fi Alliance", "Wi-Fi Alliance", "802.11 제품의 상호 운용성을 인증하고 “Wi-Fi 6” 같은 세대 이름과 WPA3 같은 인증 프로그램을 만드는 업계 단체.", "intro"],
    ["STA", "Station", "802.11로 통신하는 모든 기기. 휴대폰·노트북, 그리고 AP의 무선부도 STA다.", "intro"],
    ["AP", "Access Point", "다른 STA들을 묶어 유선 네트워크와 이어 주는 STA. 비컨을 보내고 연결을 받아 준다.", "intro"],
    ["BSS", "Basic Service Set", "AP 하나와 거기에 연결된 STA들의 모임.", "intro"],
    ["BSSID", "BSS Identifier", "BSS의 고유 번호(48비트). 보통 AP 무선부의 MAC 주소. 대역마다, SSID마다 다르다.", "intro"],
    ["SSID", "Service Set Identifier", "사람이 보는 네트워크 이름(최대 32바이트). 여러 BSS가 같은 SSID를 쓸 수 있다.", "intro"],
    ["ESS", "Extended Service Set", "같은 SSID를 쓰며 유선이나 무선 백홀로 이어진 여러 BSS의 묶음. 메시 공유기 여러 대가 하나의 ESS다.", "intro"],
    // 02 bands
    ["채널 본딩", "Channel bonding", "20 MHz 채널 여러 개를 묶어 40·80·160·320 MHz로 쓰는 것. 폭이 두 배면 속도도 약 두 배지만 겹치지 않는 채널 수는 준다.", "bands"],
    ["DFS", "Dynamic Frequency Selection", "5 GHz 일부 채널에서 레이더를 감지하면 채널을 비우는 규칙. 쓰기 전에 레이더가 없는지 확인(CAC)해야 한다.", "bands"],
    ["CAC", "Channel Availability Check", "DFS 채널을 쓰기 전에 레이더가 없는지 듣는 시간. 최소 60초(Linux IEEE80211_DFS_MIN_CAC_TIME_MS), 일부 기상 레이더 채널은 더 길다.", "bands"],
    ["PSC", "Preferred Scanning Channel", "6 GHz에서 단말이 직접 탐색하는 20 MHz 채널 15개(5번부터 16칸마다). AP는 이 채널을 주 채널로 쓰면 찾기 쉽다.", "bands"],
    // 03 ofdm
    ["OFDM", "Orthogonal Frequency Division Multiplexing", "넓은 채널을 서로 직교하는 수많은 좁은 부반송파로 나눠 동시에 보내는 방식. 802.11a/g부터 쓴다.", "ofdm"],
    ["부반송파", "Subcarrier", "OFDM이 채널을 나눈 좁은 반송파 하나. Wi-Fi 6 20 MHz에는 78.125 kHz 간격으로 256개가 있다.", "ofdm"],
    ["직교성", "Orthogonality", "부반송파 간격이 심볼 길이의 역수와 같아, 서로 겹쳐 있어도 수신기에서 간섭 없이 분리되는 성질.", "ofdm"],
    ["보호 구간", "Guard Interval (GI)", "OFDM 심볼 앞에 붙이는 여유 시간. 반사파가 이 안에 도착하면 심볼끼리 섞이지 않는다. 0.4/0.8 µs(Wi-Fi 4·5), 0.8/1.6/3.2 µs(Wi-Fi 6·7).", "ofdm"],
    ["심볼 간 간섭", "Inter-Symbol Interference (ISI)", "늦게 도착한 반사파가 다음 심볼과 겹쳐 생기는 간섭. 보호 구간으로 막는다.", "ofdm"],
    // 04 mcs
    ["MCS", "Modulation and Coding Scheme", "변조 방식과 부호율의 조합 번호. Wi-Fi 6는 0~11, Wi-Fi 7은 0~13(4096-QAM).", "mcs"],
    ["QAM", "Quadrature Amplitude Modulation", "진폭과 위상을 함께 바꿔 한 번에 여러 비트를 싣는 변조. 64-QAM은 6비트, 1024-QAM 10비트, 4096-QAM 12비트.", "mcs"],
    ["부호율", "Coding rate", "보낸 비트 중 실제 데이터의 비율(1/2, 2/3, 3/4, 5/6). 나머지는 오류를 고치는 여분.", "mcs"],
    ["성좌도", "Constellation diagram", "QAM의 신호점들을 진폭·위상 평면에 찍은 그림. 점이 촘촘할수록 비트가 많고 잡음에 약하다.", "mcs"],
    ["SNR", "Signal-to-Noise Ratio", "신호 세기와 잡음 세기의 비(dB). 높을수록 높은 MCS를 쓸 수 있다.", "mcs"],
    ["속도 적응", "Rate adaptation", "전송 성공률을 보고 MCS·스트림·채널 폭을 계속 바꾸는 드라이버의 알고리즘(Linux minstrel 등).", "mcs"],
    // 05 mimo
    ["공간 스트림", "Spatial stream", "같은 시간·주파수에 여러 안테나로 동시에 보내는 서로 다른 데이터 줄. 링크의 스트림 수는 양쪽 안테나 중 적은 쪽을 넘지 못한다.", "mimo"],
    ["다이버시티", "Diversity", "여러 안테나로 같은 신호를 받아 합쳐 페이딩에 강해지는 것. 최대비 결합(MRC)이 대표적.", "mimo"],
    ["공간 다중화", "Spatial multiplexing", "경로의 차이를 이용해 같은 주파수에 여러 스트림을 보내고 수신기에서 풀어내는 기술. SNR이 높고 반사가 많을 때 이득이 크다.", "mimo"],
    ["빔포밍", "Beamforming", "안테나마다 위상을 조절해 전파를 상대 쪽으로 모으는 기술. 안테나 N개면 최대 10·log₁₀N dB.", "mimo"],
    ["사운딩", "Sounding (NDPA/NDP)", "빔포밍을 위해 AP가 시험 패킷을 보내고 단말이 잰 채널 정보를 돌려받는 절차.", "mimo"],
    ["MU-MIMO", "Multi-User MIMO", "빔포밍으로 서로 다른 단말에 같은 시간·주파수에서 다른 데이터를 보내는 기술. Wi-Fi 5 하향, Wi-Fi 6 상향까지.", "mimo"],
    // 06 access
    ["CSMA/CA", "Carrier Sense Multiple Access with Collision Avoidance", "먼저 듣고, 비어 있으면 무작위로 기다렸다가 보내 충돌을 피하는 와이파이의 기본 접근 방식.", "access"],
    ["SIFS", "Short Interframe Space", "ACK·CTS처럼 이미 차례를 가진 응답 앞의 가장 짧은 간격. 5 GHz 16 µs, 2.4 GHz 10 µs(+신호 확장 6 µs).", "access"],
    ["슬롯", "Slot time", "백오프 숫자 하나를 세는 시간 단위. OFDM 9 µs, 802.11b가 섞이면 20 µs.", "access"],
    ["AIFS", "Arbitration Interframe Space", "새로 차례를 얻으려는 쪽이 기다리는 간격 = SIFS + AIFSN × 슬롯. 일반(BE) 43 µs, 음성·영상 34 µs(5 GHz).", "access"],
    ["백오프", "Backoff", "채널이 빈 뒤 0~CW 사이 무작위 슬롯만큼 더 기다리는 것. 충돌하면 CW가 두 배씩(최대 1023) 커진다.", "access"],
    ["EDCA", "Enhanced Distributed Channel Access", "트래픽을 음성·영상·일반·배경 네 범주로 나눠 AIFSN·CW·TXOP를 달리 주는 우선순위 방식(802.11e, WMM).", "access"],
    ["접근 범주", "Access Category (AC)", "EDCA의 네 가지 트래픽 등급: AC_VO(음성), AC_VI(영상), AC_BE(일반), AC_BK(배경).", "access"],
    ["TXOP", "Transmit Opportunity", "한 번 차례를 얻으면 연속으로 쓸 수 있는 시간. 음성 1.504 ms, 영상 3.008 ms(hostapd 기본값).", "access"],
    ["NAV", "Network Allocation Vector", "프레임의 Duration 칸을 듣고 “채널이 그때까지 바쁘다”고 기록하는 가상 캐리어 센스.", "access"],
    ["숨은 단말", "Hidden node", "AP와는 통하지만 서로는 들리지 않는 두 단말. 캐리어 센스가 서로를 막지 못해 AP에서 충돌한다. RTS/CTS로 줄인다.", "access"],
    ["RTS/CTS", "Request To Send / Clear To Send", "큰 전송 전에 짧은 프레임으로 채널을 예약하는 교환. 숨은 단말도 CTS를 듣고 NAV를 설정한다.", "access"],
    // 07 frames
    ["Frame Control", "Frame Control field", "프레임 맨 앞 2바이트. 종류·하위 종류와 ToDS·FromDS·Retry·PM·More Data·Protected·Order 비트.", "frames"],
    ["ToDS/FromDS", "To/From Distribution System", "Frame Control의 두 비트. 주소 칸 넷의 의미(RA·TA·DA·SA·BSSID)를 정한다. 둘 다 1이면 주소가 넷(메시 백홀).", "frames"],
    ["비컨", "Beacon", "AP가 보통 100 TU(102.4 ms)마다 보내는 관리 프레임. SSID, 지원 속도, 채널, TIM, 보안 정보를 알린다.", "frames"],
    ["TU", "Time Unit", "802.11의 시간 단위 1,024 µs. 비컨 간격 100 TU = 102.4 ms.", "frames"],
    ["정보 요소", "Information Element (IE)", "비컨·프로브·연결 프레임에 붙는 ID(1)·길이(1)·내용의 TLV 블록. 모르는 ID는 건너뛸 수 있어 확장이 쉽다.", "frames"],
    ["FCS", "Frame Check Sequence", "프레임 끝의 CRC-32. 틀리면 받는 쪽이 버리고 ACK를 보내지 않아 재전송된다.", "frames"],
    // 08 throughput
    ["링크 속도", "PHY rate / link rate", "전송 중 순간 속도(MCS·폭·스트림·GI로 정해짐). 실제 처리량은 대기·프리앰블·ACK 때문에 이보다 낮다.", "throughput"],
    ["A-MSDU", "Aggregate MSDU", "IP 패킷 여러 개를 MAC 머리말 하나 안에 이어 붙인 묶음. FCS가 하나라 오류 하나에 통째로 다시 보낸다.", "throughput"],
    ["A-MPDU", "Aggregate MPDU", "완전한 프레임 여러 개를 한 전송에 실은 묶음. 깨진 프레임만 다시 보낸다. 최대 개수는 블록 ACK 창(64/256/1024).", "throughput"],
    ["블록 ACK", "Block Ack", "시작 번호(SSN)와 비트맵으로 여러 프레임의 수신 여부를 한꺼번에 알리는 ACK. ADDBA로 미리 합의한다.", "throughput"],
    ["공중 시간 공정성", "Airtime fairness", "패킷 수가 아니라 공중 시간을 단말마다 공평하게 나누는 스케줄링. 느린 단말이 모두를 느리게 하는 것을 막는다.", "throughput"],
    // 09 connect
    ["프로브", "Probe Request/Response", "단말이 채널에서 네트워크를 묻는 요청과 AP의 응답. 능동 스캔에 쓴다. DFS 채널에서는 비컨을 듣기 전 보낼 수 없다.", "connect"],
    ["RNR", "Reduced Neighbor Report", "2.4·5 GHz 비컨 안에 같은 장비의 6 GHz BSS를 알려 주는 정보 요소. 6 GHz 스캔을 줄인다.", "connect"],
    ["AID", "Association ID", "연결할 때 AP가 단말에게 주는 번호(1~2007). TIM 비트맵의 위치가 된다.", "connect"],
    ["로밍", "Roaming", "같은 SSID의 다른 BSS로 옮겨 가는 것. 단말이 결정하며, 802.11k·v·r이 찾기·권하기·옮기기를 돕는다.", "connect"],
    ["802.11k", "Radio Resource Measurement", "AP가 이웃 보고서로 같은 ESS의 이웃 AP와 채널을 알려 줘 스캔을 줄인다.", "connect"],
    ["802.11v", "Wireless Network Management (BTM)", "AP가 BSS 전환 관리 요청으로 단말에게 다른 AP로 옮기라고 권한다.", "connect"],
    ["802.11r", "Fast BSS Transition (FT)", "키 계층을 미리 나눠 두고 인증·재연결 프레임 안에서 키 교환을 끝내 로밍 공백을 줄인다.", "connect"],
    // 10 security
    ["PMK", "Pairwise Master Key", "열쇠 사슬의 맨 위 32바이트 키. WPA2-Personal은 PBKDF2-HMAC-SHA1(비밀번호, SSID, 4096회), SAE는 연결마다 합의한다.", "security"],
    ["PTK", "Pairwise Transient Key", "연결마다 PMK와 두 난수·두 MAC 주소로 만드는 키 묶음. KCK(무결성)·KEK(키 감싸기)·TK(데이터 암호화).", "security"],
    ["GTK", "Group Temporal Key", "방송·멀티캐스트 프레임용 공용 키. AP가 정해 4-way 핸드셰이크 메시지 3에서 KEK로 감싸 보낸다.", "security"],
    ["4-way 핸드셰이크", "4-way handshake", "연결 직후 EAPOL-Key 네 개로 PMK 보유를 서로 확인하고 PTK를 만들며 GTK를 건네는 절차.", "security"],
    ["CCMP", "Counter Mode CBC-MAC Protocol", "WPA2·WPA3의 AES 기반 프레임 암호화. CCMP 머리말 8바이트(패킷 번호 PN), MIC 8바이트.", "security"],
    ["SAE", "Simultaneous Authentication of Equals", "WPA3-Personal의 비밀번호 인증. 엿들은 내용으로는 비밀번호를 검증할 수 없고 연결마다 다른 PMK를 만든다.", "security"],
    ["PMF", "Protected Management Frames (802.11w)", "연결 해제 같은 관리 프레임에 무결성 보호를 씌워 가짜 연결 끊기를 막는다. WPA3에서 필수.", "security"],
    ["OWE", "Opportunistic Wireless Encryption", "Enhanced Open. 비밀번호 없는 공개 망에서 단말마다 다른 키를 합의해 엿듣기를 막는다(신원 확인은 안 함).", "security"],
    ["802.1X", "IEEE 802.1X / Enterprise", "사용자·기기마다 계정이나 인증서로 인증하는 방식(EAP + RADIUS). 회사 망용.", "security"],
    // 11 power
    ["TIM", "Traffic Indication Map", "비컨 안의 정보 요소. AP에 데이터가 쌓인 절전 단말의 AID 비트를 켠다(부분 가상 비트맵).", "power"],
    ["DTIM", "Delivery TIM", "N번째 비컨마다 오는 TIM. 그 직후 쌓인 방송·멀티캐스트 프레임이 나간다. DTIM 주기가 크면 배터리를 아끼지만 지연이 커진다.", "power"],
    ["PS-Poll", "Power Save Poll", "절전 단말이 TIM을 보고 AP에 “쌓인 프레임 하나 보내 달라”고 요청하는 제어 프레임.", "power"],
    ["U-APSD", "Unscheduled Automatic Power Save Delivery", "단말이 보내는 프레임을 방아쇠로 AP가 쌓인 프레임을 돌려주는 WMM 절전. 통화에 알맞다.", "power"],
    ["TWT", "Target Wake Time", "Wi-Fi 6. AP와 단말이 깨어날 시각과 간격을 협상해 그 사이에는 비컨도 듣지 않고 잔다.", "power"],
    // 12 wifi6
    ["OFDMA", "Orthogonal Frequency Division Multiple Access", "채널을 RU로 나눠 여러 단말에 동시에 주는 다중 접속. Wi-Fi 6부터.", "wifi6"],
    ["RU", "Resource Unit", "OFDMA의 자원 단위. 26·52·106·242·484·996 부반송파 크기. 20 MHz에 26-톤 RU 9개.", "wifi6"],
    ["트리거 프레임", "Trigger frame", "AP가 상향 다중 사용자 전송을 지휘하는 제어 프레임. 단말별 RU·MCS·세기·길이를 지정한다.", "wifi6"],
    ["BSS 컬러", "BSS color", "Wi-Fi 6 프리앰블의 6비트 번호(1~63). 프리앰블만 듣고 우리 망인지 이웃 망인지 구별한다.", "wifi6"],
    ["공간 재사용", "Spatial reuse (OBSS PD)", "다른 색의 약한 이웃 전송을 무시하고 송신하는 것. 문턱을 −82 dBm에서 최대 −62 dBm까지 올리고 그만큼 송신 세기를 낮춘다.", "wifi6"],
    // 13 wifi7
    ["MLO", "Multi-Link Operation", "Wi-Fi 7. 여러 대역의 링크를 하나의 연결로 묶어 동시에(STR) 또는 먼저 빈 쪽으로(EMLSR) 보낸다.", "wifi7"],
    ["MLD", "Multi-Link Device", "MLO를 하는 기기. 링크마다 STA(또는 AP)가 있지만 연결·키·시퀀스 번호는 MLD 단위로 하나다.", "wifi7"],
    ["EMLSR", "Enhanced Multi-Link Single Radio", "무선부 하나로 여러 링크를 듣다가 기회가 온 링크로 옮겨 보내는 MLO 방식. 휴대폰의 주력.", "wifi7"],
    ["프리앰블 펑처링", "Preamble puncturing", "넓은 채널 안의 막힌 20 MHz(320 MHz에서는 40 MHz 단위)만 비우고 나머지를 쓰는 기술. 허용 패턴만, 주 채널 제외.", "wifi7"],
    ["주 채널", "Primary 20 MHz channel", "넓은 채널 중 비컨을 보내고 경쟁을 하는 기준 20 MHz. 펑처링으로도 비울 수 없다.", "wifi7"],
    ["UHR", "Ultra High Reliability (802.11bn)", "Wi-Fi 8의 개정 이름. 여러 AP 협조, 끊김 없는 로밍, 낮은 꼬리 지연 등 신뢰성을 겨냥한다(초안).", "wifi7"],
    // 14 design
    ["메시", "Mesh Wi-Fi", "여러 AP(노드)가 같은 SSID로 집 전체를 덮는 구성. 노드 사이 백홀이 성능을 정한다.", "design"],
    ["백홀", "Backhaul", "메시 노드와 공유기를 잇는 연결. 유선이 가장 좋고, 다음이 전용 무선 대역, 단말과 같은 대역 무선이 가장 느리다.", "design"],
];

/* 본문 표기 → 용어집 표제어 (툴팁 연결용) */
window.WF_TERM_ALIAS = {};
