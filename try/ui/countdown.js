/* 🎉 Countdown panel (LIVE page): pick a holiday or add your own, see the time left, put it on the wall. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .cd-big { font:calc(44px * var(--fs, 1))/1 var(--mono); color:var(--gold); text-align:center; padding:10px 0 2px; text-shadow:0 0 18px color-mix(in srgb, var(--gold) 55%, transparent); }
  .cd-name { text-align:center; font:700 calc(16px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--lav); }
  .cd-list .item { cursor:pointer; } .cd-list .item.on { box-shadow:inset 4px 0 0 var(--gold); }
  .cd-add { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; }
  .cd-add .wide2 { grid-column:span 2; }
  @media (max-width: 520px) { .cd-big { font-size:calc(34px * var(--fs, 1)); } }
  `);
  const left = s => { if (s == null) return '–'; s = Math.max(0, Math.round(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return d ? `${d}d ${h}h ${String(m).padStart(2, '0')}m` : h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`; };
  let st = null, base = 0;
  GB.panel('feeds', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>Countdown</span><span class="r" id="cdR"></span></div>
      <div class="cd-name" id="cdName">–</div><div class="cd-big" id="cdLeft">–</div>
      <div class="seg"><button class="btn c lg" id="cdShow" style="--c:var(--gold)">Show on the wall</button></div>
      <div class="sub">Pick one</div><div class="list cd-list" id="cdList"></div>
      <div class="sub">Add your own</div>
      <div class="cd-add">
        <input type="text" id="cdN" class="wide2" maxlength="24" placeholder="What's it for? (Mom's birthday)">
        <input type="date" id="cdD" aria-label="Date"><input type="time" id="cdT" value="00:00" aria-label="Time">
        <input type="text" id="cdF" class="wide2" maxlength="30" placeholder="Message at zero (HAPPY BIRTHDAY)">
        <button class="btn c wide2" id="cdAdd" style="--c:var(--amber)">Add countdown</button>
      </div>
      <div class="sub">Color</div><div class="chips" id="cdCols"></div>
      <button class="btn ghost sm" id="cdTest">Preview the finale</button>`;
    $('cdShow').onclick = async () => {
      const on = GB.feedsState && GB.feedsState.mode === 'countdown';
      if (await GB.feed(on ? {mode: 'off'} : {feed: 'countdown', on: true})) { GB.toast(on ? '🎵 Back to the music show' : '🎉 Countdown on the wall'); GB.feedsRefresh(); }
    };
    $('cdAdd').onclick = async () => {
      const n = $('cdN').value.trim(), d = $('cdD').value, tm = $('cdT').value || '00:00';
      if (!n) return GB.toast('Give it a name'); if (!d) return GB.toast('Pick a date');
      const at = new Date(d + 'T' + tm).getTime() / 1000; if (!(at > Date.now() / 1000)) return GB.toast('Pick a time in the future');
      if (await GB.feed({feed: 'countdown', add: {name: n, at, finale: $('cdF').value.trim()}, on: true})) {
        GB.toast('🎉 ' + n + ' countdown is on'); $('cdN').value = ''; $('cdF').value = ''; GB.feedsRefresh(); }
    };
    $('cdTest').onclick = async () => { if (await GB.feed({feed: 'countdown', on: true, test_finale: true})) GB.toast('🎆 Finale preview'); };
  });
  GB.on('feeds', s => {
    if (!$('cdList')) return;
    const f = (s.feeds || {}).countdown; if (!f) return; st = f; base = Date.now();
    const on = s.mode === 'countdown';
    $('cdR').textContent = on ? 'ON THE WALL' : 'OFF';
    $('cdShow').textContent = on ? 'Stop the countdown' : 'Show on the wall'; $('cdShow').classList.toggle('on', on);
    const cur = (f.items || []).find(i => i.id === f.cur);
    $('cdName').textContent = cur ? cur.name : 'No countdown';
    const key = JSON.stringify([f.items.map(i => i.id + i.at), f.cur]);
    if ($('cdList')._k !== key) {
      $('cdList')._k = key; $('cdList').innerHTML = '';
      f.items.forEach(i => {
        const r = document.createElement('div'); r.className = 'item' + (i.id === f.cur ? ' on' : '');
        const dt = new Date(i.at * 1000);
        r.innerHTML = `<div class="tx"><b>${esc(i.name)}</b><small>${dt.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})} ${dt.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}</small></div>`;
        r.onclick = async () => { if (await GB.feed({feed: 'countdown', pick: i.id})) { GB.toast('🎉 ' + i.name); GB.feedsRefresh(); } };
        if (/^c\d+$/.test(i.id)) { const x = document.createElement('button'); x.className = 'btn sm ghost'; x.textContent = 'Remove';
          x.onclick = async e => { e.stopPropagation(); if (await GB.feed({feed: 'countdown', remove: i.id})) GB.feedsRefresh(); }; r.appendChild(x); }
        $('cdList').appendChild(r);
      });
    }
    const cc = $('cdCols'); if (!cc._k) { cc._k = 1; (f.colors || []).forEach(c => { const b = document.createElement('button'); b.className = 'chip'; b.dataset.c = c; b.textContent = c;
      b.style.setProperty('--c', {gold: 'var(--gold)', pink: 'var(--pink)', cyan: 'var(--cyan)', green: 'var(--green)', red: 'var(--red)', white: '#fff'}[c] || 'var(--gold)');
      b.onclick = () => GB.feed({feed: 'countdown', color: c}).then(r => r && GB.feedsRefresh()); cc.appendChild(b); }); }
    cc.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b.dataset.c === f.color));
  });
  setInterval(() => { if (st && $('cdLeft')) $('cdLeft').textContent = left(st.left == null ? null : st.left - (Date.now() - base) / 1000); }, 250);
})();
