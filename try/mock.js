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
                    'Retro Arcade': ['fx-breakout', 'fx-snakegame', 'fx-pongbattle', 'fx-alienparade', 'fx-vectorrocks', 'look-retro-arcade']};
  const FX_ALIAS = {TetrisDrop: 'look-retro-arcade', LightCycles: 'look-neon-grid', GameOfLife: 'look-digital-matrix', Campfire: 'fire-campfire',
    LavaFlow: 'look-lava-lounge', LavaLamp: 'look-lava-lounge', LavaPurple: 'look-molten', LavaRainbow: 'look-psychedelic', Sunrise: 'look-blue-sky',
    WarpSpeed: 'look-hyperspace', BlackHole: 'look-deep-space', Aurora: 'look-fairy-forest', BlobParty: 'look-psychedelic', SoloSprite: 'look-dance-crew',
    MatrixRain: 'look-digital-matrix', LiquidMelt: 'look-liquid-dreams', OceanWaves: 'look-storm-sea', Thunderstorm: 'look-storm-sea',
    PlanetRise: 'look-deep-space', SpiralHypnosis: 'look-hypnotic', Shockwave: 'look-neon-party', FireworkShow: 'fx-pixelfireworks', Fireworks: 'fx-pixelfireworks',
    Waves: 'wave-bigwave', BigWave: 'wave-bigwave', Eyeball: 'look-hypnotic'};
  function lookClip(look, k) { const set = LOOK_SET[look]; if (set) return set[(k || 0) % set.length];
    const c = 'look-' + slug(look); return has(c) ? c : 'look-neon-party'; }
  function effectClip(e) {
    if (!e) return null; const l = String(e).toLowerCase();
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
  let BPM = 124, beatPos = 0, lastClock = now(), forceSec = null, songLook = 0;
  function clock() { const t = now(); beatPos += (t - lastClock) * (DJ.tap_bpm || BPM) / 60; lastClock = t; return beatPos; }
  const SECS = ['groove', 'build', 'drop', 'break'];
  function sectionInfo() {
    const b = clock(), bars = {chill: 16, normal: 8, hype: 4}[S.pace] || 8, k = Math.floor(b / 4 / bars);
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
      const lk = CAT && CAT.looks[S.look]; if (lk) S.effect = pickOne(si.name === 'drop' ? lk.high : si.name === 'break' ? lk.low : lk.mid);
      if (si.name === 'drop' && TX.s.drop_flash) TX.dropUntil = now() + 2.2;
    }
    return si;
  }
  function autoLook() { const ls = Object.keys(CAT.looks).filter(n => n !== S.look && n !== 'Retro Arcade'); S.look = pickOne(ls); }
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
  const DJ = {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: [], cue: null, taps: [], tap_bpm: null, _lb: null};
  function djReset() { Object.assign(DJ, {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: [], cue: null, taps: [], tap_bpm: null}); }
  function djFire(a) {
    const P = DJ.parts;
    if (a === 'drop') {
      DJ.flash = 1; DJ.black = false; DJ.rings.push({x: W / 2, y: H / 2, r: 0, c: [255, 255, 255]});
      for (let i = 0; i < 70; i++) { const an = R() * 6.283, sp = 8 + R() * 22; P.push({x: W / 2, y: H / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 0, c: pickOne([[255, 61, 154], [51, 214, 255], [255, 204, 102], [155, 61, 255]])}); }
      forceSec = {name: 'drop', until: now() + 8};
      if (DJ.cue) { setLook(DJ.cue, false); DJ.cue = null; S.feature = {clip: lookClip(S.look), name: S.look, until: 0}; }
      else { const c = pickOne(SPECTACLE); S.feature = {clip: c, name: titleOf(c), until: now() + 24}; }
    }
    if (a === 'flash') DJ.flash = 1;
    if (a === 'strobe') DJ.strobe = now() + 4 * 60 / (DJ.tap_bpm || BPM);
    if (a === 'fire') { for (let i = 0; i < 90; i++) { const an = -Math.PI / 2 + (R() - .5) * 1.6, sp = 10 + R() * 20; P.push({x: W / 2 + (R() - .5) * 6, y: H - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 9, c: pickOne([[255, 90, 0], [255, 190, 30], [255, 40, 0], [255, 240, 160]])}); }
      DJ.rings.push({x: W / 2, y: H - 1, r: 0, c: [255, 120, 0]}); }
    if (a === 'confetti') { for (const side of [0, W - 1]) for (let i = 0; i < 40; i++) { const an = -Math.PI / 2 + (side ? -1 : 1) * (.45 + R() * .5), sp = 16 + R() * 12;
      P.push({x: side, y: H - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1.6, g: 14, c: pickOne([[255, 61, 154], [51, 214, 255], [255, 204, 102], [60, 224, 138], [204, 153, 255], [255, 255, 255]])}); } }
  }
  function djApply(buf, t, dt) {
    const bi = Math.floor(beatPos); if (DJ.queue.length && bi !== DJ._lb) { const q = DJ.queue; DJ.queue = []; q.forEach(djFire); }
    DJ._lb = bi;
    if (DJ.build != null) {                                        // rising wall of light, faster and whiter
      const k = Math.min(1, (t - DJ.build) / 6), rate = 2 + 14 * k * k, pulse = .5 + .5 * Math.sin(t * rate * 6.283), top = H * (1 - k);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; for (let c = 0; c < 3; c++) buf[i + c] *= 1 - .55 * k;
        if (y >= top) { const hh = (x / W + t / 2.5) % 1, col = [.5 + .5 * Math.cos(6.283 * hh), .5 + .5 * Math.cos(6.283 * (hh - .33)), .5 + .5 * Math.cos(6.283 * (hh - .66))];
          const lv = (.3 + .6 * k * pulse) * 255; for (let c = 0; c < 3; c++) buf[i + c] = Math.max(buf[i + c], (col[c] * (1 - k) + k) * lv); }
        if (R() < .01 + .05 * k) buf[i] = buf[i + 1] = buf[i + 2] = 255; }
    }
    for (const r of DJ.rings) { r.r += dt * 26; for (let a = 0; a < 6.283; a += .12) put(buf, r.x + Math.cos(a) * r.r, r.y + Math.sin(a) * r.r * .9, r.c, Math.max(0, 1 - r.r / 30)); }
    DJ.rings = DJ.rings.filter(r => r.r < 30);
    for (const q of DJ.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .97; q.vy = q.vy * .97 + q.g * dt; q.l -= dt * .9; if (q.l > 0) put(buf, q.x, q.y, q.c, Math.min(1, q.l * 1.4)); }
    DJ.parts = DJ.parts.filter(q => q.l > 0);
    if (DJ.word) {                                                  // big scrolling words over a dimmed show
      const el = t - DJ.word.t0, dur = 2.8; if (el > dur) DJ.word = null;
      else { const m = textMask(DJ.word.w, H), x0 = Math.round(W - (el / dur) * (W + m.w)), y0 = Math.max(0, ((H - m.h) / 2) | 0), hh = el / .7;
        const col = [.5 + .5 * Math.cos(6.283 * hh), .5 + .5 * Math.cos(6.283 * (hh - .33)), .5 + .5 * Math.cos(6.283 * (hh - .66))].map(v => 120 + 135 * v);
        stamp(buf, m, x0, y0, () => col, .35); }
    }
    if (DJ.strobe > t) { const on = Math.floor(t / .055) % 2 === 0; for (let i = 0; i < buf.length; i++) buf[i] = on ? 255 : buf[i] * .05; }
    if (DJ.flash > .01) { for (let i = 0; i < buf.length; i++) buf[i] = Math.max(buf[i], 255 * DJ.flash); DJ.flash *= Math.pow(.02, dt); }
    if (DJ.black) buf.fill(0);
  }
  const djInfo = () => ({cue: DJ.cue, building: DJ.build != null, blackout: DJ.black, tap_bpm: DJ.tap_bpm ? Math.round(DJ.tap_bpm) : null,
    queued: DJ.queue.slice(), strobing: now() < DJ.strobe});

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
    if (f.kind === 'takeover') { if (b.on === false) { if (s.mode === k) s.mode = 'off'; } else if (b.on || b.mode === k) { s.mode = k; bump('feed'); } }
  }
  const FEED_CLIP = {countdown: 'live-countdown', weather: 'live-weather', overhead: 'live-overhead', golf: 'live-golf', nascar: 'live-nascar'};
  function boardText(k) {                                           // tennis / UFC have no recording: a scrolling ticker of the sample board
    const f = FD.s.feeds[k], rows = f.rows || [];
    if (k === 'tennis') return rows.filter(r => r.state !== 'pre').map(r => `${r.a.short} ${r.a.sets.replace(/ /g, '-')}  ${r.b.short} ${r.b.sets.replace(/ /g, '-')}`).join('   ·   ');
    return rows.slice(0, 4).map(r => `${r.red.short} VS ${r.blue.short}${r.res ? '  ' + r.res : ''}`).join('   ·   ');
  }

  // ======================================================================= 🎵 music: GlowBop's own player, playing pretend songs
  const SONGS = [['Neon Summer (Demo Mix)', 'The Glow Ups', 224, 'Neon Party'], ['Midnight Circuit', 'Pixel Hearts', 201, 'Synthwave'], ['Bass Lanterns', 'DJ Lumen', 238, 'Warehouse Rave'],
    ['Velvet Laser', 'Aurora Club', 212, 'Club Rig'], ['Starlight Freeway', 'Synth Coast', 196, 'Deep Space'], ['Heatwave Hands Up', 'Bop Machine', 187, 'Mainstage'],
    ['Ocean Drive Lights', 'Miami Pulse', 205, 'Big Wave'], ['After Hours Arcade', 'Retro Pilots', 179, 'Retro Arcade']];
  const track = (x, i) => ({id: 'demo' + i, title: x[0], artist: x[1], dur: x[2], artist_id: 'artist' + i, look: x[3]});
  const M = {queue: SONGS.map(track), idx: 0, pos: 37, playing: true, volume: 70, party: false, sleep_at: 0, crossfade: 6, source: 'Demo mix', recent: []};
  function songChanged() {
    const t = M.queue[M.idx]; M.pos = 0; M.recent = [t].concat(M.recent.filter(x => x.id !== t.id)).slice(0, 8);
    if (!S.pinned) { S.held = null; if (S.shuffle) S.look = t.look && CAT.looks[t.look] ? t.look : S.look; S.lookK = 0; }
  }
  function musicState() { const t = M.queue[M.idx] || null, lo = Math.max(0, M.idx - 3);
    return {now: t, idx: M.idx, playing: M.playing, volume: M.volume, source: M.source, pos: M.pos, dur: t ? t.dur : 0, player: true, player_state: M.playing ? 'playing' : 'paused',
      signed_in: false, account: null, queue: M.queue.slice(lo, lo + 60).map((x, i) => Object.assign({}, x, {i: lo + i})), total: M.queue.length, crossfade: M.crossfade, party: M.party,
      sleep_left: M.sleep_at ? Math.max(0, Math.round(M.sleep_at - wall())) : null, family: t && t.look ? [t.look] : [], family_how: 'auto', source_id: 'demo'}; }
  let ytNote = 0;
  const ytToast = () => { if (wall() - ytNote > 20) { ytNote = wall(); setTimeout(() => toast('🎵 In the demo, YouTube shows pretend songs. On the laptop it is the real YouTube Music'), 900); } };
  function fakeSongs(q, n) { const w = String(q || 'Glow').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 28);
    return [`${w} (Demo Mix)`, `${w} All Night`, `Lights Up for ${w}`, `${w} (Club Edit)`, `Neon ${w}`, `${w} Forever`].slice(0, n || 6).map((tt, i) =>
      ({id: 'q' + slug(w) + i, title: tt, artist: pickOne(['The Glow Ups', 'Pixel Hearts', 'DJ Lumen', 'Aurora Club']), dur: 170 + i * 13, artist_id: 'artist' + (i % 4)})); }
  function musicCmd(b) {
    const a = b.action, t = b.track;
    if (a === 'toggle') M.playing = !M.playing;
    else if (a === 'next') { M.idx = (M.idx + 1) % M.queue.length; songChanged(); M.playing = true; }
    else if (a === 'prev') { if (M.pos > 5) M.pos = 0; else { M.idx = (M.idx - 1 + M.queue.length) % M.queue.length; songChanged(); } }
    else if (a === 'seek') M.pos = clamp(+b.pos || 0, 0, (M.queue[M.idx] || {}).dur || 0);
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
    return {layout: 'canvas', canvas: [W, H], https: '', locked: true, arrange: 'row', grid_shape: null, shape: null, lineup: false, mapping: false, points: pts,
      groups: [{id: 'g1', name: 'Main', w: W, h: H, layout: 'canvas', devices: DEVS.map(d => d.id)}],
      devices: DEVS.map(d => ({id: d.id, type: 'twinkly', brand: 'Twinkly', ip: d.ip, name: d.name, n: 420, enabled: DEV_ON[d.id] !== false, mapped: false, grid: true, connected: true,
        orient: {rot: 0, flip: false}, place: null, pos: [d.x0, 0], gw: 20, gh: H, is_grid: true, overlap_on: null, overlap: 'xy', overlap_at: 'center'}))};
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
      const set = ['holiday-' + S.holiday].concat(MOV[S.holiday] ? [MOV[S.holiday]] : []), c = set[si.k % set.length];
      const fx = (S.holFx && S.holFx.length ? S.holFx : h.fx.map(f => f.name)); return {clip: c, label: fx[si.k % fx.length], holiday: h}; }
    if (k === 'scene') { const sc = S.scene, seg = sc.segs[sc.i] || {}; return {clip: sc.clips[sc.i] || 'look-neon-party', label: sc.effects[sc.i] || sc.name}; }
    if (S.locked) return {clip: effectClip(S.locked) || lookClip(S.look, S.lookK), label: S.locked};
    if (S.feature && (S.feature.until === 0 || S.feature.until > t)) return {clip: S.feature.clip || lookClip(S.look, S.lookK), label: S.feature.name};
    if (S.cameo > t) return {kind: 'eye', label: 'Eyeball'};
    const lc = lookClip(S.look, S.lookK), lk = LOOK_SET[S.look];
    return {clip: lc, label: lk ? titleOf(lc) : S.effect};
  }

  // ======================================================================= painting one frame
  let buf = new Float32Array(N * 3), curClip = null, clipT0 = now(), lastT = now(), spk = new Float32Array(N), lastLevel = 0, lastSrc = {label: ''};
  const HEX = []; for (let i = 0; i < 256; i++) HEX.push(i.toString(16).padStart(2, '0'));
  function paint() {
    const t = now(), dt = Math.min(.25, t - lastT); lastT = t; clock();
    const si = followShow(), src = source(t, si); lastSrc = src;
    buf.fill(0);
    if (src.clip) {
      if (src.clip !== curClip) { curClip = src.clip; clipT0 = t; }
      let c = clipNow(src.clip);
      if (!c && lastGood) c = lastGood;                             // still downloading: keep the last picture going
      if (c) { lastGood = c; const f = Math.floor((t - clipT0) * c.fps * (src.speed || 1)) % c.n, base = f * c.w * c.h * 4;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = base + ((y % c.h) * c.w + (x % c.w)) * 4, i = (y * W + x) * 3;
          buf[i] = c.px[j]; buf[i + 1] = c.px[j + 1]; buf[i + 2] = c.px[j + 2]; } }
      if (src.recolor) recolor(buf, src.recolor, t, FIRE);
      if (src.fire && (FIRE.beat || FIRE.dance)) { const k = 1 + (FIRE.beat ? .35 * Math.pow(1 - beatPos % 1, 4) : 0) + (FIRE.dance ? .15 * Math.sin(beatPos * Math.PI / 2) : 0); for (let i = 0; i < buf.length; i++) buf[i] *= k; }
    } else if (src.kind === 'board') drawBoard(buf, t);
    else if (src.kind === 'ticker') { const m = textMask(src.text, 17), span = W + m.w, x0 = Math.round(W - ((t - clipT0) * 11) % span);
      for (let x = 0; x < W; x++) { put(buf, x, 0, src.color.map(v => v * .6)); put(buf, x, H - 1, src.color.map(v => v * .6)); }
      stamp(buf, m, x0, ((H - m.h) / 2) | 0, () => [255, 255, 255]); }
    else if (src.kind === 'eye') eye(buf, t);
    if (src.holiday && HOL_NAME.text && (t % 14) < 4.2) {         // 🎂 the birthday name / 🏈 team name flies across now and then
      const m = textMask(HOL_NAME.text, H), el = (t % 14) / 4.2; stamp(buf, m, Math.round(W - el * (W + m.w)), ((H - m.h) / 2) | 0, (x) => HOL_NAME.cols[x < W / 2 ? 0 : 1], .3); }
    if (FD.alert) { if (FD.alert.until < t) FD.alert = null; else { const c = clipNow('live-storm'); if (c) { const f = Math.floor(t * c.fps) % c.n, base = f * c.w * c.h * 4;
      for (let i = 0; i < N; i++) { const j = base + i * 4; buf[i * 3] = c.px[j]; buf[i * 3 + 1] = c.px[j + 1]; buf[i * 3 + 2] = c.px[j + 2]; } } } }
    if (S.power) textOverlay(buf, t, si);
    // ✨ sparkles: auto = a few on the drops, lots = always glittering
    const want = S.sparkles === 'lots' ? .012 : S.sparkles === 'auto' && si.name === 'drop' ? .004 : 0;
    for (let i = 0; i < N; i++) { if (want && R() < want) spk[i] = 1; if (spk[i] > .02) { const v = spk[i] * 255; buf[i * 3] = Math.max(buf[i * 3], v); buf[i * 3 + 1] = Math.max(buf[i * 3 + 1], v); buf[i * 3 + 2] = Math.max(buf[i * 3 + 2], v); spk[i] *= Math.pow(.004, dt); } else spk[i] = 0; }
    if (S.power) djApply(buf, t, dt);
    // a curtain switched off in Setup is dark; Flash lights one up white
    DEVS.forEach(d => { const off = DEV_ON[d.id] === false, fl = S.flash[d.id] > t; if (!off && !fl) return;
      for (let y = 0; y < H; y++) for (let x = d.x0; x < d.x0 + 20; x++) { const i = (y * W + x) * 3, v = off ? 0 : (Math.floor(t * 6) % 2 ? 255 : 30); buf[i] = buf[i + 1] = buf[i + 2] = v; } });
    const k = S.power ? S.brightness / 100 : 0; let out = '', sum = 0;
    for (let i = 0; i < N * 3; i++) { const v = clamp(Math.round(buf[i] * k), 0, 255); sum += v; out += HEX[v]; }
    lastLevel = sum / (N * 3 * 255);
    return out;
  }
  let lastGood = null;
  function eye(buf, t) {                                            // 👁️ the Eyeball key: an eye that looks around and blinks
    const cx = 20, cy = 10, lx = cx + Math.sin(t * 1.3) * 5, ly = cy + Math.sin(t * .9) * 2, blink = (t % 3.2) < .18;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = ((x - cx) / 15) ** 2 + ((y - cy) / (blink ? 1 : 9)) ** 2; if (e > 1) continue;
      const d = Math.hypot(x - lx, (y - ly) * 1.1); put(buf, x, y, d < 2 ? [0, 0, 0] : d < 5 ? hue(.52 + d * .02, .8, 1) : [235, 235, 245]); }
  }
  const HOL_NAME = {text: '', cols: [[255, 255, 255], [255, 255, 255]]};

  // ======================================================================= the clock that keeps things moving
  let FIRE = null, lastTick = now();
  function tick() {
    const t = now(), dt = t - lastTick; lastTick = t;
    if (M.playing) { M.pos += dt; const cur = M.queue[M.idx]; if (cur && M.pos >= cur.dur) { M.idx = (M.idx + 1) % M.queue.length; songChanged(); } }
    if (M.sleep_at && wall() > M.sleep_at) { M.sleep_at = 0; M.playing = false; }
    const s = SB.s; if (s && s.running) { const c = cfg(); s.clock += c.dir === 'up' ? dt : -dt; if (s.clock <= 0 && c.dir === 'down') { s.clock = 0; s.running = false; } }
    if (s && s.on && s.mode === 'live' && s.live && wall() - SB.liveT > 45) { SB.liveT = wall();                   // the followed game moves on
      if (R() < .5) { const side = R() < .6 ? 'home' : 'away', p = {football: pickOne([3, 7]), basketball: pickOne([2, 3]), baseball: 1}[s.leagues_sport[s.league]] || 1; s.live[side].score += p; DJ.queue.push('confetti'); } }
    if (S.scene) { const sc = S.scene, seg = sc.segs[sc.i] || {}; if (t - sc.t0 > Math.min(30, +seg.seconds || 30)) { sc.i = (sc.i + 1) % sc.segs.length; sc.t0 = t; } }
    if (S.feature && S.feature.until && S.feature.until < t) S.feature = null;
  }

  // ======================================================================= status (what /api/status returns)
  function status() {
    const si = sectionInfo(), src = lastSrc, t = now(), beat = Math.pow(1 - (beatPos % 1), 2);
    const lvl = S.power ? clamp(lastLevel * 2.2 * (.65 + .35 * beat) + R() * .08, 0, 1) : 0;
    const fp = Object.assign({}, ENG.fire, FIRE), fd = FD.s, w = Object.values(fd.feeds).filter(f => f.kind === 'watch' && f.enabled).map(f => f.title);
    const sc = S.scene ? {name: S.scene.name, segment: S.scene.i + 1, segments: S.scene.segs.length, effects: [S.scene.effects[S.scene.i]]} : null;
    return {bpm: DJ.tap_bpm || BPM, section: si.name, look: S.look, holiday: S.holiday, mirror: null, part: PARTS[si.name] + ' ' + (1 + (si.k >> 2) % 3),
      effect: src.label || S.effect, energy: si.name === 'drop' ? .86 : si.name === 'break' ? .32 : .58, transform: 'none', trail: .4, sparkle: .2,
      brightness: S.brightness, power: S.power, locked: S.locked, blend: S.blend, licensed: true, scoreboard: !!SB.s.on, fireplace: fp,
      feeds: {mode: fd.mode, title: fd.mode !== 'off' ? fd.feeds[fd.mode].title : '', watching: w, alert: FD.alert ? FD.alert.event : ''}, dj: djInfo(),
      shuffle: S.shuffle, characters: S.characters, held_look: S.held, pinned: S.pinned, calm: si.name === 'break' ? .6 : .2, grand: si.name === 'drop' ? .8 : .3,
      level: Math.round(lvl * 100) / 100, sparkles: S.sparkles, pace: S.pace, scene: sc, text: TX.s.show,
      groups: [{id: 'g1', name: 'Main', w: W, h: H, lights: 2, look: S.look, effect: src.label || S.effect, power: S.power, text: TX.s.show}],
      analysis: {key: 'A minor', mood: si.name === 'drop' ? 'euphoric' : 'groovy', known: 1, drops: 3, downbeat: true}, listening: 'Demo speakers', delay: S.delay, delay_auto: false,
      time: new Date().toTimeString().slice(0, 8)};
  }

  // ======================================================================= /api/control
  function control(b) {
    if ('delay' in b) S.delay = clamp(+b.delay || 0, 0, 1000);
    if ('power' in b) S.power = !!b.power;
    if ('brightness' in b) S.brightness = clamp(Math.round(+b.brightness), 5, 100);
    if ('blend' in b) S.blend = +b.blend || 1;
    if ('sparkles' in b) S.sparkles = b.sparkles;
    if ('pace' in b) S.pace = b.pace;
    if ('shuffle' in b) S.shuffle = !!b.shuffle;
    if ('characters' in b) S.characters = !!b.characters;
    if ('transition' in b) S.transition = b.transition;
    if ('mirror' in b && b.mirror) return LAPTOP('screen mirror');
    if (b.release) { S.held = null; S.pinned = false; S.locked = null; S.feature = null; }
    if ('lock_effect' in b) { S.locked = b.lock_effect || null; if (S.locked) { S.feature = null; bump('lock'); clearTakeovers(); } }
    if (b.look) { setLook(b.look, b.pin); S.feature = null; S.locked = null; clearTakeovers(); }
    if (b.feature) { S.feature = {clip: effectClip(b.feature), name: b.feature, until: now() + 32}; clearTakeovers(); }
    if (b.skip) { S.feature = null; const lk = CAT.looks[S.look]; if (S.held || !S.shuffle) { S.lookK++; S.effect = pickOne(lk.mid.concat(lk.high)); const c = effectClip(S.effect); if (c && c !== lookClip(S.look)) S.feature = {clip: c, name: S.effect, until: now() + 20}; } else { autoLook(); S.lookK = 0; } }
    if (b.surprise) { const all = Object.keys(CLIPS).filter(n => /^(look|fx|wave|shape)-/.test(n)), c = pickOne(all); S.feature = {clip: c, name: titleOf(c), until: now() + 30}; clearTakeovers(); }
    if (b.cameo) S.cameo = now() + 9;
    if ('holiday' in b) {
      const h = b.holiday;
      if (!h) S.holiday = null;
      else { S.holFx = h.fx; const meta = CAT.holidays[h.key]; if (meta) meta.prefs = {fx: h.fx, name: h.name, team: h.team};
        const nm = String(h.name || '').trim().toUpperCase();
        HOL_NAME.text = nm ? (h.key === 'birthday' ? 'HAPPY BIRTHDAY ' + nm : h.key === 'gameday' ? 'GO ' + nm : nm) : '';
        HOL_NAME.cols = h.team ? h.team.map(c => c.map(v => v * 255)) : [[255, 255, 255], [255, 204, 102]];
        if (h.on) { S.holiday = h.key; bump('holiday'); } }
    }
    return {json: {ok: true, queued: b}};
  }
  function clearTakeovers() { /* a look / effect pick from the console also ends a running scene, like the engine */ S.scene = null; }

  // ======================================================================= the router
  async function handle(method, path, q, b) {
    await ready;
    const ok = (o) => ({json: Object.assign({ok: true}, o || {})});
    if (method === 'GET') {
      switch (path) {
        case '/api/status': return {json: status()};
        case '/api/catalog': return {json: CAT};
        case '/api/frames': return {json: {groups: [{id: 'g1', name: 'Main', w: W, h: H, gw: W, gh: H, shape: null, rgb: paint(),
          devices: DEVS.map(d => ({id: d.id, name: d.name, x0: d.x0, x1: d.x0 + 19, y0: 0, y1: H - 1}))}]}};
        case '/api/frame': { const rgb = paint(); return {json: {w: W, h: H, rgb: rgb.match(/.{6}/g)}}; }
        case '/api/uiver': return {json: {v: 1}};
        case '/api/license': return {json: {licensed: true, owner: false, key: 'GLOWBOP-DEMO', message: ''}};
        case '/api/link': return {json: {link: 'http://192.168.0.42:8787'}};
        case '/api/lights': return {json: lightsInfo()};
        case '/api/music': return {json: musicState()};
        case '/api/media': return {json: {available: false, title: null}};
        case '/api/songinfo': { const t = M.queue[M.idx]; return {json: {keys: {lastfm: true, getsongbpm: true}, current: t ? {title: t.title, artist: t.artist, genres: ['synthwave', 'dance', 'electronic'], bpm: BPM, key: 'A minor', style: 'dance'} : null}}; }
        case '/api/text': return {json: {state: Object.assign({}, TX.s), presets: TX.presets.map(p => Object.assign({}, p, {logo: undefined}))}};
        case '/api/score': return {json: scoreInfo()};
        case '/api/score/teams': { const lg = q.get('league') || 'nfl', ts = TEAMS[lg];
          return {json: ts ? {teams: ts.map(x => ({id: x[0], name: x[1], abbr: x[0], color: x[2]}))} : {teams: [], error: 'In the demo, teams load for the NFL, NBA, MLB, NHL, MLS and Premier League'}}; }
        case '/api/fire': return {json: Object.assign({}, ENG.fire, FIRE)};
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
      }
    } else {
      switch (path) {
        case '/api/control': return control(b);
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
          if (b.hit === 'blackout') DJ.black = 'on' in b ? !!b.on : !DJ.black;
          else if (b.hit) DJ.queue.push(b.hit);
          if ('build' in b) { if (b.build && DJ.build == null) DJ.build = t; else if (!b.build && DJ.build != null) { const held = t - DJ.build; DJ.build = null; if (held > .4 && !b.cancel) DJ.queue.push('drop'); } }
          if ('cue' in b) DJ.cue = b.cue && CAT.looks[b.cue] ? b.cue : null;
          if (b.tap) { DJ.taps = DJ.taps.filter(x => t - x < 3).concat([t]);
            if (DJ.taps.length >= 3) { const iv = DJ.taps.slice(-8).map((x, i, a) => i ? x - a[i - 1] : 0).slice(1).filter(v => v > .25 && v < 1.5).sort((a, c) => a - c);
              if (iv.length >= 2) DJ.tap_bpm = clamp(60 / iv[iv.length >> 1], 60, 200); } }
          if (b.tap_off) { DJ.tap_bpm = null; DJ.taps = []; }
          if (b.say) { const w = String(b.say).toUpperCase().slice(0, 40).trim(); if (w) DJ.word = {w, t0: t}; }
          if (b.reset) djReset();
          return ok(); }
        case '/api/music': return musicCmd(b);
        case '/api/media': return ok();
        case '/api/license': return LAPTOP('entering a license key');
        case '/api/keys': return LAPTOP('saving song lookup keys');
        case '/api/support': setTimeout(() => toast('Demo: nothing was sent. Reach us from the Contact page'), 2600); return ok({sent: true, ticket: 'GB-DEMO'});
        case '/api/quit': return LAPTOP('the Quit key');
        case '/api/music/signin': return LAPTOP('YouTube Music sign-in');
        case '/api/music/host': return ok();
        case '/api/lights/identify': S.flash[b.id] = now() + 1.6; return ok();
        case '/api/lights/toggle': DEV_ON[b.id] = !!b.enabled; return ok();
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
    if (!/\/api\//.test(url)) return realFetch(input, init);
    const u = new URL(url, location.href), method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    let body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) { body = {}; }
    let r; try { r = await handle(method, u.pathname.replace(/^.*?(\/api\/)/, '$1'), u.searchParams, body); }
    catch (e) { console.error('[demo] engine error', method, u.pathname, e); r = {status: 500, json: {error: 'demo engine error'}}; }
    return new Response(JSON.stringify(r.json == null ? {} : r.json), {status: r.status || 200, headers: {'Content-Type': 'application/json'}});
  };

  // the camera and DJ controllers would need the laptop: say so instead of asking for permissions
  try { if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = () => { setTimeout(() => toast('💻 In the demo, camera mapping needs the GlowBop laptop app'), 80);
    return Promise.reject(new Error('needs the GlowBop laptop app')); }; } catch (e) {}
  try { if (navigator.requestMIDIAccess) navigator.requestMIDIAccess = () => { setTimeout(() => toast('💻 In the demo, DJ controllers need the GlowBop laptop app'), 80);
    return Promise.resolve({inputs: new Map(), onstatechange: null}); }; } catch (e) {}

  window.__demoWall = () => ({clip: lastSrc.clip || lastSrc.kind || '', label: lastSrc.label || ''});   // handy for tests

  // ======================================================================= start
  function boot() {
    SB.s = JSON.parse(JSON.stringify(ENG.score)); SB.s.on = false; SB.s.mode = 'game'; SB.s.sport = 'basketball';
    Object.assign(SB.s.home, {name: 'HEAT', color: '#e8384f', score: 52}); Object.assign(SB.s.away, {name: 'BOLTS', color: '#3d7bff', score: 49});
    SB.s.period = 3; resetClock(); SB.s.clock = 5 * 60 + 12;
    FIRE = {on: false, color: 'classic', dance: false, mode: 'cozy', style: 'fireplace', beat: false, team1: '#ff3d9a', team2: '#33d6ff'};
    TX.s = Object.assign({}, ENG.text.state, {text: 'WELCOME TO THE PARTY'});
    TX.presets = [{name: 'HAPPY BIRTHDAY JACK', kind: 'text', text: 'HAPPY BIRTHDAY JACK *', mode: 'scroll', color: 'rainbow'}, {name: 'LETS DANCE', kind: 'text', text: 'LETS DANCE', mode: 'beat', color: 'look'}];
    FD.s = JSON.parse(JSON.stringify(FEEDS0));
    S.effect = pickOne(CAT.looks[S.look].mid);
    ['look-neon-party', 'live-storm'].forEach(loadClip);
    setInterval(tick, 250);
    log('pretend engine running: ' + Object.keys(CLIPS).length + ' recorded clips, ' + Object.keys(CAT.looks).length + ' looks');
  }

  // ======================================================================= the DEMO banner
  document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('demoBar'); if (!bar) return;
    let hide = false; try { hide = sessionStorage.getItem('gb_demo_bar') === '0'; } catch (e) {}
    if (hide) { bar.remove(); return; }
    bar.querySelector('.dm-x').onclick = () => { bar.remove(); try { sessionStorage.setItem('gb_demo_bar', '0'); } catch (e) {} };
  });
})();
