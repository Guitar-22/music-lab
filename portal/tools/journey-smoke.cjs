'use strict';
// ทดสอบเดิน Journey Gate จริงในเบราว์เซอร์ (มือถือ + เดสก์ท็อป): ประตู → 7 คำถาม → ผลลัพธ์ → ห้อง → รายละเอียดแอป → ประตูถัดไป → ย้อนกลับ
//   python -m http.server 8650 --directory portal
//   node portal/tools/journey-smoke.cjs [http://127.0.0.1:8650] [โฟลเดอร์ภาพ]
// ต้องมี playwright (npm i -D playwright หรือ NODE_PATH ชี้ global)
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8650';
const SHOTS = process.argv[3] || require('node:os').tmpdir();
(async () => {
  const browser = await chromium.launch();
  const out = [];
  for (const [name, vp] of [['mobile', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 860 }]]) {
    const page = await browser.newPage({ viewport: vp });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errors.push('console: ' + m.text()); });
    const shot = async n => page.screenshot({ path: require('node:path').join(SHOTS, `journey-${name}-${n}.png`), fullPage: n !== 'sheet' });
    await page.goto(BASE + '/journey.html#/');
    await page.waitForSelector('.door-hero'); await page.addStyleTag({ content: '*{animation:none!important}' });
    await shot('1-gate');
    await page.click('.door-hero');
    const answers = [['จังหวะ'], ['กีตาร์'], ['เล่นกับเพื่อน'], ['เล่นได้นิดหน่อย'], ['ดูตัวอย่าง'], ['มือถือ Android', 'คอม Windows', 'มีเครื่องดนตรีแล้ว'], ['ขอฟรีก่อน']];
    for (const [i, picks] of answers.entries()) {
      await page.waitForSelector(`text=ประตูที่ ${i + 1} จาก`);
      if (i === 0) await shot('2-quiz');
      for (const p of picks) await page.click(`.option:has-text("${p}")`);
      if (picks.length > 1) { await page.waitForTimeout(100); await shot('3-multi'); await page.click('.quiz-nav .btn'); }
    }
    await page.waitForSelector('.you-hero h1');
    out.push(`${name}: archetype=${await page.textContent('.you-hero h1')} route=${(await page.$$eval('.stop b', e => e.map(x => x.textContent))).join('>')} picks=${(await page.$$eval('.apps .app h3', e => e.map(x => x.textContent))).join(', ')}`);
    await shot('4-you');
    await page.click('.stop >> nth=0');
    await page.waitForSelector('.room-hero h1');
    out.push(`${name}: room=${await page.textContent('.room-hero h1')} cards=${await page.$$eval('.app', e => e.length)} fitBadges=${await page.$$eval('.fit', e => e.length)}`);
    await shot('5-room');
    await page.click('.app .open >> nth=0');
    await page.waitForSelector('dialog[open] #sheet-title');
    out.push(`${name}: sheet=${await page.textContent('#sheet-title')} hash=${await page.evaluate(() => location.hash)} sections=${await page.$$eval('.sheet-body h3', e => e.map(x => x.textContent).join('|'))}`);
    await shot('sheet');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    out.push(`${name}: after-close hash=${await page.evaluate(() => location.hash)} open=${await page.evaluate(() => document.getElementById('sheet').open)}`);
    await page.click('.next-door >> nth=0');
    await page.waitForTimeout(150);
    out.push(`${name}: next-room=${await page.textContent('.room-hero h1')}`);
    await page.goBack(); await page.waitForTimeout(150);
    out.push(`${name}: back=${await page.textContent('.room-hero h1')}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    out.push(`${name}: horizontal overflow=${overflow}px`);
    await page.goto(BASE + '/journey.html#/');
    await page.waitForSelector('.welcome'); await page.addStyleTag({ content: '*{animation:none!important}' });
    await shot('6-gate-return');
    out.push(`${name}: errors=${errors.length ? errors.join(' || ') : 'none'}`);
    await page.close();
  }
  console.log(out.join('\n'));
  if (out.some(l => /errors=(?!none)|overflow=[1-9]/.test(l))) process.exitCode = 1;
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
