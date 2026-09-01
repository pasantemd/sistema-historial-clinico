import type { ResultadoCie10 } from "@/modulos/catalogo-cie10/tipos";
import {
  extraerCoincidencia,
  normalizarTerminoCie10,
  obtenerPalabrasSignificativasCie10,
} from "@/modulos/catalogo-cie10/utilidades/normalizar-termino-cie10";
import { prisma } from "@/servicios/base-datos/prisma";

interface FilaCruda {
  id: string;
  codigo: string;
  descripcion: string;
  nivel: "CATEGORIA" | "SUBCATEGORIA";
  categoriaPadreCodigo: string | null;
  prioridad_orden: number;
}

function esPreferenciaSinonimo(prioridad: number): boolean {
  return prioridad === 3 || prioridad === 7;
}

/**
 * Consulta directa a PostgreSQL con índices GIN, trigramas y unaccent.
 */
export async function consultarCie10(
  termino: string,
  limite: number,
): Promise<ResultadoCie10[]> {
  const normalizado = normalizarTerminoCie10(termino);
  if (normalizado.length < 2) return [];
  const palabras = obtenerPalabrasSignificativasCie10(normalizado);
  const prefijo = `${normalizado}%`;
  const parcial = `%${normalizado}%`;

  const crudas: FilaCruda[] = await prisma.$queryRaw<FilaCruda[]>`
    WITH palabras_busqueda AS (
      SELECT unnest(${palabras}::text[]) AS palabra
    )
    SELECT
      enfermedad."id",
      enfermedad."codigo",
      enfermedad."descripcion",
      enfermedad."nivel"::text AS "nivel",
      enfermedad."categoriaPadreCodigo",
      CASE
        WHEN lower(enfermedad."codigo") = ${normalizado} THEN 0
        WHEN lower(enfermedad."codigo") LIKE ${prefijo} THEN 1
        WHEN lower(unaccent(enfermedad."descripcion")) = ${normalizado} THEN 2
        WHEN EXISTS (
          SELECT 1 FROM "sinonimos_cie10" AS s
          WHERE s."enfermedadId" = enfermedad."id" AND lower(s."termino") = ${normalizado}
        ) THEN 3
        WHEN lower(unaccent(enfermedad."descripcion")) LIKE ${prefijo} THEN 4
        WHEN (
          SELECT bool_and(lower(unaccent(enfermedad."descripcion")) LIKE '%' || pb."palabra" || '%')
          FROM palabras_busqueda pb
        ) THEN 5
        WHEN lower(unaccent(enfermedad."descripcion")) % ${normalizado} THEN 6
        WHEN EXISTS (
          SELECT 1 FROM "sinonimos_cie10" AS s
          WHERE s."enfermedadId" = enfermedad."id" AND lower(s."termino") LIKE ${parcial}
        ) THEN 7
        WHEN (
          SELECT bool_or(lower(unaccent(enfermedad."descripcion")) LIKE '%' || pb."palabra" || '%')
          FROM palabras_busqueda pb
        ) THEN 8
        ELSE 9
      END AS "prioridad_orden"
    FROM "enfermedades_cie10" AS enfermedad
    WHERE enfermedad."activa" = true
      AND (
        lower(enfermedad."codigo") = ${normalizado}
        OR lower(enfermedad."codigo") LIKE ${prefijo}
        OR lower(unaccent(enfermedad."descripcion")) LIKE ${parcial}
        OR EXISTS (
          SELECT 1 FROM "sinonimos_cie10" AS s
          WHERE s."enfermedadId" = enfermedad."id"
            AND (lower(s."termino") = ${normalizado} OR lower(s."termino") LIKE ${parcial})
        )
        OR lower(unaccent(enfermedad."descripcion")) % ${normalizado}
        OR (
          SELECT bool_or(lower(unaccent(enfermedad."descripcion")) LIKE '%' || pb."palabra" || '%')
          FROM palabras_busqueda pb
        )
      )
    ORDER BY "prioridad_orden" ASC, enfermedad."codigo" ASC
    LIMIT ${limite}
  `;

  return crudas.map((fila) => ({
    id: fila.id,
    codigo: fila.codigo,
    descripcion: fila.descripcion,
    nivel: fila.nivel,
    categoriaPadreCodigo: fila.categoriaPadreCodigo,
    coincidenciaEncontrada: extraerCoincidencia(fila.descripcion, normalizado),
    sugeridoPorSinonimo: esPreferenciaSinonimo(fila.prioridad_orden),
    prioridad: fila.prioridad_orden,
  }));
}
