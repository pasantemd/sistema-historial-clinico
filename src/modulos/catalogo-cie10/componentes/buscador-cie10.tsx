"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/componentes/ui/input";
import { buscarCie10Accion } from "@/modulos/catalogo-cie10/acciones/buscar-cie10.accion";
import type { ResultadoCie10 } from "@/modulos/catalogo-cie10/tipos";
import { normalizarTerminoCie10 } from "@/modulos/catalogo-cie10/utilidades/normalizar-termino-cie10";

interface BuscadorCie10Props {
  onSeleccionar: (resultado: ResultadoCie10) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ocultos?: Set<string>;
  idBase?: string;
}

function resaltarTexto(texto: string, termino: string): React.ReactNode {
  const normalizado = normalizarTerminoCie10(texto);
  const terminoNorm = normalizarTerminoCie10(termino);
  if (!terminoNorm || terminoNorm.length < 2) return texto;
  const indice = normalizado.indexOf(terminoNorm);
  if (indice === -1) return texto;
  const inicio = texto.slice(0, indice);
  const medio = texto.slice(indice, indice + termino.length);
  const fin = texto.slice(indice + termino.length);
  return (
    <>
      {inicio}
      <mark className="rounded bg-accent/80 px-0.5 font-semibold text-accent-foreground">
        {medio}
      </mark>
      {fin}
    </>
  );
}

export function BuscadorCie10({
  onSeleccionar,
  placeholder = "Buscar por código, diagnóstico o síntoma común",
  autoFocus = false,
  ocultos,
  idBase = "buscador-cie10",
}: BuscadorCie10Props) {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ResultadoCie10[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const entradaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const termino = consulta.trim();
    let vigente = true;
    if (termino.length < 2) {
      const temporizadorCorto = window.setTimeout(() => {
        if (!vigente) return;
        setResultados([]);
        setMensaje(termino.length === 1 ? "Escriba al menos 2 caracteres." : "");
        setCargando(false);
        setIndiceActivo(-1);
      }, 0);
      return () => {
        vigente = false;
        window.clearTimeout(temporizadorCorto);
      };
    }
    const temporizador = window.setTimeout(async () => {
      setCargando(true);
      setMensaje("");
      setIndiceActivo(-1);
      const respuesta = await buscarCie10Accion(termino);
      if (!vigente) return;
      setCargando(false);
      if (!respuesta.exito) {
        setResultados([]);
        setMensaje(respuesta.mensaje);
        return;
      }
      const filtrados = ocultos
        ? respuesta.datos.filter((r) => !ocultos.has(r.id))
        : respuesta.datos;
      setResultados(filtrados);
      setMensaje(filtrados.length === 0 ? "No se encontraron diagnósticos." : "");
    }, 300);
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [consulta, ocultos]);

  const seleccionar = useCallback(
    (resultado: ResultadoCie10) => {
      onSeleccionar(resultado);
      setConsulta("");
      setResultados([]);
      setMensaje("");
      setIndiceActivo(-1);
      entradaRef.current?.focus();
    },
    [onSeleccionar],
  );

  const teclado = useCallback(
    (evento: React.KeyboardEvent) => {
      if (resultados.length === 0) return;
      switch (evento.key) {
        case "ArrowDown":
          evento.preventDefault();
          setIndiceActivo((prev) => {
            const sig = prev < resultados.length - 1 ? prev + 1 : 0;
            itemsRef.current[sig]?.scrollIntoView({ block: "nearest" });
            return sig;
          });
          break;
        case "ArrowUp":
          evento.preventDefault();
          setIndiceActivo((prev) => {
            const ant = prev > 0 ? prev - 1 : resultados.length - 1;
            itemsRef.current[ant]?.scrollIntoView({ block: "nearest" });
            return ant;
          });
          break;
        case "Enter":
          evento.preventDefault();
          if (indiceActivo >= 0 && indiceActivo < resultados.length) {
            seleccionar(resultados[indiceActivo]);
          }
          break;
        case "Escape":
          evento.preventDefault();
          setResultados([]);
          setMensaje("");
          setIndiceActivo(-1);
          entradaRef.current?.blur();
          break;
      }
    },
    [resultados, indiceActivo, seleccionar],
  );

  const idResultados = `${idBase}-resultados`;
  const idAyuda = `${idBase}-ayuda`;

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
      />
      <Input
        ref={entradaRef}
        value={consulta}
        onChange={(evento) => {
          setConsulta(evento.target.value);
        }}
        onKeyDown={teclado}
        placeholder={placeholder}
        className="pl-9"
        role="combobox"
        aria-expanded={resultados.length > 0}
        aria-controls={idResultados}
        aria-autocomplete="list"
        aria-describedby={idAyuda}
        aria-activedescendant={
          indiceActivo >= 0 ? `${idBase}-opcion-${indiceActivo}` : undefined
        }
        autoFocus={autoFocus}
      />
      <p id={idAyuda} className="mt-2 text-xs text-muted-foreground">
        Ejemplos: R51, cefalea, presión alta, fractura brazo
      </p>
      {(cargando || mensaje) && (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {cargando ? "Buscando..." : mensaje}
        </p>
      )}
      {resultados.length > 0 && (
        <div
          id={idResultados}
          ref={listaRef}
          role="listbox"
          className="mt-2 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
        >
          {resultados.map((resultado, indice) => (
            <button
              key={resultado.id}
              ref={(el) => {
                itemsRef.current[indice] = el;
              }}
              type="button"
              role="option"
              aria-selected={indice === indiceActivo}
              id={`${idBase}-opcion-${indice}`}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                indice === indiceActivo
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/60"
              }`}
              onClick={() => seleccionar(resultado)}
              onMouseEnter={() => setIndiceActivo(indice)}
            >
              <span className="font-semibold">{resultado.codigo}</span>
              <span> — {resaltarTexto(resultado.descripcion, consulta)}</span>
              {resultado.sugeridoPorSinonimo && (
                <span className="ml-2 inline-flex items-center rounded-full bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
                  sinónimo
                </span>
              )}
              {resultado.nivel === "SUBCATEGORIA" &&
                resultado.categoriaPadreCodigo && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({resultado.categoriaPadreCodigo})
                  </span>
                )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
