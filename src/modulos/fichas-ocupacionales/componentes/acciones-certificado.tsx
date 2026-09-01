"use client";

import { FileSpreadsheet } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { BotonVerImprimirPdf } from "@/componentes/documentos/boton-ver-imprimir-pdf";
import { buttonVariants } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";

interface Props {
  trabajadorId: string;
  fichaId: string;
  puedeExportar: boolean;
}

export function AccionesCertificado({
  trabajadorId,
  fichaId,
  puedeExportar,
}: Props) {
  const rutaRegresar = `/trabajadores/${trabajadorId}/fichas/${fichaId}`;

  return (
    <div className="no-print flex flex-wrap gap-2">
      <BotonRegresar rutaRespaldo={rutaRegresar} />
      {puedeExportar && (
        <>
          <BotonVerImprimirPdf href={`/api/fichas/${fichaId}/certificado/pdf`} />
          <a
            href={`/api/fichas/${fichaId}/exportar/excel`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FileSpreadsheet className="size-4 shrink-0" aria-hidden />
            Descargar Excel
          </a>
        </>
      )}
    </div>
  );
}
