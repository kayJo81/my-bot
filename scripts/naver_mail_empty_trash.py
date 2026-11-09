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
        print("주소:", page.url.split("?")[0], flush=True)
        btns = page.evaluate("""() => [...document.querySelectorAll('button, a[role=button], [role=button]')]
            .filter(e => e.offsetParent !== null || e.getClientRects().length)
            .map(e => ((e.innerText || e.getAttribute('aria-label') || e.title || '').trim().replace(/\\s+/g,' ')) + ' | ' + (e.className||'').toString().slice(0,40))
            .filter(t => t.split(' | ')[0].length > 0 && t.split(' | ')[0].length <= 12)""")
        print("화면 버튼:", flush=True)
        for t in btns[:80]:
            print("   ", t, flush=True)
        empties = page.evaluate("""() => [...document.querySelectorAll('*')].filter(e => /비우기/.test(e.innerText||'') && e.children.length===0).map(e => e.tagName + ' ' + (e.className||'').toString().slice(0,40) + ' vis=' + (e.getClientRects().length>0))""")
        print("비우기 글자 요소:", empties[:10], flush=True)
        print("휴지통 메일 수(비우기 전):", before, flush=True)

        clicked = False
        for sel in ["button:has-text('휴지통 비우기')", "a:has-text('휴지통 비우기')",
                    "button:has-text('비우기')", "a:has-text('비우기')"]:
            loc = page.locator(sel)
            n = loc.count()
            for i in range(n):
                el = loc.nth(i)
                try:
                    if not el.is_visible():
                        el.hover(force=True)
                    el.click(timeout=5000, force=True)
                    clicked = True
                    print("누른 버튼:", sel, flush=True)
                    break
                except Exception:
                    continue
            if clicked:
                break
        if not clicked:
            # 사이드바의 휴지통 항목 위에 올리면 비우기 버튼이 나타나는 경우
            try:
                page.get_by_text("휴지통", exact=True).first.hover()
                page.wait_for_timeout(800)
                page.locator("text=비우기").first.click(timeout=5000, force=True)
                clicked = True
                print("누른 버튼: 사이드바 비우기", flush=True)
            except Exception as e:
                print("비우기 버튼을 찾지 못했습니다:", type(e).__name__, flush=True)
        page.wait_for_timeout(2500)
        # 화면 안의 확인 창
        for txt in ["확인", "비우기", "삭제"]:
            loc = page.locator(f"[role='dialog'] button:has-text('{txt}'), .layer_popup button:has-text('{txt}'), .popup button:has-text('{txt}'), [class*='layer'] button:has-text('{txt}')")
            if loc.count():
                try:
                    loc.last.click(timeout=5000)
                    print("확인 창:", txt, flush=True)
                    break
                except Exception:
                    pass
        page.wait_for_timeout(15000)
        counts.pop("list_total", None)
        page.goto("https://mail.naver.com/v2/folders/4", wait_until="domcontentloaded")
        page.wait_for_timeout(8000)
        after = counts.get("list_total") or trash_count(page)
        print("휴지통 메일 수(비우기 후):", after, flush=True)
        print("요청 경로:", flush=True)
        for x in paths:
            if re.search(r"empty|delete|remove|folder", x, re.I):
                print("  ", x, flush=True)
        b.close()


if __name__ == "__main__":
    main()
