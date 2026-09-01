import { prisma } from "@/servicios/base-datos/prisma";
import type { DatosAlergia } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";

export async function guardarAlergia(datos: DatosAlergia, id?: string) {
  const trabajador = await prisma.trabajador.findUnique({ where: { id: datos.trabajadorId }, select: { id: true } });
  if (!trabajador) throw new Error("El trabajador no existe.");
  if (id) return prisma.alergiaTrabajador.update({ where: { id, trabajadorId: datos.trabajadorId }, data: { tipo: datos.tipo, sustancia: datos.sustancia, descripcion: datos.descripcion ?? null, severidad: datos.severidad }, select: { id: true } });
  return prisma.alergiaTrabajador.create({ data: { ...datos, descripcion: datos.descripcion ?? null }, select: { id: true } });
}

export async function cambiarEstadoAlergia(id: string, trabajadorId: string, activa: boolean) {
  const resultado = await prisma.alergiaTrabajador.updateMany({ where: { id, trabajadorId }, data: { activa } });
  if (!resultado.count) throw new Error("La alergia no existe.");
}
