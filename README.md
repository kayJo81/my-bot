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
