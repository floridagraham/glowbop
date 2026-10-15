/* GlowBop console: modes. Screen mirror (scenes), Holidays (holiday), Fireplace (fire), Text & Logo (text).
   ids prefixed md, css prefixed .md- */
(function () {
  'use strict';
  const {$} = GB;
  const esc = GB.esc;

  GB.css(`
  .md-big { min-height:60px; font-size:20px; letter-spacing:2px; }
  .md-big svg { width:24px; height:24px; }
  @media (max-width: 480px) { .md-big { font-size:18px; letter-spacing:1px; } }
  .md-fg { display:grid; grid-template-columns:minmax(0, 1fr); gap:8px; }
  @media (min-width: 520px) { .md-fg { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
  .md-live { display:inline-flex; align-items:center; gap:6px; }
  .md-live::before { content:''; width:8px; height:8px; border-radius:50%; background:currentColor; box-shadow:0 0 8px currentColor; }
  .md-off { color:var(--dim) !important; }
  .md-off::before { box-shadow:none; opacity:.5; }
  .md-tiles { grid-template-columns:repeat(3, minmax(0, 1fr)) !important; }
  .md-tiles .tile { --c:var(--cyan); }
  @media (min-width: 700px) and (max-width: 999px) { .md-tiles { grid-template-columns:repeat(5, minmax(0, 1fr)) !important; } }
  @media (max-width: 480px) { .md-tiles .tile { font-size:12px; letter-spacing:0; padding:10px 3px; } }
  .md-tiles .tile .md-on { position:absolute; top:6px; right:8px; font:600 10px var(--mono); letter-spacing:1px; }
  .md-hp { display:flex; flex-direction:column; gap:10px; border-top:2px solid var(--line); padding-top:12px; margin-top:2px; }
  .md-hp .md-hh { display:flex; align-items:center; gap:10px; font:700 20px/1.1 var(--cond); letter-spacing:1.5px; text-transform:uppercase; }
  .md-hp .md-hh .em { font-size:30px; }
  .md-fx { appearance:none; border:0; width:100%; display:flex; align-items:center; gap:12px; text-align:left; background:var(--dark2); color:var(--text); border-radius:0 14px 0 14px; padding:10px 12px; min-height:56px; border-left:6px solid var(--dark); transition:background .15s, opacity .15s; }
  .md-fx .t { flex:1; min-width:0; }
  .md-fx .t b { display:block; font:700 16px/1.15 var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .md-fx .t small { display:block; color:var(--dim); font-size:12px; line-height:1.35; margin-top:2px; }
  .md-fx .sw { flex:0 0 auto; width:46px; height:26px; border-radius:13px; background:#33304a; position:relative; transition:background .15s; }
  .md-fx .sw::after { content:''; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#8a85a8; transition:left .15s, background .15s; }
  .md-fx.on { border-left-color:var(--green); background:#15122a; }
  .md-fx.on .sw { background:var(--green); } .md-fx.on .sw::after { left:23px; background:#fff; }
  .md-fx:not(.on) { opacity:.6; }
  .md-fxl { display:flex; flex-direction:column; gap:6px; }
  .md-cols { display:flex; gap:8px; align-items:center; }
  .md-cols input[type=color] { flex:1 1 0; width:auto; min-width:0; }
  .md-ftiles { grid-template-columns:repeat(4, minmax(0, 1fr)); }
  .md-ftiles .tile { min-height:74px; font-size:13px; }
  .md-ftiles .tile .em { font-size:24px; }
  @media (max-width: 480px) { .md-ftiles .tile { font-size:12px; padding:8px 4px; letter-spacing:.5px; } }
  .md-colrow { display:flex; gap:8px; align-items:stretch; min-width:0; }
  .md-colrow .seg { flex:1; min-width:0; }
  @media (max-width: 480px) { .md-colrow .seg > .btn { font-size:14px; padding:0 4px; letter-spacing:.5px; } }
  .md-colrow input[type=color] { width:56px; }
  .md-colrow input[type=color].on { border-color:var(--gold); box-shadow:0 0 0 2px #fff inset; }
  .md-pre { display:flex; flex-wrap:wrap; gap:8px; }
  .md-pc { display:inline-flex; align-items:stretch; max-width:100%; min-width:0; }
  .md-pc .chip { border-radius:999px 4px 4px 999px; flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:block; line-height:44px; --c:var(--gold); }
  .md-pc .md-px { appearance:none; border:0; margin-left:3px; border-radius:4px 999px 999px 4px; background:var(--dark); color:var(--dim); min-width:48px; min-height:44px; padding:0 12px; font:700 14px var(--cond); letter-spacing:1px; text-transform:uppercase; display:inline-flex; align-items:center; justify-content:center; }
  .md-pc .md-px svg { width:16px; height:16px; fill:currentColor; }
  .md-pc .md-px.sure { background:var(--red); color:#000; }
  .md-drop { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .md-drop .check { flex:1 1 180px; align-items:center; min-height:48px; color:var(--text); font-size:15px; }
  .md-drop input[type=text] { flex:0 1 130px; width:130px; font-family:var(--mono); text-transform:uppercase; }
  .md-lg { display:flex; gap:12px; align-items:center; }
  .md-lg canvas { flex:0 0 auto; width:96px; height:100px; background:#000; border-radius:0 14px 0 14px; border:2px solid var(--dark); }
  .md-lg > div { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
  #mdTxText { font:20px var(--mono); letter-spacing:1px; }
  .md-ba { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
  .md-ba.one { grid-template-columns:minmax(0, 1fr); }
  .md-ba figure { margin:0; min-width:0; background:#05040a; border:2px solid var(--dark); border-radius:0 14px 0 14px; padding:6px; display:flex; flex-direction:column; gap:4px; }
  .md-ba figure[hidden] { display:none; }
  .md-ba figure.sel { border-color:var(--pink); box-shadow:0 0 14px color-mix(in srgb, var(--pink) 35%, transparent); }
  .md-ba figcaption { display:flex; justify-content:space-between; gap:6px; font:600 12px var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--label); min-width:0; }
  .md-ba figcaption span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
  .md-ba .md-onw { font:600 10px var(--mono); font-style:normal; letter-spacing:1px; color:#000; background:var(--pink); border-radius:999px; padding:1px 7px; visibility:hidden; flex:0 0 auto; }
  .md-ba figure.sel .md-onw { visibility:visible; }
  .md-ba canvas { max-width:100%; display:block; margin:auto; }
  .md-lgnote { color:var(--green); }
  .md-lm.seg.wrap > .btn { flex:1 1 30%; padding:0 4px; }
  @media (max-width: 480px) { .md-lm.seg.wrap > .btn { font-size:14px; letter-spacing:.5px; } }
  #mdLgEvery[hidden] { display:none; }
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
  const FIRE_COLORS = {classic: ['🔥', 'Classic'], blue: ['💙', 'Blue gas'], purple: ['💜', 'Purple'], rainbow: ['🌈', 'Rainbow'],
                       green: ['💚', 'Green'], pink: ['🩷', 'Pink'], ice: ['🤍', 'Ice'], team: ['🎽', 'Team colors'], nightshift: ['🌙', 'Night shift']};
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
  .md-stiles .tile { min-height:74px; font-size:13px; --c:var(--orange); }
  .md-stiles .tile .em { font-size:24px; }
  @media (max-width: 480px) { .md-stiles .tile { font-size:12px; padding:8px 4px; letter-spacing:.5px; } }
  .md-team { display:flex; gap:8px; align-items:center; min-width:0; }
  .md-team label { flex:1 1 0; min-width:0; display:flex; align-items:center; gap:8px; font:600 14px var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--label); }
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
      const [em, name] = FIRE_COLORS[c] || ['🔥', c];
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.fc = c; b.style.setProperty('--c', FIRE_TINT[c] || 'var(--orange)');
      b.innerHTML = `<span class="em">${em}</span><span>${esc(name)}</span>`;
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
  let TX = {state: {}, presets: []}, txMode = 'scroll', txColor = 'look', txLayer = 'over', lgMode = 'still', lgPixels = null, txLive = null;
  let lgSrc = null, lgRes = null, lgRz = null, lgOpt = {boost: true, removeBg: true};
  try { Object.assign(lgOpt, JSON.parse(localStorage.getItem('gb_logo_opts') || '{}')); } catch (e) {}
  const LG_HINT = 'Any picture works. A flat background is removed for you.';
  const LM_TIP = {still: 'Logo glows with the beat', pulse: 'Logo punches on every kick', shimmer: 'Logo colors shift each bar',
    sparks: '✨ Logo builds itself from sparks', wipe: 'Logo wipes in on the beat', drop: '💥 Logo blasts apart on every drop'};
  const LM_NOTE = {still: 'Glows and breathes with the beat.', pulse: 'Punches bigger on every kick.', shimmer: 'Colors swing round the color wheel each bar.',
    sparks: 'Builds itself from flying sparks each time it appears, then breathes.', wipe: 'Wipes in left to right on the beat, then holds.',
    drop: 'Holds, then explodes into particles on every drop and flies back together.'};
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
      if (s.has_logo && !(lgRes && lgRes.name === s.logo_name)) $('mdLgName').textContent = '✅ ' + (s.logo_name || 'logo') + ' loaded';
      else if (!s.has_logo && !lgPixels) $('mdLgName').textContent = LG_HINT;
      renderText(); lgPaint();
    } catch (e) {}
  }
  const txColorVal = () => txColor === 'custom' ? $('mdTxColor').value : txColor;
  const txBody = () => ({text: $('mdTxText').value.trim() || 'GLOWBOP', mode: txMode, color: txColorVal(), layer: txLayer, speed: $('mdTxSpeed').value / 10,
    drop_flash: $('mdTxDrop').checked, drop_word: ($('mdTxDropWord').value || 'DROP').trim(), logo_mode: lgMode});
  async function sendText(b, msg) { const r = await GB.post('/api/text', GB.withGroup(b)); if (r) { if (msg) GB.toast(msg); setTimeout(loadText, 250); } return r; }
  function txUpdate() { renderText(); const s = TX.state || {}; if (s.show && s.show !== 'off') { clearTimeout(txLive); txLive = setTimeout(() => sendText(txBody()), 250); } }

  GB.panel('text', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `
      <div class="ph"><span>Text</span><span class="r"><span class="md-live md-off" id="mdTxLive">HIDDEN</span></span></div>
      <p class="note">Words on the wall, on top of the show. Changes go live while the text is showing.</p>
      <input type="text" id="mdTxText" maxlength="120" placeholder="e.g. HAPPY BIRTHDAY JACK *" autocomplete="off" aria-label="Message" style="--c:var(--gold)">
      <div class="sub">Mode</div>
      <div class="seg wrap md-gold"><button class="btn" data-tm="scroll">Scroll</button><button class="btn" data-tm="beat">Beat words</button><button class="btn" data-tm="still">Still</button><button class="btn" data-tm="drop">On drop</button></div>
      <div class="sub">Color</div>
      <div class="md-colrow"><div class="seg md-gold"><button class="btn" data-tc="look">Look</button><button class="btn" data-tc="rainbow">Rainbow</button><button class="btn" data-tc="white">White</button></div>
        <input type="color" id="mdTxColor" value="#ff2a8a" title="Pick your own color" aria-label="Pick your own color"></div>
      <div class="sub">Layer</div>
      <div class="seg md-gold"><button class="btn" data-tl="over">Over the show</button><button class="btn" data-tl="solo">Text only</button></div>
      <label class="lv" style="--c:var(--gold)"><span>Speed</span><input type="range" id="mdTxSpeed" min="3" max="30" value="10"><b id="mdTxSpeedV">1.0x</b></label>
      <div class="grid2"><button class="btn c lg" id="mdTxShow" style="--c:var(--gold)"></button><button class="btn lg" id="mdTxSave">${GB.svg('save')}<span>Save</span></button></div>
      <div class="md-drop"><label class="check"><input type="checkbox" id="mdTxDrop"><span>Flash a word on every drop</span></label>
        <input type="text" id="mdTxDropWord" maxlength="12" value="DROP" aria-label="Drop word" style="--c:var(--gold)"></div>
      <div class="sub">Saved</div>
      <div class="md-pre" id="mdTxPresets"></div>`;
    el.querySelectorAll('.md-gold .btn').forEach(b => b.style.setProperty('--c', 'var(--gold)'));
    $('mdTxShow').onclick = () => { const s = TX.state || {}; const on = s.show && s.show !== 'off' && s.show !== 'logo';
      sendText(on ? {show: 'off'} : Object.assign(txBody(), {show: 'text'}), on ? 'Text hidden' : '🔤 Text on the wall'); };
    $('mdTxSave').onclick = async () => { if (await sendText(Object.assign(txBody(), {show: (TX.state || {}).show || 'off'}))) sendText({preset_save: 'text', name: $('mdTxText').value.trim() || 'GLOWBOP'}, '💾 Saved'); };
    $('mdTxText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendText(Object.assign(txBody(), {show: 'text'}), '🔤 Text on the wall'); } });
    $('mdTxText').addEventListener('input', txUpdate);
    el.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { txMode = b.dataset.tm; txUpdate(); });
    el.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { txColor = b.dataset.tc; txUpdate(); });
    $('mdTxColor').oninput = () => { txColor = 'custom'; txUpdate(); };
    el.querySelectorAll('[data-tl]').forEach(b => b.onclick = () => { txLayer = b.dataset.tl; txUpdate(); });
    $('mdTxSpeed').oninput = txUpdate;
    $('mdTxDrop').onchange = () => sendText({drop_flash: $('mdTxDrop').checked, drop_word: ($('mdTxDropWord').value || 'DROP').trim()}, $('mdTxDrop').checked ? '💥 Drops will flash your word' : 'Drop word off');
    $('mdTxDropWord').onchange = () => sendText({drop_word: ($('mdTxDropWord').value || 'DROP').trim()});
    GB.paintRange($('mdTxSpeed'));
  });

  GB.panel('text', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    const tg = (id, t, s) => `<button class="md-fx" id="${id}" type="button" aria-pressed="false"><span class="t"><b>${t}</b><small>${s}</small></span><span class="sw"></span></button>`;
    el.innerHTML = `
      <div class="ph"><span>Logo</span><span class="r"><span class="md-live md-off" id="mdLgLive">HIDDEN</span></span></div>
      <div class="md-lg"><canvas id="mdLgPrev" width="192" height="200" aria-label="Your picture"></canvas>
        <div><input type="file" id="mdLgFile" accept="image/*" hidden>
          <button class="btn c" id="mdLgPick" style="--c:var(--violet)">${GB.svg('add')}<span>Choose a picture</span></button>
          <p class="note" id="mdLgName">${LG_HINT}</p></div></div>
      <div class="md-ba" id="mdLgBA">
        <figure id="mdLgBeforeF"><figcaption><span>Before</span><i class="md-onw">ON WALL</i></figcaption><canvas id="mdLgBefore" aria-label="Before: plain shrink"></canvas></figure>
        <figure id="mdLgAfterF"><figcaption><span id="mdLgAfterL">After</span><i class="md-onw">ON WALL</i></figcaption><canvas id="mdLgAfter" aria-label="How the logo looks on the wall"></canvas></figure>
      </div>
      <p class="note md-lgnote" id="mdLgNote" hidden></p>
      <div class="md-fxl">
        ${tg('mdLgBoost', 'Boost for LEDs', 'Punchier colors, lifts dark colors, thickens thin lines, turns near-black off.')}
        ${tg('mdLgBg', 'Remove background', 'Finds a flat background (white or any solid color) and turns it off.')}
      </div>
      <div class="sub">Entrance &amp; motion</div>
      <div class="seg wrap md-pinks md-lm"><button class="btn" data-lm="still">Glow</button><button class="btn" data-lm="pulse">Pulse</button><button class="btn" data-lm="shimmer">Color shift</button><button class="btn" data-lm="sparks">Sparks</button><button class="btn" data-lm="wipe">Wipe in</button><button class="btn" data-lm="drop">Drop blast</button></div>
      <p class="note" id="mdLgMdNote"></p>
      <div class="md-fxl">
        ${tg('mdLgInside', 'Show inside the logo', 'The light show plays only inside the logo shape, with a soft glow round the edge.')}
        ${tg('mdLgSlide', 'Slideshow', 'Rotates through every saved logo, with the entrance above.')}
      </div>
      <div class="seg md-pinks" id="mdLgEvery"><button class="btn" data-se="8bars">Every 8 bars</button><button class="btn" data-se="1min">1 min</button><button class="btn" data-se="5min">5 min</button></div>
      <p class="note" id="mdLgSlNote"></p>
      <div class="pads">
        <button class="btn c" id="mdLgShow" style="--c:var(--pink)"></button>
        <button class="btn c" id="mdLgBoth" style="--c:var(--lav)">${GB.svg('shuffle')}<span>Logo + text</span></button>
        <button class="btn c" id="mdLgSave" style="--c:var(--gold)">${GB.svg('save')}<span>Save</span></button>
        <button class="btn danger" id="mdLgRemove">${GB.svg('trash')}<span>Remove</span></button>
      </div>`;
    el.querySelectorAll('.md-pinks .btn').forEach(b => b.style.setProperty('--c', 'var(--pink)'));
    el.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { lgMode = b.dataset.lm; renderText(); sendText({logo_mode: lgMode}, (TX.state || {}).show === 'logo' ? LM_TIP[lgMode] : ''); });
    el.querySelectorAll('[data-se]').forEach(b => b.onclick = () => { TX.state.slide_every = b.dataset.se; renderText(); sendText({slide_every: b.dataset.se}); });
    const flip = k => { lgOpt[k] = !lgOpt[k]; try { localStorage.setItem('gb_logo_opts', JSON.stringify(lgOpt)); } catch (e) {}
      if (lgSrc) { lgRun(); lgSend(false); } else renderText(); };
    $('mdLgBoost').onclick = () => flip('boost');
    $('mdLgBg').onclick = () => flip('removeBg');
    $('mdLgInside').onclick = () => { const v = !(TX.state || {}).logo_inside; TX.state.logo_inside = v; renderText();
      sendText({logo_inside: v}, v ? '✨ The show plays inside your logo' : 'Logo drawn normally'); };
    $('mdLgSlide').onclick = () => { const s = TX.state || {}, v = !s.slideshow;
      if (v && (s.logo_count || 0) < 2) GB.toast('Save 2 or more logos to rotate them');
      s.slideshow = v; renderText(); sendText(Object.assign({slideshow: v}, v && s.has_logo && s.show !== 'logo' && s.show !== 'both' ? {show: 'logo'} : {}), v ? '🔁 Logo slideshow on' : 'Slideshow off'); };
    $('mdLgPick').onclick = () => $('mdLgFile').click();
    $('mdLgFile').onchange = () => {
      const f = $('mdLgFile').files[0]; if (!f) return; const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 480 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
        lgSrc = {data: g.getImageData(0, 0, w, h).data, w, h, name: f.name.replace(/\.[^.]+$/, '').slice(0, 40)};
        URL.revokeObjectURL(img.src);
        lgRun(); lgSend(true);
      };
      img.onerror = () => GB.toast('⚠️ Could not read that picture');
      img.src = URL.createObjectURL(f);
    };
    $('mdLgShow').onclick = () => { const s = TX.state || {}; if (s.show === 'logo') return sendText({show: 'off'}, 'Logo hidden');
      if (!s.has_logo && !lgPixels) return GB.toast('Choose a picture first'); sendText({show: 'logo', logo_mode: lgMode}, '🖼️ Logo on the wall'); };
    $('mdLgBoth').onclick = () => { const s = TX.state || {}; if (!s.has_logo) return GB.toast('Choose a picture first');
      sendText(Object.assign(txBody(), {show: s.show === 'both' ? 'off' : 'both'}), s.show === 'both' ? 'Text + logo off' : '🔁 Text and logo take turns every 8 bars'); };
    $('mdLgRemove').onclick = async () => { const s = TX.state || {};
      if (!s.has_logo && !lgPixels) return GB.toast('No logo loaded');
      const show = s.show === 'both' ? 'text' : (s.show === 'logo' ? 'off' : (s.show || 'off'));
      if (await sendText({logo: null, show}, '🗑️ Logo removed')) { lgPixels = null; lgSrc = null; lgRes = null; $('mdLgFile').value = ''; const c = $('mdLgPrev'); c.getContext('2d').clearRect(0, 0, c.width, c.height); $('mdLgName').textContent = LG_HINT; lgPaint(); } };
    $('mdLgSave').onclick = () => { if (!(TX.state || {}).has_logo) return GB.toast('Choose a picture first'); sendText({preset_save: 'logo', name: (TX.state.logo_name || 'Logo')}, '💾 Logo saved'); };
    window.addEventListener('resize', () => { clearTimeout(lgRz); lgRz = setTimeout(lgPaint, 150); });
    lgPaint();
  });

  // ---- logo helpers: process the picked picture, draw the LED previews, send it
  function lgWall() { const gi = GB.grpInfo() || ((GB.status && GB.status.groups) || [])[0] || {w: 20, h: 21}; return [gi.w || 20, gi.h || 21]; }
  function lgRun() {
    if (!lgSrc) return;
    const [W, H] = lgWall();
    lgRes = lgProcess(lgSrc.data, lgSrc.w, lgSrc.h, W, H, lgOpt); lgRes.W = W; lgRes.H = H; lgRes.name = lgSrc.name;
    lgPixels = (lgOpt.boost ? lgRes.boost : lgRes.plain).rgb;
    const pc = $('mdLgPrev'), pv = pc.getContext('2d'), t = lgRes.thumb;           // the cleaned-up picture (checks = removed)
    pv.clearRect(0, 0, pc.width, pc.height);
    for (let y = 0; y < pc.height; y += 12) for (let x = 0; x < pc.width; x += 12) { pv.fillStyle = ((x + y) / 12) % 2 ? '#2a2638' : '#1b1826'; pv.fillRect(x, y, 12, 12); }
    const tc = document.createElement('canvas'); tc.width = t.w; tc.height = t.h; tc.getContext('2d').putImageData(new ImageData(t.data, t.w, t.h), 0, 0);
    const s = Math.min(pc.width / t.w, pc.height / t.h) * 0.92; pv.imageSmoothingQuality = 'high';
    pv.drawImage(tc, (pc.width - t.w * s) / 2, (pc.height - t.h * s) / 2, t.w * s, t.h * s);
    $('mdLgName').textContent = lgSrc.name + ' · ' + W + '×' + H + ' bulbs';
    lgPaint();
  }
  function lgSend(show) {
    if (!lgRes) return; const v = lgOpt.boost ? lgRes.boost : lgRes.plain;
    const b = {logo: {rgb: v.rgb, a: v.a, w: lgRes.W, h: lgRes.H, name: lgRes.name}, logo_mode: lgMode};
    if (show) b.show = (TX.state || {}).show === 'both' ? 'both' : 'logo';
    sendText(b, show ? '🖼️ Logo on the wall' : (lgOpt.boost ? '⚡ Boost on' : 'Boost off') + ' · ' + (lgOpt.removeBg ? 'background removed' : 'background kept'));
  }
  function lgDraw(cv, rgb, W, H) {                                      // the bulbs as glowing dots, like the live wall preview
    const box = cv.parentElement, bw = Math.max(60, (box.clientWidth || 162) - 12), st = Math.min(bw / W, 210 / H), cssW = Math.round(st * W), cssH = Math.round(st * H);
    const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px'; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#05040a'; g.fillRect(0, 0, cssW, cssH);
    const r = st * 0.42;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3;
      if (rgb && rgb[i] + rgb[i + 1] + rgb[i + 2] > 6) continue; g.fillStyle = '#16121f'; g.beginPath(); g.arc(x * st + st / 2, y * st + st / 2, r * 0.55, 0, 6.283); g.fill(); }
    if (!rgb) return;
    g.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, R = rgb[i], G = rgb[i + 1], B = rgb[i + 2];
      if (R + G + B <= 6) continue; const px = x * st + st / 2, py = y * st + st / 2, gr = g.createRadialGradient(px, py, 0, px, py, st * 1.15);
      gr.addColorStop(0, `rgba(${R},${G},${B},0.42)`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.fillRect(px - st * 1.2, py - st * 1.2, st * 2.4, st * 2.4); }
    g.globalCompositeOperation = 'source-over';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, R = rgb[i], G = rgb[i + 1], B = rgb[i + 2];
      if (R + G + B <= 6) continue; const px = x * st + st / 2, py = y * st + st / 2;
      g.fillStyle = `rgb(${R},${G},${B})`; g.beginPath(); g.arc(px, py, r, 0, 6.283); g.fill();
      g.fillStyle = `rgba(255,255,255,${0.18 * Math.max(R, G, B) / 255})`; g.beginPath(); g.arc(px - r * 0.2, py - r * 0.25, r * 0.4, 0, 6.283); g.fill(); }
  }
  function lgPaint() {
    if (!$('mdLgBA')) return;
    const bf = $('mdLgBeforeF'), af = $('mdLgAfterF'), s = TX.state || {}, local = lgRes && (!s.logo_name || s.logo_name === lgRes.name);
    $('mdLgPrev').style.display = lgRes ? '' : 'none';
    if (local) {
      bf.hidden = false; $('mdLgBA').classList.remove('one');
      $('mdLgAfterL').textContent = 'After';
      bf.classList.toggle('sel', !lgOpt.boost); af.classList.toggle('sel', !!lgOpt.boost);
      lgDraw($('mdLgBefore'), lgRes.plain.rgb, lgRes.W, lgRes.H); lgDraw($('mdLgAfter'), lgRes.boost.rgb, lgRes.W, lgRes.H);
      const n = $('mdLgNote'); n.hidden = !lgRes.notes.length; n.textContent = lgRes.notes.join(' ');
    } else {
      bf.hidden = true; $('mdLgBA').classList.add('one'); af.classList.add('sel');
      $('mdLgAfterL').textContent = TX.logo ? (s.logo_name || 'On the wall') : 'On the wall';
      const [W, H] = TX.logo ? [TX.logo.w, TX.logo.h] : lgWall();
      lgDraw($('mdLgAfter'), TX.logo ? TX.logo.rgb : null, W, H);
      $('mdLgNote').hidden = true;
    }
  }

  /*LGPROC*/
  // 🖼️ Logo -> LED pixels, all on the phone. Pure maths on RGBA bytes so it is testable anywhere.
  // Returns {plain, boost} (each {rgb:[0-255 x3], a:[0-255]} at W x H), notes, and the cleaned-up source for the thumbnail.
  function lgProcess(src, sw, sh, W, H, o) {
    const N = sw * sh, px = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) px[i] = src[i] / 255;
    const notes = []; let removed = false, transparent = false;
    const border = [];
    for (let x = 0; x < sw; x++) border.push(x, (sh - 1) * sw + x);
    for (let y = 1; y < sh - 1; y++) border.push(y * sw, y * sw + sw - 1);
    let clear = 0; for (const i of border) if (px[i * 4 + 3] < 0.5) clear++;
    if (clear > border.length * 0.3) { transparent = true; notes.push('Using the picture\'s see-through background.'); }
    else if (o.removeBg) {                                              // flat background? (most of the border is one colour)
      const buck = new Map(), key = i => ((src[i * 4] >> 4) << 8) | ((src[i * 4 + 1] >> 4) << 4) | (src[i * 4 + 2] >> 4);
      for (const i of border) if (px[i * 4 + 3] >= 0.5) { const k = key(i); buck.set(k, (buck.get(k) || 0) + 1); }
      let bk = -1, bn = 0; buck.forEach((n, k) => { if (n > bn) { bn = n; bk = k; } });
      let br = 0, bg = 0, bb = 0, c = 0;
      for (const i of border) if (px[i * 4 + 3] >= 0.5 && key(i) === bk) { br += px[i * 4]; bg += px[i * 4 + 1]; bb += px[i * 4 + 2]; c++; }
      if (c) { br /= c; bg /= c; bb /= c; }
      const tol = 0.2, dist = i => Math.hypot(px[i * 4] - br, px[i * 4 + 1] - bg, px[i * 4 + 2] - bb);
      let near = 0, opq = 0; for (const i of border) if (px[i * 4 + 3] >= 0.5) { opq++; if (dist(i) < tol) near++; }
      if (c && near >= opq * 0.6) {
        const seen = new Uint8Array(N), st = [];
        for (const i of border) if (px[i * 4 + 3] >= 0.5 && dist(i) < tol) { seen[i] = 1; st.push(i); }
        while (st.length) {                                             // flood fill the background in from the edges
          const i = st.pop(), x = i % sw, y = (i / sw) | 0;
          if (x > 0 && !seen[i - 1] && dist(i - 1) < tol) { seen[i - 1] = 1; st.push(i - 1); }
          if (x < sw - 1 && !seen[i + 1] && dist(i + 1) < tol) { seen[i + 1] = 1; st.push(i + 1); }
          if (y > 0 && !seen[i - sw] && dist(i - sw) < tol) { seen[i - sw] = 1; st.push(i - sw); }
          if (y < sh - 1 && !seen[i + sw] && dist(i + sw) < tol) { seen[i + sw] = 1; st.push(i + sw); }
        }
        let cnt = 0;
        for (let i = 0; i < N; i++) if (seen[i] || dist(i) < tol * 0.5) { seen[i] = 1; px[i * 4 + 3] = 0; cnt++; }   // + the same colour inside letters (the hole in an O)
        for (let i = 0; i < N; i++) {                                   // soften the cut edge
          if (seen[i]) continue; const x = i % sw, y = (i / sw) | 0;
          const nb = (x > 0 && seen[i - 1]) || (x < sw - 1 && seen[i + 1]) || (y > 0 && seen[i - sw]) || (y < sh - 1 && seen[i + sw]);
          if (nb) { const d = dist(i); if (d < tol * 2) px[i * 4 + 3] *= Math.min(1, Math.max(0, (d - tol * 0.5) / (tol * 1.5))); }
        }
        removed = cnt > N * 0.02 && cnt < N * 0.995;
        if (!removed) for (let i = 0; i < N; i++) px[i * 4 + 3] = src[i * 4 + 3] / 255;   // took everything (or nothing): undo
        else {
          const nm = br > 0.85 && bg > 0.85 && bb > 0.85 ? 'white' : br < 0.15 && bg < 0.15 && bb < 0.15 ? 'black' : 'solid ' + lgHex(br, bg, bb);
          notes.push('Removed the ' + nm + ' background.');
        }
      } else notes.push('No flat background found, so the whole picture is used.');
    }
    if (removed || transparent) {                                       // a black logo on a cut-out background: light it up in white
      let fg = 0, dark = 0;
      for (let i = 0; i < N; i++) if (px[i * 4 + 3] > 0.5) { fg++; const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mx < 0.25 || (0.3 * r + 0.59 * g + 0.11 * b < 0.22 && mx - mn < 0.2)) dark++; }
      if (fg && dark > fg * 0.6) {
        for (let i = 0; i < N; i++) { const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          if (mx < 0.35 && mx - mn < 0.15) { const v = 1 - mx * 0.6; px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; } }
        notes.push('Dark logo lit in white so the bulbs can show it.');
      }
    }
    // crop to the logo itself so it fills the wall
    let x0 = 0, y0 = 0, x1 = sw, y1 = sh;
    if (removed || transparent) {
      x0 = sw; y0 = sh; x1 = 0; y1 = 0;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (px[(y * sw + x) * 4 + 3] > 0.3) { if (x < x0) x0 = x; if (x >= x1) x1 = x + 1; if (y < y0) y0 = y; if (y >= y1) y1 = y + 1; }
      if (x1 <= x0) { x0 = 0; y0 = 0; x1 = sw; y1 = sh; }
    }
    // resample into a fine grid (S x S samples per bulb), premultiplied, box-filtered
    const S = 6, GW = W * S, GH = H * S, cw = x1 - x0, ch = y1 - y0, sc = Math.min(GW / cw, GH / ch);
    const dw = cw * sc, dh = ch * sc, ox = (GW - dw) / 2, oy = (GH - dh) / 2, G = new Float32Array(GW * GH * 4);
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
    const mask = new Float32Array(GW * GH); let fg = 0;
    for (let i = 0; i < GW * GH; i++) { mask[i] = G[i * 4 + 3] > 0.5 && Math.max(G[i * 4], G[i * 4 + 1], G[i * 4 + 2]) > 0.08 ? 1 : 0; fg += mask[i]; }
    const er = maxf(mask, 1, S >> 1, Math.min); let keep = 0; for (let i = 0; i < GW * GH; i++) keep += er[i];
    const thin = fg > 0 && keep < fg * 0.3;
    let GB2 = G;
    if (thin && o.boost) {
      const r = fg < GW * GH * 0.04 ? 3 : 2; GB2 = new Float32Array(GW * GH * 4);
      const sel = new Float32Array(GW * GH);                            // dilate the bright detail: take the brightest neighbour's colour
      for (let c = 0; c < 4; c++) { for (let i = 0; i < GW * GH; i++) sel[i] = G[i * 4 + c]; const D = maxf(sel, 1, r, Math.max); for (let i = 0; i < GW * GH; i++) GB2[i * 4 + c] = D[i]; }
      notes.push('Thin lines thickened so they read on the bulbs.');
    }
    const cells = Gr => {                                               // average each bulb's S x S samples
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) { const j = ((y * S + yy) * GW + x * S + xx) * 4; r += Gr[j]; g += Gr[j + 1]; b += Gr[j + 2]; a += Gr[j + 3]; }
        const n = S * S; out.push(a > 1e-4 ? [r / a, g / a, b / a, a / n] : [0, 0, 0, 0]);
      }
      return out;
    };
    const finish = (cl, boost) => {
      const rgb = [], al = [];
      for (const [r0, g0, b0, A] of cl) {
        let r = r0, g = g0, b = b0, af;
        if (boost) {
          af = Math.min(1, Math.max(0, (A - 0.12) / 0.38));
          let [h, s, v] = lgHsv(r, g, b);
          if (s > 0.2) { s = Math.min(1, s * 1.4 + 0.08); v = Math.max(v, 0.5 + 0.5 * v); }    // lift dark-but-coloured, punch the colour
          else v = Math.min(1, Math.max(0, (v - 0.5) * 1.3 + 0.5));                           // greys: more contrast
          [r, g, b] = lgRgb(h, s, v);
          const mx = Math.max(r, g, b);
          if (mx > 0.15) { const k = Math.min(2.2, 1 / mx) * 0.85 + 0.15; r = Math.min(1, r * k); g = Math.min(1, g * k); b = Math.min(1, b * k); }
          if (Math.max(r, g, b) * af < 0.18) af = 0;                   // near-black: an off bulb
        } else { af = Math.min(1, A); if (Math.max(r, g, b) * af < 0.05) af = 0; }
        rgb.push(Math.round(r * af * 255), Math.round(g * af * 255), Math.round(b * af * 255)); al.push(Math.round(af * 255));
      }
      return {rgb, a: al};
    };
    const plainCells = cells(G);
    const thumb = new Uint8ClampedArray(cw * ch * 4);                   // the cleaned-up picture, for the thumbnail
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = ((y + y0) * sw + x + x0) * 4, j = (y * cw + x) * 4; for (let c = 0; c < 4; c++) thumb[j + c] = Math.round(px[i + c] * 255); }
    return {plain: finish(plainCells, false), boost: finish(GB2 === G ? plainCells : cells(GB2), true), notes, removed, transparent, thin, thumb: {data: thumb, w: cw, h: ch}};
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
    if (!$('mdTxShow')) return;
    const s = TX.state || {}, on = s.show && s.show !== 'off', txOn = on && s.show !== 'logo';
    GB.lbl($('mdTxShow'), txOn ? 'stop' : 'play', txOn ? 'Hide text' : 'Show text');
    $('mdTxShow').classList.toggle('on', !!txOn); $('mdTxShow').style.setProperty('--c', txOn ? 'var(--orange)' : 'var(--gold)');
    GB.lbl($('mdLgShow'), s.show === 'logo' ? 'stop' : 'play', s.show === 'logo' ? 'Hide logo' : 'Show logo');
    $('mdLgShow').classList.toggle('on', s.show === 'logo'); $('mdLgShow').style.setProperty('--c', s.show === 'logo' ? 'var(--orange)' : 'var(--pink)');
    $('mdLgBoth').classList.toggle('on', s.show === 'both');
    const tl = $('mdTxLive'), showing = {text: 'SHOWING', both: 'TAKING TURNS'}[s.show];
    tl.textContent = showing || 'HIDDEN'; tl.classList.toggle('md-off', !showing);
    const ll = $('mdLgLive'), lshow = {logo: 'SHOWING', both: 'TAKING TURNS'}[s.show];
    ll.textContent = lshow || (s.has_logo ? 'LOADED' : 'NONE'); ll.classList.toggle('md-off', !lshow);
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
    $('mdLgSlNote').textContent = s.slideshow ? (nl >= 2 ? `Rotating ${nl} saved logos. Now: ${s.logo_name || '-'}` : `Only ${nl} saved logo${nl === 1 ? '' : 's'}. Save 2 or more to rotate (pick a picture, tap Save).`) : (nl ? `${nl} saved logo${nl === 1 ? '' : 's'}. Great for sponsors at a game or business.` : 'Save logos below, then rotate them. Great for sponsors.');
    $('mdTxSpeedV').textContent = ($('mdTxSpeed').value / 10).toFixed(1) + 'x';
    const box = $('mdTxPresets'); box.innerHTML = '';
    const pre = TX.presets || [];
    pre.slice().reverse().forEach(p => {
      const w = document.createElement('span'); w.className = 'md-pc';
      const c = document.createElement('button'); c.className = 'chip';
      c.textContent = (p.kind === 'logo' ? '🖼️ ' : '🔤 ') + p.name; c.onclick = () => sendText({preset: p.name, preset_kind: p.kind}, `Showing "${p.name}"`);
      const x = document.createElement('button'); x.className = 'md-px'; x.innerHTML = GB.svg('close'); x.title = 'Delete'; x.setAttribute('aria-label', 'Delete ' + p.name);
      x.onclick = () => {                                              // tap once to arm, again to delete (no pop-up)
        if (!x.classList.contains('sure')) { x.classList.add('sure'); x.textContent = 'Delete?'; clearTimeout(x._t); x._t = setTimeout(() => { x.classList.remove('sure'); x.innerHTML = GB.svg('close'); }, 3000); return; }
        sendText({preset_delete: p.name, preset_kind: p.kind}, `🗑️ Deleted "${p.name}"`);
      };
      w.appendChild(c); w.appendChild(x); box.appendChild(w);
    });
    const n = document.createElement('p'); n.className = 'note'; n.style.width = '100%';
    n.textContent = pre.length ? 'Tap a saved one to show it. Tap X twice to delete it.' : 'Nothing saved yet. Tap Save above, or Save on a logo.';
    box.appendChild(n);
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
  });
})();
