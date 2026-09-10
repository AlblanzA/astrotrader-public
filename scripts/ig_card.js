/* ig_card.js - AstroTrader Pro daily card builder (SVG). Pure ASCII source. */
var DOT='\u00B7', MDASH='\u2014', ELL='\u2026';
var ATP_ASPECT_WORD = {};
ATP_ASPECT_WORD['\u25B3']='trine'; ATP_ASPECT_WORD['\u25B2']='trine';
ATP_ASPECT_WORD['\u25A1']='square'; ATP_ASPECT_WORD['\u2610']='square';
ATP_ASPECT_WORD['\u260C']='conjunction'; ATP_ASPECT_WORD['\u260D']='opposition';
ATP_ASPECT_WORD['\u26B9']='sextile'; ATP_ASPECT_WORD['\u2736']='sextile'; ATP_ASPECT_WORD['\u2606']='sextile';
var ATP_GLYPH_STRIP = /[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\u25A0-\u25FF\u2600-\u26FF\uFE0F\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1FAFF}]/gu;
function _clean(s){ return (s||'').replace(/\s+/g,' ').trim(); }
function _hasLetters(s){ return /[A-Za-z0-9$]/.test(s||''); }
/* Whitelist pubblica degli strumenti, la stessa del generatore: serve a
   riconoscere la riga degli strumenti dal contenuto invece che dall'etichetta,
   che cambia con il tono del giorno e con la lingua del canale. */
var ATP_WL_RE = /\b(SPX|NDX|NVDA|AAPL|TSLA|BTC|ETH|GOLD|EURUSD|DAX|OIL)\b/;
/* La riga della lettura per gruppo cita gli stessi simboli ma accanto a un
   regime: senza questa esclusione verrebbe scambiata per la riga degli
   strumenti e finirebbe sulla card al posto suo. */
