/**
 * Normaliza un texto de morbilidad para comparación y búsqueda:
 * - trim
 * - minúsculas
 * - eliminación de diacríticos y tildes
 * - colapso de espacios múltiples en uno solo
 */
export function normalizarMorbilidad(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Divide el término de búsqueda normalizado en tokens no vacíos.
 */
export function tokenizarMorbilidad(texto: string): string[] {
  const normalizado = normalizarMorbilidad(texto);
  if (!normalizado) return [];
  return normalizado.split(" ").filter((t) => t.length > 0);
}
