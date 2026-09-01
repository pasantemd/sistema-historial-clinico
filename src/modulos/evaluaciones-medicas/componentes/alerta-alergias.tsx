import { AlertTriangle } from "lucide-react";
import type { AlergiaDto } from "@/modulos/evaluaciones-medicas/tipos";

export function AlertaAlergias({ alergias }: { alergias: AlergiaDto[] }) {
  if (!alergias.length) return null;
  return <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"><div className="flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden className="size-4"/>Alergias activas</div><ul className="mt-2 list-disc space-y-1 pl-5">{alergias.map(a=><li key={a.id}>Este trabajador tiene alergia {a.severidad.toLowerCase()} a {a.sustancia}.{a.descripcion?` Reacción: ${a.descripcion}`:""}</li>)}</ul></div>;
}
