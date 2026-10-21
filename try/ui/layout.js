/* GlowBop console: LIGHTS → Draw your layout. A draw-it-yourself layout editor (photo of the house / stage or a blank grid,
   every light string placed as a path: line, path, arc, ring, box outline, pixel grid, or a template), the zones it makes,
   and an easier outdoor camera mapping (one light at a time, auto brightness, retry missing bulbs, then touch up here).
   Engine: GET /api/layout, POST /api/layout/save | photo | test, POST /api/map2/level | start | show | finish | cancel.
   Geometry lives in layoutgeo.js (window.GBGEO), the same maths the engine uses on save. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc, G = window.GBGEO;
  if (!G) return console.error('layoutgeo.js missing');

  GB.css(`
  .lm-ov { position:fixed; inset:0; z-index:240; background:#05040a; display:flex; flex-direction:column; color:var(--text);
    padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
  .lm-ov[hidden], .lm-cam[hidden] { display:none; }
  .lm-hd { display:flex; align-items:center; gap:6px; padding:6px 8px; border-bottom:2px solid var(--peri); min-width:0; flex:0 0 auto; }
  .lm-hd b { font:800 calc(17px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--peri); flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .lm-hd .btn { min-height:44px; padding:0 10px; flex:0 0 auto; }
  .lm-hd .btn svg { width:20px; height:20px; }
  @media (max-width: 520px) { .lm-hd b { display:none; } .lm-hd { justify-content:space-between; } #lmTest span { display:none; } }
  .lm-body { flex:1; min-height:0; display:flex; flex-direction:column; }
  .lm-stage { position:relative; flex:1 1 52%; min-height:0; overflow:hidden; background:#0b0a12; touch-action:none; }
  .lm-stage > svg { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; user-select:none; -webkit-user-select:none; }
  .lm-zoom { position:absolute; right:8px; bottom:8px; display:flex; flex-direction:column; gap:6px; }
  .lm-zoom .btn { min-height:44px; width:44px; padding:0; background:#000c; color:var(--text); border:1px solid var(--line); }
  .lm-zoom .btn svg { width:22px; height:22px; fill:currentColor; }
  .lm-hint { position:absolute; left:8px; right:64px; top:8px; display:flex; gap:6px; align-items:center; flex-wrap:wrap; pointer-events:none; }
  .lm-hint span { background:#000c; border:1px solid var(--line); border-radius:12px; padding:6px 10px; font-size:calc(13px * var(--fs, 1)); color:var(--dim); }
  .lm-hint .btn { pointer-events:auto; min-height:40px; }
  .lm-side { flex:1 1 48%; min-height:0; overflow:auto; padding:10px; display:flex; flex-direction:column; gap:10px; border-top:2px solid var(--line); background:var(--panel); }
  @media (min-width: 900px) { .lm-body { flex-direction:row; } .lm-stage { flex:1 1 auto; } .lm-side { flex:0 0 360px; border-top:0; border-left:2px solid var(--line); } }
  @media (max-width: 899px) and (orientation: portrait) { .lm-side { flex:0 0 42%; } }
  .lm-tools { position:sticky; top:-10px; z-index:2; background:var(--panel); padding:10px 0 6px; margin-top:-10px; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px; }
  .lm-tools .btn { min-height:52px; padding:2px; flex-direction:column; gap:2px; font-size:calc(11px * var(--fs, 1)); letter-spacing:.5px; border-radius:10px; justify-content:center; }
  .lm-tools .btn svg { width:22px; height:22px; }
  .lm-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; min-width:0; }
  .lm-row > * { min-width:0; }
  .lm-f { display:grid; grid-template-columns:96px minmax(0, 1fr); gap:6px 8px; align-items:center; font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:var(--label); text-transform:uppercase; }
  .lm-f input, .lm-f select { min-width:0; width:100%; }
  .lm-2 { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:6px; }
  .lm-3 { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:6px; }
  .lm-2 .btn, .lm-3 .btn { min-height:44px; padding:0 4px; font-size:calc(13px * var(--fs, 1)); }
  .lm-skip { display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr) 44px; gap:6px; align-items:center; }
  .lm-skip .btn { min-height:44px; padding:0; }
  .lm-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .lm-chips .chip { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lm-info { font:calc(13px * var(--fs, 1)) var(--mono); color:var(--cyan); overflow-wrap:anywhere; }
  .lm-tpl { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
  .lm-tpl button { appearance:none; border:1px solid var(--line); background:var(--dark2); color:var(--text); border-radius:0 12px 0 12px; padding:8px; display:flex; flex-direction:column; align-items:center; gap:4px; min-height:96px; font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; cursor:pointer; }
  .lm-tpl svg { width:100%; height:56px; }
  .lm-sum { display:flex; flex-direction:column; gap:8px; }
  .lm-prev { width:100%; height:auto; max-height:220px; background:#06050c; border:1px solid var(--line); border-radius:0 14px 0 14px; display:block; }
  .lm-cam { position:absolute; inset:0; z-index:5; background:#000; display:flex; flex-direction:column; overflow:auto; padding:12px; gap:12px; color:#ff9a8a; }
  .lm-cam h3 { margin:0; font:800 calc(20px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:#ff6a5a; }
  .lm-cam ol, .lm-cam ul { margin:0; padding-left:22px; line-height:1.6; font-size:calc(15px * var(--fs, 1)); color:#e58c7e; }
  .lm-cam .note { color:#c57a6e; }
  .lm-cam .btn { --c:#ff5a4a; }
  .lm-cam video { width:100%; max-height:46vh; object-fit:contain; background:#000; border:1px solid #401a16; border-radius:0 14px 0 14px; }
  .lm-cam .su-prog, .lm-prog { height:10px; background:#1a0a08; border-radius:3px; overflow:hidden; }
  .lm-prog i { display:block; height:100%; width:0; background:#ff5a4a; transition:width .2s; }
  .lm-cdev { display:flex; align-items:center; gap:10px; border-bottom:1px solid #2a1210; padding:8px 2px; min-width:0; }
  .lm-cdev .tx { flex:1; min-width:0; } .lm-cdev b { display:block; font:700 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:#ff8a7a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .lm-cdev small { color:#b06a60; font-size:calc(12px * var(--fs, 1)); }
  .lm-grow { display:grid; grid-template-columns:minmax(0, 1fr) auto 44px 44px; gap:6px; align-items:center; padding:4px 6px; border-radius:10px; border:1px solid var(--line); cursor:pointer; }
  .lm-grow.on { border-color:#ffc04d; box-shadow:inset 0 0 0 1px #ffc04d; }
  .lm-grow b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.5px; }
  .lm-grow small { color:var(--dim); font:600 calc(12px * var(--fs, 1)) var(--mono); }
  .lm-grow .btn { min-height:44px; width:44px; padding:0; }
  #lmHouse { min-height:48px; }
  .lm-rate { height:8px; border-radius:4px; background:#2a1210; overflow:hidden; margin-top:4px; } .lm-rate i { display:block; height:100%; background:#ff5a4a; }
  `);

  const DEVCOL = GB.DEVCOL;
  const TI = {                                                             // tool glyphs (24x24, stroke)
    sel: '<path d="M5 3l14 8-6 1.5L10 19z" fill="currentColor"/>',
    line: '<path d="M4 19L20 5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="4" cy="19" r="2.4" fill="currentColor"/><circle cx="20" cy="5" r="2.4" fill="currentColor"/>',
    poly: '<path d="M3 18l6-9 5 6 7-11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>',
    arc: '<path d="M3 19A9 9 0 0 1 21 19" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    ring: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    rect: '<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="2.6"/>',
    matrix: '<g fill="currentColor">' + [0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<circle cx="${5 + c * 4.7}" cy="${5 + r * 4.7}" r="1.6"/>`).join('')).join('') + '</g>',
    tpl: '<path d="M3 13l9-9 9 9M6 11v9h12v-9" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/>',
  };
  const ti = (k) => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">${TI[k]}</svg>`;
  const TOOLS = [['sel', 'Select'], ['line', 'Line'], ['poly', 'Path'], ['arc', 'Arc'], ['ring', 'Ring'], ['rect', 'Box'], ['matrix', 'Grid'], ['tpl', 'Template']];
  const KIND_NAME = {line: 'Line', poly: 'Path', arc: 'Arc', ring: 'Ring', rect: 'Box outline', matrix: 'Pixel grid', points: 'Camera map', tpl: 'Template'};

  let D = null, DEVS = [], ZONES = [], sel = null, tool = 'sel', act = '', view = {x: 0, y: 0, s: 1}, snap = true, dirty = false, testing = false;
  let undo = [], redo = [], draft = null, photoT = 0, LIGHTS = null, selG = null;
  const W = () => D.stage[0], H = () => D.stage[1];
  const devById = id => DEVS.find(d => d.id === id);
  const devCol = id => DEVCOL[Math.max(0, DEVS.findIndex(d => d.id === id)) % DEVCOL.length];
  const itemById = id => D.items.find(i => i.id === id);
  const uid = () => 'i' + Math.random().toString(36).slice(2, 8);
  const snapState = () => JSON.stringify({items: D.items, guides: D.guides || [], scale: D.scale || 0, stage: D.stage, photo: !!D.photo, house: D.house || null});
  const restState = s => { const o = JSON.parse(s); if (Array.isArray(o)) { D.items = o; return; } D.items = o.items; D.guides = o.guides; D.scale = o.scale || 0; D.stage = o.stage; D.photo = o.photo; D.house = o.house; };
  const snapshot = () => { undo.push(snapState()); if (undo.length > 80) undo.shift(); redo = []; dirty = true; };

  // =================================================================== panel on the LIGHTS page
  GB.panel('house', 30, el => {                                    // 🏠 Oct 21: on the HOUSE page now (was LIGHTS)
    el.id = 'drawPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Draw your layout</span><span class="r" id="lmCount"></span></div>
      <p class="note">Lights on a house, a stage or an odd shape? Take a photo, then draw where each string runs: rooflines, windows, arches, trees, truss, panels. Every effect then follows your real shape.</p>
      <div class="lm-sum">
        <svg class="lm-prev" id="lmPrev" viewBox="0 0 1000 600" aria-label="Your drawn layout"></svg>
        <div class="seg"><button class="btn c" id="lmOpen" style="--c:var(--cyan)">${GB.svg('edit')}<span>Open editor</span></button><button class="btn" id="lmCamGo">${GB.svg('camera')}<span>Map outdoors</span></button></div>
        <div class="sub">Zones</div>
        <p class="note" id="lmZnote">Every string you name becomes a zone you can light on its own.</p>
        <div class="lm-chips" id="lmZones"></div>
        <button class="btn wide" id="lmZgrp" hidden>${GB.svg('lists')}<span>Use zones as light groups</span></button>
      </div>`;
    $('lmOpen').onclick = () => openEditor();
    $('lmCamGo').onclick = () => openEditor(true);
    const zb = $('lmZgrp'), zHTML = zb.innerHTML;
    zb.onclick = async () => {
      if (zb.dataset.sure !== '1') { zb.dataset.sure = '1'; zb.innerHTML = '<span>Tap again: each zone runs its own show</span>'; setTimeout(() => { zb.dataset.sure = ''; zb.innerHTML = zHTML; }, 4000); return; }
      zb.dataset.sure = ''; zb.innerHTML = zHTML;
      const gs = zoneGroups(); if (!gs) return;
      if (await GB.post('/api/lights/groups', {groups: gs})) { GB.toast('🧩 Light groups made from your zones. Tap Apply & restart lights.'); document.querySelectorAll('.su-apply').forEach(r => r.hidden = false); }
    };
  });
  GB.on('ready', () => load());
  GB.on('page', id => { if (id === 'lights' && $('lmOv') && $('lmOv').hidden) load(); });

  async function load() {
    let r; try { r = await GB.get('/api/layout'); } catch (e) { return; }
    D = r.doc; D.items = D.items || []; DEVS = r.devices || []; ZONES = r.zones || []; testing = !!r.testing;
    if (!D.stage) D.stage = [1000, 600];
    paintSummary();
  }
  function paintSummary() {
    const p = $('lmPrev'); if (!p || !D) return;
    p.setAttribute('viewBox', `0 0 ${W()} ${H()}`);
    p.innerHTML = (D.photo ? `<image href="/api/layout/photo?t=${photoT}" x="0" y="0" width="${W()}" height="${H()}" opacity=".5" preserveAspectRatio="none"/>` : '') +
      D.items.map(it => ledDots(it, 3.2, 0.95)).join('') + (D.items.length ? '' : `<text x="${W() / 2}" y="${H() / 2}" fill="#6a6490" font-size="${W() / 26}" text-anchor="middle" font-family="sans-serif">Nothing drawn yet</text>`);
    $('lmCount').textContent = D.items.length ? D.items.length + (D.items.length === 1 ? ' STRING' : ' STRINGS') : '';
    const z = $('lmZones'); z.innerHTML = ZONES.map(x => `<span class="chip" title="${esc(x.leds + ' bulbs')}">${esc(x.name)} <small>${x.leds}</small></span>`).join('') || '<span class="note">No zones yet.</span>';
    $('lmZgrp').hidden = !zoneGroups();
  }
  // zones -> light groups, only when it maps cleanly (each zone = whole lights, no light in two zones, 2+ groups)
  function zoneGroups() {
    const used = new Set(), gs = [];
    for (const z of ZONES) {
      if (!z.whole || !z.whole.length || Object.keys(z.devices).length !== z.whole.length) continue;
      if (z.whole.some(i => used.has(i))) continue;
      z.whole.forEach(i => used.add(i)); gs.push({name: z.name.slice(0, 30), devices: z.whole, layout: 'canvas'});
    }
    return gs.length >= 2 ? gs : null;
  }
  function ledDots(it, r, op) {
    const pl = G.placeItem(it), col = devCol(it.dev); let s = '';
    pl.pos.forEach((p, i) => { if (pl.vis[i]) s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${pl.est[i] ? 'none' : col}" stroke="${col}" stroke-width="${pl.est[i] ? r * 0.4 : 0}" opacity="${op}"/>`; });
    return s;
  }

  // =================================================================== the editor overlay
  function buildOverlay() {
    const ov = document.createElement('div'); ov.className = 'lm-ov'; ov.id = 'lmOv'; ov.hidden = true;
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Layout editor');
    ov.innerHTML = `<div class="lm-hd">
        <button class="btn" id="lmClose" aria-label="Close editor">${GB.svg('close')}</button><b>Layout editor</b>
        <button class="btn" id="lmUndo" aria-label="Undo">${GB.svg('reset')}</button><button class="btn" id="lmRedo" aria-label="Redo">${GB.svg('refresh')}</button>
        <button class="btn" id="lmTest" aria-label="Test the lights">${GB.svg('eye')}<span>Test</span></button>
        <button class="btn c" id="lmSave" style="--c:var(--green)">${GB.svg('check')}<span>Save</span></button></div>
      <div class="lm-body">
        <div class="lm-stage" id="lmStage"><svg id="lmSvg" aria-label="Drawing area"></svg>
          <div class="lm-hint" id="lmHint"></div>
          <div class="lm-zoom"><button class="btn" id="lmZin" aria-label="Zoom in">${GB.svg('add')}</button><button class="btn" id="lmZout" aria-label="Zoom out"><svg class="ic" viewBox="0 0 24 24"><path d="M5 11h14v2H5z"/></svg></button><button class="btn" id="lmFit" aria-label="Fit to screen">${GB.svg('full')}</button></div>
        </div>
        <div class="lm-side" id="lmSide">
          <button class="btn c wide" id="lmHouse" style="--c:var(--gold)">${GB.svg('home')}<span>House Builder</span></button>
          <div id="lmGuides"></div>
          <div class="lm-tools" id="lmTools">${TOOLS.map(([k, t]) => `<button class="btn" data-lmt="${k}" aria-label="${t}">${ti(k)}<span>${t}</span></button>`).join('')}</div>
          <label class="lm-f">Drawing for<select id="lmDev" aria-label="Which light you are drawing"></select></label>
          <div id="lmTray"></div>
          <div id="lmProps"></div>
          <div class="sub">Background</div>
          <div class="lm-2"><button class="btn" id="lmPhoto">${GB.svg('image')}<span>Photo</span></button><button class="btn" id="lmBlank">${GB.svg('dark')}<span>Blank grid</span></button></div>
          <div class="lm-2"><button class="btn" id="lmSnap">${GB.svg('pin')}<span>Snap</span></button><button class="btn" id="lmCam">${GB.svg('camera')}<span>Camera</span></button></div>
          <input type="file" id="lmFile" accept="image/*" hidden>
        </div>
        <div class="lm-cam" id="lmCamBox" hidden></div>
      </div>`;
    document.body.appendChild(ov);
    $('lmClose').onclick = closeEditor;
    $('lmUndo').onclick = () => { if (!undo.length) return; redo.push(snapState()); restState(undo.pop()); if (sel && !itemById(sel)) sel = null; dirty = true; refresh(); };
    $('lmRedo').onclick = () => { if (!redo.length) return; undo.push(snapState()); restState(redo.pop()); dirty = true; refresh(); };
    $('lmSave').onclick = save;
    $('lmTest').onclick = () => test(null);
    $('lmZin').onclick = () => zoomAt(1.35); $('lmZout').onclick = () => zoomAt(1 / 1.35); $('lmFit').onclick = () => { fit(); draw(); };
    ov.querySelectorAll('[data-lmt]').forEach(b => b.onclick = () => setTool(b.dataset.lmt));
    $('lmDev').onchange = e => { act = e.target.value; const it = itemById(sel); if (it && it.dev !== act) { sel = null; refresh(); } };   // new strings go on this light
    $('lmPhoto').onclick = () => $('lmFile').click();
    $('lmFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) usePhoto(f); };
    $('lmBlank').onclick = blank;
    $('lmSnap').onclick = () => { snap = !snap; GB.store.set('lm_snap', snap ? '1' : '0'); paintTools(); };
    $('lmCam').onclick = () => camOpen();
    $('lmHouse').onclick = () => GB.houseBuilder && GB.houseBuilder.open();
    snap = GB.store.get('lm_snap', '1') === '1';
    wire($('lmSvg'));
    window.addEventListener('resize', () => { if (!ov.hidden) draw(); });
  }

  async function openEditor(cam) {
    if (!$('lmOv')) buildOverlay();
    await load(); if (!D) return GB.toast('⚠️ Not connected');
    try { LIGHTS = await GB.get('/api/lights'); } catch (e) {}
    undo = []; redo = []; dirty = false; sel = null; draft = null; tool = 'sel';
    if (!act || !devById(act)) act = (DEVS.find(d => d.enabled) || DEVS[0] || {}).id || '';
    $('lmOv').hidden = false; document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { fit(); refresh(); if (cam) camOpen(); });
  }
  async function closeEditor() {
    if (dirty) { const b = $('lmClose'); if (b.dataset.sure !== '1') { b.dataset.sure = '1'; GB.toast('Not saved yet. Tap close again to throw away your changes.'); setTimeout(() => b.dataset.sure = '', 4000); return; } b.dataset.sure = ''; }
    if (testing) await test(null, true);
    camStop(); $('lmOv').hidden = true; document.body.style.overflow = ''; load();
  }

  function setTool(k) {
    if (k === 'tpl') return pickTemplate();
    finishDraft(); tool = k; paintTools();
    hint({sel: 'Tap a string to select it. Drag to move, pinch or scroll to zoom.', line: 'Drag from where the string starts to where it ends.', poly: 'Tap each corner in wiring order. Tap Done when finished.',
          arc: 'Drag from one end of the arch to the other, then pull the middle handle.', ring: 'Drag a box where the ring goes.', rect: 'Drag a box around the window or frame.', matrix: 'Drag a box where the pixel panel sits.'}[k]);
  }
  function paintTools() {
    document.querySelectorAll('[data-lmt]').forEach(b => { b.classList.toggle('on', b.dataset.lmt === tool); b.style.setProperty('--c', 'var(--cyan)'); });
    $('lmSnap').classList.toggle('on', snap); $('lmSnap').style.setProperty('--c', 'var(--cyan)');
    $('lmTest').classList.toggle('on', testing); $('lmTest').style.setProperty('--c', 'var(--amber)');
    $('lmTest').querySelector('span').textContent = testing ? 'Stop' : 'Test';
  }
  function hint(text, btns) {
    const h = $('lmHint'); h.innerHTML = text ? `<span>${esc(text)}</span>` : '';
    (btns || []).forEach(([t, fn, c]) => { const b = document.createElement('button'); b.className = 'btn c'; b.style.setProperty('--c', c || 'var(--green)'); b.textContent = t; b.onclick = fn; h.appendChild(b); });
  }

  // ------------------------------------------------------------- devices + LED numbering
  function nextFree(dev, except) {
    let m = 0; D.items.forEach(i => { if (i.dev === dev && i.id !== except) m = Math.max(m, (+i.first || 0) + (+i.count || 0)); });
    const d = devById(dev); return d && m >= d.n ? 0 : m;
  }
  function defaultCount(dev, want, except) {
    const d = devById(dev); if (!d) return want || 50;
    const left = d.n - nextFree(dev, except); return want ? Math.max(1, Math.min(want, left > 0 ? left : d.n)) : Math.max(1, left > 0 ? left : d.n);
  }
  function newItem(fields) {
    const it = Object.assign({id: uid(), dev: act, first: nextFree(act), rev: false, skip: []}, fields);
    if (!it.count) it.count = defaultCount(act);
    if (!it.name) it.name = (KIND_NAME[it.kind] || 'String') + ' ' + (D.items.filter(i => i.kind === it.kind).length + 1);
    D.items.push(it); sel = it.id; return it;
  }
  function paintDevs() {
    const s = $('lmDev'); s.innerHTML = DEVS.map(d => `<option value="${esc(d.id)}"${d.id === act ? ' selected' : ''}>${esc(d.name)} · ${d.n} bulbs${d.enabled ? '' : ' (off)'}</option>`).join('') || '<option value="">No lights yet</option>';
    const placed = new Set(D.items.map(i => i.dev)), left = DEVS.filter(d => d.enabled && !placed.has(d.id));
    const t = $('lmTray'); t.innerHTML = '';
    if (!left.length) return;
    t.innerHTML = `<div class="sub">Not on the drawing yet</div><div class="lm-chips"></div>`;
    left.forEach(d => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = '+ ' + d.name; b.onclick = () => placeDevice(d); t.lastChild.appendChild(b); });
  }
  function placeDevice(d) {
    act = d.id; const c = viewCenter();
    if (d.shape && d.shape.pts && d.shape.pts.length) {                 // a grid curtain or an old camera map: drop it in, exactly as wired
      snapshot(); const k = d.shape.kind === 'grid' ? Math.min(W() * 0.4 / d.shape.w, H() * 0.6 / d.shape.h) : 1;
      const w = d.shape.kind === 'grid' ? d.shape.w * k : W() * 0.4, h = d.shape.kind === 'grid' ? d.shape.h * k : W() * 0.4 * (d.shape.h / Math.max(1e-6, d.shape.w));
      newItem({kind: 'points', name: d.name, pts: d.shape.pts, box: {x: c[0], y: c[1], w: Math.max(20, w), h: Math.max(20, h), rot: 0}, count: d.n, first: 0});
      refresh(); GB.toast('📍 ' + d.name + ' placed. Drag it into place.');
    } else { setTool('poly'); refresh(); GB.toast('✏️ Tap along where ' + d.name + ' runs, from its plug end.'); }
  }

  // ------------------------------------------------------------- view
  const svgRect = () => $('lmSvg').getBoundingClientRect();
  function fit() { const r = svgRect(); if (!r.width) return; const s = Math.min(r.width / W(), r.height / H()) * 0.94; view = {s, x: W() / 2 - r.width / 2 / s, y: H() / 2 - r.height / 2 / s}; }
  function viewCenter() { const r = svgRect(); return [view.x + r.width / 2 / view.s, view.y + r.height / 2 / view.s]; }
  function zoomAt(f, cx, cy) { const r = svgRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
    const px = view.x + cx / view.s, py = view.y + cy / view.s; view.s = Math.max(0.05, Math.min(40, view.s * f)); view.x = px - cx / view.s; view.y = py - cy / view.s; draw(); }
  const toStage = e => { const r = svgRect(); return [view.x + (e.clientX - r.left) / view.s, view.y + (e.clientY - r.top) / view.s]; };

  // ------------------------------------------------------------- drawing the stage
  let raf = 0; const draw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawNow(); }); };
  function drawNow() {
    const svg = $('lmSvg'); if (!svg || !D) return; const r = svgRect(), s = view.s, px = 1 / s;
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${r.width / s} ${r.height / s}`);
    let o = `<rect x="0" y="0" width="${W()}" height="${H()}" fill="#100e1a"/>`;
    if (D.photo) o += `<image href="/api/layout/photo?t=${photoT}" x="0" y="0" width="${W()}" height="${H()}" preserveAspectRatio="none" opacity=".8"/>`;
    else { const g = D.grid || 50; let p = ''; for (let x = 0; x <= W(); x += g) p += `M${x} 0V${H()}`; for (let y = 0; y <= H(); y += g) p += `M0 ${y}H${W()}`; o += `<path d="${p}" stroke="#2a2640" stroke-width="${px}" fill="none"/>`; }
    o += `<rect x="0" y="0" width="${W()}" height="${H()}" fill="none" stroke="#3a3458" stroke-width="${2 * px}"/>`;
    (D.guides || []).forEach(g => { if (g.pts.length < 2) return;                 // 🏠 the house's lines (House Builder): a drawing to put lights on
      const on = g.id === selG;
      o += `<path d="M${g.pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}${g.closed ? 'Z' : ''}" fill="none" stroke="${on ? '#ffc04d' : '#e9e6ff'}" stroke-opacity="${on ? 0.95 : 0.55}" stroke-width="${(on ? 4 : 2.2) * px}" stroke-linejoin="round" stroke-dasharray="${on ? '' : 10 * px + ' ' + 6 * px}"/>`; });
    if (GB.lm.overlay) o += GB.lm.overlay(px);
    const list = draft ? D.items.concat([draft]) : D.items;
    list.forEach(it => { o += itemSvg(it, it.id === sel || it === draft, px); });
    const it = itemById(sel); if (it && !draft) o += handlesSvg(it, px);
    svg.innerHTML = o;
  }
  function itemSvg(it, on, px) {
    const col = devCol(it.dev), pl = G.placeItem(it); let o = '';
    G.strokes(it).forEach(st => { if (st.p.length < 2) return; o += `<path d="M${st.p.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}${st.closed ? 'Z' : ''}" fill="none" stroke="${col}" stroke-opacity="${on ? 0.75 : 0.4}" stroke-width="${(on ? 3 : 2) * px}" stroke-dasharray="${on ? '' : 6 * px + ' ' + 4 * px}"/>`; });
    if (it.kind === 'matrix' || it.kind === 'points') { const c = G.boxXf(it.box, [[0, 0], [1, 0], [1, 1], [0, 1]]); o += `<path d="M${c.map(p => p.join(' ')).join('L')}Z" fill="none" stroke="${col}" stroke-opacity=".4" stroke-width="${2 * px}"/>`; }
    const rr = Math.max(1.6 * px, Math.min(3.2 * px, 6));
    pl.pos.forEach((p, i) => { if (!pl.vis[i]) return; o += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${rr}" fill="${pl.est[i] ? 'none' : col}" stroke="${col}" stroke-width="${pl.est[i] ? px : 0}"/>`; });
    const vi = []; pl.vis.forEach((v, i) => { if (v) vi.push(i); });
    if (vi.length) {                                                  // start (green), end (red), wiring direction arrows
      const a = pl.pos[vi[0]], b = pl.pos[vi[vi.length - 1]];
      o += `<circle cx="${a[0]}" cy="${a[1]}" r="${7 * px}" fill="none" stroke="#3ce08a" stroke-width="${3 * px}"/><rect x="${b[0] - 5 * px}" y="${b[1] - 5 * px}" width="${10 * px}" height="${10 * px}" fill="none" stroke="#ff4d5e" stroke-width="${3 * px}"/>`;
      [0.2, 0.5, 0.8].forEach(f => { const k = Math.floor(f * (vi.length - 1)), i0 = vi[k], i1 = vi[Math.min(vi.length - 1, k + 1)]; if (i0 === i1) return;
        const p = pl.pos[i0], q = pl.pos[i1], an = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
        o += `<path d="M${-6 * px} ${-6 * px}L${4 * px} 0L${-6 * px} ${6 * px}" fill="none" stroke="#fff" stroke-width="${2.4 * px}" transform="translate(${p[0]} ${p[1]}) rotate(${an})" opacity=".9"/>`; });
      if (on) { const nm = `${it.name || ''} · ${vi.length} bulbs`; o += `<text x="${a[0] + 10 * px}" y="${a[1] - 10 * px}" fill="#fff" font-size="${13 * px}" font-family="sans-serif" paint-order="stroke" stroke="#000" stroke-width="${3 * px}">${esc(nm)}</text>`; }
    }
    if (on) { const h = G.hintsStage(it);                            // the shape hints effects use
      const mk = (p, t) => `<g transform="translate(${p[0]} ${p[1]})"><path d="M0 ${-8 * px}L${8 * px} 0L0 ${8 * px}L${-8 * px} 0Z" fill="#ffc04d" opacity=".9"/><text x="${10 * px}" y="${4 * px}" fill="#ffc04d" font-size="${11 * px}" font-family="sans-serif" paint-order="stroke" stroke="#000" stroke-width="${3 * px}">${t}</text></g>`;
      if (h.apex) o += mk(h.apex, 'top'); (h.peaks || []).forEach(p => o += mk(p, 'peak')); if (h.center && !h.apex) o += mk(h.center, 'centre'); }
    return o;
  }
  // handles: vertices for line / path / arc, corners + rotate knob for box items
  function handles(it) {
    if (['line', 'poly', 'arc'].includes(it.kind)) return (it.pts || []).map((p, i) => ({t: 'v', i, p}));
    if (!it.box) return [];
    const c = G.boxXf(it.box, [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0]]), b = it.box, r = (b.rot || 0) * Math.PI / 180, k = 34 / view.s;
    return c.slice(0, 4).map((p, i) => ({t: 'c', i, p})).concat([{t: 'r', p: [c[4][0] + Math.sin(r) * k, c[4][1] - Math.cos(r) * k], base: c[4]}]);
  }
  function handlesSvg(it, px) {
    let o = '';
    handles(it).forEach(h => {
      if (h.t === 'r') o += `<path d="M${h.base[0]} ${h.base[1]}L${h.p[0]} ${h.p[1]}" stroke="#fff" stroke-width="${1.5 * px}"/><circle cx="${h.p[0]}" cy="${h.p[1]}" r="${10 * px}" fill="#33d6ff" stroke="#000" stroke-width="${2 * px}"/><path d="M${h.p[0] - 4 * px} ${h.p[1]}a${4 * px} ${4 * px} 0 1 1 ${4 * px} ${4 * px}" fill="none" stroke="#000" stroke-width="${2 * px}"/>`;
      else o += `<circle cx="${h.p[0]}" cy="${h.p[1]}" r="${10 * px}" fill="${h.t === 'v' && h.i === 0 ? '#3ce08a' : '#fff'}" fill-opacity=".9" stroke="#000" stroke-width="${2 * px}"/>`;
    });
    return o;
  }

  // ------------------------------------------------------------- hit tests
  function hitHandle(it, p) { const r = 22 / view.s; let best = null, bd = r; handles(it).forEach(h => { const d = Math.hypot(h.p[0] - p[0], h.p[1] - p[1]); if (d < bd) { bd = d; best = h; } }); return best; }
  function distToItem(it, p) {
    let best = Infinity;
    const segd = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]); };
    G.strokes(it).forEach(st => { const q = st.closed ? st.p.concat([st.p[0]]) : st.p; for (let i = 0; i + 1 < q.length; i++) best = Math.min(best, segd(q[i], q[i + 1])); });
    if (it.box && (it.kind === 'matrix' || it.kind === 'points')) { const u = G.boxInv(it.box, [p])[0]; if (u[0] >= 0 && u[0] <= 1 && u[1] >= 0 && u[1] <= 1) best = 0; }
    return best;
  }
  function hitItem(p) { let best = null, bd = 18 / view.s; for (let k = D.items.length - 1; k >= 0; k--) { const d = distToItem(D.items[k], p); if (d < bd) { bd = d; best = D.items[k]; } } return best; }
  function snapPt(p, skipId) {
    if (!snap) return p;
    let best = null, bd = 16 / view.s;
    D.items.forEach(it => { if (it.id === skipId) return; (it.kind === 'line' || it.kind === 'poly' || it.kind === 'arc' ? it.pts : G.strokes(it).flatMap(s => s.p)).forEach(q => { if (!q) return; const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } }); });
    if (best) return best.slice();
    const g = (D.grid || 50) / 2; return [Math.round(p[0] / g) * g, Math.round(p[1] / g) * g];
  }

  // ------------------------------------------------------------- pointer: draw, select, drag, pan, pinch
  function wire(svg) {
    const ptr = new Map(); let drag = null, pinch = null, moved = false;
    svg.addEventListener('pointerdown', e => {
      svg.setPointerCapture(e.pointerId); ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v: Object.assign({}, view)}; drag = null; return; }
      const p = toStage(e);
      if (tool === 'sel') {
        const it = itemById(sel), h = it && hitHandle(it, p);
        if (h) { snapshot(); drag = {k: 'h', it, h, start: p, box: Object.assign({}, it.box)}; return; }
        const hit = hitItem(p);
        if (hit) { if (sel !== hit.id) { sel = hit.id; act = hit.dev || act; paintProps(); paintDevs(); } snapshot(); drag = {k: 'move', it: hit, start: p, orig: JSON.stringify(hit)}; draw(); return; }
        drag = {k: 'pan', start: [e.clientX, e.clientY], v: Object.assign({}, view)}; return;
      }
      if (!act) { GB.toast('Add a light under Your lights first'); return; }
      const q = snapPt(p);
      if (tool === 'poly') { drag = {k: 'tap', p: q}; return; }
      snapshot();
      if (tool === 'line') { const it = newItem({kind: 'line', pts: [q, q.slice()]}); drag = {k: 'h', it, h: {t: 'v', i: 1}, fresh: true, start: q}; }
      else if (tool === 'arc') { const it = newItem({kind: 'arc', pts: [q, q.slice(), q.slice()]}); drag = {k: 'arc', it, start: q}; }
      else { const kind = tool, f = {kind, box: {x: q[0], y: q[1], w: 1, h: 1, rot: 0}};
        if (kind === 'matrix') Object.assign(f, {rows: 8, cols: 8, start: 'tl', order: 'rows', serp: true, count: 64});
        if (kind === 'rect') f.start = 'bl';
        const it = newItem(f); if (kind === 'matrix') it.count = defaultCount(act, 64); drag = {k: 'box', it, start: q}; }
      refresh();
    });
    svg.addEventListener('pointermove', e => {
      if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && ptr.size >= 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], r = svgRect();
        const s = Math.max(0.05, Math.min(40, pinch.v.s * d / Math.max(1, pinch.d)));
        const sx = pinch.v.x + (pinch.m[0] - r.left) / pinch.v.s, sy = pinch.v.y + (pinch.m[1] - r.top) / pinch.v.s;
        view = {s, x: sx - (m[0] - r.left) / s, y: sy - (m[1] - r.top) / s}; draw(); return; }
      if (!drag) return; const p = toStage(e);
      if (Math.hypot(p[0] - (drag.start || drag.p || p)[0], p[1] - (drag.start || drag.p || p)[1]) * view.s > 4) moved = true;
      if (drag.k === 'pan') { view.x = drag.v.x - (e.clientX - drag.start[0]) / view.s; view.y = drag.v.y - (e.clientY - drag.start[1]) / view.s; draw(); return; }
      if (drag.k === 'move') { const o = JSON.parse(drag.orig), dx = p[0] - drag.start[0], dy = p[1] - drag.start[1], it = drag.it;
        if (it.pts && it.kind !== 'points') it.pts = o.pts.map(q => q ? [q[0] + dx, q[1] + dy] : q);
        if (it.box) { it.box.x = o.box.x + dx; it.box.y = o.box.y + dy; } draw(); return; }
      if (drag.k === 'h') { moveHandle(drag, snapPt(p, drag.it.id)); draw(); return; }
      if (drag.k === 'arc') { const it = drag.it, q = snapPt(p, it.id), a = it.pts[0], L = Math.hypot(q[0] - a[0], q[1] - a[1]);
        it.pts[2] = q; it.pts[1] = [(a[0] + q[0]) / 2 + (q[1] - a[1]) * 0.0, (a[1] + q[1]) / 2 - L * 0.35]; draw(); return; }
      if (drag.k === 'box') { const q = snapPt(p, drag.it.id), a = drag.start, it = drag.it;
        it.box = {x: (a[0] + q[0]) / 2, y: (a[1] + q[1]) / 2, w: Math.max(4, Math.abs(q[0] - a[0])), h: Math.max(4, Math.abs(q[1] - a[1])), rot: 0}; draw(); }
    });
    const up = e => {
      if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId);
      if (pinch) { if (ptr.size < 2) pinch = null; return; }
      const d = drag; drag = null; if (!d) return;
      if (d.k === 'tap') { if (!moved) polyTap(d.p); return; }
      if (d.k === 'move' && !moved) { undo.pop(); return; }
      if (d.k === 'h' && d.fresh && !moved) { d.it.pts[1] = [d.it.pts[0][0] + 200, d.it.pts[0][1]]; }
      if (d.k === 'arc' && !moved) { const a = d.it.pts[0]; d.it.pts = [a, [a[0] + 120, a[1] - 90], [a[0] + 240, a[1]]]; }
      if (d.k === 'box' && !moved) { const sz = {ring: [160, 160], rect: [120, 150], matrix: [200, 200]}[d.it.kind]; Object.assign(d.it.box, {w: sz[0], h: sz[1]}); }
      if (['h', 'arc', 'box'].includes(d.k) && d.it && tool !== 'sel') setTool('sel');
      refresh();
    };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svgRect(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top); }, {passive: false});
  }
  function moveHandle(d, p) {
    const it = d.it, h = d.h;
    if (h.t === 'v') { it.pts[h.i] = p; return; }
    const b = it.box, r = (b.rot || 0) * Math.PI / 180;
    if (h.t === 'r') { const c = [b.x, b.y]; let an = Math.atan2(p[0] - c[0], -(p[1] - c[1])) * 180 / Math.PI; if (snap) an = Math.round(an / 15) * 15; b.rot = Math.round(an * 10) / 10; return; }
    const U = [[0, 0], [1, 0], [1, 1], [0, 1]][h.i], O = G.boxXf(d.box, [[1 - U[0], 1 - U[1]]])[0];
    const dx = p[0] - O[0], dy = p[1] - O[1], lx = dx * Math.cos(r) + dy * Math.sin(r), ly = -dx * Math.sin(r) + dy * Math.cos(r);
    b.w = Math.max(6, Math.abs(lx)); b.h = Math.max(6, Math.abs(ly)); b.x = (O[0] + p[0]) / 2; b.y = (O[1] + p[1]) / 2;
  }
  function polyTap(p) {
    if (!draft) { draft = {id: uid(), kind: 'poly', pts: [p], dev: act, first: nextFree(act), count: defaultCount(act), skip: [], rev: false}; }
    else {
      const f = draft.pts[0];
      if (draft.pts.length > 2 && Math.hypot(f[0] - p[0], f[1] - p[1]) * view.s < 22) { draft.closed = true; return finishDraft(); }
      draft.pts.push(p);
    }
    hint(`${draft.pts.length} point${draft.pts.length > 1 ? 's' : ''}. Tap the next corner.`, [['Done', finishDraft], ['Undo point', () => { draft.pts.pop(); if (!draft.pts.length) draft = null; draw(); }, 'var(--amber)']]);
    draw();
  }
  function finishDraft() {
    if (!draft) return; const d = draft; draft = null;
    if (d.pts.length >= 2) { snapshot(); newItem(Object.assign(d, {name: ''})); tool = 'sel'; paintTools(); hint('Saved as a path. Drag the handles to adjust.'); }
    else hint('');
    refresh();
  }

  // ------------------------------------------------------------- templates
  function tplIcon(name) {
    const it = G.makeTemplate(name, 50, 35, null); const k = Math.min(90 / it.box.w, 60 / it.box.h); it.box.w *= k; it.box.h *= k; it.count = Math.min(it.count, 60);
    if (it.kind === 'matrix') { it.rows = Math.min(it.rows, 6); it.cols = Math.min(it.cols, 14); it.count = it.rows * it.cols; }
    const pl = G.placeItem(it); let o = '';
    G.strokes(it).forEach(st => o += `<path d="M${st.p.map(p => p.join(' ')).join('L')}${st.closed ? 'Z' : ''}" fill="none" stroke="#33d6ff" stroke-opacity=".5" stroke-width="1.5"/>`);
    pl.pos.forEach((p, i) => { if (pl.vis[i]) o += `<circle cx="${p[0]}" cy="${p[1]}" r="1.6" fill="#ffc04d"/>`; });
    return `<svg viewBox="0 0 100 70">${o}</svg>`;
  }
  function pickTemplate() {
    const s = GB.sheet('Pick a template', []); const box = s.firstChild;
    const g = document.createElement('div'); g.className = 'lm-tpl';
    G.TPL_ORDER.forEach(n => { const b = document.createElement('button'); b.innerHTML = tplIcon(n) + esc(G.TEMPLATES[n].label);
      b.onclick = () => { s.remove(); addTemplate(n); }; g.appendChild(b); });
    box.insertBefore(g, box.lastChild);
  }
  function addTemplate(n) {
    if (!act) return GB.toast('Add a light under Your lights first');
    snapshot(); const c = viewCenter(), t = G.TEMPLATES[n], it = G.makeTemplate(n, c[0], c[1], null);
    const k = Math.min(1, W() * 0.8 / it.box.w, H() * 0.8 / it.box.h); it.box.w *= k; it.box.h *= k;
    const want = it.count; delete it.count; newItem(Object.assign(it, {count: defaultCount(act, want)}));
    tool = 'sel'; paintTools(); refresh(); hint(t.label + ' added. Drag it onto your photo, then use the corners to size it.');
  }

  // ------------------------------------------------------------- properties of the selected string
  function paintProps() {
    const box = $('lmProps'); const it = itemById(sel);
    if (!it) { box.innerHTML = D.items.length ? '<p class="note">Tap a string on the drawing to change it.</p>' : '<p class="note">Pick a tool (or a template) and draw your first light string. Start where the string plugs in.</p>'; return; }
    const d = devById(it.dev), n = d ? d.n : 0, pl = G.placeItem(it), shown = pl.vis.filter(Boolean).length;
    const kindName = it.tpl ? G.TEMPLATES[it.tpl].label : KIND_NAME[it.kind];
    let o = `<div class="sub">${esc(kindName)}</div>
      <label class="lm-f">Name<input type="text" id="lmName" maxlength="40" value="${esc(it.name || '')}" placeholder="Roof, Left window…"></label>
      <label class="lm-f">Light<select id="lmIdev">${DEVS.map(x => `<option value="${esc(x.id)}"${x.id === it.dev ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <div class="lm-2"><label class="lm-f" style="grid-template-columns:52px minmax(0,1fr)">First<input type="number" id="lmFirst" min="0" max="${Math.max(0, n - 1)}" value="${it.first || 0}" inputmode="numeric"></label>
        <label class="lm-f" style="grid-template-columns:52px minmax(0,1fr)">Bulbs<input type="number" id="lmCnt" min="1" max="5000" value="${it.count}" inputmode="numeric"></label></div>
      <div class="lm-info">Bulbs ${it.first || 0} to ${(it.first || 0) + it.count - 1} of ${n || '?'} · ${shown} lit${shown < it.count ? ', ' + (it.count - shown) + ' hidden' : ''}${(it.first || 0) + it.count > n && n ? ' · ⚠️ past the end of this light' : ''}</div>
      <div class="lm-3"><button class="btn" id="lmRest">Use the rest</button><button class="btn" id="lmRev">${GB.svg('swapH')}<span>Reverse</span></button><button class="btn" id="lmT1">${GB.svg('eye')}<span>Test</span></button></div>`;
    if (it.kind === 'poly') o += `<div class="lm-2"><button class="btn${it.closed ? ' on' : ''}" id="lmClosed" style="--c:var(--cyan)">Closed loop</button><button class="btn" id="lmPop">Remove last point</button></div>`;
    if (it.kind === 'ring') o += `<label class="lm-f">Starts at<select id="lmA0">${[[0, 'Top'], [90, 'Right'], [180, 'Bottom'], [270, 'Left']].map(([v, t]) => `<option value="${v}"${(+it.a0 || 0) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
    if (it.kind === 'rect' || it.kind === 'matrix') o += `<label class="lm-f">Start corner<select id="lmStart">${[['tl', 'Top left'], ['tr', 'Top right'], ['bl', 'Bottom left'], ['br', 'Bottom right']].map(([v, t]) => `<option value="${v}"${(it.start || 'tl') === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
    if (it.kind === 'matrix') o += `<div class="lm-2"><label class="lm-f" style="grid-template-columns:52px minmax(0,1fr)">Rows<input type="number" id="lmRows" min="1" max="200" value="${it.rows}"></label><label class="lm-f" style="grid-template-columns:52px minmax(0,1fr)">Cols<input type="number" id="lmCols" min="1" max="200" value="${it.cols}"></label></div>
      <div class="lm-2"><button class="btn${it.order !== 'cols' ? ' on' : ''}" data-lmord="rows" style="--c:var(--cyan)">Row by row</button><button class="btn${it.order === 'cols' ? ' on' : ''}" data-lmord="cols" style="--c:var(--cyan)">Column by column</button></div>
      <button class="btn${it.serp !== false ? ' on' : ''}" id="lmSerp" style="--c:var(--cyan)">Zig-zag (serpentine) wiring</button>`;
    if (it.kind === 'tpl') (G.TEMPLATES[it.tpl].params || []).forEach(p => {
      if (p.when && !p.when(it.tp || {})) return; const v = (it.tp || {})[p.k] ?? p.def;
      o += p.opts ? `<label class="lm-f">${esc(p.label)}<select data-lmtp="${p.k}">${p.opts.map(([k, t]) => `<option value="${k}"${v === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`
                  : `<label class="lm-f">${esc(p.label)}<input type="number" data-lmtp="${p.k}" min="${p.min}" max="${p.max}" value="${v}"></label>`; });
    if (it.box) o += `<div class="lm-3"><label class="lm-f" style="grid-template-columns:20px minmax(0,1fr)">W<input type="number" id="lmBw" value="${Math.round(it.box.w)}" min="4"></label><label class="lm-f" style="grid-template-columns:20px minmax(0,1fr)">H<input type="number" id="lmBh" value="${Math.round(it.box.h)}" min="4"></label><label class="lm-f" style="grid-template-columns:20px minmax(0,1fr)">°<input type="number" id="lmBr" value="${Math.round(it.box.rot || 0)}" step="5"></label></div>`;
    o += `<div class="sub">Hidden bulbs</div><p class="note">Bulbs tucked behind a gutter or running between windows: they stay dark and take no room on the drawing.</p><div id="lmSkips" class="lm-sum"></div>
      <button class="btn" id="lmSkipAdd">${GB.svg('add')}<span>Add hidden bulbs</span></button>
      <div class="lm-3">${it.kind === 'tpl' || ['ring', 'rect'].includes(it.kind) ? '<button class="btn" id="lmPoly">Edit points</button>' : ''}<button class="btn" id="lmDup">${GB.svg('copy')}<span>Copy</span></button><button class="btn danger" id="lmDel">${GB.svg('trash')}<span>Delete</span></button></div>`;
    box.innerHTML = o;
    const ch = (fn) => () => { snapshot(); fn(); refresh(); };
    $('lmName').onchange = ch(() => it.name = $('lmName').value.trim().slice(0, 40));
    $('lmIdev').onchange = ch(() => { it.dev = act = $('lmIdev').value; it.first = nextFree(it.dev, it.id); it.count = defaultCount(it.dev, it.count, it.id); });
    $('lmFirst').onchange = ch(() => it.first = Math.max(0, parseInt($('lmFirst').value, 10) || 0));
    $('lmCnt').onchange = ch(() => it.count = Math.max(1, Math.min(5000, parseInt($('lmCnt').value, 10) || 1)));
    $('lmRest').onclick = ch(() => { if (d) it.count = Math.max(1, d.n - (it.first || 0)); });
    $('lmRev').onclick = ch(() => it.rev = !it.rev);
    $('lmT1').onclick = () => test(it.id);
    if ($('lmClosed')) $('lmClosed').onclick = ch(() => it.closed = !it.closed);
    if ($('lmPop')) $('lmPop').onclick = ch(() => { if (it.pts.length > 2) it.pts.pop(); });
    if ($('lmA0')) $('lmA0').onchange = ch(() => it.a0 = +$('lmA0').value);
    if ($('lmStart')) $('lmStart').onchange = ch(() => it.start = $('lmStart').value);
    if ($('lmRows')) { $('lmRows').onchange = ch(() => { it.rows = Math.max(1, +$('lmRows').value || 1); it.count = it.rows * it.cols; }); $('lmCols').onchange = ch(() => { it.cols = Math.max(1, +$('lmCols').value || 1); it.count = it.rows * it.cols; }); }
    box.querySelectorAll('[data-lmord]').forEach(b => b.onclick = ch(() => it.order = b.dataset.lmord));
    if ($('lmSerp')) $('lmSerp').onclick = ch(() => it.serp = it.serp === false);
    box.querySelectorAll('[data-lmtp]').forEach(i => i.onchange = ch(() => { it.tp = Object.assign({}, it.tp, {[i.dataset.lmtp]: i.type === 'number' ? +i.value : i.value}); G.remakeTemplate(it); }));
    if ($('lmBw')) { $('lmBw').onchange = ch(() => it.box.w = Math.max(4, +$('lmBw').value || 4)); $('lmBh').onchange = ch(() => it.box.h = Math.max(4, +$('lmBh').value || 4)); $('lmBr').onchange = ch(() => it.box.rot = +$('lmBr').value || 0); }
    const sk = $('lmSkips'); (it.skip || []).forEach((r, k) => {
      const row = document.createElement('div'); row.className = 'lm-skip';
      row.innerHTML = `<input type="number" min="0" value="${r[0]}" aria-label="First hidden bulb"><input type="number" min="0" value="${r[1]}" aria-label="Last hidden bulb"><button class="btn" aria-label="Remove">${GB.svg('close')}</button>`;
      const [a, b] = row.querySelectorAll('input');
      a.onchange = b.onchange = ch(() => it.skip[k] = [Math.max(0, +a.value || 0), Math.max(0, +b.value || 0)]);
      row.querySelector('button').onclick = ch(() => it.skip.splice(k, 1)); sk.appendChild(row); });
    $('lmSkipAdd').onclick = ch(() => { it.skip = it.skip || []; const m = Math.floor(it.count / 2); it.skip.push([m, Math.min(it.count - 1, m + 4)]); });
    if ($('lmPoly')) $('lmPoly').onclick = ch(() => { const p = G.toPoly(it); Object.keys(it).forEach(k => delete it[k]); Object.assign(it, p); });
    $('lmDup').onclick = ch(() => { const c = JSON.parse(JSON.stringify(it)); c.id = uid(); c.name = (it.name || '') + ' copy'; if (c.pts && c.kind !== 'points') c.pts = c.pts.map(p => p && [p[0] + 30, p[1] + 30]); if (c.box) { c.box.x += 30; c.box.y += 30; } c.first = nextFree(c.dev); D.items.push(c); sel = c.id; });
    const del = $('lmDel'), dh = del.innerHTML;
    del.onclick = () => { if (del.dataset.sure !== '1') { del.dataset.sure = '1'; del.innerHTML = '<span>Sure?</span>'; setTimeout(() => { del.dataset.sure = ''; del.innerHTML = dh; }, 4000); return; }
      snapshot(); D.items = D.items.filter(x => x.id !== it.id); sel = null; refresh(); };
  }
  function refresh() { if (!$('lmOv') || $('lmOv').hidden) return; paintTools(); paintDevs(); paintProps(); paintGuides(); draw(); }
  // 🏠 Oct 21: the house's lines, each with "put lights on it"
  function paintGuides() {
    const box = $('lmGuides'); if (!box) return; const gs = D.guides || [];
    if (!gs.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="sub">House lines <small>${D.scale ? 'tap one to light it' : 'set the real size to count bulbs'}</small></div>` +
      gs.map(g => `<div class="lm-grow${g.id === selG ? ' on' : ''}" data-g="${esc(g.id)}"><b>${esc(g.name || 'Line')}</b><small>${D.scale ? G_len(g) : ''}</small>
        <button class="btn" data-gl="${esc(g.id)}" aria-label="Put lights on ${esc(g.name || 'this line')}">${GB.svg('bulb')}</button><button class="btn" data-gx="${esc(g.id)}" aria-label="Remove this line">${GB.svg('close')}</button></div>`).join('');
    box.querySelectorAll('[data-g]').forEach(r => r.onclick = e => { if (e.target.closest('button')) return; selG = selG === r.dataset.g ? null : r.dataset.g; paintGuides(); draw(); });
    box.querySelectorAll('[data-gl]').forEach(b => b.onclick = () => GB.houseBuilder && GB.houseBuilder.fill(b.dataset.gl));
    box.querySelectorAll('[data-gx]').forEach(b => b.onclick = () => { snapshot(); D.guides = gs.filter(g => g.id !== b.dataset.gx); if (selG === b.dataset.gx) selG = null; refresh(); });
  }
  const G_len = g => { const L = gLen(g); const ft = L / D.scale; return ft >= 1 ? Math.round(ft) + ' ft' : Math.round(ft * 12) + ' in'; };
  function gLen(g) { const q = g.closed ? g.pts.concat([g.pts[0]]) : g.pts; let L = 0; for (let i = 1; i < q.length; i++) L += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); return L; }

  // ------------------------------------------------------------- background photo / blank grid
  async function usePhoto(f) {
    GB.toast('Loading photo…');
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = async () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), w = Math.round(img.width * k), h = Math.round(img.height * k);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
      const data = cv.toDataURL('image/jpeg', 0.85);
      if (!await GB.post('/api/layout/photo', {data})) return;
      snapshot(); D.photo = true; D.stage = [1000, Math.round(1000 * h / w)]; photoT = Date.now(); fit(); refresh(); GB.toast('📷 Photo in. It stays on your computer. Now draw your lights on it.');
    };
    img.onerror = () => GB.toast('⚠️ That photo could not be opened');
    img.src = url;
  }
  function blank() {
    const s = GB.sheet('Blank grid', [16 / 9, 4 / 3, 1, 3 / 4].map(r => ({label: r === 1 ? 'Square' : r > 1 ? (r > 1.5 ? 'Wide 16:9' : 'Standard 4:3') : 'Tall 3:4', onclick: async () => {
      if (D.photo) await GB.post('/api/layout/photo', {data: null});
      snapshot(); D.photo = false; D.stage = [1000, Math.round(1000 / r)]; fit(); refresh(); }})));
    return s;
  }

  // ------------------------------------------------------------- save, test
  const cleanDoc = () => Object.assign({v: 1, stage: D.stage, photo: !!D.photo, grid: D.grid || 50, items: D.items},
    D.scale ? {scale: D.scale} : {}, (D.guides || []).length ? {guides: D.guides} : {}, D.house ? {house: D.house} : {});
  async function save() {
    finishDraft();
    const r = await GB.post('/api/layout/save', {doc: cleanDoc(), apply: true}); if (!r) return;
    dirty = false; ZONES = r.zones || []; GB.sfx('ok');
    GB.toast('💾 Saved. ' + ((r.devices || []).map(d => `${d.name}: ${d.shown} lit`).join(', ') || 'Nothing placed') + '. The show restarts with your layout.');
    paintSummary();
  }
  async function test(id, off) {
    if (testing || off) { await GB.post('/api/layout/test', {off: true}); testing = false; paintTools(); hint(''); if (!id || off) return; }
    const r = await GB.post('/api/layout/test', {doc: cleanDoc(), item: id || null}); if (!r) return;
    testing = true; paintTools();
    hint(`Testing ${r.steps} string${r.steps > 1 ? 's' : ''}: the FIRST bulb blinks green, the LAST blinks red, then a white light runs from first to last.`, [['Stop test', () => test(null, true), 'var(--amber)']]);
  }

  // 🏠 Oct 21: a small door into the editor for the House Builder (housebuild.js)
  GB.lm = {
    doc: () => D, devs: () => DEVS, act: () => act, setAct: id => { act = id; }, snapshot, newItem, refresh, draw, fit, photoT: () => photoT,
    nextFree, defaultCount, viewCenter, toStage, devCol, usePhoto: f => usePhoto(f), isOpen: () => !!($('lmOv') && !$('lmOv').hidden),
    open: () => openEditor(), selGuide: id => { selG = id; refresh(); }, overlay: null, svg: () => $('lmSvg'), view: () => view,
    setPhotoT: t => { photoT = t; }, gLen,
  };

  // =================================================================== outdoor camera mapping, one light at a time
  let cam = null;              // {stream, track, res: {devId: result}, frame: {k, ox, oy} (camera -> stage), moved}
  function camBox(html) { const b = $('lmCamBox'); b.hidden = false; b.innerHTML = html; return b; }
  function camStop() { if (cam && cam.stream) cam.stream.getTracks().forEach(t => t.stop()); if (cam) cam.stream = null; const b = $('lmCamBox'); if (b) { b.hidden = true; b.innerHTML = ''; } }
  function camOpen() {
    cam = cam || {res: {}, frame: null};
    const b = camBox(`<h3>Night mapping</h3>
      <p class="note">GlowBop blinks one light at a time and your camera watches where each bulb is. Big house? Map a few lights, move the camera, map the next ones, then line the pieces up in the editor.</p>
      <ol><li>Wait until it is dark. Turn off porch lights and anything bright nearby.</li>
        <li>Put the phone or iPad on a tripod, a car roof or a fence post. It must not move while mapping.</li>
        <li>Get the whole light (string, window, tree) in the picture, as big as you can.</li>
        <li>Exposure: on iPhone, tap and hold on the lights in the Camera app first to lock it (AE/AF LOCK), then come back. GlowBop also tries to lock it for you.</li>
        <li>This screen stays dark on purpose so it does not light up the scene.</li></ol>
      <div class="lm-2"><button class="btn" id="lmCx">Back to editor</button><button class="btn c" id="lmCgo">I'm ready</button></div>`);
    $('lmCx').onclick = camStop; $('lmCgo').onclick = camStart;
  }
  async function camStart() {
    if (!window.isSecureContext || !navigator.mediaDevices) {
      const url = LIGHTS && LIGHTS.https ? LIGHTS.https : 'https://<laptop>:8788/';
      camBox(`<h3>Camera needs the secure page</h3><p class="note">Open <a href="${esc(url)}" target="_blank" rel="noopener" style="color:#ff8a7a">${esc(url)}</a> on this phone, tap <b>Show Details → visit this website</b>, then LIGHTS → Draw your layout → Map outdoors.</p><button class="btn" id="lmCx">Back to editor</button>`);
      $('lmCx').onclick = camStop; return;
    }
    try { cam.stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}}, audio: false}); }
    catch (e) { GB.toast('📷 Camera not allowed: ' + e.message); return camOpen(); }
    cam.track = cam.stream.getVideoTracks()[0];
    camPick();
  }
  function camPick(msg) {
    const live = DEVS.filter(d => d.enabled);
    const b = camBox(`<h3>Pick a light to map</h3>${msg ? `<p class="note">${esc(msg)}</p>` : ''}<video id="lmVid" playsinline muted autoplay></video><div id="lmCl"></div>
      <div class="lm-2"><button class="btn" id="lmCmoved">I moved the camera</button><button class="btn c" id="lmCdone">Done: touch up</button></div>`);
    $('lmVid').srcObject = cam.stream;
    const box = $('lmCl');
    live.forEach(d => { const r = cam.res[d.id], row = document.createElement('div'); row.className = 'lm-cdev';
      const pct = r ? Math.round(100 * r.found / r.total) : 0;
      row.innerHTML = `<div class="tx"><b>${esc(d.name)}</b><small>${d.n} bulbs${r ? ` · seen ${r.found} of ${r.total} (${pct}%)` : d.connected ? '' : ' · not connected'}</small>${r ? `<div class="lm-rate"><i style="width:${pct}%"></i></div>` : ''}</div>`;
      const go = document.createElement('button'); go.className = 'btn c'; go.textContent = r ? 'Again' : 'Map'; go.disabled = !d.connected; go.onclick = () => camRun(d, null); row.appendChild(go);
      if (r && r.missing.length) { const re = document.createElement('button'); re.className = 'btn'; re.textContent = `Retry ${r.missing.length}`; re.onclick = () => camRun(d, r.missing); row.appendChild(re); }
      box.appendChild(row); });
    $('lmCmoved').onclick = () => { cam.frame = null; GB.toast('📷 OK: the next light lands next to the others. Drag and turn it into place after.'); };
    $('lmCdone').onclick = () => { camStop(); refresh(); };
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function grabber(v) {
    const w = 480, h = Math.round(480 * v.videoHeight / v.videoWidth), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', {willReadFrequently: true});
    const one = () => { g.drawImage(v, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data, o = new Float32Array(w * h); for (let i = 0, j = 0; i < d.length; i += 4, j++) o[j] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return o; };
    return {w, h, grab: async () => { const a = one(); await sleep(70); const b = one(); for (let i = 0; i < a.length; i++) a[i] = (a[i] + b[i]) / 2; return a; }};
  }
  // 🌗 brightness: light the string at a level, look at it, too bright (blown-out blobs merge) -> dimmer, can't see it -> brighter
  async function autoLevel(d, gb, say) {
    let lv = 170;
    for (let k = 0; k < 5; k++) {
      say(`Checking brightness (${Math.round(lv / 2.55)}%)…`);
      await GB.post('/api/map2/level', {id: d.id, level: lv, on: false}); await sleep(300); const off = await gb.grab();
      await GB.post('/api/map2/level', {id: d.id, level: lv, on: true}); await sleep(350); const on = await gb.grab();
      const diff = new Float32Array(on.length); let mx = 0; for (let i = 0; i < on.length; i++) { diff[i] = on[i] - off[i]; if (diff[i] > mx) mx = diff[i]; }
      const thr = Math.max(18, mx * 0.25); let lit = 0, sat = 0; for (let i = 0; i < on.length; i++) if (diff[i] > thr) { lit++; if (on[i] >= 250) sat++; }
      if (lit < 6) { if (lv >= 255) return {lv, warn: 'I can hardly see this light. Is it in the picture?'}; lv = Math.min(255, Math.round(lv * 1.6)); continue; }
      if (sat / lit > 0.35 && lv > 30) { lv = Math.max(30, Math.round(lv * 0.6)); continue; }
      return {lv};
    }
    return {lv};
  }
  async function camRun(d, only) {
    const b = camBox(`<h3>Mapping ${esc(d.name)}</h3><video id="lmVid" playsinline muted autoplay></video><div class="lm-prog"><i id="lmCp"></i></div><p class="note" id="lmCm">Starting…</p><button class="btn" id="lmCx">Cancel</button>`);
    const v = $('lmVid'); v.srcObject = cam.stream; let stop = false;
    $('lmCx').onclick = async () => { stop = true; await GB.post('/api/map2/cancel', {}); camPick(); };
    const say = t => { const m = $('lmCm'); if (m) m.textContent = t; };
    for (let k = 0; k < 40 && !v.videoWidth; k++) await sleep(100);
    if (!v.videoWidth) return camPick('The camera did not start. Try again.');
    const gb = grabber(v);
    const L = await autoLevel(d, gb, say); if (stop) return;
    try { await cam.track.applyConstraints({advanced: [{exposureMode: 'manual'}, {whiteBalanceMode: 'manual'}, {focusMode: 'manual'}]}); } catch (e) {}
    const st = await GB.post('/api/map2/start', {id: d.id, level: L.lv, leds: only || null}); if (!st) return camPick();
    const frames = [];
    for (let f = 0; f < st.frames; f++) {
      if (stop) return;
      say(`${only ? 'Retrying ' + st.leds + ' missing bulbs' : 'Mapping ' + st.leds + ' bulbs'}… photo ${f + 1} of ${st.frames}. Keep the camera still.`);
      await GB.post('/api/map2/show', {f}); await sleep(st.wait_ms);
      const a = await gb.grab(), u8 = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) u8[i] = Math.min(255, a[i]);
      let bin = ''; for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      frames.push(btoa(bin)); const p = $('lmCp'); if (p) p.style.width = Math.round((f + 1) / st.frames * 100) + '%';
    }
    say('Working out where every bulb is…');
    const r = await GB.post('/api/map2/finish', {w: gb.w, h: gb.h, frames}); if (!r) return camPick();
    camMerge(d, r, only);
    const R = cam.res[d.id]; GB.sfx(R.found / R.total > 0.85 ? 'ok' : 'err');
    camPick(`${d.name}: seen ${R.found} of ${R.total}.` + (L.warn ? ' ' + L.warn : '') + (R.missing.length ? ' Tap Retry to look for the missing bulbs (maybe from a little closer).' : ''));
  }
  // camera result -> a 'points' string on the drawing (same camera spot = lined up with the others automatically)
  function camMerge(d, r, only) {
    let R = cam.res[d.id];
    if (!R || !only) R = cam.res[d.id] = {raw: new Array(d.n).fill(null), w: r.w, h: r.h, found: 0, total: d.n, missing: []};
    r.leds.forEach((led, k) => { if (r.raw[k]) R.raw[led] = r.raw[k]; });
    R.missing = []; R.raw.forEach((p, i) => { if (!p) R.missing.push(i); }); R.found = R.total - R.missing.length;
    const good = R.raw.filter(Boolean); if (good.length < 4) return;              // too few to place: the result screen says so
    const asp = r.h / r.w;                                         // camera picture in stage units: 1 camera width = k stage units
    if (!cam.frame) { const c = viewCenter(), k = W() * 0.9; cam.frame = {k, ox: c[0] - k / 2 + (Object.keys(cam.res).length > 1 ? 40 : 0), oy: c[1] - k * asp / 2}; }
    const F = cam.frame, xs = good.map(p => p[0]), ys = good.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), sw = Math.max(1e-3, x1 - x0), sh = Math.max(1e-3, y1 - y0);
    const pts = R.raw.map(p => p ? [(p[0] - x0) / sw, (p[1] - y0) / sh] : null);
    const box = {x: F.ox + (x0 + sw / 2) * F.k, y: F.oy + (y0 + sh / 2) * asp * F.k, w: Math.max(10, sw * F.k), h: Math.max(10, sh * asp * F.k), rot: 0};
    snapshot();
    let it = D.items.find(i => i.kind === 'points' && i.dev === d.id && i.cam);
    if (only && it) { it.pts = pts; it.box = Object.assign(it.box, {w: box.w, h: box.h}); }
    else if (it) Object.assign(it, {pts, box, count: d.n, first: 0});
    else {
      const had = D.items.filter(i => i.dev === d.id).length;                  // the camera map replaces strings drawn by hand for this light (Undo brings them back)
      if (had) { D.items = D.items.filter(i => i.dev !== d.id); GB.toast(`📷 The camera map replaces ${had} hand-drawn string${had > 1 ? 's' : ''} of ${d.name}. Undo brings ${had > 1 ? 'them' : 'it'} back.`); }
      act = d.id; it = newItem({kind: 'points', name: d.name, pts, box, count: d.n, first: 0, cam: true});
    }
    sel = it.id;
  }
})();
