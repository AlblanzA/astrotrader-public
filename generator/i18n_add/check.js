// Uso: node check.js <lang>  — carica i dati esistenti + i18n_add/<lang>.js e verifica forma e regole.
const fs=require('fs'),vm=require('vm'),path=require('path');
const L=process.argv[2]; const D=path.join(__dirname,'..');
const ctx={}; vm.createContext(ctx);
for(const f of ['serieB_i18n.js','sole_i18n.js','luna_case_i18n.js','mercurio_case_i18n.js','venere_case_i18n.js','case_i18n.js'])
  vm.runInContext(fs.readFileSync(path.join(D,f),'utf8').replace(/^const (\w+)\s*=/gm,'var $1 ='),ctx,{filename:f});
vm.runInContext(fs.readFileSync(path.join(__dirname,L+'.js'),'utf8'),ctx,{filename:L+'.js'});
const bad=[]; const P=['sole','luna','mercurio','venere'];
for(const p of P){const a=ctx.SB[p][L]; if(!a||a.length!==12){bad.push(`SB.${p}.${L}: servono 12 case`);continue;}
  a.forEach((h,i)=>{ if(!Array.isArray(h)||h.length!==2||!Array.isArray(h[0])||h[0].length!==5||typeof h[1]!=='string') bad.push(`SB.${p}.${L}[${i}] forma errata: [[5 frasi], 'sintesi']`);});}
const U=ctx.SB_UI[L]; if(!U) bad.push('SB_UI.'+L+' mancante'); else {
  if(!U.ord||U.ord.length!==12) bad.push('SB_UI.ord: 12 voci');
  for(const p of P){ if(!U.tpl||!U.tpl[p]||!U.tpl[p].includes('{n}')) bad.push('SB_UI.tpl.'+p+' con {n}'); if(!U.cta||!U.cta[p]) bad.push('SB_UI.cta.'+p);}
  for(const k of ['lead','gutL']) if(!U[k]) bad.push('SB_UI.'+k);}
const A={sole:'TS',luna:'TM',mercurio:'TME',venere:'TV'};
for(const [p,v] of Object.entries(A)){const en=ctx[v].en,t=ctx[v][L]; if(!t){bad.push(v+'.'+L+' mancante');continue;}
  for(const k of Object.keys(en)) if(!(k in t)) bad.push(`${v}.${L}.${k} mancante`);
  if(!t.rows||t.rows.length!==12||t.rows.some(r=>r.length!==2)) bad.push(v+'.'+L+'.rows: 12 coppie [area, lettura]');
  if(!t.ang||t.ang.length!==4) bad.push(v+'.'+L+'.ang: 4 voci');
  if(!t.signs||t.signs.length!==12) bad.push(v+'.'+L+'.signs: 12');}
// regole: niente prima persona plurale, niente trading
const txt=JSON.stringify([P.map(p=>ctx.SB[p][L]),U,Object.values(A).map(v=>ctx[v][L])]);
const vietate={es:/\b(nosotros|nuestr[oa]s?|vamos|somos)\b/i,pt:/\b(nós|nosso|nossa|vamos|somos)\b/i,fr:/\b(nous|notre|nos)\b/i,ru:/(^|[^а-яё])(мы|наш[аеиу]?|нам|нас)([^а-яё]|$)/i,zh:/我们/,ja:/私たち|我々/};
if(vietate[L]&&vietate[L].test(txt)) bad.push('prima persona plurale trovata: '+txt.match(vietate[L])[0]);
if(/trad(e|ing)|bors|marché|mercad|рынок|交易|トレード|invest/i.test(txt)) bad.push('lessico trading/mercati trovato');
const C=path.join(__dirname,L+'_captions.json'); if(!fs.existsSync(C)) bad.push(L+'_captions.json mancante'); else {
  const c=JSON.parse(fs.readFileSync(C,'utf8')); for(const p of P) if(!c[p]||c[p].length<80) bad.push('caption '+p);}
console.log(bad.length?'ERRORI:\n'+bad.join('\n'):'OK '+L);
process.exit(bad.length?1:0);
