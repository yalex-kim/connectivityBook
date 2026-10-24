/**
 * 유튜브 업로드 정보. scripts/youtube.ts가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "블루투스는 왜 Wi-Fi와 부딪히지 않을까? | AFH(적응형 주파수 도약) 쉽게 이해하기",
  summary: [
    "공유기와 노트북, 무선 이어폰과 스마트워치는 같은 2.4 GHz 대역을 나눠 씁니다. 블루투스는 왜 Wi-Fi 옆에서도 버틸까요?",
    "채널을 계속 바꿔 뛰는 주파수 도약, Wi-Fi가 덮는 채널, 깨질 확률을 계산하는 공식, 재전송만으로는 부족한 이유, 그리고 붐비는 채널을 채널 맵에서 빼고 뛰는 AFH(적응형 주파수 도약)까지 3D 그림으로 따라갑니다.",
  ],
  chapters: [
    ["Wi-Fi와 블루투스가 함께 쓰는 2.4 GHz", "hook"],
    ["주파수 도약과 Wi-Fi가 덮는 채널", "hop"],
    ["깨질 확률: 공식과 조건별 예시", "formula"],
    ["재전송만으로는 부족한 이유와 AFH", "retx"],
    ["채널 맵을 만드는 법 · 정리", "map"],
  ] as [string, SceneId][],
  notes: [
    "영상 속 손실률은 '같은 순간 겹치는 주파수에 있으면 깨진다'고 단순화한 계산의 예시입니다. 실제 값은 Wi-Fi의 사용량, 신호 세기, 거리, 재전송에 따라 달라집니다.",
    "숫자 예시는 저전력 블루투스(LE) 범용 채널 37개와 Wi-Fi 1·6·11번(각 폭 20 MHz)을 기준으로 했습니다.",
  ],
  links: [
    ["앞 이야기: 처음 보는 두 블루투스 기기는 어떻게 만날까?", "https://youtu.be/do1whEDnMOY"],
    ["BluetoothBook 입문 4장 “주파수 도약” (시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/hopping.html"],
    ["더 깊이 · BluetoothBook 심화 12장(Classic 도약 커널과 AFH)", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/baseband.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 6] Part B §4.5.8(LE 채널 선택, AFH), [Vol 2] Part B §2.6.3(Classic AFH), [Vol 6] Part B Table 1.3(LE 채널 주파수)",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "AFH", "적응형 주파수 도약", "주파수 도약", "Wi-Fi", "와이파이", "2.4GHz", "무선 통신", "BLE", "저전력 블루투스", "채널 맵", "간섭", "공존", "ConnectivityBook"],
};
