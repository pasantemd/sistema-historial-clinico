import { describe, expect, it } from "vitest";

import { GRAFICOS_REPORTE } from "@/modulos/reportes/configuracion/graficos-reporte";
import { generarReporteWord } from "@/modulos/reportes/servicios/generar-reporte-word";

const PNG_UN_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZsZcAAAAASUVORK5CYII=";

describe("Exportación selectiva de gráficos a Word", () => {
  it("mantiene un catálogo único y sin identificadores repetidos", () => {
    expect(GRAFICOS_REPORTE).toHaveLength(11);
    expect(new Set(GRAFICOS_REPORTE.map((grafico) => grafico.id)).size).toBe(
      GRAFICOS_REPORTE.length,
    );
  });

  it("genera un DOCX válido con los gráficos seleccionados", async () => {
    const contenido = await generarReporteWord({
      filtros: {
        periodo: "personalizado",
        fechaDesde: "2026-08-01",
        fechaHasta: "2026-08-31",
      },
      usuario: "Usuario de prueba",
      graficos: [
        { id: "registros-diarios-dia", imagenDataUrl: PNG_UN_PIXEL },
        { id: "medicamentos-entregados", imagenDataUrl: PNG_UN_PIXEL },
      ],
    });

    expect(contenido).toBeInstanceOf(Buffer);
    expect(contenido.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(contenido.length).toBeGreaterThan(1_000);
  });

  it("rechaza contenido que no sea una imagen PNG", async () => {
    await expect(
      generarReporteWord({
        filtros: { periodo: "semanal", fechaReferencia: "2026-08-28" },
        usuario: "Usuario de prueba",
        graficos: [
          {
            id: "registros-diarios-dia",
            imagenDataUrl: "data:image/png;base64,ZmFsc28=",
          },
        ],
      }),
    ).rejects.toThrow("imagen PNG válida");
  });
});
