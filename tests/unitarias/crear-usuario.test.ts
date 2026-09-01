import { describe, expect, it } from "vitest";

import { crearUsuarioSchema } from "@/modulos/usuarios/validaciones/crear-usuario.schema";
import { crearClaveScrypt } from "@/servicios/seguridad/crear-clave-scrypt";
import { verificarClaveScrypt } from "@/servicios/seguridad/verificar-clave-scrypt";

describe("creación segura de usuarios", () => {
  it("normaliza el correo y exige al menos una empresa", () => {
    const base = {
      nombres: "Ana",
      apellidos: "Pérez",
      correo: "  ANA@EJEMPLO.COM ",
      contrasena: "clave-segura-123",
      rolId: "11111111-1111-4111-8111-111111111111",
      empresaIds: ["22222222-2222-4222-8222-222222222222"],
    };
    expect(crearUsuarioSchema.parse(base).correo).toBe("ana@ejemplo.com");
    expect(() => crearUsuarioSchema.parse({ ...base, empresaIds: [] })).toThrow();
  });

  it("crea un hash scrypt compatible con la autenticación", () => {
    const hash = crearClaveScrypt("clave-segura-123");
    expect(hash).not.toContain("clave-segura-123");
    expect(verificarClaveScrypt("clave-segura-123", hash)).toBe(true);
    expect(verificarClaveScrypt("incorrecta", hash)).toBe(false);
  });
});
