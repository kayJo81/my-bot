#!/usr/bin/env python3
"""out/<폴더>/body.txt + 그림을 네이버 블로그 스마트에디터에 올립니다. (GitHub Actions에서 실행)

사용법: python3 scripts/post_naver_blog.py out/2026-11-06
환경 변수
  NAVER_COOKIES   네이버 로그인 쿠키(JSON 배열, Cookie-Editor 확장으로 내보낸 형식)  [필수, Secret]
  NAVER_BLOG_ID   블로그 아이디 (blog.naver.com/<아이디>)                         [필수]
  NAVER_PUBLISH   "1"이면 발행, 그 외에는 임시저장만 합니다
  NAVER_CATEGORY  발행할 카테고리 이름(일부만 써도 됨). 못 찾으면 발행하지 않고 임시저장
  SHOT_DIR        단계별 스크린샷 저장 폴더 (기본: naver_shots)

본문 규칙 (body.txt)
  - 첫 줄 = 글 제목
  - 빈 줄로 나뉜 단락을 차례로 입력합니다.
  - "[그림N]" 단락 자리에는 N번째 그림(figures.json 순서, 없으면 jpg 파일 이름순)을 넣습니다.
  - "그림 대응" 줄은 메일용이므로 블로그에는 넣지 않습니다.

네이버는 공식 글쓰기 API가 없어(2020년 종료) 브라우저를 조작하는 방식입니다.
에디터 화면이 바뀌면 동작하지 않을 수 있으며, 실패하면 스크린샷을 보고 고칩니다.
"""
import json
import os
import re
import sys
from pathlib import Path

from playwright.sync_api import TimeoutError as PWTimeout
from playwright.sync_api import sync_playwright

SHOT_DIR = Path(os.environ.get("SHOT_DIR", "naver_shots"))
_shot_no = 0


def shot(page, name: str) -> None:
    global _shot_no
    _shot_no += 1
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    try:
        page.screenshot(path=str(SHOT_DIR / f"{_shot_no:02d}_{name}.png"), full_page=False)
    except Exception as e:  # 스크린샷 실패는 무시
        print(f"(스크린샷 실패 {name}: {e})")


def load_post(d: Path):
    lines = (d / "body.txt").read_text(encoding="utf-8").strip().split("\n")
    title = lines[0].strip()
    rest = "\n".join(lines[1:]).strip()
    paras = [p.strip() for p in re.split(r"\n\s*\n", rest) if p.strip()]
    paras = [p for p in paras if not p.startswith("그림 대응")]

    figs = []
    fj = d / "figures.json"
    if fj.exists():
        figs = [d / f["file"] for f in json.loads(fj.read_text(encoding="utf-8"))]
    if not figs:
        def key(p: Path):
            m = re.search(r"(\d+)\.jpe?g$", p.name)
            return int(m.group(1)) if m else 0
        figs = sorted(d.glob("*.jpg"), key=key)
    if not figs:
        # 그림이 PDF로만 있는 폴더: 쪽마다 이미지로 바꿔 씁니다 (poppler-utils의 pdftoppm 필요)
        pdfs = sorted(d.glob("*.pdf"))
        if pdfs:
            import subprocess
            import tempfile
            tmp = Path(tempfile.mkdtemp(prefix="naver_pdf_"))
            subprocess.run(["pdftoppm", "-jpeg", "-r", "150", str(pdfs[0]), str(tmp / "page")], check=True)
            figs = sorted(tmp.glob("page-*.jpg"), key=lambda p: int(re.search(r"-(\d+)\.jpg$", p.name).group(1)))

    blocks = []
    for p in paras:
        m = re.fullmatch(r"\[그림(\d+)\]", p)
        if m:
            n = int(m.group(1))
            if n > len(figs):
                sys.exit(f"[그림{n}]에 맞는 이미지가 없습니다 (이미지 {len(figs)}장)")
            blocks.append(("image", figs[n - 1]))
        else:
            blocks.append(("text", p))
    return title, blocks


