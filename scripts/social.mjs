/* ===================================================================== *
 *  social.mjs — il carosello e le storie: manifesto, URL pubblici,
 *               prova a secco, controllo lessicale, fallimento rumoroso
 * ===================================================================== *
 *
 * ══ IL PROBLEMA CHE QUESTO FILE RISOLVE ═══════════════════════════════
 *
 * Fino a ieri il flusso pubblicava UNA immagine: `ig/card-feed.png` per il
 * feed e `ig/card-story.png` per una storia. Adesso il contenuto quotidiano
 * sono SEI schede 1080×1350 (carosello) e SEI storie 1080×1920, disegnate da
 * `frontend/scripts/qa-carosello.mjs` con i testi composti da
 * `web-astrotraderpro/cfworker/src/atp_signposts.js`.
 *
 * Instagram e Facebook non accettano l'immagine come byte: vogliono un URL
 * pubblicamente raggiungibile che i loro server scaricano da soli. Il flusso
 * esistente risolveva la cosa nel modo più semplice che ci sia — il workflow
 * COMMITTA le card nel repository pubblico e poi le indirizza via
 * `raw.githubusercontent.com` — e qui si riusa quel meccanismo tale e quale,
 * perché funziona, non costa niente e non aggiunge un servizio da mantenere.
 *
 * L'unica aggiunta è che l'URL viene appuntato alla SHA del commit appena
 * fatto (`IMG_REF`), non a `main`: se qualcuno spinge un altro commit mentre
 * Meta sta scaricando, con `main` scaricherebbe l'immagine sbagliata. Il flusso
 * attuale lo faceva già; qui vale per tutte e dodici le immagini.
 *
 * ══ IL MANIFESTO ══════════════════════════════════════════════════════
 *
 * `ig/social.json` è il contratto fra chi disegna e chi pubblica:
 *
 *     {
 *       "date": "2026-09-03",
 *       "caption": "…",          // Instagram: il link non è cliccabile
 *       "captionLink": "…",      // Facebook: il link è cliccabile
 *       "carousel": ["carousel/01-copertina.png", …],   // sei, in ordine
 *       "stories":  ["stories/01-copertina.png",  …],   // sei, in ordine
 *       "generated": "…"
 *     }
 *
 * Lo scrive `stage-social.mjs`. Lo legge chi pubblica. Nessuno dei due sa come
 * l'altro è fatto dentro.
 *
 * ══ PERCHÉ FALLISCE RUMOROSAMENTE ═════════════════════════════════════
 *
 * C'è un precedente: uno script usciva con codice 0 anche quando la
 * pubblicazione non era avvenuta, e il guasto è rimasto invisibile per
 * settimane. Qui NIENTE viene ingoiato:
 *
 *  - il manifesto deve esistere, avere la data di OGGI (UTC) e sei file per
 *    formato, tutti presenti su disco e non vuoti;
 *  - la didascalia passa il controllo lessicale prima di partire;
 *  - ogni errore stampa un'annotazione `::error::`, che GitHub Actions mostra
 *    in rosso in cima al run, e termina il processo con codice diverso da 0.
 *
 * ══ LA PROVA A SECCO ══════════════════════════════════════════════════
 *
 * `ATP_DRY_RUN=1` (o `--dry-run`) percorre TUTTO il ragionamento — manifesto,
 * URL, controllo lessicale, sequenza esatta delle chiamate — e stampa le
 * richieste che verrebbero fatte, senza toccare la rete. Il token non compare
 * mai nella stampa. È il modo di guardare cosa succederebbe senza che succeda.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_DIR = join(HERE, '..');

/** Numero di schede del carosello. Sei è la rubrica: copertina, quattro
 *  elementi, invito. */
export const CARDS = 6;

/**
 * Limiti VERIFICATI dell'API di Instagram, scritti qui perché chi legge il
 * codice non debba andarseli a cercare:
 *
 *  - un carosello accetta al massimo 10 elementi;
 *  - un account può pubblicare 50 volte ogni 24 ore;
 *  - un carosello, per quel conteggio, vale UNA pubblicazione sola — non sei.
 *
 * Quindi la giornata costa 1 (carosello) + 6 (storie) = 7 pubblicazioni su 50.
 */
