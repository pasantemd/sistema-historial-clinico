"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaRecomendaciones({ register, control }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "recomendaciones" });
  return (
    <Card>
      <CardHeader><CardTitle>M. Recomendaciones y/o tratamiento</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="flex gap-2">
            <Input placeholder={`Recomendación ${indice + 1}`} {...register(`recomendaciones.${indice}.descripcion` as const)} />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ descripcion: "" })}><Plus aria-hidden /> Agregar recomendación</Button>
      </CardContent>
    </Card>
  );
}
