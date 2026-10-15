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
  function djFire(a, beats, cue) {
    const P = DJ.parts;
    if (a === 'drop') {
      DJ.flash = 1; DJ.black = false; DJ.rings.push({x: W / 2, y: H / 2, r: 0, c: [255, 255, 255]});
      for (let i = 0; i < 70; i++) { const an = R() * 6.283, sp = 8 + R() * 22; P.push({x: W / 2, y: H / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 0, c: pickOne([[255, 61, 154], [51, 214, 255], [255, 204, 102], [155, 61, 255]])}); }
      forceSec = {name: 'drop', until: now() + 8};
      if (DJ.cue) { setLook(DJ.cue, false); DJ.cue = null; S.feature = {clip: lookClip(S.look), name: S.look, until: 0}; }
      else if (!cue) { const c = pickOne(SPECTACLE); S.feature = {clip: c, name: titleOf(c), until: now() + 24}; }
    }
    if (a === 'flash') DJ.flash = 1;
    if (a === 'strobe') DJ.strobe = Math.max(DJ.strobe, now() + (beats || 4) * 60 / (DJ.tap_bpm || BPM));
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
  const SONGS = [['Neon Summer (Demo Mix)', 'The Glow Ups', 224, 'Neon Party', 124], ['Midnight Circuit', 'Pixel Hearts', 201, 'Synthwave', 118], ['Bass Lanterns', 'DJ Lumen', 238, 'Warehouse Rave', 128],
    ['Velvet Laser', 'Aurora Club', 212, 'Club Rig', 122], ['Starlight Freeway', 'Synth Coast', 196, 'Deep Space', 110], ['Heatwave Hands Up', 'Bop Machine', 187, 'Mainstage', 128],
    ['Ocean Drive Lights', 'Miami Pulse', 205, 'Big Wave', 120], ['After Hours Arcade', 'Retro Pilots', 179, 'Retro Arcade', 126]];
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
  const curBpm = () => DJ.tap_bpm || BPM;
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
    return {values: Object.assign({}, v), defaults: Object.assign({}, FDEF), away, pro: true, active: !!(away.length || fl.length), flash: fl, rev: FA.rev,
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
    {id: 'strobe', kind: 'strobe', label: 'STROBE', mode: 'hold', fade: 0}, {id: 'house', kind: 'house', label: 'HOUSE', mode: 'latch', fade: 1, color: '#ffb46b'},
    {id: 'red', kind: 'color', label: 'RED', mode: 'hold', fade: 0, color: '#ff1a1a'}, {id: 'blue', kind: 'color', label: 'BLUE', mode: 'hold', fade: 0, color: '#1a4dff'},
    {id: 'pink', kind: 'color', label: 'PINK', mode: 'hold', fade: 0, color: '#ff2fa0'}, {id: 'crowd', kind: 'crowd', label: 'CROWD', mode: 'hold', fade: 0.25},
    {id: 'logo', kind: 'logo', label: 'LOGO', mode: 'hold', fade: 0}];
  const PRIO = ['black', 'white', 'strobe', 'logo', 'house', 'color', 'crowd'], FADES = [0, 0.25, 1], IL_LOOKS = ['breathe', 'text', 'glow', 'look'], IL_RET = ['none', 'flash', 'drop'];
  const OV = {keys: OV_KEYS.map(k => Object.assign({}, k)), il: {look: 'breathe', text: 'BE RIGHT BACK', look_name: '', auto: 0, ret: 'flash', fade_in: 2, fade_out: 1.5},
    held: {}, latched: new Set(), lv: {}, ilOn: false, ilAuto: false, ilLv: 0, ilSince: null, retPending: false, quietT: null, loudT: null, rev: 0, ilT: 0};
  const ovOnIds = () => OV.keys.filter(k => OV.latched.has(k.id) || (OV.held[k.id] || 0) > wall()).map(k => k.id);
  function ovInfo() {
    const on = ovOnIds();
    return {pro: true, keys: OV.keys.map(k => Object.assign({}, k, {on: on.includes(k.id), latched: OV.latched.has(k.id)})), on, latched: on.filter(i => OV.latched.has(i)),
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
    else if (kind === 'logo') {
      const s = TX.s, L = TX.logo;
      if (L && (['logo', 'both'].includes(s.show) || !String(s.text || '').trim())) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const j = ((y * L.h / H | 0) * L.w + (x * L.w / W | 0)) * 3, i = (y * W + x) * 3; out[i] = L.rgb[j] || 0; out[i + 1] = L.rgb[j + 1] || 0; out[i + 2] = L.rgb[j + 2] || 0; }
      } else { const msg = String(s.text || 'GLOWBOP').toUpperCase().trim() || 'GLOWBOP', m = textMask(msg, H);
        stamp(out, m, m.w > W - 2 ? Math.round(W - (t * 12) % (W + m.w + 4)) : ((W - m.w) / 2) | 0, Math.max(0, ((H - m.h) / 2) | 0), () => [255, 255, 255]); }
    }
    return out;
  }
  function ovApply(out, t, bri, mm) {                               // 🚨 the very last thing, on every mode (even lights off)
    if (!Object.keys(OV.lv).length) return;
    const order = OV.keys.slice().sort((a, b) => (PRIO.indexOf(b.kind) - PRIO.indexOf(a.kind)) || (OV.keys.indexOf(b) - OV.keys.indexOf(a)));
    const heldCol = OV.keys.find(k => k.kind === 'color' && (OV.lv[k.id] || 0) > 0.5);
    order.forEach(k => { const lv = OV.lv[k.id] || 0; if (lv <= 0) return;
      const pic = keyPic(k, t, heldCol), sc = k.kind === 'black' ? 0 : ['white', 'strobe'].includes(k.kind) ? bri : bri * mm;
      for (let i = 0; i < out.length; i++) out[i] = out[i] * (1 - lv) + pic[i] * sc * lv; });
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
  const LBARS = [1, 2, 4, 8], QUANTS = [0.25, 0.125], HIT_TYPES = ['drop', 'strobe', 'flash', 'fire', 'confetti', 'blackout'], SPAN_LANES = ['look', 'color', 'text', 'effect'];
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
    return {pro: true, ok: !OV.ilOn, why: OV.ilOn ? 'paused for the interlude' : '', bpm: Math.round(curBpm() * 100) / 100, pos: Math.round(P * 1e4) / 1e4,
      bar: Math.floor(P / 4) + 1, beat: Math.floor(P % 4) + 1, src: DJ.tap_bpm ? 'tap' : M.playing ? 'music' : 'free', live: !!M.playing || !!DJ.tap_bpm, delay_beats: 0,
      settings: Object.assign({}, LP.settings), running: SLOT_IDS.filter(s => ['playing', 'stopping'].includes(st(s))), queued: SLOT_IDS.filter(s => st(s) === 'queued'),
      slots: SLOT_IDS.map(sid => { const s = LP.slots[sid], r = LP.run[sid] || {};
        const d = {id: sid, bank: sid[0], name: s.name, bars: s.bars, count: s.events.length, state: r.state || 'idle', S: r.S == null ? null : r.S, at: r.at == null ? null : r.at, stop_at: r.stop_at == null ? null : r.stop_at};
        if (full) d.events = s.events.map(pubEv); return d; }),
      rec: rr ? {id: rr.id, state: rr.state, mode: rr.mode, at: rr.at, S: rr.S == null ? null : rr.S, end: rr.end == null ? null : rr.end, n: rr.n} : null,
      banks: ['A', 'B', 'C', 'D'], per_bank: 4, bars: LBARS, quants: QUANTS, hits: HIT_TYPES, fired: LP.fired, rev: LP.rev};
  }
  function loopsBrief() { const run = SLOT_IDS.filter(s => LP.run[s]);
    return {pro: true, running: run, names: run.map(s => LP.slots[s].name || s), rec: LP.rec ? {id: LP.rec.id, state: LP.rec.state} : null, paused: OV.ilOn && !!run.length, rev: LP.rev}; }

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
  function draftShow(song, variant) {                               // auto-draft (songshow.draft): looks per section, hits on the drops, a brightness curve, a crowd line
    const bpm = song.bpm || 120, P = 60 / bpm, BAR = 4 * P, g = (song.grid || 0) % BAR, r3 = x => Math.round(x * 1000) / 1000;
    const bar = t => r3(g + Math.round((t - g) / BAR) * BAR), beat = t => r3(g + Math.round((t - g) / P) * P);
    let dur = song.dur || 0, drops = [];
    (song.drops || []).forEach(d => { const tb = bar(d[0]); if (!drops.some(x => Math.abs(tb - x) < 4 * BAR)) drops.push(tb); });
    const basis = drops.length ? 'memory' : 'guess';
    if (dur <= 0) dur = drops.length ? drops[drops.length - 1] + 40 * BAR : 64 * BAR + 120;
    if (!drops.length) { for (let t = g + 40 * BAR; t < dur - 24 * BAR; t += 40 * BAR) drops.push(bar(t)); if (!drops.length && dur > 24 * BAR) drops.push(bar(dur * 0.4)); }
    drops = drops.filter(d => d >= 2 * BAR && d < dur - 2 * BAR).sort((a, b) => a - b);
    const mood = ['dark', 'bright'].includes(song.mood) ? song.mood : 'neutral', epic = (song.epic || 0) > 0.55, ls = LOOK_SETS[epic ? 'epic' : mood];
    const rot = xs => { xs = xs.filter(x => CAT.looks[x]); const o = variant % xs.length; return xs.slice(o).concat(xs.slice(0, o)); };
    const calm = rot(ls[0]), build_l = rot(ls[1]), drop_l = rot(ls[2]);
    const efx = xs => xs.filter(x => CAT.effects[x]), bfx = efx(['WarpSpeed', 'TunnelRush', 'Hyperjump', 'ShapeTunnel']), cfx = efx(['Aurora', 'LavaFlow', 'OceanWaves', 'InkBloom', 'LiquidMelt', 'Bioluminescence', 'SkyClouds']);
    const segs = []; let prev = 0;
    drops.forEach((D, i) => { const gap = D - prev, blen = gap >= 16 * BAR ? 8 * BAR : Math.max(2 * BAR, gap > 4 * BAR ? bar(gap / 2) : BAR), B = Math.max(prev, D - blen);
      if (B - prev >= 2 * BAR) segs.push([i === 0 ? 'intro' : 'breakdown', prev, B]); else if (segs.length && B > prev) segs[segs.length - 1][2] = B;
      if (D > B) segs.push(['build', B, D]);
      const nxt = i + 1 < drops.length ? drops[i + 1] : dur; let dl;
      if (i + 1 < drops.length) { dl = Math.max(4 * BAR, Math.min(32 * BAR, Math.round((nxt - D - 8 * BAR) * 0.55 / (4 * BAR)) * 4 * BAR)); dl = Math.min(dl, Math.max(BAR, nxt - D - 2 * BAR)); }
      else { dl = Math.max(4 * BAR, Math.min(32 * BAR, (dur - D) - 8 * BAR)); dl = Math.min(dl, dur - D); }
      segs.push(['drop', D, Math.min(nxt, D + dl < dur ? bar(D + dl) : dur)]); prev = segs[segs.length - 1][2]; });
    if (dur - prev > BAR) segs.push([drops.length ? 'outro' : 'intro', prev, dur]); else if (segs.length) segs[segs.length - 1][2] = dur;
    const big = drops.length > 1 ? drops[1] : drops[0], items = [], bp = [[0, 40]]; let n = 0, dk = 0, bk = 0;
    const add = o => { n++; o.id = 'a' + variant + 'x' + n; o.auto = true; ['t', 'end'].forEach(k => { if (k in o) o[k] = r3(o[k]); }); items.push(o); };
    const pickLine = (xs, k) => xs[(variant + k) % xs.length];
    segs.forEach(([kind, s, e]) => {
      const lookn = kind === 'build' ? build_l[dk % build_l.length] : kind === 'drop' ? drop_l[dk % drop_l.length] : kind === 'breakdown' ? calm[(1 + bk) % calm.length] : calm[0];
      const last = items[items.length - 1];
      if (last && last.lane === 'look' && last.look === lookn && Math.abs(last.end - s) < 0.01) last.end = r3(e); else add({lane: 'look', t: s, end: e, look: lookn});
      if (kind === 'intro') bp.push([s, 40], [Math.max(s, e - P), 72]);
      else if (kind === 'build') { bp.push([s, 60], [Math.max(s, e - P), 100]); if (bfx.length) add({lane: 'effect', t: s, end: e, effect: bfx[(dk + variant) % bfx.length]}); }
      else if (kind === 'drop') { const D = s, isbig = D === big, burst = mood === 'dark' ? 'fire' : 'confetti';
        bp.push([s, 100], [Math.max(s, e - P / 2), 100]); add({lane: 'hit', t: D, hit: 'drop'});
        if (epic) add({lane: 'hit', t: beat(D - 2 * P), hit: 'flash'});
        else if (isbig && D - BAR >= 0) { add({lane: 'hit', t: D - BAR, hit: 'strobe', beats: 3}); add({lane: 'hit', t: D - P, end: D, hit: 'blackout'}); }
        else if (D - BAR >= 0) add({lane: 'hit', t: D - BAR, hit: 'strobe', beats: 4});
        if (isbig) { if (!epic) add({lane: 'hit', t: D, hit: burst}); const tt = D + (epic ? P : BAR); add({lane: 'text', t: tt, end: tt + 2 * BAR, text: pickLine(SH_LINES[epic ? 'epic' : mood], dk)}); }
        for (let k = 8; D + k * BAR < e - 2 * BAR; k += 8) add({lane: 'hit', t: D + k * BAR, hit: k === 8 && !isbig && !epic ? burst : 'flash'});
        dk++; }
      else if (kind === 'breakdown') { bp.push([s, 100], [s + 2 * P, 65], [Math.max(s + 2 * P, e - P), 65]);
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
      items: (show.items || []).length, rev: SH.rev[key] || 0, next, look: (SH.act.look || {}).look || null, bright: SH.ok ? Math.round(SH.mult * 100) : null, pro: true};
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
    if (S.feature && (S.feature.until === 0 || S.feature.until > t)) return {clip: S.feature.clip || lookClip(S.look, S.lookK), label: S.feature.name, vary: S.feature.vary};
    if (S.cameo > t) return {kind: 'eye', label: 'Eyeball'};
    const lc = lookClip(S.look, S.lookK), lk = LOOK_SET[S.look];
    return {clip: lc, label: lk ? titleOf(lc) : S.effect};
  }

  // ======================================================================= painting one frame
  let buf = new Float32Array(N * 3), curClip = null, clipV0 = 0, VT = 0, lastT = now(), spk = new Float32Array(N), lastLevel = 0, lastSrc = {label: ''};
  const HEX = []; for (let i = 0; i < 256; i++) HEX.push(i.toString(16).padStart(2, '0'));
  // a mode with its own picture and pace owns the wall: faders' looks, Song Show cues and loop spans stay out of the way (like the engine)
  const takeover = () => !S.power || FD.s.mode !== 'off' || !!SB.s.on || !!(FIRE && FIRE.on) || !!S.holiday || !!S.scene;
  function paint() {
    const t = now(), dt = Math.min(.25, t - lastT); lastT = t; clock();
    const busy = takeover();
    ovTick(dt); lpTick(); shTick(busy); cueStep(LP.layer, busy ? {} : LP.act, busy, it => (it.end - it.t));
    const sp = busy ? 1 : fSpeed(), vdt = Math.min(.25, dt * sp); VT += dt * sp;      // 🎚️ SPEED: the animations' own clock
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
    if (!busy) { cueColor(buf, SH.act); cueColor(buf, LP.act); }    // 🎬🔁 colour lock
    if (src.holiday && HOL_NAME.text && (t % 14) < 4.2) {         // 🎂 the birthday name / 🏈 team name flies across now and then
      const m = textMask(HOL_NAME.text, H), el = (t % 14) / 4.2; stamp(buf, m, Math.round(W - el * (W + m.w)), ((H - m.h) / 2) | 0, (x) => HOL_NAME.cols[x < W / 2 ? 0 : 1], .3); }
    if (S.power) textOverlay(buf, t, si);
    // ✨ sparkles: auto = a few on the drops, lots = always glittering
    const want = S.sparkles === 'lots' ? .012 : S.sparkles === 'auto' && si.name === 'drop' ? .004 : 0;
    for (let i = 0; i < N; i++) { if (want && R() < want) spk[i] = 1; if (spk[i] > .02) { const v = spk[i] * 255; buf[i * 3] = Math.max(buf[i * 3], v); buf[i * 3 + 1] = Math.max(buf[i * 3 + 1], v); buf[i * 3 + 2] = Math.max(buf[i * 3 + 2], v); spk[i] *= Math.pow(.004, vdt); } else spk[i] = 0; }
    if (S.power) djApply(buf, t, vdt);
    if (!busy) { cueText(buf, SH.act, t); cueText(buf, LP.act, t); if (SH.act.blackout || LP.act.blackout) buf.fill(0); }
    fadersLook(buf, t, busy);                                       // 🎚️ trails, colour, white, strobe
    if (SH.ok && !busy && SH.mult !== 1) for (let i = 0; i < buf.length; i++) buf[i] *= SH.mult;   // 🎬 the show's brightness curve
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
    lpTick();
  }

  // ======================================================================= status (what /api/status returns)
  function status() {
    const si = sectionInfo(), src = lastSrc, t = now(), beat = Math.pow(1 - (beatPos % 1), 2);
    const lvl = S.power ? clamp(lastLevel * 2.2 * (.65 + .35 * beat) + R() * .08, 0, 1) : 0;
    const fp = Object.assign({}, ENG.fire, FIRE), fd = FD.s, w = Object.values(fd.feeds).filter(f => f.kind === 'watch' && f.enabled).map(f => f.title);
    const sc = S.scene ? {name: S.scene.name, segment: S.scene.i + 1, segments: S.scene.segs.length, effects: [S.scene.effects[S.scene.i]]} : null;
    return {bpm: DJ.tap_bpm || BPM, section: si.name, look: S.look, faders: fadersInfo(), override: ovInfo(), loops: loopsBrief(), show: shInfo(), holiday: S.holiday, mirror: null, part: PARTS[si.name] + ' ' + (1 + (si.k >> 2) % 3),
      effect: src.label || S.effect, energy: si.name === 'drop' ? .86 : si.name === 'break' ? .32 : .58, transform: 'none', trail: .4, sparkle: .2,
      brightness: S.brightness, power: S.power, locked: S.locked, blend: S.blend, licensed: true, pro: true, scoreboard: !!SB.s.on, fireplace: fp,
      feeds: {mode: fd.mode, title: fd.mode !== 'off' ? fd.feeds[fd.mode].title : '', watching: w, alert: FD.alert ? FD.alert.event : ''}, dj: djInfo(),
      shuffle: S.shuffle, characters: S.characters, held_look: S.held, pinned: S.pinned, calm: si.name === 'break' ? .6 : .2, grand: si.name === 'drop' ? .8 : .3,
      level: Math.round(lvl * 100) / 100, sparkles: S.sparkles, pace: S.pace, scene: sc, text: TX.s.show,
      groups: [{id: 'g1', name: 'Main', w: W, h: H, lights: 2, look: S.look, effect: src.label || S.effect, power: S.power, text: TX.s.show}],
      analysis: {key: 'A minor', mood: si.name === 'drop' ? 'euphoric' : 'groovy', known: 1, drops: 3, downbeat: true}, listening: 'Demo speakers', delay: S.delay, delay_auto: false,
      time: new Date().toTimeString().slice(0, 8)};
  }

  // ======================================================================= /api/control
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
    const pro = fn => { try { return {json: fn()}; } catch (e) { if (e.bad) return {status: 400, json: {error: e.message}}; throw e; } };
    if (method === 'GET') {
      switch (path) {
        case '/api/status': return {json: status()};
        case '/api/catalog': return {json: CAT};
        case '/api/frames': return {json: {groups: [{id: 'g1', name: 'Main', w: W, h: H, gw: W, gh: H, shape: null, rgb: paint(),
          devices: DEVS.map(d => ({id: d.id, name: d.name, x0: d.x0, x1: d.x0 + 19, y0: 0, y1: H - 1}))}]}};
        case '/api/frame': { const rgb = paint(); return {json: {w: W, h: H, rgb: rgb.match(/.{6}/g)}}; }
        case '/api/uiver': return {json: {v: 1}};
        case '/api/license': return {json: {licensed: true, owner: false, pro: true, plan: 'pro', key: 'GLOWBOP-DEMO', message: '', buy: '/pricing.html', buy_pro: '/pricing.html#pro'}};
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
      }
    } else {
      switch (path) {
        case '/api/control': return control(b);
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
          if (b.hit === 'blackout') DJ.black = 'on' in b ? !!b.on : !DJ.black;
          else if (b.hit && b.snap === false) djFire(b.hit, b.beats);     // ⚡ instant pads fire right now; snapped ones wait for the beat
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

  // the phone-link QR code and other app images live on the laptop: the demo shows its own little picture instead of a broken image
  try { const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    const QR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="10" fill="#fff"/>' +
      '<text x="60" y="52" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="700" font-size="15" fill="#000">ON THE LAPTOP</text>' +
      '<text x="60" y="74" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="12" fill="#444">your phone link QR</text></svg>');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {configurable: true, enumerable: d.enumerable, get() { return d.get.call(this); },
      set(v) { if (/^\/api\/qr\.svg/.test(String(v))) v = QR; else if (/^\/api\//.test(String(v))) v = ''; d.set.call(this, v); }}); } catch (e) {}

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
    BPM = songBpm(M.queue[M.idx]); M.posAt = now(); showsSeed();
    ['look-neon-party', 'live-storm'].forEach(loadClip);
    setInterval(tick, 250);
    log('pretend engine running: ' + Object.keys(CLIPS).length + ' recorded clips, ' + Object.keys(CAT.looks).length + ' looks');
  }

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
