/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=hopping)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "1초에 최대 1600번 채널을 바꾸는데, 이어폰은 어떻게 따라올까? | 블루투스 심화 3: Classic 주파수 도약",
  summary: ["음악을 보내는 Classic 블루투스는 79개 채널을 1초에 최대 1600번 옮겨 다닙니다. 그런데 다음 채널이 어디인지 매번 알려 주지는 않습니다. 이어폰은 어떻게 휴대폰을 따라올까요?", "휴대폰의 주소와 시계로 채널을 계산하는 도약 선택 커널, 이어폰이 시계 오프셋으로 휴대폰의 시계를 따라가는 방법, 625 µs 슬롯, 32번마다 구간을 옮기는 도약 순서, 그리고 Wi-Fi가 쓰는 채널을 빼고 다시 고르는 적응 도약(AFH)까지 사양 예제의 주소로 직접 계산한 그림으로 따라갑니다."],
  chapters: [
    ["다음 채널을 알려 주지 않는데", "hook"],
    ["같은 계산, 같은 채널", "same"],
    ["슬롯마다 바뀌는 채널", "slots"],
    ["32개씩 도는 구간", "segment"],
    ["뺀 채널은 다시 고른다와 정리", "afh"],
  ] as [string, SceneId][],
  notes: ["채널은 사양 예제([Vol 2] Part G §2)의 Central 주소 0x2A96EF25로 책의 계산을 돌린 값입니다. 휴대폰이 Central인 경우를 그렸습니다.", "LE의 채널 선택은 다른 방식입니다(입문 4편). 적응 도약에서는 이어폰이 바로 앞 휴대폰 슬롯과 같은 채널로 답하므로, 1600번은 기본 도약일 때의 최대입니다."],
  links: [
    ["BluetoothBook 심화 12장 “Classic 기저대역: 도약 커널, 접근 코드, HEC·CRC·FEC”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/baseband.html"],
    ["BluetoothBook 입문 4장 “주파수 도약”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/hopping.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 2] Part A §2(79채널), Part B §2.2.3·§2.2.4(슬롯과 클록), §2.6.1~§2.6.4(도약 선택 커널, AFH 재매핑, 입력), Part G §2(예제)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 네 번째 영상에서…")이 나올 때 입문 4편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/U0n4ZyQ5sv4", teaser: "지난 영상 보기", message: "입문 4편: 블루투스는 왜 Wi-Fi와 부딪히지 않을까?" }],
  tags: ["블루투스", "Bluetooth", "Classic", "BR/EDR", "주파수 도약", "AFH", "도약 선택 커널", "블루투스 심화", "ConnectivityBook"],
};
