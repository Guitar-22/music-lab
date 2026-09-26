'use strict';
// ทดสอบ Journey app ในเบราว์เซอร์จริงตามเกณฑ์ HIG: iPhone / iPad / เดสก์ท็อป × สว่าง / มืด
//   python -m http.server 8650 --directory portal
//   node portal/tools/journey-smoke.cjs [http://127.0.0.1:8650] [โฟลเดอร์ภาพ] [path/axe.min.js]
// ต้องมี playwright; ถ้าระบุ axe-core จะตรวจการเข้าถึง (WCAG 2.1 AA) ทุกหน้าด้วย
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.argv[2] || 'http://127.0.0.1:8650';
const SHOTS = process.argv[3] || require('node:os').tmpdir();
const AXE = process.argv[4] && fs.existsSync(process.argv[4]) ? fs.readFileSync(process.argv[4], 'utf8') : null;

const DEVICES = [
  ['iphone', { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['ipad', { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop', { viewport: { width: 1366, height: 900 } }],
];

(async () => {
  const browser = await chromium.launch();
  const report = [];
  let failed = false;
  const fail = msg => { failed = true; report.push('  ✗ ' + msg); };
  for (const [device, opts] of DEVICES) for (const scheme of ['light', 'dark']) {
    const tag = `${device}-${scheme}`;
    const ctx = await browser.newContext({ ...opts, colorScheme: scheme, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) errors.push(m.text()); });
    await page.route(/^(?!http:\/\/127\.0\.0\.1).*/, r => r.abort()); // ไม่ออกเน็ต: ทดสอบเส้นทาง fallback ของไอคอน
    const shot = async name => (await page.waitForTimeout(400), page.screenshot({ path: path.join(SHOTS, `apple-${tag}-${name}.png`), fullPage: false }));
    const audit = async where => {
      await page.waitForTimeout(350); // รอ transition ของหน้า (โหมดลดการเคลื่อนไหวใช้ fade 0.2 วินาที)
      // ตรวจพื้นที่แตะขั้นต่ำ 44×44 (รวมพื้นที่ที่ขยายด้วย ::after)
      const small = await page.evaluate(() => [...document.querySelectorAll('button, a[href], [role=radio], [role=checkbox]')].filter(el => {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return false;
        const after = getComputedStyle(el, '::after'); const pad = after.content !== 'none' && after.position === 'absolute' ? Math.abs(parseFloat(after.top) || 0) * 2 : 0;
        return Math.min(r.width + pad, r.height + pad) < 43.5 && !el.closest('.sr, .skip, .foot-note, p');
      }).map(el => `${el.className || el.tagName}:"${(el.getAttribute('aria-label') || el.textContent).trim().slice(0, 20)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`));
      if (small.length) fail(`${tag} ${where}: พื้นที่แตะ < 44pt → ${[...new Set(small)].slice(0, 6).join(' | ')}`);
      if (AXE) {
        await page.addScriptTag({ content: AXE }).catch(() => {});
        const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'], rules: { region: { enabled: false } } })).violations
          .map(v => `${v.id}(${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' ; ')}`));
        if (res.length) fail(`${tag} ${where}: axe → ${res.join(' || ')}`);
      }
      const covered = await page.evaluate(() => document.querySelector('dialog[open]') ? [] : [...document.querySelectorAll('#navbar button, #navbar a')].filter(el => {
        const r = el.getBoundingClientRect(); if (!r.width) return false;
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return top && !el.contains(top);
      }).map(el => el.textContent.trim() || el.getAttribute('aria-label')));
      if (covered.length) fail(`${tag} ${where}: ปุ่มบน navbar ถูกบัง → ${covered.join(', ')}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 0) fail(`${tag} ${where}: เลื่อนแนวนอนเกิน ${overflow}px`);
    };

    await page.goto(`${BASE}/journey.html`);
    await page.waitForSelector('.story');
    await shot('1-home'); await audit('home');

    // Flow สำรวจตัวตน
    await page.click('.story');
    const answers = ['จังหวะที่ทำให้อยากขยับ', 'กีตาร์', 'เล่นกับเพื่อน', 'เล่นได้นิดหน่อย', 'ดูตัวอย่าง', ['มือถือ Android', 'คอม Windows', 'มีเครื่องดนตรีแล้ว'], 'ขอฟรีก่อน'];
    for (const [i, a] of answers.entries()) {
      await page.waitForSelector(`.flow-bar .count:text("${i + 1} จาก 7")`);
      if (i === 0) {
        if (await page.isEnabled('.flow-foot .btn-prominent')) fail(`${tag}: ปุ่มดำเนินการต่อต้องปิดจนกว่าจะเลือก`);
        await shot('2-flow'); await audit('flow');
      }
      for (const label of [].concat(a)) await page.click(`.flow .row:has-text("${label}")`);
      if (i === 5) await shot('3-flow-multi');
      await page.click('.flow-foot .btn-prominent');
    }
    await page.waitForSelector('.identity h1');
    const identity = await page.textContent('.identity h1');
    await shot('4-you'); await audit('you');
    await page.click('.nav-trailing >> text=เสร็จสิ้น');
    await page.waitForSelector('.story.returning');
    const recs = await page.$$eval('.list.apps .row-title', els => els.map(e => e.textContent));

    // ห้อง → sheet
    await page.click('.tile >> nth=1');
    await page.waitForSelector('.room-head');
    const roomName = await page.textContent('.room-head h1');
    await shot('5-room'); await audit('room');
    await page.click('.segmented button:has-text("ทั้งหมด")');
    await page.click('.app-row .row-main >> nth=0');
    await page.waitForSelector('dialog.sheet[open] #sheet-title');
    const hashWithSheet = await page.evaluate(() => location.hash);
    await page.waitForTimeout(300);
    await shot('6-sheet'); await audit('sheet');
    await page.click('.icon-toggle');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    const afterClose = await page.evaluate(() => ({ hash: location.hash, open: document.getElementById('sheet').open, focus: document.activeElement?.className }));
    if (afterClose.open || /\/app\//.test(afterClose.hash)) fail(`${tag}: ปิด sheet แล้ว URL/สถานะไม่คืน ${JSON.stringify(afterClose)}`);
    if (!/row-main/.test(afterClose.focus || '')) fail(`${tag}: โฟกัสไม่กลับไปที่แถวที่เปิด sheet (${afterClose.focus})`);
    // ปุ่มย้อนกลับ
    await page.click('#nav-leading button');
    await page.waitForTimeout(150);
    const backTo = await page.evaluate(() => location.hash);

    // แท็บที่บันทึกไว้ + แก้ไข
    await page.click('.tab:has-text("บันทึก")');
    await page.waitForSelector('h1:text("ที่บันทึกไว้")');
    const savedCount = await page.$$eval('.list.apps .app-row', els => els.length);
    if (savedCount !== 1) fail(`${tag}: ที่บันทึกไว้ควรมี 1 รายการ (ได้ ${savedCount})`);
    await audit('saved');

    // ค้นหา
    await page.click('.tab:has-text("ค้นหา")');
    await page.fill('.search-field input', 'จูน');
    await page.waitForTimeout(100);
    const found = await page.$$eval('.list.apps .row-title', els => els.map(e => e.textContent));
    await shot('7-search'); await audit('search');
    await page.fill('.search-field input', 'zzzz');
    await page.waitForSelector('.empty');
    await page.click('.clear-btn');
    // เปิดหน้าลึกโดยตรง (deep link) พร้อม sheet
    await page.goto(`${BASE}/journey.html#/room/studio/app/garageband`);
    await page.waitForSelector('dialog.sheet[open] #sheet-title');
    await page.click('.sheet-bar .circle-btn[aria-label="ปิด"]');
    await page.waitForTimeout(450);
    const deep = await page.evaluate(() => ({ hash: location.hash, open: document.getElementById('sheet').open }));
    if (deep.open || deep.hash !== '#/room/studio') fail(`${tag}: deep link ปิดแล้วไม่กลับหน้าห้อง ${JSON.stringify(deep)}`);
    // ยกเลิกการแก้คำตอบต้องคืนค่าเดิม
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('mil-journey-v1')).answers.listen);
    await page.goto(`${BASE}/journey.html#/you`);
    await page.click('.list .row:has-text("เวลาฟังเพลงที่ชอบ")');
    await page.click('.flow .row:has-text("เนื้อเพลงและเรื่องราว")');
    await page.click('.flow-bar button:has-text("ยกเลิก")');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('mil-journey-v1')).answers.listen);
    if (before !== after) fail(`${tag}: ยกเลิกแล้วคำตอบเปลี่ยน ${before} → ${after}`);
    // ลิงก์ข้ามไปเนื้อหาต้องไม่เปลี่ยนหน้า
    await page.goto(`${BASE}/journey.html#/search?q=จูน`);
    await page.waitForSelector('.search-field');
    await page.focus('.skip'); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    const skipHash = decodeURI(await page.evaluate(() => location.hash));
    if (skipHash !== '#/search?q=จูน') fail(`${tag}: ลิงก์ข้ามไปเนื้อหาเปลี่ยนหน้าเป็น ${skipHash}`);
    // ล้างข้อมูล (alert ยืนยัน)
    await page.goto(`${BASE}/journey.html#/you`);
    await page.click('.row.destructive');
    await page.waitForSelector('dialog.alert[open]');
    await shot('8-alert');
    await page.click('dialog.alert .destructive');
    await page.waitForSelector('.story:not(.returning)');

    if (errors.length) fail(`${tag}: JS error → ${errors.join(' | ')}`);
    report.push(`${tag}: ตัวตน=${identity} แนะนำ=${recs.join(', ')} ห้อง=${roomName} sheetURL=${hashWithSheet} ย้อนกลับ→${backTo} ค้น"จูน"=${found.join(', ')}`);
    await ctx.close();
  }
  console.log(report.join('\n'));
  await browser.close();
  process.exitCode = failed ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
