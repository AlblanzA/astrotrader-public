#!/usr/bin/env python3
"""Render serie A (Sole/Luna/Mercurio/Venere nelle 12 case) e serie B (Se hai il Sole/la Luna/... in casa N...) per en/hi/it.
Uso: python3 render_serie.py [A] [B] [--langs en,hi,it] [--planets sole,luna,mercurio,venere] [--houses 1,2,...]
Output in out/serie/:
  A_{p}_{L}.png (1080x1440) + A_{p}_{L}_ig.jpg (1080x1350, letterbox sul colore di fondo del template)
  B_{p}_casa{n}_{L}.jpg (1080x1350)
Ogni render passa i controlli di sovrapposizione / fuoriuscita; esce con codice 1 se qualcosa non va.
"""
import asyncio, io, os, sys
from PIL import Image, ImageCms
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB')).tobytes()
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out', 'serie')
DEI = '/home/claude/dei'

# Controlli comuni: testo fuori dalla cornice, testo tagliato (overflow), testo che tocca il footer,
# figli di riga che escono dalla propria riga, righe di tabella sovrapposte.
CHECK_JS = r'''(sel)=>{
 const S=document.querySelector('.s').getBoundingClientRect(), fr=document.querySelector('.frame').getBoundingClientRect();
 const foot=document.querySelector('.foot').getBoundingClientRect(); const bad=[];
 const leaves=[...document.querySelectorAll('.s *')].filter(e=>!e.closest('svg')&&!e.classList.contains('frame')&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
 for(const e of leaves){const rg=document.createRange(); rg.selectNodeContents(e); const r=rg.getBoundingClientRect(); const tx=e.textContent.trim().slice(0,40);
   if(r.left<fr.left+4||r.right>fr.right-4||r.top<fr.top+4||r.bottom>fr.bottom-4) bad.push('fuori cornice: '+tx);
   if(e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible') bad.push('overflow orizzontale: '+tx);
   if(!e.closest('.foot')&&r.bottom>foot.top-6) bad.push('tocca il footer: '+tx);}
 // ogni elemento di testo deve stare dentro il box del suo contenitore di riga
 for(const row of document.querySelectorAll(sel)){const rr=row.getBoundingClientRect();
   for(const c of row.children){const cr=c.getBoundingClientRect(); if(cr.top<rr.top-1||cr.bottom>rr.bottom+1||cr.right>rr.right+1||cr.left<rr.left-1) bad.push('esce dalla riga: '+c.textContent.trim().slice(0,40));}}
 // blocchi principali non sovrapposti tra loro
 const blocks=[...document.querySelectorAll('.blk')].map(e=>[e.className,e.getBoundingClientRect()]);
 for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){const a=blocks[i][1],b=blocks[j][1];
   if(a.left<b.right&&b.left<a.right&&a.top<b.bottom-1&&b.top<a.bottom-1) bad.push('sovrapposti: '+blocks[i][0]+' / '+blocks[j][0]);}
 // parole spezzate male: una riga di testo con una sola parola corta in fondo a un paragrafo lungo (solo segnalazione)
 return {bad, bottom:Math.max(...leaves.filter(e=>!e.closest('.foot')).map(e=>e.getBoundingClientRect().bottom))|0, foot:foot.top|0,
         fs:(document.querySelector('.body li')&&getComputedStyle(document.querySelector('.body li')).fontSize)||''};
}'''

def bg_color(planet):
    return {'sole': (0x12, 0x0A, 0x03), 'luna': (0x05, 0x09, 0x10), 'marte': (0x14, 0x06, 0x08),
            'mercurio': (0x05, 0x0E, 0x10), 'venere': (0x12, 0x06, 0x0D),
            'giove': (0x07, 0x0A, 0x18), 'saturno': (0x08, 0x08, 0x0A), 'urano': (0x04, 0x0E, 0x14), 'nettuno': (0x02, 0x0D, 0x10), 'plutone': (0x0A, 0x03, 0x06)}[planet]

