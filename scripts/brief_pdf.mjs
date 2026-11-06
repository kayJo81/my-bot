import { createRequire } from "module"; import fs from "fs";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const [src, out, label] = process.argv.slice(2);
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;");
const lines = fs.readFileSync(src,"utf8").split("\n");
let html = "";
for (const l of lines) {
  if (!l.trim()) { continue; }
  if (l.startsWith("# ")) html += `<h1>${esc(l.slice(2))}</h1><div class="lab">${esc(label)}</div>`;
  else if (/^\d\)/.test(l)) html += `<h2>${esc(l)}</h2>`;
  else if (/^\(\d\)/.test(l)) html += `<h3>${esc(l)}</h3>`;
  else if (l.startsWith("[")) html += `<p class="hl">${esc(l)}</p>`;
  else if (l.startsWith("@ [")) html += `<p class="sec">${esc(l)}</p>`;
  else if (l.startsWith("** ")) html += `<p class="sub">${esc(l)}</p>`;
  else if (l.startsWith("@ ")) html += `<p class="at">${esc(l)}</p>`;
  else html += `<p class="bul">${esc(l)}</p>`;
}
const doc = `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:'NanumGothic',sans-serif;font-size:10.5pt;line-height:1.65;color:#1f2430;word-break:keep-all}
h1{font-size:20pt;margin:0}.lab{color:#868e96;font-size:9pt;margin:4px 0 14px;border-bottom:2px solid #212a3e;padding-bottom:8px}
h2{font-size:14pt;color:#1c4587;margin:18px 0 6px}h3{font-size:12pt;color:#364fc7;margin:14px 0 4px}
p{margin:5px 0}.hl{font-weight:bold;background:#f1f3f5;padding:6px 10px;border-radius:4px}
.sec{font-weight:bold;margin-top:12px}.sub{padding-left:14px}.at{padding-left:8px}
</style></head><body>${html}</body></html>`;
const b = await chromium.launch(); const p = await b.newPage(); await p.setContent(doc,{waitUntil:"load"});
await p.pdf({path:out,format:"A4",margin:{top:"15mm",bottom:"15mm",left:"15mm",right:"15mm"},printBackground:true,displayHeaderFooter:true,headerTemplate:"<span></span>",footerTemplate:'<div style="font-size:8px;width:100%;text-align:center;color:#999"><span class="pageNumber"></span>/<span class="totalPages"></span></div>'});
await b.close();
