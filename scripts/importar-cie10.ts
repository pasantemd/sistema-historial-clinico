import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { esEjecucionDirecta, extraerCatalogoCie10, type RegistroCie10Extraido } from "./cie10/extraer-cie10";

interface ResumenImportacion {
  insertadas: number;
  actualizadas: number;
  omitidas: number;
  errores: number;
}

type ExistenteCie10 = { descripcion: string; nivel: string; categoriaPadreCodigo: string | null; activa: boolean };

export function determinarOperacionImportacion(
  registro: RegistroCie10Extraido,
  existente?: ExistenteCie10,
): "INSERTAR" | "ACTUALIZAR" | "OMITIR" {
  if (!existente) return "INSERTAR";
  return existente.descripcion === registro.descripcion
    && existente.nivel === registro.nivel
    && existente.categoriaPadreCodigo === registro.categoriaPadreCodigo
    && existente.activa
    ? "OMITIR"
    : "ACTUALIZAR";
}

function argumento(nombre: string): string | undefined {
  const prefijo = `--${nombre}=`;
  return process.argv.find((valor) => valor.startsWith(prefijo))?.slice(prefijo.length);
}

function crearCliente(): PrismaClient {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no está definida.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
}

async function guardarReportes(resultado: Awaited<ReturnType<typeof extraerCatalogoCie10>>): Promise<void> {
  const directorio = resolve("reportes", "cie10");
  await mkdir(directorio, { recursive: true });
  await Promise.all([
    writeFile(resolve(directorio, "duplicados.json"), `${JSON.stringify(resultado.duplicados, null, 2)}\n`, "utf8"),
    writeFile(resolve(directorio, "no-interpretadas.json"), `${JSON.stringify(resultado.noInterpretadas, null, 2)}\n`, "utf8"),
  ]);
}

async function importarLote(
  prisma: PrismaClient,
  registros: RegistroCie10Extraido[],
  existentes: Map<string, { descripcion: string; nivel: string; categoriaPadreCodigo: string | null; activa: boolean }>,
  resumen: ResumenImportacion,
): Promise<void> {
  for (const registro of registros) {
    const existente = existentes.get(registro.codigo);
    const operacion = determinarOperacionImportacion(registro, existente);
    if (operacion === "OMITIR") {
      resumen.omitidas += 1;
      continue;
    }
    await prisma.enfermedadCie10.upsert({
      where: { codigo: registro.codigo },
      create: {
        codigo: registro.codigo,
        descripcion: registro.descripcion,
        nivel: registro.nivel,
        categoriaPadreCodigo: registro.categoriaPadreCodigo,
      },
      update: {
        descripcion: registro.descripcion,
        nivel: registro.nivel,
        categoriaPadreCodigo: registro.categoriaPadreCodigo,
        activa: true,
      },
    });
    if (operacion === "ACTUALIZAR") resumen.actualizadas += 1;
    else resumen.insertadas += 1;
  }
}

export async function importarCie10(rutaPdf: string): Promise<ResumenImportacion> {
  const resultado = await extraerCatalogoCie10(rutaPdf);
  await guardarReportes(resultado);
  if (resultado.paginas !== 212) throw new Error(`Se esperaban 212 páginas y se extrajeron ${resultado.paginas}.`);
  if (resultado.noInterpretadas.length) {
    throw new Error(`La extracción contiene ${resultado.noInterpretadas.length} filas no interpretadas. Revise reportes/cie10/no-interpretadas.json.`);
  }

  const prisma = crearCliente();
  const resumen: ResumenImportacion = { insertadas: 0, actualizadas: 0, omitidas: 0, errores: 0 };
  try {
    const existentes = new Map(
      (await prisma.enfermedadCie10.findMany({
        select: { codigo: true, descripcion: true, nivel: true, categoriaPadreCodigo: true, activa: true },
      })).map((registro) => [registro.codigo, registro]),
    );
    const categorias = resultado.registros.filter(({ nivel }) => nivel === "CATEGORIA");
    const subcategorias = resultado.registros.filter(({ nivel }) => nivel === "SUBCATEGORIA");
    await prisma.$transaction(async (tx) => {
      await importarLote(tx as PrismaClient, categorias, existentes, resumen);
      await importarLote(tx as PrismaClient, subcategorias, existentes, resumen);
    }, { maxWait: 10_000, timeout: 300_000 });

    const totalImportado = await prisma.enfermedadCie10.count({ where: { codigo: { in: resultado.registros.map(({ codigo }) => codigo) } } });
    if (totalImportado !== resultado.registros.length) {
      throw new Error(`El total extraído (${resultado.registros.length}) no coincide con el importado (${totalImportado}).`);
    }
    console.log(JSON.stringify({
      paginas: resultado.paginas,
      categorias: resultado.categorias,
      subcategorias: resultado.subcategorias,
      total: resultado.registros.length,
      duplicados: resultado.duplicados.length,
      noInterpretadas: resultado.noInterpretadas.length,
      ...resumen,
    }, null, 2));
    return resumen;
  } catch (error) {
    resumen.errores += 1;
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (esEjecucionDirecta(import.meta.url)) {
  const rutaPdf = resolve(argumento("archivo") ?? "CIE_10.pdf");
  importarCie10(rutaPdf).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
