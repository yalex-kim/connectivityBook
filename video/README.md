# ConnectivityBook 영상 (Remotion)

책 내용을 [Remotion](https://www.remotion.dev/)으로 만든 영상입니다. 책 사이트(GitHub Pages)와는 따로 동작하며, 이 폴더에서만 빌드합니다. 새 영상을 만들 때는 [RULES.md](RULES.md)의 진행 순서와 기준을 따릅니다.

| 영상 | 컴포지션 | 형식 | 근거 |
|---|---|---|---|
| 블루투스는 왜 AFH가 필요할까: Wi-Fi와의 공존 | `AfhExplainerVoice` (나레이션) · `AfhExplainer` (무음) | 가로 1920×1080, 30fps, 나레이션판 약 1분 45초 · 무음판 약 1분 52초 | BluetoothBook 입문 2장(radio)·4장(hopping), [Vol 6] Part B §4.5.8, [Vol 2] Part B §2.6.3 |

## 준비

Node 18 이상(npm 포함)이 필요합니다. 이 NAS에서는 `/volume1/dev/.tools/node`(Node 22)를 씁니다.

```bash
export PATH=/volume1/dev/.tools/node/bin:$PATH
cd video
npm install
```

Remotion은 처음 렌더할 때 Chrome Headless Shell을 내려받습니다. 이미 받아 둔 브라우저를 쓰려면 `REMOTION_BROWSER`에 경로를 줍니다(예: Playwright의 `chrome-headless-shell`).

3D 장면은 `@remotion/three`(three.js, react-three-fiber)로 그립니다. GPU가 없는 서버에서도 되도록 `remotion.config.ts`가 WebGL을 SwiftShader(`swangle`)로 돌립니다. 그래서 렌더링이 느립니다(NAS 2코어에서 약 1분 45초 영상에 수십 분).

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
- `src/afh/world3d.tsx` — 3D 무대: 주파수 축 위의 Wi-Fi 벽·블루투스 채널 기둥(`Stage3D`)과 시간이 앞으로 흘러오는 폭포형 지도(`Waterfall3D`), 카메라 이동(`camLerp`).
- `src/afh/devices.tsx` — 훅의 기기 장면(공유기·노트북·스마트폰·이어폰·스마트워치·마우스).
- `src/afh/parts.tsx` — 제목, 자막, 누적 손실률 그래프, 카드 같은 2D 부품.
- `src/afh/AfhExplainer.tsx` — 장면 조립.
- `public/fonts/` — Pretendard(OFL, `LICENSE-Pretendard.txt`).

## 나레이션

나레이션은 `src/afh/script.ts`의 `say` 문장들을 타입캐스트로 읽은 것입니다. 화면 자막은 같은 문장을 기호로 적은 `caption`이고, 나레이션이 그 문장을 읽는 동안 보입니다(두 배열의 문장 수가 같아야 한다).

```bash
set -a; . /volume1/dev/k-history-video-agent/.env; set +a   # TYPECAST_API_KEY, TYPECAST_VOICE_ID
/volume1/dev/k-history-video-agent/.venv/bin/python scripts/narrate.py [--redo hop,map] [--emotion hop:tonedown]
```

- 장면마다 `public/audio/<id>.wav`를 한 번만 만든다. 문장을 고친 장면은 `--redo`로 지정해야 다시 만든다(지정하지 않으면 옛 음성이라고 알리고 멈춘다).
- 감정은 장면마다 자동으로 고르지 않고 '보통'으로 고정한다. 자동 선택(SmartPrompt)은 장면마다 톤이 튀었다(도약 장면이 다른 장면보다 약 5반음 높았다).
- 음성은 만든 그대로 쓴다. 높이·속도를 후처리로 바꾸면 소리가 이상해지므로, 한 장면의 톤이 튀면 `--redo`로 다시 만든다(필요하면 `--emotion`으로 그 장면의 감정 프리셋을 고른다).
- 숫자는 읽힐 소리대로 적는다. 채널 번호는 "일번, 육번, 십일번"처럼 적는다("1번"은 "한 번"으로 읽혔다). 자막에는 숫자를 그대로 쓴다.
- 음성에서 쉼 위치를 찾아 문장이 바뀌는 시각(`cues`)을 기록한다. 자막 전환, 공식 장면의 막대, 덮인 채널의 하나 → 셋 전환 같은 화면 변화가 이 시각에 맞춰진다.
- 타입캐스트는 무료 계정이라 실패해도 자동으로 다시 부르지 않고 멈춘다.
- 끝나면 `src/afh/durations.json`(장면별 음성 길이, 문장 시각, 문장)을 쓴다. `npm run check`가 이 파일이 지금 대본으로 만든 것인지 확인한다. 나레이션판은 장면 길이를 음성 길이 + 여백(0.3초 앞, 0.6초 뒤)으로 맞추고, 애니메이션이 다 보이는 최소 길이보다 짧게는 줄이지 않는다.
- 음성 파일은 저장소에 올리지 않는다(`.gitignore`). 길이 파일만 올린다.

## 화면 원칙 (자세한 것은 RULES.md)

- 모든 장면은 그림·개념도·도식으로 보여 준다. 글자만 있는 카드나 슬라이드는 쓰지 않는다.
- 공간이 있는 장면(대역, 시간-채널 지도)은 3D와 카메라 이동으로, 공식·절차는 2D 도식으로.
- 한 가지 조건의 숫자를 사실처럼 보이지 않게, 조건과 공식을 함께 보여 준다.
- 마지막 장면은 내용을 정리한다.
