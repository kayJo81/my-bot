"""미니 블벅터 속보(flash.json)에서 워치리스트·앤트로픽·오픈AI 관련 새 속보를 골라 출력합니다.
사용: python3 scripts/watch_news.py [since_ts]   (생략하면 auto_blog/state.json의 last_ts 이후)
출력: 기업별로 묶은 후보 목록(JSON). 블로그 글감 고르기는 docs/AUTO_BLOG.md 절차를 따릅니다."""
import json, re, sys, urllib.request, datetime
URL = "https://mini-bbterminal.pages.dev/briefings/flash.json"
W = json.load(open("auto_blog/watchlist.json"))["groups"]
st = json.load(open("auto_blog/state.json"))
since = int(sys.argv[1]) if len(sys.argv) > 1 else st["last_ts"]
d = json.load(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"}), timeout=60))
items = d["items"] if isinstance(d, dict) else d
K = datetime.timezone(datetime.timedelta(hours=9))
pats = {}
for g, m in W.items():
    for tk, names in m.items():
        alts = [r"\$" + re.escape(tk) + r"\b"]
        for n in names:
            if re.match(r"[A-Za-z]", n):
                alts.append(r"(?<![A-Za-z])" + re.escape(n) + r"(?![A-Za-z])")
            elif re.match(r"[가-힣]", n) and len(n) <= 3:  # 짧은 한글 이름(델·줌·메타)은 다른 단어 속 글자와 구분
                alts.append(r"(?<![가-힣])" + re.escape(n) + r"(?!리전스|리젠스|타항공|타 항공)")
            elif n == "苹果":  # 사과 선물(苹果主力合约 등)과 구분
                alts.append(r"苹果(?!连续|主力|期货|合约|价格|产区|种植|期权)")
            else:
                alts.append(re.escape(n))
        pats[tk] = (g, re.compile("|".join(alts)))
out, maxts = {}, since
for x in sorted(items, key=lambda x: x["ts"]):
    ts = x["ts"] // 1000 if x["ts"] > 1e11 else x["ts"]
    if ts <= since: continue
    maxts = max(maxts, ts)
    text = (x.get("h") or "") + " | " + (x.get("ko") or "")
    for tk, (g, p) in pats.items():
        if p.search(text):
            out.setdefault(tk, {"group": g, "items": []})["items"].append({
                "kst": datetime.datetime.fromtimestamp(ts, K).strftime("%m-%d %H:%M"), "ts": ts, "src": x.get("s"),
                "imp": bool(x.get("imp")), "ko": x.get("ko"), "orig": (x.get("h") or "")[:300], "url": x.get("u")})
res = {"since": since, "until": maxts, "count": sum(len(v["items"]) for v in out.values()),
       "by_company": dict(sorted(out.items(), key=lambda kv: -len(kv[1]["items"])))}
print(json.dumps(res, ensure_ascii=False, indent=1))
