"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  DocumentoDuplicadoError,
  OrganizacionLaboralInvalidaError,
  VinculoLaboralDuplicadoError,
  VinculoLaboralNoEncontradoError,
} from "@/modulos/trabajadores/errores";
import {
  editarTrabajador,
  registrarNuevoVinculoLaboral,
  registrarTrabajador,
} from "@/modulos/trabajadores/servicios/trabajadores.servicio";
import type { ResultadoAccion } from "@/modulos/trabajadores/tipos";
import {
  nuevoVinculoLaboralSchema,
  trabajadorSchema,
} from "@/modulos/trabajadores/validaciones/trabajador.schema";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

function resultadoError(error: unknown): Extract<ResultadoAccion<unknown>, { exito: false }> {
  if (error instanceof z.ZodError) {
    return { exito: false, mensaje: "Revise los campos indicados.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
  }
  if (
    error instanceof DocumentoDuplicadoError ||
    error instanceof OrganizacionLaboralInvalidaError ||
    error instanceof VinculoLaboralNoEncontradoError ||
    error instanceof VinculoLaboralDuplicadoError
  ) {
    return { exito: false, mensaje: error.message };
  }
  console.error("Error al guardar trabajador", error);
  return { exito: false, mensaje: "No fue posible guardar el trabajador." };
}

export async function crearTrabajadorAccion(entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("trabajador.crear");
    await requerirPermiso("vinculo-laboral.crear");
    const trabajador = await registrarTrabajador(trabajadorSchema.parse(entrada), usuario.id);
    revalidatePath("/trabajadores");
    return { exito: true, datos: trabajador };
  } catch (error) {
    return resultadoError(error);
  }
}

export async function editarTrabajadorAccion(id: string, entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("trabajador.editar");
    await requerirPermiso("vinculo-laboral.editar");
    const trabajador = await editarTrabajador(z.uuid().parse(id), trabajadorSchema.parse(entrada), usuario.id);
    revalidatePath("/trabajadores");
    revalidatePath(`/trabajadores/${id}`);
    return { exito: true, datos: trabajador };
  } catch (error) {
    return resultadoError(error);
  }
}

export async function crearVinculoLaboralAccion(entrada: unknown): Promise<ResultadoAccion<{ id: string; vinculoId: string }>> {
  try {
    await requerirPermiso("trabajador.ver");
    const usuario = await requerirPermiso("vinculo-laboral.crear");
    const resultado = await registrarNuevoVinculoLaboral(nuevoVinculoLaboralSchema.parse(entrada), usuario.id);
    revalidatePath("/trabajadores");
    revalidatePath(`/trabajadores/${resultado.id}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return resultadoError(error);
  }
}
