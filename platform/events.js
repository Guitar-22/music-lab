'use strict';
// L10 ชุมชน/กิจกรรม: UC-23 ปฏิทินกิจกรรมเปิดตามเขต · UC-24 ฟีดกิจกรรมจากสถานที่ที่บันทึกและเขตบ้าน
const crypto = require('node:crypto');
const { ROLE_GROUPS } = require('./model');

const KINDS = { workshop: 'เวิร์กช็อป', open_jam: 'Open jam', concert: 'คอนเสิร์ต', student_show: 'แสดงผลงานนักเรียน', trial_class: 'คาบทดลองเปิด' };
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const today = () => new Date().toISOString().slice(0, 10);
const addDays = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

function migrate(data) {
  if (!Array.isArray(data.events)) data.events = [];
  if (!data.interests || typeof data.interests !== 'object') data.interests = {};
  return data;
}

function validateEvent(raw) {
  const v = { kind: raw.kind, title: text(raw.title, 100), date: text(raw.date, 10), time: text(raw.time, 5), district: text(raw.district, 40),
    free: raw.free === true, minAge: Number(raw.minAge ?? 0), details: text(raw.details, 400), placeId: text(raw.placeId, 60) || null };
  const errors = [];
  if (!KINDS[v.kind]) errors.push('เลือกประเภทกิจกรรม');
  if (v.title.length < 5) errors.push('ชื่อกิจกรรมอย่างน้อย 5 ตัวอักษร');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || v.date < today() || v.date > addDays(180)) errors.push('วันที่ต้องอยู่ระหว่างวันนี้ถึง 180 วันข้างหน้า');
  if (v.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time)) errors.push('เวลาไม่ถูกต้อง (HH:MM)');
  if (v.details.length < 10) errors.push('รายละเอียดอย่างน้อย 10 ตัวอักษร');
  if (!Number.isInteger(v.minAge) || v.minAge < 0 || v.minAge > 25) errors.push('อายุขั้นต่ำ 0–25 ปี');
  return { value: v, errors };
}

const upcoming = data => data.events.filter(e => e.status === 'open' && e.date >= today()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

function createEvents() {
  async function handle(ctx) {
    const { m, url, res, req, json, fail, body, requireRole, currentPersona, transaction, getData } = ctx;
    const p = ctx.decodedPath;
    const decorate = (data, actor) => e => ({ ...e, interested: (data.interests[e.id] || []).length, mine: Boolean(actor && (data.interests[e.id] || []).includes(actor.id)),
      eligible: actor ? (actor.age ?? 99) >= e.minAge : null });

    if (p === '/api/events/meta' && m === 'GET') return json(res, 200, { kinds: KINDS }), true;
    if (p === '/api/events' && m === 'GET') {
      const data = migrate(getData()), actor = currentPersona(req);
      const district = url.searchParams.get('district') || '', kind = url.searchParams.get('kind') || '';
      return json(res, 200, { events: upcoming(data).filter(e => (!district || e.district === district) && (!kind || e.kind === kind)).map(decorate(data, actor)) }), true;
    }
    if (p === '/api/events' && m === 'POST') {
      const actor = requireRole(req);
      if (!ROLE_GROUPS.provider.includes(actor.role)) throw fail(403, 'สร้างกิจกรรมได้เฉพาะครู ร้าน หรือเวที');
      const checked = validateEvent(await body(req));
      if (checked.errors.length) throw fail(400, checked.errors.join('; '));
      const event = await transaction(db => {
        migrate(db);
        let placeName = null;
        if (checked.value.placeId) {
          const claim = (db.claims || []).find(c => c.placeId === checked.value.placeId && c.ownerId === actor.id && c.status === 'approved');
          if (!claim) throw fail(403, 'ผูกกิจกรรมได้เฉพาะสถานที่ที่คุณเป็นเจ้าของที่ยืนยันแล้ว');
          placeName = claim.placeName;
          if (!checked.value.district) checked.value.district = claim.district;
        }
        if (!checked.value.district) throw fail(400, 'ระบุเขต');
        const e = { id: `event-${crypto.randomUUID()}`, ownerId: actor.id, ownerName: actor.name, placeName, ...checked.value, status: 'open', createdAt: new Date().toISOString() };
        db.events.push(e);
        return e;
      });
      return json(res, 201, { event }), true;
    }
    if (p === '/api/me/events' && m === 'GET') {
      const actor = requireRole(req), data = migrate(getData());
      return json(res, 200, { events: data.events.filter(e => e.ownerId === actor.id).reverse().map(decorate(data, actor)) }), true;
    }
    let match = p.match(/^\/api\/events\/(event-[0-9a-f-]+)\/interest$/);
    if (match && m === 'POST') {
      const actor = requireRole(req);
      if (!ROLE_GROUPS.member.includes(actor.role)) throw fail(403, 'บทบาทนี้ใช้ฟังก์ชันนี้ไม่ได้');
      const result = await transaction(db => {
        migrate(db);
        const e = db.events.find(x => x.id === match[1] && x.status === 'open');
        if (!e) throw fail(404, 'ไม่พบกิจกรรม');
        if ((actor.age ?? 99) < e.minAge) throw fail(403, `กิจกรรมนี้สำหรับอายุ ${e.minAge} ปีขึ้นไป`);
        const list = db.interests[e.id] || [];
        db.interests[e.id] = list.includes(actor.id) ? list.filter(x => x !== actor.id) : [...list, actor.id];
        return { interested: db.interests[e.id].includes(actor.id), count: db.interests[e.id].length };
      });
      return json(res, 200, result), true;
    }
    match = p.match(/^\/api\/events\/(event-[0-9a-f-]+)\/cancel$/);
    if (match && m === 'POST') {
      const actor = requireRole(req);
      const event = await transaction(db => { migrate(db); const e = db.events.find(x => x.id === match[1]); if (!e) throw fail(404, 'ไม่พบกิจกรรม'); if (e.ownerId !== actor.id) throw fail(403, 'ยกเลิกได้เฉพาะกิจกรรมของตัวเอง'); e.status = 'cancelled'; return e; });
      return json(res, 200, { event }), true;
    }
    // UC-24 ฟีด: กิจกรรมที่สนใจ + ของสถานที่ที่บันทึก + ในเขตบ้าน (บอกเหตุผลที่แสดง)
    if (p === '/api/me/feed' && m === 'GET') {
      const actor = requireRole(req), data = migrate(getData());
      const saved = new Set((data.saved || {})[actor.id] || []);
      const feed = upcoming(data).map(e => {
        const why = (data.interests[e.id] || []).includes(actor.id) ? 'คุณกดสนใจ' : e.placeId && saved.has(e.placeId) ? 'สถานที่ที่คุณบันทึก' : actor.home && e.district === actor.home ? `ในเขต${actor.home}` : null;
        return why ? { ...decorate(data, actor)(e), why } : null;
      }).filter(Boolean).slice(0, 30);
      return json(res, 200, { feed }), true;
    }
    return false;
  }
  return { handle, migrate };
}

module.exports = { createEvents, validateEvent, KINDS, migrate };
