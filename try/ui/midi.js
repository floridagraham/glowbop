/* 🎛️ Controllers & Sync (SETUP): DJ controllers, MIDI learn, controller layouts, MIDI clock / VirtualDJ sync, "Test my controller".
   The engine on the laptop reads the controllers (midihub.py), so a controller on the laptop works with the console on a phone.
   This module: the panel, the MIDI-learn sheet (long-press or right-click any pad, fader or key; or Learn mode), the sync chip
   next to the BPM, the "Use the APC mini layout?" offer, and a Web MIDI relay for when the engine cannot read MIDI itself.

   GB.midiTargets: the registry other modules plug into.
     GB.midiTargets.register({id, sel, label, group, kind, post, body, off, range, state, eq, pro})  (or an array of them)
       id     'pd.<prodj control id>' for prodj.py controls (they are already known to the engine), or 'ext.<anything>' for
              new controls the engine should run by POSTing {post, body} to its own API (kind: trigger | hold | toggle | value;
              value targets put the 0..1 fader position, scaled to range [lo, hi], where the body says "{v}").
       sel    a CSS selector of the on-screen control, so long-press / right-click / Learn mode find it.
     Or simply put data-midi="<target id>" (or data-ctl="<prodj control id>") on the element.
     GB.midiTargets.resolve(el) -> target id | null.   GB.midiTargets.learn(id) opens the learn sheet. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const post = b => GB.post('/api/midi', b);
  const pro = () => GB.pro !== false;
  const SRC = {audio: 'AUDIO', clock: 'MIDI CLOCK', os2l: 'VIRTUALDJ', tap: 'TAP'};
  let M = null;                 // last GET /api/midi
  let B = null;                 // last status.midi (brief)

  GB.css(`
  .mi-chip { display:inline-flex; align-items:center; gap:4px; margin-left:6px; padding:1px 7px; border:1px solid color-mix(in srgb, var(--mc, var(--dim)) 70%, transparent);
    border-radius:9px; background:transparent; color:var(--mc, var(--dim)); font:600 calc(10.5px * var(--fs, 1))/1.4 var(--cond); letter-spacing:1px; cursor:pointer;
    min-height:0; vertical-align:middle; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
  .mi-chip[data-s=clock], .mi-chip[data-s=os2l] { --mc:var(--green); }
  .mi-chip[data-s=tap] { --mc:var(--cyan); }
  .mi-chip.offer { --mc:var(--gold); animation:miPulse 1.2s ease-in-out infinite; }
  @keyframes miPulse { 50% { box-shadow:0 0 10px var(--gold); } }
  .dj-bpm .mi-chip { font-size:calc(12px * var(--fs, 1)); vertical-align:6px; }
  #miPanel { container-type:inline-size; }
  #miPanel .mi-ports .item { align-items:center; }
  .mi-ports .item .tx small { overflow-wrap:anywhere; }
  .mi-led { width:10px; height:10px; border-radius:50%; flex:none; background:var(--dim); box-shadow:none; }
  .mi-led.ok { background:var(--green); box-shadow:0 0 8px var(--green); }
  .mi-led.bad { background:var(--red); }
  .mi-acts { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }
  .mi-acts .btn { min-width:0; padding:6px 6px; font-size:calc(13px * var(--fs, 1)); letter-spacing:.5px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; min-height:58px; line-height:1.1; text-align:center; }
  .mi-acts .btn .ic { width:20px; height:20px; }
  @container (max-width: 340px) { .mi-acts .btn { font-size:calc(11.5px * var(--fs, 1)); padding:6px 3px; } }
  .mi-tpl { display:flex; gap:8px; } .mi-tpl select { flex:1; min-width:0; }
  .mi-sync { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .mi-sync .btn { min-width:0; padding:6px 4px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; line-height:1.1;
    font-size:calc(14px * var(--fs, 1)); letter-spacing:.5px; text-align:center; min-height:56px; }
  .mi-sync .btn small { display:block; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:calc(10.5px * var(--fs, 1))/1.2 var(--mono); opacity:.85; letter-spacing:0; text-transform:none; }
  .mi-more summary { cursor:pointer; color:var(--label); font:600 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; padding:8px 0; }
  .mi-more .field, .mi-more .row { margin-top:6px; }
  .mi-tg { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 0; }
  .mi-tg span { min-width:0; }
  .mi-locked { opacity:.55; }
  .mi-prob { display:inline-flex; align-items:center; gap:4px; color:var(--gold); font:600 calc(11px * var(--fs, 1)) var(--cond); letter-spacing:1px; }
  .mi-prob .ic { width:13px; height:13px; }
  .mi-test { border:1px solid #ffffff22; border-radius:14px; padding:10px; display:flex; flex-direction:column; gap:8px; margin-top:6px; background:#0006; }
  .mi-mon { height:220px; overflow:auto; font:calc(11.5px * var(--fs, 1))/1.45 var(--mono); background:#000; border-radius:10px; padding:6px 8px; overscroll-behavior:contain; }
  .mi-mon div { padding-left:3.4em; text-indent:-3.4em; overflow-wrap:anywhere; }
  .mi-mon .t { color:var(--dim); } .mi-mon .p { color:var(--peri); } .mi-mon .r { color:var(--amber); } .mi-mon .m { color:var(--green); } .mi-mon .n { color:var(--gold); }
  .mi-rates { font:calc(12px * var(--fs, 1))/1.4 var(--mono); color:var(--dim); overflow-wrap:anywhere; }
  .mi-cap { height:8px; border-radius:4px; background:#ffffff1a; overflow:hidden; } .mi-cap i { display:block; height:100%; background:var(--gold); width:0; transition:width .3s linear; }
  .mi-sheet .mi-wait { text-align:center; padding:18px 8px; border:2px dashed color-mix(in srgb, var(--violet) 70%, transparent); border-radius:16px; color:var(--text);
    font:600 calc(17px * var(--fs, 1))/1.3 var(--cond); letter-spacing:1px; animation:miWait 1.4s ease-in-out infinite; }
  .mi-sheet .mi-wait.ok { border-color:var(--green); color:var(--green); animation:none; }
  @keyframes miWait { 50% { border-color:var(--violet); box-shadow:0 0 18px -4px var(--violet); } }
  .mi-sheet .item small { overflow-wrap:anywhere; }
  .mi-sheet .item .btn { flex:none; }
  .mi-grp { color:var(--label); font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; margin-top:8px; }
  .mi-offer { position:fixed; left:50%; transform:translateX(-50%); bottom:calc(64px + env(safe-area-inset-bottom)); z-index:240; width:min(560px, calc(100vw - 24px));
    background:var(--panel); border:2px solid var(--gold); border-radius:18px; padding:12px 14px; box-shadow:0 10px 40px #000c, 0 0 24px -8px var(--gold); display:flex; flex-direction:column; gap:8px; }
  .mi-offer b { font:700 calc(18px * var(--fs, 1))/1.2 var(--cond); letter-spacing:.5px; color:var(--gold); }
  .mi-offer .row { gap:8px; } .mi-offer .row .btn { flex:1; min-width:0; }
  .mi-bar { position:fixed; left:50%; transform:translateX(-50%); top:calc(8px + env(safe-area-inset-top)); z-index:245; width:min(560px, calc(100vw - 24px)); display:flex; gap:10px; align-items:center;
    background:var(--violet); color:#000; border-radius:14px; padding:8px 8px 8px 14px; font:700 calc(14px * var(--fs, 1))/1.25 var(--cond); letter-spacing:.5px; box-shadow:0 6px 30px #000c; }
  .mi-bar span { flex:1; min-width:0; } .mi-bar .btn { flex:none; background:#000; color:#fff; min-height:40px; }
  body.mi-learning [data-mi-ok] { outline:2px dashed var(--violet); outline-offset:2px; }
  body.mi-learning [data-mi-ok].mi-mapped { outline:2px solid var(--green); }
  `);

  // ------------------------------------------------------------------ the target registry
  const REG = new Map();
  let pushT = 0;
  function pushExt() {
    clearTimeout(pushT);
    pushT = setTimeout(async () => {
      const ext = [...REG.values()].filter(s => /^ext\./.test(s.id) && s.post);
      if (!ext.length || GB.pro === false) return;
      try { await fetch('/api/midi', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({targets: ext})}); } catch (e) {}
    }, 800);
  }
  // built-in controls, by where they sit on screen (most specific first)
  function builtin(el) {
    let x;
    if ((x = el.closest('[data-midi]'))) return x.dataset.midi;
    if ((x = el.closest('[data-ctl]'))) return 'pd.' + x.dataset.ctl;
    if ((x = el.closest('.fd-fl')) && x.closest('.fd[data-k]')) return 'fader.' + x.closest('.fd[data-k]').dataset.k + '.key';
    if ((x = el.closest('.fd[data-k]'))) return 'fader.' + x.dataset.k;
    if ((x = el.closest('.dj-pads .tile[data-k]'))) return 'dj.hit.' + x.dataset.k;
    if ((x = el.closest('#djSkip .btn[data-st]'))) return 'dj.' + x.dataset.st;
    if (el.closest('#djBuild')) return 'dj.build';
    if (el.closest('#djTap')) return 'dj.tap';
    if (el.closest('#djAuto')) return 'dj.tap_off';
    if ((x = el.closest('.ov-key[data-id]'))) return 'ovr.' + x.dataset.id;
    if (el.closest('#ovRelease')) return 'ovr.release';
    if (el.closest('#ilBig')) return 'ovr.interlude';
    if ((x = el.closest('.lp-slot[data-id]'))) return 'loop.' + x.dataset.id;
    if (el.closest('#lpStop')) return 'loop.stop_all';
    if (el.closest('#ssOn')) return 'show.on';
    if (el.closest('#ssRec')) return 'show.rec';
    if (el.closest('#fdReset')) return 'fader.reset';
    return null;
  }
  const SELS = '[data-midi], [data-ctl], .fd[data-k], .dj-pads .tile[data-k], #djSkip .btn, #djBuild, #djTap, #djAuto, .ov-key[data-id], #ovRelease, #ilBig, .lp-slot[data-id], #lpStop, #ssOn, #ssRec, #fdReset';
  GB.midiTargets = {
    register(spec) {
      (Array.isArray(spec) ? spec : [spec]).forEach(s => { if (s && s.id) REG.set(String(s.id), s); });
      pushExt();
    },
    resolve(el) {
      if (!el || !el.closest || el.closest('#miPanel, .sheet, .mi-offer, .mi-bar')) return null;
      for (const [id, s] of REG) if (s.sel && el.closest(s.sel)) return id;
      return builtin(el);
    },
    list: () => (M && M.targets) || [],
    learn: id => openLearn(id),
  };
  const tinfo = id => ((M && M.targets) || []).find(t => t.id === id) || (REG.get(id) ? {id, label: REG.get(id).label || id, pro: REG.get(id).pro !== false, kind: REG.get(id).kind || 'trigger'} : null);

  // ------------------------------------------------------------------ data
  async function load() { try { M = await GB.get('/api/midi'); paint(); } catch (e) {} return M; }
  GB.on('status', s => {
    if (!s.midi) return;
    B = s.midi; paintChips(); paintOffer(); paintDjCard(); migrate();
    if (GB.page === 'setup' && Date.now() - (load.t || 0) > 2500) { load.t = Date.now(); load(); }
    relayCheck();
  });
  GB.on('page', p => { if (p === 'setup') load(); });
  GB.on('pro', () => { paint(); paintChips(); });

  // ------------------------------------------------------------------ the sync chip next to the BPM
  function chipFor(host, id, cls) {
    if (!host || $(id)) return $(id);
    const c = document.createElement('button'); c.className = 'mi-chip ' + (cls || ''); c.id = id; c.type = 'button';
    c.onclick = e => { e.stopPropagation(); openSync(); };
    host.appendChild(c); return c;
  }
  function paintChips() {
    if (!B) return;
    chipFor($('rBpm') && $('rBpm').parentNode.querySelector('.k'), 'miChip');
    const dj = $('djTapR'); if (dj && !$('miChipDj')) { const c = chipFor(dj.parentNode, 'miChipDj'); dj.parentNode.insertBefore(c, dj); }
    [$('miChip'), $('miChipDj')].forEach(c => {
      if (!c) return;
      const offer = B.offer && GB.pro !== false;
      c.dataset.s = B.src || 'audio'; c.classList.toggle('offer', !!offer);
      c.textContent = offer ? (SRC[B.offer] + '?') : (SRC[B.src] || 'AUDIO');
      c.title = offer ? (B.offer === 'clock' ? 'MIDI clock is arriving. Tap to follow it.' : 'VirtualDJ is sending beats. Tap to follow it.') : 'Where the beat comes from. Tap to change.';
      c.setAttribute('aria-label', 'Beat sync: ' + c.textContent + '. Tap to change.');
    });
  }
  function openSync() {
    const s = document.createElement('div'); s.className = 'sheet mi-sheet';
    const b = B || {}, cl = b.clock, os = b.os2l || {};
    const row = (v, name, sub, ok) => `<button class="item" data-v="${v}"${ok ? '' : ' aria-disabled="true"'}><div class="tx"><b>${name}${b.want === v ? ' ✓' : ''}</b><small>${esc(sub)}</small></div></button>`;
    s.innerHTML = `<div><div class="ph" style="--c:var(--green)"><span>Beat sync</span><span class="r">NOW: ${SRC[b.src] || 'AUDIO'}</span></div>
      <div class="list">
        ${row('audio', 'Audio', 'GlowBop listens to the music and finds the beat itself.', true)}
        ${row('clock', 'MIDI clock', cl ? `${cl.state === 'running' ? 'Arriving' : cl.state} from ${cl.port}${cl.bpm ? ' at ' + cl.bpm + ' BPM' : ''}` : 'Nothing arriving yet. Send clock from your DJ software or a drum machine.', !!cl)}
        ${row('os2l', 'VirtualDJ (OS2L)', (os.clients || []).length ? (os.fresh ? 'Connected and sending beats' : 'Connected, waiting for a playing deck') : 'Not connected. See Controllers & Sync in SETUP.', true)}
      </div>
      ${GB.pro === false ? `<p class="note"><span class="mi-prob">${GB.svg('lock')}PRO DJ</span> MIDI clock and VirtualDJ sync are part of GlowBop Pro DJ.</p>` : `<p class="note">If MIDI clock or VirtualDJ stops, GlowBop goes back to the audio by itself and follows them again when they return.</p>`}
      <div class="row"><button class="btn" id="miSyncMore">Controllers &amp; Sync</button><button class="btn ghost" id="miSyncX">Close</button></div></div>`;
    document.body.appendChild(s);
    s.onclick = e => { if (e.target === s) s.remove(); };
    s.querySelector('#miSyncX').onclick = () => s.remove();
    s.querySelector('#miSyncMore').onclick = () => { s.remove(); GB.go('setup', 'miPanel'); };
    s.querySelectorAll('.item[data-v]').forEach(it => it.onclick = async () => {
      const v = it.dataset.v;
      if (v !== 'audio' && GB.pro === false) { GB.toast('🔒 MIDI clock and VirtualDJ sync are Pro DJ'); GB.sfx('err'); return; }
      const r = await post({settings: {sync: v}}); if (!r) return;
      B = r.midi || B; s.remove(); paintChips(); load();
      GB.toast(v === 'audio' ? '🎵 Following the music' : v === 'clock' ? '🎛️ Following MIDI clock' : '🎧 Following VirtualDJ');
    });
  }

  // ------------------------------------------------------------------ "Use the APC mini layout?"
  let offerEl = null;
  function paintOffer() {
    const o = B && B.tpl_offer, key = o ? o.base + '|' + o.template : '';
    if (!o || (GB.store.get('gb_mi_offer_seen', '') === key)) { if (offerEl) { offerEl.remove(); offerEl = null; } return; }
    if (offerEl && offerEl.dataset.k === key) return;
    if (offerEl) offerEl.remove();
    offerEl = document.createElement('div'); offerEl.className = 'mi-offer'; offerEl.dataset.k = key; offerEl.setAttribute('role', 'dialog');
    const short = o.name.replace(/^(Akai|Novation)\s+/, '');
    offerEl.innerHTML = `<b>${GB.svg('dj')} ${esc(o.name)} plugged in</b><span class="note" style="margin:0">Use the ready-made ${esc(short)} layout? Pads, faders and buttons go straight to GlowBop, and the pads light up.</span>
      <div class="row"><button class="btn c" id="miOfYes" style="--c:var(--gold)">Use the ${esc(short)} layout</button><button class="btn ghost" id="miOfNo">Not now</button></div>`;
    document.body.appendChild(offerEl);
    offerEl.querySelector('#miOfYes').onclick = async () => {
      const r = await post({template: o.template, port: o.port}); if (!r) return;
      GB.sfx('ok'); GB.toast('🎛️ ' + short + ' layout ready'); GB.store.set('gb_mi_offer_seen', key); offerEl.remove(); offerEl = null; load();
      if (GB.pro === false) GB.toast('🎛️ ' + short + ': hit pads, build and tap are set. The rest of the layout is Pro DJ.');
    };
    offerEl.querySelector('#miOfNo').onclick = async () => { GB.store.set('gb_mi_offer_seen', key); offerEl.remove(); offerEl = null; await post({dismiss_offer: o.port}); };
  }

  // ------------------------------------------------------------------ DJ page card (dj.js) status
  function paintDjCard() {
    const r = $('djMidiR'); if (!r || !B) return;
    r.textContent = B.ports ? (B.names[0] || '').replace(/ \(browser\)$/, '').toUpperCase().slice(0, 30) + (B.ports > 1 ? ' +' + (B.ports - 1) : '') : 'NOT CONNECTED';
  }
  // old laptop-only pad mappings (gb_dj_midi) move to the engine once
  function migrate() {
    if (GB.store.get('gb_dj_midi_moved', '') === '1') return;
    let old = {}; try { old = JSON.parse(GB.store.get('gb_dj_midi', '{}') || '{}'); } catch (e) {}
    GB.store.set('gb_dj_midi_moved', '1');
    Object.keys(old).forEach(k => {
      const [kind, num] = k.split(':'), act = old[k];
      const target = act === 'build' ? 'dj.build' : act === 'tap' ? 'dj.tap' : 'dj.hit.' + act;
      fetch('/api/midi', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({map: {key: (kind === 'cc' ? 'cc' : 'n') + '.*.' + num, target, src: 'old'}})}).catch(() => {});
    });
  }

  // ------------------------------------------------------------------ MIDI learn: long-press, right-click, Learn mode
  let lpT = 0, lpXY = null, lpEl = null, swallow = 0;
  document.addEventListener('contextmenu', e => {
    const id = GB.midiTargets.resolve(e.target); if (!id) return;
    e.preventDefault(); openLearn(id);
  });
  document.addEventListener('pointerdown', e => {
    if (learning) {                                            // Learn mode: a tap picks the control, it does not fire it
      const id = GB.midiTargets.resolve(e.target);
      if (id) { e.preventDefault(); e.stopImmediatePropagation(); swallow = Date.now(); openLearn(id); }
      return;
    }
    if (e.pointerType === 'mouse' || e.button > 0) return;
    // long-press to learn only when a controller is plugged in, and never on keys that are meant to be held
    // (Hold to build, override keys, fader hold keys): those use Learn mode or right-click instead
    const st = (GB.status || {}).midi || {};
    if (!(st.ports > 0)) return;
    if (e.target.closest('#djBuild, .ov-key, .fd-hold, .fd [data-hold], [data-hold], #ilBig')) return;
    const id = GB.midiTargets.resolve(e.target); if (!id) return;
    lpXY = [e.clientX, e.clientY]; lpEl = e.target; clearTimeout(lpT);
    lpT = setTimeout(() => { lpT = 0; swallow = Date.now(); if (navigator.vibrate) try { navigator.vibrate(15); } catch (er) {} openLearn(id); }, 650);
  }, true);
  const lpCancel = e => { if (!lpT) return; if (e.type === 'pointermove' && lpXY && Math.hypot(e.clientX - lpXY[0], e.clientY - lpXY[1]) < 10) return; clearTimeout(lpT); lpT = 0; };
  ['pointerup', 'pointercancel', 'pointermove'].forEach(t => document.addEventListener(t, lpCancel, true));
  document.addEventListener('click', e => {
    if (Date.now() - swallow < 700 && !e.target.closest('.sheet, .mi-bar')) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  GB.css(`${SELS.split(',').map(s => s.trim()).join(', ')} { -webkit-touch-callout:none; }`);

  let learning = false, barEl = null;
  function setLearning(on) {
    learning = on; document.body.classList.toggle('mi-learning', on);
    if (on) {
      markMappable();
      barEl = document.createElement('div'); barEl.className = 'mi-bar';
      barEl.innerHTML = `<span>LEARN MODE: tap a pad, fader or key here, then press or move the control on your controller.</span><button class="btn" id="miBarX">Done</button>`;
      document.body.appendChild(barEl); barEl.querySelector('#miBarX').onclick = () => setLearning(false);
    } else if (barEl) { barEl.remove(); barEl = null; }
    const b = $('miLearn'); if (b) b.classList.toggle('on', on);
  }
  function markMappable() {
    const mapped = new Set(((M && M.mappings) || []).map(m => m.target));
    const sel = [SELS, ...[...REG.values()].filter(s => s.sel).map(s => s.sel)].join(', ');
    document.querySelectorAll(sel).forEach(el => { const id = GB.midiTargets.resolve(el); if (!id) return; el.setAttribute('data-mi-ok', ''); el.classList.toggle('mi-mapped', mapped.has(id)); });
  }

  let learnPoll = 0;
  async function openLearn(id) {
    clearTimeout(lpT); lpT = 0;
    if (!M) await load();
    const t = tinfo(id);
    if (!t) { GB.toast('This control cannot be mapped yet'); return; }
    if (t.pro && GB.pro === false) { GB.toast('🔒 Mapping ' + t.label + ' is a Pro DJ feature. Hit pads, build and tap work on Home.'); GB.sfx('err'); return; }
    if (/^ext\./.test(id)) { pushExt(); await new Promise(r => setTimeout(r, 900)); }
    document.querySelectorAll('.mi-sheet').forEach(x => x.remove());
    const s = document.createElement('div'); s.className = 'sheet mi-sheet';
    const isOvr = /^ovr\./.test(id) && t.kind === 'hold';
    const cur = () => ((M && M.mappings) || []).filter(m => m.target === id);
    s.innerHTML = `<div><div class="ph" style="--c:var(--violet)"><span>Learn MIDI: ${esc(t.label)}</span><span class="r">${esc(t.group || '')}</span></div>
      <div class="mi-wait" id="miWait">Press a pad or move a control on your controller…</div>
      <p class="note" id="miWaitNote">${(M && M.ports && M.ports.ins.length) ? 'Listening on ' + esc(M.ports.ins.map(p => p.name.replace(/ \(browser\)$/, '')).join(', ')) + (t.kind === 'value' ? '. Move a fader or knob.' : '.') : 'No controller found yet. Plug it into the laptop that runs GlowBop.'}</p>
      ${isOvr ? `<div class="sub">From the controller</div><div class="seg" id="miMode"><button class="btn" data-v="">Hold</button><button class="btn" data-v="toggle">Latch (tap on, tap off)</button></div>` : ''}
      <div class="sub">Mapped to</div><div class="list" id="miCur"></div>
      <div class="row"><button class="btn ghost" id="miLx">Close</button></div></div>`;
    document.body.appendChild(s);
    const close = () => { clearTimeout(learnPoll); s.remove(); post({learn: null}); };
    s.onclick = e => { if (e.target === s) close(); };
    s.querySelector('#miLx').onclick = close;
    let mode = (cur()[0] || {}).mode || '';
    const paintCur = () => {
      const box = s.querySelector('#miCur'), list = cur();
      box.innerHTML = list.length ? '' : '<p class="note">Nothing yet.</p>';
      list.forEach(m => { const it = document.createElement('div'); it.className = 'item';
        it.innerHTML = `<div class="tx"><b>${esc(m.label)}</b><small>${esc(m.port || 'any controller')}${m.src && m.src.startsWith('tpl:') ? ' · layout' : ''}</small></div><button class="btn sm danger" aria-label="Remove">${GB.svg('trash')}</button>`;
        it.querySelector('.btn').onclick = async () => { if (await post({unmap: {key: m.key, port: m.port}})) { await load(); paintCur(); } };
        box.appendChild(it); });
      s.querySelectorAll('#miMode .btn').forEach(b => b.classList.toggle('on', b.dataset.v === mode));
    };
    s.querySelectorAll('#miMode .btn').forEach(b => b.onclick = async () => { mode = b.dataset.v; paintCur(); if (cur().length) await post({target: id, mode: mode || 'default'}); await post({learn: id, mode: mode || null}); });
    paintCur();
    const r = await post({learn: id, mode: mode || null}); if (!r) { s.remove(); return; }
    let since = 0; const t0 = Date.now();
    const poll = async () => {
      if (!s.isConnected) return;
      try {
        const mo = await GB.get('/api/midi/monitor?since=' + since); since = mo.seq;
        if (mo.learned && mo.learned.target === id && mo.learned.t * 1000 > t0 - 2000 && !mo.learn) {
          const w = s.querySelector('#miWait'); w.classList.add('ok'); w.textContent = 'Learned: ' + mo.learned.label;
          GB.sfx('ok'); await load(); paintCur(); markMappable();
          setTimeout(() => { if (s.isConnected) s.remove(); }, 1100); return;
        }
        if (Date.now() - t0 > 45000) { close(); GB.toast('Learn timed out'); return; }
      } catch (e) {}
      learnPoll = setTimeout(poll, 250);
    };
    poll();
  }

  // ------------------------------------------------------------------ the panel (SETUP > Controllers & Sync)
  GB.panel('setup', 42, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)'); el.id = 'miPanel';
    el.innerHTML = `<div class="ph"><span>Controllers &amp; Sync</span><span class="r" id="miR">LOOKING…</span></div>
      <div class="list mi-ports" id="miPorts"></div>
      <div class="mi-acts">
        <button class="btn" id="miLearn" style="--c:var(--violet)">${GB.svg('dj')}<span>Learn mode</span></button>
        <button class="btn" id="miMaps" style="--c:var(--violet)">${GB.svg('lists')}<span id="miMapsN">Mappings</span></button>
        <button class="btn" id="miTest" style="--c:var(--gold)">${GB.svg('bug')}<span>Test my controller</span></button>
      </div>
      <p class="note">Long-press (or right-click) any pad, fader, override key or loop to teach it a control on your controller. Hit pads, build and tap work on Home DJ; everything else is Pro DJ.</p>
      <div class="sub">Controller layout</div>
      <div class="mi-tpl"><select id="miTpl" aria-label="Controller layout"></select><button class="btn c" id="miTplGo" style="--c:var(--violet)">Use</button></div>
      <p class="note" id="miTplNote"></p>
      <div class="sub">Beat from <span class="mi-prob" id="miSyncPro" hidden>${GB.svg('lock')}PRO DJ</span></div>
      <div class="seg mi-sync" id="miSync"><button class="btn" data-v="audio" style="--c:var(--green)">Audio<small>listening</small></button><button class="btn" data-v="clock" style="--c:var(--green)">MIDI clock<small id="miClkS">none</small></button><button class="btn" data-v="os2l" style="--c:var(--green)">VirtualDJ<small id="miOsS">off</small></button></div>
      <p class="note mono" id="miSyncNote"></p>
      <details class="mi-more" id="miMore"><summary>Clock out, VirtualDJ, pads</summary>
        <label class="mi-tg"><span>Send MIDI clock out <span class="mi-prob" id="miCoPro" hidden>${GB.svg('lock')}PRO</span></span><input type="checkbox" id="miCo" aria-label="Send MIDI clock out"></label>
        <label class="field">Clock out to<select id="miCoPort" aria-label="MIDI clock output port"></select></label>
        <label class="field">VirtualDJ (OS2L) port<div class="mi-tpl"><input type="number" id="miOsPort" min="1024" max="65535" inputmode="numeric" aria-label="OS2L port"><button class="btn c" id="miOsGo" style="--c:var(--violet)">Set</button></div></label>
        <p class="note" id="miOsNote">VirtualDJ on this laptop: Settings, Options, search <b>os2l</b>, set <b>os2lDirectIp</b> to <b class="mono" id="miOsIp">127.0.0.1:9996</b>, then restart VirtualDJ. On another computer, use this laptop's address instead.</p>
        <label class="mi-tg"><span>Light the pads on the controller</span><input type="checkbox" id="miLed"></label>
        <label class="mi-tg"><span>Soft takeover (a fader only moves a value once it reaches it)</span><input type="checkbox" id="miTake"></label>
        <label class="mi-tg"><span>Controller hit pads wait for the next beat</span><input type="checkbox" id="miSnap"></label>
        <p class="note mono" id="miEng"></p>
      </details>
      <div class="mi-test" id="miTestBox" hidden>
        <div class="ph" style="--c:var(--gold)"><span>Test my controller</span><span class="r" id="miTR">LIVE</span></div>
        <p class="note" style="margin:0">Press pads, move faders. Every message shows here with what it does in GlowBop.</p>
        <div class="mi-rates" id="miRates"></div>
        <div class="mi-mon" id="miMon" aria-live="off"></div>
        <div class="mi-cap" id="miCapBar" hidden><i></i></div>
        <div class="row"><button class="btn c" id="miCapGo" style="--c:var(--gold)">${GB.svg('bug')}<span>Send to GlowBop support</span></button><button class="btn ghost" id="miTx">Close</button></div>
        <div id="miCapForm" hidden>
          <label class="field">Your email (so we can reply)<input type="email" id="miCapEm" autocomplete="email" inputmode="email"></label>
          <label class="field">What happens? (optional)<textarea id="miCapMsg" rows="3" placeholder="e.g. the faders work but the pads do nothing"></textarea></label>
          <button class="btn c wide" id="miCapSend" style="--c:var(--gold)">Send the test</button>
        </div>
      </div>`;
    $('miLearn').onclick = () => setLearning(!learning);
    $('miMaps').onclick = openMaps;
    $('miTest').onclick = () => openTest(true);
    $('miTx').onclick = () => openTest(false);
    $('miTplGo').onclick = async () => {
      const v = $('miTpl').value; if (!v) return;
      const port = (M && M.ports.ins.find(p => p.ok) || {}).name;
      if (await post({template: v, port})) { GB.sfx('ok'); GB.toast('🎛️ Layout ready'); load(); }
    };
    $('miTpl').onchange = paintTplNote;
    $('miSync').querySelectorAll('.btn').forEach(b => b.onclick = async () => {
      if (b.dataset.v !== 'audio' && GB.pro === false) { GB.toast('🔒 MIDI clock and VirtualDJ sync are Pro DJ'); GB.sfx('err'); return; }
      if (await post({settings: {sync: b.dataset.v}})) load();
    });
    const tg = (id, k) => $(id).onchange = async () => { if (!(await post({settings: {[k]: $(id).checked}}))) $(id).checked = !$(id).checked; else load(); };
    tg('miCo', 'clock_out'); tg('miLed', 'led'); tg('miTake', 'takeover'); tg('miSnap', 'snap');
    $('miCoPort').onchange = async () => { if (await post({settings: {clock_out_port: $('miCoPort').value}})) load(); };
    $('miOsGo').onclick = async () => { const v = +$('miOsPort').value; if (await post({settings: {os2l_port: v, os2l: true}})) { GB.toast('🎧 VirtualDJ port ' + v); load(); } };
    $('miCapGo').onclick = startCapture;
    $('miCapSend').onclick = sendCapture;
    load();
  });

  function paintTplNote() {
    const t = ((M && M.templates) || []).find(x => x.id === $('miTpl').value);
    $('miTplNote').textContent = t ? t.notes : 'Pick a layout for your controller, or teach every control yourself.';
  }

  function paint() {
    if (!M || !$('miPanel')) return;
    const ins = M.ports.ins, ok = ins.filter(p => p.ok);
    $('miR').textContent = ok.length ? (ok.length === 1 ? ok[0].name.replace(/ \(browser\)$/, '').toUpperCase().slice(0, 26) : ok.length + ' CONTROLLERS') : 'NO CONTROLLER';
    const box = $('miPorts'); box.innerHTML = '';
    if (!ins.length) {
      box.innerHTML = `<p class="note">${M.backend.engine ? 'Plug a USB DJ controller or pad into the laptop that runs GlowBop. It shows up here in a couple of seconds.'
        : 'This GlowBop cannot read controllers by itself yet. Open GlowBop in Chrome or Edge on the laptop and controllers come in through that window.'}</p>`;
    }
    ins.forEach(p => {
      const tpl = (M.templates.find(t => t.id === (p.template || p.detected)) || {});
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<i class="mi-led ${p.ok ? 'ok' : 'bad'}"></i><div class="tx"><b>${esc(p.name.replace(/ \(browser\)$/, ''))}</b><small>${p.ok ? (p.template ? esc(tpl.name || p.template) + ' layout · ' : p.detected ? 'Looks like ' + esc(tpl.name) + ' · ' : '') + p.mapped + ' mapped' + (p.via === 'relay' ? ' · through this browser' : '')
        : 'Busy: another program (DJ software?) has it open. ' + esc(p.error || '')}</small></div>`;
      box.appendChild(it);
    });
    $('miMapsN').textContent = 'Mappings (' + M.mappings.length + ')';
    const sel = $('miTpl'), keep = sel.value;
    sel.innerHTML = '<option value="">Choose a layout…</option>' + M.templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('');
    const det = (ok.find(p => p.template || p.detected) || {});
    sel.value = keep || det.template || det.detected || ''; paintTplNote();
    // sync
    const sy = M.sync, b = sy.brief, cl = sy.clock, os = sy.os2l;
    $('miSync').querySelectorAll('.btn').forEach(x => { x.classList.toggle('on', x.dataset.v === b.want); x.classList.toggle('mi-locked', x.dataset.v !== 'audio' && GB.pro === false); });
    $('miSyncPro').hidden = GB.pro !== false; $('miCoPro').hidden = GB.pro !== false;
    $('miClkS').textContent = cl ? (cl.state === 'running' ? Math.round(cl.bpm || 0) + ' BPM' : cl.state) : 'none';
    $('miOsS').textContent = os.on ? ((os.clients || []).length ? (os.fresh ? Math.round(os.bpm || 0) + ' BPM' : 'connected') : 'waiting') : 'off';
    $('miSyncNote').textContent = 'Now: ' + (SRC[b.src] || 'AUDIO') + (b.want !== 'audio' && b.src === 'audio' ? ' (waiting for ' + SRC[b.want] + ', following the audio meanwhile)' : '') +
      (os.clients && os.clients.length ? ' · Connected: ' + os.clients.map(c => c.name).join(', ') : '') + (os.error ? ' · VirtualDJ port: ' + os.error : '');
    const st = M.settings;
    $('miCo').checked = !!st.clock_out; $('miLed').checked = st.led !== false; $('miTake').checked = st.takeover !== false; $('miSnap').checked = !!st.snap;
    const outs = M.ports.all_outs || [];
    $('miCoPort').innerHTML = '<option value="">Choose an output…</option>' + outs.map(o => `<option${o === st.clock_out_port ? ' selected' : ''}>${esc(o)}</option>`).join('');
    if (document.activeElement !== $('miOsPort')) $('miOsPort').value = st.os2l_port;
    $('miOsIp').textContent = '127.0.0.1:' + st.os2l_port;
    $('miEng').textContent = 'MIDI: ' + (M.backend.engine ? 'read by the GlowBop engine (' + M.backend.kind + ')' : 'engine cannot read MIDI (' + (M.backend.reason || '?') + ')') +
      (M.backend.relay.length ? ' · browser relay: ' + M.backend.relay.length : '') + ' · VirtualDJ: ' + (os.on ? 'port ' + os.port + (os.advertised ? ', discoverable' : '') : 'off');
    if (learning) markMappable();
  }

  // ------------------------------------------------------------------ mappings list
  function openMaps() {
    const s = document.createElement('div'); s.className = 'sheet mi-sheet';
    let arm = 0;
    const draw = () => {
      const maps = (M && M.mappings) || [], tg = {}; ((M && M.targets) || []).forEach(t => tg[t.id] = t);
      const groups = {};
      maps.forEach(m => { const g = (tg[m.target] || {}).group || 'More'; (groups[g] = groups[g] || []).push(m); });
      s.innerHTML = `<div><div class="ph" style="--c:var(--violet)"><span>Mappings</span><span class="r">${maps.length}</span></div>
        ${maps.length ? '' : '<p class="note">Nothing mapped yet. Use a controller layout, or long-press any pad and press a button on your controller.</p>'}
        ${Object.keys(groups).map(g => `<div class="mi-grp">${esc(g)}</div><div class="list">${groups[g].map((m, i) => `<div class="item"><div class="tx"><b>${esc(m.tlabel)}</b><small>${esc(m.label)} · ${esc(m.port || 'any controller')}${m.mode === 'toggle' ? ' · latch' : ''}${m.pro && GB.pro === false ? ' · Pro DJ' : ''}</small></div><button class="btn sm danger" data-k="${esc(m.key)}" data-p="${esc(m.port || '')}" aria-label="Remove">${GB.svg('trash')}</button></div>`).join('')}</div>`).join('')}
        <div class="row">${maps.length ? '<button class="btn danger" id="miClr">Clear all</button>' : ''}<button class="btn ghost" id="miMx">Close</button></div></div>`;
      s.querySelectorAll('.item .btn[data-k]').forEach(b => b.onclick = async () => { if (await post({unmap: {key: b.dataset.k, port: b.dataset.p || null}})) { await load(); draw(); } });
      const c = s.querySelector('#miClr'); if (c) c.onclick = async () => {
        if (Date.now() - arm > 3000) { arm = Date.now(); c.textContent = 'Tap again to clear all'; return; }
        if (await post({clear: true})) { await load(); draw(); GB.toast('Mappings cleared'); }
      };
      s.querySelector('#miMx').onclick = () => s.remove();
    };
    s.onclick = e => { if (e.target === s) s.remove(); };
    document.body.appendChild(s); draw();
  }

  // ------------------------------------------------------------------ test my controller (live monitor + 30 s capture)
  let monT = 0, monSince = 0, capT = 0;
  function openTest(on) {
    $('miTestBox').hidden = !on; clearTimeout(monT);
    if (!on) return;
    $('miMon').innerHTML = ''; monSince = 0; $('miCapForm').hidden = true;
    $('miTestBox').scrollIntoView({behavior: 'smooth', block: 'nearest'});
    const tick = async () => {
      if ($('miTestBox').hidden) return;
      try {
        const mo = await GB.get('/api/midi/monitor?since=' + monSince); monSince = mo.seq;
        const mon = $('miMon'), atEnd = mon.scrollTop + mon.clientHeight >= mon.scrollHeight - 8;
        mo.items.forEach(x => { const d = document.createElement('div');
          d.innerHTML = `<span class="t">${x.t.toFixed(2)}</span> <span class="p">${esc((x.port || '').replace(/ \(browser\)$/, '').slice(0, 18))}</span> <span class="r">${esc(x.raw || '')}</span> ${esc(x.text || '')}${x.to ? ` <span class="m">→ ${esc(x.to)}</span>` : ''}${x.note ? ` <span class="n">${esc(x.note)}</span>` : ''}`;
          mon.appendChild(d); });
        while (mon.children.length > 300) mon.firstChild.remove();
        if (atEnd) mon.scrollTop = mon.scrollHeight;
        const r = Object.entries(mo.rates || {}).map(([p, v]) => `${p.replace(/ \(browser\)$/, '')}: ${Object.entries(v).map(([k, n]) => k + ' ' + n + '/s').join(', ')}`);
        const b = mo.sync || {};
        $('miRates').textContent = (r.join(' · ') || 'No messages yet.') + (b.clock ? ` · clock ${b.clock.bpm} BPM (${b.clock.state})` : '') + ' · beat from ' + (SRC[b.src] || 'AUDIO');
        const c = mo.capture;
        if (c && !c.done && c.left > 0) { $('miTR').textContent = 'RECORDING ' + Math.ceil(c.left) + ' S'; $('miCapBar').firstChild.style.width = (100 - c.left / 30 * 100) + '%'; }
        else if (c && c.done && capT) { capT = 0; $('miTR').textContent = 'READY TO SEND'; $('miCapBar').firstChild.style.width = '100%'; $('miCapForm').hidden = false; $('miCapGo').disabled = false;
          $('miCapEm').value = $('miCapEm').value || GB.store.get('gb_fb_email', ''); }
        else if (!capT) $('miTR').textContent = 'LIVE';
      } catch (e) {}
      monT = setTimeout(tick, 300);
    };
    tick();
  }
  async function startCapture() {
    if (!(await post({capture: 30}))) return;
    capT = 1; $('miCapBar').hidden = false; $('miCapBar').firstChild.style.width = '0'; $('miCapGo').disabled = true; $('miCapForm').hidden = true;
    GB.toast('🔴 Recording 30 s: press every pad, move every fader');
  }
  async function sendCapture() {
    const email = $('miCapEm').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { GB.toast('⚠️ Please add your email so we can reply'); $('miCapEm').focus(); return; }
    GB.store.set('gb_fb_email', email);
    const r = await GB.post('/api/midi/report', {email, message: $('miCapMsg').value.trim()});
    if (!r) return;
    if (r.ok === false) { GB.toast('⚠️ ' + (r.error || 'Not sent')); return; }
    GB.sfx('ok'); GB.toast(r.sent ? '📨 Sent to GlowBop support' + (r.ticket ? ' (' + r.ticket + ')' : '') : '📨 Saved: it sends when this computer is online');
    $('miCapForm').hidden = true; $('miCapBar').hidden = true; $('miTR').textContent = 'SENT';
  }

  // ------------------------------------------------------------------ Web MIDI relay (only when the engine cannot read MIDI itself)
  let RL = null;
  function relayCheck() {
    if (RL || !B || B.engine || !navigator.requestMIDIAccess) return;
    if (!GB.local && GB.store.get('gb_midi_relay', '') !== '1') return;
    if (relayCheck.tried) return; relayCheck.tried = true;
    startRelay();
  }
  async function startRelay() {
    let acc = null;
    try { acc = await navigator.requestMIDIAccess({sysex: true}); } catch (e) { try { acc = await navigator.requestMIDIAccess(); } catch (e2) { return; } }
    const id = 'r' + Math.random().toString(36).slice(2, 8);
    RL = {acc, id, q: [], ins: [], outs: [], use: true};
    let busy = false, timer = 0;
    const kick = () => { if (!busy) { clearTimeout(timer); loop(); } };
    const wire = () => {
      RL.ins = [...acc.inputs.values()]; RL.outs = [...acc.outputs.values()];
      RL.ins.forEach((inp, i) => { inp.onmidimessage = e => { if (!RL.use) return; RL.q.push([i, e.timeStamp, Array.from(e.data)]); if (e.data[0] < 0xF8) kick(); }; });
      kick();
    };
    const loop = async () => {
      busy = true; const msgs = RL.q.splice(0, 2000); let next = 2000;
      try {
        const r = await fetch('/api/midi/relay', {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({client: RL.id, ua: navigator.userAgent.slice(0, 60), now: performance.now(), msgs, ports: {in: RL.ins.map(p => p.name), out: RL.outs.map(p => p.name)}})});
        const j = await r.json();
        RL.use = j.use !== false;
        (j.out || []).forEach(([i, d]) => { const o = RL.outs[i]; if (o) try { o.send(d); } catch (e) {} });
        next = RL.q.length || (j.out || []).length ? 20 : RL.use ? 200 : 3000;      // clock ticks ride along every 200 ms with their own times
      } catch (e) {}
      busy = false; timer = setTimeout(loop, next);
    };
    acc.onstatechange = wire; wire();
  }
})();
