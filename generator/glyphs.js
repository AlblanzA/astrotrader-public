// Glifi vettoriali (viewBox 0 0 100 100, solo stroke). Nessun carattere Unicode astrologico.
const GLYPH = {
  mercurio: '<circle cx="50" cy="50" r="15"/><path d="M36 14 A14 14 0 0 0 64 14 M50 65 V92 M39 80 H61"/>',
  venere: '<circle cx="50" cy="36" r="20"/><path d="M50 56 V92 M37 76 H63"/>',
  giove: '<path d="M24 30 C30 8 64 10 54 38 C48 54 34 62 20 68 M18 68 L86 68 M72 14 L72 92"/>',
  saturno: '<path d="M38 8 V60 M26 20 H50 M38 48 C46 36 70 38 68 56 C66 70 52 74 58 92"/>',
  urano: '<path d="M28 12 V52 M72 12 V52 M28 32 H72 M50 12 V66"/><circle cx="50" cy="78" r="11"/>',
  nettuno: '<path d="M22 14 V24 C22 52 78 52 78 24 V14 M50 10 V92 M36 76 H64"/>',
  plutone: '<circle cx="50" cy="30" r="10"/><path d="M28 24 A22 22 0 0 0 72 24 M50 46 V92 M37 74 H63"/>',
  rahu: '<path d="M30 72 C12 58 18 22 50 22 C82 22 88 58 70 72"/><circle cx="26" cy="79" r="8"/><circle cx="74" cy="79" r="8"/>',
  ketu: '<path d="M30 28 C12 42 18 78 50 78 C82 78 88 42 70 28"/><circle cx="26" cy="21" r="8"/><circle cx="74" cy="21" r="8"/>',
  fortuna: '<circle cx="50" cy="50" r="32"/><path d="M27 27 L73 73 M73 27 L27 73"/>',
  lilith: '<path d="M62 10 A22 22 0 1 0 62 54 A16 22 0 1 1 62 10 Z M46 56 V92 M33 76 H59"/>',
  marte: '<circle cx="40" cy="60" r="22"/><path d="M56 44 L80 20 M60 20 H80 V40"/>',
  sole: '<circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="4" fill="currentColor"/>',
  luna: '<path d="M62 18 A34 34 0 1 0 62 82 A26 34 0 1 1 62 18 Z"/>',
  toro: '<circle cx="50" cy="62" r="22"/><path d="M18 18 C24 42 76 42 82 18"/>',
  vergine: '<path d="M12 30 C18 24 26 26 26 36 V82 M26 40 C26 24 46 24 46 40 V82 M46 40 C46 24 66 24 66 40 V70 C66 84 74 90 84 92 M66 70 C74 54 90 46 90 58 C90 70 78 78 58 80"/>',
  ariete: '<path d="M50 90 V44 C50 18 30 10 20 20 C11 29 14 44 27 45 M50 44 C50 18 70 10 80 20 C89 29 86 44 73 45"/>',
  gemelli: '<path d="M20 16 C38 26 62 26 80 16 M20 84 C38 74 62 74 80 84 M38 23 V77 M62 23 V77"/>',
  scorpione: '<path d="M10 30 C16 24 24 26 24 36 V80 M24 40 C24 24 44 24 44 40 V80 M44 40 C44 24 64 24 64 40 V70 C64 82 72 86 90 86 M80 78 L90 86 L80 94"/>',
  bilancia: '<path d="M14 80 H86 M14 64 H33 A19 19 0 1 1 67 64 H86"/>',
  // Luna Nuova: disco scuro con bordo sottile
  nuova: '<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="26" fill="currentColor" stroke="none" opacity=".18"/>'
};
function glyph(name, color, sw = 6) {
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="color:${color}">${GLYPH[name]}</svg>`;
}
// Medaglione dorato con glifo: è il "simbolo dentro l'immagine della divinità"
function medal(name, ink = '#5A1414') {
  return `<svg viewBox="0 0 200 200" width="100%" height="100%">
  <defs><radialGradient id="mg_${name}" cx="38%" cy="32%"><stop offset="0" stop-color="#F6E3AE"/><stop offset=".55" stop-color="#C9A34E"/><stop offset="1" stop-color="#6B4F1C"/></radialGradient>
  <radialGradient id="mh_${name}"><stop offset=".5" stop-color="rgba(246,227,174,.45)"/><stop offset="1" stop-color="rgba(246,227,174,0)"/></radialGradient></defs>
  <circle cx="100" cy="100" r="99" fill="url(#mh_${name})"/>
  <circle cx="100" cy="100" r="70" fill="url(#mg_${name})" stroke="#4A360F" stroke-width="2"/>
  <circle cx="100" cy="100" r="61" fill="none" stroke="rgba(74,54,15,.55)" stroke-width="1.5"/>
  <g transform="translate(58 58) scale(.84)" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="color:${ink}">${GLYPH[name]}</g></svg>`;
}
