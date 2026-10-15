/* 🎚️ Fader board (LIVE BOARD page, GlowBop Pro DJ): six live faders that sit on top of whatever is playing.
   Talks to GET/POST /api/faders (faders.py on the laptop) and follows /api/status (faders) so every phone, iPad and the
   laptop show the same positions. Drag anywhere on a fader (relative, so a stray touch never jumps the lights); every
   finger drives its own fader, so two fingers move two faders at once. Double-tap a fader to reset it. The key under each
   fader is momentary: it works while your finger is down. Moves are sent at most ~30 times a second, newest value wins. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const ZONES = ['1 BEAT', '1/2', '1/4', '1/8'];
  const hueOf = v => (Math.max(1, v) - 1) / 99 * 0.92 * 360;                // same wheel as faders.py (stops at pink)
  const FADERS = [
    {k: 'master', label: 'Master', name: 'Master brightness', c: 'var(--gold)', def: 100, fl: ['dark', 'BLACKOUT', 'Hold for blackout'],
     fmt: v => Math.round(v) + '%'},
    {k: 'speed', label: 'SPEED', name: 'Animation speed', c: 'var(--cyan)', def: 1, fl: ['ffwd', '2X', 'Hold for double time'],
     fmt: v => (v < 1 ? v.toFixed(2) : v.toFixed(1)) + '×',
     toPos: v => v <= 1 ? 0.5 * Math.log(v / 0.25) / Math.log(4) : 0.5 + 0.5 * Math.log(v) / Math.log(3),
     fromPos: p => p <= 0.5 ? 0.25 * Math.pow(4, p / 0.5) : Math.pow(3, (p - 0.5) / 0.5), step: 0.01},
    {k: 'strobe', label: 'STROBE', name: 'Strobe, on the beat', c: '#ffffff', def: 0, fl: ['bolt', 'FULL', 'Hold for a full strobe'],
     fmt: v => v <= 0 ? 'OFF' : ZONES[Math.min(3, Math.floor((v - 1e-9) / 25))]},
    {k: 'color', label: 'COLOR', name: 'Colour wheel', c: 'var(--pink)', def: 0, fl: ['rainbow', 'RAINBOW', 'Hold for a rainbow sweep'],
     fmt: v => v <= 0 ? 'OFF' : `<i class="fd-sw" style="background:hsl(${hueOf(v).toFixed(0)},100%,55%)"></i>`},
    {k: 'white', label: 'WHITE', name: 'Blend to white', c: 'var(--lav)', def: 0, fl: ['sun', 'WHITE', 'Hold for full white'],
     fmt: v => v <= 0 ? 'OFF' : Math.round(v) + '%'},
    {k: 'trails', label: 'TRAILS', name: 'Trails', c: 'var(--violet)', def: 0, fl: ['freeze', 'FREEZE', 'Hold to freeze the picture'],
     fmt: v => v <= 0 ? 'OFF' : Math.round(v) + '%'},
  ];
  FADERS.forEach(f => { f.toPos = f.toPos || (v => v / 100); f.fromPos = f.fromPos || (p => p * 100); f.step = f.step || 1; });
  const FD = {};                         // k -> {f, el, v, drag, until}
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const rnd = (f, v) => f.k === 'speed' ? Math.round(v * 100) / 100 : Math.round(v);

  GB.css(`
  #fdPanel { padding-left:10px; padding-right:10px; }
  .fd-board { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:6px; user-select:none; -webkit-user-select:none; }
  .fd { display:flex; flex-direction:column; align-items:stretch; gap:6px; min-width:0; }
  .fd-lab { font:700 calc(11px * var(--fs, 1))/1 var(--cond); letter-spacing:.5px; color:var(--c); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:clip; }
  .fd-val { font:calc(12px * var(--fs, 1))/1 var(--mono); color:var(--text); text-align:center; height:calc(14px * var(--fs, 1)); display:flex; align-items:center; justify-content:center; white-space:nowrap; }
  .fd.away .fd-val { color:var(--c); text-shadow:0 0 8px var(--c); }
  .fd-sw { display:inline-block; width:calc(14px * var(--fs, 1)); height:calc(14px * var(--fs, 1)); border-radius:50%; box-shadow:0 0 8px currentColor, 0 0 0 2px #fff4; }
  .fd-track { position:relative; height:170px; border-radius:10px; background:var(--dark2); box-shadow:inset 0 0 0 1px var(--line); touch-action:none; cursor:ns-resize; outline:none; overflow:hidden; }
  .fd-track:focus-visible { box-shadow:inset 0 0 0 2px var(--c); }
  .fd-rail { position:absolute; left:0; right:0; top:16px; bottom:16px; }
  .fd-rail::before { content:''; position:absolute; inset:0 calc(50% - 3px); border-radius:3px; background:#06050c; }
  .fd-ticks { position:absolute; inset:0 4px; background:repeating-linear-gradient(0deg, #ffffff22 0 1px, transparent 1px 10%); pointer-events:none; }
  .fd-fill { position:absolute; left:calc(50% - 3px); right:calc(50% - 3px); bottom:0; border-radius:3px; background:var(--c); box-shadow:0 0 12px var(--c); }
  .fd-cap { position:absolute; left:3px; right:3px; height:26px; margin-bottom:-13px; border-radius:7px; background:linear-gradient(#f4f2ff, #b9b4d6); box-shadow:0 2px 8px #000c, 0 0 0 1px #000; pointer-events:none; }
  .fd-cap::after { content:''; position:absolute; left:18%; right:18%; top:calc(50% - 1.5px); height:3px; border-radius:2px; background:var(--c); box-shadow:0 0 6px var(--c); }
  .fd-cap::before { content:''; position:absolute; inset:0; border-radius:7px; background:repeating-linear-gradient(0deg, transparent 0 4px, #0002 4px 5px); }
  .fd.moving .fd-cap, .fd-track:active .fd-cap { box-shadow:0 2px 8px #000c, 0 0 0 1px #000, 0 0 18px var(--c); }
  .fd-mark { position:absolute; left:0; right:0; height:2px; margin-bottom:-1px; background:var(--c); opacity:.8; pointer-events:none; }
  .fd-zl { position:absolute; left:3px; font:calc(9px * var(--fs, 1))/1 var(--mono); color:var(--dim); pointer-events:none; margin-bottom:-5px; }
  .fd[data-k=color] .fd-rail::before { inset:0 calc(50% - 4px); width:auto; opacity:.9; background:linear-gradient(0deg, #06050c 0 1%, ${[0, 40, 80, 120, 160, 200, 240, 280, 331].map((h, i) => `hsl(${h},100%,50%) ${(1 + i / 8 * 99).toFixed(1)}%`).join(', ')}); }
  .fd[data-k=color] .fd-fill { display:none; }
  .fd-fl { appearance:none; border:0; border-radius:10px; min-height:40px; padding:4px 2px; background:var(--dark); color:var(--text); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
    touch-action:none; -webkit-touch-callout:none; font:700 calc(10px * var(--fs, 1))/1 var(--cond); letter-spacing:.5px; }
  .fd-fl .em { font-size:calc(18px * var(--fs, 1)); line-height:1; display:flex; color:var(--c); }
  .fd-fl .em .ic { width:1.1em; height:1.1em; vertical-align:0; filter:drop-shadow(0 0 5px var(--c)); }
  .fd-fl.held .em { color:inherit; } .fd-fl.held .em .ic { filter:none; }
  .fd-fl .w { display:none; }
  .fd-fl.held { background:var(--c); color:#000; box-shadow:0 0 22px var(--c); }
  .fd[data-k=master] .fd-fl.held { background:#000; color:#fff; box-shadow:0 0 0 2px var(--gold) inset, 0 0 22px var(--gold); }
  .fd-foot { display:flex; gap:8px; align-items:center; }
  .fd-foot .btn { flex:0 0 auto; }
  .fd-foot .note { flex:1; min-width:0; }
  @media (max-width: 699px) { .fd-foot { flex-direction:column; align-items:stretch; } .fd-foot .btn { order:-1; } }
  #fdPanel .ph .r.up { color:var(--cyan); }
  @media (min-width: 700px) {
    .fd-board { gap:10px; }
    .fd-track { height:220px; }
    .fd-lab { font-size:calc(13px * var(--fs, 1)); letter-spacing:1.5px; }
    .fd-val { font-size:calc(14px * var(--fs, 1)); height:calc(16px * var(--fs, 1)); }
    .fd-fl { min-height:48px; }
    .fd-fl .w { display:block; }
    .fd-cap { left:6px; right:6px; }
    .fd-zl { left:6px; font-size:calc(10px * var(--fs, 1)); }
  }
  @media (min-width: 1000px) and (min-aspect-ratio: 1/1) { .fd-track { height:200px; } .fd-board { gap:8px; } }
  @media (min-width: 1000px) and (min-aspect-ratio: 1/1) and (max-height: 820px) { .fd-track { height:170px; } }
  `);

  // ------------------------------------------------------------------ sending: ~30 posts a second at most, newest value wins
  const pend = {}; let timer = null, inflight = false, last = 0;
  function queue(k, v) { pend[k] = v; schedule(); }
  function schedule() { if (timer || inflight) return; timer = setTimeout(flush, Math.max(0, 33 - (performance.now() - last))); }
  async function flush() {
    timer = null; const keys = Object.keys(pend); if (!keys.length) return;
    const body = {}; keys.forEach(k => { body[k] = pend[k]; delete pend[k]; });
    inflight = true; last = performance.now();
    try {
      const r = await fetch('/api/faders', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      const j = await r.json();
      if (r.status === 402) { GB.toast('🔒 ' + (j.message || 'This is a GlowBop Pro DJ feature.')); GB.setPro(false); }
      else if (r.ok) paintHead(j);
    } catch (e) {}
    inflight = false; if (Object.keys(pend).length) schedule();
  }
  const fpost = b => GB.post('/api/faders', b);

  // ------------------------------------------------------------------ one fader
  function paint(k) {
    const d = FD[k], f = d.f, p = clamp(f.toPos(d.v), 0, 1), el = d.el;
    el.querySelector('.fd-cap').style.bottom = (p * 100) + '%';
    const fill = el.querySelector('.fd-fill');
    if (f.k === 'speed') { const lo = Math.min(p, 0.5), hi = Math.max(p, 0.5); fill.style.bottom = (lo * 100) + '%'; fill.style.height = ((hi - lo) * 100) + '%'; }
    else fill.style.height = (p * 100) + '%';
    el.querySelector('.fd-val').innerHTML = f.fmt(d.v);
    el.classList.toggle('away', Math.abs(d.v - f.def) > 1e-6);
    const tr = el.querySelector('.fd-track');
    tr.setAttribute('aria-valuenow', String(rnd(f, d.v))); tr.setAttribute('aria-valuetext', f.k === 'color' ? (d.v <= 0 ? 'off' : 'hue ' + Math.round(hueOf(d.v))) : el.querySelector('.fd-val').textContent);
  }
  function setV(k, v, send) {
    const d = FD[k], f = d.f;
    v = f.k === 'speed' ? clamp(v, 0.25, 3) : clamp(v, 0, 100); v = rnd(f, v);
    if (v === d.v) return; d.v = v; paint(k); paintHead();
    if (send) { d.until = performance.now() + 900; queue(k, v); }
  }
  function reset(k) { setV(k, FD[k].f.def, true); GB.sfx('ok'); GB.toast('↺ ' + FD[k].f.label + ' back to ' + FD[k].f.fmt(FD[k].f.def).replace(/<[^>]+>/g, '')); }

  function build(f, host) {
    const el = document.createElement('div'); el.className = 'fd'; el.dataset.k = f.k; el.style.setProperty('--c', f.c);
    const marks = f.k === 'speed' ? `<i class="fd-mark" style="bottom:50%"></i><span class="fd-zl" style="bottom:50%;transform:translateY(-9px)">1×</span>`
      : f.k === 'strobe' ? [25, 50, 75].map(p => `<i class="fd-mark" style="bottom:${p}%;opacity:.35"></i>`).join('') + ['1', '½', '¼', '⅛'].map((z, i) => `<span class="fd-zl" style="bottom:${12.5 + i * 25}%">${z}</span>`).join('') : '';
    el.innerHTML = `<div class="fd-lab">${f.label}</div><div class="fd-val"></div>
      <div class="fd-track" role="slider" tabindex="0" aria-orientation="vertical" aria-label="${esc(f.name)}" aria-valuemin="${f.k === 'speed' ? 0.25 : 0}" aria-valuemax="${f.k === 'speed' ? 3 : 100}">
        <div class="fd-rail"><div class="fd-ticks"></div><div class="fd-fill"></div>${marks}<div class="fd-cap"></div></div></div>
      <button class="fd-fl" aria-label="${esc(f.fl[2])}" title="${esc(f.fl[2])}"><span class="em">${GB.svg(f.fl[0])}</span><span class="w">${f.fl[1]}</span></button>`;
    host.appendChild(el);
    const d = FD[f.k] = {f, el, v: f.def, drag: null, until: 0, tapT: 0, tapY: 0};
    const tr = el.querySelector('.fd-track'), rail = el.querySelector('.fd-rail');
    tr.addEventListener('pointerdown', e => {
      if (e.button > 0) return; e.preventDefault();
      try { tr.setPointerCapture(e.pointerId); } catch (er) {}
      const now = performance.now();
      if (now - d.tapT < 340 && Math.abs(e.clientY - d.tapY) < 50) { d.tapT = 0; d.drag = null; reset(f.k); return; }   // double-tap: reset
      d.drag = {id: e.pointerId, y0: e.clientY, p0: clamp(f.toPos(d.v), 0, 1), moved: false};
      el.classList.add('moving'); d.until = now + 100000;
    });
    tr.addEventListener('pointermove', e => {
      const g = d.drag; if (!g || e.pointerId !== g.id) return;
      const dy = g.y0 - e.clientY; if (!g.moved && Math.abs(dy) < 3) return; g.moved = true;
      let p = clamp(g.p0 + dy / Math.max(40, rail.clientHeight), 0, 1);
      if (f.k === 'speed' && Math.abs(p - 0.5) < 0.035) p = 0.5;                 // centre detent: 1×
      setV(f.k, f.fromPos(p), true);
    });
    const up = e => {
      const g = d.drag; if (!g || e.pointerId !== g.id) return;
      d.drag = null; el.classList.remove('moving'); d.until = performance.now() + 900;
      if (!g.moved) { d.tapT = performance.now(); d.tapY = e.clientY; }
    };
    tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up); tr.addEventListener('lostpointercapture', up);
    tr.addEventListener('dblclick', e => e.preventDefault());
    tr.addEventListener('keydown', e => {
      const big = e.key === 'PageUp' || e.key === 'PageDown', dir = (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageUp') ? 1 : (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'PageDown') ? -1 : 0;
      if (dir) { e.preventDefault(); setV(f.k, f.fromPos(clamp(f.toPos(d.v) + dir * (big ? 0.1 : 0.02), 0, 1)), true); }
      else if (e.key === 'Home') { e.preventDefault(); setV(f.k, f.fromPos(1), true); }
      else if (e.key === 'End') { e.preventDefault(); setV(f.k, f.fromPos(0), true); }
      else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') { e.preventDefault(); reset(f.k); }
    });
    tr.addEventListener('wheel', e => { e.preventDefault(); setV(f.k, f.fromPos(clamp(f.toPos(d.v) - Math.sign(e.deltaY) * 0.03, 0, 1)), true); }, {passive: false});
    // the momentary key: on while the finger is down (refreshed so the engine lets go by itself if the phone drops out)
    const b = el.querySelector('.fd-fl'); let keep = null, pid = null;
    const on = e => { if (e.button > 0) return; e.preventDefault(); if (pid !== null) return; pid = e.pointerId; try { b.setPointerCapture(e.pointerId); } catch (er) {}
      b.classList.add('held'); fpost({flash: f.k, on: true}); keep = setInterval(() => fpost({flash: f.k, on: true}), 400); };
    const off = e => { if (pid === null || (e && e.pointerId !== pid)) return; pid = null; clearInterval(keep); b.classList.remove('held'); fpost({flash: f.k, on: false}); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
    b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && pid === null && !e.repeat) { e.preventDefault(); pid = 'key'; b.classList.add('held'); fpost({flash: f.k, on: true}); keep = setInterval(() => fpost({flash: f.k, on: true}), 400); } });
    b.addEventListener('keyup', e => { if ((e.key === ' ' || e.key === 'Enter') && pid === 'key') { pid = null; clearInterval(keep); b.classList.remove('held'); fpost({flash: f.k, on: false}); } });
    window.addEventListener('blur', () => off());
    paint(f.k);
  }

  // ------------------------------------------------------------------ the panel
  function paintHead() {
    const r = $('fdR'); if (!r) return;
    const up = FADERS.filter(f => Math.abs(FD[f.k].v - f.def) > 1e-6);
    r.textContent = up.length ? (innerWidth < 700 ? up.length + ' UP' : up.map(f => f.label).join(' · ')) : (innerWidth < 700 ? 'AT DEFAULT' : 'ALL AT DEFAULT');
    r.classList.toggle('up', !!up.length);
    const b = $('fdReset'); if (b) b.disabled = !up.length;
  }
  GB.panel('board', 10, el => {                                // 🎚️ LIVE BOARD, first: the faders, then hit pads, then the loop banks
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)'); el.id = 'fdPanel';
    el.innerHTML = `<div class="ph"><span>Fader board</span><span class="r" id="fdR">ALL AT DEFAULT</span></div>
      <div class="fd-board" id="fdBoard"></div>
      <div class="fd-foot"><p class="note">Drag a fader up or down (two fingers move two at once). Double-tap one to reset it. Hold the flash key under a fader for blackout, double time, full strobe, rainbow, full white or freeze.</p>
        <button class="btn sm" id="fdReset" style="--c:var(--cyan)">${GB.svg('reset')}<span>Reset all</span></button></div>`;
    const host = el.querySelector('#fdBoard'); FADERS.forEach(f => build(f, host));
    $('fdReset').onclick = async () => {
      FADERS.forEach(f => { FD[f.k].v = f.def; FD[f.k].until = performance.now() + 900; paint(f.k); }); paintHead();
      Object.keys(pend).forEach(k => delete pend[k]);
      if (await fpost({reset: true})) { GB.sfx('ok'); GB.toast('↺ Faders back to normal'); }
    };
    paintHead();
    GB.proGate(el, 'Fader board', {pitch: 'Six live faders that ride on top of any show: Master, speed, a strobe locked to the beat, a colour wheel, white and trails. Two fingers, two faders, with a flash key under each one.'});
  });

  // ------------------------------------------------------------------ follow the engine (other phones move the faders too)
  function sync(fd) {
    if (!fd || !fd.values) return;
    const now = performance.now();
    FADERS.forEach(f => {
      const d = FD[f.k]; if (!d || d.drag || now < d.until || f.k in pend) return;
      const v = Number(fd.values[f.k]); if (!isFinite(v) || v === d.v) return;
      d.v = v; paint(f.k);
    });
    paintHead();
  }
  GB.on('status', s => sync(s.faders));
  GB.on('page', async id => { if (id !== 'board' || GB.pro === false) return; try { sync(await GB.get('/api/faders')); } catch (e) {} });
  GB.faders = {state: FD, list: FADERS, queue};
})();
