/* 💤 "Can't reach the laptop" screen.
   When the phone / iPad loses the GlowBop laptop for a few seconds, a friendly full screen slides over the console:
   a sleepy pixel curtain, what to check, and a live "looking for your laptop" line. It disappears by itself the moment
   the laptop answers again (GB.lastOk is refreshed by the status and frame loops in core.js). */
(function () {
  'use strict';
  const GRACE = 5000;                              // how long without an answer before the screen shows
  let shown = false, since = Date.now(), tries = 0, el = null, raf = 0, shownAt = 0;

  GB.css(`
  #offScr { position:fixed; inset:0; z-index:900; background:radial-gradient(120% 80% at 50% 0%, #1a0f2e 0%, #000 70%);
    display:flex; align-items:center; justify-content:center; padding:calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
    opacity:0; pointer-events:none; transition:opacity .45s ease; }
  #offScr.show { opacity:1; pointer-events:auto; }
  #offScr .box { width:100%; max-width:470px; border-left:14px solid var(--lav); border-radius:0 30px 0 30px; background:var(--panel);
    padding:22px 20px 20px; display:flex; flex-direction:column; gap:14px; box-shadow:0 0 60px #9b3dff33; }
  #offScr .bar { display:flex; gap:6px; height:12px; } #offScr .bar i { border-radius:6px; background:var(--c); }
  #offScr canvas { width:100%; height:auto; aspect-ratio:16/7; border-radius:16px; background:#05040a; border:2px solid #2e2845; }
  #offScr h2 { margin:0; font:800 28px/1.05 var(--cond); letter-spacing:2px; text-transform:uppercase; }
  #offScr h2 span { color:var(--lav); }
  #offScr p { margin:0; color:var(--dim); line-height:1.45; }
  #offScr ul { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
  #offScr li { display:flex; gap:12px; align-items:center; background:var(--dark2); border-radius:14px; padding:10px 12px; font:600 17px var(--cond); letter-spacing:.5px; }
  #offScr li b { font-size:20px; width:28px; text-align:center; }
  #offScr li small { display:block; font:400 13px var(--body); color:var(--dim); letter-spacing:0; }
  #offScr .look { font:14px var(--mono); color:var(--cyan); letter-spacing:1px; display:flex; align-items:center; gap:10px; }
  #offScr .look i { width:10px; height:10px; border-radius:50%; background:var(--cyan); animation:offPing 1.4s ease-in-out infinite; }
  @keyframes offPing { 0%,100% { opacity:.25; transform:scale(.7); } 50% { opacity:1; transform:scale(1.15); } }
  #offScr .row { display:flex; gap:10px; } #offScr .row .btn { flex:1; }
  `);

  function build() {
    el = document.createElement('div'); el.id = 'offScr'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="box">
      <div class="bar"><i style="--c:var(--lav);width:40px"></i><i style="--c:var(--pink);flex:1"></i><i style="--c:var(--amber);width:26px"></i><i style="--c:var(--cyan);width:56px"></i></div>
      <canvas id="offCv" width="320" height="140" aria-hidden="true"></canvas>
      <h2>Your lights are <span>taking a breather</span> 💤</h2>
      <p>We can't reach your GlowBop laptop right now. No worries, nothing is lost. The show picks right back up the second we find it.</p>
      <ul>
        <li><b>📶</b><div>Same Wi-Fi as the laptop?<small>Phones love to jump to cellular. Check you're on your home Wi-Fi.</small></div></li>
        <li><b>💻</b><div>Laptop awake?<small>If it went to sleep, wake it up. Plugged in is best during a show.</small></div></li>
        <li><b>✨</b><div>GlowBop open on the laptop?<small>Look for the GlowBop icon by the clock. If it's not there, start GlowBop.</small></div></li>
      </ul>
      <div class="look"><i></i><span id="offMsg">Looking for your laptop…</span></div>
      <div class="row"><button class="btn c" id="offTry" style="--c:var(--cyan)">Try again now</button><button class="btn c" id="offReload" style="--c:var(--lav)">Reload page</button></div>
    </div>`;
    document.body.appendChild(el);
    el.querySelector('#offTry').onclick = () => { tries++; check(true); GB.sfx && GB.sfx('tap'); };
    el.querySelector('#offReload').onclick = () => location.reload();
  }

  // a sleepy little curtain: slow breathing waves of GlowBop colours, with a "z" drifting up now and then
  const COLS = [[255, 61, 154], [155, 61, 255], [51, 214, 255], [255, 178, 61], [204, 153, 255]];
  function draw(t) {
    const cv = document.getElementById('offCv'); if (!cv || !shown) return;
    const cx = cv.getContext('2d'), W = 32, H = 14, st = cv.width / W;
    cx.fillStyle = '#05040a'; cx.fillRect(0, 0, cv.width, cv.height);
    const s = t / 1000;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 0.5 + 0.5 * Math.sin(x * 0.35 + s * 0.9 + Math.sin(y * 0.5 + s * 0.4) * 1.4);
      const br = (0.08 + 0.32 * v * v) * (0.75 + 0.25 * Math.sin(s * 1.1));
      const c = COLS[Math.floor((x / W * 2 + s * 0.05 + y / H * 0.6)) % COLS.length];
      cx.fillStyle = `rgb(${c[0] * br | 0},${c[1] * br | 0},${c[2] * br | 0})`;
      cx.beginPath(); cx.arc(x * st + st / 2, y * st + st / 2 - 0.5, st * 0.36, 0, 6.283); cx.fill();
    }
    cx.font = `700 ${Math.round(st * 2.2)}px 'Saira Condensed', sans-serif`; cx.textAlign = 'center';
    for (let k = 0; k < 3; k++) {
      const p = ((s * 0.35 + k / 3) % 1);
      cx.fillStyle = `rgba(204,153,255,${Math.sin(p * Math.PI) * 0.9})`;
      cx.font = `700 ${Math.round(st * (1.4 + k * 0.5))}px 'Saira Condensed', sans-serif`;
      cx.fillText('z', cv.width * 0.72 + p * st * 4 + k * st, cv.height * (0.85 - p * 0.7));
    }
    raf = requestAnimationFrame(draw);
  }

  function show(on) {
    if (on === shown) return;
    shown = on; if (!el) build();
    el.classList.toggle('show', on);
    cancelAnimationFrame(raf);
    if (on) { tries = 0; shownAt = Date.now(); raf = requestAnimationFrame(draw); }
    else {
      if (GB.toast) GB.toast('✨ Back online. Your lights are ready!');
      if (Date.now() - shownAt > 20000) setTimeout(() => location.reload(), 900);   // long outage (laptop restarted): start fresh
    }
  }
  // 📱 iPad / iPhone woke up after a long nap: reload so the console reconnects cleanly instead of showing old state
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000) location.reload(); else check(true);
  });

  async function check(manual) {
    if (manual) { const m = document.getElementById('offMsg'); if (m) m.textContent = 'Knocking on the laptop’s door…'; }
    try {
      const r = await fetch('/api/status', {cache: 'no-store'});
      if (r.ok) { GB.lastOk = Date.now(); show(false); return; }
    } catch (e) {}
    const m = document.getElementById('offMsg');
    if (m && shown) m.textContent = manual ? 'Still can’t find it. Check the three things above.' : 'Searching… we’ll reconnect on our own';
  }

  // phones pause pages while the screen is off: give the loops a moment after waking before deciding we're offline
  document.addEventListener('visibilitychange', () => { if (!document.hidden) since = Date.now(); });
  window.addEventListener('online', () => { since = Date.now(); check(); });
  setInterval(() => {
    if (document.hidden) return;
    const quiet = Date.now() - Math.max(GB.lastOk || 0, since);
    if (quiet > GRACE) { show(true); check(); } else if (shown) show(false);
  }, 1500);
})();
