import { describe, expect, it, vi } from "vitest";

vi.mock("@/servicios/base-datos/prisma", () => ({ prisma: {} }));

import { StockInsuficienteError } from "@/modulos/inventario/errores";
import { registrarSalidaInventarioTx } from "@/modulos/inventario/repositorios/inventario.repositorio";

describe("salida concurrente de inventario", () => {
  it("descuenta con una condición atómica que impide stock negativo", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const tx = {
      medicamentoInventario: {
        updateMany,
        findUnique: vi.fn().mockResolvedValue({
          id: "medicamento-1",
          nombre: "Ibuprofeno",
          unidad: "TABLETAS",
          cantidadDisponible: 3,
        }),
      },
      movimientoInventario: { create: vi.fn().mockResolvedValue({ id: "movimiento-1" }) },
    };

    await registrarSalidaInventarioTx(
      tx as never,
      "medicamento-1",
      2,
      "Entrega clínica",
      "registro-1",
      "usuario-1",
    );

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ cantidadDisponible: { gte: 2 } }),
      data: expect.objectContaining({ cantidadDisponible: { decrement: 2 } }),
    }));
  });

  it("rechaza la segunda salida cuando otra transacción agotó el stock", async () => {
    const tx = {
      medicamentoInventario: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue({ estado: "ACTIVO", cantidadDisponible: 0 }),
      },
      movimientoInventario: { create: vi.fn() },
    };

    await expect(registrarSalidaInventarioTx(
      tx as never,
      "medicamento-1",
      1,
      "Entrega clínica",
      "registro-2",
      "usuario-2",
    )).rejects.toBeInstanceOf(StockInsuficienteError);
    expect(tx.movimientoInventario.create).not.toHaveBeenCalled();
  });
});
