import json,time,urllib.request,sys,os
from concurrent.futures import ThreadPoolExecutor
API="https://stablehorde.net/api/v2"; H={"apikey":"0000000000","Content-Type":"application/json","Client-Agent":"astrotrader-posters:1:anon"}
def req(u,d=None):
    r=urllib.request.Request(API+u,data=json.dumps(d).encode() if d else None,headers=H,method="POST" if d else "GET")
    return json.load(urllib.request.urlopen(r,timeout=60))
ST=", classical white marble sculpture, editorial still life on a cream linen and ivory background, soft warm window light, gentle shadows, muted beige and gold palette, museum quality photograph, elegant, minimal, high detail"
NEG="text, letters, words, watermark, signature, logo, frame, border, people, person, face, nude, nsfw, blurry, cartoon, anime, deformed"
D={
 "aries":"a marble ram head with curled horns beside a golden fleece draped on a stone pedestal, dried red roses",
 "taurus":"a marble bull figurine resting on a stone pedestal, pearls, a bowl of ripe figs and a sprig of olive",
 "gemini":"two small marble twin busts of children side by side, an open antique book and a quill",
 "cancer":"a marble crab sculpture beside a silver crescent bowl of sea water, white shells and pearls",
 "leo":"a regal marble lion statue lying on a pedestal, golden sunlight, a laurel crown",
 "virgo":"a marble sheaf of wheat and a small marble hand holding grain, linen cloth, dried lavender",
 "libra":"an antique brass balance scale in perfect equilibrium beside a marble column fragment and roses",
 "scorpio":"a bronze scorpion sculpture on dark marble, a black obsidian mirror, deep red rose petals",
 "sagittarius":"a marble bow and golden arrows resting on a pedestal, an antique globe and a travel map",
 "capricorn":"a marble sea-goat sculpture with spiral fish tail on a stone mountain base, an hourglass",
 "aquarius":"a marble amphora pouring clear water into a shallow stone basin, silver stars",
 "pisces":"two marble fish swimming in opposite directions joined by a golden cord, seashells and soft water",
 "conjunction":"two brass spheres touching on a marble table beside an antique astrolabe",
 "sextile":"an antique brass hexagram compass drawing on parchment with a marble geometric solid",
 "square":"a brass carpenter square and an antique compass on a marble block, sharp right angle light",
 "trine":"an antique brass triangle instrument and three marble spheres arranged in harmony",
 "opposition":"two marble busts facing each other across a long table, a brass balance between them",
 "quincunx":"an antique brass astrolabe slightly askew, a marble pentagon tile and a single key",
}
def run(k):
    if os.path.exists(f"img/{k}_0.webp"): print(k,"già"); return
    body={"prompt":D[k]+ST+" ### "+NEG,"params":{"width":832,"height":1024,"steps":28,"cfg_scale":6,"sampler_name":"k_dpmpp_2m","karras":True,"seed":"11","n":2},
          "nsfw":False,"censor_nsfw":True,"r2":True,"models":["AlbedoBase XL (SDXL)"]}
    try: j=req("/generate/async",body)["id"]
    except Exception as e: print(k,"submit err",e,flush=True); return
    t0=time.time()
    while True:
        time.sleep(12)
        try: c=req(f"/generate/check/{j}")
        except Exception: continue
        if c.get("done"): break
        if time.time()-t0>3000: print(k,"timeout",flush=True); return
    for i,g in enumerate(req(f"/generate/status/{j}")["generations"]):
        urllib.request.urlretrieve(g["img"],f"img/{k}_{i}.webp")
    print(k,"ok",int(time.time()-t0),flush=True)
with ThreadPoolExecutor(6) as ex: list(ex.map(run,sys.argv[1:] or list(D)))
