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
       ('/lights.html', 'Lights', 'var(--orange)'), ('/compare.html', 'Compare', 'var(--violet)'), ('/pro.html', 'Pro', 'var(--gold)'), ('/pricing.html', 'Pricing', 'var(--green)'), ('/faq.html', 'FAQ', 'var(--gold)')]


def logo_svg():
    """The sparkle logo: the app icon's 7x7 Curtain Burst as live SVG dots (site.js makes random dots glint white)."""
    P, V, C, W, D = '#ff3d9a', '#9b3dff', '#33d6ff', '#ffffff', '#221d33'
    M = [[D, D, C, C, C, D, D], [D, C, V, V, V, C, D], [C, V, P, P, P, V, C], [C, V, P, W, P, V, C], [C, V, P, P, P, V, C], [D, C, V, V, V, C, D], [D, D, C, C, C, D, D]]
    dots = ''.join(f'<circle cx="{9 + k * 13}" cy="{9 + r * 13}" r="4.6" fill="{col}"{"" if col == D else " data-l"}/>' for r, row in enumerate(M) for k, col in enumerate(row))
    return ('<span class="gbsvg" role="img" aria-label="GlowBop"><svg viewBox="0 0 96 96" aria-hidden="true"><defs><filter id="gbGlow" x="-1" y="-1" width="3" height="3">'
            '<feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' + dots + '</svg></span>')


def vid(name, label='', cls='gbv', extra='', preload='none'):
    """A GlowBop recording as a plain looping video (video/<name>.mp4, made by tools/render_videos.py).
    Muted + playsinline so it plays on iPhone / iPad; site.js starts it when it scrolls into view."""
    aria = f' aria-label="{html.escape(label)}"' if label else ' aria-hidden="true"'
    return (f'<video class="{cls}" src="/video/{name}.mp4" poster="/video/{name}.jpg" muted loop playsinline webkit-playsinline '
            f'preload="{preload}" disableremoteplayback{aria}{extra}></video>')


def led(scene, caption, w=40, h=21, cls='', demo=False, illus=False):
    # the browser-only scenes (live fire simulation, screen mirror) are recorded to video/sim-<scene>.mp4 (tools/record_sims.js)
    v = vid('sim-' + scene, caption)
    if demo:
        return f'<figure class="led demo {cls}">{v}<figcaption>🔴 Live · {html.escape(caption)}</figcaption></figure>'
    if illus:
        return f'<figure class="led {cls}">{v}<figcaption>🎨 Illustration · {html.escape(caption)}</figcaption></figure>'
    PHOTOS.append((CUR[0], caption))
    return f'<figure class="led {cls}">{v}<figcaption>📷 Placeholder · {html.escape(caption)}</figcaption></figure>'


import json as _json
CLIPS = _json.load(open(os.path.join(HERE, 'clips.json')))
VIDEOS = _json.load(open(os.path.join(HERE, 'videos.json')))      # reel / hero playlists, shared with tools/render_videos.py


def reel(key, label_id='', cap='GlowBop showreel'):
    """A showreel video; its caption follows the clip on screen (cue times from video/reel-<key>.json)."""
    cf = os.path.join(HERE, 'video', f'reel-{key}.json')
    cues = open(cf).read().strip() if os.path.exists(cf) else '[]'
    extra = f' data-cues="{html.escape(cues)}"' + (f' data-label="{label_id}"' if label_id else '')
    return vid('reel-' + key, cap, extra=extra)


