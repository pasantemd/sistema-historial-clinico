import { describe, it, expect } from "vitest";
import { construirBorradorReceta } from "@/modulos/recetas/servicios/construir-borrador-receta";
import { crearRecetaSchema, recetaBorradorSchema } from "@/modulos/recetas/validaciones/receta.schema";
import type { ContextoRecetaDto } from "@/modulos/recetas/tipos";

describe("construirBorradorReceta - Traspaso Registro diario / Evaluación a Receta", () => {
  const trabajadorIdValido = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const empresaIdValida = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
  const deptoIdValido = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";
  const profesionalIdValido = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44";
  const registroIdValido = "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55";
  const evaluacionIdValida = "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66";
  const medicamentoIdValido = "10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77";

  const contextoBase: ContextoRecetaDto = {
    trabajador: {
      id: trabajadorIdValido,
      nombre: "Juan Pérez",
      documento: "0912345678",
      fechaNacimiento: "1990-05-15",
      sexo: "MASCULINO",
    },
    empresa: {
      id: empresaIdValida,
      nombre: "Empresa Test S.A.",
      ruc: "0999999999001",
      direccion: "Guayaquil",
      telefono: "042000000",
    },
    departamento: {
      id: deptoIdValido,
      nombre: "OPERACIONES",
    },
    asignacion: null,
    alergias: [],
    diagnosticos: [],
    profesionales: [
      {
        id: profesionalIdValido,
        nombre: "Dra. Ana López",
        codigoProfesional: "MED-001",
        especialidad: "Medicina Ocupacional",
      },
    ],
    registroDiarioId: registroIdValido,
    registroDiario: null,
    evaluacion: null,
  };

  it("1. Precarga Registro diario estructurado: nombre limpio, cantidad, presentacion, dosis = procedimiento, vía e indicaciones vacías", () => {
    const contexto: ContextoRecetaDto = {
      ...contextoBase,
      registroDiario: {
        fecha: "2026-08-25",
        morbilidad: "Gastroenteritis aguda",
        medicacion: "Paracetamol 500mg x5",
        procedimiento: "Cada 5 horas",
        profesionalId: profesionalIdValido,
        medicamentos: [
          {
            nombre: "Paracetamol 500mg",
            cantidadEntregada: 5,
            unidad: "Tabletas",
          },
        ],
      },
    };

    const borrador = construirBorradorReceta(
      contexto,
      profesionalIdValido,
      { registroDiarioId: registroIdValido },
    );

    expect(borrador.trabajadorId).toBe(trabajadorIdValido);
    expect(borrador.registroDiarioId).toBe(registroIdValido);
    expect(borrador.medicamentos).toHaveLength(1);

    const med = borrador.medicamentos[0];
    expect(med.nombreMedicamentoHistorico).toBe("Paracetamol 500mg");
    expect(med.nombreMedicamentoHistorico).not.toContain("x5");
    expect(med.nombreMedicamentoHistorico).not.toContain("(5 tabletas)");
    expect(med.cantidad).toBe("5");
    expect(med.presentacionHistorica).toBe("Tabletas");
    expect(med.dosis).toBe("Cada 5 horas");
    expect(med.viaAdministracion).toBe("");
    expect(med.indicaciones).toBe("");
    expect(borrador.indicacionesGenerales).toBe("");
  });

  it("2. Precarga múltiples medicamentos desde Registro diario con dosis individual para cada uno", () => {
    const contexto: ContextoRecetaDto = {
      ...contextoBase,
      registroDiario: {
        fecha: "2026-08-25",
        morbilidad: "Infección respiratoria",
        medicacion: "Paracetamol x6, Lemonflu x3",
        procedimiento: "Tomar cada 8 horas con agua",
        profesionalId: profesionalIdValido,
        medicamentos: [
          {
            nombre: "Paracetamol 500mg",
            cantidadEntregada: 6,
            unidad: "Tabletas",
          },
          {
            nombre: "Lemonflu",
            cantidadEntregada: 3,
            unidad: "Sobres",
          },
        ],
      },
    };

    const borrador = construirBorradorReceta(
      contexto,
      profesionalIdValido,
      { registroDiarioId: registroIdValido },
    );

    expect(borrador.medicamentos).toHaveLength(2);
    expect(borrador.medicamentos[0].nombreMedicamentoHistorico).toBe("Paracetamol 500mg");
    expect(borrador.medicamentos[0].cantidad).toBe("6");
    expect(borrador.medicamentos[0].dosis).toBe("Tomar cada 8 horas con agua");

    expect(borrador.medicamentos[1].nombreMedicamentoHistorico).toBe("Lemonflu");
    expect(borrador.medicamentos[1].cantidad).toBe("3");
    expect(borrador.medicamentos[1].dosis).toBe("Tomar cada 8 horas con agua");
  });

  it("3. Si Registro diario no tiene procedimiento, dosis queda como string vacío \"\"", () => {
    const contexto: ContextoRecetaDto = {
      ...contextoBase,
      registroDiario: {
        fecha: "2026-08-25",
        morbilidad: "Cefalea",
        medicacion: "Ibuprofeno",
        procedimiento: null,
        profesionalId: profesionalIdValido,
        medicamentos: [
          {
            nombre: "Ibuprofeno 400mg",
            cantidadEntregada: 2,
            unidad: "Tabletas",
          },
        ],
      },
    };

    const borrador = construirBorradorReceta(
      contexto,
      profesionalIdValido,
      { registroDiarioId: registroIdValido },
    );

    expect(borrador.medicamentos[0].dosis).toBe("");
    expect(borrador.medicamentos[0].dosis).not.toBeNull();
    expect(borrador.medicamentos[0].dosis).not.toBeUndefined();
    expect(borrador.medicamentos[0].dosis).not.toBe("null");
  });

  it("4. Receta creada desde Evaluación médica tiene prioridad sobre Registro diario", () => {
    const contexto: ContextoRecetaDto = {
      ...contextoBase,
      evaluacion: {
        id: evaluacionIdValida,
        recetaId: null,
        fecha: "2026-08-25",
        profesionalId: profesionalIdValido,
        indicaciones: "Reposo 24 horas",
        recomendaciones: "Hidratación",
        morbilidad: "Gastroenteritis",
        medicamentos: [
          {
            medicamentoId: medicamentoIdValido,
            nombreGenerico: "Amoxicilina 500mg",
            nombreComercial: "Amoxil",
            presentacion: "Cápsulas",
            cantidad: "10",
            dosis: "1 cápsula cada 8 horas",
            frecuencia: "Cada 8 horas",
            duracion: "5 días",
            viaAdministracion: "Oral",
            indicaciones: "Tomar con alimentos",
          },
        ],
      },
      registroDiario: {
        fecha: "2026-08-25",
        morbilidad: "Dolor abdominal",
        medicacion: "Paracetamol",
        procedimiento: "Cada 5 horas",
        profesionalId: profesionalIdValido,
        medicamentos: [
          {
            nombre: "Paracetamol",
            cantidadEntregada: 5,
            unidad: "Tabletas",
          },
        ],
      },
    };

    const borrador = construirBorradorReceta(
      contexto,
      profesionalIdValido,
      { evaluacionId: evaluacionIdValida },
    );

    expect(borrador.medicamentos).toHaveLength(1);
    const med = borrador.medicamentos[0];
    expect(med.nombreMedicamentoHistorico).toBe("Amoxicilina 500mg");
    expect(med.dosis).toBe("1 cápsula cada 8 horas");
    expect(med.viaAdministracion).toBe("Oral");
    expect(med.indicaciones).toBe("");
    expect(borrador.indicacionesGenerales).toBe("");
    expect(borrador.recomendaciones).toBe("");
    expect(borrador.observaciones).toBe("");
  });

  it("5. Validación Zod: Permite emitir receta con indicaciones vacías / opcionales", () => {
    const recetaValida = {
      trabajadorId: trabajadorIdValido,
      registroDiarioId: registroIdValido,
      profesionalId: profesionalIdValido,
      fechaEmision: "2026-08-25",
      indicacionesGenerales: "",
      medicamentos: [
        {
          nombreMedicamentoHistorico: "Paracetamol 500mg",
          cantidad: "5",
          dosis: "Cada 5 horas",
          viaAdministracion: "Oral",
          indicaciones: "",
        },
      ],
    };

    const parsedBorrador = recetaBorradorSchema.safeParse(recetaValida);
    expect(parsedBorrador.success).toBe(true);

    const parsedCrear = crearRecetaSchema.safeParse(recetaValida);
    expect(parsedCrear.success).toBe(true);
  });
});
