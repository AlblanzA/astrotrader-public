/* ===================================================================== *
 *  publish-threads-series.mjs — Threads: le serie «pianeti»
 * ===================================================================== *
 *
 * Stesso calendario e stesse immagini di Instagram/Facebook
 * (ig/series-v2.json), ma sul profilo Threads @astrotraderproapp e, di
 * default, solo in inglese (ATP_THREADS_LANGS). Si aggiunge ai workflow
 * esistenti, non li tocca. Le voci «solo storie» non esistono su Threads.
 *
 * Threads API (graph.threads.net):
 *   1. POST /{user}/threads   media_type=IMAGE|CAROUSEL (+ text, topic_tag)
 *   2. attesa status FINISHED sul contenitore
 *   3. POST /{user}/threads_publish   creation_id=…
 * Carosello: 2–20 elementi con is_carousel_item=true, poi il contenitore padre.
 * Limite testo: 500 caratteri. Un solo topic_tag per post (al posto degli
 * hashtag): qui «Astrology».
 *
 * Quando pubblica
 *   - voce MATURA (at <= adesso, entro ATP_THREADS_WINDOW_H ore, default 18):
 *     esce come le altre reti, una per giro.
 *   - ARRETRATO (ATP_THREADS_BACKFILL=1): se non c'è nulla di maturo, si
 *     recupera la voce passata più VECCHIA non ancora uscita su Threads, così
 *     le serie escono nell'ordine del calendario. Ritmo prudente: al massimo
 *     ATP_THREADS_BACKFILL_PER_DAY al giorno (default 4) e almeno
 *     ATP_THREADS_GAP_MIN minuti fra due post (default 150): un account nuovo
 *     che rovescia 56 caroselli in una notte sembra un bot e viene frenato.
 *
 * Stato: threads/series-posted.json (id voce → id Threads), committato dal
 * workflow.
 *
 * Secret (li crea l'utente): THREADS_USER_ID, THREADS_ACCESS_TOKEN
 * (permessi threads_basic + threads_content_publish). Se mancano il passo si
 * salta senza errore: Threads è facoltativo finché non ci sono.
 *
 * Prova senza pubblicare:
 *   ATP_DRY_RUN=1 ATP_NOW=2026-10-01T17:05:00Z node scripts/publish-threads-series.mjs
 *   ATP_DRY_RUN=1 ATP_THREADS_BACKFILL=1 node scripts/publish-threads-series.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { DRY, REPO_DIR, annota, muori, esigiLessico, post, get, senzaAvvertenza } from './social.mjs';

const GRAPH = 'https://graph.threads.net/v1.0';
const USER = process.env.THREADS_USER_ID;
const TOKEN = process.env.THREADS_ACCESS_TOKEN;
const MANIFEST_URL = process.env.ATP_SERIES_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/ig/series.json';
const STATE = join(REPO_DIR, 'threads', 'series-posted.json');
const WINDOW_H = Number(process.env.ATP_THREADS_WINDOW_H || 18);
const LANGS = String(process.env.ATP_THREADS_LANGS || 'en').split(',').map((s) => s.trim()).filter(Boolean);
const NOW = process.env.ATP_NOW ? Date.parse(process.env.ATP_NOW) : Date.now();
const BACKFILL = process.env.ATP_THREADS_BACKFILL === '1';
const BACKFILL_PER_DAY = Number(process.env.ATP_THREADS_BACKFILL_PER_DAY || 4);
const GAP_MIN = Number(process.env.ATP_THREADS_GAP_MIN || 150);
const TOPIC = process.env.ATP_THREADS_TOPIC || 'Astrology';
const MAX_CHARS = 500;
const MAX_CAROUSEL = 20;

if (!DRY && (!USER || !TOKEN)) {
  console.log('THREADS_USER_ID / THREADS_ACCESS_TOKEN non impostati: serie Threads saltate.');
  process.exit(0);
}

function leggiStato() {
  if (!existsSync(STATE)) return {};
  try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch (_) { return {}; }
}

/* Dalla didascalia Instagram al testo Threads:
 *  - via l'avvertenza «Educational content…» (decisione utente 14/10);
 *  - via la coda di hashtag (Threads usa un solo topic_tag, passato a parte);
 *  - «→ link in bio (astrotraderpro.com)» → «→ link in bio»: il link sta nel
 *    profilo, e nei post Threads i link nel testo penalizzano la portata;
 *  - al massimo 500 caratteri, tagliando a fine frase. */
function testoThreads(caption) {
  let t = senzaAvvertenza(String(caption || ''))
    .split('\n')
    .filter((l) => !/^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(l))
    .join('\n')
    .replace(/→[^\n→]*?[(（]\s*astrotraderpro\.com\s*[)）]/g, '→ link in bio')
    .replace(/link in bio\s*\(astrotraderpro\.com\)/gi, 'link in bio')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (t.length <= MAX_CHARS) return t;
  const taglio = t.slice(0, MAX_CHARS - 1);
  const fine = Math.max(taglio.lastIndexOf('. '), taglio.lastIndexOf('?\n'), taglio.lastIndexOf('.\n'), taglio.lastIndexOf('! '));
  return (fine > 200 ? taglio.slice(0, fine + 1) : taglio.replace(/\s+\S*$/, '') + '…').trim();
}

