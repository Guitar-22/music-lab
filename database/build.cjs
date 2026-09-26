'use strict';
// Pipeline: Extract → Gate A → Load → Gate B → Export → Gate C → รายงาน
// ใช้: node build.cjs [--strict]   (--strict ให้ warning ของ Gate C ทำให้ล้มด้วย)
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, extractAll } = require('./lib/extract.cjs');
const { gateSource, gateDatabase, gateAuditDrift, gatePlaces } = require('./lib/gates.cjs');
const { createDatabase, load, loadPlaces, recordGate } = require('./lib/load.cjs');
const { extractPlaces } = require('./lib/places.cjs');
const { loadDistricts } = require('./lib/geo.cjs');

const OUT = path.join(__dirname, 'out');

// CSV แบบ RFC 4180 (รองรับ "" และขึ้นบรรทัดในเครื่องหมายคำพูด)
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.some(Boolean));
  return body.map(r => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ''), r[i] ?? ''])));
}

function readAudits() {
  const dir = path.join(ROOT, 'audit');
  const out = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.csv'))) out[f] = parseCsv(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
}

function exportSnapshot(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
  const snap = {};
  for (const t of tables) snap[t] = db.prepare(`SELECT * FROM ${t}`).all().map(r => ({ ...r }));
  return snap;
}

function report(results, runAt) {
  const lines = [`# Gate report — ${runAt}`, ''];
  for (const r of results) {
    lines.push(`## ${r.pass ? '✅' : '❌'} ${r.gate}`, '', '```json', JSON.stringify(r.stats, null, 2), '```', '');
    for (const e of r.errors) lines.push(`- ❌ ${e}`);
    for (const w of r.warnings) lines.push(`- ⚠️ ${w}`);
    if (r.errors.length || r.warnings.length) lines.push('');
  }
  return lines.join('\n');
}

function build({ out = OUT, strict = false, log = console.log } = {}) {
  const runAt = new Date().toISOString();
  const results = [];
  const stop = r => {
    results.push(r);
    log(`${r.pass ? 'PASS' : 'FAIL'} ${r.gate}${r.warnings.length ? ` (${r.warnings.length} warnings)` : ''}`);
    return !r.pass;
  };
  fs.mkdirSync(out, { recursive: true });
  const finish = ok => {
    fs.writeFileSync(path.join(out, 'gate-report.md'), report(results, runAt));
    return { ok, results };
  };

  const extracted = extractAll();
  if (stop(gateSource(extracted))) return finish(false);
  extracted.placeData = extractPlaces();
  if (stop(gatePlaces(extracted.placeData))) return finish(false);

  // เขียนไฟล์ชั่วคราวก่อน แล้วสลับเมื่อผ่าน Gate B เพื่อไม่ทิ้งฐานข้อมูลเสียไว้แทนของเดิม
  const dbFile = path.join(out, 'music-lab.db');
  const tmp = dbFile + '.tmp';
  const db = createDatabase(tmp);
  try {
    load(db, extracted);
    loadPlaces(db, extracted.placeData, loadDistricts());
    if (stop(gateDatabase(db, extracted))) { db.close(); fs.rmSync(tmp); return finish(false); }

    const drift = gateAuditDrift(extracted, readAudits());
    if (strict && drift.warnings.length) { drift.pass = false; drift.errors.push(...drift.warnings.splice(0)); }
    const failed = stop(drift);
    for (const r of results) recordGate(db, r, runAt);
    fs.writeFileSync(path.join(out, 'snapshot.json'), JSON.stringify({ generatedAt: runAt, ...exportSnapshot(db) }, null, 1));
    // ส่งออกให้ portal เฉพาะ build จริง (test ที่เขียนลงโฟลเดอร์ชั่วคราวไม่แตะ portal)
    if (out === OUT && !failed) {
      const r = require('./lib/export-portal.cjs').exportPortal(db);
      log(`portal/places-data.js: ${r.places} แห่ง ${r.districts} เขต (${(r.bytes / 1024).toFixed(0)} KB)`);
    }
    db.close();
    fs.renameSync(tmp, dbFile);
    return finish(!failed);
  } catch (e) {
    try { db.close(); } catch {}
    fs.rmSync(tmp, { force: true });
    throw e;
  }
}

// ตรวจ Gate D แบบอ่านอย่างเดียว (ไม่เขียนไฟล์) ใช้ระหว่างเก็บข้อมูลรายเขต: node build.cjs --check [--district ปทุมวัน]
function check(district) {
  const r = gatePlaces(extractPlaces());
  const mine = m => !district || m.includes(district + '/') || m.includes('เขต' + district);
  const errors = r.errors.filter(mine), warnings = r.warnings.filter(mine);
  for (const e of errors) console.log('❌ ' + e);
  for (const w of warnings) console.log('⚠️ ' + w);
  console.log(`${errors.length ? 'FAIL' : 'PASS'} Gate D${district ? ' เขต' + district : ''}: ${errors.length} errors, ${warnings.length} warnings`);
  return errors.length === 0;
}

if (require.main === module && process.argv.includes('--check')) {
  const i = process.argv.indexOf('--district');
  process.exitCode = check(i > 0 ? process.argv[i + 1] : null) ? 0 : 1;
} else if (require.main === module) {
  const { ok } = build({ strict: process.argv.includes('--strict') });
  console.log(ok ? `เสร็จ: ${path.relative(ROOT, OUT)}/music-lab.db, snapshot.json, gate-report.md` : 'หยุดที่ Gate — ดู out/gate-report.md');
  process.exitCode = ok ? 0 : 1;
}

module.exports = { build, parseCsv, check };
