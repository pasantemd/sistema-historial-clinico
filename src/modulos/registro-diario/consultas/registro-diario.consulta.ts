import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/servicios/base-datos/prisma";
import type {
  FiltrosRegistroDiario,
  PaginaRegistrosDiarios,
  RegistroDiarioDetalleDto,
  RegistroDiarioFechaDto,
  RegistroDiarioResumenDto,
  TrabajadorRegistroDto,
} from "@/modulos/registro-diario/tipos";

const iso = (fecha: Date | null) => fecha?.toISOString().slice(0, 10) ?? null;
function edad(fecha: Date | null): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  let valor = hoy.getUTCFullYear() - fecha.getUTCFullYear();
  if (`${hoy.getUTCMonth()}-${hoy.getUTCDate()}` < `${fecha.getUTCMonth()}-${fecha.getUTCDate()}`) valor -= 1;
  return valor;
}

export async function buscarTrabajadoresParaRegistro(usuarioId: string, termino: string): Promise<TrabajadorRegistroDto[]> {
  const q = termino.trim();
  if (q.length < 2) return [];
  const trabajadores = await prisma.trabajador.findMany({
    where: {
      estadoLaboral: { not: "INACTIVO" },
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
      OR: [
        { numeroDocumento: { contains: q, mode: "insensitive" } },
        { nombres: { contains: q, mode: "insensitive" } },
        { apellidos: { contains: q, mode: "insensitive" } },
        { AND: [{ apellidos: { contains: q.split(/\s+/)[0], mode: "insensitive" } }, { nombres: { contains: q.split(/\s+/).at(-1), mode: "insensitive" } }] },
      ],
    },
    include: {
      empresa: { select: { id: true, razonSocial: true, ruc: true } },
      departamento: { select: { id: true, nombre: true } },
      alergias: { where: { activa: true }, select: { id: true, sustancia: true, severidad: true, descripcion: true } },
    },
    orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
    take: 20,
  });
  return trabajadores.map((item) => ({
    id: item.id,
    nombreCompleto: `${item.apellidos} ${item.nombres}`,
    numeroDocumento: item.numeroDocumento,
    fechaNacimiento: iso(item.fechaNacimiento),
    edad: edad(item.fechaNacimiento),
    empresaId: item.empresa.id,
    empresa: item.empresa.razonSocial,
    empresaRuc: item.empresa.ruc,
    departamentoId: item.departamento.id,
    departamento: item.departamento.nombre,
    alergias: item.alergias.map((a) => ({ id: a.id, sustancia: a.sustancia, severidad: a.severidad, reaccion: a.descripcion })),
  }));
}

export async function consultarTrabajadorParaRegistro(usuarioId: string, id: string): Promise<TrabajadorRegistroDto | null> {
  const resultados = await prisma.trabajador.findMany({
    where: {
      id,
      estadoLaboral: { not: "INACTIVO" },
      empresa: { usuariosAutorizados: { some: { usuarioId } } },
    },
    include: {
      empresa: { select: { id: true, razonSocial: true, ruc: true } },
      departamento: { select: { id: true, nombre: true } },
      alergias: { where: { activa: true }, select: { id: true, sustancia: true, severidad: true, descripcion: true } },
    },
    take: 1,
  });
  const item = resultados[0];
  if (!item) return null;
  return {
    id: item.id,
    nombreCompleto: `${item.apellidos} ${item.nombres}`,
    numeroDocumento: item.numeroDocumento,
    fechaNacimiento: iso(item.fechaNacimiento),
    edad: edad(item.fechaNacimiento),
    empresaId: item.empresa.id,
    empresa: item.empresa.razonSocial,
    empresaRuc: item.empresa.ruc,
    departamentoId: item.departamento.id,
    departamento: item.departamento.nombre,
    alergias: item.alergias.map((a) => ({ id: a.id, sustancia: a.sustancia, severidad: a.severidad, reaccion: a.descripcion })),
  };
}

function mapearResumen(item: {
  id: string; numeroRegistro: string; trabajadorId: string; empresaId: string; departamentoId: string | null; apellidosNombres: string; cedula: string;
  fechaNacimiento: Date | null; diaAtencion: Date; atencionMorbilidad: string; medicacion: string | null;
  procedimiento: string | null; firmaConfirmada: boolean; empresaNombreHistorico: string;
  departamentoNombreHistorico: string | null; profesionalNombreHistorico: string | null;
  estado: RegistroDiarioResumenDto["estado"];
  medicamentos?: Array<{ id: string; medicamentoInventarioId: string; nombreSnapshot: string; unidadSnapshot: string; cantidadEntregada: Prisma.Decimal }>;
}): RegistroDiarioResumenDto {
  return {
    id: item.id, numeroRegistro: item.numeroRegistro, trabajadorId: item.trabajadorId, empresaId: item.empresaId, departamentoId: item.departamentoId,
    nombreCompleto: item.apellidosNombres, numeroDocumento: item.cedula,
    fechaNacimiento: iso(item.fechaNacimiento), fechaAtencion: iso(item.diaAtencion) ?? "",
    atencionMorbilidad: item.atencionMorbilidad, medicacion: item.medicacion,
    procedimiento: item.procedimiento, firmaConfirmada: item.firmaConfirmada,
    empresa: item.empresaNombreHistorico, departamento: item.departamentoNombreHistorico,
    profesional: item.profesionalNombreHistorico, estado: item.estado,
    medicamentos: (item.medicamentos ?? []).map((medicamento) => ({
      id: medicamento.id,
      medicamentoInventarioId: medicamento.medicamentoInventarioId,
      nombreSnapshot: medicamento.nombreSnapshot,
      unidadSnapshot: medicamento.unidadSnapshot,
      cantidadEntregada: Number(medicamento.cantidadEntregada).toString(),
    })),
  };
}

