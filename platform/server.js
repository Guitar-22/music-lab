'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {PERSONAS,validateListing,validateRequest,seedData}=require('./model');
const {createEcosystem,migrate}=require('./ecosystem');
const {createOpportunities,migrate:migrateOpp}=require('./opportunities');
const {createGuardian,checkRequest,migrate:migrateGuardian}=require('./guardian');
const {createEvents,migrate:migrateEvents}=require('./events');

const PUBLIC=path.join(__dirname,'public');
const DEFAULT_DATA=path.join(__dirname,'data','store.json');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8'};
const json=(res,code,value)=>{const body=JSON.stringify(value);res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store'});res.end(body)};
const fail=(code,message)=>Object.assign(new Error(message),{status:code});
const publicPersona=p=>({id:p.id,name:p.name,role:p.role,age:p.age,subtitle:p.subtitle,image:p.image,need:p.need,goal:p.goal,home:p.home||null,largeText:Boolean(p.largeText)});

async function createServer(options={}){
  const dataFile=options.dataFile||DEFAULT_DATA;
  await fs.mkdir(path.dirname(dataFile),{recursive:true});
  let data;
  try{data=JSON.parse(await fs.readFile(dataFile,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;data=seedData();await fs.writeFile(dataFile,JSON.stringify(data,null,2),'utf8')}
  if(!data||!Array.isArray(data.listings)||!Array.isArray(data.requests))throw new Error('Invalid data file');
  migrate(data);migrateOpp(data);migrateGuardian(data);migrateEvents(data);
  const eco=createEcosystem({dbFile:options.placesDb}),opps=createOpportunities(),guardian=createGuardian(),events=createEvents();
  const sessions=new Map();
  let queue=Promise.resolve();
  function transaction(action){
    const pending=queue.then(async()=>{const next=structuredClone(data);const result=action(next);const temp=`${dataFile}.${crypto.randomUUID()}.tmp`;await fs.writeFile(temp,JSON.stringify(next,null,2),'utf8');await fs.rename(temp,dataFile);data=next;return result});
    queue=pending.catch(()=>{});return pending;
  }
  const currentPersona=req=>{const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mil_session='))?.slice(12);return sessions.get(token)||null};
  const requireRole=(req,role)=>{const p=currentPersona(req);if(!p)throw fail(401,'กรุณาเลือก persona ก่อน');if(role&&p.role!==role)throw fail(403,'บทบาทนี้ไม่มีสิทธิทำรายการ');return p};
  async function body(req){if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'ต้องส่ง JSON');let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>10000)throw fail(413,'ข้อมูลยาวเกินกำหนด');chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw fail(400,'JSON ไม่ถูกต้อง')}}
  async function serve(req,res,pathname){const name=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));const filename=path.resolve(PUBLIC,name);if(!filename.startsWith(PUBLIC+path.sep))throw fail(403,'ห้ามเข้าถึงไฟล์นี้');const ext=path.extname(filename);if(!MIME[ext])throw fail(404,'ไม่พบไฟล์');let file;try{file=await fs.readFile(filename)}catch(error){if(error.code==='ENOENT')throw fail(404,'ไม่พบไฟล์');throw error}res.writeHead(200,{'Content-Type':MIME[ext],'Content-Length':file.length,'X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'||ext==='.js'?'no-cache':'public, max-age=3600'});res.end(file)}
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'");
    try{
      const host=req.headers.host||'127.0.0.1';const url=new URL(req.url,`http://${host}`);const p=url.pathname,m=req.method;
      if(!['GET','POST'].includes(m))throw fail(405,'วิธีเรียกไม่รองรับ');
      if(m==='POST'&&req.headers.origin&&req.headers.origin!==`http://${host}`)throw fail(403,'Origin ไม่ตรง');
      if(p==='/api/personas'&&m==='GET')return json(res,200,Object.values(PERSONAS).map(publicPersona));
      if(p==='/api/session'&&m==='GET')return json(res,200,{persona:currentPersona(req)});
      if(p==='/api/demo/session'&&m==='POST'){
        const input=await body(req),persona=PERSONAS[input.persona];if(!persona)throw fail(400,'persona ไม่ถูกต้อง');
        const token=crypto.randomBytes(32).toString('hex');sessions.set(token,persona);res.setHeader('Set-Cookie',`mil_session=${token}; HttpOnly; SameSite=Strict; Path=/`);return json(res,200,{persona:publicPersona(persona)});
      }
      if(p==='/api/logout'&&m==='POST'){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('mil_session='));if(cookie)sessions.delete(cookie.slice(12));res.setHeader('Set-Cookie','mil_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true})}
      if(p==='/api/listings'&&m==='GET'){
        const subject=url.searchParams.get('subject')||'',mode=url.searchParams.get('mode')||'',loan=url.searchParams.get('loan')==='true';
        const rows=data.listings.filter(x=>x.status==='approved'&&(!subject||x.subject===subject)&&(!mode||x.mode===mode||x.mode==='ผสม')&&(!loan||x.loan));
        return json(res,200,{listings:rows.map(x=>({...x,teacherImage:PERSONAS[x.teacherId]?.image||''}))});
      }
      if(p==='/api/my/listings'&&m==='GET'){const actor=requireRole(req,'teacher');return json(res,200,{listings:data.listings.filter(x=>x.teacherId===actor.id)})}
      if(p==='/api/listings'&&m==='POST'){
        const actor=requireRole(req,'teacher'),raw=await body(req),checked=validateListing(raw);if(checked.errors.length)throw fail(400,checked.errors.join('; '));
        const listing=await transaction(db=>{const now=new Date().toISOString();const x={id:`listing-${db.nextId++}`,teacherId:actor.id,teacherName:actor.name,...checked.value,status:'draft',reviewNote:'',reviewedAt:null,createdAt:now,updatedAt:now};db.listings.push(x);return x});return json(res,201,{listing});
      }
      let match=p.match(/^\/api\/listings\/(listing-\d+)\/update$/);
      if(match&&m==='POST'){
        const actor=requireRole(req,'teacher'),raw=await body(req),checked=validateListing(raw);if(checked.errors.length)throw fail(400,checked.errors.join('; '));
        const listing=await transaction(db=>{const x=db.listings.find(y=>y.id===match[1]);if(!x)throw fail(404,'ไม่พบรายการ');if(x.teacherId!==actor.id)throw fail(403,'แก้ได้เฉพาะรายการของตัวเอง');if(!['draft','rejected'].includes(x.status))throw fail(409,'แก้ได้เฉพาะร่างหรือรายการที่ถูกส่งกลับ');Object.assign(x,checked.value);x.status='draft';x.reviewNote='';x.reviewedAt=null;x.updatedAt=new Date().toISOString();return x});return json(res,200,{listing});
      }
      match=p.match(/^\/api\/listings\/(listing-\d+)\/submit$/);
      if(match&&m==='POST'){
        const actor=requireRole(req,'teacher');const listing=await transaction(db=>{const x=db.listings.find(y=>y.id===match[1]);if(!x)throw fail(404,'ไม่พบรายการ');if(x.teacherId!==actor.id)throw fail(403,'แก้ได้เฉพาะรายการของตัวเอง');if(!['draft','rejected'].includes(x.status))throw fail(409,'สถานะนี้ส่งตรวจไม่ได้');x.status='pending';x.reviewNote='';x.updatedAt=new Date().toISOString();return x});return json(res,200,{listing});
      }
      if(p==='/api/admin/listings'&&m==='GET'){requireRole(req,'admin');return json(res,200,{listings:data.listings.filter(x=>x.status==='pending'||x.status==='rejected')})}
      match=p.match(/^\/api\/admin\/listings\/(listing-\d+)\/review$/);
      if(match&&m==='POST'){
        requireRole(req,'admin');const input=await body(req);if(!['approved','rejected'].includes(input.decision))throw fail(400,'ผลตรวจไม่ถูกต้อง');if(input.decision==='rejected'&&(!input.note||String(input.note).trim().length<5))throw fail(400,'กรุณาบอกเหตุผลที่ต้องแก้ไข');
        const listing=await transaction(db=>{const x=db.listings.find(y=>y.id===match[1]);if(!x)throw fail(404,'ไม่พบรายการ');if(x.status!=='pending')throw fail(409,'ตรวจได้เฉพาะรายการรอตรวจ');x.status=input.decision;x.reviewNote=String(input.note||'ตรวจข้อมูลครบแล้ว').trim().slice(0,300);x.reviewedAt=new Date().toISOString();x.updatedAt=x.reviewedAt;return x});return json(res,200,{listing});
      }
      if(p==='/api/requests'&&m==='POST'){
        const actor=requireRole(req);if(!['learner','parent'].includes(actor.role))throw fail(403,'บทบาทนี้ไม่มีสิทธิทำรายการ');const input=await body(req),checked=validateRequest(input);if(checked.errors.length)throw fail(400,checked.errors.join('; '));
        const request=await transaction(db=>{const listing=db.listings.find(x=>x.id===input.listingId&&x.status==='approved');if(!listing)throw fail(404,'บริการนี้ยังไม่เปิดรับ');const extra=checkRequest(db,actor,listing,input,fail);if(db.requests.some(x=>x.listingId===listing.id&&x.learnerId===actor.id&&(x.forChild?.id||null)===(extra.forChild?.id||null)&&['pending','accepted'].includes(x.status)))throw fail(409,'คุณมีคำขอที่ยังเปิดอยู่สำหรับบริการนี้');const now=new Date().toISOString();const x={id:`request-${crypto.randomUUID()}`,listingId:listing.id,listingTitle:listing.title,teacherId:listing.teacherId,learnerId:actor.id,learnerName:actor.name,...checked.value,...extra,status:'pending',createdAt:now,updatedAt:now};db.requests.push(x);return x});return json(res,201,{request});
      }
      if(p==='/api/my/requests'&&m==='GET'){const actor=requireRole(req);if(actor.role==='admin')throw fail(403,'ไม่มีคำขอส่วนตัว');return json(res,200,{requests:data.requests.filter(x=>actor.role==='teacher'?x.teacherId===actor.id:x.learnerId===actor.id)})}
      match=p.match(/^\/api\/requests\/(request-[0-9a-f-]+)\/respond$/);
      if(match&&m==='POST'){
        const actor=requireRole(req,'teacher'),input=await body(req);if(!['accepted','declined'].includes(input.decision))throw fail(400,'ผลการตอบไม่ถูกต้อง');
        const request=await transaction(db=>{const x=db.requests.find(y=>y.id===match[1]);if(!x)throw fail(404,'ไม่พบคำขอ');if(x.teacherId!==actor.id)throw fail(403,'ตอบได้เฉพาะคำขอของตัวเอง');if(x.status!=='pending')throw fail(409,'คำขอนี้ถูกตอบแล้ว');x.status=input.decision;x.updatedAt=new Date().toISOString();return x});return json(res,200,{request});
      }
      if(p.startsWith('/api/')){let decodedPath;try{decodedPath=decodeURIComponent(p)}catch{throw fail(400,'เส้นทางไม่ถูกต้อง')}const ctx={decodedPath,m,url,req,res,json,fail,body,requireRole,currentPersona,transaction,getData:()=>data};if(await opps.handle(ctx)||await guardian.handle(ctx)||await events.handle(ctx))return}
      if(p.startsWith('/api/')&&await eco.handle({p,m,url,req,res,json,fail,body,requireRole,currentPersona,transaction,getData:()=>data}))return;
      if(p.startsWith('/api/'))throw fail(404,'ไม่พบ API');
      if(m==='GET')return await serve(req,res,p);
      throw fail(404,'ไม่พบเส้นทาง');
    }catch(error){json(res,error.status||500,{error:error.status?error.message:'เกิดข้อผิดพลาดในเซิร์ฟเวอร์'})}
  });
  return server;
}
if(require.main===module){createServer().then(server=>{const port=Number(process.env.PORT)||4173;server.listen(port,'127.0.0.1',()=>console.log(`Music Industry Lap: http://127.0.0.1:${port}`))}).catch(error=>{console.error(error);process.exitCode=1})}
module.exports={createServer};
