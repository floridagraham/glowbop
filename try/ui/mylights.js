/* ✨ Your lights on this stage / yard (Oct 21, Graham: "import a template and then just assign lights to it right now. So it'll just
   work."). One card, used by STAGE and HOUSE → Yard plan:
     PUT MY LIGHTS HERE: GlowBop matches each of your lights to a spot by kind (curtains on the backdrop / front of the house, strings
       on truss / roofline, Nanoleaf on the star or DJ booth, single bulbs on spots) and moves them on the map, so the show plays
       across them where they really are. Each light then has a picker to swap its spot.
     Saved layouts: your own layout is kept as "My layout"; each template you use is kept too. One tap switches.
   Engine: GET/POST /api/stage/mylights, POST /api/stage/layouts (mylights.py). GB.emit('mylights', {where, assign}) after a change. */
(function () {
  'use strict';
  const {$} = GB, esc = GB.esc;
  GB.css(`
  .ml-card { border:2px solid var(--cyan); border-radius:0 16px 0 16px; padding:10px 12px; background:#071a22; margin:0 0 10px; }
  .ml-hd { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .ml-hd b { font:800 15px var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--cyan); flex:1; min-width:180px; }
  .ml-go { min-height:64px !important; padding:0 20px !important; font:800 17px var(--cond) !important; letter-spacing:1px; background:var(--cyan) !important; color:#000 !important; border-color:var(--cyan) !important; }
  .ml-rows { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:6px 10px; margin-top:8px; }
  .ml-rows label { display:flex; flex-direction:column; gap:3px; font:700 12px var(--cond); letter-spacing:1px; text-transform:uppercase; color:#bfeaff; }
  .ml-rows select { min-height:48px; background:#0c2530; color:#fff; border:1px solid #33d6ff66; border-radius:8px; padding:0 10px; font:600 15px var(--sans, sans-serif); }
  .ml-saved { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-top:8px; }
  .ml-saved > span { font:800 12px var(--cond); letter-spacing:1px; text-transform:uppercase; color:#bfeaff; margin-right:4px; }
  .ml-saved .btn { min-height:48px; }
  .ml-saved .btn.on { background:var(--cyan); color:#000; border-color:var(--cyan); }
  .ml-note { color:#bfeaff; font-size:13px; margin:6px 0 0; }
  `);
  const CLS = {curtain: 'curtain', line: 'string', panel: 'panels', bulb: 'bulb'};
  // 👀 your real lights' bulbs on the plan, in the colours they show right now: GB.myLive(where) -> latest {on, lights:[{x, z, c}]}
  const LV = {stage: null, yard: null}, busy = {};
  GB.myLive = where => LV[where];
  GB.myLiveSvg = (where, r) => { const L = LV[where]; if (!L || !L.on) return ''; let s = ''; r = L.r || r;
    for (const l of L.lights) { const c = l.c; for (let i = 0; i < l.x.length; i++) { const h = c.substr(i * 6, 6); if (h === '000000') continue; s += `<circle cx="${l.x[i]}" cy="${l.z[i]}" r="${r}" fill="#${h}"/>`; } }
    return `<g pointer-events="none">${s}</g>`; };
  GB.myLivePoll = async where => { if (busy[where]) return; busy[where] = true; try { LV[where] = await GB.get('/api/stage/mylive?where=' + where); } catch (e) {} busy[where] = false; return LV[where]; };
  GB.myLights = function (el, where) {
    let S = null;
    async function load() { try { S = await GB.get('/api/stage/mylights?where=' + where); paint(); } catch (e) {} }
    function paint() {
      if (!S) return; const any = Object.keys(S.assign || {}).length, here = where === 'yard' ? 'yard' : 'stage';
      el.innerHTML = `<div class="ml-card"><div class="ml-hd"><b>Your lights on this ${here}</b>
          <button class="btn ml-go" data-go>${any ? 'Match my lights again' : 'Put my lights here'}</button></div>
        ${any ? `<div class="ml-rows">${S.lights.map(l => `<label>${esc(l.name)} · ${CLS[l.cls] || ''}<select data-l="${esc(l.id)}"><option value="">Not on this ${here}</option>${S.spots.map(s => `<option value="${esc(s.id)}"${S.assign[l.id] === s.id ? ' selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>`).join('')}</div>`
          : `<p class="ml-note">One tap: curtains go on the ${where === 'yard' ? 'front of the house' : 'backdrop'}, strings on the ${where === 'yard' ? 'roofline' : 'truss'}, and so on. Swap any of them after.</p>`}
        <div class="ml-saved"><span>Layouts</span>${S.saved.map(x => `<button class="btn${x.name === S.current ? ' on' : ''}" data-u="${esc(x.id)}">${esc(x.name)}</button>`).join('') || '<span style="color:var(--dim);text-transform:none;letter-spacing:0;font-weight:500">Your own layout is kept as "My layout" the first time.</span>'}</div></div>`;
      el.querySelector('[data-go]').onclick = () => send({auto: true});
      el.querySelectorAll('[data-l]').forEach(sel => sel.onchange = () => { const a = Object.assign({}, S.assign); if (sel.value) a[sel.dataset.l] = sel.value; else delete a[sel.dataset.l]; send({assign: a}); });
      el.querySelectorAll('[data-u]').forEach(b => b.onclick = async () => { const r = await GB.post('/api/stage/layouts', {use: b.dataset.u}); if (r && r.ok) { GB.toast(r.msg + '. The lights restart for a moment.'); setTimeout(load, 600); } else if (r) GB.toast(r.error || 'Could not switch'); });
    }
    async function send(b) {
      GB.sfx && GB.sfx('tap');
      const r = await GB.post('/api/stage/mylights', Object.assign({where, apply: true}, b));
      if (!r || !r.ok) return GB.toast((r && r.error) || 'Could not put your lights here');
      GB.toast(r.msg + ' The lights restart for a moment.'); GB.emit('mylights', {where, assign: r.assign}); load();
    }
    load();
    return {reload: load, get state() { return S; }};
  };
})();
