/* 📡 Find my lights, full screen (Oct 20, Graham: "you can't just push connect to my lights up at the top... it takes so long to
   scan there. You don't know what's going on. It feels too cumbersome"). The same look as GlowBop's start-up screen: a dim LED
   wall, the dot logo, the scanner sound with a ring rippling out on every sweep, and each light popping in the moment it answers,
   with a chime. Every brand's search shows its own progress. New lights are ticked; one big button adds them all. */
(function () {
  'use strict';
  const esc = GB.esc;
  const BRAND = {twinkly: 'Twinkly', wled: 'WLED', govee: 'Govee', nanoleaf: 'Nanoleaf', lifx: 'LIFX', surplife: 'Surplife curtain', daybetter: 'DayBetter', blecheap: 'LED strip', bluetooth: 'Bluetooth'};
  const SRC = [['twinkly', 'Twinkly'], ['nanoleaf', 'Nanoleaf'], ['lifx', 'LIFX'], ['wled', 'WLED'], ['govee', 'Govee'], ['bluetooth', 'Bluetooth']];
  GB.css(`
  #scanScr { position:fixed; inset:0; z-index:950; background:#000; display:none; }
  #scanScr.show { display:block; }
  #scanScr canvas { position:absolute; inset:0; width:100%; height:100%; }
  #scanScr .sc { position:absolute; inset:0; z-index:1; display:flex; flex-direction:column; align-items:center; gap:10px; overflow:auto;
    padding:calc(18px + env(safe-area-inset-top)) 16px calc(18px + env(safe-area-inset-bottom)); box-sizing:border-box; }
  #scanScr .logo { width:min(30vw, 18vh, 150px); height:auto; background:#000; border-radius:20px; padding:8px; box-shadow:0 0 30px 18px #000; flex:none; margin-top:min(4vh, 30px); }
  #scanScr .logo .d { opacity:.14; transition:opacity .3s, filter .3s; } #scanScr .logo .d.bg { opacity:1; }
  #scanScr .logo .d.on { opacity:1; filter:drop-shadow(0 0 3px currentColor); } #scanScr .logo .d.spark { fill:#fff !important; filter:drop-shadow(0 0 5px #fff); }
  #scanScr h2 { margin:0; font:800 calc(30px * var(--fs, 1))/1 var(--cond); letter-spacing:.16em; text-transform:uppercase;
    background:linear-gradient(90deg, var(--cyan), var(--violet), var(--pink)); -webkit-background-clip:text; background-clip:text; color:transparent; }
  #scanScr .st { margin:0; font:600 calc(14px * var(--fs, 1)) var(--mono); color:#c9b8ff; text-align:center; }
  #scanScr .srcs { display:flex; flex-wrap:wrap; justify-content:center; gap:6px; max-width:720px; }
  #scanScr .srcs span { min-height:36px; display:inline-flex; align-items:center; gap:6px; padding:0 12px; border-radius:18px; background:rgba(26,16,46,.94);
    font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--cyan); }
  #scanScr .srcs span.done { color:#3dffa8; }
  #scanScr .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:8px; width:min(96vw, 1000px); }
  #scanScr .card { display:flex; align-items:center; gap:10px; min-height:64px; padding:8px 12px; border-radius:14px; background:rgba(26,16,46,.96);
    box-shadow:inset 0 0 0 2px transparent; cursor:pointer; animation:scIn .4s cubic-bezier(.2,1.3,.4,1) both; text-align:left; border:0; color:var(--text); }
  #scanScr .card.pick { box-shadow:inset 0 0 0 2px var(--cyan), 0 0 14px rgba(51,214,255,.25); }
  #scanScr .card.have { opacity:.7; cursor:default; }
  #scanScr .card b { display:block; font:700 calc(17px * var(--fs, 1))/1.1 var(--cond); letter-spacing:.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  #scanScr .card small { display:block; font:600 calc(12px * var(--fs, 1)) var(--mono); color:#c9b8ff; }
  #scanScr .card .tx { min-width:0; flex:1; }
  #scanScr .card i { flex:none; width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-style:normal; font-weight:800; color:#000; background:#2a2140; }
  #scanScr .card.pick i { background:var(--cyan); }
  #scanScr .card.have i { background:#3dffa8; }
  @keyframes scIn { from { opacity:0; transform:translateY(12px) scale(.94); } to { opacity:1; transform:none; } }
  #scanScr .acts { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:6px; padding-bottom:6px; }
  #scanScr .acts .btn { min-height:64px; padding:0 26px; font-size:calc(19px * var(--fs, 1)); }
  #scanScr .acts .btn.c { min-width:260px; }
  #scanScr .none { max-width:560px; text-align:center; color:#c9b8ff; font:600 calc(14px * var(--fs, 1)) var(--mono); line-height:1.6; }
  `);

  let el = null, cv = null, cx = null, W = 0, H = 0, RINGS = [], raf = 0, timer = 0, sweep = 0, open = false, seen = {}, pick = {}, lit = 0, cap = 4, spark = 0, D = [];
  const P = 24, COLS = [[51, 214, 255], [155, 61, 255], [255, 61, 154]];

  // 🔊 the same scanner warble as the start-up screen (Graham picked "B"), the found chime, all made in code
  let AC = null;
  const ac = () => { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; };
  const quiet = () => { try { return localStorage.getItem('gb_sfx') === '0'; } catch (e) { return false; } };
  function envl(g, t, peak, att, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec); }
  function scanSnd() { if (quiet()) return; const a = ac(); if (!a) return; const t = a.currentTime + 0.02, out = a.createGain(); out.gain.value = 0.5; out.connect(a.destination);
    const g = a.createGain(); envl(g, t, 0.1, 0.03, 0.9); g.connect(out);
    const car = a.createOscillator(); car.type = 'sine'; car.frequency.setValueAtTime(1300, t); car.frequency.exponentialRampToValueAtTime(2100, t + 0.35); car.frequency.exponentialRampToValueAtTime(1600, t + 0.95);
    const mod = a.createOscillator(), mg = a.createGain(); mod.type = 'square'; mod.frequency.setValueAtTime(14, t); mod.frequency.linearRampToValueAtTime(26, t + 0.9); mg.gain.value = 180;
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); car.start(t); mod.start(t); car.stop(t + 1); mod.stop(t + 1);
    const sg = a.createGain(); envl(sg, t, 0.14, 0.03, 0.8); sg.connect(out); const sub = a.createOscillator(); sub.type = 'sine';
    sub.frequency.setValueAtTime(130, t); sub.frequency.exponentialRampToValueAtTime(196, t + 0.4); sub.connect(sg); sub.start(t); sub.stop(t + 0.9); }
  function tone(f, dur, vol, type, delay) { if (quiet()) return; const a = ac(); if (!a) return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); envl(g, t, vol, 0.012, dur); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05); }
  const chime = d => { tone(880, 0.16, 0.07, 'triangle', d); tone(1320, 0.28, 0.07, 'triangle', d + 0.11); };

  function build() {
    el = document.createElement('div'); el.id = 'scanScr';
    const rows = ['DDCCCDD', 'DCVVVCD', 'CVPPPVC', 'CVPWPVC', 'CVPPPVC', 'DCVVVCD', 'DDCCCDD'];
    const pal = {D: '#221d33', C: '#33d6ff', V: '#9b3dff', P: '#ff3d9a', W: '#ffffff'};
    const dots = rows.map((row, r) => [...row].map((ch, k) => `<circle class="d${ch === 'D' ? ' bg' : ''}" data-r="${r}" data-k="${k}" cx="${9 + k * 13}" cy="${9 + r * 13}" r="4.6" fill="${pal[ch]}"/>`).join('')).join('');
    el.innerHTML = `<canvas></canvas><div class="sc"><svg class="logo" viewBox="0 0 96 96" aria-hidden="true">${dots}</svg><h2>Find my lights</h2>
      <p class="st" id="scSt">Looking around your Wi-Fi and Bluetooth…</p><div class="srcs" id="scSrc"></div><div class="grid" id="scGrid"></div><p class="none" id="scNone" hidden></p>
      <div class="acts"><button class="btn c" id="scAdd" style="--c:var(--cyan)" disabled>${GB.svg('add')}<span>Add these lights</span></button>
      <button class="btn" id="scAgain">${GB.svg('refresh')}<span>Scan again</span></button><button class="btn ghost" id="scClose">${GB.svg('back')}<span>Back to my lights</span></button></div></div>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); cx = cv.getContext('2d');
    D = [...el.querySelectorAll('.logo .d:not(.bg)')].sort((a, b) => Math.hypot(a.dataset.r - 3, a.dataset.k - 3) - Math.hypot(b.dataset.r - 3, b.dataset.k - 3));
    el.querySelector('#scClose').onclick = close; el.querySelector('#scAgain').onclick = () => start();
    el.querySelector('#scAdd').onclick = addPicked;
    addEventListener('resize', fit);
  }
  function fit() { if (!cv) return; const r = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = W * r; cv.height = H * r; cx.setTransform(r, 0, 0, r, 0, 0); }
  const mix = t => { t = Math.max(0, Math.min(1, t)) * 2; const i = Math.min(1, Math.floor(t)), f = t - i, a = COLS[i], b = COLS[i + 1]; return a.map((v, k) => Math.round(v + (b[k] - v) * f)); };
  function ring() { const lg = el.querySelector('.logo').getBoundingClientRect(); RINGS.push({t: performance.now(), x: lg.left + lg.width / 2, y: lg.top + lg.height / 2}); if (RINGS.length > 4) RINGS.shift(); }
  function draw(now) {
    if (!open) return; cx.clearRect(0, 0, W, H); const maxD = Math.hypot(W, H); RINGS = RINGS.filter(r => now - r.t < 4200);
    for (let y = P / 2; y < H; y += P) for (let x = P / 2; x < W; x += P) { let hit = 0, dd = 0;
      for (const r of RINGS) { const age = (now - r.t) / 1000, R = age * 300, d = Math.hypot(x - r.x, y - r.y), k = Math.exp(-Math.pow((d - R) / 30, 2)) * Math.max(0, 1 - age / 4.2); if (k > hit) { hit = k; dd = d; } }
      if (hit > 0.02) { const c = mix(dd / (maxD * 0.6)); cx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.08 + 0.32 * hit).toFixed(3)})`; } else cx.fillStyle = '#14111f';
      cx.beginPath(); cx.arc(x, y, 4.2, 0, 6.283); cx.fill(); }
    raf = requestAnimationFrame(draw);
  }
  function tick() {                                            // the logo fills in as lights are found; a spark circles when it's full
    if (lit < Math.min(cap, D.length)) { D[lit].classList.add('on'); lit++; return; }
    if (lit >= D.length) { D.forEach(d => d.classList.remove('spark')); D[spark % D.length].classList.add('spark'); spark++; }
  }

  async function start() {
    if (!el) build();
    open = true; el.classList.add('show'); fit(); seen = {}; lit = 0; cap = 4; D.forEach(d => d.classList.remove('on', 'spark'));
    el.querySelector('#scGrid').innerHTML = ''; el.querySelector('#scNone').hidden = true; paintAdd();
    el.querySelector('#scSt').textContent = 'Looking around your Wi-Fi and Bluetooth…';
    el.querySelector('#scSrc').innerHTML = SRC.map(([k, t]) => `<span data-s="${k}">⏳ ${t}</span>`).join('');
    cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    clearInterval(timer); timer = setInterval(tick, 70);
    ac(); scanSnd(); ring(); clearInterval(sweep); sweep = setInterval(() => { if (open && !done) { scanSnd(); ring(); } }, 2200);
    done = false;
    const r = await GB.post('/api/lights/scan', {live: true}); if (!r) { close(); return; }
    poll();
  }
  let done = false, pt = 0;
  async function poll() {
    clearTimeout(pt); if (!open) return;
    let s = null; try { s = await GB.get('/api/lights/scan'); } catch (e) {}
    if (s) paint(s);
    if (s && s.done) { done = true; return finish(s); }
    pt = setTimeout(poll, 600);
  }
  function paint(s) {
    const g = el.querySelector('#scGrid'); let q = 0;
    (s.found || []).forEach(f => {
      if (seen[f.id]) { const c = g.querySelector(`[data-id="${CSS.escape(f.id)}"]`); if (c && f.added) { c.classList.add('have'); c.classList.remove('pick'); c.querySelector('i').textContent = '✓'; } return; }
      seen[f.id] = f; if (!f.added) pick[f.id] = true; else delete pick[f.id];
      const c = document.createElement('button'); c.type = 'button'; c.className = 'card' + (f.added ? ' have' : ' pick'); c.dataset.id = f.id;
      c.innerHTML = `<i>${f.added ? '✓' : '+'}</i><span class="tx"><b>${esc(f.name || f.ip)}</b><small>${esc(BRAND[f.type] || f.type)}${f.n > 1 ? ' · ' + f.n + ' lights' : ''}${f.added ? ' · already yours' : ''}</small></span>`;
      if (!f.added) c.onclick = () => { pick[f.id] = !pick[f.id]; c.classList.toggle('pick', !!pick[f.id]); c.querySelector('i').textContent = pick[f.id] ? '+' : ''; paintAdd(); };
      g.appendChild(c); if (q < 8) chime(q * 0.14); q++;
    });
    Object.entries(s.sources || {}).forEach(([k, v]) => { const sp = el.querySelector(`#scSrc [data-s="${k}"]`); if (sp) { sp.classList.toggle('done', v === 'done'); sp.textContent = (v === 'done' ? '✓ ' : '⏳ ') + ((SRC.find(x => x[0] === k) || [k, k])[1]); } });
    const n = (s.found || []).length; cap = Math.max(cap, Math.min(D.length, 4 + n * 4));
    el.querySelector('#scSt').textContent = n ? `${n} light${n > 1 ? 's' : ''} found so far · still looking…` : 'Looking around your Wi-Fi and Bluetooth…';
    paintAdd();
  }
  function finish(s) {
    clearInterval(sweep); cap = D.length;
    const n = (s.found || []).length, fresh = (s.found || []).filter(f => !f.added).length;
    el.querySelector('#scSt').textContent = n ? (fresh ? `Found ${n} light${n > 1 ? 's' : ''}, ${fresh} new. Tap a light to skip it.` : `Found ${n} light${n > 1 ? 's' : ''}: they're all yours already.`) : 'No lights answered.';
    const none = el.querySelector('#scNone');
    if (!n) { none.hidden = false; none.innerHTML = 'Lights plugged in and on the same Wi-Fi as this laptop?<br>Govee: turn on <b>LAN Control</b> in the Govee app. Nanoleaf: turn on its <b>API</b> in the Nanoleaf app.<br>Bluetooth curtains and strips: close their phone app first.'; }
    if (fresh) { tone(1046, 0.2, 0.05, 'triangle', 0.1); tone(1568, 0.35, 0.05, 'triangle', 0.22); }
    paintAdd();
  }
  function paintAdd() {
    const b = el && el.querySelector('#scAdd'); if (!b) return; const n = Object.values(pick).filter(Boolean).length;
    b.disabled = !n; b.querySelector('span').textContent = n ? `Add ${n} light${n > 1 ? 's' : ''}` : 'Add these lights';
  }
  async function addPicked() {
    const ids = Object.keys(pick).filter(k => pick[k]); if (!ids.length) return;
    const b = el.querySelector('#scAdd'); b.disabled = true; let ok = 0;
    for (const id of ids) { const f = seen[id]; if (!f) continue;
      b.querySelector('span').textContent = `Adding ${f.name || f.ip}…`;
      if (f.type === 'nanoleaf') GB.toast('🌿 Nanoleaf: hold its power button about 5 s until the light flashes, so GlowBop can pair', 8000);
      const r = await GB.post('/api/lights/add', {type: f.type, ip: f.ip, name: f.name, style: f.style, model: f.model, port: f.port, mac: f.mac, serial: f.serial, target: f.target, zones: f.zones, product: f.product, tiles: f.tiles, legacy: f.legacy});
      if (r && r.ok) { ok++; delete pick[id]; const c = el.querySelector(`[data-id="${CSS.escape(id)}"]`); if (c) { c.classList.remove('pick'); c.classList.add('have'); c.querySelector('i').textContent = '✓'; c.onclick = null; }
        GB.freed && GB.freed(f.name); } }
    paintAdd(); if (ok) { GB.sfx && GB.sfx('ok'); GB.toast(`💡 Added ${ok} light${ok > 1 ? 's' : ''}. Drag them on the LIGHTS board to where they really hang.`); GB.emit && GB.emit('lightsChanged'); }
  }
  function close() {
    open = false; clearInterval(timer); clearInterval(sweep); clearTimeout(pt); cancelAnimationFrame(raf);
    if (el) el.classList.remove('show');
    GB.lightsReload && GB.lightsReload();
  }
  GB.findLights = start;
  document.addEventListener('keydown', e => { if (open && e.key === 'Escape') close(); });
})();
