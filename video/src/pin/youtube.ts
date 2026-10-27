/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=pin)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "블루투스는 어떻게 엿듣기와 끼어들기를 막을까? | 블루투스 심화 9: 보안 총정리",
  summary: ["예전 블루투스 기기는 PIN이라는 비밀번호를 입력하게 했고, 지금 차는 여섯 자리 숫자를 확인하라고 합니다. 블루투스 보안은 어떻게 지금 모습이 됐을까요?", "엿듣기·끼어들기·따라다니기라는 세 가지 위험, 비밀이 PIN 하나뿐이던 Classic 레거시와 LE 레거시 페어링, 각자의 비밀 값으로 열쇠를 만드는 Secure Simple Pairing, 숫자 비교와 IOcap, Classic Secure Connections(4.1)의 P-256·상호 장치 인증·AES-CCM, LE Secure Connections(4.2)의 약속·키 유도·확인, 구현에서 지킬 것(공개 키 검사·디버그 키·SC Only), Classic과 LE의 키를 함께 만드는 CTKD까지 한 번에 정리합니다. 원리와 방어를 다룹니다."],
  chapters: [
    ["PIN에서 숫자로", "hook"],
    ["막아야 할 셋", "three"],
    ["레거시 페어링 (Classic·LE)", "legacy"],
    ["Secure Simple Pairing", "ssp"],
    ["끼어들기 막기", "mitm"],
    ["Classic Secure Connections (4.1)", "sc1"],
    ["LE Secure Connections (4.2)", "lesc"],
    ["구현에서 지킬 것", "impl"],
    ["CTKD와 정리", "ctkd"],
  ] as [string, SceneId][],
  notes: ["이 영상은 페어링 방식의 원리와 방어를 다룹니다. 세션 키와 MIC는 심화 5편, 주소를 바꿔 쓰는 프라이버시는 심화 6편에서 자세히 다룹니다.", "버전은 각 방식이 사양에 들어온 때입니다(Classic Secure Connections 4.1, LE Secure Connections 4.2). 실제 기기가 쓰는 방식은 두 기기가 모두 지원하는 것 중에서 정해집니다."],
  links: [
    ["BluetoothBook 심화 13장 “Classic 보안: 레거시 PIN에서 Secure Connections까지”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/classicsec.html"],
    ["BluetoothBook 심화 7장 “SMP 완전판: P-256에서 LTK까지”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/smp.html"],
    ["BluetoothBook 입문 8장 “페어링과 보안”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/security.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 2] Part H §1(세 세대), §3.2.1·§6(레거시), §7·§7.7(SSP, h3·h4·h5), §9(AES-CCM, 키 길이), [Vol 3] Part H §2.2·§2.3.5.6(LE Secure Connections, 공개 키 검사, 디버그 키), [Vol 3] Part C §5.2.2·§10.2.1(SC Only)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 일곱 번째 영상에서…")이 나올 때 입문 7편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/2Lgj7DW7r40", teaser: "지난 영상 보기", message: "입문 7편: 차는 숫자를 확인하는데, 이어폰은 왜 그냥 연결될까?" }],
  tags: ["블루투스", "Bluetooth", "블루투스 보안", "페어링", "Secure Connections", "Secure Simple Pairing", "P-256", "AES-CCM", "블루투스 심화", "ConnectivityBook"],
};
