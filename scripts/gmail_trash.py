#!/usr/bin/env python3
"""지메일 검색 조건에 맞는 메일을 IMAP으로 휴지통으로 옮깁니다(영구 삭제 아님, 휴지통은 30일 보관).

사용법: GMAIL_USER, GMAIL_APP_PASSWORD 환경변수 + python scripts/gmail_trash.py "검색식" ["검색식" ...]
  - 검색식은 지메일 검색창 문법 그대로(X-GM-RAW). 예: "from:klook.com before:2026/10/06"
  - DRY_RUN=1 이면 개수만 세고 옮기지 않습니다.
공개 저장소이므로 메일 제목·발신자는 출력하지 않고 개수만 출력합니다.
"""
import imaplib
import json
import os
import re
import sys
from collections import Counter
from email.utils import parseaddr

MAX = int(os.environ.get("MAX_PER_QUERY", "300"))


def main():
    user, pw = os.environ["GMAIL_USER"], os.environ["GMAIL_APP_PASSWORD"].replace(" ", "")
    dry = os.environ.get("DRY_RUN") == "1"
    m = imaplib.IMAP4_SSL("imap.gmail.com")
    m.login(user, pw)
    trash = None
    for line in m.list()[1]:
        s = line.decode("utf-8", "ignore")
        if "\\Trash" in s:
            trash = re.search(r'"([^"]+)"\s*$', s).group(1) if s.endswith('"') else s.split(" ")[-1]
    allmail = None
    for line in m.list()[1]:
        s = line.decode("utf-8", "ignore")
        if "\\All" in s:
            allmail = re.search(r'"([^"]+)"\s*$', s).group(1) if s.endswith('"') else s.split(" ")[-1]
    if not trash or not allmail:
        sys.exit("휴지통/전체보관함 폴더를 찾지 못했습니다.")
    m.select(f'"{allmail}"')
    total = 0
    senders = Counter()
    stats_file = os.environ.get("STATS_FILE")  # 지정하면 발신자별 개수를 파일로 저장(워크플로가 암호화)
    for q in [a for a in sys.argv[1:] if a.strip()]:
        if q.isascii():
            typ, data = m.uid("SEARCH", "X-GM-RAW", f'"{q}"')
        else:  # 한글 검색어: UTF-8 리터럴로 전송
            m.literal = q.encode("utf-8")
            typ, data = m.uid("SEARCH", "CHARSET", "UTF-8", "X-GM-RAW")
        uids = data[0].split()[:MAX] if data and data[0] else []
        print(f"검색 [{q}] → {len(uids)}건", flush=True)
        if dry or not uids:
            continue
        if stats_file:
            for i in range(0, len(uids), 100):
                chunk = b",".join(uids[i:i + 100]).decode()
                typ, data = m.uid("FETCH", chunk, "(BODY.PEEK[HEADER.FIELDS (FROM)])")
                for part in data or []:
                    if isinstance(part, tuple):
                        raw = part[1].decode("utf-8", "ignore").split(":", 1)[-1].strip()
                        senders[parseaddr(raw)[1].lower() or raw[:60]] += 1
        for i in range(0, len(uids), 100):
            chunk = b",".join(uids[i:i + 100]).decode()
            typ, _ = m.uid("MOVE", chunk, f'"{trash}"')
            if typ != "OK":
                m.uid("COPY", chunk, f'"{trash}"')
                m.uid("STORE", chunk, "+FLAGS", "(\\Deleted)")
                m.expunge()
        total += len(uids)
    print(("확인만 함(DRY_RUN)" if dry else f"휴지통으로 옮김: {total}건"), flush=True)
    if stats_file:
        with open(stats_file, "w", encoding="utf-8") as f:
            json.dump({"total": total, "senders": senders.most_common(30)}, f, ensure_ascii=False)
    m.logout()


if __name__ == "__main__":
    main()
