"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { CampoFiltro } from "./campo-filtro";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

export function AutocompleteBusquedaRegistro() {
  const router = useRouter();
  const parametros = useSearchParams();
  const busquedaInicial = parametros.get("trabajador") ?? "";

  async function buscar(termino: string) {
    const datos = await buscarTrabajadoresClinicosAccion(termino);
    return datos.map((t) => ({
      id: t.id,
      label: t.nombreCompleto,
      descripcion: `${t.numeroDocumento} · ${t.empresa}`,
    }));
  }

  return (
    <CampoFiltro etiqueta="Trabajador" icono={Search}>
      <BuscadorAutocompletado
        buscar={buscar}
        name="trabajador"
        placeholder="Nombre o cédula..."
        valorInicial={busquedaInicial}
        onSeleccionar={(item) => {
          const siguientes = new URLSearchParams(parametros);
          siguientes.set("trabajador", item.label);
          siguientes.delete("pagina");
          router.replace(`/registro-diario?${siguientes.toString()}`, { scroll: false });
        }}
      />
    </CampoFiltro>
  );
}
