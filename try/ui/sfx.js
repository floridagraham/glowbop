/* 🔊 Console sounds: GlowBop's own synthesized key sounds (Web Audio, no sound files), in fifteen styles, played one at a time, as your own mix, or fully random (every press a different style).
   Console (default): crisp two-tone panel chirps.  Computer: warbly mainframe trills.  Arcade: 8-bit square blips.
   Bubble: the original soft pops.  Then the "patch" styles, each a little set of oscillators, noise and filters:
   Galaxy Rebel (droid bleeps, soft pews), Wasteland Terminal (lo-fi bunker clicks), Synthwave (detuned neon blips),
   Magic (FM chimes + plucked harp), Spooky (creaks, theremin, knocks), Reactor Lab (servos + calm control-room chimes),
   Deep Sea Deco (bubbles, brass valves, music-box runs), Test Chamber (clean lab clicks, shwooms, elevator dings).
   Everything is made live in code: no samples.  Picked in SETUP → Console sounds; the SFX key mutes. */
(function () {
  'use strict';
  let ctx = null;                          // the one shared AudioContext (made on the first sound)
  let C = null, TR = 1;                    // the context a sound is being built in + that sound's loudness trim
  const picked = () => GB.store.get('gb_sfx_style', 'console');
  const DEFAULT_MIX = ['softbubble', 'console', 'computer', 'arcade'];
  const mode = () => GB.store.get('gb_sfx_mode', 'mix');                      // 'one' | 'mix' | 'all' (default: my mix)
  const pool = () => { try { const p = JSON.parse(GB.store.get('gb_sfx_pool', '') || 'null'); return Array.isArray(p) && p.length ? p : DEFAULT_MIX; } catch (e) { return DEFAULT_MIX; } };
  let lastStyle = '';
  const style = () => {                                                       // 🎲 which style plays THIS press
    const m = mode(); if (m === 'one') return picked();
    const ks = m === 'all' ? GB.SFX_STYLES.map(x => x[0]) : pool().filter(k => GB.SFX_STYLES.some(x => x[0] === k));
    if (!ks.length) return picked();
    let k = ks[(Math.random() * ks.length) | 0];
    if (ks.length > 1) while (k === lastStyle) k = ks[(Math.random() * ks.length) | 0];
    return (lastStyle = k);
  };
  const on = () => GB.store.get('gb_sfx', '1') === '1';
  const kill = ns => ns.forEach(n => { try { n.disconnect(); } catch (e) {} });

  function tone(t, f, dur, {type = 'square', vol = 0.06, f2 = null, lp = 2600, vib = 0, att = 0.004} = {}) {
    const o = C.createOscillator(), g = C.createGain(), fl = C.createBiquadFilter(), ns = [o, fl, g];
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    if (vib) { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = vib; lg.gain.value = f * 0.06; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.02); ns.push(l, lg); }
    fl.type = 'lowpass'; fl.frequency.value = lp; fl.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, t + Math.max(att, dur - 0.012)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(C.destination); o.start(t); o.stop(t + dur + 0.02);
    o.onended = () => kill(ns);
  }
  // each sound = a little score: [start offset s, freq, duration s, options]
  const BANK = {
    console: {
      tap: [[0, 1568, 0.045, {}], [0.05, 2093, 0.04, {}]],
      nav: [[0, 1319, 0.05, {}], [0.055, 1047, 0.05, {}], [0.11, 1568, 0.06, {}]],
      on: [[0, 1047, 0.05, {}], [0.055, 1568, 0.05, {}], [0.11, 2093, 0.08, {}]],
      ok: [[0, 1760, 0.05, {}], [0.06, 2349, 0.09, {}]],
      err: [[0, 330, 0.09, {type: 'sawtooth', lp: 900}], [0.1, 247, 0.14, {type: 'sawtooth', lp: 900}]],
    },
    computer: {
      tap: [[0, 1400, 0.07, {type: 'triangle', vib: 42, vol: 0.09}]],
      nav: [[0, 900, 0.05, {type: 'triangle', vib: 55, vol: 0.09}], [0.06, 1350, 0.07, {type: 'triangle', vib: 55, vol: 0.09}]],
      on: [[0, 1100, 0.04, {type: 'triangle', vib: 60, vol: 0.09}], [0.045, 1650, 0.04, {type: 'triangle', vib: 60, vol: 0.09}], [0.09, 2200, 0.08, {type: 'triangle', vib: 60, vol: 0.09}]],
      ok: [[0, 1650, 0.12, {type: 'triangle', vib: 35, vol: 0.09, f2: 2200}]],
      err: [[0, 420, 0.18, {type: 'triangle', vib: 18, vol: 0.1, f2: 260}]],
    },
    arcade: {
      tap: [[0, 988, 0.03, {lp: 6000, vol: 0.045}], [0.032, 1319, 0.04, {lp: 6000, vol: 0.045}]],
      nav: [[0, 659, 0.035, {lp: 6000, vol: 0.045}], [0.037, 988, 0.035, {lp: 6000, vol: 0.045}], [0.074, 1319, 0.05, {lp: 6000, vol: 0.045}]],
      on: [[0, 523, 0.03, {lp: 6000, vol: 0.045}], [0.032, 659, 0.03, {lp: 6000, vol: 0.045}], [0.064, 784, 0.03, {lp: 6000, vol: 0.045}], [0.096, 1047, 0.06, {lp: 6000, vol: 0.045}]],
      ok: [[0, 1319, 0.04, {lp: 6000, vol: 0.045}], [0.045, 1760, 0.08, {lp: 6000, vol: 0.045}]],
      err: [[0, 196, 0.08, {lp: 3000, vol: 0.05}], [0.09, 147, 0.14, {lp: 3000, vol: 0.05}]],
    },
    bubble: {
      tap: [[0, 1320, 0.08, {type: 'sine', f2: 1760, vol: 0.07}]], nav: [[0, 660, 0.12, {type: 'sine', f2: 990, vol: 0.07}]],
      on: [[0, 880, 0.08, {type: 'sine', f2: 1760, vol: 0.07}]], ok: [[0, 990, 0.08, {type: 'sine', f2: 1480, vol: 0.07}]],
      err: [[0, 300, 0.08, {type: 'square', f2: 180, vol: 0.05}]],
    },
  };
  // 🎲 never the same chirp twice: every press picks a new set of notes from a happy scale (pentatonic, so it always
  // sounds musical), shuffles them, sometimes adds or drops a note, and nudges the timing. Errors stay low and grumpy.
  const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  let last = '';
  function vary(score, kind) {
    if (kind === 'err') return score.map(([dt, f, d, o]) => [dt, f * (0.94 + Math.random() * 0.12), d, o]);
    for (let tries = 0; tries < 4; tries++) {
      const base = score[0][1] * [0.75, 0.84, 1, 1, 1.12, 1.26][(Math.random() * 6) | 0];
      let n = score.length + (Math.random() < 0.3 ? 1 : 0) - (score.length > 2 && Math.random() < 0.25 ? 1 : 0);
      const gap = (score.length > 1 ? score[1][0] : 0.05) * (0.8 + Math.random() * 0.45), d0 = score[0][2] * (0.85 + Math.random() * 0.35);
      const up = kind === 'on' || kind === 'ok' ? true : kind === 'nav' ? Math.random() < 0.5 : Math.random() < 0.6;
      let idx = []; for (let i = 0; i < n; i++) idx.push((Math.random() * STEPS.length) | 0);
      idx.sort((x, y) => up ? x - y : y - x);
      const out = idx.map((k, i) => [i * gap, base * STEPS[k], i === n - 1 ? d0 * 1.3 : d0, score[Math.min(i, score.length - 1)][3]]);
      const sig = idx.join(',') + base.toFixed(0);
      if (sig !== last || tries === 3) { last = sig; return out; }
    }
  }

  // ------------------------------------------------------------- 🔧 building blocks for the patch styles
  // Shared per context and reused by every press: 1 s of white noise, the saturation curve, the synthwave echo, plucked strings.
  const RES = new WeakMap();
  const res = () => { let r = RES.get(C); if (!r) RES.set(C, r = {ks: {}}); return r; };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
  function noiseBuf() {
    const r = res(); if (r.noise) return r.noise;
    const n = C.sampleRate, b = C.createBuffer(1, n, n), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (r.noise = b);
  }
  function satCurve() {
    const r = res(); if (r.sat) return r.sat;
    const c = new Float32Array(1024), k = Math.tanh(2.2);
    for (let i = 0; i < 1024; i++) c[i] = Math.tanh(2.2 * (i / 511.5 - 1)) / k;
    return (r.sat = c);
  }
  const osc = (type, f) => { const o = C.createOscillator(); o.type = type; o.frequency.value = f; return o; };
  const noise = () => { const s = C.createBufferSource(); s.buffer = noiseBuf(); s._off = Math.random() * 0.5; return s; };
  const flt = (type, f, q = 0.7) => { const b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const sat = () => { const w = C.createWaveShaper(); w.curve = satCurve(); return w; };
  const amp = v => { const g = C.createGain(); g.gain.value = v; return g; };
  const lfo = (param, rate, depth, type = 'sine') => { const l = osc(type, rate), g = amp(depth); l.connect(g); g.connect(param); return [l, g]; };
  const glide = (p, t, pts) => { p.setValueAtTime(p.value, t); pts.forEach(([dt, v]) => p.exponentialRampToValueAtTime(v, t + dt)); };
  // the synthwave echo: one short feedback delay (darkened every repeat), made once and shared by every sound that sends to it
  // a gentle shared peak catcher for the patch styles: clean below about -20 dBFS, rounding the rare spikes (clicks, noise,
  // stacked partials) off softly so nothing ever peaks above about -16 dBFS. One per context, reused by every sound.
  function out() {
    const r = res(); if (r.out) return r.out;
    const w = C.createWaveShaper(), c = new Float32Array(4097), a = 0.1, top = 0.16;
    for (let i = 0; i < 4097; i++) { const x = i / 2048 - 1, ax = Math.abs(x); c[i] = Math.sign(x) * (ax <= a ? ax : a + (top - a) * Math.tanh((ax - a) / (top - a))); }
    w.curve = c; w.connect(C.destination);
    return (r.out = w);
  }
  function echo() {
    const r = res(); if (r.echo) return r.echo;
    const i = C.createGain(), d = C.createDelay(1), lp = flt('lowpass', 2200), fb = C.createGain();
    d.delayTime.value = 0.17; fb.gain.value = 0.3;
    i.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(out());
    return (r.echo = i);
  }
  // Karplus-Strong plucked string, rendered once per pitch and cached (a soft pick: lowpassed noise into a decaying loop)
  function pluckBuf(f) {
    const r = res(), key = Math.round(f); if (r.ks[key]) return r.ks[key];
    const sr = C.sampleRate, n = Math.floor(sr * 0.45), N = Math.max(2, Math.round(sr / f)), b = C.createBuffer(1, n, sr), d = b.getChannelData(0);
    let p = 0, m = 0;
    for (let i = 0; i < N; i++) { p = p * 0.55 + (Math.random() * 2 - 1) * 0.45; d[i] = p; m += p; }
    m /= N; for (let i = 0; i < N; i++) d[i] -= m;
    for (let i = N; i < n; i++) d[i] = 0.4975 * (d[i - N] + (i - N - 1 >= 0 ? d[i - N - 1] : 0));
    return (r.ks[key] = b);
  }
  /* one voice: sources -> fx chain -> envelope -> peak catcher -> speakers (+ optional echo send). Sources may carry their own start (_t)
     and length (_d) for grains. When the last source ends, every node of the voice is disconnected. */
  function voice(t, dur, srcs, {fx = [], mods = [], vol = 1, att = 0.004, hold = 0, send = 0} = {}) {
    const g = C.createGain(), chain = [...fx, g], extra = [];
    for (let i = 0; i < chain.length - 1; i++) chain[i].connect(chain[i + 1]);
    srcs.forEach(s => s.connect(chain[0]));
    g.connect(out());
    if (send) { const sg = amp(send); g.connect(sg); sg.connect(echo()); extra.push(sg); }
    const v = Math.max(0.0002, vol * TR);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + att);
    if (hold) g.gain.setValueAtTime(v, t + att + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const end = t + dur + 0.03, all = [...srcs, ...mods.flat()];
    let lastSrc = srcs[0];
    all.forEach(s => {
      if (!s.start) return;
      const st = s._t != null ? s._t : t;
      if (s.buffer) { if (s._d) s.start(st, s._off || 0, s._d); else s.start(st, s._off || 0); } else s.start(st);
      if (!s._d) s.stop(end);
      if (srcs.includes(s) && (s._t || 0) > (lastSrc._t || 0)) lastSrc = s;
    });
    lastSrc.onended = () => kill([...all, ...chain, ...extra]);
    return g;
  }
  // a noise grain (clicks, ticks, crackle): a few ms of the shared noise
  const grain = (t, d) => { const s = noise(); s._t = t; s._d = d; return s; };
  // FM bell / chime: sine carrier, sine modulator at an inharmonic ratio, brightness falling as it rings
  function bell(t, f, dur, vol, {ratio = 1.41, index = 2.2, send = 0, att = 0.002} = {}) {
    const c = osc('sine', f), m = osc('sine', f * ratio), mg = amp(f * index);
    m.connect(mg); mg.connect(c.frequency);
    mg.gain.setValueAtTime(f * index, t); mg.gain.exponentialRampToValueAtTime(f * index * 0.08, t + dur);
    voice(t, dur, [c], {mods: [[m, mg]], vol, att, send});
  }
  // the synthwave voice: two detuned saws + a square an octave down through a lowpass that closes as it plays
  function blip(t, f, dur, vol, {cut = 3400, to = 500, q = 2.5, send = 0.25, att = 0.004, hold = 0} = {}) {
    const a = osc('sawtooth', f * 1.0046), b = osc('sawtooth', f / 1.0046), s = osc('square', f / 2), lp = flt('lowpass', cut, q);
    b._t = t + 0.0011; s._t = t + 0.0007;     // staggered starts so the three waves don't all spike together
    lp.frequency.setValueAtTime(cut, t); lp.frequency.exponentialRampToValueAtTime(to, t + dur);
    voice(t, dur, [a, b, s], {fx: [lp], vol, att, hold, send});
  }
  const lofi = (f = 1700, q = 0.8) => [sat(), flt('bandpass', f, q)];        // the wasteland chain: a bit of grit, a narrow speaker
  const PENTA = [587.33, 659.25, 739.99, 880, 987.77, 1174.66, 1318.51, 1479.98, 1760];   // D major pentatonic
  const AMIN = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];    // A minor pentatonic
  // the test-chamber "shwoom": a filtered noise swoosh + a warm sine that rings briefly while sliding up (hi = brighter/higher)
  function shwoom(t, hi) {
    const k = hi ? 1 : 0.68, bp = flt('bandpass', 600 * k, 3), o = osc('sine', 520 * k), o2 = osc('triangle', 1040 * k);
    glide(bp.frequency, t, [[0.18, 3000 * k]]); glide(o.frequency, t, [[0.2, 780 * k]]); glide(o2.frequency, t, [[0.2, 1560 * k]]);
    voice(t, 0.2, [noise()], {fx: [bp], vol: 0.8, att: 0.05});
    voice(t + 0.02, 0.22, [o, o2], {fx: [flt('lowpass', 2400 * k)], att: 0.01});
  }

  // 🫧🔔💎 GlowBop's own Apple-inspired trio (Oct 2026): soft, clean, quiet under the music. On rises G->C like the intro.
  function bub(t, f, d = 0.2) {        // a round "bloop": sine with a tiny pitch drop + a soft octave
    const o = osc('sine', f * 1.06), o2 = osc('sine', f * 2.12), a = amp(0.15);
    glide(o.frequency, t, [[0.012, f]]); glide(o2.frequency, t, [[0.012, f * 2]]); o2.connect(a);
    voice(t, d, [o, a], {mods: [[o2]], att: 0.003});
  }
  const glassBell = (t, f, d = 0.45) => bell(t, f, d, 1, {ratio: 2, index: 0.35, att: 0.003});
  const crystalBell = (t, f, d = 0.8) => bell(t, f, d, 1, {ratio: 3.5, index: 2.2, att: 0.002});
  function trio(play, k) {            // the same little melodies for all three; k shifts the register per style
    const T = [1396.91, 1567.98, 1760, 2093].map(f => f * k);
    return {
      tap(t) { play(t, pick(T) , 0.12); },
      nav(t) { play(t, pick([1046.5, 1174.66]) * k, 0.14); },
      on(t) { play(t, 783.99 * k); play(t + 0.07, 1046.5 * k); },
      off(t) { play(t, 1046.5 * k); play(t + 0.07, 783.99 * k); },
      ok(t) { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => play(t + i * 0.06, f * k)); },
      err(t) { play(t, 329.63 * k); play(t + 0.11, 261.63 * k); },
    };
  }
  const PROC = {
    softbubble: trio(bub, 1), glass: trio(glassBell, 1.335), crystal: trio(crystalBell, 1.26),
    // 🚀 space opera: chatty droid bleeps, soft pews, a hyperspace-ish whoosh, a power hum
    galaxy: {
      tap(t) {     // 2-4 random notes on one oscillator, some jumps, some glides, gated so they chatter
        const o = osc(pick(['sine', 'triangle']), 2000), gate = amp(0), n = 2 + ((Math.random() * 3) | 0);
        let tt = t; o.frequency.setValueAtTime(rnd(1300, 3000), t); gate.gain.setValueAtTime(0, t);
        for (let i = 0; i < n; i++) {
          const d = rnd(0.022, 0.042), nf = rnd(1100, 3400);
          gate.gain.setValueAtTime(0, tt); gate.gain.linearRampToValueAtTime(1, tt + 0.003);
          gate.gain.setValueAtTime(1, tt + d - 0.005); gate.gain.linearRampToValueAtTime(0, tt + d);
          if (Math.random() < 0.55) o.frequency.exponentialRampToValueAtTime(nf, tt + d); else o.frequency.setValueAtTime(nf, tt + d * 0.6);
          tt += d + rnd(0.006, 0.02);
        }
        voice(t, tt - t + 0.01, [o], {fx: [gate, flt('lowpass', 5200)], hold: tt - t - 0.01});
      },
      on(t) {      // a soft laser pew: falling sine with a triangle an octave down for body
        const k = rnd(0.9, 1.1), o = osc('sine', 2600 * k), o2 = osc('triangle', 1300 * k);
        glide(o.frequency, t, [[0.16, 420 * k]]); glide(o2.frequency, t, [[0.16, 210 * k]]);
        voice(t, 0.17, [o, o2], {fx: [flt('lowpass', 3800)], att: 0.003});
      },
      nav(t) {     // hyperspace-ish whoosh: noise through a rising band, with a faint rising tone
        const bp = flt('bandpass', 300, 1.6), o = osc('sine', 180);
        glide(bp.frequency, t, [[0.32, rnd(3600, 4600)], [0.42, 1600]]); glide(o.frequency, t + 0.05, [[0.38, 1400]]);
        voice(t, 0.42, [noise()], {fx: [bp], att: 0.22});
        voice(t + 0.05, 0.36, [o], {vol: 0.12, att: 0.25});
      },
      ok(t) {      // low power hum swell: two saws a fifth apart, rising a touch, filter opening, a 28 Hz throb
        const a = osc('sawtooth', 98), b = osc('sawtooth', 147), c = osc('sine', 392), lp = flt('lowpass', 250, 3), trem = amp(0.8);
        [a, b, c].forEach(o => glide(o.frequency, t, [[0.4, o.frequency.value * 1.12]]));
        glide(lp.frequency, t, [[0.3, 2200], [0.46, 900]]);
        voice(t, 0.48, [a, b, c], {fx: [lp, trem], mods: [lfo(trem.gain, 28, 0.2)], att: 0.2, hold: 0.1});
      },
      err(t) {     // a worried droid warble: up a little, then sagging down with a nervous vibrato
        const o = osc('triangle', 1100);
        glide(o.frequency, t, [[0.06, 1250], [0.32, 480]]);
        voice(t, 0.34, [o], {fx: [flt('lowpass', 3000)], mods: [lfo(o.frequency, 13, 90)], att: 0.01, hold: 0.18});
      },
      off(t) {     // a droid "bye": quick fall and a tiny low blip
        const o = osc('triangle', 2200); glide(o.frequency, t, [[0.1, 700]]);
        voice(t, 0.11, [o], {fx: [flt('lowpass', 4500)]});
        voice(t + 0.12, 0.05, [osc('sine', 520)], {vol: 0.8});
      },
    },
    // ☢️ retro-future bunker terminal: CRT key clicks, relay clunks, toggle switches, Geiger ticks, all a bit lo-fi
    wasteland: {
      tap(t) {     // key down + key up: two short noise clicks with a tiny square tick
        const f = rnd(2600, 3400), u = t + rnd(0.035, 0.05);
        voice(t, 0.02, [grain(t, 0.018)], {fx: [flt('highpass', 1200), ...lofi(f * 0.75, 1.2)], att: 0.001});
        voice(t, 0.008, [osc('square', rnd(3200, 3800))], {fx: lofi(2400, 1), vol: 0.35, att: 0.001});
        const th = osc('triangle', 900); glide(th.frequency, t + 0.004, [[0.025, 600]]);      // the key bottoming out
        voice(t + 0.004, 0.03, [th], {fx: lofi(1200, 0.8), vol: 1.4, att: 0.002});
        voice(u, 0.016, [grain(u, 0.014)], {fx: [flt('highpass', 1200), ...lofi(f * 0.6, 1.2)], vol: 0.55, att: 0.001});
      },
      on(t) {      // a chunky toggle: low thunk + sharp click, then the latch
        const th = osc('triangle', 170); glide(th.frequency, t, [[0.06, 75]]);
        voice(t, 0.08, [th], {fx: lofi(300, 0.6), vol: 1.6, att: 0.002, hold: 0.015});
        voice(t, 0.02, [grain(t, 0.018)], {fx: lofi(1400, 2.5), att: 0.001});
        voice(t + 0.05, 0.016, [grain(t + 0.05, 0.014)], {fx: lofi(2400, 1.5), vol: 0.7, att: 0.001});
      },
      off(t) {     // a relay clunk with a little contact bounce
        const th = osc('triangle', 120); glide(th.frequency, t + 0.003, [[0.07, 60]]);
        voice(t, 0.025, [grain(t, 0.022)], {fx: lofi(900, 2), att: 0.001});
        voice(t + 0.003, 0.085, [th], {fx: lofi(260, 0.6), vol: 1.8, att: 0.002, hold: 0.015});
        voice(t + 0.07, 0.012, [grain(t + 0.07, 0.01)], {fx: lofi(1800, 2), vol: 0.5, att: 0.001});
      },
      nav(t) {     // a Geiger flurry: 7-12 random ticks, bunched like the real thing
        const ticks = [], n = 7 + ((Math.random() * 6) | 0); let tt = t;
        for (let i = 0; i < n && tt < t + 0.32; i++) { ticks.push(grain(tt, 0.0025)); tt += -Math.log(1 - Math.random() * 0.95) * 0.03 + 0.006; }
        voice(t, 0.36, ticks, {fx: [flt('highpass', 2500), ...lofi(3000, 0.8)], att: 0.001, hold: 0.33});
      },
      ok(t) {      // relay click, then the green-screen beep
        voice(t, 0.016, [grain(t, 0.014)], {fx: lofi(1600, 2), vol: 0.6, att: 0.001});
        voice(t + 0.03, 0.14, [osc('square', 1046)], {fx: lofi(1500, 0.9), att: 0.003, hold: 0.11});
      },
      err(t) {     // a harsh buzzer: two low tones beating, squeezed through the little speaker
        voice(t, 0.24, [osc('sawtooth', 98), osc('square', 104)], {fx: lofi(700, 1.2), att: 0.004, hold: 0.2});
      },
    },
    // 🌆 80s neon: warm detuned blips through a closing filter, data chirps, a laser sweep, chord stabs, a light echo
    synthwave: {
      tap(t) { blip(t, pick(AMIN.slice(3)), 0.11, 1, {hold: 0.03}); },
      on(t) {      // glitchy data chirp: a square stepping through random scale notes, now and then stuttering
        const o = osc('square', 880), gate = amp(1), n = 6 + ((Math.random() * 4) | 0), st = rnd(0.018, 0.024);
        for (let i = 0; i < n; i++) {
          o.frequency.setValueAtTime(pick(AMIN) * pick([1, 2]), t + i * st);
          gate.gain.setValueAtTime(i && Math.random() < 0.2 ? 0 : 1, t + i * st);
        }
        voice(t, n * st + 0.02, [o], {fx: [gate, flt('lowpass', 4200, 2)], hold: n * st - 0.01, send: 0.22});
      },
      nav(t) {     // laser sweep: detuned saws diving, resonant filter chasing them down
        const a = osc('sawtooth', 2600), b = osc('sawtooth', 2620), lp = flt('lowpass', 6000, 8);
        glide(a.frequency, t, [[0.28, 180]]); glide(b.frequency, t, [[0.28, 185]]); glide(lp.frequency, t, [[0.3, 300]]);
        voice(t, 0.3, [a, b], {fx: [lp], att: 0.004, send: 0.3});
      },
      ok(t) {      // chord stab: Am7, Fmaj7 or Cmaj7, two detuned saws a note, one filter sweep
        const ch = pick([[440, 523.25, 659.25, 783.99], [349.23, 440, 523.25, 659.25], [523.25, 659.25, 783.99, 987.77]]), srcs = [];
        ch.forEach(f => srcs.push(osc('sawtooth', f * 1.006), osc('sawtooth', f / 1.006)));
        const lp = flt('lowpass', 4200, 3); glide(lp.frequency, t, [[0.32, 700]]);
        voice(t, 0.34, srcs, {fx: [lp], att: 0.005, hold: 0.04, send: 0.3});
      },
      err(t) { blip(t, 233, 0.12, 1, {cut: 1400, to: 400, send: 0.15}); blip(t + 0.13, 207.65, 0.18, 1, {cut: 1300, to: 300, send: 0.15}); },
      off(t) { blip(t, 880, 0.06, 1); blip(t + 0.07, 659.25, 0.09, 1); },
    },
    // ✨ fantasy: FM bells and chimes, a plucked harp string, a twinkle run, a shimmer
    magic: {
      tap(t) {     // harp pluck: Karplus-Strong string on a random pentatonic note
        const s = C.createBufferSource(); s.buffer = pluckBuf(pick(PENTA));
        voice(t, 0.3, [s], {fx: [flt('highpass', 150), flt('lowpass', 5000)], att: 0.002, hold: 0.12});
      },
      on(t) {      // twinkle arpeggio: 4-5 glassy bells climbing fast
        const i0 = (Math.random() * 4) | 0, n = 4 + ((Math.random() * 2) | 0);
        for (let i = 0; i < n; i++) bell(t + i * 0.045, PENTA[(i0 + i) % PENTA.length] * 2, 0.18, i === n - 1 ? 1 : 0.8, {ratio: 3.5, index: 1.4});
      },
      nav(t) {     // a chime: two bells a fifth apart
        const f = pick(PENTA.slice(0, 5));
        bell(t, f, 0.42, 1, {ratio: 1.41, index: 2}); bell(t + 0.01, f * 1.5, 0.36, 0.6, {ratio: 1.41, index: 1.6});
      },
      ok(t) {      // shimmer: a soft trembling fifth under a spray of tiny high bells
        const f = pick([880, 987.77, 1174.66]), trem = amp(0.7);
        voice(t, 0.46, [osc('sine', f), osc('sine', f * 1.5)], {fx: [trem], mods: [lfo(trem.gain, 11, 0.3)], vol: 0.5, att: 0.12, hold: 0.1});
        for (let i = 0; i < 7; i++) bell(t + 0.02 + i * 0.045 + rnd(0, 0.015), pick(PENTA) * 4, 0.12, 0.7 - i * 0.06, {ratio: 2.76, index: 0.9});
      },
      err(t) { bell(t, 440, 0.22, 1, {ratio: 1.73, index: 3}); bell(t + 0.12, 330, 0.3, 1, {ratio: 1.73, index: 3}); },
      off(t) { [1318.51, 987.77, 739.99].forEach((f, i) => bell(t + i * 0.06, f, 0.2, 0.9, {ratio: 3.5, index: 1.2})); },
    },
    // 👻 Halloween fun: a creaky door, a theremin wobble, wood knocks, a witchy cackle, a groan, a deep bong
    spooky: {
      tap(t) {     // hollow wood knock: three body modes ringing briefly + a tiny contact click
        const k = rnd(0.92, 1.08);
        [[210, 0.12, 1], [560, 0.06, 0.6], [1150, 0.03, 0.35]].forEach(([f, d, v]) => voice(t, d, [osc('sine', f * k)], {vol: v, att: 0.001}));
        voice(t, 0.008, [grain(t, 0.007)], {fx: [flt('bandpass', 2000, 1)], vol: 0.25, att: 0.001});
      },
      on(t) {      // theremin: a sine sliding up with a wide, slow vibrato
        const f = rnd(480, 560), o = osc('sine', f), o2 = osc('triangle', f * 2);
        glide(o.frequency, t, [[0.12, f * 1.5]]); glide(o2.frequency, t, [[0.12, f * 3]]);
        voice(t, 0.3, [o], {mods: [lfo(o.frequency, 6.5, 18)], att: 0.03, hold: 0.18});
        voice(t, 0.3, [o2], {mods: [lfo(o2.frequency, 6.5, 36)], vol: 0.15, att: 0.03, hold: 0.18});
      },
      nav(t) {     // creaky door: a slow, irregular pulse train through a narrow wooden resonance
        const o = osc('sawtooth', 28), bp = flt('bandpass', 900, 5);
        o.frequency.setValueAtTime(28, t); o.frequency.linearRampToValueAtTime(70, t + 0.15);
        o.frequency.linearRampToValueAtTime(45, t + 0.3); o.frequency.linearRampToValueAtTime(62, t + 0.42);
        glide(bp.frequency, t, [[0.25, 1500], [0.44, 1100]]);
        voice(t, 0.45, [o], {fx: [flt('highpass', 400), bp], mods: [lfo(o.frequency, 9, 8, 'square')], att: 0.04, hold: 0.3});
      },
      ok(t) {      // witchy cackle: five little "heh"s falling, each a quick downward chirp through an "ah" formant
        const f0 = rnd(950, 1150);
        for (let i = 0; i < 5; i++) {
          const f = f0 * (1 - i * 0.06), o = osc('sawtooth', f * 1.25);
          glide(o.frequency, t + i * 0.065, [[0.045, f]]);
          voice(t + i * 0.065, 0.05, [o], {fx: [flt('bandpass', 1000, 2), flt('lowpass', 3000)], vol: 1 - i * 0.1, att: 0.004, hold: 0.015});
        }
      },
      err(t) {     // a low groan: falling saw through a closing vowel, with a wobble
        const o = osc('sawtooth', 120), bp = flt('bandpass', 600, 3.5);
        glide(o.frequency, t, [[0.4, 78]]); glide(bp.frequency, t, [[0.4, 380]]);
        voice(t, 0.42, [o], {fx: [bp], mods: [lfo(o.frequency, 5, 4)], att: 0.06, hold: 0.2});
      },
      off(t) { bell(t, 147, 0.5, 1, {ratio: 1.4, index: 2.4}); bell(t, 294, 0.35, 0.4, {ratio: 1.4, index: 1.5}); },   // a deep bong
    },
    // ⚛️ future reactor / robot-factory control room: smooth servos, soft pneumatics, calm chimes over a hum
    reactor: {
      tap(t) {     // servo whir: a short rising glide through a moving band
        const a = osc('triangle', 300), b = osc('sine', 600), bp = flt('bandpass', 900, 1.4), k = rnd(0.9, 1.12);
        glide(a.frequency, t, [[0.09, 620 * k]]); glide(b.frequency, t, [[0.09, 1240 * k]]); glide(bp.frequency, t, [[0.09, 1600]]);
        voice(t, 0.12, [a, b], {fx: [bp], att: 0.012, hold: 0.04});
      },
      on(t) {      // a soft pneumatic hiss, then a magnetic lock: low thunk + a muffled click
        voice(t, 0.12, [noise()], {fx: [flt('highpass', 3000), flt('bandpass', 5000, 0.8)], vol: 0.8, att: 0.01});
        const th = osc('sine', 160); glide(th.frequency, t + 0.07, [[0.07, 90]]);
        voice(t + 0.07, 0.08, [th], {vol: 0.9, att: 0.002});
        voice(t + 0.075, 0.012, [grain(t + 0.075, 0.01)], {fx: [flt('bandpass', 2500, 2), flt('lowpass', 3000)], vol: 0.5, att: 0.001});
      },
      nav(t) {     // scanner sweep with a fast flutter, a confirming beep, and a faint reactor hum under it
        const o = osc('sine', 900), fl = amp(0.7);
        glide(o.frequency, t, [[0.18, 1800]]);
        voice(t, 0.19, [o], {fx: [fl], mods: [lfo(fl.gain, 40, 0.3)], att: 0.01, hold: 0.15});
        voice(t + 0.22, 0.07, [osc('sine', 1800)], {vol: 0.8, att: 0.003, hold: 0.04});
        voice(t, 0.45, [osc('sawtooth', 60), osc('sine', 120)], {fx: [flt('lowpass', 400)], vol: 0.25, att: 0.08, hold: 0.25});
      },
      ok(t) {      // "system nominal": two calm sine chimes over a low hum that swells in
        [[0, 1046.5, 0.2], [0.12, 1568, 0.3]].forEach(([dt, f, d]) => voice(t + dt, d, [osc('sine', f), osc('triangle', f * 2)], {vol: 0.8, att: 0.006}));
        const lp = flt('lowpass', 300); glide(lp.frequency, t, [[0.3, 700]]);
        voice(t, 0.45, [osc('sawtooth', 73.4)], {fx: [lp], vol: 0.4, att: 0.15, hold: 0.12});
      },
      err(t) {     // a gentle klaxon: two soft tones swapping four times
        const o = osc('triangle', 620);
        [620, 520, 620, 520].forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.065));
        voice(t, 0.27, [o], {fx: [flt('lowpass', 1800)], att: 0.01, hold: 0.22});
      },
      off(t) {     // servo winding down
        const a = osc('triangle', 620), bp = flt('bandpass', 1500, 1.4);
        glide(a.frequency, t, [[0.1, 280]]); glide(bp.frequency, t, [[0.1, 800]]);
        voice(t, 0.12, [a], {fx: [bp], att: 0.01, hold: 0.03});
      },
    },
    // 🫧 1950s art-deco city under the sea: bubbles, brass valves, warm tubes, pneumatic tubes, a music box
    deepsea: {
      tap(t) {     // 2-4 bubbles: rising sine blips at random spacing
        let tt = t; const n = 2 + ((Math.random() * 3) | 0);
        for (let i = 0; i < n; i++) {
          const f = rnd(500, 1100), d = rnd(0.035, 0.06), o = osc('sine', f);
          glide(o.frequency, tt, [[d, f * 1.8]]);
          voice(tt, d, [o], {vol: 1 - i * 0.12, att: 0.004});
          tt += rnd(0.02, 0.06);
        }
      },
      on(t) {      // a brass steam-valve hiss with a whistly ring, then a vacuum tube warming up
        voice(t, 0.15, [noise()], {fx: [flt('bandpass', 3500, 1.5), flt('peaking', 2200, 6)], vol: 0.8, att: 0.008});
        const o = osc('triangle', 330), o2 = osc('sine', 660), lp = flt('lowpass', 500);
        glide(o.frequency, t + 0.06, [[0.24, 440]]); glide(o2.frequency, t + 0.06, [[0.24, 880]]); glide(lp.frequency, t + 0.06, [[0.2, 2400]]);
        voice(t + 0.06, 0.26, [o, o2], {fx: [lp], att: 0.08, hold: 0.08});
      },
      nav(t) {     // pneumatic-tube "fwoomp", and far away the hull creaks
        const lp = flt('lowpass', 200, 1.5), th = osc('sine', 90), c = osc('sawtooth', 32);
        glide(lp.frequency, t, [[0.08, 1400], [0.25, 300]]); glide(th.frequency, t, [[0.1, 160]]);
        voice(t, 0.26, [noise()], {fx: [lp], att: 0.03});
        voice(t, 0.14, [th], {vol: 0.5, att: 0.02});
        c.frequency.setValueAtTime(32, t + 0.18); c.frequency.linearRampToValueAtTime(48, t + 0.36); c.frequency.linearRampToValueAtTime(38, t + 0.48);
        voice(t + 0.18, 0.3, [c], {fx: [flt('highpass', 300), flt('bandpass', 700, 5)], vol: 0.35, att: 0.06, hold: 0.12});
      },
      ok(t) {      // music-box run, a little out of tune and wobbly like an old record, with some crackle
        const wow = rnd(0.985, 0.995), ticks = [];
        [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => bell(t + i * 0.07, f * wow * (1 + rnd(-0.004, 0.004)), 0.22, i === 3 ? 1 : 0.85, {ratio: 2.76, index: 0.8}));
        for (let i = 0; i < 9; i++) ticks.push(grain(t + rnd(0, 0.45), 0.0015));
        ticks.sort((a, b) => a._t - b._t);
        voice(t, 0.48, ticks, {fx: [flt('highpass', 2500)], vol: 0.35, att: 0.001, hold: 0.45});
      },
      err(t) {     // an electric spark zap, then a short burst of radio static
        const z = osc('sawtooth', 1800), tr = amp(0.6); glide(z.frequency, t, [[0.06, 200]]);
        voice(t, 0.065, [z, grain(t, 0.03)], {fx: [sat(), flt('highpass', 400)], vol: 0.9, att: 0.001});
        voice(t + 0.07, 0.15, [noise()], {fx: [flt('bandpass', 1500, 0.6), tr], mods: [lfo(tr.gain, 30, 0.4, 'square')], vol: 0.8, att: 0.005, hold: 0.09});
      },
      off(t) { const o = osc('sine', 900); glide(o.frequency, t, [[0.08, 480]]); voice(t, 0.1, [o], {att: 0.004, hold: 0.04}); },   // a bubble sinking
    },
    // 🔵🟠 a clean, bright-white test lab: crisp panel clicks, resonant shwooms (higher on, lower off), elevator dings
    chamber: {
      tap(t) {     // crisp panel click + a tiny glassy ping
        voice(t, 0.01, [grain(t, 0.009)], {fx: [flt('highpass', 2000), flt('bandpass', 4000, 1)], vol: 0.5, att: 0.001});
        voice(t + 0.004, 0.06, [osc('sine', pick([3135.96, 3520, 3951.07]))], {vol: 0.35, att: 0.002});
      },
      on(t) { shwoom(t, true); },          // the bright (blue) one
      off(t) { shwoom(t, false); },        // the lower, warmer (orange) one
      nav(t) {     // a soft electronic swoosh with a faint pulsing hum
        const bp = flt('bandpass', 800, 1.2), tr = amp(0.6); glide(bp.frequency, t, [[0.25, 2400]]);
        voice(t, 0.26, [noise()], {fx: [bp], att: 0.1});
        voice(t, 0.3, [osc('square', 110)], {fx: [flt('lowpass', 500), tr], mods: [lfo(tr.gain, 16, 0.4)], vol: 0.3, att: 0.06, hold: 0.12});
      },
      ok(t) {      // a gentle ascending elevator ding: three soft sine bells
        [[0, 783.99, 0.26], [0.1, 987.77, 0.28], [0.2, 1174.66, 0.3]].forEach(([dt, f, d]) => bell(t + dt, f, d, 0.9, {ratio: 2, index: 0.3, att: 0.004}));
      },
      err(t) {     // a polite, calm, low "denied": two soft notes stepping down
        [[0, 392], [0.13, 311.13]].forEach(([dt, f]) => voice(t + dt, 0.12, [osc('sine', f), osc('triangle', f)], {fx: [flt('lowpass', 1500)], att: 0.01, hold: 0.06}));
      },
    },
  };
  // loudness trims (per style and sound), measured offline so every style sits at the Console level (see the sfx test)
  const LV = {
    galaxy: {tap: 0.07319, on: 0.1385, nav: 0.5354, ok: 0.08182, err: 0.04155, off: 0.2662},
    wasteland: {tap: 0.1983, on: 0.1588, nav: 0.2351, ok: 0.07091, err: 0.1142, off: 0.1681},
    synthwave: {tap: 0.08293, on: 0.0638, nav: 0.1052, ok: 0.04755, err: 0.08185, off: 0.09887},
    magic: {tap: 0.3572, on: 0.1326, nav: 0.1321, ok: 0.1154, err: 0.08733, off: 0.1542},
    spooky: {tap: 0.1729, on: 0.08796, nav: 0.8339, ok: 0.287, err: 0.254, off: 0.1603},
    reactor: {tap: 0.1648, on: 0.3019, nav: 0.1023, ok: 0.12, err: 0.0478, off: 0.5174},
    deepsea: {tap: 0.2513, on: 0.06503, nav: 0.5824, ok: 0.1234, err: 0.1217, off: 0.1216},
    softbubble: {tap: 0.06, on: 0.065, nav: 0.06, ok: 0.055, err: 0.07, off: 0.065},
    glass: {tap: 0.055, on: 0.06, nav: 0.055, ok: 0.05, err: 0.065, off: 0.06},
    crystal: {tap: 0.045, on: 0.05, nav: 0.045, ok: 0.04, err: 0.055, off: 0.05},
    chamber: {tap: 0.5888, on: 0.1507, nav: 0.354, ok: 0.1888, err: 0.02766, off: 0.1508},
  };

  GB.SFX_STYLES = [['console', 'Console', '🖖'], ['computer', 'Computer', '🖥️'], ['arcade', 'Arcade', '👾'], ['bubble', 'Bubble', '🫧'],
    ['galaxy', 'Galaxy Rebel', '🚀'], ['wasteland', 'Wasteland Terminal', '☢️'], ['synthwave', 'Synthwave', '🌆'], ['magic', 'Magic', '✨'],
    ['spooky', 'Spooky', '👻'], ['reactor', 'Reactor Lab', '⚛️'], ['deepsea', 'Deep Sea Deco', '🫧'], ['chamber', 'Test Chamber', '🔵🟠'],
    ['softbubble', 'Soft Bubble', '🫧'], ['glass', 'Glass', '🔔'], ['crystal', 'Crystal', '💎']];
  // kind = tap | on | off | nav | ok | err; st = a style (default: the picked one). c/at let a test render into an OfflineAudioContext.
  GB.sfxPlay = (kind, st, c, at) => {
    try {
      if (!c) { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); }
      C = c || ctx;
      const s = st || style(), t0 = at != null ? at : C.currentTime + 0.005, P = PROC[s];
      if (P) { TR = LV[s][kind] || LV[s].tap; (P[kind] || P.tap)(t0); return; }
      TR = 1; const bank = BANK[s] || BANK.console;
      vary(bank[kind] || bank.tap, kind).forEach(([dt, f, d, o]) => tone(t0 + dt, f, d, o));
    } catch (e) {}
  };
  GB.sfx = kind => { if (on()) GB.sfxPlay(kind); };

  // the picker: 3 across on a phone, 4 then 6 across as the panel gets wider (sized by the panel, not the window)
  GB.css(`.sfxwrap{container:sfxbox/inline-size}
    #sfxStyles{grid-template-columns:repeat(3,minmax(0,1fr))}
    @container sfxbox (min-width:360px){#sfxStyles{grid-template-columns:repeat(4,minmax(0,1fr))}}
    @container sfxbox (min-width:600px){#sfxStyles{grid-template-columns:repeat(6,minmax(0,1fr))}}
    #sfxStyles .tile{min-width:0;min-height:76px;padding:8px 4px;font-size:calc(12.5px * var(--fs, 1));letter-spacing:.5px;overflow-wrap:break-word}
    #sfxStyles .tile .em{font-size:calc(24px * var(--fs, 1));white-space:nowrap;letter-spacing:-.1em}`);
  GB.panel('setup', 56, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `<div class="ph"><span>Console sounds</span><span class="r" id="sfxNow"></span></div>
      <div class="seg" id="sfxMode"><button class="btn" data-m="one">One style</button><button class="btn" data-m="mix">🎲 My mix</button><button class="btn" data-m="all">🎲 Full random</button></div>
      <div class="sfxwrap"><div class="tiles" id="sfxStyles"></div></div>
      <p class="note" id="sfxNote"></p>`;
    const box = el.querySelector('#sfxStyles');
    const NOTE = {one: 'Tap a style to use it on every button.', mix: 'Tap styles to add or remove them from your mix. Every button press plays a different one.',
      all: 'Every button press plays a random style from all of them.'};
    const paint = () => {
      const m = mode(), p = pool();
      el.querySelectorAll('#sfxMode .btn').forEach(b => { b.classList.toggle('on', b.dataset.m === m); b.style.setProperty('--c', 'var(--lav)'); });
      box.querySelectorAll('.tile').forEach(b => b.classList.toggle('on', m === 'all' || (m === 'one' ? b.dataset.s === picked() : p.includes(b.dataset.s))));
      const n = GB.SFX_STYLES.find(x => x[0] === picked());
      el.querySelector('#sfxNow').textContent = m === 'one' ? (n ? n[1] : '').toUpperCase() : m === 'mix' ? `MIX · ${p.length} STYLES` : 'FULL RANDOM';
      el.querySelector('#sfxNote').innerHTML = NOTE[m] + ' The <b>SFX</b> key at the top turns the sounds on and off.';
    };
    el.querySelectorAll('#sfxMode .btn').forEach(b => b.onclick = () => { GB.store.set('gb_sfx_mode', b.dataset.m); paint(); });
    GB.SFX_STYLES.forEach(([k, name, em]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.s = k; b.style.setProperty('--c', 'var(--lav)');
      b.innerHTML = `<span class="em">${em}</span>${name}`;
      b.onclick = () => {
        const m = mode();
        if (m === 'mix') { let p = pool().slice(); p = p.includes(k) ? p.filter(x => x !== k) : p.concat(k); if (!p.length) p = [k]; GB.store.set('gb_sfx_pool', JSON.stringify(p)); }
        else { GB.store.set('gb_sfx_style', k); if (m === 'all') GB.store.set('gb_sfx_mode', 'one'); }
        paint(); GB.sfxPlay('on', k); setTimeout(() => GB.sfxPlay('tap', k), 380);
      };
      box.appendChild(b);
    });
    paint();
  });
})();
