# Music Industry Lap Portal — Phase 1

เปิด [index.html](index.html) ในเบราว์เซอร์ได้ทันที เป็นหน้า static ไม่มีเซิร์ฟเวอร์ บัญชี หรือฐานข้อมูล ผู้เรียนเลือก 12 หมวดงาน คำค้น และตัวกรอง **ใช้ฟรี / ยังไม่มีเครื่อง / ภาษาไทย** จากนั้นกด **ดูคำแนะนำ** เพื่ออ่านรายละเอียดก่อนเปิดแหล่งจริงในแท็บใหม่ หน้า [สถาบันและแผนที่](institutions.html) แสดงสาขาดนตรีในมหาวิทยาลัยไทยและทางค้นโรงเรียนดนตรีกรุงเทพฯ ตามแนวเพลง

ข้อมูล 35 แหล่งอยู่ใน [resources.js](resources.js) ซึ่งบันทึกหมวด เป้าหมาย คำแนะนำเริ่มต้น ค่าใช้จ่าย การสมัคร อุปกรณ์ ภาษา ข้อจำกัด ชนิดหลักฐาน และวันที่ตรวจไว้เป็นรายแหล่ง ส่วน [editorial.js](editorial.js) เก็บภาพจากเจ้าของผลิตภัณฑ์และเหตุผลของ Ranking ตามงาน; [institutions.js](institutions.js) เก็บสถาบันและแหล่งต้นทาง อ่าน [ทะเบียนเครื่องมือ](../docs/3-sources/02-resource-directory.md), [วิธีจัดอันดับ](../docs/3-sources/03-pro-workflows-ranking.md) และ [ทะเบียนสถาบัน](../docs/3-sources/04-institutions-and-bangkok-map.md) ก่อนแก้ข้อมูล

หน้าเว็บไม่เก็บข้อมูลหรือส่งคำค้นของผู้เรียนไปที่เซิร์ฟเวอร์ Music Industry Lap เมื่อคลิกลิงก์ เว็บไซต์ปลายทางจะใช้นโยบายของเจ้าของเว็บนั้นเอง

## Journey Gate — สำรวจตัวตนทางดนตรี (26 ก.ย. 2569)

[journey.html](journey.html) คือทางเข้าหลักสำหรับคนที่ยังไม่รู้ว่าจะเริ่มตรงไหน: ตอบ 7 คำถาม → ได้ตัวตนทางดนตรี + เส้นทาง 3 ห้อง + 3 แหล่งที่ควรลองก่อน แล้วเดินผ่าน 6 ห้องที่เชื่อมกัน. รายละเอียดแอปอยู่ใน [app-details.js](app-details.js), ตรรกะอยู่ใน [journey-engine.js](journey-engine.js), ไอคอนจริงใช้ [app-icons.js](app-icons.js). อ่านนิยาม MVP และผลตรวจที่ [29-journey-gate-mvp.md](../docs/5-product/06-journey-gate-mvp.md) · หน้าตาและพฤติกรรมออกแบบตาม Apple Human Interface Guidelines (tab bar, large title, sheet, โหมดมืด, Dynamic Type) — ดู [30-apple-hig-design-spec.md](../docs/5-product/07-apple-hig-design-spec.md)

```powershell
node portal/tools/fetch-app-details.cjs     # ดึงข้อความทางการ + ไอคอนจริง (ต้องออกอินเทอร์เน็ตได้) → app-store-data.js, assets/icons/
cd portal; node --test                       # unit test
node portal/tools/journey-smoke.cjs <url> <โฟลเดอร์ภาพ> <axe.min.js>   # เดิน flow 3 ขนาดจอ × สว่าง/มืด + ตรวจ axe (ต้องเปิด http.server, มี playwright และ axe-core)
```

## แผนที่ Ecosystem (26 ก.ย. 2569)

[ecosystem.html](ecosystem.html) แสดง 6 ชั้นของระบบนิเวศดนตรี แผนที่ 50 เขต สถานที่ที่ผ่าน Gate และความคืบหน้าการเก็บข้อมูลรายเขต ข้อมูลมาจาก `places-data.js` ซึ่ง **สร้างอัตโนมัติ** เมื่อรัน `npm run build` ในโฟลเดอร์ [database](../database/README.md) — อย่าแก้ไฟล์นั้นเอง

หน้าใช้ JavaScript โหลดไฟล์ข้าง ๆ จึงควรเปิดผ่านเว็บเซิร์ฟเวอร์ เช่น `python -m http.server 8650 --directory portal` แล้วเข้า http://127.0.0.1:8650/ecosystem.html
