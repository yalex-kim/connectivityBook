/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=connection)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "블루투스 켜 두면 배터리 닳을까? | 연결 간격·페리페럴 지연 쉽게 이해하기",
  summary: [
    "블루투스를 켜 두면 배터리가 닳는다고 꺼 두는 분들이 있죠. 그런데 스마트워치는 하루 종일 휴대폰과 연결돼 있습니다. 정말 하루 종일 전파를 주고받는 걸까요?",
    "LE의 연결은 끊기지 않는 선이 아니라 정확한 시간 약속입니다. 연결 간격마다 1 ms도 안 되는 순간만 깨어나는 연결 이벤트, 반응 속도와 배터리를 맞바꾸는 연결 간격, 할 말이 없을 때 약속을 건너뛰는 페리페럴 지연, 깨진 패킷을 한 비트로 확인하고 다음 약속에 다시 보내는 방법, 감독 타임아웃까지 그림으로 따라갑니다.",
  ],
  chapters: [
    ["하루 종일 연결된 스마트워치", "hook"],
    ["연결은 시간 약속", "appoint"],
    ["약속 한 번의 안", "event"],
    ["자주 만날까, 드물게 만날까", "often"],
    ["약속 건너뛰기: 페리페럴 지연", "latency"],
    ["깨지면? 확인 비트와 감독 타임아웃", "lost"],
    ["정리", "outro"],
  ] as [string, SceneId][],
  notes: [
    "연결 간격 50 ms, 페리페럴 지연 4, 감독 타임아웃 2 s는 설명을 위한 예시 값입니다. 실제 값은 기기와 운영체제가 정합니다.",
    "약속 한 번의 길이(약 0.3 ms)는 LE 1M에서 빈 패킷 두 개(각 80 µs)와 그 사이 150 µs로 계산했습니다. 무선부를 켜고 끄는 준비 시간은 칩마다 다릅니다.",
    "이 영상은 연결된 LE 기기의 이야기입니다. 휴대폰 전체의 배터리 사용량은 화면, 다른 무선, 앱의 동작에 따라 달라집니다.",
  ],
  links: [
    ["BluetoothBook 입문 6장 “연결: 약속된 시각의 짧은 만남” (연결 파라미터 설계기, SN/NESN 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/connection.html"],
    ["이어지는 내용: BluetoothBook 입문 9장 “전력: 코인 전지로 몇 년”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/power.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 6] Part B §4.5.1(연결 간격, 페리페럴 지연·타임아웃 규칙), §4.5.2(감독 타임아웃), §4.1.1(T_IFS 150 µs), §4.5.6(MD와 이벤트 닫기), §4.5.9(SN/NESN 확인 응답)",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "블루투스 배터리", "스마트워치", "연결 간격", "connection interval", "페리페럴 지연", "감독 타임아웃", "저전력 블루투스", "블루투스 입문", "무선 통신", "ConnectivityBook"],
};
