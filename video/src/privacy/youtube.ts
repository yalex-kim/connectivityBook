/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=privacy)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "늘 외치고 있는 이어폰, 그 신호로 누가 나를 따라다닐 수 있을까? | 블루투스 심화 6: RPA와 프라이버시",
  summary: ["블루투스 이어폰은 정해진 간격마다 주소를 실어 “나 여기 있어요” 하고 외칩니다. 누군가 길목마다 그 주소를 기록하면 나를 따라다닐 수 있지 않을까요?", "주소를 가면처럼 바꿔 쓰는 RPA, 페어링 때 받은 비밀 키(IRK)로 내 기기만 알아보는 해석, 주소를 바꾸는 시각을 무작위로 고르는 이유, 그리고 광고 내용도 함께 바꿔야 하는 이유까지 사양 샘플로 직접 계산한 그림으로 따라갑니다."],
  chapters: [
    ["외침을 기록하면", "hook"],
    ["주소를 바꿔 쓰는 RPA", "rpa"],
    ["내 휴대폰은 알아본다", "resolve"],
    ["바꾸는 시각과 광고 내용", "when"],
    ["정리", "outro"],
  ] as [string, SceneId][],
  notes: ["RPA 값은 사양 부록 D.7 샘플의 IRK와 prand로 책의 계산을 돌린 결과입니다. 이후 주소들은 같은 IRK에 무작위 prand를 넣은 예입니다.", "주소를 바꾸는지, 얼마나 자주 바꾸는지는 기기마다 다릅니다. 이 영상은 원리와 방어를 다룹니다."],
  links: [
    ["BluetoothBook 심화 8장 “프라이버시와 필터링: 해석 목록과 필터 수용 목록”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/privacy.html"],
    ["BluetoothBook 입문 5장 “광고와 스캔”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/advertising.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §1.3.2(RPA 생성·해석), §4.7(해석 목록), [Vol 3] Part H §2.2.2(ah)·§3.6.4(IRK 배포)·Appendix D.7(샘플), [Vol 3] Part C §10.8.2(TGAP 15분), [Vol 4] Part E §7.8.45(RPA 갱신 범위)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 세 번째 영상에서…")이 나올 때 입문 3편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/do1whEDnMOY", teaser: "지난 영상 보기", message: "입문 3편: 처음 보는 두 블루투스 기기는 어떻게 만날까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "프라이버시", "RPA", "IRK", "위치 추적", "블루투스 심화", "ConnectivityBook"],
};