export const IG_MAX_CAROUSEL = 10;
export const IG_DAILY_QUOTA = 50;

export const DRY =
  process.env.ATP_DRY_RUN === '1' || process.argv.includes('--dry-run');

/* ------------------------------------------------------------------ *
 *  Fallimento rumoroso
 * ------------------------------------------------------------------ */

/**
 * `::error::` non è decorazione: è l'annotazione che GitHub Actions mostra in
 * rosso in cima al run e nella mail di notifica. Senza, un guasto resta una
 * riga in mezzo a duecento righe di log.
 */
export function annota(msg) {
  console.error(`::error::${msg}`);
}

export function muori(msg) {
  annota(msg);
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 *  Il manifesto
 * ------------------------------------------------------------------ */

export function oggiISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Legge e VALIDA `ig/social.json`.
 *
 * La data DEVE essere quella di oggi, altrimenti il canale ripubblicherebbe in
 * silenzio il cielo di ieri — precisamente il tipo di guasto che non si vede.
 * Il controllo vale anche a secco: se la prova a secco chiudesse un occhio, il
 * passo di verifica del workflow direbbe «tutto bene» sulle immagini vecchie.
 * Per provare a mano un giorno diverso si passa `ATP_ALLOW_STALE=1`, che è una
 * decisione esplicita di chi digita, non un effetto collaterale.
 */
export function leggiManifesto(opts = {}) {
  const file = join(REPO_DIR, 'ig', 'social.json');
  if (!existsSync(file)) {
    muori(
      `manifesto assente: ${file}. Le sei schede e le sei storie vanno preparate ` +
      'prima della pubblicazione (npm run social-giorno, poi scripts/stage-social.mjs).',
    );
  }
  let m;
  try {
    m = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    muori(`manifesto illeggibile: ${String(e)}`);
  }

  const problemi = [];
  const atteso = opts.date || oggiISO();
  if (!opts.allowStale && m.date !== atteso) {
    problemi.push(
      `il manifesto porta la data ${m.date || '(assente)'} ma oggi è ${atteso}: ` +
      'le immagini non sono state rigenerate.',
    );
  }
  if (!m.caption || !String(m.caption).trim()) problemi.push('didascalia assente');
  if (!m.captionLink || !String(m.captionLink).trim()) {
    problemi.push('didascalia con link assente (serve a Facebook)');
  }

  for (const [campo, atteseN] of [['carousel', CARDS], ['stories', CARDS]]) {
    const lista = m[campo];
    if (!Array.isArray(lista) || lista.length !== atteseN) {
      problemi.push(`${campo}: attese ${atteseN} immagini, trovate ${(lista || []).length}`);
      continue;
    }
    if (campo === 'carousel' && lista.length > IG_MAX_CAROUSEL) {
      problemi.push(`carousel: ${lista.length} schede, il massimo di Instagram è ${IG_MAX_CAROUSEL}`);
    }
    lista.forEach((rel, i) => {
      const p = join(REPO_DIR, 'ig', rel);
      if (!existsSync(p)) { problemi.push(`${campo}[${i}]: file assente ${rel}`); return; }
      const s = statSync(p);
      // Un PNG 1080×1350 sta sulle centinaia di kB: sotto i 10 kB non è
      // un'immagine, è un file troncato che Meta rifiuterebbe con un errore
      // molto meno chiaro di questo.
      if (s.size < 10 * 1024) problemi.push(`${campo}[${i}]: ${rel} pesa ${s.size} byte, troppo poco`);
    });
  }

  if (problemi.length) {
    for (const p of problemi) annota(`manifesto: ${p}`);
    process.exit(1);
  }
  return m;
}

/* ------------------------------------------------------------------ *
 *  Gli URL pubblici
 * ------------------------------------------------------------------ */

/**
 * Lo stesso meccanismo del flusso esistente: il workflow committa le immagini
 * nel repository PUBBLICO e `raw.githubusercontent.com` le serve. Appuntate
 * alla SHA del commit, non a `main`.
 */
export function baseRaw() {
  const repo = process.env.GH_REPO || 'AlblanzA/astrotrader-public';
  const ref = process.env.IMG_REF || 'main';
  if (ref === 'main') {
    console.warn(
      '::warning::IMG_REF non impostato: gli URL puntano a «main» e non alla SHA ' +
      'del commit. Se arriva un altro commit durante il download, Meta scarica ' +
      "l'immagine sbagliata.",
    );
  }
  return `https://raw.githubusercontent.com/${repo}/${ref}/ig`;
}

export function urlDi(rel) {
  return `${baseRaw()}/${String(rel).split('\\').join('/')}`;
}

/* ------------------------------------------------------------------ *
 *  Controllo lessicale, prima di partire
 * ------------------------------------------------------------------ */

/**
 * Le stesse parole di `atp_signposts.js` (`ATP_SP_BANNED`), ricopiate qui
 * perché questo script gira nel repository PUBBLICO, dove `atp_signposts.js`
 * non c'è. La duplicazione è voluta e va tenuta allineata a mano: meglio due
 * elenchi uguali che un canale senza controllo.
 *
 * L'avvertenza legale contiene di proposito le parole proibite («not a trading
 * signal»): è esentata per confronto esatto, non per parole chiave, così se
 * qualcuno la riscrive il controllo torna ad applicarsi.
 */
const VIETATE = [
  'segnal', 'ticker', 'bullish', 'bearish', 'rialzo', 'ribasso', 'compra', 'vendi',
  'mercat', 'trading', 'trade', 'signal', 'market', 'buy', 'sell', 'stock', 'stocks',
  'shares', 'crypto', 'bitcoin', 'forex', 'portfolio', 'profit', 'invest', 'trader',
  'bull', 'bear', 'rally', 'breakout', 'entry point', 'take profit', 'stop loss',
  'up trend', 'downtrend', 'uptrend', 'go long', 'go short', 'risk-on', 'risk off',
];
const AVVERTENZA =
  'Educational content on classical financial-astrology cycles. ' +
  'Not financial advice, not a recommendation, not a trading signal. ' +
  'Astrology\u2019s predictive value is not scientifically proven.';

export function controlloLessicale(testo, etichetta) {
  const re = new RegExp(`\\b(${VIETATE.join('|')})\\b`, 'i');
  const problemi = [];
  for (const riga of String(testo).split('\n')) {
    if (riga.indexOf(AVVERTENZA) >= 0) continue;
    const m = riga.match(re);
    if (m) problemi.push(`${etichetta}: parola vietata «${m[0]}» in «${riga.slice(0, 70)}»`);
  }
  const noi = String(testo).match(/\b(we|we\u2019re|we're|our|ours|us)\b/i);
  if (noi) problemi.push(`${etichetta}: prima persona plurale «${noi[0]}»`);
  return problemi;
}

/** Ferma tutto se la didascalia non è pubblicabile. */
export function esigiLessico(testo, etichetta) {
  const p = controlloLessicale(testo, etichetta);
  if (p.length) {
    for (const x of p) annota(x);
    process.exit(1);
  }
  console.log(`  lessico ${etichetta}: ok (${String(testo).length} caratteri)`);
}

/* ------------------------------------------------------------------ *
 *  Le chiamate
 * ------------------------------------------------------------------ */

/** Il token non deve mai finire nel log di un run pubblico. */
function nascondi(corpo) {
  const c = { ...corpo };
  for (const k of ['access_token', 'ig_access_token', 'token']) {
    if (k in c) c[k] = '«token»';
  }
  return c;
}

let contatore = 0;

/**
 * Una chiamata POST all'API Graph.
 *
 * A secco stampa metodo, URL e corpo (token nascosto) e restituisce un id
 * finto, così la sequenza successiva si può percorrere tutta: è l'unico modo
 * di vedere che il carosello viene costruito con i sei figli giusti senza
 * pubblicare niente.
 */
export async function post(base, path, corpo) {
  contatore += 1;
  const etichetta = `[${String(contatore).padStart(2, '0')}] POST ${base}${path}`;
  if (DRY) {
    console.log(etichetta);
    for (const [k, v] of Object.entries(nascondi(corpo))) {
      const s = String(v);
      console.log(`        ${k} = ${s.length > 160 ? s.slice(0, 160) + '…' : s}`);
    }
    return { id: `DRY-${contatore}`, __dry: true };
  }
  console.log(etichetta);
  const fd = new URLSearchParams(corpo);
  const r = await fetch(base + path, { method: 'POST', body: fd });
  let j = {};
  try { j = await r.json(); } catch (_) { /* corpo non JSON: sotto diventa errore */ }
  if (!r.ok || (j && j.error)) {
    throw new Error(
      `${path} ha risposto ${r.status}: ${JSON.stringify((j && j.error) || j || {})}`,
    );
  }
  return j;
}

export async function get(base, path) {
  contatore += 1;
  const etichetta = `[${String(contatore).padStart(2, '0')}] GET  ${base}${path.replace(/access_token=[^&]*/, 'access_token=«token»')}`;
  if (DRY) { console.log(etichetta); return { __dry: true }; }
  console.log(etichetta);
  const r = await fetch(base + path);
  let j = {};
  try { j = await r.json(); } catch (_) { /* idem */ }
  if (!r.ok || (j && j.error)) {
    throw new Error(`${path} ha risposto ${r.status}: ${JSON.stringify((j && j.error) || j || {})}`);
  }
  return j;
}

/**
 * Attende che un contenitore sia pronto.
 *
 * Meta scarica l'immagine dall'URL e la elabora: pubblicare prima che sia
 * FINISHED fallisce. Venti tentativi da tre secondi sono un minuto, che per un
 * PNG da qualche centinaio di kB è abbondante. Uno stato ERROR è definitivo e
 * va sollevato subito con il motivo che Meta restituisce, non con un generico
 * «container ERROR» che poi costringe a indovinare.
 */
export async function attendiPronto(base, token, id, cosa) {
  if (DRY) { console.log(`        (a secco: nessuna attesa per ${cosa})`); return; }
  for (let i = 0; i < 20; i++) {
    const j = await get(
      base,
      `/${id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`,
    );
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR' || j.status_code === 'EXPIRED') {
      throw new Error(`${cosa}: contenitore ${id} in stato ${j.status_code} — ${j.status || 'nessun dettaglio'}`);
    }
    await new Promise((s) => setTimeout(s, 3000));
  }
  throw new Error(`${cosa}: contenitore ${id} non pronto dopo 60 secondi`);
}

/**
 * Le pubblicazioni rimaste nelle 24 ore.
 *
 * Il conteggio di Instagram è per PUBBLICAZIONE, non per immagine: il carosello
 * ne vale una sola. Se la quota non basta ci si ferma PRIMA di cominciare,
 * perché un carosello pubblicato e sei storie rifiutate a metà sono peggio di
 * niente pubblicato.
 */
export async function quotaResidua(base, user, token) {
  if (DRY) { console.log('        (a secco: quota non interrogata)'); return null; }
  try {
    const j = await get(
      base,
      `/${user}/content_publishing_limit?fields=quota_usage,config&access_token=${encodeURIComponent(token)}`,
    );
    const d = (j.data && j.data[0]) || {};
    const usate = Number(d.quota_usage || 0);
    const tetto = Number((d.config && d.config.quota_total) || IG_DAILY_QUOTA);
    console.log(`  quota Instagram: ${usate}/${tetto} nelle ultime 24 ore`);
    return tetto - usate;
  } catch (e) {
    // Non si blocca la giornata perché un campo diagnostico non risponde, ma
    // l'avviso resta visibile nel run.
    console.warn(`::warning::quota non interrogabile (${String(e)}): si procede.`);
    return null;
  }
}
