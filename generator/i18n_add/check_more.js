const fs=require('fs'),vm=require('vm'),path=require('path');
const L=process.argv[2]; const D=path.join(__dirname,'..');
const ctx={}; vm.createContext(ctx);
for(const f of ['serieB_i18n.js','sole_i18n.js','luna_case_i18n.js','mercurio_case_i18n.js','venere_case_i18n.js','case_i18n.js'])
  vm.runInContext(fs.readFileSync(path.join(D,f),'utf8').replace(/^const (\w+)\s*=/gm,'var $1 ='),ctx,{filename:f});
vm.runInContext(fs.readFileSync(path.join(D,'serieB_more.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(D,'case_more.js'),'utf8'),ctx);
if(L!=='hi') vm.runInContext(fs.readFileSync(path.join(__dirname,L+'.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,L+'_more.js'),'utf8'),ctx,{filename:L+'_more.js'});
const bad=[]; const P=['marte','giove','saturno','urano','nettuno','plutone'];
for(const p of P){const a=ctx.SB[p][L]; if(!a||a.length!==12){bad.push(`SB.${p}.${L}: 12 case`);continue;}
  a.forEach((h,i)=>{ if(!Array.isArray(h)||h.length!==2||!Array.isArray(h[0])||h[0].length!==5||typeof h[1]!=='string') bad.push(`SB.${p}.${L}[${i}] forma`);});
  const U=ctx.SB_UI[L]; if(!U.tpl[p]||!U.tpl[p].includes('{n}')) bad.push('tpl.'+p); if(!U.cta[p]) bad.push('cta.'+p);}
for(const v of ['TG','TSA','TU','TN','TP']){const en=ctx[v].en,t=ctx[v][L]; if(!t){bad.push(v+'.'+L+' mancante');continue;}
  for(const k of Object.keys(en)) if(!(k in t)) bad.push(`${v}.${L}.${k}`);
  if(!t.rows||t.rows.length!==12) bad.push(v+' rows'); if(!t.ang||t.ang.length!==4) bad.push(v+' ang');}
const txt=JSON.stringify([P.map(p=>ctx.SB[p][L]),['TG','TSA','TU','TN','TP'].map(v=>ctx[v][L])]);
const vietate={es:/\b(nosotros|nuestr[oa]s?|vamos|somos)\b/i,pt:/\b(nós|nosso|nossa|vamos|somos)\b/i,fr:/\b(nous|notre|nos)\b/i,ru:/(^|[^а-яё])(мы|наш[аеиу]?|нам|нас)([^а-яё]|$)/i,zh:/我们/,ja:/私たち|我々/,hi:/हम |हमारा|हमारी|हमें/};
if(vietate[L]&&vietate[L].test(txt)) bad.push('prima persona plurale: '+txt.match(vietate[L])[0]);
if(/trad(e|ing)|bors|marché|mercad|рынок|交易|トレード|invest/i.test(txt)) bad.push('lessico trading');
if(/\b(Zeus|Ares|Hades|Kronos|Cronos|Poseidon|Ouranos|Afrodite|Aphrodite|Hermes|Ermes|Apollo|Ade)\b/i.test(txt)) bad.push('nome di divinità');
const C=path.join(__dirname,L+'_captions_more.json'); if(!fs.existsSync(C)) bad.push('captions_more mancante'); else {const c=JSON.parse(fs.readFileSync(C,'utf8')); for(const p of P) if(!c[p]||c[p].length<80) bad.push('caption '+p);}
console.log(bad.length?'ERRORI:\n'+bad.join('\n'):'OK '+L); process.exit(bad.length?1:0);
