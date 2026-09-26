const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('./server');
const {gearAdvice}=require('./ecosystem');

const DB=path.join(__dirname,'..','database','out','music-lab.db');
async function start(dataFile){const server=await createServer({dataFile,placesDb:DB});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`}}
async function call(url,route,{method='GET',body,cookie}={}){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;const res=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}}
const login=async(url,persona)=>(await call(url,'/api/demo/session',{method:'POST',body:{persona}})).cookie;
const stop=server=>new Promise(r=>server.close(r));

test('แผนที่: 50 เขต, สถานที่ไม่รวมรายการรอจัดประเภท, กรองตามเขต/ชั้นได้',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-eco-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>stop(server));
  const d=await call(url,'/api/districts');
  assert.equal(d.status,200);assert.equal(d.body.districts.length,50);
  assert.ok(d.body.districts.every(x=>x.rings.length&&x.wave>=1));
  const all=(await call(url,'/api/places')).body.places;
  assert.ok(all.length>0);assert.ok(all.every(x=>x.layer!=='review'));
  assert.ok(all.every(x=>x.freshness.date&&x.mapsUrl.startsWith('https://www.google.com/maps/search/')));
  const pw=(await call(url,'/api/places?district='+encodeURIComponent('ปทุมวัน')+'&layer=learn')).body.places;
  assert.ok(pw.length>0&&pw.every(x=>x.district==='ปทุมวัน'&&x.layer==='learn'));
  assert.equal((await call(url,'/api/places/osm:n0')).status,404);
  const one=await call(url,'/api/places/'+encodeURIComponent(all[0].id));
  assert.equal(one.status,200,'id ที่ encode แล้ว (%3A) ต้องเปิดได้');assert.equal(one.body.place.id,all[0].id);
});

test('Loop รายงาน → คิวผู้ดูแลเรียงตามความเสี่ยง → ปิดกิจการถูกซ่อน → ผู้รายงานเห็นสถานะ',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-eco-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>stop(server));
  const [place,other]=(await call(url,'/api/places')).body.places;
  const parent=await login(url,'parent'),senior=await login(url,'senior'),admin=await login(url,'admin');
  assert.equal((await call(url,`/api/places/${place.id}/reports`,{method:'POST',cookie:admin,body:{reason:'closed'}})).status,403);
  assert.equal((await call(url,`/api/places/${place.id}/reports`,{method:'POST',cookie:parent,body:{reason:'nope'}})).status,400);
  assert.equal((await call(url,`/api/places/${other.id}/reports`,{method:'POST',cookie:senior,body:{reason:'contact_wrong'}})).status,201);
  const r=await call(url,`/api/places/${place.id}/reports`,{method:'POST',cookie:parent,body:{reason:'closed',note:'ไปแล้วปิดถาวร'}});
  assert.equal(r.status,201);
  assert.equal((await call(url,`/api/places/${place.id}/reports`,{method:'POST',cookie:parent,body:{reason:'closed'}})).status,409);
  assert.equal((await call(url,'/api/admin/queue',{cookie:parent})).status,403);
  const q=(await call(url,'/api/admin/queue',{cookie:admin})).body.items;
  assert.equal(q[0].id,r.body.report.id,'รายงาน "ปิดแล้ว" ต้องอยู่หัวคิว');
  assert.equal((await call(url,`/api/admin/report/${r.body.report.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'rejected'}})).status,400);
  assert.equal((await call(url,`/api/admin/report/${r.body.report.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'accepted',note:'ยืนยันกับเพจแล้ว'}})).status,200);
  assert.ok(!(await call(url,'/api/places')).body.places.some(x=>x.id===place.id));
  assert.equal((await call(url,`/api/places/${place.id}`)).status,404);
  const mine=(await call(url,'/api/me/saved',{cookie:parent})).body.reports;
  assert.equal(mine[0].status,'accepted');
});

test('Loop เคลม → อนุมัติ → แก้ฟิลด์ปลอดภัยขึ้นทันที ฟิลด์เสี่ยงรอตรวจ',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-eco-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>stop(server));
  const place=(await call(url,'/api/places?kind=instrument_store,audio_store,school')).body.places[0];
  const shop=await login(url,'shop'),venue=await login(url,'venue'),learner=await login(url,'learner'),admin=await login(url,'admin');
  assert.equal((await call(url,`/api/places/${place.id}/claim`,{method:'POST',cookie:learner,body:{evidence:'เพจทางการของร้าน'}})).status,403);
  assert.equal((await call(url,`/api/places/${place.id}/edit`,{method:'POST',cookie:shop,body:{hours:'10:00-19:00'}})).status,403);
  const c=await call(url,`/api/places/${place.id}/claim`,{method:'POST',cookie:shop,body:{evidence:'เพจ Facebook ทางการ และเบอร์ร้านตรงกัน'}});
  assert.equal(c.status,201);
  assert.equal((await call(url,`/api/places/${place.id}/claim`,{method:'POST',cookie:venue,body:{evidence:'อีกคนขอเคลมเหมือนกัน'}})).status,409);
  assert.equal((await call(url,`/api/admin/claim/${c.body.claim.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'accepted'}})).status,200);
  const e=await call(url,`/api/places/${place.id}/edit`,{method:'POST',cookie:shop,body:{hours:'10:00-19:00 ทุกวัน',offer:['ซ่อมกีตาร์','เช่ากีตาร์'],name:'ชื่อใหม่ทดสอบ'}});
  assert.equal(e.status,200);assert.deepEqual(e.body.applied,['hours','offer']);assert.ok(e.body.pending);
  let now=(await call(url,`/api/places/${place.id}`)).body.place;
  assert.equal(now.hours,'10:00-19:00 ทุกวัน');assert.equal(now.name,place.name);assert.ok(now.ownerVerified);assert.equal(now.freshness.by,'เจ้าของสถานที่');
  assert.equal((await call(url,`/api/admin/edit/${e.body.pending.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'accepted'}})).status,200);
  now=(await call(url,`/api/places/${place.id}`)).body.place;
  assert.equal(now.name,'ชื่อใหม่ทดสอบ');
  const mine=(await call(url,'/api/me/places',{cookie:shop})).body.claims;
  assert.equal(mine.length,1);assert.equal(mine[0].status,'approved');
});

test('บันทึกสถานที่และแผนซ้อมคงอยู่หลังรีสตาร์ต; ตรวจค่าที่รับ',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-eco-'));const file=path.join(dir,'s.json');
  let {server,url}=await start(file);
  const place=(await call(url,'/api/places')).body.places[0];
  let me=await login(url,'musician');
  assert.equal((await call(url,'/api/me/saved',{method:'POST',cookie:me,body:{placeId:place.id}})).body.saved,true);
  assert.equal((await call(url,'/api/me/practice',{method:'POST',cookie:me,body:{minutes:20,feel:2}})).status,409);
  assert.equal((await call(url,'/api/me/plan',{method:'POST',cookie:me,body:{goal:'ร้อง',instrument:'ร้อง',minutesPerWeek:10}})).status,400);
  const plan=await call(url,'/api/me/plan',{method:'POST',cookie:me,body:{goal:'ร้องเพลงใหม่ของวงให้จบ',instrument:'ร้องเพลง',minutesPerWeek:120}});
  assert.equal(plan.status,201);assert.equal(plan.body.plan.weeks.length,8);
  assert.equal((await call(url,'/api/me/practice',{method:'POST',cookie:me,body:{minutes:500,feel:2}})).status,400);
  const log=await call(url,'/api/me/practice',{method:'POST',cookie:me,body:{minutes:60,feel:3,focus:'ท่อนฮุก'}});
  assert.equal(log.body.plan.thisWeek,60);
  const shop=await login(url,'shop');
  assert.equal((await call(url,'/api/me/plan',{cookie:shop})).status,403);
  await stop(server);
  ({server,url}=await start(file));t.after(()=>stop(server));
  me=await login(url,'musician');
  assert.deepEqual((await call(url,'/api/me/saved',{cookie:me})).body.places.map(x=>x.id),[place.id]);
  const again=(await call(url,'/api/me/plan',{cookie:me})).body.plan;
  assert.equal(again.totalMinutes,60);assert.equal(again.recent[0].focus,'ท่อนฮุก');
  assert.equal((await call(url,'/api/me/saved',{method:'POST',cookie:me,body:{placeId:place.id}})).body.saved,false);
});

test('Loop เสนอสถานที่ใหม่ → ผู้ดูแลยอมรับ → ปรากฏในรายการของเขต; กันซ้ำ/ลิงก์ Maps',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-eco-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>stop(server));
  const fah=await login(url,'musician'),admin=await login(url,'admin');
  const district='พญาไท',body={name:'ห้องซ้อมทดสอบ อารีย์',kind:'rehearsal',district,link:'https://www.facebook.com/example-rehearsal',note:'เปิดถึง 23:00'};
  assert.equal((await call(url,'/api/places/suggest',{method:'POST',cookie:admin,body})).status,403);
  assert.equal((await call(url,'/api/places/suggest',{method:'POST',cookie:fah,body:{...body,link:'https://maps.app.goo.gl/abc'}})).status,400);
  assert.equal((await call(url,'/api/places/suggest',{method:'POST',cookie:fah,body:{...body,kind:'excluded'}})).status,400);
  assert.equal((await call(url,'/api/places/suggest',{method:'POST',cookie:fah,body:{...body,link:'',address:''}})).status,400);
  const s=await call(url,'/api/places/suggest',{method:'POST',cookie:fah,body});
  assert.equal(s.status,201);
  assert.equal((await call(url,'/api/places/suggest',{method:'POST',cookie:fah,body:{...body,name:'ห้องซ้อมทดสอบ  อารีย์!'}})).status,409,'ชื่อเดียวกันในเขตเดียวกันต้องถูกกัน');
  const listed=()=>call(url,'/api/places?district='+encodeURIComponent(district)).then(r=>r.body.places.find(x=>x.name===body.name));
  assert.equal(await listed(),undefined,'ยังไม่แสดงก่อนตรวจ');
  const q=(await call(url,'/api/admin/queue',{cookie:admin})).body.items.find(i=>i.type==='suggestion');
  assert.ok(q);
  assert.equal((await call(url,`/api/admin/suggestion/${q.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'accepted'}})).status,200);
  const place=await listed();
  assert.ok(place);assert.equal(place.source,'community');assert.equal(place.layer,'create');
  assert.equal((await call(url,'/api/places/'+encodeURIComponent(place.id))).status,200);
  assert.equal((await call(url,'/api/me/saved',{cookie:fah})).body.suggestions[0].status,'accepted');
});

test('ตัวช่วยอุปกรณ์: ยังไม่มั่นใจ → ยืม/เช่า; มั่นใจและมีงบ → ซื้อใหม่',()=>{
  assert.deepEqual(gearAdvice({instrument:'กีตาร์',budget:0,confidence:1}).options.map(o=>o.id),['borrow']);
  assert.deepEqual(gearAdvice({instrument:'กีตาร์',budget:800,confidence:2}).options.map(o=>o.id),['borrow','rent']);
  assert.deepEqual(gearAdvice({instrument:'กีตาร์',budget:5000,confidence:3}).options.map(o=>o.id),['used','new']);
  assert.ok(gearAdvice({instrument:'ระนาด',budget:0,confidence:1}).note);
});
