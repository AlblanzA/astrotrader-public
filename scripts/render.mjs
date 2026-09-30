import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSky, atpBuildCardSVG } from './lib.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const repo = join(__dir, '..');
await initWasm(readFileSync(join(repo,'node_modules/@resvg/resvg-wasm/index_bg.wasm')));
const fdir = join(repo,'ig/fonts');
const fonts = ['Gloock-Regular','CrimsonPro-Regular','CrimsonPro-Italic','IBMPlexMono-Regular','IBMPlexMono-Bold']
  .map(f=>readFileSync(join(fdir,f+'.ttf')));
const data = await getSky();
console.log('SKY:', JSON.stringify(data));
function render(portrait,out){
  const svg = atpBuildCardSVG(data,{portrait});
  const r = new Resvg(svg,{font:{fontBuffers:fonts,loadSystemFonts:false,defaultFontFamily:'CrimsonPro'}});
  writeFileSync(join(repo,out), r.render().asPng());
  console.log('wrote',out);
}
// La card con i mercati NON si rende più su card-feed.png / card-story.png:
// Make (Facebook + LinkedIn) legge quei due file a indirizzo fisso, quindi lì
// va la copertina del carosello del giorno (vedi sotto). La card resta solo
// come file a parte, mai pubblicata.
render(false,'ig/card-mercati-feed.png');
render(true,'ig/card-mercati-story.png');

const RAW = 'https://raw.githubusercontent.com/AlblanzA/astrotrader-public/main/ig';

/* FEED PER MAKE (Facebook + LinkedIn quotidiani) — dal 30/9/2026 NON usa più
 * la card con i mercati (BULL/BEAR, ticker «Favored»): su Facebook e LinkedIn
 * valgono le stesse regole di Instagram, zero indicazioni di mercato. Il feed
 * porta quindi il testo del carosello del giorno (ig/social.json, captionLink)
 * e la sua copertina. La card con i mercati resta solo come file, non esce.
 * Se social.json manca, il feed non si scrive: meglio nessun post che un post
 * fuori regola (la prova a secco successiva ferma comunque il workflow). */
const social = JSON.parse(readFileSync(join(repo, 'ig/social.json'), 'utf8'));
const VIETATE = /\b(BULL|BEAR|Favored|risk-on|risk-off|buy|sell)\b/i;
for (const t of [social.caption, social.captionLink]) {
  const riga = String(t || '').split('\n').find((l) => !l.includes('Not financial advice') && VIETATE.test(l));
  if (!t || riga) { console.error(`::error::feed Make: testo mancante o fuori regola («${(riga || '').slice(0, 60)}»)`); process.exit(1); }
}
writeFileSync(join(repo,'ig/caption.txt'), social.caption, 'utf8');
console.log('wrote ig/caption.txt');
writeFileSync(join(repo,'ig/feed.json'), JSON.stringify({
  date: social.date || data.date || '',
  image: RAW + '/' + social.carousel[0],
  story: RAW + '/' + social.stories[0],
  caption: social.caption,
  captionLink: social.captionLink,
  updated: new Date().toISOString()
}, null, 2), 'utf8');
console.log('wrote ig/feed.json (testo e copertina del carosello, niente mercati)');
copyFileSync(join(repo, 'ig', social.carousel[0]), join(repo, 'ig/card-feed.png'));
copyFileSync(join(repo, 'ig', social.stories[0]), join(repo, 'ig/card-story.png'));
console.log('card-feed.png / card-story.png = copertina del carosello (immagine fissa letta da Make)');
