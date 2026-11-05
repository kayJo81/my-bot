# my-bot: 개장 전 섹터별 이슈체크 봇

매일 21:30 KST 전후로 Claude 예약 작업이 새 세션을 열고 이 저장소에서 아래 절차를 실행합니다.
글쓰기 규칙은 모두 `GUIDELINE_FOR_CLAUDE.md`를 따릅니다. 이 파일은 실행 절차만 정합니다.

## 실행 절차

1. 준비
   - 날짜 `D` = 오늘 KST 날짜(YYYY-MM-DD). 작업 폴더 `out/D/`.
   - `out/D/mail.json`이 이미 있으면 오늘 것은 이미 보냈으므로 아무것도 하지 말고 끝냅니다.
   - 글꼴 확인: `fc-list | grep -i NanumGothic`. 없으면 `apt-get install -y fonts-nanum`.
2. 소스 수집
   - `python3 scripts/fetch_flash.py out/D` → `out/D/flash_window.json` (15:30 KST 이후 속보만).
     항목이 많으면 메가테크·모빌리티·AI·반도체 관련만 골라 읽습니다(grep, jq, python 활용).
   - DIGITIMES: WebFetch로 https://www.digitimes.com/ 와 https://www.digitimes.com.tw/ 를 읽습니다.
   - `watchlist.json`의 워치리스트 종목도 모니터링 대상입니다. flash_window.json에서 종목명·티커(영문·한국어·중국어 표기)로
     걸러 읽고, 큰 소식은 WebSearch로 한 번 더 확인합니다.
   - 주요 매체(로이터, CNBC, Bloomberg, Yahoo Finance 등)와 기업 IR은 WebSearch로 찾습니다.
     직접 접속이 막힌 사이트는 검색 결과의 제목·요약·URL로 확인합니다. 확인 못 한 수치는 쓰지 않습니다.
3. `out/D/content.json` 작성 (형식은 `examples/content.json` 참고)
   - 가이드라인 3~6절: 분류, 라벨([사실]/[의미]/[영향]/[체크]/[배경]), 사실성 규칙, 문체.
   - `sections`의 키: `megatech`, `mobility`, `ai_software`, `ai_infra`, `semis`, `others`(크립토·희토류, 선택).
     워치리스트 그룹을 어느 분류에 넣을지는 가이드라인 3절을 따릅니다. `others`는 소식이 없으면 비워 두면 그림이 생기지 않습니다.
     소식이 없는 분류는 빈 배열로 두고 `empty_notes`에 직전 맥락 한 줄을 씁니다.
   - 카드 `tag`: 15:30 이후면 `"신규"`, 이전이면 `"배경"`.
   - `chips[].chg`: 확인된 등락률만, `"+2.3%"` / `"-1.1%"` 형식. 숫자가 없으면 `chg`를 비웁니다.
   - `source`: 매체 이름만(URL 없이). URL은 `sources` 목록에 모읍니다(모든 항목에 1개 이상).
4. 렌더링: `node scripts/render.mjs out/D` → `pre_N.jpg`, `figures.json`.
   - 생성된 이미지 몇 장을 Read로 열어 글자 겹침·잘림이 없는지 확인합니다.
5. 해설 작성: `figures.json`의 각 그림 id(`summary`, `issue1`, `megatech` 또는 나뉜 경우 `megatech#1`, `megatech#2` …)마다
   `content.json`의 `commentary`에 2~4문장 해설을 씁니다(가이드라인 8절). 나뉜 분류는 리스트로 써도 됩니다.
   `greeting`(인사 2~3줄: 날짜, 탐색 구간, 안내)도 씁니다.
6. 메일 만들기: `python3 scripts/build_email.py out/D` → `body.txt`, 그림 PDF, `mail.json`. "고칠 것"이 나오면 고치고 다시 실행합니다.
   Pillow가 없다는 오류가 나면 `pip install pillow` 후 다시 실행합니다.
7. 발송: `out/D/`의 `content.json`, `figures.json`, `pre_*.jpg`, PDF, `body.txt`, `mail.json`, `flash_window.json`을
   한 커밋으로 `main`에 푸시합니다. 커밋 메시지: `briefing: D`.
   푸시되면 GitHub Actions(`send-mail.yml`)가 Gmail로 메일을 보냅니다.
   - `main` 푸시가 거부되면 `briefing/D` 브랜치로 푸시합니다. 이 경우에도 메일은 발송됩니다.

## 주의

- 지어내지 않습니다. 확인 못 한 숫자·인용은 빼고, 소식이 없으면 없다고 씁니다.
- 본문·이미지에 작업 과정(접속 실패, 검색 과정 등)을 쓰지 않습니다.
- `out/` 아래에 `mail.json`을 커밋하면 메일이 실제로 나갑니다. 시험할 때는 `examples/`나 다른 폴더를 쓰세요.
