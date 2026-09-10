/* ===================================================================== *
 *  publish-fb.mjs — Facebook: il post a sei foto e le sei storie di pagina
 * ===================================================================== *
 *
 * ══ COSA È CAMBIATO ═══════════════════════════════════════════════════
 *
 * Prima questo file caricava UNA foto sul feed della pagina. Adesso pubblica lo
 * stesso contenuto degli altri canali: le SEI schede come unico post a più
 * immagini e le SEI storie di pagina.
 *
 * ══ IL CAROSELLO SU FACEBOOK NON È QUELLO DI INSTAGRAM ════════════════
 *
 * Su Instagram esiste un `media_type=CAROUSEL` con i figli. Su Facebook no: un
 * post a più immagini si costruisce in due tempi, ed è il modo documentato.
 *
 *  1. OGNI FOTO SI CARICA SENZA PUBBLICARLA:
 *        POST /{page}/photos  url=… &published=false
 *     `published=false` è la parte che conta: senza, ognuna delle sei
 *     comparirebbe come post a sé e la pagina avrebbe sei post invece di uno.
 *     La risposta porta l'id della foto.
 *
 *  2. IL POST LE RACCOGLIE:
 *        POST /{page}/feed  message=… &attached_media=[{"media_fbid":"…"}, …]
 *     `attached_media` è un JSON, non una lista separata da virgole, e l'ordine
 *     è quello in cui le immagini compaiono nel post.
 *
 * Il link nel testo QUI è cliccabile — a differenza delle didascalie Instagram
 * — quindi si usa `captionLink` del manifesto e non `caption`.
 *
 * ══ LE STORIE DI PAGINA ═══════════════════════════════════════════════
 *
 * Anche le storie sono in due tempi, e il primo è lo stesso:
 *
 *  1. POST /{page}/photos  url=… &published=false        → photo_id
 *  2. POST /{page}/photo_stories  photo_id=…
 *
 * Nessun testo e nessun link: la storia di pagina pubblicata via API è la sola
 * immagine. Come su Instagram, l'indirizzo è disegnato dentro il pixel.
 *
 * Le storie di pagina richiedono che il token abbia i permessi di
 * pubblicazione della pagina; se non li ha, la chiamata fallisce e l'errore
 * viene annotato invece di sparire.
 *
 * ══ COME SI PROVA SENZA PUBBLICARE ════════════════════════════════════
 *
 *     ATP_DRY_RUN=1 node scripts/publish-fb.mjs
 */
import {
  DRY, leggiManifesto, urlDi, esigiLessico, post, annota, muori,
} from './social.mjs';

const GRAPH = 'https://graph.facebook.com/v21.0';
const PAGE = process.env.FB_PAGE_ID;
const TOKEN = process.env.FB_PAGE_TOKEN;

if (!PAGE || !TOKEN) {
  // Prima usciva 0 con un «skipping» in mezzo al log. Se i secret non ci sono
  // è una configurazione mancante, non un esito valido.
  muori('FB_PAGE_ID / FB_PAGE_TOKEN non impostati: la pagina Facebook non è pubblicabile.');
}

/**
 * Carica una foto senza pubblicarla e restituisce il suo id.
 *
 * È il mattone comune al post a più immagini e alle storie: entrambe partono da
 * una foto caricata e non pubblicata.
 */
async function caricaNonPubblicata(rel, cosa) {
  const url = urlDi(rel);
  console.log(`  ${cosa}: ${url}`);
  const j = await post(GRAPH, `/${PAGE}/photos`, {
    url, published: 'false', access_token: TOKEN,
  });
  return j.id;
}

/* ------------------------------------------------------------------ *
 *  Il post a sei foto
 * ------------------------------------------------------------------ */

async function pubblicaCarosello(m) {
  console.log(`\nPOST A PIÙ IMMAGINI — ${m.carousel.length} schede`);
  const ids = [];
  for (let i = 0; i < m.carousel.length; i++) {
    ids.push(await caricaNonPubblicata(m.carousel[i], `scheda ${i + 1}/${m.carousel.length}`));
  }
  // attached_media è JSON, e l'ordine è quello che il lettore vedrà.
  const allegati = JSON.stringify(ids.map((id) => ({ media_fbid: id })));
  const j = await post(GRAPH, `/${PAGE}/feed`, {
    message: m.captionLink,
    attached_media: allegati,
    access_token: TOKEN,
  });
  console.log(`  post pubblicato, id ${j.id || j.post_id}`);
  return j.id || j.post_id;
}

/* ------------------------------------------------------------------ *
 *  Le storie di pagina
 * ------------------------------------------------------------------ */

async function pubblicaStorie(m) {
  console.log(`\nSTORIE DI PAGINA — ${m.stories.length} pagine`);
  const guasti = [];
  const ids = [];
  for (let i = 0; i < m.stories.length; i++) {
    try {
      const foto = await caricaNonPubblicata(m.stories[i], `storia ${i + 1}/${m.stories.length}`);
      const j = await post(GRAPH, `/${PAGE}/photo_stories`, {
        photo_id: foto, access_token: TOKEN,
      });
      ids.push(j.post_id || j.id);
      console.log(`    pubblicata, id ${j.post_id || j.id}`);
    } catch (e) {
      guasti.push(`storia ${i + 1}: ${String(e)}`);
      annota(`Facebook — storia ${i + 1} non pubblicata: ${String(e)}`);
    }
  }
  return { ids, guasti };
}

/* ------------------------------------------------------------------ *
 *  Il giro
 * ------------------------------------------------------------------ */

async function main() {
  if (DRY) console.log('=== PROVA A SECCO: nessuna chiamata parte davvero ===\n');

  // Come su Instagram: a secco la data si controlla lo stesso. Per provare un
  // giorno diverso serve ATP_ALLOW_STALE=1, esplicito.
  const m = leggiManifesto({ allowStale: process.env.ATP_ALLOW_STALE === '1' });
  console.log(`Manifesto del ${m.date}: ${m.carousel.length} schede, ${m.stories.length} storie`);
  esigiLessico(m.captionLink, 'testo Facebook');

  const guasti = [];
  try {
    await pubblicaCarosello(m);
  } catch (e) {
    muori(`Facebook — post a più immagini non pubblicato: ${String(e)}`);
  }

  const st = await pubblicaStorie(m);
  guasti.push(...st.guasti);

  if (guasti.length) {
    annota(`Facebook: ${guasti.length} storie su ${m.stories.length} non riuscite.`);
    process.exit(1);
  }
  console.log(`\nFacebook: fatto — 1 post a ${m.carousel.length} immagini e ${st.ids.length} storie.`);
}

main().catch((e) => {
  annota(`Facebook — interrotto: ${e && e.stack ? e.stack : String(e)}`);
  process.exit(1);
});
