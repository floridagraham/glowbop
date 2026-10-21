/* GlowBop console: LIGHTS → Import from xLights. Point GlowBop at an xLights show folder (typed path, Browse on the
   laptop, a picked folder or a zip), see what it found (controllers, props, pixels, zones, the house as dots), test it
   prop by prop, then "Use this house" or "Hand back to my show".
   Engine: GET /api/xl/status | suggest, POST /api/xl/scan | test | use | handback | takeover | settings | remove | browse (xlights_api.py). */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  GB.css(`
  .xl-row { display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:6px; align-items:center; }
  .xl-row input { min-width:0; width:100%; }
  .xl-row .btn { min-height:48px; }
  .xl-3 { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:6px; }
  .xl-3.xl-act { grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); }
  .xl-2 { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:6px; }
  .xl-3 .btn, .xl-2 .btn { min-height:48px; padding:0 6px; min-width:0; gap:6px; }
  .xl-3 .btn span, .xl-2 .btn span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .xl-prev { width:100%; height:auto; aspect-ratio:1000 / var(--xlh, 500); max-height:260px; background:#06050c; border:1px solid var(--line); border-radius:0 14px 0 14px; display:block; }
  .xl-ctl { display:flex; gap:8px; align-items:center; min-width:0; padding:6px 2px; border-bottom:1px solid var(--line); }
  .xl-ctl i { flex:0 0 12px; height:12px; border-radius:50%; }
  .xl-ctl .tx { flex:1; min-width:0; } .xl-ctl b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .xl-ctl small { color:var(--dim); overflow-wrap:anywhere; }
  .xl-warn { color:var(--amber); font-size:calc(13px * var(--fs, 1)); overflow-wrap:anywhere; margin:4px 0; }
  .xl-fpp { border:1px solid var(--amber); border-radius:0 12px 0 12px; padding:8px 10px; color:var(--text); font-size:calc(14px * var(--fs, 1)); overflow-wrap:anywhere; }
  .xl-fpp b { color:var(--amber); }
  .xl-live { font:calc(13px * var(--fs, 1)) var(--mono); color:var(--cyan); overflow-wrap:anywhere; }
  .xl-sum[hidden], .xl-help[hidden] { display:none; }
  /* 👀 Oct 21: watch the house on screen */
  .xl-watch { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
  .xl-watch .chip { min-height:48px; padding:0 14px; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .xl-watch .chip.on { background:var(--c); color:#000; }
  .xl-wnote { color:var(--dim); font-size:calc(13px * var(--fs, 1)); margin:4px 0 0; }
  .xl-help ol { margin:4px 0; padding-left:20px; line-height:1.5; color:var(--dim); font-size:calc(14px * var(--fs, 1)); }
  `);

  let S = null, ST = null, testing = false, busy = false;
  // 👀 Oct 21 (Graham: "download the house into GlowBop... see what that looks like inside the system"): play GlowBop's show, or the
  //   house's own finished xLights show (.fseq), on the house's dots. Screen only: GET /api/xl/watch (xlwatch.py).
  let W = {src: null, name: '', t0: 0, busy: false, raf: 0, list: null, last: 0};
  const COL = GB.DEVCOL || ['#ff3d9a', '#33d6ff', '#3ce08a', '#ffc04d', '#c58bff', '#ff7a3d'];

  GB.panel('house', 40, el => {                                    // 🏠 Oct 21: on the HOUSE page now (was LIGHTS)
    el.id = 'xlPanel'; el.classList.add('box'); el.style.setProperty('--c', 'var(--green)');
    el.innerHTML = `<div class="ph"><span>Import from xLights</span><span class="r" id="xlState"></span></div>
      <p class="note">Already run a holiday show with xLights? Point GlowBop at your show folder. It finds your props and controllers and plays its music show on your house, through the controllers you already own.</p>
      <label class="field">Show folder on the laptop
        <div class="xl-row"><input type="text" id="xlPath" placeholder="e.g. C:\\Users\\you\\Documents\\xLights" autocapitalize="off" spellcheck="false" aria-label="xLights show folder"><button class="btn c" id="xlScan" style="--c:var(--green)">${GB.svg('search')}<span>Scan</span></button></div>
      </label>
      <div class="chips" id="xlSug"></div>
      <div class="xl-3"><button class="btn" id="xlBrowse" hidden>${GB.svg('lists')}<span>Browse</span></button><button class="btn" id="xlZip">${GB.svg('add')}<span>Zip</span></button><button class="btn" id="xlPick">${GB.svg('lists')}<span>Folder</span></button></div>
      <input type="file" id="xlZipF" accept=".zip,application/zip" hidden><input type="file" id="xlDirF" webkitdirectory multiple hidden>
      <div class="xl-sum" id="xlSum" hidden>
        <div class="reads" id="xlReads"></div>
        <canvas class="xl-prev" id="xlPrev" width="1000" height="500" aria-label="Your house from xLights, as dots"></canvas>
        <div class="sub">Watch on screen</div>
        <div class="xl-watch" id="xlWatch"></div>
        <p class="xl-wnote" id="xlWNote">Only on this screen: nothing is sent to any light, and your own lights and layout stay as they are.</p>
        <div id="xlWarn"></div>
        <div id="xlFpp"></div>
        <div class="sub">Controllers</div>
        <div id="xlCtl"></div>
        <div class="xl-3 xl-act"><button class="btn" id="xlTest">${GB.svg('eye')}<span>Test</span></button><button class="btn c" id="xlUse" style="--c:var(--green)">${GB.svg('check')}<span>Use this house</span></button><button class="btn" id="xlBack">${GB.svg('power')}<span>Hand back</span></button></div>
        <p class="note" id="xlTestNote"></p>
      </div>
      <div class="sub">Taking over safely</div>
      <div class="xl-2"><button class="btn" id="xlPrio">${GB.svg('bright')}<span>Priority 100</span></button><button class="btn" id="xlHelpB">${GB.svg('help')}<span>FPP steps</span></button></div>
      <div class="xl-help" id="xlHelp" hidden><ol>
        <li>Running Falcon Player (FPP)? Stop its playlist (FPP Status page: Stop Now) or turn off the scheduler. On FPP 4 and older, switch it to Bridge mode.</li>
        <li>Or keep FPP as is and tap Priority so GlowBop sends sACN at priority 150. Controllers that honour sACN priority (Falcon, most FPP boards) then show GlowBop.</li>
        <li>Turn off "Output to lights" in xLights while GlowBop plays.</li>
        <li>Done? Tap Hand back. GlowBop stops sending and tells the controllers it let go, so your own show comes straight back.</li></ol></div>
      <p class="xl-live" id="xlLive"></p>
      <button class="btn danger wide" id="xlRemove" hidden>${GB.svg('trash')}<span>Remove the xLights house from GlowBop</span></button>`;
    $('xlBrowse').hidden = !GB.local;
    $('xlPath').value = GB.store.get('xl_path', '');
    $('xlScan').onclick = () => scan({path: $('xlPath').value.trim()});
    $('xlPath').addEventListener('keydown', e => { if (e.key === 'Enter') $('xlScan').click(); });
    $('xlBrowse').onclick = async () => { const r = await GB.post('/api/xl/browse', {}); if (r && r.path) { $('xlPath').value = r.path; scan({path: r.path}); } };
    $('xlZip').onclick = () => $('xlZipF').click();
    $('xlPick').onclick = () => $('xlDirF').click();
    $('xlZipF').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) zipScan(f); };
    $('xlDirF').onchange = e => { const fs = [...e.target.files]; e.target.value = ''; dirScan(fs); };
    $('xlTest').onclick = test;
    $('xlUse').onclick = use;
    $('xlBack').onclick = handback;
    $('xlPrio').onclick = prio;
    $('xlHelpB').onclick = () => { const h = $('xlHelp'); h.hidden = !h.hidden; $('xlHelpB').classList.toggle('on', !h.hidden); };
    $('xlRemove').onclick = remove;
  });
  GB.on('ready', () => { status(); suggest(); });
  GB.on('page', id => { if (id === 'lights') status(); });
  setInterval(() => { if ($('xlPanel') && $('xlPanel').offsetParent) status(); }, 4000);

  async function suggest() {
    let r; try { r = await GB.get('/api/xl/suggest'); } catch (e) { return; }
    const box = $('xlSug'); if (!box) return;
    box.innerHTML = (r.folders || []).map(f => `<button class="chip" data-xlp="${esc(f)}">${esc(f.split(/[\\/]/).slice(-2).join('/'))}</button>`).join('');
    box.querySelectorAll('[data-xlp]').forEach(b => b.onclick = () => { $('xlPath').value = b.dataset.xlp; scan({path: b.dataset.xlp}); });
    if (!$('xlPath').value && (r.folders || []).length) $('xlPath').value = r.folders[0];
  }

  async function status() {
    try { ST = await GB.get('/api/xl/status'); } catch (e) { return; }
    const s = $('xlState'); if (!s) return;
    const lv = ST.live;
    s.textContent = ST.in_use ? (ST.handed_back ? 'HANDED BACK' : 'IN USE') : '';
    $('xlRemove').hidden = !ST.in_use;
    $('xlBack').innerHTML = ST.in_use && ST.handed_back ? `${GB.svg('play')}<span>Take over</span>` : `${GB.svg('power')}<span>Hand back</span>`;
    $('xlBack').classList.toggle('on', !!(ST.in_use && ST.handed_back));
    const pr = ST.house && ST.house.priority; $('xlPrio').querySelector('span').textContent = 'Priority ' + (pr || 100);
    $('xlPrio').classList.toggle('on', !!pr);
    $('xlLive').textContent = ST.in_use ? `${ST.controllers.length} controller(s), ${ST.pixels} pixels` + (lv ? ` · ${lv.fps} fps · ${Math.round(lv.pps)} packets/s · ${lv.mbps} Mbit/s · ${lv.send_ms} ms send` : ' · starting…') : '';
    if (ST.in_use && !S) $('xlSum').hidden = true;
    if (ST.scanned && !S && !busy) { busy = true; try { const r = await GB.get('/api/xl/scan'); if (r && r.summary) { S = r; paint(); } } catch (e) {} busy = false; }
  }

  async function scan(body) {
    if (body.path !== undefined) { if (!body.path) return GB.toast('Type the folder your xLights show is in'); GB.store.set('xl_path', body.path); }
    GB.toast('🎄 Reading your xLights show…');
    const r = await GB.post('/api/xl/scan', body); if (!r) return;
    S = r; paint(); GB.sfx('ok');
    GB.toast(`🎄 Found ${r.summary.props} props, ${r.summary.pixels} pixels`);
  }
  function b64(buf) { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
  async function zipScan(f) {
    if (f.size > 200 * 1024 * 1024) return GB.toast('That zip is too big. Zip just xlights_networks.xml and xlights_rgbeffects.xml.');
    scan({zip: b64(await f.arrayBuffer())});
  }
  async function dirScan(fs) {
    const want = ['xlights_networks.xml', 'xlights_rgbeffects.xml'], files = {};
    for (const f of fs) { const n = f.name.toLowerCase(); if (want.includes(n) && f.webkitRelativePath.split('/').length <= 2) files[n] = await f.text(); }
    const shows = fs.filter(f => /\.fseq$/i.test(f.name) && !/\/backup\//i.test(f.webkitRelativePath) && f.size < 150 * 1024 * 1024).slice(0, 4);   // 👀 their finished shows, to watch
    for (const f of shows) files[f.name] = 'b64:' + b64(await f.arrayBuffer());
    fs.filter(f => /\.xsq$/i.test(f.name) && !/\/backup\//i.test(f.webkitRelativePath)).forEach(f => { files[f.name] = ''; });
    if (!files['xlights_rgbeffects.xml']) return GB.toast('No xlights_rgbeffects.xml in that folder. Pick your xLights show folder.');
    scan({files});
  }

  function paint() {
    const sm = S.summary, pv = S.preview; $('xlSum').hidden = false;
    $('xlReads').innerHTML = [['CONTROLLERS', sm.controllers], ['PROPS', sm.props], ['PIXELS', sm.pixels], ['ZONES', sm.zones]]
      .map(([k, v]) => `<div class="read"><span class="k">${k}</span><span class="v mono">${v}</span></div>`).join('');
    const w = [];
    if (sm.unsupported.length) w.push('Not placed (not light shapes): ' + sm.unsupported.join(', '));
    if (sm.approx.length) w.push('Drawn as a close match: ' + sm.approx.join(', '));
    if (sm.unresolved.length) w.push('Start channel not found for: ' + sm.unresolved.slice(0, 8).join(', ') + (sm.unresolved.length > 8 ? '…' : ''));
    if (sm.overlaps.length) w.push('Props sharing channels: ' + sm.overlaps.slice(0, 4).map(o => o.join(' + ')).join(', '));
    const off = sm.ctl.filter(c => !c.supported || !c.active); if (off.length) w.push('Skipped controllers: ' + off.map(c => `${c.name} (${c.active ? c.proto : 'inactive'})`).join(', '));
    $('xlWarn').innerHTML = w.map(t => `<p class="xl-warn">${esc(t)}</p>`).join('');
    $('xlFpp').innerHTML = (S.fpp || []).map(f => `<p class="xl-fpp"><b>FPP ${esc(f.name || f.ip)}</b> (${esc(f.mode)}, ${esc(f.status)}): ${esc(f.hint)}</p>`).join('');
    $('xlCtl').innerHTML = sm.ctl.map((c, i) => `<div class="xl-ctl"><i style="background:${COL[i % COL.length]}"></i><div class="tx"><b>${esc(c.name)}</b>
      <small>${esc(c.proto)} · ${esc(c.ip || 'no IP')}${c.universes ? ` · universes ${c.universes[0]}-${c.universes[1]}` : ''} · ${c.pixels} pixels${c.active ? '' : ' · inactive'}</small></div></div>`).join('');
    drawPrev(pv);
    watchList();
  }
  async function watchList() {
    watchStop(); let r = null; try { r = await GB.get('/api/xl/watch/list'); } catch (e) {}
    W.list = r; const box = $('xlWatch'); if (!box) return;
    const shows = (r && r.shows) || [];
    box.innerHTML = `<button class="chip" data-w="glowbop" style="--c:var(--pink)">${GB.svg('play')}<span>GlowBop's show</span></button>` +
      shows.map((s, i) => `<button class="chip" data-w="show" data-i="${i}" style="--c:var(--green)" ${s.error ? 'disabled' : ''}>${GB.svg('movie')}<span>Their show: ${esc(s.name)}${s.secs ? ' · ' + Math.round(s.secs) + ' s' : ''}</span></button>`).join('');
    box.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
      const src = b.dataset.w, name = src === 'show' ? shows[+b.dataset.i].name : '';
      if (W.src === src && W.name === name) { watchStop(); paintWatch(); return; }
      W.src = src; W.name = name; W.t0 = performance.now(); paintWatch(); GB.sfx && GB.sfx('tap'); watchLoop(); });
    const xo = (r && r.xsq_only) || [], err = shows.filter(s => s.error).map(s => s.error);
    $('xlWNote').textContent = 'Only on this screen: nothing is sent to any light, and your own lights and layout stay as they are.' +
      (xo.length ? ` ${xo.length} song${xo.length > 1 ? 's' : ''} came as xLights projects only (.xsq): render them in xLights to get a .fseq, then scan again.` : '') +
      (err.length ? ' ' + err[0] : '');
  }
  function paintWatch() { document.querySelectorAll('#xlWatch [data-w]').forEach(b => b.classList.toggle('on', b.dataset.w === W.src && (b.dataset.w !== 'show' || (W.list.shows[+b.dataset.i] || {}).name === W.name))); }
  function watchStop() { W.src = null; cancelAnimationFrame(W.raf); if (S) drawPrev(S.preview); }
  function watchLoop() {
    cancelAnimationFrame(W.raf);
    const step = async now => {
      if (!W.src) return;
      const cv = $('xlPrev'); if (!cv || !cv.offsetParent) { W.raf = requestAnimationFrame(step); return; }
      if (!W.busy && now - W.last > 66) { W.busy = true; W.last = now;
        try { const t = ((performance.now() - W.t0) / 1000).toFixed(2);
          const r = await GB.get('/api/xl/watch?src=' + W.src + '&t=' + t + (W.src === 'show' ? '&name=' + encodeURIComponent(W.name) : ''));
          if (r && r.rgb && W.src) drawPrev(S.preview, r.rgb); } catch (e) {}
        W.busy = false; }
      W.raf = requestAnimationFrame(step);
    };
    W.raf = requestAnimationFrame(step);
  }
  function drawPrev(pv, hex) {
    const cv = $('xlPrev'), W = pv.stage[0], H = pv.stage[1];
    cv.width = 1000; cv.height = Math.max(120, Math.round(1000 * H / W)); cv.style.setProperty('--xlh', cv.height);
    const cx = cv.getContext('2d'), k = 1000 / W; cx.fillStyle = '#06050c'; cx.fillRect(0, 0, cv.width, cv.height);
    const r = Math.max(1.2, Math.min(3.2, 1.6 * Math.sqrt(6000 / Math.max(1, S.summary.pixels))));
    let j = 0;
    pv.props.forEach(p => {
      if (!hex) cx.fillStyle = p.ctl >= 0 ? COL[p.ctl % COL.length] : '#666';
      p.pts.forEach(q => {
        if (hex) { const c = hex.substr(j * 6, 6); j++; cx.fillStyle = c && c !== '000000' ? '#' + c : '#1c1828'; }
        cx.beginPath(); cx.arc(q[0] * k, q[1] * k, r, 0, 6.2832); cx.fill(); });
    });
  }

  async function test() {
    if (testing) { await GB.post('/api/xl/test', {on: false}); testing = false; $('xlTest').classList.remove('on'); $('xlTestNote').textContent = ''; return; }
    const r = await GB.post('/api/xl/test', {on: true}); if (!r) return;
    testing = true; $('xlTest').classList.add('on');
    $('xlTestNote').textContent = `Testing ${r.steps || ''} props in channel order: each one's FIRST bulb blinks green, its LAST blinks red, then a white light runs along it. Tap Test again to stop.`;
    setTimeout(() => { if (testing) { testing = false; $('xlTest').classList.remove('on'); $('xlTestNote').textContent = ''; } }, Math.max(20, (r.seconds || 60) * 2) * 1000);
  }
  async function use() {
    const b = $('xlUse');
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.querySelector('span').textContent = 'Tap again'; setTimeout(() => { b.dataset.sure = ''; b.querySelector('span').textContent = 'Use this house'; }, 4000); return; }
    b.dataset.sure = ''; b.querySelector('span').textContent = 'Use this house';
    if (testing) await test();
    const r = await GB.post('/api/xl/use', {apply: true}); if (!r) return;
    GB.sfx('ok'); GB.toast(`🎄 Your house is in GlowBop: ${r.pixels} pixels, ${r.zones} zones. Restarting the lights…`);
    setTimeout(status, 9000);
  }
  async function handback() {
    if (ST && ST.in_use && ST.handed_back) { if (await GB.post('/api/xl/takeover', {})) { GB.toast('🎄 GlowBop is driving the house'); status(); } return; }
    if (testing) await test();
    if (await GB.post('/api/xl/handback', {})) { GB.toast('🎄 Handed back. Your own show takes over.'); status(); }
  }
  async function prio() {
    const on = !(ST && ST.house && ST.house.priority);
    const r = await GB.post('/api/xl/settings', {priority: on ? 150 : null}); if (!r) return;
    GB.toast(on ? 'sACN priority 150: GlowBop wins over a show sending at 100' : 'Normal priority (each controller\'s own)'); status();
  }
  async function remove() {
    const b = $('xlRemove');
    if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.querySelector('span').textContent = 'Tap again to remove'; setTimeout(() => { b.dataset.sure = ''; b.querySelector('span').textContent = 'Remove the xLights house from GlowBop'; }, 4000); return; }
    if (await GB.post('/api/xl/remove', {})) { GB.toast('Removed. Restarting the lights…'); S = null; $('xlSum').hidden = true; setTimeout(status, 9000); }
  }
})();
