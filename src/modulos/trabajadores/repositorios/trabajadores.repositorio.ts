import { Prisma } from "@/generated/prisma/client";
import {
  DocumentoDuplicadoError,
  OrganizacionLaboralInvalidaError,
  VinculoLaboralDuplicadoError,
} from "@/modulos/trabajadores/errores";
import type {
  DatosNuevoVinculoLaboral,
  DatosTrabajador,
} from "@/modulos/trabajadores/validaciones/trabajador.schema";
import { prisma } from "@/servicios/base-datos/prisma";
import { limpiarDocumentoVisible } from "@/utilidades/cadenas/limpiar-documento";
import { limpiarNombreVisible } from "@/utilidades/cadenas/limpiar-nombre";

const fecha = (valor?: string) =>
  valor ? new Date(`${valor}T00:00:00.000Z`) : null;

function estadoVinculo(estado: DatosTrabajador["estadoLaboral"]) {
  if (estado === "SUSPENDIDO") return "SUSPENDIDO" as const;
  if (estado === "INACTIVO" || estado === "RETIRADO") return "FINALIZADO" as const;
  return "ACTIVO" as const;
}

function identidad(datos: DatosTrabajador) {
  return {
    empresaId: datos.empresaId,
    departamentoId: datos.departamentoId,
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: limpiarDocumentoVisible(datos.numeroDocumento),
    nombres: limpiarNombreVisible(datos.nombres),
    apellidos: limpiarNombreVisible(datos.apellidos),
    fechaNacimiento: fecha(datos.fechaNacimiento),
    sexo: datos.sexo,
    telefono: datos.telefono ?? null,
    correo: datos.correo ?? null,
    direccion: datos.direccion ?? null,
    puestoLaboral: datos.puestoLaboral,
    estadoLaboral: datos.estadoLaboral ?? "ACTIVO",
  };
}

function traducir(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const objetivo = JSON.stringify(error.meta?.target ?? "");
    if (objetivo.includes("numeroDocumento")) throw new DocumentoDuplicadoError();
    throw new VinculoLaboralDuplicadoError();
  }
  throw error;
}

async function validarOrganizacionEnTransaccion(
  tx: Prisma.TransactionClient,
  empresaId: string,
  departamentoId: string,
) {
  const departamento = await tx.departamento.findFirst({
    where: {
      id: departamentoId,
      empresaId,
      estado: "ACTIVO",
      empresa: { estado: "ACTIVO" },
    },
    select: { id: true },
  });
  if (!departamento) throw new OrganizacionLaboralInvalidaError();
  return departamento;
}

export async function usuarioPuedeAccederEmpresaTrabajadores(
  usuarioId: string,
  empresaId: string,
) {
  const acceso = await prisma.usuarioEmpresa.findFirst({
    where: {
      usuarioId,
      empresaId,
      usuario: { estado: "ACTIVO" },
      empresa: { estado: "ACTIVO" },
    },
    select: { usuarioId: true },
  });
  return Boolean(acceso);
}

export async function buscarTrabajadorParaNuevoVinculo(
  trabajadorId: string,
  usuarioId: string,
) {
  return prisma.trabajador.findFirst({
    where: {
      id: trabajadorId,
      empresa: {
        estado: "ACTIVO",
        usuariosAutorizados: { some: { usuarioId } },
      },
    },
    select: { id: true },
  });
}

export async function crearTrabajadorConVinculo(
  datos: DatosTrabajador,
  usuarioId: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await validarOrganizacionEnTransaccion(tx, datos.empresaId, datos.departamentoId);
      const trabajador = await tx.trabajador.create({
        data: {
          ...identidad(datos),
          creadoPorId: usuarioId,
          actualizadoPorId: usuarioId,
        },
        select: { id: true },
      });
      const vinculo = await tx.asignacionLaboral.create({
        data: {
          trabajadorId: trabajador.id,
          empresaId: datos.empresaId,
          departamentoId: datos.departamentoId,
          estado: estadoVinculo(datos.estadoLaboral),
          activa: datos.estadoLaboral === "ACTIVO",
          fechaInicio: null,
        },
        select: { id: true },
      });
      return { trabajadorId: trabajador.id, vinculoId: vinculo.id };
    });
  } catch (error) {
    traducir(error);
  }
}

