// 혈액검사 결과 이해하기 – 그림 pre-1 ~ pre-6
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 10;
const TAG = "림프종 정보 · 혈액검사와 예후 지표 이해하기";

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

// ---------- 혈액검사 글 전용 ----------
const css3 = `
.vt{width:100%;border-collapse:collapse}
.vt th{font-size:20px;color:#5e5a6e;font-weight:700;text-align:left;padding:8px 6px;border-bottom:2px solid #e3e0ec}
.vt td{font-size:21px;padding:10px 6px;border-bottom:1px solid #efedf5;vertical-align:top;line-height:1.4}
.vt td.k{font-weight:800;font-size:22px;white-space:nowrap}
.vt td.k small{display:block;font-weight:400;font-size:17px;color:#7a7690}
.tag{display:inline-block;border-radius:8px;padding:2px 9px;font-size:18px;font-weight:800;margin-right:4px}
.t1{background:#e2f1f4;color:#1f6f80}.t2{background:#f3e3d3;color:#8a4b1f}.t3{background:#ece6f6;color:#4b3a8c}
.score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.score div{border-radius:12px;padding:10px;text-align:center;font-size:19px;line-height:1.35}
.score b{display:block;font-size:22px}
.note{font-size:19px;color:#7a7690;margin-top:12px;line-height:1.5}
`;
const pg = (n, eng, title, sub, body) => page(n, eng, title, sub, body).replace("</style>", css3 + "</style>");

