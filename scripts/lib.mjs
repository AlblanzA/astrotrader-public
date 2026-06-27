import { atpParseSky, atpBuildCardSVG } from './ig_card.js';
export { atpParseSky, atpBuildCardSVG };

export const TG_PREVIEW = process.env.TG_PREVIEW_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/api/tg-preview?lang=en';

export async function getSky(){
  const r = await fetch(TG_PREVIEW);
  const j = await r.json();
  return atpParseSky((j && j.text) || '');
}

export function buildCaption(d){
  const cb = String.fromCodePoint(0x1F52E), ch = String.fromCodePoint(0x1F4C8),
        lk = String.fromCodePoint(0x1F517), dash = String.fromCodePoint(0x2014),
        arr = String.fromCodePoint(0x2192);
  const sig = d.signal==='bull'?'Bull':d.signal==='bear'?'Bear':'Neutral';
  const L=[];
  L.push(`${cb} AstroTrader Pro ${dash} Daily Sky ${ch}`);
  L.push('');
  L.push(`${d.date||'Today'} ${dash} Short-term: ${d.shortHead||''}${d.orb?` (orb ${d.orb})`:''}.`);
  if(d.assets) L.push(`${d.assetsLabel||'Watch'}: ${d.assets}${d.sectors?` (${d.sectors})`:''}.`);
  L.push(`Read: ${sig} on indices, ETFs and commodities. Long-term: ${d.longTone||'-'}.`);
  L.push('');
  L.push(`${lk} App & world map ${arr} link in bio (astrotraderpro.com)`);
  L.push('');
  L.push('For educational and entertainment purposes only. Not investment advice.');
  L.push('');
  L.push('#FinancialAstrology #AstroTrading #MarketAstrology #Trading #StockMarket #Astrology #Commodities #ETF #Investing #PlanetaryCycles #AstroFinance');
  return L.join('\n');
}
