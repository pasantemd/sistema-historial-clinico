"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DepartamentoDuplicadoError, DepartamentoNoEncontradoError } from "@/modulos/departamentos/errores";
import { cambiarEstadoDepartamento, editarDepartamento, registrarDepartamento } from "@/modulos/departamentos/servicios/departamentos.servicio";
import { departamentoSchema } from "@/modulos/departamentos/validaciones/departamento.schema";
import { AccesoEmpresaDenegadoError } from "@/modulos/empresas";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import type { ResultadoAccion } from "@/tipos/resultado-accion";

function fallo(error: unknown): Extract<ResultadoAccion<unknown>, { exito: false }> {
  if (error instanceof z.ZodError) return { exito: false, mensaje: "Revise los campos indicados.", erroresCampos: z.flattenError(error).fieldErrors as Record<string, string[]> };
  if (error instanceof DepartamentoDuplicadoError || error instanceof DepartamentoNoEncontradoError || error instanceof AccesoEmpresaDenegadoError) return { exito: false, mensaje: error.message };
  console.error("Error al guardar departamento", error);
  return { exito: false, mensaje: "No fue posible guardar el departamento." };
}

export async function crearDepartamentoAccion(entrada: unknown): Promise<ResultadoAccion<{ id: string }>> { try { const usuario = await requerirPermiso("departamento.crear"); const resultado = await registrarDepartamento(departamentoSchema.parse(entrada), usuario.id); revalidatePath("/configuracion/departamentos"); return { exito: true, datos: resultado, mensaje: "Departamento creado." }; } catch (error) { return fallo(error); } }
export async function editarDepartamentoAccion(id: string, entrada: unknown): Promise<ResultadoAccion<{ id: string }>> { try { const usuario = await requerirPermiso("departamento.editar"); const resultado = await editarDepartamento(z.uuid().parse(id), departamentoSchema.parse(entrada), usuario.id); revalidatePath("/configuracion/departamentos"); return { exito: true, datos: resultado, mensaje: "Departamento actualizado." }; } catch (error) { return fallo(error); } }
export async function cambiarEstadoDepartamentoAccion(id: string, estado: "ACTIVO" | "INACTIVO"): Promise<ResultadoAccion> { try { const usuario = await requerirPermiso("departamento.desactivar"); await cambiarEstadoDepartamento(z.uuid().parse(id), z.enum(["ACTIVO", "INACTIVO"]).parse(estado), usuario.id); revalidatePath("/configuracion/departamentos"); return { exito: true, mensaje: estado === "ACTIVO" ? "Departamento activado." : "Departamento desactivado." }; } catch (error) { return fallo(error); } }
