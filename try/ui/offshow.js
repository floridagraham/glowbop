/* GlowBop console: "Lights on their own" (Oct 19, topic 2).
   💾 Laptop-off show: GlowBop saves 3 loops of the show it just played INTO each Twinkly (stored movies + a playlist),
      so the curtains keep playing GlowBop when the laptop is closed or GlowBop is stopped.
   🌙 When the music stops: keep GlowBop's calm look, or let every light play its own built-in effect (see idle in the engine). */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  GB.css(`
  #offPanel .off-list { display:flex; flex-direction:column; gap:6px; margin:8px 0; }
  #offPanel .off-row { display:flex; justify-content:space-between; gap:8px; padding:10px 12px; border-radius:12px; background:color-mix(in srgb, var(--cyan) 8%, #0b0814); font:600 14px var(--cond); letter-spacing:.3px; }
  #offPanel .off-row small { color:var(--cyan); font-weight:600; text-align:right; }
  #offPanel .off-acts { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  #offPanel .off-acts .btn { min-height:48px; }
  #offPanel .off-acts .off-main { grid-column:1 / -1; min-height:64px; }
  #offPanel .seg { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
  #offPanel .seg .btn { min-height:48px; }
  `);
  const ago = t => { if (!t) return 'not saved yet'; const m = Math.round((Date.now() / 1000 - t) / 60); return 'saved ' + (m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'); };
  let poll = null;

  GB.panel('lights', 70, el => {
    el.id = 'offPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)');
    el.innerHTML = `<div class="ph"><span>Lights on their own</span></div>
      <p class="note">💾 <b>Laptop-off show:</b> save the show that just played into your Twinkly lights. When GlowBop stops or the laptop closes, they keep playing it.</p>
      <div class="off-list" id="offList"><p class="note">Loading…</p></div>
      <div class="off-acts">
        <button class="btn c off-main" id="offSave" style="--c:var(--cyan)">${GB.svg('save')}<span>Save the last minute</span></button>
        <button class="btn" id="offPrev" style="--c:var(--cyan)">${GB.svg('play')}<span>Preview 20 s</span></button>
        <button class="btn" id="offOff" style="--c:var(--pink)">${GB.svg('stop')}<span>Turn it off</span></button>
      </div>
      <div class="sub" style="margin-top:14px">🌙 When the music stops</div>
      <div class="seg" id="offIdle"><button class="btn" data-idle="glowbop" style="--c:var(--lav)">GlowBop calm look</button><button class="btn" data-idle="builtin" style="--c:var(--lav)">Each light's own effect</button></div>`;
    $('offSave').onclick = () => save(false);
    $('offPrev').onclick = async () => { const r = await GB.post('/api/lights/offshow', {act: 'preview', secs: 20}); if (r) GB.toast(r.playing && r.playing.length ? '💾 Playing the saved show on ' + r.playing.join(', ') + ' for 20 seconds' : '💾 Nothing saved yet: tap Save the last minute first'); };
    $('offOff').onclick = async () => { if (await GB.post('/api/lights/offshow', {act: 'off'})) { GB.toast('💾 Laptop-off show off: lights go back to their own app when GlowBop stops'); paint(); } };
    el.querySelectorAll('[data-idle]').forEach(b => b.onclick = async () => { if (await GB.post('/api/lights/idle', {mode: b.dataset.idle})) { paintIdle(b.dataset.idle); GB.toast(b.dataset.idle === 'builtin' ? '🌙 When the music stops, each light plays its own built-in effect' : '🌙 When the music stops, GlowBop keeps its calm look'); } });
    paint();
  });
  function paintIdle(m) { document.querySelectorAll('#offIdle [data-idle]').forEach(b => b.classList.toggle('on', b.dataset.idle === m)); }
  async function paint() {
    let r = null; try { r = await GB.get('/api/lights/offshow'); } catch (e) {}
    const box = $('offList'); if (!box) return;
    const L = (r && r.lights) || [];
    box.innerHTML = L.length ? L.map(x => `<div class="off-row"><span>${esc(x.name)}</span><small>${x.saved ? ago(x.saved) : x.secs >= 20 ? x.secs + ' s ready to save' : 'listening… ' + x.secs + ' s'}</small></div>`).join('')
      : '<p class="note">Laptop-off show works with Twinkly lights. Add one to use it.</p>';
    paintIdle((r && r.idle) || 'glowbop');
    const st = r && r.state;
    if (st && st.state === 'saving') { if (!poll) poll = setInterval(paint, 2000); }
    else if (poll) { clearInterval(poll); poll = null; report(st); }
  }
  function report(st) {
    const L = Object.values((st && st.lights) || {}); if (!L.length) return;
    const bad = L.filter(x => !x.ok), full = bad.filter(x => /replace/.test(x.why || ''));
    if (!bad.length) { GB.sfx && GB.sfx('ok'); return GB.toast('💾 Saved into ' + L.map(x => x.name).join(', ') + '. Close the laptop any time: the show keeps going.'); }
    if (full.length) return GB.sheet(full.map(x => x.name).join(', ') + ' are full', [
      {label: 'Replace what is saved on them', ic: 'check', sub: 'clears the effects saved in the Twinkly app', onclick: () => save(true)},
      {label: 'Keep them as they are', ic: 'back', onclick: () => {}}]);
    GB.notice({tone: 'warn', icon: '💾', title: 'Not saved on ' + bad.map(x => x.name).join(', '), body: bad.map(x => x.name + ': ' + x.why).join(' · '), tip: 'Let a song play for a minute, then tap Save the last minute again.'});
  }
  async function save(replace) {
    const r = await GB.post('/api/lights/offshow', {act: 'save', replace}); if (!r) return;
    GB.toast('💾 Saving the last minute into ' + (r.saving || []).join(', ') + '…');
    setTimeout(paint, 1500);
  }
  GB.on && GB.on('page', id => { if (id === 'lights') paint(); });
})();
