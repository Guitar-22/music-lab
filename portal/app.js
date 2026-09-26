(function () {
  'use strict';

  const { resources, categories, selectResources } = window.MILPortal;
  const { previews, rankings } = window.MILPro;
  const categoryRow = document.getElementById('categories');
  const results = document.getElementById('results');
  const count = document.getElementById('count');
  const query = document.getElementById('query');
  const freeOnly = document.getElementById('free-only');
  const noInstrument = document.getElementById('no-instrument');
  const thaiOnly = document.getElementById('thai-only');
  let category = 'all';

  const dialog = document.createElement('dialog');
  dialog.className = 'guide-dialog';
  dialog.setAttribute('aria-label', 'คำแนะนำแหล่งเรียน');
  document.body.appendChild(dialog);

  function el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }

  function link(label, url, className) {
    const node = el('a', className, label);
    node.href = url;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
  }

  function preview(resource, small = false) {
    const info = previews[resource.id];
    if (!info) return null;
    const figure = el('figure', small ? 'product-preview small' : 'product-preview');
    const image = el('img');
    image.src = info.url;
    image.alt = `${info.kind} ของ ${resource.name} จาก ${info.credit}`;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      figure.replaceChildren(link('ดูภาพผลิตภัณฑ์ที่แหล่งทางการ ↗', info.source, 'preview-fallback'));
    });
    const caption = el('figcaption');
    caption.append(link(`${info.kind} · ${info.credit} ↗`, info.source));
    figure.append(image, caption);
    return figure;
  }

  function renderRankings() {
    const section = el('section', 'pro-section');
    section.id = 'pro';
    const heading = el('div', 'section-head');
    const copy = el('div');
    copy.append(el('p', 'eyebrow', 'PRO WORKFLOWS · EVIDENCE LED'), el('h2', '', 'มืออาชีพเลือกเครื่องมือตามงาน'), el('p', '', 'Ranking นี้เป็นลำดับคำแนะนำสำหรับโจทย์ที่เลือก อิงงานสำรวจ หลักสูตร และเอกสารผลิตภัณฑ์ ไม่ใช่ส่วนแบ่งตลาดโลก'));
    heading.appendChild(copy);
    section.appendChild(heading);
    const tabs = el('div', 'rank-tabs');
    const output = el('div', 'rank-results');
    section.append(tabs, output);
    let active = rankings[0].id;
    const render = () => {
      tabs.replaceChildren();
      for (const group of rankings) {
        const button = el('button', group.id === active ? 'active' : '', group.title);
        button.type = 'button';
        button.setAttribute('aria-pressed', String(group.id === active));
        button.addEventListener('click', () => { active = group.id; render(); });
        tabs.appendChild(button);
      }
      const group = rankings.find(item => item.id === active);
      output.replaceChildren();
      output.append(el('p', 'rank-audience', `${group.audience} · เกณฑ์: ${group.basis}`));
      const grid = el('div', 'rank-grid');
      group.picks.forEach((pick, index) => {
        const resource = resources.find(item => item.id === pick.id);
        const article = el('article', 'rank-card');
        const picture = preview(resource);
        if (picture) article.appendChild(picture);
        article.append(el('span', 'rank-number', `#${index + 1} · ${pick.confidence}`), el('h3', '', resource.name), el('p', 'rank-reason', pick.reason));
        const proof = el('div', 'rank-proof');
        proof.append(el('b', '', 'หลักฐาน'), el('span', '', pick.evidence), link('อ่านแหล่งอ้างอิง ↗', pick.evidenceUrl));
        article.appendChild(proof);
        const actions = el('div', 'rank-actions');
        const guideButton = el('button', 'details-button', 'ดูคำแนะนำ');
        guideButton.type = 'button';
        guideButton.addEventListener('click', () => showGuide(resource));
        actions.append(guideButton, link('เปิดผลิตภัณฑ์ ↗', resource.url, 'visit'));
        article.appendChild(actions);
        grid.appendChild(article);
      });
      output.appendChild(grid);
      output.appendChild(el('p', 'rank-method', 'ข้อจำกัด: แบบสำรวจเป็นกลุ่มสมัครใจและบางชุดมีสัดส่วนผู้ใช้ Pro Tools/ผู้ตอบจากอิตาลีสูง จึงใช้เพื่อดูรูปแบบงาน ไม่ใช้คำนวณส่วนแบ่งตลาดไทยหรือโลก'));
    };
    render();
    document.getElementById('explore').before(section);
  }

  function renderCategories() {
    categoryRow.replaceChildren();
    for (const [id, label] of categories) {
      const button = el('button', id === category ? 'active' : '', label);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(id === category));
      button.addEventListener('click', () => {
        category = id;
        renderCategories();
        renderResults();
      });
      categoryRow.appendChild(button);
    }
  }

  function showGuide(resource) {
    const guide = resource.guide;
    dialog.replaceChildren();
    const header = el('div', 'guide-header');
    const title = el('h2', '', resource.name);
    const close = el('button', 'guide-close', 'ปิด ×');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    header.append(title, close);
    dialog.appendChild(header);
    dialog.appendChild(el('p', 'guide-lead', resource.goal));
    const picture = preview(resource, true);
    if (picture) dialog.appendChild(picture);
    const facts = el('div', 'guide-facts');
    for (const [label, value] of [['ผู้พัฒนา', resource.owner], ['ค่าใช้จ่าย', resource.costText], ['บัญชี', resource.account], ['อุปกรณ์', resource.device], ['ภาษา', resource.language], ['ชนิดแหล่งข้อมูล', resource.sourceType], ['ตรวจล่าสุด', resource.checked]]) {
      const item = el('div');
      item.append(el('b', '', label), el('span', '', value));
      facts.appendChild(item);
    }
    dialog.appendChild(facts);
    const section = (heading, body) => {
      const wrap = el('section', 'guide-section');
      wrap.appendChild(el('h3', '', heading));
      if (Array.isArray(body)) {
        const list = el('ol');
        for (const step of body) list.appendChild(el('li', '', step));
        wrap.appendChild(list);
      } else wrap.appendChild(el('p', '', body));
      dialog.appendChild(wrap);
    };
    section('เข้าไปจะเจออะไร', guide.what);
    section('เริ่มใช้อย่างไร', guide.steps);
    section('เหมาะกับใคร', guide.best);
    section('ข้อจำกัดที่ควรรู้', guide.limit);
    section('ก้าวต่อไป', guide.next);
    const actions = el('div', 'guide-actions');
    actions.append(link('เปิดแหล่งจริง ↗', resource.url, 'visit'));
    for (const alternate of resource.alternates || []) actions.append(link(alternate.name + ' ↗', alternate.url, 'source'));
    actions.append(link('ดูแหล่งข้อมูล', resource.source, 'source'));
    dialog.appendChild(actions);
    dialog.showModal();
  }

  function card(resource) {
    const node = el('article', 'resource');
    const top = el('div', 'resource-top');
    top.append(el('span', 'kind', categories.find(([id]) => id === resource.category)?.[1] || resource.category), el('span', `cost ${resource.cost}`, resource.costText));
    node.appendChild(top);
    const picture = preview(resource, true);
    if (picture) node.appendChild(picture);
    node.append(el('p', 'owner', resource.owner), el('h3', '', resource.name), el('p', 'goal', resource.goal));
    const first = el('div', 'first');
    first.append(el('b', '', 'เริ่มตรงนี้'), el('span', '', resource.first));
    node.appendChild(first);
    const meta = el('div', 'meta');
    for (const value of [resource.device, resource.language, resource.account]) meta.appendChild(el('span', '', value));
    node.append(meta, el('p', 'note', resource.note));
    const bottom = el('div', 'resource-bottom');
    const details = el('button', 'details-button', 'ดูคำแนะนำ →');
    details.type = 'button';
    details.addEventListener('click', () => showGuide(resource));
    bottom.append(details, link('เปิดแหล่งจริง ↗', resource.url, 'visit'));
    node.appendChild(bottom);
    return node;
  }

  function renderResults() {
    const rows = selectResources({ category, query: query.value, freeOnly: freeOnly.checked, noInstrument: noInstrument.checked, thaiOnly: thaiOnly.checked });
    count.textContent = `พบ ${rows.length} จาก ${resources.length} แหล่ง`;
    results.replaceChildren();
    if (!rows.length) {
      const empty = el('div', 'empty');
      empty.append(el('b', '', 'ยังไม่พบแหล่งที่ตรงเงื่อนไข'), el('p', '', 'ลองล้างตัวกรองหรือค้นด้วยคำที่กว้างขึ้น'));
      results.appendChild(empty);
    } else for (const resource of rows) results.appendChild(card(resource));
  }

  for (const input of [query, freeOnly, noInstrument, thaiOnly]) input.addEventListener('input', renderResults);
  document.getElementById('clear').addEventListener('click', () => {
    category = 'all';
    query.value = '';
    freeOnly.checked = false;
    noInstrument.checked = false;
    thaiOnly.checked = false;
    renderCategories();
    renderResults();
  });
  document.getElementById('start-easy').addEventListener('click', () => {
    category = 'try';
    freeOnly.checked = true;
    noInstrument.checked = true;
    thaiOnly.checked = false;
    query.value = '';
    renderCategories();
    renderResults();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  const nav = el('nav', 'top-nav');
  nav.append(link('สถาบันและแผนที่โรงเรียน', 'institutions.html'), link('แผนที่ Ecosystem', 'ecosystem.html'), link('Ranking มืออาชีพ', '#pro'), link('เครื่องมือทั้งหมด', '#explore'));
  for (const anchor of nav.querySelectorAll('a')) { anchor.target = '_self'; anchor.removeAttribute('rel'); }
  document.querySelector('.top').appendChild(nav);
  renderRankings();
  renderCategories();
  renderResults();
})();
