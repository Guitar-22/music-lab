(function(){
  'use strict';
  const key='music-industry-lap-teacher-draft-v1';
  const form=document.getElementById('listing-form');
  const preview=document.getElementById('preview');
  const status=document.getElementById('status');
  const money=n=>Number(n||0).toLocaleString('th-TH')+' บาท';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function values(){const d=new FormData(form);return Object.fromEntries([...d.entries()].map(([k,v])=>[k,String(v).trim()]));}
  function restore(){try{const saved=JSON.parse(localStorage.getItem(key));if(!saved?.data)return;for(const [name,value] of Object.entries(saved.data)){const input=form.elements.namedItem(name);if(input){if(input.type==='checkbox')input.checked=!!value;else input.value=value}}status.textContent='โหลดร่างที่บันทึกไว้ในเครื่องนี้แล้ว'+(saved.state==='pending'?' · เคยกดส่งตรวจตัวอย่าง':'')}catch{}}
  function save(state){const data=values();data.loan=form.elements.namedItem('loan').checked;try{localStorage.setItem(key,JSON.stringify({data,state,updatedAt:new Date().toISOString()}));status.textContent=state==='pending'?'บันทึกสถานะ “รอตรวจ” แบบจำลองแล้ว ยังไม่มีการส่งข้อมูลออก':'บันทึกร่างในเครื่องนี้แล้ว';return true}catch{status.textContent='บันทึกในเครื่องไม่สำเร็จ โปรดตรวจการตั้งค่าเบราว์เซอร์';return false}}
  function show(){if(!form.reportValidity())return;const d=values(),loan=form.elements.namedItem('loan').checked;const total=Number(d.price)*4+Number(d.extra||0);preview.innerHTML=`<span class="badge">ตัวอย่างประกาศ · ยังไม่เผยแพร่</span><h2>${esc(d.title)}</h2><p class="teacher">โดย ${esc(d.teacher)} · ${esc(d.subject)} · ${esc(d.level)}</p><div class="price">${money(d.price)} <small style="font:13px system-ui">/ คาบ ${esc(d.duration)} นาที</small></div><p>${esc(d.outcome)}</p><div class="estimate"><b>ประมาณค่าเรียน 4 คาบ: ${money(total)}</b><br>4 × ${money(d.price)} + ค่าเพิ่ม ${money(d.extra)} · ยังไม่รวมค่าเดินทางหากมี</div><dl><dt>รูปแบบ</dt><dd>${esc(d.mode)} · ${esc(d.place)} · รับ ${esc(d.capacity)} คนต่อรอบ</dd><dt>ช่วงเวลา</dt><dd>${esc(d.slots)}</dd><dt>อุปกรณ์</dt><dd>${esc(d.equipment)}${loan?' · มีเครื่องให้ลอง/ยืม':''}</dd><dt>วิธีสอน</dt><dd>${esc(d.method)}</dd><dt>เงื่อนไข</dt><dd>${esc(d.terms)}</dd></dl><p class="foot">ประกาศตัวอย่างนี้อยู่บนเครื่องของคุณเท่านั้น การส่งตรวจจริงต้องมีบัญชี ระบบตรวจข้อมูล นโยบายข้อมูล และช่องทางติดต่อที่ปลอดภัย</p><button type="button" id="submit-review">ส่งตรวจตัวอย่าง</button>`;preview.hidden=false;preview.scrollIntoView({behavior:'smooth',block:'start'});status.textContent='ตรวจความถูกต้องของราคา อุปกรณ์ และเงื่อนไขก่อนส่งตรวจ';}
  document.getElementById('save-draft').addEventListener('click',()=>save('draft'));
  document.getElementById('preview-button').addEventListener('click',show);
  form.addEventListener('submit',e=>{e.preventDefault();show()});
  preview.addEventListener('click',e=>{if(e.target.id==='submit-review'&&form.reportValidity()){save('pending');preview.querySelector('.badge').textContent='รอตรวจ · สถานะตัวอย่าง';e.target.disabled=true;e.target.textContent='ส่งตรวจตัวอย่างแล้ว'}});
  restore();
})();
