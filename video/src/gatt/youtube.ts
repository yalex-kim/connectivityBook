/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=gatt)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 * 챕터는 장면 묶음으로 정한다(유튜브 규칙: 첫 챕터 0:00, 3개 이상, 각 10초 이상).
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "처음 보는 심박계인데 앱은 어떻게 심박수를 읽을까? | GATT 쉽게 이해하기",
  summary: [
    "처음 산 심박계를 운동 앱에 연결하면 바로 심박수가 뜹니다. 앱은 이 회사 제품을 한 번도 본 적이 없는데 말이죠.",
    "LE 기기 안의 데이터는 번호 붙은 칸(핸들)에 이름표(UUID)를 달고 들어 있습니다. 그 칸들을 서비스·특성·디스크립터로 묶는 공통 틀 GATT, 그 위에서 항목 이름과 값 형식을 정하는 심박 서비스 사양, 회사마다 다른 칸 번호를 찾는 과정, CCCD에 0x0001을 써서 알림을 켜는 방법, 도착한 두 바이트 00 48을 심박수 72로 읽기까지 그림으로 따라갑니다.",
  ],
  chapters: [
    ["처음 보는 심박계", "hook"],
    ["번호 붙은 칸과 이름표", "cells"],
    ["GATT 메뉴판: 틀은 GATT, 항목은 서비스 사양", "menu"],
    ["A사와 B사: 칸 번호만 다르다", "two"],
    ["알림 켜기: CCCD", "notify"],
    ["두 바이트 읽기", "bytes"],
  ] as [string, SceneId][],
  notes: [
    "A사 메뉴판은 BluetoothBook 입문 7장 심박계 GATT 서버 시뮬레이터와 같은 구성입니다. B사의 칸 번호는 설명을 위한 예시입니다.",
    "심박 서비스(0x180D)와 심박 측정값(0x2A37)의 값 형식은 Core가 아닌 Heart Rate Service 사양이 정합니다. 음악·통화 같은 클래식 프로파일은 GATT를 쓰지 않습니다.",
    "알림 주기는 기기마다 다릅니다. 화면의 알림 값은 예시입니다.",
  ],
  links: [
    ["BluetoothBook 입문 7장 “GATT: 데이터를 담는 메뉴판” (심박계 GATT 서버 시뮬레이터)", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/gatt.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ],
  sources: [
    "Bluetooth Core Specification 6.3 — [Vol 3] Part F §3.2(속성: 핸들·종류·값·권한), Part G(GATT: 서비스 0x2800·특성 0x2803·CCCD 0x2902, 찾기·알림·표시), Part B §2.5.1(16비트 UUID와 기본 UUID)",
    "Heart Rate Service 사양(Bluetooth SIG) — 심박 측정값 플래그와 형식",
  ],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  tags: ["블루투스", "Bluetooth", "BLE", "GATT", "ATT", "UUID", "CCCD", "심박계", "심박 서비스", "Heart Rate Service", "알림", "블루투스 입문", "무선 통신", "ConnectivityBook"],
};
