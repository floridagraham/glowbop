/* 🎛️ PRO DJ (Oct 16, Graham): the DJ page turns into a Pro control center.
   - A PRO DJ switch on the DJ page (Pro licenses only). Flipping it re-powers the console: every key goes dark and
     flickers back on (same power-on as the intro) in the Pro palette.
   - In Pro DJ the DJ page also holds the Pro boxes: fader board, loop banks, loop launchers and the cue list
     (borrowed from their own pages while you're on DJ, handed back when you leave).
   - The three keys under the Live wall (Mirror · Full view · Lights) become 6 assignable Pro keys. Hold one (or right-click)
     to pick what it does. Mirror, Full view and Lights move into the ⋯ key.
   - ✏️ ARRANGE (every page, everyone, tablets and computers; Oct 16): every page starts on a tidy ⚡ template. Drag any box, pull its corner to resize. Boxes snap to a fine,
     invisible grid and push each other out of the way. Each page remembers its own layout per device shape; Reset puts it back. */
(function () {
  'use strict';
  const {$} = GB, S = GB.store;
  const PRO_PAGES = ['shows', 'autoloops', 'cues', 'board', 'ops', 'home'];
  const BORROW = [['muCard', 'music'], ['fdPanel', 'board'], ['lpPanel', 'board'], ['alPanel', 'autoloops'], ['cuPanel', 'cues']];
  const COLS = 48, ROW = 8;                       // the invisible grid: 48 columns, 8 px rows
  // ⚡ Tidy templates for every page. wide = computers and tablets on their side (3 columns), tall = tablets upright (2 columns).
  //   Each column lists boxes from the top; '#id' means "the box holding that element". Boxes not listed fill the shortest column.
  //   full: boxes that need the whole width, in a band underneath.
  const W3 = ['v:wall', 'v:keys', 'v:mode', 'v:reads'];
  const TPL = {
    dj:     {wide: [[0, 17, ['v:wall', '#djBuild', 'v:mode']], [17, 15, ['djPadsPanel', '#djCool']], [32, 16, ['#djColor', '#djTap', '#djLooks']]],
             tall: [[0, 24, ['v:wall', '#djBuild', '#djCool']], [24, 24, ['djPadsPanel', '#djColor', '#djTap']]]},
    prodj:  {wide: [[0, 17, ['v:wall', 'v:keys', 'muCard', 'v:mode', 'v:reads']], [17, 15, ['#djBuild', '#djCool', '#djColor']], [32, 16, ['djPadsPanel', '#djTap', 'pdPanel', '#djLooks']]],
             tall: [[0, 24, ['v:wall', 'v:keys', 'muCard', 'v:mode', '#djCool', '#djColor']], [24, 24, ['#djBuild', 'djPadsPanel', '#djTap', 'pdPanel', '#djLooks']]]},
    prohome:{wide: [[0, 17, ['v:wall', 'v:mode', 'v:reads']], [17, 15, ['phScenes']], [32, 16, ['phSched']]], tall: [[0, 24, ['v:wall', 'phScenes']], [24, 24, ['phSched']]]},
  };
  GB.layTPL = TPL;                                 // pages add their own templates (GB.layTPL.music = {...})
  // 🧑‍🎨 Graham's own arrangements (Oct 16) ship as the starting layout on those pages
  const DEFAULTS = {"prohome:wide":{"v:wall":{"x":0,"y":10,"w":17,"h":63},"v:mode":{"x":0,"y":0,"w":17,"h":10},"v:reads":{"x":0,"y":123,"w":48,"h":25},"phScenes":{"x":17,"y":0,"w":15,"h":47},"phSched":{"x":32,"y":0,"w":16,"h":47},"v:keys":{"x":0,"y":211,"w":24,"h":6},"grpPanel":{"x":17,"y":47,"w":31,"h":52},"znSubs":{"x":0,"y":99,"w":48,"h":24},"mdHolPanel":{"x":0,"y":148,"w":24,"h":63}},"prohome:tall":{"v:wall":{"x":0,"y":0,"w":24,"h":60},"phScenes":{"x":0,"y":60,"w":24,"h":47},"phSched":{"x":24,"y":0,"w":24,"h":50},"v:keys":{"x":0,"y":107,"w":24,"h":6},"v:mode":{"x":24,"y":50,"w":24,"h":12},"grpPanel":{"x":0,"y":113,"w":24,"h":62},"znSubs":{"x":24,"y":62,"w":24,"h":20},"mdHolPanel":{"x":24,"y":82,"w":24,"h":54}}};
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches && S.get('gb_intro_motion') !== 'full';
  const isOn = () => GB.pro === true && S.get('gb_prodj') === '1';

  GB.css(`
  /* ---- Pro DJ palette: deep teal-navy panels, gold / teal / orchid accents */
  html.prodj { --panel:#0c1420; --line:#1d3247; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+1) { --c:#ff3d9a !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+2) { --c:#33d6ff !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+3) { --c:#9b3dff !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+4) { --c:#ffb23d !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+5) { --c:#cc99ff !important; }
  html.prodj #pg-dj > .panel.box:nth-of-type(6n+6) { --c:#4de8c8 !important; }
  html.prodj #pg-dj > .panel.box { box-shadow:inset 0 0 0 1px #4de8c822; }
  #rail #pdTab { background:#ff3d9a; }   /* GlowBop pink */
  #rail .rail-sep[data-g=pro], #rail button[data-p=pro] { display:none !important; }   /* the PRO DJ / PRO HOME tabs say it; no label row, no tour key */
  #rail button.locked { background:#2a2833 !important; color:#77748a !important; box-shadow:none !important; }
  #rail button.nope { animation:pdNope .35s ease; } @keyframes pdNope { 25% { transform:translateX(-6px); } 75% { transform:translateX(6px); } }
  /* ---- Pro DJ is a tighter console: smaller paddings and keys so more fits on one screen */
  html.prodj #pg-dj > .panel.box { padding:8px 10px 10px; gap:8px; }
  html.prodj #djBuild { min-height:64px; font-size:calc(20px * var(--fs, 1)); }
  html.prodj #djCool, html.prodj #djColor { min-height:50px; font-size:calc(17px * var(--fs, 1)); }
  html.prodj #pg-dj .dj-pads { grid-template-columns:repeat(auto-fill, minmax(84px, 1fr)); gap:6px; }
  html.prodj #pg-dj .dj-pads .tile { min-height:60px; font-size:calc(13px * var(--fs, 1)); }
  html.prodj #pg-dj .dj-pads .tile .em { font-size:calc(22px * var(--fs, 1)); }
  html.prodj #pg-dj .djc-dot { width:calc(34px * var(--fs, 1)); height:calc(34px * var(--fs, 1)); }
  html.prodj #pg-dj .djc-dots { gap:8px; margin:2px 0 6px; }
  html.prodj #pdGo, html.prodj #pdArr { min-height:44px; }
  /* ---- the switch */
  #pdHd { min-height:40px; margin-right:6px; gap:6px; } #pdHd .ic { width:18px; height:18px; fill:currentColor; }
  #pdHd .ps { display:none; } @media (max-width:1100px) { #pdHd .pl { display:none; } #pdHd .ps { display:inline; } } @media (max-width:560px) { #pdHd .ps { display:none; } #pdHd { padding:0 12px; } }
  #pdHd.on { box-shadow:0 0 18px var(--gold); }
  @media (max-width:560px) { #pdHd, #phHd { padding:0 9px !important; margin-right:4px; } #sfx span { display:none; } #sfx { padding:0 10px; } #gbGuideBtn { margin-right:4px; } }   /* phones: the two Pro keys fit next to GUIDE */
  #pdSw { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  #pdSw .pdT { flex:1 1 200px; min-width:0; }
  #pdSw .pdT b { display:block; font:800 calc(20px * var(--fs, 1))/1 var(--cond); letter-spacing:3px; }
  #pdSw .pdT small { color:var(--dim); font-size:calc(13px * var(--fs, 1)); }
  #pdGo { min-height:56px; padding:0 22px; font-size:calc(18px * var(--fs, 1)); letter-spacing:3px; }
  html.prodj #pdGo { box-shadow:0 0 24px #9b3dff88; }
  #pdGo { background:linear-gradient(120deg,#ff3d9a,#9b3dff,#33d6ff); color:#fff; text-shadow:0 1px 3px #0008; }
  #pdArr { min-height:56px; }
  /* ---- the 6 Pro keys under the wall */
  #proKeys { display:none; grid-template-columns:repeat(6, minmax(0,1fr)) auto; gap:6px; }
  #proKeysBox { display:none; } html.prodj #proKeysBox { display:flex; } html.prodj #proKeys { display:grid; }
  html.prodj #view .seg { display:none; }
  #proKeys .btn { min-height:58px; padding:4px 2px; flex-direction:column; gap:2px; font-size:calc(12px * var(--fs, 1)); letter-spacing:1px; line-height:1.05; touch-action:none; user-select:none; -webkit-user-select:none; }
  #proKeys .btn .pe { line-height:1; } #proKeys .btn .pe .ic { width:calc(22px * var(--fs, 1)); height:calc(22px * var(--fs, 1)); fill:currentColor; }
  #proKeys .btn.on { background:var(--c); color:#000; box-shadow:0 0 18px var(--c); }
  #proKeys .btn.hit { filter:brightness(1.8); }
  #proKeys .more { width:40px; min-width:40px; font-size:20px; }
  #proKeysBox.narrow #proKeys { grid-template-columns:repeat(3, minmax(0,1fr)); } #proKeysBox.narrow #proKeys .more { grid-column:span 3; width:auto; min-height:30px; }
  @media (max-width:520px) { #proKeys { grid-template-columns:repeat(3, minmax(0,1fr)); } #proKeys .more { grid-column:span 3; width:auto; min-height:36px; } }
  /* ---- arrange: the grid takes over #main; nobody sees the grid itself */
  #main.lay { display:grid !important; grid-template-columns:repeat(${COLS}, minmax(0,1fr)); grid-auto-rows:${ROW}px; gap:0; align-items:stretch; }
  #main.lay > #view, #main.lay > #pages, #main.lay .page.on { display:contents; }
  #main.lay .lay-it { margin:5px; min-height:0; min-width:0; overflow:auto; position:relative; }
  #main.lay .lay-it.panel:not(.box) { overflow:hidden; }
  /* the Live wall shrinks and grows with its box (the picture redraws to fit) */
  #main.lay .lay-it[data-lk="v:wall"] { display:flex; flex-direction:column; }
  #main.lay .lay-it[data-lk="v:wall"] .wallbox { flex:1 1 auto; min-height:0; overflow:hidden; display:flex; align-items:center; justify-content:center; padding:6px; }
  #main.lay .lay-it[data-lk="v:wall"] .seg { flex:none; }
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
    el.classList.add('box'); el.id = 'pdPanel'; el.style.setProperty('--c', '#9b3dff'); el.hidden = true;
    el.innerHTML = `<div id="pdSw"><div class="pdT"><b id="pdTitle">PRO DJ</b><small id="pdSub">Switch the console into the Pro control center.</small></div>
      <button class="btn c" id="pdArr" style="--c:#4de8c8" hidden>✏️ ARRANGE</button>
      <button class="btn c" id="pdGo" style="--c:#ffd21a">⚡ PRO DJ</button></div>`;
    el.querySelector('#pdGo').onclick = () => setOn(!isOn(), true);
    el.querySelector('#pdArr').onclick = () => arrange(true);
  });
  // ⚡ PRO DJ is a tab on the rail (Oct 16, Graham: no more keys in the top bar). Tap it: the DJ page powers up into Pro DJ.
  // Without Pro it stays grey and doesn't power on. Leaving the DJ page (or tapping the regular DJ tab) drops back to regular.
  function headerKey() {
    const old = $('pdHd'); if (old) old.remove();
    const rail = $('rail'); if (!rail) return;
    let b = $('pdTab');
    if (!b) { b = document.createElement('button'); b.id = 'pdTab'; b.dataset.g = 'pro'; b.innerHTML = '<span class="rl">PRO DJ</span>'; b.setAttribute('aria-label', 'Pro DJ');
      b.onclick = () => {
        if (GB.pro !== true) { lockedTap(b, 'Pro DJ'); return; }
        if (GB.page !== 'dj') GB.go('dj');
        if (!isOn()) setOn(true, true); else paintTabs();
      }; }
    const sep = rail.querySelector('.rail-sep[data-g=pro]');
    if (sep && sep.nextElementSibling !== b) sep.after(b);
    b.hidden = GB.pro == null; b.classList.toggle('locked', GB.pro === false);
    paintTabs();
  }
  function paintTabs() {
    const on = GB.page === 'dj' && isOn(), t = $('pdTab'), dj = document.querySelector('#rail button[data-p=dj]');
    if (t) t.classList.toggle('on', on); if (dj) dj.classList.toggle('on', GB.page === 'dj' && !on);
  }
  function lockedTap(b, name) {
    GB.sfx && GB.sfx('err'); b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope');
    GB.toast && GB.toast('🔒 ' + name + ' is part of GlowBop Pro');
    setTimeout(() => GB.go('pro'), 700);
  }
  GB.proLockedTap = lockedTap;
  function paintSwitch() {
    headerKey();
    const p = $('pdPanel'); if (!p) return;
    p.hidden = true;                                 // the switch moved up to the top bar (Oct 16); this box stays for older layouts only
    const on = isOn();
    $('pdGo').textContent = on ? '✕ EXIT PRO' : '⚡ PRO DJ';
    $('pdTitle').textContent = on ? 'PRO DJ · ON' : 'PRO DJ';
    $('pdSub').textContent = on ? 'Music, faders, loops, cues and 6 Pro keys are on this page. Hold a Pro key to change what it does.' : 'Switch the console into the Pro control center.';
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
  // 🔊 Pro DJ power-up: a deep thump, a rising synth sweep, then a bright chord as the keys flicker on (off: a soft power-down sweep).
  // Made live with Web Audio, no sound files. Follows the SFX key (muted = silent).
  let actx = null;
  function proSound(on, offline) {
    if (!offline && S.get('gb_sfx', '1') !== '1') return;
    try {
      let C = offline;
      if (!C) { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state !== 'running') { const go = () => proSound(on, actx); actx.resume().then(go, go); return; }   // wake the speakers first (iPhone / iPad / Windows app)
        C = actx; }
      const t = (offline && offline !== actx ? 0 : C.currentTime) + 0.03, out = C.createGain(); out.gain.value = 0.8; out.connect(C.destination);
      const env = (g, a, peak, d, at) => { g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + d); };
      const osc = (type, f, at, dur, peak, a, dest) => { const o = C.createOscillator(), g = C.createGain(); o.type = type; o.frequency.setValueAtTime(f, at);
        env(g, a, peak, dur, at); o.connect(g); g.connect(dest || out); o.start(at); o.stop(at + a + dur + 0.05); return o; };
      if (on) {
        const k = osc('sine', 90, t, 0.35, 0.9, 0.005); k.frequency.exponentialRampToValueAtTime(42, t + 0.3);          // thump
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 9; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(5200, t + 0.62); lp.connect(out);
        [0, 7].forEach(dt => { const sw = osc('sawtooth', 110, t + 0.04, 0.55, 0.22, 0.12, lp); sw.detune.value = dt * 2; sw.frequency.exponentialRampToValueAtTime(880, t + 0.64); });   // the rise
        [523.25, 659.25, 783.99, 987.77, 1318.5].forEach((f, i) => { osc('triangle', f, t + 0.66 + i * 0.012, 1.1, 0.16, 0.01); osc('sine', f * 2, t + 0.66 + i * 0.012, 0.5, 0.04, 0.01); });   // bright chord
        [1046.5, 1318.5, 1568, 2093].forEach((f, i) => osc('sine', f, t + 0.8 + i * 0.07, 0.25, 0.06, 0.005));   // sparkle on top
      } else {
        const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(200, t + 0.6); lp.connect(out);
        const sw = osc('sawtooth', 660, t, 0.6, 0.16, 0.02, lp); sw.frequency.exponentialRampToValueAtTime(70, t + 0.6);
        osc('sine', 70, t + 0.45, 0.3, 0.5, 0.005);
      }
    } catch (e) {}
  }
  GB.proSound = proSound;                         // GB.proSound(true) to hear it
  // a template made before a page's boxes finished loading gets redone once they have (only if you haven't moved anything)
  const recompact = () => { const k = canArrange() ? pageKey() : null; if (k && !arranging && S.get(store(k) + ':auto') === '1') compact(true); };
  GB.proDJ = {recompact, isOn, setOn: (on, anim) => setOn(on, anim), flicker: f => flicker(f), relayout: () => layout(), syncBorrow: () => syncBorrow()};   // shared with prohome.js
  function setOn(on, animate) {
    if (on && GB.pro !== true) return;
    S.set('gb_prodj', on ? '1' : '0');
    if (animate) flicker(() => apply(on, true)); else apply(on);
    paintTabs();
    if (animate) { proSound(on); GB.toast && GB.toast(on ? '🎛️ Pro DJ on' : '🎚️ Back to the regular DJ page'); }
  }
  // 🔀 the DJ key itself moves: down into the PRO section (gold-teal, "PRO DJ") when Pro DJ is on, back up under MUSIC when it's off
  function railMove(on, animate) {
    return;                                         // (Oct 16) the DJ tab stays put now; PRO DJ has its own tab
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
    const SEL = '#main .btn, #main .pad, #main .tile, #main .chip, #main .seg > *, #main .ph, #main .read, #main .mfad, #pdTab, #main canvas';
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
    blackout: {i: 'dark', n: 'Blackout', c: 'var(--peri)', tap: () => GB.djHit('blackout'), lit: d => !!d.blackout},
    strobe: {i: 'bolt', n: 'Strobe', c: 'var(--cyan)', tap: () => GB.djHit('strobe')},
    flash: {i: 'sun', n: 'Flash', c: 'var(--gold)', tap: () => GB.djHit('flash')},
    drop: {i: 'burst', n: 'Drop', c: 'var(--pink)', tap: () => GB.djHit('drop')},
    fire: {i: 'fire', n: 'Fire burst', c: 'var(--orange)', tap: () => GB.djHit('fire')},
    confetti: {i: 'confetti', n: 'Confetti', c: 'var(--lav)', tap: () => GB.djHit('confetti')},
    lightning: {i: 'lightning', n: 'Lightning', c: '#8fb4ff', tap: () => GB.djHit('lightning')},
    shockwave: {i: 'shockwave', n: 'Shockwave', c: 'var(--violet)', tap: () => GB.djHit('shockwave')},
    colorbomb: {i: 'colorbomb', n: 'Color bomb', c: 'var(--amber)', tap: () => GB.djHit('colorbomb')},
    countdown: {i: 'count321', n: '3-2-1', c: 'var(--orchid)', tap: () => GB.djHit('countdown')},
    cool: {i: 'moon', n: 'Cool down', c: 'var(--lav)', hold: true, lit: d => !!d.cool},
    color: {i: 'palette', n: 'Color lock', c: 'var(--orange)', lit: d => !!d.color, tap: async () => {
      const d = (GB.status || {}).dj || {}; let cols = []; try { cols = JSON.parse(S.get('gb_dj_colors') || '[]'); } catch (e) {}
      if (!cols.length) cols = ['#ff1a1a'];
      if (await GB.djPost(d.color ? {color: false} : {colors: cols, color: true})) GB.toast(d.color ? '🌈 Back to the full show' : '🎨 Color locked'); }},
    lookn: {i: 'ffwd', n: 'Next look', c: 'var(--orange)', tap: () => GB.control({step: 'look+'})},
    lookp: {i: 'back', n: 'Prev look', c: 'var(--orange)', tap: () => GB.control({step: 'look-'})},
    effn: {i: 'sparkle', n: 'Next effect', c: 'var(--lav)', tap: () => GB.control({step: 'effect+'})},
    tap: {i: 'drum', n: 'Tap tempo', c: 'var(--cyan)', tap: () => GB.djPost({tap: true})},
    loopsoff: {i: 'stop', n: 'Stop loops', c: '#3fb6ff', tap: () => GB.loopsStopAll && GB.loopsStopAll()},
    release: {i: 'ovr', n: 'Release overrides', c: 'var(--red)', tap: () => GB.overrideRelease ? GB.overrideRelease() : GB.post('/api/override', {release: true})},
    fullview: {i: 'full', n: 'Full view', c: 'var(--gold)', tap: () => GB.setFull && GB.setFull(true)},
  };
  const DEF = ['blackout', 'strobe', 'cool', 'color', 'lookn', 'tap'];
  const keysNow = () => { let k = []; try { k = JSON.parse(S.get('gb_prokeys') || '[]'); } catch (e) {} return DEF.map((d, i) => ACT[k[i]] ? k[i] : d); };
  function buildKeys() {
    const wall = document.querySelector('#view > .panel'); if (!wall || $('proKeys')) return;
    // the Pro keys live in their own box (not inside the wall's box), so Arrange can move them and the wall separately
    const box = document.createElement('div'); box.className = 'panel'; box.id = 'proKeysBox';
    const row = document.createElement('div'); row.id = 'proKeys'; box.appendChild(row); wall.after(box); paintKeys();
    const fit = () => box.classList.toggle('narrow', box.clientWidth > 0 && box.clientWidth < 520);   // 3 across when the box is narrow
    try { new ResizeObserver(fit).observe(box); } catch (e) { addEventListener('resize', fit); } fit();
  }
  function paintKeys() {
    const row = $('proKeys'); if (!row) return;
    const ks = keysNow(); row.innerHTML = '';
    ks.forEach((k, i) => {
      const a = ACT[k], b = document.createElement('button'); b.className = 'btn c'; b.dataset.k = k; b.dataset.i = i; b.style.setProperty('--c', a.c);
      b.innerHTML = `<span class="pe">${GB.svg(a.i)}</span><span>${GB.esc(a.n)}</span>`; b.title = a.n + ' (hold to change this key)';
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
    GB.sheet('Pro key ' + (i + 1) + ': pick what it does', Object.keys(ACT).map(k => ({ic: ACT[k].i, label: ACT[k].n + (k === cur ? '  ✓' : ''),
      sub: ACT[k].hold ? 'hold, or tap to latch' : '', onclick: () => { const ks = keysNow(); ks[i] = k; S.set('gb_prokeys', JSON.stringify(ks)); paintKeys(); GB.toast('Key ' + (i + 1) + ': ' + ACT[k].n); }})));
  }
  function pickSlot() { GB.sheet('Which key?', keysNow().map((k, i) => ({ic: ACT[k].i, label: (i + 1) + '. ' + ACT[k].n, onclick: () => assign(i)}))); }

  // ================================================================ ✏️ arrange: an invisible fine grid
  let arranging = false;
  const bucket = () => (innerWidth >= 1000 && innerWidth >= innerHeight) ? 'wide' : 'tall';
  // ✏️ Every page can be arranged, by everyone (Oct 16, Graham). Pro pages only once they're unlocked.
  const pageKey = () => { const p = GB.page; if (!p) return null; if (p === 'dj') return isOn() ? 'prodj' : 'dj';
    if (p === 'home') return GB.pro === true ? 'prohome' : null; if (PRO_PAGES.includes(p) && GB.pro !== true) return null; return p; };
  const canArrange = () => innerWidth >= 700 && !!pageKey();
  const store = k => 'gb_lay3:' + k + ':' + bucket();   // v2 (Oct 16): old hand-made Pro DJ layouts start fresh on the Compact template
  function items() {
    const pg = $('pg-' + GB.page); if (!pg) return [];
    const view = $('view'), out = [];
    const v = [[view.querySelector(':scope > .panel:not(.reads-panel):not(#proKeysBox)'), 'v:wall'], [$('proKeysBox'), 'v:keys'], [view.querySelector(':scope > .modebar'), 'v:mode'], [view.querySelector(':scope > .reads-panel'), 'v:reads']];
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
  // 💾 layouts are kept on the computer too (/api/layouts), so every screen shares them and a cleared browser loses nothing
  const outQ = {}; let outT = 0;
  const put = (key, v) => { S.set(key, v); outQ[key] = v; clearTimeout(outT); outT = setTimeout(() => { const set = Object.assign({}, outQ); Object.keys(outQ).forEach(x => delete outQ[x]);
    fetch('/api/layouts', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({set})}).catch(() => {}); }, 600); };
  async function syncLayouts() {
    let srv = {}; try { srv = ((await (await fetch('/api/layouts', {cache: 'no-store'})).json()) || {}).items || {}; } catch (e) { return; }
    const mine = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('gb_lay3:')) mine[k] = localStorage.getItem(k); } } catch (e) {}
    const hand = (src, k) => !!src[k] && src[k + ':auto'] !== '1';     // arranged by hand (not an automatic template)
    let changed = false;
    Object.keys(mine).filter(k => !k.endsWith(':auto')).forEach(k => {   // this screen's hand-made layouts go up (they beat an automatic one)
      if (mine[k] && (!srv[k] || (hand(mine, k) && !hand(srv, k)) || (hand(mine, k) && srv[k] !== mine[k]))) { put(k, mine[k]); put(k + ':auto', mine[k + ':auto'] || ''); } });
    Object.keys(srv).filter(k => !k.endsWith(':auto')).forEach(k => {   // layouts made on another screen come down
      if (!mine[k] || (hand(srv, k) && !hand(mine, k))) { S.set(k, srv[k]); S.set(k + ':auto', srv[k + ':auto'] || ''); changed = true; } });
    if (changed && !arranging) layout();
  }
  const load = k => { try { return JSON.parse(S.get(store(k)) || 'null'); } catch (e) { return null; } };
  const save = (k, L) => put(store(k), JSON.stringify(L));
  function clearLay() {
    const m = $('main'); m.classList.remove('lay');
    document.querySelectorAll('.lay-it').forEach(el => { el.classList.remove('lay-it'); el.style.gridColumn = el.style.gridRow = ''; });
    document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove());
  }
  function place(el, p) { el.classList.add('lay-it'); el.style.gridColumn = (p.x + 1) + ' / span ' + p.w; el.style.gridRow = (p.y + 1) + ' / span ' + p.h; }
  let cur = null;                                   // {key, L}
  function layout() {
    const k = canArrange() ? pageKey() : null, L = k && load(k);
    if (k && L && !arranging && S.get(store(k) + ':auto') === '1' && items().some(el => !L[el.dataset.lk])) return compact(true);   // an untouched template + new boxes: rebuild it
    if (k && !L && !arranging) { $('layFab') && $('layFab').classList.add('show'); const D = DEFAULTS[k + ':' + bucket()];   // every page starts on its tidy template
      if (D && items().every(el => D[el.dataset.lk])) { save(k, JSON.parse(JSON.stringify(D))); put(store(k) + ':auto', '2'); return layout(); }   // Graham's own arrangement ships as the default
      return compact(true); }
    $('layFab') && $('layFab').classList.toggle('show', !!k);
    if (!k || (!L && !arranging)) { clearLay(); cur = null; return; }
    const list = items(); const LL = L || measure(list);
    // the Pro keys box (new) starts right under the wall; any other new box goes underneath everything
    if (!LL['v:keys'] && LL['v:wall'] && $('proKeysBox') && isOn()) { const w = LL['v:wall']; LL['v:keys'] = {x: w.x, y: w.y + w.h, w: w.w, h: 10}; settle(LL, 'v:keys'); }
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
    // then everything floats up into any gap above it, so the board always stays packed and lined up
    Object.keys(L).sort((a, b) => L[a].y - L[b].y).forEach(i => { const p = L[i];
      while (p.y > 0 && !Object.keys(L).some(j => j !== i && hits({x: p.x, y: p.y - 1, w: p.w, h: p.h}, L[j]))) p.y--; });
  }
  function handles() {
    document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove());
    document.querySelectorAll('#main .lay-it').forEach(el => {
      const id = el.dataset.lk, ph = el.querySelector('.ph .gb-ihold > span') || el.querySelector('.ph > span:not(.r)') || el.querySelector('.ph'), name = id === 'v:wall' ? 'Live wall' : id === 'v:mode' ? 'Now playing' : id === 'v:reads' ? 'Tempo & look' : id === 'v:keys' ? 'Pro keys' : id === 'pdPanel' ? 'Pro DJ switch' : (ph ? ph.textContent.trim().split('\n')[0] : 'Box');
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
        save(cur.key, cur.L); put(store(cur.key) + ':auto', ''); };
      handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', end, {once: true}); handle.addEventListener('pointercancel', end, {once: true});
    });
  }
  function arrange(on) {
    if (on && !canArrange()) { GB.toast(innerWidth < 700 ? 'Arrange works on tablets and computers' : 'Unlock Pro to arrange this page'); return; }
    arranging = on; document.documentElement.classList.toggle('gb-arr', on);
    if (on) { layout(); if (cur && !load(cur.key)) save(cur.key, cur.L); handles(); GB.sfx && GB.sfx('tap'); }
    else { document.querySelectorAll('.lay-hand, .lay-grip').forEach(n => n.remove()); layout(); GB.toast && GB.toast('✅ Layout saved'); }
  }
  // ⚡ COMPACT: a ready-made tight layout. Columns of boxes, each sized to its own content, packed with no gaps.
  function compact(silent) {
    const k = pageKey(); if (!k) return;
    if (!silent && !arranging) arrange(true);
    clearLay(); $('main').classList.add('lay');
    const list = items(), id = sel => { const n = document.querySelector('#main ' + sel); const it = n && n.closest('[data-lk]'); return it ? it.dataset.lk : null; };
    const W = bucket() === 'wide', T = TPL[k] || {}, top3 = ['v:wall', 'v:keys', 'v:mode', 'v:reads'];
    const pick = a => a.map(x => typeof x === 'string' && x[0] === '#' ? id(x) : x);
    const cols = (W ? (T.wide || [[0, 17, top3], [17, 15, []], [32, 16, []]]) : (T.tall || [[0, 24, top3], [24, 24, []]])).map(([x, w, ids]) => [x, w, pick(ids)]);
    const full = pick(T.full || []);                 // boxes that need the whole width (wide keyboards, big grids): a band underneath
    const L = {}, byId = {}; list.forEach(el => byId[el.dataset.lk] = el);
    const widthOf = {}; cols.forEach(([x, w, ids]) => ids.forEach(i => { if (i) widthOf[i] = [x, w]; })); full.forEach(i => { if (i) widthOf[i] = [0, COLS]; });
    const free = list.map(el => el.dataset.lk).filter(i => !widthOf[i]);   // not placed by the template: they fill whichever column is shortest
    const midW = cols[cols.length - 1][1]; free.forEach(i => widthOf[i] = [cols[cols.length - 1][0], midW]);
    // measure every box at its column width (its content height, nothing stretched)
    list.forEach(el => { const xw = widthOf[el.dataset.lk] || [0, 24]; el.classList.add('lay-it'); el.style.gridColumn = (xw[0] + 1) + ' / span ' + xw[1]; el.style.gridRow = 'auto / span 1'; el.style.alignSelf = 'start'; el.style.overflow = 'visible'; });
    const kb = $('proKeysBox'); if (kb) kb.classList.toggle('narrow', kb.clientWidth < 520);
    void document.body.offsetHeight;                // let the narrow key layout settle before measuring
    const H = {}; list.forEach(el => H[el.dataset.lk] = Math.max(6, Math.ceil((el.offsetHeight + 26) / ROW)));
    // the Live wall starts at the size where your lights fill it edge to edge (then shrink it however you like)
    const wEl = byId['v:wall'], wb = $('wallBox');
    if (wEl && wb && GB.wallIdeal) { const fixed = wEl.offsetHeight - wb.offsetHeight; H['v:wall'] = Math.max(10, Math.ceil((fixed + GB.wallIdeal(Math.max(120, wb.clientWidth - 20)) + 26 + 26) / ROW)); }
    list.forEach(el => { el.style.alignSelf = ''; el.style.overflow = ''; });
    const lane = cols.map(([x, w, ids]) => { let y = 0; ids.forEach(i => { if (!i || !byId[i]) return; L[i] = {x, y, w, h: H[i]}; y += H[i]; }); return y; });
    // everything else drops into the shortest column, in page order, so the columns end close together
    const moved = [];
    free.forEach(i => { let c = 0; lane.forEach((y, j) => { if (y < lane[c] - 2) c = j; }); const [x, w] = cols[c]; L[i] = {x, y: lane[c], w, h: H[i]}; lane[c] += H[i]; if (w !== midW || x !== cols[cols.length - 1][0]) moved.push(i); });
    if (moved.length) { moved.forEach(i => { const p = L[i], el = byId[i]; el.style.gridColumn = (p.x + 1) + ' / span ' + p.w; el.style.gridRow = 'auto / span 1'; el.style.alignSelf = 'start'; el.style.overflow = 'visible'; });
      void document.body.offsetHeight; const lane2 = cols.map(() => 0);   // re-measure at their real width and restack each column
      moved.forEach(i => H[i] = Math.max(6, Math.ceil((byId[i].offsetHeight + 26) / ROW)));
      moved.forEach(i => { byId[i].style.alignSelf = ''; byId[i].style.overflow = ''; });
      cols.forEach(([x], c) => { Object.keys(L).filter(i => L[i].x === x).sort((a, b) => L[a].y - L[b].y).forEach(i => { L[i].y = lane2[c]; L[i].h = H[i]; lane2[c] += H[i]; }); });
      lane.splice(0, lane.length, ...lane2); }
    let band = Math.max(0, ...lane); full.forEach(i => { if (!i || !byId[i]) return; L[i] = {x: 0, y: band, w: COLS, h: H[i]}; band += H[i]; });
    save(k, L); put(store(k) + ':auto', silent ? '1' : ''); cur = {key: k, L}; list.forEach(el => place(el, L[el.dataset.lk])); if (arranging) handles();
    if (!silent) GB.toast && GB.toast('⚡ Compact layout. Drag anything to fine-tune');
  }
  function reset() { const k = pageKey(); if (!k) return; put(store(k), ''); put(store(k) + ':auto', ''); arranging = false; document.documentElement.classList.remove('gb-arr'); clearLay(); cur = null; layout(); GB.toast('↺ Back to the tidy template'); }

  function chrome() {
    const bar = document.createElement('div'); bar.id = 'layBar';
    bar.innerHTML = '<b>✏️ ARRANGING</b><small>Drag a box to move it. Pull the corner to resize.</small><button class="btn c" id="layCompact" style="--c:#ff3d9a">⚡ Compact</button><button class="btn" id="layReset">Reset</button><button class="btn c" id="layDone" style="--c:#4de8c8">Done</button>';
    document.body.appendChild(bar);
    bar.querySelector('#layDone').onclick = () => arrange(false); bar.querySelector('#layReset').onclick = reset; bar.querySelector('#layCompact').onclick = compact;
    const fab = document.createElement('button'); fab.id = 'layFab'; fab.type = 'button'; fab.innerHTML = '✏️ ARRANGE'; fab.onclick = () => arrange(true);
    document.body.appendChild(fab);
  }

  // ================================================================ wiring
  GB.on('ready', () => { chrome(); buildKeys(); syncLayouts(); if (GB.pro === true) apply(isOn()); else paintSwitch(); setTimeout(headerKey, 500); });
  GB.on('pro', v => { if (!v && document.documentElement.classList.contains('prodj')) document.documentElement.classList.remove('prodj'); apply(v && isOn()); });
  document.addEventListener('click', e => { const d = e.target.closest && e.target.closest('#rail button[data-p=dj]'); if (d && isOn()) setOn(false, false); }, true);   // the regular DJ tab = regular DJ
  GB.on('page', id => { if (id !== 'dj' && isOn()) { S.set('gb_prodj', '0'); apply(false); } paintTabs();
    fits = []; if (arranging) { arranging = false; document.documentElement.classList.remove('gb-arr'); } syncBorrow(); paintSwitch(); setTimeout(layout, 0); });   // layout after other pages borrow their boxes (Pro Home)
  GB.on('status', paintLit);
  // 🏟️ Home DJ with more than 4 light sets: a friendly banner (once per visit) + "Each separate" light groups are Pro
  GB.css(`#limBar { display:flex; align-items:center; gap:12px; flex-wrap:wrap; background:linear-gradient(90deg,#2a1640,#13202e); border:1px solid #ffd21a66; border-radius:16px; padding:10px 14px; margin-bottom:var(--gap); }
    #limBar b { font:800 calc(16px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:#ffd21a; } #limBar span { flex:1 1 220px; min-width:0; color:var(--text); }
    #limBar .btn { min-height:40px; }`);
  let limShown = false;
  GB.on('status', s => {
    const L = s.light_limit, pages = $('pages'); if (!pages) return;
    let bar = $('limBar');
    if (!L || GB.pro === true || limShown === 'x') { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.id = 'limBar'; pages.prepend(bar); limShown = true; }
    bar.innerHTML = `<b>🏟️ Your setup has grown!</b><span>GlowBop found ${L.total} light sets. Home DJ plays ${L.max} together (${(L.off || []).map(GB.esc).join(', ')} are resting). Pro runs them all.</span>
      <button class="btn c" style="--c:#ffd21a">See Pro</button><button class="btn ghost" aria-label="Hide">✕</button>`;
    bar.querySelector('.btn.c').onclick = () => GB.go('pro'); bar.querySelector('.ghost').onclick = () => { limShown = 'x'; bar.remove(); };
  });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#suEach');
    if (b && GB.pro === false) { e.stopPropagation(); e.preventDefault(); GB.sfx && GB.sfx('err'); GB.toast('🔒 Each group running its own show is part of Pro. Home DJ plays all your lights together.'); }
  }, true);
  try { const wb = $('wallBox'); if (wb) { let rq = 0; new ResizeObserver(() => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => GB.redrawWall && GB.redrawWall()); }).observe(wb); } } catch (e) {}
  // a tidy template grows with its boxes: when one fills up (a list loaded, a card opened), the template refits itself
  let fitT = 0, fits = [];
  const fit = () => { clearTimeout(fitT); fitT = setTimeout(() => { if (!cur || arranging || document.hidden || !['1', '2'].includes(S.get(store(cur.key) + ':auto'))) return;
    const full = [...document.querySelectorAll('#main .lay-it')].filter(el => el.dataset.lk !== 'v:wall' && el.scrollHeight > el.clientHeight + 12); if (!full.length) return;
    const now = Date.now(); fits = fits.filter(t => now - t < 20000); if (fits.length >= 4) return;   // never chase a box that can't settle
    fits.push(now);
    if (S.get(store(cur.key) + ':auto') === '2') {   // a shipped arrangement keeps its places; a box that filled up just grows
      full.forEach(el => { const p = cur.L[el.dataset.lk]; if (p) p.h += Math.ceil((el.scrollHeight - el.clientHeight) / ROW) + 1; });
      full.forEach(el => settle(cur.L, el.dataset.lk)); save(cur.key, cur.L); layout(); return; }
    recompact(); }, 300); };
  try { new MutationObserver(fit).observe($('pages'), {childList: true, subtree: true}); } catch (e) {}
  setInterval(fit, 1500);
  GB.on('wallshape', () => setTimeout(() => GB.proDJ.recompact(), 200));   // the Live wall's real shape arrived: refit an untouched template
  let refit = false; GB.on('catalog', () => { if (!refit) { refit = true; setTimeout(() => GB.proDJ.recompact(), 500); } });   // looks loaded: refit an untouched template once
  let rt = 0, sig = '';                           // re-lay only when the screen shape really changes (phone turned, window resized past a size)
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const n = bucket() + (canArrange() ? 1 : 0) + innerWidth;
    if (n !== sig && !document.querySelector('.lay-hand.drag')) { sig = n; layout(); } paintSwitch(); }, 250); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && arranging) arrange(false); });
})();