def load_cookies(env="NAVER_COOKIES", domain=".naver.com"):
    raw = os.environ.get(env, "").strip()
    if not raw:
        sys.exit(f"{env}가 없습니다.")
    data = json.loads(raw)
    out = []
    for c in data:
        ck = {
            "name": c["name"],
            "value": c["value"],
            "domain": c.get("domain", domain),
            "path": c.get("path", "/"),
            "secure": bool(c.get("secure", True)),
            "httpOnly": bool(c.get("httpOnly", False)),
        }
        exp = c.get("expirationDate") or c.get("expires")
        if exp and float(exp) > 0:
            ck["expires"] = float(exp)
        ss = (c.get("sameSite") or "").lower()
        ck["sameSite"] = {"strict": "Strict", "lax": "Lax", "none": "None", "no_restriction": "None"}.get(ss, "Lax")
        out.append(ck)
    return out


def editor_frame(page):
    """스마트에디터는 mainFrame iframe 안에 있을 때가 많습니다."""
    for _ in range(30):
        for fr in page.frames:
            if fr.name == "mainFrame" or "PostWriteForm" in fr.url or "postwrite" in fr.url.lower():
                try:
                    if fr.locator(".se-content, .se-documentTitle").count():
                        return fr
                except Exception:
                    pass
        if page.locator(".se-content, .se-documentTitle").count():
            return page.main_frame
        page.wait_for_timeout(1000)
    return None


def click_if(fr, selector: str, timeout=1500) -> bool:
    try:
        loc = fr.locator(selector).first
        loc.wait_for(state="visible", timeout=timeout)
        loc.click()
        return True
    except PWTimeout:
        return False
    except Exception:
        return False


def select_category(page, fr, want: str) -> bool:
    """발행 레이어에서 이름에 want가 들어간 카테고리를 고릅니다. 목록은 로그에 남깁니다."""
    opened = False
    for sel in ["button[class*='selectbox_button']", "[class*='option_category'] button",
                "button[aria-haspopup='listbox']", "button:has-text('카테고리')"]:
        if click_if(fr, sel, 2500):
            opened = True
            break
    page.wait_for_timeout(1000)
    shot(page, "category_open")
    for sel in ["[class*='option_list'] li", "[role='option']", "[class*='selectbox_list'] li",
                "ul[class*='list'] li label", "label[for*='category']"]:
        opts = fr.locator(sel)
        try:
            n = opts.count()
        except Exception:
            n = 0
        if not n:
            continue
        texts = [t.strip().replace("\n", " ") for t in opts.all_inner_texts()]
        print(f"카테고리 목록({sel}, 열림={opened}):", texts)
        for i, t in enumerate(texts):
            if want in t:
                opts.nth(i).click()
                page.wait_for_timeout(800)
                shot(page, "category_selected")
                print("카테고리 선택:", t)
                return True
    return False


ALIGN = os.environ.get("NAVER_ALIGN", "left").strip().lower()
_ALIGN_JS = """() => { const s = window.getSelection(); if (!s || !s.anchorNode) return '';
  const n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
  const el = n && n.closest('.se-text-paragraph'); return el ? el.className : ''; }"""
_align_logged = False


def ensure_align(page, fr) -> None:
    """현재 문단 정렬이 NAVER_ALIGN(left/center/right)과 다르면 툴바의 정렬 메뉴에서 맞춥니다."""
    global _align_logged
    if ALIGN not in ("left", "center", "right"):
        return
    want = f"align-{ALIGN}"

    def cur():
        try:
            return fr.evaluate(_ALIGN_JS) or ""
        except Exception:
            return ""

    if want in cur():
        return
    tried = []
    # 1) 툴바의 정렬 드롭다운 열기 → 가운데 정렬 옵션
    for opener in ["button[class*='se-align'][class*='toolbar-button']", "button[class*='align'][class*='drop-down']",
                   "button[data-name='align']", "button[class*='se-align']"]:
        if click_if(fr, opener, 1200):
            page.wait_for_timeout(300)
            for opt in [f"button[class*='{want}']", f"[class*='option'][class*='{ALIGN}'] button",
                        f"button[data-value='{ALIGN}']", f"button[data-name='{want}']"]:
                if click_if(fr, opt, 1200):
                    tried.append(f"{opener} -> {opt}")
                    break
            break
    page.wait_for_timeout(200)
    if want not in cur():
        page.keyboard.press({"left": "Control+l", "center": "Control+e", "right": "Control+r"}[ALIGN])  # 단축키도 시도
        page.wait_for_timeout(200)
        tried.append("Ctrl+E")
    if not _align_logged:
        _align_logged = True
        try:
            names = fr.evaluate("""() => [...document.querySelectorAll('button')].map(b => b.className)
                .filter(c => /align/i.test(c)).slice(0, 12)""")
        except Exception:
            names = []
        print("정렬 시도:", tried, "| 결과:", cur(), "| 정렬 버튼 후보:", names)
        shot(page, "align")


