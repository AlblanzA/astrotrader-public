/* ===================================================================== *
 *  publish-series.mjs — Instagram: le serie «pianeti» (A, B, L)
 * ===================================================================== *
 *
 * Si AGGIUNGE al carosello quotidiano (publish.mjs), non lo sostituisce.
 *
 * Da dove arriva il lavoro. Il calendario sta in un manifesto servito dal
 * Worker (asset statici): /social/ig/series.json. Ogni voce ha
 *   id, at (UTC), lang, series, images[] (percorsi relativi a `base`),
 *   caption, story (true = ripubblica la copertina anche come storia).
 * Le immagini sono JPEG 1080x1350 (4:5): l'API rifiuta il 3:4.
 *
 * Quando pubblica. Il workflow gira ogni mezz'ora. Si pubblica UNA voce per
 * giro: la più vecchia fra quelle «maturate» (at <= adesso) e non ancora
 * pubblicate, purché non più vecchia di ATP_SERIES_WINDOW_H ore (default 18: i cron di GitHub arrivano con ore di ritardo):
 * se GitHub resta fermo mezza giornata, un post delle 19 non esce alle 7 del
 * mattino dopo.
 *
 * Dove ricorda. `ig/series-posted.json` nel repository: id → id Instagram.
 * Il workflow lo committa dopo ogni pubblicazione riuscita.
 *
 * Lingue. ATP_SERIES_LANGS (default "en,hi") dice quali lingue escono su
 * questo account. Per spostare l'hindi su un account suo basta toglierlo da
 * qui e dare a quell'account i suoi secret.
 *
 * Il «repost automatico». Dopo il post nel feed la copertina esce anche come
 * storia (l'API non permette di condividere il post stesso nella storia).
 *
 * Voci speciali: `storiesOnly: true` (solo storie, per le «in evidenza»),
 * `windowH` (finestra in ore per quella voce, al posto di ATP_SERIES_WINDOW_H).
 *
 * Prova senza pubblicare:  ATP_DRY_RUN=1 ATP_NOW=2026-10-01T17:05:00Z node scripts/publish-series.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  DRY, IG_MAX_CAROUSEL, REPO_DIR, annota, muori, esigiLessico,
  post, attendiPronto, quotaResidua,
} from './social.mjs';

const GRAPH = 'https://graph.instagram.com/v21.0';
const USER = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;
const MANIFEST_URL = process.env.ATP_SERIES_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/ig/series.json';
const STATE = join(REPO_DIR, 'ig', 'series-posted.json');
const WINDOW_H = Number(process.env.ATP_SERIES_WINDOW_H || 18);
const LANGS = String(process.env.ATP_SERIES_LANGS || 'en,hi').split(',').map((s) => s.trim()).filter(Boolean);
const NOW = process.env.ATP_NOW ? Date.parse(process.env.ATP_NOW) : Date.now();

if (!DRY && (!USER || !TOKEN)) muori('IG_USER_ID / IG_ACCESS_TOKEN non impostati: serie non pubblicabili.');

function leggiStato() {
  if (!existsSync(STATE)) return {};
  try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch (_) { return {}; }
}

const STORIES_URL = process.env.ATP_STORIES_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/ig/stories.json';

async function leggiManifesto() {
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error(`manifesto ${MANIFEST_URL} → HTTP ${r.status}`);
  const m = await r.json();
  // Le voci «solo storie» stanno in un manifesto a parte: la versione 1 di
  // questo script non le conosce e non deve vederle.
  try {
    const s = await fetch(STORIES_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (s.ok) { const j = await s.json(); m.posts = (m.posts || []).concat(j.posts || []); }
  } catch (_) { /* manifesto storie assente: si prosegue */ }
  return m;
}

async function figlio(url) {
  const c = await post(GRAPH, `/${USER}/media`, { image_url: url, is_carousel_item: 'true', access_token: TOKEN });
  return c.id;
}

async function pubblicaFeed(p, urls) {
  let creation;
  if (urls.length === 1) {
    const c = await post(GRAPH, `/${USER}/media`, { image_url: urls[0], caption: p.caption, access_token: TOKEN });
    await attendiPronto(GRAPH, TOKEN, c.id, 'immagine');
    creation = c.id;
  } else {
    if (urls.length > IG_MAX_CAROUSEL) muori(`${p.id}: ${urls.length} schede, massimo ${IG_MAX_CAROUSEL}.`);
    const figli = [];
    for (const u of urls) figli.push(await figlio(u));
    for (let i = 0; i < figli.length; i++) await attendiPronto(GRAPH, TOKEN, figli[i], `scheda ${i + 1}`);
    const padre = await post(GRAPH, `/${USER}/media`, {
      media_type: 'CAROUSEL', children: figli.join(','), caption: p.caption, access_token: TOKEN,
    });
    await attendiPronto(GRAPH, TOKEN, padre.id, 'carosello');
    creation = padre.id;
  }
  const pub = await post(GRAPH, `/${USER}/media_publish`, { creation_id: creation, access_token: TOKEN });
  return pub.id;
}

