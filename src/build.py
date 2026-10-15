"""Builds the GlowBop website into OUT. Every page shares one header/footer; LED placeholders are listed in PHOTOS.md
so real photos can be swapped in later (replace the <figure class="led"> with an <img>)."""
import os, sys, shutil, html
OUT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
MAIL = 'hello@glowbop.com'
WAIT = f'mailto:{MAIL}?subject=GlowBop%20launch%20list&body=Hi!%20Add%20me%20to%20the%20GlowBop%20launch%20list.%0A%0AMy%20lights%3A%20'
PHOTOS = []
CUR = ['']

NAV = [('/features.html', 'Features', 'var(--amber)'), ('/gallery.html', 'Gallery', 'var(--lav)'), ('/guide/', 'Guide', 'var(--cyan)'),
       ('/lights.html', 'Lights', 'var(--orange)'), ('/compare.html', 'Compare', 'var(--violet)'), ('/pricing.html', 'Pricing', 'var(--green)'), ('/faq.html', 'FAQ', 'var(--gold)')]


def logo_svg():
    """The sparkle logo: the app icon's 7x7 Curtain Burst as live SVG dots (site.js makes random dots glint white)."""
    P, V, C, W, D = '#ff3d9a', '#9b3dff', '#33d6ff', '#ffffff', '#221d33'
    M = [[D, D, C, C, C, D, D], [D, C, V, V, V, C, D], [C, V, P, P, P, V, C], [C, V, P, W, P, V, C], [C, V, P, P, P, V, C], [D, C, V, V, V, C, D], [D, D, C, C, C, D, D]]
    dots = ''.join(f'<circle cx="{9 + k * 13}" cy="{9 + r * 13}" r="4.6" fill="{col}"{"" if col == D else " data-l"}/>' for r, row in enumerate(M) for k, col in enumerate(row))
    return ('<span class="gbsvg" role="img" aria-label="GlowBop"><svg viewBox="0 0 96 96" aria-hidden="true"><defs><filter id="gbGlow" x="-1" y="-1" width="3" height="3">'
            '<feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' + dots + '</svg></span>')


def led(scene, caption, w=40, h=21, cls='', demo=False, illus=False):
    if demo:
        return (f'<figure class="led demo {cls}"><canvas data-scene="{scene}" data-w="{w}" data-h="{h}" aria-label="{html.escape(caption)}"></canvas>'
                f'<figcaption>🔴 Live · {html.escape(caption)}</figcaption></figure>')
    if illus:
        return (f'<figure class="led {cls}"><canvas data-scene="{scene}" data-w="{w}" data-h="{h}" aria-label="{html.escape(caption)}"></canvas>'
                f'<figcaption>🎨 Illustration · {html.escape(caption)}</figcaption></figure>')
    PHOTOS.append((CUR[0], caption))
    return (f'<figure class="led {cls}"><canvas data-scene="{scene}" data-w="{w}" data-h="{h}" aria-label="{html.escape(caption)}"></canvas>'
            f'<figcaption>📷 Placeholder · {html.escape(caption)}</figcaption></figure>')


import json as _json
CLIPS = _json.load(open(os.path.join(HERE, 'clips.json')))


def clip(name, caption=None, cls=''):
    m = CLIPS[name]; cap = caption or m['title']
    return (f'<figure class="led real {cls}" style="aspect-ratio:{m['w']}/{m['h']}"><canvas data-clip="{name}" aria-label="{html.escape(cap)}"></canvas>'
            f'<figcaption>🔴 Recorded from GlowBop · {html.escape(cap)}</figcaption></figure>')


def shot(name, alt):
    return (f'<figure class="shot appshot"><img src="/img/{name}.jpg" alt="{html.escape(alt)}" loading="lazy">'
            f'<span class="concept">Real app screenshot</span></figure>')


def pic(name, alt, cls=''):
    return (f'<figure class="shot {cls}"><img src="/img/{name}.jpg" alt="{html.escape(alt)}" loading="lazy" width="1344" height="752">'
            f'<span class="concept">Concept image</span></figure>')


def page(path, title, desc, body, active=''):
    CUR[0] = path
    CLIPS_JS = _json.dumps({k: dict(w=v['w'], h=v['h'], n=v['n'], fps=v['fps'], title=v['title']) for k, v in CLIPS.items()}, separators=(',', ':'))
    nav = ''.join(f'<li><a href="{h}" style="--c:{c}"{" class=on" if h == active else ""}>{n}</a></li>' for h, n, c in NAV)
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
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Share+Tech+Mono&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=3">
<link rel="stylesheet" href="/assets/console.css?v=13">
</head>
<body>
<header class="nav con-hd"><div class="wrap">
  <a class="elbow" href="/" aria-label="GlowBop home">{logo_svg()}</a>
  <div class="con-r">
    <div class="bars" aria-hidden="true"><i></i><i style="--c:var(--amber);--w:30px"></i><i style="--c:var(--lav);--w:20px"></i><i class="grow" style="--c:var(--pink)"></i><b>GLOWBOP</b><i style="--c:var(--violet);--w:44px"></i><i style="--c:var(--cyan);--w:24px"></i></div>
    <div class="row">
      <div class="who"><span class="k">LIGHT SHOW CONSOLE</span><span class="v"><i></i>LAUNCHING OCT 31</span></div>
      <ul>{nav}</ul>
      <a class="btn primary small cta" href="/pricing.html">Try free 7 days</a>
      <button class="burger" aria-label="Menu">MENU</button>
    </div>
  </div>
</div></header>
{body}
<footer><div class="wrap">
  <div class="con-ft" aria-hidden="true"><div class="elbow"></div><div class="bars"><i></i><i style="--c:var(--amber);width:36px"></i><span class="grow" style="--c:var(--violet)">GLOWBOP · YOUR LIGHTS, DANCING TO YOUR MUSIC</span><i style="--c:var(--orange);width:28px"></i><span style="--c:var(--pink)">V1.0</span></div></div>
  <div class="cols">
    <div><a class="brand" href="/">{logo_svg()}GlowBop</a>
      <p class="dim" style="margin-top:12px;font-size:15px;max-width:34ch">Your lights, dancing to your music. A light show app for LED curtains, made in Fort Myers, Florida.</p>
      <a class="btn small" href="{WAIT}">✉️ Join the launch list</a></div>
    <div><h4>Product</h4><ul><li><a href="/features.html">Features</a></li><li><a href="/gallery.html">Gallery</a></li><li><a href="/lights.html">Supported lights</a></li><li><a href="/compare.html">Compare</a></li><li><a href="/pricing.html">Pricing</a></li></ul></div>
    <div><h4>Guide</h4><ul><li><a href="/guide/getting-started.html">Getting started</a></li><li><a href="/guide/music.html">Music show</a></li><li><a href="/guide/scoreboard.html">Scoreboard</a></li><li><a href="/guide/troubleshooting.html">Troubleshooting</a></li></ul></div>
    <div><h4>Help</h4><ul><li><a href="/download.html">Download</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/support.html">Report a bug</a></li><li><a href="/support.html#request">Request a feature</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li></ul></div>
  </div>
  <div class="fine"><span><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a></span><span>© 2026 GlowBop, a product of Marketing Savvy LLC. Twinkly, Govee and other brand names belong to their owners. GlowBop is not affiliated with them.</span>
  <span>Tempo data by <a href="https://getsongbpm.com" rel="noopener">GetSongBPM</a> · Genre data by <a href="https://www.last.fm" rel="noopener">Last.fm</a></span></div>
</div></footer>
<script>window.GB_CLIPS={CLIPS_JS};</script>
<script src="/assets/site.js?v=11"></script>
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
TICK_ITEMS = ['200+ EFFECTS', '44 LIVE LEAGUES', 'DJ MODE', 'SEES THE DROP COMING', '9 FIRE STYLES', '8 ARCADE GAMES', 'F1 RACE DAY', 'REMEMBERS YOUR SONGS', 'HOLIDAY MINI-MOVIES', '3D SHAPES', '1–8 CURTAINS', 'LIVE WEATHER']
def ticker():
    run = ''.join(f'<span>{t}</span><i>★</i>' for t in TICK_ITEMS)
    return f'<div class="ledtick" aria-label="{html.escape(" · ".join(TICK_ITEMS))}"><div class="ledtick-run" aria-hidden="true">{run}{run}</div></div>'

FEATS = [
    ('🧠', 'Hears the whole song', 'Not just the beat: it sees the drop coming, remembers your songs, counts the bars and reads the mood. The most advanced music brain for LED lights.', '/guide/music.html'),
    ('🎛️', 'A real light console', 'A new control panel for phone, iPad and laptop, with a live view of your wall and big colored keys.', '/guide/console.html', 1),
    ('🎨', '34 looks, 200+ effects', 'Neon Party, Deep Space, Retro Arcade, the new Big Wave and 3D Object looks and more.', '/guide/looks.html', 1),
    ('📡', 'Live feeds', 'Countdowns, weather, storm watch, and the planes and space station flying over your house.', '/guide/live-feeds.html', 1),
    ('🏟️', 'Sports + live stats', '44 leagues with live stats, from the NFL to the Bundesliga, college softball and cricket, plus golf, racing, tennis, UFC and F1 boards.', '/guide/scoreboard.html', 1),
    ('🏎️', 'F1 race day', 'Live timing in team colors, a DRS attack bar, and the wall explodes for a new leader, the safety car and the chequered flag.', '/guide/scoreboard.html#f1', 1),
    ('🌐', '3D shapes', 'Wrap your curtains around a cylinder, a box or a globe for a glowing art piece.', '/guide/shapes.html', 1),
    ('🧩', '1 to 8 curtains', 'Side by side, stacked, overlapping or a grid of rows and columns. Every show resizes to fit.', '/guide/lineup.html', 1),
    ('🎃', 'Holidays & mini-movies', 'Halloween, Christmas, New Year and more, with full animated scenes for the big nights.', '/guide/holidays.html'),
    ('🔥', 'Nine kinds of fire', 'Fireplace, campfire, bonfire, candles, torches, pixel flames, spirit fire, lava and dragon breath.', '/guide/fireplace.html', 1),
    ('🎧', 'DJ mode', 'Hit pads that land on the beat, hold-to-build drops, cue the next look, tap tempo and crowd lines.', '/guide/dj.html', 1),
    ('🕹️', 'Arcade games', 'Breakout, Snake, Pong, Alien parade and more, playing themselves on your wall.', '/guide/looks.html#games', 1),
    ('🔤', 'Text & logos', 'Party messages, names, your DJ logo. Scroll it, flash it on every drop.', '/guide/text-logos.html'),
    ('📺', 'Screen mirror', 'Put the game, a movie or a music video right on the lights.', '/guide/text-logos.html#mirror'),
    ('📱', 'Phone, iPad, laptop', 'Scan a QR code and the console opens in your browser. Nothing to install, turns sideways on iPad.', '/guide/getting-started.html#phone'),
]


WALLR = _json.load(open(os.path.join(HERE, 'wallrects.json')))
LIVEWALL = {'phone-music': 'wave-serpent', 'phone-live': 'live-weather', 'phone-score': 'score-soccer', 'phone-looks': 'wave-twinwaves',
            'ipad-land': 'wave-bigwave', 'ipad-port': 'fx-pixelfireworks', 'desk-live': 'live-countdown'}


def devframe(kind, img, alt, tag='', c='var(--amber)', cap=''):
    inner = f'<img src="/img/app/{img}.webp" alt="{html.escape(alt)}" loading="lazy">'
    if img in LIVEWALL:                      # the live wall in the screenshot plays a real recording, like the real app
        x, y, w, h = WALLR[img]
        inner += f'<canvas class="wallov" data-clip="{LIVEWALL[img]}" style="left:{x}%;top:{y}%;width:{w}%;height:{h}%" aria-hidden="true"></canvas>'
    base = '<div class="base"></div>' if kind == 'laptop' else ''
    t = f'<span class="tag" style="--c:{c}">{tag}</span>' if tag else ''
    fc = f'<figcaption>{cap}</figcaption>' if cap else ''
    return f'<figure class="dev {kind} reveal">{t}<div class="scr">{inner}</div>{base}{fc}</figure>'


