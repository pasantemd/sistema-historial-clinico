"use client";

import {
  Building2,
  CalendarDays,
  FileText,
  Stethoscope,
  Pill,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Badge } from "@/componentes/ui/badge";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { TarjetaMetrica } from "@/componentes/visualizacion-datos/tarjeta-metrica";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { GraficoBarras } from "./graficos/grafico-barras";
import { GraficoDiagnosticos } from "./graficos/grafico-diagnosticos";
import { GraficoDonut } from "./graficos/grafico-donut";
import type { FiltrosReportes, ReportesData } from "../tipos";
import type { CatalogoOrganizacional } from "@/modulos/trabajadores/tipos";
import { FormularioFiltrosAutomaticos } from "@/componentes/formularios/formulario-filtros-automaticos";
import { etiquetaUnidadInventario } from "@/modulos/inventario/constantes";
import { ExportadorReportesWord } from "./exportador-reportes-word";

const ETIQUETA_ESTADO: Record<string, string> = {
  REGISTRADO: "Registrado",
  BORRADOR: "Borrador",
  ANULADO: "Anulado",
  FINALIZADA: "Finalizada",
  EMITIDA: "Emitida",
  PROGRAMADA: "Programada",
  CONFIRMADA: "Confirmada",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  NO_ASISTIO: "No asistió",
};

const VAR_ESTADO_BADGE: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "info"> = {
  REGISTRADO: "success",
  BORRADOR: "warning",
  ANULADO: "destructive",
  FINALIZADA: "success",
  EMITIDA: "success",
  PROGRAMADA: "info",
  CONFIRMADA: "success",
  ATENDIDA: "success",
  CANCELADA: "destructive",
  NO_ASISTIO: "warning",
};

function FiltroInput({ name, label, icon: Icon, children, valorActual }: { name: string; label: string; icon: React.ElementType; children?: React.ReactNode; valorActual?: string }) {
  return (
    <div className="flex h-12 items-center gap-2 rounded-lg border bg-card px-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {children ?? (
        <input
          name={name}
          type="text"
          defaultValue={valorActual}
          className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
          aria-label={label}
        />
      )}
    </div>
  );
}

