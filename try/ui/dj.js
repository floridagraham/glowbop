/* 🎧 DJ page: play the lights by hand. Talks to POST /api/dj (dj.py on the laptop).
   Hit pads land on the next beat. Build: hold to wind up, let go to drop. Cue: the next look comes in on the next drop.
   Tap tempo, crowd lines, and a USB / Bluetooth DJ controller (Web MIDI, laptop browser) that can play any pad. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const dj = b => GB.post('/api/dj', GB.withGroup(b));
  const PADS = [['drop', 'burst', 'Drop', 'var(--pink)'], ['strobe', 'bolt', 'Strobe', 'var(--cyan)'], ['flash', 'sun', 'Flash', 'var(--gold)'],
                ['fire', 'fire', 'Fire burst', 'var(--orange)'], ['confetti', 'confetti', 'Confetti', 'var(--lav)'], ['blackout', 'dark', 'Blackout', 'var(--peri)']];
  // crisp skip icons (iOS turns ◀ ▶ into emoji triangles): double chevrons in the coloured circle, a swatch for looks, a sparkle for effects
  const svg = (body, sw) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2.4}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const SK = {
    back: `<span class="sk">${svg('<path d="M12.5 6.5 7 12l5.5 5.5"/><path d="M18 6.5 12.5 12l5.5 5.5"/>', 2.6)}</span>`,
    fwd: `<span class="sk">${svg('<path d="M6 6.5 11.5 12 6 17.5"/><path d="M11.5 6.5 17 12l-5.5 5.5"/>', 2.6)}</span>`,
    look: svg('<rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" stroke="none"/><rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" stroke="none" opacity=".55"/><rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" stroke="none" opacity=".55"/><rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" stroke="none" opacity=".85"/>'),
    fx: svg('<path d="M10 3.5 11.6 8.4 16.5 10 11.6 11.6 10 16.5 8.4 11.6 3.5 10 8.4 8.4Z" fill="currentColor" stroke="none"/><path d="M18 14.5 18.8 16.7 21 17.5 18.8 18.3 18 20.5 17.2 18.3 15 17.5 17.2 16.7Z" fill="currentColor" stroke="none"/><path d="M18.5 3.5v3M17 5h3" stroke-width="1.8"/>'),
  };
  const LINES = ['HANDS UP', 'JUMP', 'MAKE SOME NOISE', "LET'S GO", 'ONE MORE', 'PUT YOUR LIGHTS UP', 'DROP IT', 'SING IT'];
  GB.css(`
  .dj-pads { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .dj-pads .tile { min-height:92px; font-size:calc(16px * var(--fs, 1)); }
  .dj-pads .tile .em { font-size:calc(32px * var(--fs, 1)); }
  /* 🎨 every pad wears its own colour: tinted glass, glowing rim, coloured label; a hit floods it solid */
  .dj-pads .tile { position:relative; overflow:hidden; color:#fff; border:2px solid color-mix(in srgb, var(--c) 75%, transparent); border-radius:0 18px 0 18px;
    background:linear-gradient(160deg, color-mix(in srgb, var(--c) 42%, #14111f) 0%, color-mix(in srgb, var(--c) 14%, #0a0911) 70%);
    box-shadow:inset 0 0 22px color-mix(in srgb, var(--c) 30%, transparent), 0 0 16px -6px var(--c); transition:transform .08s, box-shadow .15s, background .15s; }
  .dj-pads .tile::before { content:''; position:absolute; left:0; right:0; top:0; height:5px; background:var(--c); box-shadow:0 0 12px var(--c); }
  .dj-pads .tile .nm { color:color-mix(in srgb, var(--c) 45%, #fff); text-shadow:0 0 10px color-mix(in srgb, var(--c) 70%, transparent); font-weight:700; }
  .dj-pads .tile .em { filter:drop-shadow(0 0 8px color-mix(in srgb, var(--c) 80%, transparent)); }
  .dj-pads .tile:hover { box-shadow:inset 0 0 26px color-mix(in srgb, var(--c) 40%, transparent), 0 0 22px -4px var(--c); }
  .dj-pads .tile:active, .dj-pads .tile.hit { background:var(--c); color:#000; box-shadow:0 0 30px var(--c); transform:scale(.97); }
  .dj-pads .tile:active .nm, .dj-pads .tile.hit .nm { color:#000; text-shadow:none; }
  #djBuild { min-height:96px; font-size:calc(24px * var(--fs, 1)); letter-spacing:3px; touch-action:none; user-select:none; -webkit-user-select:none; }
  #djBuild.held { background:#fff; color:#000; box-shadow:0 0 40px #fff; }
  #djTap { min-height:86px; font-size:calc(26px * var(--fs, 1)); letter-spacing:4px; touch-action:manipulation; }
  .dj-bpm { font:calc(44px * var(--fs, 1))/1 var(--mono); color:var(--cyan); text-align:center; }
  .dj-midi .item { cursor:pointer; }
  .dj-pads .tile { min-width:0; padding:10px 4px; letter-spacing:.5px; }
  .dj-pads .tile .nm { display:block; max-width:100%; overflow-wrap:anywhere; hyphens:manual; }
  #djPadsPanel { container-type:inline-size; }
  @container (min-width: 640px) { .dj-pads { grid-template-columns:repeat(6, minmax(0, 1fr)); } }
  .dj-skip { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin-top:10px; }
  .dj-skip .btn { min-height:58px; padding:6px 4px; font-size:calc(14px * var(--fs, 1)); letter-spacing:1px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; line-height:1.1; touch-action:manipulation;
    color:color-mix(in srgb, var(--c) 50%, #fff); border:2px solid color-mix(in srgb, var(--c) 70%, transparent); border-radius:22px 22px 22px 22px;
    background:linear-gradient(180deg, color-mix(in srgb, var(--c) 30%, #13101d), color-mix(in srgb, var(--c) 8%, #0a0911)); box-shadow:0 0 14px -6px var(--c); }
  .dj-skip .btn .sk { display:flex; align-items:center; justify-content:center; width:calc(28px * var(--fs, 1)); height:calc(28px * var(--fs, 1)); border-radius:50%; background:var(--c); color:#000; box-shadow:0 0 10px var(--c); flex:none; }
  .dj-skip .btn .sk svg { width:calc(18px * var(--fs, 1)); height:calc(18px * var(--fs, 1)); display:block; }
  .dj-skip .btn .ir { display:flex; align-items:center; gap:5px; }
  .dj-skip .btn .ir > svg { width:calc(16px * var(--fs, 1)); height:calc(16px * var(--fs, 1)); flex:none; display:block; }
  .dj-skip .btn .lb { display:block; max-width:100%; text-align:center; overflow-wrap:normal; word-break:keep-all; hyphens:none; }
  @container (max-width: 420px) { .dj-skip .btn { letter-spacing:0; font-size:calc(11.5px * var(--fs, 1)); padding:6px 2px; } .dj-skip { gap:6px; } }
  .dj-skip .btn.hit { background:var(--c); color:#000; box-shadow:0 0 22px var(--c); }
  .dj-skip .btn.hit .sk { background:#000; color:var(--c); box-shadow:none; }
  .dj-now { display:flex; justify-content:space-between; gap:10px; margin-top:8px; font:calc(13px * var(--fs, 1))/1.3 var(--mono); color:var(--dim); }
  .dj-now span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dj-now b { color:var(--text); font-weight:400; }
  `);

  // ------------------------------------------------------------------ hit pads
  let learn = null;                                             // pad waiting for a controller button
  // ⚡ instant by default: a pad fires the moment your finger touches it. Snap to beat (switch) holds it for the next beat.
  const snap = () => GB.store.get('gb_dj_snap', '0') === '1';
  async function hit(k, src) {
    const st = (GB.status || {}).dj || {};
    const b = document.querySelector(`#djPads [data-k="${k}"]`); if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 220); }
    if (k === 'blackout') { const on = !st.blackout; if (await dj({hit: 'blackout', on})) GB.toast(on ? '⬛ Blackout (tap again to bring it back)' : '💡 Lights back'); }
    else { GB.sfx('on'); if (await dj({hit: k, snap: snap()}) && src !== 'midi' && snap()) GB.toast(PADS.find(p => p[0] === k)[2] + ' on the next beat'); }
  }
  GB.panel('dj', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)'); el.id = 'djPadsPanel';
    el.innerHTML = `<div class="ph"><span>Hit pads</span><button class="btn" id="djSnap" style="--c:var(--cyan);min-height:34px;padding:4px 14px;font-size:calc(13px * var(--fs, 1))"></button></div>
      <div class="tiles dj-pads" id="djPads"></div>
      <div class="dj-skip" id="djSkip">
        <button class="btn" data-st="look-" style="--c:var(--gold)" aria-label="Previous look"><span class="ir">${SK.back}${SK.look}</span><span class="lb">LOOK</span></button>
        <button class="btn" data-st="look+" style="--c:var(--orange)" aria-label="Next look"><span class="ir">${SK.look}${SK.fwd}</span><span class="lb">NEXT LOOK</span></button>
        <button class="btn" data-st="effect-" style="--c:var(--cyan)" aria-label="Previous effect"><span class="ir">${SK.back}${SK.fx}</span><span class="lb">EFFECT</span></button>
        <button class="btn" data-st="effect+" style="--c:var(--lime, #b6ff3b)" aria-label="Next effect"><span class="ir">${SK.fx}${SK.fwd}</span><span class="lb">NEXT EFFECT</span></button>
      </div>
      <div class="dj-now"><span>Look: <b id="djNowLook">-</b></span><span>Effect: <b id="djNowFx">-</b></span></div>
      <p class="note" id="djSnapNote"></p>`;
    el.querySelectorAll('#djSkip .btn').forEach(b => {
      const go = async () => { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 220); GB.sfx('tap'); await GB.control({step: b.dataset.st}); };
      b.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); b._pd = Date.now(); go(); });
      b.onclick = () => { if (Date.now() - (b._pd || 0) < 800) return; go(); };
    });
    GB.on('status', st => { const l = el.querySelector('#djNowLook'), f = el.querySelector('#djNowFx');
      if (l && st) l.textContent = st.look || '-'; if (f && st) f.textContent = st.effect || '-'; });
    const paintSnap = () => { const on = snap(); const s = el.querySelector('#djSnap'); s.classList.toggle('on', on); GB.lbl(s, on ? 'drum' : 'bolt', on ? 'SNAP TO BEAT: ON' : 'INSTANT');
      el.querySelector('#djSnapNote').textContent = on ? 'Snap to beat: every pad waits for the next beat, so it always lands on time. Blackout holds the wall dark until you tap it again.'
        : 'Instant: pads fire the moment you touch them. Turn on Snap to beat to land every hit on the next beat. Blackout holds the wall dark until you tap it again.'; };
    el.querySelector('#djSnap').onclick = () => { GB.store.set('gb_dj_snap', snap() ? '0' : '1'); paintSnap(); GB.sfx('tap'); GB.toast(snap() ? '🥁 Snap to beat on' : '⚡ Instant hits'); };
    paintSnap();
    PADS.forEach(([k, em, name, c]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${GB.svg(em)}</span><span class="nm">${name}</span>`;
      b.style.touchAction = 'manipulation';
      b.addEventListener('pointerdown', e => { if (learn || e.button > 0) return; e.preventDefault(); b._pd = Date.now(); hit(k); });  // fire on touch-down
      b.onclick = () => { if (learn || Date.now() - (b._pd || 0) < 800) return; hit(k); };            // keyboard / fallback
      el.querySelector('#djPads').appendChild(b);
    });
  });

  // ------------------------------------------------------------------ build + tap tempo
  // 🎚️ build styles: how the wall winds up while you hold. The engine draws the same style on the wall (dj.py BUILD_STYLES).
  const BUILDS = [['auto', '🎲', 'Auto'], ['rise', '⬆️', 'Rise'], ['close', '🔲', 'Close in'], ['burst', '💥', 'Burst out'], ['spin', '🌀', 'Spin'],
                  ['rainbow', '🌈', 'Rainbow'], ['zipper', '↔️', 'Zipper'], ['heartbeat', '💓', 'Heartbeat']];
  const BUILD_SECS = 8;                                        // the wind-up peaks after 8 seconds (same as the engine)
  const buildPick = () => { const v = GB.store.get('gb_build_style', 'rise'); return BUILDS.some(x => x[0] === v) ? v : 'rise'; };
  let lastAuto = null;
  function buildStyle() {                                      // Auto picks a different style every time
    const v = buildPick(); if (v !== 'auto') return v;
    const pool = BUILDS.slice(1).map(x => x[0]).filter(x => x !== lastAuto); lastAuto = pool[Math.floor(Math.random() * pool.length)]; return lastAuto;
  }
  GB.css(`
  #djBuild { position:relative; overflow:hidden; isolation:isolate; --p:0; --t:0; --a:0; --arms:1; --h:0; --b:0; }
  #djBuild .bfx { position:absolute; inset:0; z-index:-1; pointer-events:none; opacity:0; transition:opacity .15s; }
  #djBuild.held .bfx { opacity:1; }
  #djBuild .blbl { position:relative; display:block; pointer-events:none; }
  #djBuild.held .blbl { font-size:calc(17px * var(--fs, 1)); letter-spacing:2px; padding:0 calc(46px * var(--fs, 1)); }
  #djBuild .bcnt { position:absolute; right:calc(20px * var(--fs, 1)); top:50%; transform:translateY(-50%); font:700 calc(14px * var(--fs, 1))/1 var(--mono); letter-spacing:0; text-transform:none; pointer-events:none; opacity:0; }
  #djBuild.held .bcnt { opacity:.85; }
  #djBuild .bbar { position:absolute; left:0; bottom:0; height:4px; width:calc(var(--p, 0) * 100%); background:currentColor; opacity:0; pointer-events:none; }
  #djBuild.held .bbar { opacity:.6; }
  #djBuild.held { background:#16111f; color:#fff; box-shadow:0 0 calc(10px + var(--p, 0) * 40px) color-mix(in srgb, var(--c) calc(100% - var(--p, 0) * 100%), #fff); text-shadow:0 0 6px #000, 0 0 2px #000; }
  #djBuild.full { animation:djFull .18s steps(2) infinite; }
  @keyframes djFull { 50% { box-shadow:0 0 60px #fff; } }
  #djBuild[data-s="rise"] .bfx { background:linear-gradient(0deg, color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff) 0 calc(var(--p) * 100%), transparent 0),
    linear-gradient(90deg, #ff3d9a38, #ffcc6638, #3ce08a38, #33d6ff38, #9b3dff38); background-size:100% 100%, 200% 100%; background-position:0 0, calc(var(--t) * 40%) 0; }
  #djBuild[data-s="close"] .bfx { box-shadow:inset 0 0 0 calc(var(--p) * 50px) color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff), inset 0 0 0 calc(var(--p) * 50px + 3px) #fff; }
  #djBuild[data-s="burst"] .bfx { background:radial-gradient(farthest-corner, #fff 0 calc(var(--p) * 18%), color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff) 0 calc(var(--p) * 100% - 4%), #fff calc(var(--p) * 100% - 4%) calc(var(--p) * 100%), transparent calc(var(--p) * 100% + .5%)); }
  #djBuild[data-s="spin"] .bfx { background:repeating-conic-gradient(from calc(var(--a) * 1turn), #fff 0 1.5%, color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff) 1.5% 4%, transparent calc(100% / var(--arms))); }
  #djBuild[data-s="rainbow"] .bfx { background:linear-gradient(110deg, #ff3b3b, #ffcc33, #3ce08a, #33d6ff, #6a5cff, #ff3d9a, #ff3b3b, #ffcc33, #3ce08a, #33d6ff, #6a5cff, #ff3d9a, #ff3b3b);
    background-size:200% 100%; background-position:calc(var(--h) * 100%) 0; filter:saturate(calc(.6 + var(--p))) brightness(calc(.55 + var(--p) * .9)); }
  #djBuild[data-s="zipper"] .bfx { background:linear-gradient(90deg, color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff) 0 calc(var(--p) * 50% - 3px), #fff 0 calc(var(--p) * 50%), transparent 0 calc(100% - var(--p) * 50%), #fff 0 calc(100% - var(--p) * 50% + 3px), color-mix(in srgb, var(--cyan) calc(100% - var(--p) * 100%), #fff) 0); }
  #djBuild[data-s="heartbeat"] .bfx { background:radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--c) calc(100% - var(--p) * 100%), #fff) 0 calc(18% + var(--p) * 30% + var(--b) * 12%), transparent calc(30% + var(--p) * 40% + var(--b) * 20%)); opacity:calc(.45 + var(--b) * .55); }
  .dj-bwrap { container-type:inline-size; margin-top:10px; }
  .dj-bstyles { display:flex; flex-wrap:nowrap; gap:6px; overflow-x:auto; overscroll-behavior-x:contain; scroll-snap-type:x proximity; scrollbar-width:none; padding:2px 2px 4px;
    -webkit-mask:linear-gradient(90deg, #000 calc(100% - 28px), transparent); mask:linear-gradient(90deg, #000 calc(100% - 28px), transparent); }
  .dj-bstyles::-webkit-scrollbar { display:none; }
  .dj-bstyles .chip { flex:none; scroll-snap-align:start; min-height:38px; padding:0 11px; font-size:calc(13px * var(--fs, 1)); gap:4px; white-space:nowrap; }
  .dj-bstyles .chip:last-child { margin-right:24px; }
  @container (min-width: 560px) { .dj-bstyles { flex-wrap:wrap; overflow:visible; -webkit-mask:none; mask:none; } .dj-bstyles .chip:last-child { margin-right:0; } }
  .dj-bstyles .chip .ic { font-size:calc(14px * var(--fs, 1)); }
  `);
  GB.panel('dj', 3, el => {                                    // 🔝 Build & drop sits at the very top of the DJ page
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    el.innerHTML = `<div class="ph"><span>Build &amp; drop</span><span class="r" id="djBuildR">HOLD, THEN LET GO</span></div>
      <button class="btn c wide" id="djBuild" style="--c:var(--pink)"><span class="bfx"></span><span class="blbl">HOLD TO BUILD</span><span class="bcnt"></span><span class="bbar"></span></button>
      <div class="dj-bwrap"><div class="chips dj-bstyles" id="djBuildStyles" role="radiogroup" aria-label="Build style" style="--c:var(--pink)"></div></div>
      <p class="note">Hold it: the wall winds up, brighter and faster, peaking after ${BUILD_SECS} seconds. Let go: it drops. Slide your finger off the key to cancel. Pick how it winds up above.</p>`;
    const b = $('djBuild'), lbl = b.querySelector('.blbl'), cnt = b.querySelector('.bcnt'); let held = false, t0 = 0, raf = 0, cur = 'rise';
    const box = el.querySelector('#djBuildStyles');
    const paint = () => { const v = buildPick(); box.querySelectorAll('.chip').forEach(c => { const on = c.dataset.v === v; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
      if (!held) b.dataset.s = v === 'auto' ? 'rise' : v;
      $('djBuildR').textContent = held ? 'BUILDING: ' + BUILDS.find(x => x[0] === cur)[2].toUpperCase() : BUILDS.find(x => x[0] === v).slice(1).join(' ').toUpperCase(); };
    BUILDS.forEach(([k, ic, name]) => { const c = document.createElement('button'); c.className = 'chip'; c.dataset.v = k; c.setAttribute('role', 'radio');
      c.innerHTML = `<span class="ic">${ic}</span>${name}`;
      c.onclick = () => { GB.store.set('gb_build_style', k); paint(); GB.sfx('tap'); }; box.appendChild(c); });
    const tick = () => {                                       // the button's own wind-up, in the same style as the wall
      if (!held) return;
      const el2 = (performance.now() - t0) / 1000, p = Math.min(1, el2 / BUILD_SECS), T = Math.min(el2, BUILD_SECS);
      const turns = (v0, v1) => v0 * T + (v1 - v0) * T ** 3 / (3 * BUILD_SECS ** 2) + v1 * Math.max(0, el2 - BUILD_SECS);
      b.style.setProperty('--p', p.toFixed(3)); b.style.setProperty('--t', (el2 % 5).toFixed(2));
      b.style.setProperty('--a', (turns(.35, 2) % 1).toFixed(3)); b.style.setProperty('--arms', [1, 2, 3, 4, 6][Math.min(4, Math.floor(p * 5))]);
      b.style.setProperty('--h', (turns(.15, 1.6) % 1).toFixed(3));
      const hb = turns(55 / 60, 170 / 60) % 1; b.style.setProperty('--b', Math.max(Math.exp(-hb * 9), hb >= .3 ? .75 * Math.exp(-(hb - .3) * 9) : 0).toFixed(3));
      cnt.textContent = el2.toFixed(1) + 's';
      b.classList.toggle('full', p >= 1); lbl.textContent = p >= 1 ? 'FULL! LET GO TO DROP' : 'BUILDING… LET GO TO DROP';
      raf = requestAnimationFrame(tick);
    };
    const start = e => { e.preventDefault(); if (held) return; held = true; cur = buildStyle(); b.dataset.s = cur; t0 = performance.now();
      b.classList.add('held'); lbl.textContent = 'BUILDING… LET GO TO DROP'; paint(); tick(); dj({build: true, style: cur}); GB.sfx('nav'); };
    const end = (cancel) => { if (!held) return; held = false; cancelAnimationFrame(raf); b.classList.remove('held', 'full'); b.style.setProperty('--p', 0);
      lbl.textContent = 'HOLD TO BUILD'; cnt.textContent = ''; paint(); dj({build: false, cancel: !!cancel, snap: snap()}); if (!cancel) GB.sfx('ok'); };
    b.addEventListener('pointerdown', start); b.addEventListener('pointerup', () => end(false));
    b.addEventListener('pointerleave', () => end(true)); b.addEventListener('pointercancel', () => end(true));
    b.addEventListener('contextmenu', e => e.preventDefault());
    paint();
  });
  GB.panel('dj', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Tap tempo</span><span class="r" id="djTapR">FOLLOWING THE MUSIC</span></div>
      <div class="dj-bpm" id="djBpm">–</div>
      <button class="btn c wide" id="djTap" style="--c:var(--cyan)">TAP</button>
      <button class="btn wide" id="djAuto">Back to automatic tempo</button>
      <p class="note">Too loud to hear, or a song with no clear kick? Tap the beat 4 times or more and the whole show locks to your taps.</p>`;
    $('djTap').addEventListener('pointerdown', e => { e.preventDefault(); dj({tap: true}); GB.sfx('tap'); });
    $('djAuto').onclick = async () => { if (await dj({tap_off: true})) GB.toast('🎵 Following the music\'s own tempo'); };
  });

  // ------------------------------------------------------------------ cue the next look
  GB.panel('dj', 40, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--amber)');
    el.innerHTML = `<div class="ph"><span>Cue the next look</span><span class="r" id="djCue">NOTHING CUED</span></div>
      <p class="note">Pick the next look. It comes in on the next drop, yours or the music's.</p>
      <div class="chips" id="djLooks" style="--c:var(--amber)"><span class="note">Loading looks…</span></div>`;
  });
  function renderLooks(cat) {
    const box = $('djLooks'); if (!box || !cat || !cat.looks) return; box.innerHTML = '';
    Object.keys(cat.looks).forEach(n => {
      const c = document.createElement('button'); c.className = 'chip'; c.textContent = n; c.dataset.v = n;
      c.onclick = async () => { const cur = ((GB.status || {}).dj || {}).cue; const v = cur === n ? '' : n;
        if (await dj({cue: v})) GB.toast(v ? '🎯 ' + n + ' comes in on the next drop' : 'Cue cleared'); };
      box.appendChild(c);
    });
  }
  GB.on('catalog', renderLooks);

  // ------------------------------------------------------------------ crowd lines
  GB.panel('dj', 50, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>Crowd lines</span><span class="r">BIG WORDS, 3 SECONDS</span></div>
      <div class="chips" id="djLines" style="--c:var(--gold)"></div>
      <label class="field">Your own<div class="fd-loc" style="display:flex;gap:8px"><input type="text" id="djSay" maxlength="40" placeholder="DJ name, a shout-out…" style="flex:1;min-width:0"><button class="btn c" id="djSayGo" style="--c:var(--gold)">Flash it</button></div></label>`;
    const box = el.querySelector('#djLines');
    const mine = (GB.store.get('gb_dj_lines', '') || '').split('|').filter(Boolean);
    [...mine, ...LINES].forEach(w => { const c = document.createElement('button'); c.className = 'chip'; c.textContent = w;
      c.onclick = async () => { if (await dj({say: w})) GB.toast('🔤 ' + w); }; box.appendChild(c); });
    const go = async () => { const w = $('djSay').value.trim(); if (!w) return GB.toast('Type something to flash');
      if (await dj({say: w})) { GB.toast('🔤 ' + w.toUpperCase());
        const keep = [w.toUpperCase(), ...mine.filter(x => x !== w.toUpperCase())].slice(0, 6); GB.store.set('gb_dj_lines', keep.join('|')); } };
    $('djSayGo').onclick = go; $('djSay').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });

  // ------------------------------------------------------------------ DJ controller (Web MIDI: Chrome / Edge on the laptop)
  GB.panel('dj', 60, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    const can = !!navigator.requestMIDIAccess;
    el.innerHTML = `<div class="ph"><span>DJ controller</span><span class="r" id="djMidiR">${can ? 'NOT CONNECTED' : 'LAPTOP ONLY'}</span></div>
      <p class="note">${can ? 'Plug in a USB DJ controller or MIDI pad, tap Connect, then teach each pad: tap a pad name here, then hit the button on your controller.'
        : 'Controllers work in Chrome or Edge on the laptop (open GlowBop there). Phones and iPads can\'t talk to them.'}</p>
      ${can ? `<button class="btn c wide" id="djMidiGo" style="--c:var(--violet)">Connect a controller</button>
      <div class="list dj-midi" id="djMap"></div>` : ''}`;
    if (!can) return;
    const MAP = JSON.parse(GB.store.get('gb_dj_midi', '{}') || '{}');    // "status:note" -> pad
    const ACTS = [...PADS.map(p => [p[0], GB.svg(p[1]) + ' ' + GB.esc(p[2])]), ['build', GB.svg('faders') + ' Build (hold)'], ['tap', GB.svg('drum') + ' Tap tempo']];
    function drawMap() {
      const box = $('djMap'); box.innerHTML = '';
      ACTS.forEach(([k, label]) => {
        const keyFor = Object.keys(MAP).find(x => MAP[x] === k);
        const it = document.createElement('div'); it.className = 'item'; it.innerHTML = `<div class="tx"><b>${label}</b><small>${learn === k ? 'Hit a button on your controller…' : keyFor ? 'Button ' + esc(keyFor.split(':')[1]) : 'Not set: tap to teach'}</small></div>`;
        it.onclick = () => { learn = learn === k ? null : k; drawMap(); };
        box.appendChild(it);
      });
    }
    function onMsg(m) {
      const [st, note, vel] = m.data; const kind = st & 0xf0; if (kind !== 0x90 && kind !== 0x80 && kind !== 0xb0) return;
      const id = (kind === 0xb0 ? 'cc' : 'n') + ':' + note, down = (kind === 0x90 || kind === 0xb0) && vel > 0;
      if (learn && down) { Object.keys(MAP).forEach(x => { if (MAP[x] === learn) delete MAP[x]; }); MAP[id] = learn; GB.store.set('gb_dj_midi', JSON.stringify(MAP)); GB.toast('🎛️ Learned'); learn = null; drawMap(); return; }
      const act = MAP[id]; if (!act) return;
      if (act === 'build') dj(down ? {build: true, style: buildStyle()} : {build: false});
      else if (act === 'tap') { if (down) dj({tap: true}); }
      else if (down) hit(act, 'midi');
    }
    $('djMidiGo').onclick = async () => {
      try {
        const acc = await navigator.requestMIDIAccess();
        const ins = [...acc.inputs.values()]; ins.forEach(i => i.onmidimessage = onMsg);
        acc.onstatechange = () => [...acc.inputs.values()].forEach(i => i.onmidimessage = onMsg);
        $('djMidiR').textContent = ins.length ? ins.map(i => i.name).join(', ').toUpperCase().slice(0, 40) : 'NO CONTROLLER FOUND';
        GB.toast(ins.length ? '🎛️ Controller connected' : 'No controller found. Is it plugged in?');
      } catch (e) { GB.toast('⚠️ The browser blocked the controller'); }
    };
    drawMap();
  });

  // ------------------------------------------------------------------ live state
  GB.on('status', s => {
    const d = s.dj || {};
    const r = $('djNow'); if (r) r.textContent = d.blackout ? 'BLACKOUT' : d.strobing ? 'STROBING' : (d.queued || []).length ? 'FIRING…' : 'ON THE NEXT BEAT';
    document.querySelectorAll('#djPads .tile').forEach(b => b.classList.toggle('on', b.dataset.k === 'blackout' && !!d.blackout));
    const c = $('djCue'); if (c) c.textContent = d.cue ? 'CUED: ' + d.cue.toUpperCase() : 'NOTHING CUED';
    document.querySelectorAll('#djLooks .chip').forEach(b => b.classList.toggle('on', b.dataset.v === d.cue));
    const bpm = $('djBpm'); if (bpm) bpm.textContent = d.tap_bpm ? d.tap_bpm + ' BPM' : (s.bpm ? Math.round(s.bpm) + ' BPM' : '–');
    const tr = $('djTapR'); if (tr) tr.textContent = d.tap_bpm ? 'LOCKED TO YOUR TAPS' : 'FOLLOWING THE MUSIC';
    const au = $('djAuto'); if (au) au.hidden = !d.tap_bpm;
  });
})();
