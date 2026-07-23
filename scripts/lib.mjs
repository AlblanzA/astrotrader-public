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

export function buildCaption(d){
  const cb = String.fromCodePoint(0x1F52E), ch = String.fromCodePoint(0x1F4C8),
        lk = String.fromCodePoint(0x1F517), dash = String.fromCodePoint(0x2014),
        arr = String.fromCodePoint(0x2192), tm = String.fromCodePoint(0x2122);
  const sig = d.signal==='bull'?'Bull':d.signal==='bear'?'Bear':'Neutral';
  const L=[];
  L.push(`${cb} AstroTrader Pro${tm} ${dash} Daily Sky ${ch}`);
  L.push('');
  L.push(`${d.date||'Today'} ${dash} Short-term: ${d.shortHead||''}${d.orb?` (orb ${d.orb})`:''}.`);
  if(d.assets) L.push(`${d.assetsLabel||'Watch'}: ${d.assets}${d.sectors?` (${d.sectors})`:''}.`);
  L.push(`Read: ${sig} on indices, ETFs and commodities. Long-term: ${d.longTone||'-'}.`);
  if(d.group && d.group.items && d.group.items.length){
    L.push('');
    L.push(`${String.fromCodePoint(0x1F3AF)} Astrological ${d.group.label} Prediction:`);
    d.group.items.forEach(it=>{
      const tag=(d.group.cash?'$':'')+it.sym;
      const win=(!it.quiet && it.start && it.end)?`, ${it.start}${String.fromCodePoint(0x2192)}${it.end}`:'';
      const det=it.quiet?'quiet sky':`${it.pl} ${it.asp} ${it.other}${win}`;
      L.push(`${tag} ${dash} ${it.regime} (${det})`);
    });
  }
  L.push('');
  L.push(`${lk} App & world map ${arr} link in bio (astrotraderpro.com)`);
  L.push('');
  L.push('For educational and entertainment purposes only. Not investment advice.');
  L.push('');
  L.push('#FinancialAstrology #AstroTrading #MarketAstrology #Trading #StockMarket #Astrology #Commodities #ETF #Investing #PlanetaryCycles #AstroFinance');
  return L.join('\n');
}
