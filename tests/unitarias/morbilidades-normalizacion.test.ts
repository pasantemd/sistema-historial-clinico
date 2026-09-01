import { describe, expect, it } from "vitest";
import {
  normalizarMorbilidad,
  tokenizarMorbilidad,
} from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";

describe("Normalización de Morbilidades", () => {
  it("normaliza texto con mayúsculas y minúsculas", () => {
    expect(normalizarMorbilidad("Dolor Abdominal")).toBe("dolor abdominal");
    expect(normalizarMorbilidad("DOLOR ABDOMINAL")).toBe("dolor abdominal");
    expect(normalizarMorbilidad("dolor abdominal")).toBe("dolor abdominal");
  });

  it("elimina diacríticos, tildes y caracteres especiales normalizables", () => {
    expect(normalizarMorbilidad("Infección Respiratoria Aguda")).toBe(
      "infeccion respiratoria aguda",
    );
    expect(normalizarMorbilidad("Cefaléa Tensiónal")).toBe("cefalea tensional");
    expect(normalizarMorbilidad("Laringofaringítis")).toBe("laringofaringitis");
  });

  it("colapsa espacios en blanco excesivos y hace trim", () => {
    expect(normalizarMorbilidad("   Dolor   lumbar   agudo   ")).toBe(
      "dolor lumbar agudo",
    );
    expect(normalizarMorbilidad("\n\tDolor de   cabeza\t")).toBe("dolor de cabeza");
  });

  it("maneja correctamente valores nulos, indefinidos o vacíos", () => {
    expect(normalizarMorbilidad("")).toBe("");
    expect(normalizarMorbilidad(null)).toBe("");
    expect(normalizarMorbilidad(undefined)).toBe("");
    expect(normalizarMorbilidad("   ")).toBe("");
  });

  it("tokeniza términos de búsqueda en palabras no vacías", () => {
    expect(tokenizarMorbilidad("dolor abdominal")).toEqual([
      "dolor",
      "abdominal",
    ]);
    expect(tokenizarMorbilidad("   dol   abd   ")).toEqual(["dol", "abd"]);
    expect(tokenizarMorbilidad("")).toEqual([]);
    expect(tokenizarMorbilidad("   ")).toEqual([]);
  });

  it("permite coincidencias para las consultas solicitadas en los requerimientos", () => {
    const morbilidadCatalogo = normalizarMorbilidad("Dolor abdominal");

    const busquedasCoincidentes = [
      "dolor",
      "Dolor",
      "DOLOR",
      "dol",
      "dolor abd",
      "abdominal",
      "ABDOMINAL",
      "dolor abdominal",
    ];

    for (const consulta of busquedasCoincidentes) {
      const tokens = tokenizarMorbilidad(consulta);
      const coincide = tokens.every((token) =>
        morbilidadCatalogo.includes(token),
      );
      expect(coincide).toBe(true);
    }
  });

  it("coincide 'gastr' con 'Gastritis' y 'Gastroenteritis'", () => {
    const gastritis = normalizarMorbilidad("Gastritis aguda");
    const gastroenteritis = normalizarMorbilidad("Gastroenteritis aguda");

    const tokens = tokenizarMorbilidad("gastr");
    expect(tokens.every((t) => gastritis.includes(t))).toBe(true);
    expect(tokens.every((t) => gastroenteritis.includes(t))).toBe(true);
  });
});
