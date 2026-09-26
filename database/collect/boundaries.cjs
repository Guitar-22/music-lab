'use strict';
// T2 — ขอบเขต 50 เขตจาก OpenStreetMap → รูปหลายเหลี่ยมย่อขนาด เก็บใน sources/geo/districts.json
// ใช้: node collect/boundaries.cjs [--force]
const fs = require('node:fs');
const path = require('node:path');
const { DISTRICTS } = require('../lib/districts.cjs');

const FILE = path.join(__dirname, '..', 'sources', 'geo', 'districts.json');
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'MusicIndustryLab-research/0.1 (non-commercial music-education mapping)';
const TOLERANCE = 0.00025; // องศา ≈ 25 ม.

// ต่อ way ของ outer ให้เป็นวงปิด
function assemble(ways) {
  const segs = ways.map(w => w.map(p => [+p.lon.toFixed(6), +p.lat.toFixed(6)]));
  const rings = [];
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  while (segs.length) {
    let ring = segs.shift();
    let grown = true;
    while (!same(ring[0], ring[ring.length - 1]) && grown) {
      grown = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const end = ring[ring.length - 1];
        if (same(end, s[0])) ring = ring.concat(s.slice(1));
        else if (same(end, s[s.length - 1])) ring = ring.concat(s.slice(0, -1).reverse());
        else if (same(ring[0], s[s.length - 1])) ring = s.concat(ring.slice(1));
        else if (same(ring[0], s[0])) ring = s.slice(1).reverse().concat(ring);
        else continue;
        segs.splice(i, 1);
        grown = true;
        break;
      }
    }
    rings.push(ring);
  }
  return rings;
}

function simplify(points, tol) {
  if (points.length < 4) return points;
  const d2 = (p, a, b) => {
    const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
    const dx = x2 - x1, dy = y2 - y1;
    const t = dx || dy ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))) : 0;
    return (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2;
  };
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) { const d = d2(points[i], points[s], points[e]); if (d > max) { max = d; idx = i; } }
    if (max > tol * tol) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return points.filter((_, i) => keep[i]);
}

async function overpass(q) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const endpoint = ENDPOINTS[attempt % ENDPOINTS.length];
    const res = await fetch(endpoint, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    const text = await res.text();
    if (res.ok && text.trim().startsWith('{')) return JSON.parse(text);
    await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
  }
  throw new Error('Overpass ไม่ตอบ');
}

async function main() {
  if (fs.existsSync(FILE) && !process.argv.includes('--force')) { console.log('มี sources/geo/districts.json แล้ว (--force เพื่อดึงใหม่)'); return; }
  const out = [];
  // แบ่งเป็นชุดละ 10 เขตเพื่อไม่ให้คำตอบใหญ่เกิน
  for (let i = 0; i < DISTRICTS.length; i += 10) {
    const batch = DISTRICTS.slice(i, i + 10);
    const json = await overpass(`[out:json][timeout:180];rel(id:${batch.map(d => d.rel).join(',')});out geom;`);
    for (const rel of json.elements) {
      const d = DISTRICTS.find(x => x.rel === rel.id);
      const outers = rel.members.filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry).map(m => m.geometry);
      const rings = assemble(outers).map(r => simplify(r, TOLERANCE));
      out.push({ name: d.name, rel: d.rel, rings });
    }
    console.log(`ขอบเขต ${Math.min(i + 10, DISTRICTS.length)}/${DISTRICTS.length}`);
  }
  out.sort((a, b) => DISTRICTS.findIndex(d => d.rel === a.rel) - DISTRICTS.findIndex(d => d.rel === b.rel));
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ source: 'OpenStreetMap administrative boundaries (admin_level=6)', license: 'ODbL © OpenStreetMap contributors', fetchedAt: new Date().toISOString(), tolerance: TOLERANCE, districts: out }));
  console.log(`บันทึก ${out.length} เขต → sources/geo/districts.json (${(fs.statSync(FILE).size / 1024).toFixed(0)} KB)`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { assemble, simplify };
