import Link from "next/link";
import { Ban, Pencil, Pill, Plus, Send } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { listarRecetasPaginadas } from "@/modulos/recetas/repositorios/recetas.repositorio";
import { FiltrosRecetas } from "@/modulos/recetas/componentes/filtros-recetas";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { BotonVerImprimirPdf } from "@/componentes/documentos/boton-ver-imprimir-pdf";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("receta.ver");
  const puedeCrear = tienePermiso(usuario, "receta.crear");
  const puedeEditar = tienePermiso(usuario, "receta.editar");
  const puedeEmitir = tienePermiso(usuario, "receta.emitir");
  const puedeAnular = tienePermiso(usuario, "receta.anular");
  const puedeExportar = tienePermiso(usuario, "receta.exportar");
  const parametros = await searchParams;
  const texto = (clave: string) => {
    const valor = parametros[clave];
    return typeof valor === "string" ? valor : undefined;
  };

  const pagina = Math.max(1, Number(texto("pagina")) || 1);
  const tamanoPagina = Number(texto("tamanoPagina")) || undefined;

  const { recetas, total, pagina: pagActual, totalPaginas } = await listarRecetasPaginadas(usuario.id, {
    numero: texto("numero"),
    trabajador: texto("trabajador"),
    documento: texto("documento"),
    fecha: texto("fecha"),
    empresa: texto("empresa"),
    profesional: texto("profesional"),
    estado: texto("estado"),
  }, pagina, tamanoPagina);

  const paramsURL = new URLSearchParams();
  for (const [k, v] of Object.entries(parametros)) {
    if (typeof v === "string" && k !== "pagina") paramsURL.set(k, v);
  }

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Recetas"
        descripcion="Prescripciones médicas emitidas durante las atenciones."
        acciones={puedeCrear ? (
          <Link href="/recetas/nueva" className={cn(buttonVariants())}>
            <Plus aria-hidden /> Nueva receta
          </Link>
        ) : undefined}
      />

      <FiltrosRecetas />

      {recetas.length === 0 ? (
        <EstadoVacio
          icono={Pill}
          titulo="Sin recetas"
          descripcion="Cree una receta desde una atención, evaluación o consulta finalizada."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/70 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Trabajador</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Médico</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recetas.map((receta) => (
                  <tr key={receta.id} className="border-b transition-colors hover:bg-muted/30 last:border-0">
                    <td className="px-4 py-3 font-medium">{receta.numeroReceta}</td>
                    <td className="px-4 py-3">{formatearFecha(receta.fechaEmision)}</td>
                    <td className="px-4 py-3">{receta.trabajadorNombreHistorico}</td>
                    <td className="px-4 py-3">{receta.empresaNombreHistorico}</td>
                    <td className="px-4 py-3">{receta.profesionalNombreHistorico}</td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={receta.estado} />
                    </td>
                    <td className="flex flex-wrap justify-end gap-1 px-4 py-3 text-right">
                      <Link href={`/recetas/${receta.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        Ver
                      </Link>
                      {puedeEditar && receta.estado === "BORRADOR" && <Link aria-label="Editar borrador" title="Editar borrador" href={`/recetas/${receta.id}/editar`} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}><Pencil aria-hidden /></Link>}
                      {puedeEmitir && receta.estado === "BORRADOR" && <Link aria-label="Emitir receta" title="Emitir receta" href={`/recetas/${receta.id}`} className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}><Send aria-hidden /></Link>}
                      {puedeExportar && (receta.estado === "BORRADOR" || receta.estado === "EMITIDA") && <BotonVerImprimirPdf href={`/api/recetas/${receta.id}/pdf`} />}
                      {puedeAnular && receta.estado !== "ANULADA" && <Link aria-label="Anular receta" title="Anular receta" href={`/recetas/${receta.id}`} className={cn(buttonVariants({ variant: "destructive", size: "icon-sm" }))}><Ban aria-hidden /></Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagActual} totalPaginas={totalPaginas} total={total} parametros={paramsURL.toString()} parametroPagina="pagina" parametroTamanoPagina="tamanoPagina" etiquetaSingular="receta" etiquetaPlural="recetas" tamanoPagina={tamanoPagina} rutaBase="/recetas" />
        </div>
      )}
    </div>
  );
}
