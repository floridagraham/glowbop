/* ⏻ GlowBop power screens (Oct 20, Graham): the same look as the start-up screen (black light wall, dot logo, GLOWBOP),
   used for two things:
   1. SHUTDOWN (the red key at the bottom of the rail, and the window's X): "Shut down GlowBop?" Lights off / Lights keep going /
      Cancel, then the start-up run backwards: rings fall back into the logo, each light ticks off, the logo dots go dark from the
      outside in, a power-down sound, "GlowBop is off". On a phone or iPad the screen then moves to Start GlowBop.
   2. LOST CONNECTION (Graham: "it's so wordy, there's so much going on"): the logo, ONE line, and ONE button only when there is
      something to tap. It goes away by itself the moment the laptop answers. If GlowBop was shut down, phones move to Start GlowBop. */
(function () {
  'use strict';
  const ROWS = ['DDCCCDD', 'DCVVVCD', 'CVPPPVC', 'CVPWPVC', 'CVPPPVC', 'DCVVVCD', 'DDCCCDD'];
  const PAL = {D: '#221d33', C: '#33d6ff', V: '#9b3dff', P: '#ff3d9a', W: '#ffffff'};
  const inApp = () => !!(window.pywebview && window.pywebview.api && window.pywebview.api.quit);
  const quiet = () => GB.store && GB.store.get('gb_sfx', '1') !== '1';

  GB.css(`
  #gbPow { position:fixed; inset:0; z-index:20000; background:#000; color:#e9e4ff; opacity:0; transition:opacity .45s ease; pointer-events:none;
    font-family:'Saira Condensed', Bahnschrift, 'Arial Narrow', sans-serif; }
  #gbPow.show { opacity:1; pointer-events:auto; }
  #gbPow canvas { position:absolute; inset:0; width:100%; height:100%; }
  #gbPow .s { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
    padding:calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom)); box-sizing:border-box; }
  #gbPow .logo { width:min(36vw, 21vh, 200px); height:auto; background:#000; border-radius:22px; padding:8px; box-shadow:0 0 30px 18px #000; }
  #gbPow .d { opacity:.13; transition:opacity .35s ease, filter .35s ease; } #gbPow .d.bg { opacity:1; }
  #gbPow .d.on { opacity:1; filter:drop-shadow(0 0 3px currentColor); } #gbPow .d.spark { fill:#fff !important; filter:drop-shadow(0 0 5px #fff); }
  #gbPow h1 { margin:0; line-height:1; font-size:min(9vw, 54px); letter-spacing:.18em; font-weight:800; background:linear-gradient(90deg, #33d6ff, #9b3dff, #ff3d9a);
    -webkit-background-clip:text; background-clip:text; color:transparent; transition:opacity .8s ease; }
  #gbPow .tag { margin:0; font-size:min(4.4vw, 22px); letter-spacing:.32em; text-transform:uppercase; color:#33d6ff; transition:opacity .8s ease; }
  #gbPow.dark h1, #gbPow.dark .tag { opacity:.25; }
  #gbPow .ln { margin:12px 0 2px; font:600 calc(19px * var(--fs, 1))/1.3 'Share Tech Mono', Consolas, monospace; color:#e9e4ff; min-height:25px; text-align:center; }
  #gbPow ul { list-style:none; margin:0; padding:0 4px; display:grid; gap:6px; width:min(92vw, 540px); max-height:36vh; overflow:auto; }
  #gbPow ul.many { width:min(96vw, 1000px); grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); }
  #gbPow li { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 14px; border-radius:12px; background:rgba(26,16,46,.94);
    font-size:17px; letter-spacing:.04em; transition:opacity .4s ease; }
  #gbPow li b { font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
  #gbPow li span { flex:none; white-space:nowrap; font:14px 'Share Tech Mono', Consolas, monospace; color:#3dffa8; }
  #gbPow li.off { opacity:.55; } #gbPow li.off span { color:#ff3d9a; } #gbPow li.back span { color:#cc99ff; }
  #gbPow .go { margin-top:10px; min-height:64px; min-width:260px; padding:0 30px; border:0; border-radius:999px; cursor:pointer; display:none; align-items:center;
    justify-content:center; gap:10px; font:700 22px/1.05 'Saira Condensed', Bahnschrift, sans-serif; letter-spacing:1px; text-transform:uppercase; color:#000;
    background:#33d6ff; box-shadow:0 0 18px rgba(51,214,255,.45); }
  #gbPow .go.show { display:inline-flex; } #gbPow .go:active { transform:scale(.97); filter:brightness(1.2); } #gbPow .go svg { width:22px; height:22px; fill:currentColor; }
  /* the SHUTDOWN key at the bottom of the rail */
  #rail button.rail-shut { --c:#ff4d6d; background:var(--c); }
  #rail button.rail-shut > .ic { width:1.1em; height:1.1em; }
  @media (max-width:600px) { #rail button.rail-shut > .ic { display:none; } }
  `);

  // 🖼️ one screen: light wall + logo + GLOWBOP + one line + (a list while shutting down) + one button
  function screen() {
    const old = document.getElementById('gbPow'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'gbPow'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-live', 'polite');
    const dots = ROWS.map((row, r) => [...row].map((ch, k) => `<circle class="d${ch === 'D' ? ' bg' : ''}" data-r="${r}" data-k="${k}" cx="${9 + k * 13}" cy="${9 + r * 13}" r="4.6" fill="${PAL[ch]}"/>`).join('')).join('');
    el.innerHTML = `<canvas></canvas><div class="s"><svg class="logo" viewBox="0 0 96 96" aria-hidden="true">${dots}</svg><h1>GLOWBOP</h1><p class="tag">Set your lights free</p>
      <p class="ln"></p><ul hidden></ul><button class="go"><span></span></button></div>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), cx = cv.getContext('2d'), P = 24; let W = 0, H = 0, RINGS = [], raf = 0, alive = true;
    const fit = () => { const r = window.devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; cx.setTransform(r, 0, 0, r, 0, 0); };
    addEventListener('resize', fit); fit();
    const COLS = [[51, 214, 255], [155, 61, 255], [255, 61, 154]];
    const mix = t => { t = Math.max(0, Math.min(1, t)) * 2; const i = Math.min(1, Math.floor(t)), f = t - i, a = COLS[i], b = COLS[i + 1]; return a.map((v, k) => Math.round(v + (b[k] - v) * f)); };
    const centre = () => { const b = el.querySelector('.logo').getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; };
    // a ring of wall dots: out from the logo (looking), or falling back into it (shutting down)
    const ring = (inward) => { const c = centre(); RINGS.push({t: performance.now(), x: c.x, y: c.y, inward: !!inward}); if (RINGS.length > 4) RINGS.shift(); };
    const draw = now => {
      if (!alive) return; cx.clearRect(0, 0, W, H); const maxD = Math.hypot(W, H), far = maxD * 0.75;
      RINGS = RINGS.filter(r => now - r.t < 4200);
      for (let y = P / 2; y < H; y += P) for (let x = P / 2; x < W; x += P) {
        let hit = 0, dd = 0;
        for (const r of RINGS) { const age = (now - r.t) / 1000, R = r.inward ? Math.max(0, far - age * 320) : age * 300, d = Math.hypot(x - r.x, y - r.y);
          const k = Math.exp(-Math.pow((d - R) / 30, 2)) * Math.max(0, 1 - age / 4.2) * (r.inward && R <= 0 ? 0 : 1); if (k > hit) { hit = k; dd = d; } }
        if (hit > 0.02) { const c = mix(dd / (maxD * 0.6)); cx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.08 + 0.32 * hit).toFixed(3) + ')'; }
        else cx.fillStyle = '#14111f';
        cx.beginPath(); cx.arc(x, y, 4.2, 0, 6.283); cx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    // logo dots, centre first (the start-up order); a single spark travels round once they're all lit (no pulsing)
    const D = [...el.querySelectorAll('.d:not(.bg)')].sort((a, b) => Math.hypot(a.dataset.r - 3, a.dataset.k - 3) - Math.hypot(b.dataset.r - 3, b.dataset.k - 3));
    let spT = 0, sp = 0;
    const api = {
      el, D, ring,
      show() { requestAnimationFrame(() => el.classList.add('show')); return api; },
      line(t) { el.querySelector('.ln').textContent = t; return api; },
      btn(label, fn, ic) { const b = el.querySelector('.go'); if (!label) { b.classList.remove('show'); return api; }
        b.innerHTML = (ic ? GB.svg(ic) : '') + '<span></span>'; b.querySelector('span').textContent = label; b.onclick = fn; b.classList.add('show'); return api; },
      list(items) { const u = el.querySelector('ul'); u.hidden = !items.length; u.classList.toggle('many', items.length > 6);
        u.innerHTML = items.map(x => '<li><b></b><span>on</span></li>').join(''); [...u.children].forEach((li, i) => li.querySelector('b').textContent = items[i]); return [...u.children]; },
      lit(all) { D.forEach(d => d.classList.toggle('on', !!all)); return api; },
      spark(on) { clearInterval(spT); D.forEach(d => d.classList.remove('spark')); if (on) spT = setInterval(() => { D.forEach(d => d.classList.remove('spark')); D[sp++ % D.length].classList.add('spark'); }, 90); return api; },
      close() { alive = false; cancelAnimationFrame(raf); clearInterval(spT); removeEventListener('resize', fit); el.classList.remove('show'); setTimeout(() => el.remove(), 500); },
    };
    return api;
  }
  GB.powerScreen = screen;

  // 🔊 made in code, no sound files: a soft click per light, then a power-down sweep (the start-up warble, run downhill)
  let AC = null;
  const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; };
  function tick(delay) { if (quiet()) return; const a = ac(); if (!a) return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(990, t); o.frequency.exponentialRampToValueAtTime(520, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.2); }
  function powerDown() { if (quiet()) return; const a = ac(); if (!a) return; const t = a.currentTime + 0.02, out = a.createGain(); out.gain.value = 0.5; out.connect(a.destination);
    const env = (g, peak, att, dec) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec); };
    const g = a.createGain(); env(g, 0.1, 0.03, 1.3); g.connect(out);
    const car = a.createOscillator(); car.type = 'sine'; car.frequency.setValueAtTime(1800, t); car.frequency.exponentialRampToValueAtTime(260, t + 1.3);
    const mod = a.createOscillator(), mg = a.createGain(); mod.type = 'square'; mod.frequency.setValueAtTime(26, t); mod.frequency.linearRampToValueAtTime(8, t + 1.3); mg.gain.value = 160;
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); car.start(t); mod.start(t); car.stop(t + 1.4); mod.stop(t + 1.4);
    const sg = a.createGain(); env(sg, 0.16, 0.03, 1.4); sg.connect(out); const sub = a.createOscillator(); sub.type = 'sine';
    sub.frequency.setValueAtTime(196, t); sub.frequency.exponentialRampToValueAtTime(48, t + 1.4); sub.connect(sg); sub.start(t); sub.stop(t + 1.5); }

  // ================================================================ ⏻ SHUTDOWN
  GB.shutdownAsk = () => {
    if (GB.shuttingDown) return;
    const s = GB.sheet('Shut down GlowBop?', [
      {label: 'Lights off', ic: 'power', sub: 'every light goes dark', onclick: () => GB.shutdown(true)},
      {label: 'Lights keep going', ic: 'power', sub: 'they go back to their own apps', onclick: () => GB.shutdown(false)}]);
    if (!s) return s;
    const g = s.querySelector('.btn.ghost'); if (g) g.textContent = 'Cancel';
    s.querySelectorAll('.btn').forEach(b => b.style.minHeight = '64px');
    return s;
  };
  GB.shutdown = async off => {
    if (GB.shuttingDown) return; GB.shuttingDown = true; ac();
    const S = screen().lit(true).line('Shutting down…').show();
    let names = [];
    try { const r = await Promise.race([GB.get('/api/lights'), new Promise(res => setTimeout(() => res(null), 1500))]);
      names = ((r && r.devices) || []).filter(d => d.enabled !== false && d.connected !== false).map(d => d.name).slice(0, 40); } catch (e) {}
    if (!inApp()) fetch('/api/quit', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({off})}).catch(() => {});
    const rows = S.list(names), n = rows.length, step = n ? Math.min(320, 1800 / n) : 0, T = 400 + n * step;
    S.ring(true); const rt = setInterval(() => S.ring(true), 750);
    rows.forEach((li, i) => setTimeout(() => { li.classList.add(off ? 'off' : 'back'); li.querySelector('span').textContent = off ? 'off' : 'handed back'; tick(); }, 300 + i * step));
    const dark = [...S.D].reverse(); dark.forEach((d, i) => setTimeout(() => d.classList.remove('on'), 200 + (i / dark.length) * T));
    await new Promise(r => setTimeout(r, T + 200));
    clearInterval(rt); powerDown(); S.el.classList.add('dark'); S.line('GlowBop is off');
    await new Promise(r => setTimeout(r, 1500));
    if (inApp()) return window.pywebview.api.quit(off);          // 💻 the laptop window stops GlowBop and closes
    // 📱 phone / iPad: wait for the laptop to hand its address to the helper, then show Start GlowBop
    const t0 = Date.now();
    const wait = async () => {
      let ready = false;
      try { const r = await fetch('/helper/status', {cache: 'no-store'}); ready = r.ok && (await r.json()).engine === 'off'; } catch (e) {}
      if (ready || Date.now() - t0 > 20000) return location.reload();
      setTimeout(wait, 1000);
    };
    wait();
  };

  // 📌 SHUTDOWN stays the very last key on the rail, even when other keys (ARRANGE) are added after the rail is built
  const keepLast = () => { const rail = document.getElementById('rail'), sb = rail && rail.querySelector('.rail-shut'); if (!sb) return;
    const tail = rail.querySelector(':scope > .tail'), keys = [...rail.querySelectorAll(':scope > button')], last = keys[keys.length - 1];
    if (last !== sb) rail.insertBefore(sb, tail && tail.parentNode === rail && keys.every(k => k.compareDocumentPosition(tail) & 4) ? tail : null); };
  const watch = () => { const rail = document.getElementById('rail'); if (!rail) return setTimeout(watch, 300); keepLast();
    new MutationObserver(() => keepLast()).observe(rail, {childList: true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  // ================================================================ 💤 LOST CONNECTION
  const GRACE = 5000, HELP_AFTER = 20000;
  let S = null, since = Date.now(), shownAt = 0, busy = false;
  function show(on) {
    if (!!S === on) return;
    if (on) { shownAt = Date.now(); S = screen().lit(true).spark(true).line('Looking for your laptop…').show(); S.ring(); S._rt = setInterval(() => S.ring(), 3000); return; }
    clearInterval(S._rt); S.close(); S = null; wake();
    if (Date.now() - shownAt > 20000) setTimeout(() => location.reload(), 900);   // long outage (laptop restarted): start fresh
  }
  // ⚡ back online: the console's keys flicker back on, a little wave down the screen
  function wake() {
    const keys = [...document.querySelectorAll('#rail button, #hd .btn, #main .btn, #main .pad, #main .tile, .mfad, #mBtn')]
      .filter(n => { const b = n.getBoundingClientRect(); return b.width && b.bottom > 0 && b.top < innerHeight; }).slice(0, 200);
    keys.forEach(n => { const b = n.getBoundingClientRect(), at = 120 + (b.top / innerHeight) * 700 + Math.random() * 120;
      setTimeout(() => { n.classList.add('gb-wake'); setTimeout(() => n.classList.remove('gb-wake'), 760); }, at); });
    if (GB.toast) GB.toast('✨ Back online');
  }
  GB.css(`.gb-wake { animation:gbWake .7s linear both; }
    @keyframes gbWake { 0%{opacity:.3} 10%{opacity:1;filter:brightness(2.4) saturate(1.4)} 20%{opacity:.35;filter:brightness(.7)} 34%{opacity:1;filter:brightness(1.8)} 100%{opacity:1;filter:none} }
    @media (prefers-reduced-motion: reduce) { .gb-wake { animation:none; } }`);
  async function check(manual) {
    if (busy) return; busy = true;
    try {
      try { const r = await fetch('/api/status', {cache: 'no-store'}); if (r.ok) { GB.lastOk = Date.now(); show(false); return; } } catch (e) {}
      if (!S) return;
      let off = false;
      try { const r = await fetch('/helper/status', {cache: 'no-store'}); off = r.ok && (await r.json()).engine === 'off'; } catch (e) {}
      if (off) { S.spark(false).lit(false).btn(''); S.el.classList.add('dark'); S.line('GlowBop is off');
        if (!inApp()) setTimeout(() => location.reload(), 900);   // 📱 the helper's Start GlowBop screen
        return; }
      if (manual) S.line('Looking for your laptop…');
      else if (Date.now() - shownAt > HELP_AFTER) S.line('Can’t find your laptop. Is it awake?').btn('Try again', () => { GB.sfx && GB.sfx('tap'); S.btn(''); check(true); });
    } finally { busy = false; }
  }
  // 📱 iPad / iPhone woke up after a long nap: reload so the console reconnects cleanly instead of showing old state
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    since = Date.now();                                            // phones pause pages while the screen is off: give the loops a moment
    if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) location.reload(); else check(true);
  });
  window.addEventListener('online', () => { since = Date.now(); check(); });
  setInterval(() => {
    if (document.hidden || GB.shuttingDown) return;
    const quietMs = Date.now() - Math.max(GB.lastOk || 0, since);
    const introBusy = document.getElementById('gbIntro') || document.querySelector('.gbi-off, .gbi-offbox, .gbi-grey, canvas.gbi-px');   // 🎬 let the intro finish first
    if (quietMs > GRACE && !introBusy) { show(true); check(); } else if (S) show(false);
  }, 1500);
})();
