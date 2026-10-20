/**
 * 쇼츠 대본. 장면마다 화면 자막 = 나레이션 문장이다.
 * frames는 무음판의 길이이고, 나레이션을 넣으면 음성 길이에 맞춰 바뀐다.
 */
export type Scene = { id: "hook" | "setup" | "cover" | "hop" | "math" | "afh" | "outro"; frames: number; caption: string };

export const SCENES: Scene[] = [
  { id: "hook", frames: 150, caption: "Wi-Fi 옆에서 블루투스는 패킷을 몇 %나 잃을까요?" },
  { id: "setup", frames: 180, caption: "이웃 Wi-Fi 1·6·11번이 시간의 절반씩 말하고 있다고 해 봅시다." },
  { id: "cover", frames: 300, caption: "Wi-Fi 하나가 블루투스 채널 10개쯤을 덮습니다. 셋이면 37개 중 31개예요." },
  { id: "hop", frames: 420, caption: "블루투스는 매번 채널을 바꿔 뜁니다. 덮인 채널에서 Wi-Fi가 말하는 순간과 겹치면 패킷이 깨지죠." },
  { id: "math", frames: 240, caption: "31/37 × 50%, 약 42%. 셋뿐이니 1/3쯤이라는 직관은 틀립니다." },
  { id: "afh", frames: 240, caption: "그래서 적응형 도약은 덮인 채널을 빼고 남은 6개로만 뜁니다. 손실은 0%." },
  { id: "outro", frames: 150, caption: "직접 만져 보세요. ConnectivityBook, BluetoothBook 입문 4장." },
];