var ATP_REGIME_RE = /\b(BULL|BEAR|NEUTRAL|OPENING|FRICTION|RESET|QUIET)\b/;
function atpParseSky(text){
  var lines = String(text||'').split('\n').filter(function(x){return x.trim();});
  var out = { date:'', shortHead:'', shortTone:'', orb:'', weight:'', lunation:'', assetsLabel:'', assets:'', sectors:'', longTone:'', longHead:'', nations:'', signal:'neutral' };
  for (var i=0;i<lines.length;i++){
    var ln = lines[i];
    if (/Short-term/i.test(ln)){
      /* Il generatore ora scrive: "Frase in lingua (glifi) DOT orb X° DOT
         weight N/5 <emoji> tono". Due conseguenze per chi legge:
         - la prima parentesi non contiene piu' l'orbe ma i glifi, quindi
           l'orbe va cercato per etichetta e non per posizione;
         - il peso 1-5 e' un dato nuovo e va portato fino alla card, perche'
           serve proprio a far vedere quanto conta l'aspetto del giorno. */
      var c = ln.split(':').slice(1).join(':');
      for (var g in ATP_ASPECT_WORD){ if (c.indexOf(g)>=0){ c = c.split(g).join(' '+ATP_ASPECT_WORD[g]+' '); } }
      var mo = c.match(/([\d.]+)\s*°/); out.orb = mo ? (mo[1]+'°') : '';
      var mw = c.match(/(\d)\s*\/\s*5/); out.weight = mw ? mw[1] : '';
      /* Il tono e' cio' che resta dopo il peso: funziona anche in giapponese o
         in arabo, dove un'espressione regolare su [A-Za-z] non troverebbe nulla. */
      var segs = c.split('·');
      var tail = segs[segs.length-1] || '';
      var afterW = tail.split(/\d\s*\/\s*5/);
      out.shortTone = _clean((afterW.length>1?afterW[1]:tail).replace(ATP_GLYPH_STRIP,' '));
      var head = (segs[0]||'').replace(/\([^)]*\)/g,' ').replace(ATP_GLYPH_STRIP,' ');
      out.shortHead = _clean(head);
      /* Giornata senza aspetti stretti: non c'e' orbe ne' peso da mostrare, e
         la riga e' gia' una frase compiuta. */
      if (/no aspect|background sky/i.test(c)){
        out.shortHead = _clean(c.replace(ATP_GLYPH_STRIP,' '));
        out.orb=''; out.weight=''; out.shortTone='';
      }
    } else if (!out.assets && ln.indexOf(':')>0 && ATP_WL_RE.test(ln)
               && !/astrotraderpro/i.test(ln) && !ATP_REGIME_RE.test(ln)){
      /* La riga degli strumenti cambia etichetta con il tono del giorno
         (Favored / Under pressure / new cycle) e con la lingua, quindi cercarla
         per etichetta significava perderla nei giorni di congiunzione. Si
         riconosce invece da cio' che contiene: un simbolo della whitelist
         pubblica. Il link e' escluso perche' e' l'altra riga con i due punti. */
      var parts = ln.split(':'); out.assetsLabel = _clean(parts[0].replace(ATP_GLYPH_STRIP,' '));
      var rest = parts.slice(1).join(':');
      var sect = rest.match(/\(([^)]*)\)/); out.sectors = sect ? _clean(sect[1]) : '';
      out.assets = _clean(rest.replace(/\([^)]*\)/g,' ').replace(ATP_GLYPH_STRIP,' '));
    } else if (/Long-term/i.test(ln)){
      /* Il lungo termine ora esce solo quando cambia, e porta con se' la frase
         dell'aspetto: buttarla via tenendo il solo tono ("risk-on") ricreerebbe
         esattamente la riga senza contenuto che si voleva eliminare. */
      var ltAll = ln.split(':').slice(1).join(':');
      var lt = ltAll.split(/[\u00B7\u2022]/);
      out.longTone = _clean((lt[lt.length-1]||'').replace(ATP_GLYPH_STRIP,' '));
      out.longHead = _clean((lt[0]||'').replace(/\([^)]*\)/g,' ').replace(ATP_GLYPH_STRIP,' '));
    } else if (/Nations/i.test(ln)){
      var nt = _clean(ln.split(':').slice(1).join(':').replace(ATP_GLYPH_STRIP,' '));
      out.nations = _hasLetters(nt) ? nt : '';
    } else if (i===0){
      /* La prima riga puo' portare l'etichetta di sizigia ("Mar 3 · Eclipse").
         Va tenuta separata dalla data: nella card la data e' in corpo 96 e non
         e' troncata, quindi un'aggiunta la manderebbe fuori margine. */
      var d0 = _clean(ln.replace(ATP_GLYPH_STRIP,' ')).split('·');
      out.date = _clean(d0[0]);
      out.lunation = d0.length>1 ? _clean(d0.slice(1).join('·')) : '';
    }
  }
  if(!out.date){
    var d1 = _clean((lines[0]||'').replace(ATP_GLYPH_STRIP,' ')).split('·');
    out.date = _clean(d1[0]);
    if(!out.lunation && d1.length>1) out.lunation = _clean(d1.slice(1).join('·'));
  }
  var t = (out.shortTone+' '+out.longTone).toLowerCase();
  if (/risk-on|lift|favored|bull/.test(t) && !/risk-off|tension|choppy/.test(t)) out.signal='bull';
  else if (/risk-off|tension|choppy|caution|pressure|bear/.test(t)) out.signal='bear';
  else out.signal='neutral';
  return out;
}
function _xml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _stars(w,h,n,seed){
  var s=''; var x=seed||1234567;
  function rnd(){ x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)/4294967296); }
  for (var i=0;i<n;i++){ var px=(rnd()*w)|0, py=(rnd()*h)|0, r=rnd()<0.8?1:2, o=(0.35+rnd()*0.5).toFixed(2);
    s+='<circle cx="'+px+'" cy="'+py+'" r="'+r+'" fill="#cfd6ec" opacity="'+o+'"/>'; }
  return s;
}
function _ell(s,max){ s=String(s||''); return s.length>max ? s.slice(0,max-1)+ELL : s; }
function atpBuildCardSVG(data, opts){
  opts = opts||{};
  var W=1080, H=opts.portrait?1920:1350;
  var NAVY_T='#141e40', NAVY_B='#060a1a', GOLD='#E8C96A', GOLDL='#F8E49E', CREAM='#F4EEDE', DIM='#aeb6cf';
  var GREEN='#78C896', RED='#D67878';
  var sig = data.signal||'neutral';
  var sigColor = sig==='bull'?GREEN : sig==='bear'?RED : GOLD;
  var sigLabel = sig==='bull'?'BULL' : sig==='bear'?'BEAR' : 'NEUTRAL';
  var sigMark = sig==='bull'?'M -12 8 L 0 -10 L 12 8 Z' : sig==='bear'?'M -12 -8 L 12 -8 L 0 10 Z' : 'M -12 -3 L 12 -3 L 12 3 L -12 3 Z';
  var cx=W/2;
  var topY = opts.portrait?300:170;
  function ctext(y,txt,size,fill,font,ls){
    return '<text x="'+cx+'" y="'+y+'" font-family="'+(font||'CrimsonPro')+'" font-size="'+size+'" fill="'+fill+'" text-anchor="middle"'+(ls?(' letter-spacing="'+ls+'"'):'')+'>'+_xml(txt)+'</text>';
  }
  var s='';
  s+='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">';
  s+='<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+NAVY_T+'"/><stop offset="1" stop-color="'+NAVY_B+'"/></linearGradient></defs>';
  s+='<rect width="'+W+'" height="'+H+'" fill="url(#bg)"/>';
  s+=_stars(W,H,140,99173);
  s+='<path d="M '+(cx-150)+' '+topY+' A 150 150 0 0 1 '+(cx+150)+' '+topY+'" fill="none" stroke="'+GOLD+'" stroke-width="4"/>';
  s+=ctext(topY+70,'ASTROTRADER PRO'+String.fromCharCode(8482)+'  '+DOT+'  DAILY SKY',30,GOLD,'IBMPlexMono',8);
  s+='<line x1="'+(cx-70)+'" y1="'+(topY+92)+'" x2="'+(cx+70)+'" y2="'+(topY+92)+'" stroke="'+GOLD+'" stroke-width="3"/>';
  s+=ctext(topY+185, data.date||'', 96, CREAM, 'Gloock');
  /* Novilunio, plenilunio o eclissi: l'unico caso in cui la Luna e' il fatto
     del giorno, quindi va detto in copertina e non nascosto nel testo. */
  if(data.lunation){ s+=ctext(topY+232, String(data.lunation).toUpperCase(), 30, GOLD, 'IBMPlexMono', 6); }
  /* --- Card GEOPOLITICA (5o giorno del ciclo): nazioni in evidenza, transito sotto --- */
  if(data.group && data.group.geo && data.group.items && data.group.items.length){
    var GG=data.group, gi2=GG.items, gn=gi2.length;
    var WINC='#C9B36A', ARR=String.fromCharCode(0x2192);
    s+=ctext(topY+295,'GEOPOLITICAL OUTLOOK',34,GOLDL,'IBMPlexMono',3);
    s+='<line x1="120" y1="'+(topY+330)+'" x2="'+(W-120)+'" y2="'+(topY+330)+'" stroke="#2a3556" stroke-width="2"/>';
    var gtop=topY+366, gbot=H-170, ggap=20;
    var grh=Math.min(250,(gbot-gtop-ggap*(gn-1))/gn);
    var gy=gtop, gpw=200, gph=54, gprx=W-90-36-gpw;
    for(var q=0;q<gn;q++){
      var it2=gi2[q];
      var gcol = it2.regime==='OPENING'?GREEN : it2.regime==='FRICTION'?RED : GOLD;
      s+='<rect x="90" y="'+gy+'" width="'+(W-180)+'" height="'+grh+'" rx="24" fill="#101832" stroke="#2a3556" stroke-width="2"/>';
      s+='<text x="130" y="'+(gy+grh*0.31)+'" font-family="Gloock" font-size="44" fill="'+GOLDL+'">'+_xml(_ell((it2.nations||[]).join(' · '),26))+'</text>';
      s+='<text x="130" y="'+(gy+grh*0.55)+'" font-family="CrimsonPro" font-size="28" fill="'+CREAM+'">'+_xml(_ell(it2.theme||'',54))+'</text>';
      s+='<text x="130" y="'+(gy+grh*0.74)+'" font-family="IBMPlexMono" font-size="24" fill="'+DIM+'">'+_xml(_ell(it2.aspect||'',44))+'</text>';
      if(it2.start&&it2.end){ s+='<text x="130" y="'+(gy+grh*0.90)+'" font-family="IBMPlexMono" font-size="23" fill="'+WINC+'">'+_xml(it2.start+'  '+ARR+'  '+it2.end)+'</text>'; }
      var gpy=gy+18;
      s+='<rect x="'+gprx+'" y="'+gpy+'" width="'+gpw+'" height="'+gph+'" rx="27" fill="none" stroke="'+gcol+'" stroke-width="3"/>';
      s+='<text x="'+(gprx+gpw/2)+'" y="'+(gpy+gph*0.66)+'" font-family="IBMPlexMono" font-size="24" fill="'+gcol+'" text-anchor="middle" letter-spacing="2">'+_xml(it2.regime)+'</text>';
      gy+=grh+ggap;
    }
    s+=ctext(H-110,'ASTROTRADERPRO.COM   '+DOT+'   @ASTROTRADERPROAPP',26,GOLD,'IBMPlexMono',4);
    s+=ctext(H-70,'Hypothetical themes '+MDASH+' not a forecast of real events',24,DIM,'CrimsonProItalic');
    s+='</svg>';
    return s;
  }
  if(data.group && data.group.items && data.group.items.length){
    var G=data.group, items=G.items, n=items.length;
    s+=ctext(topY+295,'SYMBOLIC READING '+MDASH+' '+String(G.label||'').toUpperCase(),34,GOLDL,'IBMPlexMono',3);
    s+='<line x1="120" y1="'+(topY+330)+'" x2="'+(W-120)+'" y2="'+(topY+330)+'" stroke="#2a3556" stroke-width="2"/>';
    var top=topY+366, bottom=H-170, gap=18;
    var rowH=Math.min(210,(bottom-top-gap*(n-1))/n);
    var big=rowH>150;
    var nameSize=big?50:42, pw=210, ph=64, prx=W-90-40-pw;
    var WINCOL='#C9B36A', ARROW=String.fromCharCode(0x2192);
    var ry=top;
    for(var gi=0;gi<n;gi++){
      var it=items[gi];
      var col = it.regime==='BULL'?GREEN : it.regime==='BEAR'?RED : GOLD;
      var det = it.quiet?'quiet sky':(it.pl+' '+it.asp+' '+(it.other||''));
      var win = (!it.quiet && it.start && it.end) ? (it.start+'  '+ARROW+'  '+it.end) : '';
      s+='<rect x="90" y="'+ry+'" width="'+(W-180)+'" height="'+rowH+'" rx="24" fill="#101832" stroke="#2a3556" stroke-width="2"/>';
      s+='<text x="130" y="'+(ry+rowH*(win?0.36:0.44))+'" font-family="Gloock" font-size="'+nameSize+'" fill="'+GOLDL+'">'+_xml(_ell(it.name||it.sym,22))+'</text>';
      s+='<text x="130" y="'+(ry+rowH*(win?0.61:0.76))+'" font-family="IBMPlexMono" font-size="'+(big?26:24)+'" fill="'+DIM+'">'+_xml(_ell(det,44))+'</text>';
      if(win){ s+='<text x="130" y="'+(ry+rowH*0.86)+'" font-family="IBMPlexMono" font-size="'+(big?24:22)+'" fill="'+WINCOL+'">'+_xml(win)+'</text>'; }
      var pry=ry+(rowH-ph)/2;
      s+='<rect x="'+prx+'" y="'+pry+'" width="'+pw+'" height="'+ph+'" rx="32" fill="none" stroke="'+col+'" stroke-width="4"/>';
      s+='<text x="'+(prx+pw/2)+'" y="'+(pry+ph*0.66)+'" font-family="IBMPlexMono" font-size="30" fill="'+col+'" text-anchor="middle" letter-spacing="3">'+it.regime+'</text>';
      ry+=rowH+gap;
    }
    s+=ctext(H-110,'ASTROTRADERPRO.COM   '+DOT+'   @ASTROTRADERPROAPP',26,GOLD,'IBMPlexMono',4);
    s+=ctext(H-70,'Educational '+MDASH+' not advice, not a recommendation, not a trading signal',24,DIM,'CrimsonProItalic');
    s+='</svg>';
    return s;
  }
  var y = topY+300;
  s+=ctext(y,'SHORT-TERM',30,GOLD,'IBMPlexMono',6); y+=70;
  s+=ctext(y, _ell(data.shortHead||'',30), 64, CREAM,'Gloock'); y+=58;
  /* Orbe e peso sulla stessa riga: separati, il peso sembrerebbe un'altra
     misura dello stesso dato invece che la sua importanza. */
  var orbLine = (data.orb?('orb '+data.orb):'') + ((data.orb&&data.weight)?'   '+DOT+'   ':'') + (data.weight?('weight '+data.weight+'/5'):'');
  if(orbLine){ s+=ctext(y,orbLine,34,DIM,'CrimsonPro'); y+=66; } else { y+=10; }
  y+=30;
  s+='<g transform="translate('+cx+','+y+')">';
  s+='<rect x="-200" y="-46" width="400" height="92" rx="46" fill="none" stroke="'+sigColor+'" stroke-width="4"/>';
  s+='<g transform="translate(-120,0)"><path d="'+sigMark+'" fill="'+sigColor+'"/></g>';
  s+='<text x="30" y="16" font-family="IBMPlexMono" font-size="44" fill="'+sigColor+'" text-anchor="middle" letter-spacing="4">'+sigLabel+'</text>';
  s+='</g>'; y+=110;
  if(data.assets){
    s+=ctext(y,(data.assetsLabel||'Watch').toUpperCase(),28,GOLD,'IBMPlexMono',4); y+=60;
    s+=ctext(y,_ell(data.assets,26),52,GOLDL,'Gloock'); y+=46;
    if(data.sectors){ s+=ctext(y,_ell(data.sectors,40),34,DIM,'CrimsonProItalic'); y+=56; }
  }
  y+=24;
  /* Il blocco lungo termine compare solo quando c'e' qualcosa da dire: da
     quando la riga esce unicamente nel giorno in cui l'aspetto generazionale
     cambia, un'intestazione fissa seguita da un trattino occuperebbe un quarto
     della card per dire niente. */
  if(data.longTone){
    s+='<line x1="'+(cx-180)+'" y1="'+y+'" x2="'+(cx+180)+'" y2="'+y+'" stroke="#2a3556" stroke-width="2"/>'; y+=54;
    s+=ctext(y,'LONG-TERM',26,GOLD,'IBMPlexMono',5); y+=50;
    s+=ctext(y,_ell(data.longTone,34),40,CREAM,'CrimsonPro'); y+=46;
  }
  if(data.nations){ y+=20; s+=ctext(y,'Nations: '+_ell(data.nations,40),34,DIM,'CrimsonPro'); }
  s+=ctext(H-110,'ASTROTRADERPRO.COM   '+DOT+'   @ASTROTRADERPROAPP',26,GOLD,'IBMPlexMono',4);
  s+=ctext(H-70,'Educational '+MDASH+' not advice, not a recommendation, not a trading signal',24,DIM,'CrimsonProItalic');
  s+='</svg>';
  return s;
}
export { atpParseSky, atpBuildCardSVG };