def type_paragraph(page, text: str, fr=None) -> None:
    """가운데 정렬이면 문장 줄바꿈을 살리고(Shift+Enter), 왼쪽 정렬이면 한 줄로 이어 씁니다.
    문단 사이에는 빈 줄을 하나 둡니다."""
    if fr is not None:
        ensure_align(page, fr)
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if ALIGN == "center":
        for i, ln in enumerate(lines):
            page.keyboard.insert_text(ln)
            if i < len(lines) - 1:
                page.keyboard.press("Shift+Enter")
    else:
        page.keyboard.insert_text(" ".join(lines))
    page.keyboard.press("Enter")
    page.wait_for_timeout(60)
    page.keyboard.press("Enter")
    page.wait_for_timeout(60)
    if fr is not None:
        # 가끔 두 번째 Enter가 먹히지 않아 빈 줄이 빠집니다. 커서 앞 문단이 비어 있지 않으면 한 번 더 누릅니다.
        try:
            prev_has_text = fr.evaluate("""() => {
                const sel = getSelection(); if (!sel.rangeCount) return false;
                let n = sel.anchorNode; while (n && !(n.classList && n.classList.contains('se-text-paragraph'))) n = n.parentNode;
                if (!n) return false;
                const prev = n.previousElementSibling;
                return !!prev && prev.textContent.replace(/\u200b/g, '').trim().length > 0; }""")
            if prev_has_text:
                page.keyboard.press("Enter")
        except Exception:
            pass


