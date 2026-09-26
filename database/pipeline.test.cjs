'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { extractAll, parseMarkdown } = require('./lib/extract.cjs');
const { gateSource, gateDatabase, gatePlaces } = require('./lib/gates.cjs');
const { extractPlaces } = require('./lib/places.cjs');
const { classify } = require('./lib/classify.cjs');
const { createDatabase, load } = require('./lib/load.cjs');
const { build, parseCsv } = require('./build.cjs');
const { run } = require('./query.cjs');

test('Markdown: เก็บตาราง และลิงก์ทั้งในย่อหน้าและในแถวตาราง', () => {
  const doc = parseMarkdown('x.md', '# T\n## H\nดู [A](https://a.test/x)\n\n| k | v |\n|---|---|\n| 1 | [B](https://b.test) |\n| 2 | https://c.test |\n');
  assert.equal(doc.tables.length, 1);
  assert.deepEqual(doc.tables[0].headers, ['k', 'v']);
  assert.equal(doc.tables[0].rows.length, 2);
  assert.deepEqual(doc.links.map(l => l.url), ['https://a.test/x', 'https://b.test', 'https://c.test']);
  assert.equal(doc.links[1].heading, 'H');
});

test('CSV: รองรับเครื่องหมายคำพูดซ้อน comma และขึ้นบรรทัด', () => {
  const rows = parseCsv('"a","b"\r\n"1,2","say ""hi""\nok"\r\n');
  assert.deepEqual(rows, [{ a: '1,2', b: 'say "hi"\nok' }]);
});

test('Gate A ผ่านกับข้อมูลจริง และล้มเมื่อข้อมูลเสีย', () => {
  const x = extractAll();
  assert.equal(gateSource(x).pass, true);
  const broken = structuredClone(x);
  broken.portal.resources[0].url = 'http://insecure.test';
  broken.portal.resources[1].id = broken.portal.resources[2].id;
  broken.portal.rankings[0].picks[0].id = 'does-not-exist';
  const g = gateSource(broken);
  assert.equal(g.pass, false);
  assert.ok(g.errors.some(e => e.includes('HTTPS')));
  assert.ok(g.errors.some(e => e.includes('id ซ้ำ')));
  assert.ok(g.errors.some(e => e.includes('does-not-exist')));
});

test('Gate B: ฐานข้อมูลครบทุกแถว และจับได้เมื่อแถวหาย', () => {
  const x = extractAll();
  const db = createDatabase(':memory:');
  load(db, x);
  assert.equal(gateDatabase(db, x).pass, true);
  db.exec('DELETE FROM doc_links WHERE id=1');
  const g = gateDatabase(db, x);
  assert.equal(g.pass, false);
  assert.match(g.errors[0], /doc_links/);
  db.close();
});

test('build ครบวงจร + query บนไฟล์ฐานข้อมูลที่สร้าง', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'mil-db-'));
  const { ok, results } = build({ out, log: () => {} });
  assert.equal(ok, true);
  assert.deepEqual(results.map(r => r.gate), ['A-source', 'D-places', 'B-database', 'C-audit-drift']);
  const file = path.join(out, 'music-lab.db');
  const summary = run('summary', null, file);
  assert.equal(summary.find(r => r.table === 'resources').rows, 35);
  assert.equal(summary.filter(r => r.gate).length, 4);
  assert.ok(run('universities', 'แจ๊ส', file).length > 0);
  assert.ok(run('free-thai', null, file).every(r => r.thai === 1 || r.no_instrument === 1));
  assert.throws(() => run('sql', 'DELETE FROM resources', file), /SELECT/);
  const snap = JSON.parse(fs.readFileSync(path.join(out, 'snapshot.json'), 'utf8'));
  assert.equal(snap.resources.length, 35);
  fs.rmSync(out, { recursive: true, force: true });
});

test('Gate D: จับพิกัดผิดเขต แหล่ง Google Maps ชื่อซ้ำใกล้กัน และรายการที่ยังไม่ตรวจในเขตที่ค้นแล้ว', () => {
  const pd = extractPlaces();
  assert.equal(gatePlaces(pd).pass, true);
  assert.ok(!pd.places.some(p => /ทางรถไฟ|แม่กลอง/.test(p.name)), 'ทางรถไฟแม่กลองไม่ใช่สถานที่ดนตรี');
  assert.equal(new Set(pd.places.map(p => p.id)).size, pd.places.length, 'วัตถุคร่อมเขตต้องเหลือหนึ่งรายการ');
  const base = { id: 'cur:test-shop', name: 'ร้านทดสอบ', name_en: null, kind: 'instrument_store', excluded: false, district: 'ปทุมวัน',
    lat: 13.7462, lon: 100.5347, address: null, geocode: null, phone: null, website: null, social: [], hours: null, offer: [],
    source: 'web', source_url: 'https://example.com/shop', license: null, evidence: 'หน้าเจ้าของ', checked: '2026-09-26', review_note: null };
  const run = extra => gatePlaces({ ...pd, places: [...pd.places, ...extra] });
  assert.equal(run([base]).pass, true);
  assert.match(run([{ ...base, lat: 13.8026, lon: 100.5535 }]).errors.join(), /พิกัดอยู่ในเขตจตุจักร/);
  assert.match(run([{ ...base, source_url: 'https://www.google.com/maps/place/x' }]).errors.join(), /Google Maps/);
  assert.match(run([base, { ...base, id: 'cur:test-shop-2', lat: 13.7463 }]).errors.join(), /ซ้ำ/);
  assert.match(run([{ ...base, lat: 14.5, lon: 100.5 }]).errors.join(), /นอกกรุงเทพ/);
  const researched = { ...pd, progress: pd.progress.map(p => p.district === 'ปทุมวัน' ? { ...p, status: 'researched' } : p),
    places: [...pd.places, { ...base, id: 'osm:n1', source: 'osm', kind: 'unclassified' }] };
  assert.match(gatePlaces(researched).errors.join(), /ยังไม่จัดประเภท/);
});

test('classify: แยกร้าน โรงเรียน เวที และคัดสิ่งที่ไม่เกี่ยวออก', () => {
  assert.equal(classify({ shop: 'musical_instrument', name: 'x' }), 'instrument_store');
  assert.equal(classify({ name: 'สถาบันดนตรี เคพีเอ็น มิวสิค' }), 'school');
  assert.equal(classify({ name: 'Dumbo Jazz & Vinyl Bar' }), 'venue');
  assert.equal(classify({ name: 'Snake Handling Show', amenity: 'theatre' }), 'excluded');
  assert.equal(classify({ name: 'CU Symphony Orchestra' }), 'ensemble');
  assert.equal(classify({ amenity: 'studio', studio: 'radio', name: 'สถานีวิทยุ' }), 'broadcast');
});

test('classify: ร้านอาหาร/ชื่อสถานที่ที่บังเอิญมีคำดนตรีถูกคัดออก แต่คาเฟ่ดนตรียังเป็นเวที', () => {
  assert.equal(classify({ name: 'แม่กลอง หัวปลาหม้อไฟ', amenity: 'restaurant' }), 'excluded');
  assert.equal(classify({ name: 'ข้าวมันไก่ตลาดแม่กลอง' }), 'excluded');
  assert.equal(classify({ name: 'ร้านเป็ดน่องกลอง', amenity: 'restaurant' }), 'excluded');
  assert.equal(classify({ name: 'Music Cafe', amenity: 'cafe' }), 'venue');
  assert.equal(classify({ name: 'ร้านกลองชุดมือสอง' }), 'unclassified');
});
