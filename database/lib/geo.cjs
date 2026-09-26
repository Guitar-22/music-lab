'use strict';
// เครื่องมือพิกัด: จุดในรูปหลายเหลี่ยม ระยะทาง และหาเขตของจุด
const fs = require('node:fs');
const path = require('node:path');

const GEO_FILE = path.join(__dirname, '..', 'sources', 'geo', 'districts.json');
const BKK_BBOX = { minLat: 13.49, maxLat: 13.96, minLon: 100.32, maxLon: 100.94 };

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ระยะทาง (เมตร) แบบ haversine
function distance(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ระยะจากจุดถึงขอบเขต (เมตรโดยประมาณ) ใช้ตัดสินกรณีอยู่ติดเส้นแบ่งเขต
function distanceToRings(p, rings) {
  let best = Infinity;
  for (const ring of rings) for (let i = 1; i < ring.length; i++) {
    const [x1, y1] = ring[i - 1], [x2, y2] = ring[i];
    const dx = x2 - x1, dy = y2 - y1;
    const t = dx || dy ? Math.max(0, Math.min(1, ((p.lon - x1) * dx + (p.lat - y1) * dy) / (dx * dx + dy * dy))) : 0;
    best = Math.min(best, distance(p, { lon: x1 + t * dx, lat: y1 + t * dy }));
  }
  return best;
}

let cache = null;
function loadDistricts() {
  if (!cache) cache = fs.existsSync(GEO_FILE) ? JSON.parse(fs.readFileSync(GEO_FILE, 'utf8')).districts : [];
  return cache;
}

function districtOf(p) {
  const hit = loadDistricts().find(d => d.rings.some(r => inRing([p.lon, p.lat], r)));
  return hit ? hit.name : null;
}

const inBangkok = p => p.lat >= BKK_BBOX.minLat && p.lat <= BKK_BBOX.maxLat && p.lon >= BKK_BBOX.minLon && p.lon <= BKK_BBOX.maxLon;

module.exports = { GEO_FILE, BKK_BBOX, inRing, distance, distanceToRings, loadDistricts, districtOf, inBangkok };
