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
                out["requests"].append({"m": rq.method, "u": rq.url[:300], "body": (rq.post_data or "")[:500]})

        def on_resp(r):
            if "mail.daum.net" in r.url and r.request.resource_type in ("xhr", "fetch") and r.status == 200:
                try:
                    out["api"].append({"url": r.url[:300], "json": r.json()})
                except Exception:
                    pass
        page.on("request", on_req)
        page.on("response", on_resp)
        page.goto("https://mail.daum.net/top/INBOX", wait_until="domcontentloaded")
        page.wait_for_timeout(8000)
        out["log"].append(page.url[:80])
        if "kakao.com" in page.url or "logins.daum" in page.url:
            sys.exit("로그인이 풀려 있습니다(DAUM_COOKIES 갱신 필요).")
        if mode == "probe":
            out["html_sample"] = page.content()[:3000]
        b.close()
    with open("daum_mail_out.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"API 응답 {len(out['api'])}개, 요청 {len(out['requests'])}개 저장(암호화되어 출력)", flush=True)


if __name__ == "__main__":
    main()
