"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { obtenerError, type PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaResultadosExamenes({ register, control, errors }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "resultadosExamenes" });
  return (
    <Card>
      <CardHeader><CardTitle>J. Resultados de exámenes generales y específicos</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
            <Input placeholder="Nombre del examen" {...register(`resultadosExamenes.${indice}.nombre` as const)} />
            <Input placeholder="Fecha aaaa/mm/dd" {...register(`resultadosExamenes.${indice}.fecha` as const)} />
            <Input placeholder="Resultados" {...register(`resultadosExamenes.${indice}.resultados` as const)} />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ nombre: "", fecha: "", resultados: "" })}><Plus aria-hidden /> Agregar examen</Button>
        <Campo etiqueta="Observaciones" error={obtenerError(errors, "observacionesResultados")}>
          <Textarea {...register("observacionesResultados")} />
        </Campo>
      </CardContent>
    </Card>
  );
}
