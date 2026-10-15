/* 🔊 Console sounds: GlowBop's own synthesized key sounds (Web Audio, no sound files), in four styles.
   Console (default): crisp two-tone panel chirps, like a starship control panel.  Computer: warbly mainframe trills.
   Arcade: 8-bit square-wave blips.  Bubble: the original soft pops.  Picked in SETUP → Console sounds; the SFX key mutes. */
(function () {
  'use strict';
  let ctx = null;
  const style = () => GB.store.get('gb_sfx_style', 'console');
  const on = () => GB.store.get('gb_sfx', '1') === '1';

  function tone(t, f, dur, {type = 'square', vol = 0.06, f2 = null, lp = 2600, vib = 0, att = 0.004} = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vib; lg.gain.value = f * 0.06; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.02); }
    fl.type = 'lowpass'; fl.frequency.value = lp; fl.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, t + Math.max(att, dur - 0.012)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
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
  GB.SFX_STYLES = [['console', 'Console', '🖖'], ['computer', 'Computer', '🖥️'], ['arcade', 'Arcade', '👾'], ['bubble', 'Bubble', '🫧']];
  GB.sfxPlay = (kind, st) => {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const bank = BANK[st || style()] || BANK.console, t0 = ctx.currentTime + 0.005;
      vary(bank[kind] || bank.tap, kind).forEach(([dt, f, d, o]) => tone(t0 + dt, f, d, o));
    } catch (e) {}
  };
  GB.sfx = kind => { if (on()) GB.sfxPlay(kind); };

  GB.panel('setup', 56, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `<div class="ph"><span>Console sounds</span><span class="r" id="sfxNow"></span></div>
      <div class="tiles" id="sfxStyles" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>
      <p class="note">Tap a style to hear it. The <b>SFX</b> key at the top turns the sounds on and off.</p>`;
    const box = el.querySelector('#sfxStyles');
    const paint = () => { box.querySelectorAll('.tile').forEach(b => b.classList.toggle('on', b.dataset.s === style()));
      const n = GB.SFX_STYLES.find(x => x[0] === style()); el.querySelector('#sfxNow').textContent = (n ? n[1] : '').toUpperCase(); };
    GB.SFX_STYLES.forEach(([k, name, em]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.s = k; b.style.setProperty('--c', 'var(--lav)');
      b.innerHTML = `<span class="em">${em}</span>${name}`;
      b.onclick = () => { GB.store.set('gb_sfx_style', k); paint(); GB.sfxPlay('on', k); setTimeout(() => GB.sfxPlay('tap', k), 380); };
      box.appendChild(b);
    });
    paint();
  });
})();
