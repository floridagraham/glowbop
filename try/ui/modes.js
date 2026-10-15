/* GlowBop console: modes. Screen mirror (scenes), Holidays (holiday), Fireplace (fire), Text & Logo (text).
   ids prefixed md, css prefixed .md- */
(function () {
  'use strict';
  const {$} = GB;
  const esc = GB.esc;

  GB.css(`
  .md-big { min-height:60px; font-size:calc(20px * var(--fs, 1)); letter-spacing:2px; }
  .md-big svg { width:24px; height:24px; }
  @media (max-width: 480px) { .md-big { font-size:calc(18px * var(--fs, 1)); letter-spacing:1px; } }
  .md-fg { display:grid; grid-template-columns:minmax(0, 1fr); gap:8px; }
  @media (min-width: 520px) { .md-fg { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
  .md-live { display:inline-flex; align-items:center; gap:6px; }
  .md-live::before { content:''; width:8px; height:8px; border-radius:50%; background:currentColor; box-shadow:0 0 8px currentColor; }
  .md-off { color:var(--dim) !important; }
  .md-off::before { box-shadow:none; opacity:.5; }
  .md-tiles { grid-template-columns:repeat(3, minmax(0, 1fr)) !important; }
  .md-tiles .tile { --c:var(--cyan); }
  @media (min-width: 700px) and (max-width: 999px) { .md-tiles { grid-template-columns:repeat(5, minmax(0, 1fr)) !important; } }
  @media (max-width: 480px) { .md-tiles .tile { font-size:calc(12px * var(--fs, 1)); letter-spacing:0; padding:10px 3px; } }
  .md-tiles .tile .md-on { position:absolute; top:6px; right:8px; font:600 calc(10px * var(--fs, 1)) var(--mono); letter-spacing:1px; }
  .md-hp { display:flex; flex-direction:column; gap:10px; border-top:2px solid var(--line); padding-top:12px; margin-top:2px; }
  .md-hp .md-hh { display:flex; align-items:center; gap:10px; font:700 calc(20px * var(--fs, 1))/1.1 var(--cond); letter-spacing:1.5px; text-transform:uppercase; }
  .md-hp .md-hh .em { font-size:calc(30px * var(--fs, 1)); }
  .md-fx { appearance:none; border:0; width:100%; display:flex; align-items:center; gap:12px; text-align:left; background:var(--dark2); color:var(--text); border-radius:0 14px 0 14px; padding:10px 12px; min-height:56px; border-left:6px solid var(--dark); transition:background .15s, opacity .15s; }
  .md-fx .t { flex:1; min-width:0; }
  .md-fx .t b { display:block; font:700 calc(16px * var(--fs, 1))/1.15 var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .md-fx .t small { display:block; color:var(--dim); font-size:calc(12px * var(--fs, 1)); line-height:1.35; margin-top:2px; }
  .md-fx .sw { flex:0 0 auto; width:46px; height:26px; border-radius:13px; background:#33304a; position:relative; transition:background .15s; }
  .md-fx .sw::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#8a85a8; transition:left .15s, background .15s; }
  .md-fx.on { border-left-color:var(--green); background:#15122a; }
  .md-fx.on .sw { background:var(--green); } .md-fx.on .sw::after { left:23px; background:#fff; }
  .md-fx:not(.on) { opacity:.6; }
  .md-fxl { display:flex; flex-direction:column; gap:6px; }
  .md-cols { display:flex; gap:8px; align-items:center; }
  .md-cols input[type=color] { flex:1 1 0; width:auto; min-width:0; }
  .md-ftiles { grid-template-columns:repeat(4, minmax(0, 1fr)); }
  .md-ftiles .tile { min-height:74px; font-size:calc(13px * var(--fs, 1)); }
  .md-ftiles .tile .em { font-size:calc(24px * var(--fs, 1)); }
  @media (max-width: 480px) { .md-ftiles .tile { font-size:calc(12px * var(--fs, 1)); padding:8px 4px; letter-spacing:.5px; } }
  .md-colrow { display:flex; gap:8px; align-items:stretch; min-width:0; }
  .md-colrow .seg { flex:1; min-width:0; }
  @media (max-width: 480px) { .md-colrow .seg > .btn { font-size:calc(14px * var(--fs, 1)); padding:0 4px; letter-spacing:.5px; } }
  .md-colrow input[type=color] { width:56px; }
  .md-colrow input[type=color].on { border-color:var(--gold); box-shadow:0 0 0 2px #fff inset; }
  .md-pre { display:flex; flex-wrap:wrap; gap:8px; }
  .md-pc { display:inline-flex; align-items:stretch; max-width:100%; min-width:0; }
  .md-pc .chip { border-radius:999px 4px 4px 999px; flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; line-height:44px; --c:var(--gold); }
  .md-pc .md-px { appearance:none; border:0; margin-left:3px; border-radius:4px 999px 999px 4px; background:var(--dark); color:var(--dim); min-width:48px; min-height:44px; padding:0 12px; font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; display:inline-flex; align-items:center; justify-content:center; }
  .md-pc .md-px svg { width:16px; height:16px; fill:currentColor; }
  .md-pc .md-px.sure { background:var(--red); color:#000; }
  .md-drop { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .md-drop .check { flex:1 1 180px; align-items:center; min-height:48px; color:var(--text); font-size:calc(15px * var(--fs, 1)); }
  .md-drop input[type=text] { flex:0 1 130px; width:130px; font-family:var(--mono); text-transform:uppercase; }
  .md-lg { display:flex; gap:12px; align-items:center; }
  .md-lg canvas { flex:0 0 auto; width:96px; height:100px; background:#000; border-radius:0 14px 0 14px; border:2px solid var(--dark); }
  .md-lg > div { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
  #mdTxText { font:calc(20px * var(--fs, 1)) var(--mono); letter-spacing:1px; }
  .md-ba { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
  .md-ba.one { grid-template-columns:minmax(0, 1fr); }
  .md-ba figure { margin:0; min-width:0; background:#05040a; border:2px solid var(--dark); border-radius:0 14px 0 14px; padding:6px; display:flex; flex-direction:column; gap:4px; }
  .md-ba figure[hidden] { display:none; }
  .md-ba figure.sel { border-color:var(--pink); box-shadow:0 0 14px color-mix(in srgb, var(--pink) 35%, transparent); }
  .md-ba figcaption { display:flex; justify-content:space-between; gap:6px; font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--label); min-width:0; }
  .md-ba figcaption span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
  .md-ba .md-onw { font:600 calc(10px * var(--fs, 1)) var(--mono); font-style:normal; letter-spacing:1px; color:#000; background:var(--pink); border-radius:999px; padding:1px 7px; visibility:hidden; flex:0 0 auto; }
  .md-ba figure.sel .md-onw { visibility:visible; }
  .md-ba canvas { max-width:100%; display:block; margin:auto; }
  .md-lgnote { color:var(--green); }
  .md-lm.seg.wrap > .btn { flex:1 1 30%; padding:0 4px; }
  @media (max-width: 480px) { .md-lm.seg.wrap > .btn { font-size:calc(14px * var(--fs, 1)); letter-spacing:.5px; } }
  #mdLgEvery[hidden] { display:none; }
  .md-wall { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:5px; }
  .md-wall > .btn { min-height:62px; font-size:calc(18px * var(--fs, 1)); letter-spacing:1.5px; padding:0 4px; }
  .md-wall > .btn:not(.on) { background:var(--dark); color:var(--text); box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--c) 35%, transparent); }
  .md-wall > .btn.on { box-shadow:0 0 0 2px #fff inset, 0 0 22px color-mix(in srgb, var(--c) 75%, transparent); }
  @media (max-width: 480px) { .md-wall > .btn { font-size:calc(16px * var(--fs, 1)); letter-spacing:.5px; gap:4px; } .md-wall > .btn svg { width:16px; height:16px; } }
  .md-livebtn { appearance:none; border:0; background:color-mix(in srgb, currentColor 14%, transparent); color:var(--c, var(--green)); border-radius:999px; min-height:32px; padding:0 12px; cursor:pointer;
    font:700 calc(12px * var(--fs, 1))/1 var(--mono); letter-spacing:1px; }
  .md-livebtn:not(.md-off) { color:var(--green); }
  .md-more { border-top:2px solid var(--line); padding-top:4px; }
  .md-more > summary { min-height:48px; }
  .md-morein { display:flex; flex-direction:column; gap:10px; padding-bottom:4px; }
  .md-lgwarn { color:var(--gold); }
  #mdLgLay[hidden], #mdLgLay [hidden] { display:none; }
  .md-built .chip { border-radius:999px; }
  @media (max-width: 480px) { .md-colrow input[type=color] { width:44px; } .md-colrow .seg > .btn { flex:1 1 auto; } }
  `);

  // =========================================================== 🖥️ SCREEN MIRROR
  let mirState = null, mirStyle = 'straight', mirArea = 'smart';
  GB.panel('scenes', 30, el => {
    el.id = 'mirrorPanel';
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `
      <div class="ph"><span>Screen mirror</span><span class="r"><span class="md-live md-off" id="mdMirLive">OFF</span></span></div>
      <p class="note">Shows the laptop screen on the wall: TV shows, videos, games.</p>
      <button class="btn c wide md-big" id="mdMirGo" style="--c:var(--cyan)"></button>
      <div class="sub">Style</div>
      <div class="seg" id="mdMirStyle">
        <button class="btn" data-ms="straight">${GB.svg('tv')}<span>TV</span></button>
        <button class="btn" data-ms="beat">${GB.svg('note')}<span>Beat</span></button>
        <button class="btn" data-ms="ambient">${GB.svg('sparkle')}<span>Glow</span></button>
      </div>
      <div class="sub">Area</div>
      <div class="seg" id="mdMirArea">
        <button class="btn" data-ma="smart">Smart fill</button>
        <button class="btn" data-ma="center">Center zoom</button>
      </div>
      <p class="note">Smart fill trims black bars so a playing video fills the whole wall. Center zoom shows bigger shapes. Works best with the video full screen.</p>`;
    el.querySelectorAll('.seg .btn').forEach(b => b.style.setProperty('--c', 'var(--cyan)'));
    $('mdMirGo').onclick = async () => {
      if (mirState) { if (await GB.control({mirror: null})) { GB.toast('🎵 Back to the music show'); mirState = null; renderMirror(); } }
      else if (await GB.control({mirror: {style: mirStyle, area: mirArea}})) { GB.toast('🖥️ Mirroring the laptop screen'); mirState = {style: mirStyle, area: mirArea}; renderMirror(); }
    };
    el.querySelectorAll('[data-ms]').forEach(b => b.onclick = async () => { mirStyle = b.dataset.ms; if (mirState) await GB.control({mirror: {style: mirStyle, area: mirArea}}); renderMirror(); });
    el.querySelectorAll('[data-ma]').forEach(b => b.onclick = async () => { mirArea = b.dataset.ma; if (mirState) await GB.control({mirror: {style: mirStyle, area: mirArea}}); renderMirror(); });
    renderMirror();
  });
  function renderMirror() {
    const go = $('mdMirGo'); if (!go) return;
    if (mirState) { mirStyle = mirState.style || mirStyle; mirArea = mirState.area || mirArea; }
    GB.lbl(go, mirState ? 'stop' : 'play', mirState ? 'Stop mirroring' : 'Mirror my screen');
    go.classList.toggle('on', !!mirState); go.style.setProperty('--c', mirState ? 'var(--orange)' : 'var(--cyan)');
    document.querySelectorAll('#mirrorPanel [data-ms]').forEach(b => b.classList.toggle('on', b.dataset.ms === mirStyle));
    document.querySelectorAll('#mirrorPanel [data-ma]').forEach(b => b.classList.toggle('on', b.dataset.ma === mirArea));
    const lv = $('mdMirLive'); lv.textContent = mirState ? 'LIVE' : 'OFF'; lv.classList.toggle('md-off', !mirState);
  }

  // =========================================================== 🎁 HOLIDAYS
  let hOpen = null, hLive = null;
  const hex = c => '#' + c.map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
  const cat = () => GB.catalog && GB.catalog.holidays;
  function hState(k) {
    const h = cat()[k], p = h.prefs || {};
    return {fx: p.fx || h.fx.map(f => f.name), name: p.name || '', team: p.team || [[1, 0.35, 0], [0, 0.55, 0.6]]};
  }
  async function hSend(k, extra) {
    const st = hState(k), body = Object.assign({key: k, fx: st.fx, name: st.name}, cat()[k].team ? {team: st.team} : {}, extra);
    const r = await GB.control({holiday: body}); if (r) cat()[k].prefs = {fx: st.fx, name: st.name, team: st.team}; return r;
  }
  GB.panel('holiday', 10, el => {
    el.id = 'mdHolPanel';
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `
      <div class="ph"><span>Holidays</span><span class="r" id="mdHolLive">PICK ONE</span></div>
      <p class="note">Plays only that holiday's effects, cycling with the music, until you stop it. Tap a holiday to see its options.</p>
      <div class="tiles md-tiles" id="mdHGrid"><p class="note">Loading…</p></div>
      <div class="md-hp" id="mdHPanel" hidden></div>`;
  });
  function renderHolidays() {
    const g = $('mdHGrid'); if (!g || !cat()) return;
    const H = cat();
    g.innerHTML = '';
    Object.entries(H).forEach(([k, h]) => {
      const b = document.createElement('button'); b.className = 'tile' + (k === hOpen ? ' open' : '') + (k === hLive ? ' on' : '');
      b.innerHTML = `<span class="em">${esc(h.emoji)}</span><span>${esc(h.name)}</span>` + (k === hLive ? '<span class="md-on">● ON</span>' : '');
      b.setAttribute('aria-pressed', k === hOpen ? 'true' : 'false');
      b.onclick = () => { hOpen = hOpen === k ? null : k; renderHolidays(); };
      g.appendChild(b);
    });
    const lh = hLive && H[hLive]; $('mdHolLive').textContent = lh ? '● ' + lh.name.toUpperCase() + ' ON' : 'PICK ONE';
    const pn = $('mdHPanel');
    if (!hOpen || !H[hOpen]) { pn.hidden = true; pn.innerHTML = ''; return; }
    const k = hOpen, h = H[k], st = hState(k), live = hLive === k;
    pn.hidden = false; pn.innerHTML = '';
    const hh = document.createElement('div'); hh.className = 'md-hh';
    hh.innerHTML = `<span class="em">${esc(h.emoji)}</span><span>${esc(h.name)}</span>`; pn.appendChild(hh);
    const go = document.createElement('button'); go.id = 'mdHGo';
    go.className = 'btn c wide md-big' + (live ? ' on' : ''); go.style.setProperty('--c', live ? 'var(--orange)' : 'var(--cyan)');
    GB.lbl(go, live ? 'stop' : 'play', live ? 'Stop ' + h.name : 'Start ' + h.name);
    go.onclick = async () => {
      if (live) { if (await GB.control({holiday: null})) { GB.toast('🎵 Back to the music show'); hLive = null; renderHolidays(); } }
      else if (await hSend(k, {on: true})) { GB.toast(h.emoji + ' ' + h.name + ' is on'); hLive = k; renderHolidays(); }
    };
    pn.appendChild(go);
    if (h.name_field) {
      const d = document.createElement('label'); d.className = 'field';
      d.innerHTML = `<span>${esc(h.name_field)}</span><input type="text" maxlength="20" placeholder="${h.team ? 'e.g. Dolphins' : 'e.g. Jackson'}" autocomplete="off">`;
      const inp = d.querySelector('input'); inp.value = st.name; let tm = null;
      inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { cat()[k].prefs = Object.assign({}, cat()[k].prefs, {fx: st.fx, team: st.team, name: inp.value}); hSend(k, {on: false}); }, 500); };
      pn.appendChild(d);
    }
    if (h.team) {
      const d = document.createElement('div'); d.className = 'field';
      d.innerHTML = `<span>Team colors</span><div class="md-cols"><input type="color" aria-label="Team color 1"><input type="color" aria-label="Team color 2"></div>`;
      const cs = d.querySelectorAll('input');
      cs.forEach((c, i) => { c.value = hex(st.team[i]); c.onchange = () => { const t = [rgbOf(cs[0].value), rgbOf(cs[1].value)]; cat()[k].prefs = Object.assign({}, cat()[k].prefs, {fx: st.fx, name: st.name, team: t}); hSend(k, {on: false}); GB.toast('🎨 Team colors set'); }; });
      pn.appendChild(d);
    }
    const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = 'Effects (' + st.fx.length + ' of ' + h.fx.length + ' on)'; pn.appendChild(sub);
    const note = document.createElement('p'); note.className = 'note'; note.textContent = 'Switch effects on or off. Only the ones that are on will cycle.'; pn.appendChild(note);
    const list = document.createElement('div'); list.className = 'md-fxl';
    h.fx.forEach(f => {
      const on = st.fx.includes(f.name);
      const b = document.createElement('button'); b.className = 'md-fx' + (on ? ' on' : ''); b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.innerHTML = `<span class="t"><b>${esc(f.name.replace(/([a-z])([A-Z])/g, '$1 $2'))}</b><small>${esc((f.about || '').length > 90 ? f.about.slice(0, 88).replace(/\s+\S*$/, '') + '…' : (f.about || ''))}</small></span><i class="sw"></i>`;
      b.onclick = async () => {
        const fx2 = on ? st.fx.filter(n => n !== f.name) : st.fx.concat([f.name]);
        if (!fx2.length) return GB.toast('Keep at least one on');
        cat()[k].prefs = Object.assign({}, cat()[k].prefs, {fx: fx2, name: st.name, team: st.team});
        renderHolidays(); await hSend(k, {on: false});
      };
      list.appendChild(b);
    });
    pn.appendChild(list);
  }
  GB.on('catalog', c => {
    if (!hOpen && GB.status && GB.status.holiday) hOpen = GB.status.holiday;
    renderHolidays();
  });

  // =========================================================== 🔥 FIREPLACE
  const FIRE_STYLES = [['fireplace', '🔥', 'Fireplace'], ['campfire', '🏕️', 'Campfire'], ['bonfire', '🎇', 'Bonfire'],
                       ['candles', '🕯️', 'Candle wall'], ['torches', '🔦', 'Torch row'], ['pixel', '👾', 'Pixel flames'],
                       ['spirit', '👻', 'Spirit fire'], ['lava', '🌋', 'Lava rising'], ['dragon', '🐉', 'Dragon breath']];
  const FIRE_COLORS = {classic: ['fire', 'Classic'], blue: ['fire', 'Blue gas'], purple: ['fire', 'Purple'], rainbow: ['rainbow', 'Rainbow'],   // GB.svg icon, tinted by FIRE_TINT
                       green: ['fire', 'Green'], pink: ['fire', 'Pink'], ice: ['freeze', 'Ice'], team: ['fire', 'Team colors'], nightshift: ['moon', 'Night shift']};
  const FIRE_TINT = {classic: 'var(--orange)', blue: 'var(--cyan)', purple: 'var(--violet)', rainbow: 'var(--gold)', green: 'var(--green)', pink: 'var(--pink)', ice: '#dfe8ff',
                     team: 'var(--pink)', nightshift: 'var(--peri)'};
  const FIRE_MSG = {fireplace: '🔥 Fireplace', campfire: '🏕️ Campfire', bonfire: '🎇 Bonfire', candles: '🕯️ Candle wall', torches: '🔦 Torch row',
                    pixel: '👾 Pixel flames', spirit: '👻 Spirit fire', lava: '🌋 Lava rising', dragon: '🐉 Dragon breath'};
  let fireLocal = {}, fireTeamT = null;
  const fireState = () => Object.assign({}, (GB.status && GB.status.fireplace) || {}, fireLocal);
  const fireSet = o => { fireLocal = Object.assign({}, fireLocal, o); renderFire(); };
  GB.css(`
  .md-stiles { grid-template-columns:repeat(3, minmax(0, 1fr)) !important; }
  #mdFCol { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .md-stiles .tile { min-height:74px; font-size:calc(13px * var(--fs, 1)); --c:var(--orange); }
  .md-stiles .tile .em { font-size:calc(24px * var(--fs, 1)); }
  @media (max-width: 480px) { .md-stiles .tile { font-size:calc(12px * var(--fs, 1)); padding:8px 4px; letter-spacing:.5px; } }
  .md-team { display:flex; gap:8px; align-items:center; min-width:0; }
  .md-team label { flex:1 1 0; min-width:0; display:flex; align-items:center; gap:8px; font:600 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--label); }
  .md-team input[type=color] { flex:1 1 auto; width:auto; min-width:0; }
  .md-team[hidden] { display:none; }`);
  GB.panel('fire', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orange)');
    el.innerHTML = `
      <div class="ph"><span>Fireplace</span><span class="r"><span class="md-live md-off" id="mdFLive">OUT</span></span></div>
      <p class="note">Fire on the wall, nine ways. Pick a style, a color, and how it moves with the music.</p>
      <button class="btn c wide md-big" id="mdFOn" style="--c:var(--orange)"></button>
      <div class="sub">Style</div>
      <div class="tiles md-stiles" id="mdFSty"></div>
      <div class="md-fg">
        <div class="field"><span>Flames</span><div class="seg"><button class="btn" data-fm="cozy">Cozy</button><button class="btn" data-fm="roar">Roaring</button></div></div>
        <div class="field"><span>Music</span><div class="seg"><button class="btn" data-fd="0">Calm</button><button class="btn" data-fd="1">Dance</button></div></div>
        <div class="field"><span>Flare on the beat</span><div class="seg"><button class="btn" data-fb="0">Off</button><button class="btn" data-fb="1">On</button></div></div>
      </div>
      <div class="sub">Flame color</div>
      <div class="tiles md-ftiles" id="mdFCol"></div>
      <div class="md-team" id="mdFTeam" hidden>
        <label>Color 1<input type="color" id="mdFT1" value="#ff3d9a"></label>
        <label>Color 2<input type="color" id="mdFT2" value="#33d6ff"></label>
      </div>
      <p class="note">Stays lit until you put it out. Cozy is tall and relaxing. Roaring flickers wild with big flare-ups and sparks. Dance makes the flames swell with the music. Flare on the beat makes every style jump on the kick, and loud music sends gusts of wind through the flames. Night shift slowly drifts from orange to purple, blue and green over about 20 minutes.</p>`;
    el.querySelectorAll('.seg .btn').forEach(b => b.style.setProperty('--c', 'var(--orange)'));
    $('mdFOn').onclick = async () => {
      const on = !fireState().on;
      if (await GB.fire({on})) { GB.toast(on ? '🔥 Fire is lit' : '🎵 Fire is out. Back to the music show'); fireSet({on}); }
    };
    const sty = $('mdFSty');
    FIRE_STYLES.forEach(([k, em, name]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.fs = k;
      b.innerHTML = `<span class="em">${em}</span><span>${esc(name)}</span>`;
      b.onclick = async () => { if (await GB.fire({style: k, on: true})) { GB.toast(FIRE_MSG[k] || name); fireSet({style: k, on: true}); } };
      sty.appendChild(b);
    });
    el.querySelectorAll('[data-fm]').forEach(b => b.onclick = async () => { const m = b.dataset.fm; if (await GB.fire({mode: m})) { GB.toast(m === 'roar' ? '🔥 Roaring fire' : '🛋️ Cozy fire'); fireSet({mode: m}); } });
    el.querySelectorAll('[data-fd]').forEach(b => b.onclick = async () => { const d = b.dataset.fd === '1'; if (await GB.fire({dance: d})) { GB.toast(d ? '💃 Flames dance with the music' : '🕯️ Calm fire'); fireSet({dance: d}); } });
    el.querySelectorAll('[data-fb]').forEach(b => b.onclick = async () => { const v = b.dataset.fb === '1'; if (await GB.fire({beat: v})) { GB.toast(v ? '🥁 Flames flare on the beat' : '🔥 No beat flares'); fireSet({beat: v}); } });
    const sendTeam = () => {
      clearTimeout(fireTeamT);
      fireTeamT = setTimeout(async () => {
        const t1 = $('mdFT1').value, t2 = $('mdFT2').value;
        fireTeamT = null;
        if (await GB.fire({color: 'team', team1: t1, team2: t2, on: true})) fireSet({color: 'team', team1: t1, team2: t2, on: true});
      }, 250);
    };
    $('mdFT1').oninput = sendTeam; $('mdFT2').oninput = sendTeam;
    buildFireColors(Object.keys(FIRE_COLORS));
    renderFire();
  });
  function buildFireColors(list) {
    const box = $('mdFCol'); if (!box) return;
    const key = list.join(','); if (box._k === key) return; box._k = key; box.innerHTML = '';
    list.forEach(c => {
      const [em, name] = FIRE_COLORS[c] || ['fire', c];
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.fc = c; b.style.setProperty('--c', FIRE_TINT[c] || 'var(--orange)');
      b.innerHTML = `<span class="em">${GB.svg(em)}</span><span>${esc(name)}</span>`;
      b.onclick = async () => {
        const body = {color: c, on: true};
        if (c === 'team') { body.team1 = $('mdFT1').value; body.team2 = $('mdFT2').value; }
        if (await GB.fire(body)) { if (c === 'nightshift') GB.toast('🌙 Night shift: colors drift over 20 minutes'); fireSet(body); }
      };
      box.appendChild(b);
    });
  }
  function renderFire() {
    const go = $('mdFOn'); if (!go) return;
    const f = fireState(), on = !!f.on, col = f.color || 'classic';
    go.innerHTML = GB.svg(on ? 'stop' : 'fire') + '<span>' + (on ? 'Put out fire' : 'Light the fire') + '</span>';
    go.classList.toggle('on', on);
    document.querySelectorAll('#mdFSty [data-fs]').forEach(x => x.classList.toggle('on', x.dataset.fs === (f.style || 'fireplace')));
    document.querySelectorAll('#mdFCol [data-fc]').forEach(x => x.classList.toggle('on', x.dataset.fc === col));
    document.querySelectorAll('#pg-fire [data-fd]').forEach(x => x.classList.toggle('on', x.dataset.fd === (f.dance ? '1' : '0')));
    document.querySelectorAll('#pg-fire [data-fm]').forEach(x => x.classList.toggle('on', x.dataset.fm === (f.mode || 'cozy')));
    document.querySelectorAll('#pg-fire [data-fb]').forEach(x => x.classList.toggle('on', x.dataset.fb === (f.beat ? '1' : '0')));
    const tm = $('mdFTeam'); tm.hidden = col !== 'team';
    [['mdFT1', f.team1], ['mdFT2', f.team2]].forEach(([id, v]) => { const i = $(id); if (v && /^#[0-9a-f]{6}$/i.test(v) && document.activeElement !== i && !fireTeamT) i.value = v; });
    const lv = $('mdFLive'); lv.textContent = on ? 'LIT' : 'OUT'; lv.classList.toggle('md-off', !on);
  }

  // =========================================================== 🔤 TEXT & LOGO
  // One "On the wall" switch at the top (OFF | TEXT | LOGO | BOTH) decides what shows. Everything else only edits settings.
  let TX = {state: {}, presets: []}, txMode = 'scroll', txColor = 'look', txLayer = 'over', lgMode = 'still', lgPixels = null, txLive = null;
  let lgSrc = null, lgRes = null, lgRz = null, lgOpt = {boost: true, removeBg: true}, lgLayout = 'auto', lgJobs = [], lgTimer = null;
  try { Object.assign(lgOpt, JSON.parse(localStorage.getItem('gb_logo_opts') || '{}')); } catch (e) {}
  const LG_HINT = 'Any picture works. A flat background is removed for you.';
  const LM_TIP = {still: 'Logo glows with the beat', pulse: 'Logo punches on every kick', shimmer: 'Logo colors shift each bar',
    sparks: '✨ Logo builds itself from sparks', wipe: 'Logo wipes in on the beat', drop: '💥 Logo blasts apart on every drop', twinkle: '✨ Logo pops in dot by dot, then twinkles'};
  const LM_NOTE = {still: 'Glows and breathes with the beat.', pulse: 'Punches bigger on every kick.', shimmer: 'Colors swing round the color wheel each bar.',
    sparks: 'Builds itself from flying sparks each time it appears, then breathes.', wipe: 'Wipes in left to right on the beat, then holds.',
    drop: 'Holds, then explodes into particles on every drop and flies back together.', twinkle: 'Pops in dot by dot with a white flash, then random dots glint, like the GlowBop icon.'};
  const WALL = {off: 'Off', text: 'Text', logo: 'Logo', both: 'Both'};
  async function loadText() {
    try {
      TX = await GB.get('/api/text?px=1' + (GB.gsel ? '&g=' + encodeURIComponent(GB.gsel) : ''));
      TX.state = TX.state || {};
      const s = TX.state || {};
      txMode = s.mode || 'scroll'; txColor = s.color || 'look'; txLayer = s.layer || 'over'; lgMode = s.logo_mode || 'still';
      if (s.text && !$('mdTxText').value) $('mdTxText').value = s.text;
      $('mdTxDrop').checked = !!s.drop_flash; if (s.drop_word) $('mdTxDropWord').value = s.drop_word;
      if (s.speed) { $('mdTxSpeed').value = Math.round(s.speed * 10); GB.paintRange($('mdTxSpeed')); }
      if (s.color && s.color.startsWith('#')) { $('mdTxColor').value = s.color; txColor = 'custom'; }
      if (s.has_logo && !(lgRes && lgRes.name === s.logo_name)) $('mdLgName').innerHTML = GB.svg('check') + ' ' + esc(s.logo_name || 'logo') + ' loaded';
      else if (!s.has_logo && !lgPixels) $('mdLgName').textContent = LG_HINT;
      renderText(); lgPaint();
    } catch (e) {}
  }
  const txColorVal = () => txColor === 'custom' ? $('mdTxColor').value : txColor;
  const txBody = () => ({text: $('mdTxText').value.trim() || 'GLOWBOP', mode: txMode, color: txColorVal(), layer: txLayer, speed: $('mdTxSpeed').value / 10,
    drop_flash: $('mdTxDrop').checked, drop_word: ($('mdTxDropWord').value || 'DROP').trim(), logo_mode: lgMode});
  async function sendText(b, msg) { const r = await GB.post('/api/text', GB.withGroup(b)); if (r) { if (msg) GB.toast(msg); setTimeout(loadText, 250); } return r; }
  const showing = () => (TX.state || {}).show || 'off';
  function txUpdate() { renderText(); const v = showing(); if (v === 'text' || v === 'both') { clearTimeout(txLive); txLive = setTimeout(() => sendText(txBody()), 250); } }
  // the one switch: OFF fades out (and a slideshow can't bring the logo back while it's off)
  function setWall(v) {
    const s = TX.state || {}; if (v === showing()) return;
    s.show = v; renderText();
    if (v === 'off') return sendText({show: 'off'}, 'Fading out. The light show plays on.');
    if (v === 'text') return sendText(Object.assign(txBody(), {show: 'text'}), '🔤 Text on the wall');
    const b = v === 'both' ? Object.assign(txBody(), {show: 'both'}) : {show: 'logo'};
    if (lgRes && !(s.has_logo && s.logo_name === lgRes.name)) Object.assign(b, lgBody());
    const none = !s.has_logo && !lgRes;
    return sendText(b, none ? '✨ No picture yet, so here is the GlowBop logo' : v === 'both' ? '🔁 Text and logo take turns every 8 bars' : '🖼️ Logo on the wall');
  }
  const liveBtn = id => `<button type="button" class="md-live md-off md-livebtn" id="${id}" aria-label="Turn on or off">OFF</button>`;
  const more = (id, inner) => `<details class="md-more" id="${id}"><summary>More options</summary><div class="md-morein">${inner}</div></details>`;
  const keepOpen = el => el.querySelectorAll('details.md-more').forEach(d => { try { d.open = localStorage.getItem('gb_' + d.id) === '1'; } catch (e) {}
    d.addEventListener('toggle', () => { try { localStorage.setItem('gb_' + d.id, d.open ? '1' : '0'); } catch (e) {} }); });

  GB.panel('text', 5, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)');
    el.innerHTML = `
      <div class="ph"><span>On the wall</span><span class="r"><span class="md-live md-off" id="mdWallLive">OFF</span></span></div>
      <div class="seg md-wall" id="mdWall" role="radiogroup" aria-label="What shows on the wall">
        <button class="btn" data-ws="off" style="--c:var(--orange)" role="radio">${GB.svg('power')}<span>Off</span></button>
        <button class="btn" data-ws="text" style="--c:var(--gold)" role="radio"><span>Text</span></button>
        <button class="btn" data-ws="logo" style="--c:var(--pink)" role="radio"><span>Logo</span></button>
        <button class="btn" data-ws="both" style="--c:var(--lav)" role="radio"><span>Both</span></button>
      </div>
      <p class="note" id="mdWallNote"></p>
      ${more('mdWallMore', `
        <div class="sub">Layer</div>
        <div class="seg md-lav"><button class="btn" data-tl="over">Over the show</button><button class="btn" data-tl="solo">Spotlight</button></div>
        <p class="note">Over the show: the show keeps playing behind your words and logo. Spotlight: the show dims to a soft glow.</p>
        <div class="md-drop"><label class="check"><input type="checkbox" id="mdTxDrop"><span>Flash a word on every drop</span></label>
          <input type="text" id="mdTxDropWord" maxlength="12" value="DROP" aria-label="Drop word" style="--c:var(--gold)"></div>`)}`;
    el.querySelectorAll('.md-lav .btn').forEach(b => b.style.setProperty('--c', 'var(--lav)'));
    el.querySelectorAll('[data-ws]').forEach(b => b.onclick = () => setWall(b.dataset.ws));
    el.querySelectorAll('[data-tl]').forEach(b => b.onclick = () => { txLayer = b.dataset.tl; renderText(); sendText({layer: txLayer}, txLayer === 'solo' ? 'Spotlight: the show dims behind' : 'Over the show'); });
    $('mdTxDrop').onchange = () => sendText({drop_flash: $('mdTxDrop').checked, drop_word: ($('mdTxDropWord').value || 'DROP').trim()}, $('mdTxDrop').checked ? '💥 Drops will flash your word' : 'Drop word off');
    $('mdTxDropWord').onchange = () => sendText({drop_word: ($('mdTxDropWord').value || 'DROP').trim()});
    keepOpen(el);
  });

  GB.panel('text', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `
      <div class="ph"><span>Text</span><span class="r">${liveBtn('mdTxLive')}</span></div>
      <input type="text" id="mdTxText" maxlength="120" placeholder="e.g. HAPPY BIRTHDAY JACK *" autocomplete="off" aria-label="Message" style="--c:var(--gold)">
      <div class="md-pre" id="mdTxPresets"></div>
      <div class="sub">Style</div>
      <div class="seg wrap md-gold"><button class="btn" data-tm="scroll">Scroll</button><button class="btn" data-tm="beat">Beat words</button><button class="btn" data-tm="still">Still</button><button class="btn" data-tm="drop">On drop</button></div>
      <div class="md-colrow"><div class="seg md-gold"><button class="btn" data-tc="look">Look</button><button class="btn" data-tc="rainbow">Rainbow</button><button class="btn" data-tc="white">White</button></div>
        <input type="color" id="mdTxColor" value="#ff2a8a" title="Pick your own color" aria-label="Pick your own color"></div>
      <button class="btn" id="mdTxSave">${GB.svg('save')}<span>Save this text</span></button>
      ${more('mdTxMore', `<label class="lv" style="--c:var(--gold)"><span>Speed</span><input type="range" id="mdTxSpeed" min="3" max="30" value="10"><b id="mdTxSpeedV">1.0x</b></label>`)}`;
    el.querySelectorAll('.md-gold .btn').forEach(b => b.style.setProperty('--c', 'var(--gold)'));
    $('mdTxLive').onclick = () => { const v = showing(); setWall(v === 'text' ? 'off' : v === 'both' ? 'logo' : v === 'logo' ? 'both' : 'text'); };
    $('mdTxSave').onclick = async () => { if (await sendText(txBody())) sendText({preset_save: 'text', name: $('mdTxText').value.trim() || 'GLOWBOP'}, '💾 Saved'); };
    $('mdTxText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); txUpdate(); } });
    $('mdTxText').addEventListener('input', txUpdate);
    el.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { txMode = b.dataset.tm; txUpdate(); });
    el.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { txColor = b.dataset.tc; txUpdate(); });
    $('mdTxColor').oninput = () => { txColor = 'custom'; txUpdate(); };
    $('mdTxSpeed').oninput = txUpdate;
    GB.paintRange($('mdTxSpeed'));
    keepOpen(el);
  });

  GB.panel('text', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    const tg = (id, t, s) => `<button class="md-fx" id="${id}" type="button" aria-pressed="false"><span class="t"><b>${t}</b><small>${s}</small></span><span class="sw"></span></button>`;
    el.innerHTML = `
      <div class="ph"><span>Logo</span><span class="r">${liveBtn('mdLgLive')}</span></div>
      <div class="md-lg"><canvas id="mdLgPrev" width="192" height="200" aria-label="Your picture"></canvas>
        <div><input type="file" id="mdLgFile" accept="image/*" hidden>
          <button class="btn c" id="mdLgPick" style="--c:var(--violet)">${GB.svg('add')}<span>Choose a picture</span></button>
          <p class="note" id="mdLgName">${LG_HINT}</p></div></div>
      <div class="md-ba" id="mdLgBA">
        <figure id="mdLgBeforeF"><figcaption><span>Before</span><i class="md-onw">ON WALL</i></figcaption><canvas id="mdLgBefore" aria-label="Before: plain shrink"></canvas></figure>
        <figure id="mdLgAfterF"><figcaption><span id="mdLgAfterL">After</span><i class="md-onw">ON WALL</i></figcaption><canvas id="mdLgAfter" aria-label="How the logo looks on the wall"></canvas></figure>
      </div>
      <div class="seg md-pinks" id="mdLgLay" hidden><button class="btn" data-ll="whole">Whole logo</button><button class="btn" data-ll="icon">Icon only</button><button class="btn" data-ll="scroll">Scroll it</button></div>
      <p class="note md-lgwarn" id="mdLgWarn" hidden></p>
      <p class="note md-lgnote" id="mdLgNote" hidden></p>
      <div class="sub">Saved logos</div>
      <div class="md-pre" id="mdLgPresets"></div>
      <div class="sub">Entrance &amp; motion</div>
      <div class="seg wrap md-pinks md-lm"><button class="btn" data-lm="still">Glow</button><button class="btn" data-lm="pulse">Pulse</button><button class="btn" data-lm="shimmer">Color shift</button><button class="btn" data-lm="sparks">Sparks</button><button class="btn" data-lm="wipe">Wipe in</button><button class="btn" data-lm="drop">Drop blast</button><button class="btn" data-lm="twinkle">Twinkle</button></div>
      <p class="note" id="mdLgMdNote"></p>
      <div class="grid2">
        <button class="btn c" id="mdLgSave" style="--c:var(--gold)">${GB.svg('save')}<span>Save logo</span></button>
        <button class="btn danger" id="mdLgRemove">${GB.svg('trash')}<span>Remove</span></button>
      </div>
      ${more('mdLgMore', `<div class="md-fxl">
        ${tg('mdLgBoost', 'Boost for LEDs', 'Punchier colors, lifts dark colors, thickens thin lines, turns near-black off.')}
        ${tg('mdLgBg', 'Remove background', 'Finds a flat background (white or any solid color) and turns it off.')}
        ${tg('mdLgInside', 'Show inside the logo', 'The light show plays only inside the logo shape, with a soft glow round the edge.')}
        ${tg('mdLgSlide', 'Slideshow', 'While the logo is on the wall, rotates through every saved logo.')}
        </div>
        <div class="seg md-pinks" id="mdLgEvery"><button class="btn" data-se="8bars">Every 8 bars</button><button class="btn" data-se="1min">1 min</button><button class="btn" data-se="5min">5 min</button></div>
        <p class="note" id="mdLgSlNote"></p>`)}`;
    el.querySelectorAll('.md-pinks .btn').forEach(b => b.style.setProperty('--c', 'var(--pink)'));
    $('mdLgLive').onclick = () => { const v = showing(); setWall(v === 'logo' ? 'off' : v === 'both' ? 'text' : v === 'text' ? 'both' : 'logo'); };
    el.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { lgMode = b.dataset.lm; renderText(); const v = showing(); sendText({logo_mode: lgMode}, v === 'logo' || v === 'both' ? LM_TIP[lgMode] : ''); });
    el.querySelectorAll('[data-se]').forEach(b => b.onclick = () => { TX.state.slide_every = b.dataset.se; renderText(); sendText({slide_every: b.dataset.se}); });
    el.querySelectorAll('[data-ll]').forEach(b => b.onclick = () => { lgLayout = b.dataset.ll; if (lgSrc) { lgRun(); lgSend(); } });
    const flip = k => { lgOpt[k] = !lgOpt[k]; try { localStorage.setItem('gb_logo_opts', JSON.stringify(lgOpt)); } catch (e) {}
      if (lgSrc) { lgRun(); lgSend(); } else renderText(); };
    $('mdLgBoost').onclick = () => flip('boost');
    $('mdLgBg').onclick = () => flip('removeBg');
    $('mdLgInside').onclick = () => { const v = !(TX.state || {}).logo_inside; TX.state.logo_inside = v; renderText();
      sendText({logo_inside: v}, v ? '✨ The show plays inside your logo' : 'Logo drawn normally'); };
    $('mdLgSlide').onclick = () => { const s = TX.state || {}, v = !s.slideshow;
      if (v && (s.logo_count || 0) < 2) GB.toast('Save 2 or more logos to rotate them');
      s.slideshow = v; renderText(); sendText({slideshow: v}, v ? '🔁 Slideshow on (while the logo is on the wall)' : 'Slideshow off'); };
    $('mdLgPick').onclick = () => $('mdLgFile').click();
    $('mdLgFile').onchange = () => {
      const f = $('mdLgFile').files[0]; if (!f) return; const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 480 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
        lgSrc = {data: g.getImageData(0, 0, w, h).data, w, h, name: f.name.replace(/\.[^.]+$/, '').slice(0, 40)};
        URL.revokeObjectURL(img.src); lgLayout = 'auto';
        lgRun(); lgSend(true);
      };
      img.onerror = () => GB.toast('⚠️ Could not read that picture');
      img.src = URL.createObjectURL(f);
    };
    $('mdLgRemove').onclick = async () => { const s = TX.state || {};
      if (!s.has_logo && !lgPixels) return GB.toast('No logo loaded');
      const show = s.show === 'both' ? 'text' : (s.show === 'logo' ? 'off' : (s.show || 'off'));
      if (await sendText({logo: null, show}, '🗑️ Logo removed')) { lgPixels = null; lgSrc = null; lgRes = null; $('mdLgFile').value = ''; const c = $('mdLgPrev'); c.getContext('2d').clearRect(0, 0, c.width, c.height); $('mdLgName').textContent = LG_HINT; lgPaint(); } };
    $('mdLgSave').onclick = () => { if (!(TX.state || {}).has_logo) return GB.toast('Choose a picture first'); sendText({preset_save: 'logo', name: (TX.state.logo_name || 'Logo')}, '💾 Logo saved'); };
    window.addEventListener('resize', () => { clearTimeout(lgRz); lgRz = setTimeout(lgPaint, 150); });
    keepOpen(el);
    lgPaint();
  });

  // ---- logo helpers: process the picked picture, draw the LED previews, send it
  function lgWall() { const gi = GB.grpInfo() || ((GB.status && GB.status.groups) || [])[0] || {w: 20, h: 21}; return [gi.w || 20, gi.h || 21]; }
  function lgRun() {
    if (!lgSrc) return;
    const [W, H] = lgWall();
    const t0 = performance.now();
    lgRes = lgProcess(lgSrc.data, lgSrc.w, lgSrc.h, W, H, Object.assign({layout: lgLayout}, lgOpt)); lgRes.W = W; lgRes.H = H; lgRes.name = lgSrc.name; lgRes.ms = Math.round(performance.now() - t0);
    GB.lgLast = {ms: lgRes.ms, layout: lgRes.layout, avail: lgRes.avail, stats: lgRes.stats, OW: lgRes.OW};    // (for tests)
    lgPixels = (lgOpt.boost ? lgRes.boost : lgRes.plain).rgb;
    const pc = $('mdLgPrev'), pv = pc.getContext('2d'), t = lgRes.thumb;           // the cleaned-up picture (checks = removed)
    pv.clearRect(0, 0, pc.width, pc.height);
    for (let y = 0; y < pc.height; y += 12) for (let x = 0; x < pc.width; x += 12) { pv.fillStyle = ((x + y) / 12) % 2 ? '#2a2638' : '#1b1826'; pv.fillRect(x, y, 12, 12); }
    const tc = document.createElement('canvas'); tc.width = t.w; tc.height = t.h; tc.getContext('2d').putImageData(new ImageData(t.data, t.w, t.h), 0, 0);
    const s = Math.min(pc.width / t.w, pc.height / t.h) * 0.92; pv.imageSmoothingQuality = 'high';
    pv.drawImage(tc, (pc.width - t.w * s) / 2, (pc.height - t.h * s) / 2, t.w * s, t.h * s);
    $('mdLgName').textContent = lgSrc.name + ' · ' + W + '×' + H + ' bulbs' + (lgRes.OW > W ? ' · scrolls' : '');
    lgPaint();
  }
  function lgBody() { const v = lgOpt.boost ? lgRes.boost : lgRes.plain;
    return {logo: {rgb: v.rgb, a: v.a, w: lgRes.OW, h: lgRes.H, name: lgRes.name, scroll: lgRes.OW > lgRes.W}, logo_mode: lgMode}; }
  function lgSend(fresh) {
    if (!lgRes) return; const v = showing(), on = v === 'logo' || v === 'both';
    sendText(lgBody(), fresh ? (on ? '🖼️ Logo updated on the wall' : '🖼️ Logo ready. Tap LOGO at the top to show it') : (lgOpt.boost ? '⚡ Boost on' : 'Boost off') + ' · ' + (lgOpt.removeBg ? 'background removed' : 'background kept'));
  }
  function lgDraw(cv, rgb, LW, H, VW, ox) {                             // the bulbs as glowing dots, like the live wall preview (VW columns, from ox)
    VW = VW || LW; ox = ox || 0;
    const box = cv.parentElement, bw = Math.max(60, (box.clientWidth || 162) - 12), st = Math.min(bw / VW, 210 / H), cssW = Math.round(st * VW), cssH = Math.round(st * H);
    const dpr = Math.min(2, window.devicePixelRatio || 1), pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px'; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#05040a'; g.fillRect(0, 0, cssW, cssH);
    const r = st * 0.42, at = (x, y) => { const c = ox + x - (LW > VW ? VW : 0); if (!rgb || c < 0 || c >= LW) return null; const i = (y * LW + c) * 3; return rgb[i] + rgb[i + 1] + rgb[i + 2] > 6 ? [rgb[i], rgb[i + 1], rgb[i + 2]] : null; };
    for (let y = 0; y < H; y++) for (let x = 0; x < VW; x++) { if (at(x, y)) continue; g.fillStyle = '#16121f'; g.beginPath(); g.arc(x * st + st / 2, y * st + st / 2, r * 0.55, 0, 6.283); g.fill(); }
    if (!rgb) return;
    g.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H; y++) for (let x = 0; x < VW; x++) { const c = at(x, y); if (!c) continue; const [R, G, B] = c;
      const px = x * st + st / 2, py = y * st + st / 2, gr = g.createRadialGradient(px, py, 0, px, py, st * 1.15);
      gr.addColorStop(0, `rgba(${R},${G},${B},0.42)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.fillRect(px - st * 1.2, py - st * 1.2, st * 2.4, st * 2.4); }
    g.globalCompositeOperation = 'source-over';
    for (let y = 0; y < H; y++) for (let x = 0; x < VW; x++) { const c = at(x, y); if (!c) continue; const [R, G, B] = c, px = x * st + st / 2, py = y * st + st / 2;
      g.fillStyle = `rgb(${R},${G},${B})`; g.beginPath(); g.arc(px, py, r, 0, 6.283); g.fill();
      g.fillStyle = `rgba(255,255,255,${0.18 * Math.max(R, G, B) / 255})`; g.beginPath(); g.arc(px - r * 0.2, py - r * 0.25, r * 0.4, 0, 6.283); g.fill(); }
  }
  function lgAnim() {                                                   // a wide logo scrolls in the preview too (6 bulbs a second, like the wall)
    clearInterval(lgTimer); lgTimer = null;
    const draw = () => { const t = performance.now() / 1000;
      lgJobs.forEach(([cv, rgb, LW, H, VW]) => lgDraw(cv, rgb, LW, H, VW, LW > VW ? Math.floor(t * 6) % (LW + VW) : 0)); };
    draw();
    if (lgJobs.some(j => j[2] > j[4]) && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      lgTimer = setInterval(() => { if (!document.hidden && document.body.dataset.page === 'text') draw(); }, 140);
  }
  function lgPaint() {
    if (!$('mdLgBA')) return;
    const bf = $('mdLgBeforeF'), af = $('mdLgAfterF'), s = TX.state || {}, local = lgRes && (!s.logo_name || s.logo_name === lgRes.name);
    $('mdLgPrev').style.display = lgRes ? '' : 'none';
    const lay = $('mdLgLay'), warn = $('mdLgWarn');
    if (local) {
      bf.hidden = false; $('mdLgBA').classList.remove('one');
      $('mdLgAfterL').textContent = 'After';
      bf.classList.toggle('sel', !lgOpt.boost); af.classList.toggle('sel', !!lgOpt.boost);
      lgJobs = [[$('mdLgBefore'), lgRes.plain.rgb, lgRes.OW, lgRes.H, lgRes.W], [$('mdLgAfter'), lgRes.boost.rgb, lgRes.OW, lgRes.H, lgRes.W]];
      const n = $('mdLgNote'); n.hidden = !lgRes.notes.length; n.textContent = lgRes.notes.join(' ');
      warn.hidden = !lgRes.warn.length; warn.textContent = '⚠️ ' + lgRes.warn.join(' ');
      const av = lgRes.avail; lay.hidden = !(av.icon || av.scroll);
      lay.querySelectorAll('[data-ll]').forEach(b => { b.hidden = b.dataset.ll !== 'whole' && !av[b.dataset.ll]; b.classList.toggle('on', b.dataset.ll === lgRes.layout); });
    } else {
      bf.hidden = true; $('mdLgBA').classList.add('one'); af.classList.add('sel');
      $('mdLgAfterL').textContent = TX.logo ? (s.logo_name || 'On the wall') : 'No logo yet';
      const [W, H] = lgWall();
      lgJobs = [[$('mdLgAfter'), TX.logo ? TX.logo.rgb : null, TX.logo ? TX.logo.w : W, TX.logo ? TX.logo.h : H, TX.logo ? Math.min(W, TX.logo.w) : W]];
      $('mdLgNote').hidden = true; warn.hidden = true; lay.hidden = true;
    }
    lgAnim();
  }

  /*LGPROC*/
  // 🖼️ Logo -> LED pixels, all on the phone. Pure maths on RGBA bytes so it is testable anywhere.
  // o = {boost, removeBg, layout: 'auto' | 'whole' | 'icon' | 'scroll'}
  // Returns {plain, boost} (each {rgb:[0-255 x3], a:[0-255]} at OW x H), OW (= W, or wider for a logo that scrolls), layout (the one used),
  // avail {icon, scroll}, notes (what was done), warn (what will not read well), and the cleaned-up crop for the thumbnail.
  function lgProcess(src, sw, sh, W, H, o) {
    const N = sw * sh, px = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) px[i] = src[i] / 255;
    const notes = [], warn = []; let removed = false, transparent = false, peeled = false;
    const lum = i => 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
    const sat = i => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b); return mx > 0 ? (mx - Math.min(r, g, b)) / mx : 0; };
    const sides = [[], [], [], []];
    for (let x = 0; x < sw; x++) { sides[0].push(x); sides[1].push((sh - 1) * sw + x); }
    for (let y = 0; y < sh; y++) { sides[2].push(y * sw); sides[3].push(y * sw + sw - 1); }
    const border = sides.flat();
    let clear = 0; for (const i of border) if (px[i * 4 + 3] < 0.5) clear++;
    if (clear > border.length * 0.3) { transparent = true; notes.push('Using the picture\'s see-through background.'); }
    // how many colours? (photos have thousands, logos a handful plus JPEG noise)
    const cset = new Set(); for (let i = 0; i < N; i += 3) if (src[i * 4 + 3] > 127) cset.add(((src[i * 4] >> 3) << 10) | ((src[i * 4 + 1] >> 3) << 5) | (src[i * 4 + 2] >> 3));
    // a very dark picture (dark logo on black / navy): stretch it so the bulbs can show it
    if (!transparent) {
      const hist = new Uint32Array(64); let n = 0;
      for (let i = 0; i < N; i++) if (px[i * 4 + 3] > 0.5) { hist[Math.min(63, (lum(i) * 64) | 0)]++; n++; }
      let acc = 0, p99 = 1; for (let k = 63; k >= 0; k--) { acc += hist[k]; if (acc > n * 0.01) { p99 = (k + 1) / 64; break; } }
      if (n && p99 < 0.4) { const k = 0.85 / Math.max(p99, 0.06); for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.min(1, px[i * 4 + c] * k); notes.push('Very dark picture brightened so it shows.'); }
    }
    let inkDark = false, br = 0, bg = 0, bb = 0;
    const dist = (i, r, g, b) => Math.hypot(px[i * 4] - r, px[i * 4 + 1] - g, px[i * 4 + 2] - b);
    const darkInk = i => { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx < 0.25 || (0.3 * r + 0.59 * g + 0.11 * b < 0.5 && mx - mn < 0.2); };
    const seen = new Uint8Array(N);
    const flood = (starts, ok) => { const st = []; for (const i of starts) if (!seen[i] && ok(i)) { seen[i] = 1; st.push(i); }
      while (st.length) { const i = st.pop(), x = i % sw;
        if (x > 0 && !seen[i - 1] && ok(i - 1)) { seen[i - 1] = 1; st.push(i - 1); }
        if (x < sw - 1 && !seen[i + 1] && ok(i + 1)) { seen[i + 1] = 1; st.push(i + 1); }
        if (i >= sw && !seen[i - sw] && ok(i - sw)) { seen[i - sw] = 1; st.push(i - sw); }
        if (i < N - sw && !seen[i + sw] && ok(i + sw)) { seen[i + sw] = 1; st.push(i + sw); } } };
    if (!transparent && o.removeBg) {                                  // flat background? (most of the border, on 3+ sides, is one colour)
      const buck = new Map(), key = i => ((src[i * 4] >> 4) << 8) | ((src[i * 4 + 1] >> 4) << 4) | (src[i * 4 + 2] >> 4);
      for (const i of border) { const k = key(i); buck.set(k, (buck.get(k) || 0) + 1); }
      let bk = -1, bn = 0; buck.forEach((n, k) => { if (n > bn) { bn = n; bk = k; } });
      let c = 0; for (const i of border) if (key(i) === bk) { br += px[i * 4]; bg += px[i * 4 + 1]; bb += px[i * 4 + 2]; c++; }
      if (c) { br /= c; bg /= c; bb /= c; }
      const tol = 0.2, near = i => dist(i, br, bg, bb) < tol;
      let nNear = 0; for (const i of border) if (near(i)) nNear++;
      const flatSides = sides.filter(sd => sd.filter(near).length >= sd.length * 0.5).length;
      if (c && nNear >= border.length * 0.6 && flatSides >= 3) {
        flood(border, near);
        let fg = 0, dk = 0; for (let i = 0; i < N; i++) if (!seen[i] && dist(i, br, bg, bb) >= tol * 0.5) { fg++; if (darkInk(i)) dk++; }   // (not counting holes the background colour)
        inkDark = fg > 0 && dk > fg * 0.6;
        // the same colour inside the shape: holes in dark letters go too, but white letters on a coloured badge stay
        if (inkDark) for (let i = 0; i < N; i++) if (!seen[i] && dist(i, br, bg, bb) < tol * 0.5) seen[i] = 1;
        let cnt = 0; for (let i = 0; i < N; i++) if (seen[i]) cnt++;
        removed = cnt > N * 0.02 && cnt < N * 0.995;
        if (removed) {
          const nm = br > 0.85 && bg > 0.85 && bb > 0.85 ? 'white' : br < 0.15 && bg < 0.15 && bb < 0.15 ? 'black' : 'solid ' + lgHex(br, bg, bb);
          notes.push('Removed the ' + nm + ' background.');
          // a card / sign / paper inside the picture (a photo of a business card): peel that too
          const edge = []; for (let i = 0; i < N; i++) { if (seen[i]) continue; const x = i % sw;
            if ((x > 0 && seen[i - 1]) || (x < sw - 1 && seen[i + 1]) || (i >= sw && seen[i - sw]) || (i < N - sw && seen[i + sw])) edge.push(i); }
          const paper = []; for (let i = 0; i < N; i++) if (!seen[i] && lum(i) > 0.65 && sat(i) < 0.15) paper.push(i);
          if (!inkDark && paper.length > fg * 0.35) {
            let pr = 0, pg = 0, pb = 0; for (const i of paper) { pr += px[i * 4]; pg += px[i * 4 + 1]; pb += px[i * 4 + 2]; } pr /= paper.length; pg /= paper.length; pb /= paper.length;
            const before = seen.slice(); flood(paper, i => dist(i, pr, pg, pb) < 0.18);
            let pc = 0, qx0 = sw, qy0 = sh, qx1 = 0, qy1 = 0;
            for (let i = 0; i < N; i++) if (seen[i] && !before[i]) { pc++; const x = i % sw, y = (i / sw) | 0; if (x < qx0) qx0 = x; if (x > qx1) qx1 = x; if (y < qy0) qy0 = y; if (y > qy1) qy1 = y; }
            const solid = pc / Math.max(1, (qx1 - qx0 + 1) * (qy1 - qy0 + 1));   // a card is one solid shape; faint letters or white lettering are not
            if (pc > fg * 0.35 && pc < fg * 0.95 && solid > 0.45) {
              peeled = true; notes.push('Also removed the card behind the logo.');
              const mid = seen.slice(); flood(edge, i => !seen[i]);    // + the card's shadow / blurry rim (outside the card, touching the background)
              let rim = 0, left = 0; for (let i = 0; i < N; i++) { if (seen[i] && !mid[i]) rim++; if (!seen[i]) left++; }
              if (left < (rim + left) * 0.08) seen.set(mid);          // (leaked into the logo: undo)
            } else seen.set(before);
          }
          const bl = 0.3 * br + 0.59 * bg + 0.11 * bb;
          if (!inkDark && !peeled && bl > 0.7) {                         // a soft grey drop shadow round a colourful logo: goes with the background
            const before = seen.slice(); flood([...Array(N).keys()].filter(i => seen[i]), i => sat(i) < 0.1 && lum(i) > 0.3 && lum(i) < bl - 0.03 && dist(i, br, bg, bb) < 0.75);
            let sc_ = 0; for (let i = 0; i < N; i++) if (seen[i] && !before[i]) sc_++;
            if (sc_ > N * 0.002) notes.push('Removed the drop shadow.');
          }
          for (let i = 0; i < N; i++) if (seen[i]) px[i * 4 + 3] = 0;
          for (let i = 0; i < N; i++) {                                 // soften the cut edge (JPEG fringe)
            if (seen[i]) continue; const x = i % sw;
            const nb = (x > 0 && seen[i - 1]) || (x < sw - 1 && seen[i + 1]) || (i >= sw && seen[i - sw]) || (i < N - sw && seen[i + sw]);
            if (nb) { const d = dist(i, br, bg, bb); if (d < tol * 2) px[i * 4 + 3] *= Math.min(1, Math.max(0, (d - tol * 0.5) / (tol * 1.5))); }
          }
        }
      } else notes.push('No flat background found, so the whole picture is used.');
    }
    const photo = !removed && !transparent && cset.size > 500;
    if (removed || transparent) {                                       // a black logo on a cut-out background: light it up in white
      let fg = 0, dark = 0, vivid = 0;
      for (let i = 0; i < N; i++) if (px[i * 4 + 3] > 0.5) { fg++; if (darkInk(i)) dark++; else if (sat(i) > 0.4 && Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) > 0.4) vivid++; }
      if (fg && dark > fg * 0.6 && vivid < fg * 0.1) {                  // (colourful dots on a dark tile: the dark just stays off)
        for (let i = 0; i < N; i++) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          if (mx < 0.6 && mx - mn < 0.15) { const v = 1 - mx * 0.6; px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; } }
        notes.push('Dark logo lit in white so the bulbs can show it.');
      }
    }
    // ---- what's in the picture: cut it into parts (rows, then columns, a few levels) to find the icon and the small text
    const M = new Uint8Array(N);
    for (let i = 0; i < N; i++) M[i] = px[i * 4 + 3] > 0.3 && Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) > 0.06 ? 1 : 0;
    let X0 = 0, Y0 = 0, X1 = sw, Y1 = sh;
    if (removed || transparent) {
      X0 = sw; Y0 = sh; X1 = 0; Y1 = 0;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (M[y * sw + x]) { if (x < X0) X0 = x; if (x >= X1) X1 = x + 1; if (y < Y0) Y0 = y; if (y >= Y1) Y1 = y + 1; }
      if (X1 <= X0) { X0 = 0; Y0 = 0; X1 = sw; Y1 = sh; }
    }
    const parts = [], bands = [];
    const cut = (x0, y0, x1, y1, depth) => {
      const rp = new Uint32Array(y1 - y0), cp = new Uint32Array(x1 - x0); let ink = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (M[y * sw + x]) { rp[y - y0]++; cp[x - x0]++; ink++; }
      if (!ink) return;
      let ra = 0; while (!rp[ra]) ra++; let rb = rp.length - 1; while (!rp[rb]) rb--;
      let ca = 0; while (!cp[ca]) ca++; let cb = cp.length - 1; while (!cp[cb]) cb--;
      const RP = rp.subarray(ra, rb + 1), CP = cp.subarray(ca, cb + 1);
      y1 = y0 + rb + 1; y0 += ra; x1 = x0 + cb + 1; x0 += ca;
      const hh = y1 - y0, runs = (prof, gap) => { const out = []; let s = -1, e = -1;
        for (let k = 0; k < prof.length; k++) { if (prof[k]) { if (s < 0) s = k; else if (k - e - 1 >= gap) { out.push([s, e + 1]); s = k; } e = k; } }
        if (s >= 0) out.push([s, e + 1]); return out; };
      if (depth < 5 && parts.length < 300) {
        const rs = runs(RP, Math.max(2, Math.round((Y1 - Y0) * 0.02)));
        if (depth === 0) rs.forEach(([s, e]) => bands.push([y0 + s, y0 + e]));
        if (rs.length > 1) { rs.forEach(([s, e]) => cut(x0, y0 + s, x1, y0 + e, depth + 1)); return; }
        const cs = runs(CP, Math.max(2, Math.round(hh * 0.12)));
        if (cs.length > 1) { cs.forEach(([s, e]) => cut(x0 + s, y0, x0 + e, y1, depth + 1)); return; }
      }
      parts.push({x0, y0, x1, y1, ink});
    };
    cut(X0, Y0, X1, Y1, 0);
    const cw = X1 - X0, ch = Y1 - Y0, sWhole = Math.min(W / cw, H / ch), tot = parts.reduce((s, p) => s + p.ink, 0) || 1;
    const tiny = (p, sc) => (p.y1 - p.y0) * sc < 5;                     // letters this short (in bulbs) are mush
    let icon = null;
    for (const p of parts) { const ph = p.y1 - p.y0, pw = p.x1 - p.x0, as = pw / ph;
      if (as > 0.33 && as < 3 && ph >= ch * 0.25 && pw * ph > 0.04 * cw * ch && (!icon || pw * ph > (icon.x1 - icon.x0) * (icon.y1 - icon.y0))) icon = p; }
    let IB = null;
    if (icon) {                                                         // the icon + anything else big enough to read; the small text goes
      IB = {x0: icon.x0, y0: icon.y0, x1: icon.x1, y1: icon.y1};
      for (const p of parts) if (p !== icon && !tiny(p, sWhole)) { IB.x0 = Math.min(IB.x0, p.x0); IB.y0 = Math.min(IB.y0, p.y0); IB.x1 = Math.max(IB.x1, p.x1); IB.y1 = Math.max(IB.y1, p.y1); }
      const inIB = parts.filter(p => p.x0 >= IB.x0 && p.x1 <= IB.x1 && p.y0 >= IB.y0 && p.y1 <= IB.y1).reduce((s, p) => s + p.ink, 0);
      const gain = Math.min(W / (IB.x1 - IB.x0), H / (IB.y1 - IB.y0)) / sWhole;
      if (!(inIB < tot * 0.92 && gain > 1.15)) IB = null;
    }
    // scrolling: the main band(s) of the logo at full wall height, sliding across
    let SB = null;
    if (!photo && bands.length) {
      const mh = Math.max(...bands.map(([s, e]) => e - s)), keep = bands.filter(([s, e]) => e - s >= mh * 0.6);
      const sy0 = Math.min(...keep.map(k => k[0])), sy1 = Math.max(...keep.map(k => k[1]));
      let sx0 = sw, sx1 = 0; for (let y = sy0; y < sy1; y++) for (let x = X0; x < X1; x++) if (M[y * sw + x]) { if (x < sx0) sx0 = x; if (x >= sx1) sx1 = x + 1; }
      const lw = Math.round((sx1 - sx0) * H / (sy1 - sy0));
      let ink = 0; for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) ink += M[y * sw + x];
      if (sx1 > sx0 && lw > W * 1.6 && ink < (sx1 - sx0) * (sy1 - sy0) * 0.55) SB = {x0: sx0, y0: sy0, x1: sx1, y1: sy1};   // (lettering, not a solid block)
    }
    const avail = {icon: !!IB, scroll: !!SB};
    let lay = o.layout && o.layout !== 'auto' && (o.layout === 'whole' || avail[o.layout]) ? o.layout : null;
    if (!lay) lay = SB && cw / ch > 2.5 * W / H ? 'scroll' : IB ? 'icon' : 'whole';
    let R = lay === 'icon' ? IB : lay === 'scroll' ? SB : {x0: X0, y0: Y0, x1: X1, y1: Y1};
    if (lay === 'whole' && (removed || transparent)) {                  // specks of writing under 2 bulbs tall just make dots: leave them out
      const tinyP = parts.filter(p => (p.y1 - p.y0) * sWhole < 2.2), tInk = tinyP.reduce((s, p) => s + p.ink, 0);
      if (tinyP.length && tInk < tot * 0.25 && tinyP.length < parts.length) {
        for (const p of tinyP) for (let y = p.y0; y < p.y1; y++) for (let x = p.x0; x < p.x1; x++) { const i = y * sw + x; if (M[i]) { px[i * 4 + 3] = 0; M[i] = 0; } }
        const keepP = parts.filter(p => !tinyP.includes(p));
        R = {x0: Math.min(...keepP.map(p => p.x0)), y0: Math.min(...keepP.map(p => p.y0)), x1: Math.max(...keepP.map(p => p.x1)), y1: Math.max(...keepP.map(p => p.y1))};
        notes.push('Tiny writing left out (too small for the bulbs).');
      }
    }
    const x0 = R.x0, y0 = R.y0, x1 = R.x1, y1 = R.y1, rw = x1 - x0, rh = y1 - y0;
    let OW = W; if (lay === 'scroll') OW = Math.min(360, Math.max(W + 1, Math.round(rw * H / rh)));
    const sOut = Math.min(OW / rw, H / rh);
    if (lay === 'icon') notes.push('Icon only: the small writing is left out so the icon is big. Tap Whole logo to keep it.');
    if (lay === 'scroll') notes.push('Wide logo: it scrolls across the wall.');
    // warnings: what still won't read at this size
    const smallInk = parts.filter(p => p.x0 >= x0 && p.x1 <= x1 && p.y0 >= y0 && p.y1 <= y1 && (p.y1 - p.y0) * sOut < 4).reduce((s, p) => s + p.ink, 0);
    const tipOpt = [avail.icon && lay !== 'icon' ? 'Icon only' : '', avail.scroll && lay !== 'scroll' ? 'Scroll it' : ''].filter(Boolean).join(' or ');
    if (peeled) warn.push('Photo of a card or sign: the original logo file will look sharper.');
    if (photo) warn.push(`This looks like a photo. On ${W}×${H} bulbs photos turn busy; a simple logo or icon reads best.`);
    else if (smallInk > tot * 0.25) warn.push(`This logo has a lot of small text that won't read on ${W}×${H} bulbs. ${tipOpt ? 'Try ' + tipOpt + ', or' : 'Try a simpler icon, or'} use Text above for your business name.`);
    if (!photo && parts.length > 60 && lay === 'whole') warn.push('Lots of fine detail here. A bold, simple version of the logo will look much better.');
    const slab = parts.find(p => { const a = (p.x1 - p.x0) * (p.y1 - p.y0); return a > cw * ch * 0.25 && p.ink > a * 0.9 && (p.x1 - p.x0) > (p.y1 - p.y0) * 2; });
    if (!photo && slab && parts.length > 3) warn.push('This looks like a screenshot or a whole page. Crop the picture to just the logo first for a much better result.');
    // resample the chosen part into a fine grid (S x S samples per bulb), premultiplied, box-filtered
    const S = 6, GW = OW * S, GH = H * S, sc = Math.min(GW / rw, GH / rh);
    const dw = rw * sc, dh = rh * sc, ox = (GW - dw) / 2, oy = (GH - dh) / 2, G = new Float32Array(GW * GH * 4);
    for (let gy = 0; gy < GH; gy++) {
      const sy0 = (gy - oy) / sc + y0, sy1 = (gy + 1 - oy) / sc + y0;
      if (sy1 <= y0 || sy0 >= y1) continue;
      for (let gx = 0; gx < GW; gx++) {
        const sx0 = (gx - ox) / sc + x0, sx1 = (gx + 1 - ox) / sc + x0;
        if (sx1 <= x0 || sx0 >= x1) continue;
        let ya = Math.max(y0, Math.floor(sy0)), yb = Math.min(y1, Math.max(ya + 1, Math.ceil(sy1))), xa = Math.max(x0, Math.floor(sx0)), xb = Math.min(x1, Math.max(xa + 1, Math.ceil(sx1)));
        if (yb <= ya) ya = yb - 1; if (xb <= xa) xa = xb - 1;
        let r = 0, g = 0, b = 0, a = 0, n = 0;
        for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) { const i = (y * sw + x) * 4, al = px[i + 3]; r += px[i] * al; g += px[i + 1] * al; b += px[i + 2] * al; a += al; n++; }
        const j = (gy * GW + gx) * 4; G[j] = r / n; G[j + 1] = g / n; G[j + 2] = b / n; G[j + 3] = a / n;
      }
    }
    // thin lines? (most of the ink vanishes when shrunk by half a bulb) -> thicken them a little for the boosted version
    const maxf = (A, ch_, r, fn) => {                                   // separable square max/min filter on one channel
      const T = new Float32Array(GW * GH), O = new Float32Array(GW * GH);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let m = A[(y * GW + x) * ch_]; for (let k = Math.max(0, x - r); k <= Math.min(GW - 1, x + r); k++) m = fn(m, A[(y * GW + k) * ch_]); T[y * GW + x] = m; }
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let m = T[y * GW + x]; for (let k = Math.max(0, y - r); k <= Math.min(GH - 1, y + r); k++) m = fn(m, T[k * GW + x]); O[y * GW + x] = m; }
      return O;
    };
    const mask = new Float32Array(GW * GH); let fgn = 0;
    for (let i = 0; i < GW * GH; i++) { mask[i] = G[i * 4 + 3] > 0.5 && Math.max(G[i * 4], G[i * 4 + 1], G[i * 4 + 2]) > 0.08 ? 1 : 0; fgn += mask[i]; }
    const er = maxf(mask, 1, S >> 1, Math.min); let keep = 0; for (let i = 0; i < GW * GH; i++) keep += er[i];
    const thin = fgn > 0 && keep < fgn * 0.3 && !photo;
    let GB2 = G;
    if (thin && o.boost) {
      const r = fgn < GW * GH * 0.04 ? 3 : 2; GB2 = new Float32Array(GW * GH * 4);
      const sel = new Float32Array(GW * GH);                            // dilate the bright detail: take the brightest neighbour's colour
      for (let c = 0; c < 4; c++) { for (let i = 0; i < GW * GH; i++) sel[i] = G[i * 4 + c]; const D = maxf(sel, 1, r, Math.max); for (let i = 0; i < GW * GH; i++) GB2[i * 4 + c] = D[i]; }
      notes.push('Thin lines thickened so they read on the bulbs.');
    }
    const cells = Gr => {                                               // average each bulb's S x S samples
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < OW; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { const j = ((y * S + yy) * GW + x * S + xx) * 4; r += Gr[j]; g += Gr[j + 1]; b += Gr[j + 2]; a += Gr[j + 3]; }
        const n = S * S; out.push(a > 1e-4 ? [r / a, g / a, b / a, a / n] : [0, 0, 0, 0]);
      }
      return out;
    };
    const finish = (cl, boost) => {
      const rgb = [], al = [], hs = [];
      for (const [r0, g0, b0, A] of cl) {
        let r = r0, g = g0, b = b0, af;
        if (boost) {
          af = Math.min(1, Math.max(0, (A - 0.12) / 0.38));
          let [h, s, v] = lgHsv(r, g, b);
          if (s > 0.2) { s = Math.min(1, s * 1.4 + 0.08); if (v > 0.22) v = Math.max(v, 0.5 + 0.5 * v); }    // lift dark-but-coloured (not near-black: that stays off), punch the colour
          else if (s > 0.07 && v > 0.55) { s = Math.min(0.85, s * 2.6 + 0.05); }             // pastels: LEDs wash them to white, so deepen them
          else v = Math.min(1, Math.max(0, (v - 0.5) * 1.3 + 0.5));                           // greys: more contrast
          [r, g, b] = lgRgb(h, s, v);
          const mx = Math.max(r, g, b);
          if (mx > 0.15) { const k = Math.min(2.2, 1 / mx) * 0.85 + 0.15; r = Math.min(1, r * k); g = Math.min(1, g * k); b = Math.min(1, b * k); }
          if (Math.max(r, g, b) * af < 0.18) af = 0;                   // near-black: an off bulb
          hs.push(s);
        } else { af = Math.min(1, A); if (Math.max(r, g, b) * af < 0.05) af = 0; hs.push(0); }
        rgb.push(r, g, b); al.push(af);
      }
      if (boost && (removed || transparent)) {                          // grey/white fringe round a colourful logo (JPEG halo, drop shadow): drop it
        let sw_ = 0, ss = 0; for (let i = 0; i < al.length; i++) if (al[i] > 0) { sw_ += al[i]; ss += hs[i] * al[i]; }
        if (sw_ && ss / sw_ > 0.4) {
          const off = i => al[i] === 0, drop = [];
          for (let y = 0; y < H; y++) for (let x = 0; x < OW; x++) { const i = y * OW + x; if (!al[i] || hs[i] > 0.15) continue;
            const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].filter(([a, b]) => a >= 0 && a < OW && b >= 0 && b < H).map(([a, b]) => b * OW + a);
            if (nb.length < 4 || nb.some(off)) { if (nb.some(j => al[j] > 0 && hs[j] > 0.4)) drop.push(i); } }
          drop.forEach(i => { al[i] = 0; });
        }
      }
      const R8 = [], A8 = [];
      for (let i = 0; i < al.length; i++) { R8.push(Math.round(rgb[i * 3] * al[i] * 255), Math.round(rgb[i * 3 + 1] * al[i] * 255), Math.round(rgb[i * 3 + 2] * al[i] * 255)); A8.push(Math.round(al[i] * 255)); }
      return {rgb: R8, a: A8};
    };
    const plainCells = cells(G);
    const thumb = new Uint8ClampedArray(rw * rh * 4);                   // the cleaned-up crop, for the thumbnail
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const i = ((y + y0) * sw + x + x0) * 4, j = (y * rw + x) * 4; for (let c = 0; c < 4; c++) thumb[j + c] = Math.round(px[i + c] * 255); }
    return {plain: finish(plainCells, false), boost: finish(GB2 === G ? plainCells : cells(GB2), true), OW, layout: lay, avail, notes, warn, removed, transparent, photo, thin, peeled,
      stats: {colours: cset.size, parts: parts.length, smallInk: Math.round(smallInk / tot * 100)}, thumb: {data: thumb, w: rw, h: rh}};
  }
  function lgHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); }
  function lgHsv(r, g, b) {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
    if (d > 1e-6) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h / 6 + 1) % 1, mx > 0 ? d / mx : 0, mx];
  }
  function lgRgb(h, s, v) {
    const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  }
  /*/LGPROC*/

  function renderText() {
    if (!$('mdWall')) return;
    const s = TX.state || {}, v = showing(), txOn = v === 'text' || v === 'both', lgOn = v === 'logo' || v === 'both';
    document.querySelectorAll('#mdWall [data-ws]').forEach(b => { const on = b.dataset.ws === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    const wl = $('mdWallLive'); wl.textContent = v === 'off' ? 'OFF' : v === 'both' ? 'TAKING TURNS' : WALL[v].toUpperCase() + ' ON'; wl.classList.toggle('md-off', v === 'off');
    $('mdWallNote').textContent = v === 'off' ? 'Nothing on top. The light show plays. Pick Text, Logo or Both.'
      : v === 'text' ? `Showing "${(s.text || 'GLOWBOP').slice(0, 40)}". Edits below go live.`
      : v === 'logo' ? `Showing ${s.logo_name || 'the logo'}${s.slideshow ? ', slideshow on' : ''}. Changes below go live.`
      : 'Text and logo take turns every 8 bars.';
    const tl = $('mdTxLive'); tl.textContent = txOn ? 'ON' : 'OFF'; tl.classList.toggle('md-off', !txOn); tl.setAttribute('aria-pressed', txOn ? 'true' : 'false');
    const ll = $('mdLgLive'); ll.textContent = lgOn ? 'ON' : 'OFF'; ll.classList.toggle('md-off', !lgOn); ll.setAttribute('aria-pressed', lgOn ? 'true' : 'false');
    document.querySelectorAll('#pg-text [data-tm]').forEach(b => b.classList.toggle('on', b.dataset.tm === txMode));
    document.querySelectorAll('#pg-text [data-tc]').forEach(b => b.classList.toggle('on', b.dataset.tc === txColor));
    $('mdTxColor').classList.toggle('on', txColor === 'custom');
    document.querySelectorAll('#pg-text [data-tl]').forEach(b => b.classList.toggle('on', b.dataset.tl === txLayer));
    document.querySelectorAll('#pg-text [data-lm]').forEach(b => b.classList.toggle('on', b.dataset.lm === lgMode));
    $('mdLgMdNote').textContent = LM_NOTE[lgMode] || '';
    const setT = (id, on) => { const b = $(id); b.classList.toggle('on', !!on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
    setT('mdLgBoost', lgOpt.boost); setT('mdLgBg', lgOpt.removeBg); setT('mdLgInside', s.logo_inside); setT('mdLgSlide', s.slideshow);
    document.querySelectorAll('#pg-text [data-se]').forEach(b => b.classList.toggle('on', b.dataset.se === (s.slide_every || '8bars')));
    $('mdLgEvery').hidden = !s.slideshow;
    const nl = s.logo_count || 0;
    $('mdLgSlNote').textContent = s.slideshow ? (nl >= 2 ? `Rotating ${nl} saved logos while the logo is on the wall. Now: ${s.logo_name || '-'}` : `Only ${nl} saved logo${nl === 1 ? '' : 's'}. Save 2 or more to rotate (pick a picture, tap Save logo).`) : (nl ? `${nl} saved logo${nl === 1 ? '' : 's'}. Great for sponsors at a game or business.` : 'Save logos, then rotate them. Great for sponsors.');
    $('mdTxSpeedV').textContent = ($('mdTxSpeed').value / 10).toFixed(1) + 'x';
    const pre = (TX.presets || []).slice().reverse();
    const chips = (box, kind, empty) => {
      box.innerHTML = '';
      const list = pre.filter(p => p.kind === kind).sort((a, b) => (b.builtin ? 1 : 0) - (a.builtin ? 1 : 0));
      list.forEach(p => {
        const w = document.createElement('span'); w.className = 'md-pc' + (p.builtin ? ' md-built' : '');
        const c = document.createElement('button'); c.className = 'chip'; c.style.setProperty('--c', kind === 'logo' ? 'var(--pink)' : 'var(--gold)');
        const cur = kind === 'logo' ? s.has_logo && s.logo_name === p.name : s.text === p.text;
        c.classList.toggle('on', !!cur);
        c.innerHTML = GB.svg(p.builtin ? 'sparkle' : kind === 'logo' ? 'image' : 'text') + esc(p.name);
        c.onclick = () => { const on = kind === 'logo' ? (v === 'logo' || v === 'both') : (v === 'text' || v === 'both');
          if (kind === 'text') $('mdTxText').value = p.text || p.name;
          if (kind === 'logo') { lgSrc = null; lgRes = null; lgPixels = null; }
          sendText({preset: p.name, preset_kind: p.kind, keep_show: true}, on ? `Showing "${p.name}"` : `"${p.name}" ready. Tap ${kind === 'logo' ? 'LOGO' : 'TEXT'} at the top to show it`); };
        w.appendChild(c);
        if (!p.builtin) {
          const x = document.createElement('button'); x.className = 'md-px'; x.innerHTML = GB.svg('close'); x.title = 'Delete'; x.setAttribute('aria-label', 'Delete ' + p.name);
          x.onclick = () => {                                            // tap once to arm, again to delete (no pop-up)
            if (!x.classList.contains('sure')) { x.classList.add('sure'); x.textContent = 'Delete?'; clearTimeout(x._t); x._t = setTimeout(() => { x.classList.remove('sure'); x.innerHTML = GB.svg('close'); }, 3000); return; }
            sendText({preset_delete: p.name, preset_kind: p.kind}, `🗑️ Deleted "${p.name}"`);
          };
          w.appendChild(x);
        }
        box.appendChild(w);
      });
      if (!list.filter(p => !p.builtin).length) { const n = document.createElement('p'); n.className = 'note'; n.style.width = '100%'; n.textContent = empty; box.appendChild(n); }
    };
    chips($('mdTxPresets'), 'text', 'Saved messages show up here.');
    chips($('mdLgPresets'), 'logo', 'Your saved logos show up here. ✨ GlowBop is always there.');
  }

  // =========================================================== follow the engine
  GB.on('ready', () => { renderMirror(); renderFire(); renderHolidays(); loadText(); });
  GB.on('group', () => loadText());
  GB.on('status', s => {
    mirState = s.mirror || null; renderMirror();
    fireLocal = {}; if (s.fireplace && s.fireplace.colors) buildFireColors(s.fireplace.colors);
    renderFire();
    const hl = s.holiday || null;
    if (hl !== hLive) { hLive = hl; if (hl && !hOpen) hOpen = hl; renderHolidays(); }
    const tn = s.text && s.text.logo_name;                              // the slideshow moved on: refresh the logo preview
    if (tn !== undefined && TX.state && TX.state.logo_name !== undefined && tn !== TX.state.logo_name) { TX.state.logo_name = tn; loadText(); }
    const sh = s.text && s.text.show;                                   // switched on / off from another phone or Claude
    if (sh && TX.state && TX.state.show && sh !== TX.state.show) { TX.state.show = sh; renderText(); }
  });
})();
