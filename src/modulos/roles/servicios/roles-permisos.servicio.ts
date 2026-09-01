import { prisma } from "@/servicios/base-datos/prisma";
import { registrarAuditoriaSegura, obtenerAgenteUsuarioSolicitud } from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import { PERMISOS_PROTEGIDOS_ADMIN } from "@/modulos/roles/constantes/matriz-config";
import {
  ErrorRolNoEncontrado,
  ErrorPermisoNoEncontrado,
  ErrorProteccionPermisoAdministrador,
} from "@/modulos/roles/errores";

export async function actualizarPermisosRol(rolId: string, permisoIds: string[]): Promise<void> {
  const usuario = await requerirUsuario();
  await requerirPermiso("usuario.administrar");

  return prisma.$transaction(async (tx) => {
    const rol = await tx.rol.findUnique({
      where: { id: rolId },
      select: { id: true, nombre: true, estado: true },
    });
    if (!rol || rol.estado !== "ACTIVO") {
      throw new ErrorRolNoEncontrado();
    }

    const permisos = await tx.permiso.findMany({
      where: { id: { in: permisoIds }, estado: "ACTIVO" },
      select: { id: true, codigo: true },
    });
    if (permisos.length !== permisoIds.length) {
      throw new ErrorPermisoNoEncontrado();
    }

    if (rol.nombre === "ADMINISTRADOR") {
      const tieneProtegidos = permisos.some((p) => PERMISOS_PROTEGIDOS_ADMIN.has(p.codigo));
      if (!tieneProtegidos) {
        throw new ErrorProteccionPermisoAdministrador();
      }
    } else if (permisos.some((p) => PERMISOS_PROTEGIDOS_ADMIN.has(p.codigo))) {
      throw new ErrorProteccionPermisoAdministrador();
    }

    const asignacionesAnteriores = await tx.rolPermiso.findMany({
      where: { rolId },
      select: { permisoId: true },
    });
    const idsAnteriores = asignacionesAnteriores.map((a) => a.permisoId);

    await tx.rolPermiso.deleteMany({ where: { rolId } });

    if (permisoIds.length > 0) {
      await tx.rolPermiso.createMany({
        data: permisoIds.map((permisoId) => ({ rolId, permisoId })),
      });
    }

    await registrarAuditoriaSegura({
      usuarioId: usuario.id,
      accion: "PERMISOS_ROL_ACTUALIZADOS",
      modulo: "ROLES",
      entidad: "ROL",
      entidadId: rolId,
      resultado: "EXITOSO",
      datosAnteriores: { cantidad: String(idsAnteriores.length) },
      datosNuevos: { cantidad: String(permisoIds.length) },
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    });
  });
}