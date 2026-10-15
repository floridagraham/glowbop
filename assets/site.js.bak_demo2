// GlowBop site: nav, scroll reveal, and little LED-wall animations used as placeholders until real photos arrive.
(() => {
  const nav = document.querySelector('.nav'), bt = document.querySelector('.burger');

  // 🌈 browser-tab icon slowly cycles colours too (browsers without canvas filters keep the still icon)
  (() => {
    const link = document.querySelector('link[rel=icon]'); if (!link || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const img = new Image(), c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if (!('filter' in g)) return;
    img.onload = () => { let deg = 0; setInterval(() => { if (document.hidden) return; deg = (deg + 15) % 360;
      g.clearRect(0, 0, 64, 64); g.filter = `hue-rotate(${deg}deg)`; g.drawImage(img, 0, 0, 64, 64); link.href = c.toDataURL('image/png'); }, 420); };
    img.src = '/icon.png';
  })();
  // ☰ phone menu: the key reads CLOSE while open; tapping a link, outside the menu, or Escape closes it
  const setMenu = on => { nav.classList.toggle('open', on); if (bt) { bt.textContent = on ? 'CLOSE ✕' : 'MENU'; bt.setAttribute('aria-expanded', on); } };
  if (bt) bt.onclick = e => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); };
  if (nav) {
    nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

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
      // endless gap texture: every row that scrolls out of view is replaced by a new one, so it never loops
      const N = Hs * 3, gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(6.2832 * Math.random());
      const nextRow = () => { let z = Float32Array.from({length: Ws}, gauss);
        for (let p = 0; p < 2; p++) z = z.map((v, x) => (v + z[(x + 1) % Ws] + z[(x + Ws - 1) % Ws]) / 3);
        let sd = 0; z.forEach(v => sd += v * v); sd = Math.sqrt(sd / Ws) + 1e-9;
        const row = new Float32Array(Ws); for (let x = 0; x < Ws; x++) row[x] = 0.62 * o.last[x] + 0.785 * z[x] / sd; o.last = row; return row; };
      if (!o.heat) { o.heat = new Float32Array(Hs * Ws); o.bed = new Float32Array(Ws).map(() => Math.random()); o.last = new Float32Array(Ws);
        o.tex = []; for (let k = 0; k < N; k++) o.tex.push(nextRow()); o.sc = 0; o.prev = 0; o.wind = 0; o.windTo = 0; o.windAt = 0; }
      if (t > o.windAt) { o.windTo = (Math.random() * 2 - 1) * 0.7; o.windAt = t + 10 + Math.random() * 20; }
      o.wind += (o.windTo - o.wind) * 0.01;
      const h = o.heat, reach = 0.8 * Hs;
      for (let step = 0, n = o.warm ? 3 : 90; step < n; step++) {
        if (!o.bt || Math.random() < 0.15) o.bt = Float32Array.from({length: Ws}, () => Math.random());
        for (let x = 0; x < Ws; x++) o.bed[x] += (o.bt[x] - o.bed[x]) * 0.05;
        const kk = Math.max(3, (Ws / 10) | 0), sm = new Float32Array(Ws); let lo = 9, hi = -9;
        for (let x = 0; x < Ws; x++) { let m = 0; for (let k = -kk; k <= kk; k++) m += o.bed[(x + k + Ws) % Ws]; sm[x] = m; lo = Math.min(lo, m); hi = Math.max(hi, m); }
        for (let x = 0; x < Ws; x++) { const hot = (sm[x] - lo) / (hi - lo + 1e-9); h[(Hs - 1) * Ws + x] = Math.min(1.25, (0.58 + 0.55 * hot) * (0.85 + 0.3 * Math.random())); h[(Hs - 2) * Ws + x] = Math.max(h[(Hs - 2) * Ws + x] * 0.6, h[(Hs - 1) * Ws + x] * 0.97); }
        o.sc = (o.sc + 0.9) % N; const s0 = o.sc | 0;
        while (o.prev !== s0) { o.tex[o.prev] = nextRow(); o.prev = (o.prev + 1) % N; }
        for (let y = 0; y < Hs - 2; y++) for (let x = 0; x < Ws; x++) {
          const r = Math.random(), off = Math.round(r * 2.6 - 1.3 + 0.55 * o.wind), sx = ((x - off) % Ws + Ws) % Ws;
          const tx = Math.min(1, Math.max(0, 0.47 + 0.17 * o.tex[(y + s0) % N][x])), dec = r * r * r * (4.6 / reach) * (0.1 + 2.4 * tx * tx);
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

// ✨ GlowBop logo twinkles: random LEDs of the Curtain Burst logo glint white for a moment
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lit = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const d = Math.hypot(c - 3, r - 3); if (d > 0.5 && d < 3.4) lit.push([r, c]); }
  const pos = v => ((158 + v * 118) / 1024 * 100) + '%';
  document.querySelectorAll('img.gb-logo').forEach(img => {
    const w = document.createElement('span'); w.className = 'gb-tw';
    img.parentNode.insertBefore(w, img); w.appendChild(img);
    const tick = () => {
      const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const [r, c] = lit[(Math.random() * lit.length) | 0], s = document.createElement('i');
        s.style.left = pos(c); s.style.top = pos(r); w.appendChild(s); setTimeout(() => s.remove(), 650);
      }
      setTimeout(tick, 250 + Math.random() * 450);
    };
    tick();
  });
})();

