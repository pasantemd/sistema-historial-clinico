"use server";
import { buscarTrabajadoresParaRegistro } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export async function buscarTrabajadoresClinicosAccion(termino: string) { const usuario = await requerirPermiso("trabajador.ver"); return buscarTrabajadoresParaRegistro(usuario.id, termino); }
