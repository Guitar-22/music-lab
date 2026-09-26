// ตรวจคอนทราสต์ข้อความทั้งหน้า (WCAG AA: 4.5:1 ข้อความทั่วไป, 3:1 ตัวใหญ่) — ใช้ในเบราว์เซอร์ตอนตรวจงาน
// วิธีใช้: เพิ่ม <script src="tools/contrast-scan.js"> ชั่วคราว หรือโหลดผ่าน console แล้วเรียก window.contrastScan()
window.contrastScan = function contrastScan(root = document.body) {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return { r, g, b, a }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
    let base = dark ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    for (const c of layers.reverse()) base = { r: c.r * c.a + base.r * (1 - c.a), g: c.g * c.a + base.g * (1 - c.a), b: c.b * c.a + base.b * (1 - c.a) };
    return base;
  };
  const bad = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('svg, img, .hero-photo, .sr')) continue;
    // พื้นเป็นภาพ/ไล่สี วัดจากสีพื้นอย่างเดียวไม่ได้ (ใช้ axe-core ตรวจแทน)
    let img = false; for (let e = el; e && !img; e = e.parentElement) img = getComputedStyle(e).backgroundImage !== 'none' && !/linear-gradient\(45deg, transparent/.test(getComputedStyle(e).backgroundImage);
    if (img) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || el.getBoundingClientRect().width === 0) continue;
    const fg = parse(s.color), bg = bgOf(el);
    const f = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
    const L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
    if (ratio < (big ? 3 : 4.5)) bad.push(`${el.tagName}.${el.className} "${el.textContent.trim().slice(0, 24)}" ${ratio.toFixed(2)}`);
  }
  return [...new Set(bad)];
};
