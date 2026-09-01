import {
  OrganizacionLaboralInvalidaError,
  VinculoLaboralNoEncontradoError,
} from "@/modulos/trabajadores/errores";
import {
  actualizarTrabajadorConVinculo,
  buscarTrabajadorParaNuevoVinculo,
  buscarVinculoParaMutacion,
  consultarOrganizacionLaboral,
  crearTrabajadorConVinculo,
  crearVinculoLaboralParaTrabajador,
  usuarioPuedeAccederEmpresaTrabajadores,
} from "@/modulos/trabajadores/repositorios/trabajadores.repositorio";
import type {
  DatosNuevoVinculoLaboral,
  DatosTrabajador,
} from "@/modulos/trabajadores/validaciones/trabajador.schema";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";

async function validarOrganizacion(
  empresaId: string,
  departamentoId: string,
  usuarioId: string,
) {
  const [puedeAcceder, departamento] = await Promise.all([
    usuarioPuedeAccederEmpresaTrabajadores(usuarioId, empresaId),
    consultarOrganizacionLaboral(empresaId, departamentoId),
  ]);
  if (!puedeAcceder || !departamento) {
    throw new OrganizacionLaboralInvalidaError();
  }
}

export async function registrarNuevoVinculoLaboral(
  datos: DatosNuevoVinculoLaboral,
  usuarioId: string,
) {
  await validarOrganizacion(datos.empresaId, datos.departamentoId, usuarioId);
  if (!(await buscarTrabajadorParaNuevoVinculo(datos.trabajadorId, usuarioId))) {
    throw new OrganizacionLaboralInvalidaError();
  }
  const resultado = await crearVinculoLaboralParaTrabajador(datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "ASIGNACION_LABORAL_CAMBIADA",
    modulo: "ASIGNACIONES_LABORALES",
    entidad: "ASIGNACION_LABORAL",
    entidadId: resultado.vinculoId,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: {
      empresaId: datos.empresaId,
      departamentoId: datos.departamentoId,
      trabajadorId: datos.trabajadorId,
      reutilizado: resultado.reutilizado,
    },
  });
  return { id: datos.trabajadorId, vinculoId: resultado.vinculoId };
}

function datosLaborales(datos: DatosTrabajador) {
  return {
    empresaId: datos.empresaId,
    departamentoId: datos.departamentoId,
    puestoLaboral: datos.puestoLaboral,
    estadoLaboral: datos.estadoLaboral ?? "ACTIVO",
  };
}

export async function registrarTrabajador(
  datos: DatosTrabajador,
  usuarioId: string,
) {
  await validarOrganizacion(datos.empresaId, datos.departamentoId, usuarioId);
  const resultado = await crearTrabajadorConVinculo(datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "TRABAJADOR_CREADO",
    modulo: "TRABAJADORES",
    entidad: "TRABAJADOR",
    entidadId: resultado.trabajadorId,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { ...datosLaborales(datos), vinculoId: resultado.vinculoId },
  });
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "VINCULO_LABORAL_CREADO",
    modulo: "VINCULOS_LABORALES",
    entidad: "VINCULO_LABORAL",
    entidadId: resultado.vinculoId,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: {
      empresaId: datos.empresaId,
      departamentoId: datos.departamentoId,
      trabajadorId: resultado.trabajadorId,
    },
  });
  return { id: resultado.trabajadorId };
}

export async function editarTrabajador(
  id: string,
  datos: DatosTrabajador,
  usuarioId: string,
) {
  if (!datos.vinculoId) throw new VinculoLaboralNoEncontradoError();
  const anterior = await buscarVinculoParaMutacion(id, datos.vinculoId);
  if (!anterior) throw new VinculoLaboralNoEncontradoError();
  if (!(await usuarioPuedeAccederEmpresaTrabajadores(usuarioId, anterior.empresaId))) {
    throw new OrganizacionLaboralInvalidaError();
  }
  await validarOrganizacion(datos.empresaId, datos.departamentoId, usuarioId);
  const resultado = await actualizarTrabajadorConVinculo(id, datos, usuarioId);
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "TRABAJADOR_EDITADO",
    modulo: "TRABAJADORES",
    entidad: "TRABAJADOR",
    entidadId: id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: { ...datosLaborales(datos), vinculoId: resultado.vinculoId },
  });
  await registrarAuditoriaSegura({
    usuarioId,
    accion: "VINCULO_LABORAL_EDITADO",
    modulo: "VINCULOS_LABORALES",
    entidad: "VINCULO_LABORAL",
    entidadId: resultado.vinculoId,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
    datosNuevos: {
      empresaId: datos.empresaId,
      departamentoId: datos.departamentoId,
      trabajadorId: id,
    },
  });
  return { id };
}
