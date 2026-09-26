'use strict';
// Gates — ด่านตรวจคุณภาพ แต่ละด่านคืน {gate, pass, errors, warnings, stats}
// errors = หยุด pipeline; warnings = บันทึกในรายงานแต่ไม่หยุด

// จำนวนขั้นต่ำที่เอกสาร README/23/25 ระบุไว้ ถ้าต่ำกว่าคือข้อมูลหาย
const EXPECTED_MIN = { resources: 35, universities: 25, schools: 11, districts: 50, documents: 24 };
const HTTPS = /^https:\/\/[^\s]+$/;

function gate(name, fn) {
  const errors = [];
  const warnings = [];
  const stats = {};
  fn({ err: m => errors.push(m), warn: m => warnings.push(m), stats });
  return { gate: name, pass: errors.length === 0, errors, warnings, stats };
}

const dupes = arr => [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))];

// Gate A — ข้อมูลต้นทางครบและถูกต้องก่อนเขียนลงฐานข้อมูล
function gateSource({ portal, documents }) {
  return gate('A-source', ({ err, warn, stats }) => {
    const { resources, categories, previews, rankings, universities, schools, zones } = portal;
    const districts = zones.flatMap(z => z.districts);
    Object.assign(stats, {
      resources: resources.length, categories: categories.length - 1, previews: Object.keys(previews).length,
      rankings: rankings.length, universities: universities.length, schools: schools.length,
      zones: zones.length, districts: districts.length, documents: documents.length,
      docTables: documents.reduce((n, d) => n + d.tables.length, 0),
      docLinks: documents.reduce((n, d) => n + d.links.length, 0),
    });
    for (const [k, min] of Object.entries(EXPECTED_MIN)) if (stats[k] < min) err(`${k}: พบ ${stats[k]} ต่ำกว่าที่เอกสารระบุ ${min}`);

    const ids = resources.map(r => r.id);
    for (const d of dupes(ids)) err(`resource id ซ้ำ: ${d}`);
    const catIds = new Set(categories.map(c => c[0]).filter(c => c !== 'all'));
    const COST = new Set(['free', 'freemium', 'trial', 'paid', 'subscription', 'varies']);
    for (const r of resources) {
      for (const k of ['id', 'name', 'owner', 'goal', 'first', 'costText', 'account', 'device', 'language', 'checked', 'note', 'sourceType'])
        if (!String(r[k] ?? '').trim()) err(`resource ${r.id}: ขาด ${k}`);
      if (!HTTPS.test(r.url)) err(`resource ${r.id}: url ไม่ใช่ HTTPS`);
      if (!HTTPS.test(r.source)) err(`resource ${r.id}: source ไม่ใช่ HTTPS`);
      if (!catIds.has(r.category)) err(`resource ${r.id}: หมวด ${r.category} ไม่มีในรายการหมวด`);
      if (!COST.has(r.cost)) err(`resource ${r.id}: cost ${r.cost} ไม่รู้จัก`);
      if (typeof r.thai !== 'boolean' || typeof r.noInstrument !== 'boolean') err(`resource ${r.id}: thai/noInstrument ต้องเป็น boolean`);
      for (const k of ['what', 'best', 'limit', 'next']) if (!r.guide?.[k]) err(`resource ${r.id}: guide.${k} ว่าง`);
      if (!Array.isArray(r.guide?.steps) || !r.guide.steps.length) err(`resource ${r.id}: guide.steps ว่าง`);
      for (const a of r.alternates || []) if (!HTTPS.test(a.url)) err(`resource ${r.id}: alternate ${a.name} ไม่ใช่ HTTPS`);
    }
    for (const c of catIds) if (!resources.some(r => r.category === c)) warn(`หมวด ${c} ยังไม่มีแหล่ง`);

    const idSet = new Set(ids);
    for (const [id, p] of Object.entries(previews)) {
      if (!idSet.has(id)) err(`preview ${id}: ไม่มี resource นี้`);
      if (!HTTPS.test(p.url) || !HTTPS.test(p.source)) err(`preview ${id}: ลิงก์ไม่ใช่ HTTPS`);
    }
    for (const r of rankings) for (const p of r.picks) {
      if (!idSet.has(p.id)) err(`ranking ${r.id}: pick ${p.id} ไม่มี resource นี้`);
      if (!HTTPS.test(p.evidenceUrl)) err(`ranking ${r.id}/${p.id}: evidenceUrl ไม่ใช่ HTTPS`);
    }
    for (const d of dupes(rankings.map(r => r.id))) err(`ranking id ซ้ำ: ${d}`);

    for (const d of dupes(universities.map(u => u.name + '|' + u.faculty))) err(`สถาบัน/คณะซ้ำ: ${d}`);
    for (const u of universities) {
      if (!HTTPS.test(u.url)) err(`${u.name}: url ไม่ใช่ HTTPS`);
      if (u.extra && !HTTPS.test(u.extra)) err(`${u.name}: extra ไม่ใช่ HTTPS`);
      if (!u.majors?.length) err(`${u.name}: ไม่มีสาขา`);
      for (const k of ['faculty', 'province', 'region', 'levels']) if (!u[k]) err(`${u.name}: ขาด ${k}`);
    }
    for (const d of dupes(schools.map(s => s.name))) err(`โรงเรียนซ้ำ: ${d}`);
    for (const s of schools) {
      if (!HTTPS.test(s.url)) err(`${s.name}: url ไม่ใช่ HTTPS`);
      if (s.locator && !HTTPS.test(s.locator)) err(`${s.name}: locator ไม่ใช่ HTTPS`);
      if (!s.genres?.length) err(`${s.name}: ไม่มีแนวเพลง`);
    }
    for (const d of dupes(districts)) err(`เขตซ้ำ: ${d}`);
    for (const d of dupes(zones.map(z => z.id))) err(`โซนซ้ำ: ${d}`);

    for (const doc of documents) {
      if (!doc.tables.length && !doc.links.length) warn(`${doc.file}: ไม่มีตารางหรือลิงก์`);
      for (const t of doc.tables) for (const [i, row] of t.rows.entries())
        if (row.length !== t.headers.length) warn(`${doc.file}:${t.line + 2 + i} จำนวนคอลัมน์ ${row.length} ≠ หัวตาราง ${t.headers.length}`);
    }
  });
}

