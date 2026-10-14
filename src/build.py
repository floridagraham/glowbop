"""Builds the GlowBop website into OUT. Every page shares one header/footer; LED placeholders are listed in PHOTOS.md
so real photos can be swapped in later (replace the <figure class="led"> with an <img>)."""
import os, sys, shutil, html
OUT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
MAIL = 'hello@glowbop.com'
WAIT = f'mailto:{MAIL}?subject=GlowBop%20launch%20list&body=Hi!%20Add%20me%20to%20the%20GlowBop%20launch%20list.%0A%0AMy%20lights%3A%20'
PHOTOS = []
CUR = ['']

NAV = [('/features.html', 'Features'), ('/guide/', 'Guide'), ('/lights.html', 'Lights'), ('/compare.html', 'Compare'),
       ('/pricing.html', 'Pricing'), ('/faq.html', 'FAQ')]


def led(scene, caption, w=40, h=21, cls='', demo=False):
    if demo:
        return (f'<figure class="led demo {cls}"><canvas data-scene="{scene}" data-w="{w}" data-h="{h}" aria-label="{html.escape(caption)}"></canvas>'
                f'<figcaption>🔴 Live · {html.escape(caption)}</figcaption></figure>')
    PHOTOS.append((CUR[0], caption))
    return (f'<figure class="led {cls}"><canvas data-scene="{scene}" data-w="{w}" data-h="{h}" aria-label="{html.escape(caption)}"></canvas>'
            f'<figcaption>📷 Placeholder · {html.escape(caption)}</figcaption></figure>')


def pic(name, alt, cls=''):
    return (f'<figure class="shot {cls}"><img src="/img/{name}.jpg" alt="{html.escape(alt)}" loading="lazy" width="1344" height="752">'
            f'<span class="concept">Concept image</span></figure>')


def page(path, title, desc, body, active=''):
    CUR[0] = path
    nav = ''.join(f'<li><a href="{h}"{" class=on" if h == active else ""}>{n}</a></li>' for h, n in NAV)
    doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="/icon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="https://glowbop.com/icon.png">
<meta name="theme-color" content="#07070b">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<nav class="nav"><div class="wrap">
  <a class="brand" href="/"><img src="/icon.png" alt="">GlowBop</a>
  <button class="burger" aria-label="Menu">☰</button>
  <ul>{nav}</ul>
  <a class="btn primary small cta" href="/pricing.html">Try free for 7 days</a>
</div></nav>
{body}
<footer><div class="wrap">
  <div class="cols">
    <div><a class="brand" href="/"><img src="/icon.png" alt="">GlowBop</a>
      <p class="dim" style="margin-top:12px;font-size:15px;max-width:34ch">Your lights, dancing to your music. A light show app for LED curtains, made in Fort Myers, Florida.</p>
      <a class="btn small" href="{WAIT}">✉️ Join the launch list</a></div>
    <div><h4>Product</h4><ul><li><a href="/features.html">Features</a></li><li><a href="/lights.html">Supported lights</a></li><li><a href="/compare.html">Compare</a></li><li><a href="/pricing.html">Pricing</a></li></ul></div>
    <div><h4>Guide</h4><ul><li><a href="/guide/getting-started.html">Getting started</a></li><li><a href="/guide/music.html">Music show</a></li><li><a href="/guide/scoreboard.html">Scoreboard</a></li><li><a href="/guide/troubleshooting.html">Troubleshooting</a></li></ul></div>
    <div><h4>Help</h4><ul><li><a href="/faq.html">FAQ</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li></ul></div>
  </div>
  <div class="fine"><span>© 2026 GlowBop. Twinkly, Govee and other brand names belong to their owners. GlowBop is not affiliated with them.</span>
  <span>Tempo data by <a href="https://getsongbpm.com" rel="noopener">GetSongBPM</a> · Genre data by <a href="https://www.last.fm" rel="noopener">Last.fm</a></span></div>
</div></footer>
<script src="/assets/site.js"></script>
</body>
</html>
'''
    p = os.path.join(OUT, path.lstrip('/'))
    if p.endswith('/'): p += 'index.html'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(doc)


def band(title='Ready to light up the party?', text='Join the launch list and we will email you the day GlowBop goes live, with your 7-day free trial ready to go.'):
    return f'''<section class="tight"><div class="wrap"><div class="band reveal">
<h2>{title}</h2><p class="lead">{text}</p>
<div class="btns" style="justify-content:center"><a class="btn primary" href="{WAIT}">✉️ Join the launch list</a><a class="btn" href="/guide/">Read the guide</a></div>
</div></div></section>'''


# ================================================================ HOME
FEATS = [
    ('🔊', 'Hears every beat', 'Listens to whatever your computer plays. Builds, drops and quiet parts all look different.', '/guide/music.html'),
    ('🎬', 'Epic mode', 'Movie soundtracks get a slow swell and one giant climax instead of nonstop strobes.', '/guide/music.html#epic'),
    ('🎨', '29 looks, 150+ effects', 'Neon Party, Deep Space, Synthwave, Club Rig and more. Shuffle them or pin a favorite.', '/guide/looks.html'),
    ('🎃', 'Holidays & mini-movies', 'Halloween, Christmas, New Year and more, with full animated scenes for the big nights.', '/guide/holidays.html'),
    ('🔥', 'Cozy fireplace', 'Just the fire, flickering like the real thing. 7 colors, Cozy or Roaring.', '/guide/fireplace.html'),
    ('🏟️', 'Scoreboard', 'Run the score at your kid\'s game, follow your team live, or watch F1 on the wall.', '/guide/scoreboard.html'),
    ('🔤', 'Text & logos', 'Party messages, names, your DJ logo. Scroll it, flash it on every drop.', '/guide/text-logos.html'),
    ('📺', 'Screen mirror', 'Put the game, a movie or a music video right on the lights.', '/guide/text-logos.html#mirror'),
    ('🧩', '1 to 4 curtains', 'Side by side or stacked. Every show resizes to fit your whole wall.', '/guide/lineup.html'),
    ('📱', 'Phone remote', 'Scan a QR code and control everything from your phone. Nothing to install.', '/guide/getting-started.html#phone'),
]
home = f'''
<header class="hero"><div class="wrap">
  <div>
    <span class="pill">🎃 <b>Launching this Halloween</b> · 7-day free trial</span>
    <h1>Your lights,<br><span class="grad">dancing to your music.</span></h1>
    <p class="lead">GlowBop turns LED curtain lights into a live light show that hears every beat, build-up and drop. Holiday scenes, scoreboards, your logo, all from your phone.</p>
    <div class="btns"><a class="btn primary" href="{WAIT}">✉️ Join the launch list</a><a class="btn" href="/features.html">See what it does →</a></div>
    <div class="stats"><div><b>150+</b>effects</div><div><b>29</b>looks</div><div><b>15</b>scoreboard sports</div><div><b>1–4</b>curtains</div></div>
  </div>
  {pic('pool-party', 'Two LED curtains glowing behind a pool party at night', 'hero-shot')}
</div></header>

