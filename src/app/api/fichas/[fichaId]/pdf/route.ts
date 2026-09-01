import { z } from "zod";

import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import { consultarFichaPdf } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { generarFichaPdf } from "@/modulos/fichas-ocupacionales/servicios/generar-ficha-pdf";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export const runtime = "nodejs";

interface Contexto {
  params: Promise<{ fichaId: string }>;
}

export async function GET(
  _solicitud: Request,
  { params }: Contexto,
): Promise<Response> {
  let usuario;
  try {
    usuario = await requerirPermiso(PERMISOS_FICHA.ver);
  } catch (error) {
    if (error instanceof PermisoDenegadoError) {
      return new Response("Acceso denegado.", { status: 403 });
    }
    throw error;
  }

  const identificador = z.uuid().safeParse((await params).fichaId);
  if (!identificador.success) {
    return new Response("Ficha no encontrada.", { status: 404 });
  }
  const ficha = await consultarFichaPdf(usuario.id, identificador.data);
  if (!ficha) return new Response("Ficha no disponible.", { status: 404 });

  let contenido: Buffer;
  try {
    contenido = await generarFichaPdf(ficha);
  } catch (error) {
    return responderErrorPdf("FICHA_OCUPACIONAL", error);
  }

  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "FICHA_OCUPACIONAL_EXPORTADA",
    modulo: "FICHAS_OCUPACIONALES",
    entidad: "FichaOcupacional",
    entidadId: ficha.id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { formato: "PDF" },
  });

  return responderPdfInline(
    contenido,
    construirNombreArchivo({
      tipo: "ficha-ocupacional",
      identificador: ficha.tipoEvaluacion,
      persona: ficha.trabajador,
      fecha: ficha.fechaAtencion,
      extension: "pdf",
    }),
  );
}
