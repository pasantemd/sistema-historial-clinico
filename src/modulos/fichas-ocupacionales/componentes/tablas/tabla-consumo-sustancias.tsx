"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";

import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaConsumoSustancias({ register, control }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "consumoSustancias" });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Consumo de sustancias</p>
      <div className="space-y-2">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-6">
            <Input placeholder="Sustancia" {...register(`consumoSustancias.${indice}.sustancia` as const)} />
            <Input placeholder="Tiempo consumo (meses)" {...register(`consumoSustancias.${indice}.tiempoConsumo` as const)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register(`consumoSustancias.${indice}.exConsumidor` as const)} /> Ex consumidor</label>
            <Input placeholder="Tiempo abstinencia (meses)" {...register(`consumoSustancias.${indice}.tiempoAbstinencia` as const)} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" {...register(`consumoSustancias.${indice}.noConsume` as const)} /> No consume</label>
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => append({ sustancia: "", tiempoConsumo: "", exConsumidor: false, tiempoAbstinencia: "", noConsume: false })}><Plus aria-hidden /> Agregar sustancia</Button>
    </div>
  );
}
