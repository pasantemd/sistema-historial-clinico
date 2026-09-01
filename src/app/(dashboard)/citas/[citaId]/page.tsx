import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { buttonVariants } from "@/componentes/ui/button-variants";
import { cn } from "@/utilidades/clases";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { requerirPermiso, tienePermiso } from "@/servicios/autenticacion/requerir-permiso";
import { consultarCitaRepositorio } from "@/modulos/citas/repositorios/citas.repositorio";
import { AccionesCita } from "@/modulos/citas/componentes/acciones-cita";
import type { EstadoCita } from "@/modulos/citas/constantes";

interface Props { params: Promise<{ citaId: string }> }

export default async function Page({ params }: Props) {
  const usuario = await requerirPermiso("cita.ver");
  const { citaId } = await params;
  const cita = await consultarCitaRepositorio(citaId, usuario.id);
  if (!cita) notFound();

  const puedeEditar = tienePermiso(usuario, "cita.editar");
  const puedeAtender = tienePermiso(usuario, "cita.atender");
  const puedeCancelar = tienePermiso(usuario, "cita.cancelar");

  const nombreTrabajador = `${cita.trabajador.nombres} ${cita.trabajador.apellidos}`;

  return (
    <div className="space-y-6">
      <Migas />
      <EncabezadoPagina
        titulo={`Cita · ${formatearFecha(cita.fecha)}`}
        descripcion={`${nombreTrabajador} · ${cita.horaInicio}${cita.horaFin ? `–${cita.horaFin}` : ""}`}
        acciones={
          <div className="flex items-center gap-2">
            <BotonRegresar rutaRespaldo="/citas" />
            <AccionesCita
              citaId={cita.id}
              trabajadorId={cita.trabajadorId}
              estado={cita.estado as EstadoCita}
              puedeEditar={puedeEditar}
              puedeAtender={puedeAtender}
              puedeCancelar={puedeCancelar}
            />
            {cita.estado === "ATENDIDA" && puedeAtender && <Link href={`/evaluaciones-medicas/nueva?trabajadorId=${cita.trabajadorId}`} className={cn(buttonVariants())}><Plus aria-hidden /> Crear evaluación médica</Link>}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
          <BadgeEstado estado={cita.estado} />
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Trabajador</p>
          <p className="font-medium">{nombreTrabajador}</p>
          <p className="text-sm text-muted-foreground">Doc: {cita.trabajador.numeroDocumento}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Profesional</p>
          <p className="font-medium">{cita.profesional ? `${cita.profesional.nombres} ${cita.profesional.apellidos}` : "Sin asignar"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresa / Departamento</p>
          <p className="font-medium">{cita.empresa?.razonSocial ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{cita.departamento?.nombre ?? "—"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha y hora</p>
          <p className="font-medium">{formatearFecha(cita.fecha)}</p>
          <p className="text-sm text-muted-foreground">{cita.horaInicio}{cita.horaFin ? ` – ${cita.horaFin}` : ""}</p>
          {cita.recordatorio && <p className="text-sm text-emerald-700">Con recordatorio</p>}
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Motivo</p>
          <p className="font-medium">{cita.motivo}</p>
        </div>
        {cita.observaciones && (
          <div className="rounded-lg border p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Observaciones</p>
            <p className="whitespace-pre-wrap text-sm">{cita.observaciones}</p>
          </div>
        )}
        {cita.estado === "CANCELADA" && cita.motivoCancelacion && (
          <div className="rounded-lg border border-destructive bg-destructive-soft p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-destructive-foreground">Motivo de cancelación</p>
            <p className="text-sm text-destructive-foreground">{cita.motivoCancelacion}</p>
          </div>
        )}
      </div>

      <Link href={`/trabajadores/${cita.trabajadorId}`} className={cn(buttonVariants({ variant: "link" }))}>
        Ver perfil del trabajador
      </Link>
    </div>
  );
}
