import { beforeEach, describe, expect, it, vi } from "vitest";

import { signOut } from "next-auth/react";
import { registrarSolicitudCierreSesion } from "@/modulos/autenticacion/acciones/cerrar-sesion.accion";
import { cerrarSesionCliente } from "@/modulos/autenticacion/servicios/cerrar-sesion-cliente";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/modulos/autenticacion/acciones/cerrar-sesion.accion", () => ({
  registrarSolicitudCierreSesion: vi.fn(),
}));

describe("Cierre de sesión en cliente", () => {
  const replace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", { location: { replace } });
    vi.mocked(registrarSolicitudCierreSesion).mockResolvedValue(undefined);
    vi.mocked(signOut).mockResolvedValue({
      url: "http://127.0.0.1:3000/iniciar-sesion",
    } as never);
  });

  it("invalida la sesión con Auth.js antes de reemplazar el historial", async () => {
    await cerrarSesionCliente();

    expect(registrarSolicitudCierreSesion).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({
      callbackUrl: "/iniciar-sesion",
      redirect: false,
    });
    expect(replace).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/iniciar-sesion",
    );
    expect(vi.mocked(signOut).mock.invocationCallOrder[0]).toBeLessThan(
      replace.mock.invocationCallOrder[0],
    );
  });

  it("no permite que un fallo de auditoría impida cerrar la sesión", async () => {
    vi.mocked(registrarSolicitudCierreSesion).mockRejectedValueOnce(
      new Error("Auditoría no disponible"),
    );

    await cerrarSesionCliente();

    expect(signOut).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledOnce();
  });
});
