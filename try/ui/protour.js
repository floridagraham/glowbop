/* ✨ PRO SALES CARDS (Oct 17, Graham: "it should be a sales page, not just words... everything else is so wild and colorful").
   The Pro upgrade page's feature cards (core.js builds them, the spotlight tour cycles them) become sales cards:
   a big animated light wall showing the feature in action, a punchy headline, one short line, the full story under "More",
   and an Upgrade button on every card. The spotlit card grows and glows; the others stay bright. */
(function () {
  'use strict';
  const esc = GB.esc;
  const KICK = {'Pro Art': 'Unleash', 'Pro Home': 'Unlock', 'Pro DJ mode': 'Unleash', 'DJ power tools': 'Unlock', 'Unlimited lights': 'Set them free',
    'Zones': 'Unlock', 'Pad Recorder': 'Unleash', 'Autoloops': 'Unlock', 'Scenes': 'Unlock', 'Cues': 'Unlock', 'Tempo toolbox': 'Unlock', 'Palettes': 'Unlock',
    'Song Shows': 'Unleash', 'Fader board': 'Unlock', 'Override keys': 'Unlock', 'Interlude': 'Unlock', 'All groups': 'Unleash'};
  const SELL = {
    'Pro Art': ['Your lights, any shape', 'Hearts, letters, your logo. Map it from a file.'],
    'Pro Home': ['Run the whole house', 'Scenes, sunset schedules and bedtime, all automatic.'],
    'Pro DJ mode': ['Play your lights like an instrument', 'Music, faders, loops and cues on one page.'],
    'DJ power tools': ['Every pad unlocked', 'All 13 hit pads, every build and drop, USB controllers.'],
    'Unlimited lights': ['No limits', 'Hang as many lights as you want. All in sync.'],
    'Zones': ['Split the wall', 'Every zone its own color and its own fader.'],
    'Pad Recorder': ['Fire it on the beat', 'Record pad phrases, loop them over any song.'],
    'Autoloops': ['32 looks, one tap', 'Beat-synced loops that drop in on the next bar.'],
    'Scenes': ['Save the moment', 'Bring back any look with a smooth fade.'],
    'Cues': ['Run your event', 'One big GO key for every big moment.'],
    'Tempo toolbox': ['Every flash on the kick', 'Lock the beat, nudge it, nail it.'],
    'Palettes': ['Your colors only', 'Lock the whole show to your palette.'],
    'Song Shows': ['Same song, same show', 'Program a song once. It plays perfect every time.'],
    'Fader board': ['Ride the faders', 'Master, speed, strobe and color, live.'],
    'Override keys': ['Panic buttons', 'Blackout, full white or strobe in one touch.'],
    'Interlude': ['Speech mode', 'One tap: a calm glow while people talk.'],
    'All groups': ['Every light, its own show', 'Run different shows on different lights at once.'],
  };
  // ---------------------------------------------------------------- tiny light-wall scenes: (x, y, t, W, H) -> [r, g, b] 0..1
  const hsv = (h, s, v) => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), u = v * (1 - (1 - f) * s);
    return [[v, u, p], [q, v, p], [p, v, u], [p, q, v], [u, p, v], [v, p, q]][i % 6]; };
  const beat = (t, bpm) => { const ph = (t * (bpm || 124) / 60) % 1; return Math.exp(-ph * 5); };
  const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const BURST = [[0, 0, 1, 1, 1, 0, 0], [0, 1, 2, 2, 2, 1, 0], [1, 2, 3, 3, 3, 2, 1], [1, 2, 3, 4, 3, 2, 1], [1, 2, 3, 3, 3, 2, 1], [0, 1, 2, 2, 2, 1, 0], [0, 0, 1, 1, 1, 0, 0]];
  const BCOL = [null, hex('#33d6ff'), hex('#9b3dff'), hex('#ff3d9a'), [1, 1, 1]];
  const SCENE = {
    'Pro Art': (x, y, t, W, H) => {                 // a heart traced by a rainbow chase, then the GlowBop logo sign bursts in
      const ph = Math.floor(t / 4) % 2, cx = W / 2 - .5, cy = H / 2 - .5;
      if (ph) { const s = Math.floor(H / 7.5) || 1, ox = Math.round(cx - 3 * s), oy = Math.round(cy - 3 * s), gx = (x - ox) / s, gy = (y - oy) / s;
        if (gx >= 0 && gy >= 0 && gx < 7 && gy < 7 && (x - ox) % s === 0 && (y - oy) % s === 0) { const k = BURST[gy | 0][gx | 0]; if (k) { const d = Math.hypot(gx - 3, gy - 3), pl = .55 + .45 * Math.sin(t * 5 - d * 1.3); return BCOL[k].map(c => c * pl); } }
        return [0, 0, 0]; }
      const u = (x - cx) / (H * .55), v = -(y - cy) / (H * .55) + .15, f = (u * u + v * v - 1) ** 3 - u * u * v * v * v;
      if (Math.abs(f) < .09) { const a = Math.atan2(v, u) / (2 * Math.PI); return hsv(a + t * .4, 1, .95); }
      return f < 0 ? hsv(.92, 1, .12 + .1 * beat(t)) : [0, 0, 0];
    },
    'Pro Home': (x, y, t, W, H) => {                // 🏠 the house follows the season: haunted in October, Christmas in December, a warm evening the rest of the year
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
    'Pro DJ mode': (x, y, t, W, H) => {             // equaliser bars on the beat
      const b = beat(t, 126), lv = (.35 + .55 * Math.abs(Math.sin(x * .7 + t * 3.1)) * (.6 + .4 * b)) * H;
      return H - y <= lv ? hsv(.85 + (H - y) / H * .35 + x / W * .1, 1, 1) : [0, 0, 0];
    },
    'DJ power tools': (x, y, t, W, H) => {          // hit pads: bursts popping all over the wall
      let c = [0, 0, 0];
      for (let k = 0; k < 4; k++) { const s = Math.floor(t * 2.2 + k * .25), px = (Math.sin(s * 12.9 + k) * .5 + .5) * W, py = (Math.sin(s * 7.7 + k * 3) * .5 + .5) * H, age = (t * 2.2 + k * .25) % 1;
        const d = Math.abs(Math.hypot(x - px, y - py) - age * W * .45); if (d < 1.1) { const col = hsv(s * .37 + k * .25, 1, 1 - age); c = c.map((v, i) => Math.max(v, col[i])); } }
      return c;
    },
    'Unlimited lights': (x, y, t, W, H) => {        // panel after panel joins the wall
      const n = 1 + Math.floor(t * 1.5) % 6, pw = W / 6, k = Math.floor(x / pw); if (k >= n || (x % pw) > pw - 1.2) return [0, 0, 0];
      return hsv(k / 6 + t * .1 + y / H * .2, .9, .9);
    },
    'Zones': (x, y, t, W, H) => { const z = (x < W / 2 ? 0 : 1) + (y < H / 2 ? 0 : 2), b = .25 + .75 * Math.max(0, Math.sin(t * 3 - z * 1.57)); return hsv([.55, .9, .3, .13][z], 1, b); },
    'Pad Recorder': (x, y, t, W, H) => {            // a recorded phrase replaying: columns firing in sequence
      const st = Math.floor(t * 4) % 8, col = Math.floor(x / (W / 8)), pat = [1, 0, 1, 1, 0, 1, 0, 1];
      return col === st && pat[st] ? hsv(st / 8, 1, 1) : col === st ? [.15, .15, .2] : hsv(col / 8, 1, .12);
    },
    'Autoloops': (x, y, t, W, H) => { const bank = Math.floor(t / 2.5) % 3, b = beat(t, 128);
      if (bank === 0) return hsv(x / W + t * .3, 1, .4 + .6 * b);
      if (bank === 1) return hsv(.55 + .1 * Math.sin(y * .5 + t), 1, .5 + .5 * Math.sin(x * .6 - t * 4));
      return (x + y + Math.floor(t * 8)) % 4 === 0 ? hsv(.9, .2, 1) : hsv(.8, 1, .25 * b); },
    'Scenes': (x, y, t, W, H) => { const L = [s => hsv(.92 + x / W * .1, 1, .9), s => hsv(.5 + y / H * .1, 1, .8), s => hsv(.13, .9, .7 + .3 * Math.sin(x + t))];
      const i = Math.floor(t / 2) % 3, f = Math.min(1, (t % 2) / .8), a = L[(i + 2) % 3](), b = L[i](); return a.map((v, k) => v * (1 - f) + b[k] * f); },
    'Cues': (x, y, t, W, H) => { const c = Math.floor(t / 1.6) % 4, f = (t % 1.6) < .15; if (f) return [1, 1, 1];
      return [hsv(.95, .8, .8), hsv(.6, .9, .7 + .3 * Math.sin(x * .5 + t * 3)), hsv(.12, 1, .9), hsv(.35, .9, .6 + .4 * (y / H))][c]; },
    'Tempo toolbox': (x, y, t, W, H) => { const b = beat(t, 120), ring = Math.abs(Math.hypot(x - W / 2, y - H / 2) - (1 - b) * W * .5) < 1.2; return ring ? hsv(.55, .8, 1) : hsv(.6, 1, .25 * b); },
    'Palettes': (x, y, t, W, H) => { const P = ['#ff3d9a', '#33d6ff', '#9b3dff', '#3ce08a', '#ffcc33'].map(hex), k = Math.floor((x + y * .5 + t * 6) / 3) % P.length; return P[(k + P.length) % P.length]; },
    'Song Shows': (x, y, t, W, H) => { const sec = Math.floor(t / 1.8) % 4, pos = (t % 1.8) / 1.8;
      if (y === H - 1) return x / W < pos ? hsv(sec * .25, 1, 1) : [.1, .1, .14];
      return sec === 3 ? (Math.random() < .2 ? [1, 1, 1] : [0, 0, 0]) : hsv(sec * .25 + x / W * .15, 1, .35 + .65 * beat(t)); },
    'Fader board': (x, y, t, W, H) => { const m = .5 + .5 * Math.sin(t * 1.2), h = .5 + .5 * Math.sin(t * .7); return hsv(h + x / W * .2, 1, m * (y / H * .5 + .5)); },
    'Override keys': (x, y, t, W, H) => { const k = Math.floor(t / 1.2) % 3; if (k === 0) return [0, 0, 0]; if (k === 1) return [1, 1, 1]; return Math.floor(t * 16) % 2 ? [1, 1, 1] : [0, 0, 0]; },
    'Interlude': (x, y, t, W, H) => hsv(.5 + .15 * Math.sin(x * .2 + t * .4) + .1 * Math.sin(y * .3 - t * .3), .8, .25 + .2 * Math.sin(x * .3 + y * .2 + t * .6)),
    'All groups': (x, y, t, W, H) => x < W / 3 ? hsv(.92, 1, .5 + .5 * beat(t)) : x < 2 * W / 3 ? hsv(.55 + y / H * .2, 1, .8) : hsv(x / W + t * .5, 1, .9),
  };
  // 🎨 Oct 17 (Graham: "turn our logo into... it goes from 2D to 3D"): the GlowBop burst logo, flat on the wall, then each ring rises into
  //   a column of light (the white center tallest), the logo tilts and spins in 3D, and settles back flat. Drawn in real perspective.
  const DRAW = {
    'Pro Art': (g, Wp, Hp, t, dpr) => {          // flat logo -> 3D columns -> spins -> every bulb flies into a spinning globe -> folds back flat
      const L = 13, T = t % L, ease = v => v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v);
      const up = ease((T - 1.2) / 1.4) * (1 - ease((T - 10.6) / 1.4));                 // columns rise, and sink at the very end
      const glb = ease((T - 5.2) / 1.6) * (1 - ease((T - 9.4) / 1.6));                  // into the globe and back out
      const spin = ease((T - 2.6) / 2.6) * Math.PI * 2 + ease((T - 6.8) / 3) * Math.PI * 2.5;
      const tilt = .62 * up * (1 - glb) + .38 * glb, ry = spin + .35 * up * Math.sin(T * .9) * (1 - glb);
      const s = Math.min(Hp * .105, Wp * .06), cx = Wp * (Wp > Hp * 2.2 ? .7 : .62), cy = Hp * .5, f = Hp * 3.2, R = s * 3.6;
      if (!DRAW._pts) {                             // every bulb: its logo spot, its column layer and its spot on the globe (golden-angle sphere)
        const src = []; for (let gy = 0; gy < 7; gy++) for (let gx = 0; gx < 7; gx++) { const k = BURST[gy][gx]; if (!k) continue; const n = 1 + Math.round(k * 1.6); for (let l = 0; l < n; l++) src.push([gx - 3, gy - 3, l, n, k]); }
        const N = src.length, ga = Math.PI * (3 - Math.sqrt(5));
        DRAW._pts = src.map((q, i) => { const yy = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - yy * yy), th = i * ga; return q.concat([Math.cos(th) * rr, yy, Math.sin(th) * rr]); });
      }
      const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(tilt), sxr = Math.sin(tilt), pulse = .75 + .25 * Math.sin(t * 4);
      const P = DRAW._pts.map(([gx, gy, l, n, k, ux, uy, uz]) => {
        const lx = gx * s, ly = gy * s, lz = -l * s * .62 * up, x = lx + (ux * R - lx) * glb, y = ly + (uy * R - ly) * glb, zz = lz + (uz * R - lz) * glb;
        let X = x * cyr + zz * syr, Z = -x * syr + zz * cyr, Y = y * cxr - Z * sxr; Z = y * sxr + Z * cxr;
        const sc = f / (f + Z); return [cx + X * sc, cy + Y * sc, Z, sc, k, l, n, uy];
      }).sort((a, b) => b[2] - a[2]);
      P.forEach(([x, y, Z, sc, k, l, n, uy]) => {
        let c = BCOL[k]; if (glb > 0) { const h = hsv(.5 + uy * .25 + t * .05, .85, 1); c = c.map((v, i) => v * (1 - glb) + h[i] * glb); }
        const top = l === n - 1, depth = Math.max(.35, Math.min(1, 1 - Z / (R * 2.5))), lift = up * (1 - glb);
        const v = (top || lift < .05 ? 1 : .55 + .35 * (l / Math.max(1, n - 1))) * (k === 4 && glb < .5 ? pulse : 1) * (glb > 0 ? depth * glb + (1 - glb) : 1), r = s * .36 * sc * (1 - .35 * glb);
        g.fillStyle = `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${.18 * v})`; g.beginPath(); g.arc(x, y, r * 2.1, 0, 6.3); g.fill();
        g.fillStyle = `rgb(${Math.min(255, c[0] * 255 * v + 40 * v) | 0},${Math.min(255, c[1] * 255 * v + 40 * v) | 0},${Math.min(255, c[2] * 255 * v + 40 * v) | 0})`; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); });
    },
  };
  const fallback = (x, y, t, W, H) => hsv(x / W + y / H * .3 + t * .2, 1, .7);

  // ---------------------------------------------------------------- cards
  GB.css(`
  #pg-pro .pt-feats { grid-auto-rows:max-content; align-content:start; }
  /* 🚪 every door its own page */
  .pt-f.sold.lead .pt-wall { height:clamp(190px, 22vw, 340px); }
  .pt-f.sold.lead .pt-big { font-size:clamp(36px, 4.4vw, 76px); }
  .pt-f.sold.lead .pt-kk { font-size:clamp(15px, 1.6vw, 26px); }
  @media (min-width: 900px) {
    #pg-pro .pt-feats[data-door=home] { grid-template-columns:repeat(3, minmax(0, 1fr)) !important; }
    #pg-pro .pt-feats[data-door=home] .pt-f.lead { grid-column:span 2; }
    #pg-pro .pt-feats[data-door=dj] { grid-template-columns:repeat(4, minmax(0, 1fr)) !important; gap:8px; }
    #pg-pro .pt-feats[data-door=dj] .pt-f.lead { grid-column:1 / -1; }
    #pg-pro .pt-feats[data-door=dj] .pt-f.sold:not(.lead) .pt-big { font-size:clamp(24px, 2.1vw, 38px); }
    #pg-pro .pt-feats[data-door=art] { grid-template-columns:repeat(2, minmax(0, 1fr)) !important; gap:16px; }
    #pg-pro .pt-feats[data-door=art] .pt-f.lead { grid-column:1 / -1; }
    #pg-pro .pt-feats[data-door=art] .pt-f.sold:not(.lead) .pt-wall { height:clamp(180px, 18vw, 280px); }
  }
  /* PRO HOME: warm gold, soft rounded cards, words bottom-left like a magazine */
  #pg-pro .pt-feats[data-door=home] .pt-f.sold { border-radius:22px; border-left-width:1px; background:linear-gradient(180deg, #2a1a06, #0f0a12 70%); border-color:#ffb23d66; }
  #pg-pro .pt-feats[data-door=home] .pt-f.sold .pt-on { justify-content:flex-end; background:linear-gradient(0deg, #000d 0%, #0006 60%, transparent 100%); }
  #pg-pro .pt-feats[data-door=home] .pt-kk { background:#ffb23d; }
  /* PRO DJ: neon pink club, sharp corners, words centred */
  #pg-pro .pt-feats[data-door=dj] .pt-f.sold { border-radius:0; border:2px solid var(--c); border-left-width:2px; background:#07040c; box-shadow:inset 0 0 30px -12px var(--c); }
  #pg-pro .pt-feats[data-door=dj] .pt-f.sold .pt-on { align-items:center; text-align:center; background:radial-gradient(ellipse at center, #000c 0%, #0007 55%, transparent 80%); }
  #pg-pro .pt-feats[data-door=dj] .pt-kk { background:var(--pink); color:#fff; box-shadow:0 0 18px -2px var(--pink); }
  /* PRO ART: a violet gallery, framed pictures, words top-left */
  #pg-pro .pt-feats[data-door=art] .pt-f.sold { border-radius:0 26px 0 26px; border:1px solid #cc99ff55; border-left:1px solid #cc99ff55; background:linear-gradient(160deg, #1e0b33, #0b0816 65%); padding:12px 12px 14px; }
  #pg-pro .pt-feats[data-door=art] .pt-f.sold .pt-pic { border-radius:0 18px 0 18px; overflow:hidden; box-shadow:0 0 0 2px #cc99ff66, 0 10px 30px -10px var(--c); }
  #pg-pro .pt-feats[data-door=art] .pt-f.sold .pt-on { justify-content:flex-start; padding-top:16px; }
  #pg-pro .pt-feats[data-door=art] .pt-kk { background:linear-gradient(90deg, var(--pink), var(--violet)); color:#fff; }
  #pg-pro .pt-feats[data-door=art] .pt-f.sold .pt-hd, #pg-pro .pt-feats[data-door=art] .pt-f.sold .pt-ln, #pg-pro .pt-feats[data-door=art] .pt-f.sold details, #pg-pro .pt-feats[data-door=art] .pt-f.sold .pt-bt { padding-left:2px; padding-right:2px; }
  .pt-f.sold { align-items:stretch !important; min-height:fit-content; flex-shrink:0; display:flex !important; flex-direction:column; gap:8px; padding:0 0 12px; overflow:hidden; background:linear-gradient(180deg, color-mix(in srgb, var(--c) 16%, #0b0816), #0b0816 70%); border:1px solid color-mix(in srgb, var(--c) 45%, transparent); border-left:6px solid var(--c); }
  .pt-f.sold .pt-pic { position:relative; width:100%; align-self:stretch; }
  .pt-f.sold .pt-wall { display:block; width:100%; height:clamp(150px, 15vw, 230px); background:#030208; }
  .pt-f.sold .pt-on { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; gap:6px; padding:10px 14px;
    background:linear-gradient(90deg, #000c 0%, #0008 55%, transparent 100%); pointer-events:none; }
  .pt-f.sold .pt-kk { font:900 clamp(13px, 1.25vw, 20px)/1 var(--cond); letter-spacing:3px; text-transform:uppercase; color:#000; background:var(--gold); padding:5px 10px 4px; border-radius:0 8px 0 8px; box-shadow:0 0 18px -2px var(--gold); }
  .pt-f.sold .pt-big { font:900 clamp(30px, 3vw, 54px)/.95 var(--cond); letter-spacing:1px; text-transform:uppercase; color:#fff; max-width:94%;
    text-shadow:0 0 2px #000, 0 2px 0 #000, 0 0 22px var(--c), 0 0 44px color-mix(in srgb, var(--c) 60%, transparent); }
  .pt-feats.touring .pt-f.sold.spot .pt-big { animation:ptHl .7s ease; }
  .pt-f.sold .pt-hd { display:flex; align-items:center; gap:10px; padding:0 12px; }
  .pt-f.sold .pt-hd .pt-ic { width:38px; height:38px; flex:0 0 auto; }
  .pt-f.sold .pt-hl { font:800 calc(15px * var(--fs, 1))/1.05 var(--cond); letter-spacing:1px; text-transform:uppercase; color:#fff; text-shadow:0 0 14px color-mix(in srgb, var(--c) 70%, transparent); }
  .pt-f.sold .pt-hl small { display:block; font:700 calc(11px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--c); text-shadow:none; margin-top:3px; }
  .pt-f.sold .pt-ln { padding:0 12px; margin:0; color:#e9e2ff; font-size:clamp(15px, 1.25vw, 20px); line-height:1.35; }
  .pt-f.sold .pt-bt { display:flex; gap:8px; align-items:center; padding:0 12px; margin-top:auto; }
  .pt-f.sold .pt-up { flex:1; min-height:clamp(42px, 3.4vw, 54px); font-size:clamp(14px, 1.2vw, 18px) !important; border:0; border-radius:0 12px 0 12px; font:800 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; cursor:pointer; color:#000; background:linear-gradient(135deg, #fff4cc, var(--gold) 50%, var(--amber)); }
  .pt-f.sold details { padding:0 12px; color:#cbbcf5; font-size:calc(13px * var(--fs, 1)); line-height:1.4; }
  .pt-f.sold details summary { cursor:pointer; color:var(--c); font:700 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; }
  .pt-f.sold > .pt-ic, .pt-f.sold > .pt-tx, .pt-f.sold > .pt-prev { display:none !important; }
  .pt-feats.touring .pt-f.sold { opacity:.9 !important; filter:none !important; }
  .pt-feats.touring .pt-f.sold.spot { opacity:1 !important; transform:translateY(-4px) scale(1.04) !important; box-shadow:0 0 0 3px var(--c), 0 0 48px -2px var(--c) !important; }
  .pt-feats.touring .pt-f.sold.spot .pt-hl { animation:ptHl .7s ease; } @keyframes ptHl { 40% { transform:scale(1.08); } }
  @media (prefers-reduced-motion: reduce) { .pt-feats.touring .pt-f.sold.spot { transform:none !important; } }
  `);
  function sell() {
    const list = document.querySelector('#pg-pro .pt-feats'); if (!list) return;
    list.querySelectorAll('.pt-f:not(.sold)').forEach(card => {
      const name = card.dataset.f, f = (GB.PRO_FEATURES || []).find(x => x.name === name) || {}, s = SELL[name] || [name, ''];
      card.classList.add('sold');
      const ic = card.querySelector('.pt-ic'); const icHTML = ic ? ic.outerHTML : '';
      card.insertAdjacentHTML('afterbegin', `<div class="pt-pic"><canvas class="pt-wall" aria-hidden="true"></canvas>
          <div class="pt-on"><span class="pt-kk">🔓 ${esc(KICK[name] || 'Unlock')}</span><b class="pt-big">${esc(s[0])}</b></div></div>
        <div class="pt-hd">${icHTML}<div class="pt-hl"><small>${esc(name)} · ${esc(f.tab || '')}</small></div></div>
        <p class="pt-ln">${esc(s[1])}</p>
        <details><summary>More</summary>${esc(f.pitch || '')}</details>
        <div class="pt-bt"><button class="pt-up" type="button">★ Get ${esc(name)}</button></div>`);
      card.querySelector('.pt-up').onclick = () => window.open(GB.buyPro, '_blank', 'noopener');
    });
  }
  // ---------------------------------------------------------------- the animation (only while the upgrade page is open)
  let raf = 0, last = 0;
  function frame(ms) {
    raf = 0; if (GB.page !== 'pro' || document.hidden) return;
    if (ms - last >= 40) {                          // ~25 fps
      last = ms; const t = ms / 1000;
      document.querySelectorAll('#pg-pro .pt-f.sold').forEach(card => {
        const cv = card.querySelector('.pt-wall'); if (!cv) return; const r = cv.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
        const dpr = Math.min(2, devicePixelRatio || 1), Wp = Math.round(r.width * dpr), Hp = Math.round(r.height * dpr);
        if (cv.width !== Wp || cv.height !== Hp) { cv.width = Wp; cv.height = Hp; }
        const g = cv.getContext('2d'), pitch = 11 * dpr, W = Math.max(8, Math.floor(Wp / pitch)), H = Math.max(5, Math.floor(Hp / pitch)), ox = (Wp - W * pitch) / 2 + pitch / 2, oy = (Hp - H * pitch) / 2 + pitch / 2;
        const dr = DRAW[card.dataset.f], fn = dr ? (() => [0, 0, 0]) : (SCENE[card.dataset.f] || fallback), rr = pitch * .34;
        g.fillStyle = '#030208'; g.fillRect(0, 0, Wp, Hp);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const c = fn(x, y, t, W, H), m = Math.max(c[0], c[1], c[2]), px = ox + x * pitch, py = oy + y * pitch;
          if (m > .06) { g.fillStyle = `rgba(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0},${.22 * m})`; g.beginPath(); g.arc(px, py, rr * 1.9, 0, 6.3); g.fill(); }
          g.fillStyle = m > .02 ? `rgb(${Math.min(255, c[0] * 255 + 30 * m) | 0},${Math.min(255, c[1] * 255 + 30 * m) | 0},${Math.min(255, c[2] * 255 + 30 * m) | 0})` : '#120e1e';
          g.beginPath(); g.arc(px, py, rr, 0, 6.3); g.fill();
        }
        if (dr) dr(g, Wp, Hp, t, dpr);
      });
    }
    raf = requestAnimationFrame(frame);
  }
  const refit = () => { try { if (GB.proDJ) { if (GB.proDJ.refit) GB.proDJ.refit(); else GB.proDJ.recompact && GB.proDJ.recompact(); } } catch (e) {} };
  // 🚪 Oct 17 (Graham: "rearrange different ways so when they click on it, it feels like a different page, not the same ad"):
  //   each door gets its own layout and look. The door's own feature leads as a big hero card.
  //   PRO HOME: warm gold, 3 across, the house hero spans two.  PRO DJ: neon pink, 4 tight across, the DJ hero spans the row.
  //   PRO ART: violet gallery, 2 big across, the art hero spans the row.
  let lastDoor = '';
  function dress() {
    const list = document.querySelector('#pg-pro .pt-feats'); if (!list) return;
    const door = GB.proDoor || 'dj', lead = list.firstElementChild;
    list.querySelectorAll('.pt-f.lead').forEach(n => n.classList.remove('lead')); if (lead) lead.classList.add('lead');
    list.dataset.door = door;
  }
  const go = () => { const before = document.querySelectorAll('#pg-pro .pt-f:not(.sold)').length; sell(); dress();
    const door = GB.proDoor || 'dj'; if (before || door !== lastDoor) { lastDoor = door; refit(); setTimeout(refit, 250); }
    if (!raf) raf = requestAnimationFrame(frame); };
  GB.on('page', id => { if (id === 'pro') setTimeout(go, 30); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && GB.page === 'pro') go(); });
  GB.on('ready', () => { if (GB.page === 'pro') go(); });
})();
