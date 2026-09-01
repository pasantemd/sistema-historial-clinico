import type { Prisma } from "@/generated/prisma/client";
import type { TipoMovimientoInventario } from "@/generated/prisma/enums";
import { prisma } from "@/servicios/base-datos/prisma";
import type {
  DatosMedicamentoInventario,
  DatosMovimientoInventario,
} from "@/modulos/inventario/validaciones/inventario.schema";
import type {
  FiltrosInventario,
  MedicamentoInventarioBusquedaDto,
  MedicamentoInventarioDetalleDto,
  MedicamentoInventarioResumenDto,
  MovimientoInventarioDto,
  PaginaInventarioDto,
  ReporteMovimientosInventarioDto,
} from "@/modulos/inventario/tipos";
import {
  MedicamentoInventarioInactivoError,
  MedicamentoInventarioNoEncontradoError,
  StockInsuficienteError,
} from "@/modulos/inventario/errores";

type Tx = Prisma.TransactionClient;

const STOCK_BAJO = 5;
const decimal = (valor: Prisma.Decimal | number | string) => Number(valor);
const decimalTexto = (valor: Prisma.Decimal | number | string) => decimal(valor).toString();
const texto = (valor?: string | null) => valor?.trim() || null;
const fechaCivil = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

const incluirMovimientoDetalle = {
  medicamentoInventario: { select: { nombre: true } },
  usuario: { select: { nombres: true, apellidos: true } },
  entregasRegistro: {
    take: 1,
    select: {
      registroDiario: {
        select: {
          numeroRegistro: true,
          apellidosNombres: true,
          profesionalNombreHistorico: true,
        },
      },
    },
  },
} satisfies Prisma.MovimientoInventarioInclude;

function mapearMovimiento(item: {
  id: string;
  medicamentoInventarioId: string;
  tipoMovimiento: TipoMovimientoInventario;
  cantidad: Prisma.Decimal;
  cantidadAnterior: Prisma.Decimal;
  cantidadPosterior: Prisma.Decimal;
  motivo: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  creadoEn: Date;
  medicamentoInventario: { nombre: string };
  usuario: { nombres: string; apellidos: string };
  entregasRegistro?: Array<{
    registroDiario: {
      numeroRegistro: string;
      apellidosNombres: string;
      profesionalNombreHistorico: string | null;
    };
  }>;
}): MovimientoInventarioDto {
  const nombreUsuario = `${item.usuario.apellidos} ${item.usuario.nombres}`.trim();
  const entrega = item.entregasRegistro?.[0]?.registroDiario;
  const concepto = entrega
    ? `Registro diario ${entrega.numeroRegistro}`
    : item.referenciaTipo === "REGISTRO_DIARIO_ANULADO"
      ? "Anulación de registro diario"
      : item.referenciaTipo
        ? item.referenciaTipo.toLocaleLowerCase("es").replaceAll("_", " ")
        : "Movimiento manual";
  return {
    id: item.id,
    medicamentoInventarioId: item.medicamentoInventarioId,
    medicamento: item.medicamentoInventario.nombre,
    tipoMovimiento: item.tipoMovimiento,
    cantidad: decimalTexto(item.cantidad),
    cantidadAnterior: decimalTexto(item.cantidadAnterior),
    cantidadPosterior: decimalTexto(item.cantidadPosterior),
    motivo: item.motivo,
    referenciaTipo: item.referenciaTipo,
    referenciaId: item.referenciaId,
    usuario: nombreUsuario,
    responsable: entrega?.profesionalNombreHistorico?.trim() || nombreUsuario,
    destinatario: entrega?.apellidosNombres ?? null,
    concepto,
    creadoEn: item.creadoEn.toISOString(),
  };
}

