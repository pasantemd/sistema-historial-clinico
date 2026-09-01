"use server";

import { z } from "zod";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import {
  crearCitaSchema,
  calcularHoraFin,
  verificarConflictoCitaSchema,
} from "@/modulos/citas/validaciones/cita.schema";
import {
  crearCitaServicio,
  editarCitaServicio,
  cancelarCitaServicio,
  atenderCitaServicio,
  confirmarCitaServicio,
  listarCitasServicio,
} from "@/modulos/citas/servicios/citas.servicio";
import {
  listarProfesionalesRepositorio,
  listarTrabajadoresCitaRepositorio,
  verificarConflictoCita,
  type FiltrosCita,
} from "@/modulos/citas/repositorios/citas.repositorio";

export interface ResultadoAccion<T> {
  exito: boolean;
  datos?: T;
  mensaje?: string;
  erroresCampos?: Record<string, string[]>;
}

export async function obtenerSelectoresCitaAccion(busqueda?: string) {
  const usuario = await requerirPermiso("cita.ver");
  const [profesionales, trabajadores] = await Promise.all([
    listarProfesionalesRepositorio(usuario.id),
    listarTrabajadoresCitaRepositorio(usuario.id, busqueda),
  ]);
  return { profesionales, trabajadores };
}

export async function crearCitaAccion(entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("cita.crear");
    const datos = crearCitaSchema.parse(entrada);
    const resultado = await crearCitaServicio(datos, usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { exito: false, mensaje: "Revise los campos de la cita.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
    }
    if (error instanceof Error) return { exito: false, mensaje: error.message };
    console.error("Error al crear cita", error);
    return { exito: false, mensaje: "No fue posible crear la cita." };
  }
}

export async function editarCitaAccion(id: string, entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("cita.editar");
    const datos = crearCitaSchema.parse(entrada);
    const resultado = await editarCitaServicio(id, datos, usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { exito: false, mensaje: "Revise los campos de la cita.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
    }
    if (error instanceof Error) return { exito: false, mensaje: error.message };
    console.error("Error al editar cita", error);
    return { exito: false, mensaje: "No fue posible editar la cita." };
  }
}

export async function cancelarCitaAccion(id: string, motivo: string): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("cita.cancelar");
    if (!motivo || !motivo.trim()) return { exito: false, mensaje: "Indique el motivo de cancelación." };
    const resultado = await cancelarCitaServicio(id, motivo.trim(), usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof Error) return { exito: false, mensaje: error.message };
    console.error("Error al cancelar cita", error);
    return { exito: false, mensaje: "No fue posible cancelar la cita." };
  }
}

export async function atenderCitaAccion(id: string): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("cita.atender");
    const resultado = await atenderCitaServicio(id, usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof Error) return { exito: false, mensaje: error.message };
    console.error("Error al atender cita", error);
    return { exito: false, mensaje: "No fue posible marcar la cita como atendida." };
  }
}

export async function confirmarCitaAccion(id: string): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("cita.editar");
    const resultado = await confirmarCitaServicio(id, usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof Error) return { exito: false, mensaje: error.message };
    console.error("Error al confirmar cita", error);
    return { exito: false, mensaje: "No fue posible confirmar la cita." };
  }
}

export async function listarCitasAccion(filtros: FiltrosCita) {
  const usuario = await requerirPermiso("cita.ver");
  return listarCitasServicio(usuario.id, filtros);
}

export async function verificarConflictoAccion(params: {
  profesionalId?: string;
  trabajadorId: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  ignorarId?: string;
}) {
  const usuario = await requerirPermiso("cita.ver");
  const datos = verificarConflictoCitaSchema.parse(params);
  const horaFin = calcularHoraFin(datos.horaInicio, datos.duracionMinutos);
  return verificarConflictoCita({
    usuarioId: usuario.id,
    profesionalId: datos.profesionalId || undefined,
    trabajadorId: datos.trabajadorId,
    fecha: datos.fecha,
    horaInicio: datos.horaInicio,
    horaFin,
    ignorarId: datos.ignorarId,
  });
}
