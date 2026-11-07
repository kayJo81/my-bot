#!/usr/bin/env python3
"""공개된 네이버 블로그 글의 서식 구조를 읽어 사람이 보기 쉬운 형태로 출력합니다(읽기 전용).

사용법: python scripts/naver_dump.py yidiar 224468143725 [더 많은 번호]
번호를 안 주면 최근 글 10개의 번호와 제목만 출력합니다.
출력: 표준출력 + style_dump/<번호>.txt
"""
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"}


def get(url: str) -> str:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read().decode("utf-8", "ignore")


def recent(blog: str) -> None:
    raw = get(f"https://blog.naver.com/PostTitleListAsync.naver?blogId={blog}&currentPage=1&countPerPage=10")
    raw = raw.replace("\\'", "'")
    try:
        data = json.loads(raw)
    except Exception:
        print(raw[:500])
        return
    for p in data.get("postList", []):
        print(p["logNo"], urllib.parse.unquote_plus(p.get("title", "")), p.get("addDate", ""))


def inline(node) -> str:
    """굵게·크기·색 등 서식을 표시하며 텍스트를 펼칩니다."""
    out = []
    for ch in node.children:
        if isinstance(ch, NavigableString):
            out.append(str(ch))
            continue
        if ch.name == "br":
            out.append("⏎")
            continue
        inner = inline(ch)
        cls = " ".join(ch.get("class", []))
        tags = []
        if ch.name in ("b", "strong") or "se-bold" in cls or "font-weight" in (ch.get("style") or ""):
            tags.append("굵게")
        m = re.search(r"se-fs-?(\w+)", cls)
        if m and m.group(1) not in ("", "fs15"):
            tags.append(m.group(1))
        st = ch.get("style") or ""
        m = re.search(r"color:\s*([^;]+)", st)
        if m and m.group(1).strip().lower() not in ("#000000", "rgb(0, 0, 0)", "#333333"):
            tags.append("색" + m.group(1).strip())
        m = re.search(r"background-color:\s*([^;]+)", st)
        if m:
            tags.append("배경" + m.group(1).strip())
        if ch.name == "u" or "underline" in st:
            tags.append("밑줄")
        if ch.name == "a":
            tags.append("링크")
        out.append(f"〔{'/'.join(tags)}:{inner}〕" if tags and inner.strip() else inner)
    return "".join(out)


def dump(blog: str, log_no: str) -> str:
    h = get(f"https://blog.naver.com/PostView.naver?blogId={blog}&logNo={log_no}")
    s = BeautifulSoup(h, "html.parser")
    lines = []
    t = s.select_one(".se-title-text, .pcol1")
    lines.append(f"# {log_no} 제목: {t.get_text(' ', strip=True) if t else '?'}")
    main = s.select_one(".se-main-container")
    if not main:
        lines.append("(본문 컨테이너를 찾지 못함)")
        return "\n".join(lines)
    for comp in main.select(":scope > .se-component"):
        cls = comp.get("class", [])
        kind = next((c[3:] for c in cls if c.startswith("se-") and c not in ("se-component", "se-l-default")
                     and not c.startswith("se-l-") and not c.startswith("se-section")), "?")
        lay = next((c for c in cls if c.startswith("se-l-")), "")
        if "text" in kind:
            lines.append(f"[텍스트 {lay}]")
            for p in comp.select(".se-text-paragraph"):
                al = next((c.replace("se-text-paragraph-align-", "") for c in p.get("class", [])
                           if c.startswith("se-text-paragraph-align-")), "")
                txt = inline(p).replace("​", "").strip()
                lines.append(f"  ({al or '기본'}) {txt if txt else '·빈 줄·'}")
        elif "quotation" in kind:
            q = comp.select_one(".se-quote")
            lines.append(f"[인용구 {lay}] {' '.join(cls)}")
            for p in comp.select(".se-text-paragraph"):
                lines.append(f"  > {inline(p).strip()}")
        elif "image" in kind or "imageStrip" in kind or "imageGroup" in kind:
            cap = comp.select_one(".se-caption")
            lines.append(f"[이미지 {kind} {lay}]" + (f" 캡션: {cap.get_text(' ', strip=True)}" if cap else ""))
        elif "horizontalLine" in kind:
            lines.append(f"[구분선 {lay}]")
        elif "sticker" in kind:
            lines.append("[스티커]")
        else:
            lines.append(f"[{kind} {lay}] {comp.get_text(' ', strip=True)[:200]}")
    tags = [a.get_text(strip=True) for a in s.select(".post_tag a, .wrap_tag a")]
    if tags:
        lines.append("태그: " + " ".join(tags))
    return "\n".join(lines)


def main() -> None:
    blog, nums = sys.argv[1], [x for a in sys.argv[2:] for x in re.split(r"[,\s]+", a) if x]
    print("== 최근 글 ==")
    recent(blog)
    out = Path("style_dump")
    out.mkdir(exist_ok=True)
    for n in nums:
        txt = dump(blog, n)
        (out / f"{n}.txt").write_text(txt, encoding="utf-8")
        print("\n" + txt)


if __name__ == "__main__":
    main()
