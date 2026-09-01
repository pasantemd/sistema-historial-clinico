import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import {
  FiltrosAuditoria,
  RegistroAuditoria,
  ResumenAuditoria,
} from "@/modulos/auditoria/tipos";

function construirFiltroPrisma(filtros: FiltrosAuditoria): Prisma.AuditoriaWhereInput {
  const where: Prisma.AuditoriaWhereInput = {};

  if (filtros.usuario) {
    where.usuarioId = filtros.usuario;
  }
  if (filtros.modulo) {
    where.modulo = filtros.modulo;
  }
  if (filtros.accion) {
    where.accion = filtros.accion;
  }
  if (filtros.severidad === "EXITOSO" || filtros.severidad === "FALLIDO") {
    where.resultado = filtros.severidad;
  }
  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.creadoEn = {};
    if (filtros.fechaDesde) where.creadoEn.gte = new Date(`${filtros.fechaDesde}T00:00:00.000Z`);
    if (filtros.fechaHasta) where.creadoEn.lte = new Date(`${filtros.fechaHasta}T23:59:59.999Z`);
  }

  return where;
}

export async function obtenerRegistrosAuditoria(
  filtros: FiltrosAuditoria
): Promise<{ registros: RegistroAuditoria[]; total: number }> {
  const pagina = Math.max(1, Math.floor(filtros.pagina ?? 1));
  const take = Math.min(100, Math.max(1, Math.floor(filtros.take ?? 50)));
  const where = construirFiltroPrisma(filtros);

  const [registros, total] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      take,
      skip: (pagina - 1) * take,
      include: {
        usuario: {
          select: { nombres: true, apellidos: true, correo: true },
        },
      },
    }),
    prisma.auditoria.count({ where }),
  ]);

  return {
    registros: registros.map((a) => ({
      id: a.id,
      fecha: a.creadoEn,
      usuario: a.usuario
        ? `${a.usuario.nombres || ""} ${a.usuario.apellidos || ""}`.trim() || a.usuarioId || "Desconocido"
        : a.usuarioId || "Desconocido",
      modulo: a.modulo,
      accion: a.accion,
      entidad: a.entidad,
      entidadId: a.entidadId,
      resultado: a.resultado,
      datosAnteriores: a.datosAnteriores,
      datosNuevos: a.datosNuevos,
      agenteUsuario: a.agenteUsuario,
      direccionIp: a.direccionIp,
    })),
    total,
  };
}

export async function obtenerResumenAuditoria(
  filtros: FiltrosAuditoria
): Promise<ResumenAuditoria> {
  const where = construirFiltroPrisma(filtros);

  const [total, exitos, errores] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.count({ where: { ...where, resultado: "EXITOSO" } }),
    prisma.auditoria.count({ where: { ...where, resultado: "FALLIDO" } }),
  ]);

  return { total, exitos, errores };
}
