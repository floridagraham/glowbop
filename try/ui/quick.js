/* ⚡ Quick keys in the header, on every page: Power on/off and a Brightness pop-over slider. */
(() => {
  const css = `
  #qk { display:flex; gap:6px; flex:0 0 auto; margin-left:auto; margin-right:6px; position:relative; }
  #qk .btn { min-height:40px; padding:0 12px; display:flex; align-items:center; gap:6px; }
  #qk .btn svg { width:16px; height:16px; }
  #qkPow.off { opacity:.55; filter:saturate(.3); }
  #qkPop { position:absolute; right:0; top:calc(100% + 8px); z-index:60; width:min(300px, 86vw); padding:14px 16px;
    background:var(--panel, #15121f); border:1px solid var(--line, #333); border-radius:16px; box-shadow:0 12px 40px #0009; display:none; }
  #qkPop.show { display:block; }
  #qkPop .row { display:flex; align-items:center; gap:10px; }
  #qkPop input[type=range] { flex:1; }
  #qkPop b { min-width:44px; text-align:right; font-variant-numeric:tabular-nums; }
  #qkPop .pre { display:flex; gap:6px; margin-top:10px; }
  #qkPop .pre button { flex:1; min-height:34px; }
  @media (max-width:430px) { #qk .btn span { display:none; } #qk .btn { padding:0 10px; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let dragging = false, t = null;
  function build() {
    const sfx = document.getElementById('sfx'); if (!sfx || document.getElementById('qk')) return;
    const box = document.createElement('div'); box.id = 'qk';
    box.innerHTML = `<button class="btn sm" id="qkPow" aria-label="Power" style="--c:var(--green)"></button>
      <button class="btn sm" id="qkBri" aria-label="Brightness" style="--c:var(--gold)"></button>
      <div id="qkPop" role="dialog" aria-label="Brightness">
        <div class="row">${GB.svg('bright')}<input type="range" id="qkRange" min="0" max="100" step="1"><b id="qkVal">–</b></div>
        <div class="pre"><button class="btn sm" data-b="25">25%</button><button class="btn sm" data-b="50">50%</button><button class="btn sm" data-b="75">75%</button><button class="btn sm" data-b="100">100%</button></div>
      </div>`;
    sfx.parentNode.insertBefore(box, sfx);
    const pow = box.querySelector('#qkPow'), bri = box.querySelector('#qkBri'), pop = box.querySelector('#qkPop'), rng = box.querySelector('#qkRange');
    pow.onclick = async () => { const on = (GB.status || {}).power === false; if (await GB.control({power: on})) GB.toast(on ? '💡 Lights on' : '🌙 Lights off'); };
    bri.onclick = e => { e.stopPropagation(); pop.classList.toggle('show'); };
    pop.onclick = e => e.stopPropagation();
    document.addEventListener('click', () => pop.classList.remove('show'));
    const send = v => { clearTimeout(t); t = setTimeout(() => GB.control({brightness: v}), 120); };
    rng.addEventListener('pointerdown', () => dragging = true);
    window.addEventListener('pointerup', () => dragging = false);
    rng.oninput = () => { box.querySelector('#qkVal').textContent = rng.value + '%'; send(+rng.value); };
    pop.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { rng.value = b.dataset.b; GB.paintRange && GB.paintRange(rng); rng.oninput(); });
    paint(GB.status || {});
  }
  function paint(s) {
    const pow = document.getElementById('qkPow'); if (!pow) return;
    const on = s.power !== false;
    pow.classList.toggle('off', !on); pow.classList.toggle('on', on);
    pow.innerHTML = GB.svg('power') + '<span>' + (on ? 'ON' : 'OFF') + '</span>';
    const b = s.brightness;
    document.getElementById('qkBri').innerHTML = GB.svg('bright') + '<span>' + (b != null ? b + '%' : '') + '</span>';
    const rng = document.getElementById('qkRange');
    if (rng && !dragging && b != null && document.activeElement !== rng) { rng.value = b; GB.paintRange && GB.paintRange(rng); document.getElementById('qkVal').textContent = b + '%'; }
  }
  const go = () => { build(); GB.on('status', paint); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
