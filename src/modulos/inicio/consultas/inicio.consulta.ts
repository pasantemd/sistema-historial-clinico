import { prisma } from "@/servicios/base-datos/prisma";

function inicioDiaUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

export async function consultarResumenInicio(usuarioId: string) {
  const hoy = inicioDiaUtc();
  const manana = sumarDias(hoy, 1);
  const limiteProximas = sumarDias(hoy, 8);

  const [
    trabajadoresActivos,
    registrosHoy,
    evaluacionesMedicas,
    citasHoy,
    citasProximas,
    recetasEmitidas,
    fichasBorrador,
    registrosRecientes,
    proximasCitas,
  ] = await Promise.all([
    prisma.trabajador.count({
      where: {
        estadoLaboral: "ACTIVO",
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.registroDiarioAtencion.count({
      where: {
        diaAtencion: { gte: hoy, lt: manana },
        estado: { not: "ANULADO" },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.evaluacionMedica.count({
      where: {
        estado: { not: "ANULADA" },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.citaMedica.count({
      where: {
        fecha: { gte: hoy, lt: manana },
        estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.citaMedica.count({
      where: {
        fecha: { gte: manana, lt: limiteProximas },
        estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.recetaMedica.count({
      where: {
        estado: "EMITIDA",
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.fichaOcupacional.count({
      where: {
        estado: "BORRADOR",
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
    }),
    prisma.registroDiarioAtencion.findMany({
      where: {
        estado: { not: "ANULADO" },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      select: {
        id: true,
        trabajadorId: true,
        diaAtencion: true,
        atencionMorbilidad: true,
        estado: true,
        apellidosNombres: true,
        empresaNombreHistorico: true,
        profesionalNombreHistorico: true,
      },
      orderBy: [{ diaAtencion: "desc" }, { creadoEn: "desc" }],
      take: 10,
    }),
    prisma.citaMedica.findMany({
      where: {
        fecha: { gte: hoy, lt: limiteProximas },
        estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
        empresa: { usuariosAutorizados: { some: { usuarioId } } },
      },
      select: {
        id: true,
        fecha: true,
        horaInicio: true,
        motivo: true,
        estado: true,
        trabajador: { select: { nombres: true, apellidos: true } },
        profesional: { select: { nombres: true, apellidos: true } },
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      take: 8,
    }),
  ]);

  return {
    metricas: {
      trabajadoresActivos,
      registrosHoy,
      evaluacionesMedicas,
      citasHoy,
      citasProximas,
      recetasEmitidas,
      fichasBorrador,
    },
    registrosRecientes: registrosRecientes.map((registro) => ({
      ...registro,
      diaAtencion: registro.diaAtencion.toISOString().slice(0, 10),
    })),
    proximasCitas: proximasCitas.map((cita) => ({
      id: cita.id,
      fecha: cita.fecha.toISOString().slice(0, 10),
      horaInicio: cita.horaInicio,
      motivo: cita.motivo,
      estado: cita.estado,
      trabajadorNombre: `${cita.trabajador.apellidos} ${cita.trabajador.nombres}`,
      profesionalNombre: cita.profesional
        ? `${cita.profesional.apellidos} ${cita.profesional.nombres}`
        : null,
    })),
  };
}
