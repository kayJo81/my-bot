// 호지킨 림프종 조직 검사 결과지(가상) 이해하기 – 결과지 pre-1 + 설명 그림 pre-2 ~ pre-6
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 5;
const TAG = "림프종 정보 · 호지킨 림프종 조직 검사 결과지 이해하기";

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

// ---------- 호지킨 전용 요소 ----------
function grid(n, nPos, cols, color, sd = 31) {
  let s = `<svg width="${cols * 64}" height="${Math.ceil(n / cols) * 64}">`;
  const pos = new Set(); seed = sd; while (pos.size < nPos) pos.add(Math.floor(rnd() * n));
  for (let i = 0; i < n; i++) { const x = 32 + (i % cols) * 64, y = 32 + Math.floor(i / cols) * 64;
    s += cell(x, y, 26, "#f5f0fb", pos.has(i) ? color : "#cfc4e6"); }
  return s + "</svg>";
}
const NUCLEOLUS = "#b5174f";
// 리드-스턴버그 세포: 거울상 두 핵 + 큰 핵소체("부엉이 눈")
function rs(x, y, r) {
  return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.85}" fill="#f1e4f7" stroke="#9b7cc4" stroke-width="${Math.max(1, r * 0.06)}"/>
<ellipse cx="${x - r * 0.38}" cy="${y}" rx="${r * 0.36}" ry="${r * 0.5}" fill="#d9c6ef" stroke="${C.nucleus}" stroke-width="${Math.max(1, r * 0.05)}"/>
<ellipse cx="${x + r * 0.38}" cy="${y}" rx="${r * 0.36}" ry="${r * 0.5}" fill="#d9c6ef" stroke="${C.nucleus}" stroke-width="${Math.max(1, r * 0.05)}"/>
<circle cx="${x - r * 0.38}" cy="${y}" r="${r * 0.15}" fill="${NUCLEOLUS}"/><circle cx="${x + r * 0.38}" cy="${y}" r="${r * 0.15}" fill="${NUCLEOLUS}"/>`;
}
// 열공 세포(결절 경화형의 변형 RS 세포): 주변이 비어 보임
function lacunar(x, y, r) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" stroke="#d7cbe8" stroke-width="2" stroke-dasharray="4 4"/>
<path d="M ${x - r * 0.45} ${y} q ${r * 0.1} ${-r * 0.5} ${r * 0.45} ${-r * 0.35} q ${r * 0.4} ${-r * 0.1} ${r * 0.45} ${r * 0.3} q ${r * 0.05} ${r * 0.45} ${-r * 0.35} ${r * 0.45} q ${-r * 0.5} ${r * 0.05} ${-r * 0.55} ${-r * 0.4} z" fill="#d9c6ef" stroke="${C.nucleus}" stroke-width="2"/>
<circle cx="${x + r * 0.05}" cy="${y - r * 0.05}" r="${r * 0.09}" fill="${NUCLEOLUS}"/>`;
}
const eos = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6b9b3"/><circle cx="${x - r * 0.35}" cy="${y}" r="${r * 0.38}" fill="#7a3d8c"/><circle cx="${x + r * 0.35}" cy="${y}" r="${r * 0.38}" fill="#7a3d8c"/>`;
function hlNode() {
  const W = 470, H = 380, cx = 228, cy = 190, rx = 205, ry = 160;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="chl"><path d="${beanPath(cx, cy, rx, ry)}"/></clipPath></defs>`;
  s += `<path d="${beanPath(cx, cy, rx, ry)}" fill="#ece6f4"/><g clip-path="url(#chl)">`;
  for (let i = 0; i < 1100; i++) s += `<circle cx="${R(cx - rx, cx + rx).toFixed(1)}" cy="${R(cy - ry, cy + ry).toFixed(1)}" r="1.6" fill="${rnd() < 0.85 ? C.tcell : "#e0707a"}"/>`;
  const bands = [
    `M 20 120 C 120 150, 180 90, 260 130 S 400 120, 460 160`,
    `M 40 260 C 120 230, 200 280, 280 240 S 390 250, 450 220`,
    `M 150 20 C 170 120, 130 220, 170 370`,
    `M 300 20 C 280 110, 330 200, 300 370`,
  ];
  for (const d of bands) s += `<path d="${d}" stroke="#e7a9b9" stroke-width="13" fill="none" opacity=".9"/>`;
  const spots = [[85, 75], [215, 70], [360, 85], [90, 195], [225, 190], [370, 195], [100, 315], [235, 320], [360, 305], [140, 140], [330, 270]];
  for (const [x, y] of spots) s += rs(x + R(-8, 8), y + R(-8, 8), 10);
  s += `</g><path d="${beanPath(cx, cy, rx, ry)}" fill="none" stroke="${C.capsule}" stroke-width="9"/>`;
  s += `<path d="M ${cx + rx * 0.84} ${cy - 8} L ${W - 2} ${cy - 22}" stroke="#d0605b" stroke-width="6"/><path d="M ${cx + rx * 0.84} ${cy + 8} L ${W - 2} ${cy + 22}" stroke="#5a78c8" stroke-width="6"/>`;
  return s + "</svg>";
}
function hpfHL(r = 200) {
  const W = r * 2 + 8, c = r + 4;
  let s = `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><circle cx="${c}" cy="${c}" r="${r}" fill="#f4eef8" stroke="#b9a9d6" stroke-width="3"/>`;
  const placed = [];
  const put = (rr) => { for (let t = 0; t < 900; t++) { const a = R(0, 6.283), d = Math.sqrt(rnd()) * (r - rr - 4); const x = c + d * Math.cos(a), y = c + d * Math.sin(a); if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + rr + 1)) { placed.push([x, y, rr]); return [x, y]; } } return null; };
  for (const [dx, dy] of [[-60, -50], [70, 60]]) { placed.push([c + dx, c + dy, 34]); s += rs(c + dx, c + dy, 32); }
  for (let i = 0; i < 14; i++) { const p = put(9); if (p) s += eos(p[0], p[1], 9); }
  for (let i = 0; i < 6; i++) { const p = put(13); if (p) s += `<ellipse cx="${p[0]}" cy="${p[1]}" rx="13" ry="10" fill="#e9dcc8" stroke="#a9825c" stroke-width="2"/><ellipse cx="${p[0]}" cy="${p[1]}" rx="6" ry="4" fill="#a9825c"/>`; }
  for (let i = 0; i < 330; i++) { const p = put(5); if (p) s += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${C.tcell}"/>`; }
  return s + "</svg>";
}
const badge = (t, on) => `<span style="display:inline-block;margin:4px;border-radius:10px;padding:6px 12px;font-size:21px;font-weight:800;background:${on === 1 ? "#f3e3d3" : on === 0.5 ? "#f8efe4" : "#eceef2"};color:${on ? "#8a4b1f" : "#5e6470"};${on === 0 ? "text-decoration:line-through" : ""}">${t}</span>`;
const yes = `<span class="pos">+</span>`, no = `<span class="ng">−</span>`, weak = `<span class="pos" style="background:#f8efe4">약 +</span>`, varr = `<span class="ng">다양</span>`;

