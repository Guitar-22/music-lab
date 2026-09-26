const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('./server');

const DB=path.join(__dirname,'..','database','out','music-lab.db');
async function start(dataFile){const server=await createServer({dataFile,placesDb:DB});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`}}
async function call(url,route,{method='GET',body,cookie}={}){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;const res=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()}}
const login=async(url,persona)=>{const res=await fetch(url+'/api/demo/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({persona})});return res.headers.get('set-cookie').split(';')[0]};
const today=new Date().toISOString().slice(0,10);

test('L10: เจ้าของที่ยืนยันแล้วสร้างกิจกรรมผูกสถานที่ → ผู้ที่บันทึกสถานที่เห็นในฟีด → กดสนใจ → ยกเลิกแล้วหายจากปฏิทิน',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-ev-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const venue=await login(url,'venue'),admin=await login(url,'admin'),fah=await login(url,'musician'),senior=await login(url,'senior'),boss=await login(url,'student');
  const place=(await call(url,'/api/places?kind=venue')).body.places.find(p=>p.district==='บางรัก')||(await call(url,'/api/places?kind=venue')).body.places[0];
  const ev={kind:'open_jam',title:'Open jam คืนวันพฤหัส',date:today,time:'20:00',free:true,minAge:18,details:'นำเครื่องมาเองได้ มีกลองชุดและแอมป์',placeId:place.id};
  assert.equal((await call(url,'/api/events',{method:'POST',cookie:fah,body:ev})).status,403);
  assert.equal((await call(url,'/api/events',{method:'POST',cookie:venue,body:ev})).status,403,'ยังไม่ได้เป็นเจ้าของที่ยืนยัน');
  const c=await call(url,`/api/places/${encodeURIComponent(place.id)}/claim`,{method:'POST',cookie:venue,body:{evidence:'เพจทางการของเวที เบอร์ตรงกัน'}});
  await call(url,`/api/admin/claim/${c.body.claim.id}/resolve`,{method:'POST',cookie:admin,body:{decision:'accepted'}});
  assert.equal((await call(url,'/api/events',{method:'POST',cookie:venue,body:{...ev,date:'2020-01-01'}})).status,400);
  const e=await call(url,'/api/events',{method:'POST',cookie:venue,body:ev});
  assert.equal(e.status,201);assert.equal(e.body.event.district,place.district);assert.equal(e.body.event.placeName,place.name);
  // ฟ้าบันทึกสถานที่ → เห็นในฟีดพร้อมเหตุผล
  await call(url,'/api/me/saved',{method:'POST',cookie:fah,body:{placeId:place.id}});
  const feed=(await call(url,'/api/me/feed',{cookie:fah})).body.feed;
  assert.equal(feed[0].id,e.body.event.id);assert.equal(feed[0].why,'สถานที่ที่คุณบันทึก');
  // ลุงชาญไม่ได้บันทึก และเขตบ้านต่าง → ไม่เห็นในฟีด แต่เห็นในปฏิทิน
  assert.ok(!(await call(url,'/api/me/feed',{cookie:senior})).body.feed.some(x=>x.id===e.body.event.id)||place.district==='พระนคร');
  assert.ok((await call(url,'/api/events?district='+encodeURIComponent(place.district))).body.events.some(x=>x.id===e.body.event.id));
  assert.equal((await call(url,`/api/events/${e.body.event.id}/interest`,{method:'POST',cookie:boss,body:{}})).status,403,'อายุ 16 กับกิจกรรม 18+');
  const i=await call(url,`/api/events/${e.body.event.id}/interest`,{method:'POST',cookie:fah,body:{}});
  assert.deepEqual(i.body,{interested:true,count:1});
  assert.equal((await call(url,'/api/me/events',{cookie:venue})).body.events[0].interested,1);
  assert.equal((await call(url,`/api/events/${e.body.event.id}/cancel`,{method:'POST',cookie:fah,body:{}})).status,403);
  assert.equal((await call(url,`/api/events/${e.body.event.id}/cancel`,{method:'POST',cookie:venue,body:{}})).status,200);
  assert.ok(!(await call(url,'/api/events')).body.events.some(x=>x.id===e.body.event.id));
});

test('L10: กิจกรรมไม่ผูกสถานที่ต้องระบุเขต และแสดงในฟีดของคนในเขตบ้าน',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-ev-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const teacher=await login(url,'teacher'),senior=await login(url,'senior');
  const base={kind:'workshop',title:'เวิร์กช็อประนาดสำหรับผู้ใหญ่',date:today,free:false,details:'ลองตีระนาดเอกเพลงสั้นหนึ่งเพลง มีเครื่องให้'};
  assert.equal((await call(url,'/api/events',{method:'POST',cookie:teacher,body:base})).status,400);
  const e=await call(url,'/api/events',{method:'POST',cookie:teacher,body:{...base,district:'พระนคร'}});
  assert.equal(e.status,201);
  const feed=(await call(url,'/api/me/feed',{cookie:senior})).body.feed;
  assert.equal(feed[0].why,'ในเขตพระนคร');
});
