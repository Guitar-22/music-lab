# Brief สำหรับ agent ค้นข้อมูลรายเขต

ทำงานจากโฟลเดอร์ `database` ของโปรเจกต์ สร้าง `sources/curated/<slug>.json` ต่อเขต (slug จาก `lib/districts.cjs`) รวม **ทุก** สถานที่ด้านดนตรีที่ยืนยันได้ในเขต: ร้านเครื่องดนตรี/อุปกรณ์/Pro audio (รวมสาขาในห้าง), โรงเรียน/ศูนย์สอนดนตรี (รวมดนตรีไทย), หน่วยดนตรีในมหาวิทยาลัย/วิทยาลัย, สตูดิโอ, ห้องซ้อม, เวทีดนตรีสด, หอแสดง, ร้านซ่อม, ร้านแผ่นเสียง, ธุรกิจดนตรี

**เขียนไฟล์ทันทีเมื่อเสร็จแต่ละเขต** (เคยหยุดกลางทางเพราะ rate limit แล้วงานหาย)

## อ่านก่อน
1. `sources/CURATED-SPEC.md` — รูปแบบ กติกา และ "บทเรียนจาก wave 1"
2. `lib/classify.cjs` — ค่า `kind` ที่ใช้ได้
3. ตัวอย่างคุณภาพ: `sources/curated/din-daeng.json`, `chatuchak.json`
4. ของที่มีแล้วในเขต (OSM + ตัวแทน Yamaha + ไฟล์อื่น) — ห้ามเพิ่มซ้ำ:
   `node -e "const {extractPlaces}=require('./lib/places.cjs');for(const p of extractPlaces().places.filter(p=>p.district==='<เขต>'))console.log(p.id,p.source,p.kind,p.name)"`
   รายการ OSM พร้อมประเภท: `node -e "const {classify}=require('./lib/classify.cjs');const j=require('./sources/osm/<slug>.json');for(const e of j.elements){const t=e.tags||{};console.log('osm:'+e.type[0]+e.id,classify(t),t.name||t['name:en']||'(no name)')}"`
   รายการ OSM ที่เป็น `unclassified` ต้องมีใน `review` ทุกตัว; รายการ `yamaha:` ที่ผิด/ปิด ให้บันทึกใน `gaps`

## แหล่งที่ใช้ได้ดี
- ตัวค้นหาสาขา: Yamaha school locator, Music Collection (music.co.th), Music Concept, Kawai, MelodyPlus, PlaySound, KPN; directory ห้าง (The Mall, Central, Robinson, Seacon, Mega Bangna, Future Park ฯลฯ)
- มหาวิทยาลัย/ราชภัฏในเขต, หน้าเพจ Facebook ของเจ้าของ
- Bangkok Learning City (`learning.bangkok.go.th` หน้าคอร์ส lc-0077/0090/0133/0137/0141/0142) — คอร์สดนตรีฟรีที่ศูนย์นันทนาการ ใส่เป็น `school` อ้างหน้าคอร์ส
- นิตยสาร/ไดเรกทอรีใช้เป็น lead เท่านั้น ถ้าที่อยู่มาจากแหล่งนี้อย่างเดียว ให้ใส่ "(lead)" ใน evidence

## กติกาเด็ดขาด
- source_url https จากเจ้าของ/ห้าง/หน่วยงาน/เพจ Facebook ของเจ้าของ + evidence สั้น; ห้ามเดาเบอร์/เวลา/ที่อยู่ (ใช้ null)
- ห้ามใช้ Google Maps เป็นแหล่ง; ไม่ใส่ข้อมูลส่วนบุคคล; เฉพาะสถานที่ที่อยู่ในเขตจริง; ที่ยืนยันไม่ได้ → `gaps`
- แก้/สร้างไฟล์ได้เฉพาะใน `sources/curated/` (การรัน `collect/geocode.cjs` อัปเดต `sources/geocode-cache.json` ได้); **ห้ามรัน `npm run build`**; ห้ามใช้ browser pane; เก็บไฟล์ชั่วคราวในโฟลเดอร์ย่อยของตัวเองใน scratchpad
- เขตชานเมืองอาจมีน้อยมาก — ไฟล์ที่มี 0–2 รายการแต่ `gaps` ชัดเจนถือว่าใช้ได้

## เกณฑ์เสร็จ
`node collect/geocode.cjs` แล้ว `node --no-warnings build.cjs --check --district <เขต>` ต้องได้ **0 errors** ทุกเขต; รายงานสั้น: รายการตามประเภท, จำนวน review, ผล check, gaps หลัก, แหล่งที่สงสัย
