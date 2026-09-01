"use client";

import { useEffect, useRef, useTransition } from "react";
import { LoaderCircle, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/componentes/ui/button";
import { cn } from "@/utilidades/clases";

interface Props {
  children: React.ReactNode;
  className?: string;
  classNameLimpiar?: string;
  hayFiltros?: boolean;
  claves: string[];
  textoLimpiar?: string;
  varianteLimpiar?: "ghost" | "outline";
}

const TIPOS_CON_DEBOUNCE = new Set(["text", "search", "email", "number", "tel"]);

export function FormularioFiltrosAutomaticos({
  children,
  className,
  classNameLimpiar,
  hayFiltros = false,
  claves,
  textoLimpiar = "Limpiar",
  varianteLimpiar = "ghost",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const formularioRef = useRef<HTMLFormElement>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  useEffect(
    () => () => {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    },
    [],
  );

  function navegarConFormulario() {
    const formulario = formularioRef.current;
    if (!formulario) return;
    const siguientes = new URLSearchParams(searchParams.toString());
    const datos = new FormData(formulario);
    for (const nombre of claves) {
      const valor = String(datos.get(nombre) ?? "").trim();
      if (valor) siguientes.set(nombre, valor);
      else siguientes.delete(nombre);
    }
    siguientes.delete("pagina");
    siguientes.delete("page");
    const consulta = siguientes.toString();
    iniciarTransicion(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
  }

  function programarActualizacion(elemento: HTMLInputElement | HTMLSelectElement) {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    const demora = elemento instanceof HTMLInputElement && TIPOS_CON_DEBOUNCE.has(elemento.type) ? 300 : 0;
    temporizadorRef.current = setTimeout(navegarConFormulario, demora);
  }

  function limpiar() {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    formularioRef.current?.reset();
    const siguientes = new URLSearchParams(searchParams.toString());
    for (const clave of claves) siguientes.delete(clave);
    siguientes.delete("pagina");
    siguientes.delete("page");
    const consulta = siguientes.toString();
    iniciarTransicion(() => router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false }));
  }

  return (
    <form
      key={searchParams.toString()}
      ref={formularioRef}
      className={cn(
        "transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        className,
        pendiente && "opacity-75",
      )}
      aria-busy={pendiente}
      onSubmit={(evento) => { evento.preventDefault(); navegarConFormulario(); }}
      onInput={(evento) => {
        const elemento = evento.target;
        if (elemento instanceof HTMLInputElement) programarActualizacion(elemento);
      }}
      onChange={(evento) => {
        const elemento = evento.target;
        if (elemento instanceof HTMLSelectElement) programarActualizacion(elemento);
      }}
    >
      {children}
      {hayFiltros && (
        <Button
          type="button"
          variant={varianteLimpiar}
          className={classNameLimpiar}
          onClick={limpiar}
          disabled={pendiente}
        >
          {pendiente ? <LoaderCircle className="animate-spin" aria-hidden /> : <X aria-hidden />}
          {textoLimpiar}
        </Button>
      )}
      <span className="sr-only" aria-live="polite">{pendiente ? "Actualizando resultados" : "Resultados actualizados"}</span>
    </form>
  );
}
