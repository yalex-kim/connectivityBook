/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=audio)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "무선 이어폰은 왜 소리가 늦게 들릴까? | 블루투스 오디오 지연과 LE 오디오 쉽게 이해하기",
  summary: ["무선 이어폰으로 영상을 보면 입 모양과 소리가 어긋나고, 게임에서는 총소리가 늦게 들립니다. 전파는 빛의 속도로 날아가는데, 왜 소리가 늦을까요?", "제시간에 도착해야 하는 오디오와 버퍼, 클래식 A2DP의 지연 예산(대부분은 버퍼), 끊김과 지연의 맞바꾸기, Bluetooth 5.2 LE 오디오의 등시성 채널이 기한(FT)과 재전송 기회(NSE)로 지연을 줄이는 방식까지 그림으로 따라갑니다."],
  chapters: [
    ["입 모양과 소리가 어긋나는 이유", "hook"],
    ["제시간에 와야 하는 데이터", "why"],
    ["클래식 A2DP의 지연 예산", "budget"],
    ["끊김과 지연의 맞바꾸기", "trade"],
    ["LE 오디오: 시각과 기한", "le"],
    ["기한 안의 재전송과 정리", "retry"],
  ] as [string, SceneId][],
  notes: ["지연 막대는 BluetoothBook 입문 10장 지연 계산기의 대표값입니다(클래식: 버퍼 150 ms → 195 ms, LE: ISO 간격 10 ms × FT 2, 표시 지연 10 ms → 45 ms). 실제 지연은 기기와 설정마다 다릅니다.", "전달 실패 0.8%는 손실 20%가 조각마다 독립이라고 단순화한 계산입니다."],
  links: [
    ...[["BluetoothBook 입문 10장 “블루투스 오디오” (지연 예산 계산기, CIS 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/audio.html"]],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part G(등시성 채널), Part B §4.5.13(CIS: ISO_Interval, NSE, FT)", "A2DP: Core 밖의 프로파일 사양"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "무선 이어폰", "오디오 지연", "A2DP", "LE 오디오", "LE Audio", "등시성 채널", "CIS", "LC3", "블루투스 입문", "ConnectivityBook"],
};
