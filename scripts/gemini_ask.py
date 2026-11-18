"""제미나이 API에 질문을 보내고 답을 answer.json에 저장합니다.
공개 저장소라 답 내용은 로그에 찍지 않고, 워크플로가 암호화해서 출력합니다."""
import json, os, sys, time, urllib.request, urllib.error

KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = (os.environ.get("MODEL") or "gemini-3.8-flash,gemini-3.7-flash,gemini-flash-latest").strip()
PROMPT = os.environ.get("PROMPT", "")
SEARCH = os.environ.get("SEARCH", "0") == "1"
FILES = [f for f in (os.environ.get("FILES") or "").split() if f]
for f in FILES:  # 저장소 안의 파일 내용을 질문 뒤에 붙임 (블로그 글 검증용)
    if os.path.isfile(f):
        PROMPT += f"\n\n===== {f} =====\n" + open(f, encoding="utf-8").read()
    else:
        print(f"파일 없음: {f}")
BASE = "https://generativelanguage.googleapis.com/v1beta"

if not KEY:
    sys.exit("GEMINI_API_KEY 시크릿이 없습니다.")

class ApiError(Exception):
    def __init__(self, code, msg):
        super().__init__(f"API 오류 {code}: {msg}"); self.code = code

def call(url, body=None):
    for i in range(4):
        req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                     headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")[:3000]
            if e.code in (429, 500, 503) and i < 3 and "exceeded your current quota" not in msg:
                print(f"일시 오류 {e.code}, {15*(i+1)}초 뒤 다시 시도")
                time.sleep(15 * (i + 1)); continue
            raise ApiError(e.code, msg)

if MODEL == "list":
    try:
        d = call(f"{BASE}/models?pageSize=200")
    except ApiError as e:
        sys.exit(str(e))
    names = [m["name"].split("/")[-1] for m in d.get("models", [])
             if "generateContent" in m.get("supportedGenerationMethods", [])]
    print("사용 가능한 모델:", ", ".join(names))
    sys.exit(0)

if not PROMPT.strip():
    sys.exit("질문(prompt)이 비어 있습니다.")

body = {"contents": [{"role": "user", "parts": [{"text": PROMPT}]}]}
if SEARCH:
    body["tools"] = [{"google_search": {}}]
d = None
for m in [x.strip() for x in MODEL.split(",") if x.strip()]:
    try:
        d = call(f"{BASE}/models/{m}:generateContent", body); MODEL = m; break
    except ApiError as e:
        print(f"[{m}] {e}"[:1500])
if d is None:
    sys.exit("모든 모델이 실패했습니다.")

cand = (d.get("candidates") or [{}])[0]
text = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
sources = []
for c in (cand.get("groundingMetadata") or {}).get("groundingChunks", []) or []:
    w = c.get("web") or {}
    if w.get("uri"):
        sources.append({"title": w.get("title", ""), "uri": w["uri"]})
out = {"model": d.get("modelVersion", MODEL), "finish": cand.get("finishReason"),
       "usage": d.get("usageMetadata", {}), "text": text, "sources": sources}
json.dump(out, open("answer.json", "w"), ensure_ascii=False, indent=1)
print(f"모델 {out['model']} · 종료 {out['finish']} · 답 {len(text)}자 · 출처 {len(sources)}개")