function mapearMedicamento(item: {
  id: string;
  nombre: string;
  cantidadDisponible: Prisma.Decimal;
  unidad: MedicamentoInventarioResumenDto["unidad"];
  fechaCaducidad: Date | null;
  estado: MedicamentoInventarioResumenDto["estado"];
  observaciones: string | null;
  movimientos?: Array<{ creadoEn: Date; tipoMovimiento: TipoMovimientoInventario; cantidad: Prisma.Decimal }>;
}): MedicamentoInventarioResumenDto {
  const ultimo = item.movimientos?.[0];
  return {
    id: item.id,
    nombre: item.nombre,
    cantidadDisponible: decimalTexto(item.cantidadDisponible),
    unidad: item.unidad,
    fechaCaducidad: item.fechaCaducidad?.toISOString().slice(0, 10) ?? null,
    estado: item.estado,
    observaciones: item.observaciones,
    ultimoMovimiento: ultimo
      ? `${ultimo.tipoMovimiento} · ${decimalTexto(ultimo.cantidad)} · ${ultimo.creadoEn.toISOString().slice(0, 10)}`
      : null,
  };
}

function construirWhere(filtros: FiltrosInventario): Prisma.MedicamentoInventarioWhereInput {
  const where: Prisma.MedicamentoInventarioWhereInput = {};
  if (filtros.busqueda?.trim()) {
    where.nombre = { contains: filtros.busqueda.trim(), mode: "insensitive" };
  }
  if (filtros.estado === "ACTIVO" || filtros.estado === "INACTIVO") {
    where.estado = filtros.estado;
  }
  if (filtros.sinStock) {
    where.cantidadDisponible = { equals: 0 };
  } else if (filtros.stockBajo) {
    where.cantidadDisponible = { gt: 0, lte: STOCK_BAJO };
  }
  return where;
}

export async function listarInventarioRepositorio(filtros: FiltrosInventario): Promise<PaginaInventarioDto> {
  const take = filtros.tamanoPagina ?? 20;
  const pagina = Math.max(1, filtros.pagina ?? 1);
  const where = construirWhere(filtros);
  const [total, items, indicadores] = await Promise.all([
    prisma.medicamentoInventario.count({ where }),
    prisma.medicamentoInventario.findMany({
      where,
      orderBy: [{ estado: "asc" }, { nombre: "asc" }],
      skip: (pagina - 1) * take,
      take,
      include: {
        movimientos: {
          orderBy: { creadoEn: "desc" },
          take: 1,
          select: { creadoEn: true, tipoMovimiento: true, cantidad: true },
        },
      },
    }),
    prisma.medicamentoInventario.aggregate({
      where: { estado: "ACTIVO" },
      _count: { id: true },
      _sum: { cantidadDisponible: true },
    }),
  ]);
  const [sinStock, stockBajo] = await Promise.all([
    prisma.medicamentoInventario.count({ where: { estado: "ACTIVO", cantidadDisponible: 0 } }),
    prisma.medicamentoInventario.count({ where: { estado: "ACTIVO", cantidadDisponible: { gt: 0, lte: STOCK_BAJO } } }),
  ]);
  return {
    medicamentos: items.map(mapearMedicamento),
    indicadores: {
      activos: indicadores._count.id,
      unidadesDisponibles: decimalTexto(indicadores._sum.cantidadDisponible ?? 0),
      sinStock,
      stockBajo,
    },
    total,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(total / take)),
  };
}

