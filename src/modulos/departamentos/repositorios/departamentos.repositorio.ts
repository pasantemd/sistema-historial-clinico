import { Prisma } from "@/generated/prisma/client";
import { DepartamentoDuplicadoError } from "@/modulos/departamentos/errores";
import { prisma } from "@/servicios/base-datos/prisma";

type PersistenciaDepartamento = { empresaId: string; nombre: string; descripcion?: string };

function traducir(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new DepartamentoDuplicadoError();
  throw error;
}

export async function crearDepartamento(datos: PersistenciaDepartamento) {
  try {
    return await prisma.departamento.create({ data: { ...datos, descripcion: datos.descripcion ?? null }, select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true } });
  } catch (error) { traducir(error); }
}

export async function actualizarDepartamento(id: string, datos: PersistenciaDepartamento) {
  try {
    return await prisma.departamento.update({ where: { id }, data: { ...datos, descripcion: datos.descripcion ?? null }, select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true } });
  } catch (error) { traducir(error); }
}

export async function buscarDepartamentoParaMutacion(id: string) {
  return prisma.departamento.findUnique({ where: { id }, select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true } });
}

export async function actualizarEstadoDepartamento(id: string, estado: "ACTIVO" | "INACTIVO") {
  return prisma.departamento.update({ where: { id }, data: { estado }, select: { id: true, empresaId: true, nombre: true, descripcion: true, estado: true } });
}