// ---------- 페이지 ----------
const P1 = page(1, "LYMPH NODE", "띠로 나뉜 결절, 드문드문 큰 세포", "림프절 단면: 정상 vs 고전적 호지킨 림프종(결절 경화형)", `
<div class="card"><h2>림프절을 반으로 잘라 보면</h2>
<div class="two"><div>${node("normal")}<div class="cap">정상 림프절</div><div class="cap2">여포가 겉껍질 쪽에<br>띄엄띄엄</div></div>
<div>${hlNode()}<div class="cap">결절 경화형 호지킨</div><div class="cap2">섬유 띠가 결절로 나누고,<br>큰 세포가 드문드문</div></div></div>
<div class="legend"><span><svg width="34" height="30">${rs(17, 15, 14)}</svg>리드-스턴버그 세포(암세포)</span>
<span><i class="sw" style="background:#e7a9b9;border-radius:6px"></i>섬유 띠(콜라겐)</span><span><i class="sw" style="background:${C.tcell}"></i>주변 림프구</span><span><i class="sw" style="background:#e0707a"></i>호산구 등 염증세포</span></div>
<div class="box">'결절 경화형'은 두꺼워진 <b>섬유 띠가 림프절을 여러 결절(덩어리)로 나눈</b> 모양이에요. 고전적 호지킨 림프종에서 가장 흔한 아형입니다.</div></div>`);

