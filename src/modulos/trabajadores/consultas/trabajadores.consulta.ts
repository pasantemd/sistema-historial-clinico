import type { Prisma } from "@/generated/prisma/client";
import type {
  CatalogoOrganizacional,
  FiltrosTrabajadores,
  PaginaTrabajadores,
  TrabajadorDetalle,
  VinculoLaboralDetalle,
} from "@/modulos/trabajadores/tipos";
import { prisma } from "@/servicios/base-datos/prisma";

function fecha(valor: Date | null): string | null {
  return valor?.toISOString().slice(0, 10) ?? null;
}

const seleccionVinculo = {
  id: true,
  empresaId: true,
  departamentoId: true,
  fechaInicio: true,
  fechaReingreso: true,
  fechaFin: true,
  activa: true,
  estado: true,
  creadoEn: true,
  empresa: { select: { razonSocial: true } },
  departamento: { select: { nombre: true } },
} as const;

function mapearVinculo(vinculo: {
  id: string;
  empresaId: string;
  departamentoId: string;
  fechaInicio: Date | null;
  fechaReingreso: Date | null;
  fechaFin: Date | null;
  activa: boolean;
  estado: "ACTIVO" | "SUSPENDIDO" | "FINALIZADO";
  creadoEn: Date;
  empresa: { razonSocial: string };
  departamento: { nombre: string };
}): VinculoLaboralDetalle {
  return {
    id: vinculo.id,
    empresaId: vinculo.empresaId,
    empresa: vinculo.empresa.razonSocial,
    departamentoId: vinculo.departamentoId,
    departamento: vinculo.departamento.nombre,
    fechaIngreso: fecha(vinculo.fechaInicio),
    fechaReingreso: fecha(vinculo.fechaReingreso),
    fechaSalida: fecha(vinculo.fechaFin),
    creadoEn: vinculo.creadoEn.toISOString(),
    estado: vinculo.estado,
    activa: vinculo.activa,
  };
}

function construirBusqueda(busqueda?: string): Prisma.TrabajadorWhereInput {
  if (!busqueda) return {};
  const termino = busqueda.trim();
  const tokens = termino.split(/\s+/).filter(Boolean);
  return {
    OR: [
      { numeroDocumento: { contains: termino, mode: "insensitive" } },
      { nombres: { contains: termino, mode: "insensitive" } },
      { apellidos: { contains: termino, mode: "insensitive" } },
      {
        AND: tokens.map((token) => ({
          OR: [
            { nombres: { contains: token, mode: "insensitive" as const } },
            { apellidos: { contains: token, mode: "insensitive" as const } },
          ],
        })),
      },
      { empresa: { razonSocial: { contains: termino, mode: "insensitive" } } },
      { departamento: { nombre: { contains: termino, mode: "insensitive" } } },
    ],
  };
}

export async function consultarTrabajadores(
  usuarioId: string,
  filtros: FiltrosTrabajadores,
): Promise<PaginaTrabajadores> {
  const where: Prisma.TrabajadorWhereInput = {
    empresaId: filtros.empresaId,
    departamentoId: filtros.departamentoId,
    ...(filtros.estado === "ACTIVO"
      ? { estadoLaboral: "ACTIVO" }
      : filtros.estado === "SUSPENDIDO"
        ? { estadoLaboral: "SUSPENDIDO" }
        : filtros.estado === "FINALIZADO"
          ? { estadoLaboral: { in: ["INACTIVO", "RETIRADO"] } }
          : {}),
    empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } },
    ...construirBusqueda(filtros.busqueda),
  };
  const total = await prisma.trabajador.count({ where });
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.tamanoPagina));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const registros = await prisma.trabajador.findMany({
    where,
    select: {
      id: true,
      numeroDocumento: true,
      nombres: true,
      apellidos: true,
      estadoLaboral: true,
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      asignacionesLaborales: {
        where: { activa: true },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [
      { empresa: { razonSocial: "asc" } },
      { apellidos: "asc" },
      { nombres: "asc" },
      { creadoEn: "desc" },
    ],
    skip: (pagina - 1) * filtros.tamanoPagina,
    take: filtros.tamanoPagina,
  });
  return {
    trabajadores: registros.map((registro) => ({
      vinculoId: registro.asignacionesLaborales[0]?.id ?? registro.id,
      trabajadorId: registro.id,
      empresa: registro.empresa.razonSocial,
      departamento: registro.departamento.nombre,
      nombreCompleto: `${registro.apellidos} ${registro.nombres}`,
      numeroDocumento: registro.numeroDocumento,
      estadoLaboral: registro.estadoLaboral,
    })),
    total,
    pagina,
    totalPaginas,
    tamanoPagina: filtros.tamanoPagina,
  };
}

export async function consultarTrabajadorPorId(
  usuarioId: string,
  id: string,
): Promise<TrabajadorDetalle | null> {
  const registro = await prisma.trabajador.findFirst({
    where: {
      id,
      asignacionesLaborales: {
        some: { empresa: { usuariosAutorizados: { some: { usuarioId } } } },
      },
    },
    select: {
      id: true,
      empresaId: true,
      departamentoId: true,
      tipoDocumento: true,
      numeroDocumento: true,
      nombres: true,
      apellidos: true,
      fechaNacimiento: true,
      sexo: true,
      telefono: true,
      correo: true,
      direccion: true,
       puestoLaboral: true,
       estadoLaboral: true,
      creadoEn: true,
      actualizadoEn: true,
      empresa: { select: { razonSocial: true } },
      departamento: { select: { nombre: true } },
      asignacionesLaborales: {
        where: { empresa: { usuariosAutorizados: { some: { usuarioId } } } },
        select: seleccionVinculo,
        orderBy: [{ creadoEn: "desc" }],
      },
    },
  });
  if (!registro) return null;
  const vinculos = registro.asignacionesLaborales.map(mapearVinculo);
  return {
    id: registro.id,
    tipoDocumento: registro.tipoDocumento,
    numeroDocumento: registro.numeroDocumento,
    nombres: registro.nombres,
    apellidos: registro.apellidos,
    fechaNacimiento: fecha(registro.fechaNacimiento),
    sexo: registro.sexo,
    telefono: registro.telefono,
    correo: registro.correo,
    direccion: registro.direccion,
    puestoLaboral: registro.puestoLaboral,
    estadoLaboral: registro.estadoLaboral,
    empresa: registro.empresa.razonSocial,
    empresaId: registro.empresaId,
    departamentoId: registro.departamentoId,
    departamento: registro.departamento.nombre,
    vinculoId: vinculos.find((item) => item.activa)?.id ?? null,
    vinculos,
    creadoEn: registro.creadoEn.toISOString(),
    actualizadoEn: registro.actualizadoEn.toISOString(),
  };
}

export async function consultarCatalogoOrganizacional(
  usuarioId: string,
): Promise<CatalogoOrganizacional> {
  const [empresas, departamentos] = await Promise.all([
    prisma.empresa.findMany({
      where: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } },
      select: { id: true, ruc: true, razonSocial: true, nombreComercial: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.departamento.findMany({
      where: { estado: "ACTIVO", empresa: { estado: "ACTIVO", usuariosAutorizados: { some: { usuarioId } } } },
      select: { id: true, empresaId: true, nombre: true },
      orderBy: [{ empresa: { razonSocial: "asc" } }, { nombre: "asc" }],
    }),
  ]);
  return { empresas, departamentos };
}
