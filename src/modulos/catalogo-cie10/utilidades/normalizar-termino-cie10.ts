const PALABRAS_VACIAS = new Set([
  "a", "al", "ante", "bajo", "cabe", "con", "contra", "como", "cual", "cuando",
  "de", "del", "desde", "donde", "durante", "e", "el", "en", "entre",
  "era", "eran", "esa", "esas", "ese", "eso", "esos", "esta", "estas",
  "este", "estos", "fue", "han", "has", "hasta", "la", "las",
  "fuerte",
  "le", "les", "lo", "los", "mas", "me", "mi", "mis", "muy", "mucho",
  "ni", "no", "nos", "o", "os", "para", "pero", "por", "porque",
  "que", "quien", "se", "sea", "sean", "sin", "sobre", "su", "sus",
  "suya", "suyo", "te", "tengo", "tu", "tus", "un", "una", "uno", "unas",
  "unos", "y",
]);

export function normalizarTerminoCie10(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function obtenerPalabrasSignificativasCie10(valor: string): string[] {
  const palabras = normalizarTerminoCie10(valor).split(" ").filter(Boolean);
  const significativas = palabras.filter((palabra) => !PALABRAS_VACIAS.has(palabra));
  return significativas.length > 0 ? significativas : palabras;
}

export function extraerCoincidencia(descripcion: string, termino: string): string {
  const normalizada = normalizarTerminoCie10(descripcion);
  const terminoNormalizado = normalizarTerminoCie10(termino);
  const indice = normalizada.indexOf(terminoNormalizado);
  if (indice === -1) return descripcion.length > 100 ? `${descripcion.slice(0, 100)}…` : descripcion;
  const inicio = Math.max(0, indice - 20);
  const fin = Math.min(descripcion.length, indice + termino.length + 40);
  const fragmento = descripcion.slice(inicio, fin);
  return fragmento.length < descripcion.length ? `…${fragmento}…` : fragmento;
}

const ULTRA_CORTAS = new Set(["a", "e", "i", "o", "u", "y", "el", "la", "en", "de", "un", "una"]);

export function esBusquedaSignificativa(termino: string): boolean {
  const normalizado = normalizarTerminoCie10(termino);
  if (normalizado.length < 2) return false;
  const palabras = normalizado.split(" ").filter(Boolean);
  const significativas = palabras.filter((p) => p.length >= 2 && !ULTRA_CORTAS.has(p));
  if (significativas.length === 0) return false;
  return significativas.some((p) => p.length >= 2);
}
