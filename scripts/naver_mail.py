#!/usr/bin/env python3
"""네이버 메일을 로그인 쿠키(NAVER_COOKIES)로 열어 검색하고, 필요하면 검색 결과를 휴지통으로 옮깁니다.

사용법:
  python scripts/naver_mail.py search "검색어|검색어"   → 검색 결과(제목·보낸사람·날짜)를 naver_mail_out.json에 저장
  python scripts/naver_mail.py trash  "검색어|검색어"   → 검색 결과를 모두 선택해 '삭제'(휴지통 이동)
공개 저장소라 워크플로가 결과를 암호화해서만 출력합니다. 영구 삭제나 휴지통 비우기는 하지 않습니다.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def main():
    mode, kws = sys.argv[1], [k.strip() for k in sys.argv[2].split("|") if k.strip()]
    out = {"mode": mode, "results": [], "api": [], "log": []}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(20000)

        def on_resp(r):
            if "mail.naver.com" in r.url and "/json/" in r.url and r.status == 200 and (mode != "list" or "/json/search/?" in r.url):
                try:
                    out["api"].append({"url": r.url[:200], "json": r.json()})
                except Exception:
                    pass
        page.on("response", on_resp)

        page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        out["log"].append(f"열린 주소: {page.url[:80]}")
        print("열린 주소:", page.url.split("?")[0], flush=True)
        if "nid.naver.com" in page.url:
            sys.exit("로그인이 풀려 있습니다(NAVER_COOKIES 갱신 필요).")

        for kw in kws:
            box = page.locator("input[type='search'], input[placeholder*='검색'], input#searchKeyword, input[name='keyword']").first
            try:
                box.click(timeout=8000)
                box.fill(kw)
                box.press("Enter")
            except Exception as e:  # noqa: BLE001
                out["log"].append(f"검색창 실패 {kw}: {e}"[:200])
                print("검색창을 찾지 못함", flush=True)
                page.screenshot(path="naver_mail_fail.png")
                continue
            page.wait_for_timeout(5000)
            if mode == "list":
                # 첫 페이지 검색 API 주소를 찾아 나머지 페이지도 같은 방식으로 받아 옵니다(GET, 로그인 쿠키 포함)
                urls = [a["url"] for a in out["api"] if "/json/search/?" in a["url"]]
                full = None
                for r in reversed(urls):
                    full = r
                    break
                src = [a for a in out["api"] if a["url"] == full]
                rows = []
                if src:
                    j = src[-1]["json"]
                    last = int(j.get("lastPage") or 1)
                    rows += j.get("mailData", [])
                    real = page.evaluate("() => performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes('/json/search/?')).pop()")
                    for pg in range(2, min(last, 20) + 1):
                        u = real.replace("page=1&", f"page={pg}&", 1)
                        try:
                            jj = page.evaluate("""async (u) => {
                                const [base, qs] = u.split('?');
                                let r = await fetch(base, {method: 'POST', credentials: 'include',
                                    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body: qs});
                                let t = await r.text();
                                if (!t) { r = await fetch(u, {method: 'POST', credentials: 'include'}); t = await r.text(); }
                                return JSON.parse(t); }""", u)
                            rows += jj.get("mailData", [])
                        except Exception as e:  # noqa: BLE001
                            out["log"].append(f"{kw} p{pg} 실패 {e}"[:200])
                keep = ["mailSN", "folderSN", "folderName", "from", "subject", "receivedTime", "attachCount"]
                out["results"].append({"keyword": kw, "count": len(rows),
                                       "rows": [{k: r.get(k) for k in keep} for r in rows]})
                print(f"[{kw}] {len(rows)}건 수집", flush=True)
                out["api"] = []
                page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
                page.wait_for_timeout(4000)
                continue
            text = page.inner_text("body")[:30000]
            out["results"].append({"keyword": kw, "url": page.url[:200], "text": text})
            print(f"[{kw}] 검색 완료", flush=True)
            if mode == "trash":
                # 전체 선택 → 삭제(휴지통)
                done = False
                for sel in ["input[type='checkbox'][title*='전체']", "button[aria-label*='전체 선택']", ".button_checkbox_all", "label:has-text('전체 선택')"]:
                    try:
                        page.locator(sel).first.click(timeout=3000)
                        done = True
                        break
                    except Exception:
                        pass
                page.wait_for_timeout(800)
                if done:
                    try:
                        page.locator("button:has-text('삭제')").first.click(timeout=5000)
                        page.wait_for_timeout(3000)
                        print(f"[{kw}] 삭제(휴지통) 실행", flush=True)
                        out["log"].append(f"{kw}: 삭제 클릭")
                    except Exception as e:  # noqa: BLE001
                        out["log"].append(f"{kw}: 삭제 버튼 실패 {e}"[:200])
                else:
                    out["log"].append(f"{kw}: 전체 선택 실패")
            page.goto("https://mail.naver.com/", wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
        b.close()
    with open("naver_mail_out.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"API 응답 {len(out['api'])}개 저장(암호화되어 출력)", flush=True)


if __name__ == "__main__":
    main()
