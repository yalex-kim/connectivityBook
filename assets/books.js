/* yalexBook 서재의 책 목록. 새 책을 추가하면 여기에 한 줄을 더한다.
   file:// 로 열어도 동작하도록 JSON fetch 대신 classic script로 둔다. */
window.YB_BOOKS = [
  {
    id: "bluetoothbook",
    path: "bluetooth/",
    title: "BluetoothBook",
    subtitle: "누구나 읽는 블루투스 교과서",
    headline: "보이지 않는 선 한 가닥의 원리",
    description: "2.4 GHz 전파와 GFSK, 주파수 도약, 광고와 연결, GATT, 페어링과 보안, 코인 전지로 몇 년 가는 전력 설계, LE 오디오와 Auracast, 채널 사운딩, 메시까지. Bluetooth Core 6.2를 근거로 패킷을 직접 만들고 계산을 돌려 보며 배운다.",
    status: "published",
    chapters: 15,
    simulators: 41,
    level: "입문 ~ 엔지니어",
    reference: "Bluetooth Core 6.2",
    color: "#0b62d6",
    colorDark: "#4fa8ff",
    icon: "M10.5 11.5 20.5 20.5 15.5 25V7l5 4.5-10 9", // 표지 아이콘(32×32 SVG path, 흰 선)
    topics: ["2.4 GHz·데시벨", "GFSK·PHY", "주파수 도약", "광고·연결", "GATT", "페어링·보안", "전력", "LE 오디오", "채널 사운딩", "메시·PAwR", "공존"],
  },
  {
    id: "wifibook",
    path: "wifi/",
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
];
