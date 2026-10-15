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
      const j = await r.json(); if (!r.ok || j.error) { GB.toast('⚠️ ' + (j.error || r.status)); GB.sfx('err'); return null; } return j;
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
    await Promise.all(jobs);
    GB.sfx('ok'); GB.toast('🎵 Back to the music show');
    if (GB.feedsRefresh) GB.feedsRefresh(100);
  };
  GB.release = async () => { if (await GB.control({release: true, lock_effect: null})) GB.toast('🌊 Flowing with the music again'); };

  // ------------------------------------------------------------- icons (24x24 paths)
  const ICON = GB.ICON = {
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
  };
  GB.svg = (n, extra) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"${extra || ''}><path d="${ICON[n] || ''}"/></svg>`;
  GB.css = text => { const st = document.createElement('style'); st.textContent = text; document.head.appendChild(st); };
  GB.lbl = (el, ic, text) => { el.innerHTML = (ic ? GB.svg(ic) : '') + '<span>' + GB.esc(text) + '</span>'; };

  // a pop-up list (choose a playlist etc.): items = [{label, sub, onclick}]
  GB.sheet = (head, items) => {
    const s = document.createElement('div'); s.className = 'sheet';
    s.innerHTML = `<div><div class="ph" style="--c:var(--lav)">${GB.esc(head)}</div></div>`;
    const box = s.firstChild;
    items.forEach(it => { const b = document.createElement('button'); b.className = 'btn wide'; b.style.justifyContent = 'flex-start';
      b.innerHTML = GB.esc(it.label) + (it.sub ? ` <small style="opacity:.6;text-transform:none">${GB.esc(it.sub)}</small>` : '');
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
  const PAGES = GB.PAGES = [
    {id: 'music', label: 'MUSIC', c: 'var(--pink)', big: 2},
    {id: 'dj', label: 'DJ', c: 'var(--red)'},
    {id: 'looks', label: 'LOOKS', c: 'var(--amber)'},
    {id: 'games', label: 'GAMES', c: 'var(--lime)'},
    {id: 'scenes', label: 'SCENES', c: 'var(--lav)'},
    {id: 'holiday', label: 'HOLIDAY', c: 'var(--cyan)'},
    {id: 'fire', label: 'FIRE', c: 'var(--orange)'},
    {id: 'score', label: 'SPORTS', c: 'var(--violet)'},
    {id: 'feeds', label: 'LIVE', c: 'var(--green)'},
    {id: 'text', label: 'TEXT', c: 'var(--gold)'},
    {id: 'setup', label: 'SETUP', c: 'var(--peri)'},
  ];
  const panels = {};                        // pageId -> [{order, fn}]
  GB.panel = (page, order, fn) => { (panels[page] = panels[page] || []).push({order, fn}); };
  GB.page = 'music';
  GB.go = (id, anchor) => {
    if (!PAGES.some(p => p.id === id)) id = 'music';
    GB.page = id; store.set('gb_page', id);
    document.querySelectorAll('#rail button[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === id));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'pg-' + id));
    const pg = PAGES.find(p => p.id === id); document.documentElement.style.setProperty('--pagec', pg.c);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    document.body.dataset.page = id; if (PV.length) drawSetup(PV);
    GB.emit('page', id);
    if (anchor && $(anchor)) setTimeout(() => $(anchor).scrollIntoView({behavior: 'smooth', block: 'start'}), 60);
    else if (innerWidth < 1000 || innerHeight > innerWidth) window.scrollTo(0, 0);
  };
  function buildPages() {
    const rail = $('rail'), host = $('pages');
    PAGES.forEach(p => {
      const b = document.createElement('button'); b.dataset.p = p.id; b.textContent = p.label; b.style.setProperty('--c', p.c);
      if (p.big) b.style.flexGrow = p.big; b.onclick = () => GB.go(p.id); rail.appendChild(b);
      const pg = document.createElement('section'); pg.className = 'page'; pg.id = 'pg-' + p.id; pg.setAttribute('aria-label', p.label); pg.style.setProperty('--c', p.c);
      host.appendChild(pg);
      (panels[p.id] || []).sort((a, b) => a.order - b.order).forEach(({fn}) => {
        const el = document.createElement('div'); el.className = 'panel'; pg.appendChild(el);
        try { fn(el); } catch (e) { console.error('panel ' + p.id, e); el.innerHTML = '<p class="note">This part could not load.</p>'; }
      });
    });
    const tail = document.createElement('div'); tail.className = 'tail'; rail.appendChild(tail);
  }

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
  function drawSetup(blocks) {
    PV = blocks; if (!blocks.length) return;
    if (blocks.length === 1 && blocks[0].shape) {
      const dpr = Math.min(2, window.devicePixelRatio || 1), box = $('wallBox'), cssW = FULL ? innerWidth : Math.max(120, (box.clientWidth - 20) || 360);
      const wide = innerWidth >= 1000 && innerWidth >= innerHeight, compact = !wide && GB.page !== 'music';
      return draw3D(blocks[0], cssW, FULL ? innerHeight - 40 : compact ? Math.max(150, innerHeight * 0.26) : Math.max(240, Math.min(620, innerHeight * (wide ? 0.46 : 0.5))), dpr);
    }
    const many = blocks.length > 1, dpr = Math.min(2, window.devicePixelRatio || 1);
    const gap = 2, totW = blocks.reduce((a, b) => a + b.w, 0) + gap * (blocks.length - 1), maxH = Math.max(...blocks.map(b => b.h));
    const anyDev = blocks.some(b => (b.devices || []).length > 1);
    const box = $('wallBox'), cssW = FULL ? innerWidth : Math.max(120, (box.clientWidth - 20) || 360);
    const lab = (many ? 18 : 0) + (anyDev ? 16 : 0);
    const wide = innerWidth >= 1000 && innerWidth >= innerHeight, compact = !wide && GB.page !== 'music';
    const maxCssH = FULL ? innerHeight - 40 : compact ? Math.max(130, innerHeight * 0.24) : Math.max(220, Math.min(620, innerHeight * (wide ? 0.44 : 0.5)));
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
      if (many) { cx.fillStyle = sel ? '#ff3d9a' : '#bbb'; cx.fillText((sel ? '▶ ' : '') + b.name.toUpperCase(), ox + 2, 2); }
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
    if (s.dj && s.dj.blackout) return {c: 'var(--red)', t: '🎧 Blackout', sub: 'DJ mode: the wall is held dark', btn: 1};
    if (s.dj && s.dj.tap_bpm) return {c: 'var(--red)', t: '🎧 DJ tempo ' + s.dj.tap_bpm + ' BPM', sub: 'the show follows your taps', btn: 1};
    const fd = s.feeds || {};
    if (fd.alert) return {c: 'var(--red)', t: '⚠️ ' + fd.alert, sub: 'storm watch alert on the wall', btn: 'Stop', act: async () => { if (await GB.post('/api/feeds', GB.withGroup({feed: 'storm', stop: true}))) GB.toast('Alert cleared from the wall'); }};
    if (fd.title) return {c: 'var(--green)', t: 'Live: ' + fd.title, sub: 'on the wall until you turn it off' + ((fd.watching || []).length ? ' · watching ' + fd.watching.join(', ') : ''), btn: 'Stop', act: async () => { if (await GB.post('/api/feeds', GB.withGroup({mode: 'off'}))) GB.toast('🎵 Back to the music show'); }};
    if (s.scoreboard) return {c: 'var(--violet)', t: 'Scoreboard 🏟️', sub: 'on the wall until you turn it off', btn: 1};
    if (s.fireplace && s.fireplace.on) { const fp = s.fireplace; return {c: 'var(--orange)', t: 'Fireplace 🔥', sub: (fp.color || 'classic') + (fp.mode === 'roar' ? ' · roaring' : ' · cozy') + (fp.dance ? ' · dancing with the music' : ''), btn: 'Put out', act: async () => { if (await GB.fire({on: false})) GB.toast('🎵 Fire is out. Back to the music show'); }}; }
    if (s.mirror) return {c: 'var(--cyan)', t: 'Screen mirror', sub: ({straight: 'TV style', beat: 'with the beat', ambient: 'ambient glow'}[s.mirror.style] || '') + ' · ' + (s.mirror.area === 'center' ? 'center zoom' : 'smart fill'), btn: 'Stop', act: async () => { if (await GB.control({mirror: null})) GB.toast('🎵 Back to the music show'); }};
    if (hol) return {c: 'var(--cyan)', t: 'Holiday: ' + hol.name + ' ' + hol.emoji, sub: 'only ' + hol.name + ' effects, cycling with the music', btn: 'Stop', act: async () => { if (await GB.control({holiday: null})) GB.toast('🎵 Back to the music show'); }};
    if (s.scene) return {c: 'var(--lav)', t: 'Scene: ' + s.scene.name, sub: `part ${s.scene.segment} of ${s.scene.segments}`, btn: 'Stop', act: async () => { if (await GB.post('/api/scene/stop', {})) GB.toast('🎵 Back to the music show'); }};
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
      $('rEff').textContent = gi ? gi.effect : ((s.locked ? '🔒 ' : '') + (s.effect || '–'));
      const lit = Math.round(Math.min(1, (s.level || 0) * 1.2) * meterN);
      $('rMeter').querySelectorAll('i').forEach((el, i) => el.style.background = i < lit ? (i < 9 ? 'var(--cyan)' : i < 15 ? 'var(--violet)' : i < 20 ? 'var(--pink)' : 'var(--amber)') : '');
      const an = s.analysis || {};
      $('rMore').textContent = [s.part ? 'Part: ' + s.part : '', an.key ? '🎼 ' + an.key : '', an.mood || '', an.known ? '🧠 known song' : '', s.calm > 0.5 ? '🌙 calm' : ''].filter(Boolean).join(' · ');
      const m = mode(s, cat), mb = $('modeBar');
      mb.style.setProperty('--c', m.c); $('mT').textContent = m.t; $('mS').textContent = m.sub;
      $('mBtn').hidden = !m.btn; modeAct = m.act;
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
    $('wMap').onclick = () => GB.go('setup', 'lightsPanel');
    $('mBtn').onclick = () => GB.backToMusic();
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && FULL) GB.setFull(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && FULL) GB.setFull(false); });
    let rz = null; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (PV.length) drawSetup(PV); }, 80); });
    $('sfx').onclick = () => { sfxOn = !sfxOn; store.set('gb_sfx', sfxOn ? '1' : '0'); sfxButton(); if (sfxOn) GB.sfx('ok'); };
    sfxButton(); licenseGate(); sparkle();
    $('ftHelp').onclick = () => GB.go('setup', 'helpPanel');
    const want = (location.hash || '').slice(1) || store.get('gb_page', 'music');
    GB.go(want);
    document.querySelectorAll('input[type=range]').forEach(GB.paintRange);
    loadCatalog(); statusLoop(); frameLoop();
    let uiv = null;                                               // 🔄 app files updated on the laptop? reload (unless you're typing)
    const verCheck = async () => { try { const v = (await GB.get('/api/uiver')).v;
      if (uiv == null) uiv = v; else if (v && v !== uiv) { const a = document.activeElement;
        if (!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { GB.toast('✨ GlowBop updated, reloading…'); setTimeout(() => location.reload(), 900); return; } } } catch (e) {}
      setTimeout(verCheck, 20000); };
    setTimeout(verCheck, 3000);
    GB.emit('ready');
  };
})();
