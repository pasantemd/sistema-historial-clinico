import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import type { DatosProfesional } from "@/modulos/configuracion-profesional/validaciones/profesional.schema";
import type { DatosProfesionalFormulario } from "@/modulos/configuracion-profesional/tipos";

export class CorreoProfesionalDuplicadoError extends Error {
  constructor() {
    super("El correo ingresado ya está registrado por otro usuario.");
  }
}

export class CedulaProfesionalDuplicadaError extends Error {
  constructor() {
    super("La cédula ingresada ya está registrada por otro usuario.");
  }
}

export async function consultarDatosProfesionalRepositorio(
  usuarioId: string,
): Promise<DatosProfesionalFormulario | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      nombres: true,
      apellidos: true,
      cedula: true,
      correo: true,
      codigoProfesional: true,
      especialidad: true,
      estado: true,
      roles: { select: { rol: { select: { nombre: true } } } },
    },
  });

  if (!usuario) return null;

  return {
    nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`.trim(),
    cedula: usuario.cedula ?? "",
    codigoProfesional: usuario.codigoProfesional ?? "",
    profesion: usuario.especialidad ?? "",
    correo: usuario.correo,
    estado: usuario.estado,
    roles: usuario.roles.map(({ rol }) => rol.nombre),
  };
}

export async function actualizarDatosProfesionalRepositorio(
  usuarioId: string,
  datos: DatosProfesional & { nombres: string; apellidos: string },
) {
  try {
    return await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        cedula: datos.cedula,
        correo: datos.correo || undefined,
        codigoProfesional: datos.codigoProfesional,
        especialidad: datos.profesion,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const campos = Array.isArray(error.meta?.target)
        ? error.meta.target.map(String)
        : [String(error.meta?.target ?? "")];
      if (campos.some((campo) => campo.includes("cedula"))) {
        throw new CedulaProfesionalDuplicadaError();
      }
      throw new CorreoProfesionalDuplicadoError();
    }

    throw error;
  }
}
