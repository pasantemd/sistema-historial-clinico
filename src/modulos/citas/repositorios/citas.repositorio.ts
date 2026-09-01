import { prisma } from "@/servicios/base-datos/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { EntradaCita, ConflictoCita, CitaMedicaDto } from "@/modulos/citas/tipos";
import { calcularHoraFin } from "@/modulos/citas/validaciones/cita.schema";

const alcanceEmpresa = (usuarioId: string) => ({
  empresa: { usuariosAutorizados: { some: { usuarioId } } },
});

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function haySolapamiento(inicioA: number, finA: number, inicioB: number, finB: number): boolean {
  return inicioA < finB && inicioB < finA;
}

function traducirConflictoCita(error: unknown): never {
  const mensaje = error instanceof Error ? error.message : "";
  if (mensaje.includes("CitaMedica_trabajador_solape_activo_excl")) {
    throw new Error("El trabajador ya tiene una cita en ese horario.");
  }
  if (mensaje.includes("CitaMedica_profesional_solape_activo_excl")) {
    throw new Error("El profesional ya tiene una cita en ese horario.");
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Error de persistencia al guardar una cita", error.code);
    throw new Error("No fue posible guardar la cita.");
  }
  throw error;
}

export async function verificarConflictoCita(params: {
  usuarioId: string;
  profesionalId?: string;
  trabajadorId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ignorarId?: string;
}): Promise<ConflictoCita> {
  const { usuarioId, profesionalId, trabajadorId, fecha, horaInicio, horaFin, ignorarId } = params;
  const inicio = aMinutos(horaInicio);
  const fin = aMinutos(horaFin);

  const candidatas = await prisma.citaMedica.findMany({
    where: {
      ...alcanceEmpresa(usuarioId),
      fecha: new Date(`${fecha}T00:00:00Z`),
      estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
      id: ignorarId ? { not: ignorarId } : undefined,
      OR: [
        profesionalId ? { profesionalId } : { id: "__ninguna__" },
        { trabajadorId },
      ],
    },
    select: {
      id: true,
      fecha: true,
      horaInicio: true,
      horaFin: true,
      motivo: true,
      profesionalId: true,
      trabajadorId: true,
    },
  });

  const solapadas = candidatas
    .filter((c) => {
      const cInicio = aMinutos(c.horaInicio);
      const cFin = c.horaFin ? aMinutos(c.horaFin) : cInicio + 30;
      return haySolapamiento(inicio, fin, cInicio, cFin);
    })
  const citas = solapadas.map((c) => ({
      id: c.id,
      fecha: c.fecha.toISOString().slice(0, 10),
      horaInicio: c.horaInicio,
      horaFin: c.horaFin,
      motivo: c.motivo,
    }));

  return {
    profesional: profesionalId
      ? solapadas.some((c) => c.profesionalId === profesionalId)
      : false,
    trabajador: solapadas.some((c) => c.trabajadorId === trabajadorId),
    citas,
  };
}

export async function crearCitaRepositorio(entrada: EntradaCita, creadoPorId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const trabajador = await tx.trabajador.findFirst({
        where: {
          id: entrada.trabajadorId,
          empresa: { usuariosAutorizados: { some: { usuarioId: creadoPorId } } },
        },
        select: { empresaId: true, departamentoId: true },
      });
      if (!trabajador) throw new Error("El trabajador no fue encontrado.");

      const horaFin = calcularHoraFin(entrada.horaInicio, entrada.duracionMinutos);

      return tx.citaMedica.create({
        data: {
          trabajadorId: entrada.trabajadorId,
          empresaId: trabajador.empresaId,
          departamentoId: trabajador.departamentoId,
          profesionalId: entrada.profesionalId || null,
          fecha: new Date(`${entrada.fecha}T00:00:00Z`),
          horaInicio: entrada.horaInicio,
          horaFin,
          motivo: entrada.motivo,
          observaciones: entrada.observaciones || null,
          recordatorio: entrada.recordatorio,
          estado: "PROGRAMADA",
          creadoPorId,
        },
        select: { id: true },
      });
    });
  } catch (error) {
    traducirConflictoCita(error);
  }
}

