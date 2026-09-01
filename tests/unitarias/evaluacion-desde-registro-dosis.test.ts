import { describe, it, expect } from "vitest";
import { construirValoresEvaluacionDesdeRegistro } from "@/modulos/evaluaciones-medicas/servicios/construir-valores-evaluacion-desde-registro";
import { valoresInicialesEvaluacion } from "@/modulos/evaluaciones-medicas/componentes/valores-iniciales-evaluacion";
import type { ContextoEvaluacionDesdeRegistroDto } from "@/modulos/evaluaciones-medicas/tipos";

describe("construirValoresEvaluacionDesdeRegistro - Mapeo de Procedimiento a Dosis", () => {
  const baseTrabajadorId = "trab-123";

  it("1. Precarga 'procedimiento' del Registro diario como 'dosis' en el medicamento", () => {
    const iniciales = valoresInicialesEvaluacion(baseTrabajadorId);

    const origenRegistro: ContextoEvaluacionDesdeRegistroDto["registro"] = {
      id: "reg-001",
      trabajadorId: baseTrabajadorId,
      fechaAtencion: "2026-08-25",
      morbilidad: "Gastroenteritis",
      procedimiento: "Cada 5 horas",
      medico: { id: "med-001", nombre: "Dr. Juan Pérez" },
      medicamentos: [
        {
          nombre: "Paracetamol 500mg",
          cantidadEntregada: 5,
          unidad: "TABLETAS",
        },
      ],
    };

    const resultado = construirValoresEvaluacionDesdeRegistro(iniciales, origenRegistro);

    expect(resultado.registroDiarioId).toBe("reg-001");
    expect(resultado.morbilidad).toBe("Gastroenteritis");
    expect(resultado.medicamentos).toBeDefined();
    expect(resultado.medicamentos).toHaveLength(1);

    const med = resultado.medicamentos![0];
    expect(med.nombreGenerico).toBe("Paracetamol 500mg");
    expect(med.cantidad).toBe(5);
    expect(med.dosis).toBe("Cada 5 horas");
    expect(med.viaAdministracion).toBe("");
    expect(med.indicaciones).toBe("");
    expect(med.origen).toBe("REGISTRO_DIARIO");
  });

  it("2. Si 'procedimiento' es null o undefined, 'dosis' queda como string vacío \"\"", () => {
    const iniciales = valoresInicialesEvaluacion(baseTrabajadorId);

    const origenRegistroSinProc: ContextoEvaluacionDesdeRegistroDto["registro"] = {
      id: "reg-002",
      trabajadorId: baseTrabajadorId,
      fechaAtencion: "2026-08-25",
      morbilidad: "Cefalea",
      procedimiento: null,
      medico: { id: "med-001", nombre: "Dra. Ana López" },
      medicamentos: [
        {
          nombre: "Ibuprofeno 400mg",
          cantidadEntregada: 2,
          unidad: "TABLETAS",
        },
      ],
    };

    const resultado = construirValoresEvaluacionDesdeRegistro(iniciales, origenRegistroSinProc);

    expect(resultado.medicamentos).toBeDefined();
    expect(resultado.medicamentos).toHaveLength(1);
    expect(resultado.medicamentos![0].dosis).toBe("");
    expect(resultado.medicamentos![0].dosis).not.toBeNull();
    expect(resultado.medicamentos![0].dosis).not.toBeUndefined();
    expect(resultado.medicamentos![0].dosis).not.toBe("null");
  });

  it("3. No sobrescribe una dosis previamente editada/personalizada en valoresBase", () => {
    const iniciales = valoresInicialesEvaluacion(baseTrabajadorId);
    iniciales.medicamentos = [
      {
        nombreGenerico: "Paracetamol 500mg",
        nombreComercial: "",
        presentacion: "Tabletas",
        cantidad: 5,
        dosis: "1 tableta cada 8 horas con abundante agua",
        frecuencia: "",
        duracion: "",
        viaAdministracion: "Oral",
        indicaciones: "",
        alertaAlergiaConfirmada: false,
        justificacionAlergia: "",
        origen: "REGISTRO_DIARIO",
      },
    ];

    const origenRegistro: ContextoEvaluacionDesdeRegistroDto["registro"] = {
      id: "reg-003",
      trabajadorId: baseTrabajadorId,
      fechaAtencion: "2026-08-25",
      morbilidad: "Gastroenteritis",
      procedimiento: "Cada 5 horas",
      medico: { id: "med-001", nombre: "Dr. Juan Pérez" },
      medicamentos: [
        {
          nombre: "Paracetamol 500mg",
          cantidadEntregada: 5,
          unidad: "TABLETAS",
        },
      ],
    };

    const resultado = construirValoresEvaluacionDesdeRegistro(iniciales, origenRegistro);

    expect(resultado.medicamentos).toBeDefined();
    expect(resultado.medicamentos![0].dosis).toBe("1 tableta cada 8 horas con abundante agua");
  });

  it("4. Varios medicamentos reciben el procedimiento general como dosis inicial", () => {
    const iniciales = valoresInicialesEvaluacion(baseTrabajadorId);

    const origenRegistroMultiple: ContextoEvaluacionDesdeRegistroDto["registro"] = {
      id: "reg-004",
      trabajadorId: baseTrabajadorId,
      fechaAtencion: "2026-08-25",
      morbilidad: "Infección respiratoria",
      procedimiento: "Tomar cada 8 horas después de alimentos",
      medico: { id: "med-001", nombre: "Dr. Juan Pérez" },
      medicamentos: [
        {
          nombre: "Paracetamol 500mg",
          cantidadEntregada: 6,
          unidad: "TABLETAS",
        },
        {
          nombre: "Lemonflu",
          cantidadEntregada: 3,
          unidad: "SOBRES",
        },
      ],
    };

    const resultado = construirValoresEvaluacionDesdeRegistro(iniciales, origenRegistroMultiple);

    expect(resultado.medicamentos).toBeDefined();
    expect(resultado.medicamentos).toHaveLength(2);
    expect(resultado.medicamentos![0].nombreGenerico).toBe("Paracetamol 500mg");
    expect(resultado.medicamentos![0].dosis).toBe("Tomar cada 8 horas después de alimentos");
    expect(resultado.medicamentos![1].nombreGenerico).toBe("Lemonflu");
    expect(resultado.medicamentos![1].dosis).toBe("Tomar cada 8 horas después de alimentos");
  });
});