<section class="alt"><div class="wrap">
  <div class="center reveal"><span class="eyebrow">How it works</span><h2>From box to light show in 5 minutes</h2>
  <p class="lead">No DMX, no light programming, no extra music gadgets. If music plays on your computer, GlowBop can see it.</p></div>
  <div class="grid g3 steps" style="margin-top:36px">
    <div class="card reveal"><h3>Plug in your lights</h3><p>Hang your curtains and put them on your home Wi-Fi with the maker's app, like you normally would.</p></div>
    <div class="card reveal"><h3>Open GlowBop</h3><p>It finds your curtains on the network, then a quick line-up wizard tells it which way is up and which hangs where.</p></div>
    <div class="card reveal"><h3>Press play</h3><p>Play any song from Spotify, YouTube, Apple Music or a DJ app. The wall starts dancing. Grab the remote on your phone.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Everything in the box</span><h2>One app, every kind of party</h2>
  <p class="lead">Pool party, DJ gig, Halloween night or the big game. Tap a card to see how it works.</p></div>
  <div class="grid g3" style="margin-top:36px">
  {''.join(f'<a class="card reveal" href="{u}"><div class="em">{e}</div><h3>{t}</h3><p>{d}</p><span class="more">How it works →</span></a>' for e, t, d, u in FEATS)}
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="feat reveal">
    <div><span class="eyebrow">Smarter than "sound reactive"</span><h2>It knows a drop when it hears one</h2>
      <p class="lead">Most light apps flash on every beat. GlowBop follows the whole song.</p>
      <ul class="ticks"><li><b>Build-ups</b> fill the wall slowly, getting brighter and busier.</li><li><b>Drops</b> hit with a burst, a new effect and a color change.</li><li><b>Quiet parts</b> go soft and flowing so the room can breathe.</li><li><b>Epic songs</b> get one big climax instead of strobes.</li></ul>
      <a class="btn" href="/guide/music.html">How the music show works →</a></div>
    <div class="media">{pic('dj-drop', 'A DJ with a wall of LED curtains bursting with light on the drop')}</div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">Game day</span><h2>A scoreboard as big as your wall</h2>
      <p class="lead">Keep score at the field, follow your team live, or watch Formula 1 running order with tyres and pit stops.</p>
      <ul class="ticks"><li><b>15 sports</b> plus a giant countdown clock.</li><li><b>Live scores</b> for pro and college leagues, with a celebration in team colors when they score.</li><li><b>F1 board</b> with fastest lap, tyres, pits and rain.</li></ul>
      <a class="btn" href="/guide/scoreboard.html">Scoreboard guide →</a></div>
    <div class="media">{pic('soccer-scoreboard', 'LED curtain used as a scoreboard at a youth soccer game')}</div>
  </div>
  <div class="feat reveal">
    <div><span class="eyebrow">Holidays</span><h2>Mini-movies for the big nights</h2>
      <p class="lead">Each holiday has its own button. Halloween Night and Christmas Eve play full animated stories, crisp pixel art made for LED curtains.</p>
      <a class="btn" href="/guide/holidays.html">See the holidays →</a></div>
    <div class="media">{pic('halloween-porch', 'LED curtain showing pixel jack-o-lanterns on a Halloween porch')}</div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">New · Fireplace</span><h2>A fireplace on any wall</h2>
      <p class="lead">No fireplace frame, no fake logs. Just tall, flickering flames across your whole wall, with a white-hot core and floating embers.</p>
      <ul class="ticks"><li><b>7 colors:</b> Classic, Blue gas, Purple, Rainbow, Green, Pink and Ice.</li><li><b>Cozy</b> for a quiet night, <b>Roaring</b> for big flare-ups and spark bursts.</li><li><b>Dance</b> lets the flames swell with your music.</li></ul>
      <a class="btn" href="/guide/fireplace.html">Fireplace guide →</a></div>
    <div class="media">{pic('cozy-fireplace', 'LED curtain showing tall flickering flames behind a couple on a couch')}</div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Why GlowBop</span><h2>What other light apps don't do</h2>
  <p class="lead">We compared GlowBop with the apps people use today. Here is the short version.</p></div>
  <div class="grid g4" style="margin-top:32px">
    <div class="card reveal"><div class="em">🎚️</div><h3>Drop detection</h3><p>None of the apps we checked advertise build-up or drop detection.</p></div>
    <div class="card reveal"><div class="em">💻</div><h3>No extra box</h3><p>Uses the music your computer already plays. No mic dongle, no HDMI sync box.</p></div>
    <div class="card reveal"><div class="em">🏟️</div><h3>Scoreboards</h3><p>Game day and live scores on your lights. We found this nowhere else.</p></div>
    <div class="card reveal"><div class="em">🧩</div><h3>Many curtains, one wall</h3><p>Line up 2, 3 or 4 curtains and run one show across all of them.</p></div>
  </div>
  <p class="center" style="margin-top:24px"><a class="btn" href="/compare.html">See the full comparison →</a></p>
</div></section>

<section class="alt tight"><div class="wrap center reveal">
  <span class="eyebrow">Supported lights</span><h2>Works with Twinkly today</h2>
  <p class="lead">Twinkly curtains are fully supported. TikTok-style pixel curtains, Govee, WLED and light-only Christmas trees are being tested next.</p>
  <div class="btns" style="justify-content:center"><a class="btn" href="/lights.html">Check your lights →</a></div>
</div></section>

<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Pricing</span><h2>Less than a coffee a month</h2>
  <p class="lead">$2.99 a month, $24.99 a year, or $59 once and it's yours. Every plan starts with a 7-day free trial.</p>
  <div class="btns" style="justify-content:center"><a class="btn primary" href="/pricing.html">See plans</a></div></div>
</div></section>
{band()}
'''
page('/', 'GlowBop · Your lights, dancing to your music',
     'GlowBop turns LED curtain lights into a music-reactive light show with drop detection, holiday mini-movies, scoreboards, text and logos. Launching Halloween 2026.', home)

# ================================================================ FEATURES
import re
slug = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def feat(i, scene, cap, eyebrow, title, lead, ticks, link, label):
    flip = ' flip' if i % 2 else ''
    return f'''<div class="feat{flip} reveal" id="{slug(eyebrow)}">
