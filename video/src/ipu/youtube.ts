/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=ipu)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "이어폰 연결 설정, 끊지 않고 바꿀 수 있을까? | 블루투스 심화 11: 7.0의 IPU",
  summary: ["LE 오디오 이어폰은 휴대폰과 정해진 간격과 다시 보낼 기회를 약속해 두고 소리를 받습니다. 블루투스 6.3까지는 듣는 중에 이 약속을 바꾸려면 연결을 끊고 다시 만들어야 했습니다.", "7.0의 등시성 파라미터 갱신(IPU)이 약속 몇 벌을 미리 등록해 두고 정해진 순간에 두 이어폰이 함께 갈아타게 하는 방법, 이미 출발한 소리 조각을 이어 주는 규칙, 그리고 한계까지 3D 그림으로 따라갑니다."],
  chapters: [
    ["문제: 끊고 다시 만들어야 했다", "hook"],
    ["해결: 미리 등록하고 같은 순간에 갈아타기", "register"],
    ["이미 출발한 조각", "inflight"],
    ["한계와 정리", "limits"],
  ] as [string, SceneId][],
  notes: ["이 영상은 LE 오디오(CIS)를 쓰는 이어폰의 경우입니다. 실제 제품이 언제 설정을 바꾸는지는 제품마다 다릅니다.", "6.3에서 연결을 다시 만드는 동안 소리가 얼마나 멈추는지는 기기와 설정마다 달라 숫자로 말하지 않았습니다."],
  links: [
    ["BluetoothBook 심화 14장 “ISOAL과 등시성 타이밍” (7.0: CIS를 끊지 않고 바꾸기)", "https://connbook.yalex-k.com/bluetooth-deep/chapters/isoal.html#ipu"],
    ["ConnectivityBook 서재", "https://connbook.yalex-k.com/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 7.0 — [Vol 6] Part B §4.5.13.1(CIS 파라미터), §4.5.13.8(전환 페이로드), §4.5.14(CIG 설정), §5.1.36~§5.1.38(설정 정의·갱신·삭제 절차)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("심화 일곱 번째 영상에서…")이 나올 때 심화 7편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/LI0cbP2MgQM", teaser: "지난 영상 보기", message: "심화 7편: 이어폰 두 쪽은 따로 받는데, 어떻게 같이 울릴까?" }],
  tags: ["블루투스", "Bluetooth", "블루투스 7.0", "LE 오디오", "LE Audio", "무선 이어폰", "CIS", "IPU", "블루투스 심화", "ConnectivityBook"],
};
