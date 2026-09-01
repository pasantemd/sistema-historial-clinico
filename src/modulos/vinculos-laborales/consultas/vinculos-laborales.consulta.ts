import { prisma } from "@/servicios/base-datos/prisma";

export async function consultarVinculosLaborales(usuarioId: string) {
  return prisma.asignacionLaboral.findMany({
    where: { empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } } },
    select: {
      id: true,
      fechaReingreso: true,
      fechaFin: true,
      activa: true,
      estado: true,
      trabajador: { select: { id: true, nombres: true, apellidos: true, numeroDocumento: true } },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
    },
    orderBy: [{ creadoEn: "desc" }],
    take: 100,
  });
}
