"use client";

import { FileDown } from "lucide-react";

import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { buttonVariants } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";

interface Props {
  href: string;
  etiqueta?: string;
  className?: string;
  deshabilitado?: boolean;
  ariaLabel?: string;
}

export function BotonVerImprimirPdf({
  href,
  etiqueta = "Ver / imprimir PDF",
  className,
  deshabilitado = false,
  ariaLabel,
}: Props) {
  if (deshabilitado) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "pointer-events-none cursor-not-allowed opacity-50",
          className,
        )}
        aria-disabled="true"
      >
        <FileDown className="size-4 shrink-0" aria-hidden />
        {etiqueta}
      </span>
    );
  }

  return (
    <EnlacePdf
      ruta={href}
      ariaLabel={ariaLabel || `Ver e imprimir PDF`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
    >
      <FileDown className="size-4 shrink-0" aria-hidden />
      {etiqueta}
    </EnlacePdf>
  );
}
