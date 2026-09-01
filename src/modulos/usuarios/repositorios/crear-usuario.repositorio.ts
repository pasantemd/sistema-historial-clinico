import { Prisma } from "@/generated/prisma/client";
import type { EntradaCrearUsuario } from "@/modulos/usuarios/validaciones/crear-usuario.schema";
import { prisma } from "@/servicios/base-datos/prisma";
import { crearClaveScrypt } from "@/servicios/seguridad/crear-clave-scrypt";

const ROLES_SISTEMA = ["ADMINISTRADOR", "MÉDICO", "RECURSOS_HUMANOS"];

export async function crearUsuarioRepositorio(datos: EntradaCrearUsuario, actorId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const [rol, empresas] = await Promise.all([
        tx.rol.findFirst({
          where: { id: datos.rolId, nombre: { in: ROLES_SISTEMA }, estado: "ACTIVO" },
          select: { id: true, nombre: true },
        }),
        tx.empresa.findMany({
          where: {
            id: { in: [...new Set(datos.empresaIds)] },
            estado: "ACTIVO",
            usuariosAutorizados: { some: { usuarioId: actorId } },
          },
          select: { id: true },
        }),
      ]);
      if (!rol) throw new Error("El rol seleccionado no está disponible.");
      if (empresas.length !== new Set(datos.empresaIds).size) {
        throw new Error("Una o más empresas seleccionadas no están autorizadas.");
      }
      if (rol.nombre === "MÉDICO" && (!datos.codigoProfesional || !datos.especialidad)) {
        throw new Error("El código profesional y la especialidad son obligatorios para médicos.");
      }

      const usuario = await tx.usuario.create({
        data: {
          nombres: datos.nombres.trim(),
          apellidos: datos.apellidos.trim(),
          correo: datos.correo,
          claveHash: crearClaveScrypt(datos.contrasena),
          cedula: datos.cedula || null,
          codigoProfesional: rol.nombre === "MÉDICO" ? datos.codigoProfesional : null,
          especialidad: rol.nombre === "MÉDICO" ? datos.especialidad : null,
          roles: { create: { rolId: rol.id } },
          empresasAutorizadas: {
            create: empresas.map((empresa) => ({ empresaId: empresa.id })),
          },
        },
        select: { id: true },
      });
      return usuario;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ya existe un usuario con ese correo o identificación.");
    }
    throw error;
  }
}