DEMO = f'''<div class="demo" id="demo" aria-label="Try the GlowBop console">
  <div class="d-top"><div class="el">{logo_svg()}</div><div class="br"><div class="bb"><i style="--c:var(--amber);--w:30px"></i><i style="--c:var(--lav);--w:18px"></i><i class="grow" style="--c:var(--pink)"></i><b>GLOWBOP</b><i style="--c:var(--cyan);--w:22px"></i></div>
  <div class="st"><span class="k">LIGHT SHOW CONSOLE</span>ONLINE · LISTENING</div></div></div>
  <nav class="d-rail" aria-label="Console sections"></nav>
  <div class="d-main">
    <div class="d-wall"><div class="ph"><span>Live wall</span><span class="r">840 BULBS</span></div>
      <div class="wallbox"><canvas aria-label="The live wall"></canvas></div>
      <div class="mode"><div><b>Music show · listening</b><small>shuffle on</small></div></div>
      <div class="reads"><div><div class="k">Tempo</div><div class="v">128<small style="font-size:14px"> BPM</small></div></div><div><div class="k">Section</div><div class="v p" id="dSec">GROOVE</div></div>
        <div class="meter"></div><div><div class="k">Look</div><div class="v s" id="dLook">–</div></div><div><div class="k">Effect</div><div class="v s" id="dEff" style="color:var(--lav)">–</div></div></div>
    </div>
    <div class="d-panel"><div class="ph"><span>Show control</span><span class="r">TAP A KEY</span></div><p></p><div class="keys"></div>
      <div class="hint">👈 Tap the colored rail to switch sections</div></div>
  </div>
</div>'''
home = f'''
<header class="hero"><div class="wrap">
  <div>
    <span class="pill">🎃 <b>Launching this Halloween</b> · 7-day free trial</span>
    <h1>Your lights,<br><span class="grad">dancing to your music.</span></h1>
    <p class="lead">GlowBop turns LED curtain lights into a live light show that hears every beat, build-up and drop. Run it all from a light-show console on your phone, iPad or laptop.</p>
    <div class="btns"><a class="btn primary" href="{WAIT}">✉️ Join the launch list</a><a class="btn chase" href="/try/" style="--c:var(--cyan)">🎛️ Try the real app now</a></div>
    <div class="stats"><div><b>200+</b>effects</div><div><b>44</b>live leagues</div><div><b>9</b>fire styles</div><div><b>8</b>arcade games</div><div><b>1–8</b>curtains</div></div>
  </div>
  <figure class="shot hero-shot livehero"><img src="/img/pool-party.jpg" alt="Two LED curtains playing a GlowBop light show behind a pool party at night" width="1344" height="752"><canvas data-hero="look-psychedelic,fire-rainbow-cozy,look-hypnotic,look-rainbow-riot,look-3d-depth,shape-barberspin,look-warehouse-rave,fx-pixelfireworks,look-dance-crew,look-retro-arcade,look-neon-party,look-wild-elements,look-chaos,look-hyperspace,look-toxic-rave,fx-tesseract,score-baseball,live-nascar,score-football,live-golf,score-f1,f1-win,look-midnight-galaxy,look-liquid-dreams,look-lava-lounge,wave-serpent,look-royal-gold,look-wild-card,look-synthwave,fx-laserweb,shape-spinningglobe,look-club-rig,wave-bigwave,fire-classic-roar,fx-volcano,look-studio-54" aria-hidden="true"></canvas><span class="concept">Concept photo · real GlowBop patterns</span></figure>
</div></header>
{ticker()}

<section class="tight" id="try"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--green)">Try it right here</span><h2>Drive the light show</h2>
  <p class="lead">This is the GlowBop console. Tap the colored rail on the left, then tap a key. The little wall plays real recordings from the GlowBop engine.</p></div>
  <div class="reveal">{DEMO}</div>
  <p class="center"><span class="demo-tag">● DEMO · on your lights it runs live, right to the beat</span></p>
  <div class="center reveal" style="margin-top:22px"><a class="btn primary lg" href="/try/">🚀 Open the full GlowBop app</a>
  <p class="lead" style="margin-top:12px;font-size:16px">Every page, every control: music, DJ, looks, games, scenes, holidays, fire, sports, live feeds and text. It runs right in your browser on a phone, iPad or laptop, on a pretend light wall.</p></div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--cyan)">Real screenshots</span><h2>One console, every screen</h2>
  <p class="lead">Scan a QR code and the console opens in your browser. On iPad it turns sideways into a big two-column board with the live wall on the left.</p></div>
  <div class="devices">
    {devframe('laptop', 'desk-live', 'GlowBop console on a laptop with a party countdown on the live wall', 'Laptop', 'var(--amber)', 'LIVE tab: a party countdown on the wall')}
    {devframe('tablet', 'ipad-land', 'GlowBop console on an iPad held sideways, Big Wave playing', 'iPad', 'var(--cyan)', 'iPad sideways: wall left, controls right')}
  </div>
  <div class="phones">
    {devframe('phone', 'phone-music', 'GlowBop on iPhone: the Serpent effect, tempo and Now Playing', 'Music', 'var(--pink)')}
    {devframe('phone', 'phone-live', 'GlowBop on iPhone: the LIVE tab with weather on the wall', 'Live', 'var(--green)')}
    {devframe('phone', 'phone-score', 'GlowBop on iPhone: the SPORTS section with a goal on the wall', 'Sports', 'var(--violet)')}
    {devframe('phone', 'phone-looks', 'GlowBop on iPhone: the list of looks', 'Looks', 'var(--amber)')}
  </div>
</div></section>

<section class="tight"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--pink)">🔴 Showreel</span><h2>This is really GlowBop</h2>
  <p class="lead">Not a mock-up: every frame below was recorded straight from the GlowBop engine on a two-curtain wall.</p></div>
  <figure class="led real reel reveal" style="aspect-ratio:40/21;margin-top:26px"><canvas data-reel="look-psychedelic,fire-rainbow-cozy,look-hypnotic,look-rainbow-riot,look-3d-depth,shape-barberspin,look-warehouse-rave,fx-pixelfireworks,look-dance-crew,look-retro-arcade,look-neon-party,look-wild-elements,look-chaos,look-hyperspace,look-toxic-rave,fx-tesseract,score-baseball,live-nascar,score-football,live-golf,score-f1,f1-win,look-midnight-galaxy,look-liquid-dreams,look-lava-lounge,wave-serpent,look-royal-gold,look-wild-card,look-synthwave,fx-laserweb,shape-spinningglobe,look-club-rig,wave-bigwave,fire-classic-roar,fx-volcano,look-studio-54" data-label="reelName" aria-label="GlowBop showreel"></canvas>
  <figcaption>🔴 Recorded from GlowBop · <b id="reelName">Psychedelic</b></figcaption></figure>
  <p class="center" style="margin-top:18px"><a class="btn" href="/gallery.html">See every pattern in the gallery →</a></p>
</div></section>

<section class="alt"><div class="wrap">
  <div class="center reveal"><span class="eyebrow">How it works</span><h2>From box to light show in 5 minutes</h2>
  <p class="lead">No DMX, no light programming, no extra music gadgets. If music plays on your computer, GlowBop can see it.</p></div>
  <div class="grid g3 steps" style="margin-top:36px">
    <div class="card reveal"><h3>Hang your lights</h3><p>Hang your curtains and connect them with the maker's app, like you normally would.</p></div>
    <div class="card reveal"><h3>Open GlowBop</h3><p>It finds your lights on Wi-Fi and Bluetooth, then a quick line-up wizard tells it which way is up and which hangs where.</p></div>
    <div class="card reveal"><h3>Press play</h3><p>Play any song from Spotify, YouTube, Apple Music or a DJ app. The wall starts dancing. Grab the console on your phone.</p></div>
  </div>
</div></section>

<section class="tight"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--gold)">By the numbers</span><h2>A ton of light show in one app</h2></div>
  <div class="nums"><div class="num reveal" style="--c:var(--pink)"><b>227</b><span>effects</span></div><div class="num reveal" style="--c:var(--amber)"><b>34</b><span>looks</span></div><div class="num reveal" style="--c:var(--violet)"><b>44</b><span>live sports leagues</span></div><div class="num reveal" style="--c:var(--lav)"><b>18</b><span>Game Day sports</span></div><div class="num reveal" style="--c:var(--orange)"><b>9</b><span>fire styles</span></div><div class="num reveal" style="--c:var(--cyan)"><b>9</b><span>holidays + 4 mini-movies</span></div><div class="num reveal" style="--c:var(--lime)"><b>8</b><span>arcade games</span></div><div class="num reveal" style="--c:var(--green)"><b>6</b><span>live feeds</span></div><div class="num reveal" style="--c:var(--red)"><b>6</b><span>DJ hit pads</span></div><div class="num reveal" style="--c:var(--gold)"><b>8</b><span>curtains in one wall</span></div><div class="num reveal" style="--c:var(--peri)"><b>3</b><span>3D shapes</span></div><div class="num reveal" style="--c:var(--lav)"><b>4</b><span>console sound styles</span></div></div>
  <div class="cloud reveal"><a href="/guide/music.html">Build-up & drop detection</a><a href="/guide/music.html#epic">Epic mode for movie music</a><a href="/guide/music.html#memory">Song memory</a><a href="/guide/music.html#sync">Bluetooth speaker sync</a><a href="/guide/dj.html#pads">DJ hit pads</a><a href="/guide/dj.html#build">Hold to build, let go to drop</a><a href="/guide/dj.html#cue">Cue the next look</a><a href="/guide/dj.html#tap">Tap tempo</a><a href="/guide/dj.html#crowd">Crowd lines</a><a href="/guide/dj.html#controller">DJ controller support</a><a href="/guide/looks.html">34 looks</a><a href="/guide/looks.html#wave">Big Wave effects</a><a href="/guide/looks.html#3d">3D depth & club rigs</a><a href="/guide/looks.html">Pixel dancers</a><a href="/guide/looks.html#scenes">Describe a scene in words</a><a href="/guide/looks.html#transitions">Transitions</a><a href="/guide/looks.html#games">Arcade games</a><a href="/guide/looks.html#games">Arcade marathon</a><a href="/guide/holidays.html#movies">Holiday mini-movies</a><a href="/guide/holidays.html">9 holidays</a><a href="/guide/fireplace.html#styles">9 fire styles</a><a href="/guide/fireplace.html#colors">Team-color fire</a><a href="/guide/fireplace.html#colors">Night shift fire</a><a href="/guide/fireplace.html#music">Flare on the beat</a><a href="/guide/scoreboard.html#gameday">Game Day scoreboard</a><a href="/guide/scoreboard.html#live">44 live leagues</a><a href="/guide/scoreboard.html#stats">Live baseball diamond</a><a href="/guide/scoreboard.html#stats">Game Center stats</a><a href="/guide/scoreboard.html#f1">F1 live board</a><a href="/guide/scoreboard.html#boards">Golf leaderboards</a><a href="/guide/scoreboard.html#boards">NASCAR & IndyCar</a><a href="/guide/scoreboard.html#boards">Tennis</a><a href="/guide/scoreboard.html#boards">UFC</a><a href="/guide/scoreboard.html#timer">Countdown clock</a><a href="/guide/live-feeds.html#countdown">Party countdowns</a><a href="/guide/live-feeds.html#weather">Weather sky</a><a href="/guide/live-feeds.html#storm">Storm watch</a><a href="/guide/live-feeds.html#overhead">Planes & space station overhead</a><a href="/guide/text-logos.html#text">Text & beat words</a><a href="/guide/text-logos.html#logo">Your logo</a><a href="/guide/text-logos.html#mirror">Screen mirror</a><a href="/guide/lineup.html">Up to 8 curtains</a><a href="/guide/lineup.html#grid">Grid walls</a><a href="/guide/lineup.html#overlap">Overlapping curtains</a><a href="/guide/shapes.html">3D cylinder, box & globe</a><a href="/guide/lineup.html#camera">Camera mapping</a><a href="/guide/groups.html">Light groups</a><a href="/lights.html">Twinkly, WLED, Govee</a><a href="/lights.html">Bluetooth curtains & DayBetter</a><a href="/guide/console.html">Console for phone, iPad & laptop</a><a href="/guide/console.html#modebar">Back to music key</a><a href="/guide/console.html#extras">Screen stays on</a><a href="/guide/console.html#extras">Console sounds</a><a href="/support.html">Help & feedback in the app</a></div>
</div></section>

<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Everything in the box</span><h2>One app, every kind of party</h2>
  <p class="lead">Pool party, DJ gig, Halloween night or the big game. Tap a panel to see how it works.</p></div>
  <div class="grid g3" style="margin-top:36px">
  {''.join(f'<a class="card reveal" href="{f[3]}"><div class="em">{f[0]}</div><h3>{f[1]}{"<span class=new>NEW</span>" if len(f) > 4 else ""}</h3><p>{f[2]}</p><span class="more">How it works →</span></a>' for f in FEATS)}
  </div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="feat reveal">
    <div><span class="eyebrow">New · DJ mode</span><h2>Play the lights like a club lighting tech</h2>
      <p class="lead">DJ has its own key. The music show keeps running and you add moves on top, by hand, and every one lands right on the beat.</p>
      <ul class="ticks"><li><b>Hit pads:</b> drop, strobe, flash, fire burst, confetti and blackout.</li><li><b>Hold to build</b>, let go to drop.</li><li><b>Cue the next look</b>, <b>tap tempo</b> and big <b>crowd lines</b> like HANDS UP.</li><li>Plug in a <b>DJ controller</b> and teach it every pad.</li></ul>
      <a class="btn" href="/guide/dj.html">DJ mode guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('drop')}{clip('fx-pixelfireworks')}{clip('text-beat')}{clip('look-club-rig')}</div></div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">New · Fire</span><h2>Nine kinds of fire</h2>
      <p class="lead">From a cozy fireplace to a dragon blasting flame across the wall. Simulated live, so it never loops.</p>
      <ul class="ticks"><li>Fireplace, <b>campfire</b>, <b>bonfire</b>, <b>candle wall</b>, <b>torch row</b>, <b>pixel flames</b>, <b>spirit fire</b>, <b>lava rising</b> and <b>dragon breath</b>.</li><li>Nine colors, including your own <b>team colors</b> and <b>night shift</b>.</li><li><b>Flare on the beat</b> and gusts of wind when the music gets loud.</li></ul>
      <a class="btn" href="/guide/fireplace.html">Fireplace guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('fire-dragon')}{clip('fire-campfire')}{clip('fire-candles-rainbow')}{clip('fire-lava')}</div></div>
  </div>
  <div class="feat reveal">
    <div><span class="eyebrow">New · Games</span><h2>Arcade games that play themselves</h2>
      <p class="lead">GAMES has its own key. Breakout, Snake, Pong, Alien parade, Space rocks, Block drop, Light cycles and Game of life, speeding up with the music. Or run the Arcade marathon.</p>
      <a class="btn" href="/guide/looks.html#games">Games in the guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('fx-breakout')}{clip('fx-snakegame')}{clip('fx-pongbattle')}{clip('fx-alienparade')}</div></div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">New · Big Wave</span><h2>Waves that roll across the wall</h2>
      <p class="lead">A whole new family of effects: a giant glowing wave, a serpent that swims the length of your wall, twin waves and a deep ocean swell.</p>
      <ul class="ticks"><li><b>Big Wave</b> rolls and crests on the beat.</li><li><b>Serpent</b> swims a smooth path with a glowing head.</li><li><b>Twin Waves</b> and <b>Ocean Swell</b> for slower, dreamy songs.</li></ul>
      <a class="btn" href="/guide/looks.html#wave">Big Wave in the guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('wave-bigwave', 'Big Wave')}{clip('wave-serpent', 'Serpent')}{clip('wave-twinwaves', 'Twin Waves')}{clip('wave-oceanswell', 'Ocean Swell')}</div></div>
  </div>
  <div class="feat reveal">
    <div><span class="eyebrow">New · Live feeds</span><h2>The outside world, on your lights</h2>
      <p class="lead">Tap LIVE and pick a feed. It takes over the wall until you turn it off. Storm watch runs quietly on top of the music and only flashes when something happens.</p>
      <ul class="ticks"><li><b>Countdown</b> to a party, a birthday or New Year, with a fireworks finale.</li><li><b>Weather</b> with an animated pixel sky, today's high and low and the next hours.</li><li><b>Storm watch</b> flashes new National Weather Service warnings, only if you turn it on.</li><li>The <b>planes and space station overhead</b>, right now.</li></ul>
      <a class="btn" href="/guide/live-feeds.html">Live feeds guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('live-countdown', 'Countdown')}{clip('live-weather', 'Weather')}{clip('live-storm', 'Storm watch')}{clip('live-overhead', 'Overhead now')}</div></div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">New · 3D shapes</span><h2>Bend your lights into art</h2>
      <p class="lead">Wrap curtains around a cylinder, a box or a globe. GlowBop blends the seam so the picture goes all the way around, then plays effects made for 3D: a spinning globe, barber stripes, rising rings and a bouncing ball.</p>
      <ul class="ticks"><li>A <b>3D preview</b> you can drag to spin, right in the app.</li><li>Add a <b>lid curtain</b> on top of a cylinder or box.</li></ul>
      <a class="btn" href="/guide/shapes.html">3D shapes guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('shape-spinningglobe')}{clip('shape-barberspin')}{clip('shape-risingrings')}{clip('look-3d-depth')}</div></div>
  </div>
  <div class="feat reveal">
    <div><span class="eyebrow">Smarter than "sound reactive"</span><h2>It knows a drop when it hears one</h2>
      <p class="lead">Most light apps flash on every beat. GlowBop follows the whole song.</p>
      <ul class="ticks"><li><b>Build-ups</b> fill the wall slowly, getting brighter and busier.</li><li><b>Drops</b> hit with a burst, a new effect and a color change.</li><li><b>Quiet parts</b> go soft and flowing so the room can breathe.</li><li><b>Epic songs</b> get one big climax instead of strobes.</li></ul>
      <a class="btn" href="/guide/music.html">How the music show works →</a></div>
    <div class="media">{clip('drop', 'a build-up and the drop')}</div>
  </div>
  <div class="feat flip reveal">
    <div><span class="eyebrow">Game day</span><h2>A scoreboard as big as your wall</h2>
      <p class="lead">Keep score at the field, follow any of 44 leagues live with real game stats, or put golf, racing, tennis, UFC and F1 on the wall.</p>
      <ul class="ticks"><li><b>44 live leagues</b>: pro, women's, college and world soccer, plus 18 sports for Game Day.</li><li><b>Live stats</b>: the count, runners on base, batter and pitcher, the last play, down and distance.</li><li><b>Game Center</b> on your phone with the linescore and leaders.</li><li><b>Golf, NASCAR, IndyCar, tennis, UFC and F1</b> boards with celebrations for a new leader, a set or a knockout.</li></ul>
      <a class="btn" href="/guide/scoreboard.html">Sports guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('score-baseball', 'Baseball')}{clip('score-football', 'Football')}{clip('live-golf', 'Golf')}{clip('live-nascar', 'NASCAR')}</div></div>
  </div>
  <div class="feat reveal">
    <div><span class="eyebrow">Holidays</span><h2>Mini-movies for the big nights</h2>
      <p class="lead">Each holiday has its own button, with full wide-screen stories for Halloween, Thanksgiving, Christmas and New Year that stretch across every curtain.</p>
      <a class="btn" href="/guide/holidays.html">See the holidays →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('movie-halloweennight')}{clip('movie-christmaseve')}{clip('movie-newyearcountdown')}{clip('holiday-july4')}</div></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Why GlowBop</span><h2>What other light apps don't do</h2>
  <p class="lead">We compared GlowBop with the apps people use today. Here is the short version.</p></div>
  <div class="grid g4" style="margin-top:32px">
    <div class="card reveal"><div class="em">🎚️</div><h3>Drop detection</h3><p>None of the apps we checked advertise build-up or drop detection.</p></div>
    <div class="card reveal"><div class="em">💻</div><h3>No extra box</h3><p>Uses the music your computer already plays. No mic dongle, no HDMI sync box.</p></div>
    <div class="card reveal"><div class="em">🏟️</div><h3>Scoreboards</h3><p>Game day and live scores with real stats on your lights. We found this nowhere else.</p></div>
    <div class="card reveal"><div class="em">🧩</div><h3>Up to 8 curtains</h3><p>Rows, columns, stacks or 3D shapes. One show across all of them.</p></div>
  </div>
  <p class="center" style="margin-top:24px"><a class="btn" href="/compare.html">See the full comparison →</a></p>
</div></section>

<section class="alt tight"><div class="wrap center reveal">
  <span class="eyebrow">Supported lights</span><h2>Works with Twinkly today</h2>
  <p class="lead">Twinkly curtains are fully supported. WLED, Govee, TikTok-style Bluetooth pixel curtains and DayBetter strips are built in and being tested on real lights now.</p>
  <div class="btns" style="justify-content:center"><a class="btn" href="/lights.html">Check your lights →</a></div>
</div></section>

<section class="tight"><div class="wrap"><a class="launchban reveal" href="{WAIT}"><img src="/img/launch-banner.jpg" alt="GlowBop launches October 31. Light up Halloween. Join the launch list." loading="lazy"></a></div></section>
<section><div class="wrap">
  <div class="center reveal"><span class="eyebrow">Pricing</span><h2>A whole light show crew for $5.99 a month</h2>
  <p class="lead">$5.99 a month, $59 a year, or $379 once and it's yours. 🎃 <b>Founder launch deal: lifetime for $129</b> during launch week or for the first 100 buyers. Every plan starts with a 7-day free trial.</p>
  <div class="btns" style="justify-content:center"><a class="btn primary" href="/pricing.html">See plans</a></div></div>
</div></section>
{band()}
'''
page('/', 'GlowBop · Your lights, dancing to your music',
     'GlowBop turns LED curtain lights into a music-reactive light show run from a light-show console on your phone, iPad or laptop: drop detection, live feeds, 3D shapes, scoreboards, holiday mini-movies. Launching Halloween 2026.', home)

# ================================================================ FEATURES
import re
slug = lambda t: re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')


def feat(i, scene, cap, eyebrow, title, lead, ticks, link, label):
    flip = ' flip' if i % 2 else ''
    return f'''<div class="feat{flip} reveal" id="{slug(eyebrow)}">
<div><span class="eyebrow">{eyebrow}</span><h2>{title}</h2><p class="lead">{lead}</p>
<ul class="ticks">{''.join(f'<li>{t}</li>' for t in ticks)}</ul><a class="btn" href="{link}">{label} →</a></div>
<div class="media">{media(scene, cap)}</div></div>'''


