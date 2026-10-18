/* GNSSBook 용어 데이터 — [한국어, 영어, 설명, 장 slug]
   용어집(glossary.html)과 본문 용어 툴팁(common.js)이 함께 쓴다.
   근거는 각 장의 “규격 들여다보기”·spec-ref(IS-GPS-200N, Galileo OS SIS ICD 2.2, RTKLIB)에 있다. */
window.GN_TERMS = [
    // 01 intro
    ["GNSS", "Global Navigation Satellite System", "위성이 방송하는 시각·궤도 신호로 위치를 구하는 시스템의 통칭. GPS, GLONASS, Galileo, BeiDou 등.", "intro"],
    ["의사거리", "Pseudorange", "신호의 도착 시각 − 송신 시각에 빛의 속도를 곱한 값. 수신기 시계 오차 × c가 모든 위성에 똑같이 더해져 있다.", "intro"],
    ["수신기 시계 오차", "Receiver clock bias", "수신기 시계와 GPS 시간의 차이. 위치 x, y, z와 함께 네 번째 미지수로 푼다. 1 µs = 300 m.", "intro"],
    // 02 orbits
    ["중궤도", "MEO, Medium Earth Orbit", "고도 약 2만 km대의 궤도. GPS 반지름 26,560 km(주기 11시간 58분), Galileo 29,600 km.", "orbits"],
    ["스카이 플롯", "Sky plot", "하늘의 위성 위치를 방위·앙각으로 그린 원형 그림. 가운데가 머리 위, 바깥 원이 지평선.", "orbits"],
    ["앙각 마스크", "Elevation mask", "이 앙각 아래 위성은 쓰지 않는 기준(보통 5~15°). 낮은 위성은 대기 오차가 크고 가리기 쉽다.", "orbits"],
    // 03 signals
    ["C/N0", "Carrier-to-noise density ratio", "1 Hz당 잡음에 대한 신호 세기(dB-Hz). 맑은 하늘 휴대폰 35~45 dB-Hz. L1 C/A 최소 −158.5 dBW에서 약 43.5 dB-Hz.", "signals"],
    ["BOC", "Binary Offset Carrier", "칩 안에서 부반송파로 한 번 더 뒤집는 변조. 에너지가 양옆으로 갈라져 같은 주파수의 BPSK와 덜 겹친다. Galileo E1, GPS L1C.", "signals"],
    ["L1·L2·L5", "GPS carrier frequencies", "10.23 MHz의 154·120·115배: 1,575.42 · 1,227.6 · 1,176.45 MHz. Galileo E1 = L1, E5a = L5.", "signals"],
    // 04 prn
    ["PRN 코드", "Pseudo-Random Noise code", "위성마다 다른 의사 잡음 수열. 같은 주파수에서 위성을 골라 듣고(CDMA) 도착 시간을 잰다. C/A 코드는 1,023칩, 1 ms.", "prn"],
    ["골드 코드", "Gold code", "두 m-수열(G1, G2)을 위성마다 다르게 엇갈려 XOR한 코드. 상호 상관이 −65/−1/63 세 값뿐이다.", "prn"],
    ["칩", "Chip", "PRN 코드의 한 비트. C/A 1칩 = 1/1.023 MHz ≈ 977.5 ns ≈ 293 m.", "prn"],
    // 05 acquisition
    ["신호 획득", "Acquisition", "코드 위상 × 도플러 격자에서 상관 봉우리를 찾아 위성 신호의 대략적 시간·주파수를 아는 단계.", "acquisition"],
    ["도플러", "Doppler shift", "시선 속도로 생기는 주파수 밀림. GPS L1에서 최대 약 ±4.9 kHz, 수신기 시계 1 ppm마다 1.575 kHz 더.", "acquisition"],
    ["TTFF", "Time To First Fix", "켜고 첫 위치가 나올 때까지의 시간. 냉시동 수십 초, 열시동·A-GNSS 수 초.", "acquisition"],
    ["A-GNSS", "Assisted GNSS", "통신망에서 궤도력·시각·대략 위치를 받아 탐색과 메시지 받기를 줄이는 방법. 휴대폰의 빠른 첫 위치와 실내 감도의 비결.", "acquisition"],
    // 06 tracking
    ["DLL", "Delay Lock Loop", "얼리와 레이트 상관이 같아지도록 복제 코드를 미는 코드 추적 루프. 균형점이 의사거리.", "tracking"],
    ["PLL", "Phase Lock Loop", "반송파 위상을 붙잡는 추적 루프. 도플러와 반송파 위상(mm)을 낸다.", "tracking"],
    ["반송파 위상", "Carrier phase", "반송파 사이클의 누적 수. mm 정밀도지만 정수 사이클 수(모호성)를 모른다. Android AccumulatedDeltaRange.", "tracking"],
    ["사이클 슬립", "Cycle slip", "PLL이 잠깐 놓쳐 반송파 위상의 정수 사이클 수가 건너뛰는 일.", "tracking"],
    ["다중 경로", "Multipath", "반사파가 직접파와 섞여 상관 삼각형을 기울이는 오차. 상관기 간격이 좁을수록 작다(최대 약 반사 세기 × 간격 ÷ 2칩).", "tracking"],
    // 07 navmsg
    ["항법 메시지", "Navigation message (LNAV)", "위성이 50 bps로 보내는 시각·궤도·상태 정보. 프레임 30 s = 서브프레임 5 × 6 s = 워드 10 × 30비트.", "navmsg"],
    ["궤도력", "Ephemeris", "한 위성의 정밀 궤도(서브프레임 2·3). 케플러 요소와 보정 항. 보통 2시간마다 갱신, 약 4시간 유효.", "navmsg"],
    ["알마낙", "Almanac", "모든 위성의 대략적 궤도(서브프레임 4·5, 25페이지). km 수준이지만 몇 달 쓸 수 있어 탐색 계획에 쓴다.", "navmsg"],
    ["GPS 시간", "GPS Time", "1980-01-06 0시 UTC에 시작해 윤초 없이 흐르는 시간. 주 번호 + 주내 초(TOW). 2017년부터 UTC보다 18초 앞섬.", "navmsg"],
    ["주 번호 넘침", "Week number rollover", "LNAV가 주 번호의 하위 10비트만 보내 1,024주(약 19.6년)마다 0으로 돌아가는 일. 1999·2019년에 일어남.", "navmsg"],
    // 08 satpos
    ["케플러 방정식", "Kepler's equation", "M = E − e·sin E. 평균 근점 이각 M에서 이심 근점 이각 E를 반복으로 푼다(IS-GPS-200 표 20-IV).", "satpos"],
    ["상대론 보정", "Relativistic correction", "이심률에 따른 위성 시계 변화 Δt_r = F·e·√A·sin E, F = −4.442807633 × 10⁻¹⁰. e = 0.01이면 최대 약 23 ns.", "satpos"],
    ["사냐크 보정", "Sagnac / Earth rotation correction", "신호가 날아오는 약 70 ms 동안 지구가 도는 만큼 위성 좌표를 돌리는 보정. 안 하면 수십 m.", "satpos"],
    // 09 position
    ["DOP", "Dilution of Precision", "위성 배치가 측정 오차를 위치 오차로 키우는 배수. 위치 오차 ≈ DOP × UERE.", "position"],
    ["HDOP·VDOP", "Horizontal / Vertical DOP", "수평·수직 방향의 DOP. 위성이 모두 지평선 위에 있어 보통 VDOP > HDOP.", "position"],
    // 10 errors
    ["전리층 지연", "Ionospheric delay", "자유 전자가 신호를 늦추는 오차 = 40.3·TEC/f². 낮에 크고 낮은 위성에 길다.", "errors"],
    ["클로부차 모델", "Klobuchar model", "GPS가 방송하는 계수 8개로 전리층 지연을 계산하는 단일 주파수용 모델(IS-GPS-200 그림 20-4). RMS 오차를 최소 50% 줄인다.", "errors"],
    ["대류층 지연", "Tropospheric delay", "공기와 수증기가 신호를 늦추는 오차. 주파수와 무관, 머리 위 해수면 약 2.4 m. 사스타모이넨 모델.", "errors"],
    ["전리층 제거 조합", "Ionosphere-free combination", "(f₁²P₁ − f₂²P₂)/(f₁² − f₂²). 1차 전리층이 사라지지만 잡음이 L1·L5에서 약 2.59배 커진다.", "errors"],
    ["UERE", "User Equivalent Range Error", "위성·대기·다중 경로·잡음 오차를 제곱합의 제곱근으로 묶은 의사거리 오차.", "errors"],
    // 11 urban
    ["NLOS", "Non-Line-Of-Sight", "직접파가 가리고 건물에 반사된 신호만 들어오는 상태. 의사거리가 통째로 길어져 걸러내야 한다.", "urban"],
    ["도시 협곡", "Urban canyon", "빌딩 사이의 길. 길을 가로지르는 방향 하늘이 arctan(h/d)까지 가려진다.", "urban"],
    // 12 precise
    ["DGNSS", "Differential GNSS", "위치를 아는 기준국의 보정값으로 공통 오차를 지우는 방법. 거리가 멀수록 대기 차이로 남는 오차가 커진다.", "precise"],
    ["SBAS", "Satellite-Based Augmentation System", "정지 위성으로 넓은 지역 보정값과 무결성을 방송. WAAS, EGNOS, MSAS, GAGAN, KASS.", "precise"],
    ["RTK", "Real-Time Kinematic", "기준국과 반송파 위상을 이중 차분하고 정수 모호성을 확정해 cm를 얻는 방법.", "precise"],
    ["정수 모호성", "Integer ambiguity", "반송파 위상에서 모르는 정수 사이클 수. 실수 추정 후 정수로 확정(fix)한다.", "precise"],
    ["와이드레인", "Wide-lane", "두 주파수 위상의 차이로 만든 긴 파장(L1·L5 75 cm, L1·L2 86 cm). 모호성 확정을 돕는다.", "precise"],
    ["PPP", "Precise Point Positioning", "정밀 궤도·시계와 이중 주파수로 기준국 없이 cm에 다가가는 방법. 수렴에 수십 분.", "precise"],
    // 13 phone
    ["원시 측정값", "GNSS raw measurements", "Android 7부터 앱이 받는 칩의 측정값(GnssClock, GnssMeasurement). 의사거리 = (TimeNanos − FullBiasNanos − BiasNanos의 주내 값 − ReceivedSvTimeNanos) × c.", "phone"],
    ["듀티 사이클", "Duty cycling", "배터리를 아끼려고 수신부를 껐다 켜는 일. 반송파 위상 연속성이 끊긴다.", "phone"],
];

/* 본문 표기 → 용어집 표제어 (툴팁 연결용) */
window.GN_TERM_ALIAS = {};
