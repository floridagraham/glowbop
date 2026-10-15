/* 🔁 Pad Recorder, was "Loop banks" (LIVE BOARD page, GlowBop Pro DJ): a sampler for light. Talks to GET/POST /api/loops (loops.py on the laptop).
   4 banks (A-D, the columns) x 4 slots. Tap a slot: it starts on the next bar and loops on the beat. Tap again: it stops at
   the end of the bar (or at once: the STOP setting, or Shift+click on the laptop). One slot per bank plays at a time.
   RECORD: tap Record, pick the length, tap a slot. It starts on the next bar, catches your hit pads (right above) on the
   beat grid, and loops straight away. Record into a playing slot to overdub one pass.
   EDIT: tap Edit, then a slot: name, length, a 16-step grid per bar (tap to add or remove a hit), nudge, copy, clear.
   The mode bar shows a LOOPS chip while any loop runs; one tap stops them all. Laptop: L stops all loops. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const HITS = [['drop', 'burst', 'Drop', 'var(--pink)'], ['strobe', 'bolt', 'Strobe', '#ffffff'], ['flash', 'sun', 'Flash', 'var(--gold)'],     // icons: GB.svg names
                ['fire', 'fire', 'Fire', 'var(--orange)'], ['confetti', 'confetti', 'Confetti', 'var(--lav)'], ['blackout', 'dark', 'Blackout', 'var(--peri)'],
                ['sweep', 'sweep', 'Sweep', '#b6ff3d'], ['shockwave', 'shockwave', 'Shockwave', 'var(--violet)'], ['colorbomb', 'colorbomb', 'Color bomb', 'var(--amber)'],
                ['lightning', 'lightning', 'Lightning', '#8fb4ff'], ['countdown', 'count321', '3-2-1', 'var(--orchid)'], ['heartbeat', 'heart', 'Heartbeat', 'var(--red)']];
  const BANKC = {A: 'var(--pink)', B: 'var(--cyan)', C: 'var(--lime)', D: 'var(--amber)'};
  const LANE_EM = {look: 'palette', color: 'rainbow', text: 'text', effect: 'sparkle'};
  let L = null, base = {pos: 0, bpm: 120, t: 0}, recMode = false, editMode = false, raf = 0, pollT = null, lpPro = true;
  const recBars = () => +GB.store.get('gb_lp_bars', '2') || 2;

  GB.css(`
  #lpPanel { --c:var(--lime); container-type:inline-size; }
  .lp-top { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .lp-top .btn { flex:0 0 auto; }
  .lp-top .grow { flex:1 1 auto; min-width:0; }
  #lpStop:not(:disabled) { background:var(--red); color:#000; box-shadow:0 0 18px -2px var(--red); }
  #lpStop:disabled { opacity:.45; }
  #lpRec.on { background:var(--red); color:#000; box-shadow:0 0 0 2px #fff inset, 0 0 18px -2px var(--red); }
  #lpEdit.on { background:var(--lav); color:#000; }
  .lp-bars { display:flex; gap:4px; }
  .lp-bars .btn { min-height:40px; padding:0 12px; font-size:calc(14px * var(--fs, 1)); }
  .lp-beat { display:flex; align-items:center; gap:10px; }
  .lp-dots { display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; flex:1; }
  .lp-dots i { height:8px; border-radius:4px; background:var(--dark); transition:background .06s, box-shadow .06s; }
  .lp-dots i.on { background:var(--lime); box-shadow:0 0 10px var(--lime); }
  .lp-dots i.on.d1 { background:#fff; box-shadow:0 0 12px #fff; }
  .lp-pos { font:calc(13px * var(--fs, 1))/1 var(--mono); color:var(--lime); white-space:nowrap; min-width:calc(92px * var(--fs, 1)); text-align:right; }
  .lp-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:7px; user-select:none; -webkit-user-select:none; }
  .lp-bank { font:800 calc(14px * var(--fs, 1))/1 var(--cond); letter-spacing:2px; text-align:center; color:var(--bc); padding:2px 0 0; border-top:3px solid var(--bc); }
  .lp-slot { appearance:none; border:0; position:relative; min-width:0; min-height:86px; padding:20px 6px 14px; border-radius:0 14px 0 14px; cursor:pointer; overflow:hidden;
    background:color-mix(in srgb, var(--bc) 13%, var(--dark2)); color:var(--text); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--bc) 35%, transparent);
    display:flex; align-items:center; justify-content:center; text-align:center; touch-action:manipulation; -webkit-touch-callout:none;
    font:700 calc(13px * var(--fs, 1))/1.08 var(--cond); letter-spacing:.5px; text-transform:uppercase; transition:background .08s, box-shadow .08s; }
  .lp-slot .nm { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; max-width:100%; }
  .lp-slot .id { position:absolute; top:5px; left:7px; font:calc(10px * var(--fs, 1))/1 var(--mono); color:var(--bc); }
  .lp-slot .ln { position:absolute; top:5px; right:7px; font:700 calc(10px * var(--fs, 1))/1 var(--cond); letter-spacing:.5px; color:var(--dim); }
  .lp-slot .tg { position:absolute; left:0; right:0; bottom:9px; font:700 calc(9.5px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; color:var(--dim); white-space:nowrap; }
  .lp-slot .pr { position:absolute; left:0; bottom:0; height:5px; width:0; background:var(--bc); box-shadow:0 0 10px var(--bc); }
  .lp-slot.empty { background:transparent; box-shadow:inset 0 0 0 1.5px var(--line); color:var(--dim); }
  .lp-slot.empty .nm { font-weight:600; opacity:.7; }
  .lp-slot.playing { background:var(--bc); color:#000; box-shadow:0 0 0 2px #fff inset, 0 0 22px -2px var(--bc); }
  .lp-slot.playing .id, .lp-slot.playing .ln, .lp-slot.playing .tg { color:#000; }
  .lp-slot.playing .pr { background:#000; box-shadow:none; opacity:.55; }
  .lp-slot.stopping { animation:lpBlink .5s steps(2) infinite; }
  .lp-slot.queued { box-shadow:inset 0 0 0 2px var(--bc), 0 0 16px -4px var(--bc); animation:lpBlink .5s steps(2) infinite; }
  .lp-slot.queued .tg, .lp-slot.stopping .tg { color:var(--text); }
  .lp-slot.playing.stopping .tg { color:#000; }
  .lp-slot.armed { box-shadow:inset 0 0 0 3px var(--red); animation:lpBlink .5s steps(2) infinite; }
  .lp-slot.armed .tg { color:var(--red); }
  .lp-slot.recording { background:var(--red); color:#000; box-shadow:0 0 0 2px #fff inset, 0 0 24px var(--red); animation:lpRecP 1s ease-in-out infinite; }
  .lp-slot.recording .id, .lp-slot.recording .ln, .lp-slot.recording .tg { color:#000; }
  .lp-slot.recording .pr { background:#000; box-shadow:none; opacity:.55; }
  @keyframes lpBlink { 50% { filter:brightness(1.5); } }
  @keyframes lpRecP { 50% { box-shadow:0 0 0 2px #fff inset, 0 0 34px 4px var(--red); } }
  #lpPanel.recmode .lp-slot:not(.recording):not(.armed) { box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--red) 70%, transparent); }
  #lpPanel.editmode .lp-slot { box-shadow:inset 0 0 0 2px var(--lav); }
  .lp-foot { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
  .lp-foot > div { flex:1 1 200px; min-width:0; display:flex; flex-direction:column; gap:4px; }
  .lp-foot .seg .btn { min-height:40px; font-size:calc(14px * var(--fs, 1)); }
  .lp-paused { font:calc(13px * var(--fs, 1))/1.3 var(--mono); color:var(--lav); }
  @container (max-width: 420px) { .lp-grid { gap:5px; } .lp-slot { padding:19px 3px 15px; font-size:calc(12px * var(--fs, 1)); letter-spacing:0; }
    .lp-slot .nm { -webkit-line-clamp:3; overflow-wrap:normal; word-break:normal; } .lp-slot .id { left:5px; } .lp-slot .ln { right:5px; } }
  @container (min-width: 560px) { .lp-slot { min-height:100px; font-size:calc(15px * var(--fs, 1)); } .lp-slot .tg { font-size:calc(10.5px * var(--fs, 1)); } }
  @media (prefers-reduced-motion: reduce) { .lp-slot.queued, .lp-slot.armed, .lp-slot.stopping, .lp-slot.recording { animation:none; } }
  /* editor sheet */
  .lp-sheet > div { max-width:760px; }
  .lp-sheet .row { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .lp-sheet .row .btn { flex:1 1 0; min-width:0; padding:0 8px; }
  .lp-tabs { display:flex; gap:4px; flex-wrap:wrap; }
  .lp-tabs .chip { min-height:36px; padding:0 12px; font-size:calc(13px * var(--fs, 1)); }
  .lp-steps { display:grid; grid-template-columns:calc(30px * var(--fs, 1)) repeat(16, minmax(0, 1fr)); gap:2px; user-select:none; -webkit-user-select:none; }
  .lp-steps .rl { display:flex; align-items:center; justify-content:center; font-size:calc(16px * var(--fs, 1)); }
  .lp-steps .rl .ic { width:calc(18px * var(--fs, 1)); height:calc(18px * var(--fs, 1)); filter:drop-shadow(0 0 4px currentColor); }
  .mloop .ic { width:calc(15px * var(--fs, 1)); height:calc(15px * var(--fs, 1)); }
  .mloop.rec .ic { animation:lpRecP2 1s ease-in-out infinite; } @keyframes lpRecP2 { 50% { opacity:.35; } }
  .lp-steps .bn { font:calc(10px * var(--fs, 1))/1 var(--mono); color:var(--dim); text-align:left; padding:0 0 2px 2px; }
  .lp-cell { appearance:none; border:0; padding:0; min-width:0; height:calc(32px * var(--fs, 1)); border-radius:4px; background:var(--dark2); cursor:pointer; touch-action:manipulation; }
  .lp-cell.bs { box-shadow:inset 2px 0 0 #ffffff30; }
  .lp-cell.bs.b1 { box-shadow:inset 2px 0 0 #ffffff70; }
  .lp-cell.tail { background:color-mix(in srgb, var(--hc) 30%, var(--dark2)); }
  .lp-cell.on { background:var(--hc); box-shadow:0 0 8px -1px var(--hc); }
  .lp-cell.off { background:repeating-linear-gradient(135deg, var(--hc) 0 3px, transparent 3px 6px); }
  .lp-cell.ph { outline:2px solid #fff; outline-offset:-2px; }
  .lp-other { font-size:calc(13px * var(--fs, 1)); color:var(--dim); display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .lp-other span { background:var(--dark2); border-radius:999px; padding:5px 10px; color:var(--text); }
  @media (max-width: 699px) { .lp-top .grow { display:none; } .lp-top > .btn { flex:1 1 0; min-width:0; padding:0 8px; } }
  /* mode bar: the LOOPS chip (+ phones: every chip in one row on the mode bar's corner) */
  .mloop { appearance:none; border:0; flex:0 0 auto; display:inline-flex; align-items:center; gap:5px; min-height:40px; padding:0 10px; border-radius:999px; cursor:pointer;
    background:color-mix(in srgb, var(--lime) 14%, transparent); box-shadow:inset 0 0 0 2px var(--lime); color:var(--lime); font:700 calc(13px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; }
  .mloop b { background:var(--lime); color:#000; border-radius:999px; min-width:20px; padding:3px 6px; text-align:center; font-size:calc(12px * var(--fs, 1)); }
  .mloop.rec { box-shadow:inset 0 0 0 2px var(--red); color:var(--red); background:color-mix(in srgb, var(--red) 14%, transparent); }
  .mloop.rec b { background:var(--red); }
  .mchips { display:contents; }
  @media (max-width: 699px) {
    .mloop .w { display:none; }
    .mchips { position:absolute; top:-14px; right:14px; display:flex; gap:6px; z-index:3; }
    .mchips > button { position:static !important; right:auto !important; top:auto !important; }
    .mloop { min-height:30px; padding:0 8px; background:#05040a; box-shadow:inset 0 0 0 2px var(--lime), 0 0 12px -2px var(--lime); }
    .mloop.rec { background:#05040a; box-shadow:inset 0 0 0 2px var(--red), 0 0 12px -2px var(--red); }
    .modebar:has(.mchips > button:not([hidden])) { padding-top:20px; }
  }
  `);

  // ------------------------------------------------------------------ talking to the engine
  let warned = 0;
  async function lpost(b, quiet) {
    try {
      const r = await fetch('/api/loops', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(b)});
      const j = await r.json();
      if (r.status === 402) { if (Date.now() - warned > 3000) { warned = Date.now(); GB.toast('🔒 ' + (j.message || 'This is a GlowBop Pro DJ feature.')); GB.sfx('err'); } GB.setPro(false); return null; }
      if (!r.ok || j.error) { if (!quiet) { GB.toast('⚠️ ' + (j.error || r.status)); GB.sfx('err'); } return null; }
      sync(j); return j;
    } catch (e) { if (!quiet) GB.toast('⚠️ Not connected'); return null; }
  }
  GB.loopsStopAll = async () => { const r = await lpost({stop_all: true}); if (r) { GB.sfx('ok'); GB.toast('⏹ Loops stopped'); } return r; };
  const slot = id => L && L.slots.find(s => s.id === id);
  const heardNow = () => { if (!L) return 0; const dt = Math.min(2, (performance.now() - base.t) / 1000); return base.pos + dt * base.bpm / 60 - (L.delay_beats || 0); };

  // ------------------------------------------------------------------ the panel
  GB.panel('board', 30, el => {                                // 🔁 LIVE BOARD: under the fader board and the hit pads
    el.classList.add('box'); el.id = 'lpPanel';
    el.innerHTML = `<div class="ph"><span>Pad Recorder</span><span class="r" id="lpR">NOTHING PLAYING</span></div>
      <div class="lp-top"><button class="btn sm" id="lpStop" disabled><span>${GB.svg('stop')}Stop all</span></button><button class="btn sm" id="lpRec" style="--c:var(--red)">${GB.svg('dot')}<span>Record</span></button>
        <span class="grow"></span><div class="lp-bars" id="lpBars" hidden></div><button class="btn sm" id="lpEdit" style="--c:var(--lav)">${GB.svg('edit')}<span>Edit</span></button></div>
      <div class="lp-beat"><div class="lp-dots" id="lpDots"><i class="d1"></i><i></i><i></i><i></i></div><span class="lp-pos" id="lpPos">BAR 1 · 1</span></div>
      <p class="lp-paused" id="lpPaused" hidden></p>
      <div class="lp-grid" id="lpGrid"><p class="note" style="grid-column:1/-1">Loading loops…</p></div>
      <div class="lp-foot">
        <div><span class="sub">Stop a loop</span><div class="seg" id="lpStopMode"><button class="btn" data-v="bar" style="--c:var(--lime)">End of bar</button><button class="btn" data-v="now" style="--c:var(--lime)">At once</button></div></div>
        <div><span class="sub">Record grid</span><div class="seg" id="lpQuant"><button class="btn" data-v="0.25" style="--c:var(--lime)">1/4 beat</button><button class="btn" data-v="0.125" style="--c:var(--lime)">1/8 beat</button></div></div>
      </div>
      <p class="note" id="lpNote">Tap a loop: it starts on the next bar and plays your moves on the beat, over any song. Tap again to stop it. One loop per bank (column) at a time; the banks play together. Record: tap Record, then a slot, and play the hit pads above. On the laptop, L stops every loop.</p>`;
    $('lpStop').onclick = () => GB.loopsStopAll();
    $('lpRec').onclick = () => {
      if (L && L.rec) { lpost({record: false}).then(r => r && GB.toast('Recording cancelled')); return; }
      recMode = !recMode; if (recMode) editMode = false; paintTop(); if (recMode) GB.toast('🔴 Pick the length, then tap a slot to record into it');
    };
    $('lpEdit').onclick = () => { editMode = !editMode; if (editMode) recMode = false; paintTop(); if (editMode) GB.toast('✏️ Tap a slot to edit it'); };
    $('lpBars').innerHTML = [1, 2, 4, 8].map(n => `<button class="btn" data-v="${n}" style="--c:var(--red)">${n} bar${n > 1 ? 's' : ''}</button>`).join('');
    $('lpBars').querySelectorAll('.btn').forEach(b => b.onclick = () => { GB.store.set('gb_lp_bars', b.dataset.v); paintTop(); GB.sfx('tap'); });
    el.querySelectorAll('#lpStopMode .btn').forEach(b => b.onclick = () => lpost({settings: {stop: b.dataset.v}}).then(r => r && GB.toast(b.dataset.v === 'now' ? 'A tap stops a loop at once' : 'A tap stops a loop at the end of the bar')));
    el.querySelectorAll('#lpQuant .btn').forEach(b => b.onclick = () => lpost({settings: {quant: +b.dataset.v}}).then(r => r && GB.sfx('tap')));
    GB.proGate(el, 'Pad Recorder', {pitch: 'A sampler for your lights: record a phrase of hit pads (1 to 8 bars), then fire it back on the beat, looping over any song. Four banks, built-in starter loops and a step editor.'});
  });

  function paintTop() {
    const p = $('lpPanel'); if (!p) return;
    p.classList.toggle('recmode', recMode && !(L && L.rec)); p.classList.toggle('editmode', editMode);
    const rb = $('lpRec'), rec = L && L.rec;
    rb.classList.toggle('on', recMode || !!rec);
    GB.lbl(rb, rec ? 'close' : 'dot', rec ? 'Cancel rec' : recMode ? 'Pick a slot' : 'Record');
    $('lpBars').hidden = !(recMode && !rec);
    $('lpBars').querySelectorAll('.btn').forEach(b => b.classList.toggle('on', +b.dataset.v === recBars()));
    $('lpEdit').classList.toggle('on', editMode); GB.lbl($('lpEdit'), editMode ? 'check' : 'edit', editMode ? 'Done' : 'Edit');
    $('lpEdit').hidden = recMode && !rec && innerWidth < 700;
  }

  function buildGrid() {
    const g = $('lpGrid'); if (!g || !L) return;
    const sig = JSON.stringify(L.slots.map(s => [s.id, s.name, s.bars, s.count]));
    if (g._sig === sig) return; g._sig = sig; g.innerHTML = '';
    L.banks.forEach(bk => { const h = document.createElement('div'); h.className = 'lp-bank'; h.textContent = 'BANK ' + bk; h.style.setProperty('--bc', BANKC[bk]); g.appendChild(h); });
    for (let n = 1; n <= L.per_bank; n++) L.banks.forEach(bk => {
      const s = slot(bk + n); if (!s) return;
      const b = document.createElement('button'); b.className = 'lp-slot' + (s.count ? '' : ' empty'); b.dataset.id = s.id; b.style.setProperty('--bc', BANKC[bk]);
      b.innerHTML = `<span class="id">${s.id}</span><span class="ln">${s.bars} BAR${s.bars > 1 ? 'S' : ''}</span><span class="nm">${s.count ? esc(s.name || s.id) : '+ empty'}</span><span class="tg"></span><span class="pr"></span>`;
      b.setAttribute('aria-label', `${s.id}: ${s.count ? s.name : 'empty'}, ${s.bars} bar${s.bars > 1 ? 's' : ''}`);
      b.addEventListener('pointerdown', e => { if (e.button > 0) return; e.preventDefault(); b._pd = Date.now(); tapSlot(s.id, e.shiftKey); });   // fire on touch-down
      b.onclick = e => { if (Date.now() - (b._pd || 0) < 800) return; tapSlot(s.id, e.shiftKey); };
      b.addEventListener('contextmenu', e => e.preventDefault());
      g.appendChild(b);
    });
  }

  async function tapSlot(id, now) {
    const s = slot(id); if (!s || GB.pro === false) return;
    if (editMode) return openEdit(id);
    if (recMode && !(L && L.rec)) {
      recMode = false; paintTop();
      const playing = s.state === 'playing' || s.state === 'stopping';
      const r = await lpost(playing ? {record: id} : {record: id, bars: recBars()});
      if (r) { GB.sfx('on'); GB.toast(playing ? '🔴 Overdub: play the pads, one pass on top of ' + (s.name || id) : '🔴 ' + id + ' records on the next bar: play the hit pads'); }
      return;
    }
    if (!s.count && !(L.rec && L.rec.id === id)) { GB.toast('Empty slot: tap Record, then this slot'); GB.sfx('err'); return; }
    const on = s.state === 'idle' || s.state === 'stopping';
    if (on) { s.state = 'queued'; paint(); }
    const r = await lpost(now ? {toggle: id, now: true} : {toggle: id});
    if (r) GB.sfx(on ? 'on' : 'tap');
  }

  // ------------------------------------------------------------------ painting (60 fps from the extrapolated transport)
  function paint() {
    if (!L) return;
    const P = heardNow(), rec = L.rec;
    document.querySelectorAll('#lpGrid .lp-slot').forEach(b => {
      const s = slot(b.dataset.id); if (!s) return;
      const Lb = s.bars * 4, armed = rec && rec.id === s.id && rec.state === 'armed', recing = rec && rec.id === s.id && rec.state !== 'armed';
      const playing = s.state === 'playing' || s.state === 'stopping';
      b.classList.toggle('playing', playing && !recing); b.classList.toggle('queued', s.state === 'queued');
      b.classList.toggle('stopping', s.state === 'stopping'); b.classList.toggle('armed', !!armed); b.classList.toggle('recording', !!recing);
      let tg = '', pr = 0;
      if (armed) tg = 'ARMED · IN ' + Math.max(1, Math.ceil(rec.at - P)) ;
      else if (recing) { const e = rec.end, st = rec.mode === 'overdub' ? e - Lb : rec.S; pr = Math.max(0, Math.min(1, (P - st) / Lb)); tg = (rec.mode === 'overdub' ? 'OVERDUB' : 'REC') + ' ' + Math.min(s.bars, Math.floor((P - st) / 4) + 1) + '/' + s.bars; }
      else if (s.state === 'queued') tg = 'NEXT BAR';
      else if (playing && s.S != null) {
        const rel = Math.max(0, P - s.S); pr = (rel % Lb) / Lb;
        tg = s.state === 'stopping' ? 'STOPS AT BAR END' : (s.bars > 1 ? 'BAR ' + (Math.floor((rel % Lb) / 4) + 1) + '/' + s.bars : 'PLAYING');
      }
      const t = b.querySelector('.tg'); if (t.textContent !== tg) t.textContent = tg;
      b.querySelector('.pr').style.width = (pr * 100).toFixed(1) + '%';
    });
    const bt = ((Math.floor(P) % 4) + 4) % 4;
    document.querySelectorAll('#lpDots i').forEach((d, i) => d.classList.toggle('on', i === bt));
    const pos = $('lpPos'); if (pos) pos.textContent = 'BAR ' + (Math.floor(P / 4) + 1) + ' · ' + (bt + 1) + (L.src === 'tap' ? ' · TAP' : L.live ? '' : ' · FREE');
  }
  function loop() { raf = 0; if (GB.page !== 'board' || document.hidden || !L) return; paint(); raf = requestAnimationFrame(loop); }
  const kick = () => { if (!raf && GB.page === 'board') raf = requestAnimationFrame(loop); };

  function paintHead() {
    if (!L) return;
    const r = $('lpR'), n = L.running.length;
    if (r) { r.textContent = L.rec ? (L.rec.state === 'armed' ? 'ARMED: ' + L.rec.id : (L.rec.mode === 'overdub' ? 'OVERDUB: ' : 'RECORDING: ') + L.rec.id) : n ? n + ' PLAYING' + (innerWidth < 700 ? '' : ' · ' + Math.round(L.bpm) + ' BPM') : (L.queued.length ? 'STARTING ON THE BAR' : 'NOTHING PLAYING');
             r.style.color = L.rec ? 'var(--red)' : n ? 'var(--lime)' : ''; }
    const st = $('lpStop'); if (st) st.disabled = !(n || L.queued.length || L.rec);
    document.querySelectorAll('#lpStopMode .btn').forEach(b => b.classList.toggle('on', b.dataset.v === L.settings.stop));
    document.querySelectorAll('#lpQuant .btn').forEach(b => b.classList.toggle('on', +b.dataset.v === +L.settings.quant));
    const pz = $('lpPaused'); if (pz) { pz.hidden = !(L.why && n); pz.innerHTML = L.why ? GB.svg('pause') + ' Loops ' + esc(L.why) + '. They come back in time with the music.' : ''; }
    paintTop();
  }

  function sync(o) {
    if (!o || !o.slots) return;
    const keepEv = L && L.slots ? Object.fromEntries(L.slots.filter(s => s.events).map(s => [s.id, s.events])) : {};
    L = o; lpPro = o.pro !== false; base = {pos: o.pos, bpm: o.bpm || 120, t: performance.now()};
    L.slots.forEach(s => { if (!s.events && keepEv[s.id]) s.events = keepEv[s.id]; });
    buildGrid(); paintHead(); paint(); kick();
  }
  async function poll() {
    clearTimeout(pollT);
    if (GB.page === 'board' && GB.pro !== false && !document.hidden) { try { sync(await GB.get('/api/loops?lite=1')); } catch (e) {} }
    pollT = setTimeout(poll, GB.page === 'board' ? 450 : 1500);
  }
  GB.on('page', id => { if (id === 'board') { poll(); kick(); } });
  GB.on('ready', poll);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { poll(); kick(); } });

  // ------------------------------------------------------------------ mode bar chip: LOOPS n, one tap stops them all
  GB.on('status', s => {
    const c = $('mLoop'); if (!c) return; const lp = s.loops || {};
    const n = (lp.running || []).length, rec = lp.rec;
    c.hidden = !((n || rec) && GB.pro !== false && lp.pro !== false);
    if (c.hidden) return;
    c.classList.toggle('rec', !!rec);
    c.innerHTML = rec ? GB.svg('dot') + '<span class="w">REC </span><b>' + esc(rec.id) + '</b>' : GB.svg('loop') + '<span class="w">LOOPS</span><b>' + n + '</b>';
    const what = rec ? 'Recording loop ' + rec.id : 'Loops playing: ' + (lp.names || []).join(', ');
    c.setAttribute('aria-label', what + '. Tap to stop all loops.'); c.title = what + '. Tap to stop all loops.';
  });
  GB.on('ready', () => { const c = $('mLoop'); if (c) c.onclick = () => GB.loopsStopAll(); });

  // ------------------------------------------------------------------ laptop: L stops every loop
  const typing = e => { const a = e.target; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable || (a.closest && a.closest('.sheet'))); };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || typing(e) || GB.pro !== true) return;
    if (e.key === 'l' || e.key === 'L') { if (L && (L.running.length || L.queued.length || L.rec)) { e.preventDefault(); GB.loopsStopAll(); } }
  });

  // ------------------------------------------------------------------ ✏️ edit a slot: name, length, 16-step grid, nudge, copy, clear
  async function openEdit(id) {
    let full = null; try { full = await GB.get('/api/loops'); } catch (e) {}
    const src = full && full.slots.find(s => s.id === id); if (!src) return GB.toast('⚠️ Not connected');
    const ed = {name: src.name, bars: src.bars, ev: JSON.parse(JSON.stringify(src.events || [])), bar: 0};
    const s = document.createElement('div'); s.className = 'sheet lp-sheet';
    s.innerHTML = `<div><div class="ph" style="--c:${BANKC[id[0]]}"><span>Loop ${id}</span><span class="r" id="lpeCount"></span></div>
      <label class="field">Name<input type="text" id="lpeName" maxlength="18" autocomplete="off" placeholder="${id}"></label>
      <div class="sub">Length</div>
      <div class="seg" id="lpeBars">${[1, 2, 4, 8].map(n => `<button class="btn" data-v="${n}" style="--c:var(--lime)">${n} bar${n > 1 ? 's' : ''}</button>`).join('')}</div>
      <div class="sub">Steps <small style="text-transform:none;letter-spacing:0;color:var(--dim)">16 per bar, tap to add or remove a hit</small></div>
      <div class="lp-tabs" id="lpeTabs"></div>
      <div class="lp-steps" id="lpeSteps"></div>
      <div class="lp-other" id="lpeOther"></div>
      <div class="row"><button class="btn" id="lpeL">${GB.svg('left')}<span>Nudge</span></button><button class="btn" id="lpeR"><span>Nudge</span>${GB.svg('right')}</button><button class="btn" id="lpeClrBar">Clear bar</button></div>
      <div class="row"><button class="btn" id="lpeCopy">Copy to…</button><button class="btn danger" id="lpeClear">Clear slot</button><button class="btn" id="lpeRestore">Starters</button></div>
      <div class="row"><button class="btn c" id="lpeSave" style="--c:var(--lime)">Save</button><button class="btn ghost" id="lpeCancel">Cancel</button></div></div>`;
    document.body.appendChild(s);
    const q = sel => s.querySelector(sel);
    q('#lpeName').value = ed.name;
    const Lb = () => ed.bars * 4;
    const cellOf = e => Math.round(e.b * 4);                                      // 16 steps per bar = 4 per beat
    function paintEd() {
      q('#lpeBars').querySelectorAll('.btn').forEach(b => b.classList.toggle('on', +b.dataset.v === ed.bars));
      if (ed.bar >= ed.bars) ed.bar = 0;
      q('#lpeTabs').innerHTML = ed.bars > 1 ? Array.from({length: ed.bars}, (_, k) => `<button class="chip${k === ed.bar ? ' on' : ''}" data-k="${k}" style="--c:var(--lime)">Bar ${k + 1}</button>`).join('') : '';
      q('#lpeTabs').querySelectorAll('.chip').forEach(c => c.onclick = () => { ed.bar = +c.dataset.k; paintEd(); });
      const hits = ed.ev.filter(e => e.lane === 'hit');
      q('#lpeCount').textContent = ed.ev.length + ' MOVE' + (ed.ev.length === 1 ? '' : 'S');
      let h = '<span></span>' + Array.from({length: 16}, (_, i) => `<span class="bn">${i % 4 === 0 ? (ed.bar * 4 + i / 4 + 1) : ''}</span>`).join('');
      HITS.forEach(([k, em, name, c]) => {
        h += `<span class="rl" title="${name}" aria-hidden="true" style="color:${c}">${GB.svg(em)}</span>`;
        for (let i = 0; i < 16; i++) {
          const step = ed.bar * 16 + i, sb = step / 4;
          const here = hits.filter(e => e.hit === k && cellOf(e) % (ed.bars * 16) === step);
          const on = here.length > 0, off = on && here.every(e => Math.abs(e.b * 4 - Math.round(e.b * 4)) > 1e-6);
          const tail = !on && hits.some(e => e.hit === k && (k === 'blackout' || k === 'strobe') && (((sb - e.b) % Lb()) + Lb()) % Lb() < (k === 'blackout' ? e.len : e.beats || 0) - 1e-6);
          h += `<button class="lp-cell${i % 4 === 0 ? ' bs' : ''}${i === 0 ? ' b1' : ''}${on ? (off ? ' off' : ' on') : tail ? ' tail' : ''}" data-h="${k}" data-s="${step}" style="--hc:${c}" aria-label="${name}, beat ${(sb + 1).toFixed(2)}${on ? ', on' : ''}"></button>`;
        }
      });
      q('#lpeSteps').innerHTML = h;
      q('#lpeSteps').querySelectorAll('.lp-cell').forEach(b => b.onclick = () => toggleCell(b.dataset.h, +b.dataset.s));
      const others = ed.ev.filter(e => e.lane !== 'hit');
      q('#lpeOther').innerHTML = others.length ? 'Also in this loop: ' + others.map(e => `<span>${LANE_EM[e.lane] ? GB.svg(LANE_EM[e.lane]) : ''} ${esc(e.look || e.effect || e.text || (e.colors || []).join(' ') || e.lane)} · beat ${(e.b + 1).toFixed(2).replace(/\.?0+$/, '')}</span>`).join('') + ' <button class="btn sm ghost" id="lpeOtherClr">Remove these</button>' : '';
      const oc = q('#lpeOtherClr'); if (oc) oc.onclick = () => { ed.ev = ed.ev.filter(e => e.lane === 'hit'); paintEd(); };
    }
    function toggleCell(k, step) {
      const b = step / 4, here = ed.ev.filter(e => e.lane === 'hit' && e.hit === k && cellOf(e) % (ed.bars * 16) === step);
      if (here.length) { ed.ev = ed.ev.filter(e => !here.includes(e)); GB.sfx('tap'); }
      else {
        if (k === 'blackout') {                                                   // inside a blackout span: cut that step out of it
          const sp = ed.ev.find(e => e.lane === 'hit' && e.hit === 'blackout' && ((b - e.b) % Lb() + Lb()) % Lb() < e.len - 1e-6);
          if (sp) { const d = ((b - sp.b) % Lb() + Lb()) % Lb(), rest = sp.len - d - 0.25; sp.len = d;
            if (rest > 1e-6) ed.ev.push({lane: 'hit', hit: 'blackout', b: (b + 0.25) % Lb(), len: rest});
            if (sp.len < 1e-6) ed.ev = ed.ev.filter(e => e !== sp); GB.sfx('tap'); return paintEd(); }
          ed.ev.push({lane: 'hit', hit: 'blackout', b, len: 0.25});
        } else ed.ev.push(k === 'strobe' ? {lane: 'hit', hit: k, b, beats: 0.25} : {lane: 'hit', hit: k, b});
        GB.sfx('on');
      }
      paintEd();
    }
    q('#lpeBars').querySelectorAll('.btn').forEach(b => b.onclick = () => {
      const n = +b.dataset.v; if (n < ed.bars && ed.ev.some(e => e.b >= n * 4)) GB.toast('Moves after bar ' + n + ' are dropped when you save');
      ed.bars = n; paintEd(); });
    const nudge = d => { ed.ev.forEach(e => { e.b = ((e.b + d) % Lb() + Lb()) % Lb(); }); GB.sfx('tap'); paintEd(); };
    q('#lpeL').onclick = () => nudge(-0.25); q('#lpeR').onclick = () => nudge(0.25);
    q('#lpeClrBar').onclick = () => { ed.ev = ed.ev.filter(e => !(e.b >= ed.bar * 4 && e.b < ed.bar * 4 + 4)); GB.sfx('tap'); paintEd(); };
    q('#lpeCancel').onclick = () => s.remove();
    s.onclick = e => { if (e.target === s) s.remove(); };
    q('#lpeSave').onclick = async () => {
      const ev = ed.ev.filter(e => e.b < Lb()), merged = [];
      ev.filter(e => e.lane === 'hit' && e.hit === 'blackout').sort((a, b) => a.b - b.b).forEach(e => {      // touching blackout steps join into one span
        const last = merged[merged.length - 1]; if (last && Math.abs(last.b + last.len - e.b) < 1e-6) last.len += e.len; else merged.push(Object.assign({}, e)); });
      const out = ev.filter(e => !(e.lane === 'hit' && e.hit === 'blackout')).concat(merged);
      const name = q('#lpeName').value.trim();
      if (await lpost({save: id, slot: {name: name || (out.length ? id : ''), bars: ed.bars, events: out}})) { GB.sfx('ok'); GB.toast('💾 ' + (name || id) + ' saved'); s.remove(); }
    };
    q('#lpeClear').onclick = async () => { if (!confirm('Clear ' + id + '? Its moves are deleted.')) return; if (await lpost({clear: id})) { GB.toast('🗑 ' + id + ' cleared'); s.remove(); } };
    q('#lpeRestore').onclick = async () => { if (!confirm('Put the built-in starter loops back in banks A and B? Loops you saved there are replaced.')) return;
      if (await lpost({restore: true})) { GB.toast('↺ Starter loops are back'); s.remove(); } };
    q('#lpeCopy').onclick = () => {
      const rows = L.slots.filter(x => x.id !== id).map(x => ({label: x.id + (x.count ? ' · ' + (x.name || '') : ' · empty'), sub: x.count ? 'replace' : '',
        onclick: async () => { if (await lpost({copy: id, to: x.id})) { GB.toast('📋 Copied to ' + x.id); s.remove(); } }}));
      GB.sheet('Copy ' + id + ' to', rows);
    };
    paintEd();
  }
  GB.loopsEdit = openEdit;
  GB.on('pro', v => { if (v) poll(); });
})();
