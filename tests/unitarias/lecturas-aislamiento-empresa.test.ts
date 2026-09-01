import { beforeEach, describe, expect, it, vi } from "vitest";

import { consultarAtencion } from "@/modulos/atenciones-medicas/consultas/atenciones.consulta";
import { consultarResumenInicio } from "@/modulos/inicio/consultas/inicio.consulta";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    trabajador: { count: vi.fn() },
    registroDiarioAtencion: { count: vi.fn(), findMany: vi.fn() },
    evaluacionMedica: { count: vi.fn() },
    citaMedica: { count: vi.fn(), findMany: vi.fn() },
    recetaMedica: { count: vi.fn() },
    fichaOcupacional: { count: vi.fn() },
    atencionMedica: { findFirst: vi.fn() },
  },
}));

const empresaAutorizada = {
  empresa: { usuariosAutorizados: { some: { usuarioId: "usuario-1" } } },
};

describe("aislamiento de lecturas clínicas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.trabajador.count).mockResolvedValue(0);
    vi.mocked(prisma.registroDiarioAtencion.count).mockResolvedValue(0);
    vi.mocked(prisma.evaluacionMedica.count).mockResolvedValue(0);
    vi.mocked(prisma.citaMedica.count).mockResolvedValue(0);
    vi.mocked(prisma.recetaMedica.count).mockResolvedValue(0);
    vi.mocked(prisma.fichaOcupacional.count).mockResolvedValue(0);
    vi.mocked(prisma.registroDiarioAtencion.findMany).mockResolvedValue([]);
    vi.mocked(prisma.citaMedica.findMany).mockResolvedValue([]);
  });

  it("limita todas las métricas y listas del panel a empresas autorizadas", async () => {
    await consultarResumenInicio("usuario-1");

    for (const llamada of [
      prisma.trabajador.count,
      prisma.registroDiarioAtencion.count,
      prisma.evaluacionMedica.count,
      prisma.citaMedica.count,
      prisma.recetaMedica.count,
      prisma.fichaOcupacional.count,
      prisma.registroDiarioAtencion.findMany,
      prisma.citaMedica.findMany,
    ]) {
      for (const [argumento] of vi.mocked(llamada).mock.calls) {
        expect(argumento).toEqual(
          expect.objectContaining({ where: expect.objectContaining(empresaAutorizada) }),
        );
      }
    }
  });

  it("limita el detalle de una atención a la empresa autorizada", async () => {
    vi.mocked(prisma.atencionMedica.findFirst).mockResolvedValue(null);

    await consultarAtencion("atencion-ajena", "trabajador-ajeno", "usuario-1");

    expect(prisma.atencionMedica.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "atencion-ajena",
          trabajadorId: "trabajador-ajeno",
          ...empresaAutorizada,
        },
      }),
    );
  });
});
