"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { BuscadorCie10 } from "@/modulos/catalogo-cie10/componentes/buscador-cie10";
import type { ResultadoCie10 } from "@/modulos/catalogo-cie10/tipos";
import { obtenerError, type PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";
import type { EntradaFicha } from "@/modulos/fichas-ocupacionales/validaciones/ficha.schema";

export function TablaDiagnosticos({ register, control, errors }: PropsTabla) {
  const { setValue, getValues } = useFormContext<EntradaFicha>();
  const { fields, append, remove } = useFieldArray({ control, name: "diagnosticos" });
  const diagnosticos = useWatch({ control, name: "diagnosticos" });
  const idsOcultos = useMemo(
    () => new Set((getValues("diagnosticos") ?? []).map((d) => d.enfermedadId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields.length],
  );

  function seleccionar(resultado: ResultadoCie10) {
    if ((getValues("diagnosticos") ?? []).some(({ enfermedadId }) => enfermedadId === resultado.id)) {
      return;
    }
    append({ enfermedadId: resultado.id, codigo: resultado.codigo, descripcion: resultado.descripcion, pre: true, def: false });
  }

  return (
    <Card>
      <CardHeader><CardTitle>K. Diagnóstico (PRE: presuntivo / DEF: definitivo)</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <BuscadorCie10 onSeleccionar={seleccionar} ocultos={idsOcultos} />

        {fields.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No hay diagnósticos seleccionados.</p>}
        {fields.map((fila, indice) => {
          const diagnostico = diagnosticos?.[indice];
          return (
            <div key={fila.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[7rem_1fr_auto_auto_auto] md:items-center">
              <input type="hidden" {...register(`diagnosticos.${indice}.enfermedadId` as const)} />
              <input type="hidden" {...register(`diagnosticos.${indice}.codigo` as const)} />
              <input type="hidden" {...register(`diagnosticos.${indice}.descripcion` as const)} />
              <span className="font-semibold">{diagnostico?.codigo ?? fila.codigo}</span>
              <span className="text-sm">{diagnostico?.descripcion ?? fila.descripcion}</span>
              <Button
                type="button"
                size="sm"
                variant={diagnostico?.pre ? "default" : "outline"}
                aria-pressed={Boolean(diagnostico?.pre)}
                onClick={() => {
                  setValue(`diagnosticos.${indice}.pre`, true, { shouldDirty: true, shouldValidate: true });
                  setValue(`diagnosticos.${indice}.def`, false, { shouldDirty: true, shouldValidate: true });
                }}
              >PRE</Button>
              <Button
                type="button"
                size="sm"
                variant={diagnostico?.def ? "default" : "outline"}
                aria-pressed={Boolean(diagnostico?.def)}
                onClick={() => {
                  setValue(`diagnosticos.${indice}.pre`, false, { shouldDirty: true, shouldValidate: true });
                  setValue(`diagnosticos.${indice}.def`, true, { shouldDirty: true, shouldValidate: true });
                }}
              >DEF</Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(indice)} aria-label={`Eliminar diagnóstico ${diagnostico?.codigo ?? ""}`}>
                <Trash2 aria-hidden />
              </Button>
              {obtenerError(errors, `diagnosticos.${indice}.def`) && (
                <p className="text-sm text-destructive md:col-span-5">{obtenerError(errors, `diagnosticos.${indice}.def`)}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}