def media(scene, cap):
    if scene.startswith('@'): return pic(scene[1:], cap)
    if scene.startswith('#'): return clip(scene[1:], cap)
    if scene.startswith('!'):
        kind, img = scene[1:].split(':')
        return devframe(kind, img, cap)
    if scene.startswith('~'): return (f'<figure class="led real reel" style="aspect-ratio:40/21"><canvas data-reel="{scene[1:]}" aria-label="{html.escape(cap)}"></canvas>'
                                       f'<figcaption>🔴 Recorded from GlowBop · {html.escape(cap)}</figcaption></figure>')
    if scene.startswith('%'): return '<div class="grid g2 mini">' + ''.join(clip(n) for n in scene[1:].split(',')) + '</div>'
    return led(scene, cap, illus=True)

F2 = [
    ('!tablet:ipad-land', 'The GlowBop console on an iPad held sideways', 'The console', 'A light-show console in your pocket',
     'GlowBop has a brand-new control panel. A colored side rail jumps between sections, the live wall shows exactly what your lights are doing, and big keys sized for thumbs run the show.',
     ['<b>Nine sections</b> on the rail: Music, Looks, Scenes, Holiday, Fire, Sports, Live, Text and Setup.', '<b>Live wall</b> mirrors your lights in real time. Tap <span class="k">Full view</span> for the whole screen.', '<b>iPad sideways</b> becomes a two-column board: wall on the left, controls on the right.', 'Console <b>sounds</b> with a mute key, a <b>screen-stays-on</b> switch, and a friendly screen if the laptop goes out of reach.'],
     '/guide/console.html', 'Console guide'),
    ('%wave-bigwave,wave-serpent,wave-twinwaves,wave-oceanswell', 'Big Wave effects', 'Big Wave', 'Waves that roll across the wall',
     'A new family of flowing effects with its own look. A giant wave crests on the beat, a serpent swims the length of your wall with a glowing head, twin waves cross and an ocean swell rolls in slow.',
     ['<b>Big Wave</b>, <b>Serpent</b>, <b>Twin Waves</b> and <b>Ocean Swell</b>.', 'Their own <b>Big Wave</b> look, and they show up in Molten, Neon Party and Storm &amp; Sea too.', 'Smooth on one curtain, spectacular across eight.'],
     '/guide/looks.html#wave', 'Big Wave in the guide'),
    ('%live-countdown,live-weather,live-overhead,live-storm', 'Live feeds', 'Live feeds', 'The outside world, live on your lights',
     'Tap LIVE and pick a feed. It takes over the wall until you turn it off. Set your ZIP code or city once for weather, storms and what\'s overhead.',
     ['<b>Countdown</b> to anything, with giant seconds at the end and a fireworks finale.', '<b>Weather</b>: big temperature over an animated pixel sky, today\'s high and low, the next hours.', '<b>Storm watch</b>: flashes new National Weather Service warnings over the music, only if you turn it on. Tap Stop any time.', '<b>Overhead now</b>: planes flying over your house and the space station.'],
     '/guide/live-feeds.html', 'Live feeds guide'),
    ('%shape-spinningglobe,shape-barberspin,shape-risingrings,look-3d-depth', '3D effects', '3D shapes', 'Bend your lights into art',
     'Wrap your curtains around a cylinder, a box or a globe. GlowBop knows the shape, blends the seam so the picture goes all the way round, and plays effects made for 3D.',
     ['<b>Cylinder</b>, <b>box</b> or <b>globe</b>, with an optional <b>lid</b> curtain on top.', '<b>3D effects</b>: Spinning Globe, Barber Spin, Rising Rings and Bounce Ball in the <b>3D Object</b> look.', 'A <b>3D preview</b> in the app you can drag to spin.'],
     '/guide/shapes.html', '3D shapes guide'),
    ('#drop', 'A build-up and the drop', 'Music show', 'Hears the music, follows the song',
     'GlowBop listens to the sound your computer is playing, so it works with any app: Spotify, YouTube, Apple Music, Serato, a playlist on a USB stick.',
     ['<b>Beat, bass and melody</b> each drive different parts of the show.', '<b>Build-ups and drops</b> get their own moves.', '<b>Pace</b> Chill, Normal or Hype, and <b>Sparkles</b> Off, Auto or Lots.', '<b>Sync slider</b> lines the lights up with Bluetooth speakers that run late.', '<b>Song memory</b> remembers how each song went the next time it plays.'],
     '/guide/music.html', 'Music show guide'),
    ('#climax', 'The big moment of an epic song', 'Epic mode', 'Made for movie music',
     'Cinematic songs don\'t have a "drop". They swell for minutes and peak once. GlowBop notices and switches to Epic mode on its own.',
     ['A slow, growing <b>swell</b> through the crescendo.', '<b>One big climax</b> at the real peak, not every loud moment.', 'No harsh strobes during the quiet, emotional parts.', 'Optional <b>song lookup</b> uses free genre data to spot soundtracks even faster.'],
     '/guide/music.html#epic', 'About Epic mode'),
    ('#look-neon-party', 'Neon Party look', 'Looks', '34 looks, 200+ effects',
     'A look is a mood: its colors plus a set of effects for calm, medium and loud parts. GlowBop shuffles through them as the music changes.',
     ['Neon Party, Deep Space, Synthwave, Warehouse Rave, Mainstage, Club Rig, Royal Gold and more.', '<b>3D Depth</b> tunnels, spinning cubes and disco spheres.', '<b>Dance Crew</b> pixel characters you can switch on or off.', '<b>Describe a scene</b> in words and GlowBop builds it.', '<b>Pin</b> an effect you love, or hit <b>Surprise me</b>.'],
     '/guide/looks.html', 'Looks guide'),
    ('%fx-breakout,fx-snakegame,fx-pongbattle,fx-alienparade', 'Arcade games', 'Games', 'Games that play themselves',
     'GAMES has its own key on the rail. Tap a game and it plays itself across your wall, speeding up with the music. Or start the Arcade marathon and GlowBop plays them all in turn.',
     ['<b>8 games:</b> Breakout, Snake, Pong, Alien parade, Space rocks, Block drop, Light cycles and Game of life.', '<b>Breakout</b>: bricks burst into sparks. <b>Snake</b>: a rainbow snake hunts glowing food.', '<b>Pong</b>: the ball smashes on the beat.', '<b>♫ Back to music</b> under the wall ends the game.'],
     '/guide/looks.html#games', 'Games in the guide'),
    ('%drop,fx-pixelfireworks,look-club-rig,text-beat', 'DJ mode', 'DJ mode', 'Play the lights like a club lighting tech',
     'DJ has its own key on the rail. The music show keeps running, and you add moves on top, by hand, right on the beat.',
     ['<b>Hit pads</b>: Drop, Strobe, Flash, Fire burst, Confetti, all landing on the next beat. <b>Blackout</b> holds the wall dark.', '<b>Hold to build</b>: the wall winds up brighter and faster; let go and it drops.', '<b>Cue the next look</b> to come in on the next drop.', '<b>Tap tempo</b> when the room is too loud, and <b>crowd lines</b> like HANDS UP in big letters.', '<b>DJ controller</b>: plug a USB pad controller into the laptop and teach it every pad.'],
     '/guide/dj.html', 'DJ mode guide'),
    ('%fx-volcano,fx-tornado,fx-rainonglass,fx-solarflare', 'Wild Elements effects', 'Wild Elements', 'Weather and nature, wired to the beat',
     'A volcano that erupts on the drop, a tornado that wanders across the wall, rain on the window, a waterfall and the surface of the sun.',
     ['<b>Volcano</b>: lava bombs fly on the drop.', '<b>Tornado</b>: debris spins faster as the song builds.', '<b>Rain on glass</b>, <b>Waterfall</b>, <b>Solar flare</b>.'],
     '/gallery.html#new', 'See them in the gallery'),
    ('%movie-halloweennight,movie-christmaseve,movie-newyearcountdown,holiday-july4', 'Holiday mini-movies', 'Holidays', 'Every holiday gets its own button',
     'Holidays live in their own section, away from the normal shuffle. Tap one and the wall plays only that holiday until you stop it.',
     ['Halloween, Christmas, Thanksgiving, New Year, Valentine\'s, St. Patrick\'s, Birthday and Game Day.', '<b>Wide-screen mini-movies:</b> Halloween Night, Harvest Day, Christmas Eve and New Year Countdown.', 'Jack-o\'-lanterns, bats, ghosts, a haunted house, sleigh rides, fireworks, a ball drop and more.', 'Choose which holiday effects are in the rotation.'],
     '/guide/holidays.html', 'Holidays guide'),
    ('%fire-campfire,fire-dragon,fire-candles,fire-lava', 'Fire styles', 'Fireplace', 'Nine kinds of fire',
     'Light a fire on your wall with one tap. GlowBop simulates real flames live, so the fire never loops and never looks the same twice.',
     ['<b>9 styles:</b> Fireplace, Campfire, Bonfire, Candle wall, Torch row, Pixel flames, Spirit fire, Lava rising and Dragon breath.', '<b>9 colors:</b> Classic, Blue gas, Purple, Rainbow, Green, Pink, Ice, <b>Team colors</b> (your two colors) and <b>Night shift</b> (slowly drifts through the colors all night).', '<b>Cozy</b> or <b>Roaring</b>, and <b>Dance</b> so the flames swell with your music.', '<b>Flare on the beat:</b> every kick sends the flames up, and loud parts blow gusts of wind through them.'],
     '/guide/fireplace.html', 'Fireplace guide'),
    ('%score-baseball,score-football,live-golf,live-nascar', 'Sports', 'Scoreboard', 'Game Day, Live Fan and F1',
     'Turn the wall into a scoreboard. Keep score yourself from your phone, follow a real game, or watch a Grand Prix.',
     ['<b>Game Day:</b> 15 sports, clock that counts down or up, periods, timeouts, fouls, possession, undo.', '<b>Live Fan:</b> pick a league and team; scores update every 10 seconds and the wall celebrates in team colors.', '<b>Live stats:</b> the count, runners on base, batter and pitcher, the last play scrolling by, down and distance, plus a Game Center on your phone.', '<b>F1:</b> running order, tyres, pit stops, fastest lap, DRS and rain.', '<b>Countdown timer:</b> a huge clock for halftime, a party or New Year.'],
     '/guide/scoreboard.html', 'Scoreboard guide'),
    ('~score-f1,f1-win,f1-safety', 'Live F1: overtake, chequered flag, safety car', 'Formula 1', 'Race day on your wall',
     'The running order lives on your wall in team colors, and every big moment of the race gets its own show: the overtake for the lead, the safety car, the chequered flag.',
     ['<b>Live timing:</b> position, driver, team color tab, tyre dot and the lap count, updating every few seconds.', '<b>DRS attack bar:</b> a flashing bar grows under a driver as they close inside one second.',
      '<b>NEW LEADER</b>, <b>WINNER</b> and <b>POLE</b> explode in the driver\'s team colors.', '<b>Purple</b> for the fastest lap, flashing yellow for the <b>safety car</b>, red flag, chequered flag and rain falling on the wall.',
      'Pit stops get a soft flash. Works for practice, qualifying, sprints and the race.'],
     '/guide/scoreboard.html#f1', 'F1 board guide'),
    ('#text-birthday', 'Happy Birthday scrolling over a live show', 'Text & logos', 'Your words, your logo',
     'Put a message or a logo on top of the show. Great for birthdays, DJ sets, and businesses.',
     ['Modes: <b>Scroll</b>, <b>Beat words</b>, <b>Still</b> and <b>On drop</b>.', 'Colors that follow the look, rainbow, or plain white.', 'Upload a logo (PNG) with Glow, Pulse or Color-shift motion.', 'Flash a word on every drop.'],
     '/guide/text-logos.html', 'Text & logo guide'),
    ('%look-psychedelic,look-hyperspace', 'Screen mirror', 'Screen mirror', 'Your screen, on the lights',
     'Mirror the laptop screen onto the wall: TV shows, music videos, games.',
     ['Styles: <b>TV</b>, <b>Beat</b> and <b>Glow</b>.', '<b>Smart fill</b> trims black bars so the video fills the wall.', '<b>Center zoom</b> for bigger, bolder shapes.'],
     '/guide/text-logos.html#mirror', 'Screen mirror guide'),
    ('#lineup', 'The line-up wizard on four curtains', 'Multi-curtain', 'Up to 8 curtains, one wall',
     'Hang curtains side by side, stack them, or build a grid of rows and columns. GlowBop treats them as one big screen and resizes every show to fit, keeping pixel art crisp.',
     ['<b>Grid walls:</b> tap a shape like 2 × 2, 3 × 2 or 4 × 2 for up to 8 curtains.', 'A <b>line-up wizard</b> shows a number and arrow on each curtain so you can rotate, flip and order them.', '<b>Lock it in</b> so nothing moves by accident.', 'Run them as <b>one show</b> or split them into <b>groups</b> with their own shows.'],
     '/guide/lineup.html', 'Line-up guide'),
    ('!phone:phone-music', 'The GlowBop console on an iPhone', 'Phone & iPad remote', 'Control it all from your phone or iPad',
     'The GlowBop laptop app shows a QR code. Scan it on any phone or tablet on the same Wi-Fi and the full console opens in the browser.',
     ['Live preview of every curtain right on your phone.', 'Big keys sized for thumbs on every section.', 'Add it to your home screen and it opens like an app, with its own icon.', 'Works at the field too, over your phone\'s hotspot.'],
     '/guide/getting-started.html#phone', 'Phone setup'),
]
ORDER = ['Music show', 'DJ mode', 'Big Wave', 'Looks', 'Games', 'Wild Elements', '3D shapes', 'Fireplace', 'Holidays', 'Live feeds', 'Scoreboard', 'Formula 1',
         'Music show', 'Epic mode', 'The console', 'Text & logos', 'Screen mirror', 'Multi-curtain', 'Phone & iPad remote']
F2.sort(key=lambda f: ORDER.index(f[2]) if f[2] in ORDER else 99)
SHOW = [('wave-bigwave', 'Big Wave'), ('fire-rainbow-cozy', 'Rainbow fire'), ('shape-spinningglobe', '3D spinning globe'), ('fx-pixelfireworks', 'Pixel fireworks'),
        ('wave-serpent', 'Serpent'), ('fx-laserweb', 'Laser web'), ('fx-tesseract', 'Tesseract'), ('fx-volcano', 'Volcano'),
        ('look-synthwave', 'Synthwave'), ('live-nascar', 'NASCAR live'), ('score-baseball', 'Baseball live'), ('live-overhead', 'Planes overhead'),
        ('score-f1', 'F1: new leader'), ('f1-win', 'F1: chequered flag'), ('f1-safety', 'F1: safety car'), ('score-football', 'Football live')]
features = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Features</span><h1>Everything <span class="grad">GlowBop</span> can do</h1>
<p class="lead">A music light show, a holiday display, a scoreboard, live feeds and a sign, all run from one light-show console. Every section links to the step-by-step guide.</p></div></header>
{ticker()}
<section class="tight" style="padding-top:0"><div class="wrap">
  <figure class="led real reel reveal" style="aspect-ratio:40/21"><canvas data-reel="look-psychedelic,fire-rainbow-cozy,look-hypnotic,look-rainbow-riot,look-3d-depth,shape-barberspin,look-warehouse-rave,fx-pixelfireworks,look-dance-crew,look-retro-arcade,look-neon-party,look-wild-elements,look-chaos,look-hyperspace,look-toxic-rave,fx-tesseract,score-baseball,live-nascar,score-football,live-golf,score-f1,f1-win,look-midnight-galaxy,look-liquid-dreams,look-lava-lounge,wave-serpent,look-royal-gold,look-wild-card,look-synthwave,fx-laserweb,shape-spinningglobe,look-club-rig,wave-bigwave,fire-classic-roar,fx-volcano,look-studio-54" data-label="featReel" aria-label="GlowBop showreel"></canvas>
  <figcaption>🔴 Recorded from GlowBop · <b id="featReel">Psychedelic</b></figcaption></figure>
  <div class="grid g4 showgrid" style="margin-top:16px">{''.join(f'<div class="gtile reveal">{clip(n, t)}<h3>{t}</h3></div>' for n, t in SHOW)}</div>
  <div class="toc" style="justify-content:center;margin-top:26px">{''.join(f'<a href="#{slug(e)}">{e}</a>' for _, _, e, _, _, _, l, _ in F2)}</div>
