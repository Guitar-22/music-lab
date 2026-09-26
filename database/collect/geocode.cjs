'use strict';
// หาพิกัดให้สถานที่จากการค้นเว็บที่มีแค่ "geocode" ด้วย OpenStreetMap Nominatim
// นโยบาย Nominatim: ไม่เกิน 1 คำขอ/วินาที, ระบุ User-Agent, cache ผลไว้ (sources/geocode-cache.json)
// ใช้: node collect/geocode.cjs
const fs = require('node:fs');
const path = require('node:path');
const { GEOCODE_CACHE } = require('../lib/places.cjs');
const { BKK_BBOX } = require('../lib/geo.cjs');
const { DISTRICTS } = require('../lib/districts.cjs');
const DISTRICT_NAMES = new Set(DISTRICTS.flatMap(d => [d.name, 'เขต' + d.name, d.en, d.en + ' District'].map(x => x.toLowerCase())));

const DIR = path.join(__dirname, '..', 'sources', 'curated');
const UA = 'MusicIndustryLab-research/0.1 (non-commercial music-education mapping)';

async function lookup(q) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.search = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'th', bounded: '1', 'accept-language': 'th,en',
    viewbox: `${BKK_BBOX.minLon},${BKK_BBOX.maxLat},${BKK_BBOX.maxLon},${BKK_BBOX.minLat}` });
  const res = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const [hit] = await res.json();
  if (!hit) return { miss: true };
  // ได้แค่ถนนหรือพื้นที่ (แขวง/เขต) = พิกัดโดยประมาณ ไม่ใช่ตัวอาคาร
  const coarse = hit.category === 'highway' || (hit.category === 'place' && !/^(house|building)$/.test(hit.type)) || hit.category === 'boundary';
  return { lat: +hit.lat, lon: +hit.lon, display: hit.display_name, osm: `${hit.osm_type}/${hit.osm_id}`, feature: `${hit.category}/${hit.type}`, coarse };
}

// คำค้นยาวหลายส่วนมักไม่พบ ลองแบบสั้นลงตามลำดับ
function variants(q) {
  const seg = q.split(',').map(x => x.trim()).filter(Boolean);
  const generic = /^(bangkok|กรุงเทพ(มหานคร|ฯ)?|thailand|ประเทศไทย|d{5})$/i;
  const specific = seg.filter(x => !generic.test(x) && !DISTRICT_NAMES.has(x.toLowerCase()));
  if (!specific.length) return [];
  // ห้ามคำค้นที่เหลือแค่ชื่อเมือง ("Bangkok, Bangkok" เคยได้พิกัดสถานีหัวลำโพง)
  return [...new Set([q, `${specific[0]}, Bangkok`, specific.slice(0, 2).join(', '), specific[1] && `${specific[1]}, Bangkok`].filter(Boolean))];
}

async function lookupAny(q) {
  for (const v of variants(q)) {
    const hit = await lookup(v);
    await new Promise(r => setTimeout(r, 1100));
    if (!hit.miss) return { ...hit, matched: v, approximate: v !== q || hit.coarse };
  }
  return { miss: true, tried: variants(q) };
}

// agent หลายตัวอาจ geocode พร้อมกัน: อ่านไฟล์ล่าสุดแล้วรวมก่อนเขียน และเขียนผ่านไฟล์ชั่วคราวแล้ว rename
function save(key, value) {
  const latest = fs.existsSync(GEOCODE_CACHE) ? JSON.parse(fs.readFileSync(GEOCODE_CACHE, 'utf8')) : {};
  latest[key] = value;
  const tmp = `${GEOCODE_CACHE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(latest, null, 1));
  fs.renameSync(tmp, GEOCODE_CACHE);
}

async function main() {
  const cache = fs.existsSync(GEOCODE_CACHE) ? JSON.parse(fs.readFileSync(GEOCODE_CACHE, 'utf8')) : {};
  const queries = new Set();
  for (const f of fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.json')) : []) {
    for (const p of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).places || []) if (p.lat == null && p.geocode && (!cache[p.geocode] || (cache[p.geocode].miss && !cache[p.geocode].tried))) queries.add(p.geocode);
  }
  let n = 0;
  for (const q of queries) {
    cache[q] = await lookupAny(q);
    save(q, cache[q]); // บันทึกทุกครั้ง หยุดกลางทางก็ไม่เสียผล
    console.log(`${++n}/${queries.size} ${cache[q].miss ? 'ไม่พบ' : 'พบ'}: ${q}`);
  }
  console.log(queries.size ? 'เสร็จ' : 'ไม่มีคำค้นใหม่');
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
