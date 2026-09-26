'use strict';
// API ของ Ecosystem ดนตรี: แผนที่/สถานที่ (อ่านจาก database/out/music-lab.db ที่ผ่าน Gate แล้ว)
// และ loop ที่ผู้ใช้สร้างข้อมูล: รายงานข้อมูลผิด เคลม/แก้สถานที่ บันทึก แผนซ้อม (เก็บใน store.json)
// อ้างอิง: docs/5-product/05-app-loops-journey-ux-spec.md
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ROLE_GROUPS } = require('./model');

const DEFAULT_DB = path.join(__dirname, '..', 'database', 'out', 'music-lab.db');
const REPORT_REASONS = { closed: ['ปิดกิจการแล้ว', 3], not_music: ['ไม่เกี่ยวกับดนตรี', 3], moved: ['ย้ายที่ตั้ง', 2], contact_wrong: ['เวลา/เบอร์/เว็บผิด', 1], other: ['อื่น ๆ', 1] };
const SAFE_FIELDS = ['hours', 'phone', 'website', 'social', 'offer'];
const RISKY_FIELDS = ['name', 'kind', 'address'];
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const id = prefix => `${prefix}-${crypto.randomUUID()}`;

// ข้อมูลสถานที่อ่านครั้งเดียวและโหลดใหม่เมื่อไฟล์ฐานข้อมูลถูก build ใหม่
function placeSource(dbFile) {
  let cache = null, mtime = 0;
  return () => {
    let stat;
    try { stat = fs.statSync(dbFile); } catch { return null; }
    if (cache && stat.mtimeMs === mtime) return cache;
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(dbFile, { readOnly: true });
    try {
      const rows = sql => db.prepare(sql).all().map(r => ({ ...r }));
      const has = rows("SELECT name FROM sqlite_master WHERE type='table' AND name='places'").length > 0;
      if (!has) return null;
      const social = rows('SELECT * FROM place_social'), offer = rows('SELECT * FROM place_offer');
      const places = rows('SELECT * FROM places ORDER BY district, name').map(p => ({
        ...p, social: social.filter(s => s.place_id === p.id).map(s => s.url), offer: offer.filter(o => o.place_id === p.id).map(o => o.item),
      }));
      const zones = Object.fromEntries(rows('SELECT name, zone_id FROM districts').map(d => [d.name, d.zone_id]));
      const districts = rows('SELECT p.*, s.rings FROM district_progress p JOIN district_shapes s ON s.district=p.district').map(d => ({
        name: d.district, zone: zones[d.district], wave: d.wave, status: d.status, osmPlaces: d.osm_places, webPlaces: d.web_places,
        gaps: JSON.parse(d.gaps), rings: JSON.parse(d.rings), researchedAt: d.researched_at,
      }));
      const lastGate = rows("SELECT gate, pass, run_at FROM gate_runs WHERE run_at=(SELECT MAX(run_at) FROM gate_runs)");
      cache = { places, districts, lastGate }; mtime = stat.mtimeMs;
      return cache;
    } finally { db.close(); }
  };
}

function migrate(data) {
  for (const k of ['reports', 'claims', 'edits', 'practice', 'suggestions']) if (!Array.isArray(data[k])) data[k] = [];
  for (const k of ['overrides', 'saved', 'plans']) if (!data[k] || typeof data[k] !== 'object') data[k] = {};
  if (!Array.isArray(data.hiddenPlaces)) data.hiddenPlaces = [];
  return data;
}

const mapsLink = p => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.lat != null ? `${p.name} ${p.lat},${p.lon}` : `${p.name} ${p.district} กรุงเทพมหานคร`);

function present(p, data) {
  const o = data.overrides[p.id] || {};
  const claim = data.claims.find(c => c.placeId === p.id && c.status === 'approved');
  return { ...p, ...o.values, mapsUrl: mapsLink(p), ownerVerified: Boolean(claim), ownerEditedAt: o.editedAt || null,
    freshness: o.editedAt ? { date: o.editedAt.slice(0, 10), by: 'เจ้าของสถานที่' } : { date: p.checked, by: p.source === 'osm' ? 'OpenStreetMap' : p.source === 'community' ? 'ผู้ใช้เสนอ · ผู้ดูแลตรวจแล้ว' : p.source === 'chain' ? 'รายชื่อตัวแทนทางการของแบรนด์' : 'เว็บเจ้าของ/ห้าง' } };
}

