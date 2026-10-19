/* 🩺 Check my lights (Oct 18, Graham: "a way for people, if things are going haywire, to diagnose it and fix it themselves").
   One tap: the laptop checks every light (Wi-Fi, offline, slowed down, groups, the map) and answers in plain words, worst first,
   each with a one-tap fix when there is one. Lives at the top of LIGHTS. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  GB.css(`
  .ck-go { min-height:56px !important; font-size:calc(17px * var(--fs, 1)) !important; }
  .ck-sum { font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; margin:10px 2px 6px; }
  .ck-list { display:grid; gap:8px; }
  .ck-it { display:grid; grid-template-columns:auto minmax(0, 1fr); gap:10px; align-items:start; padding:10px 12px; border-radius:14px;
    background:color-mix(in srgb, var(--k) 10%, #0b0814); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--k) 40%, transparent); }
  .ck-it > .ic { width:26px; height:26px; fill:var(--k); color:var(--k); margin-top:2px; }
  .ck-it b { display:block; font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:#fff; }
  .ck-it p { margin:3px 0 0; color:var(--text); font-size:calc(13.5px * var(--fs, 1)); line-height:1.35; }
  .ck-it .btn { margin-top:8px; min-height:44px; }
  .ck-it.ok { --k:#3ce08a; } .ck-it.warn { --k:#ffc23d; } .ck-it.bad { --k:#ff4d6d; }
  .ck-busy { display:flex; align-items:center; gap:10px; color:var(--cyan); font:700 calc(14px * var(--fs, 1)) var(--cond); letter-spacing:1px; padding:8px 2px; }
  .ck-busy i { width:14px; height:14px; border-radius:50%; background:var(--cyan); animation:ckP .9s ease-in-out infinite; }
  @keyframes ckP { 50% { transform:scale(.5); opacity:.4; } }
  `);
  GB.panel('lights', 5, el => {
    el.id = 'ckPanel'; el.classList.add('box'); el.style.setProperty('--c', '#3ce08a');
    el.innerHTML = `<div class="ph"><span>Check my lights</span><span class="r" id="ckR">FIX IT YOURSELF</span></div>
      <p class="note">Something look off? One tap checks every light and tells you what's wrong, in plain words, with a fix.</p>
      <button class="btn c wide ck-go" id="ckGo" style="--c:#3ce08a">${GB.svg('search')}<span>Check my lights</span></button>
      <div id="ckOut"></div>`;
    el.querySelector('#ckGo').onclick = run;
  });
  const ICON = {wifi: 'wifi', turtle: 'turtle', puzzle: 'puzzle', move: 'move', check: 'check'};
  let busy = false;
  async function run() {
    if (busy) return; busy = true; const out = $('ckOut'), go = $('ckGo'); if (go) go.disabled = true;
    out.innerHTML = '<div class="ck-busy"><i></i>Checking every light… (about 5 seconds)</div>'; GB.sfx && GB.sfx('tap');
    const j = await GB.post('/api/lights/checkup', {});
    busy = false; if (go) go.disabled = false;
    if (!j) { out.innerHTML = ''; return; }
    const F = j.findings || [], bad = F.filter(f => f.lvl === 'bad').length, warn = F.filter(f => f.lvl === 'warn').length;
    const sum = bad + warn === 0 ? '<div class="ck-sum" style="color:#3ce08a">All good: every light checks out</div>'
      : `<div class="ck-sum" style="color:${bad ? '#ff4d6d' : '#ffc23d'}">${bad + warn} thing${bad + warn > 1 ? 's' : ''} to look at</div>`;
    out.innerHTML = sum + '<div class="ck-list">' + F.map((f, i) => `<div class="ck-it ${f.lvl}">${GB.svg(ICON[f.ic] || 'help')}<div><b>${esc(f.title)}</b><p>${esc(f.body)}</p>
      ${f.fix ? `<button class="btn c" data-ck="${i}" style="--c:var(--k)">${esc(f.fix.label)}</button>` : ''}</div></div>`).join('') + '</div>';
    out.querySelectorAll('[data-ck]').forEach(b => b.onclick = async () => {
      const f = F[+b.dataset.ck].fix; b.disabled = true;
      const r = await GB.post('/api/lights/fixup', {act: f.act, ids: f.ids || []});
      if (r) { GB.toast((r.ok ? '✅ ' : '⚠️ ') + r.msg); GB.sfx && GB.sfx(r.ok ? 'ok' : 'err'); if (r.ok && !r.restart && f.act !== 'lineup') setTimeout(run, 1200); }
      b.disabled = false; });
    const R = $('ckR'); if (R) R.textContent = bad ? 'NEEDS A FIX' : warn ? 'LOOK AT THIS' : 'ALL GOOD';
  }
  GB.checkLights = run;
})();
