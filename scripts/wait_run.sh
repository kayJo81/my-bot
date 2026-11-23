#!/usr/bin/env bash
# 사용법: scripts/wait_run.sh <workflow파일> [grep패턴]
# 가장 최근 실행이 끝날 때까지 기다린 뒤, 결론과 로그에서 패턴에 맞는 줄을 출력한다(공개 저장소 API 사용).
# 예) scripts/wait_run.sh post-blog.yml "제목:|발행을 눌렀습니다"   /   scripts/wait_run.sh fetch-text.yml ""
set -euo pipefail
WF=$1; PAT=${2:-}
API=https://api.github.com/repos/kayJo81/my-bot/actions
sleep 6
R=$(curl -s "$API/workflows/$WF/runs?per_page=1" | python3 -c "import sys,json;print(json.load(sys.stdin)['workflow_runs'][0]['id'])")
until s=$(curl -s -m 20 "$API/runs/$R" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('status'),d.get('conclusion'))"); [[ "$s" == completed* ]]; do sleep 10; done
echo "run $R: $s"
J=$(curl -s "$API/runs/$R/jobs" | python3 -c "import sys,json;print(json.load(sys.stdin)['jobs'][0]['id'])")
if [ -n "$PAT" ]; then curl -sL "$API/jobs/$J/logs" | grep -E "$PAT" | cut -c30-
else curl -sL "$API/jobs/$J/logs" | sed -n '/=====/,$p' | cut -c30- | grep -v '^\[command\]\|git config\|Node.js 20\|^\s*$'; fi
