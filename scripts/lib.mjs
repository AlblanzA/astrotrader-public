import { atpParseSky, atpBuildCardSVG } from './ig_card.js';
export { atpParseSky, atpBuildCardSVG };

export const TG_PREVIEW = process.env.TG_PREVIEW_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/api/tg-preview?lang=en';

export async function getSky(){
  const r = await fetch(TG_PREVIEW);
  const j = await r.json();
  const sky = atpParseSky((j && j.text) || '');
  if (j && j.group) sky.group = j.group;
  return sky;
}

/* Il link cliccabile dipende dal canale:
   - Instagram: nelle caption i link NON sono cliccabili -> "link in bio"
   - Facebook / LinkedIn / Telegram / X: URL cliccabile nel testo
   (Nelle STORIE Instagram lo sticker link non e' aggiungibile via API: Meta
    blocca gli elementi interattivi alle app di terze parti. Va messo a mano.) */
export function buildCaption(d, opts){
  const cb = String.fromCodePoint(0x1F52E), ch = String.fromCodePoint(0x1F4C8),
        lk = String.fromCodePoint(0x1F517), dash = String.fromCodePoint(0x2014),
        arr = String.fromCodePoint(0x2192), tm = String.fromCodePoint(0x2122);
  const L=[];
  L.push(`${cb} AstroTrader Pro${tm} ${dash} Daily Sky ${ch}`);
  L.push('');
  /* Sizigia in testa: e' l'unica circostanza in cui la Luna e' notizia, e chi
     scorre il feed legge la prima riga e poco altro. */
  L.push(`${d.date||'Today'}${d.lunation?` ${dash} ${d.lunation}`:''} ${dash} Short-term: ${d.shortHead||''}.`);
  /* Orbe e peso in chiaro: un aspetto a 0,1 gradi e uno a 1,9 non pesano
     uguale, e senza il numero il lettore non ha modo di distinguerli. */
  const meas=[d.orb?`orb ${d.orb}`:'', d.weight?`weight ${d.weight}/5`:'', d.shortTone||''].filter(Boolean);
  if(meas.length) L.push(meas.join(` ${dash} `)+'.');
  if(d.assets) L.push(`${d.assetsLabel||'Watch'}: ${d.assets}${d.sectors?` (${d.sectors})`:''}.`);
  /* «Read: Bull on indices, ETFs and commodities» era un verdetto direzionale
     su un paniere, cioe' la forma di una raccomandazione, e per giunta parlava
     di ETF che nei post pubblici non compaiono piu'. Il lungo termine esce solo
     quando cambia davvero: se non c'e', la riga non si scrive. */
  if(d.longTone) L.push(`Long-term: ${d.longHead?`${d.longHead} ${dash} `:''}${d.longTone}.`);
  if(d.group && d.group.geo && d.group.items && d.group.items.length){
    L.push('');
    L.push(`${String.fromCodePoint(0x1F30D)} Geopolitical Outlook:`);
    d.group.items.forEach(it=>{
      const win=(it.start&&it.end)?`, ${it.start}${String.fromCodePoint(0x2192)}${it.end}`:'';
      L.push(`${(it.nations||[]).join(' · ')} ${dash} ${it.regime}`);
      L.push(`   ${it.theme} (${it.aspect}${win})`);
    });
    L.push('');
    L.push('Hypothetical themes from mundane tradition — not a forecast of real events.');
  } else if(d.group && d.group.items && d.group.items.length){
    L.push('');
    /* Conformita' (11 ago 2026): era «Astrological … Prediction» con i ticker
       preceduti da $. Titolo che annuncia una previsione + cashtag + regime
       Bull/Bear e' la forma tipica di una raccomandazione operativa, non di un
       contenuto educativo. Ora e' dichiarato come lettura simbolica e il $
       davanti al ticker non si usa piu'. */
    L.push(`${String.fromCodePoint(0x1F3AF)} Symbolic reading ${dash} ${d.group.label}:`);
    d.group.items.forEach(it=>{
      const tag=it.sym;
      const win=(!it.quiet && it.start && it.end)?`, ${it.start}${String.fromCodePoint(0x2192)}${it.end}`:'';
      const det=it.quiet?'quiet sky':`${it.pl} ${it.asp} ${it.other}${win}`;
      L.push(`${tag} ${dash} ${it.regime} (${det})`);
    });
  }
  L.push('');
  const clickable = !!(opts && opts.clickableLink);
  /* Una sola chiamata all'azione, e dice cosa si trova arrivando: «follow &
     share» chiedeva un gesto senza offrire una destinazione. */
  L.push(clickable
    ? `${lk} Free natal chart and sky map ${arr} https://astrotraderpro.com`
    : `${lk} Free natal chart and sky map ${arr} link in bio (astrotraderpro.com)`);
  L.push('');
  /* Il post viaggia da solo: chi lo legge non ha davanti i disclaimer del
     sito, quindi l'avvertenza deve essere completa qui. */
  L.push('Educational content on classical financial-astrology cycles. Not financial advice, not a recommendation, not a trading signal. Astrology\'s predictive value is not scientifically proven.');
  L.push('');
  /* Tolti #AstroTrading #Trading #Investing: etichettano il post come
     contenuto operativo.
     Da sette a due: una coda di sette etichette non porta lettori, segnala
     soltanto che il post e' automatico. Restano quella che dice di cosa si
     parla e quella che tiene in chiaro la natura del contenuto. */
  L.push('#FinancialAstrology #NotFinancialAdvice');
  return L.join('\n');
}