async function attendiPronto(id, cosa) {
  if (DRY) { console.log(`        (a secco: nessuna attesa per ${cosa})`); return; }
  for (let i = 0; i < 30; i++) {
    const j = await get(GRAPH, `/${id}?fields=status,error_message&access_token=${encodeURIComponent(TOKEN)}`);
    if (j.status === 'FINISHED' || j.status === 'PUBLISHED') return;
    if (j.status === 'ERROR' || j.status === 'EXPIRED') {
      throw new Error(`${cosa}: contenitore ${id} in stato ${j.status} — ${j.error_message || 'nessun dettaglio'}`);
    }
    await new Promise((s) => setTimeout(s, 4000));
  }
  throw new Error(`${cosa}: contenitore ${id} non pronto dopo 120 secondi`);
}

async function pubblica(urls, testo) {
  let creation;
  if (urls.length === 1) {
    const c = await post(GRAPH, `/${USER}/threads`, {
      media_type: 'IMAGE', image_url: urls[0], text: testo, topic_tag: TOPIC, access_token: TOKEN,
    });
    await attendiPronto(c.id, 'immagine');
    creation = c.id;
  } else {
    if (urls.length > MAX_CAROUSEL) muori(`${urls.length} schede: Threads ne ammette al massimo ${MAX_CAROUSEL}.`);
    const figli = [];
    for (const u of urls) {
      const f = await post(GRAPH, `/${USER}/threads`, {
        media_type: 'IMAGE', image_url: u, is_carousel_item: 'true', access_token: TOKEN,
      });
      figli.push(f.id);
    }
    for (let i = 0; i < figli.length; i++) await attendiPronto(figli[i], `scheda ${i + 1}`);
    const padre = await post(GRAPH, `/${USER}/threads`, {
      media_type: 'CAROUSEL', children: figli.join(','), text: testo, topic_tag: TOPIC, access_token: TOKEN,
    });
    await attendiPronto(padre.id, 'carosello');
    creation = padre.id;
  }
  const pub = await post(GRAPH, `/${USER}/threads_publish`, { creation_id: creation, access_token: TOKEN });
  return pub.id;
}

async function main() {
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) muori(`manifesto ${MANIFEST_URL} → HTTP ${r.status}`);
  const m = await r.json();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const stato = leggiStato();
  const voci = (m.posts || []).filter((p) => !p.storiesOnly && LANGS.includes(p.lang) && !stato[p.id]);
  const ordinate = voci.slice().sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const maturi = ordinate.filter((p) => Date.parse(p.at) <= NOW && NOW - Date.parse(p.at) <= WINDOW_H * 3600e3);

  let p = maturi[0];
  let motivo = 'in calendario';
  if (!p && BACKFILL) {
    // Ritmo prudente per l'arretrato: tetto giornaliero e distanza minima.
    const ultimi = Object.values(stato).map((v) => Date.parse(v && v.at)).filter(Number.isFinite);
    const oggi = new Date(NOW).toISOString().slice(0, 10);
    const oggiN = ultimi.filter((t) => new Date(t).toISOString().slice(0, 10) === oggi).length;
    const ultimo = ultimi.length ? Math.max(...ultimi) : 0;
    if (oggiN >= BACKFILL_PER_DAY) {
      console.log(`Arretrato Threads: tetto di ${BACKFILL_PER_DAY} post al giorno raggiunto (${oggiN}).`);
      return;
    }
    if (NOW - ultimo < GAP_MIN * 60e3) {
      console.log(`Arretrato Threads: ultimo post ${Math.round((NOW - ultimo) / 60e3)} min fa, minimo ${GAP_MIN}.`);
      return;
    }
    p = ordinate.find((x) => Date.parse(x.at) <= NOW);
    motivo = 'arretrato';
  }
  if (!p) {
    const next = ordinate.find((x) => Date.parse(x.at) > NOW);
    console.log(`Nessuna serie Threads adesso. Prossima: ${next ? next.id + ' alle ' + next.at : 'nessuna'}`);
    return;
  }

  const testo = testoThreads(p.caption);
  esigiLessico(testo, p.id);
  const urls = p.images.map((x) => (/^https?:\/\//.test(x) ? x : base + x));
  console.log(`THREADS (${motivo}) — ${p.id} (${p.lang}), ${urls.length} immagini, ${testo.length} caratteri`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  if (DRY) {
    console.log('  testo:\n' + testo.split('\n').map((l) => '    ' + l).join('\n'));
    console.log(`  topic_tag: ${TOPIC}\n  (a secco: niente chiamate a Threads, stato non scritto)`);
    return;
  }
  const id = await pubblica(urls, testo);
  console.log(`  pubblicato: ${id}`);
  stato[p.id] = { post: id, at: new Date().toISOString(), via: motivo };
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
}

main().catch((e) => { annota(`Threads serie: ${String(e && e.message || e)}`); process.exit(1); });
