import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buscarTrabajadorParaNuevoVinculo,
  usuarioPuedeAccederEmpresaTrabajadores,
} from "@/modulos/trabajadores/repositorios/trabajadores.repositorio";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    usuarioEmpresa: { findFirst: vi.fn() },
    trabajador: { findFirst: vi.fn() },
  },
}));

describe("aislamiento multiempresa de trabajadores", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valida el acceso mediante la asociación UsuarioEmpresa", async () => {
    vi.mocked(prisma.usuarioEmpresa.findFirst).mockResolvedValue(null);

    await expect(
      usuarioPuedeAccederEmpresaTrabajadores("usuario-1", "empresa-2"),
    ).resolves.toBe(false);

    expect(prisma.usuarioEmpresa.findFirst).toHaveBeenCalledWith({
      where: {
        usuarioId: "usuario-1",
        empresaId: "empresa-2",
        usuario: { estado: "ACTIVO" },
        empresa: { estado: "ACTIVO" },
      },
      select: { usuarioId: true },
    });
  });

  it("solo encuentra el trabajador si su empresa actual está autorizada", async () => {
    vi.mocked(prisma.trabajador.findFirst).mockResolvedValue(null);

    await buscarTrabajadorParaNuevoVinculo("trabajador-ajeno", "usuario-1");

    expect(prisma.trabajador.findFirst).toHaveBeenCalledWith({
      where: {
        id: "trabajador-ajeno",
        empresa: {
          estado: "ACTIVO",
          usuariosAutorizados: { some: { usuarioId: "usuario-1" } },
        },
      },
      select: { id: true },
    });
  });
});
