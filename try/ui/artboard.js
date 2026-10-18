/* 🎨 ART BOARD (BETA, Oct 17, Graham: "make me a file that anyone can import... they'll have different types of files they need to import,
   and it'll look at it and map it"; "both": map the lights from a file AND show pictures / logos on them; ".glowbop" share files).
   1. Map a string light from a file: a drawing (SVG / PNG / JPG of the path or shape), a photo of the lights switched on (finds the
      dots), a spreadsheet (CSV: bulb, x, y), or an xLights model (.xmodel). Everything is worked out here in the browser; the result
      goes to the engine as a 'points' layout (POST /api/lights/lay), sized to your main panel and placed right of your other lights.
      Free until launch day (Halloween), then part of Pro.
   2. Show a picture or logo: the TEXT page's logo tools (already built) put any picture on the wall.
   3. .glowbop files: export your whole layout to share, import one, or start from a template (the 308-bulb 15 x 21 curtain). */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const PRO_FROM = GB.ART_PRO_FROM || Date.UTC(2026, 9, 31, 4);          // 🎃 Halloween, midnight Eastern: mapping becomes Pro (same date as api.py ART_PRO_FROM)
  const locked = () => Date.now() >= PRO_FROM && GB.pro === false;
  GB.css(`
  .ab-drop { border:2px dashed #ff3d9a; border-radius:0 16px 0 16px; padding:18px 14px; text-align:center; background:#ff3d9a12; cursor:pointer; }
  .ab-drop b { display:block; font:700 calc(17px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:#ff8cc4; text-transform:uppercase; }
  .ab-drop small { color:var(--lav); }
  .ab-drop.over { background:#ff3d9a2e; }
  .ab-chips { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
  .ab-prev { width:100%; aspect-ratio:16/10; background:#07050f; border-radius:0 14px 0 14px; display:block; margin:8px 0; touch-action:none; }
  .ab-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:6px 0; }
  .ab-row .lab { color:var(--lav); font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; margin-right:4px; }
  .ab-msg { color:#ffcc66; font-size:calc(14px * var(--fs, 1)); margin:6px 0; min-height:1.2em; }
  .ab-beta { font:700 10px var(--cond); letter-spacing:2px; background:var(--pink); color:#fff; border-radius:6px; padding:2px 6px; margin-left:8px; vertical-align:middle; }
  .ab-lock { padding:12px; border-radius:0 12px 0 12px; background:#2a1d00; color:#ffcc66; }
  #rail button.freetag { position:relative; }
  #rail button.freetag::after { content:'PRO'; position:absolute; top:5px; right:6px; font:800 9px/1 var(--mono); letter-spacing:1px; background:#ffd21a; color:#000; border-radius:6px; padding:3px 5px; box-shadow:0 0 0 1.5px #000; }
  `);

  // ---------------------------------------------------------------- state
  let SIGN = null, ST = null, SEL = '', SRC = null, KIND = '', RAW = null, ORDER = null, TALL = 0, FLIP = false, REV = false, KEEP = false, START = -1, NAME = '';
  const strs = () => (ST ? ST.devices.filter(d => d.kind === 'string') : []);
  const dev = id => (ST ? ST.devices.find(d => d.id === id) : null);
  const msg = t => { const m = $('abMsg'); if (m) m.textContent = t || ''; };
  async function load() { try { ST = await GB.get('/api/lights/stage'); } catch (e) { ST = null; } if (!ST || !Array.isArray(ST.devices)) ST = {devices: []};
    if (!SEL || !dev(SEL)) SEL = (strs()[0] || {}).id || ''; paintPick(); }

  // ---------------------------------------------------------------- reading files -> ordered points [[x, y], ...] (y down)
  const ext = f => (f.name.split('.').pop() || '').toLowerCase();
  const readText = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = no; r.readAsText(f); });
  async function readImage(f, max) {
    const url = URL.createObjectURL(f);
    try {
      const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
      return {w, h, d: g.getImageData(0, 0, w, h).data};
    } finally { URL.revokeObjectURL(url); }
  }
  // 📸 a photo of the lights switched on: the bright dots, in string order (nearest-neighbour chain from one end)
  function photoDots(im) {
    const {w, h, d} = im, L = new Float32Array(w * h); let mx = 0;
    for (let i = 0; i < w * h; i++) { const v = 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]; L[i] = v; if (v > mx) mx = v; }
    const sorted = Array.from(L).sort((a, b) => a - b), med = sorted[sorted.length >> 1], t = Math.max(120, 0.55 * mx + 0.45 * med);
    const seen = new Uint8Array(w * h), out = [], maxA = w * h * 0.02;
    for (let i = 0; i < w * h; i++) {
      if (seen[i] || L[i] < t) continue;
      let sx = 0, sy = 0, a = 0; const st = [i]; seen[i] = 1;
      while (st.length) { const j = st.pop(), x = j % w, y = (j / w) | 0; sx += x; sy += y; a++;
        for (const k of [j - 1, j + 1, j - w, j + w]) { if (k < 0 || k >= w * h || seen[k] || L[k] < t) continue; if ((k === j - 1 && x === 0) || (k === j + 1 && x === w - 1)) continue; seen[k] = 1; st.push(k); } }
      if (a >= 2 && a <= maxA) out.push([sx / a, sy / a]);
    }
    return chain(out);
  }
  // ✏️ a drawing of the path (PNG / JPG): the ink, thinned to cells, followed from one end
  function drawingPath(im) {
    const {w, h, d} = im, bg = [0, 0, 0], ed = [];
    for (let x = 0; x < w; x++) { ed.push(0 * w + x, (h - 1) * w + x); } for (let y = 0; y < h; y++) { ed.push(y * w, y * w + w - 1); }
    for (let c = 0; c < 3; c++) { const v = ed.map(i => d[i * 4 + c]).sort((a, b) => a - b); bg[c] = v[v.length >> 1]; }
    const cell = Math.max(1, Math.round(Math.max(w, h) / 120)), cw = Math.ceil(w / cell), ch = Math.ceil(h / cell), ink = new Uint8Array(cw * ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4;
      if (d[i + 3] > 40 && Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 90) ink[((y / cell) | 0) * cw + ((x / cell) | 0)] = 1; }
    const pts = []; for (let i = 0; i < cw * ch; i++) if (ink[i]) pts.push([(i % cw + 0.5) * cell, (((i / cw) | 0) + 0.5) * cell]);
    if (!pts.length) return [];
    let st = 0, best = 9;                          // start at an end of the line (the ink cell with the fewest ink neighbours)
    pts.forEach((p, k) => { const cx = (p[0] / cell) | 0, cy = (p[1] / cell) | 0; let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const x = cx + dx, y = cy + dy; if (x >= 0 && y >= 0 && x < cw && y < ch && ink[y * cw + x]) nb++; }
      if (nb < best || (nb === best && p[1] < pts[st][1])) { best = nb; st = k; } });
    return chain(pts, st);
  }
  // 🧩 SVG: every line, path and shape in drawing order, followed along its length (the browser does the curve maths)
  function svgPath(text) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml'), root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('not an SVG drawing');
    root.querySelectorAll('script, foreignObject, iframe, image, use').forEach(n => n.remove());       // safety: nothing in the file runs
    root.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) n.removeAttribute(a.name); }));
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden';
    const svg = document.importNode(root, true); host.appendChild(svg); document.body.appendChild(host);
    try {
      const out = [], els = svg.querySelectorAll('path, polyline, polygon, line, rect, circle, ellipse'), M = svg.getScreenCTM && svg.getScreenCTM();
      els.forEach(el => { let L = 0; try { L = el.getTotalLength(); } catch (e) { return; } if (!(L > 0)) return;
        const n = Math.min(2000, Math.max(8, Math.ceil(L / 2))), m = el.getScreenCTM && M ? M.inverse().multiply(el.getScreenCTM()) : null;
        for (let i = 0; i <= n; i++) { let p = el.getPointAtLength(L * i / n); if (m) p = p.matrixTransform(m); out.push([p.x, p.y]); } });
      return out;
    } finally { host.remove(); }
  }
  // 📊 CSV: "bulb, x, y" (or just "x, y") per line, header optional
  function csvPoints(text) {
    const rows = text.split(/\r?\n/).map(l => l.split(/[,;\t]/).map(v => v.trim())).filter(r => r.length >= 2 && r.slice(0, 3).every(v => v === '' || !isNaN(+v)) && r[0] !== '');
    const three = rows.length && rows[0].length >= 3 && rows[0][2] !== '';
    const pts = rows.map(r => three ? [+r[0], +r[1], +r[2]] : [0, +r[0], +r[1]]);
    if (three) pts.sort((a, b) => a[0] - b[0]);
    return pts.map(p => [p[1], p[2]]);
  }
  // 🎄 xLights custom model (.xmodel): the grid of node numbers (or its compressed "node,row,col" list)
  function xmodelPoints(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml'), m = doc.querySelector('custommodel') || doc.documentElement;
    const nodes = [];
    const cmp = m.getAttribute('CustomModelCompressed');
    if (cmp) cmp.split(';').forEach(e => { const v = e.split(',').map(Number); if (v.length >= 3 && v.every(x => !isNaN(x))) nodes.push([v[0], v[2], v[1] + (v[3] || 0) * 0]); });
    else {
      const cm = m.getAttribute('CustomModel') || ''; if (!cm) throw new Error('no custom model grid in this file');
      cm.split('|')[0].split(';').forEach((row, y) => row.split(',').forEach((c, x) => { const k = parseInt(c, 10); if (!isNaN(k)) nodes.push([k, x, y]); }));
    }
    if (!nodes.length) throw new Error('no lights found in this xLights model');
    nodes.sort((a, b) => a[0] - b[0]); NAME = m.getAttribute('name') || NAME;
    return nodes.map(n => [n[1], n[2]]);
  }
  // nearest-neighbour chain (dots from a photo / ink cells): the order a string would run through them
  function chain(pts, st) {
    if (pts.length < 2) return pts.slice();
    if (st == null) { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; let bd = -1;
      pts.forEach((p, k) => { const dd = (p[0] - cx) ** 2 + (p[1] - cy) ** 2; if (dd > bd) { bd = dd; st = k; } }); }
    const left = pts.slice(), out = [left.splice(st, 1)[0]];
    while (left.length) { const q = out[out.length - 1]; let bk = 0, bd = Infinity;
      for (let k = 0; k < left.length; k++) { const dd = (left[k][0] - q[0]) ** 2 + (left[k][1] - q[1]) ** 2; if (dd < bd) { bd = dd; bk = k; } }
      out.push(left.splice(bk, 1)[0]); }
    return out;
  }
  // N bulbs evenly along the ordered points (by distance), so any file fits any bulb count
  function resample(P, N) {
    if (!P.length) return []; if (P.length === N) return P.map(p => p.slice()); if (P.length === 1) return Array.from({length: N}, () => P[0].slice());
    const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const T = cum[cum.length - 1] || 1, out = []; let j = 0;
    for (let i = 0; i < N; i++) { const t = T * i / Math.max(1, N - 1); while (j < P.length - 2 && cum[j + 1] < t) j++;
      const seg = cum[j + 1] - cum[j] || 1, f = Math.max(0, Math.min(1, (t - cum[j]) / seg)); out.push([P[j][0] + (P[j + 1][0] - P[j][0]) * f, P[j][1] + (P[j + 1][1] - P[j][1]) * f]); }
    return out;
  }

  // ---------------------------------------------------------------- the result: sized + placed in curtain-bulb units
  let PLACE = {x1: -1, y0: 0, h: 21};
  function result() {
    const d = dev(SEL); if (!d || !ORDER || !ORDER.length) return null;
    if (SIGN) {                                    // 🪧 a sign file: every bulb is placed exactly (no reorder / respread); size from the LIT bulbs
      const B = signBulbs(SIGN, d.n); let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      B.pts.forEach(([x, y], i) => { if (B.hide[i]) return; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      const s = KEEP ? 1 : ((TALL || PLACE.h || 21) - 1) / Math.max(1e-6, y1 - y0);
      const P = B.pts.map(([x, y]) => [Math.round(((x - x0) * s + PLACE.x1 + 1) * 1000) / 1000, Math.round(((FLIP ? (y1 - y) : (y - y0)) * s + PLACE.y0) * 1000) / 1000]);
      P.hide = B.hide; P.col = B.col; P.warn = B.warn; return P;
    }
    let P = ORDER.slice(); if (REV) P.reverse();
    if (START > 0) P = P.slice(START).concat(P.slice(0, START));
    P = resample(P, d.n);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; P.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    const hh = Math.max(1e-6, y1 - y0), ww = Math.max(1e-6, x1 - x0);
    const want = (TALL || PLACE.h || 21) - 1, s = KEEP ? 1 : (hh > 1e-3 ? want / hh : want / ww);
    return P.map(([x, y]) => [Math.round(((x - x0) * s + PLACE.x1 + 1) * 1000) / 1000, Math.round(((FLIP ? (y1 - y) : (y - y0)) * s + PLACE.y0) * 1000) / 1000]);
  }
  function preview() {
    const c = $('abPrev'); if (!c) return; const g = c.getContext('2d'), W = c.width = c.clientWidth * devicePixelRatio, H = c.height = c.clientHeight * devicePixelRatio;
    g.fillStyle = '#07050f'; g.fillRect(0, 0, W, H);
    const P = result(), d = dev(SEL);
    if (!P) { const inf = $('abInfo'); if (inf) inf.textContent = ''; g.fillStyle = '#cc99ff'; g.font = `${16 * devicePixelRatio}px sans-serif`; g.textAlign = 'center'; g.fillText(SRC ? 'No lights found in that file' : 'Your map shows here', W / 2, H / 2); return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; P.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    const pad = 24 * devicePixelRatio, s = Math.min((W - 2 * pad) / Math.max(1, x1 - x0), (H - 2 * pad) / Math.max(1, y1 - y0)), X = x => pad + (x - x0) * s, Y = y => pad + (y - y0) * s;
    g.strokeStyle = '#ffffff22'; g.lineWidth = devicePixelRatio; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))); g.stroke();
    const r = Math.max(2, Math.min(7, s * 0.32)) * devicePixelRatio / devicePixelRatio;
    P.forEach(([x, y], i) => { const t = i / Math.max(1, P.length - 1);
      if (P.hide && P.hide[i]) { g.strokeStyle = '#cc99ff66'; g.lineWidth = devicePixelRatio; g.beginPath(); g.arc(X(x), Y(y), Math.max(1.5, r * 0.45), 0, 7); g.stroke(); return; }
      g.fillStyle = P.col && P.col[i] ? P.col[i] : `hsl(${300 + t * 200},95%,62%)`; g.beginPath(); g.arc(X(x), Y(y), P.col ? r * 1.6 : r, 0, 7); g.fill(); });
    const mark = (i, col, lab) => { const [x, y] = P[i]; g.strokeStyle = col; g.lineWidth = 3 * devicePixelRatio; g.beginPath(); g.arc(X(x), Y(y), r + 5 * devicePixelRatio, 0, 7); g.stroke();
      g.fillStyle = col; g.font = `700 ${12 * devicePixelRatio}px sans-serif`; g.textAlign = 'center'; g.fillText(lab, X(x), Y(y) - r - 9 * devicePixelRatio); };
    mark(0, '#3ce08a', 'START'); mark(P.length - 1, '#ff3d9a', 'END');
    const w = Math.round(x1 - x0) + 1, h = Math.round(y1 - y0) + 1;
    if (P.hide) { const dark = P.hide.filter(Boolean).length; $('abInfo').innerHTML = `🪧 <b>${SIGN.spots.length}</b> spots · <b>${d.n - dark}</b> bulbs lit, <b>${dark}</b> kept dark (lead, bridges, leftovers) · about <b>${w} × ${h}</b> bulb spots${P.warn ? ' · ⚠️ ' + esc(P.warn) : ''}`; return; }
    $('abInfo').innerHTML = `<b>${d.n}</b> bulbs · about <b>${w} × ${h}</b> bulb spots${RAW && RAW.length !== d.n ? ` · the file had ${RAW.length} ${KIND === 'photo' ? 'dots' : 'points'}, spread to fit your ${d.n} bulbs` : ''}`;
  }

  async function takeFile(f, keepKind) {
    if (!f) return; SRC = f; NAME = f.name.replace(/\.[^.]+$/, ''); START = -1; REV = false; FLIP = false; SIGN = null; const e = ext(f);
    msg('Reading ' + f.name + '…');
    try {
      if (e === 'glowbop' || (e === 'json' && /glowbop/i.test(await readText(f)))) { await importGlowbop(f); return; }
      if (e === 'svg') { KIND = 'svg'; RAW = svgPath(await readText(f)); KEEP = false; }
      else if (e === 'csv' || e === 'txt') { KIND = 'csv'; RAW = csvPoints(await readText(f)); KEEP = false; }
      else if (e === 'xmodel' || e === 'xml') { KIND = 'xmodel'; RAW = xmodelPoints(await readText(f)); KEEP = true; }
      else if (/^(png|jpe?g|webp|gif|bmp)$/.test(e)) { KIND = keepKind && /^(photo|drawing)$/.test(KIND) ? KIND : (e === 'png' || e === 'gif' || e === 'bmp' ? 'drawing' : 'photo'); SRC._img = await readImage(f, KIND === 'photo' ? 480 : 360); RAW = KIND === 'photo' ? photoDots(SRC._img) : drawingPath(SRC._img); KEEP = false; }
      else throw new Error('GlowBop reads SVG, PNG, JPG, CSV, xLights .xmodel and .glowbop files');
      ORDER = RAW; TALL = 0; PLACE = await (GB.slPlaceFor ? GB.slPlaceFor(SEL) : Promise.resolve(PLACE));
      msg(RAW.length ? `✅ Found ${RAW.length} ${KIND === 'photo' ? 'lit dots' : 'points'} in ${f.name}` : '😕 No lights found in that file');
    } catch (err) { RAW = ORDER = null; msg('😕 ' + (err.message || 'Could not read that file')); }
    paintOpts(); preview();
  }
  function paintOpts() {
    const box = $('abOpts'); if (!box) return; box.hidden = !ORDER;
    if (!ORDER) return;
    const h = TALL || PLACE.h || 21;
    $('abKind').innerHTML = /^(drawing|photo)$/.test(KIND) ? `<span class="lab">This picture is</span><button class="btn${KIND === 'drawing' ? ' on' : ''}" data-k="drawing">✏️ A drawing of the path</button><button class="btn${KIND === 'photo' ? ' on' : ''}" data-k="photo">📸 A photo of my lights on</button>` : '';
    $('abSize').innerHTML = `<span class="lab">How tall</span>${KIND === 'xmodel' || KIND === 'csv' || KIND === 'sign' ? `<button class="btn${KEEP ? ' on' : ''}" data-z="keep">${KIND === 'sign' ? 'One spot per bulb spot' : 'File\'s own size'}</button>` : ''}<button class="btn${!KEEP && !TALL ? ' on' : ''}" data-z="main">🟰 Main panel (${PLACE.h || 21})</button><button class="btn" data-z="-">−</button><button class="btn" disabled style="opacity:1">${KEEP ? 'as drawn' : h + ' tall'}</button><button class="btn" data-z="+">+</button>`;
    $('abKind').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { KIND = b.dataset.k; takeFile(SRC, true); });
    $('abSize').querySelectorAll('[data-z]').forEach(b => b.onclick = () => { const v = b.dataset.z;
      if (v === 'keep') KEEP = true; else if (v === 'main') { KEEP = false; TALL = 0; } else { KEEP = false; TALL = Math.max(2, Math.min(200, h + (v === '+' ? 1 : -1))); } paintOpts(); preview(); });
  }
  async function putOnWall() {
    const d = dev(SEL), P = result(); if (!d || !P) return;
    if (locked()) return GB.toast('🔒 Mapping lights from a file is part of GlowBop Pro');
    let k = 0, bd = -1; P.forEach((q, i) => { const dd = (q[0] - P[0][0]) ** 2 + (q[1] - P[0][1]) ** 2; if (dd > bd) { bd = dd; k = i; } });
    const r = await GB.post('/api/lights/lay', {id: d.id, lay: {kind: 'points', pts: P, ref: k, src: KIND, name: NAME, parts: [{pts: [P[0], P[k]]}], hide: P.hide ? P.hide.map((h, i) => h ? i : -1).filter(i => i >= 0) : []}});
    if (r && r.ok) { GB.toast(`🎨 ${d.name} mapped from ${NAME || 'your file'}. Fine-tune it on the LIGHTS page.`); GB.sfx && GB.sfx('ok'); GB.slReload && GB.slReload(); }
    else if (r && r.error) GB.toast('😕 ' + r.error);
  }

  // ---------------------------------------------------------------- .glowbop files
  const download = (name, obj) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], {type: 'application/json'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  async function exportLayout() {
    await load(); const out = {glowbop: 1, type: 'layout', name: 'My GlowBop wall', made: new Date().toISOString().slice(0, 10), main: ST.main || '', lights: []};
    ST.devices.forEach(d => { const L = {name: d.name, n: d.n, kind: d.kind, id: d.id};
      if (d.kind === 'grid') { const xs = d.pts.map(p => p[0]), ys = d.pts.map(p => p[1]); L.place = [Math.min(...xs), Math.min(...ys)]; L.orient = d.orient || null; }
      else if (d.lay) L.lay = d.lay;
      out.lights.push(L); });
    download('my-wall.glowbop', out); GB.toast('📦 my-wall.glowbop saved: share it, or import it on another GlowBop');
  }
  const TEMPLATE_308 = {glowbop: 1, type: 'curtain-template', name: '308-bulb string → 15 × 21 curtain', n: 308, h: 21,
    how: 'Start at the TOP next to your other lights, run drop 1 down 21 bulbs, drop 2 back up beside it, and keep snaking: 15 drops, the last one 14 bulbs.'};
  // 🪧 sign files (type 'sign'): spots + each strand's route from the plug -> every bulb's spot, and which bulbs stay dark
  function signBulbs(j, N) {
    const sp = +j.spacing || 1, byId = {}; (j.spots || []).forEach(o => byId[o.spot] = o);
    const at = o => [o.x / sp, o.y / sp], cord = j.cord ? at(j.cord) : null, pts = [], hide = [], col = []; let warn = '';
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    (j.strands || []).forEach((st, si) => {
      const start = pts.length, cap = +st.bulbs || Infinity, steps = (st.route || []).map(e => typeof e === 'object' ? e : {spot: e}).filter(e => byId[e.spot]);
      const first = steps.length ? at(byId[steps[0].spot]) : cord || [0, 0], from = cord || first, lead = +st.lead || 0;
      for (let i = 1; i <= lead; i++) { pts.push(lerp(from, first, i / (lead + 1))); hide.push(1); col.push(null); }
      steps.forEach((e, k) => {
        const o = byId[e.spot], p = at(o), lit = e.lit != null ? +e.lit : (st.lit != null ? +st.lit : 1), br = e.bridge != null ? +e.bridge : (st.bridge != null ? +st.bridge : 0);
        for (let i = 0; i < lit; i++) { pts.push(p.slice()); hide.push(0); col.push(o.color || null); }
        const nx = steps[k + 1] ? at(byId[steps[k + 1].spot]) : p;
        for (let i = 1; i <= br; i++) { pts.push(lerp(p, nx, i / (br + 1))); hide.push(1); col.push(null); }
      });
      const used = pts.length - start;
      if (isFinite(cap)) {
        if (used > cap) { pts.length = hide.length = col.length = start + cap; warn = `${st.name || 'Strand ' + (si + 1)} needs ${used} bulbs but has ${cap}`; }
        const last = pts[pts.length - 1] || from; while (pts.length - start < cap) { pts.push(last.slice()); hide.push(1); col.push(null); }
      }
    });
    if (pts.length > N) { warn = warn || `the file uses ${pts.length} bulbs, your light has ${N}`; pts.length = hide.length = col.length = N; }
    const last = pts[pts.length - 1] || [0, 0]; while (pts.length < N) { pts.push(last.slice()); hide.push(1); col.push(null); }
    return {pts, hide, col, warn};
  }
  async function importGlowbop(f) {
    let j; try { j = JSON.parse(await readText(f)); } catch (e) { return msg('😕 That .glowbop file is damaged'); }
    if (!j || !j.glowbop) return msg('😕 Not a GlowBop file');
    await load();
    if (j.type === 'sign') {
      if (!(j.spots || []).length || !(j.strands || []).length) return msg('😕 This sign file has no spots or strands');
      const d = dev(SEL) || strs().find(x => x.n === j.bulbs); if (!d) return msg('😕 Add a string light first, then import the sign');
      SEL = d.id; SIGN = j; KIND = 'sign'; NAME = j.name || NAME; RAW = ORDER = signBulbs(j, d.n).pts; KEEP = true; TALL = 0;
      PLACE = await (GB.slPlaceFor ? GB.slPlaceFor(SEL) : Promise.resolve(PLACE));
      msg(`✅ ${j.name || 'Sign'}: ${j.spots.length} spots, ${j.strands.length} strand${j.strands.length > 1 ? 's' : ''}. Lit spots show in their colors, dark bulbs as rings.`);
      paintPick(); paintOpts(); preview(); return;
    }
    if (j.type === 'curtain-template') {
      const d = dev(SEL) || strs().find(x => x.n === j.n); if (!d) return msg('😕 Add a string light first, then import the template');
      if (locked()) return GB.toast('🔒 Templates are part of GlowBop Pro');
      const pl = GB.slPlaceFor ? await GB.slPlaceFor(d.id) : PLACE, h = Math.max(2, j.h | 0 || pl.h || 21), a = [pl.x1 + 1, pl.y0];
      const parts = [{pts: [a, [a[0], a[1] + h - 1]], n: d.n, rev: false, fold: null}];
      const r = await GB.post('/api/lights/lay', {id: d.id, lay: {parts, gap: -1, kind: 'string', wall: Math.ceil(d.n / h)}});
      if (r && r.ok) { msg(`✅ ${j.name} applied to ${d.name}: ${Math.ceil(d.n / h)} drops of ${h}. ${j.how || ''}`); GB.slReload && GB.slReload(); }
      else msg('😕 ' + ((r && r.error) || 'Could not apply the template'));
      return;
    }
    if (j.type === 'layout') {                      // match each light in the file to one of yours: same id, else same bulb count and kind
      const used = new Set(); let done = 0;
      for (const L of j.lights || []) {
        const d = ST.devices.find(x => !used.has(x.id) && x.id === L.id) || ST.devices.find(x => !used.has(x.id) && x.n === L.n && x.kind === L.kind); if (!d) continue; used.add(d.id);
        let r = null;
        if (d.kind === 'grid' && L.place) r = await GB.post('/api/lights/place', Object.assign({id: d.id, place: L.place}, L.orient ? {rot: L.orient.rot || 0, flip: !!L.orient.flip} : {}));
        else if (L.lay) r = await GB.post('/api/lights/lay', {id: d.id, lay: L.lay});
        if (r && r.ok) done++;
      }
      if (j.main) GB.post('/api/lights/main', {id: j.main});
      msg(done ? `✅ ${done} of your lights laid out from ${f.name}` : `😕 None of your lights match the ones in ${f.name} (same bulb count needed)`); GB.slReload && GB.slReload(); return;
    }
    msg('😕 GlowBop doesn\'t know that kind of .glowbop file yet');
  }

  // ---------------------------------------------------------------- panels
  function paintPick() {
    const box = $('abPick'); if (!box) return; const ss = strs();
    box.innerHTML = ss.length ? '<span class="lab" style="color:var(--lav);font:600 12px var(--cond);letter-spacing:2px;margin-right:4px">MAP THIS LIGHT</span>' + ss.map(d => `<button class="chip${d.id === SEL ? ' on' : ''}" data-ab="${esc(d.id)}">🧵 ${esc(d.name)} · ${d.n}</button>`).join('')
      : '<p class="note">Add a string light on the SETUP page first. (Curtains already know where their bulbs are.)</p>';
    box.querySelectorAll('[data-ab]').forEach(b => b.onclick = async () => { SEL = b.dataset.ab; PLACE = GB.slPlaceFor ? await GB.slPlaceFor(SEL) : PLACE; paintPick(); preview(); });
    $('abLock').hidden = !locked();
  }
  GB.panel('art', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    el.innerHTML = `<div class="ph"><span>🎨 Map your lights from a file <span class="ab-beta">BETA</span></span><span class="r">ART BOARD</span></div>
      <p class="note">Hung your lights in a shape (a heart, letters, a roofline, a logo)? Give GlowBop a file of that shape and it maps every bulb onto it, at the same scale as your main panel.</p>
      <div class="ab-lock" id="abLock" hidden>🔒 Mapping from a file is part of GlowBop Pro.</div>
      <div class="ab-chips" id="abPick"></div>
      <label class="ab-drop" id="abDrop"><input type="file" id="abFile" hidden accept=".svg,.png,.jpg,.jpeg,.webp,.gif,.bmp,.csv,.txt,.xmodel,.xml,.glowbop,.json">
        <b>📂 Choose a file (or drop it here)</b><small>✏️ Drawing: SVG / PNG / JPG · 📸 Photo of your lights switched on · 📊 Spreadsheet: CSV (bulb, x, y) · 🎄 xLights .xmodel · 📦 .glowbop</small></label>
      <div class="ab-msg" id="abMsg"></div>
      <div id="abOpts" hidden>
        <div class="ab-row" id="abKind"></div>
        <div class="ab-row" id="abSize"></div>
        <div class="ab-row"><span class="lab">Adjust</span><button class="btn" id="abRev">⇄ Swap START / END</button><button class="btn" id="abFlip">⇅ Flip upside down</button></div>
      </div>
      <canvas class="ab-prev" id="abPrev"></canvas>
      <p class="note" id="abInfo"></p>
      <button class="btn c wide" id="abGo" style="--c:var(--pink)">🎨 Put it on my wall</button>
      <p class="note">START is bulb 1, the end of the string nearest its plug. Photos work best taken straight on, in a dark room, with the lights on one bright color.</p>`;
    const inp = el.querySelector('#abFile'), drop = el.querySelector('#abDrop');
    inp.onchange = () => { takeFile(inp.files[0]); inp.value = ''; };
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); takeFile(e.dataTransfer.files[0]); });
    el.querySelector('#abRev').onclick = () => { REV = !REV; preview(); };
    el.querySelector('#abFlip').onclick = () => { FLIP = !FLIP; preview(); };
    el.querySelector('#abGo').onclick = putOnWall;
    el.querySelector('#abPrev').addEventListener('click', e => {                  // tap a dot: that's where the string starts
      const P = result(); if (!P || !ORDER) return; const c = e.currentTarget, r = c.getBoundingClientRect();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; P.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
      const pad = 24, s = Math.min((r.width - 2 * pad) / Math.max(1, x1 - x0), (r.height - 2 * pad) / Math.max(1, y1 - y0)), mx = e.clientX - r.left, my = e.clientY - r.top;
      let bi = 0, bd = Infinity; P.forEach(([x, y], i) => { const dd = (pad + (x - x0) * s - mx) ** 2 + (pad + (y - y0) * s - my) ** 2; if (dd < bd) { bd = dd; bi = i; } });
      if (bd > 900 || KIND !== 'photo') return;
      const q = P[bi]; let oi = 0, od = Infinity; const R = resample(ORDER, P.length);   // restart the chain from the nearest original dot
      R.forEach((p, i) => { const dd = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (dd < od) { od = dd; oi = i; } });
      ORDER = chain(RAW.slice(), Math.round(oi * (RAW.length - 1) / Math.max(1, P.length - 1))); REV = false; START = -1; msg('✅ The string starts at the dot you tapped'); preview();
    });
    window.addEventListener('resize', () => { if (GB.page === 'art') preview(); });
  });
  GB.panel('art', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>🖼️ Show a picture or logo</span></div>
      <p class="note">Put any picture, logo or drawing on your lights, with effects (pulse, sparkle, wipe, explode on the drop) and a slideshow for sponsors.</p>
      <button class="btn c wide" id="abPic" style="--c:var(--cyan)">🖼️ Choose a picture</button>`;
    el.querySelector('#abPic').onclick = () => GB.go('text', 'mdLgPick');
  });
  GB.panel('art', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `<div class="ph"><span>📦 GlowBop files <span class="ab-beta">BETA</span></span><span class="r">.GLOWBOP</span></div>
      <p class="note">Save your whole wall as one file to share or back up. Import one (above, or here) and lights with the same bulb count map the same way.</p>
      <div class="ab-row"><button class="btn c" id="abExp" style="--c:var(--violet)">📤 Export my wall</button><button class="btn" id="abImp">📥 Import a .glowbop file</button></div>
      <div class="ab-row"><span class="lab">Templates</span><button class="btn" id="abT308">⭐ 308-bulb string → 15 × 21 curtain</button></div>
      <div class="ab-row"><span class="lab">Signs</span><button class="btn c" id="abSign" style="--c:var(--pink)">🪧 Use the GlowBop logo sign (308 bulbs)</button><a class="btn" href="ui/templates/GlowBop-Logo-Sign-308.glowbop" download>⬇️ Download it</a></div>
      <p class="note">A sign file lists the spots (holes in your board), where the plug is, and each strand's route through the spots. GlowBop lights the bulbs bunched in each spot and keeps the wire runs between them dark. Download the logo sign to see the format, edit it for your own logo, and import it.</p>`;
    el.querySelector('#abExp').onclick = exportLayout;
    el.querySelector('#abImp').onclick = () => $('abFile').click();
    el.querySelector('#abT308').onclick = () => download('curtain-308-15x21.glowbop', TEMPLATE_308);
    el.querySelector('#abSign').onclick = async () => { try { const t = await (await fetch('ui/templates/GlowBop-Logo-Sign-308.glowbop')).text();
      await takeFile(new File([t], 'GlowBop-Logo-Sign-308.glowbop', {type: 'application/json'})); $('abPrev').scrollIntoView({behavior: 'smooth', block: 'center'}); } catch (e) { GB.toast('😕 Could not load the sign file'); } };
  });
  GB.on('page', id => { if (id === 'art') { load(); setTimeout(preview, 50); } });
  GB.on('pro', () => { if (GB.page === 'art') paintPick(); });
})();
