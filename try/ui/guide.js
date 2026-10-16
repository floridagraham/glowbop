/* 📖 GlowBop user guide, inside the app: a floating handbook window that travels with you.
   - Drag it by its title bar, resize it from the corner (mouse or finger), X closes it. Size and spot are remembered.
   - The app keeps working behind it: switch tabs, play, tweak, while the guide stays open.
   - Contents, search, every section of the website guide (ui/guide_content.json, built from glowbop.com/guide), back button,
     previous / next. Rail keys in the text (DJ, LIGHTS ...) are tappable: they open that part of the app.
   - It opens on the section for the page you're on. ⧉ pops it out into its own window (laptop).
   Works on its own too (ui/guide.html = the popped-out window). */
(function () {
  'use strict';
  const W = window, standalone = /[?&]standalone=1/.test(location.search);
  const GB = W.GB || (W.GB = {});
  const store = GB.store || {get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
                             set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }};
  const css = GB.css || (t => { const s = document.createElement('style'); s.textContent = t; document.head.appendChild(s); });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const tap = () => { try { GB.sfx && GB.sfx('tap'); } catch (e) {} };

  // which guide section fits the app page you're on
  const PAGE2SEC = {music: 'music', dj: 'dj', looks: 'looks', scenes: 'fireplace', feeds: 'live-feeds', score: 'scoreboard', text: 'text-logos',
    holiday: 'holidays', games: ['looks', 'games'], shows: ['pro-dj', 'shows'], autoloops: ['pro-dj', 'autoloops'], cues: ['pro-dj', 'cues'],
    board: ['pro-dj', 'faders'], ops: ['pro-dj', 'override'], pro: 'pro-dj', lights: 'lineup', setup: 'console'};

  css(`
  #gbGuide { position:fixed; z-index:880; display:none; flex-direction:column; background:var(--panel, #0a0812); color:var(--text, #f4f2ff);
    border:1px solid var(--line, #2e2845); border-left:10px solid var(--cyan, #33d6ff); border-radius:0 22px 0 22px;
    box-shadow:0 18px 60px rgba(0,0,0,.75), 0 0 0 1px rgba(51,214,255,.15); min-width:280px; min-height:240px; overflow:hidden; touch-action:none; }
  #gbGuide.open { display:flex; }
  #gbGuide.solo { position:static; width:100% !important; height:100vh !important; border-radius:0; box-shadow:none; border-left-width:10px; }
  #gbGuide .gg-bar { display:flex; align-items:center; gap:6px; padding:8px 8px 8px 14px; background:linear-gradient(90deg, color-mix(in srgb, var(--cyan, #33d6ff) 22%, #0d0b18), #0d0b18);
    border-bottom:1px solid var(--line, #2e2845); cursor:grab; user-select:none; -webkit-user-select:none; flex:none; }
  #gbGuide.drag .gg-bar { cursor:grabbing; }
  #gbGuide .gg-t { flex:1 1 auto; min-width:0; font:700 calc(15px * var(--fs, 1)) var(--cond, sans-serif); letter-spacing:2.5px; text-transform:uppercase; color:var(--cyan, #33d6ff);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #gbGuide .gg-b { appearance:none; border:0; border-radius:999px; min-width:44px; height:44px; padding:0 12px; background:var(--dark, #26213a); color:var(--text, #fff);
    font:700 calc(16px * var(--fs, 1)) var(--cond, sans-serif); letter-spacing:1px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; flex:none; }
  #gbGuide .gg-b:active { transform:scale(.95); filter:brightness(1.25); }
  #gbGuide .gg-b.x { background:#3a0f1c; color:#ffc2cf; }
  #gbGuide .gg-b[disabled] { opacity:.35; }
  #gbGuide .gg-chips { display:flex; gap:6px; overflow-x:auto; padding:8px 10px; border-bottom:1px solid var(--line, #2e2845); flex:none; scrollbar-width:none; }
  #gbGuide .gg-chips::-webkit-scrollbar { display:none; }
  #gbGuide .gg-chip { appearance:none; border:0; flex:none; min-height:40px; padding:0 13px; border-radius:999px; background:var(--dark2, #1a1628); color:var(--text, #fff);
    font:600 calc(14px * var(--fs, 1)) var(--cond, sans-serif); letter-spacing:.5px; white-space:nowrap; cursor:pointer; }
  #gbGuide .gg-chip.on { background:var(--cyan, #33d6ff); color:#000; }
  #gbGuide .gg-body { flex:1 1 auto; overflow-y:auto; overscroll-behavior:contain; padding:14px 18px 22px; -webkit-overflow-scrolling:touch; touch-action:pan-y;
    font:400 calc(16px * var(--fs, 1))/1.55 var(--body, sans-serif); }
  #gbGuide .gg-body h1 { font:800 calc(26px * var(--fs, 1))/1.1 var(--cond, sans-serif); letter-spacing:1px; margin:2px 0 6px; text-transform:uppercase; }
  #gbGuide .gg-sub { color:var(--dim, #a9a3c8); margin:0 0 14px; }
  #gbGuide .gg-body h2 { font:700 calc(19px * var(--fs, 1))/1.2 var(--cond, sans-serif); letter-spacing:1.5px; text-transform:uppercase; color:var(--cyan, #33d6ff); margin:22px 0 8px; scroll-margin-top:8px; }
  #gbGuide .gg-body h3 { font:700 calc(17px * var(--fs, 1))/1.2 var(--cond, sans-serif); letter-spacing:1px; color:var(--gold, #ffcc66); margin:16px 0 6px; }
  #gbGuide .gg-body p, #gbGuide .gg-body li { margin:0 0 9px; }
  #gbGuide .gg-body ul, #gbGuide .gg-body ol { padding-left:22px; margin:0 0 12px; }
  #gbGuide .gg-body a { color:var(--cyan, #33d6ff); text-decoration:underline; text-underline-offset:3px; }
  #gbGuide .gg-body .k { display:inline-block; padding:1px 9px; border-radius:999px; background:var(--dark, #26213a); color:var(--text, #fff);
    font:700 calc(14px * var(--fs, 1))/1.5 var(--cond, sans-serif); letter-spacing:.8px; text-transform:uppercase; white-space:nowrap; }
  #gbGuide .gg-body .k.rail { background:var(--c, var(--peri)); color:#000; cursor:pointer; }
  #gbGuide .gg-body .k.rail::after { content:' ↗'; font-size:.8em; }
  #gbGuide .gg-body .protag { display:inline-block; padding:0 8px; border-radius:999px; background:var(--gold, #ffcc66); color:#000; font:700 calc(12px * var(--fs, 1))/1.6 var(--cond, sans-serif); letter-spacing:1px; text-transform:uppercase; }
  #gbGuide .gg-body .tip { border-left:5px solid var(--cyan, #33d6ff); background:color-mix(in srgb, var(--cyan, #33d6ff) 9%, transparent); padding:10px 12px; border-radius:0 12px 0 12px; margin:12px 0; }
  #gbGuide .gg-body .tip.pink { border-left-color:var(--pink, #ff3d9a); background:color-mix(in srgb, var(--pink, #ff3d9a) 9%, transparent); }
  #gbGuide .gg-body .tip.warn { border-left-color:var(--amber, #ffb23d); background:color-mix(in srgb, var(--amber, #ffb23d) 9%, transparent); }
  #gbGuide .gg-body .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:10px; margin:10px 0; }
  #gbGuide .gg-body .card { background:var(--dark2, #1a1628); border:1px solid var(--line, #2e2845); border-radius:0 14px 0 14px; padding:10px 12px; }
  #gbGuide .gg-body .card h3 { margin-top:2px; }
  #gbGuide .gg-body .card .em { font-size:26px; }
  #gbGuide .gg-body .dim { color:var(--dim, #a9a3c8); }
  #gbGuide .gg-body .railgrp { margin:10px 0; }
  #gbGuide .gg-toc { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:8px; }
  #gbGuide .gg-card { appearance:none; text-align:left; border:1px solid var(--line, #2e2845); border-left:6px solid var(--cyan, #33d6ff); border-radius:0 14px 0 14px; background:var(--dark2, #1a1628);
    color:var(--text, #fff); padding:12px; min-height:64px; cursor:pointer; font:inherit; }
  #gbGuide .gg-card b { display:block; font:700 calc(17px * var(--fs, 1))/1.2 var(--cond, sans-serif); letter-spacing:.8px; text-transform:uppercase; margin-bottom:3px; }
  #gbGuide .gg-card small { color:var(--dim, #a9a3c8); font-size:calc(13.5px * var(--fs, 1)); line-height:1.35; display:block; }
  #gbGuide .gg-search { width:100%; min-height:48px; border-radius:999px; border:1px solid var(--line, #2e2845); background:#05040a; color:var(--text, #fff); padding:0 18px; font:inherit; margin:0 0 12px; }
  #gbGuide .gg-hit { margin:0 0 10px; }
  #gbGuide .gg-hit mark { background:var(--gold, #ffcc66); color:#000; border-radius:3px; padding:0 2px; }
  #gbGuide .gg-pager { display:flex; gap:8px; margin-top:24px; }
  #gbGuide .gg-pager .gg-b { flex:1 1 0; height:auto; min-height:52px; border-radius:0 14px 0 14px; flex-direction:column; align-items:flex-start; padding:6px 14px; text-align:left; text-transform:uppercase; font-size:calc(14px * var(--fs, 1)); }
  #gbGuide .gg-pager .gg-b small { font-size:11px; color:var(--dim, #a9a3c8); letter-spacing:1.5px; }
  #gbGuide .gg-pager .gg-b.nx { align-items:flex-end; text-align:right; }
  #gbGuide .gg-rs { position:absolute; right:0; bottom:0; width:34px; height:34px; cursor:nwse-resize; touch-action:none;
    background:linear-gradient(135deg, transparent 0 46%, var(--cyan, #33d6ff) 46% 54%, transparent 54% 64%, var(--cyan, #33d6ff) 64% 72%, transparent 72%); opacity:.85; }
  #gbGuide.solo .gg-rs, #gbGuide.solo .gg-pop { display:none; }
  #gbGuideBtn { min-height:40px; margin-right:6px; } @media (max-width: 560px) { #gbGuideBtn .gl { display:none; } #gbGuideBtn { padding:0 12px; } }
  @media (max-width: 520px) { #gbGuide .gg-b { min-width:42px; height:42px; padding:0 10px; } #gbGuide .gg-pop { display:none; } }
  `);

  // ------------------------------------------------------------------ data
  let DATA = null, loading = null;
  const load = () => loading || (loading = fetch('/ui/guide_content.json?v=2').then(r => r.json()).then(d => (DATA = d)).catch(e => { loading = null; throw e; }));
  const secIdx = slug => DATA.findIndex(s => s.slug === slug);

  // ------------------------------------------------------------------ the window
  let el = null, body = null, chips = null, title = null, backB = null, hist = [], cur = null;
  function build() {
    if (el) return;
    el = document.createElement('div'); el.id = 'gbGuide'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'GlowBop user guide');
    el.innerHTML = `<div class="gg-bar"><button class="gg-b gg-back" aria-label="Back">◀</button><button class="gg-b gg-home" aria-label="Contents">☰</button>
        <div class="gg-t">📖 User guide</div><button class="gg-b gg-pop" aria-label="Pop out into its own window" title="Pop out">⧉</button><button class="gg-b x gg-x" aria-label="Close the guide">✕</button></div>
      <div class="gg-chips" role="tablist" aria-label="Guide sections"></div>
      <div class="gg-body"></div><div class="gg-rs" aria-hidden="true"></div>`;
    document.body.appendChild(el);
    body = el.querySelector('.gg-body'); chips = el.querySelector('.gg-chips'); title = el.querySelector('.gg-t'); backB = el.querySelector('.gg-back');
    if (standalone) el.classList.add('solo');
    el.querySelector('.gg-x').onclick = () => { tap(); if (standalone) W.close(); else close(); };
    el.querySelector('.gg-home').onclick = () => { tap(); show(null, null, true); };
    backB.onclick = () => { tap(); const h = hist.pop(); if (h) show(h[0], h[1], false, true); };
    el.querySelector('.gg-pop').onclick = () => {
      tap(); const s = cur ? cur.slug : '';
      const w = W.open('/ui/guide.html?standalone=1' + (s ? '&s=' + s : ''), 'gbguide', 'width=560,height=820,menubar=no,toolbar=no');
      if (w) close();
    };
    // links inside the guide: other sections, anchors, the app's own pages
    body.addEventListener('click', e => {
      const a = e.target.closest('a[data-g]');
      if (a) { e.preventDefault(); tap(); return a.dataset.g ? show(a.dataset.g, a.dataset.a || null, true) : show(null, null, true); }
      const k = e.target.closest('.k.rail');
      if (k && GB.go && !standalone) { const lb = k.textContent.trim().toUpperCase(), pg = (GB.PAGES || []).find(p => p.label === lb); if (pg) { tap(); GB.go(pg.id); } }
      const c = e.target.closest('[data-open]');
      if (c) { tap(); show(c.dataset.open, c.dataset.a || null, true); }
    });
    if (!standalone) { drag(); resize(); W.addEventListener('resize', () => { if (el.classList.contains('open')) clampIn(); }); }
  }
  const box = () => { try { return JSON.parse(store.get('gb_guide_box', '') || 'null'); } catch (e) { return null; } };
  function place() {
    const b = box(), vw = innerWidth, vh = innerHeight, phone = vw < 700;
    const w = b ? b.w : (phone ? vw - 16 : Math.min(460, vw * 0.42)), h = b ? b.h : (phone ? Math.round(vh * 0.58) : Math.round(vh * 0.8));
    const x = b ? b.x : (phone ? 8 : vw - w - 18), y = b ? b.y : (phone ? vh - h - 8 : Math.round(vh * 0.1));
    Object.assign(el.style, {width: w + 'px', height: h + 'px', left: x + 'px', top: y + 'px'}); clampIn();
  }
  function clampIn() {
    const r = el.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    const w = Math.max(280, Math.min(r.width, vw - 8)), h = Math.max(240, Math.min(r.height, vh - 8));
    const x = Math.max(4 - w + 120, Math.min(r.left, vw - 120)), y = Math.max(4, Math.min(r.top, vh - 60));   // keep the title bar reachable
    Object.assign(el.style, {width: w + 'px', height: h + 'px', left: x + 'px', top: y + 'px'});
  }
  const save = () => { const r = el.getBoundingClientRect(); store.set('gb_guide_box', JSON.stringify({x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height)})); };
  function drag() {
    const bar = el.querySelector('.gg-bar'); let sx, sy, ox, oy, on = false;
    bar.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; on = true; el.classList.add('drag'); bar.setPointerCapture(e.pointerId);
      const r = el.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; e.preventDefault(); });
    bar.addEventListener('pointermove', e => { if (!on) return; el.style.left = (ox + e.clientX - sx) + 'px'; el.style.top = (oy + e.clientY - sy) + 'px'; });
    const end = () => { if (!on) return; on = false; el.classList.remove('drag'); clampIn(); save(); };
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }
  function resize() {
    const h = el.querySelector('.gg-rs'); let sx, sy, ow, oh, on = false;
    h.addEventListener('pointerdown', e => { on = true; h.setPointerCapture(e.pointerId); const r = el.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ow = r.width; oh = r.height; e.preventDefault(); });
    h.addEventListener('pointermove', e => { if (!on) return; el.style.width = Math.max(280, ow + e.clientX - sx) + 'px'; el.style.height = Math.max(240, oh + e.clientY - sy) + 'px'; });
    const end = () => { if (!on) return; on = false; clampIn(); save(); };
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
  }

  // ------------------------------------------------------------------ pages of the guide
  function paintChips() {
    chips.innerHTML = '<button class="gg-chip" data-c="">☰ All</button>' + DATA.map(s => `<button class="gg-chip" data-c="${s.slug}">${s.em} ${esc(s.title)}</button>`).join('');
    chips.querySelectorAll('.gg-chip').forEach(b => b.onclick = () => { tap(); b.dataset.c ? show(b.dataset.c, null, true) : show(null, null, true); });
  }
  function markChip() {
    chips.querySelectorAll('.gg-chip').forEach(b => b.classList.toggle('on', b.dataset.c === (cur ? cur.slug : '')));
    const on = chips.querySelector('.gg-chip.on'); if (on) on.scrollIntoView({inline: 'center', block: 'nearest'});
    backB.disabled = !hist.length;
  }
  function show(slug, anchor, push, fromBack) {
    if (!DATA) return load().then(() => { paintChips(); show(slug, anchor, push, fromBack); }).catch(() => { body.innerHTML = '<p>The guide could not load. Check the laptop connection and try again.</p>'; });
    if (!chips.children.length) paintChips();
    if (push && !fromBack) { hist.push([cur ? cur.slug : null, null]); if (hist.length > 40) hist.shift(); }
    const i = slug ? secIdx(slug) : -1;
    if (i < 0) { cur = null; title.textContent = '📖 User guide'; contents(); }
    else {
      cur = DATA[i]; title.textContent = cur.em + ' ' + cur.title;
      const prev = i > 0 ? DATA[i - 1] : null, next = i + 1 < DATA.length ? DATA[i + 1] : null;
      body.innerHTML = `<h1>${cur.em} ${esc(cur.title)}</h1><p class="gg-sub">${esc(cur.sub)}</p>${cur.html}
        <div class="gg-pager">${prev ? `<button class="gg-b" data-open="${prev.slug}"><small>◀ PREVIOUS</small>${esc(prev.title)}</button>` : `<button class="gg-b" data-open=""><small>◀ BACK</small>Contents</button>`}
        ${next ? `<button class="gg-b nx" data-open="${next.slug}"><small>NEXT ▶</small>${esc(next.title)}</button>` : ''}</div>`;
      body.querySelectorAll('[data-open=""]').forEach(b => b.onclick = () => { tap(); show(null, null, true); });
      body.scrollTop = 0;
      if (anchor) { const t = body.querySelector('#' + CSS.escape(anchor)); if (t) setTimeout(() => t.scrollIntoView({block: 'start'}), 30); }
    }
    store.set('gb_guide_sec', cur ? cur.slug : '');
    markChip();
  }
  function contents() {
    body.innerHTML = `<h1>📖 The GlowBop handbook</h1><p class="gg-sub">Everything in the app, step by step. Keep it open while you use GlowBop: drag it by the top bar, resize it from the corner.</p>
      <input class="gg-search" type="search" placeholder="Search the guide (try: drop, Bluetooth, logo)" aria-label="Search the guide">
      <div class="gg-res"></div>
      <div class="gg-toc">${DATA.map((s, n) => `<button class="gg-card" data-open="${s.slug}"><b>${s.em} ${n + 1}. ${esc(s.title)}</b><small>${esc(s.sub)}</small></button>`).join('')}</div>
      <div class="tip pink" style="margin-top:16px"><b>New here?</b> Getting started → Using the console → Line up your curtains → play a song. Everything else is a bonus.</div>`;
    body.scrollTop = 0;
    const q = body.querySelector('.gg-search'), res = body.querySelector('.gg-res'), toc = body.querySelector('.gg-toc');
    q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase();
      if (v.length < 2) { res.innerHTML = ''; toc.hidden = false; return; }
      const hits = [];
      DATA.forEach(s => {
        const d = document.createElement('div'); d.innerHTML = s.html;
        let lastH = null;
        d.querySelectorAll('h2, p, li').forEach(n => {
          if (n.tagName === 'H2') { lastH = n; }
          const t = n.textContent; const i = t.toLowerCase().indexOf(v);
          if (i >= 0 && hits.length < 30) hits.push({s, a: lastH ? lastH.id : null, h: lastH ? lastH.textContent : s.title, snip: t.slice(Math.max(0, i - 60), i + v.length + 80), i: Math.min(60, i)});
        });
      });
      toc.hidden = true;
      res.innerHTML = hits.length ? hits.map(h => `<button class="gg-card gg-hit" data-open="${h.s.slug}" data-a="${h.a || ''}"><b>${h.s.em} ${esc(h.h)}</b><small>${esc(h.snip).replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), m => '<mark>' + m + '</mark>')}</small></button>`).join('')
        : '<p class="dim">Nothing found. Try another word.</p>';
    });
  }

  // ------------------------------------------------------------------ open / close
  function open(slug, anchor) {
    const first = !el; build(); el.classList.add('open'); if (!standalone) { if (first) place(); else clampIn(); }
    if (slug === undefined) {                                  // the section for the page you're on
      const m = PAGE2SEC[GB.page]; if (Array.isArray(m)) { slug = m[0]; anchor = m[1]; } else slug = m || null;
    }
    show(slug, anchor, false); store.set('gb_guide_open', '1');
  }
  function close() { if (el) el.classList.remove('open'); store.set('gb_guide_open', '0'); }
  GB.guide = {open, close, toggle: s => (el && el.classList.contains('open') ? close() : open(s))};

  // ------------------------------------------------------------------ entry points
  if (standalone) {
    const m = /[?&]s=([a-z-]+)/.exec(location.search);
    document.addEventListener('DOMContentLoaded', () => open(m ? m[1] : null, null));
    if (document.readyState !== 'loading') open(m ? m[1] : null, null);
    return;
  }
  function addHeaderKey() {                                    // 📖 GUIDE key in the top bar, next to SFX
    const line = document.querySelector('#hd .line'); if (!line || document.getElementById('gbGuideBtn')) return;
    const b = document.createElement('button'); b.className = 'btn sm c'; b.id = 'gbGuideBtn'; b.style.setProperty('--c', 'var(--cyan)');
    b.setAttribute('aria-label', 'Open the user guide'); b.innerHTML = '<span>📖</span><span class="gl">GUIDE</span>';
    b.onclick = () => GB.guide.toggle();
    const sfx = document.getElementById('sfx'); line.insertBefore(b, sfx || null);
  }
  function addFooterKey() {                                    // ✨ FEATURES way down at the bottom: the plain-words tour of everything
    const bars = document.querySelector('#ft .bars'), help = document.getElementById('ftHelp');
    if (!bars || document.getElementById('ftFeat')) return;
    const b = document.createElement('button'); b.id = 'ftFeat'; b.style.setProperty('--c', 'var(--gold)'); b.textContent = '✨ FEATURES';
    b.className = help ? help.className.replace('grow', '').trim() : ''; b.style.cssText += ';padding:0 14px;';
    b.onclick = () => open('features');
    bars.insertBefore(b, help ? help.nextSibling : null);
  }
  if (GB.panel) {
    GB.panel('setup', 4, el2 => {                              // 📖 at the top of SETUP
      el2.classList.add('box'); el2.style.setProperty('--c', 'var(--cyan)');
      el2.innerHTML = `<div class="ph"><span>User guide</span><span class="r">THE HANDBOOK</span></div>
        <p class="note">Every part of GlowBop, step by step. It opens in a window you can drag, resize and keep open while you use the app.</p>
        <div class="seg" style="margin-top:10px"><button class="btn c" style="--c:var(--cyan)" data-s="">📖 Open the guide</button><button class="btn" data-s="getting-started">🚀 Getting started</button><button class="btn" data-s="troubleshooting">🛠️ Fixes</button></div>
        <button class="btn wide" style="margin-top:8px;--c:var(--gold)" data-s="features">✨ All the features, in plain words</button>`;
      el2.querySelectorAll('[data-s]').forEach(b => b.onclick = () => open(b.dataset.s || null));
    });
    GB.panel('lights', 95, el2 => {                            // 🖨️ straight curtains (the free 3D clips)
      el2.classList.add('box'); el2.style.setProperty('--c', 'var(--cyan)');
      el2.innerHTML = `<div class="ph"><span>Straight curtains</span><span class="r">FREE 3D CLIPS</span></div>
        <p class="note">Curtain bulbs drifting out of line? Free GlowBop clips line up every row and column, so logos and text look sharp. The 3D model is coming soon.</p>
        <button class="btn wide" style="margin-top:10px">🖨️ How to get your curtains straight</button>`;
      el2.querySelector('button').onclick = () => open('straight');
    });
  }
  const boot = () => { addHeaderKey(); addFooterKey(); setTimeout(() => load().catch(() => {}), 4000); if (store.get('gb_guide_open', '0') === '1') open(store.get('gb_guide_sec', '') || null); };
  if (GB.on) GB.on('ready', boot); else document.addEventListener('DOMContentLoaded', boot);
})();
