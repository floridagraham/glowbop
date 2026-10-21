/* GlowBop try-it demo: a pretend GlowBop engine that runs in the browser.
   The real console app (ui/*.js, copied untouched by sync_ui.py) talks to /api/* exactly like on the laptop; this file answers
   every one of those calls from memory and paints a pretend 2-curtain wall (40 x 21 lights) from real LED recordings
   (../clips/*.png: frames stacked vertically, one pixel per light). Loaded before every other script. */
(function () {
  'use strict';
  const ME = document.currentScript ? document.currentScript.src : location.href;
  const here = p => new URL(p, ME).href;
  const realFetch = window.fetch.bind(window);
  const W = 40, H = 21, N = W * H;
  const log = (...a) => console.log('[demo]', ...a);
  const unhandled = window.__demoUnhandled = [];
  const R = Math.random, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pickOne = a => a[(R() * a.length) | 0];
  const now = () => performance.now() / 1000;
  const wall = () => Date.now() / 1000;
  const toast = m => { try { window.GB && GB.toast(m); } catch (e) {} };
  // the demo is a Pro DJ install; /try/?home=1 shows it as Home DJ instead (the rail then has the gold PRO tour key)
  const PRO = !/[?&]home=1\b/.test(location.search);
  // things that need the laptop: answer with an error (the console shows it the usual way), then a friendly note on top
  const LAPTOP = what => { setTimeout(() => toast('💻 In the demo, ' + what + ' needs the GlowBop laptop app'), 60);
    return {status: 200, json: {error: 'In the demo, ' + what + ' needs the GlowBop laptop app'}}; };

  // ======================================================================= data: snapshots + recorded clips
  let CAT = null, ENG = null, FEEDS0 = null, CLIPS = {};
  const getJSON = p => realFetch(here(p), {cache: 'no-cache'}).then(r => r.json());
  const ready = Promise.all([getJSON('catalog.json'), getJSON('engine.json'), getJSON('feeds.json'), getJSON('clips.json')])
    .then(([c, e, f, k]) => { CAT = c; ENG = e; FEEDS0 = f; CLIPS = k; boot(); })
    .catch(e => console.error('[demo] could not load the demo data', e));

  const clipCache = {};
  function loadClip(name) {
    if (!CLIPS[name]) return Promise.resolve(null);
    return clipCache[name] || (clipCache[name] = new Promise(res => {
      const im = new Image();
      im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d');
        g.drawImage(im, 0, 0); const m = CLIPS[name]; res({w: m.w, h: m.h, n: m.n, fps: m.fps || 15, px: g.getImageData(0, 0, im.width, im.height).data}); };
      im.onerror = () => res(null);
      im.src = here('../clips/' + name + '.png');
    }).then(c => { clipCache[name + ':ok'] = c; return c; }));
  }
  const clipNow = name => clipCache[name + ':ok'] || (loadClip(name), null);
  const has = n => !!CLIPS[n];
  const slug = s => String(s || '').toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // which recording shows a look / effect
  const LOOK_SET = {'Big Wave': ['wave-bigwave', 'wave-serpent', 'wave-twinwaves', 'wave-oceanswell'],
                    '3D Object': ['shape-spinningglobe', 'shape-barberspin', 'shape-risingrings'],
                    'VJ Lab': ['fx-chladni', 'fx-timerift', 'fx-pixelmelt', 'fx-lightsweep', 'fx-morphogenesis', 'fx-spatialexpansion', 'fx-outlineracers', 'fx-laminarflow', 'fx-blinds', 'fx-particlefield'],   // 🎛️ Oct 21
                    'Retro Arcade': ['fx-breakout', 'fx-snakegame', 'fx-pongbattle', 'fx-alienparade', 'fx-vectorrocks', 'look-retro-arcade']};
  const FX_ALIAS = {TetrisDrop: 'look-retro-arcade', LightCycles: 'look-neon-grid', GameOfLife: 'look-digital-matrix', Campfire: 'fire-campfire',
    LavaFlow: 'look-lava-lounge', LavaLamp: 'look-lava-lounge', LavaPurple: 'look-molten', LavaRainbow: 'look-psychedelic', Sunrise: 'look-blue-sky',
    WarpSpeed: 'look-hyperspace', BlackHole: 'look-deep-space', Aurora: 'look-fairy-forest', BlobParty: 'look-psychedelic', SoloSprite: 'look-dance-crew',
    MatrixRain: 'look-digital-matrix', LiquidMelt: 'look-liquid-dreams', OceanWaves: 'look-storm-sea', Thunderstorm: 'look-storm-sea',
    PlanetRise: 'look-deep-space', SpiralHypnosis: 'look-hypnotic', Shockwave: 'look-neon-party', FireworkShow: 'fx-pixelfireworks', Fireworks: 'fx-pixelfireworks',
    Waves: 'wave-bigwave', BigWave: 'wave-bigwave', Eyeball: 'look-hypnotic'};
  // the newest looks (calm pack, genres, flow) have no recording yet: a recording close in mood stands in for them
  const LOOK_STAND = {'Cinematic': 'look-deep-space', 'Concert Hall': 'look-royal-gold', 'Jazz Club': 'look-lava-lounge', 'Moonlit': 'look-midnight-galaxy',
    'Rock Arena': 'look-red-alert', 'Velvet Bounce': 'look-studio-54', 'Tropicana': 'look-rainbow-riot', 'Golden Porch': 'look-royal-gold', 'Toy Box': 'look-retro-arcade',
    'Trip': 'look-psychedelic', 'Silk': 'look-liquid-dreams',
    'Chill Lounge': 'look-lava-lounge', 'Deep Calm': 'look-midnight-galaxy', 'Sprite Party': 'look-dance-crew', 'Fractal Dreams': 'look-psychedelic'};
  function lookClip(look, k) { const set = LOOK_SET[look]; if (set) return set[(k || 0) % set.length];
    const c = 'look-' + slug(look); return has(c) ? c : has(LOOK_STAND[look]) ? LOOK_STAND[look] : 'look-neon-party'; }
  const TEXTY = new Set(['ScrollText', 'LuckyText', 'BeatCounter', 'Countdown', 'NewYearCountdown', 'Touchdown']);   // 🔤 effects that write words / numbers: never in the demo's own show
  function effectClip(e) {
    if (!e || TEXTY.has(e)) return null; const l = String(e).toLowerCase();
    for (const p of ['fx-', 'wave-', 'shape-']) if (has(p + l)) return p + l;
    if (FX_ALIAS[e] && has(FX_ALIAS[e])) return FX_ALIAS[e];
    for (const [k, v] of Object.entries((CAT && CAT.looks) || {})) if ([...v.low, ...v.mid, ...v.high].includes(e)) return lookClip(k);
    return null;
  }
  const SPECTACLE = ['look-psychedelic', 'look-3d-depth', 'look-rainbow-riot', 'look-hypnotic', 'fx-pixelfireworks', 'look-warehouse-rave', 'look-chaos', 'fx-tesseract', 'look-hyperspace', 'shape-barberspin'];
  const titleOf = c => ((CLIPS[c] || {}).title || c).replace(/ ·.*/, '').replace(/ \(movie\)/, '');

  // ======================================================================= the engine's state
  const S = {
    power: true, brightness: 100, blend: 1.0, delay: 0, sparkles: 'auto', pace: 'normal', shuffle: true, characters: false, transition: 'random',
    look: 'Neon Party', held: null, pinned: false, locked: null, feature: null, cameo: 0, effect: 'Shockwave', lookK: 0,
    holiday: null, scene: null, mirror: null, flash: {}, off: {},
    act: {},                                   // which takeover was switched on last (fire, score, feed, holiday, scene, lock) wins the wall
  };
  const bump = k => { S.act[k] = wall(); };
  // ✨ (Oct 16) the home page's demo is the flashy part: no calm looks, songs or slow effects there (they stay in the full demo)
  const EMBED_SHOWY = false;   // Oct 18 (Graham): the home page plays the full GlowBop player, every look and song
  const SHOWY = true;
  try { if (localStorage.getItem('gb_build_mode') == null) localStorage.setItem('gb_build_mode', 'all'); } catch (e) {}   // 🎲 demo builds are Full random (the first one is always the star)                                   // (Oct 16) the full demo opens with the same excitement; chill songs keep their calm shows
  const CHILL_TITLES = ['Starlight Freeway', 'Silk Horizon', 'Blue Note Lanterns', 'Porch Light Saturday'];
  const showyNow = () => EMBED_SHOWY || !(typeof M !== 'undefined' && M.queue[M.idx] && CHILL_TITLES.includes(M.queue[M.idx].title));
  const CALM_LOOKS = ['Cinematic', 'Concert Hall', 'Jazz Club', 'Moonlit', 'Silk', 'Golden Porch', 'Deep Space', 'Fairy Forest', 'Liquid Dreams', 'Midnight Galaxy', 'Blue Sky', 'Ice Palace', 'Deep Sea', 'Emerald Ocean'];
  const SHOWY_LOOKS = ['3D Object', '3D Depth', 'Hyperspace', 'Psychedelic', 'Rainbow Riot', 'Hypnotic', 'Warehouse Rave', 'Chaos', 'Neon Party', 'Wild Elements'];   // 🧊 the 3D shapes up front
  const SHOWY_FX = ['Tesseract', 'WireTorus', 'CrystalGem', 'CubeField', 'BarberSpin', 'RisingRings', 'ShapeTunnel', 'LaserFan', 'Kaleidoscope'];
  const showyFx = list0 => { const list = (list0 || []).filter(e => !TEXTY.has(e)).length ? (list0 || []).filter(e => !TEXTY.has(e)) : list0; if (!showyNow() || !CAT || !CAT.effects) return list; const f = (list || []).filter(e => !CAT.effects[e] || CAT.effects[e].energy !== 'low'); return f.length ? f : list; };
  let BPM = 124, beatPos = 0, lastClock = now(), forceSec = null, songLook = 0;
  function clock() { const t = now(); beatPos += (t - lastClock) * pdTempoBpm() / 60; lastClock = t; return beatPos; }   // 🎛️ the Tempo toolbox can lock / scale it
  const SECS = ['groove', 'build', 'drop', 'break'];
  function sectionInfo() {
    clock(); const b = songPos() * BPM / 60, bars = {chill: 16, normal: 8, hype: 4}[S.pace] || 8, k = Math.floor(b / 4 / bars);   // the playing song's own bars
    if (DJ.build != null) return {name: 'build', k};
    if (forceSec && now() < forceSec.until) return {name: forceSec.name, k};
    return {name: SECS[k % 4], k};
  }
  const PARTS = {groove: 'verse', build: 'build-up', drop: 'chorus', break: 'bridge'};

  // auto show: a new effect every section, a new look on every drop (when nothing is held)
  let lastSecK = -1, lastSecName = '';
  function followShow() {
    const si = sectionInfo();
    if (si.k !== lastSecK || si.name !== lastSecName) {
      if (si.name === 'drop' && lastSecName !== 'drop' && DJ.cue) { setLook(DJ.cue, false); DJ.cue = null; }
      else if (si.name === 'drop' && lastSecName && lastSecName !== 'drop' && S.shuffle && !S.held) autoLook();
      lastSecK = si.k; lastSecName = si.name; S.lookK++;
      const lk = CAT && CAT.looks[S.look]; if (lk) S.effect = pickOne(showyFx(showyNow() ? (si.name === 'build' ? lk.mid : lk.high.concat(si.name === 'drop' ? [] : lk.mid)) : si.name === 'drop' ? lk.high : si.name === 'break' ? lk.low : lk.mid));
      if (si.name === 'drop' && TX.s.drop_flash) TX.dropUntil = now() + 2.2;
    }
    return si;
  }
  function autoLook() { const ls = showyNow() ? SHOWY_LOOKS.filter(n => n !== S.look && CAT.looks[n]) : Object.keys(CAT.looks).filter(n => n !== S.look && n !== 'Retro Arcade'); S.look = pickOne(ls); }
  function setLook(n, pin) { S.look = n; S.held = n; S.pinned = !!pin; S.lookK = 0; }

  // ======================================================================= text masks + a tiny pixel font
  const masks = {};
  function textMask(w, h) {                                   // a word as an LED bitmap about h rows tall (same as the site demo)
    const key = w + '|' + h; if (masks[key]) return masks[key];
    const c = document.createElement('canvas'), fs = Math.max(8, Math.round(h * .62)); c.height = fs + 4; c.width = Math.max(8, w.length * fs);
    const x = c.getContext('2d'); x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; const tw = Math.ceil(x.measureText(w).width) + 2; c.width = Math.max(1, tw);
    x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; x.fillStyle = '#fff'; x.textBaseline = 'top'; x.fillText(w, 1, 1);
    const d = x.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return (masks[key] = {w: c.width, h: c.height, a});
  }
  const F3 = {'0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111',
    '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', ':': '000010000010000', '-': '000000111000000', ' ': '000000000000000',
    '.': '000000000000010', A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101',
    N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111'};
  const tinyW = (s, k) => s.length ? s.length * 4 * k - k : 0;
  function tiny(buf, s, x0, y0, col, k) {                       // 3x5 pixel font, scaled k times
    k = k || 1; s = String(s).toUpperCase();
    [...s].forEach((ch, i) => { const g = F3[ch] || F3[' '];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1')
        for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) put(buf, x0 + i * 4 * k + c * k + b, y0 + r * k + a, col); });
  }
  function put(buf, x, y, c, k) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3;
    if (k == null) { buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; }
    else { buf[i] = Math.max(buf[i], c[0] * k); buf[i + 1] = Math.max(buf[i + 1], c[1] * k); buf[i + 2] = Math.max(buf[i + 2], c[2] * k); } }
  const hexRGB = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [255, 255, 255]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hue = (h, s, v) => { h = ((h % 1) + 1) % 1; const f = k => { const q = (k + h * 6) % 6; return v - v * s * Math.max(0, Math.min(q, 4 - q, 1)); }; return [f(5) * 255, f(3) * 255, f(1) * 255]; };
  const glow = c => { const l = (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; if (l >= 0.3) return c; const k = 0.55 - l; return c.map(v => v + (255 - v) * k); };
  function stamp(buf, m, x0, y0, colAt, dim) {                   // draw a text mask, colAt(x, y) gives the colour
    if (dim != null) for (let i = 0; i < buf.length; i++) buf[i] *= dim;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.a[y * m.w + x]) { const X = x + x0, Y = y + y0; if (X >= 0 && X < W && Y >= 0 && Y < H) put(buf, X, Y, colAt(X, Y)); }
  }

  // ======================================================================= 🎧 DJ mode (same engine as the website's demo console)
  const DJ = {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: [], cue: null, taps: [], tap_bpm: null, _lb: null, pfx: [], nfx: [], dstyle: 'random', lastDrop: '', coolLatch: false, coolUntil: 0, coolK: 0, colorOn: false, colorCols: [], colorK: 0, colorPos: 0};
  function djReset() { Object.assign(DJ, {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: [], cue: null, taps: [], tap_bpm: null, pfx: [], nfx: [], coolLatch: false, coolUntil: 0, colorOn: false}); }
  // 🎛️ the six one-shot pads (padfx.py): sweep, shockwave, color bomb, lightning, 3-2-1, heartbeat. Short overlays in the look's colours.
  const PAD_FX = ['sweep', 'shockwave', 'colorbomb', 'lightning', 'countdown', 'heartbeat', 'star'];
  const PAD_SECS = {sweep: .9, shockwave: 1.1, colorbomb: 1.2, lightning: .8, countdown: 2.4, heartbeat: 1.8, star: 1.3};
  function boltPath() {                                             // a jagged bolt from the top down, with one fork
    const pts = []; let x = 8 + R() * (W - 16), fork = null;
    for (let y = 0; y < H; y++) { x = clamp(x + (R() - .5) * 3.2, 1, W - 2); pts.push([x, y]); if (y === 6 + (R() * 5 | 0)) fork = {x, y}; }
    const f = []; if (fork) { let fx = fork.x, dir = R() < .5 ? -1 : 1; for (let y = fork.y; y < Math.min(H, fork.y + 9); y++) { fx += dir * (.6 + R() * .9); f.push([fx, y]); } }
    return pts.concat(f);
  }
  function padStart(k) {
    if (k === 'heartbeat' || k === 'star' || k.startsWith('drop_')) return nStart(k);   // the newer pads draw with the ported padfx code
    const cols = lookCols(S.look).map(c => { const m = Math.max(...c); return m > 10 ? c.map(v => v * 255 / m) : [255, 255, 255]; });
    DJ.pfx.push({k, t0: now(), cols, dir: R() < .5 ? 1 : -1, bolt: k === 'lightning' ? boltPath() : null, c: pickOne(cols)});
    if (DJ.pfx.length > 6) DJ.pfx.shift();
  }
  function padDraw(buf, t) {
    DJ.pfx = DJ.pfx.filter(p => t - p.t0 < PAD_SECS[p.k]);
    DJ.pfx.forEach(p => {
      const el = t - p.t0, u = el / PAD_SECS[p.k], c = p.c;
      if (p.k === 'sweep') {                                        // a bright bar wipes across the wall
        const x0 = p.dir > 0 ? -4 + u * (W + 8) : W + 4 - u * (W + 8);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.abs(x - x0); if (d < 4) { const cc = d < 1 ? [255, 255, 255] : palAt(p.cols, y / H + u * .5), k = 1 - d / 4, i = (y * W + x) * 3;
          for (let ch = 0; ch < 3; ch++) buf[i + ch] = buf[i + ch] * (1 - k) + cc[ch] * k; } }
      } else if (p.k === 'shockwave') {                             // a ring blasts out from the middle
        const r = u * 26, w = 2.2;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.abs(Math.hypot(x - (W - 1) / 2, (y - (H - 1) / 2) * 1.15) - r); if (d < w) put(buf, x, y, c, (1 - d / w) * (1 - u * .6)); }
      } else if (p.k === 'colorbomb') {                             // a flood of colour from the centre, then it fades
        const r = Math.min(1, u * 3) * 28, f = u < .35 ? 1 : 1 - (u - .35) / .65;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - (W - 1) / 2, (y - (H - 1) / 2) * 1.15); if (d < r) { const i = (y * W + x) * 3, cc = palAt(p.cols, d / 28 + el * .3);
          for (let ch = 0; ch < 3; ch++) buf[i + ch] = buf[i + ch] * (1 - f) + cc[ch] * f; } }
      } else if (p.k === 'lightning') {                             // a white bolt that flickers twice, with a dim flash behind it
        const on = u < .12 || (u > .25 && u < .4) || (u > .5 && u < .58);
        if (on) { for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * .35 + 40; p.bolt.forEach(([x, y]) => { put(buf, x, y, [255, 255, 255]); put(buf, x + 1, y, [170, 190, 255], .6); put(buf, x - 1, y, [170, 190, 255], .6); }); }
      } else if (p.k === 'countdown') {                             // 3, 2, 1 in big digits, one per beat-ish, then a burst
        const n = 3 - Math.floor(u * 3.6);
        for (let i = 0; i < buf.length; i++) buf[i] *= .25;
        if (n >= 1) { const k = 3, tx = String(n), pop = 1 - ((u * 3.6) % 1) * .5; tiny(buf, tx, Math.round((W - tinyW(tx, k)) / 2), Math.round((H - 5 * k) / 2), c.map(v => v * pop), k); }
        else for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - (W - 1) / 2, y - (H - 1) / 2); if (d < (u - .83) * 160) put(buf, x, y, [255, 255, 255], .8); }
      } else if (p.k === 'heartbeat') {                             // a heart that thumps twice (lub-dub) and glows
        const f = (u * 2) % 1, env = Math.max(Math.exp(-f * 9), f >= .3 ? .75 * Math.exp(-(f - .3) * 9) : 0), hs = 6.5 + 2.2 * env;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = (x - (W - 1) / 2) / hs, Y = -(y - (H - 1) / 2) / hs + .15, v = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3;
          if (v < 0) put(buf, x, y, [255, 40 + 60 * env, 90 + 40 * env], .55 + .45 * env); }
      }
    });
  }
  // ======================================================================= 💥 drop styles + ⭐ star / 💓 heartbeat pads (ported from padfx.py, Oct 16)
  const DROP_FAM = {bursts: ['supernova', 'starburst', 'heartpop', 'shatter', 'colorbomb', 'rainbowwave', 'bassslam'],   // ⚡ not a drop any more (Oct 17)
    sweeps: ['curtain', 'laserrip', 'waterfall', 'zippertear'], slams: ['whiteout', 'colorflip', 'strobestutter', 'basspunch'],       // 💥 Oct 21: drops wave 2
    shapes: ['vortex', 'tunnelpunch', 'checkerflip', 'tiledrop'], glitch: ['glitchtear', 'pixelrain', 'liquidpour', 'staticsnap']};
  const DROP_FX = [].concat(...Object.values(DROP_FAM));
  const famOf = k => Object.keys(DROP_FAM).find(f => DROP_FAM[f].includes(k));
  const dropRandom = last => { const lf = famOf(last), fs = Object.keys(DROP_FAM).filter(f => f !== lf), f = pickOne(fs), ks = DROP_FAM[f].filter(k => k !== last); return pickOne(ks.length ? ks : DROP_FAM[f]); };
  const mul32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const NG = (() => { const cx = (W - 1) / 2, cy = (H - 1) / 2, n = W * H, g = {cx, cy, dx: new Float32Array(n), dy: new Float32Array(n), d: new Float32Array(n), ang: new Float32Array(n),
      xx: new Float32Array(n), yy: new Float32Array(n), R: Math.hypot(cx, cy) + 1.5, sq: Math.min(cx, cy) + .5, s: Math.max(1, Math.min(W, H) / 20)};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = y * W + x, dx = x - cx, dy = y - cy; g.dx[j] = dx; g.dy[j] = dy; g.d[j] = Math.hypot(dx, dy); g.ang[j] = Math.atan2(dy, dx); g.xx[j] = x; g.yy[j] = y; }
    return g; })();
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hsv1 = h => { h = (((h % 1) + 1) % 1) * 6; return [clamp(Math.abs(h - 3) - 1, 0, 1), clamp(2 - Math.abs(h - 2), 0, 1), clamp(2 - Math.abs(h - 4), 0, 1)]; };
  const RED = [1, .02, .1], PINK = [1, .2, .55];
  function palc(P, u, offs) { const n = P.cols.length, x = (((u % 1) + 1) % 1) * n, i = Math.floor(x) % n, f = x - Math.floor(x), a = P.cols[i], b = P.cols[(i + 1) % n], h = hsv1(u + offs);
    return [0, 1, 2].map(c => (a[c] * (1 - f) + b[c] * f) * .75 + .25 * h[c]); }
  function starM(j, size, rot, inner = .42, soft = .09) { const f = .5 + .5 * Math.cos(5 * (NG.ang[j] - rot * 6.2832)), rs = size * (inner + (1 - inner) * f ** 2.2);
    return clamp((rs - NG.d[j]) / Math.max(.6, size * soft) + .5, 0, 1); }
  function heartM(j, size, rot = 0, sharp = 5) { const c = Math.cos(rot * 6.2832), s_ = Math.sin(rot * 6.2832), X0 = NG.dx[j] / size, Y0 = -NG.dy[j] / size;
    const X = X0 * c - Y0 * s_, Y = X0 * s_ + Y0 * c + .15, v = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3; return [clamp(.5 - v * sharp, 0, 1), Y]; }
  const twk = (P, el, m, j, rate = .08) => { const ph = (P.spark[j] + el * 3) % 1; return ph < rate ? m * (1 - ph / rate) : 0; };
  function nStart(k) {
    const cols = lookCols(S.look).map(c => { const m = Math.max(...c); return m > 10 ? c.map(v => v / m) : [1, 1, 1]; });
    let per = 60 / (DJ.tap_bpm || BPM || 120); while (per > .6) per /= 2; while (per < .3) per *= 2;
    const P = {k, t0: now(), cols: cols.length ? cols : [[1, .2, .6], [.2, .8, 1]], per, spark: Float32Array.from({length: W * H}, R)};
    P.ci = (R() * P.cols.length) | 0;
    if (k === 'heartbeat') { P.dub = clamp(.5 * per, .2, .3); P.dur = P.dub + 1; P.tilt = R() < .5 ? -1 : 1; }
    else if (k === 'star') { P.dur = 1.3; P.spin = (R() < .5 ? -1 : 1) * (.5 + R() * .3); P.rot0 = R(); }
    else if (k === 'drop_supernova') { P.dark = .12; P.dur = 1.5; P.parts = Array.from({length: Math.round(40 + W * H / 8)}, () => [R() * 6.2832, .6 + R() * .8, R()]); }
    else if (k === 'drop_starburst') { P.dur = 1.3; P.spin = (R() < .5 ? -1 : 1) * .9; P.rot0 = R(); }
    else if (k === 'drop_heartpop') { P.dur = 2.4; P.pop = .46;   // 💖 v2 (Oct 17, padfx.py): dark, a heart slams in, beats, POPS into heart rings + a cloud of hearts
      P.hcols = [[1, .05, .45], [.85, 0, .08], [1, .45, .75], [.85, .1, 1], [1, .05, .45], [1, 1, 1]].concat(P.cols);
      P.hp = Array.from({length: Math.round(18 + W * H / 14)}, () => ({th: R() * 6.2832, sp: .45 + R() * .8, up: .2 + R() * .7, sz: .9 + R() * .8, rot: R() * 1.2 - .6, spin: R() * 8 - 4,
        life: 1.1 + R() * .8, ci: (R() * P.hcols.length) | 0, tw: R()})); }
    else if (k === 'drop_shatter') { P.dur = 1.4; const n = Math.round(8 + W * H / 30), seeds = Array.from({length: n}, () => [R() * W, R() * H]);
      P.cell = new Int16Array(W * H); P.edge = new Float32Array(W * H);
      for (let j = 0; j < W * H; j++) { let b1 = 1e9, b2 = 1e9, bi = 0; seeds.forEach(([sx, sy], i) => { const d = (NG.xx[j] - sx) ** 2 + (NG.yy[j] - sy) ** 2; if (d < b1) { b2 = b1; b1 = d; bi = i; } else if (d < b2) b2 = d; });
        P.cell[j] = bi; P.edge[j] = clamp(1.5 - (Math.sqrt(b2) - Math.sqrt(b1)), 0, 1); }
      P.fall = seeds.map(() => .6 + R()); P.delay = seeds.map(() => .05 + R() * .3); P.cc = seeds.map(() => (R() * P.cols.length) | 0); }
    else if (k === 'drop_colorbomb') { P.dur = 1.5; P.col = P.cols[P.ci]; P.drip = Float32Array.from({length: W}, () => .6 + R() * .9); }
    else if (k === 'drop_rainbowwave') { P.dur = 1.2; P.cx = pickOne([0, .5, 1]); }
    else if (k === 'drop_bassslam') { P.dur = .9; P.sx = R() < .5 ? -1 : 1; }
    // 💥 Oct 21: drops wave 2 (ported from dropfx2.py): sweeps, slams, shapes, glitch
    else if (k === 'drop_curtain') { P.dur = 1.3; P.shut = clamp(per * .5, .16, .26); }
    else if (k === 'drop_laserrip') { P.dur = 1.1; P.down = R() < .5; P.tilt = R() * .7 - .35; }
    else if (k === 'drop_waterfall') { P.dur = 1.5; P.spd = Float32Array.from({length: W}, () => .8 + R() * .55); P.off = Float32Array.from({length: W}, () => R() * .18); }
    else if (k === 'drop_zippertear') P.dur = 1.35;
    else if (k === 'drop_whiteout') { P.dur = 1.1; P.col = P.cols[P.ci]; }
    else if (k === 'drop_colorflip') { P.step = clamp(per / 2, .14, .26); P.dur = P.step * 5 + .5; }
    else if (k === 'drop_strobestutter') { P.dur = 1.25; P.col = P.cols[P.ci]; }
    else if (k === 'drop_basspunch') { P.beat = clamp(per, .32, .55); P.dur = P.beat * 3 + .25; }
    else if (k === 'drop_vortex') { P.dur = 1.4; P.dir = R() < .5 ? -1 : 1; P.arms = pickOne([3, 4, 5]); }
    else if (k === 'drop_tunnelpunch') P.dur = 1.3;
    else if (k === 'drop_checkerflip') { P.step = clamp(per / 2, .14, .26); P.dur = P.step * 5 + .45; P.ts = Math.max(2, Math.round(Math.min(H, W) / 5)); }
    else if (k === 'drop_tiledrop') { P.dur = 1.45; P.ts = Math.max(2, Math.round(Math.min(H, W) / 4)); P.ny = Math.ceil(H / P.ts); P.nx = Math.ceil(W / P.ts);
      const n = P.ny * P.nx, ord = Array.from({length: n}, (_, i) => i).sort(() => R() - .5); P.delay = new Float32Array(n); ord.forEach((t, i) => { P.delay[t] = i / n * .45; });
      P.tc = Array.from({length: n}, () => (R() * P.cols.length) | 0); }
    else if (k === 'drop_glitchtear') { P.dur = 1.0; P.seed = (R() * 1e6) | 0; }
    else if (k === 'drop_pixelrain') { P.dur = 1.5; P.spd = Float32Array.from({length: W}, () => 1.2 + R() * 1.2); P.off = Float32Array.from({length: W}, R); }
    else if (k === 'drop_liquidpour') { P.dur = 1.5; P.side = R() < .5 ? -1 : 1; }
    else if (k === 'drop_staticsnap') { P.dur = 1.15; P.seed = (R() * 1e6) | 0; }
    else P.dur = 1;
    DJ.nfx.push(P); if (DJ.nfx.length > 5) DJ.nfx.shift();
  }
  function nDraw(buf, t) {
    DJ.nfx = DJ.nfx.filter(P => t - P.t0 < P.dur);
    if (!DJ.nfx.length) return;
    let img = new Float32Array(buf.length); for (let i = 0; i < buf.length; i++) img[i] = buf[i] / 255;
    for (const P of DJ.nfx) img = nOne(img, P, t - P.t0);
    for (let i = 0; i < buf.length; i++) buf[i] = clamp(img[i], 0, 1) * 255;
  }
  function nOne(img, P, el) {
    const out = new Float32Array(img.length), u = el / P.dur, N = W * H, g = NG;
    const set = (j, f) => { const i = j * 3, r = f(img[i], img[i + 1], img[i + 2]); out[i] = r[0]; out[i + 1] = r[1]; out[i + 2] = r[2]; };
    switch (P.k) {
      case 'heartbeat': { const dub = P.dub, env = Math.min(1, Math.exp(-el * 8) + (el >= dub ? .85 * Math.exp(-(el - dub) * 8) : 0)), fade = 1 - ss(dub + .45, P.dur, el);
        const s = (.48 + .14 * env) * g.sq, rot = P.tilt * .05 * Math.sin(el * 6), lvl = (.55 + .6 * env) * fade, dim = 1 - (.65 + .3 * env) * fade;
        for (let j = 0; j < N; j++) { const [m, Y] = heartM(j, s, rot), X = g.dx[j] / s, sh = clamp(.5 + .45 * Y, 0, 1), pc = palc(P, el * .7 + Y * .3, .9);
          const hl = Math.exp(-(((X + .45) / .3) ** 2 + ((Y - .55) / .25) ** 2)) * .35, gl = Math.exp(-g.d[j] / (g.sq * (.45 + .45 * env))) * env * .4 * (1 - m), tw = twk(P, el, m, j) * fade * 1.1;
          set(j, (r, gg, b) => [r, gg, b].map((v, c) => { const col = (RED[c] * (1 - sh) + PINK[c] * sh) * .8 + .2 * pc[c]; return v * dim * (1 - .6 * m * fade) + m * (col + hl) * lvl + gl * RED[c] * fade + tw; })); }
        return out; }
      case 'star': { const grow = ss(0, .18, el) * (1 + .15 * Math.sin(el * 14) * Math.exp(-el * 3)), size = g.sq * (.55 + .45 * grow) * (1 + .25 * u), rot = P.rot0 + P.spin * el, fade = 1 - ss(.65, 1, u);
        for (let j = 0; j < N; j++) { const m = starM(j, size, rot), col = palc(P, P.ci / P.cols.length + el * .9 + g.d[j] / g.R * .6, el);
          const tw = twk(P, el, clamp(m + .35 * Math.exp(-g.d[j] / (size * 1.4)), 0, 1), j), rays = (.5 + .5 * Math.cos(5 * (g.ang[j] - rot * 6.2832))) ** 8 * Math.exp(-g.d[j] / (size * 2.2)) * .5;
          set(j, (r, gg, b) => [r, gg, b].map((v, c) => v * (1 - .7 * fade * m) * (1 - .35 * fade) + fade * (m * col[c] * 1.05 + rays * col[c] + tw * 1.2))); }
        return out; }
      case 'drop_supernova': { if (el < P.dark) { for (let i = 0; i < out.length; i++) out[i] = img[i] * .05; return out; }
        const e = el - P.dark, v = e / (P.dur - P.dark), Rr = g.R * 1.25, front = Rr * ss(0, .8, v) ** .7, keep = ss(0, .6, v);
        for (let j = 0; j < N; j++) { const core = Math.exp(-((g.d[j] / (1 + g.sq * .5 * ss(0, .25, e))) ** 2)) * (1 - ss(.1, .7, v)), ring = Math.exp(-(((g.d[j] - front) / (1.2 + 2 * v)) ** 2)) * (1 - v), col = palc(P, g.d[j] / g.R * .8 - e * .6, e);
          set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * keep + core * (.6 + .4 * col[c]) * 1.4 + ring * col[c] * 1.3)); }
        for (const [th, sp, ph] of P.parts) { if (ph >= .8 - v * .5) continue; const rr = front * sp * 1.1, x = Math.round(g.cx + Math.cos(th) * rr), y = Math.round(g.cy + Math.sin(th) * rr);
          if (x >= 0 && x < W && y >= 0 && y < H) { const i = (y * W + x) * 3; for (let c = 0; c < 3; c++) out[i + c] = Math.max(out[i + c], 1 - .5 * v); } }
        return out; }
      case 'drop_starburst': { const size = g.sq * (.3 + 1.9 * ss(0, .7, u)), rot = P.rot0 + P.spin * el, fade = 1 - ss(.55, 1, u);
        for (let j = 0; j < N; j++) { const m = starM(j, size, rot, .42, .12), edge = clamp(m * (1 - starM(j, size * .78, rot)), 0, 1), col = palc(P, el * 1.2 + g.d[j] / g.R, el), tw = twk(P, el, m, j, .1);
          set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * (1 - .5 * fade) + fade * ((m * .45 + edge * 1.1) * col[c] + tw))); }
        return out; }
      case 'drop_heartpop': {
        const HOT = [1, .05, .45], DEEP = [.85, 0, .08], pop = P.pop;
        const hAt = (x, y, cx, cy, size, rot, sharp) => { const c = Math.cos(rot), s_ = Math.sin(rot), X0 = (x - cx) / size, Y0 = -(y - cy) / size, X = X0 * c - Y0 * s_, Y = X0 * s_ + Y0 * c + .15,
          v = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3; return [clamp(.5 - v * sharp, 0, 1), Y]; };
        if (el < .1) { const sz = g.sq * .18 * (1 + .4 * Math.sin(el * 90));
          for (let j = 0; j < N; j++) { const [m] = hAt(g.xx[j], g.yy[j], g.cx, g.cy, sz, 0, 4); set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * .08 + m * HOT[c] * 1.2)); } return out; }
        if (el < pop) { const k = (el - .1) / (pop - .1), grow = 1 - Math.exp(-7 * k) * Math.cos(11 * k), beat = 1 + .08 * Math.exp(-(((k - .8) / .08) ** 2));
          const size = Math.max(.6, g.sq * .82 * grow * beat), slam = 1 + .5 * Math.exp(-(((el - .17) / .04) ** 2)), rot = .05 * Math.sin(el * 25), gx = g.cx - size * .42, gy = g.cy - size * .42;
          for (let j = 0; j < N; j++) { const [m, Y] = hAt(g.xx[j], g.yy[j], g.cx, g.cy + .05 * g.sq, size, rot, 4), yy = clamp(.5 + .5 * Y, 0, 1);
            const gloss = Math.exp(-(((g.xx[j] - gx) / (size * .28)) ** 2 + ((g.yy[j] - gy) / (size * .2)) ** 2)) * m, rim = clamp(m * 4, 0, 1) * (1 - clamp(m * 4 - 2.6, 0, 1));
            set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * .12 * (1 - m) + m * (DEEP[c] * (1 - yy) + HOT[c] * yy) * 1.05 * slam + gloss * .45 + rim * [1, .6, .85][c] * .5)); }
          return out; }
        const e = el - pop, u2 = e / (P.dur - pop), flash = Math.exp(-e / .035), back = .12 + .88 * ss(.25, .85, u2), tint = (1 - ss(0, .7, u2)) * .45;
        const acc = new Float32Array(img.length);
        for (let j = 0; j < N; j++) for (let c = 0; c < 3; c++) acc[j * 3 + c] = img[j * 3 + c] * back + [1, .45, .75][c] * flash + [.45, 0, .18][c] * tint;
        [[0, [1, .55, .8]], [.11, HOT], [.22, [.8, .1, 1]]].forEach(([dl, col]) => { const t = e - dl; if (t <= 0 || t > .9) return; const size = g.sq * (.4 + 3.2 * t ** .8), fade = (1 - t / .9) ** 1.3;
          for (let j = 0; j < N; j++) { const ring = clamp(hAt(g.xx[j], g.yy[j], g.cx, g.cy, size, 0, 3)[0] - hAt(g.xx[j], g.yy[j], g.cx, g.cy, size * .72, 0, 3)[0], 0, 1) * fade;
            if (ring > 0) for (let c = 0; c < 3; c++) acc[j * 3 + c] = acc[j * 3 + c] * (1 - .5 * ring) + ring * col[c] * 1.15; } });
        const lay = new Float32Array(img.length);
        P.hp.forEach((h, i) => { const lf = e / h.life; if (lf >= 1) return; const dist = h.sp * g.R * 1.5 * (1 - Math.exp(-3.2 * e)) / 3.2 * 2.2;
          const x = g.cx + Math.cos(h.th) * dist, y = g.cy + Math.sin(h.th) * dist - h.up * 5 * g.s * e + 7 * g.s * e * e; if (!(x > -2 && x < W + 1 && y > -2 && y < H + 1)) return;
          const sz = h.sz * g.s * (1 + .15 * Math.sin(e * 14 + i)), rr = Math.ceil(sz * 1.6) + 2, col = P.hcols[h.ci % P.hcols.length], tw = .75 + .5 * (Math.sin(e * 22 + h.tw * 6.28) > .6 ? 1 : 0), k = (1 - lf * lf) * tw;
          for (let yy = Math.max(0, Math.floor(y) - rr); yy < Math.min(H, Math.floor(y) + rr + 2); yy++) for (let xx = Math.max(0, Math.floor(x) - rr); xx < Math.min(W, Math.floor(x) + rr + 2); xx++) {
            const m = hAt(xx, yy, x, y, sz, h.rot + h.spin * e, 2.5)[0]; if (!m) continue; const jj = (yy * W + xx) * 3; for (let c = 0; c < 3; c++) lay[jj + c] = Math.max(lay[jj + c], m * col[c] * k); } });
        const glK = 1 - ss(.05, .6, u2);
        for (let j = 0; j < N; j++) { const lm = Math.min(1, Math.max(lay[j * 3], lay[j * 3 + 1], lay[j * 3 + 2])), ph = (P.spark[j] + e * 2.6) % 1, gl = ph < .045 ? (1 - ph / .045) * glK * .8 : 0;
          for (let c = 0; c < 3; c++) out[j * 3 + c] = acc[j * 3 + c] * (1 - .6 * lm) + lay[j * 3 + c] * 1.15 + gl * [1, .8, .95][c]; }
        return out; }
      case 'drop_shatter': { if (el < .08) { for (let i = 0; i < out.length; i++) out[i] = Math.max(img[i], .9); return out; }
        const keep = ss(.2, 1, u), fadeP = 1 - ss(.35, 1, u), crackK = 1 - ss(.08, .5, u);
        for (let j = 0; j < N; j++) { const cell = P.cell[j], tt = Math.max(0, el - P.delay[cell]), dy = P.fall[cell] * 14 * tt * tt * g.s, src = g.yy[j] - dy;
          let pc = [0, 0, 0]; if (src >= 0) { const sc = P.cell[clamp(Math.round(src), 0, H - 1) * W + g.xx[j]]; if (sc === cell) pc = P.cols[P.cc[sc]].map(v => v * fadeP); }
          const cr = P.edge[j] * crackK; set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * keep + pc[c] * .9 + cr * 1.2)); }
        return out; }
      case 'drop_colorbomb': { const white = Math.max(0, 1 - el / .1) * .8, col = P.col.map(v => v * (1 - white) + white);
        for (let j = 0; j < N; j++) { let a = 1; if (el >= .25) { const top = (el - .25) * P.drip[g.xx[j]] * H * 1.4; a = clamp(g.yy[j] - top + 1, 0, 1) * (1 - ss(.6, 1, u)); }
          const tw = twk(P, el, a, j, .05) * .8; set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * (1 - a) + a * col[c] * 1.05 + tw)); }
        return out; }
      case 'drop_rainbowwave': { const ox = P.cx * (W - 1), Rr = Math.hypot(W, H) * 1.1, front = Rr * ss(0, .85, u);
        for (let j = 0; j < N; j++) { const d = Math.hypot(g.xx[j] - ox, g.dy[j]), band = Math.exp(-(((d - front) / (2 * g.s + 3 * u)) ** 2)), trail = clamp((front - d) / (Rr * .5), 0, 1) * (1 - u) * .35, col = hsv1(d / Rr * 1.5 - el * .8);
          set(j, (r, gg, b) => [r, gg, b].map((x, c) => x * (1 - .3 * (1 - u)) + (band * 1.3 + trail) * col[c])); }
        return out; }
      // 💥 Oct 21: drops wave 2 (dropfx2.py)
      case 'drop_curtain': { const k = ss(0, P.shut, el), o = ss(P.shut + .18, P.dur * .9, el), half = .5 * k * (1 - o) + .002, edge = 1.2 / Math.max(4, W);
        const seamT = el >= P.shut * .9 ? Math.exp(-Math.max(0, el - P.shut) / .12) : 0;
        for (let j = 0; j < N; j++) { const x = g.xx[j] / Math.max(1, W - 1), cov = clamp(clamp((half - x) / edge + .5, 0, 1) + clamp((x - (1 - half)) / edge + .5, 0, 1), 0, 1);
          const col = palc(P, g.yy[j] / H * .8 + Math.abs(x - .5) * .6 - el * .4, el), seam = Math.exp(-(((x - .5) * W / 1.6) ** 2)) * seamT;
          const lips = o > 0 ? (Math.exp(-(((x - half) * W) ** 2)) + Math.exp(-(((x - 1 + half) * W) ** 2))) * (1 - u) : 0, i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - cov) * (.4 + .6 * o) + cov * col[c] * 1.1 + seam * 1.4 + lips * .8; }
        return out; }
      case 'drop_laserrip': { const pos = ss(0, .42, el) * (H + 6) - 3, fade = 1 - ss(.55, 1, u), s = g.s;
        for (let j = 0; j < N; j++) { const y = (P.down ? g.yy[j] : H - 1 - g.yy[j]) + P.tilt * g.dx[j], d = y - pos, line = Math.exp(-((d / (.7 * s)) ** 2)), bh = clamp(-d / (2 * s) + .5, 0, 1);
          const col = palc(P, g.xx[j] / W + el * .7, el), sp = twk(P, el, Math.exp(-Math.abs(d) / (2.5 * s)) * fade, j, .12), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (.12 + .88 * bh) * (1 + .6 * fade * bh) + bh * col[c] * .35 * fade + line * (.6 + .6 * col[c]) * (1.5 * fade + .2) + sp; }
        return out; }
      case 'drop_waterfall': { const fade = 1 - ss(.6, 1, u);
        for (let j = 0; j < N; j++) { const x = g.xx[j], y = g.yy[j], t = Math.max(0, el - P.off[x]), head = t * P.spd[x] * H * 2.2, body = clamp((head - y) / 1.5, 0, 1);
          const foam = Math.exp(-(((y - head) / 1.1) ** 2)), hit = clamp((head - H) / (H * .6), 0, 1), splash = hit > 0 ? Math.exp(-(H - 1 - y) / Math.max(1, H * .18)) * Math.exp(-hit * 3) : 0;
          const col = palc(P, x / W * .9 - y / H * .3 + el * .3, el), a = body * fade, i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .75 * a) + a * col[c] * 1.05 + (foam * .9 + splash) * fade; }
        return out; }
      case 'drop_zippertear': { const zy = ss(.05, .55, el) * (H + 4) - 2, grow = 1 + 3 * ss(.5, 1.05, el), fade = 1 - ss(.75, 1, u);
        for (let j = 0; j < N; j++) { const y = g.yy[j], ax = Math.abs(g.dx[j]), ow = Math.max(0, (zy - y) * .55) * grow, rev = clamp((ow - ax) / .8 + .5, 0, 1);
          const teeth = (Math.abs(ax - ow) < .9 && (y | 0) % 2 === 0 && ow > .3) ? fade : 0, head = Math.exp(-(((y - zy) / 1) ** 2) - (g.dx[j] / 1.2) ** 2) * fade * 1.5;
          const col = palc(P, y / H + el * .5, el), dark = (1 - rev) * fade, i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .92 * dark) * (1 + .5 * rev * fade) + teeth * col[c] * 1.2 + head; }
        return out; }
      case 'drop_whiteout': { const w = 1 - ss(.1, .4, el), flood = ss(.1, .35, el) * (1 - ss(.45, 1, u)), show = ss(.35, 1, u);
        for (let j = 0; j < N; j++) { const vg = 1 - .25 * g.d[j] / g.R, i = j * 3; for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * show + w + flood * vg * P.col[c] * 1.1; }
        return out; }
      case 'drop_colorflip': { const k = Math.floor(el / P.step); if (k >= 5) return img;
        const c0 = P.cols[(P.ci + k) % P.cols.length], f = (el - k * P.step) / P.step, hit = Math.exp(-f * 5) * .35;
        for (let j = 0; j < N; j++) { const gr = .8 + .2 * (1 - g.yy[j] / H), i = j * 3; for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * .15 + gr * c0[c] + hit; }
        return out; }
      case 'drop_strobestutter': { const land = .62;
        if (el < land) { const on = (el * (7 + 22 * el)) % 1 < .45; for (let i = 0; i < out.length; i++) out[i] = (on ? .95 : 0) + img[i] * .05; return out; }
        const e = el - land, fl = 1 - ss(0, 1, e / (P.dur - land)), bang = Math.exp(-e / .06) * .8;
        for (let j = 0; j < N; j++) { const i = j * 3; for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .7 * fl) + fl * P.col[c] * 1.15 + bang; }
        return out; }
      case 'drop_basspunch': { const b = P.beat, k = Math.min(2, Math.floor(el / b)); let e = el - k * b; if (el > b * 3) e = el - 2 * b;
        const z = 1 + (.45 - .1 * k) * Math.exp(-e / .11), fl = Math.exp(-e / .12) * (.95 - .2 * k), tail = 1 - ss(b * 3, P.dur, el), boost = 1 + .6 * Math.exp(-e / .15), rr = g.R * Math.min(1, e / .35), rf = Math.exp(-e / .3);
        for (let j = 0; j < N; j++) { const sx = clamp(Math.round(g.cx + g.dx[j] / z), 0, W - 1), sy = clamp(Math.round(g.cy + g.dy[j] / z), 0, H - 1), si = (sy * W + sx) * 3, i = j * 3;
          const col = palc(P, k * .33 + g.d[j] / g.R * .4, el), ring = Math.exp(-(((g.d[j] - rr) / (1.5 * g.s)) ** 2)) * rf;
          for (let c = 0; c < 3; c++) { const v = img[si + c] * boost + fl * col[c] + ring * col[c]; out[i + c] = img[i + c] * (1 - tail) + v * tail; } }
        return out; }
      case 'drop_vortex': { const pull = ss(0, .3, el) * (1 - ss(.65, 1, u)), s = g.s;
        for (let j = 0; j < N; j++) { const sp = Math.sin(P.arms * g.ang[j] + P.dir * (g.d[j] / (2.2 * s)) - P.dir * el * (10 + 12 * u)), arm = clamp((sp - .25) / .5, 0, 1) * pull;
          const core = Math.exp(-((g.d[j] / (1.2 + 2.5 * s * (1 - u))) ** 2)) * pull, col = palc(P, g.d[j] / g.R * 1.2 - el * .9 + g.ang[j] / 6.2832, el), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .7 * pull) + arm * col[c] * 1.15 + core * 1.2; }
        return out; }
      case 'drop_tunnelpunch': { const fade = 1 - ss(.6, 1, u), pw = .05 + .6 * ss(0, .25, el), pe = Math.exp(-el / .25);
        for (let j = 0; j < N; j++) { const ch = Math.max(Math.abs(g.dx[j]) / (g.cx + .5), Math.abs(g.dy[j]) / (g.cy + .5)), depth = Math.log1p(ch * 6) * 2.2, ph = (((depth - el * 5.5) % 1) + 1) % 1;
          const ring = Math.exp(-(((ph - .5) / .12) ** 2)) * fade, punch = Math.exp(-((ch / pw) ** 2)) * pe * 1.3, col = palc(P, depth * .35 - el * .8, el), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .6 * fade) + ring * col[c] * 1.2 + punch; }
        return out; }
      case 'drop_checkerflip': { const k = Math.floor(el / P.step), f = (el - k * P.step) / P.step, ts = P.ts, fl = 1 - ss(P.step * 5, P.dur, el);
        const A = P.cols[P.ci % P.cols.length], B0 = P.cols[(P.ci + 1) % P.cols.length], B = P.cols.length < 2 ? A.map(v => 1 - v * .6) : B0, sq = Math.abs(Math.cos(Math.PI * Math.min(1, f * 2.2)));
        for (let j = 0; j < N; j++) { const x = g.xx[j], y = g.yy[j], side = ((Math.floor(x / ts) + Math.floor(y / ts)) + k) % 2, lx = (x % ts) / Math.max(1, ts - 1) - .5, vis = Math.abs(lx) <= sq * .5 + .18 ? 1 : 0;
          const cc = side ? B : A, i = j * 3; for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .85 * fl) + fl * cc[c] * vis * 1.05; }
        return out; }
      case 'drop_tiledrop': { const ts = P.ts, gone = ss(.75, 1, u);
        for (let j = 0; j < N; j++) { const x = g.xx[j], y = g.yy[j], ti = Math.floor(y / ts) * P.nx + Math.floor(x / ts), dl = P.delay[ti], f = clamp((el - dl) / .14, 0, 1);
          const shown = (f > 0 && (y % ts) >= ts * (1 - f) - .01) ? 1 - gone : 0, land = f >= 1 ? Math.exp(-Math.max(0, el - dl - .14) / .08) * .6 * (1 - gone) : 0;
          const gl = (x % ts === 0 || y % ts === 0) ? .65 : 1, cc = P.cols[P.tc[ti] % P.cols.length], i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .85 * shown) + shown * cc[c] * gl * 1.05 + land; }
        return out; }
      case 'drop_glitchtear': { const amt = (1 - ss(.45, .9, u)) * (.6 + .4 * Math.sin(el * 37) ** 2), rnd = mul32(P.seed + Math.floor(el * 24)), fl = Math.exp(-el / .07) * .7;
        const shift = new Int16Array(H), bright = new Uint8Array(H);
        if (amt > .05) for (let y = 0; y < H;) { const h = 1 + ((rnd() * 4) | 0), s = rnd() < .7 ? Math.round((rnd() * 2 - 1) * W / 3 * amt) : 0, b = rnd() < .25 * amt ? 1 : 0; for (let k = 0; k < h && y < H; k++, y++) { shift[y] = s; bright[y] = b; } }
        const sh = amt > .05 ? Math.max(1, Math.round(2 * g.s * amt)) : 0, bc = P.cols[(rnd() * P.cols.length) | 0];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, xr = ((x - shift[y] - sh) % W + W) % W, xg = ((x - shift[y]) % W + W) % W, xb = ((x - shift[y] + sh) % W + W) % W, row = y * W * 3;
          let r = img[row + xr * 3], gg = img[row + xg * 3 + 1], b = img[row + xb * 3 + 2]; if (bright[y]) { r = r * 1.8 + .15; gg = gg * 1.8 + .15; b = b * 1.8 + .15; }
          if (amt > .05 && rnd() < .1 * amt) { r = bc[0]; gg = bc[1]; b = bc[2]; }
          const m = 1 + .4 * amt; out[i] = r * m + fl; out[i + 1] = gg * m + fl; out[i + 2] = b * m + fl; }
        return out; }
      case 'drop_pixelrain': { const lvl = H * (1 - ss(.1, .75, u)), gone = ss(.78, 1, u), dark = (1 - gone) * ss(0, .1, el);
        for (let j = 0; j < N; j++) { const x = g.xx[j], y = g.yy[j], pile = y >= lvl, yy = (((y / H + P.off[x] - el * P.spd[x] * 1.6) % .45) + .45) % .45, drop = !pile && yy < 1.2 / Math.max(4, H);
          const a = ((pile ? .95 : 0) + (drop ? 1.2 : 0)) * (1 - gone), col = palc(P, x / W * 1.3 + y / H * .4, el), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .9 * dark) + a * col[c]; }
        return out; }
      case 'drop_liquidpour': { const s = g.s, lvl = H * ss(.62, 1, u);
        for (let j = 0; j < N; j++) { const y = g.yy[j], x = P.side > 0 ? g.xx[j] : W - 1 - g.xx[j], front = ss(0, .45, el) * (W * 1.3) + Math.sin(y * .55 / s + el * 9) * 1.6 * s;
          const fill = clamp((front - x) / 1.2, 0, 1), drain = clamp((y - lvl + Math.sin(g.xx[j] * .5 / s + el * 7) * s) / 1.2, 0, 1), a = fill * drain;
          const surf = u < .62 ? Math.exp(-(((x - front) / 1) ** 2)) : Math.exp(-(((y - lvl) / 1) ** 2)), col = palc(P, y / H * .7 + x / W * .3 + el * .3, el), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * (1 - .8 * a) + a * col[c] * 1.05 + surf * .7 * (.5 + .5 * col[c]); }
        return out; }
      case 'drop_staticsnap': { const cut = .38;
        if (el < cut) { const rnd = mul32(P.seed + Math.floor(el * 40)), rollY = (el * 3 % 1) * H, tc = P.cols[P.ci];
          for (let j = 0; j < N; j++) { const n = rnd() ** 1.6 + Math.exp(-(((g.yy[j] - rollY) / Math.max(1, H * .12)) ** 2)) * .35, tint = rnd() < .05, i = j * 3;
            out[i] = img[i] * .1 + n * .85 + (tint ? tc[0] : 0); out[i + 1] = img[i + 1] * .1 + n * .9 + (tint ? tc[1] : 0); out[i + 2] = img[i + 2] * .1 + n + (tint ? tc[2] : 0); }
          return out; }
        const e = el - cut, h = (H / 2 + 1) * ss(0, .22, e), lf = (1 - ss(.15, .5, e)) * 1.3, boost = 1 + .5 * (1 - ss(.2, 1, e / (P.dur - cut)));
        for (let j = 0; j < N; j++) { const ay = Math.abs(g.dy[j]), inside = clamp((h - ay) / .8 + .5, 0, 1), line = Math.exp(-(((ay - h) / .7) ** 2)) * lf, i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[i + c] * inside * boost + line; }
        return out; }
      case 'drop_bassslam': { if (el < .07) { for (let i = 0; i < out.length; i++) out[i] = 1; return out; }
        const k = Math.exp(-(el - .07) / .18), sh = Math.round(P.sx * k * 2 * g.s * Math.cos(el * 45)), vs = Math.round(k * 1.5 * g.s * Math.abs(Math.sin(el * 38)));
        for (let j = 0; j < N; j++) { const x = g.xx[j], y = g.yy[j], sx = ((x - sh) % W + W) % W, sy = ((y - vs) % H + H) % H, si = (sy * W + sx) * 3;
          const floor = clamp(1 - (H - 1 - y) / (H * .45 * (1 - k * .5)), 0, 1) * k, col = palc(P, el * .5 + x / W, el), i = j * 3;
          for (let c = 0; c < 3; c++) out[i + c] = img[si + c] * (.6 + .4 * (1 - k)) + floor * col[c] * 1.2; }
        return out; }
    }
    return img;
  }
  function djFire(a, beats, cue) {
    const P = DJ.parts;
    if (a === 'drop') {
      let st = DJ.dstyle || 'random'; if (st === 'random' || !(st === 'classic' || DROP_FX.includes(st))) st = dropRandom(DJ.lastDrop);   // 💥 Oct 21: even over the 5 families
      const FIRST_DROPS = ['supernova', 'curtain', 'tunnelpunch'];   // 💥 the demo's first three drops show the range (Oct 21: a burst, a sweep, a shape), then random
      DJ.dropN = (DJ.dropN || 0) + 1; if (DJ.dropN <= FIRST_DROPS.length && !(DJ.dstyle && DJ.dstyle !== 'random')) st = FIRST_DROPS[DJ.dropN - 1];   // (only when nobody picked a style) DJ.lastDrop = st;
      DJ.black = false; fltOnDrop();
      if (st !== 'classic') { if (st === 'lightning') { padStart('lightning'); DJ.flash = .6; } else nStart('drop_' + st); }
      else { DJ.flash = 1; DJ.rings.push({x: W / 2, y: H / 2, r: 0, c: [255, 255, 255]}); }
      if (st === 'classic') for (let i = 0; i < 70; i++) { const an = R() * 6.283, sp = 8 + R() * 22; P.push({x: W / 2, y: H / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 0, c: pickOne([[255, 61, 154], [51, 214, 255], [255, 204, 102], [155, 61, 255]])}); }
      forceSec = {name: 'drop', until: now() + 8};
      if (DJ.cue) { setLook(DJ.cue, false); DJ.cue = null; S.feature = {clip: lookClip(S.look), name: S.look, until: 0}; }
      else if (!cue) { const c = pickOne(SPECTACLE); S.feature = {clip: c, name: titleOf(c), until: now() + 24}; }
    }
    if (a === 'flash') DJ.flash = 1;
    if (PAD_FX.includes(a)) padStart(a);
    if (a === 'strobe') DJ.strobe = Math.max(DJ.strobe, now() + (beats || 4) * 60 / (DJ.tap_bpm || BPM));
    if (a === 'fire') { for (let i = 0; i < 90; i++) { const an = -Math.PI / 2 + (R() - .5) * 1.6, sp = 10 + R() * 20; P.push({x: W / 2 + (R() - .5) * 6, y: H - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 9, c: pickOne([[255, 90, 0], [255, 190, 30], [255, 40, 0], [255, 240, 160]])}); }
      DJ.rings.push({x: W / 2, y: H - 1, r: 0, c: [255, 120, 0]}); }
    if (a === 'confetti') { for (const side of [0, W - 1]) for (let i = 0; i < 40; i++) { const an = -Math.PI / 2 + (side ? -1 : 1) * (.45 + R() * .5), sp = 16 + R() * 12;
      P.push({x: side, y: H - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1.6, g: 14, c: pickOne([[255, 61, 154], [51, 214, 255], [255, 204, 102], [60, 224, 138], [204, 153, 255], [255, 255, 255]])}); } }
  }
  // 🎚️ build styles (same as dj.py build_frame): each ramps over 8 s, uses the look's colours, tops out white-hot
  const BUILD_STYLES = ['rise', 'close', 'burst', 'spin', 'rainbow', 'zipper', 'heartbeat', 'star']; let BSECS = 8;   // ⏱️ Oct 21: Pro DJ picks 2 to 32 bars (sent as secs)
  const BG = (() => { const cx = (W - 1) / 2, cy = (H - 1) / 2, g = {ex: [], ring: [], rad: [], ang: [], dx: [], dy: []};
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy, ex = Math.min(x, W - 1 - x) / cx, ey = Math.min(y, H - 1 - y) / cy;
      g.ex.push(ex); g.ring.push(Math.min(ex, ey)); g.rad.push(Math.hypot(dx / cx, dy / cy) / Math.SQRT2); g.ang.push(((Math.atan2(dy, dx) / 6.283) % 1 + 1) % 1); g.dx.push(dx); g.dy.push(dy); }
    return g; })();
  const bTurns = (el, v0, v1) => { const e = Math.min(el, BSECS); return v0 * e + (v1 - v0) * e ** 3 / (3 * BSECS * BSECS) + v1 * Math.max(0, el - BSECS); };
  const bSoft = (v, w) => clamp(v / w + .5, 0, 1);
  function djBuild(buf, t, el, style) {
    const k = Math.min(1, el / BSECS), cols = lookCols(S.look), pal = u => palAt(cols, u);
    let rate = 2 + 14 * k * k, pulse = .5 + .5 * Math.sin(t * rate * 6.283), wk = Math.pow(k, 1.6), dim = .6 * k;
    const ac = k > .5 && pulse > .85;
    if (style === 'rise' || !BUILD_STYLES.includes(style)) {
      const top = H * (1 - k);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, c0 = pal(x / W + t * .4); for (let c = 0; c < 3; c++) buf[i + c] *= 1 - .55 * k;
        const band = clamp(y - top + 1, 0, 1), lv = (.25 + .6 * k * pulse) * band;
        for (let c = 0; c < 3; c++) buf[i + c] += lv * (c0[c] * (1 - k) + 255 * k);
        if (R() < .01 + .05 * k) buf[i] = buf[i + 1] = buf[i + 2] = 255;
        if (ac) for (let c = 0; c < 3; c++) buf[i + c] = Math.max(buf[i + c], 153 * k); }
      for (let i = 0; i < buf.length; i++) buf[i] = Math.min(255, buf[i]);
      return;
    }
    // per-style state
    let arms = 1, rev = 0, env = 0;
    if (style === 'spin') { arms = [1, 2, 3, 4, 6][Math.min(4, Math.floor(k * 5))]; rev = bTurns(el, .35, 2); }
    if (style === 'rainbow') { rev = bTurns(el, .15, 1.6); wk = Math.pow(Math.max(0, (k - .55) / .45), 2); }
    if (style === 'heartbeat') { const f = bTurns(el, 55 / 60, 170 / 60) % 1; env = Math.max(Math.exp(-f * 9), f >= .3 ? .75 * Math.exp(-(f - .3) * 9) : 0); pulse = env; dim = .35 + .4 * k; wk = 0; }
    let srot = 0, ssize = 0, senv = 0;
    if (style === 'star') { srot = bTurns(el, .15, 1.4); const bb = bTurns(el, 1, 3) % 1; senv = Math.exp(-bb * 6); ssize = (.62 + .45 * k + .08 * senv) * Math.min((W - 1) / 2, (H - 1) / 2) * 1.2; pulse = senv; dim = .55 + .35 * k; wk = 0; }   // big and bold from the first second
    const ra = (.06 + .1 * k) * Math.sin(t * (1.5 + 2.5 * k)) * 6.2832;
    const hs = (.42 + .22 * k + .14 * env) * Math.min((W - 1) / 2, (H - 1) / 2);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const j = y * W + x, i = j * 3; let m = 0, lv = 0, rim = 0, col;
      if (style === 'close' || style === 'zipper') { const d = style === 'close' ? BG.ring[j] : BG.ex[j], fr = k * 1.06;
        m = bSoft(fr - d, .12); rim = k < .99 ? Math.exp(-(((d - fr) / .075) ** 2)) * (.6 + .4 * pulse) : 0; lv = m * (.3 + .6 * k * pulse);
        col = style === 'close' ? pal(d * 1.2 - t * .5) : pal((x < (W - 1) / 2 ? 0 : .5) + y / H * .35 + d * .5 - t * .4); }
      else if (style === 'burst') { const r = BG.rad[j], fr = .06 + k * 1.02, core = Math.exp(-((r / (.08 + .25 * k)) ** 2)) * (.4 + .6 * k);
        m = bSoft(fr - r, .1); rim = k < .99 ? Math.exp(-(((r - fr) / .07) ** 2)) * (.6 + .4 * pulse) : 0; lv = m * (.35 + .6 * k * pulse);
        col = pal(r * 1.6 - t * .6).map(v => v * (1 - core) + 255 * core); }
      else if (style === 'spin') { const r = BG.rad[j], u = (((rev - BG.ang[j]) * arms) % 1 + 1) % 1, arm = (1 - u) ** 4, hub = Math.exp(-((r / (.06 + .12 * k)) ** 2));
        const head = Math.exp(-((u / .06) ** 2)) + Math.exp(-(((1 - u) / .03) ** 2));
        col = pal(r * .7 + u * .25 + t * .1).map(v => { v = v * (1 - .6 * head) + 153 * head; return v * (1 - hub) + 255 * hub; });
        lv = clamp(.04 + .16 * k + (.7 + .3 * k) * arm + hub, 0, 1) * (.8 + .2 * pulse); m = clamp(.2 + arm, 0, 1); }
      else if (style === 'rainbow') { const fi = ss(0, 1.6, el); col = hue((x / W + y / H * .6) * (1 + 1.5 * k) - rev, 1, 1); lv = (.35 + .65 * k * (.65 + .35 * pulse)) * fi; m = fi; }   // 🌅 fades in
      else if (style === 'star') { const d = Math.hypot(BG.dx[j], BG.dy[j]), f = .5 + .5 * Math.cos(5 * (Math.atan2(BG.dy[j], BG.dx[j]) - srot * 6.2832)), rs = ssize * (.42 + .58 * f ** 2.2);
        const mm = clamp((rs - d) / Math.max(.6, ssize * .1) + .5, 0, 1), rays = f ** 10 * Math.exp(-d / (ssize * 2)) * (.3 + .6 * k);
        const hw = .6 + .3 * k; col = pal(d / Math.max(1, ssize) * .5 - t * (.2 + .8 * k)).map((v, c) => v * (1 - hw) + hw * hue(d / Math.max(1, ssize) * .45 - t * (.4 + .6 * k), 1, 1)[c]);   // 🌈 rainbow star
        lv = mm * (.55 + .45 * senv) + rays; m = Math.max(mm, clamp(rays, 0, 1)); if (R() < (.04 + .12 * k) * mm) { lv = 1.4; } }
      else if (style === 'heartbeat') { const X0 = BG.dx[j] / hs, Y0 = -BG.dy[j] / hs, X = X0 * Math.cos(ra) - Y0 * Math.sin(ra), Y = X0 * Math.sin(ra) + Y0 * Math.cos(ra) + .12, v = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3;
        const mm = clamp(.5 - v * 6, 0, 1), glow = Math.exp(-BG.rad[j] * 3) * env * (.25 + .5 * k);
        col = pal(.15 * Y + t * (.05 + .5 * k)).map((v, c) => v * (1 - .35 * k) + .35 * k * hue(.2 * Y + t * .4, 1, 1)[c]); lv = mm * (.55 + .45 * env) + glow * (1 - mm); m = Math.max(mm, glow); }
      const keep = (1 - dim) * (1 - .5 * m);
      for (let c = 0; c < 3; c++) { const cc = col[c] * (1 - wk) + 255 * wk; buf[i + c] = Math.min(255, buf[i + c] * keep + lv * cc + rim * (127 + .5 * cc)); }
      if (R() < (.008 + .045 * k) * (.3 + .7 * m)) buf[i] = buf[i + 1] = buf[i + 2] = 255;
      if (k > .5 && pulse > .85) for (let c = 0; c < 3; c++) buf[i + c] = Math.max(buf[i + c], 127 * k);
    }
  }
  // ======================================================================= 🎛️ live filters (Oct 21, ported from filters.py): Pro DJ's FILTERS panel
  const FLT_ORDER = ['mirror', 'fisheye', 'tiles', 'shake', 'freeze', 'rgb', 'halftone', 'duotone', 'radar', 'strobe'];
  const FLT_DROP = ['rgb', 'tiles', 'fisheye', 'mirror', 'radar', 'strobe', 'halftone', 'duotone'];
  const FLT = {on: [], auto: true, play: {}, frozen: null, frozenAt: 0, tmp: new Float32Array(N * 3)};
  const fltInfo = () => ({on: FLT.on.slice(), auto: FLT.auto, playing: Object.keys(FLT.play).filter(k => FLT.play[k] > now()), order: FLT_ORDER});
  function fltCmd(b) {
    if (b.clear) { FLT.on = []; FLT.play = {}; }
    if ('auto' in b) FLT.auto = !!b.auto;
    if (b.name && FLT_ORDER.includes(b.name)) { const on = 'on' in b ? !!b.on : !FLT.on.includes(b.name); FLT.on = FLT.on.filter(x => x !== b.name); if (on) FLT.on.push(b.name); if (b.name === 'freeze') FLT.frozen = null; }
    return {ok: true, filters: fltInfo()};
  }
  function fltOnDrop() { if (!FLT.auto || R() > .6) return; const per = 60 / (DJ.tap_bpm || BPM || 120); FLT.play = {[pickOne(FLT_DROP)]: now() + 8 * per}; }
  function fltApply(buf, t) {
    const act = FLT_ORDER.filter(k => FLT.on.includes(k) || FLT.play[k] > t);
    if (FLT.auto && DJ.build != null && !act.includes('shake')) act.splice(3, 0, 'shake');      // a little shake while the build winds up
    if (!act.length) { FLT.frozen = null; return; }
    const per = 60 / (DJ.tap_bpm || BPM || 120), ph = (t / per) % 1, src = FLT.tmp, cx = (W - 1) / 2, cy = (H - 1) / 2;
    const cols = lookCols(S.look).map(c => { const m = Math.max(...c, 1); return c.map(v => v / m * 255); });
    for (const k of act) {
      src.set(buf);
      if (k === 'mirror') { for (let y = 0; y < H; y++) for (let x = Math.ceil(W / 2); x < W; x++) { const i = (y * W + x) * 3, s = (y * W + (W - 1 - x)) * 3; buf[i] = src[s]; buf[i + 1] = src[s + 1]; buf[i + 2] = src[s + 2]; } }
      else if (k === 'fisheye') { const R0 = Math.hypot(cx, cy), amt = .45 + .15 * Math.cos(ph * 6.283);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) / R0, f = r > 0 ? Math.pow(r, 1 + amt) / r : 1;
          const sx = clamp(Math.round(cx + dx * f), 0, W - 1), sy = clamp(Math.round(cy + dy * f), 0, H - 1), i = (y * W + x) * 3, s = (sy * W + sx) * 3; buf[i] = src[s]; buf[i + 1] = src[s + 1]; buf[i + 2] = src[s + 2]; } }
      else if (k === 'tiles') { const ts = 5, push = 1.5 * Math.exp(-ph * 4); buf.fill(0);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const tx = Math.floor(x / ts), ty = Math.floor(y / ts), dx = (tx + .5) * ts - cx, dy = (ty + .5) * ts - cy, d = Math.hypot(dx, dy) || 1;
          const nx = Math.round(x + dx / d * push * 2), ny = Math.round(y + dy / d * push * 2); if (nx < 0 || ny < 0 || nx >= W || ny >= H || x % ts === 0 || y % ts === 0) continue;
          const i = (ny * W + nx) * 3, s = (y * W + x) * 3; buf[i] = src[s]; buf[i + 1] = src[s + 1]; buf[i + 2] = src[s + 2]; } }
      else if (k === 'shake') { const a = FLT.on.includes('shake') || FLT.play.shake > t ? 2 : 1 + (DJ.build != null ? Math.min(1, (t - DJ.build) / 6) : 0), ox = Math.round((R() - .5) * 2 * a), oy = Math.round((R() - .5) * a);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = clamp(x + ox, 0, W - 1), sy = clamp(y + oy, 0, H - 1), i = (y * W + x) * 3, s = (sy * W + sx) * 3; buf[i] = src[s]; buf[i + 1] = src[s + 1]; buf[i + 2] = src[s + 2]; } }
      else if (k === 'freeze') { if (!FLT.frozen || t - FLT.frozenAt > per * 4) { FLT.frozen = Float32Array.from(src); FLT.frozenAt = t; } buf.set(FLT.frozen); }
      else if (k === 'rgb') { const sh = 1 + Math.round(1.5 * Math.exp(-ph * 3));
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; buf[i] = src[(y * W + clamp(x - sh, 0, W - 1)) * 3]; buf[i + 2] = src[(y * W + clamp(x + sh, 0, W - 1)) * 3 + 2]; } }
      else if (k === 'halftone') { const cs = 3;
        for (let ty = 0; ty < H; ty += cs) for (let tx = 0; tx < W; tx += cs) { let r = 0, gg = 0, b = 0, n = 0;
          for (let y = ty; y < Math.min(H, ty + cs); y++) for (let x = tx; x < Math.min(W, tx + cs); x++) { const s = (y * W + x) * 3; r += src[s]; gg += src[s + 1]; b += src[s + 2]; n++; }
          r /= n; gg /= n; b /= n; const lum = Math.max(r, gg, b) / 255, rad = lum * cs * .75;
          for (let y = ty; y < Math.min(H, ty + cs); y++) for (let x = tx; x < Math.min(W, tx + cs); x++) { const d = Math.hypot(x - (tx + 1), y - (ty + 1)), m = clamp(rad - d + .5, 0, 1) * 1.4, i = (y * W + x) * 3; buf[i] = r * m; buf[i + 1] = gg * m; buf[i + 2] = b * m; } } }
      else if (k === 'duotone') { let A = cols[0] || [255, 61, 154], B = cols[0] || [51, 214, 255], best = -1;
        for (const a of cols) for (const c of cols) { const d = Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]); if (d > best) { best = d; A = a; B = c; } }
        if (best < 60) B = [51, 214, 255];
        for (let j = 0; j < N; j++) { const i = j * 3, l = clamp(((src[i] * .3 + src[i + 1] * .55 + src[i + 2] * .15) / 255 - .1) * 1.6, 0, 1); for (let c = 0; c < 3; c++) buf[i + c] = A[c] * (1 - l) * .35 + B[c] * l; } }
      else if (k === 'radar') { const a0 = (t / (per * 4)) % 1 * 6.283;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = Math.atan2(y - cy, x - cx), d = ((a0 - a) % 6.283 + 6.283) % 6.283, m = .12 + .88 * Math.exp(-d * 1.6), i = (y * W + x) * 3; buf[i] *= m; buf[i + 1] *= m; buf[i + 2] *= m; } }
      else if (k === 'strobe') { if ((t / (per / 2)) % 1 > .5) for (let i = 0; i < buf.length; i++) buf[i] *= .08; }
    }
  }
  function djApply(buf, t, dt) {
    fltApply(buf, t);
    const bi = Math.floor(beatPos); if (DJ.queue.length && bi !== DJ._lb) { const q = DJ.queue; DJ.queue = []; q.forEach(djFire); }
    DJ._lb = bi;
    if (DJ.build != null) djBuild(buf, t, t - DJ.build, DJ.bstyle || 'rise');   // 🎚️ the wind-up, in the style picked on the phone
    for (const r of DJ.rings) { r.r += dt * 26; for (let a = 0; a < 6.283; a += .12) put(buf, r.x + Math.cos(a) * r.r, r.y + Math.sin(a) * r.r * .9, r.c, Math.max(0, 1 - r.r / 30)); }
    DJ.rings = DJ.rings.filter(r => r.r < 30);
    for (const q of DJ.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .97; q.vy = q.vy * .97 + q.g * dt; q.l -= dt * .9; if (q.l > 0) put(buf, q.x, q.y, q.c, Math.min(1, q.l * 1.4)); }
    DJ.parts = DJ.parts.filter(q => q.l > 0);
    if (DJ.pfx.length) padDraw(buf, t);
    if (DJ.nfx.length) nDraw(buf, t);
    if (DJ.word) {                                                  // big scrolling words over a dimmed show
      const el = t - DJ.word.t0, dur = 2.8; if (el > dur) DJ.word = null;
      else { const m = textMask(DJ.word.w, H), x0 = Math.round(W - (el / dur) * (W + m.w)), y0 = Math.max(0, ((H - m.h) / 2) | 0), hh = el / .7;
        const col = [.5 + .5 * Math.cos(6.283 * hh), .5 + .5 * Math.cos(6.283 * (hh - .33)), .5 + .5 * Math.cos(6.283 * (hh - .66))].map(v => 120 + 135 * v);
        stamp(buf, m, x0, y0, () => col, .35); }
    }
    const ck = DJ.coolK;                                            // 🌙 cool down: no strobes, flashes fade out
    if (DJ.strobe > t && ck < .5) { const on = Math.floor(t / .055) % 2 === 0; for (let i = 0; i < buf.length; i++) buf[i] = on ? 255 : buf[i] * .05; }
    if (DJ.flash > .01) { for (let i = 0; i < buf.length; i++) buf[i] = Math.max(buf[i], 255 * DJ.flash * (1 - ck)); DJ.flash *= Math.pow(.02, dt); }
    if (DJ.black) buf.fill(0);
  }
  const djInfo = () => ({cue: DJ.cue, building: DJ.build != null, build_style: DJ.bstyle || 'rise', blackout: DJ.black, tap_bpm: DJ.tap_bpm ? Math.round(DJ.tap_bpm) : null,
    queued: DJ.queue.slice(), strobing: now() < DJ.strobe, cool: coolOn(), cool_latched: DJ.coolLatch, cool_level: +DJ.coolK.toFixed(2), color: DJ.colorOn, colors: DJ.colorCols.map(c => '#' + c.map(v => HEX[v]).join(''))});
  const coolOn = () => DJ.coolLatch || now() < DJ.coolUntil;

  // ======================================================================= 🔤 text + logo layer
  const TX = {s: null, presets: [], logo: null, dropUntil: 0, t0: 0};
  function textOverlay(buf, t, si) {
    const s = TX.s, show = s.show; let mode = s.mode, what = show;
    if (show === 'both') what = Math.floor((t - TX.t0) / 15) % 2 ? 'logo' : 'text';
    const dropOn = s.drop_flash && t < TX.dropUntil;
    if (what === 'off' && !dropOn) return;
    const col = (x, y) => { const c = s.color;
      if (c === 'rainbow') return hue(x / W + t * .15, .9, 1);
      if (c === 'white') return [255, 255, 255];
      if (c && c[0] === '#') return hexRGB(c);
      return hue((S.lookK * .13 + t * .03) % 1, .75, 1); };
    const dim = s.layer === 'solo' ? 0 : .3;
    if (dropOn && what === 'off') { const m = textMask(String(s.drop_word || 'DROP').toUpperCase(), H); stamp(buf, m, ((W - m.w) / 2) | 0, ((H - m.h) / 2) | 0, col, .25); return; }
    if (what === 'logo' && TX.logo) {
      const L = TX.logo, lm = s.logo_mode, k = lm === 'pulse' ? .55 + .45 * Math.pow(1 - (beatPos % 1), 2) : 1;
      if (s.layer === 'solo') buf.fill(0); else for (let i = 0; i < buf.length; i++) buf[i] *= .25;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = ((y * L.h / H | 0) * L.w + (x * L.w / W | 0)) * 3, i = (y * W + x) * 3;
        let c = [L.rgb[j] || 0, L.rgb[j + 1] || 0, L.rgb[j + 2] || 0]; if (c[0] + c[1] + c[2] < 30) continue;
        if (lm === 'shimmer') { const sh = (t * .2 + x / W * .3) % 1, r = hue(sh, .6, 1); c = c.map((v, n) => v * .5 + r[n] * .5 * (v / 255 + .3)); }
        buf[i] = c[0] * k; buf[i + 1] = c[1] * k; buf[i + 2] = c[2] * k; }
      return;
    }
    const msg = String(s.text || 'GLOWBOP').toUpperCase();
    if (mode === 'drop' && !dropOn) return;
    if (mode === 'scroll') {
      const m = textMask(msg, H), speed = 12 * (s.speed || 1), span = W + m.w, x0 = Math.round(W - ((t - TX.t0) * speed) % span);
      stamp(buf, m, x0, ((H - m.h) / 2) | 0, col, dim); return;
    }
    let word = msg;
    if (mode === 'beat') { const ws = msg.split(/\s+/).filter(Boolean); word = ws[Math.floor(beatPos / Math.max(1, s.beats || 1)) % ws.length] || msg; }
    if (mode === 'drop') word = msg;
    let m = textMask(word, H); if (m.w > W) m = textMask(word, Math.max(9, Math.floor(H * W / m.w)));
    const pop = mode === 'beat' ? .6 + .4 * Math.pow(1 - (beatPos % 1), 3) : 1;
    stamp(buf, m, Math.round((W - m.w) / 2), ((H - m.h) / 2) | 0, (x, y) => col(x, y).map(v => v * pop), dim);
  }

  // ======================================================================= 🔥 fire recolouring (the recordings are classic orange)
  const LUTS = {};
  function lut(stops) { const out = []; for (let i = 0; i < 64; i++) { const v = i / 63; let j = 0; while (j < stops.length - 2 && stops[j + 1][0] < v) j++;
    const [a, ca] = stops[j], [b, cb] = stops[j + 1], k = clamp((v - a) / ((b - a) || 1), 0, 1); out.push(ca.map((c, n) => (c + (cb[n] - c) * k) * 255)); } return out; }
  function palette(name) { if (LUTS[name]) return LUTS[name]; const p = ENG.fire_palettes[name]; return (LUTS[name] = p ? lut(p) : null); }
  function heatOf(r, g, b) { const cl = palette('classic'), s = r + g + b; let lo = 0, hi = 63;      // invert the classic palette by brightness
    while (lo < hi) { const m = (lo + hi) >> 1, c = cl[m]; if (c[0] + c[1] + c[2] < s) lo = m + 1; else hi = m; } return lo / 63; }
  function teamLut(hex) { const c = hexRGB(hex).map(v => v / 255); return lut([[0, [0, 0, 0]], [.25, c.map(v => v * .25)], [.6, c], [.85, c.map(v => v * .6 + .4)], [1, [1, 1, 1]]]); }
  function recolor(buf, color, t, fp) {
    if (!color || color === 'classic') return;
    let pal = null, per = null;
    if (color === 'team') { const a = teamLut(fp.team1), b = teamLut(fp.team2); per = x => x < W / 2 ? a : b; }
    else if (color === 'nightshift') { const seq = ['classic', 'purple', 'blue', 'green'], ph = (wall() / 1200 * 4) % 4; pal = palette(seq[Math.floor(ph)]); if (seq[Math.floor(ph)] === 'classic') return; }
    else if (color !== 'rainbow') pal = palette(color);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3, h = heatOf(buf[i], buf[i + 1], buf[i + 2]); if (h <= 0) continue;
      let c;
      if (color === 'rainbow') { const v = Math.min(1, h * 1.25), wh = Math.max(0, (h - .82) * 4); c = hue(x / W * .8 + t * .08 + y / H * .2, 1 - wh * .8, v); }
      else c = (per ? per(x) : pal)[Math.round(h * 63)];
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
    }
  }

  // ======================================================================= 🏟️ scoreboard (Game Day is drawn live from the state)
  const SB = {s: null, hist: [], cele: null, lastT: now(), liveT: 0};
  const SPORT_CLIP = {soccer: 'score-soccer', football: 'score-football', basketball: 'score-basketball', baseball: 'score-baseball', softball: 'score-baseball', hockey: 'score-hockey'};
  const sportOf = () => SB.s.sports[SB.s.sport] || SB.s.sports.other;
  const DIRS = {soccer: 'up', rugby: 'up', aussie: 'up'};
  function cfg() { const sp = sportOf(), c = SB.s.cfg || {}; const minutes = c.minutes != null ? (+c.minutes || null) : sp.clock;
    return {minutes, periods: c.periods || sp.periods, dir: c.dir || (minutes ? (DIRS[SB.s.sport] || 'down') : 'down'), per: sp.per}; }
  function resetClock() { const c = cfg(); SB.s.running = false; SB.s.clock = c.minutes && c.dir === 'down' ? c.minutes * 60 : 0; }
  function drawBoard(buf, t) {
    const s = SB.s, sp = sportOf(), c = cfg();
    buf.fill(0);
    if (sp.name && SB.s.sport === 'timer') {
      const tx = fmtClock(s.clock), k = tinyW(tx, 2) > W ? 1 : 2, col = s.running ? [255, 210, 122] : [255, 178, 61];
      tiny(buf, tx, Math.round((W - tinyW(tx, k)) / 2), Math.round((H - 5 * k) / 2), col, k); return;
    }
    const sides = [['home', 10], ['away', 30]];
    sides.forEach(([side, cx]) => {
      const tm = s[side], col = glow(hexRGB(tm.color)), nm = String(tm.name || side).toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 4).trim() || side.slice(0, 4).toUpperCase();
      tiny(buf, nm, Math.round(cx - tinyW(nm, 1) / 2), 0, col, 1);
      const sc = String(Math.min(999, tm.score)), k = sc.length > 2 ? 1 : 2;
      tiny(buf, sc, Math.round(cx - tinyW(sc, k) / 2), k === 2 ? 6 : 8, [255, 255, 255].map((v, n) => v * .7 + col[n] * .3), k);
      if (s.poss === side) put(buf, side === 'home' ? 1 : W - 2, 8, [255, 178, 61]);
    });
    for (let y = 6; y < 16; y++) put(buf, 19.5, y, [46, 40, 69]);
    let per = sp.innings ? (s.half === 'top' ? 'T' : 'B') + s.period : sp.per ? ({H: 'H', Q: 'Q', P: 'P', INN: 'I', SET: 'S', G: 'G', RD: 'R'}[sp.per] || 'P') + s.period : '';
    if (c.minutes) { const tx = fmtClock(s.clock); tiny(buf, tx, Math.round((W - tinyW(tx, 1)) / 2), 16, s.running ? [255, 210, 122] : [255, 178, 61], 1); tiny(buf, per, 0, 16, [204, 153, 255], 1); }
    else if (sp.innings) { const tx = per + ' ' + s.balls + '-' + s.strikes; tiny(buf, tx, Math.round((W - tinyW(tx, 1)) / 2), 16, [204, 153, 255], 1);
      for (let o = 0; o < 2; o++) put(buf, 36 + o * 2, 18, o < s.outs ? [255, 178, 61] : [46, 40, 69]); }
    else if (per) tiny(buf, per, Math.round((W - tinyW(per, 1)) / 2), 16, [204, 153, 255], 1);
    if (SB.cele) {                                                   // GOAL / TOUCHDOWN in the team colour, over a flashing board
      const el = t - SB.cele.t0, dur = 3.2; if (el > dur) { SB.cele = null; return; }
      const col = glow(hexRGB(SB.cele.color)), pulse = .5 + .5 * Math.cos(el * 12);
      for (let i = 0; i < N; i++) { buf[i * 3] = Math.max(buf[i * 3] * .3, col[0] * .25 * pulse); buf[i * 3 + 1] = Math.max(buf[i * 3 + 1] * .3, col[1] * .25 * pulse); buf[i * 3 + 2] = Math.max(buf[i * 3 + 2] * .3, col[2] * .25 * pulse); }
      const m = textMask(SB.cele.word, H), x0 = Math.round(W - (el / dur) * (W + m.w)); stamp(buf, m, x0, ((H - m.h) / 2) | 0, () => [255, 255, 255]);
    }
  }
  const fmtClock = c => { c = Math.max(0, Math.floor(c || 0)); return c >= 6000 ? Math.floor(c / 3600) + ':' + String(Math.floor(c / 60) % 60).padStart(2, '0') : Math.floor(c / 60) + ':' + String(c % 60).padStart(2, '0'); };
  // 📋 Live now (demo): a handful of pretend games that tick along, so the list has something in it
  function demoNow() {
    const T = (lg, i) => { const t = TEAMS[lg][i]; return {abbr: t[0], name: t[1].split(' ').slice(-1)[0], color: t[2], id: lg + i, score: 0}; };
    const m = Math.floor(Date.now() / 60000), now = Date.now() / 1000;
    const G = [['nba', 0, 1, 'in', 'basketball', 'NBA', 98 + (m % 7), 95 + (m % 5), 'Q4 2:31'], ['nfl', 2, 4, 'in', 'football', 'NFL', 24, 21 + (m % 2) * 3, 'Q3 8:12'],
      ['mlb', 1, 2, 'in', 'baseball', 'MLB', 3, 2 + (m % 3 === 0 ? 1 : 0), 'Bot 7th'], ['nhl', 0, 1, 'pre', 'hockey', 'NHL', 0, 0, ''], ['epl', 0, 1, 'post', 'soccer', 'Premier League', 2, 1, 'FT'],
      ['nba', 2, 3, 'pre', 'basketball', 'NBA', 0, 0, ''], ['mls', 0, 1, 'in', 'soccer', 'MLS', 1, 1, "67'"]];
    return {t: now, games: G.map(([lg, a, h, st, sport, ln, as, hs, det], i) => { const A = T(lg, a), H = T(lg, h); A.score = as; H.score = hs;
      return {key: lg + ':' + i, league: lg, lname: ln, sport, state: st, detail: st === 'post' ? 'Final' : det, period: 3, start: st === 'pre' ? now + 3600 * (i - 2) : now - 7200,
        home: H, away: A, ex: {rec: {home: '5-2', away: '4-3'}, venue: 'Demo Arena', tv: 'Demo TV', last: st === 'in' ? 'A big play just happened (demo).' : '', note: ''}}; })
      .concat([{kind: 'f1', key: 'f1:demo', league: 'f1', lname: 'Formula 1', sport: 'f1', state: 'in', detail: 'LIVE', period: 0, start: now - 1800, title: 'Demo GP · Race', ex: {venue: 'Demo Circuit', session: 'Race'}}])};
  }
  const TEAMS = {
    nfl: [['MIA', 'Miami Dolphins', '#008e97'], ['BUF', 'Buffalo Bills', '#00338d'], ['KC', 'Kansas City Chiefs', '#e31837'], ['DAL', 'Dallas Cowboys', '#003594'], ['PHI', 'Philadelphia Eagles', '#004c54'], ['SF', 'San Francisco 49ers', '#aa0000'], ['GB', 'Green Bay Packers', '#203731'], ['NE', 'New England Patriots', '#c60c30']],
    nba: [['MIA', 'Miami Heat', '#98002e'], ['BOS', 'Boston Celtics', '#007a33'], ['LAL', 'Los Angeles Lakers', '#552583'], ['GSW', 'Golden State Warriors', '#1d428a'], ['NYK', 'New York Knicks', '#f58426'], ['DEN', 'Denver Nuggets', '#0e2240']],
    mlb: [['MIA', 'Miami Marlins', '#00a3e0'], ['NYY', 'New York Yankees', '#003087'], ['LAD', 'Los Angeles Dodgers', '#005a9c'], ['BOS', 'Boston Red Sox', '#bd3039'], ['ATL', 'Atlanta Braves', '#ce1141'], ['CHC', 'Chicago Cubs', '#0e3386']],
    nhl: [['FLA', 'Florida Panthers', '#c8102e'], ['TB', 'Tampa Bay Lightning', '#002868'], ['NYR', 'New York Rangers', '#0038a8'], ['TOR', 'Toronto Maple Leafs', '#00205b'], ['EDM', 'Edmonton Oilers', '#ff4c00'], ['VGK', 'Vegas Golden Knights', '#b4975a']],
    mls: [['MIA', 'Inter Miami CF', '#f7b5cd'], ['ORL', 'Orlando City SC', '#633492'], ['LA', 'LA Galaxy', '#00245d'], ['ATL', 'Atlanta United FC', '#80000a'], ['SEA', 'Seattle Sounders FC', '#5d9741']],
    epl: [['ARS', 'Arsenal', '#ef0107'], ['LIV', 'Liverpool', '#c8102e'], ['MCI', 'Manchester City', '#6cabdd'], ['MUN', 'Manchester United', '#da291c'], ['CHE', 'Chelsea', '#034694'], ['TOT', 'Tottenham Hotspur', '#132257']],
  };
  function liveGame(lg, id) {
    const ts = TEAMS[lg] || [], me = ts.find(x => x[0] === id) || ts[0], opp = ts.find(x => x !== me) || me, sport = SB.s.leagues_sport[lg] || 'football';
    const T = (x, sc) => ({abbr: x[0], name: x[1], color: x[2], score: sc});
    const g = {home: T(me, 0), away: T(opp, 0), state: 'in', source: 'ESPN (demo data)', period: 3, clock: '7:42', detail: '3rd Quarter', extra: {}};
    if (sport === 'football') { g.home.score = 17; g.away.score = 13; g.extra = {down: '2nd & 7', poss: 'home', last: g.home.abbr + ' pass complete for 14 yards to the ' + g.away.abbr + ' 34', note: 'Regular season',
      home: {line: [7, 3, 7], leaders: [{cat: 'Passing', name: 'QB #1', val: '212 yds'}], record: '5-1'}, away: {line: [3, 10, 0], leaders: [{cat: 'Rushing', name: 'RB #22', val: '88 yds'}], record: '4-2'}}; }
    else if (sport === 'baseball') { g.home.score = 4; g.away.score = 3; g.clock = 'bottom'; g.period = 6; g.detail = 'Bottom 6th · 1 out';
      g.extra = {bases: [1, 0, 1], balls: 2, strikes: 1, outs: 1, batter: 'Batter #7', batter_line: '2-3, RBI', pitcher: 'Pitcher #45', pitcher_line: '5.1 IP, 6 K',
        home: {line: [0, 2, 0, 1, 0, 1], hits: 8, errors: 0, record: '78-60'}, away: {line: [1, 0, 0, 2, 0, 0], hits: 6, errors: 1, record: '74-64'}}; }
    else if (sport === 'basketball') { g.home.score = 78; g.away.score = 74; g.clock = '4:18'; g.detail = '3rd Quarter'; g.extra = {home: {line: [26, 24, 28], record: '9-3'}, away: {line: [22, 30, 22], record: '8-4'}, note: 'Regular season'}; }
    else if (sport === 'hockey') { g.home.score = 2; g.away.score = 1; g.clock = '11:05'; g.period = 2; g.detail = '2nd Period'; g.extra = {home: {line: [1, 1]}, away: {line: [0, 1]}}; }
    else { g.home.score = 1; g.away.score = 1; g.clock = "63'"; g.period = 2; g.detail = '2nd Half'; g.extra = {home: {line: [1, 0]}, away: {line: [0, 1]}}; }
    return g;
  }
  const F1 = [['VER', 'Max Verstappen', '#3671c6'], ['NOR', 'Lando Norris', '#ff8000'], ['LEC', 'Charles Leclerc', '#e8002d'], ['PIA', 'Oscar Piastri', '#ff8000'], ['HAM', 'Lewis Hamilton', '#e8002d'],
    ['RUS', 'George Russell', '#27f4d2'], ['ANT', 'Kimi Antonelli', '#27f4d2'], ['ALO', 'Fernando Alonso', '#229971'], ['SAI', 'Carlos Sainz', '#64c4ff'], ['GAS', 'Pierre Gasly', '#0093cc']];
  function scoreCmd(b) {
    const s = SB.s, a = b.action || '', sp = sportOf();
    const UNDO = ['add', 'set', 'count', 'period', 'stat', 'swap', 'reset', 'sport', 'config'];
    if (a === 'undo') { const h = SB.hist.pop(); if (h) Object.assign(s, h); SB.cele = null; return; }
    if (UNDO.includes(a)) SB.hist = SB.hist.concat([JSON.parse(JSON.stringify({sport: s.sport, home: s.home, away: s.away, period: s.period, half: s.half, balls: s.balls, strikes: s.strikes, outs: s.outs, down: s.down, togo: s.togo, poss: s.poss, cfg: s.cfg, clock: s.clock, running: s.running}))]).slice(-40);
    if (a === 'on') { s.on = true; s.mode = b.mode || s.mode; bump('score'); }
    else if (a === 'off') s.on = false;
    else if (a === 'game' || a === 'f1') { s.on = true; s.mode = a; bump('score'); if (a === 'f1') s.f1 = {order: F1.map(([code, name, color]) => ({code, name, color}))}; }
    else if (a === 'live') { s.on = true; s.mode = 'live'; s.league = b.league || s.league; s.team_id = b.team_id; s.team_name = b.team_name || ''; s.live = liveGame(s.league, s.team_id); SB.liveT = wall(); bump('score'); }
    else if (a === 'add') { const tm = s[b.team]; if (tm) { const p = +b.points || 0; tm.score = Math.max(0, tm.score + p);
      if (p > 0) { const w = (ENG.score_words[s.sport] || {})[String(p)]; SB.cele = {color: tm.color, word: w || (p > 1 ? '+' + p : pickOne(['SCORE', 'YES', 'BOOM', 'LETS GO'])), t0: now()};
        DJ.queue.push('confetti'); } } }
    else if (a === 'clock') { if (b.do === 'toggle') s.running = !s.running; else if (b.do === 'reset') resetClock(); if (b.adjust) s.clock = Math.max(0, s.clock + +b.adjust); }
    else if (a === 'period') { s.period = clamp(s.period + (+b.delta || 0), 1, 99); if (sp.innings) { s.half = 'top'; s.balls = s.strikes = s.outs = 0; } resetClock(); }
    else if (a === 'count') { if (b.what === 'clear') s.balls = s.strikes = 0;
      else if (b.what === 'ball') { s.balls++; if (s.balls >= 4) s.balls = s.strikes = 0; }
      else if (b.what === 'strike') { s.strikes++; if (s.strikes >= 3) { s.balls = s.strikes = 0; s.outs++; } }
      else if (b.what === 'out') { s.outs++; s.balls = s.strikes = 0; }
      if (s.outs >= 3) { s.outs = 0; if (s.half === 'top') s.half = 'bottom'; else { s.half = 'top'; s.period++; } } }
    else if (a === 'set') { ['home', 'away'].forEach(k => { if (b[k]) Object.assign(s[k], b[k]); }); if (b.down) s.down = b.down; if (b.togo != null) s.togo = b.togo; if ('poss' in b) s.poss = b.poss; }
    else if (a === 'stat') { const tm = s[b.team]; if (tm) tm[b.what] = Math.max(0, (tm[b.what] || 0) + (+b.delta || 0)); }
    else if (a === 'swap') { const h = s.home; s.home = s.away; s.away = h; s.poss = s.poss === 'home' ? 'away' : s.poss === 'away' ? 'home' : s.poss; }
    else if (a === 'reset') { ['home', 'away'].forEach(k => Object.assign(s[k], {score: 0, sets: 0, fouls: 0, timeouts: 0})); Object.assign(s, {period: 1, half: 'top', balls: 0, strikes: 0, outs: 0, down: 1, togo: 10, poss: null}); resetClock(); }
    else if (a === 'sport') { if (s.sports[b.sport]) { s.sport = b.sport; s.cfg = {}; s.period = 1; resetClock(); } }
    else if (a === 'config') { s.cfg = {minutes: +b.minutes || 0, periods: +b.periods || 1, dir: b.dir}; resetClock(); }
  }
  function scoreInfo() { const c = cfg(); return Object.assign(JSON.parse(JSON.stringify(SB.s)), {can_undo: SB.hist.length, live_err: '', now: {minutes: c.minutes, periods: c.periods, dir: c.dir, per: c.per}}); }

  // ======================================================================= 📡 live feeds
  const FD = {s: null, cele: 0, finale: 0, alert: null};
  function nextAt(m, d, h) { const n = new Date(); let t = new Date(n.getFullYear(), m, d, h || 0, 0, 0); if (t <= n) t = new Date(n.getFullYear() + 1, m, d, h || 0, 0, 0); return t.getTime() / 1000; }
  const DATES = {newyear: [0, 1, 0], christmas: [11, 25, 0], halloween: [9, 31, 18], july4: [6, 4, 21]};
  function feedsInfo() {
    const s = FD.s, t = wall(), out = JSON.parse(JSON.stringify(s));
    Object.entries(out.feeds).forEach(([k, f]) => { f.on = f.kind === 'takeover' ? s.mode === k : !!f.enabled; if ('updated' in f) f.updated = t - 40; });
    const cd = out.feeds.countdown; cd.items.forEach(i => { if (DATES[i.id]) i.at = nextAt(...DATES[i.id]); }); cd.items.sort((a, b) => a.at - b.at);
    const cur = cd.items.find(i => i.id === cd.cur) || cd.items[0]; cd.left = cur ? cur.at - t : null;
    (out.feeds.weather.hours || []).forEach(hh => { hh.t = Math.floor(t / 3600 + hh.h) * 3600; });
    const ov = out.feeds.overhead; ov.next_in = 8 + Math.floor(t % 10); if (ov.iss) { ov.iss.updated = t; if (FD.iss > t) Object.assign(ov.iss, {sim: true, near: true, up: true, mi: 212}); ov.celebrating = FD.iss > t; }
    const st = out.feeds.storm; st.alerting = FD.alert ? FD.alert.event : ''; st.nhc_updated = t - 300;
    return out;
  }
  function feedsCmd(b) {
    const s = FD.s;
    if ('loc' in b) { const q = String(b.loc || '').trim(); s.loc = {q, name: q ? q.replace(/\b\w/g, c => c.toUpperCase()) : '', lat: 25.77, lon: -80.19};
      Object.values(s.feeds).forEach(f => { if ('loc' in f) f.loc = s.loc.name; if ('loc_name' in f) f.loc_name = s.loc.name; });
      setTimeout(() => toast('📍 In the demo every place gets sample weather and planes'), 1700); return; }
    if (b.mode === 'off') { s.mode = 'off'; return; }
    const k = b.feed || b.mode, f = s.feeds[k]; if (!f) return;
    if (k === 'storm') {
      if ('on' in b) { f.enabled = !!b.on; if (!b.on) FD.alert = null; }
      if (b.test) { f.enabled = true; FD.alert = {event: 'Tornado Warning (TEST)', until: now() + 40}; bump('alert'); }
      if (b.stop) FD.alert = null; return;
    }
    if (k === 'countdown') {
      if (b.add) { const id = 'c' + Date.now() % 100000; f.items.push({id, name: b.add.name, at: b.add.at, finale: b.add.finale || ''}); f.cur = id; }
      if (b.pick) f.cur = b.pick; if (b.remove) { f.items = f.items.filter(i => i.id !== b.remove); if (f.cur === b.remove) f.cur = (f.items[0] || {}).id; }
      if (b.color) f.color = b.color; if (b.test_finale) FD.finale = now() + 7;
    }
    if (k === 'weather' && b.units) { f.units = b.units; const want = b.units === 'C' ? 'C' : 'F';
      if (want !== f.unit) { const cv = v => v == null ? v : Math.round(want === 'C' ? (v - 32) * 5 / 9 : v * 9 / 5 + 32);
        ['temp', 'feels'].forEach(x => f.cur[x] = cv(f.cur[x])); f.today.hi = cv(f.today.hi); f.today.lo = cv(f.today.lo); f.hours.forEach(hh => hh.temp = cv(hh.temp)); f.unit = want;
        f.cur.wind = want === 'C' ? Math.round(f.cur.wind * 1.609) : Math.round(f.cur.wind / 1.609); f.cur.wind_unit = want === 'C' ? 'km/h' : 'mph'; } }
    if (k === 'overhead') { if (b.radius) f.radius = +b.radius; if (b.test_iss) FD.iss = wall() + 25; }
    if (['golf', 'nascar', 'tennis', 'ufc'].includes(k)) {
      ['tour', 'series', 'pick'].forEach(x => { if (x in b) { f[x] = b[x]; setTimeout(() => toast('In the demo every ' + (x === 'pick' ? 'card' : x) + ' shows the same sample board'), 1700); } });
      if ('fav' in b) { f.fav = b.fav; f.fav_name = b.fav_name || ''; (f.rows || []).forEach(r => { const id = r.id || r.key; r.fav = !!b.fav && (id === b.fav || (r.a && r.a.name === b.fav_name) || (r.b && r.b.name === b.fav_name)); }); }
      if (b.test_cele) { FD.cele = now() + 4; DJ.queue.push('confetti'); }
    }
    if (NEW_FEEDS.includes(k)) {                                    // 🌍 quakes, aurora, launches, moon, globe, volcano, fires (+ world warnings)
      const SKIP = ['feed', 'on', 'mode', 'g', 'show', 'test', 'test_kp', 'test_flare', 'test_phases', 'dismiss', 'mag', 'map_key'];
      Object.keys(b).forEach(x => { if (!SKIP.includes(x) && x in f) f[x] = b[x]; });
      if ('map_key' in b) { const key = String(b.map_key || '').replace(/[^a-z0-9]/gi, '').slice(0, 64); f.has_key = !!key; f.key_hint = key ? '…' + key.slice(-4) : '';
        f.credit = key ? 'NASA FIRMS' : f.credit; setTimeout(() => toast(key ? '🔑 Saved. In the demo nothing is sent to NASA: the app fetches live hotspots with your key' : 'Key removed'), 300); }
      if (b.test || b.test_kp || b.test_flare || b.test_phases) { b.on = true; curClip = null; }        // a preview: the recording starts over on the wall
      if (f.kind === 'takeover' && (b.on || b.mode === k) && !feedNoted[k]) { feedNoted[k] = 1;
        setTimeout(() => toast('📡 ' + f.title + ': a preview recorded from the app. Live data runs in the GlowBop app.'), 700); }
      if (k === 'worldwx' && ('on' in b)) f.running = !!b.on;
    }
    if (f.kind === 'takeover') { if (b.on === false) { if (s.mode === k) s.mode = 'off'; } else if (b.on || b.mode === k) { s.mode = k; bump('feed'); } }
  }
  const NEW_FEEDS = ['quakes', 'aurora', 'launches', 'moon', 'globe', 'volcano', 'fires', 'worldwx'], feedNoted = {};
  const FEED_CLIP = {countdown: 'live-countdown', weather: 'live-weather', overhead: 'live-overhead', golf: 'live-golf', nascar: 'live-nascar',
    // the newer feeds: recorded from the app's own preview modes (make_feedclips.py)
    quakes: 'live-quakes', aurora: 'live-aurora', launches: 'live-launches', moon: 'live-moon', globe: 'live-globe', volcano: 'live-volcano', fires: 'live-fires'};
  function boardText(k) {                                           // tennis / UFC have no recording: a scrolling ticker of the sample board
    const f = FD.s.feeds[k], rows = f.rows || [];
    if (k === 'tennis') return rows.filter(r => r.state !== 'pre').map(r => `${r.a.short} ${r.a.sets.replace(/ /g, '-')}  ${r.b.short} ${r.b.sets.replace(/ /g, '-')}`).join('   ·   ');
    return rows.slice(0, 4).map(r => `${r.red.short} VS ${r.blue.short}${r.res ? '  ' + r.res : ''}`).join('   ·   ');
  }

  // ======================================================================= 🎵 music: GlowBop's own player, playing pretend songs
  const SONGS = [['Neon Summer (Demo Mix)', 'The Glow Ups', 224, 'Neon Party', 124], ['Midnight Circuit', 'Pixel Hearts', 201, 'Synthwave', 118], ['Bass Lanterns', 'DJ Lumen', 238, 'Warehouse Rave', 128],
    ['Velvet Laser', 'Aurora Club', 212, 'Club Rig', 122], ['Starlight Freeway', 'Synth Coast', 196, 'Deep Space', 110], ['Heatwave Hands Up', 'Bop Machine', 187, 'Mainstage', 128],
    ['Ocean Drive Lights', 'Miami Pulse', 205, 'Big Wave', 120], ['After Hours Arcade', 'Retro Pilots', 179, 'Retro Arcade', 126],
    ['Garage Thunder', 'The Volume Knobs', 199, 'Rock Arena', 132], ['Silk Horizon', 'Lumen Drift', 252, 'Silk', 122], ['Blue Note Lanterns', 'Velvet Quartet', 241, 'Jazz Club', 96],
    ['Porch Light Saturday', 'Hank Glowfield', 187, 'Golden Porch', 104]];
  // 🎼 what song lookup would say about each pretend song: genres + the light style Auto picks (songinfo.py styles)
  const SONG_INFO = {'Garage Thunder': [['rock', 'alternative rock'], 'rock'], 'Silk Horizon': [['melodic bass', 'chillstep'], 'flow'], 'Blue Note Lanterns': [['jazz', 'smooth jazz'], 'jazz'],
    'Porch Light Saturday': [['country', 'americana'], 'country'], 'Starlight Freeway': [['synthwave', 'chill'], 'chill'], 'Ocean Drive Lights': [['tropical house', 'latin'], 'latin']};
  const STY_PICK = {};                                              // 🙋 light styles picked on the MUSIC page (per artist, like the app)
  function songInfoNow() { const t = M.queue[M.idx]; if (!t) return null; const si = SONG_INFO[t.title] || [['dance', 'electronic'], 'dance'], mine = STY_PICK[t.artist];
    return Object.assign({title: t.title, artist: t.artist, genres: si[0], bpm: BPM, key: 'A minor', style: mine || si[1]}, mine ? {by_you: 'artist'} : {}); }
  const track = (x, i) => ({id: 'demo' + i, title: x[0], artist: x[1], dur: x[2], artist_id: 'artist' + i, look: x[3], bpm: x[4]});
  const M = {queue: SONGS.map(track), idx: 0, pos: 37, playing: true, volume: 70, party: false, sleep_at: 0, crossfade: 6, source: 'Demo mix', recent: []};
  function songChanged() {
    const t = M.queue[M.idx]; M.pos = 0; M.posAt = now(); BPM = songBpm(t); knowSong(t); M.recent = [t].concat(M.recent.filter(x => x.id !== t.id)).slice(0, 8);
    if (!S.pinned) { S.held = null; if (S.shuffle) S.look = t.look && CAT.looks[t.look] ? t.look : S.look; S.lookK = 0; }
  }
  function musicState() { const t = M.queue[M.idx] || null, lo = Math.max(0, M.idx - 3);
    return {now: t, idx: M.idx, playing: M.playing, volume: M.volume, source: M.source, pos: M.pos, dur: t ? t.dur : 0, player: true, player_state: M.playing ? 'playing' : 'paused',
      signed_in: false, account: null, queue: M.queue.slice(lo, lo + 60).map((x, i) => Object.assign({}, x, {i: lo + i})), total: M.queue.length, crossfade: M.crossfade, party: M.party,
      sleep_left: M.sleep_at ? Math.max(0, Math.round(M.sleep_at - wall())) : null, family: t && t.look ? [t.look] : [], family_how: 'auto', source_id: 'demo'}; }
  let ytNote = 0;
  const ytToast = () => { if (wall() - ytNote > 20) { ytNote = wall(); setTimeout(() => toast('🎵 In the demo, YouTube shows pretend songs'), 500); } };
  function fakeSongs(q, n) { const w = String(q || 'Glow').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 28);
    return [`${w} (Demo Mix)`, `${w} All Night`, `Lights Up for ${w}`, `${w} (Club Edit)`, `Neon ${w}`, `${w} Forever`].slice(0, n || 6).map((tt, i) =>
      ({id: 'q' + slug(w) + i, title: tt, artist: pickOne(['The Glow Ups', 'Pixel Hearts', 'DJ Lumen', 'Aurora Club']), dur: 170 + i * 13, artist_id: 'artist' + (i % 4)})); }
  function musicCmd(b) {
    const a = b.action, t = b.track;
    if (a === 'toggle') { M.pos = songPos(); M.posAt = now(); M.playing = !M.playing; }
    else if (a === 'next') { M.idx = (M.idx + 1) % M.queue.length; songChanged(); M.playing = true; }
    else if (a === 'prev') { if (M.pos > 5) M.pos = 0; else { M.idx = (M.idx - 1 + M.queue.length) % M.queue.length; songChanged(); } }
    else if (a === 'seek') { M.pos = clamp(+b.pos || 0, 0, (M.queue[M.idx] || {}).dur || 0); M.posAt = now(); }
    else if (a === 'volume') M.volume = clamp(+b.volume || 0, 0, 100);
    else if (a === 'shuffle') { const cur = M.queue[M.idx], rest = M.queue.filter((x, i) => i !== M.idx).sort(() => R() - .5); M.queue = [cur].concat(rest); M.idx = 0; }
    else if (a === 'party') M.party = !!b.on;
    else if (a === 'sleep') M.sleep_at = b.minutes ? wall() + b.minutes * 60 : 0;
    else if (a === 'crossfade') M.crossfade = +b.seconds || 0;
    else if ((a === 'play' || a === 'radio') && t) { M.queue.splice(M.idx + 1, 0, Object.assign({look: pickOne(Object.keys(CAT.looks))}, t)); M.idx++; songChanged(); M.playing = true; if (a === 'radio') M.source = t.title + ' radio'; }
    else if (a === 'add' && t) M.queue.push(t);
    else if (a === 'jump') { const i = +b.i; if (M.queue[i]) { M.idx = i; songChanged(); M.playing = true; } }
    else if (a === 'remove') { const i = +b.i; if (M.queue[i] && i !== M.idx) { M.queue.splice(i, 1); if (i < M.idx) M.idx--; } }
    else if (['playlist', 'album', 'tracks', 'artist_radio'].includes(a)) { const src = b.title || (b.artist && b.artist.name) || b.source || 'Demo mix';
      const list = (b.tracks && b.tracks.length ? b.tracks : fakeSongs(src, 6)).map(x => Object.assign({look: pickOne(Object.keys(CAT.looks))}, x));
      if (b.shuffle) list.sort(() => R() - .5); M.queue = list; M.idx = clamp(+b.start || 0, 0, list.length - 1); M.source = src; songChanged(); M.playing = true; }
    else if (a === 'rate' || a === 'save') return LAPTOP('liking and saving songs');
    else if (a === 'fav_add') { FAVS.push(b.fav); }
    else if (a === 'fav_remove') { FAVS = FAVS.filter(f => f.id !== b.id); }
    else if (a === 'family_set') {}
    else return {status: 400, json: {error: 'unknown music action'}};
    return {json: {ok: true, state: musicState()}};
  }
  let FAVS = [{id: 'demo-party', title: 'Party Starters'}, {id: 'demo-chill', title: 'Chill Glow'}];
  const MOODS = ['Party', 'Workout', 'Chill', 'Focus', 'Feel good', 'Romance', 'Dance & electronic', 'Hip-hop', 'Pop', 'Latin', 'Rock', 'Throwback'];

  // ======================================================================= 💡 the pretend lights: two Twinkly curtains side by side
  const DEVS = [{id: 'twinkly-192.168.0.164', name: 'Left curtain', ip: '192.168.0.164', x0: 0}, {id: 'twinkly-192.168.0.165', name: 'Right curtain', ip: '192.168.0.165', x0: 20}];
  const DEV_ON = {};
  function lightsInfo() {
    const pts = DEVS.map(d => { const x = [], y = []; for (let r = 0; r < H; r++) for (let c = 0; c < 20; c++) { x.push(d.x0 + c); y.push(r); } return {id: d.id, x, y, group: 'g1'}; });
    return {layout: 'canvas', canvas: [W, H], https: '', locked: true, arrange: 'row', grid_shape: null, shape: null, lineup: LINEUP.on, mapping: false, points: pts,
      groups: [{id: 'g1', name: 'Main', w: W, h: H, layout: 'canvas', devices: DEVS.map(d => d.id)}],
      devices: DEVS.map(d => ({id: d.id, type: 'twinkly', brand: 'Twinkly', ip: d.ip, name: d.name, n: 420, enabled: DEV_ON[d.id] !== false, mapped: false, grid: true, connected: true,
        orient: {rot: 0, flip: false}, place: null, pos: [d.x0, 0], gw: 20, gh: H, is_grid: true, overlap_on: null, overlap: 'xy', overlap_at: 'center'}))};
  }

  // ======================================================================= 🎛️ Pro DJ: the demo is a Pro DJ install (fader board, override keys, loops, Song Shows)
  const HOLD = 1.2;                                                 // momentary keys let go by themselves this long after their last refresh
  const curBpm = () => pdTempoBpm();
  const bad = m => { const e = new Error(m); e.bad = true; return e; };
  const num = (x, d) => { const v = Number(x); return isFinite(v) ? v : d; };
  const mix = (a, b, k) => a + (b - a) * k;
  function palAt(cols, u) { u = ((u % 1) + 1) % 1; const n = cols.length, f = u * n, i = Math.floor(f) % n, k = f - Math.floor(f), a = cols[i], b = cols[(i + 1) % n]; return [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)]; }
  const lookCols = n => ((ENG.look_colors || {})[n] || ['#ff3d9a', '#33d6ff', '#9b3dff']).map(hexRGB);
  const lum3 = (b, i) => Math.max(b[i], b[i + 1], b[i + 2]);

  // ----------------------------------------------------------------------- 🎚️ fader board (faders.py)
  const FDEF = {master: 100, speed: 1, strobe: 0, color: 0, white: 0, trails: 0};
  const FRANGE = {master: [0, 100], speed: [0.25, 3], strobe: [0, 100], color: [0, 100], white: [0, 100], trails: [0, 100]};
  const FFLASH = ['master', 'speed', 'strobe', 'color', 'white', 'trails'];
  const FA = {v: Object.assign({}, FDEF), flash: {}, rev: 0, prev: null, frozen: null};
  const fHeld = k => (FA.flash[k] || 0) > wall();
  const fAway = () => Object.keys(FDEF).filter(k => Math.abs(FA.v[k] - FDEF[k]) > 1e-6);
  const colorHue = v => (Math.max(1, v) - 1) / 99 * 0.92;
  const hueRGB = h => { h = (((h % 1) + 1) % 1) * 6; return [clamp(Math.abs(h - 3) - 1, 0, 1), clamp(2 - Math.abs(h - 2), 0, 1), clamp(2 - Math.abs(h - 4), 0, 1)]; };
  function strobeDiv(v, bpm) { if (v <= 0) return 0; let d = [1, 2, 4, 8][Math.min(3, Math.floor((v - 1e-9) / 25))];
    while (d > 1 && 60 / Math.max(40, bpm) / d < 3 / 40) d >>= 1; return d; }
  function fadersInfo() {
    const v = FA.v, away = fAway(), fl = FFLASH.filter(fHeld);
    return {values: Object.assign({}, v), defaults: Object.assign({}, FDEF), away, pro: PRO, active: !!(away.length || fl.length), flash: fl, rev: FA.rev,
      strobe_rate: v.strobe > 0 ? {1: '1 BEAT', 2: '1/2 BEAT', 4: '1/4 BEAT', 8: '1/8 BEAT'}[strobeDiv(v.strobe, curBpm())] : null,
      color_hex: v.color > 0 ? '#' + hueRGB(colorHue(v.color)).map(c => HEX[Math.round(c * 255)]).join('') : null};
  }
  function fadersSet(b) {
    const changed = [], v = Object.assign({}, FA.v), r = b.reset;
    if (r === true || r === 'all') { Object.assign(v, FDEF); FA.flash = {}; changed.push('reset'); }
    else if (typeof r === 'string' && r in FDEF) { v[r] = FDEF[r]; changed.push(r); }
    Object.entries(FRANGE).forEach(([k, [lo, hi]]) => { if (b[k] == null) return; const x = Number(b[k]);
      if (!isFinite(x)) throw bad(`${k}: a number from ${lo} to ${hi}`); v[k] = Math.round(clamp(x, lo, hi) * 1000) / 1000; changed.push(k); });
    if (b.flash != null) { if (!FFLASH.includes(b.flash)) throw bad('flash: ' + FFLASH.join(', '));
      if (b.on !== false) FA.flash[b.flash] = wall() + HOLD; else delete FA.flash[b.flash]; changed.push('flash:' + b.flash); }
    if (!changed.length) throw bad('send fader values (' + Object.keys(FDEF).join(', ') + '), reset or flash');
    FA.v = v; FA.rev++; return changed;
  }
  const fSpeed = () => fHeld('speed') ? Math.min(4, FA.v.speed * 2) : FA.v.speed;
  const fMaster = () => fHeld('master') ? 0 : FA.v.master >= 100 ? 1 : Math.pow(FA.v.master / 100, 1.6);
  function fadersLook(buf, t, busy) {                               // TRAILS -> COLOR -> WHITE -> STROBE (music show, DJ, Song Show only)
    if (busy) { FA.prev = FA.frozen = null; return; }
    const v = FA.v, n = buf.length;
    if (fHeld('trails')) { if (!FA.frozen) FA.frozen = buf.slice(); else buf.set(FA.frozen); } else FA.frozen = null;
    const w = v.trails / 100;
    if (w > 0) { const p = FA.prev; if (p) { const k = 0.6 + 0.37 * w; for (let i = 0; i < n; i++) buf[i] = Math.max(buf[i], p[i] * k); } FA.prev = buf.slice(); } else FA.prev = null;
    const c = v.color, rb = fHeld('color');
    if (c > 0 || rb) { const tint = rb ? null : hueRGB(colorHue(c));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, l = lum3(buf, i), tn = tint || hueRGB(x / W + y / H * 0.35 + t * 0.6);
        for (let ch = 0; ch < 3; ch++) buf[i + ch] = l * tn[ch] * 0.88 + buf[i + ch] * 0.12; } }
    if (fHeld('white')) buf.fill(255);
    else if (v.white > 0) { const k = v.white / 100; for (let i = 0; i < n; i += 3) { const l = lum3(buf, i); for (let ch = 0; ch < 3; ch++) buf[i + ch] = buf[i + ch] * (1 - k) + l * k; } }
    const sv = fHeld('strobe') ? 60 : v.strobe;
    if (sv > 0) { const d = strobeDiv(sv, curBpm()), on = (beatPos * d) % 1 < 0.34, tn = c > 0 ? hueRGB(colorHue(c)) : [1, 1, 1];
      for (let i = 0; i < n; i += 3) for (let ch = 0; ch < 3; ch++) buf[i + ch] = on ? Math.max(buf[i + ch], tn[ch] * 0.95 * 255) : buf[i + ch] * 0.06; }
  }

  // ----------------------------------------------------------------------- 🚨 override keys + 🎙️ interlude (overrides.py)
  const OV_KEYS = [{id: 'blackout', kind: 'black', label: 'BLACKOUT', mode: 'hold', fade: 0}, {id: 'white', kind: 'white', label: 'WHITE', mode: 'hold', fade: 0},
    {id: 'strobe', kind: 'strobe', label: 'STROBE', mode: 'hold', fade: 0}, {id: 'disco', kind: 'disco', label: 'DISCO', mode: 'hold', fade: 0},
    {id: 'house', kind: 'house', label: 'HOUSE', mode: 'latch', fade: 1, color: '#ffb46b'},
    {id: 'red', kind: 'color', label: 'RED', mode: 'hold', fade: 0, color: '#ff1a1a'}, {id: 'blue', kind: 'color', label: 'BLUE', mode: 'hold', fade: 0, color: '#1a4dff'},
    {id: 'crowd', kind: 'crowd', label: 'CROWD', mode: 'hold', fade: 0.25}];
  const PRIO = ['black', 'white', 'strobe', 'disco', 'logo', 'house', 'color', 'crowd'], FADES = [0, 0.25, 1], IL_LOOKS = ['breathe', 'text', 'glow', 'look'], IL_RET = ['none', 'flash', 'drop'];
  const OV = {keys: OV_KEYS.map(k => Object.assign({}, k)), il: {look: 'breathe', text: 'BE RIGHT BACK', look_name: '', auto: 0, ret: 'flash', fade_in: 2, fade_out: 1.5},
    held: {}, latched: new Set(), lv: {}, ilOn: false, ilAuto: false, ilLv: 0, ilSince: null, retPending: false, quietT: null, loudT: null, rev: 0, ilT: 0};
  const ovOnIds = () => OV.keys.filter(k => OV.latched.has(k.id) || (OV.held[k.id] || 0) > wall()).map(k => k.id);
  function ovInfo() {
    const on = ovOnIds();
    return {pro: PRO, keys: OV.keys.map(k => Object.assign({}, k, {on: on.includes(k.id), latched: OV.latched.has(k.id)})), on, latched: on.filter(i => OV.latched.has(i)),
      active: !!on.length, priority: PRIO, hold: HOLD, fades: FADES, rev: OV.rev,
      interlude: Object.assign({}, OV.il, {on: OV.ilOn, auto_started: OV.ilAuto, since: OV.ilSince, level: Math.round(OV.ilLv * 100) / 100, looks: IL_LOOKS})};
  }
  const normHex = s => { s = String(s || '').trim().replace(/^#/, '').toLowerCase(); if (s.length === 3) s = s.replace(/./g, c => c + c);
    if (!/^[0-9a-f]{6}$/.test(s)) throw bad('color: #rrggbb'); return '#' + s; };
  function ilApply(b) {
    if ('look' in b) { if (!IL_LOOKS.includes(b.look)) throw bad('look: ' + IL_LOOKS.join(', ')); OV.il.look = b.look; }
    if (b.text != null) OV.il.text = String(b.text).toUpperCase().split(/\s+/).filter(Boolean).join(' ').slice(0, 40);
    if ('look_name' in b) OV.il.look_name = String(b.look_name || '').slice(0, 40);
    if ('auto' in b) { const v = Number(b.auto || 0); if (!isFinite(v)) throw bad('auto: seconds of silence (0 = off)'); OV.il.auto = Math.round(clamp(v, 0, 600)); }
    if ('ret' in b) { if (!IL_RET.includes(b.ret)) throw bad('ret: ' + IL_RET.join(', ')); OV.il.ret = b.ret; }
  }
  function ilSet(on, auto) {
    if (on && !OV.ilOn) { OV.ilOn = true; OV.ilAuto = auto; OV.ilSince = wall(); OV.retPending = false; }
    else if (!on && OV.ilOn) { OV.ilOn = false; OV.ilAuto = false; OV.ilSince = null; OV.retPending = OV.il.ret !== 'none'; }
    else if (on && OV.ilOn && !auto) OV.ilAuto = false;
  }
  function ovSet(b) {
    const changed = [], byid = Object.fromEntries(OV.keys.map(k => [k.id, k])), t = wall();
    if (b.release) { OV.held = {}; OV.latched.clear(); changed.push('release'); }
    const kid = 'key' in b ? b.key : b.toggle;
    if (kid != null) {
      const k = byid[kid]; if (!k) throw bad('key: ' + Object.keys(byid).join(', '));
      const on = ('toggle' in b && !('key' in b)) ? !(OV.latched.has(kid) || OV.held[kid] > t) : b.on !== false;
      if (k.mode === 'latch' || b.latch) { if (on) OV.latched.add(kid); else { OV.latched.delete(kid); delete OV.held[kid]; } }
      else if (on) OV.held[kid] = t + HOLD; else { delete OV.held[kid]; OV.latched.delete(kid); }
      changed.push((on ? 'on:' : 'off:') + kid);
    }
    if (b.config && typeof b.config === 'object') Object.entries(b.config).forEach(([id, c]) => {
      const k = byid[id]; if (!k || !c || typeof c !== 'object') throw bad('config: {key id: {mode, fade, color, label}}');
      const was = k.mode;
      if ('mode' in c) { if (!['hold', 'latch'].includes(c.mode)) throw bad('mode: hold or latch'); k.mode = c.mode; }
      if ('fade' in c) { const f = Number(c.fade); if (!isFinite(f)) throw bad('fade: 0, 0.25 or 1'); k.fade = FADES.reduce((a, x) => Math.abs(x - f) < Math.abs(a - f) ? x : a, 0); }
      if (c.color != null && ['color', 'house'].includes(k.kind)) k.color = normHex(c.color);
      if (c.label != null) { const lb = String(c.label).toUpperCase().split(/\s+/).filter(Boolean).join(' ').slice(0, 12); if (lb) k.label = lb; }
      if (was === 'latch' && k.mode === 'hold') OV.latched.delete(id);
      changed.push('config:' + id);
    });
    if (b.interlude_cfg && typeof b.interlude_cfg === 'object') { ilApply(b.interlude_cfg); changed.push('interlude_cfg'); }
    if ('interlude' in b) { const v = b.interlude; let on;
      if (v && typeof v === 'object') { ilApply(v); on = v.on !== false; } else on = v === 'toggle' ? !OV.ilOn : !!v;
      ilSet(on, false); changed.push('interlude:' + (on ? 'on' : 'off')); }
    if (!changed.length) throw bad('send key + on, toggle, release, config, interlude or interlude_cfg');
    OV.rev++; return changed;
  }
  function ovTick(dt) {                                             // auto-interlude (the demo song paused = silence), fades, the return hit
    const t = now(), silent = !M.playing || !S.power;
    if (silent) { OV.loudT = null; if (OV.quietT == null) OV.quietT = t; } else { OV.quietT = null; if (OV.loudT == null) OV.loudT = t; }
    if (OV.il.auto > 0 && !OV.ilOn && OV.quietT != null && t - OV.quietT >= OV.il.auto) { ilSet(true, true); OV.rev++; }
    else if (OV.ilOn && OV.ilAuto && OV.loudT != null && t - OV.loudT >= 0.6) { ilSet(false, true); OV.rev++; }
    const wt = wall(); Object.keys(OV.held).forEach(k => { if (OV.held[k] <= wt) delete OV.held[k]; });
    const on = ovOnIds();
    OV.keys.forEach(k => { const tg = on.includes(k.id) ? 1 : 0; let cur = OV.lv[k.id] || 0; const f = k.fade;
      cur = f <= 0 ? tg : tg > cur ? Math.min(tg, cur + dt / f) : Math.max(tg, cur - dt / f);
      if (cur <= 0) delete OV.lv[k.id]; else OV.lv[k.id] = cur; });
    OV.ilLv = OV.ilOn ? Math.min(1, OV.ilLv + dt / OV.il.fade_in) : Math.max(0, OV.ilLv - dt / OV.il.fade_out);
    if (OV.retPending) { OV.retPending = false; djFire(OV.il.ret); }
  }
  function ilPic(t) {                                               // 🎙️ the calm interlude picture (0-255, before brightness)
    const out = new Float32Array(N * 3), look = OV.il.look;
    if (look === 'glow') { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = (0.22 + 0.05 * Math.sin(t * 0.5 + x / (W - 1) * 2.2) * Math.cos(t * 0.37 + y / (H - 1) * 1.7)) * 255, i = (y * W + x) * 3;
      out[i] = v; out[i + 1] = v * 0.5; out[i + 2] = v * 0.18; } return out; }
    if (look === 'look' && OV.il.look_name && CAT.looks[OV.il.look_name]) {
      const c = clipNow(lookClip(OV.il.look_name));
      if (c) { OV.ilT += 0; const f = Math.floor(t * 0.35 * c.fps) % c.n, base = f * c.w * c.h * 4;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = base + ((y % c.h) * c.w + (x % c.w)) * 4, i = (y * W + x) * 3; out[i] = c.px[j] * 0.6; out[i + 1] = c.px[j + 1] * 0.6; out[i + 2] = c.px[j + 2] * 0.6; }
        return out; }
    }
    const cols = lookCols(S.look), breath = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 7), txt = look === 'text';
    const col = new Float32Array(N * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = palAt(cols, x / (W - 1) * 0.55 + y / (H - 1) * 0.25 + t * 0.025), i = (y * W + x) * 3, k = txt ? 0.06 + 0.04 * breath : 0.14 + 0.36 * breath;
      for (let ch = 0; ch < 3; ch++) { col[i + ch] = c[ch]; out[i + ch] = c[ch] * k; } }
    const msg = (OV.il.text || '').trim();
    if (txt && msg) {
      const m = textMask(msg, H), lift = 0.55 + 0.15 * Math.sin(t * 2 * Math.PI / 7);
      const x0 = m.w > W - 2 ? Math.round(W - (t * 3) % (W + m.w + 6)) : Math.round((W - m.w) / 2 + Math.sin(t * 0.35) * Math.min(2, (W - m.w) / 2));
      stamp(out, m, x0, Math.max(0, ((H - m.h) / 2) | 0), (X, Y) => { const i = (Y * W + X) * 3; return [0, 1, 2].map(ch => clamp(col[i + ch] * 0.6 + 102, 0, 255) * lift); });
    }
    return out;
  }
  function keyPic(k, t, heldCol) {
    const out = new Float32Array(N * 3), kind = k.kind;
    const fill = c => { for (let i = 0; i < N * 3; i += 3) { out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; } };
    if (kind === 'white') fill([255, 255, 255]);
    else if (kind === 'strobe') { if (Math.floor(wall() * 12) % 2 === 0) fill(heldCol ? hexRGB(heldCol.color) : [255, 255, 255]); }
    else if (kind === 'color' || kind === 'house') fill(hexRGB(k.color));
    else if (kind === 'crowd') { const cols = lookCols(S.look);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; let best = [10, 10, 10];
        [0.45, -0.33].forEach((sp, n) => { const c = ((t * sp + n * 0.5) % 1 + 1) % 1, xs = x / W + (y / H - 0.5) * 0.25 * (n ? 1 : -1);
          const d = Math.abs((((xs - c + 0.5) % 1) + 1) % 1 - 0.5), beam = Math.pow(clamp(1 - d / 0.11, 0, 1), 1.5), pc = palAt(cols, c + n * 0.4);
          for (let ch = 0; ch < 3; ch++) best[ch] = Math.max(best[ch], beam * (pc[ch] * 0.5 + 127)); });
        out[i] = best[0]; out[i + 1] = best[1]; out[i + 2] = best[2]; } }
    else if (kind === 'disco') discoPic(out, t - ((OV.onT || {})[k.id] ?? t));
    else if (kind === 'logo') {
      const s = TX.s, L = TX.logo;
      if (L && (['logo', 'both'].includes(s.show) || !String(s.text || '').trim())) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = ((y * L.h / H | 0) * L.w + (x * L.w / W | 0)) * 3, i = (y * W + x) * 3; out[i] = L.rgb[j] || 0; out[i + 1] = L.rgb[j + 1] || 0; out[i + 2] = L.rgb[j + 2] || 0; }
      } else { const msg = String(s.text || 'GLOWBOP').toUpperCase().trim() || 'GLOWBOP', m = textMask(msg, H);
        stamp(out, m, m.w > W - 2 ? Math.round(W - (t * 12) % (W + m.w + 4)) : ((W - m.w) / 2) | 0, Math.max(0, ((H - m.h) / 2) | 0), () => [255, 255, 255]); }
    }
    return out;
  }
  // 🪩 port of overrides.py _disco_pic: the ball drops in with sparkles, a white burst, then spins throwing coloured spots
  const dhsv = h => [0, 4, 2].map(o => clamp(Math.abs(((h * 6 + o) % 6) - 3) - 1, 0, 1));
  function discoPic(out, s) {
    const cx = (W - 1) / 2, R = Math.max(2.5, Math.min(W, H) * 0.31), cyE = H * 0.46, spin = s * 1.6;
    let cy = cyE; if (s < 0.55) { const e = s / 0.55; cy = -R - 1 + (cyE + R + 1) * (1 - Math.pow(1 - e, 3)); } else if (s < 0.85) cy = cyE + Math.sin((s - 0.55) / 0.3 * Math.PI) * R * 0.12;
    const px = (x, y, c) => { const i = (y * W + x) * 3; for (let ch = 0; ch < 3; ch++) out[i + ch] = Math.max(out[i + ch], c[ch] * 255); };
    if (s > 0.5) { const n = Math.max(14, (W * H / 14) | 0), fade = Math.min(1, (s - 0.5) / 0.4);
      for (let k = 0; k < n; k++) { const r1 = ((k * 2654435761) % 1000) / 1000, r2 = ((k * 40503 + 17) % 997) / 997, r3 = ((k * 9973 + 5) % 991) / 991;
        const ang = r1 * 2 * Math.PI + spin * 0.9, rad = R * 1.05 + r2 * (Math.max(W, H) * 0.95 - R * 1.05), sx = cx + Math.cos(ang) * rad, sy = cy + Math.sin(ang) * rad * 0.8;
        const c = dhsv((r3 + s * 0.15) % 1).map(v => v * 0.85 + 0.15), tw = (0.55 + 0.45 * Math.sin(s * 9 + k * 1.7)) * fade;
        for (let y = Math.max(0, sy - 3 | 0); y < Math.min(H, sy + 4); y++) for (let x = Math.max(0, sx - 3 | 0); x < Math.min(W, sx + 4); x++) {
          const g = Math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / 1.5) * tw; if (g > 0.02) px(x, y, c.map(v => v * g)); } } }
    const top = Math.max(0, Math.min(H, Math.floor(cy - R))), xi = Math.round(cx); for (let y = 0; y < top; y++) px(xi, y, [0.35, 0.35, 0.35]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - cx) / R, dy = (y - cy) / R, r2 = dx * dx + dy * dy; if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2), lon = Math.atan2(dx, nz) + spin, lat = Math.asin(clamp(dy, -1, 1));
      const ti = Math.floor(lon / (Math.PI / 6)), tj = Math.floor(lat / (Math.PI / 7)), h = (((ti * 73856093) ^ (tj * 19349663)) >>> 0) & 1023;
      let c; if ((h + Math.floor(s * 14)) % 6 === 0) c = [1, 1, 1];
      else { const base = 0.38 + 0.42 * nz + 0.2 * ((h % 7) / 6), tint = dhsv(((h % 360) / 360 + s * 0.2) % 1); c = tint.map(v => base * (0.6 + 0.4 * v)); }
      if (Math.abs(Math.sin(lon * 6)) < 0.12 || Math.abs(Math.sin(lat * 7)) < 0.12) c = c.map(v => v * 0.45);
      const i = (y * W + x) * 3; for (let ch = 0; ch < 3; ch++) out[i + ch] = c[ch] * 255; }
    if (s < 0.9) { const k = Math.max(6, (W * H / 40) | 0), seed = Math.floor(s * 30) + 3; for (let j = 0; j < k; j++) px(((seed * 31 + j * 97) * 13) % W, ((seed * 17 + j * 53) * 7) % H, [1, 1, 1]); }
    if (s > 0.5 && s < 1.2) { const f = (s - 0.5) / 0.7;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ring = Math.hypot(x - cx, y - cy), v = Math.exp(-((ring - f * Math.max(W, H) * 1.1) ** 2) / 4) * (1 - f) + (s < 0.62 ? (0.62 - s) / 0.12 * 0.9 : 0); if (v > 0.02) px(x, y, [v, v, v].map(q => Math.min(1, q))); } }
  }
  function ovApply(out, t, bri, mm) {                               // 🚨 the very last thing, on every mode (even lights off)
    if (!Object.keys(OV.lv).length) return;
    const order = OV.keys.slice().sort((a, b) => (PRIO.indexOf(b.kind) - PRIO.indexOf(a.kind)) || (OV.keys.indexOf(b) - OV.keys.indexOf(a)));
    const heldCol = OV.keys.find(k => k.kind === 'color' && (OV.lv[k.id] || 0) > 0.5);
    const onT = OV.onT || (OV.onT = {});
    const zm = PD.target && PD.target !== 'all' ? zoneMask(PD.target) : null;    // 🎯 aimed at one zone (Override target)
    order.forEach(k => { const lv = OV.lv[k.id] || 0; if (lv <= 0) { delete onT[k.id]; return; } if (onT[k.id] == null) onT[k.id] = t;
      const pic = keyPic(k, t, heldCol), sc = k.kind === 'black' ? 0 : ['white', 'strobe'].includes(k.kind) ? bri : bri * mm;
      for (let i = 0; i < out.length; i++) { const L = zm ? lv * zm[(i / 3) | 0] : lv; out[i] = out[i] * (1 - L) + pic[i] * sc * L; } });
  }

  // ----------------------------------------------------------------------- 🎬🔁 cues shared by Song Shows and loops: look / effect / colour lock / words / blackout
  function cueStep(layer, act, busy, endsIn) {                      // a new look / effect span starts: switch to it (the DJ can still change it after)
    const seen = layer.seen || (layer.seen = {});
    if (busy) { layer.seen = {}; return; }
    const L = act.look, E = act.effect;
    if (L && L.id !== seen.look && CAT.looks[L.look]) { seen.look = L.id; setLook(L.look, false); S.held = null; S.feature = null; S.locked = null; }
    if (!L) seen.look = null;
    if (E && E.id !== seen.effect) { seen.effect = E.id; const c = effectClip(E.effect) || lookClip(S.look, S.lookK + 1); S.feature = {clip: c, name: E.effect, until: now() + Math.max(1, endsIn(E)), vary: 1}; }
    if (!E) seen.effect = null;
  }
  function cueColor(buf, act) {                                     // colour lock: the show's shapes, painted in 1-3 colours
    const it = act.color; if (!it) return; const cols = (it.colors || []).map(hexRGB); if (!cols.length) return;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, l = lum3(buf, i) / 255, c = cols.length === 1 ? cols[0] : palAt(cols, x / W * (cols.length - 1) / cols.length + now() * 0.04);
      for (let ch = 0; ch < 3; ch++) buf[i + ch] = c[ch] * l * 0.9 + buf[i + ch] * 0.1; }
  }
  function cueText(buf, act, t) {
    const it = act.text; if (!it || !it.text) return;
    const m = textMask(String(it.text).toUpperCase(), H), el = t - (it._t0 || (it._t0 = t)), hh = el / 0.7;
    const col = [0.5 + 0.5 * Math.cos(6.283 * hh), 0.5 + 0.5 * Math.cos(6.283 * (hh - 0.33)), 0.5 + 0.5 * Math.cos(6.283 * (hh - 0.66))].map(v => 120 + 135 * v);
    const x0 = m.w > W ? Math.round(W - ((el * 14) % (W + m.w))) : Math.round((W - m.w) / 2);
    stamp(buf, m, x0, Math.max(0, ((H - m.h) / 2) | 0), () => col, 0.35);
  }

  // ----------------------------------------------------------------------- 🔁 loop banks (loops.py): beat-locked phrases of DJ moves
  const SLOT_IDS = [].concat(...'ABCD'.split('').map(b => [1, 2, 3, 4].map(i => b + i)));
  const LBARS = [1, 2, 4, 8], QUANTS = [0.25, 0.125], HIT_TYPES = ['drop', 'strobe', 'flash', 'fire', 'confetti', 'blackout', 'sweep', 'shockwave', 'colorbomb', 'lightning', 'countdown', 'heartbeat'], SPAN_LANES = ['look', 'color', 'text', 'effect'];
  function cleanEvent(e, Lb) {
    if (!e || typeof e !== 'object') return null;
    const lane = e.lane || 'hit'; if (lane !== 'hit' && !SPAN_LANES.includes(lane)) return null;
    let b = Number(e.b); if (!isFinite(b)) return null; b = Math.round((((b % Lb) + Lb) % Lb) * 1e4) / 1e4; if (b >= Lb) b = 0;
    const ln = Number(e.len), o = {lane, b};
    if (lane === 'hit') { if (!HIT_TYPES.includes(e.hit)) return null; o.hit = e.hit;
      if (e.hit === 'strobe') o.beats = Math.round(clamp(num(e.beats, 4) || 4, 0.125, 32) * 1e4) / 1e4;
      if (e.hit === 'blackout') o.len = Math.round(clamp(isFinite(ln) ? ln : 1, 0.125, Lb) * 1e4) / 1e4; }
    else { o.len = Math.round(clamp(isFinite(ln) ? ln : Lb, 0.125, Lb) * 1e4) / 1e4;
      if (lane === 'look') { o.look = String(e.look || '').slice(0, 40); if (!o.look) return null; }
      if (lane === 'effect') { o.effect = String(e.effect || '').slice(0, 40); if (!o.effect) return null; }
      if (lane === 'text') { o.text = String(e.text || '').trim().slice(0, 40); if (!o.text) return null; }
      if (lane === 'color') { o.colors = (e.colors || []).filter(c => /^#?[0-9a-f]{6}$/i.test(c)).slice(0, 3).map(c => '#' + c.replace('#', '').toLowerCase()); if (!o.colors.length) return null; } }
    if (e.skip1) o.skip1 = true;
    return o;
  }
  function cleanSlot(s) {
    s = s && typeof s === 'object' ? s : {}; let bars = parseInt(s.bars, 10) || 1; if (!LBARS.includes(bars)) bars = LBARS.reduce((a, x) => Math.abs(x - bars) < Math.abs(a - bars) ? x : a, 1);
    const evs = (s.events || []).slice(0, 1024).map(e => cleanEvent(e, bars * 4)).filter(Boolean).sort((a, c) => a.b - c.b || (a.lane < c.lane ? -1 : 1));
    return {name: String(s.name || '').split(/\s+/).filter(Boolean).join(' ').slice(0, 18), bars, events: evs.slice(0, 512)};
  }
  function lpStarters() {
    const h = (b, hit, k) => Object.assign({lane: 'hit', b, hit}, k || {}), r = n => Array.from({length: n}, (_, i) => i), S0 = {};
    S0.A1 = {name: 'Four on the floor', bars: 1, events: r(4).map(b => h(b, 'flash'))};
    S0.A2 = {name: 'Offbeat strobe', bars: 1, events: r(4).map(b => h(b + 0.5, 'strobe', {beats: 0.25}))};
    S0.A3 = {name: 'Build riser', bars: 8, events: [0, 2, 4, 6].map(b => h(b, 'flash')).concat(r(8).map(b => h(8 + b, 'flash')), r(16).map(b => h(16 + b * 0.5, 'flash')),
      r(16).map(b => h(24 + b * 0.25, 'flash')), [h(28, 'strobe', {beats: 3}), h(31, 'blackout', {len: 1}), h(0, 'drop', {skip1: true})])};
    S0.A4 = {name: 'Drop hits', bars: 2, events: [h(0, 'drop'), h(2, 'confetti'), h(4, 'fire'), h(6, 'flash'), h(7, 'flash')]};
    S0.B1 = {name: 'Color chase', bars: 4, events: ['#ff1a4a', '#1a6bff', '#2bff7a', '#ff2fd0'].map((c, i) => ({lane: 'color', b: i * 4, len: 4, colors: [c]})).concat(r(4).map(i => h(i * 4, 'flash')))};
    S0.B2 = {name: 'Flash roll', bars: 1, events: [2, 2.5, 3, 3.25, 3.5, 3.75].map(b => h(b, 'flash'))};
    S0.B3 = {name: 'Blackout chops', bars: 1, events: r(4).map(b => h(b + 0.5, 'blackout', {len: 0.5}))};
    S0.B4 = {name: 'Fire and confetti', bars: 4, events: [h(0, 'fire'), h(8, 'confetti')]};
    Object.keys(S0).forEach(k => { S0[k] = cleanSlot(S0[k]); }); return S0;
  }
  const LP = {slots: {}, settings: {quant: 0.25, stop: 'bar'}, run: {}, rec: null, fired: 0, rev: 0, act: {}, layer: {}};
  SLOT_IDS.forEach(id => { LP.slots[id] = cleanSlot({}); }); Object.assign(LP.slots, lpStarters());
  const barAfter = h => { const H0 = Math.floor(h / 4) * 4; return h - H0 <= 0.2 ? H0 : H0 + 4; };
  const pubEv = e => { const o = {}; Object.keys(e).forEach(k => { if (k[0] !== '_') o[k] = e[k]; }); return o; };
  function lpStart(sid, at) {
    Object.keys(LP.run).forEach(o => { const r = LP.run[o]; if (o !== sid && o[0] === sid[0]) { if (r.state === 'queued' || at <= (r.S == null ? at : r.S)) delete LP.run[o];
      else { r.stop_at = r.state === 'stopping' ? Math.min(r.stop_at, at) : at; r.state = 'stopping'; } } });
    LP.run[sid] = {state: 'playing', at, S: at, p0: at - 1e-6}; LP.rev++;
  }
  function lpFire(sid, r, hi, muted) {
    const lo = r.p0; r.p0 = Math.max(lo, hi); if (hi <= lo || hi - lo > 1.5 || muted) return;
    const s = LP.slots[sid]; if (!s) return; const Lb = s.bars * 4;
    s.events.forEach(e => { if (e.lane !== 'hit' || e.hit === 'blackout') return;
      const k1 = Math.floor((hi - r.S - e.b) / Lb), k0 = Math.floor((lo - r.S - e.b) / Lb);
      if (k1 <= k0 || k1 < 0 || (k1 === 0 && e.skip1) || e._nf === k1) return;
      djFire(e.hit, e.beats, true); LP.fired++; });
  }
  function lpSpans(P) {
    const act = {}, spb = 60 / curBpm();
    Object.keys(LP.run).forEach(sid => { const r = LP.run[sid]; if (!['playing', 'stopping'].includes(r.state) || P < r.S || (r.state === 'stopping' && P >= r.stop_at)) return;
      const s = LP.slots[sid]; if (!s) return; const Lb = s.bars * 4, rel = P - r.S, local = rel % Lb, cyc = Math.floor(rel / Lb);
      s.events.forEach((e, i) => { const blk = e.lane === 'hit' && e.hit === 'blackout'; if (e.lane === 'hit' && !blk) return;
        if (rel < e.b || (cyc === 0 && e.skip1)) return; const d = (((local - e.b) % Lb) + Lb) % Lb; if (d >= e.len) return;
        const t0 = (P - d) * spb, it = Object.assign({}, e, {id: 'L' + sid + '.' + i + (e.lane === 'text' ? '.' + cyc : ''), t: t0, end: t0 + e.len * spb}), L = blk ? 'blackout' : e.lane;
        if (!act[L] || it.t >= act[L].t) act[L] = it; }); });
    return act;
  }
  function lpRecTick(P) {
    const r = LP.rec; if (!r) return; const s = LP.slots[r.id], Lb = s.bars * 4;
    if (r.state === 'armed' && P >= r.at) { r.state = 'recording'; r.S = r.at; r.end = r.at + Lb; s.events = s.events.filter(e => e._early); s.events.forEach(e => { delete e._early; }); lpStart(r.id, r.at); }
    if (['recording', 'overdub'].includes(r.state) && P >= r.end) lpRecDone(true);
  }
  function lpRecDone(keep) {
    const r = LP.rec; LP.rec = null; if (!r) return; const s = LP.slots[r.id], Lb = s.bars * 4;
    if (keep && r.bo) s.events.push({lane: 'hit', hit: 'blackout', b: r.bo[0], len: Math.max(LP.settings.quant, Lb - r.bo[0])});
    if (keep) { s.events.sort((a, c) => a.b - c.b); s.events.length = Math.min(s.events.length, 512);
      if (r.n) setTimeout(() => toast('🔁 ' + r.id + ' recorded ' + r.n + ' move' + (r.n === 1 ? '' : 's') + ': it loops now'), 50); }
    else { s.events = r.backup; if (r.mode === 'fresh') { s.name = r.old_name; delete LP.run[r.id]; } }
    LP.rev++;
  }
  function lpTick() {
    const P = clock(), muted = OV.ilOn;
    lpRecTick(P);
    Object.keys(LP.run).forEach(sid => { const r = LP.run[sid]; if (r.state === 'queued' && P >= r.at) Object.keys(LP.run).forEach(o => { const x = LP.run[o];
      if (o !== sid && o[0] === sid[0] && ['playing', 'stopping'].includes(x.state)) { x.stop_at = x.state === 'stopping' ? Math.min(x.stop_at, r.at) : r.at; x.state = 'stopping'; } }); });
    Object.keys(LP.run).forEach(sid => { const r = LP.run[sid]; if (!['playing', 'stopping'].includes(r.state)) return;
      lpFire(sid, r, r.state === 'stopping' ? Math.min(P, r.stop_at - 1e-6) : P, muted);
      if (r.state === 'stopping' && P >= r.stop_at) { delete LP.run[sid]; LP.rev++; } });
    Object.keys(LP.run).forEach(sid => { const r = LP.run[sid]; if (r.state === 'queued' && P >= r.at) { lpStart(sid, r.at); lpFire(sid, LP.run[sid], P, muted); } });
    LP.act = muted ? {} : lpSpans(P);
  }
  function lpObserve(kind, b) {                                     // 🔴 recording: DJ pads (and look / effect picks) land in the loop, on the grid
    const r = LP.rec; if (!r || !b) return; const s = LP.slots[r.id], Lb = s.bars * 4, step = LP.settings.quant, P = clock();
    const S0 = r.state === 'armed' ? r.at : r.S, rel = P - S0; if (rel < -0.5) return;
    let q = Math.max(0, b.snap ? Math.ceil(rel - 0.05) : Math.round(rel / step) * step), cyc = Math.floor(q / Lb), bq = Math.round((q - cyc * Lb) * 1e4) / 1e4;
    if (bq >= Lb) { bq = 0; cyc++; }
    const T = S0 + cyc * Lb + bq, nf = T > P - 1e-6 ? cyc : null, add = [];
    if (kind === 'dj') { const h = b.hit;
      if (h === 'blackout') { if (b.on !== false) r.bo = [bq, cyc]; else if (r.bo) { const [b0, c0] = r.bo; r.bo = null; add.push({lane: 'hit', hit: 'blackout', b: b0, len: Math.max(step, Math.min(Lb, (cyc * Lb + bq) - (c0 * Lb + b0)))}); } }
      else if (HIT_TYPES.includes(h)) add.push(h === 'strobe' ? {lane: 'hit', hit: h, b: bq, beats: num(b.beats, 4) || 4} : {lane: 'hit', hit: h, b: bq});
      if (b.build === false && !b.cancel) add.push({lane: 'hit', hit: 'drop', b: bq});
      if (b.say) add.push({lane: 'text', b: bq, len: Math.min(Lb, 3 * curBpm() / 60), text: String(b.say).slice(0, 40)}); }
    else if (kind === 'control') { if (b.look) add.push({lane: 'look', b: bq, len: Lb - bq, look: b.look}); if (b.feature) add.push({lane: 'effect', b: bq, len: Lb - bq, effect: b.feature}); }
    add.forEach(e => { const c = cleanEvent(e, Lb); if (!c) return;
      if (c.lane === 'hit' && c.hit !== 'blackout' && s.events.some(o => o.lane === 'hit' && o.hit === c.hit && Math.abs(o.b - c.b) < 1e-6)) return;
      if (c.lane === 'hit' && c.hit !== 'blackout' && nf != null) c._nf = nf;
      if (r.state === 'armed') c._early = true;
      if (['look', 'effect'].includes(c.lane)) s.events.forEach(o => { if (o.lane === c.lane && o.b < c.b && c.b < o.b + o.len) o.len = Math.round((c.b - o.b) * 1e4) / 1e4; });
      s.events.push(c); r.n++; });
    s.events.sort((a, c) => a.b - c.b); LP.rev++;
  }
  function loopsSet(b) {
    const changed = [], heard = clock();
    const slot = k => { const sid = b[k]; if (!LP.slots[sid]) throw bad(k + ': a slot id, A1 to D4'); return sid; };
    if (b.stop_all) { LP.run = {}; if (LP.rec) lpRecDone(LP.rec.state !== 'armed'); changed.push('stop_all'); }
    ['toggle', 'launch', 'stop'].forEach(k => { if (!(k in b)) return;
      const sid = slot(k), r = LP.run[sid], at_once = !!b.now || LP.settings.stop === 'now';
      if (k !== 'launch' && LP.rec && LP.rec.id === sid && LP.rec.state === 'armed') { lpRecDone(false); changed.push('record:cancel'); return; }
      const go = k === 'launch' || (k === 'toggle' && (!r || r.state === 'stopping'));
      if (go) {
        if (r && r.state === 'stopping') { r.state = 'playing'; delete r.stop_at; changed.push('keep:' + sid); }
        else if (r) changed.push('already:' + sid);
        else { if (!LP.slots[sid].events.length) throw bad(sid + ' is empty: record into it first');
          Object.keys(LP.run).forEach(o => { if (o[0] === sid[0] && LP.run[o].state === 'queued') delete LP.run[o]; });
          LP.run[sid] = {state: 'queued', at: barAfter(heard)}; changed.push('launch:' + sid); }
      } else if (!r) changed.push('idle:' + sid);
      else if (r.state === 'queued' || at_once) { delete LP.run[sid]; changed.push('stop:' + sid); if (LP.rec && LP.rec.id === sid) lpRecDone(LP.rec.state !== 'armed'); }
      else { r.state = 'stopping'; r.stop_at = Math.max(barAfter(heard), r.S + 1e-3); changed.push('stopping:' + sid); }
    });
    if ('record' in b) { const v = b.record;
      if (v === false || v == null) { if (LP.rec) { lpRecDone(false); changed.push('record:cancel'); } }
      else { if (!LP.slots[v]) throw bad('record: a slot id, A1 to D4'); if (LP.rec) throw bad('already recording ' + LP.rec.id);
        const s = LP.slots[v];
        if ('bars' in b) { const bars = parseInt(b.bars, 10); if (!LBARS.includes(bars)) throw bad('bars: 1, 2, 4 or 8'); if (bars !== s.bars) { s.bars = bars; s.events = s.events.filter(e => e.b < bars * 4); } }
        const r = LP.run[v], backup = s.events.map(e => Object.assign({}, e));
        if (r && ['playing', 'stopping'].includes(r.state)) { r.state = 'playing'; delete r.stop_at; LP.rec = {id: v, state: 'overdub', mode: 'overdub', at: heard, S: r.S, end: heard + s.bars * 4, n: 0, backup, bo: null}; }
        else { delete LP.run[v]; LP.rec = {id: v, state: 'armed', mode: 'fresh', at: barAfter(heard), n: 0, backup, bo: null, old_name: s.name}; if (!s.name) s.name = 'Take ' + v; }
        changed.push('record:' + v); } }
    if ('save' in b) { const sid = slot('save'), c = cleanSlot(b.slot); if (LP.rec && LP.rec.id === sid) throw bad(sid + ' is recording');
      LP.slots[sid] = c; changed.push('save:' + sid); if (!c.events.length) delete LP.run[sid]; }
    if ('clear' in b) { const sid = slot('clear'); if (LP.rec && LP.rec.id === sid) LP.rec = null; LP.slots[sid] = cleanSlot({}); delete LP.run[sid]; changed.push('clear:' + sid); }
    if ('copy' in b) { const src = slot('copy'), dst = slot('to'); if (src === dst) throw bad('copy: pick another slot');
      const c = cleanSlot(Object.assign({}, LP.slots[src], {events: LP.slots[src].events.map(pubEv)})); c.name = (c.name || src).slice(0, 14) + ' (2)';
      LP.slots[dst] = c; delete LP.run[dst]; changed.push('copy:' + src + '>' + dst); }
    if (b.settings && typeof b.settings === 'object') { const st = b.settings;
      if ('quant' in st) { if (!QUANTS.includes(Number(st.quant))) throw bad('quant: 0.25 or 0.125 (a 1/4 or 1/8 beat)'); LP.settings.quant = Number(st.quant); }
      if ('stop' in st) { if (!['bar', 'now'].includes(st.stop)) throw bad('stop: bar or now'); LP.settings.stop = st.stop; }
      changed.push('settings'); }
    if (b.restore) { Object.entries(lpStarters()).forEach(([sid, s]) => { if (LP.rec && LP.rec.id === sid) return; LP.slots[sid] = s; delete LP.run[sid]; }); changed.push('restore'); }
    if (!changed.length) throw bad('send toggle, launch, stop, stop_all, record, save, clear, copy, settings or restore');
    LP.rev++; return changed;
  }
  function loopsInfo(full) {
    const P = clock(), rr = LP.rec, st = sid => (LP.run[sid] || {}).state;
    return {pro: PRO, ok: !OV.ilOn, why: OV.ilOn ? 'paused for the interlude' : '', bpm: Math.round(curBpm() * 100) / 100, pos: Math.round(P * 1e4) / 1e4,
      bar: Math.floor(P / 4) + 1, beat: Math.floor(P % 4) + 1, src: DJ.tap_bpm ? 'tap' : M.playing ? 'music' : 'free', live: !!M.playing || !!DJ.tap_bpm, delay_beats: 0,
      settings: Object.assign({}, LP.settings), running: SLOT_IDS.filter(s => ['playing', 'stopping'].includes(st(s))), queued: SLOT_IDS.filter(s => st(s) === 'queued'),
      slots: SLOT_IDS.map(sid => { const s = LP.slots[sid], r = LP.run[sid] || {};
        const d = {id: sid, bank: sid[0], name: s.name, bars: s.bars, count: s.events.length, state: r.state || 'idle', S: r.S == null ? null : r.S, at: r.at == null ? null : r.at, stop_at: r.stop_at == null ? null : r.stop_at};
        if (full) d.events = s.events.map(pubEv); return d; }),
      rec: rr ? {id: rr.id, state: rr.state, mode: rr.mode, at: rr.at, S: rr.S == null ? null : rr.S, end: rr.end == null ? null : rr.end, n: rr.n} : null,
      banks: ['A', 'B', 'C', 'D'], per_bank: 4, bars: LBARS, quants: QUANTS, hits: HIT_TYPES, fired: LP.fired, rev: LP.rev};
  }
  function loopsBrief() { const run = SLOT_IDS.filter(s => LP.run[s]);
    return {pro: PRO, running: run, names: run.map(s => LP.slots[s].name || s), rec: LP.rec ? {id: LP.rec.id, state: LP.rec.state} : null, paused: OV.ilOn && !!run.length, rev: LP.rev}; }

  // ----------------------------------------------------------------------- 🎬 Song Shows (songshow.py): a timeline per song, driving the wall while it plays
  const SH = {on: true, rec: false, shows: {}, rev: {}, skip: null, key: null, prev: null, fired: new Set(), act: {}, due: [], mult: 1, ok: false, why: 'starting', layer: {}, known: {}};
  const songKey = tr => (String(tr.artist || '') + ' | ' + String(tr.title || '')).toLowerCase().replace(/\s+/g, ' ').trim();
  const KEYS = ['A minor', 'F# minor', 'C major', 'E minor', 'D minor', 'G major', 'B minor', 'A major'];
  function knowSong(tr) { if (!tr || !tr.title) return; const k = songKey(tr); if (!SH.known[k]) SH.known[k] = {key: k, tr, listens: 2 + (Object.keys(SH.known).length * 3) % 9, last: wall() - Object.keys(SH.known).length * 3600}; return k; }
  const songBpm = tr => (tr && tr.bpm) || 124;
  function songSections(dur, bpm) {                                 // the demo songs' shape: 8-bar groove / build / drop / break, like the wall's own sections
    const sec = 8 * 4 * 60 / bpm, out = [], names = ['groove', 'build', 'peak', 'breakdown'];
    for (let k = 0; k * sec < dur; k++) out.push([Math.round(k * sec * 100) / 100, names[k % 4]]);
    return out;
  }
  function songFacts(key) {
    const kn = SH.known[key] || {}, tr = kn.tr || {}, show = SH.shows[key] || {}, [a0, t0] = key.split(' | ');
    const bpm = songBpm(tr), dur = tr.dur || null, sections = dur ? songSections(dur, bpm) : [];
    const drops = sections.filter(s => s[1] === 'peak' && s[0] > 0 && s[0] < dur - 16 * 60 / bpm).map(s => [s[0], 3, 3]);
    const i = Math.abs(key.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
    return {key, title: tr.title || show.title || (t0 || key).replace(/\b\w/g, c => c.toUpperCase()), artist: tr.artist || show.artist || (a0 || '').replace(/\b\w/g, c => c.toUpperCase()),
      bpm, bpm_src: 'memory', grid: 0, dur, drops, sections, key_name: KEYS[i % KEYS.length], mood: ['bright', 'dark', 'bright', 'neutral'][i % 4], epic: tr.look === 'Big Wave' || tr.look === 'Deep Space' ? 0.7 : 0.3,
      genres: ['dance', 'electronic'], style: 'dance', listens: kn.listens || 0};
  }
  function hsv(h, s, v) { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), u = v * (1 - (1 - f) * s);
    return [[v, u, p], [q, v, p], [p, v, u], [p, q, v], [u, p, v], [v, p, q]][i % 6]; }
  const rgbHex = c => '#' + c.map(v => HEX[clamp(Math.round(v * 255), 0, 255)]).join('');
  function keyColors(key, mood) {
    const PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], m = /^\s*([A-G][#b]?)/.exec(key || ''), root = m ? PC.indexOf(m[1]) : -1, minor = /min|\bm\b/.test(key || '');
    const h = root >= 0 ? ((root * 7) % 12) / 12 : {dark: 0.7, bright: 0.08}[mood] || 0.52, s2 = minor ? 0.06 : -0.07;
    return [hsv(h, 1, 1), hsv(h + s2 * 2, 0.9, minor ? 0.8 : 1), hsv(h - s2, 0.35, 1)].map(rgbHex);
  }
  const LOOK_SETS = {dark: [['Deep Space', 'Midnight Galaxy', 'Deep Sea', 'Hypnotic', 'Storm & Sea'], ['Hyperspace', 'Neon Grid', 'Digital Matrix', 'Ice Palace'], ['Warehouse Rave', 'Club Rig', 'Red Alert', 'Toxic Rave', 'Molten']],
    bright: [['Liquid Dreams', 'Blue Sky', 'Lava Lounge', 'Fairy Forest', 'Emerald Ocean'], ['Synthwave', 'Royal Gold', 'Psychedelic'], ['Mainstage', 'Neon Party', 'Studio 54', 'Rainbow Riot', 'Retro Arcade']],
    neutral: [['Liquid Dreams', 'Deep Space', 'Lava Lounge', 'Midnight Galaxy', 'Hypnotic'], ['Hyperspace', 'Synthwave', 'Neon Grid'], ['Mainstage', 'Club Rig', 'Neon Party', 'Warehouse Rave', '3D Depth']],
    epic: [['Midnight Galaxy', 'Blue Sky', 'Deep Space', 'Liquid Dreams'], ['Hyperspace', 'Storm & Sea'], ['Big Wave', 'Hyperspace', 'Storm & Sea', 'Deep Space']]};
  const SH_LINES = {dark: ["LET'S GO", 'JUMP', 'MAKE SOME NOISE'], bright: ['HANDS UP', 'JUMP', 'SING IT'], neutral: ['HANDS UP', "LET'S GO", 'ONE MORE'], epic: ['SING IT', 'HANDS UP']};
  function draftShow(song, variant) {
    const SHOWY = EMBED_SHOWY || !CHILL_TITLES.includes(song.title);   // chill songs keep their calm, matching shows in the full demo                               // auto-draft (songshow.draft): looks per section, hits on the drops, a brightness curve, a crowd line
    const bpm = song.bpm || 120, P = 60 / bpm, BAR = 4 * P, g = (song.grid || 0) % BAR, r3 = x => Math.round(x * 1000) / 1000;
    const bar = t => r3(g + Math.round((t - g) / BAR) * BAR), beat = t => r3(g + Math.round((t - g) / P) * P);
    let dur = song.dur || 0, drops = [];
    (song.drops || []).forEach(d => { const tb = bar(d[0]); if (!drops.some(x => Math.abs(tb - x) < 4 * BAR)) drops.push(tb); });
    const basis = drops.length ? 'memory' : 'guess';
    if (dur <= 0) dur = drops.length ? drops[drops.length - 1] + 40 * BAR : 64 * BAR + 120;
    if (!drops.length) { for (let t = g + 40 * BAR; t < dur - 24 * BAR; t += 40 * BAR) drops.push(bar(t)); if (!drops.length && dur > 24 * BAR) drops.push(bar(dur * 0.4)); }
    if (SHOWY) { drops = []; for (let t = g + 8 * BAR; t < dur - 8 * BAR; t += 24 * BAR) drops.push(bar(t)); }   // ✨ home page: the first drop comes fast, then one every 24 bars
    drops = drops.filter(d => d >= 2 * BAR && d < dur - 2 * BAR).sort((a, b) => a - b);
    const mood = ['dark', 'bright'].includes(song.mood) ? song.mood : 'neutral', epic = (song.epic || 0) > 0.55, ls = LOOK_SETS[epic ? 'epic' : mood];
    const rot = xs => { xs = xs.filter(x => CAT.looks[x]); const o = variant % xs.length; return xs.slice(o).concat(xs.slice(0, o)); };
    const calm = SHOWY ? rot(['3D Object', 'Hyperspace', '3D Depth', 'Hypnotic']) : rot(ls[0]), build_l = rot(SHOWY ? ['3D Depth', 'Hyperspace', 'Chaos', '3D Object'] : ls[1]), drop_l = rot(SHOWY ? ['Psychedelic', 'Rainbow Riot', 'Warehouse Rave', '3D Object', 'Wild Elements', 'Neon Party'] : ls[2]);
    const efx = xs => xs.filter(x => CAT.effects[x]), bfx = efx(SHOWY ? ['ShapeTunnel', 'CubeField', 'WarpSpeed', 'Tesseract'] : ['WarpSpeed', 'TunnelRush', 'Hyperjump', 'ShapeTunnel']), cfx = efx(SHOWY ? SHOWY_FX : ['Aurora', 'LavaFlow', 'OceanWaves', 'InkBloom', 'LiquidMelt', 'Bioluminescence', 'SkyClouds']);
    const segs = []; let prev = 0;
    drops.forEach((D, i) => { const gap = D - prev, blen = gap >= 16 * BAR ? 8 * BAR : Math.max(2 * BAR, gap > 4 * BAR ? bar(gap / 2) : BAR), B = Math.max(prev, D - blen);
      if (B - prev >= 2 * BAR) segs.push([i === 0 ? 'intro' : 'breakdown', prev, B]); else if (segs.length && B > prev) segs[segs.length - 1][2] = B;
      if (D > B) segs.push(['build', B, D]);
      const nxt = i + 1 < drops.length ? drops[i + 1] : dur; let dl;
      if (i + 1 < drops.length) { dl = Math.max(4 * BAR, Math.min(32 * BAR, Math.round((nxt - D - 8 * BAR) * 0.55 / (4 * BAR)) * 4 * BAR)); dl = Math.min(dl, Math.max(BAR, nxt - D - 2 * BAR)); }
      else { dl = Math.max(4 * BAR, Math.min(32 * BAR, (dur - D) - 8 * BAR)); dl = Math.min(dl, dur - D); }
      segs.push(['drop', D, Math.min(nxt, D + dl < dur ? bar(D + dl) : dur)]); prev = segs[segs.length - 1][2]; });
    if (dur - prev > BAR) segs.push([drops.length ? 'outro' : 'intro', prev, dur]); else if (segs.length) segs[segs.length - 1][2] = dur;
    const big = drops.length > 1 ? drops[1] : drops[0], items = [], bp = [[0, SHOWY ? 85 : 40]]; let n = 0, dk = 0, bk = 0;
    const add = o => { n++; o.id = 'a' + variant + 'x' + n; o.auto = true; ['t', 'end'].forEach(k => { if (k in o) o[k] = r3(o[k]); }); items.push(o); };
    const pickLine = (xs, k) => xs[(variant + k) % xs.length];
    segs.forEach(([kind, s, e]) => {
      const lookn = kind === 'build' ? build_l[dk % build_l.length] : kind === 'drop' ? drop_l[dk % drop_l.length] : kind === 'breakdown' ? calm[(1 + bk) % calm.length] : calm[0];
      const last = items[items.length - 1];
      if (last && last.lane === 'look' && last.look === lookn && Math.abs(last.end - s) < 0.01) last.end = r3(e); else add({lane: 'look', t: s, end: e, look: lookn});
      if (kind === 'intro') bp.push([s, SHOWY ? 85 : 40], [Math.max(s, e - P), SHOWY ? 95 : 72]);
      else if (kind === 'build') { bp.push([s, 60], [Math.max(s, e - P), 100]); if (bfx.length) add({lane: 'effect', t: s, end: e, effect: bfx[(dk + variant) % bfx.length]}); }
      else if (kind === 'drop') { const D = s, isbig = D === big, burst = mood === 'dark' ? 'fire' : 'confetti';
        bp.push([s, 100], [Math.max(s, e - P / 2), 100]); add({lane: 'hit', t: D, hit: 'drop'});
        if (epic) add({lane: 'hit', t: beat(D - 2 * P), hit: 'flash'});
        else if (isbig && D - BAR >= 0) { add({lane: 'hit', t: D - BAR, hit: 'strobe', beats: 3}); add({lane: 'hit', t: D - P, end: D, hit: 'blackout'}); }
        else if (D - BAR >= 0) add({lane: 'hit', t: D - BAR, hit: 'strobe', beats: 4});
        if (isbig) { if (!epic) add({lane: 'hit', t: D, hit: burst}); }   // (Oct 17, Graham: no words on the demo wall, they're hard to read on the dots)
        for (let k = 8; D + k * BAR < e - 2 * BAR; k += 8) add({lane: 'hit', t: D + k * BAR, hit: k === 8 && !isbig && !epic ? burst : 'flash'});
        dk++; }
      else if (kind === 'breakdown') { const lo = SHOWY ? 90 : 65; bp.push([s, 100], [s + 2 * P, lo], [Math.max(s + 2 * P, e - P), lo]);
        add({lane: 'color', t: s, end: e, colors: keyColors(song.key_name, mood).slice(0, 2 + (variant % 2))});
        if (cfx.length) add({lane: 'effect', t: s, end: Math.min(e, s + 8 * BAR), effect: cfx[(bk + variant) % cfx.length]}); bk++; }
      else if (kind === 'outro') bp.push([s, 100], [dur, 18]);
    });
    const pts = [];
    bp.sort((a, b) => a[0] - b[0]).forEach(([t, v]) => { t = r3(clamp(t, 0, dur)); if (pts.length && Math.abs(pts[pts.length - 1][0] - t) < 0.02) pts[pts.length - 1] = [t, v]; else pts.push([t, v]); });
    pts.filter((p, i) => i === 0 || i === pts.length - 1 || !(pts[i - 1][1] === p[1] && p[1] === pts[i + 1][1])).forEach(([t, v]) => add({lane: 'bright', t, v}));
    return {items, meta: {basis, bpm: Math.round(bpm * 100) / 100, grid: g, dur: Math.round(dur * 100) / 100, drops, variant, segments: segs.map(([k, s, e]) => [k, Math.round(s * 100) / 100, Math.round(e * 100) / 100])}};
  }
  const SH_LANES = ['look', 'hit', 'color', 'bright', 'text', 'effect'];
  function cleanItem(it) {
    if (!it || !SH_LANES.includes(it.lane)) return null; const t = Number(it.t); if (!isFinite(t)) return null;
    const o = {id: String(it.id || Math.random().toString(36).slice(2, 10)).slice(0, 16), lane: it.lane, t: Math.round(Math.max(0, t) * 1000) / 1000}, L = it.lane;
    if (it.rec) o.rec = true; if (it.auto) o.auto = true;
    let end = it.end == null ? null : Number(it.end); if (!isFinite(end)) end = null;
    if (SPAN_LANES.includes(L) || (L === 'hit' && it.hit === 'blackout')) { if (end == null || end <= o.t + 0.05) end = o.t + (L === 'hit' ? 1 : 8); o.end = Math.round(end * 1000) / 1000; }
    if (L === 'look') { o.look = String(it.look || '').slice(0, 40); if (!o.look) return null; }
    else if (L === 'hit') { if (!HIT_TYPES.includes(it.hit)) return null; o.hit = it.hit; if (it.hit === 'strobe') o.beats = clamp(parseInt(it.beats, 10) || 4, 1, 32); }
    else if (L === 'color') { o.colors = (it.colors || []).filter(c => /^#?[0-9a-f]{6}$/i.test(c)).slice(0, 3).map(c => '#' + c.replace('#', '').toLowerCase()); if (!o.colors.length) return null; }
    else if (L === 'bright') o.v = clamp(Math.round(num(it.v, 100)), 0, 100);
    else if (L === 'text') { o.text = String(it.text || '').trim().slice(0, 40); if (!o.text) return null; }
    else if (L === 'effect') { o.effect = String(it.effect || '').slice(0, 40); if (!o.effect) return null; }
    return o;
  }
  function cleanShow(key, b, old) {
    old = old || {}; const src = Array.isArray(b.items) ? b.items : (old.items || []);
    const items = src.map(cleanItem).filter(Boolean).sort((a, c) => SH_LANES.indexOf(a.lane) - SH_LANES.indexOf(c.lane) || a.t - c.t).slice(0, 2000);
    const dr = 'draft' in b ? b.draft : old.draft;
    return {version: 1, key, title: String(b.title || old.title || '').slice(0, 120), artist: String(b.artist || old.artist || '').slice(0, 120),
      enabled: 'enabled' in b ? !!b.enabled : old.enabled !== false, items, updated: Math.round(wall() * 10) / 10, draft: dr && typeof dr === 'object' ? dr : null};
  }
  const shSave = (key, show) => { SH.shows[key] = show; SH.rev[key] = (SH.rev[key] || 0) + 1; return SH.rev[key]; };
  function songPos() { return M.pos + (M.playing ? Math.min(0.5, now() - (M.posAt || now())) : 0); }
  function shTick(busy) {
    const cur = M.queue[M.idx], key = cur ? knowSong(cur) : null, pos = cur ? songPos() : null, t = now();
    if (key !== SH.key) { SH.key = key; SH.fired = new Set(); SH.prev = null; SH.act = {}; SH.layer = {}; if (SH.skip !== key) SH.skip = null; }
    const show = SH.shows[key], items = (show && show.items) || [];
    let why = null;
    if (OV.ilOn) why = 'paused for the interlude'; else if (!SH.on) why = 'Song Shows are off'; else if (!key) why = 'nothing playing';
    else if (!show || !items.length) why = 'no show for this song yet'; else if (show.enabled === false) why = "this song's show is switched off";
    else if (SH.skip === key) why = 'skipped for this play'; else if (!M.playing) why = 'paused';
    SH.why = why || ''; SH.ok = !why; SH.mult = 1; SH.due = [];
    if (!SH.ok) { SH.act = {}; SH.prev = pos; return; }
    const prev = SH.prev; SH.prev = pos;
    const seek = prev == null || pos < prev - 0.05 || pos - prev > 0.75;
    if (seek) SH.fired = new Set(items.filter(i => i.lane === 'hit' && i.t < pos - 0.3).map(i => i.id));
    const act = {}, bright = [];
    items.forEach(it => { const L = it.lane;
      if (L === 'bright') { bright.push(it); return; }
      if (L === 'hit') { if (it.hit === 'blackout' && it.end != null) { if (it.t <= pos && pos < it.end) act.blackout = it; return; }
        if (SH.fired.has(it.id)) return; if (it.t <= pos && (pos - it.t <= 0.3 || (!seek && it.t > prev))) { SH.fired.add(it.id); SH.due.push(it); } return; }
      if (it.t <= pos && pos < (it.end || it.t) && (!act[L] || it.t >= act[L].t)) act[L] = it; });
    if (bright.length) { bright.sort((a, b) => a.t - b.t);
      if (pos < bright[0].t) SH.mult = 1; else if (pos >= bright[bright.length - 1].t) SH.mult = bright[bright.length - 1].v / 100;
      else for (let i = 0; i + 1 < bright.length; i++) { const a = bright[i], b = bright[i + 1]; if (a.t <= pos && pos < b.t) { SH.mult = (a.v + (b.v - a.v) * (pos - a.t) / Math.max(1e-6, b.t - a.t)) / 100; break; } } }
    SH.act = act;
    if (!busy) SH.due.forEach(h => djFire(h.hit, h.beats, true));
    cueStep(SH.layer, act, busy, it => it.end - pos);
  }
  function shInfo() {
    const cur = M.queue[M.idx], key = SH.key, show = SH.shows[key] || {}, pos = cur ? songPos() : null; let next = null;
    if (SH.ok && pos != null) { const up = (show.items || []).filter(i => i.lane !== 'bright' && i.t > pos);
      if (up.length) { const n = up.reduce((a, b) => b.t < a.t ? b : a); next = {t: n.t, lane: n.lane, what: n.hit || n.look || n.effect || n.text || ''}; } }
    return {on: SH.on, rec: SH.rec, key, title: cur ? cur.title : null, artist: cur ? cur.artist : null, pos: pos == null ? null : Math.round(pos * 100) / 100, src: cur ? 'player' : 'none', exact: !!cur,
      playing: !!(cur && M.playing), dur: cur ? cur.dur : null, has: !!(show.items && show.items.length), enabled: SH.shows[key] ? show.enabled !== false : false, active: SH.ok, why: SH.why,
      items: (show.items || []).length, rev: SH.rev[key] || 0, next, look: (SH.act.look || {}).look || null, bright: SH.ok ? Math.round(SH.mult * 100) : null, pro: PRO};
  }
  function shList() {
    const out = {};
    Object.values(SH.known).forEach(k => { const f = k.tr; out[k.key] = {key: k.key, title: f.title, artist: f.artist, listens: k.listens, last: k.last, bpm: songBpm(f), drops: songFacts(k.key).drops.length, has: false, items: 0, enabled: false, dur: f.dur}; });
    Object.entries(SH.shows).forEach(([k, s]) => { const r = out[k] || (out[k] = {key: k, title: s.title, artist: s.artist, listens: 0, last: 0, bpm: null, drops: 0, dur: null});
      Object.assign(r, {has: !!s.items.length, items: s.items.length, enabled: s.enabled !== false, updated: s.updated}); });
    return Object.values(out).sort((a, b) => (!a.has - !b.has) || (b.last - a.last));
  }
  function shObserve(kind, b) {                                     // 🔴 record mode: DJ moves land on the playing song's timeline
    if (!SH.rec || !b) return; const cur = M.queue[M.idx]; if (!cur || !M.playing) return;
    const key = knowSong(cur), P = 60 / songBpm(cur), pos = Math.round(songPos() / P) * P, add = [];
    if (kind === 'dj') { const h = b.hit;
      if (h === 'blackout') { if (b.on !== false) SH.boStart = pos; else if (SH.boStart != null) { add.push({lane: 'hit', hit: 'blackout', t: SH.boStart, end: Math.max(pos, SH.boStart + P)}); SH.boStart = null; } }
      else if (HIT_TYPES.includes(h)) add.push({lane: 'hit', hit: h, t: pos, beats: parseInt(b.beats, 10) || 4});
      if (b.build === false && !b.cancel) add.push({lane: 'hit', hit: 'drop', t: pos});
      if (b.say) add.push({lane: 'text', t: pos, end: pos + 3, text: String(b.say).slice(0, 40)}); }
    else if (kind === 'control') { if (b.look) add.push({lane: 'look', t: pos, end: pos + 32 * P, look: b.look}); if (b.feature) add.push({lane: 'effect', t: pos, end: pos + 32 * P, effect: b.feature}); }
    if (!add.length) return;
    const show = SH.shows[key] || {items: [], enabled: true, title: cur.title, artist: cur.artist}, items = (show.items || []).slice();
    add.forEach(it => { it.rec = true; it.id = 'r' + Math.random().toString(36).slice(2, 9);
      if (['look', 'effect'].includes(it.lane)) { items.forEach(o => { if (o.lane === it.lane && o.t < it.t && it.t < (o.end || 0)) o.end = it.t; });
        const nx = items.filter(o => o.lane === it.lane && o.t > it.t).map(o => o.t); if (nx.length) it.end = Math.min(it.end, Math.min(...nx)); }
      items.push(it); SH.fired.add(it.id); });
    shSave(key, cleanShow(key, Object.assign({}, show, {items}), show));
  }
  function showsPost(b) {
    const act = b.action, key = b.key || SH.key;
    if (act === 'global') { SH.on = !!b.on; return {json: {ok: true, on: SH.on}}; }
    if (act === 'record') { SH.rec = !!b.on; return {json: {ok: true, rec: SH.rec}}; }
    if (act === 'skip') { SH.skip = SH.key; return {json: {ok: true}}; }
    if (act === 'unskip') { SH.skip = null; return {json: {ok: true}}; }
    if (!key) return {status: 400, json: {error: 'which song? (key)'}};
    const old = SH.shows[key] || null;
    if (act === 'save') { const show = cleanShow(key, b, old); return {json: {ok: true, rev: shSave(key, show), items: show.items.length}}; }
    if (act === 'delete') { delete SH.shows[key]; SH.rev[key] = (SH.rev[key] || 0) + 1; return {json: {ok: true, rev: SH.rev[key]}}; }
    if (act === 'enable') { if (!old) return {status: 404, json: {error: 'no show for that song yet'}};
      const show = cleanShow(key, Object.assign({}, old, {enabled: !!b.on}), old); if (b.on && SH.skip === key) SH.skip = null;
      return {json: {ok: true, rev: shSave(key, show), enabled: show.enabled}}; }
    if (act === 'autodraft') { const f = songFacts(key), variant = parseInt(b.variant != null ? b.variant : old ? ((old.draft || {}).variant == null ? -1 : old.draft.variant) + 1 : 0, 10) || 0;
      let {items, meta} = draftShow(f, variant);
      if (b.replace === false && old) items = old.items.filter(i => !i.auto).concat(items);
      const show = cleanShow(key, {items, enabled: true, title: f.title, artist: f.artist, draft: meta}, old);
      return {json: {ok: true, rev: shSave(key, show), show, draft: meta}}; }
    return {status: 400, json: {error: 'action: save, delete, autodraft, enable, global, record or skip'}};
  }
  function showsSeed() {                                            // every demo song comes with a ready-made show to look at, edit and watch
    SONGS.forEach((x, i) => { const tr = M.queue.find(q => q.title === x[0]); if (!tr) return; const k = knowSong(tr), f = songFacts(k), d = draftShow(f, i % 3);
      shSave(k, cleanShow(k, {items: d.items, enabled: true, title: f.title, artist: f.artist, draft: d.meta}, null)); });
  }

  // ----------------------------------------------------------------------- 🎛️ Pro DJ (prodj.py): Autoloops, Scenes, Cues, Tempo toolbox, Zones, Palettes
  // Same payloads as the app (GET /api/autoloops | scenes | cues | tempo | zones | palettes | prodj, the POSTs echo them with ok: true).
  const PD = {prog: null, pending: null, fade: 1, bars: 0, opts: {mode: 'repeat', bars: 8, snap: false, bank: 'A'}, beat: {}, rev: 0, lastBar: null,
    tmode: 'auto', tmult: 1, toff: 0, tbpm: 120, speech: false, target: 'all', subs: {}, palettes: [], pal: null, bo: 0, boTo: 0, boRate: 2,
    scenes: [], lists: [], list: null, pos: {}, lastCue: null};
  const PDL = () => ENG.prodj;
  const pdNearest = (v, opts) => opts.reduce((a, x) => Math.abs(x - v) < Math.abs(a - v) ? x : a, opts[0]);
  const pdName = (s, n, d) => (String(s || '').split(/\s+/).filter(Boolean).join(' ').slice(0, n)) || d;
  const pdId = p => p + Math.random().toString(16).slice(2, 10);
  function pdPresets() { return PDL().presets.map(p => Object.assign({}, p, {beat: PD.beat[p.id] != null ? PD.beat[p.id] : p.beat_default})); }
  const pdPreset = id => pdPresets().find(p => p.id === id) || null;
  const pdAllPal = () => PDL().palettes.map(p => Object.assign({}, p, {builtin: true})).concat(PD.palettes.map(p => Object.assign({}, p, {builtin: false})));
  const sceneProg = s => Object.assign({}, s, {kind: 'scene'});
  function pdSeed() {                                               // the demo comes with two saved scenes and a wedding cue list to play with
    const lc = n => ((ENG.look_colors || {})[n] || ['#ffc400', '#ffffff', '#ff8a00']).slice(0, 5);
    PD.scenes = [{id: 's_demo1', name: 'Golden hour', look: 'Royal Gold', fx: ['SunshineWave'], pal: ['#ffc400', '#ffffff', '#ff8a00'], speed: 0.8, transform: 'none', trail: 0.6, sparkle: 0.2, beat: 1, faders: null, ovr: null, t: Math.round(wall()) - 86400},
      {id: 's_demo2', name: 'Party blast', look: 'Neon Party', fx: ['Shockwave'], pal: lc('Neon Party'), speed: 1.1, transform: 'none', trail: 0.4, sparkle: 0.4, beat: 1, faders: null, ovr: null, t: Math.round(wall()) - 3600}];
    const c = (type, ref, fade, note) => Object.assign({id: pdId('c_'), type, fade, note}, ref ? {ref} : {});
    PD.lists = [{id: 'l_demo', name: 'Wedding reception', cues: [c('loop', 'C8', 2, 'Grand entrance'), c('loop', 'B6', 4, 'First dance'), c('scene', 's_demo1', 1, 'Cake cutting'),
      c('loop', 'A1', 0.5, 'Dance floor opens'), c('scene', 's_demo2', 0.5, 'Last song'), c('auto', null, 2, 'Back to the auto show')]}, {id: 'l_demo2', name: 'My event', cues: []}];
    PD.list = 'l_demo';
  }
  // ---- status
  function pdTempoBpm() { return PD.tmode === 'lock' ? PD.tbpm : (DJ.tap_bpm || BPM) * PD.tmult; }
  const pdTempo = () => ({mode: PD.tmode, locked: PD.tmode === 'lock', mult: PD.tmult, off_ms: Math.round(PD.toff * 60000 / Math.max(40, pdTempoBpm())),
    bpm: Math.round(pdTempoBpm() * 10) / 10, speech: PD.speech, speechy: false, ambient: OV.il.auto || 0});
  const pdL = id => { const L = PD.lists.find(l => l.id === (id || PD.list)); if (!L) throw bad('cue list not found'); return L; };
  function cueLabel(c) {
    if (c.type === 'scene') { const s = PD.scenes.find(x => x.id === c.ref); return s ? s.name : 'Missing scene'; }
    if (c.type === 'loop') { const p = PDL().presets.find(x => x.id === c.ref); return p ? p.name : 'Missing Autoloop'; }
    return {blackout: 'Blackout', interlude: 'Interlude', auto: 'Back to Auto'}[c.type] || c.type;
  }
  function cueState() {
    const L = PD.lists.find(l => l.id === PD.list); if (!L) return null; const pos = PD.pos[L.id] == null ? -1 : PD.pos[L.id], cs = L.cues;
    const brief = i => i >= 0 && i < cs.length ? Object.assign({i}, ...['id', 'type', 'ref', 'fade', 'note'].map(k => ({[k]: cs[i][k] == null ? null : cs[i][k]})), {label: cueLabel(cs[i])}) : null;
    return {list: L.id, name: L.name, pos, n: cs.length, cur: brief(pos), next: brief(pos + 1)};
  }
  function pdBrief() {
    const P = PD.prog, pn = PD.pending;
    return {pro: PRO, rev: PD.rev, loop: P ? {id: P.id, name: P.name, kind: P.kind, bank: P.bank || null} : null, pending: pn ? {id: pn.P.id, name: pn.P.name} : null,
      opts: Object.assign({}, PD.opts), bars: Math.max(0, PD.bars), tempo: pdTempo(), zones: {target: PD.target, subs: Object.assign({}, PD.subs)},
      palette: PD.pal, blackout: Math.round(PD.bo * 100) / 100, cue: cueState()};
  }
  // ---- programs (an Autoloop or a Scene holds the wall)
  function pdCommit(P, fade) {
    PD.prog = P; PD.fade = +fade || 0; PD.bars = 0; PD.pending = null; PD.progT = now();
    if (P && P.faders) { FA.v = Object.assign({}, FA.v, P.faders); FA.rev++; }
    if (P) { S.feature = null; S.locked = null; } PD.rev++;
  }
  function pdSet(P, fade, snap) { if (!snap && P) PD.pending = {P, fade: +fade || 0}; else pdCommit(P, fade); }
  function pdStep(d) {
    const cur = (PD.pending ? PD.pending.P : PD.prog) || {};
    if (cur.kind === 'scene' && PD.scenes.length) { const ids = PD.scenes.map(s => s.id), i = ids.indexOf(cur.id); return sceneProg(PD.scenes[((i + d) % ids.length + ids.length) % ids.length]); }
    const bank = cur.bank || (PD.opts.bank !== 'MY' ? PD.opts.bank : 'A'), ids = PDL().presets.filter(p => p.bank === bank).map(p => p.id), i = ids.indexOf(cur.id);
    return pdPreset(ids[((i + d) % ids.length + ids.length) % ids.length]);
  }
  function loopCmd(b) {
    const ch = [];
    if (b.opts && typeof b.opts === 'object') { const o = b.opts;
      if ('mode' in o) { if (!['repeat', 'advance'].includes(o.mode)) throw bad('mode: repeat or advance'); PD.opts.mode = o.mode; }
      if ('bars' in o) { const v = parseInt(o.bars, 10); if (!PDL().adv_bars.includes(v)) throw bad('bars: 4, 8, 16 or 32'); PD.opts.bars = v; }
      if ('snap' in o) PD.opts.snap = !!o.snap;
      if ('bank' in o) { if (!['A', 'B', 'C', 'D', 'MY'].includes(o.bank)) throw bad('bank: A, B, C, D or MY'); PD.opts.bank = o.bank; }
      ch.push('opts'); }
    if (b.beat && typeof b.beat === 'object') { const pid = b.beat.pad, m = Number(b.beat.mult == null ? 1 : b.beat.mult);
      if (!pdPreset(pid)) throw bad('beat.pad: A1 to D8'); if (!PDL().beat_mults.includes(m)) throw bad('beat.mult: 0.25, 0.5, 1, 2 or 4');
      PD.beat[pid] = m; ch.push('beat:' + pid); if (PD.prog && PD.prog.id === pid) PD.prog = Object.assign({}, PD.prog, {beat: m}); }
    const snap = 'snap' in b ? !!b.snap : PD.opts.snap, fade = num(b.fade, snap ? 0.5 : 1);
    if (b.pad) { const P = pdPreset(b.pad); if (!P) throw bad('pad: A1 to D8'); pdSet(P, fade, snap); ch.push('pad:' + P.id); clearTakeovers(); }
    if (b.next || b.prev) { const P = pdStep(b.next ? 1 : -1); if (P) { pdSet(P, fade, snap); ch.push((b.next ? 'next:' : 'prev:') + P.id); } }
    if (b.release) { PD.pending = null; pdCommit(null, fade); ch.push('release'); }
    if (b.cancel) { PD.pending = null; ch.push('cancel'); }
    if (!ch.length) throw bad('send pad, next, prev, release, cancel, opts or beat');
    PD.rev++; return ch;
  }
  function capture(name) {
    const fx = S.feature && S.feature.name && CAT.effects[S.feature.name] ? S.feature.name : CAT.effects[S.effect] ? S.effect : 'Plasma', P = PD.prog || {};
    return {id: pdId('s_'), name: pdName(name, 24, 'Scene ' + (PD.scenes.length + 1)), look: P.look || S.look, fx: P.fx ? P.fx.slice(0, 2) : [fx],
      pal: (P.pal || (ENG.look_colors || {})[S.look] || []).slice(0, 5), speed: num(P.speed, 1), transform: 'none', trail: 0.4, sparkle: 0.2, beat: num(P.beat, 1),
      faders: Object.assign({}, FA.v), ovr: Object.fromEntries(OV.keys.filter(k => k.color).map(k => [k.id, k.color])), t: Math.round(wall())};
  }
  function sceneCmd(b) {
    const ch = [];
    if ('save' in b) { const s = b.save && typeof b.save === 'object' ? b.save : {}; if (PD.scenes.length >= 64) throw bad('64 scenes is the most: delete one first');
      const sc = capture(s.name); PD.scenes.push(sc); ch.push('save:' + sc.id); }
    if (b.recall) { const s = PD.scenes.find(x => x.id === b.recall); if (!s) throw bad('recall: a scene id');
      pdSet(sceneProg(s), pdNearest(num(b.fade, 1), PDL().fades), true); PD.boTo = 0; if (OV.ilOn) { ilSet(false, false); OV.rev++; } clearTakeovers(); ch.push('recall:' + s.id); }
    if (b.rename) { const s = PD.scenes.find(x => x.id === b.rename); if (!s) throw bad('rename: a scene id'); s.name = pdName(b.name, 24, s.name); ch.push('rename'); }
    if (b.move) { const ids = PD.scenes.map(x => x.id); if (!ids.includes(b.move)) throw bad('move: a scene id');
      const s = PD.scenes.splice(ids.indexOf(b.move), 1)[0]; PD.scenes.splice(clamp(parseInt(b.to, 10) || 0, 0, PD.scenes.length), 0, s); ch.push('move'); }
    if (b.delete) { const n = PD.scenes.length; PD.scenes = PD.scenes.filter(x => x.id !== b.delete); if (PD.scenes.length === n) throw bad('delete: a scene id'); ch.push('delete'); }
    if (!ch.length) throw bad('send save, recall, rename, move or delete');
    PD.rev++; return ch;
  }
  function cleanCue(c, old) {
    c = Object.assign({}, c || {}); const out = Object.assign({}, old || {});
    if ('type' in c || !old) { if (!PDL().cue_types.includes(c.type)) throw bad('type: ' + PDL().cue_types.join(', ')); out.type = c.type; }
    if (['scene', 'loop'].includes(out.type)) { const ref = 'ref' in c ? c.ref : out.ref;
      if (out.type === 'loop' && !pdPreset(ref)) throw bad('ref: an Autoloop pad (A1 to D8)');
      if (out.type === 'scene' && !PD.scenes.some(s => s.id === ref)) throw bad('ref: a scene id');
      out.ref = ref; } else delete out.ref;
    if ('fade' in c || !old) out.fade = pdNearest(num(c.fade, 1), PDL().fades);
    if ('note' in c || !old) out.note = pdName(c.note, 40, '');
    if (!out.id) out.id = pdId('c_');
    return out;
  }
  function fireCue(c) {
    const f = num(c.fade, 1); PD.lastCue = Object.assign({}, c, {t: wall()}); PD.boRate = f > 0 ? 1 / f : 1e9;
    if (c.type === 'blackout') { PD.boTo = 1; if (OV.ilOn) { ilSet(false, false); OV.rev++; } return; }
    PD.boTo = 0;
    if (c.type === 'interlude') { ilSet(true, false); OV.rev++; return; }
    if (OV.ilOn) { ilSet(false, false); OV.rev++; }
    if (c.type === 'auto') { pdCommit(null, f); return; }
    if (c.type === 'loop') { const P = pdPreset(c.ref); if (P) pdSet(P, f, true); }
    else if (c.type === 'scene') { const s = PD.scenes.find(x => x.id === c.ref); if (s) pdSet(sceneProg(s), f, true); }
    clearTakeovers();
  }
  function cueCmd(b) {
    const ch = []; let fire = null;
    if (b.new_list != null) { const nm = pdName(b.new_list && typeof b.new_list === 'object' ? b.new_list.name : b.new_list, 28, 'Event ' + (PD.lists.length + 1));
      if (PD.lists.length >= 32) throw bad('32 cue lists is the most'); const L = {id: pdId('l_').slice(0, 8), name: nm, cues: []}; PD.lists.push(L); PD.list = L.id; ch.push('new_list'); }
    if (b.list) { pdL(b.list); PD.list = b.list; ch.push('list'); }
    if (b.rename_list) { const L = pdL(b.rename_list); L.name = pdName(b.name, 28, L.name); ch.push('rename_list'); }
    if (b.delete_list) { pdL(b.delete_list); if (PD.lists.length <= 1) throw bad('keep at least one cue list');
      PD.lists = PD.lists.filter(l => l.id !== b.delete_list); if (PD.list === b.delete_list) PD.list = PD.lists[0].id; ch.push('delete_list'); }
    const L = pdL();
    if (b.add && typeof b.add === 'object') { const c = cleanCue(b.add); if (L.cues.length >= 200) throw bad('200 cues is the most');
      const at = b.at == null ? L.cues.length : clamp(parseInt(b.at, 10) || 0, 0, L.cues.length); L.cues.splice(at, 0, c); ch.push('add:' + c.id); }
    if (b.update && typeof b.update === 'object') { const i = L.cues.findIndex(c => c.id === b.update.id); if (i < 0) throw bad('update.id: a cue id');
      L.cues[i] = cleanCue(b.update, L.cues[i]); ch.push('update'); }
    if (b.remove) { const i = L.cues.findIndex(c => c.id === b.remove); if (i < 0) throw bad('remove: a cue id'); L.cues.splice(i, 1);
      const p = PD.pos[L.id] == null ? -1 : PD.pos[L.id]; if (i <= p) PD.pos[L.id] = p - 1; ch.push('remove'); }
    if (b.move) { const ids = L.cues.map(c => c.id); if (!ids.includes(b.move)) throw bad('move: a cue id');
      const c = L.cues.splice(ids.indexOf(b.move), 1)[0]; L.cues.splice(clamp(parseInt(b.to, 10) || 0, 0, L.cues.length), 0, c); ch.push('move'); }
    let pos = PD.pos[L.id] == null ? -1 : PD.pos[L.id];
    if (b.go) { if (pos + 1 >= L.cues.length) throw bad('end of the cue list'); pos++; fire = L.cues[pos]; ch.push('go'); }
    if (b.back) { if (pos <= 0) throw bad('already at the first cue'); pos--; fire = L.cues[pos]; ch.push('back'); }
    if (b.jump != null) { const j = parseInt(b.jump, 10); if (!(j >= 0 && j < L.cues.length)) throw bad('jump: a cue number'); pos = j; fire = L.cues[pos]; ch.push('jump'); }
    if (b.reset) { pos = -1; ch.push('reset'); }
    if (b.blackout != null) { PD.boTo = b.blackout ? 1 : 0; PD.boRate = 1 / Math.max(0.05, num(b.fade, 0.5)); ch.push('blackout'); }
    PD.pos[L.id] = pos;
    if (fire) fireCue(fire);
    if (!ch.length) throw bad('send go, back, jump, reset, blackout, add, update, remove, move, list, new_list, rename_list or delete_list');
    PD.rev++; return ch;
  }
  function tempoCmd(b) {
    const ch = [], cur = pdTempoBpm();
    if (b.reset) { PD.tmode = 'auto'; PD.tmult = 1; PD.toff = 0; ch.push('reset'); }
    if ('lock' in b) { const on = b.lock === 'toggle' ? PD.tmode !== 'lock' : !!b.lock;
      if (on && PD.tmode !== 'lock') { PD.tmode = 'lock'; PD.tbpm = Math.round(cur * 100) / 100; } else if (!on) { PD.tmode = 'auto'; PD.tmult = 1; } ch.push('lock:' + (on ? 'on' : 'off')); }
    if (b.adjust != null) { const d = Number(b.adjust); if (!isFinite(d) || Math.abs(d) > 20) throw bad('adjust: -20 to 20 BPM');
      if (PD.tmode !== 'lock') { PD.tmode = 'lock'; PD.tbpm = cur; } PD.tbpm = Math.round(clamp(PD.tbpm + d, 40, 220) * 100) / 100; ch.push('adjust'); }
    if (b.set != null) { const v = Number(b.set); if (!(v >= 40 && v <= 220)) throw bad('set: 40 to 220 BPM'); PD.tmode = 'lock'; PD.tbpm = Math.round(v * 100) / 100; ch.push('set'); }
    [['double', 2], ['half', 0.5]].forEach(([k, m]) => { if (!b[k]) return;
      if (PD.tmode === 'lock') { const nb = PD.tbpm * m; if (nb >= 40 && nb <= 220) PD.tbpm = Math.round(nb * 100) / 100; } else PD.tmult = clamp(PD.tmult * m, 0.25, 4); ch.push(k); });
    if (b.nudge) { const ms = num(b.ms, 15) * (Number(b.nudge) > 0 ? 1 : -1), d = ms / 1000 * cur / 60; PD.toff -= d; beatPos -= d; ch.push('nudge'); }
    if (b.ambient && typeof b.ambient === 'object') { const a = b.ambient; if ('speech' in a) PD.speech = !!a.speech; if ('secs' in a) ilApply({auto: a.secs}); OV.rev++; ch.push('ambient'); }
    if (!ch.length) throw bad('send adjust, set, double, half, nudge, lock, reset or ambient');
    PD.rev++; return ch;
  }
  // ---- zones: the wall's built-in areas plus each curtain (on the real app, every named string of a drawn layout too)
  const pdZones = () => PDL().zones.map(z => Object.assign({}, z)).concat(DEVS.map(d => ({id: 'c:' + d.id, name: d.name.slice(0, 16), group: 'g1'})));
  const ZM = {};
  function zoneMask(id) {
    if (ZM[id]) return ZM[id]; const m = new Float32Array(N), dev = id.startsWith('c:') ? DEVS.find(d => 'c:' + d.id === id) : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let on = true;
      if (dev) on = x >= dev.x0 && x < dev.x0 + 20;
      else if (id === 'left') on = x < W / 2; else if (id === 'right') on = x >= W / 2; else if (id === 'top') on = y < H / 2; else if (id === 'bottom') on = y >= H / 2;
      else if (id === 'center') on = x >= W / 4 && x < W * 3 / 4 && y >= H / 4 && y < H * 3 / 4; else if (id === 'odd') on = x % 2 === 1; else if (id === 'even') on = x % 2 === 0;
      m[y * W + x] = on ? 1 : 0; }
    return (ZM[id] = m);
  }
  function zoneCmd(b) {
    const ch = [], ids = new Set(pdZones().map(z => z.id));
    if ('target' in b) { if (!ids.has(b.target)) throw bad('target: ' + [...ids].sort().join(', ')); PD.target = b.target; ch.push('target'); }
    if (b.sub && typeof b.sub === 'object') { Object.entries(b.sub).forEach(([z, v]) => { if (!ids.has(z)) throw bad('sub: a zone id'); v = Number(v); if (!isFinite(v)) throw bad('sub: 0 to 100');
      v = clamp(v, 0, 100); if (v >= 100) delete PD.subs[z]; else PD.subs[z] = Math.round(v * 10) / 10; }); ch.push('sub'); }
    if (b.reset_subs) { PD.subs = {}; ch.push('reset_subs'); }
    if (!ch.length) throw bad('send target, sub or reset_subs');
    PD.rev++; return ch;
  }
  function paletteCmd(b) {
    const ch = [];
    if (b.use) { if (!pdAllPal().some(p => p.id === b.use)) throw bad('use: a palette id'); PD.pal = b.use; ch.push('use'); }
    if (b.clear) { PD.pal = null; ch.push('clear'); }
    if (b.save && typeof b.save === 'object') { const cols = (b.save.colors || []).map(normHex); if (cols.length < 3 || cols.length > 5) throw bad('colors: 3 to 5 colours');
      if (PD.palettes.length >= 24) throw bad('24 palettes is the most');
      const p = {id: pdId('u_').slice(0, 8), name: pdName(b.save.name, 20, 'My palette ' + (PD.palettes.length + 1)), colors: cols}; PD.palettes.push(p); ch.push('save:' + p.id);
      if (b.save.use !== false) PD.pal = p.id; }
    if (b.delete) { const n = PD.palettes.length; PD.palettes = PD.palettes.filter(p => p.id !== b.delete); if (PD.palettes.length === n) throw bad('delete: one of your palettes');
      if (PD.pal === b.delete) PD.pal = null; ch.push('delete'); }
    if (b.rename) { const p = PD.palettes.find(x => x.id === b.rename); if (!p) throw bad('rename: one of your palettes'); p.name = pdName(b.name, 20, p.name); ch.push('rename'); }
    if (!ch.length) throw bad('send use, clear, save, delete or rename');
    PD.rev++; return ch;
  }
  function pdControls() {
    const c = PDL().presets.map(p => ({id: 'autoloop.' + p.id, kind: 'button', name: p.name}));
    [['cue.blackout', 'toggle'], ['autoloop.next', 'button'], ['autoloop.prev', 'button'], ['autoloop.release', 'button'], ['autoloop.snap', 'toggle'], ['autoloop.advance', 'toggle'],
      ['cue.go', 'button'], ['cue.back', 'button'], ['cue.reset', 'button'], ['tempo.lock', 'toggle'], ['tempo.double', 'button'], ['tempo.half', 'button'],
      ['tempo.bpm+0.1', 'button'], ['tempo.bpm-0.1', 'button'], ['tempo.bpm+1', 'button'], ['tempo.bpm-1', 'button'], ['tempo.nudge+', 'button'], ['tempo.nudge-', 'button'],
      ['tempo.reset', 'button'], ['palette.clear', 'button']].forEach(([id, kind]) => c.push({id, kind}));
    pdAllPal().forEach(p => c.push({id: 'palette.' + p.id, kind: 'button', name: p.name}));
    PD.scenes.forEach(s => c.push({id: 'scene.' + s.id, kind: 'button', name: s.name}));
    pdZones().forEach(z => { c.push({id: 'zone.' + z.id, kind: 'button', name: z.name}); c.push({id: 'sub.' + z.id, kind: 'fader', name: z.name, range: [0, 100]}); });
    return c;
  }
  function pdControl(cid, value) {                                  // one control by id, like a MIDI button or fader would
    cid = String(cid || '');
    if (cid.startsWith('autoloop.')) { const k = cid.slice(9);
      if (['next', 'prev', 'release'].includes(k)) return ['autoloops', loopCmd({[k]: true})];
      if (k === 'snap') return ['autoloops', loopCmd({opts: {snap: value == null ? !PD.opts.snap : !!value}})];
      if (k === 'advance') { const on = value == null ? PD.opts.mode !== 'advance' : !!value; return ['autoloops', loopCmd({opts: {mode: on ? 'advance' : 'repeat'}})]; }
      return ['autoloops', loopCmd({pad: k})]; }
    if (cid === 'cue.blackout') return ['cues', cueCmd({blackout: value == null ? PD.boTo < 0.5 : !!value})];
    if (cid.startsWith('cue.')) return ['cues', cueCmd({[cid.slice(4)]: true})];
    if (cid.startsWith('tempo.')) { const k = cid.slice(6);
      if (k.startsWith('bpm')) return ['tempo', tempoCmd({adjust: Number(k.slice(3))})];
      if (k === 'lock') return ['tempo', tempoCmd({lock: value == null ? 'toggle' : !!value})];
      if (k.startsWith('nudge')) return ['tempo', tempoCmd({nudge: k.endsWith('+') ? 1 : -1})];
      return ['tempo', tempoCmd({[k]: true})]; }
    if (cid === 'palette.clear') return ['palettes', paletteCmd({clear: true})];
    if (cid.startsWith('palette.')) return ['palettes', paletteCmd({use: cid.slice(8)})];
    if (cid.startsWith('scene.')) return ['scenes', sceneCmd({recall: cid.slice(6)})];
    if (cid.startsWith('zone.')) return ['zones', zoneCmd({target: cid.slice(5)})];
    if (cid.startsWith('sub.')) { let v = num(value, 100); if (v <= 1) v *= 100; return ['zones', zoneCmd({sub: {[cid.slice(4)]: v}})]; }
    throw bad('control: an id from GET /api/prodj');
  }
  function pdInfo(what) {
    const b = pdBrief(), L = PDL();
    if (what === 'autoloops') return Object.assign(b, {banks: L.banks, presets: pdPresets(), scenes: PD.scenes, beat_mults: L.beat_mults, adv_bars: L.adv_bars, fades: L.fades});
    if (what === 'scenes') return Object.assign(b, {scenes: PD.scenes, fades: L.fades});
    if (what === 'cues') return Object.assign(b, {lists: PD.lists.map(l => ({id: l.id, name: l.name, n: l.cues.length})), active: PD.list,
      cues: pdL().cues.map(c => Object.assign({}, c, {label: cueLabel(c)})), types: L.cue_types, fades: L.fades,
      scenes: PD.scenes.map(s => ({id: s.id, name: s.name})), loops: L.presets.map(p => ({id: p.id, name: p.name}))});
    if (what === 'tempo') return Object.assign(b, {nudge_ms: 15});
    if (what === 'zones') return Object.assign(b, {list: pdZones()});
    if (what === 'palettes') return Object.assign(b, {palettes: pdAllPal()});
    return Object.assign(b, {controls: pdControls()});
  }
  function pdPost(what, body) {
    let ch;
    if (what === 'autoloops') ch = loopCmd(body); else if (what === 'scenes') ch = sceneCmd(body); else if (what === 'cues') ch = cueCmd(body);
    else if (what === 'tempo') ch = tempoCmd(body); else if (what === 'zones') ch = zoneCmd(body); else if (what === 'palettes') ch = paletteCmd(body);
    else if (what === 'prodj') [what, ch] = pdControl(body.control, body.value);
    return Object.assign(pdInfo(what), {ok: true, changed: ch});
  }
  function pdTick(dt) {                                             // next-bar pads, Advance mode, the cue blackout fade
    const bar = Math.floor(beatPos / 4);
    if (PD.lastBar != null && bar !== PD.lastBar) {
      if (PD.pending) pdCommit(PD.pending.P, PD.pending.fade);
      else if (PD.prog) { PD.bars++; if (PD.opts.mode === 'advance' && PD.prog.kind === 'loop' && PD.bars >= PD.opts.bars) { const P = pdStep(1); if (P) pdCommit(P, 1); } }
    }
    PD.lastBar = bar;
    if (PD.bo !== PD.boTo) PD.bo = PD.boTo > PD.bo ? Math.min(PD.boTo, PD.bo + dt * PD.boRate) : Math.max(PD.boTo, PD.bo - dt * PD.boRate);
  }
  function pdPalCols() {                                            // the colours that repaint the wall: a picked palette wins, then the Autoloop / Scene's own
    if (PD.pal) { const p = pdAllPal().find(x => x.id === PD.pal); if (p) return p.colors.map(hexRGB); }
    const P = PD.prog; if (P && P.pal && (P.own_pal || P.kind === 'scene')) return P.pal.map(hexRGB);
    return null;
  }
  function pdPaint(buf) {                                           // palette repaint (keeps the show's shapes and brightness)
    const cols = pdPalCols(); if (!cols || !cols.length) return;
    const tt = now() * 0.05;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, l = lum3(buf, i) / 255; if (l <= 0.01) continue;
      const c = palAt(cols, x / W * 0.8 + y / H * 0.2 + tt + l * 0.15);
      for (let ch = 0; ch < 3; ch++) buf[i + ch] = c[ch] * l * 0.92 + buf[i + ch] * 0.08; }
  }
  function pdFinish(buf) {                                          // zone faders, then the cue blackout
    Object.entries(PD.subs).forEach(([z, v]) => { const m = zoneMask(z), k = v / 100; for (let j = 0; j < N; j++) if (m[j]) { buf[j * 3] *= k; buf[j * 3 + 1] *= k; buf[j * 3 + 2] *= k; } });
    if (PD.bo > 0) for (let i = 0; i < buf.length; i++) buf[i] *= 1 - PD.bo;
  }

  // ======================================================================= what is on the wall right now
  function source(t, si) {
    if (!S.power) return {kind: 'black', label: 'Lights off'};
    const fp = FIRE, act = S.act, cands = [];
    if (FD.s.mode !== 'off') cands.push(['feed', act.feed || 0]);
    if (SB.s.on) cands.push(['score', act.score || 0]);
    if (fp.on) cands.push(['fire', act.fire || 0]);
    if (S.holiday) cands.push(['holiday', act.holiday || 0]);
    if (S.scene) cands.push(['scene', act.scene || 0]);
    const win = cands.sort((a, b) => b[1] - a[1])[0];
    const k = win && win[0];
    if (FD.finale > t) return {clip: 'fx-pixelfireworks', label: 'Countdown finale'};
    if (k === 'feed') { const m = FD.s.mode; if (FEED_CLIP[m]) return {clip: FEED_CLIP[m], label: FD.s.feeds[m].title};
      return {kind: 'ticker', text: boardText(m), color: m === 'ufc' ? [255, 77, 109] : [204, 153, 255], label: FD.s.feeds[m].title}; }
    if (k === 'score') { const s = SB.s; if (s.mode === 'game') return {kind: 'board', label: 'Scoreboard'};
      if (s.mode === 'f1') return {clip: 'score-f1', label: 'F1 running order'};
      const g = s.live, sp = s.leagues_sport[s.league]; return g ? {clip: SPORT_CLIP[sp] || 'score-football', label: 'Live Fan: ' + (s.team_name || '')} : {clip: 'score-timer', label: 'Live Fan'}; }
    if (k === 'fire') { const exact = fp.style === 'fireplace' ? 'fire-' + fp.color + '-' + fp.mode : fp.style === 'candles' && fp.color === 'rainbow' ? 'fire-candles-rainbow' : fp.style === 'campfire' && fp.color === 'team' ? 'fire-campfire-team' : '';
      const lab = (ENG.fire.styles.find(x => x.key === fp.style) || {}).label || 'Fireplace';
      if (exact && has(exact)) return {clip: exact, label: lab, fire: 1};
      return {clip: fp.style === 'fireplace' ? 'fire-classic-' + fp.mode : 'fire-' + fp.style, recolor: fp.style === 'spirit' && fp.color === 'classic' ? null : fp.color, speed: fp.mode === 'roar' && fp.style !== 'fireplace' ? 1.5 : 1, label: lab, fire: 1}; }
    if (k === 'holiday') { const h = CAT.holidays[S.holiday], MOV = {halloween: 'movie-halloweennight', christmas: 'movie-christmaseve', newyear: 'movie-newyearcountdown', thanksgiving: 'movie-harvestday'};
      const own = 'holiday-' + S.holiday, set = (has(own) ? [own] : [HOL_STAND[S.holiday] || 'fx-pixelfireworks']).concat(MOV[S.holiday] ? [MOV[S.holiday]] : []), c = set[si.k % set.length];
      const fx = (S.holFx && S.holFx.length ? S.holFx : h.fx.map(f => f.name)); return {clip: c, label: fx[si.k % fx.length], holiday: h}; }
    if (k === 'scene') { const sc = S.scene, seg = sc.segs[sc.i] || {}; return {clip: sc.clips[sc.i] || 'look-neon-party', label: sc.effects[sc.i] || sc.name}; }
    if (PD.prog && PRO) { const P = PD.prog; return {clip: effectClip((P.fx || [])[0]) || lookClip(P.look, 0), label: P.name, speed: num(P.speed, 1)}; }   // 🔁 an Autoloop or a Scene holds the wall
    if (S.locked) return {clip: effectClip(S.locked) || lookClip(S.look, S.lookK), label: S.locked};
    if (S.feature && (S.feature.until === 0 || S.feature.until > t)) return {clip: S.feature.clip || lookClip(S.look, S.lookK), label: S.feature.name, vary: S.feature.vary};
    if (S.cameo > t) return {kind: 'eye', label: 'Eyeball'};
    const lc = lookClip(S.look, S.lookK), lk = LOOK_SET[S.look];
    return {clip: lc, label: lk ? titleOf(lc) : S.effect};
  }

  // ======================================================================= painting one frame
  let coolPrev = null; const coolTmp = new Float32Array(N * 3);
  function colorPost(b, dt) {
    const tg = DJ.colorOn && DJ.colorCols.length ? 1 : 0; DJ.colorK += (tg - DJ.colorK) * Math.min(1, dt * 3);
    if (DJ.colorK < .01 && !tg) { DJ.colorK = 0; return; }
    const K = DJ.colorK, cs = DJ.colorCols.length ? DJ.colorCols : [[255, 255, 255]], n = cs.length; DJ.colorPos = (DJ.colorPos + dt * .04) % 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, r = b[i], g = b[i + 1], bl = b[i + 2], mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
      if (mx <= 0) continue; const sat = (mx - mn) / mx, d = Math.max(mx - mn, 1e-6);
      let h = mx === r ? (((g - bl) / d) % 6 + 6) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h /= 6;
      const w = clamp((sat - .12) / .2, 0, 1), u = ((h * w + (x / W * .6 + y / H * .25) * (1 - w) + DJ.colorPos) % 1 + 1) % 1;
      let p = u * n, i0 = Math.floor(p) % n, f = clamp((p - Math.floor(p) - .7) / .3, 0, 1); f = f * f * (3 - 2 * f); const c0 = cs[i0], c1 = cs[(i0 + 1) % n], v = mx / 255;
      for (let c = 0; c < 3; c++) b[i + c] = b[i + c] * (1 - K) + (c0[c] * (1 - f) + c1[c] * f) * v * K; }
  }
  function coolPost(b, k) {
    const bk = .45 * k, dim = 1 - .4 * k, tr = .45 * k;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, u = y > 0 ? i - W * 3 : i, d = y < H - 1 ? i + W * 3 : i, l = x > 0 ? i - 3 : i, rr = x < W - 1 ? i + 3 : i;
      for (let c = 0; c < 3; c++) coolTmp[i + c] = (b[i + c] * (1 - bk) + (b[u + c] + b[d + c] + b[l + c] + b[rr + c]) / 4 * bk) * dim; }
    if (!coolPrev) coolPrev = new Float32Array(N * 3).fill(0);
    for (let i = 0; i < b.length; i++) { b[i] = coolTmp[i] * (1 - tr) + coolPrev[i] * tr; coolPrev[i] = b[i]; }
  }
  let buf = new Float32Array(N * 3), curClip = null, clipV0 = 0, VT = 0, lastT = now(), spk = new Float32Array(N), lastLevel = 0, lastSrc = {label: ''};
  const HEX = []; for (let i = 0; i < 256; i++) HEX.push(i.toString(16).padStart(2, '0'));
  // a mode with its own picture and pace owns the wall: faders' looks, Song Show cues and loop spans stay out of the way (like the engine)
  const takeover = () => !S.power || FD.s.mode !== 'off' || !!SB.s.on || !!(FIRE && FIRE.on) || !!S.holiday || !!S.scene;
  // 🎨 COLOR MOOD, same colours as the app engine (looks.py MOOD_COLS / SEASON_COLS). The demo plays recordings, so it repaints
  // each pixel: its brightness stays, its hue picks a spot along the mood's colours.
  const MOOD_COLS = {warm: [[1, .18, .04], [1, .5, 0], [1, .78, .18], [1, .12, .35], [1, .62, .35]], cool: [[0, .55, 1], [0, .95, .9], [.42, .2, 1], [.15, 1, .6], [.7, .85, 1]],
    party: [[1, 0, .6], [0, .9, 1], [.6, 0, 1], [.35, 1, 0], [1, 1, 0]], rainbow: [[1, 0, 0], [1, .55, 0], [1, 1, 0], [0, 1, .1], [0, .6, 1], [.5, 0, 1], [1, 0, .7]]};
  const SEASON = [[101, 102, [[1, .8, .25], [.85, .88, 1], [1, 1, 1], [.2, .35, 1]]], [201, 215, [[1, .1, .35], [1, .45, .65], [1, .85, .9], [.85, 0, .2]]],
    [310, 318, [[0, .85, .25], [.45, 1, .3], [1, .8, .2], [1, 1, 1]]], [319, 425, [[1, .7, .85], [.6, .9, 1], [1, 1, .55], [.7, 1, .7], [.8, .65, 1]]],
    [620, 706, [[1, .05, .1], [1, 1, 1], [.05, .25, 1]]], [1001, 1101, [[1, .42, 0], [.55, 0, .9], [.4, 1, .1], [1, .75, .1]]],
    [1102, 1130, [[1, .5, .05], [.6, .1, .05], [1, .75, .2], [.75, .3, .05]]], [1201, 1226, [[1, 0, .05], [0, .8, .2], [1, 1, 1], [1, .75, .15]]],
    [1227, 1231, [[1, .8, .25], [.85, .88, 1], [1, 1, 1], [.2, .35, 1]]]];
  function moodCols() { if (!S.mood || S.mood === 'auto') return null; if (MOOD_COLS[S.mood]) return MOOD_COLS[S.mood];
    const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate(), h = SEASON.find(([a, b]) => md >= a && md <= b); return h ? h[2] : MOOD_COLS.party; }
  function moodPost(buf) {
    const C = moodCols(); if (!C) return; const n = C.length;
    for (let i = 0; i < buf.length; i += 3) { const r = buf[i], g = buf[i + 1], b = buf[i + 2], mx = Math.max(r, g, b); if (mx < 6) continue;
      const mn = Math.min(r, g, b), dd = mx - mn; let h = 0;
      if (dd > 0) { h = mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4; h = ((h / 6) % 1 + 1) % 1; }
      const x = h * n, k = Math.floor(x) % n, f = x - Math.floor(x), A = C[k], B = C[(k + 1) % n], wht = dd < 30 ? 1 - dd / 30 : 0;   // near-white stays white
      for (let c = 0; c < 3; c++) { const v = (A[c] * (1 - f) + B[c] * f) * mx; buf[i + c] = v * (1 - wht) + mx * wht; } } }
  function paint() {
    const t = now(), dt = Math.min(.25, t - lastT); lastT = t; clock();
    const busy = takeover();
    ovTick(dt); lpTick(); shTick(busy); cueStep(LP.layer, busy ? {} : LP.act, busy, it => (it.end - it.t));
    { const loud = clamp((lastLevel - .72) / .2, 0, 1), tg = coolOn() ? 1 - .6 * loud : 0; DJ.coolK += (tg - DJ.coolK) * Math.min(1, dt * (tg > DJ.coolK ? 1.6 : 1.1)); if (DJ.coolK < .01 && !tg) DJ.coolK = 0; }
    const ck = DJ.coolK, sp = (busy ? 1 : fSpeed()) * (1 - .5 * ck), vdt = Math.min(.25, dt * sp); VT += dt * sp;      // 🎚️ SPEED: the animations' own clock
    const si = followShow(), src = source(t, si); lastSrc = src;
    buf.fill(0);
    if (src.clip) {
      if (src.clip !== curClip) { curClip = src.clip; clipV0 = VT; }
      let c = clipNow(src.clip);
      if (!c && lastGood) c = lastGood;                             // still downloading: keep the last picture going
      if (c) { lastGood = c; const f = Math.floor((VT - clipV0) * c.fps * (src.speed || 1)) % c.n, base = f * c.w * c.h * 4, fl = src.vary && src.vary % 2;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xx = fl ? W - 1 - x : x, j = base + ((y % c.h) * c.w + (xx % c.w)) * 4, i = (y * W + x) * 3;
          buf[i] = c.px[j]; buf[i + 1] = c.px[j + 1]; buf[i + 2] = c.px[j + 2]; }
        if (src.vary) { const r = src.vary % 3; if (r) for (let i = 0; i < N * 3; i += 3) { const R0 = buf[i], G0 = buf[i + 1], B0 = buf[i + 2];   // another effect of the same look: same recording, flipped + recoloured
          if (r === 1) { buf[i] = B0; buf[i + 1] = R0; buf[i + 2] = G0; } else { buf[i] = G0; buf[i + 1] = B0; buf[i + 2] = R0; } } } }
      if (src.recolor) recolor(buf, src.recolor, t, FIRE);
      if (src.fire && (FIRE.beat || FIRE.dance)) { const k = 1 + (FIRE.beat ? .35 * Math.pow(1 - beatPos % 1, 4) : 0) + (FIRE.dance ? .15 * Math.sin(beatPos * Math.PI / 2) : 0); for (let i = 0; i < buf.length; i++) buf[i] *= k; }
    } else if (src.kind === 'board') drawBoard(buf, t);
    else if (src.kind === 'ticker') { const m = textMask(src.text, 17), span = W + m.w, x0 = Math.round(W - ((VT - clipV0) * 11) % span);
      for (let x = 0; x < W; x++) { put(buf, x, 0, src.color.map(v => v * .6)); put(buf, x, H - 1, src.color.map(v => v * .6)); }
      stamp(buf, m, x0, ((H - m.h) / 2) | 0, () => [255, 255, 255]); }
    else if (src.kind === 'eye') eye(buf, VT);
    if (!busy) { pdPaint(buf); cueColor(buf, SH.act); cueColor(buf, LP.act); }    // 🎨 palette, then 🎬🔁 colour lock
    if (src.holiday && HOL_NAME.text && (t % 14) < 4.2) {         // 🎂 the birthday name / 🏈 team name flies across now and then
      const m = textMask(HOL_NAME.text, H), el = (t % 14) / 4.2; stamp(buf, m, Math.round(W - el * (W + m.w)), ((H - m.h) / 2) | 0, (x) => HOL_NAME.cols[x < W / 2 ? 0 : 1], .3); }
    if (S.power) textOverlay(buf, t, si);
    // ✨ sparkles: auto = a few on the drops, lots = always glittering
    const want = (S.sparkles === 'lots' ? .012 : S.sparkles === 'auto' && si.name === 'drop' ? .004 : 0) * (1 - ck);
    for (let i = 0; i < N; i++) { if (want && R() < want) spk[i] = 1; if (spk[i] > .02) { const v = spk[i] * 255; buf[i * 3] = Math.max(buf[i * 3], v); buf[i * 3 + 1] = Math.max(buf[i * 3 + 1], v); buf[i * 3 + 2] = Math.max(buf[i * 3 + 2], v); spk[i] *= Math.pow(.004, vdt); } else spk[i] = 0; }
    if (S.power) djApply(buf, t, vdt);
    if (ck > 0) coolPost(buf, ck); else coolPrev = null;
    moodPost(buf);                                                  // 🎨 Color mood (Show control): every effect in the mood's colours
    colorPost(buf, dt);                                             // 🎨 the whole wall in the picked colours
                                     // 🌙 softer, dimmer, light trails
    if (!busy) { cueText(buf, SH.act, t); cueText(buf, LP.act, t); if (SH.act.blackout || LP.act.blackout) buf.fill(0); }
    fadersLook(buf, t, busy);                                       // 🎚️ trails, colour, white, strobe
    if (SH.ok && !busy && SH.mult !== 1) for (let i = 0; i < buf.length; i++) buf[i] *= SH.mult;   // 🎬 the show's brightness curve
    if (!busy) pdFinish(buf);                                       // 🎛️ zone faders + cue blackout
    if (OV.ilLv > 0 && S.power) { const pic = ilPic(t), k = OV.ilLv * OV.ilLv * (3 - 2 * OV.ilLv); for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - k) + pic[i] * k; }
    if (FD.alert) { if (FD.alert.until < t) FD.alert = null; else { const c = clipNow('live-storm'); if (c) { const f = Math.floor(t * c.fps) % c.n, base = f * c.w * c.h * 4;
      for (let i = 0; i < N; i++) { const j = base + i * 4; buf[i * 3] = c.px[j]; buf[i * 3 + 1] = c.px[j + 1]; buf[i * 3 + 2] = c.px[j + 2]; } } } }
    // a curtain switched off in Setup is dark; Flash lights one up white
    DEVS.forEach(d => { const off = DEV_ON[d.id] === false, fl = S.flash[d.id] > t; if (!off && !fl) return;
      for (let y = 0; y < H; y++) for (let x = d.x0; x < d.x0 + 20; x++) { const i = (y * W + x) * 3, v = off ? 0 : (Math.floor(t * 6) % 2 ? 255 : 30); buf[i] = buf[i + 1] = buf[i + 2] = v; } });
    if (LINEUP.on) lineup(buf, t);
    const bri = S.brightness / 100, mm = fMaster(), k = (S.power ? bri : 0) * mm;    // the app's brightness x 🎚️ MASTER (and its blackout key)
    for (let i = 0; i < N * 3; i++) buf[i] *= k;
    ovApply(buf, t, bri, mm);                                        // 🚨 override keys, last of all
    let out = '', sum = 0;
    for (let i = 0; i < N * 3; i++) { const v = clamp(Math.round(buf[i]), 0, 255); sum += v; out += HEX[v]; }
    lastLevel = sum / (N * 3 * 255);
    return out;
  }
  // 🧭 line-up: a big number + an arrow on each curtain so you can tell them apart (LIGHTS page)
  const LINEUP = {on: false};
  function lineup(buf, t) {
    DEVS.forEach((d, n) => { const col = n ? [51, 214, 255] : [255, 61, 154];
      for (let y = 0; y < H; y++) for (let x = d.x0; x < d.x0 + 20; x++) { const i = (y * W + x) * 3; buf[i] *= .15; buf[i + 1] *= .15; buf[i + 2] *= .15; if (x === d.x0 || x === d.x0 + 19 || y === 0 || y === H - 1) put(buf, x, y, col.map(v => v * .5)); }
      tiny(buf, String(n + 1), d.x0 + 7, 3, col, 2);
      const ax = d.x0 + 4 + Math.floor((t * 6) % 12); for (let k = 0; k < 3; k++) { put(buf, ax - k, 16 - k, [255, 255, 255]); put(buf, ax - k, 16 + k, [255, 255, 255]); } });
  }
  let lastGood = null;
  function eye(buf, t) {                                            // 👁️ the Eyeball key: an eye that looks around and blinks
    const cx = 20, cy = 10, lx = cx + Math.sin(t * 1.3) * 5, ly = cy + Math.sin(t * .9) * 2, blink = (t % 3.2) < .18;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = ((x - cx) / 15) ** 2 + ((y - cy) / (blink ? 1 : 9)) ** 2; if (e > 1) continue;
      const d = Math.hypot(x - lx, (y - ly) * 1.1); put(buf, x, y, d < 2 ? [0, 0, 0] : d < 5 ? hue(.52 + d * .02, .8, 1) : [235, 235, 245]); }
  }
  const HOL_NAME = {text: '', cols: [[255, 255, 255], [255, 255, 255]]};
  // 🌍 the worldwide holidays have no recording in the demo yet: a recording close in spirit stands in (and a note says so once)
  const HOL_STAND = {australiaday: 'fx-pixelfireworks', bastille: 'fx-pixelfireworks', canadaday: 'fx-pixelfireworks', lunarnewyear: 'fx-pixelfireworks', bonfire: 'fire-bonfire',
    carnival: 'look-rainbow-riot', dayofthedead: 'fire-spirit', diwali: 'fire-candles', hanukkah: 'fire-candles', easter: 'look-fairy-forest', eid: 'look-midnight-galaxy',
    holi: 'fx-paintsplash', kingsday: 'look-royal-gold', mothersday: 'holiday-valentine'};
  const holNoted = {};
  // 🌍 holiday calendar (holcal.py snapshot in engine.json): worldwide + what changes per country; dates count down from today
  const HC = {over: 'auto'};
  function holCal() {
    const HCS = ENG.holcal; if (!HCS) return {error: 'no calendar'};
    const base = HCS.base, auto = HC.over === 'auto', code = auto ? 'US' : HC.over, per = HCS.per[code], info = {};
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const day = iso => new Date(iso + 'T00:00:00'), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    Object.entries(base.info).forEach(([k, v]) => { const d = info[k] = Object.assign({}, v, (per && per.info[k]) || {}); if (!d.date) return;
      let s0 = day(d.start), e0 = day(d.end), m0 = day(d.date);
      while (e0 < today) [s0, e0, m0] = [s0, e0, m0].map(x => new Date(x.getFullYear() + 1, x.getMonth(), x.getDate()));   // past this year: about a year on
      Object.assign(d, {start: iso(s0), end: iso(e0), date: iso(m0), days: Math.round((m0 - today) / 864e5), now: s0 <= today && today <= e0}); });
    return Object.assign({}, base, {country: code, country_name: per ? per.name : 'Worldwide', source: auto ? 'location' : 'pick', south: per ? !!per.south : false,
      override: HC.over, mine: per ? per.mine : base.mine, info});
  }

  // ======================================================================= the clock that keeps things moving
  let FIRE = null, lastTick = now();
  function tick() {
    const t = now(), dt = t - lastTick; lastTick = t;
    if (M.playing) { M.pos += dt; M.posAt = t; const cur = M.queue[M.idx]; if (cur && M.pos >= cur.dur) { M.idx = (M.idx + 1) % M.queue.length; songChanged(); } }
    if (M.sleep_at && wall() > M.sleep_at) { M.sleep_at = 0; M.playing = false; }
    const s = SB.s; if (s && s.running) { const c = cfg(); s.clock += c.dir === 'up' ? dt : -dt; if (s.clock <= 0 && c.dir === 'down') { s.clock = 0; s.running = false; } }
    if (s && s.on && s.mode === 'live' && s.live && wall() - SB.liveT > 45) { SB.liveT = wall();                   // the followed game moves on
      if (R() < .5) { const side = R() < .6 ? 'home' : 'away', p = {football: pickOne([3, 7]), basketball: pickOne([2, 3]), baseball: 1}[s.leagues_sport[s.league]] || 1; s.live[side].score += p; DJ.queue.push('confetti'); } }
    if (S.scene) { const sc = S.scene, seg = sc.segs[sc.i] || {}; if (t - sc.t0 > Math.min(30, +seg.seconds || 30)) { sc.i = (sc.i + 1) % sc.segs.length; sc.t0 = t; } }
    if (S.feature && S.feature.until && S.feature.until < t) S.feature = null;
    lpTick(); pdTick(dt);
  }

  // 📶 Oct 19: Light health (the app scores every light from its real check-ins; the demo shows steady, believable readings)
  const HL = {};
  function healthMock() {
    const lights = DEVS.filter(d => DEV_ON[d.id] !== false).map((d, i) => {
      const q = HL[d.id] || (HL[d.id] = Array.from({length: 20}, () => 30 + ((R() * 25) | 0)));
      if (R() < .02) { q.shift(); q.push(30 + ((R() * 25) | 0)); }
      const ms = q.slice().sort((a, b) => a - b)[10];
      return {id: d.id, name: d.name, brand: 'Twinkly', kind: 'wifi', score: 100, state: 'good', ms, missed: 0, tries: q.length, notch: 0, net: true, hist: q.slice(), why: []};
    });
    return {score: 100, state: 'good', lights, t: Math.round(now()), bt_audio: ''};
  }
  // ======================================================================= status (what /api/status returns)
  function status() {
    const si = sectionInfo(), src = lastSrc, t = now(), beat = Math.pow(1 - (beatPos % 1), 2);
    const lvl = S.power ? clamp(lastLevel * 2.2 * (.65 + .35 * beat) + R() * .08, 0, 1) : 0;
    const fp = Object.assign({}, ENG.fire, FIRE), fd = FD.s, w = Object.values(fd.feeds).filter(f => f.kind === 'watch' && f.enabled).map(f => f.title);
    const sc = S.scene ? {name: S.scene.name, segment: S.scene.i + 1, segments: S.scene.segs.length, effects: [S.scene.effects[S.scene.i]]} : null;
    return {filters: fltInfo(), bpm: Math.round(pdTempoBpm() * 10) / 10, section: si.name, prodj: pdBrief(), midi: ENG.midi.brief, cameos: S.cameos, look: S.look, faders: fadersInfo(), override: ovInfo(), loops: loopsBrief(), show: shInfo(), holiday: S.holiday, mirror: null, part: PARTS[si.name] + ' ' + (1 + (si.k >> 2) % 3),
      effect: src.label || S.effect, energy: si.name === 'drop' ? .86 : si.name === 'break' ? .32 : .58, transform: 'none', trail: .4, sparkle: .2,
      brightness: S.brightness, power: S.power, locked: S.locked, blend: S.blend, licensed: true, pro: PRO, scoreboard: !!SB.s.on, fireplace: fp,
      feeds: {mode: fd.mode, title: fd.mode !== 'off' ? fd.feeds[fd.mode].title : '', watching: w, alert: FD.alert ? FD.alert.event : '', flash: '', full_moon: false}, dj: djInfo(),
      shuffle: S.shuffle, characters: S.characters, held_look: S.held, pinned: S.pinned, calm: si.name === 'break' ? .6 : .2, grand: si.name === 'drop' ? .8 : .3,
      level: Math.round(lvl * 100) / 100, sparkles: S.sparkles, pace: S.pace, mood: S.mood || 'auto', scene: sc, text: TX.s.show,
      groups: [{id: 'g1', name: 'Main', w: W, h: H, lights: 2, look: S.look, pinned: !!S.pinned, effect: src.label || S.effect, power: S.power, text: TX.s.show}],
      analysis: {key: 'A minor', mood: si.name === 'drop' ? 'euphoric' : 'groovy', known: 1, drops: 3, downbeat: true}, listening: 'Demo speakers', delay: S.delay, delay_auto: false,
      time: new Date().toTimeString().slice(0, 8)};
  }

  // ======================================================================= /api/control
  // 🏠 Pro Home (demo): house scenes run through the same control path; schedules are kept for this visit only
  const SCH = (() => {
    const SC = {welcome: ['Welcome home', 'home', '#ffb23d', {power: true, look: 'Golden Porch', pace: 'normal', brightness: 80}],
      dinner: ['Dinner', 'candle', '#ff9f5a', {power: true, look: 'Lava Lounge', pace: 'chill', brightness: 45}],
      party: ['Party', 'disco', '#ff3d9a', {power: true, look: 'Neon Party', pace: 'hype', brightness: 100}],
      movie: ['Movie night', 'movie', '#9b3dff', {power: true, look: 'Moonlit', pace: 'chill', brightness: 20}],
      gameday: ['Game day', 'trophy', '#33d6ff', {power: true, look: 'Mainstage', pace: 'hype', brightness: 90}],
      relax: ['Relax', 'moon', '#4de8c8', {power: true, look: 'Deep Sea', pace: 'chill', brightness: 35}],
      bedtime: ['Bedtime', 'moon', '#6677ff', {power: true, look: 'Midnight Galaxy', pace: 'chill', brightness: 10}],
      off: ['All off', 'power', '#ff5c7a', {power: false}]};
    let items = [{id: 's1', name: 'Lights on at sunset', when: 'sunset', time: '19:00', offset: 0, days: [0, 1, 2, 3, 4, 5, 6], action: 'scene', scene: 'welcome', enabled: true},
      {id: 's2', name: 'Off at bedtime', when: 'time', time: '23:30', offset: 0, days: [0, 1, 2, 3, 4, 5, 6], action: 'off', scene: '', enabled: true}];
    const info = () => ({items: items.map(x => Object.assign({}, x, {next: x.enabled ? (x.when === 'sunset' ? 'Today 18:59' : x.when === 'sunrise' ? 'Tomorrow 07:26' : 'Today ' + x.time) : null})),
      scenes: Object.fromEntries(Object.entries(SC).map(([k, v]) => [k, {name: v[0], ic: v[1], c: v[2]}])), sun: {sunrise: '07:26', sunset: '18:59', place: 'Demo house'}, has_loc: true});
    const post = b => {
      if (b.scene) { const v = SC[b.scene]; if (v) { const c = Object.assign({}, v[3]); if (c.look && !LOOK_SET[c.look]) delete c.look; control(c); } return {ok: true}; }
      if (b.save) { const it = Object.assign({}, b.save); it.id = it.id || 's' + Date.now(); items = items.filter(x => x.id !== it.id).concat(it); }
      if (b.delete) items = items.filter(x => x.id !== b.delete);
      if (b.enable) items.forEach(x => { if (x.id === b.enable) x.enabled = !!b.on; });
      return Object.assign({ok: true}, info());
    };
    return {info, post};
  })();
  function control(b) {
    lpObserve('control', b); shObserve('control', b);
    if (['look+', 'look-', 'effect+', 'effect-'].includes(b.step) && !S.scene) {        // 🎛️ DJ skip buttons: the next / previous look or effect
      const st = b.step, dir = st.endsWith('+') ? 1 : -1; S.holiday = null; S.locked = null;
      if (st.startsWith('look')) { const names = Object.keys(CAT.looks), i = names.indexOf(S.look); setLook(names[((i + dir) % names.length + names.length) % names.length], false); S.feature = null; S.held = S.look; }
      else { const lk = CAT.looks[S.look] || {mid: [], high: [], low: []}, pool = [];
        [].concat(lk.mid, lk.high, lk.low).forEach(c => { if (!pool.includes(c)) pool.push(c); });
        const cur = S.feature ? S.feature.name : S.effect, i = pool.indexOf(cur), n = ((i + dir) % pool.length + pool.length) % pool.length, c = pool[n] || S.effect;
        S.effect = c; S.feature = {clip: effectClip(c) || lookClip(S.look, S.lookK), name: c, until: now() + 40, vary: n % 6}; }
    }
    if ('delay' in b) S.delay = clamp(+b.delay || 0, 0, 1000);
    if ('power' in b) S.power = !!b.power;
    if ('brightness' in b) S.brightness = clamp(Math.round(+b.brightness), 0, 100);
    if ('cameos' in b) S.cameos = !!b.cameos;                      // 👁️ the Eyeball switch (LOOKS > Show control)
    if ('blend' in b) S.blend = +b.blend || 1;
    if ('sparkles' in b) S.sparkles = b.sparkles;
    if ('pace' in b) S.pace = b.pace;
    if (MOOD_COLS[b.mood] || b.mood === 'auto' || b.mood === 'holiday') S.mood = b.mood;   // 🎨 Show control > Color mood
    if ('shuffle' in b) S.shuffle = !!b.shuffle;
    if ('characters' in b) S.characters = !!b.characters;
    if ('transition' in b) S.transition = b.transition;
    if ('mirror' in b && b.mirror) return LAPTOP('screen mirror');
    if (b.release) { S.held = null; S.pinned = false; S.locked = null; S.feature = null; }
    if ('lock_effect' in b) { S.locked = b.lock_effect || null; if (S.locked) { S.feature = null; bump('lock'); clearTakeovers(); } }
    if (b.look) { setLook(b.look, b.pin); S.feature = null; S.locked = null; clearTakeovers(); }
    if (b.feature) { S.feature = {clip: effectClip(b.feature), name: b.feature, until: now() + 32}; clearTakeovers(); }
    if (b.skip) { S.feature = null; const lk = CAT.looks[S.look]; if (S.held || !S.shuffle) { S.lookK++; S.effect = pickOne(showyFx(lk.mid.concat(lk.high))); const c = effectClip(S.effect); if (c && c !== lookClip(S.look)) S.feature = {clip: c, name: S.effect, until: now() + 20}; } else { autoLook(); S.lookK = 0; } }
    if (b.surprise) { const all = Object.keys(CLIPS).filter(n => /^(look|fx|wave|shape)-/.test(n)), c = pickOne(all); S.feature = {clip: c, name: titleOf(c), until: now() + 30}; clearTakeovers(); }
    if (b.cameo) S.cameo = now() + 9;
    if ('holiday' in b) {
      const h = b.holiday;
      if (!h) S.holiday = null;
      else if ('country' in h) { const v = String(h.country || 'auto'); HC.over = v === 'auto' || ENG.holcal.per[v.toUpperCase()] ? (v === 'auto' ? 'auto' : v.toUpperCase()) : 'auto'; }
      else { S.holFx = h.fx; const meta = CAT.holidays[h.key]; if (meta) meta.prefs = {fx: h.fx, name: h.name, team: h.team};
        const nm = String(h.name || '').trim().toUpperCase();
        HOL_NAME.text = nm ? (h.key === 'birthday' ? 'HAPPY BIRTHDAY ' + nm : h.key === 'gameday' ? 'GO ' + nm : nm) : '';
        HOL_NAME.cols = h.team ? h.team.map(c => c.map(v => v * 255)) : [[255, 255, 255], [255, 204, 102]];
        if (h.on) { S.holiday = h.key; bump('holiday');
          if (!has('holiday-' + h.key) && !holNoted[h.key]) { holNoted[h.key] = 1; const nm = (CAT.holidays[h.key] || {}).name || h.key;
            setTimeout(() => toast('🎁 ' + nm + ': the demo plays a stand-in recording. The real show runs in the GlowBop app.'), 900); } } }
    }
    return {json: {ok: true, queued: b}};
  }
  function clearTakeovers() { /* a look / effect pick from the console also ends a running scene, like the engine */ S.scene = null; }

  // ======================================================================= 🎛️ controllers (midihub.py snapshot): nothing plugged in, layouts and learn still answer
  const MIDI = {maps: [], settings: null};
  function midiFull() {
    const f = JSON.parse(JSON.stringify(ENG.midi.full));
    f.backend = Object.assign(f.backend, {engine: true, kind: 'demo', reason: ''});      // like a laptop with nothing plugged in yet
    f.mappings = MIDI.maps.slice(); f.pro = PRO; if (MIDI.settings) f.settings = Object.assign(f.settings, MIDI.settings);
    return f;
  }
  function midiPost(b) {
    const ch = [];
    if (b.settings && typeof b.settings === 'object') { MIDI.settings = Object.assign(MIDI.settings || {}, b.settings); ch.push('settings'); }
    if (b.template) { setTimeout(() => toast('🎛️ In the demo no controller is plugged in. On the app, the layout maps every pad and lights its LEDs'), 300); ch.push('template'); }
    if (b.learn) { setTimeout(() => toast('💻 In the demo, DJ controllers need the GlowBop laptop app'), 200); ch.push('learn'); }
    if (b.map && typeof b.map === 'object') ch.push('map');
    if ('clear' in b || 'unmap' in b) { MIDI.maps = []; ch.push('clear'); }
    return {json: {ok: true, changed: ch, midi: ENG.midi.brief}};
  }
  // ======================================================================= ✏️ Draw your layout (layoutmap.py): the editor works, the drawing stays in this tab
  const LAY = {doc: {v: 1, stage: [1000, 600], photo: false, grid: 50, items: []}, photo: null, testing: false,
    zones() { return (this.doc.items || []).filter(i => i.name).map(i => ({name: i.name, group: 'g1', shape: i.tpl || i.kind})); },
    save(b) { const d = b.doc && typeof b.doc === 'object' ? b.doc : {}; this.doc = {v: 1, stage: d.stage || [1000, 600], photo: !!d.photo, grid: d.grid || 50, items: (d.items || []).slice(0, 200)};
      const per = {}; this.doc.items.forEach(i => { if (!i.dev) return; per[i.dev] = (per[i.dev] || 0) + Math.max(0, parseInt(i.count, 10) || 0); });
      setTimeout(() => toast('✏️ Saved in the demo. On the app the show restarts with your layout'), 2600);
      return {ok: true, devices: DEVS.filter(d => per[d.id]).map(d => ({id: d.id, name: d.name, total: 420, shown: Math.min(420, per[d.id]), hidden: Math.max(0, 420 - per[d.id])})), zones: this.zones(), restart: false}; }};
  function layoutInfo() {
    return {doc: Object.assign({}, LAY.doc), zones: LAY.zones(), shapes: [], canvas: {g1: [W, H]}, testing: LAY.testing, mapping: false,
      devices: DEVS.map(d => ({id: d.id, name: d.name, type: 'twinkly', n: 420, enabled: DEV_ON[d.id] !== false, connected: true, drawn: false,
        shape: {kind: 'grid', w: 20, h: H, pts: Array.from({length: 420}, (_, i) => { const c = Math.floor(i / H), r = c % 2 ? H - 1 - (i % H) : i % H; return [Math.round(c / 19 * 1e4) / 1e4, Math.round(r / (H - 1) * 1e4) / 1e4]; })}}))};
  }

  // ======================================================================= 🧵 Lay out your lights (stringlay.js / artboard.js, Oct 17): the two demo curtains plus a
  //   308-bulb string light, laid out in this tab only. GET /api/lights/stage, POST lay / main / place / pick / marks / beep.
  const STG = {main: 'twinkly-192.168.0.164', place: {}, lay: {}, str: {id: 'nanoleaf-192.168.0.170', name: 'String lights', n: 308}, ws: {},
    view: {rot: 0, fx: false, fy: false, zoom: 1, dx: 0, dy: 0}, groups: null};
  // 🧲 which lights share one show (Oct 18 snap to join / split): every demo light starts in the Main show
  const stgGroups = () => STG.groups || (STG.groups = [{id: 'g1', name: 'Main', devices: DEVS.map(d => d.id).concat([STG.str.id])}]);
  const stgName = id => id === STG.str.id ? STG.str.name : ((DEVS.find(d => d.id === id) || {}).name || id);
  const DEMO_RESTART = () => setTimeout(() => toast('🧲 Saved in the demo. On the app the show restarts with the new groups'), 500);
  function stageInfo() {
    const out = DEVS.map(d => { const pl = STG.place[d.id] || [d.x0, 0], pts = [];
      for (let i = 0; i < 420; i++) { const c = Math.floor(i / H), r = c % 2 ? H - 1 - (i % H) : i % H; pts.push([pl[0] + c, pl[1] + r]); }
      return {id: d.id, name: d.name, n: 420, connected: true, kind: 'grid', curtain: false, pts, orient: {rot: 0, flip: false}}; });
    out.push({id: STG.str.id, name: STG.str.name, n: STG.str.n, connected: true, kind: 'string', curtain: false, lay: STG.lay[STG.str.id] || null, back: false, workshop: STG.ws[STG.str.id] || null});
    return {devices: out, limits: [], main: STG.main, view: Object.assign({}, STG.view), groups: stgGroups().map(g => ({id: g.id, name: g.name, devices: g.devices.slice()}))};
  }
  function stageCmd(path, b) {
    if (path === '/api/lights/lay') { if (b.id !== STG.str.id && !DEVS.some(d => d.id === b.id)) return {error: 'no such light'};
      if (b.lay) STG.lay[b.id] = b.lay; else delete STG.lay[b.id];
      setTimeout(() => toast('🧵 Saved in the demo. On the app your lights take the new shape right away'), 400); return {ok: true, lay: STG.lay[b.id] || null}; }
    if (path === '/api/lights/main') { STG.main = String(b.id || ''); return {ok: true, main: STG.main}; }
    if (path === '/api/lights/place') { if (b.place) STG.place[b.id] = [Math.round(+b.place[0] * 2) / 2, Math.round(+b.place[1] * 2) / 2]; return {ok: true}; }
    if (path === '/api/lights/pick') return {ok: true};
    if (path === '/api/lights/marks') return {ok: true};
    if (path === '/api/lights/beep') return b.reset ? {ok: true, before: 0.9, after: 1} : {ok: true, before: 1, after: 0.9, waiting: false, floor: false};
    if (path === '/api/lights/view') { const v = STG.view, op = String(b.op || '');            // 🎬 turn / mirror / zoom / slide the whole show
      if (op === 'cw') v.rot = (v.rot + 90) % 360; else if (op === 'ccw') v.rot = (v.rot + 270) % 360; else if (op === 'fx') v.fx = !v.fx; else if (op === 'fy') v.fy = !v.fy;
      else if (op === 'zin') v.zoom = clamp(v.zoom * 1.15, .25, 4); else if (op === 'zout') v.zoom = clamp(v.zoom / 1.15, .25, 4);
      else if (op === 'left' || op === 'right') v.dx = clamp(v.dx + (op === 'left' ? -.05 : .05), -1, 1); else if (op === 'up' || op === 'down') v.dy = clamp(v.dy + (op === 'up' ? -.05 : .05), -1, 1);
      else if (op === 'center') v.dx = v.dy = 0; else if (op === 'reset') Object.assign(v, {rot: 0, fx: false, fy: false, zoom: 1, dx: 0, dy: 0});
      v.zoom = Math.round(v.zoom * 1000) / 1000; v.dx = Math.round(v.dx * 100) / 100; v.dy = Math.round(v.dy * 100) / 100;
      return {ok: true, view: Object.assign({}, v)}; }
    // 🩺 Check my lights (checkup.py): the demo lights are always healthy
    if (path === '/api/lights/checkup') return {ok: true, t: wall(), findings: DEVS.filter(d => DEV_ON[d.id] !== false).map(d => ({lvl: 'ok', ic: 'wifi', title: d.name + ' (Twinkly): Wi-Fi good', body: 'Answered every check-in in about ' + (18 + ((R() * 14) | 0)) + ' ms.', fix: null}))
      .concat([{lvl: 'ok', ic: 'wifi', title: STG.str.name + ' (Nanoleaf): Wi-Fi good', body: 'Answered every check-in in about ' + (25 + ((R() * 20) | 0)) + ' ms.', fix: null},
               {lvl: 'ok', ic: 'check', title: 'Curtains line up on the map', body: 'No overlaps or gaps. If one still looks upside down or backwards on the wall, run the line-up and turn or flip it.', fix: {label: 'Run the line-up', act: 'lineup', ids: []}}])};
    if (path === '/api/lights/fixup') { if (b.act === 'lineup') { LINEUP.on = true; LINEUP.until = now() + 60; return {ok: true, msg: 'Line-up is on: every curtain shows its number and an arrow that should point up'}; }
      if (b.act === 'restart') return {ok: true, msg: 'In the demo nothing needs restarting', restart: false};
      return {ok: true, msg: 'Fixed (in the demo, nothing on a real light changed)'}; }
    // 🧲 snap to join / split into its own show / undo (in this tab only)
    if (path === '/api/lights/join' || path === '/api/lights/split' || path === '/api/lights/regroup') {
      const gs = stgGroups(), prev = gs.map(g => ({id: g.id, name: g.name, devices: g.devices.slice()}));
      if (path === '/api/lights/regroup') { const ng = (b.groups || []).filter(g => g && Array.isArray(g.devices) && g.devices.length).map(g => ({id: String(g.id), name: String(g.name || g.id), devices: g.devices.slice()}));
        STG.groups = ng.length ? ng : null; return {ok: true, restart: true, prev, msg: 'Groups put back'}; }
      const gi = gs.find(g => g.devices.includes(b.id)); if (!gi) return {error: 'no such light'};
      if (path === '/api/lights/join') { const gt = gs.find(g => g.devices.includes(b.to)); if (!gt) return {error: 'no such light'};
        if (gt === gi) return {ok: true, same: true, group: gt.name};
        const [keep, gone] = gs.indexOf(gi) < gs.indexOf(gt) ? [gi, gt] : [gt, gi], big = gi.devices.length > gt.devices.length ? gi : gt.devices.length > gi.devices.length ? gt : keep;
        const nm = big.devices.length > 1 ? big.name : 'Wall'; keep.devices = keep.devices.concat(gone.devices); keep.name = nm; STG.groups = gs.filter(g => g !== gone);
        DEMO_RESTART(); return {ok: true, restart: true, prev, msg: stgName(b.id) + ' and ' + stgName(b.to) + ' are one show now (' + nm + ')'}; }
      if (gi.devices.length < 2) return {ok: true, same: true, group: gi.name};
      gi.devices = gi.devices.filter(x => x !== b.id); let k = gs.length + 1; while (gs.some(g => g.id === 'g' + k)) k++;
      gs.push({id: 'g' + k, name: stgName(b.id).slice(0, 30), devices: [b.id]}); DEMO_RESTART();
      return {ok: true, restart: true, prev, msg: stgName(b.id) + ' is its own show'}; }
    return null;
  }
  // ======================================================================= 📌 Tonight's list + 🎉 show behind the scores (tonight.py)
  const TNS = {items: [], mode: 'wall', on: false, secs: 90, behind: false, dim: 0.25, msg: ''};
  function tnClean(it) { if (!it || typeof it !== 'object') return null; const t = String(it.title || '').slice(0, 60);
    if (it.kind === 'f1') return {kind: 'f1', key: 'f1', title: t || 'Formula 1'};
    if (it.kind === 'board' && ['golf', 'nascar', 'tennis', 'ufc'].includes(it.bk)) return {kind: 'board', bk: it.bk, key: 'board:' + it.bk, title: t || it.bk.toUpperCase()};
    if (it.kind === 'game' && it.league && it.team_id) return {kind: 'game', league: String(it.league), team_id: String(it.team_id), team_name: String(it.team_name || ''), other_id: String(it.other_id || ''), key: 'team:' + it.league + ':' + it.team_id, title: t || String(it.league).toUpperCase()};
    return null; }
  function tonightInfo() { const cur = TNS.on && TNS.mode === 'wall' && TNS.items.length ? TNS.items[Math.floor(wall() / TNS.secs) % TNS.items.length].key : null;
    return {items: TNS.items, mode: TNS.mode, on: TNS.on, secs: TNS.secs, behind: TNS.behind, dim: TNS.dim, cur, next_in: cur ? Math.max(0, Math.round(TNS.secs - wall() % TNS.secs)) : null,
      wall: null, wall_in: false, msg: TNS.msg}; }
  function tonightCmd(b) {
    if (b.add_current) { TNS.msg = 'Put a game or race on the wall first, then add it'; return; }
    if (b.add) { const it = tnClean(b.add); if (it && !TNS.items.some(x => x.key === it.key)) TNS.items = TNS.items.concat([it]).slice(-12); if (it) TNS.msg = '📌 ' + it.title + ' added'; }
    if (b.remove) TNS.items = TNS.items.filter(x => x.key !== b.remove);
    if (b.move) { const ks = TNS.items.map(x => x.key), i = ks.indexOf(b.move); if (i >= 0) { const j = Math.max(0, Math.min(ks.length - 1, i + (+b.delta || -1))); TNS.items.splice(j, 0, TNS.items.splice(i, 1)[0]); } }
    if (b.clear) TNS.items = [];
    if (b.mode === 'wall' || b.mode === 'ticker') TNS.mode = b.mode;
    if ('secs' in b) TNS.secs = Math.max(30, Math.min(600, Math.round(+b.secs || 90)));
    if ('behind' in b) TNS.behind = !!b.behind;
    if ('dim' in b) TNS.dim = Math.max(0.1, Math.min(0.5, +b.dim || 0.25));
    if ('on' in b) TNS.on = !!b.on && TNS.items.length > 0;
    if (!TNS.items.length) TNS.on = false;
  }

  // ======================================================================= 🖥️ mirror: pick a laptop screen · 🪧 art projects (signs), kept in this tab
  const MIRROR_SCREENS = [{i: 1, w: 1920, h: 1080, primary: true}, {i: 2, w: 2560, h: 1440, primary: false}];
  let MIRROR_PICK = 0;
  const ART = {}; let artSeeded = null;
  function artSeed() {                                              // the GlowBop logo sign is the starter project, like on the app
    return artSeeded || (artSeeded = realFetch(here('ui/templates/GlowBop-Logo-Sign-308.glowbop')).then(r => r.json())
      .then(j => { if (!Object.keys(ART).length) ART['glowbop-logo-sign'] = Object.assign(j, {name: 'GlowBop Logo Sign', updated: wall()}); }).catch(() => {}));
  }

  let QUIT = false;
  // ======================================================================= the router

  // ======================================================================= 🎭 STAGE & 🏡 YARD (Oct 21): a small stand-in for stage.py so the demo's STAGE tab
  //   and HOUSE → Yard plan work. Templates, types and the starter yard come from the real engine (generated); colours come from the
  //   demo's own picture; moving heads sweep on the demo's beat and slam on its drops. Sending to real DMX gear needs the laptop app.
  const STD = {"tpl":{"club":{"v":1,"name":"Club stage","template":"club","size":{"w":24.0,"d":12.0},"items":[{"id":"b1626e804","kind":"deck","name":"Stage deck","x":0,"y":6.0,"w":24.0,"d":12.0,"h":2,"z":0.0,"rot":0.0},{"id":"b36956575","kind":"dj","name":"DJ riser","x":0,"y":5.4,"w":7.0,"d":3,"h":3.5,"z":2,"rot":0.0},{"id":"bda1f3e15","kind":"screen","name":"Backdrop (LED wall)","x":0,"y":11.7,"w":14.4,"d":0.4,"h":10,"z":2,"rot":0.0},{"id":"b7f606832","kind":"truss","name":"Front truss","x":0,"y":1,"w":24.0,"d":1,"h":1,"z":14,"rot":0.0},{"id":"b60afafdb","kind":"truss","name":"Back truss","x":0,"y":11.0,"w":24.0,"d":1,"h":1,"z":15,"rot":0.0},{"id":"bf015106c","kind":"speaker","name":"Left speakers","x":-14.0,"y":1,"w":2.5,"d":2.5,"h":6,"z":0.0,"rot":0.0},{"id":"b79e00e91","kind":"speaker","name":"Right speakers","x":14.0,"y":1,"w":2.5,"d":2.5,"h":6,"z":0.0,"rot":0.0}],"fixtures":[{"id":"f5b942c5b","type":"par_drgbs","name":"Par 1","x":-10.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f6d3c2ed9","type":"par_drgbs","name":"Par 2","x":-6.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":6,"inv_pan":false,"inv_tilt":false},{"id":"f5e0a4a3b","type":"par_drgbs","name":"Par 3","x":-2.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"f8be5b23d","type":"par_drgbs","name":"Par 4","x":2.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":16,"inv_pan":false,"inv_tilt":false},{"id":"f530d6aa0","type":"par_drgbs","name":"Par 5","x":6.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":21,"inv_pan":false,"inv_tilt":false},{"id":"f825591e4","type":"par_drgbs","name":"Par 6","x":10.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":26,"inv_pan":false,"inv_tilt":false},{"id":"fb3ad3368","type":"bar_8","name":"LED bar 1","x":-6.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":31,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"f2dd57379","type":"bar_8","name":"LED bar 2","x":6.0,"y":1,"z":13.5,"rot":0.0,"hang":true,"univ":1,"addr":55,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fb9de32eb","type":"wash","name":"Wash 1","x":-9.0,"y":11.0,"z":14.5,"rot":0.0,"hang":true,"univ":1,"addr":79,"inv_pan":false,"inv_tilt":false},{"id":"fdede7075","type":"wash","name":"Wash 2","x":-3.0,"y":11.0,"z":14.5,"rot":0.0,"hang":true,"univ":1,"addr":90,"inv_pan":false,"inv_tilt":false},{"id":"fce95dfa6","type":"wash","name":"Wash 3","x":3.0,"y":11.0,"z":14.5,"rot":0.0,"hang":true,"univ":1,"addr":101,"inv_pan":false,"inv_tilt":false},{"id":"f7515bdd2","type":"wash","name":"Wash 4","x":9.0,"y":11.0,"z":14.5,"rot":0.0,"hang":true,"univ":1,"addr":112,"inv_pan":false,"inv_tilt":false},{"id":"fe50fe3b9","type":"uplight","name":"Uplight 1","x":-9.0,"y":11.5,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":123,"inv_pan":false,"inv_tilt":false},{"id":"f33f143b1","type":"uplight","name":"Uplight 2","x":-3.0,"y":11.5,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":129,"inv_pan":false,"inv_tilt":false},{"id":"f0523efa6","type":"uplight","name":"Uplight 3","x":3.0,"y":11.5,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":135,"inv_pan":false,"inv_tilt":false},{"id":"f56656380","type":"uplight","name":"Uplight 4","x":9.0,"y":11.5,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":141,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"band":{"v":1,"name":"Bar band stage","template":"band","size":{"w":16.0,"d":10.0},"items":[{"id":"b1f989bbb","kind":"deck","name":"Stage deck","x":0,"y":5.0,"w":16.0,"d":10.0,"h":1.5,"z":0.0,"rot":0.0},{"id":"b24f27367","kind":"pipe","name":"Front pipe","x":0,"y":0.5,"w":16.0,"d":0.3,"h":0.3,"z":10,"rot":0.0},{"id":"b5d3064c4","kind":"band","name":"Band","x":0,"y":6.0,"w":11.2,"d":5.0,"h":6,"z":1.5,"rot":0.0},{"id":"b9af47df3","kind":"screen","name":"Backdrop","x":0,"y":9.8,"w":12.8,"d":0.3,"h":8,"z":1.5,"rot":0.0}],"fixtures":[{"id":"f9c2ab631","type":"par_drgbs","name":"Par 1","x":-6.0,"y":0.5,"z":9.6,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f9f776305","type":"par_drgbs","name":"Par 2","x":-2.0,"y":0.5,"z":9.6,"rot":0.0,"hang":true,"univ":1,"addr":6,"inv_pan":false,"inv_tilt":false},{"id":"f3837a146","type":"par_drgbs","name":"Par 3","x":2.0,"y":0.5,"z":9.6,"rot":0.0,"hang":true,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"f0bc959a3","type":"par_drgbs","name":"Par 4","x":6.0,"y":0.5,"z":9.6,"rot":0.0,"hang":true,"univ":1,"addr":16,"inv_pan":false,"inv_tilt":false},{"id":"f3bc76acb","type":"bar_8","name":"LED bar 1","x":-4.0,"y":0.4,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":21,"inv_pan":false,"inv_tilt":false},{"id":"fdc47061c","type":"bar_8","name":"LED bar 2","x":4.0,"y":0.4,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":45,"inv_pan":false,"inv_tilt":false},{"id":"f5e25929d","type":"wash","name":"Wash 1","x":-5.33,"y":9.3,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":69,"inv_pan":false,"inv_tilt":false},{"id":"f0a0dd839","type":"wash","name":"Wash 2","x":5.33,"y":9.3,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":80,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"festival":{"v":1,"name":"Festival truss","template":"festival","size":{"w":40.0,"d":24.0},"items":[{"id":"b3bc63059","kind":"deck","name":"Stage deck","x":0,"y":12.0,"w":40.0,"d":24.0,"h":5,"z":0.0,"rot":0.0},{"id":"b7d72f7cf","kind":"truss","name":"Front truss","x":0,"y":1.5,"w":40.0,"d":1.5,"h":1.5,"z":24,"rot":0.0},{"id":"b57a63a0a","kind":"truss","name":"Mid truss","x":0,"y":12.0,"w":40.0,"d":1.5,"h":1.5,"z":26,"rot":0.0},{"id":"b942b8ac1","kind":"truss","name":"Back truss","x":0,"y":22.5,"w":40.0,"d":1.5,"h":1.5,"z":28,"rot":0.0},{"id":"b2b2820a8","kind":"screen","name":"Left screen","x":-27.0,"y":2,"w":12,"d":0.5,"h":7,"z":10,"rot":0.0},{"id":"b81111603","kind":"screen","name":"Right screen","x":27.0,"y":2,"w":12,"d":0.5,"h":7,"z":10,"rot":0.0},{"id":"b965ba4c0","kind":"screen","name":"Back LED wall","x":0,"y":23.7,"w":24.0,"d":0.5,"h":12,"z":8,"rot":0.0}],"fixtures":[{"id":"fd562723d","type":"spot","name":"Spot 1","x":-17.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"fe3ad3868","type":"spot","name":"Spot 2","x":-12.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":10,"inv_pan":false,"inv_tilt":false},{"id":"f1e862523","type":"spot","name":"Spot 3","x":-7.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":19,"inv_pan":false,"inv_tilt":false},{"id":"f7f6cfa45","type":"spot","name":"Spot 4","x":-2.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":28,"inv_pan":false,"inv_tilt":false},{"id":"f18a2370d","type":"spot","name":"Spot 5","x":2.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":37,"inv_pan":false,"inv_tilt":false},{"id":"fa2b79635","type":"spot","name":"Spot 6","x":7.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":46,"inv_pan":false,"inv_tilt":false},{"id":"fb955a5af","type":"spot","name":"Spot 7","x":12.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":55,"inv_pan":false,"inv_tilt":false},{"id":"f23e685f1","type":"spot","name":"Spot 8","x":17.5,"y":1.5,"z":23.3,"rot":0.0,"hang":true,"univ":1,"addr":64,"inv_pan":false,"inv_tilt":false},{"id":"f7ba31405","type":"wash","name":"Wash 1","x":-17.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":73,"inv_pan":false,"inv_tilt":false},{"id":"f3a92242a","type":"wash","name":"Wash 2","x":-12.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":84,"inv_pan":false,"inv_tilt":false},{"id":"f33478367","type":"wash","name":"Wash 3","x":-7.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":95,"inv_pan":false,"inv_tilt":false},{"id":"f977ef176","type":"wash","name":"Wash 4","x":-2.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":106,"inv_pan":false,"inv_tilt":false},{"id":"fedc8a60f","type":"wash","name":"Wash 5","x":2.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":117,"inv_pan":false,"inv_tilt":false},{"id":"ff0e8ca29","type":"wash","name":"Wash 6","x":7.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":128,"inv_pan":false,"inv_tilt":false},{"id":"f2ed66666","type":"wash","name":"Wash 7","x":12.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":139,"inv_pan":false,"inv_tilt":false},{"id":"f41f50cfa","type":"wash","name":"Wash 8","x":17.5,"y":12.0,"z":25.3,"rot":0.0,"hang":true,"univ":1,"addr":150,"inv_pan":false,"inv_tilt":false},{"id":"f2078020f","type":"beam","name":"Beam 1","x":-17.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":161,"inv_pan":false,"inv_tilt":false},{"id":"fea9d0319","type":"beam","name":"Beam 2","x":-12.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":171,"inv_pan":false,"inv_tilt":false},{"id":"fba55e254","type":"beam","name":"Beam 3","x":-7.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":181,"inv_pan":false,"inv_tilt":false},{"id":"f0dff255d","type":"beam","name":"Beam 4","x":-2.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":191,"inv_pan":false,"inv_tilt":false},{"id":"f3056e667","type":"beam","name":"Beam 5","x":2.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":201,"inv_pan":false,"inv_tilt":false},{"id":"f89506b06","type":"beam","name":"Beam 6","x":7.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":211,"inv_pan":false,"inv_tilt":false},{"id":"f86bd0b7a","type":"beam","name":"Beam 7","x":12.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":221,"inv_pan":false,"inv_tilt":false},{"id":"f524ad548","type":"beam","name":"Beam 8","x":17.5,"y":22.5,"z":27.3,"rot":0.0,"hang":true,"univ":1,"addr":231,"inv_pan":false,"inv_tilt":false},{"id":"f443e4c4c","type":"bar_12","name":"LED bar 1","x":-16.67,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":241,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f9267138e","type":"bar_12","name":"LED bar 2","x":-10.0,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":277,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f90c12730","type":"bar_12","name":"LED bar 3","x":-3.33,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":313,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f1299b816","type":"bar_12","name":"LED bar 4","x":3.33,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":349,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"febf32b92","type":"bar_12","name":"LED bar 5","x":10.0,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":385,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f40729d98","type":"bar_12","name":"LED bar 6","x":16.67,"y":0.6,"z":5.6,"rot":0.0,"hang":false,"univ":1,"addr":421,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f76b32f94","type":"par_drgbs","name":"Par 1","x":-21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":457,"inv_pan":false,"inv_tilt":false},{"id":"f4fc3e319","type":"par_drgbs","name":"Par 2","x":-21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":462,"inv_pan":false,"inv_tilt":false},{"id":"f03d27133","type":"par_drgbs","name":"Par 3","x":-21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":467,"inv_pan":false,"inv_tilt":false},{"id":"f0f7c8b6c","type":"par_drgbs","name":"Par 4","x":21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":472,"inv_pan":false,"inv_tilt":false},{"id":"f0c68fd46","type":"par_drgbs","name":"Par 5","x":21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":477,"inv_pan":false,"inv_tilt":false},{"id":"fe6d9d7f8","type":"par_drgbs","name":"Par 6","x":21.0,"y":2,"z":5.5,"rot":0.0,"hang":false,"univ":1,"addr":482,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"theater":{"v":1,"name":"Theater","template":"theater","size":{"w":36.0,"d":28.0},"items":[{"id":"b97a0a789","kind":"deck","name":"Stage","x":0,"y":14.0,"w":36.0,"d":28.0,"h":3,"z":0.0,"rot":0.0},{"id":"b0207647a","kind":"wall","name":"Proscenium arch","x":0,"y":0.2,"w":44.0,"d":0.5,"h":22,"z":0.0,"rot":0.0},{"id":"bfca39d5c","kind":"truss","name":"Front of house truss","x":0,"y":-20,"w":36.0,"d":1,"h":1,"z":22,"rot":0.0},{"id":"b1e3e3e42","kind":"pipe","name":"1st electric","x":0,"y":5,"w":36.0,"d":0.3,"h":0.3,"z":20,"rot":0.0},{"id":"b3b2afb41","kind":"pipe","name":"2nd electric","x":0,"y":14,"w":36.0,"d":0.3,"h":0.3,"z":20,"rot":0.0},{"id":"bb35cfffe","kind":"totem","name":"Side boom","x":-19.5,"y":6,"w":1,"d":1,"h":12,"z":0.0,"rot":0.0},{"id":"b467f7e8c","kind":"totem","name":"Side boom","x":19.5,"y":6,"w":1,"d":1,"h":12,"z":0.0,"rot":0.0}],"fixtures":[{"id":"f251d8a3d","type":"par_7","name":"Par 1","x":-15.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"fea7dcfeb","type":"par_7","name":"Par 2","x":-9.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":8,"inv_pan":false,"inv_tilt":false},{"id":"fba05c9d7","type":"par_7","name":"Par 3","x":-3.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":15,"inv_pan":false,"inv_tilt":false},{"id":"f49412abf","type":"par_7","name":"Par 4","x":3.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":22,"inv_pan":false,"inv_tilt":false},{"id":"fcf7dba03","type":"par_7","name":"Par 5","x":9.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":29,"inv_pan":false,"inv_tilt":false},{"id":"f47c4c9ee","type":"par_7","name":"Par 6","x":15.0,"y":-20,"z":21.5,"rot":0.0,"hang":true,"univ":1,"addr":36,"inv_pan":false,"inv_tilt":false},{"id":"fdd3e9319","type":"par_7","name":"Par 7","x":-15.75,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":43,"inv_pan":false,"inv_tilt":false},{"id":"fd52d9f7a","type":"par_7","name":"Par 8","x":-11.25,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":50,"inv_pan":false,"inv_tilt":false},{"id":"fceb14762","type":"par_7","name":"Par 9","x":-6.75,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":57,"inv_pan":false,"inv_tilt":false},{"id":"f156a581c","type":"par_7","name":"Par 10","x":-2.25,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":64,"inv_pan":false,"inv_tilt":false},{"id":"f632b31ee","type":"par_7","name":"Par 11","x":2.25,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":71,"inv_pan":false,"inv_tilt":false},{"id":"f3260e851","type":"par_7","name":"Par 12","x":6.75,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":78,"inv_pan":false,"inv_tilt":false},{"id":"ff21a99bc","type":"par_7","name":"Par 13","x":11.25,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":85,"inv_pan":false,"inv_tilt":false},{"id":"f3ff7bafb","type":"par_7","name":"Par 14","x":15.75,"y":5,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":92,"inv_pan":false,"inv_tilt":false},{"id":"fe5ed7441","type":"spot","name":"Spot 1","x":-13.5,"y":14,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":99,"inv_pan":false,"inv_tilt":false},{"id":"fcc611675","type":"spot","name":"Spot 2","x":-4.5,"y":14,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":108,"inv_pan":false,"inv_tilt":false},{"id":"f9a6b8211","type":"spot","name":"Spot 3","x":4.5,"y":14,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":117,"inv_pan":false,"inv_tilt":false},{"id":"f44134f4e","type":"spot","name":"Spot 4","x":13.5,"y":14,"z":19.6,"rot":0.0,"hang":true,"univ":1,"addr":126,"inv_pan":false,"inv_tilt":false},{"id":"f228f9977","type":"par_rgbw","name":"RGBW par 1","x":-19.5,"y":6,"z":4,"rot":90,"hang":false,"univ":1,"addr":135,"inv_pan":false,"inv_tilt":false},{"id":"f60901d4d","type":"par_rgbw","name":"RGBW par 2","x":-19.5,"y":6,"z":7,"rot":90,"hang":false,"univ":1,"addr":139,"inv_pan":false,"inv_tilt":false},{"id":"f0a4e8f70","type":"par_rgbw","name":"RGBW par 3","x":-19.5,"y":6,"z":10,"rot":90,"hang":false,"univ":1,"addr":143,"inv_pan":false,"inv_tilt":false},{"id":"f87caa065","type":"par_rgbw","name":"RGBW par 4","x":19.5,"y":6,"z":4,"rot":-90,"hang":false,"univ":1,"addr":147,"inv_pan":false,"inv_tilt":false},{"id":"f0ca25486","type":"par_rgbw","name":"RGBW par 5","x":19.5,"y":6,"z":7,"rot":-90,"hang":false,"univ":1,"addr":151,"inv_pan":false,"inv_tilt":false},{"id":"fff15b392","type":"par_rgbw","name":"RGBW par 6","x":19.5,"y":6,"z":10,"rot":-90,"hang":false,"univ":1,"addr":155,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"church":{"v":1,"name":"Church / venue hall","template":"church","size":{"w":28.0,"d":14.0},"items":[{"id":"b4541f268","kind":"deck","name":"Platform","x":0,"y":7.0,"w":28.0,"d":14.0,"h":2,"z":0.0,"rot":0.0},{"id":"bc0cbcfa7","kind":"screen","name":"Centre screen","x":0,"y":13.7,"w":14.0,"d":0.4,"h":8,"z":6,"rot":0.0},{"id":"b7d928613","kind":"truss","name":"Front wash truss","x":0,"y":-4,"w":28.0,"d":1,"h":1,"z":16,"rot":0.0},{"id":"b47ba5424","kind":"truss","name":"Back truss","x":0,"y":12.0,"w":28.0,"d":1,"h":1,"z":17,"rot":0.0}],"fixtures":[{"id":"fc62dd51c","type":"par_rgbw","name":"RGBW par 1","x":-11.67,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f6ee6a3e3","type":"par_rgbw","name":"RGBW par 2","x":-7.0,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":5,"inv_pan":false,"inv_tilt":false},{"id":"f3914edeb","type":"par_rgbw","name":"RGBW par 3","x":-2.33,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":9,"inv_pan":false,"inv_tilt":false},{"id":"f1ffd4b2e","type":"par_rgbw","name":"RGBW par 4","x":2.33,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":13,"inv_pan":false,"inv_tilt":false},{"id":"f2d1bb6e4","type":"par_rgbw","name":"RGBW par 5","x":7.0,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":17,"inv_pan":false,"inv_tilt":false},{"id":"f7ef8cfae","type":"par_rgbw","name":"RGBW par 6","x":11.67,"y":-4,"z":15.5,"rot":0.0,"hang":true,"univ":1,"addr":21,"inv_pan":false,"inv_tilt":false},{"id":"f4465ccf7","type":"wash","name":"Wash 1","x":-10.5,"y":12.0,"z":16.5,"rot":0.0,"hang":true,"univ":1,"addr":25,"inv_pan":false,"inv_tilt":false},{"id":"fe313e259","type":"wash","name":"Wash 2","x":-3.5,"y":12.0,"z":16.5,"rot":0.0,"hang":true,"univ":1,"addr":36,"inv_pan":false,"inv_tilt":false},{"id":"f406e7e56","type":"wash","name":"Wash 3","x":3.5,"y":12.0,"z":16.5,"rot":0.0,"hang":true,"univ":1,"addr":47,"inv_pan":false,"inv_tilt":false},{"id":"f9a0a2877","type":"wash","name":"Wash 4","x":10.5,"y":12.0,"z":16.5,"rot":0.0,"hang":true,"univ":1,"addr":58,"inv_pan":false,"inv_tilt":false},{"id":"f955ed50d","type":"uplight","name":"Uplight 1","x":-11.67,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":69,"inv_pan":false,"inv_tilt":false},{"id":"f09ca6410","type":"uplight","name":"Uplight 2","x":-7.0,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":75,"inv_pan":false,"inv_tilt":false},{"id":"f777b17b9","type":"uplight","name":"Uplight 3","x":-2.33,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":81,"inv_pan":false,"inv_tilt":false},{"id":"f9240e488","type":"uplight","name":"Uplight 4","x":2.33,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":87,"inv_pan":false,"inv_tilt":false},{"id":"fe7878bc6","type":"uplight","name":"Uplight 5","x":7.0,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":93,"inv_pan":false,"inv_tilt":false},{"id":"fdb836aad","type":"uplight","name":"Uplight 6","x":11.67,"y":13.8,"z":2,"rot":0.0,"hang":false,"univ":1,"addr":99,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"dj":{"v":1,"name":"DJ booth","template":"dj","size":{"w":12.0,"d":8.0},"items":[{"id":"b175ff836","kind":"dj","name":"DJ booth","x":0,"y":4.0,"w":8.0,"d":3,"h":3.6,"z":0.0,"rot":0.0},{"id":"ba85501b8","kind":"truss","name":"Arch truss","x":0,"y":7.2,"w":12.0,"d":1,"h":1,"z":10,"rot":0.0},{"id":"bb054e166","kind":"screen","name":"Backdrop","x":0,"y":7.8,"w":8,"d":0.3,"h":7,"z":0,"rot":0.0},{"id":"bbc931cfb","kind":"totem","name":"Totem","x":-5.2,"y":4.0,"w":1,"d":1,"h":7,"z":0.0,"rot":0.0},{"id":"b20740ac2","kind":"totem","name":"Totem","x":5.2,"y":4.0,"w":1,"d":1,"h":7,"z":0.0,"rot":0.0}],"fixtures":[{"id":"f240cff90","type":"beam","name":"Beam 1","x":-5.2,"y":4.0,"z":7.3,"rot":0.0,"hang":false,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f7e230d67","type":"par_drgbs","name":"Par 1","x":-5.2,"y":3.4,"z":4,"rot":0.0,"hang":false,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"fc694283e","type":"beam","name":"Beam 2","x":5.2,"y":4.0,"z":7.3,"rot":0.0,"hang":false,"univ":1,"addr":16,"inv_pan":false,"inv_tilt":false},{"id":"fd6b3eba9","type":"par_drgbs","name":"Par 2","x":5.2,"y":3.4,"z":4,"rot":0.0,"hang":false,"univ":1,"addr":26,"inv_pan":false,"inv_tilt":false},{"id":"f2680d07d","type":"bar_8","name":"LED bar 1","x":-2.0,"y":7.2,"z":9.5,"rot":0.0,"hang":true,"univ":1,"addr":31,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fd1c5c716","type":"bar_8","name":"LED bar 2","x":2.0,"y":7.2,"z":9.5,"rot":0.0,"hang":true,"univ":1,"addr":55,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fb78a6873","type":"uplight","name":"Uplight 1","x":-4.5,"y":7.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":79,"inv_pan":false,"inv_tilt":false},{"id":"f256bbd1b","type":"uplight","name":"Uplight 2","x":-1.5,"y":7.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":85,"inv_pan":false,"inv_tilt":false},{"id":"f93b6bb4e","type":"uplight","name":"Uplight 3","x":1.5,"y":7.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":91,"inv_pan":false,"inv_tilt":false},{"id":"f92afd89e","type":"uplight","name":"Uplight 4","x":4.5,"y":7.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":97,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"wedding":{"v":1,"name":"Wedding reception","template":"wedding","size":{"w":24.0,"d":8.0},"items":[{"id":"b36739065","kind":"deck","name":"DJ stage","x":0,"y":4.0,"w":24.0,"d":8.0,"h":1.5,"z":0.0,"rot":0.0},{"id":"b4a2bf7b7","kind":"dj","name":"DJ booth","x":0,"y":3.6,"w":7.0,"d":3,"h":3.6,"z":1.5,"rot":0.0},{"id":"bcbc90c38","kind":"screen","name":"Backdrop","x":0,"y":7.7,"w":12.0,"d":0.3,"h":8,"z":1.5,"rot":0.0},{"id":"b1f8cf68a","kind":"riser","name":"Dance floor","x":0,"y":-12,"w":24.0,"d":20,"h":0.2,"z":0.0,"rot":0.0},{"id":"b03a06fa2","kind":"truss","name":"Dance floor truss","x":0,"y":-12,"w":24.0,"d":1,"h":1,"z":14,"rot":0.0},{"id":"b779eb967","kind":"totem","name":"Totem","x":-11.0,"y":4.0,"w":1,"d":1,"h":7,"z":1.5,"rot":0.0},{"id":"ba7344652","kind":"totem","name":"Totem","x":11.0,"y":4.0,"w":1,"d":1,"h":7,"z":1.5,"rot":0.0},{"id":"b97f4fd40","kind":"wall","name":"Back wall of the room","x":0,"y":-31,"w":70.0,"d":0.5,"h":12,"z":0.0,"rot":0.0}],"fixtures":[{"id":"f3367846e","type":"beam","name":"Beam 1","x":-11.0,"y":4.0,"z":8.8,"rot":0.0,"hang":false,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"ffe6ebede","type":"beam","name":"Beam 2","x":11.0,"y":4.0,"z":8.8,"rot":0.0,"hang":false,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"ff3a23b66","type":"wash","name":"Wash 1","x":-7.5,"y":-12,"z":13.4,"rot":0.0,"hang":true,"univ":1,"addr":21,"inv_pan":false,"inv_tilt":false},{"id":"f0c8f98ac","type":"wash","name":"Wash 2","x":-2.5,"y":-12,"z":13.4,"rot":0.0,"hang":true,"univ":1,"addr":32,"inv_pan":false,"inv_tilt":false},{"id":"f38f874a7","type":"wash","name":"Wash 3","x":2.5,"y":-12,"z":13.4,"rot":0.0,"hang":true,"univ":1,"addr":43,"inv_pan":false,"inv_tilt":false},{"id":"f3dd25d11","type":"wash","name":"Wash 4","x":7.5,"y":-12,"z":13.4,"rot":0.0,"hang":true,"univ":1,"addr":54,"inv_pan":false,"inv_tilt":false},{"id":"f6c03e844","type":"uplight","name":"Uplight 1","x":-26.0,"y":-30,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":65,"inv_pan":false,"inv_tilt":false},{"id":"ff547dff4","type":"uplight","name":"Uplight 2","x":-26.0,"y":6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":71,"inv_pan":false,"inv_tilt":false},{"id":"f70e1c723","type":"uplight","name":"Uplight 3","x":-13.0,"y":-30,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":77,"inv_pan":false,"inv_tilt":false},{"id":"fd2f63168","type":"uplight","name":"Uplight 4","x":-13.0,"y":6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":83,"inv_pan":false,"inv_tilt":false},{"id":"f4a39609e","type":"uplight","name":"Uplight 5","x":13.0,"y":-30,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":89,"inv_pan":false,"inv_tilt":false},{"id":"f436801e7","type":"uplight","name":"Uplight 6","x":13.0,"y":6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":95,"inv_pan":false,"inv_tilt":false},{"id":"f14aca1ac","type":"uplight","name":"Uplight 7","x":26.0,"y":-30,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":101,"inv_pan":false,"inv_tilt":false},{"id":"f35241376","type":"uplight","name":"Uplight 8","x":26.0,"y":6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":107,"inv_pan":false,"inv_tilt":false},{"id":"f38720ae1","type":"uplight","name":"Uplight 9","x":-34.0,"y":-24,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":113,"inv_pan":false,"inv_tilt":false},{"id":"f496b73a9","type":"uplight","name":"Uplight 10","x":34.0,"y":-24,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":119,"inv_pan":false,"inv_tilt":false},{"id":"f02b3473a","type":"uplight","name":"Uplight 11","x":-34.0,"y":-12,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":125,"inv_pan":false,"inv_tilt":false},{"id":"f6956a02a","type":"uplight","name":"Uplight 12","x":34.0,"y":-12,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":131,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"pool":{"v":1,"name":"Pool party","template":"pool","size":{"w":30.0,"d":12.0},"items":[{"id":"b6b80de69","kind":"deck","name":"Pool deck","x":0,"y":6.0,"w":30.0,"d":12.0,"h":0.5,"z":0.0,"rot":0.0},{"id":"b77cc02b4","kind":"dj","name":"DJ booth","x":0,"y":6.0,"w":7,"d":3,"h":3.6,"z":0.5,"rot":0.0},{"id":"b04b32e3e","kind":"screen","name":"DJ backdrop","x":0,"y":11.7,"w":10,"d":0.3,"h":7,"z":0.5,"rot":0.0},{"id":"b9fdb9fbc","kind":"set","name":"Pool","x":0,"y":-14,"w":20.0,"d":12,"h":0.2,"z":0.0,"rot":0.0},{"id":"b2e1b644e","kind":"totem","name":"Totem","x":-14.0,"y":6.0,"w":1,"d":1,"h":7,"z":0.5,"rot":0.0},{"id":"bcf5711f1","kind":"totem","name":"Totem","x":14.0,"y":6.0,"w":1,"d":1,"h":7,"z":0.5,"rot":0.0},{"id":"b3cb24f09","kind":"set","name":"Palm","x":-19.0,"y":-2,"w":3,"d":3,"h":18,"z":0.0,"rot":0.0},{"id":"bc780ae72","kind":"set","name":"Palm","x":19.0,"y":-2,"w":3,"d":3,"h":18,"z":0.0,"rot":0.0}],"fixtures":[{"id":"fa95eefe5","type":"uplight","name":"Uplight 1","x":-11.0,"y":-8,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f3dee40de","type":"uplight","name":"Uplight 2","x":11.0,"y":-8,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":7,"inv_pan":false,"inv_tilt":false},{"id":"f21ab8b9d","type":"uplight","name":"Uplight 3","x":-11.0,"y":-20,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":13,"inv_pan":false,"inv_tilt":false},{"id":"f180d23f3","type":"uplight","name":"Uplight 4","x":11.0,"y":-20,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":19,"inv_pan":false,"inv_tilt":false},{"id":"fc527a971","type":"uplight","name":"Uplight 5","x":0.0,"y":-21,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":25,"inv_pan":false,"inv_tilt":false},{"id":"f6c732e1a","type":"uplight","name":"Uplight 6","x":0.0,"y":-7,"z":0.2,"rot":0.0,"hang":false,"univ":1,"addr":31,"inv_pan":false,"inv_tilt":false},{"id":"f1c5d69b6","type":"bar_8","name":"LED bar 1","x":-11.25,"y":0.4,"z":0.6,"rot":0.0,"hang":false,"univ":1,"addr":37,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fc52f0717","type":"bar_8","name":"LED bar 2","x":-3.75,"y":0.4,"z":0.6,"rot":0.0,"hang":false,"univ":1,"addr":61,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fdf77fd9a","type":"bar_8","name":"LED bar 3","x":3.75,"y":0.4,"z":0.6,"rot":0.0,"hang":false,"univ":1,"addr":85,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"f17a10bb1","type":"bar_8","name":"LED bar 4","x":11.25,"y":0.4,"z":0.6,"rot":0.0,"hang":false,"univ":1,"addr":109,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fc2758ed3","type":"wash","name":"Wash 1","x":-14.0,"y":6.0,"z":7.8,"rot":0.0,"hang":false,"univ":1,"addr":133,"inv_pan":false,"inv_tilt":false},{"id":"f3967c765","type":"wash","name":"Wash 2","x":14.0,"y":6.0,"z":7.8,"rot":0.0,"hang":false,"univ":1,"addr":144,"inv_pan":false,"inv_tilt":false},{"id":"ff42b6f5a","type":"par_rgbw","name":"Palm uplight","x":-19.0,"y":-3.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":155,"inv_pan":false,"inv_tilt":false},{"id":"f6147c572","type":"par_rgbw","name":"Palm uplight","x":19.0,"y":-3.8,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":159,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"backyard":{"v":1,"name":"Backyard stage","template":"backyard","size":{"w":12.0,"d":8.0},"items":[{"id":"b182e00c0","kind":"deck","name":"Deck","x":0,"y":4.0,"w":12.0,"d":8.0,"h":1,"z":0.0,"rot":0.0},{"id":"b1c83bdb0","kind":"wall","name":"House wall","x":0,"y":12.0,"w":32.0,"d":0.5,"h":12,"z":0.0,"rot":0.0},{"id":"bb46a4aa1","kind":"pipe","name":"Pipe on stands","x":0,"y":1,"w":12.0,"d":0.3,"h":0.3,"z":8,"rot":0.0},{"id":"b4121c42d","kind":"totem","name":"Totem","x":-7.5,"y":2,"w":1,"d":1,"h":6,"z":0.0,"rot":0.0},{"id":"b512c1ee8","kind":"totem","name":"Totem","x":7.5,"y":2,"w":1,"d":1,"h":6,"z":0.0,"rot":0.0}],"fixtures":[{"id":"fa2bb3415","type":"par_rgb","name":"RGB par 1","x":-4.5,"y":1,"z":7.6,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f39b55fa3","type":"par_rgb","name":"RGB par 2","x":-1.5,"y":1,"z":7.6,"rot":0.0,"hang":true,"univ":1,"addr":4,"inv_pan":false,"inv_tilt":false},{"id":"f21eae66d","type":"par_rgb","name":"RGB par 3","x":1.5,"y":1,"z":7.6,"rot":0.0,"hang":true,"univ":1,"addr":7,"inv_pan":false,"inv_tilt":false},{"id":"f8e75b206","type":"par_rgb","name":"RGB par 4","x":4.5,"y":1,"z":7.6,"rot":0.0,"hang":true,"univ":1,"addr":10,"inv_pan":false,"inv_tilt":false},{"id":"f58ae878b","type":"wash","name":"Wash 1","x":-7.5,"y":2,"z":6.8,"rot":0.0,"hang":false,"univ":1,"addr":13,"inv_pan":false,"inv_tilt":false},{"id":"f99aac99f","type":"wash","name":"Wash 2","x":7.5,"y":2,"z":6.8,"rot":0.0,"hang":false,"univ":1,"addr":24,"inv_pan":false,"inv_tilt":false},{"id":"fb91084f7","type":"uplight","name":"Uplight 1","x":-11.2,"y":11.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":35,"inv_pan":false,"inv_tilt":false},{"id":"fcd098a86","type":"uplight","name":"Uplight 2","x":-5.6,"y":11.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":41,"inv_pan":false,"inv_tilt":false},{"id":"fabafc570","type":"uplight","name":"Uplight 3","x":0.0,"y":11.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":47,"inv_pan":false,"inv_tilt":false},{"id":"f06a7a643","type":"uplight","name":"Uplight 4","x":5.6,"y":11.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":53,"inv_pan":false,"inv_tilt":false},{"id":"fc68a5e54","type":"uplight","name":"Uplight 5","x":11.2,"y":11.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":59,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"gym":{"v":1,"name":"School gym / prom","template":"gym","size":{"w":40.0,"d":16.0},"items":[{"id":"b097f8362","kind":"deck","name":"Stage","x":0,"y":8.0,"w":32.0,"d":16.0,"h":3,"z":0.0,"rot":0.0},{"id":"b067d2b29","kind":"truss","name":"Front truss","x":0,"y":1,"w":32.0,"d":1,"h":1,"z":18,"rot":0.0},{"id":"bc445396c","kind":"truss","name":"Mid-room truss","x":0,"y":-24,"w":40.0,"d":1,"h":1,"z":20,"rot":0.0},{"id":"bb07e092d","kind":"riser","name":"Dance floor","x":0,"y":-24,"w":40.0,"d":30,"h":0.1,"z":0.0,"rot":0.0},{"id":"bc7ca2d6d","kind":"screen","name":"Screen","x":0,"y":15.7,"w":16,"d":0.4,"h":9,"z":5,"rot":0.0}],"fixtures":[{"id":"fa310eab8","type":"par_7","name":"Par 1","x":-14.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f0233bb56","type":"par_7","name":"Par 2","x":-10.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":8,"inv_pan":false,"inv_tilt":false},{"id":"f43047e8f","type":"par_7","name":"Par 3","x":-6.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":15,"inv_pan":false,"inv_tilt":false},{"id":"fefe0faeb","type":"par_7","name":"Par 4","x":-2.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":22,"inv_pan":false,"inv_tilt":false},{"id":"f5493cf06","type":"par_7","name":"Par 5","x":2.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":29,"inv_pan":false,"inv_tilt":false},{"id":"f0d5fb56f","type":"par_7","name":"Par 6","x":6.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":36,"inv_pan":false,"inv_tilt":false},{"id":"f72d5ca30","type":"par_7","name":"Par 7","x":10.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":43,"inv_pan":false,"inv_tilt":false},{"id":"f5499684b","type":"par_7","name":"Par 8","x":14.0,"y":1,"z":17.4,"rot":0.0,"hang":true,"univ":1,"addr":50,"inv_pan":false,"inv_tilt":false},{"id":"f27679477","type":"wash","name":"Wash 1","x":-15.0,"y":-24,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":57,"inv_pan":false,"inv_tilt":false},{"id":"f3a660c2d","type":"wash","name":"Wash 2","x":-5.0,"y":-24,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":68,"inv_pan":false,"inv_tilt":false},{"id":"f3cd14d56","type":"wash","name":"Wash 3","x":5.0,"y":-24,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":79,"inv_pan":false,"inv_tilt":false},{"id":"f3b54c305","type":"wash","name":"Wash 4","x":15.0,"y":-24,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":90,"inv_pan":false,"inv_tilt":false},{"id":"f0a0c05e3","type":"spot","name":"Spot 1","x":-10.5,"y":-24.6,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":101,"inv_pan":false,"inv_tilt":false},{"id":"f7feeba7e","type":"spot","name":"Spot 2","x":-3.5,"y":-24.6,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":110,"inv_pan":false,"inv_tilt":false},{"id":"f5a4f2355","type":"spot","name":"Spot 3","x":3.5,"y":-24.6,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":119,"inv_pan":false,"inv_tilt":false},{"id":"fc83ab675","type":"spot","name":"Spot 4","x":10.5,"y":-24.6,"z":19.4,"rot":0.0,"hang":true,"univ":1,"addr":128,"inv_pan":false,"inv_tilt":false},{"id":"f06b8484d","type":"bar_12","name":"LED bar 1","x":-13.33,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":137,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f122e2c2e","type":"bar_12","name":"LED bar 2","x":-8.0,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":173,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"fa6a7cccd","type":"bar_12","name":"LED bar 3","x":-2.67,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":209,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f7a0c6e47","type":"bar_12","name":"LED bar 4","x":2.67,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":245,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"f4d4d310e","type":"bar_12","name":"LED bar 5","x":8.0,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":281,"inv_pan":false,"inv_tilt":false,"w":4},{"id":"fbb542dfa","type":"bar_12","name":"LED bar 6","x":13.33,"y":0.3,"z":3.3,"rot":0.0,"hang":false,"univ":1,"addr":317,"inv_pan":false,"inv_tilt":false,"w":4}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"bar":{"v":1,"name":"Bar corner stage","template":"bar","size":{"w":10.0,"d":8.0},"items":[{"id":"b10f5c2b4","kind":"deck","name":"Stage","x":0,"y":4.0,"w":10.0,"d":8.0,"h":1,"z":0.0,"rot":0.0},{"id":"b500792ca","kind":"pipe","name":"Pipe","x":0,"y":0.5,"w":10.0,"d":0.3,"h":0.3,"z":9,"rot":0.0},{"id":"b88a3f52d","kind":"wall","name":"Back wall","x":0,"y":7.9,"w":10.0,"d":0.2,"h":9,"z":1,"rot":0.0}],"fixtures":[{"id":"f7bf91c66","type":"par_drgbs","name":"Par 1","x":-3.33,"y":0.5,"z":8.6,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f16233454","type":"par_drgbs","name":"Par 2","x":0.0,"y":0.5,"z":8.6,"rot":0.0,"hang":true,"univ":1,"addr":6,"inv_pan":false,"inv_tilt":false},{"id":"f671d040a","type":"par_drgbs","name":"Par 3","x":3.33,"y":0.5,"z":8.6,"rot":0.0,"hang":true,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"f79e8b0b1","type":"bar_8","name":"LED bar 1","x":0,"y":0.3,"z":1.2,"rot":0.0,"hang":false,"univ":1,"addr":16,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"f8134bb1b","type":"uplight","name":"Uplight 1","x":-4.5,"y":7.7,"z":1.1,"rot":0.0,"hang":false,"univ":1,"addr":40,"inv_pan":false,"inv_tilt":false},{"id":"fa72906bb","type":"uplight","name":"Uplight 2","x":4.5,"y":7.7,"z":1.1,"rot":0.0,"hang":false,"univ":1,"addr":46,"inv_pan":false,"inv_tilt":false},{"id":"f85fb138a","type":"wash","name":"Wash 1","x":-4.0,"y":7.0,"z":1.2,"rot":0.0,"hang":false,"univ":1,"addr":52,"inv_pan":false,"inv_tilt":false},{"id":"fc4837128","type":"wash","name":"Wash 2","x":4.0,"y":7.0,"z":1.2,"rot":0.0,"hang":false,"univ":1,"addr":63,"inv_pan":false,"inv_tilt":false}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0},"rooftop":{"v":1,"name":"Rooftop party","template":"rooftop","size":{"w":20.0,"d":10.0},"items":[{"id":"b4d633300","kind":"riser","name":"DJ riser","x":0,"y":5.0,"w":10.0,"d":6,"h":1.5,"z":0.0,"rot":0.0},{"id":"b5eb9c8ab","kind":"dj","name":"DJ booth","x":0,"y":5.0,"w":6,"d":2.5,"h":3.6,"z":1.5,"rot":0.0},{"id":"b79c6506e","kind":"screen","name":"Backdrop","x":0,"y":9.7,"w":10,"d":0.3,"h":8,"z":1.5,"rot":0.0},{"id":"bce10fbb9","kind":"truss","name":"Arch truss","x":0,"y":9.0,"w":20.0,"d":1,"h":1,"z":11,"rot":0.0},{"id":"bbaa983b1","kind":"wall","name":"Railing","x":0,"y":-16,"w":36.0,"d":0.4,"h":3.5,"z":0.0,"rot":0.0}],"fixtures":[{"id":"fe2efa14b","type":"beam","name":"Beam 1","x":-7.5,"y":9.0,"z":10.4,"rot":0.0,"hang":true,"univ":1,"addr":1,"inv_pan":false,"inv_tilt":false},{"id":"f76b9c3e2","type":"beam","name":"Beam 2","x":-2.5,"y":9.0,"z":10.4,"rot":0.0,"hang":true,"univ":1,"addr":11,"inv_pan":false,"inv_tilt":false},{"id":"f3a83bb92","type":"beam","name":"Beam 3","x":2.5,"y":9.0,"z":10.4,"rot":0.0,"hang":true,"univ":1,"addr":21,"inv_pan":false,"inv_tilt":false},{"id":"fb8869c7b","type":"beam","name":"Beam 4","x":7.5,"y":9.0,"z":10.4,"rot":0.0,"hang":true,"univ":1,"addr":31,"inv_pan":false,"inv_tilt":false},{"id":"fb22206f1","type":"uplight","name":"Uplight 1","x":-15.75,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":41,"inv_pan":false,"inv_tilt":false},{"id":"feb3f3eea","type":"uplight","name":"Uplight 2","x":-11.25,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":47,"inv_pan":false,"inv_tilt":false},{"id":"f0ffa8cc1","type":"uplight","name":"Uplight 3","x":-6.75,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":53,"inv_pan":false,"inv_tilt":false},{"id":"f7506cec8","type":"uplight","name":"Uplight 4","x":-2.25,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":59,"inv_pan":false,"inv_tilt":false},{"id":"f279230e6","type":"uplight","name":"Uplight 5","x":2.25,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":65,"inv_pan":false,"inv_tilt":false},{"id":"f4e2c29d3","type":"uplight","name":"Uplight 6","x":6.75,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":71,"inv_pan":false,"inv_tilt":false},{"id":"fa1bafeef","type":"uplight","name":"Uplight 7","x":11.25,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":77,"inv_pan":false,"inv_tilt":false},{"id":"f08bc9966","type":"uplight","name":"Uplight 8","x":15.75,"y":-15.6,"z":0.3,"rot":0.0,"hang":false,"univ":1,"addr":83,"inv_pan":false,"inv_tilt":false},{"id":"fb1ea350d","type":"bar_8","name":"LED bar 1","x":-3.5,"y":1.9,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":89,"inv_pan":false,"inv_tilt":false,"w":3.3},{"id":"fe210c292","type":"bar_8","name":"LED bar 2","x":3.5,"y":1.9,"z":1.6,"rot":0.0,"hang":false,"univ":1,"addr":113,"inv_pan":false,"inv_tilt":false,"w":3.3}],"focus":[{"id":"fc_c","name":"Centre stage","x":0,"y":6,"z":5},{"id":"fc_crowd","name":"Crowd","x":0,"y":-15,"z":4}],"profiles":{},"output":{"on":false,"proto":"artnet","ip":"","from1":false},"motion":{"mode":"auto","pattern":"auto","bars":2,"size":0.7,"slam":true,"slam_look":"random","focus":null,"auto_focus":false,"speed":1.0},"bright":1.0}},"types":{"par_rgb":{"name":"RGB par","short":"RGB par","kind":"par","ch":3,"cells":null},"par_rgbw":{"name":"RGBW par","short":"RGBW par","kind":"par","ch":4,"cells":null},"par_drgbs":{"name":"Par: dim + RGB + strobe","short":"Par","kind":"par","ch":5,"cells":null},"par_7":{"name":"Par 7ch: dim RGBW strobe mode","short":"Par","kind":"par","ch":7,"cells":null},"uplight":{"name":"Battery uplight (RGBWA+UV)","short":"Uplight","kind":"par","ch":6,"cells":null},"bar_8":{"name":"LED bar, 8 cells","short":"LED bar","kind":"bar","ch":24,"cells":8},"bar_12":{"name":"LED bar, 12 cells","short":"LED bar","kind":"bar","ch":36,"cells":12},"wash":{"name":"Wash mover (RGBW)","short":"Wash","kind":"wash","ch":11,"cells":null},"spot":{"name":"Spot mover (colour wheel)","short":"Spot","kind":"spot","ch":9,"cells":null},"beam":{"name":"Beam mover (colour wheel)","short":"Beam","kind":"beam","ch":10,"cells":null}},"templates":[{"key":"club","name":"Club stage","icon":"\ud83e\udea9","w":24,"d":12,"about":"DJ riser, front truss of pars and bars, wash movers on the back truss, floor uplights"},{"key":"band","name":"Bar band stage","icon":"\ud83c\udfb8","w":16,"d":10,"about":"Low deck, a front pipe of pars, LED bars on the floor, two movers behind the band"},{"key":"festival","name":"Festival truss","icon":"\ud83c\udfaa","w":40,"d":24,"about":"Big deck, front, mid and back truss, spots and washes, side screens"},{"key":"theater","name":"Theater","icon":"\ud83c\udfad","w":36,"d":28,"about":"Proscenium stage: front-of-house truss, two electrics, side booms"},{"key":"church","name":"Church / venue hall","icon":"\u26ea","w":28,"d":14,"about":"Platform, front wash truss, back movers, wall uplights, centre screen"},{"key":"dj","name":"DJ booth","icon":"\ud83c\udfa7","w":12,"d":8,"about":"Booth, two totems with movers, an arch truss, uplights"},{"key":"wedding","name":"Wedding reception","icon":"\ud83d\udc8d","w":24,"d":8,"about":"DJ booth, dance floor, totems with beams, a wash truss over the floor, uplights round the room"},{"key":"pool","name":"Pool party","icon":"\ud83c\udfca","w":30,"d":12,"about":"DJ by the pool, uplights round the water, bars on the deck edge, palm uplights"},{"key":"backyard","name":"Backyard stage","icon":"\ud83c\udfe1","w":12,"d":8,"about":"Small deck, two totems, pars on a pipe, uplights on the house wall"},{"key":"gym","name":"School gym / prom","icon":"\ud83c\udfc0","w":40,"d":16,"about":"End stage, a front truss of pars, a mid-room truss of movers over the dance floor"},{"key":"bar","name":"Bar corner stage","icon":"\ud83c\udf78","w":10,"d":8,"about":"Tiny stage: three pars on a pipe, an LED bar, two uplights, two small movers"},{"key":"rooftop","name":"Rooftop party","icon":"\ud83c\udf03","w":20,"d":10,"about":"DJ riser, railing uplights, an arch truss of beams, LED bars"}],"yard":{"v":1,"lot":{"w":80.0,"d":120.0},"street":"bottom","items":[{"id":"y5ded9cf3","kind":"house","name":"House","x":0.0,"y":70.0,"w":50.0,"d":40.0,"rot":0.0,"z":0,"h":12.0},{"id":"y49dd66ea","kind":"drive","name":"Driveway","x":18.0,"y":25.0,"w":18.0,"d":50.0,"rot":0.0,"z":0,"h":0.2},{"id":"y9b98018b","kind":"walk","name":"Walk","x":-5.0,"y":30.0,"w":4.0,"d":30.0,"rot":0.0,"z":0,"h":0.2},{"id":"y9fe42b02","kind":"bed","name":"Garden bed","x":-16.0,"y":48.0,"w":20.0,"d":4.0,"rot":0.0,"z":0,"h":1.0},{"id":"y4214f333","kind":"tree","name":"Front tree","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":22.0},{"id":"y6ef32756","kind":"bush","name":"Bush","x":-24.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"ya998f3fa","kind":"bush","name":"Bush","x":6.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"y060fce73","kind":"tree_light","name":"Big tree wrap","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":20.0},{"id":"yf2d96a0e","kind":"star","name":"Tree topper star","x":-28.0,"y":28.0,"w":3.0,"d":3.0,"rot":0.0,"z":21.0,"h":3.0},{"id":"y6c02a712","kind":"string","name":"Roofline","x":0.0,"y":50.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"ye2e7f7f0","kind":"string","name":"Back roofline","x":0.0,"y":89.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"y665bac55","kind":"candy","name":"Candy cane","x":-7.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y491462fc","kind":"candy","name":"Candy cane","x":-7.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y3a1fe09b","kind":"candy","name":"Candy cane","x":-7.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y6ab4139f","kind":"candy","name":"Candy cane","x":-2.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y1dc5bbd1","kind":"candy","name":"Candy cane","x":-2.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y7a1457e1","kind":"candy","name":"Candy cane","x":-2.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"ydb6953f5","kind":"arch","name":"Arch at the door","x":-5.0,"y":44.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"yd4aa20de","kind":"deer","name":"Deer","x":-30.0,"y":10.0,"w":4.0,"d":2.0,"rot":20.0,"z":0,"h":4.0},{"id":"ydd77f34d","kind":"deer","name":"Deer","x":-24.0,"y":8.0,"w":4.0,"d":2.0,"rot":-10.0,"z":0,"h":4.0},{"id":"y3165820b","kind":"star","name":"Star over the door","x":0.0,"y":52.0,"w":4.0,"d":4.0,"rot":0.0,"z":13.0,"h":3.0},{"id":"y69e11f38","kind":"minitree","name":"Mini tree","x":-14.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yb6502349","kind":"minitree","name":"Mini tree","x":4.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y309055d5","kind":"spot","name":"Spotlight","x":-20.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y27e895c1","kind":"spot","name":"Spotlight","x":8.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"yeb15e759","kind":"stake","name":"Drive stakes","x":9.0,"y":25.0,"w":48.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":10}],"template":"xmas"},"ytpl":{"suburban":{"v":1,"lot":{"w":80.0,"d":120.0},"street":"bottom","items":[{"id":"ya0512402","kind":"house","name":"House","x":0.0,"y":70.0,"w":50.0,"d":40.0,"rot":0.0,"z":0,"h":12.0},{"id":"yb7f0d102","kind":"drive","name":"Driveway","x":18.0,"y":25.0,"w":18.0,"d":50.0,"rot":0.0,"z":0,"h":0.2},{"id":"yf19da086","kind":"walk","name":"Walk","x":-5.0,"y":30.0,"w":4.0,"d":30.0,"rot":0.0,"z":0,"h":0.2},{"id":"y338bf545","kind":"bed","name":"Garden bed","x":-16.0,"y":48.0,"w":20.0,"d":4.0,"rot":0.0,"z":0,"h":1.0},{"id":"ya753d37c","kind":"tree","name":"Front tree","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":22.0},{"id":"yd8265039","kind":"bush","name":"Bush","x":-24.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"yb5f75f1d","kind":"bush","name":"Bush","x":6.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"ydb1a292c","kind":"tree","name":"Back tree","x":30.0,"y":104.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":22.0},{"id":"yefada1a0","kind":"tree_light","name":"Tree wrap","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":20.0},{"id":"y135f8c5c","kind":"stake","name":"Path stakes","x":-7.5,"y":30.0,"w":26.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":7},{"id":"y42fb4669","kind":"arch","name":"Arch","x":-5.0,"y":15.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y946626cf","kind":"inflatable","name":"Inflatable","x":-30.0,"y":8.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":7.0},{"id":"y777b86db","kind":"minitree","name":"Mini tree","x":-14.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"ya72052f5","kind":"minitree","name":"Mini tree","x":4.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y448a4bb4","kind":"spot","name":"Spotlight","x":-20.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"yf6804bcc","kind":"spot","name":"Spotlight","x":8.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"ya2fe11fc","kind":"string","name":"Roofline","x":0.0,"y":50.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3}],"template":"suburban"},"corner":{"v":1,"lot":{"w":100.0,"d":100.0},"street":"bottom","items":[{"id":"y3b736e4d","kind":"house","name":"House","x":-18.0,"y":60.0,"w":45.0,"d":35.0,"rot":0.0,"z":0,"h":12.0},{"id":"ya674b1d6","kind":"garage","name":"Garage","x":18.0,"y":66.0,"w":22.0,"d":22.0,"rot":0.0,"z":0,"h":10.0},{"id":"y329da6a8","kind":"drive","name":"Driveway","x":30.0,"y":27.0,"w":18.0,"d":52.0,"rot":0.0,"z":0,"h":0.2},{"id":"y491c2c19","kind":"walk","name":"Walk","x":-18.0,"y":30.0,"w":4.0,"d":25.0,"rot":0.0,"z":0,"h":0.2},{"id":"ydc4705b8","kind":"fence","name":"Side street fence","x":-49.5,"y":50.0,"w":98.0,"d":0.4,"rot":90.0,"z":0,"h":5.0},{"id":"y3f54264d","kind":"tree","name":"Tree","x":-36.0,"y":20.0,"w":16.0,"d":16.0,"rot":0.0,"z":0,"h":22.0},{"id":"y066d9d4a","kind":"tree_light","name":"Tree wrap","x":-36.0,"y":20.0,"w":16.0,"d":16.0,"rot":0.0,"z":0,"h":20.0},{"id":"ye47c6e5a","kind":"tree","name":"Tree","x":6.0,"y":22.0,"w":14.0,"d":14.0,"rot":0.0,"z":0,"h":22.0},{"id":"ya3289c70","kind":"deer","name":"Deer","x":-20.0,"y":10.0,"w":4.0,"d":2.0,"rot":0.0,"z":0,"h":4.0},{"id":"y0bf47e1f","kind":"deer","name":"Deer","x":-14.0,"y":9.0,"w":4.0,"d":2.0,"rot":15.0,"z":0,"h":4.0},{"id":"y701d6712","kind":"star","name":"Star","x":-18.0,"y":44.0,"w":3.0,"d":3.0,"rot":0.0,"z":13.0,"h":3.0},{"id":"y222a9342","kind":"string","name":"Roofline","x":-18.0,"y":42.6,"w":45.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"ydd5fad3d","kind":"string","name":"Fence lights","x":-49.0,"y":50.0,"w":90.0,"d":0.3,"rot":90.0,"z":5.0,"h":0.3},{"id":"y5217dc80","kind":"stake","name":"Path stakes","x":-20.0,"y":30.0,"w":22.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":6},{"id":"y9ad7ff7f","kind":"spot","name":"Spotlight","x":4.0,"y":44.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0}],"template":"corner"},"florida":{"v":1,"lot":{"w":75.0,"d":110.0},"street":"bottom","items":[{"id":"y11eb68ea","kind":"house","name":"House","x":0.0,"y":62.0,"w":54.0,"d":36.0,"rot":0.0,"z":0,"h":12.0},{"id":"yd7374dea","kind":"drive","name":"Driveway","x":20.0,"y":22.0,"w":20.0,"d":44.0,"rot":0.0,"z":0,"h":0.2},{"id":"y5bca4a15","kind":"walk","name":"Walk","x":-6.0,"y":28.0,"w":4.0,"d":22.0,"rot":0.0,"z":0,"h":0.2},{"id":"y79702ccc","kind":"pool","name":"Pool","x":0.0,"y":96.0,"w":30.0,"d":14.0,"rot":0.0,"z":0,"h":0.3},{"id":"y3ca437e4","kind":"palm","name":"Palm","x":-30.0,"y":30.0,"w":10.0,"d":10.0,"rot":0.0,"z":0,"h":26.0},{"id":"y6d52ce3a","kind":"tree_light","name":"Palm wrap","x":-30.0,"y":30.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":18.0},{"id":"y39a6288e","kind":"spot","name":"Palm uplight","x":-27.0,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y168dded5","kind":"palm","name":"Palm","x":-22.0,"y":12.0,"w":10.0,"d":10.0,"rot":0.0,"z":0,"h":26.0},{"id":"y90252a54","kind":"tree_light","name":"Palm wrap","x":-22.0,"y":12.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":18.0},{"id":"y4846ecf8","kind":"spot","name":"Palm uplight","x":-19.0,"y":8.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y9b1beee1","kind":"palm","name":"Palm","x":-30.0,"y":92.0,"w":10.0,"d":10.0,"rot":0.0,"z":0,"h":26.0},{"id":"y152e7342","kind":"tree_light","name":"Palm wrap","x":-30.0,"y":92.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":18.0},{"id":"y7aabe1ca","kind":"spot","name":"Palm uplight","x":-27.0,"y":88.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"yb25a523c","kind":"palm","name":"Palm","x":28.0,"y":94.0,"w":10.0,"d":10.0,"rot":0.0,"z":0,"h":26.0},{"id":"y415c0fd5","kind":"tree_light","name":"Palm wrap","x":28.0,"y":94.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":18.0},{"id":"y047db917","kind":"spot","name":"Palm uplight","x":31.0,"y":90.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"ybd7531f5","kind":"stake","name":"Path stakes","x":9.5,"y":22.0,"w":40.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":8},{"id":"ya6221526","kind":"stake","name":"Path stakes","x":30.5,"y":22.0,"w":40.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":8},{"id":"y0f4d1c48","kind":"string","name":"Roofline","x":0.0,"y":43.6,"w":54.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"y65f9324e","kind":"inflatable","name":"Flamingo","x":-12.0,"y":10.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":7.0},{"id":"yf98c059b","kind":"string","name":"Pool string","x":0.0,"y":103.2,"w":30.0,"d":0.3,"rot":0.0,"z":8.0,"h":0.3}],"template":"florida"},"townhouse":{"v":1,"lot":{"w":24.0,"d":60.0},"street":"bottom","items":[{"id":"ycbdd5846","kind":"house","name":"House","x":0.0,"y":42.0,"w":24.0,"d":36.0,"rot":0.0,"z":0,"h":12.0},{"id":"yd43174c0","kind":"walk","name":"Walk","x":0.0,"y":12.0,"w":4.0,"d":24.0,"rot":0.0,"z":0,"h":0.2},{"id":"yb438374e","kind":"bed","name":"Garden bed","x":-7.0,"y":21.0,"w":8.0,"d":3.0,"rot":0.0,"z":0,"h":1.0},{"id":"y60c4b089","kind":"bed","name":"Garden bed","x":7.0,"y":21.0,"w":8.0,"d":3.0,"rot":0.0,"z":0,"h":1.0},{"id":"yb0c6acc4","kind":"minitree","name":"Mini tree","x":-7.0,"y":21.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"ye490a038","kind":"minitree","name":"Mini tree","x":7.0,"y":21.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y3c03fd60","kind":"string","name":"Porch string","x":0.0,"y":24.4,"w":24.0,"d":0.3,"rot":0.0,"z":9.0,"h":0.3},{"id":"y10a184a8","kind":"inflatable","name":"Inflatable","x":-8.0,"y":8.0,"w":5.0,"d":5.0,"rot":0.0,"z":0,"h":7.0},{"id":"ydeb79de6","kind":"spot","name":"Spotlight","x":8.0,"y":4.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0}],"template":"townhouse"},"xmas":{"v":1,"lot":{"w":80.0,"d":120.0},"street":"bottom","items":[{"id":"y5ded9cf3","kind":"house","name":"House","x":0.0,"y":70.0,"w":50.0,"d":40.0,"rot":0.0,"z":0,"h":12.0},{"id":"y49dd66ea","kind":"drive","name":"Driveway","x":18.0,"y":25.0,"w":18.0,"d":50.0,"rot":0.0,"z":0,"h":0.2},{"id":"y9b98018b","kind":"walk","name":"Walk","x":-5.0,"y":30.0,"w":4.0,"d":30.0,"rot":0.0,"z":0,"h":0.2},{"id":"y9fe42b02","kind":"bed","name":"Garden bed","x":-16.0,"y":48.0,"w":20.0,"d":4.0,"rot":0.0,"z":0,"h":1.0},{"id":"y4214f333","kind":"tree","name":"Front tree","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":22.0},{"id":"y6ef32756","kind":"bush","name":"Bush","x":-24.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"ya998f3fa","kind":"bush","name":"Bush","x":6.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"y060fce73","kind":"tree_light","name":"Big tree wrap","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":20.0},{"id":"yf2d96a0e","kind":"star","name":"Tree topper star","x":-28.0,"y":28.0,"w":3.0,"d":3.0,"rot":0.0,"z":21.0,"h":3.0},{"id":"y6c02a712","kind":"string","name":"Roofline","x":0.0,"y":50.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"ye2e7f7f0","kind":"string","name":"Back roofline","x":0.0,"y":89.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"y665bac55","kind":"candy","name":"Candy cane","x":-7.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y491462fc","kind":"candy","name":"Candy cane","x":-7.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y3a1fe09b","kind":"candy","name":"Candy cane","x":-7.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y6ab4139f","kind":"candy","name":"Candy cane","x":-2.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y1dc5bbd1","kind":"candy","name":"Candy cane","x":-2.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y7a1457e1","kind":"candy","name":"Candy cane","x":-2.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"ydb6953f5","kind":"arch","name":"Arch at the door","x":-5.0,"y":44.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"yd4aa20de","kind":"deer","name":"Deer","x":-30.0,"y":10.0,"w":4.0,"d":2.0,"rot":20.0,"z":0,"h":4.0},{"id":"ydd77f34d","kind":"deer","name":"Deer","x":-24.0,"y":8.0,"w":4.0,"d":2.0,"rot":-10.0,"z":0,"h":4.0},{"id":"y3165820b","kind":"star","name":"Star over the door","x":0.0,"y":52.0,"w":4.0,"d":4.0,"rot":0.0,"z":13.0,"h":3.0},{"id":"y69e11f38","kind":"minitree","name":"Mini tree","x":-14.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yb6502349","kind":"minitree","name":"Mini tree","x":4.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y309055d5","kind":"spot","name":"Spotlight","x":-20.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y27e895c1","kind":"spot","name":"Spotlight","x":8.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"yeb15e759","kind":"stake","name":"Drive stakes","x":9.0,"y":25.0,"w":48.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":10}],"template":"xmas"},"xmas_mega":{"v":1,"lot":{"w":80.0,"d":120.0},"street":"bottom","items":[{"id":"y246a811a","kind":"house","name":"House","x":0.0,"y":70.0,"w":50.0,"d":40.0,"rot":0.0,"z":0,"h":12.0},{"id":"y37854f5f","kind":"drive","name":"Driveway","x":18.0,"y":25.0,"w":18.0,"d":50.0,"rot":0.0,"z":0,"h":0.2},{"id":"y52538f02","kind":"walk","name":"Walk","x":-5.0,"y":30.0,"w":4.0,"d":30.0,"rot":0.0,"z":0,"h":0.2},{"id":"ydb861d0f","kind":"bed","name":"Garden bed","x":-16.0,"y":48.0,"w":20.0,"d":4.0,"rot":0.0,"z":0,"h":1.0},{"id":"y7f50b0d4","kind":"tree","name":"Front tree","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":22.0},{"id":"y892877ac","kind":"bush","name":"Bush","x":-24.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"ya37f1da2","kind":"bush","name":"Bush","x":6.0,"y":48.0,"w":4.0,"d":4.0,"rot":0.0,"z":0,"h":3.5},{"id":"y531bd30b","kind":"tree_light","name":"Big tree wrap","x":-28.0,"y":28.0,"w":18.0,"d":18.0,"rot":0.0,"z":0,"h":20.0},{"id":"y702c2ffd","kind":"star","name":"Tree topper star","x":-28.0,"y":28.0,"w":3.0,"d":3.0,"rot":0.0,"z":21.0,"h":3.0},{"id":"ya211539f","kind":"string","name":"Roofline","x":0.0,"y":50.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"yccdf6afe","kind":"string","name":"Back roofline","x":0.0,"y":89.5,"w":50.0,"d":0.3,"rot":0.0,"z":12.0,"h":0.3},{"id":"ye61cd21c","kind":"candy","name":"Candy cane","x":-7.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y72d50fee","kind":"candy","name":"Candy cane","x":-7.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y0236f41c","kind":"candy","name":"Candy cane","x":-7.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y20188a14","kind":"candy","name":"Candy cane","x":-2.5,"y":18.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"ye34d76c0","kind":"candy","name":"Candy cane","x":-2.5,"y":26.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y9295f339","kind":"candy","name":"Candy cane","x":-2.5,"y":34.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":3.0},{"id":"y0fb0587b","kind":"arch","name":"Arch at the door","x":-5.0,"y":44.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y21631c7e","kind":"deer","name":"Deer","x":-30.0,"y":10.0,"w":4.0,"d":2.0,"rot":20.0,"z":0,"h":4.0},{"id":"yf3b52802","kind":"deer","name":"Deer","x":-24.0,"y":8.0,"w":4.0,"d":2.0,"rot":-10.0,"z":0,"h":4.0},{"id":"y934a0a4d","kind":"star","name":"Star over the door","x":0.0,"y":52.0,"w":4.0,"d":4.0,"rot":0.0,"z":13.0,"h":3.0},{"id":"y5d491809","kind":"minitree","name":"Mini tree","x":-14.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y17c9bfa2","kind":"minitree","name":"Mini tree","x":4.0,"y":4.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y4934aaf8","kind":"spot","name":"Spotlight","x":-20.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y4fbb8c0d","kind":"spot","name":"Spotlight","x":8.0,"y":46.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0},{"id":"y5a1ac18a","kind":"stake","name":"Drive stakes","x":9.0,"y":25.0,"w":48.0,"d":0.5,"rot":90.0,"z":0,"h":1.5,"n":10},{"id":"y120d6f83","kind":"tree","name":"Back tree","x":32.0,"y":104.0,"w":16.0,"d":16.0,"rot":0.0,"z":0,"h":22.0},{"id":"yf74ae53f","kind":"tree_light","name":"Tree wrap","x":32.0,"y":104.0,"w":16.0,"d":16.0,"rot":0.0,"z":0,"h":20.0},{"id":"y966baf7d","kind":"tree","name":"Corner tree","x":-32.0,"y":104.0,"w":14.0,"d":14.0,"rot":0.0,"z":0,"h":22.0},{"id":"yd1ad2fb4","kind":"tree_light","name":"Tree wrap","x":-32.0,"y":104.0,"w":14.0,"d":14.0,"rot":0.0,"z":0,"h":20.0},{"id":"ycc5489ad","kind":"arch","name":"Arch tunnel 1","x":-5.0,"y":10.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y134e3de4","kind":"arch","name":"Arch tunnel 2","x":-5.0,"y":15.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y361d5cd0","kind":"arch","name":"Arch tunnel 3","x":-5.0,"y":20.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y78b64215","kind":"arch","name":"Arch tunnel 4","x":-5.0,"y":25.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"ye76862a0","kind":"arch","name":"Arch tunnel 5","x":-5.0,"y":30.0,"w":6.0,"d":1.0,"rot":0.0,"z":0,"h":7.0},{"id":"y5a215c49","kind":"minitree","name":"Mini-tree forest","x":-36.0,"y":40.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"ya3bdd27d","kind":"minitree","name":"Mini-tree forest","x":-36.0,"y":46.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yadb281e7","kind":"minitree","name":"Mini-tree forest","x":-32.0,"y":40.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y76758c51","kind":"minitree","name":"Mini-tree forest","x":-32.0,"y":46.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yb679c0cf","kind":"minitree","name":"Mini-tree forest","x":-28.0,"y":40.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yec246905","kind":"minitree","name":"Mini-tree forest","x":-28.0,"y":46.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"ye3edb99d","kind":"minitree","name":"Mini-tree forest","x":-24.0,"y":40.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"ya4c76352","kind":"minitree","name":"Mini-tree forest","x":-24.0,"y":46.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"y77144de4","kind":"minitree","name":"Mini-tree forest","x":-20.0,"y":40.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yf3bd598b","kind":"minitree","name":"Mini-tree forest","x":-20.0,"y":46.0,"w":2.0,"d":2.0,"rot":0.0,"z":0,"h":3.0},{"id":"yf449d5ba","kind":"inflatable","name":"Snowman","x":-34.0,"y":18.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":7.0},{"id":"y87c18e24","kind":"inflatable","name":"Santa","x":33.0,"y":8.0,"w":6.0,"d":6.0,"rot":0.0,"z":0,"h":7.0},{"id":"y45c93dab","kind":"inflatable","name":"Snow globe","x":33.0,"y":40.0,"w":8.0,"d":8.0,"rot":0.0,"z":0,"h":7.0},{"id":"ydd11ef98","kind":"string","name":"Side fence lights","x":-39.7,"y":60.0,"w":120.0,"d":0.3,"rot":90.0,"z":5.0,"h":0.3},{"id":"ye3e0b95f","kind":"spot","name":"House wash","x":0.0,"y":47.0,"w":1.0,"d":1.0,"rot":0.0,"z":0,"h":1.0}],"template":"xmas_mega"}},"ytemplates":[{"key":"suburban","name":"Suburban front yard","about":"House, driveway and walk, two trees, a lit path, an arch and an inflatable"},{"key":"corner","name":"Corner lot","about":"Wide lot, house to one side, side fence, trees, deer and stars"},{"key":"florida","name":"Florida palm yard","about":"Palms with wraps, a pool out back, a lit drive and palm uplights"},{"key":"townhouse","name":"Townhouse","about":"Narrow lot, small walk, porch string, two mini trees, one inflatable"},{"key":"xmas","name":"Christmas classic","about":"The big tree in the front yard, roofline lights, candy-cane path, an arch, reindeer and a star"},{"key":"xmas_mega","name":"Christmas mega display","about":"A tree in every corner, mini-tree forest, arch tunnel, inflatables, rooflines and spotlights"}]};
  const stCopy = o => JSON.parse(JSON.stringify(o));
  const ST = {doc: stCopy(STD.tpl.club), photo: null, hold: null, dropT: -99, look: 'crowd', lastDropN: 0, flash: {}, yard: stCopy(STD.yard)};
  ST.doc.template = 'club';
  const stProf = t => STD.types[t] || (ST.doc.profiles || {})[t] || {kind: 'par', ch: 3};
  const stCh = f => { const p = stProf(f.type); return p.ch || p.chans_n || (p.chans || []).length || 3; };
  function stPatch(doc) { let u = 1, a = 1; for (const f of doc.fixtures) { const n = stCh(f); if (a + n - 1 > 512) { u++; a = 1; } f.univ = u; f.addr = a; a += n; } return doc; }
  function stSample(u, v) {                                            // the brightest colour in a small patch around the spot (the demo picture is sparse)
    const cx = Math.round(u * (W - 1)), cy = Math.round(v * (H - 1)); let best = [0, 0, 0], bl = -1;
    for (let y = Math.max(0, cy - 3); y <= Math.min(H - 1, cy + 3); y++) for (let x = Math.max(0, cx - 3); x <= Math.min(W - 1, cx + 3); x++) {
      const i = (y * W + x) * 3, l = buf[i] + buf[i + 1] + buf[i + 2]; if (l > bl) { bl = l; best = [buf[i], buf[i + 1], buf[i + 2]]; } }
    return best.map(c => Math.max(0, Math.min(255, c | 0))); }
  const stHex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  function stLive() {
    if (now() - lastT > .05) { try { paint(); } catch (e) {} }          // STAGE hides the Live wall, so draw the picture here
    const doc = ST.doc, F = doc.fixtures, t = now(), bpm = DJ.tap_bpm || BPM || 120, beats = t * bpm / 60, m = doc.motion || {};
    if ((DJ.dropN || 0) !== ST.lastDropN) { ST.lastDropN = DJ.dropN || 0; if (m.slam !== false) { ST.dropT = t; ST.look = m.slam_look && m.slam_look !== 'random' ? m.slam_look : ['crowd', 'x', 'sky', 'focus'][ST.lastDropN % 4]; } }
    if (!F.length) return {f: [], how: '', bpm: Math.round(bpm), pro: true, out: {on: false}};
    let x0 = Math.min(...F.map(f => f.x)), x1 = Math.max(...F.map(f => f.x)), z0 = Math.min(...F.map(f => f.z)), z1 = Math.max(...F.map(f => f.z));
    if (x1 - x0 < 1) { x0--; x1++; } if (z1 - z0 < 1) { z0--; z1++; }
    const Wd = doc.size.w, Dd = doc.size.d, cw = Math.max(Wd, 16) * .55 * (m.size || .7) + 2, cy = -Math.max(8, Dd) * .8, cd = Math.max(6, Dd * .6) * (m.size || .7);
    const mv = F.filter(f => ['wash', 'spot', 'beam'].includes(stProf(f.type).kind)), n = Math.max(1, mv.length), foc = doc.focus || [], tg = {}; let how = '';
    const slam = t - ST.dropT < 4 * 60 / bpm, strobe = t - ST.dropT < 60 / bpm;
    mv.forEach((f, i) => { const k = n > 1 ? i / (n - 1) * 2 - 1 : 0, o = i / n;
      if (ST.hold && foc.find(p => p.id === ST.hold)) { const p = foc.find(q => q.id === ST.hold); tg[f.id] = [p.x + (i - (n - 1) / 2) * .3, p.y, p.z]; how = 'focus'; return; }
      if (slam) { how = 'slam'; const L = ST.look; const fp = foc.find(p => p.id === m.focus) || foc[0] || {x: 0, y: Dd / 2, z: 5};
        tg[f.id] = L === 'crowd' ? [k * cw, cy * .6, 0] : L === 'x' ? [-(Math.sign(f.x || k) || 1) * cw * .9, cy, 0] : L === 'sky' ? [k * cw * 1.5, cy * 3, 40] : [fp.x, fp.y, fp.z]; return; }
      if (m.mode === 'focus' && foc.length) { const p = foc.find(q => q.id === m.focus) || foc[m.auto_focus ? Math.floor(beats / ((m.bars || 2) * 4)) % foc.length : 0]; tg[f.id] = [p.x + (i - (n - 1) / 2) * .4, p.y, p.z]; how = 'focus'; return; }
      if (m.mode === 'still') { tg[f.id] = [k * cw * .6, cy, 0]; how = 'still'; return; }
      let pat = m.pattern || 'auto'; if (pat === 'auto') pat = ['fan', 'circle', 'fig8', 'wave', 'ballyhoo'][Math.floor(beats / 32) % 5];
      if (m.mode === 'follow') { let s = 0, sx = 0, sy = 0; for (let j = 0; j < N; j++) { const l = Math.pow(Math.max(buf[j * 3], buf[j * 3 + 1], buf[j * 3 + 2]) / 255, 2); s += l; sx += (j % W) * l; sy += Math.floor(j / W) * l; }
        if (s > .01) { tg[f.id] = [(sx / s / (W - 1) * 2 - 1) * cw + k * 1.5, cy - cd / 2 + sy / s / (H - 1) * cd, 0]; how = 'follow'; return; } }
      const a = 2 * Math.PI * beats / ((m.bars || 2) * 4); let u, v;
      if (pat === 'fan') { u = k * .8 + .25 * Math.sin(a); v = .3 * Math.cos(a); } else if (pat === 'circle') { u = .55 * Math.cos(a + 2 * Math.PI * o); v = .55 * Math.sin(a + 2 * Math.PI * o); }
      else if (pat === 'fig8') { u = .7 * Math.sin(a + o * 2); v = .45 * Math.sin(2 * a + o * 2); } else if (pat === 'wave') { u = k * .8; v = .7 * Math.sin(a + 2 * Math.PI * o); }
      else { u = .8 * Math.sin(a * 2.3 + i * 1.7) * Math.cos(a * .7 + i); v = .7 * Math.sin(a * 1.9 + i * 2.3); }
      tg[f.id] = [u * cw, cy + v * cd / 2, 0]; how = pat; });
    const br = doc.bright == null ? 1 : doc.bright;
    const f = F.map(fx => { const p = stProf(fx.type), v = 1 - (fx.z - z0) / (z1 - z0), cells = p.kind === 'bar' ? (p.cells || 8) : 1, w = fx.w || 3.3;
      let cs = []; for (let c = 0; c < cells; c++) { const xx = cells > 1 ? fx.x - w / 2 + w * (c + .5) / cells : fx.x; cs.push(stSample((xx - x0) / (x1 - x0), v).map(q => Math.round(q * br))); }
      if (ST.flash[fx.id] > t) cs = cs.map(() => [255, 255, 255]);
      if (slam && tg[fx.id]) cs = cs.map(c => Math.max(...c) < 50 ? [220, 220, 220] : c);
      return {id: fx.id, c: cs.map(stHex), t: tg[fx.id] ? tg[fx.id].map(q => Math.round(q * 100) / 100) : null, s: !!(slam && strobe), lock: false}; });
    return {f, how, bpm: Math.round(bpm), pro: true, out: {on: false, proto: (doc.output || {}).proto || 'artnet', ip: '', sent: 0, err: null}};
  }
  function stageRoute(method, path, b) {
    if (method === 'GET') {
      if (path === '/api/stage') return {ok: true, doc: ST.doc, pro: true, types: STD.types, templates: STD.templates, clashes: [], photo: !!ST.photo};
      if (path === '/api/stage/live') return Object.assign({ok: true, t: now()}, stLive());
      if (path === '/api/yard') return {ok: true, yard: ST.yard, kinds: [], lights: [], templates: STD.ytemplates};
      if (path === '/api/stage/mylights') return {ok: true, where: 'stage', assign: {}, spots: [], lights: [], saved: [], current: 'My layout'};
      if (path === '/api/yard/live') { if (now() - lastT > .05) { try { paint(); } catch (e) {} } const L = ST.yard.lot, c = {}; (ST.yard.items || []).forEach(it => { if (!['minitree', 'stake', 'arch', 'inflatable', 'spot', 'string', 'star', 'deer', 'candy', 'tree_light', 'sign', 'screen'].includes(it.kind)) return;
          c[it.id] = stHex(stSample((it.x + L.w / 2) / L.w, 1 - ((it.z || 0) + (it.h || 1) / 2) / 26)); }); return {ok: true, c}; }
      return null;
    }
    b = b || {};
    switch (path) {
      case '/api/stage/save': ST.doc = stCopy(b.doc || ST.doc); return {ok: true, doc: ST.doc, clashes: []};
      case '/api/stage/template': { const T = STD.tpl[b.key] || STD.tpl.club, d = stCopy(T), sx = (+b.w || d.size.w) / d.size.w, sy = (+b.d || d.size.d) / d.size.d;
        d.items.forEach(i => { i.x *= sx; i.w *= sx; i.y *= sy; if (i.kind === 'deck') i.d *= sy; }); d.fixtures.forEach(f => { f.x *= sx; f.y *= sy; }); d.size = {w: d.size.w * sx, d: d.size.d * sy};
        d.output = Object.assign({}, ST.doc.output, {on: false}); d.motion = ST.doc.motion || d.motion; return {ok: true, doc: d, note: d.fixtures.length + ' lights patched from universe 1, address 1'}; }
      case '/api/stage/new': { const s = b.size || {}, d = stCopy(STD.tpl.club); d.name = b.name || 'My stage'; d.template = null; d.fixtures = []; d.size = {w: +s.w || 24, d: +s.d || 12};
        d.items = [{id: 'b' + Date.now(), kind: 'deck', name: 'Stage deck', x: 0, y: d.size.d / 2, z: 0, w: d.size.w, d: d.size.d, h: +s.h || 2, rot: 0}]; return {ok: true, doc: d}; }
      case '/api/stage/import': return {ok: false, error: 'In the demo, opening venue and fixture files needs the GlowBop laptop app. On your computer it reads MVR, GDTF and Open Fixture Library files.'};
      case '/api/stage/repatch': { const d = stPatch(stCopy(b.doc || ST.doc)); return {ok: true, doc: d, clashes: []}; }
      case '/api/stage/output': { if (b.on) { LAPTOP('sending to real stage lights'); } const o = Object.assign({}, ST.doc.output || {}, b, {on: false}); ST.doc.output = o; return {ok: true, output: o, msg: b.on ? '💻 Demo: the stage plays on screen only' : 'Saved'}; }
      case '/api/stage/motion': ST.doc.motion = Object.assign({}, ST.doc.motion || {}, b); return {ok: true, motion: ST.doc.motion};
      case '/api/stage/hold': ST.hold = b.focus || null; return {ok: true, hold: ST.hold};
      case '/api/stage/slam': ST.dropT = now(); ST.look = b.look || ['crowd', 'x', 'sky', 'focus'][Math.floor(now()) % 4]; return {ok: true, look: ST.look};
      case '/api/stage/flash': { const until = now() + 1.5; (b.ids || (b.all ? ST.doc.fixtures.map(f => f.id) : [])).forEach(i => ST.flash[i] = until); return {ok: true}; }
      case '/api/stage/bright': ST.doc.bright = Math.max(0, Math.min(1, +b.v)); return {ok: true, bright: ST.doc.bright};
      case '/api/stage/photo': ST.photo = b.b64 || null; return {ok: true, photo: !!ST.photo};
      case '/api/yard/template': return {ok: true, yard: stCopy(STD.ytpl[b.key] || STD.ytpl.suburban)};
      case '/api/stage/mylights': case '/api/stage/layouts': LAPTOP('putting your own lights on a template'); return {ok: false, error: 'In the demo, this needs your lights and the GlowBop laptop app'};
      case '/api/yard/save': ST.yard = stCopy(b.yard || ST.yard); return {ok: true, yard: ST.yard};
    }
    return null;
  }
  async function handle(method, path, q, b) {
    if (path.startsWith('/api/stage') || path.startsWith('/api/yard')) { const r = stageRoute(method, path, b); if (r) return {json: r}; }
    await ready;
    const ok = (o) => ({json: Object.assign({ok: true}, o || {})});
    const pro = fn => { try { return {json: fn()}; } catch (e) { if (e.bad) return {status: 400, json: {error: e.message}}; throw e; } };
    if (path === '/helper/status') return {json: {engine: QUIT ? 'off' : 'on'}};
    if (method === 'GET' && path === '/api/lights/stage') return {json: stageInfo()};
    if (method === 'GET' && path === '/api/tonight') return {json: tonightInfo()};
    if (method === 'POST' && path === '/api/tonight') { tonightCmd(b || {}); return ok(); }
    if (path === '/api/lights/nettest') return {json: {error: '💻 In the demo, the Wi-Fi test needs the GlowBop laptop app'}};      // 📶 one pop-up, not two
    if (path === '/api/lights/wifiscan') return {json: {ok: false, why: 'In the demo, the Wi-Fi neighbour scan needs the GlowBop laptop app. On your computer it lists every network nearby and picks the calmest channel.'}};
    if (method === 'POST' && path.startsWith('/api/lights/')) { const r = stageCmd(path, b || {}); if (r) return {json: r}; }
    if (method === 'GET') {
      switch (path) {
        case '/api/status': return {json: Object.assign(status(), {lights_health: healthMock()})};
        case '/api/lights/health': return {json: Object.assign(healthMock(), {test: null, testing: null, setup: {done: true}})};   // 📶 Oct 21: the network guide never pops up by itself in the demo
        case '/api/schedule': return {json: SCH.info()};
        case '/api/layouts': return {json: {items: {}}};
        case '/api/catalog': return {json: Object.assign({}, CAT, {holiday_cal: holCal()})};
        case '/api/frames': return {json: {groups: [{id: 'g1', name: 'Main', w: W, h: H, gw: W, gh: H, shape: null, rgb: paint(),
          devices: DEVS.map(d => ({id: d.id, name: d.name, x0: d.x0, x1: d.x0 + 19, y0: 0, y1: H - 1}))}]}};
        case '/api/frame': { const rgb = paint(); return {json: {w: W, h: H, rgb: rgb.match(/.{6}/g)}}; }
        case '/api/uiver': return {json: {v: 1}};
        case '/api/license': return {json: {licensed: true, owner: false, pro: PRO, plan: PRO ? 'pro' : 'home', key: PRO ? 'GBPRO-DEMO' : 'GLOWBOP-DEMO', message: '', buy: '/pricing.html', buy_pro: '/pricing.html#pro'}};
        case '/api/link': return {json: {link: 'http://192.168.0.42:8787'}};
        case '/api/lights': return {json: lightsInfo()};
        case '/api/music': return {json: musicState()};
        case '/api/media': { const t = M.queue[M.idx];                 // 🎵 (Oct 16) the demo pretends a music app is playing on the laptop, so skip / pause / seek all work
          return {json: t ? {available: true, title: t.title, artist: t.artist, status: M.playing ? 'Playing' : 'Paused', pos: songPos(), len: t.dur, app_name: 'Demo playlist', app: 'Demo playlist',
            can_seek: true, vol: M.volume, mute: M.volume === 0} : {available: false, title: null}}; }
        case '/api/songinfo': return {json: {keys: {lastfm: true, getsongbpm: true}, current: songInfoNow()}};
        case '/api/text': return {json: {state: Object.assign({}, TX.s), presets: TX.presets.map(p => Object.assign({}, p, {logo: undefined}))}};
        case '/api/score': return {json: scoreInfo()};
        case '/api/score/now': return {json: demoNow()};
        case '/api/score/teams': { const lg = q.get('league') || 'nfl', ts = TEAMS[lg];
          return {json: ts ? {teams: ts.map(x => ({id: x[0], name: x[1], abbr: x[0], color: x[2]}))} : {teams: [], error: 'In the demo, teams load for the NFL, NBA, MLB, NHL, MLS and Premier League'}}; }
        case '/api/fire': return {json: Object.assign({}, ENG.fire, FIRE)};
        case '/api/faders': return {json: fadersInfo()};
        case '/api/override': return {json: ovInfo()};
        case '/api/loops': return {json: loopsInfo(q.get('lite') !== '1')};
        case '/api/shows': return {json: {on: SH.on, rec: SH.rec, now: shInfo(), songs: shList()}};
        case '/api/shows/now': return {json: shInfo()};
        case '/api/shows/one': { const key = q.get('key'); if (!key) return {status: 400, json: {error: 'which song? (key)'}};
          return {json: {key, show: SH.shows[key] || null, rev: SH.rev[key] || 0, song: songFacts(key), looks: ENG.look_colors || {}, effects: Object.keys(CAT.effects).sort(), hits: HIT_TYPES, now: shInfo()}}; }
        case '/api/feeds': return {json: feedsInfo()};
        case '/api/support': return {json: {ready: true, pending: 0, version: 'demo'}};
        case '/api/music/search': ytToast(); return {json: {results: fakeSongs(q.get('q'), 6)}};
        case '/api/music/artist': { const nm = pickOne(['The Glow Ups', 'Pixel Hearts', 'DJ Lumen', 'Aurora Club']); return {json: {name: nm, songs: fakeSongs(nm.split(' ').pop(), 5), albums: [{id: 'MPREdemo1', title: nm + ': Night Lights', sub: 'Album'}, {id: 'MPREdemo2', title: 'Glow (Single)', sub: 'Single'}]}}; }
        case '/api/music/moods': ytToast(); return {json: {moods: MOODS.map((m, i) => ({title: m, browseId: 'demo', params: 'm' + i}))}};
        case '/api/music/mood': { const m = MOODS[+String(q.get('p') || 'm0').slice(1)] || 'Party'; return {json: {playlists: [m + ' Glow', m + ' Hits', 'Late Night ' + m, m + ' Classics'].map((tt, i) => ({id: 'demo-' + slug(tt), title: tt, sub: 'GlowBop demo playlist'}))}}; }
        case '/api/music/open': return {json: {tracks: fakeSongs((q.get('id') || 'Glow').replace(/^demo-|^MPRE/, '').replace(/-/g, ' '), 6)}};
        case '/api/music/recent': return {json: {played_here: M.recent, youtube: []}};
        case '/api/music/library': return {json: {signed_in: false, signin_ok: false, account: null, playlists: [], favorites: FAVS}};
        case '/api/music/family': return {json: {family: [], how: 'auto', auto: [pickOne(Object.keys(CAT.looks))], looks: Object.keys(CAT.looks)}};
        case '/api/autoloops': case '/api/scenes': case '/api/cues': case '/api/tempo': case '/api/zones': case '/api/palettes': case '/api/prodj':
          return {json: pdInfo(path.slice(5))};
        case '/api/midi': return {json: midiFull()};
        case '/api/midi/monitor': return {json: Object.assign({}, ENG.midi.monitor, {seq: 0, items: []})};
        case '/api/midi/capture': return {json: {text: ''}};
        case '/api/layout': return {json: layoutInfo()};
        case '/api/layout/zones': return {json: {zones: LAY.zones(), shapes: []}};
        case '/api/mirror/screens': return {json: {screens: MIRROR_SCREENS, pick: MIRROR_PICK}};
        case '/api/art/projects': await artSeed(); return {json: {projects: Object.entries(ART).map(([id, j]) => ({id, name: j.name || id, spots: (j.spots || []).length, updated: j.updated || 0})).sort((a, c) => c.updated - a.updated)}};
        case '/api/art/project': { await artSeed(); const id = q.get('id') || '', j = ART[id]; return {json: j ? {id, project: JSON.parse(JSON.stringify(j))} : {error: 'no such project'}}; }
      }
    } else {
      switch (path) {
        case '/api/control': return control(b);
        case '/api/schedule': return {json: SCH.post(b)};
        case '/api/layouts': return {json: {ok: true}};
        case '/api/autoloops': case '/api/scenes': case '/api/cues': case '/api/tempo': case '/api/zones': case '/api/palettes': case '/api/prodj':
          return pro(() => pdPost(path.slice(5), b));
        case '/api/songinfo': { const t = M.queue[M.idx]; if (!t) return {status: 409, json: {error: 'no song is playing'}};
          const st = String(b.style || 'auto'); if (st === 'auto') delete STY_PICK[t.artist]; else STY_PICK[t.artist] = st;
          return {json: {ok: true, current: songInfoNow()}}; }
        case '/api/midi': return midiPost(b);
        case '/api/midi/relay': return ok({out: []});
        case '/api/midi/report': setTimeout(() => toast('Demo: nothing was sent. On the GlowBop app the test goes straight to support'), 2600); return ok({sent: true, ticket: 'GB-DEMO'});
        case '/api/layout/save': return {json: LAY.save(b)};
        case '/api/mirror/screen': MIRROR_PICK = Math.max(0, +b.screen || 0); return ok({pick: MIRROR_PICK});
        case '/api/art/project': { const j = b.project; if (!j || typeof j !== 'object' || j.type !== 'sign') return {status: 400, json: {error: 'not a sign project'}};
          await artSeed(); let id = b.id && ART[b.id] ? b.id : (slug(j.name || 'sign') || 'sign'); if (!(b.id && ART[b.id])) { const base = id; let n = 2; while (ART[id]) id = base + '-' + n++; }
          ART[id] = Object.assign(JSON.parse(JSON.stringify(j)), {glowbop: 1, updated: wall()}); return ok({id}); }
        case '/api/art/delete': if (!ART[b.id]) return {status: 400, json: {error: 'no such project'}}; delete ART[b.id]; return ok();
        case '/api/art/workshop': if (b.id !== STG.str.id) return {status: 400, json: {error: 'no such light'}};
          if (b.on) STG.ws[b.id] = String(b.project || 'sign').slice(0, 60); else delete STG.ws[b.id]; return ok({workshop: STG.ws[b.id] || null});
        case '/api/art/light': if (!STG.ws[b.id]) return {status: 400, json: {error: 'put that light in the workshop first'}};
          return ok({lit: (b.bulbs || []).filter(x => x && (+x[1] || +x[2] || +x[3])).length});
        case '/api/layout/photo': LAY.photo = b.data || null; LAY.doc.photo = !!b.data;
          if (b.data) setTimeout(() => toast('📷 In the demo the photo stays in this browser tab'), 1800); return ok({photo: !!b.data});
        case '/api/layout/test': if (b.off) { LAY.testing = false; return ok(); }
          LAY.testing = true; LINEUP.on = true; LINEUP.until = now() + 8; setTimeout(() => { LINEUP.on = false; }, 8000);
          return ok({steps: Math.max(1, (LAY.doc.items || []).filter(i => !b.item || i.id === b.item).length)});
        case '/api/layout/preview': return ok({items: []});
        case '/api/map2/level': case '/api/map2/start': case '/api/map2/show': case '/api/map2/finish': return LAPTOP('camera mapping');
        case '/api/map2/cancel': return ok();
        case '/api/faders': return pro(() => Object.assign(fadersInfo(), {ok: true, changed: fadersSet(b)}));
        case '/api/override': return pro(() => { const ch = ovSet(b); return Object.assign(ovInfo(), {ok: true, changed: ch}); });
        case '/api/loops': return pro(() => { const ch = loopsSet(b); return Object.assign(loopsInfo(true), {ok: true, changed: ch}); });
        case '/api/shows': return showsPost(b);
        case '/api/restart': return LAPTOP('restarting the light engine');
        case '/api/lights/lineup': LINEUP.on = !!b.on; LINEUP.until = now() + 60; return ok();
        case '/api/lights/arrange': if (b.how && b.how !== 'row') return LAPTOP('hanging curtains ' + ({stack: 'stacked', grid: 'in a grid', overlap: 'overlapped'}[b.how] || 'another way'));
          if (b.order && b.order[0] === DEVS[1].id) return LAPTOP('swapping the curtains around'); return ok();
        case '/api/lights/lock': LINEUP.on = false; setTimeout(() => toast('🔒 Layout locked (in the demo nothing restarts)'), 60); return ok();
        case '/api/scene': { const segs = (b.segments || []).slice(0, 12); if (!segs.length) return {status: 400, json: {error: 'a scene needs segments'}};
          const effs = segs.map(sg => sg.effect || (sg.layers || []).map(l => l.effect).join(' + ') || sg.look || b.name);
          const clips = segs.map(sg => (sg.look && !sg.effect ? lookClip(sg.look) : null) || effectClip(sg.effect || ((sg.layers || [])[0] || {}).effect) || (sg.look ? lookClip(sg.look) : pickOne(SPECTACLE)));
          S.scene = {name: b.name || 'scene', segs, effects: effs, clips, i: 0, t0: now()}; S.feature = null; bump('scene');
          return {json: {ok: true, name: S.scene.name, segments: segs.length, total_seconds: segs.reduce((a, s) => a + (+s.seconds || 30), 0), loop: !!b.loop}}; }
        case '/api/scene/stop': S.scene = null; return ok();
        case '/api/fire': { Object.keys(b).forEach(k => { if (k !== 'group') FIRE[k] = b[k]; }); if (b.on) bump('fire'); return ok(); }
        case '/api/score': scoreCmd(b); return ok();
        case '/api/feeds': feedsCmd(b); return ok();
        case '/api/text': {
          if (b.preset_save) { const p = {name: String(b.name || TX.s.text || 'Logo').slice(0, 40), kind: b.preset_save === 'logo' && TX.logo ? 'logo' : 'text'};
            if (p.kind === 'logo') p.logo = TX.logo; else Object.assign(p, {text: TX.s.text, mode: TX.s.mode, color: TX.s.color});
            TX.presets = TX.presets.filter(x => !(x.name === p.name && x.kind === p.kind)).concat([p]); return ok(); }
          if ('preset_delete' in b) { TX.presets = TX.presets.filter(x => !(x.name === b.preset_delete && (!b.preset_kind || x.kind === b.preset_kind))); return ok(); }
          if ('preset' in b) { const p = TX.presets.slice().reverse().find(x => x.name === b.preset && (!b.preset_kind || x.kind === b.preset_kind)); if (!p) return ok();
            if (p.kind === 'logo') { TX.logo = p.logo; Object.assign(TX.s, {has_logo: true, logo_name: p.name, show: TX.s.show === 'both' ? 'both' : 'logo'}); }
            else Object.assign(TX.s, {text: p.text, mode: p.mode || 'scroll', color: p.color || 'look', show: TX.s.show === 'both' ? 'both' : 'text'});
            TX.t0 = now(); return ok(); }
          if ('logo' in b) { if (!b.logo) { TX.logo = null; TX.s.has_logo = false; TX.s.logo_name = ''; } else { TX.logo = {rgb: b.logo.rgb, w: +b.logo.w || W, h: +b.logo.h || H}; TX.s.has_logo = true; TX.s.logo_name = String(b.logo.name || 'logo').slice(0, 40); } }
          ['text', 'mode', 'color', 'layer', 'size', 'logo_mode', 'drop_word', 'show'].forEach(k => { if (b[k] != null) TX.s[k] = String(b[k]).slice(0, 200); });
          if ('speed' in b) TX.s.speed = clamp(+b.speed, .3, 3); if ('drop_flash' in b) TX.s.drop_flash = !!b.drop_flash;
          if (['logo', 'both'].includes(TX.s.show) && !TX.logo) TX.s.show = TX.s.show === 'both' ? 'text' : 'off';
          TX.t0 = now(); return ok(); }
        case '/api/dj': {
          const t = now();
          lpObserve('dj', b); shObserve('dj', b);
          if (b.drop_style) DJ.dstyle = String(b.drop_style);
          if (b.hit === 'blackout') DJ.black = 'on' in b ? !!b.on : !DJ.black;
          else if (b.hit && b.snap === false) djFire(b.hit, b.beats);     // ⚡ instant pads fire right now; snapped ones wait for the beat
          else if (b.hit) DJ.queue.push(b.hit);
          if ('build' in b) { if (b.build && DJ.build == null) { DJ.build = t; BSECS = clamp(+b.secs || 8, 2, 120); let st = String(b.style || 'spin'); if (!DJ.firstBuild) { DJ.firstBuild = true; st = 'star'; }   // ⭐ the first build anyone sees in the demo is the spinning rainbow star
             DJ.bstyle = st === 'auto' ? pickOne(BUILD_STYLES.filter(x => x !== DJ.bstyle)) : BUILD_STYLES.includes(st) ? st : 'spin'; } else if (!b.build && DJ.build != null) { const held = t - DJ.build; DJ.build = null; if (held > .4 && !b.cancel) DJ.queue.push('drop'); } }
          if ('cue' in b) DJ.cue = b.cue && CAT.looks[b.cue] ? b.cue : null;
          if (b.tap) { DJ.taps = DJ.taps.filter(x => t - x < 3).concat([t]);
            if (DJ.taps.length >= 3) { const iv = DJ.taps.slice(-8).map((x, i, a) => i ? x - a[i - 1] : 0).slice(1).filter(v => v > .25 && v < 1.5).sort((a, c) => a - c);
              if (iv.length >= 2) DJ.tap_bpm = clamp(60 / iv[iv.length >> 1], 60, 200); } }
          if (b.tap_off) { DJ.tap_bpm = null; DJ.taps = []; }
          if (b.say) { const w = String(b.say).toUpperCase().slice(0, 40).trim(); if (w) DJ.word = {w, t0: t}; }
          if (Array.isArray(b.colors)) { const cs = b.colors.slice(0, 64).map(c => String(c).trim().replace('#', '')).filter(h => /^[0-9a-f]{6}$/i.test(h)).map(h => [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))); if (cs.length) DJ.colorCols = cs; }   // 🎨 colour key
          if ('color' in b) DJ.colorOn = !!b.color && DJ.colorCols.length > 0;
          if ('cool' in b) { if (b.cool) { if (b.latch) DJ.coolLatch = true; else DJ.coolUntil = t + clamp(num(b.ttl, 1.5), .3, 5); } else { DJ.coolLatch = false; DJ.coolUntil = 0; } }   // 🌙 cool down
          if (b.reset) djReset();
          return ok(); }
        case '/api/music': return musicCmd(b);
        case '/api/media': { const a = b.action;
          if (a === 'playpause') musicCmd({action: 'toggle'}); else if (a === 'next' || a === 'prev') { musicCmd({action: a}); toast('🎵 ' + M.queue[M.idx].title + ' · ' + M.queue[M.idx].artist); }
          else if (a === 'seek') musicCmd({action: 'seek', pos: b.pos}); else if (a === 'vol') musicCmd({action: 'volume', volume: b.level});
          else if (a === 'mute') { if (M.volume > 0) { M._vol = M.volume; M.volume = 0; } else M.volume = M._vol || 70; }
          return ok(); }
        case '/api/license': return LAPTOP('entering a license key');
        case '/api/keys': return LAPTOP('saving song lookup keys');
        case '/api/support': setTimeout(() => toast('Demo: nothing was sent. Reach us from the Contact page'), 2600); return ok({sent: true, ticket: 'GB-DEMO'});
        case '/api/quit': QUIT = true; return ok();                  // ⏻ Oct 21: the demo plays the real shutdown, then starts again
        case '/api/filters': return {json: fltCmd(b || {})};
        case '/api/music/signin': return LAPTOP('YouTube Music sign-in');
        case '/api/music/host': return ok();
        case '/api/lights/identify': S.flash[b.id] = now() + 1.6; return ok();
        case '/api/lights/toggle': { DEV_ON[b.id] = !!b.enabled; const d = DEVS.find(x => x.id === b.id), nm = d ? d.name : 'That light'; return ok({msg: nm + (b.enabled ? ' is coming on.' : ' is off.')}); }   // 🔌 Oct 21: instant, like the app
        case '/api/lights/rename': { const d = DEVS.find(x => x.id === b.id); if (d && b.name) d.name = String(b.name).slice(0, 40); return ok(); }
        case '/api/lights/apply': return ok();
        case '/api/lights/scan': return LAPTOP('finding lights on your Wi-Fi');
        case '/api/lights/add': return LAPTOP('adding a light');
        case '/api/lights/remove': return LAPTOP('removing a light');
        case '/api/map/start': case '/api/map/show': case '/api/map/finish': case '/api/map/cancel': return LAPTOP('camera mapping');
        case '/api/effect': return LAPTOP('adding new effect code');
      }
      if (path.startsWith('/api/lights/')) return LAPTOP('changing your light setup');
    }
    unhandled.push(method + ' ' + path); log('unhandled endpoint', method, path, b || '');
    return ok();
  }

  // ======================================================================= fetch: every /api/ call goes to the pretend engine
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || String(input);
    if (!/\/api\/|\/helper\/status/.test(url)) return realFetch(input, init);
    const u = new URL(url, location.href), method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    let body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) { body = {}; }
    let r; try { r = await handle(method, u.pathname.replace(/^.*?(\/api\/|\/helper\/)/, '$1'), u.searchParams, body); }
    catch (e) { console.error('[demo] engine error', method, u.pathname, e); r = {status: 500, json: {error: 'demo engine error'}}; }
    return new Response(JSON.stringify(r.json == null ? {} : r.json), {status: r.status || 200, headers: {'Content-Type': 'application/json'}});
  };

  // the camera and DJ controllers would need the laptop: say so instead of asking for permissions
  try { if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => { setTimeout(() => toast('💻 In the demo, camera mapping needs the GlowBop laptop app'), 80);
    return Promise.reject(new Error('needs the GlowBop laptop app')); }; } catch (e) {}
  try { if (navigator.requestMIDIAccess) navigator.requestMIDIAccess = () => { setTimeout(() => toast('💻 In the demo, DJ controllers need the GlowBop laptop app'), 80);
    return Promise.resolve({inputs: new Map(), outputs: new Map(), onstatechange: null}); }; } catch (e) {}
  // ✏️ the layout editor draws its photo from /api/layout/photo: in the demo the photo lives in this tab (a data: URL) instead
  try { const ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {configurable: true, enumerable: ih.enumerable, get() { return ih.get.call(this); },
      set(v) { if (typeof v === 'string' && v.indexOf('/api/layout/photo') >= 0) v = v.replace(/\/api\/layout\/photo\?t=\d+/g, LAY.photo || 'data:,'); if (typeof v === 'string' && v.indexOf('/api/stage/photo') >= 0) v = v.replace(/\/api\/stage\/photo\?t=\d+/g, ST.photo || 'data:,'); ih.set.call(this, v); }}); } catch (e) {}

  // the phone-link QR code and other app images live on the laptop: the demo shows its own little picture instead of a broken image
  try { const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    const QR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="10" fill="#fff"/>' +
      '<text x="60" y="52" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="700" font-size="15" fill="#000">ON THE LAPTOP</text>' +
      '<text x="60" y="74" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="12" fill="#444">your phone link QR</text></svg>');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {configurable: true, enumerable: d.enumerable, get() { return d.get.call(this); },
      set(v) { if (/^\/api\/qr\.svg/.test(String(v))) v = QR; else if (/^\/api\//.test(String(v))) v = ''; d.set.call(this, v); }}); } catch (e) {}

  window.__demoWall = () => ({clip: lastSrc.clip || lastSrc.kind || '', label: lastSrc.label || ''});   // handy for tests
  window.__demoPads = () => DJ.pfx.map(p => p.k);
  window.__demoLastDrop = () => DJ.lastDrop;                                                              // which drop style just played (tests)                                                       // one-shot pads on the wall right now (tests)

  // ======================================================================= start
  function boot() {
    SB.s = JSON.parse(JSON.stringify(ENG.score)); SB.s.on = false; SB.s.mode = 'game'; SB.s.sport = 'basketball';
    Object.assign(SB.s.home, {name: 'HEAT', color: '#e8384f', score: 52}); Object.assign(SB.s.away, {name: 'BOLTS', color: '#3d7bff', score: 49});
    SB.s.period = 3; resetClock(); SB.s.clock = 5 * 60 + 12;
    FIRE = {on: false, color: 'classic', dance: false, mode: 'cozy', style: 'fireplace', beat: false, team1: '#ff3d9a', team2: '#33d6ff'};
    TX.s = Object.assign({}, ENG.text.state, {text: 'WELCOME TO THE PARTY'});
    TX.presets = [{name: 'HAPPY BIRTHDAY JACK', kind: 'text', text: 'HAPPY BIRTHDAY JACK *', mode: 'scroll', color: 'rainbow'}, {name: 'LETS DANCE', kind: 'text', text: 'LETS DANCE', mode: 'beat', color: 'look'}];
    FD.s = JSON.parse(JSON.stringify(FEEDS0));
    S.look = '3D Object'; S.pace = 'hype'; M.idx = 0;
    M.queue = EMBED_SHOWY ? M.queue.filter(t => !CHILL_TITLES.includes(t.title)) : M.queue.filter(t => !CHILL_TITLES.includes(t.title)).concat(M.queue.filter(t => CHILL_TITLES.includes(t.title)));
    S.effect = pickOne(showyFx(CAT.looks[S.look].mid));
    BPM = songBpm(M.queue[M.idx]); M.posAt = now(); showsSeed(); pdSeed(); S.cameos = true;
    ['look-neon-party', 'live-storm'].forEach(loadClip);
    setInterval(tick, 250);
    log('pretend engine running: ' + Object.keys(CLIPS).length + ' recorded clips, ' + Object.keys(CAT.looks).length + ' looks');
  }

  // ======================================================================= 🖼️ embed mode: /try/?embed=1#dj inside the home page's frame
  // No DEMO banner (demo.css hides it), links leave the frame (target _top), and scrolling stays inside the frame.
  const EMBED = /[?&]embed=1\b/.test(location.search);
  if (EMBED) {
    document.documentElement.classList.add('gb-embed');
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      const h = a.getAttribute('href') || '';
      if (h[0] === '#' || /^javascript:/i.test(h) || (a.target && a.target !== '_self')) return;
      a.target = '_top';
    }, true);
    const open0 = window.open;
    window.open = (u, t, f) => open0.call(window, u, t && t !== '_self' ? t : '_top', f);
    // the app scrolls panels into view; inside a frame that would also scroll the page around the frame, so scroll only in here
    Element.prototype.scrollIntoView = function (o) {
      const opt = typeof o === 'object' && o ? o : {block: o === false ? 'end' : 'start'}, r = this.getBoundingClientRect();
      if (opt.block === 'nearest') {
        for (let p = this.parentElement; p && p !== document.body; p = p.parentElement) {
          const cs = getComputedStyle(p); if (!/(auto|scroll)/.test(cs.overflowY + cs.overflowX) || p.scrollHeight <= p.clientHeight && p.scrollWidth <= p.clientWidth) continue;
          const pr = p.getBoundingClientRect();
          if (r.top < pr.top) p.scrollTop += r.top - pr.top; else if (r.bottom > pr.bottom) p.scrollTop += r.bottom - pr.bottom;
          if (r.left < pr.left) p.scrollLeft += r.left - pr.left; else if (r.right > pr.right) p.scrollLeft += r.right - pr.right;
          return;
        }
        if (r.top >= 0 && r.bottom <= innerHeight) return;
      }
      const y = scrollY + r.top - (opt.block === 'center' ? (innerHeight - r.height) / 2 : opt.block === 'end' ? innerHeight - r.height : 0);
      window.scrollTo({top: Math.max(0, y), behavior: opt.behavior === 'smooth' ? 'smooth' : 'auto'});
    };
  }

  // ======================================================================= 🎧 DJ page: the playable controls sit right under the wall
  // demo.css packs the DJ page (fader board moved up by sync_ui.py). On a phone or upright iPad the console header and wall come
  // first, so the demo scrolls just far enough that Build, the hit pads and (when they fit) the faders are on screen with the wall.
  function fitDJ() {
    if (!window.GB || GB.page !== 'dj' || document.body.classList.contains('wallfull')) return;
    const q = s => document.getElementById(s), wb = q('wallBox'), view = wb && wb.closest('.panel'), pads = q('djPadsPanel'), fd = q('fdPanel');
    if (!view || !pads) return;
    const bar = q('demoBar'), barH = bar && bar.offsetParent !== null ? bar.getBoundingClientRect().height : 0;
    const docTop = el => el.getBoundingClientRect().top + scrollY, docBot = el => el.getBoundingClientRect().bottom + scrollY;
    const wallTop = docTop(view) - barH - 6, room = innerHeight - barH;
    const last = fd && docBot(fd) - docTop(view) + 6 <= room ? fd : pads;
    // nothing to do when it all fits already; otherwise go all the way to the wall (a half-cut header looks broken)
    const y = docBot(last) - innerHeight + 10 > 0 ? Math.max(0, wallTop) : 0;
    if (Math.abs(scrollY - y) > 2) window.scrollTo({top: y, behavior: 'auto'});
    fitDJ.at = y;
  }
  window.__demoFitDJ = fitDJ;   // handy for tests
  function fitSoon() { [140, 600, 1500].forEach(ms => setTimeout(() => { if (scrollY === 0 || scrollY === fitDJ.at) fitDJ(); }, ms)); }
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.GB) return;
    GB.on('page', id => { document.body.classList.toggle('demo-dj', id === 'dj'); if (id === 'dj') fitSoon(); });
    document.body.classList.toggle('demo-dj', GB.page === 'dj');
    if (GB.page === 'dj') fitSoon();
    let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (scrollY === 0 || scrollY === fitDJ.at) fitDJ(); }, 200); });
  });

  // ======================================================================= the DEMO banner
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('demoBar'); if (!bar) return;
    // ✕ EXIT: back to where they came from on glowbop.com (or the home page)
    bar.querySelector('.dm-x').onclick = e => {
      let same = false; try { same = !!document.referrer && new URL(document.referrer).origin === location.origin && !/\/try\/?$/.test(new URL(document.referrer).pathname); } catch (x) {}
      if (same && history.length > 1) { e.preventDefault(); history.back(); }
    };
  });
})();