// Versione 9:16 della copertina (scripts/story-frames.mjs, committata dal
// workflow): senza, Instagram ritaglia i lati dell'immagine 4:5 nella storia.
// Se il file non è raggiungibile si usa l'originale, con un avviso.
async function urlStoria(p, originale) {
  const rel = `ig/story/${p.id}.jpg`;
  const base = process.env.ATP_STORY_BASE;
  if (!base || !existsSync(join(REPO_DIR, rel))) {
    console.warn(`::warning::${p.id}: storia 9:16 assente, uso l'immagine 4:5 (verrà ritagliata)`);
    return originale;
  }
  const url = base.replace(/\/?$/, '/') + rel;
  try {
    const h = await fetch(url, { method: 'HEAD' });
    if (h.ok) { console.log(`  storia 9:16: ${url}`); return url; }
    console.warn(`::warning::${p.id}: ${url} → HTTP ${h.status}, uso l'immagine 4:5`);
  } catch (e) {
    console.warn(`::warning::${p.id}: ${url} non raggiungibile (${e}), uso l'immagine 4:5`);
  }
  return originale;
}

async function ripubblicaInStoria(url) {
  const c = await post(GRAPH, `/${USER}/media`, { image_url: url, media_type: 'STORIES', access_token: TOKEN });
  await attendiPronto(GRAPH, TOKEN, c.id, 'storia');
  // Meta a volte dà FINISHED ma poi rifiuta con «media not ready» (2207027):
  // si riprova qualche volta invece di perdere la storia.
  for (let i = 1; ; i++) {
    try {
      const p = await post(GRAPH, `/${USER}/media_publish`, { creation_id: c.id, access_token: TOKEN });
      return p.id;
    } catch (e) {
      if (i >= 6 || !/2207027|not ready/i.test(String(e))) throw e;
      console.log(`  storia non ancora pronta per Meta, riprovo (${i})`);
      await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
}

async function main() {
  const m = await leggiManifesto();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const stato = leggiStato();
  const maturi = (m.posts || [])
    .filter((p) => LANGS.includes(p.lang))
    .filter((p) => !stato[p.id])
    .filter((p) => Date.parse(p.at) <= NOW && NOW - Date.parse(p.at) <= (p.windowH || WINDOW_H) * 3600e3)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const scaduti = (m.posts || []).filter((p) => LANGS.includes(p.lang) && !stato[p.id]
    && NOW - Date.parse(p.at) > (p.windowH || WINDOW_H) * 3600e3);
  if (scaduti.length) console.warn(`::warning::${scaduti.length} voci oltre la finestra di ${WINDOW_H}h, saltate: ${scaduti.map((p) => p.id).slice(0, 5).join(', ')}`);
  if (!maturi.length) {
    const prossimo = (m.posts || []).filter((p) => LANGS.includes(p.lang) && !stato[p.id] && Date.parse(p.at) > NOW)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
    console.log(`Nessuna serie da pubblicare adesso (${new Date(NOW).toISOString()}). Prossima: ${prossimo ? prossimo.id + ' alle ' + prossimo.at : 'nessuna nel manifesto'}`);
    return;
  }
  const p = maturi[0];
  console.log(`\nSERIE ${p.series} — ${p.id} (${p.lang}), prevista ${p.at}, ${p.images.length} immagini`);
  if (p.caption) esigiLessico(p.caption, p.id);
  const residua = await quotaResidua(GRAPH, USER, TOKEN);
  if (residua !== null && residua < 2) muori(`quota Instagram insufficiente (${residua}): ${p.id} rimandata.`);
  const urls = p.images.map((rel) => (/^https?:\/\//.test(rel) ? rel : base + rel));
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  if (p.storiesOnly) {
    // Voce «solo storie»: ogni immagine esce come storia, nessun post nel feed.
    // Serve alle storie in evidenza (le «in evidenza» si compongono poi dal
    // profilo: l'API non le gestisce).
    const ids = [];
    for (let i = 0; i < urls.length; i++) {
      try { ids.push(await ripubblicaInStoria(urls[i])); console.log(`  storia ${i + 1}/${urls.length} pubblicata`); }
      catch (e) { annota(`${p.id}: storia ${i + 1} non pubblicata: ${String(e)}`); process.exitCode = 1; }
    }
    if (!DRY) {
      stato[p.id] = { stories: ids, at: new Date().toISOString() };
      writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
    }
    return;
  }
  const feedId = await pubblicaFeed(p, urls);
  console.log(`  pubblicato nel feed, id ${feedId}`);
  let storyId = null;
  if (p.story) {
    try {
      storyId = await ripubblicaInStoria(await urlStoria(p, urls[0]));
      console.log(`  copertina ripubblicata in storia, id ${storyId}`);
    } catch (e) {
      annota(`${p.id}: post pubblicato, ma la storia no: ${String(e)}`);
      process.exitCode = 1;
    }
  }
  if (!DRY) {
    stato[p.id] = { feed: feedId, story: storyId, at: new Date().toISOString() };
    writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
  } else {
    console.log('  (a secco: stato non scritto)');
  }
}

main().catch((e) => { annota(`serie: ${String(e && e.stack || e)}`); process.exit(1); });
