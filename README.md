# Music Industry Lap

ทางเข้าการเรียนดนตรีในประเทศไทย: ช่วยคนทุกระดับค้นว่าดนตรีแบบไหนเหมาะกับตน แล้วพาไปยังที่เรียน เครื่องมือ และสถานที่จริงที่ตรวจที่มาแล้ว

**สถานะ (26 ก.ย. 2569):** Phase 1 เป็น portal ฟรีที่ลิงก์ไปยังแหล่งที่มีอยู่ · ฐานข้อมูลสถานที่ดนตรีครบ 50 เขตกรุงเทพฯ (339 แห่งที่ผ่าน Gate) · `platform/` และ `app-demo/` เป็นงานทดลองระยะถัดไป ยังไม่เปิดให้ใช้จริง

## เปิดใช้งาน

| ส่วน | เปิดอย่างไร | คืออะไร |
|---|---|---|
| **Journey app** | `portal/journey.html` | สำรวจตัวตนทางดนตรี 7 คำถาม → ห้องที่ใช่ → แอป/เว็บที่ตรวจแล้ว (Apple HIG) |
| **แผนที่ Ecosystem** | `portal/ecosystem.html` | สถานที่ดนตรี 50 เขต 6 ชั้น พร้อมแหล่งข้อมูลและวันที่ตรวจ |
| หน้า portal เดิม | `portal/index.html`, `portal/institutions.html` | ค้นเครื่องมือ 35 แหล่ง · มหาวิทยาลัย 25 แห่ง · โรงเรียนกรุงเทพฯ |
| แอป full stack (ทดลอง) | `cd platform && npm start` | 10 persona · 10 loop (แผนที่ รายงานข้อมูล เคลมร้าน แผนซ้อม เวที ผู้ปกครอง กิจกรรม) |
| ฐานข้อมูล | `cd database && npm run build` | รวมทุกแหล่งเป็น SQLite ผ่าน Gate A–D และสร้างข้อมูลให้แผนที่ |

หน้าใน `portal/` ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ เช่น `python -m http.server 8650 --directory portal` · รายละเอียดแต่ละส่วนอยู่ใน README ของโฟลเดอร์นั้น: [portal](portal/README.md) · [platform](platform/README.md) · [database](database/README.md) · [audit](audit/README.md) · [app-demo](app-demo/README.md)

## เอกสาร (จัดตามหมวด)

### 1 · งานวิจัยการศึกษาดนตรี — [docs/1-research](docs/1-research)
| เอกสาร | สาระ |
|---|---|
| [01 การศึกษาดนตรีปัจจุบัน](docs/1-research/01-current-music-education.md) | ประเด็นสำคัญและผลต่อการออกแบบ |
| [02 หลักสูตรดนตรีในสหรัฐฯ](docs/1-research/02-us-music-programs.md) | ตัวอย่างสาขาจาก 5 สถาบัน |
| [03 แผนที่ Simulation](docs/1-research/03-simulation-map.md) | โจทย์จำลองรายสายงานและวิธีประเมิน |
| [04 รายละเอียดหลักสูตร](docs/1-research/04-detailed-curricula.md) | สิ่งที่เรียนแยกรายสาขาและสถาบัน |
| [05 เปรียบเทียบหลักสูตร](docs/1-research/05-curricula-comparison.md) | เทียบเอกสารและจุดที่แหล่งขัดกัน |
| [06 กรณีศึกษา Simulation](docs/1-research/06-simulation-case-studies.md) | ทดลองงานจริงทั่วระบบนิเวศ |

### 2 · ระบบนิเวศและตลาด — [docs/2-ecosystem](docs/2-ecosystem)
| เอกสาร | สาระ |
|---|---|
| [01 ระบบนิเวศดนตรีไทย](docs/2-ecosystem/01-thailand-ecosystem.md) | ผู้เล่น จำนวนที่ตรวจได้ และช่องว่างข้อมูล |
| [02 ค่าใช้จ่ายและรายได้](docs/2-ecosystem/02-costs-and-income.md) | ค่าเรียน ค่าอุปกรณ์ รายได้อาชีพ |
| [03 ขนาดตลาด](docs/2-ecosystem/03-market-sizing.md) | TAM / SAM / SOM |
| [04 ช่องว่างการเข้าถึง](docs/2-ecosystem/04-access-gaps.md) | ตัวแปรและตัวชี้วัดที่ต้องเก็บ |
| [05 ออกแบบ Ecosystem](docs/2-ecosystem/05-ecosystem-design.md) | 6 ชั้น และภาพจากข้อมูลรายเขต |

