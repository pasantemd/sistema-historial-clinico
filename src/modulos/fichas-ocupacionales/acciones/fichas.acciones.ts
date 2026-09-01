"use server";

import { z } from "zod";

import { anularFichaServicio, crearBorradorFichaServicio, finalizarFichaServicio, guardarBorradorFichaServicio } from "@/modulos/fichas-ocupacionales/servicios/fichas.servicio";
import {
  FichaFinalizadaError,
  FichaAnuladaError,
  FichaNoEncontradaError,
  TrabajadorNoEncontradoError,
  EmpresaDepartamentoInvalidoError,
} from "@/modulos/fichas-ocupacionales/errores";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

type ResultadoAccion<T = undefined> =
  | { exito: true; datos?: T }
  | { exito: false; mensaje: string; erroresCampos?: Record<string, string[]> };

function resultadoError(error: unknown): Extract<ResultadoAccion<unknown>, { exito: false }> {
  if (error instanceof z.ZodError) {
    return { exito: false, mensaje: "Revise los campos indicados.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
  }
  if (
    error instanceof FichaNoEncontradaError ||
    error instanceof FichaFinalizadaError ||
    error instanceof FichaAnuladaError ||
    error instanceof TrabajadorNoEncontradoError ||
    error instanceof EmpresaDepartamentoInvalidoError
  ) {
    return { exito: false, mensaje: error.message };
  }
  console.error("Error al procesar la ficha ocupacional", error);
  return { exito: false, mensaje: "No fue posible guardar la ficha ocupacional." };
}

export async function crearFichaAccion(entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_FICHA.crear);
    const resultado = await crearBorradorFichaServicio(entrada, usuario.id);
    return { exito: true, datos: resultado };
  } catch (error) {
    return resultadoError(error);
  }
}

export async function guardarBorradorFichaAccion(id: string, entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_FICHA.editar);
    const resultado = await guardarBorradorFichaServicio(z.string().uuid().parse(id), entrada, usuario.id);
    return { exito: true, datos: resultado };
  } catch (error) {
    return resultadoError(error);
  }
}

export async function finalizarFichaAccion(id: string | null, entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_FICHA.finalizar);
    const fichaId = id === null ? null : z.string().uuid().parse(id);
    const resultado = await finalizarFichaServicio(fichaId, entrada, usuario.id);
    return { exito: true, datos: resultado };
  } catch (error) {
    return resultadoError(error);
  }
}

export async function anularFichaAccion(id: string): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_FICHA.anular);
    const resultado = await anularFichaServicio(z.string().uuid().parse(id), usuario.id);
    return { exito: true, datos: resultado };
  } catch (error) {
    return resultadoError(error);
  }
}
