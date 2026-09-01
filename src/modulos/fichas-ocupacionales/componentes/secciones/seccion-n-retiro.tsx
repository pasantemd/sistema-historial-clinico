import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo, CampoGrupo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { SI_NO } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionNRetiro({ register, errors, watch }: PropsSeccion) {
  const tipo = watch("tipoEvaluacion");
  const soloRetiro = tipo === "RETIRO";
  return (
    <Card>
      <CardHeader><CardTitle>N. Retiro (evaluación)</CardTitle></CardHeader>
      <CardContent className={`space-y-4 ${soloRetiro ? "" : "opacity-60"}`}>
        <CampoGrupo etiqueta="¿Se realiza la evaluación?" error={obtenerError(errors, "retiroRealizaEvaluacion")}>
          <div className="flex gap-4">
            {SI_NO.map((item) => (
              <label key={item.valor} className="flex items-center gap-2 text-sm">
                <input type="radio" value={item.valor} className="size-4" {...register("retiroRealizaEvaluacion")} disabled={!soloRetiro} />
                {item.etiqueta}
              </label>
            ))}
          </div>
        </CampoGrupo>
        <CampoGrupo etiqueta="¿La condición de salud está relacionada con el trabajo?" error={obtenerError(errors, "retiroRelacionadoTrabajo")}>
          <div className="flex gap-4">
            {SI_NO.map((item) => (
              <label key={item.valor} className="flex items-center gap-2 text-sm">
                <input type="radio" value={item.valor} className="size-4" {...register("retiroRelacionadoTrabajo")} disabled={!soloRetiro} />
                {item.etiqueta}
              </label>
            ))}
          </div>
        </CampoGrupo>
        <Campo etiqueta="Observación" error={obtenerError(errors, "retiroObservacion")}>
          <Textarea {...register("retiroObservacion")} disabled={!soloRetiro} />
        </Campo>
      </CardContent>
    </Card>
  );
}
