import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import { Textarea } from "@/componentes/ui/textarea";

import { Campo, CampoGrupo } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { TIPOS_EVALUACION } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";

export function SeccionBMotivoConsulta({ register, errors, watch }: PropsSeccion) {
  const tipo = watch("tipoEvaluacion");
  return (
    <Card>
      <CardHeader><CardTitle>B. Motivo de consulta</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <CampoGrupo etiqueta="Tipo de evaluación" error={obtenerError(errors, "tipoEvaluacion")}>
          <div className="flex flex-wrap gap-4">
            {TIPOS_EVALUACION.map((item) => (
              <label key={item.valor} className="flex items-center gap-2 text-sm">
                <input type="radio" value={item.valor} className="size-4" {...register("tipoEvaluacion")} />
                {item.etiqueta}
              </label>
            ))}
          </div>
        </CampoGrupo>
        <Campo etiqueta="Puesto de trabajo (CIUO)" error={obtenerError(errors, "puestoTrabajoCIUO")}><Input {...register("puestoTrabajoCIUO")} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Fecha de atención" error={obtenerError(errors, "fechaAtencion")}><Input type="date" {...register("fechaAtencion")} /></Campo>
          <Campo etiqueta="Fecha de ingreso al trabajo" error={obtenerError(errors, "fechaIngresoTrabajo")}><Input type="date" {...register("fechaIngresoTrabajo")} /></Campo>
          <Campo etiqueta="Fecha de reintegro" error={obtenerError(errors, "fechaReintegro")}>
            <Input type="date" {...register("fechaReintegro")} disabled={tipo !== "REINGRESO"} />
          </Campo>
          <Campo etiqueta="Fecha de salida / último día" error={obtenerError(errors, "fechaSalida")}>
            <Input type="date" {...register("fechaSalida")} disabled={tipo !== "RETIRO"} />
          </Campo>
        </div>
        <Campo etiqueta="Observación" error={obtenerError(errors, "observacionMotivo")}>
          <Textarea {...register("observacionMotivo")} />
        </Campo>
      </CardContent>
    </Card>
  );
}
