import type { ContextoEvaluacionDesdeRegistroDto } from "@/modulos/evaluaciones-medicas/tipos";
import type { EntradaEvaluacion } from "@/modulos/evaluaciones-medicas/validaciones/evaluacion.schema";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";

export function construirValoresEvaluacionDesdeRegistro(
  valoresBase: EntradaEvaluacion,
  origen: ContextoEvaluacionDesdeRegistroDto["registro"],
): EntradaEvaluacion {
  const procedimientoLimpio = origen.procedimiento?.trim() ?? "";

  return {
    ...valoresBase,
    trabajadorId: origen.trabajadorId,
    registroDiarioId: origen.id,
    fechaAtencion: origen.fechaAtencion,
    profesionalResponsable: origen.medico.nombre ?? "",
    morbilidad: origen.morbilidad,
    observacionesMotivo: "",
    medicamentos: origen.medicamentos.map((medicamento, index) => {
      const dosisExistente = valoresBase.medicamentos?.[index]?.dosis?.trim();
      const dosisFinal = dosisExistente && dosisExistente.length > 0
        ? dosisExistente
        : procedimientoLimpio;

      return {
        nombreGenerico: medicamento.nombre,
        nombreComercial: "",
        presentacion: etiquetaUnidadInventario(medicamento.unidad),
        cantidad: medicamento.cantidadEntregada,
        dosis: dosisFinal,
        frecuencia: "",
        duracion: "",
        viaAdministracion: "",
        indicaciones: "",
        alertaAlergiaConfirmada: false,
        justificacionAlergia: "",
        origen: "REGISTRO_DIARIO",
      };
    }),
  };
}
