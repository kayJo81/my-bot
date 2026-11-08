#!/usr/bin/env python3
"""Daum 로그인 쿠키(DAUM_COOKIES)가 살아 있는지만 확인합니다.

공개 저장소라 메일 제목·계정 정보는 출력하지 않고, 로그인 여부만 찍습니다.
쿠키 형식: daum.net에 로그인한 상태에서 Cookie-Editor → Export → JSON
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def main():
    cookies = load_cookies("DAUM_COOKIES", ".daum.net")
    print(f"쿠키 {len(cookies)}개 읽음", flush=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(cookies)
        page = ctx.new_page()
        page.set_default_timeout(30000)
        res = {}
        for name, url in [("메일", "https://mail.daum.net/"), ("카페", "https://top.cafe.daum.net/")]:
            try:
                r = page.goto(url, wait_until="domcontentloaded")
                page.wait_for_timeout(5000)
                u = page.url
                login_page = any(k in u for k in ["logins.daum.net", "accounts.kakao.com", "/login"])
                body = page.inner_text("body")[:20000]
                res[name] = {"http": r.status if r else None, "도착": u.split("?")[0][:60],
                             "로그인화면": login_page, "로그아웃 버튼": ("로그아웃" in body)}
            except Exception as e:  # noqa: BLE001
                res[name] = {"오류": type(e).__name__}
        b.close()
    for k, v in res.items():
        print(k, v, flush=True)
    m = res.get("메일", {})
    if m.get("로그인화면"):
        print("결과: 로그인 안 됨 → daum.net에 로그인한 상태에서 쿠키를 다시 내보내 DAUM_COOKIES를 갱신하세요.")
    elif "http" in m:
        print("결과: 로그인 확인됨 (메일함이 열림)")
    else:
        print("결과: 판단 불가")


if __name__ == "__main__":
    main()
