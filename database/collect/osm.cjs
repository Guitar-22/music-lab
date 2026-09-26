'use strict';
// Task 2 — ดึงสถานที่ด้านดนตรีจาก OpenStreetMap (Overpass API) ทีละเขต แล้วเก็บ raw ไว้ใน sources/osm/
// ข้อมูล OSM ใช้สัญญาอนุญาต ODbL: ต้องแสดง "© OpenStreetMap contributors" เมื่อเผยแพร่
// ใช้: node collect/osm.cjs ปทุมวัน [ราชเทวี ...] | --wave 1 | --all   (เพิ่ม --force เพื่อดึงซ้ำ)
const fs = require('node:fs');
const path = require('node:path');
const { DISTRICTS, slug, byName } = require('../lib/districts.cjs');

const DIR = path.join(__dirname, '..', 'sources', 'osm');
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'MusicIndustryLab-research/0.1 (non-commercial music-education mapping)';

const NAME_RX = 'ดนตรี|เพลง|music|guitar|กีตาร์|piano|เปียโน|drum|กลอง|violin|ไวโอลิน|jazz|แจ๊ส|ห้องซ้อม|rehearsal|recording|อัดเสียง|ukulele|อูคูเลเล่|saxophone|แซกโซโฟน|ระนาด|ขิม|orchestra|symphony|ดุริยาง';

function query(rel) {
  const a = 3600000000 + rel;
  return `[out:json][timeout:120];area(${a})->.a;(
nwr(area.a)["shop"~"^(musical_instrument|music|hifi)$"];
nwr(area.a)["amenity"~"^(music_school|music_venue|studio|concert_hall|theatre|arts_centre|karaoke_box)$"];
nwr(area.a)["craft"~"musical_instrument|piano_tuner|luthier"];
nwr(area.a)["studio"];
nwr(area.a)["live_music"="yes"];
nwr(area.a)["name"~"${NAME_RX}",i];
nwr(area.a)["name:en"~"${NAME_RX}",i];
);out center tags;`;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchDistrict(d, { force = false, log = console.log } = {}) {
  const file = path.join(DIR, `${slug(d)}.json`);
  if (!force && fs.existsSync(file)) { log(`ข้าม ${d.name}: มีไฟล์แล้ว (--force เพื่อดึงใหม่)`); return JSON.parse(fs.readFileSync(file, 'utf8')); }
  const q = query(d.rel);
  for (let attempt = 1; attempt <= 6; attempt++) {
    const ENDPOINT = ENDPOINTS[(attempt - 1) % ENDPOINTS.length];
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: 'data=' + encodeURIComponent(q),
    });
    const text = await res.text();
    if (res.ok && text.trim().startsWith('{')) {
      const json = JSON.parse(text);
      if (json.remark && /error|timed out/i.test(json.remark)) throw new Error(`${d.name}: ${json.remark}`);
      const out = { district: d.name, rel: d.rel, fetchedAt: new Date().toISOString(), source: ENDPOINT, license: 'ODbL © OpenStreetMap contributors', query: q, elements: json.elements };
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(out, null, 1));
      log(`${d.name}: ${json.elements.length} รายการ → sources/osm/${slug(d)}.json`);
      return out;
    }
    const wait = attempt * 5000;
    log(`${d.name}: HTTP ${res.status} จาก ${new URL(ENDPOINT).host} ลองใหม่ใน ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error(`${d.name}: ดึงไม่สำเร็จหลังลอง 6 ครั้ง`);
}

function pick(argv) {
  if (argv.includes('--all')) return DISTRICTS;
  const w = argv.indexOf('--wave');
  if (w >= 0) return DISTRICTS.filter(d => d.wave === Number(argv[w + 1]));
  return argv.filter(a => !a.startsWith('--') && !/^\d+$/.test(a)).map(n => {
    const d = byName(n);
    if (!d) throw new Error(`ไม่รู้จักเขต ${n}`);
    return d;
  });
}

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const list = pick(argv);
    if (!list.length) { console.log('ระบุเขต, --wave N หรือ --all'); return; }
    for (const [i, d] of list.entries()) {
      try { await fetchDistrict(d, { force: argv.includes('--force') }); }
      catch (e) { console.error(e.message); process.exitCode = 1; } // เขตถัดไปยังทำต่อ
      if (i < list.length - 1) await sleep(4000); // สุภาพต่อเซิร์ฟเวอร์สาธารณะ
    }
  })().catch(e => { console.error(e.message); process.exitCode = 1; });
}

module.exports = { fetchDistrict, query };
