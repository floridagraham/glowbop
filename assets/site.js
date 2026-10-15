// GlowBop site: nav, scroll reveal, logo sparkles, the recorded LED videos and the try-it console.
(() => {
  const nav = document.querySelector('.nav'), bt = document.querySelector('.burger');

  // 🌈 browser-tab icon slowly cycles colours too (browsers without canvas filters keep the still icon)
  (() => {
    const link = document.querySelector('link[rel=icon]'); if (!link || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const img = new Image(), c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if (!('filter' in g)) return;
    img.onload = () => { let deg = 0; setInterval(() => { if (document.hidden) return; deg = (deg + 15) % 360;
      g.clearRect(0, 0, 64, 64); g.filter = `hue-rotate(${deg}deg)`; g.drawImage(img, 0, 0, 64, 64); link.href = c.toDataURL('image/png'); }, 420); };
    img.src = '/icon.png';
  })();
  // ☰ phone menu: the key reads CLOSE while open; tapping a link, outside the menu, or Escape closes it
  const setMenu = on => { nav.classList.toggle('open', on); if (bt) { bt.textContent = on ? 'CLOSE ✕' : 'MENU'; bt.setAttribute('aria-expanded', on); } };
  if (bt) bt.onclick = e => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); };
  if (nav) {
    nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .12}) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

})();

// ✨ GlowBop logo twinkles: random LEDs of the Curtain Burst logo glint white for a moment
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lit = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const d = Math.hypot(c - 3, r - 3); if (d > 0.5 && d < 3.4) lit.push([r, c]); }
  const pos = v => ((158 + v * 118) / 1024 * 100) + '%';
  document.querySelectorAll('img.gb-logo').forEach(img => {
    const w = document.createElement('span'); w.className = 'gb-tw';
    img.parentNode.insertBefore(w, img); w.appendChild(img);
    const tick = () => {
      const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const [r, c] = lit[(Math.random() * lit.length) | 0], s = document.createElement('i');
        s.style.left = pos(c); s.style.top = pos(r); w.appendChild(s); setTimeout(() => s.remove(), 650);
      }
      setTimeout(tick, 250 + Math.random() * 450);
    };
    tick();
  });
})();

// 🎬 Real GlowBop recordings, as plain looping videos (video/*.mp4, rendered by tools/render_videos.py from the
// engine's recordings). Muted + playsinline, so they play like any video on iPhone and iPad, Reduce Motion included
// (they are decorative: no sound, no controls). Each one plays while it is on screen and pauses when it scrolls away.
(() => {
  const vids = [...document.querySelectorAll('video.gbv')];
  // 📱 phones and iPads: the whole first screen is a glowing LED wall behind the headline
  const bg = document.querySelector('.hero-bg video');
  if (bg && matchMedia('(max-width: 900px)').matches) { bg.poster = bg.dataset.poster; bg.src = bg.dataset.src; vids.unshift(bg); }
  const play = v => { if (!v.paused) return; v.muted = true; try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  vids.forEach(v => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    v.addEventListener('playing', () => v.classList.add('on'));
    if (v.readyState >= 3 && !v.paused) v.classList.add('on');
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; v._vis = e.isIntersecting;
      if (v._vis) { if (v.preload === 'none') v.preload = 'auto'; play(v); } else if (!v.paused) v.pause(); }), {rootMargin: '120px 0px'});
    vids.forEach(v => io.observe(v));
  } else vids.forEach(v => { v._vis = true; play(v); });
  // iPhone Low Power Mode blocks autoplay until the first touch: start whatever is on screen then
  const kick = () => vids.forEach(v => { if (v._vis) play(v); });
  ['touchend', 'click'].forEach(ev => addEventListener(ev, kick, {passive: true}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  // showreels: the caption follows the clip on screen
  document.querySelectorAll('video[data-cues][data-label]').forEach(v => {
    let cues = []; try { cues = JSON.parse(v.dataset.cues); } catch (e) {}
    const lab = document.getElementById(v.dataset.label); if (!lab || !cues.length) return; let last = -1;
    v.addEventListener('timeupdate', () => { const t = v.currentTime + 0.2; let k = 0;
      for (let i = 0; i < cues.length; i++) if (t >= cues[i][0]) k = i;
      if (k !== last) { last = k; lab.textContent = cues[k][1]; } });
  });
})();


