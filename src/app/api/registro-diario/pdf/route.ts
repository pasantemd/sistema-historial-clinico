import { NextResponse } from "next/server";

import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import { consultarRegistrosDiariosPorFecha } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { generarRegistroDiarioPdf } from "@/modulos/registro-diario/servicios/generar-registro-diario-pdf";
import type { FiltrosRegistroDiario } from "@/modulos/registro-diario/tipos";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

function valor(parametros: URLSearchParams, clave: keyof FiltrosRegistroDiario): string | undefined {
  const dato = parametros.get(clave);
  return dato?.trim() || undefined;
}

export async function GET(solicitud: Request) {
  let usuario;
  try {
    usuario = await requerirPermiso("registro-diario.exportar");
  } catch (error) {
    if (error instanceof PermisoDenegadoError) {
      return NextResponse.json({ mensaje: "No tiene permiso para exportar el registro diario." }, { status: 403 });
    }
    throw error;
  }
  const parametros = new URL(solicitud.url).searchParams;
  const fecha = valor(parametros, "fecha");

  if (!fecha) {
    return NextResponse.json(
      { mensaje: "Seleccione una fecha para imprimir los registros del día" },
      { status: 400 },
    );
  }

  const filtros: FiltrosRegistroDiario & { fecha: string } = {
    fecha,
    empresaId: valor(parametros, "empresaId"),
    estado: valor(parametros, "estado"),
    profesionalId: valor(parametros, "profesionalId"),
    trabajador: valor(parametros, "trabajador"),
  };
  const datosDiarios = await consultarRegistrosDiariosPorFecha(usuario.id, filtros);

  if (!datosDiarios) {
    return NextResponse.json(
      { mensaje: "No existen registros para la fecha seleccionada" },
      { status: 404 },
    );
  }

  let pdf: Buffer;
  try {
    pdf = await generarRegistroDiarioPdf(datosDiarios);
  } catch (error) {
    return responderErrorPdf("REGISTRO_DIARIO_FECHA", error);
  }
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "REGISTRO_DIARIO_EXPORTADO",
    modulo: "REGISTRO_DIARIO",
    entidad: "RegistroDiarioAtencion",
    entidadId: `fecha:${fecha}`,
    resultado: "EXITOSO",
  });

  return responderPdfInline(
    pdf,
    construirNombreArchivo({
      tipo: "registro-diario-del-dia",
      fecha,
      extension: "pdf",
    }),
  );
}
