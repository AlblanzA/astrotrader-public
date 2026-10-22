#!/usr/bin/env python3
"""Serie C «Il ritratto»: 7 schede per punto e lingua → out/C/<punto>/<lingua>/c1..c7.jpg (1080x1350).
Uso: python3 render_C.py --langs it,en --points marte,sole"""
import asyncio, io, os, sys
from PIL import Image, ImageCms
from playwright.async_api import async_playwright
from hant import HANT, is_zh, hant
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
HERE = os.path.dirname(os.path.abspath(__file__))
ALL = 'sole,luna,mercurio,venere,marte,giove,saturno,urano,nettuno,plutone,rahu,ketu,lilith'.split(',')
def opt(k, d): return sys.argv[sys.argv.index(k) + 1].split(',') if k in sys.argv else d
LG = opt('--langs', ['it']); PT = opt('--points', ALL)
CHECK = r'''()=>{const fr=document.querySelector('.frame').getBoundingClientRect(),bad=[];
 const ft=document.querySelector('.foot'); const lim=ft?ft.getBoundingClientRect().top-12:fr.bottom-10;
 for(const e of document.querySelectorAll('.s *')){ if(e.closest('svg')||e.classList.contains('frame'))continue;
  if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  const g=document.createRange(); g.selectNodeContents(e); const r=g.getBoundingClientRect(); const tx=e.textContent.trim().slice(0,40);
  if(r.left<fr.left+6||r.right>fr.right-6||r.top<fr.top+6) bad.push('fuori cornice: '+tx);
  if(!e.closest('.foot')&&!e.closest('.tag')&&!e.closest('.count')&&r.bottom>lim) bad.push('tocca il footer: '+tx);
  if(e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible') bad.push('overflow: '+tx);}
 for(const e of document.querySelectorAll('.row b,.cols h3,h1,.free')){const g=document.createRange();g.selectNodeContents(e);const r=g.getBoundingClientRect(),q=e.getBoundingClientRect(); if(r.right>q.right+2||r.left<q.left-2) bad.push('esce dal box: '+e.textContent.trim().slice(0,30));}
 if(/undefined/.test(document.body.innerText)) bad.push('testo undefined');
 return bad;}'''
async def main():
    fails = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1080, 'height': 1350})
        for pt in PT:
            for L in LG:
                d = os.path.join(HERE, 'out', 'C_zt' if HANT else 'C', pt, L); os.makedirs(d, exist_ok=True)
                for n in range(1, 8):
                    await pg.goto(f'file://{HERE}/serieC.html#{pt}-{n}-{L}'); await pg.reload()
                    await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(500)
                    g = await pg.evaluate('window.fit&&window.fit()'); await pg.wait_for_timeout(80)
                    if HANT and L=='zh': await hant(pg)
                    bad = await pg.evaluate(CHECK)
                    png = await pg.screenshot()
                    Image.open(io.BytesIO(png)).convert('RGB').save(f'{d}/c{n}.jpg', 'JPEG', quality=90, optimize=True, subsampling=0, icc_profile=SRGB)
                    if bad: fails += 1; print('CONTROLLA', pt, L, n, 'fit', g, *bad[:5])
        await b.close()
    print('RENDER FAILS:', fails); sys.exit(1 if fails else 0)
asyncio.run(main())
