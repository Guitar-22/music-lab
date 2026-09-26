'use strict';
// T1 — รวมสถานที่จาก OSM (sources/osm) + ค้นเว็บ (sources/curated) + ผลตรวจทาน (review) เป็นรายการเดียว
const fs = require('node:fs');
const path = require('node:path');
const { DISTRICTS, slug } = require('./districts.cjs');
const { classify } = require('./classify.cjs');
const { assessContext, locationConflict, sameBrandPairs } = require('./context.cjs');

const SRC = path.join(__dirname, '..', 'sources');
const GEOCODE_CACHE = path.join(SRC, 'geocode-cache.json');
// ผลตรวจบริบทของรายการ OSM ในเขตที่ยังไม่มีไฟล์ curated (id → {kind|exclude, note})
const CONTEXT_REVIEW = path.join(SRC, 'context-review.json');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const readDir = dir => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => ({ file: f, ...readJson(path.join(dir, f)) })) : [];
// รหัสสินค้าในข้อมูลตัวแทน Yamaha → คำที่ผู้ใช้เข้าใจ
const CHAIN_PRODUCTS = { PA: 'เครื่องเสียงเวที', GT: 'กีตาร์', KB: 'คีย์บอร์ด', KB_RECOMMEND: 'คีย์บอร์ด', DGX_P: 'เปียโนไฟฟ้า', Arius: 'เปียโนไฟฟ้า', Clavinova: 'เปียโนไฟฟ้า', DP: 'เปียโนไฟฟ้า', AP: 'เปียโนอะคูสติก', BO: 'เครื่องเป่า/วงโยธวาทิต', ME: 'สื่อการสอนดนตรี', EL: 'อิเล็กโทน', MS: 'โรงเรียนดนตรี', AV: 'เครื่องเสียงบ้าน' };
const INFRA = ['railway', 'highway', 'waterway', 'public_transport', 'landuse', 'boundary', 'route'];
const clean = v => (typeof v === 'string' && v.trim() ? v.trim() : null);

function osmAddress(t) {
  const parts = [t['addr:housenumber'], t['addr:street'], t['addr:subdistrict'] || t['addr:suburb']].filter(Boolean);
  return parts.length ? parts.join(' ') : clean(t['addr:full']);
}

function fromOsm(e, district, fetchedAt, review) {
  const t = e.tags || {};
  const id = `osm:${e.type[0]}${e.id}`;
  const r = review[id] || {};
  const lat = e.lat ?? e.center?.lat ?? null;
  const lon = e.lon ?? e.center?.lon ?? null;
  const social = ['contact:facebook', 'facebook', 'contact:instagram', 'contact:line'].map(k => clean(t[k])).filter(Boolean);
  return {
    id, name: clean(t.name) || clean(t['name:en']), name_en: clean(t['name:en']),
    kind: r.kind || classify(t), excluded: r.exclude === true || (r.kind || classify(t)) === 'excluded',
    district, lat, lon, address: osmAddress(t), geocode: null,
    phone: clean(t.phone) || clean(t['contact:phone']), website: clean(t.website) || clean(t['contact:website']),
    social, hours: clean(t.opening_hours), offer: [],
    source: 'osm', source_url: `https://www.openstreetmap.org/${e.type}/${e.id}`, license: 'ODbL',
    evidence: null, checked: fetchedAt.slice(0, 10), review_note: clean(r.note), reviewed: Boolean(review[id]),
  };
}

function fromCurated(p, district, geocodes) {
  const g = p.lat == null && p.geocode ? geocodes[p.geocode] : null;
  return {
    id: p.id, name: clean(p.name), name_en: clean(p.name_en), kind: p.kind, excluded: false, district,
    lat: p.lat ?? g?.lat ?? null, lon: p.lon ?? g?.lon ?? null, address: clean(p.address), geocode: clean(p.geocode),
    phone: clean(p.phone), website: clean(p.website), social: Array.isArray(p.social) ? p.social : [],
    hours: clean(p.hours), offer: Array.isArray(p.offer) ? p.offer : [],
    source: 'web', source_url: clean(p.source_url), license: null, evidence: clean(p.evidence),
    checked: clean(p.checked), review_note: null, reviewed: true, geocoded: Boolean(g), geocodeApprox: g?.approximate ? g.matched : null,
  };
}

