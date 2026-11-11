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
 page('기술주 어닝 · 코어위브','3분기, 모두 예상을 넘었다','2026년 11월 10일(미 동부) 장 마감 후 발표',
  `<div class="card"><div class="ct">핵심 숫자</div><div class="grid">
   ${m('3분기 매출','36.6억 달러','예상 약 35.5억 달러 · 전년 대비 +168%')}
   ${m('조정 영업이익','3.79억 달러','회사 가이던스 2.0억~2.6억 달러')}
   ${m('수주잔고','1,325억 달러','6월 말 1,042억 달러')}
   ${m('2026년 매출 가이던스','130~133억 달러','상향 · 연말 연환산 200억~210억 달러')}
  </div></div>
  <div class="card"><div class="ct">시장 반응 (11/11 종가)</div><div class="chips">
   <span class="chip">코어위브 ▲24.71%</span><span class="chip">네비우스 ▲15.44%</span><span class="chip">블룸에너지 ▲12.99%</span><span class="chip">마이크론 ▲11.89%</span><span class="chip">델 ▲11.77%</span><span class="chip">반도체지수 ▲5.66%</span></div>
   <div class="src" style="margin-top:18px">출처: CNBC, 회사 발표, 야후 파이낸스</div></div>`),
 page('기술주 어닝 · 코어위브','숫자로 본 성장 속도','매출과 수주잔고 (단위: 억 달러)',
  `<div class="card"><div class="ct">분기 매출</div>
   ${bar('작년 3분기','13.7',260,'#94a3b8')}${bar('올해 3분기','36.6',700,'#0b7285')}
   <div class="mn" style="margin-top:14px">1년 만에 약 2.7배</div></div>
  <div class="card"><div class="ct">수주잔고</div>
   ${bar('6월 말','1,042',550,'#94a3b8')}${bar('9월 말','1,325',700,'#0b7285')}
   <div class="mn" style="margin-top:14px">한 분기 만에 280억 달러 넘게 증가</div></div>
  <div class="card"><div class="ct">2026년 연간 전망</div>
   <div class="li">매출 130억~133억 달러로 상향</div><div class="li">조정 영업이익 12.75억~13.75억 달러</div><div class="li">설비투자 370억~390억 달러(하단 상향)</div>
   <div class="src">출처: CNBC, 회사 발표</div></div>`),
 page('기술주 어닝 · 코어위브','남은 숙제는 돈 빌리는 비용','실적은 좋았지만 이자 부담은 그대로',
  `<div class="card"><div class="ct">이자와 이익 (3분기)</div><div class="grid">
   ${m('순이자비용','8.46억 달러','전년 대비 +173%',true)}
   ${m('GAAP 영업이익','2.07억 달러','이자비용보다 작음',true)}
   ${m('3분기 설비투자','145억 달러','한 분기 기준',true)}
   ${m('GAAP 순손실','7.09억 달러','전년 1.10억 달러 손실',true)}
  </div></div>
  <div class="card"><div class="ct">회사가 내놓은 답</div>
   <div class="li">"구축 계획의 지연이나 변경은 없다"</div>
   <div class="li">무담보 회사채 대신 칩 담보 대출(금리 7~7.5%)</div>
   <div class="li">3개월 안에 고객 선급금 약 90억 달러 유입 예상</div>
   <div class="src">출처: CNBC, 팁랭크스, 회사 실적 발표</div></div>`),
 page('기술주 어닝 · 코어위브','증권가 반응은 엇갈렸다','실적 호평, 목표가는 제각각',
  `<div class="card"><div class="ct">목표가 변화</div>
   <div class="li">씨티: 128 → 149달러, 매수 유지</div>
   <div class="li">BofA: 매수·140달러 유지</div>
   <div class="li">제프리스: "실적은 좋았다"면서도 150 → 90달러로 하향</div></div>
  <div class="card"><div class="ct">앞으로 볼 것</div>
   <div class="li">회사채 금리(최근 16% 안팎)와 CDS가 실제로 내려오는지</div>
   <div class="li">11/12 네비우스 실적이 같은 흐름을 이어 가는지</div>
   <div class="li">11/17 엔비디아 실적과 하이퍼스케일러 계약 변화</div>
   <div class="src">출처: CNBC, 마켓비트</div></div>`)
];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:800},deviceScaleFactor:1});
for(let i=0;i<figs.length;i++){await p.setContent(figs[i],{waitUntil:'networkidle'});await p.screenshot({path:`${out}pre-${i+1}.jpg`,fullPage:true,type:'jpeg',quality:90});}
await b.close();console.log('ok',figs.length);