// 시계열 차트(단일 계열). pts: [[라벨, 값|null], ...]
function lineChart({ pts, w = 1000, h = 360, yMin, yMax, log = false, bands = [], lines = [], fmt = (v) => v, split, color = "#4b3a8c", show = null, small = false }) {
  const L = small ? 50 : 70, R = 20, T = 44, B = small ? 40 : 60, iw = w - L - R, ih = h - T - B;
  const Y = (v) => { const t = log ? (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin)) : (v - yMin) / (yMax - yMin); return T + ih - Math.max(0, Math.min(1, t)) * ih; };
  const X = (i) => L + (i + 0.5) * iw / pts.length;
  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="NanumSquare_ac,NanumGothic,sans-serif">`;
  if (split !== undefined) s += `<rect x="${X(split) - iw / pts.length / 2}" y="${T}" width="${L + iw - (X(split) - iw / pts.length / 2)}" height="${ih}" fill="#fdf3ea"/><text x="${X(split) - iw / pts.length / 2 + 6}" y="${T - 12}" font-size="${small ? 14 : 18}" fill="#a0602b" font-weight="800">R-CHOP 치료기 →</text><text x="${L + 4}" y="${T - 12}" font-size="${small ? 14 : 18}" fill="#2f7f9a" font-weight="800">관찰기</text>`;
  for (const b of bands) s += `<rect x="${L}" y="${Y(b.hi)}" width="${iw}" height="${Y(b.lo) - Y(b.hi)}" fill="${b.fill}" opacity="${b.op || 0.55}"/><text x="${L + iw - 6}" y="${Y(b.hi) + 18}" font-size="17" text-anchor="end" fill="${b.tc || '#5e5a6e'}" font-weight="700">${b.label}</text>`;
  for (const l of lines) s += `<line x1="${L}" x2="${L + iw}" y1="${Y(l.v)}" y2="${Y(l.v)}" stroke="${l.c}" stroke-width="2" stroke-dasharray="6 5"/><text x="${L + 6}" y="${Y(l.v) + (l.below ? 20 : -6)}" font-size="17" fill="${l.c}" font-weight="800">${l.label}</text>`;
  s += `<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ih}" stroke="#cfcadb"/><line x1="${L}" x2="${L + iw}" y1="${T + ih}" y2="${T + ih}" stroke="#cfcadb"/>`;
  const ticks = log ? [100, 200, 500, 1000, 2000, 5000, 10000].filter((v) => v >= yMin && v <= yMax) : Array.from({ length: 5 }, (_, i) => yMin + (yMax - yMin) * i / 4);
  for (const t of ticks) s += `<text x="${L - 8}" y="${Y(t) + 6}" font-size="17" text-anchor="end" fill="#7a7690">${fmt(t)}</text>`;
  const seg = []; let cur = [];
  pts.forEach(([, v], i) => { if (v == null) { if (cur.length) seg.push(cur); cur = []; } else cur.push([X(i), Y(v)]); });
  if (cur.length) seg.push(cur);
  const all = pts.map(([, v], i) => v == null ? null : [X(i), Y(v)]).filter(Boolean);
  s += `<polyline points="${all.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="3"/>`;
  pts.forEach(([lab, v], i) => {
    if (!small || i % 2 === 0 || i === pts.length - 1) s += `<text x="${X(i)}" y="${T + ih + (small ? 20 : 24)}" font-size="${small ? 13 : 15}" text-anchor="middle" fill="#5e5a6e">${lab}</text>`;
    if (v == null) return;
    s += `<circle cx="${X(i)}" cy="${Y(v)}" r="${small ? 5 : 6}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
    if (!show || show.includes(i)) s += `<text x="${X(i)}" y="${Y(v) - 12}" font-size="${small ? 16 : 16}" text-anchor="middle" fill="#262233" font-weight="800">${fmt(v)}</text>`;
  });
  return s + "</svg>";
}
const LAB = ["23.9", "24.2", "24.5", "24.11", "25.4", "26.5.7", "5.21", "6.1", "6.15", "7.6", "8.5", "8.12", "9.2", "9.23"];
const ser = (arr) => arr.map((v, i) => [LAB[i], v]);
const LDH = ser([119, 149, 145, 152, 134, 1387, 7000, 700, 205, 204, 165, null, 241, 255]);
const ANC = ser([2894, 2828, 4466, 2394, 6909, 7469, null, 3060, 3172, 3060, 476, 1548, 2928, 2560]);
const HB = ser([14.6, 15.6, 14.2, 15.8, 14.2, 13.8, null, 10.3, 11.0, 11.5, 12.2, 12.3, 12.4, 12.2]);
const PLT = ser([159, 167, 175, 172, 154, 195, null, 39, 375, 240, 177, 168, 217, 231]);

// ---------- 혈액 비율 지표 ----------
const RL = ["23.9", "24.2", "24.5", "24.11", "25.4", "26.5.7", "6.1", "6.15", "7.6", "8.5", "8.12", "9.2", "9.23"];
const rs = (a) => a.map((v, i) => [RL[i], v]);
const LMRs = rs([3.56, 4.25, 4.01, 3.28, 2.34, 3.76, 4.0, 2.5, 3.11, 3.28, 2.73, 2.6, 1.43]);
const NLRs = rs([1.6, 1.29, 2.18, 1.61, 4.39, 4.87, 2.14, 2.44, 2.14, 0.29, 0.88, 2.35, 3.2]);
const ALCs = rs([1813, 2190, 2052, 1487, 1573, 1533, 1428, 1300, 1428, 1652, 1763, 1248, 800]);
// ---------- 공통 도식 요소 ----------
const COL = { imm: "#1f8a9c", immBg: "#e2f3f5", inf: "#d0602b", infBg: "#fdebe2", nut: "#4f8a3a", nutBg: "#e9f4e2", tum: "#6b4ea0", tumBg: "#eee8f8", good: "#3a9a6a", mid: "#e0a23a", bad: "#d0503b" };
const ico = (txt, c, bg, size = 84) => `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:4px solid ${c};color:${c};display:flex;align-items:center;justify-content:center;font-size:${size * 0.36}px;font-weight:800;flex:none">${txt}</div>`;

// 참고치 막대 위에 내 값 표시
function gauge({ val, lo, hi, min, max, mine = null, w = 900, label = "", fmt = (v) => v }) {
  const L = 20, iw = w - 40, X = (v) => L + Math.max(0, Math.min(1, (v - min) / (max - min))) * iw;
  let s = `<svg width="${w}" height="120" viewBox="0 0 ${w} 120" font-family="NanumSquare_ac,NanumGothic,sans-serif">`;
  s += `<rect x="${L}" y="50" width="${iw}" height="22" rx="11" fill="#f1d9d2"/>`;
  s += `<rect x="${X(lo)}" y="50" width="${X(hi) - X(lo)}" height="22" fill="#cfe9dc"/>`;
  if (mine) s += `<rect x="${X(mine[0])}" y="44" width="${X(mine[1]) - X(mine[0])}" height="34" rx="6" fill="none" stroke="${COL.imm}" stroke-width="3" stroke-dasharray="5 4"/><text x="${(X(mine[0]) + X(mine[1])) / 2}" y="100" font-size="18" text-anchor="middle" fill="${COL.imm}" font-weight="800">내 평소값</text>`;
  s += `<text x="${X(lo)}" y="98" font-size="17" text-anchor="middle" fill="#5e5a6e">${fmt(lo)}</text><text x="${X(hi)}" y="98" font-size="17" text-anchor="middle" fill="#5e5a6e">${fmt(hi)}</text>`;
  s += `<path d="M${X(val)} 46 l-11 -18 h22 z" fill="#262233"/><text x="${X(val)}" y="20" font-size="22" text-anchor="middle" font-weight="800" fill="#262233">${label}${fmt(val)}</text>`;
  return s + "</svg>";
}

// ---------- 1. 지도 ----------
const tile = (i, name, items, what, c, bg) => `<div style="display:flex;gap:18px;align-items:center;background:${bg};border-radius:18px;padding:16px 20px">${ico(i, c, "#fff", 78)}<div><div style="font-size:28px;font-weight:800;color:${c}">${name}</div><div style="font-size:20px;color:#3d3950;margin-top:4px;line-height:1.4">${items}</div><div style="font-size:22px;font-weight:800;margin-top:6px">→ ${what}</div></div></div>`;
const P1 = pg(1, "BLOOD TEST MAP", "혈액검사 결과지,<br>다섯 묶음으로 보면 쉽다", "수십 개 항목도 '무엇을 보는지'로 나누면 간단해요", `
<div class="card" style="display:flex;flex-direction:column;gap:12px">
${tile("혈구", "피를 만드는 공장(골수)", "백혈구·호중구, 혈색소, 혈소판", "감염·빈혈·출혈 위험", "#b5174f", "#fbe6ee")}
${tile("분획", "백혈구 속 구성", "호중구·림프구·단핵구 %", "면역 대 염증의 균형", COL.imm, COL.immBg)}
${tile("종양", "종양·염증 신호", "LDH, β2-마이크로글로불린, CRP, 요산", "종양의 양과 활동, 염증", COL.tum, COL.tumBg)}
${tile("장기", "간·콩팥", "AST·ALT·빌리루빈, 크레아티닌", "항암제를 견딜 수 있는지", "#8a4b1f", "#f6ece2")}
${tile("영양", "영양·항체", "알부민, 총단백, IgG", "체력과 감염 방어력", COL.nut, COL.nutBg)}
</div>`);

// ---------- 2. 읽는 법 3단계 ----------
const stepHd = (n, t, sub) => `<div style="display:flex;align-items:center;gap:14px;margin-bottom:6px"><div style="width:52px;height:52px;border-radius:50%;background:#4b3a8c;color:#fff;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center">${n}</div><div><div style="font-size:30px;font-weight:800">${t}</div><div style="font-size:20px;color:#5e5a6e">${sub}</div></div></div>`;
const spark = (vals, w = 900, h = 120, c = "#4b3a8c") => { const mn = Math.min(...vals), mx = Math.max(...vals), X = (i) => 30 + i * (w - 60) / (vals.length - 1), Y = (v) => h - 25 - (v - mn) / (mx - mn || 1) * (h - 55); return `<svg width="${w}" height="${h}"><polyline points="${vals.map((v, i) => X(i) + "," + Y(v)).join(" ")}" fill="none" stroke="${c}" stroke-width="4"/>${vals.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="7" fill="${c}"/><text x="${X(i)}" y="${Y(v) - 14}" font-size="19" font-weight="800" text-anchor="middle" fill="#262233" font-family="NanumSquare_ac,NanumGothic">${v.toLocaleString()}</text>`).join("")}</svg>`; };
const PS = pg(2, "HOW TO READ", "결과지 읽는 3단계", "참고치 → 내 평소값 → 추세", `
<div class="card">${stepHd(1, "참고치 안에 있나?", "초록 구간 = 건강한 사람 다수의 범위")}
${gauge({ val: 12.2, lo: 12.5, hi: 17.5, min: 8, max: 18, label: "혈색소 ", fmt: (v) => v })}
<div class="box" style="margin-top:4px">참고치를 <b>살짝</b> 벗어난 건 흔해요. 얼마나 벗어났는지가 중요합니다.</div></div>
<div class="card">${stepHd(2, "내 평소값과 비교하면?", "치료 전 여러 번 잰 값 = 개인 기준선")}
${gauge({ val: 241, lo: 100, hi: 200, min: 80, max: 280, mine: [119, 152], label: "LDH ", fmt: (v) => v })}
<div class="box" style="margin-top:4px">참고치(200)만 보면 '조금 높음'이지만, <b>내 평소값(119~152)</b>보다는 꽤 높아요.</div></div>
<div class="card">${stepHd(3, "흐름은 어느 쪽?", "한 번의 값보다 여러 번의 방향")}
${spark([3060, 476, 1548, 2928], 900, 130, "#2f7f9a")}
<div class="box" style="margin-top:4px">호중구가 476까지 떨어졌다가 <b>다시 오르는 중</b>이면 회복 신호예요.</div></div>`);

// ---------- 3·4. LDH, 혈구 (그래프 유지) ----------
const P2 = pg(3, "LDH", "LDH: 종양 활동의 온도계", "제 기록: 관찰기 5회 → R-CHOP 치료기 (로그 눈금)", `
<div class="card">${lineChart({ pts: LDH, yMin: 100, yMax: 10000, log: true, split: 6, bands: [{ lo: 100, hi: 200, fill: "#e8e6ee", label: "참고치 100~200" }, { lo: 119, hi: 152, fill: "#bfe3d6", op: 0.8, label: "", tc: "#1f6f80" }], fmt: (v) => v >= 1000 ? v.toLocaleString() : v })}
<div class="legend"><span><i class="sw" style="background:#bfe3d6;border-radius:4px"></i>내 평소값 119~152</span><span><i class="sw" style="background:#e8e6ee;border-radius:4px"></i>참고치 100~200</span></div>
<div class="steps" style="margin-top:22px">
<div class="step">${ico("평온", COL.good, "#e6f4ec", 92)}<div class="t">관찰기<br><b>119~152</b></div></div><div class="arrow">→</div>
<div class="step">${ico("폭등", COL.bad, "#fbe6e2", 92)}<div class="t">형질전환<br><b>1,387 → 7,000</b></div></div><div class="arrow">→</div>
<div class="step">${ico("하강", COL.imm, COL.immBg, 92)}<div class="t">항암 뒤<br><b>200 안팎</b></div></div></div>
<div class="note">LDH는 근육 운동·용혈(채혈 때 적혈구 깨짐)로도 올라요. 한 번보다 추세로 봅니다.</div></div>`);

const zone = (c, t) => `<span style="display:inline-flex;align-items:center;gap:8px;margin-right:18px"><i style="width:22px;height:22px;border-radius:5px;background:${c};display:inline-block"></i>${t}</span>`;
const P3 = pg(4, "CBC", "항암 중 혈구: 언제 조심할까", "초록·노랑·빨강 구간으로 보는 호중구·혈색소·혈소판", `
<div class="card"><h2>호중구(ANC) — 세균과 싸우는 세포</h2>
${lineChart({ pts: ANC, h: 320, yMin: 0, yMax: 8000, split: 6, bands: [{ lo: 1500, hi: 8000, fill: "#e3f3ea", label: "" }, { lo: 500, hi: 1500, fill: "#fbf0d6", label: "감소", tc: "#a0702b" }, { lo: 0, hi: 500, fill: "#fbe0db", label: "심한 감소", tc: "#a33a14" }], fmt: (v) => Math.round(v).toLocaleString(), color: "#2f7f9a" })}
<div style="font-size:21px;margin-top:6px">${zone("#e3f3ea", "1,500 이상 안심")}${zone("#fbf0d6", "500~1,500 조심")}${zone("#fbe0db", "500 미만 + 38도 열 = 응급실")}</div></div>
<div class="card"><div class="two">
<div style="text-align:left"><h2>혈색소(빈혈)</h2>${lineChart({ pts: HB, w: 470, h: 300, yMin: 8, yMax: 17, split: 6, small: true, show: [3, 7, 13], bands: [{ lo: 12.5, hi: 17, fill: "#e3f3ea", label: "" }], fmt: (v) => (+v).toFixed(1), color: "#b5174f" })}</div>
<div style="text-align:left"><h2>혈소판(출혈)</h2>${lineChart({ pts: PLT, w: 470, h: 300, yMin: 0, yMax: 420, split: 6, small: true, show: [7, 8, 13], bands: [{ lo: 134, hi: 387, fill: "#e3f3ea", label: "" }], fmt: (v) => Math.round(v), color: "#8a4b1f" })}</div></div>
<div class="box">항암 뒤 <b>7~14일</b>이 가장 낮은 시기예요. 제 경우 1차 뒤 혈색소 <b>10.3</b>, 혈소판 <b>39</b>까지 내려갔다가 회복했어요.</div></div>`);


// ---------- 5. 낮을 때 조심할 것 ----------
const svgI = (inner, c) => `<svg width="64" height="64" viewBox="0 0 64 64" style="flex:none"><circle cx="32" cy="32" r="30" fill="#fff" stroke="${c}" stroke-width="3"/>${inner}</svg>`;
const I = {
  hand: (c) => svgI(`<path d="M22 44 V24 a3 3 0 0 1 6 0 V32 M28 22 a3 3 0 0 1 6 0 V32 M34 24 a3 3 0 0 1 6 0 V34 M40 30 a3 3 0 0 1 6 0 V40 c0 7-5 12-12 12 h-2 c-6 0-10-4-10-8" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M14 16 q3 4 0 8 M50 14 q3 4 0 8" fill="none" stroke="${c}" stroke-width="2.5"/>`, c),
  mask: (c) => svgI(`<path d="M16 26 q16-8 32 0 v10 q-16 12-32 0z" fill="none" stroke="${c}" stroke-width="3"/><path d="M16 28 h-6 M48 28 h6 M22 30 h20 M22 35 h20" stroke="${c}" stroke-width="2.5"/>`, c),
  temp: (c) => svgI(`<rect x="27" y="10" width="10" height="32" rx="5" fill="none" stroke="${c}" stroke-width="3"/><circle cx="32" cy="46" r="8" fill="${c}"/><rect x="30" y="24" width="4" height="20" fill="${c}"/><path d="M41 16 h6 M41 22 h6 M41 28 h6" stroke="${c}" stroke-width="2.5"/>`, c),
  food: (c) => svgI(`<ellipse cx="32" cy="38" rx="18" ry="8" fill="none" stroke="${c}" stroke-width="3"/><path d="M24 30 q2-6 0-12 M32 30 q2-6 0-12 M40 30 q2-6 0-12" fill="none" stroke="${c}" stroke-width="2.5"/>`, c),
  tooth: (c) => svgI(`<path d="M14 40 h26 M40 36 h10 v8 h-10z" fill="none" stroke="${c}" stroke-width="3"/><path d="M42 36 v-6 M45 36 v-6 M48 36 v-6" stroke="${c}" stroke-width="2.5"/>`, c),
  pill: (c) => svgI(`<rect x="16" y="26" width="32" height="14" rx="7" fill="none" stroke="${c}" stroke-width="3" transform="rotate(-30 32 33)"/><path d="M14 50 L50 14" stroke="#d0503b" stroke-width="4"/>`, c),
  fall: (c) => svgI(`<circle cx="26" cy="18" r="5" fill="${c}"/><path d="M26 24 l6 12 l10 4 M32 36 l-6 12 M28 28 l-10 6" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M12 52 h40" stroke="${c}" stroke-width="2.5"/>`, c),
  drop: (c) => svgI(`<path d="M32 12 C 24 26, 20 32, 20 38 a12 12 0 0 0 24 0 c0-6-4-12-12-26z" fill="${c}" opacity=".85"/>`, c),
  stand: (c) => svgI(`<circle cx="32" cy="16" r="5" fill="${c}"/><path d="M32 22 v18 M32 40 l-6 12 M32 40 l6 12 M24 30 h16" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M44 12 q4 4 0 8 q-4 4 0 8" fill="none" stroke="${c}" stroke-width="2"/>`, c),
  bed: (c) => svgI(`<path d="M12 44 V24 M12 36 h40 v8 M20 30 h12 a4 4 0 0 1 0 6" fill="none" stroke="${c}" stroke-width="3"/><text x="40" y="26" font-size="12" fill="${c}" font-weight="800">z z</text>`, c),
};
const tip = (icon, t, d) => `<div style="display:flex;gap:14px;align-items:center;padding:9px 0">${icon}<div><div style="font-size:23px;font-weight:800">${t}</div><div style="font-size:19px;color:#4a465a;line-height:1.4">${d}</div></div></div>`;
const careBox = (c, bg, title, sub, tips, alarm) => `<div class="card" style="padding:26px 30px"><div style="display:flex;align-items:center;gap:14px;margin-bottom:6px"><div style="background:${c};color:#fff;border-radius:12px;padding:6px 16px;font-size:28px;font-weight:800">${title}</div><div style="font-size:21px;color:#5e5a6e">${sub}</div></div>
<div style="display:grid;grid-template-columns:1fr 1fr;column-gap:18px">${tips.join("")}</div>
<div style="background:${bg};border-left:8px solid ${c};border-radius:12px;padding:12px 18px;font-size:21px;line-height:1.5;margin-top:8px"><b style="color:${c}">바로 연락·응급실</b> ${alarm}</div></div>`;
const PC = pg(5, "WHEN IT'S LOW", "수치가 낮을 때<br>무엇을 조심할까", "호중구 → 감염 · 혈소판 → 출혈 · 혈색소 → 빈혈", `
${careBox("#2f7f9a", "#e2f1f4", "호중구 ↓", "1,500 미만 · 특히 500 미만이면 감염 위험↑", [
  tip(I.hand("#2f7f9a"), "손 씻기", "밖에서 돌아와서, 먹기 전, 화장실 후"),
  tip(I.mask("#2f7f9a"), "마스크·사람 많은 곳 피하기", "감기 걸린 사람과 거리 두기"),
  tip(I.temp("#2f7f9a"), "하루 2번 체온 재기", "해열제 먹기 전에 먼저 재기"),
  tip(I.food("#2f7f9a"), "익힌 음식·깨끗한 물", "날음식·덜 익힌 고기·달걀 피하기"),
], "38도 이상 열, 오한·떨림 → 호중구감소성 발열일 수 있어요")}
${careBox("#8a4b1f", "#f6ece2", "혈소판 ↓", "참고치 미만 · 많이 낮을수록 출혈 위험↑", [
  tip(I.tooth("#8a4b1f"), "부드러운 칫솔·전기면도기", "잇몸·피부 상처 줄이기"),
  tip(I.fall("#8a4b1f"), "넘어짐·부딪힘 조심", "격한 운동·무거운 것 들기 피하기"),
  tip(I.pill("#8a4b1f"), "아스피린·진통소염제 주의", "먹기 전에 주치의와 상의"),
  tip(I.drop("#8a4b1f"), "코 세게 풀지 않기·변비 피하기", "힘줄 때 출혈 위험"),
], "멈추지 않는 코피·잇몸 출혈, 검은 변·피 섞인 소변, 이유 없는 멍·붉은 점, 심한 두통")}
${careBox("#b5174f", "#fbe6ee", "혈색소 ↓", "빈혈 · 산소를 나르는 힘이 부족", [
  tip(I.stand("#b5174f"), "천천히 일어나기", "앉았다 일어날 때 어지러움 주의"),
  tip(I.bed("#b5174f"), "쉬어 가며 움직이기", "피로는 자연스러운 증상, 무리하지 않기"),
], "숨이 많이 차거나 가슴 두근거림·통증, 쓰러질 듯한 어지러움")}
<div class="note" style="padding:0 48px">수혈이나 백혈구 촉진 주사(G-CSF)가 필요한지는 수치와 증상을 보고 주치의가 정해요. 위 내용은 일반적인 안내이며 병원 지침을 먼저 따릅니다.</div>`);

