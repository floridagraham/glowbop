/* GlowBop console: MUSIC page, Now Playing panel.
   Shows whatever is playing on the laptop (Spotify, Apple Music, Chrome... via /api/media) or GlowBop's own
   YouTube player (/api/music), with transport, scrub, volume, sleep / party, and the tucked-away YouTube browser
   (Search, Playlists, Moods, Up Next, Recent) inside ONE fixed-height scroll box. */
(function () {
  'use strict';
  const {$} = GB;
  const svg = (n, extra) => GB.svg(n, extra);
  const esc = GB.esc, fmt = GB.fmt;
  const toast = m => GB.toast(m);
  const get = p => GB.get(p);
  const post = (p, b) => GB.post(p, b);

  GB.css(`
  .mu-card { --c:var(--violet); }
  .mu-card .ph .mu-app { color:var(--violet); }
  .mu-card > .ph > span:first-child { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; flex:0 1 auto; }
  .mu-card > .ph > .r { flex:1 1 0; }
  .mu-opt > .btn { justify-content:center; white-space:nowrap; font-size:15px; letter-spacing:.5px; gap:6px; }
  .mu-opt > .btn > span { overflow:hidden; text-overflow:ellipsis; min-width:0; }
  .mu-vid { position:relative; width:100%; aspect-ratio:16/9; border-radius:0 14px 0 14px; overflow:hidden; background:#000; border:1px solid var(--line); }
  .mu-vid.off { height:0; aspect-ratio:auto; border:0; }
  .mu-vid > div { position:absolute; inset:0; transition:opacity 1s; } .mu-vid iframe { width:100%; height:100%; border:0; }
  .mu-np { display:flex; align-items:center; gap:14px; min-width:0; }
  .mu-art { width:88px; height:88px; flex:0 0 auto; border-radius:0 16px 0 16px; overflow:hidden; display:flex; align-items:center; justify-content:center;
    background:linear-gradient(135deg, color-mix(in srgb, var(--pink) 35%, #000), color-mix(in srgb, var(--cyan) 30%, #000)); box-shadow:0 0 0 2px var(--violet), 0 0 22px color-mix(in srgb, var(--violet) 45%, transparent); }
  .mu-art img { width:100%; height:100%; object-fit:cover; display:block; }
  .mu-art .ic { width:40px; height:40px; fill:#fff; opacity:.8; }
  .mu-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .mu-title { font:700 24px/1.1 var(--cond); letter-spacing:.5px; color:var(--text); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere; }
  .mu-artist { appearance:none; border:0; background:none; padding:0; text-align:left; color:var(--lav); font:15px/1.25 var(--body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-height:24px; max-width:100%; }
  .mu-artist.link { text-decoration:underline; text-decoration-color:color-mix(in srgb, var(--lav) 40%, transparent); text-underline-offset:3px; }
  .mu-scrubw { display:flex; flex-direction:column; gap:2px; }
  .mu-scrub { --c:var(--cyan); }
  .mu-scrub:disabled { opacity:.45; }
  .mu-tl { display:flex; justify-content:space-between; font:13px var(--mono); color:var(--cyan); }
  .mu-tl span:last-child { color:var(--dim); }
  .mu-tp > .btn { min-height:58px; }
  .mu-tp > .btn .ic { width:28px; height:28px; }
  .mu-tp > .mu-play { flex:1.7 1 0; min-height:64px; box-shadow:0 0 20px color-mix(in srgb, var(--pink) 50%, transparent); }
  .mu-tp > .mu-play .ic { width:36px; height:36px; }
  .mu-volrow { display:flex; align-items:center; gap:10px; min-width:0; }
  .mu-volrow > .lv { flex:1; min-width:0; }
  .mu-ibtn { width:48px; height:48px; min-height:48px; padding:0; flex:0 0 auto; border-radius:50%; }
  .mu-ibtn .ic { width:22px; height:22px; }
  .mu-fam { font-size:13px; color:var(--dim); min-height:18px; line-height:1.4; border-left:3px solid var(--amber); padding:2px 0 2px 10px; }
  .mu-fam:empty { display:none; }
  .mu-fam b { color:var(--amber); font-weight:600; }
  .mu-fam .ic { width:14px; height:14px; fill:var(--amber); vertical-align:-2px; display:inline; }
  .mu-ytopen.on { box-shadow:0 0 0 2px var(--red) inset; }
  .mu-yt { display:flex; flex-direction:column; gap:10px; border-top:1px solid var(--line); padding-top:12px; min-width:0; }
  .mu-ythead { display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .mu-ythead .sub { margin:0; color:var(--red); display:flex; align-items:center; gap:6px; }
  .mu-ythead .sub .ic { width:18px; height:18px; fill:var(--red); }
  .mu-ythead .acts { display:flex; gap:6px; }
  .mu-ib { appearance:none; border:0; background:var(--dark2); color:var(--text); width:44px; height:44px; min-height:44px; border-radius:50%; padding:0; flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; }
  .mu-ib .ic { width:21px; height:21px; fill:currentColor; }
  .mu-ib:active { filter:brightness(1.4); }
  .mu-ib:disabled { opacity:.35; }
  .mu-ib.on { background:var(--pink); color:#000; }
  .mu-ib.dis .ic { transform:rotate(180deg); }
  .mu-tabs > .btn { flex-direction:column; gap:2px; font-size:12px; padding:4px 2px; min-height:54px; letter-spacing:.5px; }
  .mu-tabs > .btn .ic { width:20px; height:20px; }
  .mu-tabs > .btn > span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  @media (max-width: 480px) { .mu-tabs { gap:3px; } .mu-tabs > .btn { font-size:10.5px; letter-spacing:0; padding:4px 1px; } }
  .mu-srow { display:flex; gap:8px; min-width:0; } .mu-srow input { flex:1 1 auto; min-width:0; } .mu-srow .btn { flex:0 0 auto; }
  .mu-pane { height:clamp(300px, 52vh, 460px); overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; -webkit-overflow-scrolling:touch;
    border:1px solid var(--line); border-left:4px solid var(--cyan); border-radius:0 14px 0 14px; background:#06050c; padding:6px 8px; min-width:0; }
  .mu-trk { cursor:pointer; gap:10px; padding:6px 2px; min-height:58px; }
  .mu-trk img, .mu-trk .mu-ph { width:44px; height:44px; border-radius:0 10px 0 10px; object-fit:cover; flex:0 0 auto; background:var(--dark2); display:flex; align-items:center; justify-content:center; }
  .mu-trk .mu-ph .ic { width:22px; height:22px; fill:var(--lav); }
  .mu-trk .tx b { font-weight:600; font-size:14px; }
  .mu-trk.cur { background:#1d1230; border-radius:10px; box-shadow:inset 3px 0 0 var(--pink); } .mu-trk.past { opacity:.45; }
  .mu-sub { display:flex; align-items:center; gap:8px; margin:10px 0 4px; font:600 13px var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--label); min-width:0; }
  .mu-sub > span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mu-sub .ic { width:15px; height:15px; fill:currentColor; vertical-align:-2px; display:inline; }
  .mu-back { flex:0 0 auto; }
  .mu-lh { position:sticky; top:-6px; z-index:3; background:#06050c; margin:-6px -8px 6px; padding:4px 8px 8px; border-bottom:1px solid var(--line); }
  .mu-lh .mu-sub { margin-top:4px; }
  .mu-acts { display:flex; gap:8px; margin:4px 0 8px; min-width:0; } .mu-acts > .btn { flex:1 1 0; min-width:0; padding:0 10px; }
  .mu-lh .mu-acts { margin-bottom:0; }
  .mu-moods { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:8px; }
  @media (min-width: 700px) { .mu-moods { grid-template-columns:repeat(3, minmax(0, 1fr)); } }
  @media (min-width: 1000px) and (min-aspect-ratio: 1/1) { .mu-moods { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
  .mu-mood { appearance:none; border:0; min-height:54px; border-radius:0 14px 0 14px; color:#fff; font:700 15px/1.1 var(--cond); letter-spacing:1px; text-transform:uppercase; text-align:right; padding:8px 12px; display:flex; align-items:flex-end; justify-content:flex-end; }
  .mu-mood:active { filter:brightness(1.25); }
  .mu-pane .note { padding:10px 4px; }
  .mu-steps { color:var(--dim); font-size:13px; padding-left:20px; margin:6px 0; } .mu-steps li { margin:4px 0; } .mu-steps b { color:var(--text); }
  .mu-fe { padding:10px; background:var(--dark2); border-left:4px solid var(--amber); border-radius:0 12px 0 12px; margin:4px 0 10px; display:flex; flex-direction:column; gap:8px; }
  .mu-fe .chips { gap:6px; } .mu-fe .chip { --c:var(--amber); }
  .mu-fe .row > .btn { flex:1 1 30%; }
  `);

  // ------------------------------------------------------------- state
  let ms = {}, np = {}, scrubbing = false, volT = null, lib = null, curTab = 'search', rated = {}, lastVol = 80;
  let si = null, siT = 0, mounted = false;
  const extPlaying = () => np && np.title && np.status === 'Playing' && !/glowbop/i.test(np.title || '');
  const ours = () => ms && ms.now && (ms.playing || !extPlaying());   // another app playing beats a paused GlowBop song
  const music = b => post('/api/music', b);
  const setIc = (id, n, extra) => { $(id).innerHTML = svg(n, extra); };
  const TABS = [['search', 'search', 'Search'], ['lists', 'lists', 'Playlists'], ['moods', 'moods', 'Moods'], ['queue', 'queue', 'Up Next'], ['recent', 'recent', 'Recent']];

  GB.panel('music', 10, el => {
    el.classList.add('box', 'mu-card'); el.id = 'muCard';
    el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `
      <div class="ph"><span id="muLbl">Now playing</span><span class="r" id="muSrc"></span></div>
      <div class="mu-vid off" id="appVid"><div id="aw0"><div id="ayt0"></div></div><div id="aw1" style="opacity:0"><div id="ayt1"></div></div></div>
      <div class="mu-np">
        <div class="mu-art" id="muArt" hidden></div>
        <div class="mu-meta"><div class="mu-title" id="muTitle">Nothing playing</div><button class="mu-artist" id="muArtist" type="button">Play music in any app on the laptop</button></div>
      </div>
      <div class="mu-scrubw">
        <input type="range" class="mu-scrub" id="muScrub" min="0" max="100" value="0" step="1" aria-label="Song position">
        <div class="mu-tl mono"><span id="muT0">0:00</span><span id="muT1">0:00</span></div>
      </div>
      <div class="seg mu-tp">
        <button class="btn" id="muPrev" aria-label="Previous"></button>
        <button class="btn c mu-play" id="muPlay" style="--c:var(--pink)" aria-label="Play or pause"></button>
        <button class="btn" id="muNext" aria-label="Next"></button>
      </div>
      <div class="mu-volrow">
        <button class="btn mu-ibtn" id="muMute" aria-label="Mute"></button>
        <div class="lv" style="--c:var(--cyan)"><span>Volume</span><input type="range" id="muVol" min="0" max="100" value="50" aria-label="Volume"><b id="muVolPct"></b></div>
      </div>
      <div class="mu-fam" id="muFam"></div>
      <div class="seg mu-opt">
        <button class="btn" id="muSleep" style="--c:var(--lav)"></button>
        <button class="btn" id="muParty" style="--c:var(--orange)"></button>
      </div>
      <button class="btn wide mu-ytopen" id="muYtOpen" style="--c:var(--red)"></button>
      <div class="mu-yt" id="muYt" hidden>
        <div class="mu-ythead"><div class="sub">${svg('play')}YouTube</div>
          <span class="acts"><button class="mu-ib" id="muLike" title="Like" aria-label="Like"></button><button class="mu-ib dis" id="muDis" title="Dislike" aria-label="Dislike"></button><button class="mu-ib" id="muSave" title="Save to a playlist" aria-label="Save to a playlist"></button></span></div>
        <div class="seg mu-opt">
          <button class="btn" id="muShuf" style="--c:var(--cyan)" title="Shuffle Up Next"></button>
          <button class="btn" id="muXf" style="--c:var(--cyan)"></button>
        </div>
        <div class="seg mu-tabs" id="muTabs"></div>
        <div class="mu-srow" id="muSearchBar"><input type="search" id="muQ" placeholder="Songs, artists, albums..." enterkeyhint="search" aria-label="Search YouTube"><button class="btn c" id="muGo" style="--c:var(--cyan)">${svg('search')}<span>Search</span></button></div>
        <div class="mu-pane" id="muPane">
          <div id="muT-search"><div id="muRes"><div class="note">Search YouTube for a song, artist or album above.</div></div></div>
          <div id="muT-lists" hidden><div id="muLib"></div></div>
          <div id="muT-moods" hidden><div id="muMoods"></div></div>
          <div id="muT-queue" hidden><div id="muQueue"></div></div>
          <div id="muT-recent" hidden><div id="muRecent"></div></div>
        </div>
      </div>`;
    wire();
    mounted = true;
  });

  // ------------------------------------------------------------- wiring
  function wire() {
    setIc('muPrev', 'prev'); setIc('muNext', 'next'); setIc('muSave', 'save');
    $('muShuf').innerHTML = svg('shuffle') + '<span>Shuffle</span>';
    $('muTabs').innerHTML = TABS.map(([k, ic, l]) => `<button class="btn${k === 'search' ? ' on' : ''}" data-tab="${k}" style="--c:var(--cyan)">${svg(ic)}<span>${l}</span></button>`).join('');
    $('muTabs').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => tab(b.dataset.tab));
    $('muYtOpen').onclick = () => ytShow($('muYt').hidden);
    ytShow(GB.store.get('gb_yt', '') === '1');

    const keyOr = (act, key) => async () => { if (ours()) await music({action: act}); else await post('/api/media', {action: key}); setTimeout(mediaPoll, 400); };
    $('muPlay').onclick = keyOr('toggle', 'playpause'); $('muNext').onclick = keyOr('next', 'next'); $('muPrev').onclick = keyOr('prev', 'prev');
    $('muShuf').onclick = async () => { if (!ours()) return toast('Shuffle works for songs played through GlowBop'); if (await music({action: 'shuffle'})) toast('🔀 Up Next shuffled'); };
    $('muParty').onclick = async () => { if (await music({action: 'party', on: !ms.party})) { toast(!ms.party ? '🔥 Party mode: chill songs get skipped, radio grows from the hottest tracks' : 'Party mode off'); mediaPoll(); } };
    $('muSleep').onclick = async () => {
      const steps = [0, 15, 30, 60, 90], cur = ms.sleep_left ? Math.ceil(ms.sleep_left / 60) : 0;
      const nxt = steps.find(m => m > cur) || 0;
      if (await music({action: 'sleep', minutes: nxt})) { toast(nxt ? `😴 Music + lights fade out in ${nxt} min` : 'Sleep timer off'); mediaPoll(); }
    };
    $('muXf').onclick = async () => {
      const steps = [0, 3, 6, 10], cur = ms.crossfade == null ? 6 : ms.crossfade, nxt = steps[(steps.indexOf(cur) + 1) % steps.length];
      if (await music({action: 'crossfade', seconds: nxt})) { toast(nxt ? `🎚️ Crossfade ${nxt}s` : 'Crossfade off'); mediaPoll(); }
    };
    $('muMute').onclick = async () => {
      if (!ours()) { await post('/api/media', {action: 'mute'}); setTimeout(mediaPoll, 400); return; }
      if (ms.volume > 0) { lastVol = ms.volume; await music({action: 'volume', volume: 0}); } else await music({action: 'volume', volume: lastVol || 70});
      mediaPoll();
    };
    const sc = $('muScrub');
    sc.oninput = () => { scrubbing = true; $('muT0').textContent = fmt(sc.value); };
    sc.onchange = async () => {
      if (ours()) await music({action: 'seek', pos: +sc.value}); else await post('/api/media', {action: 'seek', pos: +sc.value});
      setTimeout(() => { scrubbing = false; mediaPoll(); }, 700);
    };
    $('muVol').oninput = e => {
      const v = +e.target.value; $('muVolPct').textContent = v + '%'; clearTimeout(volT);
      volT = setTimeout(() => { if (ours()) music({action: 'volume', volume: v}); else post('/api/media', {action: 'vol', level: v}); }, 150);
    };
    const rate = how => async () => {
      if (!ours()) return; const id = ms.now.id, undo = rated[id] === how;
      if (await music({action: 'rate', id, how: undo ? 'remove' : how})) {
        rated[id] = undo ? null : how; toast(undo ? 'Rating removed' : how === 'like' ? '👍 Added to your Liked songs' : '👎 Disliked, skipping'); renderNow();
        if (how === 'dislike' && !undo) music({action: 'next'});
      }
    };
    $('muLike').onclick = rate('like'); $('muDis').onclick = rate('dislike');
    $('muSave').onclick = async () => {
      if (!ours()) return; const t = ms.now;
      let l; try { l = await get('/api/music/library'); } catch (e) { return toast('⚠️ Not connected'); }
      if (!l.signed_in) return toast('Sign in to YouTube Music first (Playlists tab on the laptop)');
      GB.sheet('Save "' + t.title + '" to...', (l.playlists || []).filter(p => p.id !== 'LM').map(p => ({label: p.title, onclick: async () => {
        if (await music({action: 'save', pid: p.id, id: t.id})) toast('➕ Saved to ' + p.title);
      }})));
    };
    $('muArtist').onclick = () => { if (ours() && ms.now.artist_id) { ytShow(true); tab('search'); openArtist(ms.now.artist_id); } };
    $('muGo').onclick = doSearch; $('muQ').onkeydown = e => { if (e.key === 'Enter') doSearch(); };
    renderNow();
  }

  // ▶ YouTube panel: closed until you want it (remembered on this device)
  function ytShow(on) {
    $('muYt').hidden = !on; const b = $('muYtOpen'); b.classList.toggle('on', on);
    GB.lbl(b, on ? 'close' : 'play', on ? 'Hide YouTube' : 'Play from YouTube');
    GB.store.set('gb_yt', on ? '1' : '');
  }

  // ------------------------------------------------------------- now playing
  async function mediaPoll() {
    try { ms = await get('/api/music'); } catch (e) { ms = {}; }
    try { np = await get('/api/media'); } catch (e) { np = {}; }        // always: so Spotify, Chrome... show when GlowBop's player is idle
    if (Date.now() - siT > 4000) { siT = Date.now(); try { si = (await get('/api/songinfo')).current; } catch (e) {} }
    if (!mounted) return;
    renderNow();
    if (curTab === 'queue' && !$('muYt').hidden) renderQueue();
  }
  async function mediaLoop() {
    await mediaPoll();
    setTimeout(mediaLoop, document.hidden ? 4000 : GB.page === 'music' ? 1000 : 3000);
  }

  function renderNow() {
    let title = 'Nothing playing', sub = 'Play music in any app on the laptop', art = svg('note'), pos = 0, dur = 0, playing = false, app = '', src = 'IDLE';
    const mine = ours();
    if (mine) {
      const t = ms.now; title = t.title; sub = ms.player ? (t.artist || '') : '⏳ opening the GlowBop Player on the laptop...';
      art = t.thumb ? `<img src="${esc(t.thumb)}" alt="">` : svg('note'); pos = ms.pos; dur = ms.dur; playing = ms.playing;
      app = 'YouTube'; src = ms.source ? ms.source : 'in GlowBop';
    } else if (np && np.title) {
      title = np.title; sub = np.artist || ''; pos = np.pos; dur = np.len; playing = np.status === 'Playing';
      app = np.app_name || 'Laptop'; src = playing ? 'on the laptop' : (np.status || '').toLowerCase() || 'on the laptop';
      if (np.art_v) art = `<img src="/api/media/art?v=${np.art_v}" alt="">`;
    }
    $('muLbl').innerHTML = 'Now playing' + (app ? ' · <span class="mu-app">' + esc(app) + '</span>' : '');
    $('muSrc').textContent = src;
    $('muTitle').textContent = title; $('muArtist').textContent = sub;
    $('muArtist').classList.toggle('link', !!(mine && ms.now.artist_id));
    // cover art is switched off (it did not update reliably for every app)
    setIc('muPlay', playing ? 'pause' : 'play');
    const sc = $('muScrub'); sc.disabled = !(dur > 0 && (mine || (np && np.title && np.can_seek)));
    if (!scrubbing) { sc.max = Math.max(1, Math.round(dur || 1)); sc.value = Math.round(pos || 0); GB.paintRange(sc); }
    $('muT0').textContent = fmt(scrubbing ? sc.value : pos); $('muT1').textContent = fmt(dur);
    const vid = mine ? ms.now.id : null, r = rated[vid];
    setIc('muLike', r === 'like' ? 'likeOn' : 'like'); $('muLike').classList.toggle('on', r === 'like');
    setIc('muDis', r === 'dislike' ? 'likeOn' : 'like'); $('muDis').classList.toggle('on', r === 'dislike');
    ['muLike', 'muDis', 'muSave'].forEach(i => $(i).disabled = !mine);
    const vol = mine ? ms.volume : (np && np.vol != null ? np.vol : null), muted = mine ? ms.volume === 0 : !!(np && np.mute);
    const vi = $('muVol');
    if (vol != null && document.activeElement !== vi) { vi.value = vol; GB.paintRange(vi); }
    if (document.activeElement !== vi) $('muVolPct').textContent = vol != null ? Math.round(vol) + '%' : '';
    setIc('muMute', muted || vol === 0 ? 'volOff' : 'vol'); $('muMute').classList.toggle('on', !!(muted || vol === 0));
    $('muMute').style.setProperty('--c', 'var(--red)');
    // light style for this song + the look family
    const sty = si && si.title && title && title.toLowerCase().includes(String(si.title).toLowerCase().slice(0, 12))
      ? [(si.genres || []).slice(0, 2).join(', '), si.bpm ? Math.round(si.bpm) + ' bpm' : ''].filter(Boolean).join(' · ') + (si.style ? ' → ' + ({epic: 'epic', dance: 'dance', chill: 'chill'}[si.style] || si.style) + ' lights' : '') : '';
    const fam = mine && ms.family && ms.family.length ? ms.family.map(esc).join(' · ') : '';
    $('muFam').innerHTML = sty ? svg('bulb') + ' ' + esc(sty) + (fam ? ` · <b>${fam}</b>` : '')
      : fam ? `${svg('palette')} Lights: <b>${fam}</b> ${ms.family_how === 'auto' ? '(auto)' : ''}` : '';
    const party = !!ms.party;
    $('muParty').innerHTML = svg('fire') + '<span>' + (party ? 'Party: on' : 'Party mode') + '</span>'; $('muParty').classList.toggle('on', party);
    $('muSleep').innerHTML = svg('moon') + '<span>' + (ms.sleep_left ? 'Sleep ' + Math.ceil(ms.sleep_left / 60) + 'm' : 'Sleep timer') + '</span>'; $('muSleep').classList.toggle('on', !!ms.sleep_left);
    const xf = ms.crossfade == null ? 6 : ms.crossfade;
    $('muXf').innerHTML = svg('xfade') + '<span>' + (xf ? 'Crossfade ' + xf + 's' : 'Crossfade off') + '</span>'; $('muXf').classList.toggle('on', xf > 0);
  }

  // ------------------------------------------------------------- the YouTube browser (one fixed-height box)
  function tab(k) {
    curTab = k; $('muTabs').querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x.dataset.tab === k));
    TABS.forEach(([n]) => { $('muT-' + n).hidden = n !== k; });
    $('muSearchBar').hidden = k !== 'search'; $('muPane').scrollTop = 0;
    if (k === 'lists') renderLib(true); if (k === 'queue') renderQueue(); if (k === 'moods') renderMoods(); if (k === 'recent') renderRecent();
  }
  const subHead = (html) => { const d = document.createElement('div'); d.className = 'mu-sub'; d.innerHTML = html; return d; };
  const addSub = (box, text) => box.appendChild(subHead('<span>' + esc(text) + '</span>'));
  const backBtn = label => `<button class="btn sm mu-back">${svg('back')}<span>${esc(label)}</span></button>`;
  function row(t, btns, onclick) {
    const d = document.createElement('div'); d.className = 'item mu-trk';
    d.innerHTML = (t.thumb ? `<img src="${esc(t.thumb)}" alt="" loading="lazy">` : `<span class="mu-ph">${svg(t.icon || 'note')}</span>`) +
      `<div class="tx"><b>${esc(t.title)}</b><small>${esc([t.artist || t.sub, t.dur ? fmt(t.dur) : ''].filter(Boolean).join(' · '))}</small></div>`;
    btns.forEach(([ic, fn, tip]) => { const b = document.createElement('button'); b.className = 'mu-ib'; b.title = tip || ''; b.setAttribute('aria-label', tip || ic); b.innerHTML = svg(ic); b.onclick = e => { e.stopPropagation(); fn(); }; d.appendChild(b); });
    if (onclick) d.onclick = onclick;
    return d;
  }
  const songBtns = t => [
    ['play', async () => { if (await music({action: 'play', track: t})) toast('▶ ' + t.title); setTimeout(mediaPoll, 500); }, 'Play now'],
    ['add', async () => { if (await music({action: 'add', track: t})) toast('＋ Added to Up Next'); }, 'Add to Up Next'],
    ['radio', async () => { toast('📻 Starting radio...'); if (await music({action: 'radio', track: t})) toast('📻 Radio: ' + t.title); setTimeout(mediaPoll, 500); }, 'Radio from this song'],
  ];
  const listBtns = (pl, act) => [
    ['play', async () => { toast('Loading ' + pl.title + '...'); if (await music({action: act || 'playlist', id: pl.id, title: pl.title})) toast('▶ ' + pl.title); mediaPoll(); }, 'Play'],
    ['shuffle', async () => { toast('Loading ' + pl.title + '...'); if (await music({action: act || 'playlist', id: pl.id, title: pl.title, shuffle: true})) toast('🔀 ' + pl.title); mediaPoll(); }, 'Shuffle play'],
  ];
  const acts = (a, b) => { const rr = document.createElement('div'); rr.className = 'mu-acts';
    rr.innerHTML = `<button class="btn c sm" style="--c:var(--pink)">${svg(a[0])}<span>${esc(a[1])}</span></button><button class="btn sm">${svg(b[0])}<span>${esc(b[1])}</span></button>`; return rr; };

  async function doSearch() {
    const q = $('muQ').value.trim(); if (!q) return; const box = $('muRes'); $('muPane').scrollTop = 0; box.innerHTML = '<div class="note">Searching...</div>';
    let r; try { r = await get('/api/music/search?q=' + encodeURIComponent(q)); } catch (e) { box.innerHTML = '<div class="note">⚠️ Search failed. Is the laptop online?</div>'; return; }
    box.innerHTML = ''; if (!r.results.length) box.innerHTML = '<div class="note">No songs found.</div>';
    const artists = {}; r.results.forEach(t => { if (t.artist_id && !artists[t.artist_id]) artists[t.artist_id] = t.artist; });
    const top = Object.entries(artists).slice(0, 2);
    if (top.length) {
      addSub(box, 'Artists');
      top.forEach(([id, n]) => box.appendChild(row({title: n, sub: 'Artist page · top songs · radio', icon: 'artist'}, [], () => openArtist(id))));
      addSub(box, 'Songs');
    }
    r.results.forEach(t => box.appendChild(row(t, songBtns(t))));
  }
  async function openArtist(id) {
    const box = $('muRes'); $('muPane').scrollTop = 0; box.innerHTML = '<div class="note">Loading artist...</div>';
    let a; try { a = await get('/api/music/artist?id=' + encodeURIComponent(id)); } catch (e) { box.innerHTML = '<div class="note">⚠️ Could not load that artist.</div>'; return; }
    box.innerHTML = ''; a.songs = a.songs || []; a.albums = a.albums || [];
    const head = subHead(backBtn('Back') + `<span>${svg('artist')} ${esc(a.name || 'Artist')}</span>`);
    head.querySelector('button').onclick = doSearch; box.appendChild(head);
    const rr = acts(['radio', (a.name || 'Artist') + ' radio'], ['shuffle', 'Shuffle top songs']);
    rr.children[0].onclick = async () => { toast('📻 Starting radio...'); if (await music({action: 'artist_radio', artist: a})) toast('📻 ' + a.name + ' radio'); mediaPoll(); };
    rr.children[1].onclick = async () => { if (a.songs.length && await music({action: 'tracks', tracks: a.songs, source: a.name + ' top songs', shuffle: true})) toast('🔀 ' + a.name); mediaPoll(); };
    box.appendChild(rr);
    if (a.songs.length) { addSub(box, 'Top songs'); a.songs.forEach(t => box.appendChild(row(t, songBtns(t)))); }
    if (a.albums.length) { addSub(box, 'Albums & singles'); a.albums.forEach(al => box.appendChild(row(Object.assign({icon: 'album'}, al), listBtns(al, 'album'), () => openList(al, 'album', 'muRes', () => openArtist(id), a.name || 'Artist')))); }
  }
  function renderQueue() {
    const box = $('muQueue'); box.innerHTML = '';
    if (!ms.queue || !ms.queue.length) { box.innerHTML = '<div class="note">Up Next is empty. Search for a song or start a playlist.</div>'; return; }
    ms.queue.forEach(t => {
      const r = row(t, t.i === ms.idx ? [] : [['close', async () => { await music({action: 'remove', i: t.i}); mediaPoll(); }, 'Remove']],
        async () => { if (t.i !== ms.idx && await music({action: 'jump', i: t.i})) toast('▶ ' + t.title); mediaPoll(); });
      r.classList.toggle('cur', t.i === ms.idx); r.classList.toggle('past', t.i < ms.idx); box.appendChild(r);
    });
    const more = ms.total - (ms.queue[ms.queue.length - 1].i + 1);
    if (more > 0) box.insertAdjacentHTML('beforeend', `<div class="note">+ ${more} more</div>`);
    box.insertAdjacentHTML('beforeend', '<div class="note">📻 When Up Next runs out, a radio station keeps the music going.</div>');
  }
  // open a playlist / album: see its songs, play from any song, shuffle, add songs to Up Next
  async function openList(pl, act, boxId, backFn, backLabel) {
    const box = $(boxId); box.innerHTML = '<div class="note">Opening ' + esc(pl.title) + '...</div>';
    let r; try { r = await get('/api/music/open?id=' + encodeURIComponent(pl.id)); } catch (e) { box.innerHTML = '<div class="note">⚠️ Could not open it.</div>'; return; }
    box.innerHTML = ''; const tracks = r.tracks || [];
    const lh = document.createElement('div'); lh.className = 'mu-lh';   // sticky: back + play all stay on top while the songs scroll
    const h = subHead(backBtn(backLabel || 'Back') + `<span>${esc(pl.title)} · ${tracks.length} songs</span>`);
    h.querySelector('button').onclick = backFn; lh.appendChild(h); box.appendChild(lh); $('muPane').scrollTop = 0;
    const rr = acts(['play', 'Play all'], ['shuffle', 'Shuffle']);
    rr.children[0].onclick = async () => { if (await music({action: act || 'playlist', id: pl.id, title: pl.title})) toast('▶ ' + pl.title); mediaPoll(); };
    rr.children[1].onclick = async () => { if (await music({action: act || 'playlist', id: pl.id, title: pl.title, shuffle: true})) toast('🔀 ' + pl.title); mediaPoll(); };
    lh.appendChild(rr);
    if (!tracks.length) box.insertAdjacentHTML('beforeend', '<div class="note">No songs found in there.</div>');
    const songs = document.createElement('div'); box.appendChild(songs);
    const playFrom = (t, i) => async () => { if (await music({action: act || 'playlist', id: pl.id, title: pl.title, start: i})) toast('▶ ' + t.title); mediaPoll(); };
    tracks.forEach((t, i) => songs.appendChild(row(t, [
      ['play', playFrom(t, i), 'Play from this song'],
      ['add', async () => { if (await music({action: 'add', track: t})) toast('＋ Added to Up Next'); }, 'Add to Up Next'],
    ], playFrom(t, i))));
  }
  async function renderMoods() {
    const box = $('muMoods'); box.innerHTML = '<div class="note">Loading moods & genres...</div>';
    let m; try { m = await get('/api/music/moods'); } catch (e) { box.innerHTML = '<div class="note">⚠️ Could not load moods.</div>'; return; }
    const moods = m.moods || [];
    box.innerHTML = '<div class="mu-moods"></div>'; const g = box.firstChild;
    if (!moods.length) box.innerHTML = '<div class="note">YouTube Music didn\'t send any moods right now. Try again in a bit.</div>';
    moods.forEach((md, i) => {
      const b = document.createElement('button'); b.className = 'mu-mood'; b.textContent = md.title;
      b.style.background = `linear-gradient(135deg, hsl(${(i * 37) % 360} 75% 42%), hsl(${(i * 37 + 40) % 360} 70% 26%))`;
      b.onclick = async () => {
        box.innerHTML = '<div class="note">Loading...</div>';
        let r; try { r = await get(`/api/music/mood?b=${encodeURIComponent(md.browseId)}&p=${encodeURIComponent(md.params)}`); } catch (e) { box.innerHTML = '<div class="note">⚠️ Could not load.</div>'; return; }
        box.innerHTML = ''; const h = subHead(backBtn('Moods') + `<span>${esc(md.title)}</span>`);
        h.querySelector('button').onclick = renderMoods; box.appendChild(h); $('muPane').scrollTop = 0;
        const back = () => b.onclick();
        (r.playlists || []).forEach(pl => box.appendChild(row(Object.assign({icon: 'lists'}, pl), listBtns(pl), () => openList(pl, 'playlist', 'muMoods', back, md.title))));
        if (!(r.playlists || []).length) box.insertAdjacentHTML('beforeend', '<div class="note">Nothing here right now.</div>');
      };
      g.appendChild(b);
    });
  }
  async function renderRecent() {
    const box = $('muRecent'); box.innerHTML = '<div class="note">Loading...</div>';
    let r; try { r = await get('/api/music/recent'); } catch (e) { box.innerHTML = '<div class="note">⚠️ Not connected</div>'; return; }
    box.innerHTML = '';
    if ((r.played_here || []).length) { addSub(box, 'Played on the light wall'); r.played_here.forEach(t => box.appendChild(row(t, songBtns(t)))); }
    if ((r.youtube || []).length) { addSub(box, 'Your YouTube Music history'); r.youtube.forEach(t => box.appendChild(row(t, songBtns(t)))); }
    if (!box.children.length) box.innerHTML = '<div class="note">Nothing played yet.</div>';
  }
  // 🎨 light looks for one playlist (pick up to 3, auto, or normal shuffle)
  async function famEditor(pl, host) {
    if (host.nextSibling && host.nextSibling.classList && host.nextSibling.classList.contains('mu-fe')) { host.nextSibling.remove(); return; }
    let f; try { f = await get(`/api/music/family?pid=${encodeURIComponent(pl.id)}&title=${encodeURIComponent(pl.title)}`); } catch (e) { return toast('⚠️ Not connected'); }
    let pick = (f.family || []).slice(); f.auto = f.auto || []; f.looks = f.looks || [];
    const d = document.createElement('div'); d.className = 'mu-fe';
    const draw = () => {
      d.innerHTML = `<div class="note">Light looks for <b>${esc(pl.title)}</b> (pick up to 3). ${f.how === 'auto' ? 'Now: auto-picked.' : f.how === 'yours' ? 'Now: your pick.' : 'Now: normal shuffle.'}</div><div class="chips"></div>
        <div class="row"><button class="btn c sm" style="--c:var(--amber)">Save</button><button class="btn sm">Auto${f.auto.length ? ' (' + esc(f.auto.join(', ')) + ')' : ''}</button><button class="btn sm">No matching</button></div>`;
      const ch = d.querySelector('.chips');
      f.looks.forEach(n => { const b = document.createElement('button'); b.className = 'chip' + (pick.includes(n) ? ' on' : ''); b.textContent = n;
        b.onclick = () => { pick = pick.includes(n) ? pick.filter(x => x !== n) : pick.concat([n]).slice(-3); draw(); }; ch.appendChild(b); });
      const [sv, au, no] = d.querySelectorAll('.row button');
      sv.onclick = async () => { if (await music({action: 'family_set', pid: pl.id, title: pl.title, looks: pick})) { toast('🎨 Saved'); d.remove(); } };
      au.onclick = async () => { if (await music({action: 'family_set', pid: pl.id, title: pl.title, looks: null})) { toast('🎨 Back to auto'); d.remove(); } };
      no.onclick = async () => { if (await music({action: 'family_set', pid: pl.id, title: pl.title, looks: []})) { toast('🎲 Normal shuffle for this playlist'); d.remove(); } };
    };
    draw(); host.after(d);
  }
  async function renderLib(fetchIt) {
    const box = $('muLib');
    if (fetchIt || !lib) { box.innerHTML = '<div class="note">Loading...</div>'; try { lib = await get('/api/music/library'); } catch (e) { box.innerHTML = '<div class="note">⚠️ Not connected</div>'; return; } }
    box.innerHTML = '';
    const plRow = (pl, extra) => { const r = row(Object.assign({icon: 'lists'}, pl), listBtns(pl).concat([['palette', () => famEditor(pl, r), 'Light looks for this playlist']]).concat(extra || []), () => openList(pl, 'playlist', 'muLib', () => renderLib(false), 'Playlists')); return r; };
    if (lib.favorites && lib.favorites.length) {
      addSub(box, 'Saved');
      lib.favorites.forEach(f => box.appendChild(plRow(Object.assign({sub: 'Saved playlist'}, f), [['close', async () => { await music({action: 'fav_remove', id: f.id}); renderLib(true); }, 'Remove']])));
    }
    if (lib.signed_in) {
      addSub(box, 'Your playlists · ' + (lib.account || 'signed in'));
      (lib.playlists || []).forEach(pl => box.appendChild(plRow(pl)));
    }
    const add = document.createElement('div');
    add.innerHTML = `<div class="mu-sub"><span>Add a playlist link</span></div><div class="mu-srow"><input type="search" id="muLink" placeholder="Paste a YouTube Music playlist link" aria-label="Playlist link"><button class="btn c" id="muLinkGo" style="--c:var(--cyan)">Save</button></div>`;
    box.appendChild(add);
    $('muLinkGo').onclick = async () => {
      const v = $('muLink').value.trim(), m = v.match(/list=([A-Za-z0-9_-]+)/); const id = m ? m[1] : v; if (!id) return;
      const name = prompt('Name for this playlist button?', 'My playlist') || 'Playlist';
      if (await music({action: 'fav_add', fav: {id, title: name}})) { toast('⭐ Saved ' + name); renderLib(true); }
    };
    if (!lib.signed_in && lib.signin_ok === false) {
      /* customer version: no YouTube Music sign-in; search and saved playlist links still work */
    } else if (!lib.signed_in) {
      const d = document.createElement('div');
      d.innerHTML = `<div class="mu-sub"><span>Sign in to see your own playlists + likes</span></div>` + (GB.local ? `
        <ol class="mu-steps">
          <li>In Chrome or Edge, open <b>music.youtube.com</b> (signed in to your account).</li>
          <li>Press <b>F12</b>, click <b>Network</b>, click the <b>Fetch/XHR</b> button, then click <b>Library</b> on the YouTube Music page.</li>
          <li>Click the row named <b>account_menu</b>.</li>
          <li>Under <b>Request Headers</b>, find <b>Cookie</b>, right-click its value and choose <b>Copy value</b>.</li>
          <li>Paste it here and press Sign in.</li>
        </ol>
        <textarea id="muCk" placeholder="Paste the cookie value here" aria-label="Cookie value"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn c" id="muCkGo" style="--c:var(--pink)">${svg('unlock')}<span>Sign in</span></button></div>
        <p class="note" style="margin-top:6px">⚠️ This works like a password: it stays only on this laptop. Don't share it.</p>` :
        `<p class="note">Do this once on the laptop, in the GlowBop window (Music, then Playlists). After that your playlists show up here too.</p>`);
      box.appendChild(d);
      if (GB.local) $('muCkGo').onclick = async () => { const r = await post('/api/music/signin', {cookie: $('muCk').value}); if (r) { toast('✅ Signed in as ' + r.account); renderLib(true); } };
    } else if (GB.local) {
      const d = document.createElement('div'); d.className = 'row'; d.style.marginTop = '12px';
      d.innerHTML = '<button class="btn sm" id="muOut">Sign out of YouTube Music</button>'; box.appendChild(d);
      $('muOut').onclick = async () => { if (await post('/api/music/signin', {signout: true})) { toast('Signed out'); renderLib(true); } };
    }
  }

  // handy for other modules and tests
  GB.music = {tab, openArtist, openList, renderLib, doSearch, poll: mediaPoll, ytShow, state: () => ({ms, np, si})};

  GB.on('ready', () => {
    mediaLoop();
    // the GlowBop window on the laptop plays the music itself (the pop-up player is only a fallback)
    if (GB.local && location.pathname === '/app') {
      const sc = document.createElement('script'); sc.src = '/player.js';
      sc.onload = () => {
        let lastSt = '';
        window.appPlayer = LumaPlayer({kind: 'app', ids: ['ayt0', 'ayt1'], wraps: ['aw0', 'aw1'], onStatus: (st, want, active) => {
          $('appVid').classList.toggle('off', !(active && want.vid));
          if (st === 'blocked' && lastSt !== 'blocked') toast('🔈 Click anywhere in GlowBop once to allow sound');
          lastSt = st;
        }});
        document.addEventListener('click', () => { if (window.appPlayer && window.appPlayer.isActive()) window.appPlayer.resume(); }, {once: true});
      };
      document.head.appendChild(sc);
    }
  });
})();
