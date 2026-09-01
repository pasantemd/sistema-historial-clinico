import type { DocumentoHistorialClinicoDto, GrupoHistorialClinicoDto } from "@/modulos/trabajadores/tipos/historial-clinico";

export type DocumentoHistorialConFecha = DocumentoHistorialClinicoDto & { fecha: string | null };

export function agruparDocumentosPorFechaClinica(items: DocumentoHistorialConFecha[]): GrupoHistorialClinicoDto[] {
  const grupos = new Map<string, GrupoHistorialClinicoDto>();
  for (const { fecha, ...documento } of items) {
    const clave = fecha ?? "sin-fecha-clinica";
    const grupo = grupos.get(clave) ?? { clave, fecha, documentos: [] };
    grupo.documentos.push(documento);
    grupos.set(clave, grupo);
  }
  return [...grupos.values()].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
}