// ---------- 5. 비율 지표 = 분수 ----------
const chip = (t, c, bg) => `<span style="display:inline-block;background:${bg};color:${c};border:2px solid ${c};border-radius:10px;padding:3px 12px;font-size:22px;font-weight:800;margin:2px">${t}</span>`;
const L_ = chip("림프구", COL.imm, COL.immBg), M_ = chip("단핵구", COL.inf, COL.infBg), N_ = chip("호중구", COL.inf, COL.infBg), PL_ = chip("혈소판", COL.inf, COL.infBg), A_ = chip("알부민", COL.nut, COL.nutBg), CR_ = chip("CRP", COL.inf, COL.infBg), LD_ = chip("LDH", COL.tum, COL.tumBg), UL_ = chip("정상 상한 200", "#5e5a6e", "#f1f0f4");
const frac = (name, top, bot, dir, cut) => `<div style="background:#faf9fd;border:2px solid #ece9f4;border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:14px">
<div style="width:118px;font-size:30px;font-weight:800;color:#4b3a8c;flex:none">${name}</div>
<div style="text-align:center;flex:1"><div>${top}</div><div style="height:4px;background:#262233;border-radius:2px;margin:6px 10px"></div><div>${bot}</div></div>
<div style="width:150px;flex:none;text-align:center"><div style="font-size:22px;font-weight:800;color:${dir === "up" ? COL.good : COL.bad}">${dir === "up" ? "높을수록 좋음" : "높을수록 나쁨"}</div><div style="font-size:18px;color:#5e5a6e;margin-top:4px;line-height:1.35">${cut}</div></div></div>`;
const PR1 = pg(6, "BLOOD RATIOS", "혈액 비율 지표 = 나눗셈", "숫자 두 개를 나누면 '저울'이 된다", `
<div class="card" style="display:flex;flex-direction:column;gap:10px">
<div style="font-size:21px;margin-bottom:4px">${chip("내 편(면역)", COL.imm, COL.immBg)} ${chip("종양을 돕는 염증", COL.inf, COL.infBg)} ${chip("영양", COL.nut, COL.nutBg)} ${chip("종양 자체", COL.tum, COL.tumBg)}</div>
${frac("LMR", L_, M_, "up", "2.6 이하면 불리")}
${frac("NLR", N_, L_, "down", "3~4 이상이면 높음")}
${frac("PLR", PL_, L_, "down", "기준 연구마다 다름")}
${frac("SII", PL_ + " × " + N_, L_, "down", "기준 연구마다 다름")}
${frac("CAR", CR_, A_, "down", "염증 대비 체력")}
${frac("LDH 비율", LD_, UL_, "down", "1 넘으면 정상보다 높음")}
<div style="display:flex;gap:10px">
<div style="flex:1;background:#faf9fd;border:2px solid #ece9f4;border-radius:18px;padding:14px 16px"><div style="font-size:28px;font-weight:800;color:#4b3a8c">ALC</div><div style="font-size:20px;margin-top:4px">${L_} 의 절대 수</div><div style="font-size:19px;color:${COL.good};font-weight:800;margin-top:6px">1,000 미만이면 불리</div></div>
<div style="flex:1;background:#faf9fd;border:2px solid #ece9f4;border-radius:18px;padding:14px 16px"><div style="font-size:28px;font-weight:800;color:#4b3a8c">PNI</div><div style="font-size:20px;margin-top:4px">10×${A_} + 0.005×${L_}</div><div style="font-size:19px;color:${COL.good};font-weight:800;margin-top:6px">45 미만이면 불리</div></div></div>
<div class="note">림프구·단핵구·호중구 수 = 백혈구 수 × 각각의 %. 원래 <b>치료 전(진단 시)</b> 값으로 쓰는 지표예요.</div></div>`);

