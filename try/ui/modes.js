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
  const LG_HINT = 'PNG with a see-through or black background works best.';
  async function loadText() {
    try {
      TX = await GB.get('/api/text' + (GB.gsel ? '?g=' + encodeURIComponent(GB.gsel) : ''));
      const s = TX.state || {};
      txMode = s.mode || 'scroll'; txColor = s.color || 'look'; txLayer = s.layer || 'over'; lgMode = s.logo_mode || 'still';
      if (s.text && !$('mdTxText').value) $('mdTxText').value = s.text;
      $('mdTxDrop').checked = !!s.drop_flash; if (s.drop_word) $('mdTxDropWord').value = s.drop_word;
      if (s.speed) { $('mdTxSpeed').value = Math.round(s.speed * 10); GB.paintRange($('mdTxSpeed')); }
      if (s.color && s.color.startsWith('#')) { $('mdTxColor').value = s.color; txColor = 'custom'; }
      if (s.has_logo) $('mdLgName').textContent = '✅ ' + (s.logo_name || 'logo') + ' loaded';
      else if (!lgPixels) $('mdLgName').textContent = LG_HINT;
      renderText();
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
    el.innerHTML = `
      <div class="ph"><span>Logo</span><span class="r"><span class="md-live md-off" id="mdLgLive">HIDDEN</span></span></div>
      <div class="md-lg"><canvas id="mdLgPrev" width="120" height="126" aria-label="Logo preview"></canvas>
        <div><input type="file" id="mdLgFile" accept="image/*" hidden>
          <button class="btn c" id="mdLgPick" style="--c:var(--violet)">${GB.svg('add')}<span>Choose a picture</span></button>
          <p class="note" id="mdLgName">${LG_HINT}</p></div></div>
      <p class="note">The picture shrinks to the wall's pixels right here on your phone.</p>
      <div class="sub">Motion</div>
      <div class="seg md-pinks"><button class="btn" data-lm="still">Glow</button><button class="btn" data-lm="pulse">Pulse</button><button class="btn" data-lm="shimmer">Color shift</button></div>
      <div class="pads">
        <button class="btn c" id="mdLgShow" style="--c:var(--pink)"></button>
        <button class="btn c" id="mdLgBoth" style="--c:var(--lav)">${GB.svg('shuffle')}<span>Logo + text</span></button>
        <button class="btn c" id="mdLgSave" style="--c:var(--gold)">${GB.svg('save')}<span>Save</span></button>
        <button class="btn danger" id="mdLgRemove">${GB.svg('trash')}<span>Remove</span></button>
      </div>`;
    el.querySelectorAll('.md-pinks .btn').forEach(b => b.style.setProperty('--c', 'var(--pink)'));
    el.querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { lgMode = b.dataset.lm; renderText(); sendText({logo_mode: lgMode}); });
    $('mdLgPick').onclick = () => $('mdLgFile').click();
    $('mdLgFile').onchange = () => {
      const f = $('mdLgFile').files[0]; if (!f) return; const img = new Image();
      img.onload = () => {
        const gi = GB.grpInfo() || ((GB.status && GB.status.groups) || [])[0] || {w: 20, h: 21};
        const W = gi.w || 20, H = gi.h || 21, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
        g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.imageSmoothingQuality = 'high';
        const sc = Math.min(W / img.width, H / img.height), w = img.width * sc, h = img.height * sc; g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        const d = g.getImageData(0, 0, W, H).data, rgb = [];
        for (let i = 0; i < W * H; i++) {
          let r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2]; const mx = Math.max(r, gg, b);
          if (mx > 40) { const k = Math.min(2.2, 255 / mx) * 0.85 + 0.15; r = Math.min(255, r * k); gg = Math.min(255, gg * k); b = Math.min(255, b * k); }   // LEDs look best bright
          else { r = gg = b = 0; }
          rgb.push(Math.round(r), Math.round(gg), Math.round(b));
        }
        lgPixels = rgb;
        const pc = $('mdLgPrev'), pv = pc.getContext('2d'), st = Math.min(pc.width / W, pc.height / H);
        pv.fillStyle = '#000'; pv.fillRect(0, 0, pc.width, pc.height);
        const ox = (pc.width - W * st) / 2, oy = (pc.height - H * st) / 2;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; pv.fillStyle = `rgb(${rgb[i]},${rgb[i + 1]},${rgb[i + 2]})`; pv.beginPath(); pv.arc(ox + x * st + st / 2, oy + y * st + st / 2, st * 0.43, 0, 6.283); pv.fill(); }
        const nm = f.name.replace(/\.[^.]+$/, '');
        $('mdLgName').textContent = nm + ' is ready';
        sendText({logo: {rgb, w: W, h: H, name: nm.slice(0, 40)}, logo_mode: lgMode, show: 'logo'}, '🖼️ Logo on the wall');
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
      if (await sendText({logo: null, show}, '🗑️ Logo removed')) { lgPixels = null; $('mdLgFile').value = ''; const c = $('mdLgPrev'); c.getContext('2d').clearRect(0, 0, c.width, c.height); $('mdLgName').textContent = LG_HINT; } };
    $('mdLgSave').onclick = () => { if (!(TX.state || {}).has_logo) return GB.toast('Choose a picture first'); sendText({preset_save: 'logo', name: (TX.state.logo_name || 'Logo')}, '💾 Logo saved'); };
  });

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
  });
})();
