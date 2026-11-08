#!/usr/bin/env python3
"""네이버 메일에서 조건에 맞는 메일을 모아 휴지통으로 한꺼번에 옮깁니다(영구 삭제 아님).

사용법: python scripts/naver_mail_bulk.py '<규칙 JSON>'
규칙 예: {"search": [{"q": "LF몰", "email": ["fashionmaster@lfcorp.com"], "name": []}], "promotion": true}
  - search: 검색어로 찾은 메일 중 보낸 사람 주소(email) 또는 이름(name, 앞부분 일치)이 맞는 것만
  - promotion: true면 스마트메일함 '프로모션' 전체
결과(건수·제목 일부)는 워크플로가 암호화해서만 출력합니다.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

FETCH = """async ([u, body]) => {
  const r = await fetch(u, {method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body});
  const t = await r.text(); try { return JSON.parse(t); } catch (e) { return {raw: t.slice(0, 300), status: r.status}; } }"""


def main():
    rule = json.loads(sys.argv[1])
    out = {"targets": {}, "log": [], "delete": []}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(25000)
        reqs = []
        def _rq(rq):
            if "mail.naver.com/json" in rq.url:
                if "/select/delete" in rq.url:
                    out["delete_headers"] = {k: v for k, v in rq.headers.items() if k.lower() != "cookie"}
                body = rq.post_data or ""
                u = rq.url
                if not body and "?" in u:
                    u, body = u.split("?", 1)
                reqs.append((u, body))
        page.on("request", _rq)
        page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        if "nid.naver.com" in page.url:
            sys.exit("로그인이 풀려 있습니다(NAVER_COOKIES 갱신 필요).")

        targets = {}  # mailSN -> (folderSN, 구분, 제목)

        def page_all(url_tmpl_first, body_first, tag, keep):
            """첫 쪽 요청 형식을 받아 나머지 쪽을 같은 형식으로 받습니다."""
            n = 0
            for pg in range(1, 400):
                import re as _re
                body = _re.sub(r"(^|&)page=1(&|$)", lambda m_: f"{m_.group(1)}page={pg}{m_.group(2)}", body_first, count=1) if pg > 1 else body_first
                if pg > 1 and body == body_first:
                    break
                j = page.evaluate(FETCH, [url_tmpl_first, body])
                rows = j.get("mailData") or []
                for m in rows:
                    if keep(m):
                        targets[str(m.get("mailSN"))] = (m.get("folderSN"), tag, (m.get("subject") or "")[:40])
                        n += 1
                last = int(j.get("lastPage") or 1)
                if pg >= last or not rows:
                    break
            return n

        # 1) 검색 규칙
        for s in rule.get("search", []):
            reqs.clear()
            box = page.locator("input[type='search'], input[placeholder*='검색']").first
            box.click()
            box.fill(s["q"])
            box.press("Enter")
            page.wait_for_timeout(5000)
            sr = [r for r in reqs if "/json/search" in r[0]]
            if not sr:
                out["log"].append(f"{s['q']}: 검색 요청을 못 잡음")
                continue
            u, body = sr[-1]
            out.setdefault("search_req", []).append((u, body[:300]))
            if "page=" not in body:
                body = "page=1&" + body
            emails = [e.lower() for e in s.get("email", [])]
            names = s.get("name", [])

            def keep(m, emails=emails, names=names):
                f = m.get("from") or {}
                em = (f.get("email") or "").lower()
                nm = f.get("name") or ""
                return (em in emails and (not names or any(nm.startswith(x) for x in names))) or (not emails and any(nm.startswith(x) for x in names))
            n = page_all(u, body, s["q"], keep)
            out["log"].append(f"{s['q']}: {n}통")
            print(f"[{s['q']}] {n}통", flush=True)
            page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

        # 2) 프로모션 메일함
        if rule.get("promotion"):
            reqs.clear()
            try:
                page.get_by_text("프로모션", exact=True).first.click()
                page.wait_for_timeout(5000)
                from urllib.parse import parse_qsl, urlencode
                sr = [r for r in reqs if r[0].endswith("/json/list/sender")]
                senders = []
                if sr:
                    u, body = sr[-1]
                    q = dict(parse_qsl(body, keep_blank_values=True))
                    for pg in range(1, 200):
                        q["page"] = str(pg)
                        j = page.evaluate(FETCH, [u, urlencode(q)])
                        if pg == 1:
                            out["sender_keys"] = list(j.keys())[:20] if isinstance(j, dict) else str(type(j))
                        got = []
                        def walk(o):
                            if isinstance(o, dict):
                                for kk in ("sender", "email", "senderAddress", "address"):
                                    v = o.get(kk)
                                    if isinstance(v, str) and "@" in v:
                                        got.append(v)
                                        break
                                for v in o.values():
                                    walk(v)
                            elif isinstance(o, list):
                                for v in o:
                                    walk(v)
                        walk(j)
                        new = [g for g in dict.fromkeys(got) if g not in senders]
                        senders += new
                        last = int(j.get("lastPage") or 0) if isinstance(j, dict) else 0
                        if not new or (last and pg >= last):
                            break
                out["promo_senders"] = len(senders)
                n = 0
                for snd in senders:
                    off = 0
                    while off < 5000:
                        body = urlencode({"sender": snd, "folderSN": "10", "startOffset": str(off), "pageSize": "100", "previewMode": "3", "u": q.get("u", "") if sr else ""})
                        j = page.evaluate(FETCH, ["https://mail.naver.com/json/list/specificSender/", body])
                        rows = []
                        def walk2(o):
                            if isinstance(o, dict):
                                if "mailSN" in o:
                                    rows.append(o)
                                else:
                                    for v in o.values():
                                        walk2(v)
                            elif isinstance(o, list):
                                for v in o:
                                    walk2(v)
                        walk2(j)
                        for m in rows:
                            targets[str(m.get("mailSN"))] = (m.get("folderSN", 10), "프로모션", (m.get("subject") or "")[:40])
                            n += 1
                        if len(rows) < 100:
                            break
                        off += 100
                out["log"].append(f"프로모션: 보낸 사람 {len(senders)}곳, {n}통")
                print(f"[프로모션] 보낸 사람 {len(senders)}곳, {n}통", flush=True)
            except Exception as e:  # noqa: BLE001
                out["log"].append(f"프로모션 실패 {e}"[:200])

        out["targets"] = {k: v for k, v in list(targets.items())}
        print(f"대상 합계 {len(targets)}통", flush=True)

        # 3) 삭제: 첫 통을 화면에서 지워 요청 형식을 잡고 나머지는 묶음으로
        if targets:
            sns = list(targets.keys())
            fsn0 = targets[sns[0]][0]
            reqs.clear()
            page.goto(f"https://mail.naver.com/v2/read/{fsn0}/{sns[0]}", wait_until="domcontentloaded")
            page.wait_for_timeout(3000)
            try:
                page.get_by_role("button", name="삭제", exact=True).locator("visible=true").first.click(timeout=6000)
                page.wait_for_timeout(2500)
            except Exception as e:  # noqa: BLE001
                out["log"].append(f"첫 삭제 실패 {e}"[:200])
            dr = [r for r in reqs if "/json/select/delete" in r[0]]
            out["delete_req"] = [(r[0], r[1][:400]) for r in dr]
            done = 1 if dr else 0
            if dr:
                u, body0 = dr[-1]
                rest = sns[1:]
                if rule.get("diag"):
                    from urllib.parse import parse_qsl, urlencode
                    hdr = {k: v for k, v in (out.get("delete_headers") or {}).items() if k.lower().startswith("x-") or k.lower() in ("content-type",)}
                    FETCH2 = """async ([u, body, h]) => { const r = await fetch(u, {method: 'POST', credentials: 'include', headers: h, body}); const t = await r.text(); return t.slice(0, 200); }"""
                    q0 = dict(parse_qsl(body0, keep_blank_values=True))
                    a1, a2, a3, a4, a5 = rest[0:1], rest[1:3], rest[3:5], rest[5:7], rest[7:9]
                    tries = [
                        ("한통-같은형식", a1, {"mailSNList": a1[0], "folderSNList": str(targets[a1[0]][0])}, False),
                        ("두통-폴더목록", a2, {"mailSNList": ",".join(a2), "folderSNList": ",".join(str(targets[x][0]) for x in a2)}, False),
                        ("두통-폴더하나", a3, {"mailSNList": ",".join(a3), "folderSNList": str(targets[a3[0]][0])}, False),
                        ("두통-헤더포함", a4, {"mailSNList": ",".join(a4), "folderSNList": ",".join(str(targets[x][0]) for x in a4)}, True),
                        ("한통-헤더포함", a5[:1], {"mailSNList": a5[0], "folderSNList": str(targets[a5[0]][0])}, True),
                    ]
                    out["diag"] = []
                    for name, ids, upd, useh in tries:
                        q = dict(q0)
                        q.update(upd)
                        h = hdr if useh else {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
                        res = page.evaluate(FETCH2, [u, urlencode(q), h])
                        out["diag"].append((name, len(ids), res))
                    out["hdr_names"] = list((out.get("delete_headers") or {}).keys())
                    rest = []
                from urllib.parse import parse_qsl, urlencode
                q0 = dict(parse_qsl(body0, keep_blank_values=True))
                PAR = """async ([u, bodies]) => {
                  let ok = 0, fail = 0, last = '';
                  const one = async (b) => { try { const r = await fetch(u, {method: 'POST', credentials: 'include',
                      headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body: b});
                      const t = await r.text(); if (t.includes('"OK"')) ok++; else { fail++; last = t.slice(0, 120); } } catch (e) { fail++; last = String(e); } };
                  for (let i = 0; i < bodies.length; i += 6) await Promise.all(bodies.slice(i, i + 6).map(one));
                  return {ok, fail, last}; }"""
                for k in range(0, len(rest), 300):
                    chunk = rest[k:k + 300]
                    bodies = []
                    for mid in chunk:
                        q = dict(q0)
                        q["mailSNList"] = mid
                        q["folderSNList"] = str(targets[mid][0])
                        bodies.append(urlencode(q))
                    r = page.evaluate(PAR, [u, bodies])
                    done += r["ok"]
                    out["delete"].append(r)
                    print(f"  {k + len(chunk)}/{len(rest)}: 성공 {r['ok']}, 실패 {r['fail']}", flush=True)
            print(f"휴지통으로 옮김: {done}통", flush=True)
        b.close()
    with open("naver_mail_out.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
