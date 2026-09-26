'use strict';
// ขั้นกรองบริบท (context) — ชื่อที่มีคำว่า "เพลง/music/studio" ไม่ได้แปลว่าเป็นสถานที่ดนตรีจริง
// ตรวจสามเรื่องหลังจัดประเภท: (1) tag หลักของ OSM ขัดกับดนตรีหรือไม่ (2) มีหลักฐานบริบทจากอะไร
// (3) ที่อยู่/ห้างที่ระบุในชื่อ ตรงกับเขตของพิกัดหรือไม่ และ (4) เป็นร้านเดียวกันจากคนละแหล่งหรือไม่
const { MUSIC } = require('./classify.cjs');
const { DISTRICTS } = require('./districts.cjs');

// ระดับบริบท: ผ่าน = แสดงใน portal ได้; ไม่ผ่าน = เก็บในฐานข้อมูลแต่ต้องมีคนตรวจก่อน
const LEVELS = {
  verified: { pass: true,  label: 'ยืนยันจากหน้าเจ้าของ/รายชื่อทางการ' },
  reviewed: { pass: true,  label: 'ตรวจทานโดยทีมแล้ว' },
  tagged:   { pass: true,  label: 'OSM ระบุประเภทดนตรีตรงกับชื่อ' },
  lead:     { pass: true,  label: 'มีแหล่งอ้างอิงแต่ยังเป็น lead' },
  name_only: { pass: false, label: 'ดนตรีจากชื่ออย่างเดียว ไม่มี tag หรือหลักฐาน' },
  generic:  { pass: false, label: 'ประเภททั่วไป (โรงละคร/ศูนย์ศิลปะ/สตูดิโอ) ไม่มีสัญญาณดนตรี' },
  conflict: { pass: false, label: 'สัญญาณขัดกัน (tag/ชื่อ/ที่ตั้ง)' },
};

// tag หลักที่บอกว่าเป็นอย่างอื่นแน่นอน → คัดออกอัตโนมัติถ้ายังไม่มีคนตรวจ
const NON_MUSIC_PRIMARY = [
  ['amenity', /^(place_of_worship|bicycle_rental|parking|fuel|hospital|clinic|bank|pharmacy|kindergarten)$/],
  ['place', /./], ['religion', /./], ['landuse', /./], ['leisure', /^(park|pitch|sports_centre|fitness_centre)$/],
  ['shop', /^(bicycle|car|mobile_phone|computer|clothes|beauty|hairdresser)$/],
];
// tag ที่บอกว่าเป็นดนตรีโดยตรง
const MUSIC_TAG = t => /^(musical_instrument|music|hifi)$/.test(t.shop || '') || /^(music_school|music_venue|concert_hall|karaoke_box)$/.test(t.amenity || '')
  || /musical_instrument|piano_tuner|luthier/.test(t.craft || '') || /^(audio|music|recording|radio)$/.test(t.studio || '') || t.live_music === 'yes'
  || /^(music|concert|opera)$/.test(t['theatre:genre'] || '');
// คำในชื่อที่บอกว่าไม่ใช่ดนตรี แม้ tag จะเป็นดนตรี (tag ผิดบ่อย)
const NAME_CONFLICT = /montessori|มอนเตสซอรี|อนุบาล|kindergarten|nursery|preschool|bike|bicycle|จักรยาน|\bspa\b|สปา|massage|นวด/i;
// คำที่ทำให้คำค้นดนตรีติดมาโดยบังเอิญ: "วัดเพลง", "ชุมชนวัดเพลง", "คลองวัดเพลง"
const INCIDENTAL = /วัดเพลง|แม่กลอง|ซิมโฟนี่$/;

// ห้าง/ย่านที่รู้เขตแน่นอน — ใช้จับพิกัดที่หลุดจากที่อยู่
const LANDMARKS = [
  [/สยามพารากอน|siam paragon|พารากอน|เซ็นทรัลเวิลด์|centralworld|เอ็มบีเค|mbk|สยามสแควร์|siam square|เซ็นเตอร์พ้อยท์|สามย่านมิตรทาวน์/i, 'ปทุมวัน'],
  [/ปิ่นเกล้า|pinklao/i, 'บางกอกน้อย'],
  [/แกรนด์ พระราม ?9|เซ็นทรัล ?พระราม ?9|central rama ?9/i, 'ห้วยขวาง'],
  [/ฟอร์จูนทาวน์|fortune town|เอสพลานาด/i, 'ดินแดง'],
  [/เซ็นทรัล ?ลาดพร้าว|central ladprao/i, 'จตุจักร'],
  [/เดอะมอลล์ ?บางกะปิ|เดอะมอลบางกะปิ/i, 'บางกะปิ'],
  [/เดอะมอลล์ ?ท่าพระ/i, 'ธนบุรี'],
  [/ซีคอนสแควร์|seacon square/i, 'ประเวศ'],
  [/เซ็นทรัล ?บางนา/i, 'บางนา'],
  [/แฟชั่นไอส์แลนด์|fashion island/i, 'คันนายาว'],
  [/ข้าวสาร|khao ?san/i, 'พระนคร'],
];

