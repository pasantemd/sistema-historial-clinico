"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  CedulaProfesionalDuplicadaError,
  CorreoProfesionalDuplicadoError,
} from "@/modulos/configuracion-profesional/repositorios/profesional.repositorio";
import { actualizarDatosProfesional } from "@/modulos/configuracion-profesional/servicios/profesional.servicio";
import { datosProfesionalSchema } from "@/modulos/configuracion-profesional/validaciones/profesional.schema";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import type { ResultadoAccion } from "@/tipos/resultado-accion";

function fallo(error: unknown): Extract<ResultadoAccion<unknown>, { exito: false }> {
  if (error instanceof z.ZodError) {
    return {
      exito: false,
      mensaje: "Revise los campos indicados.",
      erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]>,
    };
  }

  if (
    error instanceof CorreoProfesionalDuplicadoError ||
    error instanceof CedulaProfesionalDuplicadaError
  ) {
    return { exito: false, mensaje: error.message };
  }

  console.error("Error al actualizar datos del profesional", error);
  return { exito: false, mensaje: "No fue posible actualizar los datos del profesional." };
}

export async function actualizarDatosProfesionalAccion(entrada: unknown): Promise<ResultadoAccion> {
  try {
    const usuario = await requerirUsuario();
    await actualizarDatosProfesional(usuario.id, datosProfesionalSchema.parse(entrada));
    revalidatePath("/configuracion");
    revalidatePath("/mi-perfil");

    return {
      exito: true,
      mensaje: "Datos del profesional actualizados correctamente",
    };
  } catch (error) {
    return fallo(error);
  }
}
