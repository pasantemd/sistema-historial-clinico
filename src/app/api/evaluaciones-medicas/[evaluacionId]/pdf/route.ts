import { NextResponse } from "next/server";
import { consultarEvaluacion } from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { generarEvaluacionPdf } from "@/modulos/evaluaciones-medicas/servicios/generar-evaluacion-pdf";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ evaluacionId: string }> },
) {
  const usuario = await requerirPermiso("evaluacion-medica.exportar");
  const { evaluacionId } = await params;
  const evaluacion = await consultarEvaluacion(usuario.id, evaluacionId);
  if (!evaluacion)
    return NextResponse.json(
      { mensaje: "Evaluación no encontrada." },
      { status: 404 },
    );
  let contenido: Buffer;
  try {
    contenido = await generarEvaluacionPdf(evaluacion);
  } catch (error) {
    return responderErrorPdf("EVALUACION_MEDICA", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "EVALUACION_MEDICA_EXPORTADA",
    modulo: "EVALUACIONES_MEDICAS",
    entidad: "EvaluacionMedica",
    entidadId: evaluacionId,
    resultado: "EXITOSO",
  });
  return responderPdfInline(
    contenido,
    construirNombreArchivo({
      tipo: "evaluacion-medica",
      identificador: evaluacion.numeroEvaluacion,
      persona: evaluacion.trabajadorNombreHistorico,
      fecha: evaluacion.fechaAtencion,
      extension: "pdf",
    }),
  );
}
