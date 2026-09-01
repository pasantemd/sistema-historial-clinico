export function obtenerEtiquetaMorbilidad(valor: string | null | undefined): string {
  return valor?.trim() || "No registrada";
}
