(function () {
  'use strict';
  // Journey Gate: #/ ประตู → #/discover/<n> สำรวจตัวตน → #/you ผลลัพธ์ → #/room/<id> ห้อง → #/room/<id>/<app> รายละเอียด
  const { resources, categories } = window.MILPortal;
  const { details, PLATFORM_LABEL } = window.MILAppDetails;
  const J = window.MILJourney;
  const { icon } = window.MILIcons;
  const storeData = () => window.MILAppStore?.items || {};
  const view = document.getElementById('view');
  const sheet = document.getElementById('sheet');
  const navYou = document.getElementById('nav-you');

  // ── สถานะที่จำไว้ในเครื่องผู้ใช้ (ถ้าเบราว์เซอร์ไม่ให้เก็บ ก็ใช้งานต่อได้ในรอบนี้)
  const KEY = 'mil-journey-v1';
  let state = { answers: {}, saved: [] };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* เริ่มใหม่ */ }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ไม่เป็นไร */ } };
  const answered = () => J.QUESTIONS.every(q => [].concat(state.answers[q.id] || []).length || q.multi);
  const profile = () => (answered() ? J.buildProfile(state.answers) : null);

  // ── ตัวช่วยสร้าง DOM
  function h(tag, attrs = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid.nodeType ? kid : document.createTextNode(kid));
    return node;
  }
  const ext = (label, href, cls = 'pill') => h('a', { class: cls, href, target: '_blank', rel: 'noopener noreferrer' }, label);
  const toneStyle = room => `--tone:${room.tone};--tint:${room.tint}`;

  // ไอคอนเส้นของแต่ละห้อง
  const GLYPH = {
    playground: 'M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0',
    practice: 'M8 21h8l-2-16h-4zM12 5l4 10M6 21h12',
    library: 'M5 4h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z',
    studio: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M8 21h8',
    stage: 'M4 20h16M6 20l2-8h8l2 8M9 4l3 8 3-8',
    pathway: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
  };
  const glyph = (id, size = 28) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', GLYPH[id]); svg.appendChild(p);
    return svg;
  };

  function show(title, ...nodes) {
    document.title = `${title} · Music Industry Lap`;
    if (sheet.open) sheet.close();
    view.replaceChildren(...nodes.filter(Boolean));
    navYou.hidden = !profile();
    window.scrollTo({ top: 0 });
    view.focus({ preventScroll: true });
  }

  // ── 1) ประตูทางเข้า
  function renderGate() {
    const p = profile();
    const heroDoor = h('a', { class: 'door-hero', href: '#/discover/1' },
      h('span', { class: 'door-knob', 'aria-hidden': 'true' }),
      h('small', {}, p ? 'ห้องสำรวจตัวตน · ทำใหม่ได้' : 'เริ่มที่นี่ · 2 นาที'),
      h('strong', {}, 'ห้องสำรวจตัวตน'),
      h('span', { class: 'desc' }, `ตอบ ${J.QUESTIONS.length} คำถามเรื่องสิ่งที่คุณชอบ อุปกรณ์ที่มี และเป้าหมาย แล้วเราจะบอกว่าคุณเป็นนักดนตรีแบบไหน ควรเข้าห้องไหนก่อน และเริ่มด้วยแอปอะไร`),
      h('span', { class: 'go' }, p ? 'สำรวจอีกครั้ง →' : 'เปิดประตู →'));
    const side = h('div', { class: 'gate-side' });
    if (p) {
      const a = J.ARCHETYPES[p.archetype];
      side.append(h('div', { class: 'welcome' },
        h('p', { class: 'eyebrow' }, 'ยินดีต้อนรับกลับ'), h('b', {}, a.name),
        h('p', {}, `เส้นทางของคุณ: ${J.route(p).map(id => J.room(id).name).join(' → ')}`),
        h('div', { class: 'row' }, h('a', { class: 'pill', href: `#/room/${J.firstRoom(p)}` }, `เข้า${J.room(J.firstRoom(p)).name} →`), h('a', { class: 'pill ghost', href: '#/you' }, 'ดูตัวตนของฉัน'))));
    }
    side.append(h('ol', { class: 'how' },
      [['สำรวจ', 'ตอบคำถามสั้นๆ ไม่มีถูกผิด'], ['เข้าห้อง', 'แต่ละห้องคืองานหนึ่งอย่าง: ลอง ซ้อม เรียนทฤษฎี สร้าง แสดง วางเส้นทาง'], ['เลือกและออกไปลอง', 'ทุกแอปบอกราคา อุปกรณ์ ข้อจำกัด และลิงก์ทางการ']]
        .map(([b, t], i) => h('li', {}, h('span', { class: 'n' }, String(i + 1)), h('div', {}, h('b', {}, b), t)))));
    const hero = h('section', { class: 'gate-hero' }, h('div', { class: 'wrap fade-in' },
      h('p', { class: 'eyebrow' }, 'Music Industry Lap · ประตูทางเข้า'),
      h('h1', {}, 'ดนตรีแบบไหน', h('br'), h('em', {}, 'ที่เป็นคุณ?')),
      h('p', { class: 'lead' }, 'บ้านหลังนี้มี 6 ห้อง แต่ละห้องคือวิธีหนึ่งในการอยู่กับดนตรี ถ้ายังไม่แน่ใจ เริ่มจากประตูสีทอง — ถ้ารู้อยู่แล้ว เดินเข้าห้องด้านล่างได้เลย'),
      h('div', { class: 'gate-main' }, heroDoor, side)));
    const mine = p ? J.firstRoom(p) : null;
    const doors = h('div', { class: 'doors' }, J.ROOMS.map(r => h('a', { class: `door${r.id === mine ? ' mine' : ''}`, href: `#/room/${r.id}`, style: toneStyle(r) },
      h('span', { class: 'glyph' }, glyph(r.id, 30)),
      r.id === mine ? h('span', { class: 'mine-tag' }, 'ห้องแรกของคุณ') : null,
      h('span', { class: 'en' }, r.en), h('strong', {}, r.name), h('span', { class: 'q' }, `“${r.question}”`),
      h('span', { class: 'meta' }, h('span', {}, `${J.members(r.id).length} แหล่งในห้อง`), h('b', {}, 'เข้าห้อง →')))));
    const rooms = h('section', { class: 'section wrap' },
      h('div', { class: 'section-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'หรือเลือกห้องเอง'), h('h2', {}, 'วันนี้คุณอยากทำอะไรกับดนตรี?'),
        h('p', {}, 'ทุกห้องมีประตูเชื่อมไปห้องถัดไป — เริ่มจากห้องไหนก็เดินต่อได้โดยไม่หลงทาง'))), doors);
    show('ประตูสู่ดนตรีของคุณ', hero, rooms);
  }

  // ── 2) สำรวจตัวตน — ทีละคำถาม ให้รู้สึกเหมือนเดินผ่านประตูทีละบาน
  function renderQuestion(n) {
    const q = J.QUESTIONS[n - 1];
    if (!q) return go('#/you');
    const picked = new Set([].concat(state.answers[q.id] || []));
    const corridor = h('div', { class: 'corridor', 'aria-hidden': 'true' }, J.QUESTIONS.map((_, i) => h('span', { class: i + 1 < n ? 'done' : i + 1 === n ? 'now' : '' })));
    const next = () => go(n < J.QUESTIONS.length ? `#/discover/${n + 1}` : '#/you');
    const options = h('div', { class: 'options', role: q.multi ? 'group' : 'radiogroup', 'aria-labelledby': 'q-title' });
    const nextBtn = h('button', { class: 'btn', type: 'button', onclick: next }, n < J.QUESTIONS.length ? 'ต่อไป →' : 'ดูผลของฉัน →');
    for (const o of q.options) {
      const btn = h('button', { class: `option${q.multi ? ' multi' : ''}`, type: 'button', 'aria-pressed': String(picked.has(o.id)) },
        h('span', { class: 'tick' }, '✓'), h('span', {}, o.label));
      btn.addEventListener('click', () => {
        if (q.multi) {
          picked.has(o.id) ? picked.delete(o.id) : picked.add(o.id);
          state.answers[q.id] = [...picked];
          btn.setAttribute('aria-pressed', String(picked.has(o.id)));
          persist();
        } else {
          state.answers[q.id] = o.id;
          persist();
          for (const b of options.children) b.setAttribute('aria-pressed', String(b === btn));
          setTimeout(next, 220); // เห็นว่าเลือกแล้วก่อนเปลี่ยนหน้า
        }
      });
      options.appendChild(btn);
    }
    const nav = h('div', { class: 'quiz-nav' },
      h('button', { class: 'link-btn', type: 'button', onclick: () => go(n > 1 ? `#/discover/${n - 1}` : '#/') }, '← ย้อนกลับ'),
      q.multi || picked.size ? nextBtn : h('span', { class: 'quiz-step' }, 'แตะคำตอบเพื่อไปต่อ'));
    show(`คำถาม ${n}`, h('section', { class: 'quiz fade-in' }, corridor,
      h('p', { class: 'quiz-step' }, `ประตูที่ ${n} จาก ${J.QUESTIONS.length}`),
      h('h1', { id: 'q-title' }, q.title), h('p', { class: 'hint' }, q.hint || (q.multi ? 'เลือกได้หลายข้อ' : 'เลือกหนึ่งข้อ')),
      options, nav));
  }

  // ── การ์ดแอป (ใช้ทั้งหน้าผลลัพธ์และในห้อง)
  function appCard(resource, room, p) {
    const d = details[resource.id];
    const f = p ? J.fit(resource, p) : null;
    const top = h('div', { class: 'app-head' }, icon(resource, d, { tone: room.tone }),
      h('div', {}, h('h3', {}, resource.name), h('div', { class: 'owner' }, resource.owner)));
    const tags = h('div', { class: 'tags' },
      h('span', { class: `tag${resource.cost === 'free' ? ' cost-free' : ''}` }, resource.costText.split(/[;；]/)[0]),
      d.platforms.slice(0, 3).map(x => h('span', { class: 'tag' }, PLATFORM_LABEL[x])),
      d.platforms.length > 3 ? h('span', { class: 'tag' }, `+${d.platforms.length - 3}`) : null,
      resource.thai ? h('span', { class: 'tag' }, 'ภาษาไทย') : null);
    const card = h('article', { class: `app${f && !f.ok ? ' dim' : ''}`, style: toneStyle(room) }, top,
      f?.ok && f.points >= 10 ? h('span', { class: 'fit' }, '● เหมาะกับคุณ') : null,
      f && !f.ok ? h('span', { class: 'tag warn' }, f.blockers[0]) : null,
      h('p', {}, resource.goal), tags,
      h('button', { class: 'open', type: 'button', onclick: () => go(`#/room/${room.id}/${resource.id}`) }, h('span', {}, `ดูรายละเอียด ${resource.name}`)));
    return card;
  }

  // ── 3) ผลลัพธ์: ตัวตน + เหตุผล + เส้นทาง 3 ห้อง + 3 แหล่งแรก
  function renderYou() {
    const p = profile();
    if (!p) return go('#/discover/1');
    const a = J.ARCHETYPES[p.archetype];
    const echo = J.QUESTIONS.filter(q => ['instrument', 'dream', 'level'].includes(q.id))
      .map(q => q.options.find(o => o.id === state.answers[q.id])?.label).filter(Boolean);
    const max = Math.max(...Object.values(p.score), 1);
    const meter = h('div', { class: 'meter' }, h('h2', {}, 'ส่วนผสมในตัวคุณ'),
      Object.entries(p.score).filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1]).map(([k, v]) => h('div', { class: 'meter-row' },
        h('span', {}, J.ARCHETYPES[k].name), h('i', {}, h('b', { style: `width:${Math.round((v / max) * 100)}%` })), h('span', {}, String(v)))));
    const hero = h('section', { class: 'you-hero' }, h('div', { class: 'wrap you-grid fade-in' },
      h('div', {}, h('p', { class: 'eyebrow' }, 'ตัวตนทางดนตรีของคุณ'), h('h1', {}, a.name), h('p', {}, a.line),
        h('ul', { class: 'traits' }, a.strengths.map(s => h('li', {}, s)), p.secondary ? h('li', {}, `มีมุม${J.ARCHETYPES[p.secondary].name}ด้วย`) : null),
        echo.length ? h('p', { class: 'because' }, `เพราะคุณเลือก: ${echo.join(' · ')}`) : null,
        h('div', { class: 'row', style: 'display:flex;gap:8px;flex-wrap:wrap;margin-top:14px' },
          h('a', { class: 'pill', href: `#/room/${J.firstRoom(p)}` }, `เข้า${J.room(J.firstRoom(p)).name} →`),
          h('a', { class: 'pill ghost', href: '#/discover/1' }, 'แก้คำตอบ'))),
      meter));
    const route = h('section', { class: 'section wrap' },
      h('div', { class: 'section-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'เส้นทางที่แนะนำ'), h('h2', {}, 'เดิน 3 ห้องนี้ตามลำดับ'),
        h('p', {}, 'ห้องแรกทำให้เริ่มได้วันนี้ ห้องที่สองต่อยอดจากสิ่งที่คุณชอบ และห้องสุดท้ายคือจุดตัดสินใจเรื่องครูหรือการเรียนจริงจัง'))),
      h('div', { class: 'route' }, J.route(p).map((id, i) => {
        const r = J.room(id);
        return h('a', { class: 'stop', href: `#/room/${id}`, style: toneStyle(r) }, h('span', { class: 'n' }, String(i + 1)), h('span', {}, h('b', {}, r.name), h('small', {}, r.promise)));
      })));
    const picks = J.recommend(p);
    const start = h('section', { class: 'section wrap' },
      h('div', { class: 'section-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'เริ่มวันนี้'), h('h2', {}, 'สามอย่างที่ควรลองก่อน'),
        h('p', {}, 'คัดจากแหล่งที่เปิดบนอุปกรณ์ของคุณได้และอยู่ในงบ — กดการ์ดเพื่อดูว่าทำไมถึงเหมาะ'))),
      picks.length ? h('div', { class: 'apps' }, picks.map(x => appCard(x.resource, J.room(J.roomOf(x.resource.id)), p)))
        : h('p', {}, 'ยังไม่พบแหล่งที่ตรงทุกเงื่อนไข — ลองเพิ่มอุปกรณ์หรือปรับงบในคำถาม'));
    const saved = state.saved.map(id => resources.find(r => r.id === id)).filter(Boolean);
    const shortlist = saved.length ? h('section', { class: 'section wrap' },
      h('div', { class: 'section-head' }, h('div', {}, h('p', { class: 'eyebrow' }, 'ที่คุณเก็บไว้'), h('h2', {}, `รายการของฉัน (${saved.length})`))),
      h('div', { class: 'apps' }, saved.map(r => appCard(r, J.room(J.roomOf(r.id)), p)))) : null;
    show(`คุณคือ${a.name}`, hero, route, start, shortlist, h('div', { style: 'height:40px' }));
  }

  // ── 4) ห้อง
  let deviceOnly = true;
  function renderRoom(id, appId) {
    const room = J.room(id);
    if (!room) return go('#/');
    const p = profile();
    let list = J.members(id);
    const fits = p ? Object.fromEntries(list.map(r => [r.id, J.fit(r, p)])) : {};
    if (p) list = list.slice().sort((a, b) => (fits[b.id].ok - fits[a.id].ok) || fits[b.id].points - fits[a.id].points);
    const grid = h('div', { class: 'apps' });
    const paint = () => {
      const rows = p && deviceOnly ? list.filter(r => fits[r.id].ok) : list;
      grid.replaceChildren(...rows.map(r => appCard(r, room, p)));
      if (!rows.length) grid.append(h('p', {}, 'ในห้องนี้ยังไม่มีแหล่งที่ตรงอุปกรณ์/งบของคุณ — ปิดตัวกรองเพื่อดูทั้งหมด'));
    };
    const tools = h('div', { class: 'room-tools' });
    if (p) {
      const hidden = list.filter(r => !fits[r.id].ok).length;
      const chip = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(deviceOnly) }, `เฉพาะที่ใช้ได้กับฉัน${hidden ? ` (ซ่อน ${hidden})` : ''}`);
      chip.addEventListener('click', () => { deviceOnly = !deviceOnly; chip.setAttribute('aria-pressed', String(deviceOnly)); paint(); });
      const first = J.firstRoom(p) === id;
      tools.append(chip, h('span', { class: 'fit-note' }, first ? h('b', {}, `ห้องแรกของ${J.ARCHETYPES[p.archetype].name}`) : `เรียงตามความเหมาะกับ${J.ARCHETYPES[p.archetype].name}`));
    } else tools.append(h('a', { class: 'chip', href: '#/discover/1' }, 'ยังไม่รู้ว่าแอปไหนเหมาะ? สำรวจตัวตนก่อน →'));
    paint();
    const hero = h('section', { class: 'room-hero', style: toneStyle(room) }, h('div', { class: 'wrap fade-in' },
      h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'ประตูทางเข้า'), ' / ', room.name),
      h('span', { class: 'en' }, room.en), h('h1', {}, room.name), h('p', {}, room.promise), tools));
    const doors = h('section', { class: 'room-doors wrap', style: toneStyle(room) },
      h('h2', {}, 'ประตูจากห้องนี้'), h('p', {}, 'เลือกตามสิ่งที่คุณรู้สึกหลังได้ลองในห้องนี้'),
      h('div', { class: 'next-doors' }, room.doors.map(([to, why]) => {
        const r = J.room(to);
        return h('a', { class: 'next-door', href: `#/room/${to}`, style: toneStyle(r) }, h('span', { class: 'glyph' }, glyph(to, 24)), h('span', {}, h('b', {}, r.name), h('small', {}, why)));
      })),
      room.links ? h('div', { class: 'ext-links' }, room.links.map(([label, href]) => h('a', { class: 'pill dark', href }, `${label} →`))) : null);
    show(room.name, hero, h('div', { class: 'wrap', style: toneStyle(room) }, grid), doors);
    if (appId) openSheet(appId, room);
  }

  // ── 5) รายละเอียดแอป
  function openSheet(appId, room) {
    const r = resources.find(x => x.id === appId);
    if (!r) return;
    const d = details[r.id];
    const p = profile();
    const f = p ? J.fit(r, p) : null;
    const official = storeData()[r.id];
    const ico = icon(r, d, { size: 72, tone: room.tone });
    const from = h('div', { class: 'icon-from' }, ico.dataset.iconFrom);
    ico.addEventListener('iconsource', e => { from.textContent = e.detail; });
    const saved = state.saved.includes(r.id);
    const saveBtn = h('button', { class: 'btn light save', type: 'button', 'aria-pressed': String(saved) }, saved ? '★ เก็บไว้แล้ว' : '☆ เก็บไว้ดูทีหลัง');
    saveBtn.addEventListener('click', () => {
      state.saved = state.saved.includes(r.id) ? state.saved.filter(x => x !== r.id) : [...state.saved, r.id];
      persist();
      const on = state.saved.includes(r.id);
      saveBtn.textContent = on ? '★ เก็บไว้แล้ว' : '☆ เก็บไว้ดูทีหลัง';
      saveBtn.setAttribute('aria-pressed', String(on));
    });
    const sec = (title, ...body) => h('section', {}, h('h3', {}, title), ...body);
    const officialInfo = official?.description || official?.web?.description;
    sheet.replaceChildren(
      h('div', { class: 'sheet-top', style: toneStyle(room) }, ico,
        h('div', {}, h('h2', { id: 'sheet-title' }, r.name), h('div', { class: 'owner' }, `${r.owner} · ${J.room(J.roomOf(r.id)).name}`), from),
        h('button', { class: 'sheet-close', type: 'button', onclick: () => sheet.close() }, 'ปิด ×')),
      h('div', { class: 'sheet-body', style: toneStyle(room) },
        f ? h('section', { class: `for-you${f.ok ? '' : ' no'}` }, h('h3', {}, f.ok ? `ทำไมเหมาะกับ${J.ARCHETYPES[p.archetype].name}` : 'ข้อควรรู้สำหรับคุณ'),
          h('ul', {}, (f.ok ? f.reasons : f.blockers).map(x => h('li', {}, x)))) : null,
        sec('คืออะไร', h('p', {}, d.about)),
        sec('ทำอะไรได้บ้าง', h('ul', {}, d.features.map(x => h('li', {}, x)))),
        sec('เริ่มใช้ครั้งแรก', h('ol', {}, (r.guide?.steps || [r.first]).map(x => h('li', {}, x)))),
        sec('เงื่อนไขก่อนกดไป', h('div', { class: 'facts' },
          [['ราคา', d.pricing], ['ใช้บน', d.platforms.map(x => PLATFORM_LABEL[x]).join(', ')], ['ระดับ', d.level], ['ภาษา', r.language], ['บัญชี', r.account], ['หมวด', categories.find(([c]) => c === r.category)?.[1] || r.category]]
            .map(([k, v]) => h('div', {}, h('b', {}, k), h('span', {}, v))))),
        sec('ข้อจำกัดที่ควรรู้', h('p', {}, d.limits), r.note ? h('p', { style: 'margin-top:6px' }, r.note) : null),
        officialInfo ? sec(official.kind === 'app-store' ? `ข้อความจากผู้พัฒนาใน App Store${official.version ? ` · เวอร์ชัน ${official.version}` : ''}${official.rating ? ` · ★ ${official.rating.toFixed(1)} (${official.ratingCount?.toLocaleString('th-TH')} รีวิว)` : ''}` : 'ข้อความจากเว็บไซต์เจ้าของ',
          h('p', { class: 'official', lang: 'en' }, officialInfo), h('p', { style: 'margin-top:6px;font-size:12px;color:var(--muted)' }, `ดึงเมื่อ ${official.checked}`)) : null,
        sec('ที่มาของข้อมูล', h('p', { style: 'font-size:12px' }, `สรุปโดยทีมจากหน้าเจ้าของ · ตรวจล่าสุด ${r.checked} · ${r.sourceType}`))),
      h('div', { class: 'sheet-actions', style: toneStyle(room) },
        ext('เปิดแหล่งจริง ↗', r.url, 'btn'),
        (r.alternates || []).map(a => ext(`${a.name} ↗`, a.url, 'pill ghost')),
        saveBtn));
    if (!sheet.open) sheet.showModal();
    document.title = `${r.name} · ${room.name}`;
  }
  sheet.addEventListener('close', () => {
    if (sheet.open) return; // ปิดแล้วเปิดใหม่ทันที (เปลี่ยนแอปในห้องเดิม) — event มาช้ากว่า
    const m = location.hash.match(/^#\/room\/([^/]+)\/.+/);
    if (m) history.replaceState(null, '', `#/room/${m[1]}`);
    document.title = `${J.room(m?.[1])?.name || 'ประตูสู่ดนตรีของคุณ'} · Music Industry Lap`;
  });
  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  // ── เส้นทาง
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  let lastRoom = null;
  function route() {
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
    const [page, a, b] = parts;
    if (page === 'discover') return renderQuestion(Math.max(1, parseInt(a, 10) || 1));
    if (page === 'you') return renderYou();
    if (page === 'room') {
      // เปิด/ปิดแผ่นรายละเอียดในห้องเดิมโดยไม่วาดห้องใหม่ (คงตำแหน่งเลื่อน)
      if (a === lastRoom && view.querySelector('.room-hero')) {
        if (b) return openSheet(b, J.room(a));
        if (sheet.open) sheet.close();
        return;
      }
      lastRoom = a;
      return renderRoom(a, b);
    }
    lastRoom = null;
    return renderGate();
  }
  window.addEventListener('hashchange', route);
  route();
})();
