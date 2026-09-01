"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/utilidades/clases";

interface Props {
  ruta: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  textoCargando?: string;
}

export function EnlacePdf({
  ruta,
  children,
  className,
  ariaLabel,
  textoCargando = "Generando PDF…",
}: Props) {
  const [cargando, setCargando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    [],
  );

  return (
    <a
      href={ruta}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      aria-busy={cargando}
      className={cn(className, cargando && "pointer-events-none opacity-70")}
      onClick={() => {
        setCargando(true);
        temporizador.current = setTimeout(() => setCargando(false), 2_500);
      }}
    >
      {cargando ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </a>
  );
}
