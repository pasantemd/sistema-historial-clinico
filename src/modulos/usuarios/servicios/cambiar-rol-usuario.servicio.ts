import { prisma } from "@/servicios/base-datos/prisma";
import { registrarAuditoriaSegura, obtenerAgenteUsuarioSolicitud } from "@/servicios/auditoria/registrar-auditoria";
import {
  ErrorUsuarioNoEncontrado,
  ErrorRolNoEncontrado,
  ErrorSinAdministradorActivo,
  ErrorAutoCambioRol,
} from "@/modulos/usuarios/errores";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import type { CambioRolResultado } from "@/modulos/usuarios/tipos";

const ROLES_ADMIN = new Set(["ADMINISTRADOR"]);

export async function cambiarRolUsuario(usuarioId: string, nuevoRolId: string): Promise<CambioRolResultado> {
  const administrador = await requerirUsuario();
  await requerirPermiso("usuario.administrar");

  if (administrador.id === usuarioId) {
    throw new ErrorAutoCambioRol();
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Rol" WHERE "nombre" = 'ADMINISTRADOR' FOR UPDATE
    `;
    const usuario = await tx.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nombres: true, apellidos: true, estado: true },
    });
    if (!usuario || usuario.estado !== "ACTIVO") {
      throw new ErrorUsuarioNoEncontrado();
    }

    const rolNuevo = await tx.rol.findUnique({
      where: { id: nuevoRolId },
      select: { id: true, nombre: true, estado: true },
    });
    if (!rolNuevo || rolNuevo.estado !== "ACTIVO") {
      throw new ErrorRolNoEncontrado();
    }

    const relacionesActuales = await tx.usuarioRol.findMany({
      where: { usuarioId },
      include: { rol: { select: { id: true, nombre: true } } },
    });

    const rolActual = relacionesActuales[0]?.rol ?? null;
    const esAdminActual = relacionesActuales.some(({ rol }) => ROLES_ADMIN.has(rol.nombre));

    if (esAdminActual) {
      const otrosAdmin = await tx.usuarioRol.findFirst({
        where: {
          rol: { nombre: "ADMINISTRADOR" },
          usuarioId: { not: usuarioId },
          usuario: { estado: "ACTIVO" },
        },
      });
      if (!otrosAdmin) {
        throw new ErrorSinAdministradorActivo();
      }
    }

    if (rolNuevo.nombre === rolActual?.nombre) {
      return {
        exito: true as const,
        usuarioId: usuario.id,
        rolAnterior: rolActual.nombre,
        rolNuevo: rolNuevo.nombre,
      };
    }

    if (relacionesActuales.length > 0) {
      await tx.usuarioRol.deleteMany({ where: { usuarioId } });
    }

    await tx.usuarioRol.create({
      data: { usuarioId, rolId: nuevoRolId },
    });

    await registrarAuditoriaSegura({
      usuarioId: administrador.id,
      accion: "ROL_USUARIO_ACTUALIZADO",
      modulo: "USUARIOS",
      entidad: "USUARIO",
      entidadId: usuarioId,
      resultado: "EXITOSO",
      datosAnteriores: { rol: rolActual?.nombre ?? null },
      datosNuevos: { rol: rolNuevo.nombre },
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    });

    return {
      exito: true as const,
      usuarioId: usuario.id,
      rolAnterior: rolActual?.nombre ?? null,
      rolNuevo: rolNuevo.nombre,
    };
  });
}
