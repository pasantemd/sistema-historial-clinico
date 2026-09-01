import { z } from "zod";

const medicamentoRecetaBorradorSchema = z.object({
  id: z.string().optional(),
  medicamentoId: z.string().uuid().optional().or(z.literal("")).nullable(),
  nombreMedicamentoHistorico: z.string().max(500).optional().default(""),
  nombreGenericoHistorico: z.string().optional().or(z.literal("")).nullable(),
  nombreComercialHistorico: z.string().optional().or(z.literal("")).nullable(),
  presentacionHistorica: z.string().max(500).optional().default(""),
  concentracionHistorica: z.string().optional().or(z.literal("")).nullable(),
  cantidad: z.string().max(500).optional().default(""),
  dosis: z.string().max(500).optional().default(""),
  frecuencia: z.string().max(500).optional().default(""),
  intervaloHoras: z.coerce.number().int().min(0).max(72).optional().nullable(),
  duracion: z.string().max(500).optional().default(""),
  viaAdministracion: z.string().max(500).optional().default(""),
  indicaciones: z.string().optional().or(z.literal("")).nullable(),
  observaciones: z.string().optional().or(z.literal("")).nullable(),
  orden: z.number().int().optional(),
});

export const medicamentoRecetaSchema = medicamentoRecetaBorradorSchema.extend({
  nombreMedicamentoHistorico: z.string().trim().min(1, "Indique el medicamento.").max(500),
  dosis: z.string().trim().min(1, "Indique la dosis.").max(500),
  viaAdministracion: z.string().trim().min(1, "Indique la vía.").max(500),
});

const recetaBaseSchema = z.object({
  trabajadorId: z.string().uuid(),
  registroDiarioId: z.string().uuid().optional().or(z.literal("")).nullable(),
  evaluacionId: z.string().uuid().optional().or(z.literal("")).nullable(),
  fichaOcupacionalId: z.string().uuid().optional().or(z.literal("")).nullable(),
  documentoClinicoId: z.string().uuid().optional().or(z.literal("")).nullable(),
  profesionalId: z.string().uuid(),
  fechaEmision: z.string().min(1, "Indique la fecha."),
  indicacionesGenerales: z.string().optional().or(z.literal("")).nullable(),
  recomendaciones: z.string().optional().or(z.literal("")).nullable(),
  observaciones: z.string().optional().or(z.literal("")).nullable(),
});

export const recetaBorradorSchema = recetaBaseSchema.extend({
  medicamentos: z.array(medicamentoRecetaBorradorSchema).default([]),
});

export const crearRecetaSchema = recetaBaseSchema.extend({
  medicamentos: z.array(medicamentoRecetaSchema).min(1, "Agregue al menos un medicamento."),
});

export const emitirRecetaSchema = z.object({
  id: z.string().uuid(),
  confirmarAlergia: z.boolean().default(false),
  justificacionAlergias: z.string().optional().or(z.literal("")).nullable(),
});

export const anularRecetaSchema = z.object({
  id: z.string().uuid(),
  motivoAnulacion: z.string().min(3, "Indique el motivo de anulación.").max(500),
});

export type EntradaReceta = z.infer<typeof recetaBorradorSchema>;
export type EntradaFormularioReceta = z.input<typeof recetaBorradorSchema>;
export type EntradaMedicamentoReceta = z.infer<typeof medicamentoRecetaSchema>;
export type EntradaEmitirReceta = z.infer<typeof emitirRecetaSchema>;
export type EntradaAnularReceta = z.infer<typeof anularRecetaSchema>;
