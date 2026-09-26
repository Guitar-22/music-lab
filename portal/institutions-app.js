(function () {
  'use strict';
  const { universities, schools } = window.MILInstitutions;
  const $ = id => document.getElementById(id);
  const make = (tag, className, content) => { const node = document.createElement(tag); if(className) node.className=className; if(content!==undefined) node.textContent=content; return node; };
  const link = (label, href, cls) => { const a=make('a',cls,label); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; return a; };
  const mapLink = query => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
  const tags = (items) => { const wrap=make('div','directory-tags'); items.forEach(t=>wrap.appendChild(make('span','',t))); return wrap; };
  const universityResult = $('university-results');
  function renderUniversities() {
    const term=$('university-query').value.trim().toLocaleLowerCase('th'); const region=$('region').value;
    const rows=universities.filter(item=>(region==='all'||item.region===region)&&[item.name,item.faculty,item.province,...item.majors].join(' ').toLocaleLowerCase('th').includes(term));
    $('university-count').textContent=`${rows.length} จาก ${universities.length} สถาบันที่ตรวจแล้ว`;
    universityResult.replaceChildren();
    if(!rows.length) universityResult.appendChild(make('p','no-results','ไม่พบสาขาที่ตรงเงื่อนไข ลองใช้คำค้นที่กว้างขึ้น'));
    for(const item of rows) {
      const card=make('article','directory-card');
      card.append(make('p','card-kicker',`${item.province} · ${item.levels}`),make('h3','',item.name),make('p','faculty',item.faculty));
      const heading=make('b','card-label','สาขา / วิชาเอกที่พบ'); card.append(heading,tags(item.majors));
      card.appendChild(make('p','card-note',item.note));
      const actions=make('div','card-actions'); actions.append(link('อ่านหลักสูตรต้นทาง ↗',item.url,'visit'));
      if(item.extra) actions.append(link('เอกสารเพิ่มเติม ↗',item.extra,'source'));
      card.appendChild(actions); universityResult.appendChild(card);
    }
  }
  $('university-query').addEventListener('input',renderUniversities); $('region').addEventListener('change',renderUniversities); renderUniversities();
  const schoolResult=$('school-results'); let genre='ทั้งหมด';
  const zones=window.MILZones.zones;
  const zoneSelect=$('map-zone'); const districtSelect=$('map-district');
  for(const zone of zones){const option=make('option','',`${zone.name} · ${zone.districts.length} เขต`);option.value=zone.id;zoneSelect.appendChild(option);}
  function updateDistricts(){const zone=zones.find(item=>item.id===zoneSelect.value);districtSelect.replaceChildren();const all=make('option','','ทุกเขตในโซน');all.value='all';districtSelect.appendChild(all);for(const district of zone?.districts||[]){const option=make('option','',district);option.value=district;districtSelect.appendChild(option);}districtSelect.disabled=!zone;updateMap();}
  zoneSelect.addEventListener('change',updateDistricts);districtSelect.addEventListener('change',updateMap);
  const genres=[['ทั้งหมด','โรงเรียนดนตรี กรุงเทพ'],['ดนตรีไทย','โรงเรียนสอนดนตรีไทย กรุงเทพ'],['คลาสสิก','โรงเรียนสอนดนตรีคลาสสิก กรุงเทพ'],['แจ๊ส','โรงเรียนสอนดนตรีแจ๊ส กรุงเทพ'],['ป๊อป','โรงเรียนสอนร้องเพลงป๊อป กรุงเทพ'],['ร็อก','โรงเรียนสอนวงดนตรีร็อก กรุงเทพ'],['รวมวง','โรงเรียนสอนเล่นวงดนตรี กรุงเทพ'],['เด็กเล็ก','โรงเรียนสอนดนตรีเด็กเล็ก กรุงเทพ']];
  function updateMap() {
    const base=genres.find(item=>item[0]===genre)[1];
    const zone=zones.find(item=>item.id===zoneSelect.value);
    const query=districtSelect.value!=='all'?base.replace('กรุงเทพ','เขต'+districtSelect.value+' กรุงเทพมหานคร'):zone?base.replace('กรุงเทพ',zone.name+' กรุงเทพมหานคร'):base;
    $('map-frame').src='https://www.google.com/maps?q='+encodeURIComponent(query)+'&output=embed';
    $('map-open').href=mapLink(query); $('map-label').textContent=`ผลค้นหา: ${query}`;
    const buttons=$('genre-buttons'); buttons.replaceChildren();
    for(const [name] of genres) {const button=make('button',name===genre?'active':'',name); button.type='button'; button.setAttribute('aria-pressed',String(name===genre)); button.addEventListener('click',()=>{genre=name;updateMap();renderSchools();}); buttons.appendChild(button);}
  }
  function renderSchools(){
    const term=$('school-query').value.trim().toLocaleLowerCase('th');
    const rows=schools.filter(item=>(genre==='ทั้งหมด'||item.genres.includes(genre))&&[item.name,item.area,item.type,item.note,...item.genres,...(item.branches||[])].join(' ').toLocaleLowerCase('th').includes(term));
    $('school-count').textContent=`${rows.length} จาก ${schools.length} กลุ่มที่ตรวจแล้ว`;
    schoolResult.replaceChildren();
    if(!rows.length) schoolResult.appendChild(make('p','no-results','ยังไม่มีรายการตรวจยืนยันในหมวดนี้ ลองดูผลค้นหาแบบสดบนแผนที่'));
    for(const item of rows) {
      const card=make('article','directory-card'); card.append(make('p','card-kicker',item.type),make('h3','',item.name),make('p','faculty',item.area),tags(item.genres),make('p','card-note',item.note));
      if(item.branches){ const details=make('details','branch-list'); const summary=make('summary','',`ดู ${item.branches.length} จุดเรียนในกรุงเทพฯ`); const list=make('ul'); for(const branch of item.branches){const row=make('li'); row.appendChild(link(branch+' ↗',mapLink((item.type==='คอร์สสาธารณะ'?'':item.name+' ')+branch+' กรุงเทพมหานคร'))); list.appendChild(row);} details.append(summary,list); card.appendChild(details); }
      const actions=make('div','card-actions'); actions.append(link('ดูแหล่งต้นทาง ↗',item.url,'visit'),link('ค้นในแผนที่ ↗',mapLink(item.name+' '+item.area+' กรุงเทพ'),'source'));
      if(item.locator) actions.append(link('ตัวค้นหาสาขาทางการ ↗',item.locator,'source'));
      card.appendChild(actions); schoolResult.appendChild(card);
    }
  }
  $('school-query').addEventListener('input',renderSchools); updateMap(); renderSchools();
})();