// ---------- 6. 왜 예후와 관련될까 = 줄다리기 ----------
function tug() {
  const w = 1000, h = 330; let s = `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" font-family="NanumSquare_ac,NanumGothic,sans-serif">`;
  s += `<line x1="40" x2="960" y1="150" y2="150" stroke="#a9825c" stroke-width="10" stroke-linecap="round"/>`;
  s += `<line x1="500" x2="500" y1="100" y2="200" stroke="#262233" stroke-width="3" stroke-dasharray="6 5"/><rect x="488" y="135" width="24" height="30" fill="#4b3a8c"/>`;
  const team = (xs, names, c, bg) => xs.map((x, i) => `<circle cx="${x}" cy="150" r="46" fill="${bg}" stroke="${c}" stroke-width="4"/><text x="${x}" y="158" font-size="22" font-weight="800" text-anchor="middle" fill="${c}">${names[i]}</text>`).join("");
  s += team([110, 230, 350], ["T세포", "NK세포", "알부민"], COL.imm, COL.immBg);
  s += team([650, 760, 870], ["단핵구", "호중구", "혈소판"], COL.inf, COL.infBg);
  s += `<text x="230" y="60" font-size="30" font-weight="800" text-anchor="middle" fill="${COL.imm}">← 내 편: 면역·체력</text><text x="760" y="60" font-size="30" font-weight="800" text-anchor="middle" fill="${COL.inf}">종양 편: 염증 →</text>`;
  s += `<text x="230" y="250" font-size="20" text-anchor="middle" fill="#3d3950">종양 세포를 찾아 공격</text><text x="230" y="278" font-size="20" text-anchor="middle" fill="#3d3950">리툭시맙 효과도 도움</text>`;
  s += `<text x="760" y="250" font-size="20" text-anchor="middle" fill="#3d3950">종양이 내는 염증 신호로 늘고</text><text x="760" y="278" font-size="20" text-anchor="middle" fill="#3d3950">면역을 누르고 종양을 도움</text>`;
  return s + "</svg>";
}
const why = (c, bg, t, d) => `<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #efedf5"><div style="flex:none">${chip(t, c, bg)}</div><div style="font-size:21px;line-height:1.5;color:#3d3950">${d}</div></div>`;
const PW = pg(7, "WHY THEY MATTER", "왜 예후와 관련될까", "몸 안에서는 '면역 대 염증' 줄다리기가 벌어진다", `
<div class="card">${tug()}
<div class="box" style="margin-top:0">비율 지표는 <b>이 줄다리기에서 누가 이기고 있는지</b>를 숫자로 보여 줘요. 내 편이 강할수록 같은 치료도 더 잘 듣는 경향이 있습니다.</div></div>
<div class="card">
${why(COL.imm, COL.immBg, "LMR", "<b>공격수(림프구) ÷ 종양 지원군(단핵구)</b>. 단핵구는 조직에서 대식세포가 되어 종양 주변에서 혈관을 만들고 면역을 누그러뜨려요.")}
${why(COL.inf, COL.infBg, "NLR·PLR·SII", "<b>몸 전체 염증의 세기 ÷ 내 면역</b>. 염증이 세면 호중구·혈소판은 늘고 림프구는 줄어 숫자가 커져요.")}
${why(COL.nut, COL.nutBg, "PNI·CAR", "<b>체력(알부민) 대 염증(CRP)</b>. 치료를 계획대로 끝까지 버틸 힘을 봐요.")}
${why(COL.tum, COL.tumBg, "LDH 비율", "<b>종양의 양과 자라는 속도</b>. 빨리 자라는 세포가 LDH를 많이 써서 핏속에 흘러나와요.")}
</div>`);

