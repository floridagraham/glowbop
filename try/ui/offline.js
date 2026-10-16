/* 💤 "Can't reach the laptop" screen.
   When the phone / iPad loses the GlowBop laptop for a few seconds, a friendly full screen slides over the console:
   a sleepy pixel curtain, what to check, and a live "looking for your laptop" line. It disappears by itself the moment
   the laptop answers again (GB.lastOk is refreshed by the status and frame loops in core.js). */
(function () {
  'use strict';
  const GRACE = 5000;                              // how long without an answer before the screen shows
  let shown = false, since = Date.now(), tries = 0, el = null, raf = 0, shownAt = 0;

  GB.css(`
  /* 🖥️ the console stays on screen behind the message, powered down: grey and dim, like before the intro switches it on */
  html.gb-offline #con { -webkit-filter:grayscale(.9) brightness(.5); filter:grayscale(.9) brightness(.5); transition:filter .6s ease, -webkit-filter .6s ease; pointer-events:none; }
  html.gb-waking #con { transition:filter .5s ease, -webkit-filter .5s ease; }
  .gb-wake { animation:gbWake .7s linear both; }
  @keyframes gbWake { 0%{opacity:.3;filter:grayscale(1) brightness(.5)} 10%{opacity:1;filter:brightness(2.4) saturate(1.4)} 20%{opacity:.35;filter:brightness(.7)} 34%{opacity:1;filter:brightness(1.8)} 100%{opacity:1;filter:none} }
  @media (prefers-reduced-motion: reduce) { .gb-wake { animation:none; } }
  #offScr { position:fixed; inset:0; z-index:900; background:radial-gradient(90% 70% at 50% 45%, rgba(26,15,46,.55) 0%, rgba(0,0,0,.35) 75%);
    display:flex; align-items:center; justify-content:center; padding:calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
    opacity:0; pointer-events:none; transition:opacity .45s ease; }
  #offScr.show { opacity:1; pointer-events:auto; }
  #offScr .box { width:100%; max-width:440px; max-height:calc(100vh - 32px); overflow:auto; border-left:14px solid var(--lav); border-radius:0 30px 0 30px; background:var(--panel);
    padding:22px 20px 20px; display:flex; flex-direction:column; gap:14px; box-shadow:0 0 0 1px #2e2845, 0 20px 80px #000c, 0 0 60px #9b3dff44; }
  #offScr .box { transform:translateY(46px) scale(.96); opacity:0; transition:transform .6s cubic-bezier(.2,1.25,.4,1) .2s, opacity .35s ease .2s; }   /* 💬 the message slides up into view */
  #offScr.show .box { transform:none; opacity:1; }
  #offScr .bar { display:flex; gap:6px; height:12px; } #offScr .bar i { border-radius:6px; background:var(--c); }
  #offScr canvas { width:100%; height:auto; aspect-ratio:16/5; border-radius:16px; background:#05040a; border:2px solid #2e2845; }
  #offScr h2 { margin:0; font:800 calc(28px * var(--fs, 1))/1.05 var(--cond); letter-spacing:2px; text-transform:uppercase; }
  #offScr h2 span { color:var(--lav); }
  #offScr p { margin:0; color:var(--dim); line-height:1.45; }
  #offScr ul { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
  #offScr li { display:flex; gap:12px; align-items:center; background:var(--dark2); border-radius:14px; padding:10px 12px; font:600 calc(17px * var(--fs, 1)) var(--cond); letter-spacing:.5px; }
  #offScr li b { font-size:calc(20px * var(--fs, 1)); width:28px; text-align:center; flex:0 0 auto; }
  #offScr li b .ic { width:24px; height:24px; vertical-align:0; display:block; margin:0 auto; filter:drop-shadow(0 0 6px currentColor); }
  #offScr li small { display:block; font:400 calc(13px * var(--fs, 1)) var(--body); color:var(--dim); letter-spacing:0; }
  #offScr .look { font:calc(14px * var(--fs, 1)) var(--mono); color:var(--cyan); letter-spacing:1px; display:flex; align-items:center; gap:10px; }
  #offScr .look i { width:10px; height:10px; border-radius:50%; background:var(--cyan); animation:offPing 1.4s ease-in-out infinite; }
  @keyframes offPing { 0%,100% { opacity:.25; transform:scale(.7); } 50% { opacity:1; transform:scale(1.15); } }
  #offScr .row { display:flex; gap:10px; } #offScr .row .btn { flex:1; }
  `);

  function build() {
    el = document.createElement('div'); el.id = 'offScr'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="box">
      <div class="bar"><i style="--c:var(--lav);width:40px"></i><i style="--c:var(--pink);flex:1"></i><i style="--c:var(--amber);width:26px"></i><i style="--c:var(--cyan);width:56px"></i></div>
      <canvas id="offCv" width="320" height="140" aria-hidden="true"></canvas>
      <h2>We can't <span>connect right now</span> 💤</h2>
      <p>Your lights are taking a breather while we look for your GlowBop laptop. Nothing is lost. The show picks right back up the second we find it.</p>
      <ul>
        <li><b style="color:var(--cyan)">${GB.svg('wifi')}</b><div>Same Wi-Fi as the laptop?<small>Phones love to jump to cellular. Check you're on your home Wi-Fi.</small></div></li>
        <li><b style="color:var(--lav)">${GB.svg('laptop')}</b><div>Laptop awake?<small>If it went to sleep, wake it up. Plugged in is best during a show.</small></div></li>
        <li><b style="color:var(--pink)">${GB.svg('sparkle')}</b><div>GlowBop open on the laptop?<small>Look for the GlowBop icon by the clock. If it's not there, start GlowBop.</small></div></li>
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

  // ⚡ back online: the console's keys flicker back on, a little wave down the screen
  function wake() {
    const H = document.documentElement; H.classList.add('gb-waking'); setTimeout(() => H.classList.remove('gb-waking'), 900);
    const keys = [...document.querySelectorAll('#rail button, #hd .btn, #main .btn, #main .pad, #main .tile, .mfad, #mBtn')]
      .filter(n => { const b = n.getBoundingClientRect(); return b.width && b.bottom > 0 && b.top < innerHeight; }).slice(0, 200);
    keys.forEach(n => { const b = n.getBoundingClientRect(), at = 120 + (b.top / innerHeight) * 700 + Math.random() * 120;
      setTimeout(() => { n.classList.add('gb-wake'); setTimeout(() => n.classList.remove('gb-wake'), 760); }, at); });
  }
  function show(on) {
    if (on === shown) return;
    shown = on; if (!el) build();
    el.classList.toggle('show', on);
    const H = document.documentElement; H.classList.toggle('gb-offline', on);
    if (!on) wake();
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
    const introBusy = document.getElementById('gbIntro') || document.querySelector('.gbi-off, .gbi-offbox, .gbi-grey, canvas.gbi-px');   // 🎬 let the intro and power-on finish first
    if (quiet > GRACE && !introBusy) { show(true); check(); } else if (shown) show(false);
  }, 1500);
})();
