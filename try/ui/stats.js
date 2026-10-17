/* 📊 Anonymous usage stats (Oct 17, 2026, Graham: "how they arrange their screen, what they're touching the most").
   What goes out: which pages get opened, which keys get tapped (counted, sent in small batches), how long a visit lasts,
   the screen shape (laptop / iPad / iPhone), Home or Pro, how many light sets, and the box layout when someone finishes Arrange.
   What never goes out: names, song titles, typed text, Wi-Fi or network details, light names.
   On by default; SETUP > "Share anonymous stats" turns it off for every screen in the house. */
(() => {
  const KEY = 'phc_myUuNqFeyhyrqPepkxKEWLnc8trVeurMsgwC9sWGA876';                                         // PostHog project key (phc_...), public by design. Empty = nothing is sent.
  const HOST = 'https://us.i.posthog.com';
  const VER = '1.0';
  const S = {get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }};
  let on = S.get('gb_stats') !== '0', dev = false, ready = false;
  const id = S.get('gb_sid') || (() => { const v = 'gb-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)); S.set('gb_sid', v); return v; })();
  const live = () => KEY && on && !dev && ready && !window.__demoWall;
  const shape = () => { const w = innerWidth, h = innerHeight;
    if (w < 700) return 'iphone-upright'; if (h <= 500 && w > h) return 'iphone-sideways';
    if (w >= 1000 && w >= h) return matchMedia('(hover: none) and (pointer: coarse)').matches ? 'ipad-sideways' : 'laptop';
    return 'ipad-upright'; };
  const tier = () => GB.pro === true ? (document.documentElement.classList.contains('prodj') ? 'pro-dj' : 'pro') : GB.pro === false ? 'home' : 'unknown';
  let lights = null;
  const base = () => ({distinct_id: id, $lib: 'glowbop', app_version: VER, shape: shape(), tier: tier(), door: GB.proDoor || null, page: GB.page, light_sets: lights, $process_person_profile: false, $geoip_disable: true});

  const Q = []; let taps = {}, tapN = 0;
  const stat = GB.stat = (event, props) => { if (!KEY || !on || dev || window.__demoWall) return; Q.push({event, properties: Object.assign(base(), props || {}), timestamp: new Date().toISOString()}); if (Q.length > 40) flush(); };
  function flush(beacon) {
    if (tapN) { stat('taps', {counts: taps, total: tapN}); taps = {}; tapN = 0; }
    if (!live() || !Q.length) return;
    const body = JSON.stringify({api_key: KEY, batch: Q.splice(0, Q.length)});
    try { if (beacon && navigator.sendBeacon) navigator.sendBeacon(HOST + '/batch/', new Blob([body], {type: 'text/plain'}));
          else fetch(HOST + '/batch/', {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true}).catch(() => {}); } catch (e) {}
  }
  setInterval(flush, 30000);
  addEventListener('pagehide', () => { stat('visit_end', {seconds: Math.round((Date.now() - t0) / 1000), pages_seen: seen.size}); flush(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(true); });

  // 👆 what gets touched: a short name for the key (its id, its rail page, or its label), counted per page
  const nameOf = el => {
    if (el.id) return el.id;
    if (el.dataset && el.dataset.p) return 'rail:' + el.dataset.p;
    const box = el.closest('.panel[id], [data-lk]'), where = box ? (box.id || box.dataset.lk) : 'page';
    const t = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24);
    return where + ':' + (t || el.tagName.toLowerCase());
  };
  document.addEventListener('pointerup', e => {
    const el = e.target.closest && e.target.closest('button, .btn, .chip, .tile, a, [role=button]'); if (!el || el.closest('input, textarea')) return;
    if (el.closest('#suLicPanel, .pro-keyrow')) return;          // never anything near a license key
    const k = (GB.page || '?') + '>' + nameOf(el); taps[k] = (taps[k] || 0) + 1; tapN++;
  }, true);

  // 📄 pages and visits
  const t0 = Date.now(), seen = new Set();
  GB.on('page', p => { seen.add(p); stat('page_view', {page: p}); });
  GB.on('status', s => { const n = s && Array.isArray(s.lights) ? s.lights.length : null; if (n !== null) lights = n; });

  // 🔁 the switch is shared by every screen in the house (kept on the computer next to the layouts)
  fetch('/api/layouts', {cache: 'no-store'}).then(r => r.json()).then(j => {
    dev = !!(j && j.nostats); const v = j && j.items && j.items.gb_stats; if (v === '0' || v === '1') { on = v === '1'; S.set('gb_stats', v); }
  }).catch(() => {}).finally(() => { ready = true; stat('app_open', {first_open: S.get('gb_stat_first') !== '1', referrer_app: navigator.standalone ? 'home-screen' : 'browser'}); S.set('gb_stat_first', '1'); });
  GB.statsOn = () => on;
  GB.setStats = v => { on = !!v; S.set('gb_stats', v ? '1' : '0'); if (GB.layPut) GB.layPut('gb_stats', v ? '1' : '0'); };

  // ⚙️ SETUP: the switch
  GB.panel('setup', 60, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--cyan)'); el.id = 'suStats';
    el.innerHTML = `<div class="ph"><span>📊 Help make GlowBop better</span></div>
      <p class="note">GlowBop shares anonymous stats: which pages and keys you use, and how you arrange your screens. No names, songs, typed text or network details. It helps us build better layouts for everyone.</p>
      <button class="btn wide" id="suStatsBtn"></button>`;
    const b = el.querySelector('#suStatsBtn'), paint = () => { b.classList.toggle('c', on); b.classList.toggle('on', on); b.style.setProperty('--c', 'var(--cyan)'); b.textContent = on ? '✅ Sharing anonymous stats (tap to stop)' : 'Share anonymous stats: off (tap to turn on)'; };
    b.onclick = () => { GB.setStats(!on); paint(); GB.toast(on ? '📊 Thanks! Anonymous stats are on' : 'Anonymous stats are off on every screen'); };
    paint();
  });
})();
