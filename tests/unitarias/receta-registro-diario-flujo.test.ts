import { describe, it, expect, vi, beforeEach } from "vitest";
import { buscarRecetaPorRegistroDiario } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { consultarRegistroDiario } from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { prisma } from "@/servicios/base-datos/prisma";

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    recetaMedica: {
      findFirst: vi.fn(),
    },
    registroDiarioAtencion: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Flujo de navegación y unicidad: Recetas desde Registro Diario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. buscarRecetaPorRegistroDiario consulta receta no anulada para el registro diario", async () => {
    const mockFindFirst = vi.mocked(prisma.recetaMedica.findFirst);
    mockFindFirst.mockResolvedValueOnce({
      id: "receta-123",
      numeroReceta: "REC-021",
      estado: "EMITIDA",
    } as never);

    const resultado = await buscarRecetaPorRegistroDiario("rd-999");
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        registroDiarioId: "rd-999",
        estado: { not: "ANULADA" },
      },
      select: {
        id: true,
        numeroReceta: true,
        estado: true,
      },
      orderBy: { creadoEn: "desc" },
    });
    expect(resultado).toEqual({
      id: "receta-123",
      numeroReceta: "REC-021",
      estado: "EMITIDA",
    });
  });

  it("2. consultarRegistroDiario mapea recetaAsociada cuando existe una receta no anulada", async () => {
    const mockFindRegistro = vi.mocked(prisma.registroDiarioAtencion.findFirst);
    mockFindRegistro.mockResolvedValueOnce({
      id: "rd-999",
      numeroRegistro: "RD-001",
      trabajadorId: "trab-1",
      empresaId: "emp-1",
      departamentoId: "dep-1",
      apellidosNombres: "Pérez Juan",
      cedula: "0912345678",
      fechaNacimiento: new Date("1990-01-01"),
      diaAtencion: new Date("2026-09-01"),
      atencionMorbilidad: "Cefalea",
      medicacion: null,
      procedimiento: null,
      firmaConfirmada: true,
      empresaNombreHistorico: "Empresa S.A.",
      departamentoNombreHistorico: "Planta",
      profesionalNombreHistorico: "Dr. Médico",
      estado: "BORRADOR",
      empresaRucHistorico: "0999999999001",
      observaciones: null,
      anuladoEn: null,
      motivoAnulacion: null,
      creadoEn: new Date("2026-09-01T10:00:00Z"),
      medicamentos: [],
      recetas: [
        {
          id: "rec-555",
          numeroReceta: "REC-021",
          estado: "EMITIDA",
        },
      ],
    } as never);

    const detalle = await consultarRegistroDiario("user-1", "rd-999");
    expect(detalle).not.toBeNull();
    expect(detalle?.recetaAsociada).toEqual({
      id: "rec-555",
      numeroReceta: "REC-021",
      estado: "EMITIDA",
    });
  });

  it("3. consultarRegistroDiario retorna recetaAsociada null si no hay recetas", async () => {
    const mockFindRegistro = vi.mocked(prisma.registroDiarioAtencion.findFirst);
    mockFindRegistro.mockResolvedValueOnce({
      id: "rd-999",
      numeroRegistro: "RD-001",
      trabajadorId: "trab-1",
      empresaId: "emp-1",
      departamentoId: "dep-1",
      apellidosNombres: "Pérez Juan",
      cedula: "0912345678",
      fechaNacimiento: new Date("1990-01-01"),
      diaAtencion: new Date("2026-09-01"),
      atencionMorbilidad: "Cefalea",
      medicacion: null,
      procedimiento: null,
      firmaConfirmada: true,
      empresaNombreHistorico: "Empresa S.A.",
      departamentoNombreHistorico: "Planta",
      profesionalNombreHistorico: "Dr. Médico",
      estado: "BORRADOR",
      empresaRucHistorico: "0999999999001",
      observaciones: null,
      anuladoEn: null,
      motivoAnulacion: null,
      creadoEn: new Date("2026-09-01T10:00:00Z"),
      medicamentos: [],
      recetas: [],
    } as never);

    const detalle = await consultarRegistroDiario("user-1", "rd-999");
    expect(detalle).not.toBeNull();
    expect(detalle?.recetaAsociada).toBeNull();
  });

  it("4. Regla de navegación: origen Registro Diario vs Directa", () => {
    const obtenerDestino = (registroDiarioId?: string | null) => ({
      rutaDestino: registroDiarioId ? `/registro-diario/${registroDiarioId}` : "/recetas",
      etiqueta: registroDiarioId ? "Volver al Registro Diario" : "Regresar",
    });

    const flujoRegistro = obtenerDestino("rd-123");
    expect(flujoRegistro.rutaDestino).toBe("/registro-diario/rd-123");
    expect(flujoRegistro.etiqueta).toBe("Volver al Registro Diario");

    const flujoDirecto = obtenerDestino(null);
    expect(flujoDirecto.rutaDestino).toBe("/recetas");
    expect(flujoDirecto.etiqueta).toBe("Regresar");
  });
});
