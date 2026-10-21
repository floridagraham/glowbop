/* 🧵 LAY OUT A STRING (LIGHTS tab, Oct 17, Graham: "someone at home only has these strings... grab the end of the string,
   drag it wherever you want it, and it maps it like that"; then "I'm using this Nanoleaf strand for our logo, so the two
   strands get remapped").
   Your curtains sit on the stage where they hang. Each string shows as a chain of dots: drag its ends (and any bend) anywhere,
   add bends, fold it into rows (back and forth, or every other bulb like a string zig-zagged flat), flip it, and split it
   into the strands that come off its splitter so each strand traces its own part of a sign or logo. The real bulb under
   your finger blinks white while you drag. Save and the live wall shows every light exactly as you laid it out, with the
   show playing across all of them as one picture.
   Engine: GET /api/lights/stage, POST /api/lights/lay {id, lay}, POST /api/lights/pick {id, i}. Maths = lights.py lay_points. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const SCOL = ['#33d6ff', '#ff3d9a', '#ffcc33', '#2bd96b', '#b98cff', '#ff8a1a', '#7ae6ff', '#ff6a6a'];
  const CCOL = ['#7a6cff', '#ff7ac8', '#4fd1c5', '#ffb86b'];
  GB.css(`
  .sl-top { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .sl-top .chip { min-height:40px; background:color-mix(in srgb, var(--c) 20%, #0b0814); color:color-mix(in srgb, var(--c) 70%, #fff); box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--c) 45%, transparent); transition:background .15s, box-shadow .15s; }
  .sl-top .chip.on { background:var(--c); color:#000; box-shadow:0 0 16px color-mix(in srgb, var(--c) 70%, transparent), inset 0 0 0 2px #fff; }
  /* 📋 Oct 18 (Graham: "a little box that has all your lights in it, and then you click and expand"; "get more real estate on the iPad") */
  #slPanel > .note, #slPanel .sl-top { display:none !important; }
  .sl-list { display:flex; flex-direction:column; gap:6px; }
  .sl-lt { font:800 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); }
  .sl-li { border-radius:12px; background:color-mix(in srgb, var(--c) 9%, #0b0814); box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--c) 35%, transparent); }
  .sl-li.on { background:color-mix(in srgb, var(--c) 14%, #0b0814); box-shadow:inset 0 0 0 2px var(--c), 0 0 14px color-mix(in srgb, var(--c) 45%, transparent); }
  .sl-lih { display:flex; width:100%; align-items:center; gap:8px; background:none; border:0; color:color-mix(in srgb, var(--c) 60%, #fff); padding:6px 10px; min-height:42px; font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.5px; cursor:pointer; text-align:left; }
  .sl-li.on .sl-lih { color:#fff; }
  .sl-lih i { width:12px; height:12px; border-radius:50%; background:var(--c); flex:0 0 auto; opacity:.45; }
  .sl-li.on .sl-lih i { opacity:1; box-shadow:0 0 8px var(--c); }
  .sl-lih span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .sl-lih small { color:var(--dim); font-size:12px; white-space:nowrap; } .sl-lih small.off { color:#ff6a8a; }
  .sl-lih b { color:var(--c); }
  .sl-lib { padding:0 8px 10px; display:flex; flex-direction:column; gap:8px; }
  .sl-li:not(.on) .sl-lib { display:none; }
  /* 📱 Oct 18 (Graham, iPad: "my lights is way at the bottom, it's in the way"): narrow screens get the list as one slim row of
     light chips right above the board; the picked light's controls open under the board */
  #slAsk:not([hidden]) { display:flex !important; flex-wrap:wrap; align-items:center; gap:6px; padding:6px 10px !important; margin:0 0 6px !important; font-size:calc(13px * var(--fs, 1)); }
  #slAsk span { flex:1 1 220px; min-width:0; } #slAsk .btn { min-height:34px !important; padding:0 12px !important; font-size:13px !important; flex:0 0 auto; }
  .sl-list.strip { flex:0 0 auto; min-height:46px; flex-direction:row; flex-wrap:wrap; overflow:visible; gap:6px; margin:0 0 6px; padding-bottom:2px; }   /* 🧩 Oct 19 (Graham: chips past the edge were hidden, couldn't get back to them): every light chip wraps onto the next line, all visible */
  .sl-list.strip .sl-lt { display:none; }
  .sl-list.strip .sl-li { flex:0 0 auto; } .sl-list.strip .sl-lih { min-height:38px; padding:4px 12px; } .sl-list.strip .sl-lih b { display:none; }
  .sl-list.strip .sl-lib { display:none !important; }
  #slCtl { display:flex; flex-direction:column; gap:8px; } #slCtl:empty { display:none; }
  .sl-fab { position:absolute; top:6px; right:6px; z-index:3; display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; max-width:calc(100% - 12px); pointer-events:none; }
  .sl-fab .btn { pointer-events:auto; min-height:38px !important; min-width:40px; padding:0 9px !important; font-size:15px !important; background:#0d0b18e6; border-radius:10px; }
  .sl-fab .btn.on { background:var(--cyan); color:#000; } .sl-fab .btn:disabled { opacity:.35; }
  .sl-fab .sep { width:6px; }
  .sl-view { position:absolute; top:50px; right:6px; z-index:4; width:min(300px, calc(100% - 12px)); background:#0d0b18f4; border:2px solid #ffc23d; border-radius:0 14px 0 14px; padding:10px; box-shadow:0 10px 30px #000b; }
  .sl-view[hidden] { display:none; }
  .sl-view b { display:block; font:800 13px var(--cond); letter-spacing:1.5px; color:#ffc23d; text-transform:uppercase; margin-bottom:6px; }
  .sl-view .g { display:grid; grid-template-columns:repeat(4, 1fr); gap:5px; margin-bottom:6px; }
  .sl-view .g .btn { min-height:40px !important; padding:0 4px !important; font-size:13px !important; }
  .sl-view p { margin:4px 0 0; font:600 12px var(--cond); color:var(--dim); letter-spacing:.5px; }
  .sl-beep { border-top:1px solid var(--line); padding-top:4px; } .sl-beep > summary { cursor:pointer; list-style:none; font:700 13px var(--cond); color:var(--amber); letter-spacing:1px; padding:6px 0; }
  .sl-pick { display:inline-flex; flex-wrap:wrap; gap:6px; margin-left:6px; vertical-align:middle; }
  .sl-pick button { border:0; border-radius:999px; min-height:34px; padding:0 12px; font:700 13px var(--cond); letter-spacing:.5px; cursor:pointer; background:color-mix(in srgb, var(--c) 25%, #0b0814); color:#fff; box-shadow:inset 0 0 0 2px var(--c); }
  .sl-stage { position:relative; height:min(64vh, 640px); min-height:280px; border-radius:0 14px 0 14px; background:#06050c; border:1px solid var(--line); overflow:hidden; touch-action:none; }
  .sl-stage svg { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; user-select:none; -webkit-user-select:none; }
  .sl-stage .h { cursor:grab; }
  .sl-zoom .btn { min-width:52px; min-height:36px !important; }
  .sl-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .sl-row > b { font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); min-width:74px; }
  .sl-row .btn, .sl-row .chip { min-height:44px; }
  .sl-tools { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 130px), 1fr)); gap:6px; }
  .sl-tools .btn { min-height:48px; }
  .sl-hint { font:600 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:var(--cyan); min-height:1.3em; }
  .sl-hd { display:none; }
  .sl-go { min-height:52px; font-size:calc(16px * var(--fs, 1)); }
  /* ✏️ full-screen editor (Oct 17, Graham: "make that draw thing bigger... so it looks like you're actually customizing it") */
  .sl-full { position:fixed !important; inset:0; z-index:240; margin:0 !important; border-radius:0 !important; background:#05040a !important;
    display:grid !important; grid-template-columns:minmax(0, 1fr) minmax(280px, 360px); grid-template-rows:auto auto minmax(0, 1fr) auto; gap:8px 12px;
    padding:calc(8px + env(safe-area-inset-top)) calc(10px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left)); overflow:hidden; }
  .sl-full > .ph, .sl-full > .note, .sl-full > .sl-go { display:none !important; }
  .sl-full .sl-hd { display:flex; grid-column:1 / -1; align-items:center; gap:8px; border-bottom:2px solid var(--cyan); padding-bottom:6px; }
  .sl-full .sl-hd b { flex:1; min-width:0; font:800 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--cyan); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sl-full .sl-hd .btn { min-height:46px; }
  .sl-full .sl-top, .sl-full .sl-list { grid-column:1; grid-row:2; }
  .sl-full .sl-stage { grid-column:1; grid-row:3; height:auto; min-height:0; }
  .sl-full .sl-hint { grid-column:1; grid-row:4; }
  .sl-full .sl-side { grid-column:2; grid-row:2 / 5; overflow:auto; display:flex; flex-direction:column; gap:10px; padding-right:2px; }
  @media (max-width: 760px), (max-height: 520px) and (max-width: 900px) {
    .sl-full { grid-template-columns:minmax(0, 1fr); grid-template-rows:auto auto minmax(240px, 1fr) auto minmax(0, 42%); }
    .sl-full .sl-side { grid-column:1; grid-row:5; }
  }
  body.sl-open { overflow:hidden; }
  /* 💻 Oct 17 (Graham: "the buttons are too big, it looks dumb on the laptop"): mouse screens get a compact toolbar */
  @media (hover: hover) and (pointer: fine) {
    #slTools, .sl-side { gap:6px; }
    #slTools { display:flex; flex-wrap:wrap; gap:6px 16px; align-items:center; }
    .sl-row { gap:4px; } .sl-row > b { min-width:0; font-size:11px; margin-right:2px; }
    .sl-row .btn, .sl-row .chip, .sl-tools .btn, #slCurt .btn { min-height:32px !important; padding:0 10px; font-size:12px; line-height:1.1; }
    .sl-tools { display:flex; flex-wrap:wrap; gap:4px; } .sl-tools .btn { flex:0 0 auto; }
    .sl-top .chip { min-height:32px; font-size:12px; }
    .sl-go { min-height:38px; font-size:13px; }
    .sl-more > summary { min-height:38px; font-size:13px; }
    .sl-full { grid-template-columns:minmax(0, 1fr) minmax(240px, 300px); }
  }
  /* 📱💻 Oct 17 (Graham: "the editor needs to be much larger on the iPad, more real estate for the lights"): on any wide screen the
     stage fills the box and every tool sits in a slim column beside it; the extra sections stay underneath */
  @media (min-width: 900px) {
    #slPanel:not(.sl-full) { display:grid; grid-template-columns:minmax(0, 1fr) minmax(230px, 270px); column-gap:12px; align-content:start; }
    #slPanel:not(.sl-full) > .ph, #slPanel:not(.sl-full) > .note, #slPanel:not(.sl-full) > .sl-more { grid-column:1 / -1; }
    #slPanel:not(.sl-full) > .sl-top, #slPanel:not(.sl-full) > .sl-stage, #slPanel:not(.sl-full) > .sl-hint, #slPanel:not(.sl-full) > .sl-go { grid-column:1; }
    #slPanel:not(.sl-full) > .sl-list { grid-column:1; }
    #slPanel:not(.sl-full) > .sl-side { grid-column:2; grid-row:3 / span 4; align-self:start; display:flex; flex-direction:column; gap:8px; max-height:calc(100vh - 150px); overflow:auto; }
    #slPanel:not(.sl-full) .sl-stage { height:max(380px, calc(100vh - 290px)); }
    #slPanel:not(.sl-full) #slTools { display:flex; flex-direction:column; gap:8px; }
    #slPanel:not(.sl-full) .sl-row { flex-direction:column; align-items:stretch; gap:4px; }
    #slPanel:not(.sl-full) .sl-row > b { min-width:0; }
    #slPanel:not(.sl-full) .sl-row .seg { display:flex; flex-wrap:wrap; }
    #slPanel:not(.sl-full) .sl-row .seg .btn { flex:1 1 30%; min-width:0; padding:0 6px; }
    #slPanel:not(.sl-full) .sl-tools { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    #slPanel:not(.sl-full) .sl-tools .btn { min-height:42px; font-size:13px; padding:0 6px; }
    #slPanel:not(.sl-full) #slWhich { flex-direction:row; flex-wrap:wrap; }
  }
  @media (min-width: 900px) and (hover: hover) and (pointer: fine) { #slPanel:not(.sl-full) .sl-tools .btn { min-height:32px; font-size:12px; } }
  .sl-menu { position:absolute; z-index:5; min-width:180px; background:#0d0b18f2; border:1px solid var(--cyan); border-radius:0 10px 0 10px; padding:4px; box-shadow:0 8px 30px #000a; }
  .sl-menu button { display:flex; width:100%; align-items:center; gap:8px; background:none; border:0; color:var(--text); font:600 13px var(--cond); letter-spacing:.5px; text-align:left; padding:8px 10px; border-radius:6px; cursor:pointer; }
  .sl-menu button:hover { background:#33d6ff22; color:var(--cyan); }
  .sl-menu hr { border:0; border-top:1px solid var(--line); margin:3px 4px; }
  .sl-full > .sl-more { display:none !important; }
  .sl-more { border-top:1px solid var(--line); padding-top:4px; }
  .sl-more > summary { list-style:none; cursor:pointer; display:flex; align-items:center; gap:8px; min-height:48px; font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--c, var(--cyan)); }
  .sl-more > summary::-webkit-details-marker { display:none; }
  .sl-more > summary::after { content:'▸'; margin-left:auto; transition:transform .15s; }
  .sl-more[open] > summary::after { transform:rotate(90deg); }
  .sl-sub { background:none !important; border:0 !important; padding:0 0 8px !important; margin:0 !important; box-shadow:none !important; }
  .sl-sub > .ph { display:none !important; }
  .sl-undo { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); z-index:9999; display:flex; gap:12px; align-items:center; max-width:calc(100vw - 32px);
    background:#12091f; color:#fff; border-radius:14px; padding:10px 12px 10px 16px; font:700 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.3px;
    box-shadow:0 0 0 2px #33d6ff, 0 0 22px #33d6ff66, 0 10px 30px #000c; animation:slUp .25s ease-out; }
  .sl-undo button { flex:0 0 auto; min-height:40px; padding:0 16px; border:0; border-radius:10px; background:#33d6ff; color:#000; font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1px; cursor:pointer; }
  @keyframes slUp { from { opacity:0; transform:translate(-50%, 14px); } }
  `);

  let ST = null, sel = '', strand = 0, BULB = false, DRAW = null, BENDS = false, LAY = {}, dirty = {}, svg = null, view = null, zoom = 1, drag = null, lastPick = 0, MOVE = {};
  const strings = () => (ST ? ST.devices.filter(d => d.kind === 'string') : []);
  const curtains = () => (ST ? ST.devices.filter(d => d.kind === 'grid') : []);
  const cpts = d => { const m = MOVE[d.id] || [0, 0]; return d.pts.map(([x, y]) => [x + m[0], y + m[1]]); };     // a curtain where you dragged it
  const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; };
  const dev = id => (ST ? ST.devices.find(d => d.id === id) : null);

  // ---------------- maths: the same as lights.py _lay_one / lay_points
  function smoothPath(p, per = 16) {             // 💎 Catmull-Rom through the points, same as lights.py smooth_path
    if (p.length < 3) return p; const q = [p[0], ...p, p[p.length - 1]], out = [];
    for (let i = 1; i < q.length - 2; i++) { const [p0, p1, p2, p3] = [q[i - 1], q[i], q[i + 1], q[i + 2]];
      for (let s = 0; s < per; s++) { const t = s / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); } }
    out.push(p[p.length - 1]); return out;
  }
  function layOne(n, pts, fold, gap, rev, smooth, pins) {
    n = Math.max(1, n | 0); pts = (pts && pts.length >= 2) ? pts : [[0, 0], [Math.max(1, n - 1), 0]];
    if (smooth && !(fold && (fold.rows | 0) > 1)) pts = smoothPath(pts);
    let out = [];
    if (fold && (fold.rows | 0) > 1) {
      const R = fold.rows | 0, k = R, L = n, P = Math.max(1, Math.ceil(L / k));
      const a = pts[0], b = pts[pts.length - 1], vx = b[0] - a[0], vy = b[1] - a[1], ln = Math.hypot(vx, vy) || 1, nx = -vy / ln, ny = vx / ln;
      for (let j = 0; j < n; j++) {
        let ri, pos;
        if (fold.mode === 'alt') { ri = j % k; pos = Math.floor(j / k); }
        else { ri = Math.floor(j / P); pos = j % P; if (ri % 2) pos = P - 1 - pos; }
        const t = pos / Math.max(1, P - 1);
        out.push([a[0] + t * vx + ri * gap * nx, a[1] + t * vy + ri * gap * ny]);
      }
    } else {
      const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const tot = cum[cum.length - 1] || 1;
      for (let j = 0; j < n; j++) {
        const d = n > 1 ? tot * j / (n - 1) : 0; let s = 1; while (s < pts.length - 1 && cum[s] < d) s++;
        const seg = cum[s] - cum[s - 1] || 1, t = Math.max(0, Math.min(1, (d - cum[s - 1]) / seg));
        out.push([pts[s - 1][0] + t * (pts[s][0] - pts[s - 1][0]), pts[s - 1][1] + t * (pts[s][1] - pts[s - 1][1])]);
      }
    }
    if (rev) out.reverse();
    if (pins) Object.entries(pins).forEach(([j, xy]) => { j = +j; if (j >= 0 && j < out.length) out[j] = [xy[0], xy[1]]; });   // ✋ single bulbs you moved
    return out;
  }
  function partCounts(d, lay) { const out = []; let left = d.n; lay.parts.forEach((p, k) => { const c = k === lay.parts.length - 1 ? left : Math.max(0, Math.min(left, p.n | 0)); out.push(c); left -= c; }); return out; }
  function wallPoints(N, lay) {                     // 🧱 same maths as lights.py: the whole string snakes in even rows
    const R = Math.max(1, lay.wall | 0), P = Math.max(1, Math.ceil(N / R)), pp = lay.parts[0].pts, a = pp[0], z = pp[pp.length - 1];
    const vx = z[0] - a[0], vy = z[1] - a[1], ln = Math.hypot(vx, vy) || 1, ux = vx / ln, uy = vy / ln, nx = -uy, ny = ux, pitch = ln / Math.max(1, P - 1), gap = lay.gap || 1, out = [];
    for (let i = 0; i < N; i++) { const r = Math.floor(i / P); let c = i % P; if (r % 2) c = P - 1 - c; out.push([a[0] + c * pitch * ux + r * gap * nx, a[1] + c * pitch * uy + r * gap * ny]); }
    return out;
  }
  function drawPreview(c) {                        // ✍️ while drawing: the bulbs you've laid, then the rest running on straight
    const pl = DRAW.placed.slice(); if (!pl.length) return null;
    const a = pl[pl.length - 2] || [pl[0][0] - 1, pl[0][1]], b = pl[pl.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1;
    while (pl.length < c) { const q = pl[pl.length - 1]; pl.push([q[0] + dx / ln, q[1] + dy / ln]); }
    return pl.slice(0, c);
  }
  // 🎨 Art board (Oct 17): a light mapped from a file. Same maths as lights.py art_points: START / END move, turn and resize the whole map.
  function artPoints(N, lay) {
    let P = lay.pts || [[0, 0]]; if (P.length !== N) P = Array.from({length: N}, (_, i) => P[Math.round(i * (P.length - 1) / Math.max(1, N - 1))]);
    let k = lay.ref > 0 && lay.ref < P.length ? lay.ref : 0;
    if (!k) { let bd = -1; P.forEach((q, i) => { const dd = (q[0] - P[0][0]) ** 2 + (q[1] - P[0][1]) ** 2; if (dd > bd) { bd = dd; k = i; } }); }
    const hp = (lay.parts && lay.parts[0] && lay.parts[0].pts) || [P[0], P[k]], h0 = hp[0], h1 = hp[hp.length - 1];
    const vx = P[k][0] - P[0][0], vy = P[k][1] - P[0][1], lv = Math.hypot(vx, vy);
    if (lv < 1e-6) return P.map(q => [q[0] - P[0][0] + h0[0], q[1] - P[0][1] + h0[1]]);
    const ux = h1[0] - h0[0], uy = h1[1] - h0[1], sc = Math.hypot(ux, uy) / lv, an = Math.atan2(uy, ux) - Math.atan2(vy, vx), c = Math.cos(an) * sc, sn = Math.sin(an) * sc;
    return P.map(q => { const x = q[0] - P[0][0], y = q[1] - P[0][1]; return [x * c - y * sn + h0[0], x * sn + y * c + h0[1]]; });
  }
  function layPoints(d, lay) {
    if (lay.kind === 'points') { const P = artPoints(d.n, lay);                 // 🪧 dark bulbs (sign wire runs) are drawn under the lit spot before them
      if (lay.hide && lay.hide.length) { const H = new Set(lay.hide); let last = null; for (let i = 0; i < P.length; i++) { if (!H.has(i)) last = P[i]; else if (last) P[i] = last; }
        const firstLit = P.findIndex((_, i) => !H.has(i)); if (firstLit > 0) for (let i = 0; i < firstLit; i++) P[i] = P[firstLit]; }
      return [P]; }
    if (DRAW && d.id === sel && DRAW.placed.length && !lay.wall) { const cs = partCounts(d, lay), res = [];
      lay.parts.forEach((p, k) => { if (cs[k] > 0) res.push(k === DRAW.k ? drawPreview(cs[k]) : layOne(cs[k], p.pts, p.fold, lay.gap || 1, p.rev, p.smooth, p.pins)); }); return res; }
    if (lay.wall) { const all = wallPoints(d.n, lay), cs = partCounts(d, lay), res = []; let o = 0; cs.forEach(c => { res.push(all.slice(o, o + c)); o += c; }); return res; }
    const cs = partCounts(d, lay), res = [];
    lay.parts.forEach((p, k) => { if (cs[k] > 0) res.push(layOne(cs[k], p.pts, p.fold, lay.gap || 1, p.rev, p.smooth, p.pins)); });
    return res;                                    // [[x, y] per bulb] per strand
  }

  // ---------------- a fresh layout for a string: under everything else, split into strands
  function bounds(skip) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ST.devices.forEach(d => {
      if (d.id === skip) return;
      const pts = d.kind === 'grid' ? cpts(d) : (LAY[d.id] ? layPoints(d, LAY[d.id]).flat() : []);
      pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    });
    return isFinite(x0) ? {x0, y0, x1, y1} : {x0: 0, y0: 0, x1: 19, y1: 0};
  }
  function fresh(d, strands) {
    const b = bounds(d.id), w = Math.max(10, b.x1 - b.x0), y = (isFinite(b.y1) && ST.devices.some(x => x.id !== d.id) ? b.y1 + 2 : 0);
    const S = Math.max(1, strands | 0), per = Math.floor(d.n / S), parts = [];
    for (let k = 0; k < S; k++) parts.push({pts: [[b.x0, y + k * 2], [b.x0 + w, y + k * 2]], n: per, rev: false, fold: null});
    return {parts, gap: 1};
  }
  function fromSaved(d) {
    const l = d.lay; if (!l) return null;
    if (l.parts) return JSON.parse(JSON.stringify(l));
    return {parts: [{pts: l.pts, n: d.n, rev: !!l.rev, fold: l.fold ? {rows: l.fold.rows, mode: l.fold.mode} : null}], gap: l.gap || 1};
  }

  // ---------------- drawing
  function fit() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ST.devices.forEach(d => {
      const pts = d.kind === 'grid' ? cpts(d) : (LAY[d.id] ? layPoints(d, LAY[d.id]).flat().concat(LAY[d.id].parts.flatMap(p => p.pts)) : []);
      pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    });
    if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 20; y1 = 10; }
    const pad = Math.max(3, 0.12 * Math.max(x1 - x0, y1 - y0)), w = (x1 - x0) + pad * 2, h = (y1 - y0) + pad * 2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    view = {cx, cy, w: w / zoom, h: h / zoom};
  }
  function draw() {
    if (!svg || !ST) return;
    if (!view) fit();
    svg.setAttribute('viewBox', `${view.cx - view.w / 2} ${view.cy - view.h / 2} ${view.w} ${view.h}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const R = 0.42, HR = Math.max(0.7, Math.min(view.w, view.h) / 30);
    let h = '';
    if (SNAP) h += `<defs><pattern id="slGrid" patternUnits="userSpaceOnUse" x="-0.5" y="-0.5" width="1" height="1"><circle cx="0.5" cy="0.5" r="0.07" fill="#8f86ff" fill-opacity="0.35"/></pattern></defs>`
      + `<rect x="${view.cx - view.w}" y="${view.cy - view.h}" width="${view.w * 2}" height="${view.h * 2}" fill="url(#slGrid)" pointer-events="none"/>`;
    // 🧲 lights that share one show get one glowing outline around them all, with the show's name
    ((ST && ST.groups) || []).forEach((g, gi) => {
      const bs = g.devices.map(id => dev(id)).filter(Boolean).map(boxOf).filter(Boolean); if (bs.length < 2) return;
      const u = {x0: Math.min(...bs.map(b => b.x0)) - 1.4, y0: Math.min(...bs.map(b => b.y0)) - 1.4, x1: Math.max(...bs.map(b => b.x1)) + 1.4, y1: Math.max(...bs.map(b => b.y1)) + 1.4};
      const gc = SCOL[(gi + 1) % SCOL.length];
      h += `<rect x="${u.x0}" y="${u.y0}" width="${u.x1 - u.x0}" height="${u.y1 - u.y0}" rx="1.2" fill="${gc}" fill-opacity="0.05" stroke="${gc}" stroke-width="${HR * 0.09}" stroke-dasharray="${HR * 0.5} ${HR * 0.25}" pointer-events="none"/>`
        + `<text x="${u.x0 + 0.4}" y="${u.y1 + HR * 0.95}" font-size="${HR * 0.8}" fill="${gc}" font-family="Saira Condensed, system-ui" font-weight="800" pointer-events="none">🔗 ${esc(g.name)} · one show</text>`;
    });
    let ci = 0;
    ST.devices.forEach(d => {
      if (d.kind !== 'grid') return; const col = CCOL[ci++ % CCOL.length], on = d.id === sel, pts = cpts(d), b = bbox(pts);
      const tw = TWIST && TWIST.id === d.id ? ` transform="rotate(${TWIST.deg.toFixed(1)} ${(b.x0 + b.x1) / 2} ${(b.y0 + b.y1) / 2})"` : '';
      h += `<g${tw}>`;
      h += `<g class="lv" data-d="${esc(d.id)}" data-o="0" opacity="${on ? 1 : 0.85}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${col}"/>`).join('')}</g>`;
      h += `<rect class="c" data-id="${esc(d.id)}" x="${b.x0 - 0.6}" y="${b.y0 - 0.6}" width="${b.x1 - b.x0 + 1.2}" height="${b.y1 - b.y0 + 1.2}" rx="0.6" fill="${col}" fill-opacity="${on ? 0.12 : 0.02}" stroke="${col}" stroke-width="${on ? HR * 0.12 : HR * 0.05}" stroke-dasharray="${on ? 'none' : HR * 0.3}" style="cursor:move"/>`;
      h += `<text x="${b.x0}" y="${b.y0 - 0.9}" font-size="${HR * 0.9}" fill="${col}" font-family="Saira Condensed, system-ui" font-weight="700" pointer-events="none">${esc(d.name)}${on ? '  ✥ drag · twist to turn' : ''}</text>`;
      h += `</g>`;
    });
    strings().forEach(d => {
      const lay = LAY[d.id]; if (!lay) return;
      const on = d.id === sel, per = layPoints(d, lay);
      per.forEach((pts, k) => {
        const col = SCOL[k % SCOL.length], act = on && k === strand;
        const fk = (lay.parts[k].fold && lay.parts[k].fold.rows) || 1; let near = Infinity;     // spacing along a row (folded: every rows-th bulb)
        for (const st of new Set([1, fk])) for (let i = st; i < pts.length; i++) { const q = Math.hypot(pts[i][0] - pts[i - st][0], pts[i][1] - pts[i - st][1]); if (q > 1e-6) near = Math.min(near, q); }
        const r = Math.max(0.22, Math.min(R, (isFinite(near) ? near : 1) * 0.45));          // close-set bulbs: smaller dots so each one still shows
        const pins = lay.parts[k].pins || {}, big = BULB && act ? Math.max(r, 0.3) : r;
        if (BENDS && on) { const mk = bendMarks(d, lay), off0 = partCounts(d, lay).slice(0, k).reduce((a, b) => a + b, 0);
          mk.forEach(([i, c]) => { const j = i - off0; if (j >= 0 && j < pts.length) h += `<circle cx="${pts[j][0]}" cy="${pts[j][1]}" r="${Math.max(0.45, r * 2.2)}" fill="none" stroke="#${c}" stroke-width="0.12"/>`; }); }
        const off = partCounts(d, lay).slice(0, k).reduce((a, b) => a + b, 0);
        h += `<g class="lv" data-d="${esc(d.id)}" data-o="${off}" opacity="${on ? (act ? 1 : 0.85) : 0.7}">${pts.map(([x, y], i) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${i === 0 && act && lay.kind !== 'curtain' ? Math.max(big * 1.8, 0.3) : big}" fill="${col}"${pins[i] ? ` stroke="#fff" stroke-width="0.08"` : ''}/>`).join('')}</g>`;
        if (on && !BULB && (lay.wall ? k === 0 : (act || lay.parts.length <= 4))) {      // many drops / strands: only the one you're laying shows its handles; a wall: one START + END for the whole wall
          const pp = lay.parts[k].pts;
          h += `<polyline points="${(lay.parts[k].smooth && !(lay.parts[k].fold && lay.parts[k].fold.rows > 1) ? smoothPath(pp) : pp).map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${HR * 0.1}" stroke-dasharray="${HR * 0.35} ${HR * 0.2}" opacity="${act ? 0.85 : 0.35}"/>`;
          pp.forEach((p, i) => {
            const end = i === 0 || i === pp.length - 1, lbl = lay.wall ? (i === 0 ? 'WALL ✥ MOVE' : 'WALL ↔ SIZE') : i === 0 ? (lay.parts[k].rev ? 'END' : 'START') : (i === pp.length - 1 ? (lay.parts[k].rev ? 'START' : 'END') : '');
            h += `<g class="h" data-s="${k}" data-p="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="${end ? HR : HR * 0.75}" fill="${act ? col : '#000'}" fill-opacity="${act ? 0.18 : 0.4}" stroke="${col}" stroke-width="${HR * 0.15}"/>`
              + (lbl ? `<text x="${p[0]}" y="${p[1] - HR * 1.3}" font-size="${HR * 0.8}" fill="${col}" text-anchor="middle" font-family="Saira Condensed, system-ui" font-weight="800" letter-spacing="0.05">${lbl}${lay.parts.length > 1 && !lay.wall ? ' ' + (k + 1) : ''}</text>` : '') + `</g>`;
          });
        }
      });
    });
    svg.innerHTML = h;
    paintTools(); if (LIVE) paintLive();
  }

  // ---------------- tools
  function paintTop() {
    const box = $('slTop'); if (!box) return;
    const ss = strings(), cc = curtains();
    if (!ss.length && !cc.length) { box.innerHTML = '<p class="note">Add your lights above, then lay them out here.</p>'; return; }
    if (sel && !ST.devices.some(d => d.id === sel)) sel = '';
    box.innerHTML = ss.map((d, i) => `<button class="chip${d.id === sel ? ' on' : ''}" data-sl="${esc(d.id)}" style="--c:${SCOL[i % SCOL.length]}">${d.curtain ? '〰️' : '🧵'} ${esc(d.name)} · ${d.n}</button>`).join('')
      + cc.map((d, i) => `<button class="chip${d.id === sel ? ' on' : ''}" data-sl="${esc(d.id)}" style="--c:${CCOL[i % CCOL.length]}">▦ ${esc(d.name)}</button>`).join('');
    box.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { sel = b.dataset.sl; strand = 0; CH = 0; paintTop(); draw(); paintCurtainCard(); });
    paintList();
  }
  // 📋 My lights: one row per light; tap one to open its controls right under it, tap again to close it
  function paintList() {
    const list = $('slList'), hold = $('slHold'); if (!list || !hold) return;
    ['slCurt', 'slCm', 'slTools'].forEach(i => { const n = $(i); if (n) hold.appendChild(n); });
    const rows = strings().map((d, i) => { const L = LAY[d.id]; return [d, SCOL[i % SCOL.length], L && L.kind === 'curtain' ? '🔓' : L && L.wall ? '▦' : '🧵']; })
      .concat(curtains().map((d, i) => [d, CCOL[i % CCOL.length], '▦']));
    if (!rows.length) { list.innerHTML = '<p class="note">Add your lights above, then lay them out here.</p>'; return; }
    list.innerHTML = '<b class="sl-lt">💡 My lights</b>' + rows.map(([d, c, ic]) => `<div class="sl-li${d.id === sel ? ' on' : ''}" style="--c:${c}"><button class="sl-lih" data-li="${esc(d.id)}"><i></i><span>${ic} ${esc(d.name)}</span><small${d.connected === false ? ' class="off"' : ''}>${d.n}${d.connected === false ? ' · offline' : ''}${(GB.lightsTune || []).some(t => t.id === d.id) ? ' · 🐢 ' + GB.lightsTune.find(t => t.id === d.id).fps + ' fps' : ''}</small><b>${d.id === sel ? '▾' : '▸'}</b></button><div class="sl-lib"></div></div>`).join('');
    list.querySelectorAll('[data-li]').forEach(b => b.onclick = () => { const id = b.dataset.li; sel = sel === id ? '' : id; if (sel) GB.post('/api/lights/identify', {id: sel, secs: 1.5}).catch(() => {});  /* 👆 Oct 19: tap a light, the real one flashes */ strand = 0; CH = 0; BULB = false; paintTop(); draw(); paintCurtainCard(); });
    const strip = list.classList.contains('strip'), body = strip ? (sel ? $('slCtl') : null) : list.querySelector('.sl-li.on .sl-lib');
    if (body) ['slCurt', 'slCm', 'slTools'].forEach(i => { const n = $(i); if (n) body.appendChild(n); });
  }
  function paintTools() {
    document.querySelectorAll('#slSnap [data-sn]').forEach(b => b.classList.toggle('on', (b.dataset.sn === '1') === SNAP));
    const d = dev(sel), lay = d && LAY[sel], box = $('slTools'), cb = $('slCurt'); if (!box) return;
    const isC = !!(d && d.kind === 'grid'); cb.hidden = !isC;
    if (!d) { box.hidden = true; $('slR').textContent = $('slR2').textContent = ''; $('slHint').textContent = $('slHint').textContent || 'Click a curtain or a string to edit it'; return; }
    const sn = $('slSnapT'); if (sn) sn.classList.toggle('on', SNAP);
    if (isC) { $('slDrops').textContent = GB.pro === false ? '🔒 Unlock drops · PRO' : '🔓 Unlock drops'; box.hidden = true; $('slR').textContent = $('slR2').textContent = Object.keys(MOVE).length ? 'NOT SAVED' : 'CURTAIN'; return; }
    if (!d || !lay) { box.hidden = true; return; }
    if (lay.kind === 'points') { box.hidden = true; $('slR').textContent = $('slR2').textContent = dirty[sel] ? 'NOT SAVED' : '🎨 FROM A FILE';
      $('slHint').textContent = '🎨 Mapped from a file (Art board). Drag START to move it, END to turn or resize it, then Save. To change the shape, import again on the ART page.'; paintCurtainCard(); return; }
    box.hidden = false;
    if (strand >= lay.parts.length) strand = 0;
    const p = lay.parts[strand], cs = partCounts(d, lay), fr = p.fold ? p.fold.rows : 1;
    const isCur = lay.kind === 'curtain', isWall = !!lay.wall;
    if (isWall) { $('slWallRow').style.display = ''; wallPicker(lay); } else if (!$('slWallPick').querySelector('[data-wr]')) $('slWallRow').style.display = 'none'; $('slStraight').style.display = isCur ? '' : 'none'; $('slReset').style.display = isCur ? 'none' : ''; $('slWall').style.display = isCur ? 'none' : '';
    $('slStrands').closest('.sl-row').style.display = isCur || isWall ? 'none' : ''; $('slFold').closest('.sl-row').style.display = isCur || isWall ? 'none' : '';
    $('slStrands').innerHTML = [1, 2, 3, 4].map(k => `<button class="btn${lay.parts.length === k ? ' on' : ''}" data-ns="${k}">${k}</button>`).join('');
    $('slWhich').innerHTML = lay.parts.length > 1 ? lay.parts.map((q, k) => `<button class="chip${k === strand ? ' on' : ''}" data-st="${k}" style="--c:${SCOL[k % SCOL.length]}">${isCur ? 'Drop' : 'Strand'} ${k + 1}${isCur ? '' : ' · ' + cs[k]}</button>`).join('') : '';
    $('slWhichRow').style.display = lay.parts.length < 2 || isWall ? 'none' : '';
    $('slFold').innerHTML = [[1, 'Line'], [2, '2 rows'], [3, '3 rows'], [4, '4 rows'], [6, '6 rows'], [8, '8 rows']].map(([k, t]) => `<button class="btn${fr === k ? ' on' : ''}" data-fr="${k}">${t}</button>`).join('');
    $('slModeRow').style.display = fr < 2 || isWall ? 'none' : '';
    $('slMode').innerHTML = [['snake', 'Back & forth'], ['alt', 'Every other bulb']].map(([m, t]) => `<button class="btn${p.fold && p.fold.mode === m ? ' on' : ''}" data-md="${m}">${t}</button>`).join('');
    $('slBendRow').style.display = fr > 1 || isWall ? 'none' : 'contents';
    paintCurtainCard();
    $('slCurveRow').style.display = fr > 1 || isWall ? 'none' : '';
    $('slBulb').style.display = isWall ? 'none' : ''; $('slFlip').style.display = isWall ? 'none' : '';
    // 🌲 Oct 18 (Graham: "wrap a curtain around a tree and run strings up it… draw that"): an unlocked curtain's drops can be drawn too
    $('slDraw').style.display = isWall ? 'none' : ''; $('slDraw').textContent = DRAW ? '✓ Done' : (isCur ? '✍️ Draw drop ' + (strand + 1) : '✍️ Draw it'); $('slBends').textContent = BENDS ? '💡 Hide' : '💡 Bends';
    $('slBulb').classList.toggle('on', BULB); $('slBulb').textContent = BULB ? '✋ Stop' : '✋ Bulbs';
    $('slUnpin').style.display = Object.keys(p.pins || {}).length ? '' : 'none';
    $('slCurveRow').querySelectorAll('[data-cv]').forEach(b => { b.classList.toggle('on', !!p.smooth === (b.dataset.cv === '1')); if (b.dataset.cv === '1') b.innerHTML = GB.pro === false ? '🔒 Smooth curves · PRO' : '💎 Smooth curves'; });
    $('slSave').classList.toggle('pulse', !!dirty[sel]);
    $('slR').textContent = $('slR2').textContent = d.lay ? (dirty[sel] ? 'NOT SAVED' : 'LAID OUT') : (dirty[sel] ? 'NOT SAVED' : 'A PLAIN LINE');
  }
  // 🧱 a wall is ONE piece: its START moves the whole wall, its END stretches / turns it; every strand keeps its rows, stacked in order
  function wallSync(lay) {
    if (!lay || !lay.wall) return; const S = lay.parts.length, rp = Math.max(1, Math.round(lay.wall / S)), gap = lay.gap || 1;
    const a = lay.parts[0].pts[0], z = lay.parts[0].pts[lay.parts[0].pts.length - 1], vx = z[0] - a[0], vy = z[1] - a[1], ln = Math.hypot(vx, vy) || 1, nx = -vy / ln, ny = vx / ln;
    void rp; void nx; void ny; lay.parts.forEach((p, k) => { if (k) p.pts = [a.slice(), [a[0] + vx, a[1] + vy]]; p.fold = null; });   // the wall maths places every bulb (wallPoints)
  }
  function wallPicker(lay) {
    const d = dev(sel), R = lay.wall || 0, P = R ? Math.ceil(d.n / R) : 0;
    $('slWallPick').innerHTML = `<button class="btn" data-wr="match">🟰 Match my curtains (drops)</button><button class="btn" data-wr="big">⬛ Biggest even wall</button>`
      + `<button class="btn" data-wr="-1" aria-label="One row fewer">−</button><button class="btn" disabled style="opacity:1">${R ? R + ((lay.gap || 1) < 0 ? ' drops × ' : ' rows × ') + P : 'rows'}</button><button class="btn" data-wr="+1" aria-label="One more row">+</button>`
      + (lay.wall ? '<button class="btn" data-wr="off">✕ Not a wall</button>' : '');
  }
  function curtainBox() {                         // where your curtains are + how tall (in bulbs), for "Match my curtains"
    let best = null, x1 = -Infinity;                // ⭐ your main panel sets the height (else the tallest curtain); the new curtain goes right of all of them
    panels().forEach(d => { if (d.id === sel) return; const pts = panelPts(d);
      if (!pts.length) return; const ys = pts.map(p => p[1]), xs = pts.map(p => p[0]), h = Math.round(Math.max(...ys) - Math.min(...ys)) + 1;
      x1 = Math.max(x1, ...xs); const main = d.id === mainId();
      if (!best || (main && !best.main) || (!best.main && h > best.h)) best = {h, y0: Math.min(...ys), main, name: d.name}; });
    return best ? {x1, y0: best.y0, h: best.h, name: best.name} : null;
  }
  // ⭐ Oct 17 (Graham: "if someone makes a string their main panel, we need to be able to do that too"): a panel is a curtain OR a string
  //   laid out as a wall / curtain. Any panel can be the main one; with no pick, the tallest panel is (strings-only homes: the first wall made).
  const isPanel = d => d.kind === 'grid' || !!(LAY[d.id] && (LAY[d.id].wall || LAY[d.id].kind === 'curtain'));
  const panels = () => (ST ? ST.devices.filter(isPanel) : []);
  const panelPts = d => d.kind === 'grid' ? cpts(d) : (LAY[d.id] ? layPoints(d, LAY[d.id]).flat() : []);
  const panelH = d => { const ys = panelPts(d).map(p => p[1]); return ys.length ? Math.round(Math.max(...ys) - Math.min(...ys)) + 1 : 0; };
  const mainId = () => { const pp = panels(); if (ST && ST.main && pp.some(d => d.id === ST.main)) return ST.main;
    let best = null; pp.forEach(d => { const h = panelH(d); if (!best || h > best.h) best = {id: d.id, h}; }); return best ? best.id : ''; };
  // 🧵 Oct 17 (Graham: "this should be a template for people to make a curtain out of any string of lights with this number of bulbs";
  //   "templates based on resolution: how tall is your main panel, or how tall do you want this?"): drops like a curtain, top-down, snaking,
  //   one bulb per curtain spot, as tall as you pick. Extra spots at the end of the last drop stay dark.
  const CURTAIN_TPL = [{n: 308, h: 21, name: '308-bulb string → 15 × 21 curtain'}];
  let CH = 0;                                      // the height picked in the 🧵 Make a curtain card (0 = match the main panel)
  function makeCurtain(h) {
    const d = dev(sel), lay = LAY[sel]; if (!d || !lay) return;
    const cb = curtainBox(), N = d.n, a = cb ? [cb.x1 + 1, cb.y0] : lay.parts[0].pts[0].slice();
    const R = Math.ceil(N / h); lay.wall = R; lay.gap = -1; lay.parts[0].pts = [a, [a[0], a[1] + h - 1]];
    lay.parts.forEach(p => { p.smooth = false; delete p.pins; p.rev = false; }); wallSync(lay);
    const last = N - (R - 1) * h;
    $('slHint').textContent = `🧵 ${R} drops of ${h}${last < h ? ` (the last drop is ${last} bulbs)` : ''}, saved. Hang it like this: start at the TOP next to your other lights, run the first drop down, the next one back up beside it, and keep snaking.`;
    change();
    // Oct 18 (Graham: "Make it a curtain isn't auto forming a box, that's what it should just do"): it forms the box AND saves it, one tap
    const id = sel; GB.post('/api/lights/lay', {id, lay: LAY[id]}).then(r => { if (r && r.ok) { dirty[id] = false; GB.sfx && GB.sfx('ok'); GB.toast(`🧵 ${R} × ${h} curtain made and saved`); paintCurtainCard(); } });
  }
  function paintCurtainCard() {
    const box = $('slCm'); if (!box) return; const d = dev(sel);
    if (!d || d.kind !== 'string' || (LAY[sel] && (LAY[sel].kind === 'curtain' || LAY[sel].kind === 'points'))) { box.hidden = true; return; } box.hidden = false;
    const all = panels(), cc = all.filter(x => x.id !== sel), m = mainId(), cb = curtainBox(), mh = cb ? cb.h : 21, h = CH || mh, R = Math.ceil(d.n / h), last = d.n - (R - 1) * h;
    const tpl = CURTAIN_TPL.find(t => t.n === d.n);
    box.innerHTML = `<b class="sl-cmh">🧵 Make it a curtain</b>
      ${all.length ? `<div class="sl-row"><b>Main panel</b><div class="seg">${all.map(c => `<button class="btn${c.id === m ? ' on' : ''}" data-mn="${esc(c.id)}">⭐ ${c.id === sel ? 'This one' : esc(c.name)}</button>`).join('')}</div></div>` : ''}
      ${m === sel ? '<p class="note" style="margin:2px 0 6px">⭐ This is your main panel: your other lights match its height and spacing.</p>' : ''}
      <div class="sl-row"><b>How tall?</b><div class="seg">${cc.length ? `<button class="btn${!CH ? ' on' : ''}" data-ch="0">🟰 Match main (${mh})</button>` : ''}${[11, 16, 21].filter(v => v !== mh || !cc.length).map(v => `<button class="btn${CH === v ? ' on' : ''}" data-ch="${v}">${v}</button>`).join('')}<button class="btn" data-ch="-">−</button><button class="btn" disabled style="opacity:1">${h} tall</button><button class="btn" data-ch="+">+</button></div></div>
      ${tpl ? `<button class="btn wide" data-tp="${tpl.h}" style="margin:4px 0">⭐ Template: ${esc(tpl.name)}</button>` : ''}
      <p class="note" style="margin:4px 0">${d.n} bulbs → <b>${R} drops of ${h}</b>${last < h ? `, the last drop ${last} bulbs` : ', every drop full'}. ${cc.length ? 'Same spacing as your main panel, one bulb per spot.' : 'Bulbs evenly spaced, one per spot. ⭐ This becomes your main panel: lights you add later match it.'}</p>
      <button class="btn c wide" id="slCmGo" style="--c:var(--pink)">🧵 Make it a ${R} × ${h} curtain</button>`;
    box.querySelectorAll('[data-mn]').forEach(b => b.onclick = async () => { if (await GB.post('/api/lights/main', {id: b.dataset.mn})) { ST.main = b.dataset.mn; CH = 0; GB.toast('⭐ Main panel: ' + b.textContent.replace('⭐ ', '')); paintCurtainCard(); } });
    box.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => { const v = b.dataset.ch; CH = v === '-' ? Math.max(2, h - 1) : v === '+' ? Math.min(200, h + 1) : +v; if (CH === mh && cc.length) CH = 0; paintCurtainCard(); });
    box.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { CH = +b.dataset.tp; makeCurtain(CH); paintCurtainCard(); });
    $('slCmGo').onclick = () => makeCurtain(h);
  }
  // 🗺️ the Live map button (Pro pages only: PRO DJ, PRO HOME, PRO ART)
  GB.css(`.sl-livebtn { position:fixed; right:18px; bottom:64px; z-index:230; border:0; border-radius:0 18px 0 18px; padding:12px 18px; cursor:pointer;
    font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:#fff;
    background:linear-gradient(135deg, var(--pink), var(--violet)); box-shadow:0 8px 26px #0009, 0 0 22px -6px var(--pink); }
  .sl-livebtn[hidden] { display:none; } body.sl-open .sl-livebtn { display:none; }`);
  const LIVE_PAGES = ['home', 'art'];
  const liveHere = () => GB.pro === true && (LIVE_PAGES.includes(GB.page) || (GB.page === 'dj' && document.documentElement.classList.contains('prodj')));
  function paintLiveBtn() {
    let b = $('slLiveBtn');
    if (!b) { b = document.createElement('button'); b.id = 'slLiveBtn'; b.className = 'sl-livebtn'; b.type = 'button'; b.textContent = '🗺️ Live map';
      b.title = 'Map your lights while the show plays'; b.onclick = () => GB.slLive && GB.slLive(); document.body.appendChild(b); }
    b.hidden = !liveHere();
  }
  GB.on('page', () => setTimeout(paintLiveBtn, 0)); GB.on('pro', () => setTimeout(paintLiveBtn, 0)); GB.on('ready', paintLiveBtn);
  setInterval(paintLiveBtn, 1500);                 // PRO DJ is the DJ page in Pro mode: catch the switch
  // 🎨 for the Art board: how tall the main panel is and where a newly mapped light should go (right of all the others)
  GB.slPlaceFor = async id => { if (!ST) await load(true); const keep = sel; sel = id; const cb = curtainBox(); sel = keep; return cb || {x1: -1, y0: 0, h: 21}; };
  GB.slReload = () => load(true);
  // 👋 setup: a string light that isn't laid out as a wall yet gets asked once ("make it a curtain that matches your main panel?")
  function paintAsk() {
    const box = $('slAsk'); if (!box) return;
    let skip = {}; try { skip = JSON.parse(localStorage.getItem('gb_cm_skip') || '{}'); } catch (e) {}
    const d = strings().find(x => !isPanel(x) && !skip[x.id] && panels().length);
    if (!d) { box.hidden = true; return; } box.hidden = false;
    const cb = curtainBox(), h = cb ? cb.h : 21;
    // Oct 18 (Graham: "that big Make a curtain button at the top is distracting… when you push it, it wasn't working"): one slim line,
    //   and the button really makes the curtain (and saves it) instead of just scrolling to the card.
    box.innerHTML = `<span>🧵 <b>${esc(d.name)}</b>: make it a ${Math.ceil(d.n / h)} × ${h} curtain like your main panel?</span><button class="btn c" data-ak="go" style="--c:var(--pink)">🧵 Make it</button><button class="btn" data-ak="no">✕</button>`;
    box.querySelector('[data-ak="go"]').onclick = () => { sel = d.id; strand = 0; CH = 0; paintTop(); makeCurtain(h); paintAsk(); };
    box.querySelector('[data-ak="no"]').onclick = () => { skip[d.id] = 1; try { localStorage.setItem('gb_cm_skip', JSON.stringify(skip)); } catch (e) {} paintAsk(); };
  }
  function change() { dirty[sel] = true; view = view || null; commit(); draw(); }
  // ↶↷ undo / redo (Oct 17, Graham): every drag, bend, fold, flip and move is one step
  // Oct 18 (Graham: "the undo button doesn't really work"): a curtain now saves itself the moment you let go, and its
  //   undo step remembers exactly where it was and which way it faced, so undo puts the real curtain back (no more stale offsets).
  let HIST = [], FUT = [], LAST = null;
  const stateNow = () => JSON.stringify({LAY});
  function pushOp(op) { HIST.push(op); if (HIST.length > 80) HIST.shift(); FUT = []; paintUR(); }
  function commit() { const cur = stateNow(); if (LAST !== null && cur !== LAST) pushOp({lay: LAST}); LAST = cur; paintUR(); }
  function restore(st) { const o = JSON.parse(st); LAY = o.LAY || {}; LAST = st; Object.keys(LAY).forEach(id => dirty[id] = true); draw(); paintUR(); }
  const curState = d => { const b = bbox(d.pts), o = d.orient || {}; return {place: [b.x0, b.y0], rot: (o.rot || 0) % 360, flip: !!o.flip}; };
  async function applyCurt(id, st) {
    const r = await GB.post('/api/lights/place', {id, place: st.place, rot: st.rot, flip: st.flip});
    if (r && r.ok) { dirty[id] = false; delete MOVE[id]; await load(true); return true; } return false;
  }
  async function curtSave(id, to, quiet) {                        // save a curtain's new spot / turn now, as one undo step
    const d = dev(id); if (!d) return; const from = curState(d);
    if (JSON.stringify(from) === JSON.stringify(to)) { delete MOVE[id]; dirty[id] = false; return draw(); }
    if (await applyCurt(id, to)) { pushOp({curt: id, from, to}); if (!quiet) GB.sfx && GB.sfx('ok'); }
  }
  async function undo() { const op = HIST.pop(); if (!op) return GB.toast('Nothing to undo');
    if (op.curt) { if (!(await applyCurt(op.curt, op.from))) { HIST.push(op); return; } FUT.push(op); }
    else { FUT.push({lay: LAST}); restore(op.lay); }
    paintUR(); GB.toast('↶ Undone'); }
  async function redo() { const op = FUT.pop(); if (!op) return GB.toast('Nothing to redo');
    if (op.curt) { if (!(await applyCurt(op.curt, op.to))) { FUT.push(op); return; } HIST.push(op); }
    else { HIST.push({lay: LAST}); restore(op.lay); }
    paintUR(); GB.toast('↷ Redone'); }
  // 🔔 Oct 17: tap when a light's power box beeps: GlowBop logs the moment (beeps.jsonl) and turns that light's power down a notch
  // 🔔 Oct 17: "My lights are beeping", the same for every light (no brand named). Tonight's lesson: the "light" beeping all day was the
  //   dishwasher, so it first asks you to check what else is beeping nearby, then turns the whole show down a notch if you still want.
  function paintBeep() {
    const box = $('slBeep'); if (!box) return; box.hidden = false;
    const bri = GB.status && GB.status.brightness != null ? GB.status.brightness / 100 : null;   // /api/status sends 0-100
    $('slBeepNote').innerHTML = bri != null && bri < 0.995 ? `Show brightness ${Math.round(bri * 100)}% <a href="#" id="slBeepReset">Back to 100%</a>` : '';
    const rs = $('slBeepReset'); if (rs) rs.onclick = async e => { e.preventDefault(); if (await GB.post('/api/lights/beep', {reset: true})) { GB.toast('↺ Brightness back to 100%'); setTimeout(paintBeep, 600); } };
  }
  async function beep() {
    const box = $('slBeepAsk');
    if (box && box.hidden) { box.hidden = false; return; }
    if (box) box.hidden = true;
    const r = await GB.post('/api/lights/beep', {}); if (!r) return;
    if (r.after < r.before) GB.toast(`🔔 Got it, turned the show down ${Math.round(r.before * 100)}% → ${Math.round(r.after * 100)}%. Give it a couple of minutes.`);
    else if (r.floor) GB.toast('🔔 Noted. The show is already down to 40%. If it still beeps, check the power box and the plug.');
    else if (r.waiting) GB.toast('🔔 Noted. Already turned down just now, give it a minute.');
    else GB.toast('🔔 Noted');
    GB.sfx && GB.sfx('ok'); setTimeout(paintBeep, 600);
  }
  function paintUR() { const u = $('slUndo'), r = $('slRedo'); if (u) u.disabled = !HIST.length; if (r) r.disabled = !FUT.length; }

  // ---------------- dragging handles
  function toWorld(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM(); if (!m) return [0, 0]; const q = pt.matrixTransform(m.inverse()); return [q.x, q.y]; }
  let SNAP = true; try { SNAP = localStorage.getItem('gb_sl_snap') !== '0'; } catch (e) {}
  const snap = v => SNAP ? Math.round(v) : Math.round(v * 20) / 20;      // 🧲 snap to grid: whole bulb spots (off = place freely)
  function bulbAt(d, lay, k, i) {                // the real bulb at handle i of strand k (first / last / nearest the bend)
    const cs = partCounts(d, lay), base = cs.slice(0, k).reduce((a, b) => a + b, 0), p = lay.parts[k], c = cs[k];
    const pts = layOne(c, p.pts, p.fold, lay.gap || 1, p.rev, p.smooth, p.pins), h = p.pts[i];
    let best = 0, bd = Infinity; pts.forEach(([x, y], j) => { const q = (x - h[0]) ** 2 + (y - h[1]) ** 2; if (q < bd) { bd = q; best = j; } });
    return base + best;
  }
  function blink(d, lay, k, i) { const now = Date.now(); if (now - lastPick < 220) return; lastPick = now;
    const idx = lay.wall ? (i ? Math.ceil(d.n / lay.wall) - 1 : 0) : bulbAt(d, lay, k, i); GB.post('/api/lights/pick', {id: d.id, i: idx, secs: 1.2}); }
  // ✍️ Oct 17 (Graham: "draw with your finger, one bulb per travel; when you're done, straighten the rest out for them")
  const RDP = (pts, eps) => {                      // keep only the real bends of a hand-drawn line
    if (pts.length < 3) return pts.slice(); const [a, b] = [pts[0], pts[pts.length - 1]]; let idx = 0, dmax = 0;
    for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], vx = b[0] - a[0], vy = b[1] - a[1], L = Math.hypot(vx, vy) || 1;
      const dd = Math.abs(vy * p[0] - vx * p[1] + b[0] * a[1] - b[1] * a[0]) / L; if (dd > dmax) { dmax = dd; idx = i; } }
    if (dmax <= eps) return [a, b];
    const l = RDP(pts.slice(0, idx + 1), eps), r = RDP(pts.slice(idx), eps); return l.slice(0, -1).concat(r);
  };
  function drawCount() { const d = dev(sel), lay = LAY[sel]; return d && lay ? partCounts(d, lay)[DRAW.k] : 0; }
  function drawHint() { const c = drawCount(); $('slHint').textContent = DRAW ? `✍️ Strand ${DRAW.k + 1}: ${DRAW.placed.length} of ${c} bulbs placed. Draw where it runs, lift your finger to finish (the rest runs on straight).` : ''; }
  function drawCommit() {                          // the drawing becomes a clean path with bend points you can still drag
    const lay = LAY[sel], c = drawCount(); if (!lay || !DRAW || DRAW.placed.length < 2) return;
    const full = drawPreview(c), path = RDP(full, 0.45), p = lay.parts[DRAW.k];
    p.pts = path.map(q => [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]); p.fold = null; p.smooth = false; p.rev = false; delete p.pins;
    dirty[sel] = true; commit();
  }
  function bendMarks(d, lay) {                     // 💡 start (green), end (pink), and every bend: left turns amber, right turns lavender
    const per = layPoints(d, lay), out = []; let off = 0;
    per.forEach(pts => { const n = pts.length; if (!n) return;
      out.push([off, '2bd96b']); if (n > 1) out.push([off + n - 1, 'ff3d9a']);
      for (let i = 1; i < n - 1; i++) { const a = pts[i - 1], b = pts[i], c = pts[i + 1], ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1];
        const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy); if (lu < 1e-6 || lv < 1e-6) continue;
        const cos = (ux * vx + uy * vy) / (lu * lv); if (cos > 0.82) continue;               // straighter than ~35°: not a bend
        out.push([off + i, (ux * vy - uy * vx) > 0 ? 'b98cff' : 'ffcc33']); }
      off += n; });
    return out.slice(0, 400);
  }
  async function showBends(on) {
    const d = dev(sel), lay = LAY[sel]; if (!d || !lay) return;
    if (!on) { BENDS = false; await GB.post('/api/lights/marks', {stop: true}); draw(); return; }
    const mk = bendMarks(d, lay); const r = await GB.post('/api/lights/marks', {id: d.id, marks: mk, secs: 30});
    if (r) { BENDS = true; GB.toast(`💡 ${mk.length} bulbs lit: green = start, pink = end, amber / purple = bend here (left / right). 30 seconds.`); draw(); setTimeout(() => { BENDS = false; draw(); }, 30000); }
  }
  let TWIST = null;                                  // 🔄 two fingers on a curtain: {id, a0, deg}; snaps to quarter turns when you let go
  function onDown(e) {
    hideMenu(); if (e.button === 2) return;
    if (DRAW && LAY[sel]) {                                            // ✍️ drawing: every bulb-width of travel lays the next bulb
      e.preventDefault(); const at = toWorld(e); if (!DRAW.placed.length) DRAW.placed.push(at);
      drag = {draw: true}; try { svg.setPointerCapture(e.pointerId); } catch (x) {} onMove(e); return;
    }
    const onH = e.target.closest && e.target.closest('.h'), here = onH ? [] : curtainsAt(toWorld(e));
    if (!onH && !BULB) {                                                // 🧱 a strand laid as a wall: grab it anywhere on its body and move it, like a curtain
      const [wx, wy] = toWorld(e), ws = strings().filter(isWallStr).filter(d => { const b = boxOf(d); return b && wx >= b.x0 - 0.7 && wx <= b.x1 + 0.7 && wy >= b.y0 - 0.7 && wy <= b.y1 + 0.7; });
      const w = ws.find(d => d.id === sel) || (!here.length || !here.includes(sel) ? ws[0] : null);
      if (w) { e.preventDefault(); if (sel !== w.id) { sel = w.id; strand = 0; paintTop(); paintCurtainCard && paintCurtainCard(); }
        drag = {wall: w.id, at: [wx, wy], from: JSON.parse(JSON.stringify(LAY[w.id].parts.map(p => p.pts))), lay0: JSON.parse(JSON.stringify(LAY[w.id])), moved: false}; try { svg.setPointerCapture(e.pointerId); } catch (x) {}
        $('slHint').innerHTML = `✥ Moving <b>${esc(w.name)}</b>. Drop it right next to another light and they join into one show.`; draw(); return; }
    }
    if (here.length && !(dev(sel) && dev(sel).kind === 'string' && nearString(sel, toWorld(e)))) {   // ▦ grab a curtain anywhere and move it
      e.preventDefault(); const id = here.includes(sel) ? sel : here[0]; if (sel !== id) { sel = id; paintTop(); paintCurtainCard(); }
      drag = {curt: id, at: toWorld(e), from: (MOVE[id] || [0, 0]).slice(), moved: false}; try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      pickHint(here, id); draw(); return;
    }
    if (BULB && LAY[sel]) {                                           // ✋ grab the nearest bulb of this strand
      const lay = LAY[sel], d = dev(sel), per = layPoints(d, lay), pts = per[strand] || [], [x, y] = toWorld(e);
      let best = -1, bd = Math.max(0.6, Math.min(view.w, view.h) / 30) ** 2; pts.forEach(([px, py], j) => { const q = (px - x) ** 2 + (py - y) ** 2; if (q < bd) { bd = q; best = j; } });
      if (best < 0) return; e.preventDefault();
      drag = {bulb: best}; try { svg.setPointerCapture(e.pointerId); } catch (x2) {}
      const base = partCounts(d, lay).slice(0, strand).reduce((a, b) => a + b, 0); drag.real = base + best;
      GB.post('/api/lights/pick', {id: d.id, i: drag.real, secs: 1.2}); $('slHint').textContent = 'Bulb ' + (drag.real + 1) + ' is blinking: drag it to where it really is'; return;
    }
    const g = e.target.closest && e.target.closest('.h');
    if (!g) { const m = svg.getScreenCTM(); if (!m || !view) return; e.preventDefault();      // 🖐️ drag empty space to slide the view around
      drag = {pan: true, sx: e.clientX, sy: e.clientY, cx: view.cx, cy: view.cy, k: m.a, moved: false, at: toWorld(e)}; try { svg.setPointerCapture(e.pointerId); } catch (x) {} svg.style.cursor = 'grabbing'; return; }
    e.preventDefault(); const k = +g.dataset.s, i = +g.dataset.p; strand = k;
    drag = {k, i, id: e.pointerId}; try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    const d = dev(sel); blink(d, LAY[sel], k, i);
    $('slHint').textContent = i === 0 ? 'Watch the real string: the blinking bulb is this end' : 'Drag it to where that bulb really is';
  }
  // 👆 Oct 18 (Graham: "these are now overlapping… you want to click on them and be separate"): which curtains are under a point,
  //   thinnest first (a LIFX line across a Twinkly wins on its line); the one you've picked always wins, and a chooser offers the rest.
  function curtainsAt([x, y]) {
    const out = [];
    curtains().forEach(d => { const b = bbox(cpts(d)), pad = 0.7; if (x >= b.x0 - pad && x <= b.x1 + pad && y >= b.y0 - pad && y <= b.y1 + pad) out.push([d.id, (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1)]); });
    return out.sort((a, b) => a[1] - b[1]).map(a => a[0]);
  }
  function nearString(id, [x, y]) { const d = dev(id), lay = LAY[id]; if (!d || !lay) return false; const lim = Math.max(0.8, (view ? Math.min(view.w, view.h) : 20) / 25) ** 2;
    return layPoints(d, lay).some(pts => pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < lim)); }
  function pickHint(here, id) {
    const hn = $('slHint'); if (!hn) return; const d = dev(id);
    hn.innerHTML = `✥ Moving <b>${esc(d ? d.name : '')}</b>. Let go to drop it: the real lights switch over then.` + (here.length > 1 ? ` <span class="sl-pick">Also here: ${here.filter(x => x !== id).map(x => { const o = dev(x), i = curtains().findIndex(c => c.id === x); return `<button data-pk="${esc(x)}" style="--c:${CCOL[i % CCOL.length]}">▦ ${esc(o ? o.name : x)}</button>`; }).join('')}</span>` : '');
    hn.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => { sel = b.dataset.pk; paintTop(); paintCurtainCard(); draw(); hn.textContent = '▦ ' + (dev(sel) || {}).name + ' picked: drag it, or twist two fingers on it to turn it'; });
  }
  function onMove(e) {
    if (!drag) return; e.preventDefault();
    if (drag.draw) {
      const [x, y] = toWorld(e), c = drawCount(); let added = false;
      while (DRAW.placed.length < c) { const q = DRAW.placed[DRAW.placed.length - 1], dx = x - q[0], dy = y - q[1], L = Math.hypot(dx, dy); if (L < 1) break;
        DRAW.placed.push([q[0] + dx / L, q[1] + dy / L]); added = true; }
      if (added) { const now = Date.now(); if (now - lastPick > 160) { lastPick = now; const base = partCounts(dev(sel), LAY[sel]).slice(0, DRAW.k).reduce((a, b) => a + b, 0);
        GB.post('/api/lights/pick', {id: sel, i: base + DRAW.placed.length - 1, secs: 1}); } dirty[sel] = true; drawHint(); draw(); }
      return;
    }
    if (drag.pan) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true; if (!drag.moved) return; view.cx = drag.cx - (e.clientX - drag.sx) / drag.k; view.cy = drag.cy - (e.clientY - drag.sy) / drag.k; return draw(); }
    if (drag.bulb !== undefined) { const [x, y] = toWorld(e), p = LAY[sel].parts[strand]; p.pins = p.pins || {}; p.pins[drag.bulb] = [snap(x), snap(y)]; dirty[sel] = true;
      const now = Date.now(); if (now - lastPick > 300) { lastPick = now; GB.post('/api/lights/pick', {id: sel, i: drag.real, secs: 1.2}); } return draw(); }
    if (drag.wall) { const [x, y] = toWorld(e), dx = snap(x - drag.at[0]), dy = snap(y - drag.at[1]), lay = LAY[drag.wall];
      lay.parts.forEach((p, k) => { p.pts = drag.from[k].map(([a, b]) => [a + dx, b + dy]); const p0 = drag.lay0.parts[k].pins; if (p0) Object.keys(p0).forEach(j => p.pins[j] = [p0[j][0] + dx, p0[j][1] + dy]); }); wallSync(lay); if (dx || dy) drag.moved = true; dirty[drag.wall] = true; return draw(); }
    if (drag.curt) { const [x, y] = toWorld(e); MOVE[drag.curt] = [snap(drag.from[0] + x - drag.at[0]), snap(drag.from[1] + y - drag.at[1])]; if (MOVE[drag.curt][0] || MOVE[drag.curt][1]) drag.moved = true; dirty[drag.curt] = true; return draw(); }
    const [x, y] = toWorld(e), lay = LAY[sel], p = lay.parts[drag.k].pts;
    if (lay.wall) {                                                   // 🧱 the whole wall moves / stretches together
      const p0 = lay.parts[0].pts, nx = snap(x), ny = snap(y);
      if (drag.i === 0) { const dx = nx - p0[0][0], dy = ny - p0[0][1]; p0[0] = [nx, ny]; p0[1] = [p0[1][0] + dx, p0[1][1] + dy]; }
      else p0[1] = [nx, ny];
      wallSync(lay); dirty[sel] = true; draw(); blink(dev(sel), lay, 0, drag.i ? 1 : 0); return;
    }
    p[drag.i] = [snap(x), snap(y)]; dirty[sel] = true; draw(); blink(dev(sel), lay, drag.k, drag.i);
  }
  async function onUp() {
    if (drag && drag.draw) { drag = null; drawCommit(); drawHint(); draw(); return; }
    if (drag && drag.wall) {                                             // 🧱 let go of a strand wall: click it into place, save it, join if it touches
      const id = drag.wall, d = dev(id), lay = LAY[id], lay0 = drag.lay0, moved = drag.moved; drag = null; svg.style.cursor = ''; $('slHint').textContent = '';
      if (!moved) { dirty[id] = false; return draw(); }
      const m = SNAP ? magnet(id, boxOf(d)) : null;
      if (m) { lay.parts.forEach(p => { p.pts = p.pts.map(([a, b]) => [a + m[0], b + m[1]]); if (p.pins) Object.keys(p.pins).forEach(j => p.pins[j] = [p.pins[j][0] + m[0], p.pins[j][1] + m[1]]); }); wallSync(lay); }
      commit(); const r = await GB.post('/api/lights/lay', {id, lay});
      if (r && r.ok) { dirty[id] = false; GB.sfx && GB.sfx('ok'); await load(true);
        groupCheck(id, () => GB.post('/api/lights/lay', {id, lay: lay0})); }
      return;
    }
    if (drag && drag.curt) {                                             // ▦ let go: the curtain saves itself (one undo step) and the real lights follow
      const id = drag.curt, d = dev(id); drag = null; svg.style.cursor = '';
      if (d && MOVE[id] && (MOVE[id][0] || MOVE[id][1])) {
        let b = bbox(cpts(d)); const m = SNAP ? magnet(id, b) : null, o = d.orient || {}, from = curState(d);
        if (m) { MOVE[id] = [MOVE[id][0] + m[0], MOVE[id][1] + m[1]]; b = bbox(cpts(d)); }         // 🧲 click into place next to its neighbour
        curtSave(id, {place: [b.x0, b.y0], rot: (o.rot || 0) % 360, flip: !!o.flip}).then(() => groupCheck(id, () => applyCurt(id, from)));
      }
      else { delete MOVE[id]; dirty[id] = false; draw(); }
      return;
    }
    const tap = drag && drag.pan && !drag.moved ? drag.at : null;
    if (drag && !drag.pan) commit();
    if (drag) { drag = null; $('slHint').textContent = ''; svg.style.cursor = ''; }
    if (tap) tapAt(tap);                                                 // a plain click (no drag): pick what's under it, or clear the highlight
  }
  function tapAt([x, y]) {                         // 👆 click a string to pick it (and its strand); click empty space to unselect everything
    let best = null, lim = Math.max(0.8, (view ? Math.min(view.w, view.h) : 20) / 25) ** 2;
    strings().forEach(d => { const lay = LAY[d.id]; if (!lay) return; layPoints(d, lay).forEach((pts, k) => pts.forEach(([px, py]) => {
      const q = (px - x) ** 2 + (py - y) ** 2; if (q < lim && (!best || q < best.q)) best = {id: d.id, k, q}; })); });
    if (DRAW) return;                              // (taps while drawing are handled by the drawing)
    if (best) { sel = best.id; strand = best.k; } else { sel = ''; BULB = false; }
    paintTop(); draw();
  }

  // ---------------- 🧲 SNAP TO JOIN (Oct 18, Graham: "be able to join the curtains... when you put them together, now they're a group.
  //   Right now you gotta place them together and you gotta choose all these things"). Drop a light right next to another and it clicks
  //   into place like a magnet and joins that light's show: one picture across both. Pull it away from its group and it becomes its own
  //   show (Pro). Long-press (or right-click) any light for Join / Split too. Every change comes with an Undo.
  //   Oct 18, take 2 (Graham: "it should just join"): joining MERGES the two shows (no more "add to this, add to that"), a strand laid
  //   as a wall drags from anywhere on its body like a curtain, and the bar under it has ⇋ FLIP IT for a light that comes out backwards.
  const boxOf = d => d.kind === 'grid' ? bbox(cpts(d)) : (LAY[d.id] ? bbox(layPoints(d, LAY[d.id]).flat()) : null);
  const isWallStr = d => d && d.kind === 'string' && LAY[d.id] && (LAY[d.id].wall || LAY[d.id].kind === 'curtain');   // a strand made into a wall or a curtain moves like a curtain
  const solids = () => (ST ? ST.devices.filter(d => d.kind === 'grid' || isWallStr(d)) : []);    // lights with a body you can drag
  const gOf = id => ((ST && ST.groups) || []).find(g => g.devices.includes(id));
  const gapBetween = (a, b) => Math.max(Math.max(a.x0 - b.x1, b.x0 - a.x1) - 1, Math.max(a.y0 - b.y1, b.y0 - a.y1) - 1);   // bulbs between two boxes (0 = side by side, < 0 = overlapping)
  const flush = q => q >= -1 && q <= 0.5;          // side by side (or sharing one row / column), not one laid on top of the other
  const PULL = 2.5, AWAY = 3;
  function magnet(id, b) {                         // -> [dx, dy] that clicks this box flush against the nearest light, or null
    let best = null;
    solids().forEach(o => { if (o.id === id) return; const c = boxOf(o); if (!c || gapBetween(b, c) < -1.5) return;   // laid on top on purpose: leave it
      const ovY = Math.min(b.y1, c.y1) - Math.max(b.y0, c.y0), ovX = Math.min(b.x1, c.x1) - Math.max(b.x0, c.x0), cand = [];
      if (ovY >= 0) [c.x1 + 1 - b.x0, c.x0 - 1 - b.x1].forEach(dx => cand.push([dx, Math.abs(c.y0 - b.y0) <= 2 ? c.y0 - b.y0 : 0]));     // beside it (tops lined up)
      if (ovX >= 0) [c.y1 + 1 - b.y0, c.y0 - 1 - b.y1].forEach(dy => cand.push([Math.abs(c.x0 - b.x0) <= 2 ? c.x0 - b.x0 : 0, dy]));     // above / below it
      cand.forEach(([dx, dy]) => { const q = Math.hypot(dx, dy); if (q <= PULL && q > 0 && (!best || q < best.q)) best = {dx, dy, q}; });
    });
    return best ? [best.dx, best.dy] : null;
  }
  function undoBar(msg, fn, flipId) {
    document.querySelectorAll('.sl-undo').forEach(x => x.remove());
    const bar = document.createElement('div'); bar.className = 'sl-undo';
    bar.innerHTML = `<span>${esc(msg)}</span>${flipId ? '<button class="fl">⇋ FLIP IT</button>' : ''}<button class="un">UNDO</button>`;
    bar.querySelector('.un').onclick = () => { bar.remove(); fn(); };
    if (flipId) bar.querySelector('.fl').onclick = () => flipLight(flipId);
    document.body.appendChild(bar); setTimeout(() => bar.remove(), 12000);
  }
  async function flipLight(id) {                   // ⇋ mirror one light left to right where it sits (a curtain, or a strand wall)
    const d = dev(id); if (!d) return;
    if (d.kind === 'grid') { sel = id; paintTop(); return turn('flip'); }
    const lay = LAY[id]; if (!lay) return; const b = boxOf(d), m = x => b.x0 + b.x1 - x;
    lay.parts.forEach(p => { p.pts = p.pts.map(([x, y]) => [m(x), y]); if (p.pins) Object.keys(p.pins).forEach(k => p.pins[k] = [m(p.pins[k][0]), p.pins[k][1]]); });
    if (lay.wall) lay.gap = -(lay.gap || 1);
    const r = await GB.post('/api/lights/lay', {id, lay}); if (r && r.ok) { GB.toast('⇋ Flipped ' + d.name); dirty[id] = false; await load(true); }
  }
  const proTease = () => GB.toast('✨ Pulling a light off into its own show comes with Pro. Home DJ plays all your lights together.');
  async function regroup(url, body, back) {
    const r = await GB.post(url, body); if (!r || !r.ok || r.same) return;
    GB.sfx && GB.sfx('ok'); setTimeout(() => load(true), r.live ? 1500 : 9000);
    undoBar((url.endsWith('join') ? '🧲 ' : '✂️ ') + (r.msg || 'Groups changed') + '.', async () => {
      await GB.post('/api/lights/regroup', {groups: r.prev || []}); if (back) await back();
      GB.toast('↶ Put back the way it was'); setTimeout(() => load(true), 1500);
    }, url.endsWith('join') ? body.id : null);
  }
  async function groupCheck(id, back) {            // after a drop: clicked against another show? pulled away from its own?
    const d = dev(id), me = d && boxOf(d), g = gOf(id); if (!me || !g) return;
    const mates = g.devices.filter(x => x !== id);
    const near = solids().filter(o => o.id !== id).map(o => [o, gapBetween(me, boxOf(o))]).sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));
    const other = near.find(([o, q]) => flush(q) && !mates.includes(o.id));
    if (other) return regroup('/api/lights/join', {id, to: other[0].id}, back);          // the two shows become one
    if (near.some(([o, q]) => q <= AWAY && mates.includes(o.id))) return;               // still with its own group: nothing changes
    const mb = mates.map(dev).filter(Boolean).map(boxOf).filter(Boolean);
    if (mb.length && mb.every(b => gapBetween(me, b) > AWAY)) return GB.pro === false ? proTease() : regroup('/api/lights/split', {id}, back);
  }
  function groupItems(id) {                        // long-press menu: 🔗 join the show it's touching, ✂️ split into its own show
    const out = [], g = gOf(id), d = dev(id), me = d && boxOf(d); if (!g) return out;
    const mates = g.devices.filter(x => x !== id), seen = new Set();
    if (me) ST.devices.filter(o => o.id !== id && !mates.includes(o.id)).map(o => [o, boxOf(o)]).filter(x => x[1] && gapBetween(me, x[1]) <= 1.5)
      .forEach(([o]) => { const og = gOf(o.id) || {id: o.id, name: o.name}; if (seen.has(og.id)) return; seen.add(og.id);
        out.push(['🔗 Join with ' + og.name, () => regroup('/api/lights/join', {id, to: o.id})]); });
    if (mates.length) out.push(['✂️ Split into its own show', () => GB.pro === false ? proTease() : regroup('/api/lights/split', {id})]);
    if (d) out.push(['⇋ Flip it left to right', () => flipLight(id)]);
    return out;
  }

  // ---------------- 🔍 zoom (wheel, buttons, right-click) and the right-click menu
  function zoomAt(f, at) {
    if (!view) fit(); const [x, y] = at || [view.cx, view.cy];
    const w = Math.max(4, Math.min(600, view.w * f)), g = w / view.w;
    view.cx = x + (view.cx - x) * g; view.cy = y + (view.cy - y) * g; view.w = w; view.h *= g; draw();
  }
  function hideMenu() { const m = $('slMenu'); if (m) m.remove(); }
  function nearestSeg(lay, x, y) {               // the strand + stretch of path closest to (x, y)
    let best = null;
    lay.parts.forEach((p, k) => { if (p.fold && p.fold.rows > 1) return; for (let i = 1; i < p.pts.length; i++) {
      const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i], vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L2)), dx = ax + t * vx - x, dy = ay + t * vy - y, q = dx * dx + dy * dy;
      if (!best || q < best.q) best = {k, i, q}; } });
    return best;
  }
  function onMenu(e) {
    e.preventDefault(); hideMenu();
    const [x, y] = toWorld(e), stage = $('slStage'), sr = stage.getBoundingClientRect(), items = [];
    const h = e.target.closest && e.target.closest('.h');
    let c = e.target.closest && e.target.closest('.c');
    if (!c && !h) { const at = curtainsAt([x, y]); if (at.length) c = {dataset: {id: at.includes(sel) ? sel : at[0]}}; }
    if (!h) {                                       // 👆 on (or right next to) a string: pick it first, so "Add a bend here" is right there
      let best = null; const lim = Math.max(0.8, (view ? Math.min(view.w, view.h) : 20) / 25) ** 2;
      strings().forEach(d => { const L = LAY[d.id]; if (!L) return; layPoints(d, L).forEach((pts, k) => pts.forEach(([px, py]) => { const q = (px - x) ** 2 + (py - y) ** 2; if (q < lim && (!best || q < best.q)) best = {id: d.id, k, q}; })); });
      if (best) { c = null; if (sel !== best.id || strand !== best.k) { sel = best.id; strand = best.k; paintTop(); draw(); } }
    }
    const lay = LAY[sel];
    if (h && lay) { const k = +h.dataset.s, i = +h.dataset.p, pp = lay.parts[k].pts; strand = k;
      if (i > 0 && i < pp.length - 1) items.push(['✖ Remove this bend', () => { pp.splice(i, 1); change(); }]);
      else items.push(['⇄ Flip this strand', () => { lay.parts[k].rev = !lay.parts[k].rev; change(); }]); }
    else if (c) { const id = c.dataset.id; if (sel !== id) { sel = id; paintTop(); draw(); }
      items.push(['🔓 Unlock its drops', () => $('slDrops').click()], ['↻ Turn 90°', () => turn('rot')], ['⇋ Mirror', () => turn('flip')], ...groupItems(id)); }
    else if (lay && lay.kind === 'curtain') { items.push(['✍️ Draw this drop', () => $('slDraw').click()], ['🔒 Lock it back into a curtain', () => $('slStraight').click()]); }
    else if (lay && dev(sel) && dev(sel).kind === 'string') { const ns = nearestSeg(lay, x, y);
      groupItems(sel).forEach(it => items.push(it));
      if (ns) items.push(['＋ Add a bend here', () => { strand = ns.k; lay.parts[ns.k].pts.splice(ns.i, 0, [snap(x), snap(y)]); $('slHint').textContent = 'Bend added: drag it into place'; change(); }]);
      else items.push(['Folded strands bend at their ends only', null]); }
    if (items.length) items.push(null);
    items.push(['🔍 Zoom in here', () => zoomAt(1 / 1.6, [x, y])], ['🔎 Zoom out', () => zoomAt(1.6, [x, y])], ['⤢ Fit everything', () => { zoom = 1; view = null; draw(); }], null,
      [SNAP ? '✋ Turn snap off (free)' : '🧲 Turn snap to grid on', () => { SNAP = !SNAP; try { localStorage.setItem('gb_sl_snap', SNAP ? '1' : '0'); } catch (x2) {} draw(); }]);
    const m = document.createElement('div'); m.className = 'sl-menu'; m.id = 'slMenu';
    items.forEach(it => { if (!it) return m.appendChild(document.createElement('hr')); const b = document.createElement('button'); b.textContent = it[0]; if (!it[1]) b.disabled = true; else b.onclick = ev => { ev.stopPropagation(); hideMenu(); it[1](); }; m.appendChild(b); });
    stage.appendChild(m);
    const mx = Math.min(e.clientX - sr.left, sr.width - m.offsetWidth - 6), my = Math.min(e.clientY - sr.top, sr.height - m.offsetHeight - 6);
    m.style.left = Math.max(4, mx) + 'px'; m.style.top = Math.max(4, my) + 'px';
  }

  // ---------------- 📺 live colours: every bulb shows what it is showing right now (this editor IS the live wall on LIGHTS)
  let PTS = {}, LIVE = false;
  async function loadPts() { try { const L = await GB.get('/api/lights'); PTS = {}; (L.points || []).forEach(p => PTS[p.id] = p); } catch (e) {} }
  function paintLive() {
    if (!svg || GB.page !== 'lights' || document.hidden) return;
    const frs = GB.wallFrames || []; if (!frs.length) { if (LIVE) { LIVE = false; draw(); } return; }
    const pix = {}, strip = {};
    frs.forEach(g => { pix[g.id] = {w: g.w, c: g.occ && GB.occRGB ? GB.occRGB(g) : (g.rgb || '').match(/.{6}/g) || []}; (g.strips || []).forEach(t => strip[t.id] = (t.rgb || '').match(/.{6}/g) || []); });
    LIVE = true;
    svg.querySelectorAll('g.lv').forEach(gr => {
      const id = gr.dataset.d, off = +gr.dataset.o || 0, P = PTS[id], st = strip[id], F = P && pix[P.group] || (P && Object.values(pix)[0]);
      const cs = gr.children;
      for (let j = 0; j < cs.length; j++) {
        const led = off + j; let c = null;
        if (st) c = st[led];
        else if (P && F && led < P.x.length) c = F.c[P.y[led] * F.w + P.x[led]];
        cs[j].setAttribute('fill', !c || c === '000000' ? '#1c1830' : '#' + c);
      }
    });
  }
  setInterval(paintLive, 125);
  // 🔄 Oct 17 (Graham: "I see it on the iPad, not on the laptop"): every screen picks up layout changes saved on another one
  let SIG = '';
  const sigOf = st => JSON.stringify([(st.devices || []).map(d => [d.id, d.kind, d.lay || null, d.pts ? d.pts.length + ':' + (d.pts[0] || []).join(',') : '']), st.groups || []]);
  setInterval(async () => {
    if (!svg || GB.page !== 'lights' || document.hidden || drag || Object.values(dirty).some(Boolean) || Object.keys(MOVE).length) return;
    let st; try { st = await GB.get('/api/lights/stage'); } catch (e) { return; }
    if (!st || !Array.isArray(st.devices)) return;
    const sg = sigOf(st); if (!SIG) { SIG = sg; return; }
    if (sg !== SIG) { SIG = sg; load(true); }
  }, 3000);

  // ---------------- load / save
  async function load(keepView) {
    try { ST = await GB.get('/api/lights/stage'); } catch (e) { return; }
    if (!ST || !Array.isArray(ST.devices)) ST = {devices: []};          // the website demo has no stage
    SIG = sigOf(ST);
    await loadPts();
    strings().forEach(d => { if (!dirty[d.id]) LAY[d.id] = fromSaved(d) || fresh(d, d.n >= 200 ? 2 : 1); });
    Object.keys(MOVE).forEach(id => { if (!dirty[id]) delete MOVE[id]; });
    if (!keepView) view = null;
    LAST = stateNow(); paintUR(); paintBeep();
    paintTop(); draw(); paintAsk(); paintCurtainCard();
  }
  async function placeCurtain(d, extra) {          // ▦ save where a curtain hangs (its top-left), plus a turn / mirror
    const b = bbox(cpts(d)); return GB.post('/api/lights/place', Object.assign({id: d.id, place: [b.x0, b.y0]}, extra || {}));
  }
  async function save() {
    const ids = Object.keys(dirty).filter(id => dirty[id]); if (!ids.length && LAY[sel]) ids.push(sel);
    let ok = 0;
    for (const id of ids) {
      const d = dev(id); if (!d) continue;
      const r = d.kind === 'grid' ? await placeCurtain(d) : (LAY[id] ? await GB.post('/api/lights/lay', {id, lay: LAY[id]}) : null);
      if (r && r.ok) { dirty[id] = false; delete MOVE[id]; ok++; }
    }
    if (ok) { GB.sfx && GB.sfx('ok'); GB.toast('💾 Saved. The live wall now shows your lights where you put them'); await load(true); }
  }
  // Oct 18 (Graham: "when you push 90 degrees, it gets out of phase immediately"): the turn snapped the corner to a whole bulb,
  //   which knocked an overlapping curtain off its half-bulb offset. Now only the move is snapped, the offset stays.
  let TA = null;                                                  // the middle we're turning round (see turn)
  async function turn(extra, steps) {
    const d = dev(sel); if (!d || d.kind !== 'grid') return;
    const o = d.orient || {rot: 0, flip: false}, b = bbox(cpts(d));
    // 🔄 Oct 18 (Graham: "I pushed the 90 degree button four times to get it back and it messed it up"): each turn re-rounded the
    //   middle, so a 10 x 21 curtain crept a column sideways every lap. Turns in a row now spin round the SAME middle, so four turns
    //   put it back exactly where it started.
    let cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    if (TA && TA.id === d.id && Math.abs(TA.cx - cx) <= 1.01 && Math.abs(TA.cy - cy) <= 1.01) { cx = TA.cx; cy = TA.cy; } else TA = {id: d.id, cx, cy};
    let to;
    if (extra === 'rot') { const q = ((steps == null ? 1 : steps) % 4 + 4) % 4; if (!q) return draw();
      const w = b.x1 - b.x0, hh = b.y1 - b.y0, nw = q % 2 ? hh : w, nh = q % 2 ? w : hh;
      to = {place: [Math.round(cx - nw / 2), Math.round(cy - nh / 2)], rot: ((o.rot || 0) + 90 * q) % 360, flip: !!o.flip}; }   // turn around its middle
    else to = {place: [b.x0, b.y0], rot: (o.rot || 0) % 360, flip: !o.flip};
    await curtSave(d.id, to);
  }

  GB.panel('lights', 5, el => {
    el.id = 'slPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="sl-hd"><b>🧵 Lay out your lights</b><span class="r" id="slR2" style="font:700 12px var(--cond);letter-spacing:1px;color:var(--dim)"></span><button class="btn c" id="slDone" style="--c:var(--green)">✓ Done</button></div>
      <div class="ph"><span>🧵 Lay out your lights</span><span class="r" id="slR"></span></div>
      <p class="note">Your wall, live. Drag curtains and each string's <b>START</b> / <b>END</b>. Press and hold (or right-click) for bends, pinch or scroll to zoom. Tap <b>Save</b>.</p>
      <div class="sl-ask sl-cmask" id="slAsk" hidden></div>
      <div class="sl-top" id="slTop"></div>
      <div class="sl-stage" id="slStage"><svg id="slSvg" aria-label="Your lights, laid out"></svg></div>
      <div class="sl-hint" id="slHint"></div>
      <button class="btn c wide sl-go" id="slBig" style="--c:var(--cyan)">✏️ Customize full screen</button>
      <div class="sl-side"><div id="slBeep" hidden><button class="btn c wide" id="slBeepGo" style="--c:var(--amber)">🔔 My lights are beeping</button><div id="slBeepAsk" class="sl-ask" hidden><b>👂 First, is it really the lights?</b> Check for anything else that beeps nearby: dishwasher, oven, fridge door, smoke alarm, a phone. (We once spent a whole night blaming the lights. It was the dishwasher.) <button class="btn c wide" id="slBeepYes" style="--c:var(--amber);margin-top:8px">It's the lights: turn the show down a notch</button></div><p class="note" id="slBeepNote" style="margin:4px 0 0"></p></div><div class="sl-row" id="slUR"><b>Steps</b><div class="seg"><button class="btn" id="slUndo" disabled>↶ Undo</button><button class="btn" id="slRedo" disabled>↷ Redo</button></div></div><div id="slCurt" hidden>
        <p class="note" style="margin:0">Drag it, or twist two fingers to turn. Press and hold to unlock its drops.</p>
        <div class="sl-tools"><button class="btn" id="slRot">↻ Turn</button><button class="btn" id="slMir">⇋ Mirror</button><button class="btn" id="slDrops">🔓 Unlock drops</button><button class="btn c" id="slSaveC" style="--c:var(--green)">💾 Save</button></div>
      </div><div id="slCm" class="sl-cm" hidden></div><div id="slTools">
        <div class="sl-row"><b>Strands</b><div class="seg" id="slStrands"></div></div>
        <div class="sl-row" id="slWhichRow"><b>Laying</b><div class="sl-row" id="slWhich"></div></div>
        <div class="sl-row"><b>Shape</b><div class="seg" id="slFold"></div></div>
        <div class="sl-row" id="slModeRow"><b>Rows go</b><div class="seg" id="slMode"></div></div>
        <div class="sl-row" id="slWallRow" style="display:none"><b>Wall rows</b><div class="seg" id="slWallPick"></div></div>
        <div class="sl-row" id="slCurveRow"><b>Bends</b><div class="seg"><button class="btn" data-cv="0">Sharp corners</button><button class="btn" data-cv="1">💎 Smooth curves</button></div></div>
        <div class="sl-tools">
          <span id="slBendRow" style="display:contents"><button class="btn" id="slBend">＋ Bend</button><button class="btn" id="slUnbend">− Bend</button></span>
          <button class="btn" id="slBulb">✋ Bulbs</button>
          <button class="btn" id="slUnpin">↺ Bulbs</button>
          <button class="btn" id="slFlip">⇄ Flip</button>
          <button class="btn c" id="slDraw" style="--c:var(--pink)">✍️ Draw it</button>
          <button class="btn c" id="slWall" style="--c:var(--amber)">🧱 Wall</button>
          <button class="btn c" id="slBends" style="--c:var(--green)">💡 Bends</button>
          <button class="btn" id="slReset">↺ Start over</button>
          <button class="btn" id="slStraight">🔒 Lock curtain</button>
          <button class="btn c" id="slSave" style="--c:var(--green)">💾 Save</button>
        </div>
      </div>
      <div class="sl-row"><b>Snap</b><div class="seg" id="slSnap"><button class="btn" data-sn="1">🧲 Snap to grid</button><button class="btn" data-sn="0">Free</button></div></div>
      <div class="sl-row sl-zoom"><b>Zoom</b><div class="seg"><button class="btn" id="slZo" aria-label="Zoom out">−</button><button class="btn" id="slFit">Fit</button><button class="btn" id="slZi" aria-label="Zoom in">+</button></div></div></div>`;
    svg = el.querySelector('#slSvg');
    {                                                              // 📋 Oct 18: the light list on the side, the board tools floating on the board
      const side = el.querySelector('.sl-side'), list = document.createElement('div'); list.id = 'slList'; list.className = 'sl-list'; side.prepend(list);
      const ctl = document.createElement('div'); ctl.id = 'slCtl'; side.prepend(ctl);
      const narrow = matchMedia('(max-width: 899px)');
      const place = () => { const st = el.querySelector('#slStage');
        // Oct 18 (Graham: "when you fold it to horizontal they go over to the side and down at the bottom"): every screen gets the
        //   slim row of lights above the board; the picked light's controls fill the side column (or sit under the board when narrow)
        void narrow; list.classList.add('strip'); st.parentNode.insertBefore(list, st);
        paintList(); };
      narrow.addEventListener ? narrow.addEventListener('change', place) : narrow.addListener(place); setTimeout(place, 0);
      const hold = document.createElement('div'); hold.id = 'slHold'; hold.hidden = true; side.appendChild(hold);
      ['slCurt', 'slCm', 'slTools'].forEach(i => hold.appendChild(el.querySelector('#' + i)));
      const fab = document.createElement('div'); fab.className = 'sl-fab';
      const sn = document.createElement('button'); sn.className = 'btn'; sn.id = 'slSnapT'; sn.title = 'Snap to grid'; sn.textContent = '🧲';
      sn.onclick = () => { SNAP = !SNAP; try { localStorage.setItem('gb_sl_snap', SNAP ? '1' : '0'); } catch (x) {} GB.toast(SNAP ? '🧲 Snap on: everything clicks onto bulb spots' : '✋ Snap off: place freely'); draw(); };
      const u = el.querySelector('#slUndo'), r = el.querySelector('#slRedo'), zo = el.querySelector('#slZo'), fi = el.querySelector('#slFit'), zi = el.querySelector('#slZi'), big = el.querySelector('#slBig');
      u.textContent = '↶'; u.title = 'Undo'; r.textContent = '↷'; r.title = 'Redo'; fi.textContent = '⤢'; fi.title = 'Fit everything'; big.textContent = '⛶'; big.title = 'Full screen'; big.className = 'btn';
      const gap = () => { const g = document.createElement('span'); g.className = 'sep'; return g; };
      // 🎬 Oct 18 (Graham: "twist the light show"; "turn the show was malfunctioning before, make sure that button is better"):
      //   the lights stay where they hang, the whole picture turns / mirrors / zooms / slides. Each tap is saved and live at once.
      const tv = document.createElement('button'); tv.className = 'btn'; tv.id = 'slViewBtn'; tv.title = 'Turn the show'; tv.textContent = '🎬';
      const vp = document.createElement('div'); vp.className = 'sl-view'; vp.id = 'slView'; vp.hidden = true;
      vp.innerHTML = `<b>🎬 Turn the show</b><div class="g"><button class="btn" data-vo="ccw">↺ 90°</button><button class="btn" data-vo="cw">↻ 90°</button><button class="btn" data-vo="fx">⇋ Mirror</button><button class="btn" data-vo="fy">⇅ Flip</button></div>
        <div class="g"><button class="btn" data-vo="left">←</button><button class="btn" data-vo="up">↑</button><button class="btn" data-vo="down">↓</button><button class="btn" data-vo="right">→</button></div>
        <div class="g"><button class="btn" data-vo="zout">🔍−</button><button class="btn" data-vo="zin">🔍+</button><button class="btn" data-vo="center">◎ Center</button><button class="btn" data-vo="reset">↺ Reset</button></div><p id="slViewSt">Your lights stay put: only the picture turns.</p>`;
      const vtxt = v => { const t = []; if (v.rot) t.push('turned ' + v.rot + '°'); if (v.fx) t.push('mirrored'); if (v.fy) t.push('flipped'); if (Math.abs(v.zoom - 1) > 0.01) t.push('zoom ' + Math.round(v.zoom * 100) + '%');
        if (v.dx || v.dy) t.push('moved ' + (v.dx ? Math.round(v.dx * 100) + '% ' + (v.dx > 0 ? 'right' : 'left') : '') + (v.dx && v.dy ? ', ' : '') + (v.dy ? Math.round(Math.abs(v.dy) * 100) + '% ' + (v.dy > 0 ? 'down' : 'up') : ''));
        tv.classList.toggle('on', !!t.length); return t.length ? '🎬 Show ' + t.join(' · ') : 'Straight, as it comes. Your lights stay put: only the picture turns.'; };
      tv.onclick = () => { vp.hidden = !vp.hidden; };
      vp.addEventListener('click', async e => { const b = e.target.closest('[data-vo]'); if (!b) return; const r = await GB.post('/api/lights/view', {op: b.dataset.vo});
        if (r && r.view) { $('slViewSt').textContent = vtxt(r.view); GB.sfx && GB.sfx('tap'); } });
      GB.get && GB.get('/api/lights/stage').then(st => { if (st && st.view) $('slViewSt').textContent = vtxt(st.view); }).catch(() => {});
      fab.append(u, r, gap(), sn, tv, gap(), zo, fi, zi, gap(), big); el.querySelector('#slStage').append(fab, vp);
      [el.querySelector('#slUR'), el.querySelector('#slSnap') && el.querySelector('#slSnap').closest('.sl-row'), el.querySelector('.sl-zoom')].forEach(n => n && n.remove());
      const bp = el.querySelector('#slBeep'); if (bp) { const det = document.createElement('details'); det.className = 'sl-beep'; det.innerHTML = '<summary>🔔 Lights beeping?</summary>'; bp.hidden = false; det.appendChild(bp); side.appendChild(det); }
    }
    // 📱 Oct 17 (Graham: "yes, moving things on the iPad"): two fingers pinch to zoom and slide; press and hold opens the menu
    const PT = new Map(); let pinch = null, hold = null;
    const midOf = () => { const a = [...PT.values()]; return [(a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2, Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1]; };
    svg.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') {
        PT.set(e.pointerId, {x: e.clientX, y: e.clientY});
        if (PT.size === 2) {                                   // second finger: stop whatever one finger was doing, start a pinch
          clearTimeout(hold); hold = null;
          const a = [...PT.values()], mid = toWorld({clientX: (a[0].x + a[1].x) / 2, clientY: (a[0].y + a[1].y) / 2});
          const grab = drag && drag.curt ? drag.curt : (curtainsAt(mid).includes(sel) ? sel : null);
          if (grab) {                                          // 🔄 Oct 18 (Graham: "pinch it and twirl it"): twist the curtain, lights stay put until you let go
            if (drag && drag.curt) { delete MOVE[drag.curt]; dirty[drag.curt] = false; }
            drag = null; sel = grab; TWIST = {id: grab, a0: Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x), deg: 0};
            $('slHint').textContent = '🔄 Twist to turn it. Let go and it snaps to the nearest quarter turn'; e.preventDefault(); draw(); return;
          }
          drag = null; if (!view) fit();
          const [mx, my, d] = midOf(), m = svg.getScreenCTM(), r = svg.getBoundingClientRect();
          const pt = svg.createSVGPoint(); pt.x = mx; pt.y = my; const w = pt.matrixTransform(m.inverse());
          pinch = {d0: d, w0: view.w, h0: view.h, k0: m.a, P: [w.x, w.y], cxs: r.left + r.width / 2, cys: r.top + r.height / 2}; e.preventDefault(); return;
        }
        if (PT.size === 1 && !DRAW) { const tgt = e.target, cx = e.clientX, cy = e.clientY;
          clearTimeout(hold); hold = setTimeout(() => { hold = null; if (PT.size !== 1 || (drag && drag.moved2)) return;
            drag = null; onMenu({preventDefault() {}, clientX: cx, clientY: cy, target: tgt}); if (navigator.vibrate) navigator.vibrate(15); }, 550); }
      }
      onDown(e);
    });
    svg.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && PT.has(e.pointerId)) {
        const o = PT.get(e.pointerId); if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > 8 && hold) { clearTimeout(hold); hold = null; }
        if (TWIST) { PT.set(e.pointerId, {x: e.clientX, y: e.clientY}); if (PT.size < 2) return; e.preventDefault();
          const a = [...PT.values()]; let dg = (Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x) - TWIST.a0) * 180 / Math.PI; dg = ((dg + 540) % 360) - 180;
          TWIST.deg = dg; const q = Math.round(dg / 90); $('slHint').textContent = q ? `🔄 Let go to turn it ${Math.abs(q) * 90}° ${q > 0 ? 'clockwise' : 'the other way'}` : '🔄 Keep twisting: it snaps to quarter turns'; return draw(); }
        if (pinch) { PT.set(e.pointerId, {x: e.clientX, y: e.clientY}); if (PT.size < 2) return; e.preventDefault();
          const [mx, my, d] = midOf(), g = pinch.d0 / d, w = Math.max(4, Math.min(600, pinch.w0 * g)), k = pinch.k0 * (pinch.w0 / w);
          view.w = w; view.h = pinch.h0 * (w / pinch.w0); view.cx = pinch.P[0] - (mx - pinch.cxs) / k; view.cy = pinch.P[1] - (my - pinch.cys) / k; return draw(); }
      }
      onMove(e);
    });
    const end = e => { if (e.pointerType === 'touch') { PT.delete(e.pointerId); clearTimeout(hold); hold = null;
        if (TWIST) { if (PT.size < 2) { const t = TWIST, q = Math.round(t.deg / 90); TWIST = null; drag = null; sel = t.id; if (q) turn('rot', q); else { draw(); $('slHint').textContent = ''; } } return; }
        if (pinch) { if (PT.size < 2) pinch = null; drag = null; return; } } onUp(e); };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('contextmenu', onMenu);
    svg.addEventListener('wheel', e => { e.preventDefault(); hideMenu(); zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, toWorld(e)); }, {passive: false});
    document.addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('#slMenu')) hideMenu(); }, true);
    el.querySelector('#slZi').onclick = () => zoomAt(1 / 1.35);
    el.querySelector('#slZo').onclick = () => zoomAt(1.35);
    el.querySelector('#slFit').onclick = () => { zoom = 1; view = null; draw(); };
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.sn) { SNAP = t.dataset.sn === '1'; try { localStorage.setItem('gb_sl_snap', SNAP ? '1' : '0'); } catch (x) {} GB.toast(SNAP ? '🧲 Snap to grid on: everything clicks onto bulb spots' : '✋ Free placement'); return draw(); }
      if (!LAY[sel]) return;
      if (t.dataset.cv) {                       // 💎 smooth curves: GlowBop Pro
        if (t.dataset.cv === '1' && GB.pro === false) { GB.toast('🔒 Smooth, snaky curves are a GlowBop Pro feature'); GB.sfx && GB.sfx('err'); return; }
        LAY[sel].parts[strand].smooth = t.dataset.cv === '1'; return change();
      }
      const d = dev(sel), lay = LAY[sel], p = lay.parts[strand];
      if (t.dataset.ns) {                       // how many strands come off the splitter: re-split, keep the first strand's spot
        const S = +t.dataset.ns; if (S === lay.parts.length) return;
        const keep = lay.parts[0].pts; const f = fresh(d, S); f.parts[0].pts = keep; LAY[sel] = f; strand = 0; view = null; return change();
      }
      if (t.dataset.st) { strand = +t.dataset.st; return draw(); }
      if (t.dataset.fr) { const k = +t.dataset.fr; p.fold = k > 1 ? {rows: k, mode: (p.fold && p.fold.mode) || 'snake'} : null; if (k > 1) p.pts = [p.pts[0], p.pts[p.pts.length - 1]]; return change(); }
      if (t.dataset.md) { if (p.fold) p.fold.mode = t.dataset.md; return change(); }
    });
    el.querySelector('#slBend').onclick = () => { const lay = LAY[sel]; if (!lay) return; const p = lay.parts[strand].pts, a = p[p.length - 2], b = p[p.length - 1];
      p.splice(p.length - 1, 0, [snap((a[0] + b[0]) / 2), snap((a[1] + b[1]) / 2 - 2)]); $('slHint').textContent = 'New bend in the middle of the last stretch: drag it into place'; change(); };
    el.querySelector('#slUnbend').onclick = () => { const lay = LAY[sel]; if (!lay) return; const p = lay.parts[strand].pts; if (p.length > 2) { p.splice(p.length - 2, 1); change(); } else GB.toast('No bends on this strand'); };
    el.querySelector('#slBulb').onclick = () => { BULB = !BULB; $('slHint').textContent = BULB ? 'Tap and drag any bulb of this strand' : ''; draw(); };
    el.querySelector('#slUnpin').onclick = () => { const lay = LAY[sel]; if (!lay) return; delete lay.parts[strand].pins; GB.toast('↺ Every bulb back on its line'); change(); };
    el.querySelector('#slFlip').onclick = () => { const lay = LAY[sel]; if (!lay) return; lay.parts[strand].rev = !lay.parts[strand].rev; GB.toast('⇄ START and END swapped'); change(); };
    el.querySelector('#slReset').onclick = () => { const d = dev(sel); if (!d) return; LAY[sel] = fresh(d, (LAY[sel] && LAY[sel].parts.length) || 1); strand = 0; view = null; change(); };
    el.querySelector('#slBeepGo').onclick = () => { const k = $('slBeepAsk'); k.hidden = !k.hidden; };
    el.querySelector('#slBeepYes').onclick = beep;
    el.querySelector('#slDraw').onclick = () => { const lay = LAY[sel]; if (!lay) return;
      if (DRAW) { DRAW = null; $('slDraw').textContent = '✍️ Draw it'; $('slHint').textContent = 'Drawing done. Drag any bend to fine-tune, then Save.'; return draw(); }
      if (lay.wall) { GB.toast('Tap ✕ Not a wall first, then draw'); return; }
      BULB = false; DRAW = {k: strand, placed: []}; $('slDraw').textContent = '✓ Done drawing'; drawHint(); draw(); };
    el.querySelector('#slBends').onclick = () => showBends(!BENDS);
    el.querySelector('#slUndo').onclick = undo; el.querySelector('#slRedo').onclick = redo;
    window.addEventListener('keydown', e => {                       // ⌨️ Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z or Ctrl+Y redo (LIGHTS page only, not while typing)
      if (GB.page !== 'lights' || !(e.ctrlKey || e.metaKey) || (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) return;
      const k = e.key.toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); } });
    el.querySelector('#slSave').onclick = save; el.querySelector('#slSaveC').onclick = save;
    el.querySelector('#slDrops').onclick = () => {                 // 〰️ a curtain is a row of drops: each one becomes a strand you can bend (💎 Pro)
      if (GB.pro === false) { GB.toast('🔒 Bending curtain drops is a GlowBop Pro feature'); GB.sfx && GB.sfx('err'); return; }
      const d = dev(sel); if (!d || d.kind !== 'grid') return;
      const pts = cpts(d), parts = []; let run = [pts[0]];
      for (let i = 1; i <= pts.length; i++) {
        const p = pts[i], q = pts[i - 1];
        if (p && Math.abs(p[0] - q[0]) < 0.01 && Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.6) { run.push(p); continue; }
        parts.push({pts: [run[0].slice(), run[run.length - 1].slice()], n: run.length, rev: false, fold: null}); run = p ? [p] : [];
      }
      d.kind = 'string'; d.curtain = true; delete MOVE[d.id]; LAY[d.id] = {parts, gap: 1, kind: 'curtain'}; strand = 0;
      GB.toast('〰️ ' + parts.length + ' drops: tap one, drag its ends or press and hold to bend it. Save when done.'); paintTop(); change(); };
    el.querySelector('#slStraight').onclick = async () => { const d = dev(sel); if (!d) return;
      if (!d.lay) { delete LAY[d.id]; dirty[d.id] = false; GB.toast('🔒 Locked back into a curtain'); await load(true); return; }   // only unlocked on screen: nothing saved to undo
      const r = await GB.post('/api/lights/lay', {id: d.id, lay: null}); if (r && r.ok) { dirty[d.id] = false; delete LAY[d.id]; GB.toast('▦ Back to a straight curtain'); await load(true); } };
    // 🧱 Oct 17 (Graham: "make a string a wall: bend it back and forth and staple it"): the whole string snakes into rows, strand by strand
    el.querySelector('#slWall').onclick = () => {
      const row = $('slWallRow'), d = dev(sel), lay = LAY[sel]; if (!d || !lay) return;
      if (row.style.display !== 'none' && !lay.wall) { row.style.display = 'none'; return; }
      wallPicker(lay); row.style.display = ''; $('slHint').textContent = 'Match your curtains, make the biggest even wall, or pick the rows with − / +';
    };
    el.querySelector('#slWallPick').addEventListener('click', e => {
      const b = e.target.closest('[data-wr]'); if (!b) return; const lay = LAY[sel], d = dev(sel); if (!lay || !d) return;
      const v = b.dataset.wr, N = d.n;
      if (v === 'off') { LAY[sel] = fresh(d, lay.parts.length); strand = 0; $('slWallRow').style.display = 'none'; $('slHint').textContent = 'Back to plain strands'; return change(); }
      const a0 = lay.parts[0].pts[0], z0 = lay.parts[0].pts[lay.parts[0].pts.length - 1];
      const place = (R, a, pitch) => { const P = Math.ceil(N / R); lay.wall = R; lay.gap = 1; lay.parts[0].pts = [a, [a[0] + (P - 1) * pitch, a[1]]]; lay.parts.forEach(p => { p.smooth = false; delete p.pins; p.rev = false; }); wallSync(lay); return P; };
      let R, P;
      if (v === 'match') {                         // 🟰 Oct 17 (Graham: "if you have a main curtain, create a grid with your lights that's the same"):
        //   DROPS like a curtain, top to bottom then back up, as tall as the main (tallest) curtain, one bulb per curtain spot, right beside it.
        //   Extra spots at the end of the last drop stay dark.
        const cb = curtainBox(), h = cb ? cb.h : 21, a = cb ? [cb.x1 + 1, cb.y0] : a0.slice();
        R = Math.ceil(N / h); lay.wall = R; lay.gap = -1; lay.parts[0].pts = [a, [a[0], a[1] + h - 1]];
        lay.parts.forEach(p => { p.smooth = false; delete p.pins; p.rev = false; }); wallSync(lay); P = h;
        const short = R * h - N;
        $('slHint').textContent = `🟰 Matches your curtains: ${R} drops of ${h}, same bulb spacing, right beside them. Hang it top-down, snaking back and forth${short ? ` (the last drop is ${h - short} bulbs)` : ''}.`;
      } else if (v === 'big') {                    // ⬛ the biggest even wall: rows that divide the string evenly, as square as possible
        const sq = Math.sqrt(N); let best = 0; for (let r = 2; r <= sq; r++) if (N % r === 0) best = r;
        R = best >= sq / 2 ? best : Math.max(2, Math.round(sq)); P = place(R, lay.wall ? a0.slice() : a0.slice(), 1);
        $('slHint').textContent = `⬛ ${R} rows of ${P}${N % R ? ' (last row a little short)' : ', every row full'}, at curtain bulb spacing.`;
      } else {                                     // − / + one row, keeping the bulb spacing
        const cur = lay.wall || 2, Pc = Math.ceil(N / cur), pitch = Math.hypot(z0[0] - a0[0], z0[1] - a0[1]) / Math.max(1, Pc - 1) || 1;
        R = Math.max(2, Math.min(Math.floor(N / 2), cur + (+v))); P = place(R, a0.slice(), pitch);
        $('slHint').textContent = `🧱 ${R} rows of ${P}`;
      }
      wallPicker(lay); change();
    });
    el.querySelector('#slRot').onclick = () => turn('rot'); el.querySelector('#slMir').onclick = () => turn('flip');
    const home = {p: null, n: null};
    const full = on => { el.classList.toggle('sl-full', on); document.body.classList.toggle('sl-open', on); view = null; setTimeout(draw, 30);
      if (!on && home.p) { home.p.insertBefore(el, home.n); home.p = null; }        // 🗺️ live map drawer closed: the editor goes back to LIGHTS
      if (on) history.pushState && history.pushState({sl: 1}, ''); };
    // 🗺️ Oct 17 (Graham): Pro gets LIVE MAPPING on PRO DJ, PRO HOME and PRO ART: the same editor opens over the page while the show
    //   keeps playing on the wall. Home maps in LIGHTS only.
    GB.slLive = async () => { if (el.classList.contains('sl-full')) return;
      if (GB.page !== 'lights') { home.p = el.parentNode; home.n = el.nextSibling; document.body.appendChild(el); }
      await load(true); full(true); $('slHint').textContent = '🗺️ Live map: drag your lights while the show plays. Tap ✓ Done to save and go back.'; };
    el.querySelector('#slBig').onclick = () => full(true);
    el.querySelector('#slDone').onclick = async () => { if (Object.values(dirty).some(Boolean)) await save(); full(false); };
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && el.classList.contains('sl-full')) full(false); });
    window.addEventListener('popstate', () => { if (el.classList.contains('sl-full')) full(false); });
  });
  GB.on('page', id => { if (id === 'lights') setTimeout(() => load(false), 80); });
  // 🧩 Oct 17 (Graham: "combine all these little boxes into one"): the other layout tools fold into this panel
  function foldIn() {
    const host = $('slPanel'); if (!host || host.dataset.folded) return; host.dataset.folded = '1';
    [['layoutPanel', '🗺️ Canvas & shape'], ['lineupPanel', '🧭 Line up my curtains'], ['drawPanel', '🏠 Draw on a photo (house, stage)'], ['camPanel', '📷 Map with camera']].forEach(([id, t]) => {
      const p = $(id); if (!p) return;
      const det = document.createElement('details'); det.className = 'sl-more'; det.style.setProperty('--c', getComputedStyle(p).getPropertyValue('--c') || 'var(--cyan)');
      det.innerHTML = `<summary>${t}</summary>`; p.classList.remove('box'); p.classList.add('sl-sub'); det.appendChild(p); host.appendChild(det);
    });
  }
  // 📐 the LIGHTS page: the editor is the big box (two-thirds wide on a laptop / iPad, full width on phones), everything else beside / below it
  if (GB.layTPL) GB.layTPL.lights = {wide: [[0, 48, ['#slPanel']]], tall: [[0, 48, ['#slPanel']]]};   // the editor takes the whole width; the rest stack underneath
  function freshLayout() {                         // once: drop any automatic LIGHTS layout made before the editor led the page (hand-made ones stay)
    try {
      if (localStorage.getItem('gb_sl_lay') === '3') return; localStorage.setItem('gb_sl_lay', '3');
      const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('gb_lay3:lights:') && !k.endsWith(':auto')) ks.push(k); }
      ks.forEach(k => { const a = localStorage.getItem(k + ':auto'); if (a === '1' || a === '2' || a === null) { localStorage.removeItem(k); localStorage.removeItem(k + ':auto'); GB.layPut && (GB.layPut(k, ''), GB.layPut(k + ':auto', '')); } });
    } catch (e) {}
  }
  GB.on('ready', () => { foldIn(); freshLayout(); if (GB.page === 'lights') { load(false); GB.proDJ && setTimeout(() => GB.proDJ.relayout(), 300); } });
  window.addEventListener('resize', () => { if (GB.page === 'lights' && ST) draw(); });
  GB.stringLay = {layOne, reload: load};
})();
