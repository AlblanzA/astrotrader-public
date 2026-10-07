import json,sys,re
L=sys.argv[1]
en_r=json.load(open('retro_en.json')); en_a=json.load(open('aspects_en.json'))
r=json.load(open(f'retro_{L}.json',encoding='utf-8')); a=json.load(open(f'aspects_{L}.json',encoding='utf-8')); u=json.load(open(f'ui_{L}.json',encoding='utf-8'))
bad=[]
for k,v in en_r.items():
    t=r.get(k); 
    if not t: bad.append('retro '+k); continue
    for f in v:
        if f not in t: bad.append(f'retro {k}.{f}')
    if len(t.get('rows',[]))!=8 or any(x.get('p')!=y['p'] for x,y in zip(t['rows'],v['rows'])): bad.append(f'retro {k} rows/p')
    if not 4<=len(t.get('story',[]))<=6: bad.append(f'retro {k} story')
for k,v in en_a.items():
    t=a.get(k)
    if not t: bad.append('asp '+k); continue
    for f in v:
        if f not in t: bad.append(f'asp {k}.{f}')
    if len(t.get('rows',[]))!=6: bad.append(f'asp {k} rows')
if 'free' not in u: bad.append('ui.free')
txt=json.dumps([r,a],ensure_ascii=False)
pl={'es':r'\b(nosotros|nuestr[oa]s?)\b','pt':r'\b(nós|nosso|nossa)\b','fr':r'\b(nous|notre|nos)\b','ru':r'(?<![а-яё])(мы|наш[аеиу]?|нам|нас)(?![а-яё])','zh':'我们','ja':'私たち|我々','hi':r'हम |हमारा|हमें'}
if L in pl and re.search(pl[L],txt,re.I): bad.append('prima persona plurale: '+re.search(pl[L],txt,re.I).group(0))
if re.search(r'trading|invest|mercad|marché|рынок|交易|トレード',txt,re.I): bad.append('lessico trading')
print('ERRORI\n'+'\n'.join(bad) if bad else 'OK '+L); sys.exit(1 if bad else 0)
