/* 🎛️ FILTERS (Oct 20, Graham: "let's make our own of these" after looking at Juicebar; picked: the music adds filters on drops for
   everyone, and a tap-on FILTERS panel in Pro DJ). Ten filters change whatever is playing; tap one on, tap again for off, stack
   as many as you like. "Auto on drops" lets the music add one punchy filter on a drop and a little shake during a build.
   Talks to POST /api/filters ({name, on} / {auto} / {clear}) and reads status.filters. */
(function () {
  'use strict';
  const {$} = GB;
  const KEYS = [['rgb', 'RGB split', '#ff3d9a'], ['freeze', 'Freeze', '#33d6ff'], ['tiles', 'Tile explode', '#ffb23d'], ['mirror', 'Mirror', '#9b3dff'],
    ['fisheye', 'Fish-eye', '#4de8c8'], ['shake', 'Shake', '#ff7a3d'], ['halftone', 'Halftone', '#cc99ff'], ['duotone', 'Duotone', '#ff5cc8'],
    ['strobe', 'Strobe mask', '#e9e6ff'], ['radar', 'Radar', '#3ce08a']];
  GB.css(`
  html:not(.prodj) #fltPanel { display:none !important; }
  #fltPanel .flt-keys { display:grid; grid-template-columns:repeat(auto-fill, minmax(118px, 1fr)); gap:8px; }
  #fltPanel .flt-keys .btn { min-height:48px; --c:var(--fc); background:transparent; color:var(--fc); box-shadow:inset 0 0 0 2px var(--fc);
    font:700 calc(15px * var(--fs, 1))/1.05 var(--cond); letter-spacing:1px; text-transform:uppercase; white-space:normal; padding:4px 8px; }
  #fltPanel .flt-keys .btn.on { background:var(--fc); color:#000; box-shadow:0 0 16px -2px var(--fc); }
  #fltPanel .flt-keys .btn.auto:not(.on) { box-shadow:inset 0 0 0 2px var(--fc), 0 0 14px -3px var(--fc); color:#fff; }
  #fltPanel .flt-row { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
  #fltPanel .flt-row .chip { min-height:36px; }
  #fltPanel .flt-row .chip.on { background:var(--c); color:#000; }
  `);
  GB.panel('dj', 8, el => {
    el.id = 'fltPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `<div class="ph"><span>Filters</span><span class="r" id="fltR">TAP TO STACK</span></div>
      <div class="flt-keys">${KEYS.map(([k, t, c]) => `<button class="btn" data-f="${k}" style="--fc:${c}" type="button">${t}</button>`).join('')}</div>
      <div class="flt-row"><button class="chip" id="fltAuto" type="button" style="--c:var(--green)">Auto on drops</button><button class="chip" id="fltClear" type="button" style="--c:var(--pink)">All off</button></div>
      <p class="note">Filters change whatever is playing. Tap one on, tap again for off, stack as many as you like. <b>Auto on drops</b> lets the music add one on a drop and a little shake during a build.</p>`;
    let st = {on: [], auto: true, playing: []};
    const paint = () => {
      el.querySelectorAll('[data-f]').forEach(b => { const k = b.dataset.f; b.classList.toggle('on', st.on.includes(k)); b.classList.toggle('auto', !st.on.includes(k) && (st.playing || []).includes(k)); });
      $('fltAuto').classList.toggle('on', !!st.auto); $('fltAuto').textContent = st.auto ? 'Auto on drops: on' : 'Auto on drops: off';
      $('fltR').textContent = st.on.length ? st.on.length + ' ON' : (st.playing || []).length ? 'AUTO: ' + KEYS.find(k => k[0] === st.playing[0])[1].toUpperCase() : 'TAP TO STACK';
    };
    const send = async body => { const r = await GB.post('/api/filters', body); return r; };
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = async () => {
      const k = b.dataset.f, on = !st.on.includes(k);
      st.on = on ? st.on.concat(k) : st.on.filter(x => x !== k); paint(); GB.sfx && GB.sfx(on ? 'on' : 'off');
      await send({name: k, on});
    });
    $('fltAuto').onclick = async () => { st.auto = !st.auto; paint(); GB.sfx && GB.sfx('tap'); await send({auto: st.auto}); };
    $('fltClear').onclick = async () => { st.on = []; paint(); GB.sfx && GB.sfx('off'); await send({clear: true}); };
    GB.on('status', s => { if (s && s.filters) { st = Object.assign({on: [], auto: true, playing: []}, s.filters); paint(); } });
    paint();
  });
})();
