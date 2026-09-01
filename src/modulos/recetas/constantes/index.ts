import type { EstadoReceta } from "@/generated/prisma/enums";

export const ESTADOS_RECETA: Array<{ valor: EstadoReceta; etiqueta: string }> = [
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "EMITIDA", etiqueta: "Emitida" },
  { valor: "ANULADA", etiqueta: "Anulada" },
];

export function etiquetaEstadoReceta(valor: string): string {
  return ESTADOS_RECETA.find((item) => item.valor === valor)?.etiqueta ?? valor;
}

export const VIAS_ADMINISTRACION = [
  "Oral",
  "Intramuscular",
  "Intravenosa",
  "Subcutánea",
  "Tópica",
  "Rectal",
  "Inhalatoria",
  "Sublingual",
  "Oftálmica",
  "Otra",
] as const;

export const PRESENTACIONES_COMUNES = [
  "Tableta",
  "Cápsula",
  "Jarabe",
  "Solución",
  "Suspensión",
  "Ampolla",
  "Crema",
  "Ungüento",
  "Gotas",
  "Inyectable",
] as const;