// ---------- 7. 내 비율 그래프 (좋음/나쁨 구간 색) ----------
const sm = (o) => lineChart({ w: 1000, h: 280, split: 6, ...o, bands: (o.bands || []).map((b) => ({ ...b, label: "" })) });
const PR2 = pg(8, "MY RATIOS", "내 비율 지표의 흐름", "초록 = 유리한 구간, 빨강 = 불리한 구간", `
<div class="card"><h2>LMR (림프구 ÷ 단핵구)</h2>${sm({ pts: LMRs, yMin: 0, yMax: 5, bands: [{ lo: 2.6, hi: 5, fill: "#e3f3ea", label: "유리" , tc: COL.good}, { lo: 0, hi: 2.6, fill: "#fbe0db", label: "불리(2.6 이하)", tc: COL.bad }], fmt: (v) => (+v).toFixed(1), color: "#2f7f9a" })}</div>
<div class="card"><h2>NLR (호중구 ÷ 림프구)</h2>${sm({ pts: NLRs, yMin: 0, yMax: 6, bands: [{ lo: 4, hi: 6, fill: "#fbe0db", label: "높음(4 이상)", tc: COL.bad }, { lo: 0, hi: 3, fill: "#e3f3ea", label: "" }], fmt: (v) => (+v).toFixed(1), color: "#b5174f" })}</div>
<div class="card"><h2>림프구 수 (ALC, /μL)</h2>${sm({ pts: ALCs, yMin: 0, yMax: 2500, bands: [{ lo: 1000, hi: 2500, fill: "#e3f3ea", label: "", tc: COL.good }, { lo: 0, hi: 1000, fill: "#fbe0db", label: "불리(1,000 미만)", tc: COL.bad }], fmt: (v) => Math.round(v).toLocaleString(), color: "#4b3a8c" })}
<div style="font-size:20px;margin-bottom:12px">${zone("#e3f3ea", "유리한 구간")}${zone("#fbe0db", "불리한 구간")}</div><div class="box">오른쪽(치료기)의 값은 <b>항암제·리툭시맙 영향</b>이 섞여 있어요. 예후보다 <b>회복 정도</b>를 보는 용도입니다.</div></div>`);

