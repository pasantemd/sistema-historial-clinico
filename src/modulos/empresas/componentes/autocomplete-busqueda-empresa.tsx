"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { buscarEmpresasAccion } from "@/modulos/empresas/acciones/buscar-empresas.accion";

export function AutocompleteBusquedaEmpresa() {
  const router = useRouter();
  const parametros = useSearchParams();
  const busquedaInicial = parametros.get("busqueda") ?? "";

  return (
    <BuscadorAutocompletado
      buscar={buscarEmpresasAccion}
      name="busqueda"
      placeholder="Buscar por RUC, razón social, nombre comercial…"
      valorInicial={busquedaInicial}
      onSeleccionar={(item) => {
        const p = new URLSearchParams(parametros);
        p.set("busqueda", item.label);
        p.delete("pagina");
        router.replace(`/configuracion/empresas?${p.toString()}`, { scroll: false });
      }}
    />
  );
}
