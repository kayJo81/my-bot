#!/usr/bin/env python3
"""네이버 메일 휴지통을 비웁니다(영구 삭제). GitHub Actions에서 실행.

화면의 '휴지통 비우기'를 눌러 확인까지 진행하고, 전후 휴지통 메일 수만 출력합니다.
메일 제목 같은 내용은 출력하지 않습니다.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def trash_count(page):
    """폴더 정보 응답에서 휴지통(folderSN 4) 메일 수를 찾습니다."""
    found = {}

    def walk(o):
        if isinstance(o, dict):
            if str(o.get("folderSN")) == "4" and ("totalCount" in o or "mailCount" in o):
                found["n"] = o.get("totalCount", o.get("mailCount"))
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    for path in ("/json/folder/list", "/json/folder/getFolderList", "/json/folder"):
        try:
            r = page.evaluate("""async (u) => { const r = await fetch(u, {method:'POST', credentials:'include',
              headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}, body:''});
              const t = await r.text(); try { return JSON.parse(t); } catch(e) { return null; } }""",
                              "https://mail.naver.com" + path)
            walk(r)
            if "n" in found:
                return found["n"]
        except Exception:
            pass
    return None


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(25000)
        paths = []
        counts = {}

        def _resp(r):
            if "mail.naver.com/json" in r.url:
                path = r.url.split("mail.naver.com", 1)[1].split("?", 1)[0]
                paths.append(f"{r.request.method} {path} {r.status}")
                try:
                    j = r.json()
                except Exception:
                    return
                def walk(o):
                    if isinstance(o, dict):
                        if str(o.get("folderSN")) == "4":
                            for k in ("totalCount", "mailCount", "totalMailCount"):
                                if k in o:
                                    counts[path] = o[k]
                        for v in o.values():
                            walk(v)
                    elif isinstance(o, list):
                        for v in o:
                            walk(v)
                walk(j)
                if "/list" in path and isinstance(j, dict) and "totalCount" in j and "folderSN=4" in (r.request.post_data or r.url):
                    counts["list_total"] = j["totalCount"]
        page.on("response", _resp)
        page.on("dialog", lambda d: d.accept())

        page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        if "nid.naver.com" in page.url:
            sys.exit("로그인이 풀려 있습니다(NAVER_COOKIES 갱신 필요).")
        page.goto("https://mail.naver.com/v2/folders/4", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        before = counts.get("list_total") or trash_count(page)
        diag = {"menu": [], "after_select": [], "modal": [], "reqs": []}
        def _rq(rq):
            if "mail.naver.com/json" in rq.url and rq.method == "POST":
                path = rq.url.split("mail.naver.com", 1)[1].split("?", 1)[0]
                body = rq.post_data or ""
                keys = [kv.split("=", 1)[0] + ("=" + kv.split("=", 1)[1][:30] if kv.split("=", 1)[0] in ("folderSN", "folderSNList", "allSelect", "isAll", "selectAll", "currentFolderType", "deleteSpamDirect") else "") for kv in body.split("&") if kv]
                diag["reqs"].append(path + " " + " ".join(keys)[:300])
        page.on("request", _rq)
        print("휴지통 메일 수(비우기 전):", before, flush=True)
        vis = lambda sel: page.evaluate("""(sel) => [...document.querySelectorAll(sel)].filter(e => e.getClientRects().length).map(e => (e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,30)).filter(Boolean)""", sel)
        try:
            # 1) 선택 옵션 열고 '전체' 항목 누르기
            clicked = False
            try:
                page.locator("button.button_task_dropdown", has_text="메일 선택 옵션").first.click(timeout=5000)
            except Exception:
                page.get_by_role("button", name="메일 선택 옵션").first.click(timeout=5000)
            page.wait_for_timeout(1200)
            diag["menu"] = vis("[role=menu] *, [class*=dropdown] li, [class*=layer] li, [class*=option] li")[:40]
            # 사이드바 휴지통에 마우스를 올렸을 때 나타나는 버튼 이름 기록
            try:
                page.keyboard.press("Escape")
                page.locator("a:has-text('휴지통'), button:has-text('휴지통')").last.hover()
                page.wait_for_timeout(800)
                diag["sidebar_hover"] = page.evaluate("""() => [...document.querySelectorAll('nav button, aside button, [class*=lnb] button, [class*=folder] button')].filter(e=>e.getClientRects().length).map(e=>(e.innerText||e.getAttribute('aria-label')||e.title||'').trim()+' | '+(e.className||'').toString().slice(0,40)).slice(0,40)""")
                page.locator("button.button_task_dropdown", has_text="메일 선택 옵션").first.click(timeout=5000)
                page.wait_for_timeout(1000)
            except Exception as e:
                diag["sidebar_err"] = type(e).__name__
            for t in ["전체선택"]:
                loc = page.get_by_text(t, exact=True)
                if loc.count():
                    loc.first.click(timeout=5000)
                    print("선택 옵션:", t, flush=True)
                    clicked = True
                    break
            page.wait_for_timeout(1500)
            # 2) '메일함 전체 n통 선택' 같은 안내가 나오면 누르기
            diag["after_select"] = vis("[class*=notice] *, [class*=select] a, [class*=select] button, [class*=all] a, [class*=all] button")[:30]
            for t in ["모두 선택", "전체 선택", "모든 메일"]:
                loc = page.locator(f"a:visible:has-text('{t}'), button:visible:has-text('{t}')")
                if loc.count():
                    try:
                        loc.first.click(timeout=4000)
                        print("메일함 전체 선택:", t, flush=True)
                    except Exception:
                        pass
                    break
            page.wait_for_timeout(1500)
            # 3) 영구삭제
            if clicked:
                page.locator("button.svg_permanent_delete").first.click(timeout=8000)
                print("영구삭제를 눌렀습니다", flush=True)
                page.wait_for_timeout(2000)
                diag["modal"] = vis("[role=dialog] *, [class*=layer] button, [class*=popup] button, [class*=modal] button")[:30]
                for t in ["영구삭제", "삭제", "확인"]:
                    loc = page.locator(f"[role=dialog] button:has-text('{t}'), [class*=layer] button:has-text('{t}'), [class*=popup] button:has-text('{t}'), [class*=modal] button:has-text('{t}')")
                    if loc.count():
                        try:
                            loc.last.click(timeout=5000)
                            print("확인 창:", t, flush=True)
                            break
                        except Exception:
                            pass

        except Exception as e:
            print("중단:", type(e).__name__, str(e).split("\n")[0][:120], flush=True)
            import base64
            try:
                diag["shot"] = base64.b64encode(page.screenshot(type="jpeg", quality=60)).decode()
            except Exception:
                pass
            json.dump(diag, open("empty_trash_diag.json", "w"), ensure_ascii=False)
            raise
        page.wait_for_timeout(15000)
        counts.pop("list_total", None)
        page.goto("https://mail.naver.com/v2/folders/4", wait_until="domcontentloaded")
        page.wait_for_timeout(8000)
        after = counts.get("list_total") or trash_count(page)
        print("휴지통 메일 수(비우기 후):", after, flush=True)
        json.dump(diag, open("empty_trash_diag.json", "w"), ensure_ascii=False, indent=1)
        b.close()


if __name__ == "__main__":
    main()
