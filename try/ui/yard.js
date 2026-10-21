/* 🏡 YARD plan (Oct 21, Graham: "Do we have a 2D top for the house as well? Because people like to decorate their yard and other
   areas."). HOUSE tab, under the House Builder: the property from above (street at the bottom). Draw the lot, the house, the
   driveway and walk, trees, bushes and beds; then place decorations: mini trees, path stakes, arches, inflatables, spotlights,
   light strings, stars, deer, candy canes and tree wraps. Each decoration can be tied to one of your GlowBop lights, and the
   live show plays across the yard on screen (each decoration shows the colour at its spot) so you can see a sweep go from the
   street to the house. Same drawing board as STAGE (ui/plan2d.js). Saved in yard.json (GET /api/yard, POST /api/yard/save). */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const C = '#3ce08a';
  GB.css(`
  #yardPanel { container-type:inline-size; }
  #yardPanel .yd-main { display:grid; grid-template-columns:minmax(0, 1fr) 330px; gap:10px; align-items:start; }
  @container (max-width: 900px) { #yardPanel .yd-main { grid-template-columns:1fr; } #yardPanel .yd-main .st-side { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); } }
  #yardPanel .pl-wrap { height:min(64vh, 600px); }
  #yardPanel .btn { min-height:48px; }
  .yd-add { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; }
  .yd-add button { min-height:64px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; border-radius:10px; border:1px solid color-mix(in srgb, var(--k) 60%, transparent);
    background:color-mix(in srgb, var(--k) 10%, #0b0914); color:#fff; cursor:pointer; font:700 12px/1.1 var(--cond); letter-spacing:.5px; text-transform:uppercase; padding:4px; }
  .yd-add button svg { width:26px; height:26px; }
  `);
  // name, colour, default w, d, light?
  const K = {
    house: ['House', '#8f9cff', 50, 40], garage: ['Garage', '#6677ff', 22, 22], drive: ['Driveway', '#5f5590', 18, 50], walk: ['Walk', '#9b8cff', 4, 30],
    bed: ['Garden bed', '#b07a3d', 20, 5], lawn: ['Lawn', '#3ce08a', 40, 30], pool: ['Pool', '#33d6ff', 16, 32], fence: ['Fence', '#cc99ff', 40, .4],
    tree: ['Tree', '#3ce08a', 18, 18], palm: ['Palm', '#b6ff3d', 10, 10], bush: ['Bush', '#3ce08a', 4, 4],
    minitree: ['Mini tree', '#3ce08a', 2, 2, 1], stake: ['Path stakes', '#ffcc66', 20, .5, 1], arch: ['Arch', '#ff5fa2', 6, 1, 1], inflatable: ['Inflatable', '#ff7a3d', 6, 6, 1],
    spot: ['Spotlight', '#ffb23d', 1, 1, 1], string: ['Light string', '#33d6ff', 30, .3, 1], star: ['Star', '#ffcc66', 3, 3, 1], deer: ['Deer', '#e45cff', 4, 2, 1],
    candy: ['Candy cane', '#ff4d6d', 1, 1, 1], tree_light: ['Tree wrap', '#b6ff3d', 18, 18, 1]};
  const PROP = ['house', 'garage', 'drive', 'walk', 'bed', 'lawn', 'pool', 'fence', 'tree', 'palm', 'bush'];
  const DECO = ['minitree', 'stake', 'arch', 'inflatable', 'spot', 'string', 'star', 'deer', 'candy', 'tree_light'];
  let Y = null, SEL = null, PL = null, LIVE = {}, LIGHTS = [], HIST = [], saveT = null;
  const nid = () => 'y' + Math.random().toString(36).slice(2, 10);
  const snap = v => Math.round(v * 2) / 2;
  const icon = k => { const c = K[k][1];
    if (['tree', 'bush', 'palm', 'tree_light'].includes(k)) return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${c}55" stroke="${c}" stroke-width="2"/></svg>`;
    if (k === 'minitree') return `<svg viewBox="0 0 24 24"><path d="M12 2l8 17H4z" fill="${c}"/></svg>`;
    if (k === 'stake') return `<svg viewBox="0 0 24 24">${[4, 10, 16, 22].map(x => `<circle cx="${x - 1}" cy="12" r="2.2" fill="${c}"/>`).join('')}</svg>`;
    if (k === 'arch') return `<svg viewBox="0 0 24 24"><path d="M3 20V12a9 9 0 0118 0v8" fill="none" stroke="${c}" stroke-width="3"/></svg>`;
    if (k === 'string' || k === 'fence') return `<svg viewBox="0 0 24 24"><path d="M2 12h20" stroke="${c}" stroke-width="3" stroke-dasharray="${k === 'string' ? '2 2' : '0'}"/></svg>`;
    if (k === 'star') return `<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" fill="${c}"/></svg>`;
    if (k === 'spot') return `<svg viewBox="0 0 24 24"><path d="M4 12l16-8v16z" fill="${c}"/></svg>`;
    if (k === 'candy') return `<svg viewBox="0 0 24 24"><path d="M9 22V8a4 4 0 018 0" fill="none" stroke="${c}" stroke-width="3.5"/></svg>`;
    return `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="${k === 'inflatable' || k === 'pool' ? 6 : 1}" fill="${c}44" stroke="${c}" stroke-width="2"/></svg>`; };

  function paint(P) {
    const L = Y.lot, out = [];
    out.push(`<rect x="${-L.w / 2}" y="0" width="${L.w}" height="${L.d}" fill="#0f2a1a" stroke="#3ce08a" stroke-width="2" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/>`);
    out.push(`<rect x="${-L.w / 2 - 20}" y="-14" width="${L.w + 40}" height="12" fill="#1a1628"/>`, P.txt(0, -8, 'STREET', 'cr', 13));
    for (const it of Y.items.filter(i => PROP.includes(i.kind))) out.push(shape(it, P, null));
    return out.join('');
  }
  function live(P) { return Y.items.filter(i => DECO.includes(i.kind)).map(it => shape(it, P, LIVE[it.id])).join(''); }
  function shape(it, P, col) {
    const [nm, c] = K[it.kind], f = col || (DECO.includes(it.kind) ? '#000' : c + '33'), st = DECO.includes(it.kind) ? c : c;
    const g = (inner) => `<g data-id="${it.id}" transform="translate(${it.x} ${it.y}) rotate(${-(it.rot || 0)})">${inner}</g>`;
    const vs = 'vector-effect="non-scaling-stroke"';
    if (['tree', 'bush', 'palm'].includes(it.kind)) return g(`<circle class="pl-o" r="${it.w / 2}" fill="${f}" stroke="${st}" stroke-width="2" ${vs}/>`) + (it.w * P.k > 60 ? P.txt(it.x, it.y, it.name || nm, 'lb', 10) : '');
    if (it.kind === 'tree_light') return g(`<circle class="pl-o" r="${it.w / 2}" fill="none" stroke="${col || c}" stroke-width="6" stroke-dasharray="3 3" ${vs}/>`);
    if (it.kind === 'minitree') return g(`<path class="pl-o" d="M0 ${it.w * .6}L${it.w / 2} ${-it.w * .4}H${-it.w / 2}z" fill="${f}" stroke="${st}" stroke-width="2" ${vs}/>`);
    if (it.kind === 'stake') { const n = Math.max(2, it.n || Math.round(it.w / 4) + 1); return g(`<rect class="pl-o" x="${-it.w / 2}" y="-.6" width="${it.w}" height="1.2" fill="#0000" stroke="${c}55" stroke-width="1" ${vs}/>` +
      Array.from({length: n}, (_, j) => `<circle cx="${-it.w / 2 + it.w * j / (n - 1)}" cy="0" r=".5" fill="${col || '#000'}" stroke="${c}" stroke-width="1.5" ${vs}/>`).join('')); }
    if (it.kind === 'arch') return g(`<path class="pl-o" d="M${-it.w / 2} 0A${it.w / 2} ${it.w / 2} 0 0 1 ${it.w / 2} 0" fill="none" stroke="${col && col !== '#000' ? col : c}" stroke-width="5" ${vs}/>`);
    if (it.kind === 'string' || it.kind === 'fence') return g(`<line class="pl-o" x1="${-it.w / 2}" y1="0" x2="${it.w / 2}" y2="0" stroke="${it.kind === 'string' ? (col && col !== '#000' ? col : c) : c}" stroke-width="${it.kind === 'string' ? 5 : 3}" ${it.kind === 'string' ? 'stroke-dasharray="4 3"' : ''} ${vs}/><rect x="${-it.w / 2}" y="-.8" width="${it.w}" height="1.6" fill="#0000"/>`);
    if (it.kind === 'spot') return g(`<path class="pl-o" d="M0 0L${it.w * 6} ${-it.w * 2}V${it.w * 2}z" fill="${col || '#000'}" opacity=".5"/><circle class="pl-o" r="${it.w / 2}" fill="${col || '#000'}" stroke="${c}" stroke-width="2" ${vs}/>`);
    if (it.kind === 'star') return g(`<path class="pl-o" transform="scale(${it.w / 20})" d="M0 -10l3 7 7 .6-5.3 4.7 1.6 7.2L0 5.8-6.3 9.5l1.6-7.2L-10-2.4l7-.6z" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/>`);
    const rx = ['inflatable', 'pool'].includes(it.kind) ? Math.min(it.w, it.d) / 3 : 0;
    return g(`<rect class="pl-o" x="${-it.w / 2}" y="${-it.d / 2}" width="${it.w}" height="${it.d}" rx="${rx}" fill="${f}" stroke="${st}" stroke-width="2" ${vs}/>`) + (!DECO.includes(it.kind) && it.w * P.k > 60 ? P.txt(it.x, it.y, it.name || nm, 'lb', 11) : '');
  }
  function bounds() { const L = Y.lot; return [-L.w / 2 - 6, -16, L.w / 2 + 6, L.d + 6]; }
  async function save() { try { const r = await GB.post('/api/yard/save', {yard: Y}); if (r && r.ok) Y = r.yard; } catch (e) {} }
  function changed() { PL && PL.draw(); side(); clearTimeout(saveT); saveT = setTimeout(save, 500); }
  const snapH = () => { HIST.push(JSON.stringify(Y)); if (HIST.length > 60) HIST.shift(); };

  GB.panel('house', 20, el => {
    el.id = 'yardPanel'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>Yard plan</span><span class="r">from above · street at the bottom</span></div>
      <p class="note">Lay out the yard: the lot, house, driveway, trees, then your decorations. Tie a decoration to one of your lights and watch the show move across the yard.</p>
      <div class="st-bar"><button class="btn st-ib" id="ydUndo" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg><span>Undo</span></button>
        <label class="st-note" style="display:flex;gap:6px;align-items:center">Lot width (ft)<input id="ydW" type="number" min="10" style="min-height:48px;width:90px;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px"></label>
        <label class="st-note" style="display:flex;gap:6px;align-items:center">Lot depth (ft)<input id="ydD" type="number" min="10" style="min-height:48px;width:90px;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px"></label></div>
      <div class="yd-main"><div id="ydPlan"></div><div class="st-side"><div class="st-card" id="ydInspect"></div>
        <div class="st-card"><h4 style="color:${C}">Decorations</h4><div class="yd-add">${DECO.map(k => `<button data-ya="${k}" style="--k:${K[k][1]}">${icon(k)}${esc(K[k][0])}</button>`).join('')}</div></div>
        <div class="st-card"><h4 style="color:${C}">Yard and house</h4><div class="yd-add">${PROP.map(k => `<button data-ya="${k}" style="--k:${K[k][1]}">${icon(k)}${esc(K[k][0])}</button>`).join('')}</div></div></div></div>`;
    el.querySelectorAll('[data-ya]').forEach(b => b.onclick = () => add(b.dataset.ya));
    $('ydUndo').onclick = () => { if (!HIST.length) return; Y = JSON.parse(HIST.pop()); $('ydUndo').disabled = !HIST.length; changed(); };
    const lot = () => { snapH(); Y.lot.w = Math.max(10, +$('ydW').value || 80); Y.lot.d = Math.max(10, +$('ydD').value || 120); PL.fit(); changed(); };
    $('ydW').onchange = lot; $('ydD').onchange = lot;
    GB.get('/api/yard').then(r => { Y = r.yard; $('ydW').value = Y.lot.w; $('ydD').value = Y.lot.d; mk(); }).catch(() => {});
    GB.get('/api/lights').then(r => { LIGHTS = (r.devices || []).map(d => ({id: d.id, name: d.name})); }).catch(() => {});
  });
  function mk() {
    let snapped = false;
    PL = GB.Plan($('ydPlan'), {id: 'yd', caption: 'Yard from above', flipY: true, bounds, paint, live,
      pick: id => { SEL = id; side(); PL.drawLive(); PL.draw(); },
      drag: (id, dx, dy) => { const it = Y.items.find(i => i.id === id); if (!it) return; if (!snapped) { snapH(); snapped = true; $('ydUndo').disabled = false; }
        it._x = (it._x == null ? it.x : it._x) + dx; it._y = (it._y == null ? it.y : it._y) + dy; it.x = snap(it._x); it.y = snap(it._y); PL.draw(); },
      dragEnd: () => { snapped = false; Y.items.forEach(i => { delete i._x; delete i._y; }); changed(); },
      tap: () => { SEL = null; PL.sel = null; side(); PL.draw(); }});
    side();
  }
  function add(k) {
    if (!Y) return; snapH(); $('ydUndo').disabled = false; const [nm, , w, d] = K[k];
    const it = {id: nid(), kind: k, name: nm, x: 0, y: Math.min(Y.lot.d * .25, 25), w, d, rot: 0};
    if (k === 'stake') it.n = 6;
    Y.items.push(it); SEL = it.id; PL.sel = it.id; changed();
  }
  function side() {
    const b = $('ydInspect'); if (!b || !Y) return; const it = SEL && Y.items.find(i => i.id === SEL);
    if (!it) { b.innerHTML = `<h4 style="color:${C}">Pick something</h4><p class="st-note">Tap anything on the yard to size, turn or tie it to a light. Drag it to move it.</p>`; return; }
    const isD = DECO.includes(it.kind), n = (k, l, v, s) => `<label>${l}<input type="number" data-k="${k}" value="${v}" step="${s || .5}"></label>`;
    b.innerHTML = `<h4 style="color:${C}">${esc(it.name || K[it.kind][0])}</h4><div class="st-f"><label class="w2">Name<input data-k="name" value="${esc(it.name || '')}"></label>
      ${n('x', 'Across (ft)', it.x)}${n('y', 'From the street (ft)', it.y)}${n('w', ['tree', 'bush', 'palm', 'tree_light'].includes(it.kind) ? 'Across (ft)' : 'Long (ft)', it.w)}${['tree', 'bush', 'palm', 'tree_light', 'string', 'fence', 'stake', 'arch', 'minitree', 'spot', 'candy', 'star'].includes(it.kind) ? '' : n('d', 'Deep (ft)', it.d)}
      ${n('rot', 'Turn (°)', it.rot, 15)}${it.kind === 'stake' ? n('n', 'How many stakes', it.n || 6, 1) : ''}
      ${isD ? `<label class="w2">Which light is this?<select data-k="light"><option value="">Not tied to a light yet</option>${LIGHTS.map(l => `<option value="${esc(l.id)}"${l.id === it.light ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>` : ''}</div>
      <div class="st-tg"><button class="btn st-ib" id="ydDup"><span>Duplicate</span></button><button class="btn st-ib" id="ydDel"><span>Delete</span></button></div>`;
    b.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => { snapH(); $('ydUndo').disabled = false; const k = inp.dataset.k; it[k] = inp.type === 'number' ? (+inp.value || 0) : inp.value; if (k === 'light' && !inp.value) delete it.light; changed(); });
    $('ydDup').onclick = () => { snapH(); const c = JSON.parse(JSON.stringify(it)); c.id = nid(); c.x += Math.max(2, it.w * .6); Y.items.push(c); SEL = c.id; PL.sel = c.id; changed(); };
    $('ydDel').onclick = () => { snapH(); Y.items = Y.items.filter(i => i.id !== it.id); SEL = null; PL.sel = null; changed(); };
  }
  let busy = false;
  setInterval(async () => {
    if (busy || GB.page !== 'house' || document.hidden || !PL || !Y || !Y.items.some(i => DECO.includes(i.kind))) return; busy = true;
    try { const r = await GB.get('/api/yard/live'); LIVE = r.c || {}; PL.drawLive(); } catch (e) {} busy = false;
  }, 100);
  GB.on('page', id => { if (id === 'house' && PL) setTimeout(() => PL.fit(), 60); });
})();
