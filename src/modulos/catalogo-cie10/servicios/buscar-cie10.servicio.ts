import { consultarCie10 } from "@/modulos/catalogo-cie10/consultas/catalogo-cie10.consulta";
import { obtenerCodigosSinonimoControlado } from "@/modulos/catalogo-cie10/constantes/sinonimos-iniciales";
import type { ResultadoCie10 } from "@/modulos/catalogo-cie10/tipos";
import { normalizarTerminoCie10 } from "@/modulos/catalogo-cie10/utilidades/normalizar-termino-cie10";
import { busquedaCie10Schema } from "@/modulos/catalogo-cie10/validaciones/busqueda-cie10.schema";
import { prisma } from "@/servicios/base-datos/prisma";

async function enriquecerConSinonimosControlados(
  termino: string,
  resultados: ResultadoCie10[],
): Promise<ResultadoCie10[]> {
  const codigosSinonimos = obtenerCodigosSinonimoControlado(termino);
  if (codigosSinonimos.length === 0) return resultados;
  const idsExistentes = new Set(resultados.map((r) => r.id));
  const faltantes = await prisma.enfermedadCie10.findMany({
    where: { codigo: { in: codigosSinonimos as string[] }, activa: true },
    select: {
      id: true,
      codigo: true,
      descripcion: true,
      nivel: true,
      categoriaPadreCodigo: true,
    },
  });
  for (const f of faltantes) {
    if (idsExistentes.has(f.id)) continue;
    idsExistentes.add(f.id);
    resultados.push({
      ...f,
      coincidenciaEncontrada: f.descripcion.slice(0, 60),
      sugeridoPorSinonimo: true,
      prioridad: -1,
    });
  }
  return resultados;
}

async function ejecutarBusquedaCie10Completa(
  termino: string,
): Promise<ResultadoCie10[]> {
  if (termino.length < 2) return [];
  const resultados = await consultarCie10(termino, 20);
  const enriquecidos = await enriquecerConSinonimosControlados(
    termino,
    resultados,
  );
  return enriquecidos.slice(0, 20);
}

export async function buscarCie10(entrada: unknown) {
  const parsed = busquedaCie10Schema.safeParse(entrada);
  if (!parsed.success) return [];
  const termino = normalizarTerminoCie10(parsed.data);
  if (termino.length < 2) return [];
  return ejecutarBusquedaCie10Completa(termino);
}
