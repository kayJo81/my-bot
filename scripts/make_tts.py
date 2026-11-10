#!/usr/bin/env python3
"""scenes.json의 문장마다 edge-tts로 음성(mp3)을 만듭니다. (GitHub Actions에서 실행)

사용법: python scripts/make_tts.py videos/<폴더>
결과: videos/<폴더>/audio/s{장면}_{문장}.mp3
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts


async def main(d: Path):
    cfg = json.loads((d / "scenes.json").read_text())
    out = d / "audio"
    out.mkdir(exist_ok=True)
    for i, sc in enumerate(cfg["scenes"]):
        for j, line in enumerate(sc["lines"]):
            f = out / f"s{i}_{j}.mp3"
            await edge_tts.Communicate(line, cfg.get("voice", "ko-KR-SunHiNeural"), rate=cfg.get("rate", "+0%")).save(str(f))
            print(f.name, f.stat().st_size, flush=True)


asyncio.run(main(Path(sys.argv[1])))
