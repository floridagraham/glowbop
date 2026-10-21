/* 🎁 TikTok LIVE alerts panel (LIVE page): connect to your public LIVE by @username, pick which alerts flash the wall,
   watch the event log, and preview every alert with the Test keys (no need to be live). */
(function () {
  'use strict';
  const {$, esc} = GB;
  GB.css(`
  .tk-user { display:flex; gap:8px; align-items:center; } .tk-user input { flex:1; min-width:0; }
  .tk-at { font:700 20px var(--mono); color:var(--pink); }
  .tk-st { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px; background:var(--dark2); margin:10px 0 4px; min-width:0; }
  .tk-dot { width:12px; height:12px; border-radius:50%; background:var(--dim); flex:none; }
  .tk-st.live .tk-dot { background:#ff2d55; box-shadow:0 0 12px #ff2d55; animation:tkPulse 1.2s infinite; }
  .tk-st.wait .tk-dot { background:var(--amber); } .tk-st.conn .tk-dot { background:var(--cyan); animation:tkPulse .8s infinite; }
  .tk-st.err .tk-dot { background:var(--red); }
  @keyframes tkPulse { 50% { opacity:.35; } }
  .tk-st .tx { min-width:0; flex:1; font-size:14px; overflow-wrap:anywhere; }
  .tk-st.live #tkStT { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .tk-st .tx b { font:700 15px var(--cond); letter-spacing:1.5px; text-transform:uppercase; }
  .tk-st .vw { font:20px var(--mono); color:var(--text); white-space:nowrap; }
  .tk-tog { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; }
  .tk-min { display:flex; gap:8px; align-items:center; } .tk-min input { width:120px; flex:none; } .tk-min span { color:var(--dim); font-size:13px; min-width:0; }
  .tk-log { height:220px; } .tk-log .ev { display:flex; gap:8px; padding:6px 2px; border-bottom:1px solid rgba(255,255,255,.06); font-size:14px; min-width:0; }
  .tk-log .ev .tm { font:12px var(--mono); color:var(--dim); flex:none; width:38px; padding-top:2px; }
  .tk-log .ev .m { min-width:0; overflow-wrap:anywhere; } .tk-log .ev.gift .m { color:var(--gold); } .tk-log .ev.follow .m { color:var(--cyan); }
  .tk-log .ev.cmd .m { color:var(--lav); } .tk-log .ev.like .m { color:var(--pink); } .tk-log .ev.info .m { color:var(--dim); }
  .tk-log .none { color:var(--dim); font-size:14px; padding:10px 2px; }
  `);
  const ago = t => { const s = Math.max(0, Math.round(Date.now() / 1000 - t)); return s < 60 ? s + 's' : s < 3600 ? Math.floor(s / 60) + 'm' : Math.floor(s / 3600) + 'h'; };
  const send = async (b, msg) => { const r = await GB.feed(Object.assign({feed: 'tiktok'}, b)); if (r) { if (msg) GB.toast(msg); GB.feedsRefresh(); } return r; };

  GB.panel('feeds', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    el.innerHTML = `<div class="ph"><span>TikTok LIVE alerts</span><span class="r" id="tkR">OFF</span></div>
      <p class="note">When you go LIVE on TikTok, gifts, follows, likes and chat commands flash on your lights, right on top of the music show.</p>
      <label class="field">Your TikTok username
        <div class="tk-user"><span class="tk-at">@</span><input type="text" id="tkUser" placeholder="yourname" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40"></div></label>
      <div class="seg"><button class="btn c lg" id="tkGo" style="--c:var(--pink)">Connect</button></div>
      <div class="tk-st" id="tkSt"><span class="tk-dot"></span><div class="tx"><b id="tkStB">Off</b><div id="tkStT"></div></div><span class="vw" id="tkVw"></span></div>
      <p class="note">No password needed. It only reads your public LIVE.</p>
      <div class="sub">Alerts on the wall</div>
      <div class="tk-tog">
        <button class="btn" data-tk="gifts">Gifts</button><button class="btn" data-tk="follows">Follows + shares</button>
        <button class="btn" data-tk="likes">Likes (hearts)</button><button class="btn" data-tk="commands">Chat commands</button>
      </div>
      <label class="field">Big gift fireworks from
        <div class="tk-min"><input type="number" id="tkMin" min="1" max="100000" step="1" inputmode="numeric"><span>coins and up (a Lion is 29,999)</span></div></label>
      <p class="note">Chat commands your viewers can type: !red !blue !green !pink !purple !gold !rainbow (10 s color), !party (5 s strobe), !fire and !wave (switch the show). One per viewer every 15 s.</p>
      <div class="sub">Try it (no need to be live)</div>
      <div class="pads p3">
        <button class="btn c" style="--c:var(--gold)" data-tt="gift_small">Small gift</button>
        <button class="btn c" style="--c:var(--orange)" data-tt="gift_medium">Medium gift</button>
        <button class="btn c" style="--c:var(--pink)" data-tt="gift_big">Big gift</button>
        <button class="btn c" style="--c:var(--cyan)" data-tt="follow">Follow</button>
        <button class="btn c" style="--c:var(--red)" data-tt="hearts">Hearts</button>
        <button class="btn c" style="--c:var(--violet)" data-tt="!party">!party</button>
      </div>
      <div class="sub">Live events</div>
      <div class="scroll tk-log" id="tkLog"><div class="none">Nothing yet. Events show up here while you're live.</div></div>
      <p class="note">Uses an unofficial community connection to TikTok, so it may need an update if TikTok changes things.</p>`;

    $('tkGo').onclick = async () => {
      const f = GB.feedsState && GB.feedsState.feeds && GB.feedsState.feeds.tiktok;
      if (f && f.enabled) return send({disconnect: true}, 'TikTok alerts off');
      const u = $('tkUser').value.trim().replace(/^@/, '');
      if (!u) { GB.toast('Type your TikTok username'); $('tkUser').focus(); return; }
      GB.store.set('tkUser', u);
      send({username: u, connect: true}, '🎁 Connecting to @' + u);
    };
    $('tkUser').addEventListener('keydown', e => { if (e.key === 'Enter') $('tkGo').click(); });
    el.querySelectorAll('[data-tk]').forEach(b => b.onclick = () => {
      const k = b.dataset.tk, on = !b.classList.contains('on'); b.classList.toggle('on', on);
      send({set: {[k]: on}});
    });
    $('tkMin').addEventListener('change', () => {
      const v = Math.round(+$('tkMin').value);
      if (!(v >= 1)) return GB.toast('Pick a number of coins');
      send({set: {min_gift_coins: v}}, 'Big gifts from ' + v.toLocaleString() + ' coins');
    });
    el.querySelectorAll('[data-tt]').forEach(b => b.onclick = () => send({test: b.dataset.tt}, 'Preview on the wall'));
    const saved = GB.store.get('tkUser'); if (saved) $('tkUser').value = saved;
  });

  GB.on('feeds', s => {
    if (!$('tkSt')) return;
    const f = (s.feeds || {}).tiktok;
    if (!f || f.error) { $('tkStB').textContent = 'Not available'; $('tkStT').textContent = (f && f.error) || 'TikTok alerts are not loaded in this version.'; return; }
    const cls = {live: 'live', waiting: 'wait', connecting: 'conn', installing: 'conn', error: 'err'}[f.status] || '';
    $('tkSt').className = 'tk-st ' + cls;
    $('tkStB').textContent = {live: 'LIVE', waiting: 'Waiting', connecting: 'Connecting', installing: 'Installing…', error: 'Problem', off: 'Off'}[f.status] || f.status;
    $('tkStT').textContent = f.status === 'live' ? '@' + f.username : (f.status === 'off' ? 'Type your username and tap Connect.' : f.status_text);
    $('tkVw').textContent = f.status === 'live' && f.viewers != null ? '👁 ' + Number(f.viewers).toLocaleString() : '';
    $('tkR').textContent = f.status === 'live' ? 'LIVE' : f.enabled ? 'ON' : 'OFF';
    $('tkGo').textContent = f.enabled ? 'Disconnect' : 'Connect'; $('tkGo').classList.toggle('on', !!f.enabled);
    if (document.activeElement !== $('tkUser') && f.username && !$('tkUser').value) $('tkUser').value = f.username;
    document.querySelectorAll('[data-tk]').forEach(b => b.classList.toggle('on', !!f[b.dataset.tk]));
    if (document.activeElement !== $('tkMin')) $('tkMin').value = f.min_gift_coins;
    const lg = $('tkLog'), log = f.log || [], key = log.map(e => e.t + e.tx).join('|');
    if (lg._k !== key) {
      lg._k = key;
      lg.innerHTML = log.length ? log.map(e => `<div class="ev ${esc(e.k)}"><span class="tm" data-t="${e.t}">${ago(e.t)}</span><span class="m">${esc(e.tx)}</span></div>`).join('')
        : '<div class="none">Nothing yet. Events show up here while you\'re live.</div>';
    } else lg.querySelectorAll('.tm').forEach(x => x.textContent = ago(+x.dataset.t));
  });
})();
