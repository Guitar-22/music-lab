'use strict';
// Task 2 — เขียนข้อมูลที่ผ่าน Gate A ลง SQLite ใน transaction เดียว
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');

function createDatabase(file) {
  if (file !== ':memory:' && fs.existsSync(file)) fs.rmSync(file);
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

function load(db, { portal, documents }) {
  const ins = sql => db.prepare(sql);
  db.exec('BEGIN');
  try {
    const cat = ins('INSERT INTO categories VALUES (?,?)');
    for (const [id, label] of portal.categories) if (id !== 'all') cat.run(id, label);

    const res = ins(`INSERT INTO resources VALUES (${Array(22).fill('?').join(',')})`);
    const step = ins('INSERT INTO resource_guide_steps VALUES (?,?,?)');
    const alt = ins('INSERT INTO resource_alternates VALUES (?,?,?)');
    for (const r of portal.resources) {
      const g = r.guide;
      res.run(r.id, r.name, r.owner, r.url, r.source, r.category, r.goal, r.first, r.cost, r.costText,
        r.account, r.device, r.language, r.thai ? 1 : 0, r.noInstrument ? 1 : 0, r.checked, r.note,
        r.sourceType, g.what, g.best, g.limit, g.next);
      g.steps.forEach((s, i) => step.run(r.id, i + 1, s));
      for (const a of r.alternates || []) alt.run(r.id, a.name, a.url);
    }

    const prev = ins('INSERT INTO resource_previews VALUES (?,?,?,?,?)');
    for (const [id, p] of Object.entries(portal.previews)) prev.run(id, p.url, p.source, p.credit ?? null, p.kind ?? null);

    const rank = ins('INSERT INTO rankings VALUES (?,?,?,?)');
    const pick = ins('INSERT INTO ranking_picks VALUES (?,?,?,?,?,?,?)');
    for (const r of portal.rankings) {
      rank.run(r.id, r.title, r.audience ?? null, r.basis ?? null);
      r.picks.forEach((p, i) => pick.run(r.id, i + 1, p.id, p.reason ?? null, p.evidence ?? null, p.evidenceUrl ?? null, p.confidence ?? null));
    }

    const uni = ins('INSERT INTO universities (name,faculty,province,region,levels,url,extra_url,note) VALUES (?,?,?,?,?,?,?,?)');
    const major = ins('INSERT INTO university_majors VALUES (?,?)');
    for (const u of portal.universities) {
      const { lastInsertRowid: id } = uni.run(u.name, u.faculty, u.province, u.region, u.levels, u.url, u.extra || null, u.note || null);
      for (const m of u.majors) major.run(id, m);
    }

    const sch = ins('INSERT INTO school_groups (name,type,area,url,locator_url,note) VALUES (?,?,?,?,?,?)');
    const genre = ins('INSERT INTO school_genres VALUES (?,?)');
    const branch = ins('INSERT INTO school_branches VALUES (?,?)');
    for (const s of portal.schools) {
      const { lastInsertRowid: id } = sch.run(s.name, s.type, s.area, s.url, s.locator || null, s.note || null);
      for (const g of s.genres) genre.run(id, g);
      for (const b of s.branches || []) branch.run(id, b);
    }

    const zone = ins('INSERT INTO zones VALUES (?,?)');
    const dist = ins('INSERT INTO districts VALUES (?,?)');
    for (const z of portal.zones) {
      zone.run(z.id, z.name);
      for (const d of z.districts) dist.run(d, z.id);
    }

    const doc = ins('INSERT INTO documents VALUES (?,?,?)');
    const tbl = ins('INSERT INTO doc_tables (file,heading,line,headers) VALUES (?,?,?,?)');
    const row = ins('INSERT INTO doc_table_rows VALUES (?,?,?)');
    const link = ins('INSERT INTO doc_links (file,line,heading,text,url) VALUES (?,?,?,?,?)');
    for (const d of documents) {
      doc.run(d.file, d.title, d.bytes);
      for (const t of d.tables) {
        const { lastInsertRowid: tid } = tbl.run(d.file, t.heading, t.line, JSON.stringify(t.headers));
        t.rows.forEach((cells, i) => {
          const obj = {};
          cells.forEach((c, j) => {
            let key = t.headers[j] || `col${j + 1}`;
            if (key in obj) key = `${key}#${j + 1}`; // หัวตารางซ้ำ/ว่าง ไม่ให้ทับกัน
            obj[key] = c;
          });
          row.run(tid, i + 1, JSON.stringify(obj));
        });
      }
      for (const l of d.links) link.run(d.file, l.line, l.heading, l.text, l.url);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function loadPlaces(db, { places, rejects, progress }, shapes) {
  const { KINDS } = require('./classify.cjs');
  db.exec('BEGIN');
  try {
    const prog = db.prepare('INSERT INTO district_progress VALUES (?,?,?,?,?,?,?,?,?)');
    for (const p of progress) prog.run(p.district, p.wave, p.status, p.osm_fetched_at, p.researched_at, p.osm_places, p.web_places, p.chain_places || 0, JSON.stringify(p.gaps));
    const shape = db.prepare('INSERT INTO district_shapes VALUES (?,?,?)');
    for (const s of shapes) shape.run(s.name, s.rel, JSON.stringify(s.rings));
    const ins = db.prepare(`INSERT INTO places VALUES (${Array(19).fill('?').join(',')})`);
    const soc = db.prepare('INSERT OR IGNORE INTO place_social VALUES (?,?)');
    const off = db.prepare('INSERT OR IGNORE INTO place_offer VALUES (?,?)');
    for (const p of places) {
      ins.run(p.id, p.name, p.name_en, p.kind, KINDS[p.kind].layer, p.district, p.lat, p.lon, p.address, p.geocode,
        p.phone, p.website, p.hours, p.source, p.source_url, p.license, p.evidence, p.checked, p.review_note);
      for (const s of p.social) soc.run(p.id, s);
      for (const o of p.offer) off.run(p.id, o);
    }
    const rej = db.prepare('INSERT INTO place_rejects VALUES (?,?,?,?)');
    for (const r of rejects) rej.run(r.id, r.district, r.reason, r.note ?? null);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function recordGate(db, result, runAt) {
  db.prepare('INSERT INTO gate_runs (run_at,gate,pass,errors,warnings,stats) VALUES (?,?,?,?,?,?)')
    .run(runAt, result.gate, result.pass ? 1 : 0, JSON.stringify(result.errors), JSON.stringify(result.warnings), JSON.stringify(result.stats));
}

module.exports = { createDatabase, load, loadPlaces, recordGate };
