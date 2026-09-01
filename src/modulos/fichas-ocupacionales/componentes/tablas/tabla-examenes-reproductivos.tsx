"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";

import { CampoError } from "@/componentes/formularios/campo-error";
import { obtenerError, type PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaExamenesReproductivos({ name, titulo, register, control, errors }: PropsTabla & { name: "examenesFemeninos" | "examenesMasculinos"; titulo: string }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{titulo}</p>
      <div className="space-y-2">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Input placeholder="Examen" {...register(`${name}.${indice}.examen` as const)} />
              <CampoError mensaje={obtenerError(errors, `${name}.${indice}.examen`)} />
            </div>
            <Input placeholder="Tiempo (años)" {...register(`${name}.${indice}.tiempo` as const)} />
            <Input placeholder="Resultado" {...register(`${name}.${indice}.resultado` as const)} />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => append({ examen: "", tiempo: "", resultado: "" })}><Plus aria-hidden /> Agregar examen</Button>
    </div>
  );
}