export function PaginaReportes({
  filtros,
  data,
  catalogo,
}: {
  filtros: FiltrosReportes;
  data: ReportesData;
  catalogo: CatalogoOrganizacional;
}) {
  const hayFiltros = Boolean(
    filtros.empresaId
    || filtros.departamentoId
    || filtros.periodo === "mensual"
    || filtros.periodo === "personalizado",
  );
  const etiquetaPeriodo = filtros.periodo === "mensual"
    ? "Mes"
    : filtros.periodo === "personalizado"
      ? "Rango personalizado"
      : "Semana";
  const medicamentosGrafico = data.medicamentosEntregados
    .slice(0, 10)
    .map((medicamento) => ({
      label: medicamento.nombre,
      valor: medicamento.cantidadTotal,
      unidad: etiquetaUnidadInventario(medicamento.unidad).toLowerCase(),
    }));

  return (
    <div className="space-y-7">
      <BotonRegresar rutaRespaldo="/inicio" />
      <EncabezadoPagina
        titulo="Reportes"
        descripcion="Consulta todas las secciones por semana, mes o un rango de fechas personalizado."
        acciones={<ExportadorReportesWord filtros={filtros} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaMetrica titulo="Evaluaciones médicas" valor={String(data.resumen.evaluacionesMedicas)} icono={Stethoscope} />
        <TarjetaMetrica titulo="Fichas ocupacionales" valor={String(data.resumen.fichasOcupacionales)} icono={FileText} />
        <TarjetaMetrica titulo="Recetas emitidas" valor={String(data.resumen.recetasEmitidas)} icono={Pill} />
      </section>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <FormularioFiltrosAutomaticos
            className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
            classNameLimpiar="h-12 min-h-0 w-full justify-center md:col-start-2 md:w-auto md:justify-self-end xl:col-auto xl:self-auto"
            claves={["periodo", "fechaReferencia", "fechaDesde", "fechaHasta", "empresaId"]}
            hayFiltros={Boolean(hayFiltros)}
            textoLimpiar="Limpiar fechas"
            varianteLimpiar="outline"
          >
            <FiltroInput name="periodo" label="Período" icon={CalendarDays}>
              <select
                name="periodo"
                defaultValue={filtros.periodo ?? "semanal"}
                className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none focus:ring-0"
                aria-label="Período del reporte"
                onChange={(evento) => {
                  const formulario = evento.currentTarget.form;
                  if (!formulario) return;
                  const nombres = evento.currentTarget.value === "personalizado"
                    ? ["fechaReferencia"]
                    : ["fechaDesde", "fechaHasta"];
                  for (const nombre of nombres) {
                    const control = formulario.elements.namedItem(nombre);
                    if (control instanceof HTMLInputElement) control.value = "";
                  }
                }}
              >
                <option value="semanal">Por semana</option>
                <option value="mensual">Por mes</option>
                <option value="personalizado">Rango personalizado</option>
              </select>
            </FiltroInput>
            {filtros.periodo === "personalizado" ? (
              <>
                <FiltroInput name="fechaDesde" label="Desde" icon={CalendarDays}>
                  <input
                    name="fechaDesde"
                    type="date"
                    defaultValue={filtros.fechaDesde}
                    max={filtros.fechaHasta}
                    className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                    aria-label="Fecha inicial del reporte"
                  />
                </FiltroInput>
                <FiltroInput name="fechaHasta" label="Hasta" icon={CalendarDays}>
                  <input
                    name="fechaHasta"
                    type="date"
                    defaultValue={filtros.fechaHasta}
                    min={filtros.fechaDesde}
                    className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                    aria-label="Fecha final del reporte"
                  />
                </FiltroInput>
              </>
            ) : (
              <FiltroInput name="fechaReferencia" label={etiquetaPeriodo} icon={CalendarDays}>
                <input
                  name="fechaReferencia"
                  type={filtros.periodo === "mensual" ? "month" : "date"}
                  defaultValue={filtros.fechaReferencia}
                  className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
                  aria-label={filtros.periodo === "mensual" ? "Mes del reporte" : "Fecha incluida en la semana"}
                />
              </FiltroInput>
            )}
            <FiltroInput name="empresaId" label="Empresa" icon={Building2}>
              <select name="empresaId" defaultValue={filtros.empresaId} className="h-8 w-full min-w-0 border-0 bg-transparent p-0 text-sm text-foreground outline-none focus:ring-0" aria-label="Empresa">
                <option value="">Todas las empresas</option>
                {catalogo.empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>)}
              </select>
            </FiltroInput>
          </FormularioFiltrosAutomaticos>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card data-grafico-reporte="registros-diarios-dia">
          <CardContent className="p-4">
            <GraficoBarras
              data={data.registrosDiariosPorDia}
              titulo="Registros diarios por día"
            />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="registros-empresa">
          <CardContent className="p-4">
            <GraficoBarras data={data.documentosPorEmpresa} titulo="Registros por empresa" />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="actividad-departamento">
          <CardContent className="p-4">
            <GraficoBarras
              data={data.trabajadoresPorDepartamento}
              titulo="Actividad por departamento"
              horizontal
              height={Math.max(220, data.trabajadoresPorDepartamento.length * 40)}
              anchoEjeY={140}
              nombreSerie="Trabajadores"
              mostrarValores
            />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="fichas-tipo">
          <CardContent className="p-4">
            <GraficoDonut data={data.distribucionFichas} titulo="Fichas por tipo" />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="estado-citas">
          <CardContent className="p-4">
            <GraficoDonut data={data.distribucionEstadoCitas} titulo="Estado de citas" />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="estado-recetas">
          <CardContent className="p-4">
            <GraficoDonut data={data.recetasEstado} titulo="Estado de recetas" />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="fichas-dia">
          <CardContent className="p-4">
            <GraficoBarras
              data={data.fichasPorDia}
              titulo="Fichas ocupacionales por día"
            />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="evaluaciones-dia">
          <CardContent className="p-4">
            <GraficoBarras
              data={data.evaluacionesPorDia}
              titulo="Evaluaciones médicas por día"
            />
          </CardContent>
        </Card>
        <Card data-grafico-reporte="diagnosticos-cie10">
          <CardContent className="p-4">
            <GraficoDiagnosticos
              data={data.diagnosticosFrecuentes}
              titulo="Diagnósticos CIE-10 más frecuentes"
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 xl:col-span-2" data-grafico-reporte="morbilidades">
          <CardContent className="p-4">
            <GraficoBarras
              data={data.morbilidadesFrecuentes}
              titulo="Tipos de morbilidades"
              horizontal
              height={Math.max(240, data.morbilidadesFrecuentes.length * 40)}
              anchoEjeY={150}
              nombreSerie="Registros"
              mostrarValores
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medicamentos entregados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.medicamentosEntregados.length === 0 ? (
            <EstadoVacio
              icono={Pill}
              titulo="Sin medicamentos entregados"
              descripcion="No hay medicamentos entregados para los filtros seleccionados."
            />
          ) : (
            <>
              <div
                className="min-w-0 rounded-lg bg-card p-1"
                data-grafico-reporte="medicamentos-entregados"
              >
                <GraficoBarras
                  data={medicamentosGrafico}
                  horizontal
                  height={Math.max(220, medicamentosGrafico.length * 40)}
                  anchoEjeY={150}
                  nombreSerie="Cantidad entregada"
                  mostrarValores
                />
              </div>
              <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-lg border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left">Medicamento</th>
                      <th className="px-4 py-3 text-right">Cantidad entregada</th>
                      <th className="px-4 py-3 text-left">Unidad</th>
                      <th className="px-4 py-3 text-right">N.º entregas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.medicamentosEntregados.map((medicamento) => (
                      <tr
                        key={`${medicamento.medicamentoId}-${medicamento.unidad}`}
                        className="border-t transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          {medicamento.nombre}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {medicamento.cantidadTotal.toLocaleString("es-EC")}
                        </td>
                        <td className="px-4 py-3">
                          {etiquetaUnidadInventario(medicamento.unidad)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {medicamento.numeroEntregas.toLocaleString("es-EC")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Evaluaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluaciones médicas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.evaluaciones.length === 0 ? (
            <div className="p-6">
              <EstadoVacio icono={Stethoscope} titulo="Sin evaluaciones" descripcion="No hay evaluaciones para el período seleccionado." />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Trabajador</th>
                    <th className="px-4 py-3 text-left">Motivo</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.evaluaciones.map((e, i) => (
                    <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{formatearFecha(e.fecha)}</td>
                      <td className="px-4 py-3 font-medium">{e.trabajador}</td>
                      <td className="px-4 py-3">{e.tipo}</td>
                      <td className="px-4 py-3">{e.empresa}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VAR_ESTADO_BADGE[e.estado] ?? "secondary"}>{ETIQUETA_ESTADO[e.estado] ?? e.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fichas Ocupacionales */}
      <Card>
        <CardHeader>
          <CardTitle>Fichas ocupacionales</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.fichas.length === 0 ? (
            <div className="p-6">
              <EstadoVacio icono={FileText} titulo="Sin fichas" descripcion="No hay fichas ocupacionales para el período seleccionado." />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Trabajador</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fichas.map((f, i) => (
                    <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{formatearFecha(f.fecha)}</td>
                      <td className="px-4 py-3 font-medium">{f.trabajador}</td>
                      <td className="px-4 py-3">{f.tipoEvaluacion}</td>
                      <td className="px-4 py-3">{f.empresa}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VAR_ESTADO_BADGE[f.estado] ?? "secondary"}>{ETIQUETA_ESTADO[f.estado] ?? f.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recetas */}
      <Card>
        <CardHeader>
          <CardTitle>Recetas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recetas.length === 0 ? (
            <div className="p-6">
              <EstadoVacio icono={Pill} titulo="Sin recetas" descripcion="No hay recetas para el período seleccionado." />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Medicamentos</th>
                    <th className="px-4 py-3 text-left">Médico</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recetas.map((r, i) => (
                    <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{formatearFecha(r.fecha)}</td>
                      <td className="px-4 py-3 font-medium">{r.paciente}</td>
                      <td className="px-4 py-3">{r.medicamentos}</td>
                      <td className="px-4 py-3">{r.medico}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VAR_ESTADO_BADGE[r.estado] ?? "secondary"}>{ETIQUETA_ESTADO[r.estado] ?? r.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Citas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.citas.length === 0 ? (
            <div className="p-6">
              <EstadoVacio icono={CalendarClock} titulo="Sin citas" descripcion="No hay citas para el período seleccionado." />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-left">Paciente</th>
                    <th className="px-4 py-3 text-left">Motivo</th>
                    <th className="px-4 py-3 text-left">Profesional</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.citas.map((c, i) => (
                    <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{formatearFecha(c.fecha)}</td>
                      <td className="px-4 py-3 font-medium">{c.paciente}</td>
                      <td className="px-4 py-3">{c.motivo}</td>
                      <td className="px-4 py-3">{c.profesional}</td>
                      <td className="px-4 py-3">
                        <Badge variant={VAR_ESTADO_BADGE[c.estado] ?? "secondary"}>{ETIQUETA_ESTADO[c.estado] ?? c.estado}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad por empresa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.empresas.length === 0 ? (
            <div className="p-6">
              <EstadoVacio icono={Building2} titulo="Sin datos" descripcion="No hay datos de empresas para mostrar." />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Trabajadores registrados</th>
                    <th className="px-4 py-3 text-left">Evaluaciones</th>
                    <th className="px-4 py-3 text-left">Fichas</th>
                    <th className="px-4 py-3 text-left">Citas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.empresas.map((e, i) => (
                    <tr key={i} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{e.empresa}</td>
                      <td className="px-4 py-3">{e.trabajadores}</td>
                      <td className="px-4 py-3">{e.evaluaciones}</td>
                      <td className="px-4 py-3">{e.fichas}</td>
                      <td className="px-4 py-3">{e.citas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
