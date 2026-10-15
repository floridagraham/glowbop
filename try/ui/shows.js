/* 🎬 SHOWS page: Song Shows. A hand-made light show per song, on a timeline that snaps to the song's beats and bars.
   Talks to GET /api/shows, /api/shows/one?key=, /api/shows/now and POST /api/shows (songshow.py on the laptop).
   Lanes: Look, Hits, Color, Bright(ness curve), Text, FX. Tap an empty spot to add, drag to move, drag the right edge to
   stretch, tap a cue to edit it. Pinch, the − / + keys or Ctrl+wheel zoom. Autosaves. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const post = b => GB.post('/api/shows', b);
  const ro = () => GB.pro === false;                                  // 🎛️ Home DJ: shows can be looked at, not edited or played
  const nudge = () => { GB.toast('🔒 Building Song Shows is part of GlowBop Pro DJ'); GB.sfx('err'); };
  const LANES = [
    {id: 'look', label: 'LOOK', c: 'var(--amber)', hint: 'which look plays'},
    {id: 'hit', label: 'HITS', c: 'var(--pink)', hint: 'drops, strobes, bursts'},
    {id: 'color', label: 'COLOR', c: 'var(--cyan)', hint: 'colour lock'},
    {id: 'bright', label: 'BRIGHT', c: 'var(--gold)', hint: 'brightness curve'},
    {id: 'text', label: 'TEXT', c: 'var(--lime)', hint: 'words on the wall'},
    {id: 'effect', label: 'FX', c: 'var(--lav)', hint: 'lock an effect'},
  ];
  const HITS = {drop: ['burst', 'Drop', 'var(--pink)'], strobe: ['bolt', 'Strobe', '#ffffff'], flash: ['sun', 'Flash', 'var(--gold)'],     // [GB.svg icon, name, colour]
                fire: ['fire', 'Fire burst', 'var(--orange)'], confetti: ['confetti', 'Confetti', 'var(--lav)'], blackout: ['dark', 'Blackout', 'var(--peri)'],
                sweep: ['sweep', 'Sweep', '#b6ff3d'], shockwave: ['shockwave', 'Shockwave', 'var(--violet)'], colorbomb: ['colorbomb', 'Color bomb', 'var(--amber)'],
                lightning: ['lightning', 'Lightning', '#8fb4ff'], countdown: ['count321', '3-2-1', 'var(--orchid)'], heartbeat: ['heart', 'Heartbeat', 'var(--red)']};
  const SWATCH = ['#ff3d9a', '#ff2040', '#ff7a3d', '#ffcc33', '#b6ff3d', '#3ce08a', '#33d6ff', '#3d6bff', '#9b3dff', '#e45cff', '#ffffff', '#ffb0d0'];
  const LINES = ['HANDS UP', 'JUMP', "LET'S GO", 'MAKE SOME NOISE', 'ONE MORE', 'SING IT', 'DROP IT', 'PUT YOUR LIGHTS UP'];
  const SECCOL = {intro: '#6677ff', quiet: '#6677ff', outro: '#6677ff', groove: '#9b3dff', breakdown: '#33d6ff', build: '#ffb23d', peak: '#ff3d9a', drop: '#ff3d9a', silence: '#2a2540'};
  const SRC = {player: 'GlowBop player · exact', app: 'music app timeline · exact', heard: 'estimated from the song start, kept on the beat', none: 'position unknown'};

  GB.css(`
  :root { --orchid:#e45cff; }
  .ss-now { display:flex; gap:10px; align-items:center; min-width:0; }
  #ssEd.ro > .seg, #ssEd.ro > .ss-tools, #ssEd.ro > p.note { display:none; }
  #ssEd.ro .ss-labs button { pointer-events:none; opacity:.7; }
  .ss-now .tx { flex:1; min-width:0; }
  .ss-now .tx b { display:block; font:700 calc(18px * var(--fs, 1))/1.15 var(--cond); letter-spacing:1px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ss-now .tx small { display:block; color:var(--dim); font-size:calc(12px * var(--fs, 1)); line-height:1.35; }
  .ss-dot { width:12px; height:12px; border-radius:50%; background:var(--dark); flex:0 0 auto; }
  .ss-dot.live { background:var(--orchid); box-shadow:0 0 10px var(--orchid); animation:ssPulse 1s infinite; }
  @keyframes ssPulse { 50% { opacity:.45; } }
  .ss-rec.on { background:var(--red); color:#000; box-shadow:0 0 0 2px #fff inset, 0 0 18px var(--red); }
  .ss-list { max-height:280px; }
  .ss-list .item { cursor:pointer; padding:8px 8px; }
  .ss-list .item .bdg { font:700 calc(12px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; padding:5px 8px; border-radius:999px; background:var(--dark); color:var(--dim); flex:0 0 auto; text-transform:uppercase; }
  .ss-list .item .bdg.has { background:var(--orchid); color:#000; }
  .ss-list .item .bdg.now { background:var(--green); color:#000; }
  .ss-list .item.on { box-shadow:inset 4px 0 0 var(--orchid); }
  .ss-pick { display:flex; gap:8px; align-items:center; min-width:0; }
  .ss-pick .tx { flex:1; min-width:0; }
  .ss-pick .tx b { display:block; font:700 calc(20px * var(--fs, 1))/1.1 var(--cond); letter-spacing:1px; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ss-pick .tx small { display:block; font:calc(13px * var(--fs, 1)) var(--mono); color:var(--cyan); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ss-tools { display:flex; gap:6px; flex-wrap:wrap; }
  .ss-tools .btn { flex:1 1 auto; min-width:0; padding:0 12px; }
  .ss-tools .btn.sq { flex:0 0 48px; padding:0; }
  .ss-tools .btn svg { width:18px; height:18px; }
  .ss-tools #ssDraft { flex:1 1 140px; }
  @media (max-width: 699px) { #ssClear span { display:none; } #ssClear { flex:0 0 48px; padding:0; } }
  .ss-bar2 { display:flex; align-items:center; gap:8px; min-width:0; }
  .ss-zl { font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); text-transform:uppercase; }
  .ss-bar2 .chip { margin-left:auto; min-height:40px; font-size:calc(14px * var(--fs, 1)); }
  .ss-zoom { display:flex; gap:4px; flex:0 0 auto; }
  .ss-zoom .btn { width:48px; padding:0; border-radius:4px; font:700 calc(22px * var(--fs, 1))/1 var(--cond); }
  .ss-zoom .btn:first-child { border-radius:22px 4px 4px 22px; } .ss-zoom .btn:last-child { border-radius:4px 22px 22px 4px; }
  /* ---- the timeline: lane labels on the left, the song scrolls on the right */
  .ss-tl { display:grid; grid-template-columns:54px minmax(0, 1fr); background:#05040a; border:2px solid var(--orchid); border-radius:0 22px 0 22px; overflow:hidden; position:relative; }
  .ss-labs { display:flex; flex-direction:column; gap:0; background:#05040a; z-index:3; border-right:1px solid var(--line); }
  .ss-labs .rul { height:var(--ss-rh); display:flex; align-items:center; justify-content:center; font:600 calc(10px * var(--fs, 1)) var(--mono); color:var(--dim); }
  .ss-labs .sec { height:var(--ss-sh); }
  .ss-labs button { appearance:none; border:0; margin:0; height:var(--ss-lh); background:var(--c); color:#000; font:800 calc(12px * min(var(--fs, 1), 1.05))/1 var(--cond); letter-spacing:1px;
    display:flex; align-items:flex-end; justify-content:flex-end; padding:0 6px 5px 0; border-top:2px solid #05040a; cursor:pointer; opacity:.9; position:relative; }
  .ss-labs button:active { filter:brightness(1.3); }
  .ss-labs button::before { content:'+'; position:absolute; left:6px; top:3px; font:700 calc(14px * var(--fs, 1))/1 var(--cond); opacity:.55; }
  .ss-sc { position:relative; overflow-x:auto; overflow-y:hidden; touch-action:pan-x pan-y; -webkit-overflow-scrolling:touch; overscroll-behavior-x:contain; scrollbar-width:thin; scrollbar-color:var(--orchid) #05040a; }
  .ss-sc::-webkit-scrollbar { height:8px; } .ss-sc::-webkit-scrollbar-thumb { background:var(--orchid); border-radius:4px; } .ss-sc::-webkit-scrollbar-track { background:#05040a; }
  .ss-in { position:relative; }
  .ss-rul { position:relative; height:var(--ss-rh); border-bottom:1px solid var(--line); cursor:pointer; background:linear-gradient(#0d0a18, #05040a); }
  .ss-rul span { position:absolute; top:3px; font:calc(11px * var(--fs, 1))/1 var(--mono); color:var(--lav); padding-left:3px; border-left:1px solid #6a5a9a; height:calc(var(--ss-rh) - 6px); white-space:nowrap; pointer-events:none; }
  .ss-rul span.ph { color:#fff; border-left-color:var(--orchid); }
  .ss-secs { position:relative; height:var(--ss-sh); }
  .ss-secs i { position:absolute; top:3px; bottom:3px; border-radius:3px; opacity:.75; font:700 calc(10px * var(--fs, 1))/1 var(--cond); letter-spacing:1px; color:#000; text-transform:uppercase; padding:2px 4px; overflow:hidden; white-space:nowrap; font-style:normal; }
  .ss-secs b { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:var(--pink); box-shadow:0 0 6px var(--pink); }
  .ss-lane { position:relative; height:var(--ss-lh); border-top:2px solid #05040a; background-color:#0b0915; }
  .ss-lane:nth-child(even) { background-color:#0e0b1a; }
  .ss-it { position:absolute; top:5px; bottom:5px; border-radius:6px; min-width:6px; touch-action:none; cursor:grab; display:flex; align-items:center; overflow:hidden;
    font:700 calc(12px * var(--fs, 1))/1.05 var(--cond); letter-spacing:.5px; color:#000; text-transform:uppercase; box-shadow:0 0 0 1px #0008 inset; user-select:none; -webkit-user-select:none; }
  .ss-it > span { padding:0 16px 0 7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:none; text-shadow:0 0 3px #fff8; }
  .ss-it.sel, .ss-pt.sel { box-shadow:0 0 0 2px #fff, 0 0 16px #fff8; z-index:2; }
  .ss-it.drag, .ss-pt.drag { cursor:grabbing; opacity:.9; z-index:4; }
  .ss-it .rz { position:absolute; right:0; top:0; bottom:0; width:16px; cursor:ew-resize; touch-action:none; background:linear-gradient(90deg, transparent 0 6px, #0006 6px 8px, transparent 8px 10px, #0006 10px 12px, transparent 12px); }
  .ss-it.rec::after { content:''; position:absolute; left:3px; top:3px; width:6px; height:6px; border-radius:50%; background:var(--red); box-shadow:0 0 0 1px #000; }
  .ss-it.txt { background:#14200a; color:var(--lime); box-shadow:0 0 0 2px var(--lime) inset; }
  .ss-it.txt > span { text-shadow:none; }
  .ss-it.fx { background:repeating-linear-gradient(135deg, var(--lav) 0 10px, #b685ff 10px 20px); }
  .ss-it.bo { background:#000; color:var(--peri); box-shadow:0 0 0 2px var(--peri) inset; }
  .ss-it.bo > span { text-shadow:none; }
  .ss-hit { position:absolute; top:4px; bottom:4px; width:30px; margin-left:-15px; touch-action:none; cursor:grab; display:flex; align-items:center; justify-content:center; user-select:none; -webkit-user-select:none; z-index:1; }
  .ss-hit i { font-style:normal; width:28px; height:28px; border-radius:8px; transform:rotate(45deg); background:var(--c); display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px var(--c); pointer-events:none; }
  .ss-hit i em { transform:rotate(-45deg); font-style:normal; font-size:calc(15px * var(--fs, 1)); line-height:1; color:#000; display:flex; }
  .ss-hit i em .ic { width:16px; height:16px; vertical-align:0; }
  .bdg.has .ic { margin-right:3px; }
  .ss-hit .tail { position:absolute; left:15px; top:50%; height:6px; margin-top:-3px; background:repeating-linear-gradient(90deg, #fff 0 3px, transparent 3px 6px); opacity:.7; pointer-events:none; border-radius:3px; }
  .ss-hit.sel i { box-shadow:0 0 0 2px #000, 0 0 0 4px #fff, 0 0 18px #fff; }
  .ss-hit.drag { z-index:4; }
  .ss-bri { position:absolute; inset:0; pointer-events:none; overflow:visible; }
  .ss-pt { position:absolute; width:28px; height:28px; margin:-14px 0 0 -14px; touch-action:none; cursor:grab; z-index:2; display:flex; align-items:center; justify-content:center; border-radius:50%; }
  .ss-pt i { width:12px; height:12px; border-radius:50%; background:var(--gold); box-shadow:0 0 0 2px #000, 0 0 8px var(--gold); pointer-events:none; }
  .ss-pt.sel i { background:#fff; }
  .ss-pt b { position:absolute; bottom:22px; font:calc(10px * var(--fs, 1))/1 var(--mono); color:var(--gold); pointer-events:none; white-space:nowrap; }
  .ss-play { position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:#fff; box-shadow:0 0 8px #fff, 0 0 18px var(--orchid); pointer-events:none; z-index:5; display:none; }
  .ss-play b { position:absolute; top:2px; left:4px; font:calc(11px * var(--fs, 1))/1 var(--mono); background:#fff; color:#000; padding:2px 4px; border-radius:3px; white-space:nowrap; }
  .ss-cur { position:absolute; top:0; bottom:0; width:0; border-left:2px dashed var(--orchid); pointer-events:none; z-index:4; opacity:.8; }
  .ss-empty { position:absolute; left:66px; top:calc(var(--ss-rh) + var(--ss-sh) + 10px); right:12px; color:var(--dim); font-size:calc(13px * var(--fs, 1)); pointer-events:none; z-index:1; }
  .ss-meta { display:flex; flex-wrap:wrap; gap:6px; }
  .ss-meta span { font:calc(12px * var(--fs, 1))/1 var(--mono); color:var(--lav); background:var(--dark2); padding:6px 8px; border-radius:6px; }
  .ss-meta span.warn { color:var(--gold); }
  .ss-why { font:calc(13px * var(--fs, 1))/1.35 var(--body); color:var(--dim); border-left:4px solid var(--orchid); padding:6px 10px; background:#120d1d; border-radius:0 10px 0 10px; }
  .ss-why.live { color:var(--text); border-left-color:var(--green); }
  .ss-saved { font:calc(12px * var(--fs, 1)) var(--mono); color:var(--green); }
  .ss-saved.busy { color:var(--gold); }
  /* ---- the cue editor sheet */
  .ss-sheet > div { border-top-color:var(--orchid); gap:10px; }
  .ss-sheet .head { display:flex; align-items:center; gap:10px; }
  .ss-sheet .head b { flex:1; font:800 calc(20px * var(--fs, 1))/1.1 var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--c); }
  .ss-sheet .head small { font:calc(12px * var(--fs, 1)) var(--mono); color:var(--cyan); }
  .ss-sheet .chips { max-height:220px; overflow:auto; }
  .ss-sheet .chip .sw { display:inline-flex; gap:2px; }
  .ss-sheet .chip .sw i { width:8px; height:14px; border-radius:2px; display:block; }
  .ss-sw { display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:6px; }
  .ss-sw button { appearance:none; border:0; height:44px; border-radius:10px; background:var(--v); box-shadow:0 0 0 2px #000 inset; position:relative; }
  .ss-sw button.on { box-shadow:0 0 0 3px #fff, 0 0 14px var(--v); }
  .ss-sw button.on::after { content:attr(data-n); position:absolute; right:4px; top:3px; font:800 calc(12px * var(--fs, 1))/1 var(--cond); color:#000; background:#fff; border-radius:999px; padding:2px 5px; }
  .ss-prev { height:16px; border-radius:6px; }
  .ss-hits { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .ss-hits .tile { min-height:74px; }
  .ss-step { display:grid; grid-template-columns:auto minmax(0, 1fr) auto; gap:8px; align-items:center; }
  .ss-step b { text-align:center; font:calc(16px * var(--fs, 1)) var(--mono); color:var(--cyan); font-weight:400; }
  .ss-step .k { grid-column:1 / -1; font:600 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:2px; color:var(--label); text-transform:uppercase; }
  .ss-fxl { max-height:200px; overflow:auto; }
  @media (min-width: 700px) { .ss-tl { grid-template-columns:64px minmax(0, 1fr); } .ss-labs button { font-size:calc(13px * var(--fs, 1)); } .ss-sw { grid-template-columns:repeat(12, minmax(0, 1fr)); } .ss-hits { grid-template-columns:repeat(6, minmax(0, 1fr)); } }
  .ss-recbar { display:flex; align-items:center; gap:10px; }
  .ss-recbar .tx { flex:1; min-width:0; font:700 calc(15px * var(--fs, 1))/1.2 var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .ss-recbar .tx small { display:block; font:400 calc(12px * var(--fs, 1))/1.3 var(--body); letter-spacing:0; text-transform:none; color:var(--dim); }
  `);

  // ------------------------------------------------------------------ state
  const S = {songs: [], on: true, rec: false, key: null, song: null, show: null, rev: 0, looks: {}, effects: [], undo: [],
             bar: +GB.store.get('gb_ss_zoom', '30') || 30, follow: true, now: null, nowT: 0, cursor: 0, sel: null, dirty: false, saveT: null, saving: false,
             listOpen: true, q: '', loading: false, followHold: 0};
  GB.songShow = {state: S, pps: () => pps(), select: k => select(k)};      // for debugging / tests
  const RH = 24, SH = 18;
  const LH = () => innerWidth >= 700 ? 46 : 42;
  const bpm = () => (S.song && S.song.bpm) || 120;
  const BEAT = () => 60 / bpm();
  const BAR = () => 4 * BEAT();
  const G = () => ((S.song && S.song.grid) || 0) % BAR();
  const pps = () => S.bar / BAR();                                   // pixels per second
  const items = () => (S.show && S.show.items) || [];
  const dur = () => {
    let d = (S.song && S.song.dur) || 0;
    const last = items().reduce((m, i) => Math.max(m, i.end || i.t), 0);
    if (!d) d = Math.max(240, last + 8 * BAR());
    return Math.max(d, last + 2 * BAR(), 30);
  };
  const snapT = (t, free) => {
    if (free) return Math.max(0, Math.round(t * 100) / 100);
    const step = BEAT() * pps() >= 11 ? BEAT() : BAR();
    return Math.max(0, +(G() + Math.round((t - G()) / step) * step).toFixed(3));
  };
  const barOf = t => { const b = Math.floor((t - G()) / BAR() + 1e-6); const beat = Math.floor(((t - G()) - b * BAR()) / BEAT() + 1e-6) + 1; return {bar: b + 1, beat}; };
  const tlabel = t => { const {bar, beat} = barOf(t); return `Bar ${bar} · beat ${beat} · ${GB.fmt(t)}`; };
  const uid = () => 'u' + Math.random().toString(36).slice(2, 9);
  const isCurrent = () => S.now && S.key && S.now.key === S.key;
  const nowPos = () => { if (!isCurrent() || S.now.pos == null) return null; return S.now.pos + (S.now.playing ? Math.min(2, (performance.now() - S.nowT) / 1000) : 0); };
  const lookGrad = n => { const c = S.looks[n] || ['#555', '#888']; return `linear-gradient(90deg, ${c.map((x, i) => x + ' ' + Math.round(i / Math.max(1, c.length - 1) * 100) + '%').join(', ')})`; };
  const colGrad = cs => cs.length === 1 ? cs[0] : `linear-gradient(90deg, ${cs.map((x, i) => x + ' ' + Math.round(i / (cs.length - 1) * 100) + '%').join(', ')})`;

  // ------------------------------------------------------------------ panel 1: status + switches
  GB.panel('shows', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orchid)'); el.id = 'ssTop';
    el.innerHTML = `<div class="ph"><span>Song shows</span><span class="r" id="ssTopR">–</span></div>
      <div class="ss-now"><span class="ss-dot" id="ssDot"></span><div class="tx"><b id="ssNowT">Nothing playing</b><small id="ssNowS">Play a song and its show runs right on the beat.</small></div></div>
      <div class="seg">
        <button class="btn" id="ssOn" style="--c:var(--orchid)" aria-label="Song Shows on or off"></button>
        <button class="btn ss-rec" id="ssRec" aria-label="Record DJ moves onto the timeline"></button>
      </div>
      <p class="note" id="ssRecNote">Build a light show for a song once and it plays the same way every time that song comes on. Anywhere your show is empty, GlowBop keeps reacting live.</p>`;
    $('ssOn').onclick = async () => { if (ro()) return nudge(); const on = !S.on; if (await post({action: 'global', on})) { S.on = on; paintTop(); GB.toast(on ? '🎬 Song Shows on' : 'Song Shows off: the live show only'); } };
    $('ssRec').onclick = async () => {
      if (ro()) return nudge(); const on = !S.rec; if (!(await post({action: 'record', on}))) return; S.rec = on; paintTop();
      GB.toast(on ? '🔴 Recording: DJ pads, crowd lines and looks land on the song' : 'Recording stopped');
    };
    GB.proGate(el, 'Song Shows', {pitch: 'Build a light show for a song once and it plays the same way, right on the beat, every time that song comes on. Look through the timelines below to see how they work.'});
  });
  function paintTop() {
    const on = $('ssOn'); if (!on) return;
    on.classList.toggle('on', S.on); GB.lbl(on, 'movie', S.on ? 'Song Shows: on' : 'Song Shows: off');
    const r = $('ssRec'); r.classList.toggle('on', S.rec); r.innerHTML = GB.svg('dot') + `<span>${S.rec ? 'REC: ON' : 'Record'}</span>`;
    $('ssRecNote').innerHTML = S.rec ? '<b>Recording.</b> While a song plays, every DJ pad, build drop, crowd line and look you pick lands on that song\'s timeline at that moment (snapped to the beat).'
      : 'Build a light show for a song once and it plays the same way every time that song comes on. Anywhere your show is empty, GlowBop keeps reacting live.';
  }
  function paintNow() {
    const n = S.now || {}, t = $('ssNowT'); if (!t) return;
    $('ssDot').classList.toggle('live', !!n.active);
    $('ssTopR').textContent = n.active ? 'SHOW PLAYING' : (S.on ? 'READY' : 'OFF');
    if (!n.key) { t.textContent = 'Nothing playing'; $('ssNowS').textContent = 'Play a song and its show runs right on the beat.'; return; }
    t.textContent = (n.title || n.key) + (n.artist ? ' · ' + n.artist : '');
    const pos = n.pos != null ? GB.fmt(n.pos) + (n.dur ? ' / ' + GB.fmt(n.dur) : '') + ' · ' : '';
    $('ssNowS').textContent = n.active ? `🎬 Your show is playing · ${pos}${SRC[n.src] || ''}` : (pos + (n.why ? cap(n.why) : SRC[n.src] || ''));
  }
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';

  // ------------------------------------------------------------------ 🔴 on the DJ page: recording indicator
  GB.panel('dj', 5, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)'); el.hidden = true; el.id = 'ssDjRec';
    el.innerHTML = `<div class="ss-recbar"><span class="ss-dot live" style="background:var(--red);box-shadow:0 0 10px var(--red)"></span>
      <div class="tx">Recording to the song show<small id="ssDjRecS">Your pads land on the song's timeline.</small></div>
      <button class="btn c sm" id="ssDjStop" style="--c:var(--red)">Stop</button></div>`;
    $('ssDjStop').onclick = async () => { if (await post({action: 'record', on: false})) { S.rec = false; paintTop(); el.hidden = true; GB.toast('Recording stopped'); } };
  });

  // ------------------------------------------------------------------ panel 2: pick a song
  GB.panel('shows', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    el.innerHTML = `<div class="ph"><span>Song</span><span class="r" id="ssCount"></span></div>
      <div class="ss-pick" id="ssPick" hidden><div class="tx"><b id="ssPickT"></b><small id="ssPickS"></small></div><button class="btn sm" id="ssChange">Change</button></div>
      <div id="ssListBox"><input type="search" id="ssQ" placeholder="Search your songs" aria-label="Search songs" autocomplete="off">
      <div class="list scroll ss-list" id="ssList"><p class="note">Loading songs…</p></div></div>`;
    $('ssChange').onclick = () => { S.listOpen = !S.listOpen; paintPick(); };
    $('ssQ').addEventListener('input', e => { S.q = e.target.value.trim().toLowerCase(); renderList(); });
  });
  function paintPick() {
    const has = !!S.key; $('ssPick').hidden = !has;
    $('ssListBox').hidden = has && !S.listOpen;
    $('ssChange').textContent = S.listOpen ? 'Done' : 'Change';
    if (has && S.song) { $('ssPickT').textContent = S.song.title || S.key; $('ssPickS').textContent = (S.song.artist || '') + (isCurrent() ? '  ·  NOW PLAYING' : ''); }
  }
  function renderList() {
    const box = $('ssList'); if (!box) return;
    const cur = S.now && S.now.key;
    let rows = S.songs.slice();
    if (S.q) rows = rows.filter(r => (r.title + ' ' + r.artist).toLowerCase().includes(S.q));
    rows.sort((a, b) => (b.key === cur) - (a.key === cur));
    $('ssCount').textContent = S.songs.filter(r => r.has).length + ' SHOWS · ' + S.songs.length + ' SONGS';
    if (!rows.length) { box.innerHTML = `<p class="note">${S.q ? 'No song matches.' : 'No songs yet. Play some music: every song GlowBop hears shows up here.'}</p>`; return; }
    box.innerHTML = '';
    rows.slice(0, 300).forEach(r => {
      const it = document.createElement('div'); it.className = 'item' + (r.key === S.key ? ' on' : ''); it.tabIndex = 0; it.setAttribute('role', 'button');
      const sub = [r.artist, r.bpm ? r.bpm + ' BPM' : '', r.drops ? r.drops + (r.drops > 1 ? ' drops' : ' drop') : '', r.listens ? 'heard ' + r.listens + 'x' : ''].filter(Boolean).join(' · ');
      it.innerHTML = `<div class="tx"><b>${esc(r.title)}</b><small>${esc(sub)}</small></div>` +
        (r.key === cur ? '<span class="bdg now">Now</span>' : '') + (r.has ? `<span class="bdg has">${GB.svg('movie')}${r.items}${r.enabled ? '' : ' · off'}</span>` : '<span class="bdg">No show</span>');
      it.onclick = () => { select(r.key); S.listOpen = false; paintPick(); };
      it.onkeydown = e => { if (e.key === 'Enter') it.onclick(); };
      box.appendChild(it);
    });
  }
  async function loadList() {
    try {
      const r = await GB.get('/api/shows'); S.songs = r.songs || []; S.on = r.on; S.rec = r.rec; S.now = r.now; S.nowT = performance.now();
      paintTop(); paintNow(); renderList();
      if (!S.key) { const want = (r.now && r.now.key) || GB.store.get('gb_ss_key', '') || (S.songs[0] || {}).key; if (want) { S.listOpen = false; select(want); } else paintPick(); }
    } catch (e) { const b = $('ssList'); if (b) b.innerHTML = '<p class="note">Not connected to GlowBop.</p>'; }
  }

  // ------------------------------------------------------------------ panel 3: the editor
  GB.panel('shows', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--orchid)'); el.id = 'ssEd';
    el.innerHTML = `<div class="ph"><span>Timeline</span><span class="r"><span class="ss-saved" id="ssSaved"></span></span></div>
      <div class="ss-meta" id="ssMeta"></div>
      <div class="seg"><button class="btn" id="ssPlayOn" style="--c:var(--orchid)"></button></div>
      <div class="ss-tools">
        <button class="btn c" id="ssDraft" style="--c:var(--orchid)">${GB.svg('sparkle')}<span>Auto-draft</span></button>
        <button class="btn sq" id="ssUndo" aria-label="Undo">${GB.svg('back')}</button>
        <button class="btn" id="ssClear" aria-label="Clear the timeline">${GB.svg('trash')}<span>Clear</span></button>
      </div>
      <div class="ss-bar2"><span class="ss-zl">Zoom</span><div class="ss-zoom"><button class="btn sm" id="ssZo" aria-label="Zoom out">−</button><button class="btn sm" id="ssZi" aria-label="Zoom in">+</button></div>
        <button class="chip" id="ssFollow" style="--c:var(--green)" aria-label="Follow the playhead">Follow</button></div>
      <div class="ss-tl" id="ssTl" style="--ss-rh:${RH}px;--ss-sh:${SH}px;--ss-lh:${LH()}px">
        <div class="ss-labs" id="ssLabs"></div>
        <div class="ss-sc" id="ssSc"><div class="ss-in" id="ssIn"></div></div>
      </div>
      <div class="ss-why" id="ssWhy"></div>
      <p class="note">Tap an empty spot in a lane to add a cue there (or tap a lane's name to add one at the playhead). Drag a cue to move it, drag its right edge to stretch it, tap it to change it. Everything snaps to the beat. Pinch or use − / + to zoom.</p>`;
    const labs = $('ssLabs');
    labs.innerHTML = `<div class="rul">BAR</div><div class="sec"></div>` + LANES.map(l => `<button style="--c:${l.c}" data-l="${l.id}" aria-label="Add a ${l.hint} cue at the playhead">${l.label}</button>`).join('');
    labs.querySelectorAll('button').forEach(b => b.onclick = () => { if (!S.key) return; const p = nowPos(); addAt(b.dataset.l, p != null ? p : S.cursor, 0.5); });
    $('ssPlayOn').onclick = () => { if (!S.show) return; mutate(() => { S.show.enabled = !S.show.enabled; }, true); paintTools(); GB.toast(S.show.enabled ? "🎬 This song's show will play" : "This song's show is off (kept for later)"); };
    $('ssDraft').onclick = () => draftIt($('ssDraft'));
    $('ssUndo').onclick = undo;
    $('ssClear').onclick = () => confirm2($('ssClear'), 'Tap again to clear', () => { mutate(() => { S.show.items = []; }); GB.toast('Timeline cleared (Undo brings it back)'); });
    $('ssZi').onclick = () => zoomBy(1.6); $('ssZo').onclick = () => zoomBy(1 / 1.6);
    $('ssFollow').onclick = () => { S.follow = !S.follow; paintTools(); };
    wire();
  });

  function paintTools() {
    const ed = $('ssEd'); if (!ed) return;
    const has = !!S.key; ed.style.opacity = has ? '' : '.5';
    const pb = $('ssPlayOn'), en = S.show ? S.show.enabled !== false : true;
    pb.classList.toggle('on', en && items().length > 0); GB.lbl(pb, 'play', en ? "Play this song's show: on" : "Play this song's show: off");
    $('ssUndo').disabled = !S.undo.length; $('ssClear').disabled = !items().length;
    $('ssFollow').classList.toggle('on', S.follow);
    const m = $('ssMeta'), s = S.song;
    if (!s) { m.innerHTML = '<span>Pick a song</span>'; return; }
    const bits = [];
    bits.push(s.bpm ? `<span>${Math.round(s.bpm)} BPM${s.bpm_src === 'lookup' ? ' (looked up)' : ''}</span>` : '<span class="warn">Tempo unknown: 120 BPM grid</span>');
    bits.push(s.grid != null ? '<span>Bar grid ' + GB.svg('check') + '</span>' : '<span class="warn">Bar 1 not locked yet</span>');
    if (s.drops && s.drops.length) bits.push(`<span>${s.drops.length} drop${s.drops.length > 1 ? 's' : ''} on file</span>`);
    if (s.key_name) bits.push(`<span>${esc(s.key_name)}</span>`);
    if (s.mood) bits.push(`<span>${esc(s.mood)}</span>`);
    bits.push(`<span>${GB.fmt(dur())}${s.dur ? '' : ' (guess)'}</span>`);
    bits.push(`<span>${items().length} cue${items().length === 1 ? '' : 's'}</span>`);
    m.innerHTML = bits.join('');
  }
  function paintWhy() {
    const w = $('ssWhy'); if (!w) return;
    const n = S.now || {};
    let txt = '', live = false;
    const ed = $('ssEd'); if (ed) ed.classList.toggle('ro', ro());
    if (ro()) txt = S.key ? (items().length ? '🔒 Preview. Playing and editing Song Shows is part of GlowBop Pro DJ.' : '🔒 Preview. With GlowBop Pro DJ, Auto-draft builds a first show for this song in one tap.') : 'Pick a song to see its show.';
    else if (!S.key) txt = 'Pick a song to build its show.';
    else if (!isCurrent()) txt = items().length ? 'This show plays next time this song comes on (on GlowBop\'s player, or an app that shares its timeline).' : 'Tap Auto-draft for a first show built from what GlowBop knows about this song, then make it yours.';
    else if (n.active) { live = true; txt = '🎬 Playing your show right now' + (n.next ? ` · next: ${n.next.what || n.next.lane} at ${GB.fmt(n.next.t)}` : '') + '.'; }
    else txt = 'Not playing the show: ' + (n.why || SRC[n.src] || '') + '.';
    w.textContent = txt; w.classList.toggle('live', live);
  }
  const savedTxt = (t, busy) => { const s = $('ssSaved'); if (s) { s.textContent = t; s.classList.toggle('busy', !!busy); } };

  // ------------------------------------------------------------------ load one song
  async function select(key) {
    if (!key) return;
    if (S.dirty) await saveNow();
    S.loading = true;
    try {
      const r = await GB.get('/api/shows/one?key=' + encodeURIComponent(key));
      S.key = key; GB.store.set('gb_ss_key', key);
      S.song = r.song; S.looks = r.looks || {}; S.effects = r.effects || []; S.rev = r.rev || 0;
      S.show = r.show || {items: [], enabled: true}; if (!Array.isArray(S.show.items)) S.show.items = [];
      S.undo = []; S.sel = null; S.dirty = false; savedTxt(r.show ? 'SAVED' : '');
      const p = nowPos(); S.cursor = p != null ? snapT(p) : 0;
      render(); renderList(); paintPick(); paintTools(); paintWhy();
      const sc = $('ssSc'); if (sc) sc.scrollLeft = Math.max(0, (p != null ? p : 0) * pps() - sc.clientWidth * 0.3);
    } catch (e) { GB.toast('⚠️ Could not load that song'); }
    S.loading = false;
  }

  // ------------------------------------------------------------------ edits: undo + autosave
  function snapshot() { return JSON.stringify({items: items(), enabled: S.show ? S.show.enabled : true}); }
  function pushUndo(snap) { S.undo.push(snap || snapshot()); if (S.undo.length > 60) S.undo.shift(); }
  function mutate(fn, noUndo) { if (!S.show) return; if (ro()) return nudge(); if (!noUndo) pushUndo(); fn(); markDirty(); render(); paintTools(); }
  function markDirty() { S.dirty = true; savedTxt('SAVING…', true); clearTimeout(S.saveT); S.saveT = setTimeout(saveNow, 700); }
  async function saveNow() {
    clearTimeout(S.saveT); if (!S.dirty || !S.key || !S.show) return;
    S.dirty = false; S.saving = true;
    const key = S.key;
    const r = await post({action: 'save', key, title: S.song && S.song.title, artist: S.song && S.song.artist, items: items(), enabled: S.show.enabled !== false});
    S.saving = false;
    S.savedAt = performance.now();
    if (r) { if (key === S.key) { S.rev = r.rev; savedTxt('SAVED'); } const row = S.songs.find(x => x.key === key); if (row) { row.has = r.items > 0; row.items = r.items; row.enabled = S.show.enabled !== false; renderList(); } }
    else { S.dirty = true; savedTxt('NOT SAVED', true); }
  }
  function undo() {
    if (!S.undo.length || ro()) return;
    const st = JSON.parse(S.undo.pop()); S.show.items = st.items; S.show.enabled = st.enabled; S.sel = null;
    markDirty(); render(); paintTools(); GB.toast('↩ Undone');
  }
  function confirm2(btn, msg, fn) {
    if (btn._armed) { btn._armed = false; clearTimeout(btn._t); btn.classList.remove('danger'); btn.querySelector('span').textContent = btn._lbl; return fn(); }
    btn._armed = true; btn._lbl = btn.querySelector('span').textContent; btn.classList.add('danger'); btn.querySelector('span').textContent = msg; GB.toast(msg);
    btn._t = setTimeout(() => { btn._armed = false; btn.classList.remove('danger'); btn.querySelector('span').textContent = btn._lbl; }, 3000);
  }
  async function draftIt(btn) {
    if (ro()) return nudge();
    if (!S.key) return GB.toast('Pick a song first');
    const mine = items().some(i => !i.auto);
    if (mine && !btn._armed) return confirm2(btn, 'Replace your cues? Tap again', () => draftIt(btn));
    if (btn._armed) { btn._armed = false; clearTimeout(btn._t); btn.classList.remove('danger'); btn.querySelector('span').textContent = btn._lbl; }
    await saveNow();
    const before = snapshot();
    const r = await post({action: 'autodraft', key: S.key});
    if (!r) return;
    pushUndo(before); S.show = r.show; S.rev = r.rev; S.sel = null; S.dirty = false; savedTxt('SAVED');
    render(); paintTools(); paintWhy();
    const d = r.draft || {};
    GB.sfx('ok');
    GB.toast(d.basis === 'memory' ? `✨ Drafted around ${d.drops.length} remembered drop${d.drops.length === 1 ? '' : 's'}` : d.basis === 'heard' ? '✨ Drafted from the song parts GlowBop heard' : '✨ Drafted a dance-floor template: play the song once so GlowBop learns its drops');
    const row = S.songs.find(x => x.key === S.key); if (row) { row.has = true; row.items = r.show.items.length; row.enabled = true; renderList(); }
  }

  // ------------------------------------------------------------------ add a cue
  function addAt(lane, t, frac, fromTap) {
    if (!S.show) return; if (ro()) return nudge();
    t = snapT(Math.max(0, Math.min(dur(), t)));
    const B = BAR(), st = GB.status || {};
    const nextStart = l => items().filter(i => i.lane === l && i.t > t + 0.01).reduce((m, i) => Math.min(m, i.t), Infinity);
    let it = {id: uid(), lane, t};
    if (lane === 'look') { const lk = S.looks[st.look] ? st.look : Object.keys(S.looks)[0]; it.look = lk; it.end = Math.min(nextStart('look'), t + 16 * B, dur()); }
    else if (lane === 'hit') { it.hit = 'drop'; }
    else if (lane === 'color') { it.colors = ['#ff3d9a', '#33d6ff']; it.end = Math.min(nextStart('color'), t + 8 * B); }
    else if (lane === 'bright') { it.v = Math.round(Math.max(0, Math.min(100, (1 - (frac == null ? 0.5 : frac)) * 100)) / 5) * 5; }
    else if (lane === 'text') { it.text = 'HANDS UP'; it.end = t + 2 * B; }
    else if (lane === 'effect') { const e = (st.effect || '').split(' + ')[0]; it.effect = S.effects.includes(e) ? e : (S.effects.includes('Plasma') ? 'Plasma' : S.effects[0]); it.end = Math.min(nextStart('effect'), t + 8 * B); }
    if (it.end != null && it.end <= t + 0.05) it.end = t + B;
    mutate(() => S.show.items.push(it));
    S.sel = it.id; render();
    GB.sfx('on');
    if (lane !== 'bright') openEditor(it, fromTap);
  }

  // ------------------------------------------------------------------ draw the timeline
  function render() {
    const inn = $('ssIn'); if (!inn) return;
    const tl = $('ssTl'); tl.style.setProperty('--ss-lh', LH() + 'px');
    const W = Math.ceil(dur() * pps()) + 40, lh = LH();
    inn.style.width = W + 'px';
    const B = BAR(), bpx = S.bar, beatPx = bpx / 4, g = G();
    // ruler: bar numbers every k bars so labels never collide
    const k = [1, 2, 4, 8, 16, 32].find(n => n * bpx >= 34) || 64;
    let rul = '';
    for (let n = 0, t = g; t < dur() + B; n++, t = g + n * B) if (n % k === 0) rul += `<span class="${n % 8 === 0 ? 'ph' : ''}" style="left:${(t * pps()).toFixed(1)}px">${n + 1}</span>`;
    // sections: what GlowBop heard (or the draft's plan), drops as pink lines
    const s = S.song || {}; let secs = '';
    const segs = (s.sections && s.sections.length) ? s.sections.map((x, i, a) => [x[1], x[0], i + 1 < a.length ? a[i + 1][0] : dur()])
      : ((S.show && S.show.draft && S.show.draft.segments) || []);
    segs.forEach(([kind, a, b]) => { if (b - a < 0.5 || !SECCOL[kind]) return; const w = (b - a) * pps();
      secs += `<i style="left:${(a * pps()).toFixed(1)}px;width:${Math.max(2, w - 2).toFixed(1)}px;background:${SECCOL[kind]}">${w > 46 ? esc(kind) : ''}</i>`; });
    (s.drops || []).forEach(d => { secs += `<b style="left:${(d[0] * pps()).toFixed(1)}px" title="drop"></b>`; });
    // the lanes: grid lines (beats faint, bars, 8-bar phrases bright) drawn as a background
    const gx = (g * pps()).toFixed(2);
    const bg = [`repeating-linear-gradient(90deg, rgba(228,92,255,.32) 0 1px, transparent 1px ${(8 * bpx).toFixed(3)}px)`,
                `repeating-linear-gradient(90deg, rgba(255,255,255,.13) 0 1px, transparent 1px ${bpx.toFixed(3)}px)`];
    if (beatPx >= 9) bg.push(`repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px ${beatPx.toFixed(3)}px)`);
    const lanesBg = `background-image:${bg.join(',')};background-position:${gx}px 0`;
    let html = `<div class="ss-rul" id="ssRul">${rul}</div><div class="ss-secs">${secs}</div>`;
    LANES.forEach(L => {
      html += `<div class="ss-lane" data-l="${L.id}" style="${lanesBg}">`;
      if (L.id === 'bright') html += brightSVG(W, lh);
      items().filter(i => i.lane === L.id).sort((a, b) => a.t - b.t).forEach(i => { html += itemHTML(i, lh); });
      html += '</div>';
    });
    html += `<div class="ss-cur" id="ssCur" style="left:${(S.cursor * pps()).toFixed(1)}px"></div><div class="ss-play" id="ssPlay"><b></b></div>`;
    inn.innerHTML = html;
    let em = $('ssEmpty');
    if (!items().length && S.key) { if (!em) { em = document.createElement('div'); em.id = 'ssEmpty'; em.className = 'ss-empty'; tl.appendChild(em); }
      em.innerHTML = 'Empty show. Tap <b>Auto-draft</b> for a first take, or tap a lane to add your first cue.'; }
    else if (em) em.remove();
    paintPlayhead();
  }
  function itemHTML(i, lh) {
    const x = i.t * pps(), sel = i.id === S.sel ? ' sel' : '', rec = i.rec ? ' rec' : '';
    const w = i.end != null ? Math.max(8, (i.end - i.t) * pps()) : 0;
    if (i.lane === 'hit' && i.hit !== 'blackout') {
      const h = HITS[i.hit] || ['dot', i.hit, '#fff'], tail = i.hit === 'strobe' ? `<span class="tail" style="width:${Math.max(0, (i.beats || 4) * BEAT() * pps() - 15).toFixed(1)}px"></span>` : '';
      return `<div class="ss-hit${sel}" data-id="${i.id}" style="left:${x.toFixed(1)}px;--c:${h[2]}" title="${esc(h[1])} at ${tlabel(i.t)}">${tail}<i><em>${GB.svg(h[0])}</em></i></div>`;
    }
    if (i.lane === 'bright') return '';
    let cls = 'ss-it', style = `left:${x.toFixed(1)}px;width:${w.toFixed(1)}px;`, lab = '';
    if (i.lane === 'look') { style += `background:${lookGrad(i.look)}`; lab = i.look; }
    else if (i.lane === 'color') { style += `background:${colGrad(i.colors || ['#fff'])}`; lab = (i.colors || []).length + ' colour' + ((i.colors || []).length === 1 ? '' : 's'); }
    else if (i.lane === 'text') { cls += ' txt'; lab = '“' + i.text + '”'; }
    else if (i.lane === 'effect') { cls += ' fx'; lab = i.effect; }
    else if (i.lane === 'hit') { cls += ' bo'; lab = 'Blackout'; }
    return `<div class="${cls}${sel}${rec}" data-id="${i.id}" style="${style}" title="${esc(lab)} · ${tlabel(i.t)}"><span>${esc(lab)}</span><i class="rz" data-rz="1"></i></div>`;
  }
  function brightSVG(W, lh) {
    const pts = items().filter(i => i.lane === 'bright').sort((a, b) => a.t - b.t);
    const y = v => (4 + (1 - v / 100) * (lh - 8)).toFixed(1);
    let path = '', dots = '';
    if (pts.length) {
      const xs = pts.map(p => (p.t * pps()).toFixed(1));
      path = `M0 ${y(100)} L${xs[0]} ${y(100)} ` + pts.map((p, k) => `L${xs[k]} ${y(p.v)}`).join(' ') + ` L${W} ${y(pts[pts.length - 1].v)}`;
      dots = pts.map((p, k) => `<div class="ss-pt${p.id === S.sel ? ' sel' : ''}" data-id="${p.id}" style="left:${xs[k]}px;top:${y(p.v)}px"><i></i>${p.id === S.sel ? `<b>${p.v}%</b>` : ''}</div>`).join('');
    }
    return `<svg class="ss-bri" width="${W}" height="${lh}" viewBox="0 0 ${W} ${lh}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="ssBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcc66" stop-opacity=".35"/><stop offset="1" stop-color="#ffcc66" stop-opacity="0"/></linearGradient></defs>
      ${path ? `<path d="${path} L${W} ${lh} L0 ${lh} Z" fill="url(#ssBg)"/><path d="${path}" fill="none" stroke="#ffcc66" stroke-width="2"/>` : `<line x1="0" x2="${W}" y1="${y(100)}" y2="${y(100)}" stroke="#ffcc66" stroke-opacity=".25" stroke-dasharray="4 6"/>`}
    </svg>${dots}`;
  }
  function paintPlayhead() {
    const ph = $('ssPlay'); if (!ph) return;
    const p = nowPos();
    if (p == null) { ph.style.display = 'none'; return; }
    ph.style.display = 'block'; ph.style.left = (p * pps()).toFixed(1) + 'px'; ph.firstChild.textContent = GB.fmt(p);
    const sc = $('ssSc');
    if (S.follow && S.now.playing && !drag && Date.now() > S.followHold && sc) {
      const x = p * pps() - sc.scrollLeft;
      if (x < sc.clientWidth * 0.1 || x > sc.clientWidth * 0.75) sc.scrollLeft = Math.max(0, p * pps() - sc.clientWidth * 0.3);
    }
  }
  function zoomBy(f, anchorX) {
    const sc = $('ssSc'); if (!sc) return;
    const ax = anchorX == null ? sc.clientWidth / 2 : anchorX, t = (sc.scrollLeft + ax) / pps();
    S.bar = Math.max(6, Math.min(480, S.bar * f)); GB.store.set('gb_ss_zoom', String(Math.round(S.bar)));
    render(); sc.scrollLeft = Math.max(0, t * pps() - ax);
  }

  // ------------------------------------------------------------------ touch / mouse: tap, drag, stretch, pinch
  let drag = null, pinch = null;
  function wire() {
    const sc = $('ssSc');
    sc.addEventListener('pointerdown', e => {
      if (e.button > 0 || pinch || !S.show) return;
      const el = e.target.closest('.ss-it, .ss-hit, .ss-pt'), lane = e.target.closest('.ss-lane'), rul = e.target.closest('.ss-rul');
      const it = el && !ro() ? items().find(i => i.id === el.dataset.id) : null;
      drag = {pid: e.pointerId, x0: e.clientX, y0: e.clientY, sl0: sc.scrollLeft, moved: false, el, it, lane: lane && lane.dataset.l, rul: !!rul,
              mode: it ? (e.target.dataset.rz ? 'rz' : 'mv') : 'bg', touch: e.pointerType !== 'mouse', t0: it && it.t, e0: it && it.end, v0: it && it.v, snap: null, free: e.altKey};
      if (it) e.preventDefault();
      try { sc.setPointerCapture(e.pointerId); } catch (er) {}          // the scroller outlives any redraw, so the finger's 'up' always arrives
    });
    sc.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 7) return;
      if (!drag.moved) { drag.moved = true; if (drag.it) { drag.snap = snapshot(); drag.el.classList.add('drag'); S.sel = drag.it.id; } }
      if (!drag.it) { if (!drag.touch) { sc.scrollLeft = drag.sl0 - dx; S.followHold = Date.now() + 4000; } return; }
      e.preventDefault();
      // auto-scroll near the edges while dragging a cue
      const r = sc.getBoundingClientRect();
      if (e.clientX > r.right - 28) sc.scrollLeft += 10; else if (e.clientX < r.left + 28) sc.scrollLeft -= 10;
      const ddx = dx + (sc.scrollLeft - drag.sl0), dt = ddx / pps(), it = drag.it, free = e.altKey;
      if (drag.mode === 'rz' && it.end != null) {
        it.end = Math.max(it.t + BEAT() / 2, snapT(drag.e0 + dt, free));
        drag.el.style.width = Math.max(8, (it.end - it.t) * pps()).toFixed(1) + 'px';
      } else {
        const len = it.end != null ? drag.e0 - drag.t0 : 0;
        it.t = Math.max(0, snapT(drag.t0 + dt, free)); if (it.end != null) it.end = +(it.t + len).toFixed(3);
        if (it.lane === 'bright') {
          const lh = LH(); it.v = Math.round(Math.max(0, Math.min(100, drag.v0 - dy / (lh - 8) * 100)));
          drag.el.style.top = (4 + (1 - it.v / 100) * (lh - 8)).toFixed(1) + 'px';
          let b = drag.el.querySelector('b'); if (!b) { b = document.createElement('b'); drag.el.appendChild(b); } b.textContent = it.v + '%';
        }
        drag.el.style.left = (it.t * pps()).toFixed(1) + 'px';
      }
      drag.el.title = tlabel(it.t);
      savedTxt(tlabel(it.t).toUpperCase(), true);
    });
    const end = e => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag; drag = null;
      if (e.type === 'pointercancel') { if (d.it && d.moved) { const st = JSON.parse(d.snap); S.show.items = st.items; render(); savedTxt(S.dirty ? 'SAVING…' : 'SAVED', S.dirty); } return; }
      if (d.it && d.moved) {
        if (d.it.lane === 'bright') S.show.items.sort((a, b) => a.t - b.t);
        if (d.it.t !== d.t0 || d.it.end !== d.e0 || d.it.v !== d.v0) { pushUndo(d.snap); markDirty(); } else savedTxt(S.dirty ? 'SAVING…' : 'SAVED', S.dirty);
        render(); paintTools(); return;
      }
      if (d.moved) return;
      const r = $('ssIn').getBoundingClientRect(), t = (e.clientX - r.left) / pps();
      if (d.it) { S.sel = d.it.id; render(); openEditor(d.it, true); return; }
      if (ro() && d.el) return nudge();
      if (d.rul) { S.cursor = snapT(t); const c = $('ssCur'); if (c) c.style.left = (S.cursor * pps()) + 'px'; rulerTap(S.cursor); return; }
      if (d.lane) {
        const lr = e.target.closest('.ss-lane') || document.querySelector(`.ss-lane[data-l="${d.lane}"]`);
        const fr = lr ? (e.clientY - lr.getBoundingClientRect().top) / lr.clientHeight : 0.5;
        S.cursor = snapT(t); addAt(d.lane, t, fr, true);
      }
    };
    sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end);
    sc.addEventListener('scroll', () => { if (drag && !drag.it) S.followHold = Date.now() + 4000; }, {passive: true});
    // pinch: redraws replace the touched lane, and touch events keep going to the element the finger first touched,
    // so the move/end listeners ride on those elements themselves (they still get events when detached)
    const pinchMove = e => {
      if (!pinch || e.touches.length !== 2) return; e.preventDefault();
      const [a, b] = e.touches, d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const z = Math.max(6, Math.min(480, pinch.z0 * d / pinch.d0));
      if (Math.abs(z - S.bar) < 0.5) return;
      S.bar = z; if (!pinch.raf) pinch.raf = requestAnimationFrame(() => { if (!pinch) return; pinch.raf = 0; render(); sc.scrollLeft = Math.max(0, pinch.t * pps() - pinch.ax); });
    };
    const pinchEnd = e => {
      if (!pinch || e.touches.length >= 2) return;
      pinch.tg.forEach(t => { t.removeEventListener('touchmove', pinchMove); t.removeEventListener('touchend', pinchEnd); t.removeEventListener('touchcancel', pinchEnd); });
      GB.store.set('gb_ss_zoom', String(Math.round(S.bar))); pinch = null; render();
    };
    sc.addEventListener('touchstart', e => {
      if (e.touches.length !== 2) { if (e.touches.length === 1) S.followHold = Date.now() + 4000; return; }
      if (drag && drag.it && drag.moved) { const st = JSON.parse(drag.snap); S.show.items = st.items; }
      drag = null; if (pinch) return;
      const [a, b] = e.touches, r = sc.getBoundingClientRect();
      pinch = {d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, z0: S.bar, ax: (a.clientX + b.clientX) / 2 - r.left, tg: [...new Set([a.target, b.target])]};
      pinch.t = (sc.scrollLeft + pinch.ax) / pps();
      pinch.tg.forEach(t => { t.addEventListener('touchmove', pinchMove, {passive: false}); t.addEventListener('touchend', pinchEnd); t.addEventListener('touchcancel', pinchEnd); });
    }, {passive: true});
    sc.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - sc.getBoundingClientRect().left); }, {passive: false});
    document.addEventListener('keydown', e => {
      if (GB.page !== 'shows' || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') || document.querySelector('.ss-sheet')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) { e.preventDefault(); mutate(() => { S.show.items = items().filter(i => i.id !== S.sel); }); S.sel = null; render(); }
      else if (e.key === '+' || e.key === '=') zoomBy(1.6); else if (e.key === '-') zoomBy(1 / 1.6);
    });
    addEventListener('resize', () => { if (S.key && !drag && !pinch) render(); });
  }
  // tap on the ruler: set the add-here cursor; on the song that's playing, offer to jump the music there
  function rulerTap(t) {
    if (!isCurrent() || !S.now || !['player', 'app'].includes(S.now.src)) return GB.toast('📍 ' + tlabel(t));
    const s = GB.sheet('Bar ' + barOf(t).bar + ' · ' + GB.fmt(t), [
      {ic: 'play', label: 'Jump the music here', sub: 'the song skips to this bar', onclick: async () => {
        const ok = S.now.src === 'player' ? await GB.post('/api/music', {action: 'seek', pos: t}) : await GB.post('/api/media', {action: 'seek', pos: t});
        if (ok) GB.toast('⏩ ' + GB.fmt(t)); }},
      {ic: 'pin', label: 'Just mark this spot', sub: 'new cues from the lane names land here', onclick: () => {}}]);
    s.classList.add('ss-sheet');
  }

  // ------------------------------------------------------------------ the cue editor sheet
  function openEditor(it, fromTap) {
    if (ro()) return nudge();
    document.querySelectorAll('.ss-sheet').forEach(x => x.remove());
    const L = LANES.find(l => l.id === it.lane), sh = document.createElement('div'); sh.className = 'sheet ss-sheet';
    let snap = snapshot(), changed = false;
    const touch = () => { if (!changed) { pushUndo(snap); changed = true; } markDirty(); render(); paintTools(); };
    sh.innerHTML = `<div style="--c:${L.c}"><div class="head"><b>${esc(L.label === 'FX' ? 'Effect' : L.label === 'HITS' ? 'Hit' : L.label)}</b><small id="ssEdT"></small></div><div id="ssEdBody"></div>
      <div class="ss-step" id="ssEdPos"><span class="k">Move</span><button class="btn sm" data-n="-4">${GB.svg('left')}<span>Bar</span></button><b id="ssEdPosV"></b><button class="btn sm" data-n="4"><span>Bar</span>${GB.svg('right')}</button>
        <button class="btn sm" data-n="-1">${GB.svg('left')}<span>Beat</span></button><span></span><button class="btn sm" data-n="1"><span>Beat</span>${GB.svg('right')}</button></div>
      <div class="ss-step" id="ssEdLen" hidden><span class="k">Length</span><button class="btn sm" data-n="-1">− Bar</button><b id="ssEdLenV"></b><button class="btn sm" data-n="1">+ Bar</button></div>
      <div class="grid3"><button class="btn danger" id="ssEdDel">${GB.svg('trash')}<span>Delete</span></button><button class="btn" id="ssEdDup">${GB.svg('add')}<span>Copy</span></button><button class="btn c" id="ssEdOk" style="--c:${L.c}">Done</button></div></div>`;
    document.body.appendChild(sh);
    const body = sh.querySelector('#ssEdBody');
    const paintPos = () => {
      sh.querySelector('#ssEdT').textContent = tlabel(it.t); sh.querySelector('#ssEdPosV').textContent = GB.fmt(it.t) + '.' + String(Math.floor((it.t % 1) * 10));
      const span = it.end != null; sh.querySelector('#ssEdLen').hidden = !span;
      if (span) { const bars = (it.end - it.t) / BAR(); sh.querySelector('#ssEdLenV').textContent = (Math.round(bars * 4) / 4) + (Math.abs(bars - 1) < 0.01 ? ' bar' : ' bars'); }
    };
    sh.querySelectorAll('#ssEdPos button').forEach(b => b.onclick = () => { const d = +b.dataset.n * BEAT(); const len = it.end != null ? it.end - it.t : 0;
      it.t = snapT(Math.max(0, it.t + d)); if (it.end != null) it.end = +(it.t + len).toFixed(3); paintPos(); touch(); });
    sh.querySelectorAll('#ssEdLen button').forEach(b => b.onclick = () => { it.end = Math.max(it.t + BEAT(), snapT(it.end + +b.dataset.n * BAR())); paintPos(); touch(); });
    const close = () => { sh.remove(); };
    sh.querySelector('#ssEdOk').onclick = close;
    sh.querySelector('#ssEdDel').onclick = () => { if (!changed) pushUndo(snap); changed = true; S.show.items = items().filter(i => i.id !== it.id); S.sel = null; markDirty(); render(); paintTools(); close(); GB.toast('Cue deleted (Undo brings it back)'); };
    sh.querySelector('#ssEdDup').onclick = () => {
      const len = it.end != null ? it.end - it.t : BAR(); const c = JSON.parse(JSON.stringify(it)); c.id = uid(); delete c.rec; delete c.auto;
      c.t = snapT(it.t + Math.max(len, BEAT())); if (c.end != null) c.end = +(c.t + len).toFixed(3);
      pushUndo(); S.show.items.push(c); S.sel = c.id; markDirty(); render(); paintTools(); close(); openEditor(c); };
    // the tap that opened the sheet still sends its click a moment later, onto whatever control is under the finger now: swallow it
    if (fromTap) { const opened = Date.now(), ghost = e => { document.removeEventListener('click', ghost, true); if (Date.now() - opened < 500) { e.stopPropagation(); e.preventDefault(); } };
      document.addEventListener('click', ghost, true); setTimeout(() => document.removeEventListener('click', ghost, true), 500); }
    sh.onclick = e => { if (e.target === sh) close(); };
    const mark = () => { delete it.auto; };
    if (it.lane === 'look') {
      body.innerHTML = `<p class="note">This look plays from here to the end of the cue. Colours below are the look's own.</p><div class="chips" style="--c:var(--amber)"></div>`;
      const box = body.querySelector('.chips');
      Object.keys(S.looks).forEach(n => { const c = document.createElement('button'); c.className = 'chip' + (n === it.look ? ' on' : '');
        c.innerHTML = `<span class="sw">${(S.looks[n] || []).slice(0, 4).map(x => `<i style="background:${x}"></i>`).join('')}</span>${esc(n)}`;
        c.onclick = () => { it.look = n; mark(); box.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); touch(); }; box.appendChild(c); });
    } else if (it.lane === 'hit') {
      body.innerHTML = `<div class="tiles ss-hits"></div><div class="ss-step" id="ssEdBeats"><span class="k" id="ssEdBk">Strobe length</span><button class="btn sm" data-n="-1">−</button><b></b><button class="btn sm" data-n="1">+</button></div>
        <p class="note" id="ssEdHn"></p>`;
      const box = body.querySelector('.tiles');
      const paintH = () => { box.querySelectorAll('.tile').forEach(x => x.classList.toggle('on', x.dataset.k === it.hit));
        const bs = body.querySelector('#ssEdBeats'); bs.hidden = it.hit !== 'strobe' && it.hit !== 'blackout';
        if (it.hit === 'strobe') { body.querySelector('#ssEdBk').textContent = 'Strobe length'; bs.querySelector('b').textContent = (it.beats || 4) + ' beats'; }
        if (it.hit === 'blackout') { body.querySelector('#ssEdBk').textContent = 'Dark for'; const nb = Math.round((it.end - it.t) / BEAT() * 2) / 2; bs.querySelector('b').textContent = nb + (nb === 1 ? ' beat' : ' beats'); }
        body.querySelector('#ssEdHn').textContent = {drop: 'The big moment: white flash, new colours, a drop move. Same as the DJ pad.', strobe: 'White strobe for a few beats.', flash: 'One white flash.',
          fire: 'A fire explosion on top of the show.', confetti: 'A confetti cannon in the look\'s colours.', blackout: 'The wall goes dark, then comes back. Great right before a drop.'}[it.hit] || '';
        paintPos(); };
      Object.entries(HITS).forEach(([k, h]) => { const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', h[2]);
        b.innerHTML = `<span class="em">${GB.svg(h[0])}</span>${h[1]}`;
        b.onclick = () => { it.hit = k; mark(); if (k === 'blackout') { if (it.end == null) it.end = +(it.t + BEAT()).toFixed(3); delete it.beats; } else { delete it.end; if (k === 'strobe') it.beats = it.beats || 4; else delete it.beats; } paintH(); touch(); };
        box.appendChild(b); });
      body.querySelectorAll('#ssEdBeats button').forEach(b => b.onclick = () => {
        if (it.hit === 'strobe') { const o = [1, 2, 3, 4, 8, 16], i = o.indexOf(it.beats || 4); it.beats = o[Math.max(0, Math.min(o.length - 1, (i < 0 ? 3 : i) + +b.dataset.n))]; }
        else if (it.hit === 'blackout') it.end = +(it.t + Math.max(0.5, (it.end - it.t) / BEAT() + +b.dataset.n * 0.5) * BEAT()).toFixed(3);
        mark(); paintH(); touch(); });
      paintH();
    } else if (it.lane === 'color') {
      body.innerHTML = `<p class="note">Pick 1 to 3 colours. The look's effects keep moving, in these colours only.</p><div class="ss-prev" id="ssEdPrev"></div><div class="ss-sw"></div>
        <label class="field">Your own colour<div class="row"><input type="color" id="ssEdCol" value="#ff3d9a"><button class="btn sm" id="ssEdColAdd">Add it</button></div></label>`;
      const box = body.querySelector('.ss-sw');
      const paintC = () => { box.querySelectorAll('button').forEach(b => { const k = it.colors.indexOf(b.dataset.v); b.classList.toggle('on', k >= 0); b.dataset.n = k + 1; });
        body.querySelector('#ssEdPrev').style.background = colGrad(it.colors); };
      const toggle = v => { const k = it.colors.indexOf(v); if (k >= 0) { if (it.colors.length > 1) it.colors.splice(k, 1); } else { it.colors.push(v); if (it.colors.length > 3) it.colors.shift(); } mark(); paintC(); touch(); };
      const all = [...SWATCH, ...it.colors.filter(c => !SWATCH.includes(c))];
      all.forEach(v => { const b = document.createElement('button'); b.dataset.v = v; b.style.setProperty('--v', v); b.setAttribute('aria-label', v); b.onclick = () => toggle(v); box.appendChild(b); });
      body.querySelector('#ssEdColAdd').onclick = () => { const v = body.querySelector('#ssEdCol').value.toLowerCase(); if (!box.querySelector(`[data-v="${v}"]`)) { const b = document.createElement('button'); b.dataset.v = v; b.style.setProperty('--v', v); b.onclick = () => toggle(v); box.appendChild(b); } if (!it.colors.includes(v)) toggle(v); };
      paintC();
    } else if (it.lane === 'bright') {
      body.innerHTML = `<p class="note">The wall's brightness follows the line between the points. Before the first point it's 100%, after the last it stays at the last point's level.</p>
        <label class="lv" style="--c:var(--gold)"><span>Brightness</span><input type="range" min="0" max="100" step="5" id="ssEdV"><b id="ssEdVv"></b></label>
        <div class="seg">${[0, 25, 50, 75, 100].map(v => `<button class="btn sm" data-v="${v}">${v}%</button>`).join('')}</div>`;
      const r = body.querySelector('#ssEdV'); r.value = it.v; GB.paintRange(r); body.querySelector('#ssEdVv').textContent = it.v + '%';
      const setV = v => { it.v = v; r.value = v; GB.paintRange(r); body.querySelector('#ssEdVv').textContent = v + '%'; mark(); touch(); };
      r.oninput = () => setV(+r.value); body.querySelectorAll('.seg button').forEach(b => b.onclick = () => setV(+b.dataset.v));
    } else if (it.lane === 'text') {
      body.innerHTML = `<label class="field">Words on the wall<input type="text" id="ssEdTx" maxlength="40" autocomplete="off"></label><div class="chips" style="--c:var(--lime)"></div>
        <p class="note">Short words flash big; longer lines scroll across the wall for the length of the cue.</p>`;
      const inp = body.querySelector('#ssEdTx'); inp.value = it.text;
      inp.oninput = () => { const v = inp.value.trim(); if (v) { it.text = v.slice(0, 40); mark(); touch(); } };
      const box = body.querySelector('.chips');
      LINES.forEach(w => { const c = document.createElement('button'); c.className = 'chip'; c.textContent = w; c.onclick = () => { it.text = w; inp.value = w; mark(); touch(); }; box.appendChild(c); });
    } else if (it.lane === 'effect') {
      body.innerHTML = `<p class="note">This effect plays for the whole cue, in the look's colours. Drops and song parts won't change it.</p>
        <input type="search" id="ssEdFq" placeholder="Search effects" autocomplete="off"><div class="chips ss-fxl" style="--c:var(--lav)"></div>`;
      const box = body.querySelector('.chips'), q = body.querySelector('#ssEdFq');
      const paintF = () => { const s = q.value.trim().toLowerCase(); box.innerHTML = '';
        S.effects.filter(n => !s || n.toLowerCase().includes(s)).slice(0, 160).forEach(n => { const c = document.createElement('button'); c.className = 'chip' + (n === it.effect ? ' on' : ''); c.textContent = n.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
          c.onclick = () => { it.effect = n; mark(); box.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); touch(); }; box.appendChild(c); }); };
      q.oninput = paintF; paintF();
      setTimeout(() => { const on = box.querySelector('.chip.on'); if (on) on.scrollIntoView({block: 'nearest'}); }, 30);
    }
    paintPos();
  }

  // ------------------------------------------------------------------ live: playhead, recording, status
  let pollT = null, rafOn = false, inflight = false;
  const kick = () => { if (inflight) return; clearTimeout(pollT); poll(); };
  async function poll() {
    clearTimeout(pollT); inflight = true;
    if (GB.page === 'shows' && !document.hidden) {
      try {
        const asked = performance.now(), n = await GB.get('/api/shows/now'); const was = S.now && S.now.key;
        S.now = n; S.nowT = performance.now(); paintNow(); paintWhy();
        if (n.key !== was) { renderList(); paintPick(); if (n.key && !S.songs.some(r => r.key === n.key)) loadList(); }
        if (S.key && n.key === S.key && n.rev !== S.rev && asked > (S.savedAt || 0) && quiet()) reloadShow();   // changed on the laptop (record mode)
      } catch (e) {}
    }
    inflight = false;
    pollT = setTimeout(poll, GB.page === 'shows' ? 250 : 2000);
  }
  const quiet = () => !S.dirty && !S.saving && !drag && !pinch && !S.loading && !document.querySelector('.ss-sheet');
  async function reloadShow() {
    S.loading = true; const asked = performance.now();
    try { const r = await GB.get('/api/shows/one?key=' + encodeURIComponent(S.key)); S.loading = false;
      if (r.key === S.key && r.rev !== S.rev && asked > (S.savedAt || 0) && quiet()) { S.show = r.show || {items: [], enabled: true}; S.rev = r.rev; S.song = r.song; render(); paintTools(); } } catch (e) {}
    S.loading = false;
  }
  function frame() { if (GB.page !== 'shows') { rafOn = false; return; } paintPlayhead(); requestAnimationFrame(frame); }
  let started = false;
  GB.on('page', id => { if (id === 'shows' && started) { loadList(); kick(); if (!rafOn) { rafOn = true; requestAnimationFrame(frame); } if (S.key) render(); } });
  GB.on('status', s => {
    const sh = s.show || {};
    const dr = $('ssDjRec'); if (dr) { dr.hidden = !sh.rec; const t = $('ssDjRecS'); if (t) t.textContent = sh.title ? 'Your pads land on “' + sh.title + '” at ' + (sh.pos != null ? GB.fmt(sh.pos) : '…') : 'Start a song: your pads land on its timeline.'; }
    if (S.rec !== !!sh.rec || S.on !== (sh.on !== false)) { S.rec = !!sh.rec; S.on = sh.on !== false; paintTop(); }
  });
  GB.on('pro', () => { paintWhy(); paintTools(); });
  GB.on('ready', () => { started = true; paintTop(); paintTools(); paintWhy(); kick(); if (GB.page === 'shows') { loadList(); rafOn = true; requestAnimationFrame(frame); } });
  window.addEventListener('pagehide', () => { if (S.dirty) saveNow(); });
})();
