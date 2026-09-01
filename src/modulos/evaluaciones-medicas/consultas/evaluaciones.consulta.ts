import { prisma } from "@/servicios/base-datos/prisma";
import type { ContextoEvaluacionDesdeRegistroDto, ContextoEvaluacionDto, EvaluacionResumenDto, PaginaEvaluaciones } from "@/modulos/evaluaciones-medicas/tipos";
import type { EntradaEvaluacion } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import type { Prisma } from "@/generated/prisma/client";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";

const fecha = (valor: Date | null) => valor?.toISOString().slice(0, 10) ?? null;

export async function consultarContextoEvaluacion(usuarioId: string, trabajadorId: string): Promise<ContextoEvaluacionDto | null> {
  const trabajador = await prisma.trabajador.findFirst({
    where: {
      id: trabajadorId,
      asignacionesLaborales: { some: { empresa: { usuariosAutorizados: { some: { usuarioId } } } } },
    },
    select: {
      id: true, nombres: true, apellidos: true, numeroDocumento: true, sexo: true, fechaNacimiento: true,
      asignacionesLaborales: { where: { activa: true, empresa: { usuariosAutorizados: { some: { usuarioId } } } }, take: 1, include: { empresa: true, departamento: true } },
      alergias: { where: { activa: true }, orderBy: [{ severidad: "desc" }, { sustancia: "asc" }] },
    },
  });
  const asignacion = trabajador?.asignacionesLaborales[0];
  if (!trabajador || !asignacion) return null;
  return {
    trabajador: { id: trabajador.id, nombre: `${trabajador.apellidos} ${trabajador.nombres}`, documento: trabajador.numeroDocumento, sexo: trabajador.sexo, fechaNacimiento: fecha(trabajador.fechaNacimiento) },
    asignacion: { id: asignacion.id, empresaId: asignacion.empresaId, empresa: asignacion.empresa.razonSocial, empresaRuc: asignacion.empresa.ruc,
      departamentoId: asignacion.departamentoId, departamento: asignacion.departamento.nombre, fechaInicio: fecha(asignacion.fechaInicio) },
    alergias: trabajador.alergias,
  };
}

