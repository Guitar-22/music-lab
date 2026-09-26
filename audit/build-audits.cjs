const fs=require('node:fs');
const path=require('node:path');
const {resources}=require('../portal/resources.js');
require('../portal/editorial.js');
const {previews}=globalThis.MILPro;
const {universities,schools}=require('../portal/institutions.js');
const {zones}=require('../portal/zones.js');
const outDir=__dirname;
const csvValue=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const {parseCsv}=require('../database/build.cjs');
// ผลตรวจที่กรอกด้วยมือ (คอลัมน์ *_status, *_date, notes) ถูกเก็บไว้เมื่อสร้างไฟล์ใหม่; ค่าเริ่มต้นใช้เฉพาะแถวใหม่หรือช่องที่ยังเป็นค่าตั้งต้น
const kept=/(_status|_date|^notes)$/;
const untouched=/^(|not_checked|not_scanned|not_started|missing|needs_.*)$/;
const write=(name,columns,rows,keyCol=0)=>{
  const file=path.join(outDir,name);
  const old=fs.existsSync(file)?new Map(parseCsv(fs.readFileSync(file,'utf8')).map(r=>[r[columns[keyCol]],r])):new Map();
  const merged=rows.map(row=>{
    const prev=old.get(String(row[keyCol]));
    return prev?row.map((v,i)=>kept.test(columns[i])&&prev[columns[i]]!==undefined&&!untouched.test(prev[columns[i]])?prev[columns[i]]:v):row;
  });
  fs.writeFileSync(file,[columns,...merged].map(row=>row.map(csvValue).join(',')).join('\r\n')+'\r\n','utf8');
  const added=rows.filter(r=>!old.has(String(r[keyCol]))).length;
  if(added)console.log(`${name}: เพิ่มแถวใหม่ ${added}`);
};
const maps=query=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);

write('resource-audit.csv',
  ['id','name','category','official_url','evidence_url','official_visual_url','visual_status','icon_status','browser_open_status','source_review_date'],
  resources.map(item=>[item.id,item.name,item.category,item.url,item.source,previews[item.id]?.url||'',previews[item.id]?'candidate_official_source':'missing','not_checked','not_checked','2026-09-25']));

write('university-audit.csv',
  ['name','faculty','province','region','levels','majors','curriculum_source','additional_source','source_status','current_admission_status','review_date'],
  universities.map(item=>[item.name,item.faculty,item.province,item.region,item.levels,item.majors.join(' | '),item.url,item.extra||'','official_source_found','needs_latest_year_confirmation','2026-09-25']));

write('school-group-audit.csv',
  ['name','type','area','genres','named_bangkok_points','official_or_owner_source','map_pin_status','course_status','review_date'],
  schools.map(item=>[item.name,item.type,item.area,item.genres.join(' | '),item.branches?.length||0,item.url,'needs_pin_by_pin_check','needs_branch_course_check','2026-09-25']));

const mapCategories=[['general','โรงเรียนดนตรี'],['thai','เรียนดนตรีไทย'],['classical','เรียนดนตรีคลาสสิก'],['pop','เรียนร้องเพลงป๊อป'],['rock','เรียนดนตรีร็อก'],['jazz','เรียนดนตรีแจ๊ส']];
write('bangkok-district-audit.csv',
  ['zone','district',...mapCategories.map(([id])=>'maps_'+id),'map_scan_status','official_crosscheck_status','duplicate_check_status','last_review_date','notes'],
  zones.flatMap(zone=>zone.districts.map(district=>[zone.name,district,...mapCategories.map(([,query])=>maps(query+' เขต'+district+' กรุงเทพมหานคร')),district==='ปทุมวัน'?'partial_general':'not_scanned',district==='ปทุมวัน'?'partial_two_owner_sources':'not_started',district==='ปทุมวัน'?'pending':'not_started',district==='ปทุมวัน'?'2026-09-25':'',district==='ปทุมวัน'?'ค้นทั่วไปครั้งแรก พบ 6 candidate ไม่รวม sponsored นอกเขต; อีก 5 ประเภทคำค้นยังไม่ตรวจ':''])),1);

console.log(`wrote ${resources.length} resources, ${universities.length} higher-education institutions, ${schools.length} school/course groups and ${zones.flatMap(z=>z.districts).length} districts`);