### 3 · ทะเบียนแหล่งข้อมูล — [docs/3-sources](docs/3-sources)
| เอกสาร | สาระ |
|---|---|
| [01 แหล่งข้อมูลและทะเบียนหลักฐาน](docs/3-sources/01-sources-and-evidence-ledger.md) | แหล่งหลัก + ตัวเลขไทย ปี ขอบเขต ข้อห้ามตีความ |
| [02 ทะเบียนเครื่องมือเรียน](docs/3-sources/02-resource-directory.md) | 35 แอป/เว็บ แยกตามงานที่ผู้เรียนทำ |
| [03 เครื่องมือมืออาชีพ](docs/3-sources/03-pro-workflows-ranking.md) | หลักฐานและวิธีจัดอันดับตามงาน |
| [04 สถาบันและแผนที่กรุงเทพฯ](docs/3-sources/04-institutions-and-bangkok-map.md) | มหาวิทยาลัย 25 แห่ง · โรงเรียน 11 กลุ่ม |

### 4 · ผู้ใช้ — [docs/4-users](docs/4-users)
| เอกสาร | สาระ |
|---|---|
| [01 Learner journey](docs/4-users/01-learner-journey.md) | จาก "อยากเรียน" ถึงเลือกครูและที่เรียน |
| [02 วิจัยประกอบแอป](docs/4-users/02-app-research.md) | หลักฐานและผลิตภัณฑ์ที่มีอยู่ |
| [03 ระดมความคิด 10 รอบ](docs/4-users/03-ten-brainstorm-rounds.md) | ข้อโต้แย้งและวิธีทดสอบ |
| [04 Persona และ Use case](docs/4-users/04-personas-and-use-cases.md) | **ชุดเดียว**: 10 persona, 24 use case, 10 loop (รวมชุดฝั่ง portal แล้ว) |
| [05 ตลาดครู](docs/4-users/05-teacher-marketplace.md) | ครูลงบริการสอนและแรงจูงใจสองฝั่ง |

### 5 · ออกแบบผลิตภัณฑ์ — [docs/5-product](docs/5-product)
| เอกสาร | สาระ |
|---|---|
| [01 Journey blueprint](docs/5-product/01-journey-blueprint.md) | หน้าจอหลักและแผนทดสอบ MVP |
| [02 ต้นแบบหน้าจอ](docs/5-product/02-journey-prototype.html) | ต้นแบบมือถือกดดูได้ (ข้อมูลสมมติ) |
| [03 ถ่ายทอด UX/UI](docs/5-product/03-design-transfer.md) | เทียบ use case กับ SAMT, Musora, BandLab |
| [04 Full stack journey](docs/5-product/04-fullstack-journey.md) | หน้าเว็บ ↔ API ↔ สถานะข้อมูล |
| [05 Loop · UX spec · Backlog](docs/5-product/05-app-loops-journey-ux-spec.md) | 10 loop, หน้าจอตามบทบาท, API, สถานะงาน Dev |
| [06 Journey Gate MVP](docs/5-product/06-journey-gate-mvp.md) | ประตูสำรวจตัวตน + ห้องที่เชื่อมกัน |
| [07 สเปก Apple HIG](docs/5-product/07-apple-hig-design-spec.md) | ระบบการออกแบบที่ทุกหน้าใช้ร่วมกัน |

### 6 · แผนและสถานะ — [docs/6-plan](docs/6-plan)
| เอกสาร | สาระ |
|---|---|
| [01 บริบทโครงการ](docs/6-plan/01-project-context.md) | ข้อสรุปที่ต้องจำสำหรับงานต่อ |
| [02 กลยุทธ์ Phase 1](docs/6-plan/02-phase-1-portal-strategy.md) | ขอบเขต portal เส้นทางผู้เรียน กติกาตรวจลิงก์ |
| [03 Gate และแผนงานคู่ขนาน](docs/6-plan/03-gates-and-workstreams.md) | Gate G0–G5 (ครอบ Gate ข้อมูล A–D) และสายงาน |

## ขอบเขตและวิธีอ่าน

- สถาบันในสหรัฐฯ 5 แห่งเลือกเพื่อดูรูปแบบหลักสูตรที่ต่างกัน ไม่ใช่การจัดอันดับ
- ชื่อสาขา ระดับปริญญา และสถานะรับสมัครอ้างเว็บไซต์ทางการ ณ วันที่ตรวจ อาจเปลี่ยนได้
- โจทย์จำลองเป็น **ข้อเสนอของโครงการ** ไม่ใช่รายวิชาที่สถาบันสอนจริง
- ข้อมูลสถานที่คือ "ชุดที่ตรวจได้" ไม่ใช่ทุกแห่ง — ไม่คัดลอกข้อมูลจาก Google Maps; ธุรกิจที่มีแค่เพจ Facebook บันทึกเป็นช่องว่างของแต่ละเขต
- Persona ทั้งหมดเป็นตัวละครสมมติ ต้องทดสอบกับผู้ใช้จริงก่อนสรุป

## ขั้นถัดไป

1. ทดสอบกับผู้ใช้จริงตามแผนใน [Persona และ Use case](docs/4-users/04-personas-and-use-cases.md)
2. สำรวจรอบสองใน 5 เขตที่ข้อมูลบาง (ลาดพร้าว บางซื่อ วังทองหลาง บางกะปิ พระโขนง)
3. ทดสอบบน iPhone/iPad จริงตาม [สเปก HIG](docs/5-product/07-apple-hig-design-spec.md) หัวข้อ 5