export async function consultarMedicamentoInventarioRepositorio(id: string): Promise<MedicamentoInventarioDetalleDto | null> {
  const item = await prisma.medicamentoInventario.findUnique({
    where: { id },
    include: {
      movimientos: {
        orderBy: { creadoEn: "desc" },
        take: 25,
        include: incluirMovimientoDetalle,
      },
      entregasRegistro: {
        where: { registroDiario: { estado: "REGISTRADO" } },
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          cantidadEntregada: true,
          unidadSnapshot: true,
          registroDiario: {
            select: {
              id: true,
              numeroRegistro: true,
              apellidosNombres: true,
              cedula: true,
              diaAtencion: true,
              empresaNombreHistorico: true,
              profesionalNombreHistorico: true,
              creadoPor: { select: { nombres: true, apellidos: true } },
            },
          },
          movimientoInventario: {
            select: {
              usuario: { select: { nombres: true, apellidos: true } },
            },
          },
        },
      },
    },
  });
  if (!item) return null;
  return {
    ...mapearMedicamento(item),
    creadoEn: item.creadoEn.toISOString(),
    actualizadoEn: item.actualizadoEn.toISOString(),
    movimientos: item.movimientos.map(mapearMovimiento),
    entregas: item.entregasRegistro.map((entrega) => {
      const usuarioMovimiento = entrega.movimientoInventario?.usuario;
      const creadoPor = entrega.registroDiario.creadoPor;
      const responsableRespaldo = usuarioMovimiento
        ? `${usuarioMovimiento.apellidos} ${usuarioMovimiento.nombres}`.trim()
        : `${creadoPor.apellidos} ${creadoPor.nombres}`.trim();
      return {
        id: entrega.id,
        registroDiarioId: entrega.registroDiario.id,
        numeroRegistro: entrega.registroDiario.numeroRegistro,
        trabajador: entrega.registroDiario.apellidosNombres,
        cedula: entrega.registroDiario.cedula,
        empresa: entrega.registroDiario.empresaNombreHistorico,
        diaAtencion: entrega.registroDiario.diaAtencion.toISOString().slice(0, 10),
        cantidadEntregada: decimalTexto(entrega.cantidadEntregada),
        unidad: entrega.unidadSnapshot,
        responsable: entrega.registroDiario.profesionalNombreHistorico?.trim() || responsableRespaldo,
        concepto: `Registro diario ${entrega.registroDiario.numeroRegistro}`,
      };
    }),
  };
}

export async function consultarMovimientosMedicamentoInventarioRepositorio(
  id: string,
): Promise<ReporteMovimientosInventarioDto | null> {
  const item = await prisma.medicamentoInventario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      cantidadDisponible: true,
      unidad: true,
      fechaCaducidad: true,
      estado: true,
      movimientos: {
        orderBy: { creadoEn: "desc" },
        include: incluirMovimientoDetalle,
      },
    },
  });
  if (!item) return null;
  return {
    id: item.id,
    nombre: item.nombre,
    cantidadDisponible: decimalTexto(item.cantidadDisponible),
    unidad: item.unidad,
    fechaCaducidad: item.fechaCaducidad?.toISOString().slice(0, 10) ?? null,
    estado: item.estado,
    movimientos: item.movimientos.map(mapearMovimiento),
  };
}

export async function buscarMedicamentosInventarioRepositorio(termino: string): Promise<MedicamentoInventarioBusquedaDto[]> {
  if (termino.trim().length < 2) return [];
  const items = await prisma.medicamentoInventario.findMany({
    where: { estado: "ACTIVO", nombre: { contains: termino.trim(), mode: "insensitive" } },
    orderBy: { nombre: "asc" },
    take: 20,
    select: { id: true, nombre: true, cantidadDisponible: true, unidad: true },
  });
  return items.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    cantidadDisponible: decimalTexto(item.cantidadDisponible),
    unidad: item.unidad,
  }));
}

export async function crearMedicamentoInventarioRepositorio(datos: DatosMedicamentoInventario, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const medicamento = await tx.medicamentoInventario.create({
      data: {
        nombre: datos.nombre.trim(),
        cantidadDisponible: 0,
        unidad: datos.unidad,
        fechaCaducidad: fechaCivil(datos.fechaCaducidad),
        observaciones: texto(datos.observaciones),
        creadoPorUsuarioId: usuarioId,
        actualizadoPorUsuarioId: usuarioId,
      },
      select: { id: true, cantidadDisponible: true },
    });
    if (datos.cantidadDisponible > 0) {
      await crearMovimientoInventarioTx(tx, {
        medicamentoInventarioId: medicamento.id,
        tipoMovimiento: "ENTRADA",
        cantidad: datos.cantidadDisponible,
        motivo: "Stock inicial",
      }, usuarioId);
    }
    return { id: medicamento.id };
  });
}

