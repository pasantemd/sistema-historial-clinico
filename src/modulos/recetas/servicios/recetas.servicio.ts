import {
  cargarContextoReceta,
  crearRecetaRepositorio,
  actualizarRecetaRepositorio,
  emitirRecetaRepositorio,
  anularRecetaRepositorio,
  verificarAlergiasReceta,
  buscarRecetaPorRegistroDiario,
} from "@/modulos/recetas/repositorios/recetas.repositorio";
import { registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import type { EntradaReceta } from "@/modulos/recetas/validaciones/receta.schema";

export async function buscarRecetaPorRegistroDiarioServicio(
  registroDiarioId: string,
) {
  return buscarRecetaPorRegistroDiario(registroDiarioId);
}

export async function obtenerContextoRecetaServicio(
  usuarioId: string,
  trabajadorId: string,
  registroDiarioId?: string,
  evaluacionId?: string,
  fichaOcupacionalId?: string,
  documentoClinicoId?: string,
) {
  return cargarContextoReceta(
    usuarioId,
    trabajadorId,
    registroDiarioId,
    evaluacionId,
    fichaOcupacionalId,
    documentoClinicoId,
  );
}

export async function crearRecetaServicio(datos: EntradaReceta, usuarioId: string) {
  const resultado = await crearRecetaRepositorio(datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "RECETA_CREADA",
    modulo: "recetas",
    entidad: "RecetaMedica",
    entidadId: resultado.id,
    resultado: "EXITOSO",
    datosNuevos: { trabajadorId: datos.trabajadorId, numeroReceta: resultado.numeroReceta },
  });
  return resultado;
}

export async function emitirRecetaServicio(
  id: string,
  usuarioId: string,
  confirmarAlergia: boolean,
  justificacion?: string,
) {
  const resultado = await emitirRecetaRepositorio(
    id,
    usuarioId,
    confirmarAlergia,
    justificacion,
  );
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "RECETA_EMITIDA",
    modulo: "recetas",
    entidad: "RecetaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function actualizarRecetaServicio(id: string, datos: EntradaReceta, usuarioId: string) {
  const resultado = await actualizarRecetaRepositorio(id, datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "RECETA_EDITADA",
    modulo: "recetas",
    entidad: "RecetaMedica",
    entidadId: id,
    resultado: "EXITOSO",
  });
  return resultado;
}

export async function anularRecetaServicio(id: string, motivo: string, usuarioId: string) {
  const resultado = await anularRecetaRepositorio(id, motivo, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "RECETA_ANULADA",
    modulo: "recetas",
    entidad: "RecetaMedica",
    entidadId: id,
    resultado: "EXITOSO",
    datosNuevos: { motivoAnulacion: motivo },
  });
  return resultado;
}

export async function verificarAlergiasServicio(
  medicamentos: Array<{ nombre: string; nombreGenerico?: string | null }>,
  alergias: Array<{ sustancia: string; severidad: string }>,
) {
  return verificarAlergiasReceta(medicamentos, alergias);
}