const P2 = page(2, "REED-STERNBERG CELL", "암세포는 '바다 속 몇 마리'", "리드-스턴버그 세포와 주변 염증세포", `
<div class="card"><h2>리드-스턴버그(RS) 세포</h2>
<div class="two" style="align-items:center"><div><svg width="300" height="230">${rs(150, 115, 100)}</svg><div class="cap">전형적인 RS 세포</div><div class="cap2">거울처럼 마주 본 두 핵,<br>붉고 큰 핵소체 = '부엉이 눈'</div></div>
<div><svg width="260" height="230">${lacunar(130, 115, 95)}</svg><div class="cap">열공(lacunar) 세포</div><div class="cap2">결절 경화형에 많은 변형,<br>세포 주변이 비어 보임</div></div></div></div>
<div class="card"><h2>현미경 한 시야</h2>
<div style="display:flex;gap:24px;align-items:center"><div>${hpfHL(190)}</div>
<div style="flex:1"><div class="legend" style="margin-top:0;flex-direction:column;gap:14px"><span><svg width="34" height="30">${rs(17, 15, 14)}</svg>RS 세포(암세포)</span><span><i class="sw" style="background:${C.tcell}"></i>림프구(대부분 T세포)</span><span>${`<svg width="26" height="26">${eos(13, 13, 12)}</svg>`}호산구</span><span><i class="sw" style="background:#e9dcc8;border:2px solid #a9825c"></i>조직구</span></div>
<div class="box">암세포는 전체 세포의 <b>극히 일부</b>예요. 나머지는 암세포가 불러 모은 <b>염증세포</b>입니다. 다른 림프종과 가장 다른 점이에요.</div></div></div></div>`);

const P3 = page(3, "IMMUNOHISTOCHEMISTRY", "RS 세포의 면역염색", "가상 결과지의 표지, 그리고 비슷한 림프종과의 구별", `
<div class="card"><h2>가상 결과지의 표지들 (RS 세포 기준)</h2>
<table><tr><th style="width:22%">표지</th><th style="width:16%">결과</th><th>무엇을 알려 주나</th></tr>
<tr><td class="mk">CD30</td><td><span class="pos">양성</span></td><td>고전적 호지킨의 대표 표지 (브렌툭시맙 표적)</td></tr>
<tr><td class="mk">CD15</td><td><span class="pos">양성</span></td><td>고전적 호지킨을 뒷받침</td></tr>
<tr><td class="mk">PAX5</td><td><span class="pos" style="background:#f8efe4">약양성</span></td><td>B세포 출신의 흔적이 약하게 남음</td></tr>
<tr><td class="mk">MUM-1</td><td><span class="pos">양성</span></td><td>RS 세포에서 강하게 보임</td></tr>
<tr><td class="mk">CD45 · CD20</td><td><span class="ng">음성</span></td><td>일반적인 B세포 림프종과 다름</td></tr>
<tr><td class="mk">CD3</td><td><span class="ng">음성</span></td><td>T세포가 아님 (주변 T세포는 양성)</td></tr>
<tr><td class="mk">ALK</td><td><span class="ng">음성</span></td><td>ALK 양성 역형성 대세포 림프종이 아님</td></tr></table></div>
<div class="card"><h2>헷갈리는 이웃과 구별하기</h2>
<table><tr><th style="width:22%">표지</th><th>고전적 호지킨<br><small>(가상 결과)</small></th><th>결절성 림프구<br>우세형</th><th>ALK 양성<br>역형성 대세포</th></tr>
<tr><td class="mk">CD30</td><td>${yes}</td><td>${no}</td><td>${yes}</td></tr>
<tr><td class="mk">CD15</td><td>${yes}</td><td>${no}</td><td>${no}</td></tr>
<tr><td class="mk">CD20</td><td>${no}</td><td>${yes}</td><td>${no}</td></tr>
<tr><td class="mk">CD45</td><td>${no}</td><td>${yes}</td><td>${varr}</td></tr>
<tr><td class="mk">PAX5</td><td>${weak}</td><td>${yes}</td><td>${no}</td></tr>
<tr><td class="mk">ALK</td><td>${no}</td><td>${no}</td><td>${yes}</td></tr></table>
<div class="box">표지 <b>하나</b>가 아니라 <b>조합</b>으로 판단해요. 대표적인 경향이며 예외도 있습니다.</div></div>`);

