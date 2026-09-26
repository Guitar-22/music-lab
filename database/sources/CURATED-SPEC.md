# Spec: ไฟล์ข้อมูลสถานที่จากการค้นเว็บ (sources/curated/<slug>.json)

หนึ่งไฟล์ต่อหนึ่งเขต `slug` = ชื่อภาษาอังกฤษจาก `lib/districts.cjs` (เช่น `pathum-wan`)
ข้อมูล OSM ของเขตอยู่แล้วใน `sources/osm/<slug>.json` — ไฟล์นี้ **เติมส่วนที่ OSM ไม่มี** และ **ตรวจทาน** รายการ OSM

```json
{
  "district": "ปทุมวัน",
  "researchedAt": "2026-09-26",
  "places": [
    {
      "id": "cur:music-collection-siam-paragon",
      "name": "Music Collection สาขาสยามพารากอน",
      "name_en": "Music Collection Siam Paragon",
      "kind": "instrument_store",
      "address": "สยามพารากอน ชั้น 2, 991 ถ.พระราม 1",
      "geocode": "Siam Paragon, Bangkok",
      "lat": null, "lon": null,
      "phone": "02 129 4460",
      "website": "https://www.music.co.th/",
      "social": ["https://www.facebook.com/musiccollectionthai"],
      "hours": "10:30-20:30 ทุกวัน",
      "offer": ["กีตาร์", "เบส", "เอฟเฟกต์"],
      "source_url": "https://www.siamparagon.co.th/directory/store/music-collection-occupant-808",
      "evidence": "หน้า directory ของห้างระบุชั้น 2F และเวลา 10:30-20:30",
      "checked": "2026-09-26"
    }
  ],
  "review": {
    "osm:n2874223588": { "kind": "higher_ed", "note": "ห้องดนตรีไทยในจุฬาฯ รวมกับคณะ" },
    "osm:n12712926160": { "exclude": true, "note": "โชว์งู สถานเสาวภา ไม่เกี่ยวกับดนตรี" }
  },
  "gaps": ["ห้องซ้อมย่านสามย่านยังไม่พบหน้าเจ้าของ"]
}
```

## กติกา (Gate D จะตรวจ)

1. `kind` ต้องเป็นค่าใน `lib/classify.cjs` KINDS (ยกเว้น `excluded`, `unclassified`)
2. `source_url` ต้องเป็น https และเป็น **หน้าของเจ้าของสถานที่ / ห้าง / หน่วยงาน / Facebook page ของเจ้าของ** — ไม่ใช้บล็อกรีวิวเป็นแหล่งเดียว
3. ห้ามคัดลอกข้อมูลจาก Google Maps ลงไฟล์ (ข้อกำหนดการใช้งานของ Google) ใช้ Maps ได้แค่เป็นลิงก์ให้คนตรวจ; ตำแหน่งให้ใส่ `geocode` (ชื่ออาคาร/ที่อยู่) ระบบจะหาพิกัดจาก OpenStreetMap Nominatim เอง
4. ห้ามเดาข้อมูล: ถ้าไม่แน่ใจเบอร์/เวลา ให้เว้นเป็น null; ห้ามใส่ข้อมูลส่วนบุคคล (เบอร์มือถือครูรายบุคคล, อีเมลส่วนตัว)
5. ถ้าสถานที่อยู่ในรายการ OSM แล้ว **อย่าเพิ่มซ้ำ** ให้ใส่ใน `review` แทน (แก้ kind/เพิ่ม note/ยืนยัน)
6. รายการ OSM ที่ classify เป็น `unclassified` ต้องมีใน `review` ทุกตัว
7. สาขาเครือข่าย (Yamaha, Music Collection, MelodyPlus ...) ลงแยกหนึ่งรายการต่อสาขาในเขตนั้น
8. `id` ขึ้นต้น `cur:` เป็นตัวพิมพ์เล็ก-ขีด ไม่ซ้ำทั้งโครงการ

## บทเรียนจาก wave 1 (อ่านก่อนเริ่ม)

- **geocode ต้องเจาะจง**: ใช้ชื่ออาคาร/ห้าง/สถานที่ที่มีบน OpenStreetMap (เช่น `Center Point Siam Square`, `กรมดุริยางค์ทหารบก`, `ศิลปกรรมศาสตร์ จุฬา`) หรือ "ชื่อซอย + Bangkok" ห้ามใช้ชื่อเขต/แขวงเป็นคำค้น และหลีกเลี่ยง "Faculty of …, Bangkok" (เคยได้พิกัดวิทยาเขตศาลายา ห่าง 17 กม.)
- หลังเขียนไฟล์ ให้รันตามลำดับจากโฟลเดอร์ `database`:
  1. `node collect/geocode.cjs` — หาพิกัด (ปลอดภัยเมื่อรันพร้อมกันหลาย agent)
  2. `node --no-warnings build.cjs --check --district <ชื่อเขตไทย>` — Gate D แบบอ่านอย่างเดียว; **ต้องได้ 0 errors** ก่อนรายงานว่าเสร็จ
  3. ถ้าพิกัดผิดเขต: เปลี่ยน `geocode` ให้เจาะจงขึ้น แล้วลบ key นั้นใน `sources/geocode-cache.json` ก่อนรันข้อ 1 ใหม่ ถ้าหาไม่ได้จริง ให้ตั้ง `geocode` เป็น null (ขึ้นในรายการแต่ไม่ปักหมุด) ดีกว่าปักผิด
- **อย่ารัน `npm run build`** (เขียนไฟล์ฐานข้อมูล ชนกับ agent อื่น) — ผู้ประสานงานจะ build เอง
- หน้าที่ถูกยึดโดเมน (บล็อก/พนัน) หรือร้านที่ปิดถาวร ให้ใส่ใน `gaps` ไม่ใช่ `places`
- ที่อยู่จากนิตยสาร/ไดเรกทอรีให้ทำเครื่องหมาย `(lead)` ใน evidence
