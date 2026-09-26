// L5 สร้าง/แสดง + L6 อาชีพ: กระดานโอกาส โปรไฟล์วง และหน้าจัดการประกาศของเวที/ร้าน/ครู
(function(){
  'use strict';
  const app=()=>window.MILApp;
  const E=v=>app().E(v);
  let meta=null;
  const getMeta=async()=>meta||(meta=await app().api('/api/opportunities/meta'));
  const STATUS={pending:'รอตอบ',accepted:'ตอบรับแล้ว',declined:'ไม่รับ',performed:'มาเล่นแล้ว',no_show:'ไม่มาตามนัด'};
  const opt=(obj,sel)=>Object.entries(obj).map(([k,v])=>`<option value="${k}" ${sel===k?'selected':''}>${E(v)}</option>`).join('');
  const date=d=>d?new Date(d+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}):'ไม่กำหนดวัน';

  async function board(){
    const m=await getMeta();
    const [{opportunities},{band},{applications}]=await Promise.all([app().api('/api/opportunities'),app().api('/api/me/band'),app().api('/api/me/applications')]);
    const p=app().state.persona;
    return `<span class="eyebrow">L5 · L6 · UC-12–15</span><h1>เวที ฝึกงาน และงานอาสา</h1><p class="lead">สมัครเล่นเวทีต้องมีโปรไฟล์วงพร้อมคลิปเล่นสด · ทุกประกาศมีอายุขั้นต่ำ (คุณอายุ ${E(p.age)} ปี)</p>
      <details class="panel sub" ${band?'':'open'}><summary>${band?`โปรไฟล์วง: ${E(band.name)} · ${E(band.genre)}`:'สร้างโปรไฟล์วง (จำเป็นสำหรับช่องเล่นเวที)'}</summary>
        <form id="opp-band" class="form-grid"><label class="field"><span>ชื่อวง/ศิลปิน</span><input name="name" required minlength="2" maxlength="80" value="${E(band?.name||'')}"></label>
        <label class="field"><span>แนวเพลง</span><select name="genre" required>${m.genres.map(g=>`<option ${band?.genre===g?'selected':''}>${E(g)}</option>`).join('')}</select></label>
        <label class="field"><span>จำนวนสมาชิก</span><input name="members" type="number" min="1" max="20" required value="${E(band?.members||1)}"></label>
        <label class="field"><span>ลิงก์คลิปเล่นสด ≤ 90 วินาที (https://)</span><input name="clipUrl" type="url" pattern="https://.*" required value="${E(band?.clipUrl||'')}"></label>
        <label class="field"><span>สิ่งที่ต้องการจากเวที</span><input name="needs" maxlength="300" value="${E(band?.needs||'')}" placeholder="เช่น กลองชุด แอมป์เบส ไมค์ 3 ตัว"></label><button class="button" type="submit">บันทึกโปรไฟล์</button></form></details>
      ${applications.length?`<div class="panel"><h3>ใบสมัครของฉัน</h3><ul class="info-list">${applications.map(a=>`<li>${E(a.oppTitle)} · ${date(a.oppDate)} · <span class="status ${a.status==='accepted'||a.status==='performed'?'accepted':a.status==='pending'?'pending':'rejected'}">${STATUS[a.status]}</span></li>`).join('')}</ul></div>`:''}
      ${opportunities.length?`<div class="card-grid">${opportunities.map(o=>`<article class="panel opp"><div class="place-head"><span class="tag">${E(m.types[o.type])}</span><span class="tag">${E(m.pay[o.pay])}</span><span class="tag">${o.minAge}+</span></div>
        <h3>${E(o.title)}</h3><p class="small muted">${E(o.ownerName)} · ${o.district?'เขต'+E(o.district)+' · ':''}${date(o.date)}${o.genre?' · '+E(o.genre):''} · ผู้สมัคร ${o.applicants}</p><p>${E(o.details)}</p>
        ${o.myApplication?`<p class="small">สมัครแล้ว: <b>${STATUS[o.myApplication.status]}</b></p>`:o.eligible===false?`<p class="small muted">ประกาศนี้รับอายุ ${o.minAge} ปีขึ้นไป</p>`:o.type==='gig'&&!band?`<p class="small muted">สร้างโปรไฟล์วงก่อนสมัคร</p>`:
        `<form class="opp-apply stack" data-id="${E(o.id)}"><label class="field"><span>แนะนำตัวสั้น ๆ</span><input name="message" required minlength="10" maxlength="400"></label><button class="button" type="submit">สมัคร</button></form>`}</article>`).join('')}</div>`:'<div class="empty">ยังไม่มีประกาศที่เปิดรับ</div>'}`;
  }

  async function manage(){
    const m=await getMeta();const p=app().state.persona;
    const [{opportunities},{districts}]=await Promise.all([app().api('/api/me/opportunities'),app().api('/api/districts').catch(()=>({districts:[]}))]);
    const types=Object.fromEntries(Object.entries(m.types).filter(([k])=>k!=='gig'||p.role==='venue'));
    const next={pending:[['accepted','ตอบรับ'],['declined','ไม่รับ']],accepted:[['performed','มาเล่นแล้ว'],['no_show','ไม่มาตามนัด']]};
    return `<span class="eyebrow">L5 · L6 · ผู้ให้บริการ</span><h1>ประกาศโอกาส</h1><p class="lead">${p.role==='venue'?'ประกาศช่องเล่นเวที แล้วดูโปรไฟล์วง คลิปสด และประวัติการมาตามนัดของผู้สมัคร':'ประกาศฝึกงานหรืองานอาสาให้นักเรียน/นักศึกษาดนตรี'}</p>
      <details class="panel sub" ${opportunities.length?'':'open'}><summary>สร้างประกาศใหม่</summary><form id="opp-create" class="form-grid">
        <label class="field"><span>ประเภท</span><select name="type">${opt(types)}</select></label><label class="field"><span>หัวข้อ</span><input name="title" required minlength="5" maxlength="100"></label>
        <label class="field"><span>วันที่ (จำเป็นสำหรับเวที)</span><input name="date" type="date"></label><label class="field"><span>เขต</span><select name="district"><option value="">ไม่ระบุ</option>${districts.map(d=>`<option ${p.home===d.name?'selected':''}>${E(d.name)}</option>`).join('')}</select></label>
        <label class="field"><span>แนวเพลง</span><select name="genre"><option value="">ไม่ระบุ</option>${m.genres.map(g=>`<option>${E(g)}</option>`).join('')}</select></label><label class="field"><span>ค่าตอบแทน</span><select name="pay">${opt(m.pay)}</select></label>
        <label class="field"><span>อายุขั้นต่ำ</span><input name="minAge" type="number" min="13" max="25" value="${p.role==='venue'?18:15}"></label><label class="field"><span>รายละเอียด</span><input name="details" required minlength="10" maxlength="500"></label>
        <button class="button" type="submit">ประกาศ</button></form></details>
      ${opportunities.length?opportunities.map(o=>`<div class="panel"><div class="place-head"><span class="tag">${E(m.types[o.type])}</span><span class="status ${o.status==='open'?'accepted':'rejected'}">${o.status==='open'?'เปิดรับ':'ปิดแล้ว'}</span><b>${E(o.title)}</b><small class="muted">${date(o.date)}</small>${o.status==='open'?`<button type="button" class="text-btn" data-opp-close="${E(o.id)}">ปิดรับ</button>`:''}</div>
        ${o.applications.length?`<table class="table"><thead><tr><th>ผู้สมัคร</th><th>วง/คลิป</th><th>ประวัติ</th><th>สถานะ</th><th></th></tr></thead><tbody>${o.applications.map(a=>`<tr><td>${E(a.applicantName)} (${E(a.applicantAge)})<br><small class="muted">${E(a.message)}</small></td>
          <td>${a.band?`${E(a.band.name)} · ${E(a.band.members)} คน<br><a href="${E(a.band.clipUrl)}" target="_blank" rel="noopener noreferrer">ดูคลิปสด</a>${a.band.needs?`<br><small class="muted">ต้องการ: ${E(a.band.needs)}</small>`:''}`:'—'}</td>
          <td>มาเล่น ${a.reliability.performed} · ไม่มา ${a.reliability.noShow}</td><td>${STATUS[a.status]}</td>
          <td>${(next[a.status]||[]).map(([d,l])=>`<button type="button" class="button ${d==='declined'||d==='no_show'?'outline':''}" data-app="${E(a.id)}" data-decision="${d}">${l}</button>`).join(' ')}</td></tr>`).join('')}</tbody></table>`:'<p class="muted small">ยังไม่มีผู้สมัคร</p>'}</div>`).join(''):''}`;
  }

  const register=()=>{if(!window.MILEco)return setTimeout(register,0);window.MILEco.views.opportunities=board;window.MILEco.views['my-opps']=manage};
  register();

  document.addEventListener('submit',async e=>{
    const f=e.target;if(!['opp-band','opp-create'].includes(f.id)&&!f.classList.contains('opp-apply'))return;e.preventDefault();
    const d=Object.fromEntries(new FormData(f).entries());const post=(u,b)=>app().api(u,{method:'POST',body:JSON.stringify(b)});
    try{
      if(f.id==='opp-band'){await post('/api/me/band',{...d,members:Number(d.members)});app().notice('บันทึกโปรไฟล์วงแล้ว')}
      if(f.id==='opp-create'){await post('/api/opportunities',{...d,minAge:Number(d.minAge)});app().notice('ประกาศแล้ว')}
      if(f.classList.contains('opp-apply')){await post(`/api/opportunities/${f.dataset.id}/apply`,d);app().notice('ส่งใบสมัครแล้ว')}
      await app().render();
    }catch(err){app().notice(err.message,true)}
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-app],[data-opp-close]');if(!b)return;
    try{
      if(b.dataset.oppClose)await app().api(`/api/opportunities/${b.dataset.oppClose}/close`,{method:'POST',body:'{}'});
      else await app().api(`/api/applications/${b.dataset.app}/respond`,{method:'POST',body:JSON.stringify({decision:b.dataset.decision})});
      app().notice('บันทึกแล้ว');await app().render();
    }catch(err){app().notice(err.message,true)}
  });
})();
