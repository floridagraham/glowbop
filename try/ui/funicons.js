/* 🎨 Fun icons (Oct 17, Graham: "redo the holiday and games icons so they look like the rest of our style, these are just emojis").
   Hand-drawn neon SVGs in each holiday's / game's own colours, on a 48 x 48 grid. GB.funIcon(key) returns the <svg>, or '' if there's none
   (the caller then falls back to the emoji). No outside art: every shape here is drawn from scratch. */
(function () {
  'use strict';
  const K = '#120a1f';                                   // the dark "ink" (eyes, mouths, outlines)
  const px = (rows, cols, s, ox, oy) => rows.map((r, y) => [...r].map((ch, x) => cols[ch] ? `<rect x="${ox + x * s}" y="${oy + y * s}" width="${s - .6}" height="${s - .6}" rx=".8" fill="${cols[ch]}"/>` : '').join('')).join('');
  const star = (cx, cy, R, r, fill, n) => { n = n || 5; let p = ''; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; p += (i ? 'L' : 'M') + (cx + q * Math.cos(a)).toFixed(2) + ' ' + (cy + q * Math.sin(a)).toFixed(2); } return `<path d="${p}Z" fill="${fill}"/>`; };
  const burst = (cx, cy, n, r0, r1, cols, w) => { let s = ''; for (let i = 0; i < n; i++) { const a = i * 2 * Math.PI / n, c = cols[i % cols.length];
      s += `<line x1="${(cx + r0 * Math.cos(a)).toFixed(2)}" y1="${(cy + r0 * Math.sin(a)).toFixed(2)}" x2="${(cx + r1 * Math.cos(a)).toFixed(2)}" y2="${(cy + r1 * Math.sin(a)).toFixed(2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><circle cx="${(cx + (r1 + 2.2) * Math.cos(a)).toFixed(2)}" cy="${(cy + (r1 + 2.2) * Math.sin(a)).toFixed(2)}" r="1.4" fill="${c}"/>`; } return s; };
  const petals = (cx, cy, n, rx, ry, d, fill, rot) => { let s = ''; for (let i = 0; i < n; i++) s += `<ellipse cx="${cx}" cy="${cy - d}" rx="${rx}" ry="${ry}" fill="${fill}" transform="rotate(${(rot || 0) + i * 360 / n} ${cx} ${cy})"/>`; return s; };
  const heart = (cx, cy, s, fill, rot) => `<path transform="translate(${cx} ${cy}) rotate(${rot || 0}) scale(${s})" d="M0 6C-7-1-10-5-7-8.5-4.8-11-1.5-10 0-7.5 1.5-10 4.8-11 7-8.5 10-5 7-1 0 6Z" fill="${fill}"/>`;

  const I = {
    // ---------------------------------------------------------------- holidays
    christmas: `<path d="M24 5 34 19H29L37 30H31L40 41H8L17 30H11L19 19H14Z" fill="#14c94a"/><path d="M24 5 34 19H29L37 30H31L40 41H24Z" fill="#0ea33c"/>
      <rect x="21" y="41" width="6" height="5" rx="1" fill="#a8622a"/>${star(24, 5.5, 5, 2.2, '#ffcc33')}
      <circle cx="20" cy="22" r="2" fill="#ff2a4d"/><circle cx="28" cy="26" r="2" fill="#fff"/><circle cx="17" cy="34" r="2.2" fill="#ffcc33"/><circle cx="31" cy="36" r="2.2" fill="#ff2a4d"/><circle cx="24" cy="31" r="1.8" fill="#33d6ff"/>`,
    halloween: `<path d="M24 11c2-4 6-6 8-5-3 1-5 3-6 6z" fill="#2bd96b"/><ellipse cx="15" cy="29" rx="10" ry="13" fill="#ff7a00"/><ellipse cx="33" cy="29" rx="10" ry="13" fill="#ff7a00"/><ellipse cx="24" cy="29" rx="9" ry="14" fill="#ff9420"/>
      <path d="M14 24l5-4 2 6zM34 24l-5-4-2 6z" fill="${K}"/><path d="M13 32q11 9 22 0l-3 1-2 3-2-2-2 3-2-3-2 3-2-3-2 2-2-3z" fill="${K}"/>`,
    july4: `${burst(24, 22, 12, 4, 15, ['#ff2a4d', '#ffffff', '#3d6bff'], 2.6)}${star(24, 22, 4.5, 2, '#fff')}<path d="M24 38v8" stroke="#ffcc33" stroke-width="2" stroke-linecap="round" stroke-dasharray="1.5 2.5"/>`,
    valentine: `<path d="M6 40 40 8" stroke="#ffcc33" stroke-width="2.6" stroke-linecap="round"/><path d="M40 8l-7 1 6 6z" fill="#ffcc33"/><path d="M6 40l1-6 2 2 2 2z" fill="#ffd9e6"/>
      ${heart(24, 25, 2.1, '#ff1a59')}${heart(21.5, 22, .7, '#ff8ab8')}`,
    newyear: `<g transform="rotate(-14 16 26)"><path d="M10 8h12l-1 11a5 5 0 01-10 0z" fill="#ffcc40"/><path d="M10.3 12h11.4" stroke="#fff6" stroke-width="1.4"/><rect x="15.2" y="23" width="1.6" height="13" fill="#d9e0ff"/><rect x="11" y="36" width="10" height="2.2" rx="1.1" fill="#d9e0ff"/></g>
      <g transform="rotate(14 32 26)"><path d="M26 8h12l-1 11a5 5 0 01-10 0z" fill="#ffcc40"/><path d="M26.3 12h11.4" stroke="#fff6" stroke-width="1.4"/><rect x="31.2" y="23" width="1.6" height="13" fill="#d9e0ff"/><rect x="27" y="36" width="10" height="2.2" rx="1.1" fill="#d9e0ff"/></g>
      ${star(24, 4.5, 3.6, 1.3, '#fff')}<circle cx="18" cy="13" r="1" fill="#fff"/><circle cx="31" cy="11" r="1.1" fill="#fff"/><circle cx="35" cy="5" r="1.2" fill="#9b8cff"/><circle cx="12" cy="4" r="1.2" fill="#33d6ff"/>`,
    thanksgiving: `${['#ff2a1a', '#ff8a1a', '#ffcc33', '#ff8a1a', '#ff2a1a', '#ffcc33', '#a83a14'].map((c, i) => `<ellipse cx="24" cy="12" rx="4.6" ry="12" fill="${c}" transform="rotate(${-72 + i * 24} 24 26)"/>`).join('')}
      <ellipse cx="24" cy="32" rx="9" ry="10" fill="#8a4a1e"/><circle cx="24" cy="20" r="6" fill="#a85a26"/><circle cx="22" cy="19" r="1.3" fill="${K}"/><circle cx="26" cy="19" r="1.3" fill="${K}"/>
      <path d="M22.6 21.5h2.8L24 24z" fill="#ffcc33"/><path d="M25 22c1 1 1 3 0 4" stroke="#ff2a4d" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M20 42v3m-2 0h4M28 42v3m-2 0h4" stroke="#ffcc33" stroke-width="1.6" stroke-linecap="round"/>`,
    stpatricks: `${[0, 90, 180, 270].map(r => `<path transform="rotate(${r} 24 21) translate(24 12.6) scale(1.25)" d="M0 6C-7-1-10-5-7-8.5-4.8-11-1.5-10 0-7.5 1.5-10 4.8-11 7-8.5 10-5 7-1 0 6Z" fill="${r % 180 ? '#22c64a' : '#3df06a'}"/>`).join('')}
      <circle cx="24" cy="21" r="2.4" fill="#ffcc33"/><path d="M24 23q2 12 9 21" stroke="#22c64a" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    birthday: `<rect x="8" y="24" width="32" height="17" rx="3" fill="#ff3d9a"/><path d="M8 28q4 5 8 0t8 0 8 0 8 0v-1H8z" fill="#ffe1f0"/><rect x="5" y="40" width="38" height="4" rx="2" fill="#33d6ff"/>
      <circle cx="14" cy="34" r="1.5" fill="#ffcc33"/><circle cx="24" cy="36" r="1.5" fill="#66ff7a"/><circle cx="34" cy="34" r="1.5" fill="#9b3dff"/>
      ${[[15, '#33d6ff'], [24, '#ffcc33'], [33, '#66ff7a']].map(([x, c]) => `<rect x="${x - 1.3}" y="14" width="2.6" height="10" rx="1" fill="${c}"/><path d="M${x} 6c3 3 2 6 0 7-2-1-3-4 0-7z" fill="#ff8a1a"/><path d="M${x} 9c1.2 1.5.8 3 0 3.4-.8-.4-1.2-1.9 0-3.4z" fill="#fff4b0"/>`).join('')}`,
    gameday: `<g transform="rotate(-35 24 24)"><ellipse cx="24" cy="24" rx="19" ry="11.5" fill="#a3501c"/><path d="M8 24a16 11.5 0 0 1 5-8M40 24a16 11.5 0 0 1-5 8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M15 24h18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>${[17.5, 21, 24.5, 28, 31.5].map(x => `<path d="M${x} 21v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`).join('')}</g>`,
    lunarnewyear: `<path d="M24 2v5" stroke="#ffcc33" stroke-width="1.8"/><rect x="16" y="6" width="16" height="4" rx="1.5" fill="#ffcc33"/><ellipse cx="24" cy="23" rx="15" ry="13" fill="#ff1a1a"/>
      <path d="M24 10c-5 4-6 22 0 26M24 10c5 4 6 22 0 26M14 13c-4 6-4 14 0 20M34 13c4 6 4 14 0 20" stroke="#ff8a1a" stroke-width="1.4" fill="none"/>
      <rect x="16" y="35" width="16" height="4" rx="1.5" fill="#ffcc33"/><path d="M24 39v7M21 40v5M27 40v5" stroke="#ffcc33" stroke-width="1.6" stroke-linecap="round"/><circle cx="24" cy="23" r="4" fill="#ffcc33"/><circle cx="24" cy="23" r="1.6" fill="#ff1a1a"/>`,
    diwali: `<path d="M24 6c6 7 5 13 0 15-5-2-6-8 0-15z" fill="#ff8a1a"/><path d="M24 11c3 4 2.6 7.5 0 8.5-2.6-1-3-4.5 0-8.5z" fill="#fff1a0"/>
      <path d="M6 26h36c-1 9-9 14-18 14S7 35 6 26z" fill="#ff1a8c"/><path d="M6 26h36" stroke="#ffcc33" stroke-width="3" stroke-linecap="round"/><path d="M12 33q12 6 24 0" stroke="#1ad1b8" stroke-width="2" fill="none"/>
      <rect x="18" y="40" width="12" height="4" rx="2" fill="#ffcc33"/><circle cx="17" cy="30" r="1.4" fill="#ffcc33"/><circle cx="24" cy="31" r="1.4" fill="#ffcc33"/><circle cx="31" cy="30" r="1.4" fill="#ffcc33"/>`,
    eid: `<path d="M27 5a19 19 0 1 0 14 31A15 15 0 0 1 27 5z" fill="#ffcc4d"/>${star(34, 17, 6, 2.5, '#00b3a6')}${star(40, 6, 2.6, 1, '#fff')}${star(12, 42, 2.2, .9, '#fff')}`,
    hanukkah: `<path d="M8 22v6a16 12 0 0 0 32 0v-6M14 22v6a10 8 0 0 0 20 0v-6M19 22v6a5 4 0 0 0 10 0v-6M24 20v24M17 44h14" stroke="#3d78ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${[8, 14, 19, 29, 34, 40].map(x => `<rect x="${x - 1.4}" y="15" width="2.8" height="7" rx="1" fill="#cfe0ff"/><path d="M${x} 9c2 2 1.6 4.4 0 5-1.6-.6-2-3 0-5z" fill="#ffcc4d"/>`).join('')}
      <rect x="22.4" y="11" width="3.2" height="9" rx="1" fill="#fff"/><path d="M24 4c2.4 2.4 2 5.2 0 6-2-.8-2.4-3.6 0-6z" fill="#ffcc4d"/>`,
    holi: `<circle cx="17" cy="18" r="11" fill="#ff1a99"/><circle cx="31" cy="20" r="10" fill="#ffd60a" opacity=".92"/><circle cx="22" cy="31" r="10.5" fill="#1a66ff" opacity=".9"/><circle cx="33" cy="33" r="7" fill="#1ae64d" opacity=".9"/>
      <circle cx="7" cy="34" r="2.4" fill="#ff7a00"/><circle cx="41" cy="9" r="2.2" fill="#1a66ff"/><circle cx="9" cy="7" r="1.8" fill="#ffd60a"/><circle cx="42" cy="42" r="1.6" fill="#ff1a99"/><circle cx="12" cy="44" r="1.4" fill="#1ae64d"/>`,
    dayofthedead: `${petals(24, 24, 12, 4, 9, 11, '#ff7a00')}${petals(24, 24, 12, 3.2, 6.5, 7, '#ffb31a', 15)}${petals(24, 24, 8, 2.4, 4, 4, '#ffd60a', 0)}<circle cx="24" cy="24" r="3.6" fill="#ff1a99"/><circle cx="24" cy="24" r="1.5" fill="#8c1aff"/>`,
    canadaday: `<path d="M24 3l3.2 6.3 3.4-1.8-1.3 9.6 6.3-6.7 1.2 3.4 6.3-1.2-2.3 6.3 2.7 1.6-9.2 7.8 1.2 3.6-8.9-1.6.3 11.7h-2.8l.3-11.7-8.9 1.6 1.2-3.6-9.2-7.8 2.7-1.6-2.3-6.3 6.3 1.2 1.2-3.4 6.3 6.7-1.3-9.6 3.4 1.8z" fill="#ff1a1a"/>`,
    australiaday: `${star(13, 11, 6.5, 2.8, '#ffcc1a', 7)}${star(36, 13, 4.2, 1.8, '#fff')}${star(41, 26, 4.2, 1.8, '#fff')}${star(29, 25, 2.8, 1.2, '#fff')}${star(35, 40, 4.4, 1.9, '#fff')}${star(14, 34, 5.2, 2.2, '#00cc40', 7)}`,
    bastille: `<path d="M24 3l1.4 9h3L31 26h-3.4l6.2 17h-6.6c-.4-6-1.6-9-3.2-9s-2.8 3-3.2 9h-6.6l6.2-17H17l2.6-14h3z" fill="#3d6bff"/><path d="M19.6 12h8.8M17.6 26h12.8" stroke="#fff" stroke-width="2.2"/><path d="M24 3v-1" stroke="#ff1a2a" stroke-width="2"/>
      <path d="M8 44h32" stroke="#ff1a2a" stroke-width="2.4" stroke-linecap="round"/>${burst(39, 9, 8, 1.6, 5, ['#ff1a2a', '#fff'], 1.4)}${burst(9, 12, 8, 1.4, 4, ['#fff', '#3d6bff'], 1.3)}`,
    kingsday: `<path d="M6 16l9 8 9-13 9 13 9-8-4 22H10z" fill="#ff8a1a"/><path d="M10 38h28l-1 5H11z" fill="#ffcc33"/><circle cx="6" cy="15" r="2.6" fill="#ffcc33"/><circle cx="24" cy="10" r="2.8" fill="#ffcc33"/><circle cx="42" cy="15" r="2.6" fill="#ffcc33"/>
      <circle cx="17" cy="31" r="2.4" fill="#2a5bff"/><circle cx="24" cy="29" r="2.8" fill="#fff"/><circle cx="31" cy="31" r="2.4" fill="#2a5bff"/>`,
    bonfire: `<path d="M24 3c4 8 13 12 13 24a13 13 0 0 1-26 0c0-6 3-9 5-12 0 4 2 6 4 6-2-7 1-12 4-18z" fill="#ff3d1a"/><path d="M24 15c3 6 8 8 8 15a8 8 0 0 1-16 0c0-4 2-6 3-8 .5 3 2 4 3 4-1-4 0-8 2-11z" fill="#ff9a1a"/>
      <path d="M24 26c2 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1-3 2-4 .3 1.5 1 2 1.5 2 0-2 0-3 .5-5z" fill="#ffe14d"/><path d="M8 42l32-5M8 37l32 5" stroke="#8a4a1e" stroke-width="3.6" stroke-linecap="round"/>`,
    carnival: `${[[-38, '#0fcc3d'], [-12, '#ffcc26'], [14, '#ff3d9a']].map(([r, c]) => `<g transform="rotate(${r} 36 21)"><path d="M36 21C31 13 32 5 36 2c4 3 5 11 0 19z" fill="${c}"/><path d="M36 20V5" stroke="#fff8" stroke-width=".9"/></g>`).join('')}
      <path d="M4 22c6-3 13-3 20 1 7-4 14-4 20-1-1 9-6 14-12 14-4 0-6-3-8-6-2 3-4 6-8 6-6 0-11-5-12-14z" fill="#8c1ad9"/><path d="M4 22c6-3 13-3 20 1 7-4 14-4 20-1" stroke="#ffcc26" stroke-width="2" fill="none"/>
      <ellipse cx="15" cy="27" rx="4.6" ry="3" fill="${K}"/><ellipse cx="33" cy="27" rx="4.6" ry="3" fill="${K}"/><circle cx="24" cy="31" r="1.6" fill="#ffcc26"/><path d="M4 22l-2 10" stroke="#ffcc26" stroke-width="1.8" stroke-linecap="round"/>`,
    mothersday: `<path d="M24 44V26M24 44l-9-16M24 44l9-16" stroke="#2bd96b" stroke-width="2.2" stroke-linecap="round"/><path d="M18 38c-4-1-6-4-6-6 3 0 5 2 6 6zM30 38c4-1 6-4 6-6-3 0-5 2-6 6z" fill="#2bd96b"/>
      ${petals(24, 17, 6, 3.6, 5, 4.4, '#ff4d8c')}<circle cx="24" cy="17" r="3" fill="#ffd94d"/>
      ${petals(12, 24, 5, 3, 4.2, 3.6, '#b373ff')}<circle cx="12" cy="24" r="2.4" fill="#ffd94d"/>${petals(36, 24, 5, 3, 4.2, 3.6, '#ffb3cc')}<circle cx="36" cy="24" r="2.4" fill="#ffd94d"/>
      <path d="M17 40l7-2 7 2-7 5z" fill="#ff4d8c"/>`,
    easter: `<defs><clipPath id="fiEgg"><path d="M24 4c9 0 15 14 15 24a15 15 0 0 1-30 0C9 18 15 4 24 4z"/></clipPath></defs><path d="M24 4c9 0 15 14 15 24a15 15 0 0 1-30 0C9 18 15 4 24 4z" fill="#ffa3cc"/>
      <g clip-path="url(#fiEgg)"><rect x="0" y="14" width="48" height="6" fill="#99dcff"/><path d="M0 26l4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4 4-4 4 4v4H0z" fill="#fff27a"/><rect x="0" y="33" width="48" height="5" fill="#a6ff9e"/>
      <circle cx="17" cy="10" r="1.6" fill="#cfa6ff"/><circle cx="24" cy="9" r="1.6" fill="#cfa6ff"/><circle cx="31" cy="10" r="1.6" fill="#cfa6ff"/><circle cx="18" cy="41" r="1.6" fill="#cfa6ff"/><circle cx="30" cy="41" r="1.6" fill="#cfa6ff"/></g>`,

    // ---------------------------------------------------------------- arcade games
    Breakout: `${['#ff2a4d', '#ff8a1a', '#ffcc33', '#2bd96b'].map((c, r) => [0, 1, 2, 3, 4].map(i => (r === 2 && i === 2) || (r === 3 && (i === 1 || i === 3)) ? '' : `<rect x="${3 + i * 8.6}" y="${5 + r * 5}" width="7.6" height="4" rx="1" fill="${c}"/>`).join('')).join('')}
      <circle cx="27" cy="31" r="2.6" fill="#fff"/><path d="M27 31l-6-6" stroke="#ffffff55" stroke-width="2" stroke-linecap="round" stroke-dasharray="1.5 2.4"/><rect x="16" y="40" width="18" height="4" rx="2" fill="#33d6ff"/>`,
    SnakeGame: `${[[6, 38], [10, 38], [14, 38], [18, 38], [22, 38], [22, 34], [22, 30], [22, 26], [18, 26], [14, 26], [10, 26], [10, 22], [10, 18], [10, 14], [14, 14], [18, 14], [22, 14], [26, 14], [30, 14]]
      .map(([x, y], i, a) => `<rect x="${x}" y="${y}" width="3.6" height="3.6" rx="1" fill="hsl(${(i * 330 / a.length) | 0} 100% 58%)"/>`).join('')}<rect x="30" y="14" width="4.2" height="4.2" rx="1.2" fill="#ff3d9a"/><circle cx="33" cy="15.4" r=".7" fill="${K}"/>
      <circle cx="38" cy="30" r="2.6" fill="#ffcc33"/><circle cx="38" cy="30" r="4.4" fill="none" stroke="#ffcc3355" stroke-width="1.2"/>`,
    PongBattle: `<path d="M24 4v40" stroke="#ffffff44" stroke-width="1.6" stroke-dasharray="2.4 2.6"/><rect x="5" y="10" width="4" height="13" rx="2" fill="#33d6ff"/><rect x="39" y="25" width="4" height="13" rx="2" fill="#ff3d9a"/>
      <circle cx="30" cy="20" r="2.8" fill="#fff"/><path d="M28 21.6 13 30" stroke="#ffffff55" stroke-width="2" stroke-linecap="round" stroke-dasharray="1.5 2.4"/><rect x="13" y="4" width="3" height="5" rx=".6" fill="#33d6ff"/><rect x="32" y="4" width="3" height="5" rx=".6" fill="#ff3d9a"/>`,
    AlienParade: px(['..x.....x..', '...x...x...', '..xxxxxxx..', '.xx.xxx.xx.', 'xxxxxxxxxxx', 'x.xxxxxxx.x', 'x.x.....x.x', '...xx.xx...'], {x: '#b98cff'}, 4, 2, 6) +
      `<rect x="23" y="41" width="2" height="5" rx="1" fill="#ffcc33"/>`,
    VectorRocks: `<path d="M8 12l6-6 8 2 2 7-4 6-9 1-4-5z" fill="none" stroke="#ffb31a" stroke-width="2" stroke-linejoin="round"/><path d="M30 6l7 1 4 6-3 5-6-1-3-5z" fill="none" stroke="#ff8a1a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M31 27l6-2 5 5-2 7-7 1-4-5z" fill="none" stroke="#ffcc33" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 42l4-11 4 11-4-3z" fill="none" stroke="#33d6ff" stroke-width="2" stroke-linejoin="round"/>
      <path d="M16 28l3-6M22.6 16l1.6-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="26" cy="23" r="1" fill="#fff"/><circle cx="24" cy="27" r=".8" fill="#fff"/>`,
    TetrisDrop: px(['...ttt...', '....t....', '.........', '.........', 'j.......o', 'j..ss...o', 'jjss..zoo', 'iiii.zzll', 'llliizzll'], {t: '#ffcc33', o: '#ff8a1a', j: '#3d6bff', i: '#2bd96b', s: '#33d6ff', l: '#9b3dff', z: '#ff2a4d'}, 5, 1.5, 2) +
      `<path d="M21.5 13v4M26.5 13v4" stroke="#ffcc3366" stroke-width="1.4" stroke-linecap="round"/>`,
    LightCycles: `<path d="M3 38h14V22h14v-8h11" fill="none" stroke="#33d6ff" stroke-width="2.6" stroke-linejoin="round"/><path d="M45 44H30V30h-8V8H6" fill="none" stroke="#ff3d9a" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M3 38h14V22h14v-8h11" fill="none" stroke="#33d6ff" stroke-width="7" stroke-opacity=".18" stroke-linejoin="round"/><path d="M45 44H30V30h-8V8H6" fill="none" stroke="#ff3d9a" stroke-width="7" stroke-opacity=".18" stroke-linejoin="round"/>
      <path d="M41 11h5l-1 6h-4z" fill="#cff6ff"/><path d="M7 5H2l1 6h4z" fill="#ffd1e8"/>`,
    GameOfLife: px(['.........', '..a......', '...a.....', '.aaa.....', '.....bb..', '.....bb..', '..c...ddd', '..c......', '..c......'], {a: '#ffcc33', b: '#2bd96b', c: '#33d6ff', d: '#ff3d9a'}, 5, 1.5, 1.5) +
      `<rect x="11.5" y="6.5" width="5" height="5" fill="none" stroke="#ffcc3355" stroke-width="1"/>`,
  };
  GB.funIcon = k => I[k] ? `<svg class="fi" viewBox="0 0 48 48" aria-hidden="true">${I[k]}</svg>` : '';
  GB.css(`.tile .em .fi, .md-hh .em .fi { width:1.45em; height:1.45em; display:block; overflow:visible; filter:drop-shadow(0 0 4px rgba(255,255,255,.25)) drop-shadow(0 0 10px color-mix(in srgb, var(--c, #ff3d9a) 45%, transparent)); }
    .tile.on .em .fi { filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 14px var(--c, #ff3d9a)); }`);
})();
