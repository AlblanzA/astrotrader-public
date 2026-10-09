/* fb-strip-disclaimer.mjs — una tantum (9/10/2026, richiesta utente):
 * toglie dai post Facebook GIÀ pubblicati delle serie la riga
 * «Contenuto educativo. Non è consulenza finanziaria.» (in tutte le lingue).
 * Legge gli id da fb/series-posted.json, legge il testo attuale e lo riscrive
 * senza quella riga. ATP_DRY_RUN=1 → mostra soltanto cosa cambierebbe.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRY, REPO_DIR, post, tokenDiPagina, senzaAvvertenza, annota } from './social.mjs';

const GRAPH = 'https://graph.facebook.com/v21.0';
const PAGE = process.env.FB_PAGE_ID;
let TOKEN = process.env.FB_PAGE_TOKEN;
if (!PAGE || !TOKEN) { console.log('FB_PAGE_ID / FB_PAGE_TOKEN mancanti'); process.exit(1); }

const stato = JSON.parse(readFileSync(join(REPO_DIR, 'fb', 'series-posted.json'), 'utf8'));
TOKEN = await tokenDiPagina(GRAPH, PAGE, TOKEN);
let cambiati = 0, errori = 0;
for (const [id, v] of Object.entries(stato)) {
  try {
    const r = await fetch(`${GRAPH}/${v.post}?fields=message&access_token=${encodeURIComponent(TOKEN)}`);
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    const prima = j.message || '';
    const dopo = senzaAvvertenza(prima);
    if (dopo === prima.trim() || dopo === prima) { console.log(`= ${id}: già senza avvertenza`); continue; }
    console.log(`~ ${id}: tolta la riga «${prima.split('\n').find((l) => !dopo.includes(l)) || '?'}»`);
    await post(GRAPH, `/${v.post}`, { message: dopo, access_token: TOKEN });
    cambiati++;
  } catch (e) { errori++; annota(`${id}: ${String(e && e.message || e)}`); }
}
console.log(`${DRY ? '(a secco) ' : ''}post modificati: ${cambiati}, errori: ${errori}`);
if (errori) process.exitCode = 1;
