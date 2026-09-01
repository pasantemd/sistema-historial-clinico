export function limpiarDocumentoVisible(numeroDocumento: string): string {
  return numeroDocumento.trim();
}

export function limpiarNumeroDocumento(numeroDocumento: string): string {
  return limpiarDocumentoVisible(numeroDocumento)
    .toLocaleUpperCase("es")
    .replace(/[^A-Z0-9]/g, "");
}
