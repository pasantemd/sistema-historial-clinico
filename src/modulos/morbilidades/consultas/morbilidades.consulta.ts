import {
  normalizarMorbilidad,
  tokenizarMorbilidad,
} from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";
import { prisma } from "@/servicios/base-datos/prisma";

export interface OpcionesBusquedaMorbilidad {
  limite?: number;
}

/**
 * Consulta directa a PostgreSQL ordenada por relevancia.
 */
export async function buscarMorbilidadesEnCatalogo(
  termino: string,
  opciones?: OpcionesBusquedaMorbilidad,
): Promise<string[]> {
  const limite = Math.min(Math.max(1, opciones?.limite ?? 20), 50);
  const terminoNormalizado = normalizarMorbilidad(termino);
  if (terminoNormalizado.length < 2) return [];
  const tokens = tokenizarMorbilidad(terminoNormalizado);
  if (tokens.length === 0) return [];

  const condiciones = tokens.map((token) => ({
    nombreNormalizado: { contains: token },
  }));

  const candidatos = await prisma.morbilidad.findMany({
    where: {
      activa: true,
      AND: condiciones,
    },
    select: {
      id: true,
      nombre: true,
      nombreNormalizado: true,
    },
    take: Math.max(50, limite * 3),
  });

  if (candidatos.length === 0) return [];

  const primerToken = tokens[0] ?? "";

  candidatos.sort((a, b) => {
    const aNorm = a.nombreNormalizado;
    const bNorm = b.nombreNormalizado;

    // 1. Coincidencia exacta
    const aExacto = aNorm === terminoNormalizado;
    const bExacto = bNorm === terminoNormalizado;
    if (aExacto && !bExacto) return -1;
    if (!aExacto && bExacto) return 1;

    // 2. Empieza por el término completo
    const aEmpiezaTermino = aNorm.startsWith(terminoNormalizado);
    const bEmpiezaTermino = bNorm.startsWith(terminoNormalizado);
    if (aEmpiezaTermino && !bEmpiezaTermino) return -1;
    if (!aEmpiezaTermino && bEmpiezaTermino) return 1;

    // 3. Empieza por el primer token
    const aEmpiezaPrimerToken = aNorm.startsWith(primerToken);
    const bEmpiezaPrimerToken = bNorm.startsWith(primerToken);
    if (aEmpiezaPrimerToken && !bEmpiezaPrimerToken) return -1;
    if (!aEmpiezaPrimerToken && bEmpiezaPrimerToken) return 1;

    // 4. Longitud más concisa
    if (aNorm.length !== bNorm.length) {
      return aNorm.length - bNorm.length;
    }

    // 5. Alfabético por nombre visible
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return candidatos.slice(0, limite).map((c) => c.nombre);
}
