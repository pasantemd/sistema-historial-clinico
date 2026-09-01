import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { listarCitasRepositorio } from "@/modulos/citas/repositorios/citas.repositorio";
import { CalendarioCitas } from "@/modulos/citas/componentes/calendario-citas";
import type { CitaMedicaDto } from "@/modulos/citas/tipos";
import { FiltrosCitas } from "@/modulos/citas/componentes/filtros-citas";
import { ESTADOS_CITA, type EstadoCita } from "@/modulos/citas/constantes";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const fmtMes = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()).padStart(2, "0")}`;
const FORMATEADOR_MES_ANIO = new Intl.DateTimeFormat("es-EC", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function inicioFinMes(anio: number, mes: number) {
  const desde = new Date(Date.UTC(anio, mes, 1));
  const hasta = new Date(Date.UTC(anio, mes + 1, 0));
  return {
    desde: desde.toISOString().slice(0, 10),
    hasta: hasta.toISOString().slice(0, 10),
  };
}

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("cita.ver");
  const puedeCrear = tienePermiso(usuario, "cita.crear");
  const parametros = await searchParams;
  const mesParam = typeof parametros.mes === "string" ? parametros.mes : "";
  const vista = typeof parametros.vista === "string" ? parametros.vista : "mes";
  const estado = typeof parametros.estado === "string" && ESTADOS_CITA.includes(parametros.estado as EstadoCita) ? parametros.estado : undefined;
  const profesional = typeof parametros.profesional === "string" ? parametros.profesional : undefined;
  const empresa = typeof parametros.empresa === "string" ? parametros.empresa : undefined;

  const ahora = new Date();
  const [anio, mes] = mesParam ? mesParam.split("-").map(Number) : [ahora.getUTCFullYear(), ahora.getUTCMonth()];
  const { desde, hasta } = inicioFinMes(anio, mes);

  const citas = (await listarCitasRepositorio(usuario.id, { fechaDesde: desde, fechaHasta: hasta, estado, profesional, empresa })) as CitaMedicaDto[];

  const mesAnterior = new Date(Date.UTC(anio, mes - 1, 1));
  const mesSiguiente = new Date(Date.UTC(anio, mes + 1, 1));
  const nombreMes = FORMATEADOR_MES_ANIO.format(
    new Date(Date.UTC(anio, mes, 1)),
  );

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Calendario de citas"
        descripcion="Vista de las citas programadas."
        acciones={
          <div className="flex gap-2">
            <BotonRegresar rutaRespaldo="/citas" />
            {puedeCrear && <Link href="/citas/nueva" className={cn(buttonVariants())}>
              <Plus aria-hidden /> Nueva cita
            </Link>}
            <Link href="/citas" className={cn(buttonVariants({ variant: "outline" }))}>
              Lista
            </Link>
          </div>
        }
      />

      <FiltrosCitas basePath="/citas/calendario" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/citas/calendario?mes=${fmtMes(mesAnterior)}&vista=${vista}`} className={cn(buttonVariants({ variant: "outline", size: "icon" }))} aria-label="Mes anterior">
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-40 text-center font-medium capitalize">{nombreMes}</span>
          <Link href={`/citas/calendario?mes=${fmtMes(mesSiguiente)}&vista=${vista}`} className={cn(buttonVariants({ variant: "outline", size: "icon" }))} aria-label="Mes siguiente">
            <ChevronRight className="size-4" />
          </Link>
        </div>
        <div className="flex gap-2">
          {["dia", "semana", "mes"].map((v) => (
            <Link
              key={v}
              href={`/citas/calendario?mes=${fmtMes(new Date(Date.UTC(anio, mes, 1)))}&vista=${v}`}
              className={cn(buttonVariants({ variant: vista === v ? "default" : "outline" }))}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      <CalendarioCitas citas={citas} anio={anio} mes={mes} vista={vista as "dia" | "semana" | "mes"} />
    </div>
  );
}
