"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { REGIONES_EXAMEN_FISICO } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function ExamenFisicoRegiones({ register, errors }: PropsTabla) {
  return (
    <Card>
      <CardHeader><CardTitle>F. Examen físico regional</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {REGIONES_EXAMEN_FISICO.map((region) => (
          <div key={region} className="rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="size-4" {...register(`examenFisico.${region}.presente` as const)} />
              {region}
            </label>
            <div className="mt-2">
              <Textarea placeholder="Descripción" {...register(`examenFisico.${region}.descripcion` as const)} />
            </div>
          </div>
        ))}
        <Campo etiqueta="Observaciones del examen físico" error={obtenerError(errors, "observacionesExamenFisico")}>
          <Textarea {...register("observacionesExamenFisico")} />
        </Campo>
      </CardContent>
    </Card>
  );
}
