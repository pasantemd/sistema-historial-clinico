"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Send, Ban } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { BotonVerImprimirPdf } from "@/componentes/documentos/boton-ver-imprimir-pdf";
import { Textarea } from "@/componentes/ui/textarea";
import { buttonVariants } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";
import type { RecetaDetalleDto } from "@/modulos/recetas/tipos";
import {
  emitirRecetaAccion,
  anularRecetaAccion,
} from "@/modulos/recetas/acciones/recetas.acciones";

interface Props {
  receta: RecetaDetalleDto;
  puedeEmitir: boolean;
  puedeAnular: boolean;
  puedeEditar: boolean;
  puedeExportar: boolean;
  tieneConflictoAlergia: boolean;
}

export function AccionesReceta({
  receta,
  puedeEmitir,
  puedeAnular,
  puedeEditar,
  puedeExportar,
  tieneConflictoAlergia,
}: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [confirmada, setConfirmada] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [error, setError] = useState<string>();
  const esBorrador = receta.estado === "BORRADOR";
  const esAnulada = receta.estado === "ANULADA";
  const rutaDestino = receta.registroDiarioId
    ? `/registro-diario/${receta.registroDiarioId}`
    : "/recetas";
  const etiquetaRegresar = receta.registroDiarioId
    ? "Volver al Registro Diario"
    : "Regresar";

  function emitir() {
    setError(undefined);
    if (tieneConflictoAlergia && !mostrarConfirmacion) {
      setMostrarConfirmacion(true);
      return;
    }
    if (tieneConflictoAlergia && (!confirmada || !justificacion.trim())) {
      setError("Confirme la alerta y escriba la justificación clínica.");
      return;
    }
    iniciar(async () => {
      const respuesta = await emitirRecetaAccion(
        receta.id,
        confirmada,
        justificacion,
      );
      if (!respuesta.exito) {
        setError(respuesta.mensaje);
        return;
      }
      router.refresh();
    });
  }

  async function anular() {
    const motivo = window.prompt("Motivo de anulación de la receta:");
    if (!motivo || !motivo.trim()) return;
    iniciar(async () => {
      const respuesta = await anularRecetaAccion(receta.id, motivo.trim());
      if (!respuesta.exito) {
        alert(respuesta.mensaje);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 print:hidden">
      {mostrarConfirmacion && tieneConflictoAlergia && (
        <div role="alert" className="max-w-xl space-y-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive">
            La receta coincide con una alergia activa. La emisión requiere confirmación y justificación clínica.
          </p>
          <label className="flex min-h-11 items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={confirmada}
              onChange={(evento) => setConfirmada(evento.target.checked)}
            />
            Confirmo que revisé la alergia
          </label>
          <Textarea
            aria-label="Justificación clínica"
            placeholder="Justificación clínica obligatoria"
            value={justificacion}
            onChange={(evento) => setJustificacion(evento.target.value)}
          />
        </div>
      )}
      <BotonRegresar
        rutaDirecta={rutaDestino}
        rutaRespaldo={rutaDestino}
        etiqueta={etiquetaRegresar}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {puedeExportar && (
          <BotonVerImprimirPdf
            href={`/api/recetas/${receta.id}/pdf`}
          />
        )}
      {puedeEditar && esBorrador && (
        <Link href={`/recetas/${receta.id}/editar`} className={cn(buttonVariants({ variant: "outline" }))}>
          <Pencil aria-hidden /> Editar borrador
        </Link>
      )}
      {puedeEmitir && esBorrador && (
        <Button type="button" onClick={emitir} disabled={pendiente}>
          <Send aria-hidden /> Emitir receta
        </Button>
      )}
      {puedeAnular && !esAnulada && (
        <Button type="button" variant="destructive" onClick={anular} disabled={pendiente}>
          <Ban aria-hidden /> Anular
        </Button>
      )}
      </div>
    </div>
  );
}