export async function actualizarCitaRepositorio(id: string, entrada: EntradaCita, usuarioId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existente = await tx.citaMedica.findFirst({
        where: { id, ...alcanceEmpresa(usuarioId) },
        select: { id: true, estado: true },
      });
      if (!existente) throw new Error("La cita no fue encontrada.");
      if (existente.estado !== "PROGRAMADA" && existente.estado !== "CONFIRMADA") {
        throw new Error("Solo se pueden editar citas programadas o confirmadas.");
      }

      const trabajador = await tx.trabajador.findFirst({
        where: {
          id: entrada.trabajadorId,
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
        select: { empresaId: true, departamentoId: true },
      });
      if (!trabajador) throw new Error("El trabajador no fue encontrado.");

      const horaFin = calcularHoraFin(entrada.horaInicio, entrada.duracionMinutos);

      const resultado = await tx.citaMedica.updateMany({
        where: { id, estado: { in: ["PROGRAMADA", "CONFIRMADA"] }, ...alcanceEmpresa(usuarioId) },
        data: {
          trabajadorId: entrada.trabajadorId,
          empresaId: trabajador.empresaId,
          departamentoId: trabajador.departamentoId,
          profesionalId: entrada.profesionalId || null,
          fecha: new Date(`${entrada.fecha}T00:00:00Z`),
          horaInicio: entrada.horaInicio,
          horaFin,
          motivo: entrada.motivo,
          observaciones: entrada.observaciones || null,
          recordatorio: entrada.recordatorio,
        },
      });
      if (!resultado.count) {
        throw new Error("La cita cambió de estado y ya no se puede editar.");
      }
      return { id };
    });
  } catch (error) {
    traducirConflictoCita(error);
  }
}

export async function cancelarCitaRepositorio(id: string, motivo: string, usuarioId: string) {
  const resultado = await prisma.citaMedica.updateMany({
    where: { id, estado: { in: ["PROGRAMADA", "CONFIRMADA"] }, ...alcanceEmpresa(usuarioId) },
    data: {
      estado: "CANCELADA",
      canceladaEn: new Date(),
      motivoCancelacion: motivo,
    },
  });
  if (resultado.count) return { id };

  const existente = await prisma.citaMedica.findFirst({ where: { id, ...alcanceEmpresa(usuarioId) }, select: { estado: true } });
  if (!existente) throw new Error("La cita no fue encontrada.");
  if (existente.estado === "CANCELADA") throw new Error("La cita ya está cancelada.");
  throw new Error("Solo se pueden cancelar citas programadas o confirmadas.");
}

export async function atenderCitaRepositorio(id: string, usuarioId: string) {
  const resultado = await prisma.citaMedica.updateMany({
    where: { id, estado: { in: ["PROGRAMADA", "CONFIRMADA"] }, ...alcanceEmpresa(usuarioId) },
    data: { estado: "ATENDIDA" },
  });
  if (resultado.count) return { id };

  const existente = await prisma.citaMedica.findFirst({ where: { id, ...alcanceEmpresa(usuarioId) }, select: { estado: true } });
  if (!existente) throw new Error("La cita no fue encontrada.");
  throw new Error("Solo se pueden atender citas programadas o confirmadas.");
}

export async function confirmarCitaRepositorio(id: string, usuarioId: string) {
  const resultado = await prisma.citaMedica.updateMany({
    where: { id, estado: "PROGRAMADA", ...alcanceEmpresa(usuarioId) },
    data: { estado: "CONFIRMADA" },
  });
  if (resultado.count) return { id };

  const existente = await prisma.citaMedica.findFirst({ where: { id, ...alcanceEmpresa(usuarioId) }, select: { estado: true } });
  if (!existente) throw new Error("La cita no fue encontrada.");
  throw new Error("Solo se pueden confirmar citas programadas.");
}

