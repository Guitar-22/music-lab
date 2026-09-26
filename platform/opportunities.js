'use strict';
// L5 สร้าง/แสดง + L6 อาชีพ: กระดานโอกาส (ช่องเล่นเวที ฝึกงาน อาสา) และโปรไฟล์วง
// UC-12 โปรไฟล์วงต้องมีคลิปเล่นสด · UC-13 เวทีเห็นประวัติการมาตามนัด · UC-15 ฝึกงาน/อาสา
// ความปลอดภัย: ทุกโอกาสมีอายุขั้นต่ำ (เวทีกลางคืนค่าเริ่มต้น 18 ปี)
const crypto = require('node:crypto');
const { ROLE_GROUPS } = require('./model');

const TYPES = { gig: 'ช่องเล่นเวที', internship: 'ฝึกงาน', volunteer: 'อาสางานดนตรี' };
const PAY = { paid: 'มีค่าตัว', door: 'แบ่งรายได้ค่าบัตร', unpaid: 'ไม่มีค่าตอบแทน' };
const GENRES = ['ป๊อป', 'ร็อก', 'แจ๊ส', 'อินดี้', 'ลูกทุ่ง/หมอลำ', 'ดนตรีไทย', 'คลาสสิก', 'อิเล็กทรอนิกส์', 'ฮิปฮอป', 'อื่น ๆ'];
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const today = () => new Date().toISOString().slice(0, 10);
const addDays = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function migrate(data) {
  if (!data.bands || typeof data.bands !== 'object') data.bands = {};
  for (const k of ['opportunities', 'applications']) if (!Array.isArray(data[k])) data[k] = [];
  return data;
}

function validateOpportunity(raw, role) {
  const v = { type: raw.type, title: text(raw.title, 100), genre: text(raw.genre, 40), district: text(raw.district, 40), date: text(raw.date, 10),
    pay: raw.pay, details: text(raw.details, 500), minAge: Number(raw.minAge ?? (raw.type === 'gig' ? 18 : 15)) };
  const errors = [];
  if (!TYPES[v.type]) errors.push('เลือกประเภทโอกาส');
  if (v.type === 'gig' && role !== 'venue') errors.push('ช่องเล่นเวทีประกาศได้เฉพาะเวที');
  if (v.title.length < 5) errors.push('หัวข้ออย่างน้อย 5 ตัวอักษร');
  if (v.details.length < 10) errors.push('รายละเอียดอย่างน้อย 10 ตัวอักษร');
  if (!PAY[v.pay]) errors.push('เลือกค่าตอบแทน');
  if (v.genre && !GENRES.includes(v.genre)) errors.push('แนวเพลงไม่ถูกต้อง');
  if (!Number.isInteger(v.minAge) || v.minAge < 13 || v.minAge > 25) errors.push('อายุขั้นต่ำ 13–25 ปี');
  if (v.type === 'gig' && v.minAge < 18 && /บาร์|bar|pub|ผับ/i.test(v.title + v.details)) errors.push('งานในบาร์/ผับต้องอายุขั้นต่ำ 18 ปี');
  if (v.type === 'gig' && !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) errors.push('ช่องเล่นเวทีต้องระบุวันที่');
  if (v.date && (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || v.date < today() || v.date > addDays(180))) errors.push('วันที่ต้องอยู่ระหว่างวันนี้ถึง 180 วันข้างหน้า');
  return { value: v, errors };
}

function validateBand(raw) {
  const v = { name: text(raw.name, 80), genre: text(raw.genre, 40), members: Number(raw.members), clipUrl: text(raw.clipUrl, 300), needs: text(raw.needs, 300) };
  const errors = [];
  if (v.name.length < 2) errors.push('ชื่อวง/ศิลปินอย่างน้อย 2 ตัวอักษร');
  if (!GENRES.includes(v.genre)) errors.push('เลือกแนวเพลง');
  if (!Number.isInteger(v.members) || v.members < 1 || v.members > 20) errors.push('จำนวนสมาชิก 1–20');
  if (!/^https:\/\/\S+$/.test(v.clipUrl)) errors.push('ต้องมีลิงก์คลิปเล่นสด (https://)');
  return { value: v, errors };
}

// ประวัติการมาตามนัด: นับเฉพาะงานที่ผ่านวันแสดงแล้วและเวทีบันทึกผล
function reliability(data, applicantId) {
  const done = data.applications.filter(a => a.applicantId === applicantId && ['performed', 'no_show'].includes(a.status));
  return { performed: done.filter(a => a.status === 'performed').length, noShow: done.filter(a => a.status === 'no_show').length };
}