// ---------- 8. 신호등 표 ----------
const RL2 = RL;
const rows = [
  ["림프구 수", [1813, 2190, 2052, 1487, 1573, 1533, 1428, 1300, 1428, 1652, 1763, 1248, 800], (v) => v >= 1500 ? "g" : v >= 1000 ? "y" : "r", (v) => v.toLocaleString()],
  ["LMR", [3.56, 4.25, 4.01, 3.28, 2.34, 3.76, 4.0, 2.5, 3.11, 3.28, 2.73, 2.6, 1.43], (v) => v >= 3 ? "g" : v > 2.6 ? "y" : "r", (v) => v.toFixed(1)],
  ["NLR", [1.6, 1.29, 2.18, 1.61, 4.39, 4.87, 2.14, 2.44, 2.14, 0.29, 0.88, 2.35, 3.2], (v, i) => i === 9 ? "n" : v < 3 ? "g" : v < 4 ? "y" : "r", (v) => v.toFixed(1)],
  ["PNI", [53.1, 56.9, null, null, 51.9, 53.7, null, null, null, 52.3, null, 48.2, 47.0], (v) => v >= 45 ? "g" : v >= 40 ? "y" : "r", (v) => v.toFixed(0)],
  ["LDH 비율", [0.6, 0.75, 0.73, 0.76, 0.67, 6.9, 3.5, 1.03, 1.02, 0.83, null, 1.21, 1.28], (v) => v <= 1 ? "g" : v <= 3 ? "y" : "r", (v) => v >= 3 ? v.toFixed(1) : v.toFixed(2)],
];
const bgc = { g: "#cfeadb", y: "#fbe9bf", r: "#f6c9c0", n: "#e6e4ec" };
const heat = () => {
  let t = `<table style="width:100%;border-collapse:separate;border-spacing:3px;table-layout:fixed"><tr><td style="width:118px"></td><td colspan="5" style="text-align:center;font-size:19px;font-weight:800;color:#2f7f9a;border-bottom:3px solid #2f7f9a;padding:4px">관찰기</td><td style="text-align:center;font-size:17px;font-weight:800;color:${COL.bad};border-bottom:3px solid ${COL.bad};padding:4px">치료 직전</td><td colspan="7" style="text-align:center;font-size:19px;font-weight:800;color:#a0602b;border-bottom:3px solid #a0602b;padding:4px">R-CHOP 치료 중</td></tr>`;
  t += `<tr><td></td>${RL2.map((d) => `<td style="text-align:center;font-size:15px;color:#5e5a6e;padding:4px 0">${d}</td>`).join("")}</tr>`;
  for (const [name, vals, f, fm] of rows) t += `<tr><td style="font-size:20px;font-weight:800;padding:0 4px">${name}</td>${vals.map((v, i) => v == null ? `<td style="background:#f6f5f9;border-radius:8px;height:62px"></td>` : `<td style="background:${bgc[f(v, i)]};border-radius:8px;height:62px;text-align:center;font-size:17px;font-weight:800">${fm(v)}</td>`).join("")}</tr>`;
  return t + "</table>";
};
const PR3 = pg(9, "TRAFFIC LIGHT", "신호등으로 한눈에", "제 기록 13번을 색으로 칠하면", `
<div class="card">${heat()}
<div style="font-size:20px;margin-top:16px">${zone(bgc.g, "유리")}${zone(bgc.y, "경계")}${zone(bgc.r, "불리")}${zone(bgc.n, "치료 영향(호중구 최저)")}</div>
<div class="box">관찰기는 거의 초록이었는데, <b>형질전환 전 마지막 검사(25.4)</b>에서 LMR·NLR이 먼저 빨갛게 변했어요. 치료 직전엔 <b>LDH가 정상 상한의 약 7배</b>였습니다. 치료 중 색은 약의 영향이라 치료 뒤 다시 봐야 해요.</div>
<div class="note">색 기준: 림프구 1,500·1,000 / LMR 3·2.6 / NLR 3·4 / PNI 45·40 / LDH 비율 1·3. 연구마다 기준값은 다르며 개인의 예후를 정하지 않습니다.</div></div>`);

