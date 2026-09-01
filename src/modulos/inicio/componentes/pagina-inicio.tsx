import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FileHeart,
  FileText,
  Pill,
  NotebookPen,
  Plus,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { TarjetaMetrica } from "@/componentes/visualizacion-datos/tarjeta-metrica";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Badge } from "@/componentes/ui/badge";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { consultarResumenInicio } from "@/modulos/inicio/consultas/inicio.consulta";
import { ETIQUETAS_ESTADO_CITA } from "@/modulos/citas/constantes";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

export default async function InicioPage() {
  const usuario = await requerirPermiso("trabajador.ver");
  const resumen = await consultarResumenInicio(usuario.id);
  const metricas = resumen.metricas;

  return (
    <div className="space-y-8">
      <EncabezadoPagina
        titulo="Panel principal"
        descripcion="Resumen operativo del historial clínico ocupacional."
      />

      <section aria-label="Indicadores operativos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaMetrica titulo="Trabajadores activos" valor={String(metricas.trabajadoresActivos)} icono={Users} estado={{ tipo: "enlace", href: "/trabajadores", etiqueta: "Ver todos" }} />
        <TarjetaMetrica titulo="Registros de hoy" valor={String(metricas.registrosHoy)} icono={NotebookPen} estado={{ tipo: "enlace", href: "/registro-diario", etiqueta: "Ver registros" }} />
        <TarjetaMetrica titulo="Evaluaciones" valor={String(metricas.evaluacionesMedicas)} icono={FileHeart} estado={{ tipo: "enlace", href: "/evaluaciones-medicas", etiqueta: "Ver evaluaciones" }} />
        <TarjetaMetrica titulo="Citas de hoy" valor={String(metricas.citasHoy)} icono={CalendarDays} />
        <TarjetaMetrica titulo="Próximas citas" valor={String(metricas.citasProximas)} icono={CalendarClock} estado={{ tipo: "enlace", href: "/citas", etiqueta: "Ver agenda" }} />
        <TarjetaMetrica titulo="Recetas emitidas" valor={String(metricas.recetasEmitidas)} icono={Pill} estado={{ tipo: "enlace", href: "/recetas", etiqueta: "Ver recetas" }} />
        <TarjetaMetrica titulo="Fichas en borrador" valor={String(metricas.fichasBorrador)} icono={FileText} estado={{ tipo: "enlace", href: "/fichas-ocupacionales", etiqueta: "Ver fichas" }} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tienePermiso(usuario, "registro-diario.crear") && <Link href="/registro-diario/nuevo" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Nuevo registro diario</Link>}
            {tienePermiso(usuario, "evaluacion-medica.crear") && <Link href="/evaluaciones-medicas/nueva" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Nueva evaluación</Link>}
            {tienePermiso(usuario, "ficha-ocupacional.crear") && <Link href="/fichas-ocupacionales/nueva" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Nueva ficha</Link>}
            {tienePermiso(usuario, "receta.crear") && <Link href="/recetas/nueva" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Nueva receta</Link>}
            {tienePermiso(usuario, "cita.crear") && <Link href="/citas/nueva" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Nueva cita</Link>}
            {tienePermiso(usuario, "trabajador.crear") && <Link href="/trabajadores/nuevo" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-14 justify-start gap-3 px-4 py-3 text-left hover:border-primary/30 hover:bg-primary/[0.06]")}><Plus className="size-5 shrink-0 text-primary" aria-hidden /> Registrar trabajador</Link>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registros diarios recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {resumen.registrosRecientes.length === 0 ? (
              <EstadoVacio icono={ClipboardList} titulo="Sin registros" descripcion="No hay registros diarios cargados." />
            ) : (
              <ul className="divide-y text-sm">
                {resumen.registrosRecientes.map((registro) => (
                  <li key={registro.id} className="rounded-lg px-2 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/registro-diario/${registro.id}`} className="font-medium hover:underline">{registro.apellidosNombres}</Link>
                        <p className="truncate text-muted-foreground">{registro.empresaNombreHistorico} · {registro.atencionMorbilidad}</p>
                        <p className="text-xs text-muted-foreground">{registro.profesionalNombreHistorico ?? "Sin profesional"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-medium">{formatearFecha(registro.diaAtencion)}</p>
                        <Badge variant={registro.estado === "ANULADO" ? "destructive" : "secondary"}>{registro.estado}</Badge>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximas citas</CardTitle>
            <Link href="/citas/calendario" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Calendario</Link>
          </CardHeader>
          <CardContent>
            {resumen.proximasCitas.length === 0 ? (
              <EstadoVacio icono={CalendarDays} titulo="Sin citas próximas" descripcion="No hay citas programadas para los próximos siete días." />
            ) : (
              <ul className="divide-y text-sm">
                {resumen.proximasCitas.map((cita) => (
                  <li key={cita.id} className="flex items-start justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50">
                    <div>
                      <Link href={`/citas/${cita.id}`} className="font-medium hover:underline">{cita.trabajadorNombre}</Link>
                      <p className="text-muted-foreground">{cita.motivo}</p>
                      <p className="text-xs text-muted-foreground">{cita.profesionalNombre ?? "Sin profesional"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium">{formatearFecha(cita.fecha)} · {cita.horaInicio}</p>
                      <Badge variant={cita.estado === "PROGRAMADA" ? "info" : cita.estado === "CONFIRMADA" ? "success" : "secondary"}>{ETIQUETAS_ESTADO_CITA[cita.estado]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
