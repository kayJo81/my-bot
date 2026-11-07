// 데이터센터 정치·고용 인포그래픽 4장 (1080px, JPG)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 4;
const TAG = "@kayjo81 · 미국 데이터센터 주민투표 결과";

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

// ---------- 투표 결과 전용 ----------
const css2 = `
.vt{width:100%;border-collapse:collapse}
.vt th{font-size:20px;color:#5b6372;font-weight:700;text-align:left;padding:8px 6px;border-bottom:2px solid #dfe4ec}
.vt td{font-size:21px;padding:11px 6px;border-bottom:1px solid #eef1f6;vertical-align:top;line-height:1.38}
.vt td.loc{font-weight:800;font-size:22px;white-space:nowrap}
.vt td.loc small{display:block;font-weight:400;font-size:17px;color:#7a8291}
.vt td.res{white-space:nowrap;font-weight:800}
.lim{color:#1b3f8f}.sup{color:#a33a14}
.anti{display:inline-block;min-width:56px;text-align:center;border-radius:8px;padding:2px 8px;font-weight:800;font-size:20px;color:#fff}
.vt td.iss{color:#3b4250}
.kpis{display:flex;gap:14px}.kpi{flex:1;background:#f2f6fb;border-radius:18px;padding:20px;text-align:center}
.kpi .n{font-size:52px;font-weight:800;color:#1b3f8f}.kpi .l{font-size:22px;color:#5b6372;margin-top:4px;line-height:1.35}
`;
const page2 = (n, eng, title, sub, body) => page(n, eng, title, sub, body).replace("</style>", css2 + "</style>");
const shade = (p) => p >= 80 ? "#1b3f8f" : p >= 70 ? "#2f62b0" : p >= 60 ? "#5a86c6" : p >= 50 ? "#8eaedb" : "#c8552b";
const pill = (p) => `<span class="anti" style="background:${shade(p)}">${p}%</span>`;
// [지역, 소지역, 안건, 결과문구, 막는쪽%, 쟁점]
const table = (rows) => `<table class="vt"><tr><th style="width:17%">지역</th><th style="width:22%">안건</th><th style="width:14%">결과</th><th style="width:9%">반대 쪽</th><th>쟁점</th></tr>
${rows.map(([l, s, m, r, a, i]) => `<tr><td class="loc">${l}<small>${s}</small></td><td>${m}</td><td class="res">${r}</td><td>${pill(a)}</td><td class="iss">${i}</td></tr>`).join("")}</table>`;

const P1 = page2(1, "SUMMARY", "41곳 중 40곳,<br>데이터센터에 '노'", "2026년 11월 3일 미국 지역 주민투표 결과 (비공식)", `
<div class="card"><div class="kpis">
<div class="kpi"><div class="n">41</div><div class="l">투표 건수<br>(10개 주)</div></div>
<div class="kpi"><div class="n">40</div><div class="l">데이터센터를<br>막는 쪽 승리</div></div>
<div class="kpi"><div class="n">73%</div><div class="l">막는 쪽<br>평균 득표율</div></div></div></div>
<div class="card"><h2>주별 투표 건수</h2>
${bars([["오하이오", "", 21, BLUE], ["일리노이", "모두 권고 투표", 7, BLUE], ["메인", "", 4, BLUE], ["캔자스", "", 3, BLUE], ["캘리포니아·플로리다·뉴저지", "각 1건", 3, BLUE], ["네바다·위스콘신·노스다코타", "각 1건", 3, BLUE]], 0, 24, "건", v => v)}
</div>
<div class="card"><h2>안건 종류</h2>
<table class="vt"><tr><th>막는 쪽 안건이 가결된 27건</th><th>돕는 쪽 안건이 부결된 13건</th></tr>
<tr><td>전면 금지 5 · 부분 금지(25MW 초과 등) 12 · 모라토리엄 3 · 용도지역제 2 · 반대 권고 2 · 주민투표 의무화 2 · 재정 보증 1</td>
<td>지지 권고 7 · 산업용지 용도변경 4 · 특정 부지 허용 1 · 개발 협상안 1</td></tr></table>
<div class="note">예외 1건: 노스다코타 하우드는 산업개발 추가 심사 안이 75% 반대로 부결. 자료: Ballotpedia, The GridSight(11/6 기준 비공식, 반올림)</div></div>`);

