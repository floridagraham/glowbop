"""Builds the GlowBop blog (Oct 27 2026, Graham: a blog search engines and AI assistants can read and cite).
Posts live in src/blog/<slug>.html: a JSON block in an HTML comment on top (title, description, date, image, faq),
then the article body. Run from the site folder:  python src/blog.py
Writes blog/<slug>.html, blog/index.html, blog/feed.xml, sitemap.xml (every public page of the site)
and llms.txt (from src/llms.txt, with the post list filled in).
The header and footer are copied from guide/index.html so the blog always matches the rest of the site."""
import os, re, json, html, glob, datetime

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://glowbop.com'
AUTHOR = {'@type': 'Person', 'name': 'Graham Lucht', 'jobTitle': 'Founder of GlowBop', 'url': BASE + '/blog/'}
ORG = {'@type': 'Organization', 'name': 'GlowBop', 'url': BASE + '/', 'logo': {'@type': 'ImageObject', 'url': BASE + '/icon-512.png'},
       'parentOrganization': {'@type': 'Organization', 'name': 'Marketing Savvy LLC'}}
NO_SITEMAP = {'404.html', 'thanks.html'}


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def shell():
    """Header (from <body> to <main>) and footer (from </main>) of the guide index, so the blog shares the site look."""
    g = read(os.path.join(SITE, 'guide', 'index.html'))
    top = g[g.index('<body>'):g.index('<main id="main">') + len('<main id="main">')]
    bottom = g[g.index('</main>'):]
    return top, bottom


def head(title, desc, url, image, kind, ld):
    e = html.escape
    blocks = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in ld)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<link rel="alternate" type="application/rss+xml" title="GlowBop Blog" href="{BASE}/blog/feed.xml">
<link rel="icon" href="/icon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="{kind}">
<meta property="og:site_name" content="GlowBop">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/style.css?v=9">
<link rel="stylesheet" href="/assets/console.css?v=54">
<link rel="stylesheet" href="/assets/blog.css?v=1">
{blocks}</head>
'''


def nice_date(d):
    return datetime.date.fromisoformat(d).strftime('%B %-d, %Y') if os.name != 'nt' else datetime.date.fromisoformat(d).strftime('%B %#d, %Y')


def load_posts():
    posts = []
    for p in sorted(glob.glob(os.path.join(SITE, 'src', 'blog', '*.html'))):
        s = read(p)
        m = re.match(r'\s*<!--(.*?)-->', s, re.S)
        meta = json.loads(m.group(1))
        meta['slug'] = os.path.splitext(os.path.basename(p))[0]
        meta['body'] = s[m.end():].strip()
        meta.setdefault('updated', meta['date'])
        posts.append(meta)
    posts.sort(key=lambda x: (x['date'], x.get('order', 0)), reverse=True)
    return posts


def post_page(p, top, bottom, posts):
    url = f"{BASE}/blog/{p['slug']}.html"
    img = BASE + p['image']
    e = html.escape
    article = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': p['title'], 'description': p['description'],
               'image': img, 'datePublished': p['date'], 'dateModified': p['updated'], 'author': AUTHOR, 'publisher': ORG,
               'mainEntityOfPage': url, 'inLanguage': 'en-US', 'keywords': ', '.join(p.get('tags', []))}
    faq = {'@context': 'https://schema.org', '@type': 'FAQPage',
           'mainEntity': [{'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}} for q in p['faq']]}
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'GlowBop', 'item': BASE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': BASE + '/blog/'},
        {'@type': 'ListItem', 'position': 3, 'name': p['title'], 'item': url}]}
    faq_html = ''.join(f'<details><summary>{e(q["q"])}</summary><p>{e(q["a"])}</p></details>' for q in p['faq'])
    more = [x for x in posts if x['slug'] != p['slug']][:3]
    more_html = ''.join(f'<a class="card" href="/blog/{x["slug"]}.html"><h3>{e(x["title"])}</h3><p>{e(x["description"])}</p><span class="more">Read →</span></a>' for x in more)
    body = f'''<article class="wrap post">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">GlowBop</a> / <a href="/blog/">Blog</a></nav>