</div></section>
<section style="padding-top:20px"><div class="wrap">{''.join(feat(i, *f) for i, f in enumerate(F2))}</div></section>
{band()}'''
# make anchors match toc (feat ids come from the link)
page('/features.html', 'Features · GlowBop', 'The GlowBop console, music show with drop detection, Big Wave, live feeds, 3D shapes, 34 looks, holiday mini-movies, scoreboards with live stats, F1, text, logos, screen mirror and walls of up to 8 curtains.', features, '/features.html')

# ================================================================ GUIDE
G = [
    ('getting-started', '🚀', 'Getting started', 'Install, find your lights, connect your phone.'),
    ('console', '🎛️', 'Using the console', 'The side rail, the live wall, the mode bar and every section.'),
    ('lineup', '🧭', 'Line up your curtains', 'Rotate, flip, order and lock up to 8 curtains, in a row or a grid.'),
    ('shapes', '🌐', '3D shapes', 'Wrap curtains around a cylinder, a box or a globe.'),
    ('music', '🔊', 'Music show', 'How the show follows a song, Epic mode, sync and song lookup.'),
    ('dj', '🎧', 'DJ mode', 'Hit pads, build and drop, cue, tap tempo, crowd lines and DJ controllers.'),
    ('looks', '🎨', 'Looks, effects & games', 'Looks, scenes, pinning, the arcade games and transitions.'),
    ('holidays', '🎃', 'Holidays & mini-movies', 'Holiday buttons and the animated stories.'),
    ('fireplace', '🔥', 'Fireplace', 'Nine fire styles, nine colors, cozy or roaring, flare on the beat.'),
    ('scoreboard', '🏟️', 'Sports', 'Game Day, Live Fan in 44 leagues, F1, golf, racing, tennis, UFC and the countdown clock.'),
    ('live-feeds', '📡', 'Live feeds', 'Countdowns, weather, storm watch and what\'s overhead.'),
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


RAILC = dict(MUSIC='var(--pink)', DJ='var(--red)', GAMES='var(--lime)', LOOKS='var(--amber)', SCENES='var(--lav)', HOLIDAY='var(--cyan)', FIRE='var(--orange)', SPORTS='var(--violet)', LIVE='var(--green)', TEXT='var(--gold)', SETUP='var(--peri)')
def rk(name): return f'<span class="k rail" style="--c:{RAILC[name]}">{name}</span>'


page('/guide/', 'Guide · GlowBop', 'The complete GlowBop guide: setup, the console, line-up and grid walls, 3D shapes, music show, looks, holidays, fireplace, scoreboard, live feeds, text and logos, groups and troubleshooting.',
     f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">The GlowBop Guide</span><h1>Learn GlowBop <span class="grad">in an evening</span></h1>
<p class="lead">Every part of the app, step by step, for the new GlowBop console. Start at the top if you're new. Each section works on its own too.</p></div></header>
<section style="padding-top:10px"><div class="wrap"><div class="grid g3">
{''.join(f'<a class="card reveal" href="/guide/{s}.html"><div class="em">{e}</div><h3>{n}. {t}</h3><p>{d}</p><span class="more">Open →</span></a>' for n, (s, e, t, d) in enumerate(G, 1))}
</div>
<div class="tip pink reveal" style="margin-top:28px"><b>New here?</b> The fastest path: <a href="/guide/getting-started.html">Getting started</a> → <a href="/guide/console.html">Using the console</a> → <a href="/guide/lineup.html">Line up your curtains</a> → press play on a song. Everything else is a bonus.</div>
</div></section>{band()}''', '/guide/')

guide('getting-started', f'''
<h2 id="need">What you need</h2>
<ul><li>A <b>Windows 10 or 11</b> laptop or PC. This is where GlowBop runs and listens to the music.</li>
<li>One or more <b>supported LED curtains</b> (see <a href="/lights.html">Supported lights</a>).</li>
<li>Your <b>home Wi-Fi</b>. The lights, the computer and your phone all join the same network. (Bluetooth lights just need to be near the computer.)</li>
<li>A phone (iPhone or Android) for the remote. Optional, but it's the fun part.</li></ul>
<h2 id="lights">1. Set up your lights</h2>
<p>Set up each light with its maker's app first (for Twinkly, the Twinkly app). Once it shows up there and lights up, you're ready. GlowBop takes over from here.</p>
{tip('<b>Tip:</b> use your main Wi-Fi, not a guest network. Guest networks often block devices from seeing each other.')}
<h2 id="install">2. Install and open GlowBop</h2>
<ol><li><a href="/download.html">Download GlowBop</a> and run <b>GlowBop-Setup</b>. It installs just for your Windows account, no admin password needed.</li>
<li>If Windows shows <b>"Windows protected your PC"</b>, click <b>More info</b>, then <b>Run anyway</b>. (Your browser may also say the file "isn't commonly downloaded": choose <b>Keep</b>.) This shows up for new apps from small makers, not because anything is wrong.</li>
<li>When it finishes, leave <b>Open GlowBop now</b> ticked and click Finish. Next time, open <b>GlowBop</b> from the Start menu or desktop shortcut.</li>
<li>Paste the <b>license key</b> from your Polar email (it starts with GLOWBOP-) and tap <b>Unlock</b>.</li>
<li>If Windows asks, <b>allow GlowBop on private networks</b>. That lets your phone and lights reach it.</li></ol>
{devframe('laptop', 'desk-live', 'The GlowBop console on a laptop')}
<h2 id="find">3. Find your lights</h2>
<ol><li>Tap {rk('SETUP')} on the side rail. In <b>Light setup</b>, tap <span class="k">Find my lights</span>. GlowBop searches your Wi-Fi and Bluetooth.</li>
<li>Each light it finds is added with its size. If one is missing, use <span class="k">Add by brand</span>.</li>
<li>Have more than one curtain? Do the <a href="/guide/lineup.html">line-up wizard</a> next. It takes a minute.</li></ol>
{tip('<b>Bluetooth lights</b> (TikTok-style pixel curtains, DayBetter strips) take one connection at a time. Close their phone app before you tap Find my lights.')}
<h2 id="phone">4. Open the console on your phone or iPad</h2>
<ol><li>Put your phone on the <b>same Wi-Fi</b> as the computer.</li>
<li>In {rk('SETUP')}, open <b>Control from your phone</b> and point your phone camera at the QR code.</li>
<li>The console opens in Safari or Chrome. Tap <b>Share → Add to Home Screen</b> to get the GlowBop icon. From then on it opens full screen, like an app.</li>
<li>On an iPad, turn it sideways for the big two-column board.</li></ol>
{devframe('phone', 'phone-music', 'The GlowBop console on an iPhone')}
{tip('<b>Not connecting?</b> Same Wi-Fi on both, VPN off on the phone, and allow GlowBop on private networks in Windows. More in <a href="/guide/troubleshooting.html">Troubleshooting</a>.', 'warn')}
<h2 id="play">5. Press play</h2>
<p>Play a song on the computer, from any app. The bar under the live wall says <b>MUSIC SHOW · LISTENING</b> and the wall comes alive. That's it, you're running a light show. 🎉</p>
<p>Next, take two minutes with <a href="/guide/console.html">Using the console</a> to learn the rail and the keys.</p>
''', [('need', 'What you need'), ('lights', 'Set up your lights'), ('install', 'Install'), ('find', 'Find lights'), ('phone', 'Phone & iPad'), ('play', 'Press play')])

guide('console', f'''
<p>The GlowBop console is the same on a phone, an iPad and the laptop. Once you know the four parts below, you know the whole app.</p>
{devframe('tablet', 'ipad-land', 'The GlowBop console on an iPad held sideways')}
<h2 id="rail">The side rail</h2>
<p>The colored keys down the left side are the sections. Tap one and its controls slide in. The white edge shows where you are.</p>
<div class="grid g3" style="margin:18px 0">
<div class="card" style="--c:{RAILC['MUSIC']}"><h3>{rk('MUSIC')}</h3><p>Now Playing, Show control (power, next effect, shuffle, surprise me) and Levels: pace, sparkles, brightness, blend and sync.</p></div>
<div class="card" style="--c:{RAILC['DJ']}"><h3>{rk('DJ')}</h3><p>Hit pads, hold to build, cue the next look, tap tempo, crowd lines and DJ controllers.</p></div>
<div class="card" style="--c:{RAILC['LOOKS']}"><h3>{rk('LOOKS')}</h3><p>All the looks, Feature an effect, and Transitions.</p></div>
<div class="card" style="--c:{RAILC['GAMES']}"><h3>{rk('GAMES')}</h3><p>Eight self-playing arcade games and the Arcade marathon.</p></div>
<div class="card" style="--c:{RAILC['SCENES']}"><h3>{rk('SCENES')}</h3><p>Quick scenes, Describe a scene in your own words, and Screen mirror.</p></div>
<div class="card" style="--c:{RAILC['HOLIDAY']}"><h3>{rk('HOLIDAY')}</h3><p>A button for every holiday and the mini-movies.</p></div>
<div class="card" style="--c:{RAILC['FIRE']}"><h3>{rk('FIRE')}</h3><p>Nine fire styles in nine colors, Cozy or Roaring, with flare on the beat.</p></div>
<div class="card" style="--c:{RAILC['SPORTS']}"><h3>{rk('SPORTS')}</h3><p>Game Day, Live Fan in 44 leagues with the Game Center, F1, golf, racing, tennis and UFC boards, and the countdown clock.</p></div>
<div class="card" style="--c:{RAILC['LIVE']}"><h3>{rk('LIVE')}</h3><p>Pick a live feed: countdown, weather, storm watch, overhead.</p></div>
<div class="card" style="--c:{RAILC['TEXT']}"><h3>{rk('TEXT')}</h3><p>Messages and your logo on top of the show.</p></div>
<div class="card" style="--c:{RAILC['SETUP']}"><h3>{rk('SETUP')}</h3><p>Light setup, line-up and grid walls, 3D shapes, phone link, song lookup, license, screen, help.</p></div>
</div>
<h2 id="wall">The live wall</h2>
<p>The box with the amber frame shows exactly what your lights are showing right now, bulb by bulb. With light groups, each group shows side by side and you can tap one to control just that group.</p>
<ul><li><span class="k">Full view</span> fills the whole screen with the wall. Tap <span class="k">Close</span> to come back.</li>
<li><span class="k">Mirror</span> jumps to screen mirroring. <span class="k">Lights</span> jumps to your light setup.</li>
<li>When you're in another section on a phone, the wall shrinks so the controls have room.</li></ul>
<h2 id="modebar">The mode bar</h2>
<p>The bar under the wall always says what's in charge of your lights, in that mode's color: <b>Music show · listening</b>, a pinned look, a holiday, the fireplace, a scene, a live feed or a storm alert. When something has taken over, a pink <span class="k">♫ Back to music</span> button appears next to it. One tap turns off whatever is on and the music show comes back, from any section.</p>
<h2 id="reads">The readouts</h2>
<p>Under the mode bar: the <b>tempo</b> in BPM, the <b>song section</b> (intro, build, drop, break...), a <b>level meter</b>, the current <b>look</b> and <b>effect</b>, plus extras like the key and mood when GlowBop knows the song.</p>
<h2 id="extras">Sounds, screen and help</h2>
<ul><li><span class="k">SFX</span> at the top turns the console's little chirps on or off.</li>
<li><b>Screen stays on:</b> after your first tap, your phone or iPad won't drop to the lock screen while GlowBop is open. Turn it off in {rk('SETUP')} → <b>Screen</b> to save battery.</li>
<li><b>Can't reach the laptop?</b> If your phone loses the laptop (wrong Wi-Fi, laptop asleep, GlowBop closed), a friendly "taking a breather" screen shows what to check and reconnects by itself the moment the laptop is back.</li>
<li><span class="k">Help &amp; feedback</span> at the bottom sends us a bug report or a feature idea straight from the app.</li></ul>
{tip('<b>iPad tip:</b> turn the iPad sideways. The wall moves to the left and stays put while you scroll the controls on the right.', 'pink')}
''', [('rail', 'The side rail'), ('wall', 'Live wall'), ('modebar', 'Mode bar'), ('reads', 'Readouts'), ('extras', 'Sounds & screen')])

guide('lineup', f'''
<p>With more than one curtain (up to 8), GlowBop needs to know three things: which way is up on each one, whether any are mirrored, and what order they hang in. The wizard makes it a one-minute job.</p>
{clip('lineup', 'the line-up wizard on four curtains')}
<h2 id="wizard">Run the wizard</h2>
<ol><li>Tap {rk('SETUP')} and, in <b>Light setup</b>, tap <span class="k">Line up my curtains</span>.</li>
<li>Every curtain now shows a <b>big number and an UP arrow</b>.</li>
<li>For each curtain, tap <span class="k">⟳</span> to rotate until the arrow points up, and <span class="k">⇋</span> if the number reads backwards. Use <span class="k">⇅</span> to flip top to bottom.</li>
<li>Use <span class="k">▲</span> <span class="k">▼</span> to put them in the order they hang, left to right.</li>
<li>Choose how they hang: <b>Side by side</b>, <b>Stacked</b>, <b>Grid</b> or <b>Overlap</b>.</li>
<li>Tap <span class="k">Lock</span>.</li></ol>
{tip('<b>Locked</b> means nothing changes by accident. To move curtains later, run the wizard again and lock it when you are done.')}
<h2 id="grid">Grid walls: up to 8 curtains</h2>
<p>Hang curtains in rows and columns, like a video wall: 2 × 2, 3 × 2, 4 × 2 and more, up to 8 curtains.</p>
<ol><li>In the wizard, choose <b>Grid</b>.</li>
<li>Tap the <b>shape</b> your curtains make. The picker shows every rows-by-columns layout that fits your curtains.</li>
<li>Tap each <b>spot</b> and choose which numbered curtain hangs there. A spot can stay empty for an L-shape or a gap.</li>
<li>Check the arrows still point up, then tap <span class="k">Lock</span>.</li></ol>
{tip('Every show resizes to the whole grid. Big flowing effects sweep across all of it, and pixel art stays sharp.')}
<h2 id="overlap">Overlapping curtains: a denser wall</h2>
<p>Hang two curtains over each other, with the second one shifted so its bulbs sit in the gaps of the first. Mixing brands works too, like a small Twinkly centered inside a bigger Bluetooth curtain. Same space, twice the bulbs, and GlowBop draws the picture twice as sharp to match.</p>
<div class="grid g3" style="margin:18px 0">
<div class="card reveal"><div class="em">→</div><h3>Sideways</h3><p>Shifted half a gap left or right. Rows stay level, columns double up.</p></div>
<div class="card reveal"><div class="em">↓</div><h3>Down</h3><p>Shifted half a row down. Columns stay lined up, rows double up.</p></div>
<div class="card reveal"><div class="em">↘</div><h3>Diagonal</h3><p>Shifted half a gap both ways, so every bulb sits in the middle of four others.</p></div></div>
<ol><li>In the wizard, choose <b>Overlapping</b>. The first curtain in the list is the base.</li>
<li>Under each other curtain, pick its <span class="k">Place</span>: <b>🎯 Center</b> (a smaller curtain sits in the middle of the bigger one) or <b>Top-left</b>.</li>
<li>Then pick its <span class="k">Shift ½</span>: Sideways, Down or Diagonal, to match how you hung it.</li>
<li>Tap <span class="k">🔒 Lock it in</span>.</li></ol>
{tip('<b>Bulbs not quite in the gaps?</b> Curtains from different brands can space their bulbs differently, and twisted wires can turn bulbs. Run <span class="k">Map with camera</span> after hanging: it records exactly where every bulb landed.')}
{tip('You can also set it per curtain: in <b>Light setup</b>, change a curtain\'s <b>Overlap</b> to "Over" another curtain and pick the shift.', 'pink')}
<h2 id="sizes">How shows fit your wall</h2>
<p>GlowBop builds one big canvas from all your curtains. Flowing effects stretch across the whole wall. Pixel-art scenes (pumpkins, characters, the tree) keep their sharp look by showing one copy per curtain instead of getting blurry.</p>
<ul><li><b>1 curtain:</b> everything as designed.</li><li><b>Side by side:</b> wide shows sweep across, pixel art repeats per curtain.</li><li><b>Stacked:</b> a taller canvas, great for fire, rain and fountains.</li><li><b>Grid:</b> a big video-wall canvas, rows and columns together.</li><li><b>3D shapes:</b> see <a href="/guide/shapes.html">3D shapes</a>.</li></ul>
<h2 id="camera">Camera mapping (optional)</h2>
<p>For lights that aren't a neat grid, like strings wrapped on a tree, <span class="k">Map with camera</span> lights each bulb in turn while your camera watches, so GlowBop learns exactly where every light is.</p>
''', [('wizard', 'Run the wizard'), ('grid', 'Grid walls'), ('overlap', 'Overlapping curtains'), ('sizes', 'How shows fit'), ('camera', 'Camera mapping')])

guide('shapes', f'''
<p>Curtains bend. Wrap them around a big tube, a box or a ball and you have a glowing art piece. Tell GlowBop the shape and it wraps the picture all the way around, with no seam where the ends meet.</p>
{devframe('laptop', 'desk-setup', 'GlowBop Setup with a 3D cylinder preview')}
<h2 id="pick">Pick the shape</h2>
<ol><li>Tap {rk('SETUP')}. In <b>Light setup</b>, find <b>Shape</b>.</li>
<li>Choose <span class="k">Flat wall</span>, <span class="k">Cylinder</span>, <span class="k">Box</span> or <span class="k">Globe</span>.</li>
<li>For a cylinder or box you can pick a <b>Curtain on top (lid)</b>. That curtain is drawn as rings that close the top.</li></ol>
<div class="grid g3" style="margin:18px 0">
<div class="card"><div class="em">🥫</div><h3>Cylinder</h3><p>Curtains wrapped around a tube or column. The picture loops around forever.</p></div>
<div class="card"><div class="em">📦</div><h3>Box</h3><p>Curtains around the four sides of a cube or pillar, with an optional lid.</p></div>
<div class="card"><div class="em">🌍</div><h3>Globe</h3><p>Curtains around a ball. Effects use latitude and longitude, like a planet.</p></div></div>
<h2 id="preview">The 3D preview</h2>
<p>As soon as you pick a shape, the live wall turns into a 3D model of your piece, lit with the real show. Drag it to spin it around and look at every side.</p>
<h2 id="seam">The seamless wrap</h2>
<p>Where the last column meets the first, GlowBop blends a narrow band so effects flow straight across the join. No hard line, no jump.</p>
<h2 id="fx">3D effects</h2>
<p>The <b>3D Object</b> look has effects made for wrapped lights. They know your shape, so a globe spins like a planet and rings rise around a column.</p>
<div class="grid g2">{clip('shape-spinningglobe', 'Spinning Globe (unrolled)')}{clip('shape-barberspin', 'Barber Spin (unrolled)')}{clip('shape-risingrings', 'Rising Rings (unrolled)')}{clip('wave-oceanswell', 'Ocean Swell')}</div>
<p>The clips are shown unrolled, flat. On the real piece they wrap around. Every other look works on a shape too.</p>
{tip('<b>Build tip:</b> use something light and sturdy, like a pool noodle frame, a lampshade wire or a big plastic ball. Keep the curtain controller at the back.', 'pink')}
''', [('pick', 'Pick the shape'), ('preview', '3D preview'), ('seam', 'Seamless wrap'), ('fx', '3D effects')])

