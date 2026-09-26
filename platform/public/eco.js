// หน้าจอ Ecosystem: แผนที่ดนตรี การ์ดสถานที่ ที่บันทึก แผนซ้อม อุปกรณ์ สถานที่ของฉัน คิวผู้ดูแล ความคืบหน้ารายเขต
// ใช้บริบทจาก app.js ผ่าน window.MILApp; สเปก: 27-app-loops-journey-ux-spec.md
(function(){
  'use strict';
  const app=()=>window.MILApp;
  const E=v=>app().E(v);
  const LAYERS={learn:['เรียน','#2f7d4f'],gear:['อุปกรณ์','#b3541e'],create:['สร้างงาน','#6a4bb0'],perform:['แสดง','#c2185b'],listen:['ฟัง/สื่อ','#1f6fa8'],business:['ธุรกิจ','#7a6a00']};
  const eco={meta:null,places:[],filters:{layer:'',kind:'',district:'',q:''},selected:null,detail:null,panel:null,gear:null};
  const store={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
  const isMember=p=>p&&p.role!=='admin';
  const isProvider=p=>p&&['teacher','shop','venue'].includes(p.role);

  async function meta(){if(!eco.meta)eco.meta=await app().api('/api/districts');return eco.meta}
  const kindLabel=k=>eco.meta?.kinds[k]?.label||k;
  const layerChip=l=>`<span class="layer-chip l-${E(l)}">${E((LAYERS[l]||[l])[0])}</span>`;

  // ---------- แผนที่ SVG ----------
  function projector(districts){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const d of districts)for(const r of d.rings)for(const [x,y] of r){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
    const k=Math.cos(((minY+maxY)/2)*Math.PI/180),W=1000,scale=W/((maxX-minX)*k),H=(maxY-minY)*scale;
    return {W,H,pt:([x,y])=>[((x-minX)*k*scale).toFixed(1),((maxY-y)*scale).toFixed(1)],bbox:rings=>{let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const r of rings)for(const p of r){const [x,y]=p;a=Math.min(a,x);c=Math.max(c,x);b=Math.min(b,y);d=Math.max(d,y)}return [(a-minX)*k*scale,(maxY-d)*scale,(c-a)*k*scale,(d-b)*scale]}};
  }
  function mapSvg(districts,places,{colorBy='count'}={}){
    const P=projector(districts);
    const max=Math.max(1,...districts.map(d=>d.count));
    const fill=d=>colorBy==='status'?({researched:'#9ccc86',osm_only:'#e7dc9a',not_started:'#ece9e1'})[d.status]:d.count?`rgba(47,125,79,${(0.12+0.6*d.count/max).toFixed(2)})`:'#f2f0ea';
    let vb=`0 0 ${P.W} ${P.H.toFixed(0)}`;
    const sel=districts.find(d=>d.name===eco.filters.district);
    if(sel&&colorBy!=='status'){const [x,y,w,h]=P.bbox(sel.rings),pad=Math.max(w,h)*.15;vb=`${(x-pad).toFixed(0)} ${(y-pad).toFixed(0)} ${(w+pad*2).toFixed(0)} ${(h+pad*2).toFixed(0)}`}
    const r=sel?Math.max(2,Math.min(8,P.W/140*(Number(vb.split(' ')[2])/P.W)*1.4)):5;
    return `<svg class="eco-map" viewBox="${vb}" role="img" aria-label="แผนที่เขตกรุงเทพฯ และสถานที่ดนตรี">${districts.map(d=>`<path d="${d.rings.map(ring=>'M'+ring.map(P.pt).join('L')+'Z').join('')}" fill="${fill(d)}" class="district${d.name===eco.filters.district?' on':''}" data-district="${E(d.name)}"><title>เขต${E(d.name)} · ${d.count} แห่ง · wave ${d.wave}</title></path>`).join('')}
      ${places.filter(p=>p.lat!=null).map(p=>{const [x,y]=P.pt([p.lon,p.lat]);return `<circle cx="${x}" cy="${y}" r="${r}" fill="${(LAYERS[p.layer]||['','#555'])[1]}" class="pin${eco.selected===p.id?' on':''}" data-place="${E(p.id)}"><title>${E(p.name)}</title></circle>`}).join('')}</svg>`;
  }

  // ---------- การ์ดสถานที่ ----------
  function placeRow(p){return `<button type="button" class="place-row${eco.selected===p.id?' on':''}" data-place="${E(p.id)}">${layerChip(p.layer)}<b>${E(p.name)}</b><small>${E(kindLabel(p.kind))} · ${E(p.district)}${p.ownerVerified?' · ✓ เจ้าของยืนยัน':''}</small></button>`}
  function detailCard(d){
    if(!d)return `<div class="panel muted small">เลือกจุดบนแผนที่หรือรายการเพื่อดูรายละเอียด</div>`;
    const p=d.place,me=app().state.persona;
    const line=`https://line.me/R/share?text=${encodeURIComponent(`${p.name}\n${p.address||'เขต'+p.district}\n${p.mapsUrl}`)}`;
    const field=(label,v)=>`<div><dt>${label}</dt><dd>${v?v:'<span class="muted">ยังไม่มีข้อมูล</span>'}</dd></div>`;
    const link=u=>`<a href="${E(u)}" target="_blank" rel="noopener noreferrer">${E(u.replace(/^https?:\/\/(www\.)?/,'').slice(0,40))}</a>`;
    const reasons=eco.meta.reasons;
    return `<article class="panel place-card" aria-live="polite">
      <div class="place-head">${layerChip(p.layer)}<span class="tag">${E(kindLabel(p.kind))}</span>${p.ownerVerified?'<span class="tag verified">✓ เจ้าของยืนยัน</span>':''}</div>
      <h3>${E(p.name)}</h3>${p.name_en&&p.name_en!==p.name?`<p class="muted small">${E(p.name_en)}</p>`:''}
      <dl class="facts">${field('เขต',E(p.district))}${field('ที่อยู่',E(p.address))}${field('เวลา',E(p.hours))}${field('โทร',p.phone?`<a href="tel:${E(p.phone.replace(/[^\d+]/g,''))}">${E(p.phone)}</a>`:'')}${field('เว็บ',p.website?link(p.website):'')}${field('โซเชียล',(p.social||[]).map(link).join('<br>'))}${field('บริการ/สินค้า',(p.offer||[]).map(o=>`<span class="chip">${E(o)}</span>`).join(' '))}</dl>
      <p class="fresh">ตรวจเมื่อ ${E(p.freshness.date||'—')} · ${E(p.freshness.by)} · <a href="${E(p.source_url)}" target="_blank" rel="noopener noreferrer">แหล่งข้อมูล</a>${p.license?` (${E(p.license)} © OpenStreetMap)`:''}</p>
      <div class="actions"><a class="button outline" href="${E(p.mapsUrl)}" target="_blank" rel="noopener noreferrer">ตรวจบน Google Maps</a><a class="button outline" href="${E(line)}" target="_blank" rel="noopener noreferrer">ส่งให้ LINE</a>
      ${isMember(me)?`<button type="button" class="button ${d.mySaved?'':'secondary'}" data-eco="save" data-id="${E(p.id)}">${d.mySaved?'★ บันทึกแล้ว':'☆ บันทึก'}</button>`:''}</div>
      ${isMember(me)?`<details class="sub"><summary>ข้อมูลไม่ถูกต้อง? รายงาน</summary>${d.myReports.length?`<p class="small">คุณรายงานไว้ ${d.myReports.length} ครั้ง ล่าสุด: <b>${E(d.myReports.at(-1).status)}</b></p>`:''}
        <form id="eco-report" data-id="${E(p.id)}" class="stack">${Object.entries(reasons).map(([k,v],i)=>`<label class="check"><input type="radio" name="reason" value="${k}" ${i?'':'required'}> ${E(v)}</label>`).join('')}<label class="field"><span>รายละเอียด (ถ้ามี)</span><input name="note" maxlength="300"></label><button class="button" type="submit">ส่งรายงาน</button></form></details>`:''}
      ${isProvider(me)?(d.claim?`<p class="small muted">สถานะเคลม: ${d.claim.status==='approved'?'มีเจ้าของยืนยันแล้ว':'รอผู้ดูแลตรวจ'}${d.claim.mine?' (ของคุณ)':''}</p>`:`<details class="sub"><summary>เป็นเจ้าของที่นี่? เคลมหน้า</summary><form id="eco-claim" data-id="${E(p.id)}" class="stack"><label class="field"><span>หลักฐานความเป็นเจ้าของ</span><input name="evidence" required minlength="10" maxlength="300" placeholder="เช่น ลิงก์เพจทางการ เบอร์ร้านที่ตรงกับเพจ"></label><button class="button" type="submit">ส่งคำขอเคลม</button></form></details>`):''}
    </article>`;
  }

  // ---------- หน้าจอ ----------
  const views={};
  views.map=async()=>{
    const m=await meta();const f=eco.filters,q=new URLSearchParams();for(const k of ['layer','kind','district','q'])if(f[k])q.set(k,f[k]);
    eco.places=(await app().api('/api/places?'+q)).places;
    if(eco.selected&&!eco.detail)eco.detail=await app().api('/api/places/'+encodeURIComponent(eco.selected)).catch(()=>null);
    const shownDistricts=m.districts.map(d=>({...d,count:eco.places.filter(p=>p.district===d.name).length}));
    const byDistrict=[...new Set(eco.places.map(p=>p.district))];
    const kinds=Object.entries(m.kinds).filter(([k,v])=>!['excluded','unclassified'].includes(k)&&(!f.layer||v.layer===f.layer));
    return `<div class="eco-head"><div><span class="eyebrow">L2 · หาที่ · UC-03</span><h1>แผนที่ดนตรีกรุงเทพฯ</h1><p class="lead">${eco.places.length} แห่ง จากข้อมูลที่ผ่าน Gate · เขตที่ค้นเว็บแล้ว ${m.districts.filter(d=>d.status==='researched').length}/50 · ที่เหลือมีเฉพาะข้อมูล OpenStreetMap</p></div></div>
      <form id="eco-filters" class="filter-row eco-filters"><label class="field"><span>ค้นหา</span><input name="q" value="${E(f.q)}" placeholder="ชื่อ ที่อยู่ บริการ"></label>
      <label class="field"><span>ชั้น</span><select name="layer"><option value="">ทั้งหมด</option>${Object.entries(LAYERS).map(([k,[l]])=>`<option value="${k}" ${f.layer===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="field"><span>ประเภท</span><select name="kind"><option value="">ทั้งหมด</option>${kinds.map(([k,v])=>`<option value="${k}" ${f.kind===k?'selected':''}>${E(v.label)}</option>`).join('')}</select></label>
      <label class="field"><span>เขต</span><select name="district"><option value="">ทั้งกรุงเทพฯ</option>${m.districts.map(d=>`<option ${f.district===d.name?'selected':''}>${E(d.name)}</option>`).join('')}</select></label>
      <button class="button" type="submit">กรอง</button>${f.q||f.layer||f.kind||f.district?'<button type="button" class="button outline" data-eco="clear">ล้าง</button>':''}</form>
      <div class="legend">${Object.entries(LAYERS).map(([k])=>layerChip(k)).join('')}</div>
      <div class="map-layout"><div class="map-box">${mapSvg(shownDistricts,eco.places)}<p class="small muted">ขอบเขตเขตและข้อมูลบางส่วน © ผู้ร่วมพัฒนา OpenStreetMap (ODbL) · คลิกเขตเพื่อซูม</p></div>
      <div class="map-side">${detailCard(eco.detail)}</div></div>
      ${isMember(app().state.persona)?`<details class="panel sub suggest"><summary>ไม่เจอที่ที่รู้จัก? เสนอสถานที่ใหม่</summary><p class="small muted">ใส่ลิงก์เพจ/เว็บของสถานที่ (ไม่ใช้ลิงก์ Google Maps) หรือที่อยู่ ผู้ดูแลจะตรวจก่อนแสดง</p>
        <form id="eco-suggest" class="form-grid"><label class="field"><span>ชื่อสถานที่</span><input name="name" required minlength="2" maxlength="120"></label>
        <label class="field"><span>ประเภท</span><select name="kind" required>${kinds.map(([k,v])=>`<option value="${k}">${E(v.label)}</option>`).join('')}</select></label>
        <label class="field"><span>เขต</span><select name="district" required>${m.districts.map(d=>`<option ${(f.district||app().state.persona.home)===d.name?'selected':''}>${E(d.name)}</option>`).join('')}</select></label>
        <label class="field"><span>ลิงก์เพจ/เว็บ (https://)</span><input name="link" type="url" pattern="https://.*" maxlength="300"></label>
        <label class="field"><span>ที่อยู่</span><input name="address" maxlength="200"></label>
        <label class="field"><span>หมายเหตุ เช่น เวลาเปิด</span><input name="note" maxlength="300"></label><button class="button" type="submit">ส่งให้ผู้ดูแลตรวจ</button></form></details>`:''}
      <h2 class="section-title small-title">รายการตามเขต</h2>${eco.places.length?byDistrict.map(d=>`<section class="district-group"><h3>เขต${E(d)}</h3><div class="place-list">${eco.places.filter(p=>p.district===d).map(placeRow).join('')}</div></section>`).join(''):'<div class="empty">ไม่พบสถานที่ตามตัวกรอง</div>'}`;
  };
  // ระยะโดยประมาณจากจุดกึ่งกลางเขตบ้าน (ใช้ค่าเฉลี่ยจุดขอบเขต) ถึงสถานที่
  function fromHome(p){
    const home=app().state.persona.home;const d=eco.meta?.districts.find(x=>x.name===home);
    if(!d||p.lat==null)return null;
    const pts=d.rings.flat();const c={lon:pts.reduce((n,q)=>n+q[0],0)/pts.length,lat:pts.reduce((n,q)=>n+q[1],0)/pts.length};
    const R=6371,r=Math.PI/180,h=Math.sin((p.lat-c.lat)*r/2)**2+Math.cos(c.lat*r)*Math.cos(p.lat*r)*Math.sin((p.lon-c.lon)*r/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }
  function compareTable(list){
    const ask='<span class="muted">ยังไม่มีข้อมูล — ถามเจ้าของ</span>';
    const rows=[['ประเภท',p=>E(kindLabel(p.kind))],['เขต',p=>E(p.district)],[`ห่างจากเขต${E(app().state.persona.home||'บ้าน')} (โดยประมาณ)`,p=>{const km=fromHome(p);return km==null?ask:`${km.toFixed(1)} กม.`}],
      ['เวลาเปิด',p=>p.hours?E(p.hours):ask],['โทร',p=>p.phone?E(p.phone):ask],['บริการ/สินค้า',p=>(p.offer||[]).length?p.offer.map(E).join(', '):ask],
      ['ราคา · คาบทดลอง · อายุที่รับ',()=>ask],['เจ้าของยืนยัน',p=>p.ownerVerified?'✓':'—'],['ข้อมูลตรวจเมื่อ',p=>E(p.freshness.date||'—')+' · '+E(p.freshness.by)]];
    return `<div class="compare"><table class="table"><thead><tr><th></th>${list.map(p=>`<th>${E(p.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([l,f])=>`<tr><th>${l}</th>${list.map(p=>`<td>${f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  views.saved=async()=>{
    const d=await app().api('/api/me/saved');await meta();
    const live=d.places.filter(p=>!p.hidden);
    if(!eco.compare)eco.compare=live.slice(0,3).map(p=>p.id);
    const picked=live.filter(p=>eco.compare.includes(p.id)).slice(0,3);
    return `<span class="eyebrow">L2 · L8 · L10</span><h1>ที่บันทึกและรายงานของฉัน</h1>
      ${live.length>=2?`<div class="panel"><h3>เปรียบเทียบ (UC-04) · เลือก 2–3 แห่ง</h3><div class="pill-row">${live.map(p=>`<label class="check"><input type="checkbox" data-eco-compare="${E(p.id)}" ${eco.compare.includes(p.id)?'checked':''}> ${E(p.name)}</label>`).join('')}</div>${picked.length>=2?compareTable(picked):'<p class="muted small">เลือกอย่างน้อย 2 แห่ง</p>'}</div>`:''}
      <div class="panel"><h3>สถานที่ที่บันทึก (${d.places.length})</h3>${d.places.length?`<div class="place-list">${d.places.map(p=>p.hidden?`<div class="place-row muted"><b>${E(p.name)}</b><small>ถูกซ่อนหลังตรวจพบว่าปิดแล้ว/ไม่เกี่ยวข้อง</small></div>`:placeRow(p)).join('')}</div>`:'<p class="muted">ยังไม่มี — กด ☆ บันทึก ในการ์ดสถานที่บนแผนที่</p><button type="button" class="button" data-route="map">เปิดแผนที่</button>'}</div>
      ${d.suggestions?.length?`<div class="panel"><h3>สถานที่ที่ฉันเสนอ</h3><ul class="info-list">${d.suggestions.map(x=>`<li>${E(x.name)} · เขต${E(x.district)} · <span class="status ${x.status==='pending'?'pending':E(x.status)}">${({pending:'รอตรวจ',accepted:'แสดงแล้ว',rejected:'ไม่ผ่าน'})[x.status]}</span>${x.reviewNote?` · ${E(x.reviewNote)}`:''}</li>`).join('')}</ul></div>`:''}
      <div class="panel"><h3>รายงานข้อมูลที่ฉันส่ง</h3>${d.reports.length?`<table class="table"><thead><tr><th>สถานที่</th><th>เหตุผล</th><th>สถานะ</th><th>ผลตรวจ</th></tr></thead><tbody>${d.reports.map(r=>`<tr><td>${E(r.placeName)}</td><td>${E(eco.meta?.reasons[r.reason]||r.reason)}</td><td><span class="status ${E(r.status)}">${({open:'รอตรวจ',accepted:'แก้ไขแล้ว',rejected:'ไม่แก้'})[r.status]}</span></td><td>${E(r.resolution)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">ยังไม่มีรายงาน</p>'}</div>`;
  };
  views.practice=async()=>{
    const {plan}=await app().api('/api/me/plan');
    if(!plan)return `<span class="eyebrow">L3 · ฝึก · UC-06</span><h1>แผนซ้อม 8 สัปดาห์</h1><div class="panel"><form id="eco-plan" class="form-grid"><label class="field"><span>เป้าหมาย</span><input name="goal" required minlength="5" maxlength="120" placeholder="เช่น เล่นเพลงโปรดทั้งเพลง"></label><label class="field"><span>เครื่องดนตรี/ทักษะ</span><input name="instrument" required minlength="2" maxlength="40" placeholder="กีตาร์ ร้องเพลง ระนาด"></label><label class="field"><span>นาทีต่อสัปดาห์</span><input name="minutesPerWeek" type="number" min="30" max="1200" value="120" required></label><button class="button" type="submit">สร้างแผน</button></form></div>`;
    const max=Math.max(plan.minutesPerWeek,...plan.byWeek);
    return `<span class="eyebrow">L3 · ฝึก · UC-06–07</span><h1>${E(plan.goal)}</h1><p class="lead">${E(plan.instrument)} · สัปดาห์ที่ ${plan.week}/8 · เป้าหมาย ${plan.minutesPerWeek} นาที/สัปดาห์</p>
      <div class="card-grid"><div class="panel"><h3>สัปดาห์นี้</h3><p class="big">${plan.thisWeek} <small>/ ${plan.minutesPerWeek} นาที</small></p><progress class="bar" max="${plan.minutesPerWeek}" value="${Math.min(plan.thisWeek,plan.minutesPerWeek)}">${plan.thisWeek}</progress><p class="small muted">ครบเป้าต่อเนื่อง ${plan.streakWeeks} สัปดาห์ · รวม ${plan.totalMinutes} นาที · สัปดาห์ที่พลาดไม่ถูกลงโทษ แค่เริ่มใหม่</p></div>
      <div class="panel"><h3>บันทึกการซ้อม</h3><form id="eco-practice" class="stack"><label class="field"><span>นาที</span><input name="minutes" type="number" min="5" max="240" value="20" required></label><label class="field"><span>ฝึกอะไร</span><input name="focus" maxlength="120" value="${E(plan.weeks[plan.week-1]?.focus||'')}"></label><fieldset class="feel"><legend>รู้สึกอย่างไร</legend>${[['1','ยาก'],['2','พอได้'],['3','ดี']].map(([v,l])=>`<label class="check"><input type="radio" name="feel" value="${v}" ${v==='2'?'checked':''}> ${l}</label>`).join('')}</fieldset><button class="button" type="submit">บันทึก</button></form></div></div>
      <div class="panel"><h3>ความคืบหน้ารายสัปดาห์</h3><div class="weeks">${plan.weeks.map((w,i)=>`<div class="week${i===plan.week-1?' now':''}"><svg class="col" viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="${(100-plan.byWeek[i]/max*100).toFixed(0)}" width="20" height="${(plan.byWeek[i]/max*100).toFixed(0)}"></rect></svg><b>ส.${w.week}</b><small>${E(w.focus)}</small><small>${plan.byWeek[i]} นาที</small></div>`).join('')}</div></div>
      ${plan.recent.length?`<div class="panel"><h3>ล่าสุด</h3><ul class="info-list">${plan.recent.map(l=>`<li>${new Date(l.date).toLocaleDateString('th-TH')} · ${l.minutes} นาที · ${E(l.focus||'-')} · ${['','ยาก','พอได้','ดี'][l.feel]}</li>`).join('')}</ul></div>`:''}`;
  };
  views.gear=async()=>{
    await meta();const g=eco.gear;
    return `<span class="eyebrow">L4 · อุปกรณ์ · UC-09–10</span><h1>ยังไม่มีเครื่อง หรือเครื่องต้องซ่อม?</h1><p class="lead">ตอบ 3 ข้อ แล้วดูทางเลือกที่ไม่บังคับซื้อ พร้อมร้าน/ที่เรียนที่ยืมหรือซ่อมได้</p>
      <div class="panel"><form id="eco-gear" class="form-grid"><label class="field"><span>เครื่องดนตรี</span><input name="instrument" required value="${E(g?.advice.instrument||'')}" placeholder="กีตาร์ คีย์บอร์ด ระนาด"></label><label class="field"><span>งบ (บาท)</span><input name="budget" type="number" min="0" max="200000" value="${E(g?.budget??0)}"></label><label class="field"><span>มั่นใจว่าจะเล่นต่อแค่ไหน</span><select name="confidence"><option value="1">ยังแค่อยากลอง</option><option value="2">ชอบแล้ว แต่ยังไม่แน่ใจ</option><option value="3">มั่นใจ จะเล่นต่อ</option></select></label><button class="button" type="submit">ดูทางเลือก</button></form></div>
      ${g?`<div class="card-grid">${g.advice.options.map(o=>`<div class="panel"><h3>${E(o.title)}</h3><p>${E(o.why)}</p><p class="small muted">หาได้ที่: ${o.kinds.map(k=>E(kindLabel(k))).join(' · ')}</p></div>`).join('')}</div>${g.advice.note?`<p class="panel tint">${E(g.advice.note)}</p>`:''}
      <div class="panel"><h3>สถานที่ที่เกี่ยวข้อง${g.home?` (เริ่มจากเขต${E(g.home)})`:''}</h3>${g.nearby.length?`<div class="place-list">${g.nearby.map(placeRow).join('')}</div>`:'<p class="muted">ยังไม่มีข้อมูลในเขตที่เก็บแล้ว</p>'}</div>`:''}`;
  };
  views['my-places']=async()=>{
    const {claims}=await app().api('/api/me/places');await meta();
    return `<span class="eyebrow">L7 · ผู้ให้บริการ · UC-16–18</span><h1>สถานที่ของฉัน</h1><p class="lead">เคลมหน้าจากแผนที่ แล้วแก้ข้อมูลทั่วไปได้ทันที ส่วนชื่อ ประเภท ที่อยู่ ต้องผ่านผู้ดูแล</p>
      ${claims.length?claims.map(c=>`<div class="panel"><div class="place-head"><h3>${E(c.placeName)}</h3><span class="status ${E(c.status)}">${({pending:'รอตรวจเคลม',approved:'ยืนยันแล้ว',rejected:'ไม่ผ่าน'})[c.status]}</span></div>
        <p class="small muted">บันทึกโดยผู้ใช้ ${c.stats.saved} คน · รายงานเปิดอยู่ ${c.stats.openReports}${c.reviewNote?` · หมายเหตุผู้ดูแล: ${E(c.reviewNote)}`:''}</p>
        ${c.status==='approved'&&c.place?`<form class="form-grid eco-edit" data-id="${E(c.placeId)}"><label class="field"><span>เวลาเปิด</span><input name="hours" value="${E(c.place.hours||'')}"></label><label class="field"><span>โทร</span><input name="phone" value="${E(c.place.phone||'')}"></label><label class="field"><span>เว็บไซต์</span><input name="website" value="${E(c.place.website||'')}"></label><label class="field"><span>บริการ (คั่นด้วย ,)</span><input name="offer" value="${E((c.place.offer||[]).join(', '))}"></label><label class="field"><span>ชื่อ (รอตรวจ)</span><input name="name" value="${E(c.place.name)}"></label><label class="field"><span>ที่อยู่ (รอตรวจ)</span><input name="address" value="${E(c.place.address||'')}"></label><button class="button" type="submit">บันทึก</button></form>${c.pendingEdits.length?`<p class="small">รอผู้ดูแลตรวจ: ${c.pendingEdits.map(e=>E(Object.keys(e.values).join(', '))).join(' · ')}</p>`:''}`:''}</div>`).join(''):'<div class="empty">ยังไม่มีสถานที่ — เปิดแผนที่ เลือกร้าน/เวทีของคุณ แล้วกด “เคลมหน้า”<br><button type="button" class="button" data-route="map">เปิดแผนที่</button></div>'}`;
  };
  views.queue=async()=>{
    const {items}=await app().api('/api/admin/queue');
    const label={report:'รายงาน',edit:'แก้ข้อมูล',claim:'เคลม',suggestion:'เสนอสถานที่'};
    return `<span class="eyebrow">L8 · ความน่าเชื่อถือ · UC-20</span><h1>คิวรายงานและแก้ข้อมูล</h1><p class="lead">เรียงตามความเสี่ยง (ปิดแล้ว/ไม่เกี่ยว → ฟิลด์เสี่ยง/เคลม → อื่น ๆ) แล้วตามเวลารอ</p>
      ${items.length?items.map(i=>`<div class="panel queue-item risk-${i.risk}"><div class="place-head"><span class="tag">${label[i.type]}</span><span class="tag">เสี่ยง ${i.risk}</span><b>${E(i.placeName)}</b><small class="muted">เขต${E(i.district)}</small></div><p><b>${E(i.title)}</b>${i.detail?` — ${E(i.detail)}`:''}</p><p class="small muted">โดย ${E(i.by)} · ${new Date(i.createdAt).toLocaleString('th-TH')}</p>
        <form class="eco-resolve actions" data-type="${i.type}" data-id="${E(i.id)}"><input name="note" placeholder="เหตุผล (จำเป็นเมื่อปฏิเสธ)" maxlength="300"><button class="button" name="decision" value="accepted">ยอมรับ</button><button class="button outline" name="decision" value="rejected">ปฏิเสธ</button></form></div>`).join(''):'<div class="empty">ไม่มีรายการค้าง</div>'}`;
  };
  views.progress=async()=>{
    eco.meta=null;const m=await meta();const ds=m.districts;
    const sum=s=>ds.filter(d=>d.status===s).length;
    return `<span class="eyebrow">การเก็บข้อมูลรายเขต</span><h1>ความคืบหน้า 50 เขต</h1><p class="lead">ค้นเว็บครบ ${sum('researched')} · มีเฉพาะ OSM ${sum('osm_only')} · ยังไม่เริ่ม ${sum('not_started')} · Gate ล่าสุด: ${m.lastGate.map(g=>`${E(g.gate)} ${g.pass?'✅':'❌'}`).join(' ')}</p>
      <div class="map-layout"><div class="map-box">${mapSvg(ds,[],{colorBy:'status'})}<div class="legend"><span class="sw s-researched">ค้นเว็บแล้ว</span><span class="sw s-osm_only">OSM อย่างเดียว</span><span class="sw s-not_started">ยังไม่เริ่ม</span></div></div>
      <div class="map-side"><table class="table"><thead><tr><th>เขต</th><th>wave</th><th>สถานะ</th><th>OSM</th><th>เว็บ</th><th>ช่องว่าง</th></tr></thead><tbody>${[...ds].sort((a,b)=>a.wave-b.wave).map(d=>`<tr><td>${E(d.name)}</td><td>${d.wave}</td><td><span class="status ${E(d.status)}">${({researched:'ค้นแล้ว',osm_only:'OSM',not_started:'ยังไม่เริ่ม'})[d.status]}</span></td><td>${d.osmPlaces}</td><td>${d.webPlaces}</td><td>${d.gaps.length}</td></tr>`).join('')}</tbody></table></div></div>`;
  };

  function overview(p){
    if(['teacher','admin'].includes(p.role))return null;
    const loops={learner:[['map','หาที่เรียน ร้าน ห้องซ้อมใกล้ฉัน'],['explore','ลองบทบาท 10 นาที'],['practice','แผนซ้อม 8 สัปดาห์'],['gear','ยังไม่มีเครื่อง?'],['opportunities','เวที ฝึกงาน งานอาสา']],parent:[['children','ลูกของฉัน (ชื่อเล่น + อายุ)'],['map','ที่เรียนใกล้บ้านบนแผนที่'],['catalog','ครูที่ผ่านการตรวจ'],['saved','ที่บันทึกไว้เปรียบเทียบ']],shop:[['my-places','จัดการหน้าร้าน'],['my-opps','ประกาศฝึกงาน/งานอาสา'],['map','หาร้านของฉันบนแผนที่เพื่อเคลม']],venue:[['my-places','จัดการหน้าเวที'],['my-opps','ประกาศช่องเล่นเวที'],['map','หาเวทีของฉันบนแผนที่เพื่อเคลม']]}[p.role]||[];
    return `<div class="panel tint persona-hello">${app().avatar(p,'big')}<div><span class="eyebrow">${E(app().ROLE_LABEL[p.role])} · persona สมมติ</span><h1>สวัสดี ${E(p.name)}</h1><p class="lead">${E(p.need)}</p><p class="small">เส้นทาง: ${E(p.goal)}</p></div></div>
      <div class="card-grid">${loops.map(([r,l])=>`<button type="button" class="panel loop-card" data-route="${r}"><b>${E(l)}</b><span class="arrow">→</span></button>`).join('')}</div>`;
  }

  // ---------- เหตุการณ์ ----------
  async function openPlace(id){eco.selected=id;eco.detail=await app().api('/api/places/'+encodeURIComponent(id));if(app().state.route!=='map'){await app().route('map')}else{await app().render();document.querySelector('.place-card')?.scrollIntoView({behavior:'smooth',block:'nearest'})}}
  document.addEventListener('click',async e=>{
    try{
      const pin=e.target.closest('[data-place]');if(pin){e.preventDefault();await openPlace(pin.dataset.place);return}
      const dist=e.target.closest('path[data-district]');if(dist){eco.filters.district=eco.filters.district===dist.dataset.district?'':dist.dataset.district;eco.detail=null;eco.selected=null;await app().render();return}
      const b=e.target.closest('[data-eco]');if(!b)return;
      const a=b.dataset.eco;
      if(a==='clear'){eco.filters={layer:'',kind:'',district:'',q:''};await app().render()}
      if(a==='toggle-large'){store.set('mil-large',document.body.classList.contains('large-text')?'0':'1');document.body.classList.toggle('large-text')}
      if(a==='save'){const r=await app().api('/api/me/saved',{method:'POST',body:JSON.stringify({placeId:b.dataset.id})});if(eco.compare){eco.compare=eco.compare.filter(x=>x!==b.dataset.id);if(r.saved&&eco.compare.length<3)eco.compare.push(b.dataset.id)}app().notice(r.saved?'บันทึกแล้ว':'เอาออกจากที่บันทึกแล้ว');eco.detail=null;await app().render()}
    }catch(err){app().notice(err.message,true)}
  });
  document.addEventListener('change',async e=>{
    const c=e.target.closest('[data-eco-compare]');if(!c)return;
    const id=c.dataset.ecoCompare;eco.compare=(eco.compare||[]).filter(x=>x!==id);
    if(c.checked){if(eco.compare.length>=3){c.checked=false;app().notice('เปรียบเทียบได้ครั้งละไม่เกิน 3 แห่ง',true);return}eco.compare.push(id)}
    await app().render();
  });
  document.addEventListener('submit',async e=>{
    const f=e.target;const d=new FormData(f);
    const known=['eco-filters','eco-report','eco-claim','eco-suggest','eco-plan','eco-practice','eco-gear'].includes(f.id)||f.classList.contains('eco-edit')||f.classList.contains('eco-resolve');
    if(!known)return;e.preventDefault();
    const post=(url,body)=>app().api(url,{method:'POST',body:JSON.stringify(body)});
    try{
      if(f.id==='eco-filters'){eco.filters={layer:d.get('layer')||'',kind:d.get('kind')||'',district:d.get('district')||'',q:(d.get('q')||'').trim()};eco.detail=null;eco.selected=null;await app().render()}
      if(f.id==='eco-report'){await post(`/api/places/${f.dataset.id}/reports`,{reason:d.get('reason'),note:d.get('note')});app().notice('ขอบคุณ ส่งรายงานถึงผู้ดูแลแล้ว ติดตามสถานะได้ที่ “ที่บันทึก”');eco.detail=null;await app().render()}
      if(f.id==='eco-suggest'){await post('/api/places/suggest',Object.fromEntries(d.entries()));app().notice('ขอบคุณ ส่งให้ผู้ดูแลตรวจแล้ว ติดตามได้ที่ “ที่บันทึก”');await app().render()}
      if(f.id==='eco-claim'){await post(`/api/places/${f.dataset.id}/claim`,{evidence:d.get('evidence')});app().notice('ส่งคำขอเคลมแล้ว รอผู้ดูแลตรวจ');eco.detail=null;await app().render()}
      if(f.id==='eco-plan'){await post('/api/me/plan',{goal:d.get('goal'),instrument:d.get('instrument'),minutesPerWeek:Number(d.get('minutesPerWeek'))});app().notice('สร้างแผน 8 สัปดาห์แล้ว');await app().render()}
      if(f.id==='eco-practice'){await post('/api/me/practice',{minutes:Number(d.get('minutes')),focus:d.get('focus'),feel:Number(d.get('feel'))});app().notice('บันทึกการซ้อมแล้ว');await app().render()}
      if(f.id==='eco-gear'){const q=new URLSearchParams(d);eco.gear={...(await app().api('/api/gear/advice?'+q)),budget:d.get('budget')};await app().render()}
      if(f.classList.contains('eco-edit')){const v=Object.fromEntries(d.entries());v.offer=String(v.offer||'').split(',').map(x=>x.trim()).filter(Boolean);const r=await post(`/api/places/${f.dataset.id}/edit`,v);app().notice(`อัปเดตทันที: ${r.applied.join(', ')||'-'}${r.pending?' · ส่วนที่เหลือรอผู้ดูแลตรวจ':''}`);await app().render()}
      if(f.classList.contains('eco-resolve')){const decision=e.submitter?.value;await post(`/api/admin/${f.dataset.type}/${f.dataset.id}/resolve`,{decision,note:d.get('note')});app().notice('บันทึกผลตรวจแล้ว');eco.meta=null;await app().render()}
    }catch(err){app().notice(err.message,true)}
  });

  window.MILEco={views,overview,after(){},largeText:p=>store.get('mil-large')!=null?store.get('mil-large')==='1':Boolean(p.largeText)};
})();
