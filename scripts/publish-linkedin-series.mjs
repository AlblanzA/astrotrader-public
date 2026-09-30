/* ===================================================================== *
 *  publish-linkedin-series.mjs — LinkedIn: le serie a immagini multiple
 * ===================================================================== *
 *
 * Si AGGIUNGE al post quotidiano che oggi esce via Make: non lo tocca.
 *
 * Formato: post a IMMAGINI MULTIPLE (content.multiImage), non documento PDF:
 * le immagini si sfogliano nel visualizzatore di LinkedIn e non esiste un file
 * da scaricare. Una sola immagine → content.media.
 *
 * Manifesto: /social/li/series.json sugli asset del Worker, stessa forma di
 * quello Instagram (id, at UTC, images[], text). Si pubblica UNA voce per giro,
 * la più vecchia maturata entro ATP_LI_WINDOW_H ore (default 8). Stato in
 * li/series-posted.json, committato dal workflow.
 *
 * Secret necessari (li crea l'utente, mai scritti qui né stampati):
 *   LINKEDIN_ACCESS_TOKEN  token OAuth con scope w_member_social (+ openid profile)
 *   LINKEDIN_AUTHOR_URN    facoltativo, es. urn:li:person:AbC123; se manca si
 *                          ricava da /v2/userinfo (serve lo scope openid+profile)
 * Il token di LinkedIn dura 60 giorni: il run fallisce in rosso quando scade.
 *
 * Prova senza pubblicare: ATP_DRY_RUN=1 ATP_NOW=2026-10-07T06:40:00Z node scripts/publish-linkedin-series.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.env.ATP_DRY_RUN === '1';
const TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || '';
const VERSION = process.env.LINKEDIN_VERSION || '202609';
const MANIFEST_URL = process.env.ATP_LI_URL
  || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/li/series.json';
const STATE = join(REPO, 'li', 'series-posted.json');
const WINDOW_H = Number(process.env.ATP_LI_WINDOW_H || 8);
const NOW = process.env.ATP_NOW ? Date.parse(process.env.ATP_NOW) : Date.now();

function annota(m) { console.error(`::error::${m}`); }
function muori(m) { annota(m); process.exit(1); }

/* Lessico LinkedIn: più largo di Instagram (qui «market», «trader» sono
   leciti), ma niente operativo/direzionale né prima persona plurale. */
const VIETATE = /\b(buy|sell|bull(ish)?|bear(ish)?|go long|go short|entry|stop[- ]loss|will rise|will fall|signal|we|our|us)\b|\$[A-Z]/i;
function lessico(t, id) {
  const disc = 'Not financial advice';
  for (const riga of String(t).split('\n')) {
    if (riga.includes(disc)) continue;
    const m = riga.match(VIETATE);
    if (m) muori(`${id}: parola vietata «${m[0]}» in «${riga.slice(0, 70)}»`);
  }
}

/* «little text»: questi caratteri vanno preceduti da \ o LinkedIn tronca. */
function littleText(s) { return String(s).replace(/([\\|{}@\[\]()<>#*_~])/g, '\\$1'); }

async function li(path, init = {}) {
  const r = await fetch('https://api.linkedin.com' + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'LinkedIn-Version': VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
      ...(init.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${path} → ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r;
}

async function autore() {
  if (process.env.LINKEDIN_AUTHOR_URN) return process.env.LINKEDIN_AUTHOR_URN;
  const r = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`userinfo → ${r.status}: imposta LINKEDIN_AUTHOR_URN o aggiungi lo scope openid profile`);
  const j = await r.json();
  return `urn:li:person:${j.sub}`;
}

async function caricaImmagine(owner, url, i) {
  const img = await fetch(url);
  if (!img.ok) throw new Error(`immagine ${url} → ${img.status}`);
  const bytes = Buffer.from(await img.arrayBuffer());
  const init = await (await li('/rest/images?action=initializeUpload', {
    method: 'POST', body: JSON.stringify({ initializeUploadRequest: { owner } }),
  })).json();
  const { uploadUrl, image } = init.value;
  const up = await fetch(uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}` }, body: bytes });
  if (!up.ok) throw new Error(`upload immagine ${i + 1} → ${up.status}`);
  console.log(`  immagine ${i + 1} caricata: ${image}`);
  return image;
}

async function main() {
  if (!DRY && !TOKEN) muori('LINKEDIN_ACCESS_TOKEN non impostato: serie LinkedIn non pubblicabili.');
  const r = await fetch(MANIFEST_URL + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) muori(`manifesto ${MANIFEST_URL} → HTTP ${r.status}`);
  const m = await r.json();
  const base = m.base || 'https://astrotraderpro.astrotraderproapp.workers.dev/social/';
  const stato = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
  const maturi = (m.posts || []).filter((p) => !stato[p.id]
    && Date.parse(p.at) <= NOW && NOW - Date.parse(p.at) <= WINDOW_H * 3600e3)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!maturi.length) {
    const next = (m.posts || []).filter((p) => !stato[p.id] && Date.parse(p.at) > NOW)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))[0];
    console.log(`Nessuna serie LinkedIn adesso. Prossima: ${next ? next.id + ' alle ' + next.at : 'nessuna'}`);
    return;
  }
  const p = maturi[0];
  lessico(p.text, p.id);
  const urls = p.images.map((x) => base + x);
  console.log(`LINKEDIN — ${p.id}, ${urls.length} immagini, ${p.text.length} caratteri`);
  if (DRY) {
    urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    console.log('  testo:\n' + p.text.split('\n').map((l) => '    ' + l).join('\n'));
    console.log('  (a secco: niente chiamate a LinkedIn)');
    return;
  }
  const owner = await autore();
  const ids = [];
  for (let i = 0; i < urls.length; i++) ids.push(await caricaImmagine(owner, urls[i], i));
  const content = ids.length === 1
    ? { media: { id: ids[0], altText: p.alt || 'AstroTrader Pro' } }
    : { multiImage: { images: ids.map((id, i) => ({ id, altText: `${p.alt || 'AstroTrader Pro'} ${i + 1}/${ids.length}` })) } };
  const res = await li('/rest/posts', {
    method: 'POST',
    body: JSON.stringify({
      author: owner,
      commentary: littleText(p.text),
      visibility: 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      content,
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });
  const postId = res.headers.get('x-restli-id') || '(id non restituito)';
  console.log(`  pubblicato: ${postId}`);
  stato[p.id] = { post: postId, at: new Date().toISOString() };
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(stato, null, 1) + '\n');
}

main().catch((e) => { annota(`LinkedIn: ${String(e && e.message || e)}`); process.exit(1); });
