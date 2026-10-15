/* GlowBop drawn layouts: geometry shared by the layout editor (ui/layout.js) and its tests.
   Mirrors layoutmap.py exactly (the engine re-does it on save): paths -> evenly spaced LEDs, skip / hidden ranges,
   serpentine matrices, arcs, rings, rectangles, templates with shape hints. Works in the browser (window.GBGEO) and node. */
(function (root) {
  'use strict';
  const G = {};
  const rad = d => d * Math.PI / 180;

  G.boxXf = (box, local) => {
    const b = box || {}, w = +(b.w ?? 100), h = +(b.h ?? 100), r = rad(+(b.rot || 0)), c = Math.cos(r), s = Math.sin(r), x = +(b.x || 0), y = +(b.y || 0);
    return local.map(([u, v]) => { const px = (u - 0.5) * w, py = (v - 0.5) * h; return [x + px * c - py * s, y + px * s + py * c]; });
  };
  G.boxInv = (box, pts) => {              // stage -> unit box
    const b = box || {}, w = +(b.w ?? 100) || 1e-6, h = +(b.h ?? 100) || 1e-6, r = rad(+(b.rot || 0)), c = Math.cos(r), s = Math.sin(r), x = +(b.x || 0), y = +(b.y || 0);
    return pts.map(([X, Y]) => { const dx = X - x, dy = Y - y; return [(dx * c + dy * s) / w + 0.5, (-dx * s + dy * c) / h + 0.5]; });
  };

  G.arc3 = (a, m, b, n = 64) => {
    const d = 2 * (a[0] * (m[1] - b[1]) + m[0] * (b[1] - a[1]) + b[0] * (a[1] - m[1]));
    const big = Math.max(1, ...[a, m, b].flat().map(Math.abs)) ** 2;
    if (Math.abs(d) < 1e-9 * big) return {pts: [a.slice(), m.slice(), b.slice()], c: null};
    const sa = a[0] * a[0] + a[1] * a[1], sm = m[0] * m[0] + m[1] * m[1], sb = b[0] * b[0] + b[1] * b[1];
    const ux = (sa * (m[1] - b[1]) + sm * (b[1] - a[1]) + sb * (a[1] - m[1])) / d;
    const uy = (sa * (b[0] - m[0]) + sm * (a[0] - b[0]) + sb * (m[0] - a[0])) / d;
    const r = Math.hypot(a[0] - ux, a[1] - uy), tau = 2 * Math.PI, mod = (x) => ((x % tau) + tau) % tau;
    const t0 = Math.atan2(a[1] - uy, a[0] - ux), tm = Math.atan2(m[1] - uy, m[0] - ux), t1 = Math.atan2(b[1] - uy, b[0] - ux);
    const ccw = mod(tm - t0) < mod(t1 - t0), sweep = ccw ? mod(t1 - t0) : -mod(t0 - t1);
    const pts = []; for (let i = 0; i <= n; i++) { const th = t0 + sweep * i / n; pts.push([ux + r * Math.cos(th), uy + r * Math.sin(th)]); }
    return {pts, c: [ux, uy], r};
  };

  const CORNERS = {tl: [0, 0], tr: [1, 0], br: [1, 1], bl: [0, 1]}, CW = ['tl', 'tr', 'br', 'bl'];
  G.strokes = it => {
    const k = it.kind;
    if (k === 'line' || k === 'poly') { const p = (it.pts || []).filter(v => v); return [{p, closed: !!it.closed && k === 'poly' && p.length > 2}]; }
    if (k === 'arc') { const p = it.pts || []; if (p.length < 3) return [{p, closed: false}]; return [{p: G.arc3(p[0], p[1], p[2]).pts, closed: false}]; }
    if (k === 'ring') { const a0 = rad(+(it.a0 || 0)), loc = []; for (let i = 0; i < 96; i++) { const th = a0 + 2 * Math.PI * i / 96; loc.push([0.5 + 0.5 * Math.sin(th), 0.5 - 0.5 * Math.cos(th)]); } return [{p: G.boxXf(it.box, loc), closed: true}]; }
    if (k === 'rect') { const i = Math.max(0, CW.indexOf(it.start || 'tl')); return [{p: G.boxXf(it.box, [0, 1, 2, 3].map(j => CORNERS[CW[(i + j) % 4]])), closed: true}]; }
    if (k === 'tpl') { const ss = (it.strokes || []).filter(s => s.length); return ss.map(s => ({p: G.boxXf(it.box, s), closed: !!it.closed && (it.strokes || []).length === 1})); }
    return [];
  };
  const segLens = (p, closed) => { const q = closed ? p.concat([p[0]]) : p; const L = []; for (let i = 0; i + 1 < q.length; i++) L.push(Math.hypot(q[i + 1][0] - q[i][0], q[i + 1][1] - q[i][1])); return {L, q}; };
  G.strokeLen = (p, closed) => segLens(p, closed).L.reduce((a, b) => a + b, 0);
  G.sampleStroke = (p, closed, n) => {
    const pts = [], t = [], seg = [];
    if (n <= 0) return {pts, t, seg};
    if (!p.length) { for (let i = 0; i < n; i++) { pts.push([0, 0]); t.push(0); seg.push(0); } return {pts, t, seg}; }
    const {L, q} = segLens(p, closed), tot = L.reduce((a, b) => a + b, 0);
    if (p.length === 1 || tot < 1e-9) { for (let i = 0; i < n; i++) { pts.push(p[0].slice()); t.push(0); seg.push(0); } return {pts, t, seg}; }
    const cum = [0]; L.forEach(l => cum.push(cum[cum.length - 1] + l));
    for (let i = 0; i < n; i++) {
      const s = closed ? i * tot / n : n === 1 ? tot / 2 : i * tot / (n - 1);
      let j = 0; while (j + 1 < cum.length && cum[j + 1] <= s) j++;
      j = Math.max(0, Math.min(j, L.length - 1));
      const f = L[j] > 0 ? (s - cum[j]) / L[j] : 0;
      pts.push([q[j][0] + (q[j + 1][0] - q[j][0]) * f, q[j][1] + (q[j + 1][1] - q[j][1]) * f]); t.push(s / tot); seg.push(j);
    }
    return {pts, t, seg};
  };
  G.alloc = (n, lens) => {
    const k = lens.length; if (!k) return []; if (k === 1) return [n];
    const tot = lens.reduce((a, b) => a + b, 0) || 1, raw = lens.map(l => n * l / tot), base = raw.map(Math.floor);
    let left = n - base.reduce((a, b) => a + b, 0);
    const order = raw.map((r, i) => [-(r - base[i]), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[1]);
    for (const i of order) { if (left <= 0) break; base[i]++; left--; }
    return base;
  };
  G.sampleStrokes = (sts, n) => {
    sts = sts.filter(s => s.p.length);
    const pos = [], t = [], stroke = [], seg = [];
    if (!sts.length || n <= 0) { for (let i = 0; i < Math.max(0, n); i++) { pos.push([0, 0]); t.push(0); stroke.push(0); seg.push(0); } return {pos, t, stroke, seg}; }
    const lens = sts.map(s => G.strokeLen(s.p, s.closed)), tot = lens.reduce((a, b) => a + b, 0) || 1, al = G.alloc(n, lens);
    let done = 0, segoff = 0;
    sts.forEach((s, j) => { const r = G.sampleStroke(s.p, s.closed, al[j]);
      r.pts.forEach((p, i) => { pos.push(p); t.push((done + r.t[i] * lens[j]) / tot); stroke.push(j); seg.push(r.seg[i] + segoff); });
      done += lens[j]; segoff += Math.max(1, s.p.length - (s.closed ? 0 : 1)); });
    return {pos, t, stroke, seg};
  };
  G.reverseStrokes = sts => sts.slice().reverse().map(s => ({p: s.closed ? [s.p[0]].concat(s.p.slice(1).reverse()) : s.p.slice().reverse(), closed: s.closed}));
  G.hiddenMask = (count, skip) => {
    const h = new Array(Math.max(0, count)).fill(false);
    (skip || []).forEach(r => { let a = parseInt(r[0], 10), b = parseInt(r[1], 10); if (isNaN(a) || isNaN(b)) return;
      const lo = Math.max(0, Math.min(a, b)), hi = Math.min(count - 1, Math.max(a, b)); for (let i = lo; i <= hi; i++) h[i] = true; });
    return h;
  };
  G.matrixCells = (rows, cols, n, start = 'tl', order = 'rows', serp = true) => {
    const out = [];
    for (let k = 0; k < n; k++) {
      let a, b, na;
      if (order === 'cols') { a = Math.floor(k / rows); b = k % rows; na = rows; } else { a = Math.floor(k / cols); b = k % cols; na = cols; }
      if (serp && a % 2 === 1) b = na - 1 - b;
      let r = order === 'cols' ? b : a, c = order === 'cols' ? a : b;
      if (start === 'tr' || start === 'br') c = cols - 1 - c;
      if (start === 'bl' || start === 'br') r = rows - 1 - r;
      out.push([r, c]);
    }
    return out;
  };
  // -> {pos: [[x,y]] (count), vis: [bool], t: [0..1], est: [bool] (camera guessed), seg: [int]}
  G.placeItem = it => {
    const n = Math.max(0, parseInt(it.count, 10) || 0), hid = G.hiddenMask(n, it.skip), vis = hid.map(h => !h);
    const vi = []; vis.forEach((v, i) => { if (v) vi.push(i); });
    const pos = new Array(n).fill(null).map(() => [0, 0]), t = new Array(n).fill(0), est = new Array(n).fill(false), seg = new Array(n).fill(0);
    if (it.kind === 'matrix') {
      const rows = Math.max(1, +it.rows || 1), cols = Math.max(1, +it.cols || 1);
      const cells = G.matrixCells(rows, cols, Math.min(vi.length, rows * cols), it.start || 'tl', it.order || 'rows', it.serp !== false);
      const vp = G.boxXf(it.box, cells.map(([r, c]) => [(c + 0.5) / cols, (r + 0.5) / rows]));
      vi.slice(vp.length).forEach(i => vis[i] = false);
      vi.slice(0, vp.length).forEach((i, k) => { pos[i] = vp[k]; t[i] = k / Math.max(1, vp.length - 1); });
    } else if (it.kind === 'points') {
      const loc = it.pts || [];
      if (!loc.length) vi.forEach(i => vis[i] = false);
      else {
        const nv = vi.length, idx = []; for (let k = 0; k < nv; k++) idx.push(nv > 1 ? Math.round(k * (loc.length - 1) / (nv - 1)) : 0);
        const arr = idx.map(i => loc[i] ? loc[i].slice() : null), good = arr.map(a => !!a), gi = []; good.forEach((g, i) => { if (g) gi.push(i); });
        for (let i = 0; i < arr.length; i++) {
          if (arr[i]) continue; est[vi[i]] = true;
          if (!gi.length) { arr[i] = [0.5, 0.5]; continue; }
          let lo = -1, hi = -1; for (const g of gi) { if (g < i) lo = g; else if (hi < 0) hi = g; }
          if (lo < 0) arr[i] = arr[hi].slice(); else if (hi < 0) arr[i] = arr[lo].slice();
          else { const f = (i - lo) / (hi - lo); arr[i] = [arr[lo][0] + (arr[hi][0] - arr[lo][0]) * f, arr[lo][1] + (arr[hi][1] - arr[lo][1]) * f]; }
        }
        const sp = G.boxXf(it.box, arr); vi.forEach((i, k) => { pos[i] = sp[k]; t[i] = k / Math.max(1, vi.length - 1); });
      }
    } else {
      let sts = G.strokes(it); if (it.rev) sts = G.reverseStrokes(sts);
      const r = G.sampleStrokes(sts, vi.length);
      vi.forEach((i, k) => { pos[i] = r.pos[k]; t[i] = r.t[k]; seg[i] = r.seg[k]; });
    }
    const vis2 = []; vis.forEach((v, i) => { if (v) vis2.push(i); });
    if (vis2.length) vis.forEach((v, i) => { if (v) return; let j = -1; for (const q of vis2) { if (q < i) j = q; else break; } if (j < 0) j = vis2[0]; pos[i] = pos[j].slice(); t[i] = t[j]; });
    return {pos, vis, t, est, seg};
  };

  // =========================================================== templates (unit box, y down). make(tp) -> item fields
  const line = (n, f) => { const out = []; for (let i = 0; i <= n; i++) out.push(f(i / n)); return out; };
  const T = G.TEMPLATES = {
    roofline: {label: 'Roofline', ic: 'roof', name: 'Roof', size: [600, 180], count: 150,
      params: [{k: 'style', label: 'Roof', opts: [['gable', 'Gable'], ['hip', 'Hip'], ['peaks', 'Flat + peaks']], def: 'gable'}, {k: 'peaks', label: 'Peaks', min: 1, max: 6, def: 2, when: tp => tp.style === 'peaks'}],
      make(tp) {
        let v, peaks;
        if (tp.style === 'hip') { v = [[0, 1], [0.22, 0], [0.78, 0], [1, 1]]; peaks = [[0.22, 0], [0.78, 0]]; }
        else if (tp.style === 'peaks') {
          const n = Math.max(1, Math.min(6, tp.peaks | 0 || 2)); v = [[0, 1]]; peaks = [];
          for (let i = 0; i < n; i++) { const a = (i + 0.12) / n, m = (i + 0.5) / n, b = (i + 0.88) / n; v.push([a, 1], [m, 0], [b, 1]); peaks.push([m, 0]); }
          v.push([1, 1]);
        } else { v = [[0, 1], [0.5, 0], [1, 1]]; peaks = [[0.5, 0]]; }
        return {strokes: [v], closed: false, hints: {peaks}};
      }},
    window: {label: 'Window', ic: 'window', name: 'Window', size: [120, 150], count: 50, params: [],
      make() { return {strokes: [[[0, 1], [0, 0], [1, 0], [1, 1]]], closed: true, hints: {center: [0.5, 0.5]}}; }},
    door: {label: 'Door', ic: 'door', name: 'Door', size: [110, 220], count: 60,
      params: [{k: 'top', label: 'Top', opts: [['flat', 'Flat'], ['arch', 'Arched']], def: 'flat'}],
      make(tp) {
        if (tp.top === 'arch') { const a = line(16, u => [0.5 - 0.5 * Math.cos(Math.PI * u), 0.25 - 0.25 * Math.sin(Math.PI * u)]);
          return {strokes: [[[0, 1]].concat(a, [[1, 1]])], closed: false, hints: {center: [0.5, 0.55], apex: [0.5, 0]}}; }
        return {strokes: [[[0, 1], [0, 0], [1, 0], [1, 1]]], closed: false, hints: {center: [0.5, 0.5], apex: [0.5, 0]}};
      }},
    arch: {label: 'Arch', ic: 'arch', name: 'Arch', size: [300, 150], count: 60, params: [],
      make() { return {strokes: [line(32, u => [0.5 - 0.5 * Math.cos(Math.PI * u), 1 - Math.sin(Math.PI * u)])], closed: false, hints: {center: [0.5, 1], apex: [0.5, 0]}}; }},
    pillar: {label: 'Pillar wrap', ic: 'pillar', name: 'Pillar', size: [60, 300], count: 100,
      params: [{k: 'turns', label: 'Turns', min: 1, max: 20, def: 5}],
      make(tp) { const n = Math.max(1, Math.min(20, +tp.turns || 5));
        return {strokes: [line(Math.round(16 * n), u => [0.5 + 0.5 * Math.sin(2 * Math.PI * n * u), 1 - u])], closed: false,
                hints: {axis: [[0.5, 1], [0.5, 0]], base: [0.5, 1], apex: [0.5, 0], turns: n}}; }},
    tree_cone: {label: 'Cone tree', ic: 'tree', name: 'Tree', size: [220, 320], count: 200,
      params: [{k: 'strands', label: 'Strands', min: 3, max: 24, def: 8}, {k: 'wire', label: 'Wiring', opts: [['zig', 'Down, up'], ['down', 'All top-down']], def: 'zig'}],
      make(tp) { const S = Math.max(3, Math.min(24, +tp.strands || 8)), st = [];
        for (let i = 0; i < S; i++) { const b = [i / (S - 1), 1], a = [0.5, 0]; st.push(tp.wire === 'down' || i % 2 === 0 ? [a, b] : [b, a]); }
        return {strokes: st, closed: false, hints: {apex: [0.5, 0], base: [0.5, 1], axis: [[0.5, 1], [0.5, 0]], strands: S}}; }},
    tree_spiral: {label: 'Spiral tree', ic: 'spiral', name: 'Spiral tree', size: [220, 320], count: 200,
      params: [{k: 'turns', label: 'Turns', min: 2, max: 16, def: 6}],
      make(tp) { const n = Math.max(2, Math.min(16, +tp.turns || 6));
        return {strokes: [line(Math.round(24 * n), u => [0.5 + 0.5 * (1 - u) * Math.sin(2 * Math.PI * n * u), 1 - u])], closed: false,
                hints: {apex: [0.5, 0], base: [0.5, 1], axis: [[0.5, 1], [0.5, 0]], turns: n}}; }},
    truss: {label: 'Stage truss', ic: 'truss', name: 'Truss', size: [600, 300], count: 180, params: [],
      make() { return {strokes: [[[0, 1], [0, 0], [1, 0], [1, 1]]], closed: false,
                       hints: {center: [0.5, 0.5], apex: [0.5, 0], parts: [{name: 'Left leg', segs: [0]}, {name: 'Top', segs: [1]}, {name: 'Right leg', segs: [2]}]}}; }},
    booth: {label: 'DJ booth front', ic: 'booth', name: 'DJ booth', size: [400, 110], matrix: [8, 32], params: []},
    matrix: {label: 'Pixel panel', ic: 'panel', name: 'Panel', size: [200, 200], matrix: [16, 16], params: []},
  };
  G.TPL_ORDER = ['roofline', 'window', 'door', 'arch', 'pillar', 'tree_cone', 'tree_spiral', 'truss', 'booth', 'matrix'];
  G.tplDefaults = name => { const t = T[name], tp = {}; (t.params || []).forEach(p => tp[p.k] = p.def); return tp; };
  // a new template item centred at (x, y)
  G.makeTemplate = (name, x, y, tp) => {
    const t = T[name]; tp = Object.assign(G.tplDefaults(name), tp || {});
    const box = {x, y, w: t.size[0], h: t.size[1], rot: 0};
    if (t.matrix) return {kind: 'matrix', tpl: name, name: t.name, box, rows: t.matrix[0], cols: t.matrix[1], start: 'tl', order: 'rows', serp: true,
                          count: t.matrix[0] * t.matrix[1], hints: {center: [0.5, 0.5]}};
    return Object.assign({kind: 'tpl', tpl: name, tp, name: t.name, box, count: t.count}, t.make(tp));
  };
  G.remakeTemplate = it => { const t = T[it.tpl]; if (!t || !t.make) return it; return Object.assign(it, t.make(it.tp || G.tplDefaults(it.tpl))); };
  // template / box item -> a plain polyline in stage units (Edit points)
  G.toPoly = it => { const sts = G.strokes(it); if (!sts.length) return it;
    const s = sts[0]; return {kind: 'poly', pts: s.p.map(p => p.slice()), closed: s.closed, name: it.name, dev: it.dev, first: it.first, count: it.count, skip: it.skip, rev: it.rev, id: it.id}; };
  // hints in stage units (what the engine works out on save), for drawing the apex / peaks / centre marks
  G.hintsStage = it => {
    const h = it.hints || {}, out = {};
    ['apex', 'base', 'center'].forEach(k => { if (Array.isArray(h[k]) && h[k].length === 2) out[k] = it.kind === 'tpl' || it.kind === 'matrix' ? G.boxXf(it.box, [h[k]])[0] : h[k]; });
    ['peaks', 'axis'].forEach(k => { if (Array.isArray(h[k]) && h[k].length) out[k] = it.kind === 'tpl' ? G.boxXf(it.box, h[k]) : h[k]; });
    if (it.kind === 'arc' && (it.pts || []).length >= 3) { const a = G.arc3(...it.pts.slice(0, 3)); out.apex = out.apex || it.pts[1]; out.center = out.center || a.c || it.pts[1]; }
    if (['ring', 'rect', 'matrix', 'points'].includes(it.kind) && it.box) out.center = out.center || [it.box.x, it.box.y];
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.GBGEO = G;
})(typeof window !== 'undefined' ? window : this);
