'use strict';
// ส่งออกสถานที่ที่ผ่าน Gate ไปให้ portal (หน้า static) ใช้: portal/places-data.js
const fs = require('node:fs');
const path = require('node:path');
const { KINDS } = require('./classify.cjs');

const OUT = path.join(__dirname, '..', '..', 'portal', 'places-data.js');
const r5 = n => (n == null ? null : Math.round(n * 1e5) / 1e5);

function exportPortal(db, file = OUT) {
  const rows = sql => db.prepare(sql).all().map(r => ({ ...r }));
  const social = rows('SELECT * FROM place_social'), offer = rows('SELECT * FROM place_offer');
  const places = rows("SELECT id, name, name_en, kind, layer, district, lat, lon, address, phone, website, hours, source, source_url, checked, context FROM places WHERE layer <> 'review' AND context IN ('verified','reviewed','tagged','lead') ORDER BY district, name")
    .map(p => ({ ...p, lat: r5(p.lat), lon: r5(p.lon), social: social.filter(s => s.place_id === p.id).map(s => s.url), offer: offer.filter(o => o.place_id === p.id).map(o => o.item) }));
  const districts = rows('SELECT p.district name, p.wave, p.status, p.osm_places, p.web_places, p.chain_places, p.gaps, s.rings FROM district_progress p JOIN district_shapes s ON s.district = p.district')
    .map(d => ({ name: d.name, wave: d.wave, status: d.status, osm: d.osm_places, web: d.web_places, chain: d.chain_places, gaps: JSON.parse(d.gaps).length, rings: JSON.parse(d.rings).map(r => r.map(([x, y]) => [r5(x), r5(y)])) }));
  const kinds = Object.fromEntries(Object.entries(KINDS).filter(([k]) => !['excluded', 'unclassified'].includes(k)));
  const data = { generatedAt: new Date().toISOString(), license: 'ข้อมูลสถานที่บางส่วนและขอบเขตเขต © OpenStreetMap contributors (ODbL)', kinds, districts, places };
  fs.writeFileSync(file, `// สร้างอัตโนมัติจาก database/build.cjs — อย่าแก้ไฟล์นี้โดยตรง\nwindow.MILPlaces=${JSON.stringify(data)};\n`);
  return { places: places.length, districts: districts.length, bytes: fs.statSync(file).size };
}

module.exports = { exportPortal, OUT };
