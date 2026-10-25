/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=range)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "블루투스는 몇 미터까지 될까? | 신호 세기의 예산, 링크 버짓 쉽게 이해하기",
  summary: [
    "흔히 블루투스는 10미터라고 하죠. 그런데 휴대폰을 뒷주머니에 넣으면 1미터 남짓 떨어진 이어폰이 끊기고, 어떤 기기는 훨씬 먼 곳에서도 잡힙니다.",
    "블루투스가 닿는 거리를 정하는 것은 미터가 아니라 신호 세기의 예산입니다. 보낸 세기에서 거리·벽·사람 몸이 깎는 만큼, 받는 쪽의 수신 감도, 그리고 느리고 꼼꼼하게 말해 더 멀리 가는 LE Coded까지 그림으로 따라갑니다.",
  ],
  chapters: [
    ["블루투스는 몇 미터까지 될까", "hook"],
    ["답은 세기: 마진", "budget"],
    ["거리가 깎는 몫", "distance"],
    ["사람 몸과 반사파", "body"],
    ["받는 쪽의 감도", "sens"],
    ["더 멀리: LE Coded", "coded"],
    ["정리", "outro"],
  ] as [string, SceneId][],
  notes: [
    "거리와 손실 수치는 BluetoothBook 입문 2장 링크 버짓 시뮬레이터와 같은 모델로 계산했습니다(2.44 GHz, 1 m까지 자유 공간 손실, 그 뒤 경로 손실 지수 n). 예산 장면은 송신 0 dBm, 집(n = 2.7) 10 m, 벽·몸 각 −12 dB의 예시입니다.",
    "요즘 칩의 수신 감도 약 −95 dBm은 상용 칩 데이터시트의 대표값입니다. 반사파 그래프는 설명을 위한 예시 곡선입니다.",
    "LE Coded의 거리 배율은 사양이 요구하는 감도 차이(−70 → −82 dBm, 12 dB)로 계산했습니다. 실제 기기에서는 칩과 환경에 따라 다릅니다.",
  ],
  links: [
    ["BluetoothBook 입문 2장 “2.4 GHz 전파와 데시벨” (링크 버짓 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/radio.html"],
    ["BluetoothBook 입문 3장 “비트를 전파에 싣기: GFSK와 PHY” (LE Coded 부호기)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/phy.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 6] Part A §3(송신 전력과 전력 등급), §4.1 Table 4.2(수신 감도 LE 1M·2M −70 dBm, Coded S=2 −75 dBm, S=8 −82 dBm), [Vol 6] Part B §3.3(FEC 부호기와 패턴 매퍼), [Vol 2] Part A §3(BR/EDR 전력 등급)",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion"],
  tags: ["블루투스", "Bluetooth", "BLE", "블루투스 거리", "링크 버짓", "수신 감도", "데시벨", "dBm", "LE Coded", "블루투스 5", "무선 이어폰 끊김", "블루투스 입문", "무선 통신", "ConnectivityBook"],
};
