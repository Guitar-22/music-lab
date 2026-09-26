// หน้า static: แผนที่ Ecosystem ดนตรีกรุงเทพฯ อ่านจาก places-data.js (สร้างโดย database/build.cjs)
(function(){
  'use strict';
  const D=window.MILPlaces;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!D){$('eco-summary').textContent='ยังไม่มีข้อมูล — รัน npm run build ในโฟลเดอร์ database';return}
  const LAYERS={learn:['เรียน','โรงเรียน คณะดนตรี คลังดนตรี'],gear:['อุปกรณ์','ร้านเครื่องดนตรี Pro audio ร้านซ่อม'],create:['สร้างงาน','ห้องซ้อม สตูดิโอ'],perform:['แสดง','เวทีดนตรีสด หอแสดง วง'],listen:['ฟัง/สื่อ','ร้านแผ่นเสียง วิทยุ คาราโอเกะ'],business:['ธุรกิจ','ค่ายเพลง ลิขสิทธิ์ ผู้จัด']};
  const state={q:'',layer:'',kind:'',district:'',selected:null};
  const count=(list,f)=>list.filter(f).length;

  // สรุปภาพรวม
  const researched=D.districts.filter(d=>d.status==='researched').length;
  $('eco-summary').textContent=`${D.places.length} สถานที่ที่ผ่านการตรวจ ใน ${new Set(D.places.map(p=>p.district)).size} เขต · ค้นเว็บครบ ${researched}/50 เขต · อัปเดต ${new Date(D.generatedAt).toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})}`;
  $('eco-license').textContent=D.license;
  $('eco-layers').innerHTML=Object.entries(LAYERS).map(([k,[label,desc]])=>`<button type="button" class="eco-layer l-${k}" data-layer="${k}"><b>${count(D.places,p=>p.layer===k)}</b><span>${label}</span><small>${desc}</small></button>`).join('');

  // ตัวเลือกในฟอร์ม
  const f=$('eco-filter');
  f.layer.insertAdjacentHTML('beforeend',Object.entries(LAYERS).map(([k,[l]])=>`<option value="${k}">${l}</option>`).join(''));
  const fillKinds=()=>{f.kind.innerHTML='<option value="">ทั้งหมด</option>'+Object.entries(D.kinds).filter(([,v])=>!state.layer||v.layer===state.layer).map(([k,v])=>`<option value="${k}" ${state.kind===k?'selected':''}>${E(v.label)}</option>`).join('')};
  fillKinds();
  f.district.insertAdjacentHTML('beforeend',[...D.districts].sort((a,b)=>a.wave-b.wave||a.name.localeCompare(b.name,'th')).map(d=>`<option>${E(d.name)}</option>`).join(''));

  // ฉายภาพพิกัดเป็น SVG
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const d of D.districts)for(const r of d.rings)for(const [x,y] of r){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
  const k=Math.cos((minY+maxY)/2*Math.PI/180),W=1000,S=W/((maxX-minX)*k),H=(maxY-minY)*S;
  const pt=([x,y])=>[((x-minX)*k*S).toFixed(1),((maxY-y)*S).toFixed(1)];
  const bbox=rings=>{const ps=rings.flat().map(pt).map(q=>q.map(Number));const xs=ps.map(q=>q[0]),ys=ps.map(q=>q[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]};

  const filtered=()=>D.places.filter(p=>(!state.layer||p.layer===state.layer)&&(!state.kind||p.kind===state.kind)&&(!state.district||p.district===state.district)
    &&(!state.q||[p.name,p.name_en,p.address,...p.offer].some(v=>v&&v.toLowerCase().includes(state.q))));

  function drawMap(list){
    const max=Math.max(1,...D.districts.map(d=>count(list,p=>p.district===d.name)));
    let vb=`0 0 ${W} ${H.toFixed(0)}`,r=5;
    const sel=D.districts.find(d=>d.name===state.district);
    if(sel){const [x,y,w,h]=bbox(sel.rings),pad=Math.max(w,h)*.15;vb=`${(x-pad).toFixed(0)} ${(y-pad).toFixed(0)} ${(w+pad*2).toFixed(0)} ${(h+pad*2).toFixed(0)}`;r=Math.max(2,Math.min(7,(w+pad*2)/60))}
    $('eco-map').innerHTML=`<svg viewBox="${vb}" role="img" aria-label="แผนที่ 50 เขตกรุงเทพฯ และสถานที่ดนตรี">${D.districts.map(d=>{const n=count(list,p=>p.district===d.name);return `<path class="eco-district${d.name===state.district?' on':''}" data-district="${E(d.name)}" fill="${n?`rgba(47,125,79,${(0.12+0.6*n/max).toFixed(2)})`:'#efede6'}" d="${d.rings.map(ring=>'M'+ring.map(pt).join('L')+'Z').join('')}"><title>เขต${E(d.name)} · ${n} แห่ง</title></path>`}).join('')}
      ${list.filter(p=>p.lat!=null).map(p=>{const [x,y]=pt([p.lon,p.lat]);return `<circle class="eco-pin l-${p.layer}${state.selected===p.id?' on':''}" cx="${x}" cy="${y}" r="${r}" data-place="${E(p.id)}"><title>${E(p.name)}</title></circle>`}).join('')}</svg>`;
  }
  const kindLabel=k=>D.kinds[k]?.label||k;
  function drawDetail(){
    const p=D.places.find(x=>x.id===state.selected);
    if(!p){$('eco-detail').innerHTML='<p class="eco-muted">คลิกจุดบนแผนที่ เขต หรือรายการ เพื่อดูรายละเอียด</p>';return}
    const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.lat!=null?`${p.name} ${p.lat},${p.lon}`:`${p.name} ${p.district} กรุงเทพมหานคร`);
    const link=u=>`<a href="${E(u)}" target="_blank" rel="noopener noreferrer">${E(u.replace(/^https?:\/\/(www\.)?/,'').slice(0,42))}</a>`;
    const row=(l,v)=>`<dt>${l}</dt><dd>${v||'<span class="eco-muted">ยังไม่มีข้อมูล</span>'}</dd>`;
    $('eco-detail').innerHTML=`<span class="eco-chip l-${p.layer}">${E(LAYERS[p.layer][0])}</span> <span class="eco-tag">${E(kindLabel(p.kind))}</span><h3>${E(p.name)}</h3>${p.name_en&&p.name_en!==p.name?`<p class="eco-muted">${E(p.name_en)}</p>`:''}
      <dl>${row('เขต',E(p.district))}${row('ที่อยู่',E(p.address))}${row('เวลา',E(p.hours))}${row('โทร',p.phone?`<a href="tel:${E(p.phone.replace(/[^\d+]/g,''))}">${E(p.phone)}</a>`:'')}${row('เว็บ',p.website?link(p.website):'')}${row('โซเชียล',p.social.map(link).join('<br>'))}${row('บริการ',p.offer.map(E).join(', '))}</dl>
      <p class="eco-fresh">ตรวจเมื่อ ${E(p.checked||'—')} · ${({osm:'OpenStreetMap',chain:'รายชื่อตัวแทนทางการของแบรนด์'})[p.source]||'หน้าเจ้าของ/ห้าง/สถาบัน'} · <a href="${E(p.source_url)}" target="_blank" rel="noopener noreferrer">แหล่งข้อมูล</a></p>
      <a class="eco-btn" href="${E(maps)}" target="_blank" rel="noopener noreferrer">ตรวจบน Google Maps</a>${p.lat==null?'<p class="eco-muted">ยังไม่มีพิกัดที่ยืนยันได้ จึงไม่ปักหมุด</p>':''}`;
  }
  function drawList(list){
    const groups=[...new Set(list.map(p=>p.district))];
    $('eco-list').innerHTML=list.length?groups.map(d=>`<section class="eco-group"><h3>เขต${E(d)} <small>${count(list,p=>p.district===d)} แห่ง</small></h3><div class="eco-rows">${list.filter(p=>p.district===d).map(p=>`<button type="button" class="eco-row${state.selected===p.id?' on':''}" data-place="${E(p.id)}"><span class="eco-chip l-${p.layer}">${E(LAYERS[p.layer][0])}</span><b>${E(p.name)}</b><small>${E(kindLabel(p.kind))}${p.lat==null?' · ไม่มีหมุด':''}</small></button>`).join('')}</div></section>`).join(''):'<p class="eco-empty">ไม่พบสถานที่ตามตัวกรอง</p>';
  }
  function drawProgress(){
    const label={researched:'ค้นเว็บแล้ว',osm_only:'OSM อย่างเดียว',not_started:'ยังไม่เริ่ม'};
    $('eco-progress').innerHTML=`<div class="eco-table-wrap"><table class="eco-table"><thead><tr><th>เขต</th><th>wave</th><th>สถานะ</th><th>OSM</th><th>ค้นเว็บ</th><th>ช่องว่างที่บันทึก</th></tr></thead><tbody>${[...D.districts].sort((a,b)=>a.wave-b.wave||b.osm+b.web-a.osm-a.web).map(d=>`<tr><td><button type="button" class="eco-link" data-district="${E(d.name)}">${E(d.name)}</button></td><td>${d.wave}</td><td><span class="eco-status s-${d.status}">${label[d.status]}</span></td><td>${d.osm}</td><td>${d.web}</td><td>${d.gaps}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function render(){const list=filtered();drawMap(list);drawList(list);drawDetail();document.querySelectorAll('.eco-layer').forEach(b=>b.classList.toggle('on',b.dataset.layer===state.layer))}

  f.addEventListener('input',()=>{state.q=f.q.value.trim().toLowerCase();state.kind=f.kind.value;state.district=f.district.value;if(state.layer!==f.layer.value){state.layer=f.layer.value;state.kind='';fillKinds()}render()});
  f.addEventListener('reset',()=>setTimeout(()=>{Object.assign(state,{q:'',layer:'',kind:'',district:'',selected:null});fillKinds();render()}));
  document.addEventListener('click',e=>{
    const pl=e.target.closest('[data-place]');if(pl){state.selected=pl.dataset.place;render();if(innerWidth<860)$('eco-detail').scrollIntoView({behavior:'smooth',block:'start'});return}
    const di=e.target.closest('[data-district]');if(di){state.district=state.district===di.dataset.district?'':di.dataset.district;f.district.value=state.district;state.selected=null;render();if(di.classList.contains('eco-link'))$('map').scrollIntoView({behavior:'smooth'});return}
    const la=e.target.closest('[data-layer]');if(la){state.layer=state.layer===la.dataset.layer?'':la.dataset.layer;state.kind='';f.layer.value=state.layer;fillKinds();render();$('map').scrollIntoView({behavior:'smooth'})}
  });
  drawProgress();render();
})();
