/* ✈️ Overhead now panel (LIVE page): a radar of the planes flying over your house and where the ISS is right now. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .ov-reads { grid-template-columns:repeat(3, minmax(0,1fr)); }
  .ov-reads .read .v { font-size:26px; } .ov-reads .read .v small { font-size:13px; }
  @media (min-width: 700px) { .ov-reads .read .v { font-size:34px; } }
  .ov-list .item { min-height:52px; }
  .ov-arr { width:30px; height:30px; flex:none; display:grid; place-items:center; border-radius:50%; background:#0d2a1c; }
  .ov-arr svg { width:18px; height:18px; fill:var(--amber); transition:transform .6s; }
  .ov-dist { font:18px/1 var(--mono); color:var(--amber); text-align:right; flex:none; }
  .ov-dist small { display:block; font:600 11px var(--cond); letter-spacing:1.5px; color:var(--label); margin-top:3px; }
  .ov-iss { border:1px solid color-mix(in srgb, var(--cyan) 35%, transparent); border-radius:10px; padding:10px 12px; display:flex; flex-direction:column; gap:6px; }
  .ov-iss .ov-ih { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:baseline; gap:4px 8px; }
  .ov-iss .ov-ik { font:700 14px var(--cond); letter-spacing:2px; color:var(--cyan); }
  .ov-iss .ov-iv { font:24px/1 var(--mono); color:var(--cyan); white-space:nowrap; }
  .ov-iss.near { box-shadow:0 0 18px color-mix(in srgb, var(--cyan) 40%, transparent); }
  .ov-st { font:13px var(--mono); color:var(--dim); }
  .ov-err { color:var(--red); } .ov-rate { color:var(--amber); }
  .ov-empty { color:var(--dim); font-size:13px; padding:10px 4px; }
  `);
  const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 2l7 19-7-4.5L5 21z"/></svg>';
  const kmi = n => n == null ? '–' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
  const num = n => n == null ? '–' : Number(n).toLocaleString();
  const ago = ts => { if (!ts) return 'never'; const s = Math.max(0, Math.round(Date.now() / 1000 - ts)); return s < 60 ? s + 's ago' : Math.round(s / 60) + ' min ago'; };
  let region = null; try { region = new Intl.DisplayNames(['en'], {type: 'region'}); } catch (e) {}
  const where = i => { if (i.cc && i.cc !== '??') { try { return region ? region.of(i.cc) : i.cc; } catch (e) { return i.cc; } } return i.ocean || 'the ocean'; };
  const ll = (la, lo) => `${Math.abs(la).toFixed(1)}°${la >= 0 ? 'N' : 'S'}, ${Math.abs(lo).toFixed(1)}°${lo >= 0 ? 'E' : 'W'}`;
  const climb = {up: '↑ climbing', down: '↓ descending', level: ''};

  GB.panel('feeds', 50, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Overhead now</span><span class="r" id="ovR">OFF</span></div>
      <p class="note">A radar of the planes flying over your house, plus the space station when it comes by. The wall celebrates when the ISS is closest.</p>
      <p class="note ov-rate" id="ovNoLoc" hidden>Set your location above (ZIP or city) so the radar knows where home is.</p>
      <div class="seg"><button class="btn c lg" id="ovShow" style="--c:var(--cyan)">Show on the wall</button></div>
      <div class="sub">Radar range</div>
      <div class="seg" id="ovRad"></div>
      <div class="reads ov-reads"><div class="read" style="--c:var(--amber)"><span class="k">Planes</span><span class="v" id="ovN">–</span></div>
        <div class="read" style="--c:var(--amber)"><span class="k">Near mi</span><span class="v" id="ovNear">–</span></div>
        <div class="read" style="--c:var(--cyan)"><span class="k">ISS mi</span><span class="v" id="ovIssR">–</span></div></div>
      <div class="sub">Nearest planes</div>
      <div class="list ov-list" id="ovList"><div class="ov-empty">Scanning the sky…</div></div>
      <div class="sub">Space station</div>
      <div class="ov-iss" id="ovIss"><div class="ov-empty">Finding the ISS…</div></div>
      <button class="btn ghost sm" id="ovTest">Preview an ISS fly-by</button>
      <div class="ov-st" id="ovSt"></div>
      <div class="ov-st ov-err" id="ovErr" hidden></div>`;
    const rad = $('ovRad');
    [25, 50, 100].forEach(r => { const b = document.createElement('button'); b.className = 'btn'; b.dataset.r = r;
      b.textContent = `${r} km`; b.title = `${Math.round(r * 0.621)} miles`;
      b.onclick = async () => { if (await GB.feed({feed: 'overhead', radius: r})) { GB.toast(`📡 Range ${Math.round(r * 0.621)} miles`); GB.feedsRefresh(); } };
      rad.appendChild(b); });
    $('ovShow').onclick = async () => {
      const on = GB.feedsState && GB.feedsState.mode === 'overhead';
      if (await GB.feed(on ? {mode: 'off'} : {feed: 'overhead', on: true})) { GB.toast(on ? '🎵 Back to the music show' : '✈️ Radar on the wall'); GB.feedsRefresh(); }
    };
    $('ovTest').onclick = async () => { if (await GB.feed({feed: 'overhead', on: true, test_iss: true})) { GB.toast('🛰️ Pretend ISS pass, watch the wall'); GB.feedsRefresh(); } };
  });

  GB.on('feeds', s => {
    if (!$('ovList')) return;
    const f = (s.feeds || {}).overhead; if (!f) return;
    const on = s.mode === 'overhead';
    $('ovR').textContent = on ? 'ON THE WALL' : 'OFF';
    $('ovShow').textContent = on ? 'Stop the radar' : 'Show on the wall'; $('ovShow').classList.toggle('on', on);
    $('ovRad').querySelectorAll('.btn').forEach(b => b.classList.toggle('on', +b.dataset.r === f.radius));
    $('ovNoLoc').hidden = !!f.has_loc;
    const ps = f.planes || [];
    $('ovN').textContent = f.has_loc && f.updated && !(f.rate && !ps.length) ? f.count : '–';
    $('ovNear').textContent = ps.length ? ps[0].mi : '–';
    const i = f.iss;
    $('ovIssR').textContent = i ? kmi(i.mi) : '–';
    // planes list
    const L = $('ovList');
    if (!f.has_loc) L.innerHTML = '<div class="ov-empty">No location yet.</div>';
    else if (!ps.length) L.innerHTML = `<div class="ov-empty">${f.rate ? 'Plane radar is paused for now (see below).' : f.updated ? 'Clear skies right now. Nothing flying in range.' : 'Scanning the sky…'}</div>`;
    else L.innerHTML = ps.slice(0, 8).map(p => `<div class="item">
        <span class="ov-arr" title="heading ${p.hdg}°"><span style="display:grid;transform:rotate(${p.hdg}deg)">${ARROW}</span></span>
        <div class="tx"><b>${esc(p.cs)}</b><small>${p.alt_ft == null ? '? ft' : num(Math.round(p.alt_ft / 100) * 100) + ' ft'} · ${p.mph} mph ${climb[p.climb] || ''}</small></div>
        <div class="ov-dist">${p.mi} mi<small>${p.dir} · ${p.elev > 0 ? Math.round(p.elev) + '° up' : 'low'}</small></div></div>`).join('');
    // ISS
    const I = $('ovIss'); I.classList.toggle('near', !!(i && i.near));
    if (!f.has_loc) I.innerHTML = '<div class="ov-empty">Needs your location.</div>';
    else if (!i) I.innerHTML = `<div class="ov-empty">${esc(f.iss_err || 'Finding the ISS…')}</div>`;
    else I.innerHTML = `<div class="ov-ih"><span class="ov-ik">${i.sim ? 'PREVIEW PASS' : i.up ? 'ABOVE YOUR HORIZON' : i.near ? 'PASSING NEARBY' : 'INTERNATIONAL SPACE STATION'}</span><span class="ov-iv">${num(i.mi)} mi</span></div>
        <div class="note">Over <b>${esc(where(i))}</b> (${ll(i.lat, i.lon)}), ${num(i.alt_km)} km up, ${num(Math.round(i.kmh * 0.621))} mph, to your ${i.dir}.</div>
        <div class="note">${f.celebrating ? '🎉 Wave hi! It is as close as it gets.' : i.up ? 'Look up! It is above the horizon right now.' : i.near ? 'Close by: it shows on the radar as a cyan star.' : 'Shows on the wall when it is within about 930 miles.'}</div>`;
    // status
    const st = [];
    if (f.has_loc) {
      st.push('Planes updated ' + ago(f.updated));
      if (f.next_in != null && !f.rate) st.push('next in ' + f.next_in + 's');
      if (f.credits != null && f.credits !== '') st.push(f.credits + ' radar checks left today');
    }
    $('ovSt').textContent = st.join(' · ');
    const err = f.rate || f.err || '';
    $('ovErr').hidden = !err; $('ovErr').textContent = err; $('ovErr').className = 'ov-st ' + (f.rate ? 'ov-rate' : 'ov-err');
  });
})();
