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
function atpParseSky(text){
  var lines = String(text||'').split('\n').filter(function(x){return x.trim();});
  var out = { date:'', shortHead:'', shortTone:'', orb:'', assetsLabel:'', assets:'', sectors:'', longTone:'', nations:'', signal:'neutral' };
  for (var i=0;i<lines.length;i++){
    var ln = lines[i];
    if (/Short-term/i.test(ln)){
      var c = ln.split(':').slice(1).join(':');
      for (var g in ATP_ASPECT_WORD){ if (c.indexOf(g)>=0){ c = c.split(g).join(' '+ATP_ASPECT_WORD[g]+' '); } }
      var mo = c.match(/\(([^)]*)\)/); if (mo){ out.orb = _clean(mo[1].replace(ATP_GLYPH_STRIP,' ')); }
      var tone = c.match(/\)\s*[^\w]*\s*([A-Za-z][A-Za-z\-]+)\s*$/);
      out.shortTone = tone ? tone[1] : '';
      c = c.replace(/\([^)]*\)/g,' ').replace(ATP_GLYPH_STRIP,' ');
      if (out.shortTone){ c = c.replace(new RegExp('\\b'+out.shortTone+'\\b','i'),' '); }
      out.shortHead = _clean(c);
    } else if (/Favored|Under pressure/i.test(ln)){
      var parts = ln.split(':'); out.assetsLabel = _clean(parts[0].replace(ATP_GLYPH_STRIP,' '));
      var rest = parts.slice(1).join(':');
      var sect = rest.match(/\(([^)]*)\)/); out.sectors = sect ? _clean(sect[1]) : '';
      out.assets = _clean(rest.replace(/\([^)]*\)/g,' ').replace(ATP_GLYPH_STRIP,' '));
    } else if (/Long-term/i.test(ln)){
      var lt = ln.split(/[\u00B7\u2022]/); out.longTone = _clean((lt[lt.length-1]||'').replace(ATP_GLYPH_STRIP,' '));
    } else if (/Nations/i.test(ln)){
      var nt = _clean(ln.split(':').slice(1).join(':').replace(ATP_GLYPH_STRIP,' '));
      out.nations = _hasLetters(nt) ? nt : '';
    } else if (i===0){
      out.date = _clean(ln.replace(ATP_GLYPH_STRIP,' '));
    }
  }
  if(!out.date) out.date = _clean((lines[0]||'').replace(ATP_GLYPH_STRIP,' '));
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
    s+=ctext(topY+295,'ASTROLOGICAL '+String(G.label||'').toUpperCase()+' PREDICTION',34,GOLDL,'IBMPlexMono',3);
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
    s+=ctext(H-70,'Educational / entertainment '+MDASH+' not financial advice',24,DIM,'CrimsonProItalic');
    s+='</svg>';
    return s;
  }
  var y = topY+300;
  s+=ctext(y,'SHORT-TERM',30,GOLD,'IBMPlexMono',6); y+=70;
  s+=ctext(y, _ell(data.shortHead||'',30), 64, CREAM,'Gloock'); y+=58;
  if(data.orb){ s+=ctext(y,'orb '+data.orb,34,DIM,'CrimsonPro'); y+=66; } else { y+=10; }
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
  s+='<line x1="'+(cx-180)+'" y1="'+y+'" x2="'+(cx+180)+'" y2="'+y+'" stroke="#2a3556" stroke-width="2"/>'; y+=54;
  s+=ctext(y,'LONG-TERM',26,GOLD,'IBMPlexMono',5); y+=50;
  s+=ctext(y,_ell((data.longTone||MDASH),34),40,CREAM,'CrimsonPro'); y+=46;
  if(data.nations){ y+=20; s+=ctext(y,'Nations: '+_ell(data.nations,40),34,DIM,'CrimsonPro'); }
  s+=ctext(H-110,'ASTROTRADERPRO.COM   '+DOT+'   @ASTROTRADERPROAPP',26,GOLD,'IBMPlexMono',4);
  s+=ctext(H-70,'Educational / entertainment '+MDASH+' not financial advice',24,DIM,'CrimsonProItalic');
  s+='</svg>';
  return s;
}
export { atpParseSky, atpBuildCardSVG };
