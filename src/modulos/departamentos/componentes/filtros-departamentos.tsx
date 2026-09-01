"use client";

import { useSearchParams } from "next/navigation";

import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { Input } from "@/componentes/ui/input";

const selector = "min-h-11 rounded-lg border border-input bg-background px-3 text-sm";

export function FiltrosDepartamentos({ empresas }: { empresas: Array<{ id: string; razonSocial: string }> }) {
  const parametros = useSearchParams();
  const busqueda = parametros.get("busqueda") ?? "";
  const empresaId = parametros.get("empresaId") ?? "";

  return (
    <FormularioFiltrosAutomaticos
      claves={["busqueda", "empresaId"]}
      hayFiltros={Boolean(busqueda || empresaId)}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="relative flex-1">
        <Input
          name="busqueda"
          placeholder="Buscar por nombre"
          defaultValue={busqueda}
          autoComplete="off"
        />
      </div>
      <select
        name="empresaId"
        className={selector}
        aria-label="Filtrar por empresa"
        defaultValue={empresaId}
      >
        <option value="">Todas las empresas</option>
        {empresas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>{empresa.razonSocial}</option>
        ))}
      </select>
    </FormularioFiltrosAutomaticos>
  );
}