export async function consultarCitaRepositorio(id: string, usuarioId: string) {
  return prisma.citaMedica.findFirst({
    where: { id, ...alcanceEmpresa(usuarioId) },
    include: {
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      profesional: { select: { nombres: true, apellidos: true } },
    },
  });
}

export async function listarProfesionalesRepositorio(usuarioId: string) {
  const usuarios = await prisma.usuario.findMany({
    where: {
      estado: "ACTIVO",
      empresasAutorizadas: {
        some: {
          empresa: { usuariosAutorizados: { some: { usuarioId } } },
        },
      },
      roles: {
        some: {
          rol: {
            permisos: {
              some: { permiso: { codigo: "cita.atender" } },
            },
          },
        },
      },
    },
    select: { id: true, nombres: true, apellidos: true, correo: true },
    orderBy: [{ nombres: "asc" }],
  });
  return usuarios.map((u) => ({ id: u.id, nombre: `${u.nombres} ${u.apellidos}`, correo: u.correo }));
}

export async function listarTrabajadoresCitaRepositorio(usuarioId: string, busqueda?: string) {
  const trabajadores = await prisma.trabajador.findMany({
    where: {
      estadoLaboral: "ACTIVO",
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
      OR: busqueda
        ? [
            { nombres: { contains: busqueda, mode: "insensitive" } },
            { apellidos: { contains: busqueda, mode: "insensitive" } },
            { numeroDocumento: { contains: busqueda } },
          ]
        : undefined,
    },
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      numeroDocumento: true,
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      alergias: {
        where: { activa: true },
        select: { sustancia: true, severidad: true },
        orderBy: { severidad: "desc" },
      },
      evaluacionesMedicas: {
        where: { estado: { not: "ANULADA" } },
        select: { fechaAtencion: true, motivoConsulta: true },
        orderBy: { fechaAtencion: "desc" },
        take: 1,
      },
      citas: {
        where: {
          fecha: { gte: new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z") },
          estado: { in: ["PROGRAMADA", "CONFIRMADA"] },
        },
        select: { fecha: true, horaInicio: true },
        orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
        take: 1,
      },
    },
    orderBy: [{ apellidos: "asc" }],
    take: busqueda ? 50 : 200,
  });
  return trabajadores.map((t) => ({
    id: t.id,
    nombre: `${t.nombres} ${t.apellidos}`,
    documento: t.numeroDocumento,
    empresa: t.empresa.razonSocial,
    departamento: t.departamento.nombre,
    alergias: t.alergias,
    ultimaEvaluacion: t.evaluacionesMedicas[0]
      ? {
          fecha: t.evaluacionesMedicas[0].fechaAtencion?.toISOString().slice(0, 10) ?? "Sin fecha clínica",
          motivo: t.evaluacionesMedicas[0].motivoConsulta,
        }
      : null,
    proximaCita: t.citas[0]
      ? {
          fecha: t.citas[0].fecha.toISOString().slice(0, 10),
          hora: t.citas[0].horaInicio,
        }
      : null,
  }));
}

export interface FiltrosCita {
  estado?: string;
  profesionalId?: string;
  trabajadorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  trabajador?: string;
  profesional?: string;
  empresa?: string;
  desde?: number;
  hasta?: number;
}

const TAMANO_PAGINA_CITAS = 15;

function construirWhereCitas(usuarioId: string, filtros: Omit<FiltrosCita, "desde" | "hasta">) {
  return {
    estado: filtros.estado as never,
    profesionalId: filtros.profesionalId || undefined,
    trabajadorId: filtros.trabajadorId || undefined,
    trabajador: filtros.trabajador
      ? {
          OR: [
            { nombres: { contains: filtros.trabajador, mode: "insensitive" } },
            { apellidos: { contains: filtros.trabajador, mode: "insensitive" } },
            { numeroDocumento: { contains: filtros.trabajador } },
          ],
        }
      : undefined,
    profesional: filtros.profesional
      ? {
          OR: [
            { nombres: { contains: filtros.profesional, mode: "insensitive" } },
            { apellidos: { contains: filtros.profesional, mode: "insensitive" } },
          ],
        }
      : undefined,
    empresa: {
      usuariosAutorizados: { some: { usuarioId } },
      razonSocial: filtros.empresa
        ? { contains: filtros.empresa, mode: "insensitive" }
        : undefined,
    },
    fecha:
      filtros.fechaDesde || filtros.fechaHasta
        ? {
            gte: filtros.fechaDesde ? new Date(`${filtros.fechaDesde}T00:00:00Z`) : undefined,
            lte: filtros.fechaHasta ? new Date(`${filtros.fechaHasta}T00:00:00Z`) : undefined,
          }
        : undefined,
  } as const;
}

