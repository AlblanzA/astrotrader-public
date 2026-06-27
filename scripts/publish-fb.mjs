// Publish the daily card to a Facebook Page (feed photo) via Graph API.
import { getSky, buildCaption } from './lib.mjs';
const PAGE=process.env.FB_PAGE_ID, TOKEN=process.env.FB_PAGE_TOKEN;
const REPO=process.env.GH_REPO||'AlblanzA/astrotrader-public';
const REF=process.env.IMG_REF||'main';
const img=`https://raw.githubusercontent.com/${REPO}/${REF}/ig/card-feed.png`;
if(!PAGE||!TOKEN){ console.log('FB_PAGE_ID / FB_PAGE_TOKEN not set -> skipping Facebook.'); process.exit(0); }
const d=await getSky();
const caption=buildCaption(d);
const fd=new URLSearchParams({ url: img, caption, access_token: TOKEN });
const r=await fetch(`https://graph.facebook.com/v21.0/${PAGE}/photos`,{ method:'POST', body: fd });
const j=await r.json();
if(j.error){ console.log('FB error:', JSON.stringify(j.error)); process.exit(1); }
console.log('FB photo posted, id', j.id||j.post_id);
