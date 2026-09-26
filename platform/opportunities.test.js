const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createServer}=require('./server');
const {validateOpportunity}=require('./opportunities');

const DB=path.join(__dirname,'..','database','out','music-lab.db');
async function start(dataFile){const server=await createServer({dataFile,placesDb:DB});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}`}}
async function call(url,route,{method='GET',body,cookie}={}){const headers={};if(body!==undefined)headers['content-type']='application/json';if(cookie)headers.cookie=cookie;const res=await fetch(url+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json()}}
const login=async(url,persona)=>{const res=await fetch(url+'/api/demo/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({persona})});return res.headers.get('set-cookie').split(';')[0]};
const today=new Date().toISOString().slice(0,10);

test('L5: เวทีประกาศ → วงต้องมีโปรไฟล์+คลิปก่อนสมัคร → เวทีเห็นประวัติ → ตอบรับ → บันทึกว่ามาเล่น',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-opp-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const venue=await login(url,'venue'),shop=await login(url,'shop'),fah=await login(url,'musician'),boss=await login(url,'student');
  const gig={type:'gig',title:'คืนวันพุธ วงเปิดหน้าใหม่',genre:'อินดี้',district:'บางรัก',date:today,pay:'door',details:'เล่น 40 นาที มีกลองชุดและแอมป์ให้',minAge:18};
  assert.equal((await call(url,'/api/opportunities',{method:'POST',cookie:shop,body:gig})).status,400,'ร้านประกาศช่องเล่นเวทีไม่ได้');
  assert.equal((await call(url,'/api/opportunities',{method:'POST',cookie:fah,body:gig})).status,403);
  const o=await call(url,'/api/opportunities',{method:'POST',cookie:venue,body:gig});
  assert.equal(o.status,201);const id=o.body.opportunity.id;
  const apply=body=>call(url,`/api/opportunities/${id}/apply`,{method:'POST',cookie:fah,body});
  assert.equal((await apply({message:'วงอินดี้สามชิ้น เล่นเพลงตัวเอง'})).status,409,'ต้องมีโปรไฟล์วงก่อน');
  assert.equal((await call(url,'/api/me/band',{method:'POST',cookie:fah,body:{name:'ฟ้าหลังฝน',genre:'อินดี้',members:3,clipUrl:'',needs:'ไมค์ 2 ตัว'}})).status,400,'ต้องมีคลิปเล่นสด');
  assert.equal((await call(url,'/api/me/band',{method:'POST',cookie:fah,body:{name:'ฟ้าหลังฝน',genre:'อินดี้',members:3,clipUrl:'https://www.youtube.com/watch?v=live',needs:'ไมค์ 2 ตัว'}})).status,200);
  const a=await apply({message:'วงอินดี้สามชิ้น เล่นเพลงตัวเอง'});
  assert.equal(a.status,201);assert.equal(a.body.application.band.name,'ฟ้าหลังฝน');
  assert.equal((await apply({message:'สมัครซ้ำอีกครั้งนะครับ'})).status,409);
  assert.equal((await call(url,`/api/opportunities/${id}/apply`,{method:'POST',cookie:boss,body:{message:'อยากลองเล่นเวทีครับ'}})).status,403,'อายุ 16 สมัครงานที่รับ 18+ ไม่ได้');
  const list=(await call(url,'/api/opportunities?type=gig',{cookie:boss})).body.opportunities.find(x=>x.id===id);
  assert.equal(list.eligible,false);
  const mine=(await call(url,'/api/me/opportunities',{cookie:venue})).body.opportunities[0];
  assert.deepEqual(mine.applications[0].reliability,{performed:0,noShow:0});
  const appId=a.body.application.id;
  assert.equal((await call(url,`/api/applications/${appId}/respond`,{method:'POST',cookie:shop,body:{decision:'accepted'}})).status,403);
  assert.equal((await call(url,`/api/applications/${appId}/respond`,{method:'POST',cookie:venue,body:{decision:'performed'}})).status,409,'ต้องตอบรับก่อน');
  assert.equal((await call(url,`/api/applications/${appId}/respond`,{method:'POST',cookie:venue,body:{decision:'accepted'}})).status,200);
  assert.equal((await call(url,`/api/applications/${appId}/respond`,{method:'POST',cookie:venue,body:{decision:'performed'}})).status,200);
  const after=(await call(url,'/api/me/opportunities',{cookie:venue})).body.opportunities[0];
  assert.deepEqual(after.applications[0].reliability,{performed:1,noShow:0});
  assert.equal((await call(url,'/api/me/applications',{cookie:fah})).body.applications[0].status,'performed');
});

test('L6: ร้านประกาศฝึกงาน → นักศึกษาสมัครได้โดยไม่ต้องมีวง; ประกาศที่ปิดสมัครไม่ได้',async t=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'mil-opp-'));const {server,url}=await start(path.join(dir,'s.json'));t.after(()=>new Promise(r=>server.close(r)));
  const shop=await login(url,'shop'),june=await login(url,'career');
  const o=await call(url,'/api/opportunities',{method:'POST',cookie:shop,body:{type:'internship',title:'ฝึกงานร้านเครื่องดนตรีและงานซ่อม',district:'พญาไท',pay:'paid',details:'เรียนรู้การดูแลสต็อกและตั้งค่ากีตาร์ เสาร์–อาทิตย์'}});
  assert.equal(o.status,201);assert.equal(o.body.opportunity.minAge,15);
  const id=o.body.opportunity.id;
  assert.equal((await call(url,`/api/opportunities/${id}/apply`,{method:'POST',cookie:june,body:{message:'เรียนธุรกิจดนตรีปีสอง อยากเรียนงานร้าน'}})).status,201);
  assert.equal((await call(url,`/api/opportunities/${id}/close`,{method:'POST',cookie:shop})).status,200);
  assert.ok(!(await call(url,'/api/opportunities')).body.opportunities.some(x=>x.id===id));
});

test('ตรวจประกาศ: วันที่ย้อนหลัง/ไกลเกิน, งานบาร์ต้อง 18+',()=>{
  const base={type:'gig',title:'เล่นสดคืนศุกร์',district:'บางรัก',pay:'paid',details:'รายละเอียดครบถ้วนพอสมควร'};
  assert.ok(validateOpportunity({...base,date:'2020-01-01'},'venue').errors.some(e=>e.includes('วันที่')));
  assert.ok(validateOpportunity({...base,date:'2099-01-01'},'venue').errors.some(e=>e.includes('วันที่')));
  assert.ok(validateOpportunity({...base,title:'แจ๊สบาร์คืนศุกร์',date:today,minAge:16},'venue').errors.some(e=>e.includes('18')));
  assert.deepEqual(validateOpportunity({...base,date:today},'venue').errors,[]);
});