// 🎬 Real GlowBop recordings: each clip is a PNG strip (one pixel per LED, frames stacked top to bottom),
// recorded from the actual GlowBop engine and drawn here as an LED wall. Loaded only when scrolled into view.
(() => {
  const cache = {};
  function load(name) {
    if (!cache[name]) cache[name] = new Promise(res => {
      const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0); res(g.getImageData(0, 0, im.width, im.height)); };
      im.onerror = () => res(null); im.src = '/clips/' + name + '.png'; });
    return cache[name];
  }
  const players = [];
  function size(p) { const r = p.c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); p.c.width = Math.max(1, r.width * d | 0); p.c.height = Math.max(1, r.height * d | 0); p.last = -1; }
  function draw(p, data, w, h, f, fade) {
    const g = p.c.getContext('2d'), sx = p.c.width / w, sy = p.c.height / h, r = Math.min(sx, sy) * 0.4, base = f * w * h * 4, px = data.data;
    const ov = p.c.classList.contains('wallov');                      // a live wall inside an app screenshot: app colors
    g.fillStyle = ov ? '#05040a' : '#000'; g.fillRect(0, 0, p.c.width, p.c.height);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = base + (y * w + x) * 4, R = px[i] * fade, G = px[i + 1] * fade, B = px[i + 2] * fade, lit = R + G + B > 24;
      g.fillStyle = lit ? `rgb(${R | 0},${G | 0},${B | 0})` : (ov ? '#16121f' : '#14141c');
      g.beginPath(); g.arc(x * sx + sx / 2, y * sy + sy / 2, lit ? r : r * (ov ? 0.55 : 0.78), 0, 6.283); g.fill();
    }
  }
  document.querySelectorAll('canvas[data-clip], canvas[data-reel]').forEach(c => {
    const list = (c.dataset.reel || c.dataset.clip).split(','), p = {c, list, k: 0, t0: performance.now(), vis: false, last: -1, label: c.dataset.label ? document.getElementById(c.dataset.label) : null};
    players.push(p); size(p);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { p.vis = e.isIntersecting; if (p.vis) { size(p); list.slice(0, 2).forEach(load); } }), {rootMargin: '200px'}).observe(c);
    else { p.vis = true; load(list[0]); }
  });
  addEventListener('resize', () => players.forEach(size));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  async function tick(now) {
    for (const p of players) {
      if (!p.vis) continue;
      const name = p.list[p.k % p.list.length], meta = (window.GB_CLIPS || {})[name]; if (!meta) continue;
      const data = await load(name); if (!data) continue;
      const el = (now - p.t0) / 1000, fps = meta.fps || 15;
      let f = Math.floor(el * fps), fade = 1;
      if (p.list.length > 1) {                                        // showreel: one clip after another
        const dur = meta.n / fps;
        if (el >= dur) { p.k++; p.t0 = now; const nx = p.list[(p.k + 1) % p.list.length]; load(nx); if (p.label) { const m2 = (window.GB_CLIPS || {})[p.list[p.k % p.list.length]]; p.label.textContent = m2 ? m2.title : ''; } continue; }
        fade = Math.min(1, el / 0.35, (dur - el) / 0.35);
      } else f = f % meta.n;
      f = Math.min(f, meta.n - 1);
      if (p.c.clientWidth && Math.abs(p.c.clientWidth * Math.min(2, devicePixelRatio || 1) - p.c.width) > 2) size(p);   // its box changed (a lazy image loaded)
      if (f === p.last && fade === 1) continue; p.last = f;
      draw(p, data, meta.w, meta.h, reduce ? 0 : f, Math.max(0, fade));
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// 🕺 Live hero: the pool-party photo with its two curtains playing real GlowBop recordings.
// Layers: the photo with the lights off, the LEDs (glow + bulbs + a rippling pool reflection), then the dancers in front.
(() => {
  const fig = document.querySelector('.livehero'); if (!fig) return;
  const cv = fig.querySelector('canvas'), g = cv.getContext('2d'), W = 1344, H = 752; cv.width = W; cv.height = H;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;          // keep the still photo
  const list = cv.dataset.hero.split(','), QUADS = [[[338, 72], [646, 90], [646, 413], [340, 413]], [[697, 100], [944, 117], [944, 410], [697, 412]]];
  const CW = 20, CH = 21, WATER = 518;
  const img = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = s; });
  const clip = n => img('/clips/' + n + '.png').then(i => { if (!i) return null; const c = document.createElement('canvas'); c.width = i.width; c.height = i.height;
    const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; });
  // every bulb's spot in the photo (bilinear inside each curtain's outline)
  const spots = [];
  QUADS.forEach((q, ci) => { for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const u = (x + 0.5) / CW, v = (y + 0.5) / CH, tx = q[0][0] + (q[1][0] - q[0][0]) * u, ty = q[0][1] + (q[1][1] - q[0][1]) * u, bx = q[3][0] + (q[2][0] - q[3][0]) * u, by = q[3][1] + (q[2][1] - q[3][1]) * u;
    spots.push({px: tx + (bx - tx) * v, py: ty + (by - ty) * v, cx: ci * CW + x, cy: y}); } });
  const bloom = document.createElement('canvas'); bloom.width = W / 6 | 0; bloom.height = H / 6 | 0; const bg = bloom.getContext('2d');
  const halo = document.createElement('canvas'); halo.width = W / 16 | 0; halo.height = H / 16 | 0; const hg = halo.getContext('2d');
  let plate, dancers, cur = null, k = 0, t0 = 0, vis = true;
  new IntersectionObserver(es => es.forEach(e => vis = e.isIntersecting)).observe(fig);
  async function start() {
    [plate, dancers] = await Promise.all([img('/img/hero-plate.webp'), img('/img/hero-dancers.webp')]);
    if (!plate || !dancers) return;
    cur = await clip(list[0]); clip(list[1]); t0 = performance.now(); cv.classList.add('on'); requestAnimationFrame(tick);
  }
  const cache = {}; const get = n => cache[n] || (cache[n] = clip(n));
  async function tick(now) {
    requestAnimationFrame(tick); if (!vis) return;
    const name = list[k % list.length], meta = (window.GB_CLIPS || {})[name]; const data = await get(name); if (!meta || !data) { k++; return; }
    const fps = meta.fps || 15, dur = meta.n / fps, el = (now - t0) / 1000;
    if (el >= dur) { k++; t0 = now; get(list[(k + 1) % list.length]); return; }
    const f = Math.min(meta.n - 1, Math.floor(el * fps)), fade = Math.max(0, Math.min(1, el / 0.4, (dur - el) / 0.4)), base = f * meta.w * meta.h * 4, t = now / 1000;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(plate, 0, 0, W, H);
    bg.clearRect(0, 0, bloom.width, bloom.height); hg.clearRect(0, 0, halo.width, halo.height);
    g.globalCompositeOperation = 'lighter';
    let sr = 0, sg = 0, sb = 0;
    for (const s of spots) {
      const i = base + (s.cy * meta.w + (s.cx % meta.w)) * 4, R = data[i] * fade, G = data[i + 1] * fade, B = data[i + 2] * fade, lum = R + G + B;
      if (lum < 30) { g.fillStyle = 'rgba(90,90,130,.18)'; g.beginPath(); g.arc(s.px, s.py, 1.6, 0, 6.283); g.fill(); continue; }
      sr += R; sg += G; sb += B;
      const col = `rgb(${R | 0},${G | 0},${B | 0})`;
      bg.fillStyle = col; bg.beginPath(); bg.arc(s.px / 6, s.py / 6, 1.5, 0, 6.283); bg.fill();
      hg.fillStyle = col; hg.fillRect(s.px / 16 - 1, s.py / 16 - 1, 2, 2);
      g.fillStyle = col; g.beginPath(); g.arc(s.px, s.py, 2.3, 0, 6.283); g.fill();
      if (lum > 520) { g.fillStyle = `rgba(255,255,255,${Math.min(0.4, (lum - 520) / 600)})`; g.beginPath(); g.arc(s.px, s.py, 1, 0, 6.283); g.fill(); }
      // reflection in the pool: stretched, rippling streaks
      const ry = WATER + (420 - s.py) * 0.62, wob = Math.sin(t * 2.2 + ry * 0.09) * 3.5 + Math.sin(t * 1.3 + s.px * 0.05) * 2;
      if (ry < H) { g.fillStyle = `rgba(${R | 0},${G | 0},${B | 0},.26)`; g.fillRect(s.px - 1.4 + wob, ry, 2.8, 6); }
    }
    g.globalAlpha = 0.6; g.drawImage(bloom, 0, 0, W, H);                       // soft glow round every bulb
    g.globalAlpha = 0.3; g.drawImage(halo, 0, 0, W, H);                         // wide glow onto the pergola and plants
    const n = spots.length || 1; g.globalAlpha = 0.1;                           // the whole yard picks up the wall's colour
    const amb = g.createRadialGradient(640, 300, 40, 640, 300, 760); amb.addColorStop(0, `rgb(${sr / n * 2.2 | 0},${sg / n * 2.2 | 0},${sb / n * 2.2 | 0})`); amb.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = amb; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(dancers, 300, 180, 690, 380);   // dancers in front of the lights
  }
  if ('IntersectionObserver' in window) start();
})();

