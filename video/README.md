# ConnectivityBook 영상 (Remotion)

책 내용을 [Remotion](https://www.remotion.dev/)으로 만든 영상입니다. 책 사이트(GitHub Pages)와는 따로 동작하며, 이 폴더에서만 빌드합니다.

| 영상 | 컴포지션 | 형식 | 근거 |
|---|---|---|---|
| Wi-Fi 옆 블루투스는 패킷을 몇 % 잃을까 | `WifiLossShort` | 세로 1080×1920, 30fps, 약 56초, 무음(자막) | BluetoothBook 입문 4장 `hopping.html`의 예측 문제와 시뮬레이터 |

## 준비

Node 18 이상(npm 포함)이 필요합니다. 이 NAS에서는 `/volume1/dev/.tools/node`(Node 22)를 씁니다.

```bash
export PATH=/volume1/dev/.tools/node/bin:$PATH
cd video
npm install
```

Remotion은 처음 렌더할 때 Chrome Headless Shell을 내려받습니다. 이미 받아 둔 브라우저를 쓰려면 `REMOTION_BROWSER`에 경로를 줍니다(예: Playwright의 `chrome-headless-shell`).

## 만들기

```bash
npm run check    # 영상의 계산이 책과 같은지 + 타입 검사
npm run studio   # 브라우저에서 미리 보기·편집
npm run still    # 정지 화면 한 장 (out/still.png)
npm run render   # out/wifi-loss-short.mp4
```

## 구조

- `src/book.ts` — 책의 계산 함수(LE 채널 주파수, Wi-Fi가 덮는 채널, 채널 선택 알고리즘 #2)를 그대로 옮긴 것. `scripts/check-book.mjs`가 `../bluetooth/chapters/hopping.html`의 원본과 같은 값을 내는지(1,000여 개) 확인하고, 영상이 말하는 수치(31/37, 41.9%, 표본 25/60, 적응형 도약 0%)도 검사한다.
- `src/wifi-loss/script.ts` — 장면 순서, 길이(프레임), 자막. 자막이 곧 나레이션 대본이다.
- `src/wifi-loss/parts.tsx` — 제목, 자막, 대역 지도, 시간-채널 격자 같은 부품.
- `src/wifi-loss/WifiLossShort.tsx` — 장면 조립.
- `public/fonts/` — Pretendard(OFL, `LICENSE-Pretendard.txt`).

화면 아래 약 20%는 쇼츠 UI가 덮으므로 비워 두고, 자막은 그 위에 둡니다.

## 나레이션

지금은 무음판입니다. 타입캐스트는 무료 계정이라 실패해도 자동으로 다시 부르지 않습니다. 대본(`script.ts`의 자막)을 확정한 뒤 요청이 있을 때 한 번만 음성을 만들고, 장면 길이를 음성 길이에 맞춥니다. 음성 파일(`public/audio/`)은 저장소에 올리지 않습니다.
