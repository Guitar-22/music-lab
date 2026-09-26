'use strict';
// ตัวแทนจำหน่ายทางการของ Yamaha ประเทศไทย (ข้อมูลของเจ้าของแบรนด์ มีพิกัด) → sources/chains/yamaha.json
// เก็บเฉพาะข้อมูลธุรกิจที่ต้องใช้ (ไม่เก็บอีเมล); การตัดสินรายการที่อาจซ้ำอยู่ใน sources/chains/yamaha-review.json
// ใช้: node collect/yamaha.cjs
const fs = require('node:fs');
const path = require('node:path');

const API = 'https://th.yamaha.com/th/api/dealer/dealers/';
const FILE = path.join(__dirname, '..', 'sources', 'chains', 'yamaha.json');

async function main() {
  const res = await fetch(API, { headers: { 'User-Agent': 'MusicIndustryLab-research/0.1 (non-commercial music-education mapping)', Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Yamaha API HTTP ${res.status}`);
  const all = await res.json();
  const dealers = all.map(d => ({ accountCode: d.accountCode, name: (d.name || '').trim(), company: (d.description || '').trim(), address: (d.address || '').trim(),
    phone: (d.telephoneNumber || '').trim() || null, url: /^https?:\/\//.test(d.url || '') ? d.url.trim() : null, lat: Number(d.lat) || null, lon: Number(d.lng) || null, products: d.contractCode || [] }));
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify({ source: API, owner: 'Siam Music Yamaha (ตัวแทนจำหน่ายทางการ)', fetchedAt: new Date().toISOString(), dealers }, null, 1));
  console.log(`บันทึก ${dealers.length} ตัวแทน → sources/chains/yamaha.json`);
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exitCode = 1; });
