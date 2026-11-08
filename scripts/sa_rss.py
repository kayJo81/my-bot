#!/usr/bin/env python3
"""시킹알파 공개 RSS(로그인 불필요)에서 헤드라인을 모읍니다.

사용법: python scripts/sa_rss.py [출력.json] [티커,티커,...]
  티커를 안 주면 watchlist.json의 종목을 씁니다.
  피드: 시장 뉴스(market_currents.xml) + 종목별 피드(api/sa/combined/<티커>.xml)
결과: 제목·링크·발행 시각·티커만 저장합니다(본문 없음).
"""
import json
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

UA = "Mozilla/5.0 (compatible; my-bot-rss/1.0; +https://github.com/kayJo81/my-bot)"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.read()


def parse(xml_bytes, tag):
    out = []
    root = ET.fromstring(xml_bytes)
    for it in root.iter("item"):
        t = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        pub = it.findtext("pubDate") or ""
        try:
            ts = parsedate_to_datetime(pub).isoformat()
        except Exception:
            ts = pub
        out.append({"feed": tag, "title": t, "link": link, "published": ts})
    return out


def main():
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("sa_rss.json")
    if len(sys.argv) > 2 and sys.argv[2].strip():
        tickers = [t.strip().upper() for t in sys.argv[2].split(",") if t.strip()]
    else:
        wl = json.loads(Path("watchlist.json").read_text(encoding="utf-8"))
        tickers = [t["s"] for g in wl["groups"] for t in g["tickers"]]
    feeds = [("market", "https://seekingalpha.com/market_currents.xml")]
    feeds += [(t, f"https://seekingalpha.com/api/sa/combined/{t}.xml") for t in tickers]
    items, report = [], []
    for tag, url in feeds:
        try:
            st, body = fetch(url)
            got = parse(body, tag)
            items += got
            report.append((tag, st, len(got)))
        except Exception as e:  # noqa: BLE001
            report.append((tag, getattr(e, "code", type(e).__name__), 0))
        time.sleep(1.0)  # 서버 부담을 줄이려고 천천히
    seen, uniq = set(), []
    for it in sorted(items, key=lambda x: x["published"], reverse=True):
        if it["link"] in seen:
            continue
        seen.add(it["link"])
        uniq.append(it)
    out_path.write_text(json.dumps({"fetched": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "items": uniq}, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = sum(1 for _, st, _ in report if st == 200)
    print(f"피드 {len(feeds)}개 중 성공 {ok}개, 기사 {len(uniq)}건 → {out_path}")
    for tag, st, n in report:
        print(f"  {tag}: {st} ({n}건)")


if __name__ == "__main__":
    main()
