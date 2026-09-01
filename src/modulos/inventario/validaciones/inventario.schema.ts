import { z } from "zod";

import type { FiltrosInventario } from "@/modulos/inventario/tipos";

const TAMANOS_PAGINA_PERMITIDOS = [20, 50, 60, 80] as const;

const cantidad = z.coerce
  .number({ error: "Ingrese una cantidad válida." })
  .int("La cantidad debe ser un número entero.")
  .finite("Ingrese una cantidad válida.")
  .min(0, "La cantidad no puede ser negativa.")
  .max(999999999, "La cantidad es demasiado alta.");

const cantidadMovimiento = cantidad.refine((valor) => valor > 0, "La cantidad debe ser mayor que cero.");

const fechaCaducidad = z
  .string()
  .trim()
  .min(1, "La fecha de caducidad es obligatoria.")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingrese una fecha de caducidad válida.")
  .refine((valor) => {
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
  }, "Ingrese una fecha de caducidad válida.");

export const medicamentoInventarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del medicamento es obligatorio.").max(200, "Máximo 200 caracteres."),
  cantidadDisponible: cantidad,
  unidad: z.enum(["UNIDADES", "TABLETAS", "CAPSULAS", "FRASCOS", "AMPOLLAS", "SOBRES", "TUBOS", "MILILITROS", "OTRO"], {
    error: "Seleccione una unidad válida.",
  }),
  fechaCaducidad,
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
  observaciones: z.string().trim().max(1000, "Máximo 1000 caracteres.").optional().or(z.literal("")).nullable(),
});

export const movimientoInventarioSchema = z.object({
  medicamentoInventarioId: z.string().uuid("Seleccione un medicamento válido."),
  tipoMovimiento: z.enum(["ENTRADA", "SALIDA", "AJUSTE", "DEVOLUCION"], { error: "Seleccione un tipo de movimiento válido." }),
  cantidad: cantidadMovimiento,
  motivo: z.string().trim().min(3, "Indique un motivo de al menos 3 caracteres.").max(500, "Máximo 500 caracteres."),
});

export const agregarCantidadSchema = z.object({
  medicamentoInventarioId: z.string().uuid("Seleccione un medicamento válido."),
  cantidad: cantidadMovimiento,
  motivo: z.string().trim().min(3, "Indique un motivo de al menos 3 caracteres.").max(500, "Máximo 500 caracteres."),
});

export const eliminarCantidadSchema = z.object({
  medicamentoInventarioId: z.string().uuid("Seleccione un medicamento válido."),
  cantidad: cantidadMovimiento,
  motivo: z.string().trim().min(3, "Indique un motivo de al menos 3 caracteres.").max(500, "Máximo 500 caracteres."),
});

export const cambiarEstadoInventarioSchema = z.object({
  id: z.string().uuid(),
  activar: z.boolean(),
});

export type EntradaMedicamentoInventario = z.input<typeof medicamentoInventarioSchema>;
export type DatosMedicamentoInventario = z.output<typeof medicamentoInventarioSchema>;
export type EntradaMovimientoInventario = z.input<typeof movimientoInventarioSchema>;
export type DatosMovimientoInventario = z.output<typeof movimientoInventarioSchema>;
export type EntradaAgregarCantidad = z.input<typeof agregarCantidadSchema>;
export type DatosAgregarCantidad = z.output<typeof agregarCantidadSchema>;
export type EntradaEliminarCantidad = z.input<typeof eliminarCantidadSchema>;
export type DatosEliminarCantidad = z.output<typeof eliminarCantidadSchema>;

export function normalizarFiltrosInventario(filtros: FiltrosInventario): FiltrosInventario {
  const pagina = Number.isSafeInteger(filtros.pagina) && Number(filtros.pagina) > 0
    ? Number(filtros.pagina)
    : 1;
  const tamanoSolicitado = Number(filtros.tamanoPagina);
  const tamanoPagina = TAMANOS_PAGINA_PERMITIDOS.includes(
    tamanoSolicitado as (typeof TAMANOS_PAGINA_PERMITIDOS)[number],
  )
    ? tamanoSolicitado
    : 20;
  const busqueda = filtros.busqueda?.trim().slice(0, 200) || undefined;
  const estado = filtros.estado === "ACTIVO" || filtros.estado === "INACTIVO"
    ? filtros.estado
    : undefined;
  const sinStock = Boolean(filtros.sinStock);

  return {
    busqueda,
    estado,
    sinStock,
    stockBajo: sinStock ? false : Boolean(filtros.stockBajo),
    pagina,
    tamanoPagina,
  };
}
