const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('./server');

async function start(dataFile){const server=await createServer({dataFile});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:`http://127.0.0.1:${server.address().port}`}}
async function call(url,route,{method='GET',body,cookie}={}){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;const res=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}}

test('ครูลงบริการ → ผู้ดูแลอนุมัติ → ผู้เรียนส่งคำขอ → ครูตอบ และข้อมูลยังอยู่หลังรีสตาร์ต',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-platform-test-'));
  const dataFile=path.join(dir,'store.json');
  let {server,url}=await start(dataFile);
  t.after(async()=>{if(server.listening)await new Promise(resolve=>server.close(resolve));await fs.unlink(dataFile).catch(()=>{});await fs.rmdir(dir).catch(()=>{})});

  const publicBefore=await call(url,'/api/listings');
  assert.equal(publicBefore.status,200);
  assert.ok(publicBefore.body.listings.every(x=>x.status==='approved'));
  assert.ok(!publicBefore.body.listings.some(x=>x.id==='listing-2'));

  const teacher=(await call(url,'/api/demo/session',{method:'POST',body:{persona:'teacher'}})).cookie;
  const learner=(await call(url,'/api/demo/session',{method:'POST',body:{persona:'learner'}})).cookie;
  const admin=(await call(url,'/api/demo/session',{method:'POST',body:{persona:'admin'}})).cookie;
  assert.equal((await call(url,'/api/admin/listings',{cookie:teacher})).status,403);

  const input={title:'ลองแต่งเพลงแรกจากเรื่องใกล้ตัว',subject:'แต่งเพลง',level:'เริ่มต้น',mode:'ออนไลน์',area:'ออนไลน์ทั่วประเทศไทย',outcome:'เขียนท่อนร้องหนึ่งท่อนและอธิบายไอเดียของตนเอง',method:'ฟังตัวอย่าง แต่งทีละประโยค และรับ feedback หลังคาบ',equipment:'มือถือหรือสมุดจดและหูฟัง',slots:'อาทิตย์ 10:00–16:00 น.',terms:'นัดเวลาก่อนเรียนและแจ้งเลื่อนล่วงหน้า',duration:50,price:500,extra:0,maxStudents:1,loan:false};
  assert.equal((await call(url,'/api/listings',{method:'POST',cookie:learner,body:input})).status,403);
  const created=await call(url,'/api/listings',{method:'POST',cookie:teacher,body:input});
  assert.equal(created.status,201);
  const id=created.body.listing.id;
  assert.equal(created.body.listing.status,'draft');
  assert.ok(!(await call(url,'/api/listings')).body.listings.some(x=>x.id===id));

  assert.equal((await call(url,`/api/listings/${id}/submit`,{method:'POST',cookie:teacher,body:{}})).status,200);
  assert.ok((await call(url,'/api/admin/listings',{cookie:admin})).body.listings.some(x=>x.id===id));
  assert.ok(!(await call(url,'/api/listings')).body.listings.some(x=>x.id===id));
  assert.equal((await call(url,`/api/admin/listings/${id}/review`,{method:'POST',cookie:learner,body:{decision:'approved'}})).status,403);
  assert.equal((await call(url,`/api/admin/listings/${id}/review`,{method:'POST',cookie:admin,body:{decision:'approved'}})).status,200);
  assert.ok((await call(url,'/api/listings?subject=%E0%B9%81%E0%B8%95%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%9E%E0%B8%A5%E0%B8%87')).body.listings.some(x=>x.id===id));

  const request=await call(url,'/api/requests',{method:'POST',cookie:learner,body:{listingId:id,goal:'อยากแต่งท่อนร้องสั้นด้วยตัวเอง',schedule:'เสาร์บ่าย',budget:2500,hasInstrument:false}});
  assert.equal(request.status,201);
  assert.equal((await call(url,'/api/requests',{method:'POST',cookie:learner,body:{listingId:id,goal:'อยากแต่งท่อนร้องสั้นด้วยตัวเอง',schedule:'เสาร์บ่าย',budget:2500}})).status,409);
  const requestId=request.body.request.id;
  assert.ok((await call(url,'/api/my/requests',{cookie:teacher})).body.requests.some(x=>x.id===requestId));
  assert.equal((await call(url,`/api/requests/${requestId}/respond`,{method:'POST',cookie:learner,body:{decision:'accepted'}})).status,403);
  assert.equal((await call(url,`/api/requests/${requestId}/respond`,{method:'POST',cookie:teacher,body:{decision:'accepted'}})).status,200);
  assert.equal((await call(url,'/api/my/requests',{cookie:learner})).body.requests.find(x=>x.id===requestId).status,'accepted');

  await new Promise(resolve=>server.close(resolve));
  ({server,url}=await start(dataFile));
  assert.ok((await call(url,'/api/listings')).body.listings.some(x=>x.id===id));
  const learnerAgain=(await call(url,'/api/demo/session',{method:'POST',body:{persona:'learner'}})).cookie;
  assert.equal((await call(url,'/api/my/requests',{cookie:learnerAgain})).body.requests.find(x=>x.id===requestId).status,'accepted');
});

test('ตรวจข้อมูลที่ผิดก่อนเขียนและปฏิเสธ Origin ภายนอก',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-platform-test-'));
  const dataFile=path.join(dir,'store.json');
  const {server,url}=await start(dataFile);
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.unlink(dataFile).catch(()=>{});await fs.rmdir(dir).catch(()=>{})});
  const teacher=(await call(url,'/api/demo/session',{method:'POST',body:{persona:'teacher'}})).cookie;
  assert.equal((await call(url,'/api/listings',{method:'POST',cookie:teacher,body:{title:'สั้น',price:-1}})).status,400);
  const res=await fetch(url+'/api/demo/session',{method:'POST',headers:{'content-type':'application/json',origin:'https://example.org'},body:JSON.stringify({persona:'admin'})});
  assert.equal(res.status,403);
});
