type ExtensionDocumento = "docx" | "pdf" | "xlsx";

interface PartesNombreArchivo {
  tipo: string;
  persona?: string | null;
  fecha?: Date | string | null;
  identificador?: string | null;
  extension: ExtensionDocumento;
}

export function segmentoNombreArchivo(valor: string | null | undefined): string {
  return (valor ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function fechaNombreArchivo(fecha?: Date | string | null): string {
  if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
    return fecha.toISOString().slice(0, 10);
  }
  if (typeof fecha === "string") {
    const fechaCivil = fecha.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (fechaCivil) return fechaCivil;
  }
  return new Date().toISOString().slice(0, 10);
}

export function construirNombreArchivo({
  tipo,
  persona,
  fecha,
  identificador,
  extension,
}: PartesNombreArchivo): string {
  const partes = [tipo, identificador, persona]
    .map(segmentoNombreArchivo)
    .filter(Boolean);
  partes.push(fechaNombreArchivo(fecha));
  return `${partes.join("-") || "documento"}.${extension}`;
}
