import type { Prisma } from "@/generated/prisma/client";
import type { PaginaDepartamentos } from "@/modulos/departamentos/tipos";
import { prisma } from "@/servicios/base-datos/prisma";

export async function consultarDepartamentos(usuarioId: string, filtros: { busqueda?: string; empresaId?: string; pagina: number; tamanoPagina: number }): Promise<PaginaDepartamentos> {
  const where: Prisma.DepartamentoWhereInput = {
    empresaId: filtros.empresaId,
    empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } },
    ...(filtros.busqueda ? { nombre: { contains: filtros.busqueda, mode: "insensitive" } } : {}),
  };
  const total = await prisma.departamento.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.tamanoPagina));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const registros = await prisma.departamento.findMany({
    where,
    select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true, empresa: { select: { razonSocial: true } } },
    orderBy: [{ empresa: { razonSocial: "asc" } }, { nombre: "asc" }, { id: "asc" }],
    skip: (pagina - 1) * filtros.tamanoPagina,
    take: filtros.tamanoPagina,
  });
  return { departamentos: registros.map(({ empresa, ...registro }) => ({ ...registro, empresa: empresa.razonSocial })), total, pagina, totalPaginas, tamanoPagina: filtros.tamanoPagina };
}

export async function consultarDepartamentoPorId(usuarioId: string, id: string) {
  return prisma.departamento.findFirst({
    where: { id, empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } } },
    select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true },
  });
}

export async function consultarDepartamentosActivos(usuarioId: string, empresaId?: string) {
  return prisma.departamento.findMany({
    where: { empresaId, estado: "ACTIVO", empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } } },
    select: { id: true, empresaId: true, nombre: true, empresa: { select: { razonSocial: true } } },
    orderBy: [{ empresa: { razonSocial: "asc" } }, { nombre: "asc" }],
  });
}
