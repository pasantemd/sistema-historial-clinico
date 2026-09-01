import type { UnidadMedicamentoInventario } from "@/generated/prisma/enums";

export const PERMISOS_INVENTARIO = {
  ver: "inventario.ver",
  crear: "inventario.crear",
  editar: "inventario.editar",
  movimiento: "inventario.movimiento",
  desactivar: "inventario.desactivar",
} as const;

export const UNIDADES_INVENTARIO: Array<{ valor: UnidadMedicamentoInventario; etiqueta: string }> = [
  { valor: "UNIDADES", etiqueta: "unidades" },
  { valor: "TABLETAS", etiqueta: "tabletas" },
  { valor: "CAPSULAS", etiqueta: "cápsulas" },
  { valor: "FRASCOS", etiqueta: "frascos" },
  { valor: "AMPOLLAS", etiqueta: "ampollas" },
  { valor: "SOBRES", etiqueta: "sobres" },
  { valor: "TUBOS", etiqueta: "tubos" },
  { valor: "MILILITROS", etiqueta: "mililitros" },
  { valor: "OTRO", etiqueta: "otro" },
];

export function etiquetaUnidadInventario(valor: string): string {
  return UNIDADES_INVENTARIO.find((unidad) => unidad.valor === valor)?.etiqueta ?? valor;
}

export const ETIQUETA_ACCION_MOVIMIENTO: Record<string, string> = {
  ENTRADA: "Añadir",
  SALIDA: "Eliminar",
  AJUSTE: "Ajuste",
  DEVOLUCION: "Devolución",
};

export function etiquetaMovimiento(tipo: string): string {
  return ETIQUETA_ACCION_MOVIMIENTO[tipo] ?? tipo;
}
