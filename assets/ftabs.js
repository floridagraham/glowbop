// 🗂️ Features page tabs: ⭐ All, 🎵 Music show, 🎧 DJ & parties, 🧵 Your lights, 🎨 Pro Art, 🏟️ Sports & live, 🎄 Holidays & home.
// A tab shows only its sections (the Pro cards and the final call to action stay under every tab), scrolls to the top of
// the list and sets the hash (#music, #dj, #lights, #proart, #sports, #home), so features.html#sports opens that tab.
// A link to a section id (features.html#pro-art) switches to that section's tab first, then scrolls to it.
(() => {
  const bar = document.querySelector('.ftabs'); if (!bar) return;
  const tabs = [...bar.querySelectorAll('a[data-tab]')], row = bar.querySelector('.ftabs-row');
  const items = [...document.querySelectorAll('[data-cat]')], feats = items.filter(e => e.classList.contains('feat'));
  const intro = document.querySelector('.ft-intro'), top = document.getElementById('ftop'), hd = document.querySelector('.nav');
  const CATS = tabs.map(t => t.dataset.tab);
  const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const hdh = () => hd ? hd.offsetHeight : 0;
  const setH = () => document.documentElement.style.setProperty('--hdh', hdh() + 'px');
  setH(); addEventListener('resize', setH);
  let cur = 'all';

  function show(cat) {
    cur = cat;
    items.forEach(el => el.classList.toggle('ft-hide', cat !== 'all' && el.dataset.cat !== cat));
    if (intro) intro.classList.toggle('ft-hide', cat !== 'all');
    document.body.classList.toggle('ft-on', cat !== 'all');
    let i = 0;                                       // keep the picture side alternating down the visible list
    feats.forEach(f => { if (f.classList.contains('ft-hide')) return; f.classList.toggle('flip', i % 2 === 1); f.classList.toggle('ffirst', i === 0); i++; });
    tabs.forEach(t => { const on = t.dataset.tab === cat; t.classList.toggle('on', on); on ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current'); });
    const a = tabs.find(t => t.dataset.tab === cat);
    if (a && row.scrollWidth > row.clientWidth) row.scrollTo({left: a.offsetLeft - row.clientWidth / 2 + a.offsetWidth / 2, behavior: smooth()});
    dispatchEvent(new Event('resize'));              // LED cards that were hidden paint at their real size
  }
  // scroll there, then settle once more (pictures above can still be loading and push the page down)
  let fix = 0;
  const land = (el, off) => {
    const y = () => el.getBoundingClientRect().top + scrollY - off();
    scrollTo({top: y(), behavior: smooth()}); clearTimeout(fix);
    fix = setTimeout(() => { if (Math.abs(el.getBoundingClientRect().top - off()) > 4) scrollTo({top: y(), behavior: 'auto'}); }, 900);
  };
  const toList = () => land(top, hdh);
  const toEl = el => land(el, () => hdh() + bar.offsetHeight + 8);

  function fromHash(scroll) {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h || h === 'all') { if (cur !== 'all') show('all'); return; }
    if (CATS.includes(h)) { show(h); if (scroll) toList(); return; }
    const el = document.getElementById(h); if (!el) return;
    const box = el.closest('[data-cat]');
    if (box) { if (box.dataset.cat !== cur) show(box.dataset.cat); }   // a section link opens that section's tab
    else if (intro && intro.contains(el)) show('all');
    if (scroll) requestAnimationFrame(() => toEl(el));
  }

  tabs.forEach(t => t.addEventListener('click', e => {
    e.preventDefault(); const c = t.dataset.tab;
    show(c); history.pushState(null, '', c === 'all' ? location.pathname + location.search : '#' + c); toList();
  }));
  addEventListener('hashchange', () => fromHash(true));
  addEventListener('popstate', () => fromHash(true));
  fromHash(!!location.hash);
})();
