import { NextResponse } from "next/server";
import { consultarDocumentoClinico } from "@/modulos/documentos-clinicos/consultas/documentos-clinicos.consulta";
import { generarDocumentoClinicoPdf } from "@/modulos/documentos-clinicos/servicios/generar-documento-clinico-pdf";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ documentoId: string }> },
) {
  const usuario = await requerirPermiso("documento-clinico.exportar");
  const { documentoId } = await params;
  const documento = await consultarDocumentoClinico(usuario.id, documentoId);
  if (!documento) {
    return NextResponse.json(
      { mensaje: "Documento no encontrado." },
      { status: 404 },
    );
  }
  let pdf: Buffer;
  try {
    pdf = await generarDocumentoClinicoPdf(documento);
  } catch (error) {
    return responderErrorPdf("DOCUMENTO_CLINICO", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "DOCUMENTO_CLINICO_EXPORTADO",
    modulo: "DOCUMENTOS_CLINICOS",
    entidad: "DocumentoClinico",
    entidadId: documento.id,
    resultado: "EXITOSO",
  });
  return responderPdfInline(
    pdf,
    construirNombreArchivo({
      tipo: "documento-clinico",
      identificador: documento.numeroDocumento,
      persona: documento.trabajador,
      fecha: documento.fecha,
      extension: "pdf",
    }),
  );
}
