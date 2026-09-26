(function (root) {
  'use strict';
  // แสดงไอคอนจริงของแอป/เว็บ ตามลำดับความน่าเชื่อถือ แล้วบอกผู้ใช้ว่าไอคอนมาจากไหน
  //   1) ไฟล์ที่ tools/fetch-app-details.cjs ดาวน์โหลดไว้ (assets/icons)       — ไอคอนจาก App Store/เว็บเจ้าของ ตรวจแล้ว
  //   2) App Store (iTunes Lookup/Search แบบ JSONP ส่งแค่รหัสแอป ไม่ส่งข้อมูลผู้ใช้) — ไอคอนแอปจริง 512px
  //   3) ไอคอนของเว็บไซต์เจ้าของ (apple-touch-icon → favicon ขนาดใหญ่)
  //   4) อักษรย่อสีประจำห้อง — เมื่อหาไอคอนจริงไม่ได้ ดีกว่าแสดงภาพที่ไม่ใช่ของแอปนั้น
  const store = () => root.MILAppStore?.items || {};
  const CACHE_KEY = 'mil-appicon-v1';
  const TTL = 1000 * 60 * 60 * 24 * 14;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { cache = {}; }
  const saveCache = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* ใช้ต่อได้โดยไม่มีแคช */ } };
  const fresh = key => cache[key] && Date.now() - cache[key].at < TTL;

  let seq = 0;
  function jsonp(url, timeout = 6000) {
    return new Promise(resolve => {
      const name = `__milIcon${Date.now()}${seq++}`;
      const script = document.createElement('script');
      const done = value => { clearTimeout(timer); delete root[name]; script.remove(); resolve(value); };
      const timer = setTimeout(() => done(null), timeout);
      root[name] = data => done(data);
      script.onerror = () => done(null);
      script.src = `${url}&callback=${name}`;
      document.head.appendChild(script);
    });
  }

  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pending = new Map();
  // ดึงไอคอนจาก App Store หนึ่งครั้งต่อแอป (แชร์ผลกับการ์ดทุกใบ)
  function appStoreIcon(detail) {
    const key = detail.appStoreId ? `id:${detail.appStoreId}` : detail.appSearch ? `q:${detail.appSearch.term}|${detail.appSearch.seller}` : null;
    if (!key) return Promise.resolve(null);
    if (fresh(key)) return Promise.resolve(cache[key].url);
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      let hit = null;
      if (detail.appStoreId) {
        for (const country of ['th', 'us']) {
          const data = await jsonp(`https://itunes.apple.com/lookup?id=${detail.appStoreId}&country=${country}`);
          hit = data?.results?.[0];
          if (hit) break;
        }
      } else {
        for (const entity of ['software', 'macSoftware']) {
          const data = await jsonp(`https://itunes.apple.com/search?term=${encodeURIComponent(detail.appSearch.term)}&entity=${entity}&country=us&limit=10`);
          hit = (data?.results || []).find(a => norm(a.sellerName || a.artistName).includes(norm(detail.appSearch.seller)) && norm(a.trackName).includes(norm(detail.appSearch.term)));
          if (hit) break;
        }
      }
      const url = hit?.artworkUrl512 || hit?.artworkUrl100 || null;
      if (url) { cache[key] = { url, at: Date.now() }; saveCache(); }
      return url;
    })();
    pending.set(key, task);
    return task;
  }

  function candidates(resource, detail) {
    const local = store()[resource.id];
    const list = [];
    if (local?.icon) list.push({ url: local.icon, from: local.kind === 'app-store' ? 'ไอคอนแอปจาก App Store' : 'ไอคอนจากเว็บไซต์เจ้าของ', min: 16 });
    if (local?.artwork) list.push({ url: local.artwork, from: 'ไอคอนแอปจาก App Store', min: 16 });
    if (detail.appStoreId || detail.appSearch) list.push({ lazy: () => appStoreIcon(detail), from: 'ไอคอนแอปจาก App Store', min: 16 });
    if (detail.site) {
      list.push({ url: `https://${detail.site}/apple-touch-icon.png`, from: `ไอคอนเว็บไซต์ ${detail.site}`, min: 48 });
      // บริการ favicon ของ Google คืนไอคอนของโดเมนนั้น; ถ้าโดเมนไม่มีไอคอนจะได้ลูกโลก 16px จึงรับเฉพาะภาพ ≥ 48px
      list.push({ url: `https://www.google.com/s2/favicons?domain=${detail.site}&sz=128`, from: `ไอคอนเว็บไซต์ ${detail.site}`, min: 48 });
    }
    return list;
  }

  const initials = name => {
    const words = name.replace(/[^A-Za-z0-9ก-๙ ]/g, ' ').trim().split(/\s+/);
    return (words.length > 1 && /[A-Za-z]/.test(words[0][0]) ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  };

  // คืน <span class="app-icon"> ทันที แล้วค่อยเติมภาพจริงเมื่อโหลดสำเร็จ; data-icon-from บอกที่มา
  function icon(resource, detail = {}, { size = 56, tone = '#2d5a3d' } = {}) {
    const box = document.createElement('span');
    box.className = 'app-icon';
    box.style.setProperty('--icon-size', `${size}px`);
    box.style.setProperty('--icon-tone', tone);
    const mono = document.createElement('span');
    mono.className = 'app-icon-mono';
    mono.textContent = initials(resource.name);
    mono.setAttribute('aria-hidden', 'true');
    box.appendChild(mono);
    box.dataset.iconFrom = 'อักษรย่อ — ยังไม่พบไอคอนที่ตรวจได้';
    const list = candidates(resource, detail);
    const tryNext = async index => {
      const c = list[index];
      if (!c) return;
      const url = c.lazy ? await c.lazy() : c.url;
      if (!url) return tryNext(index + 1);
      const img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (img.naturalWidth < c.min) return tryNext(index + 1);
        img.className = 'app-icon-img';
        box.replaceChildren(img);
        box.dataset.iconFrom = c.from;
        box.classList.add('loaded');
        box.dispatchEvent(new CustomEvent('iconsource', { bubbles: true, detail: c.from }));
      };
      img.onerror = () => tryNext(index + 1);
      img.src = url;
    };
    tryNext(0);
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', `ไอคอน ${resource.name}`);
    return box;
  }

  root.MILIcons = { icon, initials };
})(typeof window !== 'undefined' ? window : globalThis);
