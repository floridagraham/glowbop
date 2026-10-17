/* 🔘 BULB MAP (Pro Home, Oct 17, Graham: "a dot map of all your lights where you can push each light and turn it on and off,
   because when we make the sign we're going to need to turn off some lights individually").
   Every bulb is a dot where it sits on the wall (curtains as their grid, a string as a line). Tap a dot to switch that bulb off
   (it stays dark in every look) or back on; drag to paint many at once. The real bulb blinks white when you tap it.
   Saves to the laptop at once (POST /api/lights/hide {id, hide:[[from,to],...]}); POST /api/lights/pick blinks one bulb. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const COLS = ['#33d6ff', '#ff3d9a', '#ffcc33', '#2bd96b', '#b98cff', '#ff8a1a', '#7ae6ff', '#ff6a6a'];
  GB.css(`
  .bm-top { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .bm-top .chip { min-height:36px; }
  .bm-wrap { position:relative; overflow:auto; min-height:min(52vh, 440px); max-height:min(70vh, 680px); flex:1 1 auto; border-radius:0 14px 0 14px; background:#06050c; border:1px solid var(--line); touch-action:none; }
  .bm-wrap canvas { display:block; }
  .bm-tools { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 120px), 1fr)); gap:6px; }
  .bm-tools .btn { min-height:44px; font-size:calc(14px * var(--fs, 1)); }
  .bm-legend { display:flex; gap:14px; flex-wrap:wrap; font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:var(--dim); text-transform:uppercase; }
  .bm-legend span { background:none !important; color:var(--dim); padding:0; } .bm-legend i { display:inline-block; width:12px; height:12px; border-radius:50%; vertical-align:-1px; margin-right:6px; }
  `);
  let L = null, sel = '', grp = '', zoom = 1, hid = {}, undo = [], dirty = {}, saveT = null, canvas = null, ctx = null, dots = [];
  const ranges = arr => { const out = []; arr.forEach((h, i) => { if (!h) return; if (out.length && out[out.length - 1][1] === i - 1) out[out.length - 1][1] = i; else out.push([i, i]); }); return out; };
  const mask = (n, hr) => { const m = new Array(n).fill(false); (hr || []).forEach(([a, b]) => { for (let i = Math.max(0, a); i <= Math.min(n - 1, b); i++) m[i] = true; }); return m; };
  const devName = id => { const d = (L.devices || []).find(x => x.id === id); return d ? d.name : id; };
  const count = () => Object.values(hid).reduce((a, m) => a + m.filter(Boolean).length, 0);

  async function load() {
    try { L = await GB.get('/api/lights'); } catch (e) { return; }
    hid = {}; (L.points || []).forEach(p => { const dv = (L.devices || []).find(d => d.id === p.id) || {}; hid[p.id] = mask(p.n || p.x.length, dv.hide); });
    const gs = [...new Set((L.points || []).map(p => p.group || 'all'))]; if (!gs.includes(grp)) grp = gs[0] || '';
    paintTop(); draw();
  }
  function paintTop() {
    const box = $('bmTop'); if (!box || !L) return;
    const gs = [...new Set((L.points || []).map(p => p.group || 'all'))];
    const gName = g => ((L.groups || []).find(x => x.id === g) || {}).name || 'All lights';
    let h = gs.length > 1 ? gs.map(g => `<button class="chip${g === grp ? ' on' : ''}" data-g="${esc(g)}">${esc(gName(g))}</button>`).join('') : '';
    const ps = (L.points || []).filter(p => (p.group || 'all') === grp);
    h += `<button class="chip${!sel ? ' on' : ''}" data-d="">Every light</button>` + ps.map((p, i) => `<button class="chip${sel === p.id ? ' on' : ''}" data-d="${esc(p.id)}" style="--c:${COLS[i % COLS.length]}">${esc(devName(p.id))}</button>`).join('');
    box.innerHTML = h;
    box.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { grp = b.dataset.g; sel = ''; paintTop(); draw(); });
    box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { sel = b.dataset.d; paintTop(); draw(); });
    $('bmR').textContent = count() ? count() + ' OFF' : 'ALL ON';
  }
  // lay out the dots: canvas lights where they sit; strings (no map) as a row underneath
  function layout() {
    const ps = (L.points || []).filter(p => (p.group || 'all') === grp);
    const grid = ps.filter(p => !p.line), lines = ps.filter(p => p.line);
    let W = 1, H = 1; grid.forEach(p => { W = Math.max(W, Math.max(...p.x) + 1); H = Math.max(H, Math.max(...p.y) + 1); });
    const box = $('bmWrap'), avail = Math.max(260, box.clientWidth - 16);
    const s = Math.max(6, Math.min(22, avail / Math.max(W, 1))) * zoom, pad = s;
    dots = [];
    grid.forEach(p => { const ci = ps.indexOf(p); const seen = new Set();
      p.x.forEach((x, i) => { const k = x + ',' + p.y[i]; const dup = seen.has(k); seen.add(k);
        dots.push({id: p.id, i, cx: pad + x * s + (dup ? s * 0.25 : 0), cy: pad + p.y[i] * s + (dup ? s * 0.25 : 0), col: COLS[ci % COLS.length]}); }); });
    let y0 = pad + H * s + (grid.length ? s * 1.5 : 0);
    lines.forEach(p => { const ci = ps.indexOf(p), n = p.n || p.x.length, per = Math.max(1, Math.floor((W * s) / s)), wrap = Math.max(20, Math.min(n, Math.floor((avail * zoom - pad * 2) / s)));
      for (let i = 0; i < n; i++) dots.push({id: p.id, i, cx: pad + (i % wrap) * s, cy: y0 + Math.floor(i / wrap) * s, col: COLS[ci % COLS.length]});
      y0 += (Math.ceil(n / wrap) + 1.2) * s; void per; });
    return {w: Math.ceil(Math.max(pad * 2 + W * s, ...dots.map(d => d.cx + pad))), h: Math.ceil(Math.max(y0, ...dots.map(d => d.cy + pad))), s};
  }
  let geo = {s: 10};
  function draw() {
    if (!L || !canvas) return;
    geo = layout(); const dpr = window.devicePixelRatio || 1;
    canvas.width = geo.w * dpr; canvas.height = geo.h * dpr; canvas.style.width = geo.w + 'px'; canvas.style.height = geo.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, geo.w, geo.h);
    const r = Math.max(2.4, geo.s * 0.36);
    dots.forEach(d => {
      const off = (hid[d.id] || [])[d.i], faded = sel && d.id !== sel;
      ctx.globalAlpha = faded ? 0.25 : 1; ctx.beginPath(); ctx.arc(d.cx, d.cy, r, 0, Math.PI * 2);
      if (off) { ctx.fillStyle = '#0d0a16'; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#4a4366'; ctx.stroke(); }
      else { ctx.fillStyle = d.col; ctx.shadowColor = d.col; ctx.shadowBlur = geo.s * 0.5; ctx.fill(); ctx.shadowBlur = 0; }
    });
    ctx.globalAlpha = 1;
    $('bmR').textContent = count() ? count() + ' OFF' : 'ALL ON';
  }
  const hit = (x, y) => { let best = null, bd = (geo.s * 0.6) ** 2; dots.forEach(d => { if (sel && d.id !== sel) return; const q = (d.cx - x) ** 2 + (d.cy - y) ** 2; if (q < bd) { bd = q; best = d; } }); return best; };
  function setDot(d, off) {
    const m = hid[d.id]; if (!m || m[d.i] === off) return false;
    m[d.i] = off; dirty[d.id] = true; return true;
  }
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(async () => { const ids = Object.keys(dirty); dirty = {};
      for (const id of ids) await GB.post('/api/lights/hide', {id, hide: ranges(hid[id])}); }, 350);
  }
  function snapshot() { undo.push(JSON.stringify(hid)); if (undo.length > 30) undo.shift(); }
  // tap / drag painting
  let painting = null, lastPick = 0;
  function pos(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function onDown(e) {
    const d = hit(...pos(e)); if (!d) return;
    e.preventDefault(); snapshot(); painting = !(hid[d.id] || [])[d.i];        // first dot decides: switching off or on
    if (setDot(d, painting)) { draw(); save(); }
    const now = Date.now(); if (now - lastPick > 250) { lastPick = now; GB.post('/api/lights/pick', {id: d.id, i: d.i}); }
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function onMove(e) { if (painting === null) return; const d = hit(...pos(e)); if (d && setDot(d, painting)) { draw(); save(); } }
  function onUp() { painting = null; }

  GB.panel('home', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>🔘 Bulb map</span><span class="r" id="bmR">ALL ON</span></div>
      <p class="note">Every bulb, where it hangs. Tap a dot to switch that bulb off (it stays dark in every look), tap again to bring it back. Drag across dots to switch many at once. The real bulb blinks white when you tap it. Perfect for signs and logos.</p>
      <div class="bm-top" id="bmTop"></div>
      <div class="bm-wrap" id="bmWrap"><canvas id="bmCv" aria-label="Bulb map"></canvas></div>
      <div class="bm-legend"><span><i style="background:#33d6ff;box-shadow:0 0 6px #33d6ff"></i>On</span><span><i style="background:#0d0a16;border:1.5px solid #4a4366"></i>Off</span></div>
      <div class="bm-tools">
        <button class="btn" id="bmUndo">↶ Undo</button>
        <button class="btn" id="bmAllOn">All on</button>
        <button class="btn" id="bmZo">− Zoom</button>
        <button class="btn" id="bmZi">+ Zoom</button>
      </div>`;
    canvas = el.querySelector('#bmCv'); ctx = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    el.querySelector('#bmUndo').onclick = () => { const s = undo.pop(); if (!s) return GB.toast('Nothing to undo'); hid = JSON.parse(s); Object.keys(hid).forEach(id => dirty[id] = true); draw(); save(); };
    el.querySelector('#bmAllOn').onclick = () => { snapshot(); Object.keys(hid).forEach(id => { if (!sel || id === sel) { hid[id] = hid[id].map(() => false); dirty[id] = true; } }); draw(); save();
      GB.toast(sel ? '💡 Every bulb on ' + devName(sel) + ' is back on' : '💡 Every bulb is back on'); };
    el.querySelector('#bmZi').onclick = () => { zoom = Math.min(3, zoom * 1.3); draw(); };
    el.querySelector('#bmZo').onclick = () => { zoom = Math.max(0.5, zoom / 1.3); draw(); };
  });
  GB.on('page', id => { if (id === 'home') setTimeout(load, 50); });
  GB.on('ready', () => { if (GB.page === 'home') load(); });
  window.addEventListener('resize', () => { if (GB.page === 'home' && L) draw(); });
})();
