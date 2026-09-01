"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { NAVEGACION_PRINCIPAL } from "@/configuracion/navegacion";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatearSegmento(segmento: string): string {
  const coincidencia = NAVEGACION_PRINCIPAL.find(
    (elemento) => elemento.ruta === `/${segmento}`,
  );
  if (coincidencia) {
    return coincidencia.etiqueta;
  }
  const texto = segmento.replace(/-/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function Migas() {
  const rutaActual = usePathname();
  const segmentos = rutaActual.split("/").filter(Boolean);

  const indicesVisibles = segmentos
    .map((s, i) => (UUID_REGEX.test(s) ? -1 : i))
    .filter((i) => i !== -1);

  if (indicesVisibles.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {indicesVisibles.map((indiceReal, indiceVisual) => {
          const segmento = segmentos[indiceReal];
          const ruta = `/${segmentos.slice(0, indiceReal + 1).join("/")}`;
          const esUltimo = indiceReal === indicesVisibles[indicesVisibles.length - 1];
          const esPrimero = indiceVisual === 0;
          const etiqueta = formatearSegmento(segmento);

          return (
            <li key={ruta} className="flex items-center gap-1">
              {!esPrimero && (
                <ChevronRight className="size-4 shrink-0" aria-hidden />
              )}
              {esUltimo ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {etiqueta}
                </span>
              ) : (
                <Link href={ruta} className="hover:text-foreground">
                  {etiqueta}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
