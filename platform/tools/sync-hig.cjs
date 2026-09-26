'use strict';
// คัดลอก design tokens ของ Journey app (portal/journey.css หมวด 0–4: ตัวอักษร สี ฐาน วัสดุ) มาไว้ใน platform/public/hig-tokens.css
// platform มี CSP style-src 'self' จึงโหลด CSS ข้ามโฟลเดอร์ไม่ได้ — รันสคริปต์นี้ทุกครั้งที่แก้ tokens ใน journey.css
// ใช้: node tools/sync-hig.cjs
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', '..', 'portal', 'journey.css');
const OUT = path.join(__dirname, '..', 'public', 'hig-tokens.css');
const css = fs.readFileSync(SRC, 'utf8');
const end = css.indexOf('/* ───────── 5. โครงหน้า');
if (end < 0) throw new Error('ไม่พบหมวด 5 ใน journey.css — โครงไฟล์เปลี่ยน ต้องปรับสคริปต์');
// ตัดกฎที่ผูกกับคลาสของ Journey ออก เหลือแต่ token และกฎพื้นฐานที่ใช้ร่วมได้
const tokens = css.slice(0, end)
  .replace(/^\s*\.sheet \{[^}]*\}\s*$/m, '')
  .replace(/^\s*\.list, \.card, \.tile \{[^}]*\}\s*$/m, '')
  .replace(/^\.secondary \{[^}]*\}\s*$/m, '');
fs.writeFileSync(OUT, `/* สร้างอัตโนมัติจาก portal/journey.css หมวด 0–4 โดย platform/tools/sync-hig.cjs — อย่าแก้ไฟล์นี้โดยตรง */\n${tokens}`);
console.log(`hig-tokens.css: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
