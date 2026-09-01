import { prisma } from "@/servicios/base-datos/prisma";
import { registrarAuditoriaSegura, obtenerAgenteUsuarioSolicitud } from "@/servicios/auditoria/registrar-auditoria";
import { ErrorUsuarioNoEncontrado, ErrorSinAdministradorActivo, ErrorAutoCambioRol } from "@/modulos/usuarios/errores";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";

export async function alternarEstadoUsuario(usuarioId: string): Promise<{ exito: true; nuevoEstado: string }> {
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
      select: { id: true, nombres: true, apellidos: true, estado: true, roles: { select: { rol: { select: { nombre: true } } } } },
    });
    if (!usuario) throw new ErrorUsuarioNoEncontrado();

    const esAdmin = usuario.roles.some((r) => r.rol.nombre === "ADMINISTRADOR");
    const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    if (esAdmin && nuevoEstado === "INACTIVO") {
      const otrosAdmin = await tx.usuarioRol.findFirst({
        where: { rol: { nombre: "ADMINISTRADOR" }, usuarioId: { not: usuarioId }, usuario: { estado: "ACTIVO" } },
      });
      if (!otrosAdmin) throw new ErrorSinAdministradorActivo();
    }

    await tx.usuario.update({ where: { id: usuarioId }, data: { estado: nuevoEstado } });

    await registrarAuditoriaSegura({
      usuarioId: administrador.id,
      accion: nuevoEstado === "ACTIVO" ? "USUARIO_ACTIVADO" : "USUARIO_DESACTIVADO",
      modulo: "USUARIOS",
      entidad: "USUARIO",
      entidadId: usuarioId,
      resultado: "EXITOSO",
      datosAnteriores: { estado: usuario.estado },
      datosNuevos: { estado: nuevoEstado },
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    });

    return { exito: true as const, nuevoEstado };
  });
}
