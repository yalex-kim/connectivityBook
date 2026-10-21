"""장면별 나레이션을 타입캐스트로 만들고, 문장이 바뀌는 시점을 찾는다(src/afh/script.ts의 say).

- 없는 public/audio/<id>.wav만 만든다. 다시 만들 장면은 --redo로 직접 지정한다.
- 타입캐스트는 무료 계정이라 실패해도 다시 부르지 않고 바로 멈춘다.
- 감정은 장면마다 자동으로 고르지 않고 '보통(normal)'으로 고정한다(장면마다 톤이 튀지 않게).
- 문장이 바뀌었는데 음성이 옛 문장이면 멈추고 알린다(--redo로 지정해야 다시 만든다).
- 끝나면 src/afh/durations.json에 장면별 {dur: 음성 길이, cues: 둘째 문장부터의 시작 시각, text}를 쓴다.

실행(키는 k-history-video-agent의 .env, SDK는 그 가상환경):
  set -a; . /volume1/dev/k-history-video-agent/.env; set +a
  /volume1/dev/k-history-video-agent/.venv/bin/python scripts/narrate.py [--redo hop,map] [--pitch hop:-2]

--pitch <id>:<반음>은 그 장면 음성의 높이만 바꾼다(길이는 그대로, ffmpeg rubberband). 타입캐스트를 다시 부르지 않고
한 장면만 톤이 튈 때 쓴다. 적용한 값은 durations.json의 pitch에 남고, 같은 값을 두 번 적용하지 않는다.
"""

import json
import os
import re
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "src/afh/script.ts"
AUDIO = ROOT / "public/audio"
OUT = ROOT / "src/afh/durations.json"
MODEL, TEMPO = "ssfm-v30", 1.07  # k-history-video-agent의 TypecastSpeech와 같은 값


def scenes() -> list[tuple[str, list[str]]]:
    src = SCRIPT.read_text(encoding="utf-8")
    out = []
    for sid, body in re.findall(r'id: "(\w+)",.*?say: \[(.*?)\],\s*caption:', src, flags=re.S):
        out.append((sid, re.findall(r'"((?:[^"\\]|\\.)*)"', body)))
    return out


def seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def silences(path: Path) -> list[tuple[float, float]]:
    """(쉼 끝 시각, 쉼 길이) 목록"""
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-30dB:d=0.08", "-f", "null", "-"], capture_output=True, text=True).stderr
    return [(float(e), float(d)) for e, d in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", log)]


def cues(path: Path, sentences: list[str]) -> list[float]:
    """둘째 문장부터 시작 시각: 글자 수 비율로 어림한 뒤 가장 그럴듯한 쉼에 맞춘다"""
    if len(sentences) < 2:
        return []
    dur, sil = seconds(path), silences(path)
    start = sil[0][0] if sil and sil[0][0] - sil[0][1] < 0.01 else 0.0  # 앞쪽 무음
    inner = [(e, d) for e, d in sil if start + 0.2 < e < dur - 0.2]
    total, acc, out = sum(len(s) for s in sentences), 0, []
    for s in sentences[:-1]:
        acc += len(s)
        target = start + (dur - start) * acc / total
        e, _ = min(inner, key=lambda x: abs(x[0] - target) - 1.5 * x[1]) if inner else (target, 0)
        out.append(round(max(e, out[-1] + 0.3 if out else 0), 3))
    return out


def synthesize(client, text: str, path: Path) -> None:
    from typecast.models import Output, PresetPrompt, TTSRequest

    response = client.text_to_speech(
        TTSRequest(
            voice_id=os.environ["TYPECAST_VOICE_ID"],
            text=text,
            model=MODEL,
            language="kor",
            prompt=PresetPrompt(emotion_preset="normal"),
            output=Output(audio_tempo=TEMPO, audio_format="wav"),
        )
    )
    path.write_bytes(response.audio_data)


def shift(path: Path, semitones: float) -> None:
    tmp = path.with_suffix(".tmp.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-af", f"rubberband=pitch={2 ** (semitones / 12):.6f}:formant=preserved", str(tmp)], check=True)
    tmp.replace(path)


def main() -> None:
    pitch = dict((k, float(v)) for k, v in (x.split(":") for x in sys.argv[sys.argv.index("--pitch") + 1].split(","))) if "--pitch" in sys.argv else {}
    redo = set(sys.argv[sys.argv.index("--redo") + 1].split(",")) if "--redo" in sys.argv else set()
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    AUDIO.mkdir(parents=True, exist_ok=True)
    items = scenes()
    stale = [sid for sid, say in items if sid not in redo and (AUDIO / f"{sid}.wav").exists() and isinstance(old.get(sid), dict) and old[sid].get("text") != " ".join(say)]
    if stale:
        sys.exit(f"문장이 바뀌었는데 음성이 옛것입니다: {', '.join(stale)} → --redo {','.join(stale)} 로 지정하세요.")
    client = None
    for sid, say in items:
        path = AUDIO / f"{sid}.wav"
        if sid in redo:
            path.unlink(missing_ok=True)
        if path.exists():
            continue
        if client is None:
            from typecast import Typecast

            client = Typecast()
        text = " ".join(say)
        try:
            synthesize(client, text, path)
        except Exception as e:  # 다시 부르지 않는다
            path.unlink(missing_ok=True)
            sys.exit(f"  {sid}: 실패 — {e}\n다시 시도하지 않고 멈춥니다.")
        print(f"  {sid}: 새로 만듦 {seconds(path):.2f}초 ({len(text)}자)")
    data = {}
    for sid, say in items:
        path = AUDIO / f"{sid}.wav"
        done = 0.0 if sid in redo else (old.get(sid, {}).get("pitch", 0.0) if isinstance(old.get(sid), dict) else 0.0)
        if sid in pitch and pitch[sid] != done:
            shift(path, pitch[sid] - done)
            print(f"  {sid}: 음높이 {pitch[sid] - done:+.1f}반음")
            done = pitch[sid]
        data[sid] = {"dur": round(seconds(path), 3), "cues": cues(path, say), "text": " ".join(say)}
        if done:
            data[sid]["pitch"] = done
        print(f"  {sid}: {data[sid]['dur']:.2f}초, 문장 시작 {data[sid]['cues']}")
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"합계 {sum(d['dur'] for d in data.values()):.1f}초 → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
