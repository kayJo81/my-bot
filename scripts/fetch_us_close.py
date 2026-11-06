#!/usr/bin/env python3
"""미국장 마감 시황용 데이터: 4대 지수·반도체지수·금리·달러·유가·코인과 워치리스트 종목의 정규장 종가.

사용법: python3 scripts/fetch_us_close.py reports/2026-11-07
출력:  <폴더>/close.json, <폴더>/close_table.txt(사람이 읽는 표), <폴더>/flash_us.txt(미국장 시간대 속보)
종료 코드: 0 정상, 3 휴장(오늘 미국 정규장 종가가 없음 → 루틴은 조용히 끝냄)
"""
import json
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
ET = ZoneInfo("America/New_York")
KST = timezone(timedelta(hours=9))
MACRO = ["^DJI", "^GSPC", "^IXIC", "^RUT", "^SOX", "^NDX", "^VIX", "^TNX", "^FVX", "^TYX",
         "DX-Y.NYB", "CL=F", "BZ=F", "GC=F", "BTC-USD", "ETH-USD", "JPY=X"]
EXTRA = ["HPQ", "GM", "F", "RIVN", "LCID", "IONQ", "QBTS", "INTU", "MDB", "NET", "SHOP", "UBER",
         "VST", "TEAM", "MCHP", "ALAB", "SOFI", "XYZ", "PYPL", "NFLX", "AVAV", "KTOS", "LMT"]


def quote(sym):
    u = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=1d&range=15d"
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        r = json.load(urllib.request.urlopen(req, timeout=30))["chart"]["result"][0]
        off = r["meta"].get("gmtoffset", 0)
        rows = [(datetime.fromtimestamp(t + off, timezone.utc).date().isoformat(), c)
                for t, c in zip(r["timestamp"], r["indicators"]["quote"][0]["close"]) if c is not None]
        return sym, rows[-7:]
    except Exception as e:  # noqa: BLE001
        return sym, str(e)[:120]


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    wl = json.loads((ROOT / "watchlist.json").read_text(encoding="utf-8"))
    names = {t["s"]: t["n"] for g in wl["groups"] for t in g["tickers"]}
    syms = MACRO + sorted(set(names) | set(EXTRA))
    with ThreadPoolExecutor(10) as ex:
        res = dict(ex.map(quote, syms))

    today = datetime.now(ET).date().isoformat()
    spx = res.get("^GSPC")
    if not isinstance(spx, list) or not spx or spx[-1][0] != today:
        print(f"휴장 또는 오늘({today} ET) 종가 없음 → 종료")
        sys.exit(3)

    # 주간 기준일: 직전 금요일(또는 그 이전 마지막 거래일) 종가
    lines, data = [], {}
    for s in syms:
        v = res[s]
        if not isinstance(v, list) or len(v) < 2 or v[-1][0] != today:
            lines.append(f"{s:9} 데이터 없음/오늘 종가 아님")
            continue
        (d0, c0), (d1, c1) = v[-2], v[-1]
        wk = [c for d, c in v[:-1] if datetime.fromisoformat(d).weekday() == 4]
        w = f" 주간 {100 * (c1 / wk[-1] - 1):+.2f}%" if wk else ""
        data[s] = {"date": d1, "close": round(c1, 4), "prev": round(c0, 4), "chg": round(c1 - c0, 4),
                   "pct": round(100 * (c1 / c0 - 1), 2), "name": names.get(s, "")}
        lines.append(f"{s:9} {c1:,.2f} ({c1 - c0:+,.2f}, {100 * (c1 / c0 - 1):+.2f}%){w}  {names.get(s, '')}")
    (out / "close.json").write_text(json.dumps({"session": today, "quotes": data}, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "close_table.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

    # 미국장 시간대(정규장 개장 2시간 전 ~ 지금) 속보
    try:
        req = urllib.request.Request("https://mini-bbterminal.pages.dev/briefings/flash.json",
                                     headers={"User-Agent": "premarket-briefing-bot"})
        items = json.load(urllib.request.urlopen(req, timeout=60)).get("items", [])
        start = datetime.now(ET).replace(hour=7, minute=30, second=0, microsecond=0).timestamp()
        sel = sorted((x for x in items if isinstance(x.get("ts"), (int, float)) and x["ts"] >= start), key=lambda x: x["ts"])
        with open(out / "flash_us.txt", "w", encoding="utf-8") as f:
            for x in sel:
                t = datetime.fromtimestamp(x["ts"], ET).strftime("%H:%M ET")
                f.write(f"{t} [{x.get('s', '')}] {(x.get('ko') or x.get('h', ''))[:240].replace(chr(10), ' ')} | {x.get('u', '')}\n")
        print(f"속보 {len(sel)}건 -> flash_us.txt")
    except Exception as e:  # noqa: BLE001
        print("속보 수집 실패:", e)
    print("\n".join(lines[:8]))
    print(f"{today} 종가 {len(data)}/{len(syms)} 종목 -> close.json, close_table.txt")


if __name__ == "__main__":
    main()