def clip(name, caption=None, cls=''):
    m = CLIPS[name]; cap = caption or m['title']
    return (f'<figure class="led real {cls}" style="aspect-ratio:{m['w']}/{m['h']}">{vid(name, cap)}'
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
<link rel="stylesheet" href="/assets/style.css?v=4">
<link rel="stylesheet" href="/assets/console.css?v=23">
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
    <div><a class="ftlogo" href="/"><img src="/img/brand/glowbop-logo.webp" alt="GlowBop" width="880" height="233" loading="lazy"></a>
      <p class="dim" style="margin-top:12px;font-size:15px;max-width:34ch">Your lights, dancing to your music. A light show app for LED curtains, made in Fort Myers, Florida.</p>
      <a class="btn small" href="{WAIT}">✉️ Join the launch list</a></div>
    <div><h4>Product</h4><ul><li><a href="/features.html">Features</a></li><li><a href="/gallery.html">Gallery</a></li><li><a href="/lights.html">Supported lights</a></li><li><a href="/compare.html">Compare</a></li><li><a href="/pro.html">Pro DJ</a></li><li><a href="/pricing.html">Pricing</a></li></ul></div>
    <div><h4>Guide</h4><ul><li><a href="/guide/getting-started.html">Getting started</a></li><li><a href="/guide/music.html">Music show</a></li><li><a href="/guide/pro-dj.html">Pro DJ tools</a></li><li><a href="/guide/scoreboard.html">Scoreboard</a></li><li><a href="/guide/troubleshooting.html">Troubleshooting</a></li></ul></div>
    <div><h4>Help</h4><ul><li><a href="/download.html">Download</a></li><li><a href="/faq.html">FAQ</a></li><li><a href="/support.html">Report a bug</a></li><li><a href="/support.html#request">Request a feature</a></li><li><a href="mailto:{MAIL}">{MAIL}</a></li></ul></div>
  </div>
  <div class="fine"><span><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a></span><span>© 2026 GlowBop, a product of Marketing Savvy LLC. Twinkly, Govee and other brand names belong to their owners. GlowBop is not affiliated with them.</span>
  <span>Tempo data by <a href="https://getsongbpm.com" rel="noopener">GetSongBPM</a> · Genre data by <a href="https://www.last.fm" rel="noopener">Last.fm</a></span></div>
</div></footer>
<script>window.GB_CLIPS={CLIPS_JS};</script>
<script src="/assets/site.js?v=14"></script>
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
TICK_ITEMS = ['300+ EFFECTS', '44 LIVE LEAGUES', 'DJ MODE', 'SONG SHOWS', 'SEES THE DROP COMING', 'KNOWS ROCK FROM JAZZ', '9 FIRE STYLES', '8 ARCADE GAMES', 'F1 RACE DAY', 'REMEMBERS YOUR SONGS',
              'HOLIDAYS WORLDWIDE', 'EARTHQUAKES & AURORA LIVE', 'DRAW YOUR LAYOUT', '3D SHAPES', '1–8 CURTAINS', 'LIVE WEATHER']
def ticker():
    run = ''.join(f'<span>{t}</span><i>★</i>' for t in TICK_ITEMS)
    return f'<div class="ledtick" aria-label="{html.escape(" · ".join(TICK_ITEMS))}"><div class="ledtick-run" aria-hidden="true">{run}{run}</div></div>'

WORKS = ('<div class="works reveal"><span class="wk">Works with</span>'
         '<a class="wb ok" href="/lights.html">Twinkly curtains <i>supported</i></a>'
         '<a class="wb" href="/lights.html">WLED <i>testing</i></a>'
         '<a class="wb" href="/lights.html">Govee <i>testing</i></a>'
         '<a class="wb" href="/lights.html">DayBetter <i>testing</i></a>'
         '<a class="wb" href="/lights.html">Bluetooth pixel curtains <i>testing</i></a>'
         '<a class="wb soonx" href="/lights.html">xLights houses <i>coming</i></a>'
         '<a class="wb more" href="/lights.html#soon">More on the way →</a></div>')

FEATS = [
    ('🧠', 'Hears the whole song', 'Not just the beat: it sees the drop coming, remembers your songs, counts the bars and reads the mood. The most advanced music brain for LED lights.', '/guide/music.html'),
    ('🎛️', 'A real light console', 'A control panel for phone, iPad and laptop, with a live view of your wall, Power and Brightness keys on every page, and big colored keys grouped into Perform, Visuals, Pro and System.', '/guide/console.html', 1),
    ('🎨', '45 looks, 300+ effects', 'Neon Party, Deep Space, Retro Arcade, Big Wave and new calm, jazz, flow and genre looks. Rock, hip-hop, Latin, country and kids songs each get their own.', '/guide/looks.html', 1),
    ('🌙', 'Calm when the song is calm', 'Movie scores, chill and jazz stay soft and flowing, with 12 calm effects and a Jazz light style. Melodic bass gets 14 silky flow effects.', '/guide/looks.html#calm', 1),
    ('📡', 'Live feeds', 'Countdowns, weather, storm watch, planes overhead, earthquakes, the aurora, rocket launches, the moon, a spinning globe, volcanoes and wildfires.', '/guide/live-feeds.html', 1),
    ('🏟️', 'Sports + live stats', '44 leagues with live stats, from the NFL to the Bundesliga, college softball and cricket, plus golf, racing, tennis, UFC and F1 boards.', '/guide/scoreboard.html', 1),
    ('🏎️', 'F1 race day', 'Live timing in team colors, a DRS attack bar, and the wall explodes for a new leader, the safety car and the chequered flag.', '/guide/scoreboard.html#f1', 1),
    ('🌐', '3D shapes', 'Wrap your curtains around a cylinder, a box or a globe for a glowing art piece.', '/guide/shapes.html', 1),
    ('🧩', '1 to 8 curtains', 'Side by side, stacked, overlapping or a grid of rows and columns. Every show resizes to fit.', '/guide/lineup.html', 1),
    ('✏️', 'Draw your layout', 'Rooflines, windows, arches, trees and stage truss: draw where your lights run on a photo and the effects follow your real shapes.', '/guide/lineup.html#draw', 1),
    ('🎃', 'Holidays worldwide', '23 holiday shows picked for your country: Diwali, Lunar New Year, Hanukkah, Eid, Día de Muertos and more, plus mini-movies for the big nights.', '/guide/holidays.html', 1),
    ('🔥', 'Nine kinds of fire', 'Fireplace, campfire, bonfire, candles, torches, pixel flames, spirit fire, lava and dragon breath.', '/guide/fireplace.html', 1),
    ('🎧', 'DJ mode', '12 hit pads, keys to skip a look or an effect, hold-to-build drops, cue the next look, tap tempo and crowd lines.', '/guide/dj.html', 1),
    ('🕹️', 'Arcade games', 'Breakout, Snake, Pong, Alien parade and more, playing themselves on your wall.', '/guide/looks.html#games', 1),
    ('🔤', 'Text & logos', 'Party messages, names, your DJ logo. Scroll it, flash it on every drop.', '/guide/text-logos.html'),
    ('📺', 'Screen mirror', 'Put the game, a movie or a music video right on the lights.', '/guide/text-logos.html#mirror'),
    ('📱', 'Phone, iPad, laptop', 'Scan a QR code and the console opens in your browser. Nothing to install, turns sideways on iPad.', '/guide/getting-started.html#phone'),
    ('🔊', 'A console with a voice', '12 sound styles for the console\'s little chirps, from Arcade and Synthwave to Spooky and Deep Sea Deco. All original sounds.', '/guide/console.html#sounds', 1),
]


WALLR = _json.load(open(os.path.join(HERE, 'wallrects.json')))
LIVEWALL = {'phone-music': 'wave-serpent', 'phone-live': 'live-weather', 'phone-score': 'score-soccer', 'phone-looks': 'wave-twinwaves',
            'ipad-land': 'wave-bigwave', 'ipad-port': 'fx-pixelfireworks', 'desk-live': 'live-countdown'}


TRYPAGE = {'desk-live': 'feeds', 'desk-setup': 'lights', 'ipad-land': 'music', 'ipad-port': 'music', 'phone-music': 'music',
           'phone-live': 'feeds', 'phone-score': 'score', 'phone-looks': 'looks'}


def devframe(kind, img, alt, tag='', c='var(--amber)', cap=''):
    inner = f'<img src="/img/app/{img}.webp" alt="{html.escape(alt)}" loading="lazy">'
    if img in LIVEWALL:                      # the live wall in the screenshot plays a real recording, like the real app
        x, y, w, h = WALLR[img]
        inner += vid(LIVEWALL[img], cls='gbv wallov', extra=f' style="left:{x}%;top:{y}%;width:{w}%;height:{h}%"')
    base = '<div class="base"></div>' if kind == 'laptop' else ''
    t = f'<span class="tag" style="--c:{c}">{tag}</span>' if tag else ''
    fc = f'<figcaption>{cap}</figcaption>' if cap else ''
    pg = TRYPAGE.get(img, 'music')           # 🕹️ a tap on the screenshot opens that page in the live demo
    return (f'<figure class="dev {kind} reveal">{t}<a class="scr" href="/try/#{pg}" aria-label="Try this in the live demo: {html.escape(alt)}">'
            f'{inner}<span class="try" aria-hidden="true">▶ Try it live</span></a>{base}{fc}</figure>')


TRY = """<figure class="tryframe reveal" id="tryLive" aria-label="The real GlowBop console, live">
  <div class="tf-scr">
    <picture class="tf-poster"><source media="(max-width: 699px)" srcset="/img/try-poster-phone.webp"><source media="(orientation: portrait) and (max-width: 1023px)" srcset="/img/try-poster-tall.webp">
      <img src="/img/try-poster-wide.webp" alt="The GlowBop console: the live wall and the music player, with the DJ page one tap away" loading="lazy" decoding="async"></picture>
    <iframe data-src="/try/?embed=1#music" title="The real GlowBop console on a pretend light wall" loading="lazy" allow="fullscreen; autoplay" allowfullscreen inert tabindex="-1"></iframe>
    <a class="tf-play" href="/try/#music"><span class="tf-btn"><i aria-hidden="true">▶</i>Loading the real console…</span></a>
  </div>
  <figcaption class="tf-cap"><span>Pick a song, then tap DJ to play the lights. This is the real GlowBop console on a pretend wall.</span><a class="tf-full" href="/try/#music">Full screen ⤢</a></figcaption>
</figure>"""
# 🔢 counted from the app's code (v3): effects.ALL_EFFECTS 313, looks.LOOKS 45, holiday2.HOLIDAYS 23, the LIVE picker's 11 feeds,
# dj.js 12 pads, sfx.js 12 sound styles, prodj.PRESETS 32, scoreboard 44 leagues / 18 sports, 9 fire styles, games.js 8 games
NUMS_LIST = [('313', 'effects', 'var(--pink)'), ('45', 'looks', 'var(--amber)'), ('44', 'live sports leagues', 'var(--violet)'), ('18', 'Game Day sports', 'var(--lav)'),
             ('23', 'holidays + 4 mini-movies', 'var(--cyan)'), ('11', 'live feeds', 'var(--green)'), ('12', 'DJ hit pads', 'var(--red)'), ('12', 'console sound styles', 'var(--lav)'),
             ('32', 'Pro DJ Autoloops', 'var(--orange)'), ('9', 'fire styles', 'var(--orange)'), ('8', 'arcade games', 'var(--lime)'), ('8', 'curtains in one wall', 'var(--gold)')]
NUMS = ''.join(f'<div class="num reveal" style="--c:{c}"><b>{n}</b><span>{t}</span></div>' for n, t, c in NUMS_LIST)
SFX_STYLES = [('🖖', 'Console'), ('🖥️', 'Computer'), ('👾', 'Arcade'), ('🫧', 'Bubble'), ('🚀', 'Galaxy Rebel'), ('☢️', 'Wasteland Terminal'), ('🌆', 'Synthwave'), ('✨', 'Magic'),
              ('👻', 'Spooky'), ('⚛️', 'Reactor Lab'), ('🐚', 'Deep Sea Deco'), ('🔵', 'Test Chamber')]
VOICE = f'''<section class="tight" id="voice"><div class="wrap center reveal">
  <span class="eyebrow" style="--c:var(--lav)">New · 12 sound styles</span><h2>Your console has a voice</h2>
  <p class="lead">Every tap, page turn and "done" on the console makes a tiny sound, and you pick its voice. Twelve styles, all original sounds made for GlowBop. Tap one in SETUP to hear it, or switch the sounds off with the SFX key.</p>
  <div class="toc" style="justify-content:center">{''.join(f'<span class="k">{e} {n}</span> ' for e, n in SFX_STYLES)}</div>
  <p style="margin-top:16px"><a class="btn" href="/try/#setup">Hear them in the demo →</a></p></div></section>'''
home = f'''
<header class="hero"><div class="hero-bg" aria-hidden="true"><video data-src="/video/hero-bg.mp4" data-poster="/video/hero-bg.jpg" muted loop playsinline webkit-playsinline autoplay preload="auto" disableremoteplayback></video></div><div class="wrap">
  <div>
    <img class="herologo" src="/img/brand/glowbop-logo.webp" alt="GlowBop" width="880" height="233">
    <span class="pill">🎃 <b>Launching this Halloween</b> · 7-day free trial</span>
    <h1>Your lights,<br><span class="grad">dancing to your music.</span></h1>
    <p class="lead">GlowBop turns LED curtain lights into a live light show that hears every beat, build-up and drop.</p>
    <p class="lead" style="margin-top:-6px"><b>📱 Run the whole show from your phone, iPad or laptop.</b> Scan a QR code, nothing to install.</p>
    {WORKS}
    <div class="btns"><a class="btn primary herotry" href="#tryLive">🎛️ Play the live demo ↓</a><a class="btn" href="{WAIT}">✉️ Join the launch list</a></div>
    <div class="stats"><div><b>300+</b>effects</div><div><b>44</b>live leagues</div><div><b>9</b>fire styles</div><div><b>8</b>arcade games</div><div><b>1–8</b>curtains</div></div>
  </div>
  <figure class="shot hero-shot livehero"><img src="/img/pool-party.jpg" alt="Two LED curtains playing a GlowBop light show behind a pool party at night" width="1344" height="752"><video class="gbv herov" src="/video/hero.mp4" muted loop playsinline webkit-playsinline autoplay preload="auto" disableremoteplayback aria-hidden="true"></video><span class="concept">Concept photo · real GlowBop patterns</span></figure>
</div></header>

<section class="tight" id="try"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--green)">Try it right here</span><h2>Drive the light show</h2>
  <p class="lead">This is the real GlowBop console, running right here on a pretend light wall. Hold to build, let go to drop, then hit the pads and ride the faders. Tap the colored rail for every other page.</p></div>
  {TRY}
  <p class="center"><span class="demo-tag">● DEMO · on your lights it runs live, right to the beat</span></p>
  <div class="center reveal" style="margin-top:22px"><a class="btn primary lg" href="/try/?intro=1">🚀 Open the full GlowBop app</a>
  <p class="lead" style="margin-top:12px;font-size:16px">Every page, every control: music, DJ pads and skip keys, looks, games, scenes and fire, holidays, sports, live feeds and text, plus the <a href="/pro.html">Pro DJ tools</a>: Autoloops, cue lists, Song Shows, the LIVE BOARD, override keys and the Pad Recorder. It runs right in your browser on a phone, iPad or laptop, on a pretend light wall.</p></div>
</div></section>

<section class="alt"><div class="wrap">
  <div class="center reveal"><span class="eyebrow" style="--c:var(--cyan)">Real screenshots</span><h2>One console, every screen</h2>
  <p class="lead">Scan a QR code and the console opens in your browser. The colored rail is grouped: <b>Perform</b> for music and DJ, <b>Visuals</b> for looks, scenes and fire, live feeds, sports and more, <b>Pro</b> for the Pro DJ tools, <b>System</b> for your lights and settings. Power and Brightness sit at the top of every page. On iPad it turns sideways into a big two-column board with the live wall on the left.</p></div>
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
  <figure class="led real reel reveal" style="aspect-ratio:40/21;margin-top:26px">{reel('main', 'reelName')}
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
  <div class="nums">{NUMS}</div>
  <div class="cloud reveal"><a href="/guide/music.html">Build-up & drop detection</a><a href="/guide/music.html#epic">Epic mode for movie music</a><a href="/guide/music.html#memory">Song memory</a><a href="/guide/music.html#sync">Bluetooth speaker sync</a><a href="/guide/dj.html#pads">12 DJ hit pads</a><a href="/guide/dj.html#skip">Skip a look or effect</a><a href="/guide/dj.html#build">Hold to build, let go to drop</a><a href="/guide/dj.html#cue">Cue the next look</a><a href="/guide/dj.html#tap">Tap tempo</a><a href="/guide/dj.html#crowd">Crowd lines</a><a href="/guide/dj.html#controller">DJ controller support</a><a href="/guide/pro-dj.html#autoloops">32 Autoloops (Pro)</a><a href="/guide/pro-dj.html#scenes">Scenes (Pro)</a><a href="/guide/pro-dj.html#cues">Cue lists with a big GO (Pro)</a><a href="/guide/pro-dj.html#tempo">Tempo toolbox (Pro)</a><a href="/guide/pro-dj.html#shows">Song Shows (Pro)</a><a href="/guide/pro-dj.html#faders">Fader board (Pro)</a><a href="/guide/pro-dj.html#zones">Zones (Pro)</a><a href="/guide/pro-dj.html#palettes">Colour palettes (Pro)</a><a href="/guide/pro-dj.html#override">Override keys (Pro)</a><a href="/guide/pro-dj.html#interlude">Interlude · Ambient (Pro)</a><a href="/guide/pro-dj.html#loops">Pad Recorder (Pro)</a><a href="/guide/pro-dj.html#midi">MIDI controller layouts</a><a href="/guide/pro-dj.html#vdj">VirtualDJ link (Pro)</a><a href="/guide/looks.html">45 looks</a><a href="/guide/looks.html#calm">Calm pack</a><a href="/guide/looks.html#genres">Rock, hip-hop, Latin, country & kids looks</a><a href="/guide/looks.html#flow">Flow pack</a><a href="/guide/music.html#style">Jazz light style</a><a href="/guide/looks.html#wave">Big Wave effects</a><a href="/guide/looks.html#3d">3D depth & club rigs</a><a href="/guide/looks.html">Pixel dancers</a><a href="/guide/looks.html#scenes">Describe a scene in words</a><a href="/guide/looks.html#transitions">Transitions</a><a href="/guide/looks.html#games">Arcade games</a><a href="/guide/looks.html#games">Arcade marathon</a><a href="/guide/holidays.html#movies">Holiday mini-movies</a><a href="/guide/holidays.html">23 holidays worldwide</a><a href="/guide/holidays.html#songs">Christmas songs switch to the holiday show</a><a href="/guide/looks.html#eyeball">Eyeball on/off</a><a href="/guide/fireplace.html#styles">9 fire styles</a><a href="/guide/fireplace.html#colors">Team-color fire</a><a href="/guide/fireplace.html#colors">Night shift fire</a><a href="/guide/fireplace.html#music">Flare on the beat</a><a href="/guide/scoreboard.html#gameday">Game Day scoreboard</a><a href="/guide/scoreboard.html#live">44 live leagues</a><a href="/guide/scoreboard.html#stats">Live baseball diamond</a><a href="/guide/scoreboard.html#stats">Game Center stats</a><a href="/guide/scoreboard.html#f1">F1 live board</a><a href="/guide/scoreboard.html#boards">Golf leaderboards</a><a href="/guide/scoreboard.html#boards">NASCAR & IndyCar</a><a href="/guide/scoreboard.html#boards">Tennis</a><a href="/guide/scoreboard.html#boards">UFC</a><a href="/guide/scoreboard.html#timer">Countdown clock</a><a href="/guide/live-feeds.html#countdown">Party countdowns</a><a href="/guide/live-feeds.html#weather">Weather sky</a><a href="/guide/live-feeds.html#storm">Storm watch</a><a href="/guide/live-feeds.html#overhead">Planes & space station overhead</a><a href="/guide/live-feeds.html#quakes">Earthquakes</a><a href="/guide/live-feeds.html#aurora">Aurora</a><a href="/guide/live-feeds.html#launches">Rocket launches</a><a href="/guide/live-feeds.html#moon">Moon & sun</a><a href="/guide/live-feeds.html#globe">Spinning globe</a><a href="/guide/live-feeds.html#volcano">Volcanoes</a><a href="/guide/live-feeds.html#fires">Wildfires</a><a href="/guide/live-feeds.html#world">Storm warnings worldwide</a><a href="/guide/text-logos.html#text">Text & beat words</a><a href="/guide/text-logos.html#logo">Your logo</a><a href="/guide/text-logos.html#mirror">Screen mirror</a><a href="/guide/lineup.html">Up to 8 curtains</a><a href="/guide/lineup.html#grid">Grid walls</a><a href="/guide/lineup.html#overlap">Overlapping curtains</a><a href="/guide/shapes.html">3D cylinder, box & globe</a><a href="/guide/lineup.html#draw">Draw your layout</a><a href="/guide/lineup.html#templates">Roofline, arch & tree templates</a><a href="/guide/lineup.html#camera">Night camera mapping</a><a href="/guide/groups.html">Light groups</a><a href="/lights.html">Twinkly, WLED, Govee</a><a href="/lights.html">Bluetooth curtains & DayBetter</a><a href="/guide/console.html">Console for phone, iPad & laptop</a><a href="/guide/console.html#rail">Perform, Visuals, Pro & System rail</a><a href="/guide/console.html#quick">Power & Brightness keys</a><a href="/guide/getting-started.html#find">LIGHTS tab for your setup</a><a href="/guide/console.html#modebar">Back to music key</a><a href="/guide/console.html#extras">Screen stays on</a><a href="/guide/console.html#sounds">12 console sound styles</a><a href="/support.html">Help & feedback in the app</a></div>
</div></section>

{VOICE}

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
      <p class="lead">DJ has its own key. The music show keeps running and you add moves on top, by hand. Pads fire the moment you touch them, or turn on Snap to beat and every hit lands on the beat.</p>
      <ul class="ticks"><li><b>12 hit pads:</b> drop, strobe, flash, fire burst, confetti, blackout, sweep, shockwave, color bomb, lightning, 3-2-1 and heartbeat.</li><li><b>Skip keys:</b> back or forward one look or one effect, with the names shown right below.</li><li><b>Hold to build</b>, let go to drop, in 7 build styles: Rise, Close in, Burst out, Spin, Rainbow, Zipper and Heartbeat, or Auto for a new one each time.</li><li><b>Cue the next look</b>, <b>tap tempo</b> and big <b>crowd lines</b> like HANDS UP.</li><li>Plug in a <b>DJ controller</b> and teach it every pad, or pick a ready-made layout for Akai and Novation pads.</li><li><b>Pro DJ</b> adds Autoloops, cue lists and a LIVE BOARD with faders and the Pad Recorder.</li></ul>
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
      <p class="lead">Tap LIVE and pick one of 11 feeds. It takes over the wall until you turn it off. Storm watch runs quietly on top of the music and only flashes when something happens.</p>
      <ul class="ticks"><li><b>Countdown</b> to a party, a birthday or New Year, with a fireworks finale.</li><li><b>Weather</b> with an animated pixel sky, today's high and low and the next hours.</li><li><b>Storm watch</b> flashes new warnings for your spot: the National Weather Service in the US, and official warnings in many other countries.</li><li>The <b>planes and space station overhead</b>, right now.</li><li>New: <b>earthquakes</b> on a map or a globe, the <b>aurora</b>, <b>rocket launches</b>, the <b>moon and sun</b>, a spinning <b>globe</b>, <b>volcanoes</b> and <b>wildfires</b>.</li></ul>
      <a class="btn" href="/guide/live-feeds.html">Live feeds guide →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('live-quakes', 'Earthquakes (preview)')}{clip('live-aurora', 'Aurora (preview)')}{clip('live-launches', 'Rocket launch (preview)')}{clip('live-weather', 'Weather')}</div></div>
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
    <div><span class="eyebrow">Holidays · now worldwide</span><h2>Mini-movies for the big nights</h2>
      <p class="lead">Each holiday has its own button, with full wide-screen stories for Halloween, Thanksgiving, Christmas and New Year that stretch across every curtain. GlowBop shows the holidays of your country, from Diwali and Lunar New Year to Hanukkah, Eid, King's Day and Día de Muertos, 23 in all.</p>
      <a class="btn" href="/guide/holidays.html">See the holidays →</a></div>
    <div class="media"><div class="grid g2 mini">{clip('movie-halloweennight')}{clip('movie-christmaseve')}{clip('movie-newyearcountdown')}{clip('holiday-july4')}</div></div>
  </div>
</div></section>

<section class="tight" id="pro"><div class="wrap"><div class="prostrip reveal">
  <span class="eyebrow" style="--c:#c084fc">New · GlowBop Pro DJ</span><h2>Pro DJ lighting for the lights you already own</h2>
  <p class="lead">Home DJ runs a great party. Pro DJ adds the tools a working DJ, a wedding planner or a church tech reaches for: beat-synced Autoloops, a cue list with a big GO, whole-song shows, faders, zones and your MIDI controller.</p>
  <div class="prochips">
    <a href="/guide/pro-dj.html#autoloops" style="--c:#ff9f5a"><b>🔁 Autoloops</b><span>32 beat-synced looks in four banks, plus your own Scenes.</span></a>
    <a href="/guide/pro-dj.html#cues" style="--c:#7dffb2"><b>🎬 Cue lists</b><span>Grand Entrance, First Dance, Cake: one big GO for each.</span></a>
    <a href="/guide/pro-dj.html#shows" style="--c:#e45cff"><b>🎞️ Song Shows</b><span>A timeline for every song. Auto-draft writes one in a tap.</span></a>
    <a href="/guide/pro-dj.html#faders" style="--c:var(--cyan)"><b>🎚️ LIVE BOARD</b><span>Faders, zone faders, colour palettes and the Pad Recorder.</span></a>
    <a href="/guide/pro-dj.html#override" style="--c:var(--red)"><b>⛔ Override keys</b><span>Blackout, white, strobe, house lights and more, aimed at any zone.</span></a>
    <a href="/guide/pro-dj.html#midi" style="--c:var(--violet)"><b>🎛️ MIDI & VirtualDJ</b><span>Map every control, LED feedback, MIDI clock and VirtualDJ sync.</span></a>
  </div>
  <div class="btns"><a class="btn primary" href="/pro.html">See Pro DJ</a><a class="btn" href="/pricing.html#pro">Pro DJ pricing</a><a class="btn" href="/try/#shows">Play it in the demo</a></div>
</div></div></section>

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
  <p class="lead"><b>Home DJ</b>: $5.99 a month, $59 a year, or $379 once. <a href="/pro.html"><b>Pro DJ</b></a> for gigs and venues from $8.99 a month. 🎃 <b>Founder launch deal: lifetime for $129</b> during launch week or for the first 100 buyers. Monthly and yearly plans start with a 7-day free trial.</p>
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


def reelfor(names, cap):
    key = next((k for k, r in VIDEOS['reels'].items() if ','.join(r['clips']) == names), None)
    return reel(key, cap=cap) if key else vid(names.split(',')[0], cap)


def media(scene, cap):
    if scene.startswith('@'): return pic(scene[1:], cap)
    if scene.startswith('#'): return clip(scene[1:], cap)
    if scene.startswith('!'):
        kind, img = scene[1:].split(':')
        return devframe(kind, img, cap)
    if scene.startswith('~'): return (f'<figure class="led real reel" style="aspect-ratio:40/21">{reelfor(scene[1:], cap)}'
                                       f'<figcaption>🔴 Recorded from GlowBop · {html.escape(cap)}</figcaption></figure>')
    if scene.startswith('%'): return '<div class="grid g2 mini">' + ''.join(clip(n) for n in scene[1:].split(',')) + '</div>'
    return led(scene, cap, illus=True)

F2 = [
    ('!tablet:ipad-land', 'The GlowBop console on an iPad held sideways', 'The console', 'A light-show console in your pocket',
     'GlowBop has a brand-new control panel. A colored side rail jumps between sections, the live wall shows exactly what your lights are doing, and big keys sized for thumbs run the show.',
     ['<b>A rail in four groups.</b> <b>Perform:</b> Music and DJ. <b>Visuals:</b> Looks, Scenes (with the fireplace), Live, Sports, Text, Holiday and Games. <b>★ Pro:</b> Loops &amp; Cues, Shows, Live Board and Override. <b>System:</b> Lights and Setup. On Home DJ, one gold PRO key shows a tour of the Pro tools instead.', '<b>Power</b> and <b>Brightness</b> keys at the top of every page.', '<b>LIGHTS</b> holds everything about your lights: find them, groups, layout and shape, draw your layout, line up curtains and map with a camera. <b>SETUP</b> keeps the license, the remote QR code, controllers, text size, sounds and a restart key.','<b>Live wall</b> mirrors your lights in real time. Tap <span class="k">Full view</span> for the whole screen.', '<b>iPad sideways</b> becomes a two-column board: wall on the left, controls on the right.', 'Console <b>sounds</b> in 12 styles with a mute key, a <b>screen-stays-on</b> switch, and a friendly screen if the laptop goes out of reach.'],
     '/guide/console.html', 'Console guide'),
    ('%wave-bigwave,wave-serpent,wave-twinwaves,wave-oceanswell', 'Big Wave effects', 'Big Wave', 'Waves that roll across the wall',
     'A new family of flowing effects with its own look. A giant wave crests on the beat, a serpent swims the length of your wall with a glowing head, twin waves cross and an ocean swell rolls in slow.',
     ['<b>Big Wave</b>, <b>Serpent</b>, <b>Twin Waves</b> and <b>Ocean Swell</b>.', 'Their own <b>Big Wave</b> look, and they show up in Molten, Neon Party and Storm &amp; Sea too.', 'Smooth on one curtain, spectacular across eight.'],
     '/guide/looks.html#wave', 'Big Wave in the guide'),
    ('%live-countdown,live-weather,live-overhead,live-storm', 'Live feeds', 'Live feeds', 'The outside world, live on your lights',
     'Tap LIVE and pick a feed. It takes over the wall until you turn it off. Set your ZIP code or city once for weather, storms and what\'s overhead.',
     ['<b>Countdown</b> to anything, with giant seconds at the end and a fireworks finale.', '<b>Weather</b>: big temperature over an animated pixel sky, today\'s high and low, the next hours.', '<b>Storm watch</b>: flashes new warnings over the music, only if you turn it on: the National Weather Service in the US, and outside the US GDACS cyclones and floods, MeteoAlarm in 38 European countries or any national alert feed. Tap Stop any time.', '<b>Overhead now</b>: planes flying over your house and the space station.'],
     '/guide/live-feeds.html', 'Live feeds guide'),
    ('%live-quakes,live-aurora,live-launches,live-globe', 'Earthquakes, the aurora, a launch and the globe (preview modes)', 'Live science', 'Earthquakes, auroras and rocket launches',
     'Seven new feeds turn real science data into a show. Each one has a preview button, so you can see it before the real thing happens.',
     ['<b>Earthquakes</b> drop on a world map or a spinning globe with a ripple, and can flash over the music when a big one hits.', '<b>Aurora</b> curtains grow taller and brighter with the live space weather (the Kp index), with a gold flash for solar flares.', '<b>Rocket launches</b>: the next launches, a countdown and liftoff on the wall.', '<b>Moon &amp; sun</b>: tonight\'s phase, sunrise, sunset and golden hour.', '<b>Globe</b>: the Earth spinning with the day\'s quakes, storms, volcanoes and launches on it.', '<b>Volcanoes</b> and <b>wildfires</b> near you or around the world. For nearby fire hotspots, add your own free NASA FIRMS key.'],
     '/guide/live-feeds.html#quakes', 'Live science feeds'),
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
    ('#look-neon-party', 'Neon Party look', 'Looks', '45 looks, 300+ effects',
     'A look is a mood: its colors plus a set of effects for calm, medium and loud parts. GlowBop shuffles through them as the music changes.',
     ['Neon Party, Deep Space, Synthwave, Warehouse Rave, Mainstage, Club Rig, Royal Gold and more.', '<b>3D Depth</b> tunnels, spinning cubes and disco spheres.', '<b>Dance Crew</b> pixel characters you can switch on or off, and an <b>Eyeball</b> switch for the eye that peeks in now and then.', '<b>Spin both ways:</b> spinning effects now turn left as well as right, so the wall feels less repetitive.', '<b>Describe a scene</b> in words and GlowBop builds it.', '<b>Pin</b> an effect you love, or hit <b>Surprise me</b>.'],
     '/guide/looks.html', 'Looks guide'),
    ('%look-midnight-galaxy,look-liquid-dreams,look-deep-space,wave-oceanswell', 'Calm looks GlowBop leans on for slow songs', 'Calm & genres', 'Calm when it should be, loud when it should be',
     'GlowBop reads what kind of song is playing and picks lights to match. Movie scores, chill and jazz stay calm and flowing. Rock, hip-hop, Latin, country and kids songs each get their own looks. Nothing to set up.',
     ['<b>Calm pack:</b> 12 calm effects and four looks: Cinematic, Concert Hall, Jazz Club and Moonlit. Epic, chill and jazz songs stay calm, with no harsh strobes.', '<b>Auto genres:</b> Rock gets Rock Arena, hip-hop Velvet Bounce, Latin and Afrobeats Tropicana, country and folk Golden Porch, kids songs Toy Box.', '<b>Holiday songs:</b> a Christmas or Halloween song switches to the holiday show, in season.', '<b>Auto shows its guess</b> on the MUSIC page, like "Auto · Rock". Not right? Tap Epic, Dance, Chill or the new <b>Jazz</b> light style and GlowBop remembers it for that artist.'],
     '/guide/looks.html#calm', 'Calm & genres guide'),
    ('%wave-serpent,wave-twinwaves,look-liquid-dreams,look-psychedelic', 'Flowing effects', 'Flow pack', 'Silk, ink and tides for melodic music',
     'Melodic bass, progressive and chillstep get their own Flow style with two new looks, Trip and Silk, and 14 flowy effects.',
     ['<b>Silk and ribbons</b>, <b>liquid and ink</b>, <b>waves and tides</b> and <b>particle flocks</b> like a murmuration of birds.', 'Every flow effect has two moods: <b>dreamy</b> for the verses and a bigger <b>drop</b> mood when the song lands.', 'They join the auto show by themselves when Auto hears flowing music.'],
     '/guide/looks.html#flow', 'Flow pack guide'),
    ('%fx-breakout,fx-snakegame,fx-pongbattle,fx-alienparade', 'Arcade games', 'Games', 'Games that play themselves',
     'GAMES has its own key on the rail. Tap a game and it plays itself across your wall, speeding up with the music. Or start the Arcade marathon and GlowBop plays them all in turn.',
     ['<b>8 games:</b> Breakout, Snake, Pong, Alien parade, Space rocks, Block drop, Light cycles and Game of life.', '<b>Breakout</b>: bricks burst into sparks. <b>Snake</b>: a rainbow snake hunts glowing food.', '<b>Pong</b>: the ball smashes on the beat.', 'Tap the playing game again to turn it off, or tap <b>♫ Back to music</b> under the wall.'],
     '/guide/looks.html#games', 'Games in the guide'),
    ('%drop,fx-pixelfireworks,look-club-rig,text-beat', 'DJ mode', 'DJ mode', 'Play the lights like a club lighting tech',
     'DJ has its own key on the rail. The music show keeps running, and you add moves on top, by hand. Pads fire the instant you touch them, or turn on Snap to beat so every hit lands on the next beat.',
     ['<b>12 hit pads</b>: Drop, Strobe, Flash, Fire burst, Confetti, and new <b>Sweep</b>, <b>Shockwave</b>, <b>Color bomb</b>, <b>Lightning</b>, <b>3-2-1</b> and <b>Heartbeat</b>. <b>Blackout</b> holds the wall dark.', '<b>Skip keys</b>: <span class="k">◀ Look</span> <span class="k">▶ Next look</span> <span class="k">◀ Effect</span> <span class="k">▶ Next effect</span>, with a live Look and Effect readout under them.', '<b>Hold to build</b>: the wall winds up brighter and faster; let go and it drops.','<b>Cue the next look</b> to come in on the next drop.', '<b>Tap tempo</b> when the room is too loud, and <b>crowd lines</b> like HANDS UP in big letters.', '<b>DJ controller</b>: plug a USB pad controller into the laptop, pick a ready-made layout or long-press any pad to teach it a button.', '<b>Pro DJ</b> adds <a href="/guide/pro-dj.html#autoloops">Autoloops</a>, <a href="/guide/pro-dj.html#cues">cue lists</a> and the <a href="/guide/pro-dj.html#faders">LIVE BOARD</a> with faders and the Pad Recorder.'],
     '/guide/dj.html', 'DJ mode guide'),
    ('%fx-volcano,fx-tornado,fx-rainonglass,fx-solarflare', 'Wild Elements effects', 'Wild Elements', 'Weather and nature, wired to the beat',
     'A volcano that erupts on the drop, a tornado that wanders across the wall, rain on the window, a waterfall and the surface of the sun.',
     ['<b>Volcano</b>: lava bombs fly on the drop.', '<b>Tornado</b>: debris spins faster as the song builds.', '<b>Rain on glass</b>, <b>Waterfall</b>, <b>Solar flare</b>.'],
     '/gallery.html#new', 'See them in the gallery'),
    ('%movie-halloweennight,movie-christmaseve,movie-newyearcountdown,holiday-july4', 'Holiday mini-movies', 'Holidays', 'Holidays for wherever you live',
     'Holidays live in their own section, away from the normal shuffle. GlowBop shows the holidays of your country, with the right dates, and the HOLIDAY key moves up the rail when one is near.',
     ['<b>23 holiday shows.</b> Halloween, Christmas, Thanksgiving, New Year, Valentine\'s, St. Patrick\'s, the 4th of July, Birthday and Game Day.', '<b>14 new from around the world:</b> Diwali, Holi, Lunar New Year, Eid, Hanukkah, Easter, Carnival, Día de Muertos, Mother\'s Day, Bonfire Night, King\'s Day, Bastille Day, Canada Day and Australia Day.', '<b>Wide-screen mini-movies:</b> Halloween Night, Harvest Day, Christmas Eve and New Year Countdown.', 'Jack-o\'-lanterns, bats, ghosts, a haunted house, sleigh rides, fireworks, a ball drop and more.', 'Choose which holiday effects are in the rotation.'],
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
     ['<b>Grid walls:</b> tap a shape like 2 × 2, 3 × 2 or 4 × 2 for up to 8 curtains.', 'A <b>line-up wizard</b> shows a number and arrow on each curtain so you can rotate, flip and order them.', '<b>Lock it in</b> so nothing moves by accident.', 'Run them as <b>one show</b> or split them into <b>groups</b> with their own shows.', 'It all lives on the <b>LIGHTS</b> tab of the console.'],
     '/guide/lineup.html', 'Line-up guide'),
    ('!laptop:desk-setup', 'The LIGHTS tab: layout and shape', 'Draw your layout', 'Effects that follow your real shapes',
     'Photograph your house or stage, or start from a blank grid, and draw where each light string runs. Use lines, paths, arcs, rings, boxes, pixel grids, or one-tap templates.',
     ['<b>10 templates:</b> roofline, window, door, arch, pillar wrap, cone tree, spiral tree, stage truss, DJ booth and pixel panel.', '<b>Hide bulbs</b> tucked behind gutters. Tap <b>Test</b> to see each string\'s start, end and direction.', '<b>8 shape-aware effects</b> follow your real shapes: spirals climb trees, light runs down from the roof peaks, arches pulse from the top, and windows light up in turn on the beat.', 'Every named string becomes a <b>zone</b>.', '<b>Night camera mapping:</b> map at night, one light at a time, with the phone on a tripod. GlowBop sets the brightness for you, shows how many bulbs it saw and can retry the missing ones. Then line the pieces up in the editor.'],
     '/guide/lineup.html#draw', 'Draw your layout guide'),
    ('holiday-christmas', 'Coming for the 2026 holidays', 'xLights houses', 'Your holiday display, dancing live',
     'Already run a holiday light show with xLights? Point GlowBop at your xLights show folder. It reads your props and your controllers and plays live, music-reactive shows on your whole house, with no sequencing.',
     ['<b>Reads your show folder:</b> rooflines, arches, candy canes, mega trees, matrices, windows and custom props, placed just like your house preview.', '<b>Uses the controllers you already own:</b> Falcon, Kulp, HinksPix, ESPixelStick and WLED over E1.31 (sACN), DDP or Art-Net.', 'Your <b>model groups become zones</b>, and trees and arches get the shape effects: spirals up the mega tree, arches pulsing from the top.', 'Running <b>Falcon Player</b>? Put it in bridge mode for the night, or let GlowBop send at a higher priority. One tap on <b>Hand back to my show</b> and your schedule picks up again.', '<b>In the works:</b> we will mark it supported once we have run it on a real xLights house.'],
     '/lights.html#soon', 'See supported lights'),
    ('!phone:phone-music', 'The GlowBop console on an iPhone', 'Phone & iPad remote', 'Control it all from your phone or iPad',
     'The GlowBop laptop app shows a QR code. Scan it on any phone or tablet on the same Wi-Fi and the full console opens in the browser.',
     ['Live preview of every curtain right on your phone.', 'Big keys sized for thumbs on every section.', 'Add it to your home screen and it opens like an app, with its own icon.', 'Works at the field too, over your phone\'s hotspot.'],
     '/guide/getting-started.html#phone', 'Phone setup'),
]
ORDER = ['Phone & iPad remote', 'Music show', 'The console', 'Looks', 'DJ mode', 'Calm & genres', 'Holidays', 'Draw your layout', 'Live feeds', 'Scoreboard', 'Text & logos',
         'Fireplace', 'Flow pack', 'Multi-curtain', 'Epic mode', 'Big Wave', 'Live science', '3D shapes', 'Games', 'Wild Elements', 'Formula 1', 'Screen mirror']
F2.sort(key=lambda f: ORDER.index(f[2]) if f[2] in ORDER else 99)
SHOW = [('wave-bigwave', 'Big Wave'), ('fire-rainbow-cozy', 'Rainbow fire'), ('shape-spinningglobe', '3D spinning globe'), ('fx-pixelfireworks', 'Pixel fireworks'),
        ('wave-serpent', 'Serpent'), ('fx-laserweb', 'Laser web'), ('fx-tesseract', 'Tesseract'), ('fx-volcano', 'Volcano'),
        ('look-synthwave', 'Synthwave'), ('live-nascar', 'NASCAR live'), ('score-baseball', 'Baseball live'), ('live-overhead', 'Planes overhead'),
        ('score-f1', 'F1 live timing'), ('score-soccer', 'Soccer: GOAL!'), ('score-basketball', 'Basketball live'), ('score-football', 'Football live')]
PROSEC = '''<section id="pro-dj"><div class="wrap"><div class="center"><span class="eyebrow">GlowBop Pro DJ</span><h2>Play the lights like an <span class="grad">instrument</span></h2>
<p class="lead"><a href="/pro.html">Everything above</a>, plus the tools working DJs, wedding planners, clubs, churches and venues ask for. Same app, same lights: a Pro DJ key unlocks four Pro tabs on the rail, LOOPS &amp; CUES, SHOWS, LIVE BOARD and OVERRIDE.</p></div>
<div class="grid g3" style="margin-top:30px">
<a class="card reveal" href="/guide/pro-dj.html#autoloops"><div class="em">🔁</div><h3>Autoloops &amp; Scenes</h3><p>32 ready-made, beat-synced looks in four banks: Club, Chill / Flow, Big Room and Color. Tap a pad and it drops in on the next bar and holds, or let it advance every few bars. Save the wall as a <b>Scene</b> and bring it back with a smooth fade.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#cues"><div class="em">🎬</div><h3>Cue lists with a big GO</h3><p>Plan an event as a list of cues (Grand Entrance, First Dance, Cake, Last Song) and run it with one big GO key, crossfades between cues, and the space bar on a laptop.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#tempo"><div class="em">🥁</div><h3>Tempo toolbox</h3><p>Fine-tune the BPM, double or halve it, nudge the beat earlier or later and lock it. Auto Ambient goes calm by itself when the music stops.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#zones"><div class="em">🧩</div><h3>Zones &amp; palettes</h3><p>Split the wall into zones (left, right, top, bottom, center, odd, even, each curtain, each named string). Aim the override keys at one zone and give each zone its own fader. Pick a colour palette and every look follows it.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#midi"><div class="em">🎛️</div><h3>MIDI controllers &amp; VirtualDJ</h3><p>Map any control to your controller by long-pressing it. Ready layouts for Akai APC mini mk2 and APC40 mkII, Novation Launchpad Mini MK3, Launchpad X and Launch Control XL, with pad LEDs. MIDI clock in and out, and a VirtualDJ link.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#shows"><div class="em">🎬</div><h3>Song Shows</h3><p>A timeline for every song with six lanes: look, hits, color, brightness, text and effects. Auto-draft writes a full show in one tap, then you drag, stretch and tweak it cue by cue. Or record your DJ pads live straight into the song.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#faders"><div class="em">🎚️</div><h3>LIVE BOARD faders</h3><p>Master, speed, beat-locked strobe, color, white and trails on big touch faders on the LIVE BOARD tab. Two fingers move two faders at once on an iPad, with hold keys for blackout, double time, full strobe, rainbow, white and freeze.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#override"><div class="em">⛔</div><h3>Override keys</h3><p>Nine big keys that take over the whole wall in any mode: blackout, white, strobe, house lights, red, blue, pink, a crowd sweep and your logo. Hold or latch, with fades and laptop keys 1 to 9.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#interlude"><div class="em">☕</div><h3>Interlude · Ambient</h3><p>Talking break or band change? One tap drifts the wall into a calm glow, slow breathing or drifting words like BE RIGHT BACK that ignore the mic, then fades the show back in. It can even start by itself when the music stops.</p><span class="more">How it works →</span></a>
<a class="card reveal" href="/guide/pro-dj.html#loops"><div class="em">⏺️</div><h3>Pad Recorder</h3><p>Four banks of four slots, on the LIVE BOARD. Record a 1 to 8 bar phrase of light hits and fire it back on the next bar, looping over any song. Eight starter loops included, with a step editor for fine tuning.</p><span class="more">How it works →</span></a>
<div class="card reveal"><div class="em">🎛️</div><h3>Built for gigs</h3><p>Safe by design: held override keys and fader hold keys let go by themselves if the Wi-Fi drops, so the wall never gets stuck. Try every Pro tool in the <a href="/try/#autoloops">live demo</a>. From $8.99 a month or $449 once.</p><p><a class="btn primary small" href="/pricing.html#pro">See Pro DJ pricing</a></p></div>
</div></div></section>'''
features = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Features</span><h1>Everything <span class="grad">GlowBop</span> can do</h1>
<p class="lead">A music light show, a holiday display, a scoreboard, live feeds and a sign, all run from one light-show console. Every section links to the step-by-step guide.</p></div></header>
<section class="tight" style="padding-top:0"><div class="wrap">
  <figure class="led real reel reveal" style="aspect-ratio:40/21">{reel('main', 'featReel')}
  <figcaption>🔴 Recorded from GlowBop · <b id="featReel">Psychedelic</b></figcaption></figure>
  <div class="grid g4 showgrid" style="margin-top:16px">{''.join(f'<div class="gtile reveal">{clip(n, t)}<h3>{t}</h3></div>' for n, t in SHOW)}</div>
  <div class="toc" style="justify-content:center;margin-top:26px">{''.join(f'<a href="#{slug(e)}">{e}</a>' for _, _, e, _, _, _, l, _ in F2)}<a href="#pro-dj">Pro DJ</a></div>
</div></section>
<section style="padding-top:20px"><div class="wrap">{''.join(feat(i, *f) for i, f in enumerate(F2))}</div></section>
{VOICE}
{PROSEC}
{band()}'''
# make anchors match toc (feat ids come from the link)
page('/features.html', 'Features · GlowBop', 'The GlowBop console, music show with drop detection, calm and genre-aware looks, DJ mode with 12 hit pads, live feeds from weather to earthquakes and the aurora, 3D shapes, 45 looks, holidays worldwide, scoreboards, F1, text and logos, draw-your-layout mapping, 12 console sound styles, and the Pro DJ tools: Autoloops, cue lists, Song Shows, LIVE BOARD, zones, palettes, override keys and MIDI.', features, '/features.html')

# ================================================================ GUIDE
G = [
    ('getting-started', '🚀', 'Getting started', 'Install, find your lights on the LIGHTS tab, connect your phone.'),
    ('console', '🎛️', 'Using the console', 'The grouped side rail, the live wall, the mode bar and every section.'),
    ('lineup', '🧭', 'Line up & draw your layout', 'Line up up to 8 curtains, draw your house or stage, and map lights with a camera.'),
    ('shapes', '🌐', '3D shapes', 'Wrap curtains around a cylinder, a box or a globe.'),
    ('music', '🔊', 'Music show', 'How the show follows a song, Epic mode, sync and song lookup.'),
    ('dj', '🎧', 'DJ mode', '12 hit pads, skip keys, build and drop, cue, tap tempo, crowd lines and DJ controllers.'),
    ('pro-dj', '🎛️', 'Pro DJ tools', 'Autoloops, cue lists, tempo, Song Shows, LIVE BOARD, zones, override keys, MIDI and VirtualDJ.'),
    ('looks', '🎨', 'Looks, effects & games', 'Looks, calm and genre styles, the flow pack, scenes, pinning, games and transitions.'),
    ('holidays', '🎃', 'Holidays & mini-movies', 'Holidays for your country and the animated stories.'),
    ('fireplace', '🔥', 'Fireplace', 'Nine fire styles, nine colors, cozy or roaring, flare on the beat.'),
    ('scoreboard', '🏟️', 'Sports', 'Game Day, Live Fan in 44 leagues, F1, golf, racing, tennis, UFC and the countdown clock.'),
    ('live-feeds', '📡', 'Live feeds', 'Countdowns, weather, storms, overhead, quakes, aurora, launches, moon, globe, volcanoes and fires.'),
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


# the console rail, in the app's order: PERFORM, VISUALS, PRO, SYSTEM (same colors as the app)
RAILC = {'LOOPS & CUES': '#ff9f5a', 'LIVE BOARD': '#4de8c8', 'PRO': 'var(--gold)'}
RAILC.update(MUSIC='var(--pink)', DJ='var(--red)', SHOWS='#e45cff', OVERRIDE='#e9e6ff',
             LOOKS='var(--amber)', SCENES='var(--lav)', FIRE='var(--orange)', HOLIDAY='var(--cyan)', GAMES='var(--lime)', SPORTS='var(--violet)', LIVE='var(--green)', TEXT='var(--gold)',
             LIGHTS='var(--peri)', SETUP='var(--dim)')   # (FIRE is gone from the app's rail: the fireplace is on SCENES)
def rk(name): return f'<span class="k rail" style="--c:{RAILC[name]}">{name}</span>'
PT = '<span class="protag">Pro DJ</span>'          # marks a GlowBop Pro DJ feature


page('/guide/', 'Guide · GlowBop', 'The complete GlowBop guide: setup, the console, line-up, grid walls and drawn layouts, 3D shapes, music show, DJ mode, the Pro DJ tools, looks, holidays, fireplace, scoreboard, live feeds, text and logos, groups and troubleshooting.',
     f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">The GlowBop Guide</span><h1>Learn GlowBop <span class="grad">in an evening</span></h1>
<p class="lead">Every part of the app, step by step, for the new GlowBop console. Start at the top if you're new. Each section works on its own too.</p></div></header>
<section style="padding-top:10px"><div class="wrap"><div class="grid g3">
{''.join(f'<a class="card reveal" href="/guide/{s}.html"><div class="em">{e}</div><h3>{n}. {t}</h3><p>{d}</p><span class="more">Open →</span></a>' for n, (s, e, t, d) in enumerate(G, 1))}
</div>
<div class="tip pink reveal" style="margin-top:28px"><b>New here?</b> The fastest path: <a href="/guide/getting-started.html">Getting started</a> → <a href="/guide/console.html">Using the console</a> → <a href="/guide/lineup.html">Line up your curtains</a> → press play on a song. Everything else is a bonus.</div>
<div class="tip reveal" style="border-left-color:#c084fc"><b>Running gigs?</b> <a href="/guide/dj.html">DJ mode</a> is in every plan. Autoloops, cue lists, Song Shows, the LIVE BOARD, override keys and the rest are in <a href="/guide/pro-dj.html">Pro DJ tools</a>, marked with a {PT} tag.</div>
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
<li>Paste the <b>license key</b> from your Polar email (it starts with GLOWBOP- for Home DJ or GBPRO- for Pro DJ) and tap <b>Unlock</b>.</li>
<li>If Windows asks, <b>allow GlowBop on private networks</b>. That lets your phone and lights reach it.</li></ol>
{devframe('laptop', 'desk-live', 'The GlowBop console on a laptop')}
<h2 id="find">3. Find your lights</h2>
<ol><li>Tap {rk('LIGHTS')} on the side rail, in the <b>System</b> group at the bottom. In <b>Your lights</b>, tap <span class="k">Find my lights</span>. GlowBop searches your Wi-Fi and Bluetooth.</li>
<li>Each light it finds is added with its size. If one is missing, use <span class="k">Add by brand</span>.</li>
<li>Have more than one curtain? Do the <a href="/guide/lineup.html">line-up wizard</a> next. It takes a minute.</li></ol>
<p>Everything about your lights lives on {rk('LIGHTS')}: <b>Your lights</b>, <b>Light groups</b>, <b>Layout &amp; shape</b>, <b>Draw your layout</b>, <b>Line up my curtains</b> and <b>Map with camera</b>. The <span class="k">Lights</span> key under the live wall jumps straight there.</p>
{tip('<b>Bluetooth lights</b> (TikTok-style pixel curtains, DayBetter strips) take one connection at a time. Close their phone app before you tap Find my lights.')}
<h2 id="phone">4. Open the console on your phone or iPad</h2>
<ol><li>Put your phone on the <b>same Wi-Fi</b> as the computer.</li>
<li>On the laptop, tap {rk('SETUP')} and find <b>Control from your phone</b>. Point your phone camera at the QR code.</li>
<li>The console opens in Safari or Chrome. Tap <b>Share → Add to Home Screen</b> to get the GlowBop icon. From then on it opens full screen, like an app.</li>
<li>On an iPad, turn it sideways for the big two-column board.</li>
<li>Want a friend to run the lights too? On a connected phone the same card is called <b>Share the remote</b>: they scan the code right off your screen, or you send the link.</li></ol>
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
<p>The colored keys down the left side are the sections. Tap one and its controls slide in. The white edge shows where you are. The rail comes in four groups, each with a small label above it.</p>
<div class="railgrp" style="color:var(--pink)">Perform</div>
<p class="dim" style="margin:0 0 10px">The home screen and playing the lights by hand.</p>
<div class="grid g2" style="margin:0 0 18px">
<div class="card" style="--c:{RAILC['MUSIC']}"><h3>{rk('MUSIC')}</h3><p>Now Playing with the light style for the song (Auto, Epic, Dance, Chill or Jazz), Show control (power, next effect, shuffle, surprise me, the Eyeball switch) and Levels: pace, sparkles, brightness, blend and sync.</p></div>
<div class="card" style="--c:{RAILC['DJ']}"><h3>{rk('DJ')}</h3><p>Build &amp; drop, 12 hit pads, keys to skip a look or an effect, tap tempo, cue the next look, crowd lines and your DJ controller.</p></div>
</div>
<div class="railgrp" style="color:var(--amber)">Visuals</div>
<p class="dim" style="margin:0 0 10px">Everyday looks and shows, the most used first.</p>
<div class="grid g3" style="margin:0 0 18px">
<div class="card" style="--c:{RAILC['LOOKS']}"><h3>{rk('LOOKS')}</h3><p>All the looks, Feature an effect, and Transitions.</p></div>
<div class="card" style="--c:{RAILC['SCENES']}"><h3>{rk('SCENES')}</h3><p>The <b>Fireplace</b> at the top, then Quick scenes, Screen mirror and Describe a scene in your own words.</p></div>
<div class="card" style="--c:{RAILC['LIVE']}"><h3>{rk('LIVE')}</h3><p>11 live feeds: countdown, weather, storm watch, overhead, earthquakes, aurora, launches, moon &amp; sun, globe, volcanoes and wildfires.</p></div>
<div class="card" style="--c:{RAILC['SPORTS']}"><h3>{rk('SPORTS')}</h3><p>Game Day, Live Fan in 44 leagues with the Game Center, F1, golf, racing, tennis and UFC boards, and the countdown clock.</p></div>
<div class="card" style="--c:{RAILC['TEXT']}"><h3>{rk('TEXT')}</h3><p>Messages and your logo on top of the show, or a logo slideshow.</p></div>
<div class="card" style="--c:{RAILC['HOLIDAY']}"><h3>{rk('HOLIDAY')}</h3><p>The holidays of your country and the mini-movies. It moves up next to LOOKS when a holiday is close.</p></div>
<div class="card" style="--c:{RAILC['GAMES']}"><h3>{rk('GAMES')}</h3><p>Eight self-playing arcade games and the Arcade marathon.</p></div>
</div>
<div class="railgrp" style="color:var(--gold)">★ Pro</div>
<p class="dim" style="margin:0 0 10px">The Pro DJ tools. On Home DJ this group is a single gold {rk('PRO')} key with a tour of what Pro adds.</p>
<div class="grid g2" style="margin:0 0 18px">
<div class="card" style="--c:{RAILC['LOOPS & CUES']}"><h3>{rk('LOOPS & CUES')}{PT}</h3><p>Autoloops, your Scenes and the Tempo toolbox. A switch at the top opens the Cue list with its big GO. <a href="/guide/pro-dj.html#autoloops">More</a></p></div>
<div class="card" style="--c:{RAILC['SHOWS']}"><h3>{rk('SHOWS')}{PT}</h3><p>Song Shows: a timeline for each song, with Auto-draft. <a href="/guide/pro-dj.html#shows">More</a></p></div>
<div class="card" style="--c:{RAILC['LIVE BOARD']}"><h3>{rk('LIVE BOARD')}{PT}</h3><p>The fader board, colour palettes, zone faders, the hit pads and the Pad Recorder. <a href="/guide/pro-dj.html#faders">More</a></p></div>
<div class="card" style="--c:{RAILC['OVERRIDE']}"><h3>{rk('OVERRIDE')}{PT}</h3><p>Override target (a zone), eight override keys and Interlude · Ambient. <a href="/guide/pro-dj.html#override">More</a></p></div>
</div>
<div class="railgrp" style="color:var(--peri)">System</div>
<p class="dim" style="margin:0 0 10px">Your lights and the app itself.</p>
<div class="grid g2" style="margin:0 0 18px">
<div class="card" style="--c:{RAILC['LIGHTS']}"><h3>{rk('LIGHTS')}</h3><p>Everything about the physical lights: <b>Your lights</b> (find and add), <b>Light groups</b>, <b>Layout &amp; shape</b>, <b>Draw your layout</b>, <b>Line up my curtains</b> and <b>Map with camera</b>.</p></div>
<div class="card" style="--c:{RAILC['SETUP']}"><h3>{rk('SETUP')}</h3><p>License, the remote QR code, Controllers &amp; Sync, a restart key if something isn't working, screen, console sounds, text size, song lookup, and help and feedback.</p></div>
</div>
<h2 id="quick">Power and Brightness, on every page</h2>
<p>Two quick keys sit at the top of every page: <span class="k">Power</span> turns the lights off and on, and <span class="k">Brightness</span> opens a slider with 25, 50, 75 and 100 percent presets. No need to go back to MUSIC.</p>
<h2 id="wall">The live wall</h2>
<p>The box with the amber frame shows exactly what your lights are showing right now, bulb by bulb. With light groups, each group shows side by side and you can tap one to control just that group.</p>
<ul><li><span class="k">Full view</span> fills the whole screen with the wall. Tap <span class="k">Close</span> to come back.</li>
<li><span class="k">Mirror</span> jumps to screen mirroring. <span class="k">Lights</span> jumps to the {rk('LIGHTS')} tab.</li>
<li>When you're in another section on a phone, the wall shrinks so the controls have room.</li></ul>
<h2 id="modebar">The mode bar</h2>
<p>The bar under the wall always says what's in charge of your lights, in that mode's color: <b>Music show · listening</b>, a pinned look, a holiday, the fireplace, a scene, a live feed or a storm alert. When something has taken over, a pink <span class="k">♫ Back to music</span> button appears next to it. One tap turns off whatever is on and the music show comes back, from any section. If a Song Show is playing, it sits out the rest of that play and comes back next time the song plays.</p>
<p>With Pro DJ, small chips can join the mode bar on every screen (they jump to the LIVE BOARD or OVERRIDE tab): <b>⛔ OVERRIDE ACTIVE</b> while an override key is on (tap to release them all), <b>🔁 LOOPS</b> while loops play (tap to stop them all) and <b>🎚️ FADERS</b> when a fader is away from normal (tap to open the board). During an interlude the button reads <span class="k">🎵 Back to the show</span>.</p>
<h2 id="reads">The readouts</h2>
<p>Under the mode bar: the <b>tempo</b> in BPM, the <b>song section</b> (intro, build, drop, break...), a <b>level meter</b>, the current <b>look</b> and <b>effect</b>, plus extras like the key and mood when GlowBop knows the song.</p>
<h2 id="sounds">Console sound styles</h2>
<p>Every tap makes a tiny sound, and you pick its voice in {rk('SETUP')} → <b>Console sounds</b>. Twelve styles, all original sounds made for GlowBop: <b>Console</b>, <b>Computer</b>, <b>Arcade</b>, <b>Bubble</b>, <b>Galaxy Rebel</b>, <b>Wasteland Terminal</b>, <b>Synthwave</b>, <b>Magic</b>, <b>Spooky</b>, <b>Reactor Lab</b>, <b>Deep Sea Deco</b> and <b>Test Chamber</b>. Tap one to hear it. Each phone or iPad remembers its own.</p>
<h2 id="extras">Screen and help</h2>
<ul><li><span class="k">SFX</span> at the top turns the console's sounds on or off.</li>
<li><b>Screen stays on:</b> after your first tap, your phone or iPad won't drop to the lock screen while GlowBop is open. Turn it off in {rk('SETUP')} → <b>Screen</b> to save battery.</li>
<li><b>Text size:</b> {rk('SETUP')} → <b>Text size</b> makes the words bigger or smaller. Each phone or iPad remembers its own.</li>
<li><b>Something not working?</b> {rk('SETUP')} has a <span class="k">🔄 Restart GlowBop</span> key that restarts the laptop app from your phone in about 10 seconds.</li>
<li><b>Can't reach the laptop?</b> If your phone loses the laptop (wrong Wi-Fi, laptop asleep, GlowBop closed), a friendly "taking a breather" screen shows what to check and reconnects by itself the moment the laptop is back.</li>
<li><span class="k">Help &amp; feedback</span> at the bottom sends us a bug report or a feature idea straight from the app.</li></ul>
{tip('<b>iPad tip:</b> turn the iPad sideways. The wall moves to the left and stays put while you scroll the controls on the right.', 'pink')}
''', [('rail', 'The side rail'), ('quick', 'Power & Brightness'), ('wall', 'Live wall'), ('modebar', 'Mode bar'), ('reads', 'Readouts'), ('sounds', 'Sound styles'), ('extras', 'Screen & help')])

guide('lineup', f'''
<p>Lights that aren't curtains, on a house or a stage? Skip to <a href="#draw">Draw your layout</a>. With more than one curtain (up to 8), GlowBop needs to know three things: which way is up on each one, whether any are mirrored, and what order they hang in. The wizard makes it a one-minute job.</p>
{clip('lineup', 'the line-up wizard on four curtains')}
<h2 id="wizard">Run the wizard</h2>
<ol><li>Tap {rk('LIGHTS')} and, in <b>Line up my curtains</b>, tap <span class="k">Line up my curtains</span>.</li>
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
{tip('<b>Bulbs not quite in the gaps?</b> Curtains from different brands can space their bulbs differently, and twisted wires can turn bulbs. Run <a href="#camera">camera mapping</a> after hanging: it records exactly where every bulb landed.')}
{tip('You can also set it per curtain: in <b>Your lights</b> on the LIGHTS tab, change a curtain\'s <b>Overlap</b> to "Over" another curtain and pick the shift.', 'pink')}
<h2 id="sizes">How shows fit your wall</h2>
<p>GlowBop builds one big canvas from all your curtains. Flowing effects stretch across the whole wall. Pixel-art scenes (pumpkins, characters, the tree) keep their sharp look by showing one copy per curtain instead of getting blurry.</p>
<ul><li><b>1 curtain:</b> everything as designed.</li><li><b>Side by side:</b> wide shows sweep across, pixel art repeats per curtain.</li><li><b>Stacked:</b> a taller canvas, great for fire, rain and fountains.</li><li><b>Grid:</b> a big video-wall canvas, rows and columns together.</li><li><b>3D shapes:</b> see <a href="/guide/shapes.html">3D shapes</a>.</li></ul>
<h2 id="draw">✏️ Draw your layout</h2>
<p>Open {rk('LIGHTS')} → <b>Draw your layout</b> and tap <span class="k">Open editor</span>. Photograph your house or stage, or start from a blank grid, and draw where each light string runs. Use lines, paths, arcs, rings, boxes and pixel grids, or one-tap templates.</p>
<ol><li>Pick the light under <b>Your lights</b>, then a tool, and draw the string from where it starts, in wiring order.</li>
<li>Set how many bulbs are on that part. Bulbs tucked behind a gutter? <b>Hide</b> them so they take no room on the path.</li>
<li>Tap <span class="k">Test</span>: the first bulb of each string blinks green, the last blinks red, then a white light runs from start to end, so you can check the direction.</li>
<li>Name each string (Roofline, Front window, Big tree). Every named string becomes a <b>zone</b> for Pro DJ.</li>
<li>Tap <span class="k">Save</span>. The show restarts with your real shapes.</li></ol>
<h3 id="templates">Templates</h3>
<div class="toc"><span class="k">Roofline</span> <span class="k">Window</span> <span class="k">Door</span> <span class="k">Arch</span> <span class="k">Pillar wrap</span> <span class="k">Cone tree</span> <span class="k">Spiral tree</span> <span class="k">Stage truss</span> <span class="k">DJ booth</span> <span class="k">Pixel panel</span></div>
<p>Drop one on your photo, then drag the corners to fit. Effects then follow your real shapes: spirals climb trees, light runs down from the roof peaks, arches pulse from the top, and windows light up in turn on the beat. Eight shape-aware effects join the show by themselves.</p>
<h2 id="camera">📷 Camera mapping at night</h2>
<p>Map at night, one light at a time, with the phone on a tripod. In the editor tap <span class="k">Map outdoors</span> (or {rk('LIGHTS')} → <span class="k">Map with camera</span> for a single string). GlowBop sets the brightness for you, shows how many bulbs it saw and can retry the missing ones. Then line the pieces up in the editor.</p>
{tip('<b>Tips:</b> wait until it is dark and turn off porch lights. Put the phone on a tripod, a car roof or a fence post: it must not move. On iPhone, tap and hold on the lights in the Camera app first to lock the exposure.')}
''', [('wizard', 'Run the wizard'), ('grid', 'Grid walls'), ('overlap', 'Overlapping curtains'), ('sizes', 'How shows fit'), ('draw', 'Draw your layout'), ('templates', 'Templates'), ('camera', 'Camera mapping')])

guide('shapes', f'''
<p>Curtains bend. Wrap them around a big tube, a box or a ball and you have a glowing art piece. Tell GlowBop the shape and it wraps the picture all the way around, with no seam where the ends meet.</p>
{devframe('laptop', 'desk-setup', 'GlowBop light setup with a 3D cylinder preview')}
<h2 id="pick">Pick the shape</h2>
<ol><li>Tap {rk('LIGHTS')}. In <b>Layout &amp; shape</b>, find <b>Shape</b>.</li>
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
<h2 id="style">Light styles: Auto, Epic, Dance, Chill, Jazz</h2>
<p>Under Now Playing on {rk('MUSIC')}, <b>Light style</b> shows what GlowBop thinks the song is. <span class="k">Auto</span> shows its guess, like <b>Auto · Rock</b>: rock, hip-hop, Latin and Afrobeats, country and folk, kids songs and flowing melodic music each get their own looks, and epic, chill and jazz songs stay calm. A Christmas or Halloween song switches to the holiday show, in season.</p>
<p>Not right? Tap <span class="k">Epic</span>, <span class="k">Dance</span>, <span class="k">Chill</span> or <span class="k">Jazz</span> and GlowBop remembers it for that artist from now on. Tap Auto to let it decide again. See <a href="/guide/looks.html#calm">calm and genre looks</a>.</p>
<h2 id="memory">Song memory</h2>
<p>The first time a song plays, GlowBop learns its shape. Next time, it already knows where the drops and the climax are and can set up for them.</p>
<h2 id="lookup">Song lookup (optional)</h2>
<p>When GlowBop knows a song's name, it can look up its genre, tempo and key. An "orchestral" song starts in Epic mode right away; "house" stays in dance mode. You need two free keys:</p>
<ol><li><b>Last.fm</b> (genres): sign in at last.fm, go to <a href="https://www.last.fm/api/account/create" rel="noopener">last.fm/api/account/create</a>, fill in a name and description, and copy the <b>API key</b>.</li>
<li><b>GetSongBPM</b> (tempo and key): request a key at <a href="https://getsongbpm.com/api" rel="noopener">getsongbpm.com/api</a> and click the activation link in your email.</li>
<li>In GlowBop tap {rk('SETUP')} → <b>Song lookup</b>, paste each key, and tap <span class="k">Save</span>.</li></ol>
{tip('Each song is looked up only once and saved on your computer. Your keys stay on your computer too.')}
''', [('how', 'How it works'), ('controls', 'Controls'), ('sync', 'Sync'), ('epic', 'Epic mode'), ('style', 'Light styles'), ('memory', 'Song memory'), ('lookup', 'Song lookup')])

LOOKS = ['Red Alert', 'Rainbow Riot', 'Emerald Ocean', 'Midnight Galaxy', 'Fairy Forest', 'Deep Sea', 'Neon Party', 'Ice Palace', 'Synthwave', 'Royal Gold', 'Toxic Rave', 'Lava Lounge', 'Blue Sky', 'Hyperspace', 'Digital Matrix', 'Psychedelic', 'Molten', 'Chaos', 'Wild Card', 'Studio 54', 'Liquid Dreams', 'Warehouse Rave', 'Neon Grid', 'Storm & Sea', 'Mainstage', 'Deep Space', 'Hypnotic', 'Club Rig', '3D Depth', 'Dance Crew', 'Retro Arcade', 'Wild Elements', '3D Object', 'Big Wave',
         'Cinematic', 'Concert Hall', 'Jazz Club', 'Moonlit', 'Rock Arena', 'Velvet Bounce', 'Tropicana', 'Golden Porch', 'Toy Box', 'Trip', 'Silk']
guide('dj', f'''
<p>DJ mode puts the lights in your hands. The music show keeps running underneath, and you add moves on top, the way a lighting tech runs a club. Tap {rk('DJ')} on the side rail, in the <b>Perform</b> group.</p>
{clip('drop', 'a hand-played drop')}
<p>Top to bottom, the page goes: <b>Build &amp; drop</b>, the <b>hit pads</b> with the skip keys, <b>tap tempo</b>, <b>cue the next look</b>, <b>crowd lines</b> and the <b>DJ controller</b>.</p>
{tip(f'<b>With Pro DJ</b> {PT} the <a href="/guide/pro-dj.html#faders">fader board</a> and the <a href="/guide/pro-dj.html#loops">Pad Recorder</a> live on their own {rk("LIVE BOARD")} tab in the Pro group, next to the same hit pads.', 'pink')}
<h2 id="build">Hold to build</h2>
<p>Press and <b>hold</b> <span class="k">Hold to build</span>. The wall winds up over about 8 seconds, flickering faster and turning white-hot in your look's colours. The key fills up with a seconds counter so you can time it, and reads <b>FULL</b> when it's maxed out. <b>Let go</b> and it drops. Slide your finger off the key to cancel.</p>
<p>Pick a <b>build style</b> from the row under the key (each phone or tablet remembers its own pick):</p>
<ul class="ticks"><li><b>Rise</b>: light climbs from the floor with a soft rainbow sweep (the classic).</li><li><b>Close in</b>: a ring of light squeezes in from the edges to the middle.</li><li><b>Burst out</b>: a glowing core grows from the middle out to the edges.</li><li><b>Spin</b>: a radar sweep that speeds up and grows more arms.</li><li><b>Rainbow</b>: a full, bright rainbow wash that gets faster.</li><li><b>Zipper</b>: two bars race in from the sides and meet in the middle.</li><li><b>Heartbeat</b>: a heart in the middle thumps faster and faster.</li><li><b>Auto</b>: a different style every time.</li></ul>
{tip('<b>Pro move:</b> Blackout for one bar, then hold Build through the last bars of the build-up and let go right on the drop.', 'pink')}
<h2 id="pads">Hit pads</h2>
<p>Twelve big pads. Out of the box a pad fires the instant your finger touches it. Tap <span class="k">⚡ Instant</span> at the top of the card to switch to <span class="k">🥁 Snap to beat</span>: then every pad waits for the next beat, so even a late tap lands right on time.</p>
<ul><li><span class="k">💥 Drop</span>: a full drop move, with a new effect and a color change.</li>
<li><span class="k">⚡ Strobe</span>: four beats of white strobe.</li>
<li><span class="k">⚪ Flash</span>: one big white flash.</li>
<li><span class="k">🔥 Fire burst</span> and <span class="k">🎉 Confetti</span>: a blast over the show for a couple of seconds.</li>
<li><span class="k">⬛ Blackout</span>: holds the wall dark until you tap it again. Great right before a drop.</li>
<li><span class="k">Sweep</span>: a bright bar wipes across the wall.</li>
<li><span class="k">Shockwave</span>: a ring blasts out from the middle.</li>
<li><span class="k">Color bomb</span>: a flood of colour bursts from the centre.</li>
<li><span class="k">Lightning</span>: a forked bolt cracks down the wall.</li>
<li><span class="k">3-2-1</span>: a big countdown on the beat, then a burst.</li>
<li><span class="k">Heartbeat</span>: a heart thumps twice in the middle.</li></ul>
<p>The new pads follow the music's beat and the look's colours.</p>
<h2 id="skip">Skip a look or an effect</h2>
<p>Right under the pads are four skip keys:</p>
<ul><li><span class="k">◀ Look</span> and <span class="k">▶ Next look</span> step back or forward through the looks.</li>
<li><span class="k">◀ Effect</span> and <span class="k">▶ Next effect</span> do the same for the effect on the wall right now.</li></ul>
<p>A live <b>Look</b> and <b>Effect</b> readout underneath shows the names, so you always know what's playing without looking up at the wall. Went one too far? Tap ◀ to step straight back.</p>
<h2 id="tap">Tap tempo</h2>
<p>Room too loud, or a song with no clear kick? Tap <span class="k">TAP</span> four times or more on the beat and the whole show locks to your tapping. <span class="k">Back to automatic tempo</span> hands the beat back to the music.</p>
<h2 id="cue">Cue the next look</h2>
<p>Tap a look in <b>Cue the next look</b>. It waits, then comes in on the next drop, yours or the music's. Tap it again to clear the cue.</p>
<h2 id="crowd">Crowd lines</h2>
<p>Big words flashed across the wall for three seconds: <b>HANDS UP</b>, <b>JUMP</b>, <b>MAKE SOME NOISE</b> and more. Type your own, like your DJ name; GlowBop keeps your last six.</p>
{tip(f'<b>Record it into the song</b> {PT} Turn on <span class="k">● Record</span> on the SHOWS page and every pad, build drop, crowd line and look you pick here lands on that song\'s timeline, snapped to the beat. A red bar on the DJ page shows while you record. See <a href="/guide/pro-dj.html#record">Song Shows</a>.')}
<h2 id="controller">DJ controllers</h2>
<ol><li>Plug a USB DJ controller or MIDI pad into the laptop that runs GlowBop. GlowBop finds it in a couple of seconds.</li>
<li>Tap <span class="k">Controllers &amp; Sync</span> on the DJ page (it opens the panel in {rk('SETUP')}). If GlowBop knows your controller, it offers a ready-made layout.</li>
<li>Or teach it by hand: <b>long-press</b> (or right-click) any pad, Build or Tap, then hit the button on your controller.</li></ol>
{tip(f'Hit pads, Build and Tap work on every plan. Mapping the Pro tools, controller layouts with LED feedback, MIDI clock and VirtualDJ sync are in <a href="/guide/pro-dj.html#midi">Pro DJ</a> {PT}. The controller plugs into the laptop; your phone keeps working at the same time.', 'warn')}
<p><span class="k">♫ Back to music</span> under the wall clears a blackout, tap tempo or a cued look.</p>
''', [('build', 'Build & drop'), ('pads', 'Hit pads'), ('skip', 'Skip keys'), ('tap', 'Tap tempo'), ('cue', 'Cue'), ('crowd', 'Crowd lines'), ('controller', 'Controllers')])

guide('pro-dj', f'''
<p><b>Pro DJ lighting for the lights you already own.</b> Pro DJ is the same GlowBop app with a full lighting desk for gigs, weddings, clubs, churches and venues, on consumer LED lights instead of DMX stage fixtures. It listens to the audio, so it works with any DJ software; VirtualDJ and MIDI clock give the tightest sync. A Pro DJ key adds four tabs to the <b>★ Pro</b> group of the rail: {rk('LOOPS & CUES')}, {rk('SHOWS')}, {rk('LIVE BOARD')} and {rk('OVERRIDE')}. In this guide the Pro tools carry a small {PT} tag. Want the big picture first? See the <a href="/pro.html">Pro DJ page</a>.</p>
<div class="grid g3" style="margin:18px 0">
<a class="card" href="#autoloops"><div class="em">🔁</div><h3>Autoloops &amp; Scenes</h3><p>32 beat-synced looks, plus your own saved moments.</p></a>
<a class="card" href="#cues"><div class="em">🎬</div><h3>Cue lists</h3><p>Plan the event, then one big GO per moment.</p></a>
<a class="card" href="#tempo"><div class="em">🥁</div><h3>Tempo toolbox</h3><p>Fine BPM, x2, /2, nudge, lock and Auto Ambient.</p></a>
<a class="card" href="#shows"><div class="em">🎞️</div><h3>Song Shows</h3><p>Program a whole song on a timeline.</p></a>
<a class="card" href="#faders"><div class="em">🎚️</div><h3>LIVE BOARD</h3><p>Faders, zone faders, palettes and the Pad Recorder.</p></a>
<a class="card" href="#override"><div class="em">⛔</div><h3>Override keys</h3><p>Take over the wall (or one zone) in one touch.</p></a>
<a class="card" href="#interlude"><div class="em">☕</div><h3>Interlude · Ambient</h3><p>A calm wall for talking breaks.</p></a>
<a class="card" href="#midi"><div class="em">🎛️</div><h3>MIDI &amp; VirtualDJ</h3><p>Controllers, MIDI clock and VirtualDJ sync.</p></a>
<a class="card" href="/try/#autoloops"><div class="em">🕹️</div><h3>Try it now</h3><p>Every Pro tool, live in your browser.</p></a>
</div>
<h2 id="get">Unlock Pro DJ</h2>
<ol><li>Pick a Pro DJ plan on the <a href="/pricing.html#pro">pricing page</a>. Your key starts with <b>GBPRO-</b>.</li>
<li>In the console, tap {rk('SETUP')} → <b>License</b> and paste the key. Or tap <span class="k">I have a Pro key</span> on the {rk('PRO')} tour.</li>
<li>The Pro tabs appear on the rail right away. No reinstall and no new hardware: the same lights and the same laptop.</li></ol>
{tip('<b>On Home DJ</b>, the Pro group of the rail is a single gold ' + rk('PRO') + ' key: a tour of every Pro tool with a little preview of each. Want to play first? The <a href="/try/">live demo</a> is the real console on a pretend wall, and the Pro tools work there.', 'pink')}

<h2 id="autoloops">🔁 Autoloops {PT}</h2>
<p>Tap {rk('LOOPS & CUES')}. Autoloops are 32 ready-made, beat-synced looks in four banks: <b>A · Club</b>, <b>B · Chill / Flow</b>, <b>C · Big Room</b> and <b>D · Color</b>, eight pads each, plus a fifth bank, <b>My scenes</b>. Each pad is a look, one or two effects and a colour palette, locked to the beat.</p>
<ul><li>Tap a pad and it drops in on the <b>next bar</b> and holds the wall until you change it. Turn on <b>Snap</b> to switch at once instead.</li>
<li><span class="k">◀ Prev</span> <span class="k">Next ▶</span> step through the bank. <span class="k">Release</span> hands the wall back to the auto show.</li>
<li><b>Repeat</b> keeps the pad going. <b>Advance</b> moves to the next pad every 4, 8, 16 or 32 bars.</li>
<li>Each pad can run at ¼, ½, 1, 2 or 4 times the beat, and you pick the fade for each change.</li></ul>
<h3 id="scenes">🎞️ Scenes</h3>
<p>Love how the wall looks right now? In the <b>My scenes</b> bank tap <span class="k">Save scene</span>: GlowBop keeps the look, the effect, the colours and the faders. Tap the scene later and it comes back with a smooth fade. <span class="k">Manage scenes</span> renames, reorders and deletes them.</p>
<h2 id="cues">🎬 Cue lists with a big GO {PT}</h2>
<p>Use the switch at the top of {rk('LOOPS & CUES')} to open <b>Cues</b>. Plan the event top to bottom as a list of cues, then tap <span class="k">GO</span> for each moment. Each cue crossfades in over its fade time.</p>
<ul><li>A cue can be an <b>Autoloop</b>, one of your <b>Scenes</b>, a <b>Blackout</b>, an <b>Interlude</b> or <b>Back to Auto</b>, each with a fade and a note like "First dance".</li>
<li>The page shows what is on now and what comes next, in big letters. <span class="k">Back</span> goes one cue back, and you can jump to any cue.</li>
<li>Keep a list per event: a wedding, a Sunday service, a school dance.</li>
<li>On a laptop, the <b>space bar</b> is GO and <b>Shift + space</b> goes back.</li></ul>
{tip('<b>Wedding example:</b> 1 Grand entrance (Arena Beams, 2 s fade) · 2 First dance (Nebula Hush, 4 s) · 3 Cake cutting (your Golden hour scene) · 4 Dance floor opens (Neon Rain) · 5 Last song · 6 Back to Auto. The demo comes with this list ready to GO.')}
<h2 id="tempo">🥁 Tempo toolbox and Auto Ambient {PT}</h2>
<p>Also on {rk('LOOPS & CUES')}. Make every flash land exactly on the kick:</p>
<ul><li><b>Fine-tune the BPM</b> in 0.1 and 1 BPM steps, then <span class="k">Lock</span> it.</li>
<li><span class="k">x2</span> and <span class="k">/2</span> for double or half time.</li>
<li><b>Nudge</b> the beat a little earlier or later until it sits right.</li>
<li><b>Auto Ambient</b> goes calm by itself when the music stops for 5, 10, 20 or 45 seconds, and comes back with the music.</li></ul>

<h2 id="shows">🎞️ Song Shows {PT}</h2>
<p>Build a light show for a song once and it plays the same way every time that song comes on, right on the beat. Anywhere your show is empty, GlowBop keeps reacting live. Tap {rk('SHOWS')} in the Pro group.</p>
<h3 id="timeline">The timeline</h3>
<p>Pick a song from the list. Every song GlowBop has heard shows up there, with its tempo and how many drops it has. The timeline has a bar ruler, the song's sections in color, the drops marked in pink, and six lanes:</p>
<ul><li><b>Look:</b> which look plays from here.</li>
<li><b>Hits:</b> any of the 12 hit pads, including blackouts.</li>
<li><b>Color:</b> lock one to three colors in place of the look's own.</li>
<li><b>Brightness:</b> a curve you draw, from 0 to 100 percent.</li>
<li><b>Text:</b> words on the wall, like a crowd line.</li>
<li><b>FX:</b> lock one effect for a stretch of the song.</li></ul>
<p>Tap an empty spot in a lane to add a cue there, or tap a lane's name to add one at the playhead. Drag a cue to move it, drag its right edge to stretch it, tap it to change it. Everything snaps to the beat. Pinch or use <span class="k">−</span> <span class="k">+</span> to zoom, and turn on <span class="k">Follow</span> to keep the playhead in view. It saves by itself, and <b>Undo</b> is one tap away.</p>
<h3 id="draft">Auto-draft</h3>
<p>Tap <span class="k">✨ Auto-draft</span> and GlowBop writes a first show from what it already knows about the song: the tempo, the bar grid, the drops it remembers, the mood and the key. Builds lead into the drops, and the biggest drop gets the biggest moment. Then drag, stretch and tweak it until it's yours.</p>
<h3 id="record">Record your DJ pads into the song</h3>
<p>Tap <span class="k">● Record</span> on the SHOWS page, then play the song and go to {rk('DJ')}. Every pad, build drop, crowd line and look you pick lands on that song's timeline at that moment, snapped to the beat. A red bar on the DJ page shows while you record; tap <span class="k">Stop</span> when you're done.</p>
<h3 id="follow">How it follows the song</h3>
<p>A show plays when GlowBop knows where in the song it is:</p>
<ul><li><b>Exact</b> with GlowBop's own player, and with music apps that share their timeline with Windows, like Spotify or Apple Music, when they report it.</li>
<li><b>Kept on the beat</b> for other apps when GlowBop caught the song from its start: it counts from there and locks to the song's remembered bar grid.</li>
<li>If it can't tell, the live show runs and the SHOWS page says why.</li></ul>
<p><span class="k">♫ Back to music</span> under the wall skips the show for the rest of this play. It comes back next time the song plays. To keep a song's show for later without playing it, turn off <b>Play this song's show</b> on its timeline. <b>Song Shows: off</b> turns them all off at once.</p>

<h2 id="faders">🎚️ LIVE BOARD: the fader board {PT}</h2>
<p>Tap {rk('LIVE BOARD')}. Six live faders sit at the top and ride on top of whatever is playing.</p>
<ul><li><b>Master:</b> brightness for the whole wall.</li>
<li><b>Speed:</b> slows the animation down to a quarter, or speeds it up to three times.</li>
<li><b>Strobe:</b> off at the bottom, then locked to the beat as you push up: every beat, 1/2, 1/4 and 1/8.</li>
<li><b>Color:</b> a color wheel that tints the show.</li>
<li><b>White:</b> blends the wall toward white.</li>
<li><b>Trails:</b> leaves glowing trails behind moving light.</li></ul>
<p>Drag anywhere on a fader, up or down. It moves from where it already is, so a stray touch never makes the lights jump. On an iPad, two fingers move two faders at once. Double-tap a fader to reset it, or tap <span class="k">↺ Reset all</span>.</p>
<h3 id="holdkeys">Hold keys</h3>
<p>Under each fader is a key that works while your finger is down: <span class="k">⬛ Blackout</span>, <span class="k">⏩ 2X</span> double time, <span class="k">⚡ Full</span> strobe, <span class="k">🌈 Rainbow</span>, <span class="k">⚪ White</span> and <span class="k">❄️ Freeze</span>.</p>
<p>Every phone, iPad and the laptop show the same fader positions. When a fader is away from normal, a <b>🎚️ FADERS</b> chip shows in the mode bar; tap it to jump back to the board.</p>
{tip('<b>Auto-release safety:</b> while your finger is down, a hold key keeps checking in. If the Wi-Fi drops or the phone locks, the key lets go by itself about a second later, so the wall never gets stuck in a blackout or a strobe.')}
<h3 id="zones">🧩 Zones and zone faders (submasters)</h3>
<p>Split the wall into zones: <b>left</b>, <b>right</b>, <b>top</b>, <b>bottom</b>, <b>center</b>, <b>odd</b> and <b>even</b>, each curtain, and every named string from <a href="/guide/lineup.html#draw">Draw your layout</a>. On the LIVE BOARD each zone gets its own fader, like a submaster. On {rk('OVERRIDE')}, <b>Override target</b> aims the override keys at one zone.</p>
<h3 id="palettes">🎨 Colour palettes</h3>
<p>Pick a palette on the LIVE BOARD (Neon Club, Sunset, Ice, Forest, Candy, Gold &amp; White, Blush, Stars &amp; Stripes) or make your own from the colour wheel. Every look, Autoloop and auto show switches to those colours until you clear it. Perfect for wedding or brand colours.</p>
<h3 id="loops">⏺️ Pad Recorder</h3>
<p>A sampler for your lights, at the bottom of the {rk('LIVE BOARD')}: four banks, A to D, with four slots each. (It used to be called Loop banks.)</p>
<ul><li><b>Play:</b> tap a slot and it starts on the next bar, looping on the beat over any song. Tap again and it stops at the end of the bar (or set <b>Stop a loop</b> to <span class="k">At once</span>). One loop per bank plays at a time, and the banks play together.</li>
<li><b>Starter loops:</b> eight are ready to go: Four on the floor, Offbeat strobe, Build riser, Drop hits, Color chase, Flash roll, Blackout chops, and Fire and confetti.</li>
<li><b>Record:</b> tap <span class="k">🔴 Record</span>, pick 1, 2, 4 or 8 bars, then tap a slot. Recording starts on the next bar and catches the hit pads you play, on a 1/4 or 1/8 beat grid. Record into a playing slot to add one more layer.</li>
<li><b>Edit:</b> tap <span class="k">✏️ Edit</span>, then a slot, to rename it, change its length and tap hits on or off in a 16-step grid for each bar. You can nudge, copy and clear too.</li>
<li>A <b>🔁 LOOPS</b> chip in the mode bar shows while loops play; one tap stops them all. On the laptop, <b>L</b> stops every loop.</li></ul>

<h2 id="override">⛔ Override keys {PT}</h2>
<p>Tap {rk('OVERRIDE')}. Eight big keys take over the whole wall at once (or just the zone in <b>Override target</b>), whatever is playing, and hand it back when you let go.</p>
<div class="toc"><span class="k">⬛ Blackout</span> <span class="k">⚪ White</span> <span class="k">⚡ Strobe</span> <span class="k">🪩 Disco</span> <span class="k">💡 House</span> <span class="k">🔴 Red</span> <span class="k">🔵 Blue</span> <span class="k">🔦 Audience</span></div>
<ul><li><b>Flash</b> keys are on while your finger is down. <b>Latch</b> keys stay on until you tap them again. House starts as a latch key, the rest as flash keys.</li>
<li><b>Disco</b> drops a spinning disco ball onto the wall. <b>Audience</b> sweeps bright beams over the crowd.</li>
<li>Hold several at once and the strongest wins: Blackout, then White, Strobe, Disco, House, the colors and Audience. Strobe flashes in the color of a held color key.</li>
<li>Tap <span class="k">✏️ Edit keys</span>, then a key, to set flash or latch, its fade (snap, a quarter second or one second), its color and its name.</li>
<li>On the laptop, keys <b>1 to 8</b> work from any page (not while you're typing) and <b>0</b> releases everything.</li>
<li>While any override is on, an <b>⛔ OVERRIDE ACTIVE</b> chip shows in the mode bar on every screen. Tap it, or <span class="k">✋ Release all</span>, to let them all go.</li></ul>
{tip('Held override keys have the same auto-release safety as the fader hold keys: lose the Wi-Fi and they let go by themselves.')}

<h2 id="interlude">☕ Interlude · Ambient {PT}</h2>
<p>For talking breaks, speeches and band changeovers. It sits under the override keys on {rk('OVERRIDE')}. Tap <span class="k">🎙️ Start interlude</span> and the wall goes calm and stops following the music, so a mic or silence can't make it twitch.</p>
<ul><li><b>Interlude look:</b> <span class="k">🌬️ Breathing</span>, <span class="k">🔤 Words</span> drifting slowly over a soft glow (BE RIGHT BACK, or type your own, like the event name), <span class="k">🕯️ Warm glow</span>, or <span class="k">🎨 A look, slowed</span>.</li>
<li><b>Coming back:</b> a plain fade, or a fade with a flash or a drop.</li>
<li><b>Auto Ambient:</b> pick 5, 10, 20 or 45 seconds and silence starts an interlude by itself. When the music comes back, so does the show.</li>
<li>The mode bar button turns into <span class="k">🎵 Back to the show</span>. On the laptop, press <b>I</b>.</li>
<li>Song Show cues wait during an interlude, then pick up where the song is.</li></ul>

<h2 id="midi">🎛️ MIDI controllers</h2>
<p>Plug a USB DJ controller or pad into the laptop that runs GlowBop. It shows up in {rk('SETUP')} → <b>Controllers &amp; Sync</b> in a couple of seconds.</p>
<ul><li><b>Learn any control:</b> long-press (or right-click) any pad, fader, override key, Autoloop or cue key in the console, then press a button or move a fader on your controller.</li>
<li><b>Ready layouts</b> for the Akai APC mini mk2 and APC40 mkII, Novation Launchpad Mini MK3, Launchpad X and Launch Control XL, plus a generic 8 pads + 8 knobs layout. Pick one under <b>Controller layout</b> and tap <span class="k">Use</span>.</li>
<li><b>LED feedback:</b> the pads on your controller light up to match what is on.</li>
<li><b>Soft takeover:</b> a fader only moves a value once it reaches it, so nothing jumps.</li></ul>
{tip(f'Hit pads, Build and Tap work on Home DJ too. Mapping the Pro tools, MIDI clock and VirtualDJ sync are {PT}.')}
<h3 id="clock">MIDI clock in and out {PT}</h3>
<p>Under <b>Beat from</b>, pick <span class="k">MIDI clock</span> to follow the clock from your DJ software or a drum machine. <b>Send MIDI clock out</b> sends GlowBop's beat to other gear. If the clock stops, GlowBop goes back to listening to the audio.</p>
<h3 id="vdj">VirtualDJ link {PT}</h3>
<p>GlowBop can follow VirtualDJ's beat directly over OS2L:</p>
<ol><li>In VirtualDJ, open <b>Settings → Options</b> and search for <b>os2l</b>.</li>
<li>Set <b>os2lDirectIp</b> to <b>127.0.0.1:9996</b> (VirtualDJ on another computer: use the GlowBop laptop's address instead of 127.0.0.1).</li>
<li>Restart VirtualDJ, then in GlowBop pick <span class="k">VirtualDJ</span> under <b>Beat from</b>.</li></ol>
{tip('GlowBop listens to the audio, so it works with any DJ software: Serato, rekordbox, Traktor, djay and more. The deeper sync comes from MIDI clock and the VirtualDJ link. Ableton Link, Pro DJ Link and StageLinQ are not supported.', 'warn')}
<h3 id="test">"Test my controller"</h3>
<p>Something not mapping right? In <b>Controllers &amp; Sync</b> tap <span class="k">Test my controller</span>: press pads and move faders and every message shows with what it does in GlowBop. Tap <span class="k">Send to GlowBop support</span> and the test goes straight to us, so we can add or fix your controller.</p>
''', [('get', 'Unlock'), ('autoloops', 'Autoloops'), ('cues', 'Cues'), ('tempo', 'Tempo'), ('shows', 'Song Shows'), ('faders', 'LIVE BOARD'), ('zones', 'Zones'), ('palettes', 'Palettes'), ('loops', 'Pad Recorder'), ('override', 'Override keys'), ('interlude', 'Interlude'), ('midi', 'MIDI'), ('vdj', 'VirtualDJ')])

guide('looks', f'''
<h2 id="looks">What a look is</h2>
<p>A look is a mood: a color palette plus a set of effects for calm, medium and loud moments. During a song GlowBop picks effects from the current look, and moves to a new look at drops or when the song changes.</p>
{devframe('phone', 'phone-looks', 'The Looks list in the GlowBop console')}
<h3>All 45 looks</h3>
<div class="toc">{''.join(f'<span class="k">{l}</span> ' for l in LOOKS)}</div>
<p>Tap {rk('LOOKS')}, then any look to jump to it. Turn on <span class="k">Pin</span> to keep it, or tap <span class="k">Release</span> in the mode bar to hand control back to GlowBop.</p>
<h2 id="calm">🌙 Calm pack: soft when the song is soft</h2>
<p>Not every song wants strobes. Movie scores, chill songs and jazz stay calm and flowing, with 12 calm effects (aurora veils, cathedral rays, sky lanterns, piano keys, bowed strings, moonlit snow and more) and four calm looks: <b>Cinematic</b>, <b>Concert Hall</b>, <b>Jazz Club</b> and <b>Moonlit</b>.</p>
<p>GlowBop picks this by itself. To tell it, use the <b>Jazz</b>, Chill or Epic light style on {rk('MUSIC')}. See <a href="/guide/music.html#style">Light styles</a>.</p>
<h2 id="genres">🎸 Genre looks</h2>
<p>When song lookup knows the genre, Auto gives each kind of music its own look, with no extra buttons:</p>
<ul><li><b>Rock:</b> Rock Arena. <b>Hip-hop:</b> Velvet Bounce. <b>Latin and Afrobeats:</b> Tropicana.</li>
<li><b>Country and folk:</b> Golden Porch. <b>Kids songs:</b> Toy Box.</li>
<li><b>Christmas and Halloween songs</b> switch to the holiday show, in season.</li></ul>
<p>The MUSIC page shows the guess, like <b>Auto · Rock</b>.</p>
<h2 id="flow">🌊 Flow pack</h2>
<p>Melodic bass, progressive and chillstep get the <b>Flow</b> style with two looks, <b>Trip</b> and <b>Silk</b>, and 14 flowy effects: silk and ribbons, liquid and ink, waves and tides, and particle flocks like a murmuration of birds. Each one has a <b>dreamy</b> mood for the verses and a bigger <b>drop</b> mood when the song lands.</p>
<h2 id="eyeball">👁️ Eyeball and spin</h2>
<p>Now and then a giant eye peeks in, looks around and blinks. Don't want it? Turn off <span class="k">Eyeball</span> in <b>Show control</b> on {rk('MUSIC')}. Spinning effects now turn both left and right, so the wall feels less repetitive.</p>
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
<p><a href="/gallery.html">See the looks and the newest effects in the gallery →</a></p>
<h2 id="games">Arcade games 🕹️</h2>
<p>The self-playing games have their own key, {rk('GAMES')}. Tap a game and it plays on the wall, speeding up with the music:</p>
<ul><li><b>Breakout</b>, <b>Snake</b>, <b>Pong</b>, <b>Alien parade</b>, <b>Space rocks</b>, <b>Block drop</b>, <b>Light cycles</b> and <b>Game of life</b>.</li>
<li><span class="k">🕹️ Arcade marathon</span> plays every game in turn.</li>
<li>Tap the playing game (or the marathon) again to turn it off. <span class="k">♫ Back to music</span> under the wall ends it too.</li></ul>
<div class="grid g2">{clip('fx-breakout', 'Breakout')}{clip('fx-snakegame', 'Snake')}{clip('fx-pongbattle', 'Pong')}{clip('fx-alienparade', 'Alien parade')}</div>
<h2 id="scenes">Quick scenes and Describe a scene</h2>
<p>Under {rk('SCENES')} (below the fireplace), <b>Quick scenes</b> are one-tap presets. <b>Describe a scene</b> lets you type what you want ("slow purple ocean with gold sparkles") and tap <span class="k">Play it</span>. GlowBop picks matching effects and colors from your words.</p>
<h2 id="feature">Feature an effect</h2>
<p>Love one effect? <b>Feature</b> it for the current part of the song, or <span class="k">Pin</span> it to keep it on. Tap <span class="k">Let the show flow again</span> to go back to normal.</p>
<h2 id="transitions">Transitions</h2>
<p>Choose how one effect hands over to the next: quick cuts for high-energy sets, long fades for a chill night.</p>
''', [('looks', 'Looks'), ('calm', 'Calm pack'), ('genres', 'Genre looks'), ('flow', 'Flow pack'), ('eyeball', 'Eyeball'), ('3d', '3D & club'), ('wave', 'Big Wave'), ('games', 'Arcade games'), ('scenes', 'Scenes'), ('feature', 'Feature'), ('transitions', 'Transitions')])

guide('holidays', f'''
<p>Holidays have their own section, {rk('HOLIDAY')}, so they don't pop up in the middle of a July pool party. Tap a holiday and the wall plays <b>only that holiday</b> until you stop it.</p>
<h2 id="country">Holidays for your country</h2>
<p>GlowBop shows the holidays of the country you live in, with the right dates and local names, worked out on your computer. It picks the country from your location on the LIVE tab, or choose one at the top of {rk('HOLIDAY')}. <b>More holidays from other countries</b> shows the rest of the 23. When one of your holidays is on or within 10 days, the HOLIDAY key moves up the rail next to LOOKS.</p>
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
<div class="card"><div class="em">🎇</div><h3>4th of July</h3><p>Fireworks in red, white and blue.</p></div>
</div>
<h3 id="world">New from around the world</h3>
<p>14 more holiday shows, picked by your country:</p>
<div class="toc"><span class="k">🪔 Diwali</span> <span class="k">🎨 Holi</span> <span class="k">🧧 Lunar New Year</span> <span class="k">🌙 Eid</span> <span class="k">🕎 Hanukkah</span> <span class="k">🐣 Easter</span> <span class="k">🎭 Carnival</span> <span class="k">💀 Día de Muertos</span> <span class="k">💐 Mother's Day</span> <span class="k">🔥 Bonfire Night</span> <span class="k">👑 King's Day</span> <span class="k">🇫🇷 Bastille Day</span> <span class="k">🍁 Canada Day</span> <span class="k">🦘 Australia Day</span></div>
<p>South of the equator, snowy winter effects stay out of summer holidays.</p>
<h2 id="songs">Holiday songs</h2>
<p>Play a Christmas song from mid-November to early January, or a Halloween song in October, and the music show switches to that holiday's show by itself. Out of season, the song gets the normal show.</p>
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
''', [('country', 'Your country'), ('list', 'Holidays'), ('world', 'Worldwide'), ('songs', 'Holiday songs'), ('movies', 'Mini-movies'), ('choose', 'Choose effects')])

guide('fireplace', f"""
<p>Turn the whole wall into a fire with one tap. There's no fireplace frame and no logs, just the flames, simulated live so they never loop.</p>
{pic('cozy-fireplace', 'LED curtain showing tall flickering flames behind a couple on a couch')}
<h2 id="light">Light the fire</h2>
<ol><li>Tap {rk('SCENES')} on the side rail. The <b>Fireplace</b> is at the top of the page.</li>
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
<p>Tap {rk('SPORTS')} on the side rail and pick a mode: <span class="k">Game Day</span>, <span class="k">Live Fan</span> or <span class="k">F1</span>. Golf, racing, tennis and UFC are in the <span class="k">Live Fan</span> league list. <span class="k">Off</span> returns to the light show.</p>
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
<p>Tap <span class="k">Live Fan</span>, open the <b>League</b> list and pick <span class="k">⛳ Golf</span>, <span class="k">🏁 Racing</span>, <span class="k">🎾 Tennis</span> or <span class="k">🥊 UFC</span> at the bottom, then tap <span class="k">Put it on the wall</span>. Its settings (favorite player, series and so on) open right below.</p>
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
<p>Weather, storm watch, overhead, quakes, launches, fires and sun times need to know where you are. In {rk('LIVE')} → <b>Live feeds</b>, type a <b>ZIP code</b> or <b>City, State</b> and tap <span class="k">Save</span>. GlowBop shows the place it found underneath.</p>
<p>Tap a feed key again to turn it off. Every new feed has a preview button, so you can see what it looks like before the real thing happens.</p>
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
<h3 id="world">🌍 Storm warnings worldwide</h3>
<p>Outside the US, <b>Storm watch worldwide</b> on the LIVE page picks a source for your country: GDACS tropical cyclones and floods everywhere, MeteoAlarm official warnings in 38 European countries, or any national CAP alert feed you paste in.</p>
{tip('<b>Not an official warning system.</b> Always follow official alerts, your phone\'s emergency alerts and local officials.', 'warn')}
<h2 id="overhead">✈️ Overhead now</h2>
<p>A radar of the planes flying over your house right now, with their direction, plus the International Space Station when it comes by. Choose how far out to look. When the space station is as close as it gets, the wall celebrates. Wave hi! 👋</p>
{clip('live-overhead', 'planes over the house, then the space station (demo sky)')}
<h2 id="quakes">🌍 Earthquakes</h2>
<p>Recent earthquakes drop onto a <b>world map</b> or a spinning <b>globe</b> with a ripple, the biggest first, with how far away they are. Pick the smallest size to show (2.5, 4.5 or 6). Turn on <b>Alert over music</b> and a big one flashes over the music show too.</p>
{clip('live-quakes', 'a preview quake drops on the map (preview mode)')}
<h2 id="aurora">🌌 Aurora</h2>
<p>Slow aurora curtains that follow the live space weather: the higher the Kp index (0 to 9), the taller, brighter and more colourful they get. A solar flare sends a soft gold flash. GlowBop also tells you roughly what Kp it takes to see the aurora from where you live.</p>
{clip('live-aurora', 'a pretend storm: Kp 3 to 7 (preview mode)')}
<h2 id="launches">🚀 Rocket launches</h2>
<p>The next rocket launches around the world, with a countdown on the wall and liftoff when it goes. Turn on <b>Alert over music</b> for a liftoff flash over the show.</p>
{clip('live-launches', 'countdown and liftoff (preview mode)')}
<h2 id="moon">🌕 Moon &amp; sun</h2>
<p>Tonight's moon phase, how full it is and the next full moon, plus sunrise, sunset and golden hour for your spot. Worked out on your computer, no internet needed.</p>
{clip('live-moon', 'the moon and sun times')}
<h2 id="globe">🌐 Globe</h2>
<p>The Earth spinning on your wall, day and night, with the day's quakes, storms, volcanoes, fires and launches marked on it. Let it spin, or keep your home in view.</p>
{clip('live-globe', 'the spinning globe with today\'s markers (preview data)')}
<h2 id="volcano">🌋 Volcanoes</h2>
<p>Volcanoes with an alert right now, with an eruption on the wall and how far away they are.</p>
{clip('live-volcano', 'a volcano alert (preview mode)')}
<h2 id="fires">🔥 Wildfires</h2>
<p>Big wildfires near you, and with your own free <b>NASA FIRMS</b> key the hotspots seen from space around you. Get a key at <a href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" rel="noopener">firms.modaps.eosdis.nasa.gov</a> and paste it on the LIVE page. Each customer uses their own key.</p>
{clip('live-fires', 'hotspots around you (preview mode)')}
<h2 id="credits">Data credits</h2>
<p class="dim" style="font-size:14px">Earthquakes: USGS. Space weather: NOAA SWPC. Rocket launches: The Space Devs. Cyclones, floods, volcanoes and wildfires: Global Disaster Alert and Coordination System, GDACS. European warnings: EUMETNET MeteoAlarm. Fire hotspots: NASA FIRMS. Weather alerts in the US: National Weather Service.</p>
''', [('loc', 'Location'), ('countdown', 'Countdown'), ('weather', 'Weather'), ('storm', 'Storm watch'), ('overhead', 'Overhead'), ('quakes', 'Quakes'), ('aurora', 'Aurora'), ('launches', 'Launches'), ('moon', 'Moon & sun'), ('globe', 'Globe'), ('volcano', 'Volcanoes'), ('fires', 'Fires'), ('credits', 'Credits')])

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
<p><b>Slideshow:</b> turn it on and, while the logo is on the wall, it rotates through every saved logo, including the built-in GlowBop logos.</p>
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
<ol><li>Tap {rk('LIGHTS')} and find <b>Light groups</b>.</li>
<li>Choose <span class="k">All together</span> (one big wall) or <span class="k">Each separate</span>.</li>
<li>In <b>Layout &amp; shape</b> just below, pick <span class="k">One canvas</span> to stretch shows across lights, or <span class="k">Zones</span> to give each light its own area.</li>
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
<li>Restart the curtain (unplug for 10 seconds) and tap <span class="k">Find my lights</span> again on the {rk('LIGHTS')} tab.</li>
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
<h2 id="restart">Something is stuck or acting up</h2>
<p>Open {rk('SETUP')} → <b>Something not working?</b> and tap <span class="k">🔄 Restart GlowBop</span> twice. It restarts the laptop app from your phone in about 10 seconds and your song picks up where it left off. <span class="k">📱 Reload this screen</span> refreshes just the phone or iPad.</p>
<h2 id="dark">The wall is stuck dark, white or strobing</h2>
<ul><li>Look at the mode bar. If <b>⛔ OVERRIDE ACTIVE</b> shows, tap it to release the override keys. A <b>🎚️ FADERS</b> chip means a fader is away from normal: tap it, then <span class="k">↺ Reset all</span>.</li>
<li>On the {rk('DJ')} page, the <span class="k">⬛ Blackout</span> pad holds the wall dark until you tap it again. Check <span class="k">Power</span> at the top of the page too.</li>
<li>Pro DJ: a cue blackout or an Autoloop holds the wall. <span class="k">♫ Back to music</span> lets them all go.</li>
<li>In an interlude, tap <span class="k">🎵 Back to the show</span>. Anything else: <span class="k">♫ Back to music</span>.</li></ul>
<h2 id="show">My Song Show didn't play {PT}</h2>
<p>A show only plays when GlowBop knows where in the song it is. Play the song on GlowBop's own player or a music app that shares its timeline with Windows, or start the song from the beginning. Check <b>Song Shows</b> is on and <b>Play this song's show</b> is on for that song. The {rk('SHOWS')} page tells you why when it can't play. See <a href="/guide/pro-dj.html#follow">How it follows the song</a>.</p>
<h2 id="score">Live scores aren't updating</h2>
<p>Scores only change while a game is live. Before kickoff the board shows the start time. Check the computer is online.</p>
{tip(f'<b>Still stuck?</b> Tap <span class="k">Help &amp; feedback</span> at the bottom of the console to send us a report, or email <a href="mailto:{MAIL}">{MAIL}</a> with what you see and your light brand.', 'pink')}
''', [('breather', 'Taking a breather'), ('phone', 'Phone'), ('find', 'Finding lights'), ('silent', 'No reaction'), ('late', 'Timing'), ('upside', 'Line-up'), ('flicker', 'Flicker'), ('sleep', 'Screen sleeps'), ('restart', 'Restart'), ('dark', 'Stuck dark'), ('show', 'Song Shows'), ('score', 'Live scores')])

# ================================================================ LIGHTS
L = [
    ('ok', 'Supported', 'Twinkly curtains', 'Twinkly Wi-Fi curtains, up to 8 in a row, a stack or a grid, or wrapped into 3D shapes. Tested on our own 2-curtain wall.'),
    ('soon', 'Built in · testing', 'TikTok-style pixel curtains', 'The low-cost Bluetooth RGB pixel curtains sold on TikTok Shop (Surplife app). Found over Bluetooth. Our test panels are on the way.'),
    ('soon', 'New · testing', 'DayBetter strips', 'DayBetter Bluetooth strip lights and light poles. Each strip glows one color at a time, picked from the show and pulsing with the beat.'),
    ('soon', 'Built in · testing', 'WLED', 'DIY strips and matrices running WLED, found on your Wi-Fi.'),
    ('soon', 'Built in · testing', 'Govee', 'Govee lights with LAN Control turned on. They show one color at a time.'),
    ('soon', 'In the works · holidays 2026', 'xLights houses', 'Already run a holiday display with xLights? Point GlowBop at your show folder and it reads your props and controllers (Falcon, Kulp, HinksPix, ESPixelStick, FPP) and plays live, music-reactive shows on your whole house. Your mega tree, arches and roofline become zones. One tap hands it back to your schedule.'),
    ('soon', 'Coming soon', 'Light-only Christmas trees', 'Metal-frame cone trees made of addressable lights (Hello Fairy app).'),
    ('soon', 'Planned', 'More Bluetooth brands', 'Many low-cost Bluetooth strip brands share a few controllers. Tell us yours and we will add it.'),
]
ROAD = [
    ('DJ and stage lights (DMX)', 'Moving heads, par cans, wash lights, strobes, pixel bars, DJ lasers and fog machines, through a USB DMX adapter or an Art-Net / sACN box.'),
    ('Philips Hue', 'Hue bulbs, strips and gradient bars through the Hue Bridge, in fast entertainment mode.'),
    ('Nanoleaf and LIFX', 'Nanoleaf panels and LIFX bulbs and strips on your Wi-Fi.'),
    ('More smart strips', 'Popular Wi-Fi and Bluetooth strip controllers, smart bulbs and TV light bars.'),
    ('Your gaming setup', 'RGB keyboards, mice and PC lights dancing along with the room.'),
]
lights = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Supported lights</span><h1>Will it work with <span class="grad">my lights?</span></h1>
<p class="lead">Here is exactly where things stand. We only mark a light "Supported" after we have run it ourselves.</p></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="grid g3">{''.join(f'<div class="card reveal"><span class="badge {k}">{b}</span><h3 style="margin-top:12px">{n}</h3><p>{d}</p></div>' for k, b, n, d in L)}</div>
<h2 id="soon" class="center" style="margin-top:56px">On the way</h2>
<p class="center dim" style="max-width:720px;margin:6px auto 20px">Lights we are planning next. None of these work yet; we will move each one up to "testing" when it does.</p>
<div class="grid g3">{''.join(f'<div class="card reveal"><span class="badge soon">Planned</span><h3 style="margin-top:12px">{n}</h3><p>{d}</p></div>' for n, d in ROAD)}</div>
<div class="feat reveal" style="margin-top:30px">
<div><span class="eyebrow">Good to know</span><h2>Curtains are the sweet spot</h2>
<ul class="ticks"><li>Curtains are a <b>grid of pixels</b>, so GlowBop can draw real pictures: pumpkins, scores, words.</li><li>More curtains = a <b>bigger screen</b>. Two side by side is a great start.</li><li>Outdoor-rated curtains handle pool decks and porches.</li></ul>
<p class="dim">Have lights you want supported? Email <a href="mailto:{MAIL}">{MAIL}</a> with the brand and model. Requests decide what we test next.</p></div>
<div class="media">{pic('galaxy-patio', 'Two LED curtains side by side on a patio')}</div></div>
</div></section>{band()}'''
page('/lights.html', 'Supported lights · GlowBop', 'GlowBop supports Twinkly curtains today. TikTok-style Bluetooth pixel curtains, DayBetter strips, WLED and Govee are built in and in testing.', lights, '/lights.html')

# ================================================================ COMPARE
Y, N, M = '<span class="y">✓ Yes</span>', '<span class="n">Not advertised</span>', '<span class="m">Partly</span>'
U = '<span class="m">—</span>'        # we could not check this one
_n = lambda k=6: [(N, '')] * k
ROWS = [
    ('#', '🧠 The music brain', 'Everyone flashes on the beat. Only GlowBop listens to the whole song.'),
    ('Flashes on the beat', [(Y, 'Any audio on the PC'), (Y, 'Phone mic, or Music dongle'), (Y, 'PC audio (Desktop), sync box'), (Y, 'PC audio, sync box'), (Y, 'PC audio'), (Y, 'PC audio'), (Y, 'Phone mic, Apple Music')]),
    ('Follows the whole song', [(Y, 'Intro, groove, build-up, drop and breakdown each get their own look'), (N, 'Beat / BPM'), (N, 'Rhythm'), (N, 'Beat'), (N, 'Beat'), (N, ''), (N, 'Beat & mood')]),
    ('Sees the drop coming', [(Y, 'Winds the wall up through the build, then explodes on the drop'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Remembers your songs', [(Y, 'Learns where each drop is and nails it the next time it plays'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Counts bars & downbeats', [(Y, 'Big changes land on the first beat of the bar, like a real lighting operator'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Reads key, mood & genre', [(Y, 'Picks colors and effects to fit the song'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (M, 'Mood')]),
    ('Epic mode for movie music', [(Y, 'Soundtracks and slow songs swell instead of strobing'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Calm, jazz & genre auto-styles', [(Y, 'Calm pack, a Jazz style, and own looks for rock, hip-hop, Latin, country and kids songs, picked automatically'), (N, ''), (U, ''), (N, ''), (N, ''), (N, ''), (M, 'Mood')]),
    ('Flow pack for melodic music', [(Y, '14 silky flow effects with dreamy and drop moods'), (N, ''), (U, ''), (N, ''), (N, ''), (U, ''), (N, '')]),
    ('DJ mode', [(Y, 'Hit pads, look and effect skip keys, hold-to-build drops, cue the next look, tap tempo, crowd lines'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
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
    ('Holidays picked by your country', [(Y, '23 holiday shows with local dates: Diwali, Lunar New Year, Hanukkah, Eid and more'), (U, ''), (U, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Live feeds', [(Y, 'Weather, storm watch, countdowns, planes overhead'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Live science feeds & globe', [(Y, 'Earthquakes, aurora, rocket launches, moon & sun, volcanoes, wildfires and a spinning globe'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Storm alerts outside the US', [(Y, 'GDACS cyclones and floods, MeteoAlarm in 38 European countries, any national alert feed'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Draw your layout + templates', [(Y, 'Photo or grid, lines, arcs, rings, pixel grids; roofline, arch, tree, truss and more'), (M, 'Camera mapping'), (U, ''), (U, ''), (U, ''), (U, ''), (N, '')]),
    ('Zones', [(Y, 'Left, right, top, bottom, center, odd, even, each curtain, each named string'), (U, ''), (U, ''), (U, ''), (U, ''), (U, ''), (N, '')]),
    ('12 themed console sound styles', [(Y, 'All original sounds, from Arcade to Deep Sea Deco'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('#', '🎛️ Pro DJ tools', 'In GlowBop Pro DJ. Every row above is in Home DJ too.', 'pro'),
    ('Song timeline shows', [(Y, 'Program a song cue by cue in six lanes. Auto-draft writes the first version in one tap'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Live fader board', [(Y, 'Master, speed, beat-locked strobe, color, white and trails, two at once on iPad'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Override keys', [(Y, 'Blackout, white, strobe, house lights, colors and logo in one touch, in any mode'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Interlude mode', [(Y, 'A calm wall for talking breaks that ignores the mic, and can start by itself on silence'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Beat-locked loop banks', [(Y, 'The Pad Recorder: record a phrase of hits and loop it from the next bar, 16 slots'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Autoloops / cue list', [(Y, '32 beat-synced Autoloops in 4 banks, your Scenes, cue lists with a big GO'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('MIDI controller templates', [(Y, 'Akai APC mini mk2 / APC40 mkII, Novation Launchpad Mini MK3 / X, Launch Control XL, with LED feedback'), (N, ''), (N, ''), (N, ''), (N, ''), (U, ''), (U, '')]),
    ('VirtualDJ link', [(Y, 'Follows VirtualDJ\'s beat over OS2L, plus MIDI clock in and out'), (N, ''), (N, ''), (N, ''), (N, ''), (U, ''), (N, '')]),
    ('#', '⚙️ Setup & price', ''),
    ('Controls Twinkly lights', [(Y, ''), (Y, ''), (N, 'Govee only'), (N, 'Hue only'), (N, 'Nanoleaf only'), (N, 'WLED / ESP'), (N, 'Hue, LIFX, Nanoleaf')]),
    ('Extra hardware for music', [('<span class="y">None needed, start right now</span>', ''), (M, 'Music dongle sold separately'), (M, 'Sync box for TV/HDMI'), (M, 'Sync box for TV/HDMI'), ('None', ''), ('DIY controller', ''), ('None', '')]),
    ('Many curtains as one wall', [(Y, '1–8: side by side, stacked or a grid'), (M, 'Twinkly only'), (N, ''), (N, ''), (N, ''), (M, 'Virtual strips'), (N, '')]),
    ('Phone & iPad remote', [(Y, 'Any phone or iPad browser, nothing to install. Turns sideways into a big console on iPad'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (Y, 'App'), (N, 'PC app'), (Y, 'It is an iPhone / iPad app')]),
    ('Try the full app before buying', [(Y, 'Right in your browser at glowbop.com/try'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
    ('Runs on', [('<b>Windows PC + iPhone, iPad, Android, Mac</b>', 'The show runs on your PC. Control it from any phone, tablet or computer browser'), ('iOS, Android', ''), ('Windows, iOS, Android', ''), ('Windows, Mac', ''), ('Windows, Mac', ''), ('Win, Mac, Linux', ''), ('iPhone, iPad, Mac', '')]),
    ('Price', [('<b>Home DJ $5.99/mo</b>, $59/yr or $379 once', 'Founder $129 at launch. Pro DJ $8.99/mo, $89/yr or $449 once'), ('Free app; dongle extra', ''), ('Free app; sync box extra', ''), ('Free app; sync box extra', ''), ('See their site', ''), ('Free, open source', ''), ('Paid app', '')]),
]
HEAD = ['GlowBop', 'Twinkly app', 'Govee Home / Desktop', 'Philips Hue Sync', 'Nanoleaf Desktop', 'LedFx', 'Light DJ Pro']
US_HEAD = f'<span class="us-head">{logo_svg()}<b>GlowBop</b><i>★ THE FULL SHOW</i></span>'
def cmp_table(rows, head, us_head):
    t = '<table class="cmp"><thead><tr><th></th>' + ''.join(f'<th{" class=us" if i == 0 else ""}>{us_head if i == 0 else h}</th>' for i, h in enumerate(head)) + '</tr></thead><tbody>'
    for row in rows:
        if row[0] == '#':
            t += f'<tr class="grp{" " + row[3] if len(row) > 3 else ""}"><th colspan="{len(head) + 1}"><b>{row[1]}</b>{f"<span>{row[2]}</span>" if row[2] else ""}</th></tr>'; continue
        name, cells = row
        assert len(cells) == len(head), name
        t += f'<tr><th>{name}</th>' + ''.join(f'<td{" class=us" if i == 0 else ""}>{v}{f"<small>{sm}</small>" if sm else ""}</td>' for i, (v, sm) in enumerate(cells)) + '</tr>'
    return t + '</tbody></table>'
tbl = cmp_table(ROWS, HEAD, US_HEAD)
compare = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Compare</span><h1>GlowBop vs. <span class="grad">the other light apps</span></h1>
<p class="lead">Most light apps flash on the beat. GlowBop is the most advanced light-show software for LED curtains: it hears the whole song, sees the drop coming, remembers your music, and runs game day and the holidays too.</p></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="tablewrap reveal">{tbl}</div>
<p class="lead center reveal" style="margin-top:22px">DJ? See <a href="/compare-dj.html"><b>GlowBop Pro DJ vs DJ lighting software</b></a>: SoundSwitch, rekordbox Lighting, Engine Lighting, Lightkey, QLC+ and MaestroDMX.</p>
<p class="dim" style="font-size:14px;margin-top:14px">Checked October 2026 from each product's own website, help pages and app listings. "Not advertised" means we could not find the feature in their materials, not that it is impossible. A dash (—) means we could not check it. Prices change; check each site. GlowBop rows are in every plan except the <b>Pro DJ tools</b> group, which comes with <a href="/pricing.html#pro">GlowBop Pro DJ</a>. Spot something out of date? Email <a href="mailto:{MAIL}">{MAIL}</a> and we'll fix it.</p>
<div class="grid g3" style="margin-top:36px">
<div class="card reveal"><div class="em">🎚️</div><h3>Follows the song</h3><p>Beat-flashing is easy. Knowing a build-up from a drop from a breakdown is what makes a wall feel like a real light show.</p></div>
<div class="card reveal"><div class="em">💸</div><h3>No extra gadgets</h3><p>No mic dongle and no HDMI sync box. The music already plays on your computer, so GlowBop listens there.</p></div>
<div class="card reveal"><div class="em">🏟️</div><h3>More than music</h3><p>Scoreboards, live sports, F1, messages, logos and holiday movies, from the same app.</p></div>
</div></div></section>{band('Try it on your own wall', 'Monthly and yearly plans start with a 7-day free trial. Join the launch list and we will email you on launch day.')}'''
page('/compare.html', 'Compare · GlowBop', 'How GlowBop compares with the Twinkly app, Govee, Philips Hue Sync, Nanoleaf, LedFx and Light DJ Pro.', compare, '/compare.html')

# ================================================================ PRICING
SELLING = False          # flip to True on launch day: Buy buttons go live (Polar checkout links below)
BUY = {'Monthly': 'https://buy.polar.sh/polar_cl_kVipnhlW4bHB8eL4tKAOXYm5t4Q9nH8pxN0XO4AJUn4',
       'Yearly': 'https://buy.polar.sh/polar_cl_IC4mJM92skvYXkaHAqOsyTWVK6XxQV1CUUW1F2JkwOB',
       'Lifetime': 'https://buy.polar.sh/polar_cl_zLuZrLVyFIje9ESIusnRrWcSwUL8Iqlpr3gL73T2pNn',      # $379
       'Founder': 'https://buy.polar.sh/polar_cl_ryFBIVebhizIWoE5fhSk6KYkibhBiNnVY9avz2d2YtI',      # $129 launch deal (private product)
       'Pro Monthly': 'https://buy.polar.sh/polar_cl_jbLN2lE8JaW0S6muW5yH6iSEM2V6zRX4GMjqc2JV4AX',  # $8.99
       'Pro Yearly': 'https://buy.polar.sh/polar_cl_O6pMeISNwvCl5DrKrU9ihtKf1cWOLm8bSz8la1PgwOv',   # $89
       'Pro Lifetime': 'https://buy.polar.sh/polar_cl_QU9Mxf9p8gFxg4zeMR46LiTgqVpStXAeu18123W51j3'}  # $449
PORTAL = 'https://polar.sh/glowbop/portal'
EVERY = ['Music show with build-up & drop detection', 'Calm, jazz, flow and genre-aware looks', 'DJ mode: 12 hit pads, skip keys, build & drop', 'All 45 looks and 300+ effects', 'Arcade games, 23 holidays & mini-movies', 'Fireplace in every style', 'Sports: 44 live leagues, golf, racing, tennis, UFC, F1', '11 live feeds: weather, storms, quakes, aurora, launches and more', 'Text, logos & screen mirror', 'Up to 8 curtains, grid walls, 3D shapes & draw your layout', 'Console for phone, iPad & laptop, 12 sound styles', 'All updates']
PRO = ['<b>Everything in Home DJ</b>', 'Autoloops: 32 beat-synced looks in 4 banks, plus your Scenes', 'Cue lists with a big GO for weddings and events', 'Tempo toolbox: fine BPM, x2, /2, nudge, Auto Ambient', 'Song Shows: auto-drafted timeline you can edit cue by cue', 'LIVE BOARD: faders, zone faders and colour palettes', 'Override keys aimed at any zone, plus Interlude · Ambient', 'Pad Recorder: record a groove, fire it back on the beat', 'MIDI controller layouts, LED feedback, MIDI clock and VirtualDJ sync', 'Built for paid gigs, clubs, churches and venues', 'All Pro updates']
def plan(name, price, per, note, best=False, tag='', pro=False):
    key = ('Pro ' if pro else '') + name
    btn = ('Buy once' if name == 'Lifetime' else 'Start free trial')
    href = BUY[key] if SELLING and BUY.get(key) else WAIT
    if not (SELLING and BUY.get(key)): btn = 'Join the launch list'
    return f'''<div class="plan{' best' if best else ''} reveal">{f'<span class="tag">{tag}</span>' if tag else ''}<h3>{name}</h3>
<div class="price">{price}<small> {per}</small></div><p class="dim" style="margin:6px 0 0">{note}</p>
<ul class="ticks">{''.join(f'<li>{x}</li>' for x in (PRO if pro else EVERY))}</ul>
<a class="btn{" primary" if best else ""}" href="{href}">{btn}</a></div>'''
pricing = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">Pricing</span><h1>Two ways to <span class="grad">light it up</span></h1>
<p class="lead"><b>Home DJ</b> for parties and holidays. <b>Pro DJ</b> for gigs and venues. Monthly and yearly plans start with a <b>7-day free trial</b>, cancel anytime.</p>
<span class="pill">🎃 Launching this Halloween. Join the list and we'll email you on day one.</span>
<div class="tierjump"><a href="#home">🏠 Home DJ</a><a href="#pro">🎛️ Pro DJ</a></div></div></header>
<section style="padding-top:10px"><div class="wrap">
<h2 class="center tierh" id="home">🏠 GlowBop <span class="grad">Home DJ</span></h2><p class="center dim" style="margin:-4px 0 22px">Everything you need to turn your home into a light show.</p>
<div class="founder reveal"><span class="tag">🎃 Founder launch deal</span><h3>Home DJ Lifetime for <b>$129</b> <s>$379</s></h3><p>During launch week, or for the first 100 buyers, whichever comes first. Pay once, keep GlowBop and every update forever.</p>{f'<a class="btn primary" href="{BUY["Founder"]}">🎃 Grab the Founder deal</a>' if SELLING else ''}</div>
<div class="plans">{plan('Monthly', '$5.99', '/ month', 'Perfect for a party season.')}{plan('Yearly', '$59', '/ year', 'About $4.92 a month. 2 months free.', True, 'Best value')}{plan('Lifetime', '$379', 'once', 'Pay once, keep it forever. Founders pay $129 at launch.')}</div>
<h2 class="center tierh" id="pro" style="margin-top:70px">🎛️ GlowBop <span class="grad">Pro DJ</span></h2><p class="center dim" style="margin:-4px 0 22px"><b>Pro DJ lighting for the lights you already own.</b> Autoloops, cue lists with GO, Song Shows and MIDI controllers on consumer LED lights, run from a phone or iPad. Works with any DJ software. (SoundSwitch is $7.99 a month plus DMX hardware; MaestroDMX is about £785 of hardware. See <a href="/compare-dj.html">the DJ comparison</a>.)</p>
<p class="center" style="margin:-8px 0 20px"><a class="btn small" href="/pro.html">See everything in Pro DJ →</a></p>
<div class="plans pro">{plan('Monthly', '$8.99', '/ month', 'Great for a busy gig season.', pro=True)}{plan('Yearly', '$89', '/ year', 'About $7.42 a month. 2 months free.', True, 'Pro favorite', pro=True)}{plan('Lifetime', '$449', 'once', 'Pay once, own Pro forever.', pro=True)}</div>
<p class="center dim" style="margin-top:22px;font-size:15px">Payments are handled securely by Polar. Prices in USD.</p>
<div style="max-width:780px;margin:50px auto 0"><h2 class="center">Pricing questions</h2>
<details><summary>Home DJ or Pro DJ?</summary><p>Home DJ has every look, game, sport, holiday and live feed, the full music show and DJ mode with 12 hit pads. Pro DJ adds the tools working DJs and venues ask for: Autoloops and Scenes, cue lists with a big GO, the tempo toolbox, Song Shows you can program cue by cue, the LIVE BOARD with faders, zones and palettes, override keys, Interlude · Ambient, the Pad Recorder, and MIDI clock and VirtualDJ sync.</p></details>
<details><summary>Can I try Pro DJ before I pay?</summary><p>Yes. The <a href="/try/">live demo</a> is the real console on a pretend wall, and every Pro tool is playable there. Pro DJ monthly and yearly plans also start with a 7-day free trial.</p></details>
<details><summary>How does the free trial work?</summary><p>Monthly and yearly plans get 7 days with every feature of that tier. If you cancel before the trial ends, you pay nothing.</p></details>
<details><summary>What is the Founder deal?</summary><p>To celebrate the launch, Home DJ Lifetime costs $129 instead of $379 during launch week or for the first 100 buyers, whichever comes first. Same app, every Home DJ feature, every update, forever.</p></details>
<details><summary>Can I switch plans?</summary><p>Yes. Start monthly and move to yearly or lifetime, or step up from Home DJ to Pro DJ, whenever you like.</p></details>
<details><summary>Do I need to buy anything else?</summary><p>Just your lights and a Windows computer. No dongles, sync boxes or extra subscriptions. Song lookup uses free keys.</p></details>
</div></div></section>{band()}'''
thanks = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">You're in</span><h1>Thanks for getting <span class="grad">GlowBop</span>! 🎉</h1>
<p class="lead">Your order went through. Here's how to get your lights dancing.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:780px">
<div class="grid g3">
<div class="card reveal"><div class="em">📧</div><h3>1. Check your email</h3><p>Polar sends your receipt and your <b>GlowBop license key</b> (it starts with GLOWBOP- for Home DJ or GBPRO- for Pro DJ). Check spam if it's not there in a few minutes.</p></div>
<div class="card reveal"><div class="em">⬇️</div><h3>2. Install GlowBop</h3><p><a class="btn primary small" href="/download/GlowBop-Setup.exe" download>Download for Windows</a></p><p>Run it, then follow the <a href="/guide/getting-started.html">getting started guide</a> to find your lights.</p></div>
<div class="card reveal"><div class="em">🔑</div><h3>3. Paste your key</h3><p>Open GlowBop, paste your license key when it asks, and press play on any song.</p></div>
</div>
<p class="center dim" style="margin-top:26px">Lost your key or want to change plans? Open your <a href="{PORTAL}">customer portal</a>. Questions? Email <a href="mailto:{MAIL}">{MAIL}</a>.</p>
</div></section>'''
page('/thanks.html', 'Thank you · GlowBop', 'Your GlowBop order is complete. Find your license key and install the app.', thanks, '/thanks.html')
page('/pricing.html', 'Pricing · GlowBop', 'GlowBop Home DJ costs $5.99 a month, $59 a year, or $379 once, with a $129 Founder deal at launch. GlowBop Pro DJ is $8.99 a month, $89 a year, or $449 once.', pricing, '/pricing.html')

# ================================================================ COMPARE FOR DJS: GlowBop Pro DJ vs DJ lighting software
CHECKED = 'October 15, 2026'
PITCH = 'Pro DJ lighting for the lights you already own.'
DJ_HEAD = ['GlowBop Pro DJ', 'SoundSwitch', 'rekordbox Lighting', 'Engine Lighting (Denon)', 'Lightkey', 'QLC+', 'MaestroDMX']
DJ_US = f'<span class="us-head">{logo_svg()}<b>GlowBop Pro DJ</b><i>★ CONSUMER LIGHTS</i></span>'
DJ_ROWS = [
    ('#', '💸 Price & setup', ''),
    ('Price', [('<b>$8.99/mo</b>, $89/yr or $449 once', 'Software only. Runs on your Windows laptop'), ('$7.99/mo, $79.99/yr or $199 once', 'Plus a DMX interface for stage lights'), ('In rekordbox Creative or Professional plans', 'DMX through RB-DMX1 or ENTTEC'),
               ('Basic free for Philips Hue', 'Pro needs SoundSwitch hardware and a subscription'), ('Paid licence, free download', ''), ('<span class="y">Free, open source</span>', ''), ('Hardware, about £785', '')]),
    ('Works with any DJ software', [(Y, 'Listens to the audio: Serato, rekordbox, VirtualDJ, Traktor, Spotify, YouTube'), (M, 'Inside Serato, Engine DJ, VirtualDJ and rekordbox'), (N, 'rekordbox only'),
                                    (N, 'Engine DJ only'), (M, 'Beat sync through Ableton Link or MIDI clock'), (M, 'Audio input triggers'), (Y, 'Listens to the audio')]),
    ('Phone & tablet control', [(Y, 'The whole console in any phone or iPad browser'), (U, ''), (U, ''), (U, ''), (U, ''), (Y, 'Web interface'), (Y, 'Browser on phone, tablet or PC')]),
    ('#', '🎛️ Running the show', ''),
    ('Autoloops / preset looks', [(Y, '32 in 4 banks, beat-synced'), (Y, 'Autoloops'), (U, ''), (Y, '32 Autoloops'), (Y, 'Presets and sequences'), (Y, 'Scenes and chasers'), (Y, 'Automatic looks')]),
    ('Scenes / static looks', [(Y, 'Save the wall, recall with a fade'), (Y, 'Static Looks'), (U, ''), (U, ''), (Y, 'Presets'), (Y, 'Scenes'), (Y, 'Static looks')]),
    ('Cue list with GO', [(Y, 'Big GO key, crossfades, space bar'), (U, ''), (U, ''), (U, ''), (Y, 'Cues'), (Y, 'Cue lists'), (Y, 'Cue timeline')]),
    ('Per-song scripted shows', [(Y, 'Song Shows with Auto-draft'), (Y, 'Custom scripts'), (U, ''), (Y, 'Custom light shows'), (U, ''), (U, ''), (U, '')]),
    ('Auto shows from the music', [(Y, 'Live audio analysis as the song plays: builds, drops and breaks. Not pre-mapped to song sections'), (Y, 'Autoscript from track analysis'), (Y, 'From phrase analysis'),
                                   (Y, 'Automatic phrase detection'), (U, ''), (M, 'Audio triggers'), (Y, 'Live audio analysis')]),
    ('Override keys', [(Y, 'Flash or latch, aimed at any zone'), (U, ''), (U, ''), (U, ''), (U, ''), (U, ''), (U, '')]),
    ('Fader board / masters', [(Y, 'Master, speed, strobe, color, white, trails'), (U, ''), (U, ''), (U, ''), (U, ''), (Y, 'Virtual console faders'), (U, '')]),
    ('Zones / groups', [(Y, 'Zones with their own faders'), (U, ''), (U, ''), (U, ''), (U, ''), (Y, 'Fixture groups'), (U, '')]),
    ('Colour palettes', [(Y, '8 built in plus your own'), (U, ''), (U, ''), (U, ''), (U, ''), (U, ''), (Y, 'Colour palettes')]),
    ('#', '🔌 Controllers & sync', ''),
    ('MIDI controller mapping', [(Y, 'Long-press any control to learn it'), (U, ''), (U, ''), (U, ''), (Y, 'Map any control'), (Y, 'MIDI input'), (Y, 'Trigger cues from MIDI')]),
    ('Controller templates with LED feedback', [(Y, 'Akai APC mini mk2 / APC40 mkII, Novation Launchpad Mini MK3 / X, Launch Control XL'), (U, ''), (U, ''), (U, ''), (U, ''), (U, ''), (U, '')]),
    ('MIDI clock', [(Y, 'In and out'), (Y, 'MIDI clock and timecode'), (U, ''), (U, ''), (Y, 'Receives MIDI clock'), (U, ''), (U, '')]),
    ('Ableton Link', [(N, 'Not yet'), (Y, 'For Autoloops'), (U, ''), (U, ''), (Y, ''), (U, ''), (U, '')]),
    ('Pro DJ Link / StageLinQ', [(N, 'Not yet (needs a partner deal)'), (Y, 'PRO DJ LINK Bridge'), (U, ''), (U, ''), (U, ''), (U, ''), (U, '')]),
    ('VirtualDJ link (OS2L)', [(Y, 'Follows VirtualDJ\'s beat'), (M, 'Runs inside VirtualDJ'), (U, ''), (U, ''), (U, ''), (Y, 'OS2L'), (U, '')]),
    ('#', '💡 Lights', ''),
    ('DMX stage fixtures (moving heads, fog)', [(N, 'Not supported'), (Y, ''), (Y, 'Par, bar, moving head, strobe, spot'), (Y, 'With a DMX interface'), (Y, 'USB, Art-Net, sACN'), (Y, 'Art-Net, sACN and more'), (Y, '')]),
    ('Consumer LED curtains & strings', [(Y, 'Twinkly today; WLED, Govee and Bluetooth curtains built in and in testing'), (M, 'Philips Hue, Nanoleaf'), (U, ''), (M, 'Philips Hue, Nanoleaf'), (U, ''), (U, ''), (U, '')]),
    ('#', '🎉 The fun extras', 'Built for parties as well as gigs.'),
    ('Games, holidays, sports & live feeds', [(Y, 'Arcade games, 23 holidays, 44 live leagues, earthquakes and aurora, text and logos, 12 sound styles'), (N, ''), (N, ''), (N, ''), (N, ''), (N, ''), (N, '')]),
]
SRC = [('SoundSwitch', 'https://www.soundswitch.com/'), ('rekordbox lighting FAQ', 'https://rekordbox.com/support/faq/lighting-7/'), ('Engine Lighting', 'https://enginedj.com/enginelighting'),
       ('Engine Lighting fees', 'https://support.enginedj.com/support/solutions/articles/69000793757'), ('Lightkey', 'https://www.lightkeyapp.com'), ('QLC+', 'https://www.qlcplus.org'),
       ('MaestroDMX (UK retailer)', 'https://www.simplysoundandlighting.co.uk/products/maestro-dmx-lighting-designer-in-a-box')]
compare_dj = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">For DJs</span><h1>GlowBop Pro DJ vs <span class="grad">DJ lighting software</span></h1>
<p class="lead"><b>{PITCH}</b> DJ lighting apps are built for DMX stage fixtures. GlowBop Pro DJ brings Autoloops, cue lists with GO, MIDI controllers and Song Shows to consumer lights: Twinkly curtains today, with WLED, Govee and Bluetooth curtains built in and in testing. It listens to the audio, so it works with any music source, no plugin needed, and the tightest sync comes from VirtualDJ and MIDI clock.</p>
<div class="btns" style="justify-content:center"><a class="btn primary" href="/pro.html">See Pro DJ</a><a class="btn" href="/compare.html">Compare with home light apps</a></div></div></header>
<section style="padding-top:10px"><div class="wrap">
<div class="tablewrap reveal">{cmp_table(DJ_ROWS, DJ_HEAD, DJ_US)}</div>
<p class="dim" style="font-size:14px;margin-top:14px">Checked on {CHECKED} from each product's own website, help pages and a retailer listing. "Not advertised" means we could not find it in their materials. A dash (—) means we could not check it, not that it is missing. Prices change; check each site. Sources: {' · '.join(f'<a href="{u}" rel="noopener">{n}</a>' for n, u in SRC)}. Spot something wrong? Email <a href="mailto:{MAIL}">{MAIL}</a> and we will fix it.</p>
<div class="grid g3" style="margin-top:36px">
<div class="card reveal"><div class="em">🎧</div><h3>Any DJ software</h3><p>GlowBop listens to what the laptop plays, so Serato, rekordbox, VirtualDJ, Traktor or Spotify all work. VirtualDJ and MIDI clock give the tightest beat.</p></div>
<div class="card reveal"><div class="em">💡</div><h3>Lights you already own</h3><p>No DMX interface, no moving heads. Pro DJ tools for LED curtains and strings, run from a phone or iPad.</p></div>
<div class="card reveal"><div class="em">🧭</div><h3>Honest limits</h3><p>No Ableton Link, Pioneer Pro DJ Link or Denon StageLinQ yet, no DMX fixtures or fog, and shows react live rather than being pre-mapped to song sections.</p></div>
</div></div></section>{band('Try Pro DJ in your browser', 'The live demo is the real console on a pretend wall, with every Pro tool playable.')}'''
page('/compare-dj.html', 'GlowBop Pro DJ vs DJ lighting software', 'GlowBop Pro DJ compared with SoundSwitch, rekordbox Lighting, Engine Lighting, Lightkey, QLC+ and MaestroDMX: price, sync, Autoloops, cues, MIDI, DMX and consumer LED lights.', compare_dj, '/compare.html')

# ================================================================ PRO DJ PAGE
def proshot(name, alt):
    return (f'<figure class="shot appshot"><img src="/img/pro/{name}.webp" alt="{html.escape(alt)}" loading="lazy">'
            f'<span class="concept">Real app screenshot</span></figure>')


PRO_BUY = BUY['Pro Yearly'] if SELLING else WAIT
PRO_BTN = '🎛️ Buy Pro DJ' if SELLING else '✉️ Join the launch list'
TOOLS = [
    ('autoloops', 'Autoloops', 'LOOPS & CUES', '32 beat-synced looks, ready to play',
     'Four banks of eight: <b>Club</b>, <b>Chill / Flow</b>, <b>Big Room</b> and <b>Color</b>, each pad a look, one or two effects and a palette. Tap a pad and it drops in on the next bar and holds the wall, or let Advance move on every 4, 8, 16 or 32 bars.',
     ['Next bar or Snap now, with a fade you pick (cut to 4 s).', 'Each pad at ¼, ½, 1, 2 or 4 times the beat.', 'A fifth bank holds <b>your Scenes</b>.'], 'autoloops'),
    ('scenes', 'Scenes', 'LOOPS & CUES', 'Save the moment, bring it back',
     'Love how the wall looks right now? Save it as a Scene: the look, the effect, the colours and the faders. Recall it later with a smooth fade, from a pad, a cue or your controller.',
     ['Up to 64 scenes, renamed and reordered any time.', 'Use them in cue lists for your big moments.'], 'scenes'),
    ('cues', 'Cue lists with GO', 'LOOPS & CUES', 'Run a wedding with one button',
     'Plan the event top to bottom: Grand Entrance, First Dance, Cake, Last Song. Then tap the big GO for each moment. Each cue crossfades in over its own fade time.',
     ['Cues can be an Autoloop, a Scene, a Blackout, an Interlude or Back to Auto, each with a note.', 'Now and Next in big letters, Back, jump to any cue.', 'A list per event. On a laptop, the space bar is GO.'], 'cues'),
    ('tempo', 'Tempo toolbox', 'LOOPS & CUES', 'Every flash on the kick',
     'Fine-tune the BPM in 0.1 steps, double or halve it, nudge the beat earlier or later and lock it. <b>Auto Ambient</b> goes calm by itself when the music stops, and comes back with it.',
     ['±0.1 and ±1 BPM, x2 and /2, Early and Late.', 'Auto Ambient after 5, 10, 20 or 45 seconds of silence.'], 'tempo'),
    ('shows', 'Song Shows', 'SHOWS', 'Program a whole song, once',
     'A timeline for every song, with lanes for the look, hits, colour, brightness, text and effects. Auto-draft writes a full show from the song\'s drops and mood in one tap; you drag, stretch and tweak it. Or record your DJ pads straight into the song.',
     ['Plays the same way every time that song comes on.', 'Anywhere the show is empty, GlowBop keeps reacting live.'], 'shows'),
    ('faders', 'Fader board', 'LIVE BOARD', 'Ride the wall like a lighting desk',
     'Six live faders on top of any show: <b>Master</b>, speed, a strobe locked to the beat, a colour wheel, white and trails. Two fingers move two faders on an iPad, with a flash key under each one.',
     ['Hold keys for blackout, double time, full strobe, rainbow, white and freeze.', 'Hold keys let go by themselves if the Wi-Fi drops.'], 'faders'),
    ('loops', 'Pad Recorder', 'LIVE BOARD', 'A sampler for your lights',
     'Record a phrase of hit pads, 1 to 8 bars, and fire it back on the beat, looping over any song. Four banks of four slots, eight starter loops and a step editor.',
     ['Starts on the next bar, stops at the end of the bar or at once.', 'Overdub a playing loop to add another layer.'], 'padrecorder'),
    ('override', 'Override keys & Interlude · Ambient', 'OVERRIDE', 'Take over the wall in one touch',
     'Eight big keys: Blackout, White, Strobe, Disco, House, two colours and Audience. <b>Flash</b> keys work while held, <b>Latch</b> keys stay on. For speeches and band changes, <b>Interlude · Ambient</b> drifts the wall into a calm glow or BE RIGHT BACK that ignores the mic, then fades the show back in.',
     ['Fades, your own colours and names, laptop keys 1 to 8.', 'Interlude can start by itself when the music stops.'], 'override'),
    ('zones', 'Zones & palettes', 'LIVE BOARD + OVERRIDE', 'Split the wall, pick the colours',
     'Zones: left, right, top, bottom, center, odd, even, each curtain and every named string from Draw your layout. Aim the override keys at one zone and give each zone its own fader, like a submaster. Pick a colour palette and every look, Autoloop and auto show follows it.',
     ['8 built-in palettes (Neon Club, Sunset, Ice, Blush and more) plus your own.', 'Perfect for wedding or brand colours.'], 'palettes'),
    ('midi', 'MIDI controllers', 'SETUP', 'Your controller, mapped',
     'Long-press any pad, fader, override key, Autoloop or cue key, then press a button on your controller. Or pick a ready layout for the <b>Akai APC mini mk2</b> and <b>APC40 mkII</b>, <b>Novation Launchpad Mini MK3</b>, <b>Launchpad X</b> and <b>Launch Control XL</b>, with the pad LEDs lighting up to match.',
     ['Soft takeover, so faders never jump.', 'Hit pads, Build and Tap work on Home DJ too.'], 'midi'),
]
SPEAKS = ['Autoloops', 'Scenes', 'Cues', 'GO', 'Flash / Latch', 'Master', 'Submasters', 'Blackout', 'Tap', 'Sync']
HVP = [('The music show with drop detection, Epic, calm and genre styles', 1, 1), ('DJ mode: 12 hit pads, build & drop, cue, tap tempo, crowd lines', 1, 1),
       ('Every look, game, holiday, fire, sport and live feed', 1, 1), ('Up to 8 curtains, 3D shapes, draw your layout', 1, 1), ('Phone & iPad console, 12 sound styles', 1, 1),
       ('DJ controller: hit pads, Build and Tap', 1, 1), ('Autoloops (32) and Scenes', 0, 1), ('Cue lists with GO', 0, 1), ('Tempo toolbox and Auto Ambient', 0, 1),
       ('Song Shows', 0, 1), ('Fader board, zone faders and palettes', 0, 1), ('Pad Recorder', 0, 1), ('Override keys and Interlude · Ambient', 0, 1),
       ('Map every control, controller layouts with LED feedback', 0, 1), ('MIDI clock in and out, VirtualDJ link', 0, 1), ('Price', '$5.99/mo · $59/yr · $379 once', '$8.99/mo · $89/yr · $449 once')]
def _hv(v): return v if isinstance(v, str) else ('<span class="y">✓ Yes</span>' if v else '<span class="n">Not included</span>')
hv_tbl = ('<table class="cmp"><thead><tr><th></th><th>🏠 Home DJ</th><th class="us">🎛️ Pro DJ</th></tr></thead><tbody>' +
          ''.join(f'<tr><th>{n}</th><td>{_hv(a)}</td><td class="us">{_hv(b)}</td></tr>' for n, a, b in HVP) + '</tbody></table>')
PFAQ = [
    ('Do I need a controller?', 'No. Everything works by touch on a phone, iPad or the laptop. A MIDI controller is a bonus: plug it into the laptop, pick a ready layout or long-press any control to teach it a button.'),
    ('Does it work with Serato, rekordbox or Traktor?', 'Yes. GlowBop listens to the audio your laptop plays, so it works with any DJ software or music app, with no plugin. For the tightest beat, use VirtualDJ (GlowBop follows its beat over OS2L) or send MIDI clock from your software. There is no Ableton Link, Pioneer Pro DJ Link or Denon StageLinQ yet: those need licence or partner deals.'),
    ('Does it run DMX moving heads or fog machines?', 'No. GlowBop is made for consumer LED lights: Twinkly curtains today, with WLED, Govee and Bluetooth curtains built in and in testing. If your rig is DMX stage fixtures, a DMX app like SoundSwitch or Lightkey is the better fit.'),
    ('Are the shows pre-mapped to the song?', 'The auto show reacts live: it hears the build, the drop and the break as the song plays, and remembers songs it has heard. Want a fixed show? Program it once in Song Shows, or let Auto-draft write one.'),
    ('How do I set up VirtualDJ?', 'In VirtualDJ open Settings, then Options, search for os2l and set <b>os2lDirectIp</b> to <b>127.0.0.1:9996</b>. Restart VirtualDJ, then pick VirtualDJ under Beat from in GlowBop\'s Controllers &amp; Sync.'),
    ('My controller isn\'t listed. Now what?', 'Long-press any control to teach it a button, and use <b>Test my controller</b> in SETUP: press pads and move faders, then tap Send to GlowBop support. The test comes straight to us so we can add your controller.'),
    ('Can I try it first?', 'Yes. The <a href="/try/#autoloops">live demo</a> is the real console on a pretend wall, and every Pro tool is playable. Pro DJ monthly and yearly plans also start with a 7-day free trial.'),
]
def _tool(i, t):
    k, name, tab, title, lead, ticks, img = t
    return f'''<div class="feat{" flip" if i % 2 else ""} reveal" id="{k}">
<div><span class="eyebrow">{name} · {tab}</span><h2>{title}</h2><p class="lead">{lead}</p>
<ul class="ticks">{''.join(f'<li>{x}</li>' for x in ticks)}</ul><a class="btn" href="/guide/pro-dj.html#{k}">{name} in the guide →</a></div>
<div class="media">{proshot(img, name + ' in the GlowBop console')}</div></div>'''
pro = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow" style="--c:var(--gold)">GlowBop Pro DJ</span><h1><span class="grad">Pro DJ lighting</span> for the lights you already own.</h1>
<p class="lead">Autoloops, cue lists with GO, Song Shows, faders, zones and your MIDI controller, on consumer LED lights instead of DMX stage fixtures. It listens to the audio, so it works with Spotify, YouTube, Serato, rekordbox or VirtualDJ, no plugin needed. Run the whole show from a phone or iPad.</p>
<div class="price" style="margin:14px 0 4px;font-size:28px"><b>$8.99</b><small> / month</small> · <b>$89</b><small> / year</small> · <b>$449</b><small> lifetime</small></div>
<div class="btns" style="justify-content:center"><a class="btn primary" href="{PRO_BUY}">{PRO_BTN}</a><a class="btn" href="/try/#autoloops">🕹️ Try it in the demo</a><a class="btn" href="/pricing.html#pro">Pro DJ pricing</a></div>
<div style="display:flex;justify-content:center">{WORKS}</div>
<div class="toc" style="justify-content:center;margin-top:20px">{''.join(f'<a href="#{t[0]}">{t[1]}</a>' for t in TOOLS)}<a href="#clock">MIDI clock</a><a href="#vdj">VirtualDJ</a><a href="#test">Test my controller</a><a href="#vs">Home vs Pro</a><a href="#faq">FAQ</a></div></div></header>
<section class="tight" style="padding-top:0"><div class="wrap"><div class="band reveal" style="padding:22px">
<span class="eyebrow">Speaks your language</span><div class="toc" style="justify-content:center;margin-top:10px">{''.join(f'<span class="k">{w}</span> ' for w in SPEAKS)}</div>
<p class="dim" style="margin:10px 0 0">The words lighting techs use, on keys you can reach with one thumb.</p></div></div></section>
<section style="padding-top:10px"><div class="wrap">{''.join(_tool(i, t) for i, t in enumerate(TOOLS))}</div></section>
<section class="alt"><div class="wrap"><div class="grid g3">
<div class="card reveal" id="clock"><div class="em">⏱️</div><h3>MIDI clock in and out</h3><p>Follow the MIDI clock from your DJ software or a drum machine, or send GlowBop's beat out to other gear. If the clock stops, GlowBop goes back to listening to the audio.</p></div>
<div class="card reveal" id="vdj"><div class="em">🎧</div><h3>VirtualDJ link</h3><p>GlowBop follows VirtualDJ's beat over OS2L:</p><ol style="margin:0;padding-left:20px"><li>In VirtualDJ open <b>Settings → Options</b> and search <b>os2l</b>.</li><li>Set <b>os2lDirectIp</b> to <b>127.0.0.1:9996</b>.</li><li>Restart VirtualDJ and pick <b>VirtualDJ</b> under Beat from.</li></ol></div>
<div class="card reveal" id="test"><div class="em">🧪</div><h3>"Test my controller"</h3><p>Press pads and move faders: every message shows with what it does. One tap sends the test to GlowBop support, so we can add or fix your controller.</p></div>
</div></div></section>
<section class="tight"><div class="wrap center reveal"><span class="eyebrow">Only on GlowBop</span><h2>The fun extras no DJ lighting app has</h2>
<p class="lead">Self-playing arcade games, 23 holidays for your country, 44 live sports leagues, earthquakes and the aurora, text and logos, draw-your-house mapping and 12 console sound styles. All in Pro DJ too.</p>
<p><a class="btn" href="/compare-dj.html">GlowBop Pro DJ vs DJ lighting software →</a></p></div></section>
<section id="vs"><div class="wrap" style="max-width:860px"><div class="center reveal"><span class="eyebrow">Home DJ vs Pro DJ</span><h2>What Pro adds</h2>
<p class="lead">Same app, same lights. A Pro DJ key adds four Pro tabs to the console.</p></div>
<div class="tablewrap reveal" style="margin-top:20px">{hv_tbl}</div></div></section>
<section id="faq"><div class="wrap" style="max-width:820px"><h2 class="center">Pro DJ questions</h2>{''.join(f'<details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in PFAQ)}
<p class="center" style="margin-top:26px"><a class="btn" href="/guide/pro-dj.html">Read the Pro DJ guide →</a></p></div></section>
{band('Play your lights like an instrument', 'Try every Pro tool in the live demo, then join the launch list for launch day.')}'''
page('/pro.html', 'Pro DJ · GlowBop', 'GlowBop Pro DJ: Pro DJ lighting for the lights you already own. Autoloops, cue lists with GO, Song Shows, faders, zones, palettes, override keys, MIDI controllers, MIDI clock and VirtualDJ sync. $8.99 a month, $89 a year or $449 once.', pro, '/pro.html')


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
<li>Paste the <b>license key</b> from your Polar email (it starts with GLOWBOP- for Home DJ or GBPRO- for Pro DJ) and tap <b>Unlock</b>. Then follow the <a href="/guide/getting-started.html#find">setup guide</a> to find your lights.</li></ol>
{tip('<b>Moving to a new computer?</b> On the old one, open SETUP → <b>License</b> and tap <b>Move my license to another computer</b>, then install here and paste your key.', 'pink')}
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
    ('Home DJ or Pro DJ: what\'s the difference?', 'Home DJ is the whole light show: the music show, DJ mode with hit pads and skip keys, every look, game, holiday, fire style, sport and live feed, text and logos, and up to 8 curtains. Pro DJ adds the tools for gigs and venues: <a href="/guide/pro-dj.html#autoloops">Autoloops and Scenes</a>, <a href="/guide/pro-dj.html#cues">cue lists</a>, the <a href="/guide/pro-dj.html#tempo">tempo toolbox</a>, <a href="/guide/pro-dj.html#shows">Song Shows</a>, the <a href="/guide/pro-dj.html#faders">LIVE BOARD</a> with <a href="/guide/pro-dj.html#zones">zones and palettes</a>, <a href="/guide/pro-dj.html#override">override keys</a>, <a href="/guide/pro-dj.html#interlude">Interlude · Ambient</a>, the <a href="/guide/pro-dj.html#loops">Pad Recorder</a> and <a href="/guide/pro-dj.html#midi">MIDI clock and VirtualDJ sync</a>. See <a href="/pricing.html">Pricing</a>.'),
    ('Can I upgrade to Pro DJ later?', 'Yes. Start with Home DJ and step up whenever you like. Paste your Pro DJ key in SETUP, under License, and the Pro tools unlock right away. Nothing to reinstall, and your lights and settings stay as they are.'),
    ('Does Pro DJ need different lights or hardware?', 'No. Pro DJ lighting for the lights you already own: it runs on the same Windows computer and the same lights as Home DJ. A DJ controller is optional on both plans. It does not run DMX moving heads or fog machines. See <a href="/pro.html">Pro DJ</a>.'),
    ('Does it work with Serato, rekordbox or VirtualDJ?', 'Yes. GlowBop listens to the audio the laptop plays, so it works with any DJ software or music app, no plugin needed. With Pro DJ, VirtualDJ (over OS2L) and MIDI clock give the tightest sync. There is no Ableton Link, Pioneer Pro DJ Link or Denon StageLinQ yet. See <a href="/compare-dj.html">GlowBop Pro DJ vs DJ lighting software</a>.'),
    ('Is the try demo the real app?', 'Yes. <a href="/try/">glowbop.com/try</a> is the real GlowBop console running on a pretend light wall in your browser. Every page works, including DJ mode, and the Pro DJ tools are playable there too, so you can fire Autoloops, run a cue list, build a Song Show or ride the faders before you buy.'),
    ('Which lights does it work with?', 'Twinkly curtains today. TikTok-style pixel curtains, DayBetter strips, WLED and Govee are built in and being tested, and light-only Christmas trees are coming. See <a href="/lights.html">Supported lights</a>.'),
    ('Do I need a Mac version?', 'GlowBop runs on Windows 10 and 11 for now. Want Mac? Email us. Requests decide what we build next.'),
    ('What music apps does it work with?', 'All of them. GlowBop listens to the sound your computer plays: Spotify, YouTube, Apple Music, Amazon Music, DJ software, videos, anything.'),
    ('Can I play music from my phone?', 'GlowBop listens on the computer, so play the music on the computer and send it to your speakers. Bluetooth speakers work; use the Sync slider to line them up.'),
    ('Does it work with xLights?', 'It is in the works for the 2026 holidays. Point GlowBop at your xLights show folder and it reads your props and controllers (Falcon, Kulp, HinksPix, ESPixelStick, WLED, Falcon Player) and plays live, music-reactive shows on your house, with no sequencing. One tap hands the house back to your own schedule. xLights is a free, separate program; GlowBop is not made by or affiliated with the xLights team.'),
    ('Does it need a microphone or a dongle?', 'No. It listens to the computer\'s own sound, so room noise and talking don\'t throw it off.'),
    ('Do I need to install an app on my phone?', 'No. Scan the QR code and the remote opens in your phone\'s browser. Add it to your home screen for an app icon.'),
    ('Can it just be a fireplace?', 'Yes. Tap 🔥 Light the fire and the whole wall becomes flickering flames, no fireplace frame or logs. Pick from 9 styles (campfire, candles, torches, lava, dragon breath and more), 9 colors and Cozy or Roaring. See the <a href="/guide/fireplace.html">Fireplace guide</a>.'),
    ('Can I use it outside or at a game?', 'Yes. At home, use your Wi-Fi. At a field, connect the laptop to your phone\'s hotspot. Battery-powered curtains make this easy.'),
    ('How many curtains can I connect?', 'Up to 8 as one wall: side by side, stacked, overlapping or a grid of rows and columns. You can also split lights into groups that each run their own show. It all lives on the LIGHTS tab.'),
    ('Will it slow down my computer?', 'GlowBop is light. A normal laptop runs the show and music at the same time. Plug in for long parties.'),
    ('Is my data private?', 'GlowBop runs on your computer. It doesn\'t record or upload your music. Song lookup only sends the song title and artist to look up genre and tempo.'),
    ('When does it launch?', 'Halloween 2026. <a href="' + WAIT + '">Join the launch list</a> and we\'ll email you.'),
]
faq = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">FAQ</span><h1>Questions, <span class="grad">answered</span></h1>
<p class="lead">Can't find yours? Email <a href="mailto:{MAIL}">{MAIL}</a>.</p></div></header>
<section style="padding-top:10px"><div class="wrap" style="max-width:820px">{''.join(f'<details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in Q)}</div></section>{band()}'''
page('/faq.html', 'FAQ · GlowBop', 'Answers about GlowBop: Home DJ vs Pro DJ, upgrading, the try demo, supported lights, music apps, phone remote, outdoor use, privacy and launch date.', faq, '/faq.html')

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
          ('Looks', '🎨 The looks', 'Each look is a mood with its own colors and effects. These are 8-second slices with a drop halfway, exactly as the app plays them.', 'looks'),
          ('Big Wave', '🌊 Big Wave', 'The newest family of effects: waves that roll, a serpent that swims and an ocean swell.', 'wave'),
          ('Holidays', '🎃 Holidays', 'Every holiday has its own button. Four of them play full wide-screen mini-movies.', 'holidays'),
          ('Fireplace', '🔥 Fireplace', 'Nine styles of fire, simulated live so it never repeats: campfire, bonfire, candles, torches, pixel, spirit, lava, dragon breath and the classic fireplace.', 'fireplace'),
          ('3D shapes', '🌐 3D shapes', 'Effects made for curtains wrapped around a cylinder, a box or a globe. Shown here unrolled, flat.', 'shapes'),
          ('Scoreboard', '🏟️ Sports', 'Game Day for every sport, Live Fan with live stats, golf, NASCAR, the F1 board and the giant countdown clock.', 'scoreboard'),
          ('Live feeds', '📡 Live feeds', 'Countdown, weather, storm watch, overhead, earthquakes, the aurora, a rocket launch, the moon, the globe, a volcano and wildfires, recorded with demo data or the feed\'s own preview mode.', 'live'),
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
shutil.copytree(os.path.join(HERE, 'video'), os.path.join(OUT, 'video'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.tmp.mp4'))   # 🎬 recordings as MP4 (tools/render_videos.py)
shutil.copytree(os.path.join(HERE, 'download'), os.path.join(OUT, 'download'), dirs_exist_ok=True)
shutil.copytree(os.path.join(HERE, 'try'), os.path.join(OUT, 'try'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.py', '__pycache__', '*.bak*'))   # 🕹️ try-it demo: the real console on a pretend wall
with open(os.path.join(OUT, 'PHOTOS.md'), 'w') as f:
    f.write('# Photo & video spots\n\nEach animated LED placeholder on the site is waiting for a real photo or clip. Send them over and they get swapped in.\n\n')
    for pth, cap in PHOTOS: f.write(f'- **{pth}**: {cap}\n')
print(len(PHOTOS), 'photo spots')