export async function listarCitasPaginadas(
  usuarioId: string,
  filtros: Omit<FiltrosCita, "desde" | "hasta">,
  pagina = 1,
  tamanoPagina?: number,
): Promise<{ citas: CitaMedicaDto[]; total: number; pagina: number; totalPaginas: number }> {
  const take = tamanoPagina ?? TAMANO_PAGINA_CITAS;
  const where = construirWhereCitas(usuarioId, filtros);
  const total = await prisma.citaMedica.count({ where: where as never });
  const totalPaginas = Math.max(1, Math.ceil(total / take));
  const pag = Math.min(pagina, totalPaginas);
  const citas = await prisma.citaMedica.findMany({
    where: where as never,
    include: {
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      profesional: { select: { nombres: true, apellidos: true } },
    },
    orderBy: [{ fecha: "desc" }, { horaInicio: "desc" }],
    skip: (pag - 1) * take,
    take,
  });
  return {
    citas: citas.map((c) => ({
      id: c.id,
      fecha: c.fecha.toISOString().slice(0, 10),
      horaInicio: c.horaInicio,
      horaFin: c.horaFin,
      motivo: c.motivo,
      observaciones: c.observaciones,
      estado: c.estado,
      recordatorio: c.recordatorio,
      trabajadorId: c.trabajadorId,
      trabajadorNombre: `${c.trabajador.nombres} ${c.trabajador.apellidos}`,
      trabajadorDocumento: c.trabajador.numeroDocumento,
      empresaNombre: c.empresa?.razonSocial ?? null,
      departamentoNombre: c.departamento?.nombre ?? null,
      profesionalId: c.profesionalId,
      profesionalNombre: c.profesional ? `${c.profesional.nombres} ${c.profesional.apellidos}` : null,
      creadoEn: c.creadoEn.toISOString(),
    })),
    total,
    pagina: pag,
    totalPaginas,
  };
}

export async function listarCitasRepositorio(usuarioId: string, filtros: FiltrosCita): Promise<CitaMedicaDto[]> {
  const where = construirWhereCitas(usuarioId, filtros);
  const citas = await prisma.citaMedica.findMany({
    where: where as never,
    include: {
      trabajador: { select: { nombres: true, apellidos: true, numeroDocumento: true } },
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      profesional: { select: { nombres: true, apellidos: true } },
    },
    orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    skip: filtros.desde,
    take: filtros.hasta,
  });

  return citas.map((c) => ({
    id: c.id,
    fecha: c.fecha.toISOString().slice(0, 10),
    horaInicio: c.horaInicio,
    horaFin: c.horaFin,
    motivo: c.motivo,
    observaciones: c.observaciones,
    estado: c.estado,
    recordatorio: c.recordatorio,
    trabajadorId: c.trabajadorId,
    trabajadorNombre: `${c.trabajador.nombres} ${c.trabajador.apellidos}`,
    trabajadorDocumento: c.trabajador.numeroDocumento,
    empresaNombre: c.empresa?.razonSocial ?? null,
    departamentoNombre: c.departamento?.nombre ?? null,
    profesionalId: c.profesionalId,
    profesionalNombre: c.profesional ? `${c.profesional.nombres} ${c.profesional.apellidos}` : null,
    creadoEn: c.creadoEn.toISOString(),
  }));
}
