const test = require('node:test');
const assert = require('node:assert/strict');
const { resources } = require('./resources.js');
const { details, PLATFORM_LABEL } = require('./app-details.js');
const J = require('./journey-engine.js');

const PERSONAS = {
  kidNoInstrument: { listen: 'beat', instrument: 'none', dream: 'unsure', level: 'zero', style: 'play', gear: ['ipad'], budget: 'free' },
  teenGuitar: { listen: 'voice', instrument: 'guitar', dream: 'band', level: 'some', style: 'selfstudy', gear: ['android', 'instrument'], budget: 'free' },
  pianoExam: { listen: 'voice', instrument: 'keys', dream: 'exam', level: 'regular', style: 'structured', gear: ['ipad', 'instrument'], budget: 'small' },
  thaiMusic: { listen: 'roots', instrument: 'thai', dream: 'exam', level: 'regular', style: 'teacher', gear: ['android', 'instrument'], budget: 'small' },
  producerWindows: { listen: 'sound', instrument: 'computer', dream: 'release', level: 'some', style: 'play', gear: ['windows', 'iphone'], budget: 'small' },
};

test('ทุกแหล่งมีรายละเอียดครบ: คำอธิบาย ฟีเจอร์ ราคา แพลตฟอร์ม และทางหาไอคอนจริง', () => {
  assert.equal(Object.keys(details).length, resources.length);
  for (const r of resources) {
    const d = details[r.id];
    assert.ok(d, `${r.id}: ไม่มี app-details`);
    assert.ok(d.about.length > 80, `${r.id}: about สั้นเกินไป`);
    assert.ok(d.features.length >= 3, `${r.id}: features < 3`);
    for (const k of ['pricing', 'limits', 'level']) assert.ok(d[k], `${r.id}: ${k}`);
    assert.ok(d.platforms.length && d.platforms.every(p => PLATFORM_LABEL[p]), `${r.id}: platforms`);
    assert.ok(d.traits.length && d.style.length, `${r.id}: traits/style`);
    assert.ok(d.appStoreId || d.appSearch || d.site, `${r.id}: ไม่มีทางหาไอคอน`);
    if (d.appSearch) assert.ok(d.appSearch.term && d.appSearch.seller, `${r.id}: appSearch ต้องระบุผู้ขายเพื่อไม่ให้ได้ไอคอนแอปอื่น`);
  }
});

test('appStoreId ตรงกับลิงก์ App Store ใน resources.js', () => {
  for (const r of resources) {
    const id = (r.url.match(/apps\.apple\.com\/.*\/id(\d+)/) || [])[1];
    if (id) assert.equal(details[r.id].appStoreId, Number(id), `${r.id}: appStoreId ไม่ตรง URL`);
    else assert.equal(details[r.id].appStoreId, undefined, `${r.id}: มี appStoreId แต่ URL ไม่ใช่ App Store`);
  }
});

test('ทุกห้องมีแหล่งเรียน มีประตูไปห้องอื่นที่มีอยู่จริง และทุกแหล่งอยู่ในห้องใดห้องหนึ่ง', () => {
  for (const room of J.ROOMS) {
    assert.ok(J.members(room.id).length >= 3, `${room.id}: แหล่งน้อยเกินไป`);
    assert.ok(room.doors.length >= 2);
    for (const [to, why] of room.doors) { assert.ok(J.room(to), `${room.id} → ${to}`); assert.notEqual(to, room.id); assert.ok(why); }
    for (const id of room.extra) assert.ok(resources.some(r => r.id === id), `${room.id}: extra ${id}`);
  }
  for (const r of resources) assert.ok(J.roomOf(r.id), `${r.id}: ไม่มีห้อง`);
  // เดินจากห้องไหนก็ไปถึงทุกห้องได้ (ไม่มีห้องตัน)
  for (const start of J.ROOMS) {
    const seen = new Set([start.id]); const queue = [start.id];
    while (queue.length) for (const [to] of J.room(queue.shift()).doors) if (!seen.has(to)) { seen.add(to); queue.push(to); }
    assert.equal(seen.size, J.ROOMS.length, `จาก ${start.id} ไปไม่ถึงทุกห้อง`);
  }
});

