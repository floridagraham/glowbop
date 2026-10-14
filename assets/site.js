// GlowBop site: nav, scroll reveal, and little LED-wall animations used as placeholders until real photos arrive.
(() => {
  const nav = document.querySelector('.nav'), bt = document.querySelector('.burger');
  if (bt) bt.onclick = () => nav.classList.toggle('open');

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .12}) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  // ---------- tiny 3x5 pixel font
  const F = {
    '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001',
    '5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111',
    'A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110','E':'111100110100111',
    'F':'111100110100100','G':'011100101101011','H':'101101111101101','I':'111010010010111','J':'001001001101010',
    'K':'101101110101101','L':'100100100100111','M':'101111111101101','N':'110101101101101','O':'010101101101010',
    'P':'110101110100100','Q':'010101101110011','R':'110101110101101','S':'011100010001110','T':'111010010010010',
    'U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101','Y':'101101010010010',
    'Z':'111001010100111',' ':'000000000000000','!':'010010010000010','-':'000000111000000',':':'000010000010000',
    '<':'001010100010001','3D':'',
  };
  const textW = s => s.length * 4 - 1;
  function drawText(px, s, x0, y0, col, W, H) {
    s = s.toUpperCase();
    for (let i = 0; i < s.length; i++) {
      const g = F[s[i]] || F[' '];
      for (let k = 0; k < 15; k++) if (g[k] === '1') {
        const x = x0 + i * 4 + (k % 3), y = y0 + ((k / 3) | 0);
        if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = col;
      }
    }
  }
  const hsl = (h, s, l) => { h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)]; };

  // ---------- scenes: each paints a W×H array of [r,g,b] (or null) for time t
  const S = {
    beat(px, W, H, t) {
      const b = Math.pow(1 - ((t * 2) % 1), 3);
      for (let x = 0; x < W; x++) {
        const lvl = (0.35 + 0.3 * Math.sin(x * 0.45 + t * 2.2) + 0.25 * Math.sin(x * 0.17 - t * 1.3)) * (0.6 + 0.5 * b);
        for (let y = 0; y < H; y++) {
          const ring = Math.abs(Math.hypot(x - W / 2, (y - H / 2) * 1.6) - (t * 14) % 26) < 1.2;
          if ((H - y) / H < lvl) px[y * W + x] = hsl(300 + x * 6 + y * 3 + t * 30, 95, 50 + 12 * b);
          else if (ring) px[y * W + x] = hsl(190 + x * 3, 95, 55);
        }
      }
    },
    drop(px, W, H, t) {
      const c = t % 6, burst = c > 4.2;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!burst) { const k = c / 4.2, lit = Math.random() < 0.04 + k * 0.25; if (lit) px[y * W + x] = hsl(200 + k * 120, 90, 30 + k * 40); }
        else { const r = Math.hypot(x - W / 2, (y - H / 2) * 1.8), w = (c - 4.2) * 40; if (Math.abs(r - w) < 3 || r < w * 0.4 && Math.random() < .3) px[y * W + x] = hsl(320 + r * 4, 100, 60); }
      }
    },
    tunnel(px, W, H, t) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = (x - W / 2) / W, dy = (y - H / 2) / H * 1.1, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy) + 1e-3;
        const z = 0.3 / r + t * 1.5, ring = (z % 1) < 0.18, spoke = ((a / Math.PI * 4 + t * 0.3) % 1 + 1) % 1 < 0.12;
        if (ring || spoke) px[y * W + x] = hsl(260 + z * 40, 95, Math.min(65, 20 + r * 90));
      }
    },
    fire(px, W, H, t) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const n = Math.sin(x * 0.7 + t * 3) * 0.5 + Math.sin(x * 0.31 - t * 2.1 + y * 0.4) * 0.5, h = (H - y) / H;
        const v = 1 - h * 1.3 + n * 0.25 + Math.random() * 0.12;
        if (v > 0.15) px[y * W + x] = hsl(8 + v * 40, 100, Math.min(60, v * 55));
      }
    },
    halloween(px, W, H, t) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (y > H - 3) px[y * W + x] = [20, 60, 10];
      const P = ['00011100','01111110','11011011','11111111','11100111','01011010','00111100'];
      [[6, 11], [W - 15, 12]].forEach(([ox, oy], i) => P.forEach((r, yy) => [...r].forEach((c, xx) => {
        if (c === '1') px[(oy + yy) * W + ox + xx] = [255, 120 + 30 * Math.sin(t * 3 + i), 0];
        else if (yy > 1 && yy < 6 && xx > 0 && xx < 7) px[(oy + yy) * W + ox + xx] = [255, 220, 40 + 40 * Math.sin(t * 9)];
      })));
      for (let b = 0; b < 4; b++) { const bx = Math.round((t * 6 + b * 11) % (W + 6)) - 3, by = 3 + b % 3 * 2 + Math.round(Math.sin(t * 4 + b));
        [[-1, 0], [0, 1], [1, 0], [-2, -1], [2, -1]].forEach(([dx, dy]) => { const X = bx + dx, Y = by + dy; if (X >= 0 && X < W && Y >= 0) px[Y * W + X] = [130, 60, 200]; }); }
      const m = [[W / 2 + 2, 3]]; m.forEach(([mx, my]) => { for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5) px[(my + y) * W + Math.round(mx) + x] = [230, 230, 200]; });
    },
    christmas(px, W, H, t) {
      for (let i = 0; i < 70; i++) { const x = (i * 37) % W, y = Math.floor((t * (2 + i % 3) + i * 7) % H); px[y * W + x] = [200, 210, 255]; }
      const cx = W / 2;
      for (let y = 3; y < H - 3; y++) { const half = Math.floor((y - 2) * 0.55); for (let x = -half; x <= half; x++) {
        const tw = (x * 7 + y * 13) % 9 === 0; px[y * W + Math.round(cx) + x] = tw ? hsl((x * 50 + y * 30 + t * 120), 100, 55 + 10 * Math.sin(t * 6 + x)) : [10, 120 + y * 3, 40]; } }
      for (let y = H - 3; y < H - 1; y++) for (let x = -1; x <= 1; x++) px[y * W + Math.round(cx) + x] = [120, 60, 20];
      const sb = 0.6 + 0.4 * Math.sin(t * 5); [[0, 1], [-1, 2], [0, 2], [1, 2], [0, 3]].forEach(([dx, dy]) => px[dy * W + Math.round(cx) + dx] = [255, 220 * sb, 40]);
    },
    score(px, W, H, t) {
      const home = 2 + (t % 12 > 6 ? 1 : 0), cele = (t % 12) > 6 && (t % 12) < 8;
      for (let x = 0; x < W; x++) { px[x] = [40, 40, 60]; px[(H - 1) * W + x] = [40, 40, 60]; }
      drawText(px, 'HOME', 3, 2, [255, 61, 154], W, H); drawText(px, 'AWAY', W - 18, 2, [51, 214, 255], W, H);
      const big = (n, x0, col) => { const g = F[String(n)]; for (let k = 0; k < 15; k++) if (g[k] === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) px[(9 + ((k / 3) | 0) * 2 + b) * W + x0 + (k % 3) * 2 + a] = col; };
      big(home, 6, cele ? hsl(t * 400, 100, 60) : [255, 255, 255]); big(1, W - 12, [255, 255, 255]);
      const m = Math.floor((600 - t * 3) / 60 % 60), s = Math.floor((600 - t * 3) % 60), clk = `${m}:${String(s).padStart(2, '0')}`;
      drawText(px, clk, Math.round(W / 2 - textW(clk) / 2), 10, [182, 255, 61], W, H);
      if (cele) for (let i = 0; i < 40; i++) { const x = (Math.random() * W) | 0, y = (Math.random() * H) | 0; px[y * W + x] = hsl(Math.random() * 360, 100, 60); }
    },
    f1(px, W, H, t) {
      const rows = [['1VER', [30, 65, 255], 'S'], ['2NOR', [255, 135, 0], 'M'], ['3LEC', [230, 0, 30], 'M'], ['4PIA', [255, 135, 0], 'H']];
      const sh = Math.floor(t / 4) % 2; if (sh) [rows[1], rows[2]] = [rows[2], rows[1]];
      const tyre = {S: [255, 40, 40], M: [255, 220, 0], H: [240, 240, 240]};
      rows.forEach((r, i) => { const y = 1 + i * 5; for (let k = 0; k < 4; k++) px[(y + k) * W] = r[1];
        drawText(px, r[0], 2, y, [255, 255, 255], W, H); px[(y + 2) * W + 19] = tyre[r[2]]; px[(y + 1) * W + 19] = tyre[r[2]];
        const g = Math.round(8 + 6 * Math.sin(t + i)); for (let k = 0; k < g; k++) px[(y + 2) * W + 22 + k] = i === 0 ? [180, 60, 255] : [40, 200, 120]; });
    },
    text(px, W, H, t) {
      const msg = 'GLOWBOP  HAPPY BIRTHDAY!  ', w = textW(msg), x0 = W - Math.floor(t * 12) % (w + W);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y + Math.floor(t * 8)) % 11 === 0) px[y * W + x] = [30, 10, 50];
      const tmp = new Array(W * H).fill(null); drawText(tmp, msg, x0, 8, [1, 1, 1], W, H);
      tmp.forEach((c, i) => { if (c) px[i] = hsl((i % W) * 8 + t * 90, 100, 60); });
    },
    lineup(px, W, H, t) {
      const n = Math.max(1, Math.round(W / 20)), pw = W / n;
      for (let p = 0; p < n; p++) { const x0 = Math.round(p * pw), col = hsl(p * 90 + 300, 90, 55);
        for (let y = 0; y < H; y++) { px[y * W + x0] = [40, 40, 60]; px[y * W + Math.round(x0 + pw) - 1] = [40, 40, 60]; }
        drawText(px, String(p + 1), x0 + Math.round(pw / 2) - 1, 13, col, W, H);
        const ax = x0 + Math.round(pw / 2), ay = 3 + Math.round(Math.sin(t * 4 + p) * 1);
        for (let k = 0; k < 6; k++) px[(ay + k) * W + ax] = [255, 255, 255];
        [[-1, 1], [1, 1], [-2, 2], [2, 2]].forEach(([dx, dy]) => px[(ay + dy) * W + ax + dx] = [255, 255, 255]); }
    },
    mirror(px, W, H, t) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const v = Math.sin(x * 0.15 + t) + Math.sin(y * 0.3 - t * 0.7) + Math.sin((x + y) * 0.1 + t * 0.5);
        px[y * W + x] = hsl(200 + v * 40, 70, 20 + (v + 3) * 7);
      }
      const sx = ((t * 8) % (W + 10)) - 5; for (let y = 12; y < 17; y++) for (let x = 0; x < 6; x++) { const X = Math.round(sx + x); if (X >= 0 && X < W) px[y * W + X] = [255, 230, 120]; }
    },
    rainbow(px, W, H, t) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px[y * W + x] = hsl(x * 9 + y * 4 - t * 80, 100, 50 + 8 * Math.sin(t * 4 + x * .3));
    },
    fireplace(px, W, H, t, o) {
      // same idea as the app: heat rises at 2x resolution, random cooling tears it into tongues
      const Hs = H * 2, Ws = W * 2;
      if (!o.heat) { o.heat = new Float32Array(Hs * Ws); o.bed = new Float32Array(Ws).map(() => Math.random()); o.tex = new Float32Array(Hs * 3 * Ws).map(() => Math.random()); o.sc = 0;
        for (let k = 0; k < 3; k++) for (let y = 0; y < Hs * 3; y++) for (let x = 0; x < Ws; x++) { const i = y * Ws + x; o.tex[i] = (o.tex[i] + o.tex[((y + 1) % (Hs * 3)) * Ws + x] + o.tex[((y + Hs * 3 - 1) % (Hs * 3)) * Ws + x]) / 3; } }
      const h = o.heat, reach = 0.8 * Hs;
      for (let step = 0, n = o.warm ? 3 : 90; step < n; step++) {
        if (!o.bt || Math.random() < 0.15) o.bt = Float32Array.from({length: Ws}, () => Math.random());
        for (let x = 0; x < Ws; x++) o.bed[x] += (o.bt[x] - o.bed[x]) * 0.05;
        const kk = Math.max(3, (Ws / 10) | 0), sm = new Float32Array(Ws); let lo = 9, hi = -9;
        for (let x = 0; x < Ws; x++) { let m = 0; for (let k = -kk; k <= kk; k++) m += o.bed[(x + k + Ws) % Ws]; sm[x] = m; lo = Math.min(lo, m); hi = Math.max(hi, m); }
        for (let x = 0; x < Ws; x++) { const hot = (sm[x] - lo) / (hi - lo + 1e-9); h[(Hs - 1) * Ws + x] = Math.min(1.25, (0.58 + 0.55 * hot) * (0.85 + 0.3 * Math.random())); h[(Hs - 2) * Ws + x] = Math.max(h[(Hs - 2) * Ws + x] * 0.6, h[(Hs - 1) * Ws + x] * 0.97); }
        o.sc = (o.sc + 0.9) % (Hs * 3); const s0 = o.sc | 0;
        for (let y = 0; y < Hs - 2; y++) for (let x = 0; x < Ws; x++) {
          const r = Math.random(), off = Math.round(r * 2.6 - 1.3), sx = (x - off + Ws) % Ws;
          const tx = o.tex[((y + s0) % (Hs * 3)) * Ws + x], dec = r * r * r * (4.6 / reach) * (0.1 + 2.4 * tx * tx);
          h[y * Ws + x] = Math.max(0, h[(y + 1) * Ws + sx] - dec);
        }
      }
      o.warm = true;
      const stops = [[0, 0, 0, 0], [.16, 51, 0, 0], [.34, 178, 18, 0], [.52, 255, 77, 0], [.7, 255, 148, 13], [.84, 255, 209, 77], [.94, 255, 242, 178], [1, 255, 255, 235]];
      const flick = 0.9 + 0.06 * Math.sin(t * 7.3) + 0.05 * Math.random();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * 2 * Ws + x * 2; let v = (h[i] + h[i + 1] + h[i + Ws] + h[i + Ws + 1]) / 4;
        v = Math.pow(Math.min(1, v * flick), 1.6); if (v < 0.03) continue;
        let k = 1; while (k < stops.length - 1 && stops[k][0] < v) k++;
        const A = stops[k - 1], B = stops[k], f = (v - A[0]) / (B[0] - A[0] || 1);
        px[y * W + x] = [A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f, A[3] + (B[3] - A[3]) * f];
      }
      if (Math.random() < 0.08) { const x = (Math.random() * W) | 0, y = (H * (0.3 + 0.3 * Math.random())) | 0; px[y * W + x] = [255, 200, 90]; }
    },
    sparkle(px, W, H, t) {
      for (let i = 0; i < W * H * 0.12; i++) { const k = (Math.random() * W * H) | 0; px[k] = hsl(180 + Math.random() * 160, 90, 40 + Math.random() * 40); }
    },
  };

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const walls = [];
  document.querySelectorAll('canvas[data-scene]').forEach(c => {
    const W = +(c.dataset.w || 40), H = +(c.dataset.h || 21), scene = S[c.dataset.scene] || S.beat, g = c.getContext('2d');
    const o = {c, g, W, H, scene, vis: true, off: Math.random() * 10};
    walls.push(o);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => o.vis = e.isIntersecting)).observe(c);
  });
  function size(o) {
    const r = o.c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    o.c.width = Math.max(1, r.width * d | 0); o.c.height = Math.max(1, r.height * d | 0);
  }
  walls.forEach(size); addEventListener('resize', () => walls.forEach(size));
  let last = 0;
  function frame(ms) {
    if (ms - last > 45) { last = ms;
      walls.forEach(o => { if (!o.vis && o.drawn) return; o.drawn = true;
        const {c, g, W, H} = o, px = new Array(W * H).fill(null), t = ms / 1000 + o.off;
        o.scene(px, W, H, t, o);
        g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
        const sx = c.width / W, sy = c.height / H, r = Math.min(sx, sy) * 0.38;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const p = px[y * W + x];
          g.fillStyle = p ? `rgb(${p[0] | 0},${p[1] | 0},${p[2] | 0})` : '#14141c';
          g.beginPath(); g.arc(x * sx + sx / 2, y * sy + sy / 2, p ? r : r * 0.8, 0, 6.283); g.fill();
        }
      });
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduce) setTimeout(() => frame(1000), 50);
})();
