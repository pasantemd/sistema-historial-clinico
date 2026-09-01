import "dotenv/config";

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { SINONIMOS_CIE10_INICIALES } from "../src/modulos/catalogo-cie10/constantes/sinonimos-iniciales";
import { normalizarTerminoCie10 } from "../src/modulos/catalogo-cie10/utilidades/normalizar-termino-cie10";

interface ResumenSinonimos {
  insertados: number;
  omitidos: number;
  errores: number;
}

function crearCliente(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está definida.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

export async function importarSinonimosCie10(): Promise<ResumenSinonimos> {
  const prisma = crearCliente();
  const resumen: ResumenSinonimos = { insertados: 0, omitidos: 0, errores: 0 };
  try {
    const codigos = [...new Set(SINONIMOS_CIE10_INICIALES.flatMap(({ codigos: asociados }) => asociados))];
    const enfermedades = await prisma.enfermedadCie10.findMany({
      where: { codigo: { in: codigos }, activa: true },
      select: { id: true, codigo: true },
    });
    const porCodigo = new Map(enfermedades.map((enfermedad) => [enfermedad.codigo, enfermedad.id]));
    const faltantes = codigos.filter((codigo) => !porCodigo.has(codigo));
    if (faltantes.length) throw new Error(`Códigos CIE-10 inexistentes o inactivos: ${faltantes.join(", ")}.`);

    const asociaciones = SINONIMOS_CIE10_INICIALES.flatMap(({ termino, codigos: asociados }) =>
      asociados.map((codigo) => ({ termino: normalizarTerminoCie10(termino), enfermedadId: porCodigo.get(codigo) as string })),
    );
    const existentes = await prisma.sinonimoCie10.findMany({
      where: { OR: asociaciones },
      select: { termino: true, enfermedadId: true },
    });
    const clavesExistentes = new Set(existentes.map(({ termino, enfermedadId }) => `${termino}\u0000${enfermedadId}`));

    await prisma.$transaction(async (tx) => {
      for (const asociacion of asociaciones) {
        const clave = `${asociacion.termino}\u0000${asociacion.enfermedadId}`;
        if (clavesExistentes.has(clave)) {
          resumen.omitidos += 1;
          continue;
        }
        await tx.sinonimoCie10.create({ data: asociacion });
        resumen.insertados += 1;
      }
    });
    console.log(JSON.stringify({ terminos: SINONIMOS_CIE10_INICIALES.length, asociaciones: asociaciones.length, ...resumen }, null, 2));
    return resumen;
  } catch (error) {
    resumen.errores += 1;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const ejecucionDirecta = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (ejecucionDirecta) {
  importarSinonimosCie10().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
