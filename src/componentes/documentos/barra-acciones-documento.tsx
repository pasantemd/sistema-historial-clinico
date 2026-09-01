"use client";

import { Download } from "lucide-react";
import { Button } from "@/componentes/ui/button";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { buttonVariants } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";

interface Props {
  titulo: string;
  subtitulo?: string;
  rutaPdf?: string;
  rutaExcel?: string;
  rutaRegreso: string;
}

export function BarraAccionesDocumento({
  titulo,
  subtitulo,
  rutaPdf,
  rutaExcel,
  rutaRegreso,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 shadow-xs dark:bg-card">
      <div className="flex items-center gap-3 min-w-0">
        <BotonRegresar rutaRespaldo={rutaRegreso} />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{titulo}</h1>
          {subtitulo && <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {rutaPdf && (
          <EnlacePdf
            ruta={rutaPdf}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Download className="size-4" aria-hidden /> Ver / Imprimir PDF
          </EnlacePdf>
        )}
        {rutaExcel && (
          <Button variant="outline" size="sm" onClick={() => window.open(rutaExcel, "_blank")}>
            <Download className="size-4" aria-hidden /> Excel
          </Button>
        )}
      </div>
    </div>
  );
}
