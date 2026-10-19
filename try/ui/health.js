/* 📶 WI-FI HEALTH (Oct 19, Graham: "a network health thing, like how things are going, so people can see"; "next to the name of each
   panel on the live wall, a health score or a health bar"; "scan all the Wi-Fi signals and see what the best band is").
   - a little health bar after every light's name on the live wall (core.js drawSetup asks GB.healthOf)
   - a Wi-Fi badge in the top bar on every page: the whole setup's score; tap it to open the health panel
   - the health panel on LIGHTS: every light's score, answer time and its last 10 minutes as a strip; Run the Wi-Fi test;
     Scan Wi-Fi neighbours (which channel is quietest here)
   Engine: status.lights_health (every check-in, every 15 s), GET /api/lights/health, POST /api/lights/nettest, GET /api/lights/wifiscan */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const COL = {good: '#3ce08a', slow: '#ffc23d', bad: '#ff4d6d', off: '#ff4d6d'};
  const WORD = {good: 'Good', slow: 'Slow', bad: 'Dropping', off: 'Offline'};
  GB.css(`
  #hlBadge { flex:0 0 auto; display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:0 12px; border:0; border-radius:999px; cursor:pointer;
    background:color-mix(in srgb, var(--k) 16%, #0b0814); color:var(--k); box-shadow:inset 0 0 0 1.5px var(--k); font:800 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; }
  #hlBadge svg { width:18px; height:18px; fill:currentColor; }
  #hlBadge[hidden] { display:none; }
  .hl-sum { display:flex; align-items:center; gap:12px; margin:4px 0 10px; }
  .hl-big { font:800 calc(34px * var(--fs, 1))/1 var(--cond); color:var(--k); }
  .hl-sum span { font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:var(--text); }
  .hl-list { display:grid; gap:8px; }
  .hl-row { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:4px 10px; align-items:center; padding:9px 12px; border-radius:14px;
    background:color-mix(in srgb, var(--k) 9%, #0b0814); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--k) 40%, transparent); }
  .hl-row b { font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:#fff; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hl-row b small { color:color-mix(in srgb, var(--k) 70%, #fff); font-weight:700; margin-left:6px; }
  .hl-row .sc { font:800 calc(18px * var(--fs, 1)) var(--cond); color:var(--k); text-align:right; }
  .hl-row .sc small { display:block; font:700 11px var(--mono); color:color-mix(in srgb, var(--k) 70%, #fff); letter-spacing:0; }
  .hl-strip { grid-column:1 / -1; display:flex; gap:2px; height:14px; align-items:flex-end; }
  .hl-strip i { flex:1 1 0; min-width:2px; border-radius:2px; background:var(--c); }
  .hl-note { grid-column:1 / -1; font-size:calc(12.5px * var(--fs, 1)); color:#fff; }
  .hl-acts { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
  .hl-out { margin-top:10px; }
  .hl-ch { display:grid; grid-template-columns:repeat(13, 1fr); gap:3px; align-items:end; height:70px; margin:8px 0 4px; }
  .hl-ch i { display:block; border-radius:4px 4px 0 0; background:var(--c); min-height:3px; position:relative; }
  .hl-ch i.mine { box-shadow:0 0 0 2px #fff; }
  .hl-chx { display:grid; grid-template-columns:repeat(13, 1fr); gap:3px; font:700 11px var(--mono); text-align:center; color:var(--text); }
  .hl-chx span.k { color:#3ce08a; } .hl-chx span.m { color:#fff; text-decoration:underline; }
  .hl-bta { display:flex; gap:10px; align-items:center; padding:12px 14px; margin:0 0 10px; border-radius:14px; color:#000; font:800 calc(15px * var(--fs, 1))/1.3 var(--cond);
    background:linear-gradient(135deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.3)), #ffc23d; }
  .hl-bta .ic { flex:0 0 26px; width:26px; height:26px; fill:#000; }
  .hl-why { font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.3px; color:#fff; margin:8px 0 2px; }
  `);
  const state = () => GB.status && GB.status.lights_health;
  GB.healthOf = id => { const h = state(); return h && h.lights ? h.lights.find(x => x.id === id) : null; };

  // 🏷️ the badge in the top bar
  function badge() {
    let b = $('hlBadge');
    if (!b) { const line = document.querySelector('#hd .line'), sfx = $('sfx'); if (!line) return;
      b = document.createElement('button'); b.id = 'hlBadge'; b.type = 'button'; b.className = 'no-fit no-wm'; b.setAttribute('aria-label', 'Health of your lights');
      b.onclick = () => GB.go('lights', 'hlPanel'); line.insertBefore(b, sfx || null); }
    const h = state(); if (!h || !h.lights || !h.lights.length) { b.hidden = true; return; }
    b.hidden = false; b.style.setProperty('--k', COL[h.state] || COL.good);
    b.innerHTML = `${GB.svg('wifi')}<span>${h.state === 'good' ? h.score : WORD[h.state].toUpperCase() + ' ' + h.score}</span>`;
    b.title = 'Light health ' + h.score + ' / 100';
  }

  // 📋 the panel on LIGHTS
  GB.panel('lights', 4, el => {
    el.id = 'hlPanel'; el.classList.add('box'); el.style.setProperty('--c', '#33d6ff');
    el.innerHTML = `<div class="ph"><span>Light health</span><span class="r" id="hlR">LIVE</span></div>
      <div id="hlBody"></div>
      <div class="hl-acts"><button class="btn c" id="hlTest" style="--c:#33d6ff">${GB.svg('wifi')}<span>Run the Wi-Fi test</span></button>
        <button class="btn c" id="hlScan" style="--c:#cc99ff">${GB.svg('search')}<span>Scan Wi-Fi neighbours</span></button></div>
      <div class="hl-out" id="hlOut"></div>`;
    el.querySelector('#hlTest').onclick = runTest; el.querySelector('#hlScan').onclick = runScan;
  });
  const strip = hist => hist.length ? `<div class="hl-strip">${hist.map(ms => ms < 0 ? '<i style="--c:#ff4d6d;height:100%"></i>'
    : `<i style="--c:${ms > 1000 ? '#ff4d6d' : ms > 400 ? '#ffc23d' : '#3ce08a'};height:${Math.max(20, Math.min(100, 20 + ms / 15))}%"></i>`).join('')}</div>` : '';
  // 🔵 Oct 19 (Graham: "will our health bar work with lights that are lower grade... the Bluetooth lights?"): every brand is measured now,
  //   and the engine sends one plain-words reason list per light (x.why). Bluetooth lights say so, with their signal strength.
  function noteOf(x) {
    if (x.state === 'off') return 'Not answering' + (x.secs ? ' for ' + Math.round(x.secs / 60) + ' min' : '') + '. GlowBop keeps trying; check its plug, or unplug it for 10 seconds.';
    const bt = x.kind === 'bluetooth';
    if (!x.tries && !(x.why || []).length) return 'Measuring… (one check every 15 seconds)';
    const parts = (x.why || []).slice();
    if (!bt && x.ms != null) parts.push(`answers in about ${x.ms < 1000 ? x.ms + ' ms' : (x.ms / 1000).toFixed(1) + ' s'}`);
    if (bt && x.rssi != null && x.rssi >= -75) parts.push(`Bluetooth signal ${x.rssi >= -60 ? 'strong' : 'good'} (${x.rssi} dBm)`);
    if (!parts.length) parts.push(bt ? 'Connected and steady' : 'Steady');
    return parts.join(', ').replace(/^./, c => c.toUpperCase()) + '.';
  }
  function paint() {
    const box = $('hlBody'); if (!box || GB.page !== 'lights') return;
    const h = state(); if (!h || !h.lights) { box.innerHTML = '<p class="note">Waiting for the first check-ins…</p>'; return; }
    const k = COL[h.state] || COL.good;
    box.innerHTML = `<div class="hl-sum" style="--k:${k}"><div class="hl-big">${h.score}</div><span>${h.state === 'good' ? 'Every light is keeping up, Wi-Fi and Bluetooth.' : h.lights[0] && h.lights[0].kind === 'bluetooth' && h.lights[0].state !== 'good' ? 'A Bluetooth light is struggling. Its reason is below; most often it is too far from the computer.' : h.state === 'slow' ? 'Some lights are slow to answer. The show keeps going; GlowBop eases them off.' : 'Lights are dropping check-ins. That is the Wi-Fi, not the lights: try the test and the neighbour scan below.'}</span></div>
      ${h.bt_audio ? `<div class="hl-bta">${GB.svg('warn')}<span>Your computer is playing its sound over Bluetooth (${esc(h.bt_audio)}). That shares the same radio as your Wi-Fi and slows your lights. A cable to the speaker fixes it.</span></div>` : ''}
      <div class="hl-list">${h.lights.map(x => `<div class="hl-row" style="--k:${COL[x.state] || COL.good}"><b>${esc(x.name)}<small>${esc(x.brand || '')}${x.kind === 'bluetooth' && x.brand !== 'Bluetooth' ? ' · Bluetooth' : x.kind === 'wifi' ? ' · Wi-Fi' : ''}</small></b>
        <div class="sc">${x.state === 'off' ? 'OFF' : x.score}<small>${WORD[x.state] || ''}</small></div>${strip(x.hist || [])}<div class="hl-note">${esc(noteOf(x))}</div></div>`).join('')}</div>`;
  }
  async function runTest() {
    const r = await GB.post('/api/lights/nettest', {}); if (!r) return;
    GB.toast('🧪 Wi-Fi test: 2 minutes, first at full speed, then at a light load. The show keeps going.');
    const out = $('hlOut'); out.innerHTML = '<p class="note">🧪 Testing… about 2 minutes. Results show here.</p>';
    const t0 = Date.now();
    const poll = async () => { let h; try { h = await GB.get('/api/lights/health'); } catch (e) { return setTimeout(poll, 5000); }
      if (h.testing || !h.test || h.test.t * 1000 < t0) { if (Date.now() - t0 < 300000) setTimeout(poll, 5000); return; }
      out.innerHTML = testHtml(h.test); };
    setTimeout(poll, 8000);
  }
  function testHtml(t) {
    const rows = t.rows || []; if (!rows.length) return '<p class="note">The test did not finish.</p>';
    const names = Object.keys(rows[0].lights || {});
    const cell = v => !v ? '–' : `<span style="color:${v.missed > v.tries / 4 ? '#ff4d6d' : v.missed ? '#ffc23d' : '#3ce08a'}">${v.missed}/${v.tries} missed · ${v.median_ms == null ? '–' : v.median_ms + ' ms'}</span>`;
    const full = rows[0], light = rows[rows.length - 1];
    const bad = r => names.reduce((a, n) => a + ((r.lights[n] || {}).missed || 0), 0);
    const verdict = bad(full) > 2 && bad(light) <= 1 ? 'At full speed your Wi-Fi gets crowded; at a lighter load it copes. Something else is sharing the air (a Bluetooth speaker, a microwave, a busy channel): try the neighbour scan.'
      : bad(full) <= 1 ? 'All good: every light answers quickly even at full speed.' : 'Lights miss check-ins even at a light load: move the router or the lights closer, or add a Wi-Fi extender near them.';
    return `<div class="hl-why">${verdict}</div><div class="hl-list">${names.map(n => `<div class="hl-row" style="--k:#33d6ff"><b>${esc(n)}</b><div></div>
      <div class="hl-note">Full speed: ${cell(full.lights[n])}<br>Light load: ${cell(light.lights[n])}</div></div>`).join('')}</div>`;
  }
  async function runScan() {
    const out = $('hlOut'); out.innerHTML = '<p class="note">📡 Listening for nearby Wi-Fi…</p>';
    let r; try { r = await GB.get('/api/lights/wifiscan'); } catch (e) { out.innerHTML = '<p class="note">The scan did not answer. Try again.</p>'; return; }
    if (!r || !r.ok) { out.innerHTML = `<p class="note">${esc((r && r.why) || 'The scan did not work on this computer.')}</p>`; return; }
    const ch = r.ch24 || {}, max = Math.max(1, ...Object.values(ch));
    const colOf = v => v < max * 0.35 ? '#3ce08a' : v < max * 0.7 ? '#ffc23d' : '#ff4d6d';
    out.innerHTML = `<div class="hl-why">${esc(r.why)}</div>
      <div class="hl-ch">${Array.from({length: 13}, (_, i) => { const c = i + 1, v = ch[c] || 0; return `<i class="${c === r.now ? 'mine' : ''}" style="--c:${colOf(v)};height:${Math.max(4, v / max * 100)}%" title="Channel ${c}"></i>`; }).join('')}</div>
      <div class="hl-chx">${Array.from({length: 13}, (_, i) => `<span class="${i + 1 === r.best ? 'k' : ''} ${i + 1 === r.now ? 'm' : ''}">${i + 1}</span>`).join('')}</div>
      <p class="note">Taller = busier (neighbours' Wi-Fi, by signal strength). <b style="color:#3ce08a">Green number</b> = quietest of 1, 6, 11. <u>Underlined</u> = yours${r.mine && r.mine.signal ? ' (' + r.mine.signal + '% signal at the laptop)' : ''}.
        ${r.n24} networks on 2.4 GHz and ${r.n5} on 5 GHz can be heard here. Changing the channel is done on your router's own page.</p>`;
  }
  GB.on && GB.on('status', () => { badge(); paint(); });
  GB.on && GB.on('page', p => { if (p === 'lights') setTimeout(paint, 50); });
})();