// Gate B — หลังเขียน: จำนวนแถวตรงต้นทาง และ foreign key ไม่ขาด
function gateDatabase(db, extracted) {
  return gate('B-database', ({ err, stats }) => {
    const { portal, documents } = extracted;
    const count = t => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n;
    const expect = {
      categories: portal.categories.length - 1,
      resources: portal.resources.length,
      resource_guide_steps: portal.resources.reduce((n, r) => n + r.guide.steps.length, 0),
      resource_alternates: portal.resources.reduce((n, r) => n + (r.alternates?.length || 0), 0),
      resource_previews: Object.keys(portal.previews).length,
      rankings: portal.rankings.length,
      ranking_picks: portal.rankings.reduce((n, r) => n + r.picks.length, 0),
      universities: portal.universities.length,
      university_majors: portal.universities.reduce((n, u) => n + u.majors.length, 0),
      school_groups: portal.schools.length,
      school_genres: portal.schools.reduce((n, s) => n + s.genres.length, 0),
      school_branches: portal.schools.reduce((n, s) => n + (s.branches?.length || 0), 0),
      zones: portal.zones.length,
      districts: portal.zones.reduce((n, z) => n + z.districts.length, 0),
      documents: documents.length,
      doc_tables: documents.reduce((n, d) => n + d.tables.length, 0),
      doc_table_rows: documents.reduce((n, d) => n + d.tables.reduce((m, t) => m + t.rows.length, 0), 0),
      doc_links: documents.reduce((n, d) => n + d.links.length, 0),
    };
    if (extracted.placeData) {
      const pd = extracted.placeData;
      Object.assign(expect, {
        places: pd.places.length,
        place_rejects: pd.rejects.length,
        district_progress: pd.progress.length,
        place_social: new Set(pd.places.flatMap(p => p.social.map(s => p.id + '|' + s))).size,
        place_offer: new Set(pd.places.flatMap(p => p.offer.map(o => p.id + '|' + o))).size,
      });
    }
    for (const [table, n] of Object.entries(expect)) {
      const got = count(table);
      stats[table] = got;
      if (got !== n) err(`${table}: ในฐานข้อมูล ${got} แถว แต่ต้นทาง ${n}`);
    }
    const fk = db.prepare('PRAGMA foreign_key_check').all();
    for (const v of fk) err(`FK ขาด: ${v.table} rowid ${v.rowid} → ${v.parent}`);
    const ok = db.prepare('PRAGMA integrity_check').get();
    if (Object.values(ok)[0] !== 'ok') err('integrity_check ไม่ผ่าน');
  });
}

