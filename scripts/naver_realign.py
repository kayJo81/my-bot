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
    .map((p, i) => [i, p.className, p.textContent.trim()])
    .filter(([i, c, t]) => t && !c.includes(want)).map(([i]) => i)""" % PARAS
_OPTS_JS = """() => [...document.querySelectorAll('button')]
    .filter(b => /align/i.test(b.className) && b.offsetParent !== null).map(b => b.className)"""


def apply_align(page, fr, want: str) -> bool:
    """툴바 정렬 드롭다운을 열고 원하는 정렬 옵션을 누릅니다. 성공하면 True."""
    opener = fr.locator("button[class*='se-align-'][class*='toolbar-button']").first
    try:
        opener.click(timeout=3000)
    except Exception:
        return False
    page.wait_for_timeout(250)
    opts = fr.evaluate(_OPTS_JS)
    for c in opts:
        if want in c and "drop-down-button" not in c:
            sel = "button." + ".".join(x for x in c.split() if x)
            try:
                fr.locator(sel).first.click(timeout=2000)
                page.wait_for_timeout(200)
                return True
            except Exception:
                pass
    print("  정렬 옵션 후보:", opts, flush=True)
    page.keyboard.press("Escape")
    return False


def find_editor(page):
    """제목 칸과 정렬 버튼이 있는 프레임만 에디터로 인정합니다(글 보기 화면과 구분)."""
    for _ in range(12):
        for f in page.frames:
            try:
                if f.locator(".se-documentTitle").count() and f.locator("button[class*='se-align-']").count():
                    return f
            except Exception:
                pass
        page.wait_for_timeout(1000)
    return None


def realign(page, blog_id: str, log_no: str) -> None:
    fr = None
    for url in (f"https://blog.naver.com/{blog_id}?Redirect=Update&logNo={log_no}",
                f"https://blog.naver.com/{blog_id}/postupdate?logNo={log_no}"):
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_timeout(6000)
        if "nid.naver.com" in page.url:
            sys.exit("로그인이 풀려 있습니다: NAVER_COOKIES를 갱신하세요.")
        fr = find_editor(page)
        print(f"  {url.split('.com/')[1]} → 프레임 {[f.url.split('.com/')[-1][:60] for f in page.frames][:4]} / 에디터 {'있음' if fr else '없음'}", flush=True)
        if fr:
            break
    if fr is None:
        # 글 보기 화면에서 '수정' 링크 찾기
        page.goto(f"https://blog.naver.com/PostView.naver?blogId={blog_id}&logNo={log_no}", wait_until="domcontentloaded")
        page.wait_for_timeout(5000)
        cands = page.evaluate("""() => [...document.querySelectorAll('a,button')]
            .filter(e => /수정|edit|update/i.test((e.textContent||'') + ' ' + e.className + ' ' + (e.getAttribute('href')||'')))
            .slice(0, 12).map(e => e.outerHTML.slice(0, 220))""")
        print("  수정 후보:", cands, flush=True)
        btn = page.locator(f"a._modifyPost[class*='_param({log_no}|']").first
        if not btn.count():
            print(f"  {log_no}: 이 번호의 글이 없습니다(삭제됐거나 비공개). 건너뜁니다.", flush=True)
            return
        if btn.count():
            try:
                with page.context.expect_page(timeout=8000) as newp:
                    btn.click(timeout=5000)
                page = newp.value
                page.wait_for_load_state("domcontentloaded")
                print("  새 창:", page.url[:120], flush=True)
            except Exception:
                page.wait_for_timeout(3000)
                print("  같은 창:", page.url[:120], flush=True)
        fr = find_editor(page)
        print(f"  글 보기 → 수정 버튼 → 에디터 {'있음' if fr else '없음'}", flush=True)
    if fr is None:
        nb.shot(page, f"{log_no}_no_editor")
        sys.exit(f"{log_no}: 수정 화면을 찾지 못했습니다.")
    nb.click_if(fr, ".se-popup-button-cancel", 3000)
    nb.click_if(fr, ".se-help-panel-close-button", 2000)
    want = f"align-{nb.ALIGN}"
    total = fr.locator(PARAS).count()
    if total > 200:
        sys.exit(f"{log_no}: 문단이 {total}개로 비정상입니다(에디터가 아닐 수 있음). 저장하지 않고 멈춥니다.")
    bad = fr.evaluate(_BAD_JS, want)
    print(f"{log_no}: 문단 {total}개 중 {len(bad)}개 정렬 변경", flush=True)
    def cur():
        return fr.evaluate(nb._ALIGN_JS) or ""

    n_changed = len(bad)
    for n, i in enumerate(bad):
        el = fr.locator(PARAS).nth(i)
        try:
            el.click(timeout=4000)
        except Exception:
            el.click(force=True)
        page.keyboard.press("End")
        if want not in cur():
            apply_align(page, fr, want)
        if n == 0:
            print("  첫 문단 결과:", cur(), flush=True)
            if want not in cur():
                nb.shot(page, f"{log_no}_align_fail")
                sys.exit(f"{log_no}: 정렬 메뉴를 다루지 못해 저장하지 않고 멈춥니다.")
    bad = fr.evaluate(_BAD_JS, want)
    nb.shot(page, f"{log_no}_aligned")
    if bad:
        sys.exit(f"{log_no}: {len(bad)}개 문단 정렬을 바꾸지 못해 저장하지 않았습니다.")
    if "postupdate" in page.url and f"logNo={log_no}" not in page.url:
        sys.exit(f"{log_no}: 다른 글({page.url})이 열려 저장하지 않고 멈춥니다.")
    if not fr.evaluate(_BAD_JS, "__never__") or len(bad) == 0 and n_changed == 0:
        print(f"{log_no}: 바꿀 문단이 없어 저장하지 않습니다.", flush=True)
        return
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
