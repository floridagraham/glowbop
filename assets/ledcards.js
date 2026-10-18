/* GlowBop LED cards: little animated light walls drawn as LED dots, the same look as the Pro upgrade pages in the app.
   <canvas class="lc-wall" data-scene="pro-art"></canvas>  Scenes: pro-art (the logo goes 3D and becomes a spinning globe),
   pro-home, pro-dj, layout, curtain, tonight, mix. Only canvases on screen animate (about 25 fps); reduced motion shows one still frame. */
(function () {
  'use strict';
  const hsv = (h, s, v) => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), u = v * (1 - (1 - f) * s);
    return [[v, u, p], [q, v, p], [p, v, u], [p, q, v], [u, p, v], [v, p, q]][i % 6]; };
  const beat = (t, bpm) => { const ph = (t * (bpm || 124) / 60) % 1; return Math.exp(-ph * 5); };
  const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const ease = v => v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v);
  const lerp = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const BURST = [[0, 0, 1, 1, 1, 0, 0], [0, 1, 2, 2, 2, 1, 0], [1, 2, 3, 3, 3, 2, 1], [1, 2, 3, 4, 3, 2, 1], [1, 2, 3, 3, 3, 2, 1], [0, 1, 2, 2, 2, 1, 0], [0, 0, 1, 1, 1, 0, 0]];
  const BCOL = [null, hex('#33d6ff'), hex('#9b3dff'), hex('#ff3d9a'), [1, 1, 1]];
  const show = (x, y, t) => hsv(x / 34 + y / 60 + t * .22, 1, .45 + .55 * beat(t, 124));   // the music show, one picture across every light

  // ---------------------------------------------------------------- cell scenes (x, y, t, W, H) -> [r, g, b], from the app's Pro sales cards
  const CELL = {
    'pro-home': (x, y, t, W, H) => {
      const mo = new Date().getMonth(), day = new Date().getDate(), mode = mo === 9 ? 'halloween' : (mo === 11 && day <= 26) ? 'xmas' : 'normal';
      const on = (t % 6) > 1.2, hx = x - W * .74, ry = H * .22, roof = y >= ry && y < H * .5 && Math.abs(hx) <= (y - ry) * 1.3, wall = y >= H * .5 && y < H - 1 && Math.abs(hx) <= H * .34;
      const edge = roof && Math.abs(Math.abs(hx) - (y - ry) * 1.3) < 1.2, win = wall && (Math.abs(hx + H * .16) < 1.6 || Math.abs(hx - H * .16) < 1.6) && y > H * .58 && y < H * .8;
      if (mode === 'halloween') {
        if (edge) return (Math.floor(x + t * 6) % 2) ? [1, .45, 0] : [.7, .15, 1];
        if (win) return [1, .45 + .25 * Math.sin(t * 9 + x), 0];
        if (wall || roof) return [.22, .1, .28];
        if (Math.hypot(x - W * .45, y - H * .25) < H * .18) return [.9, .9, .7];
        return hsv(.78, .9, .12 + .1 * (y / H));
      }
      if (mode === 'xmas') {
        if (edge) return [[1, .1, .1], [.1, 1, .2], [1, .8, .1], [.2, .5, 1]][Math.floor(x + t * 4) % 4];
        if (win) return on ? [1, .85, .5] : [.2, .15, .05];
        if (wall || roof) return [.12, .1, .14];
        if (y === H - 1 || ((x * 7 + Math.floor(y + t * 3) * 13) % 23 === 0)) return [.85, .9, 1];
        return [.02, .04, .14 + .1 * (y / H)];
      }
      if (edge) return on ? [1, .78, .35] : [.5, .35, .15];
      if (win) return on ? [1, .8, .45] : [.15, .1, .05];
      if (wall) return [.2, .16, .22]; if (roof) return [.25, .12, .1];
      if (y >= H - 1) return [.1, .45, .2];
      if (Math.hypot(x - W * .45, y - H * .75) < H * .25) return [1, .6, .2];
      return [.15 + .5 * (y / H), .35 + .2 * (y / H), .95 - .3 * (y / H)];
    },
    'pro-dj': (x, y, t, W, H) => {
      const b = beat(t, 126), lv = (.35 + .55 * Math.abs(Math.sin(x * .7 + t * 3.1)) * (.6 + .4 * b)) * H;
      return H - y <= lv ? hsv(.85 + (H - y) / H * .35 + x / W * .1, 1, 1) : [0, 0, 0];
    },
  };

  // ---------------------------------------------------------------- dot scenes on a fixed grid: {cols, rows, dots(t) -> [[x, y, [r, g, b], ring?], ...]}
  const N_STR = 120;
  const DOTS = {
    layout: {cols: 44, rows: 20, dots(t) {                // two curtains, and a loose string that gets dragged into place beside them
      const out = [], T = t % 10, k = ease((T - 1.6) / 2.6) * (1 - ease((T - 8.6) / 1.2));
      for (const x0 of [2, 13]) for (let x = 0; x < 10; x++) for (let y = 0; y < 12; y++) out.push([x0 + x, 4 + y, show(x0 + x, 4 + y, t)]);
      for (let i = 0; i < N_STR; i++) {
        const u = i / (N_STR - 1), lx = 25 + u * 17, ly = 17 - u * 12 + Math.sin(u * 9 + 1) * 2.2;          // loose: a wavy line on the floor
        const c = Math.floor(i / 12), r = i % 12, tx = 25 + c, ty = 4 + (c % 2 ? 11 - r : r);             // laid: 10 drops of 12, snaking
        const loose = hsv(.52 + .05 * Math.sin(u * 20 - t * 4), .9, .55 + .45 * (Math.abs(((u * 6 - t * .8) % 1)) < .08 ? 1 : 0));
        out.push([lx + (tx - lx) * k, ly + (ty - ly) * k, lerp(loose, show(tx, ty, t), k)]);
      }
      return out; }},
    curtain: {cols: 31, rows: 23, dots(t) {               // 308 bulbs become 15 drops of 21; the 7 spare spots stay dark
      const out = [], T = t % 9, n = Math.min(308, Math.floor(T / 5 * 308)), done = T >= 5;
      for (let i = 0; i < 315; i++) {
        const c = Math.floor(i / 21), r = i % 21, x = 8 + c, y = 1 + (c % 2 ? 20 - r : r);
        if (i >= 308) { out.push([x, y, [.55, .35, 1], true]); continue; }
        if (done) out.push([x, y, show(x, y, t)]);
        else if (i < n) out.push([x, y, i > n - 4 ? [1, 1, 1] : hsv(.92 - i / 308 * .45, .95, .85)]);
        else out.push([x, y, [.09, .07, .16]]);
      }
      return out; }},
    tonight: {cols: 40, rows: 19, dots(t) {               // a score on the wall, the light show dancing dimmed behind it
      const F = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
      const lit = new Map(), put = (s, x0, y0, col) => [...s].forEach((d, n) => { const g = F[+d];
        for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) lit.set((x0 + n * 8 + (i % 3) * 2 + a) + ',' + (y0 + Math.floor(i / 3) * 2 + b), col); });
      const sc = Math.floor(t / 4) % 2;
      put(sc ? '55' : '52', 3, 4, hex('#ff3d6a')); put('49', 23, 4, hex('#33a0ff'));
      const pulse = beat(t, 124) > .6 ? 1.6 : 1, out = [];
      for (let y = 0; y < 19; y++) for (let x = 0; x < 40; x++) {
        const c = lit.get(x + ',' + y); if (c) { out.push([x, y, c]); continue; }
        if (y === 17 && x > 2 && x < 37) { out.push([x, y, (x - 3) / 34 < (t % 4) / 4 ? hex('#ffcc33') : [.15, .12, .05]]); continue; }
        let near = false; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (lit.has((x + a) + ',' + (y + b))) near = true;
        out.push([x, y, show(x, y, t).map(v => v * (near ? .05 : .28 * pulse))]);
      }
      return out; }},
    mix: {cols: 42, rows: 18, dots(t) {                   // a Twinkly curtain and a Nanoleaf string, side by side, one picture
      const out = [];
      for (let x = 0; x < 18; x++) for (let y = 0; y < 14; y++) out.push([2 + x, 2 + y, show(2 + x, 2 + y, t)]);
      for (let row = 0; row < 4; row++) for (let i = 0; i < 34; i++) { const x = 22 + i * .5, y = 3 + row * 3.6 + (i % 2) * 1.6; out.push([x, y, show(x, y, t)]); }
      return out; }},
  };

  // ---------------------------------------------------------------- the GlowBop logo -> 3D columns -> spinning globe -> back flat (DRAW['Pro Art'] in the app)
  let PTS = null;
  function logoGlobe(g, Wp, Hp, t, cv) {
    const L = 13, T = t % L;
    const up = ease((T - 1.2) / 1.4) * (1 - ease((T - 10.6) / 1.4));
    const glb = ease((T - 5.2) / 1.6) * (1 - ease((T - 9.4) / 1.6));
    const spin = ease((T - 2.6) / 2.6) * Math.PI * 2 + ease((T - 6.8) / 3) * Math.PI * 2.5;
    const tilt = .62 * up * (1 - glb) + .38 * glb, ry = spin + .35 * up * Math.sin(T * .9) * (1 - glb);
    const tall = Wp < Hp * 1.15, s = tall ? Math.min(Hp * .065, Wp * .075) : Math.min(Hp * .1, Wp * .06),
      cx = Wp * (tall ? .5 : (+cv.dataset.cx || (Wp > Hp * 2.2 ? .7 : Wp > Hp * 1.3 ? .62 : .5))), cy = Hp * (tall ? .74 : .5), f = Hp * 3.2, R = s * 3.6;
    if (!PTS) {
      const src = []; for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 7; gx++) { const k = BURST[gy][gx]; if (!k) continue; const n = 1 + Math.round(k * 1.6); for (let l = 0; l < n; l++) src.push([gx - 3, gy - 3, l, n, k]); }
      const N = src.length, ga = Math.PI * (3 - Math.sqrt(5));
      PTS = src.map((q, i) => { const yy = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - yy * yy), th = i * ga; return q.concat([Math.cos(th) * rr, yy, Math.sin(th) * rr]); });
    }
    const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(tilt), sxr = Math.sin(tilt), pulse = .75 + .25 * Math.sin(t * 4);
    const P = PTS.map(([gx, gy, l, n, k, ux, uy, uz]) => {
      const lx = gx * s, ly = gy * s, lz = -l * s * .62 * up, x = lx + (ux * R - lx) * glb, y = ly + (uy * R - ly) * glb, zz = lz + (uz * R - lz) * glb;
      let X = x * cyr + zz * syr, Z = -x * syr + zz * cyr; const Y = y * cxr - Z * sxr; Z = y * sxr + Z * cxr;
      const sc = f / (f + Z); return [cx + X * sc, cy + Y * sc, Z, sc, k, l, n, uy];
    }).sort((a, b) => b[2] - a[2]);
    P.forEach(([x, y, Z, sc, k, l, n, uy]) => {
      let c = BCOL[k]; if (glb > 0) { const h = hsv(.5 + uy * .25 + t * .05, .85, 1); c = c.map((v, i) => v * (1 - glb) + h[i] * glb); }
      const top = l === n - 1, depth = Math.max(.35, Math.min(1, 1 - Z / (R * 2.5))), lift = up * (1 - glb);
      const v = (top || lift < .05 ? 1 : .55 + .35 * (l / Math.max(1, n - 1))) * (k === 4 && glb < .5 ? pulse : 1) * (glb > 0 ? depth * glb + (1 - glb) : 1), r = s * .36 * sc * (1 - .35 * glb);
      g.fillStyle = `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${.18 * v})`; g.beginPath(); g.arc(x, y, r * 2.1, 0, 6.3); g.fill();
      g.fillStyle = `rgb(${Math.min(255, c[0] * 255 * v + 40 * v) | 0},${Math.min(255, c[1] * 255 * v + 40 * v) | 0},${Math.min(255, c[2] * 255 * v + 40 * v) | 0})`; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); });
  }

  // ---------------------------------------------------------------- drawing
  const BG = '#030208', OFF = '#120e1e';
  function dot(g, px, py, rr, c, ring) {
    if (ring) { g.strokeStyle = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`; g.lineWidth = Math.max(1, rr * .35); g.beginPath(); g.arc(px, py, rr * .8, 0, 6.3); g.stroke(); return; }
    const m = Math.max(c[0], c[1], c[2]);
    if (m > .06) { g.fillStyle = `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${.22 * m})`; g.beginPath(); g.arc(px, py, rr * 1.9, 0, 6.3); g.fill(); }
    g.fillStyle = m > .02 ? `rgb(${Math.min(255, c[0] * 255 + 30 * m) | 0},${Math.min(255, c[1] * 255 + 30 * m) | 0},${Math.min(255, c[2] * 255 + 30 * m) | 0})` : OFF;
    g.beginPath(); g.arc(px, py, rr, 0, 6.3); g.fill();
  }
  function paint(cv, t) {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    const dpr = Math.min(2, devicePixelRatio || 1), Wp = Math.round(r.width * dpr), Hp = Math.round(r.height * dpr);
    if (cv.width !== Wp || cv.height !== Hp) { cv.width = Wp; cv.height = Hp; }
    const g = cv.getContext('2d'), name = cv.dataset.scene; g.fillStyle = BG; g.fillRect(0, 0, Wp, Hp);
    const D = DOTS[name];
    if (D) {
      const pitch = Math.min(Wp / D.cols, Hp / D.rows), ox = (Wp - pitch * D.cols) / 2 + pitch / 2, oy = (Hp - pitch * D.rows) / 2 + pitch / 2, rr = pitch * .34;
      const xs = Math.ceil(ox / pitch), ys = Math.ceil(oy / pitch);
      g.fillStyle = '#0c0916';
      for (let y = -ys; y < D.rows + ys; y++) for (let x = -xs; x < D.cols + xs; x++) { g.beginPath(); g.arc(ox + x * pitch, oy + y * pitch, rr * .55, 0, 6.3); g.fill(); }
      D.dots(t).forEach(([x, y, c, ring]) => dot(g, ox + x * pitch, oy + y * pitch, rr, c, ring));
      return;
    }
    const pitch = 11 * dpr, W = Math.max(8, Math.floor(Wp / pitch)), H = Math.max(5, Math.floor(Hp / pitch)), ox = (Wp - W * pitch) / 2 + pitch / 2, oy = (Hp - H * pitch) / 2 + pitch / 2, rr = pitch * .34;
    const fn = CELL[name] || (() => [0, 0, 0]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) dot(g, ox + x * pitch, oy + y * pitch, rr, fn(x, y, t, W, H));
    if (name === 'pro-art') logoGlobe(g, Wp, Hp, t, cv);
  }

  const list = [...document.querySelectorAll('canvas[data-scene]')]; if (!list.length) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, vis = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vis.add(e.target) : vis.delete(e.target)), {rootMargin: '80px'});
    list.forEach(c => io.observe(c));
  } else list.forEach(c => vis.add(c));
  // a still frame right away (the logo scene shows it mid-spin, the others mid-show)
  const first = () => list.forEach(c => paint(c, c.dataset.scene === 'pro-art' ? 4.2 : c.dataset.scene === 'curtain' ? 6.2 : c.dataset.scene === 'layout' ? 6 : 1.3));
  first(); addEventListener('resize', first);
  if (still) return;
  let last = 0;
  (function frame(ms) {
    if (!document.hidden && ms - last >= 40) { last = ms; vis.forEach(c => paint(c, ms / 1000)); }
    requestAnimationFrame(frame);
  })(0);
})();
