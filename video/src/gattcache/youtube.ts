/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=gattcache)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "기기 펌웨어가 바뀌면, 앱은 어떻게 알아챌까? | 블루투스 심화 4: Database Hash와 Robust Caching",
  summary: ["앱은 블루투스 기기의 메뉴판(GATT 데이터베이스)을 한 번 훑어 칸 번호를 기억해 둡니다. 그런데 펌웨어를 업데이트해 메뉴판이 바뀌면, 기억해 둔 번호가 엉뚱한 칸을 가리킬 수 있습니다. 앱은 그걸 어떻게 알아챌까요?", "칸 번호(핸들) 캐싱과 그 함정, 메뉴판의 지문인 Database Hash가 무엇으로 만들어지고 언제 바뀌는지, 옛 번호로 물으면 오류(0x12)로 알려 주는 Robust Caching, 그리고 조용히 버려지는 쓰기 명령까지 직접 계산한 그림으로 따라갑니다."],
  chapters: [
    ["메뉴판이 바뀌면", "hook"],
    ["기억해 둔 칸 번호", "cache"],
    ["메뉴판의 지문", "hash"],
    ["무엇이 지문을 바꾸나", "what"],
    ["옛 번호로 물으면, 그리고 정리", "robust"],
  ] as [string, SceneId][],
  notes: ["데이터베이스와 지문(Database Hash)은 책 시뮬레이터의 예시 데이터베이스로 직접 계산한 값입니다. 칸이 밀리는 장면은 배터리 서비스를 심박 서비스 앞에 끼운 예입니다.", "오류(0x12)는 기기와 앱이 모두 Robust Caching을 쓸 때의 동작입니다."],
  links: [
    ["BluetoothBook 심화 11장 “ATT/GATT 심화: EATT, 큐 쓰기, Database Hash”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/gatt.html"],
    ["BluetoothBook 입문 7장 “GATT: 데이터를 담는 메뉴판”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/gatt.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 3] Part G §7.3·§7.3.1(Database Hash와 계산 규칙), §2.5.2.1(Robust Caching), [Vol 3] Part F §3.4.1.1(오류 0x12 Database Out Of Sync)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 여섯 번째 영상에서…")이 나올 때 입문 6편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/Tzo8nKy6uoo", teaser: "지난 영상 보기", message: "입문 6편: 처음 보는 심박계인데 앱은 어떻게 심박수를 읽을까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "GATT", "Database Hash", "Robust Caching", "펌웨어 업데이트", "블루투스 심화", "ConnectivityBook"],
};
