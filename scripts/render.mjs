// content.json -> 인포그래픽 이미지(pre_N.jpg) + figures.json
// 사용법: node scripts/render.mjs out/2026-11-06
// 필요: playwright(사전 설치된 것 사용), 나눔고딕 글꼴(fonts-nanum)
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const dir = process.argv[2];
if (!dir) { console.error("usage: node scripts/render.mjs <out/YYYY-MM-DD>"); process.exit(1); }
const content = JSON.parse(fs.readFileSync(path.join(dir, "content.json"), "utf8"));

const W = 1080, MAX_H = 1900;
// [메인색, 진한색, 옅은 배경]
const THEME = {
  summary: ["#2b3a5c", "#141c30", "#e8ecf5"],
  issue1: ["#d6336c", "#8f1d47", "#fff0f6"],
  issue2: ["#6741d9", "#3b2185", "#f3f0ff"],
  megatech: ["#1c7ed6", "#0b4a8a", "#e7f5ff"],
  mobility: ["#f76707", "#a93f00", "#fff4e6"],
  ai_software: ["#7b2cbf", "#4a1478", "#f8f0fc"],
  ai_infra: ["#0c8599", "#065463", "#e3fafc"],
  semis: ["#2f9e44", "#16602a", "#ebfbee"],
  others: ["#e67700", "#8a4700", "#fff9db"],
};
const SECTIONS = [
  ["megatech", "메가테크", "애플 · 엔비디아 · 알파벳 · 아마존 · MSFT · 메타"],
  ["mobility", "모빌리티", "테슬라 · 완성차 · 로보틱스 · 스페이스X · 우주항공"],
  ["ai_software", "AI 소프트웨어", "앤트로픽 · 오픈AI 등"],
  ["ai_infra", "AI 인프라", "네오클라우드 · 데이터센터 에너지 · 서버 · 네트워킹 · 광통신"],
  ["semis", "반도체", "파운드리 · 메모리 · 설계 · 장비"],
  ["others", "크립토", "로빈후드 · 서클 · 코인베이스 · 스트래티지 등", true],
];
const LABEL = {
  "사실": ["#343a40", "#f1f3f5"], "의미": ["#6741d9", "#f3f0ff"], "영향": ["#e8590c", "#fff4e6"],
  "체크": ["#2b8a3e", "#ebfbee"], "배경": ["#868e96", "#f8f9fa"],
};
const UP = ["#d6336c", "#fff0f6"], DOWN = ["#1971c2", "#e7f5ff"], FLAT = ["#495057", "#f1f3f5"];

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripSign = (v) => String(v ?? "").replace(/^[+\-−▲▼]\s*/, "");
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const dateLabel = (() => {
  const [y, m, d] = content.date.split("-").map(Number);
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]})`;
})();

function chip(c) {
  const v = String(c.chg ?? "").trim();
  let [fg, bg] = FLAT, arrow = "";
  if (/^[+▲]/.test(v) || c.dir === "up") { [fg, bg] = UP; arrow = "▲"; }
  else if (/^[-−▼]/.test(v) || c.dir === "down") { [fg, bg] = DOWN; arrow = "▼"; }
  const num = stripSign(v);
  const neutral = !arrow;
  const st = neutral ? "color:#495057;background:#fff;border:2px solid #dee2e6" : `color:${fg};background:${bg}`;
  return `<span class="chip" style="${st}">${esc(c.name)}${num ? `<b>${arrow} ${esc(num)}</b>` : ""}</span>`;
}
const chips = (list, title = "관련 종목") => (list && list.length ? `<div class="chips">${title ? `<span class="ct">${title}</span>` : ""}${list.map(chip).join("")}</div>` : "");
const source = (s) => (s ? `<div class="src"><span>출처</span>${esc(s)}</div>` : "");

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;background:#eef1f6;font-family:'NanumGothic','Nanum Gothic',sans-serif;color:#1f2430;font-size:36px;line-height:1.5;word-break:keep-all;overflow-wrap:anywhere;letter-spacing:-0.3px}
.head{position:relative;overflow:hidden;padding:40px 56px 56px;color:#fff}
.head .top{display:flex;justify-content:space-between;align-items:center;font-size:26px;font-weight:700}
.head .brand{background:rgba(255,255,255,.18);padding:8px 20px;border-radius:999px}
.head .date{opacity:.9}
.head .kicker{font-size:26px;font-weight:700;opacity:.8;margin-top:30px;letter-spacing:2px}
.head h1{font-size:66px;font-weight:800;line-height:1.2;margin-top:6px;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.head h1 .part{font-size:28px;font-weight:700;background:rgba(255,255,255,.22);padding:6px 18px;border-radius:999px}
.head .sub{font-size:28px;opacity:.88;margin-top:14px}
.head .wm{position:absolute;right:-6px;bottom:-56px;font-size:240px;font-weight:800;opacity:.08;line-height:1}
.body{padding:0 36px 20px;margin-top:-26px;position:relative}
.card{background:#fff;border-radius:28px;padding:30px 36px 26px;margin-bottom:22px;box-shadow:0 6px 20px rgba(20,32,64,.07)}
.ch{display:flex;align-items:center;gap:16px;padding-bottom:16px;margin-bottom:4px;border-bottom:2px solid #f1f3f5}
.ch .dot{width:16px;height:16px;border-radius:50%;flex:0 0 16px}
.ch h2{font-size:46px;font-weight:800;line-height:1.2;flex:1}
.tag{font-size:24px;font-weight:800;padding:6px 16px;border-radius:999px}
.tag.new{color:#e03131;background:#fff5f5;border:2px solid #ffc9c9}.tag.bg{color:#868e96;background:#f8f9fa;border:2px solid #dee2e6}
.line{display:flex;gap:18px;margin-top:13px;align-items:flex-start}
.lab{flex:0 0 92px;text-align:center;font-size:25px;font-weight:800;border-radius:12px;padding:6px 0;margin-top:5px}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;align-items:center}
.chips .ct{font-size:23px;font-weight:800;color:#adb5bd;margin-right:4px}
.chip{border-radius:14px;padding:8px 18px;font-size:29px;font-weight:700;display:inline-flex;gap:12px;align-items:center}
.src{font-size:23px;color:#868e96;margin-top:18px;padding-top:14px;border-top:2px dashed #e9ecef;display:flex;gap:12px;align-items:center}
.src span{font-weight:800;color:#adb5bd}
.bt{font-size:38px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:14px}
.bt i{display:inline-block;width:10px;height:36px;border-radius:6px}
.num{display:flex;gap:20px;margin-top:16px;align-items:flex-start}
.num .n{flex:0 0 50px;height:50px;border-radius:50%;color:#fff;font-size:27px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:2px}
.chk{display:flex;gap:20px;margin-top:16px;align-items:flex-start}
.chk .b{flex:0 0 40px;height:40px;border:4px solid;border-radius:10px;margin-top:7px}
.tl{position:relative;padding-left:44px}
.tl:before{content:"";position:absolute;left:13px;top:18px;bottom:18px;width:4px;border-radius:2px;background:#e9ecef}
.tl .r{position:relative;margin-top:14px}
.tl .r:before{content:"";position:absolute;left:-41px;top:14px;width:22px;height:22px;border-radius:50%;background:#fff;border:5px solid var(--c)}
.tl .t{font-weight:800;color:var(--c);margin-right:16px}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.metric{border-radius:20px;padding:20px 24px;background:#f8f9fa;border-top:6px solid #ced4da}
.metric .ml{font-size:25px;color:#495057;font-weight:700}
.metric .mv{font-size:42px;font-weight:800;margin-top:4px;line-height:1.25}
.metric .mn{font-size:24px;color:#868e96;margin-top:4px}
.empty{color:#495057}
.foot{display:flex;justify-content:space-between;font-size:23px;color:#adb5bd;padding:6px 48px 34px;font-weight:700}
`;

