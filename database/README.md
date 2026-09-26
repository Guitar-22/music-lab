# ฐานข้อมูลรวม Music Industry Lap

รวมข้อมูลทุกแหล่งในโครงการเป็น SQLite ไฟล์เดียว ผ่านด่านตรวจ (Gate) ทีละขั้น ไม่ต้องติดตั้งแพ็กเกจ (ใช้ `node:sqlite` ใน Node 22.13+)

```powershell
cd database
npm run build          # สร้าง out/music-lab.db, out/snapshot.json, out/gate-report.md
npm test
npm run query -- summary
```

## ขั้นตอนและ Gate

| ขั้น | ไฟล์ | Gate | หยุดเมื่อ |
|---|---|---|---|
| 1. Extract | `lib/extract.cjs` | **A-source** | ฟิลด์ขาด, ลิงก์ไม่ใช่ HTTPS, id ซ้ำ, หมวด/ranking/preview อ้าง resource ที่ไม่มี, จำนวนต่ำกว่าที่เอกสารระบุ (35 แหล่ง, 25 สถาบัน, 11 กลุ่มโรงเรียน, 50 เขต, 24 เอกสารขึ้นไป) |
| 1b. สถานที่รายเขต | `lib/places.cjs` (OSM + ค้นเว็บ + review) | **D-places** | ชื่อ/ประเภทผิด, พิกัดนอกกรุงเทพฯ หรือตกคนละเขต (> 300 ม.), ใช้ Google Maps เป็นแหล่ง, ชื่อซ้ำในระยะ 150 ม., เขตที่ค้นเว็บแล้วแต่ยังมีรายการไม่จัดประเภท |
| 1c. ตรวจบริบท | `lib/context.cjs`, `sources/context-review.json` | **D-places** | ชื่อมีคำดนตรีแต่ tag/ที่อยู่บอกเป็นอย่างอื่น (วัด ร้านจักรยาน อัฒจันทร์ในสวน), เขตในที่อยู่/ห้างขัดกับพิกัด, ร้านเดียวกันจากคนละแหล่ง — `name_only/generic/conflict` ไม่แสดงใน portal จนกว่าจะตรวจ |
| 2. Load | `schema.sql`, `lib/load.cjs` | **B-database** | จำนวนแถวทุกตารางไม่ตรงต้นทาง, foreign key ขาด, integrity_check ไม่ผ่าน |
| 3. Export | `build.cjs` | **C-audit-drift** | เทียบ `audit/*.csv` กับข้อมูลปัจจุบัน — เป็น warning (ใช้ `npm run build:strict` ให้ล้ม) |

ถ้า Gate A/B ไม่ผ่าน ไฟล์ฐานข้อมูลเดิมจะไม่ถูกแทนที่ ผลทุก gate บันทึกในตาราง `gate_runs` และ `out/gate-report.md`

## เก็บสถานที่ทีละเขต (Bangkok)

ลำดับงานอยู่ใน `lib/districts.cjs`: **wave 1** แกนกลาง 6 เขต → **wave 2** วงใน 20 เขต → **wave 3** วงนอก 24 เขต

```powershell
node collect/boundaries.cjs          # ขอบเขต 50 เขตจาก OSM → sources/geo/districts.json (ครั้งเดียว)
node collect/osm.cjs --wave 2        # หรือระบุชื่อเขต: node collect/osm.cjs ปทุมวัน
# ค้นเว็บแล้วเขียน sources/curated/<slug>.json ตาม sources/CURATED-SPEC.md
node collect/geocode.cjs             # พิกัดจาก Nominatim (cache, 1 คำขอ/วินาที, บอกความแม่นยำ)
node --no-warnings build.cjs --check --district ปทุมวัน   # Gate D แบบอ่านอย่างเดียว
npm run build
```

- **แหล่งข้อมูล:** OpenStreetMap (ODbL — ต้องแสดง "© OpenStreetMap contributors"), หน้าเจ้าของ/ห้าง/สถาบัน; **ไม่ดึงหรือคัดลอกข้อมูลจาก Google Maps** (ข้อกำหนดการใช้งาน) แอปให้ลิงก์ Google Maps เพื่อให้ผู้ใช้ตรวจเองเท่านั้น
- พิกัดที่ได้จากถนน/แขวงหรือคำค้นแบบย่อ ถูกบันทึกว่า "โดยประมาณ" และขึ้นเป็น warning; หาพิกัดไม่ได้ = อยู่ในรายการแต่ไม่ปักหมุด ดีกว่าปักผิด
- รายการที่ถูกคัดออกเก็บใน `place_rejects` พร้อมเหตุผล (`no_name`, `excluded`, `not_poi`, `duplicate_cross_district`)

## แหล่งที่ดึง

- `portal/resources.js` → `categories`, `resources`, `resource_guide_steps`, `resource_alternates`
- `portal/editorial.js` → `resource_previews`, `rankings`, `ranking_picks`
- `portal/institutions.js` → `universities`, `university_majors`, `school_groups`, `school_genres`, `school_branches`
- `portal/zones.js` → `zones`, `districts`
- เอกสาร `01–25*.md` → `documents`, `doc_tables`, `doc_table_rows` (เซลล์เป็น JSON ตามหัวตาราง), `doc_links`
- `sources/osm`, `sources/curated`, `sources/geo` → `places`, `place_social`, `place_offer`, `place_rejects`, `district_progress`, `district_shapes`
- View `all_urls` รวมทุก URL ในโครงการพร้อมที่มา สำหรับไล่ตรวจลิงก์

## คำสั่ง query

`summary` · `resources [หมวด]` · `free-thai` · `universities [คำค้น]` · `schools [เขต/แนว]` · `urls` · `sql "SELECT ..."` (อ่านอย่างเดียว)

แก้ข้อมูลที่ต้นทาง (`portal/*.js` หรือเอกสาร .md) แล้ว build ใหม่ อย่าแก้ในไฟล์ .db โดยตรง
