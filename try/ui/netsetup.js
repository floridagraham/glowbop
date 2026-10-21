/* 🧭 SET UP YOUR NETWORK (Oct 19, Graham: "a set up your network guide, like the first time you connect it... scan your Wi-Fi for the
   best signals... make sure everything's working on the best systems for you. Best channels, everything."; picked: both places, open the
   router page with brand steps, all four checks, Reconnect on every light).
   Runs once by itself after the first-time welcome, and any time from LIGHTS > Light health > Set up my network. Five steps:
     1 Checks    the computer is on the 2.4 GHz network, sound isn't going over Bluetooth, every light answers (Reconnect right there)
     2 Before    a 90 s light test, so the difference shows later (can skip)
     3 Channel   a fresh scan of every network nearby, how busy each 2.4 GHz channel is, and the quietest one
     4 Router    opens the router's page, with click-by-click steps for its brand; the owner makes the change and saves it
     5 After     waits for the lights to come back, tests again, and shows before / after side by side
   Engine: GET /api/lights/netcheck, POST /api/lights/nettest {tag, secs}, GET /api/lights/health (tests), POST /api/lights/netsetup */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  GB.css(`
  .ns-wrap { position:fixed; inset:0; z-index:9985; background:#000c; display:flex; align-items:center; justify-content:center; padding:16px; animation:nsFade .18s ease-out; }
  .ns-card { width:min(720px, 100%); max-height:calc(100vh - 32px); overflow:auto; background:#0b0716; border-radius:22px; padding:20px 20px 18px;
    box-shadow:0 0 0 2px #3ce08a, 0 0 40px -6px #3ce08a88, 0 20px 60px #000; }
  .ns-top { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .ns-top h2 { flex:1; margin:0; font:800 calc(24px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:#fff; }
  .ns-x { width:44px; height:44px; border-radius:12px; border:0; background:#2a1840; color:#fff; font:800 18px var(--cond); cursor:pointer; }
  .ns-steps { display:flex; gap:6px; margin:0 0 16px; }
  .ns-steps i { flex:1; height:6px; border-radius:3px; background:#3ce08a33; }
  .ns-steps i.on { background:#3ce08a; } .ns-steps i.now { background:#33d6ff; }
  .ns-lead { font:600 calc(16px * var(--fs, 1))/1.45 var(--body, system-ui); color:#fff; margin:0 0 14px; }
  .ns-h { font:800 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:#b98cff; margin:16px 2px 8px; }
  .ns-row { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; margin-bottom:8px;
    background:color-mix(in srgb, var(--k) 12%, #0b0716); box-shadow:inset 0 0 0 1.5px color-mix(in srgb, var(--k) 55%, transparent); }
  .ns-row > .ic { flex:0 0 28px; width:28px; height:28px; fill:var(--k); color:var(--k); }
  .ns-row div { flex:1; min-width:0; }
  .ns-row b { display:block; font:800 calc(16px * var(--fs, 1)) var(--cond); letter-spacing:.4px; color:#fff; }
  .ns-row span { display:block; font:500 calc(14px * var(--fs, 1))/1.35 var(--body, system-ui); color:#fff; }
  .ns-acts { display:flex; flex-wrap:wrap; gap:10px; margin-top:18px; justify-content:flex-end; }
  .ns-acts .btn { min-width:150px; }
  .ns-bar { height:14px; border-radius:7px; background:#33d6ff2e; overflow:hidden; margin:10px 0 6px; }
  .ns-bar i { display:block; height:100%; width:0; background:linear-gradient(90deg, #33d6ff, #3ce08a); border-radius:7px; transition:width .9s linear; }
  .ns-small { font:700 calc(13px * var(--fs, 1)) var(--mono); color:#cc99ff; }
  .ns-ch { display:grid; grid-template-columns:repeat(13, 1fr); gap:4px; align-items:end; height:130px; margin:8px 0 2px; }
  .ns-ch div { display:flex; flex-direction:column; justify-content:flex-end; align-items:center; height:100%; gap:4px; }
  .ns-ch i { display:block; width:100%; border-radius:6px 6px 2px 2px; background:var(--k); min-height:6px; }
  .ns-ch b { font:800 12px var(--cond); color:#fff; }
  .ns-ch .best i { box-shadow:0 0 0 2px #fff; }
  .ns-tags { display:grid; grid-template-columns:repeat(13, 1fr); gap:4px; font:800 10px var(--cond); letter-spacing:.5px; text-align:center; text-transform:uppercase; min-height:14px; }
  .ns-key { display:flex; flex-wrap:wrap; gap:14px; margin:8px 0 0; font:700 calc(13px * var(--fs, 1)) var(--cond); color:#fff; }
  .ns-key em { font-style:normal; display:inline-block; width:12px; height:12px; border-radius:3px; background:var(--k); margin-right:6px; vertical-align:-1px; }
  .ns-ol { margin:6px 0 0; padding-left:22px; font:600 calc(15px * var(--fs, 1))/1.5 var(--body, system-ui); color:#fff; }
  .ns-ol li { margin:4px 0; } .ns-ol b { color:#3ce08a; }
  .ns-big { font:800 calc(40px * var(--fs, 1)) var(--cond); color:#3ce08a; line-height:1; }
  table.ns-t { width:100%; border-collapse:separate; border-spacing:0 6px; font:700 calc(14px * var(--fs, 1)) var(--cond); color:#fff; }
  table.ns-t th { text-align:left; font-size:12px; letter-spacing:1px; text-transform:uppercase; color:#b98cff; padding:0 8px; }
  table.ns-t td { padding:9px 8px; background:#1a1030; } table.ns-t td:first-child { border-radius:10px 0 0 10px; } table.ns-t td:last-child { border-radius:0 10px 10px 0; }
  .ns-wrap a.btn { text-decoration:none; }
  .ns-wrap .chip { display:inline-flex; align-items:center; gap:6px; min-height:36px; padding:0 14px; margin:4px 0 0 6px; border-radius:999px; border:1.5px solid var(--c); cursor:pointer;
    background:color-mix(in srgb, var(--c) 14%, transparent); color:#fff; font:800 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:.5px; vertical-align:middle; }
  .ns-wrap .chip .ic { width:16px; height:16px; fill:var(--c); color:var(--c); }
  .ns-wrap .chip[disabled] { background:var(--c); color:#000; } .ns-wrap .chip[disabled] .ic { fill:#000; }
  @keyframes nsFade { from { opacity:0; } }
  `);
  const G = '#3ce08a', A = '#ffc23d', P = '#ff4d8a', C = '#33d6ff';
  // 🧭 where the 2.4 GHz channel lives, by router brand (menus differ a little between models: these are the usual paths)
  const ROUTER = {
    'ARRIS SURFboard': ['Sign in (the password is on the sticker on the router, or the one you set).', 'In the left menu: <b>Connection</b> → <b>Wi-Fi</b> → <b>2.4 GHz Radio</b>.', 'Channel Selection: <b>Manual</b>. Channel: <b>{ch}</b>. Channel Bandwidth: <b>20</b>.', 'Click <b>Save Settings</b>.', 'A SURFboard mesh may only offer this in the <b>SURFboard Central</b> phone app.'],
    'Xfinity': ['Sign in (admin password on the gateway sticker, or the one you set). The Xfinity app may not offer channels.', '<b>Gateway</b> → <b>Connection</b> → <b>Wi-Fi</b>.', 'Next to the 2.4 GHz network: <b>Edit</b>.', 'Channel Selection: <b>Manual</b>, channel <b>{ch}</b>, bandwidth <b>20 MHz</b>.', '<b>Save Settings</b>.'],
    'NETGEAR': ['Sign in (often at routerlogin.net).', '<b>Advanced</b> → <b>Setup</b> → <b>Wireless Setup</b> (older models: <b>Wireless</b>).', 'Under 2.4 GHz: Channel <b>{ch}</b>, mode up to <b>20 MHz</b> if offered.', 'Click <b>Apply</b>.'],
    'NETGEAR Orbi': ['Sign in (orbilogin.com).', '<b>Advanced</b> → <b>Advanced Setup</b> → <b>Wireless Settings</b>.', 'Turn off <b>Enable Smart Connect</b> if channels are greyed out, then 2.4 GHz channel <b>{ch}</b>.', 'Click <b>Apply</b>.'],
    'TP-Link': ['Sign in (often at tplinkwifi.net).', '<b>Advanced</b> → <b>Wireless</b> → <b>Wireless Settings</b> → <b>2.4GHz</b>.', 'Channel <b>{ch}</b>, Channel Width <b>20MHz</b>.', 'Click <b>Save</b>.'],
    'TP-Link Deco': ['Deco picks its own channels; open the <b>Deco</b> phone app.', '<b>More</b> → <b>Advanced</b> → <b>Wireless</b> (if your model offers a channel), choose <b>{ch}</b>.', 'If there is no channel option: restart the Deco from the app so it picks again.'],
    'ASUS': ['Sign in (often at router.asus.com).', '<b>Wireless</b> → <b>General</b> → Band: <b>2.4 GHz</b>.', 'Channel bandwidth: <b>20 MHz</b>. Control Channel: <b>{ch}</b>.', 'Click <b>Apply</b>.'],
    'Linksys': ['Sign in (often at myrouter.local).', '<b>Wi-Fi Settings</b> → <b>Advanced</b>.', '2.4 GHz channel: <b>{ch}</b>, channel width <b>20 MHz</b>.', 'Click <b>Ok</b> / <b>Apply</b>.'],
    'eero': ['eero chooses channels itself and has no channel setting.', 'In the <b>eero</b> app: <b>Settings</b> → <b>Troubleshooting</b> → <b>Restart your network</b>, so it picks again.', 'Keep the computer close to an eero.'],
    'Google / Nest Wifi': ['Google Wifi chooses channels itself and has no channel setting.', 'In the <b>Google Home</b> app: <b>Wi-Fi</b> → <b>Settings</b> → <b>Restart network</b>, so it picks again.'],
    'Verizon': ['Sign in (often at mynetworksettings.com).', '<b>Wireless Settings</b> → <b>Advanced Security Settings</b> → <b>Other Advanced Wireless Options</b> (or <b>Advanced</b> → <b>Wi-Fi</b>).', '2.4 GHz channel: <b>{ch}</b>, bandwidth <b>20 MHz</b>.', '<b>Apply</b>.'],
    'Spectrum': ['Open the <b>My Spectrum</b> app or the router page.', '<b>Wi-Fi</b> → <b>Advanced</b> → <b>2.4 GHz</b>.', 'Channel <b>{ch}</b>, channel width <b>20 MHz</b>.', '<b>Save</b>.'],
    '': ['Sign in to your router (the address and password are usually on a sticker on the router).', 'Look for <b>Wireless</b> or <b>Wi-Fi</b> settings, then <b>2.4 GHz</b> (sometimes under <b>Advanced</b>).', 'Set the channel to <b>{ch}</b> (Manual) and the width to <b>20 MHz</b>.', '<b>Save</b> or <b>Apply</b>.']
  };
  let S = null;                                            // {step, chk, before, after, busy}
  const close = () => { const w = $('nsWrap'); if (w) w.remove(); S = null; };
  const row = (k, ic, t, sub, extra) => `<div class="ns-row" style="--k:${k}">${GB.svg(ic)}<div><b>${esc(t)}</b><span>${sub}</span></div>${extra || ''}</div>`;
  const dots = () => `<div class="ns-steps">${[1, 2, 3, 4, 5].map(i => `<i class="${i < S.step ? 'on' : i === S.step ? 'now' : ''}"></i>`).join('')}</div>`;
  const btn = (id, label, ic, c, cls) => `<button class="btn c${cls ? ' ' + cls : ''}" id="${id}" style="--c:${c}">${GB.svg(ic)}<span>${label}</span></button>`;

  function shell(title, body, acts) {
    let w = $('nsWrap');
    if (!w) { w = document.createElement('div'); w.id = 'nsWrap'; w.className = 'ns-wrap'; document.body.appendChild(w);
      w.addEventListener('click', e => { if (e.target === w && !S.busy) later(); }); }
    w.innerHTML = `<div class="ns-card" role="dialog" aria-label="Set up your network"><div class="ns-top"><h2>${title}</h2><button class="ns-x" aria-label="Close">✕</button></div>
      ${S.step ? dots() : ''}${body}<div class="ns-acts">${acts}</div></div>`;
    w.querySelector('.ns-x').onclick = later;
    return w;
  }
  function later() { if (S && S.first) GB.post('/api/lights/netsetup', {done: false, later: true}); close(); }

  // 0 · welcome
  function intro() {
    S.step = 0;
    const w = shell('Set up your network', `<p class="ns-lead">A five minute check so your lights get the best Wi-Fi in your home. GlowBop checks your computer's
      connection, listens to every Wi-Fi network nearby, finds the quietest channel and shows you where to change it on your router.</p>
      ${row(C, 'wifi', 'What you need', 'Your router\'s password (usually on a sticker on the router). The show keeps playing the whole time.')}`,
      (S.first ? btn('nsLater', 'Later', 'back', '#b98cff') : '') + btn('nsGo', 'Start', 'play', G));
    w.querySelector('#nsGo').onclick = checks;
    const l = w.querySelector('#nsLater'); if (l) l.onclick = later;
  }

  // 1 · checks
  async function checks() {
    S.step = 1; S.busy = true;
    shell('Checking your setup', `<p class="ns-lead">Listening to the Wi-Fi around you… about 10 seconds.</p><div class="ns-bar"><i id="nsBar"></i></div>`, '');
    setTimeout(() => { const b = $('nsBar'); if (b) { b.style.transition = 'width 9s linear'; b.style.width = '92%'; } }, 30);
    let r = null; try { r = await GB.get('/api/lights/netcheck'); } catch (e) {}
    S.busy = false; if (!S) return;
    if (!r) return shell('Checking your setup', row(P, 'warn', 'GlowBop could not check', 'Make sure GlowBop is running on your computer, then try again.'), btn('nsRe', 'Try again', 'refresh', C)).querySelector('#nsRe').onclick = checks;
    S.chk = r; const sc = r.scan || {}, me = sc.mine || {}, five = /5/.test(me.band || '') && !/2\.4/.test(me.band || '');
    const L = r.lights || [], bad = L.filter(x => x.state === 'off' || x.state === 'bad');
    const rows = [
      !sc.ok ? row(A, 'warn', 'Windows would not list nearby Wi-Fi', esc(sc.why || ''))
      : five ? row(A, 'laptop', 'Your computer is on 5 GHz', `It's on <b>${esc(me.ssid || '')}</b>. Your lights live on 2.4 GHz and some routers don't pass everything between the two. Connect the computer to <b>${esc(sc.ssid24 || 'your 2.4 GHz network')}</b> (taskbar Wi-Fi icon), then tap Check again.`)
      : row(G, 'laptop', 'Your computer is on 2.4 GHz', `${esc(me.ssid || '')}, signal ${me.signal || '?'}%. Same band as your lights.`),
      r.bt_audio ? row(A, 'bt', 'Sound is going over Bluetooth', `${esc(r.bt_audio)} shares the computer's radio with Wi-Fi and slows your lights. Use a cable to the speaker, or play from another device.`)
      : row(G, 'bt', 'No Bluetooth sound', 'The computer\'s radio is free for Wi-Fi.'),
      !L.length ? row(A, 'bulb', 'No lights yet', 'Add your lights on LIGHTS first, then run this again.')
      : bad.length ? row(P, 'bulb', bad.length + ' of ' + L.length + ' lights not answering', bad.map(x => `${esc(x.name)} <button class="chip" data-nsrc="${esc(x.id)}" style="--c:${C}">${GB.svg('refresh')}<span>Reconnect</span></button>`).join(' '))
      : row(G, 'bulb', 'All ' + L.length + ' lights answering', L.map(x => esc(x.name)).join(', ')),
      ...(() => { const weak = L.filter(x => x.kind !== 'bluetooth' && x.rssi != null && x.rssi < -67);     // 📶 Oct 19: each light's own Wi-Fi signal
        return weak.length ? [row(A, 'wifi', weak.length + (weak.length > 1 ? ' lights have' : ' light has') + ' a weak Wi-Fi signal', weak.map(x => `${esc(x.name)} (${x.rssi} dBm)`).join(', ') + '. Move the router or an extender closer to ' + (weak.length > 1 ? 'them' : 'it') + '; aim for -60 or better.')]
          : L.some(x => x.rssi != null) ? [row(G, 'wifi', 'Every light has a good Wi-Fi signal', L.filter(x => x.rssi != null).map(x => `${esc(x.name)} ${x.rssi} dBm`).join(', '))] : []; })()];
    const w = shell('Checking your setup', rows.join(''), btn('nsRe', 'Check again', 'refresh', '#b98cff') + btn('nsNext', 'Next', 'play', G));
    w.querySelector('#nsRe').onclick = checks; w.querySelector('#nsNext').onclick = before;
    w.querySelectorAll('[data-nsrc]').forEach(b => b.onclick = async () => { b.disabled = true; b.querySelector('span').textContent = 'Reconnecting…';
      if (GB.reconnectLight) await GB.reconnectLight(b.dataset.nsrc); checks(); });
  }

  // 2 / 5 · the light test (tagged 'before' or 'after')
  async function test(tag, next) {
    S.step = tag === 'before' ? 2 : 5; S.busy = true;
    const title = tag === 'before' ? 'Light test: before' : 'Light test: after';
    const w = shell(title, `<p class="ns-lead">${tag === 'before' ? 'Timing every light now, so you can see the difference after the change.' : 'Timing every light again on the new channel.'}
      About 90 seconds: first at full speed, then at a light load. The show keeps playing.</p><div class="ns-bar"><i id="nsBar"></i></div><div class="ns-small" id="nsLeft">90 s left</div>`,
      tag === 'before' ? btn('nsSkip', 'Skip the test', 'ffwd', '#b98cff') : '');
    const sk = w.querySelector('#nsSkip'); let skip = false; if (sk) sk.onclick = () => { skip = true; S.busy = false; next(); };
    const r = await GB.post('/api/lights/nettest', {tag, secs: 45}); if (!r) { S.busy = false; return next(); }
    const t0 = Date.now(), T = 95000;
    const tick = async () => {
      if (!S || skip) return;
      const f = Math.min(1, (Date.now() - t0) / T), b = $('nsBar'), l = $('nsLeft');
      if (b) b.style.width = Math.round(f * 100) + '%'; if (l) l.textContent = Math.max(0, Math.round((T - (Date.now() - t0)) / 1000)) + ' s left';
      let h = null; if (Date.now() - t0 > 60000) { try { h = await GB.get('/api/lights/health'); } catch (e) {} }
      if (h && h.tests && h.tests[tag] && h.tests[tag].t * 1000 > t0 - 5000) { S[tag] = h.tests[tag]; S.busy = false; return next(); }
      if (Date.now() - t0 > T + 60000) { S.busy = false; return next(); }
      setTimeout(tick, 1000);
    };
    tick();
  }
  const before = () => test('before', channel);

  // 3 · the channel
  function channel() {
    S.step = 3; const sc = (S.chk && S.chk.scan) || {};
    if (!sc.ok) { const w = shell('Your Wi-Fi channel', row(A, 'warn', 'No scan this time', esc(sc.why || 'Windows did not list nearby networks.')), btn('nsNext', 'Finish', 'check', G)); w.querySelector('#nsNext').onclick = done; return; }
    const ch = sc.ch24 || {}, mx = Math.max(1, ...Object.values(ch)), cur = sc.router24, best = sc.best;
    const col = v => v / mx < .34 ? G : v / mx < .67 ? A : P;
    const bars = Array.from({length: 13}, (_, i) => { const c = i + 1, v = ch[c] || 0;
      return `<div class="${c === best ? 'best' : ''}"><i style="--k:${col(v)};height:${Math.max(5, Math.round(v / mx * 100))}%"></i><b>${c}</b></div>`; }).join('');
    const tags = Array.from({length: 13}, (_, i) => { const c = i + 1; return `<span style="color:${c === best ? G : C}">${c === best && c === cur ? 'best · yours' : c === best ? 'best' : c === cur ? 'yours' : ''}</span>`; }).join('');
    const near = (sc.nets || []).filter(n => n.channel >= 1 && n.channel <= 13).length;
    const ok = sc.ok_now;
    const w = shell('Your Wi-Fi channel', `<p class="ns-lead">${near} networks can be heard here on 2.4 GHz. Taller bars mean a busier channel. Only channels <b>1</b>, <b>6</b> and <b>11</b> don't overlap each other.</p>
      <div class="ns-ch">${bars}</div><div class="ns-tags">${tags}</div>
      <div class="ns-key"><span><em style="--k:${G}"></em>quiet</span><span><em style="--k:${A}"></em>busy</span><span><em style="--k:${P}"></em>crowded</span></div>
      ${ok ? row(G, 'check', 'Your router is already on the quietest channel', `Channel ${cur}. Nothing to change on the router.`)
           : row(A, 'wifi', `Move your 2.4 GHz to channel ${best}`, cur ? `Your router uses channel ${cur}, which is busier here. Channel ${best} is the quietest, with a width of 20 MHz.` : `Channel ${best} is the quietest here, with a width of 20 MHz.`)}`,
      ok ? btn('nsNext', 'Finish', 'check', G) : btn('nsNext', 'Change it on my router', 'gear', G));
    w.querySelector('#nsNext').onclick = ok ? done : router;
  }

  // 4 · the router
  function router() {
    S.step = 4; const rt = (S.chk && S.chk.router) || {}, sc = (S.chk && S.chk.scan) || {}, best = sc.best || 6;
    const steps = (ROUTER[rt.brand] || ROUTER['']).map(t => `<li>${t.replace(/\{ch\}/g, best)}</li>`).join('');
    const w = shell('Change it on your router', `${row(C, 'globe', rt.brand ? 'Your router: ' + rt.brand : 'Your router', rt.ip ? 'Its page is at ' + esc(rt.ip) + '. Open it, sign in, then follow these steps.' : 'GlowBop could not find its address; it is usually 192.168.0.1 or 192.168.1.1.')}
      <div class="ns-h">Steps</div><ol class="ns-ol">${steps}</ol>
      ${row(A, 'warn', 'Your Wi-Fi blinks off when you save', 'For 10 to 30 seconds. That is normal: your lights and this screen come back by themselves.')}`,
      (rt.url ? `<a class="btn c" href="${esc(rt.url)}" target="_blank" rel="noopener" style="--c:${C}">${GB.svg('globe')}<span>Open my router page</span></a>` : '') + btn('nsNext', 'I changed it', 'check', G));
    w.querySelector('#nsNext').onclick = settle;
  }

  // 5 · wait for the Wi-Fi to come back, then test again
  async function settle() {
    S.step = 5; S.busy = true;
    shell('Waiting for your lights', `<p class="ns-lead">Giving your lights a moment to reconnect on the new channel…</p><div class="ns-bar"><i id="nsBar"></i></div>`, '');
    setTimeout(() => { const b = $('nsBar'); if (b) { b.style.transition = 'width 40s linear'; b.style.width = '100%'; } }, 30);
    const t0 = Date.now();
    const look = async () => {
      if (!S) return;
      let h = null; try { h = await GB.get('/api/lights/health'); } catch (e) {}
      const L = (h && h.lights) || [], up = L.length && L.every(x => x.state !== 'off' && x.hist && x.hist.length && x.hist[x.hist.length - 1] >= 0);
      if ((up && Date.now() - t0 > 20000) || Date.now() - t0 > 40000) { S.busy = false; return test('after', result); }
      setTimeout(look, 3000);
    };
    setTimeout(look, 8000);
  }

  // ✅ before / after
  function result() {
    const B = S.before, A2 = S.after, row2 = (fps, src) => (src && src.rows || []).find(r => r.fps === fps);
    const names = [...new Set([...(B ? B.rows : []), ...(A2 ? A2.rows : [])].flatMap(r => Object.keys(r.lights || {})))];
    const cell = v => !v ? '–' : `<span style="color:${v.missed ? (v.missed > v.tries / 4 ? P : A) : G}">${v.missed}/${v.tries} missed · ${v.median_ms == null ? '–' : v.median_ms + ' ms'}</span>`;
    const tbl = fps => `<table class="ns-t"><tr><th>${fps === 40 ? 'Full speed' : 'Light load'}</th>${B ? '<th>Before</th>' : ''}<th>After</th></tr>${names.map(n => `<tr><td>${esc(n)}</td>${B ? '<td>' + cell(((row2(fps, B) || {}).lights || {})[n]) + '</td>' : ''}<td>${cell(((row2(fps, A2) || {}).lights || {})[n])}</td></tr>`).join('')}</table>`;
    const miss = src => (src && src.rows || []).reduce((s, r) => s + Object.values(r.lights || {}).reduce((a, v) => a + (v.missed || 0), 0), 0);
    const good = A2 && miss(A2) === 0;
    const w = shell('Your network is set', `${A2 ? `<div style="display:flex;align-items:center;gap:14px;margin-bottom:6px"><div class="ns-big">${good ? '✓' : miss(A2)}</div><p class="ns-lead" style="margin:0">${good ? 'Every light answered every check, even at full speed.' : 'Some checks were still missed. Try Reconnect on that light, or move it closer to the router.'}${B ? ` Before: ${miss(B)} missed.` : ''}</p></div>` : ''}
      ${A2 ? tbl(40) + tbl(15) : row(A, 'warn', 'No test result', 'The light test did not finish. Run it any time from Light health.')}`, btn('nsDone', 'Done', 'check', G));
    w.querySelector('#nsDone').onclick = done;
  }
  function done() { GB.post('/api/lights/netsetup', {done: true}); GB.sfx && GB.sfx('ok'); GB.toast('✅ Network set up. Run it again any time from Light health.'); close(); }

  GB.openNetSetup = (first) => { if ($('nsWrap')) return; S = {step: 0, first: !!first}; intro(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && S && !S.busy) later(); });

  // 🆕 first time: once the welcome is done and lights are set up, the guide opens by itself (once; "Later" puts it off for good)
  let asked = false;
  GB.on && GB.on('status', st => {
    if (asked || !st || !st.lights_health) return;
    let seen = false; try { seen = localStorage.getItem('gb_intro_seen') === '1' || sessionStorage.getItem('gb_intro_seen') === '1'; } catch (e) {}
    if (!seen || document.getElementById('gbIntro')) return;
    asked = true;
    GB.get('/api/lights/health').then(h => {
      const su = (h && h.setup) || {};
      if (su.done || su.later || !(h.lights || []).length) return;
      setTimeout(() => GB.openNetSetup(true), 4000);
    }).catch(() => {});
  });
})();
