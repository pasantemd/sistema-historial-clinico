"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { buscarTrabajadoresParaRegistro } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { anularRegistroDiarioServicio, guardarRegistroDiarioServicio } from "@/modulos/registro-diario/servicios/registro-diario.servicio";
import { anularRegistroSchema, registroDiarioBorradorSchema, registroDiarioSchema } from "@/modulos/registro-diario/validaciones/registro-diario.schema";
import { buscarMedicamentosInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";

interface Resultado<T> { exito: boolean; datos?: T; mensaje?: string; erroresCampos?: Record<string, string[]> }

export async function buscarTrabajadoresRegistroAccion(termino: string) {
  const usuario = await requerirPermiso("registro-diario.ver");
  return buscarTrabajadoresParaRegistro(usuario.id, termino);
}

export async function buscarMedicamentosInventarioAccion(termino: string) {
  await requerirPermiso(PERMISOS_INVENTARIO.ver);
  return buscarMedicamentosInventario(termino);
}

export async function guardarRegistroDiarioAccion(id: string | null, entrada: unknown, finalizar: boolean): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso(id ? "registro-diario.editar" : "registro-diario.crear");
    const datos = (finalizar ? registroDiarioSchema : registroDiarioBorradorSchema).parse(entrada);
    if (!datos.trabajadorId) return { exito: false, mensaje: "Seleccione un trabajador antes de guardar el borrador." };
    if (!datos.fechaAtencion) return { exito: false, mensaje: "Seleccione la fecha antes de guardar el borrador." };
    const resultado = await guardarRegistroDiarioServicio(id, datos, usuario.id, finalizar);
    revalidatePath("/registro-diario");
    revalidatePath(`/trabajadores/${datos.trabajadorId}`);
    return { exito: true, datos: { id: resultado.id } };
  } catch (error) {
    if (error instanceof z.ZodError) return { exito: false, mensaje: "Revise los campos obligatorios.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
    return { exito: false, mensaje: error instanceof Error ? error.message : "No fue posible guardar el registro diario." };
  }
}

export async function anularRegistroDiarioAccion(id: string, entrada: unknown): Promise<Resultado<{ id: string }>> {
  try {
    const usuario = await requerirPermiso("registro-diario.anular");
    const { motivo } = anularRegistroSchema.parse(entrada);
    await anularRegistroDiarioServicio(id, motivo, usuario.id);
    revalidatePath("/registro-diario");
    return { exito: true, datos: { id } };
  } catch (error) {
    if (error instanceof z.ZodError) return { exito: false, mensaje: error.issues[0]?.message ?? "Motivo inválido." };
    return { exito: false, mensaje: error instanceof Error ? error.message : "No fue posible anular el registro." };
  }
}
