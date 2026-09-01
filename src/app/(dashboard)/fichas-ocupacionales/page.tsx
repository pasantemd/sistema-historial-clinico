import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Migas } from "@/componentes/navegacion/migas";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { CampoFiltroWrapper } from "@/componentes/formularios/panel-filtros";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { AutocompleteBusquedaFichas } from "@/modulos/fichas-ocupacionales/componentes/autocomplete-busqueda-fichas";
import { listarFichasPaginadas } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { TIPOS_EVALUACION } from "@/modulos/fichas-ocupacionales/constantes";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const ESTADOS_FICHA_FILTRO = ["BORRADOR", "FINALIZADA", "ANULADA"] as const;

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("ficha-ocupacional.ver");
  const puedeCrear = tienePermiso(usuario, "ficha-ocupacional.crear");
  const params = await searchParams;
  const t = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const pagina = Math.max(1, Number(t("pagina")) || 1);
  const tamanoPagina = Number(t("tamanoPagina")) || undefined;
  const busqueda = t("busqueda") ?? "";
  const tipoEvaluacion = t("tipoEvaluacion");
  const estado = t("estado");
  const {
    fichas,
    total,
    pagina: pagActual,
    totalPaginas,
  } = await listarFichasPaginadas(
    usuario.id,
    {
      busqueda: busqueda || undefined,
      tipoEvaluacion: tipoEvaluacion || undefined,
      estado: estado || undefined,
    },
    pagina,
    tamanoPagina,
  );

  const paramsURL = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && k !== "pagina") paramsURL.set(k, v);
  }

  const hayFiltros = !!(busqueda || tipoEvaluacion || estado);

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Fichas ocupacionales"
        descripcion="Fichas registradas directamente por trabajador."
        acciones={puedeCrear ? (
          <Link
            href="/fichas-ocupacionales/nueva"
            className={cn(buttonVariants())}
          >
            <Plus aria-hidden /> Nueva ficha
          </Link>
        ) : undefined}
      />
      <FormularioFiltrosAutomaticos
        claves={["busqueda", "tipoEvaluacion", "estado"]}
        hayFiltros={hayFiltros}
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-5"
      >
        <CampoFiltroWrapper spanCompleto className="sm:col-span-2">
          <AutocompleteBusquedaFichas />
        </CampoFiltroWrapper>
        <select
          name="tipoEvaluacion"
          aria-label="Filtrar por tipo de evaluación"
          defaultValue={tipoEvaluacion ?? ""}
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_EVALUACION.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
        <select
          name="estado"
          aria-label="Filtrar por estado de ficha"
          defaultValue={estado ?? ""}
          className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_FICHA_FILTRO.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </FormularioFiltrosAutomaticos>
      {fichas.length === 0 ? (
        <EstadoVacio
          icono={FileText}
          titulo="Sin fichas"
          descripcion="No hay fichas ocupacionales registradas."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/70 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Trabajador</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {fichas.map((ficha) => (
                  <tr
                    key={ficha.id}
                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      {formatearFecha(ficha.fechaAtencion)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {ficha.trabajadorNombre}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ficha.trabajadorDocumento}
                    </td>
                    <td className="px-4 py-3">
                      {ficha.empresaNombreHistorico}
                    </td>
                    <td className="px-4 py-3">{ficha.tipoEvaluacion}</td>
                    <td className="px-4 py-3">
                      <BadgeEstado estado={ficha.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/trabajadores/${ficha.trabajadorId}/fichas/${ficha.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                        )}
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
            etiquetaSingular="ficha"
            etiquetaPlural="fichas"
            tamanoPagina={tamanoPagina}
            rutaBase="/fichas-ocupacionales"
          />
        </div>
      )}
    </div>
  );
}
