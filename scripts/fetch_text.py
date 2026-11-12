#!/usr/bin/env python3
"""공개 웹페이지의 본문 텍스트와 표를 출력합니다(읽기 전용). 사용법: python scripts/fetch_text.py URL [URL ...]"""
import subprocess
import sys
import tempfile
import urllib.request

from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"}
for url in [u for a in sys.argv[1:] for u in a.split() if u]:
    print(f"\n===== {url}")
    if ".pdf" in url.lower():  # 공개 PDF는 pdftotext로 본문 출력
        try:
            raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
            with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
                f.write(raw)
                f.flush()
                print(subprocess.run(["pdftotext", "-layout", f.name, "-"], capture_output=True, text=True).stdout[:60000])
        except Exception as e:  # noqa: BLE001
            print("실패:", e)
        continue
    try:
        hd = {"User-Agent": "my-bot research bot@example.com"} if "sec.gov" in url else UA  # SEC는 연락처형 UA 요구
        h = urllib.request.urlopen(urllib.request.Request(url, headers=hd), timeout=40).read().decode("utf-8", "ignore")
    except Exception as e:  # noqa: BLE001
        print("실패:", e)
        continue
    s = BeautifulSoup(h, "html.parser")
    for t in s(["script", "style", "nav", "footer", "header"]):
        t.decompose()
    for a in s.select("a[href]"):  # 실적·보고서 관련 링크는 주소도 함께 출력
        tx = a.get_text(" ", strip=True)
        if any(k in (tx + a["href"]).lower() for k in ("quarter", "results", "letter", "earnings")):
            print("[링크]", tx[:80], "->", a["href"])
    main = s.select_one("article, main, #mw-content-text, .entry-content") or s.body
    for tb in main.select("table"):
        print("[표]")
        for tr in tb.select("tr"):
            print(" | ".join(c.get_text(" ", strip=True) for c in tr.select("th,td")))
        tb.decompose()
    txt = "\n".join(l.strip() for l in main.get_text("\n").splitlines() if l.strip())
    print(txt[:30000])
