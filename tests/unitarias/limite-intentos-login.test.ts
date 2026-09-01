import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("@/servicios/base-datos/prisma", () => ({ prisma: {} }));

import { crearClaveLimiteInicioSesion } from "@/modulos/autenticacion/servicios/limite-intentos-inicio-sesion";

describe("límite de intentos de inicio de sesión", () => {
  it("normaliza el correo y separa los intentos por dirección IP", () => {
    const clave = crearClaveLimiteInicioSesion("  MEDICO@EJEMPLO.COM ", "10.0.0.1");
    expect(clave).toHaveLength(64);
    expect(clave).toBe(crearClaveLimiteInicioSesion("medico@ejemplo.com", "10.0.0.1"));
    expect(clave).not.toBe(crearClaveLimiteInicioSesion("medico@ejemplo.com", "10.0.0.2"));
    expect(clave).not.toContain("medico@ejemplo.com");
  });
});
