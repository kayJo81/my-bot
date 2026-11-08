// 혈액검사 결과 이해하기 – 그림 pre-1 ~ pre-6
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = process.argv[2];
const TOTAL = 6;
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

const P1 = pg(1, "BLOOD TEST MAP", "혈액검사 결과지,<br>네 묶음으로 보면 쉽다", "림프종 환자가 자주 받는 항목과 역할", `
<div class="card"><table class="vt">
<tr><th style="width:24%">묶음</th><th style="width:38%">항목</th><th>무엇을 보나</th></tr>
<tr><td class="k">혈구<small>CBC</small></td><td>백혈구·호중구(ANC), 혈색소·적혈구, 혈소판, MCV·RDW 등</td><td>골수가 피를 잘 만드는지, 항암 후 감염·빈혈·출혈 위험</td></tr>
<tr><td class="k">백혈구 분획</td><td>호중구·림프구·단핵구·호산구·호염기구 %, Band 등</td><td>백혈구 안의 구성 비율, 회복 단계</td></tr>
<tr><td class="k">종양·염증·대사</td><td>LDH, β2-마이크로글로불린, 요산, 인, 칼슘, ALP, CRP, 페리틴</td><td>종양의 양과 활동, 세포 파괴, 염증</td></tr>
<tr><td class="k">장기 기능</td><td>AST·ALT·빌리루빈(간), 크레아티닌·BUN(신장), 나트륨·칼륨</td><td>항암제를 견딜 수 있는지, 부작용</td></tr>
<tr><td class="k">영양·면역</td><td>알부민, 총단백, 글로불린, IgG·IgA·IgM</td><td>전신 상태, 리툭시맙 뒤 항체 회복</td></tr></table>
<div class="box">결과지의 '참고치'는 <b>건강한 사람 다수의 범위</b>예요. 치료 전 여러 번 검사해 둔 <b>내 평소값(개인 기준선)</b>과 함께 보면 변화가 훨씬 잘 보입니다.</div></div>`);

const P2 = pg(2, "LDH", "LDH: 종양 활동의 온도계", "제 기록: 관찰기 5회 → R-CHOP 치료기 (로그 눈금)", `
<div class="card">${lineChart({ pts: LDH, yMin: 100, yMax: 10000, log: true, split: 5, bands: [{ lo: 100, hi: 200, fill: "#e8e6ee", label: "참고치 100~200" }, { lo: 119, hi: 152, fill: "#bfe3d6", op: 0.8, label: "", tc: "#1f6f80" }], fmt: (v) => v >= 1000 ? v.toLocaleString() : v })}
<div class="legend"><span><i class="sw" style="background:#bfe3d6;border-radius:4px"></i>내 평소값(관찰기) 119~152</span><span><i class="sw" style="background:#e8e6ee;border-radius:4px"></i>참고치 100~200</span></div>
<div class="box">LDH는 세포가 깨지거나 빨리 늘 때 핏속에 많아져요. 형질전환 무렵 <b>1,387 → 7,000</b>까지 올랐다가 1차 항암 뒤 빠르게 떨어졌습니다. 다만 LDH는 <b>근육 운동·용혈·채혈 상태</b>에도 오르니 한 번의 값보다 <b>추세</b>로 봅니다.</div></div>`);

