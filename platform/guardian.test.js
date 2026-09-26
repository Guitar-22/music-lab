const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('./server');

async function start(dataFile){const server=await createServer({dataFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`}}
async function call(url,route,{method='GET',body,cookie}={}){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;const res=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()}}
const login=async(url,persona)=>{const res=await fetch(url+'/api/demo/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({persona})});return res.headers.get('set-cookie').split(';')[0]};
const brief={goal:'อยากลองกีตาร์เพลงที่ชอบหนึ่งเพลง',schedule:'เสาร์เช้า',budget:2000,hasInstrument:false};

test('L9: ผู้ปกครองเพิ่มลูก → ขอเรียนแทนได้เฉพาะบริการที่รับเด็กและอายุถึง → ครูเห็นว่าติดต่อผ่านผู้ปกครอง',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-guard-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const parent=await login(url,'parent'),teacher=await login(url,'teacher'),learner=await login(url,'learner');
  assert.equal((await call(url,'/api/me/children',{method:'POST',cookie:learner,body:{nickname:'x',age:8}})).status,403);
  assert.equal((await call(url,'/api/me/children',{method:'POST',cookie:parent,body:{nickname:'น้องมะปราง',age:25}})).status,400);
  const kids=(await call(url,'/api/me/children',{method:'POST',cookie:parent,body:{nickname:'น้องมะปราง',age:8}})).body.children;
  const young=(await call(url,'/api/me/children',{method:'POST',cookie:parent,body:{nickname:'น้องต้นกล้า',age:5}})).body.children.at(-1);
  const kid=kids[0];
  const listings=(await call(url,'/api/listings')).body.listings;
  const forKids=listings.find(x=>x.acceptsMinors),adultsOnly=listings.find(x=>!x.acceptsMinors);
  assert.ok(forKids&&adultsOnly,'seed ต้องมีทั้งบริการรับเด็กและผู้ใหญ่');
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:parent,body:{...brief,listingId:forKids.id}})).status,400,'ต้องเลือกลูก');
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:parent,body:{...brief,listingId:adultsOnly.id,childId:kid.id}})).status,403);
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:parent,body:{...brief,listingId:forKids.id,childId:young.id}})).status,403,'อายุ 5 ต่ำกว่าเกณฑ์ 8');
  const r=await call(url,'/api/requests',{method:'POST',cookie:parent,body:{...brief,listingId:forKids.id,childId:kid.id}});
  assert.equal(r.status,201);assert.deepEqual(r.body.request.forChild,{id:kid.id,nickname:'น้องมะปราง',age:8});assert.equal(r.body.request.guardian,true);
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:parent,body:{...brief,listingId:forKids.id,childId:kid.id}})).status,409);
  assert.equal((await call(url,`/api/me/children/${kid.id}/remove`,{method:'POST',cookie:parent,body:{}})).status,409,'ลบลูกที่มีคำขอเปิดอยู่ไม่ได้');
  const inbox=(await call(url,'/api/my/requests',{cookie:teacher})).body.requests;
  assert.equal(inbox[0].forChild.nickname,'น้องมะปราง');
  // ครูเปิดบริการใหม่แบบรับเด็กต้องระบุอายุขั้นต่ำที่ถูกต้อง
  const listing={title:'เปียโนสำหรับเด็กเริ่มต้น',subject:'เปียโน',level:'เริ่มต้น',mode:'พบตัว',area:'บางแค กรุงเทพฯ',outcome:'เล่นทำนองสั้นสองมือได้',method:'เล่นเกมจังหวะและฟังก่อนอ่านโน้ต',equipment:'คีย์บอร์ดที่บ้านหรือที่ห้องเรียน',slots:'เสาร์ 9:00–12:00 น.',terms:'ผู้ปกครองอยู่ด้วยทุกคาบ',duration:45,price:450,extra:0,maxStudents:1,loan:true,acceptsMinors:true,minAge:1};
  assert.equal((await call(url,'/api/listings',{method:'POST',cookie:teacher,body:listing})).status,400);
  assert.equal((await call(url,'/api/listings',{method:'POST',cookie:teacher,body:{...listing,minAge:6}})).status,201);
});

test('L9: ผู้เรียนอายุต่ำกว่า 18 ขอได้เฉพาะบริการที่รับผู้เยาว์ และครูเห็นป้ายผู้เยาว์',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-guard-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const boss=await login(url,'student'),teacher=await login(url,'teacher');
  const listings=(await call(url,'/api/listings')).body.listings;
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:boss,body:{...brief,listingId:listings.find(x=>!x.acceptsMinors).id}})).status,403);
  const r=await call(url,'/api/requests',{method:'POST',cookie:boss,body:{...brief,listingId:listings.find(x=>x.acceptsMinors).id}});
  assert.equal(r.status,201);assert.equal(r.body.request.minor,true);assert.equal(r.body.request.minorAge,16);
  assert.equal((await call(url,'/api/my/requests',{cookie:teacher})).body.requests[0].minor,true);
});
