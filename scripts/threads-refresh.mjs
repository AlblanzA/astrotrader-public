// Settimanale: rinnova il token Threads a 60 giorni (th_refresh_token) e, se
// GH_PAT c'e', ruota il secret THREADS_ACCESS_TOKEN del repository.
// Il token va rinnovato dopo almeno 24 h dalla creazione e prima della scadenza.
const TOKEN = process.env.THREADS_ACCESS_TOKEN, PAT = process.env.GH_PAT, REPO = process.env.GH_REPO;
if (!TOKEN) { console.log('THREADS_ACCESS_TOKEN non impostato: niente da rinnovare.'); process.exit(0); }

const r = await fetch(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(TOKEN)}`);
const j = await r.json();
if (!j.access_token) { console.log('Rinnovo non applicato (token <24h o gia fresco):', JSON.stringify(j)); process.exit(0); }
console.log('Token Threads rinnovato, scade fra (s):', j.expires_in);

if (!PAT) { console.log('GH_PAT assente: il token rinnovato non puo essere salvato in automatico.'); process.exit(0); }

const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const sodium = require('libsodium-wrappers');
await sodium.ready;

const H = { Authorization: 'Bearer ' + PAT, Accept: 'application/vnd.github+json', 'User-Agent': 'atp-bot', 'X-GitHub-Api-Version': '2022-11-28' };
const pk = await (await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`, { headers: H })).json();
if (!pk.key) { console.log('Chiave pubblica del repository non leggibile:', JSON.stringify(pk)); process.exit(1); }
const enc = sodium.crypto_box_seal(sodium.from_string(j.access_token), sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL));
const body = { encrypted_value: sodium.to_base64(enc, sodium.base64_variants.ORIGINAL), key_id: pk.key_id };
const up = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/THREADS_ACCESS_TOKEN`, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log('Secret THREADS_ACCESS_TOKEN, esito aggiornamento:', up.status);