guide('music', f'''
<h2 id="how">How the music show works</h2>
<p>GlowBop listens to the sound coming out of your computer, the same sound you hear. It doesn't matter what app plays it: Spotify, YouTube, Apple Music, a DJ program, a video. Nothing to log into.</p>
<ul><li><b>Kick and bass</b> push bursts, pulses and color hits.</li><li><b>Melody</b> moves the flowing parts.</li>
<li><b>Song sections</b>: GlowBop tracks loudness over time to tell a verse from a build-up, a drop, or a breakdown.</li>
<li><b>Drops</b> get a big move and usually a look change. A short gap between drops keeps it from feeling repetitive.</li></ul>
{clip('drop', 'a build-up and the drop, Neon Party look')}
<h2 id="controls">Show controls</h2>
<p>Everything here lives under {rk('MUSIC')}, in <b>Show control</b> and <b>Levels</b>.</p>
<ul><li><b>Pace:</b> <span class="k">Chill</span> slow and dreamy, <span class="k">Normal</span>, <span class="k">Hype</span> fast changes for a dance floor.</li>
<li><b>Sparkles:</b> <span class="k">Off</span>, <span class="k">Auto</span> (on the high notes), <span class="k">Lots</span>.</li>
<li><b>Brightness</b> for the whole wall, and <b>Blend</b> for how smoothly effects cross-fade.</li>
<li><span class="k">Surprise me</span> throws in a random look and effect. <span class="k">Characters</span> turns the pixel dancers on or off.</li>
<li><span class="k">Next effect</span> skips ahead. <span class="k">Pin</span> keeps the current one going. <span class="k">Shuffle</span> lets GlowBop choose.</li></ul>
<h2 id="sync">Sync with Bluetooth speakers</h2>
<p>Bluetooth speakers play sound about 150 to 300 milliseconds late, so the lights can look early. Slide <b>Sync delay</b> to the right until a kick drum and its flash land together. GlowBop remembers the setting for each speaker.</p>
{tip('<b>Quick test:</b> play a song with a hard, simple kick drum and watch one curtain while you slide. When it feels "locked", stop.')}
<h2 id="epic">Epic mode 🎬</h2>
<p>Movie and trailer music works differently from dance music: a long crescendo, then one huge peak. GlowBop spots these songs on its own and switches to Epic mode.</p>
<ul><li>Through the build, the wall <b>swells</b>: more light, more motion, warmer color.</li>
<li>Only the <b>real climax</b> gets the big moment, and it must top everything before it.</li>
<li>Harsh strobes are left out of Epic songs.</li></ul>
{clip('climax', 'the big moment, Deep Space look')}
<h2 id="memory">Song memory</h2>
<p>The first time a song plays, GlowBop learns its shape. Next time, it already knows where the drops and the climax are and can set up for them.</p>
<h2 id="lookup">Song lookup (optional)</h2>
<p>When GlowBop knows a song's name, it can look up its genre, tempo and key. An "orchestral" song starts in Epic mode right away; "house" stays in dance mode. You need two free keys:</p>
<ol><li><b>Last.fm</b> (genres): sign in at last.fm, go to <a href="https://www.last.fm/api/account/create" rel="noopener">last.fm/api/account/create</a>, fill in a name and description, and copy the <b>API key</b>.</li>
<li><b>GetSongBPM</b> (tempo and key): request a key at <a href="https://getsongbpm.com/api" rel="noopener">getsongbpm.com/api</a> and click the activation link in your email.</li>
<li>In GlowBop tap {rk('SETUP')} → <b>Song lookup</b>, paste each key, and tap <span class="k">Save</span>.</li></ol>
{tip('Each song is looked up only once and saved on your computer. Your keys stay on your computer too.')}
''', [('how', 'How it works'), ('controls', 'Controls'), ('sync', 'Sync'), ('epic', 'Epic mode'), ('memory', 'Song memory'), ('lookup', 'Song lookup')])

LOOKS = ['Red Alert', 'Rainbow Riot', 'Emerald Ocean', 'Midnight Galaxy', 'Fairy Forest', 'Deep Sea', 'Neon Party', 'Ice Palace', 'Synthwave', 'Royal Gold', 'Toxic Rave', 'Lava Lounge', 'Blue Sky', 'Hyperspace', 'Digital Matrix', 'Psychedelic', 'Molten', 'Chaos', 'Wild Card', 'Studio 54', 'Liquid Dreams', 'Warehouse Rave', 'Neon Grid', 'Storm & Sea', 'Mainstage', 'Deep Space', 'Hypnotic', 'Club Rig', '3D Depth', 'Dance Crew', 'Retro Arcade', 'Wild Elements', '3D Object', 'Big Wave']
guide('dj', f'''
<p>DJ mode puts the lights in your hands. The music show keeps running underneath, and you add moves on top, the way a lighting tech runs a club. Tap {rk('DJ')} on the side rail.</p>
{clip('drop', 'a hand-played drop')}
<h2 id="pads">Hit pads</h2>
<p>Six big pads. Every one lands on the <b>next beat</b>, so even a late tap looks perfectly on time.</p>
<ul><li><span class="k">💥 Drop</span>: a full drop move, with a new effect and a color change.</li>
<li><span class="k">⚡ Strobe</span>: four beats of white strobe.</li>
<li><span class="k">⚪ Flash</span>: one big white flash.</li>
<li><span class="k">🔥 Fire burst</span> and <span class="k">🎉 Confetti</span>: a blast over the show for a couple of seconds.</li>
<li><span class="k">⬛ Blackout</span>: holds the wall dark until you tap it again. Great right before a drop.</li></ul>
<h2 id="build">Hold to build</h2>
<p>Press and <b>hold</b> <span class="k">Hold to build</span>. A wall of light rises from the floor, flickering faster and turning white-hot. <b>Let go</b> and it drops. Slide your finger off the key to cancel.</p>
{tip('<b>Pro move:</b> Blackout for one bar, then hold Build through the last bars of the build-up and let go right on the drop.', 'pink')}
<h2 id="cue">Cue the next look</h2>
<p>Tap a look in <b>Cue the next look</b>. It waits, then comes in on the next drop, yours or the music's. Tap it again to clear the cue.</p>
<h2 id="tap">Tap tempo</h2>
<p>Room too loud, or a song with no clear kick? Tap <span class="k">TAP</span> four times or more on the beat and the whole show locks to your tapping. <span class="k">Back to automatic tempo</span> hands the beat back to the music.</p>
<h2 id="crowd">Crowd lines</h2>
<p>Big words flashed across the wall for three seconds: <b>HANDS UP</b>, <b>JUMP</b>, <b>MAKE SOME NOISE</b> and more. Type your own, like your DJ name; GlowBop keeps your last six.</p>
<h2 id="controller">DJ controllers</h2>
<ol><li>Plug a USB DJ controller or MIDI pad into the laptop.</li>
<li>Open GlowBop in <b>Chrome or Edge on the laptop</b>, tap {rk('DJ')} and then <span class="k">Connect a controller</span>.</li>
<li>Tap a pad name in the list, then hit the button on your controller. Repeat for every pad, Build and Tap.</li></ol>
{tip('Phones and iPads can\'t talk to DJ controllers. Use the laptop for the controller and your phone for everything else; both work at the same time.', 'warn')}
<p><span class="k">♫ Back to music</span> under the wall clears a blackout, tap tempo or a cued look.</p>
''', [('pads', 'Hit pads'), ('build', 'Build & drop'), ('cue', 'Cue'), ('tap', 'Tap tempo'), ('crowd', 'Crowd lines'), ('controller', 'Controllers')])

guide('looks', f'''
<h2 id="looks">What a look is</h2>
<p>A look is a mood: a color palette plus a set of effects for calm, medium and loud moments. During a song GlowBop picks effects from the current look, and moves to a new look at drops or when the song changes.</p>
{devframe('phone', 'phone-looks', 'The Looks list in the GlowBop console')}
<h3>All 34 looks</h3>
<div class="toc">{''.join(f'<span class="k">{l}</span> ' for l in LOOKS)}</div>
<p>Tap {rk('LOOKS')}, then any look to jump to it. Turn on <span class="k">Pin</span> to keep it, or tap <span class="k">Release</span> in the mode bar to hand control back to GlowBop.</p>
<h2 id="3d">3D, club, nature and retro looks</h2>
{pic('3d-loft', 'LED curtain wall showing a 3D crystal and a 4D cube in a loft')}
<ul><li><b>3D Depth:</b> tunnels, spinning cubes, disco spheres and black holes that look like they go deep into the wall.</li>
<li><b>Club Rig:</b> moving-head beams, laser scans and strobe banks, like a real club ceiling.</li>
<li><b>Dance Crew:</b> pixel characters that dance to the beat. Turn them on or off with <span class="k">Characters</span>.</li>
<li><b>Retro Arcade:</b> the self-playing pixel games now live under their own GAMES key (below).</li>
<li><b>Wild Elements:</b> rain on the window, a volcano that erupts on the drop, a tornado, a waterfall and the surface of the sun.</li></ul>
<div class="grid g2">{clip('look-retro-arcade', 'Retro Arcade')}{clip('look-wild-elements', 'Wild Elements')}{clip('fx-tesseract', 'Tesseract, a 4D cube')}{clip('look-club-rig', 'Club Rig')}</div>
<h2 id="wave">Big Wave 🌊</h2>
<p>The newest family of effects, with its own <b>Big Wave</b> look. They also turn up in Molten, Neon Party and Storm &amp; Sea.</p>
<ul><li><b>Big Wave:</b> a giant glowing wave that rolls and crests on the beat.</li><li><b>Serpent:</b> a smooth snake with a glowing head that swims the length of your wall.</li><li><b>Twin Waves:</b> two waves crossing, with sparkles on the crest.</li><li><b>Ocean Swell:</b> a slow, deep swell for calm songs.</li></ul>
<div class="grid g2">{clip('wave-bigwave', 'Big Wave')}{clip('wave-serpent', 'Serpent')}{clip('wave-twinwaves', 'Twin Waves')}{clip('wave-oceanswell', 'Ocean Swell')}</div>
<p><a href="/gallery.html">See all 34 looks and the newest effects in the gallery →</a></p>
<h2 id="games">Arcade games 🕹️</h2>
<p>The self-playing games have their own key, {rk('GAMES')}. Tap a game and it plays on the wall, speeding up with the music:</p>
<ul><li><b>Breakout</b>, <b>Snake</b>, <b>Pong</b>, <b>Alien parade</b>, <b>Space rocks</b>, <b>Block drop</b>, <b>Light cycles</b> and <b>Game of life</b>.</li>
<li><span class="k">🕹️ Arcade marathon</span> plays every game in turn.</li>
<li><span class="k">♫ Back to music</span> under the wall ends it.</li></ul>
<div class="grid g2">{clip('fx-breakout', 'Breakout')}{clip('fx-snakegame', 'Snake')}{clip('fx-pongbattle', 'Pong')}{clip('fx-alienparade', 'Alien parade')}</div>
<h2 id="scenes">Quick scenes and Describe a scene</h2>
<p>Under {rk('SCENES')}, <b>Quick scenes</b> are one-tap presets. <b>Describe a scene</b> lets you type what you want ("slow purple ocean with gold sparkles") and tap <span class="k">Play it</span>. GlowBop picks matching effects and colors from your words.</p>
<h2 id="feature">Feature an effect</h2>
<p>Love one effect? <b>Feature</b> it for the current part of the song, or <span class="k">Pin</span> it to keep it on. Tap <span class="k">Let the show flow again</span> to go back to normal.</p>
<h2 id="transitions">Transitions</h2>
<p>Choose how one effect hands over to the next: quick cuts for high-energy sets, long fades for a chill night.</p>
''', [('looks', 'Looks'), ('3d', '3D & club'), ('wave', 'Big Wave'), ('games', 'Arcade games'), ('scenes', 'Scenes'), ('feature', 'Feature'), ('transitions', 'Transitions')])

guide('holidays', f'''
<p>Holidays have their own section, {rk('HOLIDAY')}, so they don't pop up in the middle of a July pool party. Tap a holiday and the wall plays <b>only that holiday</b> until you stop it.</p>
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
<p>For the four biggest nights, GlowBop plays a short animated story in chapters, drawn as crisp pixel art. They're <b>wide-screen</b>: on 2, 3 or 4 curtains the scene stretches across the whole wall (the witch flies the full length, the sleigh crosses every curtain).</p>
<ul><li><b>🎃 Halloween Night:</b> fog, a graveyard, a witch across the moon, haunted houses, bats, ghosts, screaming jack-o'-lanterns on the drop, a lightning storm.</li>
<li><b>🦃 Harvest Day:</b> sunset on the farm, falling leaves, a strutting turkey, the harvest moon, dinner by candlelight, a whirlwind of leaves on the drop.</li>
<li><b>🎄 Christmas Eve:</b> snow on the village, windows lighting up, a giant tree filling with ornaments, Santa's sleigh, presents bursting into fireworks.</li>
<li><b>🎆 New Year Countdown:</b> the city skyline, confetti, a 10-to-1 countdown as the ball drops, fireworks at midnight, a champagne toast.</li></ul>
{pic('halloween-porch', 'LED curtain showing pixel jack-o-lanterns on a Halloween porch')}
{pic('christmas-eve', 'LED curtain showing a pixel Christmas tree in a window')}
<div class="grid g2">{clip('movie-halloweennight', 'Halloween Night: the witch crosses the moon')}{clip('movie-harvestday', 'Harvest Day: the turkey struts')}{clip('movie-christmaseve', 'Christmas Eve: the sleigh flies by')}{clip('movie-newyearcountdown', 'New Year Countdown: 10 to 1')}</div>
<h2 id="choose">Choose the effects</h2>
<p>Inside each holiday you can toggle which effects are in the rotation, so you can keep the ones your family loves.</p>
{tip('<b>Trick-or-treat tip:</b> start Halloween at dusk, set Pace to Chill, and the mini-movie plays every few switches between the spooky effects.', 'pink')}
''', [('list', 'Holidays'), ('movies', 'Mini-movies'), ('choose', 'Choose effects')])

