// Weekly: refresh the 60-day IG token; if GH_PAT set, rotate the IG_ACCESS_TOKEN repo secret.
const TOKEN=process.env.IG_ACCESS_TOKEN, PAT=process.env.GH_PAT, REPO=process.env.GH_REPO;

const r=await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(TOKEN)}`);
const j=await r.json();
if(!j.access_token){ console.log('Refresh not applied (token may be <24h old or already fresh):', JSON.stringify(j)); process.exit(0); }
console.log('Token refreshed, expires_in', j.expires_in);

if(!PAT){ console.log('No GH_PAT set -> cannot persist rotated token automatically.'); process.exit(0); }

// load libsodium via CJS (ESM build of libsodium-wrappers is broken in Node)
const { createRequire } = await import('module');
const require = createRequire(import.meta.url);
const sodium = require('libsodium-wrappers');
await sodium.ready;

const H={'Authorization':'Bearer '+PAT,'Accept':'application/vnd.github+json','User-Agent':'atp-bot','X-GitHub-Api-Version':'2022-11-28'};
const pk=await (await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`,{headers:H})).json();
if(!pk.key){ console.log('Could not read repo public key:', JSON.stringify(pk)); process.exit(1); }
const enc=sodium.crypto_box_seal(sodium.from_string(j.access_token), sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL));
const body={encrypted_value:sodium.to_base64(enc, sodium.base64_variants.ORIGINAL), key_id:pk.key_id};
const up=await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/IG_ACCESS_TOKEN`,{method:'PUT',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(body)});
console.log('Secret IG_ACCESS_TOKEN update status:', up.status);
