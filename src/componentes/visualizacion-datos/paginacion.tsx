"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button";
import {
  crearHrefPaginacion,
  crearParametrosPaginacion,
  estadoPaginacion,
  PARAMETRO_PAGINA,
  PARAMETRO_TAMANO_PAGINA,
} from "@/componentes/visualizacion-datos/paginacion-url";
import { cn } from "@/utilidades/clases";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  parametros: string;
  etiquetaSingular?: string;
  etiquetaPlural?: string;
  tamanoPagina?: number;
  opcionesTamano?: number[];
  rutaBase?: string;
  parametroPagina?: string;
  parametroTamanoPagina?: string;
}

const OPCIONES_TAMANO = [20, 50, 60, 80];

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  parametros,
  etiquetaSingular = "registro",
  etiquetaPlural = "registros",
  tamanoPagina,
  opcionesTamano = OPCIONES_TAMANO,
  rutaBase = "",
  parametroPagina = PARAMETRO_PAGINA,
  parametroTamanoPagina = PARAMETRO_TAMANO_PAGINA,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const ruta = rutaBase || pathname;
  const estado = estadoPaginacion(pagina, totalPaginas);

  function enlace(paginaDestino: number) {
    return crearHrefPaginacion(
      ruta,
      crearParametrosPaginacion({
        parametros,
        pagina: paginaDestino,
        parametroPagina,
        parametroTamanoPagina,
      }),
    );
  }

  function cambiarTamano(nuevoTamano: number) {
    const consulta = crearParametrosPaginacion({
      parametros,
      pagina: 1,
      tamanoPagina: nuevoTamano,
      parametroPagina,
      parametroTamanoPagina,
    });

    router.push(crearHrefPaginacion(ruta, consulta));
  }

  const textoRegistros = `${total} ${total === 1 ? etiquetaSingular : etiquetaPlural}`;

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {tamanoPagina && (
          <label className="flex items-center gap-1.5">
            Mostrar
            <select
              value={tamanoPagina}
              onChange={(evento) => cambiarTamano(Number(evento.target.value))}
              className="min-h-9 rounded-lg border border-input bg-background px-2 py-1 text-sm outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-3 focus:ring-ring/25"
            >
              {opcionesTamano.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            {etiquetaPlural}
          </label>
        )}
        <span className="text-muted-foreground/60">·</span>
        <span>{textoRegistros}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          aria-disabled={estado.anteriorDeshabilitado}
          tabIndex={estado.anteriorDeshabilitado ? -1 : undefined}
          href={estado.anteriorDeshabilitado ? "#" : enlace(pagina - 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            estado.anteriorDeshabilitado && "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft aria-hidden /> Anterior
        </Link>

        <span className="min-w-28 text-center">
          Página {pagina} de {totalPaginas}
        </span>

        <Link
          aria-disabled={estado.siguienteDeshabilitado}
          tabIndex={estado.siguienteDeshabilitado ? -1 : undefined}
          href={estado.siguienteDeshabilitado ? "#" : enlace(pagina + 1)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            estado.siguienteDeshabilitado && "pointer-events-none opacity-50",
          )}
        >
          Siguiente <ChevronRight aria-hidden />
        </Link>
      </div>
    </div>
  );
}
