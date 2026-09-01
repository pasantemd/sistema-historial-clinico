import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type NivelCie10Extraido = "CATEGORIA" | "SUBCATEGORIA";

export interface RegistroCie10Extraido {
  codigo: string;
  descripcion: string;
  nivel: NivelCie10Extraido;
  categoriaPadreCodigo: string | null;
  pagina: number;
}

export interface DuplicadoCie10 {
  codigo: string;
  paginaConservada: number;
  paginaDuplicada: number;
  descripcionConservada: string;
  descripcionDuplicada: string;
}

export interface FilaCie10NoInterpretada {
  pagina: number;
  contenido: string;
  motivo: string;
}

export interface ResultadoExtraccionCie10 {
  paginas: number;
  registros: RegistroCie10Extraido[];
  categorias: number;
  subcategorias: number;
  duplicados: DuplicadoCie10[];
  noInterpretadas: FilaCie10NoInterpretada[];
}

interface ItemPdf {
  str: string;
  transform: number[];
}

interface Ocurrencia {
  codigo: string;
  descripcion: string;
  pagina: number;
  columna: "CATEGORIA" | "DETALLE";
}

const PATRON_CODIGO = /^[A-Z][0-9]{2}(?:[0-9])?(?:[†*])?$/u;
const PATRON_POSIBLE_CODIGO = /^[A-Z][0-9]/u;

function esItemPdf(item: unknown): item is ItemPdf {
  if (!item || typeof item !== "object") return false;
  const candidato = item as Partial<ItemPdf>;
  return typeof candidato.str === "string" && Array.isArray(candidato.transform);
}

function nivelCodigo(codigo: string): NivelCie10Extraido {
  const base = codigo.replace(/[†*]$/u, "");
  return base.length === 3 ? "CATEGORIA" : "SUBCATEGORIA";
}

