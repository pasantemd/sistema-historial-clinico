"use client";

import { useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";

import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";
import { ESTADOS_VINCULO } from "@/modulos/trabajadores/constantes";
import type { CatalogoOrganizacional } from "@/modulos/trabajadores/tipos";

const selector = "min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";

export function FiltrosTrabajadores({ catalogo }: { catalogo: CatalogoOrganizacional }) {
  const parametros = useSearchParams();
  const departamentoRef = useRef<HTMLSelectElement>(null);
  const busqueda = parametros.get("busqueda") ?? "";
  const empresaId = parametros.get("empresaId") ?? "";
  const departamentoId = parametros.get("departamentoId") ?? "";
  const estado = parametros.get("estado") ?? "";
  const departamentos = useMemo(
    () => empresaId
      ? catalogo.departamentos.filter((item) => item.empresaId === empresaId)
      : catalogo.departamentos,
    [catalogo.departamentos, empresaId],
  );

  async function buscarTrabajadores(termino: string) {
    const datos = await buscarTrabajadoresClinicosAccion(termino);
    return datos.map((item) => ({
      id: item.id,
      label: item.nombreCompleto,
      descripcion: `${item.numeroDocumento} · ${item.empresa} · ${item.departamento}`,
    }));
  }

  return (
    <FormularioFiltrosAutomaticos
      claves={["busqueda", "empresaId", "departamentoId", "estado"]}
      hayFiltros={Boolean(busqueda || empresaId || departamentoId || estado)}
      className="grid min-w-0 gap-3 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 xl:grid-cols-4"
    >
      <div className="min-w-0 sm:col-span-2 xl:col-span-2">
        <BuscadorAutocompletado
          buscar={buscarTrabajadores}
          name="busqueda"
          placeholder="Nombre, cédula, empresa o departamento"
          valorInicial={busqueda}
          onSeleccionar={() => undefined}
        />
      </div>
      <select
        name="empresaId"
        className={selector}
        defaultValue={empresaId}
        onChange={() => {
          if (departamentoRef.current) departamentoRef.current.value = "";
        }}
        aria-label="Filtrar por empresa"
      >
        <option value="">Todas las empresas</option>
        {catalogo.empresas.map((item) => (
          <option key={item.id} value={item.id}>{item.razonSocial}</option>
        ))}
      </select>
      <select
        ref={departamentoRef}
        name="departamentoId"
        className={selector}
        defaultValue={departamentoId}
        aria-label="Filtrar por departamento"
      >
        <option value="">Todos los departamentos</option>
        {departamentos.map((item) => (
          <option key={item.id} value={item.id}>{item.nombre}</option>
        ))}
      </select>
      <select name="estado" className={selector} defaultValue={estado} aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        {ESTADOS_VINCULO.map((item) => (
          <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
        ))}
      </select>
    </FormularioFiltrosAutomaticos>
  );
}
