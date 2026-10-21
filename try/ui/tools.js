/* 🧰 TOOLS (Oct 20, Graham: "what if we made each one like a button and then it opened a window... the card should float and be
   lockable... expandable... push a button it'll be minimized to a tools bar like in Photoshop"; picked: tools bar on the right edge,
   iPhone gets a bottom bar with cards that slide up, a TOOLS key on the rail too, smart start, pilot on SETUP and LIGHTS, DJ next).

   * Boxes you set up once become TOOLS: an icon on the tools bar. Tap it and the box opens as a floating CARD over the page.
   * Card: drag it by its bar, resize it from the corner, LOCK it (stays put, can't be bumped), EXPAND it (big), MINIMIZE it back to the bar,
     or PUT IT ON THE PAGE (it becomes a normal box again).
   * Long-press a box's title and drag it onto the tools bar to make it a tool; long-press a tool and drag it onto the page to make it a box.
   * iPhone: the tools bar runs along the bottom and cards slide up as sheets (no dragging needed on a small screen).
   * TOOLS on the rail: every tool from every page in one grid.
   Each page remembers its tools and where its cards were, separately for phone and big screens. */
(function () {
  'use strict';
  const {$} = GB;
  // Oct 20 17:47 (Graham: "let's start adding more buttons to other screens"): every page with set-once boxes, DJ first
  const PILOT = ['dj', 'music', 'text', 'feeds', 'score', 'looks', 'scenes', 'home', 'art', 'autoloops', 'setup', 'lights'];
  // 🧠 smart start: the boxes you set once and forget start as tools; the ones you play with stay open
  const START = {
    setup: ['miPanel', 'helpPanel', 'tl-screen', 'tl-console-sounds', 'tl-intro-screen', 'tl-text-size', 'tl-song-lookup', 'suLicPanel', 'suStats'],
    lights: ['ckPanel', 'offPanel', 'grpPanel', 'xlPanel', 'tl-straight-curtains', 'camPanel', 'lineupPanel'],
    dj: ['tl-cue-the-next-look', 'tl-crowd-lines', 'djMidiCard'],
    music: ['tl-levels'],
    text: ['tl-logo'],
    feeds: ['tl-countdown', 'tl-weather', 'tl-storm-watch', 'tl-overhead-now', 'tl-earthquakes', 'tl-aurora', 'tl-rocket-launches', 'tl-moon-sun', 'tl-globe', 'tl-volcanoes', 'tl-wildfires'],
    score: ['tl-scores-over-the-show'],
    looks: ['tl-transitions'],
    scenes: ['mirrorPanel', 'tl-describe-a-scene'],
    home: ['tl-bulb-map', 'grpPanel'],                 // (Holidays stays: Pro Home borrows it from the HOLIDAY page)
    art: ['tl-map-your-lights-from-a-file-beta', 'tl-show-a-picture-or-logo', 'tl-glowbop-files-beta'],
    autoloops: ['alTempo'],
  };
  const ICON = {miPanel: 'dj', helpPanel: 'help', 'tl-screen': 'tv', 'tl-console-sounds': 'vol', 'tl-intro-screen': 'movie', 'tl-text-size': 'text',
    'tl-song-lookup': 'search', suLicPanel: 'unlock', suStats: 'like', ckPanel: 'check', offPanel: 'moon', grpPanel: 'lists', xlPanel: 'gift',
    'tl-straight-curtains': 'swapH', camPanel: 'camera', lineupPanel: 'center', layoutPanel: 'map', drawPanel: 'edit', hlPanel: 'wifi', lightsPanel: 'bulb',
    'tl-cue-the-next-look': 'queue', 'tl-crowd-lines': 'text', djMidiCard: 'dj', 'tl-levels': 'faders', 'tl-logo': 'image',
    'tl-countdown': 'count321', 'tl-weather': 'sun', 'tl-storm-watch': 'lightning', 'tl-overhead-now': 'plane', 'tl-earthquakes': 'quake', 'tl-aurora': 'aurora',
    'tl-rocket-launches': 'rocket', 'tl-moon-sun': 'moon', 'tl-globe': 'globe', 'tl-volcanoes': 'volcano', 'tl-wildfires': 'fire',
    'tl-scores-over-the-show': 'trophy', 'tl-transitions': 'xfade', mirrorPanel: 'tv', 'tl-describe-a-scene': 'edit', 'tl-bulb-map': 'bulb',
    'tl-map-your-lights-from-a-file-beta': 'map', 'tl-show-a-picture-or-logo': 'image', 'tl-glowbop-files-beta': 'save', alTempo: 'drum',
    'tl-user-guide': 'help', 'tl-control-from-your-phone': 'phone', 'tl-something-not-working': 'refresh', addPanel: 'search', slPanel: 'map'};
  const COL = ['#33d6ff', '#ff3d9a', '#9b3dff', '#ffb23d', '#3ce08a', '#cc99ff', '#ff7a3d', '#4de8c8', '#ffd21a', '#ff5cc8'];
  const phone = () => innerWidth < 700;
  const dev = () => phone() ? 'phone' : 'big';
  const S = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const slug = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const titleOf = el => { const s = el && el.querySelector('.ph > span'); if (!s) return ''; const c = s.cloneNode(true); c.querySelectorAll('button, .ib, svg').forEach(x => x.remove()); return c.textContent.trim(); };
  const reg = {};                       // key -> {el, page, title, ph (placeholder)}
  const cards = {};                     // key -> card element
  let zTop = 1600;

  GB.css(`
  #gbTools { position:fixed; right:0; z-index:1400; width:64px; display:none; flex-direction:column; gap:6px; padding:8px 6px; box-sizing:border-box;
    background:#0b0816; border-left:1px solid var(--line); border-radius:18px 0 0 18px; overflow-y:auto; overscroll-behavior:contain; }
  html.gb-hastools #gbTools { display:flex; }
  html.gb-hastools:not(.gb-phone) #main { padding-right:70px; }
  html.gb-hastools:not(.gb-phone) .sl-livebtn { right:84px !important; }   /* the Live map key steps left of the tools bar */
  html.gb-phone.gb-hastools .sl-livebtn { bottom:calc(var(--tbh, 72px) + 12px) !important; }
  #gbTools .tb { position:relative; min-height:56px; width:52px; border:0; border-radius:14px; cursor:pointer; flex:none; touch-action:none;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:4px 2px;
    background:color-mix(in srgb, var(--tc) 14%, #140f22); color:color-mix(in srgb, var(--tc) 70%, #fff); }
  #gbTools .tb .ic { width:24px; height:24px; fill:currentColor; }
  #gbTools .tb span { font:700 calc(9.5px * min(var(--fs, 1), 1.1))/1.05 var(--cond); letter-spacing:.3px; text-transform:uppercase; text-align:center; max-width:50px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  #gbTools .tb.open { background:var(--tc); color:#000; box-shadow:0 0 14px -2px var(--tc); }
  #gbTools .tb .bdg { position:absolute; top:3px; right:3px; min-width:14px; height:14px; border-radius:7px; padding:0 3px; font:800 9px/14px var(--mono); background:var(--green); color:#000; }
  #gbTools .tb .bdg.warn { background:var(--amber); } #gbTools .tb .bdg.bad { background:var(--pink); }
  #gbTools.drop { box-shadow:inset 0 0 0 3px var(--cyan), 0 0 24px var(--cyan); }
  html.gb-phone #gbTools { left:0; right:0; width:auto; height:72px; flex-direction:row; border-left:0; border-top:1px solid var(--line); border-radius:18px 18px 0 0; overflow-x:auto; overflow-y:hidden; padding:8px 10px; }
  html.gb-phone.gb-hastools #main { padding-bottom:84px; }
  html.gb-phone #gbTools .tb { width:60px; }
  .gbcard { position:fixed; z-index:1600; display:flex; flex-direction:column; min-width:260px; min-height:140px; background:var(--panel, #120d20); color:var(--text);
    border:2px solid var(--tc, var(--cyan)); border-radius:0 22px 0 22px; box-shadow:0 24px 70px #000d, 0 0 30px -10px var(--tc, var(--cyan)); overflow:hidden; }
  .gbcard .cb { display:flex; align-items:center; gap:6px; min-height:44px; padding:4px 6px 4px 10px; background:color-mix(in srgb, var(--tc) 18%, #0b0816); cursor:grab; touch-action:none; user-select:none; -webkit-user-select:none; }
  .gbcard.locked .cb { cursor:default; }
  .gbcard .cb .grip { flex:1 1 auto; min-width:0; font:800 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--tc); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .gbcard .cb button { flex:none; width:40px; height:36px; border:0; border-radius:10px; cursor:pointer; background:#ffffff14; color:#fff; display:grid; place-items:center; }
  .gbcard .cb button .ic { width:20px; height:20px; fill:currentColor; }
  .gbcard .cb button.on { background:var(--tc); color:#000; }
  .gbcard .cbody { flex:1 1 auto; min-height:0; overflow:auto; padding:10px 12px 14px; overscroll-behavior:contain; }
  .gbcard .cbody > .panel { margin:0 !important; border:0 !important; box-shadow:none !important; background:none !important; padding:0 !important; width:auto !important; grid-column:auto !important; grid-row:auto !important; }
  .gbcard .rz { position:absolute; right:0; bottom:0; width:28px; height:28px; cursor:nwse-resize; touch-action:none;
    background:linear-gradient(135deg, transparent 50%, color-mix(in srgb, var(--tc) 70%, transparent) 50% 58%, transparent 58% 70%, color-mix(in srgb, var(--tc) 70%, transparent) 70% 78%, transparent 78%); }
  .gbcard.locked .rz { display:none; }
  html.gb-phone .gbcard { left:0 !important; right:0 !important; width:auto !important; top:auto !important; bottom:var(--tbh, 72px) !important; height:auto !important; max-height:calc(100vh - var(--tbh, 72px) - 40px) !important;
    border-radius:22px 22px 0 0; animation:gbSheet .28s cubic-bezier(.2,.9,.3,1); }
  html.gb-phone .gbcard .rz, html.gb-phone .gbcard [data-cb="lock"], html.gb-phone .gbcard [data-cb="max"] { display:none; }
  @keyframes gbSheet { from { transform:translateY(60%); opacity:.4; } }
  #gbToolStore { display:none !important; }
  .gb-ghost { position:fixed; z-index:3000; pointer-events:none; padding:10px 16px; border-radius:14px; background:var(--cyan); color:#000; font:800 14px var(--cond); letter-spacing:1px; text-transform:uppercase; box-shadow:0 10px 30px #000a; transform:translate(-50%, -50%); }
  #gbToolsAll { position:fixed; inset:0; z-index:2500; background:#05040ae6; display:flex; align-items:center; justify-content:center; padding:20px; }
  #gbToolsAll .ta { width:min(760px, 100%); max-height:86vh; overflow:auto; background:var(--panel); border:2px solid var(--cyan); border-radius:0 26px 0 26px; padding:16px 18px 18px; }
  #gbToolsAll h2 { margin:0 0 4px; font:800 calc(26px * var(--fs, 1)) var(--cond); letter-spacing:3px; color:var(--cyan); }
  #gbToolsAll h3 { margin:14px 0 8px; font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--dim); text-transform:uppercase; }
  #gbToolsAll .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px; }
  #gbToolsAll .grid button { min-height:64px; border:0; border-radius:14px; cursor:pointer; display:flex; align-items:center; gap:10px; padding:8px 12px; text-align:left;
    background:color-mix(in srgb, var(--tc) 16%, #140f22); color:#fff; font:700 calc(14px * var(--fs, 1))/1.1 var(--cond); letter-spacing:.5px; text-transform:uppercase; }
  #gbToolsAll .grid button .ic { width:24px; height:24px; fill:var(--tc); flex:none; }
  #gbToolsAll .x { float:right; min-height:48px; }
  #rail button.rail-tools { --c:#33d6ff; }
  `);

  const st = pg => S.get('gb_tools:' + pg + ':' + dev(), null) || {tools: (START[pg] || []).slice(), cards: {}};
  const save = (pg, s) => S.set('gb_tools:' + pg + ':' + dev(), s);
  const store = () => $('gbToolStore') || (() => { const d = document.createElement('div'); d.id = 'gbToolStore'; document.body.appendChild(d); return d; })();
  const color = k => COL[Math.abs([...k].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % COL.length];

  // every box on the pilot pages gets a stable name (id), so saved layouts and tools always find it
  function scan() {
    PILOT.forEach(pg => {
      const root = $('pg-' + pg); if (!root) return;
      root.querySelectorAll('.panel').forEach(el => {
        if (el.closest('.gbcard')) return;
        const t = titleOf(el); if (!el.id && t) el.id = 'tl-' + slug(t);
        if (!el.id) return;
        if (!reg[el.id]) reg[el.id] = {el, page: pg, title: t || el.id, ph: null};
      });
    });
    Object.keys(reg).forEach(k => { const r = reg[k]; if (r.el.closest('.gbcard') || r.el.parentElement === store()) return; r.title = titleOf(r.el) || r.title; });
  }

  function toTool(k, quiet) {
    const r = reg[k]; if (!r || r.el.dataset.tool === '1') return;
    r.ph = document.createComment('tool:' + k); r.el.parentNode && r.el.parentNode.insertBefore(r.ph, r.el);
    const det = r.el.closest('details.sl-more'); r.el.dataset.tool = '1'; store().appendChild(r.el);
    if (det && !det.querySelector('.panel')) det.hidden = true;
    const s = st(r.page); if (!s.tools.includes(k)) { s.tools.push(k); save(r.page, s); }
    if (!quiet) { GB.toast && GB.toast('🧰 ' + r.title + ' is a tool now: it\'s on the tools bar'); reflow(); }
  }
  function toBox(k) {
    const r = reg[k]; if (!r) return;
    closeCard(k, true);
    delete r.el.dataset.tool;
    const studio = document.documentElement.classList.contains('lt-studio') && r.page === 'lights';
    if (r.ph && r.ph.parentNode && (!studio || r.ph.closest('.lt-shell'))) { r.ph.parentNode.insertBefore(r.el, r.ph); r.ph.remove(); }
    else if (studio) { const b = document.querySelector('.lt-body[data-tb="lights"]'); (b || $('pg-' + r.page)).appendChild(r.el); r.ph && r.ph.remove(); }
    else { $('pg-' + r.page).appendChild(r.el); r.ph && r.ph.remove(); }
    r.ph = null;
    const det = r.el.closest('details.sl-more'); if (det) det.hidden = false;
    const s = st(r.page); s.tools = s.tools.filter(x => x !== k); delete s.cards[k]; save(r.page, s);
    GB.toast && GB.toast('📌 ' + r.title + ' is back on the page'); reflow(); paintBar();
  }
  function reflow() {
    document.querySelectorAll('.lt-tabs button').forEach(b => { const body = document.querySelector(`.lt-body[data-tb="${b.dataset.tb}"]`); b.hidden = !!body && !body.querySelector('.panel, .sl-side'); });
    try { GB.proDJ && GB.proDJ.recompact && GB.proDJ.recompact(); } catch (e) {}
    try { GB.reflowLayout && GB.reflowLayout(); } catch (e) {}
  }

  // ---------------------------------------------------------------- the card
  function openCard(k, pg) {
    const r = reg[k]; if (!r) return;
    pg = pg || GB.page;
    if (cards[k]) { front(cards[k]); return; }
    const s = st(pg), c0 = s.cards[k] || {};
    const card = document.createElement('div'); card.className = 'gbcard'; card.dataset.k = k; card.dataset.pg = pg; card.style.setProperty('--tc', color(k));
    card.innerHTML = `<div class="cb"><span class="grip"></span>
      <button data-cb="lock" title="Lock it in place" aria-label="Lock">${GB.svg('lock')}</button>
      <button data-cb="max" title="Bigger" aria-label="Expand">${GB.svg('full')}</button>
      <button data-cb="pin" title="Put it on the page" aria-label="Put it on the page">${GB.svg('pin')}</button>
      <button data-cb="min" title="Back to the tools bar" aria-label="Minimize"><svg class="ic" viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg></button></div>
      <div class="cbody"></div><div class="rz" aria-hidden="true"></div>`;
    card.querySelector('.grip').innerHTML = '<svg class="ic" viewBox="0 0 24 24" style="width:22px;height:22px;fill:currentColor;opacity:.7"><path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z"/></svg>'; card.setAttribute('aria-label', r.title);
    card.querySelector('.cbody').appendChild(r.el);
    document.body.appendChild(card); cards[k] = card;
    const W = Math.min(innerWidth - 100, c0.w || 520), H = c0.h || null;
    place(card, c0.x != null ? c0.x : (innerWidth - W) / 2 - 30, c0.y != null ? c0.y : Math.max(80, innerHeight * 0.14), W, H);
    if (c0.max) card.classList.add('max'), maxIt(card, true);
    if (c0.locked) card.classList.add('locked');
    paintCard(card); front(card);
    card.addEventListener('pointerdown', () => front(card));
    card.querySelector('[data-cb="lock"]').onclick = () => { card.classList.toggle('locked'); remember(card); paintCard(card); GB.sfx && GB.sfx('tap');
      GB.toast && GB.toast(card.classList.contains('locked') ? '🔒 Locked in place' : '🔓 Unlocked: drag it anywhere'); };
    card.querySelector('[data-cb="max"]').onclick = () => { const on = !card.classList.contains('max'); card.classList.toggle('max', on); maxIt(card, on); remember(card); paintCard(card); };
    card.querySelector('[data-cb="pin"]').onclick = () => toBox(k);
    card.querySelector('[data-cb="min"]').onclick = () => closeCard(k);
    dragIt(card); sizeIt(card);
    s.cards[k] = Object.assign(c0, {open: true}); save(pg, s);
    paintBar(); GB.sfx && GB.sfx('on');
    setTimeout(() => { try { GB.emit && GB.emit('resize'); dispatchEvent(new Event('resize')); } catch (e) {} }, 60);   // boxes that measure themselves (layout editor, meters)
  }
  function closeCard(k, keep) {
    const card = cards[k]; if (!card) return;
    const r = reg[k]; if (r && !keep) store().appendChild(r.el);
    const pg = card.dataset.pg; card.remove(); delete cards[k];
    const s = st(pg); if (s.cards[k]) { s.cards[k].open = false; save(pg, s); }
    paintBar(); if (!keep) GB.sfx && GB.sfx('off');
  }
  function paintCard(card) {
    card.querySelector('[data-cb="lock"]').classList.toggle('on', card.classList.contains('locked'));
    card.querySelector('[data-cb="lock"]').innerHTML = GB.svg(card.classList.contains('locked') ? 'lock' : 'unlock');
    card.querySelector('[data-cb="max"]').classList.toggle('on', card.classList.contains('max'));
  }
  function front(card) { card.style.zIndex = ++zTop; }
  function place(card, x, y, w, h) {
    const bar = $('gbTools'), right = phone() ? innerWidth : innerWidth - (bar && bar.offsetWidth ? bar.offsetWidth + 6 : 70);
    w = Math.max(260, Math.min(w, right - 8)); x = Math.max(4, Math.min(x, right - w)); y = Math.max(4, Math.min(y, innerHeight - 120));
    card.style.left = x + 'px'; card.style.top = y + 'px'; card.style.width = w + 'px';
    if (h) card.style.height = Math.max(140, Math.min(h, innerHeight - y - 8)) + 'px'; else { card.style.height = ''; card.style.maxHeight = (innerHeight - y - 12) + 'px'; }
  }
  function maxIt(card, on) {
    if (on) { card._prev = [card.style.left, card.style.top, card.style.width, card.style.height]; const hd = $('hd'), top = hd ? hd.getBoundingClientRect().bottom + 6 : 20;
      place(card, 120, top, innerWidth - 220, innerHeight - top - 60); }
    else if (card._prev) { [card.style.left, card.style.top, card.style.width, card.style.height] = card._prev; }
  }
  function remember(card) {
    const pg = card.dataset.pg, k = card.dataset.k, s = st(pg), b = card.getBoundingClientRect();
    s.cards[k] = {open: true, x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: card.style.height ? Math.round(b.height) : null,
      locked: card.classList.contains('locked'), max: card.classList.contains('max')};
    if (s.cards[k].max && card._prev) { s.cards[k].x = parseInt(card._prev[0]); s.cards[k].y = parseInt(card._prev[1]); s.cards[k].w = parseInt(card._prev[2]); }
    save(pg, s);
  }
  function dragIt(card) {
    const bar = card.querySelector('.cb'); let sx = 0, sy = 0, ox = 0, oy = 0, on = false;
    bar.addEventListener('pointerdown', e => { if (phone() || card.classList.contains('locked') || card.classList.contains('max') || e.target.closest('button')) return;
      on = true; sx = e.clientX; sy = e.clientY; const b = card.getBoundingClientRect(); ox = b.left; oy = b.top; bar.setPointerCapture(e.pointerId); bar.style.cursor = 'grabbing'; });
    bar.addEventListener('pointermove', e => { if (!on) return; place(card, ox + e.clientX - sx, oy + e.clientY - sy, card.getBoundingClientRect().width, card.style.height ? card.getBoundingClientRect().height : null); });
    const up = () => { if (!on) return; on = false; bar.style.cursor = ''; remember(card); };
    bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
  }
  function sizeIt(card) {
    const rz = card.querySelector('.rz'); let sx = 0, sy = 0, w0 = 0, h0 = 0, on = false;
    rz.addEventListener('pointerdown', e => { if (card.classList.contains('locked')) return; on = true; sx = e.clientX; sy = e.clientY; const b = card.getBoundingClientRect(); w0 = b.width; h0 = b.height; rz.setPointerCapture(e.pointerId); e.stopPropagation(); });
    rz.addEventListener('pointermove', e => { if (!on) return; const b = card.getBoundingClientRect(); place(card, b.left, b.top, w0 + e.clientX - sx, h0 + e.clientY - sy); });
    const up = () => { if (!on) return; on = false; card.classList.remove('max'); paintCard(card); remember(card); dispatchEvent(new Event('resize')); };
    rz.addEventListener('pointerup', up); rz.addEventListener('pointercancel', up);
  }

  // ---------------------------------------------------------------- the tools bar
  const badges = {};
  GB.tools = {
    badge(k, text, tone) { badges[k] = text ? {text: String(text), tone: tone || ''} : null; paintBar(); },
    open: (k) => openCard(k), close: closeCard, toTool, toBox,
  };
  function bar() {
    let b = $('gbTools'); if (b) return b;
    b = document.createElement('nav'); b.id = 'gbTools'; b.setAttribute('aria-label', 'Tools'); document.body.appendChild(b); return b;
  }
  function fitBar() {
    const b = bar(); if (phone()) { const ft = $('ft'), off = ft ? Math.max(0, innerHeight - ft.getBoundingClientRect().top) : 0; b.style.top = ''; b.style.bottom = off + 'px';
      document.documentElement.style.setProperty('--tbh', (off + (b.offsetHeight || 72)) + 'px'); return; }
    const hd = $('hd'), ft = $('ft'); const top = hd ? Math.max(0, hd.getBoundingClientRect().bottom) + 6 : 8; const bot = ft ? Math.max(0, innerHeight - ft.getBoundingClientRect().top) + 6 : 8;
    b.style.top = top + 'px'; b.style.bottom = bot + 'px';
  }
  function paintBar() {
    const pg = GB.page, b = bar(), on = PILOT.includes(pg);
    document.documentElement.classList.toggle('gb-phone', phone());
    const list = on ? st(pg).tools.filter(k => reg[k]) : [];
    document.documentElement.classList.toggle('gb-hastools', list.length > 0);
    b.innerHTML = list.map(k => { const bd = badges[k]; return `<button class="tb${cards[k] ? ' open' : ''}" data-k="${k}" style="--tc:${color(k)}" title="${GB.esc(reg[k].title)}">${GB.svg(ICON[k] || 'gear')}<span>${GB.esc(reg[k].title)}</span>${bd ? `<i class="bdg ${bd.tone}">${GB.esc(bd.text)}</i>` : ''}</button>`; }).join('');
    b.querySelectorAll('.tb').forEach(t => wireTool(t));
    document.querySelectorAll('.gbcard').forEach(c => { c.style.display = c.dataset.pg === pg ? '' : 'none'; });
    fitBar();
  }
  function wireTool(t) {
    const k = t.dataset.k; let timer = 0, drag = null, moved = false;
    t.addEventListener('pointerdown', e => { moved = false; timer = setTimeout(() => { drag = ghost(reg[k].title, e.clientX, e.clientY); t.setPointerCapture(e.pointerId); }, 450); });
    t.addEventListener('pointermove', e => { if (drag) { moved = true; drag.style.left = e.clientX + 'px'; drag.style.top = e.clientY + 'px'; } });
    const end = e => { clearTimeout(timer); if (drag) { drag.remove(); drag = null;
        if (moved) { const over = document.elementFromPoint(e.clientX, e.clientY); if (!(over && over.closest('#gbTools'))) toBox(k); }
        t._skip = true; } };
    t.addEventListener('pointerup', end); t.addEventListener('pointercancel', () => { clearTimeout(timer); if (drag) { drag.remove(); drag = null; } });
    t.addEventListener('click', () => { if (t._skip) { t._skip = false; return; } if (cards[k]) closeCard(k); else openCard(k); });
  }
  function ghost(text, x, y) { const g = document.createElement('div'); g.className = 'gb-ghost'; g.textContent = text; g.style.left = x + 'px'; g.style.top = y + 'px'; document.body.appendChild(g); GB.sfx && GB.sfx('tap'); return g; }

  // long-press a box's title on a pilot page and drag it onto the tools bar: it becomes a tool
  document.addEventListener('pointerdown', e => {
    if (document.documentElement.classList.contains('gb-arr')) return;
    const ph = e.target.closest && e.target.closest('.panel > .ph'); if (!ph || e.target.closest('button, a, input')) return;
    const el = ph.parentElement; if (el.closest('.gbcard') || !el.id || !reg[el.id] || !PILOT.includes(GB.page) || reg[el.id].page !== GB.page) return;
    let g = null; const k = el.id;
    const t = setTimeout(() => { g = ghost(reg[k].title, e.clientX, e.clientY); bar().classList.add('drop'); document.documentElement.classList.add('gb-hastools'); fitBar(); }, 500);
    const mv = ev => { if (!g) { if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 12) clearTimeout(t); return; } ev.preventDefault(); g.style.left = ev.clientX + 'px'; g.style.top = ev.clientY + 'px'; };
    const up = ev => { clearTimeout(t); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!g) return; g.remove(); bar().classList.remove('drop');
      const over = document.elementFromPoint(ev.clientX, ev.clientY); if (over && over.closest('#gbTools')) { toTool(k); paintBar(); } else paintBar(); };
    addEventListener('pointermove', mv, {passive: false}); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });

  // ---------------------------------------------------------------- TOOLS on the rail: every tool, every page
  function allTools() {
    if ($('gbToolsAll')) return;
    const names = {}; (GB.PAGES || []).forEach(p => names[p.id] = p.label);
    const ov = document.createElement('div'); ov.id = 'gbToolsAll';
    ov.innerHTML = `<div class="ta"><button class="btn x" type="button">Close</button><h2>TOOLS</h2>` + PILOT.map(pg => {
      const ks = st(pg).tools.filter(k => reg[k]); if (!ks.length) return '';
      return `<h3>${names[pg] || pg}</h3><div class="grid">` + ks.map(k => `<button data-k="${k}" data-pg="${pg}" style="--tc:${color(k)}">${GB.svg(ICON[k] || 'gear')}<span>${GB.esc(reg[k].title)}</span></button>`).join('') + '</div>';
    }).join('') + `</div>`;
    document.body.appendChild(ov);
    ov.onclick = e => { if (e.target === ov || e.target.closest('.x')) ov.remove(); };
    ov.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { ov.remove(); openCard(b.dataset.k, GB.page); });
  }
  function railKey() {
    const rail = $('rail'); if (!rail || rail.querySelector('.rail-tools')) return;
    const b = document.createElement('button'); b.className = 'rail-tools'; b.dataset.g = 'system'; b.style.setProperty('--c', '#33d6ff'); b.setAttribute('aria-label', 'All tools');
    b.innerHTML = '<span class="rl">TOOLS</span>' + GB.svg('gear'); b.onclick = () => { GB.sfx && GB.sfx('nav'); allTools(); };
    const shut = rail.querySelector('.rail-shut'); rail.insertBefore(b, shut || rail.querySelector(':scope > .tail'));
  }

  // 🔗 anything that jumps to a box (a feed picked on LIVE, a help link, a game's board) opens that box's card when it's a tool
  const _siv = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) {
    try {
      const t = this.closest && this.closest('.panel[data-tool="1"]');
      if (t && t.id && reg[t.id]) { if (!cards[t.id]) openCard(t.id); else front(cards[t.id]); if (this !== t) return _siv.call(this, o); return; }
    } catch (e) {}
    return _siv.call(this, o);
  };
  // ---------------------------------------------------------------- start
  let ready = false;
  function apply() {
    scan();
    if (!S.get('gb_tools_mig1', false)) {                              // the first time: SETUP and LIGHTS lay themselves out fresh around the tools
      try { Object.keys(localStorage).filter(k => /^gb_lay3:(setup|lights):/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      S.set('gb_tools_mig1', true);
    }
    if (!S.get('gb_tools_mig2', false)) {                              // Oct 20 evening: the other pages too
      try { Object.keys(localStorage).filter(k => /^gb_lay3:(dj|prodj|music|text|feeds|score|looks|scenes|home|prohome|art|autoloops):/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      S.set('gb_tools_mig2', true);
    }
    PILOT.forEach(pg => st(pg).tools.forEach(k => { if (reg[k]) toTool(k, true); }));
    ready = true; reflow(); railKey(); paintBar();
    PILOT.forEach(pg => { const s = st(pg); Object.keys(s.cards || {}).forEach(k => { if (s.cards[k].open && reg[k]) openCard(k, pg); }); });
    paintBar();
  }
  GB.on('ready', () => setTimeout(apply, 900));
  GB.on('page', () => { if (!ready) return; setTimeout(() => { scan(); PILOT.forEach(pg => st(pg).tools.forEach(k => { if (reg[k] && reg[k].el.dataset.tool !== '1') toTool(k, true); })); reflow(); paintBar(); }, 200); });
  let rzT = 0; addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (ready) { paintBar(); Object.values(cards).forEach(c => { const b = c.getBoundingClientRect(); place(c, b.left, b.top, b.width, c.style.height ? b.height : null); }); } }, 150); });
  addEventListener('scroll', () => ready && fitBar(), {passive: true});
  addEventListener('keydown', e => { if (e.key !== 'Escape') return; const top = Object.values(cards).sort((a, b) => (+b.style.zIndex) - (+a.style.zIndex))[0]; if (top && !document.querySelector('.sheet')) closeCard(top.dataset.k); });
  GB.on('status', () => { if (!ready || !reg.suLicPanel) return; const lic = GB.pro === true; if (!!badges.suLicPanel !== lic) GB.tools.badge('suLicPanel', lic ? '✓' : null); });
})();
