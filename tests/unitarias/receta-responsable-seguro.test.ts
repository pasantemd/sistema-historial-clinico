import { describe, expect, it } from "vitest";

import { vi } from "vitest";

vi.mock("@/servicios/base-datos/prisma", () => ({ prisma: {} }));

import { resolverProfesionalResponsableReceta } from "@/modulos/recetas/repositorios/recetas.repositorio";

describe("responsable clínico de una receta", () => {
  it("usa al responsable persistido de la evaluación vinculada", () => {
    expect(
      resolverProfesionalResponsableReceta({
        usuarioId: "usuario-actor",
        profesionalEvaluacionId: "medico-evaluacion",
      }),
    ).toBe("medico-evaluacion");
  });

  it("en una receta nueva independiente usa al usuario autenticado", () => {
    expect(
      resolverProfesionalResponsableReceta({ usuarioId: "usuario-actor" }),
    ).toBe("usuario-actor");
  });

  it("al editar conserva el responsable persistido si no hay evaluación", () => {
    expect(
      resolverProfesionalResponsableReceta({
        usuarioId: "usuario-editor",
        profesionalExistenteId: "medico-original",
      }),
    ).toBe("medico-original");
  });
});
