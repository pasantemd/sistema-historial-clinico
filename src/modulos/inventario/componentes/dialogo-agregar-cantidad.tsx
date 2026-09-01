"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
import { agregarCantidadAccion } from "@/modulos/inventario/acciones/inventario.acciones";

export function DialogoAgregarCantidad({
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
      const resultado = await agregarCantidadAccion({
        medicamentoInventarioId: medicamentoId,
        cantidad: Number(cantidad),
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

  const cantidadNumero = Number(cantidad);
  const formularioInvalido =
    !Number.isFinite(cantidadNumero) || !Number.isInteger(cantidadNumero) || cantidadNumero <= 0 || motivo.trim().length < 3;

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
        <Button type="button" variant="default" size="sm" onClick={() => cambiarAbierto(true)} aria-label={`Añadir cantidad a ${nombre}`}>
          <Plus className="mr-1 size-4" />
          Añadir
        </Button>
      ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir cantidad</DialogTitle>
          <DialogDescription>Agregue stock al inventario.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{nombre}</p>
            <p className="text-muted-foreground">
              Disponible actualmente: {cantidadDisponible} {unidad}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Se añadirán {cantidad || "…"} {unidad} al inventario de {nombre}.
          </p>
          <label className="grid gap-1.5 text-sm font-medium">
            <EtiquetaCampo etiqueta="Cantidad a añadir" required />
            <Input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={pendiente}
            />
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
          <Button type="button" onClick={guardar} disabled={pendiente || formularioInvalido}>
            {!pendiente && <Plus aria-hidden />}
            {pendiente ? "Guardando…" : "Añadir cantidad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
