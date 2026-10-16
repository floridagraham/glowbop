/* 🎬 CUES page (GlowBop Pro DJ): named cue lists, one per event, run with a big GO. Talks to /api/cues (prodj.py).
   A cue = a Scene, an Autoloop, or Blackout / Interlude / Back to Auto, with a fade time (the crossfade into it) and a note
   ("Grand Entrance", "First Dance", "Cake", "Last Song"). GO fires the next cue, BACK the one before, RESET goes to the top.
   Laptop: SPACE = GO and SHIFT+SPACE = BACK while this page is open (not while typing).
   EDIT: add cues, change one (tap it), move it up or down, delete it. Controls carry data-ctl ids for MIDI (cue.go ...). */
(function () {
  'use strict';
  const {$, esc} = GB;
  const MINT = '#7dffb2';
  const TYPES = [['scene', 'save', 'Scene', '#8fd3ff'], ['loop', 'loop', 'Autoloop', '#3fb6ff'], ['blackout', 'dark', 'Blackout', 'var(--peri)'],
                 ['interlude', 'mic', 'Interlude', 'var(--lav)'], ['auto', 'note', 'Back to Auto', 'var(--green)']];
  const TY = Object.fromEntries(TYPES.map(t => [t[0], t]));
  const FADES = [[0, 'Cut'], [0.5, '0.5 s'], [1, '1 s'], [2, '2 s'], [4, '4 s']];
  const NOTES = ['Grand Entrance', 'First Dance', 'Cake', 'Speeches', 'Party Time', 'Last Song'];
  let C = null, edit = false;
  GB.pdjPost = GB.pdjPost || (async (p, b) => { const j = await GB.post(p, b); if (j) GB.emit('prodj', j); return j; });
  const post = GB.pdjPost;

  GB.css(`
  #pg-cues { --c:${MINT}; }
  #cuPanel { container-type:inline-size; }
  .cu-top { display:flex; gap:8px; align-items:center; }
  .cu-top select { flex:1 1 auto; min-width:0; }
  .cu-top .btn { flex:0 0 auto; padding:0 12px; }
  .cu-nn { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:8px; }
  .cu-box { background:var(--dark2); border-radius:0 14px 0 14px; padding:10px 12px; min-width:0; border-left:4px solid var(--bc, var(--line)); }
  .cu-box .k { font:600 calc(11px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); }
  .cu-box .v { font:700 calc(19px * var(--fs, 1))/1.1 var(--cond); text-transform:uppercase; letter-spacing:.5px; margin-top:3px; overflow-wrap:anywhere; }
  .cu-box .n { font-size:calc(13px * var(--fs, 1)); color:var(--dim); margin-top:2px; overflow-wrap:anywhere; }
  .cu-box.now { --bc:${MINT}; } .cu-box.now .v { color:${MINT}; }
  .cu-go { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 3fr); gap:8px; }
  #cuGo { min-height:calc(116px * var(--fs, 1)); font-size:calc(40px * var(--fs, 1)); letter-spacing:6px; border-radius:0 26px 0 26px; background:${MINT}; color:#000; box-shadow:0 0 34px -8px ${MINT}; }
  #cuGo .ic { width:34px; height:34px; } #cuGo:disabled { opacity:.35; box-shadow:none; }
  #cuGo.flash { animation:cuFlash .45s ease-out; } @keyframes cuFlash { 0% { filter:brightness(2); box-shadow:0 0 60px 6px ${MINT}; } }
  #cuBack { min-height:calc(116px * var(--fs, 1)); border-radius:0 18px 0 18px; flex-direction:column; gap:4px; }
  .cu-list { display:flex; flex-direction:column; gap:5px; }
  .cu-row { display:grid; grid-template-columns:calc(34px * var(--fs, 1)) calc(30px * var(--fs, 1)) minmax(0, 1fr) auto; align-items:center; gap:8px; min-height:52px; padding:6px 10px;
    background:var(--dark2); border-radius:0 12px 0 12px; border-left:4px solid transparent; cursor:default; }
  .cu-row .no { font:calc(16px * var(--fs, 1)) var(--mono); color:var(--dim); text-align:right; }
  .cu-row .ty { display:flex; color:var(--tc); } .cu-row .ty .ic { width:22px; height:22px; filter:drop-shadow(0 0 5px var(--tc)); }
  .cu-row .tx { min-width:0; } .cu-row .tx b { display:block; font:700 calc(16px * var(--fs, 1))/1.15 var(--cond); letter-spacing:.5px; text-transform:uppercase; overflow-wrap:anywhere; }
  .cu-row .tx small { display:block; color:var(--dim); font-size:calc(13px * var(--fs, 1)); overflow-wrap:anywhere; }
  .cu-row .fd { font:calc(12px * var(--fs, 1)) var(--mono); color:var(--dim); white-space:nowrap; }
  .cu-row .ed { display:none; gap:4px; } .cu-row .ed .btn { min-height:40px; padding:0 10px; }
  .cu-row.cur { border-left-color:${MINT}; background:color-mix(in srgb, ${MINT} 16%, var(--dark2)); } .cu-row.cur .no { color:${MINT}; }
  .cu-row.nxt { border-left-color:color-mix(in srgb, ${MINT} 45%, transparent); }
  .cu-row.done { opacity:.6; }
  #cuPanel.edit .cu-row { grid-template-columns:calc(34px * var(--fs, 1)) calc(30px * var(--fs, 1)) minmax(0, 1fr) auto; cursor:pointer; box-shadow:inset 0 0 0 1px var(--lav); }
  #cuPanel.edit .cu-row .ed { display:flex; } #cuPanel.edit .cu-row .fd { display:none; }
  .cu-tools { display:flex; gap:8px; flex-wrap:wrap; } .cu-tools .btn { flex:1 1 auto; }
  #cuEdit.on { background:var(--lav); color:#000; }
  .cu-sheet .tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(calc(96px * var(--fs, 1)), 1fr)); gap:6px; }
  .cu-sheet .tile { min-height:64px; }
  .cu-sheet .row { display:flex; gap:6px; flex-wrap:wrap; } .cu-sheet .row .btn { flex:1 1 0; min-width:0; padding:0 8px; }
  @container (max-width: 420px) { .cu-nn { grid-template-columns:minmax(0, 1fr); } .cu-row { gap:6px; padding:6px 8px; } }
  @media (prefers-reduced-motion: reduce) { #cuGo.flash { animation:none; } }
  `);

  async function load() { if (GB.pro !== true) return; try { C = await GB.get('/api/cues'); paint(); } catch (e) {} }
  GB.on('prodj', j => { if (j && j.lists) { C = j; paint(); } else if (j && j.cue && C) { C.cue = j.cue; paintNow(); } });
  let seen = null;
  GB.on('status', s => { const pd = s.prodj; if (!pd || !C) return; const k = JSON.stringify(pd.cue);
    if (seen !== null && k !== seen && GB.page === 'cues') { if (!pd.cue || !C.cue || pd.cue.n !== C.cue.n || pd.cue.list !== C.cue.list) load(); else { C.cue = pd.cue; paintNow(); } } seen = k; });

  GB.panel('cues', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', MINT); el.id = 'cuPanel';
    el.innerHTML = `<div class="ph"><span>Cue list</span><span class="r" id="cuR">–</span></div>
      <div class="cu-top"><select id="cuList" aria-label="Cue list"></select><button class="btn sm" id="cuNew" aria-label="New cue list">${GB.svg('add')}<span>New</span></button><button class="btn sm" id="cuMore" aria-label="Rename or delete this list">${GB.svg('edit')}</button></div>
      <div class="cu-nn"><div class="cu-box now"><div class="k">NOW</div><div class="v" id="cuNowV">Nothing yet</div><div class="n" id="cuNowN"></div></div>
        <div class="cu-box nxt" id="cuNxtBox"><div class="k">NEXT</div><div class="v" id="cuNxtV">–</div><div class="n" id="cuNxtN"></div></div></div>
      <div class="cu-go"><button class="btn" id="cuBack" data-ctl="cue.back" aria-label="Back one cue">${GB.svg('prev')}<span>Back</span></button><button class="btn" id="cuGo" data-ctl="cue.go">${GB.svg('play')}<span>GO</span></button></div>
      <div class="cu-tools"><button class="btn sm" id="cuReset" data-ctl="cue.reset">${GB.svg('reset')}<span>To the top</span></button><button class="btn sm" id="cuBo" data-ctl="cue.blackout" style="--c:var(--peri)">${GB.svg('dark')}<span>Blackout</span></button>
        <button class="btn sm" id="cuEdit" style="--c:var(--lav)">${GB.svg('edit')}<span>Edit cues</span></button><button class="btn sm c" id="cuAdd" style="--c:${MINT}" hidden>${GB.svg('add')}<span>Add cue</span></button></div>
      <div class="cu-list" id="cuRows"><p class="note">Loading…</p></div>
      <p class="note">Plan the event top to bottom, then tap GO for each moment. Each cue crossfades in over its fade time. Laptop: space bar = GO, Shift + space = Back.</p>`;
    $('cuGo').onclick = go; $('cuBack').onclick = back;
    $('cuReset').onclick = () => post('/api/cues', {reset: true}).then(j => j && GB.toast('⏮ Back to the top of the list'));
    $('cuBo').onclick = () => { const on = !((GB.status.prodj || {}).blackout > 0.5); post('/api/cues', {blackout: on, fade: 0.5}); };
    $('cuEdit').onclick = () => { edit = !edit; el.classList.toggle('edit', edit); $('cuEdit').classList.toggle('on', edit); GB.lbl($('cuEdit'), edit ? 'check' : 'edit', edit ? 'Done' : 'Edit cues'); $('cuAdd').hidden = !edit; };
    $('cuAdd').onclick = () => cueSheet(null);
    $('cuList').onchange = () => post('/api/cues', {list: $('cuList').value});
    $('cuNew').onclick = () => nameSheet('New cue list', '', 'Smith Wedding', async n => post('/api/cues', {new_list: {name: n}}));
    $('cuMore').onclick = () => listSheet();
    GB.proGate(el, 'Cues');
  });

  async function go() {
    const b = $('cuGo'); if (b.disabled) return;
    const j = await post('/api/cues', {go: true});
    if (j) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); const c = j.cue && j.cue.cur; if (c) GB.toast('🎬 ' + (c.note || c.label)); }
  }
  async function back() { const j = await post('/api/cues', {back: true}); if (j && j.cue && j.cue.cur) GB.toast('⏪ ' + (j.cue.cur.note || j.cue.cur.label)); }
  const typing = e => { const a = e.target; return a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable || (a.closest && a.closest('.sheet'))); };
  document.addEventListener('keydown', e => {
    if (GB.page !== 'cues' || GB.pro !== true || e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); if (e.repeat) return; if (e.shiftKey) back(); else go(); }
  });

  const label = c => c ? (c.label || (TY[c.type] || [0, 0, c.type])[2]) : '';
  function paint() {
    if (!C || !$('cuRows')) return;
    const sel = $('cuList'); sel.innerHTML = C.lists.map(l => `<option value="${esc(l.id)}">${esc(l.name)} (${l.n})</option>`).join(''); sel.value = C.active;
    const rows = $('cuRows'); rows.innerHTML = '';
    if (!C.cues.length) rows.innerHTML = '<p class="note">No cues yet. Tap Edit cues, then Add cue. Save a few scenes on AUTO LOOPS first if you want them here.</p>';
    C.cues.forEach((c, i) => {
      const t = TY[c.type] || TYPES[0], r = document.createElement('div'); r.className = 'cu-row'; r.dataset.i = i; r.style.setProperty('--tc', t[3]);
      r.innerHTML = `<span class="no">${i + 1}</span><span class="ty">${GB.svg(t[1])}</span><div class="tx"><b>${esc(c.note || label(c))}</b><small>${esc(c.note && label(c) !== t[2] ? t[2] + ': ' + label(c) : t[2])}</small></div>
        <span class="fd">${c.fade ? c.fade + ' s' : 'CUT'}</span><span class="ed"><button class="btn sm" data-a="up" aria-label="Move up" ${i ? '' : 'disabled'}>${GB.svg('up')}</button><button class="btn sm" data-a="dn" aria-label="Move down" ${i < C.cues.length - 1 ? '' : 'disabled'}>${GB.svg('down')}</button></span>`;
      r.onclick = e => { if (!edit) return; const a = e.target.closest('[data-a]');
        if (a) { e.stopPropagation(); post('/api/cues', {move: c.id, to: i + (a.dataset.a === 'up' ? -1 : 1)}); return; }
        cueSheet(c, i); };
      rows.appendChild(r);
    });
    paintNow();
  }
  function paintNow() {
    if (!C || !C.cue || !$('cuNowV')) return;
    const q = C.cue, cur = q.cur, nx = q.next;
    $('cuR').textContent = (q.pos >= 0 ? 'CUE ' + (q.pos + 1) : 'READY') + ' / ' + q.n;
    $('cuNowV').textContent = cur ? (cur.i + 1) + '. ' + (cur.note || label(cur)) : 'Nothing yet'; $('cuNowN').textContent = cur && cur.note ? label(cur) : '';
    $('cuNxtV').textContent = nx ? (nx.i + 1) + '. ' + (nx.note || label(nx)) : (q.n ? 'End of the list' : 'Add some cues'); $('cuNxtN').textContent = nx ? (nx.note ? label(nx) + ' · ' : '') + (nx.fade ? nx.fade + ' s fade' : 'cut') : '';
    $('cuNxtBox').style.setProperty('--bc', nx ? (TY[nx.type] || TYPES[0])[3] : 'var(--line)');
    $('cuGo').disabled = !nx; $('cuBack').disabled = !(q.pos > 0);
    document.querySelectorAll('#cuRows .cu-row').forEach(r => { const i = +r.dataset.i; r.classList.toggle('cur', i === q.pos); r.classList.toggle('nxt', i === q.pos + 1); r.classList.toggle('done', i < q.pos); });
    const bo = (GB.status.prodj || {}).blackout > 0.5; $('cuBo').classList.toggle('on', bo);
  }

  // ------------------------------------------------------------------ sheets
  function nameSheet(title, val, ph, save) {
    const s = document.createElement('div'); s.className = 'sheet cu-sheet';
    s.innerHTML = `<div><div class="ph" style="--c:${MINT}"><span>${esc(title)}</span></div><label class="field">Name<input type="text" maxlength="28" autocomplete="off" placeholder="${esc(ph)}"></label>
      <div class="row"><button class="btn c" style="--c:${MINT}" data-a="ok">Save</button><button class="btn ghost" data-a="x">Cancel</button></div></div>`;
    document.body.appendChild(s); const inp = s.querySelector('input'); inp.value = val || '';
    const ok = async () => { if (await save(inp.value.trim())) s.remove(); };
    s.querySelector('[data-a=ok]').onclick = ok; s.querySelector('[data-a=x]').onclick = () => s.remove(); s.onclick = e => { if (e.target === s) s.remove(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
  }
  function listSheet() {
    const L = C && C.lists.find(l => l.id === C.active); if (!L) return;
    GB.sheet('Cue list: ' + L.name, [
      {label: 'Rename this list', ic: 'edit', onclick: () => nameSheet('Rename cue list', L.name, '', n => post('/api/cues', {rename_list: L.id, name: n}))},
      {label: 'Delete this list', ic: 'trash', sub: L.n + ' cues', onclick: () => { if (C.lists.length < 2) return GB.toast('Keep at least one cue list'); GB.sheet('Delete "' + L.name + '"?', [{label: 'Yes, delete it', ic: 'trash', onclick: () => post('/api/cues', {delete_list: L.id})}]); }},
    ]);
  }
  function cueSheet(c, idx) {
    const cue = Object.assign({type: 'scene', fade: 1, note: ''}, c || {});
    if (!c && !(C.scenes || []).length) cue.type = 'loop';
    const s = document.createElement('div'); s.className = 'sheet cu-sheet';
    s.innerHTML = `<div><div class="ph" style="--c:${MINT}"><span>${c ? 'Cue ' + (idx + 1) : 'Add a cue'}</span></div>
      <div class="sub">What happens</div><div class="tiles" id="cuTy">${TYPES.map(([v, ic, n, col]) => `<button class="tile" data-v="${v}" style="--c:${col}"><span class="em">${GB.svg(ic)}</span>${n}</button>`).join('')}</div>
      <label class="field" id="cuRefF">Which one<select id="cuRef"></select></label>
      <div class="sub">Fade into it</div><div class="seg" id="cuFd">${FADES.map(([v, n]) => `<button class="btn" data-v="${v}" style="--c:${MINT}">${n}</button>`).join('')}</div>
      <label class="field">Note<input type="text" id="cuNote" maxlength="40" autocomplete="off" placeholder="First Dance"></label>
      <div class="chips">${NOTES.map(n => `<button class="chip" data-n="${n}" style="--c:${MINT}">${n}</button>`).join('')}</div>
      <div class="row"><button class="btn c" id="cuSv" style="--c:${MINT}">${c ? 'Save' : 'Add cue'}</button>${c ? `<button class="btn" id="cuFire">${GB.svg('play')}<span>Fire now</span></button><button class="btn danger" id="cuDel">${GB.svg('trash')}<span>Delete</span></button>` : ''}<button class="btn ghost" id="cuX">Cancel</button></div></div>`;
    document.body.appendChild(s);
    const ref = s.querySelector('#cuRef'), note = s.querySelector('#cuNote'); note.value = cue.note || '';
    const fillRef = () => {
      const opts = cue.type === 'scene' ? (C.scenes || []).map(x => [x.id, x.name]) : cue.type === 'loop' ? (C.loops || []).map(x => [x.id, x.id + '  ' + x.name]) : [];
      s.querySelector('#cuRefF').hidden = !opts.length && cue.type !== 'scene';
      ref.innerHTML = opts.length ? opts.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('') : '<option value="">No scenes saved yet</option>';
      if (opts.some(o => o[0] === cue.ref)) ref.value = cue.ref; else cue.ref = opts.length ? opts[0][0] : null;
    };
    const paintS = () => {
      s.querySelectorAll('#cuTy .tile').forEach(t => t.classList.toggle('on', t.dataset.v === cue.type));
      s.querySelectorAll('#cuFd .btn').forEach(b => b.classList.toggle('on', +b.dataset.v === +cue.fade));
      fillRef();
    };
    s.querySelectorAll('#cuTy .tile').forEach(t => t.onclick = () => { cue.type = t.dataset.v; paintS(); });
    s.querySelectorAll('#cuFd .btn').forEach(b => b.onclick = () => { cue.fade = +b.dataset.v; paintS(); });
    s.querySelectorAll('.chip').forEach(ch => ch.onclick = () => { note.value = ch.dataset.n; });
    ref.onchange = () => { cue.ref = ref.value; };
    s.querySelector('#cuX').onclick = () => s.remove(); s.onclick = e => { if (e.target === s) s.remove(); };
    s.querySelector('#cuSv').onclick = async () => {
      if ((cue.type === 'scene' || cue.type === 'loop') && !cue.ref) return GB.toast('Save a scene on AUTO LOOPS first');
      const body = {type: cue.type, fade: cue.fade, note: note.value.trim()}; if (cue.ref && (cue.type === 'scene' || cue.type === 'loop')) body.ref = cue.ref;
      const j = await post('/api/cues', c ? {update: Object.assign({id: c.id}, body)} : {add: body});
      if (j) { s.remove(); GB.sfx('ok'); }
    };
    if (c) {
      s.querySelector('#cuFire').onclick = async () => { if (await post('/api/cues', {jump: idx})) s.remove(); };
      let armed = false; const d = s.querySelector('#cuDel');
      d.onclick = async () => { if (!armed) { armed = true; GB.lbl(d, 'trash', 'Tap again'); return; } if (await post('/api/cues', {remove: c.id})) s.remove(); };
    }
    paintS();
  }

  GB.on('page', id => { if (id === 'cues') load(); });
  GB.on('ready', () => { if (GB.page === 'cues') load(); });
  GB.on('pro', v => { if (v && GB.page === 'cues') load(); });
})();
