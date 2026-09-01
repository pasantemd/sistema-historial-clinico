import { z } from "zod";

const texto = (maximo = 4000) => z.string().trim().max(maximo).transform((valor) => valor || undefined).optional();
const numero = z.preprocess((valor) => valor === "" || valor == null ? undefined : Number(valor), z.number().nonnegative().optional());
const entero = z.preprocess((valor) => valor === "" || valor == null ? undefined : Number(valor), z.number().int().nonnegative().optional());
const fecha = z.preprocess((valor) => valor === "" || valor == null ? undefined : valor, z.iso.date().optional());

const diagnostico = z.object({
  enfermedadId: z.uuid(), codigo: z.string(), descripcion: z.string(), pre: z.boolean(), def: z.boolean(),
}).superRefine((dato, contexto) => {
  if (dato.pre === dato.def) contexto.addIssue({ code: "custom", message: "Seleccione PRE o DEF.", path: ["def"] });
});

const medicamento = z.object({
  nombreGenerico: z.string().trim().min(2, "Ingrese el nombre genérico."),
  nombreComercial: texto(160),
  presentacion: z.string().trim().min(1, "Ingrese la presentación."),
  cantidad: z.coerce
    .number({ error: "Ingrese una cantidad válida." })
    .int("La cantidad debe ser un número entero.")
    .positive("La cantidad debe ser mayor que cero."),
  dosis: texto(160),
  frecuencia: texto(160),
  duracion: texto(160),
  viaAdministracion: texto(160),
  indicaciones: texto(1000),
  alertaAlergiaConfirmada: z.boolean().default(false),
  justificacionAlergia: texto(1000),
  origen: z.enum(["REGISTRO_DIARIO", "EVALUACION"]).optional(),
});

const base = z.object({
  trabajadorId: z.uuid(),
  registroDiarioId: z.uuid().optional().or(z.literal("")),
  fechaAtencion: fecha,
  profesionalResponsable: texto(200),
  morbilidad: texto(160),
  motivoConsulta: texto(), sintomas: texto(), tiempoEvolucion: texto(500), observacionesMotivo: texto(),
  temperatura: numero, presionArterial: texto(30), frecuenciaCardiaca: entero, frecuenciaRespiratoria: entero,
  saturacionOxigeno: entero, peso: numero, talla: numero,
  antecedentesRelevantes: texto(), examenFisico: texto(), observacionesClinicas: texto(),
  diagnosticos: z.array(diagnostico).default([]), observacionesDiagnostico: texto(),
  indicaciones: texto(), recomendaciones: texto(), reposoDias: entero, seguimiento: texto(), proximaConsulta: fecha,
  medicamentos: z.array(medicamento).default([]),
});

export const evaluacionBorradorSchema = base;
export const evaluacionFinalizarSchema = base.superRefine((datos, contexto) => {
  const exigir = (campo: keyof typeof datos, mensaje: string) => {
    if (!datos[campo]) contexto.addIssue({ code: "custom", message: mensaje, path: [campo] });
  };
  exigir("fechaAtencion", "Ingrese la fecha de atención.");
  exigir("profesionalResponsable", "Ingrese el profesional responsable.");
  exigir("morbilidad", "Ingrese la morbilidad.");
  exigir("motivoConsulta", "Ingrese el motivo de consulta.");
  exigir("examenFisico", "Registre el examen físico.");
  if (!datos.diagnosticos.length) contexto.addIssue({ code: "custom", message: "Seleccione al menos un diagnóstico.", path: ["diagnosticos"] });
});

export const alergiaSchema = z.object({
  trabajadorId: z.uuid(),
  tipo: z.enum(["MEDICAMENTO", "ALIMENTO", "AMBIENTAL", "OTRA"]),
  sustancia: z.string().trim().min(2, "Ingrese la sustancia.").max(160),
  descripcion: texto(1000),
  severidad: z.enum(["LEVE", "MODERADA", "GRAVE"]),
});

export type DatosEvaluacion = z.output<typeof evaluacionBorradorSchema>;
export type EntradaEvaluacion = z.input<typeof evaluacionBorradorSchema>;
export type DatosAlergia = z.output<typeof alergiaSchema>;
