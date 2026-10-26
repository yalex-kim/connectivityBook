/**
 * 유튜브 업로드 정보. scripts/youtube.ts(VIDEO=encrypt)가 이것과 대본·장면 시각으로 설명문(챕터 포함)과 자막(.srt)을 만든다.
 */
import type { SceneId } from "./script";

export const YOUTUBE = {
  title: "저장해 둔 열쇠 하나로, 몇 년 동안 똑같이 잠가도 괜찮을까? | 블루투스 심화 6: 세션 키와 AES-CCM",
  summary: ["블루투스 기기는 한 번 페어링하면 키(LTK)를 저장해 두고 다음부터는 페어링을 건너뜁니다. 그럼 그 키 하나로 몇 년 동안 모든 데이터를 똑같이 잠가도 괜찮을까요?", "연결마다 새로 만드는 세션 키, 엿듣는 사람이 공중의 값만으로는 세션 키를 만들 수 없는 이유, 패킷마다 번호와 방향을 섞는 nonce, 위조와 재생을 막는 4바이트 MIC까지 사양 샘플 값으로 직접 계산한 그림으로 따라갑니다."],
  chapters: [
    ["저장한 키 하나로?", "hook"],
    ["연결마다 새 세션 키", "session"],
    ["엿듣는 사람이 아는 것", "listen"],
    ["같은 내용도 다르게: nonce", "nonce"],
    ["MIC와 정리", "mic"],
  ] as [string, SceneId][],
  notes: ["세션 키와 암호문은 사양 샘플([Vol 6] Part C §1)의 값으로 책의 계산을 돌린 결과입니다. 다음 연결의 세션 키는 무작위 값 한 바이트만 바꾼 예입니다.", "이 영상은 LE 링크 계층 암호화의 원리와 방어를 다룹니다."],
  links: [
    ["BluetoothBook 심화 6장 “링크 계층 암호화: 세션 키와 AES-CCM”", "https://yalex-kim.github.io/connectivityBook/bluetooth-deep/chapters/encryption.html"],
    ["BluetoothBook 입문 8장 “페어링과 보안”", "https://yalex-kim.github.io/connectivityBook/bluetooth/chapters/security.html"],
    ["ConnectivityBook 서재", "https://yalex-kim.github.io/connectivityBook/"],
  ] as [string, string][],
  sources: ["Bluetooth Core Specification 6.3 — [Vol 6] Part B §5.1.3.1(암호화 시작, SK = e(LTK, SKD)), [Vol 6] Part E §1·§2.1·§2.2(AES-CCM, nonce, MIC), [Vol 6] Part C §1(암호화 샘플)"],
  credits: ["나레이션: Typecast AI 음성(예슬)", "만든 도구: Remotion, three.js"],
  /** 오른쪽 위 카드: 훅 첫 문장("입문편 일곱 번째 영상에서…")이 나올 때 입문 7편으로 */
  cards: [{ scene: "hook", sentence: 0, video: "https://youtu.be/2Lgj7DW7r40", teaser: "지난 영상 보기", message: "입문 7편: 차는 숫자를 확인하는데, 이어폰은 왜 그냥 연결될까?" }],
  tags: ["블루투스", "Bluetooth", "BLE", "암호화", "세션 키", "AES-CCM", "LTK", "블루투스 심화", "ConnectivityBook"],
};
