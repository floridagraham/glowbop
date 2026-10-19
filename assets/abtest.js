/* 🧪 WHICH FEATURE LEADS? (Oct 18, Graham: "randomize what features are at the top... A-B testing, but A, B, C, D, E, F, G,
   and then we see which one works best"). Every visitor gets one of 8 versions (H, screen mirror, added Oct 19), kept on their device. Each version puts a different
   feature first: a spotlight right under the headline on the home page, the first section on Features, the first Pro card on Pro.
   The winner = the version whose visitors open the demo most. Counted anonymously in PostHog (the same project as the app's
   anonymous stats): only the version letter, the page, and "opened the demo". No names, no emails, no cookies, no location.
   Preview any version with ?ab=C on the address. */
(function () {
  'use strict';
  const KEY = 'phc_myUuNqFeyhyrqPepkxKEWLnc8trVeurMsgwC9sWGA876', HOST = 'https://us.i.posthog.com';
  const S = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
  const vid = (n, l) => `<figure class="led real" style="aspect-ratio:40/21"><video class="gbv ab-v" src="/video/${n}.mp4" poster="/video/${n}.jpg" muted loop playsinline webkit-playsinline autoplay preload="metadata" disableremoteplayback aria-label="${l}"></video><figcaption>🔴 Recorded from GlowBop · ${l}</figcaption></figure>`;
  const V = {
    A: {k: 'sprites', c: '#33d6ff', eb: 'New · Sprites at play', h: 'Little lights that play together', p: 'Eleven playground games for the glowing sprites: tag, leapfrog, jump rope, musical chairs, tug of war and more, all in time with your music.',
        media: vid('sprite-jumprope', 'Jump rope') + vid('sprite-chairs', 'Musical chairs'), demo: '/try/?intro=1', feat: 'sprites-at-play', pro: ['home', 'dj', 'art']},
    B: {k: 'chill', c: '#cc99ff', eb: 'New · Chill pack', h: 'Calm, soft and never boring', p: 'Colour clouds, glow trails and slow ripples that melt into each other. Nothing flashes. The music just nudges them.',
        media: vid('chill-clouds', 'Colour clouds') + vid('chill-trails', 'Glow trails'), demo: '/try/#looks', feat: 'chill-pack', pro: ['home', 'art', 'dj']},
    C: {k: 'dj', c: '#ff3d9a', eb: 'DJ mode', h: 'Play the lights like a club lighting tech', p: 'Hold to build, let go to drop. Hit pads, strobes and fire bursts on top of a show that already hears every beat.',
        media: vid('drop', 'The drop') + vid('look-club-rig', 'Club Rig'), demo: '/try/#dj', feat: 'dj-mode', pro: ['dj', 'home', 'art']},
    D: {k: 'sports', c: '#ffb23d', eb: 'Sports', h: 'Every game tonight, on one wall', p: 'Live scores for 44 leagues, Formula 1 in team colours, and a party on the wall every time your team scores.',
        media: vid('score-football', 'Live football') + vid('f1-win', 'F1 race win'), demo: '/try/#score', feat: 'scoreboard', pro: ['home', 'dj', 'art']},
    E: {k: 'shapes', c: '#4de8c8', eb: '3D shapes', h: 'Bend your lights into art', p: 'Wrap your curtains around a cylinder, a box or a globe. GlowBop knows the shape and the show wraps all the way round.',
        media: vid('shape-spinningglobe', 'Spinning globe') + vid('shape-risingrings', 'Rising rings'), demo: '/try/#lights', feat: '3d-shapes', pro: ['art', 'home', 'dj']},
    F: {k: 'proart', c: '#9b3dff', eb: 'Pro Art', h: 'Your lights, any shape', p: 'Hearts, letters, your logo. Hang your lights in any shape, map them from a file, and the show follows every curve.',
        media: vid('look-3d-object', '3D Object') + vid('fractal-dive', 'Fractal Dreams'), demo: '/try/#art', feat: 'pro-art', pro: ['art', 'dj', 'home']},
    G: {k: 'vibes', c: '#ff7a3d', eb: 'New · Pro DJ', h: 'A different vibe in every room', p: 'Tap a screen, pick its vibe. The living room stays Chill Lounge while the basement runs Sprite Party, from one iPad.',
        media: `<figure class="dev tablet"><img src="/img/app/ipad-vibes.webp" alt="The vibe picker on an iPad" loading="lazy" style="width:100%;border-radius:14px"></figure>`, demo: '/try/#dj', feat: 'vibe-per-screen', pro: ['dj', 'home', 'art']},
    H: {k: 'mirror', c: '#33d6ff', eb: 'Screen mirror', h: 'Your screen, on your lights', p: 'Movies, music videos, concerts, your game: whatever plays on your laptop plays across every light you own, any brand mix, pixel by pixel.',
        media: `<figure class="led real" style="aspect-ratio:1280/470"><video class="gbv ab-v" src="/video/mirror-screen.mp4" poster="/video/mirror-screen.jpg" muted loop playsinline webkit-playsinline autoplay preload="metadata" disableremoteplayback aria-label="Your screen mirrored onto the lights"></video><figcaption>🎨 Illustration · Your screen, live on the wall</figcaption></figure>`, demo: '/try/#scenes', feat: 'screen-mirror', pro: ['home', 'dj', 'art'], one: true}
  };
  let v = S.get('gb_ab');
  const q = (new URLSearchParams(location.search).get('ab') || '').toUpperCase();
  if (V[q]) { v = q; S.set('gb_ab', v); }
  if (!V[v]) { const ks = Object.keys(V); v = ks[Math.floor(Math.random() * ks.length)]; S.set('gb_ab', v); }
  const X = V[v]; document.documentElement.dataset.ab = v;
  const id = S.get('gb_sid') || (() => { const r = 'web-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)); S.set('gb_sid', r); return r; })();
  const page = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  function send(event, props, beacon) {
    if (!KEY || /localhost|127\.0\.0\.1/.test(location.hostname)) return;
    const body = JSON.stringify({api_key: KEY, batch: [{event, timestamp: new Date().toISOString(), properties: Object.assign({distinct_id: id, $lib: 'glowbop-site',
      variant: v, feature: X.k, page, shape: innerWidth < 700 ? 'phone' : innerWidth < 1024 ? 'tablet' : 'desktop', $process_person_profile: false, $geoip_disable: true, $ip: null}, props || {})}]});
    try { if (beacon && navigator.sendBeacon) navigator.sendBeacon(HOST + '/batch/', new Blob([body], {type: 'text/plain'}));
          else fetch(HOST + '/batch/', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {}); } catch (e) {}
  }
  // 🎯 what counts: opening the demo, from any page, any button
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="/try"]'); if (!a) return;
    const sec = a.closest('section[id], .feat[id], header'), where = a.dataset.ab ? 'spotlight' : sec ? (sec.id || sec.tagName.toLowerCase()) : 'page';
    send('site_demo_open', {where, link: a.getAttribute('href')}, true);
  }, true);
  function apply() {
    // 🏠 home: a spotlight on this version's feature, right under the headline
    const tr = document.getElementById('try');
    if (tr && (page === '/' || /\/index$/.test(page))) {
      const s = document.createElement('section'); s.className = 'tight ab-spot'; s.id = 'spotlight';
      s.innerHTML = `<div class="wrap"><div class="feat ab-feat" style="--c:${X.c}"><div><span class="eyebrow" style="--c:${X.c}">${X.eb}</span><h2>${X.h}</h2><p class="lead">${X.p}</p>
        <div class="btns"><a class="btn primary" data-ab="1" href="${X.demo}">▶ Try it in the live demo</a> <a class="btn" href="/features.html#${X.feat}">See how it works →</a></div></div>
        <div class="media">${X.one || /^<figure class="dev/.test(X.media) ? X.media : '<div class="grid g2 mini">' + X.media + '</div>'}</div></div></div>`;
      tr.parentNode.insertBefore(s, tr);
    }
    // ✨ features: this version's section goes first
    const f = document.getElementById(X.feat), first = document.querySelector('.feat[data-cat]');
    if (f && first && f !== first) first.parentNode.insertBefore(f, first);
    // ⭐ Pro cards: this version's Pro door first
    const door = c => /pro-dj|pro\.html/.test(c.getAttribute('href') || '') && !/art|home/.test(c.getAttribute('href')) ? 'dj' : /home/.test(c.getAttribute('href') || '') ? 'home' : /art/.test(c.getAttribute('href') || '') ? 'art' : 'x';
    document.querySelectorAll('#go-pro .lc-grid').forEach(g => { const cs = [...g.children]; X.pro.slice().reverse().forEach(k => { const c = cs.find(x => door(x) === k); if (c) g.prepend(c); }); });
    send('site_view', {first: X.feat});
  }
  window.GBAB = {variant: v, feature: X.k, versions: Object.keys(V)};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
