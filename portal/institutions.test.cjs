const test=require('node:test');
const assert=require('node:assert/strict');
const {universities,schools}=require('./institutions.js');
const {zones}=require('./zones.js');

test('มหาวิทยาลัยมีสาขา พื้นที่ และลิงก์ต้นทาง',()=>{
  assert.ok(universities.length>=25);
  assert.equal(new Set(universities.map(item=>item.name)).size,universities.length);
  for(const item of universities){
    assert.ok(item.majors.length>0,item.name);
    assert.match(item.url,/^https:\/\//);
    assert.ok(['bangkok','central','east','north','northeast','south'].includes(item.region));
    if(item.extra)assert.match(item.extra,/^https:\/\//);
  }
});

test('โรงเรียนครอบคลุมดนตรีไทย คลาสสิก แจ๊ส ป๊อป และร็อก พร้อมสาขากรุงเทพฯ แยกจังหวัด',()=>{
  assert.ok(schools.length>=9);
  const genres=new Set(schools.flatMap(item=>item.genres));
  for(const genre of ['ดนตรีไทย','คลาสสิก','แจ๊ส','ป๊อป','ร็อก'])assert.ok(genres.has(genre),genre);
  for(const item of schools){assert.match(item.url,/^https:\/\//);assert.ok(item.note);}
  assert.equal(schools.find(item=>item.name==='PlaySound').branches.length,12);
  assert.equal(schools.find(item=>item.name==='MelodyPlus').branches.length,4);
  assert.equal(schools.find(item=>item.name.startsWith('Bangkok Learning City')).branches.length,18);
});

test('แผนตรวจรายโซนครบ 50 เขตโดยไม่มีเขตซ้ำ',()=>{
  assert.equal(zones.length,6);
  const districts=zones.flatMap(zone=>zone.districts);
  assert.equal(districts.length,50);
  assert.equal(new Set(districts).size,50);
});
