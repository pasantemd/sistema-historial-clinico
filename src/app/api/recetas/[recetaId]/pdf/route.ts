import { z } from "zod";

import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import { consultarRecetaRepositorio } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { generarRecetaPdf } from "@/modulos/recetas/servicios/generar-receta-pdf";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { obtenerAgenteUsuarioSolicitud, registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { responderErrorPdf, responderPdfInline } from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export const runtime = "nodejs";

interface Contexto { params: Promise<{ recetaId: string }> }

export async function GET(_solicitud: Request, { params }: Contexto): Promise<Response> {
  let usuario;
  try {
    usuario = await requerirPermiso("receta.exportar");
  } catch (error) {
    if (error instanceof PermisoDenegadoError) return new Response("Acceso denegado.", { status: 403 });
    throw error;
  }

  const identificador = z.uuid().safeParse((await params).recetaId);
  if (!identificador.success) return new Response("Receta no encontrada.", { status: 404 });

  const receta = await consultarRecetaRepositorio(usuario.id, identificador.data);
  if (!receta) return new Response("Receta no disponible.", { status: 404 });

  let contenido: Buffer;
  try {
    contenido = await generarRecetaPdf(receta);
  } catch (error) {
    return responderErrorPdf("RECETA", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "RECETA_EXPORTADA",
    modulo: "recetas",
    entidad: "RecetaMedica",
    entidadId: receta.id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { formato: "PDF" },
  });

  const nombre = construirNombreArchivo({
    tipo: "receta",
    identificador: receta.numeroReceta,
    persona: receta.trabajadorNombreHistorico,
    fecha: receta.fechaEmision,
    extension: "pdf",
  });
  return responderPdfInline(contenido, nombre);
}
