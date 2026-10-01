#!/usr/bin/env node
/**
 * Storie 9:16 per le serie Instagram.
 *
 * Il post della serie è 1080×1350 (4:5). Ripubblicato tale e quale come storia,
 * Instagram lo ingrandisce fino a riempire il 9:16 e taglia i lati (tabella e
 * titolo mozzati: segnalato dall'utente il 1/10/2026). Qui si prepara una
 * versione 1080×1920: l'immagine intera al centro, sopra uno sfondo fatto con
 * la stessa immagine sfocata e scurita. Niente si perde.
 *
 * Uso nel workflow (prima di publish-series.mjs):
 *   node scripts/story-frames.mjs          → crea ig/story/<id>.jpg per le voci
 *                                            in uscita (finestra come la serie)
 *   node scripts/story-frames.mjs <id>...   → solo quelle voci (prove a mano)
 *   ATP_FRAMES_ALL=1                       → tutte le voci del manifesto
 * I file vanno poi committati: publish-series.mjs li usa via raw GitHub al sha
 * del commit (ATP_STORY_BASE), altrimenti ricade sull'immagine originale.
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(REPO_DIR, 'ig', 'story');
const MANIFEST_URL = process.env.ATP_SERIES_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/ig/series.json';
const NOW = process.env.ATP_NOW ? Date.parse(process.env.ATP_NOW) : Date.now();
const WINDOW_H = Number(process.env.ATP_SERIES_WINDOW_H || 18);
const AHEAD_H = 2;
const W = 1080, H = 1920;

export async function frame(buf) {
  const meta = await sharp(buf).metadata();
  const fgW = W;
  const fgH = Math.round((meta.height / meta.width) * fgW);
  const fg = await sharp(buf).resize(fgW, fgH).toBuffer();
  const bg = await sharp(buf)
    .resize(W, H, { fit: 'cover' })
    .blur(45)
    .modulate({ brightness: 0.4 })
    .toBuffer();
  // ombra leggera sotto l'immagine, per staccarla dallo sfondo
  const top = Math.round((H - fgH) / 2);
  const shadow = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><filter id="s" x="-10%" y="-10%" width="120%" height="120%">`
    + `<feGaussianBlur stdDeviation="18"/></filter></defs>`
    + `<rect x="0" y="${top + 6}" width="${W}" height="${fgH}" fill="black" opacity="0.55" filter="url(#s)"/></svg>`);
  return sharp(bg)
    .composite([{ input: shadow, top: 0, left: 0 }, { input: fg, top, left: 0 }])
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function main() {
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error(`manifesto → HTTP ${r.status}`);
  const m = await r.json();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const ids = process.argv.slice(2);
  const voci = (m.posts || []).filter((p) => p.story && !p.storiesOnly).filter((p) => {
    if (ids.length) return ids.includes(p.id);
    if (process.env.ATP_FRAMES_ALL === '1') return true;
    const t = Date.parse(p.at);
    return t <= NOW + AHEAD_H * 3600e3 && NOW - t <= WINDOW_H * 3600e3;
  });
  mkdirSync(OUT_DIR, { recursive: true });
  let fatti = 0;
  for (const p of voci) {
    const out = join(OUT_DIR, `${p.id}.jpg`);
    if (existsSync(out)) continue;
    const rel = p.images[0];
    const url = /^https?:\/\//.test(rel) ? rel : base + rel;
    const img = await fetch(url);
    if (!img.ok) { console.warn(`::warning::${p.id}: immagine ${url} → HTTP ${img.status}`); continue; }
    writeFileSync(out, await frame(Buffer.from(await img.arrayBuffer())));
    console.log(`storia 9:16 pronta: ig/story/${p.id}.jpg`);
    fatti++;
  }
  console.log(`${fatti} storie 9:16 create (${voci.length} voci considerate)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
