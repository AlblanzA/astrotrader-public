/* ===================================================================== *
 *  publish.mjs — Instagram: il carosello di sei schede e le sei storie
 * ===================================================================== *
 *
 * ══ COSA È CAMBIATO E PERCHÉ ══════════════════════════════════════════
 *
 * Prima questo file pubblicava UNA foto nel feed e UNA storia, entrambe
 * ricavate da `/api/tg-preview`. La rubrica quotidiana è invece un CAROSELLO di
 * sei schede — copertina, quattro schede per elemento con tre segni ciascuna,
 * invito — e SEI storie con le stesse pagine.
 *
 * Il percorso vecchio non è stato cancellato: vive in `pubblicaCardSingola()` e
 * torna con `ATP_LEGACY_CARD=1`. È spento di default perché pubblicare sia la
 * card singola sia il carosello vorrebbe dire due post nel feed lo stesso
 * giorno, e il secondo mangia le impressioni del primo.
 *
 * ══ IL CAROSELLO, PASSO PER PASSO ═════════════════════════════════════
 *
 * L'API non ha una chiamata sola. Sono tre stadi, e vanno nell'ordine:
 *
 *  1. SEI CONTENITORI FIGLI, uno per scheda:
 *        POST /{user}/media  image_url=… &is_carousel_item=true
 *     Il figlio NON porta la didascalia: se gliela si passa viene ignorata, e
 *     chi la mette lì passa il pomeriggio a chiedersi dove sia finita.
 *
 *  2. IL CONTENITORE DEL CAROSELLO:
 *        POST /{user}/media  media_type=CAROUSEL &children=id1,id2,… &caption=…
 *     `children` è una lista separata da virgole, e L'ORDINE È QUELLO DELLE
 *     SCHEDE: la copertina prima, l'invito ultimo.
 *
 *  3. LA PUBBLICAZIONE:
 *        POST /{user}/media_publish  creation_id={id del carosello}
 *
 * Fra il primo e il secondo stadio ogni figlio deve essere FINISHED: Meta
 * scarica l'immagine dall'URL per conto suo e finché non ha finito il
 * contenitore non è utilizzabile.
 *
 * ══ I LIMITI, VERIFICATI ══════════════════════════════════════════════
 *
 *  - massimo 10 schede per carosello (qui sono sei);
 *  - 50 pubblicazioni per account ogni 24 ore;
 *  - un carosello vale UNA pubblicazione, non sei.
 *
 * La giornata costa quindi 7 pubblicazioni su 50: il carosello più sei storie.
 * La quota si interroga PRIMA di cominciare, perché un carosello pubblicato e
 * le storie rifiutate a metà è uno stato peggiore del non aver pubblicato.
 *
 * ══ LE STORIE E LO STICKER LINK ═══════════════════════════════════════
 *
 * Nelle storie pubblicate via API il link NON è aggiungibile: Meta riserva gli
 * elementi interattivi — sticker link compreso — alle proprie applicazioni e li
 * vieta ai terzi. Non è un parametro che manca né una permission da chiedere:
 * non esiste. Per questo l'indirizzo è DISEGNATO DENTRO IL PIXEL dal piede
 * della scheda (`qa-carosello.mjs`, `footer()`), un po' più grande che nel
 * feed. Non aggiungere qui tentativi di sticker: fanno fallire la chiamata.
 *
 * ══ COME SI PROVA SENZA PUBBLICARE ════════════════════════════════════
 *
 *     ATP_DRY_RUN=1 node scripts/publish.mjs
 *
 * Percorre tutto — manifesto, URL, lessico, sequenza delle chiamate — e stampa
 * le richieste che verrebbero fatte, senza toccare la rete.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { getSky, buildCaption } from './lib.mjs';
import {
  DRY, CARDS, IG_MAX_CAROUSEL, leggiManifesto, urlDi, esigiLessico,
  post, get, attendiPronto, quotaResidua, annota, muori,
} from './social.mjs';

const GRAPH = 'https://graph.instagram.com/v21.0';
const USER = process.env.IG_USER_ID;
const TOKEN = process.env.IG_ACCESS_TOKEN;

if (!USER || !TOKEN) {
  // Prima usciva 0 e nessuno se ne accorgeva. Adesso il run diventa rosso.
  muori('IG_USER_ID / IG_ACCESS_TOKEN non impostati: Instagram non è pubblicabile.');
}


/* ------------------------------------------------------------------ *
 *  Rilanci sicuri
 * ------------------------------------------------------------------ */


