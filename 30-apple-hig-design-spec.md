# Journey app — สเปกการออกแบบตาม Apple Human Interface Guidelines

อัปเดต 26 กันยายน 2569 · ใช้กับ [portal/journey.html](portal/journey.html) · ต่อจาก [MVP Journey Gate](29-journey-gate-mvp.md)

เป้าหมาย: ให้ผู้ใช้ iPhone/iPad รู้สึกว่าเป็นแอปของ Apple — โครงนำทาง ภาษาภาพ พฤติกรรม และการเข้าถึง — แม้จะเป็นเว็บ. ทุกข้อด้านล่างอ้างอิง HIG ฉบับปัจจุบัน (ยุค Liquid Glass, iOS/iPadOS 26) ที่อ่านจาก developer.apple.com เมื่อ 26 ก.ย. 2569.

## 1. สิ่งที่ศึกษาและสิ่งที่นำมาใช้

| หัวข้อ HIG | ข้อกำหนดสำคัญ | ที่ใช้ในแอป |
|---|---|---|
| [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | ใช้เพื่อ *นำทาง* ไม่ใช่สั่งงาน · ป้ายคำเดียว · ไม่ซ่อน/ปิดแท็บ · iPhone ลอยด้านล่างบน Liquid Glass · iPad อยู่ด้านบน/เปลี่ยนเป็น sidebar · ไม่เกิน 5 แท็บ · แท็บค้นหาอยู่ท้าย | 4 แท็บ: เริ่มต้น · ห้อง · บันทึก · ค้นหา (ท้ายสุด) · iPhone ลอยล่าง, iPad ลอยบน, จอ ≥1100px เป็น sidebar · แตะแท็บเดิม = เลื่อนกลับบนสุด |
| [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) | Large title แล้วยุบเป็นชื่อเล็กเมื่อเลื่อน · ชื่อ < 15 ตัวอักษร ไม่ใช้ชื่อแอป · ปุ่มย้อนกลับเป็นสัญลักษณ์ ไม่มีคำว่า "Back" · ไม่เกิน 3 กลุ่ม · ปุ่มหลัก 1 ปุ่มทางขวา | ทุกหน้ามี large title → navbar กระจกเมื่อเลื่อน (IntersectionObserver) · ปุ่ม ‹ ไม่มีข้อความ · "เสร็จสิ้น"/"แก้ไข" อยู่ขวา |
| [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) | มี grabber · ปัดลงเพื่อปิด · แสดงทีละ sheet · งานหลายขั้นใช้ full-screen modal แทน · iPad ใช้ form sheet กลางจอ | รายละเอียดแอป = sheet มี grabber ปัดลงได้ (iPhone) / form sheet กลางจอ (iPad, เดสก์ท็อป) · มีครั้งละ 1 sheet · Esc/แตะพื้นหลังเพื่อปิด · โฟกัสกลับที่แถวเดิม |
| [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) | สั้น สนุก · ข้ามได้ · เลื่อนการตั้งค่าที่ไม่จำเป็น · มีค่าเริ่มต้นที่สมเหตุผล | สำรวจตัวตนเป็น modal 7 ข้อ ~2 นาที · มี "ข้าม" ทุกข้อ · ใช้แอปได้โดยไม่ต้องทำ (ห้อง/ค้นหาเปิดได้ทันที) · แก้คำตอบรายข้อได้ภายหลัง |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) | พื้นที่แตะ 44×44 · ปุ่มเด่น 1 ปุ่มต่อหน้า · มีสถานะกด · ป้ายขึ้นต้นด้วยคำกริยา · ปุ่มทำลายข้อมูลเป็นสีแดง | ทุกปุ่ม ≥ 44pt (ขยายด้วย `::after` เมื่อภาพเล็กกว่า) · "ดำเนินการต่อ"/"เปิด" เป็นปุ่มเด่นเดียว · `:active` ทุกปุ่ม · "ล้างข้อมูล" สีแดง |
| [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) | ข้อความสั้น ตัดด้วย … · ตัวเลือกแสดงเครื่องหมาย ✓ · ลูกศร › เฉพาะแถวที่นำทางต่อ | รายการแบบ inset grouped · ตัวเลือกคำถามใช้ ✓ ท้ายแถว · › เฉพาะแถวนำทาง · ↗ สำหรับลิงก์ออกนอกแอป |
| [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) | ≤ 5 ส่วนบน iPhone · กว้างเท่ากัน · ป้ายเป็นคำนาม · ใช้สลับมุมมอง ไม่ใช่นำทาง | ในห้อง: "แนะนำ | ทั้งหมด" สลับรายการ |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) | ฟอนต์ระบบ · Dynamic Type (Body 17, ขั้นต่ำ 11) · หลีกเลี่ยงน้ำหนักบาง · ใช้ฟอนต์ให้น้อย | `-apple-system` + Sukhumvit Set (ไทยของ iOS) · `font: -apple-system-body` ทำให้ขนาดตามการตั้งค่า Dynamic Type บน Safari · ขนาดทั้งหมดเป็น rem ตามตาราง Large Title 34 → Caption 2 11 |
| [Color](https://developer.apple.com/design/human-interface-guidelines/color) + [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) | ใช้สีระบบแบบ semantic · รองรับสว่าง/มืด/เพิ่มความคมชัด · ห้ามมีสวิตช์ธีมของแอปเอง · พื้น base/elevated ในโหมดมืด · ไม่ใช้สีอย่างเดียวสื่อความหมาย | ตัวแปร `--label`, `--label-2`, `--sep`, `--fill-*`, `--bg`, `--bg-elevated` ครบ 3 โหมด · ไม่มีสวิตช์ธีม (ตามระบบ) · sheet ในโหมดมืดใช้พื้น elevated · สถานะ "ไม่เหมาะ" มีทั้งข้อความและสัญลักษณ์ |
| [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Liquid Glass ใช้กับชั้นควบคุมเท่านั้น ห้ามใช้ในเนื้อหา · ใช้อย่างประหยัด · เคารพ Reduce Transparency | กระจก (blur + saturate) เฉพาะ tab bar, navbar เมื่อเลื่อน, ปุ่มลอยใน sheet, alert · เนื้อหาเป็นพื้นทึบ · `prefers-reduced-transparency` และเบราว์เซอร์ที่ไม่รองรับ blur → พื้นทึบ |
| [Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | มีเหตุผล สั้น ยกเลิกได้ · ไม่เคลื่อนไหวกับสิ่งที่ทำบ่อย · มีทางเลือกเมื่อ Reduce Motion | push เลื่อนเข้า 0.28 วิ, ย้อนกลับเลื่อนทิศตรงข้าม · sheet เลื่อนขึ้น · Reduce Motion → เปลี่ยนเป็น fade สั้น และตัดการย่อขนาดเมื่อกด |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | ตัวอักษรคอนทราสต์ 4.5:1 · ขยายตัวอักษรได้ 200% · พื้นที่แตะ 44pt · VoiceOver/คีย์บอร์ด | ดูหัวข้อ 3 |
| [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) | ระบบมาสก์เป็นสี่เหลี่ยมมุมมน · ห้ามเติมเงา/ขอบ/เอฟเฟกต์เอง | แสดงไอคอนจริงในกรอบมุมมนต่อเนื่อง 22.37% + เส้นขอบบาง 0.5pt แบบ App Store · ระหว่างโหลดเป็นช่องเทา · ไม่มีไอคอนจริง → อักษรย่อ |
| [Writing](https://developer.apple.com/design/human-interface-guidelines/writing) | ภาษาง่าย · ปุ่มเป็นคำกริยา · หลีกเลี่ยง "เรา" · ข้อความผิดพลาดไม่โทษผู้ใช้และบอกทางแก้ · empty state มีปุ่มไปต่อ · flow ใช้ "ดำเนินการต่อ" จบด้วย "เสร็จสิ้น" | "เริ่ม", "เปิด", "บันทึก", "ดำเนินการต่อ", "ดูผลลัพธ์", "เสร็จสิ้น" · ไม่ใช้ "เรา" · "ไม่พบ ‘คำค้น’ — ลองสะกดใหม่ …" + ปุ่ม "ดูตามห้อง" · ชื่อหน้า "ที่บันทึกไว้" ไม่ใช้ "ของฉัน" |

## 2. โครงแอป

```
Tab bar ─┬─ เริ่มต้น   : การ์ด Today "ดนตรีแบบไหนที่เป็นคุณ" → แนะนำสำหรับคุณ → เส้นทาง 3 ห้อง → ไทล์ 6 ห้อง
         ├─ ห้อง       : ไทล์แบบ Browse + รายการทุกห้อง → [push] หน้าห้อง (segmented แนะนำ/ทั้งหมด, ประตูไปห้องถัดไป)
         ├─ บันทึก     : รายการที่บันทึก + แก้ไข/นำออก · empty state
         └─ ค้นหา      : ช่องค้นหา + หมวด 12 หมวด + ห้อง · ผลลัพธ์ · empty state
ปุ่มโปรไฟล์ (มุมขวาของ large title) → [push] ตัวตนทางดนตรี: จุดเด่น · ส่วนผสม · เส้นทาง · เริ่มวันนี้ · คำตอบ (แก้รายข้อ) · ล้างข้อมูล (alert ยืนยัน)
แถวแอปใดก็ได้ → [sheet] หน้าแอปแบบ App Store: ไอคอน · เปิด ↗ · บันทึก · แถบข้อมูลเลื่อนข้าง · ทำไมเหมาะกับคุณ · คืออะไร (เพิ่มเติม) · ฟีเจอร์ · เริ่มใช้ · ข้อจำกัด · ข้อความทางการ · ข้อมูล · ลิงก์
การ์ด/ปุ่ม "เริ่ม" → [full-screen modal] 7 คำถาม: ยกเลิก/‹ · "n จาก 7" · ข้าม · แถบความคืบหน้า · ตัวเลือก ✓ · ดำเนินการต่อ
```

ทุกสถานะมี URL (`#/room/studio/app/garageband`) — แชร์ได้ เปิดตรงได้ ปุ่มย้อนกลับของเบราว์เซอร์/ปัดขอบจอทำงานตามคาด: ปิด sheet ก่อน แล้วค่อยย้อนหน้า; flow คำถามกินประวัติรายการเดียว (ย้อนกลับครั้งเดียว = ออกจาก modal).

## 3. รายการตรวจ "ไม่มีจุดบอด" และวิธีพิสูจน์

| ด้าน | เกณฑ์ | ตรวจอย่างไร | ผล |
|---|---|---|---|
| ขนาดหน้าจอ | iPhone 393, iPad 820, เดสก์ท็อป 1366 | `tools/journey-smoke.cjs` เดินครบทุก flow ทั้ง 3 ขนาด | ผ่าน |
| สว่าง/มืด | ทุกหน้าอ่านได้ทั้งสองโหมด | smoke test × 2 โหมด + ภาพหน้าจอ | ผ่าน |
| คอนทราสต์ | WCAG AA (4.5:1 ข้อความเล็ก) | axe-core 4 ทุกหน้า × 6 ชุด | ผ่าน 0 violation |
| พื้นที่แตะ | ≥ 44×44pt | สคริปต์วัด bounding box ทุก button/link (รวม `::after`) | ผ่าน |
| ปุ่มไม่ถูกบัง | ปุ่มบน navbar ไม่ถูก tab bar ทับ | `elementFromPoint` ทุกหน้า | ผ่าน (เคยพบบน iPad และแก้แล้ว) |
| คีย์บอร์ด/VoiceOver | ลำดับโฟกัส, Esc ปิด modal, โฟกัสกลับ, ประกาศเปลี่ยนหน้า, role radio/checkbox/progressbar, ป้าย aria ของไอคอน | smoke test ตรวจโฟกัสกลับหลังปิด sheet; live region ประกาศชื่อหน้าและจำนวนผลค้นหา | ผ่าน |
| Reduce Motion | ไม่มีการเลื่อน/ย่อ | smoke test รันด้วย `reducedMotion: 'reduce'` | ผ่าน |
| Reduce Transparency / Increase Contrast | พื้นทึบ / เส้นแบ่งและข้อความเข้มขึ้น | CSS media query (`prefers-reduced-transparency`, `prefers-contrast: more`) | ใส่แล้ว — ยังไม่ได้ทดสอบบนอุปกรณ์จริง |
| Dynamic Type | ขยายถึง 200% โดยไม่ล้น | ทุกขนาดเป็น rem + แถวใช้ grid/ตัดบรรทัด | ใส่แล้ว — ต้องทดสอบบน iPhone จริงที่ขนาด AX5 |
| Safe area | ไม่ชนรอยบาก/แถบ Home | `viewport-fit=cover` + `env(safe-area-inset-*)` ทุกขอบ | ใส่แล้ว — ต้องทดสอบบนอุปกรณ์จริง |
| ออฟไลน์/ไอคอนโหลดไม่ได้ | ไม่มีภาพเสีย | smoke test บล็อกเน็ตภายนอกทั้งหมด → ช่องเทา → อักษรย่อ | ผ่าน |
| ข้อมูลส่วนตัว | ไม่ส่งออก · ลบได้เอง | เก็บใน localStorage เท่านั้น · "ล้างข้อมูลในอุปกรณ์นี้" + alert ยืนยัน (โฟกัสเริ่มที่ "ยกเลิก") | ผ่าน |
| Deep link | เปิดหน้า+sheet ตรง แล้วปิดกลับหน้าที่ถูก | smoke test `#/room/studio/app/garageband` | ผ่าน |
| ตรรกะแนะนำ | ไม่แนะนำสิ่งที่ใช้ไม่ได้ | `journey.test.cjs` 7 ข้อ | ผ่าน |

## 4. จุดที่ต่างจาก Apple โดยตั้งใจ (และเหตุผล)

- **สีฟ้า**: systemBlue ของ Apple (#0088FF) ได้คอนทราสต์ 3.5:1 บนพื้นขาว — ไม่ผ่าน AA สำหรับข้อความเล็ก. ใช้ #0A5AD4 (สว่าง) / #4AA8FF (มืด) ซึ่งผ่าน ≥ 4.8:1 บนพื้นทุกแบบ; ปุ่มพื้นทึบใช้ `--tint-solid` ให้ตัวอักษรขาวผ่าน 5.4:1 ขึ้นไป.
- **secondaryLabel**: เพิ่มความทึบจาก 60% → 75% (สว่าง) เพื่อผ่าน 4.5:1 บนพื้นเทา #F2F2F7.
- **ระยะบรรทัด**: ไทยใช้ 1.45 แทน 22/17 (1.29) ของละติน เพราะสระบน-ล่างและวรรณยุกต์ชนกัน.
- **สัญลักษณ์**: SF Symbols อนุญาตให้ใช้เฉพาะบนแพลตฟอร์มของ Apple จึงวาดสัญลักษณ์เส้นเองในสไตล์เดียวกัน (เส้น 2pt ปลายมน).
- **Liquid Glass**: เว็บทำได้แค่ blur + saturation ยังไม่มีการหักเหแสง/specular แบบของจริง.
- **Haptics**: เว็บบน iOS สั่นไม่ได้ จึงใช้ภาพ (สถานะกด, ✓, HUD) แทน.
- **Dynamic Type** ทำงานเต็มรูปแบบเฉพาะ Safari บน iOS/iPadOS (`-apple-system-body`); เบราว์เซอร์อื่นใช้การตั้งค่าขนาดตัวอักษรของเบราว์เซอร์.

## 5. งานที่เหลือ

1. ทดสอบบน iPhone และ iPad จริง: VoiceOver อ่านทุกหน้า, Dynamic Type ขนาด AX5, Increase Contrast, Reduce Transparency, safe area แนวนอน.
2. รัน `node portal/tools/fetch-app-details.cjs` บนเครื่องที่ออกอินเทอร์เน็ตได้ เพื่อให้ไอคอนจริงและข้อความทางการแสดงแทนอักษรย่อ.
3. ถ้าจะติดตั้งเป็นแอปบนหน้าจอโฮม (Add to Home Screen) ต้องเพิ่ม `apple-touch-icon` และ web app manifest.
4. ทดสอบกับผู้ใช้จริงตามแผนใน [29-journey-gate-mvp.md](29-journey-gate-mvp.md).

การทดสอบซ้ำ:

```powershell
python -m http.server 8650 --directory portal
node portal/tools/journey-smoke.cjs http://127.0.0.1:8650 <โฟลเดอร์ภาพ> <path>/axe-core/axe.min.js   # npm i axe-core playwright
cd portal; node --test
```

## 6. Typography tokens (อัปเดตตามสเปกทีม)

ทุกข้อความใน `portal/journey.css` ใช้ตัวแปรจากตาราง Text Styles ของ iOS (ขนาด Large) — ห้ามใส่ขนาดตัวอักษรเป็นตัวเลขโดยตรง:

| Style | pt / leading | ตัวแปร | น้ำหนัก |
|---|---|---|---|
| Large Title | 34 / 41 | `--large-title-size` `--large-title-leading` | Regular |
| Title 1 | 28 / 34 | `--title1-*` | Regular |
| Title 2 | 22 / 28 | `--title2-*` | Regular |
| Title 3 | 20 / 25 | `--title3-*` | Regular |
| Headline | 17 / 22 | `--headline-*` | Semibold |
| Body | 17 / 22 | `--body-*` | Regular |
| Callout | 16 / 21 | `--callout-*` | Regular |
| Subheadline | 15 / 20 | `--subheadline-*` | Regular |
| Footnote | 13 / 18 | `--footnote-*` | Regular |
| Caption 1 | 12 / 16 | `--caption1-*` | Regular |
| Caption 2 | 11 / 13 | `--caption2-*` | Regular |

- ฟอนต์: `--font-system` (SF Pro ผ่าน `system-ui, -apple-system, BlinkMacSystemFont`), `--font-rounded` (SF Pro Rounded), `--font-mono` (SF Mono), `--font-serif` (New York); น้ำหนัก `--w-ultralight` … `--w-black` (100–900).
- ขนาดเป็น rem (1rem = Body 17pt) และ `html { font: -apple-system-body }` บน Safari จึงปรับตาม Dynamic Type/ขนาดสำหรับการเข้าถึงทั้งระบบ.
- `truncate_text: avoid`: ชื่อแอป คำอธิบาย และบรรทัดข้อมูลในรายการขึ้นบรรทัดใหม่แทนการตัด; ที่ยังตัดมีเพียงชื่อบนแถบนำทาง (ข้อจำกัดของแถบ) และคำอธิบายยาวใน sheet ที่มีปุ่ม "เพิ่มเติม".
- ข้อ 4 เดิมเรื่อง leading ไทย 1.45 ถูกแทนด้วย leading ตามสเปกนี้.
- **ภาษาไทย (`:root:lang(th)`)**: ขนาดตัวอักษรตามตารางเดิม แต่เพิ่ม leading เป็น Body/Callout/Subheadline/Footnote 1.6, Headline/Caption 1 1.55, Title 1.35–1.45 เพื่อให้สระบน-ล่างและวรรณยุกต์ไม่อึดอัด; หน้าที่เป็นภาษาอื่นกลับไปใช้ leading ตามสเปก iOS อัตโนมัติ.
