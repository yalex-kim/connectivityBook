/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=hdt)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "블루투스 7.0은 어떻게 빨라졌을까? | 블루투스 심화 10: LE HDT",
  summary: ["블루투스 7.0에서 LE의 최대 속도가 2 Mb/s에서 7.5 Mb/s로 올라갔습니다. 지금 LE의 실제 천장은 무엇이었고, 새 PHY인 HDT는 그 천장을 어떻게 넘었을까요?", "박자(심볼 속도)는 그대로 두고 한 칸에 더 많은 비트를 싣는 변조, 모든 속도에 붙는 오류 정정과 펑처링, 패킷마다 속도를 고르는 방식, 깨진 블록만 다시 보내는 긴 패킷, 그리고 그 대가까지 3D 그림으로 따라갑니다."],
  chapters: [
    ["문제: 지금 LE의 천장", "hook"],
    ["박자는 그대로", "slot"],
    ["해결: 한 칸에 더 싣고, 오류 정정으로 지킨다", "more"],
    ["해결: 패킷마다 속도, 깨진 블록만 다시", "rate"],
    ["대가와 정리", "cost"],
  ] as [string, SceneId][],
  notes: ["1.4 Mb/s는 책 6장 처리량 계산기로 구한 LE 2M의 대략적인 앱 처리량입니다. 실제 값은 기기와 연결 설정마다 다릅니다.", "HDT2·3·4는 HDT를 지원하는 기기에 필수이고, HDT6·7.5는 선택 기능입니다. 감도는 사양이 요구하는 최소값(블록 오류율 10%)입니다."],
  links: [
    ["BluetoothBook 3장 “비트를 전파에 싣기: GFSK와 PHY” (7.0의 새 PHY: LE HDT)", "https://connbook.yalex-k.com/bluetooth/chapters/phy.html#hdt"],
    ["ConnectivityBook 서재", "https://connbook.yalex-k.com/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 7.0 — [Vol 6] Part A §1·§3.6·§4.1.2·§7(HDT PHY), [Vol 6] Part B §2.7(패킷 형식)·§3.4(부호화·펑처링)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  cards: [] as { scene: SceneId; sentence: number; video: string; teaser: string; message: string }[],
  tags: ["블루투스", "Bluetooth", "블루투스 7.0", "Bluetooth 7.0", "HDT", "High Data Throughput", "BLE", "블루투스 심화", "ConnectivityBook"],
};