export async function editarMedicamentoInventarioRepositorio(id: string, datos: DatosMedicamentoInventario, usuarioId: string) {
  const existente = await prisma.medicamentoInventario.findUnique({ where: { id }, select: { id: true, cantidadDisponible: true } });
  if (!existente) throw new MedicamentoInventarioNoEncontradoError();
  return prisma.medicamentoInventario.update({
    where: { id },
    data: {
      nombre: datos.nombre.trim(),
      unidad: datos.unidad,
      fechaCaducidad: fechaCivil(datos.fechaCaducidad),
      ...(datos.estado ? { estado: datos.estado } : {}),
      observaciones: texto(datos.observaciones),
      actualizadoPorUsuarioId: usuarioId,
    },
    select: { id: true },
  });
}

export async function cambiarEstadoMedicamentoInventarioRepositorio(id: string, activar: boolean, usuarioId: string) {
  const existente = await prisma.medicamentoInventario.findUnique({ where: { id }, select: { id: true } });
  if (!existente) throw new MedicamentoInventarioNoEncontradoError();
  return prisma.medicamentoInventario.update({
    where: { id },
    data: { estado: activar ? "ACTIVO" : "INACTIVO", actualizadoPorUsuarioId: usuarioId },
    select: { id: true },
  });
}

async function clasificarErrorMovimiento(tx: Tx, medicamentoInventarioId: string): Promise<never> {
  const item = await tx.medicamentoInventario.findUnique({
    where: { id: medicamentoInventarioId },
    select: { estado: true, cantidadDisponible: true },
  });
  if (!item) throw new MedicamentoInventarioNoEncontradoError();
  if (item.estado !== "ACTIVO") throw new MedicamentoInventarioInactivoError();
  throw new StockInsuficienteError();
}

export async function crearMovimientoInventarioTx(
  tx: Tx,
  datos: DatosMovimientoInventario & { referenciaTipo?: string | null; referenciaId?: string | null },
  usuarioId: string,
) {
  const { medicamentoInventarioId, tipoMovimiento, cantidad, motivo } = datos;
  let anterior: number;
  let posterior: number;

  if (tipoMovimiento === "AJUSTE") {
    const item = await tx.medicamentoInventario.findUnique({
      where: { id: medicamentoInventarioId },
      select: { id: true, estado: true, cantidadDisponible: true },
    });
    if (!item) throw new MedicamentoInventarioNoEncontradoError();
    if (item.estado !== "ACTIVO") throw new MedicamentoInventarioInactivoError();
    anterior = decimal(item.cantidadDisponible);
    posterior = cantidad;
    const resultado = await tx.medicamentoInventario.updateMany({
      where: { id: medicamentoInventarioId, estado: "ACTIVO" },
      data: { cantidadDisponible: cantidad, actualizadoPorUsuarioId: usuarioId },
    });
    if (resultado.count === 0) throw new MedicamentoInventarioInactivoError();
  } else {
    const esSalida = tipoMovimiento === "SALIDA";
    const resultado = await tx.medicamentoInventario.updateMany({
      where: {
        id: medicamentoInventarioId,
        estado: "ACTIVO",
        ...(esSalida ? { cantidadDisponible: { gte: cantidad } } : {}),
      },
      data: {
        cantidadDisponible: esSalida ? { decrement: cantidad } : { increment: cantidad },
        actualizadoPorUsuarioId: usuarioId,
      },
    });
    if (resultado.count === 0) {
      await clasificarErrorMovimiento(tx, medicamentoInventarioId);
    }
    const actualizado = await tx.medicamentoInventario.findUnique({
      where: { id: medicamentoInventarioId },
      select: { cantidadDisponible: true },
    });
    posterior = decimal(actualizado?.cantidadDisponible ?? 0);
    anterior = posterior + (esSalida ? cantidad : -cantidad);
  }

  const movimiento = await tx.movimientoInventario.create({
    data: {
      medicamentoInventarioId,
      tipoMovimiento,
      cantidad,
      cantidadAnterior: anterior,
      cantidadPosterior: posterior,
      motivo: motivo.trim(),
      referenciaTipo: datos.referenciaTipo ?? null,
      referenciaId: datos.referenciaId ?? null,
      usuarioId,
    },
    select: { id: true },
  });
  return movimiento;
}

