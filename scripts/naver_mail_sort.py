#!/usr/bin/env python3
"""네이버 받은메일함을 분류합니다: 광고 표시 메일은 휴지통, 나머지는 내 메일함(청구서함·쇼핑레터함·뉴스레터함·외신)으로 이동.

사용법: python scripts/naver_mail_sort.py '{"pages": 20, "limit": 0, "gap_ms": 700}'
  - limit > 0 이면 그 통수만 처리(시험용)
세부 결과(제목 등)는 워크플로가 암호화해서만 출력하고, 화면에는 분류별 개수만 출력합니다.
"""
import json
import os
import re
import sys
import time
from urllib.parse import parse_qsl, urlencode

sys.path.insert(0, os.path.dirname(__file__))
from mail_rules import classify  # noqa: E402
from post_naver_blog import load_cookies  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

FETCH = """async ([u, body]) => {
  const r = await fetch(u, {method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body});
  const t = await r.text(); try { return JSON.parse(t); } catch (e) { return {raw: t.slice(0, 300), status: r.status}; } }"""
SEQ = """async ([u, bodies, gap]) => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let ok = 0, fail = 0, blocks = 0, last = '';
  for (const b of bodies) {
    for (let tries = 0; tries < 6; tries++) {
      let t = '';
      try { const r = await fetch(u, {method: 'POST', credentials: 'include',
          headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}, body: b}); t = await r.text(); } catch (e) { t = String(e); }
      if (t.includes('"OK"')) { ok++; break; }
      if (t.includes('TEMPORARY_BLOCKED')) { blocks++; await sleep(60000 * (tries + 1)); continue; }
      fail++; last = t.slice(0, 160); break;
    }
    await sleep(gap);
  }
  return {ok, fail, blocks, last}; }"""
FOLDERS = ["청구서함", "쇼핑레터함", "뉴스레터함", "외신"]


def walk(o, fn):
    if isinstance(o, dict):
        fn(o)
        for v in o.values():
            walk(v, fn)
    elif isinstance(o, list):
        for v in o:
            walk(v, fn)


