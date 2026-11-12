import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = new URL('.', import.meta.url).pathname;
const css = `*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;background:#f4f5f8;font-family:'NanumGothic',sans-serif;color:#1d2433}
.hd{background:linear-gradient(135deg,#0b7285,#0a5a6a);color:#fff;padding:56px 60px 44px}
.tag{display:inline-block;background:rgba(255,255,255,.18);border-radius:30px;padding:8px 22px;font-size:28px;font-weight:700}
h1{font-size:62px;font-weight:800;line-height:1.25;margin-top:26px}.sub{font-size:30px;opacity:.85;margin-top:16px}
.wrap{padding:36px 40px 50px}.card{background:#fff;border-radius:26px;padding:36px 40px;margin-bottom:26px;box-shadow:0 2px 10px rgba(0,0,0,.05)}
.ct{font-size:36px;font-weight:800;border-left:8px solid #0b7285;padding-left:16px;margin-bottom:24px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.m{background:#f6f8fa;border-radius:18px;padding:24px 26px;border-top:6px solid #d6336c}
.m.dn{border-top-color:#1971c2}.ml{font-size:28px;color:#555;font-weight:700}.mv{font-size:50px;font-weight:800;color:#d6336c;margin-top:8px}.m.dn .mv{color:#1971c2}
.mn{font-size:26px;color:#777;margin-top:8px;line-height:1.4}
.row{display:flex;align-items:center;margin:18px 0}.rl{width:300px;font-size:30px;font-weight:700}.bar{height:54px;border-radius:12px;display:flex;align-items:center;justify-content:flex-end;padding-right:16px;color:#fff;font-size:28px;font-weight:800}
.li{font-size:32px;line-height:1.55;margin:12px 0;padding-left:34px;position:relative}.li:before{content:'';position:absolute;left:6px;top:20px;width:12px;height:12px;border-radius:50%;background:#0b7285}
.chips{display:flex;flex-wrap:wrap;gap:14px}.chip{background:#fdeef3;color:#d6336c;font-size:30px;font-weight:800;border-radius:14px;padding:12px 20px}
.src{font-size:24px;color:#999;margin-top:6px}`;
const page = (tag,title,sub,body)=>`<html><head><style>${css}</style></head><body><div class="hd"><span class="tag">${tag}</span><h1>${title}</h1><div class="sub">${sub}</div></div><div class="wrap">${body}</div></body></html>`;
const m=(l,v,n,dn)=>`<div class="m${dn?' dn':''}"><div class="ml">${l}</div><div class="mv">${v}</div><div class="mn">${n}</div></div>`;
const bar=(l,v,w,c)=>`<div class="row"><div class="rl">${l}</div><div class="bar" style="width:${w}px;background:${c}">${v}</div></div>`;
const figs=[
 page('기술주 어닝 · 네비우스','3분기, 이익까지 흑자 전환','2026년 11월 12일(미 동부) 장 시작 전 발표',
  `<div class="card"><div class="ct">핵심 숫자</div><div class="grid">
   ${m('3분기 매출','9.81억 달러','예상 9.19억 달러')}
   ${m('AI 클라우드 매출','9.74억 달러','전년 대비 +643%')}
   ${m('조정 EBITDA','4.66억 달러','예상 3.57억 달러')}
   ${m('조정 순이익','0.91억 달러','예상은 2.7억 달러 손실')}
  </div></div>
  <div class="card"><div class="ct">가격이 오르는 시장</div>
   <div class="li">GPU 시간당 가격 3분기 평균 20% 넘게 상승</div>
   <div class="li">단기 클러스터 가격은 예약 가격의 두 배 이상</div>
   <div class="li">잔여 계약(RPO) 387억 달러</div>
   <div class="src">출처: 회사 발표(월스트리트견문·시나 속보)</div></div>`),
 page('기술주 어닝 · 네비우스','2027년, 매출 4배 계획','올해와 내년 회사 전망 (단위: 억 달러)',
  `<div class="card"><div class="ct">연간 매출 전망</div>
   ${bar('2026년','30~34 하단',220,'#94a3b8')}${bar('2027년','120~130',700,'#0b7285')}
   <div class="mn" style="margin-top:14px">올해는 기존 범위의 하단, 내년은 4배 안팎</div></div>
  <div class="card"><div class="ct">돈은 어떻게 마련하나</div>
   <div class="li">2027년 설비투자 400억~450억 달러</div>
   <div class="li">그중 75~85%를 고객 선급금으로 충당</div>
   <div class="li">고객 선급금 약정: 올해 100억, 내년 170억~200억 달러</div>
   <div class="src">출처: 회사 발표(월스트리트견문·시나 속보)</div></div>`),
 page('기술주 어닝 · 네비우스','숫자는 좋았는데 주가는 반전','프리마켓 +5% → −6% (11/12 한국시간 21:27)',
  `<div class="card"><div class="ct">시장이 걸린 대목</div>
   <div class="li">올해 매출은 기존 30억~34억 달러 범위의 하단</div>
   <div class="li">외부에서 빌리는 용량 일부가 내년 상반기로 밀림</div>
   <div class="li">"ARR은 더 이상 적절한 지표가 아니다"며 지표 변경</div></div>
  <div class="card"><div class="ct">같은 날 분위기</div><div class="chips">
   <span class="chip" style="background:#e7f1fb;color:#1971c2">엔비디아 ▼7.7%</span><span class="chip" style="background:#e7f1fb;color:#1971c2">코어위브 ▼9.0%</span><span class="chip" style="background:#e7f1fb;color:#1971c2">네비우스 ▼6.1%</span></div>
   <div class="mn" style="margin-top:16px">엔비디아 CEO 거취 논란과 겹친 프리마켓</div>
   <div class="src">출처: 야후 파이낸스, 시나</div></div>`)
];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:800},deviceScaleFactor:1});
for(let i=0;i<figs.length;i++){await p.setContent(figs[i],{waitUntil:'networkidle'});await p.screenshot({path:`${out}pre-${i+1}.jpg`,fullPage:true,type:'jpeg',quality:90});}
await b.close();console.log('ok',figs.length);
