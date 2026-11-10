#!/usr/bin/env python3
"""지메일 받은편지함을 분류합니다: 광고 표시 메일은 휴지통, 나머지는 라벨(폴더)로 옮김(받은편지함에서 빠짐).

사용법: GMAIL_USER, GMAIL_APP_PASSWORD + python scripts/gmail_sort.py   (DRY_RUN=1이면 개수만)
공개 저장소라 제목·발신자는 출력하지 않고 분류별 개수만 출력합니다.
"""
import email
import email.header
import imaplib
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
from mail_rules import classify  # noqa: E402

MAX = int(os.environ.get("MAX_SCAN", "2000"))


def dec(v):
    out = ""
    for part, enc in email.header.decode_header(v or ""):
        out += part.decode(enc or "utf-8", "ignore") if isinstance(part, bytes) else part
    return out


def utf7(name):
    # IMAP modified UTF-7 (한글 라벨 이름)
    import base64
    res, buf = "", ""
    for ch in name:
        if 0x20 <= ord(ch) <= 0x7e:
            if buf:
                res += "&" + base64.b64encode(buf.encode("utf-16-be")).decode().rstrip("=").replace("/", ",") + "-"; buf = ""
            res += "&-" if ch == "&" else ch
        else:
            buf += ch
    if buf:
        res += "&" + base64.b64encode(buf.encode("utf-16-be")).decode().rstrip("=").replace("/", ",") + "-"
    return res


def main():
    user, pw = os.environ["GMAIL_USER"], os.environ["GMAIL_APP_PASSWORD"].replace(" ", "")
    dry = os.environ.get("DRY_RUN") == "1"
    m = imaplib.IMAP4_SSL("imap.gmail.com")
    m.login(user, pw)
    trash = None
    for line in m.list()[1]:
        s = line.decode("utf-8", "ignore")
        if "\\Trash" in s:
            trash = re.search(r'"([^"]+)"\s*$', s).group(1)
    m.select("INBOX")
    typ, data = m.uid("SEARCH", "X-GM-RAW", '"-is:starred"')
    uids = data[0].split()[-MAX:] if data and data[0] else []
    print(f"받은편지함 검사 대상: {len(uids)}건", flush=True)
    groups = {}
    for i in range(0, len(uids), 200):
        chunk = b",".join(uids[i:i + 200]).decode()
        typ, rows = m.uid("FETCH", chunk, "(BODY.PEEK[HEADER.FIELDS (SUBJECT FROM)])")
        for r in rows:
            if not isinstance(r, tuple):
                continue
            uid = re.search(rb"UID (\d+)", r[0]).group(1)
            msg = email.message_from_bytes(r[1])
            name, addr = email.utils.parseaddr(dec(msg.get("From")))
            c = classify(dec(msg.get("Subject")), addr, name)
            if c:
                groups.setdefault(c, []).append(uid)
    cnt = Counter({k: len(v) for k, v in groups.items()})
    print("분류 결과:", ", ".join(f"{k} {v}건" for k, v in cnt.items()) or "없음", flush=True)
    if dry:
        print("확인만 함(DRY_RUN)", flush=True)
        return
    for c, ids in groups.items():
        dest = trash if c == "trash" else utf7(c)
        if c != "trash":
            m.create(f'"{dest}"')  # 이미 있으면 실패해도 괜찮음
        for i in range(0, len(ids), 100):
            chunk = b",".join(ids[i:i + 100]).decode()
            typ, _ = m.uid("MOVE", chunk, f'"{dest}"')
            if typ != "OK":
                m.uid("COPY", chunk, f'"{dest}"')
                m.uid("STORE", chunk, "+FLAGS", "(\\Deleted)")
                m.expunge()
        print(f"{'휴지통' if c == 'trash' else c}(으)로 옮김: {len(ids)}건", flush=True)
    m.logout()


if __name__ == "__main__":
    main()
