import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelarCitaRepositorio,
  consultarCitaRepositorio,
  listarCitasPaginadas,
  listarTrabajadoresCitaRepositorio,
} from "@/modulos/citas/repositorios/citas.repositorio";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    citaMedica: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    trabajador: { findMany: vi.fn() },
  },
}));

const accesoEmpresa = {
  empresa: { usuariosAutorizados: { some: { usuarioId: "usuario-1" } } },
};

describe("aislamiento multiempresa de citas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.citaMedica.count).mockResolvedValue(0);
    vi.mocked(prisma.citaMedica.findMany).mockResolvedValue([]);
    vi.mocked(prisma.trabajador.findMany).mockResolvedValue([]);
  });

  it("filtra el listado paginado por empresas autorizadas", async () => {
    await listarCitasPaginadas("usuario-1", {}, 1);

    expect(prisma.citaMedica.count).toHaveBeenCalledWith({
      where: expect.objectContaining(accesoEmpresa),
    });
    expect(prisma.citaMedica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining(accesoEmpresa) }),
    );
  });

  it("filtra el selector de trabajadores por empresas autorizadas", async () => {
    await listarTrabajadoresCitaRepositorio("usuario-1", "Ana");

    expect(prisma.trabajador.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresa: { usuariosAutorizados: { some: { usuarioId: "usuario-1" } } },
        }),
      }),
    );
  });

  it("consulta el detalle únicamente dentro del alcance autorizado", async () => {
    vi.mocked(prisma.citaMedica.findFirst).mockResolvedValue(null);

    await consultarCitaRepositorio("cita-ajena", "usuario-1");

    expect(prisma.citaMedica.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cita-ajena", ...accesoEmpresa },
      }),
    );
  });

  it("incluye el alcance empresarial en una cancelación", async () => {
    vi.mocked(prisma.citaMedica.updateMany).mockResolvedValue({ count: 1 });

    await cancelarCitaRepositorio("cita-ajena", "motivo", "usuario-1");

    expect(prisma.citaMedica.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "cita-ajena", ...accesoEmpresa }),
      }),
    );
  });
});
