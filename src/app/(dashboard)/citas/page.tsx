import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { listarCitasPaginadas } from "@/modulos/citas/repositorios/citas.repositorio";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { Paginacion } from "@/componentes/visualizacion-datos/paginacion";
import { FiltrosCitas } from "@/modulos/citas/componentes/filtros-citas";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("cita.ver");
  const puedeCrear = tienePermiso(usuario, "cita.crear");
  const parametros = await searchParams;
  const texto = (clave: string) => {
    const valor = parametros[clave];
    return typeof valor === "string" ? valor : undefined;
  };

  const pagina = Math.max(1, Number(texto("pagina")) || 1);
  const tamanoPagina = Number(texto("tamanoPagina")) || undefined;
  const estado = texto("estado");
  const fechaDesde = texto("fechaDesde");
  const fechaHasta = texto("fechaHasta");

  const { citas, total, pagina: pagActual, totalPaginas } = await listarCitasPaginadas(usuario.id, {
    estado: estado || undefined,
    fechaDesde,
    fechaHasta,
    trabajador: texto("trabajador") || undefined,
    profesional: texto("profesional") || undefined,
    empresa: texto("empresa") || undefined,
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
        titulo="Citas médicas"
        descripcion="Agende y gestione las citas de los trabajadores."
        acciones={
          <div className="flex gap-2">
            <Link href="/citas/calendario" className={cn(buttonVariants({ variant: "outline" }))}>
              Calendario
            </Link>
            {puedeCrear && <Link href="/citas/nueva" className={cn(buttonVariants())}>
              <Plus aria-hidden /> Nueva cita
            </Link>}
          </div>
        }
      />

      <FiltrosCitas />

      {citas.length === 0 ? (
        <EstadoVacio
          icono={CalendarDays}
          titulo="Sin citas"
          descripcion="Programe una cita para un trabajador."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Trabajador</th>
                  <th className="px-3 py-2">Profesional</th>
                  <th className="px-3 py-2">Motivo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id} className="border-b transition-colors hover:bg-primary/[0.035]">
                    <td className="px-3 py-2">{formatearFecha(new Date(cita.fecha))}</td>
                    <td className="px-3 py-2 font-medium">{cita.horaInicio}{cita.horaFin ? `–${cita.horaFin}` : ""}</td>
                    <td className="px-3 py-2">{cita.trabajadorNombre}</td>
                    <td className="px-3 py-2">{cita.profesionalNombre ?? "—"}</td>
                    <td className="px-3 py-2">{cita.motivo}</td>
                    <td className="px-3 py-2">
                      <BadgeEstado estado={cita.estado} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/citas/${cita.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Paginacion pagina={pagActual} totalPaginas={totalPaginas} total={total} parametros={paramsURL.toString()} parametroPagina="pagina" parametroTamanoPagina="tamanoPagina" etiquetaSingular="cita" etiquetaPlural="citas" tamanoPagina={tamanoPagina} rutaBase="/citas" />
        </div>
      )}
    </div>
  );
}