def main():
    rule = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
    out = {"log": [], "moved": {}, "reqs": []}
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        ctx = b.new_context(locale="ko-KR", timezone_id="Asia/Seoul", viewport={"width": 1400, "height": 1000},
                            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"))
        ctx.add_cookies(load_cookies())
        page = ctx.new_page()
        page.set_default_timeout(25000)
        reqs = []

        def _rq(rq):
            if "mail.naver.com/json" in rq.url:
                body = rq.post_data or ""
                u = rq.url
                if not body and "?" in u:
                    u, body = u.split("?", 1)
                reqs.append((u, body))
        page.on("request", _rq)
        page.on("dialog", lambda d: d.accept())
        page.goto("https://mail.naver.com/v2/folders/0", wait_until="domcontentloaded")
        page.wait_for_timeout(7000)
        if "nid.naver.com" in page.url:
            sys.exit("로그인이 풀려 있습니다(NAVER_COOKIES 갱신 필요).")

        # 폴더 번호
        fl = page.evaluate(FETCH, ["https://mail.naver.com/json/folder/list", ""])
        fsn = {}
        walk(fl, lambda o: fsn.__setitem__(o.get("folderName") or o.get("name"), o.get("folderSN"))
             if (o.get("folderName") or o.get("name")) in FOLDERS and "folderSN" in o else None)
        out["folders"] = fsn
        print("폴더:", ", ".join(f"{k}" for k in fsn) or "못 찾음", flush=True)

        # 받은메일함 목록 요청 형식
        out["all_paths"] = sorted(set(r[0].split("mail.naver.com", 1)[-1] for r in reqs))
        mails = []
        lr = [r for r in reqs if re.search(r"/json/list/?$", r[0])]
        sr = [r for r in reqs if r[0].endswith("/json/list/sender")]
        if lr:  # 일반 목록 보기
            u, body = lr[-1]
            q = dict(parse_qsl(body, keep_blank_values=True))
            for pg in range(1, int(rule.get("pages", 20)) + 1):
                q["page"] = str(pg)
                j = page.evaluate(FETCH, [u, urlencode(q)])
                rows = (j.get("mailData") or []) if isinstance(j, dict) else []
                mails += rows
                if pg >= int((j or {}).get("lastPage") or 1) or not rows:
                    break
        elif sr:  # 보낸 사람별 보기
            u, body = sr[-1]
            q = dict(parse_qsl(body, keep_blank_values=True))
            out["sender_req"] = body[:300]
            folder = q.get("folderSN", "0")
            senders = []
            for pg in range(1, 300):
                q["page"] = str(pg)
                j = page.evaluate(FETCH, [u, urlencode(q)])
                got = []
                walk(j, lambda o: got.append(next((o[k] for k in ("sender", "email", "senderAddress", "address")
                                                    if isinstance(o.get(k), str) and "@" in o.get(k)), None)))
                new = [g for g in dict.fromkeys(x for x in got if x) if g not in senders]
                senders += new
                last = int(j.get("lastPage") or 0) if isinstance(j, dict) else 0
                if not new or (last and pg >= last):
                    break
            print(f"받은메일함 보낸 사람: {len(senders)}곳", flush=True)
            for snd in senders:
                off = 0
                while off < 3000:
                    bd = urlencode({"sender": snd, "folderSN": folder, "startOffset": str(off), "pageSize": "100",
                                    "previewMode": "3", "u": q.get("u", "")})
                    j = page.evaluate(FETCH, ["https://mail.naver.com/json/list/specificSender/", bd])
                    rows = []
                    walk(j, lambda o: rows.append(o) if "mailSN" in o else None)
                    mails += rows
                    if len(rows) < 100:
                        break
                    off += 100
                time.sleep(0.15)
        else:
            out["log"].append("목록 요청을 못 잡음")
            json.dump(out, open("naver_sort_out.json", "w"), ensure_ascii=False)
            sys.exit("받은메일함 목록 요청을 찾지 못했습니다.")
        print(f"받은메일함 검사 대상: {len(mails)}통", flush=True)

        groups = {}
        for m in mails:
            f = m.get("from") or {}
            c = classify(m.get("subject") or "", f.get("email") or "", f.get("name") or "")
            if c and (c == "trash" or c in fsn):
                groups.setdefault(c, []).append((str(m.get("mailSN")), m.get("folderSN", 0), (m.get("subject") or "")[:40]))
        print("분류 결과:", ", ".join(f"{'휴지통' if k == 'trash' else k} {len(v)}통" for k, v in groups.items()) or "없음", flush=True)
        out["groups"] = groups
        limit = int(rule.get("limit", 0))

        def capture(kind, sn, folder_sn, target_name=None):
            """화면에서 한 통을 직접 옮기거나 지워 요청 형식을 잡습니다."""
            reqs.clear()
            page.goto(f"https://mail.naver.com/v2/read/{folder_sn}/{sn}", wait_until="domcontentloaded")
            page.wait_for_timeout(3500)
            try:
                if kind == "delete":
                    page.get_by_role("button", name="삭제", exact=True).locator("visible=true").first.click(timeout=6000)
                else:
                    page.locator("button.svg_move:visible, button:has-text('이동'):visible").first.click(timeout=6000)
                    page.wait_for_timeout(1200)
                    page.locator(f"[role=menu] :text-is('{target_name}'), [class*=layer] :text-is('{target_name}'), [class*=dropdown] :text-is('{target_name}'), li:visible:has-text('{target_name}')").first.click(timeout=6000)
                page.wait_for_timeout(2500)
            except Exception as e:  # noqa: BLE001
                out["log"].append(f"{kind} 화면 조작 실패: {type(e).__name__} {str(e)[:150]}")
                try:
                    import base64
                    out.setdefault("shots", []).append(base64.b64encode(page.screenshot(type="jpeg", quality=55)).decode())
                except Exception:
                    pass
            pat = "/json/select/delete" if kind == "delete" else r"/json/select/(move|moveMail)|/json/.*move"
            got = [r for r in reqs if re.search(pat, r[0])]
            out["reqs"].append((kind, target_name, [(r[0], r[1][:300]) for r in reqs if "/json/" in r[0]][-6:]))
            return got[-1] if got else None

        total = 0
        for c, items in groups.items():
            if limit:
                items = items[:limit]
            if not items:
                continue
            kind = "delete" if c == "trash" else "move"
            first = items[0]
            cap = capture(kind, first[0], first[1], None if c == "trash" else c)
            if not cap:
                print(f"{'휴지통' if c == 'trash' else c}: 요청 형식을 못 잡아 건너뜀", flush=True)
                continue
            cu, cbody = cap
            q0 = dict(parse_qsl(cbody, keep_blank_values=True))
            out.setdefault("req_keys", {})[c] = list(q0.keys())
            done = 1
            bodies = []
            for sn, fs, _ in items[1:]:
                qq = dict(q0)
                for k in list(qq):
                    if k in ("mailSNList", "mailSN"):
                        qq[k] = sn
                    elif k in ("folderSNList", "fromFolderSN", "folderSN") and kind == "delete":
                        qq[k] = str(fs)
                    elif k in ("folderSNList", "fromFolderSNList", "fromFolderSN"):
                        qq[k] = str(fs)
                bodies.append(urlencode(qq))
            for k in range(0, len(bodies), 100):
                r = page.evaluate(SEQ, [cu, bodies[k:k + 100], int(rule.get("gap_ms", 700))])
                done += r["ok"]
                if r["fail"]:
                    out["log"].append(f"{c} 실패 {r['fail']} {r['last']}")
            out["moved"][c] = done
            total += done
            print(f"{'휴지통' if c == 'trash' else c}(으)로 옮김: {done}통", flush=True)
        print(f"합계 {total}통", flush=True)
        b.close()
    json.dump(out, open("naver_sort_out.json", "w"), ensure_ascii=False)


if __name__ == "__main__":
    main()
