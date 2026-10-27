/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=direction)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "안테나로 방향을 안다면, 실내에서 내 위치도 알 수 있을까? | 블루투스 심화 8: 방향 찾기와 삼각측량",
  summary: ["블루투스는 안테나 여러 개가 받은 전파의 위상 차이로 방향을 압니다. 그런데 방향은 선 하나일 뿐입니다. 실내에서 내가 어디에 있는지도 알 수 있을까요?", "패킷 끝에 붙는 정보 없는 한 음(CTE)과 안테나 전환, 기준 구간으로 위상 회전을 재서 지우는 방법, 위상 차이로 각도를 구하는 식, 수신기 두 대의 방향선이 만나는 삼각측량과 각도 오차가 만드는 위치 오차까지 3D 그림으로 따라갑니다."],
  chapters: [
    ["방향은 선 하나", "hook"],
    ["패킷 끝의 한 음", "tone"],
    ["도는 위상 지우기", "spin"],
    ["위상 차이 → 각도", "angle"],
    ["두 방향이 만나는 곳과 오차, 정리", "where"],
  ] as [string, SceneId][],
  notes: ["삼각측량 예(10 m, 60°·120° → 5 m, 8.66 m)와 오차(2° → 10 m에서 약 35 cm)는 책 심화 17장의 그림 값입니다. 신호는 잡음·반사가 없는 이상적인 경우입니다.", "각도와 위치 계산은 사양 밖으로, 수신기나 휴대폰 쪽 소프트웨어가 합니다."],
  links: [
    ["BluetoothBook 심화 17장 “방향 찾기: CTE, IQ 표본, 안테나 전환”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/direction.html"],
    ["BluetoothBook 입문 11장 “위치 찾기: RSSI에서 채널 사운딩까지”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/location.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §2.1.5·§2.5(CTE 구조·슬롯·IQ 표본), [Vol 6] Part A §5.1(안테나 전환)", "각도·삼각측량 식은 배열 기하(사양 밖)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 열 번째 영상에서…")이 나올 때 입문 10편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/6S5L_BmTzpk", teaser: "지난 영상 보기", message: "입문 10편: 소파 틈에 빠진 이어폰, 휴대폰은 어떻게 거리를 알까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "방향 찾기", "AoA", "CTE", "실내 위치", "삼각측량", "블루투스 심화", "ConnectivityBook"],
};
