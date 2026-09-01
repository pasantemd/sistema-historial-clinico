import { NextResponse } from "next/server";
import { consultarRegistroDiario } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { generarRegistroDiarioIndividualPdf } from "@/modulos/registro-diario/servicios/generar-registro-diario-pdf";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export async function GET(_: Request, { params }: { params: Promise<{ registroId: string }> }) {
  const usuario = await requerirPermiso("registro-diario.exportar");
  const { registroId } = await params;
  const registro = await consultarRegistroDiario(usuario.id, registroId);
  if (!registro) return NextResponse.json({ mensaje: "Registro no encontrado." }, { status: 404 });
  let pdf: Buffer;
  try {
    pdf = await generarRegistroDiarioIndividualPdf(registro);
  } catch (error) {
    return responderErrorPdf("REGISTRO_DIARIO_INDIVIDUAL", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "REGISTRO_DIARIO_EXPORTADO",
    modulo: "REGISTRO_DIARIO",
    entidad: "RegistroDiarioAtencion",
    entidadId: registroId,
    resultado: "EXITOSO",
  });
  return responderPdfInline(
    pdf,
    construirNombreArchivo({
      tipo: "registro-diario",
      identificador: registro.numeroRegistro,
      persona: registro.nombreCompleto,
      fecha: registro.fechaAtencion,
      extension: "pdf",
    }),
  );
}