function page(f, title, part, cardsHtml, pageNo, total) {
  const [c1, c2] = f.theme;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="head" style="background:linear-gradient(135deg,${c1} 0%,${c2} 100%)">
 <div class="top"><span class="brand">개장 전 섹터별 이슈체크</span><span class="date">${esc(dateLabel)}</span></div>
 <div class="kicker">${esc(f.kicker)}</div>
 <h1>${esc(title)}${part ? `<span class="part">${esc(part)}</span>` : ""}</h1>
 ${f.sub ? `<div class="sub">${esc(f.sub)}</div>` : ""}
 <div class="wm">${esc(f.wm || "")}</div>
</div>
<div class="body">${cardsHtml.join("")}</div>
<div class="foot"><span>탐색 구간 ${esc(content.window)}</span><span>${pageNo ? `${pageNo} / ${total}` : ""}</span></div>
</body></html>`;
}

function newsCard(c, theme) {
  const tag = c.tag === "배경" ? `<span class="tag bg">배경</span>` : c.tag ? `<span class="tag new">신규</span>` : "";
  const lines = (c.lines || []).map((l) => {
    const [fg, bg] = LABEL[l.label] || ["#495057", "#f1f3f5"];
    return `<div class="line"><span class="lab" style="color:${fg};background:${bg}">${esc(l.label)}</span><div>${esc(l.text)}</div></div>`;
  }).join("");
  return `<div class="card"><div class="ch"><span class="dot" style="background:${theme[0]}"></span><h2>${esc(c.company)}</h2>${tag}</div>${lines}${chips(c.chips)}${source(c.source)}</div>`;
}

function emptyCard(note, theme) {
  return `<div class="card empty"><div class="ch"><span class="dot" style="background:${theme[0]}"></span><h2>해당 시간대 새 소식 없음</h2></div>${note ? `<div class="line"><span class="lab" style="color:${LABEL["배경"][0]};background:${LABEL["배경"][1]}">배경</span><div>${esc(note)}</div></div>` : ""}</div>`;
}

const boxTitle = (t, color) => `<div class="bt"><i style="background:${color}"></i>${esc(t)}</div>`;

function issueCards(is, theme) {
  const [c1, , light] = theme;
  const out = [];
  if (is.timeline?.length) out.push(`<div class="card">${boxTitle("타임라인 (KST)", c1)}<div class="tl" style="--c:${c1}">${is.timeline.map((t) => `<div class="r"><span class="t">${esc(t.t)}</span>${esc(t.text)}</div>`).join("")}</div></div>`);
  if (is.metrics?.length) out.push(`<div class="card">${boxTitle("핵심 수치", c1)}<div class="metrics">${is.metrics.map((m) => {
    const [fg] = m.dir === "up" ? UP : m.dir === "down" ? DOWN : FLAT;
    const ar = m.dir === "up" ? "▲ " : m.dir === "down" ? "▼ " : "";
    const mv = ar ? stripSign(m.value) : m.value;
    return `<div class="metric" style="border-top-color:${m.dir ? fg : "#ced4da"}"><div class="ml">${esc(m.label)}</div><div class="mv" style="color:${m.dir ? fg : "#1f2430"}">${ar}${esc(mv)}</div>${m.note ? `<div class="mn">${esc(m.note)}</div>` : ""}</div>`;
  }).join("")}</div></div>`);
  if (is.cause?.length) out.push(`<div class="card">${boxTitle("원인", c1)}${is.cause.map((x, i) => `<div class="num"><span class="n" style="background:${c1}">${i + 1}</span><div>${esc(x)}</div></div>`).join("")}</div>`);
  if (is.chips?.length) out.push(`<div class="card" style="background:${light}">${boxTitle("파급 업체", c1)}${chips(is.chips, "")}</div>`);
  if (is.checks?.length) out.push(`<div class="card">${boxTitle("체크 포인트", c1)}${is.checks.map((x) => `<div class="chk"><span class="b" style="border-color:${c1}"></span><div>${esc(x)}</div></div>`).join("")}${source(is.source)}</div>`);
  return out;
}

// 그림 정의
const figs = [];
const T = THEME.summary;
figs.push({
  key: "summary", name: "요약", theme: T, wm: "00",
  kicker: "SUMMARY", title: "오늘의 핵심", sub: `탐색 구간 ${content.window}`,
  cards: [
    `<div class="card">${boxTitle("요약", T[0])}${(content.summary || []).map((x, i) => `<div class="num"><span class="n" style="background:${T[0]}">${i + 1}</span><div>${esc(x)}</div></div>`).join("")}</div>`,
    `<div class="card">${boxTitle("오늘 밤 체크리스트", "#d6336c")}${(content.checklist || []).map((x) => `<div class="chk"><span class="b" style="border-color:#d6336c"></span><div>${esc(x)}</div></div>`).join("")}</div>`,
  ],
});
(content.issues || []).forEach((is, i) => {
  const theme = THEME[`issue${(i % 2) + 1}`];
  figs.push({ key: `issue${i + 1}`, name: `이슈${i + 1}`, theme, wm: `0${i + 1}`, kicker: `ISSUE ${i + 1}`, title: is.title, sub: is.subtitle || "", cards: issueCards(is, theme) });
});
SECTIONS.forEach(([key, label, sub, optional], i) => {
  const cards = content.sections?.[key] || [];
  if (optional && !cards.length) return; // 선택 섹션은 소식이 없으면 장을 만들지 않음
  const theme = THEME[key];
  figs.push({
    key, name: label, theme, wm: String(i + 1).padStart(2, "0"), kicker: "SECTOR", title: label, sub,
    cards: cards.length ? cards.map((c) => newsCard(c, theme)) : [emptyCard(content.empty_notes?.[key], theme)],
  });
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 400 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();

async function measure(f) {
  await pg.setContent(page(f, f.title, "1/2", f.cards, 1, 1), { waitUntil: "load" });
  return pg.evaluate(() => {
    const cs = [...document.querySelectorAll(".body > .card")].map((e) => e.getBoundingClientRect().height + 22);
    const total = document.documentElement.scrollHeight;
    return { total, cards: cs, fixed: total - cs.reduce((a, b) => a + b, 0) };
  });
}

// 1) 나눌 위치 계산: MAX_H를 넘으면 같은 분류를 (1/2), (2/2)로 나눕니다.
const plan = [];
for (const f of figs) {
  const m = await measure(f);
  let groups = [f.cards];
  if (m.total > MAX_H && f.cards.length > 1) {
    const room = MAX_H - m.fixed - 30;
    // 최소 장수 k를 구한 뒤, k장으로 나누는 방법 중 가장 높은 장이 가장 낮은 것을 고릅니다(균등 분할).
    const hs = m.cards, n = hs.length;
    let k = 1; { let h = 0; hs.forEach((x) => { if (h && h + x > room) { k++; h = 0; } h += x; }); }
    const sum = (a, b) => hs.slice(a, b).reduce((p, q) => p + q, 0);
    let best = null;
    const rec = (start, left, cuts) => {
      if (left === 1) { const all = [...cuts, n]; let prev = 0, mx = 0;
        for (const c of all) { mx = Math.max(mx, sum(prev, c)); prev = c; }
        if (!best || mx < best.mx) best = { mx, all }; return; }
      for (let c = start + 1; c <= n - left + 1; c++) rec(c, left - 1, [...cuts, c]);
    };
    rec(0, k, []);
    groups = []; let prev = 0;
    for (const c of best.all) { groups.push(f.cards.slice(prev, c)); prev = c; }
  }
  groups.forEach((g, gi) => plan.push({ f, cards: g, gi, gn: groups.length }));
}

// 2) 렌더링
for (const f of fs.readdirSync(dir)) if (/^pre_\d+\.jpg$/.test(f)) fs.unlinkSync(path.join(dir, f));
const manifest = [];
for (let i = 0; i < plan.length; i++) {
  const { f, cards, gi, gn } = plan[i];
  const n = i + 1;
  const part = gn > 1 ? `${gi + 1}/${gn}` : "";
  await pg.setContent(page(f, f.title, part, cards, n, plan.length), { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  const file = `pre_${n}.jpg`;
  await pg.screenshot({ path: path.join(dir, file), fullPage: true, type: "jpeg", quality: 92 });
  const h = await pg.evaluate(() => document.documentElement.scrollHeight);
  const id = gn > 1 ? `${f.key}#${gi + 1}` : f.key;
  const name = gn > 1 ? `${f.name}(${gi + 1}/${gn})` : f.name;
  manifest.push({ n, id, name, file, height: h });
  console.log(`그림${n} ${id} ${file} ${W}x${h}${h > MAX_H ? "  ⚠ 높이 초과(카드 1장이 너무 김)" : ""}`);
}
await browser.close();
fs.writeFileSync(path.join(dir, "figures.json"), JSON.stringify(manifest, null, 1));
console.log(`figures.json: ${manifest.length}장`);
