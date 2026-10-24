/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=discover)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "처음 보는 두 블루투스 기기는 어떻게 만날까? | 광고·스캔·연결 요청 쉽게 이해하기",
  summary: [
    "이어폰 케이스를 열면 휴대폰에 이름이 뜹니다. 둘은 아직 한 번도 이야기를 나눈 적이 없는데 말이죠.",
    "블루투스 기기가 광고 채널 세 곳에서 외치고 듣다가 서로를 찾는 과정, 찾는 데 어떤 때는 0.1초, 어떤 때는 1분이 넘게 걸리는 이유, 그리고 연결 요청(CONNECT_IND) 한 번으로 앞으로의 약속을 정하고 범용 채널로 떠나기까지를 그림과 3D로 따라갑니다.",
  ],
  chapters: [
    ["처음 보는 두 기기", "hook"],
    ["광고 채널 세 곳과 외치기", "meet"],
    ["듣기: 스캔 창", "listen"],
    ["왜 어떤 때는 오래 걸릴까", "slow"],
    ["연결 요청과 범용 채널", "request"],
  ] as [string, SceneId][],
  notes: [
    "발견 시간은 BluetoothBook 입문 5장 시뮬레이터와 같은 계산입니다(광고 데이터 31바이트, 조건마다 600번 시도, 평균은 1분 안에 찾은 경우). 실제 기기의 광고·스캔 설정은 제품마다 다릅니다.",
    "지연 유무 비교와 스캔 장면의 간격·창 길이는 설명을 위한 예시 값입니다.",
  ],
  links: [
    ["BluetoothBook 입문 5장 “광고와 스캔” (시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/advertising.html"],
    ["BluetoothBook 입문 6장 “연결” — 연결 이벤트와 연결 간격", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/connection.html"],
    ["이어지는 영상: 블루투스는 왜 Wi-Fi와 부딪히지 않을까? (AFH)", "https://youtu.be/U0n4ZyQ5sv4"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 6] Part B §4.4.2.2(광고 이벤트, advDelay 0~10 ms), §4.4.3(스캔 창과 스캔 간격), §2.3.3.1(CONNECT_IND), §4.5.3(전송 창), Table 1.3(채널 번호와 주파수)",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "저전력 블루투스", "광고", "advertising", "스캔", "기기 찾기", "연결", "CONNECT_IND", "광고 채널", "무선 이어폰", "무선 통신", "ConnectivityBook"],
};
