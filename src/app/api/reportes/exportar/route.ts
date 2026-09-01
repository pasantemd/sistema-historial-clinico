import { z } from "zod";

import { IDS_GRAFICOS_REPORTE } from "@/modulos/reportes/configuracion/graficos-reporte";
import { consultarReportes } from "@/modulos/reportes/consultas/reportes.consulta";
import { generarReporteWord } from "@/modulos/reportes/servicios/generar-reporte-word";
import { normalizarFiltrosReportes } from "@/modulos/reportes/servicios/resolver-periodo-reportes";
import { AccesoEmpresaDenegadoError } from "@/modulos/empresas/errores";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LIMITE_SOLICITUD = 25 * 1024 * 1024;
const esquemaFiltros = z.object({
  periodo: z.enum(["semanal", "mensual", "personalizado"]).optional(),
  fechaReferencia: z.string().max(10).optional(),
  fechaDesde: z.string().max(10).optional(),
  fechaHasta: z.string().max(10).optional(),
  empresaId: z.string().max(100).optional(),
  departamentoId: z.string().max(100).optional(),
  trabajadorId: z.string().max(100).optional(),
  profesionalId: z.string().max(100).optional(),
  estado: z.string().max(50).optional(),
});
const esquemaSolicitud = z.object({
  filtros: esquemaFiltros,
  graficos: z
    .array(
      z.object({
        id: z.enum(IDS_GRAFICOS_REPORTE),
        imagenDataUrl: z
          .string()
          .max(6_000_000)
          .startsWith("data:image/png;base64,"),
      }),
    )
    .min(1)
    .max(IDS_GRAFICOS_REPORTE.length),
});

export async function POST(request: Request) {
  const usuario = await requerirPermiso("reporte.exportar").catch(() => null);
  if (!usuario) return new Response("Acceso denegado", { status: 403 });

  const longitud = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(longitud) && longitud > LIMITE_SOLICITUD) {
    return new Response("Los gráficos seleccionados superan el tamaño permitido.", {
      status: 413,
    });
  }

  let solicitud: z.infer<typeof esquemaSolicitud>;
  try {
    solicitud = esquemaSolicitud.parse(await request.json());
  } catch {
    return new Response("La selección de gráficos no es válida.", { status: 400 });
  }

  if (new Set(solicitud.graficos.map((grafico) => grafico.id)).size !== solicitud.graficos.length) {
    return new Response("La selección contiene gráficos repetidos.", { status: 400 });
  }

  const filtros = normalizarFiltrosReportes(solicitud.filtros);
  try {
    await consultarReportes(usuario.id, filtros);
  } catch (error) {
    if (error instanceof AccesoEmpresaDenegadoError) {
      return new Response("Acceso denegado", { status: 403 });
    }
    throw error;
  }

  const nombreUsuario = `${usuario.nombres} ${usuario.apellidos}`.trim();
  let contenido: Buffer;
  try {
    contenido = await generarReporteWord({
      filtros,
      usuario: nombreUsuario,
      graficos: solicitud.graficos,
    });
  } catch {
    return new Response("No fue posible generar el documento Word.", { status: 500 });
  }

  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "REPORTE_WORD_EXPORTADO",
    modulo: "REPORTES",
    entidad: "Reporte",
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: {
      periodo: filtros.periodo ?? "semanal",
      fechaDesde: filtros.fechaDesde ?? null,
      fechaHasta: filtros.fechaHasta ?? null,
      graficos: solicitud.graficos.length.toString(),
    },
  });

  const nombreArchivo = construirNombreArchivo({
    tipo: `reporte-${filtros.periodo}`,
    persona: nombreUsuario,
    fecha: filtros.fechaHasta,
    extension: "docx",
  });

  return new Response(new Uint8Array(contenido), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