const OH = [
  ["그랜빌", "리킹 카운티", "데이터센터 금지", "가결 82:18", 82, "특정 계획 없는 예방 조치. 데이터센터가 몰린 리킹 카운티의 전기요금 우려"],
  ["애시빌", "피커웨이 카운티", "EdgeConneX 협상안 유지", "부결 18:82", 82, "EdgeConneX 데이터센터 2동 + 전용 가스발전소. 주 대법원 판결로 투표"],
  ["페리", "레이크 카운티", "세제혜택 시 재정 보증", "가결 87:13", 87, "Province Group 230에이커 캠퍼스 계획, 시장 비밀유지계약 논란"],
  ["먼로빌", "휴런 카운티", "허용 권고", "부결 13:87", 87, "100MW 'Project Eagle Ridge'(약 10억 달러)"],
  ["트렌턴", "버틀러 카운티", "25MW 초과 제한", "가결 80:20", 80, "아마존(AWS) 약 600에이커 계획. 주 대법원이 투표 회부 명령"],
  ["윌밍턴(4건)", "클린턴 카운티", "산업용지 용도변경 유지", "부결 약 20:80", 80, "약 545에이커 용도변경. AWS 캠퍼스와는 별개 사업"],
  ["선버리", "델라웨어 카운티", "25MW 초과 금지", "가결 79:21", 79, "아마존 약 20억 달러 데이터센터 계획 제출 상태"],
  ["허버드", "트럼불 카운티", "시내 금지", "가결 77:23", 77, "시장의 'Project Milo' 비밀유지계약(Crane Data Centers)"],
  ["어퍼샌더스키", "와이언도트 카운티", "금지(헌장)", "가결 77:23", 77, "데이터센터 + 150MW 가스발전소, 약 9억 달러 계획"],
  ["어바나", "샴페인 카운티", "금지(헌장)", "가결 77:23", 77, "Thor Equities 약 10억 달러 계획. 습지·대수층 우려, 개발사가 시를 소송"],
  ["파타스칼라", "리킹 카운티", "대형 금지", "가결 74:26", 74, "Aligned 200MW 계획을 시의회가 거부, 개발사가 법원 심사 청구"],
  ["피쿼", "마이애미 카운티", "금지(헌장)", "가결 67:33", 67, "메타 607에이커 캠퍼스 이미 승인. 금지 적용 여부 불확실"],
  ["코노트", "애슈터뷸라 카운티", "25MW 초과 금지", "가결 65:35", 65, "산업단지에서 개발사 타당성 조사 중"],
  ["디파이언스", "디파이언스 카운티", "25MW 초과 금지", "가결 65:35", 65, "카운티에 기술기업 문의가 들어온 것이 계기"],
  ["오리건", "루커스 카운티", "25MW 초과 금지", "가결 60:40", 60, "Vantage 데이터센터 3개 동 계획(약 170에이커)"],
  ["먼로 타운십", "애덤스 카운티", "용도지역제 도입", "가결 60:40", 60, "옛 발전소 부지 데이터센터 계획이 거론됨"],
  ["그로브시티", "프랭클린 카운티", "대형 개발 주민투표 의무화", "가결 55:45", 55, "약 300에이커 캠퍼스 계획(토지 편입 필요)"],
  ["스프리그 타운십", "애덤스 카운티", "용도지역제 도입", "가결 53:47", 53, "AWS가 옛 발전소 인근 약 1,000에이커 검토(최대 1.3GW)"],
];
const P2 = page2(2, "OHIO · 21", "오하이오: 계획이 들어오자<br>주민이 막았다", "21건 모두 막는 쪽 승리 · 25MW 초과 금지가 주된 방식", `
<div class="card">${table(OH)}
<div class="note">'반대 쪽'은 데이터센터를 막는 쪽의 득표율. 25MW 초과 금지안 상당수는 서명 부족으로 2026년 주 투표에 못 오른 주 헌법 개정안(Conserve Ohio)을 지역판으로 옮긴 것.</div></div>`);