// ---------- 9. 나머지 항목 ----------
const it = (name, easy, up, down, c, bg) => `<div style="background:${bg};border-radius:16px;padding:14px 16px"><div style="font-size:24px;font-weight:800;color:${c}">${name}</div><div style="font-size:19px;color:#3d3950;margin-top:2px">${easy}</div>
<div style="font-size:19px;margin-top:8px;line-height:1.4"><b style="color:${COL.bad}">▲</b> ${up}</div>${down ? `<div style="font-size:19px;line-height:1.4"><b style="color:#2f6fb0">▼</b> ${down}</div>` : ""}</div>`;
const P4 = pg(10, "OTHER ITEMS", "나머지 항목 한눈에", "▲ 높으면 · ▼ 낮으면 (일반적인 경향)", `
<div class="card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
${it("요산·인·칼륨", "세포가 깨질 때 나오는 물질", "첫 항암 직후 급증 → 종양용해증후군 주의", "", COL.tum, COL.tumBg)}
${it("β2-마이크로글로불린", "림프구 표면에서 떨어진 단백", "종양 양이 많다는 신호", "", COL.tum, COL.tumBg)}
${it("AST·ALT·빌리루빈", "간 건강", "항암제 부작용, 간 침범", "", "#8a4b1f", "#f6ece2")}
${it("크레아티닌·BUN", "콩팥 기능", "콩팥 부담 → 약 용량 조절", "", "#8a4b1f", "#f6ece2")}
${it("CRP·페리틴", "염증 신호", "감염·염증·종양 활동", "", COL.inf, COL.infBg)}
${it("칼슘·ALP", "뼈·간 관련", "뼈 침범·간 이상", "", COL.inf, COL.infBg)}
${it("알부민·총단백", "영양·전신 상태", "", "몸이 많이 지쳤다는 신호", COL.nut, COL.nutBg)}
${it("글로불린·IgG", "항체(면역)", "", "리툭시맙 뒤 흔함 → 감염 주의", COL.nut, COL.nutBg)}
</div>
<div class="box">제 경우 1차 항암 뒤 <b>IgG 456</b>(참고치 700~1,600), <b>페리틴 943</b>(참고치 30~400)이었어요.</div></div>`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [i, html] of [P1, PS, P2, P3, PC, PR1, PW, PR2, PR3, P4].entries()) {
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 1}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
