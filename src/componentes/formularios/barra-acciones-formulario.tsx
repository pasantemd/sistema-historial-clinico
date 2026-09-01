import type { ReactNode } from "react";
import Link from "next/link";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Button } from "@/componentes/ui/button";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";

interface BarraAccionesFormularioProps {
  cancelar?: ReactNode;
  rutaRegreso?: string;
  secundario?: ReactNode;
  principal?: ReactNode;
  cancelarHref?: string;
  textoCancelar?: string;
  cargando?: boolean;
  textoFinalizar?: string;
  deshabilitadoFinalizar?: boolean;
  iconoFinalizar?: ReactNode;
  tipoFinalizar?: "submit" | "button";
  alClicFinalizar?: () => void;
}

export function BarraAccionesFormulario({
  cancelar,
  rutaRegreso,
  secundario,
  principal,
  cancelarHref,
  textoCancelar = "Cancelar",
  cargando = false,
  textoFinalizar = "Finalizar",
  deshabilitadoFinalizar = false,
  iconoFinalizar,
  tipoFinalizar = "submit",
  alClicFinalizar,
}: BarraAccionesFormularioProps) {
  const nodoCancelar =
    cancelar ??
    (cancelarHref ? (
      <Link href={cancelarHref} className={cn(buttonVariants({ variant: "outline" }))}>
        {textoCancelar}
      </Link>
    ) : null);

  const nodoPrincipal =
    principal ??
    (textoFinalizar ? (
      <Button
        type={tipoFinalizar}
        onClick={tipoFinalizar === "button" ? alClicFinalizar : undefined}
        disabled={cargando || deshabilitadoFinalizar}
      >
        {iconoFinalizar}
        {textoFinalizar}
      </Button>
    ) : null);

  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-background shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.45)]">
      <div className="mx-auto flex max-w-(--contenedor-formulario) flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-4 flex flex-col gap-2 sm:order-1 sm:flex-row sm:[&>*]:w-auto">
          {rutaRegreso && <BotonRegresar rutaRespaldo={rutaRegreso} />}
          {nodoCancelar}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <div className="order-2 [&>*]:w-full sm:order-1 sm:[&>*]:w-auto">{secundario}</div>
          <div className="order-1 [&>*]:w-full sm:order-2 sm:[&>*]:w-auto">{nodoPrincipal}</div>
        </div>
      </div>
    </div>
  );
}
