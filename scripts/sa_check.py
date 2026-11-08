#!/usr/bin/env python3
"""시킹알파 로그인 쿠키(SEEKING_ALPHA_COOKIES)가 살아 있는지만 확인합니다.

공개 저장소라 계정 정보·기사 본문은 출력하지 않고, 로그인 여부와 차단 여부만 찍습니다.
쿠키 형식: Cookie-Editor 확장 → Export → JSON (네이버 쿠키와 같은 형식)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402


def main():
    cookies = load_cookies("SEEKING_ALPHA_COOKIES", ".seekingalpha.com")
    names = {c["name"] for c in cookies}
    print(f"쿠키 {len(cookies)}개 읽음", flush=True)
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="en-US", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(cookies)
        page = ctx.new_page()
        page.set_default_timeout(30000)
        res = {}
        for name, url in [("home", "https://seekingalpha.com/"), ("kr_home", "https://kr.seekingalpha.com/")]:
            try:
                r = page.goto(url, wait_until="domcontentloaded")
                page.wait_for_timeout(5000)
                body = page.inner_text("body")[:30000].lower()
                html = page.content().lower()
                res[name] = {
                    "http": r.status if r else None,
                    "final": page.url.split("?")[0],
                    "px_block": any(k in body for k in ["press & hold", "press and hold", "access to this page has been denied", "verify you are a human"]) or "px-captcha" in html,
                    "sign_in_btn": ("sign in" in body) or ("로그인" in body),
                    "logout_word": any(k in body for k in ["sign out", "log out", "로그아웃"]),
                    "premium_word": ("premium" in body),
                }
            except Exception as e:  # noqa: BLE001
                res[name] = {"err": type(e).__name__}
        api = {}
        for ep in ["/api/v3/users/current", "/api/v3/user_subscriptions", "/api/v3/articles?filter[category]=latest-articles&page[size]=1"]:
            try:
                api[ep.split("?")[0]] = page.evaluate("""async (u) => { const r = await fetch(u, {credentials: 'include'}); const t = await r.text();
                    return {status: r.status, px: /px-captcha|perimeterx|_pxappid|blocked/i.test(t), len: t.length}; }""", ep)
            except Exception as e:  # noqa: BLE001
                api[ep] = {"err": type(e).__name__}
        b.close()
    for k, v in res.items():
        print(k, v, flush=True)
    for k, v in api.items():
        print("API", k, v, flush=True)
    a = api.get("/api/v3/users/current", {})
    if any(v.get("px_block") for v in res.values()) or a.get("px"):
        print("결과: 봇 차단(PerimeterX) 흔적이 있습니다.")
    elif a.get("status") == 200:
        print("결과: 로그인 확인됨")
    elif any(v.get("logout_word") for v in res.values()):
        print("결과: 화면상 로그인된 것으로 보임(API는 막힘)")
    else:
        print("결과: 로그인 안 된 것으로 보임")
    print("세션 쿠키 이름 확인:", "있음" if names & {"session_id", "_sapi_session_id", "user_id", "machine_cookie"} else "주요 쿠키 이름 없음")


if __name__ == "__main__":
    main()
