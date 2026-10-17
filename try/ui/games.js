/* 🕹️ GAMES page: the self-playing arcade games, pulled out of the looks into their own rail key.
   Tap a game = it plays on the wall (locked, speeding up with the music). Arcade marathon = the Retro Arcade look
   pinned, so GlowBop rotates through the games. ♫ Back to music (under the wall) ends it. */
(function () {
  'use strict';
  const GAMES = [
    ['Breakout', '🧱', 'Breakout', 'The ball smashes bricks into sparks.', 'var(--orange)'],
    ['SnakeGame', '🐍', 'Snake', 'A rainbow snake hunts glowing food.', 'var(--green)'],
    ['PongBattle', '🏓', 'Pong', 'Paddles rally, the ball smashes on the beat.', 'var(--cyan)'],
    ['AlienParade', '👾', 'Alien parade', 'Space invaders march to the beat.', 'var(--lav)'],
    ['VectorRocks', '☄️', 'Space rocks', 'Vector asteroids break apart.', 'var(--amber)'],
    ['TetrisDrop', '🟦', 'Block drop', 'Blocks fall, stack and clear lines.', 'var(--peri)'],
    ['LightCycles', '🏍️', 'Light cycles', 'Neon bikes race and leave trails.', 'var(--pink)'],
    ['GameOfLife', '🧬', 'Game of life', 'Cells are born, grow and die.', 'var(--gold)'],
  ];
  GB.GAME_NAMES = GAMES.map(g => g[0]);
  GB.css(`
  .gm-tiles { grid-template-columns:repeat(2, minmax(0, 1fr)); }
  .gm-tiles .tile { min-height:104px; align-items:flex-start; justify-content:flex-end; text-align:left; padding:12px; }
  .gm-tiles .tile .em { font-size:calc(34px * var(--fs, 1)); }
  .gm-tiles .tile small { display:block; font:400 calc(12.5px * var(--fs, 1))/1.3 var(--body); letter-spacing:0; text-transform:none; opacity:.8; }
  @media (min-width: 700px) { .gm-tiles { grid-template-columns:repeat(4, minmax(0, 1fr)); } }
  `);
  GB.panel('games', 10, el => {
    el.classList.add('box'); el.style.setProperty('--c', 'var(--lime)');
    el.innerHTML = `<div class="ph"><span>Arcade</span><span class="r" id="gmNow">PICK A GAME</span></div>
      <p class="note">Self-playing pixel games. They play themselves and speed up with the music. Tap one to put it on the wall, tap it again to turn it off.</p>
      <div class="tiles gm-tiles" id="gmTiles"></div>
      <button class="btn c lg wide" id="gmAll" style="--c:var(--lime)">${GB.svg('game')}<span>Arcade marathon: every game, in turn</span></button>
      <p class="note">Tap the glowing game again (or <b>♫ Back to music</b> under the wall) to stop.</p>`;
    GAMES.forEach(([fx, em, name, desc, c]) => {
      const b = document.createElement('button'); b.className = 'tile'; b.dataset.fx = fx; b.style.setProperty('--c', c);
      b.innerHTML = `<span class="em">${GB.funIcon(fx) || em}</span>${name}<small>${desc}</small>`;
      b.onclick = async () => {
        if (b.classList.contains('on')) {                              // second tap: game off, back to the music show
          b.classList.remove('on');
          if (await GB.control({release: true, lock_effect: null})) { GB.sfx('off'); GB.toast(em + ' ' + name + ' off, back to the music'); }
          return;
        }
        if (await GB.control({lock_effect: fx})) { b.classList.add('on'); GB.sfx('on'); GB.toast(em + ' ' + name + ' on the wall (tap again to stop)'); }
      };
      el.querySelector('#gmTiles').appendChild(b);
    });
    el.querySelector('#gmAll').onclick = async () => {
      const all = el.querySelector('#gmAll');
      if (all.classList.contains('on')) {                              // second tap: marathon off
        all.classList.remove('on');
        if (await GB.control({release: true, lock_effect: null})) { GB.sfx('off'); GB.toast('🕹️ Arcade marathon off, back to the music'); }
        return;
      }
      await GB.control({lock_effect: null});
      if (await GB.control({look: 'Retro Arcade', pin: true})) { GB.sfx('on'); GB.toast('🕹️ Arcade marathon'); }
    };
  });
  GB.on('status', s => {
    const now = s.locked && GAMES.find(g => g[0] === s.locked);
    document.querySelectorAll('#gmTiles .tile').forEach(b => b.classList.toggle('on', !!now && b.dataset.fx === now[0]));
    const all = document.getElementById('gmAll'); if (all) all.classList.toggle('on', !now && s.held_look === 'Retro Arcade');
    const r = document.getElementById('gmNow'); if (r) r.textContent = now ? 'ON THE WALL: ' + now[2].toUpperCase() : s.held_look === 'Retro Arcade' ? 'ARCADE MARATHON' : 'PICK A GAME';
  });
})();