export async function actualizarTrabajadorConVinculo(
  id: string,
  datos: DatosTrabajador,
  usuarioId: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await validarOrganizacionEnTransaccion(tx, datos.empresaId, datos.departamentoId);
      const trabajador = await tx.trabajador.update({
        where: { id },
        data: { ...identidad(datos), actualizadoPorId: usuarioId },
        select: { id: true },
      });
      const anterior = await tx.asignacionLaboral.findUniqueOrThrow({ where: { id: datos.vinculoId! } });
      const cambioOrganizacion = anterior.empresaId !== datos.empresaId || anterior.departamentoId !== datos.departamentoId;
      const activa = datos.estadoLaboral === "ACTIVO";
      const vinculo = cambioOrganizacion
        ? await (async () => {
            await tx.asignacionLaboral.updateMany({
              where: { trabajadorId: id, activa: true },
              data: { activa: false, estado: "FINALIZADO", fechaFin: new Date() },
            });
            return tx.asignacionLaboral.create({
              data: {
                trabajadorId: id,
                empresaId: datos.empresaId,
                departamentoId: datos.departamentoId,
                fechaInicio: null,
                activa,
                estado: estadoVinculo(datos.estadoLaboral),
              },
              select: { id: true },
            });
          })()
        : await tx.asignacionLaboral.update({
            where: { id: anterior.id },
            data: { activa, estado: estadoVinculo(datos.estadoLaboral), fechaFin: activa ? null : new Date() },
            select: { id: true },
          });
      return { trabajadorId: trabajador.id, vinculoId: vinculo.id };
    });
  } catch (error) {
    traducir(error);
  }
}

export async function crearVinculoLaboralParaTrabajador(
  datos: DatosNuevoVinculoLaboral,
  usuarioId: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      await validarOrganizacionEnTransaccion(tx, datos.empresaId, datos.departamentoId);
      const trabajador = await tx.trabajador.findFirst({
        where: {
          id: datos.trabajadorId,
          empresa: {
            estado: "ACTIVO",
            usuariosAutorizados: { some: { usuarioId } },
          },
        },
        select: { id: true },
      });
      if (!trabajador) throw new OrganizacionLaboralInvalidaError();
      const existente = await tx.asignacionLaboral.findFirst({
        where: {
          trabajadorId: datos.trabajadorId,
          empresaId: datos.empresaId,
          departamentoId: datos.departamentoId,
          activa: true,
        },
        select: { id: true },
      });
      if (existente) return { vinculoId: existente.id, reutilizado: true };
      await tx.asignacionLaboral.updateMany({
        where: { trabajadorId: datos.trabajadorId, activa: true },
        data: { activa: false, estado: "FINALIZADO", fechaFin: new Date() },
      });
      const vinculo = await tx.asignacionLaboral.create({
        data: {
          trabajadorId: datos.trabajadorId,
          empresaId: datos.empresaId,
          departamentoId: datos.departamentoId,
          estado: "ACTIVO",
          activa: true,
          fechaInicio: null,
        },
        select: { id: true },
      });
      await tx.trabajador.update({
        where: { id: datos.trabajadorId },
        data: {
          empresaId: datos.empresaId,
          departamentoId: datos.departamentoId,
          actualizadoPorId: usuarioId,
        },
      });
      return { vinculoId: vinculo.id, reutilizado: false };
    });
  } catch (error) {
    traducir(error);
  }
}

export async function consultarOrganizacionLaboral(
  empresaId: string,
  departamentoId: string,
) {
  return prisma.departamento.findFirst({
    where: { id: departamentoId, empresaId, estado: "ACTIVO", empresa: { estado: "ACTIVO" } },
    select: { id: true, empresaId: true, estado: true },
  });
}

export async function buscarVinculoParaMutacion(
  trabajadorId: string,
  vinculoId: string,
) {
  return prisma.asignacionLaboral.findFirst({
    where: { id: vinculoId, trabajadorId },
    select: { id: true, empresaId: true },
  });
}
