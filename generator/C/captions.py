#!/usr/bin/env python3
"""Didascalie serie C (13 lingue) → C/captions.json {punto: {lingua: testo}}. Nomi presi da C/<lingua>.js via node."""
import json, subprocess, os
HERE=os.path.dirname(os.path.abspath(__file__))
L=['it','en','es','pt','fr','de','nl','ru','zh','ja','ko','ar','hi']
js="var CD={},CUI={};"+"".join(open(f"{HERE}/{l}.js").read() for l in L)+"console.log(JSON.stringify(Object.fromEntries(Object.entries(CD).map(([l,o])=>[l,Object.fromEntries(Object.entries(o).map(([p,v])=>[p,[v.name,v.h7]]))]))))"
open('/tmp/claude-0/-home-claude/8cec1c36-f036-5d20-ba16-cb831253af5d/scratchpad/cn.js','w').write(js); N=json.loads(subprocess.run(['node','/tmp/claude-0/-home-claude/8cec1c36-f036-5d20-ba16-cb831253af5d/scratchpad/cn.js'],capture_output=True,text=True).stdout)
T={
'it':("{n}: il ritratto in 7 schede.\nCome agisce in te, vissuto e trattenuto, forte o debole per segno, Tolomeo, Morin e Bailey, il suo ritmo nel cielo.\n\n{q} Scrivi segno e casa nei commenti.\n\nTema natale gratuito, senza registrazione → link in bio (astrotraderpro.com)","#astrologia #temanatale #oroscopo #astrologiapsicologica"),
'en':("{n}: the portrait in 7 slides.\nHow it acts in you, lived and held back, strong or weak by sign, Ptolemy, Morin and Bailey, its rhythm in the sky.\n\n{q} Write sign and house in the comments.\n\nFree natal chart, no sign-up → link in bio (astrotraderpro.com)","#astrology #natalchart #horoscope #psychologicalastrology"),
'es':("{n}: el retrato en 7 diapositivas.\nCómo actúa en ti, vivido y contenido, fuerte o débil según el signo, Ptolomeo, Morin y Bailey, su ritmo en el cielo.\n\n{q} Escribe signo y casa en los comentarios.\n\nCarta natal gratis, sin registro → enlace en la bio (astrotraderpro.com)","#astrologia #cartaastral #horoscopo #astrologiapsicologica"),
'pt':("{n}: o retrato em 7 slides.\nComo age em você, vivido e contido, forte ou fraco por signo, Ptolomeu, Morin e Bailey, o seu ritmo no céu.\n\n{q} Escreva signo e casa nos comentários.\n\nMapa natal grátis, sem cadastro → link na bio (astrotraderpro.com)","#astrologia #mapaastral #signos #astrologiapsicologica"),
'fr':("{n} : le portrait en 7 slides.\nComment cette énergie agit en toi, vécue et retenue, forte ou faible selon le signe, Ptolémée, Morin et Bailey, le rythme dans le ciel.\n\n{q} Écris signe et maison en commentaire.\n\nThème natal gratuit, sans inscription → lien en bio (astrotraderpro.com)","#astrologie #thèmeastral #horoscope #astrologiepsychologique"),
'de':("{n}: das Porträt in 7 Slides.\nWie {n} in dir wirkt, gelebt und zurückgehalten, stark oder schwach je nach Zeichen, Ptolemäus, Morin und Bailey, der Rhythmus am Himmel.\n\n{q} Schreib Zeichen und Haus in die Kommentare.\n\nKostenloses Geburtshoroskop, ohne Anmeldung → Link in der Bio (astrotraderpro.com)","#astrologie #geburtshoroskop #horoskop #psychologischeastrologie"),
'nl':("{n}: het portret in 7 slides.\nHoe {n} in jou werkt, geleefd en ingehouden, sterk of zwak per teken, Ptolemaeus, Morin en Bailey, het ritme aan de hemel.\n\n{q} Schrijf teken en huis in de reacties.\n\nGratis geboortehoroscoop, zonder registratie → link in bio (astrotraderpro.com)","#astrologie #geboortehoroscoop #horoscoop #sterrenbeelden"),
'ru':("{n}: портрет в 7 слайдах.\nКак это работает в вас: прожитое и сдержанное, сила и слабость по знакам, Птолемей, Морен и Бейли, ритм на небе.\n\n{q} Напишите знак и дом в комментариях.\n\nНатальная карта бесплатно, без регистрации → ссылка в профиле (astrotraderpro.com)","#астрология #натальнаякарта #гороскоп #психологическаяастрология"),
'zh':("{n}：7张图的肖像。\n它如何在你身上运作，活出与压抑，依星座强或弱，托勒密、莫兰与贝利，以及它在天空中的节奏。\n\n{q}在评论区写下星座和宫位吧。\n\n免费本命盘，无需注册 → 链接在主页简介（astrotraderpro.com）","#占星 #星盘 #本命盘 #心理占星"),
'ja':("{n}：7枚でたどるポートレート。\nあなたの中でどう働くか、生きられた姿と抑えられた姿、サインによる強弱、プトレマイオス・モラン・ベイリー、空でのリズム。\n\n{q}サインとハウスをコメントで教えてください。\n\n無料ネイタルチャート・登録不要 → プロフィールのリンクから（astrotraderpro.com）","#西洋占星術 #ホロスコープ #ネイタルチャート #心理占星術"),
'ko':("{n}: 7장으로 보는 초상.\n당신 안에서 어떻게 작용하는지, 살아낸 모습과 억눌린 모습, 별자리에 따른 강약, 프톨레마이오스·모랭·베일리, 하늘에서의 리듬.\n\n{q} 별자리와 하우스를 댓글로 남겨 주세요.\n\n무료 출생 차트, 가입 불필요 → 프로필 링크 (astrotraderpro.com)","#점성술 #출생차트 #별자리 #심리점성술"),
'ar':("{n}: البورتريه في ٧ شرائح.\nكيف يعمل فيك، المَعيش والمكبوت، القوة والضعف بحسب البرج، بطليموس وموران وبيلي، وإيقاعه في السماء.\n\n{q} اكتب البرج والبيت في التعليقات.\n\nخريطة فلكية مجانية بلا تسجيل ← الرابط في الملف الشخصي (astrotraderpro.com)","#علم_الفلك #الأبراج #الخريطة_الفلكية #التنجيم"),
'hi':("{n}: 7 स्लाइड में चित्र।\nयह आपमें कैसे काम करता है, जिया गया और दबा हुआ, राशि के अनुसार बलवान या दुर्बल, टॉलेमी, मोरिन और बेली, आकाश में इसकी लय।\n\n{q} कमेंट में राशि और भाव लिखें।\n\nमुफ़्त जन्म कुंडली, बिना साइन-अप → लिंक बायो में (astrotraderpro.com)","#ज्योतिष #जन्मकुंडली #राशिफल #astrology"),
}
out={}
for l in L:
    for p,(n,q) in N[l].items():
        t,h=T[l]; out.setdefault(p,{})[l]=t.format(n=n,q=q)+"\n\n"+h
json.dump(out,open(f"{HERE}/captions.json","w"),ensure_ascii=False,indent=1)
print(len(out), out['saturno']['en'])
