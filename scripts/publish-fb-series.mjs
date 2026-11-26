/* ===================================================================== *
 *  publish-fb-series.mjs — Facebook: le serie «pianeti» sulla pagina
 * ===================================================================== *
 *
 * Stesso calendario di Instagram (/social/ig/series.json sugli asset del
 * Worker), stesse immagini, ma sulla PAGINA Facebook e solo nelle lingue di
 * ATP_FB_SERIES_LANGS (default "en"; il workflow dal 8/10/2026 passa tutte le 9 lingue). Si aggiunge al post quotidiano, non lo
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
import { DRY, REPO_DIR, annota, muori, esigiLessico, post, tokenDiPagina, senzaAvvertenza } from './social.mjs';

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

// «→ link in bio (astrotraderpro.com)» in tutte le lingue (enlace en la bio,
// lien en bio, ссылка в профиле, プロフィールのリンク（…）, ecc.): su Facebook
// il link è cliccabile, quindi dopo la freccia resta solo l'indirizzo.
function testoFacebook(caption) {
  return senzaAvvertenza(String(caption)
    .replace(/→[^\n→]*?[(（]\s*astrotraderpro\.com\s*[)）]/g, '→ ' + SITE)
    .replace(/link in bio\s*\(astrotraderpro\.com\)/gi, SITE)
    .replace(/link in bio/gi, SITE));
}

function leggiStato() {
  if (!existsSync(STATE)) return {};
  try { return JSON.parse(readFileSync(STATE, 'utf8')); } catch (_) { return {}; }
}

// 26/11/2026: una Pagina Facebook per lingua (fb/pages.json: {"es":"<id>",...}).
// Le lingue con Pagina propria escono SOLO lì, nella propria lingua, con la stessa
// scaletta di Instagram; le lingue senza Pagina propria restano sulla Pagina principale.
// Le Pagine nuove recuperano anche le serie già uscite (ATP_FB_BACKFILL, di default
// 1 ogni 150 minuti e max 4 al giorno per Pagina), dalla più vecchia.
const PAGES_FILE = join(REPO_DIR, 'fb', 'pages.json');
const BACKFILL = String(process.env.ATP_FB_BACKFILL || '1') === '1';
const BACKFILL_GAP_MIN = Number(process.env.ATP_FB_BACKFILL_GAP_MIN || 150);
const BACKFILL_MAX_DAY = Number(process.env.ATP_FB_BACKFILL_MAX_DAY || 4);

function leggiPagine() {
  if (!existsSync(PAGES_FILE)) return {};
  try { return JSON.parse(readFileSync(PAGES_FILE, 'utf8')); } catch (_) { return {}; }
}

async function pubblica(graph, page, token, p, base) {
  const testo = testoFacebook(p.caption || '');
  esigiLessico(testo, p.id);
  const urls = p.images.map((x) => (/^https?:\/\//.test(x) ? x : base + x));
  console.log(`FACEBOOK ${page} — ${p.id} (${p.lang}), ${urls.length} immagini`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  if (DRY) {
    console.log('  testo:\n' + testo.split('\n').map((l) => '    ' + l).join('\n'));
    console.log('  (a secco: niente chiamate a Facebook)');
    return null;
  }
  const tk = await tokenDiPagina(graph, page, token);
  if (urls.length === 1) {
    const j = await post(graph, `/${page}/photos`, { url: urls[0], message: testo, access_token: tk });
    return j.post_id || j.id;
  }
  const ids = [];
  for (let i = 0; i < urls.length; i++) {
    const j = await post(graph, `/${page}/photos`, { url: urls[i], published: 'false', access_token: tk });
    ids.push(j.id);
    console.log(`  foto ${i + 1}/${urls.length} caricata`);
  }
  const j = await post(graph, `/${page}/feed`, {
    message: testo,
    attached_media: JSON.stringify(ids.map((id) => ({ media_fbid: id }))),
    access_token: tk,
  });
  return j.id || j.post_id;
}

async function main() {
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) muori(`manifesto ${MANIFEST_URL} → HTTP ${r.status}`);
  const m = await r.json();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const stato = leggiStato();
  const pagine = leggiPagine();
  const tutte = (m.posts || []).filter((p) => !p.storiesOnly && !p.igOnly && LANGS.includes(p.lang));
  const errori = [];
  // bersagli: Pagina principale (lingue senza Pagina propria) + una Pagina per lingua
  const bersagli = [{ page: PAGE, lingue: LANGS.filter((l) => !pagine[l]), chiave: (p) => p.id, dedicata: false }];
  for (const [lang, id] of Object.entries(pagine)) {
    if (LANGS.includes(lang)) bersagli.push({ page: String(id), lingue: [lang], chiave: (p) => `${p.id}@${id}`, dedicata: true });
  }
  for (const b of bersagli) {
    if (!b.lingue.length) continue;
    try {
      const voci = tutte.filter((p) => b.lingue.includes(p.lang) && !stato[b.chiave(p)]);
      const maturi = voci
        .filter((p) => Date.parse(p.at) <= NOW && NOW - Date.parse(p.at) <= WINDOW_H * 3600e3)
        .sort((a, b2) => Date.parse(a.at) - Date.parse(b2.at));
      let p = maturi[0];
      let recupero = false;
      if (!p && b.dedicata && BACKFILL) {
        const mie = Object.entries(stato).filter(([k]) => k.endsWith('@' + b.page)).map(([, v]) => Date.parse(v.at)).filter(Number.isFinite);
        const ultimo = mie.length ? Math.max(...mie) : 0;
        const oggi = mie.filter((t) => NOW - t < 24 * 3600e3).length;
        if (NOW - ultimo >= BACKFILL_GAP_MIN * 60e3 && oggi < BACKFILL_MAX_DAY) {
          p = voci.filter((x) => Date.parse(x.at) < NOW - WINDOW_H * 3600e3)
            .sort((a, b2) => Date.parse(a.at) - Date.parse(b2.at))[0];
          recupero = !!p;
        }
      }
      if (!p) { console.log(`Pagina ${b.page} (${b.lingue}): nulla da pubblicare adesso.`); continue; }
      if (recupero) console.log('  (recupero di una serie già uscita)');
      const postId = await pubblica(GRAPH, b.page, TOKEN, p, base);
      if (postId) {
        console.log(`  pubblicato: ${postId}`);
        stato[b.chiave(p)] = { post: postId, at: new Date().toISOString() };
        mkdirSync(dirname(STATE), { recursive: true });
        writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
      }
    } catch (e) {
      errori.push(`${b.page}: ${String(e && e.message || e)}`);
      console.log(`  errore su ${b.page}: ${String(e && e.message || e)}`);
    }
  }
  if (errori.length) { annota(`Facebook serie: ${errori.join(' | ')}`); process.exit(1); }
}

main().catch((e) => { annota(`Facebook serie: ${String(e && e.message || e)}`); process.exit(1); });