/**
 * Registro di quello che è già uscito oggi: ig/.daily-state.json
 * { date, carosello: id, storie: { "1": id, ... } }.
 * Lo scrive questo script dopo ogni pubblicazione riuscita; il workflow lo
 * committa anche quando il run fallisce (passo «Salva stato»). Un rilancio
 * (Auto Retry, cron di backup delle 11 e 14, push) pubblica così SOLO i pezzi
 * mancanti, senza doppioni.
 */
const STATO_FILE = 'ig/.daily-state.json';
function leggiStato(date) {
  try {
    const j = JSON.parse(readFileSync(STATO_FILE, 'utf8'));
    if (j && j.date === date) return { date, carosello: j.carosello || null, storie: j.storie || {} };
  } catch (_) { /* nessuno stato: giornata nuova */ }
  return { date, carosello: null, storie: {} };
}
function salvaStato(stato) {
  if (DRY) return;
  try { writeFileSync(STATO_FILE, JSON.stringify(stato, null, 1) + '\n'); }
  catch (e) { console.warn(`::warning::stato non salvato (${String(e)})`); }
}

/**
 * Il carosello di oggi è già sul profilo?
 *
 * 15/10/2026: una sola storia su sette è fallita ("Media ID is not available"),
 * Auto Retry ha rilanciato il job e il job ha RIPUBBLICATO carosello e storie
 * già uscite (post doppi). Prima di pubblicare si guarda quindi il feed: se il
 * carosello con la stessa didascalia è già uscito oggi (UTC), questo è un
 * rilancio e non si pubblica più nulla. Se la lettura non riesce si procede
 * come prima (meglio un'eventuale doppia pubblicazione che nessuna).
 */
async function carosellodiOggiGiaUscito(m) {
  if (DRY) return false;
  try {
    const j = await get(
      GRAPH,
      `/${USER}/media?fields=caption,timestamp,media_type&limit=20&access_token=${encodeURIComponent(TOKEN)}`,
    );
    const oggi = String(m.date);
    const chiave = String(m.caption || '').slice(0, 80);
    return (j.data || []).some((x) =>
      x.media_type === 'CAROUSEL_ALBUM' &&
      String(x.timestamp || '').startsWith(oggi) &&
      String(x.caption || '').slice(0, 80) === chiave);
  } catch (e) {
    console.warn(`::warning::controllo doppioni non riuscito (${String(e)}): si procede.`);
    return false;
  }
}

/**
 * media_publish con pazienza. Meta a volte risponde FINISHED al contenitore e
 * subito dopo rifiuta la pubblicazione con "Media ID is not available" /
 * subcode 2207027 ("The media is not ready for publishing, please wait").
 * Non è un errore definitivo: si aspetta e si riprova, fino a sei volte.
 */
