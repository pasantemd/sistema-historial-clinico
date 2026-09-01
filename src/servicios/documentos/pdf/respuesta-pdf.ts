const FIRMA_PDF = "%PDF";

function nombreArchivoSeguro(nombre: string): string {
  const limpio = nombre
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpio.toLowerCase().endsWith(".pdf") ? limpio : `${limpio}.pdf`;
}

export function validarContenidoPdf(contenido: Buffer): void {
  if (
    contenido.byteLength < 5 ||
    contenido.subarray(0, 4).toString("ascii") !== FIRMA_PDF
  ) {
    throw new Error("El generador no produjo un documento PDF válido.");
  }
}

export function responderPdfInline(
  contenido: Buffer,
  nombreArchivo: string,
): Response {
  return responderPdf(contenido, nombreArchivo, "inline");
}

export function responderPdfDescarga(
  contenido: Buffer,
  nombreArchivo: string,
): Response {
  return responderPdf(contenido, nombreArchivo, "attachment");
}

function responderPdf(
  contenido: Buffer,
  nombreArchivo: string,
  disposicion: "inline" | "attachment",
): Response {
  validarContenidoPdf(contenido);
  const nombre = nombreArchivoSeguro(nombreArchivo);
  return new Response(new Uint8Array(contenido), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposicion}; filename="${nombre}"`,
      "Content-Length": String(contenido.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function responderErrorPdf(
  modulo: string,
  error: unknown,
): Response {
  console.error(`[PDF:${modulo}] No se pudo generar el documento.`, error);
  return Response.json(
    { mensaje: "No se pudo generar el PDF. Intente nuevamente." },
    { status: 500 },
  );
}
