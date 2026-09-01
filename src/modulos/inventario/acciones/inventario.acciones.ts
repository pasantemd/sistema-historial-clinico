"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import {
  agregarCantidadSchema,
  eliminarCantidadSchema,
  cambiarEstadoInventarioSchema,
  medicamentoInventarioSchema,
  movimientoInventarioSchema,
} from "@/modulos/inventario/validaciones/inventario.schema";
import {
  agregarCantidadServicio,
  cambiarEstadoMedicamentoInventarioServicio,
  crearMedicamentoInventarioServicio,
  editarMedicamentoInventarioServicio,
  eliminarCantidadServicio,
  registrarMovimientoInventarioServicio,
} from "@/modulos/inventario/servicios/inventario.servicio";
import { buscarMedicamentosInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { InventarioError } from "@/modulos/inventario/errores";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

type Resultado<T = unknown> = { exito: true; datos?: T } | { exito: false; mensaje: string; erroresCampos?: Record<string, string[]> };

function errorResultado(error: unknown): Extract<Resultado, { exito: false }> {
  if (error instanceof z.ZodError) {
    return {
      exito: false,
      mensaje: "Revise los campos indicados.",
      erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]>,
    };
  }
  if (error instanceof InventarioError) {
    return { exito: false, mensaje: error.message };
  }
  return { exito: false, mensaje: "No fue posible completar la operación. Intente nuevamente." };
}

export async function guardarMedicamentoInventarioAccion(id: string | null, entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(id ? PERMISOS_INVENTARIO.editar : PERMISOS_INVENTARIO.crear);
    const datos = medicamentoInventarioSchema.parse(entrada);
    const resultado = id
      ? await editarMedicamentoInventarioServicio(id, datos, usuario.id)
      : await crearMedicamentoInventarioServicio(datos, usuario.id);
    revalidatePath("/inventario");
    if (id) revalidatePath(`/inventario/${id}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return errorResultado(error);
  }
}

export async function guardarMedicamentoInventarioYRedirigirAccion(id: string | null, entrada: unknown) {
  const resultado = await guardarMedicamentoInventarioAccion(id, entrada);
  if (!resultado.exito) return resultado;
  redirect(`/inventario/${resultado.datos?.id ?? id}`);
}

export async function registrarMovimientoInventarioAccion(entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_INVENTARIO.movimiento);
    const datos = movimientoInventarioSchema.parse(entrada);
    const resultado = await registrarMovimientoInventarioServicio(datos, usuario.id);
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${datos.medicamentoInventarioId}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return errorResultado(error);
  }
}

export async function agregarCantidadAccion(entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_INVENTARIO.movimiento);
    const datos = agregarCantidadSchema.parse(entrada);
    const resultado = await agregarCantidadServicio(datos, usuario.id);
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${datos.medicamentoInventarioId}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return errorResultado(error);
  }
}

export async function eliminarCantidadAccion(entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_INVENTARIO.movimiento);
    const datos = eliminarCantidadSchema.parse(entrada);
    const resultado = await eliminarCantidadServicio(datos, usuario.id);
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${datos.medicamentoInventarioId}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return errorResultado(error);
  }
}

export async function cambiarEstadoInventarioAccion(entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(PERMISOS_INVENTARIO.desactivar);
    const datos = cambiarEstadoInventarioSchema.parse(entrada);
    const resultado = await cambiarEstadoMedicamentoInventarioServicio(datos.id, datos.activar, usuario.id);
    revalidatePath("/inventario");
    revalidatePath(`/inventario/${datos.id}`);
    return { exito: true, datos: resultado };
  } catch (error) {
    return errorResultado(error);
  }
}

export async function buscarMedicamentosInventarioAccion(termino: string) {
  await requerirPermiso(PERMISOS_INVENTARIO.ver);
  return buscarMedicamentosInventario(termino);
}
