import { beforeEach, describe, expect, it, vi } from "vitest";

import { consultarTrabajadores } from "@/modulos/trabajadores/consultas/trabajadores.consulta";

const mockTrabajadorCount = vi.fn();
const mockTrabajadorFindMany = vi.fn();
const mockAsignacionLaboralCount = vi.fn();
const mockAsignacionLaboralFindMany = vi.fn();

vi.mock("@/servicios/base-datos/prisma", () => ({
  prisma: {
    trabajador: {
      count: (...args: unknown[]) => mockTrabajadorCount(...args),
      findMany: (...args: unknown[]) => mockTrabajadorFindMany(...args),
    },
    asignacionLaboral: {
      count: (...args: unknown[]) => mockAsignacionLaboralCount(...args),
      findMany: (...args: unknown[]) => mockAsignacionLaboralFindMany(...args),
    },
  },
}));

describe("consultarTrabajadores - unicidad y adscripción actual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrabajadorCount.mockReset();
    mockTrabajadorFindMany.mockReset();
    mockAsignacionLaboralCount.mockReset();
    mockAsignacionLaboralFindMany.mockReset();
  });

  it("devuelve exactamente 1 fila por trabajador aunque tenga múltiples vínculos históricos", async () => {
    // Simula un trabajador (Steeven Martínez) que tiene 2 vínculos históricos en la base (Tradetek inactivo y Apracom activo)
    mockTrabajadorCount.mockResolvedValue(1);
    mockTrabajadorFindMany.mockResolvedValue([
      {
        id: "trabajador-steeven",
        numeroDocumento: "0959281981",
        nombres: "Steeven Ariel",
        apellidos: "Martínez Campos",
        estadoLaboral: "ACTIVO",
        empresa: { razonSocial: "APRACOM" },
        departamento: { nombre: "INVESTIGACIÓN Y DESARROLLO" },
        asignacionesLaborales: [{ id: "vinculo-apracom-activo" }],
      },
    ]);

    const resultado = await consultarTrabajadores("usuario-1", {
      pagina: 1,
      tamanoPagina: 10,
    });

    // Debe consultar sobre prisma.trabajador, no sobre asignacionLaboral
    expect(mockTrabajadorCount).toHaveBeenCalledTimes(1);
    expect(mockTrabajadorFindMany).toHaveBeenCalledTimes(1);
    expect(mockAsignacionLaboralFindMany).not.toHaveBeenCalled();

    // Debe retornar exactamente 1 elemento en la lista
    expect(resultado.trabajadores).toHaveLength(1);
    expect(resultado.total).toBe(1);
    expect(resultado.trabajadores[0]).toEqual({
      vinculoId: "vinculo-apracom-activo",
      trabajadorId: "trabajador-steeven",
      empresa: "APRACOM",
      departamento: "INVESTIGACIÓN Y DESARROLLO",
      nombreCompleto: "Martínez Campos Steeven Ariel",
      numeroDocumento: "0959281981",
      estadoLaboral: "ACTIVO",
    });
  });

  it("muestra la empresa y departamento actual cuando hay 3 cambios históricos", async () => {
    mockTrabajadorCount.mockResolvedValue(1);
    mockTrabajadorFindMany.mockResolvedValue([
      {
        id: "trabajador-carlos",
        numeroDocumento: "9900000001",
        nombres: "Carlos",
        apellidos: "Mendoza",
        estadoLaboral: "ACTIVO",
        empresa: { razonSocial: "EMPRESA C" },
        departamento: { nombre: "GERENCIA" },
        asignacionesLaborales: [{ id: "vinculo-c-activo" }],
      },
    ]);

    const resultado = await consultarTrabajadores("usuario-1", {
      pagina: 1,
      tamanoPagina: 10,
    });

    expect(resultado.trabajadores).toHaveLength(1);
    expect(resultado.trabajadores[0].empresa).toBe("EMPRESA C");
    expect(resultado.trabajadores[0].departamento).toBe("GERENCIA");
    expect(resultado.total).toBe(1);
  });

  it("aplica filtros de empresa y departamento a la adscripción actual del trabajador con aislamiento", async () => {
    mockTrabajadorCount.mockResolvedValue(0);
    mockTrabajadorFindMany.mockResolvedValue([]);

    await consultarTrabajadores("usuario-1", {
      empresaId: "empresa-apracom-id",
      departamentoId: "depto-id-investigacion",
      pagina: 1,
      tamanoPagina: 25,
    });

    expect(mockTrabajadorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: "empresa-apracom-id",
          departamentoId: "depto-id-investigacion",
          empresa: {
            estado: "ACTIVO",
            usuariosAutorizados: { some: { usuarioId: "usuario-1" } },
          },
        }),
        skip: 0,
        take: 25,
      }),
    );
  });

  it("mapea los filtros de estado (ACTIVO, SUSPENDIDO, FINALIZADO) al estadoLaboral del trabajador", async () => {
    mockTrabajadorCount.mockResolvedValue(0);
    mockTrabajadorFindMany.mockResolvedValue([]);

    // Filtro ACTIVO
    await consultarTrabajadores("usuario-1", {
      estado: "ACTIVO",
      pagina: 1,
      tamanoPagina: 10,
    });
    expect(mockTrabajadorFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estadoLaboral: "ACTIVO" }),
      }),
    );

    // Filtro SUSPENDIDO
    await consultarTrabajadores("usuario-1", {
      estado: "SUSPENDIDO",
      pagina: 1,
      tamanoPagina: 10,
    });
    expect(mockTrabajadorFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estadoLaboral: "SUSPENDIDO" }),
      }),
    );

    // Filtro FINALIZADO (corresponde a INACTIVO o RETIRADO)
    await consultarTrabajadores("usuario-1", {
      estado: "FINALIZADO",
      pagina: 1,
      tamanoPagina: 10,
    });
    expect(mockTrabajadorFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estadoLaboral: { in: ["INACTIVO", "RETIRADO"] },
        }),
      }),
    );
  });

  it("construye la búsqueda textual sobre documento, nombres, apellidos, empresa actual y departamento actual", async () => {
    mockTrabajadorCount.mockResolvedValue(0);
    mockTrabajadorFindMany.mockResolvedValue([]);

    await consultarTrabajadores("usuario-1", {
      busqueda: "Steeven 0959281981 APRACOM",
      pagina: 1,
      tamanoPagina: 10,
    });

    expect(mockTrabajadorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { numeroDocumento: { contains: "Steeven 0959281981 APRACOM", mode: "insensitive" } },
            { nombres: { contains: "Steeven 0959281981 APRACOM", mode: "insensitive" } },
            { apellidos: { contains: "Steeven 0959281981 APRACOM", mode: "insensitive" } },
            { empresa: { razonSocial: { contains: "Steeven 0959281981 APRACOM", mode: "insensitive" } } },
            { departamento: { nombre: { contains: "Steeven 0959281981 APRACOM", mode: "insensitive" } } },
          ]),
        }),
      }),
    );
  });
});
