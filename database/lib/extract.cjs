'use strict';
// Task 1 — ดึงข้อมูลดิบจากทุกแหล่งในโครงการ: โมดูลข้อมูลของ portal และเอกสารวิจัย .md
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

// โหลดโมดูล portal ใหม่ทุกครั้ง (ล้าง cache) เพื่อให้ build ซ้ำได้ผลตรงกับไฟล์ล่าสุด
function freshRequire(file) {
  const full = path.join(ROOT, file);
  delete require.cache[require.resolve(full)];
  return require(full);
}

function extractPortal() {
  const { resources, categories, checked } = freshRequire('portal/resources.js');
  freshRequire('portal/editorial.js');
  const { previews, rankings } = globalThis.MILPro;
  const { universities, schools } = freshRequire('portal/institutions.js');
  const { zones } = freshRequire('portal/zones.js');
  return { resources, categories, checked, previews, rankings, universities, schools, zones };
}

const splitRow = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim());
const isDivider = line => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

// แยกตาราง Markdown และลิงก์ทุกตัวจากเอกสาร พร้อมหัวข้อที่ตารางนั้นอยู่
function parseMarkdown(file, text) {
  const lines = text.split(/\r?\n/);
  const title = (lines.find(l => /^#\s/.test(l)) || '').replace(/^#\s*/, '').trim() || file;
  const tables = [];
  const links = [];
  // หัวข้อของแต่ละบรรทัด ใช้ทั้งตอนเก็บลิงก์และตาราง
  const headingAt = [];
  let heading = title;
  lines.forEach((line, i) => {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) heading = h[2].trim();
    headingAt[i] = heading;
    for (const m of line.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)|(?<![(\[<])(https?:\/\/[^\s)|>\]]+)/g)) {
      links.push({ url: m[2] || m[3], text: m[1] || '', line: i + 1, heading });
    }
  });
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    heading = headingAt[i];
    if (line.trim().startsWith('|') && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const headers = splitRow(line);
      const rows = [];
      let j = i + 2;
      for (; j < lines.length && lines[j].trim().startsWith('|'); j++) rows.push(splitRow(lines[j]));
      tables.push({ heading, line: i + 1, headers, rows });
      i = j - 1;
    }
  }
  return { file, title, bytes: Buffer.byteLength(text), tables, links };
}

function extractDocuments() {
  return fs.readdirSync(ROOT)
    .filter(f => /^\d{2}-.*\.md$/.test(f))
    .sort()
    .map(f => parseMarkdown(f, fs.readFileSync(path.join(ROOT, f), 'utf8')));
}

function extractAll() {
  return { portal: extractPortal(), documents: extractDocuments() };
}

module.exports = { ROOT, extractAll, extractPortal, extractDocuments, parseMarkdown };
