/* 📡 LIVE page hub: shared state for every live feed (GB.feedsState from /api/feeds), the feed() helper,
   and the "Your location" panel (ZIP or city) that weather, storm watch and overhead use. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.feedsState = null;
  GB.feed = (body) => GB.post('/api/feeds', GB.withGroup(body));      // e.g. GB.feed({feed:'countdown', on:true})
  let t = null;
  async function poll() {
    clearTimeout(t);
    try { GB.feedsState = await GB.get('/api/feeds' + (GB.gsel ? '?g=' + encodeURIComponent(GB.gsel) : '')); GB.emit('feeds', GB.feedsState); } catch (e) {}
    t = setTimeout(poll, GB.page === 'feeds' || GB.page === 'score' ? 1500 : 8000);
  }
  GB.feedsRefresh = (ms) => { clearTimeout(t); t = setTimeout(poll, ms == null ? 250 : ms); };
  GB.on('ready', poll); GB.on('page', id => { if (id === 'feeds' || id === 'score') GB.feedsRefresh(0); }); GB.on('group', () => GB.feedsRefresh(0));

  GB.css(`
  .fd-intro { display:flex; gap:10px; align-items:center; }
  .fd-loc { display:flex; gap:8px; } .fd-loc input { flex:1; min-width:0; }
  .fd-on { font:700 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; padding:3px 8px; border-radius:999px; background:var(--green); color:#000; }
  `);
  // 🎛️ the picker: one big key per live feed. Tap = on the wall (or off again); the panel below has its settings.
  // [key, icon (GB.svg name), emoji fallback, label, colour, panel title]. An icon missing from core.js falls back to the emoji.
  const PICK = [['countdown', 'confetti', '🎉', 'Countdown', 'var(--gold)', 'Countdown'], ['weather', 'sun', '🌦️', 'Weather', 'var(--cyan)', 'Weather'],
                ['storm', 'wind', '🌀', 'Storm watch', 'var(--red)', 'Storm watch'], ['overhead', 'plane', '✈️', 'Overhead', 'var(--lav)', 'Overhead now'],
                ['quakes', 'quake', '🌍', 'Quakes', 'var(--orange)', 'Earthquakes'], ['aurora', 'aurora', '🌌', 'Aurora', 'var(--green)', 'Aurora'],
                ['launches', 'rocket', '🚀', 'Launches', 'var(--gold)', 'Rocket launches'], ['moon', 'moon', '🌕', 'Moon & sun', 'var(--peri)', 'Moon & sun'],
                ['globe', 'globe', '🌐', 'Globe', 'var(--cyan)', 'Globe'], ['volcano', 'volcano', '🌋', 'Volcano', 'var(--red)', 'Volcanoes'],
                ['fires', 'fire', '🔥', 'Fires', 'var(--orange)', 'Wildfires']];   // golf, racing, tennis + UFC live on SPORTS
  const icon = (ic, em) => GB.ICON && GB.ICON[ic] ? GB.svg(ic) : em;
  function panelFor(title) { return [...document.querySelectorAll('#pg-feeds > .panel')].find(p => { const h = p.querySelector('.ph span'); return h && h.textContent.trim().toLowerCase() === title.toLowerCase(); }); }
  GB.panel('feeds', 1, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    el.innerHTML = `<div class="ph"><span>Pick a live feed</span><span class="r">tap = on the wall</span></div><div class="tiles" id="fdPick"></div>
      <p class="note">Tap again to turn it off. Settings for each one are further down this page.</p>`;
    PICK.forEach(([k, ic, em, label, c, title]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${icon(ic, em)}</span>${label}`;
      b.onclick = async () => {
        const st = GB.feedsState || {}, f = (st.feeds || {})[k] || {};
        if (k === 'storm') { const on = !(f.enabled || f.on); if (await GB.feed({feed: 'storm', on})) GB.toast(on ? '🌀 Storm watch is on' : 'Storm watch is off'); }
        else { const on = st.mode === k; if (await GB.feed(on ? {mode: 'off'} : {feed: k, on: true})) GB.toast(on ? '🎵 Back to the music show' : em + ' ' + label + ' on the wall'); }
        GB.feedsRefresh(150);
        const pn = panelFor(title); if (pn) setTimeout(() => pn.scrollIntoView({behavior: 'smooth', block: 'start'}), 250);
      };
      el.querySelector('#fdPick').appendChild(b);
    });
  });
  GB.on('feeds', st => {
    document.querySelectorAll('#fdPick .tile').forEach(b => { const f = (st.feeds || {})[b.dataset.k];
      b.hidden = !f; b.classList.toggle('on', !!f && (b.dataset.k === 'storm' ? !!(f.enabled || f.on) : st.mode === b.dataset.k)); });
  });

  GB.panel('feeds', 5, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    el.innerHTML = `<div class="ph"><span>Live feeds</span><span class="r" id="fdNow">–</span></div>
      <p class="note">Things from the outside world, live on your lights. Countdowns, weather, what's flying overhead, earthquakes, the aurora, rocket launches, the moon, the globe, volcanoes and wildfires take over the wall while they're on. Golf, racing, tennis and UFC are on the SPORTS page. Storm watch runs on top of the music show and only flashes when something happens.</p>
      <label class="field">Your location (weather, storms, overhead, quakes, launches, fires and sun times)
        <div class="fd-loc"><input type="text" id="fdLoc" placeholder="ZIP code, or City, State" autocomplete="postal-code"><button class="btn c" id="fdLocGo" style="--c:var(--green)">Save</button></div></label>
      <p class="note" id="fdLocSt"></p>
      <button class="btn wide" id="fdOff">Turn the live feed off</button>`;
    $('fdLocGo').onclick = async () => { const v = $('fdLoc').value.trim(); if (!v) return GB.toast('Type a ZIP code or a city');
      if (await GB.feed({loc: v})) { GB.toast('📍 Looking it up…'); GB.feedsRefresh(1500); } };
    $('fdLoc').addEventListener('keydown', e => { if (e.key === 'Enter') $('fdLocGo').click(); });
    $('fdOff').onclick = async () => { if (await GB.feed({mode: 'off'})) { GB.toast('🎵 Back to the music show'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', st => {
    if (!$('fdNow')) return;
    const on = st.feeds && st.feeds[st.mode];
    $('fdNow').textContent = on ? 'ON THE WALL: ' + on.title.toUpperCase() : 'MUSIC SHOW';
    $('fdOff').hidden = !on;
    const loc = st.loc || {};
    $('fdLocSt').textContent = st.geo_msg || (loc.name ? '📍 ' + loc.name : 'No location yet.');
    if (document.activeElement !== $('fdLoc') && loc.q && !$('fdLoc').value) $('fdLoc').value = loc.q;
  });
})();

/* 🌍🌌🚀🌕 Earthquakes, Aurora, Rocket launches, Moon & sun panels (LIVE page). Times and dates use this phone's
   own locale (12 / 24 hour as the phone is set); sun times use the saved place's time zone when it is known. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .sk-reads { grid-template-columns:repeat(3, minmax(0,1fr)); }
  .sk-reads .read .v { font-size:calc(19px * var(--fs, 1)); white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:anywhere; } .sk-reads .read .v small { display:block; font-size:calc(11px * var(--fs, 1)); }
  .sk-reads.two { grid-template-columns:repeat(2, minmax(0,1fr)); } @media (min-width: 520px) { .sk-reads.two { grid-template-columns:repeat(3, minmax(0,1fr)); } .sk-reads .read .v { font-size:calc(24px * var(--fs, 1)); } }
  .sk-mag { flex:none; width:46px; height:46px; border-radius:50%; display:grid; place-items:center; font:calc(17px * var(--fs, 1))/1 var(--mono); color:#000; background:var(--mc, var(--gold)); box-shadow:0 0 12px color-mix(in srgb, var(--mc, var(--gold)) 50%, transparent); }
  .sk-list .item { min-height:52px; } .sk-list .tx { min-width:0; } .sk-list .tx b { overflow-wrap:anywhere; } .sk-list .tx small { white-space:normal; }
  .sk-r { flex:none; text-align:right; font:calc(14px * var(--fs, 1))/1.2 var(--mono); color:var(--text); max-width:40%; overflow-wrap:anywhere; }
  .sk-r small { display:block; font:600 calc(11px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:var(--label); }
  .sk-st { font:calc(13px * var(--fs, 1)) var(--mono); color:var(--dim); overflow-wrap:anywhere; } .sk-err { color:var(--amber); }
  .sk-empty { color:var(--dim); font-size:calc(13px * var(--fs, 1)); padding:10px 4px; }
  .sk-big { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; min-width:0; }
  .sk-big b { font:calc(46px * var(--fs, 1))/1 var(--mono); color:var(--c); text-shadow:0 0 16px color-mix(in srgb, var(--c) 45%, transparent); }
  .sk-big span { font:700 calc(16px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--text); overflow-wrap:anywhere; min-width:0; }
  .sk-next { border:1px solid color-mix(in srgb, var(--gold) 35%, transparent); border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:4px; min-width:0; }
  .sk-next .nm { font:700 calc(17px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; overflow-wrap:anywhere; }
  .sk-next .ck { font:calc(30px * var(--fs, 1))/1.1 var(--mono); color:var(--gold); }
  .sk-moon { width:64px; height:64px; flex:none; }
  `);
  const ago = s => s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago';
  const upd = ts => ts ? 'Updated ' + ago(Math.max(0, Date.now() / 1000 - ts)) : 'Not updated yet';
  const tm = (ts, tz) => { if (!ts) return '–'; const o = {hour: 'numeric', minute: '2-digit'}; if (tz) o.timeZone = tz;
    try { return new Date(ts * 1000).toLocaleTimeString([], o); } catch (e) { delete o.timeZone; return new Date(ts * 1000).toLocaleTimeString([], o); } };
  const day = (ts, tz, wd) => { const o = wd ? {weekday: 'short', month: 'short', day: 'numeric'} : {month: 'short', day: 'numeric'}; if (tz) o.timeZone = tz;
    try { return new Date(ts * 1000).toLocaleDateString([], o); } catch (e) { delete o.timeZone; return new Date(ts * 1000).toLocaleDateString([], o); } };
  const left = s => { s = Math.max(0, Math.round(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return d ? `${d}d ${h}h ${String(m).padStart(2, '0')}m` : `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };
  const magc = m => m >= 7 ? '#ff3da6' : m >= 6 ? '#ff2a1a' : m >= 5 ? '#ff8c14' : m >= 4 ? '#ffe033' : '#8cff4d';
  const showBtn = (id, key, label, toastOn) => async () => {
    const on = GB.feedsState && GB.feedsState.mode === key;
    if (await GB.feed(on ? {mode: 'off'} : {feed: key, on: true})) { GB.toast(on ? '🎵 Back to the music show' : toastOn); GB.feedsRefresh(); }
  };
  const head = (f, s, key) => { const on = s.mode === key; return on ? 'ON THE WALL' : f.flashing ? 'ALERTING' : f.alert ? 'ALERT ARMED' : 'OFF'; };
  const seg = (el, key, attr, vals, labels, cb) => { el.innerHTML = vals.map((v, i) => `<button class="btn" data-v="${v}">${labels[i]}</button>`).join('');
    el.querySelectorAll('.btn').forEach(b => b.onclick = () => cb(b.dataset.v)); };
  const segOn = (el, v) => el.querySelectorAll('.btn').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));

  // ---------------------------------------------------------------- 🌍 Earthquakes
  GB.panel('feeds', 60, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orange)');
    el.innerHTML = `<div class="ph"><span>Earthquakes</span><span class="r" id="eqR">OFF</span></div>
      <p class="note">A glowing world map of the planet's recent quakes, centred on you. Dots grow and redden with magnitude and fade with age; a new quake sends a ripple and scrolls its size and place.</p>
      <div class="seg"><button class="btn c lg" id="eqShow" style="--c:var(--orange)">Show on the wall</button></div>
      <div class="sub">Smallest quake to show</div><div class="seg" id="eqMag"></div>
      <div class="sub">Map style</div><div class="seg" id="eqView"></div>
      <div class="sub">Alert over music</div><div class="seg" id="eqAl"></div>
      <p class="note">Alert over music: while the music show is on, a big new quake (M4.5 or more, or any quake within about 190 mi / 300 km of you) briefly takes over the wall, then the show comes back.</p>
      <div class="reads sk-reads"><div class="read" style="--c:var(--orange)"><span class="k" id="eqNk">Today</span><span class="v" id="eqN">–</span></div>
        <div class="read" style="--c:var(--red)"><span class="k">Biggest</span><span class="v" id="eqBig">–</span></div>
        <div class="read" style="--c:var(--lav)"><span class="k">Nearest</span><span class="v" id="eqNear">–</span></div></div>
      <div class="sub">Latest quakes</div><div class="list sk-list" id="eqList"><div class="sk-empty">Loading…</div></div>
      <button class="btn ghost sm" id="eqTest">Preview a big quake</button>
      <div class="sk-st" id="eqSt"></div><div class="sk-st sk-err" id="eqErr" hidden></div>
      <p class="note">Data: U.S. Geological Survey. Not a warning system.</p>`;
    $('eqShow').onclick = showBtn('eqShow', 'quakes', 'Earthquakes', '🌍 Earthquakes on the wall');
    seg($('eqMag'), 'quakes', 'min_mag', ['2.5', '4.5', '6'], ['M2.5+', 'M4.5+', 'M6+'], async v => { if (await GB.feed({feed: 'quakes', min_mag: +v})) GB.feedsRefresh(); });
    seg($('eqView'), 'quakes', 'view', ['map', 'globe'], ['Flat map', 'Globe'], async v => { if (await GB.feed({feed: 'quakes', view: v})) GB.feedsRefresh(); });
    seg($('eqAl'), 'quakes', 'alert', ['1', '0'], ['On', 'Off'], async v => { if (await GB.feed({feed: 'quakes', alert: v === '1'})) { GB.toast(v === '1' ? '🌍 Big quakes will flash over the music' : 'Quake alerts off'); GB.feedsRefresh(); } });
    $('eqTest').onclick = async () => { if (await GB.feed({feed: 'quakes', test: true})) { GB.toast('🌍 Pretend M6.4, watch the wall'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('eqList')) return;
    const f = (s.feeds || {}).quakes; if (!f) return;
    const on = s.mode === 'quakes';
    $('eqR').textContent = head(f, s, 'quakes');
    $('eqShow').textContent = on ? 'Stop the quake map' : 'Show on the wall'; $('eqShow').classList.toggle('on', on);
    segOn($('eqMag'), f.min_mag === 6 ? '6' : String(f.min_mag)); segOn($('eqAl'), f.alert ? '1' : '0'); segOn($('eqView'), f.view || 'map');
    $('eqNk').textContent = f.window === 'week' ? 'This week' : 'Today';
    $('eqN').textContent = f.updated ? f.count : '–';
    $('eqBig').innerHTML = f.biggest ? `M${f.biggest.mag.toFixed(1)}<small> ${esc(f.biggest.short)}</small>` : '–';
    $('eqNear').innerHTML = f.nearest ? `${esc(f.nearest.dist)}<small> M${f.nearest.mag.toFixed(1)}</small>` : (f.has_loc ? '–' : '<small>set location</small>');
    const qs = f.quakes || [], k = JSON.stringify(qs.map(q => [q.mag, q.place, q.ago > 3600 ? Math.round(q.ago / 600) : Math.round(q.ago / 60)]));
    if ($('eqList')._k !== k) { $('eqList')._k = k;
      $('eqList').innerHTML = qs.length ? qs.slice(0, 8).map(q => `<div class="item"><span class="sk-mag" style="--mc:${magc(q.mag)}">${q.mag.toFixed(1)}</span>
          <div class="tx"><b>${esc(q.short.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))}</b><small>${esc(q.place)}<br>${ago(q.ago)}${q.depth != null ? ' · ' + q.depth + ' km deep' : ''}${q.tsunami ? ' · tsunami message' : ''}</small></div>
          <div class="sk-r">${esc(q.dist || '')}<small>${q.dist ? 'away' : ''}</small></div></div>`).join('')
        : `<div class="sk-empty">${f.updated ? 'No quakes this size right now.' : f.err ? 'No data yet.' : 'Loading…'}</div>`; }
    $('eqSt').textContent = upd(f.updated) + ' · checks every minute while on the wall';
    const err = f.rate || f.err; $('eqErr').hidden = !err; $('eqErr').textContent = err || '';
  });

  // ---------------------------------------------------------------- 🌌 Aurora
  GB.panel('feeds', 62, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    el.innerHTML = `<div class="ph"><span>Aurora</span><span class="r" id="auR">OFF</span></div>
      <p class="note">Slow aurora curtains that follow the live space weather: the higher the Kp index (0 to 9), the taller, brighter and more colourful they get. A solar flare sends a soft gold flash down the wall.</p>
      <div class="seg"><button class="btn c lg" id="auShow" style="--c:var(--green)">Show on the wall</button></div>
      <div class="sk-big" style="--c:var(--green)"><b id="auKp">–</b><span id="auW">Kp index</span></div>
      <div class="reads sk-reads"><div class="read" style="--c:var(--gold)"><span class="k">Sun X-rays</span><span class="v" id="auX">–</span></div>
        <div class="read" style="--c:var(--lav)"><span class="k">Last flare</span><span class="v" id="auF">–</span></div>
        <div class="read" style="--c:var(--peri)"><span class="k">Kp to see it</span><span class="v" id="auNeed">–</span></div></div>
      <p class="note" id="auSee"></p>
      <div class="seg"><button class="btn ghost sm" id="auTest">Preview a storm</button><button class="btn ghost sm" id="auFl">Preview a flare</button></div>
      <div class="sk-st" id="auSt"></div><div class="sk-st sk-err" id="auErr" hidden></div>
      <p class="note">Data: NOAA Space Weather Prediction Center.</p>`;
    $('auShow').onclick = showBtn('auShow', 'aurora', 'Aurora', '🌌 Aurora on the wall');
    $('auTest').onclick = async () => { if (await GB.feed({feed: 'aurora', on: true, test_kp: [2, 7]})) { GB.toast('🌌 Pretend storm, watch the wall'); GB.feedsRefresh(); } };
    $('auFl').onclick = async () => { if (await GB.feed({feed: 'aurora', on: true, test_flare: 'X1.2'})) { GB.toast('☀️ Pretend X flare'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('auKp')) return;
    const f = (s.feeds || {}).aurora; if (!f) return;
    const on = s.mode === 'aurora';
    $('auR').textContent = on ? 'ON THE WALL' : 'OFF';
    $('auShow').textContent = on ? 'Stop the aurora' : 'Show on the wall'; $('auShow').classList.toggle('on', on);
    $('auKp').textContent = f.kp == null ? '–' : (Math.round(f.kp * 10) / 10).toFixed(1);
    $('auW').textContent = f.kp == null ? 'Kp index' : 'Kp · ' + (f.level.startsWith('G') ? f.level + ' ' : '') + f.words.toLowerCase() + (f.sim ? ' (preview)' : '');
    $('auX').textContent = f.xray || '–';
    $('auF').textContent = (f.flares || []).length ? f.flares[f.flares.length - 1].cls : 'none';
    $('auNeed').textContent = !f.has_loc ? '–' : f.need == null ? 'rare' : f.need < 0.5 ? 'any' : Math.ceil(f.need) + '+';
    $('auSee').textContent = !f.has_loc ? 'Set your location above to see how strong a storm you need to spot the aurora from home.'
      : f.need == null ? 'From your latitude the aurora is very rarely visible, but the wall shows it anyway.'
      : `Rough guide: from your latitude a Kp of about ${Math.ceil(f.need)} or more can put the aurora low on the ${f.south ? 'southern' : 'northern'} horizon on a dark, clear night.`;
    $('auSt').textContent = upd(f.updated) + ' · checks every 5 min while on the wall';
    $('auErr').hidden = !f.err; $('auErr').textContent = f.err || '';
  });

  // ---------------------------------------------------------------- 🚀 Rocket launches
  GB.panel('feeds', 64, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>Rocket launches</span><span class="r" id="lnR">OFF</span></div>
      <p class="note">The next launch's countdown with the rocket steaming on the pad. At T-0 it lifts off the top of the wall on a sparkle trail, then the next one comes up.</p>
      <div class="seg"><button class="btn c lg" id="lnShow" style="--c:var(--gold)">Show on the wall</button></div>
      <div class="sub">Which launches</div><div class="seg" id="lnSc"></div>
      <p class="note" id="lnNear" hidden></p>
      <div class="sub">Alert over music</div><div class="seg" id="lnAl"></div>
      <div class="sk-next" id="lnNext"><div class="sk-empty">Loading…</div></div>
      <div class="sub">Coming up</div><div class="list sk-list" id="lnList"></div>
      <button class="btn ghost sm" id="lnTest">Preview a liftoff</button>
      <div class="sk-st" id="lnSt"></div><div class="sk-st sk-err" id="lnErr" hidden></div>
      <p class="note">Data: The Space Devs Launch Library 2 (free tier). Launch times move a lot; the wall follows the latest.</p>`;
    $('lnShow').onclick = showBtn('lnShow', 'launches', 'Launches', '🚀 Next launch on the wall');
    seg($('lnSc'), 'launches', 'scope', ['all', 'near'], ['Everywhere', 'Near me'], async v => { if (await GB.feed({feed: 'launches', scope: v})) GB.feedsRefresh(); });
    seg($('lnAl'), 'launches', 'alert', ['1', '0'], ['On', 'Off'], async v => { if (await GB.feed({feed: 'launches', alert: v === '1'})) { GB.toast(v === '1' ? '🚀 Liftoffs will play over the music' : 'Liftoff alerts off'); GB.feedsRefresh(); } });
    $('lnTest').onclick = async () => { if (await GB.feed({feed: 'launches', on: true, test: true, secs: 10})) { GB.toast('🚀 Pretend liftoff in 10 s'); GB.feedsRefresh(); } };
    setInterval(() => { const n = $('lnCk'); if (n && n.dataset.net && GB.page === 'feeds') { const l = +n.dataset.net - Date.now() / 1000; n.textContent = l > 0 ? 'T-' + left(l) : 'T-0'; } }, 1000);
  });
  GB.on('feeds', s => {
    if (!$('lnNext')) return;
    const f = (s.feeds || {}).launches; if (!f) return;
    const on = s.mode === 'launches';
    $('lnR').textContent = f.lifting ? 'LIFTOFF!' : head(f, s, 'launches');
    $('lnShow').textContent = on ? 'Stop the launches' : 'Show on the wall'; $('lnShow').classList.toggle('on', on);
    segOn($('lnSc'), f.scope); segOn($('lnAl'), f.alert ? '1' : '0');
    $('lnNear').hidden = f.scope !== 'near';
    $('lnNear').textContent = !f.has_loc ? 'Near me needs your location (set it above).' : `Pads within about 620 mi / 1000 km of ${f.loc_name || 'you'}: ${f.near_count} of the next ${f.total} launches.`;
    const ls = f.launches || [], n = ls[0];
    const k = JSON.stringify([ls.map(l => [l.name, l.net, l.status]), f.updated, f.err]);
    if ($('lnNext')._k !== k) { $('lnNext')._k = k;
      $('lnNext').innerHTML = n ? `<span class="nm">${esc(n.rocket)}${n.test ? ' (preview)' : ''}</span><span class="ck" id="lnCk" data-net="${n.net}">${n.left > 0 ? 'T-' + left(n.left) : 'T-0'}</span>
          <span class="note">${esc(n.mission || n.name)} · ${esc(n.provider)}<br>${esc(n.pad)}, ${esc(n.where)}${n.dist ? ' · ' + esc(n.dist) + ' away' : ''}<br>${esc(day(n.net, undefined, 1))} ${esc(tm(n.net))} · <b>${esc(n.status_name || n.status)}</b></span>`
        : `<div class="sk-empty">${f.scope === 'near' && f.total ? 'No launches near you coming up. Try Everywhere.' : f.updated ? 'No launches listed right now.' : f.err || f.rate ? 'No data yet.' : 'Loading…'}</div>`;
      $('lnList').innerHTML = ls.slice(1, 6).map(l => `<div class="item"><div class="tx"><b>${esc(l.rocket)}</b><small>${esc(l.mission || l.name)} · ${esc(l.where.split(',')[0])}</small></div>
          <div class="sk-r">${esc(day(l.net))}<small>${esc(l.status)}</small></div></div>`).join('') || '<div class="sk-empty">–</div>'; }
    $('lnSt').textContent = upd(f.updated) + (f.next_in != null && f.next_in < 86400 ? ' · next check in ' + Math.max(1, Math.round(f.next_in / 60)) + ' min' : '');
    const err = f.rate || f.err; $('lnErr').hidden = !err; $('lnErr').textContent = err || '';
  });

  // ---------------------------------------------------------------- 🌕 Moon & sun
  function moonSvg(illum, waxing, south) {
    // a little phase drawing: lit side right when waxing (left in the southern hemisphere)
    const k = illum / 100, r = 28, cx = 32, cy = 32, right = waxing !== south;
    const ex = Math.abs(1 - 2 * k) * r, sweepOuter = right ? 1 : 0, sweepInner = (k > 0.5) === right ? 1 : 0;
    const d = `M${cx} ${cy - r} A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r} A${ex} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
    return `<svg class="sk-moon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="#1a1f33"/><path d="${d}" fill="#fff3d6"/></svg>`;
  }
  GB.panel('feeds', 66, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--peri)');
    el.innerHTML = `<div class="ph"><span>Moon & sun</span><span class="r" id="mnR">OFF</span></div>
      <p class="note">Tonight's moon at its real phase, glowing among drifting stars, with a warm low sun at golden hour. Worked out on this computer, no internet needed.</p>
      <div class="seg"><button class="btn c lg" id="mnShow" style="--c:var(--peri)">Show on the wall</button></div>
      <div class="wx-top" style="display:flex;align-items:center;gap:14px;min-width:0"><span id="mnPic"></span><div class="sk-big" style="--c:var(--peri)"><b id="mnPct">–</b><span id="mnPh">–</span></div></div>
      <div class="reads sk-reads two"><div class="read" style="--c:var(--peri)"><span class="k">Full moon</span><span class="v" id="mnFull">–</span></div>
        <div class="read" style="--c:var(--lav)"><span class="k">New moon</span><span class="v" id="mnNew">–</span></div>
        <div class="read" style="--c:var(--gold)"><span class="k">Golden hour</span><span class="v" id="mnGold">–</span></div>
        <div class="read" style="--c:var(--orange)"><span class="k">Sunrise</span><span class="v" id="mnRise">–</span></div>
        <div class="read" style="--c:var(--orange)"><span class="k">Sunset</span><span class="v" id="mnSet">–</span></div>
        <div class="read" style="--c:var(--cyan)"><span class="k">Sun now</span><span class="v" id="mnEl">–</span></div></div>
      <p class="note" id="mnLoc"></p>
      <div class="sub">Clock on the wall</div><div class="seg" id="mnCk"></div>
      <button class="btn ghost sm" id="mnTest">Preview every phase</button>`;
    $('mnShow').onclick = showBtn('mnShow', 'moon', 'Moon', '🌕 The moon on the wall');
    seg($('mnCk'), 'moon', 'clock', ['auto', '12', '24'], ['Auto', '12 hour', '24 hour'], async v => { if (await GB.feed({feed: 'moon', clock: v})) GB.feedsRefresh(); });
    $('mnTest').onclick = async () => { if (await GB.feed({feed: 'moon', on: true, test_phases: true})) { GB.toast('🌗 A whole month in 24 seconds'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('mnPct')) return;
    const f = (s.feeds || {}).moon; if (!f) return;
    const on = s.mode === 'moon', tz = f.tz || undefined;
    $('mnR').textContent = on ? 'ON THE WALL' : f.full ? 'FULL MOON' : 'OFF';
    $('mnShow').textContent = on ? 'Stop the moon' : 'Show on the wall'; $('mnShow').classList.toggle('on', on);
    $('mnPic').innerHTML = moonSvg(f.illum, f.waxing, f.south);
    $('mnPct').textContent = f.illum + '%'; $('mnPh').textContent = f.phase + (f.sim ? ' (preview)' : '');
    $('mnFull').innerHTML = f.full ? 'Tonight' : esc(day(f.next_full, tz)); $('mnNew').innerHTML = esc(day(f.next_new, tz));
    $('mnRise').textContent = f.has_loc ? (f.polar === 'day' ? 'up all day' : f.polar === 'night' ? 'none' : tm(f.sunrise, tz)) : '–';
    $('mnSet').textContent = f.has_loc ? (f.polar ? '–' : tm(f.sunset, tz)) : '–';
    $('mnGold').textContent = !f.has_loc ? '–' : f.golden ? 'now' : tm(Date.now() / 1000 < (f.gold_am || 0) ? f.sunrise : f.gold_pm, tz);
    $('mnEl').textContent = f.has_loc && f.sun_elev != null ? Math.round(f.sun_elev) + '°' : '–';
    $('mnLoc').textContent = f.has_loc ? `Sun times for ${f.loc_name || 'your location'}${f.tz ? ' (' + f.tz.replace(/_/g, ' ') + ' time)' : ''}.${f.south ? ' Southern hemisphere: the moon is drawn the way you see it.' : ''}`
      : 'Set your location above for sunrise, sunset and golden hour.';
    segOn($('mnCk'), f.clock || 'auto');
  });
})();

/* 🌐🌋🔥⛈️ Globe, Volcanoes, Wildfires and World warnings panels (LIVE page). */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .wl-list .item { min-height:50px; } .wl-list .tx { min-width:0; } .wl-list .tx b { overflow-wrap:anywhere; white-space:normal; } .wl-list .tx small { white-space:normal; }
  .wl-dot { flex:none; width:14px; height:14px; border-radius:50%; background:var(--dc, var(--gold)); box-shadow:0 0 10px var(--dc, var(--gold)); }
  .wl-st { font:calc(13px * var(--fs, 1)) var(--mono); color:var(--dim); overflow-wrap:anywhere; } .wl-err { color:var(--amber); }
  .wl-empty { color:var(--dim); font-size:calc(13px * var(--fs, 1)); padding:8px 4px; }
  .wl-row { display:flex; gap:8px; min-width:0; } .wl-row input, .wl-row select { flex:1; min-width:0; }
  .wl-reads { grid-template-columns:repeat(3, minmax(0,1fr)); } .wl-reads.two { grid-template-columns:repeat(2, minmax(0,1fr)); } @media (min-width: 520px) { .wl-reads.two { grid-template-columns:repeat(3, minmax(0,1fr)); } } .wl-reads .read .v { font-size:calc(22px * var(--fs, 1)); white-space:normal; overflow-wrap:anywhere; }
  .wl-link { color:var(--cyan); font-weight:700; }
  `);
  const ago = s => s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago';
  const upd = ts => ts ? 'Updated ' + ago(Math.max(0, Date.now() / 1000 - ts)) : 'Not updated yet';
  const LV = ['var(--green)', 'var(--orange)', 'var(--red)'], LVN = ['green', 'orange', 'red'];
  const KIND = {EQ: ['Quakes', 'var(--gold)'], TC: ['Cyclones', 'var(--cyan)'], VO: ['Volcanoes', 'var(--red)'], WF: ['Fires', 'var(--orange)'], FL: ['Floods', 'var(--amber)'], LA: ['Launches', 'var(--gold)'], HS: ['Hotspots', 'var(--orange)'], WARN: ['Warnings', 'var(--amber)']};
  const seg = (el, vals, labels, cb) => { el.innerHTML = vals.map((v, i) => `<button class="btn" data-v="${v}">${labels[i]}</button>`).join(''); el.querySelectorAll('.btn').forEach(b => b.onclick = () => cb(b.dataset.v)); };
  const segOn = (el, v) => el.querySelectorAll('.btn').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  const show = (key, toastOn) => async () => { const on = GB.feedsState && GB.feedsState.mode === key;
    if (await GB.feed(on ? {mode: 'off'} : {feed: key, on: true})) { GB.toast(on ? '🎵 Back to the music show' : toastOn); GB.feedsRefresh(); } };
  const showState = (s, key, btn, r, stopTxt) => { const on = s.mode === key; $(r).textContent = on ? 'ON THE WALL' : 'OFF'; $(btn).textContent = on ? stopTxt : 'Show on the wall'; $(btn).classList.toggle('on', on); };

  // ---------------------------------------------------------------- 🌐 Globe
  GB.panel('feeds', 68, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Globe</span><span class="r" id="glR">OFF</span></div>
      <p class="note">A slowly spinning Earth with what is happening on it right now: quakes, volcanoes, wildfires, cyclones, floods, launch day sparkles and the aurora at the poles. Names scroll by as they come round.</p>
      <div class="seg"><button class="btn c lg" id="glShow" style="--c:var(--cyan)">Show on the wall</button></div>
      <div class="sub">Spin</div><div class="seg" id="glSpin"></div>
      <div class="sub">Day and night</div><div class="seg" id="glNight"></div>
      <div class="reads wl-reads two" id="glReads"></div>
      <div class="sub">On the globe now</div><div class="list wl-list" id="glList"><div class="wl-empty">Loading…</div></div>
      <div class="wl-st" id="glSt"></div><div class="wl-st wl-err" id="glErr" hidden></div>
      <p class="note">Data: USGS, Global Disaster Alert and Coordination System (GDACS), NOAA SWPC, The Space Devs.</p>`;
    $('glShow').onclick = show('globe', '🌐 The globe on the wall');
    seg($('glSpin'), ['spin', 'home'], ['Keep spinning', 'Stop on my home'], async v => { if (await GB.feed({feed: 'globe', spin: v})) GB.feedsRefresh(); });
    seg($('glNight'), ['1', '0'], ['Show night side', 'Always daylight'], async v => { if (await GB.feed({feed: 'globe', night: v === '1'})) GB.feedsRefresh(); });
  });
  GB.on('feeds', s => {
    if (!$('glList')) return;
    const f = (s.feeds || {}).globe; if (!f) return;
    showState(s, 'globe', 'glShow', 'glR', 'Stop the globe');
    segOn($('glSpin'), f.spin); segOn($('glNight'), f.night ? '1' : '0');
    const c = f.counts || {};
    $('glReads').innerHTML = ['EQ', 'TC', 'VO', 'WF', 'FL', 'LA'].map(k => `<div class="read" style="--c:${KIND[k][1]}"><span class="k">${KIND[k][0]}</span><span class="v">${c[k] || 0}</span></div>`).join('');
    const top = f.top || [];
    $('glList').innerHTML = top.length ? top.map(e => `<div class="item"><span class="wl-dot" style="--dc:${(KIND[e.kind] || ['', 'var(--gold)'])[1]}"></span><div class="tx"><b>${esc(e.label)}</b><small>${(KIND[e.kind] || [e.kind])[0]} · ${Math.abs(e.lat)}°${e.lat >= 0 ? 'N' : 'S'} ${Math.abs(e.lon)}°${e.lon >= 0 ? 'E' : 'W'}</small></div></div>`).join('')
      : '<div class="wl-empty">Nothing big happening right now.</div>';
    $('glSt').textContent = 'World events: ' + upd(f.gdacs_updated).toLowerCase();
    $('glErr').hidden = !f.gdacs_err; $('glErr').textContent = f.gdacs_err || '';
  });

  // ---------------------------------------------------------------- 🌋 Volcanoes
  GB.panel('feeds', 70, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)');
    el.innerHTML = `<div class="ph"><span>Volcanoes</span><span class="r" id="voR">OFF</span></div>
      <p class="note">An erupting volcano on the wall (lava glow, ash plume, sparks) for the world's recent notable eruptions, with the volcano's name and country.</p>
      <div class="seg"><button class="btn c lg" id="voShow" style="--c:var(--red)">Show on the wall</button></div>
      <div class="sub">Recent eruptions</div><div class="list wl-list" id="voList"><div class="wl-empty">Loading…</div></div>
      <button class="btn ghost sm" id="voTest">Preview an eruption</button>
      <div class="wl-st" id="voSt"></div><div class="wl-st wl-err" id="voErr" hidden></div>
      <p class="note">Data: Global Disaster Alert and Coordination System, GDACS. Only eruptions GDACS reports are shown.</p>`;
    $('voShow').onclick = show('volcano', '🌋 Volcanoes on the wall');
    $('voTest').onclick = async () => { if (await GB.feed({feed: 'volcano', on: true, test: true})) { GB.toast('🌋 Pretend eruption, watch the wall'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('voList')) return;
    const f = (s.feeds || {}).volcano; if (!f) return;
    showState(s, 'volcano', 'voShow', 'voR', 'Stop the volcano');
    const es = f.eruptions || [];
    $('voList').innerHTML = es.length ? es.map(e => `<div class="item"><span class="wl-dot" style="--dc:${LV[e.level] || LV[0]}"></span><div class="tx"><b>${esc(e.name)}${e.test ? ' (preview)' : ''}</b><small>${esc(e.country)} · ${LVN[e.level] || 'green'} alert${e.updated ? ' · ' + ago(Date.now() / 1000 - e.updated) : ''}${e.dist ? ' · ' + esc(e.dist) + ' away' : ''}</small></div></div>`).join('')
      : `<div class="wl-empty">${f.updated ? 'No notable eruptions in the last three weeks.' : f.err ? 'No data yet.' : 'Loading…'}</div>`;
    $('voSt').textContent = upd(f.updated);
    $('voErr').hidden = !f.err; $('voErr').textContent = f.err || '';
  });

  // ---------------------------------------------------------------- 🔥 Wildfires
  GB.panel('feeds', 72, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orange)');
    el.innerHTML = `<div class="ph"><span>Wildfires</span><span class="r" id="wfR">OFF</span></div>
      <p class="note">Satellite fire hotspots around your home as flickering embers, with how far the nearest one is. Without a key you still see the big fires GDACS reports.</p>
      <div class="seg"><button class="btn c lg" id="wfShow" style="--c:var(--orange)">Show on the wall</button></div>
      <label class="field">Your NASA FIRMS map key (free, about a minute to get)
        <div class="wl-row"><input type="password" id="wfKey" placeholder="Paste your MAP_KEY" autocomplete="off" spellcheck="false"><button class="btn c" id="wfSave" style="--c:var(--orange)">Save</button></div></label>
      <p class="note" id="wfKeySt"></p>
      <p class="note">No key yet? <a class="wl-link" id="wfGet" href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" target="_blank" rel="noopener">Get a free key from NASA</a> (just an email address). The key stays on this GlowBop.</p>
      <div class="sub">How far around you</div><div class="seg" id="wfRad"></div>
      <div class="reads wl-reads"><div class="read" style="--c:var(--orange)"><span class="k">Hotspots</span><span class="v" id="wfN">–</span></div>
        <div class="read" style="--c:var(--gold)"><span class="k">Nearest</span><span class="v" id="wfNear">–</span></div>
        <div class="read" style="--c:var(--red)"><span class="k">Big fires</span><span class="v" id="wfBig">–</span></div></div>
      <div class="sub">Big fires (GDACS)</div><div class="list wl-list" id="wfList"></div>
      <button class="btn ghost sm" id="wfTest">Preview fires near me</button>
      <div class="wl-st" id="wfSt"></div><div class="wl-st wl-err" id="wfErr" hidden></div>
      <p class="note" id="wfCredit">Data: NASA FIRMS and GDACS. Not a warning system: follow your local fire service.</p>`;
    $('wfShow').onclick = show('fires', '🔥 Wildfires on the wall');
    $('wfSave').onclick = async () => { const k = $('wfKey').value.trim();
      if (await GB.feed({feed: 'fires', map_key: k})) { $('wfKey').value = ''; GB.toast(k ? '🔑 Key saved' : 'Key removed'); GB.feedsRefresh(800); } };
    $('wfKey').addEventListener('keydown', e => { if (e.key === 'Enter') $('wfSave').click(); });
    seg($('wfRad'), ['100', '250', '500'], ['100 km', '250 km', '500 km'], async v => { if (await GB.feed({feed: 'fires', radius: +v})) GB.feedsRefresh(); });
    $('wfTest').onclick = async () => { if (await GB.feed({feed: 'fires', on: true, test: true})) { GB.toast('🔥 Pretend fires, watch the wall'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('wfList')) return;
    const f = (s.feeds || {}).fires; if (!f) return;
    showState(s, 'fires', 'wfShow', 'wfR', 'Stop the fire map');
    segOn($('wfRad'), f.radius);
    $('wfRad').querySelectorAll('.btn').forEach(b => b.title = Math.round(b.dataset.v * 0.621) + ' miles');
    $('wfKeySt').textContent = f.has_key ? `Key saved (ends in ${f.key_hint}). Hotspots from the last 24 hours, checked every 30 minutes.` : 'No key saved: showing the big fires only.';
    $('wfSave').textContent = f.has_key && !$('wfKey').value ? 'Remove' : 'Save';
    $('wfN').textContent = f.has_key || f.test ? f.count : '–';
    $('wfNear').innerHTML = f.nearest ? `${esc(f.nearest.dist)}<small> ${esc(f.nearest.dir)}</small>` : '–';
    $('wfBig').textContent = (f.big || []).length;
    $('wfList').innerHTML = (f.big || []).length ? f.big.map(e => `<div class="item"><span class="wl-dot" style="--dc:${LV[e.level] || LV[0]}"></span><div class="tx"><b>${esc(e.name)}</b><small>${esc(e.country)} · ${LVN[e.level] || 'green'} alert</small></div><div class="sk-r">${esc(e.dist)}<small>away</small></div></div>`).join('')
      : `<div class="wl-empty">${f.has_loc ? 'No big fires reported.' : 'Set your location above.'}</div>`;
    $('wfSt').textContent = f.has_key ? upd(f.updated) : 'World fires: ' + upd(f.gdacs_updated).toLowerCase();
    $('wfErr').hidden = !f.err; $('wfErr').textContent = f.err || '';
  });

  // ---------------------------------------------------------------- ⛈️🌐 World warnings (storm watch outside the US)
  GB.panel('feeds', 26, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)');
    el.innerHTML = `<div class="ph"><span>Storm watch worldwide</span><span class="r" id="wwR">–</span></div>
      <p class="note" id="wwNote"></p>
      <div id="wwBody">
        <div class="sub">Warnings from</div><div class="seg" id="wwSrc"></div>
        <div id="wwCap" hidden><label class="field">Official CAP alert feed URL
          <div class="wl-row"><input type="url" id="wwUrl" placeholder="https://… (CAP / Atom / RSS)" autocomplete="off" spellcheck="false"><button class="btn c" id="wwUrlGo" style="--c:var(--red)">Save</button></div></label>
          <p class="note">Most national weather services publish one. Find yours in the <a class="wl-link" href="https://alerting.wmo.int/" target="_blank" rel="noopener">WMO Register of Alerting Authorities</a>.</p></div>
        <div id="wwArea" hidden><label class="field">Your warning region
          <select id="wwSel"></select></label></div>
        <div class="wl-st" id="wwSt"></div><div class="wl-st wl-err" id="wwErr" hidden></div>
      </div>`;
    seg($('wwSrc'), ['auto', 'gdacs', 'custom'], ['Auto', 'Cyclones', 'CAP feed'], async v => { if (await GB.feed({feed: 'worldwx', world_src: v})) GB.feedsRefresh(); });
    $('wwUrlGo').onclick = async () => { const u = $('wwUrl').value.trim(); if (u && !/^https?:\/\//.test(u)) return GB.toast('That needs to start with https://');
      if (await GB.feed({feed: 'worldwx', cap_url: u})) { GB.toast(u ? 'Feed saved' : 'Feed removed'); GB.feedsRefresh(800); } };
    $('wwSel').onchange = async () => { if (await GB.feed({feed: 'worldwx', cap_area: $('wwSel').value})) { GB.toast($('wwSel').value ? '📍 Region set' : 'Matching your region by name'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('wwSrc')) return;
    const f = (s.feeds || {}).worldwx, el = $('wwSrc').closest('.panel'); if (!f) { el.hidden = true; return; }
    el.hidden = !!f.us || !(s.loc && s.loc.name);
    $('wwR').textContent = !f.storm_on ? 'STORM WATCH OFF' : f.running ? (f.matched ? f.matched + ' FOR YOU' : 'WATCHING') : 'WAITING';
    $('wwNote').textContent = (f.meteoalarm ? 'Outside the US, storm watch uses GDACS for tropical cyclones and floods near you, plus the official MeteoAlarm warnings for your country.'
      : 'Outside the US, storm watch uses GDACS for tropical cyclones and floods near you. Add your national weather service CAP feed for official local warnings.') + (f.storm_on ? '' : ' Turn storm watch on above.');
    segOn($('wwSrc'), f.world_src);
    $('wwCap').hidden = f.world_src !== 'custom';
    if (document.activeElement !== $('wwUrl') && !$('wwUrl').value && f.cap_url) $('wwUrl').value = f.cap_url;
    const ar = f.areas || [], k = JSON.stringify([ar, f.cap_area]);
    $('wwArea').hidden = !ar.length || f.world_src === 'gdacs';
    if ($('wwSel')._k !== k) { $('wwSel')._k = k;
      $('wwSel').innerHTML = '<option value="">Match by my location name</option>' + ar.map(a => `<option${a === f.cap_area ? ' selected' : ''}>${esc(a)}</option>`).join(''); }
    $('wwSt').textContent = f.source ? 'Sources: ' + f.source : (f.storm_on ? 'Starting…' : '');
    $('wwErr').hidden = !f.err; $('wwErr').textContent = f.err || '';
  });
})();
