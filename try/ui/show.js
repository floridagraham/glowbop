/* GlowBop console: show.js
   Show control keys, levels, looks, feature an effect, transitions, quick scenes, describe a scene.
   Owns GB.pin (the shared Pin flag). Ids prefixed `sh`, css `.sh-`. */
(function () {
  'use strict';
  const {$} = GB;
  const S = () => GB.status || {};
  // relabel a button only when its text changes (rebuilding it every second can eat taps)
  const setLbl = (b, ic, text) => { if (!b || b._k === ic + text) return; b._k = ic + text; GB.lbl(b, ic, text); };

  GB.css(`
  .sh-pads .btn { position:relative; min-height:64px; align-items:flex-end; padding:0 12px 9px; font-size:calc(15px * var(--fs, 1)); line-height:1.05; border-radius:0 18px 0 18px; }
  .sh-pads .btn svg { position:absolute; left:12px; top:10px; margin:0; width:18px; height:18px; }
  .sh-pads .sh-power { grid-column:span 2; }
  .mu-lights { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 2fr); gap:12px; align-items:center; }
  .mu-lights .sh-power { min-height:48px; padding:0 12px; font-size:calc(15px * var(--fs, 1)); white-space:nowrap; gap:6px; }
  .mu-lights .lv { grid-template-columns:auto minmax(0, 1fr) auto; grid-template-areas:"k s v"; }   /* one line: sun icon, slider, % */
  .mu-lights .lv > span { font-size:0; letter-spacing:0; gap:0; } .mu-lights .lv > span .ic { width:22px; height:22px; margin:0; }
  @media (max-width: 699px) { .mu-lights { grid-template-columns:minmax(0, .8fr) minmax(0, 1.4fr); gap:8px; } .mu-lights .sh-power { padding:0 8px; font-size:calc(14px * var(--fs, 1)); letter-spacing:.5px; } .mu-lights .lv { gap:4px 6px; } }
  .mu-lights .sh-power.sh-dead { --c:var(--red) !important; background:#3a0f1c; color:#ffc2cf; box-shadow:inset 0 0 0 2px var(--red), 0 0 14px color-mix(in srgb, var(--red) 45%, transparent); }
  .sh-pads .btn.sh-off { background:var(--dark); color:var(--text); box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--c) 45%, transparent); }
  .sh-pads .btn.sh-off svg { color:var(--c); }
  .sh-pads .btn.sh-dead { --c:var(--red) !important; background:#3a0f1c; color:#ffc2cf; box-shadow:inset 0 0 0 2px var(--red), 0 0 14px color-mix(in srgb, var(--red) 45%, transparent); }
  .sh-pads .btn.sh-dead svg { color:var(--red); }
  .sh-segrow { display:flex; flex-direction:column; gap:6px; }
  .sh-segrow > span { font:600 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--c, var(--label)); text-transform:uppercase; display:flex; align-items:center; gap:6px; }
  .sh-segrow > span svg { width:16px; height:16px; fill:currentColor; flex:0 0 auto; }
  .sh-segrow .seg > .btn { --c:inherit; }
  /* 🎨 Color mood (Oct 17): six bright keys, each painted in its own colours */
  .sh-mood { display:grid; grid-template-columns:repeat(auto-fill, minmax(88px, 1fr)); gap:6px; }
  .sh-mood .btn { min-height:46px; padding:2px 4px; border-radius:12px; background:var(--g); color:#fff; font-size:calc(15px * var(--fs, 1)); letter-spacing:1px;
    text-shadow:0 1px 3px #000, 0 0 2px #000; flex-direction:column; gap:2px; line-height:1; white-space:nowrap; }
  .sh-mood .btn small { font:600 calc(10.5px * var(--fs, 1)) var(--cond); letter-spacing:.5px; opacity:.85; text-transform:none; }
  .sh-mood .btn.on { box-shadow:0 0 0 3px #fff inset, 0 0 18px color-mix(in srgb, var(--k) 80%, transparent); transform:scale(1.03); }
  .sh-mood .btn.on::after { content:'✓'; position:absolute; top:3px; right:7px; font-size:12px; }
  .sh-mood .btn { position:relative; }
  .lv > span svg { width:16px; height:16px; fill:currentColor; flex:0 0 auto; }
  .sh-effs { height:320px; border:1px solid var(--line); border-radius:12px; padding:0 6px; background:#06050c; }
  .sh-effs .item { width:100%; appearance:none; border:0; border-bottom:1px solid var(--line); background:transparent; color:var(--text); text-align:left; font:inherit; cursor:pointer; }
  .sh-effs .item:last-child { border-bottom:0; }
  .sh-effs .item .tx b { font:700 calc(16px * var(--fs, 1))/1.2 var(--cond); letter-spacing:.5px; }
  .sh-effs .item .tx small { white-space:normal; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; line-height:1.35; }
  .sh-effs .item.on { background:color-mix(in srgb, var(--amber) 22%, #0a0812); box-shadow:inset 4px 0 0 var(--amber); }
  .sh-effs .item.on .tx b { color:var(--amber); }
  .sh-effs .item svg { width:18px; height:18px; fill:var(--amber); flex:0 0 auto; }
  .sh-effs .sh-none { padding:16px 6px; }
  .sh-fx { display:flex; flex-wrap:wrap; gap:6px; }
  .sh-fx > .btn { flex:1 1 120px; }
  .sh-fx > #shRelease, .sh-fx > #shRelease0 { flex:3 1 220px; }
  .sh-tiles .tile { min-height:84px; font-size:calc(13px * var(--fs, 1)); }
  .sh-tiles .tile .em { font-size:calc(26px * var(--fs, 1)); }
  .sh-chips .chip { text-transform:capitalize; }
  `);

  // ------------------------------------------------------------------ Pin (shared flag)
  const pinBtns = [];
  function paintPin() {
    pinBtns.forEach(b => {
      b.classList.toggle('on', GB.pin); b.classList.toggle('c', GB.pin); b.classList.toggle('sh-off', !GB.pin);
      setLbl(b, 'pin', GB.pin ? 'Pin on' : 'Pin off');
    });
  }
  GB.setPin = on => {
    GB.pin = !!on; paintPin();
    GB.toast(GB.pin ? '📌 Your next pick will stay' : 'Picks flow with the music');
    GB.emit('pin', GB.pin);
  };
  const pinButton = (extra) => {
    const b = document.createElement('button'); b.className = 'btn sh-off ' + (extra || ''); b.style.setProperty('--c', 'var(--gold)');
    b.onclick = () => GB.setPin(!GB.pin); pinBtns.push(b); paintPin(); return b;
  };

  // ------------------------------------------------------------------ 1. SHOW CONTROL keys
  GB.panel('music', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `
      <div class="ph"><span>Show control</span><span class="r" id="shState">–</span></div>
      <div class="pads sh-pads" id="shPads">
        <button class="btn c sh-power" id="shPower" style="--c:var(--cyan)"></button>
        <button class="btn c" id="shSkip" style="--c:var(--pink)"></button>
        <button class="btn" id="shEye" style="--c:var(--amber)"></button>
        <button class="btn" id="shShuffle" style="--c:var(--lav)"></button>
        <button class="btn" id="shChars" style="--c:var(--orange)"></button>
        <button class="btn c" id="shSurprise" style="--c:var(--peri)"></button>
      </div>
      <div class="sh-segrow" style="--c:var(--pink)"><span>🎨 Color mood</span><div class="sh-mood" id="shMood"></div></div>`;
    const MOODS = [['auto', 'Auto', 'each look', 'linear-gradient(135deg,#33d6ff,#ff3d9a 50%,#ffcc66)', '#33d6ff'],
      ['warm', 'Warm', 'reds & golds', 'linear-gradient(135deg,#ff2e0a,#ff8000 45%,#ffc72e)', '#ff8000'],
      ['cool', 'Cool', 'blues & teals', 'linear-gradient(135deg,#008cff,#00f2e6 50%,#6b33ff)', '#00c8ff'],
      ['party', 'Party', 'neon', 'linear-gradient(135deg,#ff0099,#9900ff 35%,#00e6ff 70%,#59ff00)', '#ff0099'],
      ['rainbow', 'Rainbow', 'every color', 'linear-gradient(90deg,#ff0000,#ff8c00,#ffff00,#00ff1a,#0099ff,#8000ff)', '#ffff00'],
      ['holiday', holidayNow()[0], holidayNow()[1], holidayNow()[2], '#ff6b00']];
    $('shMood').innerHTML = MOODS.map(([k, n, sub, g, kc]) => `<button class="btn" data-mood="${k}" style="--g:${g};--k:${kc}">${n}<small>${sub}</small></button>`).join('');
    $('shMood').querySelectorAll('[data-mood]').forEach(x => x.onclick = async () => {
      if (await GB.control({mood: x.dataset.mood})) { markSeg('[data-mood]', 'mood', x.dataset.mood);
        GB.toast(x.dataset.mood === 'auto' ? '🎨 Colors: each look picks its own' : '🎨 ' + x.firstChild.textContent + ' colors on every effect'); } });
    const pads = $('shPads'), pb = pinButton(); pb.id = 'shPin'; pads.appendChild(pb);
    GB.lbl($('shPower'), 'power', 'Power on');
    GB.lbl($('shSkip'), 'next', 'Next effect');
    GB.lbl($('shEye'), 'eye', 'Eyeball on');
    GB.lbl($('shShuffle'), 'shuffle', 'Shuffle off');
    GB.lbl($('shChars'), 'artist', 'Characters off');
    GB.lbl($('shSurprise'), 'sparkle', 'Surprise me');
    $('shPower').onclick = () => GB.control({power: S().power === false});
    $('shSkip').onclick = async () => { if (await GB.control({skip: true})) GB.toast('⏭ Next'); };
    $('shEye').onclick = async () => { const on = S().cameos === false; if (await GB.control({cameos: on})) GB.toast(on ? '👁️ Eyeball on' : '🙈 Eyeball off'); };
    $('shChars').onclick = async () => { if (await GB.control({characters: !S().characters})) GB.toast(S().characters ? '🙅 Characters off' : '🕺 Characters on'); };
    $('shShuffle').onclick = async () => { if (await GB.control({shuffle: !S().shuffle})) GB.toast(S().shuffle ? '🎲 Shuffle off' : '🎲 Shuffle on'); };
    $('shSurprise').onclick = async () => { if (await GB.control({surprise: true})) GB.toast('✨ Surprise!'); };
  });

  // ------------------------------------------------------------------ 2. LEVELS
  let brightT = null, blendT = null, delayT = null;
  const delayTxt = v => v > 0 ? '+' + v + ' ms' : v < 0 ? '−' + (-v) + ' ms early' : '0 ms';
  const touched = {};                  // slider id -> last time the user moved it (status won't fight the finger)
  const busy = id => Date.now() - (touched[id] || 0) < 1500;
  const blendTxt = v => '×' + (v / 10).toFixed(1);
  GB.panel('music', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `
      <div class="ph"><span>Levels</span></div>
      <div class="levels">
        <label class="lv" style="--c:var(--cyan)"><span>${GB.svg('bright')}Brightness</span><input type="range" id="shBright" min="5" max="100" value="100"><b id="shBrightV">100%</b></label>
        <label class="lv" style="--c:var(--lav)"><span>${GB.svg('anim')}Blend</span><input type="range" id="shBlend" min="2" max="40" value="10"><b id="shBlendV">${blendTxt(10)}</b></label>
        <label class="lv" style="--c:var(--peri)"><span>${GB.svg('bt')}Sync delay</span><input type="range" id="shDelay" min="-400" max="600" step="10" value="0"><b id="shDelayV">0 ms</b></label>
        <p class="note" id="shDelayNote">Lights <b>early</b>? Slide right to hold them back (Bluetooth speakers run ~150-300 ms behind). Lights <b>late</b>? Slide left and GlowBop fires the beats early. Saved per speaker.</p>
        <div class="sh-segrow" style="--c:var(--gold)"><span>${GB.svg('sparkle')}Sparkles</span>
          <div class="seg" id="shSpark"><button class="btn" data-sp="off">Off</button><button class="btn" data-sp="auto">Auto</button><button class="btn" data-sp="lots">Lots</button></div></div>
        <div class="sh-segrow" style="--c:var(--pink)"><span>${GB.svg('anim')}Pace</span>
          <div class="seg" id="shPace"><button class="btn" data-pace="chill">Chill</button><button class="btn" data-pace="normal">Normal</button><button class="btn" data-pace="hype">Hype</button></div></div>
      </div>`;
    el.querySelectorAll('input[type=range]').forEach(GB.paintRange);
    // 💡 Power + Brightness ride in the Now playing card (right under Light style), so they're on a phone's first screen.
    // Same buttons, same ids, only moved: everything below keeps driving them.
    const card = $('muCard'), sty = $('muSty');
    if (card) { const row = document.createElement('div'); row.className = 'mu-lights'; row.id = 'muLights';
      row.appendChild($('shPower')); row.appendChild($('shBright').closest('.lv'));
      card.insertBefore(row, sty ? sty.nextSibling : null); }
    $('shBright').oninput = e => { touched.shBright = Date.now(); $('shBrightV').textContent = e.target.value + '%';
      clearTimeout(brightT); brightT = setTimeout(() => GB.control({brightness: +e.target.value}), 120); };
    $('shBlend').oninput = e => { touched.shBlend = Date.now(); $('shBlendV').textContent = blendTxt(+e.target.value);
      clearTimeout(blendT); blendT = setTimeout(() => GB.control({blend: e.target.value / 10}), 200); };
    $('shDelay').oninput = e => { touched.shDelay = Date.now(); const v = +e.target.value; $('shDelayV').textContent = delayTxt(v);
      clearTimeout(delayT); delayT = setTimeout(async () => { if (await GB.control({delay: v}))
        GB.toast(v > 0 ? '🔵 Lights held back ' + v + ' ms for this speaker' : v < 0 ? '⏩ Beats fire ' + (-v) + ' ms early for this speaker' : '🔵 No sync delay for this speaker'); }, 300); };
    el.querySelectorAll('[data-sp]').forEach(x => x.onclick = async () => {
      if (await GB.control({sparkles: x.dataset.sp})) { GB.toast('✨ Sparkles: ' + x.textContent); markSeg('[data-sp]', 'sp', x.dataset.sp); } });
    el.querySelectorAll('[data-pace]').forEach(x => x.onclick = async () => {
      if (await GB.control({pace: x.dataset.pace})) {
        GB.toast({chill: '🌙 Chill: effects stay ~16 bars, long blends', normal: '🎵 Normal: ~8 bars per effect', hype: '🔥 Hype: changes every ~4 bars'}[x.dataset.pace]);
        markSeg('[data-pace]', 'pace', x.dataset.pace); } });
  });
  // 🎨 the Holiday mood key follows the calendar (the engine uses the same dates)
  function holidayNow() {
    const d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
    const T = [[101, 102, '🎆 New Year', 'linear-gradient(135deg,#ffcc40,#d9e0ff 50%,#3359ff)'], [201, 215, '💘 Valentine', 'linear-gradient(135deg,#ff1a59,#ff73a6 55%,#ffd9e6)'],
      [310, 318, '☘️ St. Paddy', 'linear-gradient(135deg,#00d940,#73ff4d 55%,#ffcc33)'], [319, 425, '🐣 Spring', 'linear-gradient(135deg,#ffb3d9,#99e6ff 50%,#ffff8c)'],
      [620, 706, '🇺🇸 July 4th', 'linear-gradient(135deg,#ff0d1a,#ffffff 50%,#0d40ff)'], [1001, 1101, '🎃 Halloween', 'linear-gradient(135deg,#ff6b00,#8c00e6 55%,#66ff1a)'],
      [1102, 1130, '🦃 Thanksgiving', 'linear-gradient(135deg,#ff800d,#991a0d 55%,#ffbf33)'], [1201, 1226, '🎄 Christmas', 'linear-gradient(135deg,#ff000d,#00cc33 55%,#ffffff)'],
      [1227, 1231, '🎆 New Year', 'linear-gradient(135deg,#ffcc40,#d9e0ff 50%,#3359ff)']];
    const h = T.find(([a, b]) => md >= a && md <= b);
    return h ? [h[2].replace(/^\S+\s/, ''), h[2].split(' ')[0] + ' holiday', h[3]] : ['Holiday', '🎉 party mix', 'linear-gradient(135deg,#ff0099,#ffcc33 50%,#00e6ff)'];
  }
  function markSeg(sel, key, v) {
    document.querySelectorAll(sel).forEach(x => { const on = x.dataset[key] === v; x.classList.toggle('on', on); });
  }

  // ------------------------------------------------------------------ 3. LOOKS
  GB.panel('looks', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--amber)');
    el.innerHTML = `
      <div class="ph"><span>Looks</span><span class="r" id="shLookNow"></span></div>
      <div class="sh-fx" id="shLkRow"><button class="btn c" id="shRelease0" style="--c:var(--cyan)"></button></div>
      <p class="note">A look is a color palette plus a set of effects. Tap one for this song, or turn on <b>Pin</b> to keep it.</p>
      <div class="chips" id="shLooks" style="--c:var(--amber)"><span class="note">Loading looks…</span></div>`;
    // 📌 Pin / Let it flow first: the two controls you reach for before picking a look (same as under Feature an effect)
    const pb = pinButton(); pb.id = 'shPin0'; $('shLkRow').insertBefore(pb, $('shRelease0'));
    GB.lbl($('shRelease0'), 'unlock', 'Let the show flow again'); $('shRelease0').onclick = () => GB.release();
  });
  function renderLooks(cat) {
    const lk = $('shLooks'); if (!lk || !cat || !cat.looks) return; lk.innerHTML = '';
    Object.keys(cat.looks).filter(n => n !== 'Retro Arcade').forEach(n => {          // 🕹️ the arcade games have their own GAMES key
      const b = document.createElement('button'); b.className = 'chip'; b.textContent = n; b.dataset.v = n;
      b.onclick = async () => { const pin = GB.pin; if (await GB.control({look: n, pin: pin})) GB.toast((pin ? '📌 ' : '🎨 ') + n + (pin ? ' (pinned)' : ' (this song)')); };
      lk.appendChild(b);
    });
    syncSel();
  }

  // ------------------------------------------------------------------ 4. FEATURE AN EFFECT
  GB.panel('looks', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--amber)');
    el.innerHTML = `
      <div class="ph"><span>Feature an effect</span><span class="r" id="shEffN"></span></div>
      <p class="note">Plays for this song part. Turn on <b>Pin</b> to lock it until you let the show flow again.</p>
      <input type="search" id="shQ" placeholder="Search effects…" aria-label="Search effects" enterkeyhint="search" autocomplete="off">
      <div class="scroll list sh-effs" id="shEffs"><p class="note sh-none">Loading effects…</p></div>
      <div class="sh-fx" id="shFxRow"><button class="btn c" id="shRelease" style="--c:var(--cyan)"></button></div>`;
    const pb = pinButton(); pb.id = 'shPin2'; $('shFxRow').insertBefore(pb, $('shRelease'));
    GB.lbl($('shRelease'), 'unlock', 'Let the show flow again');
    $('shRelease').onclick = () => GB.release();
    $('shQ').oninput = renderEffects;
  });
  function renderEffects() {
    const cat = GB.catalog, box = $('shEffs'); if (!cat || !box) return;
    const q = $('shQ').value.trim().toLowerCase(); box.innerHTML = '';
    const list = Object.entries(cat.effects || {}).filter(([k, v]) => !q || k.toLowerCase().includes(q) || (v.about || '').toLowerCase().includes(q));
    $('shEffN').textContent = q ? list.length + ' found' : String(list.length);
    if (!list.length) { box.innerHTML = '<p class="note sh-none">No effects match that. Try another word.</p>'; return; }
    const frag = document.createDocumentFragment();
    list.forEach(([k, v]) => {
      const b = document.createElement('button'); b.className = 'item'; b.dataset.v = k;
      b.innerHTML = `<span class="tx"><b>${GB.esc(k)}</b><small>${GB.esc((v.about || '').slice(0, 110))}</small></span>`;
      b.onclick = async () => {
        if (GB.pin) { if (await GB.control({lock_effect: k})) GB.toast('📌 Pinned ' + k); }
        else if (await GB.control({feature: k})) GB.toast('✨ ' + k + ' (this song part)');
      };
      frag.appendChild(b);
    });
    box.appendChild(frag); syncSel();
  }

  // ------------------------------------------------------------------ 5. TRANSITIONS
  const TR = ['random', 'fade', 'wipe_lr', 'wipe_rl', 'wipe_down', 'wipe_up', 'diagonal', 'iris_out', 'iris_in', 'spiral', 'blinds', 'dissolve', 'rainbow_wipe', 'rainbow_sparkle', 'rainbow_dissolve', 'rainbow_iris'];
  GB.panel('looks', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `
      <div class="ph"><span>Transitions</span></div>
      <p class="note">How one effect hands off to the next.</p>
      <div class="chips sh-chips" id="shTrans" style="--c:var(--lav)"></div>`;
    const box = $('shTrans');
    TR.forEach(k => {
      const b = document.createElement('button'); b.className = 'chip'; b.textContent = k.replace('_', ' '); b.dataset.v = k;
      b.onclick = async () => { if (await GB.control({transition: k})) { GB.toast('🎬 ' + b.textContent); box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)); } };
      box.appendChild(b);
    });
  });

  // ------------------------------------------------------------------ 6. QUICK SCENES
  const PRESETS = {
    '🌋 Lava night': {name: 'Lava night', loop: true, bpm: 80, energy: 0.35, segments: [
      {seconds: 90, effect: 'LavaFlow', look: 'Molten', trail: 0.6, fade: 4},
      {seconds: 60, effect: 'LavaPurple', sparkle: 0.4, fade: 5},
      {seconds: 60, effect: 'LavaRainbow', transform: 'radial', fade: 5}]},
    '🌅 Day cycle': {name: 'Day cycle', loop: true, bpm: 70, energy: 0.3, segments: [
      {seconds: 120, effect: 'Sunrise', fade: 3}, {seconds: 60, layers: [{effect: 'SkyClouds'}, {effect: 'SoloSprite', mix: 'screen'}], fade: 4}]},
    '🚀 Warp speed': {name: 'Warp speed', loop: true, bpm: 128, energy: 0.8, segments: [
      {seconds: 40, effect: 'WarpSpeed', colors: ['white', 'cyan', 'violet'], trail: 0.5},
      {seconds: 20, effect: 'BlackHole', colors: ['violet', 'blue', 'white'], trail: 0.8}]},
    '🌌 Chill aurora': {name: 'Chill aurora', loop: true, bpm: 70, energy: 0.25, segments: [
      {seconds: 90, effect: 'Aurora', colors: ['green', 'teal', 'violet'], sparkle: 0.3, trail: 0.8, fade: 6},
      {seconds: 60, layers: [{effect: 'Aurora', colors: ['teal', 'blue']}, {effect: 'DancingSprites', mix: 'screen', colors: ['white', 'gold']}], fade: 6}]},
    '🫧 Blob party': {name: 'Blob party', loop: true, bpm: 110, energy: 0.6, segments: [
      {seconds: 60, effect: 'BlobParty', look: 'Psychedelic', trail: 0.6}, {seconds: 30, effect: 'LavaLamp', look: 'Lava Lounge', trail: 0.8, fade: 4}]},
    '🌈 Solo sprite': {name: 'Solo sprite', loop: true, bpm: 120, energy: 0.6, segments: [{seconds: 600, effect: 'SoloSprite', sparkle: 0.3}]},
    '🟢 Matrix': {name: 'Matrix', loop: true, bpm: 100, energy: 0.5, segments: [
      {seconds: 60, effect: 'MatrixRain', look: 'Digital Matrix'}, {seconds: 30, effect: 'Updraft', colors: ['green', 'lime'], trail: 0.6}]},
    '🔥 Campfire': {name: 'Campfire', loop: true, music: false, segments: [{seconds: 3600, effect: 'Campfire'}]},
    '🍄 LSD Trip': {name: 'LSD Trip', loop: true, bpm: 90, energy: 0.5, segments: [
      {seconds: 60, effect: 'LiquidMelt', transform: 'radial', trail: 0.85, sparkle: 0.3, fade: 6, transition: 'rainbow_dissolve'},
      {seconds: 50, layers: [{effect: 'LavaLamp', look: 'Psychedelic'}, {effect: 'DancingSprites', mix: 'screen'}], transform: 'kaleido', trail: 0.8, fade: 6, transition: 'rainbow_dissolve'},
      {seconds: 45, effect: 'Kaleidoscope', look: 'Psychedelic', transform: 'radial', trail: 0.9, fade: 6, transition: 'spiral'},
      {seconds: 50, layers: [{effect: 'Hiphotic', look: 'Psychedelic'}, {effect: 'BlobParty', mix: 'screen', look: 'Lava Lounge'}], trail: 0.8, fade: 6, transition: 'rainbow_dissolve'},
      {seconds: 45, effect: 'LavaRainbow', transform: 'radial', trail: 0.7, fade: 6, transition: 'iris_out'},
      {seconds: 60, layers: [{effect: 'LiquidMelt'}, {effect: 'SoloSprite', mix: 'screen'}], transform: 'mirror_x', trail: 0.85, fade: 6, transition: 'rainbow_dissolve'},
      {seconds: 40, effect: 'Octopus', look: 'Psychedelic', transform: 'kaleido', trail: 0.85, fade: 6, transition: 'spiral'},
      {seconds: 45, layers: [{effect: 'LavaLamp', look: 'Lava Lounge'}, {effect: 'Swirl', mix: 'screen', look: 'Psychedelic'}], transform: 'radial', trail: 0.9, fade: 6, transition: 'rainbow_dissolve'},
      {seconds: 50, layers: [{effect: 'LavaFlow', look: 'Psychedelic'}, {effect: 'LiquidMelt', mix: 'screen', opacity: 0.6}], transform: 'kaleido', trail: 0.8, fade: 6, transition: 'rainbow_dissolve'}]},
    '🌊 Storm & Sea': {name: 'Storm & Sea', loop: true, bpm: 80, energy: 0.4, segments: [
      {seconds: 60, effect: 'OceanWaves', look: 'Storm & Sea', fade: 5}, {seconds: 45, effect: 'Thunderstorm', look: 'Storm & Sea', fade: 3},
      {seconds: 60, effect: 'Bioluminescence', look: 'Storm & Sea', fade: 5}, {seconds: 45, effect: 'Fireflies', look: 'Storm & Sea', fade: 5}]},
    '🚀 Deep Space': {name: 'Deep Space', loop: true, bpm: 100, energy: 0.6, segments: [
      {seconds: 50, effect: 'PlanetRise', look: 'Deep Space', fade: 4}, {seconds: 40, effect: 'JellyfishSwarm', look: 'Deep Space', trail: 0.6},
      {seconds: 30, effect: 'Wormhole', look: 'Deep Space', transition: 'iris_out'}, {seconds: 40, effect: 'DragonFlight', look: 'Deep Space', trail: 0.7}]},
    '🌀 Hypnotic': {name: 'Hypnotic', loop: true, bpm: 100, energy: 0.5, segments: [
      {seconds: 40, effect: 'SpiralHypnosis', look: 'Hypnotic'}, {seconds: 40, effect: 'InfiniteZoom', look: 'Hypnotic', transition: 'iris_out'},
      {seconds: 40, effect: 'Moire', look: 'Hypnotic', transition: 'dissolve'}, {seconds: 40, effect: 'OpArtChecker', look: 'Hypnotic', transition: 'spiral'}]},
    '🎉 Party': {name: 'Party', loop: true, bpm: 126, energy: 0.85, segments: [
      {seconds: 30, effect: 'Shockwave', look: 'Neon Party'}, {seconds: 30, effect: 'Fountain', look: 'Rainbow Riot'},
      {seconds: 30, effect: 'LaserBlast', look: 'Neon Party', transform: 'mirror_x'}, {seconds: 30, effect: 'Centipedes', look: 'Synthwave', trail: 0.6}]},
  };
  const TILEC = ['var(--orange)', 'var(--gold)', 'var(--cyan)', 'var(--green)', 'var(--pink)', 'var(--lav)', 'var(--green)', 'var(--orange)', 'var(--violet)', 'var(--cyan)', 'var(--peri)', 'var(--lav)', 'var(--pink)'];
  GB.panel('scenes', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `
      <div class="ph"><span>Quick scenes</span><span class="r" id="shSceneNow"></span></div>
      <p class="note">Ready-made light shows that loop until you stop them.</p>
      <div class="tiles sh-tiles" id="shPresets"></div>`;
    const p = $('shPresets');
    Object.entries(PRESETS).forEach(([n, sc], i) => {
      const sp = n.indexOf(' '), em = n.slice(0, sp), label = n.slice(sp + 1);
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.v = sc.name; b.style.setProperty('--c', TILEC[i % TILEC.length]);
      b.innerHTML = `<span class="em" aria-hidden="true">${em}</span><span>${GB.esc(label)}</span>`;
      b.onclick = async () => { if (await GB.post('/api/scene', sc)) GB.toast('▶ ' + n); };
      p.appendChild(b);
    });
  });

  // ------------------------------------------------------------------ 7. DESCRIBE A SCENE (keyword matcher; Claude does the real text-to-lights)
  const WORDS = [
    [/christmas|xmas|santa|tree/, 'ChristmasTree'], [/candy ?cane|peppermint/, 'CandyCane'], [/sleigh|reindeer/, 'SleighRide'], [/snow|blizzard|winter/, 'Snowfall'],
    [/pumpkin|jack.?o|halloween/, 'JackOLanterns'], [/\bbats?\b/, 'BatSwarm'], [/ghost|spook/, 'Ghosts'], [/haunted|spooky house/, 'HauntedHouse'],
    [/firework|4th|fourth of july/, 'FireworkShow'], [/flag|usa|america/, 'WavingFlag'], [/sparkler/, 'Sparklers'], [/heart|valentine|love/, 'FloatingHearts'],
    [/new year|ball drop|countdown/, 'BallDrop'], [/confetti|celebrat/, 'ConfettiCannon'], [/ocean wave|surf|beach|tide/, 'OceanWaves'], [/thunder|lightning|storm/, 'Thunderstorm'],
    [/firefl/, 'Fireflies'], [/biolum|glowing (sea|water)|plankton/, 'Bioluminescence'], [/vu|meter|level/, 'VUMeters'], [/oscillo|waveform/, 'Oscilloscope'],
    [/mountain|spectrum|frequenc/, 'FrequencyMountains'], [/beat count|1 2 3 4|counter/, 'BeatCounter'], [/wormhole|tunnel/, 'Wormhole'], [/hyper ?jump|light ?speed/, 'Hyperjump'],
    [/planet|saturn|ringed/, 'PlanetRise'], [/jelly ?fish|jellies/, 'JellyfishSwarm'], [/dragon/, 'DragonFlight'], [/moir|interference/, 'Moire'],
    [/infinite|droste|zoom/, 'InfiniteZoom'], [/op.?art|checker|illusion/, 'OpArtChecker'], [/hypno|spiral/, 'SpiralHypnosis'],
    [/lava|magma|molten|volcan/, 'LavaFlow'], [/lamp|blob(s)? float/, 'LavaLamp'], [/blob/, 'BlobParty'], [/sun ?rise|sunset|day|dusk|dawn/, 'Sunrise'],
    [/sunshine|sunny|\bsun\b/, 'SunshineWave'], [/cloud|sky/, 'SkyClouds'], [/warp|hyperspace|space travel/, 'WarpSpeed'], [/black ?hole|orbit/, 'BlackHole'],
    [/space|star|galaxy|planet/, 'SpaceWorld'], [/aurora|northern lights/, 'Aurora'], [/kaleido/, 'Kaleidoscope'], [/forest|fair(y|ies)|firefl/, 'ForestWorld'],
    [/ocean|sea|underwater|fish|jelly/, 'UnderwaterWorld'], [/camp ?fire|fire ?place|bonfire|fire|flame/, 'Campfire'], [/lsd|trip|melt|acid|psychedel/, 'LiquidMelt'], [/sprite|dancer|fairy/, 'SoloSprite'],
    [/matrix|code|digital rain/, 'MatrixRain'], [/\brain\b/, 'Rain'], [/laser/, 'LaserBlast'], [/shock ?wave|pulse|boom/, 'Shockwave'],
    [/firework/, 'Fireworks'], [/eye/, 'Eyeball'], [/centipede|snake/, 'Centipedes'], [/scanner|knight rider|kitt/, 'Scanner'],
    [/fountain/, 'Fountain'], [/rising|ember|float(ing)? up|up(ward)?/, 'Updraft'], [/dna|helix/, 'DNA'], [/octopus|tentacle/, 'Octopus'],
    [/spiro|flower|rose/, 'Spirograph'], [/swirl|spin/, 'Swirl'], [/wave/, 'Waves'], [/plasma|trippy|hippie/, 'Hiphotic'], [/life|cells/, 'GameOfLife'],
  ];
  const COLOR_WORDS = ['red', 'orange', 'gold', 'yellow', 'lime', 'green', 'teal', 'cyan', 'blue', 'navy', 'purple', 'violet', 'pink', 'magenta', 'white', 'warm', 'ice'];
  function describe(text) {
    const catalog = GB.catalog, t = text.toLowerCase(), effs = [];
    WORDS.forEach(([re, e]) => { if (re.test(t) && !effs.includes(e) && catalog && catalog.effects[e]) effs.push(e); });
    if (!effs.length) effs.push('LavaLamp');
    let colors = COLOR_WORDS.filter(c => new RegExp('\\b' + c + '\\b').test(t));
    const rainbow = /rainbow/.test(t);
    const slow = /slow|chill|calm|relax|dream|sleep|soft/.test(t), fast = /fast|crazy|party|hype|wild|intense/.test(t);
    if (effs[0] === 'LavaFlow') {
      if (rainbow) effs[0] = 'LavaRainbow';
      else if (colors.length === 1) { const m = {red: 'LavaRed', orange: 'LavaOrange', gold: 'LavaGold', yellow: 'LavaGold', green: 'LavaGreen', lime: 'LavaGreen', teal: 'LavaTeal', cyan: 'LavaTeal', blue: 'LavaBlue', navy: 'LavaBlue', purple: 'LavaPurple', violet: 'LavaPurple', pink: 'LavaPink', magenta: 'LavaPink', white: 'LavaWhite', ice: 'LavaWhite'}; effs[0] = m[colors[0]] || 'LavaFlow'; }
    }
    if (rainbow && !colors.length) colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    const base = {seconds: 600, effect: effs[0], fade: 3,
      trail: /trail|flow|smear|silk/.test(t) || slow ? 0.8 : 0.4, sparkle: /sparkl|glitter|twinkl/.test(t) ? 0.8 : 0.2,
      transform: /kaleido/.test(t) ? 'radial' : /mirror/.test(t) ? 'mirror_x' : 'none'};
    if (colors.length) base.colors = colors;
    if (effs.length > 1) {
      base.layers = effs.slice(0, 3).map((e, i) => i ? {effect: e, mix: 'screen'} : {effect: e});
      delete base.effect;
    }
    return {name: text.slice(0, 40), loop: true, bpm: slow ? 75 : fast ? 128 : 100, energy: slow ? 0.3 : fast ? 0.85 : 0.55, segments: [base]};
  }
  GB.describeScene = describe;
  GB.panel('scenes', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    el.innerHTML = `
      <div class="ph"><span>Describe a scene</span></div>
      <textarea id="shDesc" placeholder="e.g. slow purple lava with sparkles and a rainbow sprite" aria-label="Describe a scene"></textarea>
      <button class="btn c wide" id="shDescGo" style="--c:var(--pink)"></button>
      <p class="note">Picks effects and colors from your words. For anything wild, ask Claude in chat. It can build any scene and even write new effects.</p>`;
    GB.lbl($('shDescGo'), 'play', 'Play it');
    $('shDescGo').onclick = async () => {
      const t = $('shDesc').value.trim(); if (!t) return GB.toast('Type a scene first');
      const sc = describe(t); const r = await GB.post('/api/scene', sc);
      if (r) GB.toast('▶ ' + (sc.segments[0].effect || sc.segments[0].layers.map(l => l.effect).join(' + ')));
    };
  });

  // ------------------------------------------------------------------ status sync
  function syncSel() {
    const s = S();
    document.querySelectorAll('#shLooks .chip').forEach(c => c.classList.toggle('on', c.dataset.v === s.look));
    document.querySelectorAll('#shEffs .item').forEach(c => {
      const on = c.dataset.v === s.locked; if (c.classList.contains('on') === on) return;
      c.classList.toggle('on', on);
      const pin = c.querySelector('svg'); if (on && !pin) c.insertAdjacentHTML('beforeend', GB.svg('pin')); if (!on && pin) pin.remove();
    });
  }
  GB.on('catalog', cat => { renderLooks(cat); renderEffects(); });
  GB.on('status', s => {
    // keys
    const on = s.power !== false, bp = $('shPower');
    if (bp) {
      setLbl(bp, 'power', on ? 'Power on' : 'Lights off'); bp.classList.toggle('sh-dead', !on);
      const tog = (b, v, ic, name) => { b.classList.toggle('on', v); b.classList.toggle('c', v); b.classList.toggle('sh-off', !v); setLbl(b, ic, name + (v ? ' on' : ' off')); };
      tog($('shShuffle'), !!s.shuffle, 'shuffle', 'Shuffle');
      tog($('shChars'), !!s.characters, 'artist', 'Characters');
      { const eo = s.cameos !== false; tog($('shEye'), eo, eo ? 'eye' : 'eyeOff', 'Eyeball'); }
      $('shState').textContent = !on ? 'LIGHTS OFF' : (s.locked ? 'LOCKED' : s.held_look ? (s.pinned ? 'PINNED' : 'HELD') : 'FLOWING');
      $('shState').style.color = on ? '' : 'var(--red)';
    }
    // levels
    if ($('shBright')) {
      if (!busy('shBright') && s.brightness != null) { $('shBright').value = s.brightness; GB.paintRange($('shBright')); $('shBrightV').textContent = s.brightness + '%'; }
      if (!busy('shBlend') && s.blend != null) { $('shBlend').value = Math.round(s.blend * 10); GB.paintRange($('shBlend')); $('shBlendV').textContent = blendTxt(+$('shBlend').value); }
      if (!busy('shDelay') && s.delay != null) { $('shDelay').value = s.delay; GB.paintRange($('shDelay')); $('shDelayV').textContent = delayTxt(s.delay) + (s.delay_auto && s.delay ? ' auto' : ''); }
      markSeg('[data-sp]', 'sp', s.sparkles || 'auto');
      markSeg('[data-pace]', 'pace', s.pace || 'normal');
    }
    if ($('shMood')) markSeg('[data-mood]', 'mood', s.mood || 'auto');
    // looks, effects, scenes
    if ($('shLookNow')) $('shLookNow').textContent = s.look ? ((s.pinned ? '📌 ' : '') + s.look) : '';
    syncSel();
    const sn = s.scene && s.scene.name;
    document.querySelectorAll('#shPresets .tile').forEach(t => t.classList.toggle('on', !!sn && t.dataset.v === sn));
    if ($('shSceneNow')) $('shSceneNow').textContent = sn ? '▶ ' + sn : '';
  });
})();
