import asyncio,os,sys,importlib.util
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('d',D+'/D/sole_en.py');d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
F=D+'/node_modules/@fontsource/' if os.path.isdir(D+'/node_modules') else '/tmp/claude-0/-home-claude/8cec1c36-f036-5d20-ba16-cb831253af5d/scratchpad/proto/node_modules/@fontsource/'
IMG='file://'+D+'/dei_v3/SOLE_SOLO.png'
CSS=f"""
@font-face{{font-family:CG;font-weight:600;src:url('file://{F}cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2')}}
@font-face{{font-family:CG;font-weight:500;font-style:italic;src:url('file://{F}cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2')}}
@font-face{{font-family:SP;font-weight:400;src:url('file://{F}spectral/files/spectral-latin-400-normal.woff2')}}
:root{{--bg1:#2E1A06;--bg2:#120A03;--glow:#5A3A0E;--rust:#D0762A;--gold:#D4A94A;--gold2:#F0D48E;--parch:#F7EBD2;--mute:#D8C3A0;--line:rgba(240,212,142,.22)}}
*{{margin:0;padding:0;box-sizing:border-box}}body{{width:1080px;height:1350px;overflow:hidden;background:var(--bg2);font-family:SP,Georgia,serif;color:var(--parch)}}
.s{{position:relative;width:1080px;height:1350px;overflow:hidden;background:radial-gradient(110% 80% at 50% 0%,var(--glow) 0%,var(--bg1) 40%,var(--bg2) 100%)}}
.frame{{position:absolute;inset:32px;border:1.5px solid rgba(212,169,74,.8);z-index:5}}
.foot{{position:absolute;left:0;right:0;bottom:56px;text-align:center;font:600 34px CG;letter-spacing:.08em;color:var(--gold2);z-index:6}}
.tag{{position:absolute;left:74px;top:66px;font:italic 500 30px CG;color:var(--mute);z-index:6}}
.band{{position:absolute;left:0;right:0;top:0;height:520px;background:url({IMG}) 50% 12%/cover;z-index:1;-webkit-mask-image:linear-gradient(#000 92%,transparent 100%)}}
.body{{position:absolute;left:84px;right:84px;top:515px;z-index:3}}
h1{{font:600 84px/1 CG;color:var(--parch)}}
.badge{{font:italic 500 38px CG;color:var(--gold2);margin-top:14px}}
.badge small{{font:400 26px SP;color:var(--mute);font-style:normal;margin-left:14px}}
.rule{{height:2px;background:var(--gold);margin:26px 0 24px;width:180px}}
p{{font-size:34px;line-height:1.4}}
.cover .img{{position:absolute;inset:0;background:url({IMG}) 50% 0%/cover}}
.cover .img:after{{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 40%,rgba(18,10,3,.78) 62%,rgba(18,10,3,.97) 80%)}}
.cover .ttl{{position:absolute;left:84px;right:84px;top:830px;z-index:3}}
.cover h1{{font-size:128px;line-height:.95}}.cover .ttl p{{font:italic 500 46px/1.2 CG;color:var(--gold2);margin-top:26px}}
.cta .img{{position:absolute;inset:0;background:url({IMG}) 50% -300px/100% auto}}
.cta .img:after{{content:"";position:absolute;inset:0;background:linear-gradient(transparent 0,transparent 270px,rgba(18,10,3,.8) 560px,#120A03 880px)}}
.cta .body{{top:560px}}
.url{{font:700 78px CG;color:var(--gold2);margin-top:36px}}.free{{display:inline-block;margin-top:24px;padding:14px 30px;border:2px solid var(--gold);font-size:30px}}
"""
def page(inner): return f"<html><head><meta charset=utf-8><style>{CSS}</style></head><body>{inner}</body></html>"
FR='<div class="frame"></div>'; FT='<div class="foot">astrotraderpro.com</div>'
slides=[]
slides.append(page(f'<div class="s cover"><div class="img"></div><div class="tag">The planets in the signs</div><div class="ttl"><h1>The {d.PLANET} in the 12 signs</h1><p>{d.COVER_SUB}</p></div>{FR}{FT}</div>'))
for n,el,dig,t in d.S:
    slides.append(page(f'<div class="s"><div class="band"></div><div class="tag">{d.PLANET} in the signs</div><div class="body"><h1>{d.PLANET} in {n}</h1><div class="badge">{dig}<small>{el}</small></div><div class="rule"></div><p>{t}</p></div>{FR}{FT}</div>'))
slides.append(page(f'<div class="s cta"><div class="img"></div><div class="body"><h1>Where is your {d.PLANET}?</h1><p style="margin-top:22px">The sign is only the start: the house and the aspects change how it plays out. Find your Sun, Moon and Ascendant in your free natal chart.</p><div class="free">The natal chart is free, no sign-up</div><div class="url">astrotraderpro.com</div></div>{FR}</div>'))
async def main():
    out=D+'/out/D/sole/en'; os.makedirs(out,exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':1080,'height':1350})
        for i,h in enumerate(slides,1):
            open(f'{out}/d{i}.html','w').write(h); await pg.goto('file://'+f'{out}/d{i}.html'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=f'{out}/d{i}.jpg',type='jpeg',quality=92)
        await b.close()
asyncio.run(main()); print(len(slides))
