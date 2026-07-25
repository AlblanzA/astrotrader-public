import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSky, atpBuildCardSVG, buildCaption } from './lib.mjs';

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
render(false,'ig/card-feed.png');
render(true,'ig/card-story.png');

const RAW = 'https://raw.githubusercontent.com/AlblanzA/astrotrader-public/main/ig';
const caption = buildCaption(data);
const captionLink = buildCaption(data,{clickableLink:true});
writeFileSync(join(repo,'ig/caption.txt'), caption, 'utf8');
console.log('wrote ig/caption.txt');
writeFileSync(join(repo,'ig/feed.json'), JSON.stringify({
  date: data.date || '',
  image: RAW + '/card-feed.png',
  story: RAW + '/card-story.png',
  caption: caption,
  captionLink: captionLink,
  updated: new Date().toISOString()
}, null, 2), 'utf8');
console.log('wrote ig/feed.json');
