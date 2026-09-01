"use client";

import Link from "next/link";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";
import { SeccionColapsable } from "@/componentes/seccion-colapsable";
import { AcordeonItem } from "@/componentes/elemento-acordeon";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import { clasificarCitas } from "@/modulos/trabajadores/utilidades/clasificar-citas";
import type { CitaMedicaDto } from "@/modulos/citas/tipos";

interface Props {
  citas: CitaMedicaDto[];
}

export function PanelCitasColapsable({ citas }: Props) {
  if (citas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay citas registradas para este trabajador.
      </p>
    );
  }

  const { proximas, historial } = clasificarCitas(citas);

  return (
    <div className="space-y-4">
      <SeccionColapsable
        titulo="Próximas citas"
        cantidad={proximas.length}
        defaultOpen={proximas.length > 0}
      >
        {proximas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay próximas citas programadas.
          </p>
        ) : (
          <div className="space-y-2">
            {proximas.map((cita) => (
              <CitaAcordeon key={cita.id} cita={cita} />
            ))}
          </div>
        )}
      </SeccionColapsable>

      <SeccionColapsable
        titulo="Historial de citas"
        cantidad={historial.length}
        defaultOpen={historial.length <= 3}
      >
        {historial.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay citas anteriores registradas.
          </p>
        ) : (
          <div className="space-y-2">
            {historial.map((cita) => (
              <CitaAcordeon key={cita.id} cita={cita} />
            ))}
          </div>
        )}
      </SeccionColapsable>
    </div>
  );
}

function CitaAcordeon({ cita }: { cita: CitaMedicaDto }) {
  return (
    <AcordeonItem
      resumen={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href={`/citas/${cita.id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {formatearFecha(cita.fecha)} · {cita.horaInicio}
          </Link>
          <span className="text-muted-foreground text-sm">
            · {cita.profesionalNombre ?? "Sin profesional"}
          </span>
          <BadgeEstado estado={cita.estado} />
        </div>
      }
    >
      {cita.motivo && (
        <p className="mb-2 text-sm">
          <span className="font-medium">Motivo:</span> {cita.motivo}
        </p>
      )}
      {cita.empresaNombre && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Empresa:</span>{" "}
          {cita.empresaNombre}
          {cita.departamentoNombre ? ` · ${cita.departamentoNombre}` : ""}
        </p>
      )}
      {cita.observaciones && (
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Observaciones:</span>{" "}
          {cita.observaciones}
        </p>
      )}
      {cita.recordatorio && (
        <p className="mt-1 text-xs text-muted-foreground">
          Recordatorio activo
        </p>
      )}
      <div className="mt-3">
        <Link
          href={`/citas/${cita.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver detalles de la cita
        </Link>
      </div>
    </AcordeonItem>
  );
}
