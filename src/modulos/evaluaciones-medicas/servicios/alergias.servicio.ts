import { cambiarEstadoAlergia, guardarAlergia } from "@/modulos/evaluaciones-medicas/repositorios/alergias.repositorio";
import { alergiaSchema } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { obtenerAgenteUsuarioSolicitud, registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";

async function auditar(usuarioId:string,accion:"ALERGIA_CREADA"|"ALERGIA_EDITADA"|"ALERGIA_DESACTIVADA",id:string){await registrarAuditoriaSegura({usuarioId,accion,modulo:"ALERGIAS",entidad:"ALERGIA_TRABAJADOR",entidadId:id,agenteUsuario:await obtenerAgenteUsuarioSolicitud(),resultado:"EXITOSO"});}
export async function guardarAlergiaServicio(entrada:unknown,usuarioId:string,id?:string){const datos=alergiaSchema.parse(entrada);const resultado=await guardarAlergia(datos,id);await auditar(usuarioId,id?"ALERGIA_EDITADA":"ALERGIA_CREADA",resultado.id);return resultado;}
export async function cambiarEstadoAlergiaServicio(id:string,trabajadorId:string,activa:boolean,usuarioId:string){await cambiarEstadoAlergia(id,trabajadorId,activa);await auditar(usuarioId,activa?"ALERGIA_EDITADA":"ALERGIA_DESACTIVADA",id);}