// ✨ sparkle logo: random LEDs of the SVG Curtain Burst glint white (same as the app).
// Sets the SVG attributes directly (fill + a slightly bigger dot): works the same in Safari on iPhone / iPad.
(() => {
  document.querySelectorAll('.gbsvg').forEach(host => {
    const lit = [...host.querySelectorAll('circle[data-l]')]; if (!lit.length) return;
    const glint = el => { if (el._on) return; el._on = 1; const f = el.getAttribute('fill');
      el.setAttribute('fill', '#ffffff'); el.setAttribute('r', '5.6');
      setTimeout(() => { el.setAttribute('fill', f); el.setAttribute('r', '4.6'); el._on = 0; }, 300); };
    const tick = () => { if (!document.hidden) { const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) glint(lit[(Math.random() * lit.length) | 0]); }
      setTimeout(tick, 250 + Math.random() * 450); };
    tick();
  });
})();

// 🎛️ Try-it console on the home page: a working mini copy of the GlowBop app. The rail switches sections, the keys
// put real recordings from the GlowBop engine on the little wall, just like the real app does on your lights.
(() => {
  const root = document.getElementById('demo'); if (!root) return;
  const T = [
    {id: 'music', label: 'MUSIC', c: 'var(--pink)', title: 'Show control', mode: ['Music show · listening', 'shuffle on · hearing Speakers', 'var(--green)'],
     p: 'GlowBop hears whatever is playing and runs the show: a new effect on every drop, bigger on the loud parts. Tap a key to feature one.', music: true,
     k: [['🌊', 'Big Wave', 'wave-bigwave'], ['🐍', 'Serpent', 'wave-serpent'], ['🎉', 'Neon Party', 'look-neon-party'], ['🌈', 'Rainbow Riot', 'look-rainbow-riot'], ['🚀', 'Hyperspace', 'look-hyperspace'], ['🌀', 'Psychedelic', 'look-psychedelic'],
         ['🏭', 'Warehouse', 'look-warehouse-rave'], ['🔺', 'Laser web', 'fx-laserweb'], ['☀️', 'Solar flare', 'fx-solarflare'], ['🌆', 'Synthwave', 'look-synthwave'], ['🧊', '3D Depth', 'look-3d-depth'], ['🎲', 'Surprise me', '*']]},
    {id: 'dj', label: 'DJ', c: 'var(--red)', title: 'DJ mode', mode: ['DJ mode', 'hand-played, right on the beat', 'var(--red)'], dj: true,
     p: 'Play the lights by hand. Every pad lands on the next beat. Hold the big key to build, let go to drop.',
     k: [['💥', 'Drop', '!drop'], ['⚡', 'Strobe', '!strobe'], ['⚪', 'Flash', '!flash'], ['🔥', 'Fire burst', '!fire'], ['🎉', 'Confetti', '!confetti'], ['⬛', 'Blackout', '!blackout']]},
    {id: 'looks', label: 'LOOKS', c: 'var(--amber)', title: 'Looks', mode: ['Pinned look', 'stays until you release it', 'var(--amber)'],
     p: 'A look is a mood: colors plus effects for calm, medium and loud moments. 32 of them, plus 200+ effects.',
     k: [['🌌', 'Deep Space', 'look-deep-space'], ['🕹️', 'Retro Arcade', 'look-retro-arcade'], ['🔦', 'Club Rig', 'look-club-rig'], ['🧊', '3D Depth', 'look-3d-depth'], ['🌋', 'Wild Elements', 'look-wild-elements'], ['🎪', 'Mainstage', 'look-mainstage']]},
    {id: 'games', label: 'GAMES', c: '#b6ff3d', title: 'Arcade', mode: ['Game on', 'plays itself, speeds up with the music', '#b6ff3d'],
     p: 'Self-playing pixel games. Tap one and it plays on the wall, speeding up with the music.',
     k: [['🧱', 'Breakout', 'fx-breakout'], ['🐍', 'Snake', 'fx-snakegame'], ['🏓', 'Pong', 'fx-pongbattle'], ['👾', 'Alien parade', 'fx-alienparade'], ['☄️', 'Space rocks', 'fx-vectorrocks'], ['🎆', 'Fireworks', 'fx-pixelfireworks']]},
    {id: 'holiday', label: 'HOLIDAY', c: 'var(--cyan)', title: 'Holidays', mode: ['Holiday', 'only holiday effects, cycling with the music', 'var(--cyan)'],
     p: 'Each holiday gets its own button, plus wide-screen mini-movies for the big nights.',
     k: [['🎃', 'Halloween', 'holiday-halloween'], ['🧙', 'Halloween Night', 'movie-halloweennight'], ['🎄', 'Christmas', 'holiday-christmas'], ['🛷', 'Christmas Eve', 'movie-christmaseve'], ['🎆', 'New Year', 'movie-newyearcountdown'], ['🇺🇸', 'July 4th', 'holiday-july4']]},
    {id: 'fire', label: 'FIRE', c: 'var(--orange)', title: 'Fireplace', mode: ['Fireplace 🔥', 'cozy · flames that never loop', 'var(--orange)'],
     p: 'One tap lights a fire across the whole wall. Nine styles, from a cozy fireplace to dragon breath, in nine colors.',
     k: [['🏕️', 'Campfire', 'fire-campfire'], ['🐉', 'Dragon breath', 'fire-dragon'], ['🌈', 'Rainbow fire', 'fire-rainbow-cozy'], ['🕯️', 'Candle wall', 'fire-candles'], ['🌋', 'Lava rising', 'fire-lava'], ['👻', 'Spirit fire', 'fire-spirit']]},
    {id: 'score', label: 'SPORTS', c: 'var(--violet)', title: 'Scoreboard', mode: ['Scoreboard', 'game day · live stats', 'var(--violet)'],
     p: 'Keep score at the field, follow your team live with real game stats, or put golf, NASCAR and F1 leaderboards on the wall.',
     k: [['⚾', 'Baseball live', 'score-baseball'], ['🏈', 'Football live', 'score-football'], ['🏀', 'Basketball', 'score-basketball'], ['🏒', 'Hockey', 'score-hockey'], ['⛳', 'Golf', 'live-golf'], ['🏁', 'NASCAR', 'live-nascar'], ['🏎️', 'F1 board', 'score-f1']]},
    {id: 'live', label: 'LIVE', c: 'var(--green)', title: 'Pick a live feed', mode: ['Live', 'on the wall until you turn it off', 'var(--green)'],
     p: 'Things from the outside world, live on your lights: countdowns, weather, storm watch and what\'s flying overhead.',
     k: [['🎉', 'Countdown', 'live-countdown'], ['🌦️', 'Weather', 'live-weather'], ['🌀', 'Storm watch', 'live-storm'], ['✈️', 'Overhead', 'live-overhead']]},
    {id: '3d', label: '3D', c: 'var(--lav)', title: '3D shapes', mode: ['Wrapped wall', 'cylinder · globe · box', 'var(--lav)'],
     p: 'Bend your curtains around a cylinder, a box or a globe. GlowBop wraps the picture seamlessly and plays effects made for 3D.',
     k: [['🌍', 'Spinning globe', 'shape-spinningglobe'], ['💈', 'Barber spin', 'shape-barberspin'], ['⭕', 'Rising rings', 'shape-risingrings'], ['🌊', 'Ocean swell', 'wave-oceanswell'], ['〰️', 'Twin waves', 'wave-twinwaves']]},
    {id: 'text', label: 'TEXT', c: 'var(--gold)', title: 'Text & logos', mode: ['Text over the show', 'scroll · beat words · on drop', 'var(--gold)'],
     p: 'Put a name, a message or your logo on top of the show. Flash a word on every drop.',
     k: [['🎂', 'Birthday', 'text-birthday'], ['🥁', 'Beat words', 'text-beat'], ['✨', 'Sparkle', 'sparkle']]},
  ];
  const $ = s => root.querySelector(s), meta = n => (window.GB_CLIPS || {})[n];
  // 🔊 the same console chirps as the app (synthesized, no files); only after a tap, with a mute key
  let actx = null, snd = true;
  try { snd = localStorage.getItem('gb_demo_snd') !== '0'; } catch (e) {}
  const SC = {tap: [[0, 1568, .045], [.05, 2093, .04]], nav: [[0, 1319, .05], [.055, 1047, .05], [.11, 1568, .06]]};
  const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  const vary = k => { const base = SC[k][0][1] * [0.75, 0.84, 1, 1, 1.12, 1.26][(Math.random() * 6) | 0], n = SC[k].length + (Math.random() < .3 ? 1 : 0) - (SC[k].length > 2 && Math.random() < .25 ? 1 : 0);
    const gap = .05 * (.8 + Math.random() * .45), d0 = SC[k][0][2] * (.85 + Math.random() * .35), up = Math.random() < .6; let ix = []; for (let i = 0; i < n; i++) ix.push((Math.random() * 6) | 0);
    ix.sort((x, y) => up ? x - y : y - x); return ix.map((s, i) => [i * gap, base * STEPS[s], i === n - 1 ? d0 * 1.3 : d0]); };
  const chirp = k => { if (!snd) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + .005; vary(k).forEach(([dt, f, d]) => { const o = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter(), t = t0 + dt;
      o.type = 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 2600; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .004);
      g.gain.setValueAtTime(.05, t + d - .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(fl); fl.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); }); } catch (e) {} };
  const sb = document.createElement('button'); sb.className = 'd-snd'; const paintS = () => sb.textContent = snd ? '🔊 SOUND' : '🔇 MUTED';
  sb.onclick = () => { snd = !snd; try { localStorage.setItem('gb_demo_snd', snd ? '1' : '0'); } catch (e) {} paintS(); chirp('tap'); }; paintS();
  const stl = root.querySelector('.d-top .st'); if (stl) stl.appendChild(sb);
  const cache = {};
  const load = n => cache[n] || (cache[n] = new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0); res(g.getImageData(0, 0, im.width, im.height)); }; im.onerror = () => res(null); im.src = '/clips/' + n + '.png'; }));
  const cv = $('canvas'), g = cv.getContext('2d');
  let tab = T[0], clip = 'wave-bigwave', t0 = performance.now(), clipT = 0, vis = true, lastF = -1, sec = 0;
  const rail = $('.d-rail');
  T.forEach(t => { const b = document.createElement('button'); b.textContent = t.label; b.style.setProperty('--c', t.c); b.onclick = () => { chirp('nav'); pick(t); }; rail.appendChild(b); });
  const tail = document.createElement('i'); tail.className = 'tail'; rail.appendChild(tail);
  const meter = $('.meter'); for (let i = 0; i < 24; i++) meter.appendChild(document.createElement('i'));
  function pick(t, k) {
    tab = t; root.style.setProperty('--c', t.c);
    rail.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === t.label));
    $('.d-panel .ph span').textContent = t.title; $('.d-panel p').textContent = t.p;
    const keys = $('.keys'); keys.innerHTML = ''; keys.classList.toggle('k3', t.k.length > 8); stopAutoBuild();
    t.k.forEach(([em, name, cl], i) => { const b = document.createElement('button'); b.innerHTML = `<span class="em">${em}</span>${name}`; b.style.setProperty('--kc', t.c);
      b.dataset.a = cl; b.onclick = () => { chirp('tap'); if (cl[0] === '!') { human(); DJ.press(cl.slice(1), b); } else play(b, name, cl); }; keys.appendChild(b); });
    root.querySelectorAll('.dj-extra,.mu-extra').forEach(x => x.remove());
    if (t.music) {
      const box = document.createElement('div'); box.className = 'mu-extra';
      box.innerHTML = `<div class="mu-row"><button class="mu-chip" data-m="shuffle">🔀 SHUFFLE</button><button class="mu-chip" data-m="next">⏭ NEXT EFFECT</button><button class="mu-chip hot" data-m="drop">💥 DROP NOW</button></div>
        <div class="ph" style="--c:var(--peri)"><span>Levels</span><span class="r" id="muLv"></span></div>
        <label class="mu-sl"><span>☀️ Brightness</span><input type="range" min="20" max="100" value="${Math.round(LV.bri * 100)}" data-l="bri"><b></b></label>
        <label class="mu-sl"><span>⏩ Speed</span><input type="range" min="40" max="200" value="${Math.round(LV.speed * 100)}" data-l="speed"><b></b></label>
        <label class="mu-sl"><span>🎚️ Drops</span><input type="range" min="0" max="100" value="${Math.round(LV.drops * 100)}" data-l="drops"><b></b></label>`;
      keys.after(box);
      const paint = () => { box.querySelector('[data-m=shuffle]').classList.toggle('on', LV.shuffle); box.querySelector('[data-m=shuffle]').textContent = LV.shuffle ? '🔀 SHUFFLE ON' : '🔀 SHUFFLE OFF';
        box.querySelectorAll('.mu-sl').forEach(l => { const i = l.querySelector('input'); l.querySelector('b').textContent = i.dataset.l === 'drops' ? ['CHILL', 'NORMAL', 'WILD'][Math.min(2, (i.value / 34) | 0)] : i.value + '%'; });
        $('.mode small').textContent = (LV.shuffle ? 'shuffle on' : 'shuffle off') + ' · hearing Speakers'; };
      box.querySelectorAll('.mu-chip').forEach(x => x.onclick = () => { human(); chirp('tap'); const m = x.dataset.m;
        if (m === 'shuffle') { LV.shuffle = !LV.shuffle; note(LV.shuffle ? 'Shuffle on: a new effect on every drop' : 'Shuffle off: this effect stays'); }
        if (m === 'next') musicNext(false);
        if (m === 'drop') { DJ.press('drop', null); note('Drop on the next beat'); }
        paint(); });
      box.querySelectorAll('input').forEach(i => i.oninput = () => { LV[i.dataset.l] = i.value / 100; paint(); });
      paint();
    }
    if (t.dj) {
      const box = document.createElement('div'); box.className = 'dj-extra';
      box.innerHTML = `<button class="dj-build">HOLD TO BUILD</button><div class="dj-lines">${['HANDS UP', 'JUMP', 'MAKE SOME NOISE', 'ONE MORE'].map(w => `<button>${w}</button>`).join('')}</div>`;
      keys.after(box);
      const bb = box.querySelector('.dj-build');
      // hold to build: works with a finger, a mouse or a pen. The finger is captured, so sliding off or a scroll
      // can't leave the build stuck on; it lets go by itself after 8 seconds anyway.
      const st = e => { e.preventDefault(); human(); try { bb.setPointerCapture(e.pointerId); } catch (x) {} chirp('nav'); DJ.build(true); bb.classList.add('held'); bb.textContent = 'BUILDING… LET GO!'; };
      const en = () => { if (!DJ.st.build) return; DJ.build(false); bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; chirp('tap'); };
      bb.addEventListener('pointerdown', st); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => bb.addEventListener(ev, en));
      bb.addEventListener('contextmenu', e => e.preventDefault()); bb.addEventListener('touchstart', e => e.preventDefault(), {passive: false}); bb.addEventListener('touchend', e => { e.preventDefault(); en(); }, {passive: false});
      box.querySelectorAll('.dj-lines button').forEach(x => x.onclick = () => { human(); chirp('tap'); DJ.say(x.textContent); });
      DJ.reset(); play(null, 'Neon Party', 'look-neon-party'); return;
    }
    DJ.reset();
    play(keys.children[k || 0], t.k[k || 0][1], t.k[k || 0][2]);
    if (t.music) $('.mode small').textContent = (LV.shuffle ? 'shuffle on' : 'shuffle off') + ' · hearing Speakers';
  }
  function play(b, name, cl) {
    if (cl === '*') { const all = Object.keys(window.GB_CLIPS || {}).filter(n => /^(look|fx|wave)-/.test(n)); cl = all[(Math.random() * all.length) | 0]; name = (meta(cl) || {}).title || 'Surprise'; }
    if (b !== null) root.querySelectorAll('.keys button').forEach(x => x.classList.toggle('on', x === b));
    clip = cl; t0 = performance.now(); clipT = 0; lastF = -1; load(cl);
    const m = tab.mode; $('.mode').style.setProperty('--mc', m[2]);
    $('.mode b').textContent = ['live', 'holiday', 'score', 'games', 'fire'].includes(tab.id) ? m[0] + ': ' + name : m[0];
    $('.mode small').textContent = m[1];
    $('#dLook').textContent = name; $('#dEff').textContent = ((meta(cl) || {}).title || name).replace(/ ·.*/, '');
    $('.d-wall .ph .r').textContent = '840 BULBS · ' + name.toUpperCase();
  }
  // 🎚️ the MUSIC page levels, and the self-running music show (a new effect on every drop while shuffle is on)
  const LV = {bri: 1, speed: 1, drops: .5, shuffle: true};
  const MPOOL = ['wave-bigwave', 'look-neon-party', 'look-rainbow-riot', 'look-hyperspace', 'look-psychedelic', 'look-warehouse-rave', 'fx-laserweb', 'fx-solarflare', 'look-synthwave', 'look-3d-depth',
    'wave-serpent', 'look-hypnotic', 'look-chaos', 'look-toxic-rave', 'look-studio-54', 'fx-tesseract', 'fx-soundribbon', 'look-deep-space', 'look-mainstage', 'fx-eqcity'];
  function musicNext(drop) {
    const pool = MPOOL.filter(n => n !== clip && meta(n)); const n = pool[(Math.random() * pool.length) | 0]; if (!n) return;
    const kb = [...root.querySelectorAll('.keys button')].find(x => x.dataset.a === n) || null;
    root.querySelectorAll('.keys button').forEach(x => x.classList.toggle('on', x === kb));
    play(kb === null ? null : kb, (meta(n) || {}).title || 'Next', n); if (kb === null) root.querySelectorAll('.keys button').forEach(x => x.classList.remove('on'));
    if (drop) { DJ.st.flash = .9; DJ.st.rings.push({x: 20, y: 10, r: 0, c: [255, 255, 255]}); }
  }
  // 🎧 the DJ engine of the demo: hits land on the next beat of a 128 BPM clock, drawn on top of the playing clip
  let nextAuto = 0, autoBuild = null;
  const BEAT = 60000 / 128, SPECTACLE = ['look-psychedelic', 'look-3d-depth', 'look-rainbow-riot', 'look-hypnotic', 'fx-pixelfireworks', 'look-warehouse-rave', 'look-chaos', 'fx-tesseract', 'look-hyperspace', 'shape-barberspin'];
  let lastHuman = 0; const human = () => { lastHuman = performance.now(); stopAutoBuild(); };
  function stopAutoBuild() { if (!autoBuild) return; autoBuild = null; DJ.st.build = null; const bb = $('.dj-build'); if (bb) { bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; } }
  const DJ = {
    st: {flash: 0, strobe: 0, black: 0, build: null, parts: [], rings: [], word: null, queue: []},
    reset() { this.st = {flash: 0, strobe: 0, black: 0, build: null, parts: [], rings: [], word: null, queue: []}; },
    press(a, btn) {
      if (a === 'blackout') { this.st.black = performance.now() + BEAT * 4; this.st.queue.push('flash'); this.st.bTo = true; if (btn) { btn.classList.add('armed'); setTimeout(() => btn.classList.remove('armed'), 500); } note('Blackout for one bar… then BANG'); return; }
      this.st.black = 0;
      this.st.queue.push(a); if (btn) { btn.classList.add('armed'); setTimeout(() => btn.classList.remove('armed'), 500); }
      note({drop: 'Drop on the next beat', strobe: 'Strobe on the next beat', flash: 'Flash on the next beat', fire: 'Fire burst on the next beat', confetti: 'Confetti on the next beat'}[a]);
    },
    build(on) { if (on) this.st.build = performance.now(); else { const held = performance.now() - (this.st.build || 0); this.st.build = null; if (held > 350) this.st.queue.push('drop'); } },
    say(w) { this.st.word = {w, t0: performance.now()}; note('Crowd line: ' + w); },
    fire(a, w, h) {
      const S = this.st, P = S.parts, R = Math.random;
      if (a === 'drop') {
        S.flash = 1; S.black = false; S.rings.push({x: w / 2, y: h / 2, r: 0, c: [255, 255, 255]});
        for (let i = 0; i < 70; i++) { const an = R() * 6.283, sp = 8 + R() * 22; P.push({x: w / 2, y: h / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 0, c: [[255, 61, 154], [51, 214, 255], [255, 204, 102], [155, 61, 255]][(R() * 4) | 0]}); }
        if (tab.music) musicNext(false); else play(null, 'The drop', SPECTACLE[(R() * SPECTACLE.length) | 0]); $('#dSec').textContent = 'DROP';
      }
      if (a === 'flash') S.flash = 1;
      if (a === 'strobe') S.strobe = performance.now() + BEAT * 4;
      if (a === 'fire') { for (let i = 0; i < 90; i++) { const an = -Math.PI / 2 + (R() - .5) * 1.6, sp = 10 + R() * 20; P.push({x: w / 2 + (R() - .5) * 6, y: h - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 9, c: [[255, 90, 0], [255, 190, 30], [255, 40, 0], [255, 240, 160]][(R() * 4) | 0]}); }
        S.rings.push({x: w / 2, y: h - 1, r: 0, c: [255, 120, 0]}); }
      if (a === 'confetti') { for (const side of [0, w - 1]) for (let i = 0; i < 40; i++) { const an = -Math.PI / 2 + (side ? -1 : 1) * (.45 + R() * .5), sp = 16 + R() * 12;
        P.push({x: side, y: h - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1.6, g: 14, c: [[255, 61, 154], [51, 214, 255], [255, 204, 102], [60, 224, 138], [204, 153, 255], [255, 255, 255]][(R() * 6) | 0]}); } }
    },
    apply(buf, w, h, now, dt) {
      const S = this.st;
      const beatIdx = Math.floor(now / BEAT);
      if (S.queue.length && beatIdx !== this._lb) { const keep = []; S.queue.forEach(a => { if (a === 'flash' && S.black > now) keep.push(a); else this.fire(a, w, h); }); S.queue = keep; }
      if (S.build && now - S.build > 8000) { this.build(false); const bb = $('.dj-build'); if (bb) { bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; } }
      this._lb = beatIdx;
      const add = (x, y, c, k) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 3; buf[i] = Math.max(buf[i], c[0] * k); buf[i + 1] = Math.max(buf[i + 1], c[1] * k); buf[i + 2] = Math.max(buf[i + 2], c[2] * k); };
      if (S.build) {                                                  // rising wall of light, faster and whiter
        const k = Math.min(1, (now - S.build) / 6000), rate = 2 + 14 * k * k, pulse = .5 + .5 * Math.sin(now / 1000 * rate * 6.283), top = h * (1 - k);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; for (let c = 0; c < 3; c++) buf[i + c] *= 1 - .55 * k;
          if (y >= top) { const hue = (x / w + now / 2500) % 1, col = [.5 + .5 * Math.cos(6.283 * hue), .5 + .5 * Math.cos(6.283 * (hue - .33)), .5 + .5 * Math.cos(6.283 * (hue - .66))];
            const lv = (.3 + .6 * k * pulse) * 255; for (let c = 0; c < 3; c++) buf[i + c] = Math.max(buf[i + c], (col[c] * (1 - k) + k) * lv); }
          if (Math.random() < .01 + .05 * k) { buf[i] = buf[i + 1] = buf[i + 2] = 255; } }
      }
      for (const r of S.rings) { r.r += dt * 26; for (let a = 0; a < 6.283; a += .12) add(r.x + Math.cos(a) * r.r, r.y + Math.sin(a) * r.r * .9, r.c, Math.max(0, 1 - r.r / 30)); }
      S.rings = S.rings.filter(r => r.r < 30);
      for (const q of S.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .97; q.vy = q.vy * .97 + q.g * dt; q.l -= dt * .9; if (q.l > 0) add(q.x, q.y, q.c, Math.min(1, q.l * 1.4)); }
      S.parts = S.parts.filter(q => q.l > 0);
      if (S.word) {                                                   // big scrolling words over a dimmed show
        const el = now - S.word.t0, dur = 2600; if (el > dur) S.word = null;
        else { const m = textMask(S.word.w, h); const x0 = Math.round(w - (el / dur) * (w + m.w)), y0 = Math.max(0, ((h - m.h) / 2) | 0), hue = el / 700;
          for (let i = 0; i < buf.length; i++) buf[i] *= .35;
          const col = [.5 + .5 * Math.cos(6.283 * hue), .5 + .5 * Math.cos(6.283 * (hue - .33)), .5 + .5 * Math.cos(6.283 * (hue - .66))].map(v => 120 + 135 * v);
          for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.a[y * m.w + x]) { const X = x + x0, Y = y + y0; if (X >= 0 && X < w && Y < h) { const i = (Y * w + X) * 3; buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; } } }
      }
      if (S.strobe > now) { const on = Math.floor(now / 55) % 2 === 0; for (let i = 0; i < buf.length; i++) buf[i] = on ? 255 : buf[i] * .05; }
      if (S.flash > .01) { for (let i = 0; i < buf.length; i++) buf[i] = Math.max(buf[i], 255 * S.flash); S.flash *= Math.pow(.02, dt); }
      if (S.black > now) for (let i = 0; i < buf.length; i++) buf[i] = 0;
      return S.build || S.parts.length || S.rings.length || S.word || S.strobe > now || S.flash > .01 || S.black > now || S.queue.length;
    },
  };
  const masks = {};
  function textMask(w, h) {                                          // the words as an LED bitmap, h rows tall
    if (masks[w]) return masks[w];
    const c = document.createElement('canvas'), fs = Math.max(8, Math.round(h * .62)); c.height = fs + 4; c.width = w.length * fs;
    const x = c.getContext('2d'); x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; const tw = Math.ceil(x.measureText(w).width) + 2; c.width = tw;
    x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; x.fillStyle = '#fff'; x.textBaseline = 'top'; x.fillText(w, 1, 1);
    const d = x.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return (masks[w] = {w: c.width, h: c.height, a});
  }
  let toastT = 0; function note(t) { const el = $('.hint'); if (!el || !t) return; el.textContent = '🎧 ' + t; toastT = performance.now(); }
  // 🤖 auto DJ: on the DJ tab, if nobody touches it, GlowBop plays a little set by itself
  function autoDJ(now) {
    if (!tab.dj) return;
    if (now - lastHuman < 7000) { $('.mode small').textContent = tab.mode[1]; return; }
    $('.mode small').textContent = 'AUTO DJ · tap a pad to take over';
    if (autoBuild && now > autoBuild) { DJ.build(false); autoBuild = null; const bb = $('.dj-build'); if (bb) { bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; } nextAuto = now + 2600; return; }
    if (autoBuild || now < nextAuto) return;
    const r = Math.random(), keys = [...root.querySelectorAll('.keys button')];
    if (r < .16) { DJ.build(true); autoBuild = now + 3200; const bb = $('.dj-build'); if (bb) { bb.classList.add('held'); bb.textContent = 'BUILDING… LET GO!'; } note('Auto DJ: building…'); return; }
    if (r < .28) { DJ.say(['HANDS UP', 'JUMP', 'MAKE SOME NOISE', 'ONE MORE'][(Math.random() * 4) | 0]); nextAuto = now + 3000; return; }
    const a = ['drop', 'fire', 'confetti', 'strobe', 'flash', 'fire', 'confetti'][(Math.random() * 7) | 0];
    const b = keys.find(x => x.dataset.a === '!' + a); if (b) { b.classList.add('auto'); setTimeout(() => b.classList.remove('auto'), 350); }
    DJ.press(a, null); nextAuto = now + 1500 + Math.random() * 1600;
  }
  let pxBuf = null, lastNow = performance.now();
  // the glow layer: the same picture at one pixel per bulb, stretched and blurred by the browser under the bulbs
  const gl = document.createElement('canvas'); gl.className = 'glow'; gl.setAttribute('aria-hidden', 'true'); cv.before(gl); const gg = gl.getContext('2d'); let gImg = null;
  const GAM = new Float32Array(256); for (let i = 0; i < 256; i++) GAM[i] = 255 * Math.pow(i / 255, .78);   // LEDs pop: lift the mids
  function draw(data, w, h, fpos, now, dt) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1), W = Math.max(1, r.width * d | 0), H = Math.max(1, r.height * d | 0);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (gl.width !== w || gl.height !== h) { gl.width = w; gl.height = h; gImg = null; } if (!gImg) gImg = gg.createImageData(w, h);
    if (!pxBuf || pxBuf.length !== w * h * 3) pxBuf = new Float32Array(w * h * 3);
    const n0 = data.height / h | 0, f0 = Math.floor(fpos) % n0, f1 = (f0 + 1) % n0, fr = reduce ? 0 : fpos - Math.floor(fpos), px = data.data, b0 = f0 * w * h * 4, b1 = f1 * w * h * 4, kb = LV.bri;
    for (let i = 0, n = w * h; i < n; i++) for (let c = 0; c < 3; c++) pxBuf[i * 3 + c] = (px[b0 + i * 4 + c] * (1 - fr) + px[b1 + i * 4 + c] * fr) * kb;
    const busy = DJ.apply(pxBuf, w, h, now, dt);
    const sx = W / w, sy = H / h, rad = Math.min(sx, sy) * 0.43, gd = gImg.data;
    g.clearRect(0, 0, W, H); let sum = 0;
    g.fillStyle = 'rgba(40,32,58,.55)';                                              // the dark bulbs, all in one path
    g.beginPath(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; if (pxBuf[i] + pxBuf[i + 1] + pxBuf[i + 2] <= 30) { const cx = x * sx + sx / 2, cy = y * sy + sy / 2; g.moveTo(cx + rad * .5, cy); g.arc(cx, cy, rad * .5, 0, 6.283); } } g.fill();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3, j = (y * w + x) * 4;
      const R = GAM[Math.min(255, pxBuf[i]) | 0] | 0, G = GAM[Math.min(255, pxBuf[i + 1]) | 0] | 0, B = GAM[Math.min(255, pxBuf[i + 2]) | 0] | 0, s = R + G + B; sum += s;
      gd[j] = R; gd[j + 1] = G; gd[j + 2] = B; gd[j + 3] = 255;
      if (s <= 30) continue;
      const cx = x * sx + sx / 2, cy = y * sy + sy / 2;
      g.fillStyle = `rgb(${R},${G},${B})`; g.beginPath(); g.arc(cx, cy, rad, 0, 6.283); g.fill();
      if (s > 420) { const m = Math.max(R, G, B) || 1, k = 255 / m, q = .72;            // the hot centre of a bright bulb
        g.fillStyle = `rgba(${R * k * q + 255 * (1 - q) | 0},${G * k * q + 255 * (1 - q) | 0},${B * k * q + 255 * (1 - q) | 0},.8)`; g.beginPath(); g.arc(cx, cy, rad * .55, 0, 6.283); g.fill(); }
    }
    gg.putImageData(gImg, 0, 0);
    return [sum / (w * h * 765), busy];
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => vis = e.isIntersecting)).observe(root);
  let busyLast = false;
  async function tick(now) {
    requestAnimationFrame(tick); const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now; if (!vis) return;
    autoDJ(now);
    if (toastT && now - toastT > 2500) { toastT = 0; const el = $('.hint'); if (el) el.textContent = '👈 Tap the colored rail to switch sections'; }
    const m = meta(clip); const data = await load(clip); if (!m || !data) return;
    clipT += dt * LV.speed; const fpos = reduce ? 0 : clipT * (m.fps || 15) % m.n;
    if (reduce && lastF === 0 && !busyLast) return; lastF = 0;
    const [lvl, busy] = draw(data, m.w, m.h, fpos, now, dt); busyLast = !!busy;
    const lit = Math.round(Math.min(1, lvl * 3.2) * 24);
    meter.querySelectorAll('i').forEach((el, i) => el.style.background = i < lit ? (i < 9 ? 'var(--cyan)' : i < 15 ? 'var(--violet)' : i < 20 ? 'var(--pink)' : 'var(--amber)') : '');
    const s = Math.floor(now / 4000) % 4; if (s !== sec && !(tab.dj && DJ.st.build)) { sec = s; $('#dSec').textContent = ['GROOVE', 'BUILD', 'DROP', 'BREAK'][s];
      if (tab.music && s === 2 && LV.shuffle && now - lastHuman > 6000 && Math.random() < .35 + .65 * LV.drops) musicNext(true);
      if (tab.music && s === 2 && LV.drops > .66) DJ.st.queue.push(Math.random() < .5 ? 'confetti' : 'fire'); }
    if (tab.dj && DJ.st.build) $('#dSec').textContent = 'BUILD';
  }
  pick(T.find(t => t.dj) || T[0]); requestAnimationFrame(tick);
})();
