import { prisma } from "@/servicios/base-datos/prisma";
import type { CitaMedicaDto } from "@/modulos/citas/tipos";

export async function listarCitasDeTrabajador(
  usuarioId: string,
  trabajadorId: string,
): Promise<CitaMedicaDto[]> {
  const citas = await prisma.citaMedica.findMany({
    where: {
      trabajadorId,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    include: {
      trabajador: {
        select: { nombres: true, apellidos: true, numeroDocumento: true },
      },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      profesional: { select: { nombres: true, apellidos: true } },
    },
    orderBy: [{ fecha: "desc" }, { horaInicio: "desc" }],
    take: 100,
  });

  return citas.map((cita) => ({
    id: cita.id,
    fecha: cita.fecha.toISOString().slice(0, 10),
    horaInicio: cita.horaInicio,
    horaFin: cita.horaFin,
    motivo: cita.motivo,
    observaciones: cita.observaciones,
    estado: cita.estado,
    recordatorio: cita.recordatorio,
    trabajadorId: cita.trabajadorId,
    trabajadorNombre: `${cita.trabajador.nombres} ${cita.trabajador.apellidos}`,
    trabajadorDocumento: cita.trabajador.numeroDocumento,
    empresaNombre: cita.empresa?.razonSocial ?? null,
    departamentoNombre: cita.departamento?.nombre ?? null,
    profesionalId: cita.profesionalId,
    profesionalNombre: cita.profesional
      ? `${cita.profesional.nombres} ${cita.profesional.apellidos}`
      : null,
    creadoEn: cita.creadoEn.toISOString(),
  }));
}
