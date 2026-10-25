/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=twokinds)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "같은 블루투스인데 왜 다르게 말할까? | 클래식과 LE 쉽게 이해하기",
  summary: [
    "무선 이어폰은 쉬지 않고 음악을 받는데, 분실물 태그는 거의 잠만 자다가 가끔 “나 여기 있어요” 하고 외칩니다. 같은 블루투스인데 왜 이렇게 다를까요?",
    "블루투스라는 이름 아래 들어 있는 두 시스템, 선을 없애려고 만든 클래식(BR/EDR)과 작은 전지로 오래 버티려고 더한 저전력 블루투스(LE)를 그림과 3D로 비교합니다. 채널이 어떻게 다른지, 왜 휴대폰과 이어폰은 둘 다 쓰고 태그는 LE만 쓰는지까지 따라갑니다.",
  ],
  chapters: [
    ["이어폰과 태그는 왜 다르게 말할까", "hook"],
    ["첫 번째 블루투스: 클래식", "split"],
    ["두 번째 블루투스: LE", "le"],
    ["채널부터 다른 두 시스템", "lanes"],
    ["휴대폰은 둘 다, 태그는 LE만", "both"],
  ] as [string, SceneId][],
  notes: [
    "이어폰이 음악은 클래식으로, 배터리 잔량은 LE로 주고받는 것은 요즘 흔한 구성을 단순화한 예입니다. 제품마다 구현이 다르고, LE 오디오를 쓰는 이어폰도 있습니다.",
    "시간축 그림의 패킷 간격과 배터리 잔량 숫자는 설명을 위한 예시입니다.",
  ],
  links: [
    ["BluetoothBook 입문 1장 “블루투스란 무엇인가”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/intro.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 2] Part A §2(BR/EDR 채널 f = 2402 + k MHz, k = 0~78), [Vol 6] Part A §2(LE 40채널, 2 MHz 간격)",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "저전력 블루투스", "클래식 블루투스", "BR/EDR", "LE", "무선 이어폰", "분실물 태그", "블루투스 입문", "무선 통신", "ConnectivityBook"],
};
