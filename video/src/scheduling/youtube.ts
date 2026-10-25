/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=scheduling)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "휴대폰 하나에 이어폰·워치·키보드를 다 연결해도 될까? | 블루투스 심화 1: 컨트롤러 스케줄링",
  summary: ["블루투스 연결은 정확한 시간 약속입니다. 그런데 LE 오디오 이어폰, 스마트워치, 키보드를 한 휴대폰에 연결하면 약속 상대가 셋이 됩니다. 블루투스 무선은 하나뿐인데, 셋을 다 연결해도 괜찮을까요?", "무선이 한 순간에 한 가지 일만 하는 이유, 건너뛰어도 되는 한계인 감독 타임아웃과 기다려 주지 않는 소리의 기한, 약속 시각을 엇갈려 놓는 방법, 오래 건너뛴 쪽에 우선권을 주는 스케줄러, 필요한 시간이 간격보다 길 때 일어나는 일, 그리고 그래서 몇 개까지 연결할 수 있는지를 그림으로 따라갑니다."],
  chapters: [
    ["약속 상대가 셋이 되면", "hook"],
    ["한 번에 하나, 건너뛰어도 되는 한계", "one"],
    ["약속 시각을 엇갈려 놓기", "stagger"],
    ["오래 건너뛴 쪽 먼저", "starve"],
    ["시간이 모자라면", "short"],
    ["그래서 몇 개까지?와 정리", "count"],
  ] as [string, SceneId][],
  notes: ["이어폰은 LE 오디오(등시성 채널)를 쓰는 경우입니다. 간격과 이벤트 길이(이어폰 10 ms마다 2 ms, 워치·키보드 30 ms마다 4 ms)는 예시 값입니다.", "‘몇 개까지’의 6개는 예시 값으로 시간을 빈틈없이 채운 계산상의 상한입니다. 실제 기기는 광고·스캔 시간과 칩마다의 구현에 따라 다릅니다.", "스케줄러 장면은 사양이 아니라, 사양의 제약(겹치지 않음, 감독 타임아웃 안에 한 번)을 지키는 책의 예시 모델로 계산했습니다. 겹칠 때 무엇을 먼저 할지는 칩마다 다릅니다."],
  links: [
    ["BluetoothBook 심화 3장 “링크 계층 상태 기계와 컨트롤러 스케줄링”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/scheduling.html"],
    ["BluetoothBook 입문 6장 “연결: 약속된 시각의 짧은 만남”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/connection.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §4.5.1(앵커 포인트, 일정 충돌로 건너뛴 이벤트, 감독 타임아웃 안에 한 번), §4.5.2(감독 타임아웃), [Vol 6] Part B §4.5.13(CIS: FT, 기한이 지난 조각 버리기), [Vol 1] Part F §2(오류 코드 0x08), [Vol 6] Part B §1.1.1(상태 기계 여러 개), [Vol 2] Part B §1(피코넷의 활성 페리페럴 7대)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 다섯 번째 영상에서…")이 나올 때 입문 5편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/EJ7lrAhbpAU", teaser: "지난 영상 보기", message: "입문 5편: 블루투스 켜 두면 배터리 닳을까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "LE 오디오", "스케줄링", "감독 타임아웃", "연결 이벤트", "블루투스 심화", "ConnectivityBook"],
};
