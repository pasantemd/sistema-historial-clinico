import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { listarProfesionalesRepositorio, listarTrabajadoresCitaRepositorio } from "@/modulos/citas/repositorios/citas.repositorio";
import { FormularioCita } from "@/modulos/citas/componentes/formulario-cita";
import type { EntradaCita } from "@/modulos/citas/tipos";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: Props) {
  const usuario = await requerirPermiso("cita.crear");
  const parametros = await searchParams;
  const trabajadorId =
    typeof parametros.trabajadorId === "string"
      ? parametros.trabajadorId
      : "";
  const [profesionales, trabajadores] = await Promise.all([
    listarProfesionalesRepositorio(usuario.id),
    listarTrabajadoresCitaRepositorio(usuario.id),
  ]);

  if (trabajadores.length === 0) {
    return (
      <div className="space-y-6">
        <Migas />
        <EncabezadoPagina titulo="Nueva cita" acciones={<BotonRegresar rutaRespaldo="/citas" />} />
        <EstadoVacio
          icono={CalendarDays}
          titulo="Sin trabajadores"
          descripcion="Registre al menos un trabajador para programar citas."
          accion={tienePermiso(usuario, "trabajador.crear") ? <Link href="/trabajadores/nuevo" className="inline-flex items-center gap-1.5 text-sm underline"><Plus className="size-4" aria-hidden /> Nuevo trabajador</Link> : undefined}
        />
      </div>
    );
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const valoresIniciales: EntradaCita = {
    trabajadorId,
    profesionalId: "",
    fecha: hoy,
    horaInicio: "08:00",
    duracionMinutos: 30,
    motivo: "",
    observaciones: "",
    recordatorio: false,
  };

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina titulo="Nueva cita" descripcion="Programe una cita para un trabajador." acciones={<BotonRegresar rutaRespaldo="/citas" />} />
      <FormularioCita profesionales={profesionales} trabajadores={trabajadores} valoresIniciales={valoresIniciales} permitirEdicion />
    </div>
  );
}