// ✨ sparkle logo: random LEDs of the SVG Curtain Burst glint white (same as the app).
// Sets the SVG attributes directly (fill + a slightly bigger dot): works the same in Safari on iPhone / iPad.
(() => {
  document.querySelectorAll('.gbsvg').forEach(host => {
    const lit = [...host.querySelectorAll('circle[data-l]')]; if (!lit.length) return;
    const glint = el => { if (el._on) return; el._on = 1; const f = el.getAttribute('fill');
      el.setAttribute('fill', '#ffffff'); el.setAttribute('r', '5.6');
      setTimeout(() => { el.setAttribute('fill', f); el.setAttribute('r', '4.6'); el._on = 0; }, 300); };
    const tick = () => { if (!document.hidden) { const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) glint(lit[(Math.random() * lit.length) | 0]); }
      setTimeout(tick, 250 + Math.random() * 450); };
    tick();
  });
})();

// 🎛️ Try-it console on the home page: a working mini copy of the GlowBop app. The rail switches sections, the keys
// put real recordings from the GlowBop engine on the little wall, just like the real app does on your lights.
(() => {
  const root = document.getElementById('demo'); if (!root) return;
  const T = [
    {id: 'music', label: 'MUSIC', c: 'var(--pink)', title: 'Show control', mode: ['Music show · listening', 'shuffle on · hearing Speakers', 'var(--green)'],
     p: 'GlowBop hears whatever your computer plays and picks effects for every build-up and drop. Tap a key to feature one.',
     k: [['🌊', 'Big Wave', 'wave-bigwave'], ['🐍', 'Serpent', 'wave-serpent'], ['🎉', 'Neon Party', 'look-neon-party'], ['🌆', 'Synthwave', 'look-synthwave'], ['💥', 'The drop', 'drop'], ['🎲', 'Surprise me', '*']]},
    {id: 'dj', label: 'DJ', c: 'var(--red)', title: 'DJ mode', mode: ['DJ mode', 'hand-played, right on the beat', 'var(--red)'], dj: true,
     p: 'Play the lights by hand. Every pad lands on the next beat. Hold the big key to build, let go to drop.',
     k: [['💥', 'Drop', '!drop'], ['⚡', 'Strobe', '!strobe'], ['⚪', 'Flash', '!flash'], ['🔥', 'Fire burst', '!fire'], ['🎉', 'Confetti', '!confetti'], ['⬛', 'Blackout', '!blackout']]},
    {id: 'looks', label: 'LOOKS', c: 'var(--amber)', title: 'Looks', mode: ['Pinned look', 'stays until you release it', 'var(--amber)'],
     p: 'A look is a mood: colors plus effects for calm, medium and loud moments. 32 of them, plus 200+ effects.',
     k: [['🌌', 'Deep Space', 'look-deep-space'], ['🕹️', 'Retro Arcade', 'look-retro-arcade'], ['🔦', 'Club Rig', 'look-club-rig'], ['🧊', '3D Depth', 'look-3d-depth'], ['🌋', 'Wild Elements', 'look-wild-elements'], ['🎪', 'Mainstage', 'look-mainstage']]},
    {id: 'games', label: 'GAMES', c: '#b6ff3d', title: 'Arcade', mode: ['Game on', 'plays itself, speeds up with the music', '#b6ff3d'],
     p: 'Self-playing pixel games. Tap one and it plays on the wall, speeding up with the music.',
     k: [['🧱', 'Breakout', 'fx-breakout'], ['🐍', 'Snake', 'fx-snakegame'], ['🏓', 'Pong', 'fx-pongbattle'], ['👾', 'Alien parade', 'fx-alienparade'], ['☄️', 'Space rocks', 'fx-vectorrocks'], ['🎆', 'Fireworks', 'fx-pixelfireworks']]},
    {id: 'holiday', label: 'HOLIDAY', c: 'var(--cyan)', title: 'Holidays', mode: ['Holiday', 'only holiday effects, cycling with the music', 'var(--cyan)'],
     p: 'Each holiday gets its own button, plus wide-screen mini-movies for the big nights.',
     k: [['🎃', 'Halloween', 'holiday-halloween'], ['🧙', 'Halloween Night', 'movie-halloweennight'], ['🎄', 'Christmas', 'holiday-christmas'], ['🛷', 'Christmas Eve', 'movie-christmaseve'], ['🎆', 'New Year', 'movie-newyearcountdown'], ['🇺🇸', 'July 4th', 'holiday-july4']]},
    {id: 'fire', label: 'FIRE', c: 'var(--orange)', title: 'Fireplace', mode: ['Fireplace 🔥', 'cozy · flames that never loop', 'var(--orange)'],
     p: 'One tap lights a fire across the whole wall. Nine styles, from a cozy fireplace to dragon breath, in nine colors.',
     k: [['🏕️', 'Campfire', 'fire-campfire'], ['🐉', 'Dragon breath', 'fire-dragon'], ['🌈', 'Rainbow fire', 'fire-rainbow-cozy'], ['🕯️', 'Candle wall', 'fire-candles'], ['🌋', 'Lava rising', 'fire-lava'], ['👻', 'Spirit fire', 'fire-spirit']]},
    {id: 'score', label: 'SPORTS', c: 'var(--violet)', title: 'Scoreboard', mode: ['Scoreboard', 'game day · live stats', 'var(--violet)'],
     p: 'Keep score at the field, follow your team live with real game stats, or put golf, NASCAR and F1 leaderboards on the wall.',
     k: [['⚾', 'Baseball live', 'score-baseball'], ['🏈', 'Football live', 'score-football'], ['🏀', 'Basketball', 'score-basketball'], ['🏒', 'Hockey', 'score-hockey'], ['⛳', 'Golf', 'live-golf'], ['🏁', 'NASCAR', 'live-nascar'], ['🏎️', 'F1 board', 'score-f1']]},
    {id: 'live', label: 'LIVE', c: 'var(--green)', title: 'Pick a live feed', mode: ['Live', 'on the wall until you turn it off', 'var(--green)'],
     p: 'Things from the outside world, live on your lights: countdowns, weather, storm watch and what\'s flying overhead.',
     k: [['🎉', 'Countdown', 'live-countdown'], ['🌦️', 'Weather', 'live-weather'], ['🌀', 'Storm watch', 'live-storm'], ['✈️', 'Overhead', 'live-overhead']]},
    {id: '3d', label: '3D', c: 'var(--lav)', title: '3D shapes', mode: ['Wrapped wall', 'cylinder · globe · box', 'var(--lav)'],
     p: 'Bend your curtains around a cylinder, a box or a globe. GlowBop wraps the picture seamlessly and plays effects made for 3D.',
     k: [['🌍', 'Spinning globe', 'shape-spinningglobe'], ['💈', 'Barber spin', 'shape-barberspin'], ['⭕', 'Rising rings', 'shape-risingrings'], ['🌊', 'Ocean swell', 'wave-oceanswell'], ['〰️', 'Twin waves', 'wave-twinwaves']]},
    {id: 'text', label: 'TEXT', c: 'var(--gold)', title: 'Text & logos', mode: ['Text over the show', 'scroll · beat words · on drop', 'var(--gold)'],
     p: 'Put a name, a message or your logo on top of the show. Flash a word on every drop.',
     k: [['🎂', 'Birthday', 'text-birthday'], ['🥁', 'Beat words', 'text-beat'], ['✨', 'Sparkle', 'sparkle']]},
  ];
  const $ = s => root.querySelector(s), meta = n => (window.GB_CLIPS || {})[n];
  // 🔊 the same console chirps as the app (synthesized, no files); only after a tap, with a mute key
  let actx = null, snd = true;
  try { snd = localStorage.getItem('gb_demo_snd') !== '0'; } catch (e) {}
  const SC = {tap: [[0, 1568, .045], [.05, 2093, .04]], nav: [[0, 1319, .05], [.055, 1047, .05], [.11, 1568, .06]]};
  const STEPS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
  const vary = k => { const base = SC[k][0][1] * [0.75, 0.84, 1, 1, 1.12, 1.26][(Math.random() * 6) | 0], n = SC[k].length + (Math.random() < .3 ? 1 : 0) - (SC[k].length > 2 && Math.random() < .25 ? 1 : 0);
    const gap = .05 * (.8 + Math.random() * .45), d0 = SC[k][0][2] * (.85 + Math.random() * .35), up = Math.random() < .6; let ix = []; for (let i = 0; i < n; i++) ix.push((Math.random() * 6) | 0);
    ix.sort((x, y) => up ? x - y : y - x); return ix.map((s, i) => [i * gap, base * STEPS[s], i === n - 1 ? d0 * 1.3 : d0]); };
  const chirp = k => { if (!snd) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume();
    const t0 = actx.currentTime + .005; vary(k).forEach(([dt, f, d]) => { const o = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter(), t = t0 + dt;
      o.type = 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 2600; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .004);
      g.gain.setValueAtTime(.05, t + d - .012); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(fl); fl.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); }); } catch (e) {} };
  const sb = document.createElement('button'); sb.className = 'd-snd'; const paintS = () => sb.textContent = snd ? '🔊 SOUND' : '🔇 MUTED';
  sb.onclick = () => { snd = !snd; try { localStorage.setItem('gb_demo_snd', snd ? '1' : '0'); } catch (e) {} paintS(); chirp('tap'); }; paintS();
  const stl = root.querySelector('.d-top .st'); if (stl) stl.appendChild(sb);
  const cache = {};
  const load = n => cache[n] || (cache[n] = new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0); res(g.getImageData(0, 0, im.width, im.height)); }; im.onerror = () => res(null); im.src = '/clips/' + n + '.png'; }));
  const cv = $('canvas'), g = cv.getContext('2d');
  let tab = T[0], clip = 'wave-bigwave', t0 = performance.now(), vis = true, lastF = -1, sec = 0;
  const rail = $('.d-rail');
  T.forEach(t => { const b = document.createElement('button'); b.textContent = t.label; b.style.setProperty('--c', t.c); b.onclick = () => { chirp('nav'); pick(t); }; rail.appendChild(b); });
  const tail = document.createElement('i'); tail.className = 'tail'; rail.appendChild(tail);
  const meter = $('.meter'); for (let i = 0; i < 24; i++) meter.appendChild(document.createElement('i'));
  function pick(t, k) {
    tab = t; root.style.setProperty('--c', t.c);
    rail.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.textContent === t.label));
    $('.d-panel .ph span').textContent = t.title; $('.d-panel p').textContent = t.p;
    const keys = $('.keys'); keys.innerHTML = '';
    t.k.forEach(([em, name, cl], i) => { const b = document.createElement('button'); b.innerHTML = `<span class="em">${em}</span>${name}`; b.style.setProperty('--kc', t.c);
      b.dataset.a = cl; b.onclick = () => { chirp('tap'); if (cl[0] === '!') { human(); DJ.press(cl.slice(1), b); } else play(b, name, cl); }; keys.appendChild(b); });
    const ex = $('.dj-extra'); if (ex) ex.remove();
    if (t.dj) {
      const box = document.createElement('div'); box.className = 'dj-extra';
      box.innerHTML = `<button class="dj-build">HOLD TO BUILD</button><div class="dj-lines">${['HANDS UP', 'JUMP', 'MAKE SOME NOISE', 'ONE MORE'].map(w => `<button>${w}</button>`).join('')}</div>`;
      keys.after(box);
      const bb = box.querySelector('.dj-build');
      const st = e => { e.preventDefault(); human(); chirp('nav'); DJ.build(true); bb.classList.add('held'); bb.textContent = 'BUILDING… LET GO!'; };
      const en = () => { if (!DJ.st.build) return; DJ.build(false); bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; chirp('tap'); };
      bb.addEventListener('pointerdown', st); bb.addEventListener('pointerup', en); bb.addEventListener('pointerleave', en); bb.addEventListener('contextmenu', e => e.preventDefault());
      box.querySelectorAll('.dj-lines button').forEach(x => x.onclick = () => { human(); chirp('tap'); DJ.say(x.textContent); });
      DJ.reset(); play(null, 'Neon Party', 'look-neon-party'); return;
    }
    DJ.reset();
    play(keys.children[k || 0], t.k[k || 0][1], t.k[k || 0][2]);
  }
  function play(b, name, cl) {
    if (cl === '*') { const all = Object.keys(window.GB_CLIPS || {}).filter(n => /^(look|fx|wave)-/.test(n)); cl = all[(Math.random() * all.length) | 0]; name = (meta(cl) || {}).title || 'Surprise'; }
    if (b !== null) root.querySelectorAll('.keys button').forEach(x => x.classList.toggle('on', x === b));
    clip = cl; t0 = performance.now(); lastF = -1; load(cl);
    const m = tab.mode; $('.mode').style.setProperty('--mc', m[2]);
    $('.mode b').textContent = ['live', 'holiday', 'score', 'games', 'fire'].includes(tab.id) ? m[0] + ': ' + name : m[0];
    $('.mode small').textContent = m[1];
    $('#dLook').textContent = name; $('#dEff').textContent = ((meta(cl) || {}).title || name).replace(/ ·.*/, '');
    $('.d-wall .ph .r').textContent = '840 BULBS · ' + name.toUpperCase();
  }
  // 🎧 the DJ engine of the demo: hits land on the next beat of a 128 BPM clock, drawn on top of the playing clip
  const BEAT = 60000 / 128, SPECTACLE = ['look-psychedelic', 'look-3d-depth', 'look-rainbow-riot', 'look-hypnotic', 'fx-pixelfireworks', 'look-warehouse-rave', 'look-chaos', 'fx-tesseract', 'look-hyperspace', 'shape-barberspin'];
  let lastHuman = 0; const human = () => { lastHuman = performance.now(); };
  const DJ = {
    st: {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: []},
    reset() { this.st = {flash: 0, strobe: 0, black: false, build: null, parts: [], rings: [], word: null, queue: []}; },
    press(a, btn) {
      if (a === 'blackout') { this.st.black = !this.st.black; if (btn) btn.classList.toggle('on', this.st.black); note(this.st.black ? 'Blackout: tap again to bring it back' : 'Lights back'); return; }
      this.st.queue.push(a); if (btn) { btn.classList.add('armed'); setTimeout(() => btn.classList.remove('armed'), 500); }
      note({drop: 'Drop on the next beat', strobe: 'Strobe on the next beat', flash: 'Flash on the next beat', fire: 'Fire burst on the next beat', confetti: 'Confetti on the next beat'}[a]);
    },
    build(on) { if (on) this.st.build = performance.now(); else { const held = performance.now() - (this.st.build || 0); this.st.build = null; if (held > 350) this.st.queue.push('drop'); } },
    say(w) { this.st.word = {w, t0: performance.now()}; note('Crowd line: ' + w); },
    fire(a, w, h) {
      const S = this.st, P = S.parts, R = Math.random;
      if (a === 'drop') {
        S.flash = 1; S.black = false; S.rings.push({x: w / 2, y: h / 2, r: 0, c: [255, 255, 255]});
        for (let i = 0; i < 70; i++) { const an = R() * 6.283, sp = 8 + R() * 22; P.push({x: w / 2, y: h / 2, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 0, c: [[255, 61, 154], [51, 214, 255], [255, 204, 102], [155, 61, 255]][(R() * 4) | 0]}); }
        play(null, 'The drop', SPECTACLE[(R() * SPECTACLE.length) | 0]); $('#dSec').textContent = 'DROP';
      }
      if (a === 'flash') S.flash = 1;
      if (a === 'strobe') S.strobe = performance.now() + BEAT * 4;
      if (a === 'fire') { for (let i = 0; i < 90; i++) { const an = -Math.PI / 2 + (R() - .5) * 1.6, sp = 10 + R() * 20; P.push({x: w / 2 + (R() - .5) * 6, y: h - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, g: 9, c: [[255, 90, 0], [255, 190, 30], [255, 40, 0], [255, 240, 160]][(R() * 4) | 0]}); }
        S.rings.push({x: w / 2, y: h - 1, r: 0, c: [255, 120, 0]}); }
      if (a === 'confetti') { for (const side of [0, w - 1]) for (let i = 0; i < 40; i++) { const an = -Math.PI / 2 + (side ? -1 : 1) * (.45 + R() * .5), sp = 16 + R() * 12;
        P.push({x: side, y: h - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1.6, g: 14, c: [[255, 61, 154], [51, 214, 255], [255, 204, 102], [60, 224, 138], [204, 153, 255], [255, 255, 255]][(R() * 6) | 0]}); } }
    },
    apply(buf, w, h, now, dt) {
      const S = this.st;
      const beatIdx = Math.floor(now / BEAT); if (S.queue.length && beatIdx !== this._lb) { S.queue.forEach(a => this.fire(a, w, h)); S.queue = []; }
      this._lb = beatIdx;
      const add = (x, y, c, k) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= w || y >= h) return; const i = (y * w + x) * 3; buf[i] = Math.max(buf[i], c[0] * k); buf[i + 1] = Math.max(buf[i + 1], c[1] * k); buf[i + 2] = Math.max(buf[i + 2], c[2] * k); };
      if (S.build) {                                                  // rising wall of light, faster and whiter
        const k = Math.min(1, (now - S.build) / 6000), rate = 2 + 14 * k * k, pulse = .5 + .5 * Math.sin(now / 1000 * rate * 6.283), top = h * (1 - k);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; for (let c = 0; c < 3; c++) buf[i + c] *= 1 - .55 * k;
          if (y >= top) { const hue = (x / w + now / 2500) % 1, col = [.5 + .5 * Math.cos(6.283 * hue), .5 + .5 * Math.cos(6.283 * (hue - .33)), .5 + .5 * Math.cos(6.283 * (hue - .66))];
            const lv = (.3 + .6 * k * pulse) * 255; for (let c = 0; c < 3; c++) buf[i + c] = Math.max(buf[i + c], (col[c] * (1 - k) + k) * lv); }
          if (Math.random() < .01 + .05 * k) { buf[i] = buf[i + 1] = buf[i + 2] = 255; } }
      }
      for (const r of S.rings) { r.r += dt * 26; for (let a = 0; a < 6.283; a += .12) add(r.x + Math.cos(a) * r.r, r.y + Math.sin(a) * r.r * .9, r.c, Math.max(0, 1 - r.r / 30)); }
      S.rings = S.rings.filter(r => r.r < 30);
      for (const q of S.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .97; q.vy = q.vy * .97 + q.g * dt; q.l -= dt * .9; if (q.l > 0) add(q.x, q.y, q.c, Math.min(1, q.l * 1.4)); }
      S.parts = S.parts.filter(q => q.l > 0);
      if (S.word) {                                                   // big scrolling words over a dimmed show
        const el = now - S.word.t0, dur = 2600; if (el > dur) S.word = null;
        else { const m = textMask(S.word.w, h); const x0 = Math.round(w - (el / dur) * (w + m.w)), y0 = Math.max(0, ((h - m.h) / 2) | 0), hue = el / 700;
          for (let i = 0; i < buf.length; i++) buf[i] *= .35;
          const col = [.5 + .5 * Math.cos(6.283 * hue), .5 + .5 * Math.cos(6.283 * (hue - .33)), .5 + .5 * Math.cos(6.283 * (hue - .66))].map(v => 120 + 135 * v);
          for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.a[y * m.w + x]) { const X = x + x0, Y = y + y0; if (X >= 0 && X < w && Y < h) { const i = (Y * w + X) * 3; buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; } } }
      }
      if (S.strobe > now) { const on = Math.floor(now / 55) % 2 === 0; for (let i = 0; i < buf.length; i++) buf[i] = on ? 255 : buf[i] * .05; }
      if (S.flash > .01) { for (let i = 0; i < buf.length; i++) buf[i] = Math.max(buf[i], 255 * S.flash); S.flash *= Math.pow(.02, dt); }
      if (S.black) for (let i = 0; i < buf.length; i++) buf[i] = 0;
      return S.build || S.parts.length || S.rings.length || S.word || S.strobe > now || S.flash > .01 || S.black || S.queue.length;
    },
  };
  const masks = {};
  function textMask(w, h) {                                          // the words as an LED bitmap, h rows tall
    if (masks[w]) return masks[w];
    const c = document.createElement('canvas'), fs = Math.max(8, Math.round(h * .62)); c.height = fs + 4; c.width = w.length * fs;
    const x = c.getContext('2d'); x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; const tw = Math.ceil(x.measureText(w).width) + 2; c.width = tw;
    x.font = `800 ${fs}px 'Saira Condensed', 'Arial Narrow', sans-serif`; x.fillStyle = '#fff'; x.textBaseline = 'top'; x.fillText(w, 1, 1);
    const d = x.getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return (masks[w] = {w: c.width, h: c.height, a});
  }
  let toastT = 0; function note(t) { const el = $('.hint'); if (!el || !t) return; el.textContent = '🎧 ' + t; toastT = performance.now(); }
  // 🤖 auto DJ: on the DJ tab, if nobody touches it, GlowBop plays a little set by itself
  let nextAuto = 0, autoBuild = null;
  function autoDJ(now) {
    if (!tab.dj || now - lastHuman < 7000) { $('.mode small').textContent = tab.mode[1]; return; }
    $('.mode small').textContent = 'AUTO DJ · tap a pad to take over';
    if (autoBuild && now > autoBuild) { DJ.build(false); autoBuild = null; const bb = $('.dj-build'); if (bb) { bb.classList.remove('held'); bb.textContent = 'HOLD TO BUILD'; } nextAuto = now + 2600; return; }
    if (autoBuild || now < nextAuto) return;
    const r = Math.random(), keys = [...root.querySelectorAll('.keys button')];
    if (r < .16) { DJ.build(true); autoBuild = now + 3200; const bb = $('.dj-build'); if (bb) { bb.classList.add('held'); bb.textContent = 'BUILDING… LET GO!'; } note('Auto DJ: building…'); return; }
    if (r < .28) { DJ.say(['HANDS UP', 'JUMP', 'MAKE SOME NOISE', 'ONE MORE'][(Math.random() * 4) | 0]); nextAuto = now + 3000; return; }
    const a = ['drop', 'fire', 'confetti', 'strobe', 'flash', 'fire', 'confetti'][(Math.random() * 7) | 0];
    const b = keys.find(x => x.dataset.a === '!' + a); if (b) { b.classList.add('auto'); setTimeout(() => b.classList.remove('auto'), 350); }
    DJ.press(a, null); nextAuto = now + 1500 + Math.random() * 1600;
  }
  let pxBuf = null, lastNow = performance.now();
  function draw(data, w, h, f, now, dt) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1), W = Math.max(1, r.width * d | 0), H = Math.max(1, r.height * d | 0);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (!pxBuf || pxBuf.length !== w * h * 3) pxBuf = new Float32Array(w * h * 3);
    const base = f * w * h * 4, px = data.data;
    for (let i = 0, n = w * h; i < n; i++) { pxBuf[i * 3] = px[base + i * 4]; pxBuf[i * 3 + 1] = px[base + i * 4 + 1]; pxBuf[i * 3 + 2] = px[base + i * 4 + 2]; }
    const busy = DJ.apply(pxBuf, w, h, now, dt);
    const sx = W / w, sy = H / h, rad = Math.min(sx, sy) * 0.42;
    g.fillStyle = '#05040a'; g.fillRect(0, 0, W, H); let sum = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3, R = Math.min(255, pxBuf[i]) | 0, G = Math.min(255, pxBuf[i + 1]) | 0, B = Math.min(255, pxBuf[i + 2]) | 0, lit = R + G + B > 24; sum += R + G + B;
      g.fillStyle = lit ? `rgb(${R},${G},${B})` : '#16121f'; g.beginPath(); g.arc(x * sx + sx / 2, y * sy + sy / 2, lit ? rad : rad * 0.55, 0, 6.283); g.fill();
    }
    return [sum / (w * h * 765), busy];
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => vis = e.isIntersecting)).observe(root);
  let busyLast = false;
  async function tick(now) {
    requestAnimationFrame(tick); const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now; if (!vis) return;
    autoDJ(now);
    if (toastT && now - toastT > 2500) { toastT = 0; const el = $('.hint'); if (el) el.textContent = '👈 Tap the colored rail to switch sections'; }
    const m = meta(clip); const data = await load(clip); if (!m || !data) return;
    const f = reduce ? 0 : Math.floor((now - t0) / 1000 * (m.fps || 15)) % m.n; if (f === lastF && !busyLast) return; lastF = f;
    const [lvl, busy] = draw(data, m.w, m.h, f, now, dt); busyLast = !!busy;
    const lit = Math.round(Math.min(1, lvl * 3.2) * 24);
    meter.querySelectorAll('i').forEach((el, i) => el.style.background = i < lit ? (i < 9 ? 'var(--cyan)' : i < 15 ? 'var(--violet)' : i < 20 ? 'var(--pink)' : 'var(--amber)') : '');
    const s = Math.floor(now / 4000) % 4; if (s !== sec && !(tab.dj && DJ.st.build)) { sec = s; $('#dSec').textContent = ['GROOVE', 'BUILD', 'DROP', 'BREAK'][s]; }
    if (tab.dj && DJ.st.build) $('#dSec').textContent = 'BUILD';
  }
  pick(T.find(t => t.dj) || T[0]); requestAnimationFrame(tick);
})();
