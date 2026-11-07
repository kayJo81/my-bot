// 데이터센터 정치·고용 인포그래픽 4장 (1080px, JPG)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 4;
const TAG = "@kayjo81 · 데이터센터 규제와 블루칼라 고용";

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;background:#eef1f6;font-family:'NanumSquare_ac','NanumSquare','NanumGothic',sans-serif;color:#1f2430;word-break:keep-all;letter-spacing:-0.4px}
.hd{background:linear-gradient(120deg,#1b3f8f 0%,#127a86 100%);color:#fff;padding:44px 56px 120px}
.top{display:flex;justify-content:space-between;align-items:center}
.pill{background:rgba(255,255,255,.18);border-radius:30px;padding:8px 20px;font-size:24px;font-weight:700}
.date{font-size:26px;font-weight:700}
.eng{margin-top:38px;font-size:24px;letter-spacing:2px;opacity:.85;font-weight:700}
h1{font-size:58px;font-weight:800;line-height:1.25;margin-top:8px}
.sub{font-size:28px;opacity:.9;margin-top:14px;line-height:1.45}
.card{background:#fff;border-radius:28px;margin:-80px 36px 0;padding:40px 40px 36px;box-shadow:0 6px 24px rgba(20,40,80,.08)}
.card+.card{margin-top:24px}
h2{font-size:32px;font-weight:800;border-left:7px solid #127a86;padding-left:16px;margin-bottom:24px}
.ft{display:flex;justify-content:space-between;color:#9aa1ad;font-size:22px;padding:28px 48px 34px}
.row{display:flex;gap:20px;align-items:flex-start;margin-bottom:24px}
.num{flex:none;width:46px;height:46px;border-radius:50%;background:#1b3f8f;color:#fff;font-weight:800;font-size:24px;display:flex;align-items:center;justify-content:center;margin-top:2px}
.rt{font-size:30px;line-height:1.45}.rt b{font-weight:800}.rt .m{color:#5b6372}
.flow{display:flex;gap:12px;margin-top:6px}
.st{flex:1;background:#f2f6fb;border-radius:18px;padding:20px 18px}
.st .k{font-size:22px;color:#127a86;font-weight:800}.st .v{font-size:26px;font-weight:800;margin-top:6px;line-height:1.35}.st .d{font-size:22px;color:#5b6372;margin-top:6px;line-height:1.4}
table{width:100%;border-collapse:collapse;font-size:26px}
th{font-size:22px;color:#5b6372;font-weight:700;text-align:left;padding:10px 10px;border-bottom:2px solid #dfe4ec}
td{padding:16px 10px;border-bottom:1px solid #eef1f6;vertical-align:top;line-height:1.4}
.q{font-size:25px;line-height:1.45}.q .who{font-weight:800}
.chip{display:inline-block;border-radius:10px;padding:3px 12px;font-size:22px;font-weight:800}
.cd{background:#e3ecfa;color:#1b3f8f}.cr{background:#fbe7e0;color:#a33a14}.cn{background:#eceef2;color:#5b6372}
.ok{color:#127a86;font-weight:800}.no{color:#a33a14;font-weight:800}
.bars{margin-top:4px}
.bar{display:grid;grid-template-columns:300px 1fr;align-items:center;margin-bottom:16px}
.bl{font-size:26px;font-weight:700;line-height:1.3}.bl small{display:block;font-size:20px;color:#5b6372;font-weight:400}
.track{position:relative;height:44px}
.zero{position:absolute;top:-6px;bottom:-6px;width:2px;background:#b9c0cb}
.fill{position:absolute;top:6px;height:32px;border-radius:4px}
.val{position:absolute;top:6px;font-size:24px;font-weight:800;line-height:32px;white-space:nowrap}
.note{font-size:21px;color:#7a8291;margin-top:10px;line-height:1.5}
.callout{background:#f2f6fb;border-radius:16px;padding:18px 22px;font-size:26px;line-height:1.5;margin-top:14px}
.callout b{font-weight:800;color:#1b3f8f}
.three{display:flex;gap:14px}
.three>div{flex:1;border-radius:18px;padding:20px 18px}
.three .t{font-size:24px;font-weight:800}.three .b{font-size:23px;line-height:1.45;margin-top:8px}
ol.chk{list-style:none;counter-reset:c}
ol.chk li{counter-increment:c;font-size:26px;line-height:1.45;padding-left:52px;position:relative;margin-bottom:14px}
ol.chk li::before{content:counter(c);position:absolute;left:0;top:2px;width:36px;height:36px;border-radius:50%;background:#127a86;color:#fff;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center}
`;

const page = (n, eng, title, sub, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="hd"><div class="top"><span class="pill">투자 노트</span><span class="date">2026.11.07</span></div>
<div class="eng">${eng}</div><h1>${title}</h1><div class="sub">${sub}</div></div>
${body}
<div class="ft"><span>${TAG}</span><span>${n} / ${TOTAL}</span></div></body></html>`;

// 막대: [라벨, 보조, 값, 색]
function bars(rows, min, max, unit, fmt) {
  const span = max - min, zx = (-min / span) * 100;
  return `<div class="bars">${rows.map(([l, s, v, c]) => {
    const x0 = v >= 0 ? zx : zx + (v / span) * 100, w = Math.abs(v / span) * 100;
    const lab = fmt(v) + unit;
    const vpos = v >= 0 ? `left:calc(${zx + w}% + 12px)` : `right:calc(${100 - x0}% + 12px)`;
    return `<div class="bar"><div class="bl">${l}${s ? `<small>${s}</small>` : ""}</div><div class="track">
<div class="zero" style="left:${zx}%"></div><div class="fill" style="left:${x0}%;width:${w}%;background:${c}"></div>
<div class="val" style="${vpos}">${lab}</div></div></div>`;
  }).join("")}</div>`;
}
const BLUE = "#1d5fa8", RED = "#c8552b", GRAY = "#9aa3ae";

const P1 = page(1, "SUMMARY", "데이터센터 규제,<br>'금지'가 아니라 '조건부 수용'", "1~2년 지연을 거쳐, 조건을 붙여 다시 짓는 쪽으로", `
<div class="card"><h2>세 가지 근거</h2>
<div class="row"><div class="num">1</div><div class="rt"><b>말투가 바뀌었다</b><br><span class="m">당선 뒤 '반대'에서 '협상'으로. "데이터센터가 싫은 게 아니다"</span></div></div>
<div class="row"><div class="num">2</div><div class="rt"><b>주지사 혼자서는 법을 못 바꾼다</b><br><span class="m">텍사스·오하이오 주 상원은 공화당. 혼자 할 수 있는 건 '지연'</span></div></div>
<div class="row" style="margin-bottom:6px"><div class="num">3</div><div class="rt"><b>막으면 지지층 일자리가 줄어든다</b><br><span class="m">블루칼라 일자리 증가의 약 80%가 AI·전력 인프라 건설과 부품 제조</span></div></div>
</div>
<div class="card"><h2>예상 경로</h2>
<div class="flow">
<div class="st"><div class="k">2026말~27상</div><div class="v">신규 허가 지연</div><div class="d">텍사스·오하이오 착공 공백, 주가 변동</div></div>
<div class="st"><div class="k">2027 주의회</div><div class="v">타협안</div><div class="d">세금 혜택 축소, 전력 비용·노조 조건</div></div>
<div class="st"><div class="k">2027하 이후</div><div class="v">조건부 재착공</div><div class="d">조건 맞춘 프로젝트부터</div></div>
</div></div>`);

const P2 = page(2, "EVIDENCE 1 · 2", "말은 부드러워졌고,<br>권한은 제한적이다", "당선 뒤 발언 변화와 주의회 구성", `
<div class="card"><h2>근거 1. 당선 뒤 말투</h2>
<table><tr><th style="width:24%"></th><th style="width:34%">선거 전</th><th>당선 뒤</th></tr>
<tr><td class="q"><span class="who">이노호사</span><br><span class="m" style="color:#5b6372">텍사스 주지사</span></td><td class="q">"모든 데이터센터 승인을 금지하겠다"</td><td class="q">"데이터센터가 싫은 게 아니다", "텍사스 사람들에게 이익이 되는 협력이어야"</td></tr>
<tr><td class="q"><span class="who">액턴</span><br><span style="color:#5b6372">오하이오 주지사</span></td><td class="q">조건부 모라토리엄</td><td class="q">"사업에는 열려 있지만, 팔려 가지는 않는다"</td></tr></table>
<div class="callout">모라토리엄 약속은 유지, 표현은 <b>'조건만 맞으면 받아들인다'</b>로 이동</div></div>
<div class="card"><h2>근거 2. 주의회 구성 (잠정)</h2>
<table><tr><th>주</th><th>주지사</th><th>주 하원</th><th>주 상원</th><th>법 개정</th></tr>
<tr><td><b>텍사스</b></td><td><span class="chip cd">민주</span></td><td><span class="chip cd">민주</span></td><td><span class="chip cr">공화</span></td><td class="no">어려움</td></tr>
<tr><td><b>오하이오</b></td><td><span class="chip cd">민주</span></td><td><span class="chip cr">공화</span></td><td><span class="chip cr">공화 2/3↑</span></td><td class="no">어려움</td></tr>
<tr><td><b>조지아</b></td><td><span class="chip cd">민주</span></td><td><span class="chip cn">미확정</span></td><td><span class="chip cn">미확정</span></td><td style="color:#5b6372;font-weight:800">미확정</td></tr>
<tr><td><b>위스콘신</b></td><td><span class="chip cd">민주</span></td><td><span class="chip cd">민주</span></td><td><span class="chip cd">민주</span></td><td class="ok">가능</td></tr></table>
<div class="callout">주지사 혼자 할 수 있는 건 허가 지연과 거부권. <b>법을 바꾸는 '금지'는 의회를 넘어야</b> 한다</div></div>`);

const P3 = page(3, "EVIDENCE 3", "블루칼라 일자리,<br>AI·전력 인프라가 끌었다", "미국 재화생산(건설+제조+광업) 고용, 2026년 5~10월", `
<div class="card"><h2>6개월 일자리 증감 (블루칼라 합계 +13.4만)</h2>
${bars([
  ["비주거 건설", "건물·송전/토목·전기/배관 공사", 8.1, BLUE],
  ["그 외 제조", "", 5.7, BLUE],
  ["전자·전기장비 제조", "반도체 포함, 변압기·배전반", 2.7, BLUE],
  ["광업", "", -0.3, RED],
  ["주거(주택) 건설", "", -2.8, RED],
], -4, 11, "만", v => (v > 0 ? "+" : "") + v.toFixed(1))}
<div class="callout">비주거 건설 + 전자·전기장비 제조 = <b>+10.8만, 블루칼라 증가의 약 80%</b></div></div>
<div class="card"><h2>1년 고용 증가율</h2>
${bars([
  ["전기공사업", "9월 기준", 4.4, BLUE],
  ["전기장비 제조", "", 4.3, BLUE],
  ["비주거 건물 건설", "", 3.7, BLUE],
  ["비주거 전문공사", "전기·배관 등", 3.6, BLUE],
  ["전체 고용", "비농업", 0.6, GRAY],
], 0, 5.4, "%", v => "+" + v.toFixed(1))}
<div class="note">자료: 미 노동통계국(BLS) CES, 계절조정. 9~10월은 잠정치. 비주거 건설에는 반도체·배터리 공장, 송전망, 창고도 포함되어 데이터센터만의 수치는 아님.</div></div>`);

const P4 = page(4, "RISKS & CHECKLIST", "결국 받아들여도,<br>지연은 비용이다", "반론, 투자 시사점, 확인할 지표", `
<div class="card"><h2>반론과 한계</h2>
<table>
<tr><td style="width:44%"><b>주민투표 41건 중 40건 반대</b></td><td class="q">반대의 핵심은 전기요금·지역 결정권. 조건으로 흡수 가능하지만 지역 단위 거부는 계속</td></tr>
<tr><td><b>위스콘신은 법 개정 가능</b></td><td class="q">맞다. 실제 규제 리스크가 있는 예외 주</td></tr>
<tr><td><b>AI가 사무직을 줄인다</b></td><td class="q">데이터센터·호스팅 고용 1년 -5.4%, 정보 업종 -4.2%. 이 논리의 가장 큰 약점</td></tr>
</table></div>
<div class="card"><h2>투자 시사점</h2>
<div class="three">
<div style="background:#fbe7e0"><div class="t" style="color:#a33a14">부담</div><div class="b">텍사스·오하이오 비중 큰 네오클라우드·채굴 전환 기업. 1~2년 지연 리스크</div></div>
<div style="background:#e3ecfa"><div class="t" style="color:#1b3f8f">상대적 안전</div><div class="b">하이퍼스케일러. 이미 전력 비용 부담 약속, 다른 주로 이동 여력</div></div>
<div style="background:#dff1ef"><div class="t" style="color:#127a86">수요 유지</div><div class="b">전기공사·전기장비. 지역이 바뀌어도 수요는 남음</div></div>
</div></div>
<div class="card"><h2>확인할 지표</h2>
<ol class="chk">
<li>보텀스 조지아 주지사 당선자의 취임 준비 계획</li>
<li>애벗 현 텍사스 주지사가 취임 전에 미리 멈출지</li>
<li>1월 텍사스 주의회: 세금 혜택·지역 승인권 법안과 공화당 상원</li>
<li>위스콘신의 첫 데이터센터 법안</li>
<li>12월 초 고용보고서: 비주거 전문공사·전기공사·전기장비</li>
</ol></div>`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [i, html] of [P1, P2, P3, P4].entries()) {
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 1}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