// คำแนะนำอุปกรณ์ (UC-09) — ยังไม่ซื้อจนกว่าจะมั่นใจ; งบเป็นช่วงคร่าว ๆ จาก docs/2-ecosystem/02-costs-and-income.md
function gearAdvice({ instrument, budget, confidence }) {
  const b = Number(budget) || 0, c = Number(confidence) || 1;
  const options = [
    { id: 'borrow', title: 'ยืมหรือใช้เครื่องที่โรงเรียน/ห้องซ้อม', when: c <= 2, why: 'ยังไม่แน่ใจว่าจะเล่นต่อ ลองก่อน 4–8 สัปดาห์โดยไม่ลงเงิน', kinds: ['school', 'rehearsal'] },
    { id: 'rent', title: 'เช่ารายเดือน', when: c <= 2 && b >= 500, why: 'ได้เครื่องไว้ซ้อมที่บ้านโดยไม่ผูกมัด ถามร้านว่าเงินเช่าหักเป็นส่วนลดตอนซื้อได้หรือไม่', kinds: ['instrument_store'] },
    { id: 'used', title: 'ซื้อมือสอง + ให้ร้านซ่อมตรวจ', when: b >= 1500 && b < 6000, why: 'ประหยัดกว่าใหม่ แต่ควรให้ช่างตรวจคอ/ลูกบิด/คีย์ก่อนจ่าย', kinds: ['repair_luthier', 'instrument_store'] },
    { id: 'new', title: 'ซื้อใหม่รุ่นเริ่มต้น', when: c >= 3 && b >= 3000, why: 'มั่นใจแล้วและต้องการประกัน/บริการหลังการขาย', kinds: ['instrument_store'] },
  ];
  const picked = options.filter(o => o.when);
  if (!picked.length) picked.push(options[0]);
  return { instrument: text(instrument, 40) || 'เครื่องดนตรี', options: picked.map(({ when, ...o }) => o),
    note: /ระนาด|ขิม|ซอ|ดนตรีไทย/.test(instrument || '') ? 'เครื่องดนตรีไทยมักยืมได้ที่ศูนย์เรียน/ชุมชน ลองถามก่อนซื้อ' : null };
}

function weekIndex(startedAt, date) { return Math.floor((new Date(date) - new Date(startedAt)) / (7 * 864e5)); }

function planSummary(plan, logs) {
  if (!plan) return null;
  const now = new Date().toISOString();
  const week = Math.max(0, Math.min(7, weekIndex(plan.startedAt, now)));
  const byWeek = Array.from({ length: 8 }, (_, i) => logs.filter(l => weekIndex(plan.startedAt, l.date) === i).reduce((n, l) => n + l.minutes, 0));
  let streak = 0;
  for (let i = week - 1; i >= 0 && byWeek[i] >= plan.minutesPerWeek; i--) streak++;
  if (byWeek[week] >= plan.minutesPerWeek) streak++;
  return { ...plan, week: week + 1, byWeek, thisWeek: byWeek[week], streakWeeks: streak, totalMinutes: logs.reduce((n, l) => n + l.minutes, 0), recent: logs.slice(-5).reverse() };
}

function planWeeks(goal, instrument) {
  const focus = ['ตั้งท่าและเสียงพื้นฐาน', 'จังหวะช้าด้วยเมโทรนอม', 'ท่อนแรกของเพลงเป้าหมาย', 'ต่อท่อนและเปลี่ยนคอร์ด/โน้ต', 'เพิ่มความเร็วทีละน้อย', 'อัดเสียงตัวเองแล้วฟังจุดพลาด', 'เล่นทั้งเพลงให้คนอื่นฟัง', 'ทบทวนและตั้งเป้าหมายรอบถัดไป'];
  return focus.map((f, i) => ({ week: i + 1, focus: `${f}${i === 2 || i === 6 ? ` — ${goal}` : ''}`, instrument }));
}

