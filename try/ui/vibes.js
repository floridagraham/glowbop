/* 🎛️ A VIBE FOR EVERY SCREEN (Pro DJ, Oct 18, Graham: "in the pro version, in the DJ version, you touch the screens and then you
   can choose what kind of vibe you have. Because if you're running separate rooms or separate light things, you want to be able to").
   On the DJ page in Pro, tap any group's picture on the live wall: a sheet pops up with that group's vibes (its looks, painted in
   their own colours). The one you tap is pinned to that group only; "Follow the music" lets it pick its own again. Every screen's
   label on the live wall shows the vibe it's running. Your main DJ keys keep driving everything else.
   Engine: POST /api/control {look, pin:true, group} / {release:true, group}; GET /api/catalog (looks + colours); status.groups[].look/pinned */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  const FAV = ['Chill Lounge', 'Deep Calm', 'Sprite Party', 'Toy Box', 'Neon Party', 'Studio 54', 'Fractal Dreams', 'Rock Arena', 'Tropicana', 'Silk', 'Lava Lounge', 'Retro Arcade'];
  GB.css(`
  .vb-wrap { position:fixed; inset:0; z-index:9998; background:#000a; display:flex; align-items:flex-end; justify-content:center; animation:vbFade .18s ease-out; }
  .vb-card { width:min(760px, 100vw); max-height:min(78vh, 720px); overflow:auto; background:#0e0819; border-radius:22px 22px 0 0; padding:16px 16px calc(16px + env(safe-area-inset-bottom));
    box-shadow:0 0 0 2px var(--vc, #ff3d9a), 0 -10px 40px #000c; animation:vbUp .22s ease-out; }
  @media (min-width:900px) and (min-height:600px) { .vb-wrap { align-items:center; } .vb-card { border-radius:22px; } }
  .vb-hd { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .vb-hd b { font:800 calc(20px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; color:#fff; flex:1; min-width:0; }
  .vb-hd small { display:block; font:700 calc(13px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:var(--vc, #ff3d9a); text-transform:none; }
  .vb-x { width:44px; height:44px; border-radius:12px; border:0; background:#2a1840; color:#fff; font:800 18px var(--cond); cursor:pointer; flex:0 0 auto; }
  .vb-lt { font:800 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1.5px; text-transform:uppercase; color:#b98cff; margin:14px 2px 8px; }
  .vb-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:8px; }
  .vb-v { position:relative; min-height:64px; border:0; border-radius:14px; padding:8px 10px; text-align:left; display:flex; align-items:flex-end; cursor:pointer;
    font:800 calc(15px * var(--fs, 1)) var(--cond); letter-spacing:.5px; color:#fff; text-shadow:0 1px 3px #000, 0 0 8px #000; transition:transform .1s; }
  .vb-v:active { transform:scale(.97); }
  .vb-v.on { box-shadow:0 0 0 3px #fff, 0 0 18px #fff8; }
  .vb-v.on::after { content:'NOW'; position:absolute; top:6px; right:8px; font:800 11px var(--cond); letter-spacing:1px; background:#000; color:#fff; padding:2px 6px; border-radius:6px; text-shadow:none; }
  .vb-auto { width:100%; min-height:52px; border:0; border-radius:14px; cursor:pointer; background:linear-gradient(90deg, #33d6ff, #b98cff, #ff3d9a); color:#000;
    font:800 calc(16px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .vb-auto.on { box-shadow:0 0 0 3px #fff; }
  @keyframes vbFade { from { opacity:0; } } @keyframes vbUp { from { transform:translateY(30px); opacity:0; } }
  `);
  const GCOL = ['#ff3d9a', '#33d6ff', '#ffcc33', '#2bd96b', '#b98cff', '#ff8a1a'];
  const grp = id => ((GB.status && GB.status.groups) || []).find(g => g.id === id) || {};
  GB.vibeOf = id => { const g = grp(id); return g.look ? {look: g.look, pinned: !!g.pinned} : null; };
  const paint = cs => { const c = (cs || []).map(h => '#' + h); if (!c.length) return 'linear-gradient(135deg,#ff3d9a,#33d6ff)';
    return c.length === 1 ? c[0] : 'linear-gradient(135deg,' + c.join(',') + ')'; };
  function close() { const s = $('vbSheet'); if (s) s.remove(); }
  async function open(h) {
    close();
    if (!GB.catalog || !GB.catalog.looks) { try { GB.catalog = await GB.get('/api/catalog'); } catch (e) {} }   // not loaded yet: fetch it now
    const looks = (GB.catalog && GB.catalog.looks) || {}, names = Object.keys(looks), cur = GB.vibeOf(h.id) || {};
    const gi = ((GB.status && GB.status.groups) || []).findIndex(g => g.id === h.id), vc = GCOL[(gi < 0 ? 0 : gi) % GCOL.length];
    const card = n => `<button class="vb-v${cur.pinned && cur.look === n ? ' on' : ''}" data-vb="${esc(n)}" style="background:${paint((looks[n] || {}).colors)}">${esc(n)}</button>`;
    const fav = FAV.filter(n => looks[n]), rest = names.filter(n => !fav.includes(n)).sort();
    const wrap = document.createElement('div'); wrap.className = 'vb-wrap'; wrap.id = 'vbSheet'; wrap.style.setProperty('--vc', vc);
    wrap.innerHTML = `<div class="vb-card" role="dialog" aria-label="Vibe for ${esc(h.name)}">
      <div class="vb-hd"><b>🎛️ Vibe for ${esc(h.name)}<small>${cur.look ? 'Now: ' + esc(cur.look) + (cur.pinned ? ' · 📌 pinned' : ' · following the music') : 'Pick how this screen feels'}</small></b><button class="vb-x" aria-label="Close">✕</button></div>
      <button class="vb-auto${cur.pinned ? '' : ' on'}" data-vb-auto>🔀 Follow the music</button>
      ${fav.length ? `<div class="vb-lt">⭐ Favourite vibes</div><div class="vb-grid">${fav.map(card).join('')}</div>` : ''}
      <div class="vb-lt">🎨 Every vibe</div><div class="vb-grid">${rest.map(card).join('')}</div></div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    wrap.querySelector('.vb-x').onclick = close;
    wrap.querySelector('[data-vb-auto]').onclick = async () => {
      if (await GB.post('/api/control', {release: true, group: h.id})) { GB.sfx && GB.sfx('ok'); GB.toast('🔀 ' + h.name + ' follows the music again'); close(); } };
    wrap.querySelectorAll('[data-vb]').forEach(b => b.onclick = async () => {
      const n = b.dataset.vb;                                            // its own group only: never the global group pick
      if (await GB.post('/api/control', {look: n, pin: true, group: h.id})) { GB.sfx && GB.sfx('ok'); GB.toast('🎛️ ' + h.name + ': ' + n); close(); } });
    document.body.appendChild(wrap);
  }
  // the live wall asks first: on the DJ page in Pro, a tap on a screen opens its vibes (anywhere else it still picks the group)
  GB.vibeTap = h => { if (GB.page !== 'dj' || GB.pro !== true || !h) return false; open(h); return true; };
  GB.openVibe = open;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();
