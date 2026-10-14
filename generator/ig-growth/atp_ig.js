// AstroTrader Pro — crescita Instagram (follow/unfollow), da incollare nella scheda
// https://www.instagram.com/robots.txt (stessa origine: cookie e localStorage di Instagram).
// Regole utente (7-8/10/2026): unfollow max 100/giorno (usati 50), follow 40/giorno,
// unfollow di chi non ricambia SOLO dopo 72 h dal follow. Stop al primo errore.
// Stato in localStorage: __atp_queue (unfollow), __atp_done, __atp_day, __atp_followed,
// __atp_fday, __atp_fq (candidati), __atp_seeds2/__atp_hv2 (raccolta), __atp_fbchk, __atp_log.
(() => {
const L = (k) => JSON.parse(localStorage.getItem(k) || 'null');
const S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const H = { 'X-IG-App-ID': '936619743392459', 'X-Requested-With': 'XMLHttpRequest' };
const csrf = () => (document.cookie.match(/csrftoken=([^;]+)/) || [])[1];
const me = () => (document.cookie.match(/ds_user_id=(\d+)/) || [])[1];
const today = () => new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((z) => setTimeout(z, ms));
const log = (m) => { const lg = L('__atp_log') || []; lg.push([new Date().toISOString(), m]); S('__atp_log', lg); };
const show = async (pk) => (await fetch('/api/v1/friendships/show/' + pk + '/', { headers: H, credentials: 'include' })).json();
const UNF_CAP = 50, FOL_CAP = 40, FOL_HOUR = 10;

// un unfollow dalla coda
async function unfollowOne() {
  const t = today(); const day = L('__atp_day') || {}; const n = day[t] || 0;
  if (n >= UNF_CAP) return 'QUOTA ' + n;
  const q = L('__atp_queue'); if (!q || !q.length) return 'VUOTA';
  const x = q[0]; let st = 0, tx = '';
  try {
    const r = await fetch('/api/v1/web/friendships/' + x[1] + '/unfollow/', { method: 'POST', credentials: 'include',
      headers: { ...H, 'X-CSRFToken': csrf(), 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
    st = r.status; tx = (await r.text()).slice(0, 80);
  } catch (e) { tx = String(e); }
  if (st === 200 && /"status":"ok"/.test(tx)) {
    q.shift(); S('__atp_queue', q);
    const d = L('__atp_done'); d.push([x[0], x[1], new Date().toISOString()]); S('__atp_done', d);
    day[t] = n + 1; S('__atp_day', day); return 'OK ' + (n + 1) + ' ' + x[0];
  }
  log('STOP ' + x[0] + ' ' + st + ' ' + tx.slice(0, 40)); return 'STOP ' + st + ' ' + tx.slice(0, 40);
}

// un follow dalla coda candidati
async function followOne() {
  const t = today(); const day = L('__atp_fday') || {}; const n = day[t] || 0;
  if (n >= FOL_CAP) return 'QUOTA ' + n;
  const hr = (L('__atp_followed') || []).filter((x) => Date.now() - Date.parse(x[2]) < 3600e3).length;
  if (hr >= FOL_HOUR) return 'ORA ' + hr;
  const q = L('__atp_fq'); if (!q || !q.length) return 'VUOTA';
  const x = q[0]; let st = 0, ok = false, tx = '';
  try {
    const r = await fetch('/api/v1/friendships/create/' + x[1] + '/', { method: 'POST', credentials: 'include',
      headers: { ...H, 'X-CSRFToken': csrf(), 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'container_module=profile&user_id=' + x[1] });
    st = r.status; tx = (await r.text()).slice(0, 80);
    await sleep(1500); const s = await show(x[1]); ok = !!(s.following || s.outgoing_request);
  } catch (e) { tx = String(e); }
  if (st === 200 && ok) {
    q.shift(); S('__atp_fq', q);
    const f = L('__atp_followed') || []; f.push([x[0], x[1], new Date().toISOString(), x[2]]); S('__atp_followed', f);
    day[t] = n + 1; S('__atp_fday', day); return 'OK ' + (n + 1) + ' ' + x[0];
  }
  log('FSTOP ' + x[0] + ' ' + st + ' ' + tx.slice(0, 40)); return 'STOP ' + st + (ok ? '' : ' non seguito');
}

// cicli
async function unfollowLoop(target) {
  window.__ustop = false; let k = 0;
  const d = L('__atp_done'); const last = d.length ? Date.parse(d[d.length - 1][2]) : 0;
  await sleep(Math.max(0, last + 65000 - Date.now()));
  while (k < target && !window.__ustop) {
    const r = await unfollowOne(); window.__ulast = new Date().toISOString().slice(11, 19) + ' ' + r;
    if (!r.startsWith('OK')) break; k++; await sleep(60000 + Math.random() * 30000);
  }
}
async function followLoop(target) {
  window.__fstop = false; let k = 0;
  while (k < target && !window.__fstop) {
    const r = await followOne(); window.__flast = new Date().toISOString().slice(11, 19) + ' ' + r;
    if (r.startsWith('ORA')) { await sleep(10 * 60000); continue; }
    if (r.startsWith('VUOTA')) { await sleep(5 * 60000); continue; }
    if (!r.startsWith('OK')) break; k++; await sleep(360000 + Math.random() * 90000);
  }
}

// raccolta: ricerca «astro» nella lista follower di ogni account seguito (come la barra di ricerca dell'app)
async function harvest(maxReq) {
  window.__hvstop = false;
  if (!L('__atp_seeds2')) {
    const seen = new Set(), seeds = [];
    for (const x of L('__atp_following').out) { const k = String(x[1]); if (!seen.has(k)) { seen.add(k); seeds.push([x[0], k]); } }
    S('__atp_seeds2', seeds); S('__atp_hv2', 0);
  }
  const seeds = L('__atp_seeds2'); let i = L('__atp_hv2') || 0, n = 0;
  const base = () => new Set([me(), ...L('__atp_following').out.map((x) => String(x[1])), ...L('__atp_done').map((x) => String(x[1])),
    ...(L('__atp_fq') || []).map((x) => String(x[1])), ...(L('__atp_followed') || []).map((x) => String(x[1]))]);
  while (i < seeds.length && n < maxReq && !window.__hvstop) {
    const s = seeds[i]; let r;
    try { r = await fetch('/api/v1/friendships/' + s[1] + '/followers/?count=50&query=astro&search_surface=follow_list_page', { headers: H, credentials: 'include' }); }
    catch (e) { window.__hvlast = 'ERR ' + e; break; }
    if (r.status === 200) {
      const j = await r.json(); const skip = base(); const add = [];
      for (const u of j.users || []) {
        const k = String(u.pk);
        if (skip.has(k) || u.is_verified || u.has_anonymous_profile_picture) continue;
        skip.add(k); add.push([u.username, k, s[0], u.is_private ? 1 : 0]);
      }
      const q = L('__atp_fq') || []; S('__atp_fq', q.concat(add));
      window.__hvlast = 'ok ' + (i + 1) + '/' + seeds.length + ' q=' + (q.length + add.length);
    } else if (r.status === 429) { window.__hvlast = 'HTTP 429 a ' + s[0]; log('HV 429 ' + s[0]); break; }
    else { window.__hvlast = 'salto ' + s[0] + ' ' + r.status; }
    i++; n++; S('__atp_hv2', i); await sleep(6000 + Math.random() * 5000);
  }
  return window.__hvlast;
}

// regola 72 h: chi non ricambia dopo 3 giorni va in testa alla coda unfollow
async function followBackCheck(maxChecks) {
  const f = L('__atp_followed') || []; const chk = L('__atp_fbchk') || {}; let n = 0, back = 0, no = 0;
  for (const x of f) {
    if (n >= maxChecks) break; if (chk[x[1]]) continue;
    if (Date.now() - Date.parse(x[2]) < 72 * 3600e3) continue;
    const s = await show(x[1]); n++;
    if (s.followed_by) { chk[x[1]] = 'ricambia'; back++; }
    else if (s.following || s.outgoing_request) { chk[x[1]] = 'in_coda_unfollow'; no++; const q = L('__atp_queue'); q.unshift([x[0], x[1], 0]); S('__atp_queue', q); }
    else chk[x[1]] = 'gia_tolto';
    S('__atp_fbchk', chk); await sleep(3000 + Math.random() * 3000);
  }
  return 'controllati ' + n + ', ricambiano ' + back + ', da togliere ' + no;
}

function stato() {
  const t = today();
  return { unfollowOggi: (L('__atp_day') || {})[t] || 0, followOggi: (L('__atp_fday') || {})[t] || 0,
    codaUnfollow: (L('__atp_queue') || []).length, candidati: (L('__atp_fq') || []).length,
    raccolta: (L('__atp_hv2') || 0) + '/' + (L('__atp_seeds2') || []).length,
    ultimi: { u: window.__ulast, f: window.__flast, hv: window.__hvlast }, log: (L('__atp_log') || []).slice(-2) };
}
window.ATP = { unfollowOne, followOne, unfollowLoop, followLoop, harvest, followBackCheck, stato };
return 'ATP pronto';
})();
