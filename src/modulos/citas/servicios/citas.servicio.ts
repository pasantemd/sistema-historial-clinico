import { verificarConflictoCita, crearCitaRepositorio, actualizarCitaRepositorio, cancelarCitaRepositorio, atenderCitaRepositorio, confirmarCitaRepositorio, listarCitasRepositorio, type FiltrosCita } from "@/modulos/citas/repositorios/citas.repositorio";
import type { EntradaCita, CitaMedicaDto } from "@/modulos/citas/tipos";
import { calcularHoraFin } from "@/modulos/citas/validaciones/cita.schema";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

async function validarConflicto(entrada: EntradaCita, usuarioId: string, ignorarId?: string) {
  const horaFin = calcularHoraFin(entrada.horaInicio, entrada.duracionMinutos);
  const conflicto = await verificarConflictoCita({
    usuarioId,
    profesionalId: entrada.profesionalId,
    trabajadorId: entrada.trabajadorId,
    fecha: entrada.fecha,
    horaInicio: entrada.horaInicio,
    horaFin,
    ignorarId,
  });
  if (conflicto.profesional) {
    throw new Error("El profesional ya tiene una cita programada que se solapa con ese horario.");
  }
  if (conflicto.trabajador) {
    throw new Error("El trabajador ya tiene una cita programada que se solapa con ese horario.");
  }
  return conflicto;
}

export async function crearCitaServicio(entrada: EntradaCita, usuarioId: string) {
  await validarConflicto(entrada, usuarioId);
  const resultado = await crearCitaRepositorio(entrada, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "CITA_CREADA",
    modulo: "citas",
    entidad: "CitaMedica",
    entidadId: resultado.id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function editarCitaServicio(id: string, entrada: EntradaCita, usuarioId: string) {
  await validarConflicto(entrada, usuarioId, id);
  const resultado = await actualizarCitaRepositorio(id, entrada, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "CITA_EDITADA",
    modulo: "citas",
    entidad: "CitaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function cancelarCitaServicio(id: string, motivo: string, usuarioId: string) {
  const resultado = await cancelarCitaRepositorio(id, motivo, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "CITA_CANCELADA",
    modulo: "citas",
    entidad: "CitaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function atenderCitaServicio(id: string, usuarioId: string) {
  const resultado = await atenderCitaRepositorio(id, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "CITA_ATENDIDA",
    modulo: "citas",
    entidad: "CitaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function confirmarCitaServicio(id: string, usuarioId: string) {
  const resultado = await confirmarCitaRepositorio(id, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "CITA_EDITADA",
    modulo: "citas",
    entidad: "CitaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function listarCitasServicio(usuarioId: string, filtros: FiltrosCita): Promise<CitaMedicaDto[]> {
  return listarCitasRepositorio(usuarioId, filtros);
}
