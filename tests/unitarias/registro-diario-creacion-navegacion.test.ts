import { beforeEach, describe, expect, it, vi } from "vitest";

import { obtenerRutaRegistroDiarioGuardado } from "@/modulos/registro-diario/navegacion/registro-diario.navegacion";
import { crearRegistroDiarioRepositorio } from "@/modulos/registro-diario/repositorios/registro-diario.repositorio";
import { guardarRegistroDiarioServicio } from "@/modulos/registro-diario/servicios/registro-diario.servicio";

vi.mock("@/modulos/registro-diario/repositorios/registro-diario.repositorio", () => ({
  crearRegistroDiarioRepositorio: vi.fn(),
  actualizarRegistroDiarioRepositorio: vi.fn(),
  anularRegistroDiarioRepositorio: vi.fn(),
}));

vi.mock("@/servicios/auditoria/registrar-auditoria", () => ({
  registrarAuditoriaSegura: vi.fn(),
}));

describe("Creación y navegación de Registro Diario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([true, false])(
    "dirige al detalle del registro creado al guardar (finalizar=%s)",
    () => {
      expect(obtenerRutaRegistroDiarioGuardado("registro-creado-123")).toBe(
        "/registro-diario/registro-creado-123",
      );
    },
  );

  it("propaga el id retornado por Prisma sin buscar nuevamente el registro", async () => {
    vi.mocked(crearRegistroDiarioRepositorio).mockResolvedValueOnce({
      id: "registro-creado-123",
      numeroRegistro: "RDA-000123",
    });

    const datos = {
      trabajadorId: "trabajador-1",
      fechaAtencion: "2026-09-01",
      atencionMorbilidad: "Cefalea",
      medicacion: "",
      medicamentos: [],
      procedimiento: "Evaluación clínica",
      firmaConfirmada: true,
      observaciones: "",
    };

    const resultado = await guardarRegistroDiarioServicio(
      null,
      datos,
      "usuario-1",
      true,
    );

    expect(resultado.id).toBe("registro-creado-123");
    expect(crearRegistroDiarioRepositorio).toHaveBeenCalledOnce();
  });
});
