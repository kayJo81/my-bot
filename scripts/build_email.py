#!/usr/bin/env python3
"""content.json + figures.json -> 메일 본문(body.txt) + 그림 PDF + 발송 정보(mail.json)

사용법: python3 scripts/build_email.py out/2026-11-06
- 해설이 빠진 그림이 있으면 목록을 출력하고 종료 코드 1로 끝납니다.
- mail.json이 생기고 커밋·푸시되면 GitHub Actions(send-mail.yml)가 메일을 보냅니다.
"""
import json
import sys
from datetime import date
from pathlib import Path

TITLE = "개장 전 섹터별 이슈체크"


def make_pdf(d: Path, figs: list, name: str) -> None:
    """그림을 1쪽에 1장씩 담은 PDF를 만듭니다."""
    try:
        from PIL import Image
    except ImportError:
        sys.exit("Pillow가 없습니다: pip install pillow")
    imgs = [Image.open(d / f["file"]).convert("RGB") for f in figs]
    imgs[0].save(d / name, "PDF", resolution=150.0, save_all=True, append_images=imgs[1:])


def commentary_for(fig: dict, comm: dict):
    fid = fig["id"]
    if isinstance(comm.get(fid), str):
        return comm[fid]
    key, _, part = fid.partition("#")
    v = comm.get(key)
    if isinstance(v, list):
        if not part:  # 나뉘지 않은 그림인데 해설이 여러 단락이면 이어 붙임
            return " ".join(x.strip() for x in v if x)
        idx = int(part) - 1
        return v[idx] if idx < len(v) else None
    if isinstance(v, str) and not part:
        return v
    return None


def main() -> None:
    d = Path(sys.argv[1])
    content = json.loads((d / "content.json").read_text(encoding="utf-8"))
    figs = json.loads((d / "figures.json").read_text(encoding="utf-8"))
    comm = content.get("commentary", {})

    y, m, dd = (int(x) for x in content["date"].split("-"))
    dt = date(y, m, dd)
    kdate = f"{dt.year}년 {dt.month}월 {dt.day}일"

    problems = []
    paras = [f"{kdate} {TITLE}"]
    greeting = content.get("greeting")
    if not greeting:
        problems.append("greeting(인사 2~3줄) 없음")
    else:
        paras.append(greeting.strip())

    for f in figs:
        c = commentary_for(f, comm)
        if not c:
            problems.append(f"그림{f['n']}({f['id']}) 해설 없음 -> commentary[\"{f['id']}\"] 또는 commentary[\"{f['id'].split('#')[0]}\"] 리스트")
            continue
        paras.append(f"[그림{f['n']}]")
        paras.append(c.strip())

    srcs = content.get("sources", [])
    if not srcs:
        problems.append("sources(출처 링크) 없음")
    lines = [f"출처 링크 ({content['date']} KST)"]
    seen = set()
    for s in srcs:
        if s["url"] in seen:
            continue
        seen.add(s["url"])
        lines.append(f"· {s['title']} ({s['outlet']}): {s['url']}")
    paras.append("\n".join(lines))
    paras.append("그림 대응(PDF 쪽 번호): " + ", ".join(f"그림{f['n']}={f['name']}" for f in figs))

    if problems:
        print("고칠 것:\n- " + "\n- ".join(problems))
        sys.exit(1)

    body = "\n\n".join(paras) + "\n"
    (d / "body.txt").write_text(body, encoding="utf-8")
    pdf_name = f"개장전_섹터별_이슈체크_{content['date']}.pdf"
    make_pdf(d, figs, pdf_name)
    mail = {
        "subject": f"[{TITLE}] {kdate}",
        "to": content.get("mail_to", "yidiar80k@gmail.com"),
        "body_file": "body.txt",
        "attachments": [pdf_name],
    }
    (d / "mail.json").write_text(json.dumps(mail, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"OK: {mail['subject']} / PDF {len(figs)}쪽 ({pdf_name}) / 본문 {len(body)}자")


if __name__ == "__main__":
    main()
