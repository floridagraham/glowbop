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
  #yardPanel .yd-views { display:flex; flex-direction:column; gap:8px; min-width:0; }
  #yardPanel .pl-wrap { height:min(44vh, 420px); }
  #yardPanel .yd-views.one .pl-wrap { height:min(64vh, 600px); }
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
    candy: ['Candy cane', '#ff4d6d', 1, 1, 1], tree_light: ['Tree wrap', '#b6ff3d', 18, 18, 1], sign: ['Sign', '#ffcc66', 6, .5, 1], screen: ['LED screen', '#33d6ff', 10, .5, 1]};
  const PROP = ['house', 'garage', 'drive', 'walk', 'bed', 'lawn', 'pool', 'fence', 'tree', 'palm', 'bush'];
  const DECO = ['minitree', 'stake', 'arch', 'inflatable', 'spot', 'string', 'star', 'deer', 'candy', 'tree_light', 'sign', 'screen'];
  let VIEW = 'both', ST = null, MINE = null, Y = null, SEL = null, PL = null, LIVE = {}, LIGHTS = [], HIST = [], saveT = null;
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
  function live(P) { return Y.items.filter(i => DECO.includes(i.kind)).map(it => shape(it, P, LIVE[it.id])).join('') + marks(P); }
  function marks(P) {
    const st = MINE && MINE.state; if (!st || !Y.mylights) return '';
    return Y.items.map(it => { const nm = Object.keys(Y.mylights).filter(l => Y.mylights[l] === it.id).map(l => (st.lights.find(x => x.id === l) || {}).name || l).join(' + ');
      if (!nm) return ''; const big = ['house', 'garage'].includes(it.kind);
      return `<rect x="${it.x - it.w / 2 - .5}" y="${it.y - (big ? it.d / 2 : it.d / 2) - .5}" width="${it.w + 1}" height="${(big ? it.d : Math.max(it.d, 1)) + 1}" fill="none" stroke="#33d6ff" stroke-width="3" stroke-dasharray="8 5" vector-effect="non-scaling-stroke" pointer-events="none"/>` +
        P.txt(it.x, big ? it.y : it.y - Math.max(it.d, 1) / 2 - 2.2, '💡 ' + nm, '', 12); }).join('');
  }
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
  async function save() { try { const r = await GB.post('/api/yard/save', {yard: Y}); if (r && r.ok) { Y.mylights = r.yard.mylights; MINE && MINE.reload(); } } catch (e) {} }
  function changed() { drawAll(); side(); clearTimeout(saveT); saveT = setTimeout(save, 500); }
  const snapH = () => { HIST.push(JSON.stringify(Y)); if (HIST.length > 60) HIST.shift(); };

  GB.panel('house', 20, el => {
    el.id = 'yardPanel'; el.classList.add('box'); el.style.setProperty('--c', C);
    el.innerHTML = `<div class="ph"><span>Yard plan</span><span class="r">from above · street at the bottom</span></div>
      <p class="note">Lay out the yard: the lot, house, driveway, trees, then your decorations. Tie a decoration to one of your lights and watch the show move across the yard.</p>
      <div class="st-bar"><button class="btn st-ib" id="ydUndo" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg><span>Undo</span></button>
        <label class="st-note" style="display:flex;gap:6px;align-items:center">Lot width (ft)<input id="ydW" type="number" min="10" style="min-height:48px;width:90px;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px"></label>
        <label class="st-note" style="display:flex;gap:6px;align-items:center">Lot depth (ft)<input id="ydD" type="number" min="10" style="min-height:48px;width:90px;background:#120f20;color:#fff;border:1px solid var(--line);border-radius:8px;padding:0 8px"></label></div>
      <div id="ydMine"></div>
      <div class="st-row" id="ydTpl"><b>Start from a template (then move, size or delete anything: every yard is different)</b></div>
      <div class="st-bar"><span class="st-seg" id="ydViewSeg"><button class="btn" data-yv="top">Top</button><button class="btn" data-yv="street">Street view</button><button class="btn" data-yv="both">Both</button></span></div>
      <div class="yd-main"><div class="yd-views" id="ydViews"><div id="ydPlan"></div><div id="ydStreet"></div></div><div class="st-side"><div class="st-card" id="ydInspect"></div>
        <div class="st-card"><h4 style="color:${C}">Decorations</h4><div class="yd-add">${DECO.map(k => `<button data-ya="${k}" style="--k:${K[k][1]}">${icon(k)}${esc(K[k][0])}</button>`).join('')}</div></div>
        <div class="st-card"><h4 style="color:${C}">Yard and house</h4><div class="yd-add">${PROP.map(k => `<button data-ya="${k}" style="--k:${K[k][1]}">${icon(k)}${esc(K[k][0])}</button>`).join('')}</div></div></div></div>`;
    el.querySelectorAll('[data-ya]').forEach(b => b.onclick = () => add(b.dataset.ya));
    MINE = GB.myLights ? GB.myLights($('ydMine'), 'yard') : null;
    try { VIEW = localStorage.getItem('gb_yd_view') || 'both'; } catch (e) {}
    el.querySelectorAll('[data-yv]').forEach(b => b.onclick = () => { VIEW = b.dataset.yv; try { localStorage.setItem('gb_yd_view', VIEW); } catch (e) {} viewMode(); });
    $('ydUndo').onclick = () => { if (!HIST.length) return; Y = JSON.parse(HIST.pop()); $('ydUndo').disabled = !HIST.length; changed(); };
    const lot = () => { snapH(); Y.lot.w = Math.max(10, +$('ydW').value || 80); Y.lot.d = Math.max(10, +$('ydD').value || 120); fitAll(); changed(); };
    $('ydW').onchange = lot; $('ydD').onchange = lot;
    GB.get('/api/yard').then(r => { Y = r.yard; $('ydW').value = Y.lot.w; $('ydD').value = Y.lot.d; mk(); tpls(r.templates || []); }).catch(() => {});
    GB.get('/api/lights').then(r => { LIGHTS = (r.devices || []).map(d => ({id: d.id, name: d.name})); }).catch(() => {});
  });
  function tpls(T) {
    const row = $('ydTpl'); if (!row) return;
    row.insertAdjacentHTML('beforeend', T.map(t => `<button class="btn${/^xmas/.test(t.key) ? ' c' : ''}" data-yt="${t.key}" title="${esc(t.about)}" style="${/^xmas/.test(t.key) ? '--c:#ff4d6d' : ''}">${esc(t.name)}</button>`).join(''));
    row.querySelectorAll('[data-yt]').forEach(b => b.onclick = async () => { const r = await GB.post('/api/yard/template', {key: b.dataset.yt}); if (!r || !r.ok) return;
      snapH(); $('ydUndo').disabled = false; Y = r.yard; SEL = null; setSel(null); $('ydW').value = Y.lot.w; $('ydD').value = Y.lot.d; fitAll(); changed();
      GB.toast('🏡 ' + b.textContent + ': move, size or delete anything to match your yard. Undo brings yours back.'); });
  }
  function drawAll() { PL && PL.draw(); ST && ST.draw(); }
  function liveAll() { PL && PL.drawLive(); ST && ST.drawLive(); }
  function fitAll() { PL && PL.fit(); ST && ST.fit(); }
  function setSel(id) { if (PL) PL.sel = id; if (ST) ST.sel = id; }
  function viewMode() {
    const v = $('ydViews'); if (!v) return; v.classList.toggle('one', VIEW !== 'both');
    $('ydPlan').hidden = VIEW === 'street'; $('ydStreet').hidden = VIEW === 'top';
    document.querySelectorAll('#ydViewSeg [data-yv]').forEach(b => b.classList.toggle('on', b.dataset.yv === VIEW));
    setTimeout(fitAll, 30);
  }
  // 🏠 street view (Oct 21, Graham: "like in stage, you see top and you see what you would see from the audience perspective"):
  //   the yard from the street, across and up, farther things behind nearer ones
  const GROUND = ['drive', 'walk', 'lawn', 'bed', 'pool'];
  const zt = () => Math.max(10, ...Y.items.filter(i => !GROUND.includes(i.kind)).map(i => (i.z || 0) + (i.h || 3) + (['house', 'garage'].includes(i.kind) ? i.w * .2 : 0)));
  function sBounds() { const L = Y.lot; return [-L.w / 2 - 6, -2, L.w / 2 + 6, zt() + 3]; }
  const across = it => { const r = (it.rot || 0) * Math.PI / 180; return ['tree', 'palm', 'tree_light', 'bush'].includes(it.kind) ? it.w : Math.abs(it.w * Math.cos(r)) + Math.abs((it.d || 0) * Math.sin(r)); };
  function sPaint(P) {
    const L = Y.lot, out = [], vs = 'vector-effect="non-scaling-stroke"';
    out.push(`<rect x="${-L.w / 2 - 30}" y="-2" width="${L.w + 60}" height="2" fill="#0f2a1a"/><line x1="${-L.w / 2 - 30}" y1="0" x2="${L.w / 2 + 30}" y2="0" stroke="#3ce08a" stroke-width="1.5" ${vs}/>`, P.txt(-L.w / 2 - 2, -1, 'GROUND', 'lb', 10));
    for (const it of Y.items.filter(i => PROP.includes(i.kind) && !GROUND.includes(i.kind)).sort((a, b) => b.y - a.y)) {
      const [, c] = K[it.kind], x = it.x, z = it.z || 0, h = it.h || 3, w = across(it); let g = '';
      if (it.kind === 'house' || it.kind === 'garage') { const rh = w * (it.kind === 'house' ? .2 : .14);
        g = `<rect class="pl-o" x="${x - w / 2}" y="${z}" width="${w}" height="${h}" fill="${c}26" stroke="${c}" stroke-width="2" ${vs}/><polygon points="${x - w / 2 - 1},${z + h} ${x},${z + h + rh} ${x + w / 2 + 1},${z + h}" fill="${c}18" stroke="${c}" stroke-width="2" ${vs}/>` +
          (it.kind === 'house' ? `<rect x="${x - 2}" y="${z}" width="4" height="7" fill="none" stroke="${c}" stroke-width="1.5" ${vs}/><rect x="${x - w / 3 - 2.5}" y="${z + 4}" width="5" height="4" fill="none" stroke="${c}" stroke-width="1.5" ${vs}/><rect x="${x + w / 3 - 2.5}" y="${z + 4}" width="5" height="4" fill="none" stroke="${c}" stroke-width="1.5" ${vs}/>`
            : `<rect x="${x - w / 2 + 1.5}" y="${z}" width="${w - 3}" height="${h * .75}" fill="none" stroke="${c}" stroke-width="1.5" ${vs}/>`); }
      else if (it.kind === 'tree') g = `<rect x="${x - .7}" y="${z}" width="1.4" height="${h * .35}" fill="#7a5230"/><ellipse class="pl-o" cx="${x}" cy="${z + h * .6}" rx="${w / 2}" ry="${h * .4}" fill="${c}26" stroke="${c}" stroke-width="2" ${vs}/>`;
      else if (it.kind === 'palm') g = `<path class="pl-o" d="M${x} ${z}Q${x + 1} ${z + h * .5} ${x} ${z + h}" stroke="#b07a3d" stroke-width="4" fill="none" ${vs}/>` + [-1, -.5, 0, .5, 1].map(k => `<path d="M${x} ${z + h}Q${x + k * w * .35} ${z + h + 2} ${x + k * w * .5} ${z + h - 3}" stroke="${c}" stroke-width="3" fill="none" ${vs}/>`).join('');
      else if (it.kind === 'bush') g = `<ellipse class="pl-o" cx="${x}" cy="${z + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${c}26" stroke="${c}" stroke-width="2" ${vs}/>`;
      else if (it.kind === 'fence') g = `<rect class="pl-o" x="${x - Math.max(w, .6) / 2}" y="${z}" width="${Math.max(w, .6)}" height="${h}" fill="none" stroke="${c}" stroke-width="2" ${vs}/>`;
      if (g) out.push(`<g data-id="${it.id}">${g}</g>`);
      if (['house', 'garage'].includes(it.kind) && w * P.k > 60) out.push(P.txt(x, z + h + 1.2, it.name || K[it.kind][0], 'lb', 11));
    }
    return out.join('');
  }
  function sLive(P) {
    const out = [], vs = 'vector-effect="non-scaling-stroke"';
    for (const it of Y.items.filter(i => DECO.includes(i.kind)).sort((a, b) => b.y - a.y)) {
      const c = K[it.kind][1], col = LIVE[it.id] && LIVE[it.id] !== '#000000' ? LIVE[it.id] : null, f = col || '#000', st = c, x = it.x, z = it.z || 0, h = it.h || 1, w = across(it); let g = '';
      if (it.kind === 'minitree') g = `<polygon class="pl-o" points="${x - w / 2},${z} ${x},${z + h} ${x + w / 2},${z}" fill="${f}" stroke="${st}" stroke-width="2" ${vs}/>`;
      else if (it.kind === 'tree_light') g = `<polygon class="pl-o" points="${x - w * .45},${z + h * .15} ${x},${z + h} ${x + w * .45},${z + h * .15}" fill="none" stroke="${col || c}" stroke-width="5" stroke-dasharray="3 3" ${vs}/>`;
      else if (it.kind === 'stake') { const n = Math.max(2, it.n || 6), L2 = Math.abs(Math.sin((it.rot || 0) * Math.PI / 180)) > .7 ? 1.5 : w;
        g = `<rect class="pl-o" x="${x - L2 / 2 - .4}" y="${z}" width="${L2 + .8}" height="${h + .4}" fill="#0000" stroke="${c}44" ${vs}/>` + Array.from({length: n}, (_, j) => `<circle cx="${x - L2 / 2 + L2 * j / (n - 1)}" cy="${z + h}" r=".45" fill="${f}" stroke="${c}" stroke-width="1.5" ${vs}/>`).join(''); }
      else if (it.kind === 'arch') g = `<path class="pl-o" d="M${x - w / 2} ${z}V${z + h - w / 2}A${w / 2} ${w / 2} 0 0 0 ${x + w / 2} ${z + h - w / 2}V${z}" fill="none" stroke="${col || c}" stroke-width="5" ${vs}/>`;
      else if (it.kind === 'string') { const L2 = Math.abs(Math.sin((it.rot || 0) * Math.PI / 180)) > .7 ? 1.5 : w;
        g = `<line class="pl-o" x1="${x - L2 / 2}" y1="${z}" x2="${x + L2 / 2}" y2="${z}" stroke="${col || c}" stroke-width="5" stroke-dasharray="4 3" ${vs}/><rect x="${x - L2 / 2}" y="${z - .7}" width="${L2}" height="1.4" fill="#0000"/>`; }
      else if (it.kind === 'star') g = `<path class="pl-o" transform="translate(${x} ${z + h / 2}) scale(${it.w / 20})" d="M0 10l3-7 7-.6-5.3-4.7 1.6-7.2L0-5.8-6.3-9.5l1.6 7.2L-10 2.4l7 .6z" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/>`;
      else if (it.kind === 'spot') g = `<polygon points="${x},${z + .5} ${x - 2},${z + 9} ${x + 2},${z + 9}" fill="${col || '#000'}" opacity=".35"/><rect class="pl-o" x="${x - .6}" y="${z}" width="1.2" height="${Math.max(h, 1)}" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/>`;
      else if (it.kind === 'candy') g = `<path class="pl-o" d="M${x} ${z}V${z + h - .6}A.6 .6 0 0 0 ${x - 1.2} ${z + h - .6}" fill="none" stroke="${col || c}" stroke-width="4" ${vs}/>`;
      else if (it.kind === 'deer') g = `<rect class="pl-o" x="${x - w / 2}" y="${z + h * .45}" width="${w * .8}" height="${h * .3}" rx=".4" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/><line x1="${x + w * .3}" y1="${z + h * .7}" x2="${x + w * .45}" y2="${z + h}" stroke="${c}" stroke-width="2" ${vs}/>` + [-.4, -.2, .1, .25].map(k => `<line x1="${x + k * w}" y1="${z}" x2="${x + k * w}" y2="${z + h * .45}" stroke="${c}" stroke-width="2" ${vs}/>`).join('');
      else if (it.kind === 'sign' || it.kind === 'screen') g = `<rect class="pl-o" x="${x - w / 2}" y="${z}" width="${w}" height="${h}" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/>` +
        (it.kind === 'sign' ? `<line x1="${x - w * .3}" y1="0" x2="${x - w * .3}" y2="${z}" stroke="${c}" stroke-width="2" ${vs}/><line x1="${x + w * .3}" y1="0" x2="${x + w * .3}" y2="${z}" stroke="${c}" stroke-width="2" ${vs}/>` : '') + P.txt(x, z + h / 2, it.name || K[it.kind][0], '', 11);
      else g = `<rect class="pl-o" x="${x - w / 2}" y="${z}" width="${w}" height="${h}" rx="${Math.min(w, h) / 3}" fill="${f}" stroke="${c}" stroke-width="2" ${vs}/>`;
      out.push(`<g data-id="${it.id}">${g}</g>`);
    }
    return out.join('') + sMarks(P);
  }
  function sMarks(P) {
    const st = MINE && MINE.state; if (!st || !Y.mylights) return '';
    return Y.items.map(it => { const nm = Object.keys(Y.mylights).filter(l => Y.mylights[l] === it.id).map(l => (st.lights.find(x => x.id === l) || {}).name || l).join(' + ');
      if (!nm) return ''; const w = across(it), z = it.z || 0, h = Math.max(it.h || 1, .6);
      return `<rect x="${it.x - w / 2 - .5}" y="${z - .5}" width="${w + 1}" height="${h + 1}" fill="none" stroke="#33d6ff" stroke-width="3" stroke-dasharray="8 5" vector-effect="non-scaling-stroke" pointer-events="none"/>` + P.txt(it.x, ['house', 'garage'].includes(it.kind) ? z + h * .55 : z + h + 1.6, '💡 ' + nm, '', 12); }).join('');
  }
  function mk() {
    let snapped = false;
    PL = GB.Plan($('ydPlan'), {id: 'yd', caption: 'Yard from above', flipY: true, bounds, paint, live,
      pick: id => { SEL = id; setSel(id); side(); drawAll(); },
      drag: (id, dx, dy) => { const it = Y.items.find(i => i.id === id); if (!it) return; if (!snapped) { snapH(); snapped = true; $('ydUndo').disabled = false; }
        it._x = (it._x == null ? it.x : it._x) + dx; it._y = (it._y == null ? it.y : it._y) + dy; it.x = snap(it._x); it.y = snap(it._y); drawAll(); },
      dragEnd: () => { snapped = false; Y.items.forEach(i => { delete i._x; delete i._y; }); changed(); },
      tap: () => { SEL = null; setSel(null); side(); drawAll(); }});
    let snapped2 = false;
    ST = GB.Plan($('ydStreet'), {id: 'yds', caption: 'Street view · what you see from the street', flipY: true, bounds: sBounds, paint: sPaint, live: sLive,
      pick: id => { SEL = id; setSel(id); side(); drawAll(); },
      drag: (id, dx, dy) => { const it = Y.items.find(i => i.id === id); if (!it) return; if (!snapped2) { snapH(); snapped2 = true; $('ydUndo').disabled = false; }
        it._x = (it._x == null ? it.x : it._x) + dx; it.x = snap(it._x);
        if (DECO.includes(it.kind)) { it._z = (it._z == null ? (it.z || 0) : it._z) + dy; it.z = Math.max(0, snap(it._z)); }
        drawAll(); },
      dragEnd: () => { snapped2 = false; Y.items.forEach(i => { delete i._x; delete i._z; }); changed(); },
      tap: () => { SEL = null; setSel(null); side(); drawAll(); }});
    viewMode();
    side();
  }
  function add(k) {
    if (!Y) return; snapH(); $('ydUndo').disabled = false; const [nm, , w, d] = K[k];
    const ZH = {sign: [1, 3], screen: [2, 6], house: [0, 12], garage: [0, 10], fence: [0, 5], tree: [0, 22], palm: [0, 26], bush: [0, 3.5], minitree: [0, 3], stake: [0, 1.5], arch: [0, 7], inflatable: [0, 7], spot: [0, 1], string: [8, .3], star: [10, 3], deer: [0, 4], candy: [0, 3], tree_light: [0, 20]}[k] || [0, .2];
    const it = {id: nid(), kind: k, name: nm, x: 0, y: Math.min(Y.lot.d * .25, 25), w, d, rot: 0, z: ZH[0], h: ZH[1]};
    if (k === 'stake') it.n = 6;
    Y.items.push(it); SEL = it.id; setSel(it.id); changed();
  }
  function side() {
    const b = $('ydInspect'); if (!b || !Y) return; const it = SEL && Y.items.find(i => i.id === SEL);
    if (!it) { b.innerHTML = `<h4 style="color:${C}">Pick something</h4><p class="st-note">Tap anything on the yard to size, turn or tie it to a light. Drag it to move it.</p>`; return; }
    const isD = DECO.includes(it.kind), n = (k, l, v, s) => `<label>${l}<input type="number" data-k="${k}" value="${v}" step="${s || .5}"></label>`;
    b.innerHTML = `<h4 style="color:${C}">${esc(it.name || K[it.kind][0])}</h4><div class="st-f"><label class="w2">Name<input data-k="name" value="${esc(it.name || '')}"></label>
      ${n('x', 'Across (ft)', it.x)}${n('y', 'From the street (ft)', it.y)}${n('w', ['tree', 'bush', 'palm', 'tree_light'].includes(it.kind) ? 'Across (ft)' : 'Long (ft)', it.w)}${['tree', 'bush', 'palm', 'tree_light', 'string', 'fence', 'stake', 'arch', 'minitree', 'spot', 'candy', 'star'].includes(it.kind) ? '' : n('d', 'Deep (ft)', it.d)}
      ${GROUND.includes(it.kind) ? '' : n('z', 'Off the ground (ft)', it.z || 0) + n('h', 'Tall (ft)', it.h || 1)}
      ${n('rot', 'Turn (°)', it.rot, 15)}${it.kind === 'stake' ? n('n', 'How many stakes', it.n || 6, 1) : ''}
      ${isD ? `<label class="w2">Which light is this?<select data-k="light"><option value="">Not tied to a light yet</option>${LIGHTS.map(l => `<option value="${esc(l.id)}"${l.id === it.light ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select></label>` : ''}</div>
      <div class="st-tg"><button class="btn st-ib" id="ydDup"><span>Duplicate</span></button><button class="btn st-ib" id="ydDel"><span>Delete</span></button></div>`;
    b.querySelectorAll('[data-k]').forEach(inp => inp.onchange = () => { snapH(); $('ydUndo').disabled = false; const k = inp.dataset.k; it[k] = inp.type === 'number' ? (+inp.value || 0) : inp.value; if (k === 'light' && !inp.value) delete it.light; changed(); });
    $('ydDup').onclick = () => { snapH(); const c = JSON.parse(JSON.stringify(it)); c.id = nid(); c.x += Math.max(2, it.w * .6); Y.items.push(c); SEL = c.id; setSel(c.id); changed(); };
    $('ydDel').onclick = () => { snapH(); Y.items = Y.items.filter(i => i.id !== it.id); SEL = null; setSel(null); changed(); };
  }
  let busy = false;
  setInterval(async () => {
    if (busy || GB.page !== 'house' || document.hidden || !PL || !Y || !Y.items.some(i => DECO.includes(i.kind))) return; busy = true;
    try { const r = await GB.get('/api/yard/live'); LIVE = r.c || {}; liveAll(); } catch (e) {} busy = false;
  }, 100);
  GB.on('page', id => { if (id === 'house' && PL) setTimeout(() => fitAll(), 60); });
  GB.on('mylights', e => { if (e && e.where === 'yard' && Y) { Y.mylights = e.assign; drawAll(); } });
})();
