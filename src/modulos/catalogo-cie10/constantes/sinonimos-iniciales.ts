import { normalizarTerminoCie10 } from "@/modulos/catalogo-cie10/utilidades/normalizar-termino-cie10";

export interface SinonimoCie10Inicial {
  termino: string;
  codigos: readonly string[];
}

export const SINONIMOS_CIE10_INICIALES: readonly SinonimoCie10Inicial[] = [
  { termino: "dolor de barriga", codigos: ["R100", "R101", "R103", "R104"] },
  { termino: "dolor de estomago", codigos: ["R100", "R101", "R103", "R104"] },
  { termino: "dolor de cabeza", codigos: ["R51"] },
  { termino: "presion alta", codigos: ["I10", "R030"] },
  { termino: "tension alta", codigos: ["I10", "R030"] },
  { termino: "azucar alta", codigos: ["R73", "R739", "E10", "E11"] },
  { termino: "glucosa alta", codigos: ["R73", "R739"] },
  { termino: "dolor de espalda", codigos: ["M54", "M545", "M546", "M549"] },
  { termino: "dolor lumbar", codigos: ["M545"] },
  { termino: "lumbalgia", codigos: ["M545"] },
  { termino: "gripe", codigos: ["J10", "J11"] },
  { termino: "ardor al orinar", codigos: ["R300", "R309"] },
  { termino: "dolor al orinar", codigos: ["R30", "R300", "R309"] },
  { termino: "falta de aire", codigos: ["R060"] },
  { termino: "me falta el aire", codigos: ["R060"] },
  { termino: "ahogo", codigos: ["R060"] },
  { termino: "dolor de pecho", codigos: ["R071", "R072", "R073", "R074"] },
  { termino: "dolor toracico", codigos: ["R071", "R072", "R073", "R074"] },
  { termino: "mareo", codigos: ["R42", "H811", "H813", "H814"] },
  { termino: "vertigo", codigos: ["R42"] },
] as const;

export function obtenerCodigosSinonimoControlado(termino: string): readonly string[] {
  const buscado = normalizarTerminoCie10(termino);
  return SINONIMOS_CIE10_INICIALES.find((sinonimo) => sinonimo.termino === buscado)?.codigos ?? [];
}
