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
const COLORS = {
  summary: "#212a3e", megatech: "#1f5fbf", mobility: "#d9480f",
  ai_software: "#7b2cbf", ai_infra: "#0b7285", semis: "#2b8a3e",
};
const ISSUE_COLORS = ["#c92a2a", "#5f3dc4"];
const SECTIONS = [
  ["megatech", "메가테크", "애플 · 엔비디아 · 알파벳 · 아마존 · MSFT · 메타"],
  ["mobility", "모빌리티", "테슬라 · 기타 제조사 · 로보틱스 · 스페이스X · 우주항공"],
  ["ai_software", "AI 소프트웨어", "앤트로픽 · 오픈AI 등"],
  ["ai_infra", "AI 인프라", "네오클라우드 · 데이터센터 에너지 · 서버 · 네트워킹 · 광통신"],
  ["semis", "반도체", ""],
];
const LABEL_COLORS = { "사실": "#343a40", "의미": "#7048e8", "영향": "#e8590c", "체크": "#2f9e44", "배경": "#868e96" };

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function chip(c) {
  const v = String(c.chg ?? "").trim();
  let color = "#868e96", arrow = "";
  if (/^[+▲]/.test(v) || c.dir === "up") { color = "#d6336c"; arrow = "▲"; }
  else if (/^[-−▼]/.test(v) || c.dir === "down") { color = "#1971c2"; arrow = "▼"; }
  const num = v.replace(/^[+\-−▲▼]\s*/, "");
  return `<span class="chip" style="border-color:${color};color:${color}">${esc(c.name)}${num ? ` <b>${arrow}${esc(num)}</b>` : ""}</span>`;
}

function chips(list) {
  return list && list.length ? `<div class="chips">${list.map(chip).join("")}</div>` : "";
}

