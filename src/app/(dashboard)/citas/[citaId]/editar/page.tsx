import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { consultarCitaRepositorio, listarProfesionalesRepositorio, listarTrabajadoresCitaRepositorio } from "@/modulos/citas/repositorios/citas.repositorio";
import { FormularioCita } from "@/modulos/citas/componentes/formulario-cita";
import type { EntradaCita } from "@/modulos/citas/tipos";
import type { EstadoCita } from "@/modulos/citas/constantes";

interface Props { params: Promise<{ citaId: string }> }

function duracion(inicio: string, fin: string | null): number {
  const a = inicio.split(":").map(Number);
  const b = fin ? fin.split(":").map(Number) : [a[0], a[1] + 30];
  return Math.max(5, (b[0] * 60 + b[1]) - (a[0] * 60 + a[1]));
}

export default async function Page({ params }: Props) {
  const usuario = await requerirPermiso("cita.editar");
  const { citaId } = await params;
  const cita = await consultarCitaRepositorio(citaId, usuario.id);
  if (!cita) notFound();

  const editable = tienePermiso(usuario, "cita.editar") && (cita.estado === "PROGRAMADA" || cita.estado === "CONFIRMADA");
  if (!editable) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Editar cita" acciones={<BotonRegresar rutaRespaldo={`/citas/${citaId}`} />} />
        <EstadoVacio
          icono={CalendarDays}
          titulo="No editable"
          descripcion="Solo se pueden editar las citas programadas o confirmadas."
          accion={<Link href={`/citas/${citaId}`} className="text-sm underline">Ver cita</Link>}
        />
      </div>
    );
  }

  const [profesionales, trabajadores] = await Promise.all([
    listarProfesionalesRepositorio(usuario.id),
    listarTrabajadoresCitaRepositorio(usuario.id),
  ]);

  const valoresIniciales: EntradaCita = {
    trabajadorId: cita.trabajadorId,
    profesionalId: cita.profesionalId ?? "",
    fecha: cita.fecha.toISOString().slice(0, 10),
    horaInicio: cita.horaInicio,
    duracionMinutos: duracion(cita.horaInicio, cita.horaFin),
    motivo: cita.motivo,
    observaciones: cita.observaciones ?? "",
    recordatorio: cita.recordatorio,
  };

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo="Editar cita"
        descripcion={`${cita.trabajador.nombres} ${cita.trabajador.apellidos}`}
        acciones={<><BotonRegresar rutaRespaldo={`/citas/${citaId}`} /><Link href={`/citas/${citaId}`} className={cn(buttonVariants({ variant: "outline" }))}>Cancelar</Link></>}
      />
      <FormularioCita
        profesionales={profesionales}
        trabajadores={trabajadores}
        valoresIniciales={valoresIniciales}
        citaId={citaId}
        estado={cita.estado as EstadoCita}
        permitirEdicion
      />
    </div>
  );
}
