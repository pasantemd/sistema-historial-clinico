import { prisma } from "@/servicios/base-datos/prisma";
import type {
  UsuarioAutenticacion,
  UsuarioSesion,
} from "@/modulos/autenticacion/tipos/sesion.tipos";

const seleccionIdentidad = {
  id: true,
  nombres: true,
  apellidos: true,
  correo: true,
  estado: true,
  roles: {
    where: { rol: { estado: "ACTIVO" as const } },
    select: {
      rol: {
        select: {
          nombre: true,
          permisos: {
            where: { permiso: { estado: "ACTIVO" as const } },
            select: { permiso: { select: { codigo: true } } },
          },
        },
      },
    },
  },
};

function mapearIdentidad(registro: {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: "ACTIVO" | "INACTIVO";
  roles: Array<{
    rol: {
      nombre: string;
      permisos: Array<{ permiso: { codigo: string } }>;
    };
  }>;
}): UsuarioSesion {
  return {
    id: registro.id,
    nombres: registro.nombres,
    apellidos: registro.apellidos,
    correo: registro.correo,
    roles: [...new Set(registro.roles.map(({ rol }) => rol.nombre))],
    permisos: [
      ...new Set(
        registro.roles.flatMap(({ rol }) =>
          rol.permisos.map(({ permiso }) => permiso.codigo),
        ),
      ),
    ],
  };
}

export async function buscarUsuarioParaAutenticacion(
  correo: string,
): Promise<UsuarioAutenticacion | null> {
  const registro = await prisma.usuario.findUnique({
    where: { correo },
    select: { ...seleccionIdentidad, claveHash: true },
  });

  if (!registro) return null;

  return {
    ...mapearIdentidad(registro),
    estado: registro.estado,
    claveHash: registro.claveHash,
  };
}

export async function buscarIdentidadUsuarioPorId(
  id: string,
): Promise<(UsuarioSesion & { estado: "ACTIVO" | "INACTIVO" }) | null> {
  const registro = await prisma.usuario.findUnique({
    where: { id },
    select: seleccionIdentidad,
  });

  if (!registro) return null;
  return { ...mapearIdentidad(registro), estado: registro.estado };
}

export async function registrarUltimoAcceso(id: string): Promise<void> {
  await prisma.usuario.update({
    where: { id },
    data: { ultimoAccesoEn: new Date() },
    select: { id: true },
  });
}
