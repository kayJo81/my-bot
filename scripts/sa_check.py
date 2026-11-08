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
        status = {}
        try:
            r = page.goto("https://seekingalpha.com/account/subscriptions", wait_until="domcontentloaded")
            page.wait_for_timeout(6000)
            status["http"] = r.status if r else None
        except Exception as e:  # noqa: BLE001
            status["http"] = f"오류 {type(e).__name__}"
        body = ""
        try:
            body = page.inner_text("body")[:20000].lower()
        except Exception:
            pass
        url = page.url
        blocked = any(k in body for k in ["press & hold", "press and hold", "access to this page has been denied", "verify you are a human"])
        logged_out = ("/login" in url) or ("sign in" in body and "sign out" not in body and "log out" not in body)
        try:
            api = page.evaluate("""async () => { const r = await fetch('/api/v3/users/current', {credentials: 'include'}); return r.status; }""")
        except Exception:
            api = None
        page.screenshot(path="sa_check.png")  # 아티팩트로 올리지 않음(개인 정보가 보일 수 있음)
        b.close()
    print("열린 주소:", url.split("?")[0], flush=True)
    print("HTTP:", status.get("http"), "| 사용자 API:", api, flush=True)
    if blocked:
        print("결과: 봇 차단 화면(PerimeterX)이 떴습니다. 쿠키와 별개로 GitHub 서버 IP가 막혔을 수 있습니다.")
    elif logged_out or api in (401, 403):
        print("결과: 로그인 안 됨 → 쿠키를 다시 내보내 SEEKING_ALPHA_COOKIES를 갱신하세요.")
    elif api == 200:
        print("결과: 로그인 확인됨")
    else:
        print("결과: 판단 불가(화면은 열렸지만 로그인 여부를 확정하지 못함)")
    print("세션 쿠키 이름 확인:", "있음" if names & {"session_id", "_sapi_session_id", "user_id", "machine_cookie"} else "주요 쿠키 이름 없음")


if __name__ == "__main__":
    main()
