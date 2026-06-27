import sodium from 'libsodium-wrappers';
const TOKEN=process.env.IG_ACCESS_TOKEN, PAT=process.env.GH_PAT, REPO=process.env.GH_REPO;
const r=await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(TOKEN)}`);
const j=await r.json();
if(!j.access_token){ console.log('refresh failed', JSON.stringify(j)); process.exit(0); }
console.log('refreshed, expires_in', j.expires_in);
if(!PAT){ console.log('no GH_PAT -> cannot persist new token; set GH_PAT to auto-rotate'); process.exit(0); }
const H={'Authorization':'Bearer '+PAT,'Accept':'application/vnd.github+json','User-Agent':'atp-bot'};
const pk=await (await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`,{headers:H})).json();
await sodium.ready;
const enc=sodium.crypto_box_seal(sodium.from_string(j.access_token), sodium.from_base64(pk.key, sodium.base64_variants.ORIGINAL));
const body={encrypted_value:sodium.to_base64(enc, sodium.base64_variants.ORIGINAL), key_id:pk.key_id};
const up=await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/IG_ACCESS_TOKEN`,{method:'PUT',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(body)});
console.log('secret update status', up.status);
