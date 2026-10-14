// AstroTrader Pro — follow automatico in pagina (dal 14/10/2026). Da eseguire con javascript_tool
// in una scheda su https://www.instagram.com/ (qualsiasi pagina). Non ricarica la pagina: naviga
// come l'app (history.pushState + popstate), preme il «Segui» dell'header del profilo, verifica con
// friendships/show e registra in __atp_followed / __atp_fday. Pausa 3-5 min (blocco IG il 14/10 dopo 16 follow in 35 min con unfollow in parallelo), max 50/giorno (UTC),
// (una sola istanza attiva: ogni avvio incrementa window.__fgen e ferma la precedente)
// salta chi non ha «astro» in username/nome/bio, si ferma dopo 2 «non seguito» di fila (blocco IG).
// Avvio: incolla questo file, poi  window.__fl = window.__ffollow(48)   (maxFails=1 per una prova dopo un blocco)
// Stato: window.__flast, localStorage.__atp_flog. Stop: window.__fhalt = true
window.__ffollow = async function (target, maxFails = 2) {
  const L = (k) => JSON.parse(localStorage.getItem(k) || 'null'), S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const sleep = (ms) => new Promise((z) => setTimeout(z, ms));
  const H = { 'X-IG-App-ID': '936619743392459', 'X-Requested-With': 'XMLHttpRequest' };
  const CAP = 50; let k = 0, fails = 0; const gen = (window.__fgen = (window.__fgen || 0) + 1); 
  const st = (m) => { window.__flast = new Date().toISOString().slice(11, 19) + ' ' + m; const lg = L('__atp_flog') || []; lg.push(window.__flast); S('__atp_flog', lg.slice(-200)); };
  while (k < target && !window.__fhalt && window.__fgen === gen) {
    const t = new Date().toISOString().slice(0, 10); const n = (L('__atp_fday') || {})[t] || 0;
    if (n >= CAP) { st('QUOTA ' + n); break; }
    const done = new Set((L('__atp_followed') || []).map((x) => x[1])); const q = (L('__atp_fq') || []).filter((x) => !done.has(x[1])); S('__atp_fq', q);
    if (!q.length) { st('CODA VUOTA'); break; }
    const x = q[0]; S('__atp_cur', x);
    history.pushState({}, '', '/' + x[0] + '/'); dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    let b = null, hdr = '', ok = false;
    // poche attese lunghe: a scheda nascosta Chrome raggruppa i timer al minuto
    await sleep(6000);
    for (let i = 0; i < 4; i++) {
      if (i) await sleep(5000);
      if (!location.pathname.startsWith('/' + x[0] + '/')) continue;
      const h = document.querySelector('header'); if (!h) continue; hdr = h.innerText;
      const bs = [...h.querySelectorAll('button, div[role=button]')];
      b = bs.find((e) => /^(Segui|Follow|Segui anche tu|Follow back)$/.test(e.innerText.trim()));
      if (b || bs.some((e) => /Segui gi|Richiest|Following|Requested/.test(e.innerText))) { ok = true; break; }
    }
    const drop = () => S('__atp_fq', (L('__atp_fq') || []).filter((y) => y[1] !== x[1]));
    if (!/astro/i.test(x[0] + ' ' + document.title + ' ' + hdr)) { drop(); st('salto (niente astro) ' + x[0]); await sleep(4000); continue; }
    if (!b) { drop(); st((ok ? 'già seguito ' : 'nessun pulsante ') + x[0]); await sleep(4000); continue; }
    b.click(); await sleep(3500);
    const s = await (await fetch('/api/v1/friendships/show/' + x[1] + '/', { headers: H, credentials: 'include' })).json();
    if (s.following || s.outgoing_request) {
      const f = L('__atp_followed') || []; f.push([x[0], x[1], new Date().toISOString(), x[2]]); S('__atp_followed', f);
      const d = L('__atp_fday') || {}; d[t] = (d[t] || 0) + 1; S('__atp_fday', d); drop(); k++; fails = 0;
      st('OK ' + d[t] + ' ' + x[0] + (s.outgoing_request ? ' (richiesta)' : '')); if (window.__onFollowOk) window.__onFollowOk();
    } else { fails++; drop(); st('NON SEGUITO ' + x[0] + ' (' + fails + ')'); if (fails >= maxFails) { st('STOP: probabile blocco follow'); break; } }
    await sleep(180000 + Math.random() * 120000);
  }
  return window.__flast;
};
'__ffollow pronto';