const P3 = pg(3, "CBC", "항암 중 혈구: 언제 조심할까", "호중구(ANC)·혈색소·혈소판의 변화", `
<div class="card"><h2>호중구(ANC) — 감염을 막는 세포</h2>
${lineChart({ pts: ANC, h: 320, yMin: 0, yMax: 8000, split: 5, lines: [{ v: 1500, c: "#c8552b", label: "1,500 미만: 감소" }, { v: 500, c: "#a33a14", label: "500 미만: 심한 감소(감염 위험↑)" }], fmt: (v) => Math.round(v).toLocaleString(), color: "#2f7f9a" })}
<div class="box" style="margin-top:6px">8월 5일 <b>476</b>으로 떨어져 4차 항암이 1주 미뤄졌어요. 이때 열이 38도 이상이면 <b>바로 응급실</b>입니다(호중구감소성 발열).</div></div>
<div class="card"><div class="two">
<div style="text-align:left"><h2>혈색소(빈혈)</h2>${lineChart({ pts: HB, w: 470, h: 300, yMin: 8, yMax: 17, split: 5, small: true, show: [3, 7, 13], lines: [{ v: 12.5, c: "#c8552b", label: "하한 12.5" }], fmt: (v) => (+v).toFixed(1), color: "#b5174f" })}</div>
<div style="text-align:left"><h2>혈소판(출혈)</h2>${lineChart({ pts: PLT, w: 470, h: 300, yMin: 0, yMax: 420, split: 5, small: true, show: [7, 8, 13], lines: [{ v: 134, c: "#c8552b", label: "하한 134", below: true }], fmt: (v) => Math.round(v), color: "#8a4b1f" })}</div></div>
<div class="box">1차 항암 11일 뒤 혈색소 <b>10.3</b>, 혈소판 <b>39</b>로 가장 낮았다가 회복했어요. 항암 후 7~14일이 보통 가장 낮은 시기(최저점)입니다.</div></div>`);

const P4 = pg(4, "WHAT EACH MEANS", "나머지 항목 한눈에", "높으면·낮으면 무엇을 뜻하나 (일반적 경향)", `
<div class="card"><table class="vt">
<tr><th style="width:22%">항목</th><th>쉽게 말하면</th><th style="width:30%">림프종에서 볼 점</th></tr>
<tr><td class="k">요산·인·칼륨</td><td>세포가 깨질 때 나오는 물질</td><td>첫 항암 직후 급증하면 '종양용해증후군' 주의</td></tr>
<tr><td class="k">칼슘·ALP</td><td>뼈·간과 관련된 수치</td><td>뼈 침범·간 이상 때 오를 수 있음</td></tr>
<tr><td class="k">AST·ALT·빌리루빈</td><td>간 건강</td><td>항암제 부작용·간 침범 확인</td></tr>
<tr><td class="k">크레아티닌·BUN</td><td>콩팥 기능</td><td>약 용량 조절, 탈수 확인</td></tr>
<tr><td class="k">알부민·총단백</td><td>영양·전신 상태</td><td>낮으면 몸이 많이 지쳤다는 신호</td></tr>
<tr><td class="k">CRP·페리틴</td><td>염증 신호</td><td>감염·염증·종양 활동 때 상승</td></tr>
<tr><td class="k">글로불린·IgG/A/M</td><td>항체(면역)</td><td>리툭시맙 뒤 낮아질 수 있음 → 감염 주의</td></tr>
<tr><td class="k">MCV·RDW·망상적혈구</td><td>적혈구 크기·고르기·새로 만든 양</td><td>빈혈의 원인과 회복 정도</td></tr>
<tr><td class="k">β2-마이크로글로불린</td><td>세포 표면에서 떨어져 나오는 단백(림프구에 많음)</td><td>종양 양을 반영, 예후 지표(FLIPI-2 등)에 쓰임</td></tr></table>
<div class="box">제 경우 1차 항암 뒤 <b>IgG 456</b>(참고치 700~1,600), <b>페리틴 943</b>(참고치 30~400)이었어요. 이런 값은 주치의와 재측정 시기를 상의합니다.</div></div>`);

