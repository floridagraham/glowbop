/* GlowBop console: SETUP page.
   Light setup (devices, groups, scan, add, layout, map, line-up wizard, camera mapping), license, song lookup,
   phone remote, help & feedback, quit. Same engine endpoints and bodies as the old remote. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;

  GB.css(`
  .su-gpick { display:grid; grid-template-columns:repeat(8, minmax(0, 1fr)); gap:4px; max-width:340px; }
  .su-gc { appearance:none; border:0; aspect-ratio:1; min-height:0; border-radius:4px; background:var(--dark); padding:0; cursor:pointer; }
  .su-gc.on { background:var(--lav); box-shadow:0 0 8px var(--lav); }
  .su-gc.hov { background:var(--cyan); }
  .su-gc:disabled { opacity:.18; cursor:default; }
  .su-gslots { display:grid; gap:6px; }
  .su-gs { appearance:none; border:2px dashed var(--line); background:#06050c; color:var(--dim); border-radius:0 14px 0 14px; min-height:72px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px 4px; min-width:0; }
  .su-gs.full { border:2px solid var(--c); color:var(--text); background:var(--panel); }
  .su-gs small { font-size:12px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .su-dev { border-bottom:1px solid var(--line); padding:8px 2px 10px; display:flex; flex-direction:column; gap:8px; min-width:0; }
  .su-dev.off .su-top { opacity:.5; }
  .su-top { display:flex; align-items:center; gap:10px; min-width:0; }
  .su-dot { width:14px; height:14px; border-radius:50%; flex:0 0 auto; box-shadow:0 0 8px currentColor; }
  .su-num { width:30px; height:30px; border-radius:50%; flex:0 0 auto; display:grid; place-items:center; font:800 16px var(--cond); color:#000; }
  .su-tx { flex:1; min-width:0; }
  .su-tx b { display:block; font:700 16px/1.15 var(--cond); letter-spacing:1px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .su-tx small { display:block; color:var(--dim); font-size:12px; line-height:1.35; overflow-wrap:anywhere; }
  .su-acts { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:4px; }
  .su-acts .btn { padding:0 4px; font-size:13px; gap:4px; border-radius:6px; min-height:44px; }
  .su-acts .btn:first-child { border-radius:22px 6px 6px 22px; } .su-acts .btn:last-child { border-radius:6px 22px 22px 6px; }
  .su-acts .btn svg { width:16px; height:16px; }
  @media (max-width: 520px) { .su-acts { grid-template-columns:repeat(2, minmax(0, 1fr)); } .su-acts .btn, .su-acts .btn:first-child, .su-acts .btn:last-child { border-radius:22px; } }
  .su-opt .seg .btn { padding:0 4px; }
  @media (max-width: 520px) { .su-opt .seg .btn { font-size:13px; letter-spacing:.5px; } }
  .su-opt { display:flex; flex-direction:column; gap:4px; padding-left:24px; min-width:0; }
  .su-opt > span { font:600 12px var(--cond); letter-spacing:1.5px; color:var(--label); text-transform:uppercase; }
  .su-opt .seg .btn { min-height:44px; font-size:14px; }
  .su-ren { display:flex; gap:6px; min-width:0; } .su-ren input { flex:1; min-width:0; }
  .su-grp { display:flex; align-items:center; gap:10px; padding:6px 2px; border-bottom:1px solid var(--line); min-width:0; }
  .su-grp b { flex:1; min-width:0; font:700 15px var(--cond); letter-spacing:1px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .su-grp select { flex:0 0 120px; width:120px; }
  .su-gname { display:grid; grid-template-columns:76px minmax(0, 1fr); gap:8px; align-items:center; font:600 13px var(--cond); letter-spacing:1.5px; color:var(--label); text-transform:uppercase; }
  .su-map { width:100%; max-width:380px; height:auto; display:block; margin:0 auto; background:#05040a; border:2px solid var(--dark); border-radius:0 14px 0 14px; }
  .su-vid { width:100%; border-radius:0 14px 0 14px; background:#000; display:block; }
  .su-prog { height:10px; background:var(--dark2); border-radius:3px; overflow:hidden; }
  .su-prog i { display:block; height:100%; width:0; background:linear-gradient(90deg, var(--pink), var(--cyan)); transition:width .2s; }
  .su-box { display:flex; flex-direction:column; gap:10px; min-width:0; }
  .su-inset { background:#06050c; border:1px solid var(--line); border-radius:0 14px 0 14px; padding:10px; display:flex; flex-direction:column; gap:10px; min-width:0; }
  .su-lu .seg .btn { font-size:18px; } .su-lu .su-opt { padding-left:0; }
  @media (max-width: 520px) { .su-lu .su-opt .seg .btn, .su-lu [data-sulua] { font-size:13px; letter-spacing:.5px; padding:0 3px; } }
  .su-addrow { display:flex; gap:8px; min-width:0; } .su-addrow input { flex:1; min-width:0; }
  .su-qr { display:flex; gap:16px; align-items:flex-start; min-width:0; }
  .su-qr img { width:140px; height:140px; border-radius:10px; background:#fff; padding:6px; flex:0 0 auto; }
  .su-qr ol { margin:0; padding-left:20px; line-height:1.55; font-size:14px; min-width:0; }
  .su-qr ol b { overflow-wrap:anywhere; color:var(--cyan); font-family:var(--mono); font-weight:400; }
  @media (max-width: 520px) { .su-qr { flex-direction:column; align-items:center; } .su-qr ol { align-self:stretch; } }
  .su-done { text-align:center; padding:14px 6px; font-size:15px; line-height:1.5; }
  .su-done b.su-tk { display:block; font:28px var(--mono); color:var(--cyan); margin:6px 0; letter-spacing:2px; }
  .su-keys { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; } .su-keys .btn { grid-column:1 / -1; }
  @media (max-width: 600px) { .su-keys { grid-template-columns:minmax(0, 1fr); } }
  .su-now { font:14px var(--mono); color:var(--cyan); overflow-wrap:anywhere; }
  `);

  const DEVCOL = GB.DEVCOL;
  const HELP = {twinkly: 'Twinkly: find the IP in the Twinkly app (Device settings → Wi-Fi), or use Find my lights.',
    wled: 'WLED: the IP is shown in the WLED app, or on your router. GlowBop takes over the strip while running, then WLED goes back to its own effect.',
    govee: 'Govee: first turn on "LAN Control" for the light in the Govee app (light → settings ⚙). Govee lights show one color at a time.',
    surplife: 'Surplife curtain: Find my lights finds it over Bluetooth (close the Surplife app on your phone first: only one connection at a time). Or type its Bluetooth address, e.g. AA:BB:CC:DD:EE:FF.',
    daybetter: 'DayBetter strips and light poles: Find my lights finds them over Bluetooth (close the DayBetter app on your phone first: only one connection at a time). Each strip glows one color at a time, picked from the show and pulsing with the beat.'};
  const BRAND = {twinkly: 'Twinkly', wled: 'WLED', govee: 'Govee', surplife: 'Surplife curtain (Bluetooth)', daybetter: 'DayBetter (Bluetooth)'};
  const btn = (cls, html, fn, extra) => { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.innerHTML = html; if (fn) b.onclick = fn; if (extra) Object.assign(b, extra); return b; };
  const lbl = (ic, t) => (ic ? GB.svg(ic) : '') + '<span>' + esc(t) + '</span>';
  // tap twice to confirm: first tap arms the button and changes its text for 4 s
  const twice = (b, armText, idleHTML, fn) => {
    b.onclick = async () => {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.innerHTML = lbl('', armText); clearTimeout(b._t);
        b._t = setTimeout(() => { b.dataset.sure = ''; b.innerHTML = idleHTML; }, 4000); return; }
      clearTimeout(b._t); b.dataset.sure = ''; b.innerHTML = idleHTML; await fn();
    };
  };

  // =================================================================== 1. LIGHT SETUP
  let LS = null, lsDirty = false, GE = null, renaming = null, camStream = null;

  GB.panel('setup', 10, el => {
    el.id = 'lightsPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--peri)');
    el.innerHTML = `
      <div class="ph"><span>Light setup</span><span class="r" id="suCount"></span></div>
      <p class="note">Find, add and map Twinkly, WLED and Govee lights, plus Surplife curtains and DayBetter strips over Bluetooth.</p>
      <div class="list" id="suList"><p class="note">Loading…</p></div>
      <div class="row" id="suApply" hidden><button class="btn c lg wide" id="suApplyBtn" style="--c:var(--amber)">${lbl('power', 'Apply & restart lights')}</button></div>

      <div class="sub">Add lights</div>
      <div class="seg"><button class="btn c" id="suScan" style="--c:var(--cyan)">${lbl('search', 'Find my lights')}</button><button class="btn" id="suAddBtn">${lbl('add', 'Add by brand')}</button></div>
      <div id="suFound" class="list"></div>
      <div id="suAdd" class="su-inset" hidden>
        <select id="suBrand" aria-label="Brand"><option value="twinkly">Twinkly</option><option value="wled">WLED</option><option value="govee">Govee</option><option value="surplife">Surplife curtain (Bluetooth)</option><option value="daybetter">DayBetter (Bluetooth)</option></select>
        <div class="su-addrow"><input type="search" id="suIp" placeholder="IP address, e.g. 192.168.0.50" aria-label="IP address" autocapitalize="off" spellcheck="false"><button class="btn c" id="suAddGo" style="--c:var(--cyan)">Add</button></div>
        <p class="note" id="suHelp"></p>
      </div>

      <div class="sub">Light groups</div>
      <p class="note">Each group runs its own show.</p>
      <div class="seg"><button class="btn" id="suAll">${lbl('lists', 'All together')}</button><button class="btn" id="suEach">${lbl('shuffle', 'Each separate')}</button></div>
      <div id="suGrp" class="su-box"></div>

      <div class="sub">Layout</div>
      <div class="seg"><button class="btn" data-sulay="canvas">One canvas</button><button class="btn" data-sulay="zones">Zones</button></div>
      <p class="note" id="suLayNote"></p>
      <canvas id="lsMap" class="su-map" width="400" height="420" aria-label="Map of where every light sits"></canvas>

      <div class="sub">Shape</div>
      <div class="su-inset" id="suShape">
        <p class="note">Flat on a wall, or wrapped around an object for an art piece. Patterns flow all the way around with no seam.</p>
        <div class="seg" id="suShapeSeg"><button class="btn" data-sushape="flat">Flat wall</button><button class="btn" data-sushape="cylinder">Cylinder</button><button class="btn" data-sushape="box">Box</button><button class="btn" data-sushape="globe">Globe</button></div>
        <label class="field" id="suLidRow" hidden>Curtain on top (lid)<select id="suLid"></select></label>
        <p class="note" id="suShapeTip"></p>
      </div>
      <div class="sub">Line up my curtains</div>
      <button class="btn c wide" id="suLuStart" style="--c:var(--lav)">${lbl('map', 'Line up my curtains')}</button>
      <div id="suLu" class="su-inset su-lu" hidden>
        <p class="note"><b>1.</b> Every curtain now shows its number and an arrow. <b>2.</b> Tap ⟳ / ⇋ until each arrow points <b>up</b> and the number reads right. <b>3.</b> Put them in the order they hang with ▲ ▼. <b>4.</b> Tap Lock.</p>
        <div class="su-opt" style="padding-left:0"><span>Hung</span><div class="seg"><button class="btn" data-sulua="row">Side by side</button><button class="btn" data-sulua="stack">Stacked</button><button class="btn" data-sulua="grid">Grid</button><button class="btn" data-sulua="overlap">Overlap</button></div></div>
        <p class="note" id="suOvNote" hidden>Overlapping: hang the curtains over each other, shifted so each bulb sits in a gap of the first curtain. Pick where each one sits (centered or top-left) and its half-gap shift below. Twice the bulbs in the same space = a sharper picture.</p>
        <div id="suGrid" class="su-grid" hidden>
          <p class="note"><b>Grid wall:</b> up to 8 curtains in rows and columns. Tap the shape your curtains make, then tap a spot to choose which numbered curtain hangs there.</p>
          <div class="su-gpick" id="suGPick" role="group" aria-label="Wall shape"></div>
          <div class="ph" style="--c:var(--lav)"><span>Spots</span><span class="r" id="suGShape"></span></div>
          <div class="su-gslots" id="suGSlots"></div>
        </div>
        <div id="suLuList" class="list"></div>
        <div class="seg"><button class="btn" id="suLuCancel">Cancel</button><button class="btn c" id="suLuLock" style="--c:var(--lav)">${lbl('unlock', 'Lock')}</button></div>
      </div>

      <div class="sub">Map with camera</div>
      <button class="btn c wide" id="suMapGo" style="--c:var(--peri)">${lbl('camera', 'Map with camera')}</button>
      <p class="note" id="suHttps" hidden></p>
      <div id="suCam" class="su-inset" hidden>
        <video id="suVid" class="su-vid" playsinline muted autoplay></video>
        <div class="su-prog"><i id="suProg"></i></div>
        <p class="note" id="suCamMsg"></p>
        <div class="seg"><button class="btn" id="suCamCancel">Cancel</button><button class="btn c" id="suCamStart" style="--c:var(--green)">${lbl('play', 'Start mapping')}</button></div>
      </div>`;

    $('suAll').onclick = () => { if (!LS) return; GE = {}; LS.devices.forEach(d => GE[d.id] = {g: 1}); saveGroups(); };
    $('suEach').onclick = () => { if (!LS) return; GE = {}; LS.devices.slice(0, 4).forEach((d, i) => { GE[d.id] = {g: i + 1}; GE['_n' + (i + 1)] = d.name; }); LS.devices.slice(4).forEach(d => GE[d.id] = {g: 4}); saveGroups(); };
    el.querySelectorAll('[data-sulay]').forEach(b => b.onclick = async () => { if (await GB.post('/api/lights/layout', {layout: b.dataset.sulay})) { GB.toast(b.textContent); loadLights(); } });
    $('suScan').onclick = scan;
    $('suAddBtn').onclick = () => { const a = $('suAdd'); a.hidden = !a.hidden; $('suAddBtn').classList.toggle('on', !a.hidden); $('suHelp').textContent = HELP[$('suBrand').value]; };
    $('suBrand').onchange = () => $('suHelp').textContent = HELP[$('suBrand').value];
    $('suAddGo').onclick = async () => {
      const ip = $('suIp').value.trim(); if (!ip) return GB.toast('Type the light\'s IP address');
      GB.toast('Checking ' + ip + '…');
      if (await GB.post('/api/lights/add', {type: $('suBrand').value, ip})) { lsDirty = true; GB.toast('💡 Added'); $('suIp').value = ''; loadLights(); }
    };
    $('suIp').addEventListener('keydown', e => { if (e.key === 'Enter') $('suAddGo').click(); });
    $('suApplyBtn').onclick = async () => { if (await GB.post('/api/lights/apply', {})) { GB.toast('🔄 Restarting the lights with your new setup…'); lsDirty = false; $('suApply').hidden = true; setTimeout(loadLights, 9000); } };
    // line-up wizard
    $('suLuStart').onclick = async () => { if (await GB.post('/api/lights/lineup', {on: true})) { GB.toast('🧭 Look at your curtains: numbers + arrows'); loadLights(); } };
    $('suLuCancel').onclick = async () => { if (await GB.post('/api/lights/lineup', {on: false})) loadLights(); };
    el.querySelectorAll('[data-sulua]').forEach(b => b.onclick = async () => { if (await GB.post('/api/lights/arrange', {order: luOrder().map(x => x.d.id), how: b.dataset.sulua})) loadLights(); });
    $('suLuLock').onclick = async () => { if (await GB.post('/api/lights/lock', {})) { GB.toast('🔒 Locked! Restarting the show for the new layout…'); setTimeout(loadLights, 6000); } };
    // camera mapping
    $('suMapGo').onclick = camOpen;
    $('suCamCancel').onclick = async () => { await GB.post('/api/map/cancel', {}); stopCam(); };
    $('suCamStart').onclick = camRun;
    loadLights();
  });

  async function loadLights() {
    try { LS = await GB.get('/api/lights'); } catch (e) { return setTimeout(loadLights, 3000); }
    const box = $('suList'); if (!box) return; box.innerHTML = ''; renderGroupEdit();
    $('suCount').textContent = LS.devices.length ? LS.devices.length + (LS.devices.length === 1 ? ' LIGHT' : ' LIGHTS') : '';
    if (!LS.devices.length) box.innerHTML = '<p class="note">No lights yet. Tap Find my lights.</p>';
    LS.devices.forEach((d, i) => {
      const r = document.createElement('div'); r.className = 'su-dev' + (d.enabled ? '' : ' off');
      const st = !d.enabled ? 'off' : d.connected ? (d.mapped ? 'mapped by camera' : d.grid ? 'hand-made layout' : d.type === 'surplife' ? 'built-in 20×20 grid' : d.type === 'daybetter' ? 'one color, follows the show' : 'not mapped yet') : 'not connected';
      const col = DEVCOL[i % DEVCOL.length];
      const top = document.createElement('div'); top.className = 'su-top';
      top.innerHTML = `<span class="su-dot" style="background:${col};color:${col}"></span><div class="su-tx"><b>${esc(d.name)}</b><small>${esc(d.brand)} · ${esc(d.ip)} · ${d.n || '?'} lights · ${st}</small></div>`;
      r.appendChild(top);
      if (renaming === d.id) {                                     // ✏️ rename in place
        const f = document.createElement('div'); f.className = 'su-ren';
        f.innerHTML = `<input type="text" maxlength="40" aria-label="New name" value="${esc(d.name)}">`;
        const inp = f.firstChild;
        const save = async () => { const nm = inp.value.trim(); if (!nm) return GB.toast('Type a name');
          if (await GB.post('/api/lights/rename', {id: d.id, name: nm})) { renaming = null; GB.toast('✏️ Renamed to ' + nm); loadLights(); } };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { renaming = null; loadLights(); } });
        f.appendChild(btn('sm', 'Cancel', () => { renaming = null; loadLights(); }));
        f.appendChild(btn('c sm', 'Save', save, {style: '--c:var(--peri)'}));
        f.lastChild.style.setProperty('--c', 'var(--peri)');
        r.appendChild(f); setTimeout(() => { inp.focus(); inp.select(); }, 30);
      }
      const acts = document.createElement('div'); acts.className = 'su-acts';
      acts.appendChild(btn('', lbl('eye', 'Flash'), async () => { await GB.post('/api/lights/identify', {id: d.id}); GB.toast('👀 Flashing ' + d.name); }, {title: 'Flash it'}));
      acts.appendChild(btn(d.enabled ? '' : 'c', lbl(d.enabled ? 'power' : 'play', d.enabled ? 'Off' : 'On'), async () => { if (await GB.post('/api/lights/toggle', {id: d.id, enabled: !d.enabled})) { lsDirty = true; loadLights(); } }, {title: d.enabled ? 'Turn off' : 'Turn on'}));
      if (!d.enabled) acts.lastChild.style.setProperty('--c', 'var(--green)');
      acts.appendChild(btn('', lbl('edit', 'Name'), () => { renaming = renaming === d.id ? null : d.id; loadLights(); }, {title: 'Rename'}));
      const rm = btn('danger', lbl('trash', 'Remove'), null, {title: 'Remove'}); const rmHTML = rm.innerHTML;
      twice(rm, 'Sure?', rmHTML, async () => { if (await GB.post('/api/lights/remove', {id: d.id})) { lsDirty = true; GB.toast('Removed ' + d.name); loadLights(); } });
      acts.appendChild(rm); r.appendChild(acts);

      const grids = LS.devices.filter(x => x.is_grid && x.enabled && x.id !== d.id);
      if (d.is_grid && d.enabled && grids.length) {                   // 🔀 overlap this curtain on another one
        const o = document.createElement('label'); o.className = 'su-opt';
        o.innerHTML = `<span>Overlap</span><select><option value="">Not overlapping</option>${grids.map(x => `<option value="${esc(x.id)}" ${d.overlap_on === x.id ? 'selected' : ''}>Over ${esc(x.name)}</option>`).join('')}</select>`;
        o.querySelector('select').onchange = async e => { if (await GB.post('/api/lights/overlap', {id: d.id, on: e.target.value || null})) { GB.toast(e.target.value ? '🔀 Overlapping: bulbs fill the gaps' : 'Back to its own spot'); loadLights(); } };
        r.appendChild(o);
        if (d.overlap_on) ovRows(r, d, d.overlap_on);
      }
      if (d.type === 'surplife') {                                  // Bluetooth curtains: how they follow the show
        const m = document.createElement('div'); m.className = 'su-opt';
        m.innerHTML = `<span>Follow</span><div class="seg">${[['auto', 'Auto'], ['pixels', 'Picture'], ['beat', 'Beat bars']].map(([k, t]) => `<button class="btn${(d.mode || 'auto') === k ? ' on' : ''}" data-susm="${k}" style="--c:var(--peri)">${t}</button>`).join('')}</div>`;
        m.querySelectorAll('[data-susm]').forEach(b => b.onclick = async () => { if (await GB.post('/api/lights/surplife', {id: d.id, mode: b.dataset.susm})) { GB.toast({auto: 'Auto: picture for text/logos/holidays, beat bars for music', pixels: 'Shows the GlowBop picture (1-4 updates a second)', beat: 'Fast beat bars driven by GlowBop\'s music analysis'}[b.dataset.susm]); loadLights(); } });
        r.appendChild(m);
      }
      box.appendChild(r);
    });
    document.querySelectorAll('[data-sulay]').forEach(b => { b.classList.toggle('on', b.dataset.sulay === LS.layout); b.style.setProperty('--c', 'var(--peri)'); });
    $('suLayNote').textContent = LS.layout === 'zones' ? 'Zones: every light shows the whole effect on its own, all on the same beat.' : 'One canvas: all your lights together make one big picture, effects flow across them.';
    $('suApply').hidden = !lsDirty;
    drawLsMap(); renderLineup(); renderShape();
  }
  GB.on('page', id => { if (id === 'setup' && LS && !renaming && !camStream) loadLights(); });

  // 🧭 line-up wizard: number + arrow on every curtain, rotate / flip / order, lock
  function luOrder() { const ax = (LS.arrange || 'row') === 'stack' ? 1 : 0;
    return LS.devices.filter(d => d.is_grid && d.enabled).map((d, i) => ({d, i, k: d.pos ? d.pos[ax] * 100 + d.pos[1 - ax] : d.place ? d.place[ax] * 100 : 99999 + i})).sort((a, b) => a.k - b.k); }
  const OVOFF = [['x', '→ Side', 'Shift sideways'], ['y', '↓ Down', 'Shift down'], ['xy', '↘ Diag', 'Shift diagonally']];
  function ovSeg(d, onId) {                                       // 🔀 the 3 half-gap shifts for an overlapping curtain
    const s = document.createElement('div'); s.className = 'seg';
    OVOFF.forEach(([k, t, tip]) => { const b = btn((d.overlap || 'xy') === k ? 'on' : '', esc(t), null, {title: tip, ariaLabel: tip}); b.style.setProperty('--c', 'var(--peri)');
      b.onclick = async () => { if (await GB.post('/api/lights/overlap', {id: d.id, on: onId, off: k})) loadLights(); }; s.appendChild(b); });
    return s;
  }
  function ovAtSeg(d, onId) {                                     // 🎯 centered on the other curtain, or lined up at its top-left
    const s = document.createElement('div'); s.className = 'seg';
    [['center', '🎯 Center'], ['corner', '◰ Top-left']].forEach(([k, t]) => { const b = btn((d.overlap_at || 'center') === k ? 'on' : '', esc(t)); b.style.setProperty('--c', 'var(--peri)');
      b.onclick = async () => { if (await GB.post('/api/lights/overlap', {id: d.id, on: onId, at: k})) loadLights(); }; s.appendChild(b); });
    return s;
  }
  function ovRows(box, d, onId) {                                 // the Place + Shift rows under an overlapping curtain
    [['Place', ovAtSeg(d, onId)], ['Shift ½ gap', ovSeg(d, onId)]].forEach(([lab, seg]) => {
      const l = document.createElement('div'); l.className = 'su-opt'; l.innerHTML = `<span>${lab}</span>`; l.appendChild(seg); box.appendChild(l); });
  }
  function renderLineup() {
    if (!LS) return; const on = !!LS.lineup; $('suLu').hidden = !on; $('suLuStart').hidden = on;
    if (!on) return;
    document.querySelectorAll('[data-sulua]').forEach(b => { b.classList.toggle('on', b.dataset.sulua === (LS.arrange || 'row')); b.style.setProperty('--c', 'var(--lav)'); });
    $('suOvNote').hidden = LS.arrange !== 'overlap';
    const isGrid = LS.arrange === 'grid'; $('suGrid').hidden = !isGrid; if (isGrid) renderGrid();
    const box = $('suLuList'); box.innerHTML = ''; const ord = luOrder(), all = LS.devices.filter(d => d.enabled).map(d => d.id);
    ord.forEach(({d}, pos) => { const n = all.indexOf(d.id) + 1, o = d.orient || {rot: 0, flip: false};
      const r = document.createElement('div'); r.className = 'su-dev';
      r.innerHTML = `<div class="su-top"><span class="su-num" style="background:${DEVCOL[(n - 1) % DEVCOL.length]}">${n}</span>
        <div class="su-tx"><b>${esc(d.name)}</b><small>${d.gw}×${d.gh} · turned ${o.rot}°${o.flip ? ' · flipped' : ''}</small></div></div>`;
      const ctl = document.createElement('div'); ctl.className = 'seg';
      [['⟲', 'Turn left', {rotate: -90}], ['⟳', 'Turn right', {rotate: 90}], ['⇋', 'Flip left/right', {flip: 'x'}], ['⇅', 'Flip upside down', {flip: 'y'}]].forEach(([t, tip, body]) => {
        ctl.appendChild(btn('', t, async () => { if (await GB.post('/api/lights/orient', Object.assign({id: d.id, order: luOrder().map(x => x.d.id)}, body))) loadLights(); }, {title: tip, ariaLabel: tip})); });
      [['▲', -1, 'Move up'], ['▼', 1, 'Move down']].forEach(([t, dir, tip]) => {
        const b = btn('', t, async () => { const ids = luOrder().map(x => x.d.id), j = pos + dir; [ids[pos], ids[j]] = [ids[j], ids[pos]];
          if (await GB.post('/api/lights/arrange', {order: ids, how: LS.arrange || 'row'})) loadLights(); }, {title: tip, ariaLabel: tip});
        b.disabled = (dir < 0 ? pos === 0 : pos === ord.length - 1); if (LS.arrange !== 'grid') ctl.appendChild(b); });
      r.appendChild(ctl);
      if (LS.arrange === 'overlap' && pos > 0) ovRows(r, d, ord[0].d.id);
      box.appendChild(r);
    });
    if (!ord.length) box.innerHTML = '<p class="note">No grid curtains yet (Twinkly curtains or Surplife Bluetooth curtains). Add them above first.</p>';
  }

  // 🧊 shape: flat wall, or curtains wrapped around a cylinder / box / globe (art pieces)
  const SHAPE_TIPS = {
    flat: 'A normal flat wall. Use Line up below to set the order and the grid.',
    cylinder: 'Wrap the curtains side by side all the way around a tube or column, rows going around. Line them up below in the order they go around. Optional: one more curtain on the top as a lid.',
    box: 'Hang one curtain on each side of the box, side by side all the way around (2 to 4 sides). Optional: one more curtain on the top as a lid. Line them up below in the order they go around.',
    globe: 'Bend the curtains over a ball, side by side all the way around, rows going around like lines of latitude. Optional: a small curtain on the very top.'};
  let shapeBusy = false;
  function renderShape() {
    if (!LS) return; const cur = (LS.shape && LS.shape.kind) || 'flat';
    document.querySelectorAll('[data-sushape]').forEach(b => { b.classList.toggle('on', b.dataset.sushape === cur); b.style.setProperty('--c', 'var(--cyan)'); });
    $('suShapeTip').textContent = SHAPE_TIPS[cur];
    const grid = LS.devices.filter(d => d.is_grid && d.enabled);
    $('suLidRow').hidden = cur === 'flat' || grid.length < 2;
    const sel = $('suLid'), want = (LS.shape && LS.shape.top) || '';
    if (document.activeElement !== sel) sel.innerHTML = '<option value="">No lid (sides only)</option>' + grid.map(d => `<option value="${esc(d.id)}"${d.id === want ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
  }
  async function sendShape(kind, top) {
    if (shapeBusy) return; shapeBusy = true;
    const r = await GB.post('/api/lights/shape', {kind, top: top || null}); shapeBusy = false;
    if (r) { GB.toast(kind === 'flat' ? '🧱 Flat wall. Restarting the show…' : '🧊 ' + kind[0].toUpperCase() + kind.slice(1) + '! Restarting the show…'); setTimeout(loadLights, 7000); }
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-sushape]'); if (b) sendShape(b.dataset.sushape, $('suLid').value); });
  document.addEventListener('change', e => { if (e.target.id === 'suLid') sendShape((LS.shape && LS.shape.kind) || 'cylinder', e.target.value); });

  // ▦ grid wall: pick a rows x columns shape (up to 8 curtains), then which curtain hangs in each spot
  const GMAX = 8;
  function gridShape() {
    const n = LS.devices.filter(d => d.is_grid && d.enabled).length || 1, g = LS.grid_shape;
    if (g && g.cols) return g;
    const cols = Math.min(n, 4); return {cols, rows: Math.ceil(n / cols), slots: []};
  }
  async function sendGrid(cols, rows, slots) {
    if (await GB.post('/api/lights/arrange', {how: 'grid', cols, rows, slots, order: luOrder().map(x => x.d.id)})) loadLights();
  }
  function renderGrid() {
    const g = gridShape(), all = LS.devices.filter(d => d.enabled).map(d => d.id);
    const pick = $('suGPick'); pick.innerHTML = '';
    for (let r = 1; r <= GMAX; r++) for (let c = 1; c <= GMAX; c++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'su-gc';
      const ok = c * r <= GMAX, inside = c <= g.cols && r <= g.rows;
      b.disabled = !ok; if (inside) b.classList.add('on');
      b.title = c + ' across × ' + r + ' tall'; b.setAttribute('aria-label', b.title);
      b.onmouseenter = () => pick.querySelectorAll('.su-gc').forEach((x, k) => x.classList.toggle('hov', (k % GMAX) < c && Math.floor(k / GMAX) < r && !x.disabled));
      b.onclick = () => { GB.toast('▦ ' + c + ' across × ' + r + ' tall'); sendGrid(c, r, g.slots || []); };
      pick.appendChild(b);
    }
    pick.onmouseleave = () => pick.querySelectorAll('.hov').forEach(x => x.classList.remove('hov'));
    $('suGShape').textContent = g.cols + ' × ' + g.rows + ' · ' + (g.cols * g.rows) + ' spots';
    const box = $('suGSlots'); box.innerHTML = ''; box.style.gridTemplateColumns = `repeat(${g.cols}, minmax(0, 1fr))`;
    const slots = (g.slots || []).slice(); while (slots.length < g.cols * g.rows) slots.push(null);
    slots.forEach((id, k) => {
      const d = id && LS.devices.find(x => x.id === id), n = d ? all.indexOf(d.id) + 1 : 0;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'su-gs' + (d ? ' full' : '');
      if (d) b.style.setProperty('--c', DEVCOL[(n - 1) % DEVCOL.length]);
      b.innerHTML = d ? `<span class="su-num" style="background:${DEVCOL[(n - 1) % DEVCOL.length]}">${n}</span><small>${esc(d.name)}</small>` : '<small>Empty</small>';
      b.onclick = () => GB.sheet('Which curtain hangs here?', LS.devices.filter(x => x.is_grid && x.enabled).map(x => ({
        label: '#' + (all.indexOf(x.id) + 1) + '  ' + x.name, sub: x.gw + '×' + x.gh,
        onclick: () => { const ns = slots.slice(), old = ns.indexOf(x.id); if (old >= 0) ns[old] = ns[k]; ns[k] = x.id; sendGrid(g.cols, g.rows, ns); }
      })).concat([{label: 'Leave this spot empty', onclick: () => { const ns = slots.slice(); ns[k] = null; sendGrid(g.cols, g.rows, ns); }}]));
      box.appendChild(b);
    });
  }

  // 🧩 groups editor: pick a group for every light, name the groups, save & restart
  function renderGroupEdit() {
    if (!LS) return; const box = $('suGrp');
    if (!GE) { GE = {}; (LS.groups || []).forEach((g, gi) => g.devices.forEach(id => GE[id] = {g: gi + 1, name: g.name})); }
    const used = [...new Set(LS.devices.map(d => (GE[d.id] || {g: 1}).g))].sort();
    box.innerHTML = '<div class="list">' + LS.devices.map(d => `<div class="su-grp"><b>${esc(d.name)}</b>
       <select data-sugd="${esc(d.id)}" aria-label="Group for ${esc(d.name)}">${[1, 2, 3, 4].map(n => `<option value="${n}" ${((GE[d.id] || {g: 1}).g === n) ? 'selected' : ''}>Group ${n}</option>`).join('')}</select></div>`).join('') + '</div>' +
      (used.length > 1 ? `<p class="note">Group names:</p>` + used.map(n => { const nm = (LS.groups || [])[n - 1] ? LS.groups[n - 1].name : (n === 1 ? 'Main' : 'Group ' + n);
        return `<label class="su-gname">Group ${n}<input type="text" data-sugn="${n}" value="${esc(GE['_n' + n] || nm)}" maxlength="30"></label>`; }).join('') : '') +
      `<button class="btn c wide" id="suGrpSave" style="--c:var(--peri)">${lbl('save', 'Save groups')}</button>`;
    box.querySelectorAll('[data-sugd]').forEach(sel => sel.onchange = () => { GE[sel.dataset.sugd] = {g: +sel.value}; renderGroupEdit(); });
    box.querySelectorAll('[data-sugn]').forEach(inp => inp.oninput = () => GE['_n' + inp.dataset.sugn] = inp.value);
    $('suGrpSave').onclick = saveGroups;
    const n = (LS.groups || []).length; $('suAll').classList.toggle('on', n < 2); $('suAll').style.setProperty('--c', 'var(--peri)');
  }
  async function saveGroups() {
    const byG = {}; LS.devices.forEach(d => { const n = (GE[d.id] || {g: 1}).g; (byG[n] = byG[n] || []).push(d.id); });
    const groups = Object.keys(byG).sort().map(n => { const one = byG[n].length === 1 ? LS.devices.find(d => d.id === byG[n][0]).name : null;
      const typed = GE['_n' + n]; const old = (LS.groups || [])[n - 1];
      return {id: 'g' + n, name: typed || (old && old.name) || one || (n === '1' ? 'Main' : 'Group ' + n), devices: byG[n]}; });
    if (await GB.post('/api/lights/groups', {groups})) { lsDirty = true; GE = null; GB.toast(groups.length > 1 ? `🧩 ${groups.length} groups saved: tap Apply & restart` : 'All lights together: tap Apply & restart'); loadLights(); }
  }

  function drawLsMap() {
    const c = $('lsMap'), g = c.getContext('2d'); g.fillStyle = '#05040a'; g.fillRect(0, 0, c.width, c.height);
    if (!LS || !LS.points) return;
    // each group is its own picture: draw them side by side, same LED size, with a label
    const gids = [...new Set(LS.points.map(p => p.group))], blocks = gids.map(gid => { const ps = LS.points.filter(p => p.group === gid);
      const w = Math.max(1, ...ps.flatMap(p => p.x)) + 1, h = Math.max(1, ...ps.flatMap(p => p.y)) + 1; return {gid, ps, w, h}; });
    if (!blocks.length) return;
    const gap = 3, totW = blocks.reduce((a, b) => a + b.w, 0) + gap * (blocks.length - 1), maxH = Math.max(...blocks.map(b => b.h));
    const want = Math.round(c.width * (maxH + 2) / totW); if (Math.abs(c.height - want) > 2) { c.height = Math.max(120, Math.min(520, want)); g.fillStyle = '#05040a'; g.fillRect(0, 0, c.width, c.height); }
    const st = Math.min(c.width / totW, (c.height - 18) / maxH); let ox = 0;
    blocks.forEach(b => { const gn = ((LS.groups || []).find(x => x.id === b.gid) || {}).name;
      if (gn && blocks.length > 1) { g.fillStyle = '#bbb'; g.font = "600 13px 'Saira Condensed', system-ui"; g.fillText(gn.toUpperCase(), ox * st + 2, 13); }
      b.ps.forEach(p => { g.fillStyle = DEVCOL[LS.devices.findIndex(d => d.id === p.id) % DEVCOL.length] || '#fff';
        p.x.forEach((x, i) => { g.beginPath(); g.arc((ox + x) * st + st / 2, 18 + p.y[i] * st + st / 2, st * 0.3, 0, 6.283); g.fill(); }); });
      ox += b.w + gap; });
  }

  async function scan() {
    const box = $('suFound'); box.innerHTML = '<p class="note">Looking around your Wi-Fi for Twinkly, WLED and Govee lights, and Bluetooth for Surplife curtains (about 10 seconds; the first time, Bluetooth support installs itself)…</p>';
    $('suScan').disabled = true;
    const r = await GB.post('/api/lights/scan', {}); $('suScan').disabled = false;
    if (!r) { box.innerHTML = ''; return; }
    box.innerHTML = r.found.length ? '<div class="sub">Found nearby</div>' : '<p class="note">No lights found. For Govee, turn on LAN Control in the Govee app first. You can also Add by brand with the IP.</p>';
    r.found.forEach(f => {
      const row = document.createElement('div'); row.className = 'item';
      row.innerHTML = `<span class="su-dot" style="background:#555;color:transparent"></span><div class="su-tx"><b>${esc(f.name)}</b><small>${esc(BRAND[f.type] || f.type)} · ${esc(f.ip)}${f.n ? ' · ' + f.n + ' lights' : ''}${f.model ? ' · ' + esc(f.model) : ''}</small></div>`;
      const b = btn('c sm', f.added ? 'Added' : lbl('add', 'Add')); b.style.setProperty('--c', 'var(--cyan)'); b.style.flex = '0 0 auto'; b.disabled = !!f.added;
      b.onclick = async () => { if (await GB.post('/api/lights/add', {type: f.type, ip: f.ip, name: f.name})) { b.innerHTML = 'Added'; b.disabled = true; lsDirty = true; GB.toast('💡 Added ' + f.name); loadLights(); } };
      row.appendChild(b); box.appendChild(row);
    });
  }

  // --- camera mapping (the camera only works on the secure https page)
  async function camOpen() {
    if (!window.isSecureContext || !navigator.mediaDevices) {
      const url = LS && LS.https ? LS.https : 'https://<laptop>:8788/';
      const n = $('suHttps'); n.hidden = false;
      n.innerHTML = `The camera needs the secure page. Open <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a> on this device, tap <b>Show Details → visit this website</b>, then Map with camera again.`;
      return GB.toast('📷 The camera needs the secure page: open ' + url + ' (tap Show Details → visit this website)');
    }
    try { camStream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment', width: {ideal: 1280}, height: {ideal: 720}}, audio: false}); }
    catch (e) { return GB.toast('📷 Camera not allowed: ' + e.message); }
    $('suVid').srcObject = camStream; $('suCam').hidden = false; $('suProg').style.width = '0%'; $('suMapGo').hidden = true;
    $('suCamMsg').textContent = 'Point the camera so ALL your lights are in the picture, hold it still (lean it on something), and dim the room if you can. Then tap Start.';
  }
  function stopCam() { if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; $('suCam').hidden = true; $('suMapGo').hidden = false; }
  async function camRun() {
    const v = $('suVid'); if (!v.videoWidth) return GB.toast('Camera is still starting…');
    const st = await GB.post('/api/map/start', {}); if (!st) return;
    const w = 480, h = Math.round(480 * v.videoHeight / v.videoWidth), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', {willReadFrequently: true}), frames = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const grab = () => { g.drawImage(v, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data; const out = new Float32Array(w * h);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) out[j] = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return out; };
    $('suCamStart').disabled = true;
    try {
      for (let f = 0; f < st.frames; f++) {
        $('suCamMsg').textContent = `Mapping ${st.leds} lights… frame ${f + 1} of ${st.frames}. Keep the camera still.`;
        await GB.post('/api/map/show', {f}); await sleep(st.wait_ms);
        const a = grab(); await sleep(70); const b = grab();
        const u8 = new Uint8Array(w * h); for (let i = 0; i < u8.length; i++) u8[i] = Math.min(255, (a[i] + b[i]) / 2);
        let bin = ''; for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
        frames.push(btoa(bin)); $('suProg').style.width = Math.round((f + 1) / st.frames * 100) + '%';
      }
      $('suCamMsg').textContent = 'Working out where every light is…';
      const r = await GB.post('/api/map/finish', {w, h, frames});
      if (r && r.ok) { GB.sfx('ok'); GB.toast('🗺️ Mapped! ' + Object.values(r.stats).map(s => `${s.name}: ${s.found}/${s.total}`).join(', ')); stopCam(); loadLights(); }
      else if (r) { $('suCamMsg').textContent = '⚠️ ' + r.message; }
    } finally { $('suCamStart').disabled = false; }
  }

  // =================================================================== 2. LICENSE
  async function licLoad() {
    try { const r = await GB.get('/api/license');
      $('suLicInfo').textContent = r.owner ? 'Owner copy: no key needed.' : r.licensed ? `Active on this computer (${r.key}).` : 'Not unlocked yet.';
      $('suLicRow').hidden = !(!r.owner && r.licensed);
    } catch (e) {}
  }
  GB.panel('setup', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>License</span></div>
      <p class="note su-now" id="suLicInfo" style="color:var(--text)">–</p>
      <div id="suLicRow" hidden><button class="btn wide" id="suLicRemove">${lbl('unlock', 'Move my license to another computer')}</button></div>`;
    const b = $('suLicRemove'), idle = b.innerHTML;
    twice(b, 'Tap again to remove it from this computer', idle, async () => { await GB.post('/api/license', {remove: true}); GB.toast('License removed from this computer'); licLoad(); });
    licLoad();
  });
  GB.on('license', licLoad);

  // =================================================================== 3. SONG LOOKUP
  GB.panel('setup', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Song lookup</span></div>
      <p class="note">Genre, tempo and key from the song's name.</p>
      <div class="su-now" id="suSiNow">–</div>
      <div class="su-keys">
        <input type="password" id="suLfm" placeholder="Last.fm API key" autocomplete="off" aria-label="Last.fm API key">
        <input type="password" id="suBpm" placeholder="GetSongBPM API key" autocomplete="off" aria-label="GetSongBPM API key">
        <button class="btn c" id="suSiSave" style="--c:var(--cyan)">${lbl('save', 'Save')}</button>
      </div>
      <p class="note">Free keys: <b>last.fm/api/account/create</b> (genres) and <b>getsongbpm.com/api</b> (tempo + key). Each song is looked up once.</p>`;
    $('suSiSave').onclick = async () => { const b = {}; if ($('suLfm').value.trim()) b.lastfm = $('suLfm').value.trim(); if ($('suBpm').value.trim()) b.getsongbpm = $('suBpm').value.trim();
      if (!Object.keys(b).length) return GB.toast('Paste a key first'); if (await GB.post('/api/keys', b)) { $('suLfm').value = ''; $('suBpm').value = ''; GB.toast('🔑 Saved'); siLoad(); } };
    siLoop();
  });
  async function siLoad() {
    try { const r = await GB.get('/api/songinfo'), k = r.keys || {}, c = r.current;
      $('suLfm').placeholder = k.lastfm ? 'Last.fm key ✓ saved' : 'Last.fm API key'; $('suBpm').placeholder = k.getsongbpm ? 'GetSongBPM key ✓ saved' : 'GetSongBPM API key';
      $('suSiNow').textContent = c ? `${c.title || ''}${c.artist ? ' · ' + c.artist : ''} → ${(c.genres || []).slice(0, 4).join(', ') || c.note || 'no tags'}${c.bpm ? ' · ' + Math.round(c.bpm) + ' bpm' : ''}${c.key ? ' · ' + c.key : ''}${c.style ? ' · ' + {epic: '🎬 epic', dance: '🔊 dance', chill: '🌙 chill'}[c.style] : ''}`
        : (k.lastfm || k.getsongbpm ? 'Waiting for a song with a name…' : 'Add a free key below to look songs up.'); } catch (e) {}
  }
  let siFirst = true;
  async function siLoop() {
    if (siFirst || (GB.page === 'setup' && !document.hidden)) { siFirst = false; await siLoad(); }
    setTimeout(siLoop, 5000);
  }

  // =================================================================== 4. CONTROL FROM YOUR PHONE / SHARE THE REMOTE
  // On the laptop: the QR code to open the remote. On a phone or iPad: the same QR code, so a friend or coworker can
  // scan it right off your screen, plus Share (text / AirDrop) and Copy link.
  GB.css(`.su-share { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; } .su-share .btn { flex:1 1 140px; }`);
  GB.panel('setup', 40, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    const local = GB.local;
    el.innerHTML = `<div class="ph"><span>${local ? 'Control from your phone' : 'Share the remote'}</span></div>
      ${local ? '' : '<p style="font-size:14px;line-height:1.55;margin:0 0 10px">✅ This device is connected. To let someone else run the lights too, have them scan this code from your screen, or send them the link.</p>'}
      <div class="su-qr">
        <img id="suQr" alt="QR code for the GlowBop remote" hidden>
        <ol>
          <li>Their phone or iPad goes on the <b style="font-family:inherit;color:var(--text);font-weight:700">same Wi-Fi</b> as the GlowBop computer (not the guest network).</li>
          <li>Point the camera at the code, or type <b id="suLink">…</b> in Safari / Chrome.</li>
          <li>Tap <b style="font-family:inherit;color:var(--text);font-weight:700">Share → Add to Home Screen</b> to get the GlowBop app icon.</li>
        </ol>
      </div>
      <div class="su-share"><button class="btn" id="suShare" style="--c:var(--green)">📤 Share link</button><button class="btn" id="suCopy" style="--c:var(--cyan)">📋 Copy link</button></div>
      <p class="note">Not connecting? Make sure both are on the same Wi-Fi, turn off VPN on the phone, and if Windows asks, allow GlowBop on <b>private networks</b>. TikTok (Surplife) curtains talk to the computer over Bluetooth, so keep it within about 30 ft of them.</p>`;
    let link = '';
    GB.get('/api/link').then(j => { link = j.link; $('suLink').textContent = j.link; }).catch(() => {});
    $('suShare').hidden = !navigator.share;
    $('suShare').onclick = async () => { if (!link) return; try { await navigator.share({title: 'GlowBop remote', text: 'Run the GlowBop lights from your phone (same Wi-Fi):', url: link}); } catch (e) {} };
    $('suCopy').onclick = async () => { if (!link) return;
      try { await navigator.clipboard.writeText(link); GB.toast('📋 Link copied'); }
      catch (e) { const t = document.createElement('textarea'); t.value = link; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); GB.toast('📋 Link copied'); } catch (x) {} t.remove(); } };
    let tries = 0; const img = $('suQr');
    const load = () => { img.onload = () => { img.hidden = false; }; img.onerror = () => { if (++tries < 20) setTimeout(load, 15000); }; img.src = '/api/qr.svg?t=' + tries; };
    load();
  });

  // =================================================================== 5. HELP & FEEDBACK
  GB.panel('setup', 50, el => {
    el.id = 'helpPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `<div class="ph"><span>Help &amp; feedback</span></div>
      <div class="seg"><button class="btn" id="suFbBug" style="--c:var(--pink)">🐞 Report a bug</button><button class="btn" id="suFbReq" style="--c:var(--amber)">💡 Request a feature</button></div>
      <div id="suFbForm" class="su-box" hidden>
        <div class="sub" id="suFbTitle">Report a bug</div>
        <p class="note" id="suFbHint"></p>
        <input type="email" id="suFbEmail" placeholder="Your email (so we can reply)" autocomplete="email" inputmode="email" aria-label="Your email">
        <input type="text" id="suFbName" placeholder="Your name (optional)" autocomplete="name" aria-label="Your name">
        <input type="text" id="suFbSubj" placeholder="Short summary" maxlength="150" aria-label="Short summary">
        <textarea id="suFbMsg" maxlength="6000" aria-label="Message"></textarea>
        <label class="check" id="suFbDiagRow"><input type="checkbox" id="suFbDiag" checked><span>Include tech info to help us fix it faster: app version, Windows version, light brands and the app's recent activity log. No passwords, keys or personal files.</span></label>
        <div class="seg"><button class="btn" id="suFbCancel">Cancel</button><button class="btn c" id="suFbSend" style="--c:var(--violet)">Send</button></div>
      </div>
      <div id="suFbDone" class="su-done" hidden></div>
      <p class="note">Also see the <a href="https://glowbop.com/guide" target="_blank" rel="noopener"><b style="color:var(--cyan)">troubleshooting guide</b></a> at glowbop.com/guide.</p>`;
    let kind = 'bug';
    const hints = {bug: 'What happened, and what did you expect? Steps to make it happen again help a lot.', request: 'What would you love GlowBop to do? Tell us how you would use it.'};
    const holders = {bug: 'Example: When I tap Next effect, the right curtain freezes for a few seconds.', request: 'Example: A countdown for New Year’s Eve that ends in fireworks.'};
    const open = k => {
      kind = k; $('suFbDone').hidden = true; $('suFbForm').hidden = false;
      $('suFbTitle').textContent = k === 'bug' ? 'Report a bug' : 'Request a feature';
      $('suFbHint').textContent = hints[k]; $('suFbMsg').placeholder = holders[k];
      $('suFbDiagRow').hidden = k !== 'bug';
      $('suFbBug').classList.toggle('on', k === 'bug'); $('suFbReq').classList.toggle('on', k === 'request');
      $('suFbEmail').value = $('suFbEmail').value || GB.store.get('gb_fb_email', ''); $('suFbName').value = $('suFbName').value || GB.store.get('gb_fb_name', '');
      $('suFbForm').scrollIntoView({behavior: 'smooth', block: 'start'});
    };
    const close = () => { $('suFbForm').hidden = true; $('suFbBug').classList.remove('on'); $('suFbReq').classList.remove('on'); };
    $('suFbBug').onclick = () => open('bug'); $('suFbReq').onclick = () => open('request'); $('suFbCancel').onclick = close;
    $('suFbSend').onclick = async () => {
      const email = $('suFbEmail').value.trim(), msg = $('suFbMsg').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { GB.toast('⚠️ Please add your email so we can reply'); $('suFbEmail').focus(); return; }
      if (msg.length < 5) { GB.toast('⚠️ Please tell us a bit more'); $('suFbMsg').focus(); return; }
      GB.store.set('gb_fb_email', email); GB.store.set('gb_fb_name', $('suFbName').value.trim());
      const b = $('suFbSend'); b.disabled = true; b.textContent = 'Sending…';
      const r = await GB.post('/api/support', {kind, email, name: $('suFbName').value.trim(), subject: $('suFbSubj').value.trim(), message: msg, diag: kind === 'bug' && $('suFbDiag').checked});
      b.disabled = false; b.textContent = 'Send';
      if (!r) return;
      if (!r.ok) { GB.toast('⚠️ ' + (r.error || 'Could not send')); return; }
      $('suFbSubj').value = ''; $('suFbMsg').value = ''; close(); GB.sfx('ok');
      const d = $('suFbDone'); d.hidden = false;
      d.innerHTML = r.sent ? `${kind === 'bug' ? '🐞' : '💡'} Thanks! We got it.<b class="su-tk">${esc(r.ticket || '')}</b>A confirmation is on its way to <b class="su-em"></b>.` :
        `📬 Saved! It will send automatically as soon as this computer is online.`;
      const em = d.querySelector('.su-em'); if (em) em.textContent = email;
    };
  });

  // =================================================================== 6. QUIT
  GB.panel('setup', 60, el => {
    el.innerHTML = `<button class="btn danger lg wide" id="suQuit">${lbl('eject', 'Quit GlowBop')}</button><p class="note" style="text-align:center">Tap twice. Your curtains go back to normal.</p>`;
    let quitArm = 0;
    $('suQuit').onclick = async () => {
      if (Date.now() - quitArm > 3000) { quitArm = Date.now(); return GB.toast('Tap again to quit GlowBop'); }
      if (await GB.post('/api/quit', {})) { GB.toast('👋 GlowBop stopped'); setTimeout(() => { try { window.close(); } catch (e) {} }, 1200); }
    };
  });
})();
