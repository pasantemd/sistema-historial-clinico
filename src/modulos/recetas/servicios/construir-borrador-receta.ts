import type { ContextoRecetaDto } from "@/modulos/recetas/tipos";
import type { EntradaReceta } from "@/modulos/recetas/validaciones/receta.schema";

interface OrigenesReceta {
  registroDiarioId?: string;
  evaluacionId?: string;
  fichaOcupacionalId?: string;
  documentoClinicoId?: string;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function profesionalInicial(contexto: ContextoRecetaDto, usuarioId: string): string {
  const responsableEvaluacion = contexto.evaluacion?.profesionalId;
  if (responsableEvaluacion) return responsableEvaluacion;
  const responsableRegistro = contexto.registroDiario?.profesionalId;
  if (responsableRegistro && contexto.profesionales.some((item) => item.id === responsableRegistro)) {
    return responsableRegistro;
  }
  return contexto.profesionales.some((item) => item.id === usuarioId) ? usuarioId : "";
}

export function construirBorradorReceta(
  contexto: ContextoRecetaDto,
  usuarioId: string,
  origenes: OrigenesReceta,
): EntradaReceta {
  const medicamentosEvaluacion = contexto.evaluacion?.medicamentos.map((item, orden) => ({
    medicamentoId: item.medicamentoId,
    nombreMedicamentoHistorico: item.nombreGenerico,
    nombreGenericoHistorico: item.nombreGenerico,
    nombreComercialHistorico: item.nombreComercial ?? "",
    presentacionHistorica: item.presentacion,
    concentracionHistorica: "",
    cantidad: item.cantidad ? String(item.cantidad) : "",
    dosis: item.dosis?.trim() ?? "",
    frecuencia: item.frecuencia ?? "",
    intervaloHoras: null,
    duracion: item.duracion ?? "",
    viaAdministracion: item.viaAdministracion?.trim() ?? "",
    indicaciones: "",
    observaciones: "",
    orden,
  })) ?? [];

  const procedimientoRegistro = contexto.registroDiario?.procedimiento?.trim() ?? "";

  const medicamentosRegistro = contexto.registroDiario?.medicamentos?.length
    ? contexto.registroDiario.medicamentos.map((item, orden) => ({
        medicamentoId: null,
        nombreMedicamentoHistorico: item.nombre,
        nombreGenericoHistorico: item.nombre,
        nombreComercialHistorico: "",
        presentacionHistorica: item.unidad,
        concentracionHistorica: "",
        cantidad: String(item.cantidadEntregada),
        dosis: procedimientoRegistro,
        frecuencia: "",
        intervaloHoras: null,
        duracion: "",
        viaAdministracion: "",
        indicaciones: "",
        observaciones: "",
        orden,
      }))
    : contexto.registroDiario?.medicacion
      ? [{
          medicamentoId: null,
          nombreMedicamentoHistorico: contexto.registroDiario.medicacion,
          nombreGenericoHistorico: "",
          nombreComercialHistorico: "",
          presentacionHistorica: "",
          concentracionHistorica: "",
          cantidad: "",
          dosis: procedimientoRegistro,
          frecuencia: "",
          intervaloHoras: null,
          duracion: "",
          viaAdministracion: "",
          indicaciones: "",
          observaciones: "",
          orden: 0,
        }]
      : [];

  return {
    trabajadorId: contexto.trabajador.id,
    registroDiarioId: contexto.registroDiarioId ?? origenes.registroDiarioId ?? "",
    evaluacionId: contexto.evaluacion?.id ?? origenes.evaluacionId ?? "",
    fichaOcupacionalId: origenes.fichaOcupacionalId ?? "",
    documentoClinicoId: origenes.documentoClinicoId ?? "",
    profesionalId: profesionalInicial(contexto, usuarioId),
    fechaEmision: contexto.evaluacion?.fecha ?? contexto.registroDiario?.fecha ?? hoyISO(),
    indicacionesGenerales: "",
    recomendaciones: "",
    observaciones: "",
    medicamentos: medicamentosEvaluacion.length ? medicamentosEvaluacion : medicamentosRegistro,
  };
}
