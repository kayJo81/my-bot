#!/usr/bin/env python3
"""Daum 메일을 로그인 쿠키(DAUM_COOKIES)로 열어 목록을 받거나, 고른 메일을 휴지통으로 옮깁니다.

사용법:
  python scripts/daum_mail.py probe          → 받은편지함을 열며 오가는 API 응답을 저장(구조 파악용)
  python scripts/daum_mail.py list [쪽수]     → 받은편지함 목록(보낸사람·제목·날짜·ID)을 저장
  python scripts/daum_mail.py trash "id,id"  → 해당 메일을 휴지통으로 이동
공개 저장소라 워크플로가 결과를 암호화해서만 출력합니다. 영구 삭제는 하지 않습니다.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def main():
    mode = sys.argv[1]
    arg = sys.argv[2] if len(sys.argv) > 2 else ""
    out = {"mode": mode, "api": [], "requests": [], "log": []}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(load_cookies("DAUM_COOKIES", ".daum.net"))
        page = ctx.new_page()
        page.set_default_timeout(30000)

        def on_req(rq):
            if "mail.daum.net" in rq.url and rq.resource_type in ("xhr", "fetch"):
                h = {k: v for k, v in rq.headers.items() if k.lower() not in ("cookie",)}
                out["requests"].append({"m": rq.method, "u": rq.url[:300], "body": (rq.post_data or "")[:800], "h": h if rq.method != "GET" else {}})

        def on_resp(r):
            if "mail.daum.net" in r.url and r.request.resource_type in ("xhr", "fetch") and r.status == 200:
                try:
                    out["api"].append({"url": r.url[:300], "json": r.json()})
                except Exception:
                    pass
        page.on("request", on_req)
        page.on("response", on_resp)
        page.goto("https://mail.daum.net/", wait_until="domcontentloaded")
        page.wait_for_timeout(8000)
        out["log"].append(page.url[:80])
        if "kakao.com" in page.url or "logins.daum" in page.url:
            print("도착:", page.url.split("?")[0][:60], flush=True)
            sys.exit("로그인이 풀려 있습니다(DAUM_COOKIES 갱신 필요).")
        if mode == "probe":
            out["html_sample"] = page.content()[:3000]
        if mode in ("list", "discover"):
            # 메일함별 전체 목록(보낸사람·제목·시각·ID만)
            folders = ["INBOX", "PROMOTION", "SHOPPING", "SOCIAL", "BILL", "SPAM"]
            out["mails"] = {}
            for fid in folders:
                rows, off = [], 0
                while off < 3000:
                    j = page.evaluate("""async ([f, o]) => { const r = await fetch(`https://cmail.daum.net/v2/mails?offset=${o}&limit=100&folderId=${f}&includeVIPLabel=true`, {credentials: 'include'});
                        return r.ok ? r.json() : {err: r.status}; }""", [fid, off])
                    if "err" in j:
                        out["log"].append(f"{fid} {off} 오류 {j['err']}")
                        break
                    ms = j.get("mails", [])
                    rows += [{"id": m.get("id"), "from": (m.get("from") or {}).get("name"), "addr": (m.get("from") or {}).get("addr"),
                              "subject": m.get("subject"), "t": m.get("recvTime"), "labels": m.get("labelIds")} for m in ms]
                    off += 100
                    if len(ms) < 100:
                        break
                out["mails"][fid] = {"total": j.get("total") if isinstance(j, dict) else None, "rows": rows}
                print(f"{fid}: {len(rows)}통", flush=True)
        if mode == "clean":
            import re
            ad = re.compile(r"^\s*[\(\[]\s*광고\s*[\)\]]")
            folders = ["INBOX", "PROMOTION", "SHOPPING", "SOCIAL", "BILL", "SPAM"]
            junk, keep = [], 0
            for fid in folders:
                off = 0
                while off < 5000:
                    j = page.evaluate("""async ([f, o]) => { const r = await fetch(`https://cmail.daum.net/v2/mails?offset=${o}&limit=100&folderId=${f}`, {credentials: 'include'});
                        return r.ok ? r.json() : {err: r.status}; }""", [fid, off])
                    ms = j.get("mails", []) if "err" not in j else []
                    for m in ms:
                        subj = m.get("subject") or ""
                        # 쓸데없는 메일: 스팸·프로모션 메일함 전체, 그리고 어느 메일함이든 제목이 (광고)/[광고]로 시작하는 메일
                        if fid in ("SPAM", "PROMOTION") or ad.match(subj):
                            junk.append({"id": m["id"], "f": fid, "subject": subj[:60], "from": (m.get("from") or {}).get("name")})
                        else:
                            keep += 1
                    off += 100
                    if len(ms) < 100:
                        break
            out["junk"] = junk
            print(f"쓸데없는 메일 {len(junk)}통, 남길 메일 {keep}통", flush=True)
            # 삭제: 화면에서 첫 통을 지워 삭제 요청 형식을 잡고, 같은 형식으로 나머지를 보냅니다.
            out["requests"] = []
            done = 0
            if junk:
                first = junk[0]
                page.goto(f"https://mail.daum.net/top/{first['f']}", wait_until="domcontentloaded")
                page.wait_for_timeout(6000)
                try:
                    row = page.locator("li, tr").filter(has_text=first["subject"][:20]).first
                    row.locator("input[type=checkbox], label[for], [class*=check]").first.click(timeout=6000)
                    page.wait_for_timeout(800)
                    page.get_by_role("button", name="삭제", exact=True).locator("visible=true").first.click(timeout=6000)
                    page.wait_for_timeout(3000)
                except Exception as e:  # noqa: BLE001
                    out["log"].append(f"첫 삭제 실패 {e}"[:300])
                dels = [r for r in out["requests"] if r["m"] in ("POST", "PUT", "PATCH", "DELETE") and first["id"] in (r["u"] + r["body"])]
                out["delete_req"] = dels[:2]
                if dels:
                    done = 1
                    r0 = dels[0]
                    rest = [x["id"] for x in junk[1:]]
                    for k in range(0, len(rest), 50):
                        chunk = rest[k:k + 50]
                        body = r0["body"]
                        url = r0["u"]
                        if first["id"] in body:
                            # 본문에 ID 목록이 들어 있는 형식: 첫 ID 자리를 묶음 ID로 바꿉니다.
                            try:
                                bj = json.loads(body)
                                def sub(o):
                                    if isinstance(o, list) and first["id"] in o:
                                        return chunk
                                    if isinstance(o, dict):
                                        return {kk: sub(vv) for kk, vv in o.items()}
                                    return o
                                body = json.dumps(sub(bj))
                            except Exception:
                                body = body.replace(first["id"], ",".join(chunk))
                            res = page.evaluate("""async ([m, u, b, ct]) => { const r = await fetch(u, {method: m, credentials: 'include', headers: {'Content-Type': ct}, body: b}); return r.status; }""",
                                                [r0["m"], url, body, r0["h"].get("content-type", "application/json")])
                            out["log"].append(f"묶음 {k // 50 + 1}: {len(chunk)}통 → {res}")
                            if res in (200, 204):
                                done += len(chunk)
                        else:
                            # URL에 ID가 하나씩 들어가는 형식
                            for mid in chunk:
                                res = page.evaluate("""async ([m, u, b, ct]) => { const r = await fetch(u, {method: m, credentials: 'include', headers: {'Content-Type': ct}, body: b || undefined}); return r.status; }""",
                                                    [r0["m"], url.replace(first["id"], mid), body.replace(first["id"], mid), r0["h"].get("content-type", "application/json")])
                                if res in (200, 204):
                                    done += 1
            print(f"휴지통으로 옮김: {done}통", flush=True)
        if mode == "discover":
            # 화면에서 '(광고)' 메일 한 통을 골라 삭제 버튼을 눌러, 삭제 API 형식을 기록합니다.
            out["requests"] = []
            page.goto("https://mail.daum.net/top/INBOX", wait_until="domcontentloaded")
            page.wait_for_timeout(6000)
            row = page.locator("li, tr").filter(has_text="(광고)").first
            try:
                cb = row.locator("input[type=checkbox], label, .ico_check, [class*=check]").first
                cb.click(timeout=6000)
                page.wait_for_timeout(800)
                page.get_by_role("button", name="삭제", exact=True).locator("visible=true").first.click(timeout=6000)
                page.wait_for_timeout(3000)
                out["log"].append("삭제 클릭 완료")
            except Exception as e:  # noqa: BLE001
                out["log"].append(f"삭제 시도 실패 {e}"[:300])
                out["buttons"] = page.evaluate("""() => [...document.querySelectorAll('button')].filter(b=>b.offsetParent).map(b=>(b.innerText||b.getAttribute('aria-label')||'').trim().slice(0,15)).slice(0,60)""")
        b.close()
    with open("daum_mail_out.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"API 응답 {len(out['api'])}개, 요청 {len(out['requests'])}개 저장(암호화되어 출력)", flush=True)


if __name__ == "__main__":
    main()
