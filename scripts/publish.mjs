import { getSky, buildCaption } from './lib.mjs';
const GRAPH='https://graph.instagram.com/v21.0';
const USER=process.env.IG_USER_ID, TOKEN=process.env.IG_ACCESS_TOKEN;
const REPO=process.env.GH_REPO||'AlblanzA/astrotrader-public';
const REF=process.env.IMG_REF||'main';
const base=`https://raw.githubusercontent.com/${REPO}/${REF}/ig`;
const feedUrl=`${base}/card-feed.png`, storyUrl=`${base}/card-story.png`;

async function ig(path, body){
  const fd=new URLSearchParams(body); fd.set('access_token',TOKEN);
  const r=await fetch(GRAPH+path,{method:'POST',body:fd}); const j=await r.json();
  if(j&&j.error) throw new Error(path+': '+JSON.stringify(j.error));
  return j;
}
async function waitFin(id){
  for(let i=0;i<20;i++){
    const r=await fetch(`${GRAPH}/${id}?fields=status_code&access_token=${encodeURIComponent(TOKEN)}`);
    const j=await r.json();
    if(j.status_code==='FINISHED')return; if(j.status_code==='ERROR')throw new Error('container ERROR '+id);
    await new Promise(s=>setTimeout(s,3000));
  }
}
const d=await getSky();
const caption=buildCaption(d);
// FEED
const fc=await ig(`/${USER}/media`,{image_url:feedUrl,caption});
await waitFin(fc.id);
const fp=await ig(`/${USER}/media_publish`,{creation_id:fc.id});
console.log('FEED published id', fp.id);
// STORY
try{
  const sc=await ig(`/${USER}/media`,{image_url:storyUrl,media_type:'STORIES'});
  await waitFin(sc.id);
  const sp=await ig(`/${USER}/media_publish`,{creation_id:sc.id});
  console.log('STORY published id', sp.id);
}catch(e){ console.log('STORY skipped:', String(e)); }
