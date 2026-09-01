import { DepartamentoNoEncontradoError } from "@/modulos/departamentos/errores";
import { actualizarDepartamento, actualizarEstadoDepartamento, buscarDepartamentoParaMutacion, crearDepartamento } from "@/modulos/departamentos/repositorios/departamentos.repositorio";
import type { DatosDepartamento } from "@/modulos/departamentos/validaciones/departamento.schema";
import { requerirAccesoEmpresa } from "@/modulos/empresas/servicios/acceso-empresa.servicio";
import { obtenerAgenteUsuarioSolicitud, registrarAuditoriaSegura } from "@/servicios/auditoria/registrar-auditoria";
import { limpiarNombreVisible } from "@/utilidades/cadenas/limpiar-nombre";

const preparar = (datos: DatosDepartamento) => ({ ...datos, nombre: limpiarNombreVisible(datos.nombre) });

export async function registrarDepartamento(datos: DatosDepartamento, usuarioId: string) {
  await requerirAccesoEmpresa(usuarioId, datos.empresaId);
  const nuevo = await crearDepartamento(preparar(datos));
  await registrarAuditoriaSegura({ usuarioId, accion: "DEPARTAMENTO_CREADO", modulo: "DEPARTAMENTOS", entidad: "DEPARTAMENTO", entidadId: nuevo.id, agenteUsuario: await obtenerAgenteUsuarioSolicitud(), resultado: "EXITOSO", datosNuevos: nuevo });
  return { id: nuevo.id };
}

export async function editarDepartamento(id: string, datos: DatosDepartamento, usuarioId: string) {
  const anterior = await buscarDepartamentoParaMutacion(id);
  if (!anterior) throw new DepartamentoNoEncontradoError();
  await Promise.all([requerirAccesoEmpresa(usuarioId, anterior.empresaId), requerirAccesoEmpresa(usuarioId, datos.empresaId)]);
  const nuevo = await actualizarDepartamento(id, preparar(datos));
  await registrarAuditoriaSegura({ usuarioId, accion: "DEPARTAMENTO_EDITADO", modulo: "DEPARTAMENTOS", entidad: "DEPARTAMENTO", entidadId: id, agenteUsuario: await obtenerAgenteUsuarioSolicitud(), resultado: "EXITOSO", datosAnteriores: anterior, datosNuevos: nuevo });
  return { id };
}

export async function cambiarEstadoDepartamento(id: string, estado: "ACTIVO" | "INACTIVO", usuarioId: string) {
  const anterior = await buscarDepartamentoParaMutacion(id);
  if (!anterior) throw new DepartamentoNoEncontradoError();
  await requerirAccesoEmpresa(usuarioId, anterior.empresaId);
  const nuevo = await actualizarEstadoDepartamento(id, estado);
  await registrarAuditoriaSegura({ usuarioId, accion: estado === "ACTIVO" ? "DEPARTAMENTO_ACTIVADO" : "DEPARTAMENTO_DESACTIVADO", modulo: "DEPARTAMENTOS", entidad: "DEPARTAMENTO", entidadId: id, agenteUsuario: await obtenerAgenteUsuarioSolicitud(), resultado: "EXITOSO", datosAnteriores: { estado: anterior.estado }, datosNuevos: { estado: nuevo.estado } });
}
