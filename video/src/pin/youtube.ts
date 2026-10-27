/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=pin)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "옛날 블루투스는 왜 PIN을 넣었고, 지금은 왜 숫자만 확인할까? | 블루투스 심화 9: Classic 페어링의 세 세대",
  summary: ["예전 블루투스 기기는 PIN이라는 비밀번호를 입력하게 했습니다. 지금 차는 여섯 자리 숫자를 확인하라고 합니다. 왜 바뀌었을까요?", "비밀이 PIN 하나뿐이던 레거시 페어링의 약점, 각 기기가 혼자 가진 비밀 값으로 열쇠를 만드는 Secure Simple Pairing, 끼어들기를 막는 여섯 자리 숫자 비교, 화면 없는 척하는 속임을 막는 IOcap, 그리고 P-256과 AES로 바꾼 Secure Connections까지 원리와 방어를 3D 그림으로 따라갑니다."],
  chapters: [
    ["PIN에서 숫자로", "hook"],
    ["비밀은 PIN 하나", "legacy"],
    ["각자의 비밀 값", "ssp"],
    ["여섯 자리 숫자 비교", "compare"],
    ["화면 없는 척과 세 세대, 정리", "iocap"],
  ] as [string, SceneId][],
  notes: ["숫자 비교 예(069598)는 사양 [Vol 2] Part G §7.2.2.1의 예제 값입니다.", "이 영상은 Classic(BR/EDR) 페어링의 원리와 방어를 다룹니다. LE 페어링은 입문 7편과 심화 5편을 보세요."],
  links: [
    ["BluetoothBook 심화 13장 “Classic 보안: 레거시 PIN에서 Secure Connections까지”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/classicsec.html"],
    ["BluetoothBook 입문 8장 “페어링과 보안”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/security.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 2] Part H §1(세 세대), §3.2.1·§6.3(레거시 PIN·E22·E21), §7·§7.7(SSP와 f1·g·f2·f3, IOcap), [Vol 2] Part G §7.2.2.1(숫자 비교 예)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 일곱 번째 영상에서…")이 나올 때 입문 7편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/2Lgj7DW7r40", teaser: "지난 영상 보기", message: "입문 7편: 차는 숫자를 확인하는데, 이어폰은 왜 그냥 연결될까?" }],
  tags: ["블루투스", "Bluetooth", "Classic", "페어링", "PIN", "Secure Simple Pairing", "숫자 비교", "블루투스 보안", "블루투스 심화", "ConnectivityBook"],
};
