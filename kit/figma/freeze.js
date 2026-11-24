// Render the RTL page, then pin every element at the position the browser drew it,
// so a converter that ignores `direction: rtl` cannot mirror the layout.
const { chromium } = require('playwright-core');
const fs = require('fs');
(async () => {
  const exe = require('child_process').execSync('ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1').toString().trim();
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: 1520, height: 1000 } });
  await p.goto(process.argv[2], { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const n = await p.evaluate(() => {
    let count = 0;
    document.querySelectorAll('.screen').forEach(screen => {
      // 1) wrap loose text inside flex/grid boxes so every flex child is an element
      screen.querySelectorAll('*').forEach(el => {
        if (el.closest('svg')) return;
        const cs = getComputedStyle(el);
        // also split text that mixes Arabic with LTR pieces (numbers, Latin): each piece becomes its own pinned span
        const mixed = el.children.length && [...el.children].some(c => c.tagName.toLowerCase() !== 'svg') && cs.display !== 'inline';
        if (!/flex|grid|table-cell/.test(cs.display) && !mixed) return;
        [...el.childNodes].forEach(nd => {
          if (nd.nodeType === 3 && nd.textContent.trim()) { const sp = document.createElement('span'); nd.replaceWith(sp); sp.appendChild(nd); }
        });
      });
      // 2) measure everything before changing anything
      const all = [screen, ...screen.querySelectorAll('*')].filter(el => !el.closest('svg') || el.tagName.toLowerCase() === 'svg');
      const info = new Map();
      all.forEach(el => {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        const hasText = [...el.childNodes].some(nd => nd.nodeType === 3 && nd.textContent.trim());
        info.set(el, { r, bl: parseFloat(cs.borderLeftWidth) || 0, bt: parseFloat(cs.borderTopWidth) || 0, hasText, display: cs.display, lh: parseFloat(cs.lineHeight) || 20, ta: cs.textAlign, dir: cs.direction });
      });
      const isLeaf = el => { const t = el.tagName.toLowerCase(); return t === 'svg' || t === 'img' || info.get(el).hasText; };
      // 3) pin
      const pin = (el) => {
        const me = info.get(el);
        if (isLeaf(el)) {
          if (me.ta === 'start') el.style.textAlign = me.dir === 'rtl' ? 'right' : 'left';
          if (me.ta === 'end') el.style.textAlign = me.dir === 'rtl' ? 'left' : 'right';
          if (me.r.height < me.lh * 1.6) el.style.whiteSpace = 'nowrap';
          return;
        }
        el.style.display = 'block';
        if (el !== screen) el.style.position = 'absolute'; else el.style.position = 'relative';
        [...el.children].forEach(ch => {
          const c = info.get(ch);
          if (!c || c.display === 'none') return;
          ch.style.position = 'absolute';
          ch.style.left = (c.r.left - me.r.left - me.bl) + 'px';
          ch.style.top = (c.r.top - me.r.top - me.bt) + 'px';
          ch.style.right = 'auto'; ch.style.bottom = 'auto';
          ch.style.width = c.r.width + 'px'; ch.style.height = c.r.height + 'px';
          ch.style.margin = '0';
          ch.style.boxSizing = 'border-box';
          count++;
          pin(ch);
        });
      };
      pin(screen);
    });
    return count;
  });
  // pinned boxes keep their size; flex/grid gaps no longer apply
  let html = await p.content();
  fs.writeFileSync(process.argv[3], html);
  console.log('pinned', n, 'elements →', process.argv[3]);
  // check: the frozen page must look the same as the live one
  await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {});
  await b.close();
})();