export async function registrarMovimientoInventarioRepositorio(datos: DatosMovimientoInventario, usuarioId: string) {
  return prisma.$transaction((tx) => crearMovimientoInventarioTx(tx, datos, usuarioId));
}

export async function registrarSalidaInventarioTx(
  tx: Tx,
  medicamentoInventarioId: string,
  cantidad: number,
  motivo: string,
  referenciaId: string,
  usuarioId: string,
) {
  if (cantidad <= 0) throw new StockInsuficienteError();
  const resultado = await tx.medicamentoInventario.updateMany({
    where: {
      id: medicamentoInventarioId,
      estado: "ACTIVO",
      cantidadDisponible: { gte: cantidad },
    },
    data: { cantidadDisponible: { decrement: cantidad }, actualizadoPorUsuarioId: usuarioId },
  });
  if (resultado.count === 0) {
    await clasificarErrorMovimiento(tx, medicamentoInventarioId);
  }
  const medicamento = await tx.medicamentoInventario.findUnique({
    where: { id: medicamentoInventarioId },
    select: { id: true, nombre: true, unidad: true, cantidadDisponible: true },
  });
  const posterior = decimal(medicamento?.cantidadDisponible ?? 0);
  const movimiento = await tx.movimientoInventario.create({
    data: {
      medicamentoInventarioId,
      tipoMovimiento: "SALIDA",
      cantidad,
      cantidadAnterior: posterior + cantidad,
      cantidadPosterior: posterior,
      motivo,
      referenciaTipo: "REGISTRO_DIARIO",
      referenciaId,
      usuarioId,
    },
    select: { id: true },
  });
  return {
    movimientoId: movimiento.id,
    nombre: medicamento?.nombre ?? "",
    unidad: medicamento?.unidad ?? "UNIDADES",
  };
}

export async function registrarDevolucionRegistroDiarioTx(tx: Tx, registroDiarioId: string, usuarioId: string) {
  const entregas = await tx.registroDiarioMedicamento.findMany({
    where: { registroDiarioId, movimientoInventarioId: { not: null } },
    include: { medicamentoInventario: true },
  });
  for (const entrega of entregas) {
    const devolucionExistente = await tx.movimientoInventario.findFirst({
      where: {
        medicamentoInventarioId: entrega.medicamentoInventarioId,
        tipoMovimiento: "DEVOLUCION",
        referenciaTipo: "REGISTRO_DIARIO_ANULADO",
        referenciaId: registroDiarioId,
      },
      select: { id: true },
    });
    if (devolucionExistente) continue;
    const cantidad = decimal(entrega.cantidadEntregada);
    const resultado = await tx.medicamentoInventario.updateMany({
      where: { id: entrega.medicamentoInventarioId },
      data: { cantidadDisponible: { increment: cantidad }, actualizadoPorUsuarioId: usuarioId },
    });
    if (resultado.count === 0) throw new MedicamentoInventarioNoEncontradoError();
    const actualizado = await tx.medicamentoInventario.findUnique({
      where: { id: entrega.medicamentoInventarioId },
      select: { cantidadDisponible: true },
    });
    const posterior = decimal(actualizado?.cantidadDisponible ?? 0);
    await tx.movimientoInventario.create({
      data: {
        medicamentoInventarioId: entrega.medicamentoInventarioId,
        tipoMovimiento: "DEVOLUCION",
        cantidad,
        cantidadAnterior: posterior - cantidad,
        cantidadPosterior: posterior,
        motivo: "Devolución por anulación de registro diario",
        referenciaTipo: "REGISTRO_DIARIO_ANULADO",
        referenciaId: registroDiarioId,
        usuarioId,
      },
    });
  }
}
