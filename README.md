# my-bot

매일 저녁 "개장 전 섹터별 이슈체크"를 만들어 이메일로 보내는 봇입니다.

- 작성: Claude 예약 작업이 매일 21시경 새 세션을 열어 `CLAUDE.md` 절차대로 소식을 모으고, 글과 인포그래픽(`pre_N.jpg`, 그림 PDF)을 만들어 `out/YYYY-MM-DD/`에 커밋합니다.
- 발송: `out/**/mail.json`이 푸시되면 GitHub Actions(`.github/workflows/send-mail.yml`)가 PDF를 첨부해 Gmail로 보냅니다.
- 글쓰기 규칙: `GUIDELINE_FOR_CLAUDE.md`

## 설정 (한 번만)

GitHub 저장소 Settings → Secrets and variables → Actions:

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `GMAIL_USER` | 보내는 Gmail 주소 |
| Secret | `GMAIL_APP_PASSWORD` | Gmail 앱 비밀번호 16자리 |
| Variable (선택) | `MAIL_TO` | 받는 주소(기본: yidiar80k@gmail.com) |

## 다시 보내기

Actions → "Send premarket briefing mail" → Run workflow → 날짜 입력.

## 파일

- `scripts/fetch_flash.py` 속보 JSON에서 탐색 구간만 추출
- `scripts/render.mjs` content.json → 인포그래픽 이미지
- `scripts/build_email.py` 메일 본문(body.txt)·발송 정보(mail.json) 생성
- `scripts/send_mail.py` Gmail SMTP 발송(Actions에서 실행)
- `examples/content.json` content.json 형식 예시

## 네이버 블로그 자동 올리기 (선택)

`out/**/mail.json`이 푸시되면 `.github/workflows/post-blog.yml`이 같은 본문·그림을 네이버 블로그에 올립니다(기본: 바로 발행).
네이버 공식 글쓰기 API가 없어(2020년 종료) 브라우저 조작 방식이며, 에디터 화면이 바뀌면 고쳐야 합니다.

| 종류 | 이름 | 값 |
|---|---|---|
| Secret | `NAVER_COOKIES` | 네이버 로그인 쿠키(Cookie-Editor 확장 → Export → JSON) |
| Variable | `NAVER_BLOG_ID` | 블로그 아이디 (blog.naver.com/아이디) |
| Variable (선택) | `NAVER_PUBLISH` | `0`이면 임시저장만, 없으면 바로 발행 |
| Secret | `SEEKING_ALPHA_COOKIES` | 시킹알파 로그인 쿠키(Cookie-Editor → Export → JSON). 확인: Actions → "Seeking Alpha cookie check" |

시험: Actions → "Post to Naver blog" → Run workflow → 폴더 입력. 실패하면 실행 결과의 `naver-screenshots`를 확인합니다.

## 미국장 마감 시황 (매 거래일 16:10 ET)

예약 작업이 `BRIEF_ROUTINE.md` 절차대로 시황을 쓰고(`brief_skill/SKILL.md` 문체), PDF를 `reports/<한국날짜>/`에 푸시하면
`send-mail.yml`이 메일로 보냅니다. 휴장일에는 아무것도 보내지 않습니다.
