/* 🏠 House Builder (Oct 21, Graham: "build it from measurements, trace a photo, and bring from other apps").
   Lives inside LIGHTS → Draw your layout (the layout editor, ui/layout.js) and adds:
     1. Build from measurements: pick a house style, type its size (feet, or metres), and GlowBop draws the house's lines.
     2. Trace a photo: GlowBop finds the roofline, eaves and walls in your photo; you keep the ones you want, mark one thing you
        know the size of ("the garage door is 16 ft"), and every line gets a real length.
     3. Put lights on your lines: pick a light and how far apart its bulbs are; GlowBop fills each line and counts the bulbs.
     4. Bring in a layout from another app: Twinkly, Nanoleaf and WLED maps straight from the light, a WLED ledmap.json file,
        and xLights show folders (through Import from xLights).
   The house's lines are "guides" in the drawn layout (not lights). Real size = doc.scale (drawing units per foot).
   Engine: GET /api/layout/native?id=, POST /api/layout/import (layoutimport.py); everything else saves with the layout. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const L = () => GB.lm;
  GB.css(`
  /* the tools bar and its cards stay out of the way while the layout editor is open */
  body:has(#lmOv:not([hidden])) :is(#gbTools, .gbcard, #slLiveBtn) { display:none !important; }
  .hb-ov { position:fixed; inset:0; z-index:3200; background:#05040ae8; display:flex; align-items:center; justify-content:center; padding:max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom)); }
  .hb-ov[hidden] { display:none; }
  .hb-card { width:min(820px, 100%); max-height:100%; overflow:auto; background:var(--panel, #0d0a18); border:2px solid #ffc04d; border-radius:0 22px 0 22px; padding:14px 16px 18px; display:flex; flex-direction:column; gap:12px; }
  .hb-hd { display:flex; align-items:center; gap:10px; }
  .hb-hd b { flex:1; font:800 calc(20px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:#ffc04d; }
  .hb-hd .btn { min-height:48px; width:48px; padding:0; }
  .hb-start { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:10px; }
  .hb-start button { min-height:120px; border-radius:0 18px 0 18px; border:2px solid var(--c); background:color-mix(in srgb, var(--c) 12%, #0b0814); color:#fff; cursor:pointer;
    display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:4px; padding:14px; text-align:left; }
  .hb-start button svg { width:34px; height:34px; fill:var(--c); margin-bottom:auto; }
  .hb-start button b { font:800 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--c); }
  .hb-start button span { color:var(--dim); font-size:calc(13px * var(--fs, 1)); }
  .hb-row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  .hb-row .chip, .hb-row .btn { min-height:48px; padding:0 14px; }
  .hb-row .chip.on { background:var(--c, #ffc04d); color:#000; }
  .hb-lbl { font:700 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:#ffc04d; margin-bottom:-4px; }
  .hb-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:8px; }
  .hb-grid label { display:flex; flex-direction:column; gap:4px; font:600 calc(13px * var(--fs, 1)) var(--cond); color:var(--dim); }
  .hb-grid input, .hb-grid select { min-height:48px; font-size:calc(17px * var(--fs, 1)); }
  .hb-prev { width:100%; height:auto; max-height:300px; background:#0b0a12; border:1px solid var(--line); border-radius:0 14px 0 14px; display:block; }
  .hb-go { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
  .hb-go .btn { min-height:48px; padding:0 18px; }
  .hb-note { color:var(--dim); font-size:calc(14px * var(--fs, 1)); margin:0; }
  .hb-bar { position:fixed; left:50%; transform:translateX(-50%); bottom:max(10px, env(safe-area-inset-bottom)); z-index:3100; width:min(760px, calc(100% - 20px));
    background:#0d0a18f2; border:2px solid #ffc04d; border-radius:0 18px 0 18px; padding:10px 12px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; box-shadow:0 10px 40px #000c; }
  .hb-bar[hidden] { display:none; }
  .hb-bar p { flex:1 1 220px; margin:0; font:600 calc(14px * var(--fs, 1)) var(--cond); color:#fff; }
  .hb-bar .btn, .hb-bar .chip { min-height:48px; padding:0 14px; }
  .hb-bar input { min-height:48px; width:110px; font-size:calc(17px * var(--fs, 1)); }
  .hb-list { display:flex; flex-direction:column; gap:6px; }
  .hb-li { display:grid; grid-template-columns:48px minmax(0, 1fr) auto; gap:8px; align-items:center; padding:6px 8px; border:1px solid var(--line); border-radius:12px; }
  .hb-li.on { border-color:#ffc04d; box-shadow:inset 0 0 0 1px #ffc04d; }
  .hb-li .ck { width:48px; height:48px; border-radius:12px; border:2px solid #ffc04d; background:transparent; color:#ffc04d; font:800 22px var(--cond); cursor:pointer; }
  .hb-li.on .ck { background:#ffc04d; color:#000; }
  .hb-li b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font:700 calc(15px * var(--fs, 1)) var(--cond); }
  .hb-li small { color:var(--dim); }
  .hb-li .btn { min-height:48px; }
  .hb-sum { font:700 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:#fff; }
  .hb-sum .warn { color:var(--amber, #ffc04d); }
  `);

  // =================================================================== house shapes (feet, y up from the ground; x from the left)
  const STYLES = [['ranch', 'Ranch'], ['two', 'Two-storey'], ['split', 'Split-level']];
  const PITCHES = [4, 6, 8, 10, 12];
  const DEF = {style: 'ranch', w: 40, h: 9, pitch: 6, garage: 'left', gw: 20, porch: false, win: 3, door: true, units: 'ft'};
  let P = Object.assign({}, DEF);
  try { P = Object.assign({}, DEF, JSON.parse(GB.store.get('hb_house', '') || '{}')); } catch (e) {}
  const M = 3.28084;                                                     // feet per metre

  /* -> [{name, part, pts [[x, y] ft, y up], closed}] for the house P */
  function houseLines(p) {
    const out = [], add = (name, part, pts, closed) => out.push({name, part, pts, closed: !!closed});
    const W = Math.max(8, +p.w), H = Math.max(6, +p.h), pitch = Math.max(0, +p.pitch) / 12, oh = 1.5;   // 1.5 ft eave overhang
    const rect = (name, part, x, y, w, h) => add(name, part, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
    const gable = (name, x0, x1, y) => { const mid = (x0 + x1) / 2, top = y + (mid - x0 + oh) * pitch;
      add(name, 'roof', [[x0 - oh, y], [mid, top], [x1 + oh, y]]); add(name.replace('Roof', 'Eave'), 'eave', [[x0 - oh, y], [x1 + oh, y]]); return top; };
    const windows = (x0, x1, y, n, row) => { if (n <= 0) return; const ww = 3, wh = 4, gap = (x1 - x0 - n * ww) / (n + 1);
      if (gap < 0.8) return; for (let i = 0; i < n; i++) rect(`Window ${row ? row + ' ' : ''}${i + 1}`, 'window', x0 + gap + i * (ww + gap), y, ww, wh); };
    let gx0 = null, gx1 = null, hx0 = 0, hx1 = W;
    const gw = p.garage !== 'none' ? Math.min(W * 0.6, Math.max(10, +p.gw)) : 0;
    if (gw) { if (p.garage === 'left') { gx0 = 0; gx1 = gw; hx0 = gw; } else { gx0 = W - gw; gx1 = W; hx1 = W - gw; } }
    if (p.style === 'two') {
      const H2 = H * 2; rect('Walls', 'wall', hx0, 0, hx1 - hx0, H2); gable('Roof', hx0, hx1, H2);
      windows(hx0, hx1, H + 3, p.win, 'upstairs');
      const dx = (hx0 + hx1) / 2 - 1.5; if (p.door) rect('Front door', 'door', dx, 0, 3, 7);
      windows(hx0, p.door ? dx - 1 : hx1, 3, Math.max(0, Math.ceil(p.win / 2)), 'down');
      if (p.door) windows(dx + 4, hx1, 3, Math.floor(p.win / 2), 'down right');
    } else if (p.style === 'split') {
      const lw = (hx1 - hx0) * 0.55, lx1 = hx0 + lw, H2 = H * 2;
      rect('Lower wing', 'wall', hx0, 0, lw, H); gable('Roof (lower wing)', hx0, lx1, H);
      rect('Upper wing', 'wall', lx1, 0, hx1 - lx1, H2); gable('Roof (upper wing)', lx1, hx1, H2);
      windows(lx1, hx1, H + 3, p.win, 'upstairs'); windows(lx1, hx1, 3, Math.max(1, p.win - 1), 'down');
      if (p.door) rect('Front door', 'door', hx0 + lw * 0.65, 0, 3, 7); windows(hx0, hx0 + lw * 0.6, 3, 1, 'bay');
    } else {
      rect('Walls', 'wall', hx0, 0, hx1 - hx0, H); gable('Roof', hx0, hx1, H);
      const dx = (hx0 + hx1) / 2 - 1.5; if (p.door) rect('Front door', 'door', dx, 0, 3, 7);
      windows(hx0, p.door ? dx - 1 : hx1, 3, Math.ceil(p.win / 2), ''); if (p.door) windows(dx + 4, hx1, 3, Math.floor(p.win / 2), 'right');
    }
    if (gw) { const gh = Math.min(H, 10); rect('Garage', 'wall', gx0, 0, gw, gh);
      add('Garage roof', 'roof', [[gx0 - (p.garage === 'left' ? 1.5 : 0), gh], [gx1 + (p.garage === 'right' ? 1.5 : 0), gh]]);
      const dw = Math.min(gw - 2, gw > 15 ? 16 : 9); rect('Garage door', 'garage', gx0 + (gw - dw) / 2, 0, dw, Math.min(7, gh - 1)); }
    if (p.porch) { const px0 = hx0 + (hx1 - hx0) * 0.2, px1 = hx1 - (hx1 - hx0) * 0.2;
      add('Porch roof', 'porch', [[px0, 8], [px1, 8]]); add('Porch post left', 'post', [[px0, 0], [px0, 8]]); add('Porch post right', 'post', [[px1, 0], [px1, 8]]); }
    return out;
  }
  function bounds(lines) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; lines.forEach(l => l.pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); })); return {x0, x1, y0, y1}; }
  function houseSvg(lines, w, h) {
    const b = bounds(lines), pad = 2, k = Math.min((w - 20) / (b.x1 - b.x0 + pad * 2), (h - 20) / (b.y1 - b.y0 + pad * 2));
    const X = x => 10 + (x - b.x0 + pad) * k, Y = y => h - 10 - (y - b.y0 + pad) * k;
    const COL = {roof: '#ff3d9a', eave: '#33d6ff', wall: '#9a8fd0', window: '#ffc04d', door: '#3ce08a', garage: '#3ce08a', porch: '#c58bff', post: '#c58bff'};
    let o = `<path d="M10 ${Y(0)}H${w - 10}" stroke="#2a2640" stroke-width="2"/>`;
    lines.forEach(l => { o += `<path d="M${l.pts.map(([x, y]) => X(x).toFixed(1) + ' ' + Y(y).toFixed(1)).join('L')}${l.closed ? 'Z' : ''}" fill="none" stroke="${COL[l.part] || '#fff'}" stroke-width="${l.part === 'wall' ? 1.6 : 2.6}" stroke-linejoin="round"/>`; });
    const ft = b.x1 - b.x0; o += `<text x="${w / 2}" y="${h - 1}" fill="#8f87b8" font-size="12" text-anchor="middle" font-family="sans-serif">${P.units === 'm' ? (ft / M).toFixed(1) + ' m' : Math.round(ft) + ' ft'} wide</text>`;
    return o;
  }

  // =================================================================== the wizard window
  let ov = null;
  function card(title, html, back) {
    if (!ov) { ov = document.createElement('div'); ov.className = 'hb-ov'; ov.id = 'hbOv'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'House Builder'); document.body.appendChild(ov); }
    ov.hidden = false;
    ov.innerHTML = `<div class="hb-card"><div class="hb-hd">${back ? `<button class="btn" id="hbBack" aria-label="Back">${GB.svg('left')}</button>` : ''}<b>${esc(title)}</b>
      <button class="btn" id="hbX" aria-label="Close">${GB.svg('close')}</button></div>${html}</div>`;
    $('hbX').onclick = close; if (back) $('hbBack').onclick = back;
    return ov.firstChild;
  }
  function close() { if (ov) ov.hidden = true; }
  const bar = (() => { let el = null; return {
    show(html) { if (!el) { el = document.createElement('div'); el.className = 'hb-bar'; el.id = 'hbBar'; document.body.appendChild(el); } el.hidden = false; el.innerHTML = html; return el; },
    hide() { if (el) { el.hidden = true; el.innerHTML = ''; } } }; })();

  async function open() {
    if (!L().isOpen()) await L().open();
    card('House Builder', `<p class="hb-note">Three ways to get your house into GlowBop. You can mix them: build it from measurements, then line it up on a photo.</p>
      <div class="hb-start">
        <button style="--c:#ffc04d" id="hbMeas">${GB.svg('home')}<b>Build from measurements</b><span>Pick your house style and type its size.</span></button>
        <button style="--c:var(--cyan)" id="hbPhoto">${GB.svg('camera')}<b>Trace a photo</b><span>GlowBop finds the roofline, eaves and walls for you.</span></button>
        <button style="--c:var(--green)" id="hbApps">${GB.svg('add')}<b>Bring in from an app</b><span>Twinkly, Nanoleaf, WLED or xLights: use the map you already made.</span></button>
      </div>`);
    $('hbMeas').onclick = measure; $('hbPhoto').onclick = photoStart; $('hbApps').onclick = apps;
  }

  // ------------------------------------------------------------- 1. build from measurements
  function measure() {
    const u = P.units === 'm', show = v => u ? +(v / M).toFixed(1) : Math.round(v), unit = u ? 'm' : 'ft';
    card('Build from measurements', `
      <div class="hb-lbl">House style</div>
      <div class="hb-row" id="hbStyle">${STYLES.map(([k, t]) => `<button class="chip${P.style === k ? ' on' : ''}" data-s="${k}" style="--c:#ffc04d">${t}</button>`).join('')}</div>
      <svg class="hb-prev" id="hbPrev" viewBox="0 0 760 280" aria-label="Your house"></svg>
      <div class="hb-grid">
        <label>Width of the front (${unit})<input type="number" id="hbW" min="3" max="400" step="${u ? 0.1 : 1}" value="${show(P.w)}" inputmode="decimal"></label>
        <label>Wall height, one storey (${unit})<input type="number" id="hbH" min="2" max="40" step="${u ? 0.1 : 1}" value="${show(P.h)}" inputmode="decimal"></label>
        <label>Garage<select id="hbG"><option value="none">None</option><option value="left">On the left</option><option value="right">On the right</option></select></label>
        <label>Garage width (${unit})<input type="number" id="hbGw" min="3" max="60" step="${u ? 0.1 : 1}" value="${show(P.gw)}" inputmode="decimal"></label>
        <label>Front windows<input type="number" id="hbWin" min="0" max="12" value="${P.win}" inputmode="numeric"></label>
      </div>
      <div class="hb-lbl">Roof pitch (rise per 12)</div>
      <div class="hb-row" id="hbPitch">${PITCHES.map(v => `<button class="chip${+P.pitch === v ? ' on' : ''}" data-p="${v}" style="--c:#ff3d9a">${v} / 12</button>`).join('')}</div>
      <div class="hb-row">
        <button class="chip${P.door ? ' on' : ''}" id="hbDoor" style="--c:var(--green)">Front door</button>
        <button class="chip${P.porch ? ' on' : ''}" id="hbPorch" style="--c:var(--violet)">Porch</button>
        <span style="flex:1"></span>
        <button class="chip${u ? '' : ' on'}" data-u="ft" style="--c:var(--cyan)">Feet</button><button class="chip${u ? ' on' : ''}" data-u="m" style="--c:var(--cyan)">Metres</button>
      </div>
      <p class="hb-note">Don't know the exact size? Count your steps along the front (one step is about 2.5 ft) and look at the roof from the side for the pitch.</p>
      <div class="hb-go"><button class="btn c" id="hbMake" style="--c:#ffc04d">${GB.svg('check')}<span>Draw my house</span></button></div>`, open);
    $('hbG').value = P.garage;
    const rd = id => { const v = parseFloat($(id).value); return isFinite(v) ? (u ? v * M : v) : null; };
    const upd = () => { P.w = rd('hbW') || P.w; P.h = rd('hbH') || P.h; P.gw = rd('hbGw') || P.gw; P.garage = $('hbG').value; P.win = Math.max(0, Math.min(12, parseInt($('hbWin').value, 10) || 0));
      $('hbGw').disabled = P.garage === 'none'; $('hbPrev').innerHTML = houseSvg(houseLines(P), 760, 280); };
    ['hbW', 'hbH', 'hbGw', 'hbWin'].forEach(id => $(id).oninput = upd); $('hbG').onchange = upd;
    document.querySelectorAll('#hbStyle [data-s]').forEach(b => b.onclick = () => { P.style = b.dataset.s; document.querySelectorAll('#hbStyle [data-s]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    document.querySelectorAll('#hbPitch [data-p]').forEach(b => b.onclick = () => { P.pitch = +b.dataset.p; document.querySelectorAll('#hbPitch [data-p]').forEach(x => x.classList.toggle('on', x === b)); upd(); });
    $('hbDoor').onclick = () => { P.door = !P.door; $('hbDoor').classList.toggle('on', P.door); upd(); };
    $('hbPorch').onclick = () => { P.porch = !P.porch; $('hbPorch').classList.toggle('on', P.porch); upd(); };
    document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => { upd(); P.units = b.dataset.u; measure(); });
    $('hbMake').onclick = () => { upd(); makeHouse(); };
    upd();
  }
  function makeHouse() {
    try { GB.store.set('hb_house', JSON.stringify(P)); } catch (e) {}
    const D = L().doc(), lines = houseLines(P), b = bounds(lines), pad = 4;
    const wft = b.x1 - b.x0 + pad * 2, hft = b.y1 - b.y0 + pad * 2, k = 1000 / wft;            // drawing units per foot
    const hasItems = D.items.length > 0 || (D.guides || []).length > 0;
    L().snapshot();
    if (!D.photo) D.stage = [1000, Math.max(200, Math.round(hft * k))];
    const S = D.stage, kk = D.photo ? Math.min(S[0] * 0.92 / wft, S[1] * 0.92 / hft) : k;
    const ox = (S[0] - wft * kk) / 2, oy = (S[1] - hft * kk) / 2;
    const toS = ([x, y]) => [+(ox + (x - b.x0 + pad) * kk).toFixed(1), +(oy + (b.y1 + pad - y) * kk).toFixed(1)];
    D.guides = (hasItems ? (D.guides || []).filter(g => !g.house) : []).concat(lines.map((l, i) => ({id: 'h' + i + Math.random().toString(36).slice(2, 5), name: l.name, part: l.part, pts: l.pts.map(toS), closed: l.closed, house: true})));
    D.scale = +kk.toFixed(4); D.house = {style: P.style, w: +P.w.toFixed(1), h: +P.h.toFixed(1), pitch: P.pitch, garage: P.garage, porch: !!P.porch};
    L().fit(); L().refresh();
    GB.sfx && GB.sfx('ok'); GB.toast(`🏠 Your house is drawn: ${lines.length} lines. Now put lights on them.`);
    fillPick();
  }

  // ------------------------------------------------------------- 3. put lights on the lines
  const SPACING = [2, 3, 4, 6, 8, 12];                                  // inches between bulbs
  let F = {sel: new Set(), dev: '', sp: 4, fit: false};
  function fillPick(only) {
    const D = L().doc(), gs = (D.guides || []).filter(g => g.part !== 'wall');
    if (!gs.length) { GB.toast('Draw your house first (measurements or a photo)'); return open(); }
    const devs = L().devs().filter(d => d.enabled);
    if (!F.dev || !devs.find(d => d.id === F.dev)) F.dev = (devs.find(d => d.id === L().act()) || devs[0] || {}).id || '';
    if (only) F.sel = new Set([only]); else if (!F.sel.size) F.sel = new Set(gs.filter(g => ['roof', 'eave', 'porch'].includes(g.part)).slice(0, 2).map(g => g.id));
    const sc = D.scale || 0;
    card('Put lights on your house', `
      <p class="hb-note">${sc ? 'Tick the lines this light runs along, in the order it is wired. GlowBop counts the bulbs from the spacing.' : 'Tick the lines this light runs along. No real size yet, so GlowBop spreads all of the light\'s bulbs over them.'}</p>
      <div class="hb-lbl">Which light</div>
      <div class="hb-row"><select id="hbDev" style="min-height:48px;flex:1 1 220px">${devs.map(d => `<option value="${esc(d.id)}"${d.id === F.dev ? ' selected' : ''}>${esc(d.name)} · ${d.n} bulbs</option>`).join('') || '<option value="">Add a light first</option>'}</select></div>
      ${sc ? `<div class="hb-lbl">Space between bulbs</div><div class="hb-row" id="hbSp">${SPACING.map(v => `<button class="chip${F.sp === v && !F.fit ? ' on' : ''}" data-sp="${v}" style="--c:var(--cyan)">${v} in</button>`).join('')}<button class="chip${F.fit ? ' on' : ''}" data-sp="fit" style="--c:var(--green)">Use all its bulbs</button></div>` : ''}
      <div class="hb-lbl">Lines</div>
      <div class="hb-list" id="hbLines">${gs.map(g => `<div class="hb-li${F.sel.has(g.id) ? ' on' : ''}" data-g="${esc(g.id)}"><button class="ck" aria-label="Use ${esc(g.name)}">${F.sel.has(g.id) ? '✓' : ''}</button>
        <div><b>${esc(g.name || 'Line')}</b><small>${sc ? lenTxt(L().gLen(g) / sc) : ''}</small></div><span></span></div>`).join('')}</div>
      <div class="hb-sum" id="hbSum"></div>
      <div class="hb-go"><button class="btn c" id="hbFill" style="--c:#ffc04d">${GB.svg('bulb')}<span>Put the lights on</span></button></div>`, open);
    const sum = () => {
      const d = L().devs().find(x => x.id === F.dev), lines = gs.filter(g => F.sel.has(g.id)), len = lines.reduce((a, g) => a + L().gLen(g), 0);
      const free = d ? Math.max(0, d.n - L().nextFree(d.id)) : 0;
      let need = sc && !F.fit ? lines.reduce((a, g) => a + Math.max(2, Math.round(L().gLen(g) / sc * 12 / F.sp) + 1), 0) : free;
      $('hbSum').innerHTML = !lines.length ? 'Tick at least one line.' : !d ? '' :
        sc && !F.fit ? `${lenTxt(len / sc)} of lines at ${F.sp} in = <b>${need} bulbs</b>. ${d.name} has <b>${free}</b> left. ${need > free ? `<span class="warn">Not enough bulbs: GlowBop fills as far as they go (or pick a wider spacing).</span>` : ''}`
        : `${d.name}'s ${free} free bulbs spread over ${lines.length} line${lines.length > 1 ? 's' : ''}.`;
    };
    $('hbDev').onchange = e => { F.dev = e.target.value; sum(); };
    document.querySelectorAll('#hbSp [data-sp]').forEach(b => b.onclick = () => { if (b.dataset.sp === 'fit') F.fit = true; else { F.fit = false; F.sp = +b.dataset.sp; } document.querySelectorAll('#hbSp [data-sp]').forEach(x => x.classList.toggle('on', x === b)); sum(); });
    document.querySelectorAll('#hbLines [data-g]').forEach(r => r.onclick = () => { const id = r.dataset.g; F.sel.has(id) ? F.sel.delete(id) : F.sel.add(id); r.classList.toggle('on', F.sel.has(id)); r.querySelector('.ck').textContent = F.sel.has(id) ? '✓' : ''; sum(); });
    $('hbFill').onclick = () => fillGo(gs);
    sum();
  }
  const lenTxt = ft => P.units === 'm' ? (ft / M).toFixed(1) + ' m' : ft >= 1 ? Math.round(ft) + ' ft' : Math.round(ft * 12) + ' in';
  function fillGo(gs) {
    const D = L().doc(), d = L().devs().find(x => x.id === F.dev); if (!d) return GB.toast('Pick a light');
    const lines = gs.filter(g => F.sel.has(g.id)); if (!lines.length) return GB.toast('Tick at least one line');
    const sc = D.scale || 0; let free = Math.max(0, d.n - L().nextFree(d.id)); if (!free) return GB.toast(`All of ${d.name}'s bulbs are already placed. Pick another light, or delete a string first.`);
    const lens = lines.map(g => L().gLen(g)), total = lens.reduce((a, b) => a + b, 0);
    L().snapshot(); L().setAct(d.id); let placed = 0, made = 0;
    lines.forEach((g, i) => {
      if (free <= 0) return;
      let n = sc && !F.fit ? Math.max(2, Math.round(lens[i] / sc * 12 / F.sp) + 1) : Math.max(2, Math.round(free * lens[i] / total));
      if (!sc || F.fit) n = i === lines.length - 1 ? free : Math.min(free, n);
      n = Math.min(n, free);
      L().newItem({kind: 'poly', name: g.name, pts: g.pts.map(p => p.slice()), closed: !!g.closed, count: n, first: L().nextFree(d.id), dev: d.id, guide: g.id});
      free -= n; placed += n; made++;
    });
    close(); L().refresh(); GB.sfx && GB.sfx('ok');
    GB.toast(`💡 ${d.name}: ${placed} bulbs on ${made} line${made > 1 ? 's' : ''}. Tap Test to check the wiring order, then Save.`);
  }

  // ------------------------------------------------------------- 2. trace a photo
  function photoStart() {
    const D = L().doc();
    card('Trace a photo', `
      <p class="hb-note">Stand across the street, face the house straight on, and fit the whole front in the picture. Daytime is best for tracing.</p>
      <div class="hb-start">
        <button style="--c:var(--cyan)" id="hbPick">${GB.svg('camera')}<b>${D.photo ? 'Use a new photo' : 'Take or pick a photo'}</b><span>It stays on your computer.</span></button>
        ${D.photo ? `<button style="--c:#ffc04d" id="hbFind">${GB.svg('search')}<b>Find the lines</b><span>GlowBop looks for the roofline, eaves and walls in your photo.</span></button>` : ''}
        ${D.photo ? `<button style="--c:var(--green)" id="hbSize">${GB.svg('faders')}<b>Set the real size</b><span>Drag over something you know, like the garage door.${D.scale ? ' (Set: ' + lenTxt(1000 / D.scale) + ' across)' : ''}</span></button>` : ''}
        ${D.photo ? `<button style="--c:var(--violet)" id="hbTrace">${GB.svg('edit')}<b>Draw a line myself</b><span>Tap along a roofline or window GlowBop missed.</span></button>` : ''}
      </div>
      <input type="file" id="hbFile" accept="image/*" hidden>`, open);
    $('hbPick').onclick = () => $('hbFile').click();
    $('hbFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; await L().usePhoto(f); setTimeout(() => { photoStart(); }, 1500); };
    if ($('hbFind')) $('hbFind').onclick = findLines;
    if ($('hbSize')) $('hbSize').onclick = sizeStart;
    if ($('hbTrace')) $('hbTrace').onclick = traceStart;
  }

  // 🔎 line finder: edges (Sobel) -> Hough lines -> the straight runs along them. Plain maths, in the browser.
  async function detect() {
    const img = new Image(); img.src = '/api/layout/photo?t=' + L().photoT() + '&hb=' + Date.now();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const w = 420, h = Math.round(420 * img.height / img.width), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0, w, h); const px = g.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h); for (let i = 0, j = 0; j < w * h; i += 4, j++) gray[j] = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
    const bl = new Float32Array(w * h);                                  // 3x3 blur
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += gray[(y + dy) * w + x + dx] * (dx && dy ? 1 : dx || dy ? 2 : 4); bl[y * w + x] = s / 16; }
    const mag = new Float32Array(w * h), ang = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x;
      const gx = bl[i - w + 1] + 2 * bl[i + 1] + bl[i + w + 1] - bl[i - w - 1] - 2 * bl[i - 1] - bl[i + w - 1];
      const gy = bl[i + w - 1] + 2 * bl[i + w] + bl[i + w + 1] - bl[i - w - 1] - 2 * bl[i - w] - bl[i - w + 1];
      mag[i] = Math.hypot(gx, gy); ang[i] = Math.atan2(gy, gx); }
    const sorted = Array.from(mag).filter(v => v > 0).sort((a, b) => a - b), thr = Math.max(40, sorted[Math.floor(sorted.length * 0.9)] || 60);
    const edge = new Uint8Array(w * h), M_ = 4; for (let y = M_; y < h - M_; y++) for (let x = M_; x < w - M_; x++) { const i = y * w + x; edge[i] = mag[i] >= thr ? 1 : 0; }   // (the photo's own border is not a line)
    const NT = 180, diag = Math.ceil(Math.hypot(w, h)), acc = new Float32Array(NT * diag * 2), cs = [], sn = [];
    for (let t = 0; t < NT; t++) { cs.push(Math.cos(t * Math.PI / NT)); sn.push(Math.sin(t * Math.PI / NT)); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!edge[i]) continue;
      const a = ang[i];                                                   // vote only near the edge's own normal (fast + clean)
      let t0 = Math.round(((a + Math.PI) % Math.PI) / Math.PI * NT);
      for (let dt = -6; dt <= 6; dt++) { const t = ((t0 + dt) % NT + NT) % NT, r = Math.round(x * cs[t] + y * sn[t]) + diag; acc[t * diag * 2 + r] += 1; } }
    const peaks = [];
    for (let t = 0; t < NT; t++) for (let r = 1; r < diag * 2 - 1; r++) { const v = acc[t * diag * 2 + r]; if (v < w * 0.06) continue;
      if (v >= acc[t * diag * 2 + r - 1] && v >= acc[t * diag * 2 + r + 1]) peaks.push([v, t, r - diag]); }
    peaks.sort((a, b) => b[0] - a[0]);
    const segs = [];
    for (const [v, t, r] of peaks.slice(0, 160)) {
      const c = cs[t], s = sn[t], dx = -s, dy = c;                         // walk along the line
      const x0 = c * r, y0 = s * r; let run = null, gap = 0; const found = [];
      for (let k = -diag; k <= diag; k++) { const x = Math.round(x0 + dx * k), y = Math.round(y0 + dy * k);
        if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) { if (run) { found.push(run); run = null; } continue; }
        let hit = edge[y * w + x] || edge[y * w + x + 1] || edge[y * w + x - 1] || edge[(y + 1) * w + x] || edge[(y - 1) * w + x];
        if (hit) { if (!run) run = [[x, y], [x, y]]; else run[1] = [x, y]; gap = 0; }
        else if (run && ++gap > 7) { found.push(run); run = null; gap = 0; } }
      if (run) found.push(run);
      found.forEach(sg => { const L = Math.hypot(sg[1][0] - sg[0][0], sg[1][1] - sg[0][1]); if (L > w * 0.1) segs.push({a: sg[0], b: sg[1], L, t}); });
    }
    // join pieces of the same line (a gutter broken by a downspout, a roof edge behind a tree)
    segs.sort((p, q) => q.L - p.L);
    const merged = [];
    for (const sg of segs) {
      const m = merged.find(k => { const dt = Math.min(Math.abs(k.t - sg.t), 180 - Math.abs(k.t - sg.t)); if (dt > 3) return false;
        const ax = k.b[0] - k.a[0], ay = k.b[1] - k.a[1], LL = Math.hypot(ax, ay), ux = ax / LL, uy = ay / LL;
        const off = p => Math.abs((p[0] - k.a[0]) * uy - (p[1] - k.a[1]) * ux); if (off(sg.a) > 5 || off(sg.b) > 5) return false;
        const pr = p => (p[0] - k.a[0]) * ux + (p[1] - k.a[1]) * uy, s0 = Math.min(pr(sg.a), pr(sg.b)), s1 = Math.max(pr(sg.a), pr(sg.b));
        return s0 < LL + w * 0.06 && s1 > -w * 0.06; });
      if (!m) { merged.push(Object.assign({}, sg)); continue; }
      const ax = m.b[0] - m.a[0], ay = m.b[1] - m.a[1], LL = Math.hypot(ax, ay), ux = ax / LL, uy = ay / LL, pr = p => (p[0] - m.a[0]) * ux + (p[1] - m.a[1]) * uy;
      const lo = Math.min(0, pr(sg.a), pr(sg.b)), hi = Math.max(LL, pr(sg.a), pr(sg.b)), a0 = m.a.slice();
      m.a = [a0[0] + ux * lo, a0[1] + uy * lo]; m.b = [a0[0] + ux * hi, a0[1] + uy * hi]; m.L = hi - lo;
    }
    segs.length = 0; merged.forEach(x => segs.push(x)); segs.sort((p, q) => q.L - p.L);
    const keep = [];                                                    // drop near-duplicates
    for (const sg of segs) {
      const dup = keep.some(k => { const dt = Math.min(Math.abs(k.t - sg.t), 180 - Math.abs(k.t - sg.t)); if (dt > 4) return false;
        const d = (p) => { const ax = k.b[0] - k.a[0], ay = k.b[1] - k.a[1], LL = ax * ax + ay * ay; let u = ((p[0] - k.a[0]) * ax + (p[1] - k.a[1]) * ay) / LL; u = Math.max(0, Math.min(1, u)); return Math.hypot(k.a[0] + ax * u - p[0], k.a[1] + ay * u - p[1]); };
        return d(sg.a) < 8 && d(sg.b) < 8; });
      if (!dup) keep.push(sg); if (keep.length >= 28) break;
    }
    const S = L().doc().stage, k = S[0] / w;
    return keep.map((sg, i) => { const deg = Math.abs(Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0]) * 180 / Math.PI) % 180, d2 = Math.min(deg, 180 - deg);
      const part = d2 < 8 ? 'eave' : d2 > 80 ? 'wall' : d2 > 12 && d2 < 60 ? 'roof' : 'line';
      const name = {eave: 'Eave / gutter', wall: 'Corner / wall', roof: 'Roofline', line: 'Line'}[part];
      const low = Math.max(sg.a[1], sg.b[1]) / h > 0.74;                 // the ground line and the bottom of the walls: offered, not picked
      return {id: 'f' + i, name, part, pts: [sg.a, sg.b].map(p => [+(p[0] * k).toFixed(1), +(p[1] * k).toFixed(1)]), pick: part === 'roof' || (part === 'eave' && !low)}; });
  }
  async function findLines() {
    close(); GB.toast('🔎 Looking for the lines in your photo…');
    let found; try { found = await detect(); } catch (e) { GB.toast('⚠️ Could not read the photo'); return photoStart(); }
    if (!found.length) { GB.toast('No clear straight lines found. Try a sharper daytime photo, or draw them yourself.'); return photoStart(); }
    const st = {found};
    const paint = () => { const n = st.found.filter(f => f.pick).length;
      bar.show(`<p>Found ${st.found.length} lines. Tap a line to keep or drop it (gold = keep). <b>${n} kept.</b></p>
        <button class="chip" id="hbAll" style="--c:var(--cyan)">All</button><button class="chip" id="hbNone" style="--c:var(--cyan)">None</button>
        <button class="btn" id="hbFX">Cancel</button><button class="btn c" id="hbFK" style="--c:#ffc04d">Keep ${n}</button>`);
      $('hbAll').onclick = () => { st.found.forEach(f => f.pick = true); paint(); L().draw(); };
      $('hbNone').onclick = () => { st.found.forEach(f => f.pick = false); paint(); L().draw(); };
      $('hbFX').onclick = done; $('hbFK').onclick = () => { const D = L().doc(); L().snapshot(); const nm = {};
        D.guides = (D.guides || []).concat(st.found.filter(f => f.pick).map(f => { nm[f.name] = (nm[f.name] || 0) + 1; return {id: 'p' + Math.random().toString(36).slice(2, 8), name: f.name + ' ' + nm[f.name], part: f.part, pts: f.pts, closed: false}; }));
        done(); L().refresh(); GB.sfx && GB.sfx('ok'); GB.toast('✅ Lines kept. Now set the real size, then put lights on them.'); photoStart(); };
    };
    L().overlay = px => st.found.map(f => `<path d="M${f.pts[0].join(' ')}L${f.pts[1].join(' ')}" stroke="${f.pick ? '#ffc04d' : '#33d6ff'}" stroke-opacity="${f.pick ? 1 : .55}" stroke-width="${(f.pick ? 5 : 3) * px}" stroke-linecap="round" stroke-dasharray="${f.pick ? '' : 8 * px + ' ' + 6 * px}"/>`).join('');
    const svg = L().svg(), tap = e => { const p = L().toStage(e), tol = 22 / L().view().s;
      let best = null, bd = tol; st.found.forEach(f => { const [a, b] = f.pts, ax = b[0] - a[0], ay = b[1] - a[1], LL = ax * ax + ay * ay; let u = ((p[0] - a[0]) * ax + (p[1] - a[1]) * ay) / LL; u = Math.max(0, Math.min(1, u)); const d = Math.hypot(a[0] + ax * u - p[0], a[1] + ay * u - p[1]); if (d < bd) { bd = d; best = f; } });
      if (best) { e.stopPropagation(); e.preventDefault(); best.pick = !best.pick; paint(); L().draw(); } };
    svg.addEventListener('pointerdown', tap, true);
    const done = () => { svg.removeEventListener('pointerdown', tap, true); L().overlay = null; bar.hide(); L().draw(); };
    paint(); L().draw();
  }

  // 📏 real size: drag over something you know
  const KNOWN = [['Garage door (double)', 16], ['Garage door (single)', 9], ['Front door', 3], ['Window', 3], ['Car', 15]];
  function sizeStart() {
    close(); const svg = L().svg(); let line = null, drag = false;
    L().overlay = px => line ? `<path d="M${line[0].join(' ')}L${line[1].join(' ')}" stroke="#3ce08a" stroke-width="${5 * px}" stroke-linecap="round"/><circle cx="${line[0][0]}" cy="${line[0][1]}" r="${8 * px}" fill="#3ce08a"/><circle cx="${line[1][0]}" cy="${line[1][1]}" r="${8 * px}" fill="#3ce08a"/>` : '';
    const dn = e => { e.stopPropagation(); e.preventDefault(); svg.setPointerCapture(e.pointerId); const p = L().toStage(e); line = [p, p.slice()]; drag = true; L().draw(); };
    const mv = e => { if (!drag) return; e.stopPropagation(); line[1] = L().toStage(e); L().draw(); };
    const up = e => { if (!drag) return; e.stopPropagation(); drag = false; ask(); };
    svg.addEventListener('pointerdown', dn, true); svg.addEventListener('pointermove', mv, true); svg.addEventListener('pointerup', up, true);
    const done = () => { svg.removeEventListener('pointerdown', dn, true); svg.removeEventListener('pointermove', mv, true); svg.removeEventListener('pointerup', up, true); L().overlay = null; bar.hide(); L().draw(); };
    const ask = () => {
      const u = P.units === 'm';
      bar.show(`<p>${line ? 'How long is the green line?' : 'Drag a line across something you know the size of.'}</p>
        ${line ? KNOWN.map(([t, ft]) => `<button class="chip" data-k="${ft}" style="--c:var(--green)">${t} · ${u ? (ft / M).toFixed(1) + ' m' : ft + ' ft'}</button>`).join('') + `<input type="number" id="hbLen" min="0.1" step="0.1" placeholder="${u ? 'metres' : 'feet'}" inputmode="decimal"><button class="btn c" id="hbLenOk" style="--c:var(--green)">Set</button>` : ''}
        <button class="btn" id="hbSX">Cancel</button>`);
      $('hbSX').onclick = () => { done(); photoStart(); };
      const set = ft => { const Lp = Math.hypot(line[1][0] - line[0][0], line[1][1] - line[0][1]); if (Lp < 5 || !(ft > 0)) return GB.toast('Drag a longer line');
        const D = L().doc(); L().snapshot(); D.scale = +(Lp / ft).toFixed(4); done(); L().refresh(); GB.sfx && GB.sfx('ok');
        GB.toast(`📏 Real size set: the whole picture is about ${lenTxt(D.stage[0] / D.scale)} across.`); photoStart(); };
      document.querySelectorAll('#hbBar [data-k]').forEach(b => b.onclick = () => set(+b.dataset.k));
      if ($('hbLenOk')) $('hbLenOk').onclick = () => { const v = parseFloat($('hbLen').value); set(u ? v * M : v); };
    };
    ask(); L().draw();
  }

  // ✏️ draw a house line by hand (taps)
  function traceStart() {
    close(); const svg = L().svg(); const pts = [];
    L().overlay = px => pts.length ? `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="#c58bff" stroke-width="${4 * px}" stroke-linejoin="round"/>` + pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${7 * px}" fill="#c58bff"/>`).join('') : '';
    const dn = e => { e.stopPropagation(); e.preventDefault(); pts.push(L().toStage(e)); paint(); L().draw(); };
    svg.addEventListener('pointerdown', dn, true);
    const done = () => { svg.removeEventListener('pointerdown', dn, true); L().overlay = null; bar.hide(); L().draw(); };
    const paint = () => { bar.show(`<p>${pts.length ? pts.length + ' points. Tap the next corner.' : 'Tap along the line, corner by corner.'}</p>
        <select id="hbPart" style="min-height:48px"><option value="roof">Roofline</option><option value="eave">Eave / gutter</option><option value="window">Window</option><option value="door">Door</option><option value="porch">Porch</option><option value="line">Other</option></select>
        <button class="btn" id="hbTU">Undo point</button><button class="btn" id="hbTX">Cancel</button><button class="btn c" id="hbTD" style="--c:var(--violet)">Done</button>`);
      $('hbTU').onclick = () => { pts.pop(); paint(); L().draw(); }; $('hbTX').onclick = () => { done(); photoStart(); };
      $('hbTD').onclick = () => { if (pts.length < 2) return GB.toast('Tap at least two points'); const D = L().doc(), part = $('hbPart').value, nm = $('hbPart').selectedOptions[0].textContent;
        L().snapshot(); D.guides = (D.guides || []).concat([{id: 'm' + Math.random().toString(36).slice(2, 8), name: nm + ' ' + ((D.guides || []).filter(g => g.part === part).length + 1), part, pts: pts.map(p => [+p[0].toFixed(1), +p[1].toFixed(1)]), closed: part === 'window' || part === 'door'}]);
        done(); L().refresh(); photoStart(); }; };
    paint(); L().draw();
  }

  // ------------------------------------------------------------- 4. bring in from another app
  async function apps() {
    const devs = L().devs().filter(d => d.connected);
    card('Bring in from an app', `
      <p class="hb-note">Already mapped your lights in another app? GlowBop reads that map and puts the light on your drawing, exactly as you placed it there.</p>
      <div class="hb-lbl">From the light itself</div>
      <div class="hb-list">${devs.map(d => `<div class="hb-li"><span style="width:48px;height:48px;border-radius:12px;background:${L().devCol(d.id)}33;display:grid;place-items:center">${GB.svg('bulb')}</span>
        <div><b>${esc(d.name)}</b><small>${esc(appName(d.type))} · ${d.n} bulbs</small></div><button class="btn c" data-nat="${esc(d.id)}" style="--c:var(--green)">Use its map</button></div>`).join('') || '<p class="hb-note">No lights connected right now.</p>'}</div>
      <div class="hb-lbl">From a file</div>
      <div class="hb-row"><button class="btn c" id="hbLedmap" style="--c:var(--cyan)">${GB.svg('add')}<span>WLED ledmap.json</span></button>
        <button class="btn c" id="hbXl" style="--c:var(--green)">${GB.svg('lists')}<span>xLights show folder</span></button>
        <button class="btn c" id="hbVix" style="--c:var(--violet)">${GB.svg('lists')}<span>Vixen 3 preview</span></button>
        <button class="btn c" id="hbLor" style="--c:#ffc04d">${GB.svg('lists')}<span>Light-O-Rama preview</span></button></div>
      <p class="hb-note">Vixen 3: pick <b>ModuleStore.xml</b> and <b>SystemConfig.xml</b> from Documents\Vixen 3\SystemData (both at once, for the prop names). Light-O-Rama: a <b>.lorprev</b> file (Preview Design, Export). They come in as house lines you can put any of your lights on.</p>
      <input type="file" id="hbJson" accept=".json,application/json" hidden><input type="file" id="hbVixF" accept=".xml,text/xml" multiple hidden><input type="file" id="hbLorF" accept=".lorprev,.xml" hidden>`, open);
    $('hbVix').onclick = () => $('hbVixF').click(); $('hbLor').onclick = () => $('hbLorF').click();
    const multi = async fs => { if (!fs.length) return; const files = {}; for (const f of fs) files[f.name] = await f.text();
      const r = await GB.post('/api/layout/import', {files}); if (r) useHouse(r); };
    $('hbVixF').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; multi(fs); };
    $('hbLorF').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; multi(fs); };
    document.querySelectorAll('[data-nat]').forEach(b => b.onclick = async () => {
      const id = b.dataset.nat; b.disabled = true; let r = null;
      try { r = await GB.get('/api/layout/native?id=' + encodeURIComponent(id)); } catch (e) {}
      b.disabled = false; if (!r) return; if (r.error) return GB.toast('ℹ️ ' + r.error);
      placePts(L().devs().find(d => d.id === id), r);
    });
    $('hbLedmap').onclick = () => $('hbJson').click();
    $('hbJson').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const r = await GB.post('/api/layout/import', {name: f.name, text: await f.text()}); if (!r) return;
      if (r.kind === 'xlights') return toXl();
      if (r.kind === 'house') return useHouse(r);
      const pick = L().devs().filter(d => d.enabled);
      card('Which light is this map for?', `<p class="hb-note">${esc(r.source)}: ${r.n} bulbs${r.size ? ` on a ${r.size[0]} x ${r.size[1]} grid` : ''}.</p>
        <div class="hb-list">${pick.map(d => `<button class="btn" data-pk="${esc(d.id)}" style="min-height:48px;justify-content:flex-start">${GB.svg('bulb')}<span>${esc(d.name)} · ${d.n} bulbs</span></button>`).join('')}</div>`, apps);
      document.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => placePts(pick.find(d => d.id === b.dataset.pk), r));
    };
    $('hbXl').onclick = toXl;
  }
  // a whole display from Vixen / Light-O-Rama -> house lines on the drawing (then "Put lights on your house")
  function useHouse(r) {
    if (!r || r.kind !== 'house') return; const D = L().doc(); L().snapshot();
    const empty = !D.items.length && !(D.guides || []).length && !D.photo;
    let k = 1, ox = 0, oy = 0;
    if (empty) D.stage = r.stage.slice();
    else { k = Math.min(D.stage[0] * 0.95 / r.stage[0], D.stage[1] * 0.95 / r.stage[1]); ox = (D.stage[0] - r.stage[0] * k) / 2; oy = (D.stage[1] - r.stage[1] * k) / 2; }
    D.guides = (D.guides || []).concat(r.guides.map(g => ({id: 'x' + Math.random().toString(36).slice(2, 8), name: g.name, part: g.part || 'line', closed: !!g.closed,
      pts: g.pts.map(([x, y]) => [+(ox + x * k).toFixed(1), +(oy + y * k).toFixed(1)])})));
    L().fit(); L().refresh(); GB.sfx && GB.sfx('ok');
    GB.toast(`📥 ${r.props} props from your ${r.source}. Set the real size (Trace a photo, Set the real size) or put lights on them.`);
    fillPick();
  }
  const appName = t => ({twinkly: 'Twinkly app map', nanoleaf: 'Nanoleaf app layout', wled: 'WLED 2D map', govee: 'Govee: one colour, no map', lifx: 'LIFX: a straight string'})[t] || 'its own app';
  function toXl() {
    close(); const ov2 = $('lmOv'); if (ov2 && !ov2.hidden) $('lmClose').click();
    setTimeout(() => { GB.go('house', 'xlPanel'); const el = $('xlPanel'); if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'}); GB.toast('🎄 Import from xLights: pick your show folder or zip'); }, 400);
  }
  function placePts(d, r) {
    if (!d) return; const D = L().doc(), c = L().viewCenter(), asp = r.aspect || 1;
    let w = D.stage[0] * 0.45, h = w / asp; if (h > D.stage[1] * 0.7) { h = D.stage[1] * 0.7; w = h * asp; }
    L().snapshot(); L().setAct(d.id);
    const old = D.items.filter(i => i.dev === d.id).length; if (old) D.items = D.items.filter(i => i.dev !== d.id);
    L().newItem({kind: 'points', name: d.name, pts: r.pts, box: {x: c[0], y: c[1], w: Math.max(20, w), h: Math.max(20, h), rot: 0}, count: Math.min(d.n, r.pts.length), first: 0, dev: d.id, src: r.source});
    close(); L().refresh(); GB.sfx && GB.sfx('ok');
    GB.toast(`📥 ${d.name} placed from ${r.source}${old ? ` (replaces ${old} drawn string${old > 1 ? 's' : ''}; Undo brings ${old > 1 ? 'them' : 'it'} back)` : ''}. Drag it into place, then Save.`);
  }

  GB.houseBuilder = {open, fill: id => { F.sel = new Set([id]); fillPick(id); }, lines: houseLines,
    start: async k => { if (!L().isOpen()) await L().open(); ({measure, photo: photoStart, apps, lights: fillPick})[k](); }};

  // 🏠 the HOUSE page (Oct 21, Graham: "I can't find this anywhere... it should be its own tab in the rail"): the three ways in, big, first
  GB.panel('house', 10, el => {
    el.id = 'hbPanel'; el.classList.add('box'); el.style.setProperty('--c', '#ffc04d');
    el.innerHTML = `<div class="ph"><span>House Builder</span><span class="r" id="hbState"></span></div>
      <p class="note">Get your house (or stage, or room) into GlowBop, then put your lights on it. Every effect follows your real shape.</p>
      <div class="hb-start">
        <button style="--c:#ffc04d" data-hbs="measure">${GB.svg('home')}<b>Build from measurements</b><span>Pick your house style and type its size.</span></button>
        <button style="--c:var(--cyan)" data-hbs="photo">${GB.svg('camera')}<b>Trace a photo</b><span>GlowBop finds the roofline, eaves and walls for you.</span></button>
        <button style="--c:var(--green)" data-hbs="apps">${GB.svg('add')}<b>Bring in from an app</b><span>Twinkly, Nanoleaf, WLED, xLights, Vixen or Light-O-Rama.</span></button>
        <button style="--c:var(--pink)" data-hbs="lights">${GB.svg('bulb')}<b>Put lights on it</b><span>Pick a light and its bulb spacing. GlowBop fills your lines.</span></button>
      </div>`;
    el.querySelectorAll('[data-hbs]').forEach(b => b.onclick = () => { GB.sfx && GB.sfx('tap'); GB.houseBuilder.start(b.dataset.hbs); });
  });
  // Oct 21 (Graham: "those buttons are just as huge... can we reduce the size"): a slim row of four keys on the HOUSE page
  GB.css(`#hbPanel .hb-start { grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:8px; }
  #hbPanel .hb-start button { min-height:56px; flex-direction:row; align-items:center; justify-content:flex-start; gap:10px; padding:6px 12px; border-radius:0 12px 0 12px; }
  #hbPanel .hb-start button svg { width:24px; height:24px; margin:0; flex:none; }
  #hbPanel .hb-start button b { font-size:calc(15px * var(--fs, 1)); }
  #hbPanel .hb-start button span { display:none; }`);
})();
