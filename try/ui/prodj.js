/* 🎛️ PRO DJ (Oct 16, Graham): the DJ page turns into a Pro control center.
   - A PRO DJ switch on the DJ page (Pro licenses only). Flipping it re-powers the console: every key goes dark and
     flickers back on (same power-on as the intro) in the Pro palette.
   - In Pro DJ the DJ page also holds the Pro boxes: fader board, loop banks, loop launchers and the cue list
     (borrowed from their own pages while you're on DJ, handed back when you leave).
   - The three keys under the Live wall (Mirror · Full view · Lights) become 6 assignable Pro keys. Hold one (or right-click)
     to pick what it does. Mirror, Full view and Lights move into the ⋯ key.
   - ✏️ ARRANGE (Pro DJ + the Pro pages, tablets and computers): drag any box, pull its corner to resize. Boxes snap to a fine,
     invisible grid and push each other out of the way. Each page remembers its own layout per device shape; Reset puts it back. */
(function () {
  'use strict';
  const {$} = GB, S = GB.store;
  const PRO_PAGES = ['shows', 'autoloops', 'cues', 'board', 'ops'];
  const BORROW = [['fdPanel', 'board'], ['lpPanel', 'board'], ['alPanel', 'autoloops'], ['cuPanel', 'cues']];
  const COLS = 48, ROW = 8;                       // the invisible grid: 48 columns, 8 px rows
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches && S.get('gb_intro_motion') !== 'full';
  const isOn = () => GB.pro === true && S.get('gb_prodj') === '1';

  GB.css(`
  /* ---- Pro DJ palette: deep teal-navy panels, gold / teal / orchid accents */
  html.prodj { --panel:#0c1420; --line:#1d3247; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+1) { --c:#ffd21a !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+2) { --c:#4de8c8 !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+3) { --c:#e45cff !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+4) { --c:#ff9f5a !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+5) { --c:#33d6ff !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+6) { --c:#7dffb2 !important; }
  html.prodj #pg-dj > .panel.box { box-shadow:inset 0 0 0 1px #4de8c822; }
  html.prodj #rail button[data-p=dj] { background:linear-gradient(160deg,#fff4cc 0%,#ffd21a 45%,#4de8c8 100%); }
  /* ---- the switch */
  #pdSw { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  #pdSw .pdT { flex:1 1 200px; min-width:0; }
  #pdSw .pdT b { display:block; font:800 calc(20px * var(--fs, 1))/1 var(--cond); letter-spacing:3px; }
  #pdSw .pdT small { color:var(--dim); font-size:calc(13px * var(--fs, 1)); }
  #pdGo { min-height:56px; padding:0 22px; font-size:calc(18px * var(--fs, 1)); letter-spacing:3px; }
  html.prodj #pdGo { background:linear-gradient(120deg,#ffd21a,#4de8c8); color:#000; box-shadow:0 0 24px #4de8c866; }
  #pdArr { min-height:56px; }
  /* ---- the 6 Pro keys under the wall */
  #proKeys { display:none; grid-template-columns:repeat(6, minmax(0,1fr)) auto; gap:6px; }
  html.prodj #proKeys { display:grid; }
  html.prodj #view .seg { display:none; }
  #proKeys .btn { min-height:58px; padding:4px 2px; flex-direction:column; gap:2px; font-size:calc(12px * var(--fs, 1)); letter-spacing:1px; line-height:1.05; touch-action:none; user-select:none; -webkit-user-select:none; }
  #proKeys .btn .pe { font-size:calc(20px * var(--fs, 1)); line-height:1; }
  #proKeys .btn.on { background:var(--c); color:#000; box-shadow:0 0 18px var(--c); }
  #proKeys .btn.hit { filter:brightness(1.8); }
  #proKeys .more { width:40px; min-width:40px; font-size:20px; }
  @media (max-width:520px) { #proKeys { grid-template-columns:repeat(3, minmax(0,1fr)); } #proKeys .more { grid-column:span 3; width:auto; min-height:36px; } }
  /* ---- arrange: the grid takes over #main; nobody sees the grid itself */
  #main.lay { display:grid !important; grid-template-columns:repeat(${COLS}, minmax(0,1fr)); grid-auto-rows:${ROW}px; gap:0; align-items:stretch; }
  #main.lay > #view, #main.lay > #pages, #main.lay .page.on { display:contents; }
  #main.lay .lay-it { margin:5px; min-height:0; min-width:0; overflow:auto; position:relative; }
  #main.lay .lay-it.panel:not(.box) { overflow:hidden; }
  html.gb-arr #main.lay .lay-it { outline:2px dashed #4de8c899; outline-offset:-2px; }
  .lay-hand { position:absolute; inset:0; z-index:30; cursor:grab; background:#4de8c80d; touch-action:none; display:flex; align-items:flex-start; justify-content:center; }
  .lay-hand span { margin-top:6px; background:#000c; color:#4de8c8; border:1px solid #4de8c8; border-radius:999px; padding:3px 12px; font:700 12px var(--cond); letter-spacing:2px; text-transform:uppercase; pointer-events:none; max-width:90%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lay-hand.drag { cursor:grabbing; background:#4de8c826; }
  .lay-grip { position:absolute; right:0; bottom:0; width:34px; height:34px; z-index:31; cursor:nwse-resize; touch-action:none;
    background:linear-gradient(135deg, transparent 50%, #4de8c8 50%); border-bottom-right-radius:12px; }
  #layBar { position:fixed; left:50%; top:calc(8px + env(safe-area-inset-top)); transform:translateX(-50%); z-index:960; display:none; align-items:center; gap:8px;
    background:#05080dEE; border:2px solid #4de8c8; border-radius:999px; padding:6px 8px 6px 16px; box-shadow:0 10px 40px #000a; max-width:calc(100vw - 24px); }
  html.gb-arr #layBar { display:flex; }
  #layBar b { font:800 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:#4de8c8; white-space:nowrap; }
  #layBar small { color:var(--dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
  #layBar .btn { min-height:40px; padding:0 14px; }
  @media (max-width:820px) { #layBar small { display:none; } }
  #layFab { position:fixed; right:calc(14px + env(safe-area-inset-right)); bottom:calc(58px + env(safe-area-inset-bottom)); z-index:300; display:none; min-height:44px; padding:0 16px;
    border-radius:999px; background:#05080dDD; border:2px solid #4de8c8; color:#4de8c8; font:800 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:2px; box-shadow:0 6px 24px #000a; cursor:pointer; }
  #layFab.show { display:inline-flex; align-items:center; gap:6px; }
  html.gb-arr #layFab { display:none; }
  `);

  // ================================================================ the PRO DJ switch (top of the DJ page)
  GB.panel('dj', 1, el => {
    el.classList.add('box'); el.id = 'pdPanel'; el.style.setProperty('--c', '#ffd21a'); el.hidden = true;
    el.innerHTML = `<div id="pdSw"><div class="pdT"><b id="pdTitle">PRO DJ</b><small id="pdSub">Switch the console into the Pro control center.</small></div>
      <button class="btn c" id="pdArr" style="--c:#4de8c8" hidden>✏️ ARRANGE</button>
      <button class="btn c" id="pdGo" style="--c:#ffd21a">⚡ PRO DJ</button></div>`;
    el.querySelector('#pdGo').onclick = () => setOn(!isOn(), true);
    el.querySelector('#pdArr').onclick = () => arrange(true);
  });
  function paintSwitch() {
    const p = $('pdPanel'); if (!p) return;
    p.hidden = GB.pro !== true;
    const on = isOn();
    $('pdGo').textContent = on ? '✕ EXIT PRO' : '⚡ PRO DJ';
    $('pdTitle').textContent = on ? 'PRO DJ · ON' : 'PRO DJ';
    $('pdSub').textContent = on ? 'Faders, loops, cues and 6 Pro keys are on this page. Hold a Pro key to change what it does.' : 'Switch the console into the Pro control center.';
    $('pdArr').hidden = !on || innerWidth < 700;
  }

  // ================================================================ borrowing the Pro boxes
  const home = {};                                 // id -> {parent, next}
  function borrow(want) {
    BORROW.forEach(([id]) => {
      const el = $(id); if (!el) return;
      if (want) {
        if (el.parentElement && el.parentElement.id === 'pg-dj') return;
        home[id] = {parent: el.parentElement, next: el.nextSibling};
        el.dataset.home = '1'; $('pg-dj').appendChild(el);
      } else if (home[id] && el.parentElement && el.parentElement.id === 'pg-dj') {
        const h = home[id]; try { h.parent.insertBefore(el, h.next && h.next.parentElement === h.parent ? h.next : null); } catch (e) { h.parent.appendChild(el); }
        delete el.dataset.home; delete home[id];
        el.style.gridColumn = el.style.gridRow = ''; el.classList.remove('lay-it');
      }
    });
  }
  function syncBorrow() { borrow(isOn() && GB.page === 'dj'); }

  // ================================================================ on / off + the power-on flicker
  function setOn(on, animate) {
    if (on && GB.pro !== true) return;
    S.set('gb_prodj', on ? '1' : '0');
    if (animate) flicker(() => apply(on, true)); else apply(on);
    if (animate) { GB.sfx && GB.sfx(on ? 'ok' : 'tap'); GB.toast && GB.toast(on ? '🎛️ Pro DJ on' : '🎚️ Back to the regular DJ page'); }
  }
  // 🔀 the DJ key itself moves: down into the PRO section (gold-teal, "PRO DJ") when Pro DJ is on, back up under MUSIC when it's off
  function railMove(on, animate) {
    const rail = $('rail'), b = rail && rail.querySelector('button[data-p=dj]'); if (!b) return;
    const sep = rail.querySelector('.rail-sep[data-g=pro]'), music = rail.querySelector('button[data-p=music]');
    const target = on ? sep : music; if (!target) return;
    if (b.previousElementSibling === target) { label(b, on); return; }
    const r0 = b.getBoundingClientRect();
    target.after(b); label(b, on);
    if (!animate || calm()) return;
    const r1 = b.getBoundingClientRect(), dy = r0.top - r1.top;
    b.style.transition = 'none'; b.style.transform = 'translateY(' + dy + 'px)'; b.style.zIndex = 5; b.classList.add('gbi-off');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      b.style.transition = 'transform .7s cubic-bezier(.5,0,.2,1)'; b.style.transform = '';
      setTimeout(() => { b.classList.remove('gbi-off'); b.classList.add('gbi-boot'); }, 520);
      setTimeout(() => { b.classList.remove('gbi-boot'); b.style.transition = b.style.zIndex = ''; }, 1400);
    }));
  }
  function label(b, on) { const l = b.querySelector('.rl'); if (l) l.textContent = on ? 'PRO DJ' : 'DJ'; b.setAttribute('aria-label', on ? 'Pro DJ' : 'DJ'); }
  function apply(on, animate) {
    railMove(!!on, animate);
    document.documentElement.classList.toggle('prodj', !!on);
    if (!on && arranging) arrange(false);
    syncBorrow(); paintSwitch(); paintKeys(); layout();
  }
  function flicker(swap) {
    if (calm()) { const m = $('main'); m.style.transition = 'opacity .25s'; m.style.opacity = '0.2'; setTimeout(() => { swap(); m.style.opacity = ''; setTimeout(() => m.style.transition = '', 300); }, 250); return; }
    const SEL = '#main .btn, #main .pad, #main .tile, #main .chip, #main .seg > *, #main .ph, #main .read, #main .mfad, #rail button[data-p=dj], #main canvas';
    const vis = n => { const b = n.getBoundingClientRect(); return b.width && b.bottom > 0 && b.top < innerHeight; };
    const off = list => list.forEach(n => n.classList.add('gbi-off'));
    // 1) the old console powers down (quick dim), 2) swap to the new layout + palette while dark, 3) every key flickers on in a sweep
    const old = [...document.querySelectorAll(SEL)].filter(vis); off(old);
    const boxes = () => [...document.querySelectorAll('#main .panel, #main .modebar')].filter(vis);
    boxes().forEach(b => b.classList.add('gbi-offbox'));
    setTimeout(() => {
      old.forEach(n => n.classList.remove('gbi-off'));
      swap();
      const keys = [...document.querySelectorAll(SEL)].filter(vis).slice(0, 400), bx = boxes();
      off(keys); bx.forEach(b => b.classList.add('gbi-offbox'));
      const pat = ['scan', 'columns', 'center', 'sparkle'][Math.floor(Math.random() * 4)], W = innerWidth, H = innerHeight;
      const when = n => { const r = n.getBoundingClientRect(), x = (r.left + r.width / 2) / W, y = (r.top + r.height / 2) / H;
        return pat === 'scan' ? y : pat === 'columns' ? (Math.floor(x * 6) / 6) * .8 + y * .2 : pat === 'center' ? Math.hypot(x - .5, y - .5) * 1.4 : Math.random(); };
      const T = 1100;
      keys.forEach(n => { const at = 60 + when(n) * T + Math.random() * 120;
        setTimeout(() => { n.classList.remove('gbi-off'); n.classList.add('gbi-boot'); setTimeout(() => n.classList.remove('gbi-boot'), 760); }, at); });
      bx.forEach(b => { const at = 40 + when(b) * T; setTimeout(() => b.classList.remove('gbi-offbox'), at); });
      setTimeout(() => { keys.forEach(n => n.classList.remove('gbi-off', 'gbi-boot')); document.querySelectorAll('.gbi-offbox').forEach(b => b.classList.remove('gbi-offbox')); }, T + 1200);
    }, 280);
  }

  // ================================================================ the 6 Pro keys under the wall
  const ACT = {
    blackout: {e: '⬛', n: 'Blackout', c: 'var(--peri)', tap: () => GB.djHit('blackout'), lit: d => !!d.blackout},
    strobe: {e: '⚡', n: 'Strobe', c: 'var(--cyan)', tap: () => GB.djHit('strobe')},
    flash: {e: '☀️', n: 'Flash', c: 'var(--gold)', tap: () => GB.djHit('flash')},
    drop: {e: '💥', n: 'Drop', c: 'var(--pink)', tap: () => GB.djHit('drop')},
    fire: {e: '🔥', n: 'Fire burst', c: 'var(--orange)', tap: () => GB.djHit('fire')},
    confetti: {e: '🎊', n: 'Confetti', c: 'var(--lav)', tap: () => GB.djHit('confetti')},
    lightning: {e: '🌩️', n: 'Lightning', c: '#8fb4ff', tap: () => GB.djHit('lightning')},
    shockwave: {e: '🌀', n: 'Shockwave', c: 'var(--violet)', tap: () => GB.djHit('shockwave')},
    colorbomb: {e: '🎨', n: 'Color bomb', c: 'var(--amber)', tap: () => GB.djHit('colorbomb')},
    countdown: {e: '3️⃣', n: '3-2-1', c: 'var(--orchid)', tap: () => GB.djHit('countdown')},
    cool: {e: '🌙', n: 'Cool down', c: 'var(--lav)', hold: true, lit: d => !!d.cool},
    color: {e: '🎨', n: 'Color lock', c: 'var(--orange)', lit: d => !!d.color, tap: async () => {
      const d = (GB.status || {}).dj || {}; let cols = []; try { cols = JSON.parse(S.get('gb_dj_colors') || '[]'); } catch (e) {}
      if (!cols.length) cols = ['#ff1a1a'];
      if (await GB.djPost(d.color ? {color: false} : {colors: cols, color: true})) GB.toast(d.color ? '🌈 Back to the full show' : '🎨 Color locked'); }},
    lookn: {e: '⏭️', n: 'Next look', c: 'var(--orange)', tap: () => GB.control({step: 'look+'})},
    lookp: {e: '⏮️', n: 'Prev look', c: 'var(--orange)', tap: () => GB.control({step: 'look-'})},
    effn: {e: '✨', n: 'Next effect', c: 'var(--lav)', tap: () => GB.control({step: 'effect+'})},
    tap: {e: '🥁', n: 'Tap tempo', c: 'var(--cyan)', tap: () => GB.djPost({tap: true})},
    loopsoff: {e: '⏹️', n: 'Stop loops', c: '#ff9f5a', tap: () => GB.loopsStopAll && GB.loopsStopAll()},
    release: {e: '🚨', n: 'Release overrides', c: 'var(--red)', tap: () => GB.overrideRelease ? GB.overrideRelease() : GB.post('/api/override', {release: true})},
    fullview: {e: '🖥️', n: 'Full view', c: 'var(--gold)', tap: () => GB.setFull && GB.setFull(true)},
  };
  const DEF = ['blackout', 'strobe', 'cool', 'color', 'lookn', 'tap'];
  const keysNow = () => { let k = []; try { k = JSON.parse(S.get('gb_prokeys') || '[]'); } catch (e) {} return DEF.map((d, i) => ACT[k[i]] ? k[i] : d); };
  function buildKeys() {
    const seg = document.querySelector('#view .seg'); if (!seg || $('proKeys')) return;
    const row = document.createElement('div'); row.id = 'proKeys'; seg.after(row); paintKeys();
  }
  function paintKeys() {
    const row = $('proKeys'); if (!row) return;
    const ks = keysNow(); row.innerHTML = '';
    ks.forEach((k, i) => {
      const a = ACT[k], b = document.createElement('button'); b.className = 'btn c'; b.dataset.k = k; b.dataset.i = i; b.style.setProperty('--c', a.c);
      b.innerHTML = `<span class="pe">${a.e}</span><span>${GB.esc(a.n)}</span>`; b.title = a.n + ' (hold to change this key)';
      wire(b, k, i); row.appendChild(b);
    });
    const m = document.createElement('button'); m.className = 'btn more'; m.textContent = '⋯'; m.setAttribute('aria-label', 'Mirror, full view, lights and key setup');
    m.onclick = () => GB.sheet('Live wall', [
      {label: '🖥️ Full view', onclick: () => GB.setFull && GB.setFull(true)}, {label: '🪞 Mirror', onclick: () => GB.go('scenes', 'mirrorPanel')},
      {label: '💡 Lights', onclick: () => GB.go('lights')}, {label: '🎛️ Change the Pro keys', sub: 'or hold any key', onclick: () => pickSlot()},
      {label: '↺ Reset the Pro keys', onclick: () => { S.set('gb_prokeys', ''); paintKeys(); GB.toast('Pro keys reset'); }}]);
    row.appendChild(m);
    paintLit();
  }
  function paintLit() { const d = (GB.status || {}).dj || {}; document.querySelectorAll('#proKeys .btn[data-k]').forEach(b => { const a = ACT[b.dataset.k]; b.classList.toggle('on', !!(a && a.lit && a.lit(d))); }); }
  function wire(b, k, i) {
    const a = ACT[k]; let t0 = 0, lp = 0, keep = 0, latched = false, longed = false;
    b.addEventListener('contextmenu', e => { e.preventDefault(); assign(i); });
    b.addEventListener('pointerdown', e => {
      if (e.button > 0) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {}
      t0 = performance.now(); longed = false;
      lp = setTimeout(() => { longed = true; clearInterval(keep); if (a.hold && !latched) GB.djPost({cool: false}); assign(i); }, a.hold ? 1400 : 650);   // hold: change the key (cool down needs a longer hold, it's a hold key)
      b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 200);
      if (a.hold) { latched = !!(((GB.status || {}).dj || {}).cool_latched);
        if (!latched) { GB.djPost({cool: true, ttl: 1.5}); keep = setInterval(() => GB.djPost({cool: true, ttl: 1.5}), 500); b.classList.add('on'); } }
    });
    const up = e => {
      clearTimeout(lp); clearInterval(keep); if (!t0) return; const quick = performance.now() - t0 < 350; t0 = 0;
      if (longed) return;
      if (a.hold) {
        if (latched) { GB.djPost({cool: false}); b.classList.remove('on'); GB.toast('✨ Lights coming back up'); }
        else if (quick && e.type === 'pointerup') { GB.djPost({cool: true, latch: true}); GB.toast('🌙 Cool down latched. Tap again to release'); }
        else { GB.djPost({cool: false}); b.classList.remove('on'); }
        return;
      }
      if (e.type === 'pointerup') { GB.sfx && GB.sfx('tap'); a.tap && a.tap(); }
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  function assign(i) {
    const cur = keysNow()[i];
    GB.sheet('Pro key ' + (i + 1) + ': pick what it does', Object.keys(ACT).map(k => ({label: ACT[k].e + ' ' + ACT[k].n + (k === cur ? '  ✓' : ''),
      sub: ACT[k].hold ? 'hold, or tap to latch' : '', onclick: () => { const ks = keysNow(); ks[i] = k; S.set('gb_prokeys', JSON.stringify(ks)); paintKeys(); GB.toast('Key ' + (i + 1) + ': ' + ACT[k].n); }})));
  }
  function pickSlot() { GB.sheet('Which key?', keysNow().map((k, i) => ({label: (i + 1) + '. ' + ACT[k].e + ' ' + ACT[k].n, onclick: () => assign(i)}))); }

  // ================================================================ ✏️ arrange: an invisible fine grid
  let arranging = false;
  const bucket = () => (innerWidth >= 1000 && innerWidth >= innerHeight) ? 'wide' : 'tall';
  const pageKey = () => GB.page === 'dj' ? (isOn() ? 'prodj' : null) : (PRO_PAGES.includes(GB.page) && GB.pro === true ? GB.page : null);
  const canArrange = () => innerWidth >= 700 && !!pageKey();
  const store = k => 'gb_lay:' + k + ':' + bucket();
  function items() {
    const pg = $('pg-' + GB.page); if (!pg) return [];
    const view = $('view'), out = [];
    const v = [[view.querySelector(':scope > .panel:not(.reads-panel)'), 'v:wall'], [view.querySelector(':scope > .modebar'), 'v:mode'], [view.querySelector(':scope > .reads-panel'), 'v:reads']];
    v.forEach(([el, id]) => { if (el) { el.dataset.lk = id; out.push(el); } });
    let n = 0;
    [...pg.children].forEach(el => { if (!el.classList.contains('panel')) return; if (el.hidden || el.id === 'pdPanel' && false) return;
      el.dataset.lk = el.id || ('p' + (n)); if (!el.id) n++; out.push(el); });
    return out.filter(el => !el.hidden && getComputedStyle(el).display !== 'none' || el.classList.contains('lay-it'));
  }
  function measure(list) {
    const m = $('main'), mr = m.getBoundingClientRect(), cs = getComputedStyle(m);
    const pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), pt = parseFloat(cs.paddingTop), cw = (mr.width - pl - pr) / COLS;
    const L = {};
    list.forEach(el => { const r = el.getBoundingClientRect(); if (!r.width) return;
      L[el.dataset.lk] = {x: Math.max(0, Math.round((r.left - mr.left - pl) / cw)), y: Math.max(0, Math.round((r.top - mr.top - pt + scrollY * 0) / ROW)),
        w: Math.max(6, Math.round(r.width / cw)), h: Math.max(6, Math.ceil(r.height / ROW) + 1)}; });
    Object.values(L).forEach(p => { if (p.x + p.w > COLS) p.w = COLS - p.x; });
    return L;
  }
  const load = k => { try { return JSON.parse(S.get(store(k)) || 'null'); } catch (e) { return null; } };
  const save = (k, L) => S.set(store(k), JSON.stringify(L));
  function clearLay() {
    const m = $('main'); m.classList.remove('lay');
    document.querySelectorAll('.lay-it').forEach(el => { el.classList.remove('lay-it'); el.style.gridColumn = el.style.gridRow = ''; });
    document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove());
  }
  function place(el, p) { el.classList.add('lay-it'); el.style.gridColumn = (p.x + 1) + ' / span ' + p.w; el.style.gridRow = (p.y + 1) + ' / span ' + p.h; }
  let cur = null;                                   // {key, L}
  function layout() {
    const k = canArrange() ? pageKey() : null, L = k && load(k);
    $('layFab') && $('layFab').classList.toggle('show', !!k && GB.page !== 'dj');   // DJ has its own ARRANGE key in the Pro DJ box
    if (!k || (!L && !arranging)) { clearLay(); cur = null; return; }
    const list = items(); const LL = L || measure(list);
    // new boxes (not in the saved layout yet) go underneath everything
    let bottom = Math.max(0, ...Object.values(LL).map(p => p.y + p.h));
    list.forEach(el => { if (!LL[el.dataset.lk]) { LL[el.dataset.lk] = {x: 0, y: bottom, w: 24, h: 30}; bottom += 30; } });
    clearLay(); $('main').classList.add('lay');
    list.forEach(el => place(el, LL[el.dataset.lk]));
    cur = {key: k, L: LL};
    if (arranging) handles();
  }
  const hits = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  function settle(L, moved) {                        // push everything that overlaps the moved box down, top to bottom
    const ids = Object.keys(L).filter(i => i !== moved).sort((a, b) => L[a].y - L[b].y || L[a].x - L[b].x);
    const done = [moved];
    ids.forEach(i => { const p = L[i]; let guard = 0;
      for (;;) { const o = done.find(j => hits(p, L[j])); if (!o || guard++ > 200) break; p.y = L[o].y + L[o].h; }
      done.push(i); });
  }
  function handles() {
    document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove());
    document.querySelectorAll('#main .lay-it').forEach(el => {
      const id = el.dataset.lk, ph = el.querySelector('.ph span, .ph'), name = id === 'v:wall' ? 'Live wall' : id === 'v:mode' ? 'Now playing' : id === 'v:reads' ? 'Tempo & look' : id === 'pdPanel' ? 'Pro DJ switch' : (ph ? ph.textContent.trim().split('\n')[0] : 'Box');
      const h = document.createElement('div'); h.className = 'lay-hand'; h.innerHTML = '<span>⠿ ' + GB.esc(name.slice(0, 40)) + '</span>';
      const g = document.createElement('div'); g.className = 'lay-grip'; g.setAttribute('aria-label', 'Resize');
      el.appendChild(h); el.appendChild(g);
      drag(h, el, id, false); drag(g, el, id, true);
    });
  }
  function drag(handle, el, id, resize) {
    handle.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); try { handle.setPointerCapture(e.pointerId); } catch (_) {}
      const m = $('main'), cs = getComputedStyle(m), cw = (m.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / COLS;
      const p0 = Object.assign({}, cur.L[id]), x0 = e.clientX, y0 = e.clientY; handle.classList.add('drag'); el.style.zIndex = 40;
      const mv = ev => {
        const dx = Math.round((ev.clientX - x0) / cw), dy = Math.round((ev.clientY - y0) / ROW), p = cur.L[id];
        if (resize) { p.w = Math.max(6, Math.min(COLS - p0.x, p0.w + dx)); p.h = Math.max(6, p0.h + dy); }
        else { p.x = Math.max(0, Math.min(COLS - p0.w, p0.x + dx)); p.y = Math.max(0, p0.y + dy); }
        place(el, p);
        if (ev.clientY > innerHeight - 40) scrollBy(0, 12); else if (ev.clientY < 60) scrollBy(0, -12);
      };
      const end = () => { handle.removeEventListener('pointermove', mv); handle.classList.remove('drag'); el.style.zIndex = '';
        settle(cur.L, id); Object.keys(cur.L).forEach(k => { const n = document.querySelector('#main [data-lk="' + CSS.escape(k) + '"].lay-it'); if (n) place(n, cur.L[k]); });
        save(cur.key, cur.L); };
      handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', end, {once: true}); handle.addEventListener('pointercancel', end, {once: true});
    });
  }
  function arrange(on) {
    if (on && !canArrange()) { GB.toast('Arrange works on tablets and computers, on the Pro DJ page and the Pro pages'); return; }
    arranging = on; document.documentElement.classList.toggle('gb-arr', on);
    if (on) { layout(); if (cur && !load(cur.key)) save(cur.key, cur.L); handles(); GB.sfx && GB.sfx('tap'); }
    else { document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove()); layout(); GB.toast && GB.toast('✅ Layout saved'); }
  }
  function reset() { const k = pageKey(); if (!k) return; S.set(store(k), ''); arranging = false; document.documentElement.classList.remove('gb-arr'); clearLay(); cur = null; layout(); GB.toast('↺ Back to the standard layout'); }

  function chrome() {
    const bar = document.createElement('div'); bar.id = 'layBar';
    bar.innerHTML = '<b>✏️ ARRANGING</b><small>Drag a box to move it. Pull the corner to resize.</small><button class="btn" id="layReset">Reset</button><button class="btn c" id="layDone" style="--c:#4de8c8">Done</button>';
    document.body.appendChild(bar);
    bar.querySelector('#layDone').onclick = () => arrange(false); bar.querySelector('#layReset').onclick = reset;
    const fab = document.createElement('button'); fab.id = 'layFab'; fab.type = 'button'; fab.innerHTML = '✏️ ARRANGE'; fab.onclick = () => arrange(true);
    document.body.appendChild(fab);
  }

  // ================================================================ wiring
  GB.on('ready', () => { chrome(); buildKeys(); if (GB.pro === true) apply(isOn()); else paintSwitch(); });
  GB.on('pro', v => { if (!v && document.documentElement.classList.contains('prodj')) document.documentElement.classList.remove('prodj'); apply(v && isOn()); });
  GB.on('page', () => { if (arranging) { arranging = false; document.documentElement.classList.remove('gb-arr'); } syncBorrow(); layout(); paintSwitch(); });
  GB.on('status', paintLit);
  let rt = 0, sig = '';                           // re-lay only when the screen shape really changes (phone turned, window resized past a size)
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const n = bucket() + (canArrange() ? 1 : 0) + innerWidth;
    if (n !== sig && !document.querySelector('.lay-hand.drag')) { sig = n; layout(); } paintSwitch(); }, 250); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && arranging) arrange(false); });
})();
