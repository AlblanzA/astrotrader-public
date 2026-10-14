#!/usr/bin/env python3
"""Scheda finale (14) dei caroselli «<pianeta> nelle 12 case»: salva + invia a un amico.
Uso: python3 render_endcard.py [--planets mercurio,venere] [--langs it,en] → out/endcard/<p>/<L>/14.jpg (1080x1350)."""
import asyncio, io, os, sys
from PIL import Image, ImageCms
from playwright.async_api import async_playwright
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
HERE = os.path.dirname(os.path.abspath(__file__))
def opt(k, d):
    return sys.argv[sys.argv.index(k) + 1].split(',') if k in sys.argv else d
PL = opt('--planets', 'mercurio,venere,marte,giove,saturno,urano,nettuno,plutone'.split(','))
LG = opt('--langs', 'en,hi,es,pt,fr,ru,zh,ja,it'.split(','))
CHECK = '''()=>{const fr=document.querySelector('.frame').getBoundingClientRect(),ft=document.querySelector('.foot').getBoundingClientRect(),
 pb=document.querySelector('.port').getBoundingClientRect(),bl=document.querySelector('.blocks').getBoundingClientRect(),bad=[];
 if(bl.bottom>ft.top-30)bad.push('testo sul footer '+(bl.bottom|0)+'>'+(ft.top|0)); if(bl.top<pb.bottom+20)bad.push('testo sul ritratto');
 for(const e of document.querySelectorAll('h2,p,.foot')){const g=document.createRange(); g.selectNodeContents(e); const r=g.getBoundingClientRect(); if(r.left<fr.left+20||r.right>fr.right-20)bad.push('fuori: '+e.textContent.slice(0,30));}
 return {bad, bottom:bl.bottom|0, foot:ft.top|0};}'''
async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1080, 'height': 1350})
        for pl in PL:
            for L in LG:
                await pg.goto(f'file://{HERE}/endcard.html?p={pl}&l={L}')
                await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(300)
                r = await pg.evaluate(CHECK)
                if r['bad']: bad += 1; print('KO', pl, L, r)
                png = await pg.screenshot()
                d = os.path.join(HERE, 'out', 'endcard', pl, L); os.makedirs(d, exist_ok=True)
                Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(d, '14.jpg'), 'JPEG', quality=90, optimize=True, subsampling=0, icc_profile=SRGB)
                print('ok', pl, L, r['bottom'], r['foot'])
        await b.close()
    sys.exit(1 if bad else 0)
asyncio.run(main())
