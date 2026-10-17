/* 🎧 DJ page: play the lights by hand. Talks to POST /api/dj (dj.py on the laptop).
   Hit pads land on the next beat. Build: hold to wind up, let go to drop. Cue: the next look comes in on the next drop.
   Tap tempo, crowd lines, and a DJ controller card (controllers are read by the engine: midi.js + midihub.py). */
(function () {
  'use strict';
  const {$, esc} = GB;
  const dj = b => GB.post('/api/dj', GB.withGroup(b));
  const PADS = [['drop', 'burst', 'Drop', 'var(--pink)'], ['strobe', 'bolt', 'Strobe', 'var(--cyan)'], ['flash', 'sun', 'Flash', 'var(--gold)'],
                ['fire', 'fire', 'Fire burst', 'var(--orange)'], ['confetti', 'confetti', 'Confetti', 'var(--lav)'], ['blackout', 'dark', 'Blackout', 'var(--peri)'],
                // one-shots drawn by padfx.py. Icons: the ICON[...] name if core.js has it, else the closest existing one
                ['sweep', ['sweep', 'wind'], 'Sweep', 'var(--lime, #b6ff3d)'], ['shockwave', ['shockwave', 'album'], 'Shockwave', 'var(--violet)'],
                ['colorbomb', ['colorbomb', 'palette'], 'Color bomb', 'var(--amber)'], ['lightning', ['lightning', 'bolt'], 'Lightning', '#8fb4ff'],
                ['countdown', ['count321', 'recent'], '3-2-1', 'var(--orchid)'], ['heartbeat', ['heart', 'star'], 'Heartbeat', 'var(--red)'],
                ['star', ['star'], 'Star', 'var(--gold)']]
    .map(p => { const ic = Array.isArray(p[1]) ? (p[1].find(n => (GB.ICON || {})[n]) || p[1][p[1].length - 1]) : p[1]; return [p[0], ic, p[2], p[3]]; });
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
  .dj-pads { grid-template-columns:repeat(3, minmax(0, 1fr)); }   /* 12 pads: 3 across on a phone, 4 on a tablet, 6 on a wide screen */
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
  @container (min-width: 500px) { .dj-pads { grid-template-columns:repeat(4, minmax(0, 1fr)); } }
  @container (min-width: 900px) { .dj-pads { grid-template-columns:repeat(6, minmax(0, 1fr)); } }
  @container (max-width: 420px) { .dj-pads { grid-auto-rows:1fr; } .dj-pads .tile { min-height:80px; padding:8px 3px; letter-spacing:0; font-size:min(calc(14.5px * var(--fs, 1)), 5.2cqi); }
    .dj-pads .tile .nm { overflow-wrap:normal; word-break:keep-all; } .dj-pads .tile .em { font-size:calc(28px * var(--fs, 1)); } }
  .dj-skip { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin-top:4px; }
  #djPadsPanel .dj-now { margin:8px 0 12px; }
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
    if (GB.pro === false && PRO_PADS.includes(k)) { GB.sfx('err'); GB.toast('🔒 ' + PADS.find(p => p[0] === k)[2] + ' is a Pro hit pad. Upgrade to Pro to unlock all 13.'); return; }
    const st = (GB.status || {}).dj || {};
    document.querySelectorAll(`.dj-pads [data-k="${k}"]`).forEach(b => { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 220); });
    if (k === 'blackout') { const on = !st.blackout; if (await dj({hit: 'blackout', on})) GB.toast(on ? '⬛ Blackout (tap again to bring it back)' : '💡 Lights back'); }
    else { GB.sfx('on'); if (await dj(k === 'drop' ? {hit: k, snap: snap(), drop_style: dropStyle()} : {hit: k, snap: snap()}) && src !== 'midi' && snap()) GB.toast(PADS.find(p => p[0] === k)[2] + ' on the next beat'); }
  }
  GB.panel('dj', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)'); el.id = 'djPadsPanel';
    el.innerHTML = `<div class="ph"><span>Hit pads</span><button class="btn" id="djSnap" style="--c:var(--cyan);min-height:34px;padding:4px 14px;font-size:calc(13px * var(--fs, 1))"></button></div>
      <div class="dj-skip" id="djSkip">
        <button class="btn" data-st="look-" style="--c:var(--gold)" aria-label="Previous look"><span class="ir">${SK.back}${SK.look}</span><span class="lb">LOOK</span></button>
        <button class="btn" data-st="look+" style="--c:var(--orange)" aria-label="Next look"><span class="ir">${SK.look}${SK.fwd}</span><span class="lb">NEXT LOOK</span></button>
        <button class="btn" data-st="effect-" style="--c:var(--cyan)" aria-label="Previous effect"><span class="ir">${SK.back}${SK.fx}</span><span class="lb">EFFECT</span></button>
        <button class="btn" data-st="effect+" style="--c:var(--lime, #b6ff3b)" aria-label="Next effect"><span class="ir">${SK.fx}${SK.fwd}</span><span class="lb">NEXT EFFECT</span></button>
      </div>
      <div class="dj-now"><span>Look: <b id="djNowLook">-</b></span><span>Effect: <b id="djNowFx">-</b></span></div>
      <div class="tiles dj-pads" id="djPads"></div>
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
    buildPads(el.querySelector('#djPads'));
  });
  function buildPads(box) {
    PADS.forEach(([k, em, name, c]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${GB.svg(em)}</span><span class="nm">${name}</span>`;
      b.style.touchAction = 'manipulation';
      b.addEventListener('pointerdown', e => { if (learn || e.button > 0) return; e.preventDefault(); b._pd = Date.now(); hit(k); });  // fire on touch-down
      b.onclick = () => { if (learn || Date.now() - (b._pd || 0) < 800) return; hit(k); };            // keyboard / fallback
      box.appendChild(b);
    });
  }
  // 🎚️🔁 LIVE BOARD (Pro): the same hit pads, compact, between the faders and the loop banks, so a loop can be recorded right there
  GB.css(`#djPadsBoard { container-type:inline-size; } #djPadsBoard .dj-pads .tile { min-height:64px; } #djPadsBoard .dj-pads .tile .em { font-size:calc(22px * var(--fs, 1)); }
  @container (min-width: 500px) { #djPadsBoard .dj-pads { grid-template-columns:repeat(6, minmax(0, 1fr)); } }`);
  GB.panel('board', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)'); el.id = 'djPadsBoard';
    el.innerHTML = `<div class="ph"><span>Hit pads</span><span class="r">SAME PADS AS DJ</span></div><div class="tiles dj-pads"></div>`;
    buildPads(el.querySelector('.dj-pads'));
  });

  // ------------------------------------------------------------------ build + tap tempo
  // 🎚️ build styles: how the wall winds up while you hold. The engine draws the same style on the wall (dj.py BUILD_STYLES).
  const BUILDS = [['rise', '⬆️', 'Rise'], ['close', '🔲', 'Close in'], ['burst', '💥', 'Burst out'], ['spin', '🌀', 'Spin'],
                  ['rainbow', '🌈', 'Rainbow'], ['zipper', '↔️', 'Zipper'], ['heartbeat', '💓', 'Heartbeat'], ['star', '⭐', 'Star']];
  // 💥 drop styles: what the wall does when the drop lands (padfx.py DROP_FX; Classic = the plain drop, no extra move)
  const DROPS = [['classic', '🎆', 'Classic'], ['supernova', '🌟', 'Supernova'], ['starburst', '✴️', 'Star burst'], ['heartpop', '💖', 'Heart pop'],
                 ['shatter', '🪟', 'Shatter'], ['colorbomb', '🎨', 'Color bomb'], ['rainbowwave', '🌈', 'Rainbow wave'], ['bassslam', '🔊', 'Bass slam'], ['lightning', '⚡', 'Lightning']];
  const BUILD_SECS = 8;                                        // the wind-up peaks after 8 seconds (same as the engine)
  /* 🎲 one picker for builds and drops: One style | My mix (only the ones you tick) | Full random (default).
     Every build / drop picks again, never the same one twice in a row. */
  // 🎨 real icons for the style chips (the app's own line icons; the old emoji only if an icon is missing)
  const CHIP_IC = {rise: 'up', close: 'center', burst: 'burst', spin: 'refresh', rainbow: 'rainbow', zipper: 'xfade', heartbeat: 'heart', star: 'star',
    classic: 'sparkle', supernova: 'star', starburst: 'burst', heartpop: 'heart', shatter: 'quake', colorbomb: 'colorbomb', rainbowwave: 'rainbow', bassslam: 'vol', lightning: 'lightning'};
  const chipIc = (k, emo) => GB.ICON && GB.ICON[CHIP_IC[k]] ? GB.svg(CHIP_IC[k]) : emo;
  function chooser(key, list, defMode = 'all', defStyle = null) {
    const S = GB.store, keys = list.map(x => x[0]), dStyle = defStyle || keys[0];
    if (key === 'build' && S.get('gb_build_style', '') === 'auto') { S.set('gb_build_mode', 'all'); S.set('gb_build_style', 'rise'); }   // old "Auto"
    const C = {
      mode: () => { const m = S.get('gb_' + key + '_mode', defMode); return ['one', 'mix', 'all'].includes(m) ? m : defMode; },
      one: () => { const v = S.get('gb_' + key + '_style', dStyle); return keys.includes(v) ? v : dStyle; },
      pool: () => { try { const p = JSON.parse(S.get('gb_' + key + '_pool', '') || 'null'); const q = Array.isArray(p) ? p.filter(k => keys.includes(k)) : []; return q.length ? q : keys.slice(); } catch (e) { return keys.slice(); } },
      last: null,
      pick() { if (GB.pro === false) return keys[Math.floor(Math.random() * keys.length)];   // Home DJ: a random style each time
        const m = C.mode(); if (m === 'one') return C.one();
        let ks = m === 'mix' ? C.pool() : keys.filter(k => k !== 'classic');
        if (ks.length > 1) ks = ks.filter(k => k !== C.last);
        return (C.last = ks[Math.floor(Math.random() * ks.length)]); },
      label() { const m = C.mode(); return m === 'one' ? list.find(x => x[0] === C.one())[2].toUpperCase() : m === 'mix' ? 'MY MIX · ' + C.pool().length : 'FULL RANDOM'; },
      mount(wrap, onChange) {
        wrap.innerHTML = `<div class="seg dj-cmode"><button class="btn" data-m="one">One style</button><button class="btn" data-m="mix">🎲 My mix</button><button class="btn" data-m="all">🎲 Full random</button></div>
          <div class="dj-bwrap"><div class="chips dj-bstyles" role="group" style="--c:var(--pink)"></div></div>`;
        const box = wrap.querySelector('.dj-bstyles');
        const paint = () => { const m = C.mode(), p = C.pool();
          wrap.querySelectorAll('.dj-cmode .btn').forEach(b => { b.classList.toggle('on', b.dataset.m === m); b.style.setProperty('--c', 'var(--pink)'); });
          box.querySelectorAll('.chip').forEach(c => { const on = m === 'all' ? c.dataset.v !== 'classic' : m === 'one' ? c.dataset.v === C.one() : p.includes(c.dataset.v);
            c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
          onChange && onChange(); };
        wrap.querySelectorAll('.dj-cmode .btn').forEach(b => b.onclick = () => { S.set('gb_' + key + '_mode', b.dataset.m); paint(); GB.sfx('tap'); });
        list.forEach(([k, ic, name]) => { const c = document.createElement('button'); c.className = 'chip'; c.dataset.v = k;
          c.innerHTML = `<span class="ic">${chipIc(k, ic)}</span>${name}`;
          c.onclick = () => { const m = C.mode();
            if (m === 'mix') { let p = C.pool(); p = p.includes(k) ? p.filter(x => x !== k) : p.concat(k); if (!p.length) p = [k]; S.set('gb_' + key + '_pool', JSON.stringify(p)); }
            else { S.set('gb_' + key + '_style', k); S.set('gb_' + key + '_mode', 'one'); }
            paint(); GB.sfx('tap'); };
          box.appendChild(c); });
        paint(); C.paint = paint;
      },
    };
    return C;
  }
  const BUILD = chooser('build', BUILDS, 'one', 'spin'), DROP = chooser('drop', DROPS);   // 🌀 builds default to Spin (Oct 16), drops stay Full random
  const buildStyle = () => BUILD.pick();
  const dropStyle = () => DROP.pick();
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
  #djBuild[data-s="star"] .bfx { background:repeating-conic-gradient(from calc(var(--a) * 1turn), color-mix(in srgb, var(--gold) calc(100% - var(--p) * 60%), #ff3d9a) 0 6%, transparent 6% 20%),
    radial-gradient(circle, #fff 0 calc(6% + var(--p) * 10%), transparent calc(18% + var(--p) * 30%)); opacity:calc(.5 + var(--b) * .5); }
  .dj-cmode { margin-top:10px; } .dj-cmode .btn { min-height:34px; font-size:calc(13px * var(--fs, 1)); }
  .dj-sub .ic { width:14px; height:14px; vertical-align:-2px; margin-right:4px; }
  .dj-sub { margin-top:12px; font:700 calc(12px * var(--fs, 1)) var(--mono); letter-spacing:1.5px; opacity:.8; display:flex; justify-content:space-between; }
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
      <div class="dj-sub"><span>${GB.svg('faders')} BUILD STYLE</span><span id="djBuildMode"></span></div><div id="djBuildPick"></div>
      <div class="dj-sub"><span>${GB.svg('burst')} DROP STYLE</span><span id="djDropMode"></span></div><div id="djDropPick"></div>
      <p class="note">Hold it: the wall winds up, brighter and faster, peaking after ${BUILD_SECS} seconds. Let go: it drops. Slide your finger off the key to cancel.
        Pick one style, tick your own mix, or go full random: every build and every drop can be different.</p>`;
    const b = $('djBuild'), lbl = b.querySelector('.blbl'), cnt = b.querySelector('.bcnt'); let held = false, t0 = 0, raf = 0, cur = 'rise';
    const paint = () => {
      if (!held) b.dataset.s = BUILD.mode() === 'one' ? BUILD.one() : 'rise';
      $('djBuildR').textContent = held ? 'BUILDING: ' + BUILDS.find(x => x[0] === cur)[2].toUpperCase() : 'HOLD, THEN LET GO';
      const bm = $('djBuildMode'), dm = $('djDropMode'); if (bm) bm.textContent = BUILD.label(); if (dm) dm.textContent = DROP.label(); };
    BUILD.mount(el.querySelector('#djBuildPick'), paint); DROP.mount(el.querySelector('#djDropPick'), paint);
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
      lbl.textContent = 'HOLD TO BUILD'; cnt.textContent = ''; paint(); dj(cancel ? {build: false, cancel: true} : {build: false, snap: snap(), drop_style: dropStyle()}); if (!cancel) GB.sfx('ok'); };
    b.addEventListener('pointerdown', start); b.addEventListener('pointerup', () => end(false));
    b.addEventListener('pointerleave', () => end(true)); b.addEventListener('pointercancel', () => end(true));
    b.addEventListener('contextmenu', e => e.preventDefault());
    paint();
  });
  // ------------------------------------------------------------------ 🌙 cool down (Oct 16): hold for a breather, tap to latch it on
  GB.css(`
  #djCool { min-height:76px; font-size:calc(22px * var(--fs, 1)); letter-spacing:3px; touch-action:none; user-select:none; -webkit-user-select:none; transition:background .5s, color .5s, box-shadow .5s; }
  #djCool.on { background:linear-gradient(135deg,#cc99ff,#6677ff); color:#120a22; box-shadow:0 0 34px #cc99ff88; animation:djCoolB 3.2s ease-in-out infinite; }
  #djCool.latched::after { content:'LATCHED · TAP TO RELEASE'; display:block; font:700 calc(11px * var(--fs, 1)) var(--mono); letter-spacing:1px; opacity:.75; margin-top:4px; }
  @keyframes djCoolB { 0%,100% { box-shadow:0 0 18px #cc99ff55; } 50% { box-shadow:0 0 44px #cc99ffaa; } }
  @media (prefers-reduced-motion: reduce) { #djCool.on { animation:none; } }
  `);
  GB.panel('dj', 5, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `<div class="ph"><span>Cool down</span><span class="r" id="djCoolR">HOLD, OR TAP TO LATCH</span></div>
      <button class="btn c wide" id="djCool" style="--c:var(--lav)">${GB.svg('moon')} COOL DOWN</button>
      <p class="note">Same look, just calmer: dimmer, half speed, no strobes or flashes, softer colors with light trails. Hold it for a breather, or tap once to keep it on and tap again to bring the lights back. If the song gets loud again, the lights come back up on their own.</p>`;
    const b = el.querySelector('#djCool'); let down = 0, keep = 0, latched = false;
    const show = (on, lat) => { b.classList.toggle('on', on); b.classList.toggle('latched', !!lat); const r = $('djCoolR'); if (r) r.textContent = lat ? 'LATCHED ON' : on ? 'COOLING DOWN' : 'HOLD, OR TAP TO LATCH'; };
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {}
      down = performance.now(); if (latched) return;
      show(true, false); dj({cool: true, ttl: 1.5}); clearInterval(keep);
      keep = setInterval(() => dj({cool: true, ttl: 1.5}), 500);          // keeps it on while held; if the Wi-Fi drops it lets go by itself
      GB.sfx && GB.sfx('tap');
    });
    const up = e => {
      if (!down) return; const quick = performance.now() - down < 350; down = 0; clearInterval(keep);
      if (latched) { latched = false; show(false, false); dj({cool: false}); GB.toast && GB.toast('✨ Lights coming back up'); return; }
      if (quick && e.type === 'pointerup') { latched = true; show(true, true); dj({cool: true, latch: true}); GB.toast && GB.toast('🌙 Cool down latched on. Tap again to bring it back'); }
      else { show(false, false); dj({cool: false}); }
    };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    GB.on('status', s => { const d = s.dj || {}; if (down) return; latched = !!d.cool_latched; show(!!d.cool, latched); });
  });

  // ------------------------------------------------------------------ 🎨 colour key (Oct 16): pick up to 4 colours, tap to latch the whole show into them
  GB.css(`
  .djc-dots { display:flex; flex-wrap:wrap; gap:10px; margin:4px 0 12px; }
  .djc-dot { width:calc(44px * var(--fs, 1)); height:calc(44px * var(--fs, 1)); border-radius:50%; border:3px solid #ffffff22; background:var(--d); position:relative; padding:0; cursor:pointer; box-shadow:0 0 0 0 var(--d); transition:transform .15s, box-shadow .2s, border-color .2s; }
  .djc-dot.on { border-color:#fff; box-shadow:0 0 16px var(--d); transform:scale(1.08); }
  .djc-dot.on::after { content:attr(data-n); position:absolute; right:-6px; top:-6px; width:20px; height:20px; border-radius:50%; background:#fff; color:#000; font:800 12px/20px var(--mono); text-align:center; }
  .djc-dot.more { background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red); }
  .djc-dot.more input { position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; }
  #djColor { min-height:76px; font-size:calc(22px * var(--fs, 1)); letter-spacing:3px; transition:background .4s, color .4s, box-shadow .4s; }
  #djColor.on { background:var(--grad); color:#000; box-shadow:0 0 34px #ffffff55; text-shadow:0 0 6px #fff8; }
  .djc-mine { display:flex; gap:6px; align-items:center; font:700 calc(12px * var(--fs, 1)) var(--mono); color:var(--dim); }
  .djc-mine i { width:16px; height:16px; border-radius:50%; background:var(--d); display:inline-block; }
  `);
  const DOTS = ['#ff1a1a', '#ff7a1a', '#ffcc00', '#2bff4a', '#1ad9ff', '#2b4dff', '#9b3dff', '#ff3dc8'];
  GB.panel('dj', 6, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orange)');
    let pick = []; try { pick = JSON.parse(localStorage.getItem('gb_dj_colors') || '[]').filter(c => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 4); } catch (_) {}
    if (!pick.length) pick = ['#ff1a1a'];
    let latched = false;
    el.innerHTML = `<div class="ph"><span>Color</span><span class="r" id="djColorR">PICK UP TO 4, THEN TAP</span></div>
      <div class="djc-dots" id="djcDots"></div>
      <button class="btn c wide" id="djColor" style="--c:var(--orange)">${GB.svg('palette')} COLOR LOCK</button>
      <p class="note">Pick 1 to 4 colors, then tap the key: everything on the wall (looks, effects, builds, drops, even the white flashes) plays in only those colors until you tap again. Change colors any time, even while it's on. The rainbow dot picks any color you like.</p>`;
    const dots = el.querySelector('#djcDots'), key = el.querySelector('#djColor');
    const save = () => { try { localStorage.setItem('gb_dj_colors', JSON.stringify(pick)); } catch (_) {} };
    const grad = () => pick.length > 1 ? `linear-gradient(90deg,${pick.join(',')})` : pick[0];
    const paint = () => {
      dots.querySelectorAll('.djc-dot[data-c]').forEach(d => { const i = pick.indexOf(d.dataset.c); d.classList.toggle('on', i >= 0); d.dataset.n = i >= 0 ? i + 1 : ''; });
      key.style.setProperty('--grad', grad()); key.classList.toggle('on', latched);
      key.innerHTML = GB.svg('palette') + (latched ? ' LOCKED · TAP TO RELEASE' : ' COLOR LOCK');
      $('djColorR').textContent = latched ? 'LOCKED: ' + pick.length + (pick.length > 1 ? ' COLORS' : ' COLOR') : pick.length ? pick.length + ' PICKED · TAP TO LOCK' : 'PICK UP TO 4, THEN TAP';
    };
    const send = () => { if (latched) dj({colors: pick}); };
    const toggle = c => {
      const i = pick.indexOf(c);
      if (i >= 0) { if (pick.length > 1) pick.splice(i, 1); }
      else { if (pick.length >= 4) pick.shift(); pick.push(c); }
      save(); render(); send();
    };
    const render = () => {
      const all = DOTS.concat(pick.filter(c => !DOTS.includes(c)));
      dots.innerHTML = all.map(c => `<button class="djc-dot" data-c="${c}" style="--d:${c}" aria-label="Color ${c}"></button>`).join('') +
        `<label class="djc-dot more" title="Any color"><input type="color" value="${pick[pick.length - 1] || '#ff1a1a'}" aria-label="Pick any color"></label>`;
      dots.querySelectorAll('.djc-dot[data-c]').forEach(d => d.onclick = () => { toggle(d.dataset.c); GB.sfx && GB.sfx('tap'); });
      dots.querySelector('input').addEventListener('change', e => toggle(e.target.value.toLowerCase()));
      paint();
    };
    render();
    key.onclick = async () => {
      latched = !latched; paint(); GB.sfx && GB.sfx('tap');
      if (latched) { await dj({colors: pick, color: true}); GB.toast && GB.toast('🎨 Color locked. Tap again to go back to the full show'); }
      else { await dj({color: false}); GB.toast && GB.toast('🌈 Back to the full show'); }
    };
    GB.on('status', s => { const d = s.dj || {}; if (typeof d.color === 'boolean' && d.color !== latched) { latched = d.color; paint(); } });
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

  // ------------------------------------------------------------------ DJ controller: the engine reads it (midi.js / midihub.py, SETUP > Controllers & Sync)
  GB.panel('dj', 60, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)'); el.id = 'djMidiCard';
    el.innerHTML = `<div class="ph"><span>DJ controller</span><span class="r" id="djMidiR">NOT CONNECTED</span></div>
      <p class="note">Plug a USB controller into the laptop. GlowBop finds it, offers a ready-made layout, and you can long-press (or right-click) any pad here to teach it a button.</p>
      <button class="btn c wide" id="djMidiGo" style="--c:var(--violet)">${GB.svg('dj')}<span>Controllers &amp; Sync</span></button>`;
    el.querySelector('#djMidiGo').onclick = () => GB.go('setup', 'miPanel');
  });

  // ------------------------------------------------------------------ live state
  GB.on('status', s => {
    const d = s.dj || {};
    const r = $('djNow'); if (r) r.textContent = d.blackout ? 'BLACKOUT' : d.strobing ? 'STROBING' : (d.queued || []).length ? 'FIRING…' : 'ON THE NEXT BEAT';
    document.querySelectorAll('.dj-pads .tile').forEach(b => b.classList.toggle('on', b.dataset.k === 'blackout' && !!d.blackout));
    const c = $('djCue'); if (c) c.textContent = d.cue ? 'CUED: ' + d.cue.toUpperCase() : 'NOTHING CUED';
    document.querySelectorAll('#djLooks .chip').forEach(b => b.classList.toggle('on', b.dataset.v === d.cue));
    const bpm = $('djBpm'); if (bpm) bpm.textContent = d.tap_bpm ? d.tap_bpm + ' BPM' : (s.bpm ? Math.round(s.bpm) + ' BPM' : '–');
    const tr = $('djTapR'); if (tr) tr.textContent = d.tap_bpm ? 'LOCKED TO YOUR TAPS' : 'FOLLOWING THE MUSIC';
    const au = $('djAuto'); if (au) au.hidden = !d.tap_bpm;
  });
  /* 🎛️ one key style everywhere (Oct 16, Graham): hit pads and the look/effect skip keys now match the Pro keys under the wall:
     a solid colored key, a small line icon on top, the name underneath. Same on DJ, Pro DJ and the Live Board. */
  GB.css(`
  .dj-pads { grid-template-columns:repeat(auto-fill, minmax(96px, 1fr)) !important; gap:6px; }
  .dj-pads .tile { background:var(--c) !important; color:#000 !important; border:0 !important; border-radius:999px !important; min-height:58px !important; padding:4px 4px !important;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; font:700 calc(12px * var(--fs, 1))/1.05 var(--cond) !important; letter-spacing:1px; text-transform:uppercase; box-shadow:none !important; }
  .dj-pads .tile::before { display:none !important; }
  .dj-pads .tile .em { font-size:inherit !important; filter:none !important; line-height:1; }
  .dj-pads .tile .em .ic, .dj-pads .tile .em svg { width:calc(22px * var(--fs, 1)); height:calc(22px * var(--fs, 1)); fill:currentColor; color:#000; }
  .dj-pads .tile .nm { color:#000 !important; text-shadow:none !important; font-weight:700; }
  .dj-pads .tile:hover { filter:brightness(1.12); }
  .dj-pads .tile.hit { filter:brightness(1.8); }
  .dj-pads .tile.on { box-shadow:0 0 18px var(--c) !important; outline:2px solid #fff; }
  .dj-skip .btn { background:var(--c); color:#000; border:0; border-radius:999px; }
  .dj-skip .btn .sk { background:transparent; color:#000; box-shadow:none; width:auto; height:auto; }
  .dj-skip .btn .sk svg, .dj-skip .btn .ir > svg { fill:currentColor; }
  .dj-skip .btn.hit { filter:brightness(1.8); box-shadow:0 0 18px var(--c); }
  .dj-skip .btn.hit .sk { background:transparent; color:#000; }
  `);
  // ------------------------------------------------------------------ 🔒 Home DJ vs Pro (Oct 16, Graham): Pro gets the DJ power tools
  // Home keeps HOLD TO BUILD (a random style each time), the 6 classic pads, Cool down, tap tempo, crowd lines and look/effect skips.
  // Pro adds: the 7 extra pads, build & drop style pickers, Color lock, Cue the next look and DJ controllers (MIDI). The engine checks too.
  const PRO_PADS = ['sweep', 'shockwave', 'colorbomb', 'lightning', 'countdown', 'heartbeat', 'star'];
  GB.css(`
  .dj-pads .tile.pro-pad.locked { opacity:.62; filter:saturate(.45) !important; }
  .dj-pads .tile.pro-pad.locked::after { content:'PRO'; position:absolute; top:4px; right:10px; font:800 9px var(--mono); letter-spacing:1px; background:#000; color:#fff; border-radius:6px; padding:1px 5px; }
  .dj-lockline { display:flex; align-items:center; gap:8px; margin-top:10px; padding:8px 12px; border-radius:14px; background:#0007; border:1px dashed color-mix(in srgb, var(--orchid) 50%, transparent); color:var(--dim); font-size:calc(13px * var(--fs, 1)); cursor:pointer; }
  .dj-lockline b { color:var(--orchid); }
  `);
  function proPaint() {
    const locked = GB.pro === false;
    document.querySelectorAll('.dj-pads .tile').forEach(t => { const pro = PRO_PADS.includes(t.dataset.k); t.classList.toggle('pro-pad', pro); t.classList.toggle('locked', pro && locked); });
    ['djBuildPick', 'djDropPick'].forEach(id => { const n = $(id); if (!n) return; n.hidden = locked; const sub = n.previousElementSibling; if (sub && sub.classList.contains('dj-sub')) sub.hidden = locked; });
    let line = $('djStyleLock');
    if (locked && !line && $('djDropPick')) { line = document.createElement('div'); line.id = 'djStyleLock'; line.className = 'dj-lockline';
      line.innerHTML = GB.svg('lock') + '<span>Every build and drop picks its own style. <b>Pro</b> lets you choose the build and drop styles.</span>';
      line.onclick = () => GB.go('pro'); $('djDropPick').after(line); }
    if (line) line.hidden = !locked;
  }
  GB.on('ready', () => {
    const gate = (el, pitch) => el && GB.proGate(el, 'DJ power tools', {pitch});
    gate($('djColor') && $('djColor').closest('.panel'), 'Color lock: pick up to 4 colors and the whole show (looks, effects, builds, drops, even the white flashes) plays only in those colors until you tap again. Part of GlowBop Pro.');
    gate($('djLooks') && $('djLooks').closest('.panel'), 'Cue the next look: pick what comes in on the next drop, so the show changes exactly when you want. Part of GlowBop Pro.');
    gate($('djMidiCard'), 'DJ controllers: plug in a USB DJ controller or pad and play every GlowBop key from real buttons and faders. Part of GlowBop Pro.');
    proPaint();
  });
  GB.on('pro', proPaint);

  // shared with prodj.js (the Pro DJ keys under the wall)
  GB.djHit = hit; GB.djPost = dj; GB.DJ_PADS = PADS;
})();
