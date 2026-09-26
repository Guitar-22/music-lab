(function () {
  'use strict';
  // Music Industry Lap — Journey app ตามรูปแบบ Apple (iOS/iPadOS 26) · เหตุผลการออกแบบ: 30-apple-hig-design-spec.md
  // โครงนำทาง: Tab bar 4 แท็บ → หน้าแบบ push (ปุ่มย้อนกลับ) → Sheet รายละเอียดแอป → Flow สำรวจตัวตนแบบ full-screen modal
  //   #/            เริ่มต้น        #/rooms   ห้อง          #/saved  ที่บันทึกไว้   #/search?q=&cat=  ค้นหา
  //   #/room/<id>   หน้าห้อง       #/you     ตัวตนทางดนตรี  #/discover/<n>[?edit=1]  คำถามข้อ n
  //   <หน้าใดก็ได้>/app/<id>       เปิด sheet รายละเอียดแอปทับหน้านั้น
  const { resources, categories } = window.MILPortal;
  const { details, PLATFORM_LABEL } = window.MILAppDetails;
  const J = window.MILJourney;
  const { icon } = window.MILIcons;
  const $ = id => document.getElementById(id);
  const view = $('view'), sheet = $('sheet'), alertBox = $('alert'), hud = $('hud'), announcer = $('announcer');
  const navbar = $('navbar'), navLeading = $('nav-leading'), navTitle = $('nav-title'), navTrailing = $('nav-trailing'), tabbar = $('tabbar');
  const storeData = () => window.MILAppStore?.items || {};
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────── สถานะในเครื่อง (ไม่ส่งออกนอกเบราว์เซอร์) ─────────
  const KEY = 'mil-journey-v1';
  let state = { answers: {}, saved: [], done: false };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* เริ่มใหม่ */ }
  if (typeof state.done !== 'boolean') state.done = Object.keys(state.answers || {}).length >= J.QUESTIONS.length - 1;
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ใช้ต่อได้ในรอบนี้ */ } };
  const profile = () => (state.done ? J.buildProfile(state.answers) : null);

  // ───────── สัญลักษณ์เส้นแบบ SF Symbols (วาดเอง — SF Symbols ใช้บนเว็บไม่ได้ตามสัญญาอนุญาต) ─────────
  const P = {
    house: 'M3.5 11.5 12 4.5l8.5 7M6 9.8V20h4.5v-5.5h3V20H18V9.8',
    grid: 'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
    bookmark: 'M6.5 3.5h11v17L12 16.6l-5.5 3.9z',
    search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.4 15.4 20 20',
    person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20.5c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5',
    back: 'M15 4.5 7.5 12l7.5 7.5', chev: 'M9.5 5.5 16 12l-6.5 6.5',
    xmark: 'M6.5 6.5l11 11M17.5 6.5l-11 11', check: 'M5 12.8l4.4 4.4L19 7.4',
    alert: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5v5.5M12 16.4v.1',
    share: 'M12 3.5v11M8 7.2l4-3.7 4 3.7M6 10.5v9h12v-9',
    out: 'M8 16 16 8M9.5 8H16v6.5',
    sparkles: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1-5.1-1.9 5.1-1.9zM18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
    note: 'M9 17.5V6.2l10-2.2v11.5M9 17.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 15.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
    ear: 'M4.5 15v-3a7.5 7.5 0 0 1 15 0v3M4.5 14.5h3v5.5h-3zM16.5 14.5h3v5.5h-3z',
    bars: 'M5.5 20v-5M10 20V9.5M14.5 20v-7.5M19 20V5',
    device: 'M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3zM11 18h2',
    tag: 'M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7zM8 8.1v.1',
    book2: 'M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5V20',
    playground: 'M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0',
    practice: 'M8.5 20.5h7l-1.8-15h-3.4zM12 5.5l3.5 9M6.5 20.5h11',
    library: 'M5 4.5h5a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H5zM19 4.5h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5z',
    studio: 'M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5v3M8.5 20.5h7',
    stage: 'M4 20.5h16M6.5 20.5l2-8h7l2 8M9 4l3 8.5L15 4',
    pathway: 'M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z',
  };
  const QUESTION_SYM = { listen: 'ear', instrument: 'note', dream: 'sparkles', level: 'bars', style: 'book2', gear: 'device', budget: 'tag' };
  function sym(name, label) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('class', 'sym');
    if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); } else svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path'); path.setAttribute('d', P[name] || P.sparkles); svg.appendChild(path);
    return svg;
  }

  // ───────── ตัวช่วย DOM ─────────
  function h(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false && kid !== '') node.append(kid.nodeType ? kid : document.createTextNode(kid));
    return node;
  }
  const roomCls = id => `room-${id}`;
  const roomOfRes = r => J.room(J.roomOf(r.id));
  const costShort = r => ({ free: 'ฟรี', freemium: 'ฟรี*', trial: 'ทดลองฟรี', paid: 'ซื้อ', subscription: 'สมาชิก', varies: 'แล้วแต่' })[r.cost] || r.costText;
  const platformsText = d => d.platforms.map(x => PLATFORM_LABEL[x]).join(' · ');

  function toast(text) {
    hud.textContent = text;
    hud.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => hud.classList.remove('show'), 1800);
  }
  function announce(text) { announcer.textContent = ''; setTimeout(() => { announcer.textContent = text; }, 60); }
  // Alert แบบ iOS: ยกเลิกอยู่ซ้าย ปุ่มทำลายข้อมูลเป็นสีแดงอยู่ขวา และโฟกัสเริ่มที่ "ยกเลิก"
  function confirmAlert({ title, message, confirm, destructive = false }) {
    return new Promise(resolve => {
      const done = v => { resolve(v); alertBox.close(); };
      alertBox.replaceChildren(
        h('div', { class: 'alert-body' }, h('h2', { id: 'alert-title' }, title), message ? h('p', { id: 'alert-msg' }, message) : null),
        h('div', { class: 'alert-actions' },
          h('button', { type: 'button', onclick: () => done(false) }, 'ยกเลิก'),
          h('button', { type: 'button', class: destructive ? 'destructive' : null, onclick: () => done(true) }, confirm)));
      alertBox.setAttribute('aria-labelledby', 'alert-title');
      alertBox.setAttribute('aria-describedby', 'alert-msg');
      alertBox.onclose = () => resolve(false);
      alertBox.showModal();
      alertBox.querySelector('button').focus();
    });
  }

  // ───────── แถวรายการ ─────────
  function appRow(r, p, { editing = false, onRemove } = {}) {
    const d = details[r.id];
    const room = roomOfRes(r);
    const f = p ? J.fit(r, p) : null;
    const meta = f && !f.ok ? h('span', { class: 'warn-text' }, f.blockers[0])
      : [f?.ok && f.points >= 10 ? h('span', { class: 'fit-dot' }, 'เหมาะกับคุณ · ') : null, `${costShort(r)} · ${platformsText(d)}`];
    const main = h('button', { class: 'row-main', type: 'button', onclick: () => openApp(r.id) },
      icon(r, d, { size: 60, tone: `var(--${room.id}-strong)` }),
      h('span', { class: 'row-body' },
        h('span', { class: 'row-title clamp-1' }, r.name),
        h('span', { class: 'row-sub clamp-2' }, r.goal),
        h('span', { class: 'row-meta clamp-1' }, meta)));
    const trailing = editing
      ? h('button', { class: 'get', type: 'button', style: 'color:var(--red)', onclick: onRemove, 'aria-label': `นำ ${r.name} ออก` }, 'นำออก')
      : h('a', { class: 'get', href: r.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `เปิด ${r.name} ที่เว็บไซต์ทางการ (แท็บใหม่)` }, 'เปิด', sym('out'));
    return h('li', {}, h('div', { class: `row app-row ${roomCls(room.id)}` }, main, trailing));
  }
  function navRow(href, { badge, title, sub, value, cls = '', onclick, chevron = true, ext = false } = {}) {
    const inner = [badge, h('span', { class: 'row-body' }, h('span', { class: 'row-title' }, title), sub ? h('span', { class: 'row-sub' }, sub) : null),
      value ? h('span', { class: 'row-value' }, value) : null,
      ext ? h('span', { class: 'chev' }, sym('out')) : chevron ? h('span', { class: 'chev' }, sym('chev')) : null];
    if (onclick) return h('li', {}, h('button', { class: `row ${cls}`, type: 'button', onclick }, inner));
    return h('li', {}, h('a', { class: `row ${cls}`, href, ...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {}) }, inner, ext ? h('span', { class: 'sr' }, ' (แท็บใหม่)') : null));
  }
  const badge = (roomId, big = false) => h('span', { class: `glyph-badge${big ? ' lg' : ''} ${roomCls(roomId)}` }, sym(roomId));
  const list = (items, cls = '') => h('ul', { class: `list ${cls}` }, items);
  const section = (title, body, { action, foot } = {}) => h('section', { class: 'section' },
    title ? h('div', { class: 'section-head' }, h('h2', {}, title), action || null) : null, body, foot ? h('p', { class: 'section-foot' }, foot) : null);
  const largeTitle = (text, { eyebrow, trailing } = {}) => h('div', { class: 'large-title-row' },
    h('div', {}, eyebrow ? h('span', { class: 'eyebrow' }, eyebrow) : null, h('h1', { class: 't-large large-title' }, text)), trailing || null);
  function avatarButton() {
    const p = profile();
    const room = p ? J.firstRoom(p) : null;
    return h('a', { class: `avatar${p ? ' has ' + roomCls(room) : ''}`, href: '#/you', 'aria-label': p ? `ตัวตนทางดนตรี: ${J.ARCHETYPES[p.archetype].name}` : 'ตัวตนทางดนตรี (ยังไม่ได้สำรวจ)' }, sym('person'));
  }

  // ───────── หน้า: เริ่มต้น ─────────
  function pageHome() {
    const p = profile();
    const date = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    const a = p && J.ARCHETYPES[p.archetype];
    const story = h('a', { class: `card story${p ? ' returning' : ''}`, href: p ? '#/you' : '#/discover/1' },
      h('div', {}, h('span', { class: 'kicker' }, p ? 'ตัวตนทางดนตรีของคุณ' : 'เริ่มที่นี่'), h('h2', {}, p ? `คุณคือ${a.name}` : 'ดนตรีแบบไหนที่เป็นคุณ')),
      h('span', { class: 'art' }, sym(p ? J.firstRoom(p) : 'sparkles')),
      h('div', { class: 'foot' },
        h('div', {}, h('b', {}, p ? 'ดูเส้นทางและคำแนะนำ' : 'สำรวจตัวตนทางดนตรี'), h('span', { class: 't-footnote' }, p ? `เริ่มที่${J.room(J.firstRoom(p)).name}` : `${J.QUESTIONS.length} คำถาม · ประมาณ 2 นาที · ข้ามได้ทุกข้อ`)),
        h('span', { class: 'get', 'aria-hidden': 'true' }, p ? 'ดู' : 'เริ่ม')));
    const nodes = [largeTitle('เริ่มต้น', { eyebrow: date, trailing: avatarButton() }), story];
    if (p) {
      nodes.push(section('แนะนำสำหรับคุณ', list(J.recommend(p).map(x => appRow(x.resource, p)), 'apps')));
      nodes.push(section('เส้นทางของคุณ', list(J.route(p).map((id, i) => navRow(`#/room/${id}`, { badge: h('span', { class: `num ${roomCls(id)}` }, String(i + 1)), title: J.room(id).name, sub: J.room(id).question })), 'icon-inset'),
        { foot: 'ห้องแรกเริ่มได้วันนี้ · ห้องที่สองต่อยอดสิ่งที่คุณชอบ · ห้องสุดท้ายคือการตัดสินใจเรื่องครูหรือเรียนต่อ' }));
    }
    nodes.push(section('ห้อง', roomTiles(p), { action: h('a', { class: 'see-all', href: '#/rooms' }, 'ดูทั้งหมด') }));
    nodes.push(h('p', { class: 'foot-note' }, 'ข้อมูลแอปสรุปโดยทีมจากหน้าเจ้าของและร้านแอป · คำตอบและรายการที่บันทึกเก็บในอุปกรณ์นี้เท่านั้น'));
    return { title: 'เริ่มต้น', tab: 'home', nodes };
  }
  function roomTiles(p) {
    const mine = p ? J.firstRoom(p) : null;
    return h('div', { class: 'tiles' }, J.ROOMS.map(r => h('a', { class: `tile ${roomCls(r.id)}`, href: `#/room/${r.id}`, 'aria-label': `${r.name}${r.id === mine ? ' (ห้องแรกของคุณ)' : ''}, ${J.members(r.id).length} รายการ` },
      r.id === mine ? h('span', { class: 'mine', 'aria-hidden': 'true' }, 'ห้องแรกของคุณ') : null,
      h('span', { class: 't-glyph' }, sym(r.id)),
      h('span', {}, h('b', {}, r.name), h('small', {}, `${J.members(r.id).length} รายการ`)))));
  }

  // ───────── หน้า: ห้องทั้งหมด ─────────
  function pageRooms() {
    const p = profile();
    return { title: 'ห้อง', tab: 'rooms', nodes: [
      largeTitle('ห้อง', { trailing: avatarButton() }),
      h('p', { class: 'secondary', style: 'padding:0 4px 16px' }, 'แต่ละห้องคือวิธีหนึ่งในการอยู่กับดนตรี และมีประตูเชื่อมไปห้องถัดไปเสมอ'),
      roomTiles(p),
      p ? null : section(null, list([navRow('#/discover/1', { badge: h('span', { class: 'glyph-badge' }, sym('sparkles')), title: 'ไม่แน่ใจว่าจะเริ่มห้องไหน', sub: 'สำรวจตัวตนทางดนตรี · 2 นาที' })], 'icon-inset')),
      section('ทุกห้อง', list(J.ROOMS.map(r => navRow(`#/room/${r.id}`, { badge: badge(r.id), title: r.name, sub: r.question, value: String(J.members(r.id).length) })), 'icon-inset')),
    ] };
  }

  // ───────── หน้า: ห้อง ─────────
  let roomFilter = 'fit';
  function pageRoom(id) {
    const room = J.room(id);
    if (!room) return null;
    const p = profile();
    const members = J.members(id);
    const fits = p ? Object.fromEntries(members.map(r => [r.id, J.fit(r, p)])) : {};
    const sorted = p ? members.slice().sort((a, b) => (fits[b.id].ok - fits[a.id].ok) || fits[b.id].points - fits[a.id].points) : members;
    const listEl = h('ul', { class: 'list apps' });
    const foot = h('p', { class: 'section-foot' });
    const paint = () => {
      const rows = p && roomFilter === 'fit' ? sorted.filter(r => fits[r.id].ok) : sorted;
      listEl.replaceChildren(...rows.map(r => appRow(r, p)));
      const hidden = sorted.length - rows.length;
      foot.textContent = hidden ? `ซ่อน ${hidden} รายการที่ใช้กับอุปกรณ์ งบ หรือเครื่องดนตรีของคุณไม่ได้ — เลือก “ทั้งหมด” เพื่อดู` : p ? 'เรียงตามความเหมาะกับตัวตนของคุณ' : 'สำรวจตัวตนเพื่อให้เรียงตามความเหมาะกับคุณ';
      if (!rows.length) listEl.replaceChildren(h('li', {}, h('div', { class: 'row center secondary' }, 'ยังไม่มีรายการที่ใช้ได้กับอุปกรณ์ของคุณในห้องนี้')));
    };
    let seg = null;
    if (p) {
      seg = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'ตัวกรองรายการ' }, [['fit', 'แนะนำ'], ['all', 'ทั้งหมด']].map(([k, label]) => h('button', {
        type: 'button', role: 'radio', 'aria-checked': String(roomFilter === k),
        onclick: e => { roomFilter = k; for (const b of seg.children) b.setAttribute('aria-checked', String(b === e.currentTarget)); paint(); },
      }, label)));
    }
    paint();
    const first = p && J.firstRoom(p) === id;
    const next = list(room.doors.map(([to, why]) => navRow(`#/room/${to}`, { badge: badge(to), title: J.room(to).name, sub: why })), 'icon-inset');
    const links = room.links ? section('ข้อมูลเพิ่มเติม', list(room.links.map(([label, href]) => navRow(href, { title: label, sub: href === 'institutions.html' ? 'มหาวิทยาลัยและโรงเรียนดนตรีพร้อมแหล่งต้นทาง' : 'แผนที่สถานที่ดนตรีรายเขต' })))) : null;
    return { title: room.name, back: true, nodes: [
      h('div', { class: `room-head ${roomCls(id)}` }, badge(id, true), h('div', {}, h('h1', { class: 't-large large-title', style: 'font-size:1.647rem' }, room.name), h('p', { class: 't-subhead' }, first ? `ห้องแรกของ${J.ARCHETYPES[p.archetype].name}` : `“${room.question}”`))),
      h('p', { class: 'room-promise t-callout' }, room.promise),
      seg,
      h('section', { class: 'section', style: seg ? 'margin-top:8px' : null }, listEl, foot),
      section('ไปต่อจากห้องนี้', next, { foot: 'เลือกตามสิ่งที่คุณรู้สึกหลังได้ลองในห้องนี้' }),
      links,
    ] };
  }

  // ───────── หน้า: ค้นหา ─────────
  const norm = s => (s || '').toLowerCase().normalize('NFC');
  function matches(r, q) {
    const d = details[r.id];
    const hay = norm([r.name, r.owner, r.goal, r.note, d.about, d.features.join(' '), platformsText(d), categories.find(([c]) => c === r.category)?.[1]].join(' '));
    return norm(q).split(/\s+/).filter(Boolean).every(t => hay.includes(t));
  }
  function pageSearch(query) {
    const p = profile();
    const params = new URLSearchParams(query);
    let q = params.get('q') || '';
    let cat = params.get('cat') || '';
    const catLabel = () => categories.find(([c]) => c === cat)?.[1];
    const results = h('div');
    const input = h('input', { type: 'search', placeholder: 'แอป งาน หรือเครื่องดนตรี', 'aria-label': 'ค้นหาแอปและแหล่งเรียน', enterkeyhint: 'search', autocomplete: 'off' });
    input.value = q;
    const clear = h('button', { class: 'clear-btn', type: 'button', 'aria-label': 'ล้างคำค้น', hidden: !q }, sym('xmark'));
    const sync = () => { const s = new URLSearchParams({ ...(q ? { q } : {}), ...(cat ? { cat } : {}) }).toString(); history.replaceState(null, '', `#/search${s ? '?' + s : ''}`); };
    const paint = () => {
      clear.hidden = !q;
      if (!q && !cat) {
        results.replaceChildren(
          section('หมวด', list(categories.filter(([c]) => c !== 'all').map(([c, label]) => navRow('', { title: label, value: String(resources.filter(r => r.category === c).length), onclick: () => { cat = c; sync(); paint(); } })))),
          section('ห้อง', list(J.ROOMS.map(r => navRow(`#/room/${r.id}`, { badge: badge(r.id), title: r.name })), 'icon-inset')));
        return;
      }
      const rows = resources.filter(r => (!cat || r.category === cat) && (!q || matches(r, q)));
      const chips = cat ? h('div', { class: 'chip-row' }, h('button', { class: 'chip', type: 'button', 'aria-label': `นำตัวกรองหมวด ${catLabel()} ออก`, onclick: () => { cat = ''; sync(); paint(); } }, `หมวด: ${catLabel()}`, sym('xmark'))) : null;
      if (!rows.length) {
        results.replaceChildren(...[chips, h('div', { class: 'empty' }, h('span', { class: 'big' }, sym('search')), h('h2', { class: 't-title2' }, q ? `ไม่พบ “${q}”` : 'ไม่มีรายการในหมวดนี้'),
          h('p', {}, 'ลองสะกดใหม่ ใช้คำที่สั้นลง หรือค้นด้วยงานที่อยากทำ เช่น “จูน” “อัดเสียง” “โน้ต”'),
          h('a', { class: 'btn-gray', href: '#/rooms' }, 'ดูตามห้อง'))].filter(Boolean));
        announce('ไม่พบผลลัพธ์');
        return;
      }
      results.replaceChildren(...[chips, h('p', { class: 'list-header' }, `${rows.length} รายการ`), list(rows.map(r => appRow(r, p)), 'apps')].filter(Boolean));
      announce(`พบ ${rows.length} รายการ`);
    };
    input.addEventListener('input', () => { q = input.value.trim(); sync(); paint(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
    clear.addEventListener('click', () => { q = ''; input.value = ''; sync(); paint(); input.focus(); });
    paint();
    return { title: 'ค้นหา', tab: 'search', nodes: [
      largeTitle('ค้นหา'),
      h('div', { class: 'search', role: 'search' }, h('label', { class: 'search-field' }, sym('search'), input, clear)),
      results,
    ] };
  }

  // ───────── หน้า: ที่บันทึกไว้ ─────────
  let editing = false;
  function pageSaved() {
    const p = profile();
    const items = state.saved.map(id => resources.find(r => r.id === id)).filter(Boolean);
    if (!items.length) editing = false;
    const trailing = items.length ? h('button', { class: `bar-btn${editing ? ' strong' : ''}`, type: 'button', onclick: () => { editing = !editing; rerender(); } }, editing ? 'เสร็จสิ้น' : 'แก้ไข') : null;
    const body = items.length
      ? section(null, list(items.map(r => appRow(r, p, { editing, onRemove: () => { state.saved = state.saved.filter(x => x !== r.id); persist(); toast(`นำ ${r.name} ออกแล้ว`); rerender(); } })), 'apps'),
        { foot: 'รายการนี้เก็บในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น' })
      : h('div', { class: 'empty' }, h('span', { class: 'big' }, sym('bookmark')), h('h2', { class: 't-title2' }, 'ยังไม่มีรายการที่บันทึก'),
        h('p', {}, 'แตะปุ่มบันทึกในหน้ารายละเอียดของแอป เพื่อเก็บไว้เปรียบเทียบและกลับมาดูภายหลัง'),
        h('a', { class: 'btn-gray', href: '#/rooms' }, 'สำรวจห้อง'));
    return { title: 'ที่บันทึกไว้', tab: 'saved', trailing, nodes: [largeTitle('ที่บันทึกไว้'), body] };
  }

  // ───────── หน้า: ตัวตนทางดนตรี ─────────
  function pageYou(query) {
    const p = profile();
    const fresh = new URLSearchParams(query).get('new') === '1';
    if (!p) return { title: 'ตัวตนทางดนตรี', back: true, nodes: [h('div', { class: 'empty' }, h('span', { class: 'big' }, sym('person')), h('h1', { class: 't-title2 large-title' }, 'ยังไม่ได้สำรวจตัวตน'),
      h('p', {}, `ตอบ ${J.QUESTIONS.length} คำถามสั้นๆ เพื่อรู้ว่าคุณเหมาะกับห้องไหนและควรเริ่มด้วยอะไร`), h('a', { class: 'btn-prominent', href: '#/discover/1', style: 'width:auto' }, 'เริ่มสำรวจ'))] };
    const a = J.ARCHETYPES[p.archetype];
    const first = J.firstRoom(p);
    const max = Math.max(...Object.values(p.score), 1);
    const answerRows = J.QUESTIONS.map((q, i) => {
      const picked = [].concat(state.answers[q.id] || []).map(id => q.options.find(o => o.id === id)?.label).filter(Boolean);
      return navRow(`#/discover/${i + 1}?edit=1`, { title: q.title, sub: picked.length ? picked.join(', ') : 'ข้ามไว้' });
    });
    const clearAll = async () => {
      const ok = await confirmAlert({ title: 'ล้างข้อมูลในอุปกรณ์นี้?', message: 'คำตอบ ตัวตนทางดนตรี และรายการที่บันทึกไว้จะถูกลบ และเรียกคืนไม่ได้', confirm: 'ล้างข้อมูล', destructive: true });
      if (!ok) return;
      state = { answers: {}, saved: [], done: false };
      persist();
      toast('ล้างข้อมูลแล้ว');
      go('#/', { replace: true });
    };
    return { title: a.name, back: !fresh, trailing: fresh ? h('a', { class: 'bar-btn strong', href: '#/' }, 'เสร็จสิ้น') : null, nodes: [
      h('div', { class: `identity ${roomCls(first)}` }, h('div', { class: 'orb' }, sym(first)), h('p', { class: 'kicker' }, 'ตัวตนทางดนตรีของคุณ'), h('h1', { class: 'large-title' }, a.name), h('p', {}, a.line)),
      section('จุดเด่น', list([...a.strengths, ...(p.secondary ? [`มีมุม${J.ARCHETYPES[p.secondary].name}ด้วย`] : [])].map(s => h('li', {}, h('div', { class: 'row' }, h('span', { class: 'check', style: 'visibility:visible' }, sym('check')), s))))),
      section('ส่วนผสมในตัวคุณ', list(Object.entries(p.score).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).map(([k, v]) => h('li', {}, h('div', { class: 'row bar-row', role: 'img', 'aria-label': `${J.ARCHETYPES[k].name} ${v} คะแนน` },
        h('span', { class: 't-subhead' }, J.ARCHETYPES[k].name), h('span', { class: 'bar-track' }, h('i', { style: `width:${Math.round((v / max) * 100)}%` })), h('span', { class: 't-subhead secondary' }, String(v))))))),
      section('เส้นทางที่แนะนำ', list(J.route(p).map((id, i) => navRow(`#/room/${id}`, { badge: h('span', { class: `num ${roomCls(id)}` }, String(i + 1)), title: J.room(id).name, sub: J.room(id).promise })), 'icon-inset')),
      section('เริ่มวันนี้', list(J.recommend(p).map(x => appRow(x.resource, p)), 'apps'), { foot: 'คัดจากแหล่งที่ใช้ได้บนอุปกรณ์และอยู่ในงบของคุณ' }),
      section('คำตอบของคุณ', list(answerRows), { foot: 'แตะเพื่อแก้คำตอบทีละข้อ ผลลัพธ์จะปรับตามทันที' }),
      section(null, list([navRow('#/discover/1', { title: 'ทำแบบสำรวจอีกครั้ง', cls: 'tinted center', chevron: false })])),
      section(null, list([navRow('', { title: 'ล้างข้อมูลในอุปกรณ์นี้', cls: 'destructive', chevron: false, onclick: clearAll })])),
    ] };
  }

  // ───────── Flow สำรวจตัวตน (full-screen modal, ใช้ประวัติเบราว์เซอร์รายการเดียว) ─────────
  let flowReturn = '#/';
  let flowPushed = false;
  function renderFlow(n, query) {
    const edit = new URLSearchParams(query).get('edit') === '1';
    const q = J.QUESTIONS[n - 1];
    if (!q) return go('#/you?new=1', { replace: true });
    const picked = new Set([].concat(state.answers[q.id] || []));
    const last = n === J.QUESTIONS.length;
    const step = to => go(`#/discover/${to}`, { replace: true });
    const leave = () => {
      document.body.classList.remove('modal-flow');
      if (flowPushed) { forceBack = true; history.back(); } else go(edit ? '#/you' : flowReturn, { replace: true, back: true });
    };
    const finish = () => {
      if (edit) return leave();
      if (last) { state.done = true; persist(); return go('#/you?new=1', { replace: true }); }
      step(n + 1);
    };
    const primary = h('button', { class: 'btn-prominent', type: 'button', onclick: finish, disabled: !q.multi && !picked.size }, edit ? 'บันทึก' : last ? 'ดูผลลัพธ์' : 'ดำเนินการต่อ');
    const optionsEl = h('div', { class: 'list', role: q.multi ? 'group' : 'radiogroup', 'aria-labelledby': 'flow-q' });
    optionsEl.append(...q.options.map(o => h('button', {
      class: 'row', type: 'button', role: q.multi ? 'checkbox' : 'radio', 'aria-checked': String(picked.has(o.id)),
      onclick: e => {
        if (q.multi) { picked.has(o.id) ? picked.delete(o.id) : picked.add(o.id); state.answers[q.id] = [...picked]; e.currentTarget.setAttribute('aria-checked', String(picked.has(o.id))); }
        else { picked.clear(); picked.add(o.id); state.answers[q.id] = o.id; for (const b of optionsEl.querySelectorAll('.row')) b.setAttribute('aria-checked', String(b === e.currentTarget)); primary.disabled = false; }
        persist();
      },
    }, h('span', { class: 'row-body' }, o.label), h('span', { class: 'check' }, sym('check')))));
    const leading = n === 1 || edit
      ? h('button', { class: 'bar-btn', type: 'button', onclick: leave }, 'ยกเลิก')
      : h('button', { class: 'bar-btn icon', type: 'button', 'aria-label': 'คำถามก่อนหน้า', onclick: () => step(n - 1) }, sym('back'));
    const skip = edit ? h('span') : h('button', { class: 'bar-btn', type: 'button', onclick: () => { if (!q.multi) delete state.answers[q.id]; persist(); last ? finish() : step(n + 1); } }, 'ข้าม');
    document.body.classList.add('modal-flow');
    document.title = `คำถาม ${n} จาก ${J.QUESTIONS.length} · Music Industry Lap`;
    view.className = 'flow-host';
    view.replaceChildren(h('div', { class: 'flow', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'flow-q' },
      h('div', { class: 'flow-bar' }, h('div', { class: 'nav-leading' }, leading), h('span', { class: 'count' }, edit ? 'แก้คำตอบ' : `${n} จาก ${J.QUESTIONS.length}`), h('div', { class: 'nav-trailing' }, skip)),
      edit ? null : h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(J.QUESTIONS.length), 'aria-valuenow': String(n), 'aria-label': 'ความคืบหน้า' }, h('i', { style: `width:${(n / J.QUESTIONS.length) * 100}%` })),
      h('div', { class: 'flow-body view-enter' }, h('span', { class: 'glyph-badge lg' }, sym(QUESTION_SYM[q.id])),
        h('h1', { id: 'flow-q', tabindex: '-1' }, q.title), h('p', { class: 'hint' }, q.hint || (q.multi ? 'เลือกได้หลายข้อ' : 'เลือกหนึ่งข้อ')), optionsEl),
      h('div', { class: 'flow-foot' }, h('div', { class: 'inner' }, primary))));
    window.scrollTo(0, 0);
    view.querySelector('#flow-q').focus({ preventScroll: true });
    renderFlow.escape = leave;
  }

  // ───────── Sheet รายละเอียดแอป (แบบหน้าแอปใน App Store) ─────────
  let opener = null;
  // เปิด sheet ทับหน้าเดิม โดยคงคำค้น/พารามิเตอร์ของหน้านั้นไว้ใน URL
  function openApp(id) { const q = location.hash.split('?')[1]; go(`${current.base === '#/' ? '#' : current.base}/app/${id}${q ? '?' + q : ''}`); }
  function sheetContent(r) {
    const d = details[r.id];
    const room = roomOfRes(r);
    const p = profile();
    const f = p ? J.fit(r, p) : null;
    const official = storeData()[r.id];
    const officialText = official?.description || official?.web?.description;
    const ico = icon(r, d, { size: 118, tone: `var(--${room.id}-strong)` });
    const iconFrom = h('span', {}, ico.dataset.iconFrom);
    ico.addEventListener('iconsource', e => { iconFrom.textContent = e.detail; });
    const saved = () => state.saved.includes(r.id);
    const saveBtn = h('button', { class: 'icon-toggle', type: 'button', 'aria-pressed': String(saved()), 'aria-label': 'บันทึก' }, h('span', {}, sym('bookmark')));
    saveBtn.addEventListener('click', () => {
      state.saved = saved() ? state.saved.filter(x => x !== r.id) : [...state.saved, r.id];
      persist();
      saveBtn.setAttribute('aria-pressed', String(saved()));
      toast(saved() ? 'บันทึกแล้ว' : 'นำออกจากที่บันทึกแล้ว');
      current.dirty = true;
    });
    const about = h('p', { class: 'clamp-3', id: 'about' }, d.about);
    const more = h('button', { class: 'more', type: 'button', 'aria-controls': 'about', 'aria-expanded': 'false', onclick: () => { about.classList.remove('clamp-3'); more.remove(); } }, 'เพิ่มเติม');
    const infoRows = [['ผู้พัฒนา', r.owner], ['หมวด', categories.find(([c]) => c === r.category)?.[1]], ['ห้อง', room.name], ['ใช้บน', platformsText(d)], ['ภาษา', r.language], ['บัญชี', r.account], ['ราคา', d.pricing], ['ระดับ', d.level], ['ตรวจล่าสุด', r.checked]];
    const share = async () => {
      const url = location.href;
      try { if (navigator.share) { await navigator.share({ title: r.name, text: r.goal, url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แล้ว'); } catch { toast('คัดลอกลิงก์ไม่ได้ — คัดลอกจากแถบที่อยู่แทน'); }
    };
    const bar = h('div', { class: 'sheet-bar' },
      h('button', { class: 'circle-btn', type: 'button', 'aria-label': 'แชร์', onclick: share }, h('span', {}, sym('share'))),
      h('span', { class: 'sheet-title', 'aria-hidden': 'true' }, r.name),
      h('button', { class: 'circle-btn', type: 'button', 'aria-label': 'ปิด', onclick: requestCloseSheet }, h('span', {}, sym('xmark'))));
    const strip = [
      ['ราคา', costShort(r), r.costText.split(/[;；]/)[0]],
      ['ระดับ', d.level.split(/[–/]/)[0], d.level.includes('–') ? `ถึง${d.level.split('–')[1]}` : ' '],
      ['อุปกรณ์', String(d.platforms.length), d.platforms.map(x => PLATFORM_LABEL[x]).slice(0, 2).join(', ') + (d.platforms.length > 2 ? '…' : '')],
      ['ภาษา', r.thai ? 'ไทย' : 'EN', r.language],
      ['ห้อง', sym(room.id), room.name],
      ['ผู้พัฒนา', sym('person'), r.owner],
    ];
    const scroll = h('div', { class: 'sheet-scroll' },
      h('div', { class: 'product' }, ico, h('div', { class: 'meta' },
        h('h1', { id: 'sheet-title', tabindex: '-1' }, r.name), h('span', { class: 'secondary t-subhead' }, r.owner), h('span', { class: 'secondary t-footnote' }, r.goal),
        h('div', { class: 'actions' }, h('a', { class: 'get', href: r.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `เปิด ${r.name} ที่เว็บไซต์ทางการ (แท็บใหม่)` }, 'เปิด', sym('out')), saveBtn))),
      h('div', { class: 'info-strip', role: 'list', 'aria-label': 'ข้อมูลสรุป (เลื่อนแนวนอนได้)', tabindex: '0' }, strip.map(([k, v, s]) => h('div', { role: 'listitem' }, h('small', {}, k), h('b', {}, v), h('span', { class: 'clamp-2' }, s)))),
      f ? h('section', { class: `for-you${f.ok ? '' : ' no'}` }, h('h2', {}, f.ok ? `ทำไมเหมาะกับ${J.ARCHETYPES[p.archetype].name}` : 'ข้อควรรู้สำหรับคุณ'),
        h('ul', {}, (f.ok ? f.reasons : f.blockers).map(x => h('li', {}, sym(f.ok ? 'check' : 'alert'), h('span', {}, x))))) : null,
      h('div', { class: 'prose' },
        h('h2', {}, 'คืออะไร'), about, more,
        h('h2', {}, 'ทำอะไรได้บ้าง'), h('ul', {}, d.features.map(x => h('li', {}, x))),
        h('h2', {}, 'เริ่มใช้ครั้งแรก'), h('ol', {}, (r.guide?.steps || [r.first]).map(x => h('li', {}, x))),
        h('h2', {}, 'ข้อจำกัดที่ควรรู้'), h('p', {}, d.limits), r.note ? h('p', { class: 'secondary', style: 'margin-top:6px' }, r.note) : null,
        officialText ? [
          h('h2', {}, official.kind === 'app-store' ? 'ข้อความจากผู้พัฒนา' : 'ข้อความจากเว็บไซต์เจ้าของ'),
          h('p', { class: 'secondary t-footnote', style: 'margin-bottom:8px' }, [official.kind === 'app-store' ? 'App Store' : 'เว็บไซต์', official.version && `เวอร์ชัน ${official.version}`, official.rating && `★ ${official.rating.toFixed(1)} (${official.ratingCount?.toLocaleString('th-TH')})`, `ดึงเมื่อ ${official.checked}`].filter(Boolean).join(' · ')),
          h('p', { class: 'official', lang: 'en' }, officialText)] : null),
      section('ข้อมูล', list(infoRows.filter(([, v]) => v).map(([k, v]) => h('li', {}, h('div', { class: 'row' }, h('span', { class: 'row-body' }, k), h('span', { class: 'row-value' }, v)))))),
      section(null, list([
        navRow(r.url, { title: 'เปิดเว็บไซต์ทางการ', ext: true, cls: 'tinted' }),
        ...(r.alternates || []).map(a => navRow(a.url, { title: a.name, ext: true, cls: 'tinted' })),
        navRow(r.source, { title: 'แหล่งข้อมูลที่ใช้ตรวจ', sub: r.sourceType, ext: true }),
      ]), { foot: h('span', {}, 'ไอคอน: ', iconFrom) }));
    scroll.addEventListener('scroll', () => bar.classList.toggle('scrolled', scroll.scrollTop > 60), { passive: true });
    return [h('div', { class: 'grabber', 'aria-hidden': 'true' }), bar, scroll];
  }
  function showSheet(id) {
    const r = resources.find(x => x.id === id);
    if (!r) return;
    if (!sheet.open) opener = document.activeElement;
    sheet.classList.remove('closing');
    sheet.style.transform = '';
    sheet.setAttribute('aria-labelledby', 'sheet-title');
    sheet.replaceChildren(...sheetContent(r));
    if (!sheet.open) sheet.showModal();
    sheet.querySelector('#sheet-title').focus({ preventScroll: true });
    document.title = `${r.name} · Music Industry Lap`;
  }
  function hideSheet() {
    if (!sheet.open || sheet.classList.contains('closing')) return;
    const finish = () => {
      sheet.classList.remove('closing'); sheet.style.transform = '';
      if (sheet.open) sheet.close();
      document.title = `${current.title} · Music Industry Lap`;
      if (current.dirty) { current.dirty = false; if (current.base === '#/saved' || current.base === '#/you' || current.base === '#/') rerender(); }
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
    if (reduceMotion()) return finish();
    sheet.classList.add('closing');
    sheet.addEventListener('animationend', finish, { once: true });
    setTimeout(() => { if (sheet.classList.contains('closing')) finish(); }, 400); // กันกรณี animationend ไม่มา
  }
  function requestCloseSheet() {
    if (sheetPushed) history.back(); else { history.replaceState(null, '', current.base + (current.query ? '?' + current.query : '')); hideSheet(); }
  }
  sheet.addEventListener('cancel', e => { e.preventDefault(); requestCloseSheet(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) requestCloseSheet(); });
  // ปัดลงเพื่อปิด (จับที่ grabber หรือแถบบนของ sheet) — บน iPhone
  (() => {
    let startY = null, lastY = 0, lastT = 0, v = 0;
    sheet.addEventListener('pointerdown', e => {
      if (innerWidth >= 700 || !e.target.closest('.grabber, .sheet-bar') || e.target.closest('button')) return;
      startY = e.clientY; lastY = e.clientY; lastT = e.timeStamp; v = 0; sheet.setPointerCapture(e.pointerId); sheet.style.transition = 'none';
    });
    sheet.addEventListener('pointermove', e => {
      if (startY == null) return;
      v = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT); lastY = e.clientY; lastT = e.timeStamp;
      sheet.style.transform = `translateY(${Math.max(0, e.clientY - startY)}px)`;
    });
    const end = e => {
      if (startY == null) return;
      const dy = e.clientY - startY; startY = null; sheet.style.transition = 'transform .25s ease';
      if (dy > 120 || v > .6) requestCloseSheet(); else sheet.style.transform = '';
      setTimeout(() => { sheet.style.transition = ''; }, 260);
    };
    sheet.addEventListener('pointerup', end); sheet.addEventListener('pointercancel', end);
  })();

  // ───────── การนำทาง ─────────
  const TABS = [['home', 'เริ่มต้น', 'house', '#/'], ['rooms', 'ห้อง', 'grid', '#/rooms'], ['saved', 'บันทึก', 'bookmark', '#/saved'], ['search', 'ค้นหา', 'search', '#/search']];
  const ROOTS = new Set(TABS.map(t => t[3]));
  const PARENT = { room: '#/rooms', you: '#/' };
  let current = { base: null, title: '', tab: 'home' };
  let stack = [];
  let sheetPushed = false;
  let replacing = false;
  let forceBack = false;

  function parse(hash) {
    const [path, query = ''] = (hash || '#/').replace(/^#/, '').split('?');
    const parts = path.split('/').filter(Boolean);
    const k = parts.indexOf('app');
    const appId = k >= 0 ? parts[k + 1] : null;
    const baseParts = k >= 0 ? parts.slice(0, k) : parts;
    return { base: '#/' + baseParts.join('/'), parts: baseParts, appId, query };
  }
  function go(hash, { replace = false, back = false } = {}) {
    forceBack = back;
    if (replace) { replacing = true; history.replaceState(null, '', hash); route(); replacing = false; }
    else if (location.hash === hash) route(); else location.hash = hash;
  }
  function renderTabbar(active) {
    tabbar.replaceChildren(...TABS.map(([id, label, s, href]) => h('a', {
      class: 'tab', href, 'aria-current': id === active ? 'page' : null,
      // แตะแท็บที่อยู่แล้ว = เลื่อนกลับบนสุด (พฤติกรรมเดียวกับ iOS)
      onclick: e => { if (id === active && current.base === href) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); } },
    }, sym(s), h('span', {}, label))));
  }
  let titleObserver = null;
  function mount(page, { back = false } = {}) {
    document.body.classList.remove('modal-flow');
    view.className = 'content';
    current = { ...current, title: page.title, tab: page.tab || current.tab };
    document.title = `${page.title} · Music Industry Lap`;
    navTitle.textContent = page.title;
    const parent = PARENT[current.base.split('/')[1]] || '#/';
    navLeading.replaceChildren(...(page.back ? [h('button', { class: 'bar-btn icon', type: 'button', 'aria-label': 'ย้อนกลับ', onclick: () => (stack.length > 1 ? history.back() : go(parent, { back: true })) }, sym('back'))] : []));
    navTrailing.replaceChildren(...(page.trailing ? [page.trailing] : []));
    view.replaceChildren(h('div', { class: `view-enter${back ? ' back' : ''}` }, page.nodes));
    renderTabbar(current.tab);
    navbar.classList.remove('scrolled');
    titleObserver?.disconnect();
    const lt = view.querySelector('.large-title');
    if (lt && 'IntersectionObserver' in window) {
      titleObserver = new IntersectionObserver(([en]) => navbar.classList.toggle('scrolled', !en.isIntersecting), { rootMargin: `-${navbar.offsetHeight}px 0px 0px 0px` });
      titleObserver.observe(lt);
    } else navbar.classList.add('scrolled');
  }
  function build(r) {
    const [p0, p1] = r.parts;
    if (!p0) return pageHome();
    if (p0 === 'rooms') return pageRooms();
    if (p0 === 'room') return pageRoom(p1);
    if (p0 === 'search') return pageSearch(r.query);
    if (p0 === 'saved') return pageSaved();
    if (p0 === 'you') return pageYou(r.query);
    return null;
  }
  function rerender() { const y = scrollY; const page = build(parse(location.hash)); if (page) { mount(page); window.scrollTo(0, y); } }
  function route() {
    const r = parse(location.hash);
    if (r.parts[0] === 'discover') {
      if (sheet.open) { sheet.close(); sheetPushed = false; }
      if (!document.body.classList.contains('modal-flow')) { flowPushed = !replacing && current.base != null; if (current.base) flowReturn = current.base; }
      current = { ...current, base: r.base };
      return renderFlow(Math.max(1, parseInt(r.parts[1], 10) || 1), r.query);
    }
    // เปลี่ยนเฉพาะ sheet บนหน้าเดิม: ไม่วาดหน้าใหม่ (คงตำแหน่งเลื่อนและสิ่งที่พิมพ์ไว้)
    // หน้าค้นหาเปลี่ยน query ด้วย replaceState เอง จึงถือเป็นหน้าเดิม; หน้าอื่นถ้า query ต่าง (#/you → #/you?new=1) ต้องวาดใหม่
    const sameView = r.base === current.base && (r.parts[0] === 'search' || r.query === (current.query || ''));
    if (sameView && !document.body.classList.contains('modal-flow') && view.firstChild) {
      if (r.appId) { if (!sheet.open) sheetPushed = !replacing; showSheet(r.appId); } else { sheetPushed = false; hideSheet(); }
      return;
    }
    let back = forceBack; forceBack = false;
    if (stack[stack.length - 1] === r.base) { /* กลับมาหน้าเดิมจาก flow */ }
    else if (stack.length > 1 && stack[stack.length - 2] === r.base) { back = true; stack.pop(); }
    else if (ROOTS.has(r.base)) stack = [r.base];
    else if (replacing && stack.length) stack[stack.length - 1] = r.base;
    else stack.push(r.base);
    const page = build(r);
    if (!page) return go('#/', { replace: true });
    if (sheet.open) sheet.close();
    current.base = r.base;
    current.query = r.query;
    if (r.parts[0] === 'room') current.tab = 'rooms';
    else if (r.parts[0] === 'you') current.tab = current.tab || 'home';
    mount(page, { back });
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
    announce(page.title);
    sheetPushed = false;
    if (r.appId) showSheet(r.appId);
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('modal-flow') && !alertBox.open) renderFlow.escape?.();
  });
  if (!location.hash) history.replaceState(null, '', '#/');
  route();
})();
