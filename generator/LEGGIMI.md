# Generatore caroselli «pianeta nelle 12 case»
- `render_serie.py B|A --langs … --planets …` (Playwright) → out/serie/B_<pianeta>_casa<n>_<lingua>.jpg e A_<pianeta>_<lingua>_ig.jpg
- Testi: serieB_i18n.js (sole…venere en/it/hi), serieB_more.js (marte…plutone en/it), i18n_add/<lingua>.js e <lingua>_more.js (traduzioni), tabelle A in *_i18n.js, case_i18n.js (Marte 13 lingue), case_more.js (Giove…Plutone).
- Controlli: `node i18n_add/check.js <lingua>` e `node i18n_add/check_more.js <lingua>`.
- Ritratti in /home/claude/dei (non nel repo; percorsi assoluti nei template).
- Calendario: ig/series-v2.json su main (voci K_<pianeta>-<lingua>, 13 immagini dal ramo media).
