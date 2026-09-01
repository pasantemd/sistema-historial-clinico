"use client";

import { useFieldArray } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import type { PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function TablaActividadesExtralaborales({ register, control }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "actividadesExtralaborales" });
  return (
    <Card>
      <CardHeader><CardTitle>I. Actividades extra laborales</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {fields.map((fila, indice) => (
          <div key={fila.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-4">
            <Input placeholder="Tipo de actividad" {...register(`actividadesExtralaborales.${indice}.tipo` as const)} />
            <Input placeholder="Descripción" {...register(`actividadesExtralaborales.${indice}.descripcion` as const)} />
            <Input placeholder="Fecha aaaa/mm/dd" {...register(`actividadesExtralaborales.${indice}.fecha` as const)} />
            <Button type="button" variant="destructive" size="sm" onClick={() => remove(indice)}>Eliminar</Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ tipo: "", descripcion: "", fecha: "" })}><Plus aria-hidden /> Agregar actividad</Button>
      </CardContent>
    </Card>
  );
}