const OT = [
  ["모건 카운티", "일리노이", "제한 권고", "가결 88:12", 88, "인근 카운티 데이터센터 제안이 계기. 카운티에 용도지역 조례 없음"],
  ["슈토 등 4개 타운십", "일리노이 매디슨", "허용 권고", "부결 17~26:74~83", 74, "그래닛시티 일대 부지 제안, 항만청 부지 매각 논란"],
  ["졸리엣 타운십", "일리노이 윌", "AI 데이터센터 승인 권고", "부결 21:79", 79, "200억 달러 'Joliet Technology Center'(795에이커) 시의회 승인 후"],
  ["블루밍턴", "일리노이 매클레인", "모라토리엄 권고", "가결 78:22", 78, "하이퍼스케일 부지 소문, 시의 6개월 모라토리엄"],
  ["앨햄브라", "캘리포니아", "시내 금지", "가결 83:17", 83, "이웃 몬터레이파크 금지가 자극. 특정 계획은 확인 안 됨"],
  ["에지워터", "플로리다", "금지(헌장)", "가결 77:23", 77, "제안 없음. 물·전력 부담 이유로 시의회 금지를 헌장에 고정"],
  ["오타와", "캔자스", "25MW 초과 금지", "가결 72:28", 72, "시 남단 300에이커 기술 캠퍼스. 법원 판단 남음"],
  ["엘도라도", "캔자스", "고영향 시설·배터리저장소 금지", "가결 71:29", 71, "시와 개발사의 비밀 논의가 정보공개로 드러남"],
  ["엠포리아", "캔자스", "고영향 시설 금지", "가결 60:40", 60, "1,000에이커 기가와트급 'Flint Hills Digital Campus'. 법원 판단 남음"],
  ["웰스", "메인", "180일 모라토리엄", "가결 82:18", 82, "주지사 거부권으로 주 모라토리엄 무산 → 마을별 대응"],
  ["노스버윅", "메인", "2,300㎡ 이상 금지", "가결 78:22", 78, "이웃 샌퍼드 1,000에이커 단지 제안에 선제 대응"],
  ["페루", "메인", "180일 모라토리엄", "가결 76:24", 76, "제안 없음. 물·전력망·소음 검토용"],
  ["위스카셋", "메인", "6개월 모라토리엄", "가결 66:34", 66, "타운 소유지 50억 달러 구상, 비밀유지계약 논란"],
  ["다운 타운십", "뉴저지", "지지 권고", "부결 13:87", 87, "인근 바인랜드 데이터센터의 소음·무허가 발전기 논란"],
  ["볼더시티", "네바다", "특정 부지 허용", "부결 29:71", 71, "시 소유 태양광 부지에 150~170MW AI 데이터센터 제안"],
  ["제인스빌", "위스콘신", "옛 GM 부지 개발 주민투표", "가결 62:38", 62, "800MW·약 80억 달러 캠퍼스 제안(이후 시가 종료)"],
  ["하우드", "노스다코타", "산업개발 추가 심사", "부결 25:75", 25, "Applied Digital 200MW 'Polaris Forge 2' 공사 중. 유일한 예외"],
];
const P3 = page2(3, "OTHER STATES · 20", "다른 9개 주:<br>예방형 금지가 많았다", "구체적 계획 없이 미리 막은 곳도 상당수", `
<div class="card">${table(OT)}
<div class="note">일리노이 7건은 모두 구속력 없는 권고 투표. 매디슨 카운티 4개 타운십은 한 줄로 묶음(막는 쪽 74~83%). 캔자스 엠포리아·오타와는 주민발의의 법적 유효성 판단이 남음.</div></div>`);

const P4 = page2(4, "WHO IS AFFECTED", "걸려 있는 회사와 프로젝트", "투표 지역에 등장한 데이터센터 사업 (보도 기준)", `
<div class="card"><h2>주요 기업별</h2>
<table class="vt"><tr><th style="width:24%">회사</th><th>지역 · 내용</th></tr>
<tr><td class="loc">아마존(AWS)</td><td>오하이오 선버리(약 20억 달러 계획), 트렌턴(약 600에이커), 스프리그 타운십(최대 1.3GW 검토) → 세 곳 모두 막는 쪽 승리</td></tr>
<tr><td class="loc">메타</td><td>오하이오 피쿼 607에이커 캠퍼스 이미 승인 → 헌장 금지 가결, 적용 여부 불확실</td></tr>
<tr><td class="loc">Vantage</td><td>오하이오 오리건 3개 동 계획 → 25MW 초과 금지 가결</td></tr>
<tr><td class="loc">Aligned</td><td>오하이오 파타스칼라 200MW → 시의회 거부에 이어 금지 가결</td></tr>
<tr><td class="loc">EdgeConneX</td><td>오하이오 애시빌 데이터센터 + 가스발전소 → 협상안 82% 반대</td></tr>
<tr><td class="loc">Thor Equities</td><td>오하이오 어바나 약 10억 달러 → 금지 가결, 소송 중</td></tr>
<tr><td class="loc">Applied Digital</td><td>노스다코타 하우드 200MW 공사 중 → 추가 심사안 부결(유일한 예외)</td></tr></table></div>
<div class="card"><h2>투자 관점</h2>
<ol class="chk">
<li>반대는 <b>전기요금·물·소음·비밀유지계약</b>에 대한 불신에서 시작됐다</li>
<li>이미 승인·착공한 곳은 영향이 작은 편이고, <b>새 부지 확보</b>가 어려워진다</li>
<li>전력을 따로 대거나 주민 보상을 약속하는 <b>조건부 협상</b>이 늘어날 것</li>
<li>남은 투표: 아칸소 클락스빌 채권 2건, 노스다코타 맨던 1건(12월)</li>
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
