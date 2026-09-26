// L9 ผู้ปกครอง: จัดการข้อมูลลูก (ชื่อเล่น + อายุเท่านั้น) ก่อนส่งคำขอเรียนแทน
(function(){
  'use strict';
  const app=()=>window.MILApp;
  const E=v=>app().E(v);
  async function children(){
    const {children}=await app().api('/api/me/children');
    return `<span class="eyebrow">L9 · ผู้ปกครอง · UC-22</span><h1>ลูกของฉัน</h1><p class="lead">เก็บแค่ชื่อเล่นและอายุ เพื่อกรองบริการที่รับเด็กได้ ครูติดต่อผ่านผู้ปกครองเท่านั้น</p>
      <div class="panel"><form id="child-add" class="form-grid"><label class="field"><span>ชื่อเล่น (ไม่ต้องใส่ชื่อจริง)</span><input name="nickname" required maxlength="30"></label><label class="field"><span>อายุ</span><input name="age" type="number" min="3" max="17" required value="8"></label><button class="button" type="submit">เพิ่ม</button></form></div>
      ${children.length?`<div class="card-grid">${children.map(c=>`<div class="panel"><h3>${E(c.nickname)}</h3><p>${c.age} ปี</p><div class="actions"><button type="button" class="button" data-route="catalog">หาครูที่รับอายุนี้</button><button type="button" class="button outline" data-child-remove="${E(c.id)}">ลบ</button></div></div>`).join('')}</div>`:'<div class="empty">ยังไม่มีข้อมูลลูก</div>'}
      <div class="panel tint small">ก่อนคาบแรก: ขอให้เรียนในที่เปิดเผยหรือมีผู้ปกครองอยู่ด้วย · ตรวจตัวตนครูกับสถาบัน/เพจทางการ · ต้องไม่มีการชำระเงินหรือแชตส่วนตัวกับเด็กโดยตรง</div>`;
  }
  const register=()=>{if(!window.MILEco)return setTimeout(register,0);window.MILEco.views.children=children};
  register();
  document.addEventListener('submit',async e=>{
    if(e.target.id!=='child-add')return;e.preventDefault();
    const d=new FormData(e.target);
    try{await app().api('/api/me/children',{method:'POST',body:JSON.stringify({nickname:d.get('nickname'),age:Number(d.get('age'))})});app().notice('เพิ่มแล้ว');await app().render()}catch(err){app().notice(err.message,true)}
  });
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-child-remove]');if(!b)return;
    try{await app().api(`/api/me/children/${b.dataset.childRemove}/remove`,{method:'POST',body:'{}'});await app().render()}catch(err){app().notice(err.message,true)}
  });
})();
