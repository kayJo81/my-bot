---
name: auto-blog
description: 워치리스트·앤트로픽·오픈AI 속보를 모아 글감을 고르고, 사실 확인·인포그래픽·네이버 블로그 게시·state.json 갱신까지 하는 매시간 자동 블로그 절차. "[워치리스트 뉴스 자동 블로그]" 예약 작업이나 docs/AUTO_BLOG.md 실행 요청 때 사용.
---
# 워치리스트 뉴스 자동 블로그

규칙·판단 기준의 원본은 `docs/AUTO_BLOG.md`다. 먼저 읽고 그대로 따른다. 이 스킬은 실행 명령을 모아 둔 것이다.

## 1. 시작 점검
```bash
cd /home/user/my-bot && git pull -q --rebase origin main
python3 -c "import json;d=json.load(open('auto_blog/state.json'));import datetime as t;k=(t.datetime.utcnow()+t.timedelta(hours=9)).strftime('%Y-%m-%d');p=[x for x in d['posted'] if x['date']==k];print('last_ts',d['last_ts'],'| 오늘',len(p),'편:',[x['ticker'] for x in p])"
```
오늘 20편이면 글은 쓰지 않고 last_ts만 갱신한다. 같은 종목은 하루 1편(큰 후속 소식만 예외).

## 2. 속보 수집
```bash
python3 scripts/watch_news.py > "$SCRATCH/wn.json"   # SCRATCH = 세션 scratchpad
python3 -c "
import json,sys;d=json.load(open(sys.argv[1]));print(d['since'],d['until'],d['count'])
for tk,v in d['by_company'].items():
  for it in v['items']: print(tk,it['kst'],it['imp'],it['src'],it['ko'][:200],'|',it['orig'][:80])" "$SCRATCH/wn.json"
```
오탐(사과 선물→애플, 新思路→시놉시스 등)이 보이면 `scripts/watch_news.py`나 `auto_blog/watchlist.json`을 고친다.

## 3. 사실 확인
- WebSearch로 원 출처를 찾는다. 샌드박스에서 막힌 사이트는 fetch-text.yml로 읽는다:
  `actions_run_trigger`(workflow_id `fetch-text.yml`, inputs `{"urls": "URL1 URL2"}`) → `scripts/wait_run.sh fetch-text.yml ""`
- 주가는 야후 차트 API(`query1.finance.yahoo.com/v8/finance/chart/<티커>?range=1mo&interval=1d`)의 종가를 쓴다.

## 4. 인포그래픽 4~6장
`scripts/blog_cards.js`의 `const pages=[...]`를 바꿔 렌더 → 가로 1242px, JPEG 품질 90으로 맞춘다.
`NODE_PATH=$(npm root -g) node <파일> <출력폴더>`. 몇 장을 Read로 열어 겹침·잘림·줄바꿈을 확인한다.

## 5. 본문 `blog/<YYYY-MM-DD>-<주제>/body.txt`
`BLOG_STYLE.md` 형식. 쓴 뒤 **fact-checker 서브에이전트**에 초안 경로와 출처 URL 목록을 넘겨 검증하고, 지적된 문장을 고친다.

## 6. 게시
1. `git add blog/<폴더> && git commit -m "blog: <주제>" && git push -q origin main`
2. `actions_run_trigger`: workflow_id `post-blog.yml`, inputs `{"dir":"blog/<폴더>","category":"…","publish":"1"}`
   카테고리: 테슬라·스페이스X·xAI → "테슬라와 스페이스X", 그 밖 → "금융과 투자 넋두리".
3. `scripts/wait_run.sh post-blog.yml "제목:|발행을 눌렀습니다|Redirect"` → 글 주소 확인.
   주소에 글 번호가 없으면 fetch-text로 `rss.blog.naver.com/yidiar.xml`을 읽어 찾는다.

## 7. 기록·보고
state.json의 last_ts를 wn.json의 until로, posted에 `{date, ticker, topic, url}` 추가 → 커밋·푸시.
한국어로 짧게 보고: 올린 글 제목·주소, 건너뛴 주요 소식과 이유.

주의: mail.json은 절대 커밋하지 않는다(훅이 막는다). 사람 얼굴·개인정보 이미지는 쓰지 않는다.
