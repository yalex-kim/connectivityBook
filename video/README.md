# ConnectivityBook 영상 (Remotion)

책 내용을 [Remotion](https://www.remotion.dev/)으로 만든 영상입니다. 책 사이트(GitHub Pages)와는 따로 동작하며, 이 폴더에서만 빌드합니다.

| 영상 | 컴포지션 | 형식 | 근거 |
|---|---|---|---|
| 블루투스는 왜 AFH가 필요할까: Wi-Fi와의 공존 | `AfhExplainerVoice` (나레이션) · `AfhExplainer` (무음) | 가로 1920×1080, 30fps, 나레이션판 약 1분 38초 · 무음판 약 1분 52초 | BluetoothBook 입문 2장(radio)·4장(hopping), [Vol 6] Part B §4.5.8, [Vol 2] Part B §2.6.3 |

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
npm run render   # 나레이션판 out/afh-explainer.mp4 (public/audio/의 음성이 있어야 한다)
npm run render:silent   # 무음판 out/afh-explainer-silent.mp4
npm run loudnorm # 나레이션판 음량을 −16 LUFS로 맞춤 → out/afh-explainer-final.mp4 (ffmpeg)
```

## 구조

- `src/book.ts` — 책의 계산 함수(LE 채널 주파수, Wi-Fi가 덮는 채널, 채널 선택 알고리즘 #2)를 그대로 옮긴 것. `scripts/check-book.mjs`가 `../bluetooth/chapters/hopping.html`의 원본과 같은 값을 내는지(1,000여 개) 확인하고, 영상이 말하는 수치(덮인 채널 31/37, 조건별 13.5%·41.9%·8.4%, 적응형 도약 0%)와 누적 그래프 표본의 끝값도 검사한다. 숫자는 모두 영상 안의 가정(가정 카드)에서의 예시다.
- `src/afh/script.ts` — 장면 순서, 길이(프레임), 화면 자막(caption)과 나레이션 문장(say), 가정 카드, 조건별 예시.
- `src/afh/parts.tsx` — 제목, 자막, 2.4 GHz 대역 지도, 시간-채널 격자, 누적 손실률 그래프, 카드.
- `src/afh/AfhExplainer.tsx` — 장면 조립.
- `public/fonts/` — Pretendard(OFL, `LICENSE-Pretendard.txt`).

## 나레이션

나레이션은 `src/afh/script.ts`의 `say` 문장을 타입캐스트로 읽은 것입니다. 화면 자막은 `caption`입니다.

```bash
set -a; . /volume1/dev/k-history-video-agent/.env; set +a   # TYPECAST_API_KEY, TYPECAST_VOICE_ID
/volume1/dev/k-history-video-agent/.venv/bin/python scripts/narrate.py
```

- 장면마다 `public/audio/<id>.wav`를 한 번만 만든다. 이미 있으면 건너뛰므로, 문장을 고친 장면만 그 파일을 지우고 다시 돌린다.
- 타입캐스트는 무료 계정이라 실패해도 자동으로 다시 부르지 않고 멈춘다.
- 끝나면 `src/afh/durations.json`(장면별 음성 길이)을 쓴다. 나레이션판은 장면 길이를 음성 길이 + 여백(0.3초 앞, 0.6초 뒤)으로 맞추고, 애니메이션이 다 보이는 최소 길이보다 짧게는 줄이지 않는다.
- 음성 파일은 저장소에 올리지 않는다(`.gitignore`). 길이 파일만 올린다.
