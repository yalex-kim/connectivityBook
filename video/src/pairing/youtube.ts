/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=pairing)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "페어링할 때 왜 숫자 여섯 자리를 비교할까? | 도청·중간자·숫자 비교 쉽게 이해하기",
  summary: ["새 키보드를 연결하면 6자리 숫자를 입력하라고 하고, 휴대폰 두 대를 연결하면 두 화면의 숫자가 같으냐고 묻습니다. 그런데 무선 이어폰은 그냥 연결되죠. 이 숫자는 무엇을 막아 줄까요?", "페어링이 막아야 하는 두 위협(엿듣기와 끼어들기), 공개 재료만 주고받고 같은 키를 만드는 LE Secure Connections(P-256 ECDH), 그것만으로는 막을 수 없는 중간자, 6자리 숫자 비교가 중간자를 100만분의 1로 막는 원리, 그리고 두 기기의 입출력 능력이 정하는 방식(숫자 비교·패스키·Just Works)까지 그림으로 따라갑니다."],
  chapters: [
    ["페어링 때 나오는 숫자", "hook"],
    ["엿듣기와 끼어들기", "threats"],
    ["엿듣기는 수학으로", "dh"],
    ["끼어들기: 바꿔치기", "mitm"],
    ["6자리 숫자 비교", "compare"],
    ["기기가 정하는 방식과 본딩", "methods"],
  ] as [string, SceneId][],
  notes: ["숫자 938554는 사양 [Vol 3] Part H 부록 D.5 샘플로 계산한 g2 값(0x2F9ED5BA)의 하위 6자리입니다. 중간자 쪽 숫자는 예시입니다.", "색 섞기는 디피-헬먼을 설명하는 비유입니다. 실제로는 P-256 타원곡선의 공개 키·비밀 키 계산입니다.", "방식 표는 LE Secure Connections와 MITM 보호 요구를 기준으로 했습니다."],
  links: [
    ...[["BluetoothBook 입문 8장 “페어링과 보안” (페어링 방식 표, 숫자 비교 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/security.html"]],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 3] Part H §2.3.5.1(페어링 방식 표), §2.2.9(g2), 부록 D.5(g2 샘플), §2.3.5.6(LE Secure Connections)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "페어링", "보안", "숫자 비교", "패스키", "Just Works", "중간자 공격", "ECDH", "LE Secure Connections", "블루투스 입문", "ConnectivityBook"],
};
