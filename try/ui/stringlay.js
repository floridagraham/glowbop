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
  .sl-top .chip { min-height:40px; }
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
  .sl-full .sl-top { grid-column:1; grid-row:2; }
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
  `);

  let ST = null, sel = '', strand = 0, BULB = false, LAY = {}, dirty = {}, svg = null, view = null, zoom = 1, drag = null, lastPick = 0, MOVE = {};
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
  function layPoints(d, lay) {
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
    let ci = 0;
    ST.devices.forEach(d => {
      if (d.kind !== 'grid') return; const col = CCOL[ci++ % CCOL.length], on = d.id === sel, pts = cpts(d), b = bbox(pts);
      h += `<g class="lv" data-d="${esc(d.id)}" data-o="0" opacity="${on ? 1 : 0.85}">${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${col}"/>`).join('')}</g>`;
      h += `<rect class="c" data-id="${esc(d.id)}" x="${b.x0 - 0.6}" y="${b.y0 - 0.6}" width="${b.x1 - b.x0 + 1.2}" height="${b.y1 - b.y0 + 1.2}" rx="0.6" fill="${col}" fill-opacity="${on ? 0.12 : 0.02}" stroke="${col}" stroke-width="${on ? HR * 0.12 : HR * 0.05}" stroke-dasharray="${on ? 'none' : HR * 0.3}" style="cursor:move"/>`;
      h += `<text x="${b.x0}" y="${b.y0 - 0.9}" font-size="${HR * 0.9}" fill="${col}" font-family="Saira Condensed, system-ui" font-weight="700" pointer-events="none">${esc(d.name)}${on ? '  ✥ drag to move' : ''}</text>`;
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
        const off = partCounts(d, lay).slice(0, k).reduce((a, b) => a + b, 0);
        h += `<g class="lv" data-d="${esc(d.id)}" data-o="${off}" opacity="${on ? (act ? 1 : 0.85) : 0.7}">${pts.map(([x, y], i) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${i === 0 ? Math.max(big * 1.8, 0.3) : big}" fill="${col}"${pins[i] ? ` stroke="#fff" stroke-width="0.08"` : ''}/>`).join('')}</g>`;
        if (on && !BULB && (act || lay.parts.length <= 4)) {      // many drops / strands: only the one you're laying shows its handles
          const pp = lay.parts[k].pts;
          h += `<polyline points="${(lay.parts[k].smooth && !(lay.parts[k].fold && lay.parts[k].fold.rows > 1) ? smoothPath(pp) : pp).map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${HR * 0.1}" stroke-dasharray="${HR * 0.35} ${HR * 0.2}" opacity="${act ? 0.85 : 0.35}"/>`;
          pp.forEach((p, i) => {
            const end = i === 0 || i === pp.length - 1, lbl = i === 0 ? (lay.parts[k].rev ? 'END' : 'START') : (i === pp.length - 1 ? (lay.parts[k].rev ? 'START' : 'END') : '');
            h += `<g class="h" data-s="${k}" data-p="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="${end ? HR : HR * 0.75}" fill="${act ? col : '#000'}" fill-opacity="${act ? 0.18 : 0.4}" stroke="${col}" stroke-width="${HR * 0.15}"/>`
              + (lbl ? `<text x="${p[0]}" y="${p[1] - HR * 1.3}" font-size="${HR * 0.8}" fill="${col}" text-anchor="middle" font-family="Saira Condensed, system-ui" font-weight="800" letter-spacing="0.05">${lbl}${lay.parts.length > 1 ? ' ' + (k + 1) : ''}</text>` : '') + `</g>`;
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
    box.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { sel = b.dataset.sl; strand = 0; paintTop(); draw(); });
  }
  function paintTools() {
    document.querySelectorAll('#slSnap [data-sn]').forEach(b => b.classList.toggle('on', (b.dataset.sn === '1') === SNAP));
    const d = dev(sel), lay = d && LAY[sel], box = $('slTools'), cb = $('slCurt'); if (!box) return;
    const isC = !!(d && d.kind === 'grid'); cb.hidden = !isC;
    if (!d) { box.hidden = true; $('slR').textContent = $('slR2').textContent = ''; $('slHint').textContent = $('slHint').textContent || 'Click a curtain or a string to edit it'; return; }
    if (isC) { $('slDrops').textContent = GB.pro === false ? '🔒 Bend its drops · PRO' : '〰️ Bend its drops'; box.hidden = true; $('slR').textContent = $('slR2').textContent = Object.keys(MOVE).length ? 'NOT SAVED' : 'CURTAIN'; return; }
    if (!d || !lay) { box.hidden = true; return; } box.hidden = false;
    if (strand >= lay.parts.length) strand = 0;
    const p = lay.parts[strand], cs = partCounts(d, lay), fr = p.fold ? p.fold.rows : 1;
    const isCur = lay.kind === 'curtain'; $('slStraight').style.display = isCur ? '' : 'none'; $('slReset').style.display = isCur ? 'none' : '';
    $('slStrands').closest('.sl-row').style.display = isCur ? 'none' : ''; $('slFold').closest('.sl-row').style.display = isCur ? 'none' : '';
    $('slStrands').innerHTML = [1, 2, 3, 4].map(k => `<button class="btn${lay.parts.length === k ? ' on' : ''}" data-ns="${k}">${k}</button>`).join('');
    $('slWhich').innerHTML = lay.parts.length > 1 ? lay.parts.map((q, k) => `<button class="chip${k === strand ? ' on' : ''}" data-st="${k}" style="--c:${SCOL[k % SCOL.length]}">${isCur ? 'Drop' : 'Strand'} ${k + 1}${isCur ? '' : ' · ' + cs[k]}</button>`).join('') : '';
    $('slWhichRow').style.display = lay.parts.length < 2 ? 'none' : '';
    $('slFold').innerHTML = [[1, 'Line'], [2, '2 rows'], [3, '3 rows'], [4, '4 rows'], [6, '6 rows'], [8, '8 rows']].map(([k, t]) => `<button class="btn${fr === k ? ' on' : ''}" data-fr="${k}">${t}</button>`).join('');
    $('slModeRow').style.display = fr < 2 ? 'none' : '';
    $('slMode').innerHTML = [['snake', 'Back & forth'], ['alt', 'Every other bulb']].map(([m, t]) => `<button class="btn${p.fold && p.fold.mode === m ? ' on' : ''}" data-md="${m}">${t}</button>`).join('');
    $('slBendRow').style.display = fr > 1 ? 'none' : 'contents';
    $('slCurveRow').style.display = fr > 1 ? 'none' : '';
    $('slBulb').classList.toggle('on', BULB); $('slBulb').textContent = BULB ? '✋ Moving bulbs: tap to stop' : '✋ Move single bulbs';
    $('slUnpin').style.display = Object.keys(p.pins || {}).length ? '' : 'none';
    $('slCurveRow').querySelectorAll('[data-cv]').forEach(b => { b.classList.toggle('on', !!p.smooth === (b.dataset.cv === '1')); if (b.dataset.cv === '1') b.innerHTML = GB.pro === false ? '🔒 Smooth curves · PRO' : '💎 Smooth curves'; });
    $('slSave').classList.toggle('pulse', !!dirty[sel]);
    $('slR').textContent = $('slR2').textContent = d.lay ? (dirty[sel] ? 'NOT SAVED' : 'LAID OUT') : (dirty[sel] ? 'NOT SAVED' : 'A PLAIN LINE');
  }
  function change() { dirty[sel] = true; view = view || null; commit(); draw(); }
  // ↶↷ undo / redo (Oct 17, Graham): every drag, bend, fold, flip and move is one step
  let HIST = [], FUT = [], LAST = null;
  const stateNow = () => JSON.stringify({LAY, MOVE});
  function commit() { const cur = stateNow(); if (LAST !== null && cur !== LAST) { HIST.push(LAST); if (HIST.length > 80) HIST.shift(); FUT = []; } LAST = cur; paintUR(); }
  function restore(st) { const o = JSON.parse(st); LAY = o.LAY || {}; MOVE = o.MOVE || {}; LAST = st;
    Object.keys(LAY).forEach(id => dirty[id] = true); Object.keys(MOVE).forEach(id => dirty[id] = true); draw(); paintUR(); }
  function undo() { if (!HIST.length) return GB.toast('Nothing to undo'); FUT.push(LAST); restore(HIST.pop()); GB.toast('↶ Undone'); }
  function redo() { if (!FUT.length) return GB.toast('Nothing to redo'); HIST.push(LAST); restore(FUT.pop()); GB.toast('↷ Redone'); }
  // 🔔 Oct 17: tap when a light's power box beeps: GlowBop logs the moment (beeps.jsonl) and turns that light's power down a notch
  function paintBeep() {
    const box = $('slBeep'), lim = (ST && ST.limits) || []; if (!box) return; box.hidden = !lim.length;
    $('slBeepNote').innerHTML = lim.map(l => `${esc(l.name)}: power ${Math.round(l.power * 100)}% <a href="#" data-pw="${esc(l.id)}">Reset</a>`).join(' · ') + (lim.length ? '<br>Each tap saves what was happening and turns it down a notch (at most once every 2 minutes).' : '');
    box.querySelectorAll('[data-pw]').forEach(a => a.onclick = async e => { e.preventDefault(); if (await GB.post('/api/lights/power', {id: a.dataset.pw, power: 0.12})) { GB.toast('↺ Power back to normal (12%)'); load(true); } });
  }
  async function beep() {
    const r = await GB.post('/api/lights/beep', {}); if (!r) return;
    const L = r.lights || [], down = L.filter(l => l.after < l.before);
    if (down.length) GB.toast('🔔 Got it. Turned it down: ' + down.map(l => `${l.name} ${Math.round(l.before * 100)}% → ${Math.round(l.after * 100)}%`).join(', ') + '. Give it a couple of minutes.');
    else if (L.some(l => l.floor)) GB.toast('🔔 Noted. It is already as low as it goes (5%). If it still beeps, check the power box and plug.');
    else if (L.some(l => l.waiting)) GB.toast('🔔 Noted. Already turned down just now, give it a minute. Tap again if it still beeps after that.');
    else GB.toast('🔔 Noted');
    GB.sfx && GB.sfx('ok'); load(true);
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
  function blink(d, lay, k, i) { const now = Date.now(); if (now - lastPick < 220) return; lastPick = now; GB.post('/api/lights/pick', {id: d.id, i: bulbAt(d, lay, k, i), secs: 1.2}); }
  function onDown(e) {
    hideMenu(); if (e.button === 2) return;
    const c = e.target.closest && e.target.closest('.c');
    if (c && !(e.target.closest('.h'))) {                               // ▦ grab a curtain anywhere and move it
      e.preventDefault(); const id = c.dataset.id; if (sel !== id) { sel = id; paintTop(); }
      drag = {curt: id, at: toWorld(e), from: (MOVE[id] || [0, 0]).slice()}; try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      $('slHint').textContent = 'Drag the curtain to where it really hangs'; draw(); return;
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
  function onMove(e) {
    if (!drag) return; e.preventDefault();
    if (drag.pan) { if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true; if (!drag.moved) return; view.cx = drag.cx - (e.clientX - drag.sx) / drag.k; view.cy = drag.cy - (e.clientY - drag.sy) / drag.k; return draw(); }
    if (drag.bulb !== undefined) { const [x, y] = toWorld(e), p = LAY[sel].parts[strand]; p.pins = p.pins || {}; p.pins[drag.bulb] = [snap(x), snap(y)]; dirty[sel] = true;
      const now = Date.now(); if (now - lastPick > 300) { lastPick = now; GB.post('/api/lights/pick', {id: sel, i: drag.real, secs: 1.2}); } return draw(); }
    if (drag.curt) { const [x, y] = toWorld(e); MOVE[drag.curt] = [snap(drag.from[0] + x - drag.at[0]), snap(drag.from[1] + y - drag.at[1])]; dirty[drag.curt] = true; return draw(); }
    const [x, y] = toWorld(e), lay = LAY[sel], p = lay.parts[drag.k].pts;
    p[drag.i] = [snap(x), snap(y)]; dirty[sel] = true; draw(); blink(dev(sel), lay, drag.k, drag.i);
  }
  function onUp() {
    const tap = drag && drag.pan && !drag.moved ? drag.at : null;
    if (drag && !drag.pan) commit();
    if (drag) { drag = null; $('slHint').textContent = ''; svg.style.cursor = ''; }
    if (tap) tapAt(tap);                                                 // a plain click (no drag): pick what's under it, or clear the highlight
  }
  function tapAt([x, y]) {                         // 👆 click a string to pick it (and its strand); click empty space to unselect everything
    let best = null, lim = Math.max(0.8, (view ? Math.min(view.w, view.h) : 20) / 25) ** 2;
    strings().forEach(d => { const lay = LAY[d.id]; if (!lay) return; layPoints(d, lay).forEach((pts, k) => pts.forEach(([px, py]) => {
      const q = (px - x) ** 2 + (py - y) ** 2; if (q < lim && (!best || q < best.q)) best = {id: d.id, k, q}; })); });
    if (best) { sel = best.id; strand = best.k; } else { sel = ''; BULB = false; }
    paintTop(); draw();
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
      items.push(['↻ Turn 90°', () => turn('rot')], ['⇋ Mirror', () => turn('flip')]); }
    else if (lay && dev(sel) && dev(sel).kind === 'string') { const ns = nearestSeg(lay, x, y);
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

  // ---------------- load / save
  async function load(keepView) {
    try { ST = await GB.get('/api/lights/stage'); } catch (e) { return; }
    if (!ST || !Array.isArray(ST.devices)) ST = {devices: []};          // the website demo has no stage
    await loadPts();
    strings().forEach(d => { if (!dirty[d.id]) LAY[d.id] = fromSaved(d) || fresh(d, d.n >= 200 ? 2 : 1); });
    Object.keys(MOVE).forEach(id => { if (!dirty[id]) delete MOVE[id]; });
    if (!keepView) view = null;
    LAST = stateNow(); paintUR(); paintBeep();
    paintTop(); draw();
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
  async function turn(extra) {
    const d = dev(sel); if (!d || d.kind !== 'grid') return;
    const o = d.orient || {rot: 0, flip: false}, b = bbox(cpts(d)), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    let body = {};
    if (extra === 'rot') { const w = b.x1 - b.x0, hh = b.y1 - b.y0; body = {rot: ((o.rot || 0) + 90) % 360, place: [snap(cx - hh / 2), snap(cy - w / 2)]}; }   // turn around its middle
    else body = {flip: !o.flip, place: [b.x0, b.y0]};
    const r = await GB.post('/api/lights/place', Object.assign({id: d.id}, body));
    if (r && r.ok) { dirty[d.id] = false; delete MOVE[d.id]; await load(true); }
  }

  GB.panel('lights', 5, el => {
    el.id = 'slPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="sl-hd"><b>🧵 Lay out your lights</b><span class="r" id="slR2" style="font:700 12px var(--cond);letter-spacing:1px;color:var(--dim)"></span><button class="btn c" id="slDone" style="--c:var(--green)">✓ Done</button></div>
      <div class="ph"><span>🧵 Lay out your lights</span><span class="r" id="slR"></span></div>
      <p class="note">Your wall, live. Drag curtains and each string's <b>START</b> / <b>END</b>. Press and hold (or right-click) for bends, pinch or scroll to zoom. Tap <b>Save</b>.</p>
      <div class="sl-top" id="slTop"></div>
      <div class="sl-stage" id="slStage"><svg id="slSvg" aria-label="Your lights, laid out"></svg></div>
      <div class="sl-hint" id="slHint"></div>
      <button class="btn c wide sl-go" id="slBig" style="--c:var(--cyan)">✏️ Customize full screen</button>
      <div class="sl-side"><div id="slBeep" hidden><button class="btn c wide" id="slBeepGo" style="--c:var(--amber)">🔔 My lights are beeping</button><p class="note" id="slBeepNote" style="margin:4px 0 0"></p></div><div class="sl-row" id="slUR"><b>Steps</b><div class="seg"><button class="btn" id="slUndo" disabled>↶ Undo</button><button class="btn" id="slRedo" disabled>↷ Redo</button></div></div><div id="slCurt" hidden>
        <p class="note">Drag the curtain to where it hangs. Turn or mirror it if its lights run another way.</p>
        <div class="sl-tools"><button class="btn" id="slRot">↻ Turn 90°</button><button class="btn" id="slMir">⇋ Mirror</button><button class="btn" id="slDrops">〰️ Bend its drops</button><button class="btn c" id="slSaveC" style="--c:var(--green)">💾 Save</button></div>
      </div><div id="slTools">
        <div class="sl-row"><b>Strands</b><div class="seg" id="slStrands"></div></div>
        <div class="sl-row" id="slWhichRow"><b>Laying</b><div class="sl-row" id="slWhich"></div></div>
        <div class="sl-row"><b>Shape</b><div class="seg" id="slFold"></div></div>
        <div class="sl-row" id="slModeRow"><b>Rows go</b><div class="seg" id="slMode"></div></div>
        <div class="sl-row" id="slCurveRow"><b>Bends</b><div class="seg"><button class="btn" data-cv="0">Sharp corners</button><button class="btn" data-cv="1">💎 Smooth curves</button></div></div>
        <div class="sl-tools">
          <span id="slBendRow" style="display:contents"><button class="btn" id="slBend">＋ Add a bend</button><button class="btn" id="slUnbend">− Remove bend</button></span>
          <button class="btn" id="slBulb">✋ Move single bulbs</button>
          <button class="btn" id="slUnpin">↺ Reset bulbs</button>
          <button class="btn" id="slFlip">⇄ Flip direction</button>
          <button class="btn" id="slReset">↺ Start over</button>
          <button class="btn" id="slStraight">▦ Straight curtain again</button>
          <button class="btn c" id="slSave" style="--c:var(--green)">💾 Save</button>
        </div>
      </div>
      <div class="sl-row"><b>Snap</b><div class="seg" id="slSnap"><button class="btn" data-sn="1">🧲 Snap to grid</button><button class="btn" data-sn="0">Free</button></div></div>
      <div class="sl-row sl-zoom"><b>Zoom</b><div class="seg"><button class="btn" id="slZo" aria-label="Zoom out">−</button><button class="btn" id="slFit">Fit</button><button class="btn" id="slZi" aria-label="Zoom in">+</button></div></div></div>`;
    svg = el.querySelector('#slSvg');
    // 📱 Oct 17 (Graham: "yes, moving things on the iPad"): two fingers pinch to zoom and slide; press and hold opens the menu
    const PT = new Map(); let pinch = null, hold = null;
    const midOf = () => { const a = [...PT.values()]; return [(a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2, Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1]; };
    svg.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') {
        PT.set(e.pointerId, {x: e.clientX, y: e.clientY});
        if (PT.size === 2) {                                   // second finger: stop whatever one finger was doing, start a pinch
          clearTimeout(hold); hold = null; drag = null; if (!view) fit();
          const [mx, my, d] = midOf(), m = svg.getScreenCTM(), r = svg.getBoundingClientRect();
          const pt = svg.createSVGPoint(); pt.x = mx; pt.y = my; const w = pt.matrixTransform(m.inverse());
          pinch = {d0: d, w0: view.w, h0: view.h, k0: m.a, P: [w.x, w.y], cxs: r.left + r.width / 2, cys: r.top + r.height / 2}; e.preventDefault(); return;
        }
        if (PT.size === 1) { const tgt = e.target, cx = e.clientX, cy = e.clientY;
          clearTimeout(hold); hold = setTimeout(() => { hold = null; if (PT.size !== 1 || (drag && drag.moved2)) return;
            drag = null; onMenu({preventDefault() {}, clientX: cx, clientY: cy, target: tgt}); if (navigator.vibrate) navigator.vibrate(15); }, 550); }
      }
      onDown(e);
    });
    svg.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' && PT.has(e.pointerId)) {
        const o = PT.get(e.pointerId); if (Math.hypot(e.clientX - o.x, e.clientY - o.y) > 8 && hold) { clearTimeout(hold); hold = null; }
        if (pinch) { PT.set(e.pointerId, {x: e.clientX, y: e.clientY}); if (PT.size < 2) return; e.preventDefault();
          const [mx, my, d] = midOf(), g = pinch.d0 / d, w = Math.max(4, Math.min(600, pinch.w0 * g)), k = pinch.k0 * (pinch.w0 / w);
          view.w = w; view.h = pinch.h0 * (w / pinch.w0); view.cx = pinch.P[0] - (mx - pinch.cxs) / k; view.cy = pinch.P[1] - (my - pinch.cys) / k; return draw(); }
      }
      onMove(e);
    });
    const end = e => { if (e.pointerType === 'touch') { PT.delete(e.pointerId); clearTimeout(hold); hold = null; if (pinch) { if (PT.size < 2) pinch = null; drag = null; return; } } onUp(e); };
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
    el.querySelector('#slBeepGo').onclick = beep;
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
      const r = await GB.post('/api/lights/lay', {id: d.id, lay: null}); if (r && r.ok) { dirty[d.id] = false; delete LAY[d.id]; GB.toast('▦ Back to a straight curtain'); await load(true); } };
    el.querySelector('#slRot').onclick = () => turn('rot'); el.querySelector('#slMir').onclick = () => turn('flip');
    const full = on => { el.classList.toggle('sl-full', on); document.body.classList.toggle('sl-open', on); view = null; setTimeout(draw, 30);
      if (on) history.pushState && history.pushState({sl: 1}, ''); };
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
