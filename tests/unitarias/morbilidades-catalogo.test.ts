import { describe, expect, it, vi, beforeEach } from "vitest";
import { asegurarMorbilidadEnCatalogo } from "@/modulos/morbilidades/repositorios/morbilidades.repositorio";
import { buscarMorbilidadesEnCatalogo } from "@/modulos/morbilidades/consultas/morbilidades.consulta";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    morbilidad: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Catálogo de Morbilidades - Lógica Unificada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("asegurarMorbilidadEnCatalogo", () => {
    it("retorna null si el nombre es nulo o vacío", async () => {
      const res = await asegurarMorbilidadEnCatalogo("");
      expect(res).toBeNull();
      expect(prisma.morbilidad.findUnique).not.toHaveBeenCalled();
    });

    it("retorna morbilidad existente sin duplicar si ya existe en catálogo", async () => {
      const mockExistente = {
        id: "1",
        nombre: "Dolor abdominal",
        nombreNormalizado: "dolor abdominal",
        activa: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };
      vi.mocked(prisma.morbilidad.findUnique).mockResolvedValue(mockExistente);

      const resultado = await asegurarMorbilidadEnCatalogo("DOLOR ABDOMINAL");

      expect(prisma.morbilidad.findUnique).toHaveBeenCalledWith({
        where: { nombreNormalizado: "dolor abdominal" },
      });
      expect(prisma.morbilidad.create).not.toHaveBeenCalled();
      expect(resultado).toEqual(mockExistente);
    });

    it("reactiva la morbilidad si existía inactiva", async () => {
      const mockInactivo = {
        id: "1",
        nombre: "Dolor abdominal",
        nombreNormalizado: "dolor abdominal",
        activa: false,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };
      vi.mocked(prisma.morbilidad.findUnique).mockResolvedValue(mockInactivo);
      vi.mocked(prisma.morbilidad.update).mockResolvedValue({
        ...mockInactivo,
        activa: true,
      });

      const resultado = await asegurarMorbilidadEnCatalogo("Dolor abdominal");

      expect(prisma.morbilidad.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { activa: true },
      });
      expect(resultado?.activa).toBe(true);
    });

    it("crea la morbilidad con nombre y nombreNormalizado si no existe", async () => {
      vi.mocked(prisma.morbilidad.findUnique).mockResolvedValue(null);
      const mockCreado = {
        id: "2",
        nombre: "Cefalea tensional",
        nombreNormalizado: "cefalea tensional",
        activa: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };
      vi.mocked(prisma.morbilidad.create).mockResolvedValue(mockCreado);

      const resultado = await asegurarMorbilidadEnCatalogo("  Cefalea tensional  ");

      expect(prisma.morbilidad.create).toHaveBeenCalledWith({
        data: {
          nombre: "Cefalea tensional",
          nombreNormalizado: "cefalea tensional",
          activa: true,
        },
      });
      expect(resultado).toEqual(mockCreado);
    });
  });

  describe("buscarMorbilidadesEnCatalogo", () => {
    it("retorna lista vacía si el término tiene menos de 2 caracteres", async () => {
      const res = await buscarMorbilidadesEnCatalogo("a");
      expect(res).toEqual([]);
      expect(prisma.morbilidad.findMany).not.toHaveBeenCalled();
    });

    it("busca case-insensitive y accent-insensitive usando tokens", async () => {
      vi.mocked(prisma.morbilidad.findMany).mockResolvedValue([
        {
          id: "1",
          nombre: "Dolor abdominal difuso",
          nombreNormalizado: "dolor abdominal difuso",
          activa: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        {
          id: "2",
          nombre: "Dolor abdominal agudo",
          nombreNormalizado: "dolor abdominal agudo",
          activa: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
      ]);

      const resultados = await buscarMorbilidadesEnCatalogo("DÓLOR ABD");

      expect(prisma.morbilidad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            activa: true,
            AND: [
              { nombreNormalizado: { contains: "dolor" } },
              { nombreNormalizado: { contains: "abd" } },
            ],
          },
        }),
      );
      expect(resultados).toHaveLength(2);
      expect(resultados).toContain("Dolor abdominal agudo");
      expect(resultados).toContain("Dolor abdominal difuso");
    });

    it("ordena por relevancia: coincidencia exacta y prefijos primero", async () => {
      vi.mocked(prisma.morbilidad.findMany).mockResolvedValue([
        {
          id: "3",
          nombre: "Cólico con dolor abdominal",
          nombreNormalizado: "colico con dolor abdominal",
          activa: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        {
          id: "1",
          nombre: "Dolor abdominal",
          nombreNormalizado: "dolor abdominal",
          activa: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
        {
          id: "2",
          nombre: "Dolor abdominal agudo",
          nombreNormalizado: "dolor abdominal agudo",
          activa: true,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
        },
      ]);

      const resultados = await buscarMorbilidadesEnCatalogo("dolor");

      expect(resultados[0]).toBe("Dolor abdominal");
      expect(resultados[1]).toBe("Dolor abdominal agudo");
      expect(resultados[2]).toBe("Cólico con dolor abdominal");
    });
  });
});
