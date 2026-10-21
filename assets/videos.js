/* ConnectivityBook 영상 목록. 새 영상을 올리면 여기에 한 줄을 더한다(순서 = 서재에 보이는 순서).
   - embed: 유튜브에서 "퍼가기 허용"이 켜져 있으면 true(서재 안에서 재생), 꺼져 있으면 false(유튜브로 이동)
   - chapters: 이 영상과 이어지는 책의 장. 그 장 본문에 "영상으로 보기" 상자가 자동으로 붙는다.
   file:// 로 열어도 동작하도록 JSON fetch 대신 classic script로 둔다. */
window.YB_VIDEOS = [
  {
    id: "afh-wifi",
    youtube: "d2ll02Ogga8",
    embed: true,
    featured: true,
    title: "블루투스는 왜 Wi-Fi와 부딪히지 않을까?",
    subtitle: "AFH(적응형 주파수 도약) 쉽게 이해하기",
    summary: "같은 2.4 GHz를 쓰는 Wi-Fi 옆에서 블루투스가 버티는 방법. 주파수 도약, Wi-Fi가 덮는 채널, 깨질 확률 계산, 재전송의 한계, 채널 맵으로 붐비는 채널을 빼는 AFH까지 3D 그림으로 따라갑니다.",
    duration: "1:45",
    published: "2026-10-21",
    topics: ["블루투스", "Wi-Fi"],
    thumb: "assets/videos/afh-wifi.jpg",
    chapters: [
      { path: "bluetooth/chapters/hopping.html", label: "BluetoothBook 입문 4장 · 주파수 도약" },
      { path: "bluetooth-deep/chapters/baseband.html", label: "BluetoothBook 심화 12장 · Classic 기저대역" },
    ],
  },
];
