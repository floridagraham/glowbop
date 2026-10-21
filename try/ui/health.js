/* 📶 WI-FI HEALTH (Oct 19, Graham: "a network health thing, like how things are going, so people can see"; "next to the name of each
   panel on the live wall, a health score or a health bar"; "scan all the Wi-Fi signals and see what the best band is").
   - a little health bar after every light's name on the live wall (core.js drawSetup asks GB.healthOf)
   - a Wi-Fi badge in the top bar on every page: the whole setup's score; tap it to open the health panel
   - the health panel on LIGHTS: every light's score, answer time and its last 10 minutes as a strip; Run the Wi-Fi test;
     Scan Wi-Fi neighbours (which channel is quietest here)
   🧩 Oct 19 13:54 (Graham: "include the health bars into the light naming and controlling... save some space... functionally use everything
   in one place and not have this huge menu"; picked: bars in the light chips, network tools behind the top-bar badge):
   - every light chip above the board carries its 5 health bars; tap a chip and its health card (score, reason, Reconnect) sits at the top
     of the LIGHTS tab, next to that light's controls. No more separate list of every light.
   - the top-bar badge opens a small sheet: the overall score, the Bluetooth sound warning, Set up my network, Run the Wi-Fi test, Scan.
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
  .hl-acts .hl-wide { grid-column:1 / -1; }
  .hl-foot { grid-column:1 / -1; display:flex; align-items:center; gap:10px; }
  .hl-foot .hl-note { flex:1; min-width:0; }
  .hl-rc { flex:0 0 auto; }
  html body #hlPanel .hl-rc[disabled] { background:#33d6ff !important; border-color:#33d6ff !important; color:#000 !important; opacity:1 !important; }
  html body #hlPanel .hl-rc[disabled] .ic { fill:#000 !important; color:#000 !important; }
  .hl-out { margin-top:10px; }
  .hl-ch { display:grid; grid-template-columns:repeat(13, 1fr); gap:3px; align-items:end; height:70px; margin:8px 0 4px; }
  .hl-ch i { display:block; border-radius:4px 4px 0 0; background:var(--c); min-height:3px; position:relative; }
  .hl-ch i.mine { box-shadow:0 0 0 2px #fff; }
  .hl-chx { display:grid; grid-template-columns:repeat(13, 1fr); gap:3px; font:700 11px var(--mono); text-align:center; color:var(--text); }
  .hl-chx span.k { color:#3ce08a; } .hl-chx span.m { color:#fff; text-decoration:underline; }
  .hl-bta { display:flex; gap:10px; align-items:center; padding:12px 14px; margin:0 0 10px; border-radius:14px; color:#000; font:800 calc(15px * var(--fs, 1))/1.3 var(--cond);
    background:linear-gradient(135deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.3)), #ffc23d; }
  .hl-bta .ic { flex:0 0 26px; width:26px; height:26px; fill:#000; }
  .hb { display:inline-flex; align-items:flex-end; gap:2px; height:14px; margin-left:8px; vertical-align:middle; flex:0 0 auto; }
  .hb i { display:block; width:4px; border-radius:1.5px; background:var(--k); }
  .hb i.e { background:transparent; box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--k) 70%, transparent); }
  .chip.on .hb i { box-shadow:0 0 0 1px #000; }
  #slList.strip .sl-lih.hbx small { display:none; }
  #slList.strip .sl-lih span { flex:0 0 auto; overflow:visible; }       /* whole names on the chips, never 'Nanole…' */          /* the bars replace the bulb count on the chips (it's in the light's own controls) */
  @media (max-width:700px) { #hlBadge .bw { display:none; } #hlBadge { padding:0 10px; } }
  @media (max-width:500px) { #hlBadge span { display:none; } #hlBadge { width:44px; padding:0; justify-content:center; } }
  .chip.on .hb i.e { box-shadow:inset 0 0 0 1px #000; }
  .hl-card { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:6px 12px; align-items:center; }
  .hl-card .hl-rcb { grid-column:1 / -1; }
  #hlSheet { position:fixed; inset:0; z-index:9984; background:#000c; display:flex; align-items:flex-start; justify-content:center; padding:70px 16px 16px; }
  #hlSheet .hs-card { width:min(560px, 100%); max-height:calc(100vh - 90px); overflow:auto; background:#0b0716; border-radius:22px; padding:18px;
    box-shadow:0 0 0 2px var(--k), 0 0 40px -6px var(--k), 0 20px 60px #000; }
  #hlSheet .hs-top { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
  #hlSheet .hs-top h2 { flex:1; margin:0; font:800 calc(22px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:#fff; }
  #hlSheet .hs-x { width:44px; height:44px; border-radius:12px; border:0; background:#2a1840; color:#fff; font:800 18px var(--cond); cursor:pointer; }
  .hl-why { font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.3px; color:#fff; margin:8px 0 2px; }
  `);
  const state = () => GB.status && GB.status.lights_health;
  GB.healthOf = id => { const h = state(); return h && h.lights ? h.lights.find(x => x.id === id) : null; };

  // 🏷️ the badge in the top bar
  function badge() {
    let b = $('hlBadge');
    if (!b) { const line = document.querySelector('#hd .line'), sfx = $('sfx'); if (!line) return;
      b = document.createElement('button'); b.id = 'hlBadge'; b.type = 'button'; b.className = 'no-fit no-wm'; b.setAttribute('aria-label', 'Health of your lights');
      b.onclick = openSheet; line.insertBefore(b, sfx || null); }
    const h = state(); if (!h || !h.lights || !h.lights.length) { b.hidden = true; return; }
    b.hidden = false; b.style.setProperty('--k', COL[h.state] || COL.good);
    b.innerHTML = `${GB.svg('wifi')}<span>${h.state === 'good' ? '' : '<b class="bw">' + WORD[h.state].toUpperCase() + ' </b>'}${h.score}</span>`;
    b.title = 'Light health ' + h.score + ' / 100';
  }

  // 📋 the picked light's health card, at the top of the LIGHTS tab (hidden until a light chip is picked)
  GB.panel('lights', 4, el => {
    el.id = 'hlPanel'; el.classList.add('box'); el.style.setProperty('--c', '#33d6ff'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span id="hlT">Light health</span><span class="r" id="hlR">LIVE</span></div><div id="hlBody"></div>`;
    el.querySelector('#hlBody').addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-rc]'); if (b) reconnect(b.dataset.rc); });
  });
  const picked = () => { const c = document.querySelector('#slList .sl-li.on [data-li]') || document.querySelector('#slTop .chip.on[data-sl]'); return c ? (c.dataset.li || c.dataset.sl) : ''; };
  // 📶 5 little bars inside every light chip
  const bars = x => { const k = COL[x.state] || COL.good, n = x.state === 'off' ? 0 : Math.max(1, Math.ceil(x.score / 20));
    return `<span class="hb" style="--k:${k}" aria-label="${esc(WORD[x.state] || '')} ${x.state === 'off' ? '' : x.score}">${[0, 1, 2, 3, 4].map(i => `<i class="${i < n ? '' : 'e'}" style="height:${30 + i * 17}%"></i>`).join('')}</span>`; };
  function chipBars() {
    document.querySelectorAll('#slList [data-li], #slTop [data-sl]').forEach(c => {          // the light chips / rows (Lay out your lights)
      const x = GB.healthOf(c.dataset.li || c.dataset.sl), old = c.querySelector('.hb');
      if (!x) { if (old) { old.remove(); delete c.dataset.hk; } return; }
      const key = x.state + ':' + (x.state === 'off' ? 0 : Math.max(1, Math.ceil(x.score / 20)));     // 🐛 Oct 19 14:15: compare a key, not outerHTML
      if (old && c.dataset.hk === key) return;                                                     //    (the browser rewrites style text, so it never matched: endless loop, frozen page)
      c.dataset.hk = key; const html = bars(x);
      const tail = c.querySelector(':scope > b');                                          // before the ▸ / ▾ marker
      if (old) old.outerHTML = html; else if (tail) tail.insertAdjacentHTML('beforebegin', html); else c.insertAdjacentHTML('beforeend', html);
      c.classList.add('hbx');
      c.title = x.name + ': ' + (x.state === 'off' ? 'offline' : x.score + ' / 100, ' + (WORD[x.state] || '').toLowerCase());
    });
  }
  let WQ = 0;
  function watchChips() {
    ['slList', 'slTop'].forEach(i => { const t = $(i); if (!t || t._hlw) return; t._hlw = true;
      new MutationObserver(ms => {                                       // only real chip changes count: never our own bars or the health card
        const mine = m => (m.target.nodeType === 1 && m.target.closest('.hb, #hlPanel')) ||
          (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].length && [...m.addedNodes, ...m.removedNodes].every(n => n.nodeType === 1 && (n.classList.contains('hb') || n.id === 'hlPanel')));
        if (ms.every(mine)) return;
        if (WQ) return; WQ = requestAnimationFrame(() => { WQ = 0; GB._hbRuns = (GB._hbRuns || 0) + 1; chipBars(); paint(); });
      }).observe(t, {childList: true, subtree: true, attributes: true, attributeFilter: ['class']}); });
  }
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
    if (!bt && x.rssi != null && x.rssi >= -67) parts.push(`Wi-Fi signal ${x.rssi >= -55 ? 'strong' : 'good'} (${x.rssi} dBm)`);
    if (!parts.length) parts.push(bt ? 'Connected and steady' : 'Steady');
    return parts.join(', ').replace(/^./, c => c.toUpperCase()) + '.';
  }
  function paint() {
    const el = $('hlPanel'), box = $('hlBody'); if (!el || !box) return;
    const id = picked(), x = id && GB.healthOf(id);
    if (!x) { el.hidden = true; return; }
    const home = $('slCtl') && $('slCtl').offsetParent ? $('slCtl') : document.querySelector('#slList .sl-li.on .sl-lib');    // right above that light's own controls
    if (home && el.parentElement !== home) home.prepend(el);
    el.hidden = false; el.style.setProperty('--c', COL[x.state] || COL.good);
    const t = $('hlT'); if (t) t.textContent = 'Health · ' + x.name;
    const sig = [x.id, x.state, x.score, (x.hist || []).join(','), noteOf(x), !!RC[x.id], x.fw || ''].join('|'); if (box.dataset.sig === sig) return; box.dataset.sig = sig;
    box.innerHTML = `<div class="hl-row hl-card" style="--k:${COL[x.state] || COL.good}"><b>${esc(x.brand || '')}${x.kind === 'bluetooth' && x.brand !== 'Bluetooth' ? ' · Bluetooth' : x.kind === 'wifi' ? ' · Wi-Fi' : ''}</b>
      <div class="sc">${x.state === 'off' ? 'OFF' : x.score}<small>${WORD[x.state] || ''}</small></div>${strip(x.hist || [])}<div class="hl-note">${esc(noteOf(x))}${x.fw ? ` <small style="opacity:.75">· Firmware ${esc(x.fw)}</small>` : ''}</div>
      <button class="btn c hl-rc hl-rcb" type="button" data-rc="${esc(x.id)}" style="--c:#33d6ff"${RC[x.id] ? ' disabled' : ''}>${GB.svg('refresh')}<span>${RC[x.id] ? 'Reconnecting…' : 'Reconnect'}</span></button></div>`;
  }
  // 🏷️ the badge's sheet: overall score, Bluetooth sound warning, and the three network tools
  function sumHtml(h) {
    const k = COL[h.state] || COL.good;
    return `<div class="hl-sum" style="--k:${k}"><div class="hl-big">${h.score}</div><span>${h.state === 'good' ? 'Every light is keeping up, Wi-Fi and Bluetooth.' : h.lights[0] && h.lights[0].kind === 'bluetooth' && h.lights[0].state !== 'good' ? 'A Bluetooth light is struggling. Tap its chip on LIGHTS to see why.' : h.state === 'slow' ? 'Some lights are slow to answer. The show keeps going; GlowBop eases them off.' : 'Lights are dropping check-ins. That is the Wi-Fi, not the lights: try the test and the neighbour scan.'}</span></div>
      ${h.bt_audio ? `<div class="hl-bta">${GB.svg('warn')}<span>Your computer is playing its sound over Bluetooth (${esc(h.bt_audio)}). That shares the same radio as your Wi-Fi and slows your lights. A cable to the speaker fixes it.</span></div>` : ''}
      <div class="hl-list">${h.lights.filter(x => x.state !== 'good').map(x => `<div class="hl-row" style="--k:${COL[x.state]}"><b>${esc(x.name)}</b><div class="sc">${x.state === 'off' ? 'OFF' : x.score}</div><div class="hl-note">${esc(noteOf(x))}</div></div>`).join('')}</div>`;
  }
  function openSheet() {
    let w = $('hlSheet'); if (w) return w.remove();
    const h = state() || {score: 100, state: 'good', lights: []};
    w = document.createElement('div'); w.id = 'hlSheet'; w.style.setProperty('--k', COL[h.state] || COL.good);
    w.innerHTML = `<div class="hs-card" role="dialog" aria-label="Light health"><div class="hs-top"><h2>Light health</h2><button class="hs-x" aria-label="Close">✕</button></div>
      <div id="hsSum">${sumHtml(h)}</div>
      <div class="hl-acts"><button class="btn c hl-wide" id="hlSetup" style="--c:#3ce08a">${GB.svg('gear')}<span>Set up my network</span></button>
        <button class="btn c" id="hlTest" style="--c:#33d6ff">${GB.svg('wifi')}<span>Run the Wi-Fi test</span></button>
        <button class="btn c" id="hlScan" style="--c:#cc99ff">${GB.svg('search')}<span>Scan Wi-Fi neighbours</span></button></div>
      <div class="hl-out" id="hlOut"></div></div>`;
    w.addEventListener('click', e => { if (e.target === w) w.remove(); });
    w.querySelector('.hs-x').onclick = () => w.remove();
    w.querySelector('#hlTest').onclick = runTest; w.querySelector('#hlScan').onclick = runScan;
    w.querySelector('#hlSetup').onclick = () => { w.remove(); GB.openNetSetup && GB.openNetSetup(); };
    document.body.appendChild(w);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const w = $('hlSheet'); if (w) w.remove(); } });
  // 🔁 Oct 19 (Graham: "can we send it a reset signal? And can that be a button in our lights health board?"; "Every light"):
  //   Reconnect = connect fresh, look for it on the network if it moved, and only swap once it really answers.
  const RC = {};
  async function reconnect(id) {
    if (RC[id]) return; RC[id] = true; paint();
    const x = (state() && state().lights || []).find(l => l.id === id) || {};
    let r = null; try { r = await GB.post('/api/lights/reconnect', {id}); } catch (e) {}
    delete RC[id]; paint();
    if (!r) return;
    GB.sfx && GB.sfx(r.ok ? 'ok' : 'err');
    if (r.ok) GB.toast('✅ ' + (r.msg || (x.name || 'The light') + ' is reconnected.'));
    else GB.notice({tone: 'bad', icon: '🔌', title: (x.name || 'That light') + ' did not answer', from: x.brand || '', body: r.msg || 'It did not answer.', tip: 'Unplug it for 10 seconds, plug it back in, then tap Reconnect again.'});
  }
  GB.reconnectLight = reconnect;
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
  GB.on && GB.on('status', () => { badge(); watchChips(); chipBars(); paint();
    const w = $('hsSum'), h = state(); if (w && h && h.lights) { w.innerHTML = sumHtml(h); $('hlSheet').style.setProperty('--k', COL[h.state] || COL.good); } });
  GB.on && GB.on('page', p => { if (p === 'lights') setTimeout(() => { watchChips(); chipBars(); paint(); }, 50); });
})();
