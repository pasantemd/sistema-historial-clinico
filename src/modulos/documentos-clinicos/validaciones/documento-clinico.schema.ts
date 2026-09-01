import { z } from "zod";

const diagnosticoSchema = z.object({
  enfermedadId: z.string().uuid(),
  codigo: z.string().min(1),
  descripcion: z.string().min(1),
  tipo: z.enum(["PRESUNTIVO", "DEFINITIVO"]),
  observacion: z.string().max(1000).optional().default(""),
});

const tratamientoBorradorSchema = z.object({
  nombre: z.string().trim().max(500).optional().default(""),
  concentracion: z.string().max(200).optional().default(""),
  dosis: z.string().trim().max(500).optional().default(""),
  cantidad: z.string().trim().max(500).optional().default(""),
  frecuencia: z.string().max(200).optional().default(""),
  intervaloHoras: z.coerce.number().int().positive().optional().or(z.literal("")),
  duracion: z.string().max(200).optional().default(""),
  via: z.string().max(200).optional().default(""),
  indicaciones: z.string().max(2000).optional().default(""),
  observaciones: z.string().max(2000).optional().default(""),
  alertaAlergiaConfirmada: z.boolean().default(false),
  justificacionAlergia: z.string().max(1000).optional().default(""),
});

export const documentoClinicoBorradorSchema = z.object({
  trabajadorId: z.union([z.string().uuid(), z.literal("")]),
  registroDiarioId: z.string().uuid().optional().or(z.literal("")),
  evaluacionMedicaId: z.string().uuid().optional().or(z.literal("")),
  fichaOcupacionalId: z.string().uuid().optional().or(z.literal("")),
  fechaDocumento: z.string().optional().default(""),
  motivoConsulta: z.string().max(5000).optional().default(""),
  evolucion: z.string().max(10000).optional().default(""),
  observaciones: z.string().max(5000).optional().default(""),
  diagnosticos: z.array(diagnosticoSchema).default([]),
  tratamientos: z.array(tratamientoBorradorSchema).default([]),
});

const tratamientoFinalSchema = tratamientoBorradorSchema.extend({
  nombre: z.string().trim().min(1, "La medicación es obligatoria.").max(500),
  dosis: z.string().trim().min(1, "La dosis es obligatoria.").max(500),
  cantidad: z.string().trim().min(1, "La cantidad es obligatoria.").max(500),
});

export const documentoClinicoFinalizarSchema = documentoClinicoBorradorSchema.extend({
  trabajadorId: z.string().uuid("Seleccione un trabajador."),
  fechaDocumento: z.string().date("Seleccione una fecha válida."),
  motivoConsulta: z.string().trim().min(1, "El motivo de consulta es obligatorio."),
  evolucion: z.string().trim().min(1, "La evolución es obligatoria."),
  tratamientos: z.array(tratamientoFinalSchema).default([]),
});

export type EntradaDocumentoClinico = z.input<typeof documentoClinicoBorradorSchema>;
export type DatosDocumentoClinico = z.output<typeof documentoClinicoBorradorSchema>;
