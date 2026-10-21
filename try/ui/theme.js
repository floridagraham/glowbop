/* 🎨 Looks for the console (Oct 20, Graham, after looking at DJ Pro: "a different theme for GlowBop where the buttons are... the dark
   outline first and then when you push it, it's highlighted... just the opposite way"; picked: one switch in SETUP > Screen, Glow or
   Studio, the whole app follows; in Studio the buttons AND the rail go to outlines (the page you're on lights up) and the top bar goes
   to lines too, except the GlowBop logo, which stays as it is).
   Glow   = today: keys are filled with colour, a key that's on gets a white ring.
   Studio = keys are near-black with a thin outline in their colour; they fill with colour only while on or pressed. */
(function () {
  'use strict';
  const KEY = 'gb_theme';
  const get = () => { try { return localStorage.getItem(KEY) === 'studio' ? 'studio' : 'glow'; } catch (e) { return 'glow'; } };
  const apply = t => document.documentElement.classList.toggle('gb-studio', t === 'studio');
  apply(get());
  const K = ':is(.btn, .chip, .tile, .lt-tabs button, #gbTools .tb, .gbcard .cb button, .djc-keys .btn)';
  const ON = ':is(.on, .sel, .latched, .open, [aria-pressed="true"])';
  GB.css(`
  /* ---- Studio: keys at rest are dark with a coloured outline */
  html.gb-studio ${K}:not(${ON}):not(.ghost):not(#djBuild.held) {
    background-color:#07060d !important;
    color:color-mix(in srgb, var(--c, var(--lav)) 82%, #fff) !important; text-shadow:none !important;
    box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--c, var(--lav)) 88%, transparent) !important; }
  html.gb-studio ${K}:not(.gb-wm) { background-image:none !important; }   /* (keys keep their faint big icon) */
  html.gb-studio #gbTools .tb:not(.open) { color:color-mix(in srgb, var(--tc) 85%, #fff) !important; box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--tc) 85%, transparent) !important; }
  /* ...and fill with their colour while they're on, or while your finger is on them */
  html.gb-studio ${K}${ON}, html.gb-studio ${K}:not(#djBuild):active {
    background-color:var(--c, var(--cyan)) !important; color:#000 !important; text-shadow:none !important;
    box-shadow:0 0 18px color-mix(in srgb, var(--c, var(--cyan)) 60%, transparent) !important; }
  html.gb-studio #gbTools .tb.open, html.gb-studio #gbTools .tb:active { background:var(--tc) !important; color:#000 !important; box-shadow:0 0 16px -2px var(--tc) !important; }
  html.gb-studio .dj-pads .tile::before { opacity:.35; }
  /* Oct 20 18:51 (Graham: "I don't see any words in the hit pads in Studio"): words and icons inside a resting key take the key's own
     colour (some keys set their words to black for the filled Glow look) */
  html.gb-studio ${K}:not(${ON}):not(:active) :is(span, b, small, i, .nm, .em):not(.bdg) { color:inherit !important; text-shadow:none !important; }
  html.gb-studio ${K}:not(${ON}):not(:active) svg:not(.wm-hid) { color:inherit !important; fill:currentColor; }
  /* Oct 20 18:50 (Graham: "the Charge the drop effects are still solid in Studio"): the build and drop style chips stay outlines.
     A style that's in (picked, or in your mix / full random) gets a bright outline, a soft tint and a dot; only your finger fills it. */
  html.gb-studio :is(#djBuildPick, #djDropPick) .chip${ON} { background-color:color-mix(in srgb, var(--c, var(--pink)) 16%, #07060d) !important; color:color-mix(in srgb, var(--c, var(--pink)) 70%, #fff) !important;
    box-shadow:inset 0 0 0 2px var(--c, var(--pink)), 0 0 10px -3px var(--c, var(--pink)) !important; }
  html.gb-studio :is(#djBuildPick, #djDropPick) .chip${ON}::after { content:''; position:absolute; top:7px; left:9px; width:7px; height:7px; border-radius:50%; background:var(--c, var(--pink)); }
  html.gb-studio :is(#djBuildPick, #djDropPick) .chip { position:relative; }
  html.gb-studio :is(#djBuildPick, #djDropPick) .chip:active { background-color:var(--c, var(--pink)) !important; color:#000 !important; }
  html.gb-studio .btn:disabled { opacity:.4; }
  /* ---- the rail: outlines, the page you're on lights up */
  html.gb-studio #rail button:not(.on) { background:#07060d !important; color:color-mix(in srgb, var(--c) 85%, #fff) !important;
    box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--c) 80%, transparent) !important; }
  html.gb-studio #rail button.on { background:var(--c) !important; color:#000 !important; box-shadow:0 0 18px color-mix(in srgb, var(--c) 70%, transparent) !important; }
  html.gb-studio #rail .tail { background:transparent !important; box-shadow:inset 0 0 0 2px var(--peri); }
  /* ---- the top bar: lines, the GlowBop logo stays as it is */
  html.gb-studio #hd .elbow { background:#07060d !important; box-shadow:inset 2px 2px 0 var(--pink), inset 0 -2px 0 var(--pink); }
  html.gb-studio #hd .bars i { background:transparent !important; box-shadow:inset 0 0 0 2px var(--c); }
  html.gb-studio #hd .bars b { background:#07060d !important; background-image:none !important; color:var(--pink) !important;
    box-shadow:inset 0 0 0 2px var(--pink) !important; text-shadow:0 0 10px color-mix(in srgb, var(--pink) 70%, transparent) !important; }
  /* 🟦 Oct 21 (Graham: "the rotating box GlowBop logo in the studio look... let's style it like the studio one... like Tron"): in Studio the
     cube goes Tron too. 08:53: "doesn't need to glow like that, it can just be the letters": 08:56: "the lines for the box... that was the cool part": every face is near-black with a crisp outline and letters in that face's colour, no glow; picture faces stay as they are */
  html.gb-studio #hd .bars b.cube3 { background:transparent !important; box-shadow:none !important; }
  html.gb-studio #hd .bars b.cube3 .hdf:not(.img), html.gb-studio #hd .bars b.cube3 .hdlf { background:#07060d !important; color:var(--fb) !important; text-shadow:none !important; }
  html.gb-studio #hd .bars b.cube3 .hdf:not(.img) { box-shadow:inset 0 0 0 2px var(--fb) !important; }
  html.gb-studio #hd .bars b.cube3 .hdlf { box-shadow:inset 0 2px 0 var(--fb), inset 0 -2px 0 var(--fb) !important; }
  /* the switch itself */
  #thSeg { margin-top:12px; } #thSeg .btn { min-height:48px; }
  /* 🌗 Oct 20 18:46 (Graham: "I don't see where the button is at all... can it be over by the GlowBop logo... people need to be made
     aware"): a Look key right next to the logo, on every page */
  #thKey { flex:none; min-height:44px; padding:0 14px 0 10px; border:0; border-radius:999px; cursor:pointer; display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(90deg, var(--pink), var(--violet), var(--cyan)); color:#000; font:800 calc(13px * var(--fs, 1))/1 var(--cond); letter-spacing:1.5px; text-transform:uppercase; }
  #thKey svg { width:22px; height:22px; flex:none; }
  html.gb-studio #thKey { background:#07060d !important; color:var(--cyan) !important; box-shadow:inset 0 0 0 2px var(--cyan) !important; }
  @media (max-width:700px) { #thKey { width:44px; padding:0; justify-content:center; } #thKey span { display:none; } }
  #thTip { position:fixed; z-index:3000; max-width:260px; padding:12px 14px 12px; border-radius:0 18px 0 18px; background:var(--cyan); color:#000;
    font:700 calc(15px * var(--fs, 1))/1.3 var(--cond); letter-spacing:.3px; box-shadow:0 14px 40px #000c; cursor:pointer; }
  #thTip::before { content:''; position:absolute; top:-9px; left:18px; border:9px solid transparent; border-top:0; border-bottom-color:var(--cyan); }
  #thTip b { display:block; font-size:calc(17px * var(--fs, 1)); letter-spacing:1px; text-transform:uppercase; }
  .th-lbl { font:700 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label, var(--dim)); margin-top:14px; text-transform:uppercase; }
  `);
  function set(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
    apply(t); paint(); GB.sfx && GB.sfx('tap');
    GB.toast && GB.toast(t === 'studio' ? '🖤 Studio: dark keys that light up when they\'re on' : '🌈 Glow: the full-colour GlowBop look');
  }
  const HALF = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>';
  function paint() {
    document.querySelectorAll('#thSeg [data-th]').forEach(b => b.classList.toggle('on', b.dataset.th === get()));
    const k = document.getElementById('thKey'); if (k) { k.innerHTML = HALF + '<span>' + (get() === 'studio' ? 'Studio look' : 'Glow look') + '</span>'; k.setAttribute('aria-label', 'Look: ' + get() + '. Tap to switch'); }
  }
  function headerKey() {
    const line = document.querySelector('#hd .line'); if (!line || document.getElementById('thKey')) return;
    const k = document.createElement('button'); k.id = 'thKey'; k.type = 'button'; k.title = 'Switch the look: Glow or Studio';
    line.insertBefore(k, line.firstChild); k.onclick = () => { tipOff(); set(get() === 'studio' ? 'glow' : 'studio'); }; paint();
    let seen = false; try { seen = localStorage.getItem('gb_th_tip') === '1'; } catch (e) {}
    if (!seen) setTimeout(tip, 2500);
  }
  function tip() {
    const k = document.getElementById('thKey'); if (!k || document.getElementById('thTip') || document.getElementById('gbIntro')) return;
    const r = k.getBoundingClientRect(), t = document.createElement('div'); t.id = 'thTip';
    t.innerHTML = '<b>New: Studio look</b>Tap here to switch between Glow (full colour) and Studio (dark keys that light up when they\'re on).';
    t.style.left = Math.max(8, r.left - 6) + 'px'; t.style.top = (r.bottom + 12) + 'px'; document.body.appendChild(t);
    t.onclick = tipOff; setTimeout(tipOff, 12000);
  }
  function tipOff() { const t = document.getElementById('thTip'); if (t) t.remove(); try { localStorage.setItem('gb_th_tip', '1'); } catch (e) {} }
  function mount() {
    if (document.getElementById('thSeg')) return;
    const box = document.getElementById('awBtn') && document.getElementById('awBtn').closest('.panel'); if (!box) return;
    const lbl = document.createElement('div'); lbl.className = 'th-lbl'; lbl.textContent = 'Look';
    const seg = document.createElement('div'); seg.className = 'seg'; seg.id = 'thSeg';
    seg.innerHTML = `<button class="btn" type="button" data-th="glow" style="--c:var(--pink)">Glow</button><button class="btn" type="button" data-th="studio" style="--c:var(--cyan)">Studio</button>`;
    const note = box.querySelector('.note'); box.insertBefore(lbl, note); box.insertBefore(seg, note);
    seg.querySelectorAll('[data-th]').forEach(b => b.onclick = () => set(b.dataset.th));
    paint();
  }
  GB.theme = {get, set};
  GB.on('ready', () => setTimeout(() => { mount(); headerKey(); }, 300));
})();
