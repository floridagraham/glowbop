/* 🔤 Words always fit their button (Oct 18, Graham: "make the font resizable on all the buttons, it's coming out of the bubble.
   Everything a standard font, and once it hits a certain size, it reduces... even if it looks funky, let's do it").
   Every button, chip, tile and tab keeps its normal size; when its words don't fit, the size steps down (to 55% at the
   smallest) until they do. Re-checked when the screen turns, the page changes or a label changes. */
(function () {
  'use strict';
  const SEL = 'button, .btn, .chip, .tile, a.btn, .lt-tabs button, #rail button';
  const MIN = 0.55, STEP = 0.92;
  const over = el => {
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) return true;
    const r = el.getBoundingClientRect();
    for (const s of el.querySelectorAll('span, b, small, em, strong')) {
      const q = s.getBoundingClientRect(); if (q.width && (q.right > r.right + 1 || q.left < r.left - 1)) return true;
    }
    return false;
  };
  function fit(list) {
    const todo = [];
    list.forEach(el => {
      if (!el.isConnected || el.offsetParent === null || el.classList.contains('no-fit')) return;
      if (!(el.textContent || '').trim()) return;                    // icon-only keys: nothing to shrink
      if (el.dataset.fs0) { el.style.fontSize = ''; el.querySelectorAll('[data-fs0]').forEach(k => { k.style.fontSize = ''; delete k.dataset.fs0; }); delete el.dataset.fs0; }
      todo.push(el);
    });
    let k = 1, live = todo.filter(over);                                // read everything first, then write (one layout per step)
    const base = new Map(live.map(el => [el, parseFloat(getComputedStyle(el).fontSize) || 14]));
    const kids = new Map(live.map(el => [el, [...el.querySelectorAll('span, b, small, em, strong')].filter(s => getComputedStyle(s).fontSize !== getComputedStyle(el).fontSize)
      .map(s => [s, parseFloat(getComputedStyle(s).fontSize) || 12])]));
    while (live.length && k > MIN) {
      k *= STEP;
      live.forEach(el => { el.dataset.fs0 = '1'; el.style.fontSize = (base.get(el) * k).toFixed(1) + 'px';
        kids.get(el).forEach(([s, f]) => { s.dataset.fs0 = '1'; s.style.fontSize = (f * k).toFixed(1) + 'px'; }); });
      live = live.filter(over);
    }
  }
  let q = new Set(), all = false, sched = 0;
  const run = () => { sched = 0; const list = all ? [...document.querySelectorAll(SEL)] : [...q].flatMap(n => n.matches && n.matches(SEL) ? [n] : n.querySelectorAll ? [...n.querySelectorAll(SEL)] : []);
    q = new Set(); all = false; fit(list); };
  const later = (ms) => { if (!sched) sched = setTimeout(run, ms || 60); };
  GB.fitText = () => { all = true; later(10); };
  const mo = new MutationObserver(ms => { for (const m of ms) { const t = m.target.nodeType === 3 ? m.target.parentElement : m.target; if (!t) continue;
    const b = t.closest && t.closest(SEL); q.add(b || t); m.addedNodes && m.addedNodes.forEach(n => n.nodeType === 1 && q.add(n)); } later(80); });
  const start = () => { mo.observe(document.body, {childList: true, subtree: true, characterData: true}); GB.fitText(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => GB.fitText(), 300); });
  GB.on && GB.on('page', () => setTimeout(() => GB.fitText(), 150));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => GB.fitText());
})();
