import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Input } from "@/componentes/ui/input";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { CampoFiltroWrapper } from "@/componentes/formularios/panel-filtros";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { AutocompleteBusquedaEvaluaciones } from "@/modulos/evaluaciones-medicas/componentes/autocomplete-busqueda-evaluaciones";
import { cn } from "@/utilidades/clases";
import { listarEvaluacionesPaginadas } from "@/modulos/evaluaciones-medicas/consultas/evaluaciones.consulta";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ESTADOS_EVAL = ["BORRADOR", "FINALIZADA", "ANULADA"] as const;

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("evaluacion-medica.ver");
  const puedeCrear = tienePermiso(usuario, "evaluacion-medica.crear");
  const params = await searchParams;
  const t = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const pagina = Math.max(1, Number(t("pagina")) || 1);
  const tamanoPagina = Number(t("tamanoPagina")) || undefined;
  const busqueda = t("busqueda") ?? "";
  const estado = t("estado");
  const {
    items,
    total,
    pagina: pagActual,
    totalPaginas,
  } = await listarEvaluacionesPaginadas(
    usuario.id,
    {
      busqueda: busqueda || undefined,
      estado:
        estado && ESTADOS_EVAL.includes(estado as never) ? estado : undefined,
      fechaDesde: t("fechaDesde"),
      fechaHasta: t("fechaHasta"),
    },
    pagina,
    tamanoPagina,
  );

  const paramsURL = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && k !== "pagina") paramsURL.set(k, v);
  }

  const hayFiltros = !!(
    busqueda ||
    estado ||
    t("fechaDesde") ||
    t("fechaHasta")
  );

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Evaluaciones médicas"
        descripcion="Borradores, evaluaciones finalizadas y anuladas."
        acciones={puedeCrear ? (
          <Link
            href="/evaluaciones-medicas/nueva"
            className={cn(buttonVariants())}
          >
            <Plus aria-hidden /> Nueva evaluación
          </Link>
        ) : undefined}
      />
      <FormularioFiltrosAutomaticos
        claves={["busqueda", "estado", "fechaDesde"]}
        hayFiltros={hayFiltros}
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5"
      >
        <CampoFiltroWrapper spanCompleto className="sm:col-span-2">
          <AutocompleteBusquedaEvaluaciones />
        </CampoFiltroWrapper>
        <select
          name="estado"
          aria-label="Filtrar por estado de evaluación"
          defaultValue={estado ?? ""}
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_EVAL.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <Input
          name="fechaDesde"
          type="date"
          defaultValue={t("fechaDesde") ?? ""}
          placeholder="Desde"
          className="min-h-11"
        />
      </FormularioFiltrosAutomaticos>
      {items.length === 0 ? (
        <EstadoVacio
          icono={ClipboardList}
          titulo="Sin evaluaciones"
          descripcion="No existen registros para mostrar."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/70 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Trabajador</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{i.trabajador}</span>
                      <span className="block text-xs text-muted-foreground">
                        {i.documento}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {i.empresa}
                      <span className="block text-xs text-muted-foreground">
                        {i.departamento}
                      </span>
                    </td>
                    <td className="px-4 py-3">{i.fechaAtencion ?? "—"}</td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={i.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
                        href={`/evaluaciones-medicas/${i.id}`}
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={pagActual}
            totalPaginas={totalPaginas}
            total={total}
            parametros={paramsURL.toString()}
            parametroPagina="pagina"
            parametroTamanoPagina="tamanoPagina"
            etiquetaSingular="evaluación"
            etiquetaPlural="evaluaciones"
            tamanoPagina={tamanoPagina}
            rutaBase="/evaluaciones-medicas"
          />
        </div>
      )}
    </div>
  );
}