guide('fireplace', f"""
<p>Turn the whole wall into a fire with one tap. There's no fireplace frame and no logs, just the flames, simulated live so they never loop.</p>
{pic('cozy-fireplace', 'LED curtain showing tall flickering flames behind a couple on a couch')}
<h2 id="light">Light the fire</h2>
<ol><li>Tap {rk('FIRE')} on the side rail.</li>
<li>Tap <span class="k">Light the fire</span>. The mode bar turns orange and says <b>FIREPLACE 🔥</b>.</li>
<li>To stop, tap <span class="k">Put out fire</span>, or <span class="k">♫ Back to music</span> under the live wall from any section.</li></ol>
{led('fireplace', 'the same fire simulation the app runs, right in your browser', demo=True)}
<h2 id="styles">9 fire styles</h2>
<div class="grid g2">{clip('fire-campfire', 'Campfire')}{clip('fire-bonfire', 'Bonfire')}{clip('fire-candles', 'Candle wall')}{clip('fire-torches', 'Torch row')}{clip('fire-pixel', 'Pixel flames')}{clip('fire-spirit', 'Spirit fire')}{clip('fire-lava', 'Lava rising')}{clip('fire-dragon', 'Dragon breath')}</div>
<ul><li><b>🔥 Fireplace:</b> the classic: tall flames with a white-hot core and floating embers.</li>
<li><b>🏕️ Campfire:</b> crossed logs, glowing coals and a cone of flame. Wide walls get two.</li>
<li><b>🎇 Bonfire:</b> a huge blaze that roars up on the drop.</li>
<li><b>🕯️ Candle wall:</b> rows of candles, each flickering on its own.</li>
<li><b>🔦 Torch row:</b> torches on a brick wall lit by their own flicker.</li>
<li><b>👾 Pixel flames:</b> chunky 8-bit cartoon fire.</li>
<li><b>👻 Spirit fire:</b> slow, ghostly blue flames with curling wisps.</li>
<li><b>🌋 Lava rising:</b> molten lava with popping bubbles, rising and falling.</li>
<li><b>🐉 Dragon breath:</b> embers, then a jet of fire blasts across the wall.</li></ul>
<h2 id="colors">9 colors</h2>
<div class="toc"><span class="k">🔥 Classic</span> <span class="k">💙 Blue gas</span> <span class="k">💜 Purple</span> <span class="k">🌈 Rainbow</span> <span class="k">💚 Green</span> <span class="k">🩷 Pink</span> <span class="k">🤍 Ice</span> <span class="k">🏟️ Team colors</span> <span class="k">🌙 Night shift</span></div>
<p><b>Team colors</b> lets you pick any two colors (great for game day). <b>Night shift</b> slowly drifts from classic to purple, blue and green over the night.</p>
{pic('purple-fire-party', 'Purple and pink fire on an LED curtain at a house party')}
<p>Rainbow drifts slowly through every color across the wall and keeps a white-hot core. Green is great for Halloween and St. Patrick's, Pink for Valentine's, Ice for a ghostly winter look.</p>
<div class="grid g2">{clip('fire-rainbow-cozy', 'Rainbow')}{clip('fire-blue-cozy', 'Blue gas')}{clip('fire-purple-roar', 'Purple, Roaring')}{clip('fire-ice-cozy', 'Ice')}</div>
<h2 id="mode">Cozy or Roaring</h2>
<ul><li><span class="k">🛋️ Cozy</span>: tall, relaxing flames that reach up the wall, with a small flare now and then.</li>
<li><span class="k">🔥 Roaring</span>: fast, wild flicker with big whooshes of flame every few seconds and bursts of sparks.</li></ul>
<h2 id="music">Calm, Dance or Flare on the beat</h2>
<ul><li><span class="k">🕯️ Calm</span>: the fire ignores the music. Perfect for a quiet night.</li>
<li><span class="k">💃 Dance</span>: the flames swell gently with the beat. Fire that grooves.</li>
<li><b>Flare on the beat</b>: every kick sends the flames up with a burst of sparks, and when the music is loud, gusts of wind sweep through the fire.</li></ul>
<h2 id="wall">On a big wall</h2>
<p>With several curtains, GlowBop builds one long bed of fire across all of them, like a modern linear fireplace. Stacked curtains get taller flames.</p>
{tip('<b>Good to know:</b> the fireplace stays lit until you put it out. The fire, the scoreboard and live feeds take turns: turning one on turns the others off. Text and logos still show on top of the flames.')}
""", [('light', 'Light it'), ('styles', 'Styles'), ('colors', 'Colors'), ('mode', 'Cozy / Roaring'), ('music', 'With music'), ('wall', 'Big walls')])

SPORTS = 'Soccer, Football, Basketball, Baseball, Softball, Hockey, Field hockey, Lacrosse, Volleyball, Pickleball, Tennis, Rugby, Aussie rules, Cricket, Water polo, Cornhole, Other, plus a Countdown timer'
guide('scoreboard', f'''
<p>Tap {rk('SPORTS')} on the side rail and pick a mode: <span class="k">Game Day</span>, <span class="k">Live Fan</span>, <span class="k">F1</span>, <span class="k">⛳ Golf</span> or <span class="k">🏁 NASCAR</span>. <span class="k">Off</span> returns to the light show.</p>
{pic('soccer-scoreboard', 'LED curtain used as a scoreboard at a youth soccer game')}
<h2 id="gameday">Game Day: keep score yourself</h2>
{clip('score-soccer', 'a goal at the soccer game, real celebration')}
<ol><li>Choose a <b>Sport</b> from the dropdown: {SPORTS}.</li>
<li>Open <b>⚙️ Game setup</b> to set minutes per period, number of periods, and <span class="k">⏳ Count down</span> or <span class="k">⏱️ Count up</span>. Tap <span class="k">Set up the game</span>.</li>
<li>Tap <span class="k">▶ Start</span> to run the clock. Nudge it with <span class="k">−1 min</span> <span class="k">−10 s</span> <span class="k">+10 s</span> <span class="k">+1 min</span>.</li>
<li>Add points with the score buttons, or type the score straight into the box. <span class="k">−1</span> fixes a mistake.</li></ol>
<div class="grid g2">{clip('score-basketball', 'Game Day basketball: a three-pointer')}{clip('score-hockey', 'Game Day hockey: a goal')}</div>
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
<ol><li>Tap <span class="k">Live Fan</span>, pick a <b>League</b>, then your <b>Team</b>. There are 44 leagues in five groups:
<ul><li><b>🇺🇸 Pro:</b> NFL, NBA, MLB, NHL, MLS, UFL, CFL, Premier Lacrosse League, USL Championship.</li>
<li><b>👩 Women:</b> WNBA, NWSL, England Women's Super League, Women's Champions League, Women's World Cup.</li>
<li><b>🎓 College:</b> football, men's and women's basketball, baseball, softball, men's and women's hockey, men's and women's volleyball, men's and women's lacrosse, field hockey.</li>
<li><b>🌍 World soccer:</b> Premier League, EFL Championship, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Primeira Liga, Liga MX, Saudi Pro League, Champions League, Europa League, Copa Libertadores, World Cup.</li>
<li><b>🌏 More of the world:</b> AFL (Aussie rules), Rugby World Cup, FIBA Basketball World Cup, Indian Premier League cricket.</li></ul></li>
<li>Tap <span class="k">Follow this team</span>.</li>
<li>During the game the score updates <b>every 10 seconds</b>. When your team scores, the wall celebrates in their colors.</li></ol>
<h3 id="stats">Live stats and the Game Center</h3>
{devframe('phone', 'phone-score', 'The SPORTS section on an iPhone')}
<ul><li><b>Game Center</b> on your phone: the linescore inning by inning (or by quarter), hits and errors, the leaders, the series and each team's record.</li>
<li><b>Baseball:</b> balls, strikes and outs, runners on base, who's batting and pitching, top or bottom of the inning. Every 16 seconds the wall shows a little diamond with the runners and the count.</li>
<li><b>Football:</b> down and distance, ball on, who has it, and a red-zone alert.</li>
<li>The <b>last play</b> scrolls across the wall each time something happens.</li></ul>
<div class="grid g2">{clip('score-baseball', 'Live baseball: a score, the new play, then the diamond')}{clip('score-football', 'Live football: down and distance, then a touchdown')}</div>
{tip('GlowBop uses public score feeds and has backups for the major leagues. If a feed is slow, the board catches up on the next update.', 'warn')}
<h2 id="f1">F1 live board 🏎️</h2>
{clip('score-f1', 'DRS attack, the overtake, NEW LEADER, then a purple fastest lap')}
<div class="grid g2">{clip('f1-win', 'Chequered flag: WINNER in team colors')}{clip('f1-safety', 'Safety car in the rain, a pit stop, back to green')}</div>
{pic('f1-party', 'LED curtain wall showing a race running order at an F1 watch party')}
<ul><li>Rows show position and driver code with a <b>team color tab</b>.</li>
<li>A <b>tyre dot</b>: red soft, yellow medium, white hard.</li>
<li>A flashing <b>DRS attack bar</b> grows under a driver closing inside one second.</li>
<li><b>Purple</b> for the fastest lap holder, a flashing <b>yellow</b> flag stripe for the safety car, red for a red flag, a chequered stripe at the finish, and <b>rain</b> falling on the wall when it's wet.</li>
<li>Celebrations in the driver's team colors for <b>NEW LEADER</b>, <b>POLE</b>, <b>TOP TIME</b>, <b>WINNER</b>, <b>FASTEST LAP</b> and <b>SAFETY CAR</b>. Pit stops get a soft flash with the stop time.</li></ul>
<p>Works during practice, qualifying and the race, whenever a session is live.</p>
<h2 id="boards">⛳ Golf, 🏁 Racing, 🎾 Tennis and 🥊 UFC</h2>
<p>Tap <span class="k">⛳ Golf</span>, <span class="k">🏁 Racing</span>, <span class="k">🎾 Tennis</span> or <span class="k">🥊 UFC</span> under the scoreboard, or <span class="k">Show on the wall</span> in their panels further down the page.</p>
<ul><li><b>Golf:</b> the tournament leaderboard. Under par shows red like on TV, over par blue. Pick a favorite player and they always get a glowing spot on the wall. A new leader sets off a celebration.</li>
<li><b>Racing:</b> NASCAR Cup, O'Reilly and Truck series, and IndyCar. The running order with each car in its own color and the flag on top: green, caution, red, white for the last lap, checkered at the finish.</li>
<li><b>Tennis:</b> ATP and WTA singles. Each match shows both players, the games in every set, the current set glowing yellow and a ball dot by the server. Pick a favorite and they always get a spot; a set or match win sets off a celebration.</li>
<li><b>UFC:</b> the card for the next or current event, red corner over blue. Live fights show the round and clock, finished ones the result (KO, SUB, DEC), and every finish sets off a celebration in the winner's color.</li></ul>
<p>All of them show the next event's start time when nothing is live.</p>
<div class="grid g2">{clip('live-golf', 'Golf: the leaderboard and a new leader')}{clip('live-nascar', 'NASCAR: caution, new leader, white flag, checkered (demo race)')}</div>
<h2 id="timer">Countdown timer</h2>
{clip('score-timer', 'a one-minute countdown')}
<p>Pick <b>Countdown timer only</b> as the sport for a giant clock across the whole wall: halftime, a party countdown, New Year's Eve.</p>
''', [('gameday', 'Game Day'), ('live', 'Live Fan'), ('stats', 'Live stats'), ('f1', 'F1'), ('boards', 'Golf, racing, tennis, UFC'), ('timer', 'Countdown')])

guide('live-feeds', f'''
<p>Live feeds bring the outside world onto your lights. Tap {rk('LIVE')}, then a big key to put that feed on the wall. Tap it again, or <span class="k">♫ Back to music</span> under the wall, to go back to the music show.</p>
{devframe('phone', 'phone-live', 'The LIVE section on an iPhone with weather on the wall')}
<h2 id="loc">Set your location once</h2>
<p>Weather, storm watch and overhead need to know where you are. In {rk('LIVE')} → <b>Live feeds</b>, type a <b>ZIP code</b> or <b>City, State</b> and tap <span class="k">Save</span>. GlowBop shows the place it found underneath.</p>
<h2 id="countdown">🎉 Countdown</h2>
{clip('live-countdown', 'a party countdown')}
<ul><li>Pick a ready-made countdown: <b>New Year's</b>, <b>Christmas</b>, <b>Halloween</b> or the <b>4th of July</b>. They always point at the next one.</li>
<li>Or add your own: a name, a date and time, and a <b>finale message</b> like HAPPY BIRTHDAY.</li>
<li>Choose a color. The wall shows days, then hours, minutes and seconds. The last minute is giant pulsing seconds, then fireworks and your message.</li>
<li><span class="k">Preview the finale</span> shows the ending right now, so you know what to expect.</li></ul>
<h2 id="weather">🌦️ Weather</h2>
{clip('live-weather', 'weather: now, today, next hours')}
<p>A big temperature over an animated pixel sky: sun and rays, clouds, rain, thunderstorms, snow, fog, and the moon and stars at night. It flips between <b>Now</b>, <b>Today</b> (high and low) and <b>Next hours</b>. Pick °F, °C or Auto. It checks for new weather every 10 minutes.</p>
<h2 id="storm">🌀 Storm watch</h2>
<p>Storm watch is different: it runs quietly <b>on top of the music show</b>, and only if you turn it on. When the National Weather Service puts out a new warning, watch or advisory for your spot, the wall flashes and the alert name scrolls by. A warning keeps a thin red edge glowing until it ends. During hurricane season it also lists named storms and how far away they are.</p>
<ul><li><span class="k">Test alert</span> shows what an alert looks like. While it's on the wall the key turns into <span class="k">Stop the alert</span>, and <span class="k">♫ Back to music</span> under the wall clears it too.</li></ul>
{clip('live-storm', 'a test warning flashing over the music show')}
{tip('<b>Not an official warning system.</b> Always follow NWS alerts, your phone\'s emergency alerts and local officials. Alerts work for US locations.', 'warn')}
<h2 id="overhead">✈️ Overhead now</h2>
<p>A radar of the planes flying over your house right now, with their direction, plus the International Space Station when it comes by. Choose how far out to look. When the space station is as close as it gets, the wall celebrates. Wave hi! 👋</p>
{clip('live-overhead', 'planes over the house, then the space station (demo sky)')}
''', [('loc', 'Location'), ('countdown', 'Countdown'), ('weather', 'Weather'), ('storm', 'Storm watch'), ('overhead', 'Overhead')])

guide('text-logos', f'''
<h2 id="text">Text on the wall</h2>
<ol><li>Tap {rk('TEXT')} and type your message.</li>
<li>Pick a <b>Mode</b>: <span class="k">Scroll</span> (marquee), <span class="k">Beat words</span> (one word per beat), <span class="k">Still</span>, or <span class="k">On drop</span> (shows on each drop).</li>
<li>Pick a <b>Color</b>: <span class="k">Look</span> (follows the show), <span class="k">Rainbow</span> or <span class="k">White</span>.</li>
<li>Pick a <b>Layer</b>: <span class="k">Over the show</span> or <span class="k">Text only</span>. Set the speed, then tap <span class="k">Show text</span>.</li></ol>
{clip('text-birthday', 'Happy Birthday scrolling over a live show')}
{tip('<b>Flash a word on every drop</b>: type one big word like the birthday kid\'s name or "JUMP" and it hits the wall each time the beat drops.', 'pink')}
<h2 id="logo">Your logo</h2>
<ol><li>Under <b>Logo</b>, tap <span class="k">Choose a picture</span>. A PNG with a see-through or black background works best.</li>
<li>Pick a <b>Motion</b>: <span class="k">Glow</span>, <span class="k">Pulse</span> or <span class="k">Colour shift</span>.</li>
<li>Tap <span class="k">Show logo</span>, or <span class="k">Text + logo</span> for both.</li></ol>
<p>Great for DJs, bars, gyms and businesses. Save it and it's ready next time.</p>
{pic('dj-logo-wall', 'A DJ with a logo glowing across four LED curtains')}
<h2 id="saved">Saved messages and logos</h2>
<ul><li>Tap <span class="k">Save</span> under the text or the logo to keep it. It appears as a chip at the bottom of the card.</li>
<li>Tap a saved chip to put it back on the wall.</li>
<li>To delete one, tap the <span class="k">✕</span> next to it. It turns red and asks <b>Delete?</b>. Tap again to delete.</li>
<li><span class="k">🗑️ Remove logo from the wall</span> clears the picture that's loaded right now (your saved copy stays).</li></ul>
<h2 id="mirror">Screen mirror</h2>
<p>Show the laptop screen on the lights: a game, a movie, a music video. It's under {rk('SCENES')}, or tap <span class="k">Mirror</span> under the live wall.</p>
<ul><li><b>Style:</b> <span class="k">TV</span> (the picture), <span class="k">Beat</span> (the picture pulsing to the music), <span class="k">Glow</span> (soft ambient color).</li>
<li><b>Area:</b> <span class="k">Smart fill</span> trims black bars so the video fills the wall; <span class="k">Center zoom</span> shows bigger shapes.</li></ul>
{led('mirror', 'screen mirror', illus=True)}
{tip('Mirror works best with the video playing full screen on the laptop.')}
''', [('text', 'Text'), ('logo', 'Logo'), ('saved', 'Saved items'), ('mirror', 'Screen mirror')])

guide('groups', f'''
<p>By default all your lights are one wall running one show. <b>Groups</b> let you split them: one show on the curtains, another on the tree, for example.</p>
<h2 id="make">Make groups</h2>
<ol><li>Tap {rk('SETUP')}. In <b>Light setup</b>, find <b>Light groups</b>.</li>
<li>Choose <span class="k">All together</span> (one big wall) or <span class="k">Each separate</span>.</li>
<li>Pick a <b>Layout</b>: <span class="k">One canvas</span> stretches shows across lights, <span class="k">Zones</span> gives each light its own area.</li>
<li>Tap <span class="k">Apply & restart lights</span>.</li></ol>
<h2 id="control">Control a group</h2>
<p>With two or more groups, a row of chips appears above the live wall: <b>All groups</b> plus one chip per group. Tap a chip and every button controls only that group. The live preview shows all groups side by side; tap one there to select it.</p>
{clip('groups', 'a show on two curtains, a fireplace on the third')}
''', [('make', 'Make groups'), ('control', 'Control a group')])

