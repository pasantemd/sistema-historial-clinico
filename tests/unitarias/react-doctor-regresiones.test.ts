import { describe, expect, it } from "vitest";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

describe("Regresiones y Calidad React Doctor", () => {
  describe("Formateador de Fecha Hoisted", () => {
    it("formatea correctamente una fecha válida en formato civil ecuatoriano (UTC)", () => {
      const fecha = "2026-08-31T00:00:00.000Z";
      expect(formatearFecha(fecha)).toBe("31/08/2026");
    });

    it("maneja valores nulos o indefinidos sin lanzar excepción", () => {
      expect(formatearFecha(null)).toBe("Sin fecha registrada");
      expect(formatearFecha(undefined)).toBe("Sin fecha registrada");
      expect(formatearFecha("")).toBe("Sin fecha registrada");
    });

    it("maneja fechas inválidas retornando mensaje seguro", () => {
      expect(formatearFecha("fecha-invalida")).toBe("Fecha inválida");
    });
  });
});
