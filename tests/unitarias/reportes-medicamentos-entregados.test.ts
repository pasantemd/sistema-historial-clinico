import { beforeEach, describe, expect, it, vi } from "vitest";

import { requerirAccesoEmpresa } from "@/modulos/empresas/servicios/acceso-empresa.servicio";
import { consultarMedicamentosEntregadosReporte } from "@/modulos/reportes/consultas/medicamentos-entregados.consulta";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/modulos/empresas/servicios/acceso-empresa.servicio", () => ({
  requerirAccesoEmpresa: vi.fn().mockResolvedValue(undefined),
}));

function textoConsulta(): string {
  const argumento = vi.mocked(prisma.$queryRaw).mock.calls[0]?.[0] as {
    strings?: string[];
  };
  return argumento.strings?.join("?") ?? "";
}

function valoresConsulta(): unknown[] {
  const argumento = vi.mocked(prisma.$queryRaw).mock.calls[0]?.[0] as {
    values?: unknown[];
  };
  return argumento.values ?? [];
}

describe("Reporte de medicamentos entregados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
  });

  it("agrega cantidades y número de entregas por medicamento y unidad", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        medicamentoId: "paracetamol",
        nombre: "Paracetamol",
        unidad: "TABLETAS",
        cantidadTotal: 5,
        numeroEntregas: BigInt(2),
      },
      {
        medicamentoId: "ibuprofeno",
        nombre: "Ibuprofeno",
        unidad: "TABLETAS",
        cantidadTotal: 1,
        numeroEntregas: BigInt(1),
      },
    ] as never);

    await expect(
      consultarMedicamentosEntregadosReporte("usuario-a", {
        periodo: "personalizado",
        fechaDesde: "2026-08-01",
        fechaHasta: "2026-08-31",
      }),
    ).resolves.toEqual([
      {
        medicamentoId: "paracetamol",
        nombre: "Paracetamol",
        unidad: "TABLETAS",
        cantidadTotal: 5,
        numeroEntregas: 2,
      },
      {
        medicamentoId: "ibuprofeno",
        nombre: "Ibuprofeno",
        unidad: "TABLETAS",
        cantidadTotal: 1,
        numeroEntregas: 1,
      },
    ]);
  });

  it("resta devoluciones vinculadas sin contarlas como entregas", async () => {
    await consultarMedicamentosEntregadosReporte("usuario-a", {
      periodo: "mensual",
    });

    const consulta = textoConsulta();
    expect(consulta).toContain("mov.\"tipoMovimiento\" = 'SALIDA'");
    expect(consulta).toContain("mov.\"referenciaTipo\" = 'REGISTRO_DIARIO'");
    expect(consulta).toContain("mov.\"tipoMovimiento\" = 'DEVOLUCION'");
    expect(consulta).toContain(
      "mov.\"referenciaTipo\" = 'REGISTRO_DIARIO_ANULADO'",
    );
    expect(consulta).toContain('THEN -mov."cantidad"');
    expect(consulta).toContain('WHERE "cantidadNeta" > 0');
    expect(consulta).toContain('COUNT(*)::bigint AS "numeroEntregas"');
  });

  it("mantiene separadas unidades incompatibles del mismo medicamento", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        medicamentoId: "medicamento-a",
        nombre: "Medicamento A",
        unidad: "TABLETAS",
        cantidadTotal: 10,
        numeroEntregas: BigInt(1),
      },
      {
        medicamentoId: "medicamento-a",
        nombre: "Medicamento A",
        unidad: "MILILITROS",
        cantidadTotal: 5,
        numeroEntregas: BigInt(1),
      },
    ] as never);

    const resultado = await consultarMedicamentosEntregadosReporte(
      "usuario-a",
      { periodo: "semanal" },
    );

    expect(resultado.map((item) => [item.unidad, item.cantidadTotal])).toEqual([
      ["TABLETAS", 10],
      ["MILILITROS", 5],
    ]);
    expect(textoConsulta()).toContain(
      'GROUP BY "medicamentoId", "nombre", "unidad"',
    );
  });

  it("aplica fechas y contexto histórico de empresa, departamento, trabajador y profesional", async () => {
    await consultarMedicamentosEntregadosReporte("usuario-a", {
      periodo: "personalizado",
      fechaDesde: "2026-08-10",
      fechaHasta: "2026-08-20",
      empresaId: "00000000-0000-0000-0000-000000000001",
      departamentoId: "00000000-0000-0000-0000-000000000002",
      trabajadorId: "00000000-0000-0000-0000-000000000003",
      profesionalId: "00000000-0000-0000-0000-000000000004",
    });

    expect(requerirAccesoEmpresa).toHaveBeenCalledWith(
      "usuario-a",
      "00000000-0000-0000-0000-000000000001",
    );
    const consulta = textoConsulta();
    expect(consulta).toContain('rd."diaAtencion" >= ?::date');
    expect(consulta).toContain('rd."diaAtencion" <= ?::date');
    expect(consulta).toContain('rd."empresaId" = ?::uuid');
    expect(consulta).toContain('rd."departamentoId" = ?::uuid');
    expect(consulta).toContain('rd."trabajadorId" = ?::uuid');
    expect(consulta).toContain('rd."profesionalId" = ?::uuid');
    expect(valoresConsulta()).toEqual(
      expect.arrayContaining([
        "usuario-a",
        "2026-08-10",
        "2026-08-20",
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000004",
      ]),
    );
  });

  it("limita siempre la agregación a empresas autorizadas del usuario", async () => {
    await consultarMedicamentosEntregadosReporte("usuario-a", {
      periodo: "mensual",
    });

    const consulta = textoConsulta();
    expect(consulta).toContain('FROM "UsuarioEmpresa" AS ue');
    expect(consulta).toContain('ue."usuarioId" = ?::uuid');
    expect(consulta).toContain('ue."empresaId" = rd."empresaId"');
    expect(valoresConsulta()).toContain("usuario-a");
  });

  it("rechaza una empresa explícita no autorizada antes de consultar entregas", async () => {
    vi.mocked(requerirAccesoEmpresa).mockRejectedValueOnce(
      new Error("Acceso empresarial denegado"),
    );

    await expect(
      consultarMedicamentosEntregadosReporte("usuario-a", {
        periodo: "mensual",
        empresaId: "00000000-0000-0000-0000-000000000099",
      }),
    ).rejects.toThrow("Acceso empresarial denegado");
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
