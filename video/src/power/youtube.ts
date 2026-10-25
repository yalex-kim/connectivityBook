/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=power)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "코인 전지 하나로 어떻게 몇 년을 버틸까? | 블루투스 전력·평균 전류 쉽게 이해하기",
  summary: ["분실물 태그에는 ‘배터리 1년’, 도어 센서에는 ‘3년’이라고 적혀 있습니다. 안에 든 건 동전만 한 CR2032(약 220 mAh) 하나. 무선부를 계속 켜 두면 이틀도 못 가는데, 어떻게 몇 년을 버틸까요?", "몇 µA로 자다가 몇 mA로 잠깐 깨는 전류 파형, 평균 전류 = 수면 전류 + 이벤트 전하 ÷ 간격의 계산, 수면 전류가 정하는 한계, 오래 잘수록 커지는 창 넓히기, 데이터를 묶어 보내면 줄어드는 고정 비용까지 그림으로 따라갑니다."],
  chapters: [
    ["배터리 1년, 3년의 비밀", "hook"],
    ["전류 파형", "wave"],
    ["산의 넓이와 평균 전류", "charge"],
    ["수면 전류가 정하는 한계", "floor"],
    ["창 넓히기", "widen"],
    ["묶어서 보내기와 정리", "batch"],
  ] as [string, SceneId][],
  notes: ["계산은 BluetoothBook 입문 9장의 예(CR2032 220 mAh, 수면 2 µA, 이벤트 한 번 15 µC)를 따랐습니다. 실제 수명은 칩, 설정, 온도, 전지 특성에 따라 다릅니다.", "전류 파형의 각 단계 길이와 높이는 대표값입니다."],
  links: [
    ...[["BluetoothBook 입문 9장 “전력: 코인 전지로 몇 년” (전류 파형·배터리 수명 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/power.html"]],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §4.2.2(시계 정확도: 활성 ±50 ppm, 수면 ±500 ppm), §4.5.7(창 넓히기)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "저전력", "배터리 수명", "코인 전지", "CR2032", "평균 전류", "창 넓히기", "분실물 태그", "블루투스 입문", "ConnectivityBook"],
};
