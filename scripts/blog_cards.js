const { chromium } = require('playwright');
const out = process.argv[2];
const css = `*{box-sizing:border-box;margin:0}body{width:1080px;background:#f6f7f9;font-family:'NanumGothic','Noto Sans CJK KR',sans-serif;color:#1d2330;padding:56px}
h1{font-size:44px;font-weight:800;margin-bottom:10px}.sub{font-size:24px;color:#5b6475;margin-bottom:36px}
.card{background:#fff;border-radius:18px;padding:30px 34px;margin-bottom:20px;box-shadow:0 2px 6px rgba(0,0,0,.06);display:flex;gap:26px;align-items:flex-start}
.tag{flex:none;width:150px;font-size:26px;font-weight:800;color:#76b900}.t{font-size:27px;line-height:1.55}.t b{color:#000}
.num{flex:none;width:64px;height:64px;border-radius:50%;background:#76b900;color:#fff;font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center}
.q{border-left:8px solid #76b900}.foot{font-size:19px;color:#8a92a3;margin-top:24px}`;
const pages = [
 ['pre-1.jpg', `<h1>무슨 일이 있었나</h1><div class=sub>엔비디아 젠슨 황 CEO 관련 보도 흐름</div>
 <div class=card><div class=tag>10월 말</div><div class=t>뉴욕타임스: 미 정보당국이 <b>메가스피드(싱가포르) 임원 앨리스 황</b>이 중국 측에 정보를 넘겼다고 판단, 황 CEO와 가까운 관계였다고 보도</div></div>
 <div class=card><div class=tag>반응</div><div class=t>엔비디아 "보도는 틀렸다, 칩 우회 의혹은 조사해 사실 아님 확인" · 중국 외교부 "근거 없는 중상"</div></div>
 <div class=card><div class=tag>11월 8일</div><div class=t>황 CEO, 임직원 서신으로 <b>불륜 인정·사과</b><br>이사회, 사외이사 위원회 중심 <b>독립 조사</b> 착수</div></div>
 <div class=card><div class=tag>다음</div><div class=t>미 의회가 18일로 제안한 황 CEO 비공개 설명(국내 보도)</div></div>
 <div class=foot>자료: 뉴욕타임스·블룸버그·CNBC·로이터·국내 언론 보도. 스파이 관련 내용은 확인되지 않은 의혹입니다.</div>`],
 ['pre-2.jpg', `<h1>서신의 핵심 내용</h1><div class=sub>11월 8일(현지시간) 임직원에게 보낸 서신 요약</div>
 <div class="card q"><div class=t><b>"아내에게 불충실했다"</b><br>아내와 자녀들에게 상처를 줬고, 변명의 여지가 없으며 깊이 사과한다</div></div>
 <div class="card q"><div class=t><b>모든 책임은 나에게</b><br>엔비디아를 이끄는 것은 인생 최대의 특권이지만, 임직원·이사회·주주에 대한 책임을 다하지 못했다</div></div>
 <div class="card q"><div class=t><b>조사에 전면 협조</b><br>이사회의 독립 조사를 지지하고 전면 협조하겠다</div></div>
 <div class="card"><div class=tag>빠진 것</div><div class=t>상대의 신원, 기밀 유출 의혹에 대한 해명은 서신에 직접 담기지 않음(로이터)</div></div>`],
 ['pre-3.jpg', `<h1>투자자가 볼 세 가지</h1><div class=sub>이사회: "국가 안보·기밀 유출 근거는 현재 없다" · CEO 직 유지</div>
 <div class=card><div class=num>1</div><div class=t><b>조사 결과</b><br>개인 문제로 끝나면 파장 제한적, 정보 유출·규정 위반이 나오면 다른 이야기</div></div>
 <div class=card><div class=num>2</div><div class=t><b>정치 리스크</b><br>칩 우회 의혹 업체와 얽혀 대중국 수출 규제 강화의 빌미가 될 수 있음</div></div>
 <div class=card><div class=num>3</div><div class=t><b>키맨 리스크</b><br>창업자 비중이 큰 회사라 리더십 공백 우려만으로도 변동성 확대</div></div>
 <div class=foot>투자 권유가 아닙니다.</div>`],
];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:800},deviceScaleFactor:1});
for(const [f,h] of pages){await p.setContent(`<html><head><style>${css}</style></head><body>${h}</body></html>`);await p.screenshot({path:out+'/'+f,fullPage:true,type:'jpeg',quality:90});}
await b.close();})();
