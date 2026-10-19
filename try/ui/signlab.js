/* 🪧 Sign Blueprint (Oct 18, Graham: "a separate project that you would build, and then you can pull it into the main wall ...
   this is building art"). A workshop for light-up signs on the PRO ART page, apart from the wall:
     · projects: each sign is its own saved file (art/<id>.glowbop on the engine), the logo sign is the first one
     · blueprint: the board, every hole and its sizes, the numbered wiring route with the dark bridge bulbs, bulbs per dot
     · editor: drag / add / delete holes, board size, spacing, hole size, colors, bulbs per dot, draw or auto-wire the route, undo
     · CAD: upload a DXF (circles / points) or SVG drawing and it becomes a sign
     · parts & cut list, print it, or save a real-size SVG drill template
     · "Pull into my wall": only then does a string light it (the Map panel's Put it back undoes that) */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const SW = ['#ff3d9a', '#9b3dff', '#33d6ff', '#ffffff', '#ffc23d', '#a8f23a', '#ff6a3d', '#3ce08a'];
  const WIRE = ['#ff3d9a', '#33d6ff', '#a8f23a', '#ffc23d', '#c79bff', '#ff6a3d'];
  GB.css(`
  .bp-top { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:4px 0 10px; }
  .bp-top select { flex:1 1 220px; min-height:44px; border-radius:12px; border:2px solid #ff9a3d; background:#120a22; color:#fff; font:700 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1px; padding:0 10px; }
  .bp-more { position:relative; } .bp-more summary { list-style:none; cursor:pointer; } .bp-more summary::-webkit-details-marker { display:none; }
  .bp-more[open] > div { position:absolute; right:0; top:calc(100% + 6px); z-index:30; display:flex; flex-direction:column; gap:6px; background:#120d1f; border:1px solid #3a3350; border-radius:12px; padding:8px; min-width:230px; box-shadow:0 10px 30px #0009; }
  .bp-steps { display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; margin:0 0 10px; }
  .bp-steps button { min-height:46px; border:0; border-radius:12px; background:#1d1530; color:#cfc6e6; font:800 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; cursor:pointer; padding:0 4px; }
  .bp-steps button.on { background:#ff9a3d; color:#130a00; box-shadow:0 0 16px #ff9a3d77; }
  .bp-step { display:none; } #sbPanel[data-step=pic] .bp-step[data-for=pic], #sbPanel[data-step=holes] .bp-step[data-for=holes], #sbPanel[data-step=wire] .bp-step[data-for=wire],
  #sbPanel[data-step=light] .bp-step[data-for=light], #sbPanel[data-step=done] .bp-step[data-for=done] { display:block; }
  .bp-say { margin:0 0 10px; color:#efeaf9; font-size:calc(15px * var(--fs, 1)); line-height:1.45; }
  .bp-tiles { display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px; margin-bottom:10px; }
  .bp-tile { text-align:left; display:flex; flex-direction:column; gap:3px; padding:10px 12px; min-height:68px; border-radius:14px; border:2px solid color-mix(in srgb, var(--c) 45%, transparent); background:color-mix(in srgb, var(--c) 10%, #0b0814); color:#fff; cursor:pointer; }
  .bp-tile b { font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.5px; } .bp-tile small { color:#cfc6e6; font-size:calc(12.5px * var(--fs, 1)); line-height:1.3; }
  .bp-tile.on { background:var(--c); border-color:var(--c); color:#000; box-shadow:0 0 18px color-mix(in srgb, var(--c) 60%, transparent); } .bp-tile.on small { color:#1a1022; }
  .bp-tile[hidden] { display:none; }
  .bp-next { margin:4px 0 8px; }
  .bp-hint { margin:10px 0 6px; padding:10px 14px; border-radius:12px; background:#1d1530; border-left:5px solid #ff9a3d; color:#fff; font:600 calc(15px * var(--fs, 1)) var(--body, sans-serif); }
  .bp-zoom { display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; margin:6px 0; } .bp-zoom .btn { min-height:38px; } #sbZoomV { opacity:1; min-width:64px; }
  .sb-bar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:4px 0 8px; }
  .sb-bar .chip.on { background:#ff3d9a; border-color:#ff3d9a; color:#000; }
  .sb-tools { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
  .sb-tools .btn.on { background:var(--c, #ff3d9a); color:#000; box-shadow:0 0 14px color-mix(in srgb, var(--c, #ff3d9a) 60%, transparent); }
  .sb-stage { position:relative; background:#0b0814; border-radius:0 16px 0 16px; border:1px solid #2d2740; overflow:hidden; touch-action:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
  .sb-stage svg, .sb-stage svg * { touch-action:none; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
  .sb-stage svg { width:100%; height:auto; display:block; user-select:none; -webkit-user-select:none; }
  .sb-grid2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:10px; margin-top:10px; }
  .sb-card { background:#120d1f; border:1px solid #2d2740; border-radius:0 12px 0 12px; padding:10px 12px; }
  .sb-card h4 { margin:0 0 6px; font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:#ff8cc4; }
  .sb-f { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; margin:4px 0; color:var(--lav); font:600 calc(12.5px * var(--fs, 1)) var(--cond); letter-spacing:1px; }
  .sb-f input[type=number], .sb-f input[type=text] { width:72px; min-height:32px; border-radius:9px; border:2px solid #3a3350; background:#07050f; color:#fff; font:700 calc(14px * var(--fs, 1)) var(--mono); padding:0 7px; }
  .sb-f input[type=text] { width:min(220px, 100%); font-family:var(--body, sans-serif); }
  .sb-f input[type=color] { width:38px; height:32px; border:0; background:none; padding:0; }
  .sb-sw { display:flex; gap:5px; flex-wrap:wrap; }
  .sb-sw button { width:26px; height:26px; border-radius:50%; border:2px solid #ffffff33; background:var(--d); padding:0; cursor:pointer; }
  .sb-st { display:grid; gap:6px; }
  .sb-st > div { border-left:4px solid var(--w); padding:4px 8px; border-radius:0 8px 8px 0; background:#0b0814; }
  .sb-st > div.on { background:color-mix(in srgb, var(--w) 14%, #0b0814); }
  .sb-st .use { font:700 calc(12px * var(--fs, 1)) var(--mono); } .sb-st .use.bad { color:#ff5a7a; } .sb-st .use.ok { color:#3ce08a; }
  .sb-parts ul { margin:0; padding-left:18px; } .sb-parts li { margin:2px 0; color:#efeaf9; font-size:calc(13.5px * var(--fs, 1)); }
  .sb-parts .m { font-family:var(--mono); color:#ffc23d; }
  .sb-msg { color:#ffcc66; min-height:1.2em; font-size:calc(13.5px * var(--fs, 1)); margin:4px 0; }
  .sb-hint { color:var(--lav); font-size:calc(12.5px * var(--fs, 1)); margin:4px 0; }
  `);

  // ---------------------------------------------------------------- state
  let VIEW = {z: 1, cx: null, cy: null}, PTR = new Map(), pinch = null, WS = null, AUTO = true, LITHOLE = null, STR = [], LIST = [], ID = '', P = null, TOOL = 'move', AS = 0, SEL = null, SNAP = true, SHOW = {dims: true, wire: true}, saveT = 0, UNDO = [], DEL2 = 0, STEP = 'holes';
  const msg = t => { const m = $('sbMsg'); if (m) m.textContent = t || ''; };
  const num = (v, d) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const r2 = v => Math.round(v * 100) / 100;
  const spotById = id => P.spots.find(s => s.spot === id);
  const rid = e => (typeof e === 'object' ? e.spot : e);
  const nextId = () => P.spots.reduce((a, s) => Math.max(a, s.spot), 0) + 1;
  function norm(j) {                                              // fill in anything an older / imported sign file leaves out
    j.type = 'sign'; j.glowbop = 1; j.units = j.units || 'in'; j.spacing = num(j.spacing, 4); j.size = j.size || [30, 30];
    j.hole = num(j.hole, Math.round(j.spacing * 0.5625 * 100) / 100); j.corner = num(j.corner, j.spacing * 0.75);
    j.spots = (j.spots || []).map((s, i) => ({spot: s.spot != null ? +s.spot : i + 1, x: +s.x || 0, y: +s.y || 0, color: s.color || '#ff3d9a', label: s.label || ''}));
    j.cord = j.cord || {x: j.size[0] / 2, y: j.size[1]};
    j.strands = (j.strands && j.strands.length ? j.strands : [{name: 'Strand 1', bulbs: 300, lead: 0, lit: 7, bridge: 1, route: []}])
      .map((s, i) => ({name: s.name || 'Strand ' + (i + 1), bulbs: +s.bulbs || 300, lead: +s.lead || 0, lit: s.lit != null ? +s.lit : 3, bridge: s.bridge != null ? +s.bridge : 1, route: (s.route || []).filter(e => j.spots.some(p => p.spot === rid(e)))}));
    return j;
  }
  const snapshot = () => { UNDO.push(JSON.stringify(P)); if (UNDO.length > 40) UNDO.shift(); };
  function changed(keepSel) { if (!keepSel && SEL != null && !spotById(SEL)) SEL = null; draw(); paintSide(); clearTimeout(saveT); saveT = setTimeout(save, 700); const s = $('sbSaved'); if (s) s.textContent = '● saving…'; }
  async function save() {
    if (!P) return; const r = await GB.post('/api/art/project', {id: ID, project: P});
    const s = $('sbSaved'); if (r && r.ok) { const isNew = r.id !== ID; ID = r.id; if (s) s.textContent = '✓ saved'; if (isNew) loadList(); }
  }

  // ---------------------------------------------------------------- projects
  async function loadList() { try { LIST = (await GB.get('/api/art/projects')).projects || []; } catch (e) { LIST = []; } paintBar(); }
  async function open(id) {
    try { const r = await GB.get('/api/art/project?id=' + encodeURIComponent(id)); if (r.error) return msg('😕 ' + r.error); ID = r.id; P = norm(r.project); } catch (e) { return msg('😕 Could not open that project'); }
    UNDO = []; SEL = null; AS = 0; LITHOLE = null; VIEW = {z: 1, cx: null, cy: null}; paintBar(); setStep(P.spots.length ? 'holes' : 'pic'); loadStrings(); refit(); msg(`🪧 ${P.name || 'Sign'}: ${P.spots.length} holes. Nothing here touches your wall until you pull it in.`);
  }
  async function create(j, note) { P = norm(j); ID = ''; UNDO = []; SEL = null; AS = 0; await save(); await loadList(); draw(); paintSide(); refit(); msg(note || '✨ New sign project'); }
  const blank = () => ({name: 'New sign', size: [30, 30], spacing: 4, hole: 2.25, corner: 3, cord: {x: 15, y: 30}, spots: [], strands: [{name: 'Strand 1', bulbs: 300, lead: 0, lit: 7, bridge: 1, route: []}]});

  // ---------------------------------------------------------------- wiring maths
  function used(st) { return (st.lead || 0) + st.route.reduce((a, e) => a + (typeof e === 'object' && e.lit != null ? +e.lit : st.lit) + (typeof e === 'object' && e.bridge != null ? +e.bridge : st.bridge), 0); }
  function order() { const o = {}; let k = 0; P.strands.forEach(st => st.route.forEach(e => { o[rid(e)] = ++k; })); return o; }
  function autoWire() {                                           // 🐍 snake row by row from the row nearest the plug, filling each strand to its bulb count
    if (!P.spots.length) return msg('Add some holes first');
    snapshot();
    const tol = P.spacing * 0.45, rows = [];
    [...P.spots].sort((a, b) => a.y - b.y).forEach(s => { const r = rows.find(q => Math.abs(q.y - s.y) <= tol); if (r) r.s.push(s); else rows.push({y: s.y, s: [s]}); });
    const cy = P.cord.y, cx = P.cord.x; rows.sort((a, b) => Math.abs(a.y - cy) - Math.abs(b.y - cy));
    let ltr = true; { const r0 = rows[0].s; const minx = Math.min(...r0.map(s => s.x)), maxx = Math.max(...r0.map(s => s.x)); ltr = Math.abs(cx - minx) <= Math.abs(cx - maxx); }
    const seq = []; rows.forEach(r => { r.s.sort((a, b) => ltr ? a.x - b.x : b.x - a.x); seq.push(...r.s); ltr = !ltr; });
    P.strands.forEach(st => st.route = []); let si = 0;
    seq.forEach(s => { let st = P.strands[si];
      if (used(st) + st.lit + st.bridge > st.bulbs && st.route.length) { si++; if (!P.strands[si]) P.strands.push({name: 'Strand ' + (si + 1), bulbs: st.bulbs, lead: 0, lit: st.lit, bridge: st.bridge, route: []}); st = P.strands[si]; }
      st.route.push(s.spot); });
    AS = 0; changed(); msg(`🐍 Wired ${seq.length} holes in a snake from the plug, across ${si + 1} strand${si ? 's' : ''}`);
  }

  // ---------------------------------------------------------------- drawing (units = inches, y down)
  function draw() {
    const box = $('sbStage'); if (!box || !P) return;
    const [W, H] = P.size, m = Math.max(W, H) * 0.14, hr = P.hole / 2, o = order(), s = Math.max(W, H) / 300;   // s = one "drawing point" in inches
    const bw = W + 2 * m, bh = H + 2 * m; if (VIEW.cx == null) { VIEW.cx = W / 2; VIEW.cy = H / 2; }
    const vw = bw / VIEW.z, vh = bh / VIEW.z, vx = VIEW.cx - vw / 2, vy = VIEW.cy - vh / 2, upx = vw / Math.max(200, box.clientWidth || 600);   // 🔍 pinch / zoom view; upx = inches per screen pixel
    let g = `<svg id="sbSvg" viewBox="${vx} ${vy} ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg">
      <defs><marker id="sbAr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,1 L9,5 L0,9 z" fill="#a49cbd"/></marker></defs>
      <rect x="0" y="0" width="${W}" height="${H}" rx="${Math.min(P.corner, W / 2, H / 2)}" fill="#16121f" stroke="#3a3350" stroke-width="${s * 1.5}"/>`;
    if (P.bg && P.bg.src) { const b = P.bg; if (b.w == null) { b.x = 0; b.y = 0; b.w = W; b.h = H; }
      g += `<image href="${b.src}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="xMidYMid meet" opacity="${b.op || 0.45}" pointer-events="none"/>`;
      if (TOOL === 'logo') g += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="none" stroke="#ffc23d" stroke-width="${s * 1.5}" stroke-dasharray="${s * 5} ${s * 4}" pointer-events="none"/>`; }   // 🖼️ the logo you trace over
    if (SHOW.dims) {                                              // guide lines through every hole row / column
      const xs = [...new Set(P.spots.map(p => r2(p.x)))], ys = [...new Set(P.spots.map(p => r2(p.y)))];
      xs.forEach(x => g += `<line x1="${x}" y1="${-s * 4}" x2="${x}" y2="${H + s * 4}" stroke="#ff5aa8" stroke-width="${s * .5}" stroke-dasharray="${s * 2} ${s * 3}" opacity=".45"/>`);
      ys.forEach(y => g += `<line x1="${-s * 4}" y1="${y}" x2="${W + s * 4}" y2="${y}" stroke="#ff5aa8" stroke-width="${s * .5}" stroke-dasharray="${s * 2} ${s * 3}" opacity=".45"/>`);
    }
    if (SHOW.wire) P.strands.forEach((st, si) => {                // the wire: plug -> each hole in order, bridge bulbs as rings between holes
      const c = WIRE[si % WIRE.length], pts = st.route.map(e => spotById(rid(e))).filter(Boolean); if (!pts.length) return;
      const path = [[P.cord.x, P.cord.y], ...pts.map(p => [p.x, p.y])];
      g += `<polyline points="${path.map(q => q.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${s * (si === AS ? 2.6 : 1.8)}" stroke-linejoin="round" opacity="${si === AS ? .95 : .6}"/>`;
      st.route.forEach((e, k) => { const a = spotById(rid(e)), b = pts[k + 1]; if (!a || !b) return; const br = typeof e === 'object' && e.bridge != null ? +e.bridge : st.bridge;
        for (let i = 1; i <= br; i++) { const t = i / (br + 1); g += `<circle cx="${a.x + (b.x - a.x) * t}" cy="${a.y + (b.y - a.y) * t}" r="${s * 2.6}" fill="#16121f" stroke="${c}" stroke-width="${s * 1.2}"/>`; } });
    });
    if (LITHOLE != null) { const q = spotById(LITHOLE); if (q) g += `<circle cx="${q.x}" cy="${q.y}" r="${hr * 1.7}" fill="none" stroke="#fff" stroke-width="${s * 2}" stroke-dasharray="${s * 4} ${s * 3}"><animate attributeName="r" values="${hr * 1.4};${hr * 2};${hr * 1.4}" dur="1.2s" repeatCount="indefinite"/></circle>`; }
    P.spots.forEach(p => { const on = p.spot === SEL, n = o[p.spot];
      g += `<g data-s="${p.spot}" style="cursor:${TOOL === 'del' ? 'not-allowed' : 'pointer'}"><circle cx="${p.x}" cy="${p.y}" r="${Math.max(hr, upx * 22)}" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="${hr}" fill="${esc(p.color)}" stroke="${on ? '#fff' : '#ffffff55'}" stroke-width="${s * (on ? 3 : 1)}" style="filter:drop-shadow(0 0 ${s * 4}px ${esc(p.color)})"/>
        <text x="${p.x}" y="${p.y + s * 3.4}" text-anchor="middle" font-size="${s * 10}" font-family="monospace" font-weight="700" fill="${/^#(f|e|d)/i.test(p.color) ? '#16121f' : '#fff'}" pointer-events="none">${n || '·'}</text></g>`; });
    g += `<rect data-cord="1" x="${P.cord.x - s * 10}" y="${P.cord.y - s * 5}" width="${s * 20}" height="${s * 10}" fill="#0b0814" stroke="#ff5aa8" stroke-width="${s}" style="cursor:move"/>
      <text x="${P.cord.x}" y="${P.cord.y + s * 16}" text-anchor="middle" font-size="${s * 8}" fill="#a49cbd" font-family="monospace" pointer-events="none">PLUG</text>`;
    if (SHOW.dims) {
      const u = P.units === 'in' ? '"' : ' ' + P.units, f = v => r2(v) + u;
      g += `<line x1="0" y1="${-m * .45}" x2="${W}" y2="${-m * .45}" stroke="#a49cbd" stroke-width="${s}" marker-start="url(#sbAr)" marker-end="url(#sbAr)"/>
        <text x="${W / 2}" y="${-m * .6}" text-anchor="middle" font-size="${s * 11}" fill="#efeaf9" font-family="monospace">${f(W)}</text>
        <line x1="${-m * .45}" y1="0" x2="${-m * .45}" y2="${H}" stroke="#a49cbd" stroke-width="${s}" marker-start="url(#sbAr)" marker-end="url(#sbAr)"/>
        <text x="${-m * .6}" y="${H / 2}" text-anchor="middle" font-size="${s * 11}" fill="#efeaf9" font-family="monospace" transform="rotate(-90 ${-m * .6} ${H / 2})">${f(H)}</text>`;
      const xs = [...new Set(P.spots.map(p => r2(p.x)))].sort((a, b) => a - b);
      if (xs.length > 1) { const a = xs[0], b = xs[1];
        g += `<line x1="0" y1="${H + m * .4}" x2="${a}" y2="${H + m * .4}" stroke="#a49cbd" stroke-width="${s}" marker-start="url(#sbAr)" marker-end="url(#sbAr)"/><text x="${a / 2}" y="${H + m * .62}" text-anchor="middle" font-size="${s * 9}" fill="#efeaf9" font-family="monospace">${f(a)}</text>
          <line x1="${a}" y1="${H + m * .4}" x2="${b}" y2="${H + m * .4}" stroke="#a49cbd" stroke-width="${s}" marker-start="url(#sbAr)" marker-end="url(#sbAr)"/><text x="${(a + b) / 2}" y="${H + m * .62}" text-anchor="middle" font-size="${s * 9}" fill="#efeaf9" font-family="monospace">${f(b - a)}</text>`; }
      if (P.spots.length) g += `<text x="${W}" y="${-m * .12}" text-anchor="end" font-size="${s * 9}" fill="#ffc23d" font-family="monospace">holes ⌀ ${f(P.hole)}</text>`;
    }
    box.innerHTML = g + '</svg>';
  }

  // ---------------------------------------------------------------- pointer: move / add / delete / wire
  let drag = null;
  const toSvg = e => { const sv = $('sbSvg'); const pt = sv.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(sv.getScreenCTM().inverse()); return [q.x, q.y]; };
  // 🧲 Oct 18 (Graham: "when you move the dot you can't get it back to its original spot"): the logo's holes sit at 3, 7, 11 ... but
  //   snap used 0, 2, 4 ... so a hole could never land home again. Snap now pulls to the other holes' rows and columns first, then to
  //   the board's own hole grid (whatever offset it has), at half the spacing.
  const snapAxis = (v, k, skip) => {
    if (!SNAP || !P) return r2(v);
    const others = P.spots.filter(q => q.spot !== skip).map(q => q[k]);
    let best = null; others.forEach(c => { if (Math.abs(c - v) <= P.spacing * 0.15 && (best == null || Math.abs(c - v) < Math.abs(best - v))) best = c; });
    if (best != null) return best;
    const st = P.spacing / 2, cnt = {}; others.forEach(c => { const o = r2(((c % st) + st) % st); cnt[o] = (cnt[o] || 0) + 1; });
    const org = +(Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || 0);
    return r2(org + Math.round((v - org) / st) * st);
  };
  const snapV = v => { if (!SNAP) return r2(v); const st = P.spacing / 2; return r2(Math.round(v / st) * st); };
  // 📐 Oct 18 (Graham: "on the iPad it's not populated"): the page laid itself out before the blueprint had drawn, so the box came out
  //   short. Once a project is drawn, an untouched (auto) layout refits around the full-size blueprint.
  let refT = 0; const refit = () => { clearTimeout(refT); refT = setTimeout(() => GB.proDJ && GB.proDJ.recompact && GB.proDJ.recompact(), 250); };
  // 🔍 Oct 18 (Graham: "I need to pinch and zoom"): two fingers zoom and pan the blueprint (or resize the logo with 🖼️ Move logo),
  //   one finger on empty board pans when zoomed in, the mouse wheel / trackpad pinch zooms, and every hole has a finger-sized grab area.
  const two = () => { const [a, b] = [...PTR.values()]; return {d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2}; };
  const upxNow = () => { const sv = $('sbSvg'); return sv ? sv.viewBox.baseVal.width / Math.max(1, sv.getBoundingClientRect().width) : 0.05; };
  function zoomAt(f, clientX, clientY) {
    const sv = $('sbSvg'); if (!sv || !P) return; const r = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal;
    const px = vb.x + (clientX - r.left) / r.width * vb.width, py = vb.y + (clientY - r.top) / r.height * vb.height;
    const z = Math.max(1, Math.min(8, VIEW.z * f)), k = VIEW.z / z;
    VIEW.cx = px + (VIEW.cx - px) * k; VIEW.cy = py + (VIEW.cy - py) * k; VIEW.z = z; if (z === 1) { VIEW.cx = P.size[0] / 2; VIEW.cy = P.size[1] / 2; } draw(); paintZoom();
  }
  const paintZoom = () => { const z = $('sbZoomV'); if (z) z.textContent = Math.round(VIEW.z * 100) + '%'; };
  function down(e) {
    if (!P || !$('sbSvg')) return;
    PTR.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (PTR.size === 2) {                                         // second finger: pinch (cancel a one-finger move that hadn't moved yet)
      if (drag && (drag.stroke || drag.moved || drag.cord)) changed(true); else if (drag && !drag.pan) UNDO.pop();
      drag = null; const t2 = two(); pinch = {d0: t2.d, mx: t2.mx, my: t2.my, z0: VIEW.z, logo: TOOL === 'logo' && P.bg && P.bg.src ? Object.assign({}, P.bg) : null};
      if (pinch.logo) snapshot(); e.preventDefault(); return; }
    if (PTR.size > 2) return;
    try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}   /* iPad: keep the drag after the finger leaves the dot */ const t = e.target.closest('[data-s],[data-cord]'), [x, y] = toSvg(e);
    if (t && t.dataset.cord) { snapshot(); drag = {cord: true}; e.preventDefault(); return; }
    const id = t ? +t.dataset.s : null;
    if (TOOL === 'draw') {                                        // ✏️ start a stroke: holes drop along it, wired in drawing order
      if (x < 0 || y < 0 || x > P.size[0] || y > P.size[1]) return; snapshot(); const n = nextId(), col = (spotById(SEL) || {}).color || '#ff3d9a';
      P.spots.push({spot: n, x: r2(x), y: r2(y), color: col, label: ''}); P.strands[AS].route.push(n); SEL = n; drag = {stroke: true, last: [x, y], col}; e.preventDefault(); draw(); return; }
    if (TOOL === 'add' && id == null) { if (x < 0 || y < 0 || x > P.size[0] || y > P.size[1]) return; snapshot(); const n = nextId(); P.spots.push({spot: n, x: snapAxis(x, 'x', -1), y: snapAxis(y, 'y', -1), color: (spotById(SEL) || {}).color || '#ff3d9a', label: ''}); SEL = n; changed(); return; }
    if (TOOL === 'logo') { if (!P.bg || !P.bg.src) return msg('Load a logo first: 🖼️ Trace a logo'); snapshot(); drag = {logo: true, sx: e.clientX, sy: e.clientY, b0: Object.assign({}, P.bg)}; e.preventDefault(); return; }
    if (id == null) { if (VIEW.z > 1) { drag = {pan: true, sx: e.clientX, sy: e.clientY, cx: VIEW.cx, cy: VIEW.cy}; e.preventDefault(); } SEL = null; draw(); paintSide(); return; }
    if (TOOL === 'del') { snapshot(); P.spots = P.spots.filter(s => s.spot !== id); P.strands.forEach(st => st.route = st.route.filter(r => rid(r) !== id)); changed(); return; }
    if (TOOL === 'wire') { const st = P.strands[AS]; snapshot();
      const inOther = P.strands.some((q, i) => i !== AS && q.route.some(r => rid(r) === id));
      if (inOther) P.strands.forEach(q => q.route = q.route.filter(r => rid(r) !== id));
      const k = st.route.findIndex(r => rid(r) === id);
      if (k === st.route.length - 1) st.route.pop(); else if (k < 0) st.route.push(id); else st.route.splice(k, 1);
      SEL = id; changed(); if (WS && AUTO) lightHole(id); return; }
    SEL = id; snapshot(); const s = spotById(id); drag = {id, dx: x - s.x, dy: y - s.y, moved: false}; e.preventDefault(); if (WS && AUTO) lightHole(id); draw(); paintSide();
  }
  function move(e) {
    if (PTR.has(e.pointerId)) PTR.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && PTR.size >= 2 && P) { const t2 = two(), f = t2.d / Math.max(1, pinch.d0), u = upxNow();
      if (pinch.logo) { const b = pinch.logo, nw = Math.max(1, b.w * f), nh = Math.max(1, b.h * f), sv = $('sbSvg'), r = sv.getBoundingClientRect(), vb = sv.viewBox.baseVal;
        const ax = vb.x + (pinch.mx - r.left) / r.width * vb.width, ay = vb.y + (pinch.my - r.top) / r.height * vb.height;
        P.bg.w = r2(nw); P.bg.h = r2(nh); P.bg.x = r2(ax - (ax - b.x) * f + (t2.mx - pinch.mx) * u); P.bg.y = r2(ay - (ay - b.y) * f + (t2.my - pinch.my) * u); draw(); return; }
      const z = Math.max(1, Math.min(8, pinch.z0 * f)); VIEW.cx -= (t2.mx - pinch.mx) * u; VIEW.cy -= (t2.my - pinch.my) * u; pinch.mx = t2.mx; pinch.my = t2.my;
      const sv = $('sbSvg'); if (sv) zoomAt(z / VIEW.z, t2.mx, t2.my); return; }
    if (!drag || !P) return;
    if (drag.pan) { const u = upxNow(); VIEW.cx = drag.cx - (e.clientX - drag.sx) * u; VIEW.cy = drag.cy - (e.clientY - drag.sy) * u; draw(); return; }
    if (drag.logo) { const u = upxNow(); P.bg.x = r2(drag.b0.x + (e.clientX - drag.sx) * u); P.bg.y = r2(drag.b0.y + (e.clientY - drag.sy) * u); draw(); return; }
    const [x, y] = toSvg(e);
    if (drag.stroke) { const [lx, ly] = drag.last, d = Math.hypot(x - lx, y - ly);
      if (d >= P.spacing) { const k = P.spacing / d, nx = lx + (x - lx) * k, ny = ly + (y - ly) * k, n = nextId();
        P.spots.push({spot: n, x: r2(nx), y: r2(ny), color: drag.col, label: ''}); P.strands[AS].route.push(n); SEL = n; drag.last = [nx, ny]; draw(); }
      return; }
    if (drag.cord) { P.cord = {x: snapV(Math.max(0, Math.min(P.size[0], x))), y: snapV(Math.max(0, Math.min(P.size[1], y)))}; draw(); return; }
    const s = spotById(drag.id); if (!s) return; if (!s.home) s.home = [s.x, s.y];   // ↺ remember where it started
    s.x = snapAxis(x - drag.dx, 'x', s.spot); s.y = snapAxis(y - drag.dy, 'y', s.spot); drag.moved = true; draw();
  }
  function up(e) {
    if (e && PTR.has(e.pointerId)) PTR.delete(e.pointerId);
    if (pinch) { if (PTR.size < 2) { const was = pinch; pinch = null; if (was.logo) changed(true); } return; }
    if (!drag) return; const d = drag; drag = null; if (d.pan) return; if (d.logo || d.stroke || d.cord || d.moved) changed(true); else UNDO.pop(); }

  // ---------------------------------------------------------------- 🛠️ workshop + 💡 bulb finder (Oct 18, Graham: "get the Nanoleaf off the main wall while
  //   we build ... push the button and it lights up those specific lights so you know which ones go where")
  const wsDev = () => STR.find(d => d.id === WS);
  function bulbMap(N) {                                           // hole -> [first bulb, last bulb + 1] on an N-bulb string (same refit as Pull into my wall)
    const F = GB.artRefit ? GB.artRefit(JSON.parse(JSON.stringify(P)), N) : P, map = {}; let idx = 0;
    (F.strands || []).forEach(st => { const start = idx, cap = +st.bulbs || Infinity; idx += +st.lead || 0;
      (st.route || []).forEach(e => { const sp = rid(e), lit = typeof e === 'object' && e.lit != null ? +e.lit : +st.lit, br = typeof e === 'object' && e.bridge != null ? +e.bridge : +st.bridge;
        map[sp] = [idx, idx + lit]; idx += lit + br; });
      if (isFinite(cap)) idx = start + cap; });
    return map;
  }
  const rgbOf = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const v = m ? parseInt(m[1], 16) : 0xffffff; return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
  async function sendLights(list, note) { const d = wsDev(); if (!d) return; const r = await GB.post('/api/art/light', {id: d.id, bulbs: list, base: [0, 0, 0]}); if (r && note) msg(note); }
  async function lightHole(id) {
    const d = wsDev(); if (!d || !P) return; const m = bulbMap(d.n)[id], o = order();
    if (!m) { LITHOLE = null; draw(); return msg('🔌 That hole isn\'t wired yet, so it has no bulbs. Wire it first.'); }
    const c = rgbOf((spotById(id) || {}).color), list = []; for (let i = m[0]; i < Math.min(m[1], d.n); i++) list.push([i, ...c]);
    LITHOLE = id; draw(); paintBuild();
    await sendLights(list, `💡 Hole #${o[id]}: bulbs ${m[0] + 1} to ${Math.min(m[1], d.n)} (${Math.min(m[1], d.n) - m[0]} bulbs) are lit on ${d.name}`);
  }
  async function lightAll() {
    const d = wsDev(); if (!d) return; const m = bulbMap(d.n), list = [];
    P.spots.forEach(s => { const r = m[s.spot]; if (!r) return; const c = rgbOf(s.color); for (let i = r[0]; i < Math.min(r[1], d.n); i++) list.push([i, ...c]); });
    LITHOLE = null; draw(); await sendLights(list, `🌈 The whole sign is lit in its colors; wire runs stay dark`);
  }
  async function lightBulb(n) { const d = wsDev(); if (!d) return; n = Math.max(1, Math.min(d.n, Math.round(n))); LITHOLE = null; draw(); await sendLights([[n - 1, 255, 255, 255]], `🔢 Bulb ${n} of ${d.n} is lit white`); }
  function step(dir) { const o = order(), seq = Object.keys(o).map(Number).sort((a, b) => o[a] - o[b]); if (!seq.length) return msg('Wire the holes first');
    const cur = LITHOLE != null ? seq.indexOf(LITHOLE) : -1, nx = seq[(cur + dir + seq.length) % seq.length]; SEL = nx; lightHole(nx); paintSide(); }
  async function loadStrings() { try { STR = ((await GB.get('/api/lights/stage')).devices || []).filter(d => d.kind === 'string'); } catch (e) { STR = []; }
    const w = STR.find(d => d.workshop && d.workshop === ID) || STR.find(d => d.workshop); WS = w ? w.id : null; paintBuild(); }
  async function workshop(id, on) {
    const r = await GB.post('/api/art/workshop', {id, on, project: ID}); if (!r) return;
    if (on) { GB.toast('🛠️ In the workshop: off your main wall, lit only by the blueprint'); } else { LITHOLE = null; GB.toast('↩️ Back on your main wall'); }
    await loadStrings(); draw(); if (on) lightAll();
  }
  function paintBuild() {
    const el = $('sbBuild'); if (!el) return; if (!P) { el.innerHTML = ''; return; }
    const d = wsDev();
    if (!d) { el.innerHTML = `<h4>🛠️ Build it with the real lights</h4><p class="sb-hint">Put a string in the workshop while you build: it leaves your main wall, and tapping a hole here lights exactly the bulbs that go in it.</p>
      <div class="sb-f">${STR.length ? STR.map(s => `<button class="chip" data-ws="${esc(s.id)}">🧵 ${esc(s.name)} · ${s.n}</button>`).join('') : 'No string lights yet: add one on the LIGHTS page.'}</div>`;
      el.querySelectorAll('[data-ws]').forEach(b => b.onclick = () => workshop(b.dataset.ws, true)); return; }
    const m = LITHOLE != null ? bulbMap(d.n)[LITHOLE] : null, o = order();
    el.innerHTML = `<h4>🛠️ Workshop: ${esc(d.name)} (${d.n} bulbs, off your main wall)</h4>
      <div class="sb-f"><button class="btn${AUTO ? ' on' : ''}" id="sbAuto2" style="--c:#ffc23d">💡 Light the hole I tap</button><button class="btn" id="sbPrev">◀ Prev hole</button><button class="btn" id="sbNext">Next hole ▶</button>
        <button class="btn" id="sbAll">🌈 Whole sign</button><button class="btn" id="sbOff">⚫ All off</button></div>
      <div class="sb-f">Bulb # <input type="number" min="1" max="${d.n}" id="sbBulbN" placeholder="1"><button class="btn" id="sbBulbGo">Light it</button>
        <button class="btn" id="sbWsOff" style="--c:#3ce08a">↩️ Back to the main wall</button></div>
      <p class="sb-hint">${m ? `Hole #${o[LITHOLE]}: bulbs <b>${m[0] + 1}</b> to <b>${Math.min(m[1], d.n)}</b>. Push those through this hole.` : 'Tap any hole (✋ Move tool) to light its bulbs, or step through with Next hole.'}</p>`;
    $('sbAuto2').onclick = () => { AUTO = !AUTO; paintBuild(); };
    $('sbPrev').onclick = () => step(-1); $('sbNext').onclick = () => step(1); $('sbAll').onclick = lightAll;
    $('sbOff').onclick = () => { LITHOLE = null; draw(); sendLights([], '⚫ All bulbs off'); paintBuild(); };
    $('sbBulbGo').onclick = () => lightBulb(+$('sbBulbN').value || 1);
    $('sbWsOff').onclick = () => workshop(d.id, false);
  }

  // ---------------------------------------------------------------- side panels
  function paintBar() {
    const sel = $('bpPick'); if (!sel) return;
    sel.innerHTML = LIST.map(p => `<option value="${esc(p.id)}"${p.id === ID ? ' selected' : ''}>🪧 ${esc(p.name)} (${p.spots} holes)</option>`).join('') || '<option>No signs yet</option>';
    sel.onchange = () => open(sel.value);
    $('sbNew').onclick = () => { create(blank(), '✨ New blank 30" × 30" board. Step 1: load a picture to trace, or go to Step 2 and add holes.'); setStep('pic'); };
    $('sbDup').onclick = () => { if (!P) return; const j = JSON.parse(JSON.stringify(P)); j.name = (P.name || 'Sign') + ' copy'; create(j, '⧉ Copied: edit away, the original stays as it was'); };
    $('sbDel').textContent = DEL2 ? '🗑 Tap again to delete' : '🗑 Delete this sign';
    $('sbDel').onclick = async () => { if (!ID) return; if (!DEL2) { DEL2 = 1; paintBar(); setTimeout(() => { DEL2 = 0; paintBar(); }, 3000); return; }
      DEL2 = 0; if (await GB.post('/api/art/delete', {id: ID})) { GB.toast('🗑 Project deleted'); ID = ''; P = null; await loadList(); if (LIST[0]) open(LIST[0].id); else { $('sbStage').innerHTML = ''; paintSide(); } } };
  }
  // 🧭 Oct 18 (Graham: "the buttons are stacked on each other, I don't know what does what"): the blueprint is now 5 steps,
  //   each showing only its own tools, every tool with a line saying what it does.

  const STEPS = [['pic', '① Picture'], ['holes', '② Holes'], ['wire', '③ Wiring'], ['light', '④ Light it up'], ['done', '⑤ Finish']];
  function setStep(k) {
    STEP = k; const el = $('sbPanel'); if (!el) return; el.dataset.step = k;
    el.querySelectorAll('.bp-steps button').forEach(b => b.classList.toggle('on', b.dataset.step === k));
    TOOL = {pic: P && P.bg && P.bg.src ? 'logo' : 'move', holes: P && P.bg && P.bg.src ? 'draw' : 'add', wire: 'wire', light: 'move', done: 'move'}[k] || 'move';
    if (k === 'light') loadStrings();
    const m = $('sbMsg'); if (m) m.textContent = '';
    draw(); paintSide(); refit();
  }
  function paintSide() {
    document.querySelectorAll('#sbPanel [data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === TOOL));
    const bgd = $('sbBgDel'); if (bgd) bgd.hidden = !(P && P.bg && P.bg.src);
    const sn = $('sbSnap'); if (sn) sn.classList.toggle('on', SNAP);

    const hint = $('sbHint'); if (hint) hint.textContent = {move: '✋ Drag holes or the PLUG. Tap a hole to edit it.', add: '➕ Tap the board to add a hole (it snaps to half the spacing).', del: '✖ Tap a hole to delete it.', wire: `🔌 Wiring ${P && P.strands[AS] ? P.strands[AS].name : ''}: tap holes in the order the string runs. Tap the last one again to undo it.`, logo: '🖐️ Drag the logo to move it. Pinch with two fingers (or use the size slider in Board) to resize it.', draw: `✏️ Draw your lights: drag along the picture and a hole drops every ${P ? P.spacing : 4}${P && P.units === 'in' ? '"' : ''}, wired in the order you draw (that's the string's path). Each new stroke carries on the same strand.`}[TOOL];
    if (hint && STEP === 'light') hint.textContent = WS ? '💡 Tap any hole on the board: its bulbs light up on your real string. Or use ◀ Prev / Next ▶ to walk the string.' : '🧵 First pick a string above. Then tap a hole on the board and its bulbs light up.';
    if (hint && STEP === 'done') hint.textContent = '✅ Your sign below. Print it, or pull it into your wall when it is built.';
    const bd = $('bpBoard'); if (!bd) return;
    if (!P) { bd.innerHTML = $('sbStrands').innerHTML = $('sbParts').innerHTML = $('sbSel').innerHTML = ''; return; }
    bd.innerHTML = `<h4>📐 Board</h4>
      <div class="sb-f">Name <input type="text" id="sbName" value="${esc(P.name || '')}"></div>
      <div class="sb-f">W <input type="number" step="0.25" id="sbW" value="${P.size[0]}"> H <input type="number" step="0.25" id="sbH" value="${P.size[1]}"> ${esc(P.units)}</div>
      <div class="sb-f">Spacing <input type="number" step="0.25" id="sbSp" value="${P.spacing}"> Hole ⌀ <input type="number" step="0.125" id="sbHo" value="${P.hole}"> Corners <input type="number" step="0.25" id="sbCo" value="${P.corner}"></div>
      ${P.bg && P.bg.src ? `<div class="sb-f">🖼️ Logo size <input type="range" id="sbBgSz" min="20" max="300" value="${Math.round((P.bg.w || P.size[0]) / P.size[0] * 100)}"> Fade <input type="range" id="sbBgOp" min="10" max="100" value="${Math.round((P.bg.op || 0.45) * 100)}"></div>` : ''}
      <div class="sb-f">↔ Scale everything to width <input type="number" step="0.5" id="sbSc" placeholder="${P.size[0]}"><button class="btn" id="sbScGo">Scale</button></div>`;
    const bind = (id, fn) => { const el = $(id); if (el) el.onchange = () => { snapshot(); fn(el.value); changed(); }; };
    bind('sbName', v => P.name = v.slice(0, 60)); bind('sbW', v => P.size[0] = Math.max(2, num(v, P.size[0]))); bind('sbH', v => P.size[1] = Math.max(2, num(v, P.size[1])));
    bind('sbSp', v => P.spacing = Math.max(0.25, num(v, P.spacing))); bind('sbHo', v => P.hole = Math.max(0.1, num(v, P.hole))); bind('sbCo', v => P.corner = Math.max(0, num(v, P.corner)));
    const bsz = $('sbBgSz'); if (bsz) { bsz.onpointerdown = () => snapshot(); bsz.oninput = () => { const b = P.bg, k = +bsz.value / 100, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      b.w = r2(P.size[0] * k); b.h = r2(P.size[1] * k); b.x = r2(cx - b.w / 2); b.y = r2(cy - b.h / 2); draw(); }; bsz.onchange = () => changed(true); }
    const bop = $('sbBgOp'); if (bop) { bop.oninput = () => { P.bg.op = +bop.value / 100; draw(); }; bop.onchange = () => changed(true); }
    $('sbScGo').onclick = () => { const w = num($('sbSc').value, 0); if (!(w > 0)) return; snapshot(); const k = w / P.size[0];
      P.size = [r2(P.size[0] * k), r2(P.size[1] * k)]; P.spacing = r2(P.spacing * k); P.hole = r2(P.hole * k); P.corner = r2(P.corner * k); P.cord = {x: r2(P.cord.x * k), y: r2(P.cord.y * k)};
      P.spots.forEach(s => { s.x = r2(s.x * k); s.y = r2(s.y * k); }); changed(); msg(`↔ Scaled to ${P.size[0]} × ${P.size[1]} ${P.units}`); };
    // selected hole
    const s = SEL != null ? spotById(SEL) : null, o = order(), sb = $('sbSel');
    if (s) { const st = P.strands.find(q => q.route.some(r => rid(r) === s.spot)), e = st ? st.route.find(r => rid(r) === s.spot) : null, lit = e && typeof e === 'object' && e.lit != null ? e.lit : (st ? st.lit : '');
      sb.innerHTML = `<h4>🔵 Hole ${o[s.spot] ? '#' + o[s.spot] : '(not wired)'}</h4>
        <div class="sb-f">X <input type="number" step="0.25" id="sbX" value="${s.x}"> Y <input type="number" step="0.25" id="sbY" value="${s.y}"></div>
        <div class="sb-f">Color <input type="color" id="sbCol" value="${/^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#ff3d9a'}"><span class="sb-sw">${SW.map(c => `<button data-c="${c}" style="--d:${c}" title="${c}"></button>`).join('')}</span></div>
        ${st ? `<div class="sb-f">Bulbs in this hole <input type="number" min="1" max="40" id="sbLit" value="${lit}"> <span>(${esc(st.name)} default ${st.lit})</span></div>` : '<p class="sb-hint">Wire it (🔌) to give it bulbs.</p>'}
        <div class="sb-f"><button class="btn" id="sbAllCol">🎨 Use this color on every hole</button>${s.home && (s.home[0] !== s.x || s.home[1] !== s.y) ? `<button class="btn c" id="sbHome" style="--c:#3ce08a">↺ Put it back</button>` : ''}</div>`;
      bind('sbX', v => s.x = num(v, s.x)); bind('sbY', v => s.y = num(v, s.y)); bind('sbCol', v => s.color = v);
      sb.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { snapshot(); s.color = b.dataset.c; changed(); });
      $('sbAllCol').onclick = () => { snapshot(); P.spots.forEach(q => q.color = s.color); changed(); };
      const hb = $('sbHome'); if (hb) hb.onclick = () => { snapshot(); s.x = s.home[0]; s.y = s.home[1]; delete s.home; changed(); msg('↺ Back where it started'); };
      if (st) bind('sbLit', v => { const k = st.route.findIndex(r => rid(r) === s.spot), n = Math.max(1, Math.min(40, Math.round(num(v, st.lit))));
        st.route[k] = n === st.lit ? s.spot : Object.assign(typeof st.route[k] === 'object' ? st.route[k] : {spot: s.spot}, {lit: n}); });
    } else sb.innerHTML = `<h4>🔵 Hole</h4><p class="sb-hint">Tap a hole to move it, recolor it or change how many bulbs go in it.</p>`;
    // strands
    $('sbStrands').innerHTML = `<h4>🔌 Wiring</h4><div class="sb-st">${P.strands.map((st, i) => { const u = used(st);
      return `<div class="${i === AS ? 'on' : ''}" style="--w:${WIRE[i % WIRE.length]}"><div class="sb-f"><b style="color:${WIRE[i % WIRE.length]}">${esc(st.name)}</b> · ${st.route.length} holes · <span class="use ${u > st.bulbs ? 'bad' : 'ok'}">uses ${u} of ${st.bulbs}</span></div>
        <div class="sb-f">Bulbs <input type="number" min="1" data-k="bulbs" data-i="${i}" value="${st.bulbs}"> Lead <input type="number" min="0" data-k="lead" data-i="${i}" value="${st.lead}"> Per hole <input type="number" min="1" data-k="lit" data-i="${i}" value="${st.lit}"> Bridge <input type="number" min="0" data-k="bridge" data-i="${i}" value="${st.bridge}"></div>
        <div class="sb-f"><button class="btn" data-w="${i}">🔌 Wire this one</button><button class="btn" data-clr="${i}">Clear</button>${P.strands.length > 1 ? `<button class="btn" data-rm="${i}">✖</button>` : ''}</div></div>`; }).join('')}</div>
      <div class="sb-f" style="margin-top:6px"><button class="btn c" id="sbAuto" style="--c:#a8f23a">🐍 Auto-wire from the plug</button><button class="btn" id="sbAddSt">＋ Strand</button></div>
      <p class="sb-hint">Lead = dark bulbs from the plug to the first hole. Bridge = dark bulbs on the back between holes.</p>`;
    $('sbStrands').querySelectorAll('input[data-k]').forEach(el => el.onchange = () => { snapshot(); const st = P.strands[+el.dataset.i]; st[el.dataset.k] = Math.max(el.dataset.k === 'lead' || el.dataset.k === 'bridge' ? 0 : 1, Math.round(num(el.value, st[el.dataset.k]))); changed(); });
    $('sbStrands').querySelectorAll('[data-w]').forEach(b => b.onclick = () => { AS = +b.dataset.w; TOOL = 'wire'; draw(); paintSide(); });
    $('sbStrands').querySelectorAll('[data-clr]').forEach(b => b.onclick = () => { snapshot(); P.strands[+b.dataset.clr].route = []; changed(); });
    $('sbStrands').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { snapshot(); P.strands.splice(+b.dataset.rm, 1); AS = 0; changed(); });
    $('sbAuto').onclick = autoWire;
    $('sbAddSt').onclick = () => { snapshot(); const l = P.strands[P.strands.length - 1]; P.strands.push({name: 'Strand ' + (P.strands.length + 1), bulbs: l.bulbs, lead: 0, lit: l.lit, bridge: l.bridge, route: []}); AS = P.strands.length - 1; TOOL = 'wire'; changed(); };
    paintParts(); paintBuild();
  }
  function parts() {                                              // 🧾 parts and cut list, worked out from the drawing
    const [W, H] = P.size, u = P.units === 'in' ? '"' : ' ' + P.units, f = v => r2(v) + u, N = P.spots.length;
    const tol = P.spacing * 0.45, cols = [], rows = []; P.spots.forEach(s => { if (!cols.some(c => Math.abs(c - s.x) <= tol)) cols.push(s.x); if (!rows.some(r => Math.abs(r - s.y) <= tol)) rows.push(s.y); });
    const sheet = (a, b) => Math.min(Math.ceil(a / 30) * Math.ceil(b / 40), Math.ceil(a / 40) * Math.ceil(b / 30));
    const wired = new Set(); P.strands.forEach(st => st.route.forEach(e => wired.add(rid(e))));
    const lit = P.strands.reduce((a, st) => a + st.route.reduce((b, e) => b + (typeof e === 'object' && e.lit != null ? +e.lit : st.lit), 0), 0), tot = P.strands.reduce((a, st) => a + st.bulbs, 0);
    let hop = 0; P.strands.forEach(st => { let prev = [P.cord.x, P.cord.y]; st.route.forEach((e, k) => { const s = spotById(rid(e)); if (!s) return; if (k) hop = Math.max(hop, Math.hypot(s.x - prev[0], s.y - prev[1])); prev = [s.x, s.y]; }); });
    const cnt = {}; P.spots.forEach(s => cnt[s.color] = (cnt[s.color] || 0) + 1);
    return {face: `${f(W)} × ${f(H)}`, N, hole: f(P.hole), back: f(Math.max(0.5, P.hole * 0.45)), corner: f(P.corner), sheets: sheet(W, H), strips: cols.length + 1 + rows.length + 1, cols: cols.length, rows: rows.length,
      lit, dark: tot - lit, tot, hop: f(hop), unwired: N - wired.size, colors: cnt, strands: P.strands.length};
  }
  function paintParts() {
    const el = $('sbParts'); if (!el || !P) return; const q = parts();
    el.innerHTML = `<h4>🧾 Parts &amp; cut list</h4><ul>
      <li><b>Face</b> (black foam core): <span class="m">${q.face}</span>, <span class="m">${q.N}</span> holes <span class="m">⌀ ${q.hole}</span>, corners <span class="m">${q.corner}</span> · ${q.sheets} sheet${q.sheets > 1 ? 's' : ''} of 30 × 40</li>
      <li><b>Back</b> (white): same size, <span class="m">${q.N}</span> holes <span class="m">⌀ ${q.back}</span> for the bulbs, a notch at the PLUG for the cord</li>
      <li><b>Frosted sheet</b> (vellum, drafting film or thin acrylic): <span class="m">${q.face}</span></li>
      <li><b>Light cells</b>: about <span class="m">${q.strips}</span> white strips, 2" tall (${q.cols} columns × ${q.rows} rows of holes)</li>
      <li><b>Bulbs</b>: <span class="m">${q.lit}</span> lit + <span class="m">${q.dark}</span> dark = <span class="m">${q.tot}</span> on ${q.strands} strand${q.strands > 1 ? 's' : ''}${q.unwired ? ` · ⚠️ ${q.unwired} hole${q.unwired > 1 ? 's' : ''} not wired yet` : ''}</li>
      <li><b>Longest hop</b> between holes: <span class="m">${q.hop}</span> (check your string's bulb spacing reaches it)</li>
      <li><b>Colors</b>: ${Object.entries(q.colors).map(([c, n]) => `<span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${esc(c)};vertical-align:-1px"></span> ${n}`).join(' · ')}</li>
      <li>Hot glue, fresh craft-knife blades, a ${q.hole} circle cutter or hole saw, zip ties</li></ul>`;
  }

  // ---------------------------------------------------------------- CAD import (DXF circles / points, SVG circles or shapes)
  function fromHoles(H, name, unitsScale) {                       // H: [[x, y, r]] in file units, y down
    if (!H.length) return msg('😕 No holes (circles or points) found in that drawing');
    H = H.map(([x, y, r]) => [x * unitsScale, y * unitsScale, (r || 0) * unitsScale]);
    let sp = 0; { const d = H.map((a, i) => Math.min(...H.map((b, j) => i === j ? Infinity : Math.hypot(a[0] - b[0], a[1] - b[1])))).filter(isFinite).sort((a, b) => a - b); sp = d.length ? d[d.length >> 1] : 4; }
    const rs = H.map(h => h[2]).filter(r => r > 0).sort((a, b) => a - b), hole = rs.length ? rs[rs.length >> 1] * 2 : sp * 0.56;
    const x0 = Math.min(...H.map(h => h[0])), y0 = Math.min(...H.map(h => h[1])), x1 = Math.max(...H.map(h => h[0])), y1 = Math.max(...H.map(h => h[1])), mg = Math.max(hole, sp * 0.75);
    const spots = H.map((h, i) => ({spot: i + 1, x: r2(h[0] - x0 + mg), y: r2(h[1] - y0 + mg), color: '#ff3d9a'}));
    const W = r2(x1 - x0 + 2 * mg), Ht = r2(y1 - y0 + 2 * mg);
    create({name: name.slice(0, 50), size: [W, Ht], spacing: r2(sp), hole: r2(hole), corner: r2(mg * 0.75), cord: {x: r2(W / 2), y: Ht}, spots, strands: [{name: 'Strand 1', bulbs: 300, lead: 0, lit: 3, bridge: 1, route: []}]},
      `📐 ${H.length} holes from ${name}. Board ${W} × ${Ht}". Check the size (↔ Scale everything), then 🐍 Auto-wire.`).then(() => autoWire());
  }
  function parseDXF(t) {
    const L = t.split(/\r?\n/), H = []; let ins = 1, i = 0, inEnt = false;
    for (let k = 0; k < L.length - 1; k += 2) { if (L[k].trim() === '9' && L[k + 1].trim() === '$INSUNITS') { const v = +((L[k + 3] || '').trim()); ins = {1: 1, 2: 12, 4: 1 / 25.4, 5: 1 / 2.54, 6: 39.37}[v] || 1; } }
    while (i < L.length - 1) {
      const c = L[i].trim(), v = (L[i + 1] || '').trim(); i += 2;
      if (c === '2' && v === 'ENTITIES') inEnt = true; if (!inEnt || c !== '0' || !/^(CIRCLE|POINT|ARC)$/.test(v)) continue;
      const e = {}; while (i < L.length - 1 && L[i].trim() !== '0') { e[L[i].trim()] = parseFloat(L[i + 1]); i += 2; }
      if (isFinite(e['10']) && isFinite(e['20']) && v !== 'ARC') H.push([e['10'], -e['20'], v === 'CIRCLE' ? e['40'] : 0]);
    }
    return {H, s: ins};
  }
  function parseSVG(t) {
    const doc = new DOMParser().parseFromString(t, 'image/svg+xml'), H = [];
    doc.querySelectorAll('script,foreignObject').forEach(n => n.remove());
    doc.querySelectorAll('circle').forEach(c => H.push([+c.getAttribute('cx') || 0, +c.getAttribute('cy') || 0, +c.getAttribute('r') || 0]));
    doc.querySelectorAll('ellipse').forEach(c => H.push([+c.getAttribute('cx') || 0, +c.getAttribute('cy') || 0, ((+c.getAttribute('rx') || 0) + (+c.getAttribute('ry') || 0)) / 2]));
    if (!H.length) {                                              // no circles: walk the shapes and drop holes along them
      const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); host.style.cssText = 'position:absolute;left:-9999px;width:0;height:0'; document.body.appendChild(host);
      try { doc.querySelectorAll('path,polyline,polygon,line,rect').forEach(n => { const k = document.importNode(n, false); k.removeAttribute('transform'); host.appendChild(k); });
        const els = [...host.children].filter(n => n.getTotalLength); let tot = 0; els.forEach(n => tot += n.getTotalLength()); const step = tot / Math.min(150, Math.max(12, tot / 20));
        els.forEach(n => { const l = n.getTotalLength(); for (let d = 0; d <= l; d += step) { const p = n.getPointAtLength(d); if (!H.some(h => Math.hypot(h[0] - p.x, h[1] - p.y) < step * 0.6)) H.push([p.x, p.y, 0]); } });
      } finally { host.remove(); }
    }
    let s = 1 / 96; const root = doc.documentElement, w = root.getAttribute('width') || '';     // CSS px -> inches, unless the file says otherwise
    if (/mm$/.test(w)) { const vb = (root.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number); if (vb[2]) s = parseFloat(w) / vb[2] / 25.4; }
    else if (/in$/.test(w)) { const vb = (root.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number); if (vb[2]) s = parseFloat(w) / vb[2]; }
    return {H, s};
  }
  async function takeCAD(f) {
    if (!f) return; const ext = (f.name.split('.').pop() || '').toLowerCase(), name = f.name.replace(/\.[^.]+$/, '');
    try { const t = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsText(f); });
      if (ext === 'dxf') { const {H, s} = parseDXF(t); fromHoles(H, name, s); }
      else if (ext === 'svg') { const {H, s} = parseSVG(t); fromHoles(H, name, s); }
      else if (ext === 'glowbop' || ext === 'json') { const j = JSON.parse(t); if (j.type !== 'sign') return msg('😕 That .glowbop file isn\'t a sign'); create(j, `🪧 ${j.name || name} imported as a new project`); }
      else msg('😕 Sign Blueprint reads DXF, SVG and .glowbop sign files');
    } catch (e) { msg('😕 Could not read ' + f.name); }
  }

  // ---------------------------------------------------------------- print / export / pull into the wall
  function svgFor(real) {
    const [W, H] = P.size, o = order(), hr = P.hole / 2;
    let g = `<svg xmlns="http://www.w3.org/2000/svg" ${real ? `width="${W}${P.units}" height="${H}${P.units}"` : 'width="100%"'} viewBox="0 0 ${W} ${H}">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${Math.min(P.corner, W / 2, H / 2)}" fill="none" stroke="#000" stroke-width="0.03"/>`;
    P.spots.forEach(p => { g += `<circle cx="${p.x}" cy="${p.y}" r="${hr}" fill="none" stroke="#000" stroke-width="0.03"/><line x1="${p.x - .25}" y1="${p.y}" x2="${p.x + .25}" y2="${p.y}" stroke="#000" stroke-width="0.02"/><line x1="${p.x}" y1="${p.y - .25}" x2="${p.x}" y2="${p.y + .25}" stroke="#000" stroke-width="0.02"/>
      <text x="${p.x}" y="${p.y + hr + 0.35}" font-size="0.3" text-anchor="middle" font-family="monospace">${o[p.spot] || ''} ${esc(p.color)}</text>`; });
    g += `<rect x="${P.cord.x - .5}" y="${P.cord.y - .25}" width="1" height=".5" fill="none" stroke="#000" stroke-width="0.03"/><text x="${P.cord.x}" y="${P.cord.y - .4}" font-size="0.3" text-anchor="middle">PLUG</text>`;
    return g + '</svg>';
  }
  function exportSVG() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([svgFor(true)], {type: 'image/svg+xml'})); a.download = (P.name || 'sign').replace(/[^\w-]+/g, '-') + '-drill-template.svg';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); GB.toast('📐 Real-size drill template saved: print it at 100% (tile it across pages)');
  }
  function exportGlowbop() {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(P, null, 1)], {type: 'application/json'})); a.download = (P.name || 'sign').replace(/[^\w-]+/g, '-') + '.glowbop';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function printIt() {
    draw(); const q = parts(), bp = $('sbStage').innerHTML.replace(/fill="#16121f"/g, 'fill="#16121f"');
    const w = window.open('', '_blank'); if (!w) return GB.toast('Allow pop-ups to print, or use ⬇️ Real-size SVG');
    w.document.write(`<!doctype html><title>${esc(P.name)} blueprint</title><style>body{font:14px sans-serif;margin:24px;color:#111}h1{font-size:22px;margin:0 0 8px}.bp{background:#0b0814;padding:10px;border-radius:10px;max-width:760px}li{margin:3px 0}@media print{.pb{page-break-before:always}}</style>
      <h1>🪧 ${esc(P.name)}: blueprint</h1><div class="bp">${bp}</div>
      <h2>Parts &amp; cut list</h2>${$('sbParts').innerHTML.replace(/<h4>.*?<\/h4>/, '')}
      <div class="pb"></div><h2>Drill template (real size: print at 100%)</h2>${svgFor(true)}`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 400);
  }
  async function pull() {
    if (!P) return; const unwired = parts().unwired; if (unwired) return msg(`⚠️ ${unwired} hole${unwired > 1 ? 's are' : ' is'} not wired yet: 🐍 Auto-wire or 🔌 wire them first`);
    const box = $('sbPull'); let ss = []; try { ss = (await GB.get('/api/lights/stage')).devices.filter(d => d.kind === 'string'); } catch (e) {}
    box.hidden = false;
    box.innerHTML = ss.length ? `<div class="sb-f">Light <b>${esc(P.name)}</b> with: ${ss.map(d => `<button class="chip" data-d="${esc(d.id)}">🧵 ${esc(d.name)} · ${d.n}</button>`).join('')}<button class="chip" id="sbPullX">Cancel</button></div>
      <p class="sb-hint">The sign refits to that string's bulb count and sits beside your curtains. ↩️ Put it back (in Map your lights) returns the string to how it was.</p>`
      : `<p class="sb-hint">No string lights yet. Add one on the LIGHTS page first.</p>`;
    box.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => { box.hidden = true; if (GB.artPullSign) await GB.artPullSign(JSON.parse(JSON.stringify(P)), b.dataset.d); });
    const x = $('sbPullX'); if (x) x.onclick = () => box.hidden = true;
  }

  // ---------------------------------------------------------------- the panel
  GB.panel('art', 5, el => {
    el.classList.add('box'); el.id = 'sbPanel'; el.style.setProperty('--c', '#ff9a3d');
    el.innerHTML = `<div class="ph"><span>🪧 Sign Blueprint <span class="ab-beta">BETA</span></span><span class="r" id="sbSaved">ART PROJECTS</span></div>
      <div class="bp-top"><select id="bpPick" aria-label="Sign project"></select><button class="btn c" id="sbNew" style="--c:#3ce08a">＋ New sign</button>
        <details class="bp-more"><summary class="btn">⋯ More</summary><div><button class="btn" id="sbDup">⧉ Duplicate</button><button class="btn" id="sbGbDl">📦 Save as a .glowbop file</button><button class="btn" id="sbDel">🗑 Delete this sign</button></div></details></div>
      <div class="bp-steps">${STEPS.map(([k, t]) => `<button data-step="${k}">${t}</button>`).join('')}</div>
      <div class="bp-step" data-for="pic"><p class="bp-say">Start from a picture: your logo shows faded under the board so you can trace it with lights. Or load a CAD drawing and its circles become holes.</p>
        <div class="bp-tiles"><button class="bp-tile" id="sbBgBtn" style="--c:#ffc23d"><b>📷 Load a picture or logo</b><small>PNG or JPG. White backgrounds turn see-through.</small></button><button class="bp-tile" data-t="logo" style="--c:#ffc23d"><b>🖐️ Move &amp; size the picture</b><small>Drag it, pinch it, or use the size slider below.</small></button><button class="bp-tile" id="sbBgDel" style="--c:#ff5a7a"><b>🗑 Remove the picture</b><small>Takes the picture away, keeps your holes.</small></button><button class="bp-tile" id="sbCad" style="--c:#33d6ff"><b>📐 Load a CAD drawing</b><small>DXF or SVG: every circle becomes a hole.</small></button></div>
        <div class="sb-card" id="bpBoard"></div><button class="btn c bp-next" data-go="holes" style="--c:#ff9a3d">Next: ② Holes →</button></div>
      <div class="bp-step" data-for="holes"><p class="bp-say">Put holes where the lights go. Easiest: ✏️ Draw lights and trace your picture with a finger; a hole drops every few inches, in the order the string will run.</p>
        <div class="bp-tiles"><button class="bp-tile" data-t="draw" style="--c:#c79bff"><b>✏️ Draw lights</b><small>Drag along the picture: holes drop as you go.</small></button><button class="bp-tile" data-t="add" style="--c:#3ce08a"><b>➕ Add one hole</b><small>Tap the board where a hole goes.</small></button><button class="bp-tile" data-t="move" style="--c:#ff3d9a"><b>✋ Move a hole</b><small>Drag a hole. Tap one to edit it below.</small></button><button class="bp-tile" data-t="del" style="--c:#ff5a7a"><b>✖ Delete a hole</b><small>Tap a hole to remove it.</small></button><button class="bp-tile" id="sbSnap" style="--c:#ffc23d"><b>🧲 Snap to the grid</b><small>On: holes line up with each other.</small></button><button class="bp-tile" id="bpUndo" style="--c:#a49cbd"><b>↶ Undo</b><small>Takes back your last change.</small></button></div>
        <div class="sb-card" id="sbSel"></div><button class="btn c bp-next" data-go="wire" style="--c:#ff9a3d">Next: ③ Wiring →</button></div>
      <div class="bp-step" data-for="wire"><p class="bp-say">Tell GlowBop the order the string runs through the holes, starting at the plug. Auto-wire does it for you; numbers on the holes show the order.</p>
        <div class="bp-tiles"><button class="bp-tile" id="sbAutoT" style="--c:#a8f23a"><b>🐍 Auto-wire</b><small>Snakes row by row from the plug.</small></button><button class="bp-tile" data-t="wire" style="--c:#33d6ff"><b>🔌 Wire by tapping</b><small>Tap holes in the order the string runs.</small></button><button class="bp-tile" id="bpUndo2" style="--c:#a49cbd"><b>↶ Undo</b><small>Takes back your last change.</small></button></div>
        <div class="sb-card" id="sbStrands"></div><button class="btn c bp-next" data-go="light" style="--c:#ff9a3d">Next: ④ Light it up →</button></div>
      <div class="bp-step" data-for="light"><p class="bp-say">While you build: pick your string here (it leaves the main wall), then tap a hole and its bulbs light up on the real string.</p>
        <div class="sb-card" id="sbBuild"></div><button class="btn c bp-next" data-go="done" style="--c:#ff9a3d">Next: ⑤ Finish →</button></div>
      <div class="bp-step" data-for="done"><p class="bp-say">Print the plans, save a real-size drill template, and when the sign is built, pull it into your wall.</p>
        <div class="bp-tiles"><button class="bp-tile" id="sbPrint" style="--c:#c79bff"><b>🖨️ Print the blueprint</b><small>Plans and parts list, plus the drill template.</small></button><button class="bp-tile" id="sbSvgDl" style="--c:#33d6ff"><b>⬇️ Real-size drill template</b><small>An SVG to print at 100% and tape to the board.</small></button><button class="bp-tile" id="sbPullBtn" style="--c:#ff9a3d"><b>🧱 Pull into my wall</b><small>Light the finished sign with a string on your wall.</small></button></div>
        <div class="sb-card" id="sbPull" hidden></div><div class="sb-card sb-parts" id="sbParts"></div></div>
      <div class="bp-hint" id="sbHint"></div>
      <div class="sb-stage" id="sbStage"></div>
      <div class="bp-zoom"><button class="btn" id="sbZoomOut" aria-label="Zoom out">－</button><button class="btn" id="sbZoomV" disabled>100%</button><button class="btn" id="sbZoomIn" aria-label="Zoom in">＋</button><button class="btn" id="sbZoomFit">⤢ Fit</button><button class="btn" id="sbDims" style="--c:#c79bff">📏 Sizes</button></div>
      <div class="sb-msg" id="sbMsg"></div>
      <input type="file" id="sbFile" hidden accept=".dxf,.svg,.glowbop,.json"><input type="file" id="sbBgFile" hidden accept="image/*,.svg,.dxf">`;
    el.querySelectorAll('.bp-steps button').forEach(b => b.onclick = () => setStep(b.dataset.step));
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { setStep(b.dataset.go); el.scrollIntoView({behavior: 'smooth', block: 'start'}); });
    el.querySelector('#sbCad').onclick = () => el.querySelector('#sbFile').click();
    el.querySelector('#sbAutoT').onclick = () => autoWire();
    el.querySelector('#bpUndo2').onclick = () => el.querySelector('#bpUndo').click();
    el.querySelector('#sbBgDel').onclick = () => { if (!P || !P.bg) return; snapshot(); P.bg = null; changed(); setStep('pic'); msg('🗑 Picture removed'); };
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { TOOL = b.dataset.t; draw(); paintSide(); });
    el.querySelector('#sbSnap').onclick = () => { SNAP = !SNAP; paintSide(); };
    el.querySelector('#sbDims').onclick = e => { SHOW.dims = !SHOW.dims; e.currentTarget.classList.toggle('on', SHOW.dims); draw(); };
    el.querySelector('#sbDims').classList.add('on');
    el.querySelector('#bpUndo').onclick = () => { const u = UNDO.pop(); if (!u) return GB.toast('Nothing to undo'); P = JSON.parse(u); changed(); };
    el.querySelector('#sbFile').onchange = e => { takeCAD(e.target.files[0]); e.target.value = ''; };
    const zc = f => { const sv = $('sbSvg'); if (!sv) return; const r = sv.getBoundingClientRect(); zoomAt(f, r.left + r.width / 2, r.top + r.height / 2); };
    el.querySelector('#sbZoomIn').onclick = () => zc(1.4); el.querySelector('#sbZoomOut').onclick = () => zc(1 / 1.4);
    el.querySelector('#sbZoomFit').onclick = () => { VIEW = {z: 1, cx: null, cy: null}; draw(); paintZoom(); };
    el.querySelector('#sbStage').addEventListener('wheel', e => { if (!P) return; if (e.ctrlKey || e.metaKey || e.altKey) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0025), e.clientX, e.clientY); }
      else if (VIEW.z > 1) { e.preventDefault(); const u = upxNow(); VIEW.cx += e.deltaX * u; VIEW.cy += e.deltaY * u; draw(); } }, {passive: false});
    el.querySelector('#sbBgBtn').onclick = () => { if (!P) return msg('Pick or make a sign first (＋ New sign)'); el.querySelector('#sbBgFile').click(); };
    el.querySelector('#sbBgFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f || !P) return;
      if (/\.(dxf|glowbop|json)$/i.test(f.name)) return takeCAD(f);
      msg('📷 Loading ' + f.name + '…');
      try { const url = URL.createObjectURL(f), im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
        const k = Math.min(1, 1000 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        const cx2 = c.getContext('2d'); cx2.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        try { const d = cx2.getImageData(0, 0, c.width, c.height), a = d.data;      // white / near-white background -> see-through, so the board shows
          for (let i = 0; i < a.length; i += 4) { const m = Math.min(a[i], a[i + 1], a[i + 2]); if (m > 232) a[i + 3] = 0; else if (m > 200) a[i + 3] = Math.round(a[i + 3] * (232 - m) / 32); }
          cx2.putImageData(d, 0, 0); } catch (_) {}
        snapshot(); const W = P.size[0], H = P.size[1], ar = c.width / c.height, fw = ar >= W / H ? W : H * ar, fh = fw / ar;
        P.bg = {src: c.toDataURL('image/png'), op: 0.7, x: r2((W - fw) / 2), y: r2((H - fh) / 2), w: r2(fw), h: r2(fh)}; changed(); setStep('holes');
        msg('📷 Picture is on the board. Now ✏️ Draw lights: drag along it with your finger and holes drop where the string runs.'); } catch (err) { msg('😕 Could not read that picture. Try a PNG or JPG.'); } };
    el.querySelector('#sbPrint').onclick = () => P && printIt();
    el.querySelector('#sbSvgDl').onclick = () => P && exportSVG();
    el.querySelector('#sbGbDl').onclick = () => P && exportGlowbop();
    el.querySelector('#sbPullBtn').onclick = pull;
    const st = el.querySelector('#sbStage');
    st.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    st.addEventListener('dragover', e => e.preventDefault()); st.addEventListener('drop', e => { e.preventDefault(); takeCAD(e.dataTransfer.files[0]); });
    document.addEventListener('keydown', e => { if (GB.page !== 'art' || !P) return; if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); $('bpUndo').click(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && SEL != null && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName)) { snapshot(); const id = SEL; P.spots = P.spots.filter(s => s.spot !== id); P.strands.forEach(q => q.route = q.route.filter(r => rid(r) !== id)); changed(); } });
    paintSide();
  });
  // 📐 PRO ART layout: the blueprint gets the big left side, the Live wall and the other boxes stack on the right
  if (GB.layTPL) GB.layTPL.art = {wide: [[0, 30, ['#sbPanel']], [30, 18, ['v:wall', 'v:mode', 'v:reads']]], tall: [[0, 48, ['#sbPanel']]]};
  GB.signLab = {open: async id => { await loadList(); GB.go('art'); setTimeout(() => { open(id); const p = $('sbPanel'); if (p) p.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 80); }};
  GB.on('page', async id => { if (id !== 'art') return; await loadList(); if (!P && LIST[0]) open(LIST[0].id); });
})();
