"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

export function AutocompleteBusquedaEvaluaciones() {
  const router = useRouter();
  const parametros = useSearchParams();
  const busquedaInicial = parametros.get("busqueda") ?? "";

  async function buscar(termino: string) {
    const datos = await buscarTrabajadoresClinicosAccion(termino);
    return datos.map((t) => ({
      id: t.id,
      label: t.nombreCompleto,
      descripcion: `${t.numeroDocumento} · ${t.empresa}`,
    }));
  }

  function aplicarBusqueda(texto: string) {
    const siguientes = new URLSearchParams(parametros);
    if (texto.trim()) siguientes.set("busqueda", texto.trim());
    else siguientes.delete("busqueda");
    siguientes.delete("pagina");
    router.replace(`/evaluaciones-medicas?${siguientes.toString()}`, { scroll: false });
  }

  return (
    <BuscadorAutocompletado
      buscar={buscar}
      name="busqueda"
      placeholder="Trabajador, documento, empresa, diagnóstico…"
      valorInicial={busquedaInicial}
      onSeleccionar={(item) => aplicarBusqueda(item.label)}
    />
  );
}
