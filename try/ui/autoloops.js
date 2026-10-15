/* 🔁 AUTO LOOPS page (GlowBop Pro DJ): the tempo toolbox, then the Autoloops pad grid with its banks and My scenes.
   Talks to /api/autoloops, /api/scenes and /api/tempo (prodj.py on the laptop). Pro DJ only (402 otherwise).
   AUTOLOOPS: 4 banks x 8 pads of ready-made, beat-synced looks. Tap a pad: it drops in on the next bar (or at once with
   SNAP) and holds until another pad, NEXT or RELEASE TO AUTO. REPEAT holds it, ADVANCE moves to the next pad every N bars.
   MY SCENES: "+ Save scene" captures the wall as it is now; tap a scene to bring it back with the chosen fade.
   MANAGE: rename, reorder or delete your scenes.
   Every control carries data-ctl="<id>" (the same ids as POST /api/prodj {"control": id}) so MIDI can map to it. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const BANKC = {A: 'var(--pink)', B: 'var(--cyan)', C: '#c3ff4d', D: 'var(--amber)', MY: '#ffc27a'};
  const BANKS = [['A', 'Club'], ['B', 'Chill / Flow'], ['C', 'Big Room'], ['D', 'Color'], ['MY', 'My scenes']];
  const FADES = [[0, 'Cut'], [0.5, '0.5 s'], [1, '1 s'], [2, '2 s'], [4, '4 s']];
  const MULTS = [[0.25, '¼'], [0.5, '½'], [1, '1'], [2, '2'], [4, '4']];
  const AMB = [[0, 'Off'], [10, '10 s'], [20, '20 s'], [45, '45 s']];
  let D = null, S = null, manage = false;
  let bank = GB.store.get('gb_al_bank', 'A'), fade = +GB.store.get('gb_al_fade', '1');
  if (!BANKS.some(b => b[0] === bank)) bank = 'A';

  // shared by the Pro DJ toolkit modules (autoloops.js, cues.js, zones.js): post, then tell every panel
  GB.pdjPost = GB.pdjPost || (async (p, b) => { const j = await GB.post(p, b); if (j) GB.emit('prodj', j); return j; });
  const post = GB.pdjPost;

  GB.css(`
  #pg-autoloops { --c:#ff9f5a; }
  #alTempo, #alPanel { container-type:inline-size; }
  .tp-main { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .tp-bpm { display:flex; align-items:baseline; gap:6px; min-width:0; }
  .tp-bpm b { font:400 calc(44px * var(--fs, 1))/1 var(--mono); color:#ff9f5a; text-shadow:0 0 18px color-mix(in srgb, #ff9f5a 55%, transparent); letter-spacing:-1px; }
  .tp-bpm small { font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); }
  .tp-dots { display:flex; gap:5px; flex:1 1 60px; min-width:60px; }
  .tp-dots i { flex:1; height:8px; border-radius:4px; background:var(--dark); transition:background .05s; }
  .tp-dots i.on { background:#ff9f5a; box-shadow:0 0 10px #ff9f5a; } .tp-dots i.on.d1 { background:#fff; box-shadow:0 0 12px #fff; }
  #alLock { --c:#ff9f5a; flex:0 0 auto; }
  .tp-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px; }
  .tp-grid .btn { padding:0 4px; min-width:0; font-size:calc(15px * var(--fs, 1)); }
  .tp-grid .btn .ic { width:16px; height:16px; }
  .tp-more > summary { cursor:pointer; min-height:44px; display:flex; align-items:center; gap:8px; font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--label); }
  .tp-more[open] > summary { color:#ff9f5a; } .tp-more > :not(summary) { margin-top:8px; }
  .tp-off { font:calc(12px * var(--fs, 1))/1 var(--mono); color:var(--dim); }
  .tp-amb { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .tp-amb .seg { flex:1 1 220px; }
  .tp-amb .chip { --c:var(--lav); }
  .al-banks { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:4px; }
  .al-banks .btn { min-width:0; padding:0 4px; border-radius:4px; min-height:46px; flex-direction:column; gap:1px; line-height:1; --c:var(--bc); box-shadow:inset 0 -3px 0 var(--bc); }
  .al-banks .btn:first-child { border-radius:22px 4px 4px 22px; } .al-banks .btn:last-child { border-radius:4px 22px 22px 4px; }
  .al-banks .btn b { font-size:calc(17px * var(--fs, 1)); }
  .al-banks .btn small { font:600 calc(10px * var(--fs, 1)) var(--cond); letter-spacing:.5px; opacity:.8; white-space:nowrap; overflow:hidden; max-width:100%; text-overflow:ellipsis; }
  .al-banks .btn.on { background:var(--bc); color:#000; }
  .al-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:7px; user-select:none; -webkit-user-select:none; }
  .al-pad { appearance:none; border:0; position:relative; min-width:0; min-height:92px; padding:20px 6px 18px; border-radius:0 14px 0 14px; cursor:pointer; overflow:hidden;
    background:color-mix(in srgb, var(--bc) 13%, var(--dark2)); color:var(--text); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--bc) 35%, transparent);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; text-align:center; touch-action:manipulation; -webkit-touch-callout:none;
    font:700 calc(14px * var(--fs, 1))/1.05 var(--cond); letter-spacing:.5px; text-transform:uppercase; transition:background .08s, box-shadow .08s; }
  .al-pad .nm { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; max-width:100%; }
  .al-pad .id { position:absolute; top:5px; left:7px; font:calc(10px * var(--fs, 1))/1 var(--mono); color:var(--bc); }
  .al-pad .bm { position:absolute; top:5px; right:7px; font:700 calc(10px * var(--fs, 1))/1 var(--cond); color:var(--dim); }
  .al-pad .sw { display:flex; gap:3px; } .al-pad .sw i { width:9px; height:9px; border-radius:50%; background:var(--s); box-shadow:0 0 5px var(--s); }
  .al-pad .pr { position:absolute; left:0; bottom:0; height:4px; width:0; background:#000; opacity:.55; transition:width .3s; }
  .al-pad.on { background:var(--bc); color:#000; box-shadow:0 0 0 2px #fff inset, 0 0 24px -2px var(--bc); }
  .al-pad.on .id, .al-pad.on .bm { color:#000; }
  .al-pad.pend { box-shadow:inset 0 0 0 2px var(--bc), 0 0 16px -4px var(--bc); animation:alBlink .5s steps(2) infinite; }
  .al-pad.add { background:transparent; box-shadow:inset 0 0 0 2px dashed; border:2px dashed color-mix(in srgb, var(--bc) 60%, transparent); color:var(--bc); }
  .al-pad.add .ic { width:26px; height:26px; }
  #alPanel.manage .al-pad:not(.add) { box-shadow:inset 0 0 0 2px var(--lav); }
  @keyframes alBlink { 50% { filter:brightness(1.6); } }
  @media (prefers-reduced-motion: reduce) { .al-pad.pend { animation:none; } }
  .al-ctl { display:grid; grid-template-columns:minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr); gap:8px; }
  .al-ctl .btn { min-width:0; padding:0 8px; }
  #alRel:not(:disabled) { background:var(--green); color:#000; box-shadow:0 0 16px -4px var(--green); }
  .al-opts { display:grid; grid-template-columns:minmax(0, 1fr); gap:8px; }
  .al-opts .lbl { font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); text-transform:uppercase; }
  .al-opts .seg .btn { min-height:42px; font-size:calc(14px * var(--fs, 1)); --c:#ff9f5a; }
  .al-opts .seg.dim .btn:not(.on) { opacity:.55; }
  .al-now { font:calc(13px * var(--fs, 1))/1.3 var(--mono); color:#ff9f5a; min-height:1.3em; }
  @container (min-width: 560px) { .al-pad { min-height:108px; font-size:calc(16px * var(--fs, 1)); } .al-opts { grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); } .tp-grid { grid-template-columns:repeat(8, minmax(0, 1fr)); } }
  @container (max-width: 420px) { .al-grid { gap:5px; } .al-pad { padding:19px 3px 16px; font-size:calc(12.5px * var(--fs, 1)); letter-spacing:0; min-height:84px; } .al-pad .id { left:5px; } .al-pad .bm { right:5px; }
    .al-banks small { display:none; } }
  .al-sheet .row { display:flex; gap:6px; flex-wrap:wrap; } .al-sheet .row .btn { flex:1 1 0; min-width:0; padding:0 8px; }
  `);

  // ------------------------------------------------------------------ data
  const presetsIn = b => (D && D.presets || []).filter(p => p.bank === b);
  const scenes = () => (D && D.scenes) || [];
  async function load() { if (GB.pro !== true) return; try { const j = await GB.get('/api/autoloops'); D = j; S = j; paintAll(); } catch (e) {} }
  GB.on('prodj', j => { if (!j) return; S = j; if (j.presets) D = j; else if (j.scenes && D && (!j.scenes.length || j.scenes[0].look)) D.scenes = j.scenes; paintAll(); });
  let seenRev = null, lastLoad = 0;
  GB.on('status', s => {
    if (!s.prodj) return;
    S = Object.assign({}, S, s.prodj); paintState(); paintBeat(s);
    if (seenRev !== null && s.prodj.rev !== seenRev && GB.page === 'autoloops' && Date.now() - lastLoad > 1500) { lastLoad = Date.now(); load(); }   // another phone changed something
    seenRev = s.prodj.rev;
  });

  // ------------------------------------------------------------------ the LOOPS & CUES switch (one rail key for both pages, so the phone rail fits)
  GB.css(`.lc-sw { padding:0 !important; background:none !important; border:0 !important; box-shadow:none !important; }
    .lc-sw .seg .btn { min-height:50px; font-size:calc(17px * var(--fs, 1)); letter-spacing:2px; }
    .lc-sw .seg .btn[data-p=autoloops] { --c:#ff9f5a; } .lc-sw .seg .btn[data-p=cues] { --c:#7dffb2; }
    /* Pro has one more rail key (LOOPS & CUES): on short tablet / laptop screens the gaps tighten so SETUP stays on screen */
    @media (min-width: 700px) and (max-height: 860px) { body:not(.not-pro) #rail { gap:3px; } body:not(.not-pro) #rail button[data-p=music] { flex-basis:calc(var(--rk) * 1.35); } }`);
  ['autoloops', 'cues'].forEach(pg => GB.panel(pg, 1, el => {
    el.classList.add('lc-sw'); el.id = pg === 'autoloops' ? 'lcSwA' : 'lcSwC';
    el.innerHTML = `<div class="seg" role="tablist"><button class="btn${pg === 'autoloops' ? ' on' : ''}" data-p="autoloops" role="tab" aria-selected="${pg === 'autoloops'}">${GB.svg('loop')}<span>Autoloops</span></button><button class="btn${pg === 'cues' ? ' on' : ''}" data-p="cues" role="tab" aria-selected="${pg === 'cues'}">${GB.svg('lists')}<span>Cues</span></button></div>`;
    el.querySelectorAll('.btn').forEach(b => b.onclick = () => { if (b.dataset.p !== pg) GB.go(b.dataset.p); });
  }));

  // ------------------------------------------------------------------ tempo toolbox
  GB.panel('autoloops', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', '#ff9f5a'); el.id = 'alTempo';
    el.innerHTML = `<div class="ph"><span>Tempo toolbox</span><span class="r" id="alTR">AUTO BPM</span></div>
      <div class="tp-main"><div class="tp-bpm"><b id="alBpm">–</b><small>BPM</small></div><div class="tp-dots" id="alDots"><i class="d1"></i><i></i><i></i><i></i></div>
        <button class="btn sm" id="alLock" data-ctl="tempo.lock">${GB.svg('lock')}<span>Lock</span></button></div>
      <div class="tp-grid">
        <button class="btn sm" data-t='{"adjust":-1}' data-ctl="tempo.bpm-1">-1</button><button class="btn sm" data-t='{"adjust":-0.1}' data-ctl="tempo.bpm-0.1">-0.1</button>
        <button class="btn sm" data-t='{"adjust":0.1}' data-ctl="tempo.bpm+0.1">+0.1</button><button class="btn sm" data-t='{"adjust":1}' data-ctl="tempo.bpm+1">+1</button>
        <button class="btn sm" data-t='{"half":true}' data-ctl="tempo.half">÷2</button><button class="btn sm" data-t='{"double":true}' data-ctl="tempo.double">×2</button>
        <button class="btn sm" data-t='{"nudge":-1}' data-ctl="tempo.nudge-" aria-label="Beat earlier">${GB.svg('left')}<span>Early</span></button><button class="btn sm" data-t='{"nudge":1}' data-ctl="tempo.nudge+" aria-label="Beat later"><span>Late</span>${GB.svg('right')}</button>
      </div>
      <div class="row" style="justify-content:space-between;align-items:center"><span class="tp-off" id="alOff"></span><button class="btn sm ghost" data-t='{"reset":true}' data-ctl="tempo.reset">${GB.svg('reset')}<span>Back to auto</span></button></div>
      <details class="tp-more" id="alMore"><summary>Beat multiplier and Auto Ambient</summary>
      <div class="al-opts"><div><div class="lbl">Beat for the held Autoloop</div><div class="seg" id="alBeat">${MULTS.map(([v, n]) => `<button class="btn" data-v="${v}">${n}</button>`).join('')}</div></div>
        <div><div class="lbl">Auto Ambient (Interlude by itself)</div><div class="tp-amb"><div class="seg" id="alAmb">${AMB.map(([v, n]) => `<button class="btn" data-v="${v}" style="--c:var(--lav)">${n}</button>`).join('')}</div>
          <button class="chip" id="alSpeech" title="Talking over the PA with no beat also starts it">${GB.svg('mic')}Speech counts</button></div></div></div>
      <p class="note">The fine-tune keys lock the tempo where you put it; ×2 and ÷2 double or halve it, Early and Late slide the beat 15 ms. Auto Ambient drifts into the Interlude after that much silence (or talking, with Speech counts on) and comes back with the music.</p></details>`;
    if (innerWidth >= 700 && innerHeight >= 1000) el.querySelector('#alMore').open = true;      // room to spare: open; phones: the pads come first
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = async () => { const j = await post('/api/tempo', JSON.parse(b.dataset.t)); if (j) paintTempo(j.tempo); });
    $('alLock').onclick = async () => { const on = !(S && S.tempo && S.tempo.locked); const j = await post('/api/tempo', {lock: on}); if (j) { paintTempo(j.tempo); GB.toast(on ? '🔒 Tempo locked at ' + j.tempo.bpm : '🎵 Following the music tempo'); } };
    el.querySelectorAll('#alBeat .btn').forEach(b => b.onclick = async () => {
      const L = S && S.loop; if (!L || L.kind !== 'loop') return GB.toast('Hold an Autoloop first, then pick its beat');
      const j = await post('/api/autoloops', {beat: {pad: L.id, mult: +b.dataset.v}}); if (j) GB.toast('🥁 ' + L.name + ': ' + b.textContent + ' beat');
    });
    el.querySelectorAll('#alAmb .btn').forEach(b => b.onclick = () => post('/api/tempo', {ambient: {secs: +b.dataset.v}}).then(j => j && paintTempo(j.tempo)));
    $('alSpeech').onclick = () => post('/api/tempo', {ambient: {speech: !(S && S.tempo && S.tempo.speech)}}).then(j => j && paintTempo(j.tempo));
    GB.proGate(el, 'Tempo toolbox');
  });
  function paintTempo(t) {
    if (!t || !$('alBpm')) return;
    $('alBpm').textContent = t.bpm ? Number(t.bpm).toFixed(1) : '–';
    $('alTR').textContent = t.locked ? 'LOCKED' : (t.mult !== 1 ? 'AUTO ×' + (t.mult < 1 ? '1/' + Math.round(1 / t.mult) : t.mult) : 'AUTO BPM');
    $('alTR').style.color = t.locked ? '#ff9f5a' : '';
    $('alLock').classList.toggle('on', !!t.locked); GB.lbl($('alLock'), t.locked ? 'lock' : 'unlock', t.locked ? 'Locked' : 'Lock');
    $('alOff').textContent = t.off_ms ? 'beat ' + (t.off_ms > 0 ? t.off_ms + ' ms early' : -t.off_ms + ' ms late') : '';
    document.querySelectorAll('#alAmb .btn').forEach(b => b.classList.toggle('on', +b.dataset.v === +(t.ambient || 0)));
    const sp = $('alSpeech'); sp.classList.toggle('on', !!t.speech);
  }
  let beatT = null;
  function paintBeat(s) {                                         // the 4 dots: a local beat clock, re-anchored every status
    const t = s && s.prodj && s.prodj.tempo; if (!t || GB.page !== 'autoloops') return;
    const bpm = t.bpm || s.bpm || 120, t0 = performance.now();
    clearInterval(beatT); let n = 0;
    beatT = setInterval(() => { const k = Math.floor((performance.now() - t0) / (60000 / bpm));
      if (k === n && k) return; n = k; document.querySelectorAll('#alDots i').forEach((d, i) => d.classList.toggle('on', i === k % 4)); }, 30);
  }

  // ------------------------------------------------------------------ Autoloops + My scenes
  GB.panel('autoloops', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', '#ff9f5a'); el.id = 'alPanel';
    el.innerHTML = `<div class="ph"><span>Autoloops</span><span class="r" id="alR">AUTO SHOW</span></div>
      <div class="al-banks" id="alBanks">${BANKS.map(([b, n]) => `<button class="btn" data-b="${b}" style="--bc:${BANKC[b]}"><b>${b === 'MY' ? GB.svg('save') : b}</b><small>${esc(n)}</small></button>`).join('')}</div>
      <div class="al-grid" id="alGrid"><p class="note">Loading…</p></div>
      <p class="al-now" id="alNow"></p>
      <div class="al-ctl"><button class="btn lg" id="alRel" data-ctl="autoloop.release" disabled>${GB.svg('note')}<span>Release to Auto</span></button>
        <button class="btn lg" id="alPrev" data-ctl="autoloop.prev" aria-label="Previous pad">${GB.svg('prev')}</button>
        <button class="btn lg" id="alNext" data-ctl="autoloop.next">${GB.svg('next')}<span>Next</span></button></div>
      <div class="al-opts">
        <div><div class="lbl">When a pad is tapped</div><div class="seg" id="alSnap"><button class="btn" data-v="0" data-ctl="autoloop.snap">Next bar</button><button class="btn" data-v="1" data-ctl="autoloop.snap">Snap now</button></div></div>
        <div><div class="lbl">Fade</div><div class="seg" id="alFade">${FADES.map(([v, n]) => `<button class="btn" data-v="${v}">${n}</button>`).join('')}</div></div>
        <div><div class="lbl">Play</div><div class="seg" id="alMode"><button class="btn" data-v="repeat" data-ctl="autoloop.advance">Repeat</button><button class="btn" data-v="advance" data-ctl="autoloop.advance">Advance</button></div></div>
        <div><div class="lbl">Advance every (bars)</div><div class="seg" id="alBars">${[4, 8, 16, 32].map(v => `<button class="btn" data-v="${v}" aria-label="${v} bars">${v}</button>`).join('')}</div></div>
      </div>
      <div class="row" id="alMyRow" hidden><button class="btn sm" id="alManage" style="--c:var(--lav)">${GB.svg('edit')}<span>Manage scenes</span></button></div>
      <p class="note" id="alNote">Tap a pad: it comes in on the next bar and holds until you pick another, tap Next or Release to Auto. Advance moves through the bank by itself. My scenes are looks you saved; they come back with the fade above.</p>`;
    el.querySelectorAll('#alBanks .btn').forEach(b => b.onclick = () => { bank = b.dataset.b; GB.store.set('gb_al_bank', bank); post('/api/autoloops', {opts: {bank}}); paintGrid(); });
    $('alRel').onclick = async () => { if (await post('/api/autoloops', {release: true, fade})) { GB.sfx('ok'); GB.toast('🎵 Back to the auto show'); } };
    $('alNext').onclick = () => post('/api/autoloops', {next: true, fade});
    $('alPrev').onclick = () => post('/api/autoloops', {prev: true, fade});
    el.querySelectorAll('#alSnap .btn').forEach(b => b.onclick = () => post('/api/autoloops', {opts: {snap: b.dataset.v === '1'}}));
    el.querySelectorAll('#alMode .btn').forEach(b => b.onclick = () => post('/api/autoloops', {opts: {mode: b.dataset.v}}));
    el.querySelectorAll('#alBars .btn').forEach(b => b.onclick = () => post('/api/autoloops', {opts: {bars: +b.dataset.v, mode: 'advance'}}));
    el.querySelectorAll('#alFade .btn').forEach(b => b.onclick = () => { fade = +b.dataset.v; GB.store.set('gb_al_fade', String(fade)); paintOpts(); });
    $('alManage').onclick = () => { manage = !manage; el.classList.toggle('manage', manage); GB.lbl($('alManage'), manage ? 'check' : 'edit', manage ? 'Done' : 'Manage scenes'); if (manage) GB.toast('✏️ Tap a scene to rename, move or delete it'); };
    GB.proGate(el, 'Autoloops');
  });

  function padHTML(p) {
    const sw = (p.pal || []).slice(0, 5).map(c => `<i style="--s:${esc(c)}"></i>`).join('');
    const bm = p.beat && p.beat !== 1 ? (p.beat < 1 ? '1/' + Math.round(1 / p.beat) : '×' + p.beat) : '';
    return `<span class="id">${esc(p.id.length > 3 ? '' : p.id)}</span>${bm ? `<span class="bm">${bm}</span>` : ''}<span class="nm">${esc(p.name)}</span><span class="sw">${sw}</span><i class="pr"></i>`;
  }
  function paintGrid() {
    const g = $('alGrid'); if (!g || !D) return;
    document.querySelectorAll('#alBanks .btn').forEach(b => b.classList.toggle('on', b.dataset.b === bank));
    $('alMyRow').hidden = bank !== 'MY';
    const list = bank === 'MY' ? scenes().map(s => Object.assign({}, s, {kind: 'scene'})) : presetsIn(bank);
    const sig = bank + JSON.stringify(list.map(p => [p.id, p.name, p.beat, (p.pal || []).join()]));
    if (g._sig !== sig) {
      g._sig = sig; g.innerHTML = ''; g.style.setProperty('--bc', BANKC[bank]);
      list.forEach(p => {
        const b = document.createElement('button'); b.className = 'al-pad'; b.dataset.id = p.id; b.style.setProperty('--bc', BANKC[bank]);
        b.dataset.ctl = p.kind === 'scene' ? 'scene.' + p.id : 'autoloop.' + p.id;
        b.title = p.kind === 'scene' ? p.name + ': ' + p.look + ' · ' + (p.fx || []).join(' + ') : p.name + ': ' + p.look + ' · ' + p.fx.join(' + ');
        b.setAttribute('aria-label', (p.kind === 'scene' ? 'Scene ' : 'Autoloop ') + p.name);
        b.innerHTML = padHTML(p); b.onclick = () => tap(p); g.appendChild(b);
      });
      if (bank === 'MY') {
        const a = document.createElement('button'); a.className = 'al-pad add'; a.style.setProperty('--bc', BANKC.MY); a.id = 'alSave';
        a.innerHTML = GB.svg('add') + '<span class="nm">Save scene</span>'; a.onclick = saveScene; g.appendChild(a);
      }
    }
    paintState();
  }
  async function tap(p) {
    if (p.kind === 'scene') {
      if (manage) return editScene(p);
      const j = await post('/api/scenes', {recall: p.id, fade}); if (j) GB.toast('🎞️ ' + p.name + (fade ? ' (' + fade + ' s fade)' : '')); return;
    }
    const snap = !!(S && S.opts && S.opts.snap);
    const j = await post('/api/autoloops', {pad: p.id, snap, fade: snap ? fade : Math.max(fade, 0.5)});
    if (j && !snap && j.pending) GB.toast('⏱ ' + p.name + ' on the next bar');
  }
  function paintState() {
    if (!S || !$('alGrid')) return;
    const L = S.loop, P = S.pending, adv = S.opts && S.opts.mode === 'advance';
    document.querySelectorAll('#alGrid .al-pad[data-id]').forEach(b => {
      const on = !!(L && L.id === b.dataset.id), pend = !!(P && P.id === b.dataset.id);
      b.classList.toggle('on', on); b.classList.toggle('pend', pend && !on);
      const pr = b.querySelector('.pr'); if (pr) pr.style.width = on && adv && L.kind === 'loop' ? Math.min(100, (S.bars || 0) / S.opts.bars * 100) + '%' : '0';
    });
    const r = $('alR');
    r.textContent = L ? (L.kind === 'scene' ? 'SCENE · ' : (L.id || '') + ' · ') + L.name.toUpperCase() : P ? 'NEXT BAR: ' + P.name.toUpperCase() : 'AUTO SHOW';
    r.style.color = L ? '#ff9f5a' : '';
    $('alRel').disabled = !L && !P;
    $('alNow').textContent = L ? (L.kind === 'scene' ? 'Scene' : 'Autoloop') + ' held: ' + L.name + (adv && L.kind === 'loop' ? ` · bar ${Math.min(S.opts.bars, (S.bars || 0) + 1)} of ${S.opts.bars}` : '') + (P ? ' · next bar: ' + P.name : '') : (P ? 'Waiting for the bar: ' + P.name : '');
    paintOpts(); paintTempo(S.tempo);
    document.querySelectorAll('#alBeat .btn').forEach(b => { const cur = L && L.kind === 'loop' && D ? (D.presets.find(p => p.id === L.id) || {}).beat : null;
      b.classList.toggle('on', cur != null && +b.dataset.v === +cur); b.disabled = !(L && L.kind === 'loop'); b.style.setProperty('--c', '#ff9f5a'); });
  }
  function paintOpts() {
    const o = (S && S.opts) || {};
    document.querySelectorAll('#alSnap .btn').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === !!o.snap));
    document.querySelectorAll('#alMode .btn').forEach(b => b.classList.toggle('on', b.dataset.v === (o.mode || 'repeat')));
    document.querySelectorAll('#alBars .btn').forEach(b => b.classList.toggle('on', +b.dataset.v === +o.bars));
    const bs = $('alBars'); if (bs) bs.classList.toggle('dim', o.mode !== 'advance');
    document.querySelectorAll('#alFade .btn').forEach(b => b.classList.toggle('on', +b.dataset.v === fade));
  }
  function paintAll() { paintGrid(); }

  // ------------------------------------------------------------------ scenes: save / manage
  function saveScene() {
    const s = document.createElement('div'); s.className = 'sheet al-sheet';
    s.innerHTML = `<div><div class="ph" style="--c:#ffc27a"><span>Save scene</span></div>
      <p class="note">Saves the wall as it looks right now: look, effect, colours, fader values, speed, transform and the override key colours.</p>
      <label class="field">Name<input type="text" id="alScName" maxlength="24" autocomplete="off" placeholder="First Dance"></label>
      <div class="chips">${['Grand Entrance', 'First Dance', 'Cake', 'Party Time', 'Last Song'].map(n => `<button class="chip" data-n="${n}" style="--c:#ffc27a">${n}</button>`).join('')}</div>
      <div class="row"><button class="btn c" id="alScGo" style="--c:#ffc27a">${GB.svg('save')}<span>Save scene</span></button><button class="btn ghost" id="alScX">Cancel</button></div></div>`;
    document.body.appendChild(s);
    const inp = s.querySelector('#alScName'); setTimeout(() => { try { inp.focus({preventScroll: true}); } catch (e) {} }, 50);
    s.querySelectorAll('.chip').forEach(c => c.onclick = () => { inp.value = c.dataset.n; });
    s.querySelector('#alScX').onclick = () => s.remove(); s.onclick = e => { if (e.target === s) s.remove(); };
    const go = async () => { const j = await post('/api/scenes', {save: {name: inp.value.trim()}}); if (j) { s.remove(); GB.sfx('ok'); GB.toast('💾 Scene saved: ' + j.scenes[j.scenes.length - 1].name); if (D) D.scenes = j.scenes; paintGrid(); } };
    s.querySelector('#alScGo').onclick = go; inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  }
  function editScene(p) {
    const s = document.createElement('div'); s.className = 'sheet al-sheet'; const i = scenes().findIndex(x => x.id === p.id), n = scenes().length;
    s.innerHTML = `<div><div class="ph" style="--c:var(--lav)"><span>Scene: ${esc(p.name)}</span></div>
      <p class="note">${esc(p.look)} · ${esc((p.fx || []).join(' + '))}</p>
      <label class="field">Name<input type="text" id="alEdName" maxlength="24" autocomplete="off"></label>
      <div class="row"><button class="btn" id="alEdUp" ${i <= 0 ? 'disabled' : ''}>${GB.svg('left')}<span>Earlier</span></button><button class="btn" id="alEdDn" ${i >= n - 1 ? 'disabled' : ''}><span>Later</span>${GB.svg('right')}</button></div>
      <div class="row"><button class="btn c" id="alEdSave" style="--c:var(--lav)">Save</button><button class="btn danger" id="alEdDel">${GB.svg('trash')}<span>Delete</span></button><button class="btn ghost" id="alEdX">Close</button></div></div>`;
    document.body.appendChild(s);
    const nm = s.querySelector('#alEdName'); nm.value = p.name;
    const done = j => { if (j) { if (D) D.scenes = j.scenes; paintGrid(); s.remove(); } };
    s.querySelector('#alEdX').onclick = () => s.remove(); s.onclick = e => { if (e.target === s) s.remove(); };
    s.querySelector('#alEdSave').onclick = async () => done(await post('/api/scenes', {rename: p.id, name: nm.value.trim()}));
    s.querySelector('#alEdUp').onclick = async () => done(await post('/api/scenes', {move: p.id, to: i - 1}));
    s.querySelector('#alEdDn').onclick = async () => done(await post('/api/scenes', {move: p.id, to: i + 1}));
    let armed = false; const del = s.querySelector('#alEdDel');
    del.onclick = async () => { if (!armed) { armed = true; GB.lbl(del, 'trash', 'Tap again'); return; } done(await post('/api/scenes', {delete: p.id})); GB.toast('🗑 Scene deleted'); };
  }

  GB.on('page', id => { if (id === 'autoloops') load(); else clearInterval(beatT); });
  GB.on('ready', () => { if (GB.page === 'autoloops') load(); });
  GB.on('pro', v => { if (v && GB.page === 'autoloops') load(); });
  GB.autoloopsLoad = load;
})();
