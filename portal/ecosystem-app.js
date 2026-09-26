// แท็บ "แผนที่" ของ Journey app (Apple HIG): อ่าน places-data.js (สร้างโดย database/build.cjs)
(function () {
  'use strict';
  const D = window.MILPlaces;
  const $ = id => document.getElementById(id);
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!D) { $('summary').textContent = 'ยังไม่มีข้อมูล — รัน npm run build ในโฟลเดอร์ database'; return; }

  // ───────── สร้าง DOM แบบปลอดภัย (ไม่ใช้ innerHTML กับข้อมูล) ─────────
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  const P = {
    chev: 'M9.5 5.5 16 12l-6.5 6.5', check: 'M5 12.8l4.4 4.4L19 7.4', xmark: 'M6.5 6.5l11 11M17.5 6.5l-11 11', out: 'M8 16 16 8M9.5 8H16v6.5',
    learn: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20',
    gear: 'M8.5 20.5h7l-1.8-15h-3.4zM12 5.5l3.5 9M6.5 20.5h11',
    create: 'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5v3M8.5 20.5h7',
    perform: 'M4 20.5h16M6.5 20.5l2-8h7l2 8M9 4l3 8.5L15 4',
    listen: 'M4.5 15v-3a7.5 7.5 0 0 1 15 0v3M4.5 14.5h3v5.5h-3zM16.5 14.5h3v5.5h-3z',
    business: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7zM8 8.1v.1',
  };
  function sym(name) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg'), path = document.createElementNS(ns, 'path');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'sym'); svg.setAttribute('aria-hidden', 'true');
    path.setAttribute('d', P[name]); svg.append(path); return svg;
  }

  const LAYERS = { learn: ['เรียน', 'โรงเรียน คณะดนตรี คลังดนตรี'], gear: ['อุปกรณ์', 'ร้านเครื่องดนตรี Pro audio ร้านซ่อม'], create: ['สร้างงาน', 'ห้องซ้อม สตูดิโอ'],
    perform: ['แสดง', 'เวทีดนตรีสด หอแสดง วง'], listen: ['ฟังและสื่อ', 'ร้านแผ่นเสียง วิทยุ คาราโอเกะ'], business: ['ธุรกิจ', 'ค่ายเพลง ลิขสิทธิ์ ผู้จัด'] };
  const SOURCE = { osm: 'OpenStreetMap', chain: 'รายชื่อตัวแทนทางการของแบรนด์', web: 'หน้าเจ้าของ ห้าง หรือสถาบัน' };
  const state = { q: '', layer: '', district: '', selected: null };
  const kindLabel = k => D.kinds[k]?.label || k;
  const count = (list, f) => list.filter(f).length;
  const announce = t => { $('announcer').textContent = t; };

  // ───────── หัวเรื่อง ─────────
  const researched = count(D.districts, d => d.status === 'researched');
  const updated = new Date(D.generatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  $('eyebrow').textContent = `อัปเดต ${updated}`;
  $('summary').textContent = `${D.places.length} สถานที่ที่ผ่านการตรวจ ใน ${new Set(D.places.map(p => p.district)).size} เขต · ค้นเว็บครบ ${researched}/50 เขต`;
  $('license').textContent = D.license;

  // navbar กระจกเมื่อเลื่อนผ่าน large title (HIG: Toolbars)
  new IntersectionObserver(([e]) => $('navbar').classList.toggle('scrolled', !e.isIntersecting), { rootMargin: '-52px 0px 0px 0px' }).observe($('title-row'));
  // แตะแท็บที่อยู่แล้ว = เลื่อนกลับบนสุด
  $('map-tab').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); });

  const filtered = () => D.places.filter(p => (!state.layer || p.layer === state.layer) && (!state.district || p.district === state.district)
    && (!state.q || [p.name, p.name_en, p.address, ...p.offer].some(v => v && v.toLowerCase().includes(state.q))));

  // ───────── แผนที่ SVG ─────────
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of D.districts) for (const r of d.rings) for (const [x, y] of r) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const K = Math.cos((minY + maxY) / 2 * Math.PI / 180), W = 1000, S = W / ((maxX - minX) * K), H = (maxY - minY) * S;
  const pt = ([x, y]) => [((x - minX) * K * S).toFixed(1), ((maxY - y) * S).toFixed(1)];
  function drawMap(list) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    const max = Math.max(1, ...D.districts.map(d => count(list, p => p.district === d.name)));
    let vb = `0 0 ${W} ${H.toFixed(0)}`, r = 5.5;
    const sel = D.districts.find(d => d.name === state.district);
    if (sel) {
      const ps = sel.rings.flat().map(pt).map(q => q.map(Number)), xs = ps.map(q => q[0]), ys = ps.map(q => q[1]);
      const w = Math.max(...xs) - Math.min(...xs), hgt = Math.max(...ys) - Math.min(...ys), pad = Math.max(w, hgt) * .15;
      vb = `${(Math.min(...xs) - pad).toFixed(0)} ${(Math.min(...ys) - pad).toFixed(0)} ${(w + pad * 2).toFixed(0)} ${(hgt + pad * 2).toFixed(0)}`;
      r = Math.max(2.2, Math.min(8, (w + pad * 2) / 55));
    }
    svg.setAttribute('viewBox', vb); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', sel ? `แผนที่เขต${sel.name}` : 'แผนที่ 50 เขตกรุงเทพฯ');
    for (const d of D.districts) {
      const n = count(list, p => p.district === d.name), path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d.rings.map(ring => 'M' + ring.map(pt).join('L') + 'Z').join(''));
      path.setAttribute('class', `district${n ? ' has' : ''}${d.name === state.district ? ' on' : ''}`);
      if (n) path.setAttribute('fill-opacity', (.12 + .55 * n / max).toFixed(2));
      path.dataset.district = d.name;
      const t = document.createElementNS(ns, 'title'); t.textContent = `เขต${d.name} · ${n} แห่ง`; path.append(t);
      svg.append(path);
    }
    for (const p of list) {
      if (p.lat == null) continue;
      const [x, y] = pt([p.lon, p.lat]), c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r);
      c.setAttribute('class', `pin l-${p.layer}${state.selected === p.id ? ' on' : ''}`); c.dataset.place = p.id;
      const t = document.createElementNS(ns, 'title'); t.textContent = p.name; c.append(t);
      svg.append(c);
    }
    $('map').replaceChildren(svg);
    $('clear-district').hidden = !state.district;
    $('map-h').textContent = state.district ? `เขต${state.district}` : 'แผนที่เขต';
  }

  // ───────── ชั้น (ตัวเลือกแบบ ✓ ตาม HIG Lists) ─────────
  function drawLayers() {
    const base = D.places.filter(p => !state.district || p.district === state.district);
    $('layers').replaceChildren(...Object.entries(LAYERS).map(([k, [label, desc]]) => h('li', {},
      h('button', { type: 'button', class: `row l-${k}`, role: 'radio', 'aria-checked': String(state.layer === k), onclick: () => { state.layer = state.layer === k ? '' : k; render(); announce(state.layer ? `กรองชั้น${label}` : 'แสดงทุกชั้น'); } },
        h('span', { class: 'glyph-badge' }, sym(k)),
        h('span', { class: 'row-body' }, h('span', { class: 'row-title' }, label), h('span', { class: 'row-sub' }, desc)),
        h('span', { class: 'layer-count' }, count(base, p => p.layer === k)),
        h('span', { class: 'check' }, sym('check'))))));
  }

  // ───────── รายการสถานที่ตามเขต ─────────
  function drawList(list) {
    $('count').textContent = `${list.length} แห่ง`;
    if (!list.length) {
      $('results').replaceChildren(h('ul', { class: 'list' }, h('li', {}, h('div', { class: 'row center secondary' }, state.q ? `ไม่พบ “${state.q}” — ลองสะกดใหม่หรือเลือกทุกชั้น` : 'ไม่มีสถานที่ในตัวกรองนี้'))),
        h('ul', { class: 'list', style: 'margin-top:12px' }, h('li', {}, h('button', { type: 'button', class: 'row tinted center', onclick: reset }, 'ล้างตัวกรอง'))));
      return;
    }
    const groups = [...new Set(list.map(p => p.district))];
    $('results').replaceChildren(...groups.map(d => h('div', { class: 'place-group' },
      h('div', { class: 'list-header' }, `เขต${d} · ${count(list, p => p.district === d)}`),
      h('ul', { class: 'list' }, ...list.filter(p => p.district === d).map(p => h('li', {},
        h('button', { type: 'button', class: `row place-row l-${p.layer}`, 'data-place': p.id, 'aria-haspopup': 'dialog' },
          h('span', { class: 'dot', 'aria-hidden': 'true' }),
          h('span', { class: 'row-body' }, h('span', { class: 'row-title' }, p.name),
            h('span', { class: 'row-sub' }, `${kindLabel(p.kind)}${p.lat == null ? ' · ไม่มีหมุด' : ''}`)),
          h('span', { class: 'chev' }, sym('chev')))))))));
  }

  function render() {
    const list = filtered();
    drawMap(list); drawLayers(); drawList(list);
  }
  function reset() { Object.assign(state, { q: '', layer: '', district: '', selected: null }); $('q').value = ''; render(); }

  // ───────── Sheet (HIG: grabber, ปัดลงเพื่อปิด, ครั้งละ 1 sheet, โฟกัสกลับที่เดิม) ─────────
  const sheet = $('sheet');
  let opener = null;
  function openSheet(title, nodes) {
    opener = document.activeElement;
    const scroll = h('div', { class: 'sheet-scroll' }, nodes);
    const bar = h('div', { class: 'sheet-bar' },
      h('span', {}), h('span', { class: 'sheet-title', id: 'sheet-title' }, title),
      h('button', { type: 'button', class: 'circle-btn', 'aria-label': 'ปิด', onclick: closeSheet }, h('span', {}, sym('xmark'))));
    scroll.addEventListener('scroll', () => bar.classList.toggle('scrolled', scroll.scrollTop > 40));
    sheet.replaceChildren(h('div', { class: 'grabber', 'aria-hidden': 'true' }), bar, scroll);
    if (!sheet.open) sheet.showModal();
    scroll.focus?.();
  }
  function closeSheet() {
    if (!sheet.open) return;
    const done = () => { sheet.classList.remove('closing'); sheet.close(); opener?.focus?.(); };
    if (reduceMotion()) return done();
    sheet.classList.add('closing'); setTimeout(done, 200);
  }
  sheet.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
  // ปัดลงที่ grabber/แถบบนเพื่อปิด (iPhone)
  (() => {
    let y0 = null;
    sheet.addEventListener('pointerdown', e => { if (e.target.closest('.grabber, .sheet-bar') && !e.target.closest('button')) { y0 = e.clientY; sheet.setPointerCapture(e.pointerId); } });
    sheet.addEventListener('pointermove', e => { if (y0 != null) sheet.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`; });
    const end = e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; sheet.style.transform = ''; if (dy > 120) closeSheet(); };
    sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
  })();

  function openPlace(id) {
    const p = D.places.find(x => x.id === id);
    if (!p) return;
    state.selected = id; drawMap(filtered());
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.lat != null ? `${p.name} ${p.lat},${p.lon}` : `${p.name} ${p.district} กรุงเทพมหานคร`);
    const out = (href, label) => h('a', { class: 'row tinted', href, target: '_blank', rel: 'noopener noreferrer' }, h('span', { class: 'row-body value-wrap' }, label), h('span', { class: 'chev' }, sym('out')));
    const info = [['เขต', p.district], ['ที่อยู่', p.address], ['เวลา', p.hours], ['บริการ', p.offer.join(', ')]].filter(([, v]) => v);
    const links = [p.phone && h('a', { class: 'row tinted', href: `tel:${p.phone.replace(/[^\d+]/g, '')}` }, h('span', { class: 'row-body' }, `โทร ${p.phone}`)),
      p.website && out(p.website, p.website.replace(/^https?:\/\/(www\.)?/, '')), ...p.social.map(u => out(u, u.replace(/^https?:\/\/(www\.)?/, '')))].filter(Boolean);
    openSheet(p.name, [
      h('div', { class: `place-head l-${p.layer}` }, h('span', { class: 'glyph-badge lg' }, sym(p.layer)),
        h('div', {}, h('h1', {}, p.name), p.name_en && p.name_en !== p.name ? h('p', { class: 'secondary t-subhead' }, p.name_en) : null,
          h('p', { class: 'secondary t-subhead' }, `${LAYERS[p.layer][0]} · ${kindLabel(p.kind)}`))),
      h('div', { class: 'primary-action' }, h('a', { class: 'get', href: maps, target: '_blank', rel: 'noopener noreferrer' }, 'เส้นทาง ', sym('out'))),
      p.lat == null ? h('p', { class: 'section-foot' }, 'ยังไม่มีพิกัดที่ยืนยันได้ จึงไม่ปักหมุดบนแผนที่') : null,
      h('div', { class: 'list-header' }, 'ข้อมูล'),
      h('ul', { class: 'list' }, ...(info.length ? info : [['ข้อมูล', 'ยังไม่มีรายละเอียดเพิ่มเติม']]).map(([k, v]) => h('li', {}, h('div', { class: 'row' }, h('span', { class: 'row-body' }, k), h('span', { class: 'row-value value-wrap' }, v))))),
      links.length ? h('div', { class: 'list-header' }, 'ติดต่อ') : null,
      links.length ? h('ul', { class: 'list' }, ...links.map(l => h('li', {}, l))) : null,
      h('div', { class: 'list-header' }, 'ที่มาของข้อมูล'),
      h('ul', { class: 'list' }, h('li', {}, out(p.source_url, `${SOURCE[p.source] || 'แหล่งข้อมูล'} · ตรวจเมื่อ ${p.checked || '—'}`))),
      h('p', { class: 'section-foot' }, 'ตรวจเวลาเปิดและรายละเอียดกับเจ้าของก่อนเดินทาง'),
    ]);
  }

  function openProgress() {
    const LABEL = { researched: 'ค้นเว็บแล้ว', osm_only: 'OSM อย่างเดียว', not_started: 'ยังไม่เริ่ม' };
    const waves = [1, 2, 3];
    openSheet('ความคืบหน้า', [
      h('div', { class: 'place-head' }, h('div', {}, h('h1', {}, 'ความคืบหน้ารายเขต'), h('p', { class: 'secondary t-subhead' }, `ค้นเว็บครบ ${researched} จาก 50 เขต`))),
      ...waves.flatMap(w => [
        h('div', { class: 'list-header' }, w === 1 ? 'Wave 1 · แกนกลาง' : w === 2 ? 'Wave 2 · วงใน' : 'Wave 3 · วงนอก'),
        h('ul', { class: 'list' }, ...D.districts.filter(d => d.wave === w).sort((a, b) => (b.osm + b.web + (b.chain || 0)) - (a.osm + a.web + (a.chain || 0))).map(d => h('li', {},
          h('button', { type: 'button', class: 'row', onclick: () => { closeSheet(); state.district = d.name; state.selected = null; render(); $('map').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }); } },
            h('span', { class: 'row-body' }, h('span', { class: 'row-title' }, d.name), h('span', { class: 'row-sub' }, `${LABEL[d.status]} · ช่องว่างที่บันทึก ${d.gaps}`)),
            h('span', { class: 'layer-count' }, `${d.osm + d.web + (d.chain || 0)} แห่ง`),
            h('span', { class: 'chev' }, sym('chev')))))),
      ]),
    ]);
  }

  // ───────── เหตุการณ์ ─────────
  let t = null;
  $('q').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); render(); announce(`${filtered().length} ผลลัพธ์`); }, 150); });
  $('clear-district').addEventListener('click', () => { state.district = ''; state.selected = null; render(); announce('แสดงทั้งกรุงเทพฯ'); });
  $('progress-btn').addEventListener('click', openProgress);
  document.addEventListener('click', e => {
    const pl = e.target.closest('[data-place]');
    if (pl && !sheet.contains(pl)) { openPlace(pl.dataset.place); return; }
    const di = e.target.closest('path[data-district]');
    if (di) { state.district = state.district === di.dataset.district ? '' : di.dataset.district; state.selected = null; render(); announce(state.district ? `เขต${state.district}` : 'ทั้งกรุงเทพฯ'); }
  });
  render();
})();
