import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { AutocompleteBusquedaEmpresa } from "./autocomplete-busqueda-empresa";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { consultarEmpresasAutorizadas } from "@/modulos/empresas/consultas/empresas.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

interface Props { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function PaginaEmpresas({ searchParams }: Props) {
  const usuario = await requerirPermiso("empresa.ver");
  const params = await searchParams;
  const busqueda = typeof params.busqueda === "string" ? params.busqueda : undefined;
  const empresas = await consultarEmpresasAutorizadas(usuario.id, busqueda);
  return <div className="space-y-8">
    <BotonRegresar rutaRespaldo="/configuracion" />
    <Migas/>
    <EncabezadoPagina titulo="Empresas" descripcion="Todas las empresas activas del sistema."/>
    <FormularioFiltrosAutomaticos
      claves={["busqueda"]}
      hayFiltros={Boolean(busqueda)}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs sm:flex-row"
    >
      <div className="relative flex-1">
        <AutocompleteBusquedaEmpresa />
      </div>
    </FormularioFiltrosAutomaticos>
    {empresas.length
      ? <div className="grid gap-4 lg:grid-cols-2">{empresas.map((empresa)=><Card key={empresa.id} className="transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md"><CardHeader className="border-b bg-primary/[0.035]"><CardTitle>{empresa.razonSocial}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p className="text-muted-foreground">{empresa.nombreComercial||"Sin nombre comercial"}</p><dl className="grid grid-cols-2 gap-3"><div><dt className="text-xs text-muted-foreground">RUC</dt><dd>{empresa.ruc}</dd></div><div><dt className="text-xs text-muted-foreground">Actividad económica</dt><dd>{empresa.actividadEconomicaCodigo||"—"}</dd></div><div><dt className="text-xs text-muted-foreground">Departamentos</dt><dd>{empresa._count.departamentos}</dd></div><div><dt className="text-xs text-muted-foreground">Trabajadores</dt><dd>{empresa._count.trabajadores}</dd></div><div><dt className="text-xs text-muted-foreground">Asignaciones</dt><dd>{empresa._count.asignacionesLaborales}</dd></div></dl></CardContent></Card>)}</div>
      : <EstadoVacio icono={Building2} titulo="Sin resultados" descripcion={busqueda ? "Ninguna empresa coincide con la búsqueda." : "Ejecute el seed inicial."}/>}
  </div>;
}
