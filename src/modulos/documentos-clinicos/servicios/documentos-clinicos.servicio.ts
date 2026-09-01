import {
  actualizarDocumentoClinicoRepositorio,
  anularDocumentoClinicoRepositorio,
  crearDocumentoClinicoRepositorio,
} from "@/modulos/documentos-clinicos/repositorios/documentos-clinicos.repositorio";
import type { DatosDocumentoClinico } from "@/modulos/documentos-clinicos/validaciones/documento-clinico.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
export async function guardarDocumentoClinicoServicio(
  id: string | null,
  datos: DatosDocumentoClinico,
  usuarioId: string,
  finalizar: boolean,
) {
  const r = id
    ? await actualizarDocumentoClinicoRepositorio(
        id,
        datos,
        usuarioId,
        finalizar,
      )
    : await crearDocumentoClinicoRepositorio(datos, usuarioId, finalizar);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: finalizar
      ? "DOCUMENTO_CLINICO_FINALIZADO"
      : id
        ? "DOCUMENTO_CLINICO_EDITADO"
        : "DOCUMENTO_CLINICO_CREADO",
    modulo: "DOCUMENTOS_CLINICOS",
    entidad: "DocumentoClinico",
    entidadId: r.id,
    resultado: "EXITOSO",
    datosNuevos: { estado: finalizar ? "FINALIZADO" : "BORRADOR" },
  });
  return r;
}
export async function anularDocumentoClinicoServicio(
  id: string,
  motivo: string,
  usuarioId: string,
) {
  const r = await anularDocumentoClinicoRepositorio(id, motivo, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "DOCUMENTO_CLINICO_ANULADO",
    modulo: "DOCUMENTOS_CLINICOS",
    entidad: "DocumentoClinico",
    entidadId: id,
    resultado: "EXITOSO",
    datosNuevos: { estado: "ANULADO" },
  });
  return r;
}
