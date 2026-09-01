"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { BuscadorAutocompletado } from "@/componentes/formularios/buscador-autocompletado";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { Input } from "@/componentes/ui/input";
import { ESTADOS_RECETA } from "@/modulos/recetas/constantes";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

const selector = "min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20";

export function FiltrosRecetas() {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const numero = parametros.get("numero") ?? "";
  const trabajador = parametros.get("trabajador") ?? "";
  const documento = parametros.get("documento") ?? "";
  const fecha = parametros.get("fecha") ?? "";
  const empresa = parametros.get("empresa") ?? "";
  const profesional = parametros.get("profesional") ?? "";
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
    router.replace(`${pathname}?${siguientes.toString()}`, { scroll: false });
  }

  const hayFiltros = [numero, trabajador, documento, fecha, empresa, profesional, estado].some(Boolean);

  return (
    <FormularioFiltrosAutomaticos
      claves={["numero", "trabajador", "documento", "fecha", "empresa", "profesional", "estado"]}
      hayFiltros={hayFiltros}
      className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="grid gap-1 text-sm font-medium">
        Número
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="numero" defaultValue={numero} className="min-h-11 pl-9" placeholder="R2026…" />
        </div>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Trabajador
        <BuscadorAutocompletado
          buscar={buscarTrabajadores}
          name="trabajador"
          placeholder="Nombre"
          valorInicial={trabajador}
          onSeleccionar={(item) => seleccionarTrabajador(item.label)}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Documento
        <Input name="documento" defaultValue={documento} placeholder="Cédula" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Fecha
        <Input name="fecha" type="date" defaultValue={fecha} />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Empresa
        <Input name="empresa" defaultValue={empresa} placeholder="Razón social" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Médico
        <Input name="profesional" defaultValue={profesional} placeholder="Nombre" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Estado
        <select name="estado" className={selector} defaultValue={estado}>
          <option value="">Todos</option>
          {ESTADOS_RECETA.map((item) => (
            <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
          ))}
        </select>
      </label>
    </FormularioFiltrosAutomaticos>
  );
}
