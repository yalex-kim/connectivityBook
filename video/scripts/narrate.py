"""장면별 나레이션을 타입캐스트로 만든다(src/afh/script.ts의 say).

- 이미 있는 public/audio/<id>.wav는 다시 만들지 않는다.
- 타입캐스트는 무료 계정이라 실패해도 다시 부르지 않고 바로 멈춘다.
- 끝나면 src/afh/durations.json에 장면별 음성 길이(초)를 쓴다. 영상은 이 길이에 맞춰 장면을 늘리거나 줄인다.

실행(키는 k-history-video-agent의 .env, SDK는 그 가상환경):
  set -a; . /volume1/dev/k-history-video-agent/.env; set +a
  /volume1/dev/k-history-video-agent/.venv/bin/python scripts/narrate.py
"""

import json
import re
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "src/afh/script.ts"
AUDIO = ROOT / "public/audio"
OUT = ROOT / "src/afh/durations.json"


def scenes() -> list[tuple[str, str]]:
    src = SCRIPT.read_text(encoding="utf-8")
    return re.findall(r'id: "(\w+)",.*?say: "(.*?)",\n', src, flags=re.S)


def seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def main() -> None:
    sys.path.insert(0, "/volume1/dev/k-history-video-agent/src")
    from khva.providers.typecast import TypecastSpeech

    AUDIO.mkdir(parents=True, exist_ok=True)
    items = scenes()
    print(f"{len(items)}개 장면, {sum(len(s) for _, s in items)}자")
    tts = None
    for sid, text in items:
        path = AUDIO / f"{sid}.wav"
        if path.exists():
            print(f"  {sid}: 있음, 건너뜀")
            continue
        tts = tts or TypecastSpeech()
        try:
            tts.synthesize(text, path)
        except Exception as e:  # 다시 부르지 않는다
            path.unlink(missing_ok=True)
            sys.exit(f"  {sid}: 실패 — {e}\n다시 시도하지 않고 멈춥니다.")
        print(f"  {sid}: {seconds(path):.2f}초")
    durations = {sid: round(seconds(AUDIO / f"{sid}.wav"), 3) for sid, _ in items}
    OUT.write_text(json.dumps(durations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"합계 {sum(durations.values()):.1f}초 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
