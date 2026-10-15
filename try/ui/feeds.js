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
  const PICK = [['countdown', '🎉', 'Countdown', 'var(--gold)', 'Countdown'], ['weather', '🌦️', 'Weather', 'var(--cyan)', 'Weather'],
                ['storm', '🌀', 'Storm watch', 'var(--red)', 'Storm watch'], ['overhead', '✈️', 'Overhead', 'var(--lav)', 'Overhead now']];   // golf + NASCAR live on SPORTS
  function panelFor(title) { return [...document.querySelectorAll('#pg-feeds > .panel')].find(p => { const h = p.querySelector('.ph span'); return h && h.textContent.trim().toLowerCase() === title.toLowerCase(); }); }
  GB.panel('feeds', 1, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    el.innerHTML = `<div class="ph"><span>Pick a live feed</span><span class="r">tap = on the wall</span></div><div class="tiles" id="fdPick"></div>
      <p class="note">Tap again to turn it off. Settings for each one are further down this page.</p>`;
    PICK.forEach(([k, em, label, c, title]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${em}</span>${label}`;
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
      <p class="note">Things from the outside world, live on your lights. Countdowns, weather and what's flying overhead take over the wall while they're on. Golf and NASCAR are on the SPORTS page. Storm watch runs on top of the music show and only flashes when something happens.</p>
      <label class="field">Your location (for weather, storms and overhead)
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
