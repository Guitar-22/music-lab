'use strict';
// ใช้: node query.cjs <คำสั่ง> [ค่า]
//   summary                 จำนวนแถวทุกตาราง + ผล gate ล่าสุด
//   resources [หมวด]        แหล่งเรียน (กรองตามหมวดได้)
//   free-thai               แหล่งฟรีที่ใช้ภาษาไทยได้หรือไม่ต้องมีเครื่อง
//   universities [คำค้น]    สถาบันและสาขา (ค้นชื่อ/สาขา/จังหวัด)
//   schools [เขตหรือแนว]    กลุ่มโรงเรียนกรุงเทพฯ
//   urls                    ทุก URL ในโครงการ (ไม่ซ้ำ) พร้อมจำนวนที่อ้าง
//   sql "<SELECT ...>"      คำสั่ง SELECT เอง (อ่านอย่างเดียว)
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB = path.join(__dirname, 'out', 'music-lab.db');

const QUERIES = {
  summary: db => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const counts = tables.map(({ name }) => ({ table: name, rows: db.prepare(`SELECT COUNT(*) n FROM ${name}`).get().n }));
    const gates = db.prepare('SELECT gate, pass, run_at, json_array_length(warnings) warnings FROM gate_runs WHERE run_at=(SELECT MAX(run_at) FROM gate_runs)').all();
    return [...counts, ...gates];
  },
  resources: (db, cat) => db.prepare(`SELECT r.id, r.name, c.label category, r.cost_text, r.thai, r.url
    FROM resources r JOIN categories c ON c.id=r.category_id WHERE ?1 IS NULL OR r.category_id=?1 ORDER BY c.id, r.name`).all(cat ?? null),
  'free-thai': db => db.prepare(`SELECT id, name, cost_text, thai, no_instrument, url FROM resources
    WHERE cost='free' AND (thai=1 OR no_instrument=1) ORDER BY name`).all(),
  universities: (db, q) => db.prepare(`SELECT u.name, u.faculty, u.province, group_concat(m.major, ', ') majors, u.url
    FROM universities u JOIN university_majors m ON m.university_id=u.id GROUP BY u.id
    HAVING ?1 IS NULL OR u.name LIKE ?2 OR u.province LIKE ?2 OR majors LIKE ?2 ORDER BY u.id`).all(q ?? null, `%${q ?? ''}%`),
  schools: (db, q) => db.prepare(`SELECT s.name, s.type, s.area,
      (SELECT group_concat(genre, ', ') FROM school_genres WHERE school_id=s.id) genres,
      (SELECT COUNT(*) FROM school_branches WHERE school_id=s.id) branches, s.url
    FROM school_groups s WHERE ?1 IS NULL OR s.area LIKE ?2 OR genres LIKE ?2
      OR EXISTS (SELECT 1 FROM school_branches b WHERE b.school_id=s.id AND b.branch LIKE ?2) ORDER BY s.id`).all(q ?? null, `%${q ?? ''}%`),
  urls: db => db.prepare('SELECT url, COUNT(*) refs, group_concat(DISTINCT kind) kinds FROM all_urls GROUP BY url ORDER BY refs DESC, url').all(),
  sql: (db, text) => {
    if (!/^\s*(SELECT|WITH)\b/i.test(text || '')) throw new Error('รับเฉพาะ SELECT/WITH');
    return db.prepare(text).all();
  },
};

function run(cmd, arg, file = DB) {
  const fn = QUERIES[cmd];
  if (!fn) throw new Error(`ไม่รู้จักคำสั่ง ${cmd}; ใช้ได้: ${Object.keys(QUERIES).join(', ')}`);
  const db = new DatabaseSync(file, { readOnly: true });
  try { return fn(db, arg).map(r => ({ ...r })); } finally { db.close(); }
}

if (require.main === module) {
  const [cmd = 'summary', arg] = process.argv.slice(2);
  try { console.table(run(cmd, arg)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}

module.exports = { run, QUERIES };
