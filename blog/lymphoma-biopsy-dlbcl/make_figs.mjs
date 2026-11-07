// DLBCL 조직 검사 결과지(가상) 이해하기 – 결과지 pre-1 + 설명 그림 pre-2 ~ pre-6
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 5;
const TAG = "림프종 정보 · DLBCL 조직 검사 결과지 이해하기";

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

// ---------- DLBCL 전용 요소 ----------
function grid(n, nPos, cols, color, sd = 31) {
  let s = `<svg width="${cols * 64}" height="${Math.ceil(n / cols) * 64}">`;
  const pos = new Set(); seed = sd; while (pos.size < nPos) pos.add(Math.floor(rnd() * n));
  for (let i = 0; i < n; i++) { const x = 32 + (i % cols) * 64, y = 32 + Math.floor(i / cols) * 64;
    s += cell(x, y, 26, "#f5f0fb", pos.has(i) ? color : "#cfc4e6"); }
  return s + "</svg>";
}
function largeCell(x, y, r) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6d3e0" stroke="${C.nucleus}" stroke-width="${Math.max(1, r * 0.12)}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.15}" r="${r * 0.2}" fill="${C.nucleus}"/><circle cx="${x + r * 0.3}" cy="${y + r * 0.25}" r="${r * 0.17}" fill="${C.nucleus}"/>`;
}
function dlbclNode() {
  const W = 470, H = 380, cx = 228, cy = 190, rx = 205, ry = 160;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="cdl"><path d="${beanPath(cx, cy, rx, ry)}"/></clipPath></defs>`;
  s += `<path d="${beanPath(cx, cy, rx, ry)}" fill="#f3dbe6"/><g clip-path="url(#cdl)">`;
  const pts = [];
  for (let t = 0; t < 20000 && pts.length < 420; t++) {
    const x = R(cx - rx, cx + rx), y = R(cy - ry, cy + ry), r = R(7.5, 9.5);
    if (pts.every(([a, b, rr]) => Math.hypot(a - x, b - y) > rr + r + 0.5)) pts.push([x, y, r]);
  }
  for (const [x, y, r] of pts) s += largeCell(x.toFixed(1), y.toFixed(1), r);
  for (let i = 0; i < 70; i++) s += `<circle cx="${R(cx - rx, cx + rx).toFixed(1)}" cy="${R(cy - ry, cy + ry).toFixed(1)}" r="2.2" fill="${C.tcell}"/>`;
  s += `</g><path d="${beanPath(cx, cy, rx, ry)}" fill="none" stroke="${C.capsule}" stroke-width="5"/>`;
  s += `<path d="M ${cx + rx * 0.84} ${cy - 8} L ${W - 2} ${cy - 22}" stroke="#d0605b" stroke-width="6"/><path d="M ${cx + rx * 0.84} ${cy + 8} L ${W - 2} ${cy + 22}" stroke="#5a78c8" stroke-width="6"/>`;
  return s + "</svg>";
}
const small = (svg) => svg.replace('<svg width="470" height="380"', '<svg width="316" height="256"');
function hpfMix(nLarge, nSmall, r = 130) {
  const W = r * 2 + 8, c = r + 4;
  let s = `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><circle cx="${c}" cy="${c}" r="${r}" fill="#fbe9f0" stroke="#b9a9d6" stroke-width="3"/>`;
  const placed = [];
  const put = (rr) => { for (let t = 0; t < 800; t++) { const a = R(0, 6.283), d = Math.sqrt(rnd()) * (r - rr - 4); const x = c + d * Math.cos(a), y = c + d * Math.sin(a); if (placed.every(([px, py, pr]) => Math.hypot(px - x, py - y) > pr + rr + 1)) { placed.push([x, y, rr]); return [x, y]; } } return null; };
  for (let i = 0; i < nLarge; i++) { const p = put(r * 0.1); if (p) s += largeCell(p[0], p[1], r * 0.1); }
  for (let i = 0; i < nSmall; i++) { const p = put(r * 0.04); if (p) s += `<circle cx="${p[0]}" cy="${p[1]}" r="${r * 0.04}" fill="${C.mantle}"/>`; }
  return s + "</svg>";
}
// 막대 + 기준선
function meter(label, val, cut, unit, note) {
  return `<div style="margin-bottom:26px"><div style="display:flex;justify-content:space-between;font-size:25px;font-weight:800"><span>${label}</span><span>${val}${unit}</span></div>
<div style="position:relative;height:30px;background:#efedf5;border-radius:8px;margin-top:10px">
<div style="position:absolute;left:0;top:0;bottom:0;width:${val}%;background:${C.brownLt};border-radius:8px"></div>
<div style="position:absolute;left:${cut}%;top:-8px;bottom:-8px;width:3px;background:#262233"></div>
<div style="position:absolute;left:calc(${cut}% + 8px);top:34px;font-size:20px;color:#262233;white-space:nowrap">기준 ${cut}%</div></div>
<div style="font-size:21px;color:#5e5a6e;margin-top:30px">${note}</div></div>`;
}
const fbox = (t, cls = "") => `<div style="border:2px solid ${cls === "on" ? "#2f7f9a" : "#d6d2e4"};background:${cls === "on" ? "#e2f1f4" : "#fff"};border-radius:14px;padding:12px 16px;font-size:23px;font-weight:800;text-align:center;line-height:1.35">${t}</div>`;

// ---------- 페이지 ----------
const P1 = page(1, "LYMPH NODE", "'미만성'은 여포 없이 퍼진 것", "림프절 단면: 정상 · 여포성 림프종 · DLBCL", `
<div class="card"><h2>림프절을 반으로 잘라 보면</h2>
<div class="two" style="gap:6px"><div>${small(node("normal"))}<div class="cap">정상</div><div class="cap2">여포가 겉껍질 쪽에<br>띄엄띄엄</div></div>
<div>${small(node("fl"))}<div class="cap">여포성 림프종</div><div class="cap2">비슷한 여포가<br>빽빽하게</div></div>
<div>${small(dlbclNode())}<div class="cap">DLBCL</div><div class="cap2">여포 없이 큰 세포가<br>통째로 퍼짐</div></div></div>
<div class="legend"><span><i class="sw" style="background:#f6d3e0;border:2px solid ${C.nucleus}"></i>큰 B세포(림프종 세포)</span>
<span><i class="sw" style="background:${C.gc};border:2px solid ${C.gcCell}"></i>배중심</span><span><i class="sw" style="background:${C.mantle}"></i>외투층</span>
<span><i class="sw" style="background:${C.tcell}"></i>T세포</span></div>
<div class="box">'미만성(diffuse)'은 <b>여포 같은 구조 없이 넓게 퍼져 있다</b>는 뜻이에요. 큰 B세포가 림프절의 원래 구조를 <b>통째로 지워 버린</b> 모습입니다.</div></div>`);

const P2 = page(2, "LARGE CELL", "'거대 B세포'는 얼마나 클까?", "정상 림프구와 크기 비교", `
<div class="card"><h2>세포 크기 비교</h2>
<svg width="1000" height="230">
<circle cx="150" cy="110" r="22" fill="${C.mantle}"/><text x="150" y="200" font-size="24" text-anchor="middle" font-weight="800">정상 작은 림프구</text>
<ellipse cx="440" cy="110" rx="40" ry="32" fill="#d9c7a8" stroke="#a9825c" stroke-width="3"/><text x="440" y="200" font-size="24" text-anchor="middle" font-weight="800">대식세포의 핵</text>
${largeCell(780, 105, 58)}<text x="780" y="200" font-size="24" text-anchor="middle" font-weight="800" fill="#4b3a8c">DLBCL의 큰 B세포</text></svg>
<div class="box">'거대(large)'는 핵이 <b>대식세포의 핵 이상</b>, 또는 <b>정상 림프구의 2배 이상</b> 큰 세포를 말해요. 핵 안의 점(핵소체)도 뚜렷합니다.</div></div>
<div class="card"><h2>현미경 고배율 한 시야</h2>
<div class="two"><div>${hpfMix(4, 80)}<div class="cap">여포성 림프종 Grade 1</div><div class="cap2">대부분 작은 세포,<br>큰 세포는 드문드문</div></div>
<div>${hpfMix(40, 12)}<div class="cap">DLBCL</div><div class="cap2">큰 세포가<br>시야를 가득 채움</div></div></div></div>`);

const P3 = page(3, "IMMUNOHISTOCHEMISTRY", "면역염색과 '세포 기원' 판정", "가상 결과지의 표지와 한스(Hans) 알고리즘", `
<div class="card"><h2>가상 결과지의 표지들</h2>
<table><tr><th style="width:22%">표지</th><th style="width:16%">결과</th><th>무엇을 알려 주나</th></tr>
<tr><td class="mk">CD20</td><td><span class="pos">양성</span></td><td>B세포 림프종 (리툭시맙의 표적)</td></tr>
<tr><td class="mk">CD10 · Bcl-6</td><td><span class="pos">양성</span></td><td>배중심 B세포 성격</td></tr>
<tr><td class="mk">Bcl-2 · c-MYC</td><td><span class="pos">일부 양성</span></td><td>% 수치가 중요 (다음 그림)</td></tr>
<tr><td class="mk">CD3</td><td><span class="ng">음성</span></td><td>T세포 림프종이 아님</td></tr>
<tr><td class="mk">CD5</td><td><span class="ng">음성</span></td><td>CD5 양성 아형이 아님</td></tr>
<tr><td class="mk">Cyclin D1</td><td><span class="ng">음성</span></td><td>외투세포 림프종이 아님</td></tr>
<tr><td class="mk">MUM-1</td><td><span class="ng">음성</span></td><td>활성 B세포 성격이 약함</td></tr>
<tr><td class="mk">CD30</td><td><span class="ng">음성</span></td><td>호지킨·역형성 림프종 쪽이 아님</td></tr></table></div>
<div class="card"><h2>세포 기원(COO) 판정: 한스 알고리즘</h2>
<div style="display:grid;grid-template-columns:1fr 92px 1fr 92px 1fr;align-items:center;gap:6px">
${fbox("CD10 양성?<br><small style='font-weight:400'>(30% 이상)</small>", "on")}<div style="text-align:center;font-size:20px;color:#5e5a6e;line-height:1.1">아니오<br><span style="font-size:36px">→</span></div>
${fbox("Bcl-6 양성?")}<div style="text-align:center;font-size:20px;color:#5e5a6e;line-height:1.1">예<br><span style="font-size:36px">→</span></div>${fbox("MUM-1 양성?")}
<div style="text-align:center;font-size:22px;color:#2f7f9a;font-weight:800">예 ↓</div><div></div><div style="text-align:center;font-size:22px;color:#5e5a6e">아니오 ↓</div><div></div><div style="text-align:center;font-size:22px;color:#5e5a6e">예 ↓ &nbsp; 아니오 ↓</div>
${fbox("배중심형<br>GCB", "on")}<div></div>${fbox("비배중심형<br>non-GCB")}<div></div>${fbox("non-GCB &nbsp;|&nbsp; GCB")}</div>
<div class="box">CD10이 '아니오'면 Bcl-6로, Bcl-6가 '예'면 MUM-1로 넘어가요. 가상 결과지는 CD10 양성이라 바로 <b>배중심형(GCB)</b>입니다. 일반적으로 GCB형이 비배중심형(ABC형)보다 표준 치료 반응이 좋은 편으로 알려져 있어요.</div></div>`);

const P4 = page(4, "MYC · BCL2", "이중 발현과 이중 타격", "단백질(면역염색) %와 유전자(FISH) 재배열은 다른 검사", `
<div class="card"><h2>단백질 검사(면역염색): 이중 발현인가?</h2>
${meter("c-MYC", 30, 40, "%", "40% 이상이면 MYC 과발현 → 가상 결과는 기준 미만")}
${meter("Bcl-2", 70, 50, "%", "50% 이상이면 BCL2 과발현 → 가상 결과는 기준 이상")}
<div class="box">둘 다 기준을 넘으면 <b>'이중 발현(double expressor)'</b>이라 하고, 예후가 다소 나쁜 쪽으로 봐요. 가상 결과는 MYC가 기준 미만이라 <b>이중 발현이 아닙니다.</b></div></div>
<div class="card"><h2>유전자 검사(FISH): 이중 타격인가?</h2>
<table><tr><th>유전자</th><th>재배열</th><th>의미</th></tr>
<tr><td class="mk">MYC</td><td><span class="ng">없음</span></td><td rowspan="3" style="vertical-align:middle">MYC와 BCL2가 <b>둘 다</b> 재배열되면 '이중 타격(double-hit)'으로 따로 분류하고 더 강한 치료를 고려</td></tr>
<tr><td class="mk">BCL2</td><td><span class="ng">없음</span></td></tr><tr><td class="mk">BCL6</td><td><span class="ng">없음</span></td></tr></table>
<div class="box">FISH는 염색체에서 유전자가 <b>끊어져 자리를 옮겼는지</b>를 형광으로 보는 검사예요. 가상 결과는 모두 재배열이 없어 <b>이중 타격이 아닙니다.</b></div></div>`);

const P5 = page(5, "KI-67 · EBV", "Ki-67 80%와 EBV 음성", "빨리 자라는 림프종, 그리고 바이러스 흔적", `
<div class="card"><h2>Ki-67 약 80% = 10개 중 8개가 분열 중</h2>
<div style="display:flex;gap:28px;align-items:center"><div>${grid(20, 16, 5, C.brown, 5)}</div>
<div style="flex:1"><div class="legend" style="margin-top:0;flex-direction:column;gap:14px"><span><i class="sw" style="background:${C.brown}"></i>갈색 핵 = 지금 분열 중</span></div>
<div class="box">20개 중 16개 = <b>80%</b>. 여포성 림프종 예시(30%)보다 훨씬 높아요. DLBCL은 <b>빨리 자라는(공격성) 림프종</b>이라 대개 높게 나옵니다.</div></div></div></div>
<div class="card"><h2>EBV ISH: 음성</h2>
<div style="display:flex;gap:28px;align-items:center"><div>${grid(20, 0, 5, "#1f1a2e")}</div>
<div style="flex:1"><div class="box" style="margin-top:0">EBV 흔적이 있는 세포가 없어요. 림프종 세포 대부분이 EBV 양성이면 <b>'EBV 양성 DLBCL'</b>이라는 별도 아형으로 분류하기 때문에 확인하는 검사입니다.</div></div></div></div>`);

// 가상 결과지 (요약 카드)
const SHEET = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}body{width:1080px;background:#f7f6f2;font-family:'NanumMyeongjo','NanumGothic',serif;color:#222;padding:56px 56px 60px}
.badge{display:inline-block;background:#c8552b;color:#fff;font-family:'NanumSquare_ac','NanumGothic',sans-serif;font-weight:800;font-size:26px;border-radius:10px;padding:6px 16px;margin-bottom:22px}
h1{font-size:44px;font-weight:800;margin-bottom:30px}ul{list-style:none}li{font-size:36px;line-height:1.55;padding-left:36px;position:relative;margin-bottom:26px}
li::before{content:"";position:absolute;left:6px;top:24px;width:12px;height:12px;border-radius:50%;background:#222}
.note{font-family:'NanumSquare_ac','NanumGothic',sans-serif;font-size:24px;color:#8a8577;margin-top:16px}</style></head><body>
<span class="badge">가상 예시 · 교육용</span><h1>병리 결과 (가상)</h1><ul>
<li>검체: 목(경부) 림프절을 통째로 떼어낸 절제 생검, 3.2×2.5×1.8 cm</li>
<li>진단: 미만성 거대 B세포 림프종(DLBCL), NOS<br>세포 기원: 배중심 B세포형(GCB), Hans 알고리즘</li>
<li>면역염색 양성: CD20, CD10, Bcl-6, Bcl-2(약 70%), c-MYC(약 30%)</li>
<li>면역염색 음성: CD3, CD5, Cyclin D1, MUM-1, CD30</li>
<li>Ki-67: 약 80%</li><li>EBV ISH(EBER): 음성</li>
<li>FISH: MYC, BCL2, BCL6 재배열 없음</li></ul>
<div class="note">실제 환자의 결과가 아니라, 용어 설명을 위해 만든 예시입니다.</div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
await p.setContent(SHEET, { waitUntil: "load" }); await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/pre-1.jpg`, type: "jpeg", quality: 90, fullPage: true });
for (const [i, html] of [P1, P2, P3, P4, P5].entries()) {
  seed = 7 + i * 13;
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 2}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
