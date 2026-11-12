import asyncio,os,sys,importlib.util,json
from playwright.async_api import async_playwright
D=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,D+'/D')
F='/tmp/claude-0/-home-claude/8cec1c36-f036-5d20-ba16-cb831253af5d/scratchpad/proto/node_modules/@fontsource/'
SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
EM=['Fire · cardinal','Earth · fixed','Air · mutable','Water · cardinal','Fire · fixed','Earth · mutable','Air · cardinal','Water · fixed','Fire · mutable','Earth · cardinal','Air · fixed','Water · mutable']
# img, posizione banda, posizione cta, palette [bg1,bg2,glow,rust,neg,gold,gold2,parch,mute]
V={
'sole':('SOLE_SOLO.png','50% 12%','50% -300px/100% auto',['#2E1A06','#120A03','#5A3A0E','#D0762A','#EFA56A','#D4A94A','#F0D48E','#F7EBD2','#D8C3A0']),
'luna':('LUNA_BAND.png','50% 0%','50% 0%/100% auto',['#0E1830','#050910','#1F3158','#6F8FC4','#A7BCE0','#BFCBDE','#E1E8F3','#F1F4F9','#A9B5C9']),
'mercurio':('mercurio_v3.png','50% 4%','50% 0%/110% auto',['#0E2226','#050E10','#1C4348','#C9742E','#EBA774','#CDAE66','#EAD6A0','#F2EEE3','#B4C3BF']),
'venere':('venere_v3.png','50% 8%','55% 8%/180% auto',['#2C1020','#12060D','#5A2338','#C9607A','#EE9BAE','#DDA98C','#F3D0BD','#FBEFE8','#D9B7B2']),
'marte':('marte_v3.png','50% 8%','50% 8%/180% auto',['#2E0C0F','#140608','#4A1216','#B04A2E','#E39C84','#C9A34E','#E8CD8E','#F2E7CF','#CDB9A8']),
'giove':('giove_v3.png','50% 8%','52% 14%/190% auto',['#141C3A','#070A18','#26346A','#7FA0E8','#AFC4F2','#D4B35A','#EED79A','#F2EFE6','#B9BFD6']),
'saturno':('saturno_v3.png','50% 8%','50% 16%/190% auto',['#1A1A1E','#08080A','#34343C','#B8A06A','#D8C49A','#C9AE6A','#E6D3A0','#EEEAE0','#B5B0A6']),
'urano':('urano_v3.png','50% 8%','50% 10%/180% auto',['#0C2230','#040E14','#174A5E','#5FC8D8','#9EDDE6','#C9B26A','#E8D8A2','#EEF5F6','#A9C3C9']),
'nettuno':('nettuno_v3.png','50% 8%','55% 12%/190% auto',['#06242A','#020D10','#0E4A50','#4FB8A8','#8FD8CC','#CDAF62','#EAD49A','#EAF4F1','#9EC2BC']),
'plutone':('plutone_v3.png','50% 8%','48% 10%/190% auto',['#16161B','#060608','#2C2C36','#A88C52','#D6BE86','#C9A34E','#E8CD8E','#F2EEE6','#B9B4AA']),
}
def load(pt):
    sp=importlib.util.spec_from_file_location('m',f'{D}/D/{pt if pt!="sole" else "sole"}_en.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
    if pt=='sole': return 'Sun',m.COVER_SUB,[(n,el,dig,t) for n,el,dig,t in m.S]
    from extras import X
    out=[]
    for i,(lab,t) in enumerate(m.T):
        if pt in X: t=t.replace(' The shadow',' '+X[pt][i]+' The shadow',1)
        out.append((SIGNS[i],EM[i],lab,t))
    return m.NAME,m.COVER_SUB,out
def css(pt):
    img,bpos,cpos,c=V[pt]; IMG='file://'+D+'/dei_v3/'+img
    bg1,bg2,glow,rust,neg,gold,gold2,parch,mute=c; MK=92 if pt=='sole' else 80
    return f"""
@font-face{{font-family:CG;font-weight:600;src:url('file://{F}cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2')}}
@font-face{{font-family:CG;font-weight:500;font-style:italic;src:url('file://{F}cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2')}}
@font-face{{font-family:SP;font-weight:400;src:url('file://{F}spectral/files/spectral-latin-400-normal.woff2')}}
:root{{--bg1:{bg1};--bg2:{bg2};--glow:{glow};--gold:{gold};--gold2:{gold2};--parch:{parch};--mute:{mute}}}
*{{margin:0;padding:0;box-sizing:border-box}}body{{width:1080px;height:1350px;overflow:hidden;background:var(--bg2);font-family:SP,Georgia,serif;color:var(--parch)}}
.s{{position:relative;width:1080px;height:1350px;overflow:hidden;background:radial-gradient(110% 80% at 50% 0%,var(--glow) 0%,var(--bg1) 40%,var(--bg2) 100%)}}
.frame{{position:absolute;inset:32px;border:1.5px solid {gold};opacity:.8;z-index:5}}
.foot{{position:absolute;left:0;right:0;bottom:56px;text-align:center;font:600 34px CG;letter-spacing:.08em;color:var(--gold2);z-index:6}}
.tag{{position:absolute;left:74px;top:66px;font:italic 500 30px CG;color:var(--mute);z-index:6;text-shadow:0 1px 6px rgba(0,0,0,.7)}}
.band{{position:absolute;left:0;right:0;top:0;height:520px;background:url({IMG}) {bpos}/cover;z-index:1;-webkit-mask-image:linear-gradient(#000 {MK}%,transparent 100%)}}
.body{{position:absolute;left:84px;right:84px;top:515px;z-index:3}}
h1{{font:600 84px/1 CG;color:var(--parch)}}
.badge{{font:italic 500 38px CG;color:var(--gold2);margin-top:14px}}
.badge small{{font:400 26px SP;color:var(--mute);font-style:normal;margin-left:14px}}
.rule{{height:2px;background:var(--gold);margin:26px 0 24px;width:180px}}
p{{font-size:33px;line-height:1.4}}
.cover .img{{position:absolute;inset:0;background:url({IMG}) 50% 0%/cover}}
.cover .img:after{{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 46%,rgba(0,0,0,.55) 64%,var(--bg2) 82%)}}
.cover .ttl{{position:absolute;left:84px;right:84px;top:830px;z-index:3}}
.cover h1{{font-size:120px;line-height:.95}}.cover .ttl p{{font:italic 500 46px/1.2 CG;color:var(--gold2);margin-top:26px}}
.cta .img{{position:absolute;inset:0;background:url({IMG}) {cpos}}}
.cta .img:after{{content:"";position:absolute;inset:0;background:linear-gradient(transparent 0,transparent 400px,rgba(0,0,0,.55) 600px,var(--bg2) 860px)}}
.cta .body{{top:560px}}
.url{{font:700 78px CG;color:var(--gold2);margin-top:36px}}.free{{display:inline-block;margin-top:24px;padding:14px 30px;border:2px solid var(--gold);font-size:30px}}
"""
def pages(pt):
    NAME,SUB,S=load(pt); C=css(pt); ART='The ' if pt in ('sole','luna') else ''
    pg=lambda inner:f"<html><head><meta charset=utf-8><style>{C}</style></head><body>{inner}</body></html>"
    FR='<div class="frame"></div>'; FT='<div class="foot">astrotraderpro.com</div>'
    out=[pg(f'<div class="s cover"><div class="img"></div><div class="tag">The planets in the signs</div><div class="ttl"><h1>{ART}{NAME} in the 12 signs</h1><p>{SUB}</p></div>{FR}{FT}</div>')]
    for n,el,dig,t in S:
        out.append(pg(f'<div class="s"><div class="band"></div><div class="tag">{NAME} in the signs</div><div class="body"><h1>{NAME} in {n}</h1><div class="badge">{dig}<small>{el}</small></div><div class="rule"></div><p>{t}</p></div>{FR}{FT}</div>'))
    out.append(pg(f'<div class="s cta"><div class="img"></div><div class="body"><h1>Where is your {NAME}?</h1><p style="margin-top:22px">The sign is only the start: the house and the aspects change how it plays out. Find your {NAME}, {'Moon' if NAME=='Sun' else 'Sun'} and Ascendant in your free natal chart.</p><div class="free">The natal chart is free, no sign-up</div><div class="url">astrotraderpro.com</div></div>{FR}</div>'))
    return out
async def main(pts):
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--allow-file-access-from-files']);pg=await b.new_page(viewport={'width':1080,'height':1350})
        for pt in pts:
            out=f'{D}/out/D/{pt}/en'; os.makedirs(out,exist_ok=True)
            for i,h in enumerate(pages(pt),1):
                open(f'{out}/d{i}.html','w').write(h); await pg.goto('file://'+f'{out}/d{i}.html'); await pg.wait_for_timeout(250)
                r=await pg.evaluate("(()=>{const p=document.querySelector('p');return p?Math.round(p.getBoundingClientRect().bottom):0})()")
                if r>1230: print('TROPPO',pt,i,r)
                await pg.screenshot(path=f'{out}/d{i}.jpg',type='jpeg',quality=92)
            print(pt,'ok')
        await b.close()
asyncio.run(main(sys.argv[1:] or list(V)))