const P4 = page(4, "LOST IDENTITY", "B세포였지만 B세포 표지를 잃었다", "그래서 CD20이 음성이어도 B세포 출신", `
<div class="card"><h2>배중심 B세포 → RS 세포</h2>
<div style="display:grid;grid-template-columns:1fr 120px 1fr;align-items:center;gap:10px">
<div style="text-align:center"><svg width="220" height="190">${cell(110, 95, 80, "#fbe3ea", C.gcCell)}</svg><div class="cap">원래 배중심 B세포</div>
<div style="margin-top:10px">${badge("CD20 +", 1)}${badge("CD45 +", 1)}${badge("PAX5 +", 1)}</div></div>
<div style="text-align:center;font-size:21px;color:#5e5a6e;line-height:1.4">여러 유전자<br>변화<br><span style="font-size:48px">→</span></div>
<div style="text-align:center"><svg width="240" height="190">${rs(120, 95, 95)}</svg><div class="cap">RS 세포</div>
<div style="margin-top:10px">${badge("CD20", 0)}${badge("CD45", 0)}${badge("PAX5 약하게", 0.5)}${badge("CD30 +", 1)}${badge("CD15 +", 1)}</div></div></div>
<div class="box">RS 세포는 <b>B세포에서 왔지만</b> B세포의 특징 대부분을 잃어버렸어요. 그래서 B세포 표지 <b>CD20은 음성</b>, 흔적인 <b>PAX5만 약하게</b> 남고, 대신 CD30·CD15가 나타납니다. 이게 고전적 호지킨을 알아보는 핵심 패턴이에요.</div></div>`);

