/* UWBBook 용어 데이터 — [한국어, 영어, 설명, 장 slug]
   용어집(glossary.html)과 본문 용어 툴팁(common.js)이 함께 쓴다.
   근거는 각 장의 “출처 들여다보기”·spec-ref(공개 구현 코드와 공개 법령)에 있다. */
window.UW_TERMS = [
    // 01 intro
    ["UWB", "Ultra-Wideband (초광대역)", "−10 dB 대역폭이 500 MHz 이상이거나 비대역폭이 0.2 이상인 무선(47 CFR §15.503). 몇 나노초짜리 펄스를 아주 약하게 보내 도착 시간으로 거리를 잰다.", "intro"],
    ["비행시간", "Time of Flight (ToF)", "신호가 송신기에서 수신기까지 날아간 시간. 거리 = 빛의 속도 × 비행시간. 1 ns ≈ 30 cm.", "intro"],
    ["802.15.4z", "IEEE 802.15.4z-2020", "802.15.4의 UWB(HRP)에 보안 거리 측정(STS)과 높은 펄스율(HPRF)을 더한 개정. 휴대폰 UWB의 바탕.", "intro"],
    ["FiRa", "FiRa Consortium", "802.15.4z 위의 기기 간 상호 운용 규칙(세션·역할·라운드, UCI)과 인증을 만드는 단체. 2019년 출범.", "intro"],
    ["CCC", "Car Connectivity Consortium", "휴대폰 디지털 자동차 키 표준(Digital Key 3.0: BLE + UWB)을 만드는 자동차·휴대폰 업계 단체.", "apps"],
    // 02 pulse
    ["거리 분해능", "Range resolution", "구별할 수 있는 두 경로의 거리 차이 ≈ c/B. 500 MHz면 60 cm, 블루투스 2 MHz면 150 m.", "pulse"],
    ["비대역폭", "Fractional bandwidth", "2(f_H − f_L)/(f_H + f_L). 0.2 이상이면 폭이 좁아도 UWB다(47 CFR §15.503).", "pulse"],
    // 03 channels
    ["499.2 MHz", "Chip rate / channel grid", "HRP UWB의 기준 주파수. 칩 시간 2.003 ns, 채널 중심 = 정수배(5번 ×13 = 6,489.6 MHz, 9번 ×16 = 7,987.2 MHz).", "channels"],
    ["−41.3 dBm/MHz", "FCC UWB emission limit", "3.1~10.6 GHz UWB 평균 방사 한도(1 MHz, 1 ms 이하 RMS 평균). 499.2 MHz 채널 전체로 약 −14.3 dBm.", "channels"],
    // 04 frame
    ["프리앰블 코드", "Preamble code", "자기 상관이 뾰족한 3진(+1, 0, −1) 수열. 길이 31(코드 1~8), 127(9~24), 91(25~32, HPRF). 코드가 다르면 서로 덜 방해한다.", "frame"],
    ["SFD", "Start of Frame Delimiter", "프리앰블 끝을 알리는 정해진 무늬. SFD가 끝나는 순간(RMARKER)이 타임스탬프 기준점.", "frame"],
    ["STS", "Scrambled Timestamp Sequence", "802.15.4z가 더한, 키로 만든 암호학적 의사 난수 펄스 열. 미리 알 수 없어 위조할 수 없는 시각 기준을 준다.", "security"],
    ["SP0·SP1·SP3", "STS packet configuration", "프레임 모양. SP0 = STS 없음, SP1 = SFD 뒤 STS + 데이터, SP3 = STS만(데이터 없음). Android RFRAME_CONFIG_SP0/1/3.", "frame"],
    ["BPRF·HPRF", "Base / Higher Pulse Repetition Frequency", "802.15.4z의 두 펄스율 모드. BPRF는 64 MHz급(코드 9~12, 6.81 Mb/s), HPRF는 128·256 MHz급(코드 25~32).", "frame"],
    // 05 timestamp
    ["타임스탬프 눈금", "DW time unit (15.65 ps)", "1/(128 × 499.2 MHz) = 15.65 ps = 빛으로 4.69 mm. 40비트 레지스터라 약 17.2초마다 넘친다.", "timestamp"],
    ["안테나 지연", "Antenna delay", "칩의 타임스탬프 지점과 실제 안테나 사이의 시간. 기기마다 보정해야 한다. Zephyr DW1000 기본 송신·수신 각 16,450 눈금(≈257 ns).", "timestamp"],
    ["ppm", "Parts per million (clock offset)", "시계 빠르기 오차. 20 ppm × 응답 500 µs = 10 ns → SS-TWR 거리 1.5 m 오차. 반송파 주파수 차이로 잰다.", "timestamp"],
    // 06 twr
    ["TWR", "Two-Way Ranging", "시계가 맞지 않는 두 기기가 왕복 시간으로 거리를 재는 방법. ToF = (T_round − T_reply) ÷ 2.", "twr"],
    ["SS-TWR", "Single-Sided TWR", "Poll → Response 한 번. 오차 ≈ T_reply × Δppm ÷ 2. 반송파로 잰 시계 차이(skew)로 보정한다.", "twr"],
    ["DS-TWR", "Double-Sided TWR", "핑퐁 두 번. 비대칭 공식 (R1·R2 − P1·P2)/(R1 + R2 + P1 + P2)로 시계 오차를 거의 지운다.", "twr"],
    // 07 multipath
    ["채널 임펄스 응답", "Channel Impulse Response (CIR)", "펄스 하나를 보냈을 때 수신기에 도착하는 직접파·반사파들의 시간별 세기. 프리앰블로 잰다.", "multipath"],
    ["첫 경로", "First path", "CIR에서 가장 먼저 도착한 경로. 거리 측정은 가장 센 경로가 아니라 첫 경로의 시각을 쓴다.", "multipath"],
    ["NLOS", "Non-Line-Of-Sight", "직접파가 벽·몸에 가린 상태. 거리가 길게 나온다. |RSSI − FPPL| > 10 dB면 NLOS로 본다(dw1000_estimate_los).", "multipath"],
    ["FPPL", "First Path Power Level", "첫 경로만의 세기. 받은 세기 전체(RSSI)와의 차이로 LOS·NLOS를 가늠한다.", "multipath"],
    // 08 aoa
    ["PDoA", "Phase Difference of Arrival", "두 안테나에 도착한 반송파 위상의 차이 = 2π·d·sinθ ÷ λ.", "aoa"],
    ["AoA", "Angle of Arrival", "신호가 온 방향. θ = arcsin(PDoA·λ ÷ 2πd)(uwb_calc_aoa). 간격 d ≤ λ/2면 모호성이 없다.", "aoa"],
    // 09 position
    ["삼변 측량", "Trilateration", "앵커별 거리(원)의 교점으로 위치를 구하는 방법. 평면 3개, 공간 4개 이상의 앵커.", "position"],
    ["DOP", "Dilution of Precision", "앵커 배치가 거리 오차를 위치 오차로 키우는 배수. 위치 오차 ≈ DOP × 거리 오차.", "position"],
    ["TDoA", "Time Difference of Arrival", "동기된 앵커들에 도착한 시각의 차이(쌍곡선)로 위치를 구하는 방법. UL(태그가 보내기만), DL(태그가 듣기만).", "position"],
    ["앵커", "Anchor", "위치가 알려진 고정 UWB 기기. 태그와 거리를 재거나(TWR) 시각을 잰다(TDoA).", "position"],
    // 10 security
    ["중계 공격", "Relay attack", "키와 차 사이 신호를 장비로 이어 가까이 있는 것처럼 속이는 공격. 세기 기반 판단은 속지만 비행시간은 늘어나기만 한다.", "security"],
    ["거리 한정", "Distance bounding", "왕복 시간으로 “이보다 멀지 않다”는 거리 상한을 증명하는 원리. 중계로는 거리를 줄일 수 없다.", "security"],
    // 11 fira
    ["RSTU", "Ranging Scheduling Time Unit", "FiRa 시간 단위 1/1.2 µs ≈ 833 ns(416칩). 1 chap(CCC) = 400 RSTU = 1/3 ms. Android 기본 슬롯 2,400 RSTU = 2 ms.", "fira"],
    ["라운드", "Ranging round", "한 번의 거리 측정 메시지가 들어가는 슬롯 묶음. Android 기본 25슬롯 = 50 ms, 간격 200 ms.", "fira"],
    ["컨트롤러·컨트롤리", "Controller / Controlee", "세션 설정과 시간표를 정하는 쪽과 따르는 쪽. 시작자·응답자(누가 Poll을 보내나)와는 별개.", "fira"],
    ["UCI", "UWB Command Interface", "호스트(Android UWB 서비스)와 UWB 칩 사이의 명령 형식. SESSION_INIT → SESSION_SET_APP_CONFIG → SESSION_START.", "fira"],
    ["라운드 도약", "Round hopping", "블록마다 라운드 자리를 바꿔 같은 간격의 세션끼리 계속 부딪히지 않게 하는 방법.", "fira"],
    ["OOB", "Out-of-band setup", "UWB 세션 전에 BLE 등 다른 통로로 주소·설정·보안 키를 주고받는 일.", "fira"],
    // 12 power
    ["수신 창", "Receive window", "상대 신호가 올 무렵 수신기를 켜 두는 시간. 시계 오차만큼 넓혀야 하고, 넓을수록 전력이 든다.", "power"],
    // 13 apps
    ["디지털 키", "Digital Key 3.0", "CCC의 휴대폰 자동차 키. BLE로 인증·설정, 차의 여러 UWB 앵커로 거리·구역(문 앞·실내)을 판단한다.", "apps"],
    ["정밀 찾기", "Precision finding", "휴대폰과 태그의 거리(TWR)와 방향(AoA)으로 화살표를 그려 길을 안내하는 기능.", "apps"],
];

/* 본문 표기 → 용어집 표제어 (툴팁 연결용) */
window.UW_TERM_ALIAS = {};
