/* 💬 POP-UP MESSAGES IN THE MIDDLE (Oct 19, Graham: "the warnings that come up, the 'hey, we're doing this right now' things, are always
   at the bottom and not in the look and style now. Can we have them in the middle, in the style and look we're doing, maybe animated").
   Every GB.toast now pops into the middle of the screen as a gradient key card (the same look as the buttons: its colour deepening toward
   the corner, its icon big and soft behind the words). Green = done, amber = heads-up, pink = a problem, cyan = news. A quick bounce in,
   about 3 seconds (longer messages stay longer), then it fades away; tap it to close it sooner. Several at once stack neatly (3 at most).
   No pulsing. */
(function () {
  'use strict';
  GB.css(`
  #tstack { position:fixed; left:50%; top:50%; transform:translate(-50%, -50%); z-index:9990; display:flex; flex-direction:column; align-items:center; gap:10px;
    width:min(560px, calc(100vw - 32px)); pointer-events:none; }
  .tcard { position:relative; overflow:hidden; isolation:isolate; pointer-events:auto; cursor:pointer; width:100%; box-sizing:border-box;
    padding:18px 70px 18px 22px; border-radius:20px; color:#000; font:800 calc(18px * var(--fs, 1))/1.25 var(--cond); letter-spacing:.4px;
    background:linear-gradient(135deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.34)), var(--k); background-repeat:no-repeat;
    box-shadow:0 0 0 2px color-mix(in srgb, var(--k) 60%, #fff), 0 0 34px -4px var(--k), 0 18px 50px #000c;
    animation:tIn .42s cubic-bezier(.2, 1.4, .4, 1) both; }
  .tcard > .ic.tw { position:absolute; right:-6px; top:50%; width:86px; height:86px; transform:translateY(-50%) rotate(-8deg); fill:#fff; color:#fff; opacity:.32; z-index:-1; pointer-events:none; }
  .tcard.out { animation:tOut .32s ease-in both; }
  .tcard.ok { --k:#3ce08a; } .tcard.warn { --k:#ffc23d; } .tcard.bad { --k:#ff4d8a; } .tcard.info { --k:#33d6ff; }
  @keyframes tIn { from { opacity:0; transform:scale(.82) translateY(14px); } 70% { opacity:1; transform:scale(1.03); } to { opacity:1; transform:none; } }
  @keyframes tOut { to { opacity:0; transform:scale(.94) translateY(-8px); } }
  @media (prefers-reduced-motion: reduce) { .tcard, .tcard.out { animation-duration:.01s; } }
  #toast { display:none !important; }
  `);
  const OK = /^(✅|✔|💾|🎉|👍|🔗|🧲|↶|↷|🎛|🔀|⇋|🐇|✨|📌|🎨|🖥)/u, WARN = /^(⚠|❗|🐢|🔌|📶|🔔|🧪|⏳|🔄|💤|🚧)/u, BAD = /^(❌|🔒|🚫|⛔|🛑)/u;
  const LEAD = /^\s*(\p{Extended_Pictographic}|[←-⇿⌀-➿⬀-⯿])(️|‍\p{Extended_Pictographic}️?)*\s*/u;
  let stack = null;
  function box() { if (!stack || !stack.isConnected) { stack = document.createElement('div'); stack.id = 'tstack'; stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite'); document.body.appendChild(stack); } return stack; }
  function close(c) { if (!c || c.classList.contains('out')) return; clearTimeout(c._t); c.classList.add('out'); setTimeout(() => c.remove(), 330); }
  GB.toast = (m, ms) => {
    const s = String(m == null ? '' : m); if (!s.trim()) return;
    const lm = s.match(LEAD), emo = lm ? lm[0].trim() : '', text = lm ? s.slice(lm[0].length) : s;
    const tone = BAD.test(emo) || /not connected|error|failed|couldn.t/i.test(text) ? 'bad' : OK.test(emo) ? 'ok' : WARN.test(emo) ? 'warn' : 'info';
    const icon = emo && GB.EMO ? String(GB.EMO[emo.replace(/️/g, '')] || GB.EMO[emo] || '').split(' ')[0] : '';
    const st = box(), dup = [...st.children].find(c => c.dataset.m === s && !c.classList.contains('out'));
    if (dup) { clearTimeout(dup._t); dup._t = setTimeout(() => close(dup), ms || Math.max(2600, Math.min(9000, s.length * 55))); return; }   // the same message again: keep the one showing
    const c = document.createElement('div'); c.className = 'tcard ' + tone; c.dataset.m = s;
    c.innerHTML = (icon || tone !== 'info' ? GB.svg(icon || (tone === 'ok' ? 'check' : tone === 'warn' ? 'warn' : tone === 'bad' ? 'close' : 'sparkle')).replace('class="ic"', 'class="ic tw"') : '') + '<span></span>';
    c.querySelector('span').textContent = text;
    c.onclick = () => close(c);
    st.appendChild(c);
    const live = [...st.children].filter(x => !x.classList.contains('out')); if (live.length > 3) live.slice(0, live.length - 3).forEach(close);
    c._t = setTimeout(() => close(c), ms || Math.max(2600, Math.min(9000, s.length * 55)));
  };
})();
