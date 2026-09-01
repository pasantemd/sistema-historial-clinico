"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaAntecedentesLaborales({ register, control }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "antecedentesLaborales" });
  return (
    <Card>
      <CardHeader><CardTitle>H. Actividad laboral / incidentes / accidentes / enfermedades ocupacionales</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="space-y-2 rounded-lg border p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input placeholder="Centro de trabajo" {...register(`antecedentesLaborales.${indice}.centroTrabajo` as const)} />
              <Input placeholder="Actividades" {...register(`antecedentesLaborales.${indice}.actividades` as const)} />
              <Input placeholder="Tiempo de trabajo" {...register(`antecedentesLaborales.${indice}.tiempo` as const)} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" {...register(`antecedentesLaborales.${indice}.trabajoAnterior` as const)} /> Trabajo anterior</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" {...register(`antecedentesLaborales.${indice}.trabajoActual` as const)} /> Trabajo actual</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" {...register(`antecedentesLaborales.${indice}.incidente` as const)} /> Incidente</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" {...register(`antecedentesLaborales.${indice}.accidente` as const)} /> Accidente</label>
              <label className="flex items-center gap-2"><input type="checkbox" className="size-4" {...register(`antecedentesLaborales.${indice}.enfermedad` as const)} /> Enfermedad profesional</label>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <label className="flex items-center gap-2 text-sm"><input type="radio" value="SI" className="size-4" {...register(`antecedentesLaborales.${indice}.calificadoIess` as const)} /> Calificado IESS: Sí</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" value="NO" className="size-4" {...register(`antecedentesLaborales.${indice}.calificadoIess` as const)} /> No</label>
              <Input placeholder="Fecha aaaa/mm/dd" {...register(`antecedentesLaborales.${indice}.fecha` as const)} />
              <Input placeholder="Especificar" {...register(`antecedentesLaborales.${indice}.especificar` as const)} />
            </div>
            <Input placeholder="Observaciones" {...register(`antecedentesLaborales.${indice}.observaciones` as const)} />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ centroTrabajo: "", actividades: "", trabajoAnterior: false, trabajoActual: false, tiempo: "", incidente: false, accidente: false, enfermedad: false, calificadoIess: null, fecha: "", especificar: "", observaciones: "" })}><Plus aria-hidden /> Agregar antecedente</Button>
      </CardContent>
    </Card>
  );
}
