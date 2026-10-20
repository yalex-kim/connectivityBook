/* yalexBook 서재의 책 목록. 새 책을 추가하면 여기에 한 줄을 더한다.
   file:// 로 열어도 동작하도록 JSON fetch 대신 classic script로 둔다. */
window.YB_BOOKS = [
  {
    id: "bluetoothbook",
    series: "BluetoothBook 시리즈", // 같은 series끼리 서재에서 한 묶음으로 보인다
    volume: "입문편",
    path: "bluetooth/",
    progressKey: "bt-progress-v1", // 책이 읽기 진도를 저장하는 localStorage 키
    title: "BluetoothBook",
    subtitle: "누구나 읽는 블루투스 교과서",
    headline: "보이지 않는 선 한 가닥의 원리",
    description: "2.4 GHz 전파와 GFSK, 주파수 도약, 광고와 연결, GATT, 페어링과 보안, 코인 전지로 몇 년 가는 전력 설계, LE 오디오와 Auracast, 채널 사운딩, 메시까지. Bluetooth Core 6.3을 근거로 패킷을 직접 만들고 계산을 돌려 보며 배운다.",
    status: "published",
    chapters: 15,
    simulators: 41,
    level: "입문 ~ 엔지니어",
    reference: "Bluetooth Core 6.3",
    color: "#0b62d6",
    colorDark: "#4fa8ff",
    icon: "M10.5 11.5 20.5 20.5 15.5 25V7l5 4.5-10 9", // 표지 아이콘(32×32 SVG path, 흰 선)
    topics: ["2.4 GHz·데시벨", "GFSK·PHY", "주파수 도약", "광고·연결", "GATT", "페어링·보안", "전력", "LE 오디오", "채널 사운딩", "메시·PAwR", "공존"],
  },
  {
    id: "bluetoothdeep",
    series: "BluetoothBook 시리즈",
    volume: "심화편",
    path: "bluetooth-deep/",
    progressKey: "bd-progress-v1", // 책이 읽기 진도를 저장하는 localStorage 키
    title: "BluetoothBook 심화",
    subtitle: "프로토콜 스택을 끝까지 따라가는 블루투스 교과서",
    headline: "HCI 바이트에서 AES-CCM까지",
    description: "BluetoothBook의 다음 책. HCI와 링크 계층 절차, 패킷 암호화와 페어링 함수 전부, 프라이버시, L2CAP·EATT, 클래식 베이스밴드, 등시성 채널과 LE 오디오, 채널 사운딩과 방향 찾기를 Core 6.3의 시험 데이터로 계산을 맞춰 보며 따라간다.",
    status: "published",
    chapters: 19,
    simulators: 41,
    level: "엔지니어 (1권 다음)",
    reference: "Bluetooth Core 6.3 (시험 데이터로 검증)",
    color: "#4338ca",
    colorDark: "#a5b4fc",
    icon: "M10.5 11.5 20.5 20.5 15.5 25V7l5 4.5-10 9M23.5 22.5h3M25 21v3",
    topics: ["HCI", "링크 계층 절차", "AES-CCM", "SMP 함수", "해석 목록", "BIG 보안", "L2CAP·EATT", "클래식 베이스밴드", "ISOAL", "LE 오디오", "채널 사운딩", "방향 찾기"],
  },
  {
    id: "wifibook",
    path: "wifi/",
    progressKey: "wf-progress-v1", // 책이 읽기 진도를 저장하는 localStorage 키
    title: "WiFiBook",
    subtitle: "누구나 읽는 와이파이 교과서",
    headline: "공기를 나눠 쓰는 기술의 모든 것",
    description: "2.4·5·6 GHz 채널, OFDM과 MCS, MIMO, 듣고 기다리고 말하는 CSMA/CA, 프레임과 묶음 전송, 연결·로밍·보안, 절전, Wi-Fi 6의 OFDMA와 Wi-Fi 7의 MLO까지. IEEE 802.11을 구현한 Linux·hostapd 공개 코드로 값을 확인하며 계산을 돌려 보며 배운다.",
    status: "published",
    chapters: 15,
    simulators: 36,
    level: "입문 ~ 엔지니어",
    reference: "IEEE 802.11 (공개 구현으로 확인)",
    color: "#6d28d9",
    colorDark: "#a78bfa",
    icon: "M6 13a14 14 0 0 1 20 0M9.5 16.8a9 9 0 0 1 13 0M13 20.4a4.2 4.2 0 0 1 6 0M16 24.2v.1", // 표지 아이콘(32×32 SVG path, 흰 선)
    topics: ["2.4·5·6 GHz 채널", "OFDM", "MCS", "MIMO·빔포밍", "CSMA/CA·EDCA", "프레임", "묶음 전송", "연결·로밍", "WPA3", "절전·TWT", "Wi-Fi 6 OFDMA", "Wi-Fi 7 MLO"],
  },
  {
    id: "uwbbook",
    path: "uwb/",
    progressKey: "uw-progress-v1", // 책이 읽기 진도를 저장하는 localStorage 키
    title: "UWBBook",
    subtitle: "누구나 읽는 UWB 교과서",
    headline: "빛의 시간으로 재는 거리의 모든 것",
    description: "나노초 펄스와 499.2 MHz 채널, HRP 프레임과 STS, 15.65 ps 타임스탬프, SS·DS-TWR, 다중 경로와 첫 경로, AoA, 삼변 측량과 TDoA, FiRa 세션, 디지털 키까지. Android·Decawave·Zephyr의 공개 코드와 공개 법령으로 값을 확인하며 계산을 돌려 보며 배운다.",
    status: "published",
    chapters: 15,
    simulators: 33,
    level: "입문 ~ 엔지니어",
    reference: "IEEE 802.15.4z·FiRa (공개 구현으로 확인)",
    color: "#0f766e",
    colorDark: "#2dd4bf",
    icon: "M6 17h4l2-8 3 14 3-11 2 5h6", // 표지 아이콘(32×32 SVG path, 흰 선)
    topics: ["펄스·대역폭", "499.2 MHz 채널", "HRP 프레임·STS", "타임스탬프", "SS·DS-TWR", "첫 경로·NLOS", "AoA", "삼변 측량·TDoA", "FiRa 세션", "BLE·전력", "디지털 키", "실내 측위"],
  },
  {
    id: "gnssbook",
    path: "gnss/",
    progressKey: "gn-progress-v1", // 책이 읽기 진도를 저장하는 localStorage 키
    title: "GNSSBook",
    subtitle: "누구나 읽는 GNSS 교과서",
    headline: "하늘의 시계로 아는 위치의 모든 것",
    description: "궤도와 신호, C/A 코드, 신호 획득과 추적, 항법 메시지와 GPS 시간, 위성 위치 계산, 의사거리와 DOP, 전리층·대류층, 도시와 실내, DGNSS·RTK·PPP, 휴대폰 GNSS까지. 공개 규격 IS-GPS-200N·Galileo OS SIS ICD와 RTKLIB으로 값을 확인하고 계산을 돌려 보며 배운다.",
    status: "published",
    chapters: 15,
    simulators: 32,
    level: "입문 ~ 엔지니어",
    reference: "IS-GPS-200N·Galileo OS SIS ICD (공개 규격)",
    color: "#15803d",
    colorDark: "#4ade80",
    icon: "M16 12.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9M7 9l4 3M25 9l-4 3M16 6v4", // 표지 아이콘(32×32 SVG path, 흰 선)
    topics: ["궤도·스카이 플롯", "L1·L2·L5", "C/A 코드", "신호 획득", "DLL·PLL", "항법 메시지·GPS 시간", "위성 위치 계산", "의사거리·DOP", "전리층·대류층", "도시·NLOS", "RTK·PPP", "휴대폰 GNSS"],
  },
];
