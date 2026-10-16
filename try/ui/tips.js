/* ⓘ Tucked-away instructions (Oct 16, Graham: "get that real estate back").
   Every panel's little how-to paragraphs (<p class="note"> directly inside a .box) are hidden and moved behind a small
   ⓘ key in the panel's title bar. Tap it and the instructions pop up in a card; tap anywhere to close.
   Left alone on purpose: notes with an id (the app writes live status into those) unless listed in HOWTO, notes holding keys or inputs,
   and notes inside pop-up sheets. A MutationObserver catches panels drawn later. */
(function () {
  'use strict';
  GB.css(`
  .gb-tucked { display:none !important; }
  .gb-ibtn { flex:0 0 auto; width:calc(26px * var(--fs, 1)); height:calc(26px * var(--fs, 1)); border-radius:50%; border:1.5px solid currentColor; background:transparent; color:var(--c, var(--lav));
    font:italic 800 calc(14px * var(--fs, 1))/1 Georgia, 'Times New Roman', serif; display:inline-flex; align-items:center; justify-content:center; padding:0; margin-left:6px; cursor:pointer; opacity:.75; letter-spacing:0; text-transform:none; align-self:center; }
  .gb-ibtn:hover, .gb-ibtn:focus-visible { opacity:1; box-shadow:0 0 10px currentColor; }
  .gb-ibtn.abs { position:absolute; top:10px; right:12px; z-index:2; }
  .ph .gb-ihold { display:inline-flex; align-items:center; gap:8px; min-width:0; flex:0 0 auto; }
  .ph .gb-ihold > span { white-space:nowrap; }
  #gbTip { position:fixed; inset:0; z-index:950; display:flex; align-items:flex-end; justify-content:center; padding:16px 16px calc(16px + env(safe-area-inset-bottom)); background:#0008; opacity:0; pointer-events:none; transition:opacity .2s; }
  #gbTip.show { opacity:1; pointer-events:auto; }
  #gbTip .card { width:100%; max-width:520px; max-height:70vh; overflow:auto; background:var(--panel); border-left:10px solid var(--c, var(--lav)); border-radius:0 24px 0 24px; padding:16px 18px 18px; box-shadow:0 20px 70px #000c;
    transform:translateY(24px); transition:transform .25s cubic-bezier(.2,1.2,.4,1); }
  #gbTip.show .card { transform:none; }
  #gbTip h3 { margin:0 0 10px; font:800 calc(18px * var(--fs, 1)) var(--cond); letter-spacing:2px; text-transform:uppercase; color:var(--c, var(--lav)); display:flex; justify-content:space-between; gap:10px; }
  #gbTip h3 button { background:none; border:0; color:var(--dim); font:700 calc(18px * var(--fs, 1)) var(--body); cursor:pointer; }
  #gbTip p { margin:0 0 10px; color:var(--text, #eee); line-height:1.5; }
  @media (min-width:900px) { #gbTip { align-items:center; } }
  `);

  let pop = null;
  function open(box, btn) {
    if (!pop) {
      pop = document.createElement('div'); pop.id = 'gbTip'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true');
      pop.innerHTML = '<div class="card"><h3><span></span><button aria-label="Close">✕</button></h3><div class="tx"></div></div>';
      document.body.appendChild(pop);
      pop.addEventListener('click', e => { if (!e.target.closest('.card') || e.target.closest('h3 button')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    const ph = box.querySelector('.ph'), tn = ph && (ph.querySelector('.gb-ihold > span') || ph.querySelector('span:not(.r)')), title = tn ? tn.textContent.trim() : 'How it works';
    pop.style.setProperty('--c', getComputedStyle(box).getPropertyValue('--c') || 'var(--lav)');
    pop.querySelector('h3 span').textContent = '💡 ' + (title || 'How it works');
    const tx = pop.querySelector('.tx'); tx.innerHTML = '';
    box.querySelectorAll(':scope > p.gb-tucked').forEach(n => { const c = n.cloneNode(true); c.classList.remove('gb-tucked', 'note'); c.removeAttribute('style'); tx.appendChild(c); });
    pop.classList.add('show'); pop._btn = btn;
    GB.sfx && GB.sfx('tap');
  }
  function close() { if (pop && pop.classList.contains('show')) { pop.classList.remove('show'); if (pop._btn) try { pop._btn.focus({preventScroll: true}); } catch (_) {} } }

  // these have an id because the app swaps their wording, but they're still how-to text, so they get tucked too (the pop-up copies the current wording)
  const HOWTO = new Set(['djSnapNote', 'mdWallNote', 'mdLgMdNote', 'ssRecNote', 'alNote', 'lpNote', 'ovNote', 'sfxNote', 'wfCredit']);
  const ok = n => (!n.id || HOWTO.has(n.id)) && !n.dataset.keep && !n.querySelector('button, input, select, textarea, label') && !n.closest('.sheet, #gbTip, #offScr, dialog, .gb-notuck')
    && n.textContent.trim().length > 0 && n.parentElement && n.parentElement.classList.contains('box');
  function tuck(root) {
    (root || document).querySelectorAll('.box > p.note:not([data-tk])').forEach(n => {
      n.dataset.tk = '1'; if (!ok(n)) return;
      n.classList.add('gb-tucked');
      const box = n.parentElement; if (box.querySelector(':scope > .gb-ibtn, :scope > .ph .gb-ibtn')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'gb-ibtn'; b.textContent = 'i'; b.title = 'How it works'; b.setAttribute('aria-label', 'How it works');
      b.addEventListener('click', e => { e.stopPropagation(); open(box, b); });
      const ph = box.querySelector(':scope > .ph');
      if (ph) { const first = ph.firstElementChild;
        if (first && first.tagName === 'SPAN' && !first.classList.contains('r')) { const w = document.createElement('span'); w.className = 'gb-ihold'; ph.insertBefore(w, first); w.appendChild(first); w.appendChild(b); }
        else ph.appendChild(b); }
      else { if (getComputedStyle(box).position === 'static') box.style.position = 'relative'; b.classList.add('abs'); box.insertBefore(b, box.firstChild); }
    });
  }
  GB.tuckNotes = tuck;
  let q = 0;
  const kick = () => { if (q) return; q = setTimeout(() => { q = 0; tuck(); }, 120); };
  new MutationObserver(kick).observe(document.documentElement, {childList: true, subtree: true});
  kick();
})();
