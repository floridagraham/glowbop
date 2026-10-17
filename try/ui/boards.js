/* ⛳🏁🎾🥊 Golf, NASCAR, tennis and UFC board panels (SPORTS page, after the team scoreboard; still takeover feeds via /api/feeds): event + status, a top-10 table, tour / series and favorite pickers,
   Show on the wall, and when it last updated. One builder makes both panels so they stay twins. */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .bd-ev { font:700 calc(18px * var(--fs, 1))/1.15 var(--cond); letter-spacing:1px; text-transform:uppercase; color:var(--text); overflow-wrap:anywhere; }
  .bd-st { display:flex; flex-wrap:wrap; gap:6px 10px; align-items:center; margin:6px 0 2px; font:calc(15px * var(--fs, 1)) var(--mono); color:var(--dim); }
  .bd-pill { font:700 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; padding:3px 9px; border-radius:999px; background:var(--dark); color:var(--label); text-transform:uppercase; }
  .bd-pill.live { background:var(--red); color:#fff; } .bd-pill.fin { background:var(--gold); color:#000; }
  .bd-flag { width:28px; height:14px; border-radius:3px; display:inline-block; vertical-align:middle; }
  .bd-flag.CHECKERED { background:repeating-conic-gradient(#fff 0 25%, #111 0 50%) 0 0 / 8px 8px; }
  .bd-tbl { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:8px; }
  .bd-tbl td, .bd-tbl th { padding:7px 4px; border-bottom:1px solid var(--line); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .bd-tbl th { font:600 calc(11px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); text-align:left; text-transform:uppercase; }
  .bd-tbl td { font-size:calc(15px * var(--fs, 1)); } .bd-tbl .n { font-family:var(--mono); text-align:right; } .bd-tbl th.n { text-align:right; }
  .bd-tbl .p { width:38px; font-family:var(--mono); color:var(--dim); } .bd-tbl .c1 { width:58px; } .bd-tbl .c2 { width:46px; }
  .bd-tbl td.c1 { width:auto; } .bd-ns .c1 { width:50px; }
  .bd-tbl tr.ld td { color:var(--gold); } .bd-tbl tr.fv td { background:color-mix(in srgb, var(--cyan) 14%, transparent); }
  .bd-tbl tr.fv td:first-child { box-shadow:inset 3px 0 0 var(--cyan); }
  .bd-tbl tr.gap td { border-top:2px dashed var(--line); }
  .bd-u { color:#ff4a3d; } .bd-o { color:#6fa3ff; }
  .bd-car { display:inline-block; min-width:30px; padding:1px 5px; border-radius:6px; font:700 calc(14px * var(--fs, 1)) var(--mono); color:#000; text-align:center; }
  .bd-empty { padding:14px 4px; color:var(--dim); text-align:center; }
  .bd-pick { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; margin-top:12px; }
  .bd-pick label { min-width:0; } .bd-pick select { width:100%; }
  @media (max-width: 520px) { .bd-pick { grid-template-columns:minmax(0,1fr); } }
  .bd-foot { display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; margin-top:8px; font:calc(13px * var(--fs, 1)) var(--mono); color:var(--dim); }
  .bd-err { color:var(--red); font-size:calc(13px * var(--fs, 1)); margin-top:4px; }
  .bd-tn td, .bd-uf td { line-height:1.35; vertical-align:middle; } .bd-tn .c1 { width:64px; } .bd-tn .c2 { width:58px; }
  .bd-uf .c2 { width:92px; } .bd-uf td.c2 { white-space:normal; font-size:calc(13px * var(--fs, 1)); } .bd-tn td.c2 { font-size:calc(13px * var(--fs, 1)); color:var(--dim); }
  .bd-w { color:var(--gold); font-weight:700; } .bd-l { color:var(--dim); }
  .bd-sv { display:inline-block; width:7px; height:7px; border-radius:50%; background:#d2ff1f; margin-left:5px; vertical-align:middle; }
  .bd-rc { box-shadow:inset 3px 0 0 #ff2a1a; padding-left:7px !important; } .bd-bc { box-shadow:inset 3px 0 0 #3373ff; padding-left:7px !important; }
  .bd-rec { color:var(--dim); font:calc(12px * var(--fs, 1)) var(--mono); margin-left:4px; }
  `);
  const ago = s => { if (!s) return 'not yet'; const d = Math.max(0, Date.now() / 1000 - s); return d < 60 ? Math.round(d) + 's ago' : d < 3600 ? Math.round(d / 60) + ' min ago' : Math.round(d / 3600) + ' h ago'; };
  const day = (s, time) => { if (!s) return ''; const d = new Date(s * 1000);
    return d.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'}) + (time ? ' ' + d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : ''); };
  const par = v => { const c = !v || v === 'E' || v === '-' ? '' : v[0] === '-' ? 'bd-u' : 'bd-o'; return `<span class="${c}">${esc(v || '–')}</span>`; };

  function board(cfg) {
    const P = cfg.id;
    GB.panel('score', cfg.order, el => {          // ⛳🏁 lives on the SPORTS page
      el.classList.add('box'); el.style.setProperty('--c', cfg.color); el.id = P + 'Panel';   // #golf, #racing, #tennis, #ufc land here
      el.hidden = true;                             // Oct 17 (Graham): hidden until opened from its Live now line (⚙ Tour & favorites) or Live Fan
      el.innerHTML = `<div class="ph"><span>${cfg.title}</span><span class="r"><span id="${P}R">OFF</span> <button class="btn sm ghost bd-x" id="${P}X" aria-label="Close" style="min-height:30px;padding:0 10px;margin-left:6px">✕</button></span></div>
        <div class="bd-ev" id="${P}Ev">Loading…</div>
        <div class="bd-st" id="${P}St"></div>
        <div class="seg"><button class="btn c lg" id="${P}Show" style="--c:${cfg.color}">Show on the wall</button></div>
        <table class="bd-tbl bd-${P}"><thead><tr>${cfg.head}</tr></thead><tbody id="${P}Tb"></tbody></table>
        <div class="bd-pick">
          <label class="field">${cfg.selLabel}<select id="${P}Sel"></select></label>
          <label class="field">${cfg.favLabel}<select id="${P}Fav"><option value="">None</option></select></label>
        </div>
        <p class="note">${cfg.note}</p>
        <div class="bd-foot"><span id="${P}Up">Updated: not yet</span><button class="btn ghost sm" id="${P}Test">Preview a celebration</button></div>
        <div class="bd-err" id="${P}Err" hidden></div>`;
      $(P + 'X').onclick = () => { GB.boardShown = ''; el.hidden = true; };
      $(P + 'Show').onclick = async () => {
        const on = GB.feedsState && GB.feedsState.mode === cfg.key;
        if (await GB.feed(on ? {mode: 'off'} : {feed: cfg.key, on: true})) { GB.toast(on ? '🎵 Back to the music show' : cfg.onToast); GB.feedsRefresh(); }
      };
      $(P + 'Sel').onchange = async e => { if (await GB.feed({feed: cfg.key, [cfg.selKey]: e.target.value})) { GB.toast('Loading ' + e.target.selectedOptions[0].textContent); GB.feedsRefresh(1500); } };
      $(P + 'Fav').onchange = async e => {
        const o = e.target.selectedOptions[0]; const nm = e.target.value ? o.dataset.name : '';
        if (await GB.feed({feed: cfg.key, fav: e.target.value, fav_name: nm})) { GB.toast(nm ? '⭐ ' + nm + ' will glow on the wall' : 'Favorite cleared'); GB.feedsRefresh(); }
      };
      $(P + 'Test').onclick = async () => { if (await GB.feed({feed: cfg.key, on: true, test_cele: true})) { GB.toast('🎉 Celebration preview'); GB.feedsRefresh(); } };
    });
    GB.on('feeds', s => {
      if (!$(P + 'Tb')) return;
      const f = (s.feeds || {})[cfg.key]; if (!f) return;
      const on = s.mode === cfg.key;
      $(P + 'R').textContent = on ? 'ON THE WALL' : 'OFF';
      $(P + 'Show').textContent = on ? 'Back to music' : 'Show on the wall'; $(P + 'Show').classList.toggle('on', on);
      // tour / series select
      const sel = $(P + 'Sel'), list = f[cfg.listKey] || [], k1 = JSON.stringify(list);
      if (sel._k !== k1) { sel._k = k1; sel.innerHTML = list.map(o => `<option value="${esc(o.id)}">${esc(o.name)}</option>`).join(''); }
      if (document.activeElement !== sel) sel.value = f[cfg.selKey] || '';
      // event + status line
      const nx = f.next;
      if (f.view === 'next' && nx) $(P + 'Ev').textContent = 'Next: ' + nx.name;
      else $(P + 'Ev').textContent = f.event || (f.loading ? 'Loading…' : f.err ? 'No data yet' : 'Nothing on right now');
      const pill = f.state === 'in' ? '<span class="bd-pill live">Live</span>' : f.state === 'post' ? '<span class="bd-pill fin">Final</span>' : f.state === 'pre' ? '<span class="bd-pill">Upcoming</span>' : '';
      let st = pill + cfg.status(f);
      if (f.view === 'next' && nx) st = '<span class="bd-pill">Up next</span><span>Starts ' + esc(day(nx.start, cfg.timeOf ? cfg.timeOf(nx) : cfg.key === 'nascar')) + '</span>';
      $(P + 'St').innerHTML = st;
      // top 10
      const rows = f.rows || [], show = f.view === 'next' ? [] : rows.slice();
      if (f.fav_row && show.length && !show.some(r => r.fav)) show.push(Object.assign({gap: true}, f.fav_row));
      $(P + 'Tb').innerHTML = show.length ? show.map((r, i) => cfg.row(r, i)).join('')
        : `<tr><td colspan="4" class="bd-empty">${f.view === 'next' ? 'The board fills in when it starts.' : f.loading ? 'Loading…' : 'No leaderboard right now.'}</td></tr>`;
      // favorite select from the current field
      const fv = $(P + 'Fav'), field = f.field || [], k2 = JSON.stringify([field.map(x => x.id), f.fav]);
      if (fv._k !== k2) {
        fv._k = k2;
        const opts = field.map(x => `<option value="${esc(x.id)}" data-name="${esc(x.name)}">${esc(cfg.favText(x))}</option>`);
        if (f.fav && !field.some(x => x.id === f.fav)) opts.unshift(`<option value="${esc(f.fav)}" data-name="${esc(f.fav_name)}">${esc(f.fav_name || f.fav)} (not in this field)</option>`);
        fv.innerHTML = '<option value="">None</option>' + opts.join('');
        fv.value = f.fav || '';
      }
      $(P + 'Up').textContent = 'Updated: ' + ago(f.updated) + (f.live ? ' · every ' + (f.every || 30) + 's' : '');
      $(P + 'Err').hidden = !f.err; $(P + 'Err').textContent = f.err || '';
    });
  }

  board({id: 'gf', key: 'golf', order: 60, title: 'Golf', color: 'var(--green)', onToast: '⛳ Golf leaderboard on the wall',
    selKey: 'tour', listKey: 'tours', selLabel: 'Tour', favLabel: 'Favorite player',
    head: '<th class="p">Pos</th><th>Player</th><th class="n c1">To par</th><th class="n c2">Thru</th>',
    note: 'Under par shows red like on TV, over par blue. Your favorite always gets a spot on the wall with a glow. A new leader sets off a celebration.',
    status: f => (f.status ? `<span>${esc(f.status)}</span>` : '') + (f.state === 'in' && f.round && !/round/i.test(f.status || '') ? `<span>R${f.round} of ${f.rounds || 4}</span>` : ''),
    favText: x => x.name,
    row: (r, i) => {
      const thru = r.thru || (r.tee ? new Date(r.tee).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : '');
      return `<tr class="${i === 0 && r.score ? 'ld' : ''}${r.fav ? ' fv' : ''}${r.gap ? ' gap' : ''}"><td class="p">${esc(r.pos)}</td><td>${r.fav ? '⭐ ' : ''}${esc(r.name)}</td><td class="n">${par(r.score)}</td><td class="n">${esc(thru)}</td></tr>`;
    }});

  const FLAGS = {GREEN: '#1ee640', YELLOW: '#ffc000', RED: '#ff2020', WHITE: '#ffffff'};
  const FLAGTXT = {GREEN: 'Green flag', YELLOW: 'Caution', RED: 'Red flag', WHITE: 'White flag, last lap', CHECKERED: 'Checkered flag'};
  board({id: 'ns', key: 'nascar', order: 65, title: 'Racing', color: 'var(--amber)', onToast: '🏁 Racing running order on the wall',
    selKey: 'series', listKey: 'series_list', selLabel: 'Series', favLabel: 'Favorite driver',
    head: '<th class="p">Pos</th><th class="c1">Car</th><th>Driver</th><th class="n c2">Led</th>',
    note: 'NASCAR and IndyCar. Each car shows in its own color with the flag on top: green, caution, red, white for the last lap, checkered at the finish. Laps led come in when the data has them.',
    status: f => {
      let x = '';
      if (f.flag && f.state !== 'pre') x += `<span>${f.flag === 'CHECKERED' ? '<i class="bd-flag CHECKERED"></i>' : `<i class="bd-flag" style="background:${FLAGS[f.flag] || '#888'}"></i>`} ${esc(FLAGTXT[f.flag] || '')}</span>`;
      if (f.lap && f.state !== 'pre') x += `<span>LAP ${f.lap}${f.laps ? '/' + f.laps : ''}</span>`;
      else if (f.status) x += `<span>${esc(f.status)}</span>`;
      return x;
    },
    favText: x => (x.num ? '#' + x.num + ' ' : '') + x.name,
    row: (r, i) => `<tr class="${i === 0 ? 'ld' : ''}${r.fav ? ' fv' : ''}${r.gap ? ' gap' : ''}"><td class="p">${esc(r.pos)}</td><td><span class="bd-car" style="background:${esc(r.color || '#888')}">${esc(r.num || '–')}</span></td><td>${r.fav ? '⭐ ' : ''}${esc(r.name)}</td><td class="n">${r.led == null ? '–' : esc(r.led)}</td></tr>`});
  // 🎾 tennis: one table row per match, the two players stacked
  const tnTime = s => s ? new Date(s * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : '';
  const tnSide = (p, st) => `<span class="${st === 'post' ? (p.won ? 'bd-w' : 'bd-l') : ''}">${p.fav ? '⭐ ' : ''}${esc(p.name)}</span>${p.serve ? '<i class="bd-sv" title="Serving"></i>' : ''}`;
  board({id: 'tn', key: 'tennis', order: 66, title: 'Tennis', color: 'var(--lav)', onToast: '🎾 Tennis scores on the wall',
    selKey: 'tour', listKey: 'tours', selLabel: 'Tour', favLabel: 'Favorite player',
    head: '<th class="p">Rd</th><th>Players</th><th class="n c1">Sets</th><th class="n c2">Status</th>',
    note: 'Live singles matches first, then the latest results. The current set glows yellow and a ball dot marks the server. Your favorite always gets a spot, and a set or match win sets off a celebration.',
    status: f => f.status ? `<span>${esc(f.status)}</span>` : '',
    timeOf: nx => !!nx.match,
    favText: x => x.name + (x.country ? ' (' + x.country + ')' : ''),
    row: (r, i) => `<tr class="${r.fav ? 'fv' : ''}${r.gap ? ' gap' : ''}"><td class="p">${esc(r.rnd)}</td>
      <td>${tnSide(r.a, r.state)}<br>${tnSide(r.b, r.state)}</td>
      <td class="n">${esc(r.a.sets || '–')}<br>${esc(r.b.sets || '–')}</td>
      <td class="n c2">${r.state === 'in' ? '<span class="bd-pill live">' + esc(r.st) + '</span>' : r.state === 'pre' ? esc(tnTime(r.start)) : esc(r.st)}</td></tr>`});

  // 🥊 UFC: one row per fight, red corner over blue, the result on the right
  const ufSide = (p, st, c) => `<span class="${c} ${st === 'post' ? (p.won ? 'bd-w' : 'bd-l') : ''}">${p.fav ? '⭐ ' : ''}${esc(p.name)}</span>${p.rec ? '<span class="bd-rec">' + esc(p.rec) + '</span>' : ''}`;
  board({id: 'uf', key: 'ufc', order: 67, title: 'UFC', color: 'var(--red)', onToast: '🥊 UFC fight card on the wall',
    selKey: 'pick', listKey: 'events', selLabel: 'Card', favLabel: 'Favorite fighter',
    head: '<th class="p">Bout</th><th>Red / Blue corner</th><th class="n c2">Result</th>',
    note: 'Red corner on top, blue below. Live fights show the round and clock, finished ones the result (KO, SUB, DEC). Every finish sets off a celebration in the winner\'s color.',
    status: f => (f.status ? `<span>${esc(f.status)}</span>` : '') + (f.venue ? `<span>${esc(f.venue)}</span>` : ''),
    timeOf: () => true,
    favText: x => x.name + (x.rec ? ' (' + x.rec + ')' : ''),
    row: (r, i) => `<tr class="${r.fav ? 'fv' : ''}${r.main ? ' ld' : ''}"><td class="p">${r.main ? 'MAIN' : esc(String(r.wc || '').replace(/weight/i, '').slice(0, 6) || '–')}</td>
      <td style="white-space:normal">${ufSide(r.red, r.state, 'bd-rc')}<br>${ufSide(r.blue, r.state, 'bd-bc')}</td>
      <td class="n c2">${r.state === 'in' ? '<span class="bd-pill live">' + esc(r.res) + '</span>' : r.state === 'pre' ? esc(r.start ? new Date(r.start * 1000).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) : '') : esc(r.res)}</td></tr>`});
})();
