// 장면별 1920x1080 정지 화면을 만듭니다. node scripts/video_frames.cjs <scenes.json> <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
const [,, cfgPath, out] = process.argv;
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const base = path.dirname(cfgPath);
const css = `*{margin:0;box-sizing:border-box}body{width:1920px;height:1080px;font-family:'NanumGothic','NanumSquare_ac',sans-serif;overflow:hidden}
.bg{width:1920px;height:1080px;background:linear-gradient(135deg,#eef2f7,#f8fafc);position:relative}
.top{position:absolute;left:60px;top:34px;font-size:30px;font-weight:800;color:#0b4ea2}
.top span{color:#6b7280;font-weight:400;margin-left:14px;font-size:26px}
.img{position:absolute;left:50%;top:92px;transform:translateX(-50%);height:740px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.12)}
.cover{background:linear-gradient(150deg,#0b4ea2,#06285a);color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 160px}
.cover .k{font-size:34px;color:#bcd0ee;margin-bottom:20px}.cover h1{font-size:96px;font-weight:800;line-height:1.2}.cover .s{font-size:44px;color:#dbe7f7;margin-top:26px}
.cover .h{margin-top:60px;font-size:28px;color:#9db6dd}`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [i, sc] of cfg.scenes.entries()) {
  let html;
  if (sc.image === 'title') html = `<div class="bg cover"><div class=k>@kayjo81 · 금융과 투자 넋두리</div><h1>${cfg.title}</h1><div class=s>${cfg.subtitle}</div></div>`;
  else if (sc.image === 'outro') html = `<div class="bg cover"><h1 style="font-size:72px">시청해 주셔서 감사합니다</h1><div class=s>자세한 내용은 네이버 블로그에서</div><div class=h>공개 자료를 정리한 참고용 영상이며 투자 권유가 아닙니다</div></div>`;
  else {
    const img = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(base, sc.image)).toString('base64');
    html = `<div class=bg><div class=top>${cfg.title}<span>${cfg.subtitle}</span></div><img class=img src="${img}"></div>`;
  }
  await p.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(out, `f${i}.png`) });
}
await b.close();
})();
