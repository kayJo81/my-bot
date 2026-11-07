#!/usr/bin/env python3
"""이미 올린 네이버 글을 새로 쓰지 않고 '수정'으로 열어 본문 문단 정렬만 바꾼 뒤 그대로 다시 발행합니다.

사용법: NAVER_ALIGN=left python scripts/naver_realign.py 224468157174 224468158781
필요: NAVER_COOKIES, NAVER_BLOG_ID (post_naver_blog.py와 같음)
"""
import os
import re
import sys

os.environ.setdefault("NAVER_ALIGN", "left")
sys.path.insert(0, os.path.dirname(__file__))
import post_naver_blog as nb  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

PARAS = ".se-component.se-text .se-text-paragraph"
_BAD_JS = """(want) => [...document.querySelectorAll('%s')]
    .map((p, i) => [i, p.className]).filter(([i, c]) => !c.includes(want)).map(([i]) => i)""" % PARAS


def realign(page, blog_id: str, log_no: str) -> None:
    page.goto(f"https://blog.naver.com/PostUpdateForm.naver?blogId={blog_id}&logNo={log_no}",
              wait_until="domcontentloaded")
    page.wait_for_timeout(6000)
    if "nid.naver.com" in page.url:
        sys.exit("로그인이 풀려 있습니다: NAVER_COOKIES를 갱신하세요.")
    fr = nb.editor_frame(page)
    if fr is None:
        nb.shot(page, f"{log_no}_no_editor")
        sys.exit(f"{log_no}: 수정 화면을 찾지 못했습니다.")
    nb.click_if(fr, ".se-popup-button-cancel", 3000)
    nb.click_if(fr, ".se-help-panel-close-button", 2000)
    want = f"align-{nb.ALIGN}"
    total = fr.locator(PARAS).count()
    bad = fr.evaluate(_BAD_JS, want)
    print(f"{log_no}: 문단 {total}개 중 {len(bad)}개 정렬 변경")
    for _ in range(3):  # 놓친 문단이 있으면 다시 훑습니다
        for i in bad:
            el = fr.locator(PARAS).nth(i)
            try:
                el.click(timeout=4000)
            except Exception:
                el.click(force=True)
            page.keyboard.press("End")
            nb.ensure_align(page, fr)
        bad = fr.evaluate(_BAD_JS, want)
        if not bad:
            break
    nb.shot(page, f"{log_no}_aligned")
    if bad:
        sys.exit(f"{log_no}: {len(bad)}개 문단 정렬을 바꾸지 못해 저장하지 않았습니다.")
    fr.get_by_role("button", name=re.compile("^발행")).first.click()
    page.wait_for_timeout(1500)
    nb.shot(page, f"{log_no}_publish_layer")
    fr.locator("button:has-text('발행')").last.click()
    page.wait_for_timeout(5000)
    nb.shot(page, f"{log_no}_done")
    print(f"{log_no}: 수정 발행 완료 →", page.url)


def main() -> None:
    blog_id = os.environ.get("NAVER_BLOG_ID", "").strip()
    log_nos = [x for a in sys.argv[1:] for x in re.split(r"[,\s]+", a) if x]
    if not blog_id or not log_nos:
        sys.exit("NAVER_BLOG_ID와 글 번호가 필요합니다.")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(nb.load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(20000)
        for n in log_nos:
            realign(page, blog_id, n)
        browser.close()


if __name__ == "__main__":
    main()