const pdl1 = (x, y, len = 24) => `<path d="M ${x} ${y} h ${len}" stroke="#e0a43a" stroke-width="5"/><circle cx="${x + len + 6}" cy="${y}" r="8" fill="#e0a43a"/>`;
const pd1 = (x, y) => `<path d="M ${x} ${y} h -24" stroke="#2f7f9a" stroke-width="5"/><path d="M ${x - 24} ${y - 12} q -16 12 0 24" stroke="#2f7f9a" stroke-width="5" fill="none"/>`;
const blocker = (x, y) => `<g stroke="#4b3a8c" stroke-width="6" stroke-linecap="round" fill="none"><path d="M ${x} ${y} h -26"/><path d="M ${x} ${y} l 14 -13"/><path d="M ${x} ${y} l 14 13"/></g>`;
const P5 = page(5, "PD-L1 · EBV", "PD-L1: 면역세포를 끄는 방패", "그리고 EBV ISH 음성의 의미", `
<div class="card"><h2>PD-L1이 하는 일</h2>
<div class="two">
<div><svg width="440" height="250">${rs(110, 130, 80)}${cell(330, 130, 62, "#e3edf8", C.tcell)}
${pdl1(186, 105)}${pdl1(186, 155)}${pd1(272, 105)}${pd1(272, 155)}
<text x="110" y="240" font-size="22" text-anchor="middle" fill="#5e5a6e">RS 세포 (PD-L1)</text><text x="330" y="225" font-size="22" text-anchor="middle" fill="#5e5a6e">T세포 (PD-1)</text>
<text x="330" y="45" font-size="24" text-anchor="middle" font-weight="800" fill="#a33a14">공격 OFF</text></svg>
<div class="cap2">RS 세포의 PD-L1(주황)이 T세포의 PD-1(파랑)에<br>붙으면 T세포가 공격을 멈춰요</div></div>
<div><svg width="440" height="250">${rs(110, 130, 80)}${cell(330, 130, 62, "#e3edf8", C.tcell)}
${pdl1(186, 105, 6)}${pdl1(186, 155, 6)}${pd1(272, 105)}${pd1(272, 155)}${blocker(225, 105)}${blocker(225, 155)}
<text x="110" y="240" font-size="22" text-anchor="middle" fill="#5e5a6e">RS 세포 (PD-L1)</text><text x="330" y="225" font-size="22" text-anchor="middle" fill="#5e5a6e">T세포 (PD-1)</text>
<text x="330" y="45" font-size="24" text-anchor="middle" font-weight="800" fill="#127a86">공격 ON</text></svg>
<div class="cap2">면역관문억제제(보라 Y)가 PD-1을 먼저 막으면<br>T세포가 다시 공격해요</div></div></div>
<div class="box">고전적 호지킨의 RS 세포는 <b>PD-L1을 많이 내놓는 경우가 흔해요</b>. 그래서 재발했을 때 <b>PD-1 억제제(면역항암제)</b>가 잘 듣는 림프종으로 알려져 있습니다.</div></div>
<div class="card"><h2>EBV ISH: RS 세포에서 음성</h2>
<div style="display:flex;gap:28px;align-items:center"><div>${grid(10, 0, 5, "#1f1a2e")}</div>
<div style="flex:1"><div class="box" style="margin-top:0">고전적 호지킨의 일부는 RS 세포에 <b>EBV 흔적</b>이 있어요(혼합 세포형에서 더 흔함). 이 예시는 음성입니다.</div></div></div></div>`);

const SHEET = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;background:#f7f6f2;font-family:'NanumMyeongjo','NanumGothic',serif;color:#222;padding:56px 56px 60px}
.badge{display:inline-block;background:#c8552b;color:#fff;font-family:'NanumSquare_ac','NanumGothic',sans-serif;font-weight:800;font-size:26px;border-radius:10px;padding:6px 16px;margin-bottom:22px}
h1{font-size:44px;font-weight:800;margin-bottom:30px}ul{list-style:none}li{font-size:36px;line-height:1.55;padding-left:36px;position:relative;margin-bottom:26px}
li::before{content:"";position:absolute;left:6px;top:24px;width:12px;height:12px;border-radius:50%;background:#222}
.note{font-family:'NanumSquare_ac','NanumGothic',sans-serif;font-size:24px;color:#8a8577;margin-top:16px}</style></head><body>
<span class="badge">가상 예시 · 교육용</span><h1>병리 결과 (가상)</h1><ul>
<li>검체: 왼쪽 쇄골 위 림프절을 통째로 떼어낸 절제 생검, 2.8×2.0×1.5 cm</li>
<li>진단: 고전적 호지킨 림프종, 결절 경화형<br>(Classic Hodgkin lymphoma, nodular sclerosis)</li>
<li>소견: 섬유 띠로 나뉜 결절 안에 리드-스턴버그 세포와 열공 세포가 흩어져 있고, 주변에 림프구·호산구·조직구가 많음</li>
<li>RS 세포 면역염색 양성: CD30, CD15, PAX5(약양성), MUM-1</li>
<li>RS 세포 면역염색 음성: CD45, CD20, CD3, ALK</li>
<li>PD-L1: RS 세포에서 양성</li><li>EBV ISH(EBER): RS 세포에서 음성</li></ul>
<div class="note">실제 환자의 결과가 아니라, 용어 설명을 위해 만든 예시입니다.</div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
await p.setContent(SHEET, { waitUntil: "load" }); await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/pre-1.jpg`, type: "jpeg", quality: 90, fullPage: true });
for (const [i, html] of [P1, P2, P3, P4, P5].entries()) {
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 2}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
