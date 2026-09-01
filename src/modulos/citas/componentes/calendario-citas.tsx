"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgeEstado } from "@/componentes/ui/badge-estado";
import type { CitaMedicaDto } from "@/modulos/citas/tipos";

const COLOR_FONDO_CALENDARIO: Record<string, string> = {
  PROGRAMADA: "bg-info/20 text-info-foreground",
  CONFIRMADA: "bg-success/20 text-success-foreground",
  ATENDIDA: "bg-success/20 text-success-foreground",
  CANCELADA: "bg-destructive/20 text-destructive-foreground",
  NO_ASISTIO: "bg-muted text-muted-foreground",
};

interface Props {
  citas: CitaMedicaDto[];
  anio: number;
  mes: number;
  vista: "dia" | "semana" | "mes";
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function clave(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function CalendarioCitas({ citas, anio, mes, vista }: Props) {
  const porFecha = useMemo(() => {
    const mapa = new Map<string, CitaMedicaDto[]>();
    for (const cita of citas) {
      const lista = mapa.get(cita.fecha) ?? [];
      lista.push(cita);
      mapa.set(cita.fecha, lista);
    }
    return mapa;
  }, [citas]);

  const hoy = new Date();
  const esHoy = (a: number, m: number, d: number) =>
    a === hoy.getFullYear() && m === hoy.getMonth() && d === hoy.getDate();

  if (vista === "dia") {
    const dia = porFecha.get(clave(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) ?? [];
    return (
      <div className="rounded-xl border bg-card p-4 shadow-xs">
        <p className="mb-3 font-medium">Citas de hoy</p>
        {dia.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay citas para hoy.</p>
        ) : (
          <ul className="space-y-2">
            {dia
              .slice()
              .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
              .map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/citas/${c.id}`}
                    className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-primary/[0.035]"
                  >
                    <span className="font-medium">{c.horaInicio} · {c.trabajadorNombre}</span>
                    <span>
                      <BadgeEstado estado={c.estado} />
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </div>
    );
  }

  if (vista === "semana") {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - hoy.getDay());
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {dias.map((d) => {
          const lista = porFecha.get(clave(d.getFullYear(), d.getMonth(), d.getDate())) ?? [];
          return (
            <div key={d.toISOString()} className="min-h-32 rounded-xl border bg-card p-2 shadow-xs">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {DIAS[d.getDay()]} {d.getDate()}
              </p>
              <div className="space-y-1">
                {lista
                  .slice()
                  .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                  .map((c) => (
                    <Link
                      key={c.id}
                      href={`/citas/${c.id}`}
                      className={`block rounded px-2 py-1 text-xs ${COLOR_FONDO_CALENDARIO[c.estado] ?? "bg-muted"}`}
                    >
                      {c.horaInicio} {c.trabajadorNombre.split(" ")[0]}
                    </Link>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const primerDia = new Date(Date.UTC(anio, mes, 1));
  const diaInicio = primerDia.getUTCDay();
  const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const celdas: Array<number | null> = [
    ...Array.from({ length: diaInicio }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs uppercase tracking-wide text-muted-foreground">
        {DIAS.map((d) => (
          <div key={d} className="px-2 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {celdas.map((dia, idx) => {
          if (dia === null) return <div key={`v${idx}`} className="min-h-24 border-b border-r bg-muted/20" />;
          const lista = porFecha.get(clave(anio, mes, dia)) ?? [];
          return (
            <div
              key={dia}
              className={`min-h-24 space-y-1 border-b border-r p-1 ${esHoy(anio, mes, dia) ? "bg-primary/10" : ""}`}
            >
              <p className="text-xs font-medium text-muted-foreground">{dia}</p>
              {lista
                .slice()
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/citas/${c.id}`}
                    className={`block truncate rounded px-1.5 py-0.5 text-xs ${COLOR_FONDO_CALENDARIO[c.estado] ?? "bg-muted"}`}
                    title={`${c.horaInicio} · ${c.trabajadorNombre}`}
                  >
                    {c.horaInicio} {c.trabajadorNombre.split(" ")[0]}
                  </Link>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
