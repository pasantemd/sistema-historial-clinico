import { beforeEach, describe, expect, it, vi } from "vitest";

import { buscarEmpresasAccion } from "@/modulos/empresas/acciones/buscar-empresas.accion";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/autenticacion/requerir-permiso", () => ({
  requerirPermiso: vi.fn(),
}));

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    empresa: {
      findMany: vi.fn(),
    },
  },
}));

describe("buscarEmpresasAccion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requerirPermiso).mockResolvedValue({
      id: "usuario-autorizado",
      nombres: "Usuario",
      apellidos: "Prueba",
      correo: "usuario@prueba.local",
      roles: [],
      permisos: ["empresa.ver"],
    });
    vi.mocked(prisma.empresa.findMany).mockResolvedValue([]);
  });

  it("limita los resultados a empresas asignadas al usuario autenticado", async () => {
    await buscarEmpresasAccion("Apracom");

    expect(prisma.empresa.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          usuariosAutorizados: {
            some: { usuarioId: "usuario-autorizado" },
          },
        }),
      }),
    );
  });

  it("no consulta la base cuando el texto tiene menos de dos caracteres", async () => {
    await expect(buscarEmpresasAccion("a")).resolves.toEqual([]);
    expect(prisma.empresa.findMany).not.toHaveBeenCalled();
  });
});