function extractPlaces() {
  const osm = readDir(path.join(SRC, 'osm'));
  const curated = readDir(path.join(SRC, 'curated'));
  const geocodes = fs.existsSync(GEOCODE_CACHE) ? readJson(GEOCODE_CACHE) : {};
  const contextReview = fs.existsSync(CONTEXT_REVIEW) ? readJson(CONTEXT_REVIEW).decisions || {} : {};
  const places = [];
  const rejects = [];
  const progress = [];
  for (const d of DISTRICTS) {
    const o = osm.find(x => x.file === `${slug(d)}.json`);
    const c = curated.find(x => x.file === `${slug(d)}.json`);
    const review = { ...contextReview, ...(c?.review || {}) };
    let osmCount = 0, curCount = 0;
    for (const e of o?.elements || []) {
      const p = fromOsm(e, d.name, o.fetchedAt, review);
      // ชื่อที่บังเอิญตรงคำค้น เช่น "แม่กลอง" (ทางรถไฟ) ไม่ใช่สถานที่ดนตรี
      if (INFRA.some(k => e.tags?.[k]) || e.tags?.type === 'route') { rejects.push({ id: p.id, district: d.name, reason: 'not_poi' }); continue; }
      if (!p.name) { rejects.push({ id: p.id, district: d.name, reason: 'no_name' }); continue; }
      if (p.excluded) { rejects.push({ id: p.id, district: d.name, reason: 'excluded', note: p.review_note }); continue; }
      const ctx = assessContext(p, e.tags);
      if (ctx.autoReject) { rejects.push({ id: p.id, district: d.name, reason: 'context_mismatch', note: ctx.reasons.join('; ') }); continue; }
      p.context = ctx.level; p.context_reasons = ctx.reasons;
      places.push(p); osmCount++;
    }
    for (const raw of c?.places || []) {
      const p = fromCurated(raw, d.name, geocodes);
      const ctx = assessContext(p);
      p.context = ctx.level; p.context_reasons = ctx.reasons;
      places.push(p); curCount++;
    }
    const status = !o ? 'not_started' : !c ? 'osm_only' : 'researched';
    progress.push({ district: d.name, wave: d.wave, status, osm_fetched_at: o?.fetchedAt || null, researched_at: c?.researchedAt || null, osm_places: osmCount, web_places: curCount, gaps: c?.gaps || [] });
  }
  // ตัวแทนทางการของแบรนด์ (sources/chains/<brand>.json + <brand>-review.json)
  const { districtOf: inDistrict, distance, distanceToRings, loadDistricts } = require('./geo.cjs');
  const { KINDS } = require('./classify.cjs');
  const chainDir = path.join(SRC, 'chains');
  const chainFiles = fs.existsSync(chainDir) ? fs.readdirSync(chainDir).filter(f => f.endsWith('.json') && !f.endsWith('-review.json')) : [];
  const chainCounts = {};
  for (const f of chainFiles) {
    const brand = f.replace(/\.json$/, '');
    const src = readJson(path.join(chainDir, f));
    const reviewFile = path.join(chainDir, `${brand}-review.json`);
    const decisions = fs.existsSync(reviewFile) ? readJson(reviewFile).decisions || {} : {};
    const existing = places.slice();
    for (const d of src.dealers || []) {
      if (d.lat == null || d.lon == null) continue;
      const district = (decisions[d.accountCode] || {}).district || inDistrict(d); // review แก้เขตได้เมื่อหมุดของแบรนด์คลาดเส้นแบ่งเขต
      if (!district) continue; // นอกกรุงเทพฯ: เก็บไว้ในไฟล์ต้นทาง ยังไม่อยู่ในขอบเขต
      const id = `${brand}:${d.accountCode}`;
      const products = d.products || [];
      if (products.length && products.every(p => p === 'AV')) { rejects.push({ id, district, reason: 'not_music_retail', note: 'ขายเฉพาะเครื่องเสียงบ้าน (AV)' }); continue; }
      const decision = decisions[d.accountCode] || {};
      if (decision.duplicateOf) { rejects.push({ id, district, reason: 'duplicate_of', note: decision.duplicateOf }); continue; }
      // ที่อยู่ของตัวแทนบอกเขตหนึ่ง แต่พิกัดตกอีกเขต = พิกัดต้นทางผิด: ใช้เขตจากที่อยู่และไม่ปักหมุด
      // พิกัดเลยเส้นเขตไม่เกิน 300 ม. = ความคลาดเคลื่อนปกติ ย้ายเขตตามที่อยู่แต่คงหมุดไว้
      const declared = locationConflict({ name: d.name, address: d.address, district });
      const declaredShape = declared && loadDistricts().find(s => s.name === declared);
      const nearBorder = declaredShape && distanceToRings(d, declaredShape.rings) <= 300;
      const kind = /โรงเรียน|school|academy/i.test(d.name) ? 'school' : products.length && products.every(p => p === 'PA') ? 'audio_store' : 'instrument_store';
      const near = existing.filter(p => p.lat != null && ['gear', 'learn'].includes(KINDS[p.kind]?.layer) && distance(p, d) < 150);
      if (near.length && !decision.keep) { rejects.push({ id, district, reason: 'chain_needs_review', note: near.map(p => p.id).join(', ') }); continue; }
      const cp = { id, name: d.name.replace(/\s+/g, ' ').trim(), name_en: null, kind, excluded: false, district: declared || district, lat: declared && !nearBorder ? null : d.lat, lon: declared && !nearBorder ? null : d.lon, address: d.address || null, geocode: null,
        phone: d.phone, website: d.url, social: [], hours: null, offer: products.map(p => CHAIN_PRODUCTS[p] || p).filter((v, i, a) => a.indexOf(v) === i),
        source: 'chain', source_url: src.source, license: null, evidence: `ตัวแทนจำหน่ายทางการ: ${src.owner}${decision.note ? ' · ' + decision.note : ''}`,
        checked: src.fetchedAt.slice(0, 10), review_note: decision.note || null, reviewed: Boolean(decisions[d.accountCode]) };
      const ctx = assessContext(cp);
      // ที่อยู่ทางการชัดเจนกว่าพิกัดต้นทาง: เชื่อเขตจากที่อยู่ ส่วนหมุดที่ไกลเกินไปถูกถอดออก (ไม่ปักดีกว่าปักผิด)
      cp.context = ctx.level;
      cp.context_reasons = declared ? [...ctx.reasons, nearBorder ? `ที่อยู่ระบุเขต${declared} พิกัดเลยเส้นเขต ≤300 ม. — ใช้เขตตามที่อยู่` : `ที่อยู่/ห้างระบุเขต${declared} แต่พิกัดต้นทางตกเขต${district} — ถอดหมุดจนกว่าจะหาพิกัดใหม่`] : ctx.reasons;
      places.push(cp);
      chainCounts[cp.district] = (chainCounts[cp.district] || 0) + 1;
    }
  }
  for (const p of progress) p.chain_places = chainCounts[p.district] || 0;

  // วัตถุ OSM ที่คร่อมเส้นแบ่งเขตถูกดึงมาจากทั้งสองเขต: เก็บไว้เฉพาะเขตที่มีจุดศูนย์กลาง
  const { districtOf } = require('./geo.cjs');
  const seen = new Map();
  for (const p of places.filter(x => x.source === 'osm')) seen.set(p.id, [...(seen.get(p.id) || []), p]);
  for (const [id, copies] of seen) {
    if (copies.length < 2) continue;
    const keep = copies.find(p => p.lat != null && districtOf(p) === p.district) || copies[0];
    for (const p of copies) if (p !== keep) {
      places.splice(places.indexOf(p), 1);
      rejects.push({ id: `${id}@${p.district}`, district: p.district, reason: 'duplicate_cross_district', note: `เก็บไว้ที่เขต${keep.district}` });
    }
  }
  const uniqueRejects = [...new Map(rejects.map(r => [r.id, r])).values()];
  rejects.length = 0;
  rejects.push(...uniqueRejects);
  const reviewKeys = curated.flatMap(c => Object.keys(c.review || {}).map(k => ({ id: k, district: c.district, file: c.file })));
  // ที่ตั้งที่ประกาศในที่อยู่/ชื่อห้าง ขัดกับเขตของรายการ (OSM/ค้นเว็บ)
  for (const p of places) {
    if (p.source === 'chain') continue;
    const declared = locationConflict(p);
    if (declared) p.context_reasons = [...(p.context_reasons || []), `ที่อยู่/ห้างระบุเขต${declared} แต่รายการอยู่เขต${p.district}`];
  }
  const { distance: dist } = require('./geo.cjs');
  const brandDupes = sameBrandPairs(places, dist);
  for (const r of Object.keys(contextReview)) reviewKeys.push({ id: r, district: null, file: 'context-review.json' });
  return { places, rejects, progress, reviewKeys, curatedFiles: curated, brandDupes };
}

module.exports = { extractPlaces, GEOCODE_CACHE };
