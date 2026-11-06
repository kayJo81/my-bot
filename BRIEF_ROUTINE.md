# 미국장 마감 시황 루틴 (매 거래일 16:10 ET)

예약 작업이 이 저장소 세션에서 실행합니다. 글쓰기 규칙은 `brief_skill/SKILL.md`(조경상 스타일 시황 스킬)를 그대로 따릅니다.
이 파일은 실행 절차만 정합니다. 결과는 PDF로 만들어 `reports/<한국날짜>/`에 푸시하면 GitHub Actions가 메일을 보냅니다.

## 절차

1. 준비
   - `git fetch origin main && git checkout main && git reset --hard origin/main`
   - 미국 날짜 `US` = 오늘(미 동부), 한국 날짜 `D` = US + 1일. 작업 폴더 `reports/D/`.
   - `reports/D/mail.json`이 이미 있으면 이미 보낸 것이므로 끝냅니다.
   - 글꼴: `fc-list | grep -i NanumGothic` 없으면 `apt-get install -y fonts-nanum`.
2. 데이터: `python3 scripts/fetch_us_close.py reports/D`
   - 종료 코드 3이면 휴장이므로 아무것도 하지 말고 조용히 끝냅니다(메일·푸시 없음).
   - `close_table.txt`(지수·금리·달러·유가·코인·워치리스트 종가와 주간 등락), `flash_us.txt`(미국장 시간대 속보)를 씁니다.
   - 4대 지수는 Yahoo 값이 공식 종가와 소수점이 다를 수 있습니다. WebSearch로 CNBC·WSJ·로이터 등의 마감 수치를 확인해 공식 값을 씁니다.
     특히 러셀 2000과 10년물(소수점 셋째 자리, bp)을 확인합니다.
3. 전날 맥락: `reports/` 아래 가장 최근 `brief.txt`(직전 시황)를 읽고, 전날 논리가 오늘 가격으로 확인됐는지 반박됐는지 짚을 준비를 합니다(스킬 8절).
4. 사유 조사: 서브에이전트 4개를 병렬로 돌립니다(각자 WebSearch + flash_us.txt grep, 지어내지 않기, 이전 재료는 [배경] 표시).
   - A 매크로·장중 흐름·주간 정리·정계·크립토
     (반드시 확인: 경제지표, 연준 발언, 금리 2y/10y, 달러, 유가·지정학, 아시아 증시와 당국 조치,
      수급(레버리지 ETF·CTA·개인 매매·패닉 지표), 신용(하이퍼스케일러 CDS·회사채 스프레드·AI 자금조달), S&P 내 실적 급등락 종목)
   - B 대형 기술주 + 반도체(스토리지·팹리스·파운드리&IDM·아날로그·장비)
   - C 인프라(네오클라우드·서버·네트워킹·냉각전력·광통신·에너지원자력, 전력 유틸리티 VST·CEG 포함)
   - D 소프트웨어·모빌리티·우주·크립토 관련주, 기타 기술주 이슈, 다음 일정
   - 각 에이전트에 `close_table.txt`의 해당 종목 등락률과 `flash_us.txt` 경로를 넘기고, 종목별 `등락률 | 사유 | 출처 | 확신도`로 받습니다.
5. 작성: `brief_skill/SKILL.md` 1~9절대로 `reports/D/brief.txt`를 씁니다.
   - 첫 줄 `# M월 D일 시장 동향`, 헤더 4대 지수(공식 종가), 사실형 한 줄 제목.
   - 종목 문장은 [종목]+[사유]+[등락률]. 사유를 못 찾은 소형 종목은 빼거나 그룹 한 문장.
   - 금요일이면 주간 정리(지수·SOX·금리 주간 변화, 주간 낙폭 상위 등).
   - 9절 체크리스트를 확인합니다("~다" 종결, 볼드, 괄호 등락률, 부정형 문장 없음).
6. PDF와 메일
   - `node scripts/brief_pdf.mjs reports/D/brief.txt "reports/D/시장동향_D.pdf" "미국 US 마감 기준"`
   - PDF 첫 쪽을 이미지로 확인(`pdftoppm -r 45 -png -f 1 -l 1 ...`)해 글자 깨짐이 없는지 봅니다.
   - `reports/D/body.txt`: 한 줄 제목과 시장 대응 결론 2~3줄.
   - `reports/D/mail.json`:
     `{"subject": "[시장 동향] YYYY년 M월 D일", "to": "yidiar80k@gmail.com", "body_file": "body.txt", "attachments": ["시장동향_D.pdf"]}`
7. `reports/D/`의 brief.txt, PDF, body.txt, mail.json, close_table.txt를 한 커밋(`brief: D`)으로 main에 푸시합니다.
   푸시되면 `send-mail.yml`이 메일을 보냅니다.

## 주의

- 수치·사유를 지어내지 않습니다. 확인 못 한 것은 본문에서 빼고, 마지막 보고에 '확인 필요'로 적습니다.
- 본문에 작업 과정(검색 실패 등)이나 출처 표기를 쓰지 않습니다.
- 미래에셋증권 김영건 애널리스트 견해는 인용하지 않습니다.
