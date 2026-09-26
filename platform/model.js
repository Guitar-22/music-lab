const PERSONAS = Object.freeze({
  learner: { id:'learner', name:'มีน', role:'learner', age:22, subtitle:'ผู้เริ่มต้นที่อยากลองทำเพลง', image:'/assets/persona-learner.png', need:'อยากรู้ว่าจะเรียนอะไร โดยยังไม่มีเครื่องดนตรี', goal:'ลองบทบาท → พบครูที่เข้ากับงบและอุปกรณ์' },
  teacher: { id:'teacher', name:'ครูต้น', role:'teacher', age:36, subtitle:'ครูกีตาร์อิสระ', image:'/assets/persona-teacher.png', need:'อยากได้ผู้เรียนที่เป้าหมายตรงและลดการตอบแชตซ้ำ', goal:'ลงบริการ → ตอบคำขอ → วางแผนคาบแรก' },
  admin: { id:'admin', name:'แพร', role:'admin', age:31, subtitle:'ผู้ดูแลชุมชนดนตรี', image:'/assets/persona-admin.png', need:'ต้องตรวจความครบถ้วนและความสดของรายการก่อนเผยแพร่', goal:'ตรวจรายการ → ขอแก้ไขหรืออนุมัติ' },
  // persona เพิ่มจาก docs/4-users/04-personas-and-use-cases.md (สมมติทั้งหมด ไม่มีภาพ ใช้อักษรย่อแทน)
  parent: { id:'parent', name:'แม่ปุ๊ก', role:'parent', age:41, subtitle:'ผู้ปกครอง ลูก 8 ขวบ · บางแค', image:'', home:'บางแค', need:'หาที่เรียนใกล้บ้าน ปลอดภัย ลองก่อนได้', goal:'แผนที่ → เปรียบเทียบ → ติดต่อคาบทดลอง' },
  student: { id:'student', name:'บอส', role:'learner', age:16, subtitle:'ม.5 เตรียมสอบคณะดนตรี · ลาดกระบัง', image:'', home:'ลาดกระบัง', need:'รู้ว่าต้องเตรียมอะไรและเหลือเวลาเท่าไร', goal:'แผนซ้อม 8 สัปดาห์ → ติวเฉพาะจุด' },
  senior: { id:'senior', name:'ลุงชาญ', role:'learner', age:58, subtitle:'เกษียณ อยากเรียนระนาด · พระนคร', image:'', home:'พระนคร', largeText:true, need:'เรียนกับกลุ่มใกล้บ้าน ไม่แพง ตัวหนังสือใหญ่', goal:'แผนที่ดนตรีไทย → ส่งต่อ LINE → ติดตามกิจกรรม' },
  musician: { id:'musician', name:'ฟ้า', role:'learner', age:27, subtitle:'นักร้องวง indie · ทำงานสีลม', image:'', home:'บางรัก', need:'ห้องซ้อมหลังเลิกงานและเวทีเล็ก', goal:'หาห้องซ้อม → บันทึก → ยื่นเล่นเวที' },
  career: { id:'career', name:'จูน', role:'learner', age:19, subtitle:'นักศึกษาธุรกิจดนตรี', image:'', home:'พระนคร', need:'เห็นว่าใครทำอะไรในวงการและฝึกงานที่ไหน', goal:'แผนที่ ecosystem → บันทึกองค์กรเป้าหมาย' },
  shop: { id:'shop', name:'เจ๊หน่อย', role:'shop', age:49, subtitle:'เจ้าของร้านเครื่องดนตรีและรับซ่อม · สะพานควาย', image:'', home:'พญาไท', need:'ให้คนแถวนี้รู้ว่าร้านซ่อมและเช่าเครื่องได้', goal:'เคลมร้าน → แก้ข้อมูล → รับลูกค้า' },
  venue: { id:'venue', name:'พี่โอ๊ต', role:'venue', age:33, subtitle:'booker เวทีดนตรีสด · บางรัก', image:'', home:'บางรัก', need:'หาวงที่พร้อมเล่นจริงและตรงแนว', goal:'เคลมเวที → อัปเดตข้อมูลเวที' }
});
// กลุ่มสิทธิ์: ผู้ใช้ทั่วไป (บันทึก/รายงาน), ผู้ให้บริการ (เคลมสถานที่), ผู้ดูแล
const ROLE_GROUPS = Object.freeze({ member:['learner','parent','teacher','shop','venue'], provider:['teacher','shop','venue'], learnerLike:['learner'] });
const SUBJECTS = ['ร้องเพลง','กีตาร์','เปียโน','ดนตรีไทย','ทำเพลง','แต่งเพลง','งานเวที'];
const LEVELS = ['เริ่มต้น','ระดับกลาง','ทุกระดับ'];
const MODES = ['ออนไลน์','พบตัว','ผสม'];
const text = (value,max=300) => typeof value==='string' ? value.trim().slice(0,max) : '';
function validateListing(raw){
  const x={title:text(raw.title,100),subject:text(raw.subject,40),level:text(raw.level,30),mode:text(raw.mode,30),area:text(raw.area,80),outcome:text(raw.outcome,240),method:text(raw.method,350),equipment:text(raw.equipment,180),slots:text(raw.slots,120),terms:text(raw.terms,350),duration:Number(raw.duration),price:Number(raw.price),extra:Number(raw.extra||0),maxStudents:Number(raw.maxStudents||1),loan:raw.loan===true,acceptsMinors:raw.acceptsMinors===true,minAge:raw.acceptsMinors===true?Number(raw.minAge):18};
  const errors=[];
  for(const k of ['title','area','outcome','method','equipment','slots','terms']) if(x[k].length<8)errors.push(`${k} ต้องมีอย่างน้อย 8 ตัวอักษร`);
  if(!SUBJECTS.includes(x.subject))errors.push('เลือกวิชาที่รองรับ');
  if(x.acceptsMinors&&(!Number.isInteger(x.minAge)||x.minAge<3||x.minAge>17))errors.push('อายุขั้นต่ำของผู้เยาว์ต้องอยู่ระหว่าง 3–17 ปี');
  if(!LEVELS.includes(x.level))errors.push('เลือกระดับที่รองรับ');
  if(!MODES.includes(x.mode))errors.push('เลือกรูปแบบที่รองรับ');
  for(const [k,min,max] of [['duration',15,180],['price',0,10000],['extra',0,10000],['maxStudents',1,12]]) if(!Number.isInteger(x[k])||x[k]<min||x[k]>max)errors.push(`${k} ต้องอยู่ระหว่าง ${min}–${max}`);
  return {value:x,errors};
}
function validateRequest(raw){
  const value={goal:text(raw.goal,300),schedule:text(raw.schedule,120),budget:Number(raw.budget),hasInstrument:raw.hasInstrument===true};
  const errors=[];
  if(value.goal.length<10)errors.push('กรุณาบอกเป้าหมายอย่างน้อย 10 ตัวอักษร');
  if(value.schedule.length<3)errors.push('กรุณาบอกเวลาที่สะดวก');
  if(!Number.isInteger(value.budget)||value.budget<0||value.budget>100000)errors.push('งบต้องเป็นจำนวนเต็ม 0–100000 บาท');
  return {value,errors};
}
function seedData(){
  const now=new Date().toISOString();
  const base={teacherId:'teacher',teacherName:'ครูต้น',subject:'กีตาร์',level:'เริ่มต้น',mode:'ผสม',area:'กรุงเทพฯ / ออนไลน์',method:'ฟังเป้าหมายของผู้เรียนก่อน ฝึกจังหวะทีละช่วงและให้ feedback หลังคาบ',equipment:'มีกีตาร์ให้ลองในคาบพบตัว',slots:'เสาร์ 10:00–16:00 น.',terms:'นัดเวลาอีกครั้งก่อนยืนยัน ไม่มีการชำระเงินผ่านเดโม',duration:50,extra:0,maxStudents:1,loan:true,createdAt:now,updatedAt:now};
  return {version:1,nextId:4,listings:[
    {...base,id:'listing-1',acceptsMinors:true,minAge:8,title:'ลองกีตาร์ครั้งแรกแบบไม่ต้องมีเครื่อง',outcome:'เล่นจังหวะพื้นฐานหนึ่งท่อนและรู้ว่าจะฝึกอะไรต่อ',price:450,status:'approved',reviewNote:'รายการตัวอย่างที่ระบบเตรียมไว้',reviewedAt:now},
    {...base,id:'listing-2',title:'ฝึกจังหวะกีตาร์กับเพลงที่ชอบ',outcome:'เล่นจังหวะหนึ่งเพลงพร้อมแผนซ้อมรายสัปดาห์',price:600,status:'pending',reviewNote:'',reviewedAt:null},
    {...base,id:'listing-3',title:'ทำเดโมเพลงสั้นด้วยมือถือ',subject:'ทำเพลง',mode:'ออนไลน์',area:'ออนไลน์',outcome:'บันทึกเสียง 30 วินาทีและเลือกสิ่งที่จะปรับในเวอร์ชันต่อไป',method:'สอนการอัดเสียงง่าย ๆ จัดไฟล์และฟังกลับทีละเวอร์ชัน',equipment:'มือถือและหูฟัง',loan:false,price:420,status:'approved',reviewNote:'รายการตัวอย่างที่ระบบเตรียมไว้',reviewedAt:now}
  ],requests:[]};
}
module.exports={PERSONAS,ROLE_GROUPS,SUBJECTS,LEVELS,MODES,validateListing,validateRequest,seedData};
