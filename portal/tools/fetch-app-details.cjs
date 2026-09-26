'use strict';
// ดึงคำอธิบายทางการ + ไอคอนจริงของทั้ง 35 แหล่ง แล้วเขียน portal/app-store-data.js และ portal/assets/icons/<id>.<ext>
//
//   node portal/tools/fetch-app-details.cjs            # ทุกรายการ
//   node portal/tools/fetch-app-details.cjs moises bandlab
//
// ลำดับแหล่ง (ไม่เดา ไม่แปล — เก็บข้อความตามเจ้าของ):
//   1) มี appStoreId ใน app-details.js → iTunes Lookup API (ประเทศ th ก่อน แล้ว us) : คำอธิบาย ราคา เรตติ้ง เวอร์ชัน ภาษา ไอคอน 512px
//   2) ไม่มี id → iTunes Search หาแอปของ "ผู้พัฒนาเดียวกัน" (ชื่อผู้ขายต้องตรงกับ owner) : ใช้ไอคอนแอปจริงของผลิตภัณฑ์นั้น
//   3) เว็บอย่างเดียว → หน้าเจ้าของ: meta description / og และไอคอน apple-touch-icon หรือ icon ที่ใหญ่ที่สุด
// ต้องใช้ Node 18+ (มี fetch) และอินเทอร์เน็ตที่เข้าถึง itunes.apple.com และเว็บเจ้าของได้
const fs = require('node:fs');
const path = require('node:path');
const { resources } = require('../resources.js');
const { details } = require('../app-details.js');

const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'assets', 'icons');
const OUT = path.join(ROOT, 'app-store-data.js');
const UA = 'MusicIndustryLab-research/0.1 (non-commercial music-education portal)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');

async function get(url, as = 'text') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: as === 'json' ? 'application/json' : '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  if (as === 'json') return res.json();
  if (as === 'buffer') return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '', url: res.url };
  return { text: await res.text(), url: res.url };
}

async function saveIcon(id, url) {
  const { buf, type } = await get(url, 'buffer');
  if (buf.length < 200 || !/image|octet/.test(type)) throw new Error(`ไม่ใช่ภาพ (${type}, ${buf.length} bytes)`);
  const ext = /png/.test(type) ? 'png' : /jpe?g/.test(type) ? 'jpg' : /svg/.test(type) ? 'svg' : /webp/.test(type) ? 'webp' : /icon/.test(type) ? 'ico' : 'png';
  fs.mkdirSync(ICONS, { recursive: true });
  for (const f of fs.readdirSync(ICONS)) if (f.startsWith(id + '.')) fs.unlinkSync(path.join(ICONS, f));
  const file = `${id}.${ext}`;
  fs.writeFileSync(path.join(ICONS, file), buf);
  return `assets/icons/${file}`;
}

function fromItunes(app) {
  return {
    kind: 'app-store', trackId: app.trackId, trackName: app.trackName, seller: app.sellerName || app.artistName,
    storeUrl: app.trackViewUrl, description: app.description, releaseNotes: app.releaseNotes || null,
    price: app.formattedPrice, rating: app.averageUserRating ?? null, ratingCount: app.userRatingCount ?? null,
    version: app.version, updated: app.currentVersionReleaseDate, minimumOs: app.minimumOsVersion,
    languages: app.languageCodesISO2A || [], genres: app.genres || [], contentRating: app.contentAdvisoryRating,
    sizeMB: app.fileSizeBytes ? Math.round(Number(app.fileSizeBytes) / 1e6) : null,
    screenshots: [...(app.screenshotUrls || []), ...(app.ipadScreenshotUrls || [])].slice(0, 4),
    artwork: app.artworkUrl512 || app.artworkUrl100,
  };
}

async function lookup(ids) {
  const found = {};
  for (const country of ['th', 'us']) {
    const missing = ids.filter(i => !found[i]);
    if (!missing.length) break;
    const json = await get(`https://itunes.apple.com/lookup?id=${missing.join(',')}&country=${country}&entity=software`, 'json');
    for (const app of json.results || []) found[app.trackId] = { ...app, _country: country };
    await sleep(1200);
  }
  return found;
}

