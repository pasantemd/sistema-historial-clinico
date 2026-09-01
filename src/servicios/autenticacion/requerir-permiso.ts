import { PermisoDenegadoError } from "@/modulos/autenticacion/errores/permiso-denegado.error";
import type { UsuarioSesion } from "@/modulos/autenticacion/tipos/sesion.tipos";
import { prisma } from "@/servicios/base-datos/prisma";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";

interface RolAutorizacion {
  nombre: string;
  permisos: string[];
}

export interface AutorizacionUsuario {
  estado: "ACTIVO" | "INACTIVO" | null;
  rolesActivos: RolAutorizacion[];
}

export async function consultarAutorizacionUsuario(
  usuarioId: string,
): Promise<AutorizacionUsuario> {
  const registro = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      estado: true,
      roles: {
        where: { rol: { estado: "ACTIVO" } },
        select: {
          rol: {
            select: {
              nombre: true,
              permisos: {
                where: { permiso: { estado: "ACTIVO" } },
                select: { permiso: { select: { codigo: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!registro) {
    return { estado: null, rolesActivos: [] };
  }

  const rolesActivos: RolAutorizacion[] = registro.roles.map((relacion) => ({
    nombre: relacion.rol.nombre,
    permisos: relacion.rol.permisos.map((item) => item.permiso.codigo),
  }));

  return { estado: registro.estado, rolesActivos };
}

export async function requerirPermiso(permiso: string): Promise<UsuarioSesion> {
  const usuario = await requerirUsuario();

  const { estado, rolesActivos } = await consultarAutorizacionUsuario(
    usuario.id,
  );

  if (estado !== "ACTIVO") {
    await registrarAuditoriaSegura({
      usuarioId: usuario.id,
      accion: "ACCESO_DENEGADO",
      modulo: "AUTORIZACION",
      entidad: "PERMISO",
      entidadId: permiso,
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
      resultado: "FALLIDO",
    });
    throw new PermisoDenegadoError();
  }

  const esAdministrador = rolesActivos.some(
    (rol) => rol.nombre === "ADMINISTRADOR",
  );

  const tienePermiso = esAdministrador ||
    rolesActivos.some((rol) => rol.permisos.includes(permiso));

  if (!tienePermiso) {
    await registrarAuditoriaSegura({
      usuarioId: usuario.id,
      accion: "ACCESO_DENEGADO",
      modulo: "AUTORIZACION",
      entidad: "PERMISO",
      entidadId: permiso,
      agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
      resultado: "FALLIDO",
    });
    throw new PermisoDenegadoError();
  }

  return usuario;
}

export function tienePermiso(usuario: UsuarioSesion, permiso: string): boolean {
  return (
    usuario.roles.includes("ADMINISTRADOR") ||
    usuario.permisos.includes(permiso)
  );
}
