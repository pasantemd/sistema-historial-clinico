import { NextResponse } from "next/server";

import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import { consultarMovimientosMedicamentoInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { generarMovimientosInventarioPdf } from "@/modulos/inventario/servicios/generar-movimientos-inventario-pdf";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  responderErrorPdf,
  responderPdfInline,
} from "@/servicios/documentos/pdf/respuesta-pdf";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await requerirPermiso(PERMISOS_INVENTARIO.ver);
  const { id } = await params;
  const medicamento = await consultarMovimientosMedicamentoInventario(id);
  if (!medicamento) {
    return NextResponse.json(
      { mensaje: "Medicamento no encontrado." },
      { status: 404 },
    );
  }

  let contenido: Buffer;
  try {
    contenido = await generarMovimientosInventarioPdf(medicamento);
  } catch (error) {
    return responderErrorPdf("INVENTARIO_MOVIMIENTOS", error);
  }

  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "INVENTARIO_MOVIMIENTOS_EXPORTADOS",
    modulo: "INVENTARIO",
    entidad: "MedicamentoInventario",
    entidadId: id,
    resultado: "EXITOSO",
  });

  return responderPdfInline(
    contenido,
    construirNombreArchivo({
      tipo: "movimientos-inventario",
      identificador: medicamento.nombre,
      fecha: new Date(),
      extension: "pdf",
    }),
  );
}