function unirFragmentos(fragmentos: Array<{ texto: string; x: number; y: number }>): string {
  return fragmentos
    .sort((a, b) => Math.abs(a.y - b.y) > 0.5 ? b.y - a.y : a.x - b.x)
    .map(({ texto }) => texto.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}

function extraerColumna(
  items: ItemPdf[],
  pagina: number,
  columna: Ocurrencia["columna"],
  noInterpretadas: FilaCie10NoInterpretada[],
): Ocurrencia[] {
  const esCategoria = columna === "CATEGORIA";
  const enBandaCodigo = (x: number) => esCategoria ? x >= 40 && x < 72 : x >= 345 && x < 390;
  const enBandaDescripcion = (x: number) => esCategoria ? x >= 72 && x < 345 : x >= 390;
  const codigos = items
    .map((item) => ({ texto: item.str.trim(), x: item.transform[4] ?? 0, y: item.transform[5] ?? 0 }))
    .filter(({ texto, x }) => texto && enBandaCodigo(x) && PATRON_CODIGO.test(texto));

  for (const item of items) {
    const texto = item.str.trim();
    const x = item.transform[4] ?? 0;
    if (texto && enBandaCodigo(x) && PATRON_POSIBLE_CODIGO.test(texto) && !PATRON_CODIGO.test(texto)) {
      noInterpretadas.push({ pagina, contenido: texto, motivo: "Código con formato no reconocido." });
    }
  }

  if (!codigos.length) return [];

  const maximoY = Math.max(...codigos.map(({ y }) => y));
  const minimoY = Math.min(...codigos.map(({ y }) => y));
  const descripciones = items
    .map((item) => ({ texto: item.str, x: item.transform[4] ?? 0, y: item.transform[5] ?? 0 }))
    .filter(({ texto, x, y }) => texto.trim() && enBandaDescripcion(x) && y <= maximoY + 7.5 && y >= minimoY - 14);

  const fragmentosPorCodigo = new Map<string, Array<{ texto: string; x: number; y: number }>>();
  codigos.forEach(({ texto }) => fragmentosPorCodigo.set(texto, []));

  for (const fragmento of descripciones) {
    const codigoCercano = codigos.reduce((mejor, actual) =>
      Math.abs(actual.y - fragmento.y) < Math.abs(mejor.y - fragmento.y) ? actual : mejor,
    );
    fragmentosPorCodigo.get(codigoCercano.texto)?.push(fragmento);
  }

  return codigos.map(({ texto }) => {
    const descripcion = unirFragmentos(fragmentosPorCodigo.get(texto) ?? []);
    if (!descripcion) {
      noInterpretadas.push({ pagina, contenido: texto, motivo: "Código sin descripción interpretable." });
    }
    return { codigo: texto, descripcion, pagina, columna };
  });
}

export async function extraerCatalogoCie10(rutaPdf: string): Promise<ResultadoExtraccionCie10> {
  const datos = new Uint8Array(await readFile(resolve(rutaPdf)));
  const standardFontDataUrl = `${resolve("node_modules", "pdfjs-dist", "standard_fonts").replace(/\\/gu, "/")}/`;
  const documento = await getDocument({ data: datos, standardFontDataUrl }).promise;
  const ocurrencias: Ocurrencia[] = [];
  const noInterpretadas: FilaCie10NoInterpretada[] = [];

  for (let pagina = 1; pagina <= documento.numPages; pagina += 1) {
    const contenido = await (await documento.getPage(pagina)).getTextContent();
    const items = contenido.items.flatMap((item): ItemPdf[] =>
      esItemPdf(item) ? [{ str: item.str, transform: [...item.transform] }] : [],
    );
    ocurrencias.push(...extraerColumna(items, pagina, "CATEGORIA", noInterpretadas));
    ocurrencias.push(...extraerColumna(items, pagina, "DETALLE", noInterpretadas));
  }

  const categorias = ocurrencias.filter(
    (registro) => registro.columna === "CATEGORIA" && nivelCodigo(registro.codigo) === "CATEGORIA",
  );
  const subcategorias = ocurrencias.filter(
    (registro) => registro.columna === "DETALLE" && nivelCodigo(registro.codigo) === "SUBCATEGORIA",
  );
  const candidatos = [...categorias, ...subcategorias];
  const porCodigo = new Map<string, RegistroCie10Extraido>();
  const duplicados: DuplicadoCie10[] = [];

  for (const candidato of candidatos) {
    const nivel = nivelCodigo(candidato.codigo);
    const registro: RegistroCie10Extraido = {
      codigo: candidato.codigo,
      descripcion: candidato.descripcion,
      nivel,
      categoriaPadreCodigo: null,
      pagina: candidato.pagina,
    };
    const existente = porCodigo.get(registro.codigo);
    if (existente) {
      duplicados.push({
        codigo: registro.codigo,
        paginaConservada: existente.pagina,
        paginaDuplicada: registro.pagina,
        descripcionConservada: existente.descripcion,
        descripcionDuplicada: registro.descripcion,
      });
      continue;
    }
    porCodigo.set(registro.codigo, registro);
  }

  const categoriasPorBase = new Map<string, RegistroCie10Extraido[]>();
  for (const categoria of porCodigo.values()) {
    if (categoria.nivel !== "CATEGORIA") continue;
    const base = categoria.codigo.slice(0, 3);
    categoriasPorBase.set(base, [...(categoriasPorBase.get(base) ?? []), categoria]);
  }

  for (const registro of porCodigo.values()) {
    if (registro.nivel !== "SUBCATEGORIA") continue;
    const padres = categoriasPorBase.get(registro.codigo.slice(0, 3)) ?? [];
    if (padres.length !== 1) {
      noInterpretadas.push({
        pagina: registro.pagina,
        contenido: `${registro.codigo} — ${registro.descripcion}`,
        motivo: padres.length ? "Más de una categoría padre posible." : "Categoría padre inexistente.",
      });
      continue;
    }
    registro.categoriaPadreCodigo = padres[0].codigo;
  }

  const repetidosEnDetalle = ocurrencias.filter(
    (registro) => registro.columna === "DETALLE" && nivelCodigo(registro.codigo) === "CATEGORIA",
  );
  for (const repetido of repetidosEnDetalle) {
    const conservado = porCodigo.get(repetido.codigo);
    if (!conservado) {
      noInterpretadas.push({ pagina: repetido.pagina, contenido: repetido.codigo, motivo: "Categoría repetida sin categoría principal." });
      continue;
    }
    duplicados.push({
      codigo: repetido.codigo,
      paginaConservada: conservado.pagina,
      paginaDuplicada: repetido.pagina,
      descripcionConservada: conservado.descripcion,
      descripcionDuplicada: repetido.descripcion,
    });
  }

  const registros = [...porCodigo.values()].sort((a, b) => a.codigo.localeCompare(b.codigo, "es"));
  return {
    paginas: documento.numPages,
    registros,
    categorias: registros.filter(({ nivel }) => nivel === "CATEGORIA").length,
    subcategorias: registros.filter(({ nivel }) => nivel === "SUBCATEGORIA").length,
    duplicados,
    noInterpretadas,
  };
}

export function esEjecucionDirecta(metaUrl: string, argumento = process.argv[1]): boolean {
  return Boolean(argumento) && pathToFileURL(resolve(argumento)).href === metaUrl;
}