<div><span class="eyebrow">{eyebrow}</span><h2>{title}</h2><p class="lead">{lead}</p>
<ul class="ticks">{''.join(f'<li>{t}</li>' for t in ticks)}</ul><a class="btn" href="{link}">{label} →</a></div>
<div class="media">{pic(scene[1:], cap) if scene.startswith('@') else led(scene, cap)}</div></div>'''

F2 = [
    ('@pool-party', 'Two LED curtains glowing behind a pool party at night', 'Music show', 'Hears the music, follows the song',
     'GlowBop listens to the sound your computer is playing, so it works with any app: Spotify, YouTube, Apple Music, Serato, a playlist on a USB stick.',
     ['<b>Beat, bass and melody</b> each drive different parts of the show.', '<b>Build-ups and drops</b> get their own moves.', '<b>Pace</b> Chill, Normal or Hype, and <b>Sparkles</b> Off, Auto or Lots.', '<b>Sync slider</b> lines the lights up with Bluetooth speakers that run late.', '<b>Song memory</b> remembers how each song went the next time it plays.'],
     '/guide/music.html', 'Music show guide'),
    ('@galaxy-patio', 'Two LED curtains showing a deep-space galaxy on a patio', 'Epic mode', 'Made for movie music',
     'Cinematic songs don\'t have a "drop". They swell for minutes and peak once. GlowBop notices and switches to Epic mode on its own.',
     ['A slow, growing <b>swell</b> through the crescendo.', '<b>One big climax</b> at the real peak, not every loud moment.', 'No harsh strobes during the quiet, emotional parts.', 'Optional <b>song lookup</b> uses free genre data to spot soundtracks even faster.'],
     '/guide/music.html#epic', 'About Epic mode'),
    ('rainbow', 'Photo: the looks menu on a phone next to the wall', 'Looks', '29 looks, 150+ effects',
     'A look is a mood: its colors plus a set of effects for calm, medium and loud parts. GlowBop shuffles through them as the music changes.',
     ['Neon Party, Deep Space, Synthwave, Warehouse Rave, Mainstage, Club Rig, Royal Gold and more.', '<b>3D Depth</b> tunnels, spinning cubes and disco spheres.', '<b>Dance Crew</b> pixel characters you can switch on or off.', '<b>Describe a scene</b> in words and GlowBop builds it.', '<b>Pin</b> an effect you love, or hit <b>Surprise me</b>.'],
     '/guide/looks.html', 'Looks guide'),
    ('@christmas-eve', 'LED curtain showing a pixel Christmas tree in a window', 'Holidays', 'Every holiday gets its own button',
     'Holidays live in their own section, away from the normal shuffle. Tap one and the wall plays only that holiday until you stop it.',
     ['Halloween, Christmas, Thanksgiving, New Year, Valentine\'s, St. Patrick\'s, Birthday and Game Day.', '<b>Mini-movies:</b> Halloween Night and Christmas Eve play full animated stories.', 'Jack-o\'-lanterns, bats, ghosts, a haunted house, sleigh rides, fireworks, a ball drop and more.', 'Choose which holiday effects are in the rotation.'],
     '/guide/holidays.html', 'Holidays guide'),
    ('@cozy-fireplace', 'LED curtain showing tall flickering flames behind a couple on a couch', 'Fireplace', 'Just the fire, no fireplace',
     'Light a fire on your wall with one tap. GlowBop simulates real flames live, so the fire never loops and never looks the same twice.',
     ['<b>7 colors:</b> Classic, Blue gas, Purple, Rainbow, Green, Pink and Ice.', '<b>Cozy:</b> tall, relaxing flames with the odd small flare.', '<b>Roaring:</b> wild flicker, big whooshes and bursts of sparks.', '<b>Dance:</b> the flames swell gently with the beat of your music.', 'One long fire across every curtain on the wall.'],
     '/guide/fireplace.html', 'Fireplace guide'),
    ('@soccer-scoreboard', 'LED curtain used as a scoreboard at a youth soccer game', 'Scoreboard', 'Game Day, Live Fan and F1',
     'Turn the wall into a scoreboard. Keep score yourself from your phone, follow a real game, or watch a Grand Prix.',
     ['<b>Game Day:</b> 15 sports, clock that counts down or up, periods, timeouts, fouls, possession, undo.', '<b>Live Fan:</b> pick a league and team; scores update every 10 seconds and the wall celebrates in team colors.', '<b>F1:</b> running order, tyres, pit stops, fastest lap, DRS and rain.', '<b>Countdown timer:</b> a huge clock for halftime, a party or New Year.'],
     '/guide/scoreboard.html', 'Scoreboard guide'),
    ('@f1-party', 'LED curtain wall showing a race running order at an F1 watch party', 'Formula 1', 'Race day on your wall',
     'The F1 board shows the top of the field with team colors and tyre dots, then celebrates a new leader, pole position or a fastest lap.',
     ['Purple bar for the fastest lap, just like TV.', 'Pit stops get a soft flash, not a party.', 'Works for practice, qualifying and the race.'],
     '/guide/scoreboard.html#f1', 'F1 board guide'),
    ('text', 'Photo: "Happy Birthday" scrolling across the curtains', 'Text & logos', 'Your words, your logo',
     'Put a message or a logo on top of the show. Great for birthdays, DJ sets, and businesses.',
     ['Modes: <b>Scroll</b>, <b>Beat words</b>, <b>Still</b> and <b>On drop</b>.', 'Colors that follow the look, rainbow, or plain white.', 'Upload a logo (PNG) with Glow, Pulse or Color-shift motion.', 'Flash a word on every drop.'],
     '/guide/text-logos.html', 'Text & logo guide'),
    ('mirror', 'Video: a movie playing on the laptop mirrored onto the curtains', 'Screen mirror', 'Your screen, on the lights',
     'Mirror the laptop screen onto the wall: TV shows, music videos, games.',
     ['Styles: <b>TV</b>, <b>Beat</b> and <b>Glow</b>.', '<b>Smart fill</b> trims black bars so the video fills the wall.', '<b>Center zoom</b> for bigger, bolder shapes.'],
     '/guide/text-logos.html#mirror', 'Screen mirror guide'),
    ('@dj-drop', 'Four LED curtains side by side as one wall behind a DJ', 'Multi-curtain', '1, 2, 3 or 4 curtains, one wall',
     'Hang curtains side by side or stack them. GlowBop treats them as one big screen and resizes every show to fit, keeping pixel art crisp.',
     ['A <b>line-up wizard</b> shows a number and arrow on each curtain so you can rotate, flip and order them.', '<b>Lock it in</b> so nothing moves by accident.', 'Run them as <b>one show</b> or split them into <b>groups</b> with their own shows.'],
     '/guide/lineup.html', 'Line-up guide'),
    ('@phone-remote', 'Phone remote in hand with LED curtains glowing behind', 'Phone remote', 'Control it all from your phone',
     'The GlowBop laptop app shows a QR code. Scan it on any phone on the same Wi-Fi and you get the full remote in the browser.',
     ['Live preview of every curtain right on your phone.', 'Add it to your home screen and it opens like an app.', 'Works at the field too, over your phone\'s hotspot.'],
     '/guide/getting-started.html#phone', 'Phone setup'),
]
features = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Features</span><h1>Everything <span class="grad">GlowBop</span> can do</h1>
<p class="lead">A music light show, a holiday display, a scoreboard and a sign, all in one app. Every section links to the step-by-step guide.</p>
<div class="toc" style="justify-content:center">{''.join(f'<a href="#{slug(e)}">{e}</a>' for _, _, e, _, _, _, l, _ in F2)}</div></div></header>
<section style="padding-top:20px"><div class="wrap">{''.join(feat(i, *f) for i, f in enumerate(F2))}</div></section>
{band()}'''
# make anchors match toc (feat ids come from the link)
page('/features.html', 'Features · GlowBop', 'Music show with drop detection, Epic mode, 29 looks, holiday mini-movies, scoreboards, F1, text, logos, screen mirror and multi-curtain walls.', features, '/features.html')

# ================================================================ GUIDE
G = [
    ('getting-started', '🚀', 'Getting started', 'Install, find your lights, connect your phone.'),
    ('lineup', '🧭', 'Line up your curtains', 'Rotate, flip, order and lock 1 to 4 curtains.'),
    ('music', '🔊', 'Music show', 'How the show follows a song, Epic mode, sync and song lookup.'),
    ('looks', '🎨', 'Looks & effects', 'Looks, scenes, pinning, characters and transitions.'),
    ('holidays', '🎃', 'Holidays & mini-movies', 'Holiday buttons and the animated stories.'),
    ('fireplace', '🔥', 'Fireplace', 'One-tap fire in 7 colors, cozy or roaring.'),
    ('scoreboard', '🏟️', 'Scoreboard', 'Game Day, Live Fan, F1 and the countdown clock.'),
    ('text-logos', '🔤', 'Text, logos & mirror', 'Messages, logos and mirroring your screen.'),
    ('groups', '🧩', 'Light groups', 'Run different shows on different lights.'),
    ('troubleshooting', '🛠️', 'Troubleshooting', 'Fixes for the common snags.'),
]


def guide(slug, body, toc=()):
    i = [g[0] for g in G].index(slug); _, em, title, sub = G[i]
    side = '<h4>Guide</h4>' + '<a href="/guide/">📖 Overview</a>' + ''.join(
        f'<a href="/guide/{s}.html"{" class=on" if s == slug else ""}>{e} {t}</a>' for s, e, t, _ in G)
    prev = f'<a href="/guide/{G[i-1][0]}.html"><small>← Previous</small>{G[i-1][2]}</a>' if i else '<a href="/guide/"><small>← Back</small>Guide overview</a>'
    nxt = f'<a class="next" href="/guide/{G[i+1][0]}.html"><small>Next →</small>{G[i+1][2]}</a>' if i + 1 < len(G) else '<a class="next" href="/faq.html"><small>Next →</small>FAQ</a>'
    tc = ('<div class="toc">' + ''.join(f'<a href="#{a}">{b}</a>' for a, b in toc) + '</div>') if toc else ''
    page(f'/guide/{slug}.html', f'{title} · GlowBop Guide', sub,
         f'<div class="wrap guide"><aside class="side">{side}</aside><article class="doc"><span class="eyebrow">Guide</span><h1 style="font-size:clamp(32px,4.4vw,48px)">{em} {title}</h1><p class="lead">{sub}</p>{tc}{body}<div class="pager">{prev}{nxt}</div></article></div>',
         '/guide/')


def tip(t, kind=''): return f'<div class="tip {kind}">{t}</div>'


