export function limpiarNombreVisible(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}