async function pubblicaConPazienza(creationId, cosa) {
  const tentativi = 6;
  for (let i = 1; i <= tentativi; i++) {
    try {
      return await post(GRAPH, `/${USER}/media_publish`, {
        creation_id: creationId, access_token: TOKEN,
      });
    } catch (e) {
      const t = String(e);
      const transitorio = t.includes('2207027') || t.includes('not ready for publishing') || t.includes('Media ID is not available');
      if (!transitorio || i === tentativi || DRY) throw e;
      console.log(`    ${cosa}: contenitore non ancora pubblicabile, riprovo fra 10 s (${i}/${tentativi - 1})`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Il percorso vecchio, conservato e spento
 * ------------------------------------------------------------------ */

/**
 * La card singola del flusso precedente. Non è stata cancellata: resta
 * disponibile con `ATP_LEGACY_CARD=1`, per esempio se un giorno il carosello
 * non fosse disponibile e servisse comunque qualcosa nel feed.
 */
async function pubblicaCardSingola() {
  const base = `https://raw.githubusercontent.com/${process.env.GH_REPO || 'AlblanzA/astrotrader-public'}/${process.env.IMG_REF || 'main'}/ig`;
  const d = await getSky();
  const caption = buildCaption(d);
  esigiLessico(caption, 'didascalia card singola');
  const fc = await post(GRAPH, `/${USER}/media`, {
    image_url: `${base}/card-feed.png`, caption, access_token: TOKEN,
  });
  await attendiPronto(GRAPH, TOKEN, fc.id, 'card singola');
  const fp = await post(GRAPH, `/${USER}/media_publish`, {
    creation_id: fc.id, access_token: TOKEN,
  });
  console.log('  card singola pubblicata, id', fp.id);
}

/* ------------------------------------------------------------------ *
 *  Il carosello
 * ------------------------------------------------------------------ */

async function pubblicaCarosello(m) {
  const schede = m.carousel;
  if (schede.length > IG_MAX_CAROUSEL) {
    muori(`carosello di ${schede.length} schede: il massimo di Instagram è ${IG_MAX_CAROUSEL}.`);
  }

  console.log(`\nCAROSELLO — ${schede.length} schede`);
  const figli = [];
  for (let i = 0; i < schede.length; i++) {
    const url = urlDi(schede[i]);
    console.log(`  scheda ${i + 1}/${schede.length}: ${url}`);
    // Il figlio non porta didascalia: quella sta solo sul contenitore padre.
    const c = await post(GRAPH, `/${USER}/media`, {
      image_url: url,
      is_carousel_item: 'true',
      access_token: TOKEN,
    });
    figli.push(c.id);
  }

  // Tutti i figli devono essere pronti prima di comporre il padre.
  for (let i = 0; i < figli.length; i++) {
    await attendiPronto(GRAPH, TOKEN, figli[i], `figlio ${i + 1}`);
  }

  // L'ordine dei figli è l'ordine delle schede: copertina prima, invito ultimo.
  const padre = await post(GRAPH, `/${USER}/media`, {
    media_type: 'CAROUSEL',
    children: figli.join(','),
    caption: m.caption,
    access_token: TOKEN,
  });
  await attendiPronto(GRAPH, TOKEN, padre.id, 'contenitore carosello');

  const pub = await post(GRAPH, `/${USER}/media_publish`, {
    creation_id: padre.id, access_token: TOKEN,
  });
  console.log(`  carosello pubblicato, id ${pub.id}`);
  return pub.id;
}

/* ------------------------------------------------------------------ *
 *  Le storie
 * ------------------------------------------------------------------ */

/**
 * Sei storie, una per pagina, in ordine.
 *
 * Ognuna è una pubblicazione a sé: non esiste un «carosello di storie». Se una
 * fallisce si prosegue con le altre — cinque storie su sei sono meglio di
 * nessuna — ma l'errore viene ANNOTATO e alla fine il processo esce diverso da
 * zero. È il punto in cui il vecchio codice ingoiava tutto con un `catch` che
 * stampava «STORY skipped» e usciva 0.
 */
async function pubblicaStorie(m, stato) {
  console.log(`\nSTORIE — ${m.stories.length} pagine`);
  console.log('  (lo sticker link non è pubblicabile via API: l’indirizzo è dentro il pixel)');
  const guasti = [];
  const ids = [];
  for (let i = 0; i < m.stories.length; i++) {
    const url = urlDi(m.stories[i]);
    if (stato.storie[String(i + 1)]) {
      console.log(`  storia ${i + 1}/${m.stories.length}: già pubblicata oggi (id ${stato.storie[String(i + 1)]}), salto`);
      continue;
    }
    console.log(`  storia ${i + 1}/${m.stories.length}: ${url}`);
    try {
      const c = await post(GRAPH, `/${USER}/media`, {
        image_url: url, media_type: 'STORIES', access_token: TOKEN,
      });
      await attendiPronto(GRAPH, TOKEN, c.id, `storia ${i + 1}`);
      const p = await pubblicaConPazienza(c.id, `storia ${i + 1}`);
      ids.push(p.id);
      stato.storie[String(i + 1)] = p.id || 'ok';
      salvaStato(stato);
      console.log(`    pubblicata, id ${p.id}`);
    } catch (e) {
      guasti.push(`storia ${i + 1} (${m.stories[i]}): ${String(e)}`);
      annota(`Instagram — storia ${i + 1} non pubblicata: ${String(e)}`);
    }
  }
  return { ids, guasti };
}

/* ------------------------------------------------------------------ *
 *  Il giro
 * ------------------------------------------------------------------ */

async function main() {
  if (DRY) console.log('=== PROVA A SECCO: nessuna chiamata parte davvero ===\n');

  // La prova a secco NON allenta il controllo sulla data: se lo facesse, il
  // passo di verifica nel workflow direbbe «tutto bene» sulle immagini di ieri.
  // Per provare un giorno diverso c'è ATP_ALLOW_STALE=1, che è esplicito.
  const m = leggiManifesto({ allowStale: process.env.ATP_ALLOW_STALE === '1' });
  console.log(`Manifesto del ${m.date}: ${m.carousel.length} schede, ${m.stories.length} storie`);
  esigiLessico(m.caption, 'didascalia Instagram');

  // Il carosello vale 1 pubblicazione, ogni storia 1: sette in tutto.
  const costo = 1 + m.stories.length;
  const residua = await quotaResidua(GRAPH, USER, TOKEN);
  if (residua != null && residua < costo) {
    muori(
      `quota insufficiente: servono ${costo} pubblicazioni e ne restano ${residua} ` +
      'nelle ultime 24 ore. Non si comincia per non lasciare la giornata a metà.',
    );
  }

  const guasti = [];

  if (process.env.ATP_LEGACY_CARD === '1') {
    try { await pubblicaCardSingola(); }
    catch (e) { guasti.push(`card singola: ${String(e)}`); annota(`Instagram — card singola: ${String(e)}`); }
  }

  const stato = leggiStato(m.date);

  if (stato.carosello) {
    console.log(`\nCarosello di oggi già pubblicato (id ${stato.carosello}): salto, restano solo le storie mancanti.`);
  } else if (await carosellodiOggiGiaUscito(m)) {
    // Carosello sul profilo ma nessun registro: non si sa quali storie siano
    // uscite, quindi non se ne pubblica nessuna (meglio una storia in meno che
    // sei doppie).
    console.log('::warning::Instagram — il carosello di oggi è già sul profilo ma manca il registro delle storie: nessuna nuova pubblicazione per non fare doppioni.');
    stato.carosello = 'trovato-sul-profilo';
    for (let i = 1; i <= m.stories.length; i++) stato.storie[String(i)] = stato.storie[String(i)] || 'sconosciuta';
    salvaStato(stato);
    return;
  } else {
    try {
      stato.carosello = (await pubblicaCarosello(m)) || 'ok';
      salvaStato(stato);
    } catch (e) {
      // Il carosello è il contenuto principale: se cade, cade la giornata.
      muori(`Instagram — carosello non pubblicato: ${String(e)}`);
    }
  }

  const st = await pubblicaStorie(m, stato);
  guasti.push(...st.guasti);

  if (guasti.length) {
    annota(`Instagram: ${guasti.length} pubblicazioni su ${costo} non riuscite.`);
    process.exit(1);
  }
  console.log(
    `\nInstagram: fatto — 1 carosello (${CARDS} schede) e ${st.ids.length} storie.`,
  );
}

main().catch((e) => {
  annota(`Instagram — interrotto: ${e && e.stack ? e.stack : String(e)}`);
  process.exit(1);
});
