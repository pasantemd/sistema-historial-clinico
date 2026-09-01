import { z } from "zod";

const textoOpcional = z.string().trim().max(4000, "Máximo 4000 caracteres.").optional();

export const medicamentoRegistroDiarioSchema = z.object({
  medicamentoInventarioId: z.string().uuid("Seleccione un medicamento válido."),
  nombreSnapshot: z.string().trim().min(1, "Seleccione un medicamento válido.").max(200),
  unidadSnapshot: z.string().trim().min(1, "Seleccione una unidad válida.").max(80),
  cantidadEntregada: z.coerce
    .number({ error: "Ingrese una cantidad válida." })
    .int("La cantidad debe ser un número entero.")
    .positive("La cantidad debe ser mayor que cero.")
    .max(999999999, "La cantidad es demasiado alta."),
});

export const registroDiarioBorradorSchema = z.object({
  trabajadorId: z.union([z.string().uuid("Seleccione un trabajador válido."), z.literal("")]),
  fechaAtencion: z.string().optional().default(""),
  atencionMorbilidad: z.string().max(4000, "Máximo 4000 caracteres.").optional().default(""),
  medicacion: textoOpcional.default(""),
  medicamentos: z.array(medicamentoRegistroDiarioSchema).default([]),
  procedimiento: textoOpcional.default(""),
  firmaConfirmada: z.boolean().default(false),
  observaciones: textoOpcional.default(""),
});

export const registroDiarioSchema = registroDiarioBorradorSchema.extend({
  trabajadorId: z.string().uuid("Seleccione un trabajador."),
  fechaAtencion: z.string().date("Seleccione una fecha válida."),
  atencionMorbilidad: z.string().trim().min(1, "La atención de morbilidad es obligatoria.").max(4000),
});

export type EntradaRegistroDiario = z.input<typeof registroDiarioBorradorSchema>;
export type EntradaMedicamentoRegistroDiario = z.input<typeof medicamentoRegistroDiarioSchema>;
export type DatosRegistroDiario = z.output<typeof registroDiarioBorradorSchema>;
export type DatosRegistroDiarioCompleto = z.output<typeof registroDiarioSchema>;

export const anularRegistroSchema = z.object({
  motivo: z.string().trim().min(5, "Indique un motivo de al menos 5 caracteres.").max(500),
});
