"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { BarraAccionesDocumento } from "./barra-acciones-documento";

interface Props {
  titulo: string;
  subtitulo?: string;
  tipo: "pdf" | "excel" | "html";
  rutaPdf?: string;
  rutaExcel?: string;
  rutaRegreso: string;
  children?: React.ReactNode;
  urlIframe?: string;
  orientacion?: "vertical" | "horizontal";
}

export function VistaPreviaDocumento({
  titulo,
  subtitulo,
  tipo,
  rutaPdf,
  rutaExcel,
  rutaRegreso,
  children,
  urlIframe,
  orientacion = "vertical",
}: Props) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-muted/40 print:bg-white print:p-0">
      <div className="no-print">
        <BarraAccionesDocumento
          titulo={titulo}
          subtitulo={subtitulo}
          rutaPdf={rutaPdf}
          rutaExcel={rutaExcel}
          rutaRegreso={rutaRegreso}
        />
      </div>
      <div className="flex flex-1 flex-col items-center overflow-auto p-4 print:overflow-visible print:p-0">
        {tipo === "pdf" && urlIframe && (
          <div className="relative w-full max-w-[210mm] flex-1 print:max-w-none print:overflow-visible">
            {cargando && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-8 animate-spin" />
                  <p className="text-sm">Cargando documento…</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-destructive">
                  <AlertCircle className="size-8" />
                  <p className="text-sm">Error al cargar el documento</p>
                </div>
              </div>
            )}
            <iframe
              src={urlIframe}
              sandbox="allow-same-origin allow-scripts allow-downloads"
              className={`h-[calc(100vh-8rem)] w-full rounded-lg bg-white shadow-xl print:h-auto print:shadow-none ${cargando ? "invisible" : "visible"}`}
              onLoad={() => setCargando(false)}
              onError={() => { setCargando(false); setError(true); }}
              title={titulo}
            />
          </div>
        )}
        {tipo === "html" && children && (
          <div className={orientacion === "horizontal" ? "w-max max-w-none print:w-full" : "w-full max-w-[210mm] print:max-w-none"}>
            {children}
          </div>
        )}
        {tipo === "excel" && children && (
          <div className="w-full max-w-[210mm] print:max-w-none">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
