import type { EntradaEvaluacion } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";

function obtenerFechaCivilActual(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function valoresInicialesEvaluacion(
  trabajadorId: string,
): EntradaEvaluacion {
  return {
    trabajadorId,
    registroDiarioId: "",
    fechaAtencion: obtenerFechaCivilActual(),
    profesionalResponsable: "",
    morbilidad: "",
    motivoConsulta: "",
    sintomas: "",
    tiempoEvolucion: "",
    observacionesMotivo: "",
    temperatura: "",
    presionArterial: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    saturacionOxigeno: "",
    peso: "",
    talla: "",
    antecedentesRelevantes: "",
    examenFisico: "",
    observacionesClinicas: "",
    diagnosticos: [],
    observacionesDiagnostico: "",
    indicaciones: "",
    recomendaciones: "",
    reposoDias: "",
    seguimiento: "",
    proximaConsulta: "",
    medicamentos: [],
  };
}
