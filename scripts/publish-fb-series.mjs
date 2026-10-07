/* ===================================================================== *
 *  publish-fb-series.mjs — Facebook: le serie «pianeti» sulla pagina
 * ===================================================================== *
 *
 * Stesso calendario di Instagram (/social/ig/series.json sugli asset del
 * Worker), stesse immagini, ma sulla PAGINA Facebook e solo nelle lingue di
 * ATP_FB_SERIES_LANGS (default "en"). Si aggiunge al post quotidiano, non lo
 * tocca. Le voci «solo storie» (in evidenza Instagram) non esistono su FB.
 *
 * Post a più immagini come in publish-fb.mjs: ogni foto caricata con
 * published=false, poi un solo /feed con attached_media. Una sola immagine →
 * /photos pubblicata direttamente.
 *
 * Il link nel testo su Facebook è cliccabile: «link in bio (astrotraderpro.com)»
 * diventa l'indirizzo vero.
 *
 * Una voce per giro, la più vecchia maturata entro ATP_FB_WINDOW_H ore
 * (default 18). Stato in fb/series-posted.json, committato dal workflow.
 *
 * Secret (li crea l'utente): FB_PAGE_ID, FB_PAGE_TOKEN (token di PAGINA con
 * pages_manage_posts + pages_read_engagement). Se mancano, il passo si salta
 * senza errore: Facebook è facoltativo finché i secret non ci sono.
 *
 * Prova senza pubblicare:
 *   ATP_DRY_RUN=1 ATP_NOW=2026-10-01T17:05:00Z node scripts/publish-fb-series.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { DRY, REPO_DIR, annota, muori, esigiLessico, post, tokenDiPagina } from './social.mjs';

const GRAPH = 'https://graph.facebook.com/v21.0';
const PAGE = process.env.FB_PAGE_ID;
let TOKEN = process.env.FB_PAGE_TOKEN;
const MANIFEST_URL = process.env.ATP_SERIES_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/ig/series.json';
const STATE = join(REPO_DIR, 'fb', 'series-posted.json');
const WINDOW_H = Number(process.env.ATP_FB_WINDOW_H || 18);
const LANGS = String(process.env.ATP_FB_SERIES_LANGS || 'en').split(',').map((s) => s.trim()).filter(Boolean);
const NOW = process.env.ATP_NOW ? Date.parse(process.env.ATP_NOW) : Date.now();
const SITE = 'https://astrotraderpro.com';

if (!DRY && (!PAGE || !TOKEN)) {
  console.log('FB_PAGE_ID / FB_PAGE_TOKEN non impostati: serie Facebook saltate.');
  process.exit(0);
}

function testoFacebook(caption) {
  return String(caption)
    .replace(/link in bio\s*\(astrotraderpro\.com\)/gi, SITE)
    .replace(/link in bio/gi, SITE);
}

function leggiStato() {
  if (!existsSync(STATE)) return {};
  try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch (_) { return {}; }
}

async function main() {
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) muori(`manifesto ${MANIFEST_URL} → HTTP ${r.status}`);
  const m = await r.json();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const stato = leggiStato();
  const voci = (m.posts || []).filter((p) => !p.storiesOnly && LANGS.includes(p.lang) && !stato[p.id]);
  const maturi = voci
    .filter((p) => Date.parse(p.at) <= NOW && NOW - Date.parse(p.at) <= WINDOW_H * 3600e3)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!maturi.length) {
    const next = voci.filter((p) => Date.parse(p.at) > NOW).sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
    console.log(`Nessuna serie Facebook adesso. Prossima: ${next ? next.id + ' alle ' + next.at : 'nessuna'}`);
    return;
  }
  const p = maturi[0];
  const testo = testoFacebook(p.caption || '');
  esigiLessico(testo, p.id);
  const urls = p.images.map((x) => (/^https?:\/\//.test(x) ? x : base + x));
  console.log(`FACEBOOK — ${p.id} (${p.lang}), ${urls.length} immagini`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  if (DRY) {
    console.log('  testo:\n' + testo.split('\n').map((l) => '    ' + l).join('\n'));
    console.log('  (a secco: niente chiamate a Facebook)');
    return;
  }
  TOKEN = await tokenDiPagina(GRAPH, PAGE, TOKEN);
  let postId;
  if (urls.length === 1) {
    const j = await post(GRAPH, `/${PAGE}/photos`, { url: urls[0], message: testo, access_token: TOKEN });
    postId = j.post_id || j.id;
  } else {
    const ids = [];
    for (let i = 0; i < urls.length; i++) {
      const j = await post(GRAPH, `/${PAGE}/photos`, { url: urls[i], published: 'false', access_token: TOKEN });
      ids.push(j.id);
      console.log(`  foto ${i + 1}/${urls.length} caricata`);
    }
    const j = await post(GRAPH, `/${PAGE}/feed`, {
      message: testo,
      attached_media: JSON.stringify(ids.map((id) => ({ media_fbid: id }))),
      access_token: TOKEN,
    });
    postId = j.id || j.post_id;
  }
  console.log(`  pubblicato: ${postId}`);
  stato[p.id] = { post: postId, at: new Date().toISOString() };
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
}

main().catch((e) => { annota(`Facebook serie: ${String(e && e.message || e)}`); process.exit(1); });
