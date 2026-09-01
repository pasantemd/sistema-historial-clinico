"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import type { FiltrosInventario } from "@/modulos/inventario/tipos";

interface Props {
  filtros: FiltrosInventario;
}

type CambiosFiltro = Record<string, string | boolean | undefined>;

export function FiltrosInventario({ filtros }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, iniciarTransicion] = useTransition();
  const [busqueda, setBusqueda] = useState(filtros.busqueda ?? "");
  const temporizadorBusqueda = useRef<number | null>(null);

  const actualizarFiltros = useCallback(
    (cambios: CambiosFiltro) => {
      const parametros = new URLSearchParams(searchParams.toString());

      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === undefined || valor === "" || valor === false) {
          parametros.delete(clave);
        } else {
          parametros.set(clave, valor === true ? "1" : valor);
        }
      }

      parametros.delete("page");
      parametros.set("pageSize", String(filtros.tamanoPagina ?? 20));
      parametros.delete("pagina");
      const consulta = parametros.toString();
      const destino = consulta ? `${pathname}?${consulta}` : pathname;

      iniciarTransicion(() => {
        router.replace(destino, { scroll: false });
      });
    },
    [filtros.tamanoPagina, pathname, router, searchParams],
  );

  useEffect(
    () => () => {
      if (temporizadorBusqueda.current !== null) {
        window.clearTimeout(temporizadorBusqueda.current);
      }
    },
    [],
  );

  const hayFiltros = Boolean(
    busqueda || filtros.estado || filtros.sinStock || filtros.stockBajo,
  );

  function limpiarFiltros() {
    if (temporizadorBusqueda.current !== null) {
      window.clearTimeout(temporizadorBusqueda.current);
    }
    temporizadorBusqueda.current = null;
    setBusqueda("");
    const parametros = new URLSearchParams(searchParams.toString());
    for (const clave of ["busqueda", "estado", "sinStock", "stockBajo", "page", "pagina"]) {
      parametros.delete(clave);
    }
    parametros.set("pageSize", String(filtros.tamanoPagina ?? 20));
    const consulta = parametros.toString();
    iniciarTransicion(() => {
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false });
    });
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    if (temporizadorBusqueda.current !== null) {
      window.clearTimeout(temporizadorBusqueda.current);
    }
    temporizadorBusqueda.current = window.setTimeout(() => {
      temporizadorBusqueda.current = null;
      actualizarFiltros({ busqueda: valor.trim() || undefined });
    }, 300);
  }

  return (
    <section aria-label="Filtros de inventario" className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_14rem] lg:grid-cols-[minmax(18rem,1fr)_14rem_auto_auto]">
        <label className="relative min-w-0">
          <span className="sr-only">Buscar medicamento</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={busqueda}
            onChange={(evento) => cambiarBusqueda(evento.target.value)}
            className="pl-9 pr-9"
            placeholder="Buscar medicamento por nombre"
            autoComplete="off"
          />
          {busqueda && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => cambiarBusqueda("")}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </label>

        <label className="grid gap-1 text-sm">
          <span className="sr-only">Estado del medicamento</span>
          <select
            value={filtros.estado ?? ""}
            onChange={(evento) => actualizarFiltros({ estado: evento.target.value || undefined })}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-3 focus:ring-ring/25"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm transition-colors hover:bg-muted/40">
          <input
            type="checkbox"
            checked={Boolean(filtros.sinStock)}
            onChange={(evento) =>
              actualizarFiltros({
                sinStock: evento.target.checked,
                stockBajo: evento.target.checked ? undefined : filtros.stockBajo,
              })
            }
          />
          Sin stock
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm transition-colors hover:bg-muted/40">
          <input
            type="checkbox"
            checked={Boolean(filtros.stockBajo)}
            onChange={(evento) =>
              actualizarFiltros({
                stockBajo: evento.target.checked,
                sinStock: evento.target.checked ? undefined : filtros.sinStock,
              })
            }
          />
          Stock bajo
        </label>
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3">
        <p aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
          {pendiente ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
              Actualizando resultados…
            </>
          ) : (
            "Los resultados se actualizan automáticamente."
          )}
        </p>
        {hayFiltros && (
          <Button type="button" variant="ghost" size="sm" onClick={limpiarFiltros} disabled={pendiente}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </section>
  );
}
