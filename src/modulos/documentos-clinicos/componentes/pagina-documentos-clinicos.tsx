import Link from "next/link";
import { FileHeart, Plus } from "lucide-react";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Migas } from "@/componentes/navegacion/migas";
import { PanelFiltros } from "@/componentes/formularios/panel-filtros";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { AutocompleteBusquedaDocumentos } from "./autocomplete-busqueda-documentos";
import { listarDocumentosClinicos } from "@/modulos/documentos-clinicos/consultas/documentos-clinicos.consulta";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";

export async function PaginaDocumentosClinicos({ usuarioId, puedeCrear, filtros }: { usuarioId: string; puedeCrear: boolean; filtros: { trabajador?: string; fecha?: string; estado?: string; pagina?: number } }) {
  const pagina = await listarDocumentosClinicos(usuarioId, filtros);
  return (
    <div className="space-y-8">
      <Migas />
      <BotonRegresar rutaRespaldo="/inicio" />
      <EncabezadoPagina
        titulo="Documentos clínicos"
        descripcion={`${pagina.total} documentos`}
        acciones={puedeCrear ? <Link href="/documentos-clinicos/nuevo" className={cn(buttonVariants())}><Plus aria-hidden /> Nuevo documento</Link> : undefined}
      />
      <FormularioFiltrosAutomaticos
        claves={["trabajador", "fecha", "estado"]}
        hayFiltros={Boolean(filtros.trabajador || filtros.fecha || filtros.estado)}
      >
        <PanelFiltros columnas={4}>
          <AutocompleteBusquedaDocumentos />
          <input
            name="fecha"
            type="date"
            aria-label="Filtrar por fecha de documento"
            defaultValue={filtros.fecha}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          />
          <select
            name="estado"
            aria-label="Filtrar por estado de documento"
            defaultValue={filtros.estado}
            className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
          >
            <option value="">Todos los estados</option>
            <option>BORRADOR</option>
            <option>FINALIZADO</option>
            <option>ANULADO</option>
          </select>
        </PanelFiltros>
      </FormularioFiltrosAutomaticos>
      {pagina.documentos.length === 0 ? (
        <EstadoVacio icono={FileHeart} titulo="Sin documentos clínicos" descripcion="No hay documentos que coincidan con los filtros." />
      ) : (
        <div className="max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b bg-muted/70 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Trabajador</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Profesional</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagina.documentos.map((d) => (
                <tr className="border-b transition-colors hover:bg-muted/30 last:border-0" key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.numeroDocumento}</td>
                  <td className="px-4 py-3">{formatearFecha(d.fecha)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{d.trabajador}</span>
                    <span className="block text-xs text-muted-foreground">{d.documento}</span>
                  </td>
                  <td className="px-4 py-3">{d.empresa}</td>
                  <td className="px-4 py-3">{d.profesional}</td>
                  <td className="px-4 py-3"><BadgeEstado estado={d.estado} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/documentos-clinicos/${d.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
