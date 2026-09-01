import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FilePlus2,
  Pencil,
  Plus,
} from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button-variants";
import { EnlacePdf } from "@/componentes/documentos/enlace-pdf";
import { Card, CardContent } from "@/componentes/ui/card";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { Badge } from "@/componentes/ui/badge";
import {
  listarCatalogosRegistroDiario,
  listarRegistrosDiarios,
} from "@/modulos/registro-diario/consultas/registro-diario.consulta";
import { AutocompleteBusquedaRegistro } from "@/modulos/registro-diario/componentes/autocomplete-busqueda-registro";
import { CampoFiltro } from "@/modulos/registro-diario/componentes/campo-filtro";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";

import type { FiltrosRegistroDiario } from "@/modulos/registro-diario/tipos";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

interface PermisosRegistroDiario {
  crear: boolean;
  editar: boolean;
  anular: boolean;
  exportar: boolean;
}

function controlFiltroClassName() {
  return "h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0 dark:[color-scheme:dark] dark:[&>option]:bg-popover dark:[&>option]:text-popover-foreground";
}

function TextoTruncado({
  valor,
  className,
}: {
  valor: string | null;
  className?: string;
}) {
  const texto = valor?.trim() || "—";
  return (
    <span title={texto} className={cn("block max-w-full truncate", className)}>
      {texto}
    </span>
  );
}

function FirmaBadge({ confirmada }: { confirmada: boolean }) {
  return (
    <Badge
      variant={confirmada ? "success" : "secondary"}
      className="min-w-12 justify-center"
    >
      {confirmada ? "Sí" : "No"}
    </Badge>
  );
}

function crearUrlPdfDiario(filtros: FiltrosRegistroDiario) {
  const params = new URLSearchParams();
  if (filtros.fecha) params.set("fecha", filtros.fecha);
  if (filtros.empresaId) params.set("empresaId", filtros.empresaId);
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.trabajador) params.set("trabajador", filtros.trabajador);
  return `/api/registro-diario/pdf?${params}`;
}

