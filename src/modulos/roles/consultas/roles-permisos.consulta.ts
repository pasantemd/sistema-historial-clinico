import { prisma } from "@/servicios/base-datos/prisma";
import type { DatosPaginaRoles } from "../tipos/matriz-permisos";

export async function obtenerDatosPaginaRoles(): Promise<DatosPaginaRoles> {
  const [roles, permisos, asignaciones] = await Promise.all([
    prisma.rol.findMany({
      where: { nombre: { in: ["ADMINISTRADOR", "MÉDICO", "RECURSOS_HUMANOS"] } },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.permiso.findMany({
      where: { estado: "ACTIVO" },
      select: { id: true, codigo: true },
    }),
    prisma.rolPermiso.findMany({
      select: { rolId: true, permisoId: true },
    }),
  ]);

  const permisosPorRol: Record<string, string[]> = {};
  for (const { rolId, permisoId } of asignaciones) {
    if (!permisosPorRol[rolId]) permisosPorRol[rolId] = [];
    permisosPorRol[rolId].push(permisoId);
  }

  return {
    roles: roles.map((r) => ({ id: r.id, nombre: r.nombre })),
    permisos: permisos.map((p) => ({ id: p.id, codigo: p.codigo })),
    permisosPorRol,
  };
}