test('คำถามครบทุกข้อ ตัวเลือกไม่ซ้ำ และไม่ตอบเลยก็ยังได้ผลที่ปลอดภัย (นักสำรวจเสียง)', () => {
  for (const q of J.QUESTIONS) {
    assert.ok(q.title && q.options.length >= 3);
    assert.equal(new Set(q.options.map(o => o.id)).size, q.options.length);
  }
  const p = J.buildProfile({});
  assert.equal(p.archetype, 'explorer');
  assert.ok(J.recommend(p).length === 3);
});

test('persona: แต่ละแบบได้ตัวตนและห้องแรกที่สมเหตุสมผล', () => {
  const r = key => J.buildProfile(PERSONAS[key]);
  assert.equal(J.firstRoom(r('kidNoInstrument')), 'playground');
  assert.equal(J.firstRoom(r('teenGuitar')), 'practice', 'มือใหม่สายแสดงเริ่มที่ห้องซ้อม ไม่ใช่หลังเวที');
  assert.equal(r('pianoExam').archetype, 'pathfinder', 'เป้าหมายสอบ = วางเส้นทาง');
  assert.equal(r('thaiMusic').archetype, 'pathfinder');
  assert.equal(J.firstRoom(r('producerWindows')), 'studio');
  for (const key of Object.keys(PERSONAS)) {
    const route = J.route(r(key));
    assert.equal(new Set(route).size, route.length, `${key}: เส้นทางซ้ำห้อง`);
    assert.ok(route.includes('pathway'), `${key}: เส้นทางต้องจบที่จุดตัดสินใจเรื่องครู/เรียนต่อ`);
  }
});

test('คำแนะนำเคารพเงื่อนไขจริง: อุปกรณ์ งบ และเครื่องดนตรี', () => {
  for (const [key, answers] of Object.entries(PERSONAS)) {
    const p = J.buildProfile(answers);
    const picks = J.recommend(p);
    assert.equal(picks.length, 3, `${key}: ต้องมี 3 คำแนะนำ`);
    for (const { resource, detail, reasons } of picks) {
      assert.ok(detail.platforms.includes('web') || detail.platforms.some(x => p.devices.includes(x)), `${key}: ${resource.id} ไม่มีบนอุปกรณ์`);
      if (p.budget === 'free') assert.ok(['free', 'freemium', 'trial'].includes(resource.cost), `${key}: ${resource.id} เกินงบ`);
      assert.ok(reasons.length >= 1, `${key}: ${resource.id} ไม่มีเหตุผล`);
    }
  }
  const piano = J.recommend(J.buildProfile(PERSONAS.pianoExam), { limit: 0 }).map(x => x.resource.id);
  assert.ok(!piano.includes('musora') && !piano.includes('guitartuna'), 'คนเล่นเปียโนต้องไม่ได้คอร์ส/จูนเนอร์กีตาร์');
  const kid = J.recommend(J.buildProfile(PERSONAS.kidNoInstrument), { limit: 0 }).map(x => x.resource.id);
  assert.ok(!kid.includes('guitartuna') && !kid.includes('logic-mac'), 'ยังไม่มีเครื่อง/ไม่มี Mac ต้องไม่ถูกแนะนำ');
});

test('fit บอกเหตุผลที่ไม่เหมาะ แทนการซ่อนเงียบ', () => {
  const p = J.buildProfile(PERSONAS.producerWindows);
  const logic = J.fit(resources.find(r => r.id === 'logic-mac'), p);
  assert.equal(logic.ok, false);
  assert.match(logic.blockers.join(), /อุปกรณ์/);
});
