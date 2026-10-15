/* 🎧 DJ page: play the lights by hand. Talks to POST /api/dj (dj.py on the laptop).
   Hit pads land on the next beat. Build: hold to wind up, let go to drop. Cue: the next look comes in on the next drop.
   Tap tempo, crowd lines, and a USB / Bluetooth DJ controller (Web MIDI, laptop browser) that can play any pad. */
(function () {
  'use strict';
  const {$, esc} = GB;
  const dj = b => GB.post('/api/dj', GB.withGroup(b));
  const PADS = [['drop', '💥', 'Drop', 'var(--pink)'], ['strobe', '⚡', 'Strobe', '#ffffff'], ['flash', '⚪', 'Flash', 'var(--gold)'],
                ['fire', '🔥', 'Fire burst', 'var(--orange)'], ['confetti', '🎉', 'Confetti', 'var(--lav)'], ['blackout', '⬛', 'Blackout', 'var(--peri)']];
  const LINES = ['HANDS UP', 'JUMP', 'MAKE SOME NOISE', "LET'S GO", 'ONE MORE', 'PUT YOUR LIGHTS UP', 'DROP IT', 'SING IT'];
  GB.css(`
  .dj-pads { grid-template-columns:repeat(3, minmax(0, 1fr)); }
  .dj-pads .tile { min-height:92px; font-size:16px; }
  .dj-pads .tile .em { font-size:32px; }
  .dj-pads .tile:active, .dj-pads .tile.hit { background:var(--c); color:#000; box-shadow:0 0 26px var(--c); }
  #djBuild { min-height:96px; font-size:24px; letter-spacing:3px; touch-action:none; user-select:none; -webkit-user-select:none; }
  #djBuild.held { background:#fff; color:#000; box-shadow:0 0 40px #fff; }
  #djTap { min-height:86px; font-size:26px; letter-spacing:4px; touch-action:manipulation; }
  .dj-bpm { font:44px/1 var(--mono); color:var(--cyan); text-align:center; }
  .dj-midi .item { cursor:pointer; }
  @media (min-width: 700px) { .dj-pads { grid-template-columns:repeat(6, minmax(0, 1fr)); } }
  `);

  // ------------------------------------------------------------------ hit pads
  let learn = null;                                             // pad waiting for a controller button
  // ⚡ instant by default: a pad fires the moment your finger touches it. Snap to beat (switch) holds it for the next beat.
  const snap = () => GB.store.get('gb_dj_snap', '0') === '1';
  async function hit(k, src) {
    const st = (GB.status || {}).dj || {};
    const b = document.querySelector(`#djPads [data-k="${k}"]`); if (b) { b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 220); }
    if (k === 'blackout') { const on = !st.blackout; if (await dj({hit: 'blackout', on})) GB.toast(on ? '⬛ Blackout (tap again to bring it back)' : '💡 Lights back'); }
    else { GB.sfx('on'); if (await dj({hit: k, snap: snap()}) && src !== 'midi' && snap()) GB.toast(PADS.find(p => p[0] === k)[1] + ' on the next beat'); }
  }
  GB.panel('dj', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--red)');
    el.innerHTML = `<div class="ph"><span>Hit pads</span><button class="btn" id="djSnap" style="--c:var(--cyan);min-height:34px;padding:4px 14px;font-size:13px"></button></div>
      <div class="tiles dj-pads" id="djPads"></div>
      <p class="note" id="djSnapNote"></p>`;
    const paintSnap = () => { const on = snap(); const s = el.querySelector('#djSnap'); s.classList.toggle('on', on); s.textContent = on ? '🥁 SNAP TO BEAT: ON' : '⚡ INSTANT';
      el.querySelector('#djSnapNote').textContent = on ? 'Snap to beat: every pad waits for the next beat, so it always lands on time. Blackout holds the wall dark until you tap it again.'
        : 'Instant: pads fire the moment you touch them. Turn on Snap to beat to land every hit on the next beat. Blackout holds the wall dark until you tap it again.'; };
    el.querySelector('#djSnap').onclick = () => { GB.store.set('gb_dj_snap', snap() ? '0' : '1'); paintSnap(); GB.sfx('tap'); GB.toast(snap() ? '🥁 Snap to beat on' : '⚡ Instant hits'); };
    paintSnap();
    PADS.forEach(([k, em, name, c]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.k = k; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${em}</span>${name}`;
      b.style.touchAction = 'manipulation';
      b.addEventListener('pointerdown', e => { if (learn || e.button > 0) return; e.preventDefault(); b._pd = Date.now(); hit(k); });  // fire on touch-down
      b.onclick = () => { if (learn || Date.now() - (b._pd || 0) < 800) return; hit(k); };            // keyboard / fallback
      el.querySelector('#djPads').appendChild(b);
    });
  });

  // ------------------------------------------------------------------ build + tap tempo
  GB.panel('dj', 20, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--pink)');
    el.innerHTML = `<div class="ph"><span>Build &amp; drop</span><span class="r">HOLD, THEN LET GO</span></div>
      <button class="btn c wide" id="djBuild" style="--c:var(--pink)">HOLD TO BUILD</button>
      <p class="note">Hold it: the wall winds up, brighter and faster. Let go: it drops. Slide your finger off the key to cancel.</p>`;
    const b = $('djBuild'); let held = false;
    const start = e => { e.preventDefault(); if (held) return; held = true; b.classList.add('held'); b.textContent = 'BUILDING… LET GO TO DROP'; dj({build: true}); GB.sfx('nav'); };
    const end = (cancel) => { if (!held) return; held = false; b.classList.remove('held'); b.textContent = 'HOLD TO BUILD'; dj({build: false, cancel: !!cancel, snap: snap()}); if (!cancel) GB.sfx('ok'); };
    b.addEventListener('pointerdown', start); b.addEventListener('pointerup', () => end(false));
    b.addEventListener('pointerleave', () => end(true)); b.addEventListener('pointercancel', () => end(true));
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  GB.panel('dj', 30, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Tap tempo</span><span class="r" id="djTapR">FOLLOWING THE MUSIC</span></div>
      <div class="dj-bpm" id="djBpm">–</div>
      <button class="btn c wide" id="djTap" style="--c:var(--cyan)">TAP</button>
      <button class="btn wide" id="djAuto">Back to automatic tempo</button>
      <p class="note">Too loud to hear, or a song with no clear kick? Tap the beat 4 times or more and the whole show locks to your taps.</p>`;
    $('djTap').addEventListener('pointerdown', e => { e.preventDefault(); dj({tap: true}); GB.sfx('tap'); });
    $('djAuto').onclick = async () => { if (await dj({tap_off: true})) GB.toast('🎵 Following the music\'s own tempo'); };
  });

  // ------------------------------------------------------------------ cue the next look
  GB.panel('dj', 40, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--amber)');
    el.innerHTML = `<div class="ph"><span>Cue the next look</span><span class="r" id="djCue">NOTHING CUED</span></div>
      <p class="note">Pick the next look. It comes in on the next drop, yours or the music's.</p>
      <div class="chips" id="djLooks" style="--c:var(--amber)"><span class="note">Loading looks…</span></div>`;
  });
  function renderLooks(cat) {
    const box = $('djLooks'); if (!box || !cat || !cat.looks) return; box.innerHTML = '';
    Object.keys(cat.looks).forEach(n => {
      const c = document.createElement('button'); c.className = 'chip'; c.textContent = n; c.dataset.v = n;
      c.onclick = async () => { const cur = ((GB.status || {}).dj || {}).cue; const v = cur === n ? '' : n;
        if (await dj({cue: v})) GB.toast(v ? '🎯 ' + n + ' comes in on the next drop' : 'Cue cleared'); };
      box.appendChild(c);
    });
  }
  GB.on('catalog', renderLooks);

  // ------------------------------------------------------------------ crowd lines
  GB.panel('dj', 50, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--gold)');
    el.innerHTML = `<div class="ph"><span>Crowd lines</span><span class="r">BIG WORDS, 3 SECONDS</span></div>
      <div class="chips" id="djLines" style="--c:var(--gold)"></div>
      <label class="field">Your own<div class="fd-loc" style="display:flex;gap:8px"><input type="text" id="djSay" maxlength="40" placeholder="DJ name, a shout-out…" style="flex:1;min-width:0"><button class="btn c" id="djSayGo" style="--c:var(--gold)">Flash it</button></div></label>`;
    const box = el.querySelector('#djLines');
    const mine = (GB.store.get('gb_dj_lines', '') || '').split('|').filter(Boolean);
    [...mine, ...LINES].forEach(w => { const c = document.createElement('button'); c.className = 'chip'; c.textContent = w;
      c.onclick = async () => { if (await dj({say: w})) GB.toast('🔤 ' + w); }; box.appendChild(c); });
    const go = async () => { const w = $('djSay').value.trim(); if (!w) return GB.toast('Type something to flash');
      if (await dj({say: w})) { GB.toast('🔤 ' + w.toUpperCase());
        const keep = [w.toUpperCase(), ...mine.filter(x => x !== w.toUpperCase())].slice(0, 6); GB.store.set('gb_dj_lines', keep.join('|')); } };
    $('djSayGo').onclick = go; $('djSay').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });

  // ------------------------------------------------------------------ DJ controller (Web MIDI: Chrome / Edge on the laptop)
  GB.panel('dj', 60, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--violet)');
    const can = !!navigator.requestMIDIAccess;
    el.innerHTML = `<div class="ph"><span>DJ controller</span><span class="r" id="djMidiR">${can ? 'NOT CONNECTED' : 'LAPTOP ONLY'}</span></div>
      <p class="note">${can ? 'Plug in a USB DJ controller or MIDI pad, tap Connect, then teach each pad: tap a pad name here, then hit the button on your controller.'
        : 'Controllers work in Chrome or Edge on the laptop (open GlowBop there). Phones and iPads can\'t talk to them.'}</p>
      ${can ? `<button class="btn c wide" id="djMidiGo" style="--c:var(--violet)">Connect a controller</button>
      <div class="list dj-midi" id="djMap"></div>` : ''}`;
    if (!can) return;
    const MAP = JSON.parse(GB.store.get('gb_dj_midi', '{}') || '{}');    // "status:note" -> pad
    const ACTS = [...PADS.map(p => [p[0], p[1] + ' ' + p[2]]), ['build', '🎚️ Build (hold)'], ['tap', '🥁 Tap tempo']];
    function drawMap() {
      const box = $('djMap'); box.innerHTML = '';
      ACTS.forEach(([k, label]) => {
        const keyFor = Object.keys(MAP).find(x => MAP[x] === k);
        const it = document.createElement('div'); it.className = 'item'; it.innerHTML = `<div class="tx"><b>${label}</b><small>${learn === k ? '👉 hit a button on your controller…' : keyFor ? 'Button ' + esc(keyFor.split(':')[1]) : 'Not set: tap to teach'}</small></div>`;
        it.onclick = () => { learn = learn === k ? null : k; drawMap(); };
        box.appendChild(it);
      });
    }
    function onMsg(m) {
      const [st, note, vel] = m.data; const kind = st & 0xf0; if (kind !== 0x90 && kind !== 0x80 && kind !== 0xb0) return;
      const id = (kind === 0xb0 ? 'cc' : 'n') + ':' + note, down = (kind === 0x90 || kind === 0xb0) && vel > 0;
      if (learn && down) { Object.keys(MAP).forEach(x => { if (MAP[x] === learn) delete MAP[x]; }); MAP[id] = learn; GB.store.set('gb_dj_midi', JSON.stringify(MAP)); GB.toast('🎛️ Learned'); learn = null; drawMap(); return; }
      const act = MAP[id]; if (!act) return;
      if (act === 'build') dj({build: down});
      else if (act === 'tap') { if (down) dj({tap: true}); }
      else if (down) hit(act, 'midi');
    }
    $('djMidiGo').onclick = async () => {
      try {
        const acc = await navigator.requestMIDIAccess();
        const ins = [...acc.inputs.values()]; ins.forEach(i => i.onmidimessage = onMsg);
        acc.onstatechange = () => [...acc.inputs.values()].forEach(i => i.onmidimessage = onMsg);
        $('djMidiR').textContent = ins.length ? ins.map(i => i.name).join(', ').toUpperCase().slice(0, 40) : 'NO CONTROLLER FOUND';
        GB.toast(ins.length ? '🎛️ Controller connected' : 'No controller found. Is it plugged in?');
      } catch (e) { GB.toast('⚠️ The browser blocked the controller'); }
    };
    drawMap();
  });

  // ------------------------------------------------------------------ live state
  GB.on('status', s => {
    const d = s.dj || {};
    const r = $('djNow'); if (r) r.textContent = d.blackout ? 'BLACKOUT' : d.strobing ? 'STROBING' : (d.queued || []).length ? 'FIRING…' : 'ON THE NEXT BEAT';
    document.querySelectorAll('#djPads .tile').forEach(b => b.classList.toggle('on', b.dataset.k === 'blackout' && !!d.blackout));
    const c = $('djCue'); if (c) c.textContent = d.cue ? 'CUED: ' + d.cue.toUpperCase() : 'NOTHING CUED';
    document.querySelectorAll('#djLooks .chip').forEach(b => b.classList.toggle('on', b.dataset.v === d.cue));
    const bpm = $('djBpm'); if (bpm) bpm.textContent = d.tap_bpm ? d.tap_bpm + ' BPM' : (s.bpm ? Math.round(s.bpm) + ' BPM' : '–');
    const tr = $('djTapR'); if (tr) tr.textContent = d.tap_bpm ? 'LOCKED TO YOUR TAPS' : 'FOLLOWING THE MUSIC';
    const au = $('djAuto'); if (au) au.hidden = !d.tap_bpm;
  });
})();