// หาแอปของผลิตภัณฑ์เดียวกัน: ผู้ขายต้องมีชื่อ owner และชื่อแอปต้องมีชื่อผลิตภัณฑ์
async function searchSameProduct(r, hint) {
  for (const entity of ['software', 'macSoftware']) {
    const json = await get(`https://itunes.apple.com/search?term=${encodeURIComponent(hint?.term || r.name)}&entity=${entity}&country=us&limit=10`, 'json');
    await sleep(1200);
    const ownerKey = norm(hint?.seller || r.owner.split(/[\/(]/)[0]).slice(0, 8);
    const nameKey = norm((hint?.term || r.name).split(/[\s:]/)[0]);
    const hit = (json.results || []).find(a => ownerKey && norm(a.sellerName || a.artistName).includes(ownerKey) && norm(a.trackName).includes(nameKey));
    if (hit) return hit;
  }
  return null;
}

function parseHtml(html, base) {
  const attr = (tag, name) => (tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1];
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const meta = key => { const t = metas.find(m => new RegExp(`(name|property)\\s*=\\s*["']${key}["']`, 'i').test(m)); return t ? attr(t, 'content') : null; };
  const icons = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).filter(t => /rel\s*=\s*["'][^"']*icon/i.test(t)).map(t => {
    const rel = attr(t, 'rel').toLowerCase(); const size = parseInt((attr(t, 'sizes') || '0').split('x')[0], 10) || 0;
    return { href: new URL(attr(t, 'href') || '', base).href, score: (rel.includes('apple-touch') ? 1000 : 0) + size + (/\.svg/.test(attr(t, 'href') || '') ? 500 : 0) };
  }).filter(i => /^https?:/.test(i.href)).sort((a, b) => b.score - a.score);
  const decode = s => s && s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  return {
    title: decode(meta('og:title') || (html.match(/<title[^>]*>([^<]*)/i) || [])[1]),
    description: decode(meta('description') || meta('og:description')),
    icons: [...icons.map(i => i.href), new URL('/apple-touch-icon.png', base).href, new URL('/favicon.ico', base).href],
  };
}

async function main() {
  const only = process.argv.slice(2);
  const list = resources.filter(r => !only.length || only.includes(r.id));
  let previous = { items: {} };
  try { previous = JSON.parse(fs.readFileSync(OUT, 'utf8').replace(/^[^{]*/, '').replace(/;\s*$/, '')); } catch { /* ไฟล์ตั้งต้นหรือยังไม่มี */ }
  const items = { ...previous.items };
  const errors = [];
  const byId = await lookup(list.map(r => details[r.id]?.appStoreId).filter(Boolean)).catch(e => (errors.push(`App Store lookup: ${e.message}`), {}));
  for (const r of list) {
    const d = details[r.id] || {};
    const item = { checked: new Date().toISOString().slice(0, 10) };
    try {
      let app = d.appStoreId ? byId[d.appStoreId] : null;
      if (d.appStoreId && !app) errors.push(`${r.id}: ไม่พบ appStoreId ${d.appStoreId} ใน App Store`);
      if (!app) {
        app = await searchSameProduct(r, d.appSearch).catch(e => (errors.push(`${r.id}: search ${e.message}`), null));
        if (app) item.matchedBy = `iTunes Search: ผู้ขาย "${app.sellerName}" ตรงกับ owner`;
      }
      if (app) Object.assign(item, fromItunes(app));
      // หน้าเจ้าของ: คำอธิบายเว็บ + ไอคอนเว็บ (ใช้เป็นไอคอนหลักเมื่อไม่มีแอป)
      try {
        const page = await get(r.url);
        const meta = parseHtml(page.text, page.url);
        item.web = { title: meta.title, description: meta.description, url: page.url };
        if (!item.artwork) for (const href of meta.icons) {
          try { item.icon = await saveIcon(r.id, href); item.iconFrom = href; break; } catch { /* ลองตัวถัดไป */ }
        }
      } catch (e) { errors.push(`${r.id}: หน้าเจ้าของ ${e.message}`); }
      if (item.artwork) { item.icon = await saveIcon(r.id, item.artwork); item.iconFrom = item.artwork; }
      if (!item.icon) errors.push(`${r.id}: ไม่พบไอคอน — หน้าเว็บจะแสดงอักษรย่อแทน`);
      items[r.id] = item;
      console.log(`✓ ${r.id}: ${item.kind === 'app-store' ? 'App Store' : 'เว็บ'} · ไอคอน ${item.icon || '—'}`);
    } catch (e) { errors.push(`${r.id}: ${e.message}`); console.log(`✗ ${r.id}: ${e.message}`); }
    await sleep(600);
  }
  const data = { generatedAt: new Date().toISOString(), note: 'สร้างโดย tools/fetch-app-details.cjs — ข้อความและไอคอนมาจาก App Store/เว็บของเจ้าของผลิตภัณฑ์ อย่าแก้มือ', errors, items };
  fs.writeFileSync(OUT, `window.MILAppStore = ${JSON.stringify(data, null, 1)};\n`);
  console.log(`\nเขียน ${path.relative(process.cwd(), OUT)}: ${Object.keys(items).length} รายการ, ${errors.length} ปัญหา`);
  for (const e of errors) console.log('  ! ' + e);
}

main().catch(e => { console.error(e); process.exit(1); });