guide('troubleshooting', f'''
<h2 id="breather">My phone says "Your lights are taking a breather"</h2>
<p>That screen means your phone can't reach the GlowBop laptop right now. Check the three things it lists: the <b>same Wi-Fi</b>, the <b>laptop awake</b>, and <b>GlowBop open</b> on the laptop. It reconnects by itself as soon as the laptop answers, or tap <span class="k">Try again now</span>.</p>
<h2 id="phone">The console won't open on my phone</h2>
<ul><li>Phone and computer must be on the <b>same Wi-Fi</b>. Not the guest network, and not cellular.</li>
<li>Turn off any <b>VPN</b> on the phone.</li>
<li>In Windows, allow GlowBop on <b>private networks</b> (Windows Security → Firewall → Allow an app).</li>
<li>Make sure your Wi-Fi is set to <b>Private</b> in Windows, not Public.</li></ul>
<h2 id="find">GlowBop can't find my lights</h2>
<ul><li>Check the curtain shows up and works in its own app first.</li>
<li>Restart the curtain (unplug for 10 seconds) and tap <span class="k">Find my lights</span> again.</li>
<li>Use <span class="k">Add by brand</span> if it still hides.</li>
<li><b>Bluetooth lights:</b> close the light's own phone app (they take one connection at a time), keep them within about 30 feet of the computer, and make sure Bluetooth is on in Windows.</li></ul>
<h2 id="silent">The lights don't react to music</h2>
<ul><li>The music must play <b>on the computer</b> GlowBop runs on. Check the sound is actually coming out (volume up, right speaker selected).</li>
<li>The mode bar should say <b>MUSIC SHOW · LISTENING</b>. If something else has taken over (a holiday, the fire, a live feed), tap <span class="k">♫ Back to music</span>.</li></ul>
<h2 id="late">The lights are early or late</h2>
<p>Use the <b>Sync</b> slider. Bluetooth speakers usually need it slid right. See <a href="/guide/music.html#sync">Sync</a>.</p>
<h2 id="upside">A curtain is upside down or out of order</h2>
<p>Run the <a href="/guide/lineup.html">line-up wizard</a> again, fix it, and lock it in.</p>
<h2 id="flicker">Lights flicker or stutter</h2>
<ul><li>Move the router closer, or the curtain's controller closer to the router.</li>
<li>Close heavy programs on the laptop and plug it into power.</li></ul>
<h2 id="sleep">My phone keeps going to the lock screen</h2>
<p>Tap the console once after it opens: the screen then stays on. Check {rk('SETUP')} → <b>Screen</b> says <b>Screen stays on</b>.</p>
<h2 id="score">Live scores aren't updating</h2>
<p>Scores only change while a game is live. Before kickoff the board shows the start time. Check the computer is online.</p>
{tip(f'<b>Still stuck?</b> Tap <span class="k">Help &amp; feedback</span> at the bottom of the console to send us a report, or email <a href="mailto:{MAIL}">{MAIL}</a> with what you see and your light brand.', 'pink')}
''', [('breather', 'Taking a breather'), ('phone', 'Phone'), ('find', 'Finding lights'), ('silent', 'No reaction'), ('late', 'Timing'), ('upside', 'Line-up'), ('flicker', 'Flicker'), ('sleep', 'Screen sleeps'), ('score', 'Live scores')])