const P5 = pg(5, "PROGNOSIS · DLBCL", "공격성 림프종의 예후 지표", "IPI · R-IPI · NCCN-IPI (진단 시 점수)", `
<div class="card"><h2>IPI — 5가지 항목, 해당하면 1점씩</h2>
<table class="vt"><tr><th>항목</th><th>점수 기준</th></tr>
<tr><td class="k">나이</td><td>60세 초과</td></tr><tr><td class="k">LDH</td><td>참고치 상한 초과</td></tr>
<tr><td class="k">전신 상태(ECOG)</td><td>2 이상(자기 돌봄은 되지만 일은 못 하는 정도 이상)</td></tr>
<tr><td class="k">병기</td><td>Ann Arbor 3~4기</td></tr><tr><td class="k">림프절 밖 침범</td><td>2곳 이상</td></tr></table>
<div class="score"><div style="background:#dff1ef"><b>0~1점</b>저위험</div><div style="background:#eef6e8"><b>2점</b>저중간위험</div><div style="background:#fbefe2"><b>3점</b>고중간위험</div><div style="background:#fbe3e0"><b>4~5점</b>고위험</div></div></div>
<div class="card"><h2>R-IPI · NCCN-IPI</h2>
<table class="vt"><tr><td class="k">R-IPI</td><td>리툭시맙 시대에 맞춘 IPI. 같은 5항목으로 <b>0점(매우 좋음) / 1~2점(좋음) / 3~5점(나쁨)</b>의 3단계.</td></tr>
<tr><td class="k">NCCN-IPI</td><td>나이를 세분(40·60·75세)하고 LDH를 <b>상한의 몇 배</b>인지로 나누며, 골수·뇌·간/위장관·폐 침범을 따로 봅니다. 0~8점.</td></tr></table>
<div class="box">점수는 <b>집단의 평균 경향</b>일 뿐, 한 사람의 결과를 정하지 않아요. 치료 반응(중간·최종 PET)이 함께 중요합니다.</div></div>`);

const P6 = pg(6, "PROGNOSIS · FL · PET", "여포성 림프종 지표와 PET 점수", "FLIPI · FLIPI-2 · PRIMA-PI · POD24 · Deauville", `
<div class="card"><table class="vt">
<tr><th style="width:20%">지표</th><th>보는 항목</th><th style="width:26%">해석</th></tr>
<tr><td class="k">FLIPI</td><td>60세 초과, 3~4기, 혈색소 12 미만, LDH 상승, 침범 림프절 부위 5곳 이상</td><td>0~1 저 / 2 중 / 3↑ 고</td></tr>
<tr><td class="k">FLIPI-2</td><td>60세 초과, β2M 상승, 혈색소 12 미만, 골수 침범, 가장 큰 림프절 6cm 초과</td><td>0 저 / 1~2 중 / 3↑ 고</td></tr>
<tr><td class="k">PRIMA-PI</td><td>β2M 3mg/L 초과면 고위험, 아니면서 골수 침범 있으면 중간</td><td>간단한 2항목</td></tr>
<tr><td class="k">POD24</td><td>첫 면역항암 후 <b>24개월 안</b>에 진행·재발했는지</td><td>해당하면 더 적극적인 관리</td></tr></table></div>
<div class="card"><h2>PET-CT Deauville 5점 척도</h2>
<div class="score" style="grid-template-columns:repeat(5,1fr)"><div style="background:#dff1ef"><b>1</b>섭취 없음</div><div style="background:#dff1ef"><b>2</b>종격동 이하</div><div style="background:#eef6e8"><b>3</b>간 이하</div><div style="background:#fbefe2"><b>4</b>간보다 약간 높음</div><div style="background:#fbe3e0"><b>5</b>간보다 훨씬 높음·새 병변</div></div>
<div class="box">보통 <b>1~3점은 완전 대사 반응</b>, 4~5점은 남은 활동성으로 봅니다. 제 경우 치료 전 <b>Deauville 5 (SUVmax 25.65)</b> → 중간 PET <b>Deauville 4 (SUVmax 5.15)</b>, 약 80% 줄었어요. 최종 판정은 치료 종료 PET로 합니다.</div></div>`);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [i, html] of [P1, P2, P3, P4, P5, P6].entries()) {
  await p.setContent(html, { waitUntil: "load" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/pre-${i + 1}.jpg`, type: "jpeg", quality: 90, fullPage: true });
}
await b.close();
console.log("ok");
