/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=pairing)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "차는 숫자를 확인하는데, 이어폰은 왜 그냥 연결될까? | 블루투스 페어링 쉽게 이해하기",
  summary: ["차에 휴대폰을 연결하면 6자리 숫자를 확인하거나 입력하라고 합니다. 그런데 무선 이어폰은 아무것도 묻지 않고 그냥 연결되죠. 같은 블루투스인데 왜 다를까요? 그리고 이 숫자는 무엇을 막아 줄까요?", "페어링이 막아야 하는 두 위협(엿듣기와 끼어들기), 공개 재료만 주고받고 같은 키를 만드는 LE Secure Connections(P-256 ECDH), 그것만으로는 막을 수 없는 중간자, 6자리 숫자 비교가 중간자를 100만분의 1로 막는 원리, 그리고 두 기기의 입출력 능력이 정하는 방식(숫자 비교·패스키·Just Works)까지 그림으로 따라갑니다."],
  chapters: [
    ["차는 확인, 이어폰은 그냥 연결", "hook"],
    ["엿듣기와 끼어들기, 엿듣기는 수학으로", "threats"],
    ["끼어들기: 바꿔치기", "mitm"],
    ["6자리 숫자 비교", "compare"],
    ["기기가 정하는 방식과 본딩", "methods"],
  ] as [string, SceneId][],
  notes: ["숫자 938554는 사양 [Vol 3] Part H 부록 D.5 샘플로 계산한 g2 값(0x2F9ED5BA)의 하위 6자리입니다. 중간자 쪽 숫자는 예시입니다.", "색 섞기는 디피-헬먼을 설명하는 비유입니다. 실제로는 P-256 타원곡선의 공개 키·비밀 키 계산입니다.", "방식 표는 LE Secure Connections와 MITM 보호 요구를 기준으로 했습니다. 차는 보통 클래식 블루투스로 연결되며, 클래식도 2.1의 Secure Simple Pairing부터 같은 방식(숫자 비교·패스키·Just Works·OOB)을 씁니다. 오래된 차는 PIN을 입력하는 레거시 방식을 쓰기도 합니다."],
  links: [
    ...[["BluetoothBook 입문 8장 “페어링과 보안” (페어링 방식 표, 숫자 비교 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/security.html"],["BluetoothBook 심화 13장 “Classic 보안: 레거시 PIN에서 Secure Connections까지”","https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/classicsec.html"]],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 3] Part H §2.3.5.1(페어링 방식 표), §2.2.9(g2), 부록 D.5(g2 샘플), §2.3.5.6(LE Secure Connections)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "페어링", "보안", "숫자 비교", "패스키", "Just Works", "중간자 공격", "ECDH", "LE Secure Connections", "블루투스 입문", "ConnectivityBook"],
};
