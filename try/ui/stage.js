/* 🎭 STAGE & VENUE maker (Oct 21, Graham: "a stage and venue maker... similar to house").
   Its own rail tab. Four ways in: a template (club, bar band, festival, theater, church, DJ booth), a file (.mvr venue from a
   lighting designer, or one fixture type as .gdtf / Open Fixture Library .json), a photo to trace on the front view, or draw
   from scratch. Top view (where things stand) and front view (what the crowd sees), in feet, with the live show on them.
   Lights get their colour from GlowBop's main show at their spot on the front view; moving heads (Pro) sweep on the beat,
   slam on drops, follow the picture or hold on focus points. Sent over Art-Net or sACN to a DMX node.
   Home: plan anything, drive colour lights. Pro: moving heads, templates, MVR venues.
   Engine: stage.py + stage_api.py (/api/stage, /api/stage/live, /save, /template, /new, /import, /repatch, /output, /motion, /hold, /slam, /flash, /bright, /photo). */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const C = '#ff5fa2';
  GB.css(`
  #stHero .st-start { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; }
  #stHero .st-start button { min-height:120px; border-radius:0 18px 0 18px; border:2px solid var(--c); background:color-mix(in srgb, var(--c) 12%, #0b0814); color:#fff; cursor:pointer;
    display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:4px; padding:14px; text-align:left; position:relative; }
  #stHero .st-start button svg { width:34px; height:34px; fill:var(--c); margin-bottom:auto; }
  #stHero .st-start b { font:800 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--c); }
  #stHero .st-start span { color:var(--dim); font-size:calc(13px * var(--fs, 1)); }
  .st-pro { position:absolute; top:8px; right:8px; font:800 11px var(--cond); letter-spacing:1px; padding:3px 7px; border-radius:6px; background:var(--amber); color:#000; }
  .st-sum { display:flex; flex-wrap:wrap; gap:6px 14px; font:700 14px var(--cond); letter-spacing:1px; color:var(--dim); margin:10px 0 0; }
  .st-sum b { color:#fff; }
  body[data-page=stage] #view { display:none !important; }   /* the stage views ARE the live picture here */
  #stEdit { container-type:inline-size; }
  .st-main { display:grid; grid-template-columns:minmax(0, 1fr) 340px; gap:10px; align-items:start; }
  @container (max-width: 900px) { .st-main { grid-template-columns:1fr; } .st-side { display:grid !important; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); } }
  .btn.st-ib svg { position:static !important; inset:auto !important; transform:none !important; opacity:1 !important; width:20px !important; height:20px !important; margin:0 !important; }
  .st-views { display:flex; flex-direction:column; gap:8px; min-width:0; }
  .st-views .pl-wrap { height:min(46vh, 420px); }
  .st-views.one .pl-wrap { height:min(66vh, 620px); }
  .st-bar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:8px; }
  .st-bar .btn, .st-side .btn, .st-show .btn, .st-ov .btn { min-height:48px; }
  .st-ib { display:inline-flex; align-items:center; gap:6px; }
  .st-ib svg { width:20px; height:20px; fill:currentColor; flex:none; }
  .st-seg { display:inline-flex; gap:4px; flex-wrap:wrap; }
  .st-seg .btn.on { background:var(--c, ${C}); color:#000; border-color:var(--c, ${C}); }
  .st-side { display:flex; flex-direction:column; gap:10px; }
  .st-card { border:1px solid var(--line); border-radius:0 14px 0 14px; padding:10px; background:#0b0914; }
  .st-card h4 { margin:0 0 8px; font:800 13px var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--c, ${C}); }
  .st-add { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
  .st-add button { min-height:64px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; border-radius:10px; border:1px solid color-mix(in srgb, var(--k) 60%, transparent);
    background:color-mix(in srgb, var(--k) 10%, #0b0914); color:#fff; cursor:pointer; font:700 12px/1.1 var(--cond); letter-spacing:.5px; text-transform:uppercase; padding:4px; position:relative; }
  .st-add button svg { width:26px; height:26px; }
  .st-add button .st-pro { top:3px; right:3px; font-size:9px; padding:1px 4px; }
  .st-f { display:grid; grid-template-columns:1fr 1fr; gap:6px 8px; }
  .st-f label { display:flex; flex-direction:column; gap:3px; font:700 11px var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); }
  .st-f label.w2 { grid-column:span 2; }
  .st-f input, .st-f select, .st-ov input, .st-ov select { min-height:48px; background:#120f20; color:#fff; border:1px solid var(--line); border-radius:8px; padding:0 10px; font:600 16px var(--sans, sans-serif); width:100%; box-sizing:border-box; }
  .st-tg { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .st-note { color:var(--dim); font-size:13px; margin:6px 0 0; }
  .st-show { display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:10px; }
  .st-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:6px 0; }
  .st-row > b { font:800 12px var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); min-width:100%; }
  .st-live { min-height:64px !important; width:100%; font:800 18px var(--cond) !important; letter-spacing:2px; }
  .st-live.on { background:var(--green) !important; color:#000 !important; border-color:var(--green) !important; }
  .st-range { width:100%; accent-color:${C}; height:36px; }
  .st-lock { position:relative; }
  .st-lock.locked > :not(.st-lockcard) { opacity:.45; pointer-events:none; }
  .st-lockcard { display:none; }
  .st-lock.locked .st-lockcard { display:flex; position:absolute; inset:0; align-items:center; justify-content:center; z-index:2; }
  .st-lockcard .btn { min-height:64px; background:var(--amber); color:#000; font:800 16px var(--cond); letter-spacing:1px; }
  .st-tbl { width:100%; border-collapse:collapse; font-size:14px; }
  .st-tbl th { text-align:left; font:800 11px var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); padding:4px 6px; border-bottom:1px solid var(--line); }
  .st-tbl td { padding:6px; border-bottom:1px solid #1b1730; }
  .st-tbl tr.sel td { background:#2a1f12; }
  .st-tbl tr.bad td { color:var(--red); }
  .st-sw { display:inline-block; width:14px; height:14px; border-radius:4px; vertical-align:middle; margin-right:6px; border:1px solid #fff3; }
  .st-ov { position:fixed; inset:0; z-index:3200; background:#05040ae8; display:flex; align-items:center; justify-content:center; padding:12px; }
  .st-ov[hidden] { display:none; }
  .st-ovc { width:min(860px, 100%); max-height:100%; overflow:auto; background:var(--panel); border:2px solid ${C}; border-radius:0 22px 0 22px; padding:14px 16px 18px; }
  .st-ovh { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .st-ovh b { flex:1; font:800 calc(20px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:${C}; }
  .st-tpl { display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:8px; }
  .st-tpl button { min-height:96px; text-align:left; padding:12px; border-radius:0 14px 0 14px; border:2px solid #ff5fa255; background:#140c18; color:#fff; cursor:pointer; position:relative; }
  .st-tpl button.on { border-color:${C}; background:#2a0f20; }
  .st-tpl b { display:block; font:800 16px var(--cond); letter-spacing:1px; text-transform:uppercase; color:${C}; margin-bottom:4px; }
  .st-tpl span { color:var(--dim); font-size:13px; }
  .st-fs { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:8px; margin:10px 0; }
  .st-fs label { display:flex; flex-direction:column; gap:4px; font:700 12px var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); }
  .st-go { min-height:64px !important; width:100%; font:800 18px var(--cond) !important; letter-spacing:2px; background:${C} !important; color:#000 !important; border-color:${C} !important; }
  .st-drop { border:2px dashed #ff5fa288; border-radius:14px; padding:22px; text-align:center; color:var(--dim); }
  .st-drop .btn { min-height:64px; margin-top:8px; }
  svg.pl text { fill:#fff; font-family:var(--cond, sans-serif); font-weight:700; }
  svg.pl text.lb { fill:#bfb6e8; }
  svg.pl text.cr { fill:#ff5fa2; }
  svg.pl text, svg.pl polygon, svg.pl image { pointer-events:none; }
  `);
  // ------------------------------------------------------------------ icons (24 x 24, drawn here)
  const I = {
    tpl: 'M3 3h8v8H3zm10 0h8v5h-8zm0 7h8v11h-8zM3 13h8v8H3z',
    file: 'M6 2h8l6 6v14H6zm7 1.5V9h5.5zM9 13h8v2H9zm0 4h8v2H9z',
    cam: 'M9 3h6l1.8 2H21v15H3V5h4.2zm3 5a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z',
    draw: 'M3 17.25V21h3.75L17.8 9.94l-3.75-3.75zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75z',
    undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
    redo: 'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
    top: 'M3 3h18v18H3zm2 2v14h14V5zm3 3h3v3H8zm5 0h3v3h-3zm-5 5h8v3H8z',
    front: 'M2 18h20v3H2zM4 5h16v2H4zm2 3h2v2H6zm5 0h2v2h-2zm5 0h2v2h-2zM7 12h10v5H7z',
    both: 'M3 3h18v8H3zm0 10h18v8H3z',
    trash: 'M6 7h12l-1 14H7zm3-4h6l1 2h4v2H4V5h4z',
    copy: 'M8 2h12v14H8zm2 2v10h8V4zM4 6h2v14h12v2H4z',
    flash: 'M14.5 1L6 12.5h4.6L7.5 23 18 9.5h-4.8L16.5 1z',
    stage: 'M7 2h10v3H7zM5 6h14v6a7 7 0 01-14 0zm2 15h10l1 2H6zM11 19h2v2h-2z',
    bolt: 'M14.5 1L6 12.5h4.6L7.5 23 18 9.5h-4.8L16.5 1z',
    focus: 'M11 2h2v5h-2zm0 15h2v5h-2zM2 11h5v2H2zm15 0h5v2h-5zm-5-3a4 4 0 110 8 4 4 0 010-8z',
    play: 'M8 5v14l11-7z', plug: 'M9 2h2v5h2V2h2v5h2v5a5 5 0 01-4 4.9V22h-2v-5.1A5 5 0 017 12V7h2z'};
  const sv = (k, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true"${fill ? ` fill="${fill}"` : ''}><path d="${I[k]}"/></svg>`;
  const ibtn = (k, t, attrs) => `<button type="button" class="btn st-ib" ${attrs || ''}>${sv(k)}<span>${esc(t)}</span></button>`;
  // what each kind of thing looks like on the plan
  const KC = {deck: '#4a3c8f', riser: '#6a4fc7', truss: '#c9d3ff', pipe: '#9fb0ff', screen: '#33d6ff', speaker: '#7a5cff', dj: '#ff5fa2', band: '#ffb23d', wall: '#5f5590', set: '#9b3dff', totem: '#c9d3ff'};
  const FK = {par: '#ff5fa2', bar: '#33d6ff', wash: '#3ce08a', spot: '#ffcc66', beam: '#e45cff'};
  const SCENERY = [['deck', 'Stage deck', 16, 8, 2, 0], ['riser', 'Riser', 8, 4, 1, 0], ['truss', 'Truss', 20, 1, 1, 14], ['pipe', 'Pipe', 16, .3, .3, 12], ['screen', 'Screen', 12, .4, 7, 4],
    ['speaker', 'Speakers', 2.5, 2.5, 6, 0], ['dj', 'DJ booth', 7, 3, 3.6, 0], ['band', 'Band area', 10, 6, 6, 0], ['totem', 'Totem', 1, 1, 7, 0], ['wall', 'Wall', 20, .5, 12, 0]];
  const LIGHTS = [['par_rgb', 'RGB par'], ['par_drgbs', 'Par 5ch'], ['par_7', 'Par 7ch'], ['par_rgbw', 'RGBW par'], ['uplight', 'Uplight'], ['bar_8', 'LED bar 8'],
    ['bar_12', 'LED bar 12'], ['wash', 'Wash mover'], ['spot', 'Spot mover'], ['beam', 'Beam mover']];
  const MOV = ['wash', 'spot', 'beam'];
  const fxIcon = k => k === 'bar' ? '<svg viewBox="0 0 24 24"><rect x="2" y="9" width="20" height="6" rx="1" fill="#33d6ff"/><circle cx="6" cy="12" r="1.6" fill="#000"/><circle cx="12" cy="12" r="1.6" fill="#000"/><circle cx="18" cy="12" r="1.6" fill="#000"/></svg>'
    : MOV.includes(k) ? `<svg viewBox="0 0 24 24"><rect x="5" y="17" width="14" height="4" rx="1" fill="${FK[k]}"/><path d="M7 17V9a5 5 0 0110 0v8h-2V9a3 3 0 00-6 0v8z" fill="${FK[k]}"/><circle cx="12" cy="10" r="3" fill="${FK[k]}"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M8 4h8l2 6H6z" fill="${FK.par}"/><circle cx="12" cy="15" r="6" fill="${FK.par}"/><circle cx="12" cy="15" r="3" fill="#000"/></svg>`;
  const scIcon = k => `<svg viewBox="0 0 24 24"><rect x="2" y="${k === 'truss' || k === 'pipe' ? 10 : 6}" width="20" height="${k === 'truss' || k === 'pipe' ? 4 : 12}" rx="1" fill="none" stroke="${KC[k]}" stroke-width="2"/>${k === 'truss' ? '<path d="M3 14l3-4 3 4 3-4 3 4 3-4 3 4" fill="none" stroke="#c9d3ff" stroke-width="1.5"/>' : ''}</svg>`;

  // ------------------------------------------------------------------ state
  let D = null, TY = {}, TPL = [], SEL = null, HIST = [], FUT = [], LIVE = {}, HOW = '', OUT = {}, saveT = null, VIEW = 'both', TOP = null, FRONT = null, PHOTO = null, CL = [];
  try { VIEW = localStorage.getItem('gb_st_view') || 'both'; } catch (e) {}
  const pro = () => GB.pro !== false;
  const prof = t => TY[t] || (D && D.profiles && D.profiles[t]) || {name: t, kind: 'par', ch: 3};
  const kindOf = f => prof(f.type).kind || 'par';
  const chOf = f => { const p = prof(f.type); return p.ch || p.chans_n || ((p.chans || []).length * (p.cell_chans ? (p.cells || 1) : 1)) || 3; };
  const isMv = f => MOV.includes(kindOf(f));
  const findAny = id => (D.fixtures.find(f => f.id === id) && {t: 'f', o: D.fixtures.find(f => f.id === id)}) || (D.items.find(i => i.id === id) && {t: 'i', o: D.items.find(i => i.id === id)})
    || (D.focus.find(p => p.id === id) && {t: 'p', o: D.focus.find(p => p.id === id)}) || null;
  const nid = p => p + Math.random().toString(36).slice(2, 10);
  const snap = v => Math.round(v * 4) / 4;
  const r2 = v => Math.round(v * 100) / 100;
  function snapshot() { HIST.push(JSON.stringify(D)); if (HIST.length > 60) HIST.shift(); FUT = []; paintUR(); }
  function undo() { if (!HIST.length) return; FUT.push(JSON.stringify(D)); D = JSON.parse(HIST.pop()); changed(true); }
  function redo() { if (!FUT.length) return; HIST.push(JSON.stringify(D)); D = JSON.parse(FUT.pop()); changed(true); }
  function paintUR() { const u = $('stUndo'), r = $('stRedo'); if (u) u.disabled = !HIST.length; if (r) r.disabled = !FUT.length; }
  function changed(noSnap) {
    paintAll(); paintUR();
    clearTimeout(saveT); saveT = setTimeout(save, 500);
  }
  async function save() {
    try { const r = await GB.post('/api/stage/save', {doc: D}); if (r && r.ok) { CL = r.clashes || []; D.output = r.doc.output; D.motion = r.doc.motion; paintPatch(); paintSum(); } else if (r && r.error) GB.toast(r.error); }
    catch (e) { GB.toast('Could not save the stage'); }
  }
  async function load() {
    try {
      const r = await GB.get('/api/stage'); D = r.doc; TY = r.types || {}; TPL = r.templates || []; CL = r.clashes || [];
      PHOTO = r.photo ? '/api/stage/photo?t=' + Date.now() : null; if (PHOTO) photoSize();
      paintAll(); paintShow();
    } catch (e) { console.error(e); }
  }
  function photoSize() { const im = new Image(); im.onload = () => { D.photoAR = im.naturalHeight / Math.max(1, im.naturalWidth); paintViews(); }; im.src = PHOTO; }

  // ------------------------------------------------------------------ drawing
  function stageBounds(front) {
    const W = D.size.w, Dd = D.size.d; let x0 = -W / 2 - 4, x1 = W / 2 + 4, y0 = front ? 0 : -Math.max(10, Dd * .9), y1 = front ? 6 : Dd + 3;
    for (const i of D.items) { if (front && ['wall', 'set'].includes(i.kind) && i.y < -3) continue; const e = Math.max(i.w, i.d) / 2; x0 = Math.min(x0, i.x - e); x1 = Math.max(x1, i.x + e); if (front) y1 = Math.max(y1, i.z + i.h + 2); else { y0 = Math.min(y0, i.y - e); y1 = Math.max(y1, i.y + e); } }
    for (const f of D.fixtures) { if (front && f.y < -3 && f.z < 2) continue; x0 = Math.min(x0, f.x - 2); x1 = Math.max(x1, f.x + 2); if (front) y1 = Math.max(y1, f.z + 3); else { y0 = Math.min(y0, f.y - 2); y1 = Math.max(y1, f.y + 2); } }
    return [x0, y0, x1, y1];
  }
  const rect = (i, x, y, w, h, rot, fill, stroke, extra) => `<g data-id="${i}" transform="translate(${x} ${y}) rotate(${rot || 0})"><rect class="pl-o" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>${extra || ''}</g>`;
  function paintTop(P) {
    const W = D.size.w, Dd = D.size.d, out = [];
    out.push(`<rect x="${-Math.max(W, 16) * .6}" y="${-Math.max(8, Dd) * 1.25}" width="${Math.max(W, 16) * 1.2}" height="${Math.max(8, Dd) * 1.2 - 1}" fill="#ff5fa20d" stroke="#ff5fa255" stroke-dasharray="6 6" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
    out.push(P.txt(0, -Math.max(8, Dd) * .7, 'CROWD', 'cr', 14));
    out.push(`<line x1="${-W / 2 - 3}" y1="0" x2="${W / 2 + 3}" y2="0" stroke="#ffcc66" stroke-width="1.5" stroke-dasharray="10 5" vector-effect="non-scaling-stroke"/>`, P.txt(-W / 2 - 1, -.8, 'STAGE FRONT', 'lb', 10));
    const its = D.items.slice().sort((a, b) => a.z - b.z);
    for (const i of its) {
      const c = KC[i.kind] || '#9b3dff', fill = ['deck', 'riser'].includes(i.kind) ? c + '55' : ['wall', 'set'].includes(i.kind) ? 'none' : c + '22';
      const tr = i.kind === 'truss' ? `<path d="${trussZig(i.w, i.d)}" fill="none" stroke="#c9d3ff" stroke-width="1" vector-effect="non-scaling-stroke"/>` : '';
      out.push(rect(i.id, i.x, i.y, i.w, i.d, -(i.rot || 0), fill, ['wall', 'set'].includes(i.kind) ? c + '99' : c, tr));
      if (i.w * P.k > 70 && D.items.length < 120) out.push(P.txt(i.x, i.y, i.name || i.kind, 'lb', 10));
    }
    for (const p of D.focus) out.push(`<g data-id="${p.id}" transform="translate(${p.x} ${p.y})"><circle class="pl-o" r="${9 / P.k}" fill="#ffcc6633" stroke="#ffcc66" stroke-width="2" vector-effect="non-scaling-stroke"/><path d="M${-14 / P.k} 0H${14 / P.k}M0 ${-14 / P.k}V${14 / P.k}" stroke="#ffcc66" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g>`, P.txt(p.x, p.y - 20 / P.k, p.name, '', 10));
    return out.join('');
  }
  const trussZig = (w, d) => { let s = '', n = Math.max(2, Math.round(w / Math.max(.6, d))); for (let k = 0; k <= n; k++) s += (k ? 'L' : 'M') + (-w / 2 + w * k / n) + ' ' + (k % 2 ? d / 2 : -d / 2); return s; };
  function liveTop(P) {
    const out = [];
    for (const f of D.fixtures) {
      const L = LIVE[f.id] || {}, col = (L.c && L.c[0]) || '#000000', k = kindOf(f), ring = FK[k] || '#ff5fa2';
      if (L.t && (isMv(f))) { const [tx, ty] = L.t, dx = tx - f.x, dy = ty - f.y, len = Math.hypot(dx, dy) || 1, s = Math.max(.6, len * .12), nx = -dy / len * s, ny = dx / len * s;
        out.push(`<polygon points="${f.x},${f.y} ${tx + nx},${ty + ny} ${tx - nx},${ty - ny}" fill="${col}" opacity="${col === '#000000' ? .08 : .28}"/>`); }
    }
    for (const f of D.fixtures) {
      const L = LIVE[f.id] || {}, k = kindOf(f), ring = FK[k] || '#ff5fa2';
      if (k === 'bar') {
        const w = f.w || 3.3, cs = L.c && L.c.length > 1 ? L.c : [(L.c && L.c[0]) || '#000'], n = cs.length;
        out.push(`<g data-id="${f.id}" transform="translate(${f.x} ${f.y}) rotate(${-(f.rot || 0)})"><rect class="pl-o" x="${-w / 2}" y="-.3" width="${w}" height=".6" fill="#000" stroke="${ring}" stroke-width="2" vector-effect="non-scaling-stroke"/>${cs.map((c, j) => `<rect x="${-w / 2 + w * j / n + .05}" y="-.22" width="${w / n - .1}" height=".44" fill="${c}"/>`).join('')}</g>`);
      } else {
        const r = MOV.includes(k) ? .75 : .55, col = (L.c && L.c[0]) || '#000';
        out.push(`<g data-id="${f.id}"><circle class="pl-o" cx="${f.x}" cy="${f.y}" r="${r}" fill="${col}" stroke="${ring}" stroke-width="2" vector-effect="non-scaling-stroke"/>${MOV.includes(k) ? `<circle cx="${f.x}" cy="${f.y}" r="${r * .35}" fill="none" stroke="${ring}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>` : ''}${L.lock ? `<circle cx="${f.x + r}" cy="${f.y + r}" r="${6 / P.k}" fill="#ffb23d"/>` : ''}</g>`);
      }
    }
    return out.join('');
  }
  function paintFront(P) {
    const W = D.size.w, out = [];
    if (PHOTO && D.photo && D.photo.on !== false) { const p = D.photo, ar = D.photoAR || .56, h = p.w * ar;
      out.push(`<g transform="scale(1 -1)" opacity="${p.op == null ? .5 : p.op}"><image href="${PHOTO}" x="${p.x - p.w / 2}" y="${-(p.z + h)}" width="${p.w}" height="${h}" preserveAspectRatio="none"/></g>`); }
    out.push(`<line x1="${-W * 2}" y1="0" x2="${W * 2}" y2="0" stroke="#ffcc66" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`, P.txt(-W / 2 - 1, -.9, 'FLOOR', 'lb', 10));
    const its = D.items.filter(i => !(['wall', 'set'].includes(i.kind) && i.y < -3)).sort((a, b) => b.y - a.y);   // upstage first, downstage on top (walls behind the crowd aren't in the picture)
    for (const i of its) {
      const c = KC[i.kind] || '#9b3dff', r = (i.rot || 0) * Math.PI / 180, ww = Math.abs(i.w * Math.cos(r)) + Math.abs(i.d * Math.sin(r));
      const fill = ['deck', 'riser'].includes(i.kind) ? c + '66' : i.kind === 'screen' ? '#0b2a38' : ['wall', 'set'].includes(i.kind) ? 'none' : c + '2a';
      const tr = i.kind === 'truss' ? `<path d="${trussZig(ww, i.h)}" fill="none" stroke="#c9d3ff" stroke-width="1" vector-effect="non-scaling-stroke"/>` : '';
      out.push(rect(i.id, i.x, i.z + i.h / 2, ww, i.h, 0, fill, ['wall', 'set'].includes(i.kind) ? c + '99' : c, tr));
      if (ww * P.k > 70 && D.items.length < 120 && i.h * P.k > 16) out.push(P.txt(i.x, i.z + i.h / 2, i.name || i.kind, 'lb', 10));
    }
    return out.join('');
  }
  function liveFront(P) {
    const out = [], behind = f => f.y < -3 && f.z < 2;               // floor lights at the back of the room: behind the crowd, not in the picture
    for (const f of D.fixtures) { if (behind(f)) continue;
      const L = LIVE[f.id] || {}, col = (L.c && L.c[0]) || '#000000'; if (col === '#000000') continue;
      let tx, tz;
      if (L.t && isMv(f)) { tx = L.t[0]; tz = L.t[2]; }
      else { tx = f.x; tz = f.hang === false ? f.z + 8 : Math.max(0, f.z - 9); }
      const dx = tx - f.x, dz = tz - f.z, len = Math.hypot(dx, dz) || 1, s = Math.max(.5, len * (isMv(f) ? .1 : .25)), nx = -dz / len * s, nz = dx / len * s;
      out.push(`<polygon points="${f.x},${f.z} ${tx + nx},${tz + nz} ${tx - nx},${tz - nz}" fill="${col}" opacity="${L.s ? .55 : .22}"/>`);
    }
    for (const f of D.fixtures) { if (behind(f)) continue;
      const L = LIVE[f.id] || {}, k = kindOf(f), ring = FK[k] || '#ff5fa2';
      if (k === 'bar') { const w = f.w || 3.3, cs = L.c && L.c.length > 1 ? L.c : [(L.c && L.c[0]) || '#000'], n = cs.length;
        out.push(`<g data-id="${f.id}"><rect class="pl-o" x="${f.x - w / 2}" y="${f.z - .25}" width="${w}" height=".5" fill="#000" stroke="${ring}" stroke-width="2" vector-effect="non-scaling-stroke"/>${cs.map((c, j) => `<rect x="${f.x - w / 2 + w * j / n + .05}" y="${f.z - .18}" width="${w / n - .1}" height=".36" fill="${c}"/>`).join('')}</g>`); }
      else { const r = MOV.includes(k) ? .7 : .5;
        out.push(`<g data-id="${f.id}"><circle class="pl-o" cx="${f.x}" cy="${f.z}" r="${r}" fill="${(L.c && L.c[0]) || '#000'}" stroke="${ring}" stroke-width="2" vector-effect="non-scaling-stroke"/>${L.lock ? `<circle cx="${f.x + r}" cy="${f.z + r}" r="${6 / P.k}" fill="#ffb23d"/>` : ''}</g>`); }
    }
    return out.join('');
  }
  function mkViews() {
    const box = $('stViews'); if (!box || TOP) return;
    box.innerHTML = '<div id="stTop"></div><div id="stFront"></div>';
    const common = {pick: id => { SEL = id; paintSide(); TOP.sel = FRONT.sel = id; TOP.drawLive(); FRONT.drawLive(); },
      dragEnd: () => changed(), tap: () => { SEL = null; TOP.sel = FRONT.sel = null; paintSide(); TOP.draw(); FRONT.draw(); }};
    let snapped = false;
    const mv = (id, dx, dy, front) => { const a = findAny(id); if (!a) return; if (!snapped) { snapshot(); snapped = true; }
      const o = a.o; o._x = (o._x == null ? o.x : o._x) + dx; o.x = snap(o._x);
      if (front) { o._z = (o._z == null ? o.z : o._z) + dy; o.z = Math.max(0, snap(o._z)); }
      else { o._y = (o._y == null ? o.y : o._y) + dy; o.y = snap(o._y); }
      (a.t === 'i' ? (TOP.draw(), FRONT.draw()) : (TOP.draw(), FRONT.draw())); paintInspect(); };
    const end = () => { snapped = false; for (const o of [...D.items, ...D.fixtures, ...D.focus]) { delete o._x; delete o._y; delete o._z; } changed(); };
    TOP = GB.Plan($('stTop'), Object.assign({}, common, {id: 'stT', caption: 'Top view · crowd at the bottom', flipY: true, bounds: () => stageBounds(false), paint: paintTop, live: liveTop,
      drag: (id, dx, dy) => mv(id, dx, dy, false), dragEnd: end}));
    FRONT = GB.Plan($('stFront'), Object.assign({}, common, {id: 'stF', caption: 'Front view · what the crowd sees', flipY: true, bounds: () => stageBounds(true), paint: paintFront, live: liveFront,
      drag: (id, dx, dy) => { if (D.focus.some(p => p.id === id)) return; mv(id, dx, dy, true); }, dragEnd: end}));
    paintViewMode();
  }
  function paintViewMode() {
    const v = $('stViews'); if (!v) return; v.classList.toggle('one', VIEW !== 'both');
    $('stTop').hidden = VIEW === 'front'; $('stFront').hidden = VIEW === 'top';
    document.querySelectorAll('#stViewSeg [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === VIEW));
    setTimeout(() => { if (TOP) { TOP.fit(); FRONT.fit(); } }, 30);
  }
  function paintViews() { if (!D) return; mkViews(); if (TOP) { TOP.draw(); FRONT.draw(); } }
  function paintAll() { paintSum(); paintViews(); paintSide(); paintPatch(); }

  // ------------------------------------------------------------------ hero (four ways in)
  GB.panel('stage', 10, el => {
    el.id = 'stHero'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>Stage &amp; Venue</span><span class="r" id="stState"></span></div>
      <p class="note">Build the stage you're playing: where the deck, truss and lights are. GlowBop paints every light from the show, and moving heads sweep on the beat and slam on the drop.</p>
      <div class="st-start">
        <button style="--c:${C}" data-sts="tpl">${sv('tpl')}<b>Pick a template</b><span>Club, bar band, festival, theater, church, DJ booth. Then size it.</span><i class="st-pro" data-pro>PRO</i></button>
        <button style="--c:var(--cyan)" data-sts="file">${sv('file')}<b>Import a file</b><span>An MVR venue from a lighting designer, or a light's GDTF / Open Fixture Library file.</span></button>
        <button style="--c:var(--green)" data-sts="photo">${sv('cam')}<b>Trace a photo</b><span>Put a photo of the stage behind the front view and place lights on it.</span></button>
        <button style="--c:var(--amber)" data-sts="draw">${sv('draw')}<b>Draw from scratch</b><span>Start with an empty deck and add truss, scenery and lights.</span></button>
      </div><div class="st-sum" id="stSum"></div>`;
    el.querySelectorAll('[data-sts]').forEach(b => b.onclick = () => { GB.sfx && GB.sfx('tap'); start(b.dataset.sts, b); });
    load();
  });
  function paintSum() {
    const s = $('stSum'); if (!s || !D) return;
    const mv = D.fixtures.filter(isMv).length;
    s.innerHTML = `<span><b>${esc(D.name)}</b></span><span><b>${r2(D.size.w)}</b> × <b>${r2(D.size.d)}</b> ft</span><span><b>${D.fixtures.length}</b> lights (${mv} moving)</span><span><b>${D.items.length}</b> pieces</span>
      <span>${D.output && D.output.on ? '<b style="color:var(--green)">● SENDING</b>' : 'Screen only'}</span>${CL.length ? `<span style="color:var(--red)"><b>${CL.length}</b> address clash${CL.length > 1 ? 'es' : ''}</span>` : ''}`;
    document.querySelectorAll('#stHero [data-pro]').forEach(n => n.hidden = pro());
  }

  // ------------------------------------------------------------------ start flows (overlay card)
  function ov(title, html) {
    let o = $('stOv'); if (!o) { o = document.createElement('div'); o.id = 'stOv'; o.className = 'st-ov'; document.body.appendChild(o); }
    o.innerHTML = `<div class="st-ovc"><div class="st-ovh"><b>${esc(title)}</b><button class="btn" id="stOvX" aria-label="Close" style="min-width:64px">Close</button></div>${html}</div>`;
    o.hidden = false; $('stOvX').onclick = () => { o.hidden = true; }; return o;
  }
  const closeOv = () => { const o = $('stOv'); if (o) o.hidden = true; };
  function useDoc(doc, msg) {
    if (D && D.fixtures.length) snapshot();
    D = doc; SEL = null; if (TOP) { TOP.fitted = FRONT.fitted = false; } changed(); closeOv(); GB.go && GB.go('stage');
    setTimeout(() => { $('stEdit') && $('stEdit').scrollIntoView({behavior: 'smooth', block: 'start'}); }, 80); if (msg) GB.toast(msg);
  }
  function start(k, btn) {
    if (k === 'tpl') {
      if (!pro()) { GB.proLockedTap ? GB.proLockedTap(btn, 'Stage templates') : GB.toast('Templates are part of Pro DJ'); return; }
      let pick = TPL[0] ? TPL[0].key : 'club';
      const o = ov('Pick a template', `<div class="st-tpl">${TPL.map(t => `<button data-t="${t.key}"><b>${esc(t.name)}</b><span>${esc(t.about)}</span><span style="display:block;margin-top:6px;color:#fff">${t.w} × ${t.d} ft</span></button>`).join('')}</div>
        <div class="st-fs"><label>Stage width (ft)<input id="stTW" type="number" min="4" max="300" step="1"></label><label>Stage depth (ft)<input id="stTD" type="number" min="4" max="300" step="1"></label></div>
        <button class="btn st-go" id="stTGo">Build this stage</button><p class="st-note">Lights are patched in order from universe 1, address 1. You can move, add and re-address anything after.</p>`);
      const sel = key => { pick = key; const t = TPL.find(x => x.key === key); $('stTW').value = t.w; $('stTD').value = t.d; o.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === key)); };
      o.querySelectorAll('[data-t]').forEach(b => b.onclick = () => sel(b.dataset.t)); sel(pick);
      $('stTGo').onclick = async () => { const r = await GB.post('/api/stage/template', {key: pick, w: +$('stTW').value, d: +$('stTD').value}); if (r && r.ok) useDoc(r.doc, '🎭 ' + r.note); else GB.toast((r && r.error) || 'Could not build that'); };
    } else if (k === 'file') {
      const o = ov('Import a file', `<div class="st-drop">Choose an <b>.mvr</b> venue file (the format lighting designers swap between Vectorworks, grandMA, Capture and others),<br>
        or one light's <b>.gdtf</b> or <b>Open Fixture Library .json</b> file to add it to your lights.<br><button class="btn c" id="stPickF" style="--c:var(--cyan)">Choose a file</button><input type="file" id="stFile" accept=".mvr,.gdtf,.json" hidden></div><div id="stImpOut"></div>`);
      $('stPickF').onclick = () => $('stFile').click();
      $('stFile').onchange = async () => { const f = $('stFile').files[0]; if (f) importFile(f); };
    } else if (k === 'photo') {
      ov('Trace a photo', `<div class="st-drop">Take a straight-on photo of the stage from the crowd. It goes behind the <b>front view</b>; drag lights onto it.<br>
        <button class="btn c" id="stPickP" style="--c:var(--green)">Choose a photo</button><input type="file" id="stPh" accept="image/*" hidden></div>
        <div class="st-fs"><label>How wide is the stage in the photo? (ft)<input id="stPW" type="number" min="2" max="300" value="${D ? D.size.w : 24}"></label></div><p class="st-note">After it's in, use the photo sliders under the views to line it up.</p>`);
      $('stPickP').onclick = () => $('stPh').click();
      $('stPh').onchange = async () => { const f = $('stPh').files[0]; if (!f) return; const b64 = await shrink(f, 1600); const r = await GB.post('/api/stage/photo', {b64});
        if (!r || !r.ok) return GB.toast((r && r.error) || 'Could not save the photo');
        snapshot(); const w = +$('stPW').value || D.size.w; D.photo = {x: 0, z: 0, w, op: .55, on: true}; PHOTO = '/api/stage/photo?t=' + Date.now(); photoSize();
        VIEW = 'front'; try { localStorage.setItem('gb_st_view', VIEW); } catch (e) {} paintViewMode(); changed(); closeOv(); GB.toast('📷 Photo in. Drag lights onto it from Add.'); };
    } else if (k === 'draw') {
      const o = ov('Draw from scratch', `<div class="st-fs"><label>Name<input id="stNN" value="My stage"></label><label>Stage width (ft)<input id="stNW" type="number" value="24" min="2"></label>
        <label>Stage depth (ft)<input id="stND" type="number" value="12" min="2"></label><label>Deck height (ft)<input id="stNH" type="number" value="2" min="0" step=".5"></label></div>
        <button class="btn st-go" id="stNGo">Start with an empty deck</button>${D && D.fixtures.length ? '<p class="st-note">Your current stage is replaced. Undo brings it back.</p>' : ''}`);
      $('stNGo').onclick = async () => { const r = await GB.post('/api/stage/new', {name: $('stNN').value, size: {w: +$('stNW').value, d: +$('stND').value, h: +$('stNH').value}}); if (r && r.ok) useDoc(r.doc, '✏️ Empty deck ready. Add truss and lights from the right.'); };
    }
  }
  const b64of = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(f); });
  function shrink(f, max) { return new Promise(ok => { const im = new Image(); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .85)); }; im.src = URL.createObjectURL(f); }); }
  async function importFile(f, mode) {
    const out = $('stImpOut'); out.innerHTML = '<p class="st-note">Reading ' + esc(f.name) + '…</p>';
    if (/\.mvr$/i.test(f.name) && !pro()) { out.innerHTML = '<p class="st-note">Whole venues (MVR) are part of Pro DJ. Single light files (GDTF / Open Fixture Library) work on Home.</p>'; return; }
    const r = await GB.post('/api/stage/import', {name: f.name, b64: await b64of(f), mode});
    if (!r || !r.ok) { out.innerHTML = `<p class="st-note" style="color:var(--red)">${esc((r && r.error) || 'Could not read that file')}</p>`; return; }
    const notes = (r.notes || []).map(n => `<li>${esc(n)}</li>`).join('');
    if (r.kind === 'doc') {
      out.innerHTML = `<ul class="st-note">${notes}</ul><button class="btn st-go" id="stImpUse">Use this venue</button>`;
      $('stImpUse').onclick = () => useDoc(r.doc, '🏟️ Venue in: ' + r.doc.fixtures.length + ' lights');
    } else {
      const p = r.profile, modes = (p.modes || []).length > 1 ? `<div class="st-row"><b>Mode (how many channels it's set to)</b>${p.modes.map(m => `<button class="btn ${m === p.mode ? 'on' : ''}" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : '';
      out.innerHTML = `<p class="st-note"><b style="color:#fff">${esc(p.name)}</b> · ${esc(p.kind)} · ${p.chans_n || p.chans.length} channels${p.needs_profile ? ' · its channel list is blank, so GlowBop uses a generic one' : ''}</p>${modes}<ul class="st-note">${notes}</ul><button class="btn st-go" id="stImpUse">Add to my lights</button>`;
      out.querySelectorAll('[data-m]').forEach(b => b.onclick = () => importFile(f, b.dataset.m));
      $('stImpUse').onclick = () => { snapshot(); D.profiles = D.profiles || {}; D.profiles[p.id] = p; changed(); closeOv(); GB.toast('➕ ' + p.name + ' is in Add lights'); };
    }
  }

  // ------------------------------------------------------------------ editor (views + side column)
  GB.panel('stage', 20, el => {
    el.id = 'stEdit'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>Build it</span><span class="r">feet · drag to move</span></div>
      <div class="st-bar">${ibtn('undo', 'Undo', 'id="stUndo" disabled')}${ibtn('redo', 'Redo', 'id="stRedo" disabled')}
        <span class="st-seg" id="stViewSeg">${ibtn('top', 'Top', 'data-v="top"')}${ibtn('front', 'Front', 'data-v="front"')}${ibtn('both', 'Both', 'data-v="both"')}</span></div>
      <div class="st-main"><div class="st-views" id="stViews"></div><div class="st-side" id="stSide"></div></div>
      <div class="st-row" id="stPhRow" hidden><b>Photo behind the front view</b>
        <label class="st-note" style="flex:1;min-width:160px">See-through<input class="st-range" type="range" id="stPhO" min="0" max="1" step=".05"></label>
        <label class="st-note" style="flex:1;min-width:160px">Width (ft)<input class="st-range" type="range" id="stPhW" min="2" max="200" step=".5"></label>
        <label class="st-note" style="flex:1;min-width:160px">Slide sideways<input class="st-range" type="range" id="stPhX" min="-100" max="100" step=".25"></label>
        <label class="st-note" style="flex:1;min-width:160px">Raise<input class="st-range" type="range" id="stPhZ" min="-20" max="40" step=".25"></label>
        ${ibtn('trash', 'Remove photo', 'id="stPhDel"')}</div>`;
    $('stUndo').onclick = undo; $('stRedo').onclick = redo;
    el.querySelectorAll('#stViewSeg [data-v]').forEach(b => b.onclick = () => { VIEW = b.dataset.v; try { localStorage.setItem('gb_st_view', VIEW); } catch (e) {} paintViewMode(); });
    const ph = (id, k) => $(id).oninput = () => { if (!D.photo) return; D.photo[k] = +$(id).value; FRONT && FRONT.draw(); clearTimeout(saveT); saveT = setTimeout(save, 600); };
    ph('stPhO', 'op'); ph('stPhW', 'w'); ph('stPhX', 'x'); ph('stPhZ', 'z');
    $('stPhDel').onclick = async () => { await GB.post('/api/stage/photo', {b64: ''}); PHOTO = null; snapshot(); delete D.photo; changed(); };
    if (D) paintAll();
  });
  function paintPhotoRow() {
    const r = $('stPhRow'); if (!r || !D) return; const on = !!(PHOTO && D.photo); r.hidden = !on; if (!on) return;
    $('stPhO').value = D.photo.op; $('stPhW').value = D.photo.w; $('stPhX').value = D.photo.x; $('stPhZ').value = D.photo.z;
  }
  function paintSide() {
    const s = $('stSide'); if (!s || !D) return; paintPhotoRow();
    const imp = Object.values(D.profiles || {}).filter(p => !D.fixtures.some(f => f.type === p.id) || true);
    s.innerHTML = `<div class="st-card" id="stInspect"></div>
      <div class="st-card"><h4>Add lights${SEL && findAny(SEL) && findAny(SEL).t === 'i' && ['truss', 'pipe'].includes(findAny(SEL).o.kind) ? ' to the selected truss' : ''}</h4><div class="st-add">${LIGHTS.map(([k, t]) => `<button data-af="${k}" style="--k:${FK[TY[k] ? TY[k].kind : 'par'] || C}">${fxIcon(TY[k] ? TY[k].kind : 'par')}${esc(t)}${MOV.includes(k) && !pro() ? '<i class="st-pro">PRO</i>' : ''}</button>`).join('')}
        ${imp.map(p => `<button data-af="${esc(p.id)}" style="--k:${FK[p.kind] || C}">${fxIcon(p.kind)}${esc(p.name.split(' (')[0].slice(0, 26))}</button>`).join('')}</div></div>
      <div class="st-card"><h4>Add scenery</h4><div class="st-add">${SCENERY.map(([k, t]) => `<button data-as="${k}" style="--k:${KC[k]}">${scIcon(k)}${esc(t)}</button>`).join('')}
        <button data-as="focus" style="--k:#ffcc66">${sv('focus', '#ffcc66')}Focus point</button></div></div>`;
    s.querySelectorAll('[data-af]').forEach(b => b.onclick = () => addFixture(b.dataset.af));
    s.querySelectorAll('[data-as]').forEach(b => b.onclick = () => addScenery(b.dataset.as));
    paintInspect();
  }
  function addFixture(t) {
    snapshot(); const sel = SEL && findAny(SEL), k = (TY[t] || (D.profiles || {})[t] || {}).kind || 'par';
    const onTruss = sel && sel.t === 'i' && ['truss', 'pipe'].includes(sel.o.kind) ? sel.o : null;
    const n = D.fixtures.filter(f => f.type === t).length + 1, nm = (TY[t] && TY[t].short) || ((D.profiles || {})[t] || {}).name || 'Light';
    let x = 0, y = D.size.d / 2, z = MOV.includes(k) ? 1.5 : 1, hang = false;
    if (onTruss) {                                                               // along the truss, spread out from the middle
      const on = D.fixtures.filter(f => Math.abs(f.y - onTruss.y) < 1 && Math.abs(f.z - (onTruss.z - .6)) < 1.2).length, step = Math.min(3, onTruss.w / 8);
      x = snap(onTruss.x + ((on % 2 ? 1 : -1) * Math.ceil(on / 2)) * step); y = onTruss.y; z = r2(onTruss.z - .6); hang = true;
    }
    const used = D.fixtures.reduce((m, f) => Math.max(m, (f.univ - 1) * 512 + f.addr - 1 + chOf(f)), 0);
    const f = {id: nid('f'), type: t, name: nm + ' ' + n, x, y, z, rot: 0, hang, univ: Math.floor(used / 512) + 1, addr: used % 512 + 1, inv_pan: false, inv_tilt: false};
    if (k === 'bar') f.w = 3.3;
    if (f.addr + chOf(f) - 1 > 512) { f.univ += 1; f.addr = 1; }
    D.fixtures.push(f); SEL = f.id; if (TOP) TOP.sel = FRONT.sel = f.id; changed();
    if (MOV.includes(k) && !pro()) GB.toast('🔒 Moving heads show on your plan; Pro DJ moves them');
  }
  function addScenery(k) {
    snapshot();
    if (k === 'focus') { const p = {id: nid('fc'), name: 'Focus ' + (D.focus.length + 1), x: 0, y: D.size.d / 2, z: 5}; D.focus.push(p); SEL = p.id; changed(); return; }
    const s = SCENERY.find(x => x[0] === k); const i = {id: nid('b'), kind: k, name: s[1], x: 0, y: k === 'truss' || k === 'pipe' ? 1 : D.size.d / 2, z: s[5], w: s[2], d: s[3], h: s[4], rot: 0};
    if (k === 'truss' || k === 'pipe' || k === 'wall') i.w = D.size.w;
    D.items.push(i); SEL = i.id; changed();
  }
  const num = (k, lbl, v, step, w2) => `<label${w2 ? ' class="w2"' : ''}>${lbl}<input type="number" data-k="${k}" value="${v}" step="${step || .25}"></label>`;
  function paintInspect() {
    const box = $('stInspect'); if (!box) return; const a = SEL && findAny(SEL);
    if (!a) { box.innerHTML = `<h4>Pick something</h4><p class="st-note">Tap a light, truss or piece of scenery on either view to change it. Drag to move it: the top view moves it across and front to back, the front view moves it across and up and down.</p>`; return; }
    const o = a.o;
    if (a.t === 'f') {
      const opts = [...LIGHTS.map(([k, t]) => [k, t]), ...Object.values(D.profiles || {}).map(p => [p.id, p.name])].map(([k, t]) => `<option value="${esc(k)}"${k === o.type ? ' selected' : ''}>${esc(t)}</option>`).join('');
      box.innerHTML = `<h4>${esc(o.name)}</h4><div class="st-f"><label class="w2">Name<input data-k="name" value="${esc(o.name)}"></label><label class="w2">Type<select data-k="type">${opts}</select></label>
        ${num('x', 'Across (ft)', o.x)}${num('y', 'Front-back (ft)', o.y)}${num('z', 'Height (ft)', o.z)}${num('rot', 'Turn (°)', o.rot, 15)}
        ${num('univ', 'Universe', o.univ, 1)}${num('addr', 'DMX address', o.addr, 1)}${kindOf(o) === 'bar' ? num('w', 'Bar length (ft)', o.w || 3.3, .1, true) : ''}</div>
        <div class="st-tg"><button class="btn ${o.hang !== false ? 'on' : ''}" data-tg="hang">${o.hang !== false ? 'Hung upside down' : 'Standing on the floor'}</button>
        ${isMv(o) ? `<button class="btn ${o.inv_pan ? 'on' : ''}" data-tg="inv_pan">Flip pan</button><button class="btn ${o.inv_tilt ? 'on' : ''}" data-tg="inv_tilt">Flip tilt</button>` : ''}</div>
        <p class="st-note">${chOf(o)} channels: ${o.univ}.${o.addr} to ${o.univ}.${o.addr + chOf(o) - 1}</p>
        <div class="st-tg">${ibtn('flash', 'Flash it', 'id="stFl"')}${ibtn('copy', 'Duplicate', 'id="stDup"')}${ibtn('trash', 'Delete', 'id="stDel"')}</div>`;
    } else if (a.t === 'i') {
      box.innerHTML = `<h4>${esc(o.name || o.kind)}</h4><div class="st-f"><label class="w2">Name<input data-k="name" value="${esc(o.name || '')}"></label>
        <label class="w2">Kind<select data-k="kind">${Object.keys(KC).map(k => `<option${k === o.kind ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
        ${num('x', 'Across (ft)', o.x)}${num('y', 'Front-back (ft)', o.y)}${num('w', 'Width (ft)', o.w)}${num('d', 'Depth (ft)', o.d)}${num('h', 'Tall (ft)', o.h)}${num('z', 'Raised (ft)', o.z)}${num('rot', 'Turn (°)', o.rot, 15, true)}</div>
        ${['truss', 'pipe'].includes(o.kind) ? `<div class="st-row"><b>Hang lights on it</b><select id="stFillT" style="min-height:48px;flex:1;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px">${LIGHTS.map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}${Object.values(D.profiles || {}).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
          <input id="stFillN" type="number" value="6" min="1" max="48" style="min-height:48px;width:80px;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px"><button class="btn c" id="stFill" style="--c:${C}">Hang them</button></div>` : ''}
        <div class="st-tg">${ibtn('copy', 'Duplicate', 'id="stDup"')}${ibtn('trash', 'Delete', 'id="stDel"')}</div>`;
    } else {
      box.innerHTML = `<h4>Focus point</h4><div class="st-f"><label class="w2">Name<input data-k="name" value="${esc(o.name)}"></label>${num('x', 'Across (ft)', o.x)}${num('y', 'Front-back (ft)', o.y)}${num('z', 'Height (ft)', o.z, .5, true)}</div>
        <p class="st-note">Name it for who stands there (Singer, DJ, Crowd). Moving heads aim here when you hold it in the show controls.</p><div class="st-tg">${ibtn('trash', 'Delete', 'id="stDel"')}</div>`;
    }
    box.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => { snapshot(); const k = inp.dataset.k; o[k] = inp.type === 'number' ? (+inp.value || 0) : inp.value;
      if (k === 'univ') o.univ = Math.max(1, Math.round(o.univ)); if (k === 'addr') o.addr = Math.max(1, Math.min(512, Math.round(o.addr))); changed(); });
    box.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { snapshot(); const k = b.dataset.tg; o[k] = k === 'hang' ? o.hang === false : !o[k]; changed(); });
    const fl = $('stFl'); if (fl) fl.onclick = () => GB.post('/api/stage/flash', {ids: [o.id]});
    const dp = $('stDup'); if (dp) dp.onclick = () => { snapshot(); const c = JSON.parse(JSON.stringify(o)); c.id = nid(a.t === 'f' ? 'f' : 'b'); c.x = r2(c.x + (a.t === 'f' ? 2 : 1)); if (a.t === 'f') { c.name = c.name.replace(/\d+$/, '') + (D.fixtures.length + 1); const used = D.fixtures.reduce((m, f) => Math.max(m, (f.univ - 1) * 512 + f.addr - 1 + chOf(f)), 0); c.univ = Math.floor(used / 512) + 1; c.addr = used % 512 + 1; D.fixtures.push(c); } else D.items.push(c); SEL = c.id; changed(); };
    const dl = $('stDel'); if (dl) dl.onclick = () => { snapshot(); D.fixtures = D.fixtures.filter(x => x.id !== o.id); D.items = D.items.filter(x => x.id !== o.id); D.focus = D.focus.filter(x => x.id !== o.id); SEL = null; changed(); };
    const fi = $('stFill'); if (fi) fi.onclick = () => { snapshot(); const t = $('stFillT').value, n = Math.max(1, Math.min(48, +$('stFillN').value || 1)), k = (TY[t] || D.profiles[t] || {}).kind || 'par';
      const r = (o.rot || 0) * Math.PI / 180; let used = D.fixtures.reduce((m, f) => Math.max(m, (f.univ - 1) * 512 + f.addr - 1 + chOf(f)), 0);
      for (let j = 0; j < n; j++) { const s = -o.w / 2 + o.w * (j + .5) / n, f = {id: nid('f'), type: t, name: ((TY[t] && TY[t].short) || (D.profiles[t] || {}).name || 'Light') + ' ' + (D.fixtures.filter(x => x.type === t).length + 1),
        x: r2(o.x + s * Math.cos(r)), y: r2(o.y - s * Math.sin(r)), z: r2(o.z - .6), rot: o.rot || 0, hang: true, inv_pan: false, inv_tilt: false};
        if (k === 'bar') f.w = Math.min(4, o.w / n * .8); const w = chOf(f); if (used % 512 + w > 512) used = Math.ceil(used / 512) * 512; f.univ = Math.floor(used / 512) + 1; f.addr = used % 512 + 1; used += w; D.fixtures.push(f); }
      changed(); GB.toast(`💡 ${n} lights hung on ${o.name || 'the truss'}`); };
  }

  // ------------------------------------------------------------------ show: output, movement, brightness
  GB.panel('stage', 30, el => {
    el.id = 'stShowP'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>Run the show</span><span class="r" id="stHow"></span></div><div class="st-show" id="stShow"></div>`;
    if (D) paintShow();
  });
  function paintShow() {
    const s = $('stShow'); if (!s || !D) return; const o = D.output || {}, m = D.motion || {}, p = pro();
    const seg = (k, opts, cur) => `<span class="st-seg">${opts.map(([v, t]) => `<button class="btn ${String(cur) === String(v) ? 'on' : ''}" data-${k}="${v}">${esc(t)}</button>`).join('')}</span>`;
    s.innerHTML = `<div class="st-card"><h4>Send to the stage lights</h4>
        <div class="st-row"><b>How your DMX box listens</b>${seg('pr', [['artnet', 'Art-Net'], ['sacn', 'sACN (E1.31)']], o.proto || 'artnet')}</div>
        <div class="st-f"><label class="w2">DMX box address (leave blank to reach the whole network)<input id="stIp" inputmode="decimal" placeholder="e.g. 192.168.0.60" value="${esc(o.ip || '')}"></label></div>
        ${o.proto !== 'sacn' ? `<div class="st-tg"><button class="btn ${o.from1 ? 'on' : ''}" id="stFrom1">My box counts universes from 1</button></div>` : ''}
        <div class="st-row"><button class="btn st-live ${o.on ? 'on' : ''}" id="stLive">${o.on ? '● Sending: tap to hand back' : 'Start sending'}</button></div>
        <p class="st-note" id="stOutNote">${o.on ? 'Live.' : 'Off: the stage only plays on screen.'} Each light takes its colour from GlowBop's show at its spot on the front view.</p>
        <div class="st-row"><b>Stage brightness</b><input class="st-range" type="range" id="stBr" min="0" max="1" step=".05" value="${D.bright == null ? 1 : D.bright}"></div>
        <div class="st-tg">${ibtn('flash', 'Flash every light', 'id="stFlAll"')}</div></div>
      <div class="st-card st-lock ${p ? '' : 'locked'}"><h4>Moving heads</h4>
        <div class="st-row"><b>What they do</b>${seg('mo', [['auto', 'Sweep on the beat'], ['follow', 'Follow the picture'], ['focus', 'Focus points'], ['still', 'Hold still']], m.mode || 'auto')}</div>
        <div class="st-row"><b>Sweep shape</b>${seg('pa', [['auto', 'Mix them'], ['fan', 'Fan'], ['circle', 'Circle'], ['fig8', 'Figure 8'], ['wave', 'Wave'], ['ballyhoo', 'Ballyhoo']], m.pattern || 'auto')}</div>
        <div class="st-row"><b>One sweep lasts (bars)</b>${seg('ba', [[1, '1'], [2, '2'], [4, '4'], [8, '8']], m.bars || 2)}</div>
        <div class="st-row"><b>How wide they sweep</b><input class="st-range" type="range" id="stSz" min=".1" max="1" step=".05" value="${m.size || .7}"></div>
        <div class="st-row"><b>How fast they move</b><input class="st-range" type="range" id="stSp" min=".2" max="3" step=".1" value="${m.speed || 1}"></div>
        <div class="st-row"><b>On the drop</b>${seg('sl', [['true', 'Slam'], ['false', 'Keep sweeping']], m.slam !== false)}</div>
        <div class="st-row"><b>Slam look</b>${seg('lk', [['random', 'Mix them'], ['crowd', 'Hit the crowd'], ['x', 'Cross X'], ['sky', 'Up to the sky'], ['focus', 'Focus point']], m.slam_look || 'random')}</div>
        <div class="st-tg">${ibtn('bolt', 'Test a slam', 'id="stSlam"')}</div>
        <div class="st-row"><b>Focus points: tap to hold every head there, tap again to let go</b>${D.focus.map(f => `<button class="btn ${HOLD === f.id ? 'on' : ''}" data-fo="${esc(f.id)}">${esc(f.name)}</button>`).join('')}</div>
        <div class="st-tg"><button class="btn ${m.auto_focus ? 'on' : ''}" id="stAF">In Focus points mode, move to the next one each sweep</button></div>
        <div class="st-lockcard"><button class="btn" id="stUnlock">🔒 Moving heads are Pro DJ</button></div></div>`;
    const out = async b => { const r = await GB.post('/api/stage/output', b); if (r && r.ok) { D.output = r.output; GB.toast(r.msg); paintShow(); paintSum(); } };
    s.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => out({proto: b.dataset.pr}));
    $('stIp').onchange = () => out({ip: $('stIp').value.trim()});
    const f1 = $('stFrom1'); if (f1) f1.onclick = () => out({from1: !o.from1});
    $('stLive').onclick = () => { GB.sfx && GB.sfx('tap'); out({on: !o.on}); };
    $('stBr').onchange = () => GB.post('/api/stage/bright', {v: +$('stBr').value}).then(r => { if (r && r.ok) D.bright = r.bright; });
    $('stFlAll').onclick = () => GB.post('/api/stage/flash', {all: true});
    const mo = async b => { const r = await GB.post('/api/stage/motion', b); if (r && r.ok) { D.motion = r.motion; paintShow(); } else if (r && r.error) GB.toast(r.error); };
    s.querySelectorAll('[data-mo]').forEach(b => b.onclick = () => mo({mode: b.dataset.mo}));
    s.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => mo({pattern: b.dataset.pa}));
    s.querySelectorAll('[data-ba]').forEach(b => b.onclick = () => mo({bars: +b.dataset.ba}));
    s.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => mo({slam: b.dataset.sl === 'true'}));
    s.querySelectorAll('[data-lk]').forEach(b => b.onclick = () => mo({slam_look: b.dataset.lk}));
    $('stSz').onchange = () => mo({size: +$('stSz').value}); $('stSp').onchange = () => mo({speed: +$('stSp').value});
    $('stAF').onclick = () => mo({auto_focus: !m.auto_focus});
    $('stSlam').onclick = () => GB.post('/api/stage/slam', {});
    s.querySelectorAll('[data-fo]').forEach(b => b.onclick = async () => { const id = HOLD === b.dataset.fo ? null : b.dataset.fo; const r = await GB.post('/api/stage/hold', {focus: id}); if (r && r.ok) { HOLD = r.hold; paintShow(); } });
    $('stUnlock').onclick = e => GB.proLockedTap ? GB.proLockedTap(e.currentTarget, 'Moving heads') : GB.go('pro');
  }
  let HOLD = null;

  // ------------------------------------------------------------------ patch list (DMX addresses)
  GB.panel('stage', 40, el => {
    el.id = 'stPatchP'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>DMX addresses</span><span class="r" id="stClash"></span></div>
      <p class="note">Set each light's DMX address on the light itself to match this list (or change the numbers here to match the lights).</p>
      <div class="st-tg" style="margin-bottom:8px"><button class="btn c" id="stRepatch" style="--c:${C}">Number them all again from 1.1</button></div><div id="stPatch" style="overflow:auto"></div>`;
    $('stRepatch').onclick = async () => { const r = await GB.post('/api/stage/repatch', {doc: D, univ: 1, addr: 1}); if (r && r.ok) { snapshot(); D = r.doc; changed(); GB.toast('🔢 Every light numbered again, in order'); } };
    if (D) paintPatch();
  });
  function paintPatch() {
    const b = $('stPatch'); if (!b || !D) return;
    const bad = new Set(CL.flat()); $('stClash').textContent = CL.length ? `⚠ ${CL.length} clash${CL.length > 1 ? 'es' : ''}` : (D.fixtures.length ? 'no clashes' : '');
    const rows = D.fixtures.slice().sort((a, b2) => a.univ - b2.univ || a.addr - b2.addr);
    b.innerHTML = rows.length ? `<table class="st-tbl"><tr><th>Light</th><th>Type</th><th>Universe</th><th>Address</th><th>Channels</th></tr>${rows.map(f => {
      const L = LIVE[f.id] || {}; return `<tr data-pid="${f.id}" class="${f.id === SEL ? 'sel' : ''} ${bad.has(f.name) ? 'bad' : ''}"><td><span class="st-sw" style="background:${(L.c && L.c[0]) || '#000'}"></span>${esc(f.name)}</td><td>${esc(prof(f.type).name || f.type)}</td><td>${f.univ}</td><td>${f.addr}</td><td>${chOf(f)}</td></tr>`; }).join('')}</table>`
      : '<p class="st-note">No lights yet. Pick a template, import a venue, or add lights.</p>';
    b.querySelectorAll('[data-pid]').forEach(tr => tr.onclick = () => { SEL = tr.dataset.pid; if (TOP) { TOP.sel = FRONT.sel = SEL; TOP.drawLive(); FRONT.drawLive(); } paintSide(); paintPatch(); });
  }

  // ------------------------------------------------------------------ live picture
  let busy = false, tick = 0;
  setInterval(async () => {
    if (busy || GB.page !== 'stage' || document.hidden || !D || !TOP) return; busy = true;
    try {
      const r = await GB.get('/api/stage/live'); LIVE = {}; (r.f || []).forEach(f => LIVE[f.id] = f); HOW = r.how || '';
      TOP.drawLive(); FRONT.drawLive();
      const h = $('stHow'); if (h) h.textContent = (r.bpm ? r.bpm + ' BPM · ' : '') + ({slam: '💥 DROP SLAM', follow: 'following the picture', focus: 'on a focus point', still: 'holding still'}[HOW] || (HOW ? 'sweep: ' + ({fig8: 'figure 8'}[HOW] || HOW) : ''));
      if (++tick % 15 === 0) { paintPatch(); const on = r.out && r.out.on; if (on && r.out.err) $('stOutNote').textContent = '⚠ ' + r.out.err; }
    } catch (e) {} busy = false;
  }, 80);
  GB.on('page', id => { if (id === 'stage' && TOP) setTimeout(() => { TOP.fit(); FRONT.fit(); }, 60); });
  GB.on('pro', () => { if (D) { paintSum(); paintSide(); paintShow(); } });
  GB.stage = {get doc() { return D; }, reload: load};
  // ✏️ ARRANGE: STAGE is one wide column (the four ways in, then the builder, the show and the addresses); HOUSE gets the yard as a band
  (function tpl() { if (!GB.layTPL) return setTimeout(tpl, 200);
    const one = [[0, 48, ['#stHero', '#stEdit', '#stShowP', '#stPatchP']]]; GB.layTPL.stage = {wide: one, tall: one};
    GB.layTPL.house = Object.assign({}, GB.layTPL.house || {}, {full: ['#yardPanel']}); })();
})();
