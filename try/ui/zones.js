/* 🎯 Zones + 🎨 Palettes (GlowBop Pro DJ). Talks to /api/zones and /api/palettes (prodj.py).
   OVERRIDE page, above the keys: zone chips (ALL, LEFT, RIGHT, TOP, BOTTOM, CENTER, ODD, EVEN, each curtain, and any named
   zone from the layout editor). The override keys then take only that zone.
   LIVE BOARD, under the fader board: the palette strip (tap one: the show, Autoloops and auto shows switch to those colours
   until you tap Clear; "+ New" builds one from the colour wheel or any colours), then a fader per zone (zone submasters).
   Controls carry data-ctl ids for MIDI: zone.<id>, sub.<id>, palette.<id>, palette.clear. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const TEAL = '#4de8c8';
  let Z = null, P = null;
  GB.pdjPost = GB.pdjPost || (async (p, b) => { const j = await GB.post(p, b); if (j) GB.emit('prodj', j); return j; });
  const post = GB.pdjPost;

  GB.css(`
  #znPanel { container-type:inline-size; }
  #znPanel .chips { display:grid; grid-template-columns:repeat(auto-fill, minmax(calc(104px * var(--fs, 1)), 1fr)); gap:6px; }
  #znPanel .chip { --c:${TEAL}; min-height:42px; padding:0 10px; font-weight:700; letter-spacing:1px; min-width:0; justify-content:flex-start; }
  #znPanel .chip span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
  @container (max-width: 420px) { #znPanel .chips { grid-template-columns:repeat(4, minmax(0, 1fr)); gap:5px; } #znPanel .chip { padding:0 4px; justify-content:center; font-size:calc(13px * var(--fs, 1)); letter-spacing:0; }
    #znPanel .chip .zn-mini, #znPanel .chip > .ic { display:none; } #znPanel .chip.w2 { grid-column:span 2; } #znPanel .note { display:none; } }
  #znPanel .chip.cur { box-shadow:inset 0 0 0 2px color-mix(in srgb, ${TEAL} 55%, transparent); }
  #znPanel .chip.ex { box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--gold) 55%, transparent); }
  .zn-mini { display:inline-grid; grid-template-columns:repeat(4, 5px); grid-template-rows:repeat(3, 5px); gap:1px; margin-right:2px; }
  .zn-mini i { background:currentColor; opacity:.22; border-radius:1px; } .zn-mini i.m { opacity:1; }
  #znSubs .zs { display:grid; grid-template-columns:repeat(auto-fill, minmax(calc(150px * var(--fs, 1)), 1fr)); gap:10px 14px; }
  #znSubs .lv { --c:${TEAL}; } #znSubs .lv > b { color:${TEAL}; }
  #znSubs .lv.low > b { color:var(--amber); }
  #palPanel .pl-strip { display:grid; grid-template-columns:repeat(auto-fill, minmax(calc(118px * var(--fs, 1)), 1fr)); gap:7px; }
  .pl-sw { appearance:none; border:0; position:relative; min-width:0; min-height:62px; padding:0; border-radius:0 12px 0 12px; overflow:hidden; cursor:pointer; background:var(--dark2);
    display:flex; flex-direction:column; color:var(--text); box-shadow:inset 0 0 0 1px var(--line); }
  .pl-sw .bars { display:flex; flex:1 1 auto; min-height:34px; } .pl-sw .bars i { flex:1; }
  .pl-sw .nm { font:700 calc(12px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; text-transform:uppercase; padding:6px 8px; text-align:left; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pl-sw.on { box-shadow:0 0 0 3px #fff, 0 0 20px -2px var(--pink); } .pl-sw.on .nm { background:#fff; color:#000; }
  .pl-sw .mine { position:absolute; top:4px; right:5px; width:8px; height:8px; border-radius:50%; background:#000; box-shadow:0 0 0 2px #fff; }
  .pl-top { display:flex; gap:8px; flex-wrap:wrap; } .pl-top .btn { flex:1 1 auto; }
  #palClear:not(:disabled) { background:var(--pink); color:#000; }
  .pl-sheet .cols { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .pl-sheet .cl { position:relative; } .pl-sheet input[type=color] { width:54px; height:54px; padding:0; border:2px solid var(--dark); border-radius:12px; background:none; }
  .pl-sheet .cl button { position:absolute; top:-8px; right:-8px; width:24px; height:24px; min-height:0; padding:0; border-radius:50%; }
  .pl-sheet .cl button .ic { width:14px; height:14px; }
  .pl-sheet .row { display:flex; gap:6px; flex-wrap:wrap; } .pl-sheet .row .btn { flex:1 1 0; min-width:0; padding:0 8px; }
  .pl-sheet .prev { display:flex; height:30px; border-radius:8px; overflow:hidden; } .pl-sheet .prev i { flex:1; }
  `);

  // little wall diagrams for the chips (4 x 3 cells)
  const MINI = {all: '111111111111', left: '110011001100', right: '001100110011', top: '111100000000', bottom: '000000001111', center: '000001100000', odd: '101010101010', even: '010101010101'};
  const mini = id => MINI[id] ? `<span class="zn-mini" aria-hidden="true">${[...MINI[id]].map(c => `<i class="${c === '1' ? 'm' : ''}"></i>`).join('')}</span>` : GB.svg(id.startsWith('z:') ? 'map' : 'corner');

  async function loadZ() { if (GB.pro !== true) return; try { Z = await GB.get('/api/zones'); paintZ(); } catch (e) {} }
  async function loadP() { if (GB.pro !== true) return; try { P = await GB.get('/api/palettes'); paintP(); } catch (e) {} }
  GB.on('prodj', j => { if (!j) return; if (j.list) { Z = j; } else if (Z && j.zones) Z.zones = j.zones; if (j.palettes) P = j; else if (P && 'palette' in j) P.palette = j.palette; paintZ(); paintP(); });
  GB.on('status', s => { const pd = s.prodj; if (!pd) return; if (Z) Z.zones = pd.zones; if (P) P.palette = pd.palette; paintZsel(); paintPsel(); });

  // ------------------------------------------------------------------ OVERRIDE: target zone chips
  GB.panel('ops', 5, el => {
    el.classList.add('box'); el.style.setProperty('--c', TEAL); el.id = 'znPanel';
    el.innerHTML = `<div class="ph"><span>Override target</span><span class="r" id="znR">WHOLE WALL</span></div>
      <div class="chips" id="znChips"></div>
      <p class="note">Pick a zone and the override keys below only take that part of the wall. ALL = the whole wall.</p>`;
    GB.proGate(el, 'Zones', {chip: false});
  });
  function paintZ() {
    if (!Z || !$('znChips')) return;
    const list = Z.list || [], box = $('znChips'), sig = JSON.stringify(list);
    if (box._sig !== sig) {
      box._sig = sig; box.innerHTML = '';
      list.forEach(z => { const c = document.createElement('button'); c.className = 'chip' + (z.extra ? ' ex' : '') + (z.id.includes(':') ? ' w2' : ''); c.dataset.z = z.id; c.dataset.ctl = 'zone.' + z.id;
        c.innerHTML = mini(z.id) + '<span>' + esc(z.name) + '</span>'; c.title = z.id.startsWith('c:') ? 'One curtain' : z.extra ? 'A zone from your layout' : '';
        c.onclick = async () => { const j = await post('/api/zones', {target: z.id}); if (j) GB.toast(z.id === 'all' ? '🎯 Overrides take the whole wall' : '🎯 Overrides take ' + z.name); };
        box.appendChild(c); });
      buildSubs();
    }
    paintZsel();
  }
  function paintZsel() {
    if (!Z || !Z.zones) return;
    const t = Z.zones.target || 'all';
    document.querySelectorAll('#znChips .chip').forEach(c => c.classList.toggle('on', c.dataset.z === t));
    const r = $('znR'); if (r) { const z = (Z.list || []).find(x => x.id === t); r.textContent = t === 'all' ? 'WHOLE WALL' : (z ? z.name : t).toUpperCase() + ' ONLY'; r.style.color = t === 'all' ? '' : TEAL; }
    const subs = Z.zones.subs || {};
    document.querySelectorAll('#znSubs input[type=range]').forEach(i => { if (document.activeElement === i || i._drag) return; const v = subs[i.dataset.z] == null ? 100 : subs[i.dataset.z];
      if (+i.value !== v) { i.value = v; GB.paintRange(i); } const b = i.parentNode.querySelector('b'); b.textContent = Math.round(v) + '%'; i.parentNode.classList.toggle('low', v < 100); });
    const rs = $('znReset'); if (rs) rs.disabled = !Object.keys(subs).length;
    const zr = $('znSubR'); if (zr) { const n = Object.keys(subs).length; zr.textContent = n ? n + ' DOWN' : 'ALL FULL'; zr.style.color = n ? 'var(--amber)' : ''; }
  }

  // ------------------------------------------------------------------ LIVE BOARD: palette strip (under the colour wheel)
  GB.panel('board', 11, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)'); el.id = 'palPanel';
    el.innerHTML = `<div class="ph"><span>Palettes</span><span class="r" id="palR">SHOW COLOURS</span></div>
      <div class="pl-strip" id="palStrip"><p class="note">Loading…</p></div>
      <div class="pl-top"><button class="btn sm" id="palClear" data-ctl="palette.clear" disabled>${GB.svg('close')}<span>Clear</span></button><button class="btn sm" id="palNew" style="--c:var(--pink)">${GB.svg('add')}<span>New palette</span></button><button class="btn sm" id="palEdit">${GB.svg('edit')}<span>Mine</span></button></div>
      <p class="note">Tap a palette and the whole show, the Autoloops and the auto shows use those colours until you tap Clear. New palette: grab colours from the COLOR fader's wheel or pick any.</p>`;
    $('palClear').onclick = async () => { if (await post('/api/palettes', {clear: true})) GB.toast('🎨 Back to the show\'s own colours'); };
    $('palNew').onclick = () => newPalette();
    $('palEdit').onclick = () => { const mine = ((P && P.palettes) || []).filter(p => !p.builtin);
      if (!mine.length) return GB.toast('No palettes of your own yet: tap New palette');
      GB.sheet('Your palettes', mine.map(p => ({label: 'Delete ' + p.name, ic: 'trash', sub: p.colors.join(' '), onclick: () => post('/api/palettes', {delete: p.id})}))); };
    GB.proGate(el, 'Palettes');
  });
  function paintP() {
    if (!P || !$('palStrip')) return;
    const box = $('palStrip'), list = P.palettes || [], sig = JSON.stringify(list);
    if (box._sig !== sig) {
      box._sig = sig; box.innerHTML = '';
      list.forEach(p => { const b = document.createElement('button'); b.className = 'pl-sw'; b.dataset.id = p.id; b.dataset.ctl = 'palette.' + p.id;
        b.setAttribute('aria-label', 'Palette ' + p.name);
        b.innerHTML = `<span class="bars">${p.colors.map(c => `<i style="background:${esc(c)}"></i>`).join('')}</span><span class="nm">${esc(p.name)}</span>${p.builtin ? '' : '<span class="mine" title="Yours"></span>'}`;
        b.onclick = async () => { const on = P.palette === p.id; const j = await post('/api/palettes', on ? {clear: true} : {use: p.id, fade: 1}); if (j) GB.toast(on ? '🎨 Back to the show\'s own colours' : '🎨 ' + p.name); };
        box.appendChild(b); });
    }
    paintPsel();
  }
  function paintPsel() {
    if (!P) return;
    document.querySelectorAll('#palStrip .pl-sw').forEach(b => b.classList.toggle('on', b.dataset.id === P.palette));
    const c = $('palClear'); if (c) c.disabled = !P.palette;
    const r = $('palR'); if (r) { const p = (P.palettes || []).find(x => x.id === P.palette); r.textContent = p ? p.name.toUpperCase() : 'SHOW COLOURS'; r.style.color = p ? 'var(--pink)' : ''; }
  }
  function newPalette() {
    const cols = ['#ff1aa8', '#00e5ff', '#ffd21a'];
    const s = document.createElement('div'); s.className = 'sheet pl-sheet';
    s.innerHTML = `<div><div class="ph" style="--c:var(--pink)"><span>New palette</span></div>
      <div class="prev" id="plPrev"></div><div class="cols" id="plCols"></div>
      <div class="row"><button class="btn" id="plWheel">${GB.svg('rainbow')}<span>Add wheel colour</span></button><button class="btn" id="plAdd">${GB.svg('add')}<span>Add colour</span></button></div>
      <p class="note">3 to 5 colours. "Add wheel colour" takes the colour the COLOR fader is on right now.</p>
      <label class="field">Name<input type="text" id="plName" maxlength="20" autocomplete="off" placeholder="Smith Wedding"></label>
      <div class="row"><button class="btn c" id="plSave" style="--c:var(--pink)">${GB.svg('save')}<span>Save and use</span></button><button class="btn ghost" id="plX">Cancel</button></div></div>`;
    document.body.appendChild(s);
    const draw = () => {
      s.querySelector('#plPrev').innerHTML = cols.map(c => `<i style="background:${c}"></i>`).join('');
      const box = s.querySelector('#plCols'); box.innerHTML = '';
      cols.forEach((c, i) => { const w = document.createElement('div'); w.className = 'cl';
        w.innerHTML = `<input type="color" value="${c}" aria-label="Colour ${i + 1}"><button class="btn" aria-label="Remove colour ${i + 1}" ${cols.length <= 3 ? 'hidden' : ''}>${GB.svg('close')}</button>`;
        w.querySelector('input').oninput = e => { cols[i] = e.target.value; s.querySelector('#plPrev').children[i].style.background = cols[i]; };
        w.querySelector('button').onclick = () => { cols.splice(i, 1); draw(); };
        box.appendChild(w); });
      s.querySelector('#plAdd').disabled = s.querySelector('#plWheel').disabled = cols.length >= 5;
    };
    s.querySelector('#plAdd').onclick = () => { if (cols.length < 5) { cols.push('#ffffff'); draw(); } };
    s.querySelector('#plWheel').onclick = () => { const h = (GB.status.faders || {}).color_hex; if (!h) return GB.toast('Move the COLOR fader up to pick a colour from the wheel');
      if (cols.length < 5) { cols.push(h); draw(); GB.toast('🎨 Added ' + h); } };
    s.querySelector('#plX').onclick = () => s.remove(); s.onclick = e => { if (e.target === s) s.remove(); };
    s.querySelector('#plSave').onclick = async () => { const j = await post('/api/palettes', {save: {name: s.querySelector('#plName').value.trim(), colors: cols, use: true}}); if (j) { s.remove(); GB.sfx('ok'); GB.toast('🎨 Palette saved and on'); } };
    draw();
  }

  // ------------------------------------------------------------------ LIVE BOARD: zone submasters
  GB.panel('board', 12, el => {
    el.classList.add('box'); el.style.setProperty('--c', TEAL); el.id = 'znSubs';
    el.innerHTML = `<div class="ph"><span>Zone faders</span><span class="r" id="znSubR">ALL FULL</span></div>
      <div class="zs" id="znSubBox"><p class="note">Loading…</p></div>
      <div class="row"><button class="btn sm" id="znReset" disabled style="--c:${TEAL}">${GB.svg('reset')}<span>All to full</span></button></div>
      <p class="note">A brightness fader per zone, on top of Master: pull LEFT down to dim the left side, or one curtain on its own.</p>`;
    $('znReset').onclick = async () => { if (await post('/api/zones', {reset_subs: true})) GB.toast('Zones back to full'); };
    GB.proGate(el, 'Zones');
  });
  const pend = {};
  function buildSubs() {
    const box = $('znSubBox'); if (!box || !Z) return; box.innerHTML = '';
    (Z.list || []).filter(z => z.id !== 'all').forEach(z => {
      const l = document.createElement('label'); l.className = 'lv';
      l.innerHTML = `<span>${esc(z.name)}</span><input type="range" min="0" max="100" step="1" value="100" data-z="${esc(z.id)}" data-ctl="sub.${esc(z.id)}" aria-label="${esc(z.name)} zone level"><b>100%</b>`;
      const i = l.querySelector('input'); GB.paintRange(i);
      const send = () => { const v = +i.value; l.querySelector('b').textContent = v + '%'; clearTimeout(pend[z.id]); pend[z.id] = setTimeout(() => post('/api/zones', {sub: {[z.id]: v}}), 60); };
      i.addEventListener('input', send); i.addEventListener('pointerdown', () => { i._drag = true; }); i.addEventListener('pointerup', () => setTimeout(() => { i._drag = false; }, 400));
      i.addEventListener('dblclick', () => { i.value = 100; GB.paintRange(i); send(); });
      box.appendChild(l);
    });
    paintZsel();
  }

  const loadAll = () => { loadZ(); loadP(); };
  GB.on('page', id => { if (id === 'ops' || id === 'board') loadAll(); });
  GB.on('ready', () => { if (GB.page === 'ops' || GB.page === 'board') loadAll(); });
  GB.on('pro', v => { if (v && (GB.page === 'ops' || GB.page === 'board')) loadAll(); });
})();