def to_ig(png_bytes, planet):
    """1080x1440 -> 1080x1350: scala all'altezza 1350 e centra su tela del colore di fondo del template."""
    im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    h = 1350; w = round(im.width * h / im.height)
    im = im.resize((w, h), Image.LANCZOS)
    can = Image.new('RGB', (1080, 1350), bg_color(planet))
    x0 = (1080 - w) // 2
    # le bande laterali prolungano il fondo del template riga per riga (il gradiente radiale resta senza cuciture)
    can.paste(im.crop((0, 0, 1, h)).resize((x0, h)), (0, 0))
    can.paste(im.crop((w - 1, 0, w, h)).resize((1080 - x0 - w, h)), (x0 + w, 0))
    can.paste(im, (x0, 0))
    return can

def save_jpg(im, path):
    im.convert('RGB').save(path, 'JPEG', quality=90, optimize=True, subsampling=0, icc_profile=SRGB)

def sun_img():
    hd = os.path.join(DEI, 'SOLE_HD.png')
    return hd if os.path.exists(hd) else None

async def load(pg, url):
    await pg.goto(url); await pg.reload()
    await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(700)
    # fit di serie B (se presente) gira dopo i font
    await pg.evaluate('window.fit&&window.fit()'); await pg.wait_for_timeout(100)

async def main():
    args = sys.argv[1:]
    def opt(name, default):
        if name in args: return args[args.index(name) + 1].split(',')
        return default
    langs = opt('--langs', ['en', 'hi', 'it']); planets = opt('--planets', ['sole', 'luna'])
    houses = [int(x) for x in opt('--houses', [str(i) for i in range(1, 13)])]
    series = [a for a in args if a in ('A', 'B')] or ['A', 'B']
    os.makedirs(OUT, exist_ok=True)
    fails = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if 'A' in series:
            pg = await b.new_page(viewport={'width': 1080, 'height': 1440})
            for pl in planets:
                extra = ''
                if pl == 'sole' and sun_img(): extra = '&img=' + sun_img() + '&pos=50%25%2030%25/180%25%20auto'
                for L in langs:
                    await load(pg, f'file://{HERE}/serieA_case.html?p={pl}{extra}#{L}')
                    m = await pg.evaluate(CHECK_JS, '.tr')
                    png = await pg.screenshot()
                    open(f'{OUT}/A_{pl}_{L}.png', 'wb').write(png)
                    save_jpg(to_ig(png, pl), f'{OUT}/A_{pl}_{L}_ig.jpg')
                    st = 'OK' if not m['bad'] else 'CONTROLLA'
                    fails += bool(m['bad'])
                    print(f"A {pl} {L}: {st} contenuto fino a y={m['bottom']} footer y={m['foot']}", *m['bad'][:8], sep='\n   ' if m['bad'] else ' ')
            await pg.close()
        if 'B' in series:
            pg = await b.new_page(viewport={'width': 1080, 'height': 1350})
            for pl in planets:
                for L in langs:
                    for n in houses:
                        await load(pg, f'file://{HERE}/serieB.html#{pl}-{n}-{L}')
                        m = await pg.evaluate(CHECK_JS, '.body li')
                        png = await pg.screenshot()
                        save_jpg(Image.open(io.BytesIO(png)), f'{OUT}/B_{pl}_casa{n}_{L}.jpg')
                        st = 'OK' if not m['bad'] else 'CONTROLLA'
                        fails += bool(m['bad'])
                        print(f"B {pl} casa{n} {L}: {st} li={m['fs']} contenuto fino a y={m['bottom']} footer y={m['foot']}", *m['bad'][:8], sep='\n   ' if m['bad'] else ' ')
            await pg.close()
        await b.close()
    print('RENDER FAILS:', fails)
    sys.exit(1 if fails else 0)

asyncio.run(main())
