// Punti senza figura: Rahu, Ketu, Parte della Fortuna, Lilith. Solo simbolo, parola chiave al posto della dignità.
// Ogni file points/<lingua>.js chiama PTS_ADD(lingua, {ui:{tpl,cta}, B:{punto:[12×[[5 frasi],'In una frase']]}, A:{punto:{...tabella}}}).
var TR = TR || {}, TK = TK || {}, TF = TF || {}, TL = TL || {};
var POINT_SYM = {rahu:{g:'rahu',c:'#D8CCF4',glow:'#9A84E0'}, ketu:{g:'ketu',c:'#EED6B8',glow:'#C68A52'},
                 fortuna:{g:'fortuna',c:'#D8F0DC',glow:'#5FBF84'}, lilith:{g:'lilith',c:'#D9C9F0',glow:'#B89BE0'}};
function PTS_ADD(L, o) {
  if (typeof SB !== 'undefined') for (const k in o.B) { SB[k] = SB[k] || {}; SB[k][L] = o.B[k]; }
  if (typeof SB_UI !== 'undefined' && SB_UI[L]) { SB_UI[L].tpl = SB_UI[L].tpl || {}; SB_UI[L].cta = SB_UI[L].cta || {};
    Object.assign(SB_UI[L].tpl, o.ui.tpl); Object.assign(SB_UI[L].cta, o.ui.cta); }
  const M = {rahu: TR, ketu: TK, fortuna: TF, lilith: TL};
  for (const k in o.A) M[k][L] = o.A[k];
}