function createOpportunities() {
  async function handle(ctx) {
    const { m, url, res, req, json, fail, body, requireRole, currentPersona, transaction, getData } = ctx;
    const p = ctx.decodedPath;
    const provider = () => { const a = requireRole(req); if (!ROLE_GROUPS.provider.includes(a.role)) throw fail(403, 'ประกาศได้เฉพาะเวที ร้าน หรือครู'); return a; };

    if (p === '/api/opportunities/meta' && m === 'GET') return json(res, 200, { types: TYPES, pay: PAY, genres: GENRES }), true;
    if (p === '/api/opportunities' && m === 'GET') {
      const data = migrate(getData()), actor = currentPersona(req);
      const type = url.searchParams.get('type') || '', district = url.searchParams.get('district') || '';
      const rows = data.opportunities.filter(o => o.status === 'open' && (!o.date || o.date >= today()) && (!type || o.type === type) && (!district || o.district === district))
        .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
        .map(o => ({ ...o, applicants: data.applications.filter(a => a.oppId === o.id).length, myApplication: actor ? data.applications.find(a => a.oppId === o.id && a.applicantId === actor.id) || null : null,
          eligible: actor ? (actor.age ?? 99) >= o.minAge : null }));
      return json(res, 200, { opportunities: rows }), true;
    }
    if (p === '/api/opportunities' && m === 'POST') {
      const actor = provider(), checked = validateOpportunity(await body(req), actor.role);
      if (checked.errors.length) throw fail(400, checked.errors.join('; '));
      const opp = await transaction(db => {
        migrate(db);
        const o = { id: `opp-${crypto.randomUUID()}`, ownerId: actor.id, ownerName: actor.name, ownerRole: actor.role, ...checked.value, status: 'open', createdAt: new Date().toISOString() };
        db.opportunities.push(o);
        return o;
      });
      return json(res, 201, { opportunity: opp }), true;
    }
    if (p === '/api/me/opportunities' && m === 'GET') {
      const actor = provider(), data = migrate(getData());
      return json(res, 200, { opportunities: data.opportunities.filter(o => o.ownerId === actor.id).reverse().map(o => ({ ...o,
        applications: data.applications.filter(a => a.oppId === o.id).map(a => ({ ...a, reliability: reliability(data, a.applicantId) })) })) }), true;
    }
    let match = p.match(/^\/api\/opportunities\/(opp-[0-9a-f-]+)\/close$/);
    if (match && m === 'POST') {
      const actor = provider();
      const opp = await transaction(db => { migrate(db); const o = db.opportunities.find(x => x.id === match[1]); if (!o) throw fail(404, 'ไม่พบประกาศ'); if (o.ownerId !== actor.id) throw fail(403, 'ปิดได้เฉพาะประกาศของตัวเอง'); o.status = 'closed'; return o; });
      return json(res, 200, { opportunity: opp }), true;
    }

    // โปรไฟล์วง (UC-12)
    if (p === '/api/me/band' && m === 'GET') { const a = requireRole(req, 'learner'); return json(res, 200, { band: migrate(getData()).bands[a.id] || null }), true; }
    if (p === '/api/me/band' && m === 'POST') {
      const actor = requireRole(req, 'learner'), checked = validateBand(await body(req));
      if (checked.errors.length) throw fail(400, checked.errors.join('; '));
      const band = await transaction(db => { migrate(db); db.bands[actor.id] = { ...checked.value, updatedAt: new Date().toISOString() }; return db.bands[actor.id]; });
      return json(res, 200, { band }), true;
    }

    // สมัคร
    match = p.match(/^\/api\/opportunities\/(opp-[0-9a-f-]+)\/apply$/);
    if (match && m === 'POST') {
      const actor = requireRole(req, 'learner'), input = await body(req), message = text(input.message, 400);
      if (message.length < 10) throw fail(400, 'แนะนำตัวสั้น ๆ อย่างน้อย 10 ตัวอักษร');
      const application = await transaction(db => {
        migrate(db);
        const o = db.opportunities.find(x => x.id === match[1]);
        if (!o || o.status !== 'open' || (o.date && o.date < today())) throw fail(404, 'ประกาศนี้ปิดรับแล้ว');
        if ((actor.age ?? 99) < o.minAge) throw fail(403, `ประกาศนี้รับอายุ ${o.minAge} ปีขึ้นไป`);
        const band = db.bands[actor.id];
        if (o.type === 'gig' && !band) throw fail(409, 'สร้างโปรไฟล์วงพร้อมคลิปเล่นสดก่อนสมัครเล่นเวที');
        if (db.applications.some(a => a.oppId === o.id && a.applicantId === actor.id)) throw fail(409, 'คุณสมัครประกาศนี้แล้ว');
        const a = { id: `app-${crypto.randomUUID()}`, oppId: o.id, oppTitle: o.title, oppDate: o.date || null, ownerId: o.ownerId, applicantId: actor.id, applicantName: actor.name, applicantAge: actor.age,
          message, band: o.type === 'gig' ? band : null, status: 'pending', createdAt: new Date().toISOString(), updatedAt: null };
        db.applications.push(a);
        return a;
      });
      return json(res, 201, { application }), true;
    }
    if (p === '/api/me/applications' && m === 'GET') {
      const actor = requireRole(req, 'learner'), data = migrate(getData());
      return json(res, 200, { applications: data.applications.filter(a => a.applicantId === actor.id).reverse() }), true;
    }
    // เจ้าของประกาศตอบ และบันทึกผลหลังวันงาน (UC-13)
    match = p.match(/^\/api\/applications\/(app-[0-9a-f-]+)\/respond$/);
    if (match && m === 'POST') {
      const actor = provider(), input = await body(req);
      const allowed = { pending: ['accepted', 'declined'], accepted: ['performed', 'no_show'] };
      const application = await transaction(db => {
        migrate(db);
        const a = db.applications.find(x => x.id === match[1]);
        if (!a) throw fail(404, 'ไม่พบใบสมัคร');
        if (a.ownerId !== actor.id) throw fail(403, 'ตอบได้เฉพาะใบสมัครของประกาศตัวเอง');
        if (!(allowed[a.status] || []).includes(input.decision)) throw fail(409, 'เปลี่ยนสถานะนี้ไม่ได้');
        if (['performed', 'no_show'].includes(input.decision) && a.oppDate && a.oppDate > today()) throw fail(409, 'บันทึกผลได้หลังถึงวันงาน');
        a.status = input.decision; a.updatedAt = new Date().toISOString();
        return a;
      });
      return json(res, 200, { application }), true;
    }
    return false;
  }
  return { handle, migrate };
}

module.exports = { createOpportunities, validateOpportunity, validateBand, reliability, TYPES, PAY, GENRES, migrate };
