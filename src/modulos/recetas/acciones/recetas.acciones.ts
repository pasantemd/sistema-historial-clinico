"use server";

import { z } from "zod";

import {
  obtenerContextoRecetaServicio,
  crearRecetaServicio,
  actualizarRecetaServicio,
  emitirRecetaServicio,
  anularRecetaServicio,
  verificarAlergiasServicio,
  buscarRecetaPorRegistroDiarioServicio,
} from "@/modulos/recetas/servicios/recetas.servicio";
import {
  recetaBorradorSchema,
  emitirRecetaSchema,
  anularRecetaSchema,
} from "@/modulos/recetas/validaciones/receta.schema";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

type ResultadoAccion<T = undefined> =
  | { exito: true; datos?: T }
  | { exito: false; mensaje: string; erroresCampos?: Record<string, string[]> };

export async function obtenerContextoRecetaAccion(
  trabajadorId: string,
  registroDiarioId?: string,
  evaluacionId?: string,
  fichaOcupacionalId?: string,
  documentoClinicoId?: string,
) {
  const usuario = await requerirPermiso("receta.crear");
  try {
    const contexto = await obtenerContextoRecetaServicio(
      usuario.id,
      trabajadorId,
      registroDiarioId,
      evaluacionId,
      fichaOcupacionalId,
      documentoClinicoId,
    );
    return { exito: true as const, datos: contexto };
  } catch (error) {
    return {
      exito: false as const,
      mensaje:
        error instanceof Error
          ? error.message
          : "No fue posible cargar los datos del trabajador.",
    };
  }
}

export async function crearRecetaAccion(
  entrada: unknown,
): Promise<ResultadoAccion<{ id: string; numeroReceta: string }>> {
  try {
    const usuario = await requerirPermiso("receta.crear");
    const datos = recetaBorradorSchema.parse(entrada);
    if (datos.registroDiarioId) {
      const existente = await buscarRecetaPorRegistroDiarioServicio(
        datos.registroDiarioId,
      );
      if (existente) {
        return {
          exito: false,
          mensaje: "Este Registro Diario ya tiene una receta asociada.",
        };
      }
    }
    const resultado = await crearRecetaServicio(datos, usuario.id);
    return {
      exito: true,
      datos: { id: resultado.id, numeroReceta: resultado.numeroReceta },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        exito: false,
        mensaje: "Revise los campos de la receta.",
        erroresCampos: z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >,
      };
    }
    if (
      error instanceof Error &&
      (error.message.includes("no fue encontrad") ||
        error.message.includes("ya tiene una receta asociada"))
    ) {
      return { exito: false, mensaje: error.message };
    }
    console.error("Error al crear receta", error);
    return { exito: false, mensaje: "No fue posible crear la receta." };
  }
}

export async function editarRecetaAccion(
  id: string,
  entrada: unknown,
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("receta.editar");
    const datos = recetaBorradorSchema.parse(entrada);
    const resultado = await actualizarRecetaServicio(id, datos, usuario.id);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        exito: false,
        mensaje: "Revise los campos de la receta.",
        erroresCampos: z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >,
      };
    }
    if (error instanceof Error && error.message.includes("borrador")) {
      return { exito: false, mensaje: error.message };
    }
    console.error("Error al editar receta", error);
    return { exito: false, mensaje: "No fue posible editar la receta." };
  }
}

export async function emitirRecetaAccion(
  id: string,
  confirmarAlergia: boolean,
  justificacion?: string,
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("receta.emitir");
    const {
      id: recetaId,
      confirmarAlergia: confirmacion,
      justificacionAlergias,
    } = emitirRecetaSchema.parse({
      id,
      confirmarAlergia,
      justificacionAlergias: justificacion,
    });
    const resultado = await emitirRecetaServicio(
      recetaId,
      usuario.id,
      confirmacion,
      justificacionAlergias || undefined,
    );
    return { exito: true, datos: resultado };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        exito: false,
        mensaje: "Datos inválidos para emitir la receta.",
      };
    }
    if (error instanceof Error && error.message.includes("justificar")) {
      return { exito: false, mensaje: error.message };
    }
    if (error instanceof Error && error.message.includes("medicamento")) {
      return { exito: false, mensaje: error.message };
    }
    console.error("Error al emitir receta", error);
    return { exito: false, mensaje: "No fue posible emitir la receta." };
  }
}

export async function anularRecetaAccion(
  id: string,
  motivo: string,
): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("receta.anular");
    const { id: recetaId, motivoAnulacion } = anularRecetaSchema.parse({
      id,
      motivoAnulacion: motivo,
    });
    const resultado = await anularRecetaServicio(
      recetaId,
      motivoAnulacion,
      usuario.id,
    );
    return { exito: true, datos: resultado };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        exito: false,
        mensaje: "Indique un motivo válido.",
        erroresCampos: z.flattenError(error).fieldErrors as Record<
          string,
          string[]
        >,
      };
    }
    console.error("Error al anular receta", error);
    return { exito: false, mensaje: "No fue posible anular la receta." };
  }
}

export async function verificarAlergiasAccion(
  medicamentos: Array<{ nombre: string; nombreGenerico?: string | null }>,
  alergias: Array<{ sustancia: string; severidad: string }>,
) {
  await requerirPermiso("receta.crear");
  return verificarAlergiasServicio(medicamentos, alergias);
}
