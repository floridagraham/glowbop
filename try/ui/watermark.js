/* 🎨 ICONS BEHIND THE WORDS (Oct 18, 23:11, Graham: "we can still have the icons... a different gradient colour, 50%, so you can still
   read the words... behind the words"; he picked "3 · Gradient key").
   Every key with words AND an icon gets the icon drawn big and soft behind its words instead of squeezed beside them:
     solid keys (coloured buttons, hit pads, chips that are on): the key fades to a deeper shade, a light icon peeks from the right
     outline chips: the icon sits in the chip's colour at the right end, faint
   The icon becomes part of the key's background, so it never pushes the words around or makes them shrink. */
(function () {
  'use strict';
  const SEL = '#main .btn, #main .chip, #main .tile';
  GB.css(`
  .gb-wm > svg.wm-hid, .gb-wm .wm-hid { display:none !important; }
  .gb-wm { background-repeat:no-repeat !important; }
  html body #main .chip.gb-wm { padding-right:30px !important; }
  `);
  const skip = el => el.closest('#slStage, .dj-skip, #rail, #hd, .vb-card, .no-wm') || el.classList.contains('no-wm');
  const firstIcon = el => [...el.querySelectorAll('svg')].find(s => !s.closest('.gb-ibtn'));
  const solidOf = el => el.matches('.btn.c, .btn.on, .tile.on, .chip.on, .chip.sel, .tile.pro-pad, .dj-pads .tile, .tile[style*="--c"]');
  function uri(svg, fill) {
    const c = svg.cloneNode(true); c.removeAttribute('class'); c.removeAttribute('style'); c.removeAttribute('width'); c.removeAttribute('height');
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); c.setAttribute('fill', fill);
    if (!c.getAttribute('viewBox')) c.setAttribute('viewBox', '0 0 24 24');
    const s = c.outerHTML.replace(/currentColor/g, fill);
    return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
  }
  function one(el) {
    if (!el.isConnected || skip(el)) return;
    const svg = firstIcon(el), txt = (el.textContent || '').trim();
    if (!svg || !txt || el.querySelectorAll('svg').length > 2) { if (el.classList.contains('gb-wm')) undo(el); return; }
    const solid = solidOf(el), chip = el.classList.contains('chip'), on = el.matches('.on, .sel');
    const col = getComputedStyle(el).getPropertyValue('--c').trim() || '#ff3d9a';
    const fill = solid ? (chip ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.32)') : chip ? col.replace(/^#([0-9a-f]{6})$/i, (m, h) => 'rgba(' + [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',') + ',.45)') : 'rgba(255,255,255,.16)';
    const key = svg.innerHTML.length + '|' + fill + '|' + solid + '|' + on;
    if (el.dataset.wm === key) return;
    el.dataset.wm = key; el.classList.add('gb-wm'); svg.classList.add('wm-hid');
    const icon = uri(svg, fill);
    if (chip && !solid) {                                              // outline chip: a faint icon at the right end
      el.style.backgroundImage = icon; el.style.backgroundSize = 'auto 62%'; el.style.backgroundPosition = 'right 9px center'; return;
    }
    // solid key: the colour deepens toward the bottom right, and the light icon peeks from the right edge
    el.style.backgroundImage = icon + ', linear-gradient(135deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.34))';
    el.style.backgroundSize = 'auto ' + (chip ? '70%' : '128%') + ', 100% 100%';
    el.style.backgroundPosition = (chip ? 'right 8px center' : 'right -4px center') + ', 0 0';
  }
  function undo(el) {
    el.classList.remove('gb-wm'); delete el.dataset.wm; el.style.backgroundImage = el.style.backgroundSize = el.style.backgroundPosition = '';
    el.querySelectorAll('.wm-hid').forEach(s => s.classList.remove('wm-hid'));
  }
  let q = new Set(), all = false, t = 0;
  const run = () => { t = 0; const list = all ? [...document.querySelectorAll(SEL)] : [...q].flatMap(n => n.matches && n.matches(SEL) ? [n] : n.querySelectorAll ? [...n.querySelectorAll(SEL)] : []);
    q = new Set(); all = false; list.forEach(one); };
  const later = ms => { if (!t) t = setTimeout(run, ms || 60); };
  GB.watermarks = () => { all = true; later(10); };
  const mo = new MutationObserver(ms => { for (const m of ms) { const n = m.target.nodeType === 3 ? m.target.parentElement : m.target; if (!n || !n.closest) continue;
    const b = n.closest(SEL); q.add(b || n); m.addedNodes && m.addedNodes.forEach(x => x.nodeType === 1 && q.add(x)); } later(80); });
  const start = () => { mo.observe(document.body, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class']}); GB.watermarks(); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  GB.on && GB.on('page', () => setTimeout(GB.watermarks, 120));
})();