def main() -> None:
    d = Path(sys.argv[1])
    blog_id = os.environ.get("NAVER_BLOG_ID", "").strip()
    if not blog_id:
        sys.exit("NAVER_BLOG_ID가 없습니다.")
    publish = os.environ.get("NAVER_PUBLISH", "") == "1"
    title, blocks = load_post(d)
    print(f"제목: {title} / 블록 {len(blocks)}개 / {'발행' if publish else '임시저장'}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            locale="ko-KR",
            timezone_id="Asia/Seoul",
            viewport={"width": 1400, "height": 1000},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        cookies = load_cookies()
        names = sorted({c["name"] for c in cookies})
        print(f"쿠키 {len(cookies)}개, 로그인 쿠키 NID_AUT={'NID_AUT' in names} NID_SES={'NID_SES' in names}")
        print("쿠키 이름:", ", ".join(names))
        ctx.add_cookies(cookies)
        page = ctx.new_page()
        page.set_default_timeout(20000)

        edit_no = os.environ.get("EDIT_LOGNO", "").strip()
        if edit_no:
            # 기존 글 수정: 글 보기 화면의 '수정하기' 링크로 에디터를 엽니다(새 글을 만들지 않음)
            page.goto(f"https://blog.naver.com/PostView.naver?blogId={blog_id}&logNo={edit_no}", wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
            link = page.locator(f"a._modifyPost[class*='_param({edit_no}|']").first
            if not link.count():
                sys.exit(f"{edit_no}번 글의 수정 링크를 찾지 못했습니다(삭제됐거나 권한 없음).")
            link.evaluate("e => e.click()")  # 메뉴 안에 숨은 링크라 스크립트로 클릭
            page.wait_for_timeout(6000)
        else:
            page.goto(f"https://blog.naver.com/{blog_id}?Redirect=Write", wait_until="domcontentloaded")
            page.wait_for_timeout(5000)
        shot(page, "open")
        print("이동한 주소:", page.url.split("?")[0])
        if "nid.naver.com" in page.url:
            shot(page, "login_required")
            sys.exit("로그인이 풀려 있습니다: 쿠키를 다시 내보내 NAVER_COOKIES를 갱신하세요.")

        fr = editor_frame(page)
        if fr is None:
            shot(page, "no_editor")
            sys.exit("에디터를 찾지 못했습니다. 스크린샷을 확인하세요.")

        # 이어쓰기 팝업("작성 중인 글이 있습니다") → 취소, 도움말 패널 닫기
        click_if(fr, ".se-popup-button-cancel", 3000)
        click_if(fr, ".se-help-panel-close-button", 2000)
        shot(page, "editor_ready")

        # 제목
        fr.locator(".se-documentTitle .se-text-paragraph, .se-title-text").first.click()
        if edit_no:
            page.keyboard.press("Control+a")
            page.keyboard.press("Backspace")
        page.keyboard.insert_text(title)
        shot(page, "title")

        # 본문 첫 칸으로 이동
        body = fr.locator(".se-component.se-text .se-text-paragraph").first
        body.click()
        if edit_no:
            # 기존 본문을 모두 지운 뒤 확인: 이미지·문단이 남아 있으면 저장하지 않고 멈춤
            for _ in range(3):
                fr.locator(".se-component.se-text .se-text-paragraph").first.click()
                page.keyboard.press("Control+a")
                page.keyboard.press("Control+a")
                page.keyboard.press("Backspace")
                page.wait_for_timeout(800)
                imgs = fr.locator(".se-component.se-image").count()
                texts = fr.locator(".se-component.se-text").count()
                left_txt = fr.evaluate("""() => [...document.querySelectorAll('.se-component.se-text .se-text-paragraph')]
                    .map(p => { const c = p.cloneNode(true); c.querySelectorAll('.se-placeholder, [class*=placeholder]').forEach(x => x.remove()); return c.textContent.replace(/\u200b/g, '').trim(); }).join('')""")
                left = len(left_txt)
                print(f"본문 비우기: 이미지 {imgs}, 글 상자 {texts}, 남은 글자 {left} {left_txt[:20]!r}", flush=True)
                if imgs == 0 and left == 0:
                    break
            else:
                shot(page, "clear_failed")
                sys.exit("기존 본문을 비우지 못해 저장하지 않고 멈춥니다.")
            fr.locator(".se-component.se-text .se-text-paragraph").first.click()

        for kind, val in blocks:
            if kind == "text":
                type_paragraph(page, val, fr)
            else:
                with page.expect_file_chooser(timeout=15000) as fc:
                    if not click_if(fr, "button.se-image-toolbar-button", 5000):
                        click_if(fr, "button[data-name='image']", 5000)
                fc.value.set_files(str(val))
                # 업로드 완료 대기: 이미지 컴포넌트 수가 늘 때까지 (움직이는 GIF는 더 오래 걸림)
                page.wait_for_timeout(15000 if str(val).lower().endswith(".gif") else 4000)
                # 이미지 다음 줄로 커서 이동 후 이어서 입력
                last_text = fr.locator(".se-component.se-text .se-text-paragraph").last
                page.keyboard.press("Escape")  # 이미지 선택 해제(선택 테두리가 클릭을 가로막음)
                page.wait_for_timeout(300)
                try:
                    last_text.click(timeout=5000)
                except Exception:
                    last_text.click(force=True)
                page.keyboard.press("End")
            print(f"  · {kind}: {str(val)[:40]}")
        shot(page, "body_done")

        if publish:
            fr.get_by_role("button", name=re.compile("^발행")).first.click()
            page.wait_for_timeout(1500)
            shot(page, "publish_layer")
            want = os.environ.get("NAVER_CATEGORY", "").strip()
            if want and not select_category(page, fr, want):
                # 원하는 카테고리를 못 찾으면 엉뚱한 곳에 발행하지 않고 임시저장만 합니다.
                page.keyboard.press("Escape")
                page.wait_for_timeout(800)
                if not click_if(fr, "button:has-text('저장')", 5000):
                    page.keyboard.press("Control+s")
                page.wait_for_timeout(3000)
                shot(page, "saved_no_category")
                sys.exit(f"'{want}' 카테고리를 찾지 못해 임시저장만 했습니다. 로그의 카테고리 목록과 스크린샷을 확인하세요.")
            fr.locator("button:has-text('발행')").last.click()
            page.wait_for_timeout(5000)
            shot(page, "published")
            print("발행을 눌렀습니다:", page.url)
        else:
            if not click_if(fr, "button:has-text('저장')", 5000):
                page.keyboard.press("Control+s")
            page.wait_for_timeout(3000)
            shot(page, "saved")
            print("임시저장했습니다. 네이버 블로그 글쓰기 → 임시저장 글에서 확인하세요.")

        browser.close()


if __name__ == "__main__":
    main()