export async function listarRegistrosDiarios(usuarioId: string, filtros: FiltrosRegistroDiario): Promise<PaginaRegistrosDiarios> {
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const porPagina = 25;
  const where = construirWhereRegistroDiario(usuarioId, filtros);
  const [total, registros] = await Promise.all([
    prisma.registroDiarioAtencion.count({ where }),
    prisma.registroDiarioAtencion.findMany({ where, include: { medicamentos: true }, orderBy: [{ diaAtencion: "desc" }, { creadoEn: "desc" }], skip: (pagina - 1) * porPagina, take: porPagina }),
  ]);
  return { registros: registros.map(mapearResumen), total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
}

function construirWhereRegistroDiario(usuarioId: string, filtros: FiltrosRegistroDiario): Prisma.RegistroDiarioAtencionWhereInput {
  const q = filtros.trabajador?.trim();
  return {
    empresa: { usuariosAutorizados: { some: { usuarioId } } },
    ...(filtros.fecha ? { diaAtencion: new Date(`${filtros.fecha}T00:00:00.000Z`) } : {}),
    ...(filtros.empresaId ? { empresaId: filtros.empresaId } : {}),
    ...(filtros.profesionalId ? { profesionalId: filtros.profesionalId } : {}),
    ...(filtros.estado && ["BORRADOR", "REGISTRADO", "ANULADO"].includes(filtros.estado) ? { estado: filtros.estado as "BORRADOR" | "REGISTRADO" | "ANULADO" } : {}),
    ...(q ? { OR: [{ apellidosNombres: { contains: q, mode: "insensitive" } }, { cedula: { contains: q, mode: "insensitive" } }] } : {}),
  };
}

export async function consultarRegistroDiario(usuarioId: string, id: string): Promise<RegistroDiarioDetalleDto | null> {
  const item = await prisma.registroDiarioAtencion.findFirst({
    where: { id, empresa: { usuariosAutorizados: { some: { usuarioId } } } },
    include: {
      medicamentos: true,
      recetas: {
        where: { estado: { not: "ANULADA" } },
        select: { id: true, numeroReceta: true, estado: true },
        orderBy: { creadoEn: "desc" },
        take: 1,
      },
    },
  });
  if (!item) return null;
  const recetaActiva = item.recetas?.[0] ?? null;
  return {
    ...mapearResumen(item),
    empresaRuc: item.empresaRucHistorico,
    observaciones: item.observaciones,
    anuladoEn: item.anuladoEn?.toISOString() ?? null,
    motivoAnulacion: item.motivoAnulacion,
    creadoEn: item.creadoEn.toISOString(),
    recetaAsociada: recetaActiva
      ? {
          id: recetaActiva.id,
          numeroReceta: recetaActiva.numeroReceta,
          estado: recetaActiva.estado,
        }
      : null,
  };
}

export async function consultarRegistrosDiariosPorFecha(
  usuarioId: string,
  filtros: FiltrosRegistroDiario & { fecha: string },
): Promise<RegistroDiarioFechaDto | null> {
  const registros = await prisma.registroDiarioAtencion.findMany({
    where: construirWhereRegistroDiario(usuarioId, filtros),
    include: { medicamentos: true },
    orderBy: [{ apellidosNombres: "asc" }],
  });
  if (registros.length === 0) return null;
  const ordenados = [...registros].sort((a, b) => a.numeroRegistro.localeCompare(b.numeroRegistro));
  const empresas = new Set(registros.map((registro) => registro.empresaNombreHistorico));
  const profesionales = new Set(registros.map((registro) => registro.profesionalNombreHistorico).filter(Boolean));
  return {
    fechaAtencion: filtros.fecha,
    empresa: empresas.size === 1 ? registros[0].empresaNombreHistorico : "Todas las empresas",
    empresaRuc: empresas.size === 1 ? registros[0].empresaRucHistorico : null,
    profesional: profesionales.size === 1 ? registros[0].profesionalNombreHistorico : null,
    numeroRegistroInicio: ordenados[0].numeroRegistro,
    numeroRegistroFin: ordenados[ordenados.length - 1].numeroRegistro,
    totalPacientes: registros.length,
    registros: registros.map(mapearResumen),
  };
}

export async function listarCatalogosRegistroDiario(usuarioId: string) {
  const [empresas, profesionales] = await Promise.all([
    prisma.empresa.findMany({ where: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } }, select: { id: true, razonSocial: true }, orderBy: { razonSocial: "asc" } }),
    prisma.usuario.findMany({
      where: {
        estado: "ACTIVO",
        empresasAutorizadas: {
          some: {
            empresa: { usuariosAutorizados: { some: { usuarioId } } },
          },
        },
      },
      select: { id: true, nombres: true, apellidos: true },
      orderBy: { apellidos: "asc" },
    }),
  ]);
  return { empresas, profesionales: profesionales.map((p) => ({ id: p.id, nombre: `${p.apellidos} ${p.nombres}` })) };
}
