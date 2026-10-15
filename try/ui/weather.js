/* 🌦️ Weather + ⛈️ Storm watch panels (LIVE page). Weather takes over the wall; storm watch runs on top of the music show. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .wx-top { display:flex; align-items:center; gap:14px; min-width:0; }
  .wx-em { font-size:calc(46px * var(--fs, 1)); line-height:1; flex:none; }
  .wx-temp { font:calc(58px * var(--fs, 1))/1 var(--mono); color:var(--cyan); flex:none; text-shadow:0 0 18px color-mix(in srgb, var(--cyan) 45%, transparent); }
  .wx-cond { min-width:0; } .wx-cond b { display:block; font:700 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--text); line-height:1.15; overflow-wrap:anywhere; }
  .wx-cond small { display:block; color:var(--dim); font-size:calc(13px * var(--fs, 1)); }
  .wx-hrs { display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:6px; }
  .wx-hr { background:var(--dark2); border-radius:10px; padding:6px 2px; text-align:center; min-width:0; }
  .wx-hr i { display:block; font-style:normal; font:600 calc(12px * var(--fs, 1)) var(--cond); color:var(--label); letter-spacing:1px; }
  .wx-hr span { display:block; font-size:calc(20px * var(--fs, 1)); line-height:1.3; } .wx-hr b { display:block; font:calc(18px * var(--fs, 1)) var(--mono); color:var(--text); }
  .wx-hr em { display:block; font-style:normal; font-size:calc(11px * var(--fs, 1)); color:var(--cyan); min-height:14px; }
  .wx-err { color:var(--red); } .wx-loc { color:var(--lav); font:600 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .st-al { box-shadow:inset 4px 0 0 var(--stc, var(--amber)); padding-left:12px; }
  .st-al .tx b { color:var(--stc, var(--amber)); text-transform:uppercase; font-family:var(--cond); letter-spacing:1px; }
  .st-al .tx small { white-space:normal; }
  .st-none { color:var(--dim); font-size:calc(14px * var(--fs, 1)); padding:6px 0; }
  .st-dist { font:calc(20px * var(--fs, 1)) var(--mono); color:var(--text); flex:none; text-align:right; } .st-dist small { display:block; font:calc(11px * var(--fs, 1)) var(--cond); color:var(--label); letter-spacing:1px; }
  @media (max-width: 520px) { .wx-temp { font-size:calc(46px * var(--fs, 1)); } .wx-em { font-size:calc(38px * var(--fs, 1)); } .wx-hrs { gap:4px; } .wx-hr span { font-size:calc(17px * var(--fs, 1)); } .wx-hr b { font-size:calc(15px * var(--fs, 1)); } }
  `);
  const EM = {clear: ['☀️', '🌙'], partly: ['⛅', '☁️'], cloudy: ['☁️', '☁️'], rain: ['🌧️', '🌧️'], storm: ['⛈️', '⛈️'], snow: ['🌨️', '🌨️'], fog: ['🌫️', '🌫️']};
  const em = (k, day) => (EM[k] || EM.clear)[day === false ? 1 : 0];
  const hm = t => t ? new Date(t * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : '';
  const hr = t => new Date(t * 1000).toLocaleTimeString([], {hour: 'numeric'}).replace(/\s?([AP])M/i, (m, a) => a.toLowerCase());
  const when = s => { const d = new Date(s); if (isNaN(d)) return ''; const today = d.toDateString() === new Date().toDateString();
    return (today ? '' : d.toLocaleDateString(undefined, {weekday: 'short'}) + ' ') + d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}); };
  const LV = {warning: 'var(--red)', watch: 'var(--orange)', advisory: 'var(--gold)', statement: 'var(--peri)'};

  // ---------------------------------------------------------------- Weather
  GB.panel('feeds', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Weather</span><span class="r" id="wxR">OFF</span></div>
      <div class="wx-loc" id="wxLoc">–</div>
      <div class="wx-top"><span class="wx-em" id="wxEm">🌡️</span><span class="wx-temp" id="wxT">--</span>
        <div class="wx-cond"><b id="wxC">Waiting for the weather</b><small id="wxFeel"></small></div></div>
      <div class="reads">
        <div class="read sm"><span class="k" id="wxHiK">High</span><span class="v mono" id="wxHi" style="--c:var(--orange)">–</span></div>
        <div class="read sm"><span class="k" id="wxLoK">Low</span><span class="v mono" id="wxLo" style="--c:var(--cyan)">–</span></div>
        <div class="read sm"><span class="k">Wind</span><span class="v mono" id="wxW" style="--c:var(--lav)">–</span></div>
        <div class="read sm"><span class="k">Humidity</span><span class="v mono" id="wxH" style="--c:var(--peri)">–</span></div>
      </div>
      <div class="sub">Next hours</div><div class="wx-hrs" id="wxHrs"></div>
      <button class="btn c lg wide" id="wxShow" style="--c:var(--cyan)">Show on the wall</button>
      <div class="sub">Units</div>
      <div class="seg" id="wxU"><button class="btn" data-u="auto">Auto</button><button class="btn" data-u="F">°F</button><button class="btn" data-u="C">°C</button></div>
      <p class="note" id="wxUp"></p><p class="note wx-err" id="wxErr" hidden></p>`;
    $('wxShow').onclick = async () => {
      const on = GB.feedsState && GB.feedsState.mode === 'weather';
      if (await GB.feed(on ? {mode: 'off'} : {feed: 'weather', on: true})) { GB.toast(on ? '🎵 Back to the music show' : '🌦️ Weather on the wall'); GB.feedsRefresh(); }
    };
    el.querySelectorAll('#wxU [data-u]').forEach(b => b.onclick = async () => { if (await GB.feed({feed: 'weather', units: b.dataset.u})) GB.feedsRefresh(); });
  });
  GB.on('feeds', s => {
    if (!$('wxT')) return;
    const f = (s.feeds || {}).weather; if (!f) return;
    const on = s.mode === 'weather', u = f.unit === 'C' ? '°C' : '°F';
    $('wxR').textContent = on ? 'ON THE WALL' : 'OFF';
    $('wxShow').textContent = on ? 'Stop the weather' : 'Show on the wall'; $('wxShow').classList.toggle('on', on);
    $('wxLoc').textContent = f.has_loc ? '📍 ' + (f.loc || 'Your location') : 'Set your location above first';
    const c = f.cur;
    $('wxEm').textContent = c ? em(c.kind, c.day) : '🌡️';
    $('wxT').textContent = c && c.temp != null ? c.temp + '°' : '--';
    $('wxC').textContent = c ? c.cond : (f.has_loc ? (f.error ? 'No weather yet' : 'Getting the weather…') : 'No location yet');
    $('wxFeel').textContent = c && c.feels != null ? 'Feels like ' + c.feels + u : '';
    const t = f.today;
    $('wxHiK').textContent = t ? (t.hi_label === 'Tomorrow' ? 'Tomorrow high' : 'Today high') : 'High';
    $('wxLoK').textContent = t ? 'Tonight low' : 'Low';
    $('wxHi').textContent = t && t.hi != null ? t.hi + '°' : '–';
    $('wxLo').textContent = t && t.lo != null ? t.lo + '°' : '–';
    $('wxW').innerHTML = c && c.wind != null ? `${c.wind}<small> ${esc(c.wind_unit)} ${esc(c.wind_dir || '')}</small>` : '–';
    $('wxH').textContent = c && c.hum != null ? c.hum + '%' : '–';
    const hrs = (f.hours || []).slice(0, 6), key = JSON.stringify(hrs);
    if ($('wxHrs')._k !== key) {
      $('wxHrs')._k = key;
      $('wxHrs').innerHTML = hrs.length ? hrs.map(h => `<div class="wx-hr"><i>${esc(hr(h.t))}</i><span>${em(h.kind, h.day)}</span><b>${h.temp == null ? '–' : h.temp + '°'}</b><em>${h.pop >= 20 ? '💧' + h.pop + '%' : ''}</em></div>`).join('')
        : '<div class="note" style="grid-column:1/-1">The next few hours show up here.</div>';
    }
    document.querySelectorAll('#wxU [data-u]').forEach(b => b.classList.toggle('on', b.dataset.u === f.units));
    $('wxUp').textContent = f.updated ? `Updated ${hm(f.updated)}${f.source ? ' · ' + f.source : ''} · checks every 10 min` : (f.has_loc ? 'Checks the weather every 10 minutes.' : '');
    $('wxErr').hidden = !f.error; $('wxErr').textContent = f.error || '';
  });

  // ---------------------------------------------------------------- Storm watch
  GB.panel('feeds', 25, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)');
    el.innerHTML = `<div class="ph"><span>Storm watch</span><span class="r" id="stR">OFF</span></div>
      <p class="note">Flashes the wall over the music when the National Weather Service puts out a new warning, watch or advisory for your spot. Warnings keep a red edge glowing until they end.</p>
      <div class="seg" id="stSw"><button class="btn" data-on="1">On</button><button class="btn" data-on="0">Off</button></div>
      <div class="sub">Active alerts</div><div class="list" id="stAl"></div>
      <div class="sub">Named storms</div><div class="list" id="stSt"></div>
      <button class="btn ghost sm" id="stTest">Test alert</button>
      <p class="note" id="stUp"></p><p class="note wx-err" id="stErr" hidden></p>
      <p class="note">Not an official warning system. Always follow NWS alerts and local officials.</p>`;
    el.querySelectorAll('#stSw [data-on]').forEach(b => b.onclick = async () => {
      const on = b.dataset.on === '1';
      if (await GB.feed({feed: 'storm', on})) { GB.toast(on ? '⛈️ Storm watch is on' : 'Storm watch is off'); GB.feedsRefresh(); }
    });
    $('stTest').onclick = async () => {
      const f = ((GB.feedsState || {}).feeds || {}).storm || {};
      if (f.alerting) { if (await GB.feed({feed: 'storm', stop: true})) { GB.toast('Alert cleared from the wall'); GB.feedsRefresh(); } return; }
      if (await GB.feed({feed: 'storm', test: true})) { GB.toast('⚠️ Test alert on the wall. Tap Stop to end it'); GB.feedsRefresh(); } };
  });
  GB.on('feeds', s => {
    if (!$('stAl')) return;
    const f = (s.feeds || {}).storm; if (!f) return;
    const on = !!f.enabled;
    if (f.alerting) GB.lbl($('stTest'), 'stop', 'Stop the alert'); else $('stTest').textContent = 'Test alert'; $('stTest').classList.toggle('on', !!f.alerting);
    $('stR').textContent = f.alerting ? 'ALERTING' : on ? (f.warning ? 'WARNING ACTIVE' : 'WATCHING') : 'OFF';
    document.querySelectorAll('#stSw [data-on]').forEach(b => b.classList.toggle('on', (b.dataset.on === '1') === on));
    const al = f.alerts || [], ak = JSON.stringify([on, f.has_loc, f.us, al]);
    if ($('stAl')._k !== ak) {
      $('stAl')._k = ak;
      $('stAl').innerHTML = !f.has_loc ? '<div class="st-none">Set your location above first.</div>'
        : !on ? '<div class="st-none">Turn storm watch on to check for alerts.</div>'
        : !f.us ? '<div class="st-none">Weather alerts work for US locations.</div>'
        : !al.length ? '<div class="st-none">✅ No alerts for your area right now.</div>'
        : al.map(a => `<div class="item st-al" style="--stc:${LV[a.level] || 'var(--amber)'}"><div class="tx"><b>${esc(a.event)}</b><small>${esc(a.headline)}</small>${a.expires ? `<small>Until ${esc(when(a.expires))}</small>` : ''}</div></div>`).join('');
    }
    const st = f.storms || [], sk = JSON.stringify([on, st]);
    if ($('stSt')._k !== sk) {
      $('stSt')._k = sk;
      $('stSt').innerHTML = !on ? '<div class="st-none">Shows up when storm watch is on.</div>'
        : !st.length ? '<div class="st-none">No named storms right now.</div>'
        : st.map(x => `<div class="item"><span style="font-size:calc(24px * var(--fs, 1))">🌀</span><div class="tx"><b>${esc(x.kind)} ${esc(x.name)}</b><small>${x.wind_mph} mph winds</small></div>
            <div class="st-dist">${Number(x.dist_mi).toLocaleString()}<small>MI ${esc(x.dir)}</small></div></div>`).join('');
    }
    $('stUp').textContent = on && f.updated ? `Checked ${hm(f.updated)} · every 2 min` : on && f.nhc_updated ? `Storms checked ${hm(f.nhc_updated)}` : '';
    $('stErr').hidden = !f.error; $('stErr').textContent = f.error || '';
  });
})();
