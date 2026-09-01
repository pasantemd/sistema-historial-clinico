import { z } from "zod";

import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import { consultarCertificadoFicha } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { generarFichaExcel } from "@/modulos/fichas-ocupacionales/servicios/generar-ficha-excel";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";

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
  if (!ficha) return new Response("Ficha no disponible.", { status: 404 });

  const contenido = await generarFichaExcel(ficha);
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "CERTIFICADO_EXPORTADO",
    modulo: "FICHAS_OCUPACIONALES",
    entidad: "FICHA_OCUPACIONAL_XLSX",
    entidadId: ficha.id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { formato: "XLSX" },
  });
  const nombre = construirNombreArchivo({
    tipo: "ficha-ocupacional",
    persona: `${ficha.trabajador.apellidos} ${ficha.trabajador.nombres}`,
    fecha: ficha.fechaAtencion,
    extension: "xlsx",
  });
  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
