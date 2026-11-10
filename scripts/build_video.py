#!/usr/bin/env python3
"""scenes.json + audio/*.mp3 + 장면 그림으로 1920x1080 MP4를 만듭니다(자막 포함).

사용법: python3 scripts/build_video.py videos/<폴더> [출력.mp4]
필요: ffmpeg(libass), node + playwright, 나눔고딕
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

GAP = 0.35      # 문장 사이 쉼
SCENE_PAD = 0.7  # 장면 끝 여유
FPS = 30


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "default=nw=1:nk=1", str(f)]).strip())


def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def wrap(text, n=34):
    # 한 줄 n자 안팎에서 공백 기준으로 두 줄까지 나눕니다.
    if len(text) <= n:
        return text
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > n and cur:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    return r"\N".join(lines)


def main():
    d = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else d / "video.mp4"
    cfg = json.loads((d / "scenes.json").read_text())
    tmp = Path(tempfile.mkdtemp(prefix="vid_"))
    repo = Path(__file__).resolve().parent.parent
    subprocess.run(["node", str(repo / "scripts/video_frames.cjs"), str(d / "scenes.json"), str(tmp)], check=True)

    events, t = [], 0.0
    audio_parts = []
    scene_lens = []
    for i, sc in enumerate(cfg["scenes"]):
        start = t
        for j, line in enumerate(sc["lines"]):
            a = d / "audio" / f"s{i}_{j}.mp3"
            ln = dur(a)
            events.append((t, t + ln, line))
            audio_parts.append((a, ln))
            t += ln
            if j < len(sc["lines"]) - 1:
                audio_parts.append((None, GAP)); t += GAP
        audio_parts.append((None, SCENE_PAD)); t += SCENE_PAD
        scene_lens.append(t - start)

    # 오디오 이어 붙이기
    lst = tmp / "a.txt"
    with lst.open("w") as fh:
        for k, (a, ln) in enumerate(audio_parts):
            w = tmp / f"a{k}.wav"
            if a is None:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", f"{ln:.3f}", str(w)], check=True)
            else:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(a), "-ar", "24000", "-ac", "1", str(w)], check=True)
            fh.write(f"file '{w}'\n")
    audio = tmp / "audio.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(audio)], check=True)

    # 장면별 영상(천천히 확대)
    vlist = tmp / "v.txt"
    with vlist.open("w") as fh:
        for i, ln in enumerate(scene_lens):
            n = int(round(ln * FPS))
            v = tmp / f"v{i}.mp4"
            z = "1+0.04*on/{}".format(max(n, 1))
            vf = (f"scale=3840:2160,zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},"
                  f"format=yuv420p")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-i", str(tmp / f"f{i}.png"), "-vf", vf,
                            "-frames:v", str(n), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", str(v)], check=True)
            fh.write(f"file '{v}'\n")
    silent = tmp / "silent.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(vlist), "-c", "copy", str(silent)], check=True)

    # 자막(ASS)
    ass = tmp / "sub.ass"
    head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,NanumGothic,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,14,0,2,120,120,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    with ass.open("w") as fh:
        fh.write(head)
        for s, e, line in events:
            fh.write(f"Dialogue: 0,{ts(s)},{ts(e)},Default,,0,0,0,,{wrap(line)}\n")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-i", str(audio), "-vf", f"ass={ass}",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-c:a", "aac", "-b:a", "128k",
                    "-shortest", "-movflags", "+faststart", str(out)], check=True)
    print(f"{out} {dur(out):.1f}s")


if __name__ == "__main__":
    main()
