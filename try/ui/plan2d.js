/* 📐 Plan view in feet (Oct 21): one SVG drawing board shared by STAGE (top + front views) and HOUSE → YARD (top view).
   GB.Plan(host, cfg) -> plan
     cfg.flipY   true: bigger world y is higher on screen (front view: z up; top view: upstage up, crowd at the bottom)
     cfg.bounds() -> [x0, y0, x1, y1] to fit; cfg.paint(P) -> svg markup (world units, use P.sx/P.sy helpers or the world group)
     cfg.pick(id, ev) when an item with data-id is tapped; cfg.drag(id, dx, dy, ev) while dragging it (feet);
     cfg.tap(x, y) on empty ground; cfg.dragEnd(id)
   The world is drawn inside <g transform> so items use feet directly; strokes use vector-effect so they stay crisp.
   Controls: drag empty ground to pan, wheel or pinch to zoom, and labelled ZOOM OUT / FIT / ZOOM IN buttons (drawn icons). */
(function () {
  'use strict';
  GB.css(`
  .pl-wrap { position:relative; background:#07060d; border:1px solid var(--line); border-radius:0 16px 0 16px; overflow:hidden; touch-action:none; user-select:none; -webkit-user-select:none; }
  .pl-wrap svg.pl { display:block; width:100%; height:100%; }
  .pl-wrap .pl-cap { position:absolute; left:10px; top:8px; font:800 12px var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--c, var(--cyan)); pointer-events:none; text-shadow:0 1px 3px #000; }
  .pl-zb { position:absolute; right:6px; top:6px; display:flex; gap:4px; z-index:2; }
  .pl-zb button { min-width:48px; min-height:48px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; padding:3px 5px; border-radius:10px;
    background:#0d0b18e6; border:1px solid #33d6ff66; color:#e9f6ff; cursor:pointer; }
  .pl-zb button svg { width:20px; height:20px; fill:currentColor; }
  .pl-zb button i { font:700 10px/1 var(--cond); letter-spacing:.5px; text-transform:uppercase; font-style:normal; color:#bfeaff; }
  .pl-wrap [data-id] { cursor:grab; }
  .pl-wrap .pl-sel { stroke:#ffcc66 !important; stroke-width:3px !important; }
  `);
  const Z = {zout: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM6.5 8.7h6v1.6h-6z',
    zin: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM6.5 8.7h2.2V6.5h1.6v2.2h2.2v1.6h-2.2v2.2H8.7v-2.2H6.5z',
    fit: 'M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2zM9 9h6v6H9z'};
  const ib = (k, t) => `<button type="button" data-z="${k}" aria-label="${t}" title="${t}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${Z[k]}"/></svg><i>${t}</i></button>`;

  GB.Plan = function (host, cfg) {
    host.classList.add('pl-wrap');
    host.innerHTML = `<svg class="pl" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="${cfg.id}G1" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#1a1730" stroke-width=".04"/></pattern>
      <pattern id="${cfg.id}G5" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0H0V5" fill="none" stroke="#2b2650" stroke-width=".08"/></pattern>${cfg.defs || ''}</defs>
      <g class="pl-w"><g class="pl-s"></g><g class="pl-l"></g></g></svg><div class="pl-cap">${GB.esc(cfg.caption || '')}</div><div class="pl-zb">${ib('zout', 'Out')}${ib('fit', 'Fit')}${ib('zin', 'In')}</div>`;
    const svg = host.querySelector('svg'), W = host.querySelector('.pl-w'), WS = host.querySelector('.pl-s'), WL = host.querySelector('.pl-l');
    const P = {k: 10, ox: 0, oy: 0, sel: null, fitted: false};             // screen = world * k (y flipped if flipY) + offset
    const fy = cfg.flipY ? -1 : 1;
    const size = () => { const r = svg.getBoundingClientRect(); return [r.width || 600, r.height || 300]; };
    P.toWorld = (cx, cy) => { const r = svg.getBoundingClientRect(); return [(cx - r.left - P.ox) / P.k, (cy - r.top - P.oy) / (P.k * fy)]; };
    P.fit = () => {
      const [x0, y0, x1, y1] = cfg.bounds(), [w, h] = size(), pad = 30;
      P.k = Math.max(1, Math.min((w - pad * 2) / Math.max(1, x1 - x0), (h - pad * 2 - 30) / Math.max(1, y1 - y0)));
      P.ox = w / 2 - (x0 + x1) / 2 * P.k; P.oy = (h + 30) / 2 - (y0 + y1) / 2 * P.k * fy; P.fitted = true; P.draw();
    };
    P.zoom = (f, cx, cy) => { const [w, h] = size(); cx = cx == null ? w / 2 : cx; cy = cy == null ? h / 2 : cy;
      const k2 = Math.max(.5, Math.min(400, P.k * f)); P.ox = cx - (cx - P.ox) * k2 / P.k; P.oy = cy - (cy - P.oy) * k2 / P.k; P.k = k2; P.draw(); };
    P.draw = () => {
      if (!P.fitted && size()[0] > 50) { P.fit(); return; }
      const [x0, y0, x1, y1] = cfg.bounds(), m = 400;
      const grid = `<rect x="${x0 - m}" y="${Math.min(y0, y1) - m}" width="${x1 - x0 + 2 * m}" height="${Math.abs(y1 - y0) + 2 * m}" fill="url(#${cfg.id}G1)"/><rect x="${x0 - m}" y="${Math.min(y0, y1) - m}" width="${x1 - x0 + 2 * m}" height="${Math.abs(y1 - y0) + 2 * m}" fill="url(#${cfg.id}G5)"/>`;
      W.setAttribute('transform', `translate(${P.ox} ${P.oy}) scale(${P.k} ${P.k * fy})`);
      WS.innerHTML = (P.k > 3 ? grid : '') + cfg.paint(P); P.drawLive();
    };
    P.drawLive = () => { WL.innerHTML = cfg.live ? cfg.live(P) : '';
      if (P.sel) W.querySelectorAll(`[data-id="${CSS.escape(P.sel)}"] .pl-o, [data-id="${CSS.escape(P.sel)}"].pl-o`).forEach(n => n.classList.add('pl-sel')); };
    // text that reads the right way up inside a flipped group
    P.txt = (x, y, s, cls, size_) => `<text x="${x}" y="${y * fy}" transform="scale(1 ${fy})" class="${cls || ''}" font-size="${(size_ || 11) / P.k}" text-anchor="middle" dominant-baseline="middle">${GB.esc(s)}</text>`;
    host.querySelector('.pl-zb').addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; e.stopPropagation();
      if (b.dataset.z === 'fit') P.fit(); else P.zoom(b.dataset.z === 'zin' ? 1.35 : 1 / 1.35); });
    svg.addEventListener('wheel', e => { e.preventDefault(); const r = svg.getBoundingClientRect(); P.zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, {passive: false});
    const pts = new Map(); let drag = null, pinch = null;
    svg.addEventListener('pointerdown', e => {
      svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: P.k}; drag = null; return; }
      const it = e.target.closest('[data-id]'); const [wx, wy] = P.toWorld(e.clientX, e.clientY);
      if (it && cfg.drag) { const id = it.dataset.id; P.sel = id; cfg.pick && cfg.pick(id, e); drag = {id, wx, wy, moved: false, sx: e.clientX, sy: e.clientY}; }
      else drag = {pan: true, ox: P.ox, oy: P.oy, sx: e.clientX, sy: e.clientY, moved: false, wx, wy};
    });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = svg.getBoundingClientRect();
        P.zoom(pinch.k * d / pinch.d / P.k, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); return; }
      if (!drag) return;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true;
      if (!drag.moved) return;
      if (drag.pan) { P.ox = drag.ox + e.clientX - drag.sx; P.oy = drag.oy + e.clientY - drag.sy; P.draw(); return; }
      const [wx, wy] = P.toWorld(e.clientX, e.clientY); cfg.drag(drag.id, wx - drag.wx, wy - drag.wy, e); drag.wx = wx; drag.wy = wy;
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
      if (drag && !drag.moved && drag.pan && cfg.tap) { const [wx, wy] = P.toWorld(e.clientX, e.clientY); cfg.tap(wx, wy, e); }
      if (drag && drag.moved && drag.id && cfg.dragEnd) cfg.dragEnd(drag.id);
      drag = null; };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    new ResizeObserver(() => { if (!P.fitted) P.draw(); }).observe(host);
    return P;
  };
})();
