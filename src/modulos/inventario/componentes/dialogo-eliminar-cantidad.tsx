"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";
import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { eliminarCantidadAccion } from "@/modulos/inventario/acciones/inventario.acciones";

export function DialogoEliminarCantidad({
  medicamentoId,
  nombre,
  cantidadDisponible,
  unidad,
  children,
  abierto,
  alCambiarAbierto,
}: {
  medicamentoId: string;
  nombre: string;
  cantidadDisponible: string;
  unidad: string;
  children?: React.ReactNode;
  abierto?: boolean;
  alCambiarAbierto?: (abierto: boolean) => void;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const estaAbierto = abierto ?? abiertoInterno;
  const controlado = abierto !== undefined;

  const disponible = Number(cantidadDisponible);
  const cantidadNum = Number(cantidad) || 0;
  const excedeStock = cantidadNum > disponible;
  const formularioInvalido = !Number.isInteger(cantidadNum) || cantidadNum <= 0 || motivo.trim().length < 3 || excedeStock;

  function cambiarAbierto(siguiente: boolean) {
    if (!siguiente) {
      setCantidad("");
      setMotivo("");
      setError("");
    }
    if (!controlado) setAbiertoInterno(siguiente);
    alCambiarAbierto?.(siguiente);
  }

  function guardar() {
    setError("");
    iniciar(async () => {
      const resultado = await eliminarCantidadAccion({
        medicamentoInventarioId: medicamentoId,
        cantidad: cantidadNum,
        motivo,
      });
      if (!resultado.exito) {
        setError(Object.values(resultado.erroresCampos ?? {}).flat()[0] ?? resultado.mensaje);
        return;
      }
      cambiarAbierto(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={estaAbierto} onOpenChange={cambiarAbierto}>
      {!controlado && (children ? (
        <button
          type="button"
          className="contents cursor-pointer text-left"
          onClick={() => cambiarAbierto(true)}
        >
          {children}
        </button>
      ) : (
        <Button type="button" variant="destructive" size="sm" onClick={() => cambiarAbierto(true)} aria-label={`Retirar existencias de ${nombre}`}>
          <Minus className="mr-1 size-4" />
          Retirar
        </Button>
      ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar existencias</DialogTitle>
          <DialogDescription>Registre la salida sin eliminar el historial del medicamento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{nombre}</p>
            <p className="text-muted-foreground">
              Disponible actualmente: {cantidadDisponible} {unidad}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Se retirarán {cantidad || "…"} {unidad} del inventario de {nombre}.
          </p>
          <label className="grid gap-1.5 text-sm font-medium">
            <EtiquetaCampo etiqueta="Cantidad a retirar" required />
            <Input
              type="number"
              min="1"
              max={disponible}
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={pendiente}
            />
            {excedeStock && (
              <span className="text-xs text-destructive">
                No hay existencias suficientes para retirar esa cantidad.
              </span>
            )}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            <EtiquetaCampo etiqueta="Motivo" required />
            <Textarea
              className="min-h-11"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={pendiente}
            />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)} disabled={pendiente}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={guardar} disabled={pendiente || formularioInvalido}>
            {pendiente ? "Guardando…" : "Retirar existencias"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
