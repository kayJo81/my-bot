// 조직 검사 결과지 이해하기 – 설명 그림 (1080px JPG): pre-2 ~ pre-6
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 5;
const TAG = "림프종 정보 · 조직 검사 결과지 이해하기";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const R = (a, b) => a + (b - a) * rnd();

const C = {
  capsule: "#a9825c", cortexBg: "#ece3f3", para: "#dfe9f6", medulla: "#f4ece1",
  mantle: "#4b3a8c", gc: "#fbe3ea", gcCell: "#c76b8f", tcell: "#5d86c2",
  brown: "#8a4b1f", brownLt: "#c98a4f", neg: "#c9cdd4", nucleus: "#6b4ea0",
};

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;background:#f1eff7;font-family:'NanumSquare_ac','NanumSquare','NanumGothic',sans-serif;color:#262233;word-break:keep-all;letter-spacing:-0.4px}
.hd{background:linear-gradient(120deg,#4b3a8c 0%,#2f7f9a 100%);color:#fff;padding:44px 56px 120px}
.top{display:flex;justify-content:space-between;align-items:center}
.pill{background:rgba(255,255,255,.18);border-radius:30px;padding:8px 20px;font-size:24px;font-weight:700}
.eng{margin-top:34px;font-size:24px;letter-spacing:2px;opacity:.85;font-weight:700}
h1{font-size:54px;font-weight:800;line-height:1.25;margin-top:8px}
.sub{font-size:27px;opacity:.92;margin-top:14px;line-height:1.45}
.card{background:#fff;border-radius:28px;margin:-80px 36px 0;padding:36px 36px 30px;box-shadow:0 6px 24px rgba(40,30,80,.08)}
.card+.card{margin-top:24px}
h2{font-size:30px;font-weight:800;border-left:7px solid #2f7f9a;padding-left:16px;margin-bottom:20px}
.ft{display:flex;justify-content:space-between;color:#9a96a8;font-size:22px;padding:26px 48px 32px}
.two{display:flex;gap:18px}.two>div{flex:1;text-align:center}
.cap{font-size:28px;font-weight:800;margin-top:8px}.cap2{font-size:23px;color:#5e5a6e;margin-top:6px;line-height:1.45}
.legend{display:flex;flex-wrap:wrap;gap:12px 26px;margin-top:22px;font-size:23px;color:#3d3950}
.legend span{display:flex;align-items:center;gap:10px}
.sw{width:26px;height:26px;border-radius:50%;display:inline-block;flex:none}
.box{background:#f4f2fa;border-radius:16px;padding:18px 22px;font-size:25px;line-height:1.55;margin-top:18px}
.box b{color:#4b3a8c;font-weight:800}
table{width:100%;border-collapse:collapse;font-size:24px}
th{font-size:21px;color:#5e5a6e;font-weight:700;text-align:left;padding:8px;border-bottom:2px solid #e3e0ec}
td{padding:13px 8px;border-bottom:1px solid #efedf5;vertical-align:middle;line-height:1.4}
.mk{font-weight:800;font-size:26px}
.pos,.ng{display:inline-block;border-radius:10px;padding:4px 12px;font-weight:800;font-size:21px;white-space:nowrap}
.pos{background:#f3e3d3;color:#8a4b1f}.ng{background:#eceef2;color:#5e6470}
.steps{display:flex;align-items:center;gap:8px}
.step{flex:1;text-align:center}.step .t{font-size:22px;color:#3d3950;margin-top:6px;line-height:1.4}
.arrow{font-size:40px;color:#9a96a8}
.grades{display:flex;gap:14px}.grades>div{flex:1;text-align:center}
.g1{font-size:27px;font-weight:800}.g2{font-size:22px;color:#5e5a6e;margin-top:4px;line-height:1.4}
.row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.lab{width:330px;flex:none;font-size:25px;font-weight:800;line-height:1.35}.lab small{display:block;font-size:20px;color:#5e5a6e;font-weight:400}
`;
const page = (n, eng, title, sub, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="hd"><div class="top"><span class="pill">림프종 정보</span></div>
<div class="eng">${eng}</div><h1>${title}</h1><div class="sub">${sub}</div></div>
${body}
<div class="ft"><span>${TAG}</span><span>${n} / ${TOTAL}</span></div></body></html>`;

// ---------- 그림 요소 ----------
// 점 모양 세포들로 채운 원(여포)
function follicle(cx, cy, r, { mantle = 0.28, gcShift = 0, dense = 1, thinMantle = false } = {}) {
  let s = "";
  const gr = r * (1 - (thinMantle ? 0.1 : mantle));
  const gx = cx + gcShift * r * 0.18, gy = cy + gcShift * r * 0.18;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d9d2ee"/>`;
  // 외투층(작은 진한 림프구)
  const nM = Math.round(r * r * (thinMantle ? 0.05 : 0.11) * dense);
  for (let i = 0; i < nM; i++) {
    const a = R(0, 6.283), d = R(gr + 1, r - 1.5);
    s += `<circle cx="${(cx + d * Math.cos(a)).toFixed(1)}" cy="${(cy + d * Math.sin(a)).toFixed(1)}" r="1.6" fill="${C.mantle}"/>`;
  }
  // 배중심(연한 바탕 + 크고 작은 세포)
  s += `<circle cx="${gx}" cy="${gy}" r="${gr}" fill="${C.gc}"/>`;
  const nG = Math.round(gr * gr * 0.035 * dense);
  for (let i = 0; i < nG; i++) {
    const a = R(0, 6.283), d = Math.sqrt(rnd()) * (gr - 3);
    const big = rnd() < 0.25;
    s += `<circle cx="${(gx + d * Math.cos(a)).toFixed(1)}" cy="${(gy + d * Math.sin(a)).toFixed(1)}" r="${big ? 2.6 : 1.7}" fill="${big ? "#e9a3bd" : C.gcCell}"/>`;
  }
  return s;
}
function beanPath(cx, cy, rx, ry) {
  // 림프절(콩 모양): 오른쪽에 들어간 문(hilum)
  return `M ${cx - rx} ${cy} C ${cx - rx} ${cy - ry * 1.05}, ${cx + rx * 0.9} ${cy - ry * 1.15}, ${cx + rx} ${cy - ry * 0.35}
  C ${cx + rx * 0.82} ${cy - ry * 0.12}, ${cx + rx * 0.82} ${cy + ry * 0.12}, ${cx + rx} ${cy + ry * 0.35}
  C ${cx + rx * 0.9} ${cy + ry * 1.15}, ${cx - rx} ${cy + ry * 1.05}, ${cx - rx} ${cy} Z`;
}
function node(type) {
  const W = 470, H = 380, cx = 228, cy = 190, rx = 205, ry = 160;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="c${type}"><path d="${beanPath(cx, cy, rx, ry)}"/></clipPath></defs>`;
  s += `<path d="${beanPath(cx, cy, rx, ry)}" fill="${C.cortexBg}"/>`;
  s += `<g clip-path="url(#c${type})">`;
  if (type === "normal") {
    // 부피질(T세포 구역)과 수질
    s += `<ellipse cx="${cx + 10}" cy="${cy}" rx="${rx * 0.66}" ry="${ry * 0.6}" fill="${C.para}"/>`;
    for (let i = 0; i < 260; i++) {
      const a = R(0, 6.283), d = Math.sqrt(rnd());
      const x = cx + 10 + d * rx * 0.64 * Math.cos(a), y = cy + d * ry * 0.58 * Math.sin(a);
      if (Math.hypot((x - cx - 30) / (rx * 0.36), (y - cy) / (ry * 0.32)) < 1) continue;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="${C.tcell}"/>`;
    }
    s += `<ellipse cx="${cx + 30}" cy="${cy}" rx="${rx * 0.36}" ry="${ry * 0.32}" fill="${C.medulla}"/>`;
    for (let k = 0; k < 5; k++) s += `<path d="M ${cx + 5} ${cy - 40 + k * 20} Q ${cx + 50} ${cy - 30 + k * 15} ${cx + rx} ${cy - 10 + k * 5}" stroke="#e7d6c0" stroke-width="5" fill="none"/>`;
    // 피질의 여포: 가장자리를 따라 띄엄띄엄, 크기 제각각
    const pos = [[-0.78, -0.25, 34], [-0.55, -0.68, 30], [-0.12, -0.84, 36], [0.38, -0.78, 26], [-0.84, 0.28, 30], [-0.48, 0.72, 34], [0.02, 0.86, 28], [0.45, 0.76, 22]];
    for (const [px, py, r] of pos) s += follicle(cx + px * rx, cy + py * ry, r, { gcShift: -0.6 * Math.sign(px || 1) });
  } else {
    // 여포성 림프종: 비슷한 크기의 여포가 전체에 빽빽(등을 맞댄 모양), 외투층 얇음
    const pts = [];
    for (let t = 0; t < 4000 && pts.length < 34; t++) {
      const x = R(cx - rx, cx + rx), y = R(cy - ry, cy + ry), r = R(27, 31);
      if (pts.every(([a, b, rr]) => Math.hypot(a - x, b - y) > rr + r - 3)) pts.push([x, y, r]);
    }
    for (const [x, y, r] of pts) s += follicle(x, y, r, { thinMantle: true });
  }
  s += `</g><path d="${beanPath(cx, cy, rx, ry)}" fill="none" stroke="${C.capsule}" stroke-width="5"/>`;
  // 문(hilum) 혈관
  s += `<path d="M ${cx + rx * 0.84} ${cy - 8} L ${W - 2} ${cy - 22}" stroke="#d0605b" stroke-width="6"/><path d="M ${cx + rx * 0.84} ${cy + 8} L ${W - 2} ${cy + 22}" stroke="#5a78c8" stroke-width="6"/>`;
  return s + "</svg>";
}

// 고배율 시야: 큰 세포(중심모세포) n개
function hpf(nBig, r = 120, label = true) {
  const W = r * 2 + 8, c = r + 4;
  let s = `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><circle cx="${c}" cy="${c}" r="${r}" fill="${C.gc}" stroke="#b9a9d6" stroke-width="3"/>`;
  const placed = [];
  const put = (rr) => { for (let t = 0; t < 500; t++) { const a = R(0, 6.283), d = Math.sqrt(rnd()) * (r - rr - 4); const x = c + d * Math.cos(a), y = c + d * Math.sin(a); if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + rr + 1)) { placed.push([x, y, rr]); return [x, y]; } } return null; };
  for (let i = 0; i < nBig; i++) { const p = put(r * 0.085); if (!p) continue; const [x, y] = p; const rr = r * 0.085;
    s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#f3c9d8" stroke="${C.nucleus}" stroke-width="2"/><circle cx="${x - rr * 0.3}" cy="${y - rr * 0.2}" r="${rr * 0.18}" fill="${C.nucleus}"/><circle cx="${x + rr * 0.35}" cy="${y + rr * 0.25}" r="${rr * 0.16}" fill="${C.nucleus}"/>`; }
  for (let i = 0; i < 70; i++) { const p = put(r * 0.04); if (!p) continue; const [x, y] = p; const rr = r * 0.04;
    s += `<path d="M ${x - rr} ${y} Q ${x - rr} ${y - rr} ${x} ${y - rr} Q ${x + rr} ${y - rr} ${x + rr} ${y} Q ${x + rr * 0.2} ${y + rr * 0.2} ${x + rr * 0.6} ${y + rr} Q ${x} ${y + rr * 1.1} ${x - rr} ${y} Z" fill="${C.gcCell}"/>`; }
  return s + "</svg>";
}

function cell(x, y, r, fill, nuc, extra = "") {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#9b8fc0" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r * 0.58}" fill="${nuc}"/>${extra}`;
}
function antibody(x, y, s = 1, color = "#2f7f9a") {
  // Y자 항체: 두 팔 끝(아래쪽)으로 단백질을 잡음
  return `<g transform="translate(${x},${y}) scale(${s})" stroke="${color}" stroke-width="7" stroke-linecap="round" fill="none"><path d="M0 0 L0 -30"/><path d="M0 0 L-14 16"/><path d="M0 0 L14 16"/></g>`;
}

// ---------- 페이지 ----------
const P1 = page(1, "LYMPH NODE", "여포는 어떻게 생겼을까?", "림프절 단면: 정상 vs 여포성 림프종", `
<div class="card"><h2>림프절을 반으로 잘라 보면</h2>
<div class="two"><div>${node("normal")}<div class="cap">정상 림프절</div><div class="cap2">여포가 겉껍질 쪽에 띄엄띄엄,<br>크기도 제각각</div></div>
<div>${node("fl")}<div class="cap">여포성 림프종</div><div class="cap2">비슷한 크기의 여포가<br>림프절 전체에 빽빽하게</div></div></div>
<div class="legend"><span><i class="sw" style="background:${C.gc};border:2px solid ${C.gcCell}"></i>배중심(여포 가운데, B세포가 자라는 곳)</span>
<span><i class="sw" style="background:${C.mantle}"></i>외투층(여포를 둘러싼 작은 B세포)</span>
<span><i class="sw" style="background:${C.tcell}"></i>T세포 구역</span><span><i class="sw" style="background:${C.capsule}"></i>피막(겉껍질)</span></div>
<div class="box">'여포'는 B세포가 모여 자라는 <b>동그란 방</b>이에요. 여포성 림프종은 이 방이 <b>비정상적으로 많이, 빽빽하게</b> 생겨 림프절의 원래 구조를 덮어 버린 상태입니다. 그래서 구조 전체를 보려면 림프절을 통째로 떼어 내는 <b>절제 생검</b>이 유리해요.</div></div>`);

const P2 = page(2, "GRADE", "Grade는 '큰 세포'를 세는 것", "현미경 고배율 한 시야(HPF)에 보이는 중심모세포 수", `
<div class="card"><h2>여포 속 세포 두 종류</h2>
<div class="two" style="align-items:center"><div>${hpf(9, 150)}</div>
<div style="text-align:left">
<div class="row"><svg width="64" height="64">${`<circle cx="32" cy="32" r="22" fill="#f3c9d8" stroke="${C.nucleus}" stroke-width="3"/><circle cx="25" cy="27" r="4" fill="${C.nucleus}"/><circle cx="39" cy="38" r="4" fill="${C.nucleus}"/>`}</svg><div class="lab">중심모세포<small>centroblast · 크고 빨리 자람</small></div></div>
<div class="row"><svg width="64" height="64"><path d="M 20 32 Q 20 18 32 18 Q 44 18 44 32 Q 34 34 38 44 Q 30 46 20 32 Z" fill="${C.gcCell}"/></svg><div class="lab">중심세포<small>centrocyte · 작고 핵이 쪼개진 모양</small></div></div>
<div class="box" style="margin-top:10px">Grade는 이 중 <b>큰 세포(중심모세포)</b>가 얼마나 섞여 있는지로 나눠요.</div>
</div></div></div>
<div class="card"><h2>고배율 한 시야당 중심모세포 수</h2>
<div class="grades">
<div>${hpf(3, 120)}<div class="g1">Grade 1</div><div class="g2">0~5개<br>가장 천천히 자람</div></div>
<div>${hpf(10, 120)}<div class="g1">Grade 2</div><div class="g2">6~15개</div></div>
<div>${hpf(20, 120)}<div class="g1">Grade 3</div><div class="g2">15개 초과<br>더 공격적</div></div></div>
<div class="box">제 결과는 <b>Grade 1</b>. 2022년 WHO 분류는 Grade 1·2를 묶어 '전형적인 여포성 림프종'으로 봅니다.</div></div>`);

const P3 = page(3, "IMMUNOHISTOCHEMISTRY", "면역염색은 세포의 '신분증' 검사", "특정 단백질에 붙는 항체로 색을 입혀 확인", `
<div class="card"><h2>면역염색 원리</h2>
<div class="steps">
<div class="step"><svg width="200" height="150">${cell(100, 80, 52, "#f5f0fb", "#cfc4e6")}${[[-40, -30], [40, -30], [0, -52], [-50, 15], [50, 15]].map(([dx, dy]) => `<rect x="${100 + dx - 6}" y="${80 + dy - 6}" width="12" height="12" rx="3" fill="#e0a43a"/>`).join("")}</svg><div class="t">세포 표면의<br>단백질(주황 네모)</div></div>
<div class="arrow">→</div>
<div class="step"><svg width="200" height="170">${cell(100, 105, 52, "#f5f0fb", "#cfc4e6")}${[[100, 53], [60, 75], [140, 75]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="3" fill="#e0a43a"/>`).join("")}${antibody(100, 35)}${antibody(60, 57)}${antibody(140, 57)}</svg><div class="t">항체(Y)가<br>단백질에만 붙음</div></div>
<div class="arrow">→</div>
<div class="step"><svg width="200" height="150">${cell(100, 80, 52, "#ead2bb", C.brown)}</svg><div class="t">붙으면 갈색<br>= <b>양성</b></div></div>
<div class="arrow">/</div>
<div class="step"><svg width="200" height="150">${cell(100, 80, 52, "#f5f0fb", "#cfc4e6")}</svg><div class="t">안 붙으면 그대로<br>= <b>음성</b></div></div></div></div>
<div class="card"><h2>제 결과지의 표지들</h2>
<table><tr><th style="width:21%">표지</th><th style="width:15%">결과</th><th>무엇을 알려 주나</th></tr>
<tr><td class="mk">CD20</td><td><span class="pos">양성</span></td><td>B세포에서 생긴 림프종 (리툭시맙 치료의 표적)</td></tr>
<tr><td class="mk">CD10 · Bcl-6</td><td><span class="pos">양성</span></td><td>여포 가운데 '배중심' B세포 출신</td></tr>
<tr><td class="mk">Bcl-2</td><td><span class="pos">양성</span></td><td>죽어야 할 세포가 안 죽음 → 정상 반응이 아닌 림프종</td></tr>
<tr><td class="mk">CD3</td><td><span class="ng">음성</span></td><td>T세포 림프종이 아님</td></tr>
<tr><td class="mk">Cyclin D1</td><td><span class="ng">음성</span></td><td>외투세포 림프종이 아님</td></tr>
<tr><td class="mk">MUM-1</td><td><span class="ng">음성</span></td><td>전형적인 배중심 유래 여포성 림프종과 맞음</td></tr></table>
<div class="box">양성은 '<b>무엇인지</b>'를, 음성은 '<b>무엇이 아닌지</b>'를 알려 줘요. 둘을 합쳐서 여포성 림프종으로 좁혀 갑니다.</div></div>`);

// Bcl-2: 정상은 선택 못 받으면 자멸, 림프종은 살아남아 쌓임
const frag = (x, y) => [[-14, -10, 9], [12, -12, 7], [-6, 12, 8], [14, 10, 6], [0, -2, 5]].map(([dx, dy, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r}" fill="#e7dff2" stroke="#b9acd6" stroke-width="2"/>`).join("");
const P4 = page(4, "BCL-2", "Bcl-2: 죽어야 할 세포가 죽지 않는다", "여포성 림프종이 생기는 기본 원리", `
<div class="card"><h2>정상 배중심 B세포 (Bcl-2 꺼짐)</h2>
<svg width="1000" height="170">${cell(100, 85, 46, "#fbe3ea", C.gcCell)}<text x="100" y="160" font-size="22" text-anchor="middle" fill="#5e5a6e">배중심 B세포</text>
<text x="200" y="95" font-size="44" fill="#9a96a8">→</text>
<text x="330" y="50" font-size="22" text-anchor="middle" fill="#3d3950">쓸모 있는 세포만 선택</text>${cell(330, 100, 34, "#fbe3ea", C.gcCell)}
<text x="440" y="95" font-size="44" fill="#9a96a8">→</text>
<text x="600" y="50" font-size="22" text-anchor="middle" fill="#3d3950">나머지는 스스로 죽음</text>${frag(560, 105)}${frag(650, 105)}
<text x="860" y="80" font-size="24" text-anchor="middle" font-weight="800" fill="#2f7f9a">세포 수 일정하게 유지</text><text x="860" y="115" font-size="21" text-anchor="middle" fill="#5e5a6e">(세포자멸사)</text></svg></div>
<div class="card"><h2>여포성 림프종 (Bcl-2 켜짐)</h2>
<svg width="1000" height="200">${cell(100, 95, 46, "#ead2bb", C.brown)}<text x="100" y="175" font-size="22" text-anchor="middle" fill="#5e5a6e">t(14;18) 유전자 변화</text>
<text x="200" y="105" font-size="44" fill="#9a96a8">→</text>
<text x="330" y="45" font-size="22" text-anchor="middle" fill="#3d3950">Bcl-2가 많이 만들어짐</text>${cell(330, 110, 36, "#ead2bb", C.brown)}
<text x="440" y="105" font-size="44" fill="#9a96a8">→</text>
<text x="640" y="40" font-size="22" text-anchor="middle" fill="#3d3950">죽지 않고 계속 쌓임</text>
${[[560, 90], [610, 80], [660, 92], [710, 82], [585, 135], [635, 128], [685, 138], [735, 125], [610, 175], [660, 170], [710, 178]].map(([x, y]) => cell(x, y, 22, "#ead2bb", C.brown)).join("")}
<text x="880" y="105" font-size="24" text-anchor="middle" font-weight="800" fill="#8a4b1f">여포가 커지고</text><text x="880" y="138" font-size="24" text-anchor="middle" font-weight="800" fill="#8a4b1f">많아짐</text></svg>
<div class="box">정상 배중심 B세포는 Bcl-2가 거의 없어요. 그래서 <b>Bcl-2 양성</b>은 염증으로 커진 정상 여포와 <b>여포성 림프종을 구별</b>하는 중요한 단서입니다. 유전자 변화 자체는 FISH 같은 별도 검사로 확인해요.</div></div>`);

// Ki-67 30% + EBV ISH 일부 양성
function grid(n, nPos, cols, color) {
  let s = `<svg width="${cols * 64}" height="${Math.ceil(n / cols) * 64}">`;
  const pos = new Set(); seed = 31; while (pos.size < nPos) pos.add(Math.floor(rnd() * n));
  for (let i = 0; i < n; i++) { const x = 32 + (i % cols) * 64, y = 32 + Math.floor(i / cols) * 64;
    s += cell(x, y, 26, "#f5f0fb", pos.has(i) ? color : "#cfc4e6"); }
  return s + "</svg>";
}
const P5 = page(5, "KI-67 · EBV", "Ki-67과 EBV ISH", "지금 자라는 세포 비율, 그리고 바이러스 흔적", `
<div class="card"><h2>Ki-67 약 30% = 10개 중 3개가 분열 중</h2>
<div style="display:flex;gap:28px;align-items:center"><div>${grid(20, 6, 5, C.brown)}</div>
<div style="flex:1"><div class="legend" style="margin-top:0;flex-direction:column;gap:14px"><span><i class="sw" style="background:${C.brown}"></i>갈색 핵 = 지금 분열 중(Ki-67 양성)</span><span><i class="sw" style="background:#cfc4e6"></i>쉬고 있는 세포</span></div>
<div class="box">20개 중 6개 = <b>30%</b>. 저등급 여포성 림프종은 보통 이보다 낮은 편이라, 저등급 안에서는 조금 높은 쪽이에요. 다만 판독 차이가 커서 <b>Grade·병기·증상과 함께</b> 봅니다.</div></div></div></div>
<div class="card"><h2>EBV ISH: 일부 세포에서만 양성</h2>
<div style="display:flex;gap:28px;align-items:center"><div>${grid(20, 2, 5, "#1f1a2e")}</div>
<div style="flex:1"><div class="legend" style="margin-top:0;flex-direction:column;gap:14px"><span><i class="sw" style="background:#1f1a2e"></i>검은 핵 = EBV 흔적(RNA) 있음</span></div>
<div class="box">EBV는 성인 대부분이 몸에 지닌 흔한 바이러스예요. 림프종 세포 <b>전체가 아니라 몇몇 세포</b>에서만 보이면, 흔히 배경 세포의 잠복 감염으로 해석합니다.</div></div></div></div>`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [i, html] of [P1, P2, P3, P4, P5].entries()) {
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 2}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
