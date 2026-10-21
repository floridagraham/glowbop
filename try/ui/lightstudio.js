/* 🧭 LIGHTS studio (Oct 18, Graham on the iPad sideways: "things are hidden, you scroll down and have to open them back up; the buttons
   are huge; I'm overwhelmed"). Apple's iPad rules (HIG: sidebars, split views, buttons): one main thing big, its controls in one
   panel beside it, every section visible as a tab (nothing folded shut), buttons fingertip-sized (44 pt) instead of giant.
   On wide screens (iPad sideways, laptop) the LIGHTS page becomes: the live board on the left, filling the screen, and an
   inspector on the right with tabs: Lights · Groups · Shape · Map · xLights. Narrow screens keep the old stacked page. */
(function () {
  'use strict';
  const {$} = GB;
  const WIDE = () => innerWidth >= 1000 && innerWidth >= innerHeight;
  let built = false, cur = 'lights';
  try { cur = localStorage.getItem('gb_lt_tab') || 'lights'; } catch (e) {}
  GB.css(`
  html.lt-studio #pg-lights { gap:0; }
  html.lt-studio body[data-page="lights"] #main { grid-template-columns:minmax(0, 1fr) !important; }
  html.lt-studio body[data-page="lights"] #main > #view { display:none !important; }
  html.lt-studio body[data-page="lights"] #pages { grid-column:1 / -1; }
  .lt-shell { display:grid; grid-template-columns:minmax(0, 1fr) clamp(320px, 31vw, 400px); gap:12px; min-height:420px; grid-column:1 / -1; width:100%; }
  .lt-left { min-width:0; min-height:0; display:flex; flex-direction:column; }
  html.lt-studio #slPanel:not(.sl-full) { display:flex !important; flex-direction:column; flex:1 1 auto; min-height:0; height:100%; margin:0; }
  html.lt-studio #slPanel:not(.sl-full) .sl-stage { flex:1 1 auto; height:auto !important; min-height:240px; }
  html.lt-studio #slPanel:not(.sl-full) > .sl-more, html.lt-studio #slPanel:not(.sl-full) > .sl-go { display:none !important; }
  .lt-insp { min-width:0; min-height:0; display:flex; flex-direction:column; background:#0d0a18; border:1px solid var(--line); border-radius:0 18px 0 18px; overflow:hidden; }
  .lt-tabs { display:grid; grid-template-columns:repeat(5, 1fr); gap:4px; padding:6px; background:#120d20; border-bottom:1px solid var(--line); }
  .lt-tabs button { min-height:48px; border:0; border-radius:12px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
    background:color-mix(in srgb, var(--c) 14%, #150f24); color:color-mix(in srgb, var(--c) 65%, #fff); font:800 calc(12px * var(--fs, 1)) var(--cond); letter-spacing:1px; text-transform:uppercase; }
  .lt-tabs button i { font-style:normal; font-size:18px; line-height:1; }
  .lt-tabs button.on { background:var(--c); color:#000; box-shadow:0 0 14px color-mix(in srgb, var(--c) 55%, transparent); }
  .lt-bodies { flex:1 1 auto; min-height:0; overflow:auto; padding:10px 12px 18px; overscroll-behavior:contain; }
  .lt-body:not(.on) { display:none; }
  .lt-body > .box, .lt-body > section.box { border:0 !important; background:none !important; box-shadow:none !important; padding:0 !important; margin:0 0 16px !important; }
  .lt-body > .box > .ph { margin-bottom:6px; }
  .lt-body .btn { min-height:44px !important; font-size:calc(14px * var(--fs, 1)) !important; }
  .lt-body .btn.wide, .lt-body .seg .btn { min-height:44px !important; }
  .lt-body .sl-side { display:flex !important; flex-direction:column; gap:8px; max-height:none !important; overflow:visible !important; margin-bottom:12px; }
  .lt-body .note { font-size:calc(13px * var(--fs, 1)); }
  .lt-add { display:flex; flex-direction:column; gap:8px; padding:10px; margin:0 0 14px; border-radius:14px; background:color-mix(in srgb, var(--cyan) 8%, #0b0814); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--cyan) 30%, transparent); }
  .lt-add .sub { margin:0; }
  .lt-empty { color:var(--dim); font:600 13px var(--cond); letter-spacing:.5px; padding:4px 2px 10px; }
  `);
  const TABS = [['lights', '💡', 'Lights', 'var(--cyan)'], ['groups', '🧩', 'Groups', 'var(--peri, #9a80ff)'], ['shape', '🗺️', 'Shape', '#ffc23d'], ['map', '📷', 'Map', '#3ce08a'], ['xl', '🎄', 'xLights', '#ff6a5c']];
  const boxOf = (sel, title) => { const el = sel ? $(sel) : null; if (el) return el;
    if (title) return [...document.querySelectorAll('#pg-lights .box')].find(b => (b.querySelector('.ph') || {}).textContent && b.querySelector('.ph').textContent.includes(title)); return null; };
  function show(k) {
    cur = k; try { localStorage.setItem('gb_lt_tab', k); } catch (e) {}
    document.querySelectorAll('.lt-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tb === k));
    document.querySelectorAll('.lt-body').forEach(b => b.classList.toggle('on', b.dataset.tb === k));
  }
  GB.ltTab = show;
  function fitHeight() {
    const sh = document.querySelector('.lt-shell'); if (!sh || GB.page !== 'lights') return;
    const top = sh.getBoundingClientRect().top + scrollY - (document.querySelector('.topbar, header') ? 0 : 0);
    sh.style.height = Math.max(420, innerHeight - Math.max(0, sh.getBoundingClientRect().top) - 12) + 'px'; void top;
  }
  function build() {
    if (built || !WIDE()) return;
    const pg = $('pg-lights'), sl = $('slPanel'); if (!pg || !sl || !$('lightsPanel')) return;
    built = true; GB.ltShell = true; document.documentElement.classList.add('lt-studio');
    const shell = document.createElement('div'); shell.className = 'lt-shell';
    const left = document.createElement('div'); left.className = 'lt-left';
    const insp = document.createElement('div'); insp.className = 'lt-insp';
    insp.innerHTML = `<div class="lt-tabs" role="tablist">${TABS.map(([k, ic, t, c]) => `<button role="tab" data-tb="${k}" style="--c:${c}"><i>${ic}</i>${t}</button>`).join('')}</div>
      <div class="lt-bodies">${TABS.map(([k]) => `<section class="lt-body" data-tb="${k}"></section>`).join('')}</div>`;
    pg.prepend(shell); shell.append(left, insp); left.appendChild(sl);
    const body = k => insp.querySelector(`.lt-body[data-tb="${k}"]`);
    // 🧰 Oct 20: tools live on the tools bar, not in a tab
    const take = (el, k) => { if (!el || el.dataset.tool === '1') return; const det = el.closest('details.sl-more'); body(k).appendChild(el); if (det) det.remove(); el.classList.remove('sl-sub'); el.classList.add('box'); el.style.removeProperty('grid-column'); el.style.removeProperty('grid-row'); };
    // 💡 Lights: add new lights first, then the picked light's layout controls, then every light's flash / off / name / remove
    const lp = $('lightsPanel');
    take($('addPanel'), 'lights');                               // ➕ Oct 20: Find my lights first, always at the top of the Lights tab
    const side = sl.querySelector('.sl-side'); if (side) body('lights').appendChild(side);   // the light you picked: its controls
    take($('hlPanel'), 'lights');                                // 📶 Wi-Fi health, live
    take($('ckPanel'), 'lights');                                // 🩺 Check my lights, right under the picked light
    take(lp, 'lights');
    take($('grpPanel'), 'groups');
    take($('layoutPanel'), 'shape'); take($('lineupPanel'), 'shape');
    take($('camPanel'), 'map');                                  // (drawing + xLights moved to the HOUSE page, Oct 21) take(boxOf(null, 'Straight curtains'), 'map');
    // anything else left on the page (future panels) goes under the board's tabs instead of stacking below
    [...pg.children].filter(c => c !== shell && c.classList && c.classList.contains('box')).forEach(c => body('lights').appendChild(c));
    insp.querySelectorAll('.lt-tabs button').forEach(b => { const bd = body(b.dataset.tb); b.hidden = !bd.querySelector('.panel, .sl-side'); });   // 🧰 a tab with nothing left (all tools) hides
    insp.querySelectorAll('.lt-tabs button').forEach(b => b.onclick = () => { show(b.dataset.tb); GB.sfx && GB.sfx('tap'); });
    // picking a light on the board or in the light row brings its controls up
    document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#slList, #slSvg')) show('lights'); }, true);
    show(TABS.some(t => t[0] === cur) ? cur : 'lights');
    fitHeight(); setTimeout(fitHeight, 300);
    GB.reflowLayout && GB.reflowLayout();
  }
  GB.on('page', id => { if (id === 'lights') setTimeout(() => { build(); fitHeight(); }, 120); });
  GB.on('ready', () => setTimeout(build, 600));
  addEventListener('resize', () => { if (built && !WIDE()) location.reload(); else { build(); fitHeight(); } });
  addEventListener('scroll', () => { if (GB.page === 'lights') fitHeight(); }, {passive: true});
})();
