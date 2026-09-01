import { describe, expect, it } from "vitest";

import { validarEntornoDatos } from "../../scripts/validar-entorno-datos";

describe("protección de scripts que escriben datos", () => {
  it("bloquea la ejecución en producción", () => {
    expect(() =>
      validarEntornoDatos({
        nodeEnv: "production",
        databaseUrl: "postgresql://usuario:clave@db.example.com:5432/clinica",
      }),
    ).toThrow(/producción/i);
  });

  it("bloquea una carga de prueba contra un host remoto", () => {
    expect(() =>
      validarEntornoDatos({
        nodeEnv: "development",
        databaseUrl: "postgresql://usuario:clave@db.example.com:5432/clinica",
        exigirBaseLocal: true,
      }),
    ).toThrow(/local/i);
  });

  it("permite una base local de desarrollo", () => {
    expect(() =>
      validarEntornoDatos({
        nodeEnv: "development",
        databaseUrl: "postgresql://usuario:clave@localhost:5432/clinica",
        exigirBaseLocal: true,
      }),
    ).not.toThrow();
  });
});
