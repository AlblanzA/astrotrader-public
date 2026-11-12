// TEMPORANEO: cancella i vecchi caroselli "nelle 12 case" di Sole, Luna, Venere (FB pagina + Threads).
import { readFileSync } from 'node:fs';
import { tokenDiPagina } from './social.mjs';
const G = 'https://graph.facebook.com/v21.0';
const re = /K_(sole|luna|venere)-/;
const ok = (id) => id < '2026-11';
let tok = await tokenDiPagina(G, process.env.FB_PAGE_ID, process.env.FB_PAGE_TOKEN);
const fb = JSON.parse(readFileSync('fb/series-posted.json', 'utf8'));
for (const [k, v] of Object.entries(fb)) {
  if (!re.test(k) || !ok(k)) continue;
  const r = await fetch(`${G}/${v.post}?access_token=${tok}`, { method: 'DELETE' });
  console.log('FB', k, v.post, r.status, (await r.text()).slice(0, 120));
}
const th = JSON.parse(readFileSync('threads/series-posted.json', 'utf8'));
for (const [k, v] of Object.entries(th)) {
  if (!re.test(k) || !ok(k)) continue;
  const r = await fetch(`https://graph.threads.net/v1.0/${v.post}?access_token=${process.env.THREADS_ACCESS_TOKEN}`, { method: 'DELETE' });
  console.log('THREADS', k, v.post, r.status, (await r.text()).slice(0, 160));
}
