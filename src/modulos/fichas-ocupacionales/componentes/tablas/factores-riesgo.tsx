"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";

import {
  GRUPOS_RIESGO_SEGURIDAD,
  RIESGOS_BIOLOGICO,
  RIESGOS_ERGONOMICO,
  RIESGOS_FISICO,
  RIESGOS_PSICOSOCIAL,
  RIESGOS_QUIMICO,
} from "@/modulos/fichas-ocupacionales/constantes";
import { Campo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { obtenerError, type PropsTabla } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

type Categoria = "fisico" | "seguridad" | "quimico" | "biologico" | "ergonomico" | "psicosocial";

interface OpcionRiesgo {
  factor: string;
  subcategoria?: string;
}

const opcionesSimples = (factores: readonly string[]): OpcionRiesgo[] =>
  factores.map((factor) => ({ factor }));

const CATEGORIAS: Array<{ clave: Categoria; etiqueta: string; opciones: OpcionRiesgo[] }> = [
  { clave: "fisico", etiqueta: "Físico", opciones: opcionesSimples(RIESGOS_FISICO) },
  {
    clave: "seguridad",
    etiqueta: "De seguridad",
    opciones: GRUPOS_RIESGO_SEGURIDAD.flatMap((grupo) =>
      grupo.riesgos.map((factor) => ({ factor, subcategoria: grupo.subcategoria })),
    ),
  },
  { clave: "quimico", etiqueta: "Químico", opciones: opcionesSimples(RIESGOS_QUIMICO) },
  { clave: "biologico", etiqueta: "Biológico", opciones: opcionesSimples(RIESGOS_BIOLOGICO) },
  { clave: "ergonomico", etiqueta: "Ergonómico", opciones: opcionesSimples(RIESGOS_ERGONOMICO) },
  { clave: "psicosocial", etiqueta: "Psicosocial", opciones: opcionesSimples(RIESGOS_PSICOSOCIAL) },
];

export function FactoresRiesgo({ register, control, errors }: PropsTabla) {
  const { fields, append, remove } = useFieldArray({ control, name: "actividadesRiesgo" });
  const factoresHistoricos = useWatch({ control, name: "factoresRiesgo" });
  const actividades = useWatch({ control, name: "actividadesRiesgo" });
  const existenFactoresHistoricos = Object.values(factoresHistoricos ?? {}).some(
    (factores) => Array.isArray(factores) && factores.length > 0,
  );

  function agregarActividad() {
    append({
      descripcion: "",
      factores: {
        fisico: [],
        seguridad: [],
        quimico: [],
        biologico: [],
        ergonomico: [],
        psicosocial: [],
      },
      otros: {},
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle>G. Factores de riesgo del trabajo actual</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Actividades importantes dentro de la jornada laboral</p>
            <p className="text-xs text-muted-foreground">Marque los factores que corresponden a cada actividad de forma independiente.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={agregarActividad}>
            <Plus aria-hidden /> Agregar actividad
          </Button>
        </div>

        {existenFactoresHistoricos && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm" role="status">
            Esta ficha conserva factores históricos sin asociación individual. Asígnelos a cada actividad antes de finalizarla.
          </p>
        )}

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Agregue una actividad para seleccionar sus factores de riesgo.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="sticky left-0 z-10 w-64 min-w-64 border-b border-r bg-muted p-3 text-left align-bottom">
                    Factor de riesgo
                  </th>
                  {fields.map((fila, indice) => (
                    <th key={fila.id} className="w-56 min-w-56 border-b border-r p-2 align-top last:border-r-0">
                      <div className="flex items-start gap-2">
                        <Input
                          aria-label={`Descripción de la actividad ${indice + 1}`}
                          placeholder={`Actividad ${indice + 1}`}
                          {...register(`actividadesRiesgo.${indice}.descripcion` as const)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Eliminar actividad ${indice + 1}`}
                          onClick={() => remove(indice)}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                      {obtenerError(errors, `actividadesRiesgo.${indice}.descripcion`) && (
                        <p className="mt-1 text-left text-xs text-destructive">
                          {obtenerError(errors, `actividadesRiesgo.${indice}.descripcion`)}
                        </p>
                      )}
                      {obtenerError(errors, `actividadesRiesgo.${indice}.factores`) && (
                        <p className="mt-1 text-left text-xs text-destructive">
                          {obtenerError(errors, `actividadesRiesgo.${indice}.factores`)}
                        </p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CATEGORIAS.flatMap((categoria) => [
                  <tr key={`${categoria.clave}-titulo`} className="bg-primary/5">
                    <th
                      className="sticky left-0 z-10 border-b border-r bg-primary/5 px-3 py-2 text-left font-semibold text-primary"
                      colSpan={1}
                    >
                      {categoria.etiqueta}
                    </th>
                    {fields.map((fila) => <td key={fila.id} className="border-b border-r last:border-r-0" />)}
                  </tr>,
                  ...categoria.opciones.map((opcion) => (
                    <tr key={`${categoria.clave}-${opcion.factor}`} className="hover:bg-muted/30">
                      <th className="sticky left-0 z-10 border-b border-r bg-background px-3 py-2 text-left font-normal">
                        {opcion.subcategoria && (
                          <span className="mr-2 inline-flex rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {opcion.subcategoria}
                          </span>
                        )}
                        {opcion.factor}
                      </th>
                      {fields.map((fila, indice) => (
                        <td key={fila.id} className="border-b border-r p-2 text-center last:border-r-0">
                          <div className="flex flex-col items-center gap-2">
                            <input
                              type="checkbox"
                              className="size-5 accent-primary"
                              aria-label={`${opcion.factor} en actividad ${indice + 1}`}
                              value={opcion.factor}
                              {...register(`actividadesRiesgo.${indice}.factores.${categoria.clave}` as const)}
                            />
                            {opcion.factor === "Otros" && actividades?.[indice]?.factores?.[categoria.clave]?.includes("Otros") && (
                              <div className="w-full text-left">
                                <Input
                                  className="min-w-44"
                                  aria-label={`Especifique otros riesgos ${categoria.etiqueta.toLowerCase()} de la actividad ${indice + 1}`}
                                  placeholder="Especifique"
                                  {...register(`actividadesRiesgo.${indice}.otros.${categoria.clave}` as const)}
                                />
                                {obtenerError(errors, `actividadesRiesgo.${indice}.otros.${categoria.clave}`) && (
                                  <p className="mt-1 text-xs text-destructive">
                                    {obtenerError(errors, `actividadesRiesgo.${indice}.otros.${categoria.clave}`)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        )}

        <Campo etiqueta="Medidas preventivas" error={obtenerError(errors, "medidasPreventivas")}>
          <Textarea {...register("medidasPreventivas")} />
        </Campo>
      </CardContent>
    </Card>
  );
}
