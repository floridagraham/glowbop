/* 🚨 OVERRIDE page (GlowBop Pro DJ): override keys + 🎙️ interlude. Talks to GET/POST /api/override (overrides.py).
   Override keys take the whole wall at once, whatever is playing, and hand it back when let go.
   HOLD keys: on while a finger (or a laptop key) is down. The app re-sends every 0.4 s; the engine lets go by itself 1.2 s
   after the last one, so a dropped connection can't leave the wall stuck. LATCH keys: tap on, tap off.
   Every finger drives its own key, so several can be held at once; the highest priority wins:
   BLACKOUT > WHITE > STROBE > LOGO > HOUSE > colour keys > CROWD (STROBE flashes in a held colour key's colour).
   Laptop keyboard: 1 to 9 = the keys in grid order (on any page, not while typing), 0 = release all, I = interlude.
   EDIT KEYS: tap a key to set HOLD or LATCH, its fade, its colour and its name (saved in overrides.json on the laptop). */
(function () {
  'use strict';
  const {$, esc} = GB;
  const ICON = {black: '⬛', white: '⚪', strobe: '⚡', disco: '🪩', house: '💡', color: '●', crowd: '🔦', logo: '🔤'};
  const FADE_NAME = {0: 'SNAP', 0.25: '0.25 S', 1: '1 S'};
  const SWATCHES = ['#ff1a1a', '#ff7a1a', '#ffd21a', '#2bff5a', '#1ad9ff', '#1a4dff', '#8a2bff', '#ff2fa0', '#ffb46b', '#ffffff'];
  let K = [];                          // key configs from the engine
  const local = {};                    // id -> {pid, keep}: keys held from THIS device
  const optimistic = {};               // id -> {on, until}: latch taps before the engine confirms
  let edit = false, IL = null, ovPro = true;

  GB.css(`
  #pg-ops { --c:#e9e6ff; }
  .ov-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; user-select:none; -webkit-user-select:none; }
  .ov-key { appearance:none; border:0; position:relative; border-radius:0 16px 0 16px; background:var(--dark); color:var(--text); min-height:96px; padding:18px 6px 12px;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; touch-action:none; -webkit-touch-callout:none; cursor:pointer;
    font:700 calc(15px * var(--fs, 1))/1.05 var(--cond); letter-spacing:1px; text-transform:uppercase; text-align:center; min-width:0; transition:background .08s, box-shadow .08s; }
  .ov-key .em { font-size:calc(28px * var(--fs, 1)); line-height:1; }
  .ov-key .em.dot { width:calc(26px * var(--fs, 1)); height:calc(26px * var(--fs, 1)); border-radius:50%; background:var(--kc); box-shadow:0 0 14px var(--kc); font-size:0; }
  .ov-key .lb { max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:clip; letter-spacing:.5px; font-size:min(1em, calc(15px * var(--fs, 1))); }
  #ovGrid { container-type:inline-size; } @container (max-width: 420px) { .ov-key .lb { font-size:calc(12px * var(--fs, 1)); letter-spacing:0; } }
  .ov-key .sc { position:absolute; top:6px; left:8px; font:calc(11px * var(--fs, 1))/1 var(--mono); color:var(--dim); border:1px solid var(--line); border-radius:5px; padding:2px 4px; }
  .ov-key .md { position:absolute; top:6px; right:8px; font:700 calc(10px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; color:var(--dim); }
  .ov-key .md.latch { color:var(--gold); }
  .ov-key .fdt { position:absolute; bottom:5px; right:8px; font:calc(10px * var(--fs, 1))/1 var(--mono); color:var(--dim); }
  .ov-key.on { background:var(--kc); color:#000; box-shadow:0 0 0 3px #fff inset, 0 0 30px var(--kc); }
  .ov-key.on .sc, .ov-key.on .md, .ov-key.on .fdt { color:#000; border-color:#0006; }
  .ov-key.on .em.dot { background:#000; box-shadow:none; }
  .ov-key[data-kind=black].on { background:#000; color:#fff; box-shadow:0 0 0 3px var(--red) inset, 0 0 30px var(--red); }
  .ov-key[data-kind=black].on .sc, .ov-key[data-kind=black].on .md, .ov-key[data-kind=black].on .fdt { color:#fff; border-color:#fff6; }
  .ov-key.latched::after { content:'LATCHED'; position:absolute; left:50%; bottom:-1px; transform:translate(-50%, 50%); background:var(--gold); color:#000; border-radius:999px; padding:3px 8px;
    font:700 calc(10px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; white-space:nowrap; box-shadow:0 0 12px var(--gold); }
  .ov-grid.edit .ov-key { box-shadow:0 0 0 2px var(--lav) inset; animation:ovWig 1.6s ease-in-out infinite; }
  @keyframes ovWig { 50% { box-shadow:0 0 0 2px var(--lav) inset, 0 0 14px -2px var(--lav); } }
  .ov-top { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .ov-top .btn { flex:0 0 auto; }
  .ov-top .grow { flex:1 1 auto; min-width:0; }
  #ovRelease { --c:var(--red); }
  #ovRelease:not(:disabled) { background:var(--red); color:#000; box-shadow:0 0 18px -2px var(--red); }
  #ovRelease:disabled { opacity:.45; }
  #ovEdit.on { background:var(--lav); color:#000; }
  .ov-sheet .row { display:flex; gap:6px; flex-wrap:wrap; }
  .ov-sheet .row .btn { flex:1 1 0; min-width:0; }
  .ov-sw { appearance:none; border:0; width:40px; height:40px; border-radius:50%; background:var(--sw); box-shadow:0 0 0 2px #fff3; cursor:pointer; }
  .ov-sw.on { box-shadow:0 0 0 3px #fff, 0 0 14px var(--sw); }
  .ov-sheet input[type=color] { width:52px; height:40px; padding:0; border:2px solid var(--dark); border-radius:10px; background:none; }
  #ilBig { min-height:76px; font-size:calc(22px * var(--fs, 1)); letter-spacing:2px; }
  #ilBig.on { background:var(--lav); color:#000; box-shadow:0 0 30px -4px var(--lav); }
  .il-grid { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
  .il-grid .tile { min-height:64px; }
  .il-row { display:flex; gap:8px; align-items:center; }
  .il-row input, .il-row select { flex:1; min-width:0; }
  .il-state { font:calc(13px * var(--fs, 1))/1.3 var(--mono); color:var(--lav); }
  @media (min-width: 700px) {
    .ov-grid { gap:10px; }
    .ov-key { min-height:118px; font-size:calc(17px * var(--fs, 1)); }
    .ov-key .em { font-size:calc(34px * var(--fs, 1)); }
    .il-grid { grid-template-columns:repeat(4, minmax(0, 1fr)); }
  }
  @media (min-width: 1000px) and (min-aspect-ratio: 1/1) { .il-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
  .mov { appearance:none; border:0; flex:0 0 auto; display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:0 12px; border-radius:999px; cursor:pointer;
    background:var(--red); color:#000; font:700 calc(13px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; box-shadow:0 0 18px -2px var(--red); animation:movPulse 1.2s ease-in-out infinite; }
  .mov b { background:#000; color:var(--red); border-radius:999px; padding:3px 7px; font-size:calc(12px * var(--fs, 1)); }
  @keyframes movPulse { 50% { box-shadow:0 0 30px 2px var(--red); } }
  @media (prefers-reduced-motion: reduce) { .mov, .ov-grid.edit .ov-key { animation:none; } }
  @media (max-width: 699px) {
    .mov { position:absolute; top:-14px; right:14px; min-height:30px; padding:0 10px; z-index:3; }
    .mov .w2 { display:none; }
    .mov:not([hidden]) ~ .mfad { right:150px; }
    .ov-top .grow { display:none; }
    .ov-top .btn { flex:1 1 0; min-width:0; padding:0 8px; }
    #rail button[data-p=ops] { font-size:calc(12px * min(var(--fs, 1), 1.08)); letter-spacing:0; padding-right:5px; }
  }
  `);

  // ------------------------------------------------------------------ talking to the engine
  let warned = 0;
  async function opost(b, quiet) {
    try {
      const r = await fetch('/api/override', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(b)});
      const j = await r.json();
      if (r.status === 402) { if (Date.now() - warned > 3000) { warned = Date.now(); GB.toast('🔒 ' + (j.message || 'This is a GlowBop Pro DJ feature.')); GB.sfx('err'); } GB.setPro(false); stopAll(); return null; }
      if (!r.ok || j.error) { if (!quiet) { GB.toast('⚠️ ' + (j.error || r.status)); GB.sfx('err'); } return null; }
      sync(j); return j;
    } catch (e) { if (!quiet) GB.toast('⚠️ Not connected'); return null; }
  }
  const keyOf = id => K.find(k => k.id === id);

  // ------------------------------------------------------------------ pressing keys
  function press(id, src) {                      // src: pointer id or 'kb'
    const k = keyOf(id); if (!k || GB.pro === false) return;
    if (edit && src !== 'kb') return openEdit(k);
    if (k.mode === 'latch') {
      const on = !isOn(k); optimistic[id] = {on, until: Date.now() + 1500}; paintKeys();
      GB.sfx(on ? 'on' : 'tap'); opost({key: id, on}); return;
    }
    if (local[id]) return;
    local[id] = {pid: src, keep: setInterval(() => opost({key: id, on: true}, true), 400)};
    paintKeys(); opost({key: id, on: true});
  }
  function lift(id, src) {
    const l = local[id]; if (!l || (src !== undefined && l.pid !== src)) return;
    clearInterval(l.keep); delete local[id]; paintKeys(); opost({key: id, on: false}, true);
  }
  function stopAll() { Object.keys(local).forEach(id => lift(id)); }
  function releaseAll() {
    stopAll(); K.forEach(k => { optimistic[k.id] = {on: false, until: Date.now() + 1500}; }); paintKeys();
    opost({release: true}).then(r => { if (r) { GB.sfx('ok'); GB.toast('✅ Overrides released: the show is back'); } });
  }
  GB.overrideRelease = releaseAll;
  const isOn = k => { const o = optimistic[k.id]; if (o && Date.now() < o.until) return o.on; return !!local[k.id] || !!k.on; };

  // ------------------------------------------------------------------ the key grid
  function keyHTML(k, i) {
    const dot = k.kind === 'color';
    return `<span class="sc">${i + 1}</span><span class="md ${k.mode}">${k.mode === 'latch' ? 'LATCH' : 'HOLD'}</span>
      <span class="em${dot ? ' dot' : ''}">${dot ? '' : ICON[k.kind] || '●'}</span><span class="lb">${esc(k.label)}</span>${k.fade ? `<span class="fdt">${FADE_NAME[k.fade] || k.fade + ' S'}</span>` : ''}`;
  }
  const KC = k => k.kind === 'black' ? '#000' : k.kind === 'white' ? '#ffffff' : k.kind === 'strobe' ? '#f4f2ff' : k.kind === 'logo' ? 'var(--gold)' : k.kind === 'disco' ? 'var(--orchid)' : k.kind === 'crowd' ? 'var(--cyan)' : (k.color || '#fff');
  function buildKeys() {
    const g = $('ovGrid'); if (!g) return;
    const sig = JSON.stringify(K.map(k => [k.id, k.label, k.mode, k.fade, k.color]));
    if (g._sig === sig) return paintKeys(); g._sig = sig; g.innerHTML = '';
    K.forEach((k, i) => {
      const b = document.createElement('button'); b.className = 'ov-key'; b.dataset.id = k.id; b.dataset.kind = k.kind; b.style.setProperty('--kc', KC(k));
      b.setAttribute('aria-label', `${k.label}, ${k.mode === 'latch' ? 'tap on, tap off' : 'hold'}, key ${i + 1}`);
      b.innerHTML = keyHTML(k, i);
      b.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) {} press(k.id, e.pointerId); });
      const up = e => lift(k.id, e.pointerId);
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
      b.addEventListener('contextmenu', e => e.preventDefault());
      b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(k.id, 'kbf'); } });
      b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') lift(k.id, 'kbf'); });
      g.appendChild(b);
    });
    paintKeys();
  }
  function paintKeys() {
    document.querySelectorAll('#ovGrid .ov-key').forEach(b => {
      const k = keyOf(b.dataset.id); if (!k) return; const on = isOn(k);
      b.classList.toggle('on', on); b.classList.toggle('latched', on && k.mode === 'latch'); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const n = K.filter(isOn).length, r = $('ovR');
    if (r) { r.textContent = n ? n + ' ON' : 'NOTHING ON'; r.style.color = n ? 'var(--red)' : ''; }
    const rel = $('ovRelease'); if (rel) rel.disabled = !n;
  }

  // ------------------------------------------------------------------ edit one key (sheet)
  function openEdit(k) {
    const s = document.createElement('div'); s.className = 'sheet ov-sheet';
    const hasCol = k.kind === 'color' || k.kind === 'house';
    let cfg = {mode: k.mode, fade: k.fade, color: k.color, label: k.label};
    s.innerHTML = `<div><div class="ph" style="--c:var(--lav)"><span>Key ${K.indexOf(k) + 1}: ${esc(k.label)}</span></div>
      <div class="sub">How it works</div>
      <div class="row" data-g="mode"><button class="btn" data-v="hold">✋ Hold</button><button class="btn" data-v="latch">📌 Latch</button></div>
      <p class="note" id="ovMNote"></p>
      <div class="sub">Fade in and out</div>
      <div class="row" data-g="fade"><button class="btn" data-v="0">Snap</button><button class="btn" data-v="0.25">0.25 s</button><button class="btn" data-v="1">1 s</button></div>
      ${hasCol ? `<div class="sub">Colour</div><div class="row" style="align-items:center">${SWATCHES.map(c => `<button class="ov-sw" data-sw="${c}" style="--sw:${c}" aria-label="Colour ${c}"></button>`).join('')}<input type="color" id="ovCol" aria-label="Pick any colour"></div>` : ''}
      <label class="field">Name on the key<input type="text" id="ovLab" maxlength="12" autocomplete="off"></label>
      <div class="row"><button class="btn c" id="ovSave" style="--c:var(--lav)">Save</button><button class="btn ghost" id="ovCancel">Cancel</button></div></div>`;
    const paint = () => {
      s.querySelectorAll('[data-g] .btn').forEach(b => { const g = b.parentNode.dataset.g; b.classList.toggle('on', String(cfg[g]) === b.dataset.v); b.style.setProperty('--c', 'var(--lav)'); });
      s.querySelectorAll('.ov-sw').forEach(b => b.classList.toggle('on', (cfg.color || '').toLowerCase() === b.dataset.sw));
      if ($('ovCol') && cfg.color) $('ovCol').value = cfg.color;
      s.querySelector('#ovMNote').textContent = cfg.mode === 'latch' ? 'Tap on, tap off. It stays on until you tap it again or hit Release all.' : 'On while your finger is down. Let go and the show comes back.';
    };
    s.querySelectorAll('[data-g] .btn').forEach(b => b.onclick = () => { const g = b.parentNode.dataset.g; cfg[g] = g === 'fade' ? Number(b.dataset.v) : b.dataset.v; paint(); });
    s.querySelectorAll('.ov-sw').forEach(b => b.onclick = () => { cfg.color = b.dataset.sw; paint(); });
    document.body.appendChild(s);
    if ($('ovCol')) $('ovCol').oninput = e => { cfg.color = e.target.value; paint(); };
    const lab = s.querySelector('#ovLab'); lab.value = k.label;
    s.querySelector('#ovCancel').onclick = () => s.remove();
    s.onclick = e => { if (e.target === s) s.remove(); };
    s.querySelector('#ovSave').onclick = async () => {
      cfg.label = lab.value.trim() || k.label; const body = {mode: cfg.mode, fade: cfg.fade, label: cfg.label}; if (hasCol) body.color = cfg.color;
      if (await opost({config: {[k.id]: body}})) { GB.sfx('ok'); GB.toast('💾 ' + cfg.label.toUpperCase() + ' saved'); s.remove(); }
    };
    paint();
  }

  // ------------------------------------------------------------------ laptop keyboard: 1..9, 0 = release all, I = interlude
  const typing = e => { const a = e.target; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable || (a.closest && a.closest('[role=slider], .sheet'))); };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e) || GB.pro !== true || !K.length) return;
    const m = /^Digit([0-9])$/.exec(e.code || '') || /^Numpad([0-9])$/.exec(e.code || '');
    if (m) {
      e.preventDefault(); if (e.repeat) return;
      const n = +m[1]; if (n === 0) return releaseAll();
      const k = K[n - 1]; if (k) press(k.id, 'kb');
      return;
    }
    if ((e.key === 'i' || e.key === 'I') && !e.repeat) { e.preventDefault(); toggleIL(); }
  });
  document.addEventListener('keyup', e => {
    const m = /^Digit([1-9])$/.exec(e.code || '') || /^Numpad([1-9])$/.exec(e.code || ''); if (!m) return;
    const k = K[+m[1] - 1]; if (k) lift(k.id, 'kb');
  });
  addEventListener('blur', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });

  // ------------------------------------------------------------------ panels
  GB.panel('ops', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)'); el.id = 'ovPanel';
    el.innerHTML = `<div class="ph"><span>Override keys</span><span class="r" id="ovR">NOTHING ON</span></div>
      <div class="ov-top"><button class="btn sm" id="ovRelease" disabled>✋ Release all</button><span class="grow"></span><button class="btn sm" id="ovEdit" style="--c:var(--lav)">✏️ Edit keys</button></div>
      <div class="ov-grid" id="ovGrid"><p class="note">Loading keys…</p></div>
      <p class="note" id="ovNote">Hold a key and it takes over the whole wall, whatever is playing. Let go and the show comes back. LATCH keys stay on until you tap them again. Several at once: BLACKOUT wins, then WHITE, STROBE, DISCO, HOUSE, the colours, CROWD. On the laptop, keys 1 to 8 work too (0 releases everything).</p>`;
    $('ovRelease').onclick = releaseAll;
    $('ovEdit').onclick = () => { edit = !edit; $('ovEdit').classList.toggle('on', edit); $('ovEdit').textContent = edit ? '✅ Done' : '✏️ Edit keys'; $('ovGrid').classList.toggle('edit', edit);
      if (edit) GB.toast('✏️ Tap a key to change it'); };
    GB.proGate(el, 'Override keys', {pitch: 'Big panic buttons that take over the whole wall in one touch: blackout, full white, strobe, house lights, your colours, a disco ball drop and a crowd sweep. Hold or latch, with smooth fades and laptop shortcuts.'});
  });

  const IL_LOOKS = [['breathe', '🌬️', 'Breathing'], ['text', '🔤', 'Words'], ['glow', '🕯️', 'Warm glow'], ['look', '🎨', 'A look, slowed']];
  const AUTO = [[0, 'Off'], [5, '5 s'], [10, '10 s'], [20, '20 s'], [45, '45 s']];
  const RET = [['none', 'Fade'], ['flash', '+ Flash'], ['drop', '+ Drop']];
  async function toggleIL() {
    if (GB.pro !== true) return;
    const on = !(IL && IL.on);
    const r = await opost({interlude: on}); if (r) { GB.sfx(on ? 'on' : 'ok'); GB.toast(on ? '🎙️ Interlude: the wall goes calm' : '🎵 Back to the show'); }
  }
  GB.interludeToggle = toggleIL;
  const ilcfg = async b => { if (await opost({interlude_cfg: b})) GB.sfx('tap'); };
  GB.panel('ops', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)'); el.id = 'ilPanel';
    el.innerHTML = `<div class="ph"><span>Interlude</span><span class="r" id="ilR">OFF</span></div>
      <button class="btn c wide" id="ilBig" style="--c:var(--lav)">🎙️ Start interlude</button>
      <p class="il-state" id="ilState"></p>
      <div class="sub">Interlude look</div>
      <div class="tiles il-grid" id="ilLooks">${IL_LOOKS.map(([v, em, n]) => `<button class="tile" data-v="${v}" style="--c:var(--lav)"><span class="em">${em}</span>${n}</button>`).join('')}</div>
      <div class="il-row" id="ilTextRow"><input type="text" id="ilText" maxlength="40" placeholder="BE RIGHT BACK" autocomplete="off" aria-label="Interlude words"><button class="btn c" id="ilTextGo" style="--c:var(--lav)">Set</button></div>
      <div class="il-row" id="ilLookRow" hidden><select id="ilLook" aria-label="Look for the interlude"></select></div>
      <div class="sub">Coming back</div>
      <div class="seg" id="ilRet">${RET.map(([v, n]) => `<button class="btn" data-v="${v}" style="--c:var(--lav)">${n}</button>`).join('')}</div>
      <div class="sub">Auto-interlude when the music stops</div>
      <div class="seg" id="ilAuto">${AUTO.map(([v, n]) => `<button class="btn" data-v="${v}" style="--c:var(--lav)">${n}</button>`).join('')}</div>
      <p class="note">For talking breaks, speeches and changeovers. The wall goes calm and stops following the music, so a mic or silence can't make it twitch. Song Show cues wait, then pick up where the song is. With auto on, silence starts an interlude and the music coming back ends it. Laptop: press I.</p>`;
    $('ilBig').onclick = toggleIL;
    el.querySelectorAll('#ilLooks .tile').forEach(b => b.onclick = () => ilcfg({look: b.dataset.v}));
    const setText = () => ilcfg({text: $('ilText').value.trim() || 'BE RIGHT BACK'}).then(() => GB.toast('🔤 Interlude words saved'));
    $('ilTextGo').onclick = setText; $('ilText').addEventListener('keydown', e => { if (e.key === 'Enter') setText(); });
    $('ilLook').onchange = () => ilcfg({look: 'look', look_name: $('ilLook').value});
    el.querySelectorAll('#ilRet .btn').forEach(b => b.onclick = () => ilcfg({ret: b.dataset.v}));
    el.querySelectorAll('#ilAuto .btn').forEach(b => b.onclick = () => ilcfg({auto: +b.dataset.v}));
    GB.proGate(el, 'Interlude', {pitch: 'One tap for talking breaks, speeches and band changeovers: the wall drifts into a calm, tasteful glow that ignores the mic, then fades back into the show (with a flash or a drop if you like). Can start by itself when the music stops.'});
  });
  GB.on('catalog', cat => {
    const s = $('ilLook'); if (!s || !cat || !cat.looks) return;
    s.innerHTML = '<option value="">Pick a look…</option>' + Object.keys(cat.looks).map(n => `<option>${esc(n)}</option>`).join('');
    if (IL && IL.look_name) s.value = IL.look_name;
  });
  function paintIL() {
    if (!IL || !$('ilBig')) return;
    const b = $('ilBig'); b.classList.toggle('on', !!IL.on); b.textContent = IL.on ? '🎵 Back to the show' : '🎙️ Start interlude';
    $('ilR').textContent = IL.on ? (IL.auto_started ? 'ON · MUSIC STOPPED' : 'ON') : (IL.auto ? 'AUTO AFTER ' + IL.auto + ' S' : 'OFF'); $('ilR').style.color = IL.on ? 'var(--lav)' : '';
    $('ilState').textContent = IL.on ? 'The wall is in interlude' + (IL.since ? ' since ' + new Date(IL.since * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : '') + '. Tap Back to the show when you are ready.' : '';
    $('ilState').hidden = !IL.on;
    document.querySelectorAll('#ilLooks .tile').forEach(t => t.classList.toggle('on', t.dataset.v === IL.look));
    document.querySelectorAll('#ilRet .btn').forEach(t => t.classList.toggle('on', t.dataset.v === IL.ret));
    document.querySelectorAll('#ilAuto .btn').forEach(t => t.classList.toggle('on', +t.dataset.v === +IL.auto));
    $('ilTextRow').hidden = IL.look !== 'text'; $('ilLookRow').hidden = IL.look !== 'look';
    const ti = $('ilText'); if (document.activeElement !== ti) ti.value = IL.text || '';
    const ls = $('ilLook'); if (ls && document.activeElement !== ls && IL.look_name) ls.value = IL.look_name;
  }

  // ------------------------------------------------------------------ follow the engine (every phone, iPad and the laptop)
  function sync(o) {
    if (!o || !o.keys) return;
    ovPro = o.pro !== false; K = o.keys; IL = o.interlude || null;
    buildKeys(); paintIL();
  }
  GB.on('status', s => sync(s.override));
  GB.on('page', async id => { if (id !== 'ops' || GB.pro === false) return; try { sync(await GB.get('/api/override')); } catch (e) {} });
  GB.on('ready', async () => { try { sync(await GB.get('/api/override')); } catch (e) {} });
  GB.on('pro', v => { if (!v) stopAll(); });
})();
