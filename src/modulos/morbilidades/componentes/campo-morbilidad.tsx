"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { EtiquetaCampo } from "@/componentes/ui/etiqueta-campo";
import { Input } from "@/componentes/ui/input";
import { buscarMorbilidadesAccion } from "@/modulos/morbilidades/acciones/morbilidades.acciones";
import { cn } from "@/utilidades/clases";

export interface CampoMorbilidadProps<TForm extends FieldValues> {
  form: UseFormReturn<TForm>;
  name: Path<TForm>;
  etiqueta?: string;
  requerido?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CampoMorbilidad<TForm extends FieldValues>({
  form,
  name,
  etiqueta = "Morbilidad",
  requerido = true,
  error,
  placeholder = "Escriba la morbilidad (ej. Dolor abdominal)",
  className,
  disabled = false,
}: CampoMorbilidadProps<TForm>) {
  const valorActual = (form.watch(name) as string) ?? "";
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1);

  const versionPeticion = useRef(0);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const termino = valorActual.trim();
    const id = ++versionPeticion.current;

    if (termino.length < 2) {
      const timer = setTimeout(() => {
        if (id === versionPeticion.current) {
          setSugerencias([]);
          setCargando(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    const temporizador = setTimeout(async () => {
      setCargando(true);
      try {
        const respuesta = await buscarMorbilidadesAccion(termino);
        if (id === versionPeticion.current) {
          if (respuesta.exito) {
            setSugerencias(respuesta.datos);
          } else {
            setSugerencias([]);
          }
        }
      } catch {
        if (id === versionPeticion.current) {
          setSugerencias([]);
        }
      } finally {
        if (id === versionPeticion.current) {
          setCargando(false);
        }
      }
    }, 300);

    return () => clearTimeout(temporizador);
  }, [valorActual]);

  useEffect(() => {
    function manejarClickExterior(evento: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target as Node)
      ) {
        setAbierto(false);
        setIndiceSeleccionado(-1);
      }
    }
    document.addEventListener("mousedown", manejarClickExterior);
    return () => document.removeEventListener("mousedown", manejarClickExterior);
  }, []);

  function seleccionarSugerencia(texto: string) {
    form.setValue(name, texto as PathValue<TForm, Path<TForm>>, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setAbierto(false);
    setIndiceSeleccionado(-1);
  }

  function manejarKeyDown(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto || sugerencias.length === 0) {
      if (evento.key === "ArrowDown" && sugerencias.length > 0) {
        setAbierto(true);
      }
      return;
    }

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceSeleccionado((prev) =>
        prev < sugerencias.length - 1 ? prev + 1 : 0,
      );
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceSeleccionado((prev) =>
        prev > 0 ? prev - 1 : sugerencias.length - 1,
      );
    } else if (evento.key === "Enter" && indiceSeleccionado >= 0) {
      evento.preventDefault();
      const opcion = sugerencias[indiceSeleccionado];
      if (opcion) {
        seleccionarSugerencia(opcion);
      }
    } else if (evento.key === "Escape") {
      setAbierto(false);
      setIndiceSeleccionado(-1);
    }
  }

  const listboxId = `morbilidad-listbox-${name}`;
  const tieneTextoSuficiente = valorActual.trim().length >= 2;

  return (
    <div
      ref={contenedorRef}
      className={cn("relative space-y-1.5 text-sm font-medium", className)}
    >
      <EtiquetaCampo etiqueta={etiqueta} required={requerido} />
      <div className="relative">
        <Input
          {...form.register(name)}
          placeholder={placeholder}
          required={requerido}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={listboxId}
          aria-invalid={Boolean(error)}
          onFocus={() => setAbierto(true)}
          onKeyDown={manejarKeyDown}
          className="pr-9"
        />
        {cargando && (
          <Loader2
            aria-hidden
            className="absolute right-3 top-3 size-4 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {abierto && tieneTextoSuficiente && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
        >
          {sugerencias.length > 0 ? (
            sugerencias.map((item, idx) => (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={idx === indiceSeleccionado}
                className={cn(
                  "flex min-h-10 w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none",
                  idx === indiceSeleccionado && "bg-accent text-accent-foreground font-medium",
                )}
                onClick={() => seleccionarSugerencia(item)}
              >
                {item}
              </button>
            ))
          ) : (
            !cargando && (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No se encontraron coincidencias previas. Se guardará{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{valorActual.trim()}&rdquo;
                </span>{" "}
                como nueva morbilidad al enviar.
              </div>
            )
          )}
        </div>
      )}

      <span className="block text-xs font-normal text-muted-foreground">
        Puede escribir una nueva; quedará disponible como sugerencia en futuras evaluaciones y registros.
      </span>

      {error && (
        <span role="alert" className="block text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
