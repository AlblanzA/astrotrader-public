// AstroTrader Pro — cronometro dei blocchi Instagram e ripartenza automatica (dal 14/10/2026).
// Richiesta utente: misurare quanto dura ogni blocco e ripartire appena finisce.
// Registro: localStorage.__atp_blocks = [{tipo, inizio, fine, ore}] (blocco aperto: fine=null).
// Prova ogni 60 min con UNA sola azione; a quota del giorno raggiunta aspetta la mezzanotte UTC.
//  - scheda U (robots.txt, ATP caricato):  window.__uw = window.__unfWatch()
//  - scheda F (instagram.com, follow_loop.js incollato):  window.__fw = window.__folWatch()
// Una sola istanza per tipo (window.__wgen_<tipo>); stop: window.__wstop = true.
(() => {
const L = (k) => JSON.parse(localStorage.getItem(k) || 'null'), S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));
const today = () => new Date().toISOString().slice(0, 10);
const toMidnight = () => { const d = new Date(); d.setUTCHours(24, 5 + Math.floor(Math.random() * 20), 0, 0); return d - Date.now(); };
const HOUR = 60 * 60e3;
function apri(tipo, quando) {
  const b = L('__atp_blocks') || [];
  if (!b.some((x) => x.tipo === tipo && !x.fine)) { b.push({ tipo, inizio: quando || new Date().toISOString(), fine: null, ore: null }); S('__atp_blocks', b); }
}
function chiudi(tipo) {
  const b = L('__atp_blocks') || []; const x = b.find((y) => y.tipo === tipo && !y.fine); if (!x) return null;
  x.fine = new Date().toISOString(); x.ore = Math.round((Date.parse(x.fine) - Date.parse(x.inizio)) / 36e5 * 10) / 10; S('__atp_blocks', b); return x.ore;
}
const aperto = (tipo) => (L('__atp_blocks') || []).some((x) => x.tipo === tipo && !x.fine);
const wl = (m) => { window.__wlast = new Date().toISOString().slice(11, 19) + ' ' + m; const lg = L('__atp_wlog') || []; lg.push(window.__wlast); S('__atp_wlog', lg.slice(-200)); };

window.__unfWatch = async function () {
  const gen = (window.__wgen_unf = (window.__wgen_unf || 0) + 1);
  while (!window.__wstop && window.__wgen_unf === gen) {
    if ((L('__atp_fq') || []).length < 150 && window.ATP && ATP.harvest) { try { await ATP.harvest(40); } catch (e) {} }
    const r = await ATP.unfollowOne();
    if (r.startsWith('QUOTA')) { wl('unfollow: quota del giorno, attendo mezzanotte UTC'); await sleep(toMidnight()); continue; }
    if (r.startsWith('VUOTA')) { wl('unfollow: coda vuota'); await sleep(6 * HOUR); continue; }
    if (!r.startsWith('OK')) { apri('unfollow'); wl('unfollow ancora bloccato (' + r.slice(0, 20) + ')'); await sleep(HOUR); continue; }
    const ore = chiudi('unfollow'); if (ore != null) wl('unfollow SBLOCCATO dopo ' + ore + ' h');
    await sleep(90e3 + Math.random() * 60e3);
    await ATP.unfollowLoop(100);                       // si ferma da solo a quota (UNF_CAP) o al primo errore
    const u = window.__ulast || '';
    if (/STOP/.test(u)) { apri('unfollow'); wl('unfollow BLOCCATO: ' + u.slice(0, 40)); await sleep(HOUR); }
  }
};

window.__folWatch = async function () {
  // 16/10 l'utente ha rinunciato ai follow automatici: nessun follow dal bot
  window.__wgen_fol = (window.__wgen_fol || 0) + 1; return 'follow disattivato';
  const gen = (window.__wgen_fol = (window.__wgen_fol || 0) + 1);
  while (!window.__wstop && window.__wgen_fol === gen) {
    if (((L('__atp_fday') || {})[today()] || 0) >= 50) { wl('follow: quota del giorno, attendo mezzanotte UTC'); await sleep(toMidnight()); continue; }
    window.__onFollowOk = () => { if (aperto('follow')) { const ore = chiudi('follow'); if (ore != null) wl('follow SBLOCCATO dopo ' + ore + ' h'); } };
    await window.__ffollow(48, 1);                    // 1 sola prova: se fallisce si ferma subito
    const f = window.__flast || '';
    if (/QUOTA/.test(f)) { continue; }
    if (/CODA VUOTA/.test(f)) { wl('follow: coda candidati vuota'); await sleep(6 * HOUR); continue; }
    if (/STOP|NON SEGUITO/.test(f)) {
      // se nel giro ci sono stati follow riusciti il blocco è nuovo; altrimenti continua quello aperto
      apri('follow'); wl('follow bloccato (' + f.slice(9, 50) + ')'); await sleep(HOUR); continue;
    }
    await sleep(10 * 60e3);                            // qualsiasi altro esito: niente giri a vuoto
  }
};
return 'watchdog pronto';
})();
