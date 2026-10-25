/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=locate)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "소파 틈에 빠진 이어폰, 휴대폰은 어떻게 거리를 알까? | RSSI·방향·채널 사운딩 쉽게 이해하기",
  summary: ["소파 틈에 빠진 이어폰을 찾으려고 휴대폰의 찾기 화면을 켜면 “가까워지는 중… 30 cm”라고 알려 줍니다. 휴대폰은 거리를 어떻게 알았을까요?", "신호의 세기(RSSI)로 거리를 거꾸로 계산하는 방법과 그 오차, 두 안테나의 위상 차이로 방향을 재는 AoA, Bluetooth 6.0 채널 사운딩이 72개 채널의 위상 기울기와 왕복 시간으로 거리를 재는 원리, 그리고 세기는 속일 수 있어도 시간은 속일 수 없는 이유까지 그림으로 따라갑니다."],
  chapters: [
    ["거리를 아는 휴대폰", "hook"],
    ["세기로 거리 계산과 구역 판단", "rssi"],
    ["방향: 두 안테나의 위상", "aoa"],
    ["채널 사운딩", "cs"],
    ["시간은 속일 수 없다와 정리", "trust"],
  ] as [string, SceneId][],
  notes: ["RSSI 예시는 1 m 기준 −59 dBm, 트인 곳(n = 2)을 가정했습니다. 채널 사운딩 그래프는 3 m일 때의 이상적인 왕복 위상입니다.", "실제 ‘찾기’ 기능이 어떤 기술을 쓰는지는 제품마다 다릅니다."],
  links: [
    ...[["BluetoothBook 입문 11장 “위치 찾기: RSSI에서 채널 사운딩까지”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/location.html"]],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 1] Part A §9.1~§9.3(채널 사운딩 개요, PBR 거리 식, 150 m 모호성), [Vol 6] Part H(채널 사운딩), [Vol 6] Part A §2(CS 채널)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "위치 찾기", "RSSI", "AoA", "방향 찾기", "채널 사운딩", "Channel Sounding", "Bluetooth 6.0", "블루투스 입문", "ConnectivityBook"],
};
