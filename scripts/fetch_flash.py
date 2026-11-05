#!/usr/bin/env python3
"""미니 블벅터 속보(flash.json)에서 탐색 구간(당일 15:30 KST ~ 지금)의 항목만 뽑아 저장합니다.

사용법: python3 scripts/fetch_flash.py out/2026-11-06
출력:  out/<날짜>/flash_window.json  (시간순, KST 시각 포함)
"""
import json
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

URL = "https://mini-bbterminal.pages.dev/briefings/flash.json"
KST = timezone(timedelta(hours=9))


def main() -> None:
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    out_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(KST)
    start = now.replace(hour=15, minute=30, second=0, microsecond=0)
    if now < start:  # 자정~15:30 사이에 수동 실행하면 전날 15:30부터
        start -= timedelta(days=1)

    req = urllib.request.Request(URL, headers={"User-Agent": "premarket-briefing-bot"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)

    items = []
    for it in data.get("items", []):
        ts = it.get("ts")
        if not isinstance(ts, (int, float)) or ts < start.timestamp():
            continue
        items.append({
            "kst": datetime.fromtimestamp(ts, KST).strftime("%H:%M"),
            "ts": ts,
            "h": it.get("h", ""),
            "ko": it.get("ko", ""),
            "u": it.get("u", ""),
            "s": it.get("s", ""),
        })
    items.sort(key=lambda x: x["ts"])

    result = {
        "window_start": start.strftime("%Y-%m-%d %H:%M KST"),
        "fetched_at": now.strftime("%Y-%m-%d %H:%M KST"),
        "count": len(items),
        "items": items,
    }
    path = out_dir / "flash_window.json"
    path.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(items)} items {result['window_start']} ~ {result['fetched_at']} -> {path}")


if __name__ == "__main__":
    main()
