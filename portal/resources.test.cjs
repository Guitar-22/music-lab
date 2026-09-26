const test=require('node:test');
const assert=require('node:assert/strict');
const {resources,selectResources}=require('./resources.js');

test('ทุกแหล่งมีลิงก์ HTTPS และข้อมูลเงื่อนไขพร้อมวันตรวจ',()=>{
  assert.ok(resources.length>=35);
  assert.equal(new Set(resources.map(r=>r.id)).size,resources.length);
  for(const r of resources){
    assert.match(r.url,/^https:\/\//);
    assert.match(r.source,/^https:\/\//);
    for(const k of ['name','owner','goal','costText','account','device','language','checked','note','sourceType'])assert.ok(r[k]);
    for(const k of ['what','best','limit','next'])assert.ok(r.guide[k],`${r.id}: ${k}`);
    assert.ok(r.guide.steps.length>=2,`${r.id}: steps`);
    for(const alternate of r.alternates||[])assert.match(alternate.url,/^https:\/\//);
  }
});

test('ตัวกรองฟรี ไม่มีเครื่อง และภาษาไทยไม่แสดงรายการผิดเงื่อนไข',()=>{
  const rows=selectResources({freeOnly:true,noInstrument:true,thaiOnly:true});
  assert.ok(rows.length>0);
  assert.ok(rows.every(r=>['free','freemium'].includes(r.cost)&&r.noInstrument&&r.thai));
  assert.ok(!rows.some(r=>r.id==='musora'));
});

test('การค้นหาและหมวดช่วยลดรายการตรงโจทย์',()=>{
  assert.deepEqual(selectResources({query:'BandLab'}).map(r=>r.id),['bandlab']);
  assert.ok(selectResources({category:'teacher'}).every(r=>r.category==='teacher'));
});

test('หมวดสำคัญมีรายการและลิงก์แอปชี้ไปยังร้านทางการ',()=>{
  for(const category of ['metronome','tuner','practice','songwriting','notation','recording','performance'])assert.ok(selectResources({category}).length>0,category);
  for(const r of resources.filter(r=>r.url.includes('apps.apple.com')))assert.equal(r.sourceType,'Apple App Store — ข้อมูลจากผู้พัฒนา');
});