// Gate C — เทียบ audit/*.csv (snapshot เดิม) กับข้อมูลปัจจุบัน; ค้างงานเป็น warning
function gateAuditDrift(extracted, audits) {
  return gate('C-audit-drift', ({ warn, stats }) => {
    const { portal } = extracted;
    const pairs = [
      ['resource-audit.csv', portal.resources.map(r => r.id), 'id'],
      ['university-audit.csv', portal.universities.map(u => u.name + '|' + u.faculty), r => r.name + '|' + r.faculty],
      ['school-group-audit.csv', portal.schools.map(s => s.name), 'name'],
      ['bangkok-district-audit.csv', portal.zones.flatMap(z => z.districts), 'district'],
    ];
    for (const [file, current, key] of pairs) {
      const rows = audits[file];
      if (!rows) { warn(`${file}: ไม่พบไฟล์`); continue; }
      const k = typeof key === 'function' ? key : r => r[key];
      const inCsv = new Set(rows.map(k));
      const cur = new Set(current);
      const missing = current.filter(x => !inCsv.has(x));
      const extra = [...inCsv].filter(x => !cur.has(x));
      stats[file] = { csv: rows.length, current: current.length, missing: missing.length, extra: extra.length };
      if (missing.length) warn(`${file}: ล้าสมัย ขาด ${missing.length} รายการ (${missing.join(', ')}) — รัน audit/build-audits.cjs ใหม่`);
      if (extra.length) warn(`${file}: มีรายการที่ไม่อยู่ในข้อมูลแล้ว (${extra.join(', ')})`);
      const pending = rows.filter(r => Object.values(r).some(v => /^(not_|needs_|missing$)/.test(v))).length;
      stats[file].pendingRows = pending;
    }
  });
}