function source(s) {
  return s ? `<div class="src">출처: ${esc(s)}</div>` : "";
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;background:#f4f5f8;font-family:'NanumGothic','Nanum Gothic',sans-serif;color:#212529;font-size:36px;line-height:1.45;word-break:keep-all;overflow-wrap:anywhere}
.head{padding:56px 56px 44px;color:#fff}
.head .kicker{font-size:30px;opacity:.85;font-weight:700;letter-spacing:1px}
.head h1{font-size:66px;font-weight:800;line-height:1.2;margin-top:10px}
.head .sub{font-size:30px;opacity:.9;margin-top:14px}
.body{padding:36px 40px 44px}
.card{background:#fff;border-radius:22px;border-left:14px solid #999;padding:30px 36px 26px;margin-bottom:26px;box-shadow:0 2px 6px rgba(0,0,0,.06)}
.card h2{font-size:44px;font-weight:800;line-height:1.25;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.tag{font-size:26px;font-weight:700;padding:4px 14px;border-radius:999px;color:#fff;background:#495057}
.tag.new{background:#e03131}.tag.bg{background:#868e96}
.line{display:flex;gap:16px;margin-top:12px;align-items:flex-start}
.lab{flex:0 0 auto;font-size:26px;font-weight:800;color:#fff;border-radius:10px;padding:5px 12px;margin-top:6px}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}
.chip{border:3px solid;border-radius:999px;padding:4px 18px;font-size:30px;font-weight:700;background:#fff}
.src{font-size:24px;color:#868e96;margin-top:16px}
.box-title{font-size:40px;font-weight:800;margin-bottom:14px}
ul.dots{list-style:none}
ul.dots li{position:relative;padding-left:34px;margin-top:12px}
ul.dots li:before{content:"·";position:absolute;left:6px;font-weight:800}
ul.checks{list-style:none}
ul.checks li{position:relative;padding-left:52px;margin-top:12px}
ul.checks li:before{content:"☐";position:absolute;left:0;font-weight:700}
.tl{display:flex;gap:22px;margin-top:12px}.tl .t{flex:0 0 120px;font-weight:800}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.metric{background:#f8f9fa;border-radius:16px;padding:20px 24px}
.metric .ml{font-size:26px;color:#495057;font-weight:700}
.metric .mv{font-size:44px;font-weight:800;margin-top:4px}
.metric .mn{font-size:26px;color:#868e96;margin-top:2px}
.empty{color:#495057}
.foot{font-size:24px;color:#adb5bd;text-align:right;padding:0 44px 36px}
`;

function page(color, kicker, title, sub, cardsHtml) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="head" style="background:${color}"><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}</div>
<div class="body">${cardsHtml.join("")}</div>
<div class="foot">${esc(content.date)} 개장 전 주요 소식</div>
</body></html>`;
}

function newsCard(c, color) {
  const tag = c.tag === "배경" ? `<span class="tag bg">배경</span>` : c.tag ? `<span class="tag new">신규</span>` : "";
  const lines = (c.lines || []).map((l) => {
    const lc = LABEL_COLORS[l.label] || "#495057";
    return `<div class="line"><span class="lab" style="background:${lc}">${esc(l.label)}</span><div>${esc(l.text)}</div></div>`;
  }).join("");
  return `<div class="card" style="border-left-color:${color}"><h2>${esc(c.company)}${tag}</h2>${lines}${chips(c.chips)}${source(c.source)}</div>`;
}

function emptyCard(note, color) {
  return `<div class="card empty" style="border-left-color:${color}"><h2>해당 시간대 새 소식 없음</h2>${note ? `<div class="line"><span class="lab" style="background:${LABEL_COLORS["배경"]}">배경</span><div>${esc(note)}</div></div>` : ""}</div>`;
}

function issueCards(is, color) {
  const out = [];
  if (is.timeline?.length) out.push(`<div class="card" style="border-left-color:${color}"><div class="box-title">타임라인 (KST)</div>${is.timeline.map((t) => `<div class="tl"><span class="t">${esc(t.t)}</span><div>${esc(t.text)}</div></div>`).join("")}</div>`);
  if (is.metrics?.length) out.push(`<div class="card" style="border-left-color:${color}"><div class="box-title">핵심 수치</div><div class="metrics">${is.metrics.map((m) => {
    const mc = m.dir === "up" ? "#d6336c" : m.dir === "down" ? "#1971c2" : "#212529";
    const ar = m.dir === "up" ? "▲ " : m.dir === "down" ? "▼ " : "";
    const mv = ar ? String(m.value ?? "").replace(/^[+\-−▲▼]\s*/, "") : m.value;
    return `<div class="metric"><div class="ml">${esc(m.label)}</div><div class="mv" style="color:${mc}">${ar}${esc(mv)}</div>${m.note ? `<div class="mn">${esc(m.note)}</div>` : ""}</div>`;
  }).join("")}</div></div>`);
  if (is.cause?.length) out.push(`<div class="card" style="border-left-color:${color}"><div class="box-title">원인</div><ul class="dots">${is.cause.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`);
  if (is.chips?.length) out.push(`<div class="card" style="border-left-color:${color}"><div class="box-title">파급 업체</div>${chips(is.chips)}</div>`);
  if (is.checks?.length) out.push(`<div class="card" style="border-left-color:${color}"><div class="box-title">체크 포인트</div><ul class="checks">${is.checks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${source(is.source)}</div>`);
  return out;
}

// 그림 정의: key, 색, 제목, 카드 목록
const figs = [];
figs.push({
  key: "summary", name: "요약", color: COLORS.summary,
  kicker: `탐색 구간 ${content.window}`, title: "오늘의 핵심", sub: content.date_label || content.date,
  cards: [
    `<div class="card" style="border-left-color:${COLORS.summary}"><div class="box-title">요약</div><ul class="dots">${(content.summary || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`,
    `<div class="card" style="border-left-color:#c92a2a"><div class="box-title">오늘 밤 체크리스트</div><ul class="checks">${(content.checklist || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`,
  ],
});
(content.issues || []).forEach((is, i) => {
  const color = ISSUE_COLORS[i % ISSUE_COLORS.length];
  figs.push({ key: `issue${i + 1}`, name: `이슈${i + 1}`, color, kicker: `이슈 카드 ${i + 1}`, title: is.title, sub: is.subtitle || "", cards: issueCards(is, color) });
});
for (const [key, label, sub] of SECTIONS) {
  const cards = content.sections?.[key] || [];
  const color = COLORS[key];
  figs.push({
    key, name: label, color, kicker: "섹션", title: label, sub,
    cards: cards.length ? cards.map((c) => newsCard(c, color)) : [emptyCard(content.empty_notes?.[key], color)],
  });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 400 }, deviceScaleFactor: 1 });
const pg = await ctx.newPage();

// 높이를 재서 MAX_H를 넘으면 같은 분류를 (1/2), (2/2)로 나눕니다.
async function measure(f, title, cards) {
  await pg.setContent(page(f.color, f.kicker, title, f.sub, cards), { waitUntil: "load" });
  return pg.evaluate(() => {
    const cs = [...document.querySelectorAll(".body > .card")].map((e) => e.getBoundingClientRect().height + 26);
    return { total: document.documentElement.scrollHeight, cards: cs, fixed: document.documentElement.scrollHeight - cs.reduce((a, b) => a + b, 0) };
  });
}

for (const f of fs.readdirSync(dir)) if (/^pre_\d+\.jpg$/.test(f)) fs.unlinkSync(path.join(dir, f));

const manifest = [];
let n = 0;
for (const f of figs) {
  const m = await measure(f, f.title, f.cards);
  let groups = [f.cards];
  if (m.total > MAX_H && f.cards.length > 1) {
    const room = MAX_H - m.fixed - 40; // 제목 길이 여유
    groups = []; let cur = [], h = 0;
    f.cards.forEach((c, i) => {
      if (cur.length && h + m.cards[i] > room) { groups.push(cur); cur = []; h = 0; }
      cur.push(c); h += m.cards[i];
    });
    groups.push(cur);
  }
  for (let g = 0; g < groups.length; g++) {
    n++;
    const title = groups.length > 1 ? `${f.title} (${g + 1}/${groups.length})` : f.title;
    await pg.setContent(page(f.color, f.kicker, title, f.sub, groups[g]), { waitUntil: "load" });
    await pg.evaluate(() => document.fonts.ready);
    const file = `pre_${n}.jpg`;
    await pg.screenshot({ path: path.join(dir, file), fullPage: true, type: "jpeg", quality: 92 });
    const h = await pg.evaluate(() => document.documentElement.scrollHeight);
    const id = groups.length > 1 ? `${f.key}#${g + 1}` : f.key;
    const name = groups.length > 1 ? `${f.name}(${g + 1}/${groups.length})` : f.name;
    manifest.push({ n, id, name, file, height: h });
    console.log(`그림${n} ${id} ${file} ${W}x${h}${h > MAX_H ? "  ⚠ 높이 초과(카드 1장이 너무 김)" : ""}`);
  }
}
await browser.close();
fs.writeFileSync(path.join(dir, "figures.json"), JSON.stringify(manifest, null, 1));
console.log(`figures.json: ${manifest.length}장`);
