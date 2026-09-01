import { Prisma } from "@/generated/prisma/client";
import { normalizarMorbilidad } from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";
import { prisma } from "@/servicios/base-datos/prisma";

export type ClienteBaseDatos = Prisma.TransactionClient | typeof prisma;

/**
 * Asegura que una morbilidad esté registrada en el catálogo PostgreSQL.
 * Es idempotente y seguro ante concurrencia (manejo de P2002).
 */
export async function asegurarMorbilidadEnCatalogo(
  nombre: string | null | undefined,
  tx?: ClienteBaseDatos,
) {
  if (!nombre) return null;
  const nombreLimpio = nombre.trim();
  const nombreNormalizado = normalizarMorbilidad(nombreLimpio);
  if (!nombreNormalizado) return null;

  const db = tx ?? prisma;

  const existente = await db.morbilidad.findUnique({
    where: { nombreNormalizado },
  });

  if (existente) {
    if (!existente.activa) {
      return db.morbilidad.update({
        where: { id: existente.id },
        data: { activa: true },
      });
    }
    return existente;
  }

  try {
    return await db.morbilidad.create({
      data: {
        nombre: nombreLimpio,
        nombreNormalizado,
        activa: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return db.morbilidad.findUnique({
        where: { nombreNormalizado },
      });
    }
    throw error;
  }
}
