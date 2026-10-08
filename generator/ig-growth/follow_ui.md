# Follow dal pulsante (metodo funzionante dall'8/10/2026)
Gli endpoint /api/v1/friendships/create e /web/friendships/<pk>/follow NON funzionano (rispondono 200/404 ma il follow non avviene);
il pulsante «Segui» usa una mutation GraphQL. Si preme quindi il pulsante vero, un profilo per volta, nella scheda Instagram del gruppo.
Ogni follow = un browser_batch con due javascript_tool sulla stessa scheda, poi pausa 6-7 minuti (max 10/ora, 40/giorno).

## Passo A (va al profilo del prossimo candidato)
const L=k=>JSON.parse(localStorage.getItem(k)||'null'),S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)); const done=new Set((L('__atp_followed')||[]).map(x=>x[1])); let q=L('__atp_fq').filter(x=>!done.has(x[1])); S('__atp_fq',q); const t=new Date().toISOString().slice(0,10); if(((L('__atp_fday')||{})[t]||0)>=40){'QUOTA'} else { const x=q[0]; localStorage.__atp_cur=JSON.stringify(x); location.href='/'+x[0]+'/'; 'vado' }

## Passo B (preme Segui, verifica con friendships/show, registra)
const L=k=>JSON.parse(localStorage.getItem(k)||'null'),S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)); const x=L('__atp_cur'); const btns=()=>[...document.querySelectorAll('button, div[role=button]')]; let b; for(let i=0;i<15;i++){await new Promise(z=>setTimeout(z,1000)); b=btns().find(e=>e.innerText.trim()==='Segui'); if(b||btns().some(e=>/Segui gi|Richiest/.test(e.innerText)))break;} let res='nessun pulsante'; if(b){b.click(); await new Promise(z=>setTimeout(z,3000)); const H={'X-IG-App-ID':'936619743392459','X-Requested-With':'XMLHttpRequest'}; const s=await (await fetch('/api/v1/friendships/show/'+x[1]+'/',{headers:H,credentials:'include'})).json(); if(s.following||s.outgoing_request){const f=L('__atp_followed')||[]; f.push([x[0],x[1],new Date().toISOString(),x[2]]); S('__atp_followed',f); const t=new Date().toISOString().slice(0,10); const d=L('__atp_fday')||{}; d[t]=(d[t]||0)+1; S('__atp_fday',d); S('__atp_fq',L('__atp_fq').filter(y=>y[1]!==x[1])); res='OK '+d[t]+(s.outgoing_request?' (richiesta)':'');} else res='non seguito';} else { S('__atp_fq',L('__atp_fq').filter(y=>y[1]!==x[1])); } [location.pathname, res]

Se «non seguito» due volte di fila → blocco: stop follow per oggi.
