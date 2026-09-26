(function (root, factory) {
  const api = factory(root.MILPortal || (typeof require === 'function' ? require('./resources.js') : null), root.MILAppDetails || (typeof require === 'function' ? require('./app-details.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MILJourney = api;
})(typeof window !== 'undefined' ? window : globalThis, function (portal, appDetails) {
  'use strict';
  // Journey Gate — ตรรกะล้วน (ไม่แตะ DOM) เพื่อทดสอบได้: ห้อง ประตูเชื่อมห้อง คำถามสำรวจตัวตน และการจับคู่แหล่งเรียน
  const { resources } = portal;
  const { details } = appDetails;

  // ── ห้อง: แต่ละห้องคือ "งานหนึ่งอย่าง" ที่ผู้ใช้อยากทำ; doors = ห้องที่เดินต่อได้อย่างมีเหตุผล
  const ROOMS = [
    { id: 'playground', name: 'ลานทดลองเสียง', en: 'Sound Playground', tone: '#c8643b', tint: '#fbeee6',
      promise: 'ลองเล่นกับเสียงก่อน ยังไม่ต้องมีเครื่อง ยังไม่ต้องเก่ง', question: 'ฉันชอบเสียงแบบไหน?',
      categories: ['try'], extra: ['garageband', 'bandlab', 'chrome-lab'],
      doors: [['practice', 'เจอเสียงที่ชอบแล้ว อยากฝึกให้เล่นได้จริง'], ['studio', 'สนุกกับการประกอบเพลง อยากทำต่อ'], ['library', 'อยากรู้ว่าทำไมเสียงนี้ถึงเพราะ']] },
    { id: 'practice', name: 'ห้องซ้อม', en: 'Practice Room', tone: '#2f6f8f', tint: '#e6f1f6',
      promise: 'เครื่องมือที่ทำให้ซ้อมทุกวันได้ตรงจังหวะ ตรงเสียง และเล่นตามเพลงจริง', question: 'ฉันจะเก่งขึ้นทุกวันได้อย่างไร?',
      categories: ['tuner', 'metronome', 'practice'], extra: ['ireal'],
      doors: [['stage', 'ซ้อมจนมั่นใจ อยากขึ้นเล่นให้คนฟัง'], ['library', 'อยากอ่านโน้ตและเข้าใจสิ่งที่เล่น'], ['pathway', 'อยากมีครูหรือเรียนจริงจัง']] },
    { id: 'library', name: 'ห้องสมุดโน้ตและทฤษฎี', en: 'Theory Library', tone: '#6b4f9a', tint: '#efeaf6',
      promise: 'อ่าน เขียน และเข้าใจภาษาของดนตรี — จากค่าโน้ตไปจนถึงการเรียบเรียง', question: 'ดนตรีทำงานอย่างไร?',
      categories: ['theory', 'notation'], extra: ['hookpad', 'soundslice'],
      doors: [['practice', 'นำความรู้ไปฝึกกับเครื่องดนตรี'], ['studio', 'อยากเขียนเพลงของตัวเอง'], ['pathway', 'เตรียมสอบหรือเรียนต่อสายดนตรี']] },
    { id: 'studio', name: 'สตูดิโอสร้างเพลง', en: 'Creator Studio', tone: '#1f7a5a', tint: '#e5f3ec',
      promise: 'แต่ง อัด ทำบีต และมิกซ์ — ตั้งแต่มือถือจนถึงสตูดิโอมืออาชีพ', question: 'ฉันจะทำเพลงของตัวเองได้อย่างไร?',
      categories: ['songwriting', 'recording'], extra: ['garageband', 'ableton'],
      doors: [['stage', 'อยากเล่นเพลงที่ทำขึ้นเวที'], ['library', 'อยากเข้าใจคอร์ดและการเรียบเรียง'], ['pathway', 'อยากเป็นโปรดิวเซอร์/ซาวด์เอนจิเนียร์']] },
    { id: 'stage', name: 'หลังเวที', en: 'Backstage', tone: '#a33b53', tint: '#f7e8ec',
      promise: 'สิ่งที่นักดนตรีใช้จริงตอนแสดงสด: โน้ตบนแท็บเล็ต ชาร์ตคอร์ด คิวเสียง และเสียงบนเวที', question: 'ฉันพร้อมขึ้นเวทีแค่ไหน?',
      categories: ['performance'], extra: ['ireal', 'ableton-live'],
      doors: [['practice', 'กลับไปเก็บเพลงให้แน่นขึ้น'], ['studio', 'อัดผลงานเก็บไว้หรือปล่อยเพลง'], ['pathway', 'หาเวที ครู หรือเส้นทางอาชีพ']] },
    { id: 'pathway', name: 'ห้องแนะแนวเส้นทาง', en: 'Pathway Office', tone: '#8a6a1f', tint: '#f6f0e1',
      promise: 'ครู หลักสูตร มหาวิทยาลัย และความรู้ดนตรีไทย — ต่อจากงานอดิเรกไปสู่การเรียนจริงจังหรืออาชีพ', question: 'ฉันควรเรียนต่อหรือหาครูที่ไหน?',
      categories: ['teacher', 'pathway', 'culture'], extra: [],
      links: [['สถาบันและแผนที่โรงเรียนดนตรี', 'institutions.html'], ['แผนที่ Ecosystem ดนตรีกรุงเทพฯ', 'ecosystem.html']],
      doors: [['practice', 'ระหว่างรอเรียน เริ่มซ้อมเองก่อน'], ['library', 'ปูพื้นทฤษฎีเตรียมสอบ'], ['playground', 'ยังไม่แน่ใจ ขอลองเล่นก่อน']] },
  ];
  const room = id => ROOMS.find(r => r.id === id);
  const roomOf = resourceId => ROOMS.find(r => r.categories.includes(resources.find(x => x.id === resourceId)?.category))?.id;
  const members = id => {
    const r = room(id);
    const ids = new Set([...resources.filter(x => r.categories.includes(x.category)).map(x => x.id), ...r.extra]);
    return resources.filter(x => ids.has(x.id));
  };

  // ── ตัวตนทางดนตรี 6 แบบ ผูกกับห้องแรกที่ควรเข้า
  const ARCHETYPES = {
    explorer:  { name: 'นักสำรวจเสียง', room: 'playground', line: 'คุณเริ่มจากความอยากรู้ — ได้ลองก่อนแล้วค่อยเลือก จะไปได้ไกลกว่าการบังคับตัวเองเรียนสิ่งที่ยังไม่รู้ว่าชอบ', strengths: ['ใจเปิด ลองสิ่งใหม่ได้เร็ว', 'ฟังเสียงรอบตัวอย่างสนใจ'] },
    player:    { name: 'นักฝึกฝีมือ', room: 'practice', line: 'คุณมีความสุขเมื่อเล่นได้ดีขึ้นทีละนิด — เครื่องมือซ้อมที่ดีจะเปลี่ยนเวลา 15 นาทีต่อวันให้เห็นผลจริง', strengths: ['ความสม่ำเสมอ', 'ชอบเห็นพัฒนาการที่วัดได้'] },
    thinker:   { name: 'นักคิดดนตรี', room: 'library', line: 'คุณอยากเข้าใจว่า "ทำไม" — ทฤษฎีและการอ่านโน้ตจะเป็นแผนที่ที่ทำให้คุณเรียนเครื่องดนตรีใดก็เร็วขึ้น', strengths: ['ชอบระบบและรูปแบบ', 'จำโครงสร้างเพลงได้ดี'] },
    creator:   { name: 'นักสร้างเพลง', room: 'studio', line: 'คุณได้ยินเพลงที่ยังไม่มีใครทำ — เริ่มจากเครื่องมือที่ทำเดโมได้ในวันแรก แล้วค่อยขยับไปสตูดิโอเต็มรูปแบบ', strengths: ['จินตนาการเรื่องเสียงและเรื่องราว', 'ชอบลงมือทำชิ้นงาน'] },
    performer: { name: 'นักแสดง', room: 'stage', line: 'พลังของคุณอยู่ตอนมีคนฟัง — เตรียมเพลง เตรียมโน้ต และเตรียมเสียงให้พร้อม แล้วเวทีจะเป็นของคุณ', strengths: ['สื่อสารกับผู้ฟัง', 'เล่นร่วมกับคนอื่นได้ดี'] },
    pathfinder:{ name: 'นักวางเส้นทาง', room: 'pathway', line: 'คุณมองไกลถึงการเรียนจริงจังหรืออาชีพ — ครูที่ใช่และข้อมูลหลักสูตรที่ถูกต้องจะประหยัดเวลาได้หลายปี', strengths: ['มีเป้าหมายชัด', 'พร้อมลงทุนกับการเรียน'] },
  };

  // ── คำถาม: แต่ละคำตอบให้คะแนนตัวตน (a) และบันทึกเงื่อนไขจริง (set) ที่ใช้กรองแหล่งเรียน
  const QUESTIONS = [
    { id: 'listen', title: 'เวลาฟังเพลงที่ชอบ อะไรดึงคุณไว้มากที่สุด?', hint: 'ไม่มีคำตอบผิด — ตอบตามความรู้สึกแรก', options: [
      { id: 'beat', label: 'จังหวะที่ทำให้อยากขยับ', a: { player: 2, performer: 1 }, traits: ['rhythm'] },
      { id: 'voice', label: 'ทำนองหรือเสียงร้องที่ติดหู', a: { performer: 2, player: 1 }, traits: ['melody'] },
      { id: 'sound', label: 'ซาวด์และการเรียบเรียงที่ซับซ้อน', a: { creator: 2, thinker: 1 }, traits: ['producer'] },
      { id: 'story', label: 'เนื้อเพลงและเรื่องราว', a: { creator: 2, performer: 1 }, traits: ['creator'] },
      { id: 'roots', label: 'ความเป็นไทย/ดนตรีพื้นบ้าน', a: { pathfinder: 2, thinker: 1 }, traits: ['culture'] },
    ] },
    { id: 'instrument', title: 'เสียงไหนที่อยากให้ออกมาจากมือ (หรือเสียง) ของคุณ?', hint: 'เลือกสิ่งที่อยากลองที่สุด — เปลี่ยนใจได้ภายหลัง', options: [
      { id: 'guitar', label: 'กีตาร์ / อูคูเลเล่ / เบส', a: { performer: 1, player: 1 }, traits: ['melody'], set: { focus: 'guitar' } },
      { id: 'keys', label: 'เปียโน / คีย์บอร์ด', a: { thinker: 1, player: 1 }, traits: ['reader'], set: { focus: 'keys' } },
      { id: 'drums', label: 'กลอง / เครื่องให้จังหวะ', a: { player: 1, performer: 1 }, traits: ['rhythm'], set: { focus: 'drums' } },
      { id: 'vocal', label: 'เสียงร้อง', a: { performer: 2 }, traits: ['melody', 'performer'], set: { focus: 'vocal' } },
      { id: 'orch', label: 'เครื่องเป่า / เครื่องสายวง (ไวโอลิน ฟลูต แซก…)', a: { player: 1, thinker: 1 }, traits: ['reader'], set: { focus: 'orch' } },
      { id: 'thai', label: 'ดนตรีไทย (ระนาด ขิม ซอ…)', a: { pathfinder: 2 }, traits: ['culture'], set: { focus: 'thai' } },
      { id: 'computer', label: 'คอมพิวเตอร์ / บีต / ซาวด์', a: { creator: 2 }, traits: ['producer'], set: { focus: 'computer' } },
      { id: 'none', label: 'ยังไม่รู้เลย', a: { explorer: 2 }, traits: ['explorer'], set: { focus: null } },
    ] },
    { id: 'dream', title: 'ภาพที่อยากเห็นตัวเองในอีก 1 ปี คือ…', options: [
      { id: 'enjoy', label: 'เล่นเพลงที่ชอบได้ ผ่อนคลายหลังเลิกเรียน/งาน', a: { player: 2, explorer: 1 } },
      { id: 'band', label: 'เล่นกับเพื่อน มีวง ขึ้นเวที', a: { performer: 3 }, traits: ['performer'] },
      { id: 'release', label: 'มีเพลงของตัวเองปล่อยออกไป', a: { creator: 3 }, traits: ['creator', 'producer'] },
      { id: 'exam', label: 'สอบเข้า/สอบเกรด หรือเริ่มเส้นทางอาชีพ', a: { pathfinder: 4, thinker: 1 }, traits: ['pathway'] },
      { id: 'unsure', label: 'ยังไม่รู้ — อยากลองหลายๆ อย่างก่อน', a: { explorer: 3 }, traits: ['explorer'] },
    ] },
    { id: 'level', title: 'ตอนนี้คุณอยู่ตรงไหนกับดนตรี?', options: [
      { id: 'zero', label: 'เริ่มจากศูนย์', a: { explorer: 2 }, set: { level: 0 } },
      { id: 'some', label: 'เล่นได้นิดหน่อย/เคยเรียนมาบ้าง', a: { player: 1 }, set: { level: 1 } },
      { id: 'regular', label: 'เล่นประจำ อยากยกระดับ', a: { performer: 1, player: 1 }, set: { level: 2 } },
      { id: 'serious', label: 'เรียนหรือทำงานสายดนตรีอยู่แล้ว', a: { pathfinder: 1, creator: 1 }, set: { level: 3 } },
    ] },
    { id: 'style', title: 'คุณเรียนรู้ได้ดีที่สุดแบบไหน?', options: [
      { id: 'play', label: 'ลงมือเล่นเลย ผิดแล้วค่อยแก้', a: { explorer: 1, creator: 1 }, set: { style: 'play' } },
      { id: 'structured', label: 'มีบทเรียนเป็นขั้นๆ ชัดเจน', a: { thinker: 2 }, set: { style: 'structured' } },
      { id: 'teacher', label: 'มีครูคอยดูและบอกตรงๆ', a: { pathfinder: 2 }, set: { style: 'teacher' } },
      { id: 'selfstudy', label: 'ดูตัวอย่างแล้วแกะเอง', a: { player: 1, performer: 1 }, set: { style: 'selfstudy' } },
    ] },
    { id: 'gear', title: 'ตอนนี้มีอะไรอยู่ในมือบ้าง?', hint: 'เลือกได้หลายข้อ — ใช้กรองเฉพาะแหล่งที่เปิดบนอุปกรณ์ของคุณได้จริง', multi: true, options: [
      { id: 'iphone', label: 'iPhone', set: { device: 'iphone' } },
      { id: 'android', label: 'มือถือ Android', set: { device: 'android' } },
      { id: 'ipad', label: 'iPad', set: { device: 'ipad' } },
      { id: 'mac', label: 'คอม Mac', set: { device: 'mac' } },
      { id: 'windows', label: 'คอม Windows', set: { device: 'windows' } },
      { id: 'instrument', label: 'มีเครื่องดนตรีแล้ว', a: { player: 1 }, set: { instrument: true } },
    ] },
    { id: 'budget', title: 'งบสำหรับแอปหรือคอร์สตอนนี้', options: [
      { id: 'free', label: 'ขอฟรีก่อน', set: { budget: 'free' } },
      { id: 'small', label: 'จ่ายได้บ้างถ้าคุ้ม', set: { budget: 'small' } },
      { id: 'invest', label: 'พร้อมลงทุนกับเครื่องมือที่ใช่', a: { pathfinder: 1 }, set: { budget: 'invest' } },
    ] },
  ];

  // ระดับของแหล่งเรียน: 0 เริ่มจากศูนย์ … 3 มืออาชีพ (อ่านจากข้อความ level ใน app-details)
  const levelRange = text => {
    const lo = /ศูนย์|ทุกระดับ/.test(text) ? 0 : /^เริ่มต้น/.test(text) ? 0 : /^กลาง/.test(text) ? 1 : /เตรียม/.test(text) ? 2 : 2;
    const hi = /มืออาชีพ|ขั้นสูง|ทุกระดับ|เตรียม/.test(text) ? 3 : /กลาง/.test(text) ? 2 : 1;
    return [lo, hi];
  };
  const FREEISH = { free: ['free', 'freemium', 'trial'], small: ['free', 'freemium', 'trial', 'paid', 'subscription', 'varies'], invest: null };

  // รวมคำตอบเป็นโปรไฟล์: คะแนนตัวตน + เงื่อนไขจริง + เหตุผลที่ผู้ใช้อ่านเข้าใจ
  function buildProfile(answers) {
    const score = Object.fromEntries(Object.keys(ARCHETYPES).map(k => [k, 0]));
    const profile = { devices: [], traits: [], instrument: false, level: 0, style: null, budget: 'small', focus: null };
    for (const q of QUESTIONS) {
      const picked = [].concat(answers[q.id] || []);
      for (const id of picked) {
        const o = q.options.find(x => x.id === id);
        if (!o) continue;
        for (const [k, v] of Object.entries(o.a || {})) score[k] += v;
        profile.traits.push(...(o.traits || []));
        if (o.set?.device) profile.devices.push(o.set.device);
        else Object.assign(profile, o.set || {});
      }
    }
    // เสมอกัน: เป้าหมาย 1 ปี (คำถาม dream) เป็นตัวตัดสิน เพราะบอกความตั้งใจตรงที่สุด
    const dream = QUESTIONS.find(q => q.id === 'dream').options.find(o => o.id === answers.dream);
    const dreamArch = dream && Object.entries(dream.a).sort((a, b) => b[1] - a[1])[0][0];
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1] || (b[0] === dreamArch) - (a[0] === dreamArch));
    profile.archetype = ranked[0][1] > 0 ? ranked[0][0] : 'explorer';
    profile.secondary = ranked[1][1] > 0 ? ranked[1][0] : null;
    profile.score = score;
    return profile;
  }

  // ห้องแรกของตัวตน — นักแสดงที่ยังเล่นไม่คล่องควรเริ่มที่ห้องซ้อม (เครื่องมือหลังเวทีเป็นของมือกลาง–อาชีพ)
  function firstRoom(profile) {
    const base = ARCHETYPES[profile.archetype].room;
    if (base === 'stage' && profile.level < 2) return 'practice';
    return base;
  }

  const hasDevice = (detail, devices) => !devices.length || detail.platforms.includes('web') || detail.platforms.some(p => devices.includes(p));
  const budgetOk = (resource, budget) => !FREEISH[budget] || FREEISH[budget].includes(resource.cost);

  // ให้คะแนนแหล่งเรียนหนึ่งรายการสำหรับโปรไฟล์นี้ พร้อมเหตุผล — คัดทิ้งถ้าเปิดบนอุปกรณ์ไม่ได้หรือเกินงบ
  function fit(resource, profile) {
    const d = details[resource.id];
    if (!d) return null;
    const blockers = [];
    if (!hasDevice(d, profile.devices)) blockers.push('ไม่มีบนอุปกรณ์ที่คุณเลือก');
    if (!budgetOk(resource, profile.budget)) blockers.push('ต้องจ่ายเงินตั้งแต่เริ่ม');
    if (!resource.noInstrument && !profile.instrument && ['tuner'].includes(resource.category)) blockers.push('ต้องมีเครื่องดนตรีก่อน');
    if (d.instruments && profile.focus && !d.instruments.includes(profile.focus)) blockers.push('ออกแบบมาสำหรับเครื่องดนตรีอื่น');
    const reasons = [];
    let points = 0;
    const primary = ARCHETYPES[profile.archetype];
    const start = firstRoom(profile);
    if (members(start).some(x => x.id === resource.id)) { points += 5; reasons.push(`อยู่ใน${room(start).name} ซึ่งเป็นห้องแรกที่แนะนำสำหรับ${primary.name}`); }
    if (d.instruments && profile.focus && d.instruments.includes(profile.focus)) { points += 3; reasons.push('ออกแบบมาสำหรับเครื่องดนตรีที่คุณเลือก'); }
    if (profile.secondary && members(ARCHETYPES[profile.secondary].room).some(x => x.id === resource.id)) points += 2;
    const shared = [...new Set(profile.traits.filter(t => d.traits.includes(t)))];
    points += shared.length * 2;
    const TRAIT_WORD = { reader: 'การอ่านโน้ต/ทฤษฎี', rhythm: 'จังหวะ', melody: 'ทำนอง/เสียงร้อง', producer: 'ซาวด์และการผลิต', creator: 'การสร้างเพลง', culture: 'ดนตรีไทย/วัฒนธรรม', performer: 'การเล่นกับคนอื่น', pathway: 'การเรียนต่อ/อาชีพ', explorer: 'การทดลอง' };
    if (shared.length) reasons.push(`ตรงกับที่คุณสนใจ: ${shared.map(t => TRAIT_WORD[t] || t).join(', ')}`);
    const [lo, hi] = levelRange(d.level);
    if (profile.level >= lo && profile.level <= hi) { points += 3; reasons.push(`ระดับ ${d.level} เหมาะกับจุดที่คุณอยู่`); }
    else if (profile.level < lo) points -= 3 * (lo - profile.level);
    if (profile.style && d.style.includes(profile.style)) { points += 2; reasons.push({ play: 'ลงมือเล่นได้ทันที', structured: 'มีบทเรียนเป็นขั้นตอน', teacher: 'มีครู/สถาบันดูแล', selfstudy: 'ใช้ฝึกเองได้อิสระ' }[profile.style]); }
    if (resource.cost === 'free') { points += 1; reasons.push('ใช้ฟรี'); }
    if (!profile.instrument && resource.noInstrument) { points += 1; reasons.push('ไม่ต้องมีเครื่องดนตรี'); }
    return { resource, detail: d, points, reasons, blockers, ok: !blockers.length };
  }

  function recommend(profile, { limit = 3, roomId = null } = {}) {
    const pool = roomId ? members(roomId) : resources;
    const rows = pool.map(r => fit(r, profile)).filter(Boolean);
    const ok = rows.filter(r => r.ok).sort((a, b) => b.points - a.points || a.resource.name.localeCompare(b.resource.name));
    return limit ? ok.slice(0, limit) : ok;
  }

  // เส้นทางแนะนำ: ห้องแรกตามตัวตน → ประตูที่สอดคล้องกับตัวตนรอง → ห้องแนะแนว (จุดตัดสินใจเรื่องครู/เรียนต่อ)
  function route(profile) {
    const first = firstRoom(profile);
    let second = profile.secondary && ARCHETYPES[profile.secondary].room !== first ? ARCHETYPES[profile.secondary].room : room(first).doors[0][0];
    if (second === 'stage' && profile.level < 2) second = first === 'practice' ? 'library' : 'practice';
    const path = [...new Set([first, second, 'pathway'])];
    for (const [door] of room(first).doors) if (path.length < 3 && !path.includes(door)) path.splice(path.length - 1, 0, door);
    return path;
  }

  return { ROOMS, ARCHETYPES, QUESTIONS, room, roomOf, members, buildProfile, firstRoom, fit, recommend, route, levelRange };
});