export async function PaginaRegistroDiario({
  usuarioId,
  filtros,
  permisos,
}: {
  usuarioId: string;
  filtros: FiltrosRegistroDiario;
  permisos: PermisosRegistroDiario;
}) {
  const [pagina, catalogos] = await Promise.all([
    listarRegistrosDiarios(usuarioId, filtros),
    listarCatalogosRegistroDiario(usuarioId),
  ]);
  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) parametros.set(clave, String(valor));
  });
  const urlPagina = (valor: number) => {
    const params = new URLSearchParams(parametros);
    params.set("pagina", String(valor));
    return `/registro-diario?${params}`;
  };
  const puedeGenerarPdfDiario = Boolean(permisos.exportar && filtros.fecha && pagina.total > 0);
  const mensajePdfDiario = !permisos.exportar
    ? "No tiene permiso para exportar el registro diario"
    : !filtros.fecha
    ? "Seleccione una fecha para imprimir los registros del día"
    : pagina.total === 0
      ? "No existen registros para la fecha seleccionada"
      : null;

  return (
    <div className="space-y-7">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <div className="rounded-2xl border bg-card/95 p-5 shadow-xs dark:bg-card/80 sm:p-6">
        <EncabezadoPagina
          titulo="Registro diario de pacientes"
          descripcion={`${pagina.total} registros encontrados`}
          acciones={
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {puedeGenerarPdfDiario ? (
                  <EnlacePdf
                    ruta={crearUrlPdfDiario(filtros)}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full whitespace-nowrap sm:w-auto",
                    )}
                  >
                    <FileText className="size-4" aria-hidden /> Ver / Imprimir PDF del día
                  </EnlacePdf>
                ) : (
                  <span
                    aria-disabled="true"
                    title={mensajePdfDiario ?? undefined}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full cursor-not-allowed whitespace-nowrap opacity-60 sm:w-auto",
                    )}
                  >
                    <FileText className="size-4" aria-hidden /> Ver / Imprimir PDF del día
                  </span>
                )}
                {permisos.crear ? (
                  <Link
                    href="/registro-diario/nuevo"
                    className={cn(buttonVariants(), "w-full whitespace-nowrap sm:w-auto")}
                  >
                    <Plus aria-hidden /> Nuevo registro
                  </Link>
                ) : undefined}
              </div>
              {mensajePdfDiario && (
                <p className="max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-right">
                  {mensajePdfDiario}
                </p>
              )}
            </div>
          }
        />
      </div>

      <Card className="relative z-20 overflow-visible shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <FormularioFiltrosAutomaticos
            className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4"
            classNameLimpiar="mt-1 h-11 w-full md:col-span-2 md:w-auto md:justify-self-end xl:col-span-4"
            claves={["trabajador", "fecha", "empresaId", "estado"]}
            hayFiltros={Boolean(filtros.trabajador || filtros.fecha || filtros.empresaId || filtros.estado)}
            textoLimpiar="Limpiar filtros"
            varianteLimpiar="outline"
          >
            <AutocompleteBusquedaRegistro />
            <CampoFiltro etiqueta="Fecha" icono={CalendarDays}>
              <input
                name="fecha"
                type="date"
                defaultValue={filtros.fecha}
                className={controlFiltroClassName()}
                aria-label="Fecha"
              />
            </CampoFiltro>
            <CampoFiltro etiqueta="Empresa" icono={Building2}>
              <select
                name="empresaId"
                defaultValue={filtros.empresaId}
                className={controlFiltroClassName()}
                aria-label="Empresa"
              >
                <option value="">Todas las empresas</option>
                {catalogos.empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razonSocial}
                  </option>
                ))}
              </select>
            </CampoFiltro>
            <CampoFiltro etiqueta="Estado" icono={ClipboardList}>
              <select
                name="estado"
                defaultValue={filtros.estado}
                className={controlFiltroClassName()}
                aria-label="Estado"
              >
                <option value="">Todos los estados</option>
                <option>BORRADOR</option>
                <option>REGISTRADO</option>
                <option>ANULADO</option>
              </select>
            </CampoFiltro>
          </FormularioFiltrosAutomaticos>
        </CardContent>
      </Card>

      {pagina.registros.length === 0 ? (
        <EstadoVacio
          icono={FilePlus2}
          titulo="Sin registros"
          descripcion="No hay registros diarios que coincidan con los filtros."
          accion={
            permisos.crear ? (
              <Link
                href="/registro-diario/nuevo"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <Plus aria-hidden /> Nuevo registro
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-xs dark:bg-card/85">
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[1360px] table-fixed text-sm">
              <thead className="border-b bg-muted/70 text-left">
                <tr>
                  <th className="w-32 px-4 py-3">Número</th>
                  <th className="w-64 px-4 py-3">Apellidos y nombres</th>
                  <th className="w-32 px-4 py-3">Cédula</th>
                  <th className="w-40 px-4 py-3">Fecha de nacimiento</th>
                  <th className="w-36 px-4 py-3">Día de atención</th>
                  <th className="w-64 px-4 py-3">Atención morbilidad</th>
                  <th className="w-52 px-4 py-3">Medicación</th>
                  <th className="w-52 px-4 py-3">Procedimiento</th>
                  <th className="w-24 px-4 py-3 text-center">Firma</th>
                  <th className="w-32 px-4 py-3">Estado</th>
                  <th className="sticky right-0 z-10 w-36 bg-muted px-4 py-3 text-right shadow-[-12px_0_20px_-20px_rgba(15,23,42,0.65)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagina.registros.map((registro) => {
                  const estaAnulado = registro.estado === "ANULADO";
                  return (
                    <tr
                      key={registro.id}
                      className="border-b align-middle transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <TextoTruncado valor={registro.numeroRegistro} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              estaAnulado ? "bg-destructive" : "bg-primary",
                            )}
                            aria-hidden
                          />
                          <TextoTruncado
                            valor={registro.nombreCompleto}
                            className="font-medium"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <TextoTruncado valor={registro.numeroDocumento} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatearFecha(registro.fechaNacimiento)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatearFecha(registro.fechaAtencion)}
                      </td>
                      <td className="px-4 py-3">
                        <TextoTruncado valor={registro.atencionMorbilidad} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <TextoTruncado valor={registro.medicacion} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <TextoTruncado valor={registro.procedimiento} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <FirmaBadge confirmada={registro.firmaConfirmada} />
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstado estado={registro.estado} />
                      </td>
                      <td className="sticky right-0 z-10 bg-card px-4 py-3 shadow-[-12px_0_20px_-20px_rgba(15,23,42,0.65)] dark:bg-card">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/registro-diario/${registro.id}`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-8",
                            )}
                          >
                            Ver
                          </Link>
                          {permisos.editar && !estaAnulado && (
                            <Link
                              href={`/registro-diario/${registro.id}/editar`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                                "h-8",
                              )}
                            >
                              <Pencil className="size-3.5" aria-hidden /> Editar
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border bg-card/80 px-4 py-3 text-sm text-muted-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <span>
          Página <b className="text-foreground">{pagina.pagina}</b> de{" "}
          <b className="text-foreground">{pagina.totalPaginas}</b>
        </span>
        <div className="flex gap-2">
          {pagina.pagina > 1 && (
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href={urlPagina(pagina.pagina - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </Link>
          )}
          {pagina.pagina < pagina.totalPaginas && (
            <Link
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              href={urlPagina(pagina.pagina + 1)}
            >
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
