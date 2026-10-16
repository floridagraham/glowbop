// GlowBop site: nav, scroll reveal, logo sparkles, the recorded LED videos and the try-it console.
(() => {
  const nav = document.querySelector('.nav'), bt = document.querySelector('.burger');

  // 🌈 browser-tab icon slowly cycles colours too (browsers without canvas filters keep the still icon)
  (() => {
    const link = document.querySelector('link[rel=icon]'); if (!link || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const img = new Image(), c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    if (!('filter' in g)) return;
    img.onload = () => { let deg = 0; setInterval(() => { if (document.hidden) return; deg = (deg + 15) % 360;
      g.clearRect(0, 0, 64, 64); g.filter = `hue-rotate(${deg}deg)`; g.drawImage(img, 0, 0, 64, 64); link.href = c.toDataURL('image/png'); }, 420); };
    img.src = '/icon.png';
  })();
  // ☰ phone menu: the key reads CLOSE while open; tapping a link, outside the menu, or Escape closes it
  const setMenu = on => { nav.classList.toggle('open', on); if (bt) { bt.textContent = on ? 'CLOSE ✕' : 'MENU'; bt.setAttribute('aria-expanded', on); } };
  if (bt) bt.onclick = e => { e.stopPropagation(); setMenu(!nav.classList.contains('open')); };
  if (nav) {
    nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', e => { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .12}) : null;
  document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

})();

// ✨ GlowBop logo twinkles: random LEDs of the Curtain Burst logo glint white for a moment
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lit = []; for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const d = Math.hypot(c - 3, r - 3); if (d > 0.5 && d < 3.4) lit.push([r, c]); }
  const pos = v => ((158 + v * 118) / 1024 * 100) + '%';
  document.querySelectorAll('img.gb-logo').forEach(img => {
    const w = document.createElement('span'); w.className = 'gb-tw';
    img.parentNode.insertBefore(w, img); w.appendChild(img);
    const tick = () => {
      const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const [r, c] = lit[(Math.random() * lit.length) | 0], s = document.createElement('i');
        s.style.left = pos(c); s.style.top = pos(r); w.appendChild(s); setTimeout(() => s.remove(), 650);
      }
      setTimeout(tick, 250 + Math.random() * 450);
    };
    tick();
  });
})();

// 🎬 Real GlowBop recordings, as plain looping videos (video/*.mp4, rendered by tools/render_videos.py from the
// engine's recordings). Muted + playsinline, so they play like any video on iPhone and iPad, Reduce Motion included
// (they are decorative: no sound, no controls). Each one plays while it is on screen and pauses when it scrolls away.
(() => {
  const vids = [...document.querySelectorAll('video.gbv')];
  // 📱 phones and iPads: the whole first screen is a glowing LED wall behind the headline
  const bg = document.querySelector('.hero-bg video');
  if (bg && matchMedia('(max-width: 900px)').matches) { bg.poster = bg.dataset.poster; bg.src = bg.dataset.src; vids.unshift(bg); }
  const play = v => { if (!v.paused) return; v.muted = true; try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  vids.forEach(v => {
    v.muted = true; v.defaultMuted = true; v.playsInline = true; v.loop = true;
    v.addEventListener('playing', () => v.classList.add('on'));
    if (v.readyState >= 3 && !v.paused) v.classList.add('on');
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target; v._vis = e.isIntersecting;
      if (v._vis) { if (v.preload === 'none') v.preload = 'auto'; play(v); } else if (!v.paused) v.pause(); }), {rootMargin: '120px 0px'});
    vids.forEach(v => io.observe(v));
  } else vids.forEach(v => { v._vis = true; play(v); });
  // iPhone Low Power Mode blocks autoplay until the first touch: start whatever is on screen then
  const kick = () => vids.forEach(v => { if (v._vis) play(v); });
  ['touchend', 'click'].forEach(ev => addEventListener(ev, kick, {passive: true}));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  // showreels: the caption follows the clip on screen
  document.querySelectorAll('video[data-cues][data-label]').forEach(v => {
    let cues = []; try { cues = JSON.parse(v.dataset.cues); } catch (e) {}
    const lab = document.getElementById(v.dataset.label); if (!lab || !cues.length) return; let last = -1;
    v.addEventListener('timeupdate', () => { const t = v.currentTime + 0.2; let k = 0;
      for (let i = 0; i < cues.length; i++) if (t >= cues[i][0]) k = i;
      if (k !== last) { last = k; lab.textContent = cues[k][1]; } });
  });
})();


