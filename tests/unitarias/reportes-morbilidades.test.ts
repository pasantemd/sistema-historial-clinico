import { describe, expect, it, vi, beforeEach } from "vitest";
import { consultarReportes } from "@/modulos/reportes/consultas/reportes.consulta";
import { prisma } from "@/servicios/base-datos/prisma";
import { normalizarMorbilidad } from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([]),
    registroDiarioAtencion: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    evaluacionMedica: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    fichaOcupacional: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    recetaMedica: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    citaMedica: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    diagnosticoFicha: {
      groupBy: vi.fn().mockReturnValue(Promise.resolve([])),
    },
    empresa: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("@/modulos/empresas/servicios/acceso-empresa.servicio", () => ({
  requerirAccesoEmpresa: vi.fn().mockResolvedValue(undefined),
}));

describe("Reportes - Gráfico Tipos de Morbilidades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrupa variantes equivalentes mediante normalizarMorbilidad", () => {
    const variantes = [
      "Dolor abdominal",
      "DOLOR ABDOMINAL",
      "dolór abdominal",
      " dolor  abdominal ",
    ];
    const normalizadas = new Set(variantes.map(normalizarMorbilidad));
    expect(normalizadas.size).toBe(1);
    expect(Array.from(normalizadas)[0]).toBe("dolor abdominal");
  });

  it("calcula morbilidades unificando Evaluaciones y Registros Diarios sin doble conteo", async () => {
    const mockEvalMorbilidades = [
      { morbilidad: "Dolor abdominal", _count: { id: 10 } },
      { morbilidad: "DOLOR ABDOMINAL", _count: { id: 2 } },
      { morbilidad: "Cefalea tensional", _count: { id: 8 } },
    ];

    const mockRegMorbilidades = [
      { atencionMorbilidad: "dolor abdominal", _count: { id: 5 } },
      { atencionMorbilidad: "Gastritis aguda", _count: { id: 7 } },
    ];

    vi.mocked(prisma.evaluacionMedica.groupBy)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockEvalMorbilidades as never);

    vi.mocked(prisma.registroDiarioAtencion.groupBy)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockRegMorbilidades as never);

    const resultado = await consultarReportes("usuario-1", {
      periodo: "mensual",
      fechaDesde: "2026-08-01",
      fechaHasta: "2026-08-31",
    });

    expect(resultado.morbilidadesFrecuentes).toBeDefined();

    // 1. Dolor abdominal = 10 (eval) + 2 (eval mayusc) + 5 (reg) = 17
    // 2. Cefalea tensional = 8
    // 3. Gastritis aguda = 7
    expect(resultado.morbilidadesFrecuentes[0]).toEqual({
      label: "Dolor abdominal",
      valor: 17,
    });
    expect(resultado.morbilidadesFrecuentes[1]).toEqual({
      label: "Cefalea tensional",
      valor: 8,
    });
    expect(resultado.morbilidadesFrecuentes[2]).toEqual({
      label: "Gastritis aguda",
      valor: 7,
    });
  });

  it("aplica regla de no doble conteo asegurando que registros con evaluaciones vinculadas son excluidos en la consulta Prisma", async () => {
    await consultarReportes("usuario-1", {
      periodo: "semanal",
      fechaDesde: "2026-08-17",
      fechaHasta: "2026-08-23",
    });

    expect(prisma.registroDiarioAtencion.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["atencionMorbilidad"],
        where: expect.objectContaining({
          evaluaciones: {
            none: {
              estado: { not: "ANULADA" },
            },
          },
        }),
      }),
    );
  });

  it("ordena empates determinísticamente por nombre ASC cuando las cantidades son iguales", async () => {
    const mockEvalMorbilidades = [
      { morbilidad: "Lumbalgia", _count: { id: 5 } },
      { morbilidad: "Bronquitis", _count: { id: 5 } },
      { morbilidad: "Amigdalitis", _count: { id: 5 } },
    ];

    vi.mocked(prisma.evaluacionMedica.groupBy)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockEvalMorbilidades as never);

    vi.mocked(prisma.registroDiarioAtencion.groupBy)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const resultado = await consultarReportes("usuario-1", {
      periodo: "semanal",
    });

    // Todas tienen 5; deben quedar en orden alfabético: Amigdalitis, Bronquitis, Lumbalgia
    expect(resultado.morbilidadesFrecuentes.map((m) => m.label)).toEqual([
      "Amigdalitis",
      "Bronquitis",
      "Lumbalgia",
    ]);
  });
});