<header class="posthead"><span class="eyebrow">{e(p.get('kicker', 'Light show tips'))}</span><h1>{e(p['title'])}</h1>
<p class="byline">By <b>Graham Lucht</b>, founder of GlowBop · <time datetime="{p['date']}">{nice_date(p['date'])}</time></p></header>
<div class="answer"><p class="anslabel">The short answer</p><p>{p['answer']}</p></div>
<figure class="postimg"><img src="{p['image']}" alt="{e(p['image_alt'])}" width="1344" height="752" decoding="async"><figcaption>{e(p.get('image_note', 'Concept photo · real GlowBop patterns'))}</figcaption></figure>
<div class="doc">
{p['body']}
<h2 id="faq">Questions people ask</h2>
<div class="faq">{faq_html}</div>
</div>
<aside class="author"><p><b>About the author.</b> Graham Lucht builds GlowBop in Fort Myers, Florida. The apps that came with his Twinkly lights couldn't turn his pool cage into a dance party, so he built GlowBop to do it. He runs a wall of Twinkly curtains, a Nanoleaf string Christmas tree and a LIFX string, and tests every light GlowBop supports on it first. <a href="/blog/why-i-built-glowbop.html">Read his story</a>.</p></aside>
</article>
<section class="tight"><div class="wrap"><h2 class="morehead">More from the blog</h2><div class="grid g3">{more_html}</div></div></section>
<section class="tight"><div class="wrap"><div class="band">
<h2>Ready to set your lights free?</h2><p class="lead">Play the live demo in your browser, then start your 7-day free trial.</p>
<div class="btns" style="justify-content:center"><a class="btn primary" href="/try/?intro=1">Play the live demo</a><a class="btn" href="/pricing.html">Try free for 7 days</a></div>
</div></div></section>
'''
    return head(p['title'] + ' · GlowBop Blog', p['description'], url, img, 'article', [article, faq, crumbs]) + top + '\n' + body + bottom


def index_page(posts, top, bottom):
    url = BASE + '/blog/'
    e = html.escape
    blog = {'@context': 'https://schema.org', '@type': 'Blog', 'name': 'GlowBop Blog', 'url': url, 'publisher': ORG,
            'description': 'Answers to the questions LED light fans ask most: music sync, Twinkly, Nanoleaf and LIFX tips, holiday displays and party lights.',
            'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': f"{BASE}/blog/{p['slug']}.html", 'datePublished': p['date'], 'author': AUTHOR} for p in posts]}
    cards = ''.join(f'''<a class="card postcard" href="/blog/{p["slug"]}.html"><img src="{p["image"]}" alt="" width="1344" height="752" loading="lazy" decoding="async">
<span class="eyebrow">{e(p.get('kicker', 'Light show tips'))}</span><h2>{e(p["title"])}</h2><p>{e(p["description"])}</p><span class="more">Read →</span></a>''' for p in posts)
    body = f'''<header class="pagehead"><div class="wrap center"><span class="eyebrow">The GlowBop Blog</span><h1>Light show answers, <span class="grad">straight up</span></h1>
<p class="lead">The questions LED light fans ask most in light groups and forums, answered plainly: music sync, Twinkly, Nanoleaf and LIFX, holiday displays and party walls.</p></div></header>
<section style="padding-top:10px"><div class="wrap"><div class="grid g3 bloggrid">{cards}</div></div></section>
<section class="tight"><div class="wrap"><div class="band">
<h2>Ready to set your lights free?</h2><p class="lead">Play the live demo in your browser, then start your 7-day free trial.</p>
<div class="btns" style="justify-content:center"><a class="btn primary" href="/try/?intro=1">Play the live demo</a><a class="btn" href="/pricing.html">Try free for 7 days</a></div>
</div></div></section>
'''
    desc = 'GlowBop Blog: answers to the LED light questions people ask most, from music sync and Twinkly tips to holiday displays and party walls.'
    return head('GlowBop Blog · Light show answers', desc, url, BASE + '/img/pool-party.jpg', 'website', [blog]) + top + '\n' + body + bottom


def feed(posts):
    e = html.escape
    items = ''.join(f'''<item><title>{e(p["title"])}</title><link>{BASE}/blog/{p["slug"]}.html</link><guid>{BASE}/blog/{p["slug"]}.html</guid>
<pubDate>{datetime.date.fromisoformat(p["date"]).strftime("%a, %d %b %Y 09:00:00 -0400")}</pubDate><description>{e(p["description"])}</description></item>\n''' for p in posts)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>GlowBop Blog</title><link>{BASE}/blog/</link>
<description>Light show answers from GlowBop: music sync, Twinkly, Nanoleaf and LIFX tips, holiday displays and party walls.</description>
<language>en-us</language>
{items}</channel></rss>
'''


def sitemap(posts):
    """Every public page. Blog posts carry their lastmod; other pages leave it out rather than guess."""
    urls = []
    for p in sorted(glob.glob(os.path.join(SITE, '**', '*.html'), recursive=True)):
        rel = os.path.relpath(p, SITE).replace(os.sep, '/')
        if rel.startswith(('src/', '.git/', 'blog/')) or rel in NO_SITEMAP or '/_' in '/' + rel:
            continue
        loc = BASE + '/' + (rel[:-len('index.html')] if rel.endswith('index.html') else rel)
        urls.append((loc, None))
    urls.append((BASE + '/blog/', posts[0]['updated']))
    urls += [(f"{BASE}/blog/{p['slug']}.html", p['updated']) for p in posts]
    body = ''.join(f'<url><loc>{u}</loc>' + (f'<lastmod>{d}</lastmod>' if d else '') + '</url>\n' for u, d in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}</urlset>\n'


def main():
    top, bottom = shell()
    posts = load_posts()
    for p in posts:
        write(os.path.join(SITE, 'blog', p['slug'] + '.html'), post_page(p, top, bottom, posts))
    write(os.path.join(SITE, 'blog', 'index.html'), index_page(posts, top, bottom))
    write(os.path.join(SITE, 'blog', 'feed.xml'), feed(posts))
    write(os.path.join(SITE, 'sitemap.xml'), sitemap(posts))
    blog = '\n'.join(f"- [{p['title']}]({BASE}/blog/{p['slug']}.html): {p['description']}" for p in posts)
    write(os.path.join(SITE, 'llms.txt'), read(os.path.join(SITE, 'src', 'llms.txt')).replace('{BLOG}', f'- [Blog index]({BASE}/blog/)\n' + blog))
    print(f'{len(posts)} posts built')


if __name__ == '__main__':
    main()
