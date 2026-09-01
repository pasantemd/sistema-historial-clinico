import { describe, expect, it } from "vitest";

import { construirIndicacionesReceta } from "@/modulos/recetas/servicios/construir-indicaciones-receta";

describe("indicaciones visibles de la receta", () => {
  it("no inventa contenido ni antepone el medicamento cuando las indicaciones están vacías", () => {
    const resultado = construirIndicacionesReceta({
      indicacionesGenerales: "Procedimiento heredado",
      recomendaciones: "Recomendación de la evaluación",
      observaciones: "Dolor de garganta",
      medicamentos: [
        {
          nombreMedicamentoHistorico: "Vitamina c",
          indicaciones: "",
        },
      ],
    });

    expect(resultado).toBeNull();
    expect(resultado ?? "").not.toContain("Vitamina c: ninguna");
    expect(resultado ?? "").not.toContain("ninguna");
  });

  it("muestra únicamente la indicación escrita sin anteponer el medicamento", () => {
    const resultado = construirIndicacionesReceta({
      indicacionesGenerales: "Texto que no pertenece al recuadro",
      recomendaciones: "Texto heredado",
      observaciones: "Morbilidad heredada",
      medicamentos: [
        {
          nombreMedicamentoHistorico: "Vitamina c",
          indicaciones: "Tomar después del desayuno",
        },
      ],
    });

    expect(resultado).toBe("Tomar después del desayuno");
    expect(resultado).not.toContain(
      "Vitamina c: Tomar después del desayuno",
    );
  });

  it("omite medicamentos vacíos y conserva solo los textos escritos", () => {
    const resultado = construirIndicacionesReceta({
      indicacionesGenerales: null,
      recomendaciones: null,
      observaciones: null,
      medicamentos: [
        {
          nombreMedicamentoHistorico: "Paracetamol",
          indicaciones: "Después de alimentos",
        },
        {
          nombreMedicamentoHistorico: "Ibuprofeno",
          indicaciones: "",
        },
      ],
    });

    expect(resultado).toBe("Después de alimentos");
    expect(resultado).not.toContain("Paracetamol:");
    expect(resultado).not.toContain("Ibuprofeno:");
    expect(resultado).not.toContain("ninguna");
  });
});