function createEcosystem({ dbFile = DEFAULT_DB } = {}) {
  const source = placeSource(dbFile);
  const need = () => { const s = source(); if (!s) throw Object.assign(new Error('ยังไม่มีฐานข้อมูลสถานที่ — รัน npm run build ในโฟลเดอร์ database'), { status: 503 }); return s; };

  // คืน true เมื่อจัดการ request แล้ว
  async function handle(ctx) {
    const { m, url, res, req, json, fail, body, requireRole, currentPersona, transaction, getData } = ctx;
    let p;
    try { p = decodeURIComponent(ctx.p); } catch { throw fail(400, 'เส้นทางไม่ถูกต้อง'); } // id สถานที่มี ":" ที่ถูก encode เป็น %3A
    const member = () => { const a = requireRole(req); if (!ROLE_GROUPS.member.includes(a.role)) throw fail(403, 'บทบาทนี้ใช้ฟังก์ชันนี้ไม่ได้'); return a; };
    const KINDS = require('../database/lib/classify.cjs').KINDS;
    // สถานที่ที่ผู้ใช้เสนอและผู้ดูแลยอมรับแล้ว แสดงร่วมกับข้อมูลจากฐานข้อมูล (ยังไม่มีพิกัด จึงอยู่ในรายการแต่ไม่ปักหมุด)
    const community = data => data.suggestions.filter(x => x.status === 'accepted').map(x => ({ id: x.placeId, name: x.name, name_en: null, kind: x.kind, layer: KINDS[x.kind].layer, district: x.district,
      lat: null, lon: null, address: x.address || null, phone: null, website: /^https:/.test(x.link || '') ? x.link : null, hours: null, social: [], offer: [],
      source: 'community', source_url: x.link || '', license: null, evidence: x.note, checked: (x.reviewedAt || x.createdAt).slice(0, 10), review_note: null }));
    const visible = (s, data) => [...s.places, ...community(data)].filter(x => !data.hiddenPlaces.includes(x.id));
    const findPlace = (s, data, id) => [...s.places, ...community(data)].find(x => x.id === id);

    if (p === '/api/districts' && m === 'GET') {
      const s = need();
      const data = getData();
      const shown = visible(s, data);
      return json(res, 200, { districts: s.districts.map(d => ({ ...d, count: shown.filter(x => x.district === d.name).length,
        layers: shown.filter(x => x.district === d.name).reduce((o, x) => ({ ...o, [x.layer]: (o[x.layer] || 0) + 1 }), {}) })), lastGate: s.lastGate,
        kinds: require('../database/lib/classify.cjs').KINDS, reasons: Object.fromEntries(Object.entries(REPORT_REASONS).map(([k, v]) => [k, v[0]])) }), true;
    }
    if (p === '/api/places' && m === 'GET') {
      const s = need(), data = getData();
      const q = (url.searchParams.get('q') || '').toLowerCase(), district = url.searchParams.get('district') || '', layer = url.searchParams.get('layer') || '', kind = url.searchParams.get('kind') || '';
      const rows = visible(s, data).map(x => present(x, data)).filter(x => (!district || x.district === district) && (!layer || x.layer === layer) && (!kind || kind.split(',').includes(x.kind))
        && (!q || [x.name, x.name_en, x.address, ...(x.offer || [])].some(v => v && v.toLowerCase().includes(q))) && (layer === 'review' || x.layer !== 'review' || kind === 'unclassified'));
      return json(res, 200, { places: rows }), true;
    }
    let match = p.match(/^\/api\/places\/([a-z]+:[\w-]+)$/);
    if (match && m === 'GET') {
      const s = need(), data = getData(), x = findPlace(s, data, match[1]);
      if (!x || data.hiddenPlaces.includes(x.id)) throw fail(404, 'ไม่พบสถานที่');
      const actor = currentPersona(req);
      return json(res, 200, { place: present(x, data), mySaved: Boolean(actor && (data.saved[actor.id] || []).includes(x.id)),
        myReports: actor ? data.reports.filter(r => r.placeId === x.id && r.reporterId === actor.id) : [],
        claim: data.claims.filter(c => c.placeId === x.id && ['pending', 'approved'].includes(c.status)).map(c => ({ status: c.status, mine: Boolean(actor && c.ownerId === actor.id) }))[0] || null }), true;
    }

    // L8 รายงานข้อมูลผิด
    match = p.match(/^\/api\/places\/([a-z]+:[\w-]+)\/reports$/);
    if (match && m === 'POST') {
      const actor = member(), input = await body(req);
      if (!REPORT_REASONS[input.reason]) throw fail(400, 'เลือกเหตุผลที่รายงาน');
      const note = text(input.note, 300);
      if (input.reason === 'other' && note.length < 5) throw fail(400, 'กรุณาอธิบายสั้น ๆ');
      const x = need().places.find(y => y.id === match[1]);
      if (!x) throw fail(404, 'ไม่พบสถานที่');
      const report = await transaction(db => {
        migrate(db);
        if (db.reports.some(r => r.placeId === x.id && r.reporterId === actor.id && r.status === 'open')) throw fail(409, 'คุณรายงานสถานที่นี้ไว้แล้ว รอผู้ดูแลตรวจ');
        const r = { id: id('report'), placeId: x.id, placeName: x.name, district: x.district, reporterId: actor.id, reporterName: actor.name, reason: input.reason, note, status: 'open', resolution: '', createdAt: new Date().toISOString(), resolvedAt: null };
        db.reports.push(r);
        return r;
      });
      return json(res, 201, { report }), true;
    }

    // L8 เสนอสถานที่ที่ยังไม่มี (ช่องว่างใหญ่: ห้องซ้อม/สตูดิโอที่มีแค่เพจ Facebook)
    if (p === '/api/places/suggest' && m === 'POST') {
      const actor = member(), input = await body(req), s = need();
      const name = text(input.name, 120), address = text(input.address, 200), link = text(input.link, 300), note = text(input.note, 300);
      if (name.length < 2) throw fail(400, 'กรุณาใส่ชื่อสถานที่');
      if (!KINDS[input.kind] || ['excluded', 'unclassified'].includes(input.kind)) throw fail(400, 'เลือกประเภทสถานที่');
      if (!s.districts.some(d => d.name === input.district)) throw fail(400, 'เลือกเขต');
      if (link && !/^https:\/\//.test(link)) throw fail(400, 'ลิงก์ต้องขึ้นต้นด้วย https://');
      if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl/.test(link)) throw fail(400, 'ใช้ลิงก์เพจ/เว็บของสถานที่ ไม่ใช้ลิงก์ Google Maps');
      if (!link && address.length < 8) throw fail(400, 'ใส่ลิงก์เพจ/เว็บ หรือที่อยู่อย่างน้อยหนึ่งอย่าง');
      const norm = v => v.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
      const suggestion = await transaction(db => {
        migrate(db);
        const dup = visible(s, db).find(x => x.district === input.district && norm(x.name) === norm(name))
          || db.suggestions.find(x => x.status === 'pending' && x.district === input.district && norm(x.name) === norm(name));
        if (dup) throw fail(409, 'มีสถานที่ชื่อนี้ในเขตนี้แล้วหรือกำลังรอตรวจ');
        const x = { id: id('suggest'), placeId: 'usr:' + crypto.randomUUID().slice(0, 8), name, kind: input.kind, district: input.district, address, link, note, byId: actor.id, byName: actor.name, status: 'pending', createdAt: new Date().toISOString() };
        db.suggestions.push(x);
        return x;
      });
      return json(res, 201, { suggestion }), true;
    }

    // L8 คิวผู้ดูแล: รายงาน + การแก้ฟิลด์เสี่ยง + คำขอเคลม เรียงตามความเสี่ยงแล้วตามอายุคิว
    if (p === '/api/admin/queue' && m === 'GET') {
      requireRole(req, 'admin');
      const data = getData();
      const items = [
        ...data.reports.filter(r => r.status === 'open').map(r => ({ type: 'report', id: r.id, placeId: r.placeId, placeName: r.placeName, district: r.district, risk: REPORT_REASONS[r.reason][1], title: REPORT_REASONS[r.reason][0], detail: r.note, by: r.reporterName, createdAt: r.createdAt })),
        ...data.edits.filter(e => e.status === 'pending').map(e => ({ type: 'edit', id: e.id, placeId: e.placeId, placeName: e.placeName, district: e.district, risk: 2, title: 'เจ้าของขอแก้ ' + Object.keys(e.values).join(', '), detail: JSON.stringify(e.values), by: e.ownerName, createdAt: e.createdAt })),
        ...data.suggestions.filter(x => x.status === 'pending').map(x => ({ type: 'suggestion', id: x.id, placeId: x.placeId, placeName: x.name, district: x.district, risk: 1, title: 'เสนอสถานที่ใหม่: ' + KINDS[x.kind].label, detail: [x.address, x.link, x.note].filter(Boolean).join(' · '), by: x.byName, createdAt: x.createdAt })),
        ...data.claims.filter(c => c.status === 'pending').map(c => ({ type: 'claim', id: c.id, placeId: c.placeId, placeName: c.placeName, district: c.district, risk: 2, title: 'ขอเคลมเป็นเจ้าของ', detail: c.evidence, by: c.ownerName, createdAt: c.createdAt })),
      ].sort((a, b) => b.risk - a.risk || a.createdAt.localeCompare(b.createdAt));
      return json(res, 200, { items }), true;
    }
    match = p.match(/^\/api\/admin\/(report|edit|claim|suggestion)\/([\w-]+)\/resolve$/);
    if (match && m === 'POST') {
      const admin = requireRole(req, 'admin'), input = await body(req);
      if (!['accepted', 'rejected'].includes(input.decision)) throw fail(400, 'ผลตรวจไม่ถูกต้อง');
      const note = text(input.note, 300);
      if (input.decision === 'rejected' && note.length < 5) throw fail(400, 'กรุณาบอกเหตุผล');
      const [, type, itemId] = match;
      const item = await transaction(db => {
        migrate(db);
        const list = { report: db.reports, edit: db.edits, claim: db.claims, suggestion: db.suggestions }[type];
        const x = list.find(y => y.id === itemId);
        if (!x) throw fail(404, 'ไม่พบรายการ');
        const open = type === 'report' ? 'open' : 'pending';
        if (x.status !== open) throw fail(409, 'รายการนี้ตรวจแล้ว');
        const now = new Date().toISOString();
        if (type === 'suggestion') { x.status = input.decision; x.reviewNote = note; x.reviewedAt = now; }
        else if (type === 'report') {
          x.status = input.decision; x.resolution = note || 'ตรวจแล้ว'; x.resolvedAt = now; x.resolvedBy = admin.id;
          if (input.decision === 'accepted' && ['closed', 'not_music'].includes(x.reason) && !db.hiddenPlaces.includes(x.placeId)) db.hiddenPlaces.push(x.placeId);
        } else if (type === 'edit') {
          x.status = input.decision === 'accepted' ? 'approved' : 'rejected'; x.reviewNote = note; x.reviewedAt = now;
          if (x.status === 'approved') { const o = db.overrides[x.placeId] || { values: {} }; Object.assign(o.values, x.values); o.editedAt = now; db.overrides[x.placeId] = o; }
        } else {
          if (input.decision === 'accepted' && db.claims.some(c => c.placeId === x.placeId && c.status === 'approved')) throw fail(409, 'สถานที่นี้มีเจ้าของที่ยืนยันแล้ว');
          x.status = input.decision === 'accepted' ? 'approved' : 'rejected'; x.reviewNote = note; x.reviewedAt = now;
        }
        return x;
      });
      return json(res, 200, { item }), true;
    }

    // L7 เคลมและแก้ข้อมูล
    match = p.match(/^\/api\/places\/([a-z]+:[\w-]+)\/claim$/);
    if (match && m === 'POST') {
      const actor = requireRole(req);
      if (!ROLE_GROUPS.provider.includes(actor.role)) throw fail(403, 'เคลมได้เฉพาะครู ร้าน หรือเวที');
      const input = await body(req), evidence = text(input.evidence, 300);
      if (evidence.length < 10) throw fail(400, 'กรุณาบอกหลักฐานความเป็นเจ้าของ เช่น เพจทางการหรือเบอร์ร้าน');
      const x = need().places.find(y => y.id === match[1]);
      if (!x) throw fail(404, 'ไม่พบสถานที่');
      const claim = await transaction(db => {
        migrate(db);
        if (db.claims.some(c => c.placeId === x.id && ['pending', 'approved'].includes(c.status))) throw fail(409, 'สถานที่นี้มีคำขอเคลมหรือเจ้าของแล้ว');
        const c = { id: id('claim'), placeId: x.id, placeName: x.name, district: x.district, ownerId: actor.id, ownerName: actor.name, evidence, status: 'pending', createdAt: new Date().toISOString() };
        db.claims.push(c);
        return c;
      });
      return json(res, 201, { claim }), true;
    }
    match = p.match(/^\/api\/places\/([a-z]+:[\w-]+)\/edit$/);
    if (match && m === 'POST') {
      const actor = requireRole(req), input = await body(req);
      const x = need().places.find(y => y.id === match[1]);
      if (!x) throw fail(404, 'ไม่พบสถานที่');
      const safe = {}, risky = {};
      for (const k of SAFE_FIELDS) if (k in input) safe[k] = Array.isArray(input[k]) ? input[k].map(v => text(v, 120)).filter(Boolean).slice(0, 10) : text(input[k], 160) || null;
      for (const k of RISKY_FIELDS) if (k in input) risky[k] = text(input[k], 160);
      if (safe.website && !/^https?:\/\//.test(safe.website)) throw fail(400, 'เว็บไซต์ต้องขึ้นต้นด้วย http(s)://');
      if (risky.kind !== undefined && !require('../database/lib/classify.cjs').KINDS[risky.kind]) throw fail(400, 'ประเภทไม่ถูกต้อง');
      if (!Object.keys(safe).length && !Object.keys(risky).length) throw fail(400, 'ไม่มีข้อมูลที่แก้');
      const result = await transaction(db => {
        migrate(db);
        if (!db.claims.some(c => c.placeId === x.id && c.ownerId === actor.id && c.status === 'approved')) throw fail(403, 'แก้ได้เฉพาะเจ้าของที่ได้รับการยืนยัน');
        const now = new Date().toISOString();
        if (Object.keys(safe).length) { const o = db.overrides[x.id] || { values: {} }; Object.assign(o.values, safe); o.editedAt = now; db.overrides[x.id] = o; }
        let pending = null;
        if (Object.keys(risky).length) { pending = { id: id('edit'), placeId: x.id, placeName: x.name, district: x.district, ownerId: actor.id, ownerName: actor.name, values: risky, status: 'pending', createdAt: now }; db.edits.push(pending); }
        return { applied: Object.keys(safe), pending };
      });
      return json(res, 200, result), true;
    }
    if (p === '/api/me/places' && m === 'GET') {
      const actor = requireRole(req), data = getData(), s = source();
      const claims = data.claims.filter(c => c.ownerId === actor.id);
      return json(res, 200, { claims: claims.map(c => ({ ...c, place: s && s.places.find(x => x.id === c.placeId) ? present(s.places.find(x => x.id === c.placeId), data) : null,
        stats: { saved: Object.values(data.saved).filter(list => list.includes(c.placeId)).length, openReports: data.reports.filter(r => r.placeId === c.placeId && r.status === 'open').length },
        pendingEdits: data.edits.filter(e => e.placeId === c.placeId && e.status === 'pending') })) }), true;
    }

    // L2/L10 บันทึกสถานที่
    if (p === '/api/me/saved' && m === 'GET') {
      const actor = member(), data = getData(), s = source();
      const ids = data.saved[actor.id] || [];
      return json(res, 200, { places: s ? s.places.filter(x => ids.includes(x.id)).map(x => ({ ...present(x, data), hidden: data.hiddenPlaces.includes(x.id) })) : [],
        reports: data.reports.filter(r => r.reporterId === actor.id).reverse(), suggestions: data.suggestions.filter(x => x.byId === actor.id).reverse() }), true;
    }
    if (p === '/api/me/saved' && m === 'POST') {
      const actor = member(), input = await body(req);
      if (!need().places.some(x => x.id === input.placeId)) throw fail(404, 'ไม่พบสถานที่');
      const saved = await transaction(db => {
        migrate(db);
        const list = db.saved[actor.id] || [];
        db.saved[actor.id] = list.includes(input.placeId) ? list.filter(x => x !== input.placeId) : [...list, input.placeId].slice(-200);
        return db.saved[actor.id].includes(input.placeId);
      });
      return json(res, 200, { saved }), true;
    }

    // L3 แผนซ้อม
    if (p === '/api/me/plan' && m === 'GET') {
      const actor = requireRole(req, 'learner'), data = getData();
      return json(res, 200, { plan: planSummary(data.plans[actor.id], data.practice.filter(l => l.personaId === actor.id)) }), true;
    }
    if (p === '/api/me/plan' && m === 'POST') {
      const actor = requireRole(req, 'learner'), input = await body(req);
      const goal = text(input.goal, 120), instrument = text(input.instrument, 40), minutesPerWeek = Number(input.minutesPerWeek);
      if (goal.length < 5) throw fail(400, 'เป้าหมายอย่างน้อย 5 ตัวอักษร');
      if (instrument.length < 2) throw fail(400, 'ระบุเครื่องดนตรีหรือทักษะ');
      if (!Number.isInteger(minutesPerWeek) || minutesPerWeek < 30 || minutesPerWeek > 1200) throw fail(400, 'เวลาซ้อมต่อสัปดาห์ 30–1200 นาที');
      const plan = await transaction(db => { migrate(db); db.plans[actor.id] = { goal, instrument, minutesPerWeek, startedAt: new Date().toISOString(), weeks: planWeeks(goal, instrument) }; return db.plans[actor.id]; });
      return json(res, 201, { plan: planSummary(plan, []) }), true;
    }
    if (p === '/api/me/practice' && m === 'POST') {
      const actor = requireRole(req, 'learner'), input = await body(req);
      const minutes = Number(input.minutes), feel = Number(input.feel), focus = text(input.focus, 120);
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 240) throw fail(400, 'นาทีซ้อม 5–240');
      if (![1, 2, 3].includes(feel)) throw fail(400, 'เลือกความรู้สึก 1–3');
      const summary = await transaction(db => {
        migrate(db);
        if (!db.plans[actor.id]) throw fail(409, 'สร้างแผนซ้อมก่อน');
        db.practice.push({ id: id('practice'), personaId: actor.id, date: new Date().toISOString(), minutes, feel, focus });
        return planSummary(db.plans[actor.id], db.practice.filter(l => l.personaId === actor.id));
      });
      return json(res, 201, { plan: summary }), true;
    }

    // L4 อุปกรณ์
    if (p === '/api/gear/advice' && m === 'GET') {
      const advice = gearAdvice(Object.fromEntries(url.searchParams));
      const actor = currentPersona(req), s = source(), data = getData();
      const home = actor?.home;
      const kinds = new Set(advice.options.flatMap(o => o.kinds));
      const nearby = s ? visible(s, data).filter(x => kinds.has(x.kind)).map(x => present(x, data))
        .sort((a, b) => (b.district === home) - (a.district === home) || a.district.localeCompare(b.district)).slice(0, 12) : [];
      return json(res, 200, { advice, nearby, home: home || null }), true;
    }
    return false;
  }

  return { handle, migrate };
}

module.exports = { createEcosystem, gearAdvice, planSummary, REPORT_REASONS, SAFE_FIELDS, RISKY_FIELDS, migrate };
