import { describe, expect, it, vi, beforeEach } from "vitest";
import { normalizarMorbilidad } from "@/modulos/morbilidades/utilidades/normalizar-morbilidad";
import { asegurarMorbilidadEnCatalogo } from "@/modulos/morbilidades/repositorios/morbilidades.repositorio";
import { buscarMorbilidadesEnCatalogo } from "@/modulos/morbilidades/consultas/morbilidades.consulta";
import { prisma } from "@/servicios/base-datos/prisma";
import { Prisma } from "@/generated/prisma/client";

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

describe("Flujo Cruzado y Concurrencia de Morbilidad", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ESCENARIO 1: Registro diario guarda -> Evaluación médica busca", () => {
    it("permite que una morbilidad guardada desde Registro diario sea encontrada en Evaluaciones médicas con búsqueda parcial y sin tildes", async () => {
      // 1. Registro diario guarda "Dolor abdominal agudo"
      const textoIngresado = "Dolor abdominal agudo";
      const registroCreado = {
        id: "morb-1",
        nombre: textoIngresado,
        nombreNormalizado: normalizarMorbilidad(textoIngresado),
        activa: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };

      vi.mocked(prisma.morbilidad.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.morbilidad.create).mockResolvedValue(registroCreado);

      const guardado = await asegurarMorbilidadEnCatalogo(textoIngresado);
      expect(guardado).toEqual(registroCreado);

      // 2. Evaluación médica busca "dolor abd" o "DÓLOR ABD"
      vi.mocked(prisma.morbilidad.findMany).mockResolvedValue([registroCreado]);

      const resultadosBusqueda = await buscarMorbilidadesEnCatalogo("dólor abd");
      expect(resultadosBusqueda).toContain("Dolor abdominal agudo");
    });
  });

  describe("ESCENARIO 2: Evaluación médica guarda -> Registro diario busca", () => {
    it("permite que una morbilidad guardada desde Evaluaciones sea encontrada en Registro diario", async () => {
      // 1. Evaluación médica guarda "Cefalea tensional"
      const textoIngresado = "Cefalea tensional";
      const registroCreado = {
        id: "morb-2",
        nombre: textoIngresado,
        nombreNormalizado: normalizarMorbilidad(textoIngresado),
        activa: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };

      vi.mocked(prisma.morbilidad.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.morbilidad.create).mockResolvedValue(registroCreado);

      const guardado = await asegurarMorbilidadEnCatalogo(textoIngresado);
      expect(guardado).toEqual(registroCreado);

      // 2. Registro diario busca "cefa" o "CEFA"
      vi.mocked(prisma.morbilidad.findMany).mockResolvedValue([registroCreado]);

      const resultadosBusqueda = await buscarMorbilidadesEnCatalogo("cefa");
      expect(resultadosBusqueda).toContain("Cefalea tensional");
    });
  });

  describe("Concurrencia Anti-duplicados", () => {
    it("maneja colisiones P2002 de Prisma y devuelve el registro existente sin duplicar", async () => {
      const registroExistente = {
        id: "morb-1",
        nombre: "Dolor abdominal",
        nombreNormalizado: "dolor abdominal",
        activa: true,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };

      // Simula que la primera consulta no lo vio (findUnique -> null)
      // pero al crear da error de unicidad P2002 por una inserción concurrente simultánea
      vi.mocked(prisma.morbilidad.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(registroExistente);

      const errorP2002 = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`nombreNormalizado`)",
        {
          code: "P2002",
          clientVersion: "7.8.0",
        },
      );
      vi.mocked(prisma.morbilidad.create).mockRejectedValue(errorP2002);

      const resultado = await asegurarMorbilidadEnCatalogo("DOLOR ABDOMINAL");

      expect(prisma.morbilidad.create).toHaveBeenCalled();
      expect(resultado).toEqual(registroExistente);
    });
  });
});
