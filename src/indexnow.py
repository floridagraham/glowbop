"""Tells Bing, Yandex, Seznam and Naver (through IndexNow) that the blog pages are new or changed.
Run ONLY after the blog is live on glowbop.com and Graham approved the ping in Edison:  python src/indexnow.py
The key file at the site root (<KEY>.txt) must be live first, or IndexNow rejects the ping."""
import os, re, json, glob, urllib.request

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = next(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(SITE, '*.txt')) if re.fullmatch(r'[0-9a-f]{32}\.txt', os.path.basename(p)))
with open(os.path.join(SITE, 'sitemap.xml'), encoding='utf-8') as f:
    urls = [u for u in re.findall(r'<loc>(.*?)</loc>', f.read()) if '/blog/' in u]
urls += ['https://glowbop.com/llms.txt', 'https://glowbop.com/blog/feed.xml']
body = json.dumps({'host': 'glowbop.com', 'key': KEY, 'keyLocation': f'https://glowbop.com/{KEY}.txt', 'urlList': urls}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
with urllib.request.urlopen(req, timeout=30) as r:
    print(r.status, f'{len(urls)} URLs sent')  # 200 or 202 = accepted
