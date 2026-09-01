import { prisma } from "@/servicios/base-datos/prisma";

export interface EmpresaResumen {
  id: string;
  razonSocial: string;
  nombreComercial: string | null;
  ruc: string;
  actividadEconomicaCodigo: string | null;
  estado: string;
  _count: { departamentos: number; trabajadores: number; asignacionesLaborales: number };
}

export async function consultarEmpresasAutorizadas(usuarioId: string, busqueda?: string) {
  const where: Record<string, unknown> = {
    estado: "ACTIVO",
    usuariosAutorizados: { some: { usuarioId } },
  };
  if (busqueda) {
    const termino = busqueda.trim();
    where.OR = [
      { razonSocial: { contains: termino, mode: "insensitive" } },
      { nombreComercial: { contains: termino, mode: "insensitive" } },
      { ruc: { contains: termino } },
      { actividadEconomicaCodigo: { contains: termino, mode: "insensitive" } },
    ];
  }
  return prisma.empresa.findMany({
    where: where as never,
    select: {
      id: true,
      razonSocial: true,
      nombreComercial: true,
      ruc: true,
      actividadEconomicaCodigo: true,
      estado: true,
      _count: { select: { departamentos: true, trabajadores: true, asignacionesLaborales: true } },
    },
    orderBy: [{ razonSocial: "asc" }, { id: "asc" }],
  });
}

export async function consultarEmpresaAutorizada(usuarioId: string, empresaId: string) {
  return prisma.empresa.findFirst({
    where: {
      id: empresaId,
      estado: "ACTIVO",
      usuariosAutorizados: { some: { usuarioId } },
    },
    select: { id: true, razonSocial: true, nombreComercial: true, ruc: true, estado: true },
  });
}
