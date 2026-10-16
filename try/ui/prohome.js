/* 🏠 PRO HOME (Oct 16, Graham): the house control center, included with Pro (the twin of Pro DJ).
   - 🏠 ACTIVATE PRO HOME in the top bar (next to ⚡ PRO DJ). Same power-on flicker, a warm palette, its own chime,
     and the PRO HOME key slides into the PRO section of the rail.
   - The PRO HOME page: House scenes (one tap: Welcome home, Dinner, Party, Movie night, Game day, Relax, Bedtime, All off),
     Schedules (sunset / sunrise / a clock time, chosen days: turn on, turn off or start a scene), plus Zones (Light groups
     from LIGHTS, zone brightness faders from LIVE BOARD) and the Holiday calendar (from HOLIDAY), borrowed while you're here.
   - Every box drags and resizes with ✏️ ARRANGE (prodj.js), and the page starts on a Compact template.
   Engine: GET /api/schedule, POST /api/schedule {scene} | {save} | {delete} | {enable, on} (schedule.py). */
(function () {
  'use strict';
  const {$} = GB, S = GB.store, esc = GB.esc;
  const isOn = () => GB.pro === true && S.get('gb_prohome') === '1';
  const BORROW = [['grpPanel', 'lights'], ['znSubs', 'board'], ['mdHolPanel', 'holiday']];   // zones: light groups (each runs its own show) + a brightness fader per zone
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  let SC = {items: [], scenes: {}, sun: null, has_loc: false}, lastScene = S.get('gb_ph_scene') || '';

  GB.css(`
  /* ---- warm Pro Home palette */
  html.prohome { --panel:#17110c; --line:#3a2a1c; }
  html.prohome #pg-home > .panel.box:nth-of-type(4n+1) { --c:#ffb23d !important; }
  html.prohome #pg-home > .panel.box:nth-of-type(4n+2) { --c:#ff9f5a !important; }
  html.prohome #pg-home > .panel.box:nth-of-type(4n+3) { --c:#ffd21a !important; }
  html.prohome #pg-home > .panel.box:nth-of-type(4n+4) { --c:#4de8c8 !important; }
  html:not(.prohome) #rail button[data-p=home] { display:none !important; }
  #rail button[data-p=home] { background:#ffb23d; }
  /* ---- header key */
  #phHd { min-height:40px; margin-right:6px; gap:6px; } #phHd .ic { width:18px; height:18px; fill:currentColor; }
  #phHd .ps { display:none; } @media (max-width:1300px) { #phHd .pl { display:none; } #phHd .ps { display:inline; } } @media (max-width:560px) { #phHd .ps { display:none; } #phHd { padding:0 12px; } }
  #phHd.on { box-shadow:0 0 18px #ffb23d; }
  @media (max-width:1300px) { #pdHd .pl { display:none; } #pdHd .ps { display:inline; } }
  @media (max-width:560px) { #pdHd .ps, #phHd .ps { display:none; } }
  @media (max-width:380px) { #hd .line .who { display:none; } }   /* the smallest phones: icons only */
  /* ---- house scenes: the same key style as the Pro keys */
  .ph-sc { display:grid; grid-template-columns:repeat(auto-fill, minmax(104px, 1fr)); gap:8px; }
  .ph-sc .btn { min-height:64px; padding:6px 4px; flex-direction:column; gap:3px; font-size:calc(13px * var(--fs, 1)); letter-spacing:1px; line-height:1.05; border-radius:999px; }
  .ph-sc .btn .ic { width:calc(24px * var(--fs, 1)); height:calc(24px * var(--fs, 1)); fill:currentColor; }
  .ph-sc .btn.on { outline:3px solid #fff; box-shadow:0 0 22px var(--c); }
  /* ---- schedules */
  .ph-sun { display:flex; gap:12px; flex-wrap:wrap; font:700 calc(13px * var(--fs, 1)) var(--mono); color:var(--dim); }
  .ph-sun b { color:#ffd21a; }
  .ph-list { display:grid; gap:8px; }
  .ph-it { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; align-items:center; background:#0007; border:1px solid var(--line); border-radius:16px; padding:8px 10px; }
  .ph-it.off { opacity:.55; }
  .ph-it .t b { display:block; font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .ph-it .t small { color:var(--dim); font-size:calc(12.5px * var(--fs, 1)); }
  .ph-it .sw { width:52px; height:30px; border-radius:999px; border:0; background:#333; position:relative; cursor:pointer; padding:0; }
  .ph-it .sw::after { content:''; position:absolute; top:3px; left:3px; width:24px; height:24px; border-radius:50%; background:#fff; transition:left .15s; }
  .ph-it .sw.on { background:#ffb23d; } .ph-it .sw.on::after { left:25px; }
  .ph-it .ed { min-height:36px; padding:0 12px; }
  .ph-form { display:grid; gap:10px; background:#0006; border:1px dashed var(--line); border-radius:16px; padding:10px; }
  .ph-form .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .ph-form input[type=text], .ph-form input[type=time], .ph-form select { min-height:40px; background:#000; color:var(--text); border:1px solid var(--line); border-radius:10px; padding:0 10px; font:inherit; }
  .ph-form .seg2 { display:flex; gap:6px; flex-wrap:wrap; }
  .ph-form .seg2 .btn { min-height:38px; padding:0 12px; font-size:calc(13px * var(--fs, 1)); }
  .ph-days { display:flex; gap:5px; } .ph-days .btn { min-height:36px; width:36px; padding:0; }
  `);

  // ================================================================ data
  let fitted = false;
  async function load() { try { SC = await GB.get('/api/schedule'); } catch (e) {} paintScenes(); paintSched();
    if (!fitted && GB.page === 'home' && GB.proDJ) { fitted = true; setTimeout(() => GB.proDJ.recompact(), 400); } }   // size the template to the loaded boxes
  const post = b => GB.post('/api/schedule', b);

  // ================================================================ 🏠 House scenes
  GB.panel('home', 10, el => {
    el.classList.add('box'); el.id = 'phScenes'; el.style.setProperty('--c', '#ffb23d');
    el.innerHTML = `<div class="ph"><span>House scenes</span><span class="r" id="phScR">ONE TAP, WHOLE HOUSE</span></div><div class="ph-sc" id="phSc"></div>
      <p class="note">Each scene sets the look, the pace and the brightness for every light in the house at once. Use them by hand or from a schedule.</p>`;
  });
  function paintScenes() {
    const box = $('phSc'); if (!box) return; box.innerHTML = '';
    Object.entries(SC.scenes || {}).forEach(([k, v]) => {
      const b = document.createElement('button'); b.className = 'btn c' + (k === lastScene ? ' on' : ''); b.style.setProperty('--c', v.c);
      b.innerHTML = GB.svg(v.ic) + '<span>' + esc(v.name) + '</span>';
      b.onclick = async () => { b.classList.add('hit'); GB.sfx && GB.sfx('tap');
        if (await post({scene: k})) { lastScene = k; S.set('gb_ph_scene', k); paintScenes(); GB.toast('🏠 ' + v.name); } };
      box.appendChild(b);
    });
    const r = $('phScR'); if (r) r.textContent = lastScene && SC.scenes[lastScene] ? 'NOW: ' + SC.scenes[lastScene].name.toUpperCase() : 'ONE TAP, WHOLE HOUSE';
  }

  // ================================================================ ⏰ Schedules
  GB.panel('home', 20, el => {
    el.classList.add('box'); el.id = 'phSched'; el.style.setProperty('--c', '#ff9f5a');
    el.innerHTML = `<div class="ph"><span>Schedules</span><span class="r" id="phSchR">EVERY DAY, BY ITSELF</span></div>
      <div class="ph-sun" id="phSun"></div>
      <div class="ph-list" id="phList"></div>
      <div id="phFormBox"></div>
      <button class="btn c wide" id="phAdd" style="--c:#ff9f5a">${GB.svg('add')} ADD A SCHEDULE</button>
      <p class="note">Schedules run on the laptop, even when no phone is open. Sunset and sunrise follow your saved location, so they move with the seasons.</p>`;
    el.querySelector('#phAdd').onclick = () => form(null);
  });
  const whenTxt = it => {
    const off = +it.offset || 0, o = off ? (off > 0 ? ' + ' : ' − ') + Math.abs(off) + ' min' : '';
    const w = it.when === 'sunset' ? 'Sunset' + o : it.when === 'sunrise' ? 'Sunrise' + o : fmt(it.time);
    const d = it.days || [], dd = d.length === 7 ? 'every day' : d.join() === '0,1,2,3,4' ? 'weekdays' : d.join() === '5,6' ? 'weekends' : d.map(i => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]).join(' ');
    return w + ', ' + dd;
  };
  const fmt = hm => { if (!hm) return ''; const [h, m] = hm.split(':').map(Number); return ((h + 11) % 12 + 1) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
  const actTxt = it => it.action === 'on' ? 'Turn the lights on' : it.action === 'off' ? 'Turn the lights off' : 'Scene: ' + ((SC.scenes[it.scene] || {}).name || it.scene);
  function paintSched() {
    const sun = $('phSun'); if (!sun) return;
    sun.innerHTML = SC.sun ? `<span>☀️ Sunrise <b>${fmt(SC.sun.sunrise)}</b></span><span>🌅 Sunset <b>${fmt(SC.sun.sunset)}</b></span><span>${esc(SC.sun.place || '')}</span>`
      : `<span>📍 No location yet. <a href="#" id="phLoc" style="color:#ffd21a">Set your location</a> to use sunset and sunrise.</span>`;
    const l = $('phLoc'); if (l) l.onclick = e => { e.preventDefault(); GB.go('feeds'); setTimeout(() => { const f = $('fdLoc'); if (f) f.focus(); }, 300); };
    const list = $('phList'); list.innerHTML = '';
    if (!(SC.items || []).length) list.innerHTML = '<p class="note" data-keep="1">No schedules yet. Add one below.</p>';
    (SC.items || []).forEach(it => {
      const r = document.createElement('div'); r.className = 'ph-it' + (it.enabled ? '' : ' off');
      r.innerHTML = `<button class="sw${it.enabled ? ' on' : ''}" aria-label="${it.enabled ? 'Turn this schedule off' : 'Turn this schedule on'}"></button>
        <div class="t"><b>${esc(it.name)}</b><small>${esc(whenTxt(it))} · ${esc(actTxt(it))}${it.enabled && it.next ? ' · next ' + esc(it.next) : ''}</small></div>
        <button class="btn ed">Edit</button>`;
      r.querySelector('.sw').onclick = async () => { const res = await post({enable: it.id, on: !it.enabled}); if (res) { SC = res; paintSched(); GB.sfx && GB.sfx('tap'); } };
      r.querySelector('.ed').onclick = () => form(it);
      list.appendChild(r);
    });
    const on = (SC.items || []).filter(x => x.enabled).length, rr = $('phSchR'); if (rr) rr.textContent = on ? on + ' ON' : 'EVERY DAY, BY ITSELF';
  }
  function form(it) {
    const box = $('phFormBox'); if (!box) return;
    const x = Object.assign({name: 'Lights on at sunset', when: 'sunset', time: '19:00', offset: 0, days: [0, 1, 2, 3, 4, 5, 6], action: 'scene', scene: 'welcome', enabled: true}, it || {});
    const scOpts = Object.entries(SC.scenes || {}).map(([k, v]) => `<option value="${k}"${k === x.scene ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
    box.innerHTML = `<div class="ph-form">
      <div class="row"><input type="text" id="phfName" value="${esc(x.name)}" maxlength="40" placeholder="Name" style="flex:1;min-width:160px"></div>
      <div class="seg2" id="phfWhen">${[['sunset', '🌅 Sunset'], ['sunrise', '☀️ Sunrise'], ['time', '🕗 A set time']].map(([k, n]) => `<button class="btn${x.when === k ? ' c' : ''}" data-v="${k}" style="--c:#ffb23d">${n}</button>`).join('')}</div>
      <div class="row" id="phfTimeRow"><input type="time" id="phfTime" value="${esc(x.time || '19:00')}"></div>
      <div class="row" id="phfOffRow"><select id="phfOff">${[-60, -30, -15, 0, 15, 30, 60].map(m => `<option value="${m}"${m === +x.offset ? ' selected' : ''}>${m === 0 ? 'Right at that time' : (m < 0 ? Math.abs(m) + ' min before' : m + ' min after')}</option>`).join('')}</select></div>
      <div class="ph-days" id="phfDays">${DAYS.map((d, i) => `<button class="btn${x.days.includes(i) ? ' c' : ''}" data-d="${i}" style="--c:#ff9f5a" aria-label="${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]}">${d}</button>`).join('')}</div>
      <div class="seg2" id="phfAct">${[['scene', '🏠 Start a scene'], ['on', '💡 Turn on'], ['off', '🌙 Turn off']].map(([k, n]) => `<button class="btn${x.action === k ? ' c' : ''}" data-v="${k}" style="--c:#4de8c8">${n}</button>`).join('')}</div>
      <div class="row" id="phfScRow"><select id="phfScene">${scOpts}</select></div>
      <div class="row"><button class="btn c" id="phfSave" style="--c:#ffb23d;flex:1">Save</button>${it ? '<button class="btn" id="phfDel" style="--c:var(--red)">Delete</button>' : ''}<button class="btn ghost" id="phfX">Cancel</button></div></div>`;
    const sel = (id, v) => { x[id] = v; box.querySelectorAll('#phf' + (id === 'when' ? 'When' : 'Act') + ' .btn').forEach(b => b.classList.toggle('c', b.dataset.v === v)); vis(); };
    const vis = () => { $('phfTimeRow').hidden = x.when !== 'time'; $('phfOffRow').hidden = x.when === 'time'; $('phfScRow').hidden = x.action !== 'scene'; };
    box.querySelectorAll('#phfWhen .btn').forEach(b => b.onclick = () => sel('when', b.dataset.v));
    box.querySelectorAll('#phfAct .btn').forEach(b => b.onclick = () => sel('action', b.dataset.v));
    box.querySelectorAll('#phfDays .btn').forEach(b => b.onclick = () => { const d = +b.dataset.d; x.days = x.days.includes(d) ? x.days.filter(v => v !== d) : x.days.concat(d).sort(); b.classList.toggle('c', x.days.includes(d)); });
    vis();
    $('phfX').onclick = () => { box.innerHTML = ''; };
    if ($('phfDel')) $('phfDel').onclick = async () => { const r = await post({delete: it.id}); if (r) { SC = r; box.innerHTML = ''; paintSched(); GB.toast('Schedule deleted'); } };
    $('phfSave').onclick = async () => {
      if (!x.days.length) return GB.toast('Pick at least one day');
      if (x.when !== 'time' && !SC.has_loc) return GB.toast('📍 Set your location first (LIVE page) to use sunset and sunrise');
      const item = Object.assign({}, x, {name: $('phfName').value.trim() || 'Schedule', time: $('phfTime').value || '19:00', offset: +$('phfOff').value, scene: $('phfScene').value, enabled: true});
      const r = await post({save: item}); if (r) { SC = r; box.innerHTML = ''; paintSched(); GB.sfx && GB.sfx('ok'); GB.toast('⏰ Saved: ' + item.name); GB.proDJ && GB.proDJ.recompact(); }
    };
    box.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  // ================================================================ borrowing Zones + Holidays while on the Home page
  const home = {};
  function borrow(want) {
    BORROW.forEach(([id]) => {
      const el = $(id); if (!el) return;
      if (want) { if (el.parentElement && el.parentElement.id === 'pg-home') return; home[id] = {parent: el.parentElement, next: el.nextSibling}; $('pg-home').appendChild(el); }
      else if (home[id] && el.parentElement && el.parentElement.id === 'pg-home') {
        const h = home[id]; try { h.parent.insertBefore(el, h.next && h.next.parentElement === h.parent ? h.next : null); } catch (e) { h.parent.appendChild(el); }
        delete home[id]; el.style.gridColumn = el.style.gridRow = ''; el.classList.remove('lay-it');
      }
    });
  }

  // ================================================================ 🔊 a warm chime (Web Audio, follows the SFX key)
  let actx = null;
  function chime(on) {
    if (S.get('gb_sfx', '1') !== '1') return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state !== 'running') { actx.resume().then(() => play(on), () => play(on)); return; }
      play(on);
    } catch (e) {}
  }
  function play(on) {
    const C = actx, t = C.currentTime + 0.03, out = C.createGain(); out.gain.value = 0.7; out.connect(C.destination);
    const bell = (f, at, dur, pk) => { [1, 2, 3.01].forEach((m, i) => { const o = C.createOscillator(), g = C.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(pk / (1 + i * 2.5), at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + dur / (1 + i * .6));
      o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.1); }); };
    if (on) { const pad = C.createOscillator(), pg = C.createGain(); pad.type = 'triangle'; pad.frequency.value = 130.81;
      pg.gain.setValueAtTime(0.0001, t); pg.gain.exponentialRampToValueAtTime(0.18, t + 0.35); pg.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); pad.connect(pg); pg.connect(out); pad.start(t); pad.stop(t + 1.9);
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(f, t + 0.25 + i * 0.13, 1.4, 0.2)); }       // a doorbell-like rising chime
    else [783.99, 523.25].forEach((f, i) => bell(f, t + i * 0.18, 0.9, 0.16));
  }

  // ================================================================ on / off
  function railMove(on, animate) {
    const rail = $('rail'), b = rail && rail.querySelector('button[data-p=home]'), sep = rail && rail.querySelector('.rail-sep[data-g=pro]'); if (!b || !sep) return;
    if (sep.nextElementSibling !== b) sep.after(b);
    if (on && animate) { b.classList.add('gbi-off'); setTimeout(() => { b.classList.remove('gbi-off'); b.classList.add('gbi-boot'); setTimeout(() => b.classList.remove('gbi-boot'), 760); }, 500); }
  }
  function apply(on, animate) {
    document.documentElement.classList.toggle('prohome', !!on);
    railMove(on, animate); headerKey();
    borrow(!!on && GB.page === 'home');
    if (on && GB.page !== 'home') GB.go('home');
    if (!on && GB.page === 'home') GB.go('music');
    if (on) load();
  }
  function setOn(on, animate) {
    if (on && GB.pro !== true) return;
    if (on && GB.proDJ && GB.proDJ.isOn()) GB.proDJ.setOn(false, false);          // one Pro mode at a time
    S.set('gb_prohome', on ? '1' : '0');
    if (animate) { chime(on); GB.toast(on ? '🏠 Pro Home on' : 'Back to the regular console'); }
    if (animate && GB.proDJ) GB.proDJ.flicker(() => apply(on, true)); else apply(on, animate);
  }
  function headerKey() {
    const line = document.querySelector('#hd .line'); if (!line) return;
    let b = $('phHd');
    if (!b) { b = document.createElement('button'); b.id = 'phHd'; b.className = 'btn sm c'; b.style.setProperty('--c', '#ffb23d'); b.onclick = () => setOn(!isOn(), true); }
    const after = $('pdHd') || $('gbGuideBtn');
    if (after) { if (after.nextSibling !== b) after.after(b); } else if (!b.parentElement) line.insertBefore(b, $('sfx'));
    const on = isOn(); b.hidden = GB.pro !== true;
    b.innerHTML = GB.svg('home') + '<span class="pl">' + (on ? 'EXIT PRO HOME' : 'ACTIVATE PRO HOME') + '</span><span class="ps">' + (on ? 'EXIT HOME' : 'PRO HOME') + '</span>';
    b.setAttribute('aria-label', on ? 'Exit Pro Home mode' : 'Activate Pro Home mode'); b.classList.toggle('on', on);
  }

  GB.on('ready', () => { headerKey(); setTimeout(headerKey, 600); if (isOn()) apply(true, false); });
  GB.on('pro', v => { headerKey(); if (!v) document.documentElement.classList.remove('prohome'); else if (isOn()) apply(true, false); });
  GB.on('page', id => { borrow(isOn() && id === 'home'); if (id === 'home') load(); });
  // Pro DJ switched on: Pro Home steps aside
  const mo = new MutationObserver(() => { if (document.documentElement.classList.contains('prodj') && isOn()) { S.set('gb_prohome', '0'); document.documentElement.classList.remove('prohome'); headerKey(); } });
  mo.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  setInterval(() => { if (GB.page === 'home' && !document.hidden) load(); }, 60000);
})();
