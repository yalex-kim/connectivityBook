/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=instant)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "연결을 끊지 않고 약속을 바꾸려면, 언제 바꾸자고 해야 할까? | 블루투스 심화 2: instant와 연결 갱신",
  summary: ["시간이 모자라면 블루투스 연결의 약속 간격을 늘려야 합니다. 그런데 휴대폰과 워치는 연결된 채로 계속 만나고 있습니다. 약속을 바꾸자는 말은 언제 하고, 언제부터 새 약속을 지켜야 할까요?", "“지금 바로 바꾸자”가 연결을 끊는 이유, 미래의 만남 번호(instant)로 약속하는 방법, 번호를 너무 가깝게 잡으면 생기는 Instant Passed, 들을 기회를 6번 이상 두라는 규칙과 그 확률, 그리고 새 약속의 시작 시각을 옮기는 전송 창까지 그림으로 따라갑니다."],
  chapters: [
    ["약속을 바꾸려면", "hook"],
    ["“지금 바로”는 안 된다", "now"],
    ["몇 번째 만남부터: instant", "instant"],
    ["얼마나 멀리 잡을까", "far"],
    ["새 약속의 시작 시각과 정리", "anchor"],
  ] as [string, SceneId][],
  notes: ["확률은 한 번에 못 들을 확률 30%, 각 기회가 서로 독립이라는 책의 모델로 계산했습니다(심화 4장).", "간격(30 ms → 60 ms), 만남 번호, WinOffset은 예시 값입니다."],
  links: [
    ["BluetoothBook 심화 4장 “링크 계층 제어 절차: instant와 충돌 규칙”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/procedures.html"],
    ["BluetoothBook 심화 3장 “링크 계층 상태 기계와 컨트롤러 스케줄링”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/scheduling.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §5.5·§5.5.1(instant, 들을 기회 6번, Instant Passed), §5.1.1(연결 갱신, 전송 창, 앵커 포인트 이동), §4.5.1(connEventCounter), [Vol 1] Part F §2(오류 코드 0x08·0x28)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("심화 일편에서…")이 나올 때 심화 1편으로. */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/TgjI2k-Bo0g", teaser: "지난 영상 보기", message: "심화 1편: 휴대폰 하나에 이어폰·워치·키보드를 다 연결해도 될까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "instant", "연결 갱신", "Connection Update", "링크 계층", "블루투스 심화", "ConnectivityBook"],
};
