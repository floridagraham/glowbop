/* GlowBop console: core. Everything the section modules share lives on window.GB.
   Modules call GB.panel(pageId, order, el => { ... }) to add their panels, and GB.on('status', fn) to follow the engine. */
(function () {
  'use strict';
  const GB = window.GB = {};
  const $ = GB.$ = id => document.getElementById(id);
  GB.esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  GB.fmt = s => { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  GB.local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  GB.status = {}; GB.catalog = null; GB.pin = false; GB.lastOk = 0;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  GB.store = store;

  // ------------------------------------------------------------- events
  const subs = {};
  GB.on = (ev, fn) => { (subs[ev] = subs[ev] || []).push(fn); if (ev === 'status' && GB.lastOk) fn(GB.status); if (ev === 'catalog' && GB.catalog) fn(GB.catalog); };
  GB.emit = (ev, data) => (subs[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error(ev, e); } });

  // ------------------------------------------------------------- talking to the engine
  let toastT = null;
  GB.toast = m => { const t = $('toast'); t.innerHTML = '<span></span>'; t.firstChild.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1900); };
  GB.get = async p => { const r = await fetch(p, {cache: 'no-store'}); if (!r.ok) throw new Error(r.status); return r.json(); };
  GB.post = async (p, body) => {
    try {
      const r = await fetch(p, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body || {})});
      const j = await r.json();
      if (r.status === 402 && j.error === 'pro') { GB.toast('🔒 ' + (j.message || 'This is a GlowBop Pro DJ feature.')); GB.sfx('err'); GB.setPro(false); return null; }
      if (!r.ok || j.error) { GB.toast('⚠️ ' + (j.error || r.status)); GB.sfx('err'); return null; } return j;
    } catch (e) { GB.toast('⚠️ Not connected'); GB.sfx('err'); return null; }
  };
  // 🧩 light groups: which group the buttons control ('' = all of them)
  GB.gsel = store.get('lj_group', '');
  GB.withGroup = b => GB.gsel ? Object.assign({}, b, {group: GB.gsel}) : b;
  GB.control = b => GB.post('/api/control', GB.withGroup(b));
  GB.fire = b => GB.post('/api/fire', GB.withGroup(b));
  GB.grpInfo = () => ((GB.status && GB.status.groups) || []).find(g => g.id === GB.gsel);
  GB.pickGroup = (id, name) => {
    GB.gsel = id; store.set('lj_group', id); renderGroups(true); GB.emit('group', id);
    GB.toast(id ? 'Controlling ' + name : 'Controlling all groups');
  };
  // 🎵 one key that always gets you home: whatever took over the wall (fire, scoreboard, live feed, storm alert,
  // mirror, holiday, scene, pinned look or locked effect) is switched off and the music show comes back.
  GB.backToMusic = async () => {
    const s = GB.status || {}, fd = s.feeds || {}, jobs = [];
    if (s.fireplace && s.fireplace.on) jobs.push(GB.fire({on: false}));
    if (s.scoreboard) jobs.push(GB.post('/api/score', GB.withGroup({action: 'off'})));
    if (fd.title || (fd.mode && fd.mode !== 'off')) jobs.push(GB.post('/api/feeds', GB.withGroup({mode: 'off'})));
    if (fd.alert) jobs.push(GB.post('/api/feeds', GB.withGroup({feed: 'storm', stop: true})));
    if (s.mirror) jobs.push(GB.control({mirror: null}));
    if (s.holiday) jobs.push(GB.control({holiday: null}));
    if (s.scene) jobs.push(GB.post('/api/scene/stop', {}));
    if (s.locked || s.held_look) jobs.push(GB.control({release: true, lock_effect: null}));
    if (s.power === false) jobs.push(GB.control({power: true}));
    const dj = s.dj || {};
    if (dj.blackout || dj.building || dj.tap_bpm || dj.cue) jobs.push(GB.post('/api/dj', GB.withGroup({reset: true})));
    if (s.show && s.show.active) jobs.push(GB.post('/api/shows', {action: 'skip'}));      // 🎬 this song's show sits this play out
    const ov = s.override || {};
    if (ov.active || (ov.interlude && ov.interlude.on)) jobs.push(GB.post('/api/override', {release: true, interlude: false}));   // 🚨🎙️ overrides off, interlude over
    const lp = s.loops || {};
    if ((lp.running || []).length || lp.rec) jobs.push(GB.post('/api/loops', {stop_all: true}));                     // 🔁 loops stop
    const pd = s.prodj || {};
    if (pd.pro && (pd.loop || pd.pending)) jobs.push(GB.post('/api/autoloops', {release: true}));                       // 🔁 the held Autoloop / Scene lets go
    if (pd.pro && pd.blackout > 0) jobs.push(GB.post('/api/cues', {blackout: false}));                                  // 🎬 a cue blackout lifts
    await Promise.all(jobs);
    GB.sfx('ok'); GB.toast('🎵 Back to the music show');
    if (GB.feedsRefresh) GB.feedsRefresh(100);
  };
  GB.release = async () => { if (await GB.control({release: true, lock_effect: null})) GB.toast('🌊 Flowing with the music again'); };

  // ------------------------------------------------------------- 🎛️ Pro DJ: Song Shows, Autoloops, Scenes, Cues, Tempo toolbox, Fader board, Zones, Palettes, Pad Recorder, Override keys, Interlude
  // GB.pro: true / false (null until /api/license answers). The rail's PRO section shows SHOWS, LIVE BOARD and OVERRIDE on a Pro
  // install and a single gold PRO tour key on a Home one (paintRailPro), so a Home user never lands on a locked control.
  // GB.proGate(panelEl, feature, opts) stays as a safety net on the Pro panels: an upgrade card if one is ever reached on Home.
  // opts: {pitch, chip:false, preview:true}. GB.on('pro', fn) follows changes.
  GB.pro = null; GB.buyPro = 'https://glowbop.com/pricing.html#pro';
  GB.setPro = (v, lic) => { if (lic && lic.buy_pro) GB.buyPro = lic.buy_pro; v = v !== false; if (GB.pro === v) return; GB.pro = v; document.body.classList.toggle('not-pro', !v); document.body.classList.add('pro-known'); paintRailPro(); GB.emit('pro', v); };
  GB.loadPro = async () => { try { const r = await GB.get('/api/license'); GB.setPro(r.pro !== false, r); } catch (e) {} };
  // the Pro tools, the tab each lives on, and the pitch the upgrade card and the PRO tour both use
  const PRO_FEATURES = GB.PRO_FEATURES = [
    {name: 'Autoloops', ic: 'loop', c: '#3fb6ff', page: 'autoloops', tab: 'LOOPS+CUES', prev: 'autoloops',
      pitch: '32 ready-made, beat-synced looks in four banks (Club, Chill / Flow, Big Room, Color). Tap a pad and it drops in on the next bar and holds until you change it, or let it auto-advance every few bars.'},
    {name: 'Scenes', ic: 'save', c: '#8fd3ff', page: 'autoloops', tab: 'LOOPS+CUES', prev: 'scenes',
      pitch: 'Save the wall exactly as it looks right now (look, effect, colours, faders) and bring it back later with a smooth fade. Your own bank of go-to moments.'},
    {name: 'Cues', ic: 'lists', c: '#7dffb2', page: 'cues', tab: 'LOOPS+CUES', prev: 'cues',
      pitch: 'Plan an event as a list of cues (Grand Entrance, First Dance, Cake, Last Song) and run it with one big GO key, with crossfades between cues and the space bar on a laptop.'},
    {name: 'Tempo toolbox', ic: 'note', c: '#3fb6ff', page: 'autoloops', tab: 'LOOPS+CUES', prev: 'tempo',
      pitch: 'Fine-tune the BPM, double or halve it, nudge the beat earlier or later and lock it, so every flash lands exactly on the kick. Auto Ambient goes calm by itself when the music stops.'},
    {name: 'Song Shows', ic: 'movie', c: 'var(--orchid)', page: 'shows', tab: 'SHOWS', prev: 'shows',
      pitch: 'Build a light show for a song once and it plays the same way, right on the beat, every time that song comes on. Look through the timelines below to see how they work.'},
    {name: 'Fader board', ic: 'faders', c: 'var(--cyan)', page: 'board', tab: 'LIVE BOARD', prev: 'faders',
      pitch: 'Six live faders that ride on top of any show: Master, speed, a strobe locked to the beat, a colour wheel, white and trails. Two fingers, two faders, with a flash key under each one.'},
    {name: 'Palettes', ic: 'palette', c: 'var(--pink)', page: 'board', tab: 'LIVE BOARD', prev: 'palettes',
      pitch: 'Pick a colour palette (or make your own from the colour wheel) and every look, Autoloop and auto show switches to those colours until you clear it. Perfect for wedding or brand colours.'},
    {name: 'Zones', ic: 'corner', c: '#4de8c8', page: 'ops', tab: 'OVERRIDE + LIVE BOARD', prev: 'zones',
      pitch: 'Split the wall into zones (left, right, top, bottom, center, odd / even, each curtain). Aim the override keys at one zone and ride each zone with its own fader.'},
    {name: 'Pad Recorder', ic: 'loop', c: 'var(--lime)', page: 'board', tab: 'LIVE BOARD', prev: 'loops',
      pitch: 'A sampler for your lights: record a phrase of hit pads (1 to 8 bars), then fire it back on the beat, looping over any song. Four banks, built-in starter loops and a step editor.'},
    {name: 'Override keys', ic: 'ovr', c: 'var(--red)', page: 'ops', tab: 'OVERRIDE', prev: 'override',
      pitch: 'Big panic buttons that take over the whole wall in one touch: blackout, full white, strobe, house lights, your colours, a disco ball drop and an audience sweep. Flash or latch, with smooth fades and laptop shortcuts.'},
    {name: 'Interlude', ic: 'mic', c: 'var(--lav)', page: 'ops', tab: 'OVERRIDE', prev: 'interlude',
      pitch: 'Ambient mode for talking breaks, speeches and band changeovers: one tap and the wall drifts into a calm, tasteful glow that ignores the mic, then fades back into the show (with a flash or a drop if you like). Can start by itself when the music stops.'},
    {name: 'Pro DJ mode', ic: 'dj', c: '#ff3d9a', page: 'dj', tab: 'PRO DJ', prev: 'faders',
      pitch: 'One key turns the console into a DJ control center: the music player, faders, loop banks and cues on one page, 6 assignable Pro keys under the wall, and a layout you can drag and resize to fit your rig.'},
    {name: 'Pro Home', ic: 'home', c: '#ffb23d', page: 'home', tab: 'PRO HOME', prev: 'zones',
      pitch: 'Run the whole house: one-tap house scenes (Dinner, Party, Movie night, Bedtime), schedules that turn the lights on at sunset and off at bedtime every day, zones and the holiday calendar.'},
    {name: 'DJ power tools', ic: 'bolt', c: 'var(--cyan)', page: 'dj', tab: 'DJ', prev: 'override',
      pitch: 'All 13 hit pads, pick your build and drop styles, Color lock, Cue the next look, and USB DJ controllers.'},
    {name: 'Unlimited lights', ic: 'bulb', c: 'var(--gold)', page: 'lights', tab: 'LIGHTS', prev: 'zones',
      pitch: 'Home DJ plays up to 4 light sets together. Pro runs as many as you hang (big pool cages, whole-house installs, giant matrix walls), with light groups so each area runs its own show.'},
  ];
  const PRO_LIST = PRO_FEATURES.map(f => f.name);
  const firstLine = t => (String(t).match(/^.*?[.!?](?=\s|$)/) || [t])[0];
  GB.proGate = (el, feature, opts) => {
    opts = opts || {};
    const pf = PRO_FEATURES.find(f => f.name === feature);
    const card = document.createElement('div'); card.className = 'pro-card'; card.hidden = true;
    card.innerHTML = `<div class="pro-top"><span class="pro-badge">${GB.svg('lock')}Pro DJ</span><b>${GB.esc(feature)}</b></div>
      <p class="note">${opts.pitch || (pf && pf.pitch) || GB.esc(feature) + ' is part of GlowBop Pro DJ.'}</p>
      <ul class="pro-list">${PRO_LIST.map(f => `<li class="${f === feature ? 'me' : ''}">${GB.esc(f)}</li>`).join('')}</ul>
      <button class="btn c wide pro-buy" style="--c:var(--orchid)">${GB.svg('star')}<span>Upgrade to Pro DJ</span></button>
      <details class="pro-key"><summary>I have a Pro DJ key</summary>
        <div class="pro-keyrow"><input type="text" placeholder="GBPRO-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Pro DJ key"><button class="btn c" style="--c:var(--orchid)">Unlock</button></div>
        <p class="note pro-msg"></p></details>`;
    const ph = el.querySelector(':scope > .ph');
    if (ph && ph.nextSibling) el.insertBefore(card, ph.nextSibling); else el.appendChild(card);
    card.querySelector('.pro-buy').onclick = () => { window.open(GB.buyPro, '_blank', 'noopener'); };
    const inp = card.querySelector('input'), go = card.querySelector('.pro-keyrow .btn'), msg = card.querySelector('.pro-msg');
    go.onclick = async () => {
      const k = inp.value.trim(); if (!k) { msg.textContent = 'Paste your Pro DJ key first.'; return; }
      go.disabled = true; msg.textContent = 'Checking with Polar…';
      const r = await GB.post('/api/license', {key: k}); go.disabled = false;
      if (!r) { msg.textContent = 'Not connected to GlowBop.'; return; }
      msg.textContent = r.message || '';
      if (r.pro) { GB.sfx('ok'); GB.toast('🎛️ Pro DJ unlocked'); GB.setPro(true, r); GB.emit('license', r); }
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
    let chip = null;
    if (ph && opts.chip !== false) { chip = document.createElement('span'); chip.className = 'pro-chip'; chip.innerHTML = GB.svg('faders') + 'PRO'; chip.hidden = true;
      const r = ph.querySelector('.r'); if (r) ph.insertBefore(chip, r); else ph.appendChild(chip); }
    const paint = () => {
      const locked = GB.pro === false;
      card.hidden = !locked; if (chip) chip.hidden = GB.pro !== true;
      el.classList.toggle('pro-locked', locked && !opts.preview); el.classList.toggle('pro-preview', locked && !!opts.preview);
      if (opts.onChange) opts.onChange(!locked);
    };
    GB.on('pro', paint); paint();
    return {card, paint};
  };
  // which keys this license gets: Pro tabs on Pro, the PRO tour on Home, neither until /api/license answers.
  // If the license flips while you're on a page that no longer fits, you move to its counterpart (tour <-> SHOWS).
  const fits = pg => !pg || (pg.pro ? GB.pro !== false : pg.home ? GB.pro !== true : true);
  function paintRailPro() {
    document.querySelectorAll('#rail button[data-p]').forEach(b => {
      const pg = PAGES.find(p => p.id === b.dataset.p); if (!pg) return;
      if (pg.pro) b.hidden = GB.pro !== true; else if (pg.home) b.hidden = GB.pro !== false;
    });
    const sep = document.querySelector('#rail .rail-sep[data-g=pro]'); if (sep) sep.hidden = GB.pro === null;
    const cur = PAGES.find(p => p.id === GB.page);
    if (cur && !fits(cur) && document.body.dataset.page) GB.go(cur.pro ? 'pro' : 'shows');
  }

  // ------------------------------------------------------------- icons (24x24 paths)
  const ICON = GB.ICON = {
    rocket: '!M12 1.5c3.4 2.7 5 6.5 5 11V16H7v-3.5c0-4.5 1.6-8.3 5-11zm0 5.3a1.9 1.9 0 100 3.8 1.9 1.9 0 000-3.8zM7 11.8l-3.2 4V20L7 17.6zm10 0l3.2 4V20L17 17.6zM9.4 17h5.2L12 23z',
    plane: 'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
    quake: 'M1 11h4.4l2.2-5.6 3.5 11.9 3.2-14.6 3.4 11.6 1.3-3.3H23v2h-2.6l-2.6 6.4-2.9-9.9-3.3 15.1-3.7-12.8L6.8 13H1z',
    aurora: 'M2.5 21h19v2h-19zM4 19.2c.4-6.2 1.7-11.4 4.6-16.7.7 6-.1 11.6-2.3 16.7zm5.6 0c.4-5.3 2-9.9 5.2-14.9.4 5.4-.6 10.3-3 14.9zm5.7 0c.6-4.1 2.4-7.4 5.5-10.7.1 4.1-1.2 7.7-3.4 10.7z',
    volcano: 'M1.5 22l6.6-11.5h2.6l1.3 2.3 1.3-2.3h2.6L22.5 22zM9.6 8.6C8.2 8 7.6 6.3 8.4 5c-1-.9-.7-2.6.6-3 .9-.3 1.8 0 2.3.7.8-1 2.4-1.2 3.4-.3 1 .9 1 2.4.1 3.3 1.2.6 1.6 2.1.9 3.2-.7 1-2 1.3-3 .7-.8.6-2 .4-2.6-.4-.2 0-.4-.1-.5-.6z',
    sweep: 'M14 2h4.5v20H14zM2 5.5h9v2.2H2zm2.5 5.4H11v2.2H4.5zM2 16.3h9v2.2H2z',
    shockwave: '!M12 9a3 3 0 110 6 3 3 0 010-6zM12 1.5a10.5 10.5 0 110 21 10.5 10.5 0 010-21zm0 2.4a8.1 8.1 0 100 16.2 8.1 8.1 0 000-16.2z',
    colorbomb: 'M10.5 7.5a7.25 7.25 0 110 14.5 7.25 7.25 0 010-14.5zM14.3 6.6l2.1-2.1 2.1 2.1-2.1 2.1zM19.5 .8l.8 1.7 1.7.8-1.7.8-.8 1.7-.8-1.7-1.7-.8 1.7-.8z',
    lightning: 'M14.5 1L6 12.5h4.6L7.5 23 18 9.5h-4.8L16.5 1zM19 12.5l-2.6 4.2h2l-1.2 4.3 4.3-5.8h-2l1.3-2.7z',
    count321: '!M5 2h14a3 3 0 013 3v14a3 3 0 01-3 3H5a3 3 0 01-3-3V5a3 3 0 013-3zm3.5 4.5v2.2h5.2l-3 3.1v1.9h1.6c1.2 0 1.9.6 1.9 1.4s-.7 1.4-1.9 1.4H8.5v2.2h4.2c2.6 0 4.3-1.5 4.3-3.6 0-1.6-1-2.8-2.6-3.3l2.6-2.7V6.5z',
    heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    play: 'M8 5v14l11-7z', pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z', next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z', prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
    shuffle: 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z',
    like: 'M9 21h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.58 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2zM9 9l4.34-4.34L12 10h9v2l-3 7H9V9zM1 9h4v12H1z',
    likeOn: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z',
    save: 'M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z',
    vol: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volOff: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    moon: 'M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z',
    fire: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    xfade: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    lists: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z',
    moods: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z',
    queue: 'M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm13-1v8l6-4z',
    recent: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
    radio: 'M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    palette: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    note: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    artist: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    album: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z',
    bulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z',
    camera: 'M12 15.2c1.77 0 3.2-1.43 3.2-3.2S13.77 8.8 12 8.8 8.8 10.23 8.8 12s1.43 3.2 3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z',
    trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
    power: 'M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z',
    eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    sparkle: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
    pin: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
    unlock: 'M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z',
    eject: 'M5 17h14v2H5zm7-12L5.33 15h13.34z',
    tv: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
    gift: 'M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z',
    movie: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    anim: 'M15 2c-2.71 0-5.05 1.54-6.22 3.78-1.28.67-2.34 1.72-3 3C3.54 9.95 2 12.29 2 15c0 3.87 3.13 7 7 7 2.71 0 5.05-1.54 6.22-3.78 1.28-.67 2.34-1.72 3-3C20.46 14.05 22 11.71 22 9c0-3.87-3.13-7-7-7zM9 20c-2.76 0-5-2.24-5-5 0-1.12.37-2.16 1-3 0 3.87 3.13 7 7 7-.84.63-1.88 1-3 1zm3-3c-2.76 0-5-2.24-5-5 0-1.12.37-2.16 1-3 0 3.86 3.13 6.99 7 7-.84.63-1.88 1-3 1zm4.7-3.3c-.53.19-1.1.3-1.7.3-2.76 0-5-2.24-5-5 0-.6.11-1.17.3-1.7.53-.19 1.1-.3 1.7-.3 2.76 0 5 2.24 5 5 0 .6-.11 1.17-.3 1.7zM19 12c0-3.86-3.13-6.99-7-7 .84-.63 1.87-1 3-1 2.76 0 5 2.24 5 5 0 1.12-.37 2.16-1 3z',
    bt: 'M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z',
    bright: 'M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z',
    stop: 'M6 6h12v12H6z',
    full: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    map: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
    trophy: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
    text: 'M5 4v3h5.5v12h3V7H19V4z',
    gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    // 🎨 icon pass: console glyphs that replace text arrows / emoji in controls. Same family as above: 24x24, solid fill, currentColor.
    // A leading '~' mirrors the path left-right; a leading '!' draws it even-odd (for cut-out shapes).
    left: 'M15.5 5.2c.8-.5 1.5 0 1.5.8v12c0 .8-.7 1.3-1.5.8L6.2 12.8c-.6-.4-.6-1.2 0-1.6z', right: 'M8.5 5.2C7.7 4.7 7 5.2 7 6v12c0 .8.7 1.3 1.5.8l9.3-6c.6-.4.6-1.2 0-1.6z',
    up: 'M5.2 15.5c-.5.8 0 1.5.8 1.5h12c.8 0 1.3-.7.8-1.5l-6-9.3c-.4-.6-1.2-.6-1.6 0z', down: 'M5.2 8.5C4.7 7.7 5.2 7 6 7h12c.8 0 1.3.7.8 1.5l-6 9.3c-.4.6-1.2.6-1.6 0z',
    arrowR: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z', arrowD: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
    arrowDR: 'M19 9h-2v6.59L5.41 4 4 5.41 15.59 17H9v2h10V9z',
    check: 'M9 16.2l-4.2-4.2-2.1 2.1L9 20.4 21.3 8.1l-2.1-2.1z', dot: 'M12 5a7 7 0 110 14 7 7 0 010-14z',
    lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    faders: 'M5 3h2v6h2v4H7v8H5v-8H3V9h2zm6 0h2v10h2v4h-2v4h-2v-4H9v-4h2zm6 0h2v3h2v4h-2v11h-2V10h-2V6h2z',
    loop: 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
    ovr: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
    bolt: 'M7 2v11h3v9l7-12h-4l4-8z', burst: 'M14.3 0.7L14.6 8.2L19.1 7.3L16.5 11.1L22.8 14.2L15.8 14.6L17 19.5L12.9 16.5L9.7 23.3L9.4 15.8L4.9 16.7L7.5 12.9L1.7 9.9L8.2 9.4L7 4.5L11.1 7.5z',
    sun: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    confetti: 'M2.5 21.5L8 8l8 8zM14 2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM19 1.6l1.4 1.4-2.8 2.8-1.4-1.4zm-6.6 4.6l1.9.6-1.2 3.6-1.9-.6zm5.4 5.4l.6 1.9 3.6-1.2-.6-1.9zM21 15a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
    dark: 'M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm1 3v12h12V6z',
    rainbow: 'M12 8C6.5 8 2 12.5 2 18h2.5a7.5 7.5 0 0115 0H22c0-5.5-4.5-10-10-10zm0 4.5c-3 0-5.5 2.5-5.5 5.5H9a3 3 0 016 0h2.5c0-3-2.5-5.5-5.5-5.5z',
    freeze: 'M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z',
    ffwd: 'M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z',
    refresh: 'M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    reset: '~M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    swapH: 'M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z', swapV: 'M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z',
    center: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-7 7H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4z',
    corner: 'M4 3h7v8H3V4a1 1 0 011-1zm9 0h7a1 1 0 011 1v7h-2V5h-6zM3 13h2v6h6v2H4a1 1 0 01-1-1zm16 0h2v7a1 1 0 01-1 1h-7v-2h6z',
    globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
    share: 'M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    phone: 'M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z',
    bug: 'M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z',
    game: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    hand: 'M21 6.5V18c0 2.76-2.24 5-5 5h-4.6c-1.3 0-2.55-.52-3.47-1.44L2.5 16.1l1.1-1.1c.55-.55 1.42-.62 2.05-.16L8 16.6V5c0-.83.67-1.5 1.5-1.5S11 4.17 11 5v6h1V2.5c0-.83.67-1.5 1.5-1.5S15 1.67 15 2.5V11h1V3.5c0-.83.67-1.5 1.5-1.5S19 2.67 19 3.5V12h.5V6.5c0-.83.37-1.5.75-1.5s.75.67.75 1.5z',
    mic: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
    dj: 'M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z',
    warn: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    disco: '!M11.25 1h1.5v4h-1.5zM12 5a8 8 0 110 16 8 8 0 010-16zM5.2 9.2h13.6v1.2H5.2zm-1.15 3.75h15.9v1.2H4.05zm1.15 3.75h13.6v1.2H5.2z',
    torch: 'M6 2h12v3H6zm0 5v1l2 3v11h8V11l2-3V7H6zm6 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    wind: 'M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zM19 6.5C19 4.57 17.43 3 15.5 3S12 4.57 12 6.5h2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S16.33 8 15.5 8H2v2h13.5c1.93 0 3.5-1.57 3.5-3.5zm-.5 4.5H2v2h16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5v2c1.93 0 3.5-1.57 3.5-3.5S20.43 11 18.5 11z',
    candle: 'M12 1.5c1.6 2.1 2.6 3.5 2.6 5A2.6 2.6 0 0112 9.1a2.6 2.6 0 01-2.6-2.6c0-1.5 1-2.9 2.6-5zM8 11h8v11H8z',
    drum: '!M4 9c0-1.7 3.6-3 8-3s8 1.3 8 3v7c0 1.7-3.6 3-8 3s-8-1.3-8-3zm2.2.1c.7.8 3 1.6 5.8 1.6s5.1-.8 5.8-1.6c-.7-.8-3-1.6-5.8-1.6s-5.1.8-5.8 1.6zM2.6 2.4l1-1.1 7 5.2-1.6.3zm18.8 0l-1-1.1-7 5.2 1.6.3z',
    wifi: 'M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z',
    laptop: 'M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z',
    image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    sax: 'M2.4 4.4L3.9 2.3l6.6 4.5-1.6 2.1zM7.4 6.9l3.8-1.7 4.3 12.6-4 1.4zM11.6 17c.2 6.6 10.2 6.6 10.2-.6v-5.2h1.6V7.5h-8.6v3.7h2.4V17c0 2.3-2.8 2.3-2.9 0zM13.4 8.6a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zm1.2 3.8a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z',
    eyeOff: 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
  };
  GB.svg = (n, extra) => { let d = ICON[n] || '', a = '';
    if (d[0] === '~') { d = d.slice(1); a = ' transform="matrix(-1 0 0 1 24 0)"'; } else if (d[0] === '!') { d = d.slice(1); a = ' fill-rule="evenodd"'; }
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"${extra || ''}><path${a} d="${d}"/></svg>`; };
  GB.css = text => { const st = document.createElement('style'); st.textContent = text; document.head.appendChild(st); };
  GB.lbl = (el, ic, text) => { el.innerHTML = (ic ? GB.svg(ic) : '') + '<span>' + GB.esc(text) + '</span>'; };

  // a pop-up list (choose a playlist etc.): items = [{label, sub, onclick}]
  GB.sheet = (head, items) => {
    const s = document.createElement('div'); s.className = 'sheet';
    s.innerHTML = `<div><div class="ph" style="--c:var(--lav)">${GB.esc(head)}</div></div>`;
    const box = s.firstChild;
    items.forEach(it => { const b = document.createElement('button'); b.className = 'btn wide'; b.style.justifyContent = 'flex-start';
      b.innerHTML = (it.ic ? GB.svg(it.ic) : '') + GB.esc(it.label) + (it.sub ? ` <small style="opacity:.6;text-transform:none">${GB.esc(it.sub)}</small>` : '');
      b.onclick = () => { s.remove(); it.onclick && it.onclick(); }; box.appendChild(b); });
    const c = document.createElement('button'); c.className = 'btn ghost wide'; c.textContent = 'Close'; c.onclick = () => s.remove(); box.appendChild(c);
    s.onclick = e => { if (e.target === s) s.remove(); };
    document.body.appendChild(s); return s;
  };

  // ------------------------------------------------------------- 🔊 console chirps (Web Audio, no files)
  let actx = null, sfxOn = store.get('gb_sfx', '1') === '1';
  GB.sfx = kind => {
    if (!sfxOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      const f = {tap: [1320, 1760], on: [880, 1760], nav: [660, 990], err: [300, 180], ok: [990, 1480]}[kind] || [1320, 1760];
      o.type = kind === 'err' ? 'square' : 'sine';
      o.frequency.setValueAtTime(f[0], t); o.frequency.exponentialRampToValueAtTime(f[1], t + 0.06);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'err' ? 0.05 : 0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'nav' ? 0.12 : 0.08));
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.14);
    } catch (e) {}
  };
  function sfxButton() {
    const b = $('sfx'); b.classList.toggle('on', sfxOn); b.style.setProperty('--c', 'var(--cyan)');
    b.innerHTML = GB.svg(sfxOn ? 'vol' : 'volOff') + '<span>' + (sfxOn ? 'SFX' : 'MUTED') + '</span>';
  }
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('button'); if (!b || b.disabled || b.id === 'sfx') return;
    GB.sfx(b.closest('#rail') ? 'nav' : (b.classList.contains('on') ? 'tap' : 'on'));
  }, true);

  // ------------------------------------------------------------- pages + rail
  // the rail, by how often you reach for it: PERFORM (the home screen + playing by hand), VISUALS (everyday looks, most used
  // first), PRO (the Pro DJ tools, or one gold tour key on Home), SYSTEM (lights + app, mostly one-time setup) at the bottom.
  const PAGES = GB.PAGES = [
    {id: 'music', label: 'MUSIC', c: '#e9e6ff', big: 2, g: 'perform'},   // Oct 16: pale white-lavender, so it stands apart from the pinks
    {id: 'dj', label: 'DJ', c: 'var(--red)', g: 'perform'},
    {id: 'looks', label: 'LOOKS', c: 'var(--amber)', g: 'visuals'},
    {id: 'scenes', label: 'SCENES', c: 'var(--lav)', g: 'visuals'},            // 🔥 the fireplace lives here now
    {id: 'feeds', label: 'LIVE', c: 'var(--green)', g: 'visuals'},
    {id: 'score', label: 'SPORTS', c: 'var(--violet)', g: 'visuals'},          // team scores + golf, racing, tennis, UFC boards
    {id: 'text', label: 'TEXT', c: 'var(--gold)', g: 'visuals'},
    {id: 'holiday', label: 'HOLIDAY', c: 'var(--cyan)', g: 'visuals'},         // moves up next to LOOKS when a holiday is close (seasonRail)
    {id: 'games', label: 'GAMES', c: 'var(--lime)', g: 'visuals'},
    {id: 'home', label: 'PRO HOME', c: '#ffb23d', pro: true, g: 'pro'},           // 🏠 Pro Home control center (prohome.js): its rail key shows only in Pro Home mode
    {id: 'shows', label: 'SHOWS', c: 'var(--orchid)', pro: true, g: 'pro'},
    {id: 'autoloops', label: 'LOOPS+CUES', c: '#3fb6ff', pro: true, g: 'pro'},   // 🔁🎞️ Autoloops + Scenes + tempo toolbox (autoloops.js)
    {id: 'cues', label: 'CUES', c: '#7dffb2', pro: true, g: 'pro', rail: 'autoloops'},   // 🎬 cue lists + GO (cues.js): shares the LOOPS & CUES key (a switch on top), so the phone rail still fits
    {id: 'board', label: 'LIVE BOARD', c: '#4de8c8', pro: true, g: 'pro'},     // 🎚️🔁 Fader board + Loop banks
    {id: 'ops', label: 'OVERRIDE', c: '#ff5c7a', pro: true, g: 'pro'},
    {id: 'pro', label: 'PRO', c: 'var(--gold)', home: true, g: 'pro', ic: 'sparkle'},   // ✨ Home: the Pro DJ tour
    {id: 'lights', label: 'LIGHTS', c: 'var(--peri)', g: 'system'},
    {id: 'setup', label: 'SETUP', c: 'var(--dim)', g: 'system'},
  ];
  const GROUPS = GB.RAIL_GROUPS = {perform: 'PERFORM', visuals: 'VISUALS', pro: 'PRO', system: 'SYSTEM'};
  // old or friendly links (#help, #sports, #fire ...) land on the right page; values are [page, anchor]
  const PAGE_ALIAS = {help: ['setup', 'helpPanel'], light: ['lights'], devices: ['lights'], map: ['lights'], groups: ['lights', 'grpPanel'],
    sports: ['score'], live: ['feeds'], override: ['ops'], license: ['setup', 'suLicKeyBox'],
    fire: ['scenes', 'firePanel'], fireplace: ['scenes', 'firePanel'], mirror: ['scenes', 'mirrorPanel'],
    golf: ['score'], nascar: ['score'], racing: ['score'], tennis: ['score'], ufc: ['score'],   // boards open from SPORTS > Live Fan
    liveboard: ['board'], faders: ['board', 'fdPanel'], loops: ['board', 'lpPanel'], padrecorder: ['board', 'lpPanel'], palettes: ['board', 'palPanel'],
    autoloop: ['autoloops'], tempo: ['autoloops', 'alTempo'], myscenes: ['autoloops', 'alPanel'], cue: ['cues'], go: ['cues'], zones: ['ops', 'znPanel'], interlude: ['ops', 'ilPanel'], upgrade: ['pro'], tour: ['pro']};
  const panels = {};                        // pageId -> [{order, fn}]
  GB.panel = (page, order, fn) => { (panels[page] = panels[page] || []).push({order, fn}); };
  GB.page = 'music';
  const pageOf = elId => { const a = elId && $(elId), pg = a && a.closest && a.closest('.page'); return pg ? pg.id.slice(3) : null; };
  GB.go = (id, anchor) => {
    if (!PAGES.some(p => p.id === id)) {                     // not a page: an alias, or a panel id (#lightsPanel) whose page we find
      const al = Object.prototype.hasOwnProperty.call(PAGE_ALIAS, id) ? PAGE_ALIAS[id] : null, pg = al ? null : pageOf(id);
      if (al) { id = al[0]; anchor = anchor || al[1]; } else if (pg) { anchor = anchor || id; id = pg; } else id = 'music';
    } else if (anchor) { const pg = pageOf(anchor); if (pg && pg !== id) id = pg; }   // a panel that moved pages (faders: DJ -> LIVE BOARD)
    const want = PAGES.find(p => p.id === id);
    if (!fits(want)) { id = want.pro ? 'pro' : 'shows'; anchor = null; }   // Home -> the PRO tour, Pro -> SHOWS
    GB.page = id; store.set('gb_page', id);
    const rk = (PAGES.find(p => p.id === id) || {}).rail || id;          // a page that shares a rail key (CUES -> LOOPS & CUES) lights that key
    document.querySelectorAll('#rail button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === rk));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'pg-' + id));
    const pg = PAGES.find(p => p.id === id); document.documentElement.style.setProperty('--pagec', pg.c);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    document.body.dataset.page = id; if (PV.length) drawSetup(PV);
    GB.emit('page', id);
    if (anchor && $(anchor)) setTimeout(() => $(anchor).scrollIntoView({behavior: 'smooth', block: 'start'}), 60);
    else if (innerWidth < 1000 || innerHeight > innerWidth) window.scrollTo(0, 0);
  };
  function mount(p, pg) {
    (panels[p.id] || []).sort((a, b) => a.order - b.order).forEach(({fn}) => {
      const el = document.createElement('div'); el.className = 'panel'; pg.appendChild(el);
      try { fn(el); } catch (e) { console.error('panel ' + p.id, e); el.innerHTML = '<p class="note">This part could not load.</p>'; }
    });
  }
  function buildPages() {
    const rail = $('rail'), host = $('pages');
    PAGES.forEach((p, i) => {
      if (i && p.g !== PAGES[i - 1].g) {                          // a quiet labelled gap between the PERFORM / VISUALS / SYSTEM groups
        const sep = document.createElement('div'); sep.className = 'rail-sep'; sep.dataset.g = p.g; sep.setAttribute('aria-hidden', 'true');
        sep.innerHTML = (p.g === 'pro' ? GB.svg('star') : '') + '<span>' + GROUPS[p.g] + '</span>'; rail.appendChild(sep);
        if (p.g === 'pro') sep.hidden = true;
      }
      const pg = document.createElement('section'); pg.className = 'page'; pg.id = 'pg-' + p.id; pg.setAttribute('aria-label', p.label); pg.style.setProperty('--c', p.c);
      if (p.rail) { host.appendChild(pg); mount(p, pg); return; }                // no key of its own: reached from its sibling page's switch
      const b = document.createElement('button'); b.dataset.p = p.id; b.dataset.g = p.g; b.style.setProperty('--c', p.c);
      b.innerHTML = '<span class="rl">' + GB.esc(p.label) + '</span>' + (p.ic ? GB.svg(p.ic) : ''); b.setAttribute('aria-label', p.home ? 'Pro DJ: see what it adds' : p.label);
      if (p.pro || p.home) b.hidden = true;                          // shown once the license is known (paintRailPro)
      b.onclick = () => GB.go(p.id); rail.appendChild(b);          // (MUSIC's bigger key: app.css, #rail button[data-p=music])
      host.appendChild(pg); mount(p, pg);
    });
    const tail = document.createElement('div'); tail.className = 'tail'; rail.appendChild(tail);
  }

  // 🎃 seasonal: when one of your holidays is on or within 10 days, HOLIDAY moves up next to LOOKS (back to its spot after)
  function seasonRail(cat) {
    const rail = $('rail'), hb = rail && rail.querySelector('button[data-p=holiday]'), looks = rail && rail.querySelector('button[data-p=looks]');
    const home = rail && rail.querySelector('button[data-p=games]'); if (!hb || !looks || !home) return;
    const c = cat && cat.holiday_cal, info = (c && !c.error && c.info) || {};
    const near = ((c && c.mine) || []).some(k => info[k] && (info[k].now || (info[k].days >= 0 && info[k].days <= 10)));
    if (near) { if (looks.nextElementSibling !== hb) rail.insertBefore(hb, looks.nextElementSibling); hb.classList.add('soon'); }
    else { if (home.previousElementSibling !== hb) rail.insertBefore(hb, home); hb.classList.remove('soon'); }
  }

  // ------------------------------------------------------------- ✨ PRO tour (Home DJ only): what Pro adds, one tap to upgrade
  const PREVIEW = {                                                // tiny drawings, no images: a hint of each tool
    shows: () => '<div class="pt-tl">' + [['var(--amber)', [[4, 30], [38, 26], [70, 26]]], ['var(--pink)', [[12, 10], [44, 8], [76, 12]]], ['var(--cyan)', [[0, 56], [60, 40]]]]
      .map(([c, bs]) => '<i>' + bs.map(([l, w]) => `<b style="left:${l}%;width:${w}%;background:${c}"></b>`).join('') + '</i>').join('') + '<u></u></div>',
    faders: () => '<div class="pt-fd">' + [[70, 'var(--gold)'], [45, 'var(--cyan)'], [20, '#fff'], [60, 'var(--pink)'], [35, '#fff'], [52, 'var(--violet)']]
      .map(([v, c]) => `<i><b style="bottom:${v}%;background:${c}"></b></i>`).join('') + '</div>',
    loops: () => '<div class="pt-lp">' + ['var(--pink)', 'var(--cyan)', 'var(--lime)', 'var(--amber)'].map((c, i) => `<i style="--bc:${c}"${i === 1 ? ' class="on"' : ''}></i>`).join('')
      + ['var(--pink)', 'var(--cyan)', 'var(--lime)', 'var(--amber)'].map((c, i) => `<i style="--bc:${c}"${i === 2 ? ' class="on"' : ''}></i>`).join('') + '</div>',
    override: () => '<div class="pt-ov">' + ['#000', '#fff', '#f4f2ff', 'var(--gold)', 'var(--red)', 'var(--cyan)', 'var(--orchid)', 'var(--green)']
      .map(c => `<i style="background:${c}"></i>`).join('') + '</div>',
    interlude: () => '<div class="pt-il"><span>BE RIGHT BACK</span></div>',
    autoloops: () => '<div class="pt-lp">' + ['#ff3d9a', '#33d6ff', '#c3ff4d', '#3fb6ff', '#9b3dff', '#ffd21a', '#4de8c8', '#ff6b6b'].map((c, i) => `<i style="--bc:${c}"${i === 5 ? ' class="on"' : ''}></i>`).join('') + '</div>',
    scenes: () => '<div class="pt-sc">' + [['#ff1aa8', '#00e5ff', '#7a1aff'], ['#ffc400', '#ffffff', '#ff8a00'], ['#1aff5a', '#00995c', '#d9ff1a']].map((cs, i) => `<i${i === 1 ? ' class="on"' : ''}>${cs.map(c => `<b style="background:${c}"></b>`).join('')}</i>`).join('') + '</div>',
    cues: () => '<div class="pt-cu"><span><b>3</b>FIRST DANCE</span><span><b>4</b>CAKE</span><u>GO</u></div>',
    tempo: () => '<div class="pt-tp"><span>128.0</span><small>BPM · LOCK</small><i></i><i class="on"></i><i></i><i></i></div>',
    zones: () => '<div class="pt-zn"><i class="on"></i><i></i><i></i><i class="on"></i></div>',
    palettes: () => '<div class="pt-pl">' + ['#ff1aa8', '#00e5ff', '#7a1aff', '#00ff66', '#ffc400'].map(c => `<i style="background:${c}"></i>`).join('') + '</div>',
  };
  GB.proKey = () => {                                               // "I have a Pro key": SETUP's license box, opened and ready
    GB.go('setup', 'suLicKeyBox');
    setTimeout(() => { const d = $('suLicKeyBox'), i = $('suLicKey'); if (d) d.open = true; if (i) try { i.focus({preventScroll: true}); } catch (e) { i.focus(); } }, 120);
  };
  GB.panel('pro', 10, el => {
    el.classList.add('box', 'pt-hero'); el.style.setProperty('--c', 'var(--gold)'); el.id = 'proTour';
    el.innerHTML = `<div class="ph"><span>GlowBop Pro DJ</span><span class="r">FOR EVENTS</span></div>
      <h2 class="pt-h">Play your lights like an instrument</h2>
      <p class="note">Everything you have now stays. Pro DJ adds a full lighting desk for parties, DJ sets and events, in four new tabs: LOOPS+CUES, SHOWS, LIVE BOARD and OVERRIDE.</p>
      <div class="pt-cta"><button class="btn c lg pt-buy" style="--c:var(--gold)">${GB.svg('star')}<span>Upgrade to Pro</span></button>
        <button class="pt-key" type="button">I have a Pro key</button></div>`;
    el.querySelector('.pt-buy').onclick = () => window.open(GB.buyPro, '_blank', 'noopener');
    el.querySelector('.pt-key').onclick = GB.proKey;
  });
  GB.panel('pro', 20, el => {
    el.classList.add('pt-feats');
    GB.css(`.pt-sc { height:100%; display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; } .pt-sc i { display:flex; border-radius:4px; overflow:hidden; border:1px solid #3a3456; } .pt-sc i b { flex:1; }
      .pt-sc i.on { box-shadow:0 0 0 2px #fff, 0 0 10px #8fd3ff; }
      .pt-cu { height:100%; display:grid; grid-template-columns:1fr 1fr auto; gap:5px; align-items:stretch; } .pt-cu span { display:flex; align-items:center; gap:5px; padding:0 6px; border-radius:4px; background:#14111f; font:600 10px var(--cond); letter-spacing:1px; color:var(--dim); white-space:nowrap; overflow:hidden; }
      .pt-cu span b { color:#7dffb2; font:11px var(--mono); } .pt-cu span:first-child { box-shadow:inset 3px 0 0 #7dffb2; color:#fff; }
      .pt-cu u { text-decoration:none; display:grid; place-items:center; padding:0 12px; border-radius:0 10px 0 10px; background:#7dffb2; color:#000; font:800 15px var(--cond); letter-spacing:3px; }
      .pt-tp { height:100%; display:flex; align-items:center; gap:6px; } .pt-tp span { font:24px/1 var(--mono); color:#3fb6ff; } .pt-tp small { font:600 9px var(--cond); letter-spacing:1px; color:var(--dim); margin-right:auto; }
      .pt-tp i { width:14px; height:7px; border-radius:3px; background:#1d1930; } .pt-tp i.on { background:#3fb6ff; box-shadow:0 0 8px #3fb6ff; }
      .pt-zn { height:100%; display:grid; grid-template-columns:repeat(4, 1fr); gap:3px; } .pt-zn i { border-radius:3px; background:#14111f; } .pt-zn i.on { background:#4de8c8; box-shadow:0 0 10px #4de8c8; }
      .pt-pl { height:100%; display:flex; border-radius:6px; overflow:hidden; } .pt-pl i { flex:1; }`);
    el.innerHTML = PRO_FEATURES.map(f => `<div class="pt-f" style="--c:${f.c}">
        <span class="pt-ic">${GB.svg(f.ic)}</span>
        <div class="pt-tx"><b>${GB.esc(f.name)}</b><small>in ${GB.esc(f.tab)}</small><p>${GB.esc(firstLine(f.pitch))}</p></div>
        <div class="pt-prev" aria-hidden="true">${PREVIEW[f.prev]()}</div></div>`).join('');
  });
  GB.panel('pro', 30, el => {
    el.classList.add('pt-foot');
    el.innerHTML = `<button class="btn c wide pt-buy" style="--c:var(--gold)">${GB.svg('star')}<span>Upgrade to Pro</span></button>
      <p class="note">Already bought it? <button class="pt-key" type="button">Enter your Pro key</button> in SETUP. It replaces the Home key on this computer.</p>`;
    el.querySelector('.pt-buy').onclick = () => window.open(GB.buyPro, '_blank', 'noopener');
    el.querySelector('.pt-key').onclick = GB.proKey;
  });

  // ------------------------------------------------------------- 🖼️ the live wall (every group side by side at its true shape)
  const DEVCOL = GB.DEVCOL = ['#ff3d9a', '#33d6ff', '#3ce08a', '#ffc04d', '#c58bff', '#ff7a3d'];
  const hexRGB = h => (typeof h === 'string') ? h.match(/.{6}/g) || [] : h;
  let PV = [], PVHIT = [], FULL = false, cv, cx;
  // 🧊 curtains wrapped around a cylinder / box / globe: a turning 3D model with the real lights on it (drag to spin)
  const V3 = {yaw: 0.6, pitch: 0.38, drag: null, moved: false, t: performance.now()};
  function pt3(kind, lon, lat, lid, rl) {
    if (kind === 'globe') { const th = (lid ? rl * 0.15 : lat) * Math.PI; return [Math.sin(th) * Math.cos(lon), Math.cos(th), Math.sin(th) * Math.sin(lon)]; }
    let x, z;
    if (kind === 'box') { const q = ((lon / (2 * Math.PI)) * 4) % 4, sd = Math.floor(q), f = q - sd - 0.5;
      [x, z] = sd === 0 ? [f * 2, -1] : sd === 1 ? [1, f * 2] : sd === 2 ? [-f * 2, 1] : [-1, -f * 2]; }
    else { x = Math.cos(lon); z = Math.sin(lon); }
    if (lid) return [x * rl, 1, z * rl];
    return [x, 1 - 2 * lat, z];
  }
  function draw3D(b, cssW, maxCssH, dpr) {
    const sh = b.shape, kind = sh.kind, rgb = hexRGB(b.rgb), gw = b.gw || b.w, gh = b.gh || b.h, sx = b.w / gw, sy = b.h / gh;
    const cssH = Math.round(Math.min(maxCssH, cssW * 0.78));
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr); cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#05040a'; cx.fillRect(0, 0, cssW, cssH);
    const now = performance.now(); if (!V3.drag) V3.yaw += (now - V3.t) / 1000 * 0.35; V3.t = now;
    const cy0 = Math.cos(V3.yaw), sy0 = Math.sin(V3.yaw), cp = Math.cos(V3.pitch), sp = Math.sin(V3.pitch);
    const scale = Math.min(cssW * (kind === 'box' ? 0.3 : 0.36), cssH * (kind === 'globe' ? 0.42 : 0.34)), ox = cssW / 2, oy = cssH / 2;
    const W = Math.round(sh.wrap * sx), B = Math.round(sh.band * sx), T = sh.top * sy, sideH = Math.max(1, b.h - T);
    const col = (x, y) => { let c = rgb[y * b.w + x] || '000000';
      if (x < B && W + x < b.w) { const k = (x + 0.5) / B, c2 = rgb[y * b.w + W + x] || '000000', m = (i) => Math.round(parseInt(c.substr(i, 2), 16) * k + parseInt(c2.substr(i, 2), 16) * (1 - k)).toString(16).padStart(2, '0'); c = m(0) + m(2) + m(4); }
      return c; };
    const pts = [], dotR = Math.max(1.1, Math.min(5, Math.min(2 * Math.PI * scale / Math.max(8, W), (kind === 'globe' ? Math.PI : 2) * scale / Math.max(4, sideH)) * 0.42));
    for (let y = 0; y < b.h; y++) for (let x = 0; x < W; x++) {
      const lid = y < T, lon = (x / W) * 2 * Math.PI, lat = Math.min(1, Math.max(0, (y - T) / Math.max(1, sideH - 1))), rl = Math.min(1, (y + 0.5) / Math.max(1, T));
      const p = pt3(kind, lon, lat, lid, rl);
      let X = p[0] * cy0 - p[2] * sy0, Z = p[0] * sy0 + p[2] * cy0, Y = p[1];
      const Y2 = Y * cp - Z * sp, Z2 = Y * sp + Z * cp;
      pts.push([Z2, ox + X * scale, oy - Y2 * scale, col(x, y)]);
    }
    pts.sort((a, b2) => a[0] - b2[0]);
    for (const [z, px, py, c] of pts) {
      const lit = c !== '000000', back = z < -0.05;
      cx.globalAlpha = back ? 0.28 : 1; cx.fillStyle = lit ? '#' + c : '#1a1626';
      cx.beginPath(); cx.arc(px, py, lit ? dotR : dotR * 0.55, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1;
    const r = $('wallInfo'); if (r) r.textContent = kind.toUpperCase() + ' · DRAG TO SPIN';
    PVHIT = [];
  }
  GB.redrawWall = () => { if (PV.length) drawSetup(PV); };
  function drawSetup(blocks) {
    PV = blocks; if (!blocks.length) return;
    if (blocks.length === 1 && blocks[0].shape) {
      const dpr = Math.min(2, window.devicePixelRatio || 1), box = $('wallBox'), cssW = FULL ? innerWidth : Math.max(120, (box.clientWidth - 20) || 360);
      const wide = innerWidth >= 1000 && innerWidth >= innerHeight, compact = !wide && (GB.page !== 'music' || innerWidth < 700);   // phone: compact on MUSIC too, so its controls are on the first screen
      return draw3D(blocks[0], cssW, FULL ? innerHeight - 40 : ($('wallBox').closest('.lay-it') ? Math.max(50, $('wallBox').clientHeight - 20) : 0) || (compact ? Math.max(GB.page === 'music' ? 120 : 150, innerHeight * (GB.page === 'music' ? 0.16 : 0.26)) : Math.max(240, Math.min(620, innerHeight * (wide ? 0.46 : 0.5)))), dpr);
    }
    const many = blocks.length > 1, dpr = Math.min(2, window.devicePixelRatio || 1);
    const gap = 2, totW = blocks.reduce((a, b) => a + b.w, 0) + gap * (blocks.length - 1), maxH = Math.max(...blocks.map(b => b.h));
    const anyDev = blocks.some(b => (b.devices || []).length > 1);
    const box = $('wallBox'), cssW = FULL ? innerWidth : Math.max(120, (box.clientWidth - 20) || 360);
    const lab = (many ? 18 : 0) + (anyDev ? 16 : 0);
    const wide = innerWidth >= 1000 && innerWidth >= innerHeight, compact = !wide && (GB.page !== 'music' || innerWidth < 700);   // phone: compact on MUSIC too, so its controls are on the first screen
    const inLay = !FULL && box.closest('.lay-it');                      // ✏️ arranged console: the picture fits whatever box size you gave the Live wall
    const maxCssH = FULL ? innerHeight - 40 : inLay ? Math.max(50, box.clientHeight - 20) : compact ? Math.max(GB.page === 'music' ? 110 : 130, innerHeight * (GB.page === 'music' ? 0.15 : 0.24)) : Math.max(220, Math.min(620, innerHeight * (wide ? 0.44 : 0.5)));
    const st = Math.min(cssW / totW, (maxCssH - lab) / maxH);
    const cssH = Math.round(lab + maxH * st), drawW = totW * st, ox0 = (cssW - drawW) / 2;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.fillStyle = '#05040a'; cx.fillRect(0, 0, cssW, cssH);
    let ox = ox0; PVHIT = [];
    blocks.forEach(b => {
      const rgb = hexRGB(b.rgb), r = st * 0.42, top = lab, sel = many && GB.gsel === b.id;
      for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
        const c = rgb[y * b.w + x], px = ox + x * st + st / 2, py = top + y * st + st / 2;
        if (!c || c === '000000') { cx.fillStyle = '#16121f'; cx.beginPath(); cx.arc(px, py, r * 0.55, 0, 6.283); cx.fill(); continue; }
        cx.fillStyle = '#' + c; cx.beginPath(); cx.arc(px, py, r, 0, 6.283); cx.fill();
      }
      cx.font = "600 12px 'Saira Condensed', system-ui"; cx.textBaseline = 'top';
      if (many) { cx.fillStyle = sel ? '#ff3d9a' : '#bbb';                    // selected group: a drawn play marker (a ▶ glyph turns into an emoji on iOS)
        if (sel) { cx.beginPath(); cx.moveTo(ox + 2, 3); cx.lineTo(ox + 9, 7.5); cx.lineTo(ox + 2, 12); cx.closePath(); cx.fill(); }
        cx.fillText(b.name.toUpperCase(), ox + (sel ? 13 : 2), 2); }
      if ((b.devices || []).length > 1) b.devices.forEach((d, k) => {
        const col = DEVCOL[k % DEVCOL.length]; cx.strokeStyle = col + '88'; cx.lineWidth = 1;
        cx.strokeRect(ox + d.x0 * st + 0.5, top + d.y0 * st + 0.5, (d.x1 - d.x0 + 1) * st - 1, (d.y1 - d.y0 + 1) * st - 1);
        cx.fillStyle = col; cx.font = "11px 'Saira Condensed', system-ui"; cx.fillText(d.name.slice(0, Math.max(4, Math.floor((d.x1 - d.x0 + 1) * st / 7))), ox + d.x0 * st + 2, (many ? 18 : 0) + 1);
      });
      if (sel) { cx.strokeStyle = '#ff3d9a'; cx.lineWidth = 2; cx.strokeRect(ox - 1, top - 1, b.w * st + 2, b.h * st + 2); }
      PVHIT.push({id: b.id, name: b.name, x0: ox, x1: ox + b.w * st});
      ox += (b.w + gap) * st;
    });
    const bulbs = blocks.reduce((a, b) => a + b.w * b.h, 0);
    const r = $('wallInfo'); if (r) r.textContent = (blocks.length > 1 ? blocks.length + ' GROUPS · ' : '') + bulbs + ' BULBS';
  }
  GB.setFull = on => {
    FULL = on; $('wallBox').classList.toggle('full', on); document.body.classList.toggle('wallfull', on);
    if (on) { try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
              try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }
    else { try { document.fullscreenElement && document.exitFullscreen(); } catch (e) {} }
    if (PV.length) drawSetup(PV);
  };
  async function frameLoop() {
    try {
      const r = await GB.get('/api/frames');
      if (r.groups && r.groups.length) drawSetup(r.groups.map(g => g.shape ? g : Object.assign(g, {shape: null})));
      else { const f = await GB.get('/api/frame'); if (f.rgb && f.rgb.length) drawSetup([{id: f.id || '', name: f.name || '', w: f.w, h: f.h, rgb: f.rgb, devices: f.devices || []}]); }
      GB.lastOk = Date.now();
    } catch (e) {}
    setTimeout(frameLoop, document.hidden ? 1000 : 120);
  }
  function renderGroups(force) {
    const gs = (GB.status && GB.status.groups) || [], bar = $('grpBar');
    if (gs.length < 2) { bar.hidden = true; if (GB.gsel) GB.gsel = ''; return; }
    if (GB.gsel && !gs.some(g => g.id === GB.gsel)) GB.gsel = '';
    const key = JSON.stringify(gs.map(g => [g.id, g.name])) + GB.gsel; if (!force && bar._k === key) return; bar._k = key;
    bar.hidden = false; bar.innerHTML = '';
    [{id: '', name: 'All groups'}].concat(gs).forEach(g => { const c = document.createElement('button'); c.className = 'chip' + (g.id === GB.gsel ? ' on' : '');
      c.textContent = g.name; c.onclick = () => GB.pickGroup(g.id, g.name); bar.appendChild(c); });
  }

  // ------------------------------------------------------------- status: readouts, mode bar, license gate, connection
  const meterN = 24;
  function mode(s, cat) {
    const hol = s.holiday && cat && cat.holidays && cat.holidays[s.holiday];
    if (s.power === false) return {c: 'var(--red)', t: 'Lights off', sub: 'tap Back to music to turn them on', btn: 1};
    const il = (s.override || {}).interlude;
    if (il && il.on) return {c: 'var(--lav)', ic: 'mic', t: 'Interlude' + (il.look === 'text' && il.text ? ': ' + il.text : ''), sub: (il.auto_started ? 'the music stopped, it comes back by itself' : 'the wall is calm and ignores the music') + ' · tap to bring the show back', btn: 1, il: 1, act: async () => { if (await GB.post('/api/override', {interlude: false})) { GB.sfx('ok'); GB.toast('🎵 Back to the show'); } }};
    if (s.dj && s.dj.blackout) return {c: 'var(--red)', ic: 'dj', t: 'Blackout', sub: 'DJ mode: the wall is held dark', btn: 1};
    if (s.dj && s.dj.tap_bpm) return {c: 'var(--red)', ic: 'dj', t: 'DJ tempo ' + s.dj.tap_bpm + ' BPM', sub: 'the show follows your taps', btn: 1};
    const fd = s.feeds || {};
    if (fd.alert) return {c: 'var(--red)', ic: 'warn', t: fd.alert, sub: 'storm watch alert on the wall', btn: 'Stop', act: async () => { if (await GB.post('/api/feeds', GB.withGroup({feed: 'storm', stop: true}))) GB.toast('Alert cleared from the wall'); }};
    if (fd.title) return {c: 'var(--green)', t: 'Live: ' + fd.title, sub: 'on the wall until you turn it off' + ((fd.watching || []).length ? ' · watching ' + fd.watching.join(', ') : ''), btn: 'Stop', act: async () => { if (await GB.post('/api/feeds', GB.withGroup({mode: 'off'}))) GB.toast('🎵 Back to the music show'); }};
    if (s.scoreboard) return {c: 'var(--violet)', ic: 'trophy', t: 'Scoreboard', sub: 'on the wall until you turn it off', btn: 1};
    if (s.fireplace && s.fireplace.on) { const fp = s.fireplace; return {c: 'var(--orange)', ic: 'fire', t: 'Fireplace', sub: (fp.color || 'classic') + (fp.mode === 'roar' ? ' · roaring' : ' · cozy') + (fp.dance ? ' · dancing with the music' : ''), btn: 'Put out', act: async () => { if (await GB.fire({on: false})) GB.toast('🎵 Fire is out. Back to the music show'); }}; }
    if (s.mirror) return {c: 'var(--cyan)', t: 'Screen mirror', sub: ({straight: 'TV style', beat: 'with the beat', ambient: 'ambient glow'}[s.mirror.style] || '') + ' · ' + (s.mirror.area === 'center' ? 'center zoom' : 'smart fill'), btn: 'Stop', act: async () => { if (await GB.control({mirror: null})) GB.toast('🎵 Back to the music show'); }};
    if (hol) return {c: 'var(--cyan)', t: 'Holiday: ' + hol.name + ' ' + hol.emoji, sub: 'only ' + hol.name + ' effects, cycling with the music', btn: 'Stop', act: async () => { if (await GB.control({holiday: null})) GB.toast('🎵 Back to the music show'); }};
    if (s.scene) return {c: 'var(--lav)', t: 'Scene: ' + s.scene.name, sub: `part ${s.scene.segment} of ${s.scene.segments}`, btn: 'Stop', act: async () => { if (await GB.post('/api/scene/stop', {})) GB.toast('🎵 Back to the music show'); }};
    const so = s.show || {};
    if (so.active) return {c: 'var(--orchid)', ic: 'movie', t: 'Song Show: ' + (so.title || 'this song'), sub: (so.pos != null ? GB.fmt(so.pos) + (so.dur ? ' / ' + GB.fmt(so.dur) : '') : 'on the beat') + (so.next ? ' · next: ' + (so.next.what || so.next.lane) + ' ' + GB.fmt(so.next.t) : ''), btn: 1};
    const pd = s.prodj || {};
    if (pd.pro && pd.blackout > 0.5) return {c: 'var(--red)', ic: 'lists', t: 'Cue: Blackout', sub: 'from the cue list · GO for the next cue', btn: 1};
    if (pd.pro && pd.loop) return {c: '#3fb6ff', ic: 'loop', t: (pd.loop.kind === 'scene' ? 'Scene: ' : 'Autoloop: ') + pd.loop.name, sub: (pd.opts && pd.opts.mode === 'advance' && pd.loop.kind === 'loop' ? 'auto-advance every ' + pd.opts.bars + ' bars' : 'held until you change it') + (pd.palette ? ' · palette on' : ''), btn: 'Release', act: async () => { if (await GB.post('/api/autoloops', {release: true})) GB.toast('🎵 Back to the auto show'); }};
    if (s.locked) return {c: 'var(--amber)', t: 'Locked: ' + s.locked, sub: 'the show keeps this effect until you release it', btn: 'Release', act: GB.release};
    if (s.held_look) return {c: 'var(--amber)', t: (s.pinned ? 'Pinned look: ' : 'Look for this song: ') + s.held_look, sub: s.pinned ? 'stays until you release it' : 'shuffle resumes on the next song', btn: 'Release', act: GB.release};
    return {c: 'var(--green)', t: 'Music show · listening', sub: ((s.feeds && (s.feeds.watching || []).length) ? '📡 ' + s.feeds.watching.join(' + ') + ' · ' : '') + (s.shuffle ? 'shuffle on · ' : '') + (s.listening ? 'hearing ' + s.listening.replace(' [Loopback]', '') : 'reacts to whatever is playing')};
  }
  let modeAct = null;
  async function statusLoop() {
    try {
      const s = GB.status = await GB.get('/api/status'); GB.lastOk = Date.now();
      $('licGate').classList.toggle('show', s.licensed === false);
      const gi = GB.grpInfo(), cat = GB.catalog;
      $('rBpm').innerHTML = s.bpm ? Math.round(s.bpm) + '<small> BPM</small>' : '–';
      $('rSec').textContent = (s.section || '–').toUpperCase();
      const hol = s.holiday && cat && cat.holidays && cat.holidays[s.holiday];
      $('rLook').textContent = gi ? gi.look : hol ? hol.emoji + ' ' + hol.name : (s.look || '–');
      $('rEff').innerHTML = gi ? GB.esc(gi.effect) : ((s.locked ? GB.svg('lock') : '') + GB.esc(s.effect || '–'));
      const lit = Math.round(Math.min(1, (s.level || 0) * 1.2) * meterN);
      $('rMeter').querySelectorAll('i').forEach((el, i) => el.style.background = i < lit ? (i < 9 ? 'var(--cyan)' : i < 15 ? 'var(--violet)' : i < 20 ? 'var(--pink)' : 'var(--amber)') : '');
      const an = s.analysis || {};
      $('rMore').innerHTML = [s.part ? 'Part: ' + GB.esc(s.part) : '', an.key ? GB.svg('note') + GB.esc(an.key) : '', GB.esc(an.mood || ''), an.known ? GB.svg('check') + 'known song' : '', s.calm > 0.5 ? GB.svg('moon') + 'calm' : ''].filter(Boolean).join(' · ');
      const m = mode(s, cat), mb = $('modeBar');
      mb.style.setProperty('--c', m.c); const tw = m.t.split(' ');                                      // the icon stays glued to the first word when the title wraps
      $('mT').innerHTML = m.ic ? '<span class="nw">' + GB.svg(m.ic) + GB.esc(tw[0]) + '</span>' + GB.esc(tw.length > 1 ? ' ' + tw.slice(1).join(' ') : '') : GB.esc(m.t); $('mS').textContent = m.sub;
      $('mBtn').hidden = !m.btn; modeAct = m.act; $('mBtn').innerHTML = GB.svg('note') + '<span>' + (m.il ? 'Back to the show' : 'Back to music') + '</span>';
      $('mBtn').setAttribute('aria-label', m.il ? 'End the interlude and bring the show back' : 'Turn it off and go back to the music show'); $('mBtn').dataset.il = m.il ? '1' : '';
      if (s.pro !== undefined) GB.setPro(s.pro);
      const fd = s.faders || {}, fc = $('mFad'), nUp = (fd.away || []).length + (fd.flash || []).length;
      if (fc) { fc.hidden = !(fd.active && GB.pro !== false); if (!fc.hidden) {
        fc.innerHTML = GB.svg('faders') + '<span class="w">FADERS</span><b>' + ((fd.flash || []).length ? 'FLASH' : nUp) + '</b>';
        fc.setAttribute('aria-label', 'Fader board: ' + (fd.away || []).join(', ') + ' away from default. Open it.'); fc.title = 'Faders away from default: ' + (fd.away || []).join(', '); } }
      const ov = s.override || {}, oc = $('mOvr');                   // 🚨 OVERRIDE ACTIVE: one tap releases them all
      if (oc) { oc.hidden = !(ov.active && GB.pro !== false); if (!oc.hidden) {
        const nm = (ov.keys || []).filter(k => k.on).map(k => k.label);
        oc.innerHTML = GB.svg('ovr') + '<span>OVERRIDE<span class="w2"> ACTIVE</span></span><b>' + nm.length + '</b>';
        oc.setAttribute('aria-label', 'Override active: ' + nm.join(', ') + '. Tap to release all.'); oc.title = 'Override active: ' + nm.join(', ') + '. Tap to release all.'; } }
      renderGroups();
      GB.emit('status', s);
    } catch (e) {}
    const live = Date.now() - GB.lastOk < 3000, ct = $('ctext');
    ct.textContent = live ? ((GB.status.groups || []).length > 1 ? (GB.status.groups.length + ' GROUPS LINKED · ONLINE') : 'ONLINE · ' + (GB.status.listening ? 'LISTENING' : 'READY')) : 'NOT CONNECTED';
    ct.classList.toggle('bad', !live);
    setTimeout(statusLoop, 1000);
  }
  async function loadCatalog() {
    try { GB.catalog = await GB.get('/api/catalog'); } catch (e) { return setTimeout(loadCatalog, 2000); }
    GB.emit('catalog', GB.catalog);
  }

  // ------------------------------------------------------------- 🔑 license gate
  function licenseGate() {
    $('licGo').onclick = async () => {
      const k = $('licKey').value.trim(); if (!k) { $('licMsg').textContent = 'Paste your key first.'; return; }
      $('licGo').disabled = true; $('licMsg').textContent = 'Checking with Polar…';
      const r = await GB.post('/api/license', {key: k}); $('licGo').disabled = false;
      if (!r) { $('licMsg').textContent = 'Not connected to GlowBop.'; return; }
      $('licMsg').textContent = r.message || '';
      if (r.licensed) { GB.sfx('ok'); GB.toast('🎉 GlowBop unlocked'); setTimeout(() => $('licGate').classList.remove('show'), 900); GB.emit('license', r); }
    };
    $('licKey').addEventListener('keydown', e => { if (e.key === 'Enter') $('licGo').click(); });
  }

  // ------------------------------------------------------------- ✨ sparkle logo: random LEDs of the Curtain Burst glint white
  function logoSVG() {                                          // 7x7 Curtain Burst, same as the app icon
    const host = $('gbLogo'); if (!host) return;
    const P = '#ff3d9a', V = '#9b3dff', C = '#33d6ff', W = '#ffffff', D = '#221d33';
    const M = [[D,D,C,C,C,D,D],[D,C,V,V,V,C,D],[C,V,P,P,P,V,C],[C,V,P,W,P,V,C],[C,V,P,P,P,V,C],[D,C,V,V,V,C,D],[D,D,C,C,C,D,D]];
    let c = ''; M.forEach((row, r) => row.forEach((col, k) => { c += `<circle cx="${9 + k * 13}" cy="${9 + r * 13}" r="4.6" fill="${col}" data-l="${col === D ? 0 : 1}"/>`; }));
    host.innerHTML = `<svg viewBox="0 0 96 96" aria-hidden="true"><defs><filter id="gbGlow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${c}</svg>`;
    // glint by setting the SVG attributes directly (fill + a slightly bigger dot): reliable in Safari on iPhone / iPad
    const lit = [...host.querySelectorAll('circle[data-l="1"]')];
    const glint = el => { if (el._on) return; el._on = 1; const f = el.getAttribute('fill');
      el.setAttribute('fill', '#ffffff'); el.setAttribute('r', '5.6');
      setTimeout(() => { el.setAttribute('fill', f); el.setAttribute('r', '4.6'); el._on = 0; }, 300); };
    const tick = () => { if (!document.hidden) { const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) glint(lit[(Math.random() * lit.length) | 0]); }
      setTimeout(tick, 250 + Math.random() * 450); };
    tick();
  }
  function sparkle() {
    logoSVG();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lit = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const d = Math.hypot(c - 3, r - 3); if (d > 0.5 && d < 3.4) lit.push([r, c]); }
    const pos = v => ((158 + v * 118) / 1024 * 100) + '%';
    document.querySelectorAll('img.gb-logo').forEach(img => {
      const w = document.createElement('span'); w.className = 'gb-tw'; img.parentNode.insertBefore(w, img); w.appendChild(img);
      const tick = () => {
        const n = 1 + (Math.random() < 0.6 ? 1 : 0);
        for (let k = 0; k < n; k++) { const [r, c] = lit[(Math.random() * lit.length) | 0], s = document.createElement('i'); s.style.left = pos(c); s.style.top = pos(r); w.appendChild(s); setTimeout(() => s.remove(), 650); }
        setTimeout(tick, 250 + Math.random() * 450);
      };
      tick();
    });
  }

  // a range input paints its own fill (the console bar): call after setting .value
  GB.paintRange = el => { const p = (el.value - el.min) / ((el.max - el.min) || 1) * 100; el.style.setProperty('--p', p + '%'); };
  document.addEventListener('input', e => { if (e.target.matches && e.target.matches('input[type=range]')) GB.paintRange(e.target); });

  // ------------------------------------------------------------- start
  GB.start = () => {
    buildPages();
    cv = $('wall'); cx = cv.getContext('2d');
    $('rMeter').innerHTML = '<i></i>'.repeat(meterN);
    cv.addEventListener('pointerdown', e => { if (!(PV[0] && PV[0].shape)) return; V3.drag = {x: e.clientX, y: e.clientY, yaw: V3.yaw, pitch: V3.pitch}; V3.moved = false; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
    cv.addEventListener('pointermove', e => { if (!V3.drag) return; const dx = e.clientX - V3.drag.x, dy = e.clientY - V3.drag.y; if (Math.abs(dx) + Math.abs(dy) > 4) V3.moved = true;
      V3.yaw = V3.drag.yaw - dx * 0.012; V3.pitch = Math.max(-0.2, Math.min(1.2, V3.drag.pitch + dy * 0.008)); if (PV.length) drawSetup(PV); });
    const endDrag = () => { V3.drag = null; }; cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
    cv.style.touchAction = 'pan-y';
    $('wallBox').addEventListener('click', e => {
      if (e.target.closest('.fullx')) return GB.setFull(false);
      if (V3.moved) { V3.moved = false; return; }
      if (PVHIT.length < 2) { if (!FULL) GB.setFull(true); return; }
      const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left);
      const h = PVHIT.find(p => x >= p.x0 - 4 && x <= p.x1 + 4); if (!h) return;
      GB.pickGroup(GB.gsel === h.id ? '' : h.id, h.name);
    });
    $('wFull').onclick = () => GB.setFull(true);
    $('wMirror').onclick = () => GB.go('scenes', 'mirrorPanel');
    $('wMap').onclick = () => GB.go('lights');                     // 💡 the LIGHTS page: find, group, arrange and map your lights
    $('mBtn').onclick = () => ($('mBtn').dataset.il && modeAct) ? modeAct() : GB.backToMusic();
    if ($('mOvr')) $('mOvr').onclick = async () => { if (GB.overrideRelease) return GB.overrideRelease(); if (await GB.post('/api/override', {release: true})) GB.toast('✅ Overrides released'); };
    if ($('mFad')) $('mFad').onclick = () => GB.go('board', 'fdPanel');
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && FULL) GB.setFull(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && FULL) GB.setFull(false); });
    let rz = null; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (PV.length) drawSetup(PV); }, 80); });
    $('sfx').onclick = () => { sfxOn = !sfxOn; store.set('gb_sfx', sfxOn ? '1' : '0'); sfxButton(); if (sfxOn) GB.sfx('ok'); };
    sfxButton(); licenseGate(); sparkle();
    $('ftHelp').onclick = () => GB.go('setup', 'helpPanel');
    const want = (location.hash || '').slice(1) || store.get('gb_page', 'music');
    GB.go(want);
    document.querySelectorAll('input[type=range]').forEach(GB.paintRange);
    paintRailPro(); GB.on('catalog', seasonRail);
    loadCatalog(); statusLoop(); frameLoop(); GB.loadPro(); GB.on('license', r => GB.setPro(r && r.pro, r));
    let uiv = null;                                               // 🔄 app files updated on the laptop? reload (unless you're typing)
    const verCheck = async () => { try { const v = (await GB.get('/api/uiver')).v;
      if (uiv == null) uiv = v; else if (v && v !== uiv) { const a = document.activeElement;
        if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { GB.toast('✨ GlowBop updated, reloading…'); setTimeout(() => location.reload(), 900); return; } } } catch (e) {}
      setTimeout(verCheck, 20000); };
    setTimeout(verCheck, 3000);
    GB.emit('ready');
  };
})();
