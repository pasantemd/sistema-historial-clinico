"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

export function AutocompleteBusquedaDocumentos() {
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
    <BuscadorAutocompletado
      buscar={buscar}
      name="trabajador"
      placeholder="Trabajador, cédula o número"
      valorInicial={busquedaInicial}
      onSeleccionar={(item) => {
        const siguientes = new URLSearchParams(parametros);
        siguientes.set("trabajador", item.label);
        siguientes.delete("pagina");
        router.replace(`/documentos-clinicos?${siguientes.toString()}`, { scroll: false });
      }}
    />
  );
}
