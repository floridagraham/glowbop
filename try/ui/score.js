/* GlowBop console: SPORTS page. Stadium scoreboard: Game Day (you keep score), Live Fan (follow a pro / college team), F1 (running order).
   Talks to GET /api/score(?g=group), POST /api/score {action...}, GET /api/score/teams?league= */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const ICON = {soccer: '⚽', football: '🏈', basketball: '🏀', baseball: '⚾', softball: '🥎', hockey: '🏒', lacrosse: '🥍', volleyball: '🏐',
                pickleball: '🏓', tennis: '🎾', rugby: '🏉', water_polo: '🤽', cornhole: '🎯', field_hockey: '🏑', aussie: '🏉', cricket: '🏏', timer: '⏱️', other: '🏆'};
  const PER = {H: 'Half', Q: 'Quarter', P: 'Period', INN: 'Inning', SET: 'Set', G: 'Game', RD: 'Round'};
  const ORD = ['', '1st', '2nd', '3rd', '4th'];
  const MODES = [['off', 'Off', 'var(--red)'], ['game', 'Game Day', 'var(--violet)'], ['live', 'Live Fan', 'var(--cyan)'], ['f1', 'F1', 'var(--orange)']];
  let SB = null, sbEdit = 0, resetArm = 0, resetT = null, teamsFor = '';
  const P = {};                                   // panel elements by name
  const score = b => GB.post('/api/score', GB.withGroup(b));
  const q = () => GB.gsel ? '?g=' + encodeURIComponent(GB.gsel) : '';

  // colors: readable text on a team-colored key, and a bright enough glow on the black board
  const rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lum = h => { const [r, g, b] = rgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const ink = h => lum(h) > 0.5 ? '#000' : '#fff';
  const glow = h => { const l = lum(h); if (l >= 0.3) return h; const [r, g, b] = rgb(h), k = 0.55 - l; return 'rgb(' + [r, g, b].map(v => Math.round(v + (255 - v) * k)).join(',') + ')'; };

  GB.css(`
  .sb-led { container-type:inline-size; position:relative; background:#020104; border:3px solid #241d3a; border-radius:0 24px 0 24px; padding:24px 12px 10px;
    background-image:radial-gradient(rgba(255,255,255,.05) 1px, transparent 1.3px); background-size:5px 5px; box-shadow:inset 0 0 40px #000, 0 0 0 1px #000; }
  .sb-led.off { opacity:.55; }
  .sb-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); grid-template-areas:"m m" "h a"; gap:8px 14px; align-items:start; }
  .sb-grid > .sb-mid { grid-area:m; } .sb-grid > .sb-tm:first-child { grid-area:h; } .sb-grid > .sb-tm:last-child { grid-area:a; }
  .sb-tm { text-align:center; min-width:0; }
  .sb-nm { font:800 clamp(calc(16px * var(--fs, 1)), 6.5cqw, 26px)/1.1 var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--tc); text-shadow:0 0 10px var(--tc);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-bottom:3px solid var(--tc); padding-bottom:4px; }
  .sb-pos { display:inline-block; width:.55em; height:.55em; border-radius:50%; background:var(--amber); box-shadow:0 0 8px var(--amber); margin:0 6px .1em 0; vertical-align:middle; visibility:hidden; }
  .sb-tm.ball .sb-pos { visibility:visible; }
  .sb-sc { font:clamp(calc(64px * var(--fs, 1)), 30cqw, 130px)/1 var(--mono); color:#fff; text-shadow:0 0 18px var(--tc), 0 0 3px #fff; margin-top:6px; font-variant-numeric:tabular-nums; }
  .sb-sc.d3 { font-size:clamp(48px, 20cqw, 96px); padding-top:.15em; }
  .sb-st { font:calc(12px * var(--fs, 1)) var(--mono); color:var(--dim); letter-spacing:1px; min-height:16px; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-mid { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:6px 12px; min-height:30px; padding-bottom:6px; border-bottom:1px dashed #241d3a; }
  .sb-clk { font:clamp(calc(34px * var(--fs, 1)), 13cqw, 56px)/1 var(--mono); color:var(--amber); text-shadow:0 0 12px rgba(255,178,61,.75); font-variant-numeric:tabular-nums; }
  .sb-clk.run { color:#ffd27a; }
  .sb-per { font:700 calc(13px * var(--fs, 1))/1 var(--cond); letter-spacing:2px; color:var(--lav); text-transform:uppercase; border:1px solid #3a2f5c; border-radius:4px; padding:4px 7px; }
  .sb-ext { font:calc(14px * var(--fs, 1)) var(--mono); color:var(--cyan); text-shadow:0 0 8px rgba(51,214,255,.6); }
  .sb-big { text-align:center; padding:10px 0 4px; }
  .sb-big .sb-clk { font-size:clamp(56px, 26cqw, 130px); }
  .sb-big .sb-t { font:800 clamp(calc(30px * var(--fs, 1)), 14cqw, 64px)/1 var(--cond); letter-spacing:4px; color:var(--tc, var(--orange)); text-shadow:0 0 16px var(--tc, var(--orange)); }
  .sb-big .sb-s { font:calc(14px * var(--fs, 1)) var(--mono); color:var(--dim); margin-top:8px; }
  .sb-tag { position:absolute; top:-1px; left:14px; font:700 calc(11px * var(--fs, 1))/1 var(--cond); letter-spacing:2px; padding:3px 8px 4px; border-radius:0 0 6px 6px; background:#241d3a; color:var(--dim); }
  .sb-tag.on { background:var(--green); color:#000; }
  .sb-tag.live { background:var(--red); color:#fff; animation:sbBlink 1.4s infinite; }
  @keyframes sbBlink { 50% { opacity:.55; } }
  .sb-keys { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px; }
  .sb-col { display:flex; flex-direction:column; gap:6px; min-width:0; }
  .sb-col .hd { font:800 calc(15px * var(--fs, 1))/1 var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--tc); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-left:6px solid var(--tc); padding:6px 0 6px 8px; }
  .sb-col .btn.pt { min-height:58px; font:calc(26px * var(--fs, 1))/1 var(--mono); letter-spacing:0; justify-content:flex-end; padding:0 18px; border-radius:6px 22px 6px 22px; }
  .sb-col .btn.mn { min-height:44px; font-size:calc(15px * var(--fs, 1)); }
  .sb-two { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:8px; }
  .sb-team { display:grid; grid-template-columns:minmax(0,1fr) 52px 84px; gap:8px; align-items:center; }
  .sb-team input[type=number] { font:calc(28px * var(--fs, 1)) var(--mono); text-align:center; padding:4px; }
  .sb-stp { display:grid; grid-template-columns:44px minmax(0,1fr) 44px; gap:4px; align-items:center; }
  .sb-stp .btn { min-height:44px; padding:0; font-size:calc(22px * var(--fs, 1)); }
  .sb-stp b { text-align:center; font:calc(24px * var(--fs, 1)) var(--mono); color:var(--tc, var(--text)); }
  .sb-lab { font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; color:var(--label); text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sb-lab i { font-style:normal; color:var(--tc); }
  .sb-perrow { display:grid; grid-template-columns:56px minmax(0,1fr) 56px; gap:6px; align-items:center; }
  .sb-perrow .v { text-align:center; font:700 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--lav); }
  .sb-cnt { font:calc(22px * var(--fs, 1)) var(--mono); color:var(--cyan); text-align:center; }
  .sb-togo { display:grid; grid-template-columns:auto minmax(0,1fr); gap:8px; align-items:center; }
  .sb-poss .btn { display:block; line-height:48px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:calc(15px * var(--fs, 1)); }
  .sb-adj .btn { font-family:var(--mono); letter-spacing:0; font-size:calc(15px * var(--fs, 1)); }
  .sb-f1 { display:flex; flex-direction:column; gap:6px; }
  .sb-f1 .item { min-height:44px; }
  `);

  // ------------------------------------------------------------------ the board (always visible on the page)
  GB.panel('score', 10, el => {
    P.board = el; el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `<div class="ph"><span>Scoreboard</span><span class="r" id="sbInfo">–</span></div>
      <div class="sb-led" id="sbLed"><span class="sb-tag" id="sbTag">OFF</span><div id="sbBoard"></div></div>
      <div class="seg" id="sbMode">${MODES.map(([k, t, c]) => `<button class="btn" data-sbm="${k}" style="--c:${c}">${t}</button>`).join('')}</div>`;
    el.querySelectorAll('[data-sbm]').forEach(b => b.onclick = async () => {
      const m = b.dataset.sbm; let ok;
      if (m === 'off') ok = await score({action: 'off'}); else if (m === 'game') ok = await score({action: 'game'});
      else if (m === 'f1') ok = await score({action: 'f1'}); else { ok = await score({action: 'on', mode: 'live'}); teamsFor = ''; loadTeams(); }
      if (!ok) return;
      GB.toast(m === 'off' ? 'Scoreboard off, back to the light show' : m === 'game' ? '🏟️ Game Day scoreboard' : m === 'f1' ? '🏎️ F1 running order (latest session)' : '📺 Live Fan scoreboard');
      if (SB) { SB.on = m !== 'off'; if (m !== 'off') SB.mode = m; render(); }
      refresh(300);
    });
  });

  // ------------------------------------------------------------------ Game Day: scoring keys, clock, period, game state
  GB.panel('score', 20, el => {
    P.keys = el; el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span>Controls</span><span class="r" id="sbSportR"></span></div>
      <div class="sb-keys" id="sbPts"><div class="sb-col" id="sbHp"></div><div class="sb-col" id="sbAp"></div></div>
      <div id="sbClockBox">
        <div class="sub">Game clock</div>
        <div class="seg" style="margin-top:6px"><button class="btn c lg" id="sbClk" style="--c:var(--green)"></button><button class="btn c lg" id="sbClkR" style="--c:var(--amber)">Reset</button></div>
        <div class="seg sb-adj" style="margin-top:6px"><button class="btn sm" data-adj="-60" aria-label="Minus 1 minute">−1:00</button><button class="btn sm" data-adj="-10" aria-label="Minus 10 seconds">−0:10</button><button class="btn sm" data-adj="10" aria-label="Plus 10 seconds">+0:10</button><button class="btn sm" data-adj="60" aria-label="Plus 1 minute">+1:00</button></div>
      </div>
      <div id="sbPerBox">
        <div class="sub">Period</div>
        <div class="sb-perrow" style="margin-top:6px"><button class="btn" id="sbPm" aria-label="Previous period">${GB.svg('left', ' style="width:26px;height:26px"')}</button><div class="v" id="sbPer">Half 1</div><button class="btn" id="sbPp" aria-label="Next period">${GB.svg('right', ' style="width:26px;height:26px"')}</button></div>
      </div>
      <div id="sbBase" hidden>
        <div class="sub">Count</div>
        <div class="sb-cnt" id="sbCount">0-0 · 0 out</div>
        <div class="seg"><button class="btn c" data-cnt="ball" style="--c:var(--green)">Ball</button><button class="btn c" data-cnt="strike" style="--c:var(--amber)">Strike</button><button class="btn c" data-cnt="out" style="--c:var(--red)">Out</button><button class="btn sm" data-cnt="clear">Clear</button></div>
      </div>
      <div id="sbDowns" hidden>
        <div class="sub">Down and distance</div>
        <div class="seg" id="sbDown" style="margin-top:6px">${[1, 2, 3, 4].map(n => `<button class="btn" data-down="${n}" style="--c:var(--cyan)">${ORD[n]}</button>`).join('')}</div>
        <div class="sb-togo" style="margin-top:6px"><span class="sb-lab">Yards to go</span><div class="sb-stp"><button class="btn" data-togo="-1">−</button><input type="number" id="sbTogo" min="0" max="99" inputmode="numeric" style="text-align:center;font:calc(22px * var(--fs, 1)) var(--mono)"><button class="btn" data-togo="1">+</button></div></div>
      </div>
      <div id="sbPossBox">
        <div class="sub">Ball</div>
        <div class="seg sb-poss" id="sbPoss" style="margin-top:6px"><button class="btn" data-poss="home"></button><button class="btn" data-poss="" style="--c:var(--dim)">Nobody</button><button class="btn" data-poss="away"></button></div>
      </div>
      <div class="seg"><button class="btn" id="sbUndo">Undo</button><button class="btn" id="sbSwap">Swap sides</button><button class="btn danger" id="sbReset">New game</button></div>`;

    $('sbClk').onclick = () => score({action: 'clock', do: 'toggle'}).then(r => { if (r && SB) { SB.running = !SB.running; render(); } });
    $('sbClkR').onclick = () => score({action: 'clock', do: 'reset'});
    el.querySelectorAll('[data-adj]').forEach(b => b.onclick = () => score({action: 'clock', adjust: +b.dataset.adj}));
    $('sbPm').onclick = () => score({action: 'period', delta: -1}); $('sbPp').onclick = () => score({action: 'period', delta: 1});
    el.querySelectorAll('[data-cnt]').forEach(b => b.onclick = () => score({action: 'count', what: b.dataset.cnt}));
    el.querySelectorAll('[data-down]').forEach(b => b.onclick = () => score({action: 'set', down: +b.dataset.down}));
    $('sbTogo').onchange = e => score({action: 'set', togo: Math.max(0, +e.target.value || 0)});
    $('sbTogo').onfocus = e => e.target.select();
    el.querySelectorAll('[data-togo]').forEach(b => b.onclick = () => { const v = Math.max(0, Math.min(99, ((SB && SB.togo) || 0) + +b.dataset.togo)); if (SB) SB.togo = v; $('sbTogo').value = v; score({action: 'set', togo: v}); });
    el.querySelectorAll('[data-poss]').forEach(b => b.onclick = () => score({action: 'set', poss: b.dataset.poss || null}));
    $('sbSwap').onclick = () => score({action: 'swap'});
    $('sbUndo').onclick = async () => { if (!SB || !SB.can_undo) return GB.toast('Nothing to undo'); if (await score({action: 'undo'})) { GB.toast('↶ Undone'); refresh(250); } };
    $('sbReset').onclick = async () => {
      const b = $('sbReset');
      if (Date.now() - resetArm > 4000) { resetArm = Date.now(); b.textContent = 'Tap again: 0-0'; b.style.boxShadow = 'inset 0 0 0 2px var(--red)';
        clearTimeout(resetT); resetT = setTimeout(() => { b.textContent = 'New game'; b.style.boxShadow = ''; }, 4000); return; }
      resetArm = 0; clearTimeout(resetT); b.textContent = 'New game'; b.style.boxShadow = '';
      if (await score({action: 'reset'})) { GB.toast('New game: 0 - 0'); refresh(400); }
    };
  });

  // ------------------------------------------------------------------ Game Day: teams, sport, game setup, timeouts / fouls
  GB.panel('score', 30, el => {
    P.setup = el; el.classList.add('box'); el.style.setProperty('--c', 'var(--lav)'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span>Teams and game</span></div>
      <label class="field">Sport<select id="sbSport"></select></label>
      <div class="sb-lab">Home: name, color, score</div>
      <div class="sb-team"><input type="text" id="sbHn" maxlength="12" placeholder="Home" autocapitalize="characters"><input type="color" id="sbHc" value="#3d7bff" aria-label="Home color"><input type="number" inputmode="numeric" min="0" max="999" id="sbHs" value="0" aria-label="Home score"></div>
      <div class="sb-lab">Away: name, color, score</div>
      <div class="sb-team"><input type="text" id="sbAn" maxlength="12" placeholder="Away" autocapitalize="characters"><input type="color" id="sbAc" value="#e8384f" aria-label="Away color"><input type="number" inputmode="numeric" min="0" max="999" id="sbAs" value="0" aria-label="Away score"></div>
      <p class="note">Tap a score to type it in.</p>
      <div id="sbStats"><div class="sub">Timeouts and fouls</div><div class="sb-two" id="sbSteps" style="margin-top:6px"></div></div>
      <details id="sbCfg"><summary>Game setup: clock length, periods, count down or up</summary>
        <div class="grid2" style="margin-top:6px"><label class="field">Minutes per period<input type="number" id="sbMin" min="0" max="600" step="1" inputmode="numeric"></label>
        <label class="field">Number of periods<input type="number" id="sbPerN" min="1" max="99" inputmode="numeric"></label></div>
        <div class="seg" style="margin-top:8px"><button class="btn" data-sbdir="down" style="--c:var(--amber)">Count down</button><button class="btn" data-sbdir="up" style="--c:var(--amber)">Count up</button></div>
        <button class="btn c wide" id="sbCfgGo" style="--c:var(--lav);margin-top:8px">Set up the game</button>
        <p class="note" style="margin-top:8px">Tip: pick "Countdown timer only" as the sport for a big clock on the whole wall (60 minutes, halftime, a party countdown).</p>
      </details>
      <p class="note">At the field: bring the laptop, turn on your phone's hotspot, connect the laptop to it, then open the phone link. The TikTok curtains run on battery or outdoor power and talk to the laptop over Bluetooth.</p>`;

    $('sbSport').onchange = e => score({action: 'sport', sport: e.target.value}).then(() => refresh(250));
    const teamSet = () => { sbEdit = Date.now(); score({action: 'set', home: {name: $('sbHn').value || 'HOME', color: $('sbHc').value}, away: {name: $('sbAn').value || 'AWAY', color: $('sbAc').value}}); };
    ['sbHn', 'sbAn'].forEach(id => $(id).onchange = teamSet);
    ['sbHc', 'sbAc'].forEach(id => { let t = null; $(id).oninput = () => { sbEdit = Date.now(); clearTimeout(t); t = setTimeout(teamSet, 120); }; });
    [['sbHs', 'home'], ['sbAs', 'away']].forEach(([id, side]) => {
      $(id).onchange = e => { const v = Math.max(0, Math.min(999, parseInt(e.target.value) || 0)); score({action: 'set', [side]: {score: v}}); GB.toast('Score set: ' + v); e.target.blur(); };
      $(id).onfocus = e => e.target.select();
    });
    el.querySelectorAll('[data-sbdir]').forEach(b => b.onclick = () => el.querySelectorAll('[data-sbdir]').forEach(x => x.classList.toggle('on', x === b)));
    $('sbCfgGo').onclick = async () => {
      const on = el.querySelector('[data-sbdir].on'), dir = on ? on.dataset.sbdir : 'down';
      if (await score({action: 'config', minutes: +$('sbMin').value || 0, periods: +$('sbPerN').value || 1, dir})) {
        GB.toast('⏱️ Clock set: ' + ($('sbMin').value || 0) + ' min × ' + ($('sbPerN').value || 1)); refresh(250); }
    };
  });

  // ------------------------------------------------------------------ Live Fan
  GB.panel('score', 40, el => {
    P.live = el; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span>Live Fan</span><span class="r" id="sbLiveR"></span></div>
      <label class="field">League<select id="sbLg"></select></label>
      <label class="field">Team<select id="sbTeam"><option value="">Pick a league first</option></select></label>
      <button class="btn c lg wide" id="sbFollow" style="--c:var(--cyan)">Follow this team</button>
      <div class="read sm" style="--c:var(--cyan)"><span class="k">Status</span><span class="v" id="sbLiveSt" style="white-space:normal;font-size:calc(16px * var(--fs, 1))">Pick a league and team.</span></div>
      <p class="note">Scores update every 10 seconds during the game. Every time your team scores, the wall celebrates in their colors.</p>`;
    $('sbLg').onchange = () => { teamsFor = ''; loadTeams(); syncBoards(); };
    $('sbFollow').onclick = async () => {
      const bk = boardKey();
      if (bk) {                                                       // ⛳🏁🎾🥊 leaderboards: put that board on the wall
        const on = GB.feedsState && GB.feedsState.mode === bk;
        if (await GB.feed(on ? {mode: 'off'} : {feed: bk, on: true})) { GB.toast(on ? '🎵 Back to the music show' : BOARDS[bk][1]); GB.feedsRefresh(150); refresh(300); }
        const pn = boardPanel(bk); if (pn && !on) setTimeout(() => pn.scrollIntoView({behavior: 'smooth', block: 'start'}), 250);
        return;
      }
      const t = $('sbTeam'); if (!t.value) return GB.toast('Pick a team');
      const nm = t.options[t.selectedIndex].text;
      if (await score({action: 'live', league: $('sbLg').value, team_id: t.value, team_name: nm})) { GB.toast('📺 Following ' + nm); refresh(300); }
    };
  });

  // ------------------------------------------------------------------ 📊 Game Center: every live stat ESPN gives us
  GB.css(`
  .sb-gc .sb-gline { font:600 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:var(--lav); }
  .sb-gc .sb-last { background:#06050c; border-left:6px solid var(--amber); border-radius:0 12px 0 12px; padding:10px 12px; font:calc(16px * var(--fs, 1))/1.35 var(--body); }
  .sb-gc .sb-sit { display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px; align-items:center; }
  .sb-gc .sb-dia { width:110px; height:110px; }
  .sb-gc .sb-cnt { display:grid; grid-template-columns:auto 1fr; gap:6px 10px; align-items:center; font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; color:var(--dim); }
  .sb-gc .sb-dots { display:flex; gap:6px; } .sb-gc .sb-dots i { width:16px; height:16px; border-radius:50%; background:var(--dark2); }
  .sb-gc .sb-who { font-size:calc(14px * var(--fs, 1)); line-height:1.45; color:var(--text); } .sb-gc .sb-who small { color:var(--dim); }
  .sb-gc .sb-ls { overflow-x:auto; } .sb-gc table { border-collapse:collapse; font:calc(15px * var(--fs, 1)) var(--mono); width:100%; min-width:max-content; }
  .sb-gc td, .sb-gc th { padding:4px 6px; text-align:center; border-bottom:1px solid var(--line); }
  .sb-gc th { font:600 calc(12px * var(--fs, 1)) var(--cond); color:var(--label); letter-spacing:1px; } .sb-gc td.t { text-align:left; font-family:var(--cond); font-weight:700; letter-spacing:1px; }
  .sb-gc td.tot { color:var(--amber); }
  .sb-gc .sb-lead { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px; }
  .sb-gc .sb-lead div { font-size:calc(13px * var(--fs, 1)); color:var(--dim); line-height:1.5; } .sb-gc .sb-lead b { color:var(--text); font-weight:600; }
  .sb-gc .sb-down { font:calc(44px * var(--fs, 1))/1 var(--mono); color:var(--amber); }
  `);
  GB.panel('score', 35, el => {
    P.gc = el; el.classList.add('box', 'sb-gc'); el.style.setProperty('--c', 'var(--amber)'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span>Game center</span><span class="r" id="sbGcR"></span></div><div id="sbGc"></div>`;
  });
  function dots(n, max, col) { let h = ''; for (let i = 0; i < max; i++) h += `<i style="${i < n ? 'background:' + col + ';box-shadow:0 0 8px ' + col : ''}"></i>`; return `<span class="sb-dots">${h}</span>`; }
  function diamond(b) {
    const base = (x, y, on) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})" fill="${on ? '#ffb23d' : '#26213a'}" stroke="${on ? '#fff' : '#4a4366'}" stroke-width="2"${on ? ' style="filter:drop-shadow(0 0 6px #ffb23d)"' : ''}/>`;
    return `<svg class="sb-dia" viewBox="0 0 110 110" role="img" aria-label="Runners: ${['first', 'second', 'third'].filter((_, i) => b[i]).join(', ') || 'none'}">
      <path d="M55 95 L95 55 L55 15 L15 55 Z" fill="none" stroke="#2f5a2f" stroke-width="3"/>${base(95, 55, b[0])}${base(55, 15, b[1])}${base(15, 55, b[2])}
      <path d="M48 92 h14 v6 l-7 6 l-7 -6 z" fill="#ddd"/></svg>`;
  }
  function renderGC(mode) {
    const g = SB.live, box = $('sbGc'); if (!P.gc) return;
    const ex = (g && g.extra) || {}; const show = mode === 'live' && g && g.home && Object.keys(ex).length;
    P.gc.hidden = !show; if (!show) return;
    const sport = (SB.leagues_sport || {})[SB.league];
    $('sbGcR').textContent = [ex.note, ex.series].filter(Boolean).join(' · ');
    let h = '';
    if (ex.last && g.state === 'in') h += `<div class="sb-last"><div class="sb-gline">Last play</div>${esc(ex.last)}</div>`;
    if (ex.bases && g.state === 'in') {
      h += `<div class="sb-sit">${diamond(ex.bases)}<div class="sb-cnt">
        <span>BALLS</span>${dots(ex.balls, 3, '#3ce08a')}<span>STRIKES</span>${dots(ex.strikes, 2, '#ff4d6d')}<span>OUTS</span>${dots(ex.outs, 2, '#ffb23d')}
        <span style="grid-column:span 2" class="sb-who">${ex.batter ? `🏏 <b>${esc(ex.batter)}</b> <small>${esc(ex.batter_line || '')}</small><br>` : ''}${ex.pitcher ? `⚾ <b>${esc(ex.pitcher)}</b> <small>${esc(ex.pitcher_line || '')}</small>` : ''}${ex.due ? 'Due up: <b>' + ex.due.map(esc).join(', ') + '</b>' : ''}</span></div></div>`;
    }
    if (ex.down && g.state === 'in') h += `<div><div class="sb-gline">${ex.poss ? esc((ex.poss === 'home' ? g.home : g.away).abbr) + ' ball' : 'Down'}${ex.redzone ? ' · 🔴 RED ZONE' : ''}</div><div class="sb-down">${esc(ex.down)}</div></div>`;
    const A = ex.away || {}, Hm = ex.home || {};
    if ((A.line && A.line.length) || (Hm.line && Hm.line.length)) {
      const n = Math.max((A.line || []).length, (Hm.line || []).length, sport === 'baseball' ? 9 : 0), hasHE = A.hits != null;
      let th = '<th></th>'; for (let i = 1; i <= n; i++) th += `<th>${i}</th>`; th += '<th>R</th>' + (hasHE ? '<th>H</th><th>E</th>' : '');
      const row = (t, d) => { let r = `<td class="t" style="color:${esc(t.color)}">${esc(t.abbr)}</td>`; for (let i = 0; i < n; i++) r += `<td>${esc((d.line || [])[i] ?? '')}</td>`;
        return r + `<td class="tot">${t.score}</td>` + (hasHE ? `<td>${d.hits ?? ''}</td><td>${d.errors ?? ''}</td>` : ''); };
      h += `<div class="sb-ls"><table><tr>${th}</tr><tr>${row(g.away, A)}</tr><tr>${row(g.home, Hm)}</tr></table></div>`;
    }
    const lead = (t, d) => { const seen = new Set(); const L = (d.leaders || []).filter(x => !seen.has(x.name + x.val) && seen.add(x.name + x.val));
      return `<div><b style="color:${esc(t.color)}">${esc(t.abbr)}</b>${d.record ? ` <small>(${esc(d.record)})</small>` : ''}<br>${L.map(x => `${esc(x.cat)}: <b>${esc(x.name)}</b> ${esc(x.val)}`).join('<br>') || '<small>No leaders yet</small>'}</div>`; };
    if ((A.leaders || Hm.leaders || A.record)) h += `<div class="sub">Top players</div><div class="sb-lead">${lead(g.away, A)}${lead(g.home, Hm)}</div>`;
    if (box._h !== h) { box.innerHTML = h; box._h = h; }
  }

  // ------------------------------------------------------------------ F1
  GB.panel('score', 50, el => {
    P.f1 = el; el.classList.add('box'); el.style.setProperty('--c', 'var(--orange)'); el.hidden = true;
    el.innerHTML = `<div class="ph"><span>F1 running order</span><span class="r" id="sbF1R"></span></div>
      <div class="read sm" style="--c:var(--orange)"><span class="k">Feed</span><span class="v" id="sbF1St" style="white-space:normal;font-size:calc(16px * var(--fs, 1))">Connecting to the timing feed…</span></div>
      <div class="sb-f1" id="sbF1List"></div>
      <p class="note">The wall shows the latest F1 session: driver codes in team colors, the lap, flags and safety car, tyres, gaps, pit stops and the fastest lap. It celebrates a new leader and the chequered flag.</p>
      <p class="note">Updates every few seconds during a session and once a minute between sessions. The free timing feed can run a little behind TV.</p>`;
  });

  // ------------------------------------------------------------------ golf, racing, tennis and UFC sit in the Live Fan list too
  const BOARDS = {golf: ['⛳ Golf leaderboard', '⛳ Golf leaderboard on the wall', 'golf'], nascar: ['🏁 Racing: NASCAR & IndyCar', '🏁 Racing running order on the wall', 'racing'],
                  tennis: ['🎾 Tennis: live matches', '🎾 Tennis scores on the wall', 'tennis'], ufc: ['🥊 UFC fight card', '🥊 UFC fight card on the wall', 'ufc']};
  const boardKey = () => { const v = ($('sbLg') || {}).value || ''; return v.startsWith('board:') ? v.slice(6) : ''; };
  const boardPanel = k => [...document.querySelectorAll('#pg-score > .panel')].find(x => { const h = x.querySelector('.ph span'); return h && h.textContent.trim().toLowerCase() === BOARDS[k][2]; });
  function syncBoards() {
    const bk = boardKey(), live = P.live && !P.live.hidden, fm = (GB.feedsState || {}).mode;
    Object.keys(BOARDS).forEach(k => { const pn = boardPanel(k); if (pn) pn.hidden = !((live && bk === k) || fm === k); });
    const tf = $('sbTeam') && $('sbTeam').closest('label'); if (tf) tf.hidden = !!bk;
    const f = $('sbFollow'); if (f) f.textContent = bk ? ((fm === bk) ? 'Take it off the wall' : 'Put it on the wall') : 'Follow this team';
    const st = $('sbLiveSt'); if (st && bk) st.textContent = fm === bk ? 'On the wall now. Settings are just below.' : 'Tap Put it on the wall. Settings are just below.';
  }
  GB.on('feeds', () => syncBoards());

  // ------------------------------------------------------------------ teams list for Live Fan
  async function loadTeams() {
    const lg = $('sbLg').value, t = $('sbTeam'); if (!lg || teamsFor === lg || lg.startsWith('board:')) return; teamsFor = lg;
    t.innerHTML = '<option value="">Loading teams…</option>';
    try {
      const r = await GB.get('/api/score/teams?league=' + encodeURIComponent(lg)); t.innerHTML = '';
      (r.teams || []).forEach(x => t.add(new Option(x.name, x.id)));
      if (!(r.teams || []).length) t.innerHTML = '<option value="">No teams found</option>';
      if (SB && SB.team_id && SB.league === lg) t.value = SB.team_id;
      if (r.error) GB.toast(r.error);
    } catch (e) { teamsFor = ''; t.innerHTML = '<option value="">Couldn\'t load teams (is the laptop online?)</option>'; }
  }

  // ------------------------------------------------------------------ drawing
  const fmtClock = c => { c = Math.max(0, Math.floor(c || 0)); return c >= 6000 ? Math.floor(c / 3600) + ':' + String(Math.floor(c / 60) % 60).padStart(2, '0') + ':' + String(c % 60).padStart(2, '0') : GB.fmt(c); };
  const teamCol = (t, side, ball, stats) => {
    const s = t.score == null ? '–' : t.score, g = glow(t.color || '#888');
    return `<div class="sb-tm${ball ? ' ball' : ''}" style="--tc:${g}"><div class="sb-nm"><span class="sb-pos"></span>${esc(t.name || side)}</div>
      <div class="sb-sc${String(s).length > 2 ? ' d3' : ''}">${esc(s)}</div><div class="sb-st">${stats || ''}</div></div>`;
  };
  function perText(sp) {
    if (sp.innings) return (SB.half === 'top' ? 'Top ' : 'Bot ') + SB.period;
    if (!sp.per) return '';
    return (sp.periods >= 99 ? 'Round' : (PER[sp.per] || 'Period')) + ' ' + SB.period;
  }
  function boardHTML(mode, sp) {
    const nw = SB.now || {};
    if (mode === 'f1') return `<div class="sb-big"><div class="sb-t" style="--tc:var(--orange)">F1</div><div class="sb-s">${esc(SB.live_err ? '⚠️ ' + SB.live_err : 'Running order of the latest session')}</div></div>`;
    if (mode === 'live') {
      const g = SB.live;
      if (!g || !g.home) return `<div class="sb-big"><div class="sb-t" style="--tc:var(--cyan)">${esc((SB.team_name || 'Live Fan').toUpperCase())}</div>
        <div class="sb-s">${esc(SB.live_err ? '⚠️ ' + SB.live_err + ' (checking again soon)' : SB.team_name ? 'Looking for today\'s game…' : 'Pick a league and team below')}</div></div>`;
      const isBase = (SB.leagues_sport || {})[SB.league] === 'baseball';
      let st = g.state === 'in' ? (g.clock || 'LIVE') : g.state === 'post' ? 'FINAL' : 'TODAY';
      let per = g.state === 'in' ? ((g.detail || '').split(' - ').pop() || (g.period ? 'P' + g.period : '')) : g.state === 'pre' ? (g.detail || '') : '';
      if (isBase && g.state === 'in') { st = ((g.clock || '').toLowerCase().startsWith('b') ? '▼' : '▲') + ' ' + (g.period || ''); per = (g.detail || '').toUpperCase(); }
      return `<div class="sb-grid">${teamCol({name: g.away.abbr || g.away.name, color: g.away.color, score: g.away.score}, 'AWAY', false, esc(g.away.name || ''))}
        <div class="sb-mid"><div class="sb-clk${g.state === 'in' ? ' run' : ''}" style="${g.state !== 'in' ? 'font-size:clamp(24px,9cqw,40px)' : ''}">${esc(st)}</div>${per ? `<div class="sb-per">${esc(per)}</div>` : ''}<div class="sb-ext">${esc(g.source || '')}</div></div>
        ${teamCol({name: g.home.abbr || g.home.name, color: g.home.color, score: g.home.score}, 'HOME', false, esc(g.home.name || ''))}</div>`;
    }
    if (SB.sport === 'timer') return `<div class="sb-big"><div class="sb-clk${SB.running ? ' run' : ''}">${fmtClock(SB.clock)}</div><div class="sb-s">${SB.running ? 'Running' : 'Paused'}</div></div>`;
    const stats = t => [t.timeouts ? 'TO ' + t.timeouts : '', t.fouls ? 'F ' + t.fouls : '', sp.sets && t.sets ? 'SETS ' + t.sets : ''].filter(Boolean).join(' · ');
    let ext = '';
    if (sp.innings) ext = `${SB.balls}-${SB.strikes} · ${SB.outs} OUT`;
    else if (sp.downs) ext = `${ORD[Math.min(4, Math.max(1, SB.down))]} & ${SB.togo}`;
    return `<div class="sb-grid">${teamCol(SB.home, 'HOME', SB.poss === 'home', stats(SB.home))}
      <div class="sb-mid">${nw.minutes ? `<div class="sb-clk${SB.running ? ' run' : ''}">${fmtClock(SB.clock)}</div>` : ''}${perText(sp) ? `<div class="sb-per">${esc(perText(sp))}</div>` : ''}${ext ? `<div class="sb-ext">${esc(ext)}</div>` : ''}</div>
      ${teamCol(SB.away, 'AWAY', SB.poss === 'away', stats(SB.away))}</div>`;
  }

  function pads(sp) {
    [['sbHp', 'home'], ['sbAp', 'away']].forEach(([id, side]) => {
      const box = $(id), t = SB[side], key = sp.pts.join(',') + '|' + t.name + '|' + t.color;
      if (box._k === key) return; box._k = key;
      const g = glow(t.color), c = t.color || '#888';
      box.style.setProperty('--tc', g);
      box.innerHTML = `<div class="hd">${esc(t.name)}</div>` +
        sp.pts.map(p => `<button class="btn c pt" data-p="${p}" style="--c:${esc(c)};color:${ink(c)}">+${p}</button>`).join('') +
        `<button class="btn mn" data-p="-1">−1</button>`;
      box.querySelectorAll('[data-p]').forEach(b => b.onclick = () => score({action: 'add', team: side, points: +b.dataset.p}).then(r => {
        if (r && SB) { SB[side].score = Math.max(0, SB[side].score + +b.dataset.p); render(); } }));
    });
  }

  function steppers(sp) {
    const box = $('sbSteps'), what = [['timeouts', 'Timeouts'], ['fouls', 'Fouls']].concat(sp.sets ? [['sets', 'Sets won']] : []);
    const key = SB.home.name + SB.away.name + SB.home.color + SB.away.color + what.length;
    if (box._k !== key) {
      box._k = key; box.innerHTML = '';
      ['home', 'away'].forEach(tm => {
        const col = document.createElement('div'); col.className = 'sb-col'; col.style.setProperty('--tc', glow(SB[tm].color));
        col.innerHTML = what.map(([w, lab]) => `<div class="sb-lab">${lab} <i>${esc(SB[tm].name)}</i></div>
          <div class="sb-stp"><button class="btn" data-d="-1" data-w="${w}" aria-label="Minus">−</button><b data-v="${tm}|${w}">0</b><button class="btn" data-d="1" data-w="${w}" aria-label="Plus">+</button></div>`).join('');
        col.querySelectorAll('[data-d]').forEach(b => b.onclick = () => score({action: 'stat', team: tm, what: b.dataset.w, delta: +b.dataset.d}));
        box.appendChild(col);
      });
    }
    box.querySelectorAll('[data-v]').forEach(x => { const [tm, w] = x.dataset.v.split('|'); x.textContent = SB[tm][w] || 0; });
  }

  function render() {
    if (!SB || !SB.sports || !P.board) return;
    const sp = SB.sports[SB.sport] || {pts: [], per: 'P', periods: 4}, mode = SB.on ? SB.mode : 'off', act = document.activeElement;
    // board + mode
    const bOn = !!BOARDS[(GB.feedsState || {}).mode]; P.board.querySelectorAll('[data-sbm]').forEach(x => x.classList.toggle('on', bOn ? x.dataset.sbm === 'live' : x.dataset.sbm === mode));
    const led = $('sbLed'), tag = $('sbTag'), liveIn = mode === 'live' && SB.live && SB.live.state === 'in';
    led.classList.toggle('off', mode === 'off');
    tag.textContent = mode === 'off' ? 'OFF' : liveIn ? 'LIVE' : 'ON THE WALL'; tag.className = 'sb-tag' + (liveIn ? ' live' : mode !== 'off' ? ' on' : '');
    const html = boardHTML(mode === 'off' ? (SB.mode || 'game') : mode, sp);
    if ($('sbBoard')._h !== html) { $('sbBoard')._h = html; $('sbBoard').innerHTML = html; }
    $('sbInfo').textContent = mode === 'off' ? 'OFF' : mode === 'game' ? (ICON[SB.sport] || '🏆') + ' ' + (sp.name || '') : mode === 'live' ? (SB.leagues[SB.league] || '') : 'F1';
    P.keys.hidden = P.setup.hidden = mode !== 'game'; P.live.hidden = mode !== 'live' && !BOARDS[(GB.feedsState || {}).mode]; P.f1.hidden = mode !== 'f1'; syncBoards();

    // sport list + leagues (filled once)
    const sel = $('sbSport'); if (!sel.options.length) Object.entries(SB.sports).forEach(([k, v]) => sel.add(new Option((ICON[k] || '🏆') + '  ' + v.name, k)));
    if (act !== sel) sel.value = SB.sport;
    const lg = $('sbLg');
    if (!lg.options.length) {                                         // 44 leagues, grouped: pro, women, college, world soccer, more of the world
      const grp = SB.leagues_group || {}, made = {};
      Object.entries(SB.leagues || {}).forEach(([k, v]) => {
        const g = grp[k]; let host = lg;
        if (g) { if (!made[g]) { made[g] = document.createElement('optgroup'); made[g].label = g; lg.appendChild(made[g]); } host = made[g]; }
        host.appendChild(new Option(v, k));
      });
      const og = document.createElement('optgroup'); og.label = 'Golf, racing, tennis & UFC'; lg.appendChild(og);
      Object.entries(BOARDS).forEach(([k, v]) => og.appendChild(new Option(v[0], 'board:' + k)));
      const fm = (GB.feedsState || {}).mode; lg.value = BOARDS[fm] ? 'board:' + fm : SB.league;
    }

    if (mode === 'game') {
      $('sbSportR').textContent = (ICON[SB.sport] || '🏆') + ' ' + (sp.name || '');
      if (Date.now() - sbEdit > 2500) {
        if (act !== $('sbHn')) $('sbHn').value = SB.home.name; if (act !== $('sbAn')) $('sbAn').value = SB.away.name;
        $('sbHc').value = SB.home.color; $('sbAc').value = SB.away.color;
      }
      if (act !== $('sbHs')) $('sbHs').value = SB.home.score; if (act !== $('sbAs')) $('sbAs').value = SB.away.score;
      $('sbPts').hidden = !sp.pts.length; pads(sp);
      const nw = SB.now || {};
      $('sbClockBox').hidden = !nw.minutes;
      if ($('sbClk')._r !== !!SB.running) { $('sbClk')._r = !!SB.running; GB.lbl($('sbClk'), SB.running ? 'pause' : 'play', SB.running ? 'Pause' : 'Start'); }
      $('sbClk').style.setProperty('--c', SB.running ? 'var(--amber)' : 'var(--green)');
      $('sbPerBox').hidden = SB.sport === 'timer'; $('sbPer').textContent = perText(sp);
      $('sbBase').hidden = !sp.innings; $('sbCount').textContent = SB.balls + '-' + SB.strikes + ' · ' + SB.outs + ' out';
      $('sbDowns').hidden = !sp.downs;
      P.keys.querySelectorAll('[data-down]').forEach(b => b.classList.toggle('on', +b.dataset.down === Math.min(4, Math.max(1, SB.down))));
      if (act !== $('sbTogo')) $('sbTogo').value = SB.togo;
      $('sbPossBox').hidden = SB.sport === 'timer';
      P.keys.querySelectorAll('[data-poss]').forEach(b => {
        const s = b.dataset.poss; b.classList.toggle('on', (SB.poss || '') === s);
        if (s) { b.textContent = SB[s].name; b.style.setProperty('--c', SB[s].color); b.style.color = b.classList.contains('on') ? ink(SB[s].color) : ''; }
      });
      $('sbUndo').disabled = !SB.can_undo;
      $('sbStats').hidden = SB.sport === 'timer'; steppers(sp);
      const cfg = $('sbCfg');
      if (!cfg.open || !cfg._init) { $('sbMin').value = nw.minutes || 0; $('sbPerN').value = nw.periods || 1;
        P.setup.querySelectorAll('[data-sbdir]').forEach(x => x.classList.toggle('on', x.dataset.sbdir === (nw.dir || 'down'))); cfg._init = cfg.open; }
    }
    renderGC(mode);
    if (mode === 'live') {
      if (lg.value && teamsFor !== lg.value) loadTeams();
      const g = SB.live;
      $('sbLiveR').textContent = SB.team_name || '';
      $('sbLiveSt').textContent = SB.live_err ? '⚠️ ' + SB.live_err + ' (checking again soon)' :
        g && g.home ? `${g.away.abbr} ${g.away.score} @ ${g.home.abbr} ${g.home.score} · ${g.state === 'in' ? 'LIVE' : g.state === 'post' ? 'Final' : g.detail || 'Today'} · via ${g.source}` :
        (SB.team_name ? 'Following ' + SB.team_name + ' · looking for today\'s game…' : 'Pick a league and team.');
    }
    if (mode === 'f1') {
      $('sbF1R').textContent = SB.live_err ? 'NO FEED' : 'LIVE';
      $('sbF1St').textContent = SB.live_err ? '⚠️ ' + SB.live_err + ' (trying again soon)' : 'Running. The wall shows the live order.';
      // if the engine ever shares the order itself, list it here
      const f = SB.f1, list = $('sbF1List'), rows = f && Array.isArray(f.order) ? f.order : [];
      const h = rows.map((d, i) => `<div class="item"><b class="mono" style="width:34px;color:var(--amber)">P${i + 1}</b><span style="width:10px;height:28px;border-radius:3px;background:${esc(d.color || '#888')}"></span><div class="tx"><b>${esc(d.code || '')}</b><small>${esc(d.name || '')}</small></div></div>`).join('');
      if (list._h !== h) { list._h = h; list.innerHTML = h; }
    }
  }

  // ------------------------------------------------------------------ polling
  let loopT = null;
  async function refresh(delay) {
    clearTimeout(loopT);
    if (delay) { loopT = setTimeout(() => refresh(0), delay); return; }
    try { const j = await GB.get('/api/score' + q()); if (j && !j.error) { SB = j; render(); } } catch (e) {}
    const fast = SB && SB.on && GB.page === 'score';
    loopT = setTimeout(() => refresh(0), document.hidden ? 3000 : fast ? 700 : 2500);
  }
  GB.on('ready', () => refresh(0));
  GB.on('group', () => { sbEdit = 0; refresh(0); });
  GB.on('page', id => { if (id === 'score') refresh(0); });
})();
