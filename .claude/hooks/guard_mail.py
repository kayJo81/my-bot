#!/usr/bin/env python3
"""PreToolUse(Bash) 훅: out/·reports/ 아래 mail.json이 의도치 않게 커밋·푸시되어 메일이 나가는 것을 막는다.

mail.json을 커밋하면 send-mail.yml이 실제로 메일을 보낸다. 그래서 발송용 커밋 메시지 규칙
("briefing: D", "brief: D", "report: ...")을 쓴 커밋에서만 허용하고, 그 밖의 커밋·푸시는 막는다(exit 2).
"""
import json
import re
import subprocess
import sys

ALLOWED = re.compile(r"(?:^|[\"'\s])(briefing|brief|report):")
MAIL = re.compile(r"^(out|reports)/.+/mail\.json$")


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    return r.stdout.splitlines() if r.returncode == 0 else []


def block(msg):
    print(msg, file=sys.stderr)
    sys.exit(2)


try:
    cmd = json.load(sys.stdin).get("tool_input", {}).get("command", "")
except Exception:  # noqa: BLE001
    sys.exit(0)

if re.search(r"\bgit\s+commit\b", cmd):
    files = set(git("diff", "--cached", "--name-only"))
    if re.search(r"\bgit\s+add\b|\bcommit\s+(-\w*a|--all)", cmd):  # 같은 명령에서 add하는 경우까지 넓게 본다
        files |= {l[3:].split(" -> ")[-1] for l in git("status", "--porcelain", "-uall")}
    mails = sorted(f for f in files if MAIL.match(f))
    if mails and not ALLOWED.search(cmd):
        block("커밋 차단: 메일 발송용 mail.json이 포함됐어요 → " + ", ".join(mails) +
              "\n발송이 목적이면 커밋 메시지를 'briefing: D' / 'brief: D' / 'report: ...'로 쓰고, "
              "아니라면 git restore --staged 로 빼세요(시험은 examples/ 등 다른 폴더 사용).")

if re.search(r"\bgit\s+push\b", cmd):
    bad, subj = [], ""
    for line in git("log", "@{u}..HEAD", "--diff-filter=A", "--name-only", "--format=@@%s"):
        if line.startswith("@@"):
            subj = line[2:]
        elif MAIL.match(line) and not re.match(r"(briefing|brief|report):", subj):
            bad.append(f"{line} ({subj})")
    if bad:
        block("푸시 차단: 발송용 메시지가 아닌 커밋에 mail.json이 들어 있어요 → " + "; ".join(bad) +
              "\n메일이 실제로 나가니 해당 커밋에서 mail.json을 빼고 다시 푸시하세요.")
sys.exit(0)
