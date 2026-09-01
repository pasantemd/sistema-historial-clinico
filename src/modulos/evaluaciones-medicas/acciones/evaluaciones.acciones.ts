"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { crearBorradorEvaluacion, guardarBorradorEvaluacion, finalizarEvaluacionServicio, anularEvaluacionServicio } from "@/modulos/evaluaciones-medicas/servicios/evaluaciones.servicio";
import { guardarAlergiaServicio, cambiarEstadoAlergiaServicio } from "@/modulos/evaluaciones-medicas/servicios/alergias.servicio";
import { AlertaAlergiaRequiereConfirmacionError, AsignacionActivaRequeridaError, EvaluacionBloqueadaError, EvaluacionNoEncontradaError } from "@/modulos/evaluaciones-medicas/errores";
import { evaluacionFinalizarSchema } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { buscarMedicamentosInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";

type Resultado<T=undefined>={exito:true;datos?:T}|{exito:false;mensaje:string;erroresCampos?:Record<string,string[]>};
function errorResultado(error:unknown):Extract<Resultado<unknown>,{exito:false}>{if(error instanceof z.ZodError)return{exito:false,mensaje:"Revise los campos indicados.",erroresCampos:z.flattenError(error).fieldErrors as Record<string,string[]>};if(error instanceof AlertaAlergiaRequiereConfirmacionError)return{exito:false,mensaje:error.message,erroresCampos:Object.fromEntries(error.indices.map(i=>[`medicamentos.${i}.justificacionAlergia`,["Confirme la alerta e ingrese la justificación clínica."]]))};if(error instanceof AsignacionActivaRequeridaError||error instanceof EvaluacionBloqueadaError||error instanceof EvaluacionNoEncontradaError)return{exito:false,mensaje:error.message};console.error("Error al procesar evaluación médica");return{exito:false,mensaje:"No fue posible procesar la evaluación médica."};}
export async function crearEvaluacionAccion(entrada:unknown):Promise<Resultado<{id:string}>>{try{const u=await requerirPermiso("evaluacion-medica.crear");return{exito:true,datos:await crearBorradorEvaluacion(entrada,u.id)}}catch(e){return errorResultado(e)}}
export async function guardarEvaluacionAccion(id:string,entrada:unknown):Promise<Resultado<{id:string}>>{try{const u=await requerirPermiso("evaluacion-medica.editar");return{exito:true,datos:await guardarBorradorEvaluacion(z.uuid().parse(id),entrada,u.id)}}catch(e){return errorResultado(e)}}
export async function finalizarEvaluacionAccion(id:string|null,entrada:unknown):Promise<Resultado<{id:string}>>{try{const u=await requerirPermiso("evaluacion-medica.finalizar");const datos=evaluacionFinalizarSchema.parse(entrada);return{exito:true,datos:await finalizarEvaluacionServicio(id?z.uuid().parse(id):null,datos,u.id)}}catch(e){return errorResultado(e)}}
export async function anularEvaluacionAccion(id:string,motivo:string):Promise<Resultado<{id:string}>>{try{const u=await requerirPermiso("evaluacion-medica.anular");return{exito:true,datos:await anularEvaluacionServicio(z.uuid().parse(id),motivo,u.id)}}catch(e){return errorResultado(e)}}
export async function guardarAlergiaAccion(entrada:unknown,id?:string):Promise<Resultado<{id:string}>>{try{const u=await requerirPermiso(id?"alergia.editar":"alergia.crear");const datos=await guardarAlergiaServicio(entrada,u.id,id?z.uuid().parse(id):undefined);revalidatePath(`/trabajadores/${(entrada as {trabajadorId?:string}).trabajadorId}`);return{exito:true,datos}}catch(e){return errorResultado(e)}}
export async function cambiarEstadoAlergiaAccion(id:string,trabajadorId:string,activa:boolean):Promise<Resultado>{try{const u=await requerirPermiso("alergia.editar");await cambiarEstadoAlergiaServicio(z.uuid().parse(id),z.uuid().parse(trabajadorId),activa,u.id);revalidatePath(`/trabajadores/${trabajadorId}`);return{exito:true}}catch(e){return errorResultado(e)}}

export async function buscarMedicamentosEvaluacionAccion(termino: string) {
  await requerirPermiso(PERMISOS_INVENTARIO.ver);
  return buscarMedicamentosInventario(termino);
}
