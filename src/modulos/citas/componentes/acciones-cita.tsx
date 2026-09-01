"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Pencil, Ban, CalendarCheck } from "lucide-react";
import { Button } from "@/componentes/ui/button";
import { buttonVariants } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";
import { atenderCitaAccion, cancelarCitaAccion, confirmarCitaAccion } from "@/modulos/citas/acciones/citas.acciones";
import type { EstadoCita } from "@/modulos/citas/constantes";

interface Props {
  citaId: string;
  trabajadorId: string;
  estado: EstadoCita;
  puedeEditar: boolean;
  puedeAtender: boolean;
  puedeCancelar: boolean;
}

export function AccionesCita({ citaId, trabajadorId, estado, puedeEditar, puedeAtender, puedeCancelar }: Props) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const editable = estado === "PROGRAMADA" || estado === "CONFIRMADA";

  function ejecutarAccionCita(accion: () => Promise<{ exito: boolean; mensaje?: string }>) {
    iniciar(async () => {
      const respuesta = await accion();
      if (!respuesta.exito) {
        alert(respuesta.mensaje);
        return;
      }
      router.refresh();
    });
  }

  function atender() {
    iniciar(async () => {
      const respuesta = await atenderCitaAccion(citaId);
      if (!respuesta.exito) {
        alert(respuesta.mensaje);
        return;
      }
      router.push(`/evaluaciones-medicas/nueva?trabajadorId=${trabajadorId}`);
    });
  }

  function cancelar() {
    const motivo = window.prompt("Motivo de cancelación de la cita:");
    if (!motivo || !motivo.trim()) return;
    ejecutarAccionCita(() => cancelarCitaAccion(citaId, motivo.trim()));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {puedeEditar && editable && (
        <Link href={`/citas/${citaId}/editar`} className={cn(buttonVariants({ variant: "outline" }))}>
          <Pencil aria-hidden /> Editar
        </Link>
      )}
      {puedeAtender && estado === "PROGRAMADA" && (
        <Button type="button" variant="outline" onClick={() => ejecutarAccionCita(() => confirmarCitaAccion(citaId))} disabled={pendiente}>
          <CalendarCheck aria-hidden /> Confirmar
        </Button>
      )}
      {puedeAtender && editable && (
        <Button type="button" onClick={atender} disabled={pendiente}>
          <Check aria-hidden /> Atender y evaluar
        </Button>
      )}
      {puedeCancelar && editable && (
        <Button type="button" variant="destructive" onClick={cancelar} disabled={pendiente}>
          <Ban aria-hidden /> Cancelar
        </Button>
      )}
    </div>
  );
}
