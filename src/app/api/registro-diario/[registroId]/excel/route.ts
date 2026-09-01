import { NextResponse } from "next/server";
import { consultarRegistroDiario } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { generarRegistroDiarioExcel } from "@/modulos/registro-diario/servicios/generar-registro-diario-excel";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { construirNombreArchivo } from "@/servicios/documentos/nombre-archivo";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ registroId: string }> },
) {
  const usuario = await requerirPermiso("registro-diario.exportar");
  const { registroId } = await params;
  const registro = await consultarRegistroDiario(usuario.id, registroId);
  if (!registro)
    return NextResponse.json(
      { mensaje: "Registro no encontrado." },
      { status: 404 },
    );
  const archivo = await generarRegistroDiarioExcel(registro);
  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "REGISTRO_DIARIO_EXPORTADO",
    modulo: "REGISTRO_DIARIO",
    entidad: "RegistroDiarioAtencion",
    entidadId: registroId,
    resultado: "EXITOSO",
  });
  const nombreArchivo = construirNombreArchivo({
    tipo: "registro-diario",
    identificador: registro.numeroRegistro,
    persona: registro.nombreCompleto,
    fecha: registro.fechaAtencion,
    extension: "xlsx",
  });
  return new NextResponse(new Uint8Array(archivo), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
