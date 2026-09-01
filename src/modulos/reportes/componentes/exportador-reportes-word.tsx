"use client";

import { useMemo, useState } from "react";
import { CheckCheck, FileDown, LoaderCircle } from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/componentes/ui/button";
import { Checkbox } from "@/componentes/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import {
  GRAFICOS_REPORTE,
  type IdGraficoReporte,
} from "@/modulos/reportes/configuracion/graficos-reporte";
import type { FiltrosReportes } from "@/modulos/reportes/tipos";

interface PropiedadesExportadorReportesWord {
  filtros: FiltrosReportes;
}

function nombreDescarga(cabecera: string | null): string {
  const coincidencia = cabecera?.match(/filename="?([^";]+)"?/i);
  return coincidencia?.[1] ?? "reporte-graficos.docx";
}

export function ExportadorReportesWord({
  filtros,
}: PropiedadesExportadorReportesWord) {
  const todosLosIds = useMemo(
    () => GRAFICOS_REPORTE.map((grafico) => grafico.id),
    [],
  );
  const [abierto, setAbierto] = useState(false);
  const [seleccionados, setSeleccionados] = useState<IdGraficoReporte[]>(todosLosIds);
  const [exportando, setExportando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  function alternarGrafico(id: IdGraficoReporte, seleccionado: boolean) {
    setSeleccionados((actuales) =>
      seleccionado
        ? [...new Set([...actuales, id])]
        : actuales.filter((actual) => actual !== id),
    );
    setMensaje("");
  }

  async function exportar() {
    if (seleccionados.length === 0) {
      setMensaje("Seleccione al menos un gráfico para exportar.");
      return;
    }

    setExportando(true);
    setMensaje("");

    try {
      const graficos = [];
      for (const id of seleccionados) {
        const elemento = document.querySelector<HTMLElement>(
          `[data-grafico-reporte="${id}"]`,
        );
        if (!elemento) {
          throw new Error(`No se encontró el gráfico ${id}.`);
        }

        const fondo = getComputedStyle(elemento).backgroundColor;
        const imagenDataUrl = await toPng(elemento, {
          backgroundColor: fondo === "rgba(0, 0, 0, 0)" ? undefined : fondo,
          cacheBust: true,
          pixelRatio: 2,
        });
        graficos.push({ id, imagenDataUrl });
      }

      const respuesta = await fetch("/api/reportes/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filtros, graficos }),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(detalle || "No fue posible generar el documento Word.");
      }

      const contenido = await respuesta.blob();
      const url = URL.createObjectURL(contenido);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreDescarga(respuesta.headers.get("Content-Disposition"));
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setAbierto(false);
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No fue posible generar el documento Word.",
      );
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setAbierto(true)}>
        <FileDown className="size-4" aria-hidden />
        Exportar a Word
      </Button>

      <Dialog open={abierto} onOpenChange={(valor) => !exportando && setAbierto(valor)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Elegir gráficos para el reporte Word</DialogTitle>
            <DialogDescription>
              El documento conservará la apariencia actual de cada gráfico y aplicará los filtros visibles.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2">
            <p className="text-sm font-medium tabular-nums">
              {seleccionados.length} de {GRAFICOS_REPORTE.length} seleccionados
            </p>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSeleccionados(todosLosIds)}
                disabled={exportando}
              >
                <CheckCheck className="size-4" aria-hidden />
                Seleccionar todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSeleccionados([])}
                disabled={exportando}
              >
                Quitar todos
              </Button>
            </div>
          </div>

          <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {GRAFICOS_REPORTE.map((grafico) => {
              const seleccionado = seleccionados.includes(grafico.id);
              return (
                <label
                  key={grafico.id}
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/30"
                >
                  <Checkbox
                    checked={seleccionado}
                    disabled={exportando}
                    onCheckedChange={(valor) => alternarGrafico(grafico.id, valor)}
                    aria-label={`Incluir ${grafico.titulo}`}
                  />
                  <span className="text-sm font-medium leading-snug">{grafico.titulo}</span>
                </label>
              );
            })}
          </div>

          {mensaje && (
            <p className="text-sm text-destructive" role="alert">
              {mensaje}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAbierto(false)}
              disabled={exportando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={exportar}
              disabled={exportando || seleccionados.length === 0}
            >
              {exportando ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileDown className="size-4" aria-hidden />
              )}
              {exportando ? "Generando Word…" : "Exportar Word"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
