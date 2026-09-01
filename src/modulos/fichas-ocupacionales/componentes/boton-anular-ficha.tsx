"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { anularFichaAccion } from "@/modulos/fichas-ocupacionales/acciones/fichas.acciones";

export function BotonAnularFicha({ trabajadorId, fichaId }: { trabajadorId: string; fichaId: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pendiente}
        onClick={() => iniciar(async () => {
          setError("");
          const resultado = await anularFichaAccion(fichaId);
          if (!resultado.exito) {
            setError(resultado.mensaje);
            return;
          }
          router.push(`/trabajadores/${trabajadorId}/fichas`);
          router.refresh();
        })}
      >
        <Ban aria-hidden /> Anular
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
