"""Conversione zh semplificato -> tradizionale (Taiwan, con lessico locale) sul DOM renderizzato. Uso: HANT=1 python3 render_*.py --langs zh ..."""
import os, re
import opencc
CC = opencc.OpenCC('s2twp')
HANT = os.environ.get('HANT') == '1'
def is_zh(url): return bool(re.search(r'(#|-|=)zh$', url))
async def hant(pg):
    texts = await pg.evaluate("""()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);window.__tn=[];let n;
      while(n=w.nextNode()){ if(/[\\u3400-\\u9fff]/.test(n.nodeValue)&&!n.parentElement.closest('script,style')) window.__tn.push(n);}
      document.documentElement.lang='zh-TW'; return window.__tn.map(n=>n.nodeValue);}""")
    conv = [CC.convert(t) for t in texts]
    await pg.evaluate("(c)=>{c.forEach((s,i)=>{window.__tn[i].nodeValue=s});}", conv)
    await pg.evaluate('document.fonts.ready'); await pg.wait_for_timeout(200)
    await pg.evaluate('window.fit&&window.fit()'); await pg.wait_for_timeout(120)
