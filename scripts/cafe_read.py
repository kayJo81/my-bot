#!/usr/bin/env python3
"""네이버 카페 글을 로그인 쿠키로 읽어 JSON으로 저장합니다(읽기 전용, 글쓰기·댓글 없음).

사용법:
  python scripts/cafe_read.py <cafeId> list [페이지수]        → 게시판 목록 + 최근 글 목록
  python scripts/cafe_read.py <cafeId> read <글번호,글번호...>  → 글 본문
  python scripts/cafe_read.py <cafeId> search <검색어,검색어...> → 카페 검색 결과
  python scripts/cafe_read.py <cafeId> get <API주소|API주소...>    → 카페 API 응답(JSON)
출력: cafe_out.json  (워크플로가 바로 암호화해서 로그에는 암호문만 남깁니다. 공개 저장소이므로 평문을 출력하지 않습니다)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")


def main():
    cafe, mode = sys.argv[1], sys.argv[2]
    arg = sys.argv[3] if len(sys.argv) > 3 else ""
    out = {"cafe": cafe, "mode": mode, "api": [], "pages": []}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", user_agent=UA,
                            viewport={"width": 430, "height": 900}, is_mobile=True)
        ctx.add_cookies(load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(30000)

        def on_resp(r):
            u = r.url
            if "apis.naver.com/cafe-web" in u and r.status == 200:
                try:
                    out["api"].append({"url": u.split("?")[0][-120:], "query": u.split("?")[1][:300] if "?" in u else "",
                                       "json": r.json()})
                except Exception:
                    pass
        page.on("response", on_resp)

        def visit(url, scroll=0):
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
            for _ in range(scroll):
                page.mouse.wheel(0, 4000)
                page.wait_for_timeout(1500)
            try:
                txt = page.inner_text("body")[:20000]
            except Exception:
                txt = ""
            out["pages"].append({"url": url, "final": page.url, "text": txt})

        if mode == "list":
            visit(f"https://m.cafe.naver.com/ca-fe/web/cafes/{cafe}")
            visit(f"https://m.cafe.naver.com/ca-fe/web/cafes/{cafe}/menus/0", scroll=int(arg or 3))
        elif mode == "search":
            for kw in [k.strip() for k in arg.split(",") if k.strip()]:
                page.goto(f"https://m.cafe.naver.com/ca-fe/web/cafes/{cafe}", wait_until="domcontentloaded")
                page.wait_for_timeout(3500)
                clicked = False
                for sel in ["a:has-text('검색')", "button:has-text('검색')", "[aria-label*='검색']", "a[href*='search']"]:
                    try:
                        page.locator(sel).first.click(timeout=3000)
                        clicked = True
                        break
                    except Exception:
                        pass
                page.wait_for_timeout(2000)
                try:
                    inp = page.locator("input[type='search'], input[type='text']").first
                    inp.fill(kw, timeout=5000)
                    inp.press("Enter")
                except Exception as e:  # noqa: BLE001
                    out["pages"].append({"url": kw, "final": page.url, "text": f"입력 실패 {e}"[:300]})
                    continue
                page.wait_for_timeout(4000)
                for _ in range(6):
                    page.mouse.wheel(0, 4000)
                    page.wait_for_timeout(1500)
                try:
                    txt = page.inner_text("body")[:30000]
                except Exception:
                    txt = ""
                out["pages"].append({"url": kw, "final": page.url, "clicked": clicked, "text": txt})
        elif mode == "get":  # 카페 API 주소를 로그인 쿠키로 직접 요청 (주소는 '|'로 구분)
            for u in [x.strip() for x in arg.split("|") if x.strip()]:
                try:
                    r = ctx.request.get(u, headers={"Referer": f"https://m.cafe.naver.com/ca-fe/web/cafes/{cafe}"})
                    try:
                        js = r.json()
                    except Exception:
                        js = {"text": r.text()[:3000]}
                    out["api"].append({"url": u.split("?")[0][-120:], "query": u.split("?")[1][:300] if "?" in u else "",
                                       "status": r.status, "json": js})
                except Exception as e:  # noqa: BLE001
                    out["api"].append({"url": u[:120], "error": str(e)[:300]})
        else:
            for aid in [a for a in arg.split(",") if a.strip()]:
                visit(f"https://m.cafe.naver.com/ca-fe/web/cafes/{cafe}/articles/{aid.strip()}")
        b.close()
    with open("cafe_out.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"API 응답 {len(out['api'])}개, 페이지 {len(out['pages'])}개 저장 (내용은 암호화되어 출력됨)")
    for pg in out["pages"]:
        print("최종 주소:", pg["final"].split("?")[0], "| 본문 길이:", len(pg["text"]))


if __name__ == "__main__":
    main()
