'use strict';
// L9 ผู้ปกครอง/ผู้เยาว์ (UC-22): ผู้ปกครองเพิ่มลูก (ชื่อเล่น + อายุเท่านั้น) และส่งคำขอเรียนแทน
// ผู้เรียนอายุต่ำกว่า 18 ขอได้เฉพาะบริการที่ครูเปิดรับผู้เยาว์ และอายุถึงเกณฑ์ขั้นต่ำ
const crypto = require('node:crypto');
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function migrate(data) {
  if (!data.children || typeof data.children !== 'object') data.children = {};
  return data;
}

// เรียกใน transaction ของ POST /api/requests; คืนฟิลด์ที่ต้องเพิ่มในคำขอ หรือโยน error
function checkRequest(db, actor, listing, input, fail) {
  migrate(db);
  const accepts = listing.acceptsMinors === true;
  const minAge = Number.isInteger(listing.minAge) ? listing.minAge : 18;
  if (actor.role === 'parent') {
    const child = (db.children[actor.id] || []).find(c => c.id === input.childId);
    if (!child) throw fail(400, 'เลือกลูกที่จะขอเรียนให้');
    if (!accepts) throw fail(403, 'บริการนี้ไม่ได้เปิดรับผู้เรียนอายุต่ำกว่า 18 ปี');
    if (child.age < minAge) throw fail(403, `บริการนี้รับอายุ ${minAge} ปีขึ้นไป`);
    return { forChild: { id: child.id, nickname: child.nickname, age: child.age }, guardian: true };
  }
  if ((actor.age ?? 99) < 18) {
    if (!accepts) throw fail(403, 'บริการนี้ไม่ได้เปิดรับผู้เรียนอายุต่ำกว่า 18 ปี');
    if (actor.age < minAge) throw fail(403, `บริการนี้รับอายุ ${minAge} ปีขึ้นไป`);
    return { minor: true, minorAge: actor.age };
  }
  return {};
}

function createGuardian() {
  async function handle(ctx) {
    const { m, res, req, json, fail, body, requireRole, transaction, getData } = ctx;
    const p = ctx.decodedPath;
    if (p === '/api/me/children' && m === 'GET') {
      const actor = requireRole(req, 'parent');
      return json(res, 200, { children: migrate(getData()).children[actor.id] || [] }), true;
    }
    if (p === '/api/me/children' && m === 'POST') {
      const actor = requireRole(req, 'parent'), input = await body(req);
      const nickname = text(input.nickname, 30), age = Number(input.age);
      if (nickname.length < 1) throw fail(400, 'ใส่ชื่อเล่น (ไม่ต้องใส่ชื่อจริง)');
      if (!Number.isInteger(age) || age < 3 || age > 17) throw fail(400, 'อายุ 3–17 ปี');
      const children = await transaction(db => {
        migrate(db);
        const list = db.children[actor.id] || [];
        if (list.length >= 6) throw fail(409, 'เพิ่มได้ไม่เกิน 6 คน');
        db.children[actor.id] = [...list, { id: `child-${crypto.randomUUID().slice(0, 8)}`, nickname, age }];
        return db.children[actor.id];
      });
      return json(res, 201, { children }), true;
    }
    const match = p.match(/^\/api\/me\/children\/(child-[0-9a-f]+)\/remove$/);
    if (match && m === 'POST') {
      const actor = requireRole(req, 'parent');
      const children = await transaction(db => {
        migrate(db);
        if (db.requests.some(r => r.forChild?.id === match[1] && ['pending', 'accepted'].includes(r.status))) throw fail(409, 'มีคำขอเรียนที่ยังเปิดอยู่ของลูกคนนี้');
        db.children[actor.id] = (db.children[actor.id] || []).filter(c => c.id !== match[1]);
        return db.children[actor.id];
      });
      return json(res, 200, { children }), true;
    }
    return false;
  }
  return { handle, migrate };
}

module.exports = { createGuardian, checkRequest, migrate };