page('/guide/', 'Guide · GlowBop', 'The complete GlowBop guide: setup, line-up, music show, looks, holidays, scoreboard, text and logos, groups and troubleshooting.',
     f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">The GlowBop Guide</span><h1>Learn GlowBop <span class="grad">in an evening</span></h1>
<p class="lead">Every part of the app, step by step. Start at the top if you're new. Each section works on its own too.</p></div></header>
<section style="padding-top:10px"><div class="wrap"><div class="grid g3">
{''.join(f'<a class="card reveal" href="/guide/{s}.html"><div class="em">{e}</div><h3>{n}. {t}</h3><p>{d}</p><span class="more">Open →</span></a>' for n, (s, e, t, d) in enumerate(G, 1))}
</div>
<div class="tip pink reveal" style="margin-top:28px"><b>New here?</b> The fastest path: <a href="/guide/getting-started.html">Getting started</a> → <a href="/guide/lineup.html">Line up your curtains</a> → press play on a song. Everything else is a bonus.</div>
</div></section>{band()}''', '/guide/')

guide('getting-started', f'''
<h2 id="need">What you need</h2>
<ul><li>A <b>Windows 10 or 11</b> laptop or PC. This is where GlowBop runs and listens to the music.</li>
<li>One or more <b>supported LED curtains</b> (see <a href="/lights.html">Supported lights</a>).</li>
<li>Your <b>home Wi-Fi</b>. The lights, the computer and your phone all join the same network.</li>
<li>A phone (iPhone or Android) for the remote. Optional, but it's the fun part.</li></ul>
<h2 id="lights">1. Get your lights on Wi-Fi</h2>
<p>Set up each curtain with its maker's app first (for Twinkly, the Twinkly app). Once the curtain shows up there and lights up, you're ready. GlowBop takes over from here.</p>
{tip('<b>Tip:</b> use your main Wi-Fi, not a guest network. Guest networks often block devices from seeing each other.')}
<h2 id="install">2. Install and open GlowBop</h2>
<ol><li>Download GlowBop from your welcome email and run the installer.</li>
<li>Open <b>GlowBop</b> from the Start menu or desktop shortcut.</li>
<li>If Windows asks, <b>allow GlowBop on private networks</b>. That lets your phone and lights reach it.</li></ol>
{led('sparkle', 'Screenshot: GlowBop open on the laptop, first launch')}
<h2 id="find">3. Find your lights</h2>
<ol><li>Open <b>Light setup</b> and tap <span class="k">Find my lights</span>. GlowBop searches your network.</li>
<li>Each curtain it finds is added with its size. If one is missing, use <span class="k">Add by brand</span>.</li>
<li>Have more than one curtain? Do the <a href="/guide/lineup.html">line-up wizard</a> next. It takes a minute.</li></ol>
<h2 id="phone">4. Connect your phone</h2>
<ol><li>Put your phone on the <b>same Wi-Fi</b> as the computer.</li>
<li>In GlowBop, open <b>📱 Control from your phone</b> and point your phone camera at the QR code.</li>
<li>The remote opens in Safari or Chrome. Tap <b>Share → Add to Home Screen</b> to get the GlowBop icon.</li></ol>
{tip('<b>Not connecting?</b> Same Wi-Fi on both, VPN off on the phone, and allow GlowBop on private networks in Windows. More in <a href="/guide/troubleshooting.html">Troubleshooting</a>.', 'warn')}
<h2 id="play">5. Press play</h2>
<p>Play a song on the computer, from any app. The status bar on the remote says <b>MUSIC SHOW · listening</b> and the wall comes alive. That's it, you're running a light show. 🎉</p>
<h3>The remote at a glance</h3>
<ul><li><b>Live preview</b> at the top shows every curtain. Turn your phone sideways or tap ⛶ for full screen.</li>
<li><span class="k">Next effect</span>, <span class="k">Shuffle</span>, <span class="k">Surprise me</span> and <span class="k">Pin</span> steer the show.</li>
<li><b>Pace</b>, <b>Sparkles</b>, <b>Brightness</b>, <b>Blend</b> and <b>Sync</b> fine-tune it.</li>
<li>Below that: Screen mirror, Text & logos, Holidays, Light setup, Looks, Scoreboard and Transitions.</li></ul>
''', [('need', 'What you need'), ('lights', 'Lights on Wi-Fi'), ('install', 'Install'), ('find', 'Find lights'), ('phone', 'Phone'), ('play', 'Press play')])

guide('lineup', f'''
<p>With more than one curtain, GlowBop needs to know three things: which way is up on each one, whether any are mirrored, and what order they hang in. The wizard makes it a one-minute job.</p>
{led('lineup', 'Photo: four curtains showing 1-2-3-4 with arrows during the wizard', 80, 21)}
<h2 id="wizard">Run the wizard</h2>
<ol><li>Open <b>Light setup</b> and tap <span class="k">🧭 Line up my curtains</span>.</li>
<li>Every curtain now shows a <b>big number and an UP arrow</b>.</li>
<li>For each curtain, tap <span class="k">⟳</span> to rotate until the arrow points up, and <span class="k">⇋</span> if the number reads backwards. Use <span class="k">⇅</span> to flip top to bottom.</li>
<li>Use <span class="k">▲</span> <span class="k">▼</span> to put them in the order they hang, left to right.</li>
<li>Choose <b>Side by side</b> or <b>Stacked</b>.</li>
<li>Tap <span class="k">🔒 Lock it in</span>.</li></ol>
{tip('<b>Locked</b> means nothing changes by accident. To move curtains later, run the wizard again and lock it when you are done.')}
<h2 id="sizes">How shows fit your wall</h2>
<p>GlowBop builds one big canvas from all your curtains. Flowing effects stretch across the whole wall. Pixel-art scenes (pumpkins, characters, the tree) keep their sharp look by showing one copy per curtain instead of getting blurry.</p>
<ul><li><b>1 curtain:</b> everything as designed.</li><li><b>2 to 4 side by side:</b> wide shows sweep across, pixel art repeats per curtain.</li><li><b>Stacked:</b> a taller canvas, great for fire, rain and fountains.</li></ul>
<h2 id="camera">Camera mapping (optional)</h2>
<p>For lights that aren't a neat grid, like strings wrapped on a tree, <span class="k">Map with camera</span> lights each bulb in turn while your camera watches, so GlowBop learns exactly where every light is.</p>
''', [('wizard', 'Run the wizard'), ('sizes', 'How shows fit'), ('camera', 'Camera mapping')])

guide('music', f'''
<h2 id="how">How the music show works</h2>
<p>GlowBop listens to the sound coming out of your computer, the same sound you hear. It doesn't matter what app plays it: Spotify, YouTube, Apple Music, a DJ program, a video. Nothing to log into.</p>
<ul><li><b>Kick and bass</b> push bursts, pulses and color hits.</li><li><b>Melody</b> moves the flowing parts.</li>
<li><b>Song sections</b>: GlowBop tracks loudness over time to tell a verse from a build-up, a drop, or a breakdown.</li>
<li><b>Drops</b> get a big move and usually a look change. A short gap between drops keeps it from feeling repetitive.</li></ul>
{led('drop', 'Video: a dance song build-up and drop, side by side with the remote')}
<h2 id="controls">Show controls</h2>
<ul><li><b>Pace:</b> <span class="k">Chill</span> slow and dreamy, <span class="k">Normal</span>, <span class="k">Hype</span> fast changes for a dance floor.</li>
<li><b>Sparkles:</b> <span class="k">Off</span>, <span class="k">Auto</span> (on the high notes), <span class="k">Lots</span>.</li>
<li><b>Brightness</b> for the whole wall, and <b>Blend</b> for how smoothly effects cross-fade.</li>
<li><span class="k">Next effect</span> skips ahead. <span class="k">Pin</span> keeps the current one going. <span class="k">Shuffle</span> lets GlowBop choose.</li></ul>
<h2 id="sync">Sync with Bluetooth speakers</h2>
<p>Bluetooth speakers play sound about 150 to 300 milliseconds late, so the lights can look early. Slide <b>Sync</b> to the right until a kick drum and its flash land together. GlowBop remembers the setting for each speaker.</p>
{tip('<b>Quick test:</b> play a song with a hard, simple kick drum and watch one curtain while you slide. When it feels "locked", stop.')}
<h2 id="epic">Epic mode 🎬</h2>
<p>Movie and trailer music works differently from dance music: a long crescendo, then one huge peak. GlowBop spots these songs on its own and switches to Epic mode.</p>
<ul><li>Through the build, the wall <b>swells</b>: more light, more motion, warmer color.</li>
<li>Only the <b>real climax</b> gets the big moment, and it must top everything before it.</li>
<li>Harsh strobes are left out of Epic songs.</li></ul>
{led('tunnel', 'Video: an orchestral song reaching its climax on the wall')}
<h2 id="memory">Song memory</h2>
<p>The first time a song plays, GlowBop learns its shape. Next time, it already knows where the drops and the climax are and can set up for them.</p>
<h2 id="lookup">Song lookup (optional)</h2>
<p>When GlowBop knows a song's name, it can look up its genre, tempo and key. An "orchestral" song starts in Epic mode right away; "house" stays in dance mode. You need two free keys:</p>
<ol><li><b>Last.fm</b> (genres): sign in at last.fm, go to <a href="https://www.last.fm/api/account/create" rel="noopener">last.fm/api/account/create</a>, fill in a name and description, and copy the <b>API key</b>.</li>
<li><b>GetSongBPM</b> (tempo and key): request a key at <a href="https://getsongbpm.com/api" rel="noopener">getsongbpm.com/api</a> and click the activation link in your email.</li>
<li>In GlowBop open <b>Light setup → 🔎 Song lookup</b>, paste each key, and tap <span class="k">Save</span>.</li></ol>
{tip('Each song is looked up only once and saved on your computer. Your keys stay on your computer too.')}
''', [('how', 'How it works'), ('controls', 'Controls'), ('sync', 'Sync'), ('epic', 'Epic mode'), ('memory', 'Song memory'), ('lookup', 'Song lookup')])

LOOKS = ['Red Alert', 'Rainbow Riot', 'Emerald Ocean', 'Midnight Galaxy', 'Fairy Forest', 'Deep Sea', 'Neon Party', 'Ice Palace', 'Synthwave', 'Royal Gold', 'Toxic Rave', 'Lava Lounge', 'Blue Sky', 'Hyperspace', 'Digital Matrix', 'Psychedelic', 'Molten', 'Chaos', 'Wild Card', 'Studio 54', 'Liquid Dreams', 'Warehouse Rave', 'Neon Grid', 'Storm & Sea', 'Mainstage', 'Deep Space', 'Hypnotic', 'Club Rig', 'Dance Crew']
guide('looks', f'''
<h2 id="looks">What a look is</h2>
<p>A look is a mood: a color palette plus a set of effects for calm, medium and loud moments. During a song GlowBop picks effects from the current look, and moves to a new look at drops or when the song changes.</p>
{led('rainbow', 'Screenshot: the Looks list on the phone remote')}
<h3>All 29 looks</h3>
<div class="toc">{''.join(f'<span class="k">{l}</span> ' for l in LOOKS)}</div>
<p>Tap any look to jump to it. Tap <span class="k">Shuffle</span> to hand control back to GlowBop.</p>
<h2 id="3d">3D and club looks</h2>
<ul><li><b>3D Depth:</b> tunnels, spinning cubes, disco spheres and black holes that look like they go deep into the wall.</li>
<li><b>Club Rig:</b> moving-head beams, laser scans and strobe banks, like a real club ceiling.</li>
<li><b>Dance Crew:</b> pixel characters that dance to the beat. Turn them on or off with <span class="k">Characters</span>.</li></ul>
<h2 id="scenes">Quick scenes and Describe a scene</h2>
<p><b>Quick scenes</b> are one-tap presets. <b>Describe a scene</b> lets you type what you want ("slow purple ocean with gold sparkles") and tap <span class="k">Play it</span>. GlowBop picks matching effects and colors from your words.</p>
<h2 id="feature">Feature an effect</h2>
<p>Love one effect? <b>Feature</b> it for the current part of the song, or <span class="k">Pin</span> it to keep it on. Tap <span class="k">Let the show flow again</span> to go back to normal.</p>
<h2 id="transitions">Transitions</h2>
<p>Choose how one effect hands over to the next: quick cuts for high-energy sets, long fades for a chill night.</p>
''', [('looks', 'Looks'), ('3d', '3D & club'), ('scenes', 'Scenes'), ('feature', 'Feature'), ('transitions', 'Transitions')])

guide('holidays', f'''
<p>Holidays have their own section so they don't pop up in the middle of a July pool party. Tap a holiday and the wall plays <b>only that holiday</b> until you stop it.</p>
<h2 id="list">The holidays</h2>
<div class="grid g2">
<div class="card"><div class="em">🎃</div><h3>Halloween</h3><p>Jack-o'-lanterns, bat swarms, ghosts, a haunted house, and the <b>Halloween Night</b> mini-movie.</p></div>
<div class="card"><div class="em">🎄</div><h3>Christmas</h3><p>A twinkling tree, candy canes, a sleigh ride, snow, and the <b>Christmas Eve</b> mini-movie.</p></div>
<div class="card"><div class="em">🎆</div><h3>New Year</h3><p>Fireworks, sparklers and a ball drop.</p></div>
<div class="card"><div class="em">❤️</div><h3>Valentine's</h3><p>Floating hearts and warm pinks.</p></div>
<div class="card"><div class="em">☘️</div><h3>St. Patrick's</h3><p>Greens and gold.</p></div>
<div class="card"><div class="em">🦃</div><h3>Thanksgiving</h3><p>Autumn colors.</p></div>
<div class="card"><div class="em">🎂</div><h3>Birthday</h3><p>Confetti cannons and cake. Add the name with <a href="/guide/text-logos.html">Text</a>.</p></div>
<div class="card"><div class="em">🏈</div><h3>Game Day</h3><p>Waving flags and team-color energy.</p></div>
</div>
<h2 id="movies">Mini-movies</h2>
<p>For the two biggest nights, GlowBop plays a short animated story in chapters, drawn as crisp pixel art made for LED curtains.</p>
{pic('halloween-porch', 'LED curtain showing pixel jack-o-lanterns on a Halloween porch')}
{pic('christmas-eve', 'LED curtain showing a pixel Christmas tree in a window')}
<h2 id="choose">Choose the effects</h2>
<p>Inside each holiday you can toggle which effects are in the rotation, so you can keep the ones your family loves.</p>
{tip('<b>Trick-or-treat tip:</b> start Halloween at dusk, set Pace to Chill, and the mini-movie plays every few switches between the spooky effects.', 'pink')}
''', [('list', 'Holidays'), ('movies', 'Mini-movies'), ('choose', 'Choose effects')])

guide('fireplace', f"""
<p>Turn the whole wall into a fire with one tap. There's no fireplace frame and no logs, just the flames, simulated live so they never loop.</p>
{pic('cozy-fireplace', 'LED curtain showing tall flickering flames behind a couple on a couch')}
<h2 id="light">Light the fire</h2>
<ol><li>On the phone remote, open the <b>🔥 Fireplace</b> card.</li>
<li>Tap <span class="k">🔥 Light the fire</span>. The banner at the top turns orange and says <b>FIREPLACE</b>.</li>
<li>To stop, tap <span class="k">💨 Put out the fire</span>, or <span class="k">Put out fire</span> in the banner.</li></ol>
{led('fireplace', 'the same fire simulation the app runs, right in your browser', demo=True)}
<h2 id="colors">7 colors</h2>
<div class="toc"><span class="k">🔥 Classic</span> <span class="k">💙 Blue gas</span> <span class="k">💜 Purple</span> <span class="k">🌈 Rainbow</span> <span class="k">💚 Green</span> <span class="k">🩷 Pink</span> <span class="k">🤍 Ice</span></div>
<p>Rainbow drifts slowly through every color across the wall and keeps a white-hot core. Green is great for Halloween and St. Patrick's, Pink for Valentine's, Ice for a ghostly winter look.</p>
<h2 id="mode">Cozy or Roaring</h2>
<ul><li><span class="k">🛋️ Cozy</span>: tall, relaxing flames that reach up the wall, with a small flare now and then.</li>
<li><span class="k">🔥 Roaring</span>: fast, wild flicker with big whooshes of flame every few seconds and bursts of sparks.</li></ul>
<h2 id="music">Calm or Dance</h2>
<ul><li><span class="k">🕯️ Calm</span>: the fire ignores the music. Perfect for a quiet night.</li>
<li><span class="k">💃 Dance</span>: the flames swell gently with the beat. Fire that grooves.</li></ul>
<h2 id="wall">On a big wall</h2>
<p>With several curtains, GlowBop builds one long bed of fire across all of them, like a modern linear fireplace. Stacked curtains get taller flames.</p>
{tip('<b>Good to know:</b> the fireplace stays lit until you put it out. Turning on the scoreboard puts the fire out, and lighting the fire turns the scoreboard off. Text and logos still show on top of the flames.')}
""", [('light', 'Light it'), ('colors', 'Colors'), ('mode', 'Cozy / Roaring'), ('music', 'Calm / Dance'), ('wall', 'Big walls')])

SPORTS = 'Soccer, Football, Basketball, Baseball, Softball, Hockey, Lacrosse, Volleyball, Pickleball, Tennis, Rugby, Water polo, Cornhole, Other, plus a Countdown timer'
guide('scoreboard', f'''
<p>Open <b>🏟️ Scoreboard</b> on the remote and pick a mode: <span class="k">Game Day</span>, <span class="k">Live Fan</span> or <span class="k">🏎️ F1</span>. <span class="k">Off</span> returns to the light show.</p>
{pic('soccer-scoreboard', 'LED curtain used as a scoreboard at a youth soccer game')}
<h2 id="gameday">Game Day: keep score yourself</h2>
<ol><li>Choose a <b>Sport</b> from the dropdown: {SPORTS}.</li>
<li>Open <b>⚙️ Game setup</b> to set minutes per period, number of periods, and <span class="k">⏳ Count down</span> or <span class="k">⏱️ Count up</span>. Tap <span class="k">Set up the game</span>.</li>
<li>Tap <span class="k">▶ Start</span> to run the clock. Nudge it with <span class="k">−1 min</span> <span class="k">−10 s</span> <span class="k">+10 s</span> <span class="k">+1 min</span>.</li>
<li>Add points with the score buttons, or type the score straight into the box. <span class="k">−1</span> fixes a mistake.</li></ol>
<h3>Timeouts, fouls and the ball</h3>
<ul><li>Use <span class="k">−</span> and <span class="k">+</span> for timeouts and fouls. They show as dots on the wall.</li>
<li>Tap the ball button to switch <b>possession</b>.</li>
<li>Baseball and softball track balls, strikes and outs. Football tracks down and distance.</li>
<li>Use the arrows to change period, quarter or half.</li></ul>
<h3>Fix-it buttons</h3>
<ul><li><span class="k">↶ Undo</span> takes back the last change (up to 40 steps).</li>
<li><span class="k">⇄ Swap sides</span> flips the teams at halftime.</li>
<li><span class="k">New game</span> clears everything (it asks first).</li></ul>
<p>Every score gets a celebration on the wall, and it doesn't always say "GOAL". Expect SCORE, TOUCHDOWN, a big burst of color and more.</p>
{tip('<b>At the field:</b> bring the laptop, turn on your phone hotspot, connect the laptop to it, then open the remote link on your phone. Battery-powered curtains make this easy.')}
<h2 id="live">Live Fan: follow a real game</h2>
<ol><li>Tap <span class="k">Live Fan</span>, pick a <b>League</b> (pro or college), then your <b>Team</b>.</li>
<li>Tap <span class="k">Follow this team</span>.</li>
<li>During the game the score updates <b>every 10 seconds</b>. When your team scores, the wall celebrates in their colors.</li></ol>
{tip('GlowBop uses public score feeds and has backups for the major leagues. If a feed is slow, the board catches up on the next update.', 'warn')}
<h2 id="f1">F1 live board 🏎️</h2>
{pic('f1-party', 'LED curtain wall showing a race running order at an F1 watch party')}
<ul><li>Rows show position and driver code with a <b>team color tab</b>.</li>
<li>A <b>tyre dot</b>: red soft, yellow medium, white hard.</li>
<li>A gap bar, <b>purple</b> for the fastest lap, plus DRS and a rain indicator.</li>
<li>Celebrations for <b>NEW LEADER</b>, <b>POLE</b>, <b>TOP TIME</b> and <b>WINNER</b>. Pit stops get a soft flash.</li></ul>
<p>Works during practice, qualifying and the race, whenever a session is live.</p>
<h2 id="timer">Countdown timer</h2>
<p>Pick <b>Countdown timer only</b> as the sport for a giant clock across the whole wall: halftime, a party countdown, New Year's Eve.</p>
''', [('gameday', 'Game Day'), ('live', 'Live Fan'), ('f1', 'F1'), ('timer', 'Countdown')])

guide('text-logos', f'''
<h2 id="text">Text on the wall</h2>
<ol><li>Open <b>Text & logos</b> and type your message.</li>
<li>Pick a <b>Mode</b>: <span class="k">Scroll</span> (marquee), <span class="k">Beat words</span> (one word per beat), <span class="k">Still</span>, or <span class="k">On drop</span> (shows on each drop).</li>
<li>Pick a <b>Color</b>: <span class="k">Look</span> (follows the show), <span class="k">Rainbow</span> or <span class="k">White</span>.</li>
<li>Pick a <b>Layer</b>: <span class="k">Over the show</span> or <span class="k">Text only</span>. Set the speed, then tap <span class="k">Show text</span>.</li></ol>
{led('text', 'Photo: birthday message scrolling at a party')}
{tip('<b>Flash a word on every drop</b>: type one big word like the birthday kid\'s name or "JUMP" and it hits the wall each time the beat drops.', 'pink')}
<h2 id="logo">Your logo</h2>
<ol><li>Under <b>Logo</b>, tap <span class="k">Choose a picture</span>. A PNG with a see-through or black background works best.</li>
<li>Pick a <b>Motion</b>: <span class="k">Glow</span>, <span class="k">Pulse</span> or <span class="k">Colour shift</span>.</li>
<li>Tap <span class="k">Show logo</span>, or <span class="k">Text + logo</span> for both.</li></ol>
<p>Great for DJs, bars, gyms and businesses. Save it and it's ready next time.</p>
<h2 id="saved">Saved messages and logos</h2>
<ul><li>Tap <span class="k">Save</span> under the text or the logo to keep it. It appears as a chip at the bottom of the card.</li>
<li>Tap a saved chip to put it back on the wall.</li>
<li>To delete one, tap the <span class="k">✕</span> next to it. It turns red and asks <b>Delete?</b>. Tap again to delete.</li>
<li><span class="k">🗑️ Remove logo from the wall</span> clears the picture that's loaded right now (your saved copy stays).</li></ul>
<h2 id="mirror">Screen mirror</h2>
<p>Show the laptop screen on the lights: a game, a movie, a music video.</p>
<ul><li><b>Style:</b> <span class="k">TV</span> (the picture), <span class="k">Beat</span> (the picture pulsing to the music), <span class="k">Glow</span> (soft ambient color).</li>
<li><b>Area:</b> <span class="k">Smart fill</span> trims black bars so the video fills the wall; <span class="k">Center zoom</span> shows bigger shapes.</li></ul>
{led('mirror', 'Video: mirroring a movie onto the curtains')}
{tip('Mirror works best with the video playing full screen on the laptop.')}
''', [('text', 'Text'), ('logo', 'Logo'), ('saved', 'Saved items'), ('mirror', 'Screen mirror')])

guide('groups', f'''
<p>By default all your lights are one wall running one show. <b>Groups</b> let you split them: one show on the curtains, another on the tree, for example.</p>
<h2 id="make">Make groups</h2>
<ol><li>Open <b>Light setup → 🧩 Light groups</b>.</li>
<li>Choose <span class="k">All together</span> (one big wall) or <span class="k">Each light separate</span>.</li>
<li>Pick a <b>Layout</b>: <span class="k">One canvas</span> stretches shows across lights, <span class="k">Zones</span> gives each light its own area.</li>
<li>Tap <span class="k">Apply & restart lights</span>.</li></ol>
<h2 id="control">Control a group</h2>
<p>With two or more groups, a row of chips appears on the remote: <b>✨ All groups</b> plus one chip per group. Tap a chip and every button controls only that group. The live preview shows all groups side by side; tap one there to select it.</p>
{led('lineup', 'Photo: two curtains in one group, a tree in another', 60, 21)}
''', [('make', 'Make groups'), ('control', 'Control a group')])

guide('troubleshooting', f'''
<h2 id="phone">The phone remote won't open</h2>
<ul><li>Phone and computer must be on the <b>same Wi-Fi</b>. Not the guest network, and not cellular.</li>
<li>Turn off any <b>VPN</b> on the phone.</li>
<li>In Windows, allow GlowBop on <b>private networks</b> (Windows Security → Firewall → Allow an app).</li>
<li>Make sure your Wi-Fi is set to <b>Private</b> in Windows, not Public.</li></ul>
<h2 id="find">GlowBop can't find my lights</h2>
<ul><li>Check the curtain shows up and works in its own app first.</li>
<li>Restart the curtain (unplug for 10 seconds) and tap <span class="k">Find my lights</span> again.</li>
<li>Use <span class="k">Add by brand</span> if it still hides.</li></ul>
<h2 id="silent">The lights don't react to music</h2>
<ul><li>The music must play <b>on the computer</b> GlowBop runs on. Check the sound is actually coming out (volume up, right speaker selected).</li>
<li>The status line should say <b>MUSIC SHOW · listening</b>. If it says Stop, tap the show back on.</li></ul>
<h2 id="late">The lights are early or late</h2>
<p>Use the <b>Sync</b> slider. Bluetooth speakers usually need it slid right. See <a href="/guide/music.html#sync">Sync</a>.</p>
<h2 id="upside">A curtain is upside down or out of order</h2>
<p>Run the <a href="/guide/lineup.html">line-up wizard</a> again, fix it, and lock it in.</p>
<h2 id="flicker">Lights flicker or stutter</h2>
<ul><li>Move the router closer, or the curtain's controller closer to the router.</li>
<li>Close heavy programs on the laptop and plug it into power.</li></ul>
<h2 id="score">Live scores aren't updating</h2>
<p>Scores only change while a game is live. Before kickoff the board shows the start time. Check the computer is online.</p>
{tip(f'<b>Still stuck?</b> Email <a href="mailto:{MAIL}">{MAIL}</a> with what you see and your light brand.', 'pink')}
''', [('phone', 'Phone'), ('find', 'Finding lights'), ('silent', 'No reaction'), ('late', 'Timing'), ('upside', 'Line-up'), ('flicker', 'Flicker'), ('score', 'Live scores')])

# ================================================================ LIGHTS
L = [
    ('ok', 'Supported', 'Twinkly curtains', 'Twinkly Wi-Fi curtains, up to 4 side by side or stacked. Tested on our own 2-curtain wall.'),
    ('soon', 'Testing now', 'TikTok-style pixel curtains', 'The low-cost Bluetooth RGB pixel curtains sold on TikTok Shop (Surplife app). Our test panels are on the way.'),
    ('soon', 'Coming soon', 'Light-only Christmas trees', 'Metal-frame cone trees made of addressable lights (Hello Fairy app).'),
    ('soon', 'Coming soon', 'WLED', 'DIY strips and matrices running WLED.'),
    ('soon', 'Coming soon', 'Govee', 'Govee curtain and matrix lights.'),
    ('soon', 'Planned', 'Other Twinkly lights', 'Strings, Squares and more Twinkly shapes.'),
]
lights = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Supported lights</span><h1>Will it work with <span class="grad">my lights?</span></h1>
<p class="lead">Here is exactly where things stand. We only mark a light "Supported" after we have run it ourselves.</p></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="grid g3">{''.join(f'<div class="card reveal"><span class="badge {k}">{b}</span><h3 style="margin-top:12px">{n}</h3><p>{d}</p></div>' for k, b, n, d in L)}</div>
<div class="feat reveal" style="margin-top:30px">
<div><span class="eyebrow">Good to know</span><h2>Curtains are the sweet spot</h2>
<ul class="ticks"><li>Curtains are a <b>grid of pixels</b>, so GlowBop can draw real pictures: pumpkins, scores, words.</li><li>More curtains = a <b>bigger screen</b>. Two side by side is a great start.</li><li>Outdoor-rated curtains handle pool decks and porches.</li></ul>
<p class="dim">Have lights you want supported? Email <a href="mailto:{MAIL}">{MAIL}</a> with the brand and model. Requests decide what we test next.</p></div>
<div class="media">{pic('galaxy-patio', 'Two LED curtains side by side on a patio')}</div></div>
</div></section>{band()}'''
page('/lights.html', 'Supported lights · GlowBop', 'GlowBop supports Twinkly curtains today. TikTok-style pixel curtains, light-only Christmas trees, WLED and Govee are in testing.', lights, '/lights.html')

# ================================================================ COMPARE
Y, N, M = '<span class="y">✓ Yes</span>', '<span class="n">Not advertised</span>', '<span class="m">Partly</span>'
ROWS = [
    ('Reacts to music', [(Y, 'Any audio on the PC'), (Y, 'Phone mic, or Music dongle'), (Y, 'PC audio (Desktop), sync box'), (Y, 'PC audio, sync box'), (Y, 'PC audio'), (Y, 'PC audio'), (Y, 'Phone mic, Apple Music')]),
    ('Detects build-ups & drops', [(Y, 'Plus Epic mode'), (N, 'Beat / BPM'), (N, 'Rhythm'), (N, 'Beat'), (N, 'Beat'), (N, ''), (N, 'Beat & mood')]),
    ('Controls Twinkly lights', [(Y, ''), (Y, ''), (N, 'Govee only'), (N, 'Hue only'), (N, 'Nanoleaf only'), (N, 'WLED / ESP'), (N, 'Hue, LIFX, Nanoleaf')]),
    ('Extra hardware for music', [('<span class="y">None</span>', ''), (M, 'Music dongle sold separately'), (M, 'Sync box for TV/HDMI'), (M, 'Sync box for TV/HDMI'), ('None', ''), ('DIY controller', ''), ('None', '')]),
    ('Scoreboard & live scores', [(Y, '15 sports, live, F1'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Text & logos on the lights', [(Y, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Holiday mini-movies', [(Y, 'Halloween, Christmas'), (M, 'Effect library'), (M, 'Scene presets'), (M, 'Scene presets'), (N, ''), (N, ''), (N, '')]),
    ('Many curtains as one wall', [(Y, '1–4, side by side or stacked'), (M, 'Twinkly only'), (N, ''), (N, ''), (N, ''), (M, 'Virtual strips'), (N, '')]),
    ('Phone remote', [(Y, 'Any phone browser'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (N, 'PC app'), (Y, 'It is a phone app')]),
    ('Runs on', [('Windows', ''), ('iOS, Android', ''), ('Windows, iOS, Android', ''), ('Windows, Mac', ''), ('Windows, Mac', ''), ('Win, Mac, Linux', ''), ('iPhone, iPad, Mac', '')]),
    ('Price', [('<b>$2.99/mo</b>, $24.99/yr or $59 once', ''), ('Free app; dongle extra', ''), ('Free app; sync box extra', ''), ('Free app; sync box extra', ''), ('See their site', ''), ('Free, open source', ''), ('Paid app', '')]),
]
HEAD = ['GlowBop', 'Twinkly app', 'Govee Home / Desktop', 'Philips Hue Sync', 'Nanoleaf Desktop', 'LedFx', 'Light DJ Pro']
tbl = '<table><thead><tr><th></th>' + ''.join(f'<th{" class=us" if i == 0 else ""}>{h}</th>' for i, h in enumerate(HEAD)) + '</tr></thead><tbody>'
for name, cells in ROWS:
    tbl += f'<tr><th>{name}</th>' + ''.join(f'<td{" class=us" if i == 0 else ""}>{v}{f"<small>{s}</small>" if s else ""}</td>' for i, (v, s) in enumerate(cells)) + '</tr>'
tbl += '</tbody></table>'
compare = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Compare</span><h1>GlowBop vs. <span class="grad">the other light apps</span></h1>
<p class="lead">Great apps, different jobs. Most light apps run their own brand of lights and flash on the beat. GlowBop is built to follow a whole song on LED curtains, and to do more than music.</p></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="tablewrap reveal">{tbl}</div>
<p class="dim" style="font-size:14px;margin-top:14px">Checked October 2026 from each product's own website, help pages and app listings. "Not advertised" means we could not find the feature in their materials, not that it is impossible. Prices change; check each site. Spot something out of date? Email <a href="mailto:{MAIL}">{MAIL}</a> and we'll fix it.</p>
<div class="grid g3" style="margin-top:36px">
<div class="card reveal"><div class="em">🎚️</div><h3>Follows the song</h3><p>Beat-flashing is easy. Knowing a build-up from a drop from a breakdown is what makes a wall feel like a real light show.</p></div>
<div class="card reveal"><div class="em">💸</div><h3>No extra gadgets</h3><p>No mic dongle and no HDMI sync box. The music already plays on your computer, so GlowBop listens there.</p></div>
<div class="card reveal"><div class="em">🏟️</div><h3>More than music</h3><p>Scoreboards, live sports, F1, messages, logos and holiday movies, from the same app.</p></div>
</div></div></section>{band('Try it on your own wall', 'Every plan starts with a 7-day free trial. Join the launch list and we will email you on launch day.')}'''
page('/compare.html', 'Compare · GlowBop', 'How GlowBop compares with the Twinkly app, Govee, Philips Hue Sync, Nanoleaf, LedFx and Light DJ Pro.', compare, '/compare.html')

# ================================================================ PRICING
EVERY = ['Music show with build-up & drop detection', 'Epic mode for movie music', 'All 29 looks and 150+ effects', 'Holidays & mini-movies', 'Scoreboard, Live Fan & F1', 'Text, logos & screen mirror', 'Up to 4 curtains as one wall', 'Phone remote', 'All updates']
plan = lambda name, price, per, note, best=False, tag='': f'''<div class="plan{' best' if best else ''} reveal">{f'<span class="tag">{tag}</span>' if tag else ''}<h3>{name}</h3>
<div class="price">{price}<small> {per}</small></div><p class="dim" style="margin:6px 0 0">{note}</p>
<ul class="ticks">{''.join(f'<li>{x}</li>' for x in EVERY)}</ul>
<a class="btn{' primary' if best else ''}" href="{WAIT}">Join the launch list</a></div>'''
pricing = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Pricing</span><h1>Simple pricing, <span class="grad">every feature</span></h1>
<p class="lead">Every plan includes everything. Start with a <b>7-day free trial</b>, cancel anytime.</p>
<span class="pill">🎃 Launching this Halloween. Join the list and we'll email you on day one.</span></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="plans">{plan('Monthly', '$2.99', '/ month', 'Perfect for a party season.')}{plan('Yearly', '$24.99', '/ year', 'About $2.08 a month. Save 30%.', True, 'Best value')}{plan('Lifetime', '$59', 'once', 'Pay once, keep it forever.')}</div>
<p class="center dim" style="margin-top:22px;font-size:15px">Payments are handled securely by Polar. Prices in USD.</p>
<div style="max-width:780px;margin:50px auto 0"><h2 class="center">Pricing questions</h2>
<details><summary>How does the free trial work?</summary><p>You get 7 days with every feature. If you cancel before the trial ends, you pay nothing.</p></details>
<details><summary>Can I switch plans?</summary><p>Yes. Start monthly and move to yearly or lifetime whenever you like.</p></details>
<details><summary>Do I need to buy anything else?</summary><p>Just your lights and a Windows computer. No dongles, sync boxes or extra subscriptions. Song lookup uses free keys.</p></details>
</div></div></section>{band()}'''
page('/pricing.html', 'Pricing · GlowBop', 'GlowBop costs $2.99 a month, $24.99 a year, or $59 once. Every plan has every feature and a 7-day free trial.', pricing, '/pricing.html')

# ================================================================ FAQ
Q = [
    ('What is GlowBop?', 'A Windows app that turns LED curtain lights into a live light show. It listens to your music and also does holiday scenes, scoreboards, text, logos and screen mirroring. You control it from your phone.'),
    ('Which lights does it work with?', 'Twinkly curtains today. TikTok-style pixel curtains, light-only Christmas trees, WLED and Govee are being tested. See <a href="/lights.html">Supported lights</a>.'),
    ('Do I need a Mac version?', 'GlowBop runs on Windows 10 and 11 for now. Want Mac? Email us. Requests decide what we build next.'),
    ('What music apps does it work with?', 'All of them. GlowBop listens to the sound your computer plays: Spotify, YouTube, Apple Music, Amazon Music, DJ software, videos, anything.'),
    ('Can I play music from my phone?', 'GlowBop listens on the computer, so play the music on the computer and send it to your speakers. Bluetooth speakers work; use the Sync slider to line them up.'),
    ('Does it need a microphone or a dongle?', 'No. It listens to the computer\'s own sound, so room noise and talking don\'t throw it off.'),
    ('Do I need to install an app on my phone?', 'No. Scan the QR code and the remote opens in your phone\'s browser. Add it to your home screen for an app icon.'),
    ('Can it just be a fireplace?', 'Yes. Tap 🔥 Light the fire and the whole wall becomes flickering flames, no fireplace frame or logs. Pick from 7 colors and Cozy or Roaring. See the <a href="/guide/fireplace.html">Fireplace guide</a>.'),
    ('Can I use it outside or at a game?', 'Yes. At home, use your Wi-Fi. At a field, connect the laptop to your phone\'s hotspot. Battery-powered curtains make this easy.'),
    ('How many curtains can I connect?', 'Up to 4 as one wall, side by side or stacked. You can also split lights into groups that each run their own show.'),
    ('Will it slow down my computer?', 'GlowBop is light. A normal laptop runs the show and music at the same time. Plug in for long parties.'),
    ('Is my data private?', 'GlowBop runs on your computer. It doesn\'t record or upload your music. Song lookup only sends the song title and artist to look up genre and tempo.'),
    ('When does it launch?', 'Halloween 2026. <a href="' + WAIT + '">Join the launch list</a> and we\'ll email you.'),
]
faq = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">FAQ</span><h1>Questions, <span class="grad">answered</span></h1>
<p class="lead">Can't find yours? Email <a href="mailto:{MAIL}">{MAIL}</a>.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:820px">{''.join(f'<details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in Q)}</div></section>{band()}'''
page('/faq.html', 'FAQ · GlowBop', 'Answers about GlowBop: supported lights, music apps, phone remote, outdoor use, privacy and launch date.', faq, '/faq.html')

# ================================================================ 404
page('/404.html', 'Page not found · GlowBop', 'This page is not here.', f'''<section><div class="wrap center"><h1>4<span class="grad">0</span>4</h1><p class="lead">This page went dark.</p>
<div style="max-width:520px;margin:20px auto">{led('sparkle', 'Lost in the sparkles')}</div><a class="btn primary" href="/">Back home</a></div></section>''')

# ---------- assets + photo list
shutil.copytree(os.path.join(HERE, 'assets'), os.path.join(OUT, 'assets'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'img'), os.path.join(OUT, 'img'), dirs_exist_ok=True)
with open(os.path.join(OUT, 'PHOTOS.md'), 'w') as f:
    f.write('# Photo & video spots\n\nEach animated LED placeholder on the site is waiting for a real photo or clip. Send them over and they get swapped in.\n\n')
    for pth, cap in PHOTOS: f.write(f'- **{pth}**: {cap}\n')
print(len(PHOTOS), 'photo spots')
