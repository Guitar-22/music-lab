// L10 ชุมชน/กิจกรรม: ฟีดของฉัน + ปฏิทินตามเขต (สมาชิก) และหน้าสร้างกิจกรรม (ครู/ร้าน/เวที)
(function(){
  'use strict';
  const app=()=>window.MILApp;
  const E=v=>app().E(v);
  let meta=null,district='';
  const getMeta=async()=>meta||(meta=await app().api('/api/events/meta'));
  const when=e=>`${new Date(e.date+'T00:00:00').toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'})}${e.time?' '+E(e.time)+' น.':''}`;
  const card=(e,m,withAction)=>`<article class="panel event"><div class="place-head"><span class="tag">${E(m.kinds[e.kind])}</span><span class="tag">${e.free?'ฟรี':'มีค่าใช้จ่าย'}</span>${e.minAge?`<span class="tag">${e.minAge}+</span>`:''}${e.why?`<span class="tag verified">${E(e.why)}</span>`:''}</div>
    <h3>${E(e.title)}</h3><p class="small muted">${when(e)} · ${e.placeName?E(e.placeName)+' · ':''}เขต${E(e.district)} · โดย ${E(e.ownerName)} · สนใจ ${e.interested}</p><p>${E(e.details)}</p>
    ${withAction?(e.eligible===false?`<p class="small muted">สำหรับอายุ ${e.minAge} ปีขึ้นไป</p>`:`<button type="button" class="button ${e.mine?'':'secondary'}" data-event-interest="${E(e.id)}">${e.mine?'★ สนใจแล้ว':'☆ สนใจ'}</button>`):''}</article>`;

  async function events(){
    const m=await getMeta();const q=district?`?district=${encodeURIComponent(district)}`:'';
    const [{feed},{events},{districts}]=await Promise.all([app().api('/api/me/feed'),app().api('/api/events'+q),app().api('/api/districts').catch(()=>({districts:[]}))]);
    const byDate=[...new Set(events.map(e=>e.date))];
    return `<span class="eyebrow">L10 · ชุมชน · UC-23–24</span><h1>กิจกรรมดนตรีใกล้ฉัน</h1><p class="lead">ฟีดแสดงกิจกรรมจากสถานที่ที่คุณบันทึกและเขตบ้าน${app().state.persona.home?` (${E(app().state.persona.home)})`:''} · ปฏิทินด้านล่างแสดงทั้งหมด</p>
      <div class="panel"><h3>ฟีดของฉัน</h3>${feed.length?`<div class="card-grid">${feed.map(e=>card(e,m,true)).join('')}</div>`:'<p class="muted">ยังไม่มีกิจกรรมจากสถานที่ที่บันทึกหรือเขตบ้าน — บันทึกสถานที่จากแผนที่ดนตรีเพื่อติดตาม</p>'}</div>
      <form id="event-filter" class="filter-row eco-filters"><label class="field"><span>เขต</span><select name="district"><option value="">ทั้งกรุงเทพฯ</option>${districts.map(d=>`<option ${district===d.name?'selected':''}>${E(d.name)}</option>`).join('')}</select></label><button class="button" type="submit">ดูปฏิทิน</button></form>
      ${byDate.length?byDate.map(d=>`<section class="district-group"><h3>${new Date(d+'T00:00:00').toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'long'})}</h3><div class="card-grid">${events.filter(e=>e.date===d).map(e=>card(e,m,true)).join('')}</div></section>`).join(''):'<div class="empty">ยังไม่มีกิจกรรมในช่วงนี้</div>'}`;
  }

  async function myEvents(){
    const m=await getMeta();const p=app().state.persona;
    const [{events},{claims},{districts}]=await Promise.all([app().api('/api/me/events'),app().api('/api/me/places'),app().api('/api/districts').catch(()=>({districts:[]}))]);
    const owned=claims.filter(c=>c.status==='approved');
    return `<span class="eyebrow">L10 · ผู้ให้บริการ</span><h1>กิจกรรมของฉัน</h1><p class="lead">ผูกกิจกรรมกับสถานที่ที่คุณเป็นเจ้าของ เพื่อให้คนที่บันทึกสถานที่นั้นเห็นในฟีด</p>
      <details class="panel sub" ${events.length?'':'open'}><summary>สร้างกิจกรรม</summary><form id="event-create" class="form-grid">
        <label class="field"><span>ประเภท</span><select name="kind">${Object.entries(m.kinds).map(([k,v])=>`<option value="${k}">${E(v)}</option>`).join('')}</select></label><label class="field"><span>ชื่อกิจกรรม</span><input name="title" required minlength="5" maxlength="100"></label>
        <label class="field"><span>วันที่</span><input name="date" type="date" required></label><label class="field"><span>เวลา</span><input name="time" type="time"></label>
        <label class="field"><span>สถานที่ของฉัน</span><select name="placeId"><option value="">ไม่ผูกสถานที่</option>${owned.map(c=>`<option value="${E(c.placeId)}">${E(c.placeName)}</option>`).join('')}</select></label>
        <label class="field"><span>เขต (ถ้าไม่ผูกสถานที่)</span><select name="district"><option value="">—</option>${districts.map(d=>`<option ${p.home===d.name?'selected':''}>${E(d.name)}</option>`).join('')}</select></label>
        <label class="field"><span>อายุขั้นต่ำ</span><input name="minAge" type="number" min="0" max="25" value="0"></label><label class="check"><input type="checkbox" name="free"> เข้าฟรี</label>
        <label class="field"><span>รายละเอียด</span><input name="details" required minlength="10" maxlength="400"></label><button class="button" type="submit">ประกาศกิจกรรม</button></form></details>
      ${events.length?`<div class="card-grid">${events.map(e=>`${card(e,m,false)}${e.status==='open'?`<button type="button" class="text-btn" data-event-cancel="${E(e.id)}">ยกเลิก “${E(e.title)}”</button>`:''}`).join('')}</div>`:''}`;
  }

  const register=()=>{if(!window.MILEco)return setTimeout(register,0);Object.assign(window.MILEco.views,{events,'my-events':myEvents})};
  register();
  document.addEventListener('submit',async e=>{
    const f=e.target;if(!['event-filter','event-create'].includes(f.id))return;e.preventDefault();
    const d=new FormData(f);
    try{
      if(f.id==='event-filter'){district=d.get('district')||''}
      else{const v=Object.fromEntries(d.entries());v.free=d.has('free');v.minAge=Number(v.minAge||0);if(v.placeId)delete v.district;await app().api('/api/events',{method:'POST',body:JSON.stringify(v)});app().notice('ประกาศกิจกรรมแล้ว')}
      await app().render();
    }catch(err){app().notice(err.message,true)}
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-event-interest],[data-event-cancel]');if(!b)return;
    try{
      if(b.dataset.eventInterest){const r=await app().api(`/api/events/${b.dataset.eventInterest}/interest`,{method:'POST',body:'{}'});app().notice(r.interested?'บันทึกว่าสนใจแล้ว':'เอาออกแล้ว')}
      else{await app().api(`/api/events/${b.dataset.eventCancel}/cancel`,{method:'POST',body:'{}'});app().notice('ยกเลิกกิจกรรมแล้ว')}
      await app().render();
    }catch(err){app().notice(err.message,true)}
  });
})();