// ✨ sparkle logo: random LEDs of the SVG Curtain Burst glint white (same as the app).
// Sets the SVG attributes directly (fill + a slightly bigger dot): works the same in Safari on iPhone / iPad.
(() => {
  document.querySelectorAll('.gbsvg').forEach(host => {
    const lit = [...host.querySelectorAll('circle[data-l]')]; if (!lit.length) return;
    const glint = el => { if (el._on) return; el._on = 1; const f = el.getAttribute('fill');
      el.setAttribute('fill', '#ffffff'); el.setAttribute('r', '5.6');
      setTimeout(() => { el.setAttribute('fill', f); el.setAttribute('r', '4.6'); el._on = 0; }, 300); };
    const tick = () => { if (!document.hidden) { const n = 1 + (Math.random() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) glint(lit[(Math.random() * lit.length) | 0]); }
      setTimeout(tick, 250 + Math.random() * 450); };
    tick();
  });
})();

// 🎛️ The real console, live on the home page: an iframe of the try-it demo (/try/?embed=1#dj). It stays unloaded until it is
// near the screen, then loads quietly behind a poster; the first tap on the poster hands the live console over (no second tap).
(() => {
  const f = document.getElementById('tryLive'); if (!f) return;
  const ifr = f.querySelector('iframe'), go = f.querySelector('.tf-play');
  let ready = false, want = false;
  const load = () => { if (!ifr.getAttribute('src')) ifr.setAttribute('src', ifr.dataset.src); };
  const live = (scroll = true) => {
    f.classList.remove('loading'); f.classList.add('live'); ifr.removeAttribute('inert'); ifr.removeAttribute('tabindex');
    if (!scroll) return;                                          // went live by itself: don't move the page
    // the whole console on screen, just under the sticky menu bar
    const nav = document.querySelector('.nav'), nb = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0, r = f.querySelector('.tf-scr').getBoundingClientRect();
    if (r.top < nb + 4 || r.bottom > innerHeight) scrollBy({top: r.top - nb - 8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    try { ifr.focus({preventScroll: true}); } catch (e) {}
  };
  // loaded = live straight away: no extra tap, visitors just start touching the console
  ifr.addEventListener('load', () => { if (!ifr.getAttribute('src')) return; ready = true; f.classList.add('ready'); live(want); });
  go.addEventListener('click', e => { e.preventDefault(); want = true; load(); if (ready) live(); else f.classList.add('loading'); });
  document.querySelectorAll('a[href="#tryLive"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); want = true; load(); if (ready) live(); else { f.classList.add('loading'); f.scrollIntoView({behavior: 'smooth', block: 'start'}); } }));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); load(); } }, {rootMargin: '600px 0px'});
    io.observe(f);
  }
})();

// 📱 the ▶ Play the live demo bar slides up once you scroll past the top of the page, and hides near the demo itself and the footer
(function () {
  const d = document.querySelector('.demo-dock'); if (!d) return;
  const away = [document.getElementById('tryLive')].filter(Boolean), ft = document.querySelector('footer');
  const near = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const tick = () => d.classList.toggle('show', scrollY > 520 && !away.some(near) && !(ft && near(ft)));
  addEventListener('scroll', tick, {passive: true}); addEventListener('resize', tick); tick();
})();
