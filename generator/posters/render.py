import asyncio,sys,os
from playwright.async_api import async_playwright
HERE=os.path.dirname(os.path.abspath(__file__))
async def main(items):
    os.makedirs(f'{HERE}/out',exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1080,'height':1350})
        bad=0
        for it in items:
            await pg.goto(f'file://{HERE}/poster.html#{it}'); await pg.reload()
            await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(600)
            r=await pg.evaluate('window.fit()')
            await pg.screenshot(path=f'{HERE}/out/{it}.png')
            st='OK' if r['over']<=0 else 'CONTROLLA'; bad+=st!='OK'
            print(it,st,r)
        await b.close()
    print('FAILS',bad)
asyncio.run(main(sys.argv[1:]))
