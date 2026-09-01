"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { Input } from "@/componentes/ui/input";
import { ESTADOS_CITA, ETIQUETAS_ESTADO_CITA } from "@/modulos/citas/constantes";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

const selector = "min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";

export function FiltrosCitas({ basePath = "/citas" }: { basePath?: string }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const trabajador = parametros.get("trabajador") ?? "";
  const profesional = parametros.get("profesional") ?? "";
  const empresa = parametros.get("empresa") ?? "";
  const fechaDesde = parametros.get("fechaDesde") ?? "";
  const fechaHasta = parametros.get("fechaHasta") ?? "";
  const estado = parametros.get("estado") ?? "";

  async function buscarTrabajadores(termino: string) {
    const datos = await buscarTrabajadoresClinicosAccion(termino);
    return datos.map((item) => ({
      id: item.id,
      label: item.nombreCompleto,
      descripcion: `${item.numeroDocumento} · ${item.empresa}`,
    }));
  }

  function seleccionarTrabajador(nombre: string) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set("trabajador", nombre);
    siguientes.delete("pagina");
    router.replace(`${basePath}?${siguientes.toString()}`, { scroll: false });
  }

  const hayFiltros = [trabajador, profesional, empresa, fechaDesde, fechaHasta, estado].some(Boolean);

  return (
    <FormularioFiltrosAutomaticos
      claves={["trabajador", "profesional", "empresa", "fechaDesde", "fechaHasta", "estado"]}
      hayFiltros={hayFiltros}
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
    >
      <label className="grid gap-1 text-sm font-medium">
        Trabajador
        <BuscadorAutocompletado
          buscar={buscarTrabajadores}
          name="trabajador"
          placeholder="Nombre o documento"
          valorInicial={trabajador}
          onSeleccionar={(item) => seleccionarTrabajador(item.label)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Profesional
        <Input name="profesional" defaultValue={profesional} placeholder="Nombre del profesional" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Empresa
        <Input name="empresa" defaultValue={empresa} placeholder="Razón social" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Desde
        <Input name="fechaDesde" type="date" defaultValue={fechaDesde} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Hasta
        <Input name="fechaHasta" type="date" defaultValue={fechaHasta} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Estado
        <select name="estado" className={selector} defaultValue={estado}>
          <option value="">Todos</option>
          {ESTADOS_CITA.map((item) => (
            <option key={item} value={item}>{ETIQUETAS_ESTADO_CITA[item]}</option>
          ))}
        </select>
      </label>
    </FormularioFiltrosAutomaticos>
  );
}