export async function construirContextoEvaluacionDesdeRegistro(
  usuarioId: string,
  registroDiarioId: string,
): Promise<ContextoEvaluacionDesdeRegistroDto | null> {
  const registro = await prisma.registroDiarioAtencion.findFirst({
    where: {
      id: registroDiarioId,
      estado: { not: "ANULADO" },
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    select: {
      id: true,
      trabajadorId: true,
      empresaId: true,
      departamentoId: true,
      diaAtencion: true,
      atencionMorbilidad: true,
      procedimiento: true,
      profesionalId: true,
      profesionalNombreHistorico: true,
      empresaNombreHistorico: true,
      empresaRucHistorico: true,
      departamentoNombreHistorico: true,
      medicamentos: {
        select: {
          nombreSnapshot: true,
          unidadSnapshot: true,
          cantidadEntregada: true,
        },
        orderBy: { creadoEn: "asc" },
      },
      trabajador: {
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          numeroDocumento: true,
          sexo: true,
          fechaNacimiento: true,
          alergias: {
            where: { activa: true },
            orderBy: [{ severidad: "desc" }, { sustancia: "asc" }],
          },
        },
      },
    },
  });
  if (!registro) return null;

  const asignacion = await prisma.asignacionLaboral.findFirst({
    where: {
      trabajadorId: registro.trabajadorId,
      empresaId: registro.empresaId,
      departamentoId: registro.departamentoId ?? undefined,
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    include: {
      empresa: { select: { razonSocial: true, ruc: true } },
      departamento: { select: { nombre: true } },
    },
    orderBy: { creadoEn: "desc" },
  });
  if (!asignacion) return null;

  return {
    contexto: {
      trabajador: {
        id: registro.trabajador.id,
        nombre: `${registro.trabajador.apellidos} ${registro.trabajador.nombres}`,
        documento: registro.trabajador.numeroDocumento,
        sexo: registro.trabajador.sexo,
        fechaNacimiento: fecha(registro.trabajador.fechaNacimiento),
      },
      asignacion: {
        id: asignacion.id,
        empresaId: registro.empresaId,
        empresa: registro.empresaNombreHistorico,
        empresaRuc: registro.empresaRucHistorico ?? asignacion.empresa.ruc,
        departamentoId: asignacion.departamentoId,
        departamento:
          registro.departamentoNombreHistorico ?? asignacion.departamento.nombre,
        fechaInicio: fecha(asignacion.fechaInicio),
      },
      alergias: registro.trabajador.alergias,
    },
    registro: {
      id: registro.id,
      trabajadorId: registro.trabajadorId,
      fechaAtencion: registro.diaAtencion.toISOString().slice(0, 10),
      morbilidad: registro.atencionMorbilidad,
      procedimiento: registro.procedimiento,
      medico: {
        id: registro.profesionalId,
        nombre: registro.profesionalNombreHistorico,
      },
      medicamentos: registro.medicamentos.map((medicamento) => ({
        nombre: medicamento.nombreSnapshot,
        cantidadEntregada: Number(medicamento.cantidadEntregada),
        unidad: medicamento.unidadSnapshot,
      })),
    },
  };
}

const seleccionarResumen = {
  id: true,
  trabajadorId: true,
  trabajadorNombreHistorico: true,
  trabajadorDocumentoHistorico: true,
  empresaNombreHistorico: true,
  departamentoNombreHistorico: true,
  fechaAtencion: true,
  estado: true,
  profesionalNombreHistorico: true,
} as const;

function resumen(item: {
  id: string;
  trabajadorId: string;
  trabajadorNombreHistorico: string;
  trabajadorDocumentoHistorico: string;
  empresaNombreHistorico: string;
  departamentoNombreHistorico: string;
  fechaAtencion: Date | null;
  estado: "BORRADOR" | "FINALIZADA" | "ANULADA";
  profesionalNombreHistorico: string | null;
}): EvaluacionResumenDto {
  return {
    id: item.id,
    trabajadorId: item.trabajadorId,
    trabajador: item.trabajadorNombreHistorico,
    documento: item.trabajadorDocumentoHistorico,
    empresa: item.empresaNombreHistorico,
    departamento: item.departamentoNombreHistorico,
    fechaAtencion: fecha(item.fechaAtencion),
    estado: item.estado,
    profesional: item.profesionalNombreHistorico,
  };
}

const TAMANO_PAGINA_EVALUACIONES = 15;

export async function listarEvaluacionesPaginadas(
  usuarioId: string,
  filtros: { busqueda?: string; estado?: string; fechaDesde?: string; fechaHasta?: string },
  pagina = 1,
  tamanoPagina?: number,
): Promise<PaginaEvaluaciones> {
  const take = tamanoPagina ?? TAMANO_PAGINA_EVALUACIONES;
  const where: Prisma.EvaluacionMedicaWhereInput = {
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  if (filtros.estado) where.estado = filtros.estado as never;
  if (filtros.fechaDesde || filtros.fechaHasta) {
    where.fechaAtencion = {};
    if (filtros.fechaDesde) where.fechaAtencion.gte = new Date(`${filtros.fechaDesde}T00:00:00Z`);
    if (filtros.fechaHasta) where.fechaAtencion.lte = new Date(`${filtros.fechaHasta}T00:00:00Z`);
  }
  if (filtros.busqueda) {
    const termino = filtros.busqueda.trim();
    const tokens = termino.split(/\s+/).filter(Boolean);
    where.OR = [
      { trabajadorNombreHistorico: { contains: termino, mode: "insensitive" } },
      { trabajadorDocumentoHistorico: { contains: termino } },
      { empresaNombreHistorico: { contains: termino, mode: "insensitive" } },
      { profesionalNombreHistorico: { contains: termino, mode: "insensitive" } },
      { departamentoNombreHistorico: { contains: termino, mode: "insensitive" } },
      {
        diagnosticos: {
          some: {
            enfermedad: {
              OR: [
                { codigo: { contains: termino, mode: "insensitive" } },
                { descripcion: { contains: termino, mode: "insensitive" } },
              ],
            },
          },
        },
      },
      {
        AND: tokens.map((token) => ({
          trabajadorNombreHistorico: { contains: token, mode: "insensitive" as const },
        })),
      },
    ];
  }
  const total = await prisma.evaluacionMedica.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / take));
  const pag = Math.min(pagina, totalPaginas);
  const items = await prisma.evaluacionMedica.findMany({
    where,
    select: seleccionarResumen,
    orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }],
    skip: (pag - 1) * take,
    take,
  });
  return { items: items.map(resumen), total, pagina: pag, totalPaginas };
}

export async function listarEvaluaciones(usuarioId: string, trabajadorId?: string, soloFinalizadas = false): Promise<EvaluacionResumenDto[]> {
  const where: Prisma.EvaluacionMedicaWhereInput = {
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  };
  if (trabajadorId) where.trabajadorId = trabajadorId;
  if (soloFinalizadas) where.estado = "FINALIZADA";
  const items = await prisma.evaluacionMedica.findMany({ where, select: seleccionarResumen, orderBy: [{ fechaAtencion: "desc" }, { creadoEn: "desc" }], take: 100 });
  return items.map(resumen);
}

