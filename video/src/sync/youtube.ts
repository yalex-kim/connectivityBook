/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=sync)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "이어폰 두 쪽은 따로 받는데, 어떻게 같은 순간에 소리를 낼까? | 블루투스 심화 7: LE 오디오 CIG 동기",
  summary: ["LE 오디오 무선 이어폰은 왼쪽과 오른쪽이 따로따로 소리를 받습니다. 휴대폰의 무선은 한 번에 하나라 받는 순간도 다릅니다. 그런데 두 귀의 소리는 왜 어긋나지 않을까요?", "두 연결을 한 묶음(CIG)으로 만들고 묶음 전체에 하나의 시각(CIG_Sync_Delay)을 정하는 방법, 그 때문에 생기는 지연을 계산하는 식, 그리고 좌우 이어폰을 한 세트로 묶어 함께 시작하고 멈추게 하는 CAP까지 3D 그림으로 따라갑니다."],
  chapters: [
    ["따로 받는 두 이어폰", "hook"],
    ["받는 시각은 다르다", "apart"],
    ["묶음의 같은 시각", "sync"],
    ["미리 정해진 지연", "delay"],
    ["한 세트로 함께, 그리고 정리", "set"],
  ] as [string, SceneId][],
  notes: ["지연 예는 책 심화 14장 계산기의 처음 값(ISO·SDU 간격 10 ms, FT 2, CIG_Sync_Delay 2 ms, 프레임 없는 PDU)입니다. 실제 값은 기기와 설정마다 다릅니다.", "이 영상은 LE 오디오(CIS)를 쓰는 이어폰의 경우입니다. Classic 오디오(A2DP) 이어폰은 다른 방식입니다."],
  links: [
    ["BluetoothBook 심화 14장 “ISOAL과 등시성 타이밍”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/isoal.html"],
    ["BluetoothBook 심화 15장 “LE 오디오 프로파일: PACS·ASCS·BAP·CAP”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/leaudio.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part G §3.2(전송 지연), [Vol 6] Part B §4.5.13(CIS·CIG, CIG_Sync_Delay)", "CAP·CSIP·BAP(Bluetooth SIG 사양)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 아홉 번째 영상에서…")이 나올 때 입문 9편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/ESwt5deMnas", teaser: "지난 영상 보기", message: "입문 9편: 무선 이어폰은 왜 소리가 늦게 들릴까?" }],
  tags: ["블루투스", "Bluetooth", "LE 오디오", "LE Audio", "무선 이어폰", "CIG", "CIS", "블루투스 심화", "ConnectivityBook"],
};
