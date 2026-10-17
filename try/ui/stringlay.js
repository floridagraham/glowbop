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
  .sl-stage { position:relative; height:min(56vh, 480px); min-height:260px; border-radius:0 14px 0 14px; background:#06050c; border:1px solid var(--line); overflow:hidden; touch-action:none; }
  .sl-stage svg { position:absolute; inset:0; width:100%; height:100%; display:block; touch-action:none; user-select:none; -webkit-user-select:none; }
  .sl-stage .h { cursor:grab; }
  .sl-zoom .btn { min-width:52px; }
  .sl-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .sl-row > b { font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--dim); min-width:74px; }
  .sl-row .btn, .sl-row .chip { min-height:44px; }
  .sl-tools { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 130px), 1fr)); gap:6px; }
  .sl-tools .btn { min-height:48px; }
  .sl-hint { font:600 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:var(--cyan); min-height:1.3em; }
  `);

  let ST = null, sel = '', strand = 0, LAY = {}, dirty = {}, svg = null, view = null, zoom = 1, drag = null, lastPick = 0;
  const strings = () => (ST ? ST.devices.filter(d => d.kind === 'string') : []);
  const dev = id => (ST ? ST.devices.find(d => d.id === id) : null);

  // ---------------- maths: the same as lights.py _lay_one / lay_points
  function layOne(n, pts, fold, gap, rev) {
    n = Math.max(1, n | 0); pts = (pts && pts.length >= 2) ? pts : [[0, 0], [Math.max(1, n - 1), 0]];
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
    return rev ? out.reverse() : out;
  }
  function partCounts(d, lay) { const out = []; let left = d.n; lay.parts.forEach((p, k) => { const c = k === lay.parts.length - 1 ? left : Math.max(0, Math.min(left, p.n | 0)); out.push(c); left -= c; }); return out; }
  function layPoints(d, lay) {
    const cs = partCounts(d, lay), res = [];
    lay.parts.forEach((p, k) => { if (cs[k] > 0) res.push(layOne(cs[k], p.pts, p.fold, lay.gap || 1, p.rev)); });
    return res;                                    // [[x, y] per bulb] per strand
  }

  // ---------------- a fresh layout for a string: under everything else, split into strands
  function bounds(skip) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ST.devices.forEach(d => {
      if (d.id === skip) return;
      const pts = d.kind === 'grid' ? d.pts : (LAY[d.id] ? layPoints(d, LAY[d.id]).flat() : []);
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
      const pts = d.kind === 'grid' ? d.pts : (LAY[d.id] ? layPoints(d, LAY[d.id]).flat().concat(LAY[d.id].parts.flatMap(p => p.pts)) : []);
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
    const R = 0.36, HR = Math.max(0.7, Math.min(view.w, view.h) / 26);
    let h = '';
    let ci = 0;
    ST.devices.forEach(d => {
      if (d.kind !== 'grid') return; const col = CCOL[ci++ % CCOL.length];
      h += `<g opacity="0.55">${d.pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${col}"/>`).join('')}</g>`;
      const xs = d.pts.map(p => p[0]), ys = d.pts.map(p => p[1]);
      h += `<text x="${Math.min(...xs)}" y="${Math.min(...ys) - 0.8}" font-size="${HR * 0.9}" fill="${col}" font-family="Saira Condensed, system-ui" font-weight="700">${esc(d.name)}</text>`;
    });
    strings().forEach(d => {
      const lay = LAY[d.id]; if (!lay) return;
      const on = d.id === sel, per = layPoints(d, lay);
      per.forEach((pts, k) => {
        const col = SCOL[k % SCOL.length], act = on && k === strand;
        const fk = (lay.parts[k].fold && lay.parts[k].fold.rows) || 1; let near = Infinity;     // spacing along a row (folded: every rows-th bulb)
        for (const st of new Set([1, fk])) for (let i = st; i < pts.length; i++) { const q = Math.hypot(pts[i][0] - pts[i - st][0], pts[i][1] - pts[i - st][1]); if (q > 1e-6) near = Math.min(near, q); }
        const r = Math.max(0.16, Math.min(R, (isFinite(near) ? near : 1) * 0.42));          // close-set bulbs: smaller dots so each one still shows
        h += `<g opacity="${on ? (act ? 1 : 0.75) : 0.45}">${pts.map(([x, y], i) => `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${i === 0 ? Math.max(r * 1.8, 0.3) : r}" fill="${col}"/>`).join('')}</g>`;
        if (on) {
          const pp = lay.parts[k].pts;
          h += `<polyline points="${pp.map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="${HR * 0.06}" stroke-dasharray="${HR * 0.3} ${HR * 0.25}" opacity="${act ? 0.5 : 0.25}"/>`;
          pp.forEach((p, i) => {
            const end = i === 0 || i === pp.length - 1, lbl = i === 0 ? (lay.parts[k].rev ? 'END' : 'START') : (i === pp.length - 1 ? (lay.parts[k].rev ? 'START' : 'END') : '');
            h += `<g class="h" data-s="${k}" data-p="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="${end ? HR : HR * 0.75}" fill="${act ? col : '#000'}" fill-opacity="${act ? 0.18 : 0.4}" stroke="${col}" stroke-width="${HR * 0.15}"/>`
              + (lbl ? `<text x="${p[0]}" y="${p[1] - HR * 1.3}" font-size="${HR * 0.8}" fill="${col}" text-anchor="middle" font-family="Saira Condensed, system-ui" font-weight="800" letter-spacing="0.05">${lbl}${lay.parts.length > 1 ? ' ' + (k + 1) : ''}</text>` : '') + `</g>`;
          });
        }
      });
    });
    svg.innerHTML = h;
    paintTools();
  }

  // ---------------- tools
  function paintTop() {
    const box = $('slTop'); if (!box) return;
    const ss = strings();
    if (!ss.length) { box.innerHTML = '<p class="note">Add a string light (Nanoleaf, Govee strip, WLED strip…) above, then lay it out here.</p>'; return; }
    if (!ss.some(d => d.id === sel)) sel = ss[0].id;
    box.innerHTML = ss.map((d, i) => `<button class="chip${d.id === sel ? ' on' : ''}" data-sl="${esc(d.id)}" style="--c:${SCOL[i % SCOL.length]}">🧵 ${esc(d.name)} · ${d.n}</button>`).join('');
    box.querySelectorAll('[data-sl]').forEach(b => b.onclick = () => { sel = b.dataset.sl; strand = 0; paintTop(); draw(); });
  }
  function paintTools() {
    const d = dev(sel), lay = d && LAY[sel], box = $('slTools'); if (!box) return;
    if (!d || !lay) { box.hidden = true; return; } box.hidden = false;
    if (strand >= lay.parts.length) strand = 0;
    const p = lay.parts[strand], cs = partCounts(d, lay), fr = p.fold ? p.fold.rows : 1;
    $('slStrands').innerHTML = [1, 2, 3, 4].map(k => `<button class="btn${lay.parts.length === k ? ' on' : ''}" data-ns="${k}">${k}</button>`).join('');
    $('slWhich').innerHTML = lay.parts.length > 1 ? lay.parts.map((q, k) => `<button class="chip${k === strand ? ' on' : ''}" data-st="${k}" style="--c:${SCOL[k % SCOL.length]}">Strand ${k + 1} · ${cs[k]}</button>`).join('') : '';
    $('slWhichRow').hidden = lay.parts.length < 2;
    $('slFold').innerHTML = [[1, 'Line'], [2, '2 rows'], [3, '3 rows'], [4, '4 rows'], [6, '6 rows'], [8, '8 rows']].map(([k, t]) => `<button class="btn${fr === k ? ' on' : ''}" data-fr="${k}">${t}</button>`).join('');
    $('slModeRow').hidden = fr < 2;
    $('slMode').innerHTML = [['snake', 'Back & forth'], ['alt', 'Every other bulb']].map(([m, t]) => `<button class="btn${p.fold && p.fold.mode === m ? ' on' : ''}" data-md="${m}">${t}</button>`).join('');
    $('slBendRow').style.display = fr > 1 ? 'none' : 'contents';
    $('slSave').classList.toggle('pulse', !!dirty[sel]);
    $('slR').textContent = d.lay ? (dirty[sel] ? 'NOT SAVED' : 'LAID OUT') : (dirty[sel] ? 'NOT SAVED' : 'A PLAIN LINE');
  }
  function change() { dirty[sel] = true; view = view || null; draw(); }

  // ---------------- dragging handles
  function toWorld(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const m = svg.getScreenCTM(); if (!m) return [0, 0]; const q = pt.matrixTransform(m.inverse()); return [q.x, q.y]; }
  const snap = v => Math.round(v * 2) / 2;
  function bulbAt(d, lay, k, i) {                // the real bulb at handle i of strand k (first / last / nearest the bend)
    const cs = partCounts(d, lay), base = cs.slice(0, k).reduce((a, b) => a + b, 0), p = lay.parts[k], c = cs[k];
    const pts = layOne(c, p.pts, p.fold, lay.gap || 1, p.rev), h = p.pts[i];
    let best = 0, bd = Infinity; pts.forEach(([x, y], j) => { const q = (x - h[0]) ** 2 + (y - h[1]) ** 2; if (q < bd) { bd = q; best = j; } });
    return base + best;
  }
  function blink(d, lay, k, i) { const now = Date.now(); if (now - lastPick < 220) return; lastPick = now; GB.post('/api/lights/pick', {id: d.id, i: bulbAt(d, lay, k, i), secs: 1.2}); }
  function onDown(e) {
    const g = e.target.closest && e.target.closest('.h'); if (!g) return;
    e.preventDefault(); const k = +g.dataset.s, i = +g.dataset.p; strand = k;
    drag = {k, i, id: e.pointerId}; try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    const d = dev(sel); blink(d, LAY[sel], k, i);
    $('slHint').textContent = i === 0 ? 'Watch the real string: the blinking bulb is this end' : 'Drag it to where that bulb really is';
  }
  function onMove(e) {
    if (!drag) return; e.preventDefault();
    const [x, y] = toWorld(e), lay = LAY[sel], p = lay.parts[drag.k].pts;
    p[drag.i] = [snap(x), snap(y)]; dirty[sel] = true; draw(); blink(dev(sel), lay, drag.k, drag.i);
  }
  function onUp() { if (drag) { drag = null; $('slHint').textContent = ''; } }

  // ---------------- load / save
  async function load(keepView) {
    try { ST = await GB.get('/api/lights/stage'); } catch (e) { return; }
    if (!ST || !Array.isArray(ST.devices)) ST = {devices: []};          // the website demo has no stage
    strings().forEach(d => { if (!dirty[d.id]) LAY[d.id] = fromSaved(d) || fresh(d, d.n >= 200 ? 2 : 1); });
    if (!keepView) view = null;
    paintTop(); draw();
  }
  async function save() {
    const d = dev(sel), lay = LAY[sel]; if (!d || !lay) return;
    const r = await GB.post('/api/lights/lay', {id: d.id, lay});
    if (r && r.ok) { dirty[sel] = false; GB.sfx && GB.sfx('ok'); GB.toast('🧵 Saved. The live wall now shows ' + d.name + ' where you laid it'); await load(true); }
  }

  GB.panel('lights', 25, el => {
    el.id = 'slPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>🧵 Lay out your string lights</span><span class="r" id="slR"></span></div>
      <p class="note">Your curtains sit where they hang. Drag the <b>START</b> and <b>END</b> of each string to where they really are, add bends, or fold it into rows. The real bulb blinks white while you drag, so you can match it up. Strings with a splitter: pick how many strands, then lay each one, perfect for signs and logos. Tap <b>Save</b> and the live wall shows it all.</p>
      <div class="sl-top" id="slTop"></div>
      <div class="sl-stage" id="slStage"><svg id="slSvg" aria-label="Your lights, laid out"></svg></div>
      <div class="sl-row sl-zoom"><b>Zoom</b><div class="seg"><button class="btn" id="slZo" aria-label="Zoom out">−</button><button class="btn" id="slFit">Fit</button><button class="btn" id="slZi" aria-label="Zoom in">+</button></div></div>
      <div class="sl-hint" id="slHint"></div>
      <div id="slTools">
        <div class="sl-row"><b>Strands</b><div class="seg" id="slStrands"></div></div>
        <div class="sl-row" id="slWhichRow"><b>Laying</b><div class="sl-row" id="slWhich"></div></div>
        <div class="sl-row"><b>Shape</b><div class="seg" id="slFold"></div></div>
        <div class="sl-row" id="slModeRow"><b>Rows go</b><div class="seg" id="slMode"></div></div>
        <div class="sl-tools">
          <span id="slBendRow" style="display:contents"><button class="btn" id="slBend">＋ Add a bend</button><button class="btn" id="slUnbend">− Remove bend</button></span>
          <button class="btn" id="slFlip">⇄ Flip direction</button>
          <button class="btn" id="slReset">↺ Start over</button>
          <button class="btn c" id="slSave" style="--c:var(--green)">💾 Save</button>
        </div>
      </div>`;
    svg = el.querySelector('#slSvg');
    svg.addEventListener('pointerdown', onDown); svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp); svg.addEventListener('pointercancel', onUp);
    el.querySelector('#slZi').onclick = () => { zoom = Math.min(6, zoom * 1.35); view = null; draw(); };
    el.querySelector('#slZo').onclick = () => { zoom = Math.max(0.4, zoom / 1.35); view = null; draw(); };
    el.querySelector('#slFit').onclick = () => { zoom = 1; view = null; draw(); };
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t || !LAY[sel]) return;
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
    el.querySelector('#slFlip').onclick = () => { const lay = LAY[sel]; if (!lay) return; lay.parts[strand].rev = !lay.parts[strand].rev; GB.toast('⇄ START and END swapped'); change(); };
    el.querySelector('#slReset').onclick = () => { const d = dev(sel); if (!d) return; LAY[sel] = fresh(d, (LAY[sel] && LAY[sel].parts.length) || 1); strand = 0; view = null; change(); };
    el.querySelector('#slSave').onclick = save;
  });
  GB.on('page', id => { if (id === 'lights') setTimeout(() => load(false), 80); });
  GB.on('ready', () => { if (GB.page === 'lights') load(false); });
  window.addEventListener('resize', () => { if (GB.page === 'lights' && ST) draw(); });
  GB.stringLay = {layOne, reload: load};
})();