// Gate D — สถานที่รายเขต (OSM + ค้นเว็บ) ก่อนเขียนลงฐานข้อมูล
function gatePlaces({ places, rejects, progress, reviewKeys }) {
  const { KINDS } = require('./classify.cjs');
  const { districtOf, inBangkok, distance, distanceToRings, loadDistricts } = require('./geo.cjs');
  const { DISTRICTS } = require('./districts.cjs');
  return gate('D-places', ({ err, warn, stats }) => {
    const shapes = loadDistricts();
    if (shapes.length !== 50) err(`ขอบเขตเขตมี ${shapes.length}/50 — รัน collect/boundaries.cjs`);
    const researched = new Set(progress.filter(p => p.status === 'researched').map(p => p.district));
    Object.assign(stats, {
      places: places.length, rejected: rejects.length,
      mapped: places.filter(p => p.lat != null).length,
      byKind: places.reduce((m, p) => ({ ...m, [p.kind]: (m[p.kind] || 0) + 1 }), {}),
      districts: Object.fromEntries(['not_started', 'osm_only', 'researched'].map(s => [s, progress.filter(p => p.status === s).length])),
    });
    for (const d of dupes(places.map(p => p.id))) err(`id สถานที่ซ้ำ: ${d}`);
    const names = new Set(DISTRICTS.map(d => d.name));
    for (const p of places) {
      const tag = `${p.district}/${p.id}`;
      if (!p.name) err(`${tag}: ไม่มีชื่อ`);
      if (!names.has(p.district)) err(`${tag}: เขต ${p.district} ไม่รู้จัก`);
      if (!KINDS[p.kind] || p.kind === 'excluded') err(`${tag}: kind ${p.kind} ไม่ถูกต้อง`);
      if (p.kind === 'unclassified') (researched.has(p.district) ? err : warn)(`${tag} "${p.name}": ยังไม่จัดประเภท — ใส่ใน review`);
      if (p.source === 'web') {
        if (!/^cur:[a-z0-9-]+$/.test(p.id)) err(`${tag}: id ต้องเป็น cur:ตัวพิมพ์เล็ก-ขีด`);
        if (!/^https:\/\//.test(p.source_url || '')) err(`${tag}: source_url ต้องเป็น https`);
        if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(p.source_url || '')) err(`${tag}: ห้ามใช้ Google Maps เป็นแหล่งข้อมูล`);
        if (!p.evidence) warn(`${tag}: ไม่มี evidence`);
        if (!p.checked) err(`${tag}: ไม่มีวันที่ตรวจ`);
      }
      if (p.source === 'chain') {
        if (!/^[a-z]+:[A-Za-z0-9-]+$/.test(p.id)) err(`${tag}: id ของ chain ไม่ถูกต้อง`);
        if (!/^https:\/\//.test(p.source_url || '')) err(`${tag}: source_url ต้องเป็น https`);
      }
      if (p.website && !/^https?:\/\//.test(p.website)) err(`${tag}: website ไม่ใช่ URL`);
      if (p.lat == null) { warn(`${tag} "${p.name}": ไม่มีพิกัด (${p.geocode ? 'geocode ไม่พบ/ยังไม่รัน' : 'ไม่มี geocode'})`); continue; }
      if (p.geocodeApprox) warn(`${tag} "${p.name}": พิกัดโดยประมาณจากคำค้น "${p.geocodeApprox}" — ควรระบุ geocode ที่เจาะจงกว่านี้`);
      if (!inBangkok(p)) { err(`${tag}: พิกัดนอกกรุงเทพฯ (${p.lat}, ${p.lon})`); continue; }
      const found = districtOf(p);
      if (shapes.length && found !== p.district) {
        const own = shapes.find(s => s.name === p.district);
        const gap = own ? distanceToRings(p, own.rings) : Infinity;
        (gap > 300 ? err : warn)(`${tag} "${p.name}": พิกัดอยู่ในเขต${found || 'นอกขอบเขต'} ห่างเขตที่ระบุ ${Math.round(gap)} ม.`);
      }
    }
    // ชื่อเดียวกันในระยะ 150 ม. = ซ้ำ (มักเป็น OSM กับค้นเว็บ)
    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
    const withPos = places.filter(p => p.lat != null);
    for (let i = 0; i < withPos.length; i++) for (let j = i + 1; j < withPos.length; j++) {
      const a = withPos[i], b = withPos[j];
      const same = [a.name, a.name_en].some(x => x && [b.name, b.name_en].some(y => y && norm(x) === norm(y)));
      if (same && distance(a, b) < 150) err(`ซ้ำ: ${a.id} กับ ${b.id} "${a.name}" ห่าง ${Math.round(distance(a, b))} ม.`);
    }
    for (const r of rejects.filter(x => x.reason === 'chain_needs_review')) warn(`${r.district}/${r.id}: ตัวแทนอยู่ใกล้สถานที่เดิม (${r.note}) — ตัดสินใน sources/chains/*-review.json`);
    const known = new Set([...places.map(p => p.id), ...rejects.map(r => r.id)]);
    for (const r of reviewKeys) if (!known.has(r.id)) warn(`${r.file}: review ${r.id} ไม่มีในข้อมูล OSM ของเขตนี้`);
  });
}

module.exports = { gateSource, gateDatabase, gateAuditDrift, gatePlaces, EXPECTED_MIN };
