import { crearEvaluacion, guardarEvaluacion, finalizarEvaluacion, anularEvaluacion } from "@/modulos/evaluaciones-medicas/repositorios/evaluaciones.repositorio";
import { evaluacionBorradorSchema, evaluacionFinalizarSchema } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { obtenerAgenteUsuarioSolicitud, registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

async function auditar(usuarioId:string, accion:"EVALUACION_MEDICA_CREADA"|"EVALUACION_MEDICA_EDITADA"|"EVALUACION_MEDICA_FINALIZADA"|"EVALUACION_MEDICA_ANULADA", id:string) {
  await registrarAuditoriaSegura({ usuarioId, accion, modulo:"EVALUACIONES_MEDICAS", entidad:"EVALUACION_MEDICA", entidadId:id, agenteUsuario:await obtenerAgenteUsuarioSolicitud(), resultado:"EXITOSO" });
}
export async function crearBorradorEvaluacion(entrada:unknown, usuarioId:string){const datos=evaluacionBorradorSchema.parse(entrada);const id=await crearEvaluacion(datos,usuarioId);await auditar(usuarioId,"EVALUACION_MEDICA_CREADA",id);return{id};}
export async function guardarBorradorEvaluacion(id:string,entrada:unknown,usuarioId:string){const datos=evaluacionBorradorSchema.parse(entrada);await guardarEvaluacion(id,datos,usuarioId);await auditar(usuarioId,"EVALUACION_MEDICA_EDITADA",id);return{id};}
export async function finalizarEvaluacionServicio(id:string|null,entrada:unknown,usuarioId:string){const datos=evaluacionFinalizarSchema.parse(entrada);const resultado=await finalizarEvaluacion(id,datos,usuarioId);if(resultado.evaluacionFinalizada)await auditar(usuarioId,"EVALUACION_MEDICA_FINALIZADA",resultado.evaluacionId);return{id:resultado.evaluacionId};}
export async function anularEvaluacionServicio(id:string,motivo:string,usuarioId:string){if(motivo.trim().length<5)throw new Error("Ingrese un motivo de anulación.");await anularEvaluacion(id,motivo.trim(),usuarioId);await auditar(usuarioId,"EVALUACION_MEDICA_ANULADA",id);return{id};}
