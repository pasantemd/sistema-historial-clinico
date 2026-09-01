import {
  actualizarRegistroDiarioRepositorio,
  anularRegistroDiarioRepositorio,
  crearRegistroDiarioRepositorio,
} from "@/modulos/registro-diario/repositorios/registro-diario.repositorio";
import type { DatosRegistroDiario } from "@/modulos/registro-diario/validaciones/registro-diario.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

export async function guardarRegistroDiarioServicio(
  id: string | null,
  datos: DatosRegistroDiario,
  usuarioId: string,
  finalizar: boolean,
) {
  const resultado = id
    ? await actualizarRegistroDiarioRepositorio(id, datos, usuarioId, finalizar)
    : await crearRegistroDiarioRepositorio(datos, usuarioId, finalizar);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: finalizar ? (id ? "REGISTRO_DIARIO_EDITADO" : "REGISTRO_DIARIO_CREADO") : "REGISTRO_DIARIO_BORRADOR_GUARDADO",
    modulo: "REGISTRO_DIARIO",
    entidad: "RegistroDiarioAtencion",
    entidadId: resultado.id,
    resultado: "EXITOSO",
    datosNuevos: { estado: finalizar ? "REGISTRADO" : "BORRADOR" },
  });
  return resultado;
}

export async function anularRegistroDiarioServicio(id: string, motivo: string, usuarioId: string) {
  const resultado = await anularRegistroDiarioRepositorio(id, motivo, usuarioId);
  await registrarAuditoriaSegura({ usuarioId, accion: "REGISTRO_DIARIO_ANULADO", modulo: "REGISTRO_DIARIO", entidad: "RegistroDiarioAtencion", entidadId: id, resultado: "EXITOSO", datosNuevos: { estado: "ANULADO" } });
  return resultado;
}