# ================================================================ LIGHTS
L = [
    ('ok', 'Supported', 'Twinkly curtains', 'Twinkly Wi-Fi curtains, up to 8 in a row, a stack or a grid, or wrapped into 3D shapes. Tested on our own 2-curtain wall.'),
    ('soon', 'Built in · testing', 'TikTok-style pixel curtains', 'The low-cost Bluetooth RGB pixel curtains sold on TikTok Shop (Surplife app). Found over Bluetooth. Our test panels are on the way.'),
    ('soon', 'New · testing', 'DayBetter strips', 'DayBetter Bluetooth strip lights and light poles. Each strip glows one color at a time, picked from the show and pulsing with the beat.'),
    ('soon', 'Built in · testing', 'WLED', 'DIY strips and matrices running WLED, found on your Wi-Fi.'),
    ('soon', 'Built in · testing', 'Govee', 'Govee lights with LAN Control turned on. They show one color at a time.'),
    ('soon', 'Coming soon', 'Light-only Christmas trees', 'Metal-frame cone trees made of addressable lights (Hello Fairy app).'),
    ('soon', 'Planned', 'More Bluetooth brands', 'Many low-cost Bluetooth strip brands share a few controllers. Tell us yours and we will add it.'),
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
page('/lights.html', 'Supported lights · GlowBop', 'GlowBop supports Twinkly curtains today. TikTok-style Bluetooth pixel curtains, DayBetter strips, WLED and Govee are built in and in testing.', lights, '/lights.html')

# ================================================================ COMPARE
Y, N, M = '<span class="y">✓ Yes</span>', '<span class="n">Not advertised</span>', '<span class="m">Partly</span>'
ROWS = [
    ('#', '🧠 The music brain', 'Everyone flashes on the beat. Only GlowBop listens to the whole song.'),
    ('Flashes on the beat', [(Y, 'Any audio on the PC'), (Y, 'Phone mic, or Music dongle'), (Y, 'PC audio (Desktop), sync box'), (Y, 'PC audio, sync box'), (Y, 'PC audio'), (Y, 'PC audio'), (Y, 'Phone mic, Apple Music')]),
    ('Follows the whole song', [(Y, 'Intro, groove, build-up, drop and breakdown each get their own look'), (N, 'Beat / BPM'), (N, 'Rhythm'), (N, 'Beat'), (N, 'Beat'), (N, ''), (N, 'Beat & mood')]),
    ('Sees the drop coming', [(Y, 'Winds the wall up through the build, then explodes on the drop'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Remembers your songs', [(Y, 'Learns where each drop is and nails it the next time it plays'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Counts bars & downbeats', [(Y, 'Big changes land on the first beat of the bar, like a real lighting operator'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Reads key, mood & genre', [(Y, 'Picks colors and effects to fit the song'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (M, 'Mood')]),
    ('Epic mode for movie music', [(Y, 'Soundtracks and slow songs swell instead of strobing'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('DJ mode', [(Y, 'Hit pads, hold-to-build drops, cue the next look, tap tempo, crowd lines'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Bluetooth speaker sync', [(Y, 'Lights early or late? Nudge them either way, saved per speaker'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('3D shapes', [(Y, 'Wrap curtains around a cylinder, globe or box; effects made for 3D'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Describe a scene', [(Y, 'Type "sunset over the ocean, then fireworks" and it builds the show'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('DJ controller support', [(Y, 'Plug in a USB or Bluetooth DJ controller and map its buttons to the pads'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Built-in music player', [(Y, 'Party mode, sleep timer, crossfade'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('#', '🎛️ Way beyond music', 'One console runs the party, game day and the holidays.'),
    ('A different show per curtain group', [(Y, 'Fireplace on one wall, the game on another'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Scoreboard & live scores', [(Y, '44 live leagues, F1, golf, racing, tennis, UFC'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Arcade games & fireplace', [(Y, '8 self-playing games, 9 fire styles in 9 colors'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Text & logos on the lights', [(Y, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Holiday mini-movies', [(Y, '4 wide-screen movies'), (M, 'Effect library'), (M, 'Scene presets'), (M, 'Scene presets'), (N, ''), (N, ''), (N, '')]),
    ('Live feeds', [(Y, 'Weather, storm watch, countdowns, planes overhead'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('#', '⚙️ Setup & price', ''),
    ('Controls Twinkly lights', [(Y, ''), (Y, ''), (N, 'Govee only'), (N, 'Hue only'), (N, 'Nanoleaf only'), (N, 'WLED / ESP'), (N, 'Hue, LIFX, Nanoleaf')]),
    ('Extra hardware for music', [('<span class="y">None needed, start right now</span>', ''), (M, 'Music dongle sold separately'), (M, 'Sync box for TV/HDMI'), (M, 'Sync box for TV/HDMI'), ('None', ''), ('DIY controller', ''), ('None', '')]),
    ('Many curtains as one wall', [(Y, '1–8: side by side, stacked or a grid'), (M, 'Twinkly only'), (N, ''), (N, ''), (N, ''), (M, 'Virtual strips'), (N, '')]),
    ('Phone & iPad remote', [(Y, 'Any phone or iPad browser, nothing to install. Turns sideways into a big console on iPad'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (N, 'PC app'), (Y, 'It is an iPhone / iPad app')]),
    ('Try the full app before buying', [(Y, 'Right in your browser at glowbop.com/try'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Runs on', [('<b>Windows PC + iPhone, iPad, Android, Mac</b>', 'The show runs on your PC. Control it from any phone, tablet or computer browser'), ('iOS, Android', ''), ('Windows, iOS, Android', ''), ('Windows, Mac', ''), ('Windows, Mac', ''), ('Win, Mac, Linux', ''), ('iPhone, iPad, Mac', '')]),
    ('Price', [('<b>$5.99/mo</b>, $59/yr or $379 once', 'Founder lifetime $129 at launch'), ('Free app; dongle extra', ''), ('Free app; sync box extra', ''), ('Free app; sync box extra', ''), ('See their site', ''), ('Free, open source', ''), ('Paid app', '')]),
]
HEAD = ['GlowBop', 'Twinkly app', 'Govee Home / Desktop', 'Philips Hue Sync', 'Nanoleaf Desktop', 'LedFx', 'Light DJ Pro']
US_HEAD = f'<span class="us-head">{logo_svg()}<b>GlowBop</b><i>★ THE FULL SHOW</i></span>'
tbl = '<table class="cmp"><thead><tr><th></th>' + ''.join(f'<th{" class=us" if i == 0 else ""}>{US_HEAD if i == 0 else h}</th>' for i, h in enumerate(HEAD)) + '</tr></thead><tbody>'
for row in ROWS:
    if row[0] == '#':
        tbl += f'<tr class="grp"><th colspan="8"><b>{row[1]}</b>{f"<span>{row[2]}</span>" if row[2] else ""}</th></tr>'; continue
    name, cells = row
    tbl += f'<tr><th>{name}</th>' + ''.join(f'<td{" class=us" if i == 0 else ""}>{v}{f"<small>{s}</small>" if s else ""}</td>' for i, (v, s) in enumerate(cells)) + '</tr>'
tbl += '</tbody></table>'
compare = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Compare</span><h1>GlowBop vs. <span class="grad">the other light apps</span></h1>
<p class="lead">Most light apps flash on the beat. GlowBop is the most advanced light-show software for LED curtains: it hears the whole song, sees the drop coming, remembers your music, and runs game day and the holidays too.</p></div></header>
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
SELLING = False          # flip to True on launch day: Buy buttons go live (Polar checkout links below)
BUY = {'Monthly': 'https://buy.polar.sh/polar_cl_kVipnhlW4bHB8eL4tKAOXYm5t4Q9nH8pxN0XO4AJUn4',
       'Yearly': 'https://buy.polar.sh/polar_cl_IC4mJM92skvYXkaHAqOsyTWVK6XxQV1CUUW1F2JkwOB',
       'Lifetime': 'https://buy.polar.sh/polar_cl_zLuZrLVyFIje9ESIusnRrWcSwUL8Iqlpr3gL73T2pNn',      # $379
       'Founder': 'https://buy.polar.sh/polar_cl_ryFBIVebhizIWoE5fhSk6KYkibhBiNnVY9avz2d2YtI'}      # $129 launch deal (private product)
PORTAL = 'https://polar.sh/glowbop/portal'
EVERY = ['Music show with build-up & drop detection', 'DJ mode with hit pads, build & drop', 'All 34 looks and 200+ effects', 'Arcade games, holidays & mini-movies', 'Fireplace in every style', 'Sports: 44 live leagues, golf, racing, tennis, UFC, F1', 'Live feeds: countdowns, weather, storm watch', 'Text, logos & screen mirror', 'Up to 8 curtains, grid walls & 3D shapes', 'Console for phone, iPad & laptop', 'All updates']
plan = lambda name, price, per, note, best=False, tag='': f'''<div class="plan{' best' if best else ''} reveal">{f'<span class="tag">{tag}</span>' if tag else ''}<h3>{name}</h3>
<div class="price">{price}<small> {per}</small></div><p class="dim" style="margin:6px 0 0">{note}</p>
<ul class="ticks">{''.join(f'<li>{x}</li>' for x in EVERY)}</ul>
{(f'<a class="btn{" primary" if best else ""}" href="{BUY[name]}">{"Buy once" if name == "Lifetime" else "Start free trial"}</a>' if SELLING and BUY.get(name) else f'<a class="btn{" primary" if best else ""}" href="{WAIT}">Join the launch list</a>')}</div>'''
pricing = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Pricing</span><h1>Simple pricing, <span class="grad">every feature</span></h1>
<p class="lead">Every plan includes everything. Start with a <b>7-day free trial</b>, cancel anytime.</p>
<span class="pill">🎃 Launching this Halloween. Join the list and we'll email you on day one.</span></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="founder reveal"><span class="tag">🎃 Founder launch deal</span><h3>Lifetime for <b>$129</b> <s>$379</s></h3><p>During launch week, or for the first 100 buyers, whichever comes first. Pay once, keep GlowBop and every update forever.</p>{f'<a class="btn primary" href="{BUY["Founder"]}">🎃 Grab the Founder deal</a>' if SELLING else ''}</div>
<div class="plans">{plan('Monthly', '$5.99', '/ month', 'Perfect for a party season.')}{plan('Yearly', '$59', '/ year', 'About $4.92 a month. 2 months free.', True, 'Best value')}{plan('Lifetime', '$379', 'once', 'Pay once, keep it forever. Founders pay $129 at launch.')}</div>
<p class="center dim" style="margin-top:22px;font-size:15px">Payments are handled securely by Polar. Prices in USD.</p>
<div style="max-width:780px;margin:50px auto 0"><h2 class="center">Pricing questions</h2>
<details><summary>How does the free trial work?</summary><p>You get 7 days with every feature. If you cancel before the trial ends, you pay nothing.</p></details>
<details><summary>What is the Founder deal?</summary><p>To celebrate the launch, lifetime costs $129 instead of $379 during launch week or for the first 100 buyers, whichever comes first. Same app, every feature, every update, forever.</p></details>
<details><summary>Can I switch plans?</summary><p>Yes. Start monthly and move to yearly or lifetime whenever you like.</p></details>
<details><summary>Do I need to buy anything else?</summary><p>Just your lights and a Windows computer. No dongles, sync boxes or extra subscriptions. Song lookup uses free keys.</p></details>
</div></div></section>{band()}'''
thanks = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">You're in</span><h1>Thanks for getting <span class="grad">GlowBop</span>! 🎉</h1>
<p class="lead">Your order went through. Here's how to get your lights dancing.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:780px">
<div class="grid g3">
<div class="card reveal"><div class="em">📧</div><h3>1. Check your email</h3><p>Polar sends your receipt and your <b>GlowBop license key</b> (it starts with GLOWBOP-). Check spam if it's not there in a few minutes.</p></div>
<div class="card reveal"><div class="em">⬇️</div><h3>2. Install GlowBop</h3><p><a class="btn primary small" href="/download/GlowBop-Setup.exe" download>Download for Windows</a></p><p>Run it, then follow the <a href="/guide/getting-started.html">getting started guide</a> to find your lights.</p></div>
<div class="card reveal"><div class="em">🔑</div><h3>3. Paste your key</h3><p>Open GlowBop, paste your license key when it asks, and press play on any song.</p></div>
</div>
<p class="center dim" style="margin-top:26px">Lost your key or want to change plans? Open your <a href="{PORTAL}">customer portal</a>. Questions? Email <a href="mailto:{MAIL}">{MAIL}</a>.</p>
</div></section>'''
page('/thanks.html', 'Thank you · GlowBop', 'Your GlowBop order is complete. Find your license key and install the app.', thanks, '/thanks.html')
page('/pricing.html', 'Pricing · GlowBop', 'GlowBop costs $5.99 a month, $59 a year, or $379 once, with a $129 Founder lifetime deal at launch. Every plan has every feature and a 7-day free trial.', pricing, '/pricing.html')


# ================================================================ DOWNLOAD
SHA = open(os.path.join(HERE, 'download', 'sha256.txt')).read().strip()
download = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Download</span><h1>Get <span class="grad">GlowBop</span> for Windows</h1>
<p class="lead">Version 1.0.0 · Windows 10 and 11 · about 23 MB. Installs just for your Windows account, no admin password needed.</p>
<p style="margin-top:22px"><a class="btn primary" href="/download/GlowBop-Setup.exe" download>⬇️ Download GlowBop-Setup.exe</a></p>
<p class="dim" style="font-size:14px;margin-top:12px">You'll need a license key to unlock it. <a href="/pricing.html">Start a 7-day free trial</a> to get one.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:820px">
<h2>Install in 4 steps</h2>
<ol><li>Open the downloaded <b>GlowBop-Setup.exe</b>. If your browser says it "isn't commonly downloaded", choose <b>Keep</b>.</li>
<li>If Windows shows <b>"Windows protected your PC"</b>, click <b>More info</b>, then <b>Run anyway</b>. This appears for new apps from small makers, not because anything is wrong.</li>
<li>Click <b>Install</b>, then <b>Finish</b> with "Open GlowBop now" ticked.</li>
<li>Paste the <b>license key</b> from your Polar email (it starts with GLOWBOP-) and tap <b>Unlock</b>. Then follow the <a href="/guide/getting-started.html#find">setup guide</a> to find your lights.</li></ol>
{tip('<b>Moving to a new computer?</b> In the old one, open Light setup and tap <b>Move my license to another computer</b>, then install here and paste your key.', 'pink')}
<details style="margin-top:26px"><summary>For the careful: check the file</summary><p>SHA-256 of GlowBop-Setup.exe:<br><code style="word-break:break-all">{SHA}</code></p></details>
<details><summary>How do I uninstall?</summary><p>Windows Settings, then Apps, then GlowBop, then Uninstall. Your lights go back to their own apps.</p></details>
</div></section>'''
page('/download.html', 'Download · GlowBop', 'Download GlowBop for Windows 10 and 11. Installs in a minute, no admin password needed.', download, '/download.html')

# ================================================================ SUPPORT (bug reports + feature requests)
SUPPORT_URL = ''          # the GlowBop support inbox (Google Apps Script web app URL)
support = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Support</span><h1>How can we <span class="grad">help</span>?</h1>
<p class="lead">Found a bug or dreaming up a new feature? Tell us here. You'll get an email with your ticket number, and we read every message.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:720px">
<div class="sup-tabs" role="tablist"><button type="button" class="on" data-k="bug">🐞 Report a bug</button><button type="button" data-k="request">💡 Request a feature</button></div>
<form id="supForm" class="sup card" novalidate>
<p class="dim" id="supHint" style="margin:0 0 6px">What happened, and what did you expect? Steps to make it happen again help a lot.</p>
<label>Your email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
<label>Your name <span class="dim">(optional)</span><input type="text" name="name" autocomplete="name"></label>
<label>Short summary<input type="text" name="subject" maxlength="150" placeholder="Right curtain freezes on Next effect"></label>
<label>Details<textarea name="message" rows="6" maxlength="6000" required></textarea></label>
<div class="sup-bug">
<label>Your lights<select name="lights"><option value="">Choose…</option><option>Twinkly</option><option>Surplife / TikTok Bluetooth curtain</option><option>Govee</option><option>WLED</option><option>Mixed brands</option><option>Not set up yet</option></select></label>
<label>Windows version <span class="dim">(optional)</span><input type="text" name="windows" placeholder="Windows 11"></label>
</div>
<input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
<button class="btn primary" type="submit" id="supSend">Send</button>
<p class="dim" style="font-size:14px;margin:12px 0 0">Tip: reporting from inside the GlowBop app (💬 Help &amp; feedback) can attach tech info so we fix it faster.</p>
<p id="supMsg" class="sup-msg" role="status"></p>
</form>
<div id="supDone" class="card center sup-done" hidden></div>
<p class="center dim" style="margin-top:26px">Something not working right now? Try the <a href="/guide/troubleshooting.html">troubleshooting guide</a> first.</p>
</div></section>
<script>
(function(){{
var URL={_json.dumps(SUPPORT_URL)},kind=location.hash==='#request'?'request':'bug',f=document.getElementById('supForm');
var H={{bug:'What happened, and what did you expect? Steps to make it happen again help a lot.',request:'What would you love GlowBop to do? Tell us how you would use it.'}};
var P={{bug:'Example: When I tap Next effect, the right curtain freezes for a few seconds.',request:'Example: A New Year\u2019s Eve countdown that ends in fireworks.'}};
function set(k){{kind=k;document.querySelectorAll('.sup-tabs button').forEach(function(b){{b.classList.toggle('on',b.dataset.k===k)}});
document.getElementById('supHint').textContent=H[k];f.message.placeholder=P[k];document.querySelector('.sup-bug').style.display=k==='bug'?'':'none';
document.getElementById('supForm').hidden=false;document.getElementById('supDone').hidden=true;}}
document.querySelectorAll('.sup-tabs button').forEach(function(b){{b.onclick=function(){{set(b.dataset.k);history.replaceState(null,'',b.dataset.k==='request'?'#request':'#bug')}}}});
window.addEventListener('hashchange',function(){{set(location.hash==='#request'?'request':'bug')}});
set(kind);
var msg=document.getElementById('supMsg');
f.onsubmit=function(e){{e.preventDefault();msg.textContent='';
var d={{token:'glowbop-support-v1',source:'website',kind:kind,email:f.email.value.trim(),name:f.name.value.trim(),subject:f.subject.value.trim(),message:f.message.value.trim(),website:f.website.value}};
if(kind==='bug'){{d.lights=f.lights.value;d.windows=f.windows.value.trim();d.version='website'}}
if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{{2,}}$/.test(d.email)){{msg.textContent='Please enter your email so we can reply.';f.email.focus();return}}
if(d.message.length<5){{msg.textContent='Please tell us a bit more.';f.message.focus();return}}
if(!URL){{msg.innerHTML='Our support inbox is getting set up. Please email <a href="mailto:{MAIL}">{MAIL}</a> for now.';return}}
var btn=document.getElementById('supSend');btn.disabled=true;btn.textContent='Sending…';
fetch(URL,{{method:'POST',body:JSON.stringify(d)}}).then(function(r){{return r.json()}}).then(function(j){{
btn.disabled=false;btn.textContent='Send';
if(!j.ok){{msg.textContent=j.error||'Could not send. Please try again.';return}}
var box=document.getElementById('supDone');box.innerHTML='';
var h=document.createElement('h2');h.textContent=(kind==='bug'?'🐞 ':'💡 ')+'Thanks! We got it.';
var t=document.createElement('p');t.className='sup-ticket grad';t.textContent=j.ticket||'';
var p=document.createElement('p');p.textContent='A confirmation is on its way to '+d.email+'. Reply to it any time to add photos or videos.';
box.append(h,t,p);f.reset();f.hidden=true;box.hidden=false;box.scrollIntoView({{behavior:'smooth',block:'center'}});
}}).catch(function(){{btn.disabled=false;btn.textContent='Send';msg.innerHTML='Could not reach us. Check your connection, or email <a href="mailto:{MAIL}">{MAIL}</a>.'}});
}};
}})();
</script>'''
page('/support.html', 'Support · GlowBop', 'Report a GlowBop bug or request a new feature. We read every message and reply by email.', support, '/support.html')

# ================================================================ LEGAL (plain English)
def legal(path, title, desc, intro, sections):
    body = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Legal</span><h1>{title}</h1>
<p class="lead">{intro}</p><p class="dim" style="font-size:14px">Last updated October 14, 2026</p></div></header>
<section style="padding-top:10px"><div class="wrap prose" style="max-width:780px">''' + ''.join(f'<h2>{h}</h2>{t}' for h, t in sections) + f'''
<h2>Contact</h2><p>GlowBop is made by Marketing Savvy LLC in Fort Myers, Florida, USA. Questions? Email <a href="mailto:{MAIL}">{MAIL}</a>.</p></div></section>'''
    page(path, title + ' · GlowBop', desc, body, path)

legal('/terms.html', 'Terms of Use', 'The rules for using GlowBop.', 'The short version: use GlowBop to make your lights look great, keep your key to yourself, and be nice.', [
 ('Who we are', '<p>GlowBop is software made by Marketing Savvy LLC ("we", "us"). By installing or using GlowBop you agree to these terms.</p>'),
 ('Buying GlowBop', '<p>Orders are handled by <a href="https://polar.sh" rel="noopener">Polar</a>, our reseller and Merchant of Record. Polar takes the payment, charges any sales tax, and sends your receipt and license key. Polar\'s own terms also apply to your purchase.</p>'),
 ('Your license', '<p>Your plan gives you a personal license to use GlowBop on your own computers and lights while the plan is active (for Lifetime, for as long as GlowBop is offered). Please don\'t share, resell or publish your license key, and don\'t try to get around the license check.</p>'),
 ('Subscriptions and trials', '<p>Monthly and yearly plans renew automatically until you cancel. Every plan that offers a free trial charges nothing until the trial ends; cancel before then and you pay nothing. You can cancel any time from your Polar customer portal, and you keep access until the end of the period you paid for.</p>'),
 ('Your lights and music', '<p>GlowBop sends light data to lights on your own network. You\'re responsible for using your lights safely and following their maker\'s instructions. GlowBop reacts to whatever plays on your computer; you\'re responsible for having the rights to the music and videos you play.</p>'),
 ('Other services', '<p>Some features use other companies\' services, like YouTube for playing music, Last.fm and GetSongBPM for song facts, and sports score feeds. They are run by those companies under their own terms, and they can change or stop working at any time.</p>'),
 ('No warranty', '<p>We work hard to make GlowBop great, but it is provided "as is", without warranties of any kind. We can\'t promise it will work with every light, every network or every song.</p>'),
 ('Limits on liability', '<p>To the extent the law allows, our total liability for anything related to GlowBop is limited to the amount you paid for it in the 12 months before the claim. We are not liable for indirect or consequential losses.</p>'),
 ('Changes', '<p>We may update GlowBop and these terms. If we make a big change to the terms, we\'ll update the date above and, where it matters, let customers know by email.</p>'),
 ('Law', '<p>These terms are governed by the laws of the State of Florida, USA.</p>'),
])
legal('/privacy.html', 'Privacy Policy', 'What GlowBop collects (very little) and why.', 'The short version: GlowBop runs on your computer, and we don\'t track you.', [
 ('The app', '<p>GlowBop runs on your own computer and talks to your lights over your home network. Your music, light setups, saved looks, photos and logos stay on your computer. We don\'t run accounts, analytics or ads in the app.</p>'),
 ('Your license key', '<p>To unlock GlowBop, the app sends your license key and your computer\'s name to Polar to check it, and re-checks about twice a day. This is how we know a key is valid; nothing else about your computer is sent.</p>'),
 ('Song lookup', '<p>If you add your own free Last.fm or GetSongBPM keys, GlowBop sends the name and artist of the song playing to those services to look up its genre and tempo. You can leave the keys blank to turn this off.</p>'),
 ('Music and sports', '<p>When you play music through GlowBop, it uses YouTube, and YouTube\'s privacy policy applies. Scoreboard features fetch public scores from sports feeds; they don\'t receive anything about you.</p>'),
 ('Buying', '<p>When you buy, Polar (our Merchant of Record) and its payment provider Stripe handle your name, email and payment details under their own privacy policies. We receive your name, email and what you bought so we can support you. We never see your full card number.</p>'),
 ('This website', '<p>glowbop.com is hosted by GitHub Pages and loads fonts from Google Fonts, so those services see your IP address like any website visit. We don\'t use tracking cookies or analytics.</p>'),
 ('Email', '<p>If you email us, we keep the conversation so we can help you. We don\'t sell or share email addresses. Ask us any time and we\'ll delete your messages.</p>'),
 ('Children', '<p>GlowBop is not directed at children under 13, and we don\'t knowingly collect their information.</p>'),
])
legal('/refunds.html', 'Refund Policy', 'How refunds work for GlowBop.', 'The short version: try it free first, and if it\'s not working for you, we\'ll make it right.', [
 ('Try before you pay', '<p>Monthly and yearly plans start with a 7-day free trial. Cancel before the trial ends and you\'re never charged.</p>'),
 ('14-day refunds', '<p>If GlowBop isn\'t working for you, email <a href="mailto:hello@glowbop.com">hello@glowbop.com</a> within 14 days of a charge and we\'ll refund it. This covers your first monthly or yearly charge and Lifetime purchases.</p>'),
 ('Cancelling', '<p>Cancel any time from your Polar customer portal. You keep GlowBop until the end of the period you paid for, and you won\'t be charged again.</p>'),
 ('How refunds are paid', '<p>Refunds go back to your original payment method through Polar, and usually show up in 5 to 10 business days. After a refund, the license key stops working.</p>'),
])

# ================================================================ FAQ
Q = [
    ('What is GlowBop?', 'A Windows app that turns LED curtain lights into a live light show. It listens to your music and also does holiday scenes, scoreboards, text, logos and screen mirroring. You control it from your phone.'),
    ('Which lights does it work with?', 'Twinkly curtains today. TikTok-style pixel curtains, light-only Christmas trees, WLED and Govee are being tested. See <a href="/lights.html">Supported lights</a>.'),
    ('Do I need a Mac version?', 'GlowBop runs on Windows 10 and 11 for now. Want Mac? Email us. Requests decide what we build next.'),
    ('What music apps does it work with?', 'All of them. GlowBop listens to the sound your computer plays: Spotify, YouTube, Apple Music, Amazon Music, DJ software, videos, anything.'),
    ('Can I play music from my phone?', 'GlowBop listens on the computer, so play the music on the computer and send it to your speakers. Bluetooth speakers work; use the Sync slider to line them up.'),
    ('Does it need a microphone or a dongle?', 'No. It listens to the computer\'s own sound, so room noise and talking don\'t throw it off.'),
    ('Do I need to install an app on my phone?', 'No. Scan the QR code and the remote opens in your phone\'s browser. Add it to your home screen for an app icon.'),
    ('Can it just be a fireplace?', 'Yes. Tap 🔥 Light the fire and the whole wall becomes flickering flames, no fireplace frame or logs. Pick from 9 styles (campfire, candles, torches, lava, dragon breath and more), 9 colors and Cozy or Roaring. See the <a href="/guide/fireplace.html">Fireplace guide</a>.'),
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

# ================================================================ GALLERY
def gal_section(title, sub, names, anchor):
    tiles = ''.join(f'<div class="gtile reveal">{clip(n)}<h3>{html.escape(CLIPS[n]["title"])}</h3>'
                    + (f'<p>{html.escape(CLIPS[n]["desc"])} look</p>' if CLIPS[n].get('desc') else '') + '</div>' for n in names)
    return f'<section class="tight" id="{anchor}"><div class="wrap"><h2>{title}</h2><p class="lead">{sub}</p><div class="grid g3 gal" style="margin-top:22px">{tiles}</div></div></section>'


_by = lambda g: [k for k, v in CLIPS.items() if v['group'] == g]
FIRST = ['fire-dragon', 'fire-campfire', 'fire-candles-rainbow', 'fire-lava', 'fire-bonfire', 'fire-spirit', 'fire-torches', 'fire-pixel', 'fire-candles', 'fire-campfire-team', 'fx-pixelfireworks', 'fx-tesseract', 'fx-laserweb', 'fx-crystalgem', 'fx-volcano', 'fx-solarflare', 'fx-atomorbit', 'fx-wiretorus', 'fx-tornado',
         'look-3d-depth', 'look-club-rig', 'look-neon-party', 'look-deep-space', 'look-psychedelic', 'look-hyperspace', 'look-wild-elements', 'look-retro-arcade',
         'look-mainstage', 'look-synthwave', 'look-warehouse-rave', 'look-rainbow-riot',
         'movie-halloweennight', 'movie-christmaseve', 'movie-newyearcountdown', 'movie-harvestday',
         'fire-rainbow-cozy', 'fire-purple-roar', 'fire-classic-roar', 'fire-blue-cozy',
         'wave-serpent', 'wave-bigwave', 'shape-spinningglobe', 'shape-barberspin',
         'score-baseball', 'score-football', 'score-f1', 'f1-win', 'f1-safety', 'live-nascar', 'live-overhead', 'live-storm', 'live-weather']
_by = lambda g: sorted([k for k, v in CLIPS.items() if v['group'] == g], key=lambda k: FIRST.index(k) if k in FIRST else 999)
GROUPS = [('New effects', '👾 Showstoppers', 'The newest effects: 3D shapes, laser webs, pixel fireworks, wild weather and self-playing retro games.', 'new'),
          ('Looks', '🎨 All 34 looks', 'Each look is a mood with its own colors and effects. These are 8-second slices with a drop halfway, exactly as the app plays them.', 'looks'),
          ('Big Wave', '🌊 Big Wave', 'The newest family of effects: waves that roll, a serpent that swims and an ocean swell.', 'wave'),
          ('Holidays', '🎃 Holidays', 'Every holiday has its own button. Four of them play full wide-screen mini-movies.', 'holidays'),
          ('Fireplace', '🔥 Fireplace', 'Nine styles of fire, simulated live so it never repeats: campfire, bonfire, candles, torches, pixel, spirit, lava, dragon breath and the classic fireplace.', 'fireplace'),
          ('3D shapes', '🌐 3D shapes', 'Effects made for curtains wrapped around a cylinder, a box or a globe. Shown here unrolled, flat.', 'shapes'),
          ('Scoreboard', '🏟️ Sports', 'Game Day for every sport, Live Fan with live stats, golf, NASCAR, the F1 board and the giant countdown clock.', 'scoreboard'),
          ('Live feeds', '📡 Live feeds', 'Countdown, weather, storm watch and overhead, recorded with demo data.', 'live'),
          ('Text & logos', '🔤 Text & logos', 'Your words on top of the show.', 'text'),
          ('Music', '💥 Big moments', 'A drop, and an epic climax.', 'music')]
gal = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">🔴 Gallery</span><h1>Every pattern, <span class="grad">for real</span></h1>
<p class="lead">Everything on this page was recorded straight from the GlowBop engine on a two-curtain wall (40 × 21 lights). What you see is what your lights do.</p>
<div class="toc" style="justify-content:center">{''.join(f'<a href="#{a}">{t}</a>' for _, t, _, a in GROUPS)}</div></div></header>
{''.join(gal_section(t, sub, _by(g), a) for g, t, sub, a in GROUPS if _by(g))}
{band()}'''
page('/gallery.html', 'Gallery · GlowBop', 'Real recordings of every GlowBop look, effect, holiday, fireplace and scoreboard, straight from the engine.', gal, '/gallery.html')

# ================================================================ 404
page('/404.html', 'Page not found · GlowBop', 'This page is not here.', f'''<section><div class="wrap center"><h1>4<span class="grad">0</span>4</h1><p class="lead">This page went dark.</p>
<div style="max-width:520px;margin:20px auto">{clip('sparkle', 'lost in the sparkles')}</div><a class="btn primary" href="/">Back home</a></div></section>''')

# ---------- assets + photo list
shutil.copytree(os.path.join(HERE, 'assets'), os.path.join(OUT, 'assets'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'img'), os.path.join(OUT, 'img'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'clips'), os.path.join(OUT, 'clips'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'download'), os.path.join(OUT, 'download'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'try'), os.path.join(OUT, 'try'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.py', '__pycache__'))   # 🕹️ try-it demo: the real console on a pretend wall
with open(os.path.join(OUT, 'PHOTOS.md'), 'w') as f:
    f.write('# Photo & video spots\n\nEach animated LED placeholder on the site is waiting for a real photo or clip. Send them over and they get swapped in.\n\n')
    for pth, cap in PHOTOS: f.write(f'- **{pth}**: {cap}\n')
print(len(PHOTOS), 'photo spots')
