"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { cambiarEstadoInventarioAccion } from "@/modulos/inventario/acciones/inventario.acciones";

interface Props {
  medicamentoId: string;
  nombre: string;
  activar: boolean;
  abierto?: boolean;
  alCambiarAbierto?: (abierto: boolean) => void;
  children?: React.ReactNode;
}

export function DialogoCambiarEstadoInventario({
  medicamentoId,
  nombre,
  activar,
  abierto,
  alCambiarAbierto,
  children,
}: Props) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState("");
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const estaAbierto = abierto ?? abiertoInterno;
  const controlado = abierto !== undefined;

  function cambiarAbierto(siguiente: boolean) {
    if (!siguiente) setError("");
    if (!controlado) setAbiertoInterno(siguiente);
    alCambiarAbierto?.(siguiente);
  }

  function confirmar() {
    setError("");
    iniciarTransicion(async () => {
      const resultado = await cambiarEstadoInventarioAccion({ id: medicamentoId, activar });
      if (!resultado.exito) {
        setError(resultado.mensaje);
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
        <Button
          type="button"
          variant={activar ? "outline" : "destructive"}
          size="sm"
          onClick={() => cambiarAbierto(true)}
        >
          <Power className="size-4" />
          {activar ? "Activar" : "Desactivar"}
        </Button>
      ))}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activar ? "Activar medicamento" : "Desactivar medicamento"}</DialogTitle>
          <DialogDescription>
            {activar
              ? `¿Desea habilitar nuevamente ${nombre} para movimientos de inventario?`
              : `¿Desea desactivar ${nombre}? Se conservarán sus existencias y todo el historial.`}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => cambiarAbierto(false)} disabled={pendiente}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={activar ? "default" : "destructive"}
            onClick={confirmar}
            disabled={pendiente}
          >
            {pendiente ? "Guardando…" : `${activar ? "Activar" : "Desactivar"} medicamento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
