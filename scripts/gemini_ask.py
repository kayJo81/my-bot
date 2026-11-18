"""제미나이 API에 질문을 보내고 답을 answer.json에 저장합니다.
공개 저장소라 답 내용은 로그에 찍지 않고, 워크플로가 암호화해서 출력합니다."""
import json, os, sys, urllib.request, urllib.error

KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = (os.environ.get("MODEL") or "gemini-flash-latest").strip()
PROMPT = os.environ.get("PROMPT", "")
SEARCH = os.environ.get("SEARCH", "0") == "1"
BASE = "https://generativelanguage.googleapis.com/v1beta"

if not KEY:
    sys.exit("GEMINI_API_KEY 시크릿이 없습니다.")

def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"x-goog-api-key": KEY, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "ignore")[:500]
        sys.exit(f"API 오류 {e.code}: {msg}")

if MODEL == "list":
    d = call(f"{BASE}/models?pageSize=200")
    names = [m["name"].split("/")[-1] for m in d.get("models", [])
             if "generateContent" in m.get("supportedGenerationMethods", [])]
    print("사용 가능한 모델:", ", ".join(names))
    sys.exit(0)

if not PROMPT.strip():
    sys.exit("질문(prompt)이 비어 있습니다.")

body = {"contents": [{"role": "user", "parts": [{"text": PROMPT}]}]}
if SEARCH:
    body["tools"] = [{"google_search": {}}]
d = call(f"{BASE}/models/{MODEL}:generateContent", body)

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
