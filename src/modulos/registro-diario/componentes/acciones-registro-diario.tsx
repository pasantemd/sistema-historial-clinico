"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreVertical, Plus, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/componentes/ui/button";
import { anularRegistroDiarioAccion } from "@/modulos/registro-diario/acciones/registro-diario.acciones";
import { cn } from "@/utilidades/clases";

export function BotonAnularRegistro({ id }: { id: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState("");

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="destructive"
        disabled={pendiente}
        onClick={() => {
          const motivo = window.prompt("Motivo de anulación");
          if (!motivo) return;
          iniciar(async () => {
            const resultado = await anularRegistroDiarioAccion(id, { motivo });
            if (!resultado.exito) {
              setMensaje(resultado.mensaje ?? "No se pudo anular.");
            } else {
              router.refresh();
            }
          });
        }}
      >
        Anular
      </Button>
      {mensaje && <span role="alert" className="text-sm text-destructive">{mensaje}</span>}
    </div>
  );
}

interface MenuAccionesRegistroDiarioProps {
  id: string;
  trabajadorId: string;
  puedeAnular: boolean;
  estaAnulado: boolean;
}

export function MenuAccionesRegistroDiario({
  id,
  trabajadorId,
  puedeAnular,
  estaAnulado,
}: MenuAccionesRegistroDiarioProps) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState("");
  const origen = `trabajadorId=${trabajadorId}&registroDiarioId=${id}`;

  const anular = () => {
    const motivo = window.prompt("Motivo de anulación");
    if (!motivo) return;

    iniciar(async () => {
      const resultado = await anularRegistroDiarioAccion(id, { motivo });
      if (!resultado.exito) {
        setMensaje(resultado.mensaje ?? "No se pudo anular.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="group/acciones relative flex items-center justify-end gap-1">
      <button
        type="button"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label="Más acciones"
        aria-haspopup="menu"
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
      <div
        role="menu"
        className={cn(
          "absolute right-0 top-10 z-50 hidden w-56 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
          "group-focus-within/acciones:block group-hover/acciones:block",
        )}
      >
        <Link
          role="menuitem"
          href={`/evaluaciones-medicas/nueva?${origen}`}
          className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Plus className="size-4" aria-hidden /> Crear evaluación
        </Link>
        <Link
          role="menuitem"
          href={`/fichas-ocupacionales/nueva?${origen}`}
          className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Plus className="size-4" aria-hidden /> Crear ficha
        </Link>
        <Link
          role="menuitem"
          href={`/recetas/nueva?${origen}`}
          className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Plus className="size-4" aria-hidden /> Crear receta
        </Link>
        {puedeAnular && !estaAnulado && (
          <>
            <div className="-mx-1 my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              disabled={pendiente}
              onClick={anular}
              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden /> Anular
            </button>
          </>
        )}
      </div>
      {mensaje && <span role="alert" className="sr-only">{mensaje}</span>}
    </div>
  );
}
