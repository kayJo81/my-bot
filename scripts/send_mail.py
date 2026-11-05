#!/usr/bin/env python3
"""out/<날짜>/mail.json을 읽어 Gmail SMTP로 보냅니다. (GitHub Actions에서 실행)

환경 변수: GMAIL_USER, GMAIL_APP_PASSWORD, (선택) MAIL_TO
사용법: python3 scripts/send_mail.py out/2026-11-06 [out/...]
"""
import json
import mimetypes
import os
import smtplib
import sys
from email.message import EmailMessage
from pathlib import Path


def send(d: Path, user: str, pw: str) -> None:
    mail = json.loads((d / "mail.json").read_text(encoding="utf-8"))
    body = (d / mail["body_file"]).read_text(encoding="utf-8")
    to = os.environ.get("MAIL_TO") or mail["to"]

    msg = EmailMessage()
    msg["Subject"] = mail["subject"]
    msg["From"] = user
    msg["To"] = to
    msg.set_content(body, charset="utf-8")
    for name in mail["attachments"]:
        ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
        maintype, subtype = ctype.split("/", 1)
        msg.add_attachment((d / name).read_bytes(), maintype=maintype, subtype=subtype, filename=name)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=60) as s:
        s.login(user, pw)
        s.send_message(msg)
    print(f"sent: {mail['subject']} -> {to} ({', '.join(mail['attachments'])})")


def main() -> None:
    user, pw = os.environ.get("GMAIL_USER"), os.environ.get("GMAIL_APP_PASSWORD")
    if not user or not pw:
        sys.exit("GMAIL_USER / GMAIL_APP_PASSWORD secrets가 설정되지 않았습니다.")
    for a in sys.argv[1:]:
        send(Path(a), user, pw.replace(" ", ""))


if __name__ == "__main__":
    main()
