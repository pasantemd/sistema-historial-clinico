import { z } from "zod";

import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import { consultarCertificadoFicha } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { generarCertificadoPdf } from "@/modulos/fichas-ocupacionales/servicios/generar-certificado-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";

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
    usuario = await requerirPermiso(PERMISOS_FICHA.exportarCertificado);
  } catch (error) {
    if (error instanceof PermisoDenegadoError)
      return new Response("Acceso denegado.", { status: 403 });
    throw error;
  }
  const identificador = z.uuid().safeParse((await params).fichaId);
  if (!identificador.success)
    return new Response("Ficha no encontrada.", { status: 404 });
  const ficha = await consultarCertificadoFicha(usuario.id, identificador.data);
  if (!ficha)
    return new Response("Certificado no disponible.", { status: 404 });

  let contenido: Buffer;
  try {
    contenido = await generarCertificadoPdf(ficha);
  } catch (error) {
    return responderErrorPdf("CERTIFICADO_OCUPACIONAL", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "CERTIFICADO_EXPORTADO",
    modulo: "FICHAS_OCUPACIONALES",
    entidad: "CERTIFICADO_OCUPACIONAL_PDF",
    entidadId: ficha.id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { formato: "PDF" },
  });
  const nombre = construirNombreArchivo({
    tipo: "certificado-ocupacional",
    persona: `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`,
    fecha: ficha.fechaAtencion,
    extension: "pdf",
  });
  return responderPdfInline(contenido, nombre);
}
