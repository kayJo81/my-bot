// KRX 정보데이터시스템 로그인 후 외국인 매도대금·투자자별 공매도대금 원자료 수집 (공개 시장 통계만 출력)
import { chromium } from 'playwright';
import fs from 'fs';
const { KRX_ID, KRX_PW, START = '20260901', END = '20261120' } = process.env;
if (!KRX_ID || !KRX_PW) { console.log('NO_SECRETS'); process.exit(1); }
const b = await chromium.launch();
const ctx = await b.newContext({ locale: 'ko-KR' });
const p = await ctx.newPage();
p.on('dialog', d => { console.log('DIALOG:', d.message().slice(0, 120)); d.accept().catch(() => {}); });
await p.goto('https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2000);
const links = await p.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => /로그인/.test(e.innerText || '')).map(e => (e.innerText || '').trim() + ' => ' + (e.getAttribute('href') || '') + ' | ' + (e.getAttribute('onclick') || '')));
console.log('LOGIN_LINKS', JSON.stringify(links.slice(0, 10)));
const ll = p.locator('a:has-text("로그인"), button:has-text("로그인")').first();
if (await ll.count()) { const [np] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null), ll.click().catch(e => console.log('CLICK_ERR', e.message.slice(0, 100)))]); if (np) { console.log('POPUP', np.url()); } }
await p.waitForTimeout(5000);
for (const pg of ctx.pages()) console.log('PAGE', pg.url());
const lp = ctx.pages().find(x => /login|COMS001/i.test(x.url())) || p;
if (lp !== p) { await lp.waitForLoadState('networkidle').catch(() => {}); }
console.log('LOGIN_PAGE', lp.url(), (await lp.content()).length);
const frames = [...ctx.pages()].flatMap(x => x.frames());
let target = null;
for (const f of frames) {
  const inputs = await f.evaluate(() => [...document.querySelectorAll('input')].map(i => `${i.type}|${i.name}|${i.id}|${i.offsetParent ? 'vis' : 'hid'}`)).catch(() => []);
  const btns = await f.evaluate(() => [...document.querySelectorAll('button,a,input[type=button],input[type=submit]')].map(e => (e.innerText || e.value || '').trim()).filter(t => /로그인|login/i.test(t))).catch(() => []);
  console.log('FRAME', f.url(), 'INPUTS', JSON.stringify(inputs.slice(0, 30)), 'BTNS', JSON.stringify(btns.slice(0, 10)));
  if (!target && inputs.some(s => s.startsWith('password|') && s.endsWith('vis'))) target = f;
}
if (!target) { console.log('NO_LOGIN_FORM'); await b.close(); process.exit(0); }
const pw = target.locator('input[type=password]:visible').first();
const idBox = target.locator('input[type=text]:visible, input:not([type]):visible').first();
await idBox.fill(KRX_ID); await pw.fill(KRX_PW);
const btn = target.locator('button:has-text("로그인"):visible, a:has-text("로그인"):visible, input[value="로그인"]:visible').last();
if (await btn.count()) await btn.click().catch(() => pw.press('Enter')); else await pw.press('Enter');
await p.waitForTimeout(6000);
console.log('AFTER_LOGIN_URL', p.url());
const post = async (params) => p.evaluate(async (params) => {
  const r = await fetch('/comm/bldAttendant/getJsonData.cmd', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(params).toString() });
  return { status: r.status, text: await r.text() };
}, params);
await p.goto('https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
const out = {};
for (const mkt of ['STK', 'KSQ']) {
  const reqs = {
    sell: { bld: 'dbms/MDC/STAT/standard/MDCSTAT02202', inqTpCd: '2', trdVolVal: '2', askBid: '1', mktId: mkt, etf: 'EF', etn: 'EN', elw: 'EW', strtDd: START, endDd: END, detailView: '0' },
    short1: { bld: 'dbms/MDC/STAT/srt/MDCSTAT30301', searchType: '2', mktId: mkt, inqCond: 'STMFRTSCIFDRFS', strtDd: START, endDd: END },
    short2: { bld: 'dbms/MDC/STAT/srt/MDCSTAT30401', inqCondTpCd1: '2', inqCondTpCd2: '2', mktId: mkt, strtDd: START, endDd: END },
  };
  for (const [k, prm] of Object.entries(reqs)) {
    const r = await post(prm);
    console.log('RESP', mkt, k, r.status, r.text.slice(0, 300).replace(/\s+/g, ' '));
    out[`${mkt}_${k}`] = r;
  }
}
fs.writeFileSync('krx_raw.json', JSON.stringify(out));
console.log('=====JSON-BEGIN'); console.log(JSON.stringify(out)); console.log('=====JSON-END');
await b.close();
