"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/componentes/ui/input";
import { cn } from "@/utilidades/clases";

export interface ResultadoAutocompletado {
  id: string;
  label: string;
  descripcion?: string;
}

interface Props {
  buscar: (termino: string) => Promise<ResultadoAutocompletado[]>;
  placeholder?: string;
  onSeleccionar: (item: ResultadoAutocompletado) => void;
  onCambioTexto?: (texto: string) => void;
  valorInicial?: string;
  className?: string;
  autoFocus?: boolean;
  minCaracteres?: number;
  name?: string;
  label?: string;
  limpiable?: boolean;
  icono?: React.ReactNode;
}

function resaltar(texto: string, termino: string) {
  if (!termino.trim()) return texto;
  const regex = new RegExp(`(${termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const partes = texto.split(regex);
  return partes.map((parte, i) =>
    regex.test(parte)
      ? <mark key={i} className="bg-accent font-medium text-accent-foreground rounded-sm px-0.5">{parte}</mark>
      : parte,
  );
}

export function BuscadorAutocompletado({
  buscar,
  placeholder = "Buscar…",
  onSeleccionar,
  valorInicial = "",
  onCambioTexto,
  className,
  autoFocus = false,
  minCaracteres = 2,
  name,
  label,
  limpiable = true,
  icono,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [termino, setTermino] = useState(valorInicial);
  const [resultados, setResultados] = useState<ResultadoAutocompletado[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const [valorOculto, setValorOculto] = useState("");

  const terminoActivo = termino.trim().length >= minCaracteres;

  const ejecutarBusqueda = useCallback(async (termino: string) => {
    if (!termino.trim() || termino.trim().length < minCaracteres) {
      setResultados([]);
      setAbierto(false);
      setError(null);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const datos = await buscar(termino.trim());
      setResultados(datos);
      setAbierto(datos.length > 0);
      setIndiceActivo(-1);
    } catch {
      setResultados([]);
      setError("Error al buscar");
      setAbierto(true);
    } finally {
      setCargando(false);
    }
  }, [buscar, minCaracteres]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setTermino(valorInicial); }, [valorInicial]);

  useEffect(() => {
    if (temporizadorRef.current) clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => ejecutarBusqueda(termino), 300);
    return () => { if (temporizadorRef.current) clearTimeout(temporizadorRef.current); };
  }, [termino, ejecutarBusqueda]);

  function seleccionar(item: ResultadoAutocompletado) {
    setTermino(item.label);
    setValorOculto(item.id);
    setAbierto(false);
    setResultados([]);
    onSeleccionar(item);
    window.setTimeout(() => {
      inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }

  function limpiar() {
    setTermino("");
    setValorOculto("");
    setResultados([]);
    setAbierto(false);
    setError(null);
    setIndiceActivo(-1);
    inputRef.current?.focus();
    onCambioTexto?.("");
    window.setTimeout(() => {
      inputRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
    }, 0);
  }

  function manejarTecla(evento: React.KeyboardEvent) {
    if (!abierto) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceActivo((prev) => (prev < resultados.length - 1 ? prev + 1 : 0));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceActivo((prev) => (prev > 0 ? prev - 1 : resultados.length - 1));
    } else if (evento.key === "Enter" && indiceActivo >= 0) {
      evento.preventDefault();
      seleccionar(resultados[indiceActivo]);
    } else if (evento.key === "Escape") {
      setAbierto(false);
      setIndiceActivo(-1);
    }
  }

  useEffect(() => {
    if (indiceActivo >= 0 && listaRef.current) {
      const item = listaRef.current.children[indiceActivo] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [indiceActivo]);

  const mostrarDropdown = abierto && terminoActivo;
  const mostrarVacio = terminoActivo && !cargando && !error && resultados.length === 0;
  const mostrarError = terminoActivo && error;

  return (
    <div className={cn("relative min-w-0", mostrarDropdown && "z-50", className)}>
      {label && (
        <label htmlFor={`${id}-input`} className="mb-1 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {icono ?? (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={mostrarDropdown}
          aria-controls={`${id}-lista`}
          aria-activedescendant={indiceActivo >= 0 ? `${id}-item-${indiceActivo}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          name={name}
          value={termino}
          onChange={(evento) => { const v = evento.target.value; setTermino(v); setValorOculto(""); onCambioTexto?.(v); }}
          onKeyDown={manejarTecla}
          onBlur={() => setTimeout(() => setAbierto(false), 200)}
          onFocus={() => { if (resultados.length > 0) setAbierto(true); }}
          placeholder={placeholder}
          className={cn("pl-9", limpiable && termino ? "pr-9" : "pr-3")}
        />
        {cargando && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {!cargando && limpiable && termino && (
          <button
            type="button"
            onClick={limpiar}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {mostrarDropdown && (
        <ul
          ref={listaRef}
          id={`${id}-lista`}
          role="listbox"
          className="absolute left-0 z-[70] mt-1 max-h-60 w-[min(24rem,calc(100vw-2rem))] min-w-full overflow-auto rounded-lg border bg-popover shadow-xl"
        >
          {resultados.map((item, i) => (
            <li
              key={item.id}
              id={`${id}-item-${i}`}
              role="option"
              aria-selected={i === indiceActivo}
              className={cn(
                "flex cursor-pointer flex-col px-3 py-2.5 text-sm leading-5 transition-colors",
                i === indiceActivo ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent/50",
              )}
              onMouseDown={() => seleccionar(item)}
              onMouseEnter={() => setIndiceActivo(i)}
            >
              <span className="break-words font-medium">{resaltar(item.label, termino)}</span>
              {item.descripcion && (
                <span className="mt-0.5 text-xs text-muted-foreground">{resaltar(item.descripcion, termino)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {mostrarVacio && (
        <p className="mt-1 text-sm text-muted-foreground">No se encontraron resultados.</p>
      )}

      {mostrarError && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}

      <input type="hidden" name={`${name || "buscador"}Id`} value={valorOculto} />
    </div>
  );
}