export async function consultarEvaluacion(usuarioId: string, id: string, trabajadorId?: string) {
  return prisma.evaluacionMedica.findFirst({ where: {
    id,
    trabajadorId,
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
  }, include: {
    diagnosticos: { include: { enfermedad: { select: { codigo: true, descripcion: true } } } },
    medicamentos: { include: { medicamento: true } }, receta: { select: { id: true } },
    registroDiario: {
      select: {
        medicamentos: {
          select: {
            nombreSnapshot: true,
            unidadSnapshot: true,
            cantidadEntregada: true,
          },
        },
      },
    },
  } });
}

export async function obtenerEvaluacionParaFormulario(usuarioId: string, id: string, trabajadorId: string): Promise<EntradaEvaluacion | null> {
  const item = await consultarEvaluacion(usuarioId, id, trabajadorId); if (!item) return null;
  return {
    trabajadorId: item.trabajadorId, registroDiarioId: item.registroDiarioId ?? "", fechaAtencion: fecha(item.fechaAtencion) ?? "", profesionalResponsable: item.profesionalNombreHistorico ?? "",
    morbilidad: item.morbilidad ?? "", motivoConsulta: item.motivoConsulta ?? "", sintomas: item.sintomas ?? "", tiempoEvolucion: item.tiempoEvolucion ?? "", observacionesMotivo: item.observacionesMotivo ?? "",
    temperatura: item.temperatura ?? "", presionArterial: item.presionArterial ?? "", frecuenciaCardiaca: item.frecuenciaCardiaca ?? "", frecuenciaRespiratoria: item.frecuenciaRespiratoria ?? "",
    saturacionOxigeno: item.saturacionOxigeno ?? "", peso: item.peso ?? "", talla: item.talla ?? "", antecedentesRelevantes: item.antecedentesRelevantes ?? "",
    examenFisico: item.examenFisico ?? "", observacionesClinicas: item.observacionesClinicas ?? "", observacionesDiagnostico: item.observacionesDiagnostico ?? "",
    indicaciones: item.indicaciones ?? "", recomendaciones: item.recomendaciones ?? "", reposoDias: item.reposoDias ?? "", seguimiento: item.seguimiento ?? "",
    proximaConsulta: fecha(item.proximaConsulta) ?? "", diagnosticos: item.diagnosticos.map((d) => ({ enfermedadId: d.enfermedadId, codigo: d.enfermedad.codigo, descripcion: d.enfermedad.descripcion, pre: d.pre, def: d.def })),
    medicamentos: item.medicamentos.map((m) => ({ nombreGenerico: m.medicamento.nombreGenerico, nombreComercial: m.medicamento.nombreComercial ?? "", presentacion: m.medicamento.presentacion, cantidad: m.cantidad?.toNumber() ?? "",
      dosis: m.dosis ?? "", frecuencia: m.frecuencia ?? "", duracion: m.duracion ?? "", viaAdministracion: m.viaAdministracion ?? "", indicaciones: m.indicaciones ?? "",
      alertaAlergiaConfirmada: m.alertaAlergiaConfirmada, justificacionAlergia: m.justificacionAlergia ?? "",
      origen: item.registroDiario?.medicamentos.some((origen) =>
        origen.nombreSnapshot.localeCompare(m.medicamento.nombreGenerico, undefined, { sensitivity: "base" }) === 0 &&
        etiquetaUnidadInventario(origen.unidadSnapshot).localeCompare(m.medicamento.presentacion, undefined, { sensitivity: "base" }) === 0 &&
        Number(origen.cantidadEntregada) === m.cantidad?.toNumber()
      ) ? "REGISTRO_DIARIO" as const : "EVALUACION" as const })),
  };
}

export async function listarAlergias(usuarioId: string, trabajadorId: string) {
  return prisma.alergiaTrabajador.findMany({
    where: { trabajadorId, trabajador: { empresa: { usuariosAutorizados: { some: { usuarioId } } } } },
    orderBy: [{ activa: "desc" }, { severidad: "desc" }, { sustancia: "asc" }],
  });
}

export async function listarRecetas(usuarioId: string) {
  return prisma.recetaMedica.findMany({ where: { empresa: { usuariosAutorizados: { some: { usuarioId } } } }, include: { medicamentos: true }, orderBy: [{ fechaEmision: "desc" }, { creadoEn: "desc" }], take: 100 });
}

export async function consultarReceta(usuarioId: string, id: string) {
  return prisma.recetaMedica.findFirst({ where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } }, include: { medicamentos: true, trabajador: { select: { alergias: { where: { activa: true } } } } } });
}