// ชื่อแบรนด์ที่สะกดได้หลายแบบ → กุญแจเดียว ใช้หาร้านเดียวกันจากคนละแหล่ง
const BRANDS = [
  [/music ?collection|มิวสิค ?คอลเลค/i, 'music-collection'], [/beat ?spot|บีทสปอต/i, 'beatspot'],
  [/เต่าแดง/, 'taodang'], [/note ?sound|โน๊ตซาวด์/i, 'note-sound'], [/v\.? ?c\.? ?elec|วี\.? ?ซี\.? ?อ[ีิ]เล็?คโทร/i, 'vc-electronics'],
  [/บีเอ็นจี ?มิวสิค|bng music/i, 'bng-music'], [/ฮงเส็ง|hong ?seng/i, 'hong-seng'], [/ย่งเส็ง|yong ?seng/i, 'yong-seng'],
];
const SAME_BRAND_RADIUS = 1200; // ม. — พิกัดจากคนละแหล่งของร้านเดียวกันคลาดกันได้ถึง ~1 กม.

function addressDistrict(address) {
  if (!address) return null;
  const m = address.match(/เขต\s*([ก-๙]+)/);
  if (m) { const d = DISTRICTS.find(x => m[1].startsWith(x.name)); if (d) return d.name; }
  return null;
}
function landmarkDistrict(text) {
  for (const [rx, d] of LANDMARKS) if (rx.test(text || '')) return d;
  return null;
}
const brandOf = p => (BRANDS.find(([rx]) => rx.test(`${p.name} ${p.name_en || ''}`)) || [])[1] || null;

// ตัดสินบริบทของหนึ่งรายการ; tags = tag ดิบของ OSM (ไม่มีสำหรับค้นเว็บ/chain)
function assessContext(p, tags = null) {
  const reasons = [];
  const name = `${p.name || ''} ${p.name_en || ''}`;
  if (p.source === 'osm') {
    const t = tags || {};
    const primary = NON_MUSIC_PRIMARY.filter(([k, rx]) => rx.test(t[k] || '')).map(([k]) => `${k}=${t[k]}`);
    if (primary.length) reasons.push(`tag หลักไม่ใช่ดนตรี (${primary.join(', ')})`);
    if (INCIDENTAL.test(p.name || '')) reasons.push('คำดนตรีในชื่อเป็นส่วนของชื่อเฉพาะ (เช่น วัดเพลง)');
    if (NAME_CONFLICT.test(name)) reasons.push('ชื่อบอกกิจการอื่น แม้ tag เป็นดนตรี');
    if (t['theatre:type'] === 'amphi') reasons.push('อัฒจันทร์กลางแจ้ง ไม่ใช่เวทีดนตรีประจำ');
    if (p.kind === 'venue' && t.office) reasons.push(`เป็นสำนักงาน (office=${t.office}) แต่จัดเป็นเวที`);
    // ผลตรวจทานที่ผู้ตรวจเขียนว่ายังไม่ยืนยัน = lead ไม่ใช่ reviewed
    if (p.reviewed) return { level: /ยังไม่ยืนยัน|ต้องตรวจ|ควรตรวจซ้ำ|\(lead\)|เป็น lead/.test(p.review_note || '') ? 'lead' : 'reviewed', reasons, autoReject: false };
    if (reasons.length) return { level: 'conflict', reasons, autoReject: primary.length > 0 || INCIDENTAL.test(p.name || '') };
    if (MUSIC_TAG(t) || (t.amenity === 'school' && /โรงเรียน(สอน)?ดนตรี|music school/i.test(name))) return { level: 'tagged', reasons: [], autoReject: false };
    if (MUSIC.test(name)) return { level: 'name_only', reasons: ['ไม่มี tag ดนตรี ใช้ชื่ออย่างเดียว'], autoReject: false };
    return { level: 'generic', reasons: [`tag ทั่วไป (${['amenity', 'shop', 'studio'].map(k => t[k] && `${k}=${t[k]}`).filter(Boolean).join(', ') || 'ไม่มี'}) และชื่อไม่มีคำดนตรี`], autoReject: false };
  }
  if (p.source === 'web') return { level: /\(lead\)/i.test(p.evidence || '') ? 'lead' : 'verified', reasons: [], autoReject: false };
  // chain: รายชื่อตัวแทนทางการ — หลักฐานบริบทคือสายสินค้าดนตรีที่ได้รับแต่งตั้ง (AV ล้วนถูกคัดออกก่อนแล้ว)
  if (!p.offer?.length) reasons.push('รายชื่อตัวแทนไม่ระบุสายสินค้า');
  else if (!MUSIC.test(name) && !/ยามาฮ่า|yamaha/i.test(name)) reasons.push(`ชื่อไม่บอกว่าเป็นร้านดนตรี — ยืนยันจากสายสินค้า (${p.offer.join(', ')})`);
  return { level: p.reviewed || p.offer?.length ? 'verified' : 'lead', reasons, autoReject: false };
}

// ที่ตั้งที่ประกาศ (เขตในที่อยู่ / ห้างในชื่อ) เทียบกับเขตที่ระบบจัดให้
function locationConflict(p) {
  const declared = addressDistrict(p.address) || landmarkDistrict(`${p.name} ${p.address || ''}`);
  return declared && declared !== p.district ? declared : null;
}

// ร้านแบรนด์เดียวกันจากคนละแหล่งในระยะใกล้ = น่าจะซ้ำ
function sameBrandPairs(places, distance) {
  const out = [];
  const items = places.filter(p => p.lat != null && brandOf(p));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.source === b.source || brandOf(a) !== brandOf(b)) continue;
    const d = distance(a, b);
    if (d < SAME_BRAND_RADIUS) out.push({ a, b, d });
  }
  return out;
}

module.exports = { LEVELS, assessContext, locationConflict, addressDistrict, landmarkDistrict, sameBrandPairs, brandOf